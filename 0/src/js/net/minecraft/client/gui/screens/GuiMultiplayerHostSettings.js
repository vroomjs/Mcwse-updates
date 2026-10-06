import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import MathHelper from "../../../util/MathHelper.js";

export default class GuiMultiplayerHostSettings extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.scrollY = 0;
    }

    init() {
        super.init();

        const centerX = this.width / 2;
        const mp = this.minecraft.multiplayer;
        const clients = Array.from(mp.connections.keys());

        let y = 40;
        const btnW = 200;
        const btnH = 20;

        // List connected players
        for (let clientId of clients) {
            const presence = mp.presence[clientId] || {};
            const username = presence.username || "Guest (" + clientId.substring(0, 4) + ")";
            
            this.buttonList.push(new GuiButton(username, centerX - 100, y, 200, 20, () => {
                import("./GuiPlayerManagement.js").then(module => {
                    this.minecraft.displayScreen(new module.default(this, clientId));
                });
            }));
            y += 24;
        }

        if (clients.length === 0) {
            this.emptyMessage = "No players connected.";
        } else {
            this.emptyMessage = null;
        }

        y = Math.max(y + 10, this.height - 110);
        const halfW = 98;

        this.buttonList.push(new GuiButton("Regenerate Code", centerX - 100, y, halfW, 20, () => {
            mp.disconnect();
            mp.host(this.minecraft.world).then(() => this.init());
        }));

        this.buttonList.push(new GuiButton("Close LAN", centerX + 2, y, halfW, 20, () => {
            mp.disconnect();
            this.minecraft.displayScreen(this.previousScreen);
        }));



        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 30, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Manage Players", this.width / 2, 15);

        if (this.emptyMessage) {
            this.drawCenteredString(stack, this.emptyMessage, this.width / 2, this.height / 2, 0xAAAAAA);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}