import GuiScreen from "../GuiScreen.js";
import Block from "../../world/block/Block.js";
import Crafting from "../../crafting/Crafting.js";
import Keyboard from "../../../util/Keyboard.js";
import GuiTextField from "../widgets/GuiTextField.js";

export default class GuiCraftingTable extends GuiScreen {

    constructor(player) {
        super();
        this.player = player;
        this.inventory = player.inventory;
        // 3x3 input (9) + 1 output = 10 slots
        this.craftingItems = new Array(10).fill(null).map(() => ({id: 0, count: 0}));

        this.heldItem = {id: 0, count: 0};
        this.heldItemOriginalSlot = -1;

        // Recipe Book state
        this.bookVisible = true; // Always visible as requested
        this.searchQuery = "";
        this.selectedCategory = "all";
        this.onlyCraftable = false;
        this.recipeScroll = 0;
        this.filteredRecipes = [];
    }

    init() {
        super.init();
        this.inventoryBackground = this.getTexture("../../inventoryUIborder.png");
        this.inventorySlot = this.getTexture("../../inventoryslot.png");
        this.arrow = this.getTexture("../../arrow_0_0.png");
        this.bookTexture = this.getTexture("../../recipe_book.png");

        this.inventoryWidth = 176;
        this.inventoryHeight = 166;
        this.bookWidth = 147; 
        this.panelGap = 2;

        this.totalWidth = this.bookWidth + this.panelGap + this.inventoryWidth;
        this.guiLeft = (this.width - this.totalWidth) / 2;
        this.guiTop = (this.height - this.inventoryHeight) / 2; // Centered vertically

        this.updateFilteredRecipes();

        // Search field moved a little right as requested
        this.searchField = new GuiTextField(this.guiLeft + 28, this.guiTop + 14, 76, 12);
        this.searchField.text = this.searchQuery;
        this.buttonList.push(this.searchField);

        // Atlas coordinates from prompt
        this.atlas = {
            mainsearch: { x: 1, y: 1, w: 147, h: 166 },
            sidebuttonnotselected: { x: 153, y: 2, w: 30, h: 26 },
            sidebuttonselected: { x: 188, y: 2, w: 35, h: 26 },
            craftableno: { x: 152, y: 41, w: 26, h: 16 },
            craftablenohover: { x: 152, y: 59, w: 26, h: 16 },
            craftableyes: { x: 180, y: 41, w: 26, h: 16 },
            craftableyeshover: { x: 180, y: 59, w: 26, h: 16 },
            searchbutton: { x: 10, y: 13, w: 12, h: 12 },
            next: { x: 1, y: 208, w: 11, h: 17 },
            nexthover: { x: 1, y: 226, w: 11, h: 17 },
            back: { x: 15, y: 208, w: 11, h: 17 },
            backhover: { x: 15, y: 226, w: 11, h: 17 }
        };
    }

    updateFilteredRecipes() {
        const allRecipes = Crafting.recipes;
        const seenOutputs = new Set();
        
        // Filter and deduplicate (show each output once in the book)
        this.filteredRecipes = allRecipes.filter(recipe => {
            if (this.onlyCraftable && !this.isRecipeCraftable(recipe)) return false;

            const block = Block.getById(recipe.output.id);
            if (!block || seenOutputs.has(recipe.output.id)) return false;
            
            const name = (block.name || "Unknown").toLowerCase();
            const matchesSearch = name.includes(this.searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            if (this.selectedCategory === "all") {
                seenOutputs.add(recipe.output.id);
                return true;
            }
            
            // Basic categorization logic
            const type = block.getRenderType();
            let matchesCat = false;
            if (this.selectedCategory === "blocks") matchesCat = (type === 0 || type === 10 || type === 12 || type === 26 || type === 19);
            if (this.selectedCategory === "tools") matchesCat = (type === 7 || block.maxDamage > 0);
            if (this.selectedCategory === "food") matchesCat = [260, 297, 364, 366, 320, 350, 355, 404, 406, 423, 422].includes(block.id);
            
            if (matchesCat) {
                seenOutputs.add(recipe.output.id);
                return true;
            }
            return false;
        });
    }

    isRecipeCraftable(recipe) {
        // Collect current inventory + input grid resources
        const counts = {};
        const items = [...this.inventory.items, ...this.craftingItems.slice(0, 9)];
        
        for (const item of items) {
            if (item && item.id !== 0) {
                counts[item.id] = (counts[item.id] || 0) + item.count;
            }
        }

        // Requirements from recipe
        const reqs = {};
        for (const id of recipe.shape) {
            if (id !== 0) {
                reqs[id] = (reqs[id] || 0) + 1;
            }
        }

        // Check if we meet all reqs
        for (const id in reqs) {
            const targetId = parseInt(id);
            // Handle wood matching if not strict
            if (!recipe.strict) {
                const planks = [5, 201, 210, 304, 305];
                const logs = [17, 200, 209, 235, 253];
                
                let available = 0;
                if (planks.includes(targetId)) {
                    for (let p of planks) available += (counts[p] || 0);
                } else if (logs.includes(targetId)) {
                    for (let l of logs) available += (counts[l] || 0);
                } else {
                    available = counts[targetId] || 0;
                }
                
                if (available < reqs[id]) return false;
            } else {
                if ((counts[targetId] || 0) < reqs[id]) return false;
            }
        }

        return true;
    }

    updateScreen() {
        super.updateScreen();
        if (this.searchField) {
            if (this.searchField.getText() !== this.searchQuery) {
                this.searchQuery = this.searchField.getText();
                this.updateFilteredRecipes();
                this.recipeScroll = 0;
            }
        }

        // Auto-clear ghost items if the player changes inventory or crafting grid manually
        // (Simplified check: if output is valid, it's not a ghost setup anymore)
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        // Draw transparent background
        this.drawRect(stack, 0, 0, this.width, this.height, 'black', 0.6);

        // Draw Recipe Book
        this.drawRecipeBook(stack, mouseX, mouseY);

        // Draw buttons (including search field)
        super.drawScreen(stack, mouseX, mouseY, partialTicks);

        // Draw inventory background
        const invLeft = this.guiLeft + this.bookWidth + this.panelGap;
        this.drawSprite(stack, this.inventoryBackground, 0, 0, 176, 166, invLeft, this.guiTop, this.inventoryWidth, this.inventoryHeight);

        // Draw labels
        this.drawStringNoShadow(stack, "Crafting", invLeft + 28, this.guiTop + 6, 0x404040);
        this.drawStringNoShadow(stack, "Inventory", invLeft + 8, this.guiTop + 72, 0x404040);

        // Draw 3x3 crafting grid
        let x_craft = invLeft + 30;
        let y_craft = this.guiTop + 17;

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                this.drawSlot(stack, x_craft + col * 18, y_craft + row * 18, 36 + col + row * 3);
            }
        }

        // Arrow
        this.drawSprite(stack, this.arrow, 0, 0, this.getTextureWidth(this.arrow, 22), this.getTextureHeight(this.arrow, 15), x_craft + 60, y_craft + 19, 22, 15);

        // Output
        this.drawSlot(stack, x_craft + 90, y_craft + 19, 45);

        // Draw player inventory slots
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                let x = invLeft + 8 + col * 18;
                let y = this.guiTop + 84 + row * 18;
                this.drawSlot(stack, x, y, col + row * 9 + 9);
            }
        }

        // Hotbar
        for (let i = 0; i < 9; i++) {
            let x = invLeft + 8 + i * 18;
            let y = this.guiTop + 142;
            this.drawSlot(stack, x, y, i);
        }

        // Draw held item
        if (this.heldItem && this.heldItem.id !== 0) {
            let block = Block.getById(this.heldItem.id);
            if (block) {
                this.minecraft.itemRenderer.renderItemInGui("held_item", block, mouseX, mouseY, 10, 1.0, 30, this.heldItem.tag);
                if (this.heldItem.count > 1) {
                    this.drawRightString(stack, "" + this.heldItem.count, mouseX + 8, mouseY + 4, 0xFFFFFF);
                }
            }
        } else if (this.minecraft.itemRenderer.items["held_item"]) {
            this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items["held_item"].group);
            delete this.minecraft.itemRenderer.items["held_item"];
        }
    }

    drawRecipeBook(stack, mouseX, mouseY) {
        let bx = this.guiLeft;
        let by = this.guiTop;
        const a = this.atlas;

        // 1. Main background
        this.drawSprite(stack, this.bookTexture, a.mainsearch.x, a.mainsearch.y, a.mainsearch.w, a.mainsearch.h, bx, by, a.mainsearch.w, a.mainsearch.h);

        // Draw craftable toggle beside search box
        let toggleX = bx + 110;
        let toggleY = by + 12;
        let isToggleHover = mouseX >= toggleX && mouseX < toggleX + a.craftableyes.w && mouseY >= toggleY && mouseY < toggleY + a.craftableyes.h;
        let toggleSprite;
        if (this.onlyCraftable) {
            toggleSprite = isToggleHover ? a.craftableyeshover : a.craftableyes;
        } else {
            toggleSprite = isToggleHover ? a.craftablenohover : a.craftableno;
        }
        this.drawSprite(stack, this.bookTexture, toggleSprite.x, toggleSprite.y, toggleSprite.w, toggleSprite.h, toggleX, toggleY, toggleSprite.w, toggleSprite.h);

        // 2. Tabs (drawn on the left)
        const categories = [
            {id: "all", icon: 45}, 
            {id: "blocks", icon: 1}, 
            {id: "tools", icon: 257}, 
            {id: "food", icon: 260}
        ];
        
        for (let i = 0; i < categories.length; i++) {
            const cat = categories[i];
            const selected = this.selectedCategory === cat.id;
            const tabData = selected ? a.sidebuttonselected : a.sidebuttonnotselected;
            
            const tx = bx - tabData.w + 2; // Slight overlap with main panel
            const ty = by + 20 + i * 27;
            
            this.drawSprite(stack, this.bookTexture, tabData.x, tabData.y, tabData.w, tabData.h, tx, ty, tabData.w, tabData.h);
            
            let block = Block.getById(cat.icon);
            this.minecraft.itemRenderer.renderItemInGui("recipe_cat_" + cat.id, block, tx + tabData.w / 2, ty + tabData.h / 2, 8, 1.0);
        }

        // 3. Recipe Grid
        let rx = bx + 12;
        let ry = by + 34;
        const slotsX = 5; // Updated to 5x5 for better fit
        const slotsY = 5;

        let hoveredRecipe = null;

        for (let i = 0; i < slotsX * slotsY; i++) {
            let col = i % slotsX;
            let row = Math.floor(i / slotsX);
            let slotX = rx + col * 25;
            let slotY = ry + row * 22;
            
            // Visual Index 0-24 on the page
            // recipeScroll is the offset in *rows* (index * 5)
            let recipeIdx = i + (this.recipeScroll * slotsX);

            const isOccupied = recipeIdx < this.filteredRecipes.length;
            let isCraftable = false;
            if (isOccupied) {
                isCraftable = this.isRecipeCraftable(this.filteredRecipes[recipeIdx]);
            }

            const isHovered = mouseX >= slotX && mouseX < slotX + 18 && mouseY >= slotY && mouseY < slotY + 18;
            if (isHovered && isOccupied) {
                hoveredRecipe = this.filteredRecipes[recipeIdx];
            }
            
            // Use normal inventory slot background
            this.drawSprite(stack, this.inventorySlot, 0, 0, 18, 18, slotX, slotY, 18, 18);
            
            // Highlight selectable (craftable) slots with a white glow
            if (isCraftable) {
                this.drawRect(stack, slotX, slotY, slotX + 17, slotY + 17, "rgba(255, 255, 255, 0.45)");
            }

            if (isHovered) {
                this.drawRect(stack, slotX, slotY, slotX + 17, slotY + 17, "rgba(255, 255, 255, 0.3)");
            }

            if (isOccupied) {
                const recipe = this.filteredRecipes[recipeIdx];
                const block = Block.getById(recipe.output.id);
                const brightness = isCraftable ? 1.2 : 0.7;
                this.minecraft.itemRenderer.renderItemInGui("recipe_item_" + i, block, slotX + 9, slotY + 9, 10, brightness, 0, null);
            } else {
                let renderId = "recipe_item_" + i;
                if (this.minecraft.itemRenderer.items[renderId]) {
                    this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items[renderId].group);
                    delete this.minecraft.itemRenderer.items[renderId];
                }
            }
        }

        // 4. Pagination Arrows
        const totalRows = Math.ceil(this.filteredRecipes.length / slotsX);
        const hasNext = (this.recipeScroll + slotsY) < totalRows;
        const hasPrev = this.recipeScroll > 0;

        if (hasNext || hasPrev) {
            let nextX = bx + 95, nextY = by + 141; // Lowered slightly as requested
            let backX = bx + 35, backY = by + 141; // Lowered slightly as requested

            if (hasNext) {
                const isHover = mouseX >= nextX && mouseX < nextX + a.next.w && mouseY >= nextY && mouseY < nextY + a.next.h;
                const nextData = isHover ? a.nexthover : a.next;
                this.drawSprite(stack, this.bookTexture, nextData.x, nextData.y, nextData.w, nextData.h, nextX, nextY, nextData.w, nextData.h);
            }
            if (hasPrev) {
                const isHover = mouseX >= backX && mouseX < backX + a.back.w && mouseY >= backY && mouseY < backY + a.back.h;
                const backData = isHover ? a.backhover : a.back;
                this.drawSprite(stack, this.bookTexture, backData.x, backData.y, backData.w, backData.h, backX, backY, backData.w, backData.h);
            }

            // Draw x/x page indicator
            let currentPage = Math.floor(this.recipeScroll / slotsY) + 1;
            let totalPages = Math.ceil(totalRows / slotsY);
            this.drawCenteredStringNoShadow(stack, currentPage + "/" + totalPages, bx + 70, by + 145, 0x404040);
        }

        // 5. Draw recipe tooltip
        if (hoveredRecipe) {
            let block = Block.getById(hoveredRecipe.output.id);
            if (block) {
                this.drawTooltip(stack, block.name || "Item", mouseX, mouseY);
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
        if (index >= 36) {
            if (index === 45) itemStack = this.craftingItems[9];
            else itemStack = this.craftingItems[index - 36];
        } else itemStack = this.inventory.getStackInSlot(index);

        const prefix = (this.playerIdx === 1 ? "p2_" : "p1_");
        let renderId = prefix + "crafting_slot_" + index;
        if (itemStack && itemStack.id !== 0) {
            let brightness = itemStack.isGhost ? 0.5 : 1.0;
            this.minecraft.itemRenderer.renderItemInGui(renderId, Block.getById(itemStack.id), x + 8, y + 8, 10, brightness, 0, itemStack.tag);
        } else {
            if (this.minecraft.itemRenderer.items[renderId]) {
                this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items[renderId].group);
                delete this.minecraft.itemRenderer.items[renderId];
            }
        }
    }

    drawForeground(stack, mouseX, mouseY, partialTicks) {
        const invLeft = this.guiLeft + this.bookWidth + this.panelGap;

        // Draw 3x3 crafting grid
        let x_craft = invLeft + 30;
        let y_craft = this.guiTop + 17;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) this.drawSlotForeground(stack, x_craft + col * 18, y_craft + row * 18, 36 + col + row * 3);
        }
        // Output
        this.drawSlotForeground(stack, x_craft + 90, y_craft + 19, 45);

        // Main inventory
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                let x = invLeft + 8 + col * 18;
                let y = this.guiTop + 84 + row * 18;
                this.drawSlotForeground(stack, x, y, col + row * 9 + 9);
            }
        }
        // Hotbar
        for (let i = 0; i < 9; i++) {
            this.drawSlotForeground(stack, invLeft + 8 + i * 18, this.guiTop + 142, i);
        }

        // Draw Tooltips
        this.drawTooltips(stack, mouseX, mouseY);
    }

    drawSlotForeground(stack, x, y, index) {
        let itemStack;
        if (index >= 36) {
            if (index === 45) itemStack = this.craftingItems[9];
            else itemStack = this.craftingItems[index - 36];
        } else itemStack = this.inventory.getStackInSlot(index);

        if (itemStack && itemStack.id !== 0) {
            let block = Block.getById(itemStack.id);
            if (itemStack.count > 1) this.drawRightString(stack, "" + itemStack.count, x + 17, y + 9, 0xFFFFFF);
            if (block.maxDamage > 0 && itemStack.damage > 0) this.drawDurabilityBar(stack, x, y, itemStack.damage, block.maxDamage);
        }
    }

    drawTooltips(stack, mouseX, mouseY) {
        let slot = this.getSlotAt(mouseX, mouseY);
        if (slot === -1) return;

        let stackObj;
        if (slot >= 36) {
            if (slot === 45) stackObj = this.craftingItems[9];
            else stackObj = this.craftingItems[slot - 36];
        } else stackObj = this.inventory.getStackInSlot(slot);

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

    updateCraftingOutput() {
        const inputIds = [];
        let hasGhost = false;
        for (let i = 0; i < 9; i++) {
            inputIds.push(this.craftingItems[i].id);
            if (this.craftingItems[i].isGhost) hasGhost = true;
        }
        
        const output = Crafting.checkRecipe(inputIds, 3);
        // Ghost items cannot be crafted
        if (hasGhost) {
            this.craftingItems[9] = {id: 0, count: 0};
        } else {
            this.craftingItems[9] = output;
        }
    }

    doesGuiPauseGame() {
        return false;
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

        // Return input items to inventory or drop
        for (let i = 0; i < 9; i++) {
            const item = this.craftingItems[i];
            if (item.id !== 0 && !item.isGhost) {
                let remainder = this.inventory.addItemStack(item);
                if (remainder > 0) {
                    for (let k = 0; k < remainder; k++) {
                        this.minecraft.player.dropItem({id: item.id, count: 1});
                    }
                }
                this.craftingItems[i] = {id: 0, count: 0};
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

    getSlotAt(mouseX, mouseY) {
        const invLeft = this.guiLeft + this.bookWidth + this.panelGap;

        // Hotbar
        for (let i = 0; i < 9; i++) {
            let x = invLeft + 8 + i * 18;
            let y = this.guiTop + 142;
            if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) return i;
        }
        // Main Inventory
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                let x = invLeft + 8 + col * 18;
                let y = this.guiTop + 84 + row * 18;
                if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) return col + row * 9 + 9;
            }
        }
        // Crafting Grid (3x3)
        let x_craft = invLeft + 30;
        let y_craft = this.guiTop + 17;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                let x = x_craft + col * 18;
                let y = y_craft + row * 18;
                if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) return 36 + col + row * 3;
            }
        }
        // Output
        let x_out = x_craft + 90;
        let y_out = y_craft + 19;
        if (mouseX >= x_out && mouseX < x_out + 18 && mouseY >= y_out && mouseY < y_out + 18) return 45;

        return -1;
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        super.mouseClicked(mouseX, mouseY, mouseButton);

        if (mouseButton === 0) { // Left click
            let bx = this.guiLeft;
            let by = this.guiTop;
            const a = this.atlas;

            // Craftable toggle check
            let toggleX = bx + 110;
            let toggleY = by + 12;
            if (mouseX >= toggleX && mouseX < toggleX + a.craftableyes.w && mouseY >= toggleY && mouseY < toggleY + a.craftableyes.h) {
                this.onlyCraftable = !this.onlyCraftable;
                this.updateFilteredRecipes();
                this.recipeScroll = 0;
                this.minecraft.soundManager.playSound("random.click", 0, 0, 0, 1, 1);
                return;
            }

            // Category tab check
            for (let i = 0; i < 4; i++) {
                const ty = by + 20 + i * 27;
                const tx = bx - 30; // approx width of tabs
                if (mouseX >= tx && mouseX < bx && mouseY >= ty && mouseY < ty + 26) {
                    const cats = ["all", "blocks", "tools", "food"];
                    this.selectedCategory = cats[i];
                    this.updateFilteredRecipes();
                    this.recipeScroll = 0;
                    this.minecraft.soundManager.playSound("random.click", 0, 0, 0, 1, 1);
                    return;
                }
            }

            // Search focus area (now covers the start of the moved textbox)
            if (mouseX >= bx + 28 && mouseX < bx + 28 + 76 && mouseY >= by + 14 && mouseY < by + 14 + 12) {
                this.searchField.isFocused = true;
                return;
            }

            // Pagination click check
            const slotsX = 5;
            const slotsY = 5;
            const totalRows = Math.ceil(this.filteredRecipes.length / slotsX);
            
            let nextX = bx + 95, nextY = by + 138;
            let backX = bx + 35, backY = by + 138;

            if (mouseX >= nextX && mouseX < nextX + a.next.w && mouseY >= nextY && mouseY < nextY + a.next.h) {
                if ((this.recipeScroll + slotsY) < totalRows) {
                    this.recipeScroll = Math.min(totalRows - slotsY, this.recipeScroll + slotsY);
                    this.minecraft.soundManager.playSound("random.click", 0, 0, 0, 1, 1);
                    return;
                }
            }
            if (mouseX >= backX && mouseX < backX + a.back.w && mouseY >= backY && mouseY < backY + a.back.h) {
                if (this.recipeScroll > 0) {
                    this.recipeScroll = Math.max(0, this.recipeScroll - slotsY);
                    this.minecraft.soundManager.playSound("random.click", 0, 0, 0, 1, 1);
                    return;
                }
            }

            // Recipe click check
            let rx = bx + 12;
            let ry = by + 34;
            for (let i = 0; i < slotsX * slotsY; i++) {
                let col = i % slotsX;
                let row = Math.floor(i / slotsX);
                let sx = rx + col * 25;
                let sy = ry + row * 22;
                if (mouseX >= sx && mouseX < sx + 26 && mouseY >= sy && mouseY < sy + 16) {
                    let recipeIdx = i + (this.recipeScroll * slotsX);
                    if (recipeIdx < this.filteredRecipes.length) {
                        this.autoFillRecipe(this.filteredRecipes[recipeIdx]);
                    }
                    return;
                }
            }

            let slotIndex = this.getSlotAt(mouseX, mouseY);
            if (slotIndex !== -1) {
                // Determine slot type
                let isOutput = slotIndex === 45;
                let isCrafting = slotIndex >= 36 && slotIndex < 45;
                
                // Get target stack
                let targetStack;
                if (isOutput) targetStack = this.craftingItems[9];
                else if (isCrafting) targetStack = this.craftingItems[slotIndex - 36];
                else targetStack = this.inventory.getStackInSlot(slotIndex);

                // Clear ghost items if clicking a crafting slot
                if (isCrafting && targetStack.isGhost) {
                    this.craftingItems[slotIndex - 36] = {id: 0, count: 0};
                    this.updateCraftingOutput();
                    return;
                }

                // Handle Shift-Click (Quick Move)
                if (Keyboard.isKeyDown("ShiftLeft") || Keyboard.isKeyDown("ShiftRight")) {
                    if (!targetStack || targetStack.id === 0) return;

                    let countBefore = targetStack.count;
                    // Move to hotbar first, then main inventory
                    targetStack.count = this.inventory.addItemStackRange(targetStack, 0, 8);
                    if (targetStack.count > 0) {
                        targetStack.count = this.inventory.addItemStackRange(targetStack, 9, 35);
                    }
                    
                    if (isOutput && targetStack.count < countBefore) {
                        this.consumeIngredients();
                    }

                    if (targetStack.count === 0) {
                        targetStack.id = 0;
                        targetStack.tag = {};
                        targetStack.damage = 0;
                    }

                    if (isOutput || isCrafting) this.updateCraftingOutput();
                    this.minecraft.soundManager.playSound("random.click", 0, 0, 0, 0.4, 1.2);
                    return;
                }

                if (isOutput) {
                    // Crafting output logic
                    if (targetStack.id !== 0) {
                        if (this.heldItem.id === 0) {
                            this.checkCraftAchievement(targetStack.id); // Check achievement
                            this.heldItem = {id: targetStack.id, count: targetStack.count, damage: targetStack.damage, tag: targetStack.tag};
                            this.craftingItems[9] = {id: 0, count: 0}; // Explicitly clear output before re-evaluation
                            this.consumeIngredients();
                            this.updateCraftingOutput();
                        } else if (this.heldItem.id === targetStack.id && JSON.stringify(this.heldItem.tag) === JSON.stringify(targetStack.tag)) {
                            let block = Block.getById(targetStack.id);
                            let maxStack = block ? block.maxStackSize : 64;
                            if (this.heldItem.count + targetStack.count <= maxStack) {
                                this.checkCraftAchievement(targetStack.id); // Check achievement
                                this.heldItem.count += targetStack.count;
                                this.craftingItems[9] = {id: 0, count: 0}; // Explicitly clear output before re-evaluation
                                this.consumeIngredients();
                                this.updateCraftingOutput();
                            }
                        }
                    }
                } else {
                    // Normal slot logic
                    if (this.heldItem.id === 0) {
                        if (targetStack.id !== 0) {
                            // Pick up
                            this.heldItem = {id: targetStack.id, count: targetStack.count};
                            // Clear slot
                            if (isCrafting) this.craftingItems[slotIndex - 36] = {id: 0, count: 0};
                            else this.inventory.setStackInSlot(slotIndex, 0, 0);
                        }
                    } else {
                        if (targetStack.id === 0) {
                            // Place
                            if (isCrafting) this.craftingItems[slotIndex - 36] = this.heldItem;
                            else this.inventory.setStackInSlot(slotIndex, this.heldItem.id, this.heldItem.count);
                            this.heldItem = {id: 0, count: 0};
                        } else if (targetStack.id === this.heldItem.id) {
                            // Stack
                            let block = Block.getById(targetStack.id);
                            let maxStack = block ? block.maxStackSize : 64;
                            let space = maxStack - targetStack.count;
                            let toAdd = Math.min(space, this.heldItem.count);
                            
                            targetStack.count += toAdd;
                            this.heldItem.count -= toAdd;
                            
                            if (this.heldItem.count <= 0) this.heldItem = {id: 0, count: 0};
                            
                            if (isCrafting) this.craftingItems[slotIndex - 36] = targetStack;
                            else this.inventory.setStackInSlot(slotIndex, targetStack.id, targetStack.count);
                        } else {
                            // Swap
                            let temp = {id: targetStack.id, count: targetStack.count};
                            
                            if (isCrafting) this.craftingItems[slotIndex - 36] = this.heldItem;
                            else this.inventory.setStackInSlot(slotIndex, this.heldItem.id, this.heldItem.count);
                            
                            this.heldItem = temp;
                        }
                    }
                    if (isCrafting) this.updateCraftingOutput();
                }
            }
        } else if (mouseButton === 2) { // Right click (Split/Place One)
            let slotIndex = this.getSlotAt(mouseX, mouseY);
            if (slotIndex !== -1) {
                if (slotIndex === 45) {
                    // Same as left click for now for output
                    this.mouseClicked(mouseX, mouseY, 0); 
                    return;
                }
                
                let targetStack;
                if (slotIndex >= 36) targetStack = this.craftingItems[slotIndex - 36];
                else targetStack = this.inventory.getStackInSlot(slotIndex);

                if (this.heldItem.id !== 0) {
                    // Place one
                    if (targetStack.id === 0) {
                        this.setSlot(slotIndex, this.heldItem.id, 1);
                        this.heldItem.count--;
                    } else if (targetStack.id === this.heldItem.id && targetStack.count < 64) {
                        targetStack.count++;
                        this.heldItem.count--;
                    }
                    if (this.heldItem.count <= 0) this.heldItem = {id: 0, count: 0};
                } else if (targetStack.id !== 0) {
                    // Split half
                    let half = Math.ceil(targetStack.count / 2);
                    this.heldItem = {id: targetStack.id, count: half};
                    targetStack.count -= half;
                    if (targetStack.count === 0) this.setSlot(slotIndex, 0, 0);
                }
                
                if (slotIndex >= 36) this.updateCraftingOutput();
            }
        }
    }

    setSlot(index, id, count) {
        if (index >= 36 && index < 45) {
            this.craftingItems[index - 36] = {id: id, count: count};
        } else if (index < 36) {
            this.inventory.setStackInSlot(index, id, count);
        }
    }

    consumeIngredients() {
        this.minecraft.stats.itemsCrafted++;
        for (let i = 0; i < 9; i++) {
            if (this.craftingItems[i].id !== 0) {
                this.craftingItems[i].count--;
                if (this.craftingItems[i].count <= 0) {
                    this.craftingItems[i] = {id: 0, count: 0};
                }
            }
        }
    }

    checkCraftAchievement(id) {
        const mgr = this.minecraft.achievementManager;
        if (id === 58) mgr.grant('benchmaking'); // Crafting Table
        if (id === 61) mgr.grant('hottopic'); // Furnace
        if (id === 23) mgr.grant('dispsensewiththis'); // Dispenser
        if (id === 297) mgr.grant('bakebread'); // Bread
        if (id === 270) mgr.grant('timetomine');
        if (id === 274 || id === 257 || id === 285 || id === 278) mgr.grant('gettinganupgrade');
        if (id === 268 || id === 272 || id === 267 || id === 283 || id === 276) mgr.grant('timetostrike');
    }

    autoFillRecipe(recipe) {
        // Clear current grid first and return any real items to inventory
        for (let i = 0; i < 9; i++) {
            if (this.craftingItems[i].id !== 0 && !this.craftingItems[i].isGhost) {
                this.inventory.addItemStack(this.craftingItems[i]);
            }
            this.craftingItems[i] = {id: 0, count: 0};
        }

        const rw = recipe.size[0];
        const rh = recipe.size[1];

        // Attempt to pull real items from inventory if available, otherwise use ghosts
        for (let row = 0; row < rh; row++) {
            for (let col = 0; col < rw; col++) {
                let targetId = recipe.shape[row * rw + col];
                if (targetId === 0) continue;

                const gridIdx = row * 3 + col;
                let foundReal = false;
                
                // Search player inventory for matching material
                for (let i = 0; i < this.inventory.items.length; i++) {
                    let invStack = this.inventory.items[i];
                    if (invStack.id !== 0 && Crafting.itemsMatch(invStack.id, targetId, recipe.strict)) {
                        // Move 1 item from inventory to crafting grid
                        this.craftingItems[gridIdx] = {id: invStack.id, count: 1, isGhost: false};
                        invStack.count--;
                        if (invStack.count <= 0) this.inventory.items[i] = {id: 0, count: 0};
                        foundReal = true;
                        break;
                    }
                }

                // If material not found in inventory, place a ghost item
                if (!foundReal) {
                    this.craftingItems[gridIdx] = {id: targetId, count: 1, isGhost: true};
                }
            }
        }

        this.updateCraftingOutput();
        this.minecraft.soundManager.playSound("random.click", 0, 0, 0, 1, 1);
    }

    handleMouseScroll(delta) {
        if (!this.bookVisible) return;
        const slotsX = 5;
        const slotsY = 5;
        const totalRows = Math.ceil(this.filteredRecipes.length / slotsX);
        if (totalRows <= slotsY) return;
        // Invert delta: scroll up (delta < 0) means move scroll up (decrease index)
        this.recipeScroll = MathHelper.clamp(this.recipeScroll + Math.sign(delta), 0, totalRows - slotsY);
    }

    mouseReleased(mouseX, mouseY, mouseButton) {
        super.mouseReleased(mouseX, mouseY, mouseButton);
    }
}

