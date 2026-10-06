import GuiScreen from "../GuiScreen.js";
import Block from "../../world/block/Block.js";
import GuiInventory from "./GuiInventory.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";

export default class GuiVillager extends GuiScreen {

    constructor(player, villager) {
        super();
        this.player = player;
        this.villager = villager;
        this.inventory = player.inventory;
        
        // Trade Slots: 0=Input1, 1=Input2, 2=Output
        this.tradeSlots = [ {id:0, count:0}, {id:0, count:0}, {id:0, count:0} ];
        this.heldItem = {id: 0, count: 0};

        // Get trades from the villager entity so they are persistent
        this.trades = this.villager.getTrades();
        
        this.selectedTradeIndex = 0;
    }

    init() {
        super.init();
        this.inventoryBackground = this.getTexture("../../inventoryUIborder.png");
        this.inventorySlot = this.getTexture("../../inventoryslot.png");
        this.inventoryUIBorder = this.getTexture("../../inventoryUIborder.png");
        this.arrow = this.getTexture("../../arrow_0_0.png");
        this.textureGui = this.getTexture("gui/gui.png");

        // UI Size: Left Panel (100) + Inventory Panel (176) + Gap (4) = 280
        this.panelWidth = 280;
        this.panelHeight = 166;
        
        this.guiLeft = (this.width - this.panelWidth) / 2;
        this.guiTop = (this.height - this.panelHeight) / 2;
        
        this.leftPanelX = this.guiLeft;
        this.rightPanelX = this.guiLeft + 104; // 100px left panel + 4px gap
        
        this.updateTradeOutput();
    }

    doesGuiPauseGame() {
        return false;
    }

    updateTradeOutput() {
        const trade = this.trades[this.selectedTradeIndex];
        const in1 = this.tradeSlots[0];
        const in2 = this.tradeSlots[1];
        
        // Check if inputs match
        let match = true;
        if (in1.id !== trade.in1.id || in1.count < trade.in1.count) match = false;
        
        // If trade has second input (not impl yet but structure is there), check it too
        if (trade.in2) {
            if (in2.id !== trade.in2.id || in2.count < trade.in2.count) match = false;
        }

        if (match) {
            this.tradeSlots[2] = {id: trade.out.id, count: trade.out.count};
        } else {
            this.tradeSlots[2] = {id: 0, count: 0};
        }
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawRect(stack, 0, 0, this.width, this.height, 'black', 0.6);

        // Draw Left Panel (Trades List)
        if (this.inventoryUIBorder) {
            this.drawSprite(stack, this.inventoryUIBorder, 0, 0, this.inventoryUIBorder.width, this.inventoryUIBorder.height, this.leftPanelX, this.guiTop, 100, this.panelHeight);
        } else {
            this.drawRect(stack, this.leftPanelX, this.guiTop, this.leftPanelX + 100, this.guiTop + this.panelHeight, "#C6C6C6");
        }

        // Draw title without shadow to match style and avoid "duplication" look
        this.drawStringNoShadow(stack, "Trades", this.leftPanelX + 8, this.guiTop + 6, 0x404040);

        // Draw Trades List Buttons
        let startY = this.guiTop + 20;
        for(let i = 0; i < this.trades.length; i++) {
            let t = this.trades[i];
            let y = startY + i * 24;
            let selected = (i === this.selectedTradeIndex);
            
            // Draw Button Background
            let btnX = this.leftPanelX + 2;
            let btnY = y;
            let btnW = 96;
            let btnH = 22;
            
            // Texture coordinates for button in gui.png
            // Normal: y=66, Hover/Selected: y=86
            let spriteY = selected ? 86 : 66;
            
            // Draw left half
            this.drawSprite(stack, this.textureGui, 0, spriteY, btnW / 2, 20, btnX, btnY, btnW / 2, btnH);
            // Draw right half
            this.drawSprite(stack, this.textureGui, 200 - btnW / 2, spriteY, btnW / 2, 20, btnX + btnW / 2, btnY, btnW / 2, btnH);
            
            // Draw input item
            let blockIn = Block.getById(t.in1.id);
            this.minecraft.itemRenderer.renderItemInGui("trade_list_in_" + i, blockIn, this.leftPanelX + 6 + 9, y + 3 + 9, 10, 1.0);
            if (t.in1.count > 1) {
                this.drawRightString(stack, "" + t.in1.count, this.leftPanelX + 6 + 17, y + 3 + 9, 0xFFFFFF);
            }
            
            // Draw arrow
            if (this.arrow) {
                this.drawSprite(stack, this.arrow, 0, 0, this.getTextureWidth(this.arrow, 22), this.getTextureHeight(this.arrow, 15), this.leftPanelX + 40, y + 6, 16, 10);
            } else {
                this.drawString(stack, "->", this.leftPanelX + 42, y + 7, 0xFFFFFF);
            }
            
            // Draw output item
            let blockOut = Block.getById(t.out.id);
            this.minecraft.itemRenderer.renderItemInGui("trade_list_out_" + i, blockOut, this.leftPanelX + 74 + 9, y + 3 + 9, 10, 1.0);
            if (t.out.count > 1) {
                this.drawRightString(stack, "" + t.out.count, this.leftPanelX + 74 + 17, y + 3 + 9, 0xFFFFFF);
            }
        }

        // Draw Right Panel (Inventory + Trading Slots)
        this.drawSprite(stack, this.inventoryBackground, 0, 0, 176, 166, this.rightPanelX, this.guiTop, 176, 166);
        
        this.drawStringNoShadow(stack, "Villager", this.rightPanelX + 60, this.guiTop + 6, 0x404040);
        this.drawStringNoShadow(stack, "Inventory", this.rightPanelX + 8, this.guiTop + 72, 0x404040);

        // Trading Slots Area (Overlaying standard top part)
        // Slot 1 Input
        let slot1X = this.rightPanelX + 36;
        let slot1Y = this.guiTop + 36;
        this.drawSlot(stack, slot1X, slot1Y, 100); // ID 100
        
        // Slot 2 Input (Optional, visually there)
        let slot2X = this.rightPanelX + 62;
        let slot2Y = this.guiTop + 36;
        this.drawSlot(stack, slot2X, slot2Y, 101); // ID 101

        // Arrow
        this.drawSprite(stack, this.arrow, 0, 0, 22, 15, this.rightPanelX + 86, this.guiTop + 36, 22, 15);

        // Output Slot
        let slotOutX = this.rightPanelX + 116;
        let slotOutY = this.guiTop + 34;
        // Draw a larger slot background if possible or just standard
        this.drawSlot(stack, slotOutX, slotOutY, 102); // ID 102

        // Player Inventory (9-35)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                let x = this.rightPanelX + 8 + col * 18;
                let y = this.guiTop + 84 + row * 18;
                this.drawSlot(stack, x, y, col + row * 9 + 9);
            }
        }
        // Hotbar (0-8)
        for (let i = 0; i < 9; i++) {
            let x = this.rightPanelX + 8 + i * 18;
            let y = this.guiTop + 142;
            this.drawSlot(stack, x, y, i);
        }

        // Held Item
        if (this.heldItem && this.heldItem.id !== 0) {
            let block = Block.getById(this.heldItem.id);
            if (block) {
                this.minecraft.itemRenderer.renderItemInGui("held_item", block, mouseX, mouseY, 10, 1.0, 30);
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
        
        let item;
        if (index >= 100) item = this.tradeSlots[index - 100];
        else item = this.inventory.getStackInSlot(index);

        const prefix = (this.playerIdx === 1 ? "p2_" : "p1_");
        let renderId = prefix + "villager_slot_" + index;
        if (item && item.id !== 0) {
            let block = Block.getById(item.id);
            // Center item in 18x18 slot
            this.minecraft.itemRenderer.renderItemInGui(renderId, block, x + 8, y + 8, 10, 1.0);
            
            if (block.maxDamage > 0) {
                this.drawDurabilityBar(stack, x, y, item.damage, block.maxDamage);
            }

            if (item.count > 1) this.drawRightString(stack, "" + item.count, x + 17, y + 9, 0xFFFFFF);
        } else {
            if (this.minecraft.itemRenderer.items[renderId]) {
                this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items[renderId].group);
                delete this.minecraft.itemRenderer.items[renderId];
            }
        }
    }

    getSlotAt(mx, my) {
        // Trade Inputs
        if (this.isOver(mx, my, this.rightPanelX + 36, this.guiTop + 36)) return 100;
        if (this.isOver(mx, my, this.rightPanelX + 62, this.guiTop + 36)) return 101;
        if (this.isOver(mx, my, this.rightPanelX + 116, this.guiTop + 34)) return 102;

        // Inventory
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.isOver(mx, my, this.rightPanelX + 8 + col * 18, this.guiTop + 84 + row * 18)) return col + row * 9 + 9;
            }
        }
        // Hotbar
        for (let i = 0; i < 9; i++) {
            if (this.isOver(mx, my, this.rightPanelX + 8 + i * 18, this.guiTop + 142)) return i;
        }
        
        return -1;
    }

    isOver(mx, my, x, y) {
        return mx >= x && mx < x + 18 && my >= y && my < y + 18;
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        super.mouseClicked(mouseX, mouseY, mouseButton);
        
        // Check Trade List Click
        if (mouseX >= this.leftPanelX && mouseX <= this.leftPanelX + 100) {
            let startY = this.guiTop + 20;
            for(let i = 0; i < this.trades.length; i++) {
                let y = startY + i * 24;
                if (mouseY >= y && mouseY < y + 24) {
                    this.selectedTradeIndex = i;
                    this.updateTradeOutput();
                    // Should we return inputs to inventory if switching trade? Standard MC does not clear slots.
                    // We will check if current items fit new trade.
                    // Actually standard MC keeps items.
                    return;
                }
            }
        }

        if (mouseButton === 0) {
            let slot = this.getSlotAt(mouseX, mouseY);
            if (slot !== -1) {
                // Handle Output Slot
                if (slot === 102) {
                    if (this.tradeSlots[2].id !== 0) {
                        if (this.heldItem.id === 0) {
                            // Take output
                            this.minecraft.stats.villagersTraded++;
                            this.villager.playMobSound("haggle");
                            this.heldItem = {id: this.tradeSlots[2].id, count: this.tradeSlots[2].count};

                            // Check The Haggler achievement (388 = Emerald)
                            if (this.heldItem.id === 388 && this.heldItem.count > 3) {
                                this.minecraft.achievementManager.grant('thehaggler');
                            }

                            this.consumeTradeInputs();
                            this.updateTradeOutput();
                        } else if (this.heldItem.id === this.tradeSlots[2].id) {
                            if (this.heldItem.count + this.tradeSlots[2].count <= 64) {
                                this.heldItem.count += this.tradeSlots[2].count;
                                this.consumeTradeInputs();
                                this.updateTradeOutput();
                            }
                        }
                    }
                    return;
                }

                let targetStack;
                if (slot >= 100) targetStack = this.tradeSlots[slot - 100];
                else targetStack = this.inventory.getStackInSlot(slot);

                // Standard Swap Logic
                if (this.heldItem.id === 0) {
                    if (targetStack.id !== 0) {
                        this.heldItem = {id: targetStack.id, count: targetStack.count};
                        if (slot >= 100) this.tradeSlots[slot - 100] = {id: 0, count: 0};
                        else this.inventory.setStackInSlot(slot, 0, 0);
                    }
                } else {
                    if (targetStack.id === 0) {
                        if (slot >= 100) this.tradeSlots[slot - 100] = this.heldItem;
                        else this.inventory.setStackInSlot(slot, this.heldItem.id, this.heldItem.count);
                        this.heldItem = {id: 0, count: 0};
                    } else if (targetStack.id === this.heldItem.id) {
                        let space = 64 - targetStack.count;
                        let toAdd = Math.min(space, this.heldItem.count);
                        targetStack.count += toAdd;
                        this.heldItem.count -= toAdd;
                        if (this.heldItem.count <= 0) this.heldItem = {id: 0, count: 0};
                        
                        if (slot >= 100) this.tradeSlots[slot - 100] = targetStack;
                        else this.inventory.setStackInSlot(slot, targetStack.id, targetStack.count);
                    } else {
                        let temp = {id: targetStack.id, count: targetStack.count};
                        if (slot >= 100) this.tradeSlots[slot - 100] = this.heldItem;
                        else this.inventory.setStackInSlot(slot, this.heldItem.id, this.heldItem.count);
                        this.heldItem = temp;
                    }
                }
                this.updateTradeOutput();
            }
        }
    }

    consumeTradeInputs() {
        let trade = this.trades[this.selectedTradeIndex];
        
        // Input 1
        if (this.tradeSlots[0].id === trade.in1.id) {
            this.tradeSlots[0].count -= trade.in1.count;
            if (this.tradeSlots[0].count <= 0) this.tradeSlots[0] = {id:0, count:0};
        }
        // Input 2 (if applicable)
        if (trade.in2 && this.tradeSlots[1].id === trade.in2.id) {
            this.tradeSlots[1].count -= trade.in2.count;
            if (this.tradeSlots[1].count <= 0) this.tradeSlots[1] = {id:0, count:0};
        }
    }

    onClose() {
        // Return held item
        if (this.heldItem.id !== 0) {
            this.player.inventory.addItemStack(this.heldItem);
        }
        // Return items in trade slots
        if (this.tradeSlots[0].id !== 0) this.player.inventory.addItemStack(this.tradeSlots[0]);
        if (this.tradeSlots[1].id !== 0) this.player.inventory.addItemStack(this.tradeSlots[1]);
    }

    keyTyped(key, character) {
        if (key === "KeyE" || key === "Escape") {
            if (this.villager) this.villager.playMobSound("haggle");
            this.minecraft.displayScreen(null);
            return true;
        }
        return super.keyTyped(key, character);
    }
}

