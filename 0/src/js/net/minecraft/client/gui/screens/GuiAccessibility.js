import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";
import GuiSwitchButton from "../widgets/GuiSwitchButton.js";
import GuiChatSettings from "./GuiChatSettings.js";

export default class GuiAccessibility extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
    }

    init() {
        super.init();

        const s = this.minecraft.settings;
        const btnW = 150;
        const gap = 10;
        const leftX = this.width / 2 - btnW - gap / 2;
        const rightX = this.width / 2 + gap / 2;
        let yStart = 40;
        let rowH = 24;

        // --- Column 1 (Left) ---
        let ly = yStart;

        // Brightness
        this.buttonList.push(new GuiSliderButton("Brightness", s.brightness, 0.0, 1.0, leftX, ly, btnW, 20, val => {
            s.brightness = val;
            this.minecraft.worldRenderer.rebuildAll();
        }, 0.01).setDisplayNameBuilder((n, v) => {
            if (v === 0) return n + ": Moody";
            if (v === 1.0) return n + ": Bright";
            return n + ": +" + Math.floor(v * 100) + "%";
        }));
        ly += rowH;

        // Smooth Lighting
        this.buttonList.push(new GuiSwitchButton("Smooth Lighting", s.ambientOcclusion, leftX, ly, btnW, 20, value => {
            s.ambientOcclusion = value;
            this.minecraft.worldRenderer.rebuildAll();
        }));
        ly += rowH;

        // Chat Settings
        this.buttonList.push(new GuiButton("Chat Settings...", leftX, ly, btnW, 20, () => {
            this.minecraft.displayScreen(new GuiChatSettings(this));
        }));
        ly += rowH;

        // View Bobbing
        this.buttonList.push(new GuiSwitchButton("View Bobbing", s.viewBobbing, leftX, ly, btnW, 20, value => {
            s.viewBobbing = value;
        }));
        ly += rowH;

        // Optimized Leaves
        this.buttonList.push(new GuiSwitchButton("Fast Leaves", s.optimizedLeaves, leftX, ly, btnW, 20, val => {
            s.optimizedLeaves = val;
            this.minecraft.worldRenderer.rebuildAll();
        }));
        ly += rowH;

        // Render Distance
        this.buttonList.push(new GuiSliderButton("Render Distance", s.viewDistance, 2, 20, leftX, ly, btnW, 20, value => {
            s.viewDistance = value;
        }));
        ly += rowH;

        // Resolution Scale
        this.buttonList.push(new GuiSliderButton("Resolution Scale", s.resolutionScale, 0.25, 1.0, leftX, ly, btnW, 20, value => {
            s.resolutionScale = value;
            this.minecraft.window.updateWindowSize();
        }, 0.25).setDisplayNameBuilder((name, value) => name + ": " + Math.floor(value * 100) + "%"));
        ly += rowH;

        // --- Column 2 (Right) ---
        let ry = yStart;
        // Particles setting
        const particleNames = ["Minimal", "Normal", "Extra"];
        this.btnParticles = new GuiButton("Particles: " + particleNames[s.particles], rightX, ry, btnW, 20, () => {
            s.particles = (s.particles + 1) % 3;
            this.btnParticles.string = "Particles: " + particleNames[s.particles];
        });
        this.buttonList.push(this.btnParticles);
        ry += rowH;

        // Show Coordinates
        this.buttonList.push(new GuiSwitchButton("Coordinates", s.showCoordinates, rightX, ry, btnW, 20, val => {
            s.showCoordinates = val;
        }));
        ry += rowH;

        // Show FPS
        this.buttonList.push(new GuiSwitchButton("Show FPS", s.showFPS, rightX, ry, btnW, 20, val => {
            s.showFPS = val;
        }));
        ry += rowH;

        // Show Chunk Border
        this.buttonList.push(new GuiSwitchButton("Chunk Borders", s.showChunkBorders, rightX, ry, btnW, 20, val => {
            s.showChunkBorders = val;
        }));
        ry += rowH;

        // Show Hitboxes
        this.buttonList.push(new GuiSwitchButton("Hitboxes", s.showEntityHitboxes, rightX, ry, btnW, 20, val => {
            s.showEntityHitboxes = val;
        }));
        ry += rowH;

        // Fog Density
        this.buttonList.push(new GuiSliderButton("Fog Density", s.fogDensity, 0.0, 1.0, rightX, ry, btnW, 20, value => {
            s.fogDensity = value;
        }, 0.01).setDisplayNameBuilder((name, value) => name + ": " + Math.floor(value * 100) + "%"));
        ry += rowH;

        // Fullscreen Toggle
        this.btnFullscreen = new GuiButton("Fullscreen: " + (document.fullscreenElement ? "ON" : "OFF"), rightX, ry, btnW, 20, () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });
        this.buttonList.push(this.btnFullscreen);
        ry += rowH;

        // Done button centered at bottom
        this.buttonList.push(new GuiButton("Done", this.width / 2 - 100, this.height - 30, 200, 20, () => {
            this.minecraft.settings.save();
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    updateScreen() {
        super.updateScreen();
        // Dynamically update the fullscreen button text in case the user uses browser shortcuts (F11)
        if (this.btnFullscreen) {
            this.btnFullscreen.string = "Fullscreen: " + (document.fullscreenElement ? "ON" : "OFF");
        }
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Accessibility Settings", this.width / 2, 15);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}

