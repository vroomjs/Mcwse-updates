import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";

export default class GuiPairController extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.status = "Searching for controllers...";
        this.lastPressTime = 0;
        this.latencyHistory = [];
        this.avgLatency = 0;
        this.testActive = false;
        this.testPulse = 0;
        this.testStart = 0;
    }

    init() {
        super.init();
        const centerX = this.width / 2;
        
        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 30, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));

        this.btnTest = new GuiButton("Start Latency Test", centerX - 100, this.height / 2 + 20, 200, 20, () => {
            this.startTest();
        });
        this.buttonList.push(this.btnTest);
    }

    startTest() {
        this.testActive = true;
        this.latencyHistory = [];
        this.avgLatency = 0;
        this.btnTest.setEnabled(false);
        this.prepareNextPulse();
    }

    prepareNextPulse() {
        this.testPulse = Date.now() + 1000 + Math.random() * 2000;
        this.testStart = 0;
    }

    updateScreen() {
        super.updateScreen();
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0];

        if (!gp) {
            this.status = "No controller detected. Press any button!";
        } else {
            this.status = `Connected: ${gp.id.substring(0, 25)}...`;
            
            // Check for any button press for test
            if (this.testActive) {
                const now = Date.now();
                if (this.testStart === 0 && now >= this.testPulse) {
                    this.testStart = now;
                }

                let pressed = false;
                for (let b of gp.buttons) if (b.pressed) pressed = true;

                if (pressed && this.testStart > 0) {
                    const lat = now - this.testStart;
                    this.latencyHistory.push(lat);
                    
                    let sum = 0;
                    for (let l of this.latencyHistory) sum += l;
                    this.avgLatency = Math.round(sum / this.latencyHistory.length);

                    if (this.latencyHistory.length >= 5) {
                        this.testActive = false;
                        this.btnTest.setEnabled(true);
                        this.btnTest.string = "Restart Test";
                    } else {
                        this.prepareNextPulse();
                    }
                }
            }
        }
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Controller Pairing & Latency", this.width / 2, 20);
        
        this.drawCenteredString(stack, this.status, this.width / 2, 50, 0xAAAAAA);

        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Test UI
        this.drawRect(stack, centerX - 100, centerY - 40, centerX + 100, centerY + 10, "rgba(0,0,0,0.5)");
        
        if (this.testActive) {
            const now = Date.now();
            if (now >= this.testPulse) {
                this.drawCenteredString(stack, "PRESS ANY BUTTON!", centerX, centerY - 20, 0x55FF55);
            } else {
                this.drawCenteredString(stack, "Wait for it...", centerX, centerY - 20, 0xFFFF55);
            }
        } else if (this.latencyHistory.length > 0) {
            this.drawCenteredString(stack, `Average Input Lag: ${this.avgLatency}ms`, centerX, centerY - 25, 0xFFFFFF);
            let color = 0x55FF55;
            let rating = "Excellent (Low Lag)";
            if (this.avgLatency > 50) { color = 0xFFFF55; rating = "Good"; }
            if (this.avgLatency > 100) { color = 0xFF5555; rating = "High (Bluetooth Interference?)"; }
            this.drawCenteredString(stack, rating, centerX, centerY - 10, color);
        } else {
            this.drawCenteredString(stack, "Start test to check Bluetooth lag", centerX, centerY - 20, 0x808080);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}