import GuiScreen from "../GuiScreen.js";
import Block from "../../world/block/Block.js";
import Keyboard from "../../../util/Keyboard.js";

export default class GuiChest extends GuiScreen {

    constructor(player, x, y, z) {
        super();
        this.player = player;
        this.world = player.world;
        this.chestX = x;
        this.chestY = y;
        this.chestZ = z;

        this.heldItem = {id: 0, count: 0};
        
        // Check for adjacent chest to form double chest
        this.neighborChest = this.findNeighbor(x, y, z);
        
        let size = this.neighborChest ? 54 : 27;
        this.chestItems = new Array(size).fill(null).map(() => ({id: 0, count: 0, damage: 0, tag: {}}));
        
        this.isDouble = !!this.neighborChest;
    }

    findNeighbor(x, y, z) {
        const id = this.world.getBlockAt(x, y, z);
        const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
        for (let d of dirs) {
            if (this.world.getBlockAt(x + d[0], y, z + d[1]) === id) {
                return {x: x + d[0], y: y, z: z + d[1]};
            }
        }
        return null;
    }

    init() {
        super.init();

        // Load tile entity data if present
        let te = this.world.getTileEntity(this.chestX, this.chestY, this.chestZ);
        
        // Determine order: West/North is first half, East/South is second half
        // If we found a neighbor, sort them
        let primaryTE = te;
        let secondaryTE = null;
        let primarySize = 27;
        
        if (this.neighborChest) {
            let neighborTE = this.world.getTileEntity(this.neighborChest.x, this.neighborChest.y, this.neighborChest.z);
            
            // Logic: if neighbor is X-1 or Z-1, it is primary.
            // If neighbor is X+1 or Z+1, it is secondary.
            let isNeighborPrimary = (this.neighborChest.x < this.chestX) || (this.neighborChest.z < this.chestZ);
            
            if (isNeighborPrimary) {
                primaryTE = neighborTE;
                secondaryTE = te;
            } else {
                primaryTE = te;
                secondaryTE = neighborTE;
            }
        }

        // Fill slots
        if (primaryTE && Array.isArray(primaryTE.items)) {
            for (let i = 0; i < Math.min(27, primaryTE.items.length); i++) {
                this.chestItems[i] = primaryTE.items[i] || {id: 0, count: 0};
            }
        }
        if (secondaryTE && Array.isArray(secondaryTE.items)) {
            for (let i = 0; i < Math.min(27, secondaryTE.items.length); i++) {
                this.chestItems[i + 27] = secondaryTE.items[i] || {id: 0, count: 0};
            }
        }

        this.inventoryBackground = this.getTexture("../../inventoryUIborder.png");
        this.inventorySlot = this.getTexture("../../inventoryslot.png");

        this.inventoryWidth = 176;
        // Adjust height for double chest (6 rows = 3 * 18 = 54 extra pixels?)
        // Standard single chest GUI height is 166. Double chest adds 3 rows (54px).
        // 166 + 54 = 220
        this.inventoryHeight = this.isDouble ? 220 : 166;

        this.guiLeft = (this.width - this.inventoryWidth) / 2;
        this.guiTop = (this.height - this.inventoryHeight) / 2 - 5;

        // Play chest open sound
        this.minecraft.soundManager.playSound("chest.open", this.chestX + 0.5, this.chestY + 0.5, this.chestZ + 0.5, 0.5, 1.0);
    }

    doesGuiPauseGame() {
        return false;
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        // Dim background
        this.drawRect(stack, 0, 0, this.width, this.height, 'black', 0.6);

        // Draw background
        // For double chest, we need to draw a taller background. 
        // Since we reuse the single chest bg texture (176x166), we stretch or repeat it?
        // Stretching looks bad. We can draw it in parts.
        // Top part (labels + top row), Middle (extension), Bottom (inventory)
        
        let bgW = this.getTextureWidth(this.inventoryBackground, this.inventoryWidth);
        let bgH = this.getTextureHeight(this.inventoryBackground, this.inventoryHeight);
        
        if (this.isDouble) {
            // Draw top part (approx 70px)
            this.drawSprite(stack, this.inventoryBackground, 0, 0, bgW, 71, this.guiLeft, this.guiTop, this.inventoryWidth, 71);
            // Draw extension (middle part of slots repeated)
            // We need 3 more rows = 54px.
            // Just draw the middle slot section again
            this.drawSprite(stack, this.inventoryBackground, 0, 18, bgW, 54, this.guiLeft, this.guiTop + 71, this.inventoryWidth, 54);
            // Draw bottom part
            this.drawSprite(stack, this.inventoryBackground, 0, 71, bgW, 95, this.guiLeft, this.guiTop + 71 + 54, this.inventoryWidth, 95);
        } else {
            this.drawSprite(stack, this.inventoryBackground, 0, 0, bgW, bgH, this.guiLeft, this.guiTop, this.inventoryWidth, this.inventoryHeight);
        }

        // Draw labels
        let title = this.isDouble ? "Large Chest" : "Chest";
        // Check if block at coord is a custom container
        const block = this.world.getBlockAt(this.chestX, this.chestY, this.chestZ);
        const bInst = Block.getById(block);
        if (bInst && bInst.isContainer) title = bInst.containerName || title;

        this.drawStringNoShadow(stack, title, this.guiLeft + 8, this.guiTop + 6, 0x404040);
        this.drawStringNoShadow(stack, "Inventory", this.guiLeft + 8, this.guiTop + (this.isDouble ? 126 : 72), 0x404040);

        // Chest grid
        let startX = this.guiLeft + 8;
        let startY = this.guiTop + 18;
        let rows = this.isDouble ? 6 : 3;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < 9; col++) {
                let x = startX + col * 18;
                let y = startY + row * 18;
                let index = col + row * 9;
                this.drawSlot(stack, x, y, 100 + index); 
            }
        }

        // Player inventory below
        let invY = this.guiTop + (this.isDouble ? 138 : 84); // Shift down for double chest
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                let x = this.guiLeft + 8 + col * 18;
                let y = invY + row * 18;
                let index = col + row * 9 + 9;
                this.drawSlot(stack, x, y, index);
            }
        }

        // Hotbar
        let hotbarY = this.guiTop + (this.isDouble ? 196 : 142);
        for (let i = 0; i < 9; i++) {
            let x = this.guiLeft + 8 + i * 18;
            let y = hotbarY;
            this.drawSlot(stack, x, y, i);
        }

        // Held item at cursor
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
        if (index >= 100) itemStack = this.chestItems[index - 100];
        else itemStack = this.player.inventory.getStackInSlot(index);

        const prefix = (this.playerIdx === 1 ? "p2_" : "p1_");
        let renderId = prefix + "chest_slot_" + index;
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
        // Chest grid
        let rows = this.isDouble ? 6 : 3;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < 9; col++) {
                this.drawSlotForeground(stack, this.guiLeft + 8 + col * 18, this.guiTop + 18 + row * 18, 100 + col + row * 9);
            }
        }
        // Player inventory
        let invY = this.guiTop + (this.isDouble ? 138 : 84);
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                this.drawSlotForeground(stack, this.guiLeft + 8 + col * 18, invY + row * 18, col + row * 9 + 9);
            }
        }
        // Hotbar
        let hotbarY = this.guiTop + (this.isDouble ? 196 : 142);
        for (let i = 0; i < 9; i++) {
            this.drawSlotForeground(stack, this.guiLeft + 8 + i * 18, hotbarY, i);
        }

        this.drawTooltips(stack, mouseX, mouseY);
    }

    drawSlotForeground(stack, x, y, index) {
        let itemStack;
        if (index >= 100) itemStack = this.chestItems[index - 100];
        else itemStack = this.player.inventory.getStackInSlot(index);

        if (itemStack && itemStack.id !== 0) {
            let block = Block.getById(itemStack.id);
            this.drawItemCount(stack, itemStack.count, x, y);
            if (block && block.maxDamage > 0 && itemStack.damage > 0) this.drawDurabilityBar(stack, x, y, itemStack.damage, block.maxDamage);
        }
    }

    drawTooltips(stack, mouseX, mouseY) {
        let slot = this.getSlotAt(mouseX, mouseY);
        if (slot === -1) return;
        let stackObj = (slot >= 100) ? this.chestItems[slot - 100] : this.player.inventory.getStackInSlot(slot);
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
        // Chest grid
        let startX = this.guiLeft + 8;
        let startY = this.guiTop + 18;
        let rows = this.isDouble ? 6 : 3;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < 9; col++) {
                let x = startX + col * 18;
                let y = startY + row * 18;
                if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
                    return 100 + col + row * 9;
                }
            }
        }

        // Player inventory
        let invY = this.guiTop + (this.isDouble ? 138 : 84);
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                let x = this.guiLeft + 8 + col * 18;
                let y = invY + row * 18;
                if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
                    return col + row * 9 + 9;
                }
            }
        }

        // Hotbar
        let hotbarY = this.guiTop + (this.isDouble ? 196 : 142);
        for (let i = 0; i < 9; i++) {
            let x = this.guiLeft + 8 + i * 18;
            let y = hotbarY;
            if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
                return i;
            }
        }

        return -1;
    }

    addItemToChest(itemStack) {
        let id = itemStack.id;
        let count = itemStack.count;
        let tag = itemStack.tag || {};
        let damage = itemStack.damage || 0;
        
        // 1. Try stacking
        for (let i = 0; i < this.chestItems.length; i++) {
            let slot = this.chestItems[i];
            if (slot.id === id && slot.count < 64 && (slot.damage || 0) === damage && JSON.stringify(slot.tag || {}) === JSON.stringify(tag)) {
                let canAdd = 64 - slot.count;
                let toAdd = Math.min(canAdd, count);
                slot.count += toAdd;
                count -= toAdd;
                if (count <= 0) return 0;
            }
        }
        
        // 2. Find empty
        for (let i = 0; i < this.chestItems.length; i++) {
            if (this.chestItems[i].id === 0) {
                this.chestItems[i] = { id, count, damage, tag: JSON.parse(JSON.stringify(tag)) };
                return 0;
            }
        }
        return count;
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        super.mouseClicked(mouseX, mouseY, mouseButton);

        let slot = this.getSlotAt(mouseX, mouseY);
        if (slot === -1) return;

        let isChest = slot >= 100;
        let targetStack = isChest ? this.chestItems[slot - 100] : this.player.inventory.getStackInSlot(slot);

        if (mouseButton === 0) { // Left Click
            // Handle Shift-Click (Quick Move)
            if (Keyboard.isKeyDown("ShiftLeft") || Keyboard.isKeyDown("ShiftRight")) {
                if (!targetStack || targetStack.id === 0) return;
                
                if (isChest) {
                    // Chest to Inventory: Move to Hotbar (0-8) first, then Main Inventory (9-35)
                    let remainder = this.inventory.addItemStackRange(targetStack, 0, 8);
                    if (remainder > 0) {
                        remainder = this.inventory.addItemStackRange(targetStack, 9, 35);
                    }
                    targetStack.count = remainder;
                    if (remainder === 0) {
                        targetStack.id = 0;
                        targetStack.tag = {};
                        targetStack.damage = 0;
                    }
                } else {
                    // Inventory to Chest
                    let remainder = this.addItemToChest(targetStack);
                    targetStack.count = remainder;
                    if (remainder === 0) {
                        targetStack.id = 0;
                        targetStack.tag = {};
                        targetStack.damage = 0;
                    }
                }
                this.minecraft.soundManager.playSound("random.click", 0, 0, 0, 0.4, 1.2);
                return;
            }

            if (this.heldItem.id === 0) {
                if (targetStack.id !== 0) {
                    this.heldItem = {id: targetStack.id, count: targetStack.count, damage: targetStack.damage || 0, tag: targetStack.tag || {}};
                    if (isChest) this.chestItems[slot - 100] = {id: 0, count: 0, damage: 0, tag: {}};
                    else this.player.inventory.setStackInSlot(slot, 0, 0);
                }
            } else {
                if (targetStack.id === 0) {
                    let newStack = {id: this.heldItem.id, count: this.heldItem.count, damage: this.heldItem.damage || 0, tag: this.heldItem.tag || {}};
                    if (isChest) this.chestItems[slot - 100] = newStack;
                    else this.player.inventory.setStackInSlot(slot, newStack.id, newStack.count, newStack.damage, newStack.tag);
                    this.heldItem = {id: 0, count: 0, damage: 0, tag: {}};
                } else if (targetStack.id === this.heldItem.id && JSON.stringify(targetStack.tag) === JSON.stringify(this.heldItem.tag)) {
                    let block = Block.getById(targetStack.id);
                    let maxStack = block ? block.maxStackSize : 64;
                    let space = maxStack - targetStack.count;
                    let toAdd = Math.min(space, this.heldItem.count);
                    targetStack.count += toAdd;
                    this.heldItem.count -= toAdd;
                    if (isChest) this.chestItems[slot - 100] = targetStack;
                    else this.player.inventory.setStackInSlot(slot, targetStack.id, targetStack.count, targetStack.damage, targetStack.tag);
                    if (this.heldItem.count <= 0) this.heldItem = {id: 0, count: 0, damage: 0, tag: {}};
                } else {
                    let temp = {id: targetStack.id, count: targetStack.count, damage: targetStack.damage || 0, tag: targetStack.tag || {}};
                    if (isChest) this.chestItems[slot - 100] = {id: this.heldItem.id, count: this.heldItem.count, damage: this.heldItem.damage || 0, tag: this.heldItem.tag || {}};
                    else this.player.inventory.setStackInSlot(slot, this.heldItem.id, this.heldItem.count, this.heldItem.damage, this.heldItem.tag);
                    this.heldItem = temp;
                }
            }
        } else if (mouseButton === 2) { // Right Click (Split / Place One)
            if (this.heldItem.id === 0) {
                if (targetStack.id !== 0) {
                    // Split stack in half
                    let half = Math.ceil(targetStack.count / 2);
                    this.heldItem = {id: targetStack.id, count: half, damage: targetStack.damage || 0, tag: targetStack.tag || {}};
                    targetStack.count -= half;
                    if (targetStack.count <= 0) {
                        if (isChest) this.chestItems[slot - 100] = {id: 0, count: 0, damage: 0, tag: {}};
                        else this.player.inventory.setStackInSlot(slot, 0, 0);
                    } else {
                        if (!isChest) this.player.inventory.setStackInSlot(slot, targetStack.id, targetStack.count, targetStack.damage, targetStack.tag);
                    }
                }
            } else {
                // Place one item
                if (targetStack.id === 0) {
                    let single = {id: this.heldItem.id, count: 1, damage: this.heldItem.damage || 0, tag: this.heldItem.tag || {}};
                    if (isChest) this.chestItems[slot - 100] = single;
                    else this.player.inventory.setStackInSlot(slot, single.id, single.count, single.damage, single.tag);
                    this.heldItem.count--;
                } else if (targetStack.id === this.heldItem.id && targetStack.count < 64 && JSON.stringify(targetStack.tag) === JSON.stringify(this.heldItem.tag)) {
                    targetStack.count++;
                    if (!isChest) this.player.inventory.setStackInSlot(slot, targetStack.id, targetStack.count, targetStack.damage, targetStack.tag);
                    this.heldItem.count--;
                }
                if (this.heldItem.count <= 0) this.heldItem = {id: 0, count: 0, damage: 0, tag: {}};
            }
        }

        // Push the change out immediately rather than hoarding it until close.
        this.saveAndSync();
    }

    onClose() {
        // Play chest close sound
        this.minecraft.soundManager.playSound("chest.close", this.chestX + 0.5, this.chestY + 0.5, this.chestZ + 0.5, 0.5, 1.0);

        // Return held item
        if (this.heldItem.id !== 0) {
            let remainder = this.player.inventory.addItemStack(this.heldItem);
            if (remainder > 0) {
                for (let k = 0; k < remainder; k++) {
                    this.player.dropItem({id: this.heldItem.id, count: 1});
                }
            }
            this.heldItem = {id: 0, count: 0};
        }

        this.saveAndSync();
    }

    /**
     * Writes the chest back and tells everyone else.
     *
     * This used to happen only in onClose(), which meant contents were
     * invisible to other players until you shut the lid, and whoever closed
     * last silently overwrote the other person's changes. It now runs on
     * every slot interaction.
     */
    saveAndSync() {
        // Determine primary/secondary based on coordinates again
        let te1 = this.world.getTileEntity(this.chestX, this.chestY, this.chestZ) || {items: []};
        let te2 = null;
        let isPrimary = true;
        
        if (this.neighborChest) {
            te2 = this.world.getTileEntity(this.neighborChest.x, this.neighborChest.y, this.neighborChest.z) || {items: []};
            let isNeighborPrimary = (this.neighborChest.x < this.chestX) || (this.neighborChest.z < this.chestZ);
            if (isNeighborPrimary) isPrimary = false;
        }

        if (isPrimary) {
            te1.items = this.chestItems.slice(0, 27).map(it => ({id: it.id, count: it.count, damage: it.damage || 0, tag: it.tag || {}}));
            if (te2) te2.items = this.chestItems.slice(27, 54).map(it => ({id: it.id, count: it.count, damage: it.damage || 0, tag: it.tag || {}}));
        } else {
            // te1 is secondary (27-53)
            te2.items = this.chestItems.slice(0, 27).map(it => ({id: it.id, count: it.count, damage: it.damage || 0, tag: it.tag || {}}));
            te1.items = this.chestItems.slice(27, 54).map(it => ({id: it.id, count: it.count, damage: it.damage || 0, tag: it.tag || {}}));
        }

        this.world.setTileEntity(this.chestX, this.chestY, this.chestZ, te1);
        if (te2) this.world.setTileEntity(this.neighborChest.x, this.neighborChest.y, this.neighborChest.z, te2);

        // Sync with Multiplayer
        if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected) {
            this.minecraft.multiplayer.onTileEntityChanged(this.chestX, this.chestY, this.chestZ, te1);
            if (te2) {
                this.minecraft.multiplayer.onTileEntityChanged(this.neighborChest.x, this.neighborChest.y, this.neighborChest.z, te2);
            }
        }
    }

    /**
     * A remote player changed this chest while we have it open. Without this
     * the open screen kept showing stale contents and then overwrote the
     * other player's change on the next interaction.
     */
    onTileEntityUpdated(x, y, z, data) {
        const isThis = (x === this.chestX && y === this.chestY && z === this.chestZ);
        const isNeighbor = !!this.neighborChest && x === this.neighborChest.x &&
                           y === this.neighborChest.y && z === this.neighborChest.z;
        if (!isThis && !isNeighbor) return;
        if (!data || !Array.isArray(data.items)) return;

        const blank = () => ({ id: 0, count: 0, damage: 0, tag: {} });
        // Mirror the primary/secondary split that init() uses.
        let primaryIsThis = true;
        if (this.neighborChest) {
            primaryIsThis = !((this.neighborChest.x < this.chestX) || (this.neighborChest.z < this.chestZ));
        }
        const base = (isThis === primaryIsThis) ? 0 : 27;
        for (let i = 0; i < 27; i++) {
            this.chestItems[base + i] = data.items[i] || blank();
        }
    }

    keyTyped(key, character) {
        if (key === this.minecraft.settings.inventory || key === "Escape") {
            this.minecraft.displayScreen(null);
            return true;
        }
        return super.keyTyped(key, character);
    }
}
