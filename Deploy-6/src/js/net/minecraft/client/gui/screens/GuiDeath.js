import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";

export default class GuiDeath extends GuiScreen {

    constructor(deathMessage = "") {
        super();
        this.deathMessage = deathMessage;
    }

    init() {
        super.init();

        let y = this.height / 2 + 10;
        
        this.buttonList.push(new GuiButton("Respawn", this.width / 2 - 100, y, 200, 20, () => {
            this.minecraft.player.health = 20;
            this.minecraft.player.respawn();
            this.minecraft.displayScreen(null);
        }));

        this.buttonList.push(new GuiButton("Title screen", this.width / 2 - 100, y + 24, 200, 20, () => {
            if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected) {
                this.minecraft.multiplayer.disconnect();
            }
            
            // Save world before quitting if hosting/singleplayer
            if (this.minecraft.world && !this.minecraft.world.isRemote) {
                this.minecraft.displaySavingScreen("Saving world...");
                this.minecraft.world.saveWorldData().then(() => {
                    this.minecraft.loadWorld(null);
                });
            } else {
                this.minecraft.loadWorld(null);
            }
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        // Red tinted background
        this.drawRect(stack, 0, 0, this.width, this.height, 'rgba(128, 0, 0, 0.52)');

        // "You died!" text
        stack.save();
        stack.translate(this.width / 2, this.height / 4 + 20, 0);
        stack.scale(2.5, 2.5, 2.5);
        this.drawCenteredString(stack, "You died!", 0, 0, 0xFFFFFF);
        stack.restore();

        // Death Message
        if (this.deathMessage) {
            this.drawCenteredString(stack, this.deathMessage, this.width / 2, this.height / 4 + 48, 0xAAAAAA);
        }

        // "Score: 0"
        this.drawCenteredString(stack, "Score: §e0", this.width / 2, this.height / 4 + 65, 0xFFFFFF);

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    doesGuiPauseGame() {
        return true;
    }
}