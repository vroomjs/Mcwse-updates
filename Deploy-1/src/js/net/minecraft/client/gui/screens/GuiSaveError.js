import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";

export default class GuiSaveError extends GuiScreen {

    constructor(previousScreen, worldData, fileName) {
        super();
        this.previousScreen = previousScreen;
        this.worldData = worldData;
        this.fileName = fileName || "world_save.json";
        
        this.message = [
            "Ouch! This is our fault.",
            "Our saving system messed up and your save is not registering.",
            "If you would like to manually download your save file, press OK.",
            "Otherwise, select Back."
        ];
    }

    init() {
        super.init();
        
        let y = this.height / 2 + 40;
        
        this.buttonList.push(new GuiButton("OK", this.width / 2 - 105, y, 100, 20, () => {
            this.downloadSave();
            // Assuming download means 'saved', we can go back to title or previous screen
            // For safety, let's go to the main menu to ensure state is reset, similar to a successful save & quit
            this.minecraft.loadWorld(null);
        }));

        this.buttonList.push(new GuiButton("Back", this.width / 2 + 5, y, 100, 20, () => {
            // Return to the game (or previous menu) without saving state clearing
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    downloadSave() {
        try {
            const json = JSON.stringify(this.worldData);
            const blob = new Blob([json], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Failed to download save file:", e);
        }
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Save Failed", this.width / 2, 40, 0xFF5555);

        let y = this.height / 2 - 30;
        for (let i = 0; i < this.message.length; i++) {
            this.drawCenteredString(stack, this.message[i], this.width / 2, y + i * 12, 0xFFFFFF);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}


