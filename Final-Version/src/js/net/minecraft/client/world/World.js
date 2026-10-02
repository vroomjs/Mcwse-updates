import Chunk from "./Chunk.js";
import ChunkSection from "./ChunkSection.js";
import WorldGenerator from "./generator/WorldGenerator.js";
import WorldGeneratorV2 from "./generator/WorldGeneratorV2.js";
import MathHelper from "../../util/MathHelper.js";
import BoundingBox from "../../util/BoundingBox.js";
import EnumSkyBlock from "../../util/EnumSkyBlock.js";
import Block from "./block/Block.js";
import EnumBlockFace from "../../util/EnumBlockFace.js";
import Vector3 from "../../util/Vector3.js";
import Vector4 from "../../util/Vector4.js";
import LightEngine from "./LightEngine.js";
import * as THREE from "three";
import Random from "../../util/Random.js";
import Primer from "./generator/Primer.js";
import EntityZombie from "../entity/monster/EntityZombie.js";
import EntityCreeper from "../entity/monster/EntityCreeper.js";
import EntitySnowZombie from "../entity/monster/EntitySnowZombie.js";
import EntityHusk from "../entity/monster/EntityHusk.js";
import EntityDrowned from "../entity/monster/EntityDrowned.js";
import EntityZombieVillager from "../entity/monster/EntityZombieVillager.js";
import EntitySkeleton from "../entity/monster/EntitySkeleton.js";
import EntitySnowGolem from "../entity/passive/EntitySnowGolem.js";
import EntitySheep from "../entity/passive/EntitySheep.js";
import EntitySpider from "../entity/monster/EntitySpider.js";
import EntitySlime from "../entity/monster/EntitySlime.js";
import EntityCow from "../entity/passive/EntityCow.js";
import EntityPig from "../entity/passive/EntityPig.js";
import EntityCat from "../entity/passive/EntityCat.js";
import EntityChicken from "../entity/passive/EntityChicken.js";
import EntityHorse from "../entity/passive/EntityHorse.js";
import { BlockRegistry } from "./block/BlockRegistry.js";
import PathFinder from "./PathFinder.js";
import BlockNether from "./block/type/BlockNether.js";
import BlockFire from "./block/type/BlockFire.js";
import BlockPortal from "./block/type/BlockPortal.js";

export default class World {

    static TOTAL_HEIGHT = ChunkSection.SIZE * 8 - 1;

    constructor(minecraft, seed, worldId = null, gameMode = 0) {
        this.minecraft = minecraft;
        this.dimension = 0; // 0 = Overworld, -1 = Nether, 1 = End

        this.entities = [];

        this.group = new THREE.Object3D();
        this.group.matrixAutoUpdate = false;

        this.chunks = new Map();
        // Flood-fill lighting engine (exact, incremental)
        this.lightEngine = new LightEngine(this);
        // Legacy field kept for debug overlays; the engine has no long-lived queue
        this.lightUpdateQueue = [];
        this.lightUpdateKeys = new Set();
        this.scheduledUpdates = [];
        this.scheduledUpdateKeys = new Set();
        this.chunkLoadQueue = [];
        this.chunkLoadSet = new Set();
        this.lightingInitQueue = []; // For background light init of new chunks

        // Queue for background lighting checks to fix dark shadows
        this.lightCheckQueue = [];
        this.checkedChunkIndex = 0;
        this.nextLightValidationTick = 0;
        this.lightValidationCursor = 0;

        // Queue for periodic refreshes (5s and 15s after load)
        this.signRefreshQueue = [];
        this.chunkRefreshQueue = [];

        this.initialRefreshDone = false;

        // Background high-frequency lighting validator (removed setInterval to prevent GPU stall)
        this.lightValidator = null;

        // Sequential Leaf Decay Queue
        this.leafDecayQueue = [];
        this.leafDecayKeys = new Set();
        this.leafDecayTimer = 0;

        this.time = 0;
        this.spawn = new Vector3(0, 0, 0);
        // A multiplayer client can receive the host's spawn before its first
        // world load. Keep that value authoritative instead of replacing it
        // with a locally searched spawn during Minecraft.loadWorld().
        this.spawnIsSet = false;

        this.droppedItems = [];
        
        this.name = "World";
        this.worldType = 0; // 0: Default, 1: Flat, 2: Small, 3: Large, 6: Debug
        this.savedData = null;
        this.worldId = worldId;
        this.gameMode = gameMode; // 0: Survival, 1: Creative
        
        this.spawnBiome = "all"; // plains, desert, snow, forest, all
        
        this.weather = "clear"; // "auto", "clear", "snow", "rain", "thunder"

        this.setSeed(seed);

        // One Block State
        this.oneBlock = {
            phase: 0,
            mined: 0,
            pos: {x: 0, y: 64, z: 0},
            nextChest: 20 + Math.floor(Math.random() * 16), // Random between 20-35
            nextMob: 17 + Math.floor(Math.random() * 19) // Random between 17-35
        };
        
        // One Block Phases Configuration
        this.oneBlockPhases = [
            {
                name: "Plains", 
                threshold: 0, 
                blocks: [17, 200, 18, 203, 5, 2], // Logs, Leaves, Planks (Oak & Birch)
                mobs: ["EntityCow", "EntityPig", "EntityChicken", "EntitySheep", "EntityVillager"],
                chest: "plains"
            },
            {
                name: "Stone Age", 
                threshold: 100, 
                blocks: [4, 13, 1, 1, 16], // Gravel, Cobblestone, Stone, Stone, Coal Ore
                mobs: ["EntitySheep", "EntityCow"],
                chest: "stoneage"
            },
            {
                name: "Underground 1", 
                threshold: 140, 
                blocks: [1, 220, 221, 222, 16, 15], 
                mobs: ["EntityZombie", "EntityCreeper", "EntitySpider", "EntitySkeleton"],
                chest: "underground"
            },
            {
                name: "Plains 2", 
                threshold: 240, 
                blocks: [209, 200, 17, 2, 82], // Spruce Log, Birch Log, Oak Log, Grass, Clay
                mobs: ["EntityVillager", "EntityCow", "EntitySheep", "EntityPig"],
                chest: "plains2"
            },
            {
                name: "Underground 2", 
                threshold: 290, 
                blocks: [1, 220, 221, 222, 14, 56, 73, 129], // Rare Ores
                mobs: ["EntityEnderman", "EntityCreeper", "EntitySkeleton", "EntityZombie", "EntitySlime"],
                chest: "underground2"
            },
            {
                name: "Winter", 
                threshold: 390, 
                blocks: [80, 210, 212], // Snow, Spruce Planks, Spruce Leaves
                mobs: ["EntityZombie", "EntitySnowGolem", "EntitySnowZombie"],
                chest: "winter"
            },
            {
                name: "Desert", 
                threshold: 490, 
                blocks: [12, 24], // Sand, Sandstone
                mobs: ["EntityHusk", "EntityCreeper"],
                chest: "desert"
            },
            {
                name: "Plenty", 
                threshold: 590, 
                blocks: [], // Mix of everything
                mobs: ["EntityZombie", "EntityCreeper", "EntitySpider", "EntityVillager"],
                chest: "plenty"
            }
        ];

        // Tile Entities map (key: "x,y,z", value: object)
        this.tileEntities = new Map();
        // Spatial index prevents every previously visited chest/sign/command
        // block from being scanned every tick after its chunk is unloaded.
        this.tileEntitiesByChunk = new Map();

        // Independent persisted broadcast cameras (not blocks/tile entities).
        this.broadcastCameras = [];

        // Custom Superflat Layers
        // Default: Bedrock (1), Dirt (2), Grass (1)
        this.superflatLayers = [
            { id: 7, count: 1 },
            { id: 3, count: 2 },
            { id: 2, count: 1 }
        ];
        
        // Multiplayer persistent player data (username -> data object)
        this.playerData = {};

        this.gameRules = {
            doMobSpawning: true,
            keepInventory: false,
            cheatsEnabled: false,
            showDayCounter: false,
            generateStructures: true
        };

        this.pathFinder = new PathFinder(this);
    }

    setSeed(seed) {
        this.seed = seed;
        if (this.worldType === 5) {
            this.generator = new WorldGeneratorV2(this, seed);
        } else {
            this.generator = new WorldGenerator(this, seed);
        }
        this.random = new Random(seed);
    }

    getBiomeNoiseAt(x, z) {
        // Force plains biome in flat/debug world types
        if (this.worldType === 1 || this.worldType === 6) return 0;

        // Use the centralized warped biome generator for consistency
        if (this.generator && typeof this.generator.getBiomeNoiseAt === 'function') {
            return this.generator.getBiomeNoiseAt(x, z);
        }
        
        return 0;
    }

    isSnowBiome(x, z) {
        return this.getBiomeNoiseAt(x, z) < -0.62;
    }

    isDesertBiome(x, z) {
        return this.getBiomeNoiseAt(x, z) > 0.68;
    }

    getSeed() {
        return this.seed;
    }

    scheduleBlockUpdate(x, y, z, delay) {
        const key = x + "," + y + "," + z;
        // Water, lava, redstone, and foliage can all request the same
        // position repeatedly. Keep one pending task per block so the queue
        // cannot grow without bound during long sessions.
        if (this.scheduledUpdateKeys.has(key)) return;
        if (this.scheduledUpdates.length >= 10000) return;
        this.scheduledUpdateKeys.add(key);
        this.scheduledUpdates.push({x: x, y: y, z: z, time: this.time + delay, key});
    }

    queueLeafDecay(x, y, z) {
        const key = x + "," + y + "," + z;
        if (this.leafDecayKeys.has(key)) return;
        this.leafDecayKeys.add(key);
        this.leafDecayQueue.push({x, y, z, key});
    }

    onTick() {
        // Last-resort recovery for rapid creative deletes or any code path
        // that clears the One Block without going through setBlockAt().
        if (this._gameType === 'oneblock' && this.oneBlock && this.chunkExists(0, 0)) {
            this.ensureOneBlock();
        }

        // Continuous 3D chunk loading
        if (this.minecraft.player) {
            const player = this.minecraft.player;
            let cameraChunkX = Math.floor(player.x) >> 4;
            let cameraChunkY = Math.floor(player.y) >> 4;
            let cameraChunkZ = Math.floor(player.z) >> 4;

            // Scan only after crossing a chunk boundary, or after a previous
            // scan found missing chunks and its queue has drained.
            const movedChunk = this._lastCameraChunkX !== cameraChunkX ||
                this._lastCameraChunkY !== cameraChunkY ||
                this._lastCameraChunkZ !== cameraChunkZ;
            if (movedChunk || (this.chunkLoadQueue.length === 0 && this._lastChunkScanFoundMissing)) {
                const normalDistance=this.minecraft.settings.viewDistance;
                // LOD distance is an outer streaming radius in blocks. This
                // lets simplified terrain remain visible beyond the normal
                // full-detail render distance without forcing that setting up.
                let renderDistance=this.minecraft.settings.lodRendering===false?normalDistance:Math.max(normalDistance,Math.ceil((this.minecraft.settings.lodRenderDistance||64)/16));
                let foundMissing = false;
                
                // Identify missing columns within range
                for (let x = -renderDistance; x <= renderDistance; x++) {
                    for (let z = -renderDistance; z <= renderDistance; z++) {
                        let cx = cameraChunkX + x;
                        let cz = cameraChunkZ + z;
                        
                        if (!this.chunkExists(cx, cz)) {
                            const key = cx + "," + cz;
                            if (!this.chunkLoadSet.has(key)) {
                                // Factor in 3D distance for prioritization
                                let distSq = x * x + z * z + (cameraChunkY - 4)**2; 
                                this.chunkLoadQueue.push({ x: cx, z: cz, d: distSq });
                                this.chunkLoadSet.add(key);
                                foundMissing = true;
                            }
                        }
                    }
                }
                
                // Prioritize chunks closest to player horizontally and at similar Y level
                if (this.chunkLoadQueue.length > 0) {
                    // Pop from the end below, avoiding Array.shift()'s O(n)
                    // copy for every generated chunk.
                    this.chunkLoadQueue.sort((a, b) => b.d - a.d);
                }
                
                this._lastCameraChunkX = cameraChunkX;
                this._lastCameraChunkY = cameraChunkY;
                this._lastCameraChunkZ = cameraChunkZ;
                this._lastChunkScanFoundMissing = foundMissing;
            }
        }

        // Chunk generation now runs once per rendered frame with a time
        // budget (see processChunkLoading), instead of in fixed ticks where
        // several catch-up ticks in one frame could generate many chunks.

        // Garbage collect distant chunks periodically (every 10 seconds)
        if (this.time % 200 === 0 && this.minecraft.player) {
            this.garbageCollectChunks();
        }

        // Physics for gravity-enabled blocks
        if (this.time % 2 === 0) {
            const player = this.minecraft.player;
            const playerChunkX = player ? (Math.floor(player.x) >> 4) : 0;
            const playerChunkZ = player ? (Math.floor(player.z) >> 4) : 0;
            for (const chunk of this.chunks.values()) {
                // Gravity checks only matter near active players. Sampling
                // every loaded chunk multiplied chunk-load cost at high view
                // distances.
                if (!chunk.loaded ||
                    Math.max(Math.abs(chunk.x - playerChunkX), Math.abs(chunk.z - playerChunkZ)) > 4) {
                    continue;
                }
                // Periodically check random blocks in chunk for gravity
                for (let i = 0; i < 20; i++) {
                    const rx = this.random.nextInt(16), rz = this.random.nextInt(16), ry = this.random.nextInt(127);
                    const id = chunk.getBlockAt(rx, ry, rz);
                    if (id !== 0) {
                        const block = Block.getById(id);
                        if (block && block.hasGravity()) {
                            const wx = (chunk.x << 4) + rx, wz = (chunk.z << 4) + rz;
                            // Trigger gravity check via neighbor update mechanism or direct call
                            block.updateTick(this, wx, ry, wz);
                        }
                    }
                }
            }
        }

        // Despawn hostiles in Peaceful
        if (this.minecraft.settings.difficulty === 0) {
            for (let i = this.entities.length - 1; i >= 0; i--) {
                let e = this.entities[i];
                const n = e.constructor.name;
                if (n === "EntityZombie" || n === "EntityCreeper" || n === "EntitySkeleton" || n === "EntitySnowZombie" || n === "EntityHusk" || n === "EntityDrowned") {
                    this.removeEntityById(e.id);
                }
            }
        }

        // Update skylight subtracted (To make the night dark)
        let lightLevel = this.calculateSkylightSubtracted(1.0);
        if (lightLevel !== this.skylightSubtracted) {
            this.skylightSubtracted = lightLevel;

            // Day/night brightness is baked into the meshes, so sections need
            // a rebuild. Only mark non-empty sections of loaded chunks; the
            // renderer's budgeted, nearest-first queue spreads the work out.
            for (const chunk of this.chunks.values()) {
                if (!chunk.loaded) continue;
                for (let i = 0; i < chunk.sections.length; i++) {
                    const section = chunk.sections[i];
                    if (!section.isEmpty()) section.isModified = true;
                }
            }
        }


        // Update tile entities
        for (const [key, te] of this.loadedTileEntities()) {
            let coords = key.split(",");
            let x = parseInt(coords[0]);
            let y = parseInt(coords[1]);
            let z = parseInt(coords[2]);
            
            // Check if chunk is loaded before performing orphan cleanup
            if (this.chunkExists(x >> 4, z >> 4)) {
                let typeId = this.getBlockAt(x, y, z);
                if (typeId !== 0) {
                    let block = Block.getById(typeId);
                    if (block && typeof block.updateTileEntity === 'function') {
                        block.updateTileEntity(this, x, y, z, te);
                    }
                } else {
                    // Cleanup orphan TE only if block is truly air (0) in a loaded chunk
                    this.removeTileEntity(x, y, z);
                }
            }
        }

        // Process scheduled block updates
        if (this.scheduledUpdates.length > 0) {
            let remainingUpdates = [];
            // Process updates that are due
            for (let i = 0; i < this.scheduledUpdates.length; i++) {
                let update = this.scheduledUpdates[i];
                if (this.time >= update.time) {
                    this.scheduledUpdateKeys.delete(update.key || (update.x + "," + update.y + "," + update.z));
                    let typeId = this.getBlockAt(update.x, update.y, update.z);
                    if (typeId !== 0) {
                        let block = Block.getById(typeId);
                        if (block) {
                            block.updateTick(this, update.x, update.y, update.z);
                        }
                    }
                } else {
                    remainingUpdates.push(update);
                }
            }
            this.scheduledUpdates = remainingUpdates;
        }

        // Update entities (remote players, etc.)
        const playerX = this.minecraft.player ? Math.floor(this.minecraft.player.x) >> 4 : 0;
        const playerZ = this.minecraft.player ? Math.floor(this.minecraft.player.z) >> 4 : 0;

        for (let i = this.entities.length - 1; i >= 0; i--) {
            let entity = this.entities[i];

            // Check if entity is in a loaded chunk
            let chunkX = Math.floor(entity.x) >> 4;
            let chunkZ = Math.floor(entity.z) >> 4;
            let chunkKey = chunkX + "," + chunkZ;
            let chunk = this.chunks.get(chunkKey);

            let isChunkLoaded = chunk && chunk.loaded;
            let isPlayer = entity === this.minecraft.player || entity.constructor.name === "RemotePlayerEntity";

            if (isPlayer) {
                // Players are always ticked and have no unloaded timer
                entity.unloadedTicks = 0;
            } else {
                // 20-chunk despawn check (approx 320 blocks)
                // Fix: Prevent tamed entities from despawning
                const dx = Math.abs(chunkX - playerX);
                const dz = Math.abs(chunkZ - playerZ);
                if (Math.max(dx, dz) > 20 && !entity.isTamed) {
                    this.removeEntityById(entity.id);
                    continue;
                }

                if (!isChunkLoaded) {
                    // Entity is in an unloaded chunk
                    entity.unloadedTicks++;

                    // Unloaded wild entities are no longer useful to the
                    // simulation. Keeping passive mobs forever made the
                    // entity list grow every time the player explored.
                    // Tamed entities are retained for persistence.
                    if (!entity.isTamed && entity.unloadedTicks > 200) {
                        this.removeEntityById(entity.id);
                        continue;
                    }

                    // While unloaded, skip update (freezes position so they don't fall through floor)
                    continue; 
                } else {
                    // Chunk is loaded, reset unloaded timer
                    entity.unloadedTicks = 0;
                }
            }

            // The local player is updated separately in Minecraft.js to handle input/camera order
            if (entity !== this.minecraft.player) {
                entity.onUpdate();
            }
        }

        // Tick dropped items
        for (let i = this.droppedItems.length - 1; i >= 0; i--) {
            const item = this.droppedItems[i];

            // Check chunk loading for items
            let chunkX = Math.floor(item.x) >> 4;
            let chunkZ = Math.floor(item.z) >> 4;
            let chunk = this.chunks.get(chunkX + "," + chunkZ);

            // If chunk is not loaded, hide visual while giving the item a
            // short grace period before cleanup.
            if (!chunk || !chunk.loaded) {
                if (item.mesh) item.mesh.visible = false;
                item.unloadedTicks = (item.unloadedTicks || 0) + 1;
                // Items in evicted chunks are not simulated or persisted by
                // this client. Retaining their meshes forever made exploration
                // grow the dropped-item list without bound.
                if (item.unloadedTicks > 200) {
                    if (typeof item.kill === "function") item.kill();
                    this.minecraft.multiplayer?.remoteItems?.delete(item.serverID);
                    this.droppedItems.splice(i, 1);
                }
                continue;
            }
            item.unloadedTicks = 0;
            if (item.mesh) item.mesh.visible = true;

            item.onTick();
            if (item.isDead) {
                this.group.remove(item.mesh);
                this.droppedItems.splice(i, 1);
            }
        }

        // Update world time
        this.time++;

        // Process Sign Refresh Queue (Scheduled updates to fix lighting/mesh race conditions)
        if (this.signRefreshQueue.length > 0) {
            const BATCH_SIZE = 10;
            let processed = 0;
            for (let i = this.signRefreshQueue.length - 1; i >= 0; i--) {
                const task = this.signRefreshQueue[i];
                if (this.time >= task.time) {
                    // Trigger a refresh by clearing the cache entry if it exists
                    if (this.minecraft.worldRenderer && this.minecraft.worldRenderer.signCache) {
                        this.minecraft.worldRenderer.signCache.delete(task.key);
                    }
                    this.signRefreshQueue.splice(i, 1);
                    if (++processed >= BATCH_SIZE) break;
                }
            }
        }

        // Process Chunk Refresh Queue (Scheduled mesh rebuilds to ensure lighting consistency)
        if (this.chunkRefreshQueue.length > 0) {
            const BATCH_SIZE = 2; // Low batch size to prevent frame spikes
            let processed = 0;
            for (let i = this.chunkRefreshQueue.length - 1; i >= 0; i--) {
                const task = this.chunkRefreshQueue[i];
                if (this.time >= task.time) {
                    const chunk = this.chunks.get(task.x + "," + task.z);
                    if (chunk && chunk.loaded) {
                        chunk.setModifiedAllSections();
                    }
                    this.chunkRefreshQueue.splice(i, 1);
                    if (++processed >= BATCH_SIZE) break;
                }
            }
        }

        // Sequential Leaf Decay Processing (1 leaf per 2.5 seconds = 50 ticks)
        if (this.leafDecayQueue.length > 0) {
            this.leafDecayTimer++;
            if (this.leafDecayTimer >= 50) {
                this.leafDecayTimer = 0;
                
                // Process one leaf from the queue
                const leafPos = this.leafDecayQueue.shift();
                this.leafDecayKeys.delete(leafPos.key || (leafPos.x + "," + leafPos.y + "," + leafPos.z));
                const typeId = this.getBlockAt(leafPos.x, leafPos.y, leafPos.z);
                
                // Identify if it's a leaf block (Oak: 18, Birch: 203, Spruce: 212)
                if (typeId === 18 || typeId === 203 || typeId === 212) {
                    const block = Block.getById(typeId);
                    if (block && typeof block.checkSupport === 'function') {
                        // Re-verify it's still unsupported before breaking
                        if (!block.checkSupport(this, leafPos.x, leafPos.y, leafPos.z)) {
                            block.destroy(this, leafPos.x, leafPos.y, leafPos.z);
                        } else {
                            // Support was restored, unmark decay bit
                            let meta = this.getBlockDataAt(leafPos.x, leafPos.y, leafPos.z);
                            this.setBlockDataAt(leafPos.x, leafPos.y, leafPos.z, meta & ~8);
                        }
                    }
                }
            }
        }



        // Natural Mob Spawning (Every 7 to 10 seconds = 140 to 200 ticks)
        // Ensure only the HOST or Singleplayer user triggers spawns in a shared world
        if (this.time >= (this._nextSpawnTick || 0)) {
            const mp = this.minecraft.multiplayer;
            const isLocalOrHost = !mp || !mp.connected || mp.isHosting;
            
            if (isLocalOrHost) {
                if (this.dimension !== -1 || (this.generator && this.generator.biomeGenerator)) {
                    this.updateMobSpawning();
                    // Randomized interval: 7-10 seconds (140-200 ticks)
                    this._nextSpawnTick = this.time + 140 + Math.floor(Math.random() * 61);
                }
            }
        }

        // Random display ticks for particles (Torches, etc)
        if (this.minecraft.player && this.time % 2 === 0) {
            this.randomDisplayTick();
        }
    }

    randomDisplayTick() {
        const p = this.minecraft.player;
        const range = 16;
        // Particle probes are intentionally bounded; 1024 world lookups every
        // 100ms was a sizable background CPU cost while exploring.
        const iterations = this.minecraft.settings.particles === 0 ? 96 : 256;
        for (let i = 0; i < iterations; i++) {
            let x = Math.floor(p.x + (this.random.nextFloat() - this.random.nextFloat()) * range);
            let y = Math.floor(p.y + (this.random.nextFloat() - this.random.nextFloat()) * range);
            let z = Math.floor(p.z + (this.random.nextFloat() - this.random.nextFloat()) * range);

            let id = this.getBlockAt(x, y, z);
            if (id === BlockRegistry.TORCH.getId()) {
                // Increased probability for more frequent torch particles
                if (Math.random() > 0.12) continue;

                // Spawn flame and smoke particles on torch
                let data = this.getBlockDataAt(x, y, z) & 7;
                let px = x + 0.5;
                let py = y + 0.7;
                let pz = z + 0.5;

                if (data === 1) { px -= 0.27; py += 0.22; }
                else if (data === 2) { px += 0.27; py += 0.22; }
                else if (data === 3) { pz -= 0.27; py += 0.22; }
                else if (data === 4) { pz += 0.27; py += 0.22; }

                this.minecraft.particleManager.spawnFlameParticle(this, px, py, pz, 0, 0.01, 0, 0.5);
                // Smoke follows the same interval but with its own slight randomization
                if (Math.random() < 0.7) {
                    this.minecraft.particleManager.spawnTorchSmoke(this, px, py, pz);
                }
            } else if (id === BlockRegistry.LAVA.getId()) {
                // 8% chance per lava block to have a lava pop particle jump out
                if (Math.random() < 0.08 && this.getBlockAt(x, y + 1, z) === 0) {
                    this.minecraft.particleManager.spawnLavaPop(this, x + 0.5, y + 1.0, z + 0.5);
                }
            } else if (id === BlockRegistry.FURNACE.getId()) {
                let data = this.getBlockDataAt(x, y, z);
                if ((data & 4) !== 0) { // Is Lit
                    // Increased emission rate (from 0.15 to 0.45)
                    if (Math.random() > 0.45) continue;
                    
                    let dir = data & 3;
                    let px = x + 0.5, py = y + 0.5, pz = z + 0.5;
                    // Slightly further out (from 0.52 to 0.57) to be more visible
                    const offset = 0.57;
                    
                    // Meta: 0=South, 1=West, 2=North, 3=East
                    if (dir === 0) pz += offset;
                    else if (dir === 1) px -= offset;
                    else if (dir === 2) pz -= offset;
                    else if (dir === 3) px += offset;
                    
                    this.minecraft.particleManager.spawnFlameParticle(this, px, py - 0.2, pz, 0, 0, 0, 0.4);
                    // Add secondary smoke for furnace
                    if (Math.random() < 0.5) {
                        this.minecraft.particleManager.spawnCustomSmoke(this, px, py - 0.1, pz, 0x333333);
                    }
                }
            }
        }
    }

    updateMobSpawning() {
        if (this.gameRules.doMobSpawning === false) return;

        // Only count currently loaded mobs toward the 24-mob cap (raised slightly for underground)
        let loadedMobCount = 0;
        for (const e of this.entities) {
            const isPlayer = e === this.minecraft.player || e.constructor.name === "RemotePlayerEntity";
            if (!isPlayer && e.unloadedTicks === 0) {
                loadedMobCount++;
            }
        }

        if (loadedMobCount >= 24) return;

        // Requirement: Only spawn in chunks dark for more than 5 seconds (100 ticks)
        const eligibleChunks = Array.from(this.chunks.values()).filter(c => 
            c.loaded && (this.time - c.loadTick >= 100)
        );

        if (eligibleChunks.length === 0) return;

        // Perform multiple spawn attempts per tick to populate caves and surface
        const ATTEMPTS = 3;
        for (let i = 0; i < ATTEMPTS; i++) {
            const chunk = eligibleChunks[Math.floor(Math.random() * eligibleChunks.length)];
            this.attemptSpawnInChunk(chunk);
        }
    }

    attemptSpawnInChunk(chunk) {
        // Pick random position in chunk
        const rx = this.random.nextInt(16);
        const rz = this.random.nextInt(16);
        const wx = (chunk.x << 4) + rx;
        const wz = (chunk.z << 4) + rz;

        // Requirement: Player must be more than 20 blocks away
        const p = this.minecraft.player;
        if (p) {
            const dx = (wx + 0.5) - p.x;
            const dz = (wz + 0.5) - p.z;
            const dy = (this.getHighestBlockAt(wx, wz) + 1) - p.y;
            // 20 block radius check
            if (dx * dx + dy * dy + dz * dz < 400) return false;
        }
        
        // Scan multiple vertical layers to allow underground spawning
        // Pick a random starting Y and scan downwards for a suitable floor
        let startY = this.random.nextInt(120) + 4;
        let foundY = -1;
        
        for (let y = startY; y > 4; y--) {
            let id = this.getBlockAt(wx, y, wz);
            let below = this.getBlockAt(wx, y - 1, wz);
            let head = this.getBlockAt(wx, y + 1, wz);
            
            // Check for 2 blocks of air over a solid block
            if (id === 0 && head === 0 && below !== 0) {
                let blockBelow = Block.getById(below);
                if (blockBelow && blockBelow.isSolid() && !blockBelow.isLiquid()) {
                    foundY = y;
                    break;
                }
            }
        }

        if (foundY === -1) return false;
        let y = foundY;
        
        let isDesert = false;
        if (this.generator && this.generator.biomeGenerator) {
            const biomeVal = this.getBiomeNoiseAt(wx, wz);
            isDesert = biomeVal > 0.68;
        }

        const groundId = this.getBlockAt(wx, y - 1, wz);
        let light = this.getTotalLightAt(wx, y, wz);
        
        // If in Overworld and high up but light is 0, it might be an un-updated sky light
        if (light === 0 && this.dimension !== -1 && this.isAboveGround(wx, y, wz)) {
            light = 15;
        }

        // Requirements for hostile mobs: Light <= 7
        const isDark = light <= 7;

        // Passive Mobs Spawning (Surface only, Light >= 9)
        if (light >= 9 && groundId === BlockRegistry.GRASS.getId() && this.isAboveGround(wx, y, wz)) {
            // Lowered spawn frequency for passive mobs
            if (this.random.nextFloat() > 0.1) return false;

            const r = this.random.nextInt(10);
            let passiveType = EntityCow;
            if (r < 3) passiveType = EntityPig;
            else if (r < 6) passiveType = EntityChicken;
            else if (r < 9) passiveType = EntitySheep;
            else passiveType = EntityHorse; // Reduced horse chance significantly (10% of passive spawns)

            // Spawn family: 1-3 mobs
            let count = 1 + this.random.nextInt(3);
            for (let j = 0; j < count; j++) {
                const mob = new passiveType(this.minecraft, this);
                mob.setPosition(wx + 0.5 + (this.random.nextFloat() - 0.5) * 0.5, y, wz + 0.5 + (this.random.nextFloat() - 0.5) * 0.5);
                if (j === count - 1 && count > 1) mob.isChild = true;
                this.addEntity(mob);
            }
            return true;
        }

        // Hostile Mobs Spawning
        if (this.minecraft.settings.difficulty === 0 || !isDark) return false;

        const roll = this.random.nextFloat();
        let HostileType = EntityZombie;
        
        if (isDesert && this.isAboveGround(wx, y, wz)) HostileType = EntityHusk;
        else if (roll < 0.25) HostileType = EntitySkeleton;
        else if (roll < 0.45) HostileType = EntityCreeper;
        else if (roll < 0.60) HostileType = EntitySpider;
        else if (roll < 0.70) HostileType = EntityEnderman;
        else if (roll < 0.80) HostileType = EntitySlime;

        const mob = new HostileType(this.minecraft, this);
        mob.setPosition(wx + 0.5, y, wz + 0.5);
        this.addEntity(mob);
        return true;
    }

    getChunkAt(x, z) {
        let index = x + "," + z;
        let chunk = this.chunks.get(index);
        if (typeof chunk === 'undefined') {
            // Generate new chunk
            chunk = this.generator.newChunk(this, x, z);

            // CRITICAL FIX: Check for existing modifications in the savedData cache (session persistence)
            if (this.savedData && this.savedData.c && this.savedData.c[index]) {
                this.applyCompressedChunk(chunk, this.savedData.c[index]);
            }

            // Register and mark as loaded
            chunk.loaded = true;
            chunk.loadTick = this.time;
            this.chunks.set(index, chunk);

            // Do not spawn mobs synchronously for every generated chunk.
            // The regular capped spawn pass below handles natural spawning
            // without creating an exploration-sized entity backlog.

            // Complete, exact lighting in one flood-fill pass (also exchanges
            // light with already-lit neighbours). Doing it synchronously means
            // the chunk is never meshed with unfinished light, so sections are
            // not re-meshed over and over while light converges.
            this.lightEngine.initChunk(chunk);

            // Mark neighbors for rebuild to ensure seamless connections
            this.markNeighborsForRebuild(x, z);
            
            // Mark the new chunk itself as modified so it renders immediately
            chunk.setModifiedAllSections();

            // Populate the chunk
            if (this._gameType === 'skyblock' && x === 0 && z === 0 && !chunk.isTerrainPopulated) {
                this.populate(x, z);
            } else if (!chunk.isTerrainPopulated && this.chunkExists(x + 1, z + 1) && this.chunkExists(x, z + 1) && this.chunkExists(x + 1, z)) {
                this.populate(x, z);
            }
            if (this.chunkExists(x - 1, z) && !this.getChunkAt(x - 1, z).isTerrainPopulated && this.chunkExists(x - 1, z + 1) && this.chunkExists(x, z + 1) && this.chunkExists(x - 1, z)) {
                this.populate(x - 1, z);
            }
            if (this.chunkExists(x, z - 1) && !this.getChunkAt(x, z - 1).isTerrainPopulated && this.chunkExists(x + 1, z - 1) && this.chunkExists(x, z - 1) && this.chunkExists(x + 1, z)) {
                this.populate(x, z - 1);
            }
            if (this.chunkExists(x - 1, z - 1) && !this.getChunkAt(x - 1, z - 1).isTerrainPopulated && this.chunkExists(x - 1, z - 1) && this.chunkExists(x, z - 1) && this.chunkExists(x + 1, z)) {
                this.populate(x - 1, z - 1);
            }

            // Register in three.js
            this.group.add(chunk.group);
            chunk.group.updateMatrixWorld(true);
        }
        return chunk;
    }

    populate(x, z) {
        let chunk = this.getChunkAt(x, z);
        if (!chunk.isTerrainPopulated) {
            chunk.isTerrainPopulated = true;

            // Populate chunk. Mark as world-gen so the placed blocks don't
            // request out-of-budget "priority" re-meshes like player edits.
            const wasPopulating = this._populating;
            this._populating = true;
            try {
                this.generator.populateChunk(chunk.x, chunk.z);
            } finally {
                this._populating = wasPopulating;
            }
        }
    }

    isNeighborhoodReady(chunk) {
        const x = chunk.x, z = chunk.z;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (dx === 0 && dz === 0) continue;
                if (!this.chunks.has((x + dx) + "," + (z + dz))) return false;
            }
        }
        return true;
    }

    markNeighborsForRebuild(x, z) {
        const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
        for (let d of dirs) {
            let index = (x + d[0]) + "," + (z + d[1]);
            let chunk = this.chunks.get(index);
            if (chunk && chunk.loaded) {
                chunk.setModifiedAllSections();
            }
        }
    }

    getChunkAtBlock(x, y, z) {
        return this.getChunkAt(x >> 4, z >> 4).getSection(y >> 4);
    }

    // Legacy validation hooks. The flood-fill engine produces exact results,
    // so the old background re-check passes are no longer needed.
    queueChunkForLightCheck(chunk) {}

    periodicalLightValidation() {}

    processLightChecks() {}

    checkLightAt(x, y, z) {
        this.updateLight(EnumSkyBlock.SKY, x, y, z, x, y, z);
        this.updateLight(EnumSkyBlock.BLOCK, x, y, z, x, y, z);
    }

    /**
     * Generate queued chunks within a per-frame time budget. At most one
     * chunk per frame while playing so generation never stacks up into a
     * long frame; more while the loading screen is visible.
     */
    processChunkLoading() {
        if (this.chunkLoadQueue.length === 0) return 0;
        const isWorldLoading = !!(this.minecraft && this.minecraft.loadingScreen);
        const budgetMs = isWorldLoading ? 24 : 5;
        const maxChunks = isWorldLoading ? 16 : 1;
        const start = performance.now();
        let generated = 0;
        while (this.chunkLoadQueue.length > 0 && generated < maxChunks) {
            const task = this.chunkLoadQueue.pop();
            this.chunkLoadSet.delete(task.x + "," + task.z);
            if (this.chunkExists(task.x, task.z)) continue;
            this.getChunkAt(task.x, task.z);
            generated++;
            if (performance.now() - start > budgetMs) break;
        }
        return generated;
    }

    getBlockOpacityAt(x, y, z) {
        let typeId = this.getBlockAt(x, y, z);
        if (typeId === 0) return 0;
        let block = Block.getById(typeId);
        return block ? Math.round(block.getOpacity() * 15) : 0;
    }

    getCollisionBoxes(region) {
        let boundingBoxList = [];

        let minX = MathHelper.floor(region.minX);
        let maxX = MathHelper.floor(region.maxX + 1.0);
        // Expand minY check to include the block below if the collision search region 
        // is close to a block that might have an extended collision box (like fences/walls).
        let minY = MathHelper.floor(region.minY - 0.5); 
        let maxY = MathHelper.floor(region.maxY + 1.0);
        let minZ = MathHelper.floor(region.minZ);
        let maxZ = MathHelper.floor(region.maxZ + 1.0);

        for (let x = minX; x < maxX; x++) {
            for (let y = minY; y < maxY; y++) {
                for (let z = minZ; z < maxZ; z++) {
                    let typeId = this.getBlockAt(x, y, z);
                    if (typeId !== 0) {
                        let block = Block.getById(typeId);
                        if (block) {
                            let bb = block.getCollisionBoundingBox(this, x, y, z);
                            if (bb != null) {
                                if (Array.isArray(bb)) {
                                    for (let box of bb) {
                                        boundingBoxList.push(box.offset(x, y, z));
                                    }
                                } else {
                                    boundingBoxList.push(bb.offset(x, y, z));
                                }
                            }
                        }
                    }
                }
            }
        }
        return boundingBoxList;
    }

    updateLights() {
        // Apply all pending light edits in one exact pass. This runs right
        // before meshing each frame so edited sections are rebuilt once.
        this.lightEngine.flush();
        return false;
    }

    updateLight(sourceType, x1, y1, z1, x2, y2, z2, notifyNeighbor = true) {
        this.lightEngine.queueRegion(sourceType, x1, y1, z1, x2, y2, z2);
    }

    blockExists(x, y, z) {
        if (y < 0 || y >= World.TOTAL_HEIGHT) {
            return false;
        } else {
            return this.chunkExists(x >> 4, z >> 4);
        }
    }

    chunkExists(chunkX, chunkZ) {
        let index = chunkX + "," + chunkZ;
        let chunk = this.chunks.get(index);
        return typeof chunk !== 'undefined';
    }

    neighborLightPropagationChanged(sourceType, x, y, z, level) {
        if (y < 0 || y > 127) return;
        
        let current = this.getSavedLightValue(sourceType, x, y, z);
        if (current >= level) return; // Optimization: early exit if already bright enough

        if (sourceType === EnumSkyBlock.SKY) {
            if (this.isAboveGround(x, y, z)) {
                level = 15;
            }
        } else if (sourceType === EnumSkyBlock.BLOCK) {
            let typeId = this.getBlockAt(x, y, z);
            if (typeId !== 0) {
                let block = Block.getById(typeId);
                let blockLight = block.getLightValue();
                if (blockLight > level) level = blockLight;
            }
        }

        if (current !== level) {
            this.updateLight(sourceType, x, y, z, x, y, z);
        }
    }

    /**
     * Get the first non-solid block
     */
    getHeightAt(x, z) {
        if (!this.chunkExists(x >> 4, z >> 4)) {
            return 0;
        }
        return this.getChunkAt(x >> 4, z >> 4).getHeightAt(x & 15, z & 15);
    }

    /**
     * Get the highest solid block
     */
    getHighestBlockAt(x, z) {
        if (!this.chunkExists(x >> 4, z >> 4)) {
            return 0;
        }
        return this.getChunkAt(x >> 4, z >> 4).getHighestBlockAt(x & 15, z & 15);
    }

    /**
     * Is the highest solid block or above
     */
    isHighestBlock(x, y, z) {
        let chunk = this.getChunkAt(x >> 4, z >> 4)
        return chunk.isHighestBlock(x & 15, y, z & 15);
    }

    /**
     * Is above the highest solid block
     */
    isAboveGround(x, y, z) {
        let chunk = this.getChunkAt(x >> 4, z >> 4)
        return chunk.isAboveGround(x & 15, y, z & 15);
    }

    getTotalLightAt(x, y, z) {
        if (this.minecraft.player && this.minecraft.player.activeEffects.has("night_vision")) {
            return 15;
        }

        if (y < 0 || y > 127) return (this.dimension === 0 && y > 127) ? 15 : 0;
        
        const cx = x >> 4;
        const cz = z >> 4;
        
        let chunk;
        if (this._lastAccessChunk && this._lastAccessChunk.x === cx && this._lastAccessChunk.z === cz) {
            chunk = this._lastAccessChunk;
        } else {
            chunk = this.chunks.get(cx + "," + cz);
            if (chunk) this._lastAccessChunk = chunk;
        }

        if (chunk) {
            let section = chunk.getSection(y >> 4);
            let index = (y & 15) << 8 | (z & 15) << 4 | (x & 15);
            
            const dev = this.minecraft.devTools.lighting;
            let skyLight = (section.skyLight[index] - this.skylightSubtracted) * dev.sky;
            let blockLight = section.blockLight[index] * dev.block;
            
            return Math.max(skyLight, blockLight);
        }
        
        // Missing chunks must not act as skylight sources. Returning 15 here
        // made enclosed caves beside the streaming boundary look illuminated
        // until a later rebuild happened. Loaded chunk borders are refreshed
        // when the neighboring chunk becomes available.
        return 0;
    }

    getSavedLightValue(sourceType, x, y, z) {
        // Boundary check: sky is bright unless in Nether, void is dark
        if (y < 0 || y > 127) return (sourceType === EnumSkyBlock.SKY && this.dimension !== -1) ? 15 : 0;
        
        const cx = x >> 4;
        const cz = z >> 4;
        
        let chunk;
        if (this._lastAccessChunk && this._lastAccessChunk.x === cx && this._lastAccessChunk.z === cz) {
            chunk = this._lastAccessChunk;
        } else {
            chunk = this.chunks.get(cx + "," + cz);
            if (chunk) this._lastAccessChunk = chunk;
        }

        if (chunk && chunk.loaded) {
            return chunk.getSection(y >> 4).getLightAt(sourceType, x & 15, y & 15, z & 15);
        }
        
        // If a chunk is missing, keep it dark. Treating every missing
        // overworld cell above y=64 as skylit leaks daylight into caves at
        // streaming boundaries. The chunk-load border refresh restores sky
        // light as soon as the neighboring terrain exists.
        return 0;
    }

    setLightAt(sourceType, x, y, z, lightLevel) {
        if (!this.chunkExists(x >> 4, z >> 4)) {
            return;
        }

        let section = this.getChunkSectionAt(x >> 4, y >> 4, z >> 4)
        section.setLightAt(sourceType, x & 15, y & 15, z & 15, lightLevel);

        // Rebuild chunk
        this.onBlockChanged(x, y, z);
    }

    isSolidBlockAt(x, y, z) {
        let typeId = this.getBlockAt(x, y, z);
        return typeId !== 0 && Block.getById(typeId).isSolid();
    }

    isTranslucentBlockAt(x, y, z) {
        let typeId = this.getBlockAt(x, y, z);
        return typeId === 0 || Block.getById(typeId).isTranslucent();
    }

    tryToCreatePortal(x, y, z) {
        // Attempt X-axis (East-West) portal
        if (this.createPortal(x, y, z, 1, 0)) return true;
        // Attempt Z-axis (North-South) portal
        if (this.createPortal(x, y, z, 0, 1)) return true;
        return false;
    }

    createPortal(x, y, z, dirX, dirZ) {
        // Check for Obsidian frame
        // Width: 2 to 21 blocks
        // Height: 3 to 21 blocks
        // x,y,z is the potential bottom-left or bottom-right air block inside the portal? 
        // We need to find the bottom-most, 'left'-most position of the potential portal AIR.
        
        let width = 0;
        let height = 0;
        const OBSIDIAN = 49;
        const PORTAL = 90;

        // 1. Find bottom of the portal air space
        let bottomY = y;
        while (this.getBlockAt(x, bottomY - 1, z) === 0 && bottomY > 0) {
            bottomY--;
        }
        // Must be sitting on obsidian
        if (this.getBlockAt(x, bottomY - 1, z) !== OBSIDIAN) return false;

        // 2. Find left edge (move negative dir)
        let minX = x;
        let minZ = z;
        while (this.getBlockAt(minX - dirX, bottomY, minZ - dirZ) === 0) {
            minX -= dirX;
            minZ -= dirZ;
            // Limit search to prevent lag or huge portals
            if (Math.abs(minX - x) > 21 || Math.abs(minZ - z) > 21) return false;
        }
        // Left wall must be obsidian
        if (this.getBlockAt(minX - dirX, bottomY, minZ - dirZ) !== OBSIDIAN) return false;

        // 3. Scan width to the right
        let maxX = minX;
        let maxZ = minZ;
        while (this.getBlockAt(maxX, bottomY, maxZ) === 0) {
            // Check if ground below is obsidian
            if (this.getBlockAt(maxX, bottomY - 1, maxZ) !== OBSIDIAN) return false;
            
            maxX += dirX;
            maxZ += dirZ;
            width++;
            if (width > 21) return false;
        }
        // Right wall must be obsidian
        if (this.getBlockAt(maxX, bottomY, maxZ) !== OBSIDIAN) return false;

        if (width < 2) return false;

        // 4. Scan height and verify frame
        // For each column in width
        for (let w = 0; w < width; w++) {
            let cx = minX + w * dirX;
            let cz = minZ + w * dirZ;
            
            // Scan up
            let h = 0;
            while (this.getBlockAt(cx, bottomY + h, cz) === 0) {
                h++;
                if (h > 21) return false;
            }
            
            // Top block must be obsidian
            if (this.getBlockAt(cx, bottomY + h, cz) !== OBSIDIAN) return false;
            
            // Height consistency check
            if (height === 0) height = h;
            else if (height !== h) return false; // Not rectangular
        }

        if (height < 3) return false;

        // 5. Verify side walls (Obsidian columns)
        for (let h = 0; h < height; h++) {
            // Left column (minX - dirX)
            if (this.getBlockAt(minX - dirX, bottomY + h, minZ - dirZ) !== OBSIDIAN) return false;
            // Right column (maxX)
            if (this.getBlockAt(maxX, bottomY + h, maxZ) !== OBSIDIAN) return false;
        }

        // 6. Valid! Fill with portal blocks
        for (let w = 0; w < width; w++) {
            for (let h = 0; h < height; h++) {
                let cx = minX + w * dirX;
                let cz = minZ + w * dirZ;
                let cy = bottomY + h;
                
                this.setBlockAt(cx, cy, cz, PORTAL);
                // Optionally set metadata to indicate axis? (Not strictly needed for rendering simple blocks but useful for collision logic)
                // Meta 1 for X-axis (N/S facing), 2 for Z-axis (E/W facing)
                this.setBlockDataAt(cx, cy, cz, dirX === 1 ? 1 : 2);
            }
        }
        
        // Play sound
        this.minecraft.soundManager.playSound("fire.ignite", x+0.5, y+0.5, z+0.5, 1.0, 1.0);
        // Force rebuild
        if (this.minecraft.worldRenderer) this.minecraft.worldRenderer.flushRebuild = true;

        // Sync with multiplayer
        if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected) {
            // We need to sync all portal blocks.
            // Simplified: just update the one clicked + maybe others?
            // Actually tryToCreatePortal is run locally on click.
            // We should broadcast all changes. 
            // setBlockAt handles individual block broadcasts.
        }

        return true;
    }

    setBlockAt(x, y, z, type, data = 0, silent = false) {
        // Validate bounds to prevent crashes
        if (y < 0 || y >= World.TOTAL_HEIGHT) return;

        // Prevent placing liquid on liquid (Manual placement check)
        if (type === 9 || type === 10) {
            let current = this.getBlockAt(x, y, z);
            // Block if placing into any existing liquid to prevent infinite stacks
            if (current === 9 || current === 10) {
                return; 
            }
        }

        let chunk = this.getChunkAt(x >> 4, z >> 4);
        let prevId = chunk.getBlockAt(x & 15, y, z & 15);
        
        // Optimization: pass data directly to setBlockAt to ensure correct meta is 
        // present before onBlockAdded is called (fixes infinite tall grass growth).
        chunk.setBlockAt(x & 15, y, z & 15, type, data);

        // If block changed, remove tile entity
        // We do this before One Block regeneration so we don't delete the newly created chest's data
        if (prevId !== type) {
            this.removeTileEntity(x, y, z);
        }

        // Handle One Block regeneration if the block was removed by any
        // source (including very fast creative breaking).
        const wasOneBlockRemoval = type === 0 && this.isOneBlockPosition(x, y, z);
        if (wasOneBlockRemoval) this.ensureOneBlock();

        // Sync with multiplayer (ID and Meta) only for local changes
        // The nested regeneration already broadcasts the replacement block;
        // never send a stale air update after it.
        if (!wasOneBlockRemoval && this.minecraft.multiplayer && this.minecraft.multiplayer.connected && !this.minecraft.multiplayer.isProcessingRemoteUpdate) {
            this.minecraft.multiplayer.onBlockChanged(x, y, z, type, data);
        }

        // Light for this cell is queued by Chunk.setBlockAt and applied by
        // the light engine before the next mesh rebuild.

        if (silent) return;

        // Rebuild chunk
        this.onBlockChanged(x, y, z);

        // Notify neighbors
        this.notifyNeighborsOfStateChange(x, y, z, type);
    }

    isOneBlockPosition(x, y, z) {
        const ob = this.oneBlock;
        return this._gameType === 'oneblock' && !!ob &&
            x === ob.pos.x && y === ob.pos.y && z === ob.pos.z;
    }

    ensureOneBlock() {
        if (!this.isOneBlockPosition(this.oneBlock?.pos?.x, this.oneBlock?.pos?.y, this.oneBlock?.pos?.z)) return false;
        const pos = this.oneBlock.pos;
        if (this.getBlockAt(pos.x, pos.y, pos.z) !== 0 || this._isRegeneratingOneBlock) return false;

        this._isRegeneratingOneBlock = true;
        try {
            this.regenerateOneBlock();
            return true;
        } finally {
            this._isRegeneratingOneBlock = false;
        }
    }

    getTileEntity(x, y, z) {
        return this.tileEntities.get(x + "," + y + "," + z);
    }

    setTileEntity(x, y, z, data) {
        const key=x+","+y+","+z,chunkKey=(x>>4)+","+(z>>4);
        this.tileEntities.set(key, data);
        let bucket=this.tileEntitiesByChunk.get(chunkKey);if(!bucket){bucket=new Set();this.tileEntitiesByChunk.set(chunkKey,bucket);}bucket.add(key);
        // Mark chunk as modified when tile entity data changes
        this.onBlockChanged(x, y, z);
        const chunk = this.getChunkAt(x >> 4, z >> 4);
        if (chunk) chunk.markDirty();
    }

    removeTileEntity(x, y, z) {
        const key=x+","+y+","+z,chunkKey=(x>>4)+","+(z>>4);this.tileEntities.delete(key);
        const bucket=this.tileEntitiesByChunk.get(chunkKey);if(bucket){bucket.delete(key);if(!bucket.size)this.tileEntitiesByChunk.delete(chunkKey);}
    }

    *loadedTileEntities() {
        for(const chunk of this.chunks.values()){
            if(!chunk.loaded)continue;const bucket=this.tileEntitiesByChunk.get(chunk.x+","+chunk.z);if(!bucket)continue;
            for(const key of bucket){const te=this.tileEntities.get(key);if(te)yield [key,te];}
        }
    }

    notifyNeighborsOfStateChange(x, y, z, neighborId) {
        this.notifyBlockChange(x - 1, y, z, neighborId, x, y, z);
        this.notifyBlockChange(x + 1, y, z, neighborId, x, y, z);
        this.notifyBlockChange(x, y - 1, z, neighborId, x, y, z);
        this.notifyBlockChange(x, y + 1, z, neighborId, x, y, z);
        this.notifyBlockChange(x, y, z - 1, neighborId, x, y, z);
        this.notifyBlockChange(x, y, z + 1, neighborId, x, y, z);
    }

    notifyBlockChange(x, y, z, neighborId, fromX, fromY, fromZ) {
        let typeId = this.getBlockAt(x, y, z);
        if (typeId !== 0) {
            let block = Block.getById(typeId);
            if (block) {
                block.onNeighborBlockChange(this, x, y, z, neighborId, fromX, fromY, fromZ);
            }
        }
    }

    setBlockDataAt(x, y, z, data) {
        this.getChunkAt(x >> 4, z >> 4).setBlockDataAt(x & 15, y, z & 15, data);
        
        // Trigger visual update
        this.onBlockChanged(x, y, z);
        
        // Notify neighbors of state change
        let typeId = this.getBlockAt(x, y, z);
        this.notifyNeighborsOfStateChange(x, y, z, typeId);

        // Sync with multiplayer (ID + New Meta)
        if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected) {
            this.minecraft.multiplayer.onBlockChanged(x, y, z, typeId, data);
        }
    }

    getBlockAt(x, y, z) {
        if (y < 0 || y > 127) return 0;
        
        const cx = x >> 4;
        const cz = z >> 4;
        
        // Fast local chunk caching to avoid Map lookups for repeated accesses in the same chunk
        let chunk = this._lastAccessChunk;
        if (!chunk || chunk.x !== cx || chunk.z !== cz) {
            chunk = this.chunks.get(cx + "," + cz);
            if (!chunk) return 0;
            this._lastAccessChunk = chunk;
        }

        return chunk.sections[y >> 4].getBlockAt(x & 15, y & 15, z & 15);
    }

    getBlockDataAt(x, y, z) {
        if (y < 0 || y > 127) return 0;
        
        const cx = x >> 4;
        const cz = z >> 4;
        
        let chunk = this._lastAccessChunk;
        if (!chunk || chunk.x !== cx || chunk.z !== cz) {
            chunk = this.chunks.get(cx + "," + cz);
            if (!chunk) return 0;
            this._lastAccessChunk = chunk;
        }

        return chunk.sections[y >> 4].getBlockDataAt(x & 15, y & 15, z & 15);
    }

    getBlockAtFace(x, y, z, face) {
        const tx = x + face.x;
        const ty = y + face.y;
        const tz = z + face.z;
        
        if (ty < 0 || ty > 127) return 0;
        
        const cx = tx >> 4;
        const cz = tz >> 4;
        
        let chunk;
        if (this._lastAccessChunk && this._lastAccessChunk.x === cx && this._lastAccessChunk.z === cz) {
            chunk = this._lastAccessChunk;
        } else {
            chunk = this.chunks.get(cx + "," + cz);
            if (chunk) this._lastAccessChunk = chunk;
        }

        if (chunk) {
            return chunk.getSection(ty >> 4).getBlockAt(tx & 15, ty & 15, tz & 15);
        }
        return 0;
    }

    getChunkSectionAt(chunkX, layerY, chunkZ) {
        return this.getChunkAt(chunkX, chunkZ).getSection(layerY);
    }

    onBlockChanged(x, y, z) {
        this.setModified(x - 1, y - 1, z - 1, x + 1, y + 1, z + 1, !this._populating);
    }

    setModified(minX, minY, minZ, maxX, maxY, maxZ, priority = false) {
        // To chunk coordinates
        minX = minX >> 4;
        maxX = maxX >> 4;
        minY = minY >> 4;
        maxY = maxY >> 4;
        minZ = minZ >> 4;
        maxZ = maxZ >> 4;

        // Minimum and maximum y
        minY = Math.max(0, minY);
        maxY = Math.min(15, maxY);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    if (this.chunkExists(x, z)) {
                        const section = this.getChunkSectionAt(x, y, z);
                        section.isModified = true;
                        if (priority) section.priority = true;
                    }
                }
            }
        }
    }

    rayTraceBlocks(from, to, stopOnLiquid = false) {
        let toX = MathHelper.floor(to.x);
        let toY = MathHelper.floor(to.y);
        let toZ = MathHelper.floor(to.z);

        let x = MathHelper.floor(from.x);
        let y = MathHelper.floor(from.y);
        let z = MathHelper.floor(from.z);

        let blockId = this.getBlockAt(x, y, z);
        let block = Block.getById(blockId);

        if (block != null && (block.canInteract() || (stopOnLiquid && block.isLiquid()))) {
            let hit = block.collisionRayTrace(this, x, y, z, from, to);
            if (hit != null) {
                return hit;
            }
        }

        let lastHit = null;

        let counter = 200;
        while (counter-- >= 0) {
            if (x === toX && y === toY && z === toZ) {
                return lastHit;
            }

            let hitX = true;
            let hitY = true;
            let hitZ = true;

            let nearestX1 = 999.0;
            let nearestY1 = 999.0;
            let nearestZ1 = 999.0;

            if (toX > x) {
                nearestX1 = x + 1.0;
            } else if (toX < x) {
                nearestX1 = x;
            } else {
                hitX = false;
            }

            if (toY > y) {
                nearestY1 = y + 1.0;
            } else if (toY < y) {
                nearestY1 = y;
            } else {
                hitY = false;
            }

            if (toZ > z) {
                nearestZ1 = z + 1.0;
            } else if (toZ < z) {
                nearestZ1 = z;
            } else {
                hitZ = false;
            }

            let nearestX = 999.0;
            let nearestY = 999.0;
            let nearestZ = 999.0;

            let diffX = to.x - from.x;
            let diffY = to.y - from.y;
            let diffZ = to.z - from.z;

            if (hitX) {
                nearestX = (nearestX1 - from.x) / diffX;
            }
            if (hitY) {
                nearestY = (nearestY1 - from.y) / diffY;
            }
            if (hitZ) {
                nearestZ = (nearestZ1 - from.z) / diffZ;
            }

            if (nearestX === -0.0) {
                nearestX = -1.0E-4;
            }
            if (nearestY === -0.0) {
                nearestY = -1.0E-4;
            }
            if (nearestZ === -0.0) {
                nearestZ = -1.0E-4;
            }

            let face;
            if (nearestX < nearestY && nearestX < nearestZ) {
                face = toX > x ? EnumBlockFace.WEST : EnumBlockFace.EAST;
                from = new Vector3(nearestX1, from.y + diffY * nearestX, from.z + diffZ * nearestX);
            } else if (nearestY < nearestZ) {
                face = toY > y ? EnumBlockFace.BOTTOM : EnumBlockFace.TOP;
                from = new Vector3(from.x + diffX * nearestY, nearestY1, from.z + diffZ * nearestY);
            } else {
                face = toZ > z ? EnumBlockFace.NORTH : EnumBlockFace.SOUTH;
                from = new Vector3(from.x + diffX * nearestZ, from.y + diffY * nearestZ, nearestZ1);
            }

            x = MathHelper.floor(from.x) - (face === EnumBlockFace.EAST ? 1 : 0);
            y = MathHelper.floor(from.y) - (face === EnumBlockFace.TOP ? 1 : 0);
            z = MathHelper.floor(from.z) - (face === EnumBlockFace.SOUTH ? 1 : 0);

            let blockId = this.getBlockAt(x, y, z);
            let block = Block.getById(blockId);

            if (block != null && (block.canInteract() || (stopOnLiquid && block.isLiquid()))) {
                let hit = block.collisionRayTrace(this, x, y, z, from, to);
                if (hit != null) {
                    return hit;
                }
            }
        }

        return lastHit;
    }

    getCelestialAngle(partialTicks) {
        return MathHelper.calculateCelestialAngle(this.time, partialTicks);
    }

    getTemperature(x, y, z) {
        return 0.75; // TODO implement biomes
    }

    getHumidity(x, y, z) {
        return 0.85; // TODO implement biomes
    }

    getSkyColor(x, z, partialTicks) {
        let angle = this.getCelestialAngle(partialTicks);
        let brightness = Math.cos(angle * 3.141593 * 2.0) * 2.0 + 0.5;

        if (brightness < 0.0) {
            brightness = 0.0;
        }
        if (brightness > 1.0) {
            brightness = 1.0;
        }

        let temperature = this.getTemperature(x, z);
        let rgb = this.getSkyColorByTemp(temperature);

        let red = (rgb >> 16 & 0xff) / 255;
        let green = (rgb >> 8 & 0xff) / 255;
        let blue = (rgb & 0xff) / 255;

        red *= brightness;
        green *= brightness;
        blue *= brightness;

        return new Vector3(red, green, blue);
    }

    getFogColor(partialTicks) {
        let angle = this.getCelestialAngle(partialTicks);
        let rotation = Math.cos(angle * Math.PI * 2.0) * 2.0 + 0.5;
        rotation = MathHelper.clamp(rotation, 0.0, 1.0);

        let x = 0.7529412;
        let y = 0.84705883;
        let z = 1.0;

        x = x * (rotation * 0.94 + 0.06);
        y = y * (rotation * 0.94 + 0.06);
        z = z * (rotation * 0.91 + 0.09);

        return new Vector3(x, y, z);
    }

    getSunriseSunsetColor(partialTicks) {
        let angle = this.getCelestialAngle(partialTicks);
        let rotation = Math.cos(angle * Math.PI * 2.0);

        let min = 0;
        let max = 0.4;

        // Check if rotation is inside of sunrise or sunset
        if (rotation >= -max && rotation <= max) {
            let factor = ((rotation - min) / max) * 0.5 + 0.5;
            let strength = Math.pow(1.0 - (1.0 - Math.sin(factor * Math.PI)) * 0.99, 2);

            // Calculate colors for sunrise and sunset
            return new Vector4(
                factor * 0.3 + 0.7,
                factor * factor * 0.7 + 0.2,
                0.2,
                strength
            );
        } else {
            return null;
        }
    }

    getStarBrightness(partialTicks) {
        let angle = this.getCelestialAngle(partialTicks);
        let rotation = 1.0 - (Math.cos(angle * Math.PI * 2.0) * 2.0 + 0.75);
        rotation = MathHelper.clamp(rotation, 0.0, 1.0);
        return rotation * rotation * 0.5;
    }

    getLightBrightnessForEntity(entity) {
        let level = this.getTotalLightAt(Math.floor(entity.x), Math.floor(entity.y), Math.floor(entity.z));
        return Math.max(level / 15, 0.1);
    }

    getLightBrightness(x, y, z) {
        let level = this.getTotalLightAt(x, y, z);
        // Nether dimension has a higher minimum ambient brightness
        const minBrightness = this.dimension === -1 ? 0.35 : 0.1;
        return Math.max(level / 15, minBrightness);
    }

    getSkyColorByTemp(temperature) {
        temperature /= 3;
        if (temperature < -1) {
            temperature = -1;
        }
        if (temperature > 1.0) {
            temperature = 1.0;
        }
        return MathHelper.hsbToRgb(0.6222222 - temperature * 0.05, 0.5 + temperature * 0.1, 1.0);
    }

    calculateSkylightSubtracted(partialTicks) {
        let angle = this.getCelestialAngle(partialTicks);
        let level = 1.0 - (Math.cos(angle * 3.141593 * 2.0) * 2.0 + 0.5);
        if (level < 0.0) {
            level = 0.0;
        }
        if (level > 1.0) {
            level = 1.0;
        }
        return Math.floor(level * 11);
    }

    addEntity(entity) {
        this.entities.push(entity);
        this.group.add(entity.renderer.group);

        // Mob model loading used to begin only during the next render pass,
        // leaving newly spawned mobs as placeholders for a noticeable delay.
        if (entity.modelName && entity.renderer && typeof entity.renderer.preload === 'function') {
            entity.renderer.preload(entity);
        }

        // Multiplayer hook
        if (this.minecraft && this.minecraft.multiplayer && this.minecraft.multiplayer.isHosting) {
            // Only broadcast non-player entities (mobs, items, arrows)
            // Players are handled by presence
            if (entity.constructor.name !== "PlayerEntity" && entity.constructor.name !== "RemotePlayerEntity") {
                this.minecraft.multiplayer.broadcastMobSpawn(entity);
            }
        }
    }

    removeEntityById(id) {
        const index = this.entities.findIndex(e => e.id === id);
        if (index !== -1) {
            const entity = this.entities[index];

            // Spawn smoke particles on mob death (at the end of their death animation)
            if (entity.health <= 0 && entity.deathTime >= 20 && entity.constructor.name !== "PlayerEntity") {
                if (this.minecraft.particleManager) {
                    this.minecraft.particleManager.spawnDeathSmoke(this, entity.x, entity.y, entity.z);
                }
            }

            this.entities.splice(index, 1);
            if (entity.renderer && entity.renderer.group) {
                this.group.remove(entity.renderer.group);
            }
            if (entity.renderer && typeof entity.renderer.dispose === "function") {
                entity.renderer.dispose();
            }

            // Multiplayer hook
            if (this.minecraft && this.minecraft.multiplayer && this.minecraft.multiplayer.isHosting) {
                if (entity.constructor.name !== "PlayerEntity" && entity.constructor.name !== "RemotePlayerEntity") {
                    this.minecraft.multiplayer.broadcastMobRemove(id);
                }
            }
        }
    }

    getEntityById(id) {
        for (let entity of this.entities) {
            if (entity.id === id) {
                return entity;
            }
        }
        return null;
    }

    getSpawn() {
        return this.spawn;
    }

    setSpawn(x, z) {
        let y = this.getHeightAt(x, z);
        this.spawn = new Vector3(x, y + 8, z);
        this.spawnIsSet = true;
    }

    findSpawn() {
        if (this.worldType === 1 || this.worldType === 6) { // Flat / Debug
            this.spawn.x = 0;
            this.spawn.z = 0;
            this.spawn.y = this.superflatLayers.reduce((sum, layer) => sum + layer.count, 0);
            this.spawnIsSet = true;
            return;
        }

        if (this._gameType === 'oneblock') {
            this.spawn.x = 0;
            this.spawn.z = 0;
            this.spawn.y = 66; // Above the block (64)
            this.spawnIsSet = true;
            return;
        }

        if (this._gameType === 'skyblock') {
            // Bedrock is at y=61, x=7, z=7. 3 blocks above bedrock is y=64.
            this.spawn.x = 7;
            this.spawn.z = 7;
            this.spawn.y = 64; 
            this.spawnIsSet = true;
            return;
        }

        // Initialize at sea level to start search
        if (this.spawn.y <= 0) {
            this.spawn.y = 64;
        }

        // Ensure the initial chunk is loaded so we can find a surface
        this.getChunkAt(this.spawn.x >> 4, this.spawn.z >> 4);

        // Infinite loop protection for void worlds
        let attempts = 0;
        // Search for a column that is not entirely water and is specifically a Plains biome
        while (attempts < 2000) {
            // Check the (cheap) biome noise first and only generate a chunk
            // for candidate columns. Generating a full chunk for every
            // attempt produced hundreds of throwaway chunks at world start.
            const biomeVal = this.getBiomeNoiseAt(this.spawn.x, this.spawn.z);

            let biomeMatches = false;
            if (this.spawnBiome === "all") {
                biomeMatches = biomeVal > -0.1 && biomeVal < 0.1;
            } else {
                if (this.spawnBiome === "plains" && (biomeVal > -0.1 && biomeVal < 0.1)) biomeMatches = true;
                if (this.spawnBiome === "desert" && biomeVal >= 0.72) biomeMatches = true;
                if (this.spawnBiome === "snow" && biomeVal < -0.62) biomeMatches = true;
                if (this.spawnBiome === "forest" && (biomeVal >= -0.62 && biomeVal <= -0.1)) biomeMatches = true;
            }

            if (biomeMatches) {
                this.getChunkAt(this.spawn.x >> 4, this.spawn.z >> 4);
                const isWater = this.getHighestBlockAt(this.spawn.x, this.spawn.z) < this.generator.seaLevel;
                if (!isWater) break;
            }

            this.spawn.x += this.random.nextInt(64) - this.random.nextInt(64);
            this.spawn.z += this.random.nextInt(64) - this.random.nextInt(64);
            attempts++;
        }

        // Move spawn to the top-most solid block for this column so player doesn't spawn inside blocks.
        // Use the robust findSafeSpawnY helper which handles both Nether pockets and Overworld surfaces.
        this.spawn.y = this.findSafeSpawnY(Math.floor(this.spawn.x), Math.floor(this.spawn.z), 64);
        this.spawnIsSet = true;
    }

    getBlockAboveSeaLevel(x, z) {
        let y = this.generator.seaLevel;
        while (this.getBlockAt(x, y + 1, z) !== 0) {
            y++;
        }
        return this.getBlockAt(x, y, z);
    }

    loadSpawnChunks() {
        // Load world data FIRST so generator and world type are correct before any chunks generate
        if (this.savedData) {
            this.loadWorldData(this.savedData);
        }

        // Queue the requested preload radius rather than generating the whole
        // square synchronously. Only the center chunk is needed immediately.
        // Debug worlds keep their catalog close to spawn and preload a larger
        // area so the test structures appear together on the initial map.
        let loadRadius = this.worldType === 6
            ? 4
            : Math.max(1, Math.min(10, this.minecraft.settings.chunkLoad));
        const centerX = this.spawn.x >> 4;
        const centerZ = this.spawn.z >> 4;
        this.getChunkAt(centerX, centerZ);
        for (let x = -loadRadius; x <= loadRadius; x++) {
            for (let z = -loadRadius; z <= loadRadius; z++) {
                const cx = centerX + x;
                const cz = centerZ + z;
                if (cx === centerX && cz === centerZ) continue;
                const key = cx + "," + cz;
                if (!this.chunkExists(cx, cz) && !this.chunkLoadSet.has(key)) {
                    this.chunkLoadQueue.push({ x: cx, z: cz, d: x * x + z * z });
                    this.chunkLoadSet.add(key);
                }
            }
        }
        this.chunkLoadQueue.sort((a, b) => b.d - a.d);

        // Place spawn at the topmost solid block for this column (so spawn is not buried)
        let preferredY = this.getHighestBlockAt(this.spawn.x, this.spawn.z) + 1;

        if (this.dimension === -1) {
            // Nether: check safety after loading chunks.
            preferredY = this.findSafeSpawnY(Math.floor(this.spawn.x), Math.floor(this.spawn.z), 64);
        }

        // Only update spawn Y if we found a valid preferred Y, otherwise keep generated default
        if (preferredY > 0) {
             this.spawn.y = preferredY;
        }
    }

    loadWorldData(data) {
        try {
            // Initialize savedData reference if missing
            if (!this.savedData) this.savedData = data;

            if (data.gm !== undefined) {
                this.gameMode = data.gm;
            }

            if (data.gr) {
                if (data.gr.keepInventory !== undefined) this.gameRules.keepInventory = data.gr.keepInventory;
                if (data.gr.cheatsEnabled !== undefined) this.gameRules.cheatsEnabled = data.gr.cheatsEnabled;
                if (data.gr.showDayCounter !== undefined) this.gameRules.showDayCounter = data.gr.showDayCounter;
                if (data.gr.generateStructures !== undefined) this.gameRules.generateStructures = data.gr.generateStructures;
            }

            if (data.wt !== undefined) {
                this.worldType = data.wt;
                if (data.sfl) this.superflatLayers = data.sfl;
                // Re-initialize generator to respect the loaded world type (e.g. Flat)
                if (this.worldType === 5) {
                    this.generator = new WorldGeneratorV2(this, this.seed);
                } else {
                    this.generator = new WorldGenerator(this, this.seed);
                }
            } else if (data.f !== undefined) {
                this.worldType = data.f ? 1 : 0;
                this.generator = new WorldGenerator(this, this.seed);
            }

            if (data.gt !== undefined) {
                this._gameType = data.gt;
            }
            
            if (data.ob) {
                this.oneBlock = data.ob;
                // Recalculate the phase from mined blocks so older saves use
                // the new 100-block Plains boundary instead of retaining a
                // stale phase index.
                if (this._gameType === 'oneblock') {
                    this.oneBlock.phase = 0;
                    while (this.oneBlock.phase < this.oneBlockPhases.length - 1 &&
                        this.oneBlock.mined >= this.oneBlockPhases[this.oneBlock.phase + 1].threshold) {
                        this.oneBlock.phase++;
                    }
                }
                // Backwards compatibility for chest spawning
                if (this.oneBlock.nextChest === undefined) {
                    this.oneBlock.nextChest = this.oneBlock.mined + (20 + Math.floor(Math.random() * 16));
                }
                if (this.oneBlock.nextMob === undefined) {
                    this.oneBlock.nextMob = this.oneBlock.mined + (17 + Math.floor(Math.random() * 19));
                }
            }

            if (data.bonusChest !== undefined) {
                this._bonusChest = data.bonusChest;
            }

            // Load tile entities
            if (data.te) {
                // Merge loaded tile entities into the existing map to ensure we don't clear state during redundant load calls
                for (const key in data.te) {
                    this.tileEntities.set(key, data.te[key]);const [x,,z]=key.split(',').map(Number),chunkKey=(x>>4)+','+(z>>4);
                    let bucket=this.tileEntitiesByChunk.get(chunkKey);if(!bucket){bucket=new Set();this.tileEntitiesByChunk.set(chunkKey,bucket);}bucket.add(key);
                }
            }
            
            if (Array.isArray(data.cam)) {
                this.broadcastCameras = data.cam;
                if (this.minecraft.cameraManager) this.minecraft.cameraManager.load(data.cam);
            }

            if (data.sp) {
                this.spawn.x = data.sp[0];
                this.spawn.y = data.sp[1];
                this.spawn.z = data.sp[2];
                this.spawnIsSet = true;
            }
            
            if (data.t !== undefined) {
                this.time = data.t;
            }

            if (data.stats) {
                Object.assign(this.minecraft.stats, data.stats);
            }

            if (data.sb) {
                this.spawnBiome = data.sb;
            }
            
            if (data.c) {
                for (const chunkKey in data.c) {
                    const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
                    const chunk = this.getChunkAt(chunkX, chunkZ);
                    this.applyCompressedChunk(chunk, data.c[chunkKey]);
                }
            }
            
            if (data.pl && this.minecraft.player) {
                if (data.pl.p) {
                    this.minecraft.player.setPosition(data.pl.p[0], data.pl.p[1], data.pl.p[2]);
                }
                
                // If an exact position was saved, prefer that (preserves sub-block precision)
                if (data.pl.posExact) {
                    const p = data.pl.posExact;
                    this.minecraft.player.x = p[0];
                    this.minecraft.player.y = p[1];
                    this.minecraft.player.z = p[2];
                }

                if (data.pl.r) {
                    this.minecraft.player.rotationYaw = data.pl.r[0];
                    this.minecraft.player.rotationPitch = data.pl.r[1];
                }
                
                if (data.pl.inv) {
                    for (let i = 0; i < data.pl.inv.length && i < this.minecraft.player.inventory.items.length; i++) {
                        this.minecraft.player.inventory.items[i] = {
                            id: data.pl.inv[i][0],
                            count: data.pl.inv[i][1],
                            damage: data.pl.inv[i][2] || 0,
                            tag: data.pl.inv[i][3] || {}
                        };
                    }
                    if (data.pl.sel !== undefined) {
                        this.minecraft.player.inventory.selectedSlotIndex = data.pl.sel;
                    }
                }
                
                // Load remote player data
                if (data.pd) {
                    this.playerData = data.pd;
                }
            }
        } catch (e) {
            console.error("Failed to load world data:", e);
        }
    }

    saveWorldData() {
        return new Promise((resolve) => {
            try {
                // Start with the existing saved chunks to prevent data loss of unloaded chunks
                const finalChunks = (this.savedData && this.savedData.c) ? {...this.savedData.c} : {};
                
                // Identify chunks that need saving (modified/dirty)
                const chunksToProcess = Array.from(this.chunks.values()).filter(c => c.loaded && c.isDirty);
                let i = 0;
                const BATCH_SIZE = 5;

                const processChunk = () => {
                    if (i >= chunksToProcess.length) {
                        finalizeSave();
                        return;
                    }

                    const batchEnd = Math.min(i + BATCH_SIZE, chunksToProcess.length);
                    for (let batchIdx = i; batchIdx < batchEnd; batchIdx++) {
                        const chunk = chunksToProcess[batchIdx];

                        // Only compress and save chunks that are actually dirty.
                        // We also check for existing data in finalChunks to ensure we don't overwrite
                        // newer data with older snapshots.
                        const chunkData = this.compressChunk(chunk);
                        if (chunkData) {
                            finalChunks[chunk.x + "," + chunk.z] = chunkData;
                            chunk.isDirty = false;
                        }
                    }
                    
                    i = batchEnd;
                    
                    if (this.minecraft.loadingScreen && this.minecraft.loadingScreen.isSaving) {
                        const progress = i / chunksToProcess.length;
                        this.minecraft.loadingScreen.setProgress(progress);
                    }
                    
                    setTimeout(processChunk, 0);
                };

                const finalizeSave = () => {
                    const playerData = this.minecraft.player ? {
                        p: [this.minecraft.player.x, this.minecraft.player.y, this.minecraft.player.z],
                        posExact: [parseFloat(this.minecraft.player.x.toFixed(6)), parseFloat(this.minecraft.player.y.toFixed(6)), parseFloat(this.minecraft.player.z.toFixed(6))],
                        r: [this.minecraft.player.rotationYaw, this.minecraft.player.rotationPitch],
                        inv: this.minecraft.player.inventory.items.map(item => [item.id, item.count, item.damage, item.tag]), 
                        sel: this.minecraft.player.inventory.selectedSlotIndex
                    } : null;

                    const worldData = {
                        n: this.name,
                        s: this.seed.toString(),
                        wt: this.worldType,
                        sfl: this.superflatLayers,
                        gm: this.gameMode,
                        gt: this._gameType, // Save game type
                        ob: this.oneBlock, // Save One Block state
                        stats: this.minecraft.stats, // Save statistics
                        sp: [this.spawn.x, this.spawn.y, this.spawn.z],
                        t: this.time,
                        c: finalChunks,
                        te: Object.fromEntries(this.tileEntities), // Persist command block/chest data
                        cam: this.minecraft.cameraManager ? this.minecraft.cameraManager.serialize() : this.broadcastCameras,
                        gr: this.gameRules,
                        pl: playerData,
                        pd: this.playerData, // Save remote player data
                        lp: Date.now(),
                        bonusChest: this._bonusChest,
                        sb: this.spawnBiome
                    };

                    // Update local cache of saved data
                    this.savedData = worldData;

                    if (!this.worldId) {
                        console.error("Cannot save world without a worldId!");
                        resolve({ success: false, error: "Missing worldId", data: worldData });
                        return;
                    }
                    const worldId = this.worldId;

                    import("./storage/WorldStorage.js").then(module => {
                        const WorldStorage = module.default;
                        WorldStorage.saveWorld(worldId, worldData).then(() => {
                            resolve({ success: true });
                        }).catch(err => {
                            console.error("Storage error during save:", err);
                            resolve({ success: false, error: err, data: worldData });
                        });
                    });
                };

                // Start processing
                setTimeout(processChunk, 0);

            } catch (e) {
                console.error("Failed to prepare save:", e);
                resolve({ success: false, error: e });
            }
        });
    }

    regenerateOneBlock() {
        if (this._gameType !== 'oneblock') return;

        const pos = this.oneBlock.pos;
        this.oneBlock.mined++;

        // Update Phase (Catch up to correct phase for mined count)
        const phases = this.oneBlockPhases;
        let phaseChanged = false;

        while (this.oneBlock.phase < phases.length - 1 && this.oneBlock.mined >= phases[this.oneBlock.phase + 1].threshold) {
            this.oneBlock.phase++;
            phaseChanged = true;
            this.minecraft.addMessageToChat("§a[One Block] Advanced to " + phases[this.oneBlock.phase].name + " Phase!");
        }

        if (phaseChanged) {
            this.minecraft.soundManager.playSound("random.levelup", pos.x, pos.y, pos.z, 1.0, 1.0);
        }

        const phase = phases[this.oneBlock.phase];
        const minedInPhase = this.oneBlock.mined - phase.threshold;
        
        // Determine next block with rarity distribution
        let nextBlockId = 1; 
        const r = this.random.nextFloat();

        if (phase.name === "Plains") {
            nextBlockId = [17, 200, 18, 203, 5, 2][Math.floor(this.random.nextFloat() * 6)];
        } else if (phase.name === "Stone Age") {
            if (r < 0.3) nextBlockId = 4; // Cobble
            else if (r < 0.45) nextBlockId = 13; // Gravel
            else if (r < 0.55) nextBlockId = 16; // Coal Ore
            else nextBlockId = 1; // Stone
        } else if (phase.name === "Underground 1") {
            const roll = this.random.nextFloat();
            // No Diamond or Emerald in Phase 1
            if (roll < 0.15) nextBlockId = 15; // Iron
            else if (roll < 0.35) nextBlockId = 16; // Coal
            else if (roll < 0.50) nextBlockId = 221; // Diorite
            else if (roll < 0.65) nextBlockId = 222; // Andesite
            else nextBlockId = 1; // Stone
        } else if (phase.name === "Plains 2") {
            // Block set: spruce logs, birch logs, oak logs, grass blocks, small chance for pumpkins, clay
            const roll = this.random.nextFloat();
            if (roll < 0.05) nextBlockId = 86; // 5% Pumpkin
            else if (roll < 0.20) nextBlockId = 82; // 15% Clay
            else {
                const pool = [209, 200, 17, 2]; // Spruce, Birch, Oak, Grass
                nextBlockId = pool[Math.floor(this.random.nextFloat() * pool.length)];
            }
        } else if (phase.name === "Underground 2") {
            const roll = this.random.nextFloat();
            if (roll < 0.03) nextBlockId = 129; // Emerald (Introduced here)
            else if (roll < 0.08) nextBlockId = 56; // Diamond (Introduced here)
            else if (roll < 0.15) nextBlockId = 14; // Gold
            else if (roll < 0.25) nextBlockId = 73; // Redstone
            else if (roll < 0.45) nextBlockId = 15; // Iron
            else nextBlockId = 1; // Stone
        } else if (phase.name === "Winter") {
            if (r < 0.5) nextBlockId = 80; // Snow
            else if (r < 0.75) nextBlockId = 210; // Spruce Planks
            else nextBlockId = 212; // Spruce Leaves
        } else if (phase.name === "Desert") {
            if (r < 0.7) nextBlockId = 12; // Sand
            else nextBlockId = 24; // Sandstone
        } else if (phase.name === "Plenty") {
            // Mixed pool
            const pool = [1, 2, 3, 4, 17, 200, 209, 235, 253, 5, 201, 210, 304, 305, 16, 15, 14, 56, 129, 220, 221, 222];
            nextBlockId = pool[Math.floor(this.random.nextFloat() * pool.length)];
            // Apply similar ore weights for "Plenty"
            const roll = this.random.nextFloat();
            if (roll < 0.005) nextBlockId = 129;
            else if (roll < 0.015) nextBlockId = 56;
            else if (roll < 0.04) nextBlockId = 14;
            else if (roll < 0.08) nextBlockId = 15;
        }

        // Chance for Chest (Once every 20-35 blocks)
        let isChest = false;
        if (this.oneBlock.mined >= this.oneBlock.nextChest) {
            isChest = true;
            nextBlockId = BlockRegistry.CHEST.getId();
            this.oneBlock.nextChest = this.oneBlock.mined + (20 + Math.floor(Math.random() * 16));
        }

        // Mob Spawning Logic: once every 17 to 35 blocks
        let isMob = false;
        if (!isChest && this.oneBlock.mined >= this.oneBlock.nextMob) {
            isMob = true;
            this.oneBlock.nextMob = this.oneBlock.mined + (17 + Math.floor(Math.random() * 19));
        }

        // Place Block
        this.setBlockAt(pos.x, pos.y, pos.z, nextBlockId);
        
        // Block-specific top decorations
        if (!isChest && !isMob) {
            // Plains Special: Grass foliage on top of grass block (50% chance)
            if (nextBlockId === 2) {
                if (this.random.nextFloat() < 0.5) {
                    this.setBlockAt(pos.x, pos.y + 1, pos.z, 31); // 31 is grass foliage
                }
            }
            // Desert Special: Dead bush or sugarcane on sand
            else if (phase.name === "Desert" && nextBlockId === 12) {
                if (this.random.nextFloat() < 0.1) {
                    const deco = this.random.nextFloat() < 0.5 ? 33 : 83; // Dead Bush or Sugarcane
                    this.setBlockAt(pos.x, pos.y + 1, pos.z, deco);
                }
            }
        }

        this.minecraft.particleManager.spawnBlockBreakParticles(this, pos.x, pos.y, pos.z, Block.getById(nextBlockId));

        // Fill Chest with Phase-Specific Loot (Randomized amount and selection)
        if (isChest) {
            const items = new Array(27).fill(null).map(() => ({ id: 0, count: 0, damage: 0, tag: {} }));
            
            let pool = [];
            const p = phase.name;
            if (p === "Plains") {
                pool = [{id: 297, c: 2}, {id: 260, c: 3}, {id: 17, c: 4}, {id: 280, c: 8}, {id: 402, c: 2}];
            } else if (p === "Stone Age") {
                pool = [{id: 263, c: 8}, {id: 4, c: 16}, {id: 50, c: 4}];
            } else if (p === "Underground 1") {
                pool = [{id: 1, c: 16}, {id: 263, c: 4}, {id: 297, c: 1}];
            } else if (p === "Plains 2") {
                pool = [{id: 333, c: 1}, {id: 414, c: 1}, {id: 408, c: 1}, {id: 265, c: 4}, {id: 403, c: 8}, {id: 405, c: 8}];
            } else if (p === "Underground 2") {
                pool = [{id: 264, c: 2}, {id: 388, c: 2}, {id: 362, c: 1}, {id: 331, c: 16}];
            } else if (p === "Winter") {
                pool = [{id: 80, c: 8}, {id: 410, c: 16}, {id: 263, c: 4}, {id: 296, c: 4}];
            } else if (p === "Desert") {
                pool = [{id: 12, c: 16}, {id: 24, c: 16}, {id: 46, c: 2}, {id: 20, c: 8}, {id: 297, c: 2}];
            } else if (p === "Plenty") {
                const dyes = [430, 431, 432, 433, 434, 435, 436, 437];
                pool = [{id: 264, c: 1}, {id: 388, c: 1}, {id: 89, c: 4}, {id: 362, c: 1}, {id: 368, c: 1}, {id: 403, c: 3}, {id: 405, c: 3}, {id: 86, c: 1}, {id: 421, c: 2}, {id: 352, c: 4}, {id: dyes[Math.floor(this.random.nextFloat() * dyes.length)], c: 4}];
            }

            // Pick 3-5 random items from the pool
            let countToPut = 3 + Math.floor(Math.random() * 3);
            for (let k = 0; k < countToPut && pool.length > 0; k++) {
                let rIdx = Math.floor(Math.random() * pool.length);
                let entry = pool.splice(rIdx, 1)[0];
                let slot = Math.floor(Math.random() * 27);
                // Find empty slot
                while(items[slot].id !== 0) slot = (slot + 1) % 27;
                items[slot] = { id: entry.id, count: entry.c, damage: 0, tag: {} };
            }

            // Every One Block chest has an independent 8% chance to contain
            // one randomly selected sapling species.
            if (Math.random() < 0.08) {
                const saplings = [400, 202, 211, 323, 324]; // Oak, Birch, Spruce, Acacia, Dark Oak
                let slot = Math.floor(Math.random() * 27);
                while (items[slot].id !== 0) slot = (slot + 1) % 27;
                items[slot] = {
                    id: saplings[Math.floor(Math.random() * saplings.length)],
                    count: 1,
                    damage: 0,
                    tag: {}
                };
            }

            const teData = { items: items };
            this.setTileEntity(pos.x, pos.y, pos.z, teData);
            if (this.minecraft.multiplayer && this.minecraft.multiplayer.isHosting) {
                this.minecraft.multiplayer.broadcast({ type: "tile_entity_sync", x: pos.x, y: pos.y, z: pos.z, data: teData });
            }
        }

        // Spawn Mob
        if (isMob && phase.mobs && phase.mobs.length > 0) {
            const mobName = phase.mobs[this.random.nextInt(phase.mobs.length)];
            let MobClass = null;
            switch(mobName) {
                case "EntityCow": MobClass = EntityCow; break;
                case "EntityPig": MobClass = EntityPig; break;
                case "EntityChicken": MobClass = EntityChicken; break;
                case "EntitySheep": MobClass = EntitySheep; break;
                case "EntityZombie": MobClass = EntityZombie; break;
                case "EntitySkeleton": MobClass = EntitySkeleton; break;
                case "EntityCreeper": MobClass = EntityCreeper; break;
                case "EntitySnowZombie": MobClass = EntitySnowZombie; break;
                case "EntitySnowGolem": MobClass = EntitySnowGolem; break;
                case "EntityHusk": MobClass = EntityHusk; break;
                case "EntityZombieVillager": MobClass = EntityZombieVillager; break;
                case "EntityVillager": MobClass = EntityVillager; break;
                case "EntityEnderman": MobClass = EntityEnderman; break;
            }
            if (MobClass) {
                const entity = new MobClass(this.minecraft, this);
                entity.setPosition(pos.x + 0.5, pos.y + 1.1, pos.z + 0.5);
                this.addEntity(entity);
            }
        }
    }

    compressChunk(chunk) {
        // Build palette of unique blocks
        const palette = [];
        const paletteMap = new Map();
        const blocks = [];

        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 128; y++) {
                for (let z = 0; z < 16; z++) {
                    const typeId = chunk.getBlockAt(x, y, z);
                    const data = chunk.getBlockDataAt(x, y, z);

                    // Add to palette if not present
                    if (!paletteMap.has(typeId)) {
                        paletteMap.set(typeId, palette.length);
                        palette.push(typeId);
                    }
                    
                    // Store as: paletteIndex, x, y, z, data
                    blocks.push([paletteMap.get(typeId), x, y, z, data]);
                }
            }
        }

        if (blocks.length === 0) return null;

        // Simple RLE compression on blocks runs
        const compressed = [];
        let prev = null;
        let count = 0;

        for (const block of blocks) {
            // To compress effectively, we only care about consecutive identical blocks in the sequence
            // But coordinates x,y,z change every time, so standard "prev === key" won't work with coords in the key.
            // Optimization: We don't need to save x,y,z if we save ALL blocks in order (0..32767).
            // loadWorldData needs to know we are saving a full dense array now, or we stick to the sparse format 
            // but just save everything.
            // Saving everything in sparse format [p,x,y,z,d] is wasteful.
            // Let's switch to a dense RLE format: [paletteIndex, data, count]
            // The loader needs to handle this.
            // Wait, loadWorldData expects `[paletteIndex, x, y, z, data, count]`.
            // If we want to keep compatibility with the existing loader logic without changing it too much:
            // The loader iterates `diffBlocks` and does `chunk.setBlockAt(x, y + c, z, typeId, blockData)`.
            // It assumes `y` increments if `count > 1`.
            // Our loop is x, then y, then z.
            // Let's optimize the loop order to be vertical (y inner) so RLE works with the loader's expectation!
            
            // Re-loop: x, z, y to match loader's RLE capability (y+c)
        }
        
        // Reset
        const rleBlocks = [];
        
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                let currentRun = null;
                
                for (let y = 0; y < 128; y++) {
                    const typeId = chunk.getBlockAt(x, y, z);
                    const data = chunk.getBlockDataAt(x, y, z);

                    if (!paletteMap.has(typeId)) {
                        paletteMap.set(typeId, palette.length);
                        palette.push(typeId);
                    }
                    const pIdx = paletteMap.get(typeId);
                    
                    if (currentRun && currentRun.pIdx === pIdx && currentRun.data === data) {
                        currentRun.count++;
                    } else {
                        if (currentRun) {
                            // Push previous run
                            rleBlocks.push([currentRun.pIdx, currentRun.x, currentRun.y, currentRun.z, currentRun.data, currentRun.count]);
                        }
                        // Start new run
                        currentRun = { pIdx, x, y, z, data, count: 1 };
                    }
                }
                // Push last run of the column
                if (currentRun) {
                    rleBlocks.push([currentRun.pIdx, currentRun.x, currentRun.y, currentRun.z, currentRun.data, currentRun.count]);
                }
            }
        }

        return {p: palette, d: rleBlocks};
    }
    
    // Helper to find safe spawn Y in dimensions where surface finding is complex (Nether)
    garbageCollectChunks() {
        const player = this.minecraft.player;
        const perf = this.minecraft.performanceFactor || 1.0;
        
        // Dynamic view distance buffer: 2 normally, 1 if lagging
        const buffer = (perf < 0.7) ? 1 : 2;
        const normalDistance=this.minecraft.settings.viewDistance;
        const lodDistance=this.minecraft.settings.lodRendering===false?normalDistance:Math.max(normalDistance,Math.ceil((this.minecraft.settings.lodRenderDistance||64)/16));
        const viewDistance = lodDistance + buffer; 

        // Get all players (local + remote) to ensure chunks don't unload under guests
        const players = [player];
        if (this.minecraft.multiplayer && this.minecraft.multiplayer.remotePlayers) {
            for (let rp of this.minecraft.multiplayer.remotePlayers.values()) {
                players.push(rp);
            }
        }

        for (const [index, chunk] of this.chunks) {
            // Determine minimum distance to ANY player
            let minDist = Infinity;
            for (const p of players) {
                const dx = Math.abs(chunk.x - (Math.floor(p.x) >> 4));
                const dz = Math.abs(chunk.z - (Math.floor(p.z) >> 4));
                const dist = Math.max(dx, dz);
                if (dist < minDist) minDist = dist;
            }

            if (minDist > viewDistance) {
                // Persistence optimization
                if (chunk.isDirty) {
                    if (!this.savedData) this.savedData = { c: {} };
                    if (!this.savedData.c) this.savedData.c = {};
                    this.savedData.c[index] = this.compressChunk(chunk);
                    chunk.isDirty = false;
                }

                // IMPORTANT: Clean up pending tasks for this chunk to prevent queue bloat
                if (this.minecraft.worldRenderer) {
                    const wr = this.minecraft.worldRenderer;
                    wr.chunkSectionUpdateQueue = wr.chunkSectionUpdateQueue.filter(s => {
                        if (s.chunk === chunk) {
                            // Properly reset flags to avoid stale state if chunk re-enters range
                            s.inUpdateQueue = false;
                            s.priority = false;
                            return false;
                        }
                        return true;
                    });
                }
                this.lightingInitQueue = this.lightingInitQueue.filter(c => c !== chunk);
                this.lightCheckQueue = this.lightCheckQueue.filter(task => task.chunk !== chunk);

                // Remove from scene and unload resources
                this.group.remove(chunk.group);
                chunk.unload();
                this.chunks.delete(index);
            }
        }

        // AGGRESSIVE PRUNING: Prevent savedData cache from growing too large during long explorations.
        // Limit persistent cache to 128 modified chunks. Remove oldest/farthest first.
        if (this.savedData && this.savedData.c && Object.keys(this.savedData.c).length > 128) {
            const keys = Object.keys(this.savedData.c);
            keys.sort((a, b) => {
                const [ax, az] = a.split(',').map(Number);
                const [bx, bz] = b.split(',').map(Number);
                const distA = Math.max(Math.abs(ax - (player.x >> 4)), Math.abs(az - (player.z >> 4)));
                const distB = Math.max(Math.abs(bx - (player.x >> 4)), Math.abs(bz - (player.z >> 4)));
                return distB - distA; // Furthest first
            });
            // Prune down to 96
            for (let i = 0; i < (keys.length - 96); i++) {
                delete this.savedData.c[keys[i]];
            }
        }
        
        this._lastAccessChunk = null;
    }

    applyCompressedChunk(chunk, chunkData) {
        if (!chunkData) return;

        // Handle new compressed format (palette + RLE)
        if (chunkData.p && chunkData.d) {
            const palette = chunkData.p;
            const diffBlocks = chunkData.d;

            for (const blockEntry of diffBlocks) {
                // Format: [paletteIndex, x, y, z, data, count]
                const paletteIdx = blockEntry[0];
                const x = blockEntry[1];
                const y = blockEntry[2];
                const z = blockEntry[3];
                const blockData = blockEntry[4];
                const count = blockEntry[5] || 1;

                const typeId = palette[paletteIdx];

                for (let c = 0; c < count; c++) {
                    // Apply to chunk directly, using setBlockId to avoid side effects during load
                    chunk.setBlockId(x, y + c, z, typeId, blockData);
                }
            }
        } else if (Array.isArray(chunkData)) {
            // Old format fallback
            for (let i = 0; i < chunkData.length; i++) {
                const [x, y, z, typeId, blockData] = chunkData[i];
                chunk.setBlockId(x & 15, y, z & 15, typeId, blockData || 0);
            }
        }
        
        // Mark as clean so purely loaded chunks aren't saved needlessly until edited
        chunk.isDirty = false;
    }

    queueChunkForRefresh(cx, cz) {
        // Schedule full chunk mesh/light refreshes for 5s and 15s post-load as additional fallbacks
        this.chunkRefreshQueue.push({ x: cx, z: cz, time: this.time + 100 });
        this.chunkRefreshQueue.push({ x: cx, z: cz, time: this.time + 300 });

        // Scan for signs in all tile entities within this chunk and queue them
        this.tileEntities.forEach((te, key) => {
            const coords = key.split(",");
            const x = parseInt(coords[0]) >> 4;
            const z = parseInt(coords[2]) >> 4;
            
            if (x === cx && z === cz) {
                // Schedule sign texture refreshes
                this.signRefreshQueue.push({ key: key, time: this.time + 100 });
                this.signRefreshQueue.push({ key: key, time: this.time + 300 });
            }
        });
    }

    findSafeSpawnY(x, z, preferredY) {
        const chunkX = x >> 4;
        const chunkZ = z >> 4;
        
        // Ensure the central chunk is loaded synchronously
        this.getChunkAt(chunkX, chunkZ);

        const isSolid = (i) => {
            const b = Block.getById(i);
            return i !== 0 && b && b.isSolid() && !b.isLiquid();
        };
        
        // Start search high. 125 is safe max (leave room for bedrock top)
        let foundSafeY = -1;
        
        // Search from Y=125 down to 10. Prioritize finding an air pocket.
        for (let y = 125; y >= 10; y--) {
            const id = this.getBlockAt(x, y, z);
            const id1 = this.getBlockAt(x, y + 1, z);
            
            // Criteria: 2 blocks of air (y and y+1)
            if (id === 0 && id1 === 0) {
                 // Check if the block below (y-1) is solid ground or liquid (lava sea level)
                 const belowId = this.getBlockAt(x, y - 1, z);

                 if (this.dimension === -1) { // Nether
                      // Prefer spawning above solid ground (Netherrack)
                      if (isSolid(belowId)) {
                           foundSafeY = y;
                           break; 
                      }
                      // Check for lava sea level (ID 10) below if above floor
                      if (y >= 32 && (belowId === 10 || belowId === 11)) {
                          foundSafeY = y;
                          break;
                      }
                 } else { // Overworld
                     // Must be standing on something solid or below sea level
                     if (isSolid(belowId) || y <= this.generator.seaLevel) {
                         foundSafeY = y;
                         break;
                     }
                 }
            }
        }
        
        // Fallback: If no ideal spot was found, prioritize the area around 64 or whatever preferredY suggests,
        // making sure there is air above. If nothing is safe, return 64.
        if (foundSafeY === -1) {
            for (let y = 125; y >= 10; y--) {
                 if (this.getBlockAt(x, y, z) === 0 && this.getBlockAt(x, y+1, z) === 0) {
                     foundSafeY = y;
                     break;
                 }
            }
        }

        // Return the safe air position, or fallback to preferredY (64) if entirely submerged/stuck
        return foundSafeY > 0 ? foundSafeY : preferredY;
    }

    buildPortal(x, y, z) {
        const OBSIDIAN = 49;
        const PORTAL = 90;
        
        // Frame: 4x5 obsidian
        for (let i = -1; i <= 2; i++) {
            for (let j = -1; j <= 3; j++) {
                let isFrame = (i === -1 || i === 2 || j === -1 || j === 3);
                let blockId = isFrame ? OBSIDIAN : PORTAL;
                this.setBlockAt(x + i, y + j, z, blockId);
                if (!isFrame) {
                    this.setBlockDataAt(x + i, y + j, z, 2); // Z-axis portal
                }
            }
        }
        
        // Platform if floating (Nether spawn)
        for (let i = -2; i <= 3; i++) {
            for (let k = -2; k <= 2; k++) {
                if (this.getBlockAt(x + i, y - 2, z + k) === 0) {
                    this.setBlockAt(x + i, y - 2, z + k, OBSIDIAN);
                }
            }
        }
        
        // Clear space
        for (let i = -1; i <= 2; i++) {
            for (let j = 0; j <= 2; j++) {
                for (let k = -1; k <= 1; k++) {
                    if (k === 0) continue; // Don't clear portal itself
                    this.setBlockAt(x + i, y + j, z + k, 0);
                }
            }
        }
    }
} 
