import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";
import SoundManager from "../../sound/SoundManager.js";
import MathHelper from "../../../util/MathHelper.js";

export default class GuiMusicSettings extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
    }

    init() {
        super.init();

        const s = this.minecraft.settings;
        const centerX = this.width / 2;
        const btnW = 200;
        let y = 40;

        // Music Delay Slider
        this.buttonList.push(new GuiSliderButton("Music Frequency", s.musicDelay, 0.1, 10.0, centerX - 100, y, btnW, 20, val => {
            s.musicDelay = val;
        }, 0.1).setDisplayNameBuilder((n, v) => `${n}: every ${v.toFixed(1)}m`));
        
        y += 30;

        // Track List
        const tracks = SoundManager.MUSIC_TRACKS;
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const enabled = s.enabledMusic[track.name];
            
            // Layout in two columns if many tracks, but for 7 a single column with scrolling or compact rows is fine
            const label = (enabled ? "§aPlay: " : "§cSkip: ") + track.name;
            const tx = centerX - 100;
            const ty = y + i * 22;

            this.buttonList.push(new GuiButton(label, tx, ty, btnW, 20, () => {
                s.enabledMusic[track.name] = !s.enabledMusic[track.name];
                this.init();
            }));
        }

        // Done button
        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 30, 200, 20, () => {
            this.minecraft.settings.save();
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Background Music Options", this.width / 2, 15);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}