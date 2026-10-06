import GuiScreen from "../GuiScreen.js";
import Block from "../../world/block/Block.js";
import Keyboard from "../../../util/Keyboard.js";

export default class GuiDispenser extends GuiScreen {

    constructor(player, x, y, z) {
        super();
        this.player = player;
        this.world = player.world;
        this.posX = x;
        this.posY = y;
        this.posZ = z;
        this.heldItem = {id: 0, count: 0};
        this.te = this.world.getTileEntity(x, y, z) || { items: new Array(9).fill(null).map(() => ({id:0,count:0})) };
    }

    init() {
        super.init();
        this.inventoryBackground = this.getTexture("../../inventoryUIborder.png");
        this.inventorySlot = this.getTexture("../../inventoryslot.png");
        this.inventoryWidth = 176;
        this.inventoryHeight = 166;
        this.guiLeft = (this.width - this.inventoryWidth) / 2;
        this.guiTop = (this.height - this.inventoryHeight) / 2;
    }

    doesGuiPauseGame() { return false; }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawRect(stack, 0, 0, this.width, this.height, 'black', 0.6);
        this.drawSprite(stack, this.inventoryBackground, 0, 0, 176, 166, this.guiLeft, this.guiTop, 176, 166);
        
        // Match reference image: Center labels and 3x3 grid
        this.drawCenteredStringNoShadow(stack, "Dispenser", this.guiLeft + 88, this.guiTop + 6, 0x404040);
        this.drawStringNoShadow(stack, "Inventory", this.guiLeft + 8, this.guiTop + 72, 0x404040);

        // Dispenser 3x3 Grid centered (176 / 2 - 54 / 2 = 61)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                this.drawSlot(stack, this.guiLeft + 61 + col * 18, this.guiTop + 17 + row * 18, 100 + col + row * 3);
            }
        }

        // Inventory
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                this.drawSlot(stack, this.guiLeft + 8 + col * 18, this.guiTop + 84 + row * 18, col + row * 9 + 9);
            }
        }
        // Hotbar
        for (let i = 0; i < 9; i++) {
            this.drawSlot(stack, this.guiLeft + 8 + i * 18, this.guiTop + 142, i);
        }

        if (this.heldItem && this.heldItem.id !== 0) {
            let block = Block.getById(this.heldItem.id);
            if (block) {
                this.minecraft.itemRenderer.renderItemInGui("held_item", block, mouseX, mouseY, 10, 1.0, 30, this.heldItem.tag);
                if (this.heldItem.count > 1) this.drawRightString(stack, "" + this.heldItem.count, mouseX + 8, mouseY + 4, 0xFFFFFF);
            }
        }
    }

    drawSlot(stack, x, y, index) {
        this.drawSprite(stack, this.inventorySlot, 0, 0, 18, 18, x - 1, y - 1, 18, 18);

        // Hover highlight
        let mouseX = this.minecraft.window.mouseX;
        let mouseY = this.minecraft.window.mouseY;
        if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
            this.drawRect(stack, x, y, x + 16, y + 16, "rgba(255, 255, 255, 0.3)");
        }

        let item = (index >= 100) ? this.te.items[index - 100] : this.player.inventory.getStackInSlot(index);
        const prefix = (this.playerIdx === 1 ? "p2_" : "p1_");
        let renderId = prefix + "disp_slot_" + index;
        if (item && item.id !== 0) {
            this.minecraft.itemRenderer.renderItemInGui(renderId, Block.getById(item.id), x + 8, y + 8, 10, 1.0, 0, item.tag);
        } else if (this.minecraft.itemRenderer.items[renderId]) {
            this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items[renderId].group);
            delete this.minecraft.itemRenderer.items[renderId];
        }
    }

    drawForeground(stack, mouseX, mouseY, partialTicks) {
        // Dispenser grid
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                this.drawSlotForeground(stack, this.guiLeft + 61 + col * 18, this.guiTop + 17 + row * 18, 100 + col + row * 3);
            }
        }
        // Inventory
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                this.drawSlotForeground(stack, this.guiLeft + 8 + col * 18, this.guiTop + 84 + row * 18, col + row * 9 + 9);
            }
        }
        // Hotbar
        for (let i = 0; i < 9; i++) {
            this.drawSlotForeground(stack, this.guiLeft + 8 + i * 18, this.guiTop + 142, i);
        }

        this.drawTooltips(stack, mouseX, mouseY);
    }

    drawSlotForeground(stack, x, y, index) {
        let item = (index >= 100) ? this.te.items[index - 100] : this.player.inventory.getStackInSlot(index);
        if (item && item.id !== 0) {
            let block = Block.getById(item.id);
            if (item.count > 1) this.drawRightString(stack, "" + item.count, x + 17, y + 9, 0xFFFFFF);
            if (block && block.maxDamage > 0 && item.damage > 0) this.drawDurabilityBar(stack, x, y, item.damage, block.maxDamage);
        }
    }

    drawTooltips(stack, mouseX, mouseY) {
        let slot = this.getSlotAt(mouseX, mouseY);
        if (slot === -1) return;
        let stackObj = (slot >= 100) ? this.te.items[slot - 100] : this.player.inventory.getStackInSlot(slot);
        if (stackObj && stackObj.id !== 0) {
            let block = Block.getById(stackObj.id);
            let name = block.name || "Item";
            if (block.maxDamage > 0) {
                let cur = block.maxDamage - stackObj.damage;
                this.drawTooltip(stack, `${name}\n§7Durability: ${cur} / ${block.maxDamage}`, mouseX, mouseY);
            } else {
                this.drawTooltip(stack, name, mouseX, mouseY);
            }
        }
    }

    drawTooltip(stack, text, x, y) {
        let lines = text.split('\n');
        let width = 0;
        for (let line of lines) {
            let w = this.getStringWidth(stack, line);
            if (w > width) width = w;
        }
        let height = lines.length * 12;
        this.drawRect(stack, x + 12, y - 12, x + 12 + width + 8, y - 12 + height + 4, "rgba(16, 0, 16, 0.9)");
        for (let i = 0; i < lines.length; i++) {
            this.drawString(stack, lines[i], x + 16, y - 8 + i * 12, 0xFFFFFF);
        }
    }

    addItemToDispenser(itemStack) {
        let id = itemStack.id;
        let count = itemStack.count;
        let tag = itemStack.tag || {};
        
        for (let i = 0; i < 9; i++) {
            let slot = this.te.items[i];
            if (slot.id === id && slot.count < 64 && JSON.stringify(slot.tag) === JSON.stringify(tag)) {
                let add = Math.min(64 - slot.count, count);
                slot.count += add;
                count -= add;
                if (count <= 0) return 0;
            }
        }
        for (let i = 0; i < 9; i++) {
            if (this.te.items[i].id === 0) {
                this.te.items[i] = { id, count, tag };
                return 0;
            }
        }
        return count;
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        super.mouseClicked(mouseX, mouseY, mouseButton);
        let slot = this.getSlotAt(mouseX, mouseY);
        if (slot === -1) return;

        let isDispenser = (slot >= 100);
        let targetStack = isDispenser ? this.te.items[slot - 100] : this.player.inventory.getStackInSlot(slot);

        if (mouseButton === 0) { // Left Click
            // Handle Shift-Click
            if (Keyboard.isKeyDown("ShiftLeft") || Keyboard.isKeyDown("ShiftRight")) {
                if (!targetStack || targetStack.id === 0) return;
                if (isDispenser) {
                    let remainder = this.inventory.addItemStack(targetStack);
                    targetStack.count = remainder;
                    if (remainder === 0) {
                        targetStack.id = 0;
                        targetStack.tag = {};
                        targetStack.damage = 0;
                    }
                } else {
                    let remainder = this.addItemToDispenser(targetStack);
                    targetStack.count = remainder;
                    if (remainder === 0) {
                        targetStack.id = 0;
                        targetStack.tag = {};
                        targetStack.damage = 0;
                    }
                }
                this.minecraft.soundManager.playSound("random.click", 0, 0, 0, 0.4, 1.2);
                this.world.setTileEntity(this.posX, this.posY, this.posZ, this.te);
                return;
            }

            if (this.heldItem.id === 0) {
                if (targetStack.id !== 0) {
                    this.heldItem = {id: targetStack.id, count: targetStack.count};
                    if (isDispenser) this.te.items[slot - 100] = {id: 0, count: 0};
                    else this.player.inventory.setStackInSlot(slot, 0, 0);
                }
            } else {
                if (targetStack.id === 0) {
                    if (isDispenser) this.te.items[slot - 100] = {id: this.heldItem.id, count: this.heldItem.count};
                    else this.player.inventory.setStackInSlot(slot, this.heldItem.id, this.heldItem.count);
                    this.heldItem = {id: 0, count: 0};
                } else if (targetStack.id === this.heldItem.id) {
                    let add = Math.min(64 - targetStack.count, this.heldItem.count);
                    targetStack.count += add; this.heldItem.count -= add;
                    if (this.heldItem.count <= 0) this.heldItem = {id: 0, count: 0};
                } else {
                    let tmp = {id: targetStack.id, count: targetStack.count};
                    if (isDispenser) this.te.items[slot - 100] = this.heldItem;
                    else this.player.inventory.setStackInSlot(slot, this.heldItem.id, this.heldItem.count);
                    this.heldItem = tmp;
                }
            }
        } else if (mouseButton === 2) { // Right Click (Split / Place One)
            if (this.heldItem.id === 0) {
                if (targetStack.id !== 0) {
                    let half = Math.ceil(targetStack.count / 2);
                    this.heldItem = {id: targetStack.id, count: half};
                    targetStack.count -= half;
                    if (targetStack.count <= 0) {
                        if (isDispenser) this.te.items[slot - 100] = {id: 0, count: 0};
                        else this.player.inventory.setStackInSlot(slot, 0, 0);
                    }
                }
            } else {
                if (targetStack.id === 0) {
                    let single = {id: this.heldItem.id, count: 1};
                    if (isDispenser) this.te.items[slot - 100] = single;
                    else this.player.inventory.setStackInSlot(slot, single.id, single.count);
                    this.heldItem.count--;
                } else if (targetStack.id === this.heldItem.id && targetStack.count < 64) {
                    targetStack.count++;
                    this.heldItem.count--;
                }
                if (this.heldItem.count <= 0) this.heldItem = {id: 0, count: 0};
            }
        }
        if (isDispenser) this.world.setTileEntity(this.posX, this.posY, this.posZ, this.te);
    }

    getSlotAt(mx, my) {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (this.isOver(mx, my, this.guiLeft + 61 + c * 18, this.guiTop + 17 + r * 18)) return 100 + c + r * 3;
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

    onClose() {
        if (this.heldItem.id !== 0) this.player.inventory.addItemStack(this.heldItem);
        this.world.setTileEntity(this.posX, this.posY, this.posZ, this.te);
        if (this.minecraft.multiplayer.connected) this.minecraft.multiplayer.onTileEntityChanged(this.posX, this.posY, this.posZ, this.te);
    }
}