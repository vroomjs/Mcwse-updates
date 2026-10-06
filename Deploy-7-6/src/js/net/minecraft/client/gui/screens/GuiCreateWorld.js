import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import World from "../../world/World.js";
import GuiTextField from "../widgets/GuiTextField.js";
import Random from "../../../util/Random.js";
import Long from "../../../../../../../libraries/long.js";
import GuiSwitchButton from "../widgets/GuiSwitchButton.js";
import GuiLoadingScreen from "./GuiLoadingScreen.js";

export default class GuiCreateWorld extends GuiScreen {

    constructor(previousScreen, preset = null) {
        super();

        this.previousScreen = previousScreen;
        this.preset = preset;

        // State
        this.inSettings = false;
        
        // Default Values
        this.gameType = "normal"; // "normal" or "skyblock"
        this.worldType = 0;
        this.gameMode = 0;
        this.bonusChest = false;
        this.startingMap = false;
        this.keepInventory = false;
        this.cheatsEnabled = false;
        this.showDayCounter = false;
        this._settingsInitialized = false;

        this.cachedName = "New World";
        this.cachedSeed = "";

        this.superflatLayers = [
            { id: 7, count: 1 },
            { id: 3, count: 2 },
            { id: 2, count: 1 }
        ];

        // Apply Preset
        if (this.preset) {
            if (this.preset.name) this.cachedName = "Copy of " + this.preset.name;
            if (this.preset.seed) this.cachedSeed = this.preset.seed;
            if (this.preset.worldType !== undefined) this.worldType = this.preset.worldType;
            if (this.preset.gameMode !== undefined) this.gameMode = this.preset.gameMode;
            if (this.preset.bonusChest !== undefined) this.bonusChest = this.preset.bonusChest;
            // startingMap and gameType not in preset structure currently, use defaults
        }
        
        this.worldTypeNames = ["Default", "Flat", "Small (350x350)", "Large (1000x1000)", "Amplified", "V2 (Classic Alpha)", "Debug"];
    }

    init() {
        super.init();
        this.buttonList = []; // Clear

        if (!this._settingsInitialized) {
            this.cheatsEnabled = this.minecraft.settings.cheatsEnabled || false;
            this.showDayCounter = this.minecraft.settings.showDayCounter || false;
            this._settingsInitialized = true;
        }

        if (this.inSettings) {
            this.initSettings();
        } else {
            this.initMain();
        }
    }

    initMain() {
        let y = this.height / 4;

        // --- Row -1: Game Type Button (Above Name) ---
        // Using a single button to cycle types instead of two
        
        let typeLabel = "Game Type: Normal";
        if (this.gameType === "skyblock") typeLabel = "Game Type: Skyblock";
        if (this.gameType === "oneblock") typeLabel = "Game Type: One Block";

        this.btnGameType = new GuiButton(typeLabel, this.width / 2 - 100, y - 24, 200, 20, () => {
            if (this.gameType === "normal") {
                this.gameType = "skyblock";
            } else if (this.gameType === "skyblock") {
                this.gameType = "oneblock";
                this.keepInventory = true; // Auto-enable keep inventory for One Block
            } else {
                this.gameType = "normal";
            }
            
            this.refreshGameTypeButtons();
        });
        
        this.buttonList.push(this.btnGameType);


        // --- Row 0: World Name ---
        this.fieldName = new GuiTextField(this.width / 2 - 100, y + 20, 200, 20);
        this.fieldName.maxLength = 32;
        this.fieldName.text = this.cachedName;
        this.buttonList.push(this.fieldName);


        // --- Row 1: World Seed ---
        this.fieldSeed = new GuiTextField(this.width / 2 - 100, y + 60, 200, 20);
        this.fieldSeed.maxLength = 30;
        this.fieldSeed.text = this.cachedSeed;
        this.buttonList.push(this.fieldSeed);


        // --- Row 2: World Settings Button (Under Seed) ---
        this.buttonList.push(new GuiButton("World Settings...", this.width / 2 - 100, y + 90, 200, 20, () => {
            this.cacheFields();
            this.inSettings = true;
            this.init();
        }));


        // --- Row 3: Game Mode ---
        this.btnGameMode = new GuiButton("Game Mode: " + (this.gameMode === 1 ? "Creative" : "Survival"), this.width / 2 - 100, y + 114, 98, 20, () => {
            this.gameMode = (this.gameMode + 1) % 2;
            this.btnGameMode.string = "Game Mode: " + (this.gameMode === 1 ? "Creative" : "Survival");
        });
        this.buttonList.push(this.btnGameMode);

        const difficulties = ["Peaceful", "Easy", "Normal", "Hard"];
        this.btnDifficulty = new GuiButton("Difficulty: " + difficulties[this.gameMode === 1 ? 0 : 2], this.width / 2 + 2, y + 114, 98, 20, () => {
            this.minecraft.settings.difficulty = (this.minecraft.settings.difficulty + 1) % 4;
            this.btnDifficulty.string = "Difficulty: " + difficulties[this.minecraft.settings.difficulty];
        });
        this.buttonList.push(this.btnDifficulty);


        // --- Footer: Create / Cancel ---
        let buttonY = this.height - 52;
        this.buttonList.push(new GuiButton("Create New World", this.width / 2 - 154, buttonY, 150, 20, () => {
            this.cacheFields();

            // Display an immediate loading screen to inform the user before the 
            // main thread locks for the intensive world generation process.
            const loading = new GuiLoadingScreen();
            loading.setTitle("Loading world. This may take a moment,");
            this.minecraft.displayScreen(loading);

            // Defer the heavy construction to the next frame to allow the UI to update
            setTimeout(() => {
                this.createWorld();
            }, 50);
        }));
        this.buttonList.push(new GuiButton("Cancel", this.width / 2 + 4, buttonY, 150, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    initSettings() {
        const btnW = 150;
        const gap = 10;
        const leftX = this.width / 2 - btnW - gap / 2;
        const rightX = this.width / 2 + gap / 2;
        let y = this.height / 4 + 10;
        const rowH = 24;
        
        // --- Column 1 (Left) ---
        let ly = y;
        
        // Starter Chest (Bonus Chest)
        this.buttonList.push(new GuiSwitchButton("Starter Chest", this.bonusChest, leftX, ly, btnW, 20, value => {
            this.bonusChest = value;
        }));
        ly += rowH;

        // Keep Inventory
        this.buttonList.push(new GuiSwitchButton("Keep Inventory", this.keepInventory, leftX, ly, btnW, 20, value => {
            this.keepInventory = value;
        }));
        ly += rowH;

        // Day Counter
        this.buttonList.push(new GuiSwitchButton("Show Day Counter", this.showDayCounter, leftX, ly, btnW, 20, value => {
            this.showDayCounter = value;
        }));
        ly += rowH;

        // More World Settings
        this.buttonList.push(new GuiButton("More World Settings...", leftX, ly, btnW, 20, () => {
            this.cacheFields();
            import("./GuiMoreWorldSettings.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));
        ly += rowH;

        // --- Column 2 (Right) ---
        let ry = y;

        // Starting Map
        this.buttonList.push(new GuiSwitchButton("Starting Map", this.startingMap, rightX, ry, btnW, 20, value => {
            this.startingMap = value;
        }));
        ry += rowH;

        // Activate Cheats
        this.buttonList.push(new GuiSwitchButton("Activate Cheats", this.cheatsEnabled, rightX, ry, btnW, 20, value => {
            this.cheatsEnabled = value;
        }));
        ry += rowH;

        // World Type
        this.btnWorldType = new GuiButton("World Type: " + this.worldTypeNames[this.worldType], rightX, ry, btnW, 20, () => {
            this.worldType = (this.worldType + 1) % this.worldTypeNames.length;
            this.btnWorldType.string = "World Type: " + this.worldTypeNames[this.worldType];
            this.init(); 
        });
        this.buttonList.push(this.btnWorldType);
        ry += rowH;

        // Customize (Always show, greyed out if not flat)
        this.btnCustomize = new GuiButton("Customize Flat...", rightX, ry, btnW, 20, () => {
            import("./GuiSuperflatLayers.js").then(module => {
                this.minecraft.displayScreen(new module.default(this, this.superflatLayers));
            });
        });
        this.btnCustomize.setEnabled(this.worldType === 1);
        this.buttonList.push(this.btnCustomize);
        ry += rowH;

        // Done button centered at bottom
        this.buttonList.push(new GuiButton("Done", this.width / 2 - 100, this.height - 52, 200, 20, () => {
            this.inSettings = false;
            this.init();
        }));
    }

    refreshGameTypeButtons() {
        if (this.btnGameType) {
            let label = "Game Type: Normal";
            if (this.gameType === "skyblock") label = "Game Type: Skyblock";
            if (this.gameType === "oneblock") label = "Game Type: One Block";
            this.btnGameType.string = label;
        }
    }

    cacheFields() {
        if (this.fieldName) this.cachedName = this.fieldName.getText();
        if (this.fieldSeed) this.cachedSeed = this.fieldSeed.getText();
    }

    createWorld() {
        // Text seeds are normally converted into a numeric hash. Record this
        // exact phrase before hashing so the Backrooms easter egg survives saves.
        const isBackroomsSeed = String(this.cachedSeed || "").trim().toLowerCase() === "backrooms";
        let seed = this.cachedSeed;
        if (seed.length === 0) {
            seed = new Random().nextLong();
        } else if (typeof seed === "string") {
            let h = 0;
            for (let i = 0; i < seed.length; i++) {
                h = 31 * h + seed.charCodeAt(i);
            }
            seed = Long.fromNumber(h);
        }

        const worldId = 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const world = new World(this.minecraft, seed, worldId, this.gameMode);
        world.name = this.cachedName || "New World";
        world.isBackroomsSeed = isBackroomsSeed;
        world.worldType = this.worldType;
        if (this.worldType === 1) {
            world.superflatLayers = this.superflatLayers;
        }
        
        // Set options
        world._bonusChest = !!this.bonusChest;
        world._startingMap = !!this.startingMap;
        world._gameType = this.gameType; // "normal" or "skyblock"
        world.gameRules.keepInventory = !!this.keepInventory;
        world.gameRules.cheatsEnabled = !!this.cheatsEnabled;
        world.gameRules.showDayCounter = !!this.showDayCounter;
        world.gameRules.generateStructures = !!this.generateStructures;
        world.spawnBiome = this.spawnBiome || "all";

        // World constructs a generator before the UI applies its selected
        // world type. Recreate it now so Flat and V2 worlds use the intended
        // generator on their very first chunk.
        world.setSeed(seed);

        this.minecraft.loadWorld(world, "Loading world. This may take a moment,");
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        // Background
        this.drawDefaultBackground(stack);

        // Title
        this.drawCenteredString(stack, this.inSettings ? "World Settings" : "Create New World", this.width / 2, 20);

        if (!this.inSettings) {
            let y = this.height / 4;
            this.drawString(stack, "World Name", this.width / 2 - 100, y + 7, -6250336);
            this.drawString(stack, "World Seed", this.width / 2 - 100, y + 47, -6250336);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    onClose() {

    }

}
