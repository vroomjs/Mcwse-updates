import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";

export default class GuiControllerControls extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.listeningAction = null;
    }

    init() {
        super.init();
        const s = this.minecraft.settings;
        const binds = s.controllerBinds;
        
        let y = 30;
        const btnW = 140;
        const xL = this.width / 2 - btnW - 5;
        const xR = this.width / 2 + 5;

        // Settings
        this.buttonList.push(new GuiSliderButton("Deadzone", s.controllerDeadzone, 0.05, 0.5, xL, y, btnW, 20, val => {
            s.controllerDeadzone = val;
        }, 0.01).setDisplayNameBuilder((n, v) => `${n}: ${Math.floor(v * 100)}%`));

        this.buttonList.push(new GuiButton("Invert Y: " + (s.controllerInvertY ? "ON" : "OFF"), xR, y, btnW, 20, () => {
            s.controllerInvertY = !s.controllerInvertY;
            this.init();
        }));

        y += 24;

        this.buttonList.push(new GuiSliderButton("Cursor Speed", s.controllerCursorSpeed, 1.0, 15.0, xL, y, btnW, 20, val => {
            s.controllerCursorSpeed = val;
        }, 0.5).setDisplayNameBuilder((n, v) => `${n}: ${v.toFixed(1)}x`));

        y += 26;

        // Binds Grid
        const actions = Object.keys(binds);
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            const colX = (i % 2 === 0) ? xL : xR;
            const rowY = y + Math.floor(i / 2) * 24;

            const isListening = this.listeningAction === action;
            const btnText = isListening ? "> ? <" : `${this.formatName(action)}: ${this.getButtonName(binds[action])}`;

            this.buttonList.push(new GuiButton(btnText, colX, rowY, btnW, 20, () => {
                this.listeningAction = action;
                this.init();
            }));
        }

        this.buttonList.push(new GuiButton("Done", this.width / 2 - 100, this.height - 30, 200, 20, () => {
            this.minecraft.settings.save();
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    formatName(str) {
        return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    getButtonName(idx) {
        const names = [
            "A/Cross",     // 0
            "B/Circle",    // 1
            "X/Square",    // 2
            "Y/Triangle",  // 3
            "L1/LB",       // 4
            "R1/RB",       // 5
            "L2/LT",       // 6
            "R2/RT",       // 7
            "Back/Share",  // 8
            "Start/Menu",  // 9
            "L3/LS Click", // 10
            "R3/RS Click", // 11
            "D-Pad Up",    // 12
            "D-Pad Down",  // 13
            "D-Pad Left",  // 14
            "D-Pad Right", // 15
            "Home/PS"      // 16
        ];
        return names[idx] || `Button ${idx}`;
    }

    updateScreen() {
        super.updateScreen();
        if (this.listeningAction) {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            for (const gp of gamepads) {
                if (!gp) continue;
                for (let i = 0; i < gp.buttons.length; i++) {
                    if (gp.buttons[i].pressed) {
                        this.minecraft.settings.controllerBinds[this.listeningAction] = i;
                        this.listeningAction = null;
                        this.minecraft.soundManager.playSound("random.click", 0,0,0, 1, 1);
                        this.init();
                        return;
                    }
                }
            }
        }
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Controller Settings", this.width / 2, 10);
        if (this.listeningAction) {
            this.drawRect(stack, 0, 0, this.width, this.height, "rgba(0,0,0,0.5)");
            this.drawCenteredString(stack, "Press any button on controller...", this.width / 2, this.height / 2, 0xFFFF55);
        }
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}