import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";
import GuiSwitchButton from "../widgets/GuiSwitchButton.js";

export default class GuiChatSettings extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.colors = [
            {name: "White", val: 0xFFFFFF},
            {name: "Red", val: 0xFF5555},
            {name: "Green", val: 0x55FF55},
            {name: "Blue", val: 0x5555FF},
            {name: "Yellow", val: 0xFFFF55},
            {name: "Aqua", val: 0x55FFFF},
            {name: "Pink", val: 0xFF55FF},
            {name: "Gray", val: 0xAAAAAA}
        ];
    }

    init() {
        super.init();
        const s = this.minecraft.settings;
        let y = 40;
        const btnW = 200;
        const x = this.width / 2 - btnW / 2;

        // Opacity Slider (Background)
        this.buttonList.push(new GuiSliderButton("Background Opacity", s.chatOpacity, 0.0, 1.0, x, y, btnW, 20, val => {
            s.chatOpacity = val;
        }, 0.01).setDisplayNameBuilder((n, v) => `${n}: ${Math.floor(v * 100)}%`));
        y += 24;

        // Text Opacity Slider
        this.buttonList.push(new GuiSliderButton("Text Opacity", s.chatTextOpacity, 0.1, 1.0, x, y, btnW, 20, val => {
            s.chatTextOpacity = val;
        }, 0.01).setDisplayNameBuilder((n, v) => `${n}: ${Math.floor(v * 100)}%`));
        y += 24;

        // Fade Speed
        this.buttonList.push(new GuiSliderButton("Chat Hiding Time", s.chatFadeSpeed, 1.0, 15.0, x, y, btnW, 20, val => {
            s.chatFadeSpeed = val;
        }, 0.5).setDisplayNameBuilder((n, v) => n + ": " + v.toFixed(1) + "s"));
        y += 24;

        // Name Color
        this.btnNameColor = new GuiButton("Name Color: " + this.colors[s.chatNameColor].name, x, y, btnW, 20, () => {
            s.chatNameColor = (s.chatNameColor + 1) % this.colors.length;
            this.btnNameColor.string = "Name Color: " + this.colors[s.chatNameColor].name;
        });
        this.buttonList.push(this.btnNameColor);
        y += 24;

        // Message Color
        this.btnMsgColor = new GuiButton("Message Color: " + this.colors[s.chatMessageColor].name, x, y, btnW, 20, () => {
            s.chatMessageColor = (s.chatMessageColor + 1) % this.colors.length;
            this.btnMsgColor.string = "Message Color: " + this.colors[s.chatMessageColor].name;
        });
        this.buttonList.push(this.btnMsgColor);
        y += 24;

        this.buttonList.push(new GuiButton("Done", x, this.height - 30, btnW, 20, () => {
            this.minecraft.settings.save();
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Chat Settings", this.width / 2, 15);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}


