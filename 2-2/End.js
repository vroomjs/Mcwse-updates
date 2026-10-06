import World from "./src/js/net/minecraft/client/world/World.js";
import Generator from "./src/js/net/minecraft/client/world/generator/Generator.js";

import NoiseGeneratorOctaves from "./src/js/net/minecraft/client/world/generator/noise/NoiseGeneratorOctaves.js";
import Chunk from "./src/js/net/minecraft/client/world/Chunk.js";
import Primer from "./src/js/net/minecraft/client/world/generator/Primer.js";
import * as THREE from "three";

export class EndWorld extends World {
    constructor(minecraft, seed, worldId = null) {
        super(minecraft, seed, worldId, 0);
        this.dimension = 1;
        this.name = "The End";
        this.generator = new EndGenerator(this, seed);
        
        // The End has a constant dark sky
        this.skylightSubtracted = 15;
    }

    getSkyColor(x, z, partialTicks) {
        // Dark, slightly purple-black void
        return new THREE.Vector3(0.08, 0.0, 0.08);
    }
    
    getFogColor(partialTicks) {
        return new THREE.Vector3(0.05, 0.0, 0.05);
    }
    
    calculateSkylightSubtracted(partialTicks) {
        return 15; 
    }
    
    isSnowBiome(x, z) { return false; }

    getLightBrightness(x, y, z) {
        let level = this.getTotalLightAt(x, y, z);
        // The End is naturally slightly brighter than the Nether void
        // Light level 9 is 9/15 = 0.6
        const minBrightness = 0.6;
        return Math.max(level / 15, minBrightness);
    }
}

export class EndGenerator extends Generator {
    constructor(world, seed) {
        super(world, seed);
        
        // 3D Noise for the floating island
        this.islandNoise = new NoiseGeneratorOctaves(this.random, 6);
    }
    
    newChunk(world, chunkX, chunkZ) {
        this.random.setSeed(chunkX * 0x4f9939f508 + chunkZ * 0x1ef1565bd5);
        let chunk = new Chunk(world, chunkX, chunkZ);
        let primer = new Primer(chunk);
        
        this.generateIsland(chunkX, chunkZ, primer);
        
        // Init lighting
        chunk.generateSkylightMap();
        chunk.generateBlockLightMap();
        
        return chunk;
    }

    generateIsland(chunkX, chunkZ, primer) {
        const END_STONE = 121;
        const OBSIDIAN = 49;
        const BEDROCK = 7;
        const PORTAL = 123; // END_BLOCK ID
        const TORCH = 50;
        
        const orbitRadius = 45;
        const pillarCount = 10;

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                let absX = (chunkX << 4) + x;
                let absZ = (chunkZ << 4) + z;
                let dist = Math.sqrt(absX * absX + absZ * absZ);
                
                // --- 1. Floating Island ---
                // Reduced noise amplitude to keep the edge consistent
                let noise = this.islandNoise.perlin(absX * 0.06, absZ * 0.06) * 3;
                // Base radius set to 50 to barely extend past the pillars (at 45 + 3 width)
                let radius = 50 + noise;
                
                if (dist < radius) {
                    let t = (1.0 - (dist / radius));
                    // Smooth depth falloff starting from the central bedrock area
                    let thickness = Math.floor(t * 38 + this.random.nextInt(3));
                    for (let dy = -thickness; dy <= 0; dy++) {
                        primer.set(x, 64 + dy, z, END_STONE);
                    }
                }

                // --- 2. Central Portal (Instant Loading) ---
                if (Math.abs(absX) <= 2 && Math.abs(absZ) <= 2) {
                    let d = Math.abs(absX) + Math.abs(absZ);
                    if (d <= 2) {
                        primer.set(x, 64, z, BEDROCK);
                        if (Math.abs(absX) <= 1 && Math.abs(absZ) <= 1) {
                            primer.set(x, 65, z, PORTAL);
                        }
                    }
                    if (absX === 0 && absZ === 0) {
                        for (let h = 0; h < 4; h++) primer.set(x, 65 + h, z, BEDROCK);
                    }
                }

                // --- 3. Obsidian Pillars (Instant Loading) ---
                for (let i = 0; i < pillarCount; i++) {
                    let angle = (i / pillarCount) * Math.PI * 2;
                    let px = Math.floor(Math.cos(angle) * orbitRadius);
                    let pz = Math.floor(Math.sin(angle) * orbitRadius);
                    
                    let pdx = absX - px;
                    let pdz = absZ - pz;
                    if (pdx * pdx + pdz * pdz <= 9) { // Radius 3
                        let height = 15 + (i * 3) % 15;
                        for (let dy = -5; dy < height; dy++) {
                            primer.set(x, 64 + dy, z, OBSIDIAN);
                        }
                    }
                }
            }
        }
    }
    
    populateChunk(chunkX, chunkZ) {
        // Portal torches handled here since they need data values
        if (chunkX === 0 && chunkZ === 0) {
            this.world.setBlockAt(0, 69, 0, 50, 5); // 50 = TORCH
        }
    }
} 