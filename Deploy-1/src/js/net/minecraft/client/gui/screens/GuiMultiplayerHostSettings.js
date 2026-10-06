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

        y = Math.max(y + 10, this.height - 134);
        const halfW = 98;

        this.buttonList.push(new GuiButton("Regenerate Code", centerX - 100, y, halfW, 20, () => {
            mp.disconnect();
            mp.host(this.minecraft.world).then(() => this.init());
        }));

        this.buttonList.push(new GuiButton("Close LAN", centerX + 2, y, halfW, 20, () => {
            mp.disconnect();
            this.minecraft.displayScreen(this.previousScreen);
        }));

        const rules = this.minecraft.world ? this.minecraft.world.gameRules : null;
        const pvpButton = new GuiButton("PVP: " + (rules && rules.pvp !== false ? "ON" : "OFF"),
            centerX - 100, y + 24, 200, 20, () => {
                if (!this.minecraft.world) return;
                const next = this.minecraft.world.gameRules.pvp === false;
                this.minecraft.world.gameRules.pvp = next;
                pvpButton.string = "PVP: " + (next ? "ON" : "OFF");
                // Clients enforce PVP locally, so they need to be told.
                if (mp.connected && mp.isHosting) {
                    mp.broadcast({ type: "gamerules", gr: { pvp: next } });
                }
            });
        this.buttonList.push(pvpButton);

        this.buttonList.push(new GuiButton("Copy World Link",centerX-100,y+48,200,20,async()=>{
            const url=new URL(location.origin+location.pathname);url.searchParams.set('join',mp.lanCode);
            try{await navigator.clipboard.writeText(url.href);this.linkStatus='World link copied.';}catch(_){this.linkStatus='Could not copy world link.';}
        }));

        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 30, 200, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Manage LAN", this.width / 2, 15);
        this.drawCenteredString(stack,"World code: "+(this.minecraft.multiplayer.lanCode||'—'),this.width/2,27,0x55FF55);
        if(this.linkStatus)this.drawCenteredString(stack,this.linkStatus,this.width/2,this.height-43,this.linkStatus.startsWith('World')?0x55FF55:0xFF5555);

        if (this.emptyMessage) {
            this.drawCenteredString(stack, this.emptyMessage, this.width / 2, this.height / 2, 0xAAAAAA);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}