import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import MathHelper from "../../../util/MathHelper.js";

export default class GuiResourcePackLoading extends GuiScreen {

    constructor(previousScreen, packName) {
        super();
        this.previousScreen = previousScreen;
        this.packName = packName;
        this.progress = 0;
        this.statusMessage = "Initializing...";
        this.logs = [];
        this.finished = false;
        this.error = null;
    }

    init() {
        super.init();
        const centerX = this.width / 2;
        
        if (this.finished || this.error) {
            this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 40, 200, 20, () => {
                this.minecraft.displayScreen(this.previousScreen);
            }));
        }
    }

    updateProgress(progress, message) {
        this.progress = progress;
        if (message) {
            this.statusMessage = message;
            this.logs.push(message);
            if (this.logs.length > 15) this.logs.shift();
        }
    }

    setFinished() {
        this.finished = true;
        this.statusMessage = "Successfully applied pack: " + this.packName;
        this.progress = 1.0;
        this.init();
    }

    setError(err) {
        this.error = err;
        this.statusMessage = "§cFailed to apply pack: " + err;
        this.init();
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.drawCenteredString(stack, "Applying Resource Pack", centerX, 20, 0xFFFF55);
        this.drawCenteredString(stack, this.packName, centerX, 32, 0xFFFFFF);

        // Progress Bar
        const barW = 200;
        const barH = 2;
        const bx = centerX - barW / 2;
        const by = centerY - 40;

        this.drawRect(stack, bx, by, bx + barW, by + barH, "#555555");
        this.drawRect(stack, bx, by, bx + (barW * this.progress), by + barH, "#55FF55");

        this.drawCenteredString(stack, this.statusMessage, centerX, by + 10, this.error ? 0xFF5555 : 0xAAAAAA);

        // Logs
        const logX = bx;
        let logY = by + 25;
        for (let i = 0; i < this.logs.length; i++) {
            const alpha = Math.floor(255 * (i / this.logs.length));
            this.drawStringNoShadow(stack, "> " + this.logs[i], logX, logY + i * 10, 0x808080 + (alpha << 24));
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}