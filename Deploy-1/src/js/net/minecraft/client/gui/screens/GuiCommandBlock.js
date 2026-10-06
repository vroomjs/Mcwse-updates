import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiTextField from "../widgets/GuiTextField.js";

export default class GuiCommandBlock extends GuiScreen {

    constructor(player, x, y, z, tileEntity) {
        super();
        this.player = player;
        this.world = player.world;
        this.pos = {x, y, z};
        this.te = tileEntity;
    }

    init() {
        super.init();

        const centerX = this.width / 2;
        
        // Command Input
        this.fieldCommand = new GuiTextField(centerX - 150, 50, 300, 20);
        this.fieldCommand.text = this.te.command || "";
        this.fieldCommand.maxLength = 256;
        this.fieldCommand.isFocused = true;
        this.buttonList.push(this.fieldCommand);

        // Done button
        this.buttonList.push(new GuiButton("Done", centerX - 154, this.height - 40, 150, 20, () => {
            this.te.command = this.fieldCommand.getText();
            this.world.setTileEntity(this.pos.x, this.pos.y, this.pos.z, this.te);
            this.minecraft.displayScreen(null);
            
            // Sync to multiplayer
            if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected) {
                this.minecraft.multiplayer.onTileEntityChanged(this.pos.x, this.pos.y, this.pos.z, this.te);
            }
        }));

        // Cancel button
        this.buttonList.push(new GuiButton("Cancel", centerX + 4, this.height - 40, 150, 20, () => {
            this.minecraft.displayScreen(null);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Set Console Command for Block", this.width / 2, 20);
        this.drawString(stack, "Command:", this.width / 2 - 150, 37, 0xA0A0A0);
        
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}