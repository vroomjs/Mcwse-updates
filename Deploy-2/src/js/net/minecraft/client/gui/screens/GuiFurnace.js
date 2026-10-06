import GuiScreen from "../GuiScreen.js";
import Block from "../../world/block/Block.js";
import Keyboard from "../../../util/Keyboard.js";

export default class GuiFurnace extends GuiScreen {

    constructor(player, x, y, z) {
        super();
        this.player = player;
        this.inventory = player.inventory;
        
        this.furnaceX = x;
        this.furnaceY = y;
        this.furnaceZ = z;

        this.heldItem = {id: 0, count: 0};
    }

    init() {
        super.init();
        
        // Load tile entity data
        let world = this.minecraft.world;
        this.tileEntity = world.getTileEntity(this.furnaceX, this.furnaceY, this.furnaceZ);
        
        // Ensure tile entity exists
        if (!this.tileEntity) {
            this.tileEntity = { 
                items: [
                    {id: 0, count: 0}, 
                    {id: 0, count: 0}, 
                    {id: 0, count: 0}
                ], 
                burnTime: 0, 
                cookTime: 0,
                currentItemBurnTime: 0
            };
            world.setTileEntity(this.furnaceX, this.furnaceY, this.furnaceZ, this.tileEntity);
        }

        this.inventoryBackground = this.getTexture("../../inventoryUIborder.png");
        this.inventorySlot = this.getTexture("../../inventoryslot.png");
        this.arrow = this.getTexture("../../arrow_0_0.png");

        this.inventoryWidth = 176;
        this.inventoryHeight = 166;

        this.guiLeft = (this.width - this.inventoryWidth) / 2;
        this.guiTop = (this.height - this.inventoryHeight) / 2 - 5;
    }

    doesGuiPauseGame() {
        return false;
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawRect(stack, 0, 0, this.width, this.height, 'black', 0.6);
        
        // Background
        this.drawSprite(stack, this.inventoryBackground, 0, 0, this.getTextureWidth(this.inventoryBackground, 176), this.getTextureHeight(this.inventoryBackground, 166), this.guiLeft, this.guiTop, this.inventoryWidth, this.inventoryHeight);

        // Draw labels
        let titleWidth = this.getStringWidth(stack, "Furnace");
        this.drawStringNoShadow(stack, "Furnace", this.guiLeft + (this.inventoryWidth - titleWidth) / 2, this.guiTop + 6, 0x404040);
        this.drawStringNoShadow(stack, "Inventory", this.guiLeft + 8, this.guiTop + 72, 0x404040);

        let data = this.tileEntity;

        // Draw Slots
        this.drawSlot(stack, this.guiLeft + 56, this.guiTop + 17, 36); // Input
        this.drawSlot(stack, this.guiLeft + 56, this.guiTop + 53, 37); // Fuel
        this.drawSlot(stack, this.guiLeft + 116, this.guiTop + 35, 38); // Output

        // Draw Fire Animation
        if (data.burnTime > 0 && data.currentItemBurnTime > 0) {
            let flameHeight = Math.ceil((data.burnTime / data.currentItemBurnTime) * 14);
            // Draw orange flame-like rect
            this.drawRect(stack, this.guiLeft + 56 + 2, this.guiTop + 36 + (14 - flameHeight), this.guiLeft + 56 + 16, this.guiTop + 36 + 14, '#FF8C00', 0.9);
        }

        // Draw Arrow Progress
        let arrowScale = data.cookTime / 200.0;
        this.drawSprite(stack, this.arrow, 0, 0, 22, 15, this.guiLeft + 79, this.guiTop + 35, 22, 15);
        if (data.cookTime > 0) {
             // Progress fill overlay
             this.drawRect(stack, this.guiLeft + 79, this.guiTop + 35, this.guiLeft + 79 + Math.floor(22 * arrowScale), this.guiTop + 35 + 15, '#FFFFFF', 0.4);
        }

        // Inventory (9-35)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                let x = this.guiLeft + 8 + col * 18;
                let y = this.guiTop + 84 + row * 18;
                let index = col + row * 9 + 9;
                this.drawSlot(stack, x, y, index);
            }
        }
        // Hotbar (0-8)
        for (let i = 0; i < 9; i++) {
            let x = this.guiLeft + 8 + i * 18;
            let y = this.guiTop + 142;
            this.drawSlot(stack, x, y, i);
        }

        // Held Item
        if (this.heldItem && this.heldItem.id !== 0) {
            let block = Block.getById(this.heldItem.id);
            if (block) {
                this.minecraft.itemRenderer.renderItemInGui("held_item", block, mouseX, mouseY, 10, 1.0, 30, this.heldItem.tag);
                if (this.heldItem.count > 1) {
                    this.drawRightString(stack, "" + this.heldItem.count, mouseX + 8, mouseY + 4, 0xFFFFFF);
                }
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

        // Hover highlight
        let mouseX = this.minecraft.window.mouseX;
        let mouseY = this.minecraft.window.mouseY;
        if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
            this.drawRect(stack, x, y, x + 16, y + 16, "rgba(255, 255, 255, 0.3)");
        }

        let itemStack;
        if (index >= 36) itemStack = this.tileEntity.items[index - 36];
        else itemStack = this.inventory.getStackInSlot(index);

        const prefix = (this.playerIdx === 1 ? "p2_" : "p1_");
        let renderId = prefix + "furnace_slot_" + index;
        if (itemStack && itemStack.id !== 0) {
            this.minecraft.itemRenderer.renderItemInGui(renderId, Block.getById(itemStack.id), x + 8, y + 8, 10, 1.0, 0, itemStack.tag);
        } else {
            if (this.minecraft.itemRenderer.items[renderId]) {
                this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items[renderId].group);
                delete this.minecraft.itemRenderer.items[renderId];
            }
        }
    }

    drawForeground(stack, mouseX, mouseY, partialTicks) {
        // Furnace slots
        this.drawSlotForeground(stack, this.guiLeft + 56, this.guiTop + 17, 36);
        this.drawSlotForeground(stack, this.guiLeft + 56, this.guiTop + 53, 37);
        this.drawSlotForeground(stack, this.guiLeft + 116, this.guiTop + 35, 38);

        // Inventory
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                this.drawSlotForeground(stack, this.guiLeft + 8 + col * 18, this.guiTop + 84 + row * 18, col + row * 9 + 9);
            }
        }
        for (let i = 0; i < 9; i++) {
            this.drawSlotForeground(stack, this.guiLeft + 8 + i * 18, this.guiTop + 142, i);
        }

        this.drawTooltips(stack, mouseX, mouseY);
    }

    drawSlotForeground(stack, x, y, index) {
        let itemStack;
        if (index >= 36) itemStack = this.tileEntity.items[index - 36];
        else itemStack = this.inventory.getStackInSlot(index);

        if (itemStack && itemStack.id !== 0) {
            let block = Block.getById(itemStack.id);
            this.drawItemCount(stack, itemStack.count, x, y);
            if (block && block.maxDamage > 0 && itemStack.damage > 0) this.drawDurabilityBar(stack, x, y, itemStack.damage, block.maxDamage);
        }
    }

    drawTooltips(stack, mouseX, mouseY) {
        let slot = this.getSlotAt(mouseX, mouseY);
        if (slot === -1) return;
        let stackObj = (slot >= 36) ? this.tileEntity.items[slot - 36] : this.inventory.getStackInSlot(slot);
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

    getSlotAt(mouseX, mouseY) {
        if (this.isOver(mouseX, mouseY, 56, 17)) return 36;
        if (this.isOver(mouseX, mouseY, 56, 53)) return 37;
        if (this.isOver(mouseX, mouseY, 116, 35)) return 38;

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.isOver(mouseX, mouseY, 8 + col * 18, 84 + row * 18)) return col + row * 9 + 9;
            }
        }
        for (let i = 0; i < 9; i++) {
            if (this.isOver(mouseX, mouseY, 8 + i * 18, 142)) return i;
        }
        return -1;
    }

    isOver(mx, my, x, y) {
        x += this.guiLeft; y += this.guiTop;
        return mx >= x && mx < x + 18 && my >= y && my < y + 18;
    }

    addItemToFurnace(itemStack) {
        // Furnace specific logic: items go to input if smeltable, fuel if burnable
        const blockInst = Block.getById(this.id); // Base furnace block
        const canSmelt = (this.getSmeltingResult(itemStack.id) !== 0);
        const canBurn = (this.getBurnTime(itemStack.id) > 0);

        const tryAdd = (slotIdx) => {
            const slot = this.tileEntity.items[slotIdx];
            if (slot.id === 0) {
                this.tileEntity.items[slotIdx] = { id: itemStack.id, count: itemStack.count, damage: itemStack.damage, tag: itemStack.tag };
                return 0;
            } else if (slot.id === itemStack.id && JSON.stringify(slot.tag) === JSON.stringify(itemStack.tag)) {
                let add = Math.min(64 - slot.count, itemStack.count);
                slot.count += add;
                return itemStack.count - add;
            }
            return itemStack.count;
        };

        if (canSmelt) {
            itemStack.count = tryAdd(0);
            if (itemStack.count === 0) return 0;
        }
        if (canBurn) {
            itemStack.count = tryAdd(1);
            if (itemStack.count === 0) return 0;
        }
        return itemStack.count;
    }

    // Helper functions from BlockFurnace needed for logic
    getBurnTime(id) {
        if (id === 263) return 1600;
        if (id === 368) return 20000;
        const woods = [17, 200, 209, 235, 253, 5, 201, 210, 304, 305, 44, 213, 214, 384, 389, 53, 215, 216, 385, 407];
        return woods.includes(id) ? 300 : 0;
    }

    getSmeltingResult(id) {
        if (id === 12) return 20; if (id === 15) return 265; if (id === 14) return 266;
        if (id === 4) return 1; if (id === 1) return 43;
        return 0;
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        super.mouseClicked(mouseX, mouseY, mouseButton);
        if (mouseButton === 0) { // Left Click
            let slot = this.getSlotAt(mouseX, mouseY);
            if (slot !== -1) {
                // Handle Shift-Click
                if (Keyboard.isKeyDown("ShiftLeft") || Keyboard.isKeyDown("ShiftRight")) {
                    let isFurnaceSlot = slot >= 36;
                    let targetStack = isFurnaceSlot ? this.tileEntity.items[slot - 36] : this.inventory.getStackInSlot(slot);
                    if (targetStack.id === 0) return;

                    if (isFurnaceSlot) {
                        let remainder = this.inventory.addItemStack(targetStack);
                        targetStack.count = remainder;
                        if (remainder === 0) {
                            targetStack.id = 0;
                            targetStack.tag = {};
                            targetStack.damage = 0;
                        }
                    } else {
                        let remainder = this.addItemToFurnace(targetStack);
                        targetStack.count = remainder;
                        if (remainder === 0) {
                            targetStack.id = 0;
                            targetStack.tag = {};
                            targetStack.damage = 0;
                        }
                    }
                    this.minecraft.soundManager.playSound("random.click", 0, 0, 0, 0.4, 1.2);
                    this.minecraft.world.setTileEntity(this.furnaceX, this.furnaceY, this.furnaceZ, this.tileEntity);
                    return;
                }

                // Prevent placing into output (38)
                if (slot === 38 && this.heldItem.id !== 0) return;
                
                let isFurnaceSlot = slot >= 36;
                let stack = isFurnaceSlot ? this.tileEntity.items[slot - 36] : this.inventory.getStackInSlot(slot);
                
                if (this.heldItem.id === 0) {
                    if (stack.id !== 0) {
                        this.heldItem = {id: stack.id, count: stack.count, damage: stack.damage || 0, tag: stack.tag || {}};
                        // Clear source
                        if (isFurnaceSlot) {
                            this.tileEntity.items[slot - 36] = {id: 0, count: 0, damage: 0, tag: {}};
                        } else {
                            this.inventory.setStackInSlot(slot, 0, 0);
                        }
                    }
                } else {
                    if (stack.id === 0) {
                        // Place
                        if (isFurnaceSlot) this.tileEntity.items[slot - 36] = this.heldItem;
                        else this.inventory.setStackInSlot(slot, this.heldItem.id, this.heldItem.count, this.heldItem.damage, this.heldItem.tag);
                        this.heldItem = {id: 0, count: 0, damage: 0, tag: {}};
                    } else if (stack.id === this.heldItem.id && JSON.stringify(stack.tag) === JSON.stringify(this.heldItem.tag)) {
                        // Stack
                        let block = Block.getById(stack.id);
                        let maxStack = block ? block.maxStackSize : 64;
                        let space = maxStack - stack.count;
                        let toAdd = Math.min(space, this.heldItem.count);
                        
                        stack.count += toAdd;
                        this.heldItem.count -= toAdd;
                        
                        if (this.heldItem.count <= 0) this.heldItem = {id: 0, count: 0, damage: 0, tag: {}};
                    } else {
                        // Swap
                        let temp = {id: stack.id, count: stack.count, damage: stack.damage || 0, tag: stack.tag || {}};
                        if (isFurnaceSlot) this.tileEntity.items[slot - 36] = this.heldItem;
                        else this.inventory.setStackInSlot(slot, this.heldItem.id, this.heldItem.count, this.heldItem.damage, this.heldItem.tag);
                        this.heldItem = temp;
                    }
                }
                // Save immediately
                this.minecraft.world.setTileEntity(this.furnaceX, this.furnaceY, this.furnaceZ, this.tileEntity);
            }
        } else if (mouseButton === 2) { // Right Click (Split / Place One)
            let slot = this.getSlotAt(mouseX, mouseY);
            if (slot !== -1) {
                if (slot === 38) return; // Output

                let isFurnaceSlot = slot >= 36;
                let stack = isFurnaceSlot ? this.tileEntity.items[slot - 36] : this.inventory.getStackInSlot(slot);

                if (this.heldItem.id === 0) {
                    if (stack.id !== 0) {
                        let half = Math.ceil(stack.count / 2);
                        this.heldItem = {id: stack.id, count: half, damage: stack.damage || 0, tag: stack.tag || {}};
                        stack.count -= half;
                        if (stack.count <= 0) {
                            if (isFurnaceSlot) this.tileEntity.items[slot - 36] = {id: 0, count: 0};
                            else this.inventory.setStackInSlot(slot, 0, 0);
                        }
                    }
                } else {
                    if (stack.id === 0) {
                        if (isFurnaceSlot) this.tileEntity.items[slot - 36] = {id: this.heldItem.id, count: 1, damage: this.heldItem.damage, tag: this.heldItem.tag};
                        else this.inventory.setStackInSlot(slot, this.heldItem.id, 1, this.heldItem.damage, this.heldItem.tag);
                        this.heldItem.count--;
                    } else if (stack.id === this.heldItem.id && stack.count < 64) {
                        stack.count++;
                        this.heldItem.count--;
                    }
                    if (this.heldItem.count <= 0) this.heldItem = {id: 0, count: 0, damage: 0, tag: {}};
                }
                // Save immediately
                this.minecraft.world.setTileEntity(this.furnaceX, this.furnaceY, this.furnaceZ, this.tileEntity);
            }
        }
    }

    keyTyped(key, character) {
        if (key === this.minecraft.settings.inventory || key === "Escape") {
            this.minecraft.displayScreen(null);
            return true;
        }
        return super.keyTyped(key, character);
    }

    onClose() {
        // Return held item to inventory or drop
        if (this.heldItem.id !== 0) {
            let remainder = this.inventory.addItemStack(this.heldItem);
            if (remainder > 0) {
                for (let k = 0; k < remainder; k++) {
                    this.minecraft.player.dropItem({id: this.heldItem.id, count: 1});
                }
            }
            this.heldItem = {id: 0, count: 0};
        }
        
        // Sync tile entity with world storage
        this.minecraft.world.setTileEntity(this.furnaceX, this.furnaceY, this.furnaceZ, this.tileEntity);
        
        // Sync with Multiplayer
        if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected) {
            this.minecraft.multiplayer.onTileEntityChanged(this.furnaceX, this.furnaceY, this.furnaceZ, this.tileEntity);
        }
    }
}
