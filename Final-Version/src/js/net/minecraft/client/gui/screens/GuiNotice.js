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
        this.notice = "Welcome! This deploy adds reliable multiplayer world rejoining and expanded broadcast camera controls.";
        this.title = "Minecraft Websim Edition 1.07 - Deploy 7.2";
        this.sections = [
            {
                title: "Multiplayer World Sync",
                items: [
                    "Host-authoritative multiplayer world state.",
                    "Placed blocks remain visible after clients rejoin.",
                    "Broken blocks persist as explicit air entries.",
                    "World diffs apply after terrain generation.",
                    "Persistent player UUIDs survive PeerJS reconnects.",
                    "Host restores player position, inventory, armor, and gamemode.",
                    "Single-player saves and client preferences remain separate."
                ]
            },
            {
                title: "Broadcast Cameras",
                items: [
                    "Added Static, Chase, Player POV, and Cameraman sources.",
                    "Chase cameras keep the target player in frame.",
                    "Chase camera distance, height, smoothness, FOV, yaw, pitch, and roll are editable.",
                    "Camera properties support experimental buttons and sliders.",
                    "Camera placement includes a live bottom-right camera preview.",
                    "Placement preview is removed after placing or cancelling."
                ]
            },
            {
                title: "Interface & Reliability",
                items: [
                    "Improved camera source and properties interfaces.",
                    "Added experimental Camera Studio and Camera Settings entry points.",
                    "Fixed camera property text fields and slider labels.",
                    "Preserved existing PeerJS multiplayer and broadcast behavior.",
                    "Kept camera IDs and existing static camera compatibility."
                ]
            }
        ];
        this.footer = "Deploy 7.2: Host a LAN world to test authoritative rejoining and open Camera Studio to test the camera placement preview.";
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