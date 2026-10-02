import Timer from "../util/Timer.js";
import GameSettings from "./GameSettings.js";
import GameWindow from "./GameWindow.js";
import WorldRenderer from "./render/WorldRenderer.js";
import ScreenRenderer from "./render/gui/ScreenRenderer.js";
import IngameOverlay from "./gui/IngameOverlay.js";
import PlayerEntity from "./entity/PlayerEntity.js";
import SoundManager from "./sound/SoundManager.js";
import Block from "./world/block/Block.js";
import BoundingBox from "../util/BoundingBox.js";
import Vector3 from "../util/Vector3.js";
import EnumBlockFace from "../util/EnumBlockFace.js";
import {BlockRegistry} from "./world/block/BlockRegistry.js";
import { VRButton } from 'three/addons/webxr/VRButton.js';
import FontRenderer from "./render/gui/FontRenderer.js";
import GrassColorizer from "./render/GrassColorizer.js";
import GuiMainMenu from "./gui/screens/GuiMainMenu.js";
import GuiMultiplayer from "./gui/screens/GuiMultiplayer.js";
import GuiNotice from "./gui/screens/GuiNotice.js";
import GuiIngameMenu from "./gui/screens/GuiIngameMenu.js";
import GuiLoadingScreen from "./gui/screens/GuiLoadingScreen.js";
import GuiCreateWorld from "./gui/screens/GuiCreateWorld.js";
import * as THREE from "three";
import GuiInventory from "./gui/screens/GuiInventory.js";
import GuiCraftingTable from "./gui/screens/GuiCraftingTable.js";
import { getBlockBreakTime, canHarvestBlock } from "./world/block/BlockBreakTimes.js";
import ItemRenderer from "./render/gui/ItemRenderer.js";
import DroppedItem from "./entity/DroppedItem.js";
import Multiplayer from "../../../../../Multiplayer.js";
import CommandHandler from "./command/CommandHandler.js";
import GuiChat from "./gui/screens/GuiChat.js";
import EntityArrow from "./entity/EntityArrow.js";
import EntitySnowball from "./entity/EntitySnowball.js";
import EntityEnderPearl from "./entity/EntityEnderPearl.js";
import EntityFishHook from "./entity/EntityFishHook.js";
import AchievementManager from "./gui/achievement/AchievementManager.js";
import ParticleManager from "../../../../../BlockParticles.js";
import { NetherWorld } from "../../../../../Nether.js";
import { EndWorld } from "../../../../../End.js";
import BlockRenderType from "../util/BlockRenderType.js";
import CameraManager from "./camera/CameraManager.js";
import BroadcastMedia from "./camera/BroadcastMedia.js";
import GuiCameraStudio from "./gui/screens/GuiCameraStudio.js";
import GuiCameraConfig from "./gui/screens/GuiCameraConfig.js";

export default class Minecraft {

    static VERSION = "Snapshot 1 - 1.0"
    static URL_WEBSIM = "https://websim.ai";

    /**
     * Create Minecraft instance and render it on a canvas
     */
    constructor(canvasWrapperId, resources) {
        this.resources = resources;
        // Keep a copy of original image resources so disabling low mode can restore them immediately
        this.originalResources = {};
        for (const k in resources) { this.originalResources[k] = resources[k]; }
        
        // Texture Cache to prevent creating duplicate Three.js textures
        this._threeTextureCache = new Map();

        this.currentScreen = null;
        this.currentScreen2 = null; // Splitscreen player screen
        this.loadingScreen = null;
        this.world = null;
        this.player = null;
        this.player2 = null; // Splitscreen player

        this.fps = 0;
        this.assetsLoading = false;

        // Tick timer (usar 60 TPS para animações e gameplay conforme solicitado)
        this.timer = new Timer(20);

        this.settings = new GameSettings();
        this.settings.load();

        // Ensure default skin is steve (1).png if not set or if still the old default
        if (!this.settings.skin || this.settings.skin === "char.png" || this.settings.skin === "src/resources/char.png") {
            this.settings.skin = "../../steve (1).png";
            this.settings.save();
        }

        // Fetch Websim Username to use as default if not changed
        if (window.websim && window.websim.getCurrentUser) {
            window.websim.getCurrentUser().then(user => {
                if (user && user.username) {
                    // Only override if it's still the default "Player"
                    if (this.settings.username === "Player") {
                        this.settings.username = user.username;
                        this.settings.save();
                        if (this.player) this.player.username = user.username;
                    }
                }
            }).catch(() => {});
        }

        // Bow pull state
        this.bowPullDuration = 0;
        this.crossbowPullDuration = 0;

        // Title state
        this.titleState = {
            mainTitle: "",
            subTitle: "",
            actionBar: "",
            mainColor: 0xFFFFFF,
            subColor: 0xFFFFFF,
            actionColor: 0xFFFFFF,
            startTime: 0,
            endTime: 0,
            fadeIn: 500,
            stay: 3000,
            fadeOut: 500
        };
        this.snowballThrowTimer = 0;
        this.enderPearlThrowTimer = 0;
        this.sleepTimer = 0;
        this._canReloadCrossbow = true;

        // Dev tools transform state for items (pickaxe)
        // Updated defaults to match the provided "Edit Mode: CROSSBOW" screenshot and user requests
        this.devTools = {
            mode: "item", // "item", "block", "eating", "glint", "lighting"
            item: { x: 2.33, y: 0.02, z: 4.49, rotationX: 0.75, rotationY: 4.06, rotationZ: 5.44, scale: 20.10 },
            block: { x: 0.20, y: -4.17, z: 1.92, rotationX: -0.03, rotationY: 0.86, rotationZ: 0.00, scale: 10.0 },
            eating: { x: 0.00, y: -0.17, z: -0.48, rotationX: 0.06, rotationY: 3.14, rotationZ: 0.17, scale: 2.50 },
            crossbow: { x: -14.15, y: -2.11, z: -17.75, rotationX: 1.46, rotationY: 3.14, rotationZ: 0.11, scale: 26.61 },
            fishingHand: { x: 2.68, y: 4.04, z: 6.26, rotationX: 0.83, rotationY: 0.85, rotationZ: 0.99, scale: 20.0 },
            fishingRod: { x: 0.75, y: 0.02, z: -0.57 },
            glint: {
                forced: false,
                zoom: 0.10,
                speed: 0.35,
                rotation: 0.82,
                r: 0.38,
                g: 0.19,
                b: 0.76,
                alpha: 1.0
            },
            lighting: {
                sky: 1.0,
                block: 1.0,
                // Keep contact shadows subtle; enclosed spaces get their darkness
                // from the light map rather than from every block corner.
                ao: 0.06,
                gamma: 2.2
            }
        };

        // Load saved dev tools if available
        try {
            const savedDev = localStorage.getItem('mc_dev_tools');
            if (savedDev) {
                const parsed = JSON.parse(savedDev);
                // Merge into existing to handle schema changes gracefully
                for (let mode in parsed) {
                    if (this.devTools[mode]) Object.assign(this.devTools[mode], parsed[mode]);
                }
            }
        } catch (e) {}

        // Apply saved skin if it exists in resources
        if (this.settings.skin && this.resources[this.settings.skin]) {
            // Apply it to the internal skin setting and refresh
            this.refreshTextures(false);
        }

        // Storage for commands/UI
        this.storage = {};

        // Performance stabilization state
        this.originalSettingsSnapshot = null;
        this.stabilityTimer = 0;

        // Autosave status
        this.isAutosaving = false;
        this.autosaveDisplayTimer = 0;

        // Breaking block state
        this.isLeftMouseDown = false;
        this.isRightMouseDown = false;
        this.currentBreakingBlockPos = null;
        this.breakingProgress = 0;
        // Hit effect cooldown (ticks). While >0 we wait before next hit sound.
        this.breakHitCooldown = 0;

        // Autosave timer
        this.autosaveTimer = 0;

        // Performance Tracking for adaptive budgets
        this.performanceFactor = 1.0; 
        this.frameTimeHistory = [];

        // Graphics state
        this.isContextLost = false;
        this.lowFpsTimer = 0;

        // Controller state
        this.usingControllerCursor = false;
        this.controllerActive1 = false;
        this.controllerActive2 = false;
        this.controllerMineHoldTimer = 0;
        this.controllerPlaceHoldTimer = 0;
        this.controllerPlaceCooldown1 = 0;
        this.controllerPlaceCooldown2 = 0;
        this.creativeBreakCooldown = 0;
        this.lastSneakToggleTime = 0;

        // Controller Mapping (Split-screen)
        this.p1GamepadIndex = 0;
        this.p2GamepadIndex = -1;

        // Persistent HUD elements (id -> layout)
        this.hudElements = new Map();

        // Modded structures for world generation
        this.moddedStructures = [];
        
        // Store worlds for dimension switching
        this.overworld = null;
        this.netherWorld = null;

        // Create window and world renderer
        this.window = new GameWindow(this, canvasWrapperId);

        // Create renderers
        this.worldRenderer = new WorldRenderer(this, this.window);
        this.screenRenderer = new ScreenRenderer(this, this.window);
        this.itemRenderer = new ItemRenderer(this, this.window);

        // Create current screen and overlay
        this.ingameOverlay = new IngameOverlay(this, this.window);

        this.frames = 0;
        this.lastTime = Date.now();

        // Create all blocks
        BlockRegistry.create();

        // Create font renderer
        this.fontRenderer = new FontRenderer(this);

        // Grass colorizer
        this.grassColorizer = new GrassColorizer(this);

        // Update window size
        this.itemRenderer.initialize();
        this.window.updateWindowSize();

        // Create sound manager
        this.soundManager = new SoundManager();

        // Initialize Multiplayer
        this.multiplayer = new Multiplayer(this);

        // Broadcasting/cinematic camera subsystem (media streaming is intentionally separate).
        this.cameraManager = new CameraManager(this);
        this.broadcastMedia = new BroadcastMedia(this);

        // Initialize Command Handler
        this.commandHandler = new CommandHandler(this);

        // Load Mods
        this.loadActiveMods();

        // Initialize Achievement Manager
        this.achievementManager = new AchievementManager(this);

        // Initialize Particle Manager
        this.particleManager = new ParticleManager(this);
        this.worldRenderer.scene.add(this.particleManager.group);

        this.selectedDebugPropertyIndex = 0;
        this.debugStickDisplayText = "";
        this.debugStickDisplayTimer = 0;

        // Statistics tracking
        this.stats = {
            distanceWalked: 0,
            blocksBroken: 0,
            oresBroken: 0,
            itemsSmelted: 0,
            itemsCrafted: 0,
            mobsKilled: 0,
            deaths: 0,
            jumps: 0,
            timePlayed: 0,
            fishCaught: 0,
            villagersTraded: 0,
            animalsBred: 0
        };

        const linkedCode=new URLSearchParams(location.search).get('join');
        this.displayScreen(linkedCode?new GuiMultiplayer(new GuiMainMenu(),linkedCode,true):new GuiNotice(new GuiMainMenu()));

        // Clear all caches on world switch
        window.addEventListener('beforeunload', () => this.stop());

        // Initialize
        this.init();


    }

    init() {
        // Start render loop
        this.running = true;
        this.requestNextFrame();

        // Hide splash background
        const bg = document.getElementById('background');
        if (bg) bg.style.display = 'none';
    }

    loadWorld(world, loadingTitle = "Generating terrain...") {
        if (this.world && this.world.lightValidator) {
            clearInterval(this.world.lightValidator);
        }
        if (world === null) {
            if (this.multiplayer && this.multiplayer.connected) {
                this.multiplayer.disconnect();
            }
            this.worldRenderer.reset();

            if (this.world) {
                this.world.chunks.clear();
            }
            this.world = null;
            this.player = null;
            this.loadingScreen = null;
            this.displayScreen(new GuiMainMenu());
        } else {
            // Display loading screen
            this.loadingScreen = new GuiLoadingScreen();
            this.loadingScreen.setTitle(loadingTitle);
            this.loadingScreen.setProgress(0.02);
            this.displayScreen(this.loadingScreen);

            // Create world
            this.world = world;
        if (this.cameraManager) { this.cameraManager.clear(); if (world && world.broadcastCameras) this.cameraManager.load(world.broadcastCameras); }
            this.worldRenderer.scene.add(this.world.group);

            // Auto-enable rules based on mode/type
            if (this.world.gameMode === 1) this.world.gameRules.cheatsEnabled = true;
            if (this.world._gameType === 'oneblock') this.world.gameRules.keepInventory = true;

            // Handle performance stabilization: force lowest settings initially to ensure smooth loading
            if (this.originalSettingsSnapshot === null) {
                // Capture current state from a fresh settings object to ensure we get the saved preferences
                const baseSettings = new GameSettings();
                baseSettings.load();
                
                this.originalSettingsSnapshot = {};
                const keys = [
                    'viewDistance', 'ambientOcclusion', 'particles', 'wavingFoliage',
                    'realisticWater', 'realisticClouds', 'optimizedLeaves', 'chunkLoad',
                    'maxLightUpdatesPerFrame', 'lightUpdateBudgetMs', 'chunkRebuildBudgetMs'
                ];
                keys.forEach(k => this.originalSettingsSnapshot[k] = baseSettings[k]);

                // Force lowest possible settings for initial stabilization
                this.settings.viewDistance = 2;
                // Keep the normal particle setting while the world stabilizes.
                // The previous minimum override was visible on every world load.
                this.settings.wavingFoliage = false;
                this.settings.realisticWater = false;
                this.settings.realisticClouds = false;
                this.settings.optimizedLeaves = true;
                this.settings.chunkLoad = 1;
                this.settings.maxLightUpdatesPerFrame = 50;
                this.settings.lightUpdateBudgetMs = 2;
                this.settings.chunkRebuildBudgetMs = 1;
                
                this.stabilityTimer = 0;
            }

            // Create player
            this.player = new PlayerEntity(this, this.world);
            // Set username for rendering
            if (typeof window !== "undefined" && window.websim && window.websim.user) {
                this.player.username = window.websim.user.username;
            } else {
                this.player.username = "Player";
            }
            this.world.addEntity(this.player);

            // Load world data first to set correct generator/worldType/spawn coords
            let hasSavedPlayer = false;
            if (this.world.savedData) {
                this.world.loadWorldData(this.world.savedData);
                if (this.world.savedData.pl) hasSavedPlayer = true;
            }

            // Load spawn chunks and respawn player
            if (!hasSavedPlayer) {
                // Multiplayer clients receive the host world's spawn in the
                // world_info packet. Do not search a different local spawn
                // and leave the player separated from the host's spawn area.
                if (!this.world.spawnIsSet) {
                    this.world.findSpawn();
                }
                this.world.loadSpawnChunks();
                this.player.respawn(); // Respawn to loaded or found spawn
            } else {
                this.world.loadSpawnChunks();
            }

            // Save Overworld reference
            if (this.world.dimension === 0) {
                this.overworld = this.world;
            } else {
                // Loaded directly into another dimension?
                if (this.world.dimension === -1) this.netherWorld = this.world;
            }

            // If world requested a bonus chest, place it near spawn (within 8 blocks)
            try {
                // Skip standard bonus chest logic if Skyblock (handled by WorldGenerator)
                if (this.world && this.world._bonusChest && this.world._gameType !== 'skyblock') {
                    const sp = this.world.getSpawn();
                    let sx = Math.floor(sp.x);
                    let sz = Math.floor(sp.z);
                    // search random positions within radius 8; prefer top-most safe spot
                    let placed = false;
                    for (let attempt = 0; attempt < 64 && !placed; attempt++) {
                        const rx = sx + Math.floor((Math.random() * 17) - 8);
                        const rz = sz + Math.floor((Math.random() * 17) - 8);
                        const ryTop = this.world.getHighestBlockAt(rx, rz) + 1;
                        // ensure space above is free
                        if (this.world.getBlockAt(rx, ryTop, rz) === 0 && this.world.getBlockAt(rx, ryTop + 1, rz) === 0) {
                            // place chest at rx,ryTop,rz
                            const chestId = BlockRegistry.CHEST.getId();
                            this.world.setBlockAt(rx, ryTop, rz, chestId);
                            // Build small 1-block pedestal/4 torches around it
                            const TORCH_ID = BlockRegistry.TORCH.getId();
                            const dirs = [[1,0],[ -1,0],[0,1],[0,-1]];
                            for (const d of dirs) {
                                const bx = rx + d[0];
                                const bz = rz + d[1];
                                const by = ryTop;
                                if (this.world.getBlockAt(bx, by, bz) === 0) {
                                    this.world.setBlockAt(bx, by, bz, TORCH_ID);
                                }
                            }

                            // Prepare chest contents (array of 27 slots)
                            const items = new Array(27).fill(null).map(() => ({id:0,count:0}));
                            // 2-5 sticks
                            const sticks = 2 + Math.floor(Math.random() * 4);
                            items[0] = {id: 280, count: sticks};
                            // 2-4 logs
                            const logs = 2 + Math.floor(Math.random() * 3);
                            items[1] = {id: 17, count: logs};
                            // 2-7 planks
                            const planks = 2 + Math.floor(Math.random() * 6);
                            items[2] = {id: 5, count: planks};
                            // Saplings are rare bonus loot: choose any species.
                            if (Math.random() < 0.08) {
                                const saplings = [400, 202, 211, 323, 324];
                                let idx = 0;
                                while (idx < 27 && items[idx].id !== 0) idx++;
                                if (idx < 27) {
                                    items[idx] = {
                                        id: saplings[Math.floor(Math.random() * saplings.length)],
                                        count: 1
                                    };
                                }
                            }

                            // Save tile entity
                            this.world.setTileEntity(rx, ryTop, rz, { items: items });

                            // Ensure visual rebuild
                            if (this.worldRenderer) this.worldRenderer.flushRebuild = true;

                            placed = true;
                        }
                    }
                }
            } catch (e) {
                console.warn("Failed to place bonus chest:", e);
            }
        }

        // Give Starting Map if enabled
        if (this.world && this.world._startingMap) {
                if (this.player && this.player.inventory) {
                // Add Empty Map (ID 358) or Filled Map? 
                // Using 358 (BlockRegistry.MAP) which initializes itself on first update/render
                this.player.inventory.addItem(358, 1);
            }
        }
    }

    switchDimension(targetDimId = null) {
        if (!this.player) return;
        
        // Display loading screen
        this.loadingScreen = new GuiLoadingScreen();
        this.loadingScreen.setTitle("Entering Dimension...");
        this.displayScreen(this.loadingScreen);
        
        // Delay to allow render
        setTimeout(() => {
            let targetWorld;
            
            // Determine target
            let nextDim = targetDimId;
            if (nextDim === null) {
                // Default toggle between Overworld and Nether
                nextDim = this.world.dimension === 0 ? -1 : 0;
            }

            if (nextDim === -1) { // Nether
                if (!this.netherWorld) this.netherWorld = new NetherWorld(this, this.world.seed, this.world.worldId);
                targetWorld = this.netherWorld;
                if (this.world.dimension === 0) {
                    this.player.x /= 8;
                    this.player.z /= 8;
                }
                this.player.y = 64; 
            } else if (nextDim === 1) { // End
                if (!this.endWorld) this.endWorld = new EndWorld(this, this.world.seed, this.world.worldId);
                targetWorld = this.endWorld;
                this.player.x = 0;
                this.player.z = 0;
                this.player.y = 66;
            } else { // Overworld
                targetWorld = this.overworld;
                if (this.world.dimension === -1) {
                    this.player.x *= 8;
                    this.player.z *= 8;
                } else if (this.world.dimension === 1) {
                    // Returning from end
                    this.player.x = this.spawn.x;
                    this.player.z = this.spawn.z;
                }
            }
            
            // Switch world instance
            this.worldRenderer.reset(); // Clear old meshes
            this.world = targetWorld;
            this.worldRenderer.scene.add(this.world.group);
            
            // Transfer player
            this.player.world = targetWorld;
            // Re-add to new world list
            this.world.entities = [];
            this.world.addEntity(this.player);
            
            // --- Determine safe Y position after switching world object ---
            let newX = Math.floor(this.player.x);
            let newZ = Math.floor(this.player.z);
            let preferredY = this.world.dimension === -1 ? 64 : this.world.generator.seaLevel + 10;
            
            // Find safe spawn Y, implicitly loading surrounding chunks if necessary
            let spawnY = this.world.findSafeSpawnY(newX, newZ, preferredY);
            this.player.y = spawnY;
            
            // Ensure not stuck in wall (if previous logic failed)
            let currentBlockId = this.world.getBlockAt(newX, Math.floor(this.player.y), newZ);
            let block = Block.getById(currentBlockId);

            if (currentBlockId !== 0 && block && block.isSolid()) {
                // Last resort: Teleport up 5 blocks if stuck
                this.player.y += 5;
            }
            
            // Create a return portal at the arrival location
            if (this.world.dimension === -1) { // Entering Nether
                this.world.buildPortal(Math.floor(this.player.x), Math.floor(this.player.y), Math.floor(this.player.z));
            }

            // Refresh renderer references
            this.worldRenderer.blockRenderer.worldRenderer = this.worldRenderer; // Refresh ref just in case
            this.worldRenderer.rebuildAll();
            
            // Clear portal timer so we don't immediately switch back
            this.player.timeInPortal = 0;
            this.player.inPortal = false;
            
            this.displayScreen(null); // Close loading
            
            // Trigger achievement?
            if (targetWorld.dimension === -1) {
                // "We Need to Go Deeper"
                this.achievementManager.grant('intothenether');
            }
        }, 100);
    }

    hasInGameFocus(playerIdx = 0) {
        const screen = playerIdx === 0 ? this.currentScreen : this.currentScreen2;
        const ctrlActive = playerIdx === 0 ? this.controllerActive1 : this.controllerActive2;
        return (this.window.mouseLocked || ctrlActive) && screen === null;
    }

    isInGame() {
        return this.world !== null && this.worldRenderer !== null && this.player !== null;
    }

    requestNextFrame() {
        requestAnimationFrame(() => {
            if (this.running) {
                this.requestNextFrame();
                
                const now = performance.now();
                if (!this._lastFrameTime) this._lastFrameTime = now;
                const elapsed = now - this._lastFrameTime;
                const fpsCap = this.settings.fpsCap;
                const interval = 1000 / fpsCap;

                if (fpsCap >= 121 || elapsed >= interval) {
                    this._lastFrameTime = now - (elapsed % interval);
                    this.onLoop();
                }
            } else {
                this.window.close();
            }
        });
    }

    onLoop() {
        if (this.isContextLost) return;
        const startFrame = performance.now();

        // 1. Poll input as early as possible (Structure: Input -> Sim -> Render)
        this.inputLatencyStart = startFrame;
        this.pollInput();

        // 2. Update the timer
        this.timer.advanceTime();

        // 3. Call the tick to reach updates 20 per seconds (Simulation)
        for (let i = 0; i < this.timer.ticks; i++) {
            this.onTick();
        }

        // 4. Render the game
        this.onRender(this.timer.partialTicks);

        // Increase rendered frame
        this.frames++;

        const endFrame = performance.now();
        const frameTime = endFrame - startFrame;
        this.updatePerformanceFactor(frameTime);

        // Crash/Freeze Detection
        if (frameTime > 1000 && !this.isPaused() && this.world !== null) {
            this.lowFpsTimer++;
            if (this.lowFpsTimer > 10) { // 10 frozen frames in a row
                import("./gui/screens/GuiCrash.js").then(module => {
                    this.displayScreen(new module.default());
                });
                this.lowFpsTimer = 0;
            }
        } else {
            this.lowFpsTimer = 0;
        }

        // Loop if a second passed
        while (Date.now() >= this.lastTime + 1000) {
            this.fps = this.frames;
            this.lastTime += 1000;
            this.frames = 0;
        }
    }

    updatePerformanceFactor(frameTime) {
        // Track rolling average of frame times
        this.frameTimeHistory.push(frameTime);
        if (this.frameTimeHistory.length > 20) this.frameTimeHistory.shift();

        const avg = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
        
        // target: 16.6ms for 60fps.
        // If we are consistently over 25ms (under 40fps), aggressively throttle background tasks.
        if (avg > 30) this.performanceFactor = Math.max(0.05, this.performanceFactor - 0.15);
        else if (avg > 20) this.performanceFactor = Math.max(0.1, this.performanceFactor - 0.05);
        else if (avg < 16) this.performanceFactor = Math.min(1.0, this.performanceFactor + 0.04);

        // Dynamic throttling of lighting and chunk updates to prevent GPU hang
        if (this.performanceFactor < 0.8) {
            this.settings.maxLightUpdatesPerFrame = Math.max(50, Math.floor(1000 * this.performanceFactor));
            this.settings.lightUpdateBudgetMs = Math.max(2, Math.floor(8 * this.performanceFactor));
            this.settings.chunkRebuildBudgetMs = Math.max(1, Math.floor(4 * this.performanceFactor));
        } else {
            // Restore higher throughput when performance is stable
            this.settings.maxLightUpdatesPerFrame = 1000;
            this.settings.lightUpdateBudgetMs = 12;
            this.settings.chunkRebuildBudgetMs = 4;
        }

        // Debug overlay (optional, very small)
        if (this.frames % 20 === 0) {
            const el = document.getElementById('perf-overlay');
            if (el) el.innerText = `PF: ${this.performanceFactor.toFixed(2)} | AVG: ${avg.toFixed(1)}ms`;
        }
    }

    pollInput() {
        // Process controller
        this.pollControllerTick();
        this.pollControllerRender();

        // Process mouse movement immediately
        if (this.isInGame() && !this.isPaused() && this.hasInGameFocus()) {
            this.player.turn(this.window.mouseMotionX, this.window.mouseMotionY);
            this.window.mouseMotionX = 0;
            this.window.mouseMotionY = 0;
        }
    }

    onRender(partialTicks) {
        // Mark render start for latency measurement
        this.renderTimestamp = performance.now();

        if (this.isInGame()) {
            // Generate at most a small, time-budgeted amount of terrain per
            // frame (lighting for new chunks is computed inside).
            if (!this.isPaused()) {
                this.world.processChunkLoading();
            }

            // Render the game (supports splitscreen via worldRenderer.render call)
            this.worldRenderer.render(this.isPaused() ? 0 : partialTicks);
            if (this.cameraManager) {
                this.cameraManager.renderBroadcast(this.isPaused() ? 0 : partialTicks);
                this.cameraManager.renderWorldMonitors(this.isPaused() ? 0 : partialTicks);
            }
        }

        this.screenRenderer.render(partialTicks);
    }

    startSleeping() {
        if (this.sleepTimer > 0) return;
        this.sleepTimer = 1;
    }

    displaySavingScreen(title) {
        this.loadingScreen = new GuiLoadingScreen();
        this.loadingScreen.isSaving = true; // Add a flag to prevent progress bar
        this.loadingScreen.setTitle(title);
        this.displayScreen(this.loadingScreen);
    }

    displayScreen(screen, playerIdx = 0) {
        if (this.player?.isCameraman && screen instanceof GuiInventory) return;
        if (typeof screen === "undefined") {
            console.error("Tried to display an undefined screen");
            return;
        }

        const currentField = playerIdx === 0 ? 'currentScreen' : 'currentScreen2';

        // Close previous screen
        if (this[currentField] !== null) {
            this[currentField].onClose();
        }

        // If trying to close all screens (null) but no world is loaded, default to Main Menu
        if (screen === null && this.world === null) {
            screen = new GuiMainMenu();
        }

        // Switch screen
        this[currentField] = screen;

        // Reset item renderer to clear cached 3D GUI meshes from the previous screen
        if (this.itemRenderer) {
            this.itemRenderer.reset();
        }

        // Update window size and screen context
        this.window.updateWindowSize();

        // Initialize new screen
        if (screen === null) {
            // Ensure controller cursor is hidden when returning to game
            this.usingControllerCursor = false;
            if (playerIdx === 0) this.window.requestFocus();
            if (playerIdx === 0) {
                this.isLeftMouseDown = false;
                this.isRightMouseDown = false;
            }
        } else {
            if (playerIdx === 0) this.window.exitFocus();
            screen.playerIdx = playerIdx;
            screen.player = playerIdx === 0 ? this.player : this.player2;
            
            // Adjust size for splitscreen setup
            let w = this.window.width;
            let h = this.window.height;
            if (this.player2) {
                if (this.settings.splitscreenMode === 'vertical') h /= 2;
                else w /= 2;
            }
            screen.setup(this, w, h);
        }

        // Show/hide virtual keyboard for mobile
        if (playerIdx === 0 && this.window && this.window.isMobile) {
            if (screen instanceof GuiCreateWorld) {
                let prefill = (screen.fieldSeed && typeof screen.fieldSeed.getText === 'function') ? screen.fieldSeed.getText() : "";
                this.window.showVirtualKeyboard(prefill);
            } else {
                this.window.hideVirtualKeyboard();
            }
        }
    }

    pollControllerTick() {
        if (!this.player) return;
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        
        const p1Idx = this.p1GamepadIndex;
        const p2Idx = this.p2GamepadIndex;

        // Player 1 controller logic
        if (p1Idx !== -1 && gamepads[p1Idx] && gamepads[p1Idx].buttons) {
            this.handleControllerInput(gamepads[p1Idx], this.player, 0);
            this.controllerActive = this.controllerActive1;
        } else {
            this.prevButtons1 = null;
            this.controllerActive = false;
        }

        // Player 2 controller logic
        if (this.player2 && p2Idx !== -1 && gamepads[p2Idx] && gamepads[p2Idx].buttons) {
            this.handleControllerInput(gamepads[p2Idx], this.player2, 1);
        } else {
            this.prevButtons2 = null;
        }
    }

    handlePlayerInteraction(player, playerIdx) {
        let hitResult = player.rayTrace(5, this.timer.partialTicks, true);
        if (!hitResult) return;

        let typeId = this.world.getBlockAt(hitResult.x, hitResult.y, hitResult.z);
        let block = Block.getById(typeId);
        
        // 1. Try interaction
        if (block && block.onBlockActivated(this.world, hitResult.x, hitResult.y, hitResult.z, player)) {
            player.swingArm();
            return;
        }

        // 2. Try placing
        let heldId = player.inventory.getItemInSelectedSlot();
        if (heldId !== 0) {
            let heldBlock = Block.getById(heldId);
            if (heldBlock && typeof heldBlock.onItemUse === 'function') {
                if (heldBlock.onItemUse(this.world, hitResult.x, hitResult.y, hitResult.z, hitResult.face, player)) return;
            }

            let px = hitResult.x + hitResult.face.x, py = hitResult.y + hitResult.face.y, pz = hitResult.z + hitResult.face.z;
            if (this.world.getBlockAt(px, py, pz) === 0 && heldBlock && heldBlock.canPlaceBlockAt(this.world, px, py, pz)) {
                this.world.setBlockAt(px, py, pz, heldId, 0);
                heldBlock.onBlockPlaced(this.world, px, py, pz, hitResult.face);
                player.swingArm();
                if (player.gameMode !== 1) player.inventory.consumeItem(heldId);
                let s = heldBlock.getSound();
                if (s) this.soundManager.playSound(s.getStepSound(), px+0.5, py+0.5, pz+0.5, 0.5, s.getPitch()*0.8);
            }
        }
    }

    handleControllerQuickMove() {
        const screen = this.currentScreen;
        if (!screen || typeof screen.getSlotAt !== 'function') return;

        const slotIdx = screen.getSlotAt(this.window.mouseX, this.window.mouseY);
        if (slotIdx === -1) return;

        let sourceStack = null;
        let isCreativeGrid = false;

        // Extract item from screen
        if (screen.constructor.name === "GuiInventory") {
            if (slotIdx <= -200 && slotIdx > -300) {
                // Creative grid
                isCreativeGrid = true;
                const items = screen.getVisibleItemsForTab(screen.selectedTab);
                const totalRows = Math.ceil(items.length / 9);
                const scrollRow = (totalRows > 5) ? Math.round(screen.currentScroll * (totalRows - 5)) : 0;
                const realIdx = (scrollRow * 9) + (-(slotIdx + 200));
                if (realIdx < items.length) sourceStack = { id: items[realIdx], count: 64 };
            } else if (slotIdx >= 0) {
                sourceStack = screen.inventory.getStackInSlot(slotIdx);
            }
        } else if (screen.constructor.name === "GuiChest" || screen.constructor.name === "GuiFurnace" || screen.constructor.name === "GuiDispenser") {
            if (slotIdx >= 100) {
                const teItems = (screen.te && screen.te.items) ? screen.te.items : (screen.chestItems || []);
                sourceStack = teItems[slotIdx - 100];
            } else {
                sourceStack = this.player.inventory.getStackInSlot(slotIdx);
            }
        }

        if (!sourceStack || sourceStack.id === 0) return;

        // Find best hotbar slot (0-8)
        let targetSlot = -1;
        // 1. Try to find existing stack
        for (let i = 0; i < 9; i++) {
            const hotStack = this.player.inventory.items[i];
            if (hotStack.id === sourceStack.id && hotStack.count < 64) {
                targetSlot = i;
                break;
            }
        }
        // 2. Find empty slot
        if (targetSlot === -1) {
            for (let i = 0; i < 9; i++) {
                if (this.player.inventory.items[i].id === 0) {
                    targetSlot = i;
                    break;
                }
            }
        }
        // 3. Fallback to current selected slot
        if (targetSlot === -1) targetSlot = this.player.inventory.selectedSlotIndex;

        // Perform move
        if (isCreativeGrid) {
            this.player.inventory.items[targetSlot] = { id: sourceStack.id, count: 64, damage: 0, tag: {} };
        } else {
            // Transfer logic
            const target = this.player.inventory.items[targetSlot];
            if (target.id === 0 || target.id === sourceStack.id) {
                const add = Math.min(64 - target.count, sourceStack.count);
                target.id = sourceStack.id;
                target.count += add;
                target.damage = sourceStack.damage || 0;
                target.tag = JSON.parse(JSON.stringify(sourceStack.tag || {}));
                sourceStack.count -= add;
                if (sourceStack.count <= 0) {
                    sourceStack.id = 0;
                    sourceStack.tag = {};
                    sourceStack.damage = 0;
                }
            }
        }

        this.soundManager.playSound("random.click", 0, 0, 0, 0.4, 1.2);
        if (screen.updateTradeOutput) screen.updateTradeOutput();
        if (screen.updateCraftingOutput) screen.updateCraftingOutput();
    }

    handleControllerInput(gp, player, playerIdx) {
        const s = this.settings;
        const b = s.controllerBinds;
        if (!b) return;
        const deadzone = s.controllerDeadzone || 0.15;

        const prevButtons = playerIdx === 0 ? this.prevButtons1 : this.prevButtons2;
        const wasDown = (idx) => prevButtons && prevButtons[idx];
        const isDown = (idx) => idx !== undefined && idx >= 0 && idx < gp.buttons.length && (gp.buttons[idx].pressed || gp.buttons[idx].value > 0.5);
        const isPressed = (idx) => isDown(idx) && !wasDown(idx);

        if (this.currentScreen === null) {
            if (playerIdx === 0) {
                for (let i = 0; i < gp.buttons.length; i++) {
                    if (gp.buttons[i].pressed && !this.window.mouseLocked) {
                        this.window.requestFocus();
                        break;
                    }
                }
            }

            // High-freq look (Applied here for all players)
            let lookX = gp.axes[2];
            let lookY = gp.axes[3];
            if (Math.abs(lookX) < deadzone) lookX = 0;
            if (Math.abs(lookY) < deadzone) lookY = 0;
            if (lookX !== 0 || lookY !== 0) {
                const sensitivity = (s.sensitivity / 100) * 4.0;
                player.turn(lookX * 10 * sensitivity, (s.controllerInvertY ? lookY : -lookY) * 10 * sensitivity);
            }

            // Movement
            let moveX = gp.axes[0];
            let moveY = gp.axes[1];
            if (Math.abs(moveX) < deadzone) moveX = 0;
            if (Math.abs(moveY) < deadzone) moveY = 0;
            
            player.moveStrafing = -moveX;
            player.moveForward = -moveY;

            let active = (moveX !== 0 || moveY !== 0 || isDown(b.mine) || isDown(b.place) || isDown(b.jump));
            if (playerIdx === 0) this.controllerActive1 = active;
            else this.controllerActive2 = active;
            
            player.isControllerActive = active;

            if (isDown(b.jump)) player.jumping = true;
            
            // Toggle Sneak with 100ms delay
            if (isPressed(b.sneak)) {
                const now = Date.now();
                if (now - this.lastSneakToggleTime > 100) {
                    player.isSneakingPersistent = !player.isSneakingPersistent;
                    this.lastSneakToggleTime = now;
                }
            }
            
            // If gamepad is active, use toggle. If keyboard is active, it's combined with hold logic in updateKeyboardInput.
            player.sneaking = player.isSneakingPersistent;

            if (isDown(b.sprint)) player.sprinting = true;
            if (isPressed(b.drop)) player.dropCurrentItem();
            if (isPressed(b.perspective)) {
                this.settings.thirdPersonView = (this.settings.thirdPersonView + 1) % 3;
                this.settings.save();
            }

            if (isDown(b.mine)) {
                if (playerIdx === 0) {
                    this.onMouseClicked(0);
                    this._controllerMineDown = true;
                } else {
                    player.swingArm();
                    this._controllerMineDown2 = true;
                }
            } else {
                if (playerIdx === 0) this._controllerMineDown = false;
                else this._controllerMineDown2 = false;
            }

            const cooldownField = playerIdx === 0 ? 'controllerPlaceCooldown1' : 'controllerPlaceCooldown2';
            if (isDown(b.place) || isDown(2)) {
                if (this[cooldownField] <= 0) {
                    if (playerIdx === 0) {
                        this.onMouseClicked(2);
                        this._controllerPlaceDown = true;
                    } else {
                        this.handlePlayerInteraction(player, playerIdx);
                        this._controllerPlaceDown2 = true;
                    }
                    this[cooldownField] = 4; // 200ms delay
                }
            } else {
                if (playerIdx === 0) this._controllerPlaceDown = false;
                else this._controllerPlaceDown2 = false;
            }

            if (isPressed(b.inventory)) this.displayScreen(new GuiInventory(player), playerIdx);
            if (isPressed(b.menu)) this.displayScreen(new GuiIngameMenu(), playerIdx);
            if (isPressed(b.next_item)) player.inventory.shiftSelectedSlot(1);
            if (isPressed(b.prev_item)) player.inventory.shiftSelectedSlot(-1);

        } else if (playerIdx === 0 && this.currentScreen !== null) {
            // Menu navigation only for P1
            if (isPressed(b.jump)) this.currentScreen.mouseClicked(this.window.mouseX, this.window.mouseY, 0);
            if (isPressed(2)) this.currentScreen.mouseClicked(this.window.mouseX, this.window.mouseY, 2); // Square -> Right Click
            
            // Triangle (3) -> Quick Stack to Hotbar
            if (isPressed(3)) {
                this.handleControllerQuickMove();
            }

            // Both Pause and Sneak (Circle) button close the menu
            if (isPressed(b.menu) || isPressed(b.sneak)) this.displayScreen(null, 0);
        } else if (playerIdx === 1 && this.currentScreen2 !== null) {
            // Menu navigation for P2 (limited cursor shared)
            if (isPressed(b.jump)) this.currentScreen2.mouseClicked(this.window.mouseX, this.window.mouseY - (this.settings.splitscreenMode === 'vertical' ? this.window.height / 2 : 0), 0);
            if (isPressed(b.menu) || isPressed(b.sneak)) this.displayScreen(null, 1);
        }

        if (playerIdx === 0) this.prevButtons1 = gp.buttons.map(btn => btn.pressed || btn.value > 0.5);
        else this.prevButtons2 = gp.buttons.map(btn => btn.pressed || btn.value > 0.5);
    }

    pollControllerRender() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0];
        if (!gp || !gp.buttons || !gp.axes) return;

        const s = this.settings;
        const deadzone = s.controllerDeadzone || 0.15;

        if (this.currentScreen !== null) {
            let moveX = gp.axes[0];
            let moveY = gp.axes[1];
            if (Math.abs(moveX) < deadzone) moveX = 0;
            if (Math.abs(moveY) < deadzone) moveY = 0;

            if (moveX !== 0 || moveY !== 0) {
                const cursorSpeed = s.controllerCursorSpeed || 6.0; 
                this.window.mouseX = Math.max(0, Math.min(this.window.width, this.window.mouseX + moveX * cursorSpeed));
                this.window.mouseY = Math.max(0, Math.min(this.window.height, this.window.mouseY + moveY * cursorSpeed));
                this.usingControllerCursor = true;
            }

            // Right stick Y axis for scrolling in menus
            let scrollY = gp.axes[3];
            if (Math.abs(scrollY) > deadzone) {
                // Negative because up on stick is negative, but scroll up is positive delta usually
                this.onMouseScroll(scrollY * 0.5); 
            }
        }
    }

    onTick() {
        if (this.controllerPlaceCooldown1 > 0) this.controllerPlaceCooldown1--;
        if (this.controllerPlaceCooldown2 > 0) this.controllerPlaceCooldown2--;

        // Update achievements (timer logic)
        this.achievementManager.update();

        // Handle Sleeping transition
        if (this.sleepTimer > 0) {
            this.sleepTimer++;
            if (this.sleepTimer === 20) { // Peak of the 2s black fade
                if (this.world) {
                    // Set to next morning (Day starts at 0, 24000, 48000...)
                    this.world.time = (Math.floor(this.world.time / 24000) + 1) * 24000;
                    this.addMessageToChat("§eYou slept through the night.");
                    
                    // Sync with multiplayer
                    if (this.multiplayer && this.multiplayer.isHosting) {
                        this.multiplayer.broadcast({ type: "time", time: this.world.time });
                    }
                }
            }
            if (this.sleepTimer >= 40) { // 2 seconds total at 20 TPS
                this.sleepTimer = 0;
            }
        }

        // Update Map if held
        if (this.player && this.player.inventory) {
            let item = this.player.inventory.getItemInSelectedSlot();
            if (item === 358) { // Map ID
                let map = Block.getById(358);
                if (map && typeof map.update === 'function') {
                    map.update(this.world, this.player);
                }
            }
        }

        // Autosave handling
        if (this.isInGame() && this.world && !this.isAutosaving) {
            const intervalSetting = this.settings.autosaveInterval;
            if (intervalSetting !== 4) { // 4 is "Off"
                const intervals = [1200, 6000, 12000, 36000]; // 1m, 5m, 10m, 30m in ticks
                const targetTicks = intervals[intervalSetting];
                
                this.autosaveTimer++;
                if (this.autosaveTimer >= targetTicks) {
                    this.autosaveTimer = 0;
                    this.isAutosaving = true;
                    this.autosaveDisplayTimer = 100; // Show for 5 seconds
                    // Silent autosave with UI feedback
                    this.world.saveWorldData().then(() => {
                        this.isAutosaving = false;
                    });
                }
            }
        }

        if (this.autosaveDisplayTimer > 0) {
            this.autosaveDisplayTimer--;
        }

        if (this.isInGame() && !this.isPaused()) {
            // Update time played stat
            this.stats.timePlayed++;

            // Creative break cooldown
            if (this.creativeBreakCooldown > 0) {
                this.creativeBreakCooldown--;
            }

            // Handle snowball and pearl throw delay
            if (this.snowballThrowTimer > 0) {
                this.snowballThrowTimer--;
            }
            if (this.enderPearlThrowTimer > 0) {
                this.enderPearlThrowTimer--;
            }
            // Tick world
            this.world.onTick();

            // Tick multiplayer
            if (this.multiplayer) {
                this.multiplayer.onTick();
            }

            // Tick renderer
            this.worldRenderer.onTick();
            if (this.cameraManager) this.cameraManager.tick();

            // Tick particles
            if (this.particleManager) {
                this.particleManager.tick();
            }

            // Tick overlay (Chat fading)
            if (this.ingameOverlay) {
                this.ingameOverlay.onTick();
            }

            // Handle Performance stabilization logic
            // Wait for performance to stay high for 5 continuous seconds (100 ticks at 20 TPS)
            if (this.originalSettingsSnapshot !== null && !this.loadingScreen) {
                // Stabilize when performance factor is high (meaning frame times are low/consistent)
                if (this.performanceFactor > 0.85) {
                    this.stabilityTimer++;
                    if (this.stabilityTimer >= 100) {
                        // Restore all original settings and save them
                        Object.assign(this.settings, this.originalSettingsSnapshot);
                        this.settings.save();
                        this.originalSettingsSnapshot = null;
                        this.addMessageToChat("§aPerformance stabilized! Restoring original settings.");
                        // Trigger world re-evaluation to apply restored settings
                        if (this.worldRenderer) this.worldRenderer.rebuildAll();
                        if (this.worldRenderer) this.worldRenderer.flushRebuild = true;
                    }
                } else {
                    // Reset timer if performance drops during the window
                    this.stabilityTimer = 0;
                }
            }

            // Update bow pull duration
            let itemStackId = this.player.inventory.getItemInSelectedSlot();

            // Check if right mouse is down (aiming)
            const isPlacing = this.isRightMouseDown || this._controllerPlaceDown;

            // Check A Seedy Place trigger
            if (this.stats.itemsPlanted > 0) {
                // This is a simplified check if a player has ever planted
                // We'll add actual trigger in onItemUse later
            }

            // Handle Item In Use (Eating)
            const foodIds = [260, 297, 319, 320, 322, 34, 35, 282, 349, 350, 354, 355, 363, 364, 365, 366, 367, 403, 404, 405, 406];
            let offhandStack = this.player.inventory.getStackInSlot(45);
            let offhandId = offhandStack.id;
            let mainBlock = Block.getById(itemStackId);
            let offhandBlock = Block.getById(offhandId);
            
            let isMainFood = foodIds.includes(itemStackId) || (mainBlock && mainBlock.isFood);
            let isOffhandFood = foodIds.includes(offhandId) || (offhandBlock && offhandBlock.isFood);
            let isMainDrink = (mainBlock && mainBlock.isDrinkable);
            let isOffhandDrink = (offhandBlock && offhandBlock.isDrinkable);
            
            // Priority: main hand if hungry or drinkable, then offhand
            let activeEatingId = 0;
            let activeEatingBlock = null;
            let isOffhandActive = false;

            if ((isMainFood && (itemStackId === 322 || this.player.foodLevel < 20)) || isMainDrink) {
                activeEatingId = itemStackId;
                activeEatingBlock = mainBlock;
            } else if ((isOffhandFood && (offhandId === 322 || this.player.foodLevel < 20)) || isOffhandDrink) {
                activeEatingId = offhandId;
                activeEatingBlock = offhandBlock;
                isOffhandActive = true;
            }

            if (this.hasInGameFocus() && isPlacing && activeEatingId !== 0) {
                if (this.player.itemInUse !== activeEatingId) {
                    this.player.itemInUse = activeEatingId;
                    this.player.itemInUseTimer = 0;
                    this.player.isUsingOffhand = isOffhandActive;
                }
                this.player.itemInUseTimer++;

                // Play eating sound and spawn particles
                if (this.player.itemInUseTimer % 4 === 0) {
                    this.soundManager.playSound("random.eat", this.player.x, this.player.y, this.player.z, 0.5, 1.0);
                    this.particleManager.spawnEatingParticles(this.player, activeEatingBlock);
                }

                // Finish eating
                if (this.player.itemInUseTimer >= 30) {
                    this.player.eat(activeEatingId);
                    if (this.player.gameMode !== 1) {
                        if (this.player.isUsingOffhand) {
                            offhandStack.count--;
                            if (offhandStack.count <= 0) this.player.inventory.offhand = {id: 0, count: 0, damage: 0, tag: {}};
                        } else {
                            this.player.inventory.consumeItem(activeEatingId);
                            // Return empty bowl for stew
                            if (activeEatingId === 282) {
                                this.player.inventory.addItem(281, 1);
                            }
                        }
                    }
                    this.player.itemInUse = null;
                    this.player.itemInUseTimer = 0;
                }
            } else {
                this.player.itemInUse = null;
                this.player.itemInUseTimer = 0;
            }

            if (this.hasInGameFocus() && isPlacing && itemStackId === BlockRegistry.BOW.getId()) {
                if (this.bowPullDuration === 0) this.player.updateFOVModifier();
                this.bowPullDuration++;
            } else {
                if (this.bowPullDuration > 0) {
                    this.bowPullDuration = 0;
                    this.player.updateFOVModifier();
                }
                this.bowPullDuration = 0;
            }

            // Handle Crossbow Pulling & Loading
            let heldStack = this.player.inventory.getStackInSlot(this.player.inventory.selectedSlotIndex);
            if (this.hasInGameFocus() && itemStackId === 499) { // Crossbow ID
                const isLoaded = !!(heldStack.tag && heldStack.tag.charged);
                
                // Reset re-arm block if they stop clicking
                if (!isPlacing) {
                    this._canReloadCrossbow = true;
                }

                // Only pull if not already loaded AND allowed to reload (clicked again)
                if (isPlacing && !isLoaded && this._canReloadCrossbow) {
                    if (this.crossbowPullDuration === 0) {
                        this.soundManager.playSound("crossbow.loading_start", this.player.x, this.player.y, this.player.z, 1.0, 1.0);
                        this.player.updateFOVModifier();
                    }
                    
                    // Quick Charge Enchantment
                    let speedMult = 1.0;
                    if (heldStack.tag && heldStack.tag.enchantments && heldStack.tag.enchantments.quick_charge) {
                        speedMult = 1.0 + (heldStack.tag.enchantments.quick_charge * 0.5);
                    }
                    this.crossbowPullDuration += speedMult;
                    
                    if (this.crossbowPullDuration === 8 || this.crossbowPullDuration === 16) {
                        this.soundManager.playSound("crossbow.loading_middle", this.player.x, this.player.y, this.player.z, 1.0, 1.0);
                    }
                    
                    // Finish charging at 24 ticks
                    if (this.crossbowPullDuration >= 24) {
                        heldStack.tag = Object.assign(heldStack.tag || {}, { charged: true });
                        this.crossbowPullDuration = 0;
                        this.player.updateFOVModifier();
                        // Prevent immediate firing on the release of this charge click
                        this._crossbowJustLoaded = true;
                        this.soundManager.playSound("crossbow.loading_end", this.player.x, this.player.y, this.player.z, 1.0, 1.0);
                    }

                    // Update GUI icons to show pulling progress
                    if (this.itemRenderer) {
                        const renderId = "hotbar" + this.player.inventory.selectedSlotIndex;
                        if (this.itemRenderer.items[renderId]) {
                            this.itemRenderer.items[renderId].dirty = true;
                        }
                    }
                } else if (!isPlacing) {
                    if (this.crossbowPullDuration > 0) {
                        this.crossbowPullDuration = 0;
                        this.player.updateFOVModifier();
                    }
                    this.crossbowPullDuration = 0; // Reset progress if button released before finish
                }
            } else {
                this.crossbowPullDuration = 0;
            }

            // Handle block breaking
            this.handleBlockBreaking();

            // Tick sound pool updates
            if (this.soundManager) {
                this.soundManager.onTick();
            }

            // Decrease hit cooldown each tick so hit sounds repeat at a steady rate
            if (this.breakHitCooldown > 0) {
                this.breakHitCooldown--;
            }

            // Tick the players
            this.player.onUpdate();
            if (this.player2) this.player2.onUpdate();

            // Health regeneration logic removed from here, moved to PlayerEntity.onLivingUpdate
        }

        // Tick the screen
        if (this.currentScreen !== null) {
            this.currentScreen.updateScreen();
        }

        // Update loading progress
        if (this.loadingScreen !== null && this.isInGame()) {
            let cameraChunkX = Math.floor(this.player.x) >> 4;
            let cameraChunkZ = Math.floor(this.player.z) >> 4;

            let renderDistance = this.settings.viewDistance;
            let requiredChunks = Math.pow(renderDistance * 2 - 1, 2);
            let loadedChunks = this.world.chunks.size;

            // Chunks are now loaded via World.onTick boundary checks

            // Update progress
            let progress = 1 / requiredChunks * loadedChunks;
            this.loadingScreen.setProgress(progress);

            // Finish loading
            if (progress >= 0.99) {
                // Perform World Sanity Check
                if (this.isWorldMalformed()) {
                    // Abort and exit to main menu with notice
                    const msg = [
                        "Ouch! World generation failed.",
                        "The world appeared to be entirely underwater.",
                        "This can happen with certain seeds or browser",
                        "memory issues. Returning to Title Screen."
                    ];
                    
                    // Cleanup world references
                    if (this.worldRenderer) this.worldRenderer.reset();
                    this.world = null;
                    this.player = null;
                    this.loadingScreen = null;
                    this.displayScreen(new GuiNotice(new GuiMainMenu(), msg));
                    return;
                }

                this.loadingScreen = null;
                this.displayScreen(null);
            }
        }
    }

    /**
     * Checks if the currently loaded world is malformed (e.g. only water/void).
     */
    isWorldMalformed() {
        if (!this.world || !this.world.generator) return false;
        // Don't check special world types that are allowed to be "empty"
        if (this.world._gameType === 'skyblock' || this.world._gameType === 'oneblock' || this.world.worldType === 1 || this.world.worldType === 6) return false;
        // Only check Overworld
        if (this.world.dimension !== 0) return false;

        const sp = this.world.spawn;
        const samples = 12;
        let waterCount = 0;
        const range = 64;

        for (let i = 0; i < samples; i++) {
            // Check a variety of spots around spawn
            let rx = Math.floor(sp.x + (Math.random() - 0.5) * range);
            let rz = Math.floor(sp.z + (Math.random() - 0.5) * range);
            
            // If the highest block at this position is at or below sea level, it's water/ocean
            if (this.world.getHighestBlockAt(rx, rz) <= this.world.generator.seaLevel) {
                waterCount++;
            }
        }

        // If 100% of samples are underwater, the world is malformed
        return waterCount === samples;
    }

    handleBlockBreaking() {
        const players = [this.player, this.player2].filter(p => p !== null);
        
        for (let idx = 0; idx < players.length; idx++) {
            const p = players[idx];
            const isMining = (idx === 0) ? (this.isLeftMouseDown || this._controllerMineDown) : this._controllerMineDown2;
            
            if (!this.hasInGameFocus(idx) || p.gameMode === 3 || !isMining) {
                if (idx === 0) this.resetBreaking();
                else this.resetBreaking2();
                continue;
            }

            const breakingPosField = idx === 0 ? 'currentBreakingBlockPos' : 'currentBreakingBlockPos2';
            const progressField = idx === 0 ? 'breakingProgress' : 'breakingProgress2';
            const cooldownField = idx === 0 ? 'creativeBreakCooldown' : 'creativeBreakCooldown2';
            const hitCooldownField = idx === 0 ? 'breakHitCooldown' : 'breakHitCooldown2';

            let hitResult = p.rayTrace(5, this.timer.partialTicks);
            if (hitResult === null) {
                idx === 0 ? this.resetBreaking() : this.resetBreaking2();
                continue;
            }

            let pos = {x: hitResult.x, y: hitResult.y, z: hitResult.z};

            if (p.gameMode === 1) {
                p.swingArm();
                if (this[cooldownField] > 0) continue;
                this.breakBlock(pos.x, pos.y, pos.z, p);
                // Creative breaking can be repeated before the replacement
                // render/update finishes. Guarantee the One Block target is
                // present before the next click is processed.
                if (this.world && typeof this.world.ensureOneBlock === 'function') {
                    this.world.ensureOneBlock();
                }
                this[cooldownField] = 4;
                continue;
            }

            if (this[breakingPosField] === null || pos.x !== this[breakingPosField].x || pos.y !== this[breakingPosField].y || pos.z !== this[breakingPosField].z) {
                idx === 0 ? this.resetBreaking() : this.resetBreaking2();
                this[breakingPosField] = pos;
            }

            let typeId = this.world.getBlockAt(pos.x, pos.y, pos.z);
            if (typeId === 0) {
                idx === 0 ? this.resetBreaking() : this.resetBreaking2();
                continue;
            }

            let toolId = p.inventory.getItemInSelectedSlot();
            let heldStack = p.inventory.getStackInSlot(p.inventory.selectedSlotIndex);
            let breakTime = getBlockBreakTime(typeId, toolId);
            
            if (breakTime === Infinity) {
                idx === 0 ? this.resetBreaking() : this.resetBreaking2();
                continue;
            }

            if (breakTime <= 0.0) {
                this.breakBlock(pos.x, pos.y, pos.z, p);
                idx === 0 ? this.resetBreaking() : this.resetBreaking2();
                continue;
            }

            let increment = 1.0 / (breakTime * this.timer.ticksPerSecond);
            
            // Efficiency Enchantment
            if (toolId !== 0 && heldStack.tag && heldStack.tag.enchantments && heldStack.tag.enchantments.efficiency) {
                const level = heldStack.tag.enchantments.efficiency;
                increment *= 1 + (level * level + 1);
            }

            if (p.activeEffects.has("haste")) {
                increment *= (1.0 + 0.2 * (p.activeEffects.get("haste").amplifier + 1));
            }
            this[progressField] += increment;
            p.swingArm();

            if (this[hitCooldownField] <= 0) {
                let block = Block.getById(typeId);
                if (block) {
                    this.soundManager.playSound(block.getSound().getBreakSound(), pos.x + 0.5, pos.y + 0.5, pos.z + 0.5, 0.64, 1.0);
                    this.particleManager.spawnBlockHitParticles(this.world, pos.x, pos.y, pos.z, hitResult.face);
                    this[hitCooldownField] = Math.max(1, Math.floor(this.timer.ticksPerSecond * 0.2));
                }
            }

            if (this[progressField] >= 1.0) {
                this.breakBlock(pos.x, pos.y, pos.z, p);
                idx === 0 ? this.resetBreaking() : this.resetBreaking2();
            } else if (idx === 0 && this.multiplayer.connected && this.frames % 3 === 0) {
                // Sync breaking progress for animation
                this.multiplayer.broadcast({
                    type: "break_progress",
                    pos: pos,
                    progress: this[progressField]
                });
            }
        }
    }

    resetBreaking2() {
        this.currentBreakingBlockPos2 = null;
        this.breakingProgress2 = 0;
    }
    
    breakBlock(x, y, z, breaker = null, forceDrop = false) {
        const p = breaker || this.player;
        let typeId = this.world.getBlockAt(x, y, z);
        if (typeId === 0) return;

        const doublePlantIds = [39, 190, 191, 192, 204];
        const brokenBlockMeta = this.world.getBlockDataAt(x, y, z);
        const isBottomDoublePlant = doublePlantIds.includes(typeId) && (brokenBlockMeta & 8) === 0;

        // Increment stats
        this.stats.blocksBroken++;
        if (p && p.gameMode === 0 && typeof p.addExhaustion === 'function') {
            p.addExhaustion(0.005);
        }
        const oreIds = [14, 15, 16, 56, 73, 129, 153];
        if (oreIds.includes(typeId)) {
            this.stats.oresBroken++;
        }

        // Item onBreak Trigger
        let heldStack = p.inventory.getStackInSlot(p.inventory.selectedSlotIndex);
        if (heldStack && heldStack.tag && heldStack.tag.onBreak) {
            this.commandHandler.handleMessage(heldStack.tag.onBreak, true);
        }

        let block = Block.getById(typeId);
        if (!block) {
            // Force removal of invalid block to prevent stuck ghost blocks
            this.world.setBlockAt(x, y, z, 0);
            this.worldRenderer.flushRebuild = true;
            return;
        }
        
        // Handle Glass breaking sound
        const isGlass = typeId === 20 || (typeId >= 237 && typeId <= 250);
        
        // Spawn particles
        this.particleManager.spawnBlockBreakParticles(this.world, x, y, z, block);

        let sound = block.getSound();
        if (sound) {
            let soundName = sound.getBreakSound();

            // Special case for crops: use crop.break instead of step.grass
            if (typeId === 59 || typeId === 141 || typeId === 142) {
                soundName = "crop.break";
            }

            // Glass break override
            if (isGlass) {
                soundName = "block.glass.break";
            }

            this.soundManager.playSound(
                soundName,
                x + 0.5,
                y + 0.5,
                z + 0.5,
                0.8,
                1.0
            );
        }

        // Capture tile entity contents BEFORE removing the block so we can drop them.
        let tileEntityData = this.world.getTileEntity(x, y, z);

        // Call block specific cleanup
        if (typeof block.onDestroy === 'function') {
            block.onDestroy(this.world, x, y, z);
        }

        // Explicitly clear the upper half when the lower half is broken.
        // This prevents the upper block from being processed as a second,
        // standalone foliage item by any follow-up break/update.
        if (isBottomDoublePlant && this.world.getBlockAt(x, y + 1, z) === typeId) {
            this.world.setBlockAt(x, y + 1, z, 0);
        }

        this.world.setBlockAt(x, y, z, 0);
        this.worldRenderer.flushRebuild = true;
        
        // Sync with multiplayer
        // One Block regeneration already syncs the replacement block from
        // World.setBlockAt(); sending air here afterward reintroduces the
        // fast-creative-delete race.
        const isOneBlockTarget = this.world && typeof this.world.isOneBlockPosition === 'function' &&
            this.world.isOneBlockPosition(x, y, z);
        if (this.multiplayer && this.multiplayer.connected && !isOneBlockTarget) {
            this.multiplayer.onBlockChanged(x, y, z, 0);
        }
        


        // Apply Durability Loss to Held Tool (if Survival)
        if (p.gameMode !== 1) {
            let slotIndex = p.inventory.selectedSlotIndex;
            let itemStack = p.inventory.items[slotIndex];
            
            if (itemStack && itemStack.id !== 0) {
                let toolBlock = Block.getById(itemStack.id);
                if (toolBlock && toolBlock.maxDamage > 0) {
                    // Unbreaking Enchantment
                    let chanceToBreak = 1.0;
                    if (itemStack.tag && itemStack.tag.enchantments && itemStack.tag.enchantments.unbreaking) {
                        chanceToBreak = 1.0 / (itemStack.tag.enchantments.unbreaking + 1);
                    }
                    
                    if (Math.random() < chanceToBreak) {
                        itemStack.damage = (itemStack.damage || 0) + 1;
                    }

                    if (itemStack.damage >= toolBlock.maxDamage) {
                        p.inventory.setStackInSlot(slotIndex, 0, 0);
                        this.soundManager.playSound("random.break_tool", p.x, p.y, p.z, 1.0, 1.0);
                    }
                }
            }
        }

        // Spawn dropped item entity
        const shouldDrop = forceDrop || (p.gameMode !== 1 && (!this.multiplayer.connected || this.multiplayer.isHosting));
        
        if (shouldDrop) { 
            let dropY = y + 0.5;
            if (this.world._gameType === 'oneblock' && this.world.oneBlock && x === this.world.oneBlock.pos.x && y === this.world.oneBlock.pos.y && z === this.world.oneBlock.pos.z) {
                dropY = y + 1.3;
            }

            const spawnBlockDrop = (dropX, dropYPosition, dropZ, itemId, count, tag = null) => {
                const item = new DroppedItem(
                    this.world,
                    dropX,
                    dropYPosition,
                    dropZ,
                    itemId,
                    count,
                    tag,
                    false,
                    4
                );
                this.world.droppedItems.push(item);
                return item;
            };

            let toolId = p.inventory.getItemInSelectedSlot();
            
            if (canHarvestBlock(typeId, toolId)) {
                if (typeId === 181) {
                    let meta = this.world.getBlockDataAt(x, y, z);
                    let ids = BlockRegistry.MIXED_SLAB.constructor.getSlabIdsFromMeta(meta);
                    [ids.bottom, ids.top].forEach(id => {
                        if (id !== 0) {
                            spawnBlockDrop(x + 0.5, dropY, z + 0.5, id, 1);
                        }
                    });
                    return;
                }

                let dropId = typeId;
                let dropCount = 1;

                if (typeId === 1) dropId = 4;
                if (typeId === 2) dropId = 3;
                if (typeId === 566) dropId = 3; // Path drops dirt
                if (typeId === 16) dropId = 263;
                if (typeId === 57) dropId = 264; // Diamond Block -> Diamond
                if (typeId === 129) dropId = 388;
                if (typeId === 153) dropId = 415; // Quartz Ore -> Quartz Item
                
                if (typeId === 89) { 
                    dropId = BlockRegistry.GLOWSTONE_DUST.getId();
                    dropCount = 2 + Math.floor(Math.random() * 2);
                }

                if (typeId === 73) {
                    dropId = 331;
                    dropCount = 3 + Math.floor(Math.random() * 2);
                }
                
                if (typeId === 142) {
                    dropId = 405;
                    dropCount = 1 + Math.floor(Math.random() * 3);
                }
                if (typeId === 141) {
                    dropId = 403;
                    dropCount = 1 + Math.floor(Math.random() * 3);
                }
                if (typeId === 59 || typeId === 141 || typeId === 142 || typeId === 420) { // Wheat, Carrot, Potato, Beetroot
                    if (typeId === 420) {
                        let meta = this.world.getBlockDataAt(x, y, z);
                        if (meta >= 3) {
                            let rCount = 1 + Math.floor(Math.random() * 2);
                            spawnBlockDrop(x + 0.5, dropY, z + 0.5, 422, rCount); // Beetroot
                            spawnBlockDrop(x + 0.5, dropY, z + 0.5, 421, 2); // Seeds
                        } else {
                            spawnBlockDrop(x + 0.5, dropY, z + 0.5, 421, 1);
                        }
                        dropId = 0;
                    } else if (typeId === 59) {
                        let meta = this.world.getBlockDataAt(x, y, z);
                        if (meta >= 7) {
                            let wheatCount = 2 + Math.floor(Math.random() * 2);
                            spawnBlockDrop(x + 0.5, dropY, z + 0.5, 296, wheatCount);
                            spawnBlockDrop(x + 0.5, dropY, z + 0.5, 402, 2);
                        } else {
                            spawnBlockDrop(x + 0.5, dropY, z + 0.5, 402, 1);
                        }
                        dropId = 0;
                    }
                }

                // Silk Touch logic
                if (heldStack.tag && heldStack.tag.enchantments && heldStack.tag.enchantments.silk_touch) {
                    const silkExcludes = [59, 141, 142, 420]; // Crops
                    if (!silkExcludes.includes(typeId)) {
                        dropId = typeId;
                        dropCount = 1;
                    }
                } else {
                    // Fortune logic
                    if (heldStack.tag && heldStack.tag.enchantments && heldStack.tag.enchantments.fortune) {
                        const fortId = [14, 15, 16, 56, 129, 73]; // Ores
                        if (fortId.includes(typeId)) {
                            dropCount = 1 + Math.floor(Math.random() * (heldStack.tag.enchantments.fortune + 1));
                        }
                    }

                    if (typeId === 13) {
                        if (Math.random() < 0.10) dropId = 318;
                        else dropId = 13;
                    }
                }

                if (typeId === 82) {
                    dropId = 337;
                    dropCount = 4;
                }

                const SHEARS_ID = BlockRegistry.SHEARS.getId();
                // Leaf IDs: 18 (Oak), 203 (Birch), 212 (Spruce), 325 (Acacia), 326 (Dark Oak)
                const LEAF_IDS = [18, 203, 212, 325, 326];
                if (LEAF_IDS.includes(typeId)) {
                    if (toolId === SHEARS_ID) {
                        dropId = typeId;
                    } else {
                        dropId = 0;
                        // Determine sapling based on leaf type
                        let saplingId = BlockRegistry.OAK_SAPLING.getId();
                        if (typeId === 203) saplingId = BlockRegistry.BIRCH_SAPLING.getId();
                        if (typeId === 212) saplingId = BlockRegistry.SPRUCE_SAPLING.getId();
                        if (typeId === 325) saplingId = BlockRegistry.ACACIA_SAPLING.getId();
                        if (typeId === 326) saplingId = BlockRegistry.DARK_OAK_SAPLING.getId();

                        if (Math.random() < 0.05) spawnBlockDrop(x + 0.5, dropY, z + 0.5, saplingId, 1);
                        if (Math.random() < 0.02) spawnBlockDrop(x + 0.5, dropY, z + 0.5, 280, 1);
                        if (typeId === 18 && Math.random() < 0.005) spawnBlockDrop(x + 0.5, dropY, z + 0.5, BlockRegistry.APPLE.getId(), 1);
                    }
                }
                
                const FLOWER_IDS = new Set([37, 38, 39, 191, 192]);
                if (!FLOWER_IDS.has(typeId) && (typeId === 31 || typeId === 32 || typeId === 190 || typeId === 204)) {
                    if (toolId === SHEARS_ID) dropId = typeId;
                    else dropId = 0;
                }

                // Breaking the bottom half is a cleanup operation, not a
                // request for a second foliage item.
                if (isBottomDoublePlant) dropId = 0;

                try {
                    if (tileEntityData && Array.isArray(tileEntityData.items)) {
                        for (let i = 0; i < tileEntityData.items.length; i++) {
                            const it = tileEntityData.items[i];
                            if (it && it.id && it.count) {
                                spawnBlockDrop(x + 0.5 + (Math.random()-0.5)*0.6, dropY, z + 0.5 + (Math.random()-0.5)*0.6, it.id, it.count, it.tag || null);
                            }
                        }
                        this.world.removeTileEntity(x, y, z);
                    }
                } catch (e) {
                    console.warn("Failed to drop tile entity items:", e);
                }

                if (dropId !== 0 && dropCount > 0) {
                    for (let i = 0; i < dropCount; i++) {
                        spawnBlockDrop(x + 0.5, dropY, z + 0.5, dropId, 1);
                    }
                }
            }
        }
    }

    resetBreaking() {
        this.currentBreakingBlockPos = null;
        this.breakingProgress = 0;
    }

    handleDebugStick(button) {
        const p = this.player;
        const world = this.world;
        let hit = p.rayTrace(5, this.timer.partialTicks);
        if (!hit) return;

        const id = world.getBlockAt(hit.x, hit.y, hit.z);
        const data = world.getBlockDataAt(hit.x, hit.y, hit.z);

        // Core properties for common blocks
        const FACING_NSWE = {n:"facing",m:3,v:["south","west","north","east"]};
        const WATERLOGGED = {n:"waterlogged",m:128,v:["false","true"]};
        const STAIR_HALF = {n:"half",m:8,v:["bottom","top"]};
        const STAIR_SHAPE = {n:"shape",m:112,v:["auto","straight","inner_left","inner_right","outer_left","outer_right"]};
        const FENCE_FORCED = {n:"forced_connections",m:16,v:["false","true"]};
        const FENCE_N = {n:"north",m:1,v:["false","true"]};
        const FENCE_S = {n:"south",m:2,v:["false","true"]};
        const FENCE_W = {n:"west",m:4,v:["false","true"]};
        const FENCE_E = {n:"east",m:8,v:["false","true"]};

        const DEBUG_PROPERTIES = {
            // Doors
            64: [FACING_NSWE, {n:"open",m:4,v:["false","true"]},{n:"half",m:8,v:["lower","upper"]}, WATERLOGGED],
            205: [FACING_NSWE, {n:"open",m:4,v:["false","true"]},{n:"half",m:8,v:["lower","upper"]}, WATERLOGGED],
            219: [FACING_NSWE, {n:"open",m:4,v:["false","true"]},{n:"half",m:8,v:["lower","upper"]}, WATERLOGGED],
            426: [FACING_NSWE, {n:"open",m:4,v:["false","true"]},{n:"half",m:8,v:["lower","upper"]}, WATERLOGGED],
            427: [FACING_NSWE, {n:"open",m:4,v:["false","true"]},{n:"half",m:8,v:["lower","upper"]}, WATERLOGGED],
            71: [FACING_NSWE, {n:"open",m:4,v:["false","true"]},{n:"half",m:8,v:["lower","upper"]}, WATERLOGGED],
            
            // Stairs
            53: [FACING_NSWE, STAIR_HALF, STAIR_SHAPE, WATERLOGGED],
            148: [FACING_NSWE, STAIR_HALF, STAIR_SHAPE, WATERLOGGED],
            146: [FACING_NSWE, STAIR_HALF, STAIR_SHAPE, WATERLOGGED],
            150: [FACING_NSWE, STAIR_HALF, STAIR_SHAPE, WATERLOGGED],
            154: [FACING_NSWE, STAIR_HALF, STAIR_SHAPE, WATERLOGGED],
            215: [FACING_NSWE, STAIR_HALF, STAIR_SHAPE, WATERLOGGED],
            216: [FACING_NSWE, STAIR_HALF, STAIR_SHAPE, WATERLOGGED],
            385: [FACING_NSWE, STAIR_HALF, STAIR_SHAPE, WATERLOGGED],
            407: [FACING_NSWE, STAIR_HALF, STAIR_SHAPE, WATERLOGGED],
            252: [FACING_NSWE, STAIR_HALF, STAIR_SHAPE, WATERLOGGED],

            // Fences
            85: [FENCE_FORCED, FENCE_N, FENCE_S, FENCE_W, FENCE_E, WATERLOGGED],
            217: [FENCE_FORCED, FENCE_N, FENCE_S, FENCE_W, FENCE_E, WATERLOGGED],
            218: [FENCE_FORCED, FENCE_N, FENCE_S, FENCE_W, FENCE_E, WATERLOGGED],
            387: [FENCE_FORCED, FENCE_N, FENCE_S, FENCE_W, FENCE_E, WATERLOGGED],
            419: [FENCE_FORCED, FENCE_N, FENCE_S, FENCE_W, FENCE_E, WATERLOGGED],
            139: [FENCE_FORCED, FENCE_N, FENCE_S, FENCE_W, FENCE_E, WATERLOGGED],

            // Utils
            50: [{n:"facing",m:7,v:["none","west","east","north","south","floor"]}, WATERLOGGED], // Torch
            65: [{n:"facing",m:7,v:["none","none","north","south","west","east"]}, WATERLOGGED], // Ladder
            106: [{n:"facing",m:7,v:["none","none","north","south","west","east"]}, WATERLOGGED], // Vine
            61: [FACING_NSWE, {n:"lit",m:4,v:["false","true"]}], // Furnace
            69: [{n:"facing",m:7,v:["down","east","west","south","north","up"]},{n:"powered",m:8,v:["false","true"]}],
            77: [{n:"facing",m:7,v:["down","east","west","south","north","up"]},{n:"powered",m:8,v:["false","true"]}],
            223: [{n:"facing",m:7,v:["down","east","west","south","north","up"]},{n:"powered",m:8,v:["false","true"]}],
            107: [FACING_NSWE, {n:"open",m:4,v:["false","true"]}], // Fence Gate
            96: [FACING_NSWE, {n:"open",m:4,v:["false","true"]}, STAIR_HALF], // Trapdoor
            224: [FACING_NSWE, {n:"open",m:4,v:["false","true"]}, STAIR_HALF],
            225: [FACING_NSWE, {n:"open",m:4,v:["false","true"]}, STAIR_HALF],
            226: [FACING_NSWE, {n:"open",m:4,v:["false","true"]}, STAIR_HALF],
            227: [FACING_NSWE, {n:"open",m:4,v:["false","true"]}, STAIR_HALF],
            228: [FACING_NSWE, {n:"open",m:4,v:["false","true"]}, STAIR_HALF],
            123: [{n:"lit",m:1,v:["false","true"]}], // Lamp toggle handled via setBlockAt
            
            // Natural
            2: [{n:"snowy",m:16,v:["false","true"]}], // Grass

            // Crops
            55: [{n:"power",m:15,v:["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"]}],
            59: [{n:"age",m:7,v:["0","1","2","3","4","5","6","7"]}],
            141: [{n:"age",m:3,v:["0","1","2","3"]}],
            142: [{n:"age",m:3,v:["0","1","2","3"]}],
            420: [{n:"age",m:3,v:["0","1","2","3"]}],
            78: [{n:"layers",m:7,v:["1","2","3","4","5","6","7","8"]}],
            
            // Logs
            17: [{n:"axis",m:12,v:["y","x","z","none"]}],
            200: [{n:"axis",m:12,v:["y","x","z","none"]}],
            209: [{n:"axis",m:12,v:["y","x","z","none"]}],
            235: [{n:"axis",m:12,v:["y","x","z","none"]}],
            253: [{n:"axis",m:12,v:["y","x","z","none"]}]
        };

        const props = DEBUG_PROPERTIES[id] || [{n:"waterlogged",m:128,v:["false","true"]}];
        if (!props) return;

        this.selectedDebugPropertyIndex = this.selectedDebugPropertyIndex % props.length;
        const prop = props[this.selectedDebugPropertyIndex];

        // Prop cycling logic
        if (button === 0) { // Left Click (Property)
            this.selectedDebugPropertyIndex = (this.selectedDebugPropertyIndex + 1) % props.length;
            const nextProp = props[this.selectedDebugPropertyIndex];
            const currentValIdx = this.getPropValueIdx(data, nextProp);
            this.debugStickDisplayText = `Selected property "${nextProp.n}" (${nextProp.v[currentValIdx]})`;
            this.debugStickDisplayTimer = 60;
            p.swingArm();
        } else if (button === 2) { // Right Click (Value)
            const currentValIdx = this.getPropValueIdx(data, prop);
            const nextValIdx = (currentValIdx + 1) % prop.v.length;
            
            // Construct new data value
            const shift = Math.floor(Math.log2(prop.m & -prop.m));
            let newData = (data & ~prop.m) | (nextValIdx << shift);

            // Special logic for Lamp toggling (changes ID)
            if (id === 123 && prop.n === "lit" && nextValIdx === 1) {
                world.setBlockAt(hit.x, hit.y, hit.z, 124, 0, true);
            } else if (id === 124 && prop.n === "lit" && nextValIdx === 0) {
                world.setBlockAt(hit.x, hit.y, hit.z, 123, 0, true);
            } else {
                world.setBlockAt(hit.x, hit.y, hit.z, id, newData, true);
            }

            this.debugStickDisplayText = `Changed property "${prop.n}" to ${prop.v[nextValIdx]}`;
            this.debugStickDisplayTimer = 60;
            p.swingArm();
            if (this.worldRenderer) this.worldRenderer.flushRebuild = true;
        }
    }

    getPropValueIdx(data, prop) {
        const shift = Math.floor(Math.log2(prop.m & -prop.m));
        const val = (data & prop.m) >> shift;
        return val % prop.v.length;
    }

    takeScreenshot() {
        const width = Math.floor(this.window.width * this.screenRenderer.resolution);
        const height = Math.floor(this.window.height * this.screenRenderer.resolution);

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = width;
        outputCanvas.height = height;
        const ctx = outputCanvas.getContext('2d');

        // Draw layers in order: World -> GUI (BG/Slots) -> 3D Items -> GUI Text/Counts
        const layers = [
            this.window.canvas,       // World (WebGL)
            this.window.canvas2d,     // GUI (2D)
            this.window.canvasItems,  // 3D Items (WebGL)
            this.window.canvasCounts  // GUI Text (2D)
        ];

        layers.forEach(canvas => {
            if (canvas && canvas.width > 0 && canvas.height > 0) {
                // Scale each layer to fit the output dimensions to ensure high-res world and pixel-grid GUI align
                ctx.drawImage(canvas, 0, 0, width, height);
            }
        });

        // Trigger Download
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const link = document.createElement('a');
        link.download = `screenshot-${timestamp}.png`;
        link.href = outputCanvas.toDataURL('image/png');
        link.click();
        
        this.addMessageToChat("§aSaved screenshot as " + link.download);
    }

    setCameramanEnabled(enabled) {
        const p=this.player;if(!p)return;p.isCameraman=!!enabled;p.cameraMode="operator";p.flying=false;p.cameraFov ||= this.settings.fov;p.cameraRoll ||= 0;
        if(p.renderer?.group)delete p.renderer.group.buildMeta;
        this.multiplayer?.updateMyPresence?.();
        this.addMessageToChat(enabled?"§aCameraman enabled":"§eCameraman disabled");
    }

    openCameraStudio(previous=null){this.displayScreen(new GuiCameraStudio(previous));}
    openCameraConfig(id,previous=null){this.displayScreen(new GuiCameraConfig(previous||new GuiCameraStudio(null),id));}

    onKeyPressed(button) {
        // A pending multiplayer invitation owns E while it is being held, so
        // accepting a player never opens the inventory underneath the toast.
        if(this.multiplayer?.consumeJoinAcceptKey?.(button))return;
        if (this.player && this.player.isCameraman) {
            if (button === "KeyV") { this.player.cameraMode = this.player.cameraMode === "freecam" ? "operator" : "freecam"; this.player.flying = this.player.cameraMode === "freecam"; this.addMessageToChat(`§bCameraman: ${this.player.cameraMode}`); return; }
            if (button === "BracketRight") { this.player.cameraFov = Math.min(120, (this.player.cameraFov || this.settings.fov) + 5); return; }
            if (button === "BracketLeft") { this.player.cameraFov = Math.max(20, (this.player.cameraFov || this.settings.fov) - 5); return; }
            if (button === "Equal") { this.cameraManager.controller.setSpeed(this.cameraManager.controller.speed + .03); return; }
            if (button === "Minus") { this.cameraManager.controller.setSpeed(this.cameraManager.controller.speed - .03); return; }
            if (button === "KeyZ") { this.player.cameraRoll = Math.max(-45,(this.player.cameraRoll||0)-5); return; }
            if (button === "KeyX") { this.player.cameraRoll = Math.min(45,(this.player.cameraRoll||0)+5); return; }
            if (button === this.settings.inventory || button === "KeyF" || button === this.settings.drop) return;
        }
        if (button === "F8") { this.displayScreen(new GuiCameraStudio(null)); return; }
        if (button === "KeyP") { this.cameraManager.startPlacement(); return; }
        if (button === "KeyE") { const camera=this.cameraManager.getLookedAtCamera(); if(camera){this.openCameraConfig(camera.id);return;} }
        if (button === "KeyN") { this.cameraManager.cycleSource(); return; }
        if (button === "KeyB") { this.cameraManager.setBroadcasting(!this.cameraManager.session.active); this.addMessageToChat(this.cameraManager.session.active ? "§cBroadcast preview ON" : "§7Broadcast preview OFF"); return; }
        if (button === "F2") {
            this.takeScreenshot();
            return;
        }

        for (let i = 1; i <= 9; i++) {
            if (button === 'Digit' + i) {
                this.player.inventory.selectedSlotIndex = i - 1;
            }
        }

        const settings = this.settings;

        if (button === settings.togglePerspective) {
            this.settings.thirdPersonView = (this.settings.thirdPersonView + 1) % 3;
            this.settings.save();
        }

        if (button === settings.inventory) {
            const riding = this.player.ridingEntity;
            if (riding && (riding.constructor.name.includes("Horse") || riding.constructor.name === "EntityDonkey" || riding.constructor.name === "EntityMule")) {
                if (riding.isTamed) {
                    import("./gui/screens/GuiHorseInventory.js").then(module => {
                        this.displayScreen(new module.default(this.player, riding));
                    });
                    return;
                }
            }
            this.displayScreen(new GuiInventory(this.player));
        }

        if (button === "KeyL") {
            this.soundManager.playSound("random.click", 0, 0, 0, 1.0, 1.0);
            this.displayScreen(new GuiAchievements(null));
        }

        if (button === settings.drop) {
            this.player.dropCurrentItem();
        }

        if (button === "KeyF") {
            this.swapHands();
        }

        // Chat inputs
        if (button === settings.command) {
            this.soundManager.playSound("random.click", 0, 0, 0, 1.0, 1.0);
            this.displayScreen(new GuiChat());
        }

        if (button === settings.chat) {
            this.soundManager.playSound("random.click", 0, 0, 0, 1.0, 1.0);
            this.displayScreen(new GuiChat());
        }
    }

    onMouseClicked(button) {
        if (this.cameraManager?.placement) { if(button===0)this.cameraManager.confirmPlacement(); else if(button===2)this.cameraManager.cancelPlacement(); return; }
        if (this.player && this.player.isCameraman) return;
        if (this.window.mouseLocked) {
            // Disable interaction in Spectator
            if (this.player && this.player.gameMode === 3) return;

            let heldStack = this.player.inventory.getStackInSlot(this.player.inventory.selectedSlotIndex);
            let heldId = heldStack ? heldStack.id : 0;

            // Debug Stick Logic
            if (heldId === 449) {
                this.handleDebugStick(button);
                return;
            }

            // --- ON HIT (Left Click) ---
            // Trigger onHit trigger regardless of whether we hit a block or entity
            if (button === 0) {
                if (heldStack && heldStack.tag && heldStack.tag.onHit) {
                    this.executeTaggedCommand(heldStack, heldStack.tag.onHit);
                }
            }

            // --- ON USE (Right Click) ---
            if (button === 2) {
                if (heldStack && heldStack.tag && (heldStack.tag.onUse || heldStack.tag.ui)) {
                    this.executeTaggedCommand(heldStack, heldStack.tag.onUse);
                    this.player.swingArm();
                    return;
                }

                // Handle Firing Loaded Crossbow (Immediate on Click)
                if (heldId === 499 && heldStack.tag && heldStack.tag.charged) {
                    // Only fire if we weren't just loading it in the same click
                    if (!this._crossbowJustLoaded) {
                        this.fireCrossbow(heldStack);
                        return;
                    }
                }
            }

            // Handle Throwable Anywhere
            if (button === 2) {
                let block = Block.getById(heldId);
                if (block && block.isThrowable) {
                    block.throwItem(this.world, this.player);
                    return;
                }
            }

            // Handle Fishing Rod
            if (button === 2) {
                if (heldId === 346) { // Fishing Rod
                    if (this.player.fishEntity) {
                        // Reel in
                        this.player.fishEntity.reelIn();
                        this.soundManager.playSound("random.bow", this.player.x, this.player.y, this.player.z, 0.5, 1.2);
                    } else {
                        // Cast
                        this.player.swingArm();
                        let hook = new EntityFishHook(this, this.world, this.player);
                        this.player.fishEntity = hook;
                        
                        let look = this.player.getLook(1.0);
                        let eyePos = this.player.getPositionEyes(1.0);
                        hook.setPosition(eyePos.x + look.x, eyePos.y + look.y, eyePos.z + look.z);
                        
                        let speed = 1.2;
                        hook.motionX = look.x * speed;
                        hook.motionY = look.y * speed + 0.3;
                        hook.motionZ = look.z * speed;
                        
                        this.world.addEntity(hook);
                        this.soundManager.playSound("random.bow", this.player.x, this.player.y, this.player.z, 0.5, 0.4);
                    }
                    return;
                }
            }

            // Check if holding a bucket to enable liquid raytracing
            
            // Hardcoded bucket IDs for reliability
            const BUCKET_EMPTY = 361;
            const BUCKET_WATER = 362;
            const BUCKET_LAVA = 368;
            const WATER_BLOCK_ID = 9;
            const LAVA_BLOCK_ID = 10;
            
            // Enable liquid raytracing for buckets, boats, and lily pads
            let isBucket = heldId === BUCKET_EMPTY || heldId === BUCKET_WATER || heldId === BUCKET_LAVA || heldId === 333 || heldId === 567;

            let hitResult = this.player.rayTrace(5, this.timer.partialTicks, isBucket);

            // Destroy block
            if (button === 0) {
                this.player.swingArm('main');

                // ENTITY HIT detection: try to hit a nearby entity the player is facing
                // Accurate ray-box intersection with 4.5 block reach (standard survival reach)
                const eye = this.player.getPositionEyes(this.timer.partialTicks);
                const look = this.player.getLook(this.timer.partialTicks);
                const reach = 4.5;
                const to = new Vector3(
                    eye.x + look.x * reach,
                    eye.y + look.y * reach,
                    eye.z + look.z * reach
                );

                let best = null;
                let bestDist = Infinity;
                for (let ent of this.world.entities) {
                    if (ent === this.player || ent.constructor.name === "RemotePlayerEntity") continue;
                    
                    // Expand hitbox slightly for hit detection to match vanilla behavior
                    const border = 0.1;
                    const bb = ent.boundingBox.grow(border, border, border);
                    const t = bb.calculateIntercept(eye, to);
                    
                    if (t !== null) {
                        const dist = reach * t;
                        if (dist < bestDist) {
                            bestDist = dist;
                            best = ent;
                        }
                    }
                }

                // Fallback: Check if we are inside any entity (Distance 0 hit)
                if (!best) {
                    for (let ent of this.world.entities) {
                        if (ent === this.player || ent.constructor.name === "RemotePlayerEntity") continue;
                        if (ent.boundingBox.containsPoint(eye.x, eye.y, eye.z)) {
                            best = ent;
                            bestDist = 0;
                            break;
                        }
                    }
                }

                if (best) {
                    // Calculate damage based on held item
                    let damage = 1; // Base damage
                    
                    // Sharpness Enchantment
                    if (heldStack.tag && heldStack.tag.enchantments) {
                        if (heldStack.tag.enchantments.sharpness) {
                            damage += 0.5 * heldStack.tag.enchantments.sharpness + 0.5;
                        }
                        if (heldStack.tag.enchantments.smite && best.isUndead()) {
                            damage += 2.5 * heldStack.tag.enchantments.smite;
                        }
                        if (heldStack.tag.enchantments.bane_of_arthropods && best.constructor.name === "EntitySpider") {
                            damage += 2.5 * heldStack.tag.enchantments.bane_of_arthropods;
                        }
                        if (heldStack.tag.enchantments.fire_aspect) {
                            best.remainingFireTicks = 80 * heldStack.tag.enchantments.fire_aspect;
                        }
                    }

                    if (this.player.activeEffects.has("strength")) {
                        damage += 3 * (this.player.activeEffects.get("strength").amplifier + 1);
                    }
                    if (this.player.activeEffects.has("weakness")) {
                        damage -= 4 * (this.player.activeEffects.get("weakness").amplifier + 1);
                    }
                    if (damage < 0.5) damage = 0.5;

                    // Item onHit Trigger
                    if (heldStack && heldStack.tag && heldStack.tag.onHit) {
                        this.commandHandler.handleMessage(heldStack.tag.onHit);
                    }

                    const damageTable = {
                        268: 4, // Wooden Sword
                        283: 4, // Golden Sword
                        272: 5, // Stone Sword
                        267: 6, // Iron Sword
                        276: 7, // Diamond Sword
                        271: 3, // Wooden Axe
                        275: 3, // Stone Axe
                        258: 5, // Iron Axe
                        286: 3, // Golden Axe
                        279: 6  // Diamond Axe
                    };
                    if (damageTable[heldId]) {
                        damage = damageTable[heldId];
                    }



                    // If entity supports takeHit, call it
                    try {
                        if (typeof best.takeHit === 'function') {
                            best.takeHit(this.player, damage);
                            
                            // Apply durability loss to weapon on hit
                            if (this.player.gameMode !== 1) {
                                let slotIndex = this.player.inventory.selectedSlotIndex;
                                let itemStack = this.player.inventory.items[slotIndex];
                                if (itemStack && itemStack.id !== 0) {
                                    let toolBlock = Block.getById(itemStack.id);
                                    if (toolBlock && toolBlock.maxDamage > 0) {
                                        itemStack.damage = (itemStack.damage || 0) + 1;
                                        if (itemStack.damage >= toolBlock.maxDamage) {
                                            this.player.inventory.setItemInSelectedSlot(0);
                                            this.soundManager.playSound("random.break", this.player.x, this.player.y, this.player.z, 1.0, 1.0);
                                        }
                                    }
                                }
                            }
                        } else if (typeof best.onAttacked === 'function') {
                            best.onAttacked(this.player, damage);
                        }
                        if (this.player.gameMode === 0) this.player.addExhaustion(0.1);
                    } catch (e) {
                        console.warn("Failed to apply hit to entity:", e);
                    }
                }
            }

            // Pick block (Middle Click)
            if (button === 1) {
                if (hitResult != null) {
                    let typeId = this.world.getBlockAt(hitResult.x, hitResult.y, hitResult.z);
                    if (typeId !== 0) {
                        this.player.inventory.setItemInSelectedSlot(typeId);
                    }
                }
            }

            // Place block / Interact (Right Click)
            if (button === 2) {
                // --- ENTITY INTERACTION ---
                // Check for entity interaction first (e.g. Villager trade)
                const eye = this.player.getPositionEyes(this.timer.partialTicks);
                const look = this.player.getLook(this.timer.partialTicks);
                const reach = 5.0; 
                const to = new Vector3(
                    eye.x + look.x * reach,
                    eye.y + look.y * reach,
                    eye.z + look.z * reach
                );

                let closestEntity = null;
                let closestDist = Infinity;
                
                for (let entity of this.world.entities) {
                    if (entity === this.player) continue;
                    
                    // Improved ray-box intersection for accurate entity targeting (fixes villager interaction)
                    const border = 0.1;
                    const bb = entity.boundingBox.grow(border, border, border);
                    const t = bb.calculateIntercept(eye, to);
                    
                    if (t !== null) {
                        const dist = reach * t;
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestEntity = entity;
                        }
                    }
                }
                
                if (closestEntity) {
                    // Name Tag Interaction
                    if (heldId === 414) {
                        // Check if nametag has been renamed
                        const stack = this.player.inventory.getStackInSlot(this.player.inventory.selectedSlotIndex);
                        
                        // Check if stack has a custom name
                        if (stack && stack.tag && stack.tag.name && stack.tag.name.length > 0) {
                            closestEntity.customName = stack.tag.name;
                            
                            // Apply changes
                            if (this.player.gameMode !== 1) {
                                // Decrease stack count manually to ensure consumption
                                stack.count--;
                                if (stack.count <= 0) {
                                    this.player.inventory.setItemInSelectedSlot(0);
                                }
                            }
                            
                            this.player.swingArm();
                            this.soundManager.playSound("random.pop", closestEntity.x, closestEntity.y, closestEntity.z, 1.0, 1.2);
                            
                            // Rebuild to show nametag immediately
                            if (closestEntity.renderer) {
                                if (closestEntity.renderer.group) delete closestEntity.renderer.group.buildMeta;
                                closestEntity.renderer.rebuild(closestEntity);
                                // Force direct call to renderNameTag to ensure it appears instantly
                                closestEntity.renderer.renderNameTag(closestEntity, closestEntity.customName);
                            }
                        } else {
                            this.addMessageToChat("§cName Tag must be renamed in an Anvil first.");
                        }
                        return; // Successfully interacted (or failed due to unnamed tag), prevent further actions
                    }

                    if (typeof closestEntity.interact === 'function') {
                        const isRanged = heldId === 261 || heldId === 499;
                        // Use robust name-based check to identify villager interactions
                        const isVillager = closestEntity.constructor.name === "EntityVillager";

                        // Only interact with entities if not holding a ranged weapon, 
                        // unless it's a villager (always interact)
                        if (!isRanged || isVillager) {
                            // Don't swing arm for ranged weapons on right-click to avoid animation glitch
                            if (!isRanged) this.player.swingArm();
                            
                            if (closestEntity.interact(this.player)) {
                                return; // Interaction handled
                            }
                        }
                    }
                }
                // ---------------------------

                // Check for Food Eating
                const foodIds = [260, 297, 320, 322, 349, 350, 354, 355, 363, 364, 365, 366, 367, 403, 404, 405, 406, 34, 35, 422, 423, 282];
                if (foodIds.includes(heldId)) {
                    // Mushrooms and Beetroots can be placed too. Prioritize placement if looking at a block.
                    const isPlaceableFood = [34, 35, 422].includes(heldId);
                    
                    // Allow right-click hold to start eating logic in onTick
                    // If it's a mushroom/beetroot and we hit a block, don't return early; let placement run.
                    if (!(isPlaceableFood && hitResult)) {
                        if (heldId === 322 || this.player.foodLevel < 20) {
                            return;
                        }
                    }
                }

                if (hitResult != null) {
                    let typeId = this.world.getBlockAt(hitResult.x, hitResult.y, hitResult.z);
                    
                    // Check block interaction first (Button, Crafting Table, Door, etc)
                    let block = Block.getById(typeId);
                    if (block && block.onBlockActivated(this.world, hitResult.x, hitResult.y, hitResult.z, this.player)) {
                        this.player.swingArm();
                        return;
                    }

                    // --- OFFHAND BLOCK PLACEMENT LOGIC ---
                    const mainHandStack = this.player.inventory.getStackInSlot(this.player.inventory.selectedSlotIndex);
                    const offHandStack = this.player.inventory.getStackInSlot(45);
                    const offHandBlock = Block.getById(offHandStack.id);
                    const mainHandBlock = Block.getById(mainHandStack.id);
                    
                    const isSword = [268, 272, 267, 283, 276].includes(mainHandStack.id);
                    const isTool = [270, 274, 257, 285, 278, 269, 273, 256, 284, 277, 271, 275, 258, 286, 279, 290, 291, 292, 293, 294, 261, 346, 359, 259].includes(mainHandStack.id);
                    
                    const foodIds = [260, 297, 319, 320, 322, 349, 350, 354, 355, 363, 364, 365, 366, 367, 403, 404, 405, 406];
                    const isMainHandFood = foodIds.includes(mainHandStack.id) || (mainHandBlock && mainHandBlock.isFood);
                    const isHungry = this.player.foodLevel < 20 || mainHandStack.id === 322;

                    // If main hand is empty, a weapon, a tool, or food when not hungry, try offhand block placement
                    let tryOffhand = (mainHandStack.id === 0 || isSword || isTool || (isMainHandFood && !isHungry));
                    
                    if (tryOffhand && offHandStack.id !== 0 && offHandBlock) {
                        let placeX = hitResult.x + hitResult.face.x;
                        let placeY = hitResult.y + hitResult.face.y;
                        let placeZ = hitResult.z + hitResult.face.z;
                        let targetId = this.world.getBlockAt(placeX, placeY, placeZ);
                        let targetBlock = Block.getById(targetId);

                        let isReplaceable = targetId === 0 || (targetBlock && (!targetBlock.isSolid() || targetBlock.isLiquid()) && targetId !== 77);

                        if (isReplaceable && offHandBlock.canPlaceBlockAt(this.world, placeX, placeY, placeZ)) {
                            // Check collision
                            let blockBox = new BoundingBox(placeX, placeY, placeZ, placeX + 1, placeY + 1, placeZ + 1);
                            let collided = this.player.boundingBox.intersects(blockBox);
                            for (let entity of this.world.entities) {
                                if (entity !== this.player && entity.canBeCollidedWith && entity.boundingBox.intersects(blockBox)) {
                                    collided = true;
                                    break;
                                }
                            }

                            if (!collided) {
                                // Place offhand block
                                this.world.setBlockAt(placeX, placeY, placeZ, offHandStack.id, 0);
                                offHandBlock.onBlockPlaced(this.world, placeX, placeY, placeZ, hitResult.face);
                                
                                let sound = offHandBlock.getSound();
                                if (sound) {
                                    this.soundManager.playSound(sound.getStepSound(), placeX + 0.5, placeY + 0.5, placeZ + 0.5, 0.5, sound.getPitch() * 0.8);
                                }
                                
                                this.player.swingArm('off');
                                if (this.player.gameMode !== 1) {
                                    offHandStack.count--;
                                    if (offHandStack.count <= 0) this.player.inventory.offhand = {id: 0, count: 0, damage: 0, tag: {}};
                                }
                                this.worldRenderer.flushRebuild = true;
                                return;
                            }
                        }
                    }

                    // --- START: Bucket special handling ---
                    if (heldId === BUCKET_WATER) {
                        // Water Bucket: Place water adjacent to the hit face
                        let x = hitResult.x + hitResult.face.x;
                        let y = hitResult.y + hitResult.face.y;
                        let z = hitResult.z + hitResult.face.z;

                        let prevType = this.world.getBlockAt(x, y, z);
                        let prevBlock = Block.getById(prevType);
                        // Allow placing in empty space or replacing non-solid, non-liquid blocks (like grass)
                        if (prevType === 0 || (prevBlock && !prevBlock.isSolid() && !prevBlock.isLiquid())) {
                            this.world.setBlockAt(x, y, z, WATER_BLOCK_ID);
                            this.player.swingArm();
                            this.soundManager.playSound("bucket.empty", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);

                            if (this.player.gameMode !== 1) {
                                // Replace bucket in hand with empty bucket
                                this.player.inventory.setStackInSlot(this.player.inventory.selectedSlotIndex, BUCKET_EMPTY, 1);
                            }
                            
                            this.worldRenderer.flushRebuild = true;
                            if (this.multiplayer && this.multiplayer.connected) {
                                this.multiplayer.onBlockChanged(x, y, z, WATER_BLOCK_ID);
                            }
                        }
                        return;
                    }

                    if (heldId === BUCKET_LAVA) {
                        // Lava Bucket: Place lava adjacent to the hit face
                        let x = hitResult.x + hitResult.face.x;
                        let y = hitResult.y + hitResult.face.y;
                        let z = hitResult.z + hitResult.face.z;

                        let prevType = this.world.getBlockAt(x, y, z);
                        let prevBlock = Block.getById(prevType);
                        // Allow placing in empty space or replacing non-solid, non-liquid blocks (like grass)
                        if (prevType === 0 || (prevBlock && !prevBlock.isSolid() && !prevBlock.isLiquid())) {
                            this.world.setBlockAt(x, y, z, LAVA_BLOCK_ID);
                            this.player.swingArm();
                            this.soundManager.playSound("bucket.empty", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);

                            if (this.player.gameMode !== 1) {
                                // Replace bucket in hand with empty bucket
                                this.player.inventory.setStackInSlot(this.player.inventory.selectedSlotIndex, BUCKET_EMPTY, 1);
                            }
                            
                            this.worldRenderer.flushRebuild = true;
                            if (this.multiplayer && this.multiplayer.connected) {
                                this.multiplayer.onBlockChanged(x, y, z, LAVA_BLOCK_ID);
                            }
                        }
                        return;
                    }

                    if (heldId === BUCKET_EMPTY) {
                        // Empty Bucket: Pick up water
                        // If we hit a water block directly (due to isBucket=true in rayTrace)
                        if (typeId === WATER_BLOCK_ID) {
                            this.world.setBlockAt(hitResult.x, hitResult.y, hitResult.z, 0);
                            this.player.swingArm();
                            this.soundManager.playSound("bucket.fill_water", hitResult.x + 0.5, hitResult.y + 0.5, hitResult.z + 0.5, 1.0, 1.0);

                            if (this.player.gameMode !== 1) {
                                // Replace bucket in hand with water bucket
                                this.player.inventory.setStackInSlot(this.player.inventory.selectedSlotIndex, BUCKET_WATER, 1);
                            }

                            this.worldRenderer.flushRebuild = true;
                            if (this.multiplayer && this.multiplayer.connected) {
                                this.multiplayer.onBlockChanged(hitResult.x, hitResult.y, hitResult.z, 0);
                            }
                            return;
                        }
                    }
                    // --- END: Bucket special handling ---

                    // --- START: Flint and Steel Fire placement ---
                    if (heldId === 259) { // Flint and Steel
                        let x = hitResult.x + hitResult.face.x;
                        let y = hitResult.y + hitResult.face.y;
                        let z = hitResult.z + hitResult.face.z;
                        
                        // Check for Portal Creation
                        if (this.world.tryToCreatePortal(x, y, z)) {
                            this.player.swingArm();
                            
                            // Consume durability on portal trigger
                            if (this.player.gameMode !== 1) {
                                let slotIndex = this.player.inventory.selectedSlotIndex;
                                let itemStack = this.player.inventory.items[slotIndex];
                                let toolBlock = Block.getById(heldId);
                                if (itemStack && toolBlock && toolBlock.maxDamage > 0) {
                                    itemStack.damage = (itemStack.damage || 0) + 1;
                                    if (itemStack.damage >= toolBlock.maxDamage) {
                                        this.player.inventory.setStackInSlot(slotIndex, 0, 0);
                                        this.soundManager.playSound("random.break", this.player.x, this.player.y, this.player.z, 1.0, 1.0);
                                    }
                                }
                            }
                            return;
                        }

                        let targetBlock = this.world.getBlockAt(x, y, z);
                        if (targetBlock === 0) {
                            this.world.setBlockAt(x, y, z, 51); // Fire ID
                            this.player.swingArm();
                            // TODO: Add ignite sound
                            this.soundManager.playSound("fire.ignite", x+0.5, y+0.5, z+0.5, 1.0, 1.0);
                            this.worldRenderer.flushRebuild = true;
                            
                            if (this.multiplayer && this.multiplayer.connected) {
                                this.multiplayer.onBlockChanged(x, y, z, 51);
                            }

                            // Consume durability
                            if (this.player.gameMode !== 1) {
                                let slotIndex = this.player.inventory.selectedSlotIndex;
                                let itemStack = this.player.inventory.items[slotIndex];
                                let toolBlock = Block.getById(heldId);
                                if (itemStack && toolBlock && toolBlock.maxDamage > 0) {
                                    itemStack.damage = (itemStack.damage || 0) + 1;
                                    if (itemStack.damage >= toolBlock.maxDamage) {
                                        this.player.inventory.setStackInSlot(slotIndex, 0, 0);
                                        this.soundManager.playSound("random.break", this.player.x, this.player.y, this.player.z, 1.0, 1.0);
                                    }
                                }
                            }
                            return;
                        }
                    }
                    // --- END: Flint and Steel ---
                
                    // --- START: Generic Block Placement/Item Use ---
                    if (heldId !== 0) {
                        let heldBlock = Block.getById(heldId);

                        // 1. Try generic item use (e.g. Hoe/Armor/Seeds/Map use on a block)
                        if (typeof heldBlock.onItemUse === 'function' &&
                            heldBlock.onItemUse(this.world, hitResult.x, hitResult.y, hitResult.z, hitResult.face, this.player)) {
                            return;
                        }

                        // Food handling
                        if (heldBlock.isFood) {
                             // eating logic handled in onTick
                             return;
                        }

                        // 2. Try placing the block itself
                        let placeX = hitResult.x + hitResult.face.x;
                        let placeY = hitResult.y + hitResult.face.y;
                        let placeZ = hitResult.z + hitResult.face.z;
                        let targetId = this.world.getBlockAt(placeX, placeY, placeZ);
                        let targetBlock = Block.getById(targetId);

                        // Check if block is air or replaceable (e.g. tall grass 31, fire 51, snow layers 78)
                        // For lily pads, we never want to replace the water block, only sit on top.
                        let isReplaceable = targetId === 0 ||
                                            (targetBlock && (!targetBlock.isSolid() || (targetBlock.isLiquid() && heldId !== 567)) && targetId !== 77); 
                        
                        let metadata = 0;

                        // --- Slab & Stairs Orientation Logic ---
                        if (heldBlock.getRenderType() === BlockRenderType.SLAB || heldBlock.getRenderType() === BlockRenderType.STAIRS) {
                            
                            // 1. Try to combine (for slabs only)
                            if (heldBlock.getRenderType() === BlockRenderType.SLAB) {
                                let hitBlock = Block.getById(typeId);
                                if (hitBlock.getRenderType() === BlockRenderType.SLAB && heldId === typeId) {
                                    if (typeof hitBlock.onBlockActivated === 'function') {
                                        if (hitBlock.onBlockActivated(this.world, hitResult.x, hitResult.y, hitResult.z, this.player)) {
                                            this.player.swingArm();
                                            return;
                                        }
                                    }
                                }
                            }
                            
                            // 2. Determine metadata for top half (Slab) or upside down (Stairs)
                            const relativeHitY = hitResult.vector.y - hitResult.y;

                            if (hitResult.face === EnumBlockFace.BOTTOM || 
                                (hitResult.face !== EnumBlockFace.TOP && relativeHitY > 0.5)) {
                                
                                metadata |= 8; // Top half / Upside down bit
                            }
                        }
                        
                        // 3. Place block if spot is replaceable
                        if (isReplaceable) {
                            // Check multiplayer build permissions
                            if (this.multiplayer.connected && !this.multiplayer.isHosting) {
                                if (this.multiplayer._localPermissions && !this.multiplayer._localPermissions.canBuild) {
                                    return;
                                }
                            }

                            if (heldBlock.canPlaceBlockAt(this.world, placeX, placeY, placeZ)) {
                                
                                // Prevent placing blocks inside the player (Collision Check)
                                const type = heldBlock.getRenderType();
                                // Check if block is solid or is a special type that has collision
                                const hasCollision = heldBlock.isSolid() || 
                                                    type === BlockRenderType.STAIRS || 
                                                    type === BlockRenderType.BED ||
                                                    type === BlockRenderType.SLAB ||
                                                    type === BlockRenderType.FENCE ||
                                                    type === BlockRenderType.FENCE_GATE ||
                                                    type === BlockRenderType.WALL ||
                                                    type === BlockRenderType.DOOR ||
                                                    type === BlockRenderType.PUMPKIN ||
                                                    type === BlockRenderType.CHEST ||
                                                    type === BlockRenderType.FURNACE ||
                                                    type === BlockRenderType.CRAFTING_TABLE;

                                if (hasCollision) {
                                    // Check against potential block bounding box
                                    let blockBox;
                                    
                                    if (heldBlock.getRenderType() === BlockRenderType.SLAB) {
                                        if (metadata === 8) { // Top slab
                                            blockBox = new BoundingBox(placeX, placeY + 0.5, placeZ, placeX + 1, placeY + 1, placeZ + 1);
                                        } else { // Bottom slab
                                            blockBox = new BoundingBox(placeX, placeY, placeZ, placeX + 1, placeY + 0.5, placeZ + 1);
                                        }
                                    } else {
                                        // Full block check
                                        blockBox = new BoundingBox(placeX, placeY, placeZ, placeX + 1, placeY + 1, placeZ + 1);
                                    }
                                    
                                    // Check intersection with player
                                    if (this.player.boundingBox.intersects(blockBox)) {
                                        return;
                                    }

                                    // Check intersection with other entities
                                    for (let entity of this.world.entities) {
                                         if (entity !== this.player && entity.canBeCollidedWith && entity.boundingBox.intersects(blockBox)) {
                                             return;
                                         }
                                    }
                                }

                                // Place block
                                this.world.setBlockAt(placeX, placeY, placeZ, heldId, metadata);

                                // Call onBlockPlaced for metadata (e.g., orientation, door top half)
                                // We pass the face used to find the placeX,Y,Z
                                heldBlock.onBlockPlaced(this.world, placeX, placeY, placeZ, hitResult.face);

                                // Play placing sound
                                let sound = heldBlock.getSound();
                                if (sound) {
                                    this.soundManager.playSound(sound.getStepSound(), placeX + 0.5, placeY + 0.5, placeZ + 0.5, 0.5, sound.getPitch() * 0.8);
                                }

                                this.player.swingArm('main');

                                // Consume item in survival
                                if (this.player.gameMode !== 1) {
                                    this.player.inventory.consumeItem(heldId);
                                }

                                this.worldRenderer.flushRebuild = true;
                                return;
                            }
                        }
                    }
                    // --- END: Generic Block Placement/Item Use ---
                }
            }

            this.worldRenderer.flushRebuild = true;
        }
    }

    onMouseReleased(button) {
        if (button === 2) { // Right click release
            // Fire arrow if holding bow
            let itemStackId = this.player.inventory.getItemInSelectedSlot();
            let heldStack = this.player.inventory.getStackInSlot(this.player.inventory.selectedSlotIndex);
            
            if (itemStackId === BlockRegistry.BOW.getId()) {
                if (this.bowPullDuration > 0) {
                    this.fireArrow(this.bowPullDuration);
                }
                this.bowPullDuration = 0;
            }

            // Fire Crossbow - logic moved to onMouseClicked for responsiveness
            if (itemStackId === 499) {
                this._crossbowJustLoaded = false;
                
                // Force an icon refresh if pull was reset
                const renderId = "hotbar" + this.player.inventory.selectedSlotIndex;
                if (this.itemRenderer && this.itemRenderer.items[renderId]) {
                    this.itemRenderer.items[renderId].dirty = true;
                }
            }
            
            // Throw snowball if holding snowball
            if (itemStackId === BlockRegistry.SNOWBALL.getId()) {
                if (this.snowballThrowTimer <= 0) {
                    this.fireSnowball();
                    this.snowballThrowTimer = 5; // 0.25 second cooldown
                }
            }

            // Throw ender pearl
            if (itemStackId === BlockRegistry.ENDER_PEARL.getId()) {
                if (this.enderPearlThrowTimer <= 0) {
                    this.fireEnderPearl();
                    this.enderPearlThrowTimer = 10;
                }
            }
        }
    }

    fireSnowball() {
        if (this.player.gameMode !== 1 && !this.player.inventory.consumeItem(BlockRegistry.SNOWBALL.getId())) {
             return;
        }

        this.player.swingArm();

        let snowball = new EntitySnowball(this, this.world);
        snowball.owner = this.player;

        let look = this.player.getLook(1.0);
        let eyePos = this.player.getPositionEyes(1.0);
        
        // Spawn slightly in front of eyes
        let spawnX = eyePos.x + look.x * 0.5;
        let spawnY = eyePos.y + look.y * 0.5;
        let spawnZ = eyePos.z + look.z * 0.5;
        
        snowball.setPosition(spawnX, spawnY, spawnZ);

        let speed = 1.2; 
        snowball.motionX = look.x * speed;
        snowball.motionY = look.y * speed + 0.1; // Add initial lift
        snowball.motionZ = look.z * speed;
        
        this.world.addEntity(snowball);
        this.soundManager.playSound("step.cloth", spawnX, spawnY, spawnZ, 0.6, 1.0);
    }

    fireEnderPearl() {
        if (this.player.gameMode !== 1 && !this.player.inventory.consumeItem(BlockRegistry.ENDER_PEARL.getId())) {
             return;
        }

        this.player.swingArm();

        let pearl = new EntityEnderPearl(this, this.world);
        pearl.owner = this.player;

        let look = this.player.getLook(1.0);
        let eyePos = this.player.getPositionEyes(1.0);
        
        let spawnX = eyePos.x + look.x * 0.5;
        let spawnY = eyePos.y + look.y * 0.5;
        let spawnZ = eyePos.z + look.z * 0.5;
        
        pearl.setPosition(spawnX, spawnY, spawnZ);

        let speed = 1.5; 
        pearl.motionX = look.x * speed;
        pearl.motionY = look.y * speed + 0.15; 
        pearl.motionZ = look.z * speed;
        
        this.world.addEntity(pearl);
        this.soundManager.playSound("random.bow", spawnX, spawnY, spawnZ, 0.5, 0.4);
    }

    fireCrossbow(heldStack) {
        // Fire arrow
        this.fireArrow(40, true); // Center arrow
        
        // Ol' Betsy achievement
        this.achievementManager.grant('olbetsy');
        
        // Multishot Enchantment
        if (heldStack.tag && heldStack.tag.enchantments && heldStack.tag.enchantments.multishot) {
            this.fireArrow(40, true, 15); // +15 degrees
            this.fireArrow(40, true, -15); // -15 degrees
        }
        
        // Uncharge
        heldStack.tag.charged = false;
        this.soundManager.playSound("crossbow.shoot", this.player.x, this.player.y, this.player.z, 1.0, 1.0);
        
        // Block reloading until release
        this._canReloadCrossbow = false;

        // Damage tool
        if (this.player.gameMode !== 1) {
            heldStack.damage = (heldStack.damage || 0) + 1;
            if (heldStack.damage >= 326) {
                this.player.inventory.setItemInSelectedSlot(0);
                this.soundManager.playSound("random.break", this.player.x, this.player.y, this.player.z, 1.0, 1.0);
            }
        }
    }

    fireArrow(chargeTicks, isCrossbow = false, yawOffset = 0) {
        let force = chargeTicks / 20.0;
        force = (force * force + force * 2.0) / 3.0;

        if (force < 0.1) return;
        
        // Take Aim achievement
        if (!isCrossbow) this.achievementManager.grant('takeaim');
        if (force > 1.0) force = 1.0;

        // Consume arrow in survival
        if (this.player.gameMode !== 1) {
            if (!this.player.inventory.consumeItem(BlockRegistry.ARROW.getId())) return;
            
            let itemStack = this.player.inventory.items[this.player.inventory.selectedSlotIndex];
            if (!isCrossbow && itemStack && itemStack.id === BlockRegistry.BOW.getId()) {
                itemStack.damage = (itemStack.damage || 0) + 1;
                if (itemStack.damage >= 384) {
                    this.player.inventory.setItemInSelectedSlot(0);
                    this.soundManager.playSound("random.break", this.player.x, this.player.y, this.player.z, 1.0, 1.0);
                }
            }
        }

        this.player.swingArm();

        let arrow = new EntityArrow(this, this.world);
        arrow.owner = this.player;

        // Bow Damage Tuning:
        // Full Charge (force=1.0): 9-10 damage (4.5-5 hearts).
        // Partial Charge: 0.5 to 5 damage (0.25 to 2.5 hearts).
        if (force >= 1.0) {
            // speed is 2.5, so 2.5 * 3.6-4.0 = 9-10 damage
            arrow.damage = 3.6 + Math.random() * 0.4;
        } else {
            // linear scaling for partial: force 0.1 -> speed 0.25 -> 0.5 damage (multiplier 2.0)
            // force 0.99 -> speed ~2.47 -> ~4.95 damage
            arrow.damage = 2.0; 
        }
        
        let look = this.player.getLook(1.0);

        // Apply yaw offset for Multishot
        if (yawOffset !== 0) {
            const rad = yawOffset * (Math.PI / 180);
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const oldX = look.x;
            const oldZ = look.z;
            look.x = oldX * cos - oldZ * sin;
            look.z = oldX * sin + oldZ * cos;
        }

        let eyePos = this.player.getPositionEyes(1.0);
        
        let spawnX = eyePos.x + look.x * 0.5;
        let spawnY = eyePos.y + look.y * 0.5;
        let spawnZ = eyePos.z + look.z * 0.5;
        
        arrow.setPosition(spawnX, spawnY, spawnZ);

        let speed = force * 2.5; 
        // 20% Boost for Crossbows
        if (isCrossbow) speed *= 1.2;

        // Power Enchantment
        const heldStack = this.player.inventory.getStackInSlot(this.player.inventory.selectedSlotIndex);
        if (heldStack.tag && heldStack.tag.enchantments && heldStack.tag.enchantments.power) {
            arrow.damage += 0.25 * (heldStack.tag.enchantments.power + 1);
        }
        // Flame Enchantment
        if (heldStack.tag && heldStack.tag.enchantments && heldStack.tag.enchantments.flame) {
            arrow.remainingFireTicks = 100;
        }

        arrow.motionX = look.x * speed;
        arrow.motionY = look.y * speed + 0.1; // Add initial lift
        arrow.motionZ = look.z * speed;
        
        this.world.addEntity(arrow);
        
        let pitchVal = 1.0 / (Math.random() * 0.4 + 1.2) + force * 0.5;
        // Use random.bow (bow.ogg) for normal bow shots, and crossbow.shoot for crossbows
        const soundKey = isCrossbow ? "crossbow.shoot" : "random.bow";
        this.soundManager.playSound(soundKey, spawnX, spawnY, spawnZ, 1.0, pitchVal);
    }

    onMouseScroll(delta) {
        if (this.currentScreen !== null) {
            this.currentScreen.handleMouseScroll(delta);
        } else if (this.isInGame()) {
            // Check for item scroll triggers (negative delta is scroll up)
            let heldStack = this.player.inventory.getStackInSlot(this.player.inventory.selectedSlotIndex);
            if (heldStack && heldStack.tag) {
                if (delta < 0 && heldStack.tag.onScrollUp) {
                    this.executeTaggedCommand(heldStack, heldStack.tag.onScrollUp);
                    return;
                }
                if (delta > 0 && heldStack.tag.onScrollDown) {
                    this.executeTaggedCommand(heldStack, heldStack.tag.onScrollDown);
                    return;
                }
            }
            this.player.inventory.shiftSelectedSlot(delta);
        }
    }

    executeTaggedCommand(stack, commandString) {
        // Check for UI tag first
        if (stack.tag && stack.tag.ui) {
            let layout = stack.tag.ui;
            if (typeof layout === 'string') {
                try { layout = JSON.parse(layout); } catch(e) {}
            }

            if (layout.persistent) {
                // Add to persistent HUD instead of opening screen
                this.hudElements.set(stack.tag.name || "item_hud", layout);
                this.addMessageToChat("§eHUD Overlay enabled.");
            } else {
                import("./gui/screens/GuiDynamic.js").then(module => {
                    this.displayScreen(new module.default(stack.tag.name || "Custom Item", layout));
                });
            }
            
            // If we only have a UI and no associated command string, exit here
            if (!commandString || !commandString.startsWith("/")) return;
        }

        if (!commandString) return;

        let finalCmd = commandString;

        // Add dynamic tags for what the player is looking at
        let hit = this.player.rayTrace(100, 1.0);
        let lx = 0, ly = 0, lz = 0;
        if (hit) {
            lx = Math.floor(hit.x);
            ly = Math.floor(hit.y);
            lz = Math.floor(hit.z);
        } else {
            // If nothing hit, use player coords or far away point?
            // Use current block look if possible
            lx = Math.floor(this.player.x);
            ly = Math.floor(this.player.y);
            lz = Math.floor(this.player.z);
        }

        const dynamicTags = {
            "look_x": lx,
            "look_y": ly,
            "look_z": lz
        };

        // Variable replacement from tags
        if (stack.tag) {
            for (let key in stack.tag) {
                let val = stack.tag[key];
                finalCmd = finalCmd.split(`{${key}}`).join(val);
            }
        }
        
        // Dynamic variable replacement
        for (let key in dynamicTags) {
            finalCmd = finalCmd.split(`{${key}}`).join(dynamicTags[key]);
        }

        // Storage variable resolution: {storage:path.to.key}
        if (finalCmd.includes("{storage:")) {
            const matches = finalCmd.match(/\{storage:([a-zA-Z0-9.]+)\}/g);
            if (matches) {
                for (let m of matches) {
                    const path = m.substring(9, m.length - 1);
                    const val = this.commandHandler.getStorageValue(path);
                    finalCmd = finalCmd.replace(m, val !== undefined ? JSON.stringify(val) : "undefined");
                }
            }
        }

        this.commandHandler.handleMessage(finalCmd, true); // Silent for tagged commands
    }

    addMessageToChat(message) {
        if (this.ingameOverlay && this.ingameOverlay.chatOverlay) {
            this.ingameOverlay.chatOverlay.addMessage(message);
        }
    }

    onContextLost(type) {
        console.warn(`Minecraft: WebGL Context Lost (${type})`);
        this.isContextLost = true;
        this.addMessageToChat("§cGraphics driver reset. Attempting to recover...");
    }

    async onContextRestored(type) {
        console.log(`Minecraft: WebGL Context Restored (${type})`);
        this.isContextLost = false;

        if (type === 'world') {
            // 1. Refresh all textures and re-bind them to tessellators
            await this.refreshTextures(false, true);

            // 2. Clear entity renderer caches to force mesh recreation
            if (this.world) {
                for (let entity of this.world.entities) {
                    if (entity.renderer) {
                        if (typeof entity.renderer.resetCache === 'function') {
                            entity.renderer.resetCache();
                        }
                        if (entity.renderer.group) {
                            delete entity.renderer.group.buildMeta;
                        }
                    }
                }
                
                // Clear spawner internal mobs
                if (this.worldRenderer) {
                    this.worldRenderer.spawnerMobEntities.clear();
                }
            }

            // 3. Rebuild all world chunks
            if (this.worldRenderer) {
                this.worldRenderer.rebuildAll();
                this.worldRenderer.flushRebuild = true;
            }

            this.addMessageToChat("§aGraphics recovered! Rebuilding world...");
        } else if (type === 'items') {
            if (this.itemRenderer) {
                this.itemRenderer.reset();
                this.itemRenderer.rebuildAllItems();
            }
        }
    }

    isPaused() {
        if (this.multiplayer && this.multiplayer.connected) return false;
        if (this.player2) {
            // Local splitscreen only pauses if the main ESC menu is open globally
            if (this.currentScreen && this.currentScreen.constructor.name === "GuiIngameMenu") return true;
            return false;
        }
        return this.currentScreen !== null && this.currentScreen.doesGuiPauseGame();
    }

    stop() {
        this.running = false;
        if (this.world && this.world.lightValidator) {
            clearInterval(this.world.lightValidator);
        }
        if (this.window) this.window.cleanup();
        this.worldRenderer.reset();
        this.screenRenderer.reset();
        for (const [, tex] of this._threeTextureCache) {
            tex.dispose();
        }
        this._threeTextureCache.clear();
    }

    swapHands() {
        if (!this.player) return;
        const inv = this.player.inventory;
        const mainIdx = inv.selectedSlotIndex;
        const main = inv.items[mainIdx];
        const off = inv.offhand;

        inv.items[mainIdx] = off;
        inv.offhand = main;

        this.soundManager.playSound("random.pop", this.player.x, this.player.y, this.player.z, 0.3, 1.2);
        if (this.itemRenderer) this.itemRenderer.reset();
    }

    getThreeTexture(id) {
        if (this._threeTextureCache.has(id)) {
            return this._threeTextureCache.get(id);
        }

        if (!(id in this.resources)) {
            console.error("Texture not found: " + id);
            return;
        }

        let image = this.resources[id];
        // Keep the decoded image as the Three.js source instead of copying it
        // into a second canvas bitmap. Large packs otherwise consume roughly
        // twice the texture memory before the GPU upload even begins.
        let tex = new THREE.Texture(image);
        tex.needsUpdate = true;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        
        // Apply global filtering setting
        const filter = this.getTextureFilter();
        tex.magFilter = filter;
        tex.minFilter = filter;

        this._threeTextureCache.set(id, tex);
        return tex;
    }

    async loadActiveMods() {
        try {
            const module = await import("./world/storage/WorldStorage.js");
            const WorldStorage = module.default;
            const modList = await WorldStorage.getModList();
            
            for (let modInfo of modList) {
                const blob = await WorldStorage.getMod(modInfo.name);
                if (blob) {
                    await this.applyModFromBlob(blob);
                }
            }
        } catch (e) {
            console.error("Failed to load mods:", e);
        }
    }

    async applyModFromBlob(blob) {
        const JSZip = (await import("jszip")).default;
        const EntityMod = (await import("./entity/EntityMod.js")).default;
        const arrayBuffer = await blob.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        const modJsonFile = zip.file("mod.json");
        if (!modJsonFile) return;

        let modData;
        try {
            modData = JSON.parse(await modJsonFile.async("string"));
        } catch (e) {
            console.error("Failed to parse mod.json:", e);
            return;
        }
        
        // 1. Process Blocks
        for (let blockData of (modData.blocks || [])) {
            const texFile = zip.file(blockData.texture);
            if (texFile) {
                const texBlob = await texFile.async("blob");
                const img = await this.window._loadImageFromBlob(texBlob);
                const texKey = `mod_${modData.id}_${blockData.texture}`;
                this.resources[texKey] = img;

                const modBlock = BlockRegistry.registerModBlock(
                    blockData.id, 
                    blockData.name, 
                    texKey, 
                    blockData.hardness || 1.0, 
                    blockData.sound || "stone",
                    {
                        gravity: !!blockData.gravity,
                        light: blockData.light || 0,
                        damage: blockData.damage || 0,
                        foliage: !!blockData.foliage,
                        climbable: !!blockData.climbable,
                        container: !!blockData.container,
                        containerName: blockData.containerName,
                        textures: blockData.textures
                    }
                );

                // Handle multi-texture loading for mod blocks
                if (blockData.textures) {
                    for (let faceKey of ['top', 'bottom', 'side']) {
                        const path = blockData.textures[faceKey];
                        if (path && zip.file(path)) {
                            const blob = await zip.file(path).async("blob");
                            const img = await this.window._loadImageFromBlob(blob);
                            const tKey = `mod_${modData.id}_${path}`;
                            this.resources[tKey] = img;
                            modBlock.customTextures[faceKey] = tKey;
                        }
                    }
                }
                modBlock.hardness = blockData.hardness || 1.0;
                this.commandHandler.itemMap[blockData.name.toLowerCase().replace(/\s+/g, '_')] = blockData.id;
            }
        }

        // 2. Process Items
        for (let itemData of (modData.items || [])) {
            const texFile = zip.file(itemData.texture);
            if (texFile) {
                const texBlob = await texFile.async("blob");
                const img = await this.window._loadImageFromBlob(texBlob);
                const texKey = `mod_${modData.id}_item_${itemData.texture}`;
                this.resources[texKey] = img;

                BlockRegistry.registerModItem(
                    itemData.id,
                    itemData.name,
                    texKey,
                    {
                        damage: itemData.damage || 0,
                        durability: itemData.durability || 0,
                        throwable: !!itemData.throwable,
                        onThrow: itemData.onThrow || null,
                        stackSize: itemData.stackSize || 64
                    }
                );
                this.commandHandler.itemMap[itemData.name.toLowerCase().replace(/\s+/g, '_')] = itemData.id;
            }
        }

        // 3. Process Entities
        for (let entData of (modData.entities || [])) {
            const modelFile = zip.file(entData.model);
            if (modelFile) {
                const modelBlob = await modelFile.async("blob");
                // Create a temporary URL for the model
                const modelUrl = URL.createObjectURL(modelBlob);
                const modelKey = `mod_entity_${modData.id}_${entData.id}`;
                
                // Store the mod config in the class map so Summon command can find it
                if (!this.commandHandler.mobMap) this.commandHandler.mobMap = {};
                
                // We wrap the EntityMod with the specific data
                const CustomEntityClass = class extends EntityMod {
                    constructor(mc, world) {
                        super(mc, world, { ...entData, model: modelUrl });
                    }
                };
                Object.defineProperty(CustomEntityClass, "name", { value: "EntityMod_" + entData.id });
                
                this.commandHandler.mobMap[entData.id.toLowerCase()] = CustomEntityClass;
                this.worldRenderer.entityRenderManager.push(CustomEntityClass, (await import("./render/entity/GltfEntityRenderer.js")).default);
            }
        }

        // 4. Process Structures
        for (let structData of (modData.structures || [])) {
            // Validate structure data
            if (structData.name && structData.data && structData.data.blocks) {
                this.moddedStructures.push({
                    name: structData.name,
                    spawnChance: structData.spawnChance || 5,
                    biomes: structData.biomes || ["plains"],
                    data: structData.data
                });
            }
        }

        console.log(`Mod '${modData.name}' loaded.`);
    }

    getTextureFilter() {
        return this.settings.bilinearFiltering ? THREE.LinearFilter : THREE.NearestFilter;
    }

    /**
     * Recreate and rebind Three textures from the raw image resources so changes take effect immediately.
     * This updates common textures used across renderers and forces materials to use the new textures.
     */
    async refreshTextures(reloadFromDisk = false, applyPack = true) {
        try {
            // Dispose of old textures to free GPU memory
            for (let texture of this._threeTextureCache.values()) {
                texture.dispose();
            }
            this._threeTextureCache.clear();

            // Handle Default Pack restoration explicitly
            if (!this.settings.activeResourcePack) {
                for (const k in this.originalResources) {
                    this.resources[k] = this.originalResources[k];
                }
            }

            // Check for custom resource pack
            if (this.settings.activeResourcePack && applyPack) {
                const module = await import("./world/storage/WorldStorage.js");
                const blob = await module.default.getResourcePack(this.settings.activeResourcePack);
                if (blob) {
                    // Only show loading screen if we are actually in a menu or the world isn't ready
                    // to prevent flashing during gameplay if a pack reloads
                    const showLoading = !this.isInGame() || this.currentScreen !== null;
                    
                    if (showLoading) {
                        import("./gui/screens/GuiResourcePackLoading.js").then(async mod => {
                            const loadingScreen = new mod.default(this.currentScreen, this.settings.activeResourcePack);
                            this.displayScreen(loadingScreen);
                            
                            try {
                                await this.window._applyPackFromBlob(blob, (progress, message) => {
                                    loadingScreen.updateProgress(progress, message);
                                });
                                loadingScreen.setFinished();
                            } catch (err) {
                                loadingScreen.setError(err.message);
                            }
                        });
                    } else {
                        await this.window._applyPackFromBlob(blob);
                    }
                    return; 
                }
            }

            // Restore original images immediately if we saved them at startup; otherwise reload from disk asynchronously
            if (reloadFromDisk) {
                const reloadList = [
                    'misc/grasscolor.png',
                    'gui/font.png',
                    'gui/gui.png',
                    'gui/background.png',
                    'gui/icons.png',
                    'terrain/sun.png',
                    'terrain/moon.png',
                    // 'char.png', // Removed to prevent resetting selected skin
                    'gui/title/minecraft.png',
                    'gui/title/background/panorama_0.png',
                    'gui/title/background/panorama_1.png',
                    'gui/title/background/panorama_2.png',
                    'gui/title/background/panorama_3.png',
                    'gui/title/background/panorama_4.png',
                    'gui/title/background/panorama_5.png',
                    '../../foliage.png',
                    '../../grasslandfoliage.png'
                ];
                for (const rel of reloadList) {
                    // If we have an original saved image for this resource use it immediately
                    if (this.originalResources && this.originalResources[rel]) {
                        this.resources[rel] = this.originalResources[rel];
                        continue;
                    }
                    try {
                        const img = new Image();
                        img.src = "src/resources/" + rel;
                        img.onload = (() => { this.resources[rel] = img; }).bind(this);
                        // keep existing resource immediately if load is slow; onload will replace when ready
                    } catch (e) {
                        // ignore errors and keep current resource
                    }
                }
            }
            
            // Recreate and rebind Three textures from the raw image resources so changes take effect immediately.
            if (this.worldRenderer) {
                // If the project includes blocks.png use it (it is a 14-sprite sheet as requested),
                // otherwise fall back to the original terrain/terrain.png file.
                const filter = this.getTextureFilter();

                if (this.resources['../../blocks.png']) {
                    this.worldRenderer.textureTerrain = this.getThreeTexture('../../blocks.png');
                } else if (this.resources['terrain/terrain.png']) {
                    this.worldRenderer.textureTerrain = this.getThreeTexture('terrain/terrain.png');
                }
                if (this.worldRenderer.textureTerrain) {
                    // Ensure sprite sheet vertical orientation is corrected (blocks.png is upside-down)
                    this.worldRenderer.textureTerrain.flipY = false;
                    this.worldRenderer.textureTerrain.magFilter = filter;
                    this.worldRenderer.textureTerrain.minFilter = filter;
                }
                if (this.resources['terrain/sun.png']) {
                    this.worldRenderer.textureSun = this.getThreeTexture('terrain/sun.png');
                    this.worldRenderer.textureSun.magFilter = filter;
                    this.worldRenderer.textureSun.minFilter = filter;
                }
                if (this.resources['terrain/moon.png']) {
                    this.worldRenderer.textureMoon = this.getThreeTexture('terrain/moon.png');
                    this.worldRenderer.textureMoon.magFilter = filter;
                    this.worldRenderer.textureMoon.minFilter = filter;
                }
                // Rebind block renderer tessellator texture
                if (this.worldRenderer.blockRenderer && this.worldRenderer.blockRenderer.tessellator) {
                    this.worldRenderer.blockRenderer.tessellator.bindTexture(this.worldRenderer.textureTerrain);
                }
                if (this.worldRenderer.sun && this.worldRenderer.sun.material) {
                    this.worldRenderer.sun.material.map = this.worldRenderer.textureSun;
                    this.worldRenderer.sun.material.alphaMap = this.worldRenderer.textureSun;
                    this.worldRenderer.sun.material.needsUpdate = true;
                }
                if (this.worldRenderer.moon && this.worldRenderer.moon.material) {
                    this.worldRenderer.moon.material.map = this.worldRenderer.textureMoon;
                    this.worldRenderer.moon.material.alphaMap = this.worldRenderer.textureMoon;
                    this.worldRenderer.moon.material.needsUpdate = true;
                }
                if (this.worldRenderer.realisticMoon && this.worldRenderer.realisticMoon.material) {
                    this.worldRenderer.realisticMoon.material.map = this.worldRenderer.textureMoon;
                    this.worldRenderer.realisticMoon.material.needsUpdate = true;
                }

                // Refresh all custom block tessellators
                if (this.worldRenderer.blockRenderer && this.worldRenderer.blockRenderer.textureTessellators) {
                    for (let [name, tess] of this.worldRenderer.blockRenderer.textureTessellators) {
                        let tex = this.getThreeTexture(name);
                        if (tex) {
                            tex.magFilter = filter;
                            tex.minFilter = filter;
                            tex.flipY = false;
                            tess.bindTexture(tex);
                        }
                    }
                }

                // Refresh portal texture
                if (this.resources['../../nether_portal.png']) {
                    this.worldRenderer.texturePortal = this.getThreeTexture('../../nether_portal.png');
                    if (this.worldRenderer.texturePortal) {
                        this.worldRenderer.texturePortal.magFilter = filter;
                        this.worldRenderer.texturePortal.minFilter = filter;
                        this.worldRenderer.texturePortal.wrapS = THREE.RepeatWrapping;
                        this.worldRenderer.texturePortal.wrapT = THREE.RepeatWrapping;
                        this.worldRenderer.texturePortal.repeat.set(1, 1/32);
                        
                        // Rebind to tessellator
                        if (this.worldRenderer.blockRenderer && this.worldRenderer.blockRenderer.portalTessellator) {
                            this.worldRenderer.blockRenderer.portalTessellator.bindTexture(this.worldRenderer.texturePortal);
                        }
                    }
                }

                // Refresh water texture
                if (this.resources['../../water_flow (4).png']) {
                    let waterTex = this.getThreeTexture('../../water_flow (4).png');
                    if (waterTex) {
                        waterTex.magFilter = filter;
                        waterTex.minFilter = filter;
                        waterTex.wrapS = THREE.RepeatWrapping;
                        waterTex.wrapT = THREE.RepeatWrapping;
                        waterTex.flipY = false;
                        waterTex.repeat.set(1, 1/32);
                    }
                }

                // Refresh clouds
                if (this.resources['../../clouds.png']) {
                    this.worldRenderer.textureClouds = this.getThreeTexture('../../clouds.png');
                    if (this.worldRenderer.textureClouds) {
                        this.worldRenderer.textureClouds.magFilter = filter;
                        this.worldRenderer.textureClouds.minFilter = filter;
                        this.worldRenderer.textureClouds.wrapS = THREE.RepeatWrapping;
                        this.worldRenderer.textureClouds.wrapT = THREE.RepeatWrapping;
                        this.worldRenderer.rebuildClouds();
                    }
                }

                // Refresh break animation texture
                if (this.resources['../../breakanimation.png']) {
                    this.worldRenderer.textureBreakAnimation = this.getThreeTexture('../../breakanimation.png');
                    if (this.worldRenderer.textureBreakAnimation) {
                        this.worldRenderer.textureBreakAnimation.magFilter = filter;
                        this.worldRenderer.textureBreakAnimation.minFilter = filter;
                        this.worldRenderer.textureBreakAnimation.wrapS = THREE.RepeatWrapping;
                        
                        // Re-apply repeat settings based on frame count
                        const frameCount = this.worldRenderer._breakAnimationFrameCount || 6;
                        this.worldRenderer.textureBreakAnimation.repeat.set(1 / frameCount, 1);
                        
                        // Update material
                        if (this.worldRenderer.breakAnimationMaterial) {
                            this.worldRenderer.breakAnimationMaterial.map = this.worldRenderer.textureBreakAnimation;
                            this.worldRenderer.breakAnimationMaterial.needsUpdate = true;
                        }
                    }
                }
            }
            // Update all entities and their renderer caches
            if (this.world && this.world.entities) {
                for (let entity of this.world.entities) {
                    if (entity && entity.renderer) {
                        // Reset specialized entity renderer caches (Boats, etc)
                        if (typeof entity.renderer.resetCache === 'function') {
                            entity.renderer.resetCache();
                        }

                        // Update character texture used by player/remote player renderers
                        if (this.resources['../../steve (1).png'] && entity.renderer.textureCharacter !== undefined) {
                            entity.renderer.textureCharacter = this.getThreeTexture('../../steve (1).png');
                            entity.renderer.textureCharacter.magFilter = filter;
                            entity.renderer.textureCharacter.minFilter = filter;
                        }

                        // Force full rebuild on next render frame
                        if (entity.renderer.group) {
                            delete entity.renderer.group.buildMeta;
                        }
                    }
                }
            }
            // Recreate GUI textures used by canvas2d rendering are read directly from this.resources (images),
            // so no extra step is required for 2D canvas; mark GUI renderer to reinitialize resolution to redraw
            if (this.window && this.screenRenderer) {
                this.screenRenderer.initialize();
                this.fontRenderer = new FontRenderer(this);
                this.grassColorizer = new GrassColorizer(this);

                // GUI screens cache their images during setup(). Resource
                // packs replace those entries with ImageBitmaps, so refresh
                // the cached references in any open or parent screen as well.
                const refreshScreen = (screen, seen = new Set()) => {
                    if (!screen || seen.has(screen)) return;
                    seen.add(screen);
                    if (typeof screen.refreshTextureReferences === "function") {
                        screen.refreshTextureReferences();
                    }
                    refreshScreen(screen.previousScreen, seen);
                    refreshScreen(screen.nextScreen, seen);
                };
                refreshScreen(this.currentScreen);
                refreshScreen(this.currentScreen2);
                if (this.ingameOverlay && typeof this.ingameOverlay.refreshTextureReferences === "function") {
                    this.ingameOverlay.refreshTextureReferences();
                }
            }

            if (this.worldRenderer) {
                // Clear Gui tinted icon cache to pick up new textures
                if (this.ingameOverlay) {
                    this.ingameOverlay._tintedIconCache = {};
                }
                if (this.currentScreen) {
                    this.currentScreen._tintedIconCache = {};
                }

                // Force specialized tessellators to re-bind on next use
                if (this.worldRenderer.blockRenderer) {
                    const br = this.worldRenderer.blockRenderer;
                    [
                        br.foliageTessellator, br.oreTessellator, br.craftingTableTessellator,
                        br.doorTessellator, br.chestTessellator, br.furnaceTessellator,
                        br.fireTessellator, br.portalTessellator
                    ].forEach(t => {
                        if (t && t.material) {
                            t.material.map = null;
                            t.material.needsUpdate = true;
                        }
                    });
                    
                    // Rebind specific tessellators if their textures are available
                    if (this.resources['../../chest.png.png'] && br.chestTessellator) {
                        const tex = this.getThreeTexture('../../chest.png.png');
                        tex.magFilter = filter;
                        tex.minFilter = filter;
                        tex.flipY = false;
                        br.chestTessellator.bindTexture(tex);
                    }
                    if (this.resources['../../furnace.png.png'] && br.furnaceTessellator) {
                        const tex = this.getThreeTexture('../../furnace.png.png');
                        tex.magFilter = filter;
                        tex.minFilter = filter;
                        tex.flipY = false;
                        br.furnaceTessellator.bindTexture(tex);
                    }
                    if (this.resources['../../All doors.png'] && br.doorTessellator) {
                        const tex = this.getThreeTexture('../../All doors.png');
                        tex.magFilter = filter;
                        tex.minFilter = filter;
                        tex.flipY = false;
                        br.doorTessellator.bindTexture(tex);
                    }
                    if (this.resources['../../nether_portal.png'] && br.portalTessellator) {
                        const tex = this.getThreeTexture('../../nether_portal.png');
                        tex.magFilter = filter;
                        tex.minFilter = filter;
                        tex.wrapS = THREE.RepeatWrapping;
                        tex.wrapT = THREE.RepeatWrapping;
                        tex.flipY = false;
                        tex.repeat.set(1, 1/32);
                        br.portalTessellator.bindTexture(tex);
                        this.worldRenderer.texturePortal = tex;
                    }
                }

                this.worldRenderer.rebuildAll();
                this.worldRenderer.flushRebuild = true;
            }

            // Re-initialize current screen to pick up new textures
            if (this.currentScreen) {
                this.currentScreen.init();
                // Special handling for panorama update in MainMenu
                if (this.currentScreen.initPanoramaRenderer) {
                    this.currentScreen.initPanoramaRenderer();
                }
            }
        } catch (e) {
            console.warn("refreshTextures failed:", e);
        }
    }
}  
