import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";
import * as THREE from "three";
import MathHelper from "../../../util/MathHelper.js";

export default class GuiDevTools extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.hideUI = false;
    }

    doesGuiPauseGame() {
        return false;
    }

    init() {
        super.init();
        if (this.hideUI) return; 

        let dev = this.minecraft.devTools;
        let active = dev[dev.mode];
        let y = 35;

        // Mode selector
        this.btnMode = new GuiButton("Edit Mode: " + dev.mode.toUpperCase(), this.width / 2 - 100, 10, 200, 20, () => {
            if (dev.mode === "item") dev.mode = "block";
            else if (dev.mode === "block") dev.mode = "eating";
            else if (dev.mode === "eating") dev.mode = "crossbow";
            else if (dev.mode === "crossbow") dev.mode = "fishingHand";
            else if (dev.mode === "fishingHand") dev.mode = "fishingRod";
            else if (dev.mode === "fishingRod") dev.mode = "glint";
            else if (dev.mode === "glint") dev.mode = "lighting";
            else dev.mode = "item";
            this.init();
        });
        this.buttonList.push(this.btnMode);
        
        if (dev.mode === "lighting") {
            const l = dev.lighting;
            this.addButton("Skylight Intensity", l.sky, 0.0, 2.0, y, val => { l.sky = val; this.minecraft.worldRenderer.rebuildAll(); });
            this.addButton("Blocklight Intensity", l.block, 0.0, 2.0, y + 24, val => { l.block = val; this.minecraft.worldRenderer.rebuildAll(); });
            this.addButton("AO Darkening", l.ao, 0.0, 0.25, y + 48, val => { l.ao = val; this.minecraft.worldRenderer.rebuildAll(); });
            this.addButton("Shadow Depth", l.gamma, 0.0, 3.5, y + 72, val => { l.gamma = val; this.minecraft.worldRenderer.rebuildAll(); });
        } else if (dev.mode === "glint") {
            const g = dev.glint;
            this.buttonList.push(new GuiButton("Forced Glint: " + (g.forced ? "ON" : "OFF"), this.width/2 - 100, y, 200, 20, () => {
                g.forced = !g.forced;
                this.init();
                this.rebuildHand();
            }));
            y += 24;
            this.addButton("Glint Zoom", g.zoom, 0.1, 50, y, val => g.zoom = val);
            this.addButton("Glint Speed", g.speed, 0, 2.0, y + 24, val => g.speed = val);
            this.addButton("Glint Rotation", g.rotation, -3.14, 3.14, y + 48, val => g.rotation = val);
            y += 80;
            this.addButton("Glint Red", g.r, 0, 1.0, y, val => g.r = val);
            this.addButton("Glint Green", g.g, 0, 1.0, y + 24, val => g.g = val);
            this.addButton("Glint Blue", g.b, 0, 1.0, y + 48, val => g.b = val);
            y += 80;
            this.addButton("Glint Alpha", g.alpha, 0, 1.0, y, val => g.alpha = val);
        } else if (dev.mode === "fishingRod") {
            this.addButton("Line X", active.x, -2, 2, y, val => active.x = val);
            this.addButton("Line Y", active.y, -2, 2, y + 24, val => active.y = val);
            this.addButton("Line Z", active.z, -2, 2, y + 48, val => active.z = val);
        } else {
            // Position
            this.addButton("Pos X", active.x, -10, 10, y, val => active.x = val);
            this.addButton("Pos Y", active.y, -10, 10, y + 24, val => active.y = val);
            this.addButton("Pos Z", active.z, -10, 10, y + 48, val => active.z = val);
            
            y += 80;
            this.addButton("Rot X", active.rotationX, -3.14 * 2, 3.14 * 2, y, val => active.rotationX = val);
            this.addButton("Rot Y", active.rotationY, -3.14 * 2, 3.14 * 2, y + 24, val => active.rotationY = val);
            this.addButton("Rot Z", active.rotationZ, -3.14 * 2, 3.14 * 2, y + 48, val => active.rotationZ = val);
            
            y += 80;
            this.addButton("Scale", active.scale, 0, 30, y, val => active.scale = val);
        }

        this.buttonList.push(new GuiButton("Reset Mode Defaults", this.width / 2 - 100, this.height - 78, 200, 20, () => {
            this.resetToDefaults();
            this.init();
        }));

        this.buttonList.push(new GuiButton("Hide UI (Free Move)", this.width / 2 - 100, this.height - 54, 200, 20, () => {
            this.hideUI = true;
            this.minecraft.addMessageToChat("§eFree Move: Arrows (X/Z), PgUp/Dn (Y), R/T/Y (Rot), +/- (Scale). ESC to return.");
            this.init();
        }));

        this.buttonList.push(new GuiButton("Done", this.width / 2 - 100, this.height - 30, 200, 20, () => {
            this.saveToLocal();
            this.minecraft.displayScreen(this.previousScreen);
        }));

        this.updateVisualHelpers();
    }

    saveToLocal() {
        localStorage.setItem('mc_dev_tools', JSON.stringify(this.minecraft.devTools));
    }

    resetToDefaults() {
        const dev = this.minecraft.devTools;
        const defaults = {
            item: { x: 2.33, y: 0.02, z: 4.49, rotationX: 0.75, rotationY: 4.06, rotationZ: 5.44, scale: 20.10 },
            block: { x: 0.20, y: -4.17, z: 1.92, rotationX: -0.03, rotationY: 0.86, rotationZ: 0.00, scale: 10.0 },
            eating: { x: 0.00, y: -0.17, z: -0.48, rotationX: 0.06, rotationY: 3.14, rotationZ: 0.17, scale: 2.50 }
        };
        Object.assign(dev[dev.mode], defaults[dev.mode]);
        this.rebuildHand();
    }

    addButton(name, value, min, max, y, callback) {
        const sliderWidth = 160;
        const nudgeWidth = 18;
        const startX = this.width / 2 - (sliderWidth + nudgeWidth * 2 + 4) / 2;

        const slider = new GuiSliderButton(name, value, min, max, startX + nudgeWidth + 2, y, sliderWidth, 20, val => {
            callback(val);
            this.rebuildHand();
            this.updateVisualHelpers();
        }, 0.01).setDisplayNameBuilder((n, v) => `${n}: ${v.toFixed(2)}`);
        
        this.buttonList.push(slider);

        this.buttonList.push(new GuiButton("<", startX, y, nudgeWidth, 20, () => {
            slider.value = MathHelper.clamp(slider.value - 0.05, slider.min, slider.max);
            slider.string = slider.getDisplayName(slider.settingName, slider.value);
            callback(slider.value);
            this.rebuildHand();
            this.updateVisualHelpers();
        }));

        this.buttonList.push(new GuiButton(">", startX + nudgeWidth + sliderWidth + 4, y, nudgeWidth, 20, () => {
            slider.value = MathHelper.clamp(slider.value + 0.05, slider.min, slider.max);
            slider.string = slider.getDisplayName(slider.settingName, slider.value);
            callback(slider.value);
            this.rebuildHand();
            this.updateVisualHelpers();
        }));
    }

    updateVisualHelpers() {
        if (this.minecraft.player && this.minecraft.player.renderer) {
            const group = this.minecraft.player.renderer.firstPersonGroup;
            if (!group) return;

            let helper = group.getObjectByName("dev_helper");
            if (!helper) {
                helper = new THREE.Group();
                helper.name = "dev_helper";
                
                // Red = X, Green = Y, Blue = Z (Front)
                const arrowX = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), 3, 0xff0000, 0.5, 0.3);
                const arrowY = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 3, 0x00ff00, 0.5, 0.3);
                const arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,0), 3, 0x0000ff, 0.5, 0.3);
                
                helper.add(arrowX, arrowY, arrowZ);
                group.add(helper);
            }
            
            const active = this.minecraft.devTools[this.minecraft.devTools.mode];
            helper.position.set(active.x, active.y, active.z);
            helper.rotation.set(active.rotationX, active.rotationY, active.rotationZ);
        }
    }

    keyTyped(key, character) {
        if (this.hideUI && key === "Escape") {
            this.hideUI = false;
            this.init();
            return true;
        }

        if (this.hideUI || !this.minecraft.currentScreen.isAnyFieldFocused) {
            let active = this.minecraft.devTools[this.minecraft.devTools.mode];
            let step = 0.05;
            let changed = false;

            if (key === "ArrowLeft") { active.x -= step; changed = true; }
            if (key === "ArrowRight") { active.x += step; changed = true; }
            if (key === "ArrowUp") { active.z -= step; changed = true; }
            if (key === "ArrowDown") { active.z += step; changed = true; }
            if (key === "PageUp") { active.y += step; changed = true; }
            if (key === "PageDown") { active.y -= step; changed = true; }
            if (key === "KeyR") { active.rotationX += step; changed = true; }
            if (key === "KeyT") { active.rotationY += step; changed = true; }
            if (key === "KeyY") { active.rotationZ += step; changed = true; }
            if (key === "Equal") { active.scale += 0.2; changed = true; }
            if (key === "Minus") { active.scale = Math.max(0.1, active.scale - 0.2); changed = true; }

            if (changed) {
                this.rebuildHand();
                this.updateVisualHelpers();
                return true;
            }
        }

        return super.keyTyped(key, character);
    }

    rebuildHand() {
        if (this.minecraft.player && this.minecraft.player.renderer) {
            if (this.minecraft.player.renderer.group) {
                delete this.minecraft.player.renderer.group.buildMeta;
            }
            if (this.minecraft.worldRenderer) this.minecraft.worldRenderer.flushRebuild = true;
            if (this.minecraft.itemRenderer) this.minecraft.itemRenderer.rebuildAllItems();
        }
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        if (!this.hideUI) {
            this.drawDefaultBackground(stack);
            this.drawCenteredString(stack, "Item Transform Dev Tools", this.width / 2, 22);
        } else {
            this.drawRect(stack, 2, 2, 220, 14, "rgba(0,0,0,0.7)");
            this.drawString(stack, "FREE MOVE ENABLED - ESC TO SHOW UI", 5, 5, 0xFFFF55);
        }
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    onClose() {
        if (this.minecraft.player && this.minecraft.player.renderer) {
            const group = this.minecraft.player.renderer.firstPersonGroup;
            const helper = group?.getObjectByName("dev_helper");
            if (helper) group.remove(helper);
        }
    }
}