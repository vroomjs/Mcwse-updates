import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";

export default class GuiLANOpened extends GuiScreen {

    constructor(previousScreen, code) {
        super();
        this.previousScreen = previousScreen;
        this.code = code;
    }

    init() {
        super.init();
        
        let y = this.height / 2 + 20;
        
        this.buttonList.push(new GuiButton("Done", this.width / 2 - 100, y, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Local Game Hosted", this.width / 2, this.height / 2 - 50, 0xFFFFFF);
        this.drawCenteredString(stack, "Your LAN Code:", this.width / 2, this.height / 2 - 30, 0xA0A0A0);
        
        // Draw Code Large
        stack.save();
        stack.translate(this.width / 2, this.height / 2 - 10, 0);
        stack.scale(2, 2, 2);
        this.drawCenteredString(stack, this.code, 0, 0, 0x55FF55);
        stack.restore();

        this.drawCenteredString(stack, "Direct peer-to-peer LAN", this.width / 2, this.height / 2 + 40, 0xAAAAAA);
        this.drawCenteredString(stack, "Share this code with others to join.", this.width / 2, this.height / 2 + 60, 0x808080);

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}
