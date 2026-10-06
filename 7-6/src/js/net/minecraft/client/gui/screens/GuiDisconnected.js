import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiMainMenu from "./GuiMainMenu.js";

export default class GuiDisconnected extends GuiScreen {
    constructor(message, previousScreen = null) {
        super();
        this.message = String(message || "Disconnected from server");
        this.previousScreen = previousScreen;
        this.lines = [];
    }

    init() {
        super.init();
        const wrap = this.minecraft?.fontRenderer?.listFormattedStringToWidth;
        this.lines = wrap ? wrap.call(this.minecraft.fontRenderer, this.message, this.width - 50) : [this.message];
        const y = this.height / 2 - 50;
        this.buttonList.push(new GuiButton("Done", this.width / 2 - 100, y + 130, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen || new GuiMainMenu());
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Disconnected from server", this.width / 2, this.height / 2 - 28, 0xFF5555);
        for (let i = 0; i < this.lines.length; i++) {
            this.drawCenteredString(stack, this.lines[i], this.width / 2, this.height / 2 - 4 + i * 10, 0xFFFFFF);
        }
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}
