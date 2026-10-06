import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";
import GuiSwitchButton from "../widgets/GuiSwitchButton.js";

export default class GuiSoundSettings extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
    }

    init() {
        super.init();

        const s = this.minecraft.settings;
        const btnW = 150;
        const gap = 10;
        const centerX = this.width / 2;
        let y = 50;

        // Column 1
        this.buttonList.push(new GuiSliderButton("Master Volume", s.soundVolume, 0.0, 1.0, centerX - btnW - gap / 2, y, btnW, 20, val => {
            s.soundVolume = val;
        }, 0.01).setDisplayNameBuilder((n, v) => `${n}: ${Math.floor(v * 100)}%`));

        this.buttonList.push(new GuiSwitchButton("3D Audio", s.threeDAudio, centerX - btnW - gap / 2, y + 24, btnW, 20, val => {
            s.threeDAudio = val;
        }));

        this.buttonList.push(new GuiSliderButton("Music Volume", s.musicVolume, 0.0, 1.0, centerX - btnW - gap / 2, y + 48, btnW, 20, val => {
            s.musicVolume = val;
            this.minecraft.soundManager.updateVolumes();
        }, 0.01).setDisplayNameBuilder((n, v) => `${n}: ${Math.floor(v * 100)}%`));

        // Column 2
        this.buttonList.push(new GuiSliderButton("Mob Volume", s.mobVolume, 0.0, 1.0, centerX + gap / 2, y, btnW, 20, val => {
            s.mobVolume = val;
        }, 0.01).setDisplayNameBuilder((n, v) => `${n}: ${Math.floor(v * 100)}%`));

        this.buttonList.push(new GuiSliderButton("SFX Volume", s.sfxVolume, 0.0, 1.0, centerX + gap / 2, y + 24, btnW, 20, val => {
            s.sfxVolume = val;
        }, 0.01).setDisplayNameBuilder((n, v) => `${n}: ${Math.floor(v * 100)}%`));

        this.buttonList.push(new GuiButton("Music Settings...", centerX + gap / 2, y + 48, btnW, 20, () => {
            import("./GuiMusicSettings.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));

        // Done button
        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 40, 200, 20, () => {
            this.minecraft.settings.save();
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Music & Sounds", this.width / 2, 20);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}