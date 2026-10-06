import Gui from "./Gui.js";

export default class GuiScreen extends Gui {

    constructor() {
        super();

        this.buttonList = [];
        this.previousScreen = null;
    }

    setup(minecraft, width, height) {
        this.minecraft = minecraft;
        this.width = width;
        this.height = height;
        this.textureBackground = this.getTexture("gui/background.png");

        this.init();
    }

    init() {
        this.buttonList = [];
    }

    onClose() {

    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        let buttons = [...this.buttonList];
        for (let i = 0; i < buttons.length; i++) {
            let button = buttons[i];
            if (button) {
                button.minecraft = this.minecraft;
                button.render(stack, mouseX, mouseY, partialTicks);
            }
        }
    }

    updateScreen() {
        let buttons = [...this.buttonList];
        for (let i = 0; i < buttons.length; i++) {
            let button = buttons[i];
            if (button) {
                button.onTick();
            }
        }
    }

    handleMouseScroll(delta) {
        // Default no-op
    }

    keyTyped(key, character) {
        if (key === "Escape") {
            this.minecraft.displayScreen(this.previousScreen);
            return true;
        }

        let buttons = [...this.buttonList];
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].keyTyped(key, character);
        }

        return false;
    }

    keyReleased(key) {
        let buttons = [...this.buttonList];
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].keyReleased(key);
        }

        return false;
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        let buttons = [...this.buttonList];
        let found = false;
        for (let i = 0; i < buttons.length; i++) {
            let button = buttons[i];
            if (!button) continue;

            // Adjust mouse check for per-player menus if needed, but 
            // ScreenRenderer already translates mouse coords to local screen space.
            if (!found && button.isMouseOver(mouseX, mouseY)) {
                button.mouseClicked(mouseX, mouseY, mouseButton);
                found = true;
            } else if (typeof button.isFocused !== 'undefined') {
                button.isFocused = false;
            }
        }
    }

    mouseReleased(mouseX, mouseY, mouseButton) {
        let buttons = [...this.buttonList];
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].mouseReleased(mouseX, mouseY, mouseButton);
        }
    }

    mouseDragged(mouseX, mouseY, mouseButton) {
        let buttons = [...this.buttonList];
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].mouseDragged(mouseX, mouseY, mouseButton);
        }
    }

    drawDefaultBackground(stack) {
        if (this.minecraft.isInGame()) {
            // Render transparent background
            this.drawRect(stack, 0, 0, this.width, this.height, 'black', 0.6);
        } else {
            // Render dirt background
            this.drawBackground(stack, this.textureBackground, this.width, this.height);
        }
    }

    doesGuiPauseGame() {
        return true;
    }
}