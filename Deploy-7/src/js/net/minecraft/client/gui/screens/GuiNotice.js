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
        this.notice = "Welcome! Deploy 4 adds LAN co-producers, private camera feeds, world backups, and core gameplay fixes.";
        this.title = "Minecraft Websim Edition 1.04 - Deploy 4";
        this.sections = [
            {
                title: "LAN & Production",
                items: [
                    "Added co-producers for LAN worlds.",
                    "Owners can grant camera permissions.",
                    "Added camera feed visibility controls.",
                    "Added experimental Manage LAN.",
                    "Non-producers see hidden camera previews.",
                    "Added disabled streaming controls for guests."
                ]
            },
            {
                title: "Worlds & Saving",
                items: [
                    "Create Backup now exports a ZIP archive.",
                    "Backups use a Minecraft-like folder layout.",
                    "ZIP and legacy JSON imports are supported.",
                    "World chunks save as separate records.",
                    "Guest player data is saved on disconnect.",
                    "Rejoining restores player progress."
                ]
            },
            {
                title: "Gameplay & Quality of Life",
                items: [
                    "Added /cheats enable or disable.",
                    "Cheat-enabled worlds pause achievements.",
                    "LAN block drops sync immediately.",
                    "Fixed command-block animation sheets.",
                    "Added server refresh and re-ping controls.",
                    "Improved co-producer camera permissions."
                ]
            }
        ];
        this.footer = "Deploy 4: MineWatch is available at /watch/ after opening a world to LAN and starting a broadcast.";
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