import World from "./src/js/net/minecraft/client/world/World.js";
import Generator from "./src/js/net/minecraft/client/world/generator/Generator.js";

import NoiseGeneratorOctaves from "./src/js/net/minecraft/client/world/generator/noise/NoiseGeneratorOctaves.js";
import Chunk from "./src/js/net/minecraft/client/world/Chunk.js";
import Primer from "./src/js/net/minecraft/client/world/generator/Primer.js";
import * as THREE from "three";

export class NetherWorld extends World {
    constructor(minecraft, seed, worldId = null) {
        super(minecraft, seed, worldId, 0);
        this.dimension = -1;
        this.name = "Nether";
        this.generator = new NetherGenerator(this, seed);
        
        // Remove sky light
        this.skylightSubtracted = 15;
    }

    getSkyColor(x, z, partialTicks) {
        // Dark red fog
        return new THREE.Vector3(0.3, 0.05, 0.05);
    }
    
    getFogColor(partialTicks) {
        return new THREE.Vector3(0.3, 0.05, 0.05);
    }
    
    calculateSkylightSubtracted(partialTicks) {
        return 15; // Always dark/subtracted skylight
    }
    
    isSnowBiome(x, z) { return false; }
    
    // Override updateLights to allow ambient light?
    // For now, use standard lighting logic, but sky light is 0.
}

export class NetherGenerator extends Generator {
    constructor(world, seed) {
        super(world, seed);
        
        // 3D Noise Generators for terrain shaping
        this.lperlinNoise1 = new NoiseGeneratorOctaves(this.random, 16);
        this.lperlinNoise2 = new NoiseGeneratorOctaves(this.random, 16);
        this.perlinNoise1 = new NoiseGeneratorOctaves(this.random, 8);
        this.scaleNoise = new NoiseGeneratorOctaves(this.random, 10);
        this.depthNoise = new NoiseGeneratorOctaves(this.random, 16);
        this.soulSandNoise = new NoiseGeneratorOctaves(this.random, 4);
    }
    
    newChunk(world, chunkX, chunkZ) {
        this.random.setSeed(chunkX * 0x4f9939f508 + chunkZ * 0x1ef1565bd5);
        let chunk = new Chunk(world, chunkX, chunkZ);
        let primer = new Primer(chunk);
        
        this.generateTerrain(chunkX, chunkZ, primer);
        this.naturalize(chunkX, chunkZ, primer);
        
        // Init lighting
        chunk.generateSkylightMap();
        chunk.generateBlockLightMap();
        
        return chunk;
    }

    generateTerrain(chunkX, chunkZ, primer) {
        // Sample 3D noise density
        // 4x32x4 samples interpolated to 16x128x16
        const noiseData = this.generateNoise(chunkX * 4, 0, chunkZ * 4, 5, 33, 5);
        
        const NETHERRACK = 87;
        const BEDROCK = 7;
        const LAVA = 10;
        const SEA_LEVEL = 31;

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                for (let k = 0; k < 32; k++) {
                    // Trilinear interpolation of density
                    const d1 = noiseData[((i + 0) * 5 + j + 0) * 33 + k + 0];
                    const d2 = noiseData[((i + 0) * 5 + j + 1) * 33 + k + 0];
                    const d3 = noiseData[((i + 1) * 5 + j + 0) * 33 + k + 0];
                    const d4 = noiseData[((i + 1) * 5 + j + 1) * 33 + k + 0];
                    const d5 = noiseData[((i + 0) * 5 + j + 0) * 33 + k + 1];
                    const d6 = noiseData[((i + 0) * 5 + j + 1) * 33 + k + 1];
                    const d7 = noiseData[((i + 1) * 5 + j + 0) * 33 + k + 1];
                    const d8 = noiseData[((i + 1) * 5 + j + 1) * 33 + k + 1];

                    for (let y = 0; y < 4; y++) {
                        let dy = y / 4.0;
                        let d1_2 = d1 + (d5 - d1) * dy;
                        let d2_6 = d2 + (d6 - d2) * dy;
                        let d3_7 = d3 + (d7 - d3) * dy;
                        let d4_8 = d4 + (d8 - d4) * dy;

                        for (let x = 0; x < 4; x++) {
                            let dx = x / 4.0;
                            let val1 = d1_2 + (d3_7 - d1_2) * dx;
                            let val2 = d2_6 + (d4_8 - d2_6) * dx;

                            for (let z = 0; z < 4; z++) {
                                let dz = z / 4.0;
                                let val = val1 + (val2 - val1) * dz;

                                let absX = x + i * 4;
                                let absY = y + k * 4;
                                let absZ = z + j * 4;
                                
                                let blockId = 0; // Air
                                
                                // Solid terrain logic
                                if (val > 0.0) {
                                    blockId = NETHERRACK;
                                } else if (absY <= SEA_LEVEL) {
                                    blockId = LAVA;
                                }
                                
                                // Bedrock floor and ceiling
                                if (absY === 0 || absY === 127) {
                                    blockId = BEDROCK;
                                }

                                primer.set(absX, absY, absZ, blockId);
                            }
                        }
                    }
                }
            }
        }
    }

    naturalize(chunkX, chunkZ, primer) {
        let soulSandNoise = this.soulSandNoise.generateNoiseOctaves(
            chunkX * 16, chunkZ * 16, 0.0,
            16, 16, 1,
            0.1, 0.1, 1.0
        );

        const NETHERRACK = 87;
        const SOUL_SAND = 88;
        const LAVA = 10;
        const SEA_LEVEL = 31;

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                // Find surface in the shore range
                for (let y = SEA_LEVEL + 5; y >= SEA_LEVEL - 1; y--) {
                    if (primer.get(x, y, z) === NETHERRACK) {
                        // Check if we should place soul sand (patch noise OR bordering lava)
                        let isPatch = soulSandNoise[x * 16 + z] > 0.15;
                        let isBorderingLava = false;

                        // Local adjacency check for lava to create "border" effect
                        for (let dx = -1; dx <= 1; dx++) {
                            for (let dz = -1; dz <= 1; dz++) {
                                let nx = x + dx;
                                let nz = z + dz;
                                if (nx >= 0 && nx < 16 && nz >= 0 && nz < 16) {
                                    if (primer.get(nx, y, nz) === LAVA || primer.get(nx, y - 1, nz) === LAVA) {
                                        isBorderingLava = true;
                                        break;
                                    }
                                }
                            }
                            if (isBorderingLava) break;
                        }

                        if (isPatch || isBorderingLava) {
                            // Replace surface and one block below
                            primer.set(x, y, z, SOUL_SAND);
                            if (y > 0) primer.set(x, y - 1, z, SOUL_SAND);
                        }
                        break;
                    }
                }
            }
        }
    }

    generateNoise(x, y, z, sizeX, sizeY, sizeZ) {
        let noise = new Array(sizeX * sizeY * sizeZ).fill(0);
        
        let noiseScaleX = 684.412;
        let noiseScaleY = 2053.236;
        let noiseScaleZ = 684.412;
        
        // Base terrain noise
        let noise1 = this.lperlinNoise1.generateNoiseOctaves(x, y, z, sizeX, sizeY, sizeZ, noiseScaleX, noiseScaleY, noiseScaleZ);
        let noise2 = this.lperlinNoise2.generateNoiseOctaves(x, y, z, sizeX, sizeY, sizeZ, noiseScaleX, noiseScaleY, noiseScaleZ);
        let noise3 = this.perlinNoise1.generateNoiseOctaves(x, y, z, sizeX, sizeY, sizeZ, noiseScaleX / 80, noiseScaleY / 60, noiseScaleZ / 80);
        
        // Thickness/Depth noise
        // let scale = this.scaleNoise.generateNoiseOctaves(x, y, z, sizeX, 1, sizeZ, 1.0, 0.0, 1.0);
        // let depth = this.depthNoise.generateNoiseOctaves(x, y, z, sizeX, 1, sizeZ, 100.0, 0.0, 100.0);
        
        let index = 0;
        for (let i = 0; i < sizeX; i++) {
            for (let j = 0; j < sizeZ; j++) {
                for (let k = 0; k < sizeY; k++) {
                    let d1 = noise1[index] / 512.0;
                    let d2 = noise2[index] / 512.0;
                    let d3 = (noise3[index] / 10.0 + 1.0) / 2.0;
                    
                    let dens = 0;
                    if (d3 < 0.0) dens = d1;
                    else if (d3 > 1.0) dens = d2;
                    else dens = d1 + (d2 - d1) * d3;
                    
                    dens -= 8.0;
                    
                    // Ceiling bias (makes top solid)
                    let kRev = 32 - k; // Height from top
                    if (k > sizeY - 4) {
                        let t = (k - (sizeY - 4)) / 3.0;
                        dens = dens * (1.0 - t) + -10.0 * t;
                    }
                    
                    noise[index] = dens;
                    index++;
                }
            }
        }
        return noise;
    }
    
    populateChunk(chunkX, chunkZ) {
        // Glowstone Clusters & Random Ores/Fire
        const chunk = this.world.getChunkAt(chunkX, chunkZ);
        if (!chunk) return;
        
        const NETHERRACK = 87;
        const SOUL_SAND = 88;
        const GLOWSTONE = 89;
        const QUARTZ = 153;
        const FIRE = 51;
        
        // 1. Glowstone clusters on ceiling
        for (let i = 0; i < 35; i++) {
            let x = this.random.nextInt(16);
            let z = this.random.nextInt(16);
            let y = this.random.nextInt(120) + 4;
            
            if (chunk.getBlockAt(x, y, z) === 0 && chunk.getBlockAt(x, y + 1, z) === NETHERRACK) {
                this.generateGlowstoneCluster(chunk, x, y, z, GLOWSTONE);
                
                // 30% chance for a glowstone "stalactite" hanging down from cluster
                if (this.random.nextFloat() < 0.3) {
                    let len = this.random.nextInt(4) + 2;
                    for (let dy = 0; dy < len; dy++) {
                        if (y - dy > 32 && chunk.getBlockAt(x, y - dy, z) === 0) {
                            chunk.setBlockAt(x, y - dy, z, GLOWSTONE);
                        }
                    }
                }
            }
        }
        
        // 2. Quartz veins and Fire clusters
        for (let i = 0; i < 150; i++) {
            let x = this.random.nextInt(16);
            let z = this.random.nextInt(16);
            let y = this.random.nextInt(120) + 4;
            
            let id = chunk.getBlockAt(x, y, z);
            
            // Quartz veins
            if (id === NETHERRACK) {
                if (this.random.nextFloat() < 0.05) {
                    chunk.setBlockAt(x, y, z, QUARTZ);
                }
            }
            
            // Fire (Spawning on surface of Netherrack or Soul Sand)
            if (id === 0) {
                let belowId = chunk.getBlockAt(x, y - 1, z);
                if (belowId === NETHERRACK || belowId === SOUL_SAND) {
                    // Random small chance for a fire patch (increased frequency)
                    if (this.random.nextFloat() < 0.16) {
                        this.generateFireCluster(chunk, x, y, z, FIRE);
                    }
                }
            }
        }
    }

    generateFireCluster(chunk, x, y, z, id) {
        chunk.setBlockAt(x, y, z, id);
        for (let i = 0; i < 8; i++) {
            let dx = x + this.random.nextInt(5) - 2;
            let dz = z + this.random.nextInt(5) - 2;
            let dy = y + this.random.nextInt(3) - 1;
            
            if (dx >= 0 && dx < 16 && dz >= 0 && dz < 16 && dy > 0 && dy < 127) {
                let targetId = chunk.getBlockAt(dx, dy, dz);
                let belowId = chunk.getBlockAt(dx, dy - 1, dz);
                if (targetId === 0 && (belowId === BlockRegistry.NETHERRACK.getId() || belowId === BlockRegistry.SOUL_SAND.getId())) {
                    chunk.setBlockAt(dx, dy, dz, id);
                }
            }
        }
    }
    
    generateGlowstoneCluster(chunk, x, y, z, id) {
        chunk.setBlockAt(x, y, z, id);
        for (let i = 0; i < 45; i++) {
            let dx = x + this.random.nextInt(5) - 2;
            let dy = y + this.random.nextInt(3) - 1;
            let dz = z + this.random.nextInt(3) - 1;
            
            if (dx >= 0 && dx < 16 && dz >= 0 && dz < 16 && dy > 0 && dy < 128) {
                if (chunk.getBlockAt(dx, dy, dz) === 0) {
                    // Check neighbors for support
                    let neighbors = 0;
                    if (chunk.getBlockAt(dx+1, dy, dz) === id) neighbors++;
                    if (chunk.getBlockAt(dx-1, dy, dz) === id) neighbors++;
                    if (chunk.getBlockAt(dx, dy+1, dz) === id) neighbors++;
                    if (chunk.getBlockAt(dx, dy-1, dz) === id) neighbors++;
                    if (chunk.getBlockAt(dx, dy, dz+1) === id) neighbors++;
                    if (chunk.getBlockAt(dx, dy, dz-1) === id) neighbors++;
                    
                    if (neighbors > 0) {
                        chunk.setBlockAt(dx, dy, dz, id);
                    }
                }
            }
        }
    }
}

