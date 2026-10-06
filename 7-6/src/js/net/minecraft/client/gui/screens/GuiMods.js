import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiTextField from "../widgets/GuiTextField.js";
import MathHelper from "../../../util/MathHelper.js";
import { VOICE_CHAT_SERVER_MOD_META, VOICE_CHAT_SERVER_MOD_STORAGE_KEY } from "../../mods/server/VoiceChatServerMod.js";
import { SODIUM_CLIENT_MOD_META, SODIUM_CLIENT_MOD_STORAGE_KEY } from "../../mods/client/SodiumClientMod.js";
import { XAEROS_MINIMAP_CLIENT_MOD_META, XAEROS_MINIMAP_CLIENT_MOD_STORAGE_KEY } from "../../mods/client/XaerosMinimapClientMod.js";
import { CHAT_HEADS_CLIENT_MOD_META, CHAT_HEADS_CLIENT_MOD_STORAGE_KEY } from "../../mods/client/ChatHeadsClientMod.js";
import { LAMB_DYNAMIC_LIGHTS_MOD_META, LAMB_DYNAMIC_LIGHTS_MOD_STORAGE_KEY } from "../../mods/both/LambDynamicLightsMod.js";
import { MIMICER_BOTH_MOD_META, MIMICER_BOTH_MOD_STORAGE_KEY } from "../../mods/both/MimicerBothMod.js";

/** Gray Minecraft/Fabric-style button used by the Mod Menu screen. */
class ModsButton extends GuiButton {
    render(stack, mouseX, mouseY) {
        if (!this.minecraft) return;
        const hovered = this.enabled && this.isMouseOver(mouseX, mouseY);
        const outer = hovered ? "#DADDE2" : "#7B7D82";
        const mid = hovered ? "#AEB1B8" : "#8B8D92";
        const inner = this.enabled ? (hovered ? "#5E6168" : "#5A5B60") : "#34363A";
        const text = this.enabled ? 0xFFFFFF : 0x777777;

        this.drawRect(stack, this.x, this.y, this.x + this.width, this.y + this.height, "#08080A");
        this.drawRect(stack, this.x + 1, this.y + 1, this.x + this.width - 1, this.y + this.height - 1, outer);
        this.drawRect(stack, this.x + 2, this.y + 2, this.x + this.width - 2, this.y + this.height - 2, mid);
        this.drawRect(stack, this.x + 3, this.y + 3, this.x + this.width - 3, this.y + this.height - 3, inner);
        this.drawRect(stack, this.x + 3, this.y + 3, this.x + this.width - 3, this.y + 4, "#C7C9CE", hovered ? 0.65 : 0.35);
        this.drawCenteredStringNoShadow(stack, this.string, this.x + this.width / 2, this.y + this.height / 2 - 4, text);
    }
}

/** Search field styled like the reference Mod Menu screenshot. */
class ModsSearchField extends GuiTextField {
    render(stack) {
        const focused = this.isFocused;
        const cursorVisible = focused && Math.floor(this.cursorCounter / 6) % 2 === 0;
        this.drawRect(stack, this.x - 1, this.y - 1, this.x + this.width + 1, this.y + this.height + 1, "#E3E3E8");
        this.drawRect(stack, this.x, this.y, this.x + this.width, this.y + this.height, "#050505");
        const display = this.text || "-";
        this.drawStringNoShadow(stack, display, this.x + 6, this.y + this.height / 2 - 4, this.text ? 0xFFFFFF : 0xCFCFCF);
        if (cursorVisible) {
            this.drawStringNoShadow(stack, "_", this.x + 6 + this.getStringWidth(stack, this.text), this.y + this.height / 2 - 4, 0xFFFFFF);
        }
    }
}

/**
 * Fabric Mod Menu-inspired screen: left searchable list, right detail panel,
 * bottom Open Mods Folder/Done buttons, and a translucent world backdrop.
 */
export default class GuiMods extends GuiScreen {
    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.savedMods = [];
        this.selectedModId = SODIUM_CLIENT_MOD_META.id;
        this.searchQuery = "";
        this.scrollY = 0;
        this.isLoading = true;
        this.loadError = null;
        this.statusMessage = "";
        this.hasPendingChanges = false;
        this.searchField = null;
        this.modToggleButton = null;
        this.layout = null;
        this.rowAreas = [];
        this.iconImageCache = new Map();
        this.dropHandlersInstalled = false;
    }

    init() {
        super.init();
        this.layout = this.getLayout();

        if (this.isLoading) {
            import("../../world/storage/WorldStorage.js")
                .then(module => module.default.getModList())
                .then(list => {
                    this.savedMods = Array.isArray(list) ? list : [];
                    this.isLoading = false;
                    this.loadError = null;
                    this.ensureSelection();
                    this.init();
                })
                .catch(error => {
                    console.error("Failed to load mods:", error);
                    this.savedMods = [];
                    this.isLoading = false;
                    this.loadError = "Unable to read the local mod library.";
                    this.ensureSelection();
                    this.init();
                });
            return;
        }

        const L = this.layout;
        this.searchField = new ModsSearchField(L.searchX, L.searchY, L.searchW, 20);
        this.searchField.text = this.searchQuery;
        this.searchField.maxLength = 48;
        this.buttonList.push(this.searchField);

        this.buttonList.push(new ModsButton("Open Mods Folder", L.openX, L.footerY, L.openW, 20, () => {
            this.openModZipPicker();
        }));
        this.buttonList.push(new ModsButton("Done", L.doneX, L.footerY, L.doneW, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));

        const detailButtons = this.getDetailButtons();
        this.modToggleButton = new ModsButton(this.getModToggleLabel(), detailButtons.toggle.x, detailButtons.toggle.y, detailButtons.toggle.w, 20, () => {
            this.toggleSelectedMod();
        });
        this.buttonList.push(this.modToggleButton);
        this.updateModToggleButton();

        this.installDropHandlers();
    }

    getLayout() {
        const marginX = Math.max(8, Math.floor(this.width * 0.03));
        const marginY = Math.max(8, Math.floor(this.height * 0.045));
        const frameX = marginX;
        const frameY = marginY;
        const frameW = this.width - marginX * 2;
        const frameH = this.height - marginY * 2;
        const titleY = Math.max(6, frameY - 21);
        const footerY = frameY + frameH - 39;
        const searchY = frameY + 1;
        const bottomPanelY = frameY + frameH - 70;
        const leftW = Math.max(230, Math.floor(frameW * 0.46));
        const gap = Math.max(10, Math.floor(frameW * 0.025));
        const rightX = frameX + leftW + gap;
        const rightW = frameX + frameW - rightX;
        const listTop = frameY + 88;
        const listBottom = bottomPanelY - 8;
        const searchW = leftW - 48;
        const filterX = frameX + searchW + 8;
        const openW = Math.min(300, Math.max(160, Math.floor(frameW * 0.32)));
        const doneW = Math.min(300, Math.max(160, Math.floor(frameW * 0.32)));
        const openX = frameX + Math.floor(leftW * 0.41);
        const doneX = rightX + Math.floor((rightW - doneW) / 2);

        return {
            frameX, frameY, frameW, frameH, titleY,
            leftX: frameX, leftW, rightX, rightW, gap,
            searchX: frameX + 1, searchY, searchW, filterX,
            listTop, listBottom, bottomPanelY, footerY,
            openX, openW, doneX, doneW
        };
    }

    getBuiltInMods() {
        // Real bundled mods only. User-imported ZIP mods are appended below;
        // no placeholder/fake feature entries are invented here.
        return [
            {...SODIUM_CLIENT_MOD_META, enabled: this.isBuiltInModEnabled(SODIUM_CLIENT_MOD_META.id)},
            {...XAEROS_MINIMAP_CLIENT_MOD_META, enabled: this.isBuiltInModEnabled(XAEROS_MINIMAP_CLIENT_MOD_META.id)},
            {...CHAT_HEADS_CLIENT_MOD_META, enabled: this.isBuiltInModEnabled(CHAT_HEADS_CLIENT_MOD_META.id)},
            {...LAMB_DYNAMIC_LIGHTS_MOD_META, enabled: this.isBuiltInModEnabled(LAMB_DYNAMIC_LIGHTS_MOD_META.id)},
            {...MIMICER_BOTH_MOD_META, enabled: this.isBuiltInModEnabled(MIMICER_BOTH_MOD_META.id)},
            {...VOICE_CHAT_SERVER_MOD_META, enabled: this.isBuiltInModEnabled(VOICE_CHAT_SERVER_MOD_META.id)}
        ];
    }

    getAllMods() {
        const importedMods = this.savedMods.map((mod, index) => ({
            id: "local_" + mod.name,
            name: String(mod.name || "Imported Mod").replace(/\.zip$/i, ""),
            fileName: mod.name,
            version: this.formatSize(mod.size),
            badge: "Local",
            authors: ["Imported ZIP"],
            summary: "Local browser mod package.",
            description: `Imported from ${mod.name}. Stored in this browser and loaded when the game starts. Added ${this.formatDate(mod.date)}.`,
            icon: "zip",
            license: "User supplied",
            website: "Stored in IndexedDB",
            issues: "Remove and re-import to update",
            date: mod.date,
            size: mod.size,
            enabled: mod.enabled !== false,
            removable: true,
            originalName: mod.name
        }));
        return [...this.getBuiltInMods(), ...importedMods];
    }

    ensureSelection() {
        const mods = this.getAllMods();
        if (!mods.some(mod => mod.id === this.selectedModId)) {
            this.selectedModId = mods[0]?.id || null;
        }
    }

    getFilteredMods() {
        const query = this.searchQuery.trim().toLowerCase();
        return this.getAllMods().filter(mod => {
            if (!query) return true;
            return [mod.name, mod.summary, mod.badge, ...(mod.authors || [])]
                .some(value => String(value || "").toLowerCase().includes(query));
        });
    }

    getSelectedMod() {
        return this.getAllMods().find(mod => mod.id === this.selectedModId) || this.getAllMods()[0] || null;
    }

    getDetailButtons() {
        const L = this.layout || this.getLayout();
        const x = L.rightX;
        const y = L.frameY + 124;
        const w = L.rightW;
        return {
            toggle: {x, y, w: Math.max(120, Math.min(220, Math.floor(w * 0.48)))}
        };
    }

    isBuiltInModEnabled(id) {
        if (id === VOICE_CHAT_SERVER_MOD_META.id) {
            try {
                return localStorage.getItem(VOICE_CHAT_SERVER_MOD_STORAGE_KEY) !== "false";
            } catch (_) {
                return true;
            }
        }
        if (id === SODIUM_CLIENT_MOD_META.id) {
            try {
                return localStorage.getItem(SODIUM_CLIENT_MOD_STORAGE_KEY) !== "false";
            } catch (_) {
                return true;
            }
        }
        if (id === XAEROS_MINIMAP_CLIENT_MOD_META.id) {
            try {
                return localStorage.getItem(XAEROS_MINIMAP_CLIENT_MOD_STORAGE_KEY) !== "false";
            } catch (_) {
                return true;
            }
        }
        if (id === CHAT_HEADS_CLIENT_MOD_META.id) {
            try {
                return localStorage.getItem(CHAT_HEADS_CLIENT_MOD_STORAGE_KEY) !== "false";
            } catch (_) {
                return true;
            }
        }
        if (id === LAMB_DYNAMIC_LIGHTS_MOD_META.id) {
            try {
                return localStorage.getItem(LAMB_DYNAMIC_LIGHTS_MOD_STORAGE_KEY) !== "false";
            } catch (_) {
                return true;
            }
        }
        if (id === MIMICER_BOTH_MOD_META.id) {
            try {
                return localStorage.getItem(MIMICER_BOTH_MOD_STORAGE_KEY) !== "false";
            } catch (_) {
                return true;
            }
        }
        return true;
    }

    setBuiltInModEnabled(id, enabled) {
        if (id === VOICE_CHAT_SERVER_MOD_META.id) {
            try {
                localStorage.setItem(VOICE_CHAT_SERVER_MOD_STORAGE_KEY, enabled ? "true" : "false");
            } catch (_) {}
            const activeVoiceMod = this.minecraft?.multiplayer?.voiceChatServerMod;
            if (activeVoiceMod?.setGloballyEnabled) activeVoiceMod.setGloballyEnabled(enabled);
            else if (!enabled && this.minecraft?.multiplayer?.disableVoiceChat) this.minecraft.multiplayer.disableVoiceChat();
        }
        if (id === SODIUM_CLIENT_MOD_META.id) {
            try {
                localStorage.setItem(SODIUM_CLIENT_MOD_STORAGE_KEY, enabled ? "true" : "false");
            } catch (_) {}
            const sodium = this.minecraft?.sodiumClientMod;
            if (sodium?.setGloballyEnabled) sodium.setGloballyEnabled(enabled);
            else if (this.minecraft?.worldRenderer) {
                this.minecraft.worldRenderer.rebuildAll();
                this.minecraft.worldRenderer.flushRebuild = true;
            }
        }
        if (id === XAEROS_MINIMAP_CLIENT_MOD_META.id) {
            try {
                localStorage.setItem(XAEROS_MINIMAP_CLIENT_MOD_STORAGE_KEY, enabled ? "true" : "false");
            } catch (_) {}
            this.minecraft?.xaerosMinimapClientMod?.setGloballyEnabled?.(enabled);
        }
        if (id === CHAT_HEADS_CLIENT_MOD_META.id) {
            try {
                localStorage.setItem(CHAT_HEADS_CLIENT_MOD_STORAGE_KEY, enabled ? "true" : "false");
            } catch (_) {}
            this.minecraft?.chatHeadsClientMod?.setGloballyEnabled?.(enabled);
        }
        if (id === LAMB_DYNAMIC_LIGHTS_MOD_META.id) {
            try {
                localStorage.setItem(LAMB_DYNAMIC_LIGHTS_MOD_STORAGE_KEY, enabled ? "true" : "false");
            } catch (_) {}
            this.minecraft?.lambDynamicLightsMod?.setGloballyEnabled?.(enabled);
        }
        if (id === MIMICER_BOTH_MOD_META.id) {
            try {
                localStorage.setItem(MIMICER_BOTH_MOD_STORAGE_KEY, enabled ? "true" : "false");
            } catch (_) {}
            this.minecraft?.mimicerBothMod?.setGloballyEnabled?.(enabled);
        }
    }

    getModToggleLabel() {
        const mod = this.getSelectedMod();
        return mod && mod.enabled === false ? "Enable" : "Disable";
    }

    updateModToggleButton() {
        if (!this.modToggleButton) return;
        const mod = this.getSelectedMod();
        this.modToggleButton.string = this.getModToggleLabel();
        this.modToggleButton.setEnabled(!!mod);
    }

    async toggleSelectedMod() {
        const mod = this.getSelectedMod();
        if (!mod) return;
        const nextEnabled = mod.enabled === false;
        try {
            if (mod.builtIn) {
                this.setBuiltInModEnabled(mod.id, nextEnabled);
                this.statusMessage = `${mod.name} ${nextEnabled ? "enabled" : "disabled"}.`;
            } else {
                const module = await import("../../world/storage/WorldStorage.js");
                await module.default.setModEnabled(mod.originalName || mod.fileName || mod.name, nextEnabled);
                this.savedMods = await module.default.getModList();
                this.statusMessage = `${mod.name} ${nextEnabled ? "enabled" : "disabled"}. Reload the game to apply imported mod changes.`;
                this.hasPendingChanges = true;
            }
            this.ensureSelection();
            this.updateModToggleButton();
        } catch (error) {
            console.error("Failed to toggle mod:", error);
            this.statusMessage = "Could not change that mod's enabled state.";
        }
    }

    formatSize(size = 0) {
        if (size < 1024) return `${size || 0} B`;
        if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    formatDate(timestamp) {
        if (!timestamp) return "Unknown date";
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return "Unknown date";
        return date.toLocaleDateString(undefined, {year: "numeric", month: "short", day: "numeric"});
    }

    truncate(stack, text, maxWidth) {
        const value = String(text || "");
        if (this.getStringWidth(stack, value) <= maxWidth) return value;
        let result = value;
        while (result.length > 1 && this.getStringWidth(stack, result + "...") > maxWidth) result = result.slice(0, -1);
        return result + "...";
    }

    wrapText(stack, text, maxWidth, maxLines = 4) {
        const words = String(text || "").split(/\s+/).filter(Boolean);
        const lines = [];
        let line = "";
        for (const word of words) {
            const next = line ? line + " " + word : word;
            if (this.getStringWidth(stack, next) <= maxWidth) {
                line = next;
            } else {
                if (line) lines.push(line);
                line = word;
            }
            if (lines.length >= maxLines) break;
        }
        if (line && lines.length < maxLines) lines.push(line);
        if (words.length && lines.length === maxLines && this.getStringWidth(stack, lines[lines.length - 1] + "...") <= maxWidth) {
            lines[lines.length - 1] += "...";
        }
        return lines;
    }

    openModZipPicker() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".zip,application/zip,application/x-zip-compressed";
        input.onchange = async event => {
            const file = event.target.files?.[0];
            if (!file) return;
            await this.saveModFile(file);
        };
        input.click();
    }

    async saveModFile(file) {
        if (!file) return;
        try {
            const module = await import("../../world/storage/WorldStorage.js");
            await module.default.saveMod(file.name, file);
            this.selectedModId = "local_" + file.name;
            this.statusMessage = `Added ${file.name}. Restart or reload to activate it.`;
            this.hasPendingChanges = true;
            this.isLoading = true;
            this.init();
        } catch (error) {
            console.error("Failed to save mod:", error);
            this.statusMessage = "Could not save that mod archive.";
        }
    }

    removeSelectedMod() {
        const mod = this.getSelectedMod();
        if (!mod || !mod.removable) return;
        if (!window.confirm(`Remove ${mod.fileName || mod.name} from this device?`)) return;
        import("../../world/storage/WorldStorage.js").then(module => module.default.deleteMod(mod.originalName || mod.fileName || mod.name))
            .then(() => {
                this.statusMessage = `Removed ${mod.name}. Restart or reload to apply.`;
                this.selectedModId = SODIUM_CLIENT_MOD_META.id;
                this.hasPendingChanges = true;
                this.isLoading = true;
                this.init();
            }).catch(error => {
                console.error("Failed to remove mod:", error);
                this.statusMessage = "Could not remove that mod.";
            });
    }

    installDropHandlers() {
        if (this.dropHandlersInstalled || typeof window === "undefined") return;
        this.dropHandlersInstalled = true;
        this._modsDragOver = event => {
            if (this.minecraft.currentScreen !== this) return;
            event.preventDefault();
        };
        this._modsDrop = event => {
            if (this.minecraft.currentScreen !== this) return;
            event.preventDefault();
            const file = Array.from(event.dataTransfer?.files || []).find(f => f.name.toLowerCase().endsWith(".zip"));
            if (file) this.saveModFile(file);
            else this.statusMessage = "Drop a .zip mod archive into this window.";
        };
        window.addEventListener("dragover", this._modsDragOver);
        window.addEventListener("drop", this._modsDrop);
    }

    onClose() {
        if (this._modsDragOver) window.removeEventListener("dragover", this._modsDragOver);
        if (this._modsDrop) window.removeEventListener("drop", this._modsDrop);
        this.dropHandlersInstalled = false;
    }

    updateScreen() {
        super.updateScreen();
        if (!this.searchField) return;
        const query = this.searchField.getText();
        if (query !== this.searchQuery) {
            this.searchQuery = query;
            this.scrollY = 0;
            const visible = this.getFilteredMods();
            if (!visible.some(mod => mod.id === this.selectedModId)) this.selectedModId = visible[0]?.id || null;
        }
        this.updateModToggleButton();
    }

    handleMouseScroll(delta) {
        if (!this.layout) return;
        const rowH = 72;
        const visibleH = Math.max(1, this.layout.listBottom - this.layout.listTop);
        const totalH = this.getFilteredMods().length * rowH;
        this.scrollY = MathHelper.clamp(this.scrollY + delta * 28, 0, Math.max(0, totalH - visibleH));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        if (!this.layout) this.layout = this.getLayout();
        const L = this.layout;

        // Translucent/blur-like overlay over the game, matching the screenshot.
        this.drawRect(stack, 0, 0, this.width, this.height, "#0A0A0B", 0.48);
        this.drawRect(stack, L.frameX, L.frameY, L.frameX + L.frameW, L.frameY + L.frameH, "#0A0A0C", 0.70);
        this.drawString(stack, "Mods", Math.floor(this.width / 2) - 20, L.titleY, 0xFFFFFF);
        this.drawString(stack, "Drag and drop files into", L.rightX + Math.max(0, (L.rightW - 185) / 2), L.titleY + 7, 0xD0D0D0);
        this.drawString(stack, "this window to add mods", L.rightX + Math.max(0, (L.rightW - 185) / 2), L.titleY + 20, 0xD0D0D0);

        this.drawPanels(stack, mouseX, mouseY);

        if (this.isLoading) {
            this.drawCenteredString(stack, "Opening local mod library...", L.leftX + L.leftW / 2, (L.listTop + L.listBottom) / 2, 0xFFFFFF);
        } else if (this.loadError) {
            this.drawCenteredString(stack, this.loadError, L.leftX + L.leftW / 2, (L.listTop + L.listBottom) / 2, 0xFF7777);
        } else {
            this.drawModList(stack, mouseX, mouseY);
            this.drawDetailPanel(stack, mouseX, mouseY);
        }

        const hint = this.statusMessage || (this.hasPendingChanges ? "Changes saved. Reload the game to activate imported mods." : "Drop .zip files here or use Open Mods Folder to import them.");
        this.drawString(stack, this.truncate(stack, hint, L.frameW - 24), L.frameX + 6, L.frameY + L.frameH - 14, 0xAAAAAA);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    drawPanels(stack, mouseX, mouseY) {
        const L = this.layout;
        this.drawRect(stack, L.leftX - 1, L.searchY - 1, L.leftX + L.leftW, L.frameY + L.frameH - 70, "#08080A", 0.85);
        this.drawRect(stack, L.rightX - 1, L.searchY + 28, L.rightX + L.rightW, L.frameY + L.frameH - 70, "#08080A", 0.85);
        this.drawRect(stack, L.leftX, L.searchY + 28, L.leftX + L.leftW - 2, L.frameY + L.frameH - 70, "#15151A", 0.72);
        this.drawRect(stack, L.rightX, L.searchY + 28, L.rightX + L.rightW - 2, L.frameY + L.frameH - 70, "#15151A", 0.72);

        // Filter button beside search.
        const fx = L.filterX;
        this.drawRect(stack, fx, L.searchY - 1, fx + 30, L.searchY + 21, "#E0E0E4");
        this.drawRect(stack, fx + 2, L.searchY + 1, fx + 28, L.searchY + 19, "#6A6B70");
        this.drawRect(stack, fx + 7, L.searchY + 5, fx + 23, L.searchY + 7, "#D8D8DC");
        this.drawRect(stack, fx + 11, L.searchY + 9, fx + 19, L.searchY + 11, "#D8D8DC");
        this.drawRect(stack, fx + 14, L.searchY + 13, fx + 16, L.searchY + 15, "#D8D8DC");

        const countText = `Showing ${this.getFilteredMods().length} mods`;
        this.drawString(stack, countText, L.leftX, L.searchY + 36, 0xFFFFFF);
    }

    getIconImage(path) {
        if (!path || typeof Image === "undefined") return null;
        const key = String(path);
        let entry = this.iconImageCache.get(key);
        if (!entry) {
            const img = new Image();
            entry = {img, loaded: false, failed: false};
            img.onload = () => { entry.loaded = true; };
            img.onerror = () => { entry.failed = true; };
            img.src = key;
            this.iconImageCache.set(key, entry);
        }
        return entry.loaded && !entry.failed ? entry.img : null;
    }

    drawIcon(stack, x, y, mod, size = 64) {
        const s = size;
        const customIcon = this.getIconImage(mod.iconImage || (String(mod.icon || "").match(/\.(png|jpe?g|webp|gif)$/i) ? mod.icon : null));
        if (customIcon) {
            stack.save();
            stack.imageSmoothingEnabled = false;
            stack.drawImage(customIcon, Math.floor(x), Math.floor(y), Math.floor(s), Math.floor(s));
            stack.restore();
            return;
        }
        if (mod.icon === "grass" || mod.id === "minecraft") {
            this.drawRect(stack, x, y, x + s, y + s, "#8A5A39");
            this.drawRect(stack, x, y, x + s, y + s * 0.36, "#4FA43F");
            this.drawRect(stack, x + s * 0.18, y + s * 0.38, x + s * 0.32, y + s * 0.55, "#6B3F27");
            this.drawRect(stack, x + s * 0.55, y + s * 0.42, x + s * 0.78, y + s * 0.64, "#A8794F");
        } else if (mod.icon === "menu" || mod.id === "mod_menu") {
            this.drawRect(stack, x, y, x + s, y + s, "#0D6BDE");
            for (let i = 0; i < 4; i++) {
                this.drawRect(stack, x + s * 0.18, y + s * (0.16 + i * 0.19), x + s * 0.30, y + s * (0.24 + i * 0.19), "#FFFFFF");
                this.drawRect(stack, x + s * 0.36, y + s * (0.16 + i * 0.19), x + s * 0.82, y + s * (0.24 + i * 0.19), "#FFFFFF");
            }
        } else if (mod.icon === "nether") {
            this.drawRect(stack, x, y, x + s, y + s, "#E22D2D");
            this.drawRect(stack, x + s * 0.16, y + s * 0.18, x + s * 0.82, y + s * 0.32, "#FFFFFF");
            this.drawRect(stack, x + s * 0.22, y + s * 0.32, x + s * 0.42, y + s * 0.78, "#FFFFFF");
            this.drawRect(stack, x + s * 0.42, y + s * 0.46, x + s * 0.72, y + s * 0.78, "#FFFFFF");
        } else if (mod.icon === "tree") {
            this.drawRect(stack, x, y, x + s, y + s, "#0D54B5");
            this.drawRect(stack, x + s * 0.45, y + s * 0.20, x + s * 0.56, y + s * 0.82, "#FFFFFF");
            this.drawRect(stack, x + s * 0.32, y + s * 0.38, x + s * 0.69, y + s * 0.49, "#FFFFFF");
            this.drawRect(stack, x + s * 0.25, y + s * 0.58, x + s * 0.76, y + s * 0.70, "#FFFFFF");
        } else if (mod.icon === "music") {
            this.drawRect(stack, x, y, x + s, y + s, "#10A65A");
            this.drawRect(stack, x + s * 0.34, y + s * 0.20, x + s * 0.48, y + s * 0.72, "#FFFFFF");
            this.drawRect(stack, x + s * 0.48, y + s * 0.20, x + s * 0.72, y + s * 0.30, "#FFFFFF");
            this.drawRect(stack, x + s * 0.22, y + s * 0.62, x + s * 0.44, y + s * 0.82, "#FFFFFF");
        } else if (mod.icon === "voice") {
            this.drawRect(stack, x, y, x + s, y + s, "#2C5DB8");
            this.drawRect(stack, x + s * 0.38, y + s * 0.17, x + s * 0.62, y + s * 0.57, "#FFFFFF");
            this.drawRect(stack, x + s * 0.43, y + s * 0.12, x + s * 0.57, y + s * 0.22, "#D7E8FF");
            this.drawRect(stack, x + s * 0.29, y + s * 0.42, x + s * 0.35, y + s * 0.60, "#FFFFFF");
            this.drawRect(stack, x + s * 0.65, y + s * 0.42, x + s * 0.71, y + s * 0.60, "#FFFFFF");
            this.drawRect(stack, x + s * 0.47, y + s * 0.57, x + s * 0.53, y + s * 0.78, "#FFFFFF");
            this.drawRect(stack, x + s * 0.34, y + s * 0.78, x + s * 0.66, y + s * 0.86, "#FFFFFF");
        } else {
            this.drawRect(stack, x, y, x + s, y + s, "#25BFD5");
            this.drawRect(stack, x + s * 0.18, y + s * 0.18, x + s * 0.36, y + s * 0.36, "#FFFFFF");
            this.drawRect(stack, x + s * 0.52, y + s * 0.28, x + s * 0.78, y + s * 0.44, "#FFFFFF");
            this.drawRect(stack, x + s * 0.24, y + s * 0.62, x + s * 0.70, y + s * 0.76, "#FFFFFF");
        }
    }

    drawModList(stack, mouseX, mouseY) {
        const L = this.layout;
        const mods = this.getFilteredMods();
        const rowH = 72;
        const visibleH = Math.max(1, L.listBottom - L.listTop);
        this.rowAreas = [];

        stack.save();
        stack.beginPath();
        stack.rect(L.leftX, L.listTop, L.leftW - 8, visibleH);
        stack.clip();

        for (let i = 0; i < mods.length; i++) {
            const mod = mods[i];
            const y = L.listTop + i * rowH - this.scrollY;
            if (y + rowH < L.listTop || y > L.listBottom) continue;
            const selected = mod.id === this.selectedModId;
            const hover = mouseX >= L.leftX && mouseX <= L.leftX + L.leftW - 10 && mouseY >= y && mouseY <= y + rowH - 4;
            const disabled = mod.enabled === false;
            const bg = disabled
                ? (selected ? "#232327" : (hover ? "#1D1D20" : "#131316"))
                : (selected ? "#2D2C38" : (hover ? "#24242C" : "#17171E"));
            this.drawRect(stack, L.leftX, y, L.leftX + L.leftW - 10, y + rowH - 4, bg, 0.94);
            if (selected) {
                this.drawRect(stack, L.leftX, y, L.leftX + L.leftW - 10, y + 1, "#DADDE2");
                this.drawRect(stack, L.leftX, y + rowH - 5, L.leftX + L.leftW - 10, y + rowH - 4, "#DADDE2");
                this.drawRect(stack, L.leftX, y, L.leftX + 1, y + rowH - 4, "#DADDE2");
                this.drawRect(stack, L.leftX + L.leftW - 11, y, L.leftX + L.leftW - 10, y + rowH - 4, "#DADDE2");
            }
            this.drawIcon(stack, L.leftX + 10, y + 9, mod, 54);
            if (disabled) {
                this.drawRect(stack, L.leftX + 10, y + 9, L.leftX + 64, y + 63, "#4B4B50", 0.55);
            }
            const textX = L.leftX + 73;
            const title = this.truncate(stack, mod.name, L.leftW - 150);
            const titleColor = mod.enabled === false ? 0x8A8A8A : 0xFFFFFF;
            this.drawString(stack, title, textX, y + 9, titleColor);
            if (mod.badge) {
                const tw = this.getStringWidth(stack, title);
                const bx = textX + tw + 6;
                const bw = this.getStringWidth(stack, mod.badge) + 8;
                this.drawRect(stack, bx, y + 8, bx + bw, y + 20, disabled ? "#333337" : "#2B425C", 1);
                this.drawCenteredString(stack, mod.badge, bx + bw / 2, y + 11, disabled ? 0x9A9A9A : 0xCBE8FF);
            }
            const lines = this.wrapText(stack, mod.summary, L.leftW - 88, 2);
            const summaryColor = mod.enabled === false ? 0x777777 : 0xB8B8B8;
            for (let line = 0; line < lines.length; line++) {
                this.drawString(stack, lines[line], textX, y + 25 + line * 12, summaryColor);
            }
            if (mod.removable) {
                this.drawRect(stack, L.leftX + L.leftW - 32, y + 45, L.leftX + L.leftW - 18, y + 59, "#1C4131", 1);
                this.drawCenteredString(stack, "Z", L.leftX + L.leftW - 25, y + 49, 0x9CFFB7);
            }
            this.rowAreas.push({id: mod.id, y, h: rowH - 4});
        }
        stack.restore();

        if (!mods.length) {
            this.drawCenteredString(stack, "No mods match your search", L.leftX + L.leftW / 2, (L.listTop + L.listBottom) / 2, 0xFFFFFF);
        }

        const maxScroll = Math.max(0, mods.length * rowH - visibleH);
        if (maxScroll > 0) {
            const barX = L.leftX + L.leftW - 12;
            const thumbH = Math.max(24, visibleH * (visibleH / (visibleH + maxScroll)));
            const thumbY = L.listTop + (visibleH - thumbH) * (this.scrollY / maxScroll);
            this.drawRect(stack, barX, L.listTop, barX + 8, L.listBottom, "#111116", 1);
            this.drawRect(stack, barX + 1, thumbY, barX + 7, thumbY + thumbH, "#B7B7BD", 1);
        }
    }

    drawDetailPanel(stack, mouseX, mouseY) {
        const L = this.layout;
        const mod = this.getSelectedMod();
        if (!mod) return;
        const x = L.rightX;
        const top = L.searchY + 52;
        this.drawIcon(stack, x, top, mod, 64);
        this.drawString(stack, this.truncate(stack, mod.name, L.rightW - 96), x + 76, top + 7, 0xFFFFFF);
        if (mod.badge) {
            const tw = this.getStringWidth(stack, mod.name);
            const bx = Math.min(x + L.rightW - 72, x + 80 + tw + 5);
            const bw = this.getStringWidth(stack, mod.badge) + 8;
            this.drawRect(stack, bx, top + 6, bx + bw, top + 18, "#2B425C", 1);
            this.drawCenteredString(stack, mod.badge, bx + bw / 2, top + 9, 0xCBE8FF);
        }
        this.drawString(stack, mod.version || "", x + 76, top + 24, 0xB8B8B8);
        this.drawString(stack, "By " + (mod.authors || []).join(", "), x + 76, top + 39, 0x9A9A9A);
        this.drawString(stack, "Status: " + (mod.enabled === false ? "Disabled" : "Enabled"), x + 76, top + 54, mod.enabled === false ? 0xFFB3B3 : 0x9CFFB7);

        const bodyTop = top + 114;
        const bodyBottom = L.frameY + L.frameH - 72;
        this.drawRect(stack, x, bodyTop, x + L.rightW - 2, bodyBottom, "#101014", 0.78);
        this.drawRect(stack, x, bodyTop, x + L.rightW - 2, bodyTop + 2, "#050506", 0.9);
        let y = bodyTop + 12;
        for (const line of this.wrapText(stack, mod.description, L.rightW - 28, 5)) {
            this.drawString(stack, line, x + 12, y, 0xD0D0D0);
            y += 12;
        }
        y += 12;
        this.drawString(stack, "Environment:", x + 12, y, 0xCFCFCF); y += 12;
        this.drawString(stack, mod.environment || (mod.serverSide ? "Server" : "Client"), x + 28, y, 0xD0D0D0); y += 20;
        this.drawString(stack, "License:", x + 12, y, 0xCFCFCF); y += 12;
        this.drawString(stack, mod.license || "Unknown", x + 28, y, 0xD0D0D0); y += 22;
        this.drawString(stack, "Credits:", x + 12, y, 0xCFCFCF); y += 12;
        this.drawString(stack, "Authors:", x + 28, y, 0xD0D0D0); y += 12;
        for (const author of (mod.authors || []).slice(0, 5)) {
            this.drawString(stack, author, x + 44, y, 0xD0D0D0);
            y += 12;
        }
        if (mod.removable) {
            this.drawString(stack, "Right click this mod in the list to remove it.", x + 12, bodyBottom - 14, 0xFFB3B3);
        }
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        if (mouseButton === 0 || mouseButton === 1 || mouseButton === 2) {
            const L = this.layout;
            for (const row of this.rowAreas) {
                if (mouseX >= L.leftX && mouseX <= L.leftX + L.leftW - 10 && mouseY >= row.y && mouseY <= row.y + row.h) {
                    this.selectedModId = row.id;
                    this.updateModToggleButton();
                    if (mouseButton === 2) this.removeSelectedMod();
                    return;
                }
            }
        }
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }

    keyTyped(key, character) {
        if (key === "Escape") {
            this.minecraft.displayScreen(this.previousScreen);
            return true;
        }
        return super.keyTyped(key, character);
    }

    doesGuiPauseGame() {
        return false;
    }
}
