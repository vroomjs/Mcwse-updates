export default class GuiWhiteScreen {
    setup(minecraft, width, height) {
        this.minecraft = minecraft;
        this.width = width;
        this.height = height;
    }
    init() {}
    drawScreen(stack) {
        stack.save();
        stack.fillStyle = '#ffffff';
        stack.globalAlpha = 1.0;
        stack.fillRect(0, 0, this.width, this.height);
        stack.restore();
    }
    updateScreen() {}
    keyTyped() { return false; }
    keyReleased() { return false; }
    mouseClicked() {}
    mouseReleased() {}
    mouseDragged() {}
}