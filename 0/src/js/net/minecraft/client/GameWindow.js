import GuiIngameMenu from "./gui/screens/GuiIngameMenu.js";
import GuiMainMenu from "./gui/screens/GuiMainMenu.js";
import Keyboard from "../util/Keyboard.js";
import Minecraft from "./Minecraft.js";
// JSZip from esm.sh for ZIP reading
// add GuiChat import for mobile chat button
import GuiChat from "./gui/screens/GuiChat.js";
import GuiOptions from "./gui/screens/GuiOptions.js";
import MathHelper from "../util/MathHelper.js";
import JSZip from "jszip";

// ADD IMPORT: GLTFLoader for GLB loading
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
// ADD: import Three.js namespace so THREE is available in this module
import * as THREE from "three";

export default class GameWindow {

    constructor(minecraft, canvasWrapperId) {
        this.minecraft = minecraft;
        this.canvasWrapperId = canvasWrapperId;

        // sequence detection for texture import (press 'S' then 'C')
        this.mouseMotionX = 0;
        this.mouseMotionY = 0;
        this.mouseX = window.innerWidth / 4; // Initial position for controller cursor
        this.mouseY = window.innerHeight / 4;
        this.mouseLocked = false;
        this.actualMouseLocked = false;

        this.isMobile = this.detectTouchDevice();

        // Get canvas wrapper
        this.wrapper = document.getElementById(this.canvasWrapperId);

        // Create world renderer
        this.canvas = document.createElement('canvas');
        this.wrapper.appendChild(this.canvas);

        // Create screen renderer
        this.canvas2d = document.createElement('canvas');

        // Create canvas for item counts
        this.canvasCounts = document.createElement('canvas');

        // Create canvas for 3D items in GUI
        this.canvasItems = document.createElement('canvas');

        // Append canvases and set z-index for layering
        this.canvas2d.style.position = 'absolute';
        this.canvas2d.style.left = '0';
        this.canvas2d.style.top = '0';
        this.canvas2d.style.zIndex = '10'; // GUI layer (BG, Bars, Crosshair)
        this.wrapper.appendChild(this.canvas2d);

        this.canvasCounts.style.position = 'absolute';
        this.canvasCounts.style.left = '0';
        this.canvasCounts.style.top = '0';
        this.canvasCounts.style.zIndex = '12'; // Item counts layer (Text)
        this.wrapper.appendChild(this.canvasCounts);

        this.canvasItems.style.position = 'absolute';
        this.canvasItems.style.left = '0';
        this.canvasItems.style.top = '0';
        this.canvasItems.style.zIndex = '11'; // 3D GUI items layer (Blocks)
        this.wrapper.appendChild(this.canvasItems);

        let mouseDownInterval = null;

        // Request focus
        document.onclick = () => {
            if (this.minecraft.currentScreen === null) {
                this.requestFocus();
            }
        }

        window.addEventListener('resize', _ => this.updateWindowSize(), false);

        // Handle WebGL Context Loss/Restoration
        this.canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            this.minecraft.onContextLost('world');
        }, false);

        this.canvas.addEventListener('webglcontextrestored', () => {
            this.minecraft.onContextRestored('world');
        }, false);

        this.canvasItems.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            this.minecraft.onContextLost('items');
        }, false);

        this.canvasItems.addEventListener('webglcontextrestored', () => {
            this.minecraft.onContextRestored('items');
        }, false);

        // Focus listener
        document.addEventListener('pointerlockchange', _ => this.onFocusChanged(), false);

        // Mouse motion
        document.addEventListener('mousemove', event => {
            this.onMouseMove(event);
            
            // Hide controller cursor if mouse moves
            if (this.minecraft) this.minecraft.usingControllerCursor = false;

            // Handle mouse move on screen
            if (!(minecraft.currentScreen === null)) {
                minecraft.currentScreen.mouseDragged(event.clientX / this.scaleFactor, event.clientY / this.scaleFactor, event.button);
            }
        }, false);

        // Mouse release
        document.addEventListener('mouseup', event => {
            // Handle mouse release on screen
            if (!(minecraft.currentScreen === null)) {
                minecraft.currentScreen.mouseReleased(event.clientX / this.scaleFactor, event.clientY / this.scaleFactor, event.button);
            } else if (this.minecraft.isInGame() && this.minecraft.hasInGameFocus()) {
                // Handle in-game release
                this.minecraft.onMouseReleased(event.button);
            }

            if (event.button === 0) {
                minecraft.isLeftMouseDown = false;
            }
            if (event.button === 2) {
                minecraft.isRightMouseDown = false;
            }

            if (mouseDownInterval) {
                clearInterval(mouseDownInterval);
                mouseDownInterval = null;
            }
        }, false);

        // Losing focus event
        this.canvas.addEventListener("mouseout", () => {
            if (minecraft.currentScreen === null) {
                minecraft.displayScreen(new GuiIngameMenu());
            }

            if (mouseDownInterval) {
                clearInterval(mouseDownInterval);
                mouseDownInterval = null;
            }
        });

        // Mouse buttons
        document.addEventListener('mousedown', event => {
            // Create sound engine (It has to be created after user interaction)
            if (!minecraft.soundManager.isCreated()) {
                minecraft.soundManager.create(minecraft.worldRenderer);
            }

            if (event.button === 0) {
                minecraft.isLeftMouseDown = true;
            }
            if (event.button === 2) {
                minecraft.isRightMouseDown = true;
            }

            // Handle in-game mouse click
            if (!this.isMobile && minecraft.hasInGameFocus()) {
                minecraft.onMouseClicked(event.button);

                // Start interval to repeat the mouse event for non-left-clicks
                if (event.button !== 0) {
                    if (mouseDownInterval) clearInterval(mouseDownInterval);
                    mouseDownInterval = setInterval(() => minecraft.onMouseClicked(event.button), 250);
                }
            }

            // Handle mouse click on screen
            if (!(minecraft.currentScreen === null)) {
                minecraft.currentScreen.mouseClicked(event.clientX / this.scaleFactor, event.clientY / this.scaleFactor, event.button);
            }
        }, false);

        // Mouse scroll
        document.addEventListener('wheel', (event) => {
            let delta = Math.sign(event.deltaY);
            minecraft.onMouseScroll(delta);
        }, false);

        // Prevent default context menu (right-click menu)
        document.addEventListener('contextmenu', event => event.preventDefault());

        // Keyboard interaction with screen
        window.addEventListener('keydown', (event) => {
            // Keyboard input is also a valid user gesture for unlocking the
            // Web Audio context. Do this before routing the key to the game
            // so the first keyboard-triggered sound is not lost.
            if (!minecraft.soundManager.isCreated()) {
                minecraft.soundManager.create(minecraft.worldRenderer);
            }

            if (event.code === "F2") {
                this.minecraft.takeScreenshot();
                return;
            }
            if (event.code === "F11") {
                return;
            }

            // Prevent key
            event.preventDefault();

            // If Escape suppression is active (e.g. right after texture import), ignore Escape
            if (event.code === 'Escape' && this.minecraft && this.minecraft._suppressEscUntil && Date.now() < this.minecraft._suppressEscUntil) {
                return;
            }

            // Detect sequence S -> C while in-game AND not in a menu (prevents opening file picker while typing in chat)
            if (this.minecraft && this.minecraft.isInGame() && this.minecraft.currentScreen === null) {
                if (event.code === "KeyS") {
                    // start sequence
                    this._textureSeq = ['KeyS'];
                    clearTimeout(this._textureSeqTimeout);
                    this._textureSeqTimeout = setTimeout(() => { this._textureSeq = []; }, 2000);
                } else if (event.code === "KeyC" && this._textureSeq.length === 1 && this._textureSeq[0] === 'KeyS') {
                    // sequence matched: open ZIP picker
                    this._textureSeq = [];
                    clearTimeout(this._textureSeqTimeout);
                    this._openTextureZipPicker();
                }
            }

            if (!(minecraft.currentScreen === null)) {
                // Handle key type on screen
                minecraft.currentScreen.keyTyped(event.code, event.key);
            } else if (event.code === 'Escape') {
                minecraft.displayScreen(new GuiIngameMenu());
            } else {
                minecraft.onKeyPressed(event.code);
            }
        });

        // Keyboard interaction with screen
        window.addEventListener('keyup', (event) => {
            // Prevent key
            event.preventDefault();

            if (!(minecraft.currentScreen === null)) {
                // Handle key release on screen
                minecraft.currentScreen.keyReleased(event.code);
            }
        });

        // Touch interaction
        this.touchMoveIdentifier = null;
        this.touchStartTime = 0;
        this.isWorldTouch = false;

        window.addEventListener('touchstart', (event) => {
            // Create sound engine
            if (!minecraft.soundManager.isCreated()) {
                minecraft.soundManager.create(minecraft.worldRenderer);
            }

            for (let i = 0; i < event.changedTouches.length; i++) {
                let touch = event.changedTouches[i];
                let x = touch.clientX;
                let y = touch.clientY;
                
                // 1. UI Check: If touching a button, skip world interaction
                const btn = touch.target.closest('.mc-mobile-btn');
                if (btn) continue;

                // 2. Hotbar Check
                const tx = x / this.scaleFactor;
                const ty = y / this.scaleFactor;
                const hX = this.width / 2 - 91;
                const hY = this.height - 22;
                if (tx >= hX && tx <= hX + 182 && ty >= hY && ty <= this.height) {
                    let slot = Math.floor((tx - hX) / 20);
                    minecraft.player.inventory.selectedSlotIndex = MathHelper.clamp(slot, 0, 8);
                    minecraft.soundManager.playSound("random.click", 0, 0, 0, 0.4, 1.2);
                    continue;
                }

                // 3. Right side world touch for rotation + interaction
                if (this.touchMoveIdentifier === null) {
                    this.touchMoveIdentifier = touch.identifier;
                    this.prevTouchX = x;
                    this.prevTouchY = y;
                    this.touchStartTime = Date.now();
                    this.isWorldTouch = true;
                }
            }
        }, {passive: false});

        window.addEventListener('touchmove', (event) => {
            for (let i = 0; i < event.changedTouches.length; i++) {
                let touch = event.changedTouches[i];
                if (touch.identifier === this.touchMoveIdentifier) {
                    let x = touch.clientX;
                    let y = touch.clientY;

                    this.mouseMotionX += (x - this.prevTouchX) * 2;
                    this.mouseMotionY -= (y - this.prevTouchY) * 2;

                    this.prevTouchX = x;
                    this.prevTouchY = y;

                    // If they moved significantly, it's not a tap
                    const dx = Math.abs(x - this.prevTouchX);
                    const dy = Math.abs(y - this.prevTouchY);
                    if (dx > 10 || dy > 10) {
                        // Keep world touch active for rotation, but tap detection should be wary
                    }
                }
            }
        }, {passive: false});

        window.addEventListener('touchend', (event) => {
            for (let i = 0; i < event.changedTouches.length; i++) {
                let touch = event.changedTouches[i];
                if (touch.identifier === this.touchMoveIdentifier) {
                    const duration = Date.now() - this.touchStartTime;
                    
                    // Tap -> Place
                    if (duration < 350 && this.isWorldTouch && minecraft.currentScreen === null) {
                        minecraft.onMouseClicked(2);
                    }
                    
                    this.touchMoveIdentifier = null;
                    this.touchStartTime = 0;
                    this.isWorldTouch = false;
                    minecraft.isLeftMouseDown = false;
                }
            }
        });

        // Mining interval for hold detection
        this._mobileMiningInterval = null;
        if (this.isMobile) {
            this._mobileMiningInterval = setInterval(() => {
                if (this.isWorldTouch && this.touchStartTime > 0 && (Date.now() - this.touchStartTime) > 350) {
                    if (minecraft.currentScreen === null) {
                        minecraft.isLeftMouseDown = true;
                    }
                }
            }, 50);
        }

        // Create keyboard
        Keyboard.create();

        // Create mobile controls UI and map to inputs
        this.mobileOverlay = document.getElementById('mobile-overlay');

        if (this.isMobile) {
            this.mobileOverlay.classList.add('visible');

            const s = this.minecraft.settings;
            const pressKey = (key) => Keyboard.setState(key, true);
            const releaseKey = (key) => Keyboard.setState(key, false);

            // Bind D-pad
            ['up', 'down', 'left', 'right', 'sneak'].forEach(id => {
                const el = document.getElementById('btn-' + id);
                if (!el) return;
                let key = el.dataset.key;
                if (key === "KeyW") key = s.forward;
                if (key === "KeyS") key = s.back;
                if (key === "KeyA") key = s.left;
                if (key === "KeyD") key = s.right;
                if (key === "ShiftLeft") key = s.crouching;

                el.addEventListener('touchstart', (e) => { pressKey(key); e.preventDefault(); }, {passive:false});
                el.addEventListener('touchend', (e) => { releaseKey(key); e.preventDefault(); }, {passive:false});
                el.addEventListener('touchcancel', (e) => { releaseKey(key); e.preventDefault(); }, {passive:false});
            });

            // Bind Actions
            const btnJump = document.getElementById('btn-jump');
            const btnSprint = document.getElementById('btn-sprint');
            const btnPlace = document.getElementById('btn-place');

            btnJump.addEventListener('touchstart', (e) => { pressKey(s.jump); e.preventDefault(); }, {passive:false});
            btnJump.addEventListener('touchend', (e) => { releaseKey(s.jump); e.preventDefault(); }, {passive:false});
            
            btnSprint.addEventListener('touchstart', (e) => { pressKey(s.sprinting); e.preventDefault(); }, {passive:false});
            btnSprint.addEventListener('touchend', (e) => { releaseKey(s.sprinting); e.preventDefault(); }, {passive:false});

            btnPlace.addEventListener('touchstart', (e) => {
                if (this.minecraft) {
                    this.minecraft.isRightMouseDown = true;
                    this.minecraft.onMouseClicked(2);
                }
                e.preventDefault();
            }, {passive:false});
            btnPlace.addEventListener('touchend', (e) => {
                if (this.minecraft) this.minecraft.isRightMouseDown = false;
                e.preventDefault();
            }, {passive:false});

            // Top Bar
            document.getElementById('btn-inventory').addEventListener('touchstart', (e) => {
                this.minecraft.onKeyPressed(s.inventory);
                e.preventDefault();
            }, {passive:false});

            document.getElementById('btn-chat').addEventListener('touchstart', (e) => {
                if (this.minecraft.isInGame()) this.minecraft.displayScreen(new GuiChat());
                e.preventDefault();
            }, {passive:false});

            document.getElementById('btn-pause').addEventListener('touchstart', (e) => {
                if (this.minecraft.currentScreen === null) {
                    this.minecraft.displayScreen(new GuiIngameMenu());
                } else {
                    this.minecraft.displayScreen(null);
                }
                e.preventDefault();
            }, {passive:false});
        }

        // Create hidden input to trigger on-screen keyboard and sync with GuiTextField
        this._hiddenInput = document.createElement('input');
        this._hiddenInput.type = 'text';
        this._hiddenInput.autocapitalize = 'none';
        this._hiddenInput.autocomplete = 'off';
        this._hiddenInput.spellcheck = false;
        this._hiddenInput.style.position = 'absolute';
        this._hiddenInput.style.opacity = '0';
        this._hiddenInput.style.left = '-9999px';
        this._hiddenInput.style.top = '-9999px';
        document.body.appendChild(this._hiddenInput);

        // Sync input changes to current screen's GuiTextField (if present)
        this._hiddenInput.addEventListener('input', (e) => {
            if (this.minecraft && this.minecraft.currentScreen && this.minecraft.currentScreen.fieldSeed) {
                this.minecraft.currentScreen.fieldSeed.text = e.target.value;
            }
        });

        // Hide keyboard on blur
        this._hiddenInput.addEventListener('blur', () => {
            // ensure canvas regains focus
            if (!this.isMobile) window.focus();
        });

        // Steve preview UI removed
    }

    /**
     * Open file picker for ZIP, load images inside and replace matching textures.
     * Supports both direct files and individual "cut" sprites to be stitched back into atlases.
     */
    _openTextureZipPicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip,application/zip';
        input.style.display = 'none';
        document.body.appendChild(input);
        
        input.addEventListener('change', async (e) => {
            const file = input.files && input.files[0];
            if (!file) {
                document.body.removeChild(input);
                return;
            }

            try {
                // Save to IndexedDB
                const module = await import("./world/storage/WorldStorage.js");
                await module.default.saveResourcePack(file.name, file);
                
                // Activate it
                this.minecraft.settings.activeResourcePack = file.name;
                this.minecraft.settings.save();

                // Refresh everything
                await this.minecraft.refreshTextures(true);
                
                if (this.minecraft.currentScreen && this.minecraft.currentScreen.constructor.name === "GuiResourcePacks") {
                    this.minecraft.currentScreen.init();
                }

            } catch (err) {
                console.error("Failed to import textures from zip:", err);
                this.minecraft.addMessageToChat("§cFailed to apply resource pack.");
            } finally {
                document.body.removeChild(input);
            }
        });
        input.click();
    }

    async _applyPackFromBlob(blob, progressCallback) {
            const report = (p, m) => { if(progressCallback) progressCallback(p, m); };
            try {
                report(0.05, "Unzipping archive...");
                const arrayBuffer = await blob.arrayBuffer();
                const zip = await JSZip.loadAsync(arrayBuffer);
                const resources = this.minecraft.resources;
                
                // Track sprites to be stitched back into sheets
                // resKey -> [ {idx: 0, img: ...}, ... ]
                const sheetStitches = new Map();

                // Map of spriteName.png -> { resKey, idx } for auto-stitching
                const nameToSpriteMap = new Map();
                // Resource packs use Minecraft's canonical GUI paths, while
                // this project keeps a few UI images under legacy root names.
                // Map both forms to the logical keys used by the GUI screens.
                const guiAliases = [
                    {
                        key: "gui/background.png",
                        paths: ["gui/background.png", "gui/options_background.png"]
                    },
                    {
                        key: "gui/gui.png",
                        paths: ["gui/gui.png", "gui/widgets.png"]
                    },
                    {
                        key: "gui/icons.png",
                        paths: ["gui/icons.png"]
                    },
                    {
                        key: "../../inventoryUIborder.png",
                        paths: ["inventoryUIborder.png", "gui/container/inventory.png"]
                    },
                    {
                        key: "../../inventoryslot.png",
                        paths: ["inventoryslot.png", "gui/container/slot.png"]
                    },
                    {
                        key: "../../recipe_book.png",
                        paths: ["recipe_book.png", "gui/recipe_book.png"]
                    },
                    {
                        key: "../../arrow_0_0.png",
                        paths: ["arrow_0_0.png", "gui/container/recipe_arrow.png"]
                    }
                ];
                const sheetLayouts = {
                    "../../blocks.png": { 
                        cols: 14, rows: 1, 
                        // Keep these names in the same order as the pixels in blocks.png.
                        names: ["dirt", "grass_block_side", "grass_block_top", "stone", "cobblestone", "mossy_cobblestone_base", "oak_log_top", "oak_log", "oak_planks", "sand_base", "glass", "torch", "water_still", "bedrock"]
                    },
                    "../../stonesheet.png": { 
                        cols: 8, rows: 1, 
                        names: ["smooth_stone", "chiseled_stone_bricks", "stone_bricks", "mossy_stone_bricks", "cracked_stone_bricks", "stone_variant", "cobblestone_variant", "mossy_cobblestone"]
                    },
                    "../../orestuff.png": { 
                        cols: 14, rows: 1, 
                        names: ["coal_ore", "coal_block", "iron_ore", "iron_block", "redstone_ore", "redstone_block", "diamond_ore", "diamond_block", "emerald_ore", "emerald_block", "gold_ore", "gold_block", "lapis_ore", "lapis_block"]
                    },
                    "../../nether.png": { 
                        cols: 5, rows: 1, 
                        names: ["netherrack", "soul_sand", "obsidian", "glowstone", "quartz_ore"]
                    },
                    "../../farming.png": { 
                        cols: 20, rows: 1, 
                        names: ["wheat_item", "seeds_item", "hay_bale_side", "hay_bale_top", "wheat_stage_0", "wheat_stage_1", "wheat_stage_2", "wheat_stage_3", "wheat_stage_4", "wheat_stage_5", "wheat_stage_6", "wheat_stage_7", "carrots_stage_0", "carrots_stage_1", "carrots_stage_2", "carrots_stage_3", "potatoes_stage_0", "potatoes_stage_1", "potatoes_stage_2", "potatoes_stage_3"]
                    },
                    "../../food.png": { 
                        cols: 18, rows: 1, 
                        names: ["apple", "golden_apple", "carrot", "golden_carrot", "potato", "baked_potato", "bread", "beef", "cooked_beef", "raw_chicken", "cooked_chicken", "raw_porkchop", "cooked_porkchop", "rotten_flesh", "salmon", "cooked_salmon", "raw_fish", "cooked_fish"]
                    },
                    "../../items (1).png": { 
                        cols: 37, rows: 1, 
                        names: ["ender_pearl", "book", "paper", "sugar", "snowball", "oak_boat", "spruce_boat", "birch_boat", "dark_oak_boat", "acacia_boat", "saddle", "minecart", "lava_bucket", "bucket", "water_bucket", "coal", "diamond", "brick", "gold_ingot", "iron_ingot", "stick", "feather", "gunpowder", "leather", "clay_ball", "bone_meal", "bone", "glowstone_dust", "flint", "string", "arrow", "name_tag", "rail", "rail_corner", "powered_rail_on", "powered_rail", "ladder"]
                    },
                    "../../tools (1).png": { 
                        cols: 43, rows: 1, 
                        names: ["wooden_sword", "wooden_shovel", "wooden_pickaxe", "wooden_hoe", "wooden_axe", "stone_sword", "stone_shovel", "stone_pickaxe", "stone_hoe", "stone_axe", "iron_sword", "iron_shovel", "iron_pickaxe", "iron_hoe", "iron_axe", "golden_sword", "golden_shovel", "golden_pickaxe", "golden_hoe", "golden_axe", "diamond_sword", "diamond_shovel", "diamond_pickaxe", "diamond_hoe", "diamond_axe", "iron_boots", "iron_chestplate", "iron_helmet", "gold_helmet", "gold_leggings", "diamond_leggings", "gold_chestplate", "gold_boots", "diamond_chestplate", "diamond_helmet", "iron_leggings", "diamond_boots", "bow_idle", "shears", "flint_and_steel", "map_icon", "fishing_rod", "fishing_rod_cast"]
                    },
                    "../../chest.png.png": { 
                        cols: 3, rows: 1, 
                        names: ["chest_front", "chest_side", "chest_top"]
                    },
                    "../../furnace.png.png": { 
                        cols: 4, rows: 1, 
                        names: ["furnace_front_lit", "furnace_front", "furnace_side", "furnace_top"]
                    },
                    "../../pumpkin.png.png": { 
                        cols: 4, rows: 1, 
                        names: ["pumpkin_top", "pumpkin_side", "pumpkin_front", "jack_o_lantern"]
                    },
                    "../../bed.png": { 
                        cols: 4, rows: 2, 
                        names: ["bed_top_head", "bed_top_foot", "bed_side_head", "bed_side_foot", "bed_bottom_head", "bed_bottom_foot", "bed_end_head", "bed_end_foot"]
                    },
                    "../../magma3sheet.png": { 
                        cols: 3, rows: 1, 
                        names: ["magma_0", "magma_1", "magma_2"]
                    },
                    "../../grasslandfoliage.png": { 
                        cols: 5, rows: 1, 
                        names: ["rose", "dandelion", "paeonia", "short_grass", "fern"]
                    },
                    "../../deadandsugar.png.png": { 
                        cols: 2, rows: 1, 
                        names: ["dead_bush", "sugar_cane"]
                    },
                    "../../breakanimation.png": { 
                        cols: 6, rows: 1, 
                        names: ["destroy_stage_0", "destroy_stage_1", "destroy_stage_2", "destroy_stage_3", "destroy_stage_4", "destroy_stage_5"]
                    },
                    "../../trapdoorsheet.png": { 
                        cols: 6, rows: 1, 
                        names: ["birch_trapdoor", "dark_oak_trapdoor", "oak_trapdoor", "spruce_trapdoor", "acacia_trapdoor", "iron_trapdoor"]
                    },
                    "../../coloredglass.png": { 
                        cols: 14, rows: 1, 
                        names: ["glass_lime", "glass_green", "glass_pink", "glass_orange", "glass_cyan", "glass_white", "glass_light_blue", "glass_magenta", "glass_yellow", "glass_gray", "glass_black", "glass_blue", "glass_brown", "glass_light_gray"]
                    },
                    "../../desert (1).png": { 
                        cols: 10, rows: 1, 
                        names: ["desert_sand", "desert_sugar_cane", "desert_sandstone_side", "desert_sandstone_top", "desert_cut_sandstone", "desert_chiseled_sandstone", "desert_sandstone_bottom", "unused_desert", "glass_clear", "desert_dead_bush"]
                    },
                    "../../beetroot (1).png": {
                        cols: 7, rows: 1,
                        names: ["beetroot_seeds", "beetroot", "beetroot_soup", "beetroots_stage_0", "beetroots_stage_1", "beetroots_stage_2", "beetroots_stage_3"]
                    },
                    "../../dye.png": {
                        cols: 16, rows: 1,
                        names: ["dye_cyan", "dye_brown", "dye_green", "dye_black", "dye_white", "dye_purple", "dye_red", "dye_yellow", "dye_light_gray", "dye_light_blue", "dye_gray", "dye_pink", "dye_blue", "dye_lime", "dye_magenta", "dye_orange"]
                    },
                    "../../wools.png": {
                        cols: 15, rows: 1, 
                        names: ["white_wool", "brown_wool", "light_blue_wool", "cyan_wool", "green_wool", "orange_wool", "gray_wool", "black_wool", "purple_wool", "yellow_wool", "lime_wool", "pink_wool", "red_wool", "light_gray_wool", "blue_wool"]
                    },
                    "../../terracottahseet.png": {
                        cols: 31, rows: 1, 
                        names: ["terracotta", "brown_terracotta", "orange_terracotta", "green_terracotta", "light_blue_terracotta", "purple_terracotta", "gray_terracotta", "pink_terracotta", "white_terracotta", "black_terracotta", "lime_terracotta", "cyan_terracotta", "light_gray_terracotta", "red_terracotta", "yellow_terracotta", "magenta_terracotta", "red_glazed_terracotta", "orange_glazed_terracotta", "yellow_glazed_terracotta", "lime_glazed_terracotta", "blue_glazed_terracotta", "magenta_glazed_terracotta", "pink_glazed_terracotta", "gray_glazed_terracotta", "light_gray_glazed_terracotta", "cyan_glazed_terracotta", "purple_glazed_terracotta", "brown_glazed_terracotta", "green_glazed_terracotta", "black_glazed_terracotta", "white_glazed_terracotta"]
                    },
                    "../../signs.png": {
                        cols: 5, rows: 1,
                        names: ["sign_dark_oak", "sign_spruce", "sign_acacia", "sign_oak", "sign_birch"]
                    },
                    "../../food2.png": {
                        cols: 5, rows: 1,
                        names: ["cookie", "bowl", "mushroom_stew", "raw_mutton", "cooked_mutton"]
                    },
                    "../../slimestuff.png": {
                        cols: 2, rows: 1,
                        names: ["slimeball", "slimeblock"]
                    },
                    "../../dicsandbox (1).png": {
                        cols: 14, rows: 1,
                        names: ["disc_11", "disc_13", "disc_blocks", "disc_cat", "disc_chirp", "disc_far", "disc_mall", "disc_mellohi", "disc_stal", "disc_strad", "disc_wait", "disc_ward", "jukebox_side", "jukebox_top"]
                    },
                    "../../critandnote.png": {
                        cols: 2, rows: 1,
                        names: ["crit", "note"]
                    },
                    "../../bottles.png": {
                        cols: 3, rows: 1,
                        names: ["splash_bottle", "potion_bottle", "potion_overlay"]
                    },
                    "../../water_flow (4).png": {
                        cols: 1, rows: 32,
                        names: Array.from({length:32}, (_, i) => `water_flow_${i}`)
                    },
                    "../../foliage.png": {
                        cols: 21, rows: 1, 
                        names: ["short_grass", "tall_grass_bottom", "tall_grass_top", "fern", "double_fern_bottom", "double_fern_top", "vines", "dandelion", "poppy", "lily_of_the_valley", "rose_bush_top", "rose_bush_bottom", "peony_top", "peony_bottom", "white_tulip", "pink_tulip", "red_tulip", "lilac_top", "lilac_bottom", "azure_bluet", "allium"]
                    },
                    "../../desert (3).png": {
                        cols: 11, rows: 1,
                        names: ["desert_bamboo", "desert_sand", "desert_sandstone_side", "desert_sandstone_top", "desert_cut_sandstone", "desert_chiseled_sandstone", "desert_sandstone_bottom", "desert_cactus_top", "desert_cactus_side", "desert_dead_bush", "unknown_void"]
                    },
                    "../../smoke.png": {
                        cols: 8, rows: 1,
                        names: ["smoke_0", "smoke_1", "smoke_2", "smoke_3", "smoke_4", "smoke_5", "smoke_6", "smoke_7"]
                    },
                    "../../crossbow.png": {
                        cols: 5, rows: 1,
                        names: ["crossbow_standby", "crossbow_pulling_0", "crossbow_pulling_1", "crossbow_pulling_2", "crossbow_arrow"]
                    },
                    "../../endstuff.png": {
                        cols: 7, rows: 1,
                        names: ["end_portal", "eye_of_ender", "end_portal_frame_side", "end_portal_frame_top_empty", "end_portal_frame_top_filled", "end_stone", "end_stone_bricks"]
                    },
                    "../../treestuff.png": {
                        cols: 30, rows: 1, 
                        names: [
                            "oak_sapling", "spruce_sapling", "birch_sapling", "acacia_sapling", "dark_oak_sapling", "oak_leaves_regular",
                            "oak_log_top", "oak_log", "stripped_oak", "oak_planks", "oak_leaves", "dark_oak_log_top",
                            "dark_oak_log", "stripped_dark_oak", "spruce_planks", "birch_leaves", "birch_log_top", "birch_log",
                            "stripped_birch", "birch_planks", "acacia_leaves", "acacia_log_top", "acacia_log", "stripped_acacia",
                            "acacia_planks", "spruce_leaves", "spruce_log_top", "spruce_log", "stripped_spruce", "dark_oak_planks"
                        ]
                    },
                    "../../sandstuff.png": {
                        cols: 10, rows: 1,
                        names: ["sand", "sandstone", "sandstone_top", "cut_sandstone", "chiseled_sandstone", "sandstone_bottom", "sandstone_unused_6", "sandstone_unused_7", "sandstone_unused_8", "sandstone_unused_9"]
                    },
                    "../../craftingtablesheet.png": {
                        cols: 3, rows: 1, folder: "blocks",
                        names: ["crafting_table_top", "crafting_table_front", "crafting_table_side"]
                    },
                    "../../newblocksset1.png": {
                        cols: 9, rows: 1, folder: "blocks",
                        names: ["sponge", "wet_sponge", "polished_andesite", "polished_diorite", "polished_granite", "new_block_5", "grass_path_side", "grass_path_top", "lily_pad"]
                    },
                    "../../All doors.png": { 
                        cols: 17, rows: 1, 
                        names: ["door_unused_0", "door_unused_1", "door_unused_2", "door_unused_3", "door_unused_4", "oak_door_top", "oak_door_bottom", "birch_door_top", "birch_door_bottom", "iron_door_top", "iron_door_bottom", "spruce_door_top", "spruce_door_bottom", "dark_oak_door_top", "dark_oak_door_bottom", "acacia_door_top", "acacia_door_bottom"]
                    }
                };

                // Legacy sprite names are still accepted when importing older
                // templates, but new templates use the canonical names above.
                const spriteAliases = {
                    "sand.png": { resKey: "../../sandstuff.png", idx: 0 },
                    "sandstone.png": { resKey: "../../sandstuff.png", idx: 1 },
                    "sandstone_side.png": { resKey: "../../sandstuff.png", idx: 1 },
                    "sandstone_top.png": { resKey: "../../sandstuff.png", idx: 2 },
                    "cut_sandstone.png": { resKey: "../../sandstuff.png", idx: 3 },
                    "chiseled_sandstone.png": { resKey: "../../sandstuff.png", idx: 4 },
                    "sandstone_bottom.png": { resKey: "../../sandstuff.png", idx: 5 },
                    "note_block.png": { resKey: "../../dicsandbox (1).png", idx: 12 },
                    "mossy_cobblestone_variant.png": { resKey: "../../stonesheet.png", idx: 7 },
                    "mossy_cobblestone_varient.png": { resKey: "../../stonesheet.png", idx: 7 },
                    "oak_log_side.png": { resKey: "../../treestuff.png", idx: 7 },
                    "dark_oak_log_side.png": { resKey: "../../treestuff.png", idx: 12 },
                    "birch_log_side.png": { resKey: "../../treestuff.png", idx: 16 },
                    "acacia_log_side.png": { resKey: "../../treestuff.png", idx: 22 },
                    "spruce_log_side.png": { resKey: "../../treestuff.png", idx: 27 },
                    "big_oak_leaves.png": { resKey: "../../treestuff.png", idx: 10 },
                    "oak_leaves_regular.png": { resKey: "../../treestuff.png", idx: 5 },
                    "wool_white.png": { resKey: "../../wools.png", idx: 0 },
                    "wool_brown.png": { resKey: "../../wools.png", idx: 1 },
                    "wool_light_blue.png": { resKey: "../../wools.png", idx: 2 },
                    "wool_cyan.png": { resKey: "../../wools.png", idx: 3 },
                    "wool_green.png": { resKey: "../../wools.png", idx: 4 },
                    "wool_orange.png": { resKey: "../../wools.png", idx: 5 },
                    "wool_gray.png": { resKey: "../../wools.png", idx: 6 },
                    "wool_black.png": { resKey: "../../wools.png", idx: 7 },
                    "wool_purple.png": { resKey: "../../wools.png", idx: 8 },
                    "wool_yellow.png": { resKey: "../../wools.png", idx: 9 },
                    "wool_lime.png": { resKey: "../../wools.png", idx: 10 },
                    "wool_pink.png": { resKey: "../../wools.png", idx: 11 },
                    "wool_red.png": { resKey: "../../wools.png", idx: 12 },
                    "wool_light_gray.png": { resKey: "../../wools.png", idx: 13 },
                    "wool_blue.png": { resKey: "../../wools.png", idx: 14 },
                    "tc_base.png": { resKey: "../../terracottahseet.png", idx: 0 },
                    "tc_brown.png": { resKey: "../../terracottahseet.png", idx: 1 },
                    "tc_orange.png": { resKey: "../../terracottahseet.png", idx: 2 },
                    "tc_green.png": { resKey: "../../terracottahseet.png", idx: 3 },
                    "tc_light_blue.png": { resKey: "../../terracottahseet.png", idx: 4 },
                    "tc_purple.png": { resKey: "../../terracottahseet.png", idx: 5 },
                    "tc_gray.png": { resKey: "../../terracottahseet.png", idx: 6 },
                    "tc_pink.png": { resKey: "../../terracottahseet.png", idx: 7 },
                    "tc_white.png": { resKey: "../../terracottahseet.png", idx: 8 },
                    "tc_black.png": { resKey: "../../terracottahseet.png", idx: 9 },
                    "tc_lime.png": { resKey: "../../terracottahseet.png", idx: 10 },
                    "tc_cyan.png": { resKey: "../../terracottahseet.png", idx: 11 },
                    "tc_light_gray.png": { resKey: "../../terracottahseet.png", idx: 12 },
                    "tc_red.png": { resKey: "../../terracottahseet.png", idx: 13 },
                    "tc_yellow.png": { resKey: "../../terracottahseet.png", idx: 14 },
                    "tc_magenta.png": { resKey: "../../terracottahseet.png", idx: 15 },
                    "gtc_red.png": { resKey: "../../terracottahseet.png", idx: 16 },
                    "gtc_orange.png": { resKey: "../../terracottahseet.png", idx: 17 },
                    "gtc_yellow.png": { resKey: "../../terracottahseet.png", idx: 18 },
                    "gtc_lime.png": { resKey: "../../terracottahseet.png", idx: 19 },
                    "gtc_blue.png": { resKey: "../../terracottahseet.png", idx: 20 },
                    "gtc_magenta.png": { resKey: "../../terracottahseet.png", idx: 21 },
                    "gtc_pink.png": { resKey: "../../terracottahseet.png", idx: 22 },
                    "gtc_gray.png": { resKey: "../../terracottahseet.png", idx: 23 },
                    "gtc_light_gray.png": { resKey: "../../terracottahseet.png", idx: 24 },
                    "gtc_cyan.png": { resKey: "../../terracottahseet.png", idx: 25 },
                    "gtc_purple.png": { resKey: "../../terracottahseet.png", idx: 26 },
                    "gtc_brown.png": { resKey: "../../terracottahseet.png", idx: 27 },
                    "gtc_green.png": { resKey: "../../terracottahseet.png", idx: 28 },
                    "gtc_black.png": { resKey: "../../terracottahseet.png", idx: 29 },
                    "gtc_white.png": { resKey: "../../terracottahseet.png", idx: 30 },
                    "trapdoor_birch.png": { resKey: "../../trapdoorsheet.png", idx: 0 },
                    "trapdoor_dark_oak.png": { resKey: "../../trapdoorsheet.png", idx: 1 },
                    "trapdoor_oak.png": { resKey: "../../trapdoorsheet.png", idx: 2 },
                    "trapdoor_spruce.png": { resKey: "../../trapdoorsheet.png", idx: 3 },
                    "trapdoor_acacia.png": { resKey: "../../trapdoorsheet.png", idx: 4 },
                    "trapdoor_iron.png": { resKey: "../../trapdoorsheet.png", idx: 5 },
                    "door_oak_top.png": { resKey: "../../All doors.png", idx: 5 },
                    "door_oak_bottom.png": { resKey: "../../All doors.png", idx: 6 },
                    "door_birch_top.png": { resKey: "../../All doors.png", idx: 7 },
                    "door_birch_bottom.png": { resKey: "../../All doors.png", idx: 8 },
                    "door_iron_top.png": { resKey: "../../All doors.png", idx: 9 },
                    "door_iron_bottom.png": { resKey: "../../All doors.png", idx: 10 },
                    "door_spruce_top.png": { resKey: "../../All doors.png", idx: 11 },
                    "door_spruce_bottom.png": { resKey: "../../All doors.png", idx: 12 },
                    "door_dark_oak_top.png": { resKey: "../../All doors.png", idx: 13 },
                    "door_dark_oak_bottom.png": { resKey: "../../All doors.png", idx: 14 },
                    "door_acacia_top.png": { resKey: "../../All doors.png", idx: 15 },
                    "door_acacia_bottom.png": { resKey: "../../All doors.png", idx: 16 }
                };
                const directTextureAliases = {
                    "oak_bookshelf.png": "../../bookshelf.png",
                    "bookshelf.png": "../../bookshelf.png"
                };

                for (const [resKey, layout] of Object.entries(sheetLayouts)) {
                    if (layout.names) {
                        layout.names.forEach((name, idx) => {
                            if (name) nameToSpriteMap.set(name + ".png", { resKey, idx });
                        });
                    }
                }
                for (const [name, target] of Object.entries(spriteAliases)) {
                    nameToSpriteMap.set(name, target);
                }

                const fileNames = Object.keys(zip.files);
                report(0.15, `Found ${fileNames.length} entries. Scanning...`);
                
                let processedFiles = 0;
                // Process all files in parallel using Promise.all for maximum throughput
                await Promise.all(fileNames.map(async (entryName) => {
                    const entry = zip.files[entryName];
                    if (entry.dir) return;
                    if (!entryName.match(/\.(png|jpg|jpeg|gif)$/i)) return;

                    const fileName = entryName.split('/').pop();
                    let handled = false;

                    // Some legacy internal sheets already have dedicated
                    // single-sprite resources. Prefer those resources so a
                    // canonical pack sprite is actually used by the block
                    // renderer instead of being stitched into an unused sheet.
                    const directAlias = directTextureAliases[fileName.toLowerCase()];
                    if (directAlias && directAlias in resources) {
                        const blob = await entry.async('blob');
                        resources[directAlias] = await this._loadImageFromBlob(blob);
                        report(0.15 + (processedFiles++ / fileNames.length) * 0.4, `Loading texture: ${fileName}`);
                        return;
                    }

                    // Check if it's a "cut" sprite from our system by its descriptive name
                    if (nameToSpriteMap.has(fileName)) {
                        const { resKey, idx } = nameToSpriteMap.get(fileName);
                        const blob = await entry.async('blob');
                        const img = await this._loadImageFromBlob(blob);
                        
                        if (!sheetStitches.has(resKey)) sheetStitches.set(resKey, []);
                        sheetStitches.get(resKey).push({ idx, img });
                        report(0.15 + (processedFiles++ / fileNames.length) * 0.4, `Found sprite: ${fileName}`);
                        handled = true;
                    }

                    if (handled) return;

                    // Standard direct file replacement
                    let candidates = [entryName, entryName.replace(/^\.?\//, ''), entryName.split('/').slice(-2).join('/'), fileName];
                    let matchedKey = null;
                    
                    if (fileName.toLowerCase().endsWith("terrain.png") && "../../blocks.png" in resources) matchedKey = "../../blocks.png";
                    
                    if (!matchedKey) {
                        for (const c of candidates) {
                            if (c in resources) { matchedKey = c; break; }
                            const withPrefix = c.replace(/^src\/resources\//, '');
                            if (withPrefix in resources) { matchedKey = withPrefix; break; }
                            const withUp = "../../" + c;
                            if (withUp in resources) { matchedKey = withUp; break; }
                        }
                    }

                    if (!matchedKey) {
                        const normalizedEntry = entryName
                            .replace(/^\.?\//, "")
                            .toLowerCase();
                        for (const alias of guiAliases) {
                            if (alias.paths.some(path => {
                                const normalizedPath = path.toLowerCase();
                                return normalizedEntry === normalizedPath ||
                                    normalizedEntry.endsWith("/" + normalizedPath);
                            })) {
                                matchedKey = alias.key;
                                break;
                            }
                        }
                    }

                    if (matchedKey) {
                        const blob = await entry.async('blob');
                        resources[matchedKey] = await this._loadImageFromBlob(blob);
                        report(0.15 + (processedFiles++ / fileNames.length) * 0.4, `Loading texture: ${fileName}`);
                    }
                }));

                // Process Stitches in parallel
                report(0.6, "Stitching sprites into atlases...");
                let stitchedCount = 0;
                const stitchPromises = Array.from(sheetStitches.entries()).map(async ([resKey, sprites]) => {
                    const original = resources[resKey];
                    if (!original) return;

                    const layout = sheetLayouts[resKey];
                    const canvas = document.createElement('canvas');
                    canvas.width = original.width;
                    canvas.height = original.height;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = false;
                    
                    // Draw original first to keep unedited parts
                    ctx.drawImage(original, 0, 0);

                    const sw = Math.floor(canvas.width / layout.cols);
                    const sh = Math.floor(canvas.height / layout.rows);

                    for (const sprite of sprites) {
                        const sx = (sprite.idx % layout.cols) * sw;
                        const sy = Math.floor(sprite.idx / layout.cols) * sh;
                        ctx.clearRect(sx, sy, sw, sh);
                        ctx.drawImage(sprite.img, 0, 0, sprite.img.width, sprite.img.height, sx, sy, sw, sh);
                    }

                    // Native ImageBitmap creation is much faster than toDataURL + Image onload
                    resources[resKey] = await createImageBitmap(canvas);
                    report(0.6 + (stitchedCount++ / sheetStitches.size) * 0.3, `Updated atlas: ${resKey.split('/').pop()}`);
                });
                
                await Promise.all(stitchPromises);

                report(0.95, "Refreshing world geometry...");
                // Global Refresh - skip pack application to avoid infinite loop
                if (this.minecraft && typeof this.minecraft.refreshTextures === 'function') {
                    this.minecraft.refreshTextures(false, false);
                }
                if (this.minecraft.itemRenderer) {
                    this.minecraft.itemRenderer.rebuildAllItems();
                    this.minecraft.itemRenderer.reset(); // Clear cached groups/meshes
                }
                // Existing screens cache their images during init(). Refresh
                // those references too, otherwise an open inventory/chest
                // keeps drawing the pre-pack HTMLImageElements.
                const refreshScreen = (screen, seen = new Set()) => {
                    if (!screen || seen.has(screen)) return;
                    seen.add(screen);
                    if (typeof screen.refreshTextureReferences === "function") {
                        screen.refreshTextureReferences();
                    }
                    refreshScreen(screen.previousScreen, seen);
                    refreshScreen(screen.nextScreen, seen);
                };
                refreshScreen(this.minecraft.currentScreen);
                refreshScreen(this.minecraft.currentScreen2);
                if (this.minecraft.worldRenderer) {
                    this.minecraft.worldRenderer.rebuildAll();
                    this.minecraft.worldRenderer.flushRebuild = true;
                }
                
                if (this.minecraft) this.minecraft._suppressEscUntil = Date.now() + 2000;
                report(1.0, "Resource pack applied!");

            } catch (err) {
                console.error("Failed to apply pack blob:", err);
                throw err;
            }
    }

    async _loadImageFromBlob(blob) {
        // Use high-performance browser native decoding for ZIP images
        return await createImageBitmap(blob);
    }

    requestFocus() {
        if (this.isMobile) {
            document.body.requestFullscreen();
        } else {
            window.focus();
            this.canvas.requestPointerLock();
            document.body.style.cursor = 'none';
        }

        this.mouseLocked = true;
    }

    exitFocus() {
        if (this.isMobile) {
            return;
        }

        document.exitPointerLock();
        document.body.style.cursor = 'default';
    }

    updateWindowSize() {
        this.updateScaleFactor();

        let wrapperWidth = this.width * this.scaleFactor;
        let wrapperHeight = this.height * this.scaleFactor;

        let worldRenderer = this.minecraft.worldRenderer;
        let itemRenderer = this.minecraft.itemRenderer;
        let screenRenderer = this.minecraft.screenRenderer;

        // Safety check to prevent crashes during early initialization resize events
        if (worldRenderer && worldRenderer.camera && worldRenderer.webRenderer) {
            // Update world renderer size and camera
            worldRenderer.camera.aspect = this.width / this.height;
            worldRenderer.camera.updateProjectionMatrix();
            worldRenderer.webRenderer.setSize(wrapperWidth, wrapperHeight);
            
            // Cap internal render resolution. Very high-DPI displays can
            // otherwise turn every voxel pass into a multi-megapixel fill-rate
            // workload with little visual benefit for pixel art.
            const baseRatio = Math.min(window.devicePixelRatio || 1, 1.5);
            const scale = this.minecraft.settings.resolutionScale || 1.0;
            worldRenderer.webRenderer.setPixelRatio(this.minecraft.settings.lowQualityTextures ? (0.5 * scale) : (baseRatio * scale));
        }

        if (itemRenderer && itemRenderer.camera && itemRenderer.webRenderer) {
            // Update item renderer size and camera
            itemRenderer.camera.aspect = this.width / this.height;
            itemRenderer.camera.updateProjectionMatrix();
            itemRenderer.webRenderer.setSize(wrapperWidth, wrapperHeight);
            
            const baseRatio = Math.min(window.devicePixelRatio || 1, 1.5);
            const scale = this.minecraft.settings.resolutionScale || 1.0;
            itemRenderer.webRenderer.setPixelRatio(this.minecraft.settings.lowQualityTextures ? (0.5 * scale) : (baseRatio * scale));
        }

        // Update canvas 2d size
        if (this.canvas2d) {
            this.canvas2d.style.width = wrapperWidth + "px";
            this.canvas2d.style.height = wrapperHeight + "px";
        }

        // Update canvas for counts
        if (this.canvasCounts) {
            this.canvasCounts.style.width = wrapperWidth + "px";
            this.canvasCounts.style.height = wrapperHeight + "px";
        }

        // Update canvas for 3D items in GUI
        if (this.canvasItems) {
            this.canvasItems.style.width = wrapperWidth + "px";
            this.canvasItems.style.height = wrapperHeight + "px";
        }

        // Reinitialize gui
        if (screenRenderer) {
            screenRenderer.initialize();
        }

        // Reinitialize current screen
        if (this.minecraft.currentScreen !== null) {
            this.minecraft.currentScreen.setup(this.minecraft, this.width, this.height);
        }
    }

    updateScaleFactor() {
        let wrapperWidth = this.wrapper.offsetWidth;
        let wrapperHeight = this.wrapper.offsetHeight;

        let scale;
        for (scale = 1; wrapperWidth / (scale + 1) >= 320 && wrapperHeight / (scale + 1) >= 240; scale++) {
            // Empty
        }

        this.scaleFactor = scale;
        this.width = wrapperWidth / scale;
        this.height = wrapperHeight / scale;
    }

    onFocusChanged() {
        this.actualMouseLocked = document.pointerLockElement === this.canvas;
    }

    onMouseMove(event) {
        // Only update if mouse is not locked (i.e. in menu or first entry)
        if (document.pointerLockElement !== this.canvas) {
            this.mouseX = event.clientX / this.scaleFactor;
            this.mouseY = event.clientY / this.scaleFactor;
            this.mouseLocked = false;

            if (this.minecraft.currentScreen === null) {
                this.requestFocus();
            }
        }

        if (this.actualMouseLocked || this.mouseLocked) {
            // Accumulate movement instead of overwriting so high-polling mice work correctly
            this.mouseMotionX += event.movementX;
            this.mouseMotionY -= event.movementY;
        }
    }

    detectTouchDevice() {
        let hasTouch = false;
        try {
            hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        } catch (e) {
            // ignore errors
        }

        if (hasTouch) {
            // Further check for mobile user agent to exclude touch screen desktops
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }

        return false;
    }

    close() {
        this.openUrl(Minecraft.URL_WEBSIM);
    }

    openUrl(url, newTab) {
        if (newTab) {
            window.open(url, '_blank').focus();
        } else {
            window.location = url;
        }
    }

    async getClipboardText() {
        try {
            return await navigator.clipboard.readText();
        } catch (e) {
            // Permission denied or unsupported - return empty string to avoid unhandled rejection
            return "";
        }
    }

    // Show the mobile OS keyboard by focusing the hidden input and optionally prefill
    showVirtualKeyboard(prefill = "") {
        if (!this._hiddenInput) return;
        this._hiddenInput.value = prefill;
        // Slight delay to ensure focus triggers keyboard on many devices
        setTimeout(() => {
            this._hiddenInput.focus();
            // Move selection to end
            try { this._hiddenInput.setSelectionRange(this._hiddenInput.value.length, this._hiddenInput.value.length); } catch (e) {}
        }, 50);
    }

    // Hide virtual keyboard and blur the hidden input
    hideVirtualKeyboard() {
        if (!this._hiddenInput) return;
        this._hiddenInput.blur();
    }

    cleanup() {
        if (this._mobileMiningInterval) {
            clearInterval(this._mobileMiningInterval);
            this._mobileMiningInterval = null;
        }
    }

}
