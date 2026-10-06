import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiToggleSwitch from "../widgets/GuiToggleSwitch.js";
import GuiOptions from "./GuiOptions.js";
import * as THREE from "three";
import {BackSide} from "three";
import MathHelper from "../../../util/MathHelper.js";
import Minecraft from "../../Minecraft.js";
import GuiSelectWorld from "./GuiSelectWorld.js";
import GuiWhiteScreen from "./GuiWhiteScreen.js";
import GuiSkins from "./GuiSkins.js";
import GuiMultiplayer from "./GuiMultiplayer.js";
import GuiAchievements from "./GuiAchievements.js";

export default class GuiMainMenu extends GuiScreen {

    static VERSION_TEXT = "Minecraft Websim Edition - 1.01";

    static SPLASHES = [
        "Minecraft WSE is free!",
        "Beta!!",
        "Now in 3D!",
        "Wario <3 ez!",
        "Larger than Earth!",
        "Ride a pig.. or dont.",
        "Technically good!",
        "Not on Steam!",
        "Don't sue plz",
        "Skybox certfied!",
        "NO Warden.",
        "Ride pig I want!"
    ];

    constructor() {
        super();

        this.panoramaTimer = 0;
        this.splashText = "";

        // New: pulse timer and amplitude for splash scaling
        this._splashPulseTimer = 0;
        this._splashPulseSpeed = 0.06; // radians per tick
        this._splashPulseAmplitude = 0.06; // scale variation (±)
    }

    init() {
        super.init();
        this.textureLogo = this.getTexture("../../minecraftwebsimedition.png");

        // Pick a random splash if not already set or whenever we return to menu
        this.splashText = GuiMainMenu.SPLASHES[Math.floor(Math.random() * GuiMainMenu.SPLASHES.length)];

        const isCompact = this.height < 300;
        const rowH = isCompact ? 22 : 24;
        let y = this.height / 4 + (isCompact ? 35 : 48);

        this.buttonList.push(new GuiButton("Play (Singleplayer)", this.width / 2 - 100, y, 200, 20, () => {
            this.minecraft.displayScreen(new GuiSelectWorld(this));
        }));
        this.buttonList.push(new GuiButton("Multiplayer", this.width / 2 - 100, y + rowH, 200, 20, () => {
            this.minecraft.displayScreen(new GuiMultiplayer(this));
        }));
        this.buttonList.push(new GuiButton("Statistics", this.width / 2 - 100, y + rowH * 2, 200, 20, () => {
            import("./GuiStats.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));
        this.buttonList.push(new GuiButton("Skin", this.width / 2 - 100, y + rowH * 3, 200, 20, () => {
             this.minecraft.displayScreen(new GuiSkins(this));
        }));
        this.buttonList.push(new GuiButton("Advancements", this.width / 2 - 100, y + rowH * 4, 200, 20, () => {
            import("./GuiAchievements.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));
        
        this.buttonList.push(new GuiButton("Options...", this.width / 2 - 100, y + rowH * 5, 98, 20, () => {
            this.minecraft.displayScreen(new GuiOptions(this));
        }));
        this.buttonList.push(new GuiButton("Exit", this.width / 2 + 2, y + rowH * 5, 98, 20, () => {
            this.minecraft.displayScreen(new GuiWhiteScreen());
        }));

        // Top-right Blog button
        const blogBtnW = 60;
        this.buttonList.push(new GuiButton("Blog", this.width - blogBtnW - 5, 5, blogBtnW, 20, () => {
            this.minecraft.window.openUrl("https://websim.com/@Ai_guy/minecraftblog", true);
        }));

        // Lightweight broadcast viewer. Use a relative URL so static hosting
        // under a subdirectory still opens this project's watch page.
        const streamsBtnW = 80;
        const streamsX = this.width - streamsBtnW - 5;
        this.buttonList.push(new GuiButton("Streams", streamsX, this.height - 25, streamsBtnW, 20, () => {
            const watchUrl = new URL("watch/", window.location.href).href;
            window.open(watchUrl, "_blank", "noopener,noreferrer");
        }));

        // MCWSE Preview switch, sharing the Streams button's row.
        const settings = this.minecraft.settings;
        const previewLabel = "MCWSE Preview";
        const previewW = GuiToggleSwitch.widthFor(this.minecraft, previewLabel);
        // Sit on the Streams row when it fits, otherwise hop to the row above so
        // the switch never lands on the bottom-left version string.
        const versionRight = 2 + this.minecraft.fontRenderer.getStringWidth(GuiMainMenu.VERSION_TEXT) + 6;
        let previewX = streamsX - 8 - previewW;
        let previewY = this.height - 25 + Math.floor((20 - GuiToggleSwitch.SWITCH_H) / 2);
        if (previewX < versionRight) {
            previewX = this.width - 5 - previewW;
            previewY = this.height - 25 - GuiToggleSwitch.SWITCH_H - 4;
        }
        this.buttonList.push(new GuiToggleSwitch(
            previewLabel, previewX, previewY, previewW,
            () => !!settings.mcwsePreview,
            (next) => { settings.mcwsePreview = next; settings.save(); }
        ));

        // Remove panorama renderer: use normal GUI background instead
        // this.initPanoramaRenderer();
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        let logoWidth = 274;
        let x = this.width / 2 - logoWidth / 2;
        let y = 30;

        // Draw standard GUI background instead of panorama
        this.drawDefaultBackground(stack);
 
        // Draw logo
        this.drawLogo(stack, x, y);

        // Draw splash text
        this.drawSplash(stack);
 
        // versão e link do GitHub removidos conforme solicitado
 
        // Draw buttons
        super.drawScreen(stack, mouseX, mouseY, partialTicks);

        // Draw version info
        this.drawString(stack, GuiMainMenu.VERSION_TEXT, 2, this.height - 10, 0xFFFFFF);
    }

    updateScreen() {
        // main menu has no panorama; keep update empty

        // Advance splash pulse timer
        this._splashPulseTimer += this._splashPulseSpeed;
    }

    drawLogo(stack, x, y) {
        if (!this.textureLogo) return;
        const logoWidth = 274;
        const logoHeight = (this.textureLogo.height / this.textureLogo.width) * logoWidth;
        this.drawSprite(stack, this.textureLogo, 0, 0, this.textureLogo.width, this.textureLogo.height, x, y - 10, logoWidth, logoHeight);
    }

    drawSplash(stack) {
        // Draw a simple centered splash text to avoid rotated/blurred sprite artifacts.
        if (!this.splashText || this.splashText.length === 0) return;

        // Use the game's font renderer for crisp text and consistent styling.
        // The splash text centers itself on the right side of the logo.
        const centerX = this.width / 2 + 95;
        const centerY = 65;

        // Compute pulsing scale from timer (sinusoidal)
        const baseScale = 1.0;
        const pulse = Math.sin(this._splashPulseTimer) * this._splashPulseAmplitude;
        const scale = baseScale + pulse;

        // Save, translate to center, apply scale/rotation, draw text then restore
        stack.save();
        stack.translate(centerX, centerY);
        // Rotate -20 degrees to match classic style
        stack.rotate(MathHelper.toRadians(-20));
        stack.scale(scale, scale);
        
        // Use drawCenteredString at origin; it handles the drop-shadow internally.
        this.drawCenteredString(stack, this.splashText, 0, 0, 0xFFFF00);
        stack.restore();
    }

    keyTyped(key) {
        // Cancel key inputs
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }

    initPanoramaRenderer() {
        this.scene = new THREE.Scene();

        // Create cube
        let geometry = new THREE.BoxBufferGeometry(1, 1, 1);
        let materials = [
            new THREE.MeshBasicMaterial({
                side: BackSide,
                map: this.minecraft.getThreeTexture("gui/title/background/panorama_1.png")
            }),
            new THREE.MeshBasicMaterial({
                side: BackSide,
                map: this.minecraft.getThreeTexture("gui/title/background/panorama_3.png")
            }),
            new THREE.MeshBasicMaterial({
                side: BackSide,
                map: this.minecraft.getThreeTexture("gui/title/background/panorama_4.png")
            }),
            new THREE.MeshBasicMaterial({
                side: BackSide,
                map: this.minecraft.getThreeTexture("gui/title/background/panorama_5.png")
            }),
            new THREE.MeshBasicMaterial({
                side: BackSide,
                map: this.minecraft.getThreeTexture("gui/title/background/panorama_0.png")
            }),
            new THREE.MeshBasicMaterial({
                side: BackSide,
                map: this.minecraft.getThreeTexture("gui/title/background/panorama_2.png")
            })
        ];

        // Ensure textures don't repeat/tile and use proper filtering for pixel art
        materials.forEach(material => {
            if (material.map) {
                material.map.wrapS = THREE.ClampToEdgeWrapping;
                material.map.wrapT = THREE.ClampToEdgeWrapping;
                material.map.repeat.set(1, 1);
                material.map.needsUpdate = true;
                material.map.minFilter = THREE.LinearFilter;
                material.map.magFilter = THREE.LinearFilter;
            }
            material.side = BackSide;
        });

        let cube = new THREE.Mesh(geometry, materials);
        cube.scale.set(-1, -1, -1);
        this.scene.add(cube);

        this.camera = new THREE.PerspectiveCamera(120, 1, 0.1, 1);
        this.camera.rotation.order = 'ZYX';

        // Apply blur
        this.minecraft.window.canvas2d.style.backdropFilter = "blur(10px)";

        // Ensure the panorama renderer's canvas has the correct size immediately so the panorama is visible
        try {
            if (this.minecraft && this.minecraft.worldRenderer && this.minecraft.window) {
                const pixelW = Math.max(1, Math.floor(this.minecraft.window.width * this.minecraft.window.scaleFactor));
                const pixelH = Math.max(1, Math.floor(this.minecraft.window.height * this.minecraft.window.scaleFactor));
                const web = this.minecraft.worldRenderer.webRenderer;
                if (web && typeof web.setSize === 'function') {
                    // Force size and pixel ratio now so the WebGL canvas contains the panorama immediately
                    web.setSize(pixelW, pixelH);
                    if (typeof web.setPixelRatio === 'function') {
                        web.setPixelRatio(this.minecraft.settings.lowQualityTextures ? 0.5 : (window.devicePixelRatio || 1));
                    }
                    // Render the panorama once to populate the canvas immediately
                    try {
                        web.render(this.scene, this.camera);
                    } catch (e) {
                        // If direct render on the engine's renderer fails, fall back to calling its DOM render later
                    }
                }
            }
        } catch (e) {
            // ignore failures
        }
    }

    onClose() {
        // Remove blur
        this.minecraft.window.canvas2d.style.backdropFilter = "";
    }
}
