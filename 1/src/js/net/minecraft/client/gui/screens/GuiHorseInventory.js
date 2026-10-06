import GuiScreen from "../GuiScreen.js";
import Block from "../../world/block/Block.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";

export default class GuiHorseInventory extends GuiScreen {

    constructor(player, horse) {
        super();
        this.player = player;
        this.horse = horse;
        this.inventory = player.inventory;
        this.heldItem = {id: 0, count: 0, tag: {}};
    }

    init() {
        super.init();
        this.inventoryBackground = this.getTexture("../../inventoryUIborder.png");
        this.inventorySlot = this.getTexture("../../inventoryslot.png");

        this.inventoryWidth = 176;
        this.inventoryHeight = 166;
        this.guiLeft = (this.width - this.inventoryWidth) / 2;
        this.guiTop = (this.height - this.inventoryHeight) / 2;

        this.saddleIcon = this.getTexture("../../whenpigsfly.png");
        this.horseIcon = this.getTexture("../../horse_spawn_egg.png");
    }

    doesGuiPauseGame() {
        return false;
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawRect(stack, 0, 0, this.width, this.height, 'black', 0.6);
        
        // Main background
        this.drawSprite(stack, this.inventoryBackground, 0, 0, 176, 166, this.guiLeft, this.guiTop, 176, 166);

        // Labels
        this.drawStringNoShadow(stack, "Horse", this.guiLeft + 8, this.guiTop + 6, 0x404040);
        this.drawStringNoShadow(stack, "Inventory", this.guiLeft + 8, this.guiTop + 72, 0x404040);

        // Special slots: 100=Saddle, 101=Chest
        // Saddle Slot
        this.drawSlot(stack, this.guiLeft + 7, this.guiTop + 18, 100);
        // Chest Slot
        this.drawSlot(stack, this.guiLeft + 7, this.guiTop + 36, 101);

        // Horse Storage Slots (3x4 grid)
        if (this.horse.hasChest) {
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 4; col++) {
                    let x = this.guiLeft + 80 + col * 18;
                    let y = this.guiTop + 18 + row * 18;
                    this.drawSlot(stack, x, y, 102 + col + row * 4); 
                }
            }
        }

        // Player Inventory
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                let x = this.guiLeft + 8 + col * 18;
                let y = this.guiTop + 84 + row * 18;
                this.drawSlot(stack, x, y, col + row * 9 + 9);
            }
        }
        // Hotbar
        for (let i = 0; i < 9; i++) {
            let x = this.guiLeft + 8 + i * 18;
            let y = this.guiTop + 142;
            this.drawSlot(stack, x, y, i);
        }

        // Held item at cursor
        if (this.heldItem && this.heldItem.id !== 0) {
            let block = Block.getById(this.heldItem.id);
            if (block) {
                this.minecraft.itemRenderer.renderItemInGui("held_item", block, mouseX, mouseY, 10, 1.0, 30, this.heldItem.tag);
                if (this.heldItem.count > 1) this.drawRightString(stack, "" + this.heldItem.count, mouseX + 8, mouseY + 4, 0xFFFFFF);
            }
        } else {
            if (this.minecraft.itemRenderer.items["held_item"]) {
                this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items["held_item"].group);
                delete this.minecraft.itemRenderer.items["held_item"];
            }
        }
    }

    drawSlot(stack, x, y, index) {
        this.drawSprite(stack, this.inventorySlot, 0, 0, 18, 18, x - 1, y - 1, 18, 18);
        
        let item = (index >= 100) ? this.horse.horseInventory[index - 100] : this.inventory.getStackInSlot(index);
        const renderId = "horse_inv_slot_" + index;

        // Draw Ghost Icons for empty special slots
        if (!item || item.id === 0) {
            if (index === 100) { // Saddle ghost
                this.minecraft.itemRenderer.renderItemInGui(renderId + "_ghost", Block.getById(BlockRegistry.SADDLE.getId()), x + 8, y + 8, 10, 0.3);
            } else if (index === 101) { // Chest ghost (Equippable chest)
                this.minecraft.itemRenderer.renderItemInGui(renderId + "_ghost", Block.getById(BlockRegistry.CHEST.getId()), x + 8, y + 8, 10, 0.3, 0, null);
            }
        } else {
            // Remove ghost if occupied
            if (this.minecraft.itemRenderer.items[renderId + "_ghost"]) {
                this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items[renderId + "_ghost"].group);
                delete this.minecraft.itemRenderer.items[renderId + "_ghost"];
            }
        }

        let mouseX = this.minecraft.window.mouseX;
        let mouseY = this.minecraft.window.mouseY;
        if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
            this.drawRect(stack, x, y, x + 16, y + 16, "rgba(255, 255, 255, 0.3)");
        }

        if (item && item.id !== 0) {
            this.minecraft.itemRenderer.renderItemInGui(renderId, Block.getById(item.id), x + 8, y + 8, 10, 1.0, 0, item.tag);
        } else {
            if (this.minecraft.itemRenderer.items[renderId]) {
                this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items[renderId].group);
                delete this.minecraft.itemRenderer.items[renderId];
            }
        }
    }

    drawForeground(stack, mouseX, mouseY) {
        this.drawSlotForeground(stack, this.guiLeft + 7, this.guiTop + 18, 100);
        this.drawSlotForeground(stack, this.guiLeft + 7, this.guiTop + 36, 101);

        // Horse storage slots
        if (this.horse.hasChest) {
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 4; col++) {
                    this.drawSlotForeground(stack, this.guiLeft + 80 + col * 18, this.guiTop + 18 + row * 18, 102 + col + row * 4);
                }
            }
        }

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                this.drawSlotForeground(stack, this.guiLeft + 8 + col * 18, this.guiTop + 84 + row * 18, col + row * 9 + 9);
            }
        }
        for (let i = 0; i < 9; i++) {
            this.drawSlotForeground(stack, this.guiLeft + 8 + i * 18, this.guiTop + 142, i);
        }

        let slot = this.getSlotAt(mouseX, mouseY);
        if (slot !== -1) {
            let item = (slot >= 100) ? this.horse.horseInventory[slot - 100] : this.inventory.getStackInSlot(slot);
            if (item && item.id !== 0) {
                this.drawTooltip(stack, Block.getById(item.id).name || "Item", mouseX, mouseY);
            }
        }
    }

    drawSlotForeground(stack, x, y, index) {
        let item = (index >= 100) ? this.horse.horseInventory[index - 100] : this.inventory.getStackInSlot(index);
        if (item && item.id !== 0) {
            if (item.count > 1) this.drawRightString(stack, "" + item.count, x + 17, y + 9, 0xFFFFFF);
        }
    }

    getSlotAt(mx, my) {
        if (this.isOver(mx, my, this.guiLeft + 7, this.guiTop + 18)) return 100;
        if (this.isOver(mx, my, this.guiLeft + 7, this.guiTop + 36)) return 101;

        if (this.horse.hasChest) {
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 4; c++) {
                    if (this.isOver(mx, my, this.guiLeft + 80 + c * 18, this.guiTop + 18 + r * 18)) return 102 + c + r * 4;
                }
            }
        }

        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.isOver(mx, my, this.guiLeft + 8 + c * 18, this.guiTop + 84 + r * 18)) return c + r * 9 + 9;
            }
        }
        for (let i = 0; i < 9; i++) {
            if (this.isOver(mx, my, this.guiLeft + 8 + i * 18, this.guiTop + 142)) return i;
        }
        return -1;
    }

    isOver(mx, my, x, y) { return mx >= x && mx < x + 18 && my >= y && my < y + 18; }

    mouseClicked(mouseX, mouseY, mouseButton) {
        super.mouseClicked(mouseX, mouseY, mouseButton);
        let slot = this.getSlotAt(mouseX, mouseY);
        if (slot === -1) return;

        let isHorseSlot = slot >= 100;
        let targetStack = isHorseSlot ? this.horse.horseInventory[slot - 100] : this.inventory.getStackInSlot(slot);

        if (mouseButton === 0) {
            if (this.heldItem.id === 0) {
                if (targetStack.id !== 0) {
                    this.heldItem = {id: targetStack.id, count: targetStack.count, tag: targetStack.tag || {}};
                    if (isHorseSlot) this.horse.horseInventory[slot - 100] = {id: 0, count: 0, tag: {}};
                    else this.inventory.setStackInSlot(slot, 0, 0);
                }
            } else {
                // Check suitability for special slots
                if (slot === 100 && this.heldItem.id !== BlockRegistry.SADDLE.getId()) return;
                if (slot === 101 && this.heldItem.id !== BlockRegistry.CHEST.getId()) return;
                
                if (targetStack.id === 0) {
                    if (isHorseSlot) this.horse.horseInventory[slot - 100] = this.heldItem;
                    else this.inventory.setStackInSlot(slot, this.heldItem.id, this.heldItem.count, 0, this.heldItem.tag);
                    this.heldItem = {id: 0, count: 0, tag: {}};
                } else if (targetStack.id === this.heldItem.id) {
                    let add = Math.min(64 - targetStack.count, this.heldItem.count);
                    targetStack.count += add; this.heldItem.count -= add;
                    if (this.heldItem.count <= 0) this.heldItem = {id: 0, count: 0, tag: {}};
                } else {
                    let tmp = {id: targetStack.id, count: targetStack.count, tag: targetStack.tag || {}};
                    if (isHorseSlot) this.horse.horseInventory[slot - 100] = this.heldItem;
                    else this.inventory.setStackInSlot(slot, this.heldItem.id, this.heldItem.count, 0, this.heldItem.tag);
                    this.heldItem = tmp;
                }
            }
        }
        
        // Ensure horse visuals update if saddle changed
        if (this.horse.renderer && this.horse.renderer.group) {
            delete this.horse.renderer.group.buildMeta;
        }
    }

    drawTooltip(stack, text, x, y) {
        let width = this.getStringWidth(stack, text);
        let height = 12;
        this.drawRect(stack, x + 12, y - 12, x + 12 + width + 8, y - 12 + height + 4, "rgba(16, 0, 16, 0.9)");
        this.drawString(stack, text, x + 16, y - 8, 0xFFFFFF);
    }

    onClose() {
        if (this.heldItem.id !== 0) this.inventory.addItemStack(this.heldItem);
    }

    keyTyped(key, character) {
        if (key === this.minecraft.settings.inventory || key === "Escape") {
            this.minecraft.displayScreen(null);
            return true;
        }
        return super.keyTyped(key, character);
    }
}