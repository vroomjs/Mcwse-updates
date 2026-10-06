import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";

export default class GuiNotice extends GuiScreen {

    constructor(nextScreen, customMessage = null) {
        super();
        this.nextScreen = nextScreen;
        this.timer = 0; 

        if (customMessage) {
            this.mode = "message";
            this.message = customMessage;
            this.scrollOffset = 0;
            return;
        }

        this.mode = "patchnotes";
        this.notice = "Welcome! This update adds live broadcasting, production cameras, and long-session optimizations.";
        this.title = "Minecraft Websim Edition 1.02 - MineWatch Update";
        this.sections = [
            {
                title: "Broadcasting",
                items: [
                    "Added MineWatch live broadcasts.",
                    "Added Watch by Code and Browse.",
                    "Added viewer chat for streamers.",
                    "Added OBS-style Camera Studio.",
                    "Streams switch cameras without",
                    "disconnecting viewers.",
                    "Death and offline feeds now show",
                    "animated no-signal screens."
                ]
            },
            {
                title: "Cameras & Graphics",
                items: [
                    "Added static and cameraman sources.",
                    "Added in-world camera previews.",
                    "Inactive previews are clearly marked.",
                    "Cameras can switch back when rendered.",
                    "Missing cameramen fall back to POV.",
                    "Added /realism true or false.",
                    "Added /lod true or false and an",
                    "adjustable LOD distance in Options."
                ]
            },
            {
                title: "Performance & Fixes",
                items: [
                    "Gameplay chunks now have priority",
                    "over all broadcast camera renders.",
                    "Camera passes no longer load or",
                    "unload gameplay chunks.",
                    "Fixed long-session lag after exploring",
                    "many chunks by spatially indexing",
                    "signs, chests, and tile entities.",
                    "Improved camera preview refresh speed.",
                    "Improved source fallback and recovery."
                ]
            }
        ];
        this.footer = "MineWatch is available at /watch/ after opening a world to LAN and starting a broadcast.";
    }

    init() {
        super.init();
        
        this.btnContinue = new GuiButton("Continue", this.width / 2 - 100, this.height - 40, 200, 20, () => {
            this.minecraft.displayScreen(this.nextScreen);
        });
        
        this.btnContinue.setEnabled(true);
        this.buttonList.push(this.btnContinue);
    }

    updateScreen() {
        super.updateScreen();
        if (this.timer > 0) {
            this.timer--;
            // Update button label with remaining seconds
            this.btnContinue.string = `Continue (${Math.ceil(this.timer / 20)}s)`;
            
            if (this.timer <= 0) {
                this.btnContinue.setEnabled(true);
                this.btnContinue.string = "Continue";
            }
        }
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);

        if (this.mode === "message") {
            this.drawMessageScreen(stack);
        } else {
            this.drawPatchnotesScreen(stack);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    drawScaledCentered(stack, text, centerX, y, scale, color) {
        stack.save();
        stack.translate(centerX, y);
        stack.scale(scale, scale);
        this.minecraft.fontRenderer.drawString(stack, text, -this.getStringWidth(stack, text) / 2, 0, color);
        stack.restore();
    }

    drawPatchnotesScreen(stack) {
        const scale = 0.8;
        const lineH = Math.floor(10 * scale);

        let y = 28;
        this.drawScaledCentered(stack, this.notice, this.width / 2, y, scale, 0xFFFFFF);
        y += lineH * 3;

        this.drawScaledCentered(stack, this.title, this.width / 2, y, scale, 0xFFE347);
        y += lineH * 2;

        const colCount = this.sections.length;
        let maxColHeight = 0;

        for (let i = 0; i < colCount; i++) {
            const col = this.sections[i];
            const cx = this.width * (i + 0.5) / colCount;
            let cy = y;

            this.drawScaledCentered(stack, col.title, cx, cy, scale, 0x7FA8E0);
            cy += lineH;

            for (let k = 0; k < col.items.length; k++) {
                this.drawScaledCentered(stack, col.items[k], cx, cy, scale, 0xFFFFFF);
                cy += lineH;
            }

            maxColHeight = Math.max(maxColHeight, cy - y);
        }

        this.drawScaledCentered(stack, this.footer, this.width / 2, y + maxColHeight + lineH, scale, 0xAAAAAA);
    }

    drawMessageScreen(stack) {
        const lineHeight = 12;
        const totalHeight = this.message.length * lineHeight;
        const topBound = (this.height / 2) - (totalHeight / 2) - 25;
        const bottomBound = this.height - 55;
        const maxScroll = Math.max(0, topBound + totalHeight - bottomBound);
        this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset));

        for (let i = 0; i < this.message.length; i++) {
            const y = topBound + i * lineHeight - this.scrollOffset;
            if (y > 35 && y < bottomBound) {
                this.drawCenteredString(stack, this.message[i], this.width / 2, y, 0xFFFFFF);
            }
        }
    }

    handleMouseScroll(delta) {
        if (this.mode !== "message") return;
        const lineHeight = 12;
        const topBound = (this.height / 2) - ((this.message.length * lineHeight) / 2) - 25;
        const bottomBound = this.height - 55;
        const maxScroll = Math.max(0, topBound + (this.message.length * lineHeight) - bottomBound);
        this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset - delta * 20));
    }
}