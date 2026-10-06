export default class ScreenRenderer {

    constructor(minecraft, window) {
        this.minecraft = minecraft;
        this.window = window;
    }

    initialize() {
        this.resolution = this.minecraft.isInGame() ? 1 : this.minecraft.window.scaleFactor;

        // Update canvas sizes
        this.window.canvas2d.width = this.window.width * this.resolution;
        this.window.canvas2d.height = this.window.height * this.resolution;
        this.window.canvasCounts.width = this.window.width * this.resolution;
        this.window.canvasCounts.height = this.window.height * this.resolution;

        // Get context stacks
        this.stack2d = this.window.canvas2d.getContext('2d');
        this.stackCounts = this.window.canvasCounts.getContext('2d');
        
        [this.stack2d, this.stackCounts].forEach(ctx => {
            ctx.webkitImageSmoothingEnabled = false;
            ctx.mozImageSmoothingEnabled = false;
            ctx.imageSmoothingEnabled = false;
        });
    }

    render(partialTicks) {
        let mouseX = this.minecraft.window.mouseX;
        let mouseY = this.minecraft.window.mouseY;

        // Clear canvases using physical pixel dimensions
        this.stack2d.clearRect(0, 0, this.window.width * this.resolution, this.window.height * this.resolution);
        this.stackCounts.clearRect(0, 0, this.window.width * this.resolution, this.window.height * this.resolution);

        // Prepare context for GUI
        this.stack2d.save();
        this.stack2d.scale(this.resolution, this.resolution);

        // Prepare context for Item Counts (separate layer)
        this.stackCounts.save();
        this.stackCounts.scale(this.resolution, this.resolution);

        const mc = this.minecraft;
        const width = this.window.width;
        const height = this.window.height;

        try {
            if (mc.isInGame() && mc.loadingScreen === null) {
                if (mc.player2) {
                    const mode = mc.settings.splitscreenMode;
                    const isVert = mode === 'vertical';

                    const renderForPlayer = (player, offX, offY, w, h) => {
                        this.stack2d.save();
                        this.stack2d.translate(offX, offY);
                        this.stackCounts.save();
                        this.stackCounts.translate(offX, offY);

                        mc.ingameOverlay.render(this.stack2d, mouseX - offX, mouseY - offY, partialTicks, player, w, h);
                        mc.ingameOverlay.renderCounts(this.stackCounts, mouseX - offX, mouseY - offY, partialTicks, player, w, h);

                        this.stack2d.restore();
                        this.stackCounts.restore();
                    };

                    if (isVert) {
                        renderForPlayer(mc.player, 0, 0, width, height / 2);
                        renderForPlayer(mc.player2, 0, height / 2, width, height / 2);
                    } else {
                        renderForPlayer(mc.player, 0, 0, width / 2, height);
                        renderForPlayer(mc.player2, width / 2, 0, width / 2, height);
                    }
                } else {
                    mc.ingameOverlay.render(this.stack2d, mouseX, mouseY, partialTicks);
                    mc.ingameOverlay.renderCounts(this.stackCounts, mouseX, mouseY, partialTicks);
                }
            }

            const renderMenu = (screen, offX, offY, w, h) => {
                if (!screen) return;
                this.stack2d.save();
                this.stack2d.translate(offX, offY);
                this.stackCounts.save();
                this.stackCounts.translate(offX, offY);

                // Ensure screen dimensions are correct for this specific player's screen half
                if (screen.width !== w || screen.height !== h) {
                    screen.width = w; screen.height = h;
                }

                screen.drawScreen(this.stack2d, mouseX - offX, mouseY - offY, partialTicks);
                if (typeof screen.drawForeground === 'function') {
                    screen.drawForeground(this.stackCounts, mouseX - offX, mouseY - offY, partialTicks);
                }

                this.stack2d.restore();
                this.stackCounts.restore();
            };

            if (mc.player2) {
                const mode = mc.settings.splitscreenMode;
                const isVert = mode === 'vertical';
                if (isVert) {
                    renderMenu(mc.currentScreen, 0, 0, width, height / 2);
                    renderMenu(mc.currentScreen2, 0, height / 2, width, height / 2);
                } else {
                    renderMenu(mc.currentScreen, 0, 0, width / 2, height);
                    renderMenu(mc.currentScreen2, width / 2, 0, width / 2, height);
                }
            } else {
                renderMenu(mc.currentScreen, 0, 0, width, height);
            }

            if ((mc.currentScreen || mc.currentScreen2) && mc.usingControllerCursor) {
                this.drawControllerCursor(this.stackCounts, mouseX, mouseY);
            }

            // Render 3D items AFTER screens have queued them for the current frame
            if ((this.minecraft.isInGame() || this.minecraft.currentScreen !== null) && this.minecraft.loadingScreen === null) {
                this.minecraft.itemRenderer.render(partialTicks);
            }
        } catch (e) {
            console.error(e);
        }

        this.stack2d.restore();
        this.stackCounts.restore();
    }

    drawControllerCursor(stack, x, y) {
        // Simple pixel-art cursor rendering
        const size = 12;
        const colorBorder = "#FFFFFF";
        const colorFill = "#000000";

        stack.save();
        stack.translate(x, y);
        
        // Drop shadow / Outer border
        stack.fillStyle = "rgba(0,0,0,0.3)";
        stack.beginPath();
        stack.moveTo(1, 1);
        stack.lineTo(1, size + 1);
        stack.lineTo(size * 0.7 + 1, size * 0.7 + 1);
        stack.closePath();
        stack.fill();

        // Main White Border
        stack.fillStyle = colorBorder;
        stack.beginPath();
        stack.moveTo(0, 0);
        stack.lineTo(0, size);
        stack.lineTo(size * 0.7, size * 0.7);
        stack.closePath();
        stack.fill();

        // Inner Black Fill
        stack.fillStyle = colorFill;
        stack.beginPath();
        stack.moveTo(1.5, 2.5);
        stack.lineTo(1.5, size - 3.5);
        stack.lineTo(size * 0.5 - 0.5, size * 0.5 - 0.5);
        stack.closePath();
        stack.fill();

        stack.restore();
    }

    reset() {
        this.stack2d.clearRect(0, 0, this.window.width * this.resolution, this.window.height * this.resolution);
        this.stackCounts.clearRect(0, 0, this.window.width * this.resolution, this.window.height * this.resolution);
    }

}