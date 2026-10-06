import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";

export default class GuiServerModsPrompt extends GuiScreen {
    constructor(serverMods = [], onContinue = null, onCancel = null) {
        super();
        this.serverMods = Array.isArray(serverMods) ? serverMods : [];
        this.onContinue = onContinue;
        this.onCancel = onCancel;
    }

    init() {
        super.init();
        const centerX = this.width / 2;
        const y = Math.floor(this.height / 2) + 34;

        this.buttonList.push(new GuiButton("Yes", centerX - 165, y, 150, 20, () => {
            if (this.onContinue) this.onContinue();
        }));

        this.buttonList.push(new GuiButton("No", centerX + 15, y, 150, 20, () => {
            if (this.onCancel) this.onCancel();
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);

        // Dim the current screen/world behind the prompt, like the vanilla
        // resource-pack prompt shown after joining a server.
        this.drawRect(stack, 0, 0, this.width, this.height, "#000000", 0.55);

        const centerX = this.width / 2;
        let y = Math.floor(this.height / 2) - 64;

        this.drawCenteredString(stack, "This server has server mods enabled.", centerX, y, 0xFFFFFF);
        y += 24;

        if (this.serverMods.length) {
            const names = this.serverMods.slice(0, 3).map(mod => {
                const name = mod?.name || mod?.id || "Server Mod";
                const env = mod?.environment || (mod?.serverSide ? "Server" : "Server");
                return `${name} (${env})`;
            });
            for (const name of names) {
                this.drawCenteredString(stack, name, centerX, y, 0xD0D0D0);
                y += 12;
            }
            if (this.serverMods.length > 3) {
                this.drawCenteredString(stack, `+${this.serverMods.length - 3} more server mods`, centerX, y, 0xA8A8A8);
                y += 12;
            }
            y += 8;
        }

        this.drawCenteredString(stack, "Would you like to continue?", centerX, y, 0xFFFFFF);

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    keyTyped(key, character) {
        if (key === "Escape") {
            if (this.onCancel) this.onCancel();
            return true;
        }
        return super.keyTyped(key, character);
    }

    doesGuiPauseGame() {
        return false;
    }
}
