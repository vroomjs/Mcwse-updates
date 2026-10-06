import NoiseGeneratorOctaves from "./noise/NoiseGeneratorOctaves.js";
import SirDingusTerrain from "./SirDingusTerrain.js";
import SirDingusUnderground from "./SirDingusUnderground.js";
import BackroomsGenerator from "./BackroomsGenerator.js";
import Chunk from "../Chunk.js";
import Primer from "./Primer.js";
import {BlockRegistry} from "../block/BlockRegistry.js";
import TreeGenerator from "./structure/TreeGenerator.js";
import BigTreeGenerator from "./structure/BigTreeGenerator.js";
import BirchTreeGenerator from "./structure/BirchTreeGenerator.js";
import SpruceTreeGenerator from "./structure/SpruceTreeGenerator.js";
import AcaciaTreeGenerator from "./structure/AcaciaTreeGenerator.js";
import DarkOakTreeGenerator from "./structure/DarkOakTreeGenerator.js";
import Generator from "./Generator.js";
import ChunkSection from "../ChunkSection.js";
import EntityCow from "../../entity/passive/EntityCow.js";
import EntityChicken from "../../entity/passive/EntityChicken.js";
import EntityPig from "../../entity/passive/EntityPig.js";
import {
    buildVillage,
    buildVillageHouse1,
    buildVillageHouse2,
    buildVillageHouse3,
    buildVillageTower1,
    buildVillageWell,
    buildBlacksmith,
    buildFarm,
    buildIgloo,
    buildDesertWell,
    buildDungeon
} from "../../../../../../../structures.js";
import Random from "../../../util/Random.js";

export default class WorldGenerator extends Generator {

    constructor(world, seed) {
        super(world, seed);

        this.seaLevel = 64;

        // Keep every existing population and surface system intact. This object
        // supplies only the density columns for the supplied terrain generator.
        this.sirDingusTerrain = new SirDingusTerrain(seed, {
            amplified: world.worldType === 4,
            // Amplified leans harder into the big cliff faces and arches.
            cliffStrength: world.worldType === 4 ? 1.35 : 1.0
        });
        // Worm caves, ravines, and deep lava behavior from the same supplied
        // generator. Tree/population code below remains this project's own.
        this.sirDingusUnderground = new SirDingusUnderground(seed);
        this.backroomsGenerator = new BackroomsGenerator();

        this.terrainGenerator4 = new NoiseGeneratorOctaves(this.random, 16);
        this.terrainGenerator5 = new NoiseGeneratorOctaves(this.random, 16);
        this.terrainGenerator3 = new NoiseGeneratorOctaves(this.random, 8);

        this.natureGenerator1 = new NoiseGeneratorOctaves(this.random, 4);
        this.natureGenerator2 = new NoiseGeneratorOctaves(this.random, 4);

        this.terrainGenerator1 = new NoiseGeneratorOctaves(this.random, 10);
        this.terrainGenerator2 = new NoiseGeneratorOctaves(this.random, 16);

        this.populationNoiseGenerator = new NoiseGeneratorOctaves(this.random, 8);

        // Biome generator for desert - increased octaves for natural detail
        this.biomeGenerator = new NoiseGeneratorOctaves(this.random, 4);

        // Warp generator to break up straight lines and jagged edges
        this.warpGenerator = new NoiseGeneratorOctaves(this.random, 2);
    }

    /**
     * Get smooth, warped biome noise at world coordinates.
     */
    getBiomeNoiseAt(x, z) {
        // Large scale coordinate warping for organic boundaries
        const warpScale = 0.012;
        const warpX = this.warpGenerator.perlin(x, z, warpScale, warpScale) * 16.0;
        const warpZ = this.warpGenerator.perlin(x + 1234, z + 5678, warpScale, warpScale) * 16.0;

        // Biome feature scale (approx 200 block feature size)
        const biomeScale = 0.005; 
        
        return this.biomeGenerator.perlin(x + warpX, z + warpZ, biomeScale, biomeScale);
    }

    getGeneratedBlockAt(x, y, z) {
        const chunkX = x >> 4;
        const chunkZ = z >> 4;
        
        const tempChunk = new Chunk(this.world, chunkX, chunkZ);
        const primer = new Primer(tempChunk);
        
        this.generateInChunk(chunkX, chunkZ, primer);
        
        return primer.get(x & 15, y, z & 15);
    }

    newChunk(world, chunkX, chunkZ) {
        // Use 32-bit integer math for consistent seeding across all platforms/coordinates
        let seedHash = Math.imul(chunkX, 0x4f9939f5) ^ Math.imul(chunkZ, 0x1ef1565b) ^ Number(this.seed);
        this.random.setSeed(seedHash);

        let chunk = new Chunk(world, chunkX, chunkZ);
        let primer = new Primer(chunk);

        this.generateInChunk(chunkX, chunkZ, primer);

        // Lighting removed from here; moved to World.js lightingInitQueue for multi-frame processing

        // Mark as clean so purely generated chunks aren't saved needlessly
        chunk.isDirty = false;

        return chunk;
    }

    generateInChunk(chunkX, chunkZ, primer) {
        // The literal seed "backrooms" is an easter-egg world: its complete
        // overworld is a lit yellow maze rather than normal terrain.
        if (this.world.isBackroomsSeed) {
            this.backroomsGenerator.generateInChunk(chunkX, chunkZ, primer);
            return;
        }

        if (this.world._gameType === 'oneblock') {
            // One Block: Void world with a single block at 0,64,0
            if (chunkX === 0 && chunkZ === 0) {
                // Ensure the "one block" exists
                // Position defined in World.js is 0, 64, 0.
                const grass = BlockRegistry.GRASS.getId();
                
                // Set the one block
                primer.set(0, 64, 0, grass);
                
                // Bedrock base not needed, it should be floating.
                // But for safety against falling into void immediately on spawn?
                // No, one block challenge means 1 block.
            }
            return;
        }

        if (this.world._gameType === 'skyblock') {
            // Only generate island at chunk 0,0
            if (chunkX === 0 && chunkZ === 0) {
                const grass = BlockRegistry.GRASS.getId();
                const dirt = BlockRegistry.DIRT.getId();
                const bedrock = BlockRegistry.BEDROCK.getId();

                // L-shaped island generation
                // Segment 1 (Long Z): x[6-8], z[4-10]
                // Segment 2 (Short X extension): x[9-11], z[8-10]
                
                for (let x = 0; x < 16; x++) {
                    for (let z = 0; z < 16; z++) {
                        let isIsland = false;
                        if (x >= 6 && x <= 8 && z >= 4 && z <= 10) isIsland = true;
                        if (x >= 9 && x <= 11 && z >= 8 && z <= 10) isIsland = true;

                        if (isIsland) {
                            // 3 layers: Bedrock/Dirt -> Dirt -> Grass
                            // Bedrock only at specific point for safety
                            let bottom = (x === 7 && z === 7) ? bedrock : dirt;
                            
                            primer.set(x, 61, z, bottom);
                            primer.set(x, 62, z, dirt);
                            primer.set(x, 63, z, grass);
                        }
                    }
                }
            }
            return;
        }

        if (this.world.worldType === 1 || this.world.worldType === 6) { // Flat / Debug
            let currentY = 0;
            const layers = this.world.superflatLayers || [];
            for (let layer of layers) {
                for (let i = 0; i < layer.count; i++) {
                    if (currentY >= 128) break;
                    for (let x = 0; x < 16; x++) {
                        for (let z = 0; z < 16; z++) {
                            primer.set(x, currentY, z, layer.id);
                        }
                    }
                    currentY++;
                }
            }
        } else {
            this.generateTerrain(chunkX, chunkZ, primer);
            this.naturalize(chunkX, chunkZ, primer);
            this.generateStoneVariants(chunkX, chunkZ, primer);

            this.sirDingusUnderground.generateInChunk(chunkX, chunkZ, primer);
            this.generateOres(chunkX, chunkZ, primer);
        }
    }

    populateChunk(chunkX, chunkZ) {
        // Keep the Backrooms empty: no overworld trees, plants, structures,
        // or normal population are added to its generated maze.
        if (this.world.isBackroomsSeed) return;

        const GRASS_ID = BlockRegistry.GRASS.getId();
        const SNOWY_GRASS_ID = BlockRegistry.SNOWY_GRASS.getId();

        if (this.world.worldType === 6) {
            this.populateDebugWorld(chunkX, chunkZ);
            return;
        }

        // Dungeon Generation (0.8% chance per chunk)
        if (this.random.nextInt(125) === 0) {
            let rx = this.random.nextInt(16);
            let rz = this.random.nextInt(16);
            let x = chunkX * 16 + rx;
            let z = chunkZ * 16 + rz;
            let y = 15 + this.random.nextInt(30); // Underground Y=15 to Y=45
            
            // Safety check: only spawn if surrounded by stone
            if (this.world.getBlockAt(x, y, z) === BlockRegistry.STONE.getId()) {
                buildDungeon(this.world, x - 4, y, z - 4); // Center it on the search pos
            }
        }
        
        const isOneBlock = this.world._gameType === 'oneblock';

        if (this.world._gameType === 'skyblock') {
            if (chunkX === 0 && chunkZ === 0) {
                // Only generate island features if they don't already exist in save data
                // We check the tile entity map which is loaded before population in loadWorldData
                if (!this.world.getTileEntity(10, 64, 9)) {
                    // Tree at x=7, z=5 (Near start of Long Z segment)
                    let treeGen = new TreeGenerator(this.world, this.world.seed);
                    treeGen.generateAtBlock(7, 64, 5);

                    // Chest at x=10, z=9 (On the extension)
                    const chest = BlockRegistry.CHEST.getId();
                    this.world.setBlockAt(10, 64, 9, chest);
                    // Face chest roughly towards center
                    this.world.setBlockDataAt(10, 64, 9, 4); 
                    
                    // Fill chest
                    const items = new Array(27).fill(null).map(() => ({id:0,count:0}));
                    items[0] = {id: 362, count: 1}; // Water Bucket
                    items[1] = {id: 368, count: 1}; // Lava Bucket
                    items[2] = {id: 364, count: 3}; // Steak (Cooked Beef)
                    if (Math.random() < 0.08) {
                        const saplings = [400, 202, 211, 323, 324];
                        items[3] = {
                            id: saplings[Math.floor(Math.random() * saplings.length)],
                            count: 1
                        };
                    }
                    
                    this.world.setTileEntity(10, 64, 9, { items: items });
                }
            }
            return;
        }

        // If world is flat or One Block, skip standard population (trees/animals) 
        // unless structures are enabled.
        if (this.world.worldType === 1 || isOneBlock) {
            if (this.world.gameRules.generateStructures) {
                this.setChunkSeed(chunkX, chunkZ);
                this.generateVillages(chunkX, chunkZ);
            }
            return;
        }

        // Set seed for chunk
        this.setChunkSeed(chunkX, chunkZ);

        // Village Generation Logic
        if (this.world.gameRules.generateStructures) {
            this.generateVillages(chunkX, chunkZ);
        }

        // Modded Structures Generation
        if (this.world.minecraft.moddedStructures && this.world.minecraft.moddedStructures.length > 0) {
            for (const struct of this.world.minecraft.moddedStructures) {
                if (this.random.nextInt(100) < struct.spawnChance) {
                    const x = chunkX * 16 + this.random.nextInt(16);
                    const z = chunkZ * 16 + this.random.nextInt(16);
                    
                    const biomeVal = this.world.getBiomeNoiseAt(x, z);
                    let biomeName = "plains";
                    if (biomeVal > 0.68) biomeName = "desert";
                    else if (biomeVal < -0.62) biomeName = "snow";
                    else if (biomeVal < -0.25) biomeName = "forest"; // Combined forest/spruce/birch for simplicity
                    
                    if (struct.biomes.includes(biomeName)) {
                        const y = this.world.getHeightAt(x, z);
                        if (y > 0) {
                            // spawnData logic
                            for (const [rx, ry, rz, id, blockData] of struct.data.blocks) {
                                this.world.setBlockAt(x + rx, y + ry, z + rz, id, blockData, true);
                            }
                        }
                    }
                }
            }
        }

        // Desert Well Generation (2% chance)
        if (this.random.nextInt(50) === 0) { // 1 in 50 = 2%
            let x = chunkX * 16 + this.random.nextInt(16);
            let z = chunkZ * 16 + this.random.nextInt(16);
            
            // Check biome
            let biomeVal = this.world.getBiomeNoiseAt(x, z);
            
            // Desert threshold > 0.68
            if (biomeVal > 0.68) {
                // Find surface
                let y = this.world.getHeightAt(x, z);
                // Ensure on sand
                let ground = this.world.getBlockAt(x, y - 1, z);
                if (ground === BlockRegistry.SAND.getId()) {
                    buildDesertWell(this.world, x, y, z);
                }
            }
        }

        // Access noise data for population
        let absoluteX = chunkX * 16;
        let absoluteY = chunkZ * 16;

        // Sample biome at chunk center for chunk-level features (logs, etc)
        let biomeVal = this.getBiomeNoiseAt(absoluteX + 8, absoluteY + 8);
        let isSavanna = (biomeVal >= 0.55 && biomeVal < 0.72);

        // Increased tree density in forests to match clumps in the reference image
        let amount = Math.floor(((this.populationNoiseGenerator.perlin(absoluteX * 0.5, absoluteY * 0.5) / 8 + this.random.nextDouble() * 4 + 4) / 3) * 1.15);
        if (amount < 0) {
            amount = 0;
        }
        if (this.random.nextInt(10) === 0) {
            amount++;
        }

        // Plant the trees in the chunk
        for (let i = 0; i < amount; i++) {
            let totalX = absoluteX + this.random.nextInt(16) + 8;
            let totalZ = absoluteY + this.random.nextInt(16) + 8;
            let totalY = this.world.getHeightAt(totalX, totalZ);

            // Determine biome at this specific position for tree selection
            let biomeVal = this.world.getBiomeNoiseAt(totalX, totalZ);

            let treeSeed = this.random.seed;
            let treeGenerator;
            
            // Spruce forests are broader now
            let isSpruceForest = (biomeVal < -0.38);
            let isDarkForest = (biomeVal >= 0.1 && biomeVal < 0.35);
            let isSavanna = (biomeVal >= 0.55 && biomeVal < 0.72);
            
            // Population skip chance: lower skip for forests, higher for plains/desert
            let skipChance = 0.46;
            if (isDarkForest || isSpruceForest) skipChance = 0.2;
            if (isSavanna) skipChance = 0.55; 
            if (biomeVal > 0.72) skipChance = 1.0; // Desert

            if (this.random.nextFloat() < skipChance) continue;

            let r = this.random.nextInt(10);
            if (r === 0 && !isSpruceForest && !isDarkForest) {
                treeGenerator = new BigTreeGenerator(this.world, treeSeed);
            } else {
                // Biome Based Logic for Diverse Biomes
                if (biomeVal < -0.38) { 
                    // Snow Biome / Spruce Forest: Mostly Spruce
                    treeGenerator = (r <= 8) ? new SpruceTreeGenerator(this.world, treeSeed) : new TreeGenerator(this.world, treeSeed);
                } else if (biomeVal < -0.1) { 
                    // Birch Forest (Singular): Mostly Birch
                    treeGenerator = (r <= 8) ? new BirchTreeGenerator(this.world, treeSeed) : new TreeGenerator(this.world, treeSeed);
                } else if (biomeVal < 0.55) { 
                    // Plains/Standard Forest Transition
                    if (this.random.nextFloat() > 0.2) continue; // Sparse trees in plains
                    treeGenerator = (r <= 5) ? new BirchTreeGenerator(this.world, treeSeed) : new TreeGenerator(this.world, treeSeed);
                } else {
                    // Desert: No trees
                    continue;
                }
            }

            // Increase forest density by running the loop more effectively
            // If in a forest biome, we might double or triple the attempts
            if (biomeVal < 0.5 && biomeVal > -0.75) {
                // Rerun generation for higher density in forests
                treeGenerator.generateAtBlock(totalX, totalY, totalZ);
                
                // Reduced density bonus for approx 20% lower forest density
                let densityBonus = (isSpruceForest) ? 4 : 1;
                for (let d = 0; d < densityBonus; d++) {
                    let ex = absoluteX + this.random.nextInt(16) + 8;
                    let ez = absoluteY + this.random.nextInt(16) + 8;
                    treeGenerator.generateAtBlock(ex, this.world.getHeightAt(ex, ez), ez);
                }
            } else {
                treeGenerator.generateAtBlock(totalX, totalY, totalZ);
            }
        }

        // Generate Animals
        // absoluteY is actually chunkZ * 16, reused variable name from original code
        let chunkWorldX = absoluteX;
        let chunkWorldZ = absoluteY;

        if (this.random.nextInt(14) === 0) { // 1 in 14 chunks chance to spawn a group (approx 7%)
            let groupSize = this.random.nextInt(3) + 1; // 1-3 animals
            let startX = chunkWorldX + this.random.nextInt(16);
            let startZ = chunkWorldZ + this.random.nextInt(16);
            let startY = this.world.getHeightAt(startX, startZ);

            let animalType = this.random.nextInt(3); // 0=Cow, 1=Chicken, 2=Pig

            if (this.world.getBlockAt(startX, startY - 1, startZ) === GRASS_ID || this.world.getBlockAt(startX, startY - 1, startZ) === SNOWY_GRASS_ID) {
                for (let i = 0; i < groupSize; i++) {
                    let x = startX + this.random.nextInt(5) - 2;
                    let z = startZ + this.random.nextInt(5) - 2;
                    let y = this.world.getHeightAt(x, z);

                    if (this.world.getBlockAt(x, y - 1, z) === GRASS_ID || this.world.getBlockAt(x, y - 1, z) === SNOWY_GRASS_ID) {
                        let entity;
                        if (animalType === 0) entity = new EntityCow(this.world.minecraft, this.world);
                        else if (animalType === 1) entity = new EntityChicken(this.world.minecraft, this.world);
                        else entity = new EntityPig(this.world.minecraft, this.world);
                        
                        entity.setPosition(x, y, z);
                        this.world.addEntity(entity);
                    }
                }
            }
        }

        // Generate fallen logs in forests (Approx 4.8% chance per chunk, increased ~15% from 4%)
        if (biomeVal < 0.2 && !isSavanna && this.random.nextInt(21) === 0) {
            let lx = absoluteX + this.random.nextInt(16) + 8;
            let lz = absoluteY + this.random.nextInt(16) + 8;
            let ly = this.world.getHeightAt(lx, lz);
            
            if (ly > this.seaLevel && this.world.getBlockAt(lx, ly - 1, lz) === GRASS_ID) {
                let length = 4 + this.random.nextInt(3); // 4 to 6 blocks long
                let isXAxis = this.random.nextFloat() < 0.5;
                let logId = (this.random.nextFloat() < 0.3) ? BlockRegistry.BIRCH_LOG.getId() : BlockRegistry.LOG.getId();
                let logMeta = isXAxis ? 4 : 8;

                for (let j = 0; j < length; j++) {
                    let tx = lx + (isXAxis ? j : 0);
                    let tz = lz + (isXAxis ? 0 : j);
                    let ty = this.world.getHeightAt(tx, tz);
                    
                    if (this.world.getBlockAt(tx, ty, tz) === 0) {
                        this.world.setBlockAt(tx, ty, tz, logId, logMeta);
                        
                        // 10% chance for mushroom on each log segment
                        if (this.random.nextFloat() < 0.10 && this.world.getBlockAt(tx, ty + 1, tz) === 0) {
                            let mushId = (this.random.nextFloat() < 0.5) ? BlockRegistry.RED_MUSHROOM.getId() : BlockRegistry.BROWN_MUSHROOM.getId();
                            this.world.setBlockAt(tx, ty + 1, tz, mushId);
                        }
                    }
                }
            }
        }

        // Generate foliage
        for (let i = 0; i < 31; i++) {
            let x = absoluteX + this.random.nextInt(16) + 8;
            let z = absoluteY + this.random.nextInt(16) + 8;
            let y = this.world.getHeightAt(x, z);
            
            let groundId = this.world.getBlockAt(x, y - 1, z);

            if (y > 0 && (groundId === GRASS_ID || groundId === SNOWY_GRASS_ID) && this.world.getBlockAt(x, y, z) === 0) {
                
                let isSnowyBiomeBlock = groundId === SNOWY_GRASS_ID;

                // 60% less spawn chance in snowy biomes (i.e. 40% chance to run logic)
                if (isSnowyBiomeBlock && this.random.nextFloat() > 0.40) {
                    continue; 
                }
                
                let foliageType = this.random.nextInt(100);

                if (isSnowyBiomeBlock) {
                    // In snow biome, prioritize generic foliage and ferns, avoid flowers
                    if (foliageType < 15) { // Increased chance for ferns/foliage
                         this.world.setBlockAt(x, y, z, BlockRegistry.FERN.getId());
                    } else {
                         this.world.setBlockAt(x, y, z, BlockRegistry.FOLIAGE.getId());
                    }
                } else {
                    // Adjusted generation weights: 
                    // Grass 65%, Tallgrass 10%, Ferns 10%, Double Ferns 5%, Rose/Dandelion 10%
                    if (foliageType < 65) {
                        this.world.setBlockAt(x, y, z, BlockRegistry.FOLIAGE.getId());
                    } else if (foliageType < 75) {
                        // Tall Grass
                        if (y < 127 && this.world.getBlockAt(x, y + 1, z) === 0) {
                            this.world.setBlockAt(x, y, z, BlockRegistry.TALL_GRASS.getId());
                        } else {
                            this.world.setBlockAt(x, y, z, BlockRegistry.FOLIAGE.getId());
                        }
                    } else if (foliageType < 85) {
                        this.world.setBlockAt(x, y, z, BlockRegistry.FERN.getId());
                    } else if (foliageType < 90) {
                        // Large Fern
                        if (y < 127 && this.world.getBlockAt(x, y + 1, z) === 0) {
                            this.world.setBlockAt(x, y, z, BlockRegistry.LARGE_FERN.getId());
                        } else {
                            this.world.setBlockAt(x, y, z, BlockRegistry.FERN.getId());
                        }
                    } else if (foliageType < 95) {
                        this.world.setBlockAt(x, y, z, BlockRegistry.ROSE.getId());
                    } else {
                        this.world.setBlockAt(x, y, z, BlockRegistry.DANDELION.getId());
                    }
                }
            }
        }
    }

    /**
     * Build a deterministic catalog of the game's built-in structures on a
     * flat test surface. Each entry is owned by the chunk containing its
     * anchor, so it is generated exactly once as the player explores.
     */
    populateDebugWorld(chunkX, chunkZ) {
        const y = 4; // bedrock + dirt + grass, matching the default flat world
        const entries = [
            { x: -48, z: -48, build: () => buildFarm(this.world, -48, y, -48, "wheat") },
            { x: -24, z: -48, build: () => buildFarm(this.world, -24, y, -48, "carrot") },
            { x: 0, z: -48, build: () => buildFarm(this.world, 0, y, -48, "potato") },
            { x: 24, z: -48, build: () => buildFarm(this.world, 24, y, -48, "beetroot") },

            { x: -48, z: -24, build: () => buildVillageHouse1(this.world, -48, y, -24) },
            { x: -24, z: -24, build: () => buildVillageHouse2(this.world, -24, y, -24) },
            { x: 0, z: -24, build: () => buildVillageHouse3(this.world, 0, y, -24) },
            { x: 24, z: -24, build: () => buildVillageTower1(this.world, 24, y, -24) },

            { x: -48, z: 0, build: () => buildBlacksmith(this.world, -48, y, 0) },
            { x: -24, z: 0, build: () => buildVillageWell(this.world, -24, y, 0) },
            { x: 0, z: 0, build: () => buildIgloo(this.world, 0, y, 0) },
            { x: 24, z: 0, build: () => buildDesertWell(this.world, 24, y, 0) },

            { x: -48, z: 24, build: () => buildDungeon(this.world, -48, y, 24) },
            { x: -24, z: 24, build: () => new TreeGenerator(this.world, this.world.seed).generateAtBlock(-24, y, 24) },
            { x: 0, z: 24, build: () => new BigTreeGenerator(this.world, this.world.seed).generateAtBlock(0, y, 24) },
            { x: 24, z: 24, build: () => new BirchTreeGenerator(this.world, this.world.seed).generateAtBlock(24, y, 24) },
            { x: -48, z: 48, build: () => new SpruceTreeGenerator(this.world, this.world.seed).generateAtBlock(-48, y, 48) },
            { x: -24, z: 48, build: () => new AcaciaTreeGenerator(this.world, this.world.seed).generateAtBlock(-24, y, 48) },
            { x: 0, z: 48, build: () => new DarkOakTreeGenerator(this.world, this.world.seed).generateAtBlock(0, y, 48) },

            // A complete generated village is kept as a separate showcase
            // from the deterministic individual building catalog above.
            { x: 48, z: 48, build: () => buildVillage(this.world, 48, y, 48) }
        ];

        for (const entry of entries) {
            if (Math.floor(entry.x / 16) === chunkX && Math.floor(entry.z / 16) === chunkZ) {
                entry.build();
            }
        }

        if (this.world.minecraft && this.world.minecraft.worldRenderer) {
            this.world.minecraft.worldRenderer.flushRebuild = true;
        }
    }

    generateVillages(chunkX, chunkZ) {
        // Grid size for regions (32 chunks ~ 512 blocks)
        const gridSize = 32; 
        
        // Determine region coordinates
        const rX = Math.floor(chunkX / gridSize);
        const rZ = Math.floor(chunkZ / gridSize);
        
        // Seed for this region using a stable hash
        // We use absolute rX/rZ to ensure consistency
        const regionSeed = Math.floor((Math.abs(rX) * 341873128712 + Math.abs(rZ) * 132897987541 + this.seed) & 0xffffffff);
        const regionRandom = new Random(regionSeed);
        
        // Determine number of villages in this region
        // Increased spawn rate significantly to ensure they appear in One Block/Void worlds
        let count = 0;
        let roll = regionRandom.nextInt(100);
        
        // Special Case: Near Spawn (Region 0,0 approx)
        if (rX === 0 && rZ === 0) {
            // 85% chance for at least 1 village in the spawn region
            count = (regionRandom.nextInt(100) < 85) ? 1 : 0;
        } else {
            // High probability of villages per region (90% total chance)
            if (roll >= 10 && roll < 70) count = 1; // 60% chance for 1
            else if (roll >= 70) count = 2; // 30% chance for 2
        }
        
        // Generate positions for the villages in this region
        for (let i = 0; i < count; i++) {
            // Search for the flattest chunk in the 32x32 region
            let bestX = rX * gridSize + regionRandom.nextInt(gridSize);
            let bestZ = rZ * gridSize + regionRandom.nextInt(gridSize);
            let minVariance = Infinity;

            // Sample 12 chunks in the region (deterministic via regionRandom)
            for (let attempt = 0; attempt < 12; attempt++) {
                let tx = rX * gridSize + regionRandom.nextInt(gridSize);
                let tz = rZ * gridSize + regionRandom.nextInt(gridSize);

                // Estimate flatness by sampling 4 points in the chunk
                let wx = tx * 16; let wz = tz * 16;
                let h1 = this.world.getHeightAt(wx, wz);
                let h2 = this.world.getHeightAt(wx + 15, wz);
                let h3 = this.world.getHeightAt(wx, wz + 15);
                let h4 = this.world.getHeightAt(wx + 15, wz + 15);

                let variance = Math.max(h1, h2, h3, h4) - Math.min(h1, h2, h3, h4);
                if (variance < minVariance) {
                    minVariance = variance;
                    bestX = tx;
                    bestZ = tz;
                }
            }
            
            const villageChunkX = bestX;
            const villageChunkZ = bestZ;
            
            // If current chunk is the chosen village chunk
            if (chunkX === villageChunkX && chunkZ === villageChunkZ) {
                // Spawn Village center
                const x = chunkX * 16 + 8;
                const z = chunkZ * 16 + 8;
                // Find height
                let y = this.world.getHeightAt(x, z);
                
                const isOneBlock = this.world._gameType === 'oneblock';

                // Only spawn on land (above sea level) OR in Superflat world type OR One Block mode
                if (y > this.seaLevel || this.world.worldType === 1 || isOneBlock) {
                    // In One Block or Void worlds, default Y to 64
                    if ((isOneBlock || this.world.worldType === 1) && y < 64) {
                        y = 64;
                    }
                    buildVillage(this.world, x, y, z);
                }
            }
        }
    }

    generateOres(chunkX, chunkZ, primer) {
        let oreBlocks = [
            { block: BlockRegistry.COAL_ORE, chance: 0.00088, min_y: 0, max_y: 128, type: 'coal' },
            { block: BlockRegistry.IRON_ORE, chance: 0.00066, min_y: 0, max_y: 64, type: 'iron' },
            { block: BlockRegistry.GOLD_ORE, chance: 0.00033, min_y: 0, max_y: 32, type: 'gold' },
            { block: BlockRegistry.REDSTONE_ORE, chance: 0.00044, min_y: 0, max_y: 16, type: 'redstone' },
            { block: BlockRegistry.DIAMOND_ORE, chance: 0.000275, min_y: 0, max_y: 16, type: 'diamond' }
        ];

        // Direct section array access (same iteration + random call order as
        // before, so generated worlds are unchanged — just much faster).
        const sections = primer.chunk.sections;
        const STONE = BlockRegistry.STONE.getId();
        const getId = (x, y, z) => sections[y >> 4].blocks[((y & 15) << 8) | (z << 4) | x];
        const adjacentToAir = (x, y, z) =>
            (x > 0 && getId(x - 1, y, z) === 0) ||
            (x < 15 && getId(x + 1, y, z) === 0) ||
            (y > 0 && getId(x, y - 1, z) === 0) ||
            (y < 127 && getId(x, y + 1, z) === 0) ||
            (z > 0 && getId(x, y, z - 1) === 0) ||
            (z < 15 && getId(x, y, z + 1) === 0);

        for (const ore of oreBlocks) {
            for (let x = 0; x < 16; x++) {
                for (let z = 0; z < 16; z++) {
                    for (let y = ore.min_y; y < ore.max_y; y++) {
                        if (getId(x, y, z) === STONE) {
                            let isCaveWall = adjacentToAir(x, y, z);
                            let spawnChance = ore.chance * (isCaveWall ? 2.0 : 1.0);

                            if (this.random.nextFloat() < spawnChance) {
                                let clusterSize = this.getWeightedVeinSize(ore.type);
                                this.generateVein(primer, x, y, z, ore.block, clusterSize, ore.max_y);
                            }
                        }
                    }
                }
            }
        }

        // Emerald Generation (Custom rarity and vein size distribution)
        // 50% more rare than Diamond (0.000275 * 1.02 * 0.5)
        const emeraldChance = 0.000275 * 1.02 * 0.5;
        // Range 4-32
        const minY = 4;
        const maxY = 32;

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                for (let y = minY; y < maxY; y++) {
                    if (getId(x, y, z) === STONE) {
                        let isCaveWall = adjacentToAir(x, y, z);
                        let spawnChance = emeraldChance * (isCaveWall ? 2.0 : 1.0);

                        if (this.random.nextFloat() < spawnChance) {
                            // Vein size distribution:
                            // 50% chance for 1
                            // 35% chance for 2
                            // 15% chance for 3
                            let r = this.random.nextFloat();
                            let size = 1;
                            if (r > 0.85) size = 3;
                            else if (r > 0.50) size = 2;
                            
                            this.generateVein(primer, x, y, z, BlockRegistry.EMERALD_ORE, size, maxY);
                        }
                    }
                }
            }
        }
    }

    getWeightedVeinSize(type) {
        let pool = [];
        if (type === 'coal') pool = [5, 6, 6, 7, 7, 7, 7, 8, 8, 9, 10];
        else if (type === 'iron') pool = [2, 3, 3, 4, 4, 4, 4, 5, 5, 6];
        else if (type === 'gold') pool = [2, 3, 3, 3, 4, 4, 4, 5];
        else if (type === 'redstone') pool = [2, 2, 3, 3, 3, 3, 3, 4, 4, 5, 6, 7];
        else if (type === 'diamond') pool = [1, 2, 2, 3, 3, 3, 3, 3, 4, 4, 5];
        else return 1;

        return pool[this.random.nextInt(pool.length)];
    }

    generateVein(primer, x, y, z, block, size, maxY) {
        let dx = x;
        let dy = y;
        let dz = z;

        // Use a more compact walk by moving only one axis at a time
        for (let i = 0; i < size; i++) {
            // Pick a random axis (0=x, 1=y, 2=z)
            const axis = this.random.nextInt(3);
            const step = this.random.nextInt(2) === 0 ? -1 : 1;

            if (axis === 0) dx += step;
            else if (axis === 1) dy += step;
            else dz += step;

            // Clamp to chunk bounds
            dx = Math.max(0, Math.min(15, dx));
            dz = Math.max(0, Math.min(15, dz));
            dy = Math.max(0, Math.min(maxY - 1, dy));

            // Only replace Stone or other stone-like variants for natural veins
            const currentId = primer.get(dx, dy, dz);
            if (currentId === BlockRegistry.STONE.getId() || 
                currentId === BlockRegistry.GRANITE.getId() || 
                currentId === BlockRegistry.DIORITE.getId() || 
                currentId === BlockRegistry.ANDESITE.getId()) {
                primer.set(dx, dy, dz, block.getId());
            }
        }
    }

    generateStoneVariants(chunkX, chunkZ, primer) {
        if (this.random.nextFloat() < 0.40) { // 40% chance per chunk
            // Choose one type for this chunk's clusters
            const types = [
                BlockRegistry.GRANITE.getId(),
                BlockRegistry.DIORITE.getId(),
                BlockRegistry.ANDESITE.getId()
            ];
            const typeId = types[this.random.nextInt(3)];
            
            // Number of clusters in this chunk (Rare chance for more)
            let clusters = 1;
            if (this.random.nextFloat() < 0.2) clusters += this.random.nextInt(3); 
            
            for(let i = 0; i < clusters; i++) {
                let rx = this.random.nextInt(16);
                let rz = this.random.nextInt(16);
                let ry = this.random.nextInt(60) + 10; // underground
                
                this.generateBlob(primer, rx, ry, rz, typeId, 20);
            }
        }
    }

    generateBlob(primer, x, y, z, typeId, size) {
        let currX = x;
        let currY = y;
        let currZ = z;
        
        const STONE = BlockRegistry.STONE.getId();
        
        for (let i = 0; i < size; i++) {
            // Move randomly to create organic shape
            currX += this.random.nextInt(3) - 1;
            currY += this.random.nextInt(3) - 1;
            currZ += this.random.nextInt(3) - 1;
            
            // Clamp and check valid placement
            let bx = Math.max(0, Math.min(15, currX));
            let bz = Math.max(0, Math.min(15, currZ));
            let by = Math.max(1, Math.min(126, currY));
            
            // Replace stone and other stone variants
            const currentBlock = primer.get(bx, by, bz);
            if (currentBlock === STONE || currentBlock === BlockRegistry.GRANITE.getId() || currentBlock === BlockRegistry.DIORITE.getId() || currentBlock === BlockRegistry.ANDESITE.getId()) {
                primer.set(bx, by, bz, typeId);
            }
        }
    }

    isAdjacentToAir(primer, x, y, z) {
        if (x > 0 && primer.get(x - 1, y, z) === 0) return true;
        if (x < 15 && primer.get(x + 1, y, z) === 0) return true;
        if (y > 0 && primer.get(x, y - 1, z) === 0) return true;
        if (y < 127 && primer.get(x, y + 1, z) === 0) return true;
        if (z > 0 && primer.get(x, y, z - 1) === 0) return true;
        if (z < 15 && primer.get(x, y, z + 1) === 0) return true;
        return false;
    }


    generateTerrain(chunkX, chunkZ, primer) {
        // Terrain shape is ported from the supplied SirDingus project. The
        // Existing surface painting, ores, structures, and population paths
        // run after this method. Underground caves/ravines use the paired
        // SirDingus feature generator in generateInChunk().
        const gridSize = 4;
        const gridHeight = 16;
        const samplesPerAxis = gridSize + 1;
        const stone = BlockRegistry.STONE.getId();
        const water = BlockRegistry.WATER.getId();
        const bedrock = BlockRegistry.BEDROCK.getId();

        // Preserve the target project's Small/Large world borders. They are a
        // world-size setting, not a part of the terrain-density algorithm.
        let limitRadius = -1;
        if (this.world.worldType === 2) limitRadius = 175;
        if (this.world.worldType === 3) limitRadius = 500;
        const borderFade = 32;

        // The source generator samples density at a 4x8x4 lattice and linearly
        // interpolates it into a 16x128x16 chunk.
        const densityColumns = [];
        for (let gridX = 0; gridX <= gridSize; gridX++) {
            for (let gridZ = 0; gridZ <= gridSize; gridZ++) {
                densityColumns.push(this.sirDingusTerrain.column(
                    chunkX * gridSize + gridX,
                    chunkZ * gridSize + gridZ
                ));
            }
        }

        for (let gridX = 0; gridX < gridSize; gridX++) {
            for (let gridZ = 0; gridZ < gridSize; gridZ++) {
                const southwest = densityColumns[gridX * samplesPerAxis + gridZ];
                const southeast = densityColumns[(gridX + 1) * samplesPerAxis + gridZ];
                const northwest = densityColumns[gridX * samplesPerAxis + gridZ + 1];
                const northeast = densityColumns[(gridX + 1) * samplesPerAxis + gridZ + 1];

                for (let gridY = 0; gridY < gridHeight; gridY++) {
                    for (let localY = 0; localY < 8; localY++) {
                        const yProgress = localY / 8;
                        const y = gridY * 8 + localY;
                        const southAtY = southwest[gridY] + (southwest[gridY + 1] - southwest[gridY]) * yProgress;
                        const southeastAtY = southeast[gridY] + (southeast[gridY + 1] - southeast[gridY]) * yProgress;
                        const northAtY = northwest[gridY] + (northwest[gridY + 1] - northwest[gridY]) * yProgress;
                        const northeastAtY = northeast[gridY] + (northeast[gridY + 1] - northeast[gridY]) * yProgress;

                        for (let localX = 0; localX < 4; localX++) {
                            const xProgress = localX / 4;
                            const southDensity = southAtY + (southeastAtY - southAtY) * xProgress;
                            const northDensity = northAtY + (northeastAtY - northAtY) * xProgress;
                            const x = gridX * 4 + localX;
                            const worldX = chunkX * 16 + x;

                            for (let localZ = 0; localZ < 4; localZ++) {
                                const zProgress = localZ / 4;
                                let density = southDensity + (northDensity - southDensity) * zProgress;
                                const z = gridZ * 4 + localZ;
                                const worldZ = chunkZ * 16 + z;

                                if (limitRadius > 0) {
                                    const distance = Math.sqrt(worldX * worldX + worldZ * worldZ);
                                    if (distance > limitRadius) density = -1000;
                                    else if (distance > limitRadius - borderFade) {
                                        const fade = (distance - (limitRadius - borderFade)) / borderFade;
                                        density -= fade * 100;
                                    }
                                }

                                let typeId = y < this.seaLevel ? water : 0;
                                if (density > 0) typeId = stone;
                                if (y === 0) typeId = bedrock;
                                primer.set(x, y, z, typeId);
                            }
                        }
                    }
                }
            }
        }
    }

    naturalize(chunkX, chunkZ, primer) {
        const sections = primer.chunk.sections;
        const getId = (x, y, z) => sections[y >> 4].blocks[((y & 15) << 8) | (z << 4) | x];
        let strength = 1 / 32;
        let chunkSize = ChunkSection.SIZE;

        let biomeNoise = new Float32Array(256);

        // Generate noise for nature painting
        let natureNoise1 = this.natureGenerator1.generateNoiseOctaves(
            chunkX * chunkSize, chunkZ * chunkSize,
            0.0, chunkSize, chunkSize, 1,
            strength, strength, 1.0
        );
        let natureNoise2 = this.natureGenerator1.generateNoiseOctaves(
            chunkZ * chunkSize, 109.0134, chunkX * chunkSize,
            chunkSize, 1, chunkSize,
            strength, 1.0, strength);
        let natureNoise3 = this.natureGenerator2.generateNoiseOctaves(
            chunkX * chunkSize, chunkZ * chunkSize, 0.0,
            chunkSize, chunkSize, 1,
            strength * 2, strength * 2, strength * 2
        );

        // Paint entire chunk with nature blocks
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                // Pull noise values for patches
                let sandPatchNoise = natureNoise1[x * 16 + z] + this.random.nextFloat() * 0.2 > 0;
                let gravelPatchNoise = natureNoise2[x + z * 16] + this.random.nextFloat() * 0.2 > 3;
                let stonePatchNoise = (natureNoise3[x * 16 + z] / 3 + 3 + this.random.nextFloat() * 0.25);

                let prevStonePatchNoise = -1;

                // Layer types (decided at surface)
                let topLayerTypeId = 0;
                let innerLayerTypeId = 0;
                
                // Use warped biome noise block-by-block for organic transitions
                let rawBiome = this.getBiomeNoiseAt((chunkX * 16) + x, (chunkZ * 16) + z);
                biomeNoise[x * 16 + z] = rawBiome;
                let jitter = (this.random.nextFloat() - 0.5) * 0.03;
                let blendedBiome = rawBiome + jitter;
                
                let isDesert = false;
                let isSnow = false;
                
                // Biome thresholds matching generation logic
                let isOcean = blendedBiome > 0.45 && blendedBiome < 0.65;
                if (blendedBiome >= 0.65) isDesert = true;
                else if (blendedBiome < -0.62) isSnow = true;
                
                // For the entire height of the chunk
                for (let y = 127; y >= 0; y--) {
                    // Set bedrock on floor level
                    if (y <= (this.random.nextInt(6)) - 1) {
                        primer.set(x, y, z, BlockRegistry.BEDROCK.getId());
                        continue;
                    }

                    // Get block type at current position
                    let typeIdAt = getId(x, y, z);

                    // Ignore air block
                    if (typeIdAt === 0) {
                        prevStonePatchNoise = -1;
                        continue;
                    }

                    // Check if it's a stone block
                    if (typeIdAt !== BlockRegistry.STONE.getId()) {
                        continue;
                    }

                    // Check if previous iteration was an air block
                    if (prevStonePatchNoise === -1) {
                        // If in a snow biome and below sea level (underwater terrain),
                        // deepen the water by replacing the top layers of stone with water.
                        if (isSnow && y < this.seaLevel) {
                            let depth = 9;
                            for (let k = 0; k < depth; k++) {
                                primer.set(x, y, z, BlockRegistry.WATER.getId());
                                y--;
                                if (y < 0) break;
                            }
                            if (y < 0) continue;
                            
                            // Check what block we landed on, if not stone, skip naturalizing
                            if (getId(x, y, z) !== BlockRegistry.STONE.getId()) {
                                prevStonePatchNoise = -1;
                                continue;
                            }
                        }

                        if (isDesert) {
                            topLayerTypeId = BlockRegistry.SAND.getId();
                            innerLayerTypeId = BlockRegistry.SANDSTONE.getId();
                        } else if (isSnow) {
                            topLayerTypeId = BlockRegistry.SNOWY_GRASS.getId();
                            innerLayerTypeId = BlockRegistry.DIRT.getId();
                        } else {
                            topLayerTypeId = BlockRegistry.GRASS.getId();
                            innerLayerTypeId = BlockRegistry.DIRT.getId();
                        }

                        // Override for underwater soil composition
                        // Only apply dirt/sand/gravel if the block is actually submerged by water
                        if (y < this.seaLevel && getId(x, y + 1, z) === BlockRegistry.WATER.getId()) {
                            let depth = this.seaLevel - y;
                            if (depth <= 3) {
                                // Shallow: Dirt
                                topLayerTypeId = BlockRegistry.DIRT.getId();
                                innerLayerTypeId = BlockRegistry.DIRT.getId();
                            } else if (depth <= 5) {
                                // Edges: Sand
                                topLayerTypeId = BlockRegistry.SAND.getId();
                                innerLayerTypeId = BlockRegistry.SANDSTONE.getId();
                            } else {
                                // Floor: Mix of gravel/dirt/stone
                                let r = this.random.nextFloat();
                                if (r < 0.4) {
                                    topLayerTypeId = BlockRegistry.GRAVEL.getId();
                                    innerLayerTypeId = BlockRegistry.GRAVEL.getId();
                                } else if (r < 0.7) {
                                    topLayerTypeId = BlockRegistry.DIRT.getId();
                                    innerLayerTypeId = BlockRegistry.DIRT.getId();
                                } else {
                                    topLayerTypeId = BlockRegistry.STONE.getId();
                                    innerLayerTypeId = BlockRegistry.STONE.getId();
                                }
                            }
                        }

                        if (stonePatchNoise <= 0) {
                            // Keep the stone
                            topLayerTypeId = 0;
                            innerLayerTypeId = BlockRegistry.STONE.getId();
                        } else if (y >= this.seaLevel - 2 && y <= this.seaLevel + 2) {
                            // Beaches
                            if (sandPatchNoise && !isSnow) {
                                topLayerTypeId = BlockRegistry.SAND.getId();
                                innerLayerTypeId = BlockRegistry.SAND.getId();
                            } else if (isSnow && sandPatchNoise) {
                                topLayerTypeId = BlockRegistry.SNOW_BLOCK.getId();
                                innerLayerTypeId = BlockRegistry.SNOW_BLOCK.getId();
                            }
                        }

                        // Set water if it's below the sea level
                        if (y < this.seaLevel && topLayerTypeId === 0) {
                            topLayerTypeId = BlockRegistry.WATER.getId();
                        }

                        // Set flag that we hit a block
                        prevStonePatchNoise = stonePatchNoise;

                        // Set grass or dirt type depending on sea level height
                        if (y >= this.seaLevel - 1) {
                            primer.set(x, y, z, topLayerTypeId);
                        } else {
                            primer.set(x, y, z, innerLayerTypeId);
                        }
                        continue;
                    }

                    // Set further inner layer blocks
                    if (prevStonePatchNoise > 0) {
                        prevStonePatchNoise--;
                        primer.set(x, y, z, innerLayerTypeId);
                    }
                }
            }
        }

        // Post-process: Ice Generation in Snow Biomes
        // Calculate distance to land for water blocks to determine ice type
        
        // 1. Build Land/Water Map
        // distMap: 0 = Land, 99 = Water (initial)
        let distMap = new Int32Array(256);
        let bfsQueue = [];
        let surfY = this.seaLevel - 1;

        // Blocks that count as "land" for ice distance
        const LAND_BLOCKS = [
            BlockRegistry.GRASS.getId(),
            BlockRegistry.SNOWY_GRASS.getId(),
            BlockRegistry.DIRT.getId(),
            BlockRegistry.SAND.getId(),
            BlockRegistry.GRAVEL.getId(),
            BlockRegistry.CLAY.getId(),
            BlockRegistry.STONE.getId()
        ];

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                let idx = x + z * 16;
                let blockId = getId(x, surfY, z);
                
                // Treat valid land blocks as distance 0
                if (LAND_BLOCKS.includes(blockId)) {
                    distMap[idx] = 0;
                    bfsQueue.push({x: x, z: z, d: 0});
                } else {
                    distMap[idx] = 99; // Max distance sentinel
                }
            }
        }

        // 2. BFS to propagate distance within the chunk
        // Note: This only calculates distance to land *within this chunk*.
        // For perfect world-wide distance, we'd need neighbor chunks, but this approximation creates
        // reasonable shore effects relative to local landmasses.
        let head = 0;
        while (head < bfsQueue.length) {
            let node = bfsQueue[head++];
            let d = node.d;
            
            if (d >= 15) continue; // Cap at 15

            // Check 4 neighbors
            const neighbors = [[0,1], [0,-1], [1,0], [-1,0]];
            for (let n of neighbors) {
                let nx = node.x + n[0];
                let nz = node.z + n[1];
                
                if (nx >= 0 && nx < 16 && nz >= 0 && nz < 16) {
                    let nIdx = nx + nz * 16;
                    if (distMap[nIdx] > d + 1) {
                        distMap[nIdx] = d + 1;
                        bfsQueue.push({x: nx, z: nz, d: d + 1});
                    }
                }
            }
        }

        // 3. Apply Ice Rules based on distance
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                let rawBiome = biomeNoise[x * 16 + z];
                // Only in Snow Biomes
                // Match new threshold: -0.62 (plus a margin if needed, but using exact match for consistency)
                if (rawBiome < -0.62) {
                    let idx = x + z * 16;
                    let dist = distMap[idx];
                    
                    // If it's water (dist > 0) and within range (<= 15)
                    if (dist > 0 && dist <= 15) {
                        let iceId = 0;
                        
                        // Logic:
                        // <= 1 block from land: 90% Packed, 10% Ice
                        // 2 blocks from land: 50% Packed, 50% Ice
                        // > 2 blocks: Normal Ice (ensures complete coverage)
                        
                        if (dist <= 1) {
                            iceId = (this.random.nextFloat() < 0.9) ? BlockRegistry.PACKED_ICE.getId() : BlockRegistry.ICE.getId();
                        } else if (dist === 2) {
                            iceId = (this.random.nextFloat() < 0.5) ? BlockRegistry.PACKED_ICE.getId() : BlockRegistry.ICE.getId();
                        } else {
                            iceId = BlockRegistry.ICE.getId();
                        }
                        
                        // Apply ice
                        if (iceId !== 0) {
                            primer.set(x, surfY, z, iceId);
                        }
                    }
                }
            }
        }
    }

    generateTerrainNoise(noiseX, noiseY, noiseZ, width, height, depth) {
        let strength = 684.412;

        // Generate terrain noise
        let terrainNoise1 = this.terrainGenerator1.generateNoiseOctaves(noiseX, noiseY, noiseZ, width, 1, depth, 1.0, 0.0, 1.0);
        let terrainNoise2 = this.terrainGenerator2.generateNoiseOctaves(noiseX, noiseY, noiseZ, width, 1, depth, 50.0, 0.0, 50.0);
        let terrainNoise3 = this.terrainGenerator3.generateNoiseOctaves(noiseX, noiseY, noiseZ, width, height, depth, strength / 160, strength / 160, strength / 160);
        let terrainNoise4 = this.terrainGenerator4.generateNoiseOctaves(noiseX, noiseY, noiseZ, width, height, depth, strength, strength, strength);
        let terrainNoise5 = this.terrainGenerator5.generateNoiseOctaves(noiseX, noiseY, noiseZ, width, height, depth, strength, strength, strength);

        // Output noise
        let output = [];

        let index = 0;
        let id = 0;

        // For each x, z coordinate
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < depth; z++) {
                let out1 = (terrainNoise1[id] + 256) / 512;
                if (out1 > 1.0) {
                    out1 = 1.0;
                }

                let maxY = 0.0;
                let out2 = terrainNoise2[id] / 8000;

                if (out2 < 0.0) {
                    out2 = -out2;
                }

                out2 = out2 * 3 - 2.3;

                if (out2 < 0.0) {
                    out2 /= 2;

                    if (out2 < -1) {
                        out2 = -1;
                    }

                    out2 /= 1.4;
                    out2 /= 2;
                    out1 = 0.0;
                } else {
                    if (out2 > 1.0) {
                        out2 = 1.0;
                    }
                    out2 /= 6;
                }

                out1 += 0.5;
                out2 = (out2 * height) / 16;
                id++;

                // Adjusted base height and amplitude for more dramatic hills/mountains
                // Boosted out2 influence to create higher peaks like in the reference image
                let h = height / 2 + out2 * 11 + 3.0; 

                // Y loop
                for (let y = 0; y < height; y++) {
                    let noise = 0;
                    
                    // Determine density scale
                    // Reduced from 12 to 6.8 to allow for more jagged/steep terrain and small overhangs
                    let densityScale = (this.world.worldType === 4) ? 3.5 : 6.8;
                    
                    let value = ((y - h) * densityScale) / out1;

                    if (value < 0.0) {
                        value *= 4;
                    }

                    let out4 = terrainNoise4[index] / 512;
                    let out5 = terrainNoise5[index] / 512;
                    let out3 = (terrainNoise3[index] / 10 + 1.0) / 2;

                    if (out3 < 0.0) {
                        noise = out4;
                    } else if (out3 > 1.0) {
                        noise = out5;
                    } else {
                        noise = out4 + (out5 - out4) * out3;
                    }

                    noise -= value;

                    if (y > height - 4) {
                        let diff = (y - (height - 4)) / 3;
                        noise = noise * (1.0 - diff) + -10 * diff;
                    }

                    if (y < maxY) {
                        let diff = (maxY - y) / 4;

                        if (diff < 0.0) {
                            diff = 0.0;
                        }

                        if (diff > 1.0) {
                            diff = 1.0;
                        }
                        noise = noise * (1.0 - diff) + -10 * diff;
                    }

                    // Add noise to array and increase index
                    output[index] = noise;
                    index++;
                }
            }
        }

        return output;
    }

}
