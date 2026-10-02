import GuiScreen from "../GuiScreen.js";
import Block from "../../world/block/Block.js";
import GuiTextField from "../widgets/GuiTextField.js";

export default class GuiAnvil extends GuiScreen {

    constructor(player, x, y, z) {
        super();
        this.player = player;
        this.world = player.world;
        this.posX = x;
        this.posY = y;
        this.posZ = z;
        
        this.inputSlots = [ {id:0, count:0, tag:{}}, {id:0, count:0, tag:{}} ];
        this.outputSlot = {id:0, count:0, tag:{}};
        this.heldItem = {id: 0, count: 0, tag:{}};
        
        this.renameText = "";
    }

    init() {
        super.init();
        this.inventoryBackground = this.getTexture("../../inventoryUIborder.png");
        this.inventorySlot = this.getTexture("../../inventoryslot.png");
        this.arrow = this.getTexture("../../arrow_0_0.png");

        this.inventoryWidth = 176;
        this.inventoryHeight = 166;
        this.guiLeft = (this.width - this.inventoryWidth) / 2;
        this.guiTop = (this.height - this.inventoryHeight) / 2;

        // Rename Field - Centered at the top
        this.renameField = new GuiTextField(this.guiLeft + 36, this.guiTop + 24, 103, 12);
        this.renameField.maxLength = 30;
        this.renameField.text = this.renameText;
        this.buttonList.push(this.renameField);
    }

    doesGuiPauseGame() {
        return false;
    }

    updateScreen() {
        super.updateScreen();
        if (this.renameField) {
            if (this.renameField.getText() !== this.renameText) {
                this.renameText = this.renameField.getText();
                this.updateOutput();
            }
        }
    }

    updateOutput() {
        const left = this.inputSlots[0];
        const right = this.inputSlots[1];

        if (left.id === 0) {
            this.outputSlot = {id: 0, count: 0, tag: {}};
            return;
        }

        // Clone left item as base for output
        let result = {
            id: left.id,
            count: left.count,
            damage: left.damage || 0,
            tag: JSON.parse(JSON.stringify(left.tag || {}))
        };

        let changed = false;

        // 1. Renaming Logic
        if (this.renameText.length > 0) {
            const originalName = Block.getById(left.id).name || "Item";
            if (this.renameText !== originalName) {
                result.tag.name = this.renameText;
                changed = true;
            } else if (result.tag.name) {
                delete result.tag.name;
                changed = true;
            }
        } else if (result.tag.name) {
            delete result.tag.name;
            changed = true;
        }

        // 2. Enchanting Logic
        if (right.id !== 0) {
            const rightBlock = Block.getById(right.id);
            const leftBlock = Block.getById(left.id);

            // Determine valid pool for the item
            const pools = {
                "armor": ["protection", "fire_protection", "blast_protection", "projectile_protection", "thorns", "unbreaking"],
                "boots": ["feather_falling", "depth_strider", "frost_walker"],
                "sword": ["sharpness", "smite", "bane_of_arthropods", "knockback", "fire_aspect", "looting", "unbreaking"],
                "tool": ["efficiency", "silk_touch", "fortune", "unbreaking"],
                "bow": ["power", "punch", "flame", "infinity", "unbreaking"],
                "crossbow": ["quick_charge", "piercing", "multishot", "unbreaking"],
                "fishing_rod": ["luck_of_the_sea", "lure", "unbreaking"]
            };

            let itemPool = [];
            if (left.id === 346) itemPool = pools.fishing_rod;
            else if (left.id === 261) itemPool = pools.bow;
            else if (left.id === 499) itemPool = pools.crossbow;
            else if ([267, 268, 272, 276, 283].includes(left.id)) itemPool = pools.sword;
            else if ([256, 257, 258, 269, 270, 271, 273, 274, 275, 277, 278, 279, 284, 285, 286, 290, 291, 292, 293, 294].includes(left.id)) itemPool = pools.tool;
            else if (leftBlock && leftBlock.armorType !== undefined) {
                itemPool = [...pools.armor];
                if (leftBlock.armorType === 3) itemPool.push(...pools.boots);
            }

            // Apply Enchanted Book
            if (rightBlock && rightBlock.enchantments) {
                const bookEnchants = rightBlock.enchantments;
                result.tag.enchantments = result.tag.enchantments || {};
                
                for (let enchId in bookEnchants) {
                    // Whitelist check
                    if (!itemPool.includes(enchId)) continue;

                    const currentLv = result.tag.enchantments[enchId] || 0;
                    const bookLv = bookEnchants[enchId];
                    result.tag.enchantments[enchId] = Math.max(currentLv, bookLv);
                    changed = true;
                }
                if (changed) result.tag.enchanted = true;
            } else if (right.id === left.id) {
                // Repair Logic: combine durability
                const block = Block.getById(left.id);
                if (block.maxDamage > 0) {
                    let repairAmount = (block.maxDamage - right.damage) + Math.floor(block.maxDamage * 0.12);
                    result.damage = Math.max(0, result.damage - repairAmount);
                    
                    // Merge enchantments too
                    if (right.tag && right.tag.enchantments) {
                        result.tag.enchantments = result.tag.enchantments || {};
                        for (let enchId in right.tag.enchantments) {
                            result.tag.enchantments[enchId] = Math.max(result.tag.enchantments[enchId] || 0, right.tag.enchantments[enchId]);
                        }
                        result.tag.enchanted = true;
                    }
                    changed = true;
                }
            }
        }

        if (changed || right.id !== 0) {
            this.outputSlot = result;
        } else {
            this.outputSlot = {id: 0, count: 0, tag: {}};
        }
    }

    consumeInputs() {
        this.inputSlots[0] = {id: 0, count: 0, tag: {}};
        this.inputSlots[1] = {id: 0, count: 0, tag: {}};
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawRect(stack, 0, 0, this.width, this.height, 'black', 0.6);
        this.drawSprite(stack, this.inventoryBackground, 0, 0, 176, 166, this.guiLeft, this.guiTop, 176, 166);
        
        // Draw labels
        this.drawStringNoShadow(stack, "Repair & Name", this.guiLeft + 60, this.guiTop + 6, 0x404040);
        this.drawStringNoShadow(stack, "Inventory", this.guiLeft + 8, this.guiTop + 72, 0x404040);

        // Input Slots
        this.drawSlot(stack, this.guiLeft + 27, this.guiTop + 47, 100);
        this.drawSlot(stack, this.guiLeft + 76, this.guiTop + 47, 101);

        // Plus symbol - shifted down slightly to align with slots
        this.drawCenteredStringNoShadow(stack, "+", this.guiLeft + 59, this.guiTop + 51, 0x404040);

        // Arrow
        this.drawSprite(stack, this.arrow, 0, 0, 22, 15, this.guiLeft + 102, this.guiTop + 48, 22, 15);

        // Output Slot
        this.drawSlot(stack, this.guiLeft + 134, this.guiTop + 47, 102);

        // Inventory
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                this.drawSlot(stack, this.guiLeft + 8 + col * 18, this.guiTop + 84 + row * 18, col + row * 9 + 9);
            }
        }
        for (let i = 0; i < 9; i++) {
            this.drawSlot(stack, this.guiLeft + 8 + i * 18, this.guiTop + 142, i);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);

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
        let mouseX = this.minecraft.window.mouseX;
        let mouseY = this.minecraft.window.mouseY;
        if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
            this.drawRect(stack, x, y, x + 16, y + 16, "rgba(255, 255, 255, 0.3)");
        }

        let item = (index >= 100) ? (index === 102 ? this.outputSlot : this.inputSlots[index - 100]) : this.player.inventory.getStackInSlot(index);
        const prefix = (this.playerIdx === 1 ? "p2_" : "p1_");
        let renderId = prefix + "anvil_slot_" + index;
        if (item && item.id !== 0) {
            this.minecraft.itemRenderer.renderItemInGui(renderId, Block.getById(item.id), x + 8, y + 8, 10, 1.0, 0, item.tag);
        } else if (this.minecraft.itemRenderer.items[renderId]) {
            this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items[renderId].group);
            delete this.minecraft.itemRenderer.items[renderId];
        }
    }

    drawForeground(stack, mouseX, mouseY, partialTicks) {
        this.drawSlotForeground(stack, this.guiLeft + 27, this.guiTop + 47, 100);
        this.drawSlotForeground(stack, this.guiLeft + 76, this.guiTop + 47, 101);
        this.drawSlotForeground(stack, this.guiLeft + 134, this.guiTop + 47, 102);

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                this.drawSlotForeground(stack, this.guiLeft + 8 + col * 18, this.guiTop + 84 + row * 18, col + row * 9 + 9);
            }
        }
        for (let i = 0; i < 9; i++) {
            this.drawSlotForeground(stack, this.guiLeft + 8 + i * 18, this.guiTop + 142, i);
        }

        // Draw Tooltip
        let slot = this.getSlotAt(mouseX, mouseY);
        if (slot !== -1) {
            let item = (slot >= 100) ? (slot === 102 ? this.outputSlot : this.inputSlots[slot - 100]) : this.player.inventory.getStackInSlot(slot);
            if (item && item.id !== 0) {
                let block = Block.getById(item.id);
                if (block) {
                    let name = block.name || "Item";
                    if (item.tag && item.tag.name) name = item.tag.name;
                    this.drawTooltip(stack, name, mouseX, mouseY);
                }
            }
        }
    }

    drawTooltip(stack, text, x, y) {
        let width = this.getStringWidth(stack, text);
        let height = 12;
        this.drawRect(stack, x + 12, y - 12, x + 12 + width + 8, y - 12 + height + 4, "rgba(16, 0, 16, 0.9)");
        this.drawString(stack, text, x + 16, y - 8, 0xFFFFFF);
    }

    drawSlotForeground(stack, x, y, index) {
        let item = (index >= 100) ? (index === 102 ? this.outputSlot : this.inputSlots[index - 100]) : this.player.inventory.getStackInSlot(index);
        if (item && item.id !== 0) {
            let block = Block.getById(item.id);
            if (item.count > 1) this.drawRightString(stack, "" + item.count, x + 17, y + 9, 0xFFFFFF);
            if (block && block.maxDamage > 0 && item.damage > 0) this.drawDurabilityBar(stack, x, y, item.damage, block.maxDamage);
        }
    }

    getSlotAt(mx, my) {
        if (this.isOver(mx, my, this.guiLeft + 27, this.guiTop + 47)) return 100;
        if (this.isOver(mx, my, this.guiLeft + 76, this.guiTop + 47)) return 101;
        if (this.isOver(mx, my, this.guiLeft + 134, this.guiTop + 47)) return 102;
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

    keyTyped(key, character) {
        if (key === "Escape") {
            this.minecraft.displayScreen(null);
            return true;
        }

        if (this.renameField && this.renameField.isFocused) {
            return super.keyTyped(key, character);
        }

        if (key === this.minecraft.settings.inventory) {
            this.minecraft.displayScreen(null);
            return true;
        }
        
        return super.keyTyped(key, character);
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        super.mouseClicked(mouseX, mouseY, mouseButton);
        let slot = this.getSlotAt(mouseX, mouseY);

        // Check if clicking the rename field itself
        const overField = mouseX >= this.renameField.x && mouseX < this.renameField.x + this.renameField.width &&
                        mouseY >= this.renameField.y && mouseY < this.renameField.y + this.renameField.height;

        if (slot === -1 && !overField) {
            // Unfocus rename field if clicking elsewhere
            if (this.renameField) this.renameField.isFocused = false;
            return;
        }

        if (mouseButton === 0) {
            if (slot === 102) { // Take Output
                if (this.outputSlot.id !== 0 && this.heldItem.id === 0) {
                    this.heldItem = JSON.parse(JSON.stringify(this.outputSlot));
                    this.consumeInputs();
                    this.updateOutput();
                    this.minecraft.soundManager.playSound("random.anvil_use", this.posX, this.posY, this.posZ, 1.0, 1.0);
                }
                return;
            }

            let targetStack = (slot >= 100) ? this.inputSlots[slot - 100] : this.player.inventory.getStackInSlot(slot);

            if (this.heldItem.id === 0) {
                if (targetStack.id !== 0) {
                    this.heldItem = {
                        id: targetStack.id,
                        count: targetStack.count,
                        damage: targetStack.damage || 0,
                        tag: JSON.parse(JSON.stringify(targetStack.tag || {}))
                    };
                    if (slot >= 100) this.inputSlots[slot - 100] = {id: 0, count: 0, tag: {}};
                    else this.player.inventory.setStackInSlot(slot, 0, 0);
                }
            } else {
                if (targetStack.id === 0) {
                    if (slot >= 100) this.inputSlots[slot - 100] = JSON.parse(JSON.stringify(this.heldItem));
                    else this.player.inventory.setStackInSlot(slot, this.heldItem.id, this.heldItem.count, this.heldItem.damage, this.heldItem.tag);
                    this.heldItem = {id: 0, count: 0, tag: {}};
                } else {
                    let tmp = {
                        id: targetStack.id,
                        count: targetStack.count,
                        damage: targetStack.damage || 0,
                        tag: JSON.parse(JSON.stringify(targetStack.tag || {}))
                    };
                    if (slot >= 100) this.inputSlots[slot - 100] = JSON.parse(JSON.stringify(this.heldItem));
                    else this.player.inventory.setStackInSlot(slot, this.heldItem.id, this.heldItem.count, this.heldItem.damage, this.heldItem.tag);
                    this.heldItem = tmp;
                }
            }
            this.updateOutput();
        }
    }

    onClose() {
        if (this.heldItem.id !== 0) this.player.inventory.addItemStack(this.heldItem);
        if (this.inputSlots[0].id !== 0) this.player.inventory.addItemStack(this.inputSlots[0]);
        if (this.inputSlots[1].id !== 0) this.player.inventory.addItemStack(this.inputSlots[1]);
    }
}