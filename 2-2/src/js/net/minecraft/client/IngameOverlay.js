import Gui from "./Gui.js";
import Block from "../world/block/Block.js";

export default class IngameOverlay extends Gui {

    constructor(minecraft, window) {
        super();
        this.minecraft = minecraft;
        this.window = window;

        this.textureCrosshair = minecraft.resources["gui/icons.png"];
        this.textureHotbar = minecraft.resources["gui/gui.png"];
    }

    render(stack, mouseX, mouseY, partialTicks) {
        // Layer 3 rendering (hotbar & debug) — keep the same behavior as before for full overlay
        // Render crosshair
        if (this.minecraft.hasInGameFocus()) {
            this.renderCrosshair(stack, this.window.width / 2, this.window.height / 2)
        }

        // Render hotbar (top layer)
        this.renderHotbar(stack, this.window.width / 2 - 91, this.window.height - 22);

        let world = this.minecraft.world;
        let player = this.minecraft.player;

        let x = Math.floor(player.x);
        let y = Math.floor(player.y);
        let z = Math.floor(player.z);

        let fps = Math.floor(this.minecraft.fps);
        let lightUpdates = world.lightUpdateQueue.length;
        let chunkUpdates = this.minecraft.worldRenderer.chunkSectionUpdateQueue.length;

        // Debug
        this.drawString(stack, fps + " fps," + " " + lightUpdates + " light updates," + " " + chunkUpdates + " chunk updates", 1, 1);
        this.drawString(stack, x + ", " + y + ", " + z + " (" + (x >> 4) + ", " + (y >> 4) + ", " + (z >> 4) + ")", 1, 1 + 9);

        // Render Achievement Toast
        this.renderAchievement(stack, partialTicks);
    }
    
    renderAchievement(stack, partialTicks) {
        const mgr = this.minecraft.achievementManager;
        if (!mgr || !mgr.currentToast) return;

        const toast = mgr.currentToast;
        // We update timer in tick (20tps). We can interpolate if we want smooth 60fps animation.
        // Timer goes 0 -> 150.
        // Let's assume 1 tick = 50ms.
        // Animation: slide in (0-20), stay (20-130), slide out (130-150)
        
        const w = 160;
        const h = 32;
        let x = this.window.width;
        const y = 32; // Top right, slightly down

        let t = mgr.toastTimer + partialTicks; // Smooth timer
        
        if (t < 20) {
            // Slide in with overshoot
            // Progress 0-1
            let p = t / 20;
            // Ease out elastic-ish: go past target, then settle
            // Target x is width - w
            // Basic ease out back: (p-1)^3 + 1 ... overshoot logic
            // Simple approach: Linear move to overshoot then fallback?
            // Overshoot logic:
            // Reach target at t=15, overshoot 10px, return at t=20
            if (p < 0.8) {
                let subP = p / 0.8; // 0 to 1
                subP = 1 - Math.pow(1 - subP, 3); // Ease out cubic
                x = this.window.width - (w * subP + 10 * subP); // Go slightly too far
            } else {
                let subP = (p - 0.8) / 0.2; // 0 to 1
                // Return from overshoot
                x = (this.window.width - w - 10) + (10 * subP);
            }
        } else if (t > 130) {
            // Slide out
            let p = (t - 130) / 20;
            p = p * p; // Ease in
            x = (this.window.width - w) + (w * p);
        } else {
            // Settle
            x = this.window.width - w;
        }

        // Draw Toast Background
        this.drawRect(stack, x, y, x + w, y + h, "#202020");
        this.drawRect(stack, x + 2, y + 2, x + w - 2, y + h - 2, "#101010"); // Border inner

        // Draw Icon
        // Retrieve texture
        let texture = this.getTexture("../../" + toast.icon);
        if (!texture) texture = this.getTexture(toast.icon);
        
        if (texture) {
            // Draw icon (Larger size: 24x24 instead of 16x16, centered vertically)
            this.drawSprite(stack, texture, 0, 0, this.getTextureWidth(texture, 16), this.getTextureHeight(texture, 16), x + 4, y + 4, 24, 24);
        }

        // Draw Text
        this.drawString(stack, "Achievement Get!", x + 32, y + 6, 0xFFFF00);
        this.drawString(stack, toast.name, x + 32, y + 16, 0xFFFFFF);
    }

    /**
     * Render only the lightweight count text that should appear beneath layer 1 (before 3D models are drawn).
     * Keep it minimal and fast.
     */
    renderCounts(stack, mouseX, mouseY, partialTicks) {
        if (!this.minecraft.isInGame()) return;

        let player = this.minecraft.player;
        if (!player || !player.inventory) return;

        // Draw item counts for hotbar slots at the top-left area (layer 1)
        // We show only counts as text, positioned in a single row.
        let baseX = 8;
        let baseY = 8;
        for (let i = 0; i < 9; i++) {
            let itemStack = this.minecraft.player.inventory.getStackInSlot(i);
            if (itemStack && itemStack.count > 1) {
                // draw count text (white) - small and unobtrusive
                this.drawRightString(stack, "" + itemStack.count, baseX + i * 18 + 14, baseY + 6, 0xFFFFFF);
            }
        }
    }

    renderCrosshair(stack, x, y) {
        let size = 15;
        this.drawSprite(stack, this.textureCrosshair, 0, 0, 15, 15, x - size / 2, y - size / 2, size, size, 0.6);
    }

    renderHotbar(stack, x, y) {
        // Render background
        this.drawSprite(stack, this.textureHotbar, 0, 0, 200, 22, x, y, 200, 22)
        this.drawSprite(
            stack,
            this.textureHotbar,
            0, 22,
            24, 24,
            x + this.minecraft.player.inventory.selectedSlotIndex * 20 - 1, y - 1,
            24, 24
        )

        // Render items
        for (let i = 0; i < 9; i++) {
            let typeId = this.minecraft.player.inventory.getItemInSlot(i);
            let renderId = "hotbar" + i;
            if (typeId !== 0) {
                let block = Block.getById(typeId);
                this.minecraft.itemRenderer.renderItemInGui(renderId, block, Math.floor(x + i * 20 + 11), y + 11);
            } else {
                // If slot is empty, make sure to remove it from the renderer
                if (this.minecraft.itemRenderer.items[renderId]) {
                    this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items[renderId].group);
                    delete this.minecraft.itemRenderer.items[renderId];
                }
            }
        }
    }

}
