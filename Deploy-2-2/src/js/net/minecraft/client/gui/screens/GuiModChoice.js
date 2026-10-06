import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiResourcePacks from "./GuiResourcePacks.js";

export default class GuiModChoice extends GuiScreen {
    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
    }

    init() {
        super.init();
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.buttonList.push(new GuiButton("Resource Packs", centerX - 100, centerY - 22, 200, 20, () => {
            this.minecraft.displayScreen(new GuiResourcePacks(this.previousScreen));
        }));

        this.buttonList.push(new GuiButton("Mods", centerX - 100, centerY + 2, 200, 20, () => {
            import("./GuiMods.js").then(module => {
                this.minecraft.displayScreen(new module.default(this.previousScreen));
            });
        }));

        this.buttonList.push(new GuiButton("Back", centerX - 100, this.height - 30, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Select Modification Type", this.width / 2, this.height / 2 - 50);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}