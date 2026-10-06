export const CHAT_HEADS_CLIENT_MOD_STORAGE_KEY = "mcwse_builtin_mod_enabled_chat_heads";

export const CHAT_HEADS_CLIENT_MOD_META = Object.freeze({
    id: "chat_heads",
    name: "Chat Heads",
    version: "MCWSE 1.07",
    badge: "Client",
    environment: "Client",
    authors: ["dzwdz", "MCWSE Port"],
    summary: "Player heads in chat.",
    description: "Native MCWSE port inspired by the Chat Heads mod. Adds the speaker's player head next to ordinary <player> chat messages so you can see who you're talking with. Heads are rendered from the sender's current local or multiplayer skin when available, falling back to the bundled Chat Heads icon.",
    icon: "chat_heads",
    iconImage: "src/js/net/minecraft/client/mods/client/chat_heads_icon.png",
    license: "Reference-style native implementation",
    removable: false,
    builtIn: true,
    clientSide: true
});

export function isChatHeadsClientModEnabled() {
    try {
        return localStorage.getItem(CHAT_HEADS_CLIENT_MOD_STORAGE_KEY) !== "false";
    } catch (_) {
        return true;
    }
}

export function setChatHeadsClientModEnabled(enabled) {
    try {
        localStorage.setItem(CHAT_HEADS_CLIENT_MOD_STORAGE_KEY, enabled ? "true" : "false");
    } catch (_) {}
}

function cleanName(name) {
    return String(name || "")
        .replace(/§./g, "")
        .replace(/[\u0000-\u001F<>]/g, "")
        .trim();
}

export default class ChatHeadsClientMod {
    constructor(minecraft) {
        this.minecraft = minecraft;
        this.metadata = CHAT_HEADS_CLIENT_MOD_META;
        this.enabled = isChatHeadsClientModEnabled();
        this.fallbackIcon = null;
        this.fallbackIconLoaded = false;
        this.loadFallbackIcon();
    }

    install() {
        this.minecraft.chatHeadsClientMod = this;
    }

    isGloballyEnabled() {
        return this.enabled;
    }

    setGloballyEnabled(enabled) {
        this.enabled = !!enabled;
        setChatHeadsClientModEnabled(this.enabled);
    }

    loadFallbackIcon() {
        if (typeof Image === "undefined") return;
        try {
            const img = new Image();
            img.onload = () => { this.fallbackIconLoaded = true; };
            img.onerror = () => { this.fallbackIconLoaded = false; };
            img.src = CHAT_HEADS_CLIENT_MOD_META.iconImage;
            this.fallbackIcon = img;
        } catch (_) {}
    }

    parseSender(message) {
        if (!this.enabled) return null;
        const text = String(message || "");
        // Only decorate normal player chat. System lines and colour-prefixed
        // pseudo speakers like §5<MineWatch> intentionally keep vanilla chat.
        const match = text.match(/^<([^>\n]{1,32})>\s/);
        if (!match) return null;
        const sender = cleanName(match[1]);
        return sender || null;
    }

    getPlayerNameCandidates() {
        const names = [];
        const settingsName = this.minecraft?.settings?.username;
        const playerName = this.minecraft?.player?.username;
        if (settingsName) names.push(settingsName);
        if (playerName) names.push(playerName);
        try {
            if (window.websim?.user?.username) names.push(window.websim.user.username);
        } catch (_) {}
        return names.map(cleanName).filter(Boolean);
    }

    resolveSkinKey(sender) {
        const wanted = cleanName(sender).toLowerCase();
        if (!wanted) return "../../steve (1).png";

        if (this.getPlayerNameCandidates().some(name => name.toLowerCase() === wanted)) {
            return this.minecraft?.settings?.skin || this.minecraft?.player?.skin || "../../steve (1).png";
        }

        const remotePlayers = this.minecraft?.multiplayer?.remotePlayers;
        if (remotePlayers && typeof remotePlayers.values === "function") {
            for (const player of remotePlayers.values()) {
                if (cleanName(player?.username).toLowerCase() === wanted) {
                    return player.skin || "../../steve (1).png";
                }
            }
        }

        const presence = this.minecraft?.multiplayer?.presence;
        if (presence && typeof presence === "object") {
            for (const data of Object.values(presence)) {
                if (cleanName(data?.username).toLowerCase() === wanted) {
                    return data.skin || "../../steve (1).png";
                }
            }
        }

        return "../../steve (1).png";
    }

    resolveSkinImage(sender) {
        const key = this.resolveSkinKey(sender);
        const resource = this.minecraft?.resources?.[key];
        return resource?.image || resource || (this.fallbackIconLoaded ? this.fallbackIcon : null);
    }

    drawProceduralFallback(stack, x, y, size, alpha) {
        stack.save();
        stack.globalAlpha = alpha;
        stack.imageSmoothingEnabled = false;
        const p = Math.max(1, Math.floor(size / 8));
        const rect = (px, py, w, h, color) => {
            stack.fillStyle = color;
            stack.fillRect(Math.floor(x + px * p), Math.floor(y + py * p), Math.ceil(w * p), Math.ceil(h * p));
        };
        rect(0, 0, 8, 8, "#E3C9A3");
        rect(0, 0, 8, 2, "#E7973A");
        rect(0, 2, 2, 1, "#E7973A");
        rect(6, 2, 2, 1, "#E7973A");
        rect(2, 4, 1, 1, "#1E6320");
        rect(5, 4, 1, 1, "#1E6320");
        rect(3, 6, 2, 1, "#EFB1AA");
        stack.restore();
    }

    drawHead(stack, sender, x, y, size = 8, alpha = 1.0) {
        if (!this.enabled || !sender) return false;
        const image = this.resolveSkinImage(sender);
        stack.save();
        stack.imageSmoothingEnabled = false;
        stack.globalAlpha = Math.max(0, Math.min(1, Number(alpha) || 1));

        // A one-pixel dark backing keeps heads readable on transparent chat.
        stack.fillStyle = "#000000";
        stack.fillRect(Math.floor(x - 1), Math.floor(y - 1), Math.floor(size + 2), Math.floor(size + 2));

        if (!image) {
            stack.restore();
            this.drawProceduralFallback(stack, x, y, size, alpha);
            return true;
        }

        const width = image.naturalWidth || image.width || 0;
        const height = image.naturalHeight || image.height || 0;
        try {
            if (image !== this.fallbackIcon && width >= 64 && height >= 32 && width / height <= 3) {
                const scale = width / 64;
                const sx = 8 * scale;
                const sy = 8 * scale;
                const sw = 8 * scale;
                const sh = 8 * scale;
                stack.drawImage(image, sx, sy, sw, sh, Math.floor(x), Math.floor(y), Math.floor(size), Math.floor(size));
                // Hat/helmet overlay for 64x64 skins.
                if (height >= 64 * scale - 0.5) {
                    stack.drawImage(image, 40 * scale, 8 * scale, sw, sh, Math.floor(x), Math.floor(y), Math.floor(size), Math.floor(size));
                }
            } else {
                stack.drawImage(image, Math.floor(x), Math.floor(y), Math.floor(size), Math.floor(size));
            }
        } catch (_) {
            stack.restore();
            this.drawProceduralFallback(stack, x, y, size, alpha);
            return true;
        }
        stack.restore();
        return true;
    }
}
