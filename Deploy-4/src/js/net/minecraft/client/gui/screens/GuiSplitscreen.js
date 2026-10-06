import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import PlayerEntity from "../../entity/PlayerEntity.js";

export default class GuiSplitscreen extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.timer = 0;
    }

    init() {
        super.init();
        const centerX = this.width / 2;
        const s = this.minecraft.settings;
        
        this.btnMode = new GuiButton("Layout: " + (s.splitscreenMode === 'vertical' ? "Top-Bottom" : "Side-Side"), centerX - 100, this.height / 2 + 20, 200, 20, () => {
            s.splitscreenMode = s.splitscreenMode === 'vertical' ? 'horizontal' : 'vertical';
            this.btnMode.string = "Layout: " + (s.splitscreenMode === 'vertical' ? "Top-Bottom" : "Side-Side");
            s.save();
        });
        this.buttonList.push(this.btnMode);

        this.buttonList.push(new GuiButton("Cancel", centerX - 100, this.height - 35, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    updateScreen() {
        super.updateScreen();
        this.timer++;
        
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const mc = this.minecraft;

        // Check all gamepads for a button press to join
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (!gp || !gp.buttons) continue;
            
            let pressed = false;
            for (let b = 0; b < gp.buttons.length; b++) {
                if (gp.buttons[b].pressed) {
                    pressed = true;
                    break;
                }
            }

            if (pressed) {
                // If splitscreen isn't active, join this gamepad as P2
                if (!mc.player2) {
                    // Logic: If P1 was using this gamepad, we'll need to reassign.
                    // But for simplicity, we assume if you press a button here, you want P2 to be this gamepad.
                    this.startSplitscreen(i);
                    return;
                }
            }
        }
    }

    startSplitscreen(gamepadIndex) {
        const mc = this.minecraft;
        if (!mc.player2) {
            // Assign gamepad
            mc.p2GamepadIndex = gamepadIndex;
            
            // If P1 was using it, set P1 to keyboard only (-1) or another controller
            if (mc.p1GamepadIndex === gamepadIndex) {
                // Look for another available gamepad for P1
                const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
                let fallback = -1;
                for (let i = 0; i < gamepads.length; i++) {
                    if (gamepads[i] && i !== gamepadIndex) {
                        fallback = i;
                        break;
                    }
                }
                mc.p1GamepadIndex = fallback;
            }

            // Create second player
            mc.player2 = new PlayerEntity(mc, mc.world);
            mc.player2.username = "Player 2";
            // Spawn near player 1
            mc.player2.setPosition(mc.player.x + 1, mc.player.y, mc.player.z);
            mc.world.addEntity(mc.player2);
            
            mc.addMessageToChat("§aPlayer 2 joined using Controller " + (gamepadIndex + 1));
            mc.soundManager.playSound("random.levelup", mc.player.x, mc.player.y, mc.player.z, 1.0, 1.0);
        }
        
        mc.displayScreen(null);
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.drawCenteredString(stack, "Split-screen Setup", centerX, 30, 0xFFFFFF);
        
        // List connected devices
        let y = 60;
        this.drawString(stack, "Detected Input Devices:", centerX - 100, y, 0xFFFF55);
        y += 12;
        
        // Keyboard (Always assumed)
        this.drawString(stack, "- Keyboard & Mouse", centerX - 90, y, 0xAAAAAA);
        y += 10;

        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        let foundGamepad = false;
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (!gp) continue;
            foundGamepad = true;
            const name = gp.id.length > 25 ? gp.id.substring(0, 22) + "..." : gp.id;
            this.drawString(stack, `- Controller ${i+1}: ${name}`, centerX - 90, y, 0xAAAAAA);
            y += 10;
        }

        if (!foundGamepad) {
            this.drawString(stack, " (No controllers detected)", centerX - 90, y, 0xFF5555);
            y += 10;
        }

        // Instructions
        y = centerY - 15;
        this.drawCenteredString(stack, "To start split-screen:", centerX, y, 0xFFFFFF);
        y += 12;
        this.drawCenteredString(stack, "Press any button on a controller", centerX, y, 0x55FF55);
        y += 12;
        this.drawCenteredString(stack, "that is not Player 1.", centerX, y, 0x55FF55);

        if (this.minecraft.player2) {
            this.drawCenteredString(stack, "§eSplit-screen is already active!", centerX, centerY + 50, 0xFFFF55);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}