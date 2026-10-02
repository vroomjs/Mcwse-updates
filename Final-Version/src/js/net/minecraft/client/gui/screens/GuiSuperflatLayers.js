import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import Block from "../../world/block/Block.js";
import MathHelper from "../../../util/MathHelper.js";

export default class GuiSuperflatLayers extends GuiScreen {

    constructor(previousScreen, layers) {
        super();
        this.previousScreen = previousScreen;
        this.layers = layers || []; 
        this.selectedLayerIndex = -1;
        this.scrollY = 0;

        // Shared layout constants
        this.LAYOUT = {
            listTop: 32,
            listBottomOffset: 64,
            listWidth: 260,
            slotHeight: 24,
            iconOffset: 12,
            textOffset: 28
        };

        this.itemNames = {
            1: "Stone", 2: "Grass", 3: "Dirt", 4: "Cobblestone", 5: "Planks", 7: "Bedrock",
            12: "Sand", 13: "Gravel", 24: "Sandstone", 45: "Bricks", 98: "Stone Bricks",
            155: "Block of Quartz", 152: "Redstone Block", 57: "Diamond Block",
            42: "Iron Block", 41: "Gold Block", 133: "Emerald Block", 82: "Clay",
            79: "Ice", 80: "Snow Block", 49: "Obsidian", 87: "Netherrack", 88: "Soul Sand"
        };
    }

    init() {
        super.init();

        this.tabSelected = this.getTexture("../../tabselected_1_0 (2).png");
        this.tabUnselected = this.getTexture("../../tabnotselected_0_0 (8).png");
        this.windowBorder = this.getTexture("../../inventoryUIborder.png");

        const centerX = this.width / 2;
        const footerY = this.height - 52;

        // Bottom Controls
        this.buttonAdd = new GuiButton("Add Layer", centerX - 154, footerY, 100, 20, () => {
            this.layers.push({ id: 1, count: 1 });
            this.selectedLayerIndex = this.layers.length - 1;
            this.init();
        });
        this.buttonList.push(this.buttonAdd);

        this.buttonRemove = new GuiButton("Remove", centerX - 50, footerY, 100, 20, () => {
            if (this.selectedLayerIndex >= 0) {
                this.layers.splice(this.selectedLayerIndex, 1);
                this.selectedLayerIndex = -1;
                this.init();
            }
        });
        this.buttonRemove.setEnabled(this.selectedLayerIndex >= 0);
        this.buttonList.push(this.buttonRemove);

        this.buttonEdit = new GuiButton("Edit", centerX + 54, footerY, 100, 20, () => {
            if (this.selectedLayerIndex >= 0) {
                this.openEditDialog();
            }
        });
        this.buttonEdit.setEnabled(this.selectedLayerIndex >= 0);
        this.buttonList.push(this.buttonEdit);

        this.buttonList.push(new GuiButton("Done", centerX - 100, footerY + 24, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    openEditDialog() {
        let layer = this.layers[this.selectedLayerIndex];
        if (!layer) return;
        import("./GuiEditLayer.js").then(module => {
            this.minecraft.displayScreen(new module.default(this, layer));
        });
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Superflat Customization", this.width / 2, 12);

        const L = this.LAYOUT;
        const listBottom = this.height - L.listBottomOffset;
        const listX = this.width / 2 - L.listWidth / 2;
        const viewH = listBottom - L.listTop;

        // Dark background for the list
        this.drawRect(stack, listX - 2, L.listTop - 2, listX + L.listWidth + 2, listBottom + 2, "rgba(0, 0, 0, 0.4)");

        // Content list with clipping
        stack.save();
        stack.beginPath();
        stack.rect(listX, L.listTop, L.listWidth, viewH);
        stack.clip();

        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            const y = L.listTop + i * L.slotHeight - this.scrollY;
            
            if (y + L.slotHeight < L.listTop || y >= listBottom) continue;

            const isSelected = i === this.selectedLayerIndex;
            const isHovered = mouseX >= listX && mouseX <= listX + L.listWidth && mouseY >= y && mouseY < y + L.slotHeight && mouseY >= L.listTop && mouseY <= listBottom;

            if (isSelected) {
                this.drawRect(stack, listX - 1, y - 1, listX + L.listWidth + 1, y + L.slotHeight + 1, "#FFFFFF");
                this.drawRect(stack, listX, y, listX + L.listWidth, y + L.slotHeight, "#000000");
            } else if (isHovered) {
                this.drawRect(stack, listX - 1, y - 1, listX + L.listWidth + 1, y + L.slotHeight + 1, "#808080");
                this.drawRect(stack, listX, y, listX + L.listWidth, y + L.slotHeight, "#000000");
            }

            let block = Block.getById(layer.id);
            if (block) {
                this.renderItem(stack, block, listX + 4, y + 4, 16);
                let name = this.itemNames[layer.id] || ("ID: " + layer.id);
                this.drawString(stack, layer.count + "x " + name, listX + L.textOffset, y + 8, 0xFFFFFF);
            }
        }
        stack.restore();

        // Scrollbar
        const totalH = this.layers.length * L.slotHeight;
        if (totalH > viewH) {
            const barX = listX + L.listWidth + 6;
            const thumbH = Math.max(15, (viewH / totalH) * viewH);
            const thumbY = L.listTop + (this.scrollY / (totalH - viewH)) * (viewH - thumbH);
            this.drawRect(stack, barX, L.listTop, barX + 4, listBottom, "rgba(0,0,0,0.5)");
            this.drawRect(stack, barX, thumbY, barX + 4, thumbY + thumbH, "#808080");
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        const L = this.LAYOUT;
        const listBottom = this.height - L.listBottomOffset;
        const listX = this.width / 2 - L.listWidth / 2;

        if (mouseX >= listX && mouseX <= listX + L.listWidth && mouseY >= L.listTop && mouseY <= listBottom) {
            let idx = Math.floor((mouseY - L.listTop + this.scrollY) / L.slotHeight);
            if (idx >= 0 && idx < this.layers.length) {
                this.selectedLayerIndex = idx;
                this.init(); // Refresh buttons
                this.minecraft.soundManager.playSound("random.click", this.minecraft.player ? this.minecraft.player.x : 0, 0, 0, 1, 1);
                return;
            }
        }
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }

    handleMouseScroll(delta) {
        const L = this.LAYOUT;
        const listBottom = this.height - L.listBottomOffset;
        const viewH = listBottom - L.listTop;
        const totalH = this.layers.length * L.slotHeight;
        
        if (totalH > viewH) {
            this.scrollY = MathHelper.clamp(this.scrollY + delta * 20, 0, totalH - viewH);
        }
    }
}