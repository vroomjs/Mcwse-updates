import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiSwitchButton from "../widgets/GuiSwitchButton.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";
import GuiControls from "./GuiControls.js";
import GuiAccessibility from "./GuiAccessibility.js";
import GuiResourcePacks from "./GuiResourcePacks.js";

export default class GuiOptions extends GuiScreen {

    constructor(previousScreen) {
        super();

        this.previousScreen = previousScreen;
    }

    init() {
        super.init();

        let settings = this.minecraft.settings;

        const centerX = this.width / 2;
        const btnW = 150;
        const colGap = 10;
        
        let y = this.height / 4 - 15;

        const leftX = centerX - btnW - colGap / 2;
        const rightX = centerX + colGap / 2;

        // Top Row: FOV | Difficulty
        this.buttonList.push(new GuiSliderButton("FOV", settings.fov, 30, 110, leftX, y, btnW, 20, value => {
            settings.fov = value;
        }).setDisplayNameBuilder((name, value) => {
            if (value === 70) return name + ": Normal";
            if (value === 30) return name + ": Quake Pro";
            return name + ": " + Math.floor(value);
        }));

        const difficulties = ["Peaceful", "Easy", "Normal", "Hard"];
        this.buttonList.push(new GuiButton("Difficulty: " + difficulties[settings.difficulty], rightX, y, 130, 20, () => {
            settings.difficulty = (settings.difficulty + 1) % 4;
            this.init();
        }));
        // Dummy lock icon button next to difficulty
        this.buttonList.push(new GuiButton("", rightX + 130 + 2, y, 18, 20, () => {}).setEnabled(false));

        this.buttonList.push(new GuiSliderButton("LOD Distance", settings.lodRenderDistance, 32, 256, leftX, y + 24, btnW, 20, value => {
            settings.lodRenderDistance = value;
            if(this.minecraft.world)this.minecraft.world._lastCameraChunkX=NaN;
        }, 16).setDisplayNameBuilder((name,value)=>name+": "+Math.floor(value)+" blocks"));
        this.buttonList.push(new GuiSwitchButton("LOD Rendering", settings.lodRendering, rightX, y + 24, btnW, 20, value => {
            settings.lodRendering = value;
            if(this.minecraft.world)this.minecraft.world._lastCameraChunkX=NaN;
            this.minecraft.worldRenderer?.rebuildAll();
        }));

        y += 64; // Gap matching reference image

        // Middle Grid: 2 Columns
        // Col 1: Performance... (Replacing Skin Customization as requested)
        this.buttonList.push(new GuiButton("Performance...", leftX, y, btnW, 20, () => {
            import("./GuiPerformance.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));

        // Col 2: Music & Sounds...
        this.buttonList.push(new GuiButton("Music & Sounds...", rightX, y, btnW, 20, () => {
            import("./GuiSoundSettings.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));

        y += 24;

        // Col 1: Video Settings...
        this.buttonList.push(new GuiButton("Video Settings...", leftX, y, btnW, 20, () => {
            import("./GuiAccessibility.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));

        // Col 2: Controls...
        this.buttonList.push(new GuiButton("Controls...", rightX, y, btnW, 20, () => {
            this.minecraft.displayScreen(new GuiControls(this));
        }));

        y += 24;

        // Col 1: Mods... opens the full-screen local package library.
        this.buttonList.push(new GuiButton("Mods...", leftX, y, btnW, 20, () => {
            import("./GuiMods.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));

        // Col 2: Chat Settings...
        this.buttonList.push(new GuiButton("Chat Settings...", rightX, y, btnW, 20, () => {
            import("./GuiChatSettings.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));

        y += 24;

        // Col 1: Resource Packs...
        this.buttonList.push(new GuiButton("Resource Packs...", leftX, y, btnW, 20, () => {
            this.minecraft.displayScreen(new GuiResourcePacks(this));
        }));

        // Col 2: Skins (Moved here to keep accessible)
        this.buttonList.push(new GuiButton("Skins...", rightX, y, btnW, 20, () => {
            this.minecraft.displayScreen(new GuiSkins(this));
        }));

        // Done button centered at bottom
        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 35, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        // Use darker pixelated background for consistency and dim overlay
        this.drawDefaultBackground(stack);

        // Title - larger and centered
        this.drawCenteredString(stack, "Options", this.width / 2, 24);

        // Draw subtle subtitle line to match spacing from screenshot
        this.drawCenteredString(stack, "", this.width / 2, 36);

        // Render buttons (they have been positioned in init to form two columns)
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    onClose() {
        // Save settings
        this.minecraft.settings.save();
    }

}
