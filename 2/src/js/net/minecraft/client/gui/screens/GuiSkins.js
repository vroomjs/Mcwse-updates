import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import * as THREE from "../../../../../../../libraries/three.module.js";
import ModelPlayer from "../../render/model/model/ModelPlayer.js";
import Tessellator from "../../render/Tessellator.js";

export default class GuiSkins extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.playerRotation = 0;
        this.timeAlive = 0;
        this.currentTexture = "../../steve (1).png";

        this.premadeSkins = [
            { name: "Steve", path: "../../steve (1).png" },
            { name: "Technoblade", path: "../../technoblade.png" },
            { name: "Notch", path: "../../notch.png" },
            { name: "Alex", path: "../../alex (1).png" }
        ];

        this.customSkins = new Array(4).fill(null);
        this._customSkinsLoaded = false;
    }

    loadCustomSkins() {
        try {
            const saved = localStorage.getItem('mc_custom_skins');
            if (saved) {
                const data = JSON.parse(saved);
                for (let i = 0; i < 4; i++) {
                    if (data[i]) {
                        const img = new Image();
                        img.src = data[i];
                        this.customSkins[i] = img;
                        // Add to resources for rendering
                        this.minecraft.resources[`custom_slot_${i}`] = img;
                    }
                }
            }
        } catch (e) {
            console.warn("Failed to load custom skins", e);
        }
    }

    saveCustomSkins() {
        try {
            const data = this.customSkins.map(img => img ? img.src : null);
            localStorage.setItem('mc_custom_skins', JSON.stringify(data));
        } catch (e) {
            console.warn("Failed to save custom skins", e);
        }
    }

    init() {
        super.init();

        if (!this._customSkinsLoaded) {
            this.loadCustomSkins();
            this._customSkinsLoaded = true;
        }

        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Dimensions
        const btnWidth = 90;
        const btnHeight = 20;
        const padding = 15;
        const previewWidth = 120;
        const previewHeight = 160;

        // Two columns of buttons (Premade, Custom)
        const totalControlsWidth = (btnWidth * 2) + padding;
        const totalWidth = totalControlsWidth + padding + previewWidth;
        const groupStartX = centerX - totalWidth / 2;
        
        const isCompact = this.height < 280;
        const rowH = isCompact ? 22 : 25;
        const totalHeight = (4 * rowH); 
        const groupStartY = centerY - totalHeight / 2 - 10;
        
        // Premade Column (Left)
        for (let i = 0; i < this.premadeSkins.length; i++) {
            const skin = this.premadeSkins[i];
            const isActive = this.minecraft.settings.skin === skin.path;
            const label = (isActive ? "> " : "") + skin.name;
            this.buttonList.push(new GuiButton(label, groupStartX, groupStartY + i * rowH, btnWidth, btnHeight, () => {
                this.updateSkin(skin.path);
                this.init(); // Refresh labels
            }));
        }

        // Custom Column (Right)
        for (let i = 0; i < 4; i++) {
            const hasSkin = this.customSkins[i] !== null;
            const resKey = `custom_slot_${i}`;
            const isActive = this.minecraft.settings.skin === resKey;
            
            let label = (isActive ? "> " : "") + `Slot ${i + 1}`;
            if (!hasSkin) label = `+ Slot ${i + 1}`;

            this.buttonList.push(new GuiButton(label, groupStartX + btnWidth + padding / 2, groupStartY + i * rowH, btnWidth, btnHeight, () => {
                if (!hasSkin) {
                    this.openSkinPicker(i);
                } else {
                    this.updateSkin(resKey);
                    this.init();
                }
            }));
        }

        // Preview area rectangle
        this.previewRect = {
            x: groupStartX + totalControlsWidth + padding,
            y: groupStartY + (totalHeight - previewHeight) / 2,
            w: previewWidth,
            h: previewHeight
        };

        // Done button at bottom center
        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 30, 200, 20, () => {
            this.minecraft.settings.save();
            this.minecraft.displayScreen(this.previousScreen);
        }));

        this.initPreview();
    }

    initPreview() {
        if (!this.previewRenderer) {
            this.previewCanvas = document.createElement('canvas');
            this.previewRenderer = new THREE.WebGLRenderer({
                canvas: this.previewCanvas,
                antialias: true,
                alpha: true
            });
            this.previewScene = new THREE.Scene();
            
            // Camera setup for portrait preview
            // Adjust FOV and position to frame the player model nicely
            this.previewCamera = new THREE.PerspectiveCamera(35, this.previewRect.w / this.previewRect.h, 0.1, 1000);
            this.previewCamera.position.set(0, 0, 6.5);
            this.previewCamera.lookAt(0, 0, 0);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            this.previewScene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight.position.set(1, 1, 2);
            this.previewScene.add(directionalLight);
            
            this.playerGroup = new THREE.Group();
            this.previewScene.add(this.playerGroup);
            
            // Default to 64x32, rebuildModel will adjust
            this.playerModel = new ModelPlayer(64, 32);
        }

        this.rebuildModel();
    }

    rebuildModel() {
        if (!this.playerGroup) return;
        
        this.playerGroup.clear();

        const tessellator = new Tessellator();
        // Get the actual texture object.
        let texture = this.minecraft.resources[this.currentTexture];
        
        // Fallback to char.png (current skin)
        if (!texture) {
            texture = this.minecraft.getThreeTexture("char.png");
        } else {
            // Check if it's already a THREE.Texture
            if (!(texture instanceof THREE.Texture)) {
                 // Convert Image to Texture if needed
                 texture = this.minecraft.getThreeTexture(this.currentTexture);
            }
        }

        if (texture) {
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            tessellator.bindTexture(texture);

            // Check dimensions and recreate model if needed
            const img = texture.image;
            if (img) {
                const w = img.width;
                const h = img.height;
                // Only recreate if dimensions changed from what the model expects
                // We check if the existing head texture height matches
                if (this.playerModel.head.textureHeight !== h) {
                    this.playerModel = new ModelPlayer(w, h);
                }
            }
        }

        tessellator.setColor(1, 1, 1, 1);
        
        if (this.playerModel) {
            this.playerModel.rebuild(tessellator, this.playerGroup);
        }
        
        // Scale and position to fit the view
        // Use negative scale to match in-game orientation and flip Y
        this.playerGroup.scale.set(-0.06, -0.06, 0.06);
        this.playerGroup.position.y = 0.5; 
    }

    updateSkin(textureName) {
        // If the texture name refers to a loaded resource, apply it globally
        const newSkinImage = this.minecraft.resources[textureName];
        
        if (newSkinImage) {
            const img = newSkinImage.image || newSkinImage;
            
            this.minecraft.settings.skin = textureName;
            this.minecraft.refreshTextures();
            
            // Force player renderer to update model if resolution changed
            if (this.minecraft.player && this.minecraft.player.renderer) {
                // Invalidate build meta to force rebuild
                if (this.minecraft.player.renderer.group) {
                     delete this.minecraft.player.renderer.group.buildMeta;
                }
            }
        }

        // Update current texture for preview
        this.currentTexture = textureName;
        this.rebuildModel();
    }

    openSkinPicker(slotIndex) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.addEventListener('change', (e) => {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const img = new Image();
                    img.onload = () => {
                        const resKey = `custom_slot_${slotIndex}`;
                        this.customSkins[slotIndex] = img;
                        this.minecraft.resources[resKey] = img;
                        this.minecraft.resources['char.png'] = img;
                        this.saveCustomSkins();
                        this.minecraft.refreshTextures();
                        this.updateSkin(resKey);
                        this.init();
                    };
                    img.src = evt.target.result;
                };
                reader.readAsDataURL(file);
            }
            document.body.removeChild(input);
        });
        input.click();
    }

    updateScreen() {
        this.playerRotation += 0.02;
        this.timeAlive += 1;
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Skin Customization", this.width / 2, 12);

        // Draw preview box
        const r = this.previewRect;
        this.drawRect(stack, r.x - 2, r.y - 2, r.x + r.w + 2, r.y + r.h + 2, '#a0a0a0'); // Light border
        this.drawRect(stack, r.x, r.y, r.x + r.w, r.y + r.h, '#101010'); // Dark background

        // Render 3D preview
        if (this.previewRenderer && this.playerModel) {
            const pixelW = Math.floor(r.w * window.devicePixelRatio);
            const pixelH = Math.floor(r.h * window.devicePixelRatio);
            
            if (this.previewCanvas.width !== pixelW || this.previewCanvas.height !== pixelH) {
                this.previewRenderer.setSize(pixelW, pixelH, false);
            }
            
            this.previewCamera.aspect = r.w / r.h;
            this.previewCamera.updateProjectionMatrix();
            
            // Rotate model
            this.playerGroup.rotation.y = this.playerRotation;
            
            // Animate model (idle breathing)
            this.playerModel.render(this.playerGroup, 0, 0, this.timeAlive + partialTicks, 0, 0, partialTicks);
            
            this.previewRenderer.render(this.previewScene, this.previewCamera);
            
            // Draw canvas onto GUI
            stack.drawImage(this.previewCanvas, r.x, r.y, r.w, r.h);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
    
    onClose() {
        if (this.previewRenderer) {
            this.previewRenderer.dispose();
            this.previewRenderer = null;
        }
    }
}