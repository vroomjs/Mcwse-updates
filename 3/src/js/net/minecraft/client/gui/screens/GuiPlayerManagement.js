import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";

export default class GuiPlayerManagement extends GuiScreen {

    constructor(previousScreen, clientId) {
        super();
        this.previousScreen = previousScreen;
        this.clientId = clientId;
    }

    init() {
        super.init();
        const mp = this.minecraft.multiplayer;
        const presence = mp.presence[this.clientId] || {};
        const username = presence.username || "Guest";
        const perms = mp.getPlayerPermissions(this.clientId);
        const gameMode = mp.getPlayerGameMode(this.clientId);

        const centerX = this.width / 2;
        let y = 40;

        // GameMode Cycle
        const modes = ["Survival", "Creative", "Spectator"];
        this.buttonList.push(new GuiButton("GameMode: " + modes[gameMode], centerX - 100, y, 200, 20, () => {
            const nextMode = (gameMode + 1) % 3;
            mp.setPlayerGameMode(this.clientId, nextMode);
            this.init(); // Refresh UI
        }));
        y += 24;

        // Permissions
        this.buttonList.push(new GuiButton("Can Build: " + (perms.canBuild ? "YES" : "NO"), centerX - 100, y, 200, 20, () => {
            mp.setPermission(this.clientId, "canBuild", !perms.canBuild);
            this.init();
        }));
        y += 24;

        this.buttonList.push(new GuiButton("Can Use Commands: " + (perms.canCommand ? "YES" : "NO"), centerX - 100, y, 200, 20, () => {
            mp.setPermission(this.clientId, "canCommand", !perms.canCommand);
            this.init();
        }));
        y += 24;

        this.buttonList.push(new GuiButton("Can Fly: " + (perms.canFly ? "YES" : "NO"), centerX - 100, y, 200, 20, () => {
            mp.setPermission(this.clientId, "canFly", !perms.canFly);
            this.init();
        }));
        y += 32;

        // Kick / Ban
        this.buttonList.push(new GuiButton("§cKick Player", centerX - 100, y, 98, 20, () => {
            mp.kick(this.clientId);
            this.minecraft.displayScreen(this.previousScreen);
        }));

        this.buttonList.push(new GuiButton("§4Ban Player", centerX + 2, y, 98, 20, () => {
            mp.ban(this.clientId);
            this.minecraft.displayScreen(this.previousScreen);
        }));

        this.buttonList.push(new GuiButton("Back", centerX - 100, this.height - 30, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        const username = this.minecraft.multiplayer.presence[this.clientId]?.username || "Player";
        this.drawCenteredString(stack, "Managing: " + username, this.width / 2, 15);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}