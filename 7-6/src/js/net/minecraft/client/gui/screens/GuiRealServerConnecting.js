import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import NetworkManager from "../../network/NetworkManager.js";
import HandshakePacket from "../../network/packet/handshake/client/HandshakePacket.js";
import ProtocolState from "../../network/ProtocolState.js";
import NetworkLoginHandler from "../../network/handler/NetworkLoginHandler.js";
import Minecraft from "../../Minecraft.js";
import LoginStartPacket from "../../network/packet/login/client/LoginStartPacket.js";

function parseAddress(address) {
    const raw = String(address || "").trim();
    if (!raw) return { host: "", port: 25565 };
    const i = raw.lastIndexOf(":");
    if (i > -1 && i < raw.length - 1 && /^\d+$/.test(raw.slice(i + 1))) {
        return { host: raw.slice(0, i), port: Math.max(1, Math.min(65535, parseInt(raw.slice(i + 1), 10))) };
    }
    return { host: raw, port: 25565 };
}

export default class GuiRealServerConnecting extends GuiScreen {
    constructor(previousScreen, address, username = null) {
        super();
        this.previousScreen = previousScreen || null;
        this.rawAddress = address;
        const parsed = parseAddress(address);
        this.address = parsed.host;
        this.port = parsed.port;
        this.username = username;
        this.connecting = false;
        this.networkManager = null;
        this.error = "";
    }

    connect() {
        this.networkManager = new NetworkManager(this.minecraft);
        this.networkManager.isRealServer = true;
        this.networkManager.setNetworkHandler(new NetworkLoginHandler(this.networkManager));
        this.minecraft.realServerConnection = this.networkManager;
        this.networkManager.connect(this.address, this.port, Minecraft.PROXY);

        const session = this.minecraft.getSession(this.username || undefined);
        const name = session.getProfile().getUsername();
        this.networkManager.sendPacket(new HandshakePacket(Minecraft.PROTOCOL_VERSION, ProtocolState.LOGIN));
        this.networkManager.sendPacket(new LoginStartPacket(name));
    }

    init() {
        super.init();
        const y = this.height / 2 - 50;
        this.buttonList.push(new GuiButton("Cancel", this.width / 2 - 100, y + 130, 200, 20, () => {
            try { if (this.networkManager) this.networkManager.silentClose = true; this.networkManager?.close?.(); } catch (_) {}
            if (this.minecraft.realServerConnection === this.networkManager) this.minecraft.realServerConnection = null;
            this.minecraft.displayScreen(this.previousScreen);
        }));
        if (!this.connecting) {
            this.connecting = true;
            try { this.connect(); }
            catch (e) {
                console.error("Real server connection failed", e);
                this.error = e?.message || "Could not start connection.";
            }
        }
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Connecting to real server...", this.width / 2, this.height / 2 - 28, 0xFFFFFF);
        this.drawCenteredString(stack, `${this.address}:${this.port}`, this.width / 2, this.height / 2 - 12, 0xAAAAAA);
        this.drawCenteredString(stack, "Using the LabyStudio js-minecraft protocol bridge", this.width / 2, this.height / 2 + 4, 0xAAAAAA);
        if (this.error) this.drawCenteredString(stack, this.error, this.width / 2, this.height / 2 + 22, 0xFF5555);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    onClose() {
        // Do not close after successful transition into the world; only close
        // half-open login connections while this screen is still the owner.
        if (this.minecraft?.currentScreen === this && this.networkManager && this.networkManager.getState() !== ProtocolState.PLAY) {
            try { this.networkManager.close(); } catch (_) {}
        }
    }
}
