import GuiScreen from "../GuiScreen.js";
import GuiKeyButton from "../widgets/GuiKeyButton.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";

export default class GuiControls extends GuiScreen {

    constructor(previousScreen) {
        super();

        this.previousScreen = previousScreen;
    }

    init() {
        super.init();

        let settings = this.minecraft.settings;
        
        const startY = 40;
        const btnH = 20;
        const btnW = 150;
        const pad = 4;
        const colGap = 10;
        
        const leftX = this.width / 2 - btnW - colGap / 2;
        const rightX = this.width / 2 + colGap / 2;

        // Column 1
        this.buttonList.push(new GuiKeyButton("Forward", settings.forward, leftX, startY + (btnH + pad) * 0, btnW, btnH, key => settings.forward = key));
        this.buttonList.push(new GuiKeyButton("Left", settings.left, leftX, startY + (btnH + pad) * 1, btnW, btnH, key => settings.left = key));
        this.buttonList.push(new GuiKeyButton("Back", settings.back, leftX, startY + (btnH + pad) * 2, btnW, btnH, key => settings.back = key));
        this.buttonList.push(new GuiKeyButton("Right", settings.right, leftX, startY + (btnH + pad) * 3, btnW, btnH, key => settings.right = key));
        this.buttonList.push(new GuiKeyButton("Jump", settings.jump, leftX, startY + (btnH + pad) * 4, btnW, btnH, key => settings.jump = key));
        this.buttonList.push(new GuiKeyButton("Sneak", settings.crouching, leftX, startY + (btnH + pad) * 5, btnW, btnH, key => settings.crouching = key));

        // Column 2
        this.buttonList.push(new GuiSliderButton("Sensitivity", settings.sensitivity, 10, 200, rightX, startY + (btnH + pad) * 0 - 2, btnW, 20, value => {
            settings.sensitivity = value;
        }).setDisplayNameBuilder((name, value) => name + ": " + Math.floor(value) + "%"));
        
        this.buttonList.push(new GuiKeyButton("Sprint", settings.sprinting, rightX, startY + (btnH + pad) * 1, btnW, btnH, key => settings.sprinting = key));
        this.buttonList.push(new GuiKeyButton("Inventory", settings.inventory, rightX, startY + (btnH + pad) * 2, btnW, btnH, key => settings.inventory = key));
        this.buttonList.push(new GuiKeyButton("Drop", settings.drop, rightX, startY + (btnH + pad) * 3, btnW, btnH, key => settings.drop = key));
        this.buttonList.push(new GuiKeyButton("Chat", settings.chat, rightX, startY + (btnH + pad) * 4, btnW, btnH, key => settings.chat = key));
        this.buttonList.push(new GuiKeyButton("Command", settings.command, rightX, startY + (btnH + pad) * 5, btnW, btnH, key => settings.command = key));
        this.buttonList.push(new GuiKeyButton("Perspective", settings.togglePerspective, rightX, startY + (btnH + pad) * 6, btnW, btnH, key => settings.togglePerspective = key));

        this.buttonList.push(new GuiButton("Controller Settings...", this.width / 2 - 100, this.height - 78, 98, 20, () => {
            import("./GuiControllerControls.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));

        this.buttonList.push(new GuiButton("Pair Controller...", this.width / 2 + 2, this.height - 78, 98, 20, () => {
            import("./GuiPairController.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));

        this.buttonList.push(new GuiButton("Reset Binds", this.width / 2 - 100, this.height - 54, 98, 20, () => {
            this.minecraft.settings.reset();
            this.init(); // Refresh UI
        }));

        this.buttonList.push(new GuiButton("Done", this.width / 2 + 2, this.height - 54, 98, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        // Background
        this.drawDefaultBackground(stack);

        // Title
        this.drawCenteredString(stack, "Controls", this.width / 2, 20);

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    onClose() {
        // Save settings
        this.minecraft.settings.save();
    }

}