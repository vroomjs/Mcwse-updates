import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiTextField from "../widgets/GuiTextField.js";
import MathHelper from "../../../util/MathHelper.js";

/** A dark, framed action button used by the full-screen Mods library. */
class ModsButton extends GuiButton {
    constructor(label, x, y, width, height, callback, variant = "dark") {
        super(label, x, y, width, height, callback);
        this.variant = variant;
    }

    render(stack, mouseX, mouseY) {
        if (!this.minecraft) return;
        const hovered = this.isMouseOver(mouseX, mouseY);
        const palette = {
            dark: ["#25282B", "#111315", "#565B60", "#D4D4D4"],
            gold: ["#4B3820", "#211A13", "#BC8732", "#FFD36A"],
            green: ["#4F6E22", "#243312", "#A1C94D", "#E5F39B"],
            danger: ["#6B2A26", "#301310", "#BF6058", "#FFD1CA"]
        }[this.variant] || ["#25282B", "#111315", "#565B60", "#D4D4D4"];
        const [fill, inset, edge, text] = palette;
        const shade = !this.enabled ? "#222426" : (hovered ? edge : fill);

        this.drawRect(stack, this.x, this.y, this.x + this.width, this.y + this.height, "#08090A");
        this.drawRect(stack, this.x + 1, this.y + 1, this.x + this.width - 1, this.y + this.height - 1, shade);
        this.drawRect(stack, this.x + 3, this.y + 3, this.x + this.width - 3, this.y + this.height - 3, this.enabled ? inset : "#17191B");
        this.drawRect(stack, this.x + 3, this.y + 3, this.x + this.width - 3, this.y + 4, this.enabled ? edge : "#3A3D40");
        this.drawCenteredStringNoShadow(stack, this.string, this.x + this.width / 2, this.y + this.height / 2 - 4, this.enabled ? text : 0x777777);
    }
}

/** A themed search field retaining standard keyboard and clipboard behavior. */
class ModsSearchField extends GuiTextField {
    render(stack) {
        const focused = this.isFocused;
        const cursorVisible = focused && Math.floor(this.cursorCounter / 6) % 2 === 0;
        this.drawRect(stack, this.x - 1, this.y - 1, this.x + this.width + 1, this.y + this.height + 1, focused ? "#B88B41" : "#505357");
        this.drawRect(stack, this.x, this.y, this.x + this.width, this.y + this.height, "#101112");
        this.drawRect(stack, this.x + 2, this.y + 2, this.x + this.width - 2, this.y + this.height - 2, "#1A1C1E");
        const display = this.text || "Search mods...";
        const color = this.text ? 0xEEEEEE : 0x929292;
        this.drawStringNoShadow(stack, display, this.x + 21, this.y + this.height / 2 - 4, color);
        // Minimal procedural magnifier so no external UI asset is needed.
        this.drawRect(stack, this.x + 8, this.y + 6, this.x + 13, this.y + 11, "#A4A4A4");
        this.drawRect(stack, this.x + 7, this.y + 7, this.x + 14, this.y + 10, "#A4A4A4");
        this.drawRect(stack, this.x + 13, this.y + 12, this.x + 16, this.y + 14, "#A4A4A4");
        if (cursorVisible) {
            this.drawStringNoShadow(stack, "_", this.x + 21 + this.getStringWidth(stack, this.text), this.y + this.height / 2 - 4, 0xEEEEEE);
        }
    }
}

/**
 * Full-screen local mod manager, visually modelled after a game launcher:
 * stone frame, sidebar, searchable package cards, and a footer Apply action.
 */
export default class GuiMods extends GuiScreen {
    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.savedMods = [];
        this.selectedModName = null;
        this.searchQuery = "";
        this.sortMode = "name";
        this.scrollY = 0;
        this.isLoading = true;
        this.loadError = null;
        this.statusMessage = "";
        this.hasPendingChanges = false;
        this.searchField = null;
        this.layout = null;
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
                    this.init();
                });
            return;
        }

        const L = this.layout;
        this.searchField = new ModsSearchField(L.searchX, L.searchY, L.searchW, 20);
        this.searchField.text = this.searchQuery;
        this.searchField.maxLength = 48;
        this.buttonList.push(this.searchField);

        const sortLabel = this.sortMode === "name" ? "Sort: Name (A-Z)" : "Sort: Recently Added";
        this.buttonList.push(new ModsButton(sortLabel, L.sortX, L.searchY, L.sortW, 20, () => {
            this.sortMode = this.sortMode === "name" ? "recent" : "name";
            this.init();
        }));

        this.buttonList.push(new ModsButton("<  BACK", L.backX, L.footerButtonY, L.backW, 26, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }, "gold"));
        this.buttonList.push(new ModsButton("REMOVE SELECTED", L.removeX, L.footerButtonY, L.removeW, 26, () => {
            this.removeSelectedMod();
        }, "danger").setEnabled(!!this.getSelectedMod()));
        this.buttonList.push(new ModsButton(this.hasPendingChanges ? "APPLY & RELOAD" : "RELOAD MODS", L.applyX, L.footerButtonY, L.applyW, 26, () => {
            window.location.reload();
        }, "green"));
    }

    getLayout() {
        const outer = Math.max(10, Math.min(34, Math.floor(Math.min(this.width, this.height) * 0.045)));
        const frameW = Math.min(this.width - outer * 2, 1120);
        const frameH = Math.min(this.height - outer * 2, 640);
        const frameX = Math.floor((this.width - frameW) / 2);
        const frameY = Math.floor((this.height - frameH) / 2);
        const headerH = Math.max(52, Math.min(68, Math.floor(frameH * 0.12)));
        const footerH = Math.max(52, Math.min(62, Math.floor(frameH * 0.11)));
        const sidebarW = Math.max(146, Math.min(245, Math.floor(frameW * 0.25)));
        const contentX = frameX + sidebarW + 18;
        const contentW = Math.max(120, frameX + frameW - 18 - contentX);
        const contentTop = frameY + headerH;
        const contentBottom = frameY + frameH - footerH;
        const searchY = contentTop + 12;
        const sortW = Math.max(105, Math.min(165, Math.floor(contentW * 0.29)));
        const searchW = Math.max(90, contentW - sortW - 12);
        const listTop = searchY + 32;
        const listBottom = contentBottom - 12;
        const footerButtonY = frameY + frameH - footerH + Math.floor((footerH - 26) / 2);
        const backX = frameX + 16;
        const backW = Math.max(88, Math.min(148, Math.floor(frameW * 0.15)));
        const applyW = Math.max(112, Math.min(172, Math.floor(frameW * 0.18)));
        const applyX = frameX + frameW - applyW - 16;
        const removeW = Math.max(92, Math.min(146, Math.floor(frameW * 0.16)));
        const removeX = Math.max(backX + backW + 8, applyX - removeW - 8);

        return {
            frameX, frameY, frameW, frameH, headerH, footerH, sidebarW,
            contentX, contentW, contentTop, contentBottom, searchX: contentX,
            searchY, searchW, sortX: contentX + searchW + 12, sortW,
            listTop, listBottom, footerButtonY, backX, backW, removeX, removeW, applyX, applyW
        };
    }

    ensureSelection() {
        if (!this.savedMods.some(mod => mod.name === this.selectedModName)) {
            this.selectedModName = this.savedMods[0]?.name || null;
        }
    }

    getFilteredMods() {
        const query = this.searchQuery.trim().toLowerCase();
        const mods = this.savedMods.filter(mod => !query || String(mod.name || "").toLowerCase().includes(query));
        return mods.sort((a, b) => {
            if (this.sortMode === "recent") return (b.date || 0) - (a.date || 0);
            return String(a.name || "").localeCompare(String(b.name || ""));
        });
    }

    getSelectedMod() {
        return this.savedMods.find(mod => mod.name === this.selectedModName) || null;
    }

    formatSize(size = 0) {
        if (size < 1024) return `${size} B`;
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
        const value = String(text || "Unnamed Mod");
        if (this.getStringWidth(stack, value) <= maxWidth) return value;
        let result = value;
        while (result.length > 1 && this.getStringWidth(stack, result + "...") > maxWidth) result = result.slice(0, -1);
        return result + "...";
    }

    openModZipPicker() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".zip,application/zip,application/x-zip-compressed";
        input.onchange = async event => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
                const module = await import("../../world/storage/WorldStorage.js");
                await module.default.saveMod(file.name, file);
                this.selectedModName = file.name;
                this.statusMessage = `Added ${file.name}. Click Apply to reload it.`;
                this.hasPendingChanges = true;
                this.isLoading = true;
                this.init();
            } catch (error) {
                console.error("Failed to save mod:", error);
                this.statusMessage = "Could not save that mod archive.";
            }
        };
        input.click();
    }

    removeSelectedMod() {
        const mod = this.getSelectedMod();
        if (!mod) return;
        if (!window.confirm(`Remove ${mod.name} from this device?`)) return;
        import("../../world/storage/WorldStorage.js").then(module => module.default.deleteMod(mod.name))
            .then(() => {
                this.statusMessage = `Removed ${mod.name}. Click Apply to reload.`;
                this.selectedModName = null;
                this.hasPendingChanges = true;
                this.isLoading = true;
                this.init();
            }).catch(error => {
                console.error("Failed to remove mod:", error);
                this.statusMessage = "Could not remove that mod.";
            });
    }

    openGuide() {
        import("./GuiModHowTo.js").then(module => {
            this.minecraft.displayScreen(new module.default(this));
        });
    }

    updateScreen() {
        super.updateScreen();
        if (!this.searchField) return;
        const query = this.searchField.getText();
        if (query !== this.searchQuery) {
            this.searchQuery = query;
            this.scrollY = 0;
            const visible = this.getFilteredMods();
            if (!visible.some(mod => mod.name === this.selectedModName)) this.selectedModName = visible[0]?.name || null;
        }
    }

    handleMouseScroll(delta) {
        if (!this.layout) return;
        const rowH = 74;
        const visibleH = Math.max(1, this.layout.listBottom - this.layout.listTop);
        const totalH = this.getFilteredMods().length * rowH;
        this.scrollY = MathHelper.clamp(this.scrollY + delta * 30, 0, Math.max(0, totalH - visibleH));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        if (!this.layout) this.layout = this.getLayout();
        const L = this.layout;

        // Darken the world/menu background so the frame reads as a dedicated
        // full-screen launcher surface, as in the supplied visual reference.
        this.drawRect(stack, 0, 0, this.width, this.height, "#050607", 0.58);
        this.drawFrame(stack);
        this.drawSidebar(stack, mouseX, mouseY);

        if (this.isLoading) {
            this.drawCenteredString(stack, "Opening local mod library...", L.contentX + L.contentW / 2, (L.listTop + L.listBottom) / 2, 0xD9D9D9);
        } else if (this.loadError) {
            this.drawCenteredString(stack, this.loadError, L.contentX + L.contentW / 2, (L.listTop + L.listBottom) / 2, 0xFF7777);
        } else {
            this.drawModCards(stack, mouseX, mouseY);
        }

        const hint = this.statusMessage || (this.hasPendingChanges ? "Changes are ready. Click Apply & Reload to activate them." : "Local ZIP packages load when the game starts.");
        this.drawStringNoShadow(stack, hint, L.contentX, L.contentBottom + 17, 0xB7B7B7);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    drawFrame(stack) {
        const L = this.layout;
        const x = L.frameX, y = L.frameY, w = L.frameW, h = L.frameH;
        // Heavy stone-like outer frame and inset panel.
        this.drawRect(stack, x - 4, y - 4, x + w + 4, y + h + 4, "#08090A");
        this.drawRect(stack, x - 2, y - 2, x + w + 2, y + h + 2, "#5A5D5D");
        this.drawRect(stack, x, y, x + w, y + h, "#1B1D1E");
        this.drawRect(stack, x + 5, y + 5, x + w - 5, y + h - 5, "#101112");
        this.drawRect(stack, x + 8, y + 8, x + w - 8, y + L.headerH, "#26282A");
        this.drawRect(stack, x + 8, y + L.headerH, x + w - 8, y + L.headerH + 2, "#050607");
        this.drawRect(stack, x + 8, y + h - L.footerH, x + w - 8, y + h - 8, "#282A2B");
        this.drawRect(stack, x + 8, y + h - L.footerH, x + w - 8, y + h - L.footerH + 2, "#050607");

        // Block seams in the header/footer retain a Minecraft-like material feel.
        for (let px = x + 10, i = 0; px < x + w - 10; px += 28, i++) {
            const shade = i % 3 === 0 ? "#303234" : i % 3 === 1 ? "#242628" : "#2B2D2F";
            this.drawRect(stack, px, y + 9, Math.min(px + 27, x + w - 10), y + L.headerH - 3, shade, 0.72);
            this.drawRect(stack, px, y + h - L.footerH + 3, Math.min(px + 27, x + w - 10), y + h - 9, shade, 0.72);
        }

        // Reinforced corner caps.
        for (const [cx, cy] of [[x, y], [x + w - 22, y], [x, y + h - 22], [x + w - 22, y + h - 22]]) {
            this.drawRect(stack, cx, cy, cx + 22, cy + 22, "#383B3D");
            this.drawRect(stack, cx + 3, cy + 3, cx + 19, cy + 19, "#212426");
        }

        // Title at 2x scale, centered in the top metal bar.
        stack.save();
        stack.translate(x + w / 2, y + Math.floor(L.headerH * 0.37));
        stack.scale(2, 2);
        this.drawCenteredStringNoShadow(stack, "MODS", 0, 0, 0xFFC74F);
        stack.restore();
        this.drawCenteredStringNoShadow(stack, "*  *", x + w / 2 - 83, y + Math.floor(L.headerH * 0.45), 0xC88F35);
        this.drawCenteredStringNoShadow(stack, "*  *", x + w / 2 + 83, y + Math.floor(L.headerH * 0.45), 0xC88F35);

        // Sidebar and content split.
        this.drawRect(stack, x + 8, y + L.headerH + 2, x + L.sidebarW, y + h - L.footerH, "#151617");
        this.drawRect(stack, x + L.sidebarW, y + L.headerH + 2, x + L.sidebarW + 2, y + h - L.footerH, "#050607");
        this.drawRect(stack, x + L.sidebarW + 2, y + L.headerH + 2, x + L.sidebarW + 3, y + h - L.footerH, "#45484A");
    }

    drawSidebar(stack, mouseX, mouseY) {
        const L = this.layout;
        const x = L.frameX + 16;
        const w = L.sidebarW - 24;
        const top = L.contentTop + 16;
        const entries = [
            {id: "installed", label: "INSTALLED", badge: String(this.savedMods.length)},
            {id: "upload", label: "IMPORT .ZIP", badge: "+"},
            {id: "guide", label: "MOD GUIDE", badge: "?"}
        ];

        entries.forEach((entry, index) => {
            const y = top + index * 48;
            const active = entry.id === "installed";
            const hovered = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + 40;
            this.drawRect(stack, x, y, x + w, y + 40, active ? "#4A361B" : (hovered ? "#282A2A" : "#1C1E1F"));
            this.drawRect(stack, x, y, x + w, y + 1, active ? "#C48F37" : "#45494B");
            this.drawRect(stack, x + 8, y + 11, x + 25, y + 28, active ? "#D8A43D" : "#8E9294");
            this.drawCenteredStringNoShadow(stack, entry.id === "upload" ? "+" : (entry.id === "guide" ? "i" : "M"), x + 16.5, y + 15, 0x171717);
            this.drawStringNoShadow(stack, entry.label, x + 35, y + 15, active ? 0xFFD166 : 0xD2D2D2);
            this.drawRect(stack, x + w - 28, y + 9, x + w - 8, y + 30, active ? "#6B521E" : "#313536");
            this.drawCenteredStringNoShadow(stack, entry.badge, x + w - 18, y + 15, active ? 0xFFE283 : 0xBFC3C4);
        });

        const noteY = L.contentBottom - 92;
        this.drawRect(stack, x, noteY, x + w, L.contentBottom - 14, "#101112");
        this.drawRect(stack, x, noteY, x + w, noteY + 1, "#343738");
        this.drawStringNoShadow(stack, "i", x + 10, noteY + 14, 0xB8BB7A);
        this.drawStringNoShadow(stack, "Add ZIP mod packages here.", x + 24, noteY + 12, 0xC2C2C2);
        this.drawStringNoShadow(stack, "Use Apply to reload changes.", x + 24, noteY + 25, 0xC2C2C2);
    }

    drawPackageIcon(stack, x, y, selected) {
        this.drawRect(stack, x, y, x + 48, y + 48, selected ? "#9D7032" : "#5B5F63");
        this.drawRect(stack, x + 3, y + 3, x + 45, y + 45, "#1A1C1E");
        this.drawRect(stack, x + 7, y + 13, x + 41, y + 39, selected ? "#C28A35" : "#87929B");
        this.drawRect(stack, x + 7, y + 9, x + 41, y + 15, selected ? "#E3B950" : "#BAC4C9");
        this.drawRect(stack, x + 22, y + 16, x + 27, y + 27, "#3B2A16");
        this.drawRect(stack, x + 23, y + 17, x + 26, y + 21, "#F4D47D");
    }

    drawDragHandle(stack, x, y) {
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 2; col++) {
                this.drawRect(stack, x + col * 5, y + row * 5, x + col * 5 + 2, y + row * 5 + 2, "#7B7F80");
            }
        }
    }

    drawModCards(stack, mouseX, mouseY) {
        const L = this.layout;
        const mods = this.getFilteredMods();
        const rowH = 74;
        const visibleH = Math.max(1, L.listBottom - L.listTop);

        stack.save();
        stack.beginPath();
        stack.rect(L.contentX, L.listTop, L.contentW, visibleH);
        stack.clip();

        for (let index = 0; index < mods.length; index++) {
            const mod = mods[index];
            const y = L.listTop + index * rowH - this.scrollY;
            if (y + rowH < L.listTop || y > L.listBottom) continue;
            const selected = mod.name === this.selectedModName;
            const hovered = mouseX >= L.contentX && mouseX <= L.contentX + L.contentW && mouseY >= y && mouseY <= y + rowH - 4;
            const edge = selected ? "#C48F37" : (hovered ? "#777A7B" : "#4A4D4E");
            const fill = selected ? "#2B2924" : "#242627";

            this.drawRect(stack, L.contentX, y, L.contentX + L.contentW, y + rowH - 4, "#08090A");
            this.drawRect(stack, L.contentX + 1, y + 1, L.contentX + L.contentW - 1, y + rowH - 5, edge);
            this.drawRect(stack, L.contentX + 3, y + 3, L.contentX + L.contentW - 3, y + rowH - 7, fill);
            if (selected) this.drawRect(stack, L.contentX + 3, y + 3, L.contentX + 6, y + rowH - 7, "#E0AB45");

            this.drawDragHandle(stack, L.contentX + 13, y + 29);
            this.drawPackageIcon(stack, L.contentX + 31, y + 10, selected);
            const textX = L.contentX + 88;
            const rightReserve = 135;
            const title = this.truncate(stack, mod.name, Math.max(30, L.contentW - (textX - L.contentX) - rightReserve));
            this.drawStringNoShadow(stack, title, textX, y + 15, 0xF2F2F2);
            this.drawStringNoShadow(stack, `Local ZIP package  •  ${this.formatSize(mod.size)}`, textX, y + 30, 0xC3C3C3);
            this.drawStringNoShadow(stack, `Added ${this.formatDate(mod.date)}`, textX, y + 43, 0x9A9A9A);

            const stateX = L.contentX + L.contentW - 92;
            this.drawStringNoShadow(stack, "READY", stateX, y + 17, 0xA8D75A);
            this.drawRect(stack, stateX, y + 32, stateX + 36, y + 48, "#334617");
            this.drawRect(stack, stateX + 2, y + 34, stateX + 34, y + 46, "#81AA38");
            this.drawRect(stack, stateX + 21, y + 34, stateX + 33, y + 46, "#D9EAB2");
            this.drawCenteredStringNoShadow(stack, ">", L.contentX + L.contentW - 20, y + 29, 0xD6D6D6);
        }
        stack.restore();

        if (!mods.length) {
            const message = this.savedMods.length ? "No installed mods match your search." : "No mods installed yet.";
            this.drawCenteredStringNoShadow(stack, message, L.contentX + L.contentW / 2, L.listTop + 30, 0xD2D2D2);
            this.drawCenteredStringNoShadow(stack, "Use IMPORT .ZIP in the sidebar to add one.", L.contentX + L.contentW / 2, L.listTop + 46, 0x969696);
        }

        const totalH = mods.length * rowH;
        if (totalH > visibleH) {
            const thumbH = Math.max(20, visibleH * visibleH / totalH);
            const range = visibleH - thumbH;
            const scrollRange = totalH - visibleH;
            const thumbY = L.listTop + (scrollRange > 0 ? (this.scrollY / scrollRange) * range : 0);
            this.drawRect(stack, L.contentX + L.contentW - 4, L.listTop, L.contentX + L.contentW - 1, L.listBottom, "#151718");
            this.drawRect(stack, L.contentX + L.contentW - 4, thumbY, L.contentX + L.contentW - 1, thumbY + thumbH, "#9B7A3B");
        }
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        if (!this.isLoading && this.layout) {
            const L = this.layout;
            const sidebarX = L.frameX + 16;
            const sidebarW = L.sidebarW - 24;
            const navTop = L.contentTop + 16;
            if (mouseX >= sidebarX && mouseX <= sidebarX + sidebarW && mouseY >= navTop && mouseY <= navTop + 136) {
                const index = Math.floor((mouseY - navTop) / 48);
                if (index === 1) this.openModZipPicker();
                if (index === 2) this.openGuide();
                if (index >= 0 && index <= 2) this.minecraft.soundManager.playSound("random.click", NaN, NaN, NaN, 0.45, 1.0);
            }

            const inCards = mouseX >= L.contentX && mouseX <= L.contentX + L.contentW && mouseY >= L.listTop && mouseY <= L.listBottom;
            if (inCards) {
                const index = Math.floor((mouseY - L.listTop + this.scrollY) / 74);
                const mods = this.getFilteredMods();
                if (index >= 0 && index < mods.length) {
                    this.selectedModName = mods[index].name;
                    this.minecraft.soundManager.playSound("random.click", NaN, NaN, NaN, 0.45, 1.0);
                }
            }
        }
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }
}
