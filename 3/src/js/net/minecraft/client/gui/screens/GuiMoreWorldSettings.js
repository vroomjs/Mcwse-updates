import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiSwitchButton from "../widgets/GuiSwitchButton.js";

export default class GuiMoreWorldSettings extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.biomeList = ["all", "plains", "desert", "snow", "forest"];
    }

    init() {
        super.init();
        const centerX = this.width / 2;
        const btnW = 200;
        let y = this.height / 4 + 20;

        // Structure Generation
        this.buttonList.push(new GuiSwitchButton("Generate Structures", this.previousScreen.generateStructures !== false, centerX - 100, y, btnW, 20, val => {
            this.previousScreen.generateStructures = val;
        }));
        y += 24;



        // Back button
        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 40, btnW, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    formatBiome(b) {
        if (b === "all") return "Default";
        return b.charAt(0).toUpperCase() + b.slice(1);
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "More World Settings", this.width / 2, 20);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}