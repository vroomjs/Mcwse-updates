import NoiseGeneratorOctaves from "./noise/NoiseGeneratorOctaves.js";
import Chunk from "../Chunk.js";
import Primer from "./Primer.js";
import {BlockRegistry} from "../block/BlockRegistry.js";
import BigTreeGenerator from "./structure/BigTreeGenerator.js";
import Generator from "./Generator.js";
import WorldGenMinable from "./structure/WorldGenMinable.js";

export default class WorldGeneratorV2 extends Generator {

    constructor(world, seed) {
        super(world, seed);

        this.noiseGen1 = new NoiseGeneratorOctaves(this.random, 16);
        this.noiseGen2 = new NoiseGeneratorOctaves(this.random, 16);
        this.noiseGen3 = new NoiseGeneratorOctaves(this.random, 8);
        this.noiseGen4 = new NoiseGeneratorOctaves(this.random, 4);
        this.noiseGen5 = new NoiseGeneratorOctaves(this.random, 4);
        this.mobSpawnerNoise = new NoiseGeneratorOctaves(this.random, 5);
    }

    newChunk(world, chunkX, chunkZ) {
        let seedHash = Math.imul(chunkX, 341873128712) ^ Math.imul(chunkZ, 132897987541) ^ Number(this.seed);
        this.random.setSeed(seedHash);

        let chunk = new Chunk(world, chunkX, chunkZ);
        let primer = new Primer(chunk);

        this.generateInChunk(chunkX, chunkZ, primer);
        chunk.isDirty = false;

        return chunk;
    }

    generateInChunk(chunkX, chunkZ, primer) {
        const STONE = BlockRegistry.STONE.getId();
        const WATER = BlockRegistry.WATER.getId();

        // 1. Generate Base Terrain Shape
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let noiseField = [];
                for (let k = 0; k < 33; k++) {
                    noiseField[k] = [];
                    let worldX = (chunkX << 2) + i;
                    let worldZ = (chunkZ << 2) + j;
                    noiseField[k][0] = this.initializeNoiseField(worldX, k, worldZ);
                    noiseField[k][1] = this.initializeNoiseField(worldX, k, worldZ + 1);
                    noiseField[k][2] = this.initializeNoiseField(worldX + 1, k, worldZ);
                    noiseField[k][3] = this.initializeNoiseField(worldX + 1, k, worldZ + 1);
                }

                for (let k = 0; k < 32; k++) {
                    let v000 = noiseField[k][0], v001 = noiseField[k][1], v100 = noiseField[k][2], v101 = noiseField[k][3];
                    let v010 = noiseField[k + 1][0], v011 = noiseField[k + 1][1], v110 = noiseField[k + 1][2], v111 = noiseField[k + 1][3];

                    for (let y = 0; y < 4; y++) {
                        let dy = y / 4.0;
                        let v0y0 = v000 + (v010 - v000) * dy;
                        let v0y1 = v001 + (v011 - v001) * dy;
                        let v1y0 = v100 + (v110 - v100) * dy;
                        let v1y1 = v101 + (v111 - v101) * dy;

                        for (let x = 0; x < 4; x++) {
                            let dx = x / 4.0;
                            let vxy0 = v0y0 + (v1y0 - v0y0) * dx;
                            let vxy1 = v0y1 + (v1y1 - v0y1) * dx;

                            for (let z = 0; z < 4; z++) {
                                let dz = z / 4.0;
                                let density = vxy0 + (vxy1 - vxy0) * dz;

                                let absY = (k << 2) + y;
                                let typeId = 0;
                                if (absY < 64) typeId = WATER;
                                if (density > 0.0) typeId = STONE;

                                primer.set((i << 2) + x, absY, (j << 2) + z, typeId);
                            }
                        }
                    }
                }
            }
        }

        // 2. Naturalize Surface
        const GRASS = BlockRegistry.GRASS.getId();
        const DIRT = BlockRegistry.DIRT.getId();
        const SAND = BlockRegistry.SAND.getId();
        const GRAVEL = BlockRegistry.GRAVEL.getId();

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                let wx = (chunkX << 4) + x;
                let wz = (chunkZ << 4) + z;

                let sandPatch = this.noiseGen4.perlin(wx * 0.03125, wz * 0.03125) + this.random.nextDouble() * 0.2 > 0.0;
                let gravelPatch = this.noiseGen4.perlin(wz * 0.03125, wx * 0.03125, 0.03125) + this.random.nextDouble() * 0.2 > 3.0;
                let depthNoise = Math.floor(this.noiseGen5.perlin(wx * 0.0625, wz * 0.0625) / 3.0 + 3.0 + this.random.nextDouble() * 0.25);
                
                let currentDepth = -1;
                let topId = GRASS;
                let fillerId = DIRT;

                for (let y = 127; y >= 0; y--) {
                    let id = primer.get(x, y, z);
                    if (id === 0) {
                        currentDepth = -1;
                    } else if (id === STONE) {
                        if (currentDepth === -1) {
                            if (depthNoise <= 0) {
                                topId = 0;
                                fillerId = STONE;
                            } else if (y >= 60 && y <= 65) {
                                topId = GRASS;
                                fillerId = DIRT;
                                if (gravelPatch) { topId = 0; fillerId = GRAVEL; }
                                if (sandPatch) { topId = SAND; fillerId = SAND; }
                            }

                            if (y < 64 && topId === 0) topId = WATER;

                            currentDepth = depthNoise;
                            if (y >= 63) {
                                primer.set(x, y, z, topId);
                            } else {
                                primer.set(x, y, z, fillerId);
                            }
                        } else if (currentDepth > 0) {
                            currentDepth--;
                            primer.set(x, y, z, fillerId);
                        }
                    }
                }
            }
        }
    }

    initializeNoiseField(x, y, z) {
        let heightBias = y * 4.0 - 64.0;
        if (heightBias < 0.0) heightBias *= 3.0;

        let n3 = this.noiseGen3.generateNoiseOctaves(x * 684.412 / 80.0, y * 684.412 / 400.0, z * 684.412 / 80.0)[0] / 2.0;
        let v1, v2;

        if (n3 < -1.0) {
            v1 = this.noiseGen1.generateNoiseOctaves(x * 684.412, y * 984.412, z * 684.412)[0] / 512.0;
            return Math.max(-10.0, Math.min(10.0, v1 - heightBias));
        } else if (n3 > 1.0) {
            v2 = this.noiseGen2.generateNoiseOctaves(x * 684.412, y * 984.412, z * 684.412)[0] / 512.0;
            return Math.max(-10.0, Math.min(10.0, v2 - heightBias));
        } else {
            let v1_ = this.noiseGen1.generateNoiseOctaves(x * 684.412, y * 984.412, z * 684.412)[0] / 512.0 - heightBias;
            let v2_ = this.noiseGen2.generateNoiseOctaves(x * 684.412, y * 984.412, z * 684.412)[0] / 512.0 - heightBias;
            v1_ = Math.max(-10.0, Math.min(10.0, v1_));
            v2_ = Math.max(-10.0, Math.min(10.0, v2_));
            let lerp = (n3 + 1.0) / 2.0;
            return v1_ + (v2_ - v1_) * lerp;
        }
    }

    populateChunk(chunkX, chunkZ) {
        this.random.setSeed(chunkX * 318279123 + chunkZ * 919871212);
        let wx = chunkX << 4;
        let wz = chunkZ << 4;

        // Ores
        const ores = [
            { id: 16, count: 20, max: 128 }, // Coal
            { id: 15, count: 10, max: 64 },  // Iron
            { id: 14, count: 2, max: 32 },   // Gold
            { id: 56, count: 1, max: 16 }    // Diamond (reduced frequency)
        ];

        for (const ore of ores) {
            let gen = new WorldGenMinable(ore.id);
            for (let i = 0; i < ore.count; i++) {
                gen.generate(this.world, this.random, wx + this.random.nextInt(16), this.random.nextInt(ore.max), wz + this.random.nextInt(16));
            }
        }

        // Trees
        let treeCount = Math.floor(this.mobSpawnerNoise.perlin(wx * 0.25, wz * 0.25) * 8.0);
        let treeGen = new BigTreeGenerator(this.world, this.seed);
        for (let i = 0; i < treeCount; i++) {
            let tx = wx + this.random.nextInt(16) + 8;
            let tz = wz + this.random.nextInt(16) + 8;
            treeGen.generateAtBlock(tx, this.world.getHeightAt(tx, tz), tz);
        }
    }
}