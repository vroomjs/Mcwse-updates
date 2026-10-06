import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiTextField from "../widgets/GuiTextField.js";
import Block from "../../world/block/Block.js";

export default class GuiEditSign extends GuiScreen {
    constructor(player, x, y, z) {
        super();
        this.player = player;
        this.x = x;
        this.y = y;
        this.z = z;
        
        this.tileEntity = player.world.getTileEntity(x, y, z) || { lines: ["", "", "", ""] };
        this.lines = [...this.tileEntity.lines];
        this.cursorLine = 0;
    }

    init() {
        super.init();
        const centerX = this.width / 2;
        
        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height / 2 + 60, 200, 20, () => {
            this.saveAndClose();
        }));

        this.inventoryBackground = this.getTexture("../../inventoryUIborder.png");
    }

    saveAndClose() {
        this.tileEntity.lines = this.lines;
        this.player.world.setTileEntity(this.x, this.y, this.z, this.tileEntity);

        // Sync with Multiplayer
        if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected) {
            this.minecraft.multiplayer.onTileEntityChanged(this.x, this.y, this.z, this.tileEntity);
        }

        this.minecraft.displayScreen(null);
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawRect(stack, 0, 0, this.width, this.height, 'rgba(0,0,0,0.6)');
        this.drawCenteredString(stack, "Edit sign message", this.width / 2, 40, 0xFFFFFF);

        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Draw the sign board preview (Brown box)
        const boardW = 100;
        const boardH = 60;
        this.drawRect(stack, centerX - boardW/2, centerY - boardH/2, centerX + boardW/2, centerY + boardH/2, "#A4855C");
        this.drawRect(stack, centerX - boardW/2 + 2, centerY - boardH/2 + 2, centerX + boardW/2 - 2, centerY + boardH/2 - 2, "#8A6E4B");

        // Draw a small stick for flavor if standing?
        const blockId = this.player.world.getBlockAt(this.x, this.y, this.z);
        const block = Block.getById(blockId);
        if (block && block.constructor.name === "BlockSign") {
            this.drawRect(stack, centerX - 2, centerY + boardH/2, centerX + 2, centerY + boardH/2 + 30, "#6A543A");
        }

        // Draw text lines on sign - enlarged and raised to match in-world
        for (let i = 0; i < 4; i++) {
            let text = this.lines[i];
            if (i === this.cursorLine && (Math.floor(Date.now() / 500) % 2 === 0)) {
                text += "_";
            }
            // Raised text and adjusted spacing to match in-world changes (from 13 to 15)
            this.drawCenteredStringNoShadow(stack, text, centerX, centerY - 28 + i * 15, 0x000000);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    keyTyped(key, character) {
        if (key === "Enter" || key === "ArrowDown") {
            this.cursorLine = (this.cursorLine + 1) % 4;
            return true;
        }
        if (key === "ArrowUp") {
            this.cursorLine = (this.cursorLine + 3) % 4;
            return true;
        }
        if (key === "Backspace") {
            if (this.lines[this.cursorLine].length > 0) {
                this.lines[this.cursorLine] = this.lines[this.cursorLine].slice(0, -1);
            } else if (this.cursorLine > 0) {
                this.cursorLine--;
            }
            return true;
        }
        if (key === "Escape") {
            this.saveAndClose();
            return true;
        }

        if (character.length === 1 && this.lines[this.cursorLine].length < 15) {
            this.lines[this.cursorLine] += character;
        }

        return super.keyTyped(key, character);
    }
}