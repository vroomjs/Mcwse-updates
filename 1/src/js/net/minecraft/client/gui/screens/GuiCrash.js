import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";

export default class GuiCrash extends GuiScreen {

    constructor() {
        super();
    }

    init() {
        super.init();

        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.buttonList.push(new GuiButton("Return to Title", centerX - 100, centerY + 40, 200, 20, () => {
            this.minecraft.loadWorld(null);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        // Red crash background
        this.drawRect(stack, 0, 0, this.width, this.height, '#550000');

        stack.save();
        stack.translate(this.width / 2, this.height / 4, 0);
        stack.scale(2, 2, 2);
        this.drawCenteredString(stack, "GAME CRASHED!", 0, 0, 0xFFFFFF);
        stack.restore();

        const y = this.height / 4 + 40;
        this.drawCenteredString(stack, "The game has been running at 1 FPS", this.width / 2, y, 0xAAAAAA);
        this.drawCenteredString(stack, "for more than 10 seconds.", this.width / 2, y + 12, 0xAAAAAA);
        this.drawCenteredString(stack, "This usually happens due to extreme lag", this.width / 2, y + 30, 0xAAAAAA);
        this.drawCenteredString(stack, "or a browser tab freeze.", this.width / 2, y + 42, 0xAAAAAA);

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    doesGuiPauseGame() {
        return true;
    }
}