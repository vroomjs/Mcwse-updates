import GuiButton from "../widgets/GuiButton.js";
import GuiScreen from "../GuiScreen.js";
import GuiOptions from "./GuiOptions.js";
import GuiMainMenu from "./GuiMainMenu.js";
import GuiSkins from "./GuiSkins.js";
import GuiSaveError from "./GuiSaveError.js";
import GuiLANOpened from "./GuiLANOpened.js";
import GuiMultiplayerHostSettings from "./GuiMultiplayerHostSettings.js";
import GuiCameraStudio from "./GuiCameraStudio.js";

export default class GuiIngameMenu extends GuiScreen {

    constructor() {
        super();
    }

    init() {
        super.init();

        const centerX = this.width / 2;
        let y = this.height / 4 + 8;

        this.buttonList.push(new GuiButton("Back to Game", centerX - 100, y, 200, 20, () => {
            this.minecraft.displayScreen(null);
        }));

        y += 24;

        this.buttonList.push(new GuiButton("Advancements", centerX - 100, y, 98, 20, () => {
            import("./GuiAchievements.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));

        this.buttonList.push(new GuiButton("Statistics", centerX + 2, y, 98, 20, () => {
            import("./GuiStats.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));

        y += 24;

        this.buttonList.push(new GuiButton("Open Camera Studio", centerX - 100, y, 200, 20, () => {
            this.minecraft.displayScreen(new GuiCameraStudio(this));
        }));

        y += 24;

        this.buttonList.push(new GuiButton("Options...", centerX - 100, y, 98, 20, () => {
            this.minecraft.displayScreen(new GuiOptions(this));
        }));

        const alreadyHosting = this.minecraft.multiplayer &&
            this.minecraft.multiplayer.connected &&
            this.minecraft.multiplayer.isHosting;
        const connectedAsClient = this.minecraft.multiplayer &&
            this.minecraft.multiplayer.connected &&
            !this.minecraft.multiplayer.isHosting;
        const lanButton = new GuiButton(alreadyHosting ? "Manage LAN" : "Open to LAN", centerX + 2, y, 98, 20, () => {
            const mp = this.minecraft.multiplayer;
            if (!mp || !this.minecraft.world) return;

            if (mp.connected && mp.isHosting) {
                this.minecraft.displayScreen(new GuiMultiplayerHostSettings(this));
                return;
            }

            lanButton.setEnabled(false);
            lanButton.string = "Opening LAN...";
            mp.host(this.minecraft.world).then(code => {
                this.minecraft.displayScreen(new GuiLANOpened(this, code));
            }).catch(error => {
                console.error("Unable to open LAN game:", error);
                lanButton.setEnabled(true);
                lanButton.string = "Open to LAN";
                this.minecraft.addMessageToChat("§cCould not open this world to LAN.");
            });
        });
        // A joined player cannot publish somebody else's world.
        lanButton.setEnabled(!connectedAsClient);
        this.buttonList.push(lanButton);

        y += 24;

        // Hidden Dev Tools & 2P Splitscreen access
        this.buttonList.push(new GuiButton("2P", this.width - 25, 5, 20, 20, () => {
            import("./GuiSplitscreen.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));

        this.buttonList.push(new GuiButton("DEV", 5, 5, 25, 20, () => {
            import("./GuiDevTools.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));

        let isClient = this.minecraft.multiplayer && this.minecraft.multiplayer.connected && !this.minecraft.multiplayer.isHosting;
        let quitText = isClient ? "Disconnect" : "Save and Quit to Title";

        this.buttonList.push(new GuiButton(quitText, centerX - 100, y, 200, 20, () => {
            if (isClient) {
                // Client: Save info to host, then disconnect without local download
                this.minecraft.multiplayer.saveClientData();
                this.minecraft.multiplayer.disconnect();
                this.minecraft.loadWorld(null);
            } else if (this.minecraft.world) {
                // A host must release its PeerJS ID before returning to the title screen.
                if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected) {
                    this.minecraft.multiplayer.disconnect();
                }
                // Host/Singleplayer: Save to disk
                // Display a "Saving..." message
                this.minecraft.displaySavingScreen("Saving world...");

                // Save asynchronously
                this.minecraft.world.saveWorldData().then(result => {
                    if (result.success) {
                        this.minecraft.loadWorld(null);
                    } else {
                        // If saving fails, show the error screen with download option
                        if (result.data) {
                            this.minecraft.displayScreen(new GuiSaveError(this, result.data, (this.minecraft.world.name || "world") + ".json"));
                        } else {
                            // If fatal error without data, just go back to menu
                            console.error("Fatal save error:", result.error);
                            this.minecraft.displayScreen(this);
                        }
                    }
                });
            } else {
                this.minecraft.loadWorld(null);
            }
        }));
    }

    /**
     * Badge sits immediately right of the DEV button (x 5, w 25) and is
     * centred against its 20px height.
     */
    getUnseenBadgeRect() {
        return { x: 34, y: 10, size: 10 };
    }

    hasUnseenNotifications() {
        const mp = this.minecraft.multiplayer;
        return !!(mp && mp.isHosting && mp.hasMissedJoinRequests && mp.hasMissedJoinRequests());
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        if (this.hasUnseenNotifications()) {
            const r = this.getUnseenBadgeRect();
            if (mouseX >= r.x && mouseX < r.x + r.size && mouseY >= r.y && mouseY < r.y + r.size) {
                this.openUnseenNotifications();
                return;
            }
        }
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }

    openUnseenNotifications() {
        const missed = this.minecraft.multiplayer.clearMissedJoinRequests();
        if (missed.length === 0) return;

        const names = [...new Set(missed.map(m => m.username))];
        let text;
        if (names.length === 1) {
            text = `${names[0]} tried to join your world.`;
        } else if (names.length === 2) {
            text = `${names[0]} and ${names[1]} tried to join your world.`;
        } else {
            text = `${names.length} players tried to join your world.`;
        }

        this.minecraft.systemDialogs?.show(text, { duration: 5000 });
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        // Background
        this.drawRect(stack, 0, 0, this.width, this.height, 'black', 0.6);

        // Title
        this.drawCenteredString(stack, "Game Menu", this.width / 2, 50);

        super.drawScreen(stack, mouseX, mouseY, partialTicks);

        // Unseen join requests, drawn after the buttons so it sits on top.
        if (this.hasUnseenNotifications()) {
            const r = this.getUnseenBadgeRect();
            this.drawUnseenBadge(stack, r.x, r.y);
        }
    }

}
