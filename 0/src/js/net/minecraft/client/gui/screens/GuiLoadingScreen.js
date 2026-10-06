import GuiScreen from "../GuiScreen.js";

export default class GuiLoadingScreen extends GuiScreen {

    constructor() {
        super();
        this.isSaving = false;
        this.progress = 0;
        this.displayProgress = 0;
        this.title = "Loading...";
    }

    init() {
        super.init();
    }

    // Terrain generation and queued chunk loading happen in the normal game
    // tick. Treat the loading screen as non-pausing so a new world can finish
    // loading instead of remaining stuck on its first spawn chunk.
    doesGuiPauseGame() {
        return false;
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        // Ease the visual fill so chunk generation feels continuous even
        // when the actual loaded-chunk count advances in bursts.
        const targetProgress = Math.max(0, Math.min(1, Number(this.progress) || 0));
        this.displayProgress += (targetProgress - this.displayProgress) * 0.24;
        if (targetProgress >= 0.999) this.displayProgress = 1;

        // Check if we have an end background
        let bg = this.textureBackground;
        let scale = 2;
        if (this.title === "Entering Dimension..." || this.title === "Generating terrain...") {
            let endTex = this.minecraft.resources["../../endstuff.png"];
            if (endTex) {
                // If it's a dimension transition, use the swirling End texture (index 0)
                this.drawEndBackground(stack, endTex, this.width, this.height);
            } else {
                this.drawBackground(stack, bg, this.width, this.height, scale);
            }
        } else {
            this.drawBackground(stack, bg, this.width, this.height, scale);
        }

        // App Logo
        let logo = this.minecraft.resources["../../projectlogo.png"];
        if (logo) {
            const logoSize = 32;
            this.drawSprite(stack, logo, 0, 0, logo.width || 32, logo.height || 32, this.width / 2 - logoSize / 2, this.height / 2 - 60, logoSize, logoSize);
        }

        // Render title
        this.drawCenteredString(stack, this.title, this.width / 2, this.height / 2 - 20);

        if (!this.isSaving) {
            let progressWidth = 180;
            let progressHeight = 8;
            let left = this.width / 2 - progressWidth / 2;
            let top = this.height / 2 + 2;

            // Render a visible, bordered progress bar.
            this.drawRect(stack, left - 2, top - 2, left + progressWidth + 2, top + progressHeight + 2, '#202020');
            this.drawRect(stack, left, top, left + progressWidth, top + progressHeight, '#808080');

            this.drawRect(stack, left, top, left + progressWidth * this.displayProgress, top + progressHeight, '#80ff80');
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    drawEndBackground(stack, texture, width, height) {
        // Draw tiled end.png (Index 0 of endstuff.png)
        stack.save();
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 16; patternCanvas.height = 16;
        const pctx = patternCanvas.getContext('2d');
        pctx.drawImage(texture, 0, 0, 16, 16, 0, 0, 16, 16);
        const pattern = stack.createPattern(patternCanvas, "repeat");
        stack.scale(4, 4);
        stack.fillStyle = pattern;
        stack.fillRect(0, 0, width/4, height/4);
        stack.fillStyle = "rgba(0, 0, 0, 0.7)";
        stack.fillRect(0, 0, width/4, height/4);
        stack.restore();
    }

    setTitle(title) {
        this.title = title; // espera string em português também ("Gerando terreno...")
    }

    setProgress(progress) {
        progress = Math.max(0, Math.min(1, Number(progress) || 0));
        if (this.isSaving) {
            // Always update progress for saving, even if it appears to go backwards (chunk processing may vary)
            this.progress = progress;
        } else {
            // For loading, only increase progress
            if (progress < this.progress) {
                return;
            }
            this.progress = progress;
        }
    }

    keyTyped(key) {
        // Cancel key inputs
    }
}
