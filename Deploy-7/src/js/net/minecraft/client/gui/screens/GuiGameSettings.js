import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiSwitchButton from "../widgets/GuiSwitchButton.js";

export default class GuiGameSettings extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
    }

    init() {
        super.init();

        const s = this.minecraft.settings;
        const centerX = this.width / 2;
        let y = this.height / 2 - 40;

        const difficulties = ["Peaceful", "Easy", "Normal", "Hard"];
        this.btnDifficulty = new GuiButton("Difficulty: " + difficulties[s.difficulty], centerX - 100, y, 98, 20, () => {
            s.difficulty = (s.difficulty + 1) % 4;
            this.btnDifficulty.string = "Difficulty: " + difficulties[s.difficulty];
            s.save();
        });
        this.buttonList.push(this.btnDifficulty);

        if (this.minecraft.world) {
            const currentGM = this.minecraft.player.gameMode;
            this.btnWorldGM = new GuiButton("Mode: " + (currentGM === 1 ? "Creative" : "Survival"), centerX + 2, y, 98, 20, () => {
                const nextGM = this.minecraft.player.gameMode === 1 ? 0 : 1;
                this.minecraft.commandHandler.handleMessage("gamemode " + nextGM);
                this.btnWorldGM.string = "Mode: " + (nextGM === 1 ? "Creative" : "Survival");
            });
            this.buttonList.push(this.btnWorldGM);
        }
        y += 24;

        if (this.minecraft.world) {
            this.buttonList.push(new GuiSwitchButton("Keep Inventory", this.minecraft.world.gameRules.keepInventory, centerX - 100, y, 200, 20, val => {
                this.minecraft.world.gameRules.keepInventory = val;
            }));
            y += 24;

            this.buttonList.push(new GuiSwitchButton("Activate Cheats", this.minecraft.world.gameRules.cheatsEnabled, centerX - 100, y, 200, 20, val => {
                this.minecraft.world.gameRules.cheatsEnabled = val;
                s.cheatsEnabled = val; // Sync with persistent settings
                s.save();
            }));
            y += 24;

            this.buttonList.push(new GuiSwitchButton("Show Day Counter", this.minecraft.world.gameRules.showDayCounter, centerX - 100, y, 200, 20, val => {
                this.minecraft.world.gameRules.showDayCounter = val;
                s.showDayCounter = val; // Sync with persistent settings
                s.save();
            }));
            y += 24;
        }

        const intervals = ["1 Minute", "5 Minutes", "10 Minutes", "30 Minutes", "Off"];
        this.btnAutosave = new GuiButton("Autosave: " + intervals[s.autosaveInterval], centerX - 100, y, 200, 20, () => {
            s.autosaveInterval = (s.autosaveInterval + 1) % intervals.length;
            this.btnAutosave.string = "Autosave: " + intervals[s.autosaveInterval];
            s.save();
        });
        this.buttonList.push(this.btnAutosave);
        y += 24;

        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 40, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Game Settings", this.width / 2, 20);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}