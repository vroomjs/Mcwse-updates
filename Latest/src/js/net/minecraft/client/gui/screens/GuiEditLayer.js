import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiTextField from "../widgets/GuiTextField.js";
import Block from "../../world/block/Block.js";
import MathHelper from "../../../util/MathHelper.js";

export default class GuiEditLayer extends GuiScreen {

    constructor(previousScreen, layer) {
        super();
        this.previousScreen = previousScreen;
        this.layer = layer;
        
        this.searchQuery = "";
        this.currentScroll = 0;
        
        // Filterable list of placeable blocks
        this.availableBlocks = [];
        this.filteredBlocks = [];
        
        // Use the itemMap from CommandHandler to populate available blocks
        const itemMap = {
            "Stone": 1, "Grass": 2, "Dirt": 3, "Cobblestone": 4, "Planks": 5, "Bedrock": 7,
            "Sand": 12, "Gravel": 13, "Gold Block": 41, "Iron Block": 42, "Diamond Block": 57,
            "Emerald Block": 133, "Clay": 82, "Bricks": 45, "Smooth Stone": 43, "Stone Bricks": 98,
            "Sandstone": 24, "Netherrack": 87, "Soul Sand": 88, "Obsidian": 49, "Glowstone": 89,
            "Quartz Block": 155, "White Wool": 208, "Magma Block": 236, "Hay Bale": 170
        };

        for (let name in itemMap) {
            this.availableBlocks.push({ name: name, id: itemMap[name] });
        }
        
        this.availableBlocks.sort((a, b) => a.name.localeCompare(b.name));
        this.filteredBlocks = [...this.availableBlocks];
    }

    init() {
        super.init();

        const centerX = this.width / 2;
        const startY = 40;

        // Search Field
        this.fieldSearch = new GuiTextField(centerX - 100, startY, 200, 20);
        this.fieldSearch.text = this.searchQuery;
        this.fieldSearch.isFocused = true;
        this.buttonList.push(this.fieldSearch);

        // Amount Field
        this.fieldAmount = new GuiTextField(centerX - 100, startY + 125, 200, 20);
        this.fieldAmount.text = String(this.layer.count);
        this.fieldAmount.maxLength = 3;
        this.buttonList.push(this.fieldAmount);

        // Done Button
        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 30, 200, 20, () => {
            this.saveAndClose();
        }));
    }

    saveAndClose() {
        const count = parseInt(this.fieldAmount.getText());
        if (!isNaN(count) && count > 0) {
            this.layer.count = MathHelper.clamp(count, 1, 127);
        }
        this.minecraft.displayScreen(this.previousScreen);
    }

    updateScreen() {
        super.updateScreen();
        
        // Live search filtering
        const query = this.fieldSearch.getText().toLowerCase();
        if (query !== this.searchQuery) {
            this.searchQuery = query;
            this.filteredBlocks = this.availableBlocks.filter(b => b.name.toLowerCase().includes(query));
            this.currentScroll = 0;
        }
    }

    handleMouseScroll(delta) {
        const visibleRows = 2.5;
        const totalRows = Math.ceil(this.filteredBlocks.length / 3);
        if (totalRows <= visibleRows) return;

        this.currentScroll = MathHelper.clamp(this.currentScroll + delta * 0.5, 0, totalRows - visibleRows);
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Edit Layer", this.width / 2, 12);
        
        this.drawString(stack, "Search Block:", this.width / 2 - 100, 30, 0xA0A0A0);
        this.drawString(stack, "Layer Count:", this.width / 2 - 100, 155, 0xA0A0A0);

        // Draw Block Grid
        const gridX = this.width / 2 - 100;
        const gridY = 65;
        const slotSize = 32;
        const gap = 4;
        const viewH = (slotSize + gap) * 2.5;

        this.drawRect(stack, gridX - 2, gridY - 2, gridX + (slotSize + gap) * 3 + 2, gridY + viewH + 2, "rgba(0,0,0,0.5)");

        stack.save();
        stack.beginPath();
        stack.rect(gridX, gridY, (slotSize + gap) * 3, viewH);
        stack.clip();

        const startRow = Math.floor(this.currentScroll);
        const rowOffset = (this.currentScroll % 1) * (slotSize + gap);

        for (let i = 0; i < 12; i++) { // Render 4 rows
            const idx = startRow * 3 + i;
            if (idx >= this.filteredBlocks.length) break;

            const blockInfo = this.filteredBlocks[idx];
            const col = i % 3;
            const row = Math.floor(i / 3);
            
            const x = gridX + col * (slotSize + gap);
            const y = gridY + row * (slotSize + gap) - rowOffset;

            const isHovered = mouseX >= x && mouseX < x + slotSize && mouseY >= y && mouseY < y + slotSize && mouseY >= gridY && mouseY <= gridY + viewH;
            const isSelected = blockInfo.id === this.layer.id;

            if (isSelected) {
                this.drawRect(stack, x - 1, y - 1, x + slotSize + 1, y + slotSize + 1, "#FFFFFF");
                this.drawRect(stack, x, y, x + slotSize, y + slotSize, "#000000");
            } else if (isHovered) {
                this.drawRect(stack, x - 1, y - 1, x + slotSize + 1, y + slotSize + 1, "#808080");
                this.drawRect(stack, x, y, x + slotSize, y + slotSize, "#000000");
            }

            const block = Block.getById(blockInfo.id);
            if (block) {
                this.renderItem(stack, block, x + 8, y + 8, 16);
            }
        }
        stack.restore();

        // Scrollbar
        const totalRows = Math.ceil(this.filteredBlocks.length / 3);
        if (totalRows > 2.5) {
            const barX = gridX + (slotSize + gap) * 3 + 4;
            const barY = gridY;
            const barH = viewH;
            this.drawRect(stack, barX, barY, barX + 4, barY + barH, "rgba(0,0,0,0.3)");
            const thumbH = Math.max(10, barH * (2.5 / totalRows));
            const thumbY = barY + (this.currentScroll / (totalRows - 2.5)) * (barH - thumbH);
            this.drawRect(stack, barX, thumbY, barX + 4, thumbY + thumbH, "#808080");
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        const gridX = this.width / 2 - 100;
        const gridY = 65;
        const slotSize = 32;
        const gap = 4;
        const viewH = (slotSize + gap) * 2.5;

        if (mouseY >= gridY && mouseY <= gridY + viewH) {
            const startRow = Math.floor(this.currentScroll);
            const rowOffset = (this.currentScroll % 1) * (slotSize + gap);
            
            for (let i = 0; i < 12; i++) {
                const col = i % 3;
                const row = Math.floor(i / 3);
                const x = gridX + col * (slotSize + gap);
                const y = gridY + row * (slotSize + gap) - rowOffset;

                if (mouseX >= x && mouseX < x + slotSize && mouseY >= y && mouseY < y + slotSize) {
                    const idx = startRow * 3 + i;
                    if (idx < this.filteredBlocks.length) {
                        this.layer.id = this.filteredBlocks[idx].id;
                        this.minecraft.soundManager.playSound("random.click", 0, 0, 0, 1, 1);
                    }
                    return;
                }
            }
        }
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }
}