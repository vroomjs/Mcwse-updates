import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiMainMenu from "./GuiMainMenu.js";

export default class GuiTextureMode extends GuiScreen {
    init() {
        super.init();
        const y = this.height / 2 - 20;
        this.buttonList.push(new GuiButton("Normal Textures", this.width / 2 - 100, y, 200, 20, () => {
            this.minecraft.settings.lowQualityTextures = false;
            this.minecraft.settings.textureChoiceMade = true;
            this.minecraft.settings.save();
            if (typeof this.minecraft.refreshTextures === 'function') this.minecraft.refreshTextures();
            this.minecraft.displayScreen(new GuiMainMenu());
        }));
        this.buttonList.push(new GuiButton("Low Textures (Performance)", this.width / 2 - 100, y + 28, 200, 20, () => {
            // enable low mode and apply performance-friendly defaults
            const s = this.minecraft.settings;
            s.lowQualityTextures = true;
            s.viewBobbing = false;
            s.viewDistance = Math.max(2, Math.min(6, s.viewDistance));
            s.chunkLoad = 1;
            s.textureChoiceMade = true;
            s.save();
            if (typeof this.minecraft.refreshTextures === 'function') this.minecraft.refreshTextures();
            this.minecraft.displayScreen(new GuiMainMenu());
        }));
    }
    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Choose Texture Mode", this.width / 2, this.height / 2 - 56);
        this.drawCenteredString(stack, "Low mode optimizes visuals and world for smoother performance.", this.width / 2, this.height / 2 - 40);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
} 