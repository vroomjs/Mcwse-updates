import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiTextField from "../widgets/GuiTextField.js";
import MathHelper from "../../../util/MathHelper.js";

class MusicConfigButton extends GuiButton {
    render(stack, mouseX, mouseY) {
        if (!this.minecraft) return;
        const hovered = this.enabled && this.isMouseOver(mouseX, mouseY);
        this.drawRect(stack, this.x, this.y, this.x + this.width, this.y + this.height, "#070707");
        this.drawRect(stack, this.x + 1, this.y + 1, this.x + this.width - 1, this.y + this.height - 1, hovered ? "#D9D9D9" : "#9B9B9B");
        this.drawRect(stack, this.x + 2, this.y + 2, this.x + this.width - 2, this.y + this.height - 2, hovered ? "#A9A9A9" : "#757575");
        this.drawRect(stack, this.x + 3, this.y + 3, this.x + this.width - 3, this.y + this.height - 3, this.enabled ? "#595959" : "#333333");
        this.drawRect(stack, this.x + 3, this.y + 3, this.x + this.width - 3, this.y + 4, "#E2E2E2", hovered ? 0.58 : 0.32);
        this.drawCenteredStringNoShadow(stack, this.string, this.x + this.width / 2, this.y + this.height / 2 - 4, this.enabled ? 0xFFFFFF : 0x777777);
    }
}

class MusicSearchField extends GuiTextField {
    render(stack) {
        const focused = this.isFocused;
        const cursorVisible = focused && Math.floor(this.cursorCounter / 6) % 2 === 0;
        this.drawRect(stack, this.x - 1, this.y - 1, this.x + this.width + 1, this.y + this.height + 1, focused ? "#FFFFFF" : "#9A9A9A");
        this.drawRect(stack, this.x, this.y, this.x + this.width, this.y + this.height, "#020202");
        const display = this.text || "Search music track...";
        this.drawStringNoShadow(stack, display, this.x + 6, this.y + this.height / 2 - 4, this.text ? 0xFFFFFF : 0xBDBDBD);
        if (cursorVisible) {
            this.drawStringNoShadow(stack, "_", this.x + 6 + this.getStringWidth(stack, this.text), this.y + this.height / 2 - 4, 0xFFFFFF);
        }
    }
}

export default class GuiMusicSettings extends GuiScreen {

    static TRACK_FREQUENCIES = [
        {value: 0, label: "Off (0)"},
        {value: 1, label: "Rarely (1)"},
        {value: 2, label: "Rarely (2)"},
        {value: 5, label: "Sometimes (5)"},
        {value: 8, label: "Often (8)"}
    ];

    static GLOBAL_FREQUENCIES = [
        {label: "Frequent", delay: 0.5},
        {label: "Default", delay: 1.0},
        {label: "Relaxed", delay: 3.0},
        {label: "Rare", delay: 6.0}
    ];

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.scrollOffset = 0;
        this.tracks = [];
        this.searchQuery = "";
        this.searchField = null;
        this.rowAreas = [];
        this.actionAreas = [];
        this.albumArtCache = new Map();
        this.categoryOpen = {custom: true, default: true};
        this.statusMessage = "";
    }

    init() {
        super.init();
        this.refreshTracks();
        const L = this.getLayout();

        this.searchField = new MusicSearchField(L.searchX, L.searchY, L.searchW, 24);
        this.searchField.text = this.searchQuery;
        this.searchField.maxLength = 64;
        this.buttonList.push(this.searchField);

        this.buttonList.push(new MusicConfigButton("Now Playing Text: " + (this.minecraft.settings.showMusicToast === false ? "OFF" : "ON"), L.bottomX1, L.bottomY1, L.bottomW, 24, () => {
            this.minecraft.settings.showMusicToast = this.minecraft.settings.showMusicToast === false;
            this.minecraft.settings.save();
            this.init();
        }));

        this.buttonList.push(new MusicConfigButton("Music Frequency: " + this.getGlobalFrequencyLabel(), L.bottomX2, L.bottomY1, L.bottomW, 24, () => {
            this.cycleGlobalFrequency();
        }));

        this.buttonList.push(new MusicConfigButton("Reset to Default", L.bottomX1, L.bottomY2, L.bottomW, 24, () => {
            this.resetMusicDefaults();
        }));

        this.buttonList.push(new MusicConfigButton("Done", L.bottomX2, L.bottomY2, L.bottomW, 24, () => {
            this.minecraft.settings.save();
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    refreshTracks() {
        const soundManager = this.minecraft.soundManager;
        if (soundManager?.loadCustomMusicTracks && !soundManager.customMusicLoaded && !soundManager.customMusicLoading) {
            soundManager.loadCustomMusicTracks().then(() => {
                if (this.minecraft.currentScreen === this) this.init();
            }).catch(error => {
                console.warn("Failed to refresh custom music:", error);
                this.statusMessage = "Custom music storage was not available in this browser.";
            });
        }

        this.tracks = soundManager?.getAllMusicTracks ? soundManager.getAllMusicTracks() : [];
        const settings = this.minecraft.settings;
        if (!settings.musicTrackFrequency || typeof settings.musicTrackFrequency !== "object") settings.musicTrackFrequency = {};
        for (const track of this.tracks) {
            if (settings.enabledMusic[track.name] === undefined) settings.enabledMusic[track.name] = true;
            if (settings.musicTrackFrequency[track.name] === undefined) settings.musicTrackFrequency[track.name] = settings.enabledMusic[track.name] === false ? 0 : 5;
        }
        this.scrollOffset = MathHelper.clamp(this.scrollOffset, 0, this.getMaxScroll());
    }

    getLayout() {
        const panelW = Math.min(this.width - 24, Math.max(360, Math.floor(this.width * 0.90)));
        const bottomW = Math.min(245, Math.max(140, Math.floor((panelW - 28) / 2)));
        const bottomGap = 14;
        const panelX = Math.floor((this.width - panelW) / 2);
        const searchW = Math.min(350, Math.max(210, Math.floor(this.width * 0.44)));
        const searchX = Math.floor((this.width - searchW) / 2);
        const searchY = 34;
        const bottomY1 = this.height - 74;
        const bottomY2 = this.height - 36;
        const bottomX1 = Math.floor(this.width / 2 - bottomW - bottomGap / 2);
        const bottomX2 = Math.floor(this.width / 2 + bottomGap / 2);
        const panelY = Math.max(72, searchY + 46);
        const panelH = Math.max(95, bottomY1 - panelY - 14);
        const scrollW = 10;
        const freqW = Math.min(245, Math.max(126, Math.floor(panelW * 0.35)));
        return {
            panelX, panelY, panelW, panelH, searchX, searchY, searchW,
            bottomW, bottomX1, bottomX2, bottomY1, bottomY2,
            listX: panelX + 8,
            listY: panelY + 4,
            listW: panelW - 22,
            listH: panelH - 8,
            scrollX: panelX + panelW - scrollW - 3,
            scrollW,
            freqW
        };
    }

    getGlobalFrequencyLabel() {
        const delay = this.minecraft.settings.musicDelay;
        let best = GuiMusicSettings.GLOBAL_FREQUENCIES[0];
        let bestDiff = Infinity;
        for (const preset of GuiMusicSettings.GLOBAL_FREQUENCIES) {
            const diff = Math.abs(delay - preset.delay);
            if (diff < bestDiff) {
                best = preset;
                bestDiff = diff;
            }
        }
        return best.label;
    }

    cycleGlobalFrequency() {
        const current = this.getGlobalFrequencyLabel();
        const list = GuiMusicSettings.GLOBAL_FREQUENCIES;
        const index = list.findIndex(p => p.label === current);
        const next = list[(index + 1) % list.length];
        this.minecraft.settings.musicDelay = next.delay;
        this.minecraft.settings.save();
        this.init();
    }

    resetMusicDefaults() {
        const settings = this.minecraft.settings;
        const defaultSettings = new settings.constructor();
        settings.musicDelay = defaultSettings.musicDelay;
        settings.showMusicToast = true;
        settings.enabledMusic = Object.assign({}, defaultSettings.enabledMusic);
        settings.musicTrackFrequency = {};
        for (const track of this.tracks) {
            settings.enabledMusic[track.name] = true;
            settings.musicTrackFrequency[track.name] = 5;
        }
        settings.save();
        this.statusMessage = "Music settings reset to default.";
        this.init();
    }

    getTrackFrequency(track) {
        const settings = this.minecraft.settings;
        if (!settings.musicTrackFrequency || typeof settings.musicTrackFrequency !== "object") settings.musicTrackFrequency = {};
        const value = settings.musicTrackFrequency[track.name];
        if (value === undefined) return settings.enabledMusic[track.name] === false ? 0 : 5;
        return Number(value) || 0;
    }

    getTrackFrequencyLabel(track) {
        const value = this.getTrackFrequency(track);
        const preset = GuiMusicSettings.TRACK_FREQUENCIES.find(p => p.value === value)
            || GuiMusicSettings.TRACK_FREQUENCIES.reduce((best, p) => Math.abs(p.value - value) < Math.abs(best.value - value) ? p : best, GuiMusicSettings.TRACK_FREQUENCIES[0]);
        return "Frequency: " + preset.label;
    }

    cycleTrackFrequency(track) {
        const settings = this.minecraft.settings;
        if (!settings.musicTrackFrequency || typeof settings.musicTrackFrequency !== "object") settings.musicTrackFrequency = {};
        const current = this.getTrackFrequency(track);
        const list = GuiMusicSettings.TRACK_FREQUENCIES;
        const index = Math.max(0, list.findIndex(p => p.value === current));
        const next = list[(index + 1) % list.length];
        settings.musicTrackFrequency[track.name] = next.value;
        settings.enabledMusic[track.name] = next.value > 0;
        settings.save();
        this.statusMessage = `${track.name}: ${next.label}`;
        this.init();
    }

    getCategories() {
        const query = this.searchQuery.trim().toLowerCase();
        const matches = track => !query || track.name.toLowerCase().includes(query);
        const custom = this.tracks.filter(track => track.custom && matches(track));
        const defaults = this.tracks.filter(track => !track.custom && matches(track));
        return [
            {id: "custom", label: "uploaded: your songs (minecraft:music.custom_uploaded)", tracks: custom},
            {id: "default", label: "minecraft: music.game (minecraft:music.game)", tracks: defaults}
        ];
    }

    getDisplayRows() {
        const rows = [];
        for (const category of this.getCategories()) {
            if (category.tracks.length === 0 && (this.searchQuery || category.id !== "custom")) continue;
            rows.push({type: "category", category});
            if (this.categoryOpen[category.id]) {
                if (category.id === "custom") rows.push({type: "upload", category});
                for (const track of category.tracks) rows.push({type: "track", category, track});
                if (category.id === "custom" && category.tracks.length === 0) rows.push({type: "empty", text: "No uploaded songs yet - click Upload Music"});
            }
        }
        return rows;
    }

    getMaxScroll() {
        const L = this.getLayout();
        const rows = this.getDisplayRows();
        const height = rows.reduce((sum, row) => sum + (row.type === "track" ? 34 : 28), 0) + 8;
        return Math.max(0, height - L.listH);
    }

    updateScreen() {
        super.updateScreen();
        if (!this.searchField) return;
        const query = this.searchField.getText();
        if (query !== this.searchQuery) {
            this.searchQuery = query;
            this.scrollOffset = 0;
        }
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        const L = this.getLayout();
        this.drawRect(stack, 0, 0, this.width, this.height, "#000000", 0.40);
        this.drawCenteredString(stack, "Music Configuration", this.width / 2, 12, 0xFFFFFF);
        this.drawMusicList(stack, mouseX, mouseY, L);
        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    drawMusicList(stack, mouseX, mouseY, L) {
        this.rowAreas = [];
        this.actionAreas = [];

        this.drawRect(stack, L.panelX - 1, L.panelY - 1, L.panelX + L.panelW + 1, L.panelY + L.panelH + 1, "#BFC0C4", 0.90);
        this.drawRect(stack, L.panelX, L.panelY, L.panelX + L.panelW, L.panelY + L.panelH, "#050506", 0.76);
        this.drawRect(stack, L.panelX, L.panelY, L.panelX + L.panelW, L.panelY + 2, "#DCDDE2", 0.75);
        this.drawRect(stack, L.panelX, L.panelY + L.panelH - 2, L.panelX + L.panelW, L.panelY + L.panelH, "#DCDDE2", 0.55);

        stack.save();
        stack.beginPath();
        stack.rect(L.listX, L.listY, L.listW, L.listH);
        stack.clip();

        const rows = this.getDisplayRows();
        let y = L.listY + 5 - this.scrollOffset;
        for (const row of rows) {
            if (row.type === "track") {
                this.drawTrackRow(stack, row, L, y, mouseX, mouseY);
                y += 34;
            } else if (row.type === "category") {
                this.drawCategoryRow(stack, row, L, y, mouseX, mouseY);
                y += 28;
            } else if (row.type === "upload") {
                this.drawUploadRow(stack, row, L, y, mouseX, mouseY);
                y += 28;
            } else if (row.type === "empty") {
                this.drawString(stack, row.text, L.listX + 72, y + 8, 0xB8B8B8);
                y += 28;
            }
        }

        if (rows.length === 0) {
            this.drawCenteredString(stack, "No music tracks match your search", L.panelX + L.panelW / 2, L.panelY + L.panelH / 2 - 4, 0xFFFFFF);
        }
        stack.restore();

        this.drawScrollbar(stack, L, rows);
    }

    drawCategoryRow(stack, row, L, y, mouseX, mouseY) {
        const label = row.category.label;
        const open = this.categoryOpen[row.category.id];
        const x = L.listX + 14;
        const visible = y + 28 >= L.listY && y <= L.listY + L.listH;
        if (!visible) return;
        this.drawString(stack, open ? "v" : ">", x, y + 8, 0xEAEAEA);
        this.drawString(stack, "F", x + 20, y + 8, 0xDADADA);
        this.drawString(stack, this.truncate(stack, label, L.listW - 80), x + 42, y + 8, 0x9F9F9F);
        this.rowAreas.push({type: "category", category: row.category, x: L.listX, y, w: L.listW, h: 28});
    }

    drawUploadRow(stack, row, L, y, mouseX, mouseY) {
        const visible = y + 28 >= L.listY && y <= L.listY + L.listH;
        if (!visible) return;
        const x = L.listX + 54;
        const w = Math.min(180, L.listW - 80);
        const hover = mouseX >= x && mouseX <= x + w && mouseY >= y + 3 && mouseY <= y + 25;
        this.drawStoneButton(stack, x, y + 3, w, 22, hover, "Upload Music / Lyrics");
        this.actionAreas.push({type: "upload", x, y: y + 3, w, h: 22});
    }

    drawTrackRow(stack, row, L, y, mouseX, mouseY) {
        const track = row.track;
        const visible = y + 34 >= L.listY && y <= L.listY + L.listH;
        if (!visible) return;

        const artX = L.listX + 52;
        const artSize = 28;
        const textX = artX + artSize + 9;
        const freqX = L.panelX + L.panelW - L.freqW - 50;
        const freqW = L.freqW;
        const rowHover = mouseX >= L.listX + 50 && mouseX <= L.panelX + L.panelW - 18 && mouseY >= y && mouseY <= y + 32;
        const playing = this.minecraft.soundManager?.currentTrackName === track.name && this.minecraft.soundManager?.isBackgroundMusicPlaying?.();
        if (rowHover || playing) this.drawRect(stack, L.listX + 48, y, L.panelX + L.panelW - 18, y + 32, playing ? "#1B2B34" : "#1D1D20", 0.55);

        this.drawAlbumArt(stack, track, artX, y + 2, artSize);
        this.drawString(stack, this.truncate(stack, track.name, Math.max(60, freqX - textX - 12)), textX, y + 7, this.getTrackFrequency(track) > 0 ? 0xFFFFFF : 0x777777);
        const albumLine = track.album || (track.custom ? (track.lyrics?.length ? "Uploaded - LRC" : "Uploaded - no lyrics") : "Album art loaded");
        this.drawString(stack, this.truncate(stack, albumLine, Math.max(60, freqX - textX - 12)), textX, y + 19, track.custom && track.lyrics?.length ? 0xA8FFA8 : 0xA0A0A0);

        const freqHover = mouseX >= freqX && mouseX <= freqX + freqW && mouseY >= y + 2 && mouseY <= y + 28;
        this.drawStoneButton(stack, freqX, y + 2, freqW, 26, freqHover, this.getTrackFrequencyLabel(track));
        this.actionAreas.push({type: "freq", track, x: freqX, y: y + 2, w: freqW, h: 26});

        if (track.custom) {
            const bx = freqX - 94;
            this.drawMiniButton(stack, bx, y + 6, 27, 18, mouseX, mouseY, "LRC");
            this.drawMiniButton(stack, bx + 31, y + 6, 32, 18, mouseX, mouseY, "DISC");
            this.drawMiniButton(stack, bx + 67, y + 6, 18, 18, mouseX, mouseY, "x");
            this.actionAreas.push({type: "lrc", track, x: bx, y: y + 6, w: 27, h: 18});
            this.actionAreas.push({type: "disc", track, x: bx + 31, y: y + 6, w: 32, h: 18});
            this.actionAreas.push({type: "delete", track, x: bx + 67, y: y + 6, w: 18, h: 18});
        }

        this.rowAreas.push({type: "track", track, x: L.listX + 48, y, w: L.panelX + L.panelW - L.listX - 70, h: 32});
    }

    getAlbumArtImage(track) {
        if (!track?.albumArt || typeof Image === "undefined") return null;
        if (this.albumArtCache.has(track.albumArt)) return this.albumArtCache.get(track.albumArt);
        const img = new Image();
        img.src = track.albumArt;
        this.albumArtCache.set(track.albumArt, img);
        return img;
    }

    drawAlbumArt(stack, track, x, y, size) {
        this.drawRect(stack, x - 1, y - 1, x + size + 1, y + size + 1, "#050505", 1);
        const img = this.getAlbumArtImage(track);
        if (img && img.complete && img.naturalWidth > 0) {
            stack.save();
            stack.imageSmoothingEnabled = true;
            stack.drawImage(img, Math.floor(x), Math.floor(y), size, size);
            stack.restore();
        } else {
            this.drawRect(stack, x, y, x + size, y + size, track?.custom ? "#3B3B45" : "#5B5B65", 1);
            this.drawCenteredString(stack, track?.custom ? "U" : "A", x + size / 2, y + size / 2 - 4, 0xFFFFFF);
        }
    }

    drawStoneButton(stack, x, y, w, h, hovered, label) {
        this.drawRect(stack, x, y, x + w, y + h, "#050505");
        this.drawRect(stack, x + 1, y + 1, x + w - 1, y + h - 1, hovered ? "#D0D0D0" : "#8E8E8E");
        this.drawRect(stack, x + 2, y + 2, x + w - 2, y + h - 2, hovered ? "#9B9B9B" : "#6A6A6A");
        this.drawRect(stack, x + 3, y + 3, x + w - 3, y + h - 3, "#4E4E4E");
        this.drawCenteredString(stack, this.truncate(stack, label, w - 8), x + w / 2, y + h / 2 - 4, 0xFFFFFF);
    }

    drawMiniButton(stack, x, y, w, h, mouseX, mouseY, label) {
        const hover = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
        this.drawRect(stack, x, y, x + w, y + h, "#050505");
        this.drawRect(stack, x + 1, y + 1, x + w - 1, y + h - 1, hover ? "#BFBFBF" : "#777777");
        this.drawRect(stack, x + 2, y + 2, x + w - 2, y + h - 2, "#3F3F3F");
        this.drawCenteredString(stack, label, x + w / 2, y + h / 2 - 4, 0xFFFFFF);
    }

    drawScrollbar(stack, L, rows) {
        const contentHeight = rows.reduce((sum, row) => sum + (row.type === "track" ? 34 : 28), 0) + 8;
        const maxScroll = Math.max(0, contentHeight - L.listH);
        const x = L.scrollX;
        this.drawRect(stack, x, L.listY + 2, x + L.scrollW, L.listY + L.listH - 2, "#050505", 0.95);
        if (maxScroll <= 0) return;
        const thumbH = Math.max(28, L.listH * (L.listH / (L.listH + maxScroll)));
        const thumbY = L.listY + (L.listH - thumbH) * (this.scrollOffset / maxScroll);
        this.drawRect(stack, x + 1, thumbY, x + L.scrollW - 1, thumbY + thumbH, "#CFCFCF", 1);
        this.drawRect(stack, x + 2, thumbY + 1, x + L.scrollW - 2, thumbY + thumbH - 1, "#8E8E8E", 1);
    }

    shortenText(text, maxWidth) {
        return this.truncate(null, text, maxWidth);
    }

    truncate(stack, text, maxWidth) {
        text = String(text || "");
        if (this.getStringWidth(stack, text) <= maxWidth) return text;
        let shortened = text;
        while (shortened.length > 3 && this.getStringWidth(stack, shortened + "...") > maxWidth) shortened = shortened.slice(0, -1);
        return shortened + "...";
    }

    handleMouseScroll(delta) {
        this.scrollOffset = MathHelper.clamp(this.scrollOffset + delta * 24, 0, this.getMaxScroll());
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        if (mouseButton === 0) {
            for (const action of this.actionAreas) {
                if (mouseX >= action.x && mouseX <= action.x + action.w && mouseY >= action.y && mouseY <= action.y + action.h) {
                    if (action.type === "freq") this.cycleTrackFrequency(action.track);
                    if (action.type === "upload") this.handleUploadClick();
                    if (action.type === "lrc") this.editCustomTrackLyrics(action.track);
                    if (action.type === "disc") this.giveCustomDisc(action.track);
                    if (action.type === "delete") this.removeCustomTrack(action.track);
                    return;
                }
            }

            for (const row of this.rowAreas) {
                if (mouseX >= row.x && mouseX <= row.x + row.w && mouseY >= row.y && mouseY <= row.y + row.h) {
                    if (row.type === "category") {
                        this.categoryOpen[row.category.id] = !this.categoryOpen[row.category.id];
                        this.scrollOffset = MathHelper.clamp(this.scrollOffset, 0, this.getMaxScroll());
                        return;
                    }
                    if (row.type === "track") {
                        this.minecraft.soundManager?.transitionToBackgroundMusic?.(row.track, 0.45);
                        return;
                    }
                }
            }
        }
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }

    giveCustomDisc(track) {
        if (!track?.custom) return;
        const result = this.minecraft.commandHandler?.handleMessage?.(`/give @p custom_disc ${track.name}`, true);
        this.statusMessage = result || `Gave custom disc for ${track.name}.`;
        this.init();
    }

    async removeCustomTrack(track) {
        if (!track?.custom) return;
        if (typeof window !== "undefined" && !window.confirm(`Remove uploaded song "${track.name}" from this browser?`)) return;

        try {
            this.statusMessage = `Removing ${track.name}...`;
            if (this.minecraft.soundManager?.currentTrackName === track.name) {
                this.minecraft.soundManager.stopCurrentBackgroundMusic?.();
            }
            delete this.minecraft.settings.enabledMusic[track.name];
            delete this.minecraft.settings.musicTrackFrequency?.[track.name];
            this.minecraft.settings.save();
            await this.minecraft.soundManager.deleteCustomTrack(track.id);
            this.statusMessage = `Removed ${track.name}.`;
            this.init();
        } catch (error) {
            console.warn("Failed to remove custom track:", error);
            this.statusMessage = "Could not remove the uploaded track.";
        }
    }

    async editCustomTrackLyrics(track) {
        if (!track?.custom || !this.minecraft.soundManager?.updateCustomTrackLyrics) return;

        try {
            if (track.lyrics?.length && typeof window !== "undefined") {
                const replace = window.confirm(`Replace lyrics for "${track.name}"?\n\nOK = replace with .lrc or pasted lyrics\nCancel = clear lyrics instead`);
                if (!replace) {
                    if (!window.confirm(`Clear lyrics for "${track.name}"?`)) return;
                    this.statusMessage = `Clearing lyrics for ${track.name}...`;
                    await this.minecraft.soundManager.updateCustomTrackLyrics(track.id, "");
                    this.statusMessage = `Cleared lyrics for ${track.name}.`;
                    this.init();
                    return;
                }
            }

            const lrcText = await this.chooseLyricsText(track.url, track.name, false);
            if (lrcText === null) return;
            this.statusMessage = `Updating lyrics for ${track.name}...`;
            const updated = await this.minecraft.soundManager.updateCustomTrackLyrics(track.id, lrcText || "");
            this.statusMessage = updated?.lyrics?.length
                ? `Updated ${updated.lyrics.length} lyric lines for ${updated.name}.`
                : `No timed lyric lines saved for ${track.name}.`;
            this.init();
        } catch (error) {
            console.warn("Failed to update custom lyrics:", error);
            this.statusMessage = "Could not update lyrics for that uploaded song.";
        }
    }

    async handleUploadClick() {
        try {
            const audioFile = await this.pickFile("audio/*,.mp3,.ogg,.wav,.m4a,.aac,.flac");
            if (!audioFile) return;

            const defaultName = (audioFile.name || "Custom Track").replace(/\.[a-z0-9]{2,5}$/i, "");
            const enteredName = typeof window !== "undefined"
                ? window.prompt("Track name for the music library:", defaultName)
                : defaultName;
            if (enteredName === null) return;

            let lrcText = "";
            if (typeof window !== "undefined" && window.confirm(
                "Add lyrics for this song?\n\n" +
                "OK = choose a fast lyric method (.lrc upload or pasted lyrics)\n" +
                "Cancel = import without lyrics"
            )) {
                const chosenLyrics = await this.chooseLyricsText(audioFile, enteredName || defaultName, true);
                if (chosenLyrics === null) return;
                lrcText = chosenLyrics;
            }

            this.statusMessage = `Importing ${enteredName || defaultName}...`;
            const track = await this.minecraft.soundManager.importCustomMusic(audioFile, {
                name: enteredName || defaultName,
                lrcText,
                generateLyrics: false,
                onStatus: message => {
                    this.statusMessage = message;
                }
            });

            this.minecraft.settings.enabledMusic[track.name] = true;
            if (!this.minecraft.settings.musicTrackFrequency) this.minecraft.settings.musicTrackFrequency = {};
            this.minecraft.settings.musicTrackFrequency[track.name] = 5;
            this.minecraft.settings.save();
            this.statusMessage = `${track.name} added to your library${track.lyrics?.length ? " with synced lyrics" : ""}.`;
            this.categoryOpen.custom = true;
            this.init();
        } catch (error) {
            console.warn("Failed to upload custom music:", error);
            this.statusMessage = "Upload failed. Try a different audio file or add lyrics later with LRC.";
        }
    }

    promptMultiline(title, helpText = "") {
        return new Promise(resolve => {
            if (typeof document === "undefined") {
                resolve(null);
                return;
            }

            const overlay = document.createElement("div");
            overlay.style.cssText = [
                "position:fixed",
                "inset:0",
                "z-index:100001",
                "display:flex",
                "align-items:center",
                "justify-content:center",
                "background:rgba(0,0,0,.72)",
                "font-family:monospace",
                "color:#f5f5f5"
            ].join(";");

            const panel = document.createElement("div");
            panel.style.cssText = [
                "width:min(620px,calc(100vw - 32px))",
                "box-sizing:border-box",
                "background:#181b1d",
                "border:2px solid #5a5a5a",
                "box-shadow:6px 6px 0 rgba(0,0,0,.45)",
                "padding:14px"
            ].join(";");

            const heading = document.createElement("div");
            heading.textContent = title;
            heading.style.cssText = "font-weight:800;font-size:16px;margin-bottom:8px";
            panel.appendChild(heading);

            const help = document.createElement("div");
            help.textContent = helpText;
            help.style.cssText = "font-size:12px;color:#b8b8b8;line-height:1.35;margin-bottom:10px";
            panel.appendChild(help);

            const textarea = document.createElement("textarea");
            textarea.placeholder = "Line 1 lyrics\nLine 2 lyrics\nLine 3 lyrics";
            textarea.style.cssText = [
                "width:100%",
                "height:220px",
                "resize:vertical",
                "box-sizing:border-box",
                "background:#0f1112",
                "color:#fff",
                "border:1px solid #555",
                "outline:none",
                "padding:9px",
                "font:13px monospace"
            ].join(";");
            panel.appendChild(textarea);

            const buttons = document.createElement("div");
            buttons.style.cssText = "display:flex;gap:8px;justify-content:flex-end;margin-top:10px";

            const cancel = document.createElement("button");
            cancel.textContent = "Cancel";
            const save = document.createElement("button");
            save.textContent = "Auto-time lyrics";
            for (const button of [cancel, save]) {
                button.style.cssText = "background:#2c3032;color:#fff;border:1px solid #686868;padding:7px 10px;font:12px monospace;cursor:pointer";
            }
            save.style.background = "#1db954";
            save.style.color = "#071006";
            buttons.appendChild(cancel);
            buttons.appendChild(save);
            panel.appendChild(buttons);
            overlay.appendChild(panel);
            document.body.appendChild(overlay);
            textarea.focus();

            const cleanup = value => {
                overlay.remove();
                resolve(value);
            };
            cancel.onclick = () => cleanup(null);
            save.onclick = () => cleanup(textarea.value);
            overlay.addEventListener("keydown", event => {
                if (event.key === "Escape") cleanup(null);
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") cleanup(textarea.value);
            });
        });
    }

    async chooseLyricsText(audioSource, trackName, allowSkip = true) {
        if (typeof window === "undefined") return "";

        const useSyncedFile = window.confirm(
            `Lyrics for "${trackName}"\n\n` +
            "OK = upload a synced .lrc file (best/accurate)\n" +
            "Cancel = paste plain lyrics and auto-time them instantly"
        );

        if (useSyncedFile) {
            const lrcFile = await this.pickFile(".lrc,text/plain");
            if (!lrcFile) return allowSkip ? "" : null;
            return await lrcFile.text();
        }

        const plainText = await this.promptMultiline(
            "Paste plain lyrics",
            "One lyric line per line. The game will spread them across the song duration instantly. This is fast and editable, but not as accurate as a real .lrc file."
        );
        if (plainText === null) return allowSkip ? "" : null;
        if (!plainText.trim()) return "";
        return await this.createAutoTimedLrc(plainText, audioSource);
    }

    async createAutoTimedLrc(plainText, audioSource) {
        if (/^\s*\[\d{1,3}:\d{2}(?:\.\d{1,3})?\]/m.test(plainText)) return plainText;

        const baseLines = plainText
            .split(/\r?\n/)
            .map(line => line.replace(/^[-•*]\s*/, "").trim())
            .filter(Boolean);
        const lines = [];
        for (const line of baseLines) {
            const words = line.split(/\s+/).filter(Boolean);
            if (words.length <= 12) lines.push(line);
            else for (let i = 0; i < words.length; i += 10) lines.push(words.slice(i, i + 10).join(" "));
        }
        if (lines.length === 0) return "";

        let duration = 0;
        try { duration = await this.getAudioDuration(audioSource); } catch (error) { console.warn("Could not read song duration for auto-timed lyrics:", error); }
        if (!Number.isFinite(duration) || duration <= 0) duration = Math.max(20, lines.length * 3.5);

        const introText = typeof window !== "undefined" ? window.prompt("Seconds before the first lyric line?", "0") : "0";
        if (introText === null) return "";
        const introSeconds = Math.max(0, Number(introText) || 0);
        const outroSeconds = Math.min(4, Math.max(0, duration * 0.04));
        const usableDuration = Math.max(lines.length * 1.2, duration - introSeconds - outroSeconds);
        const step = lines.length > 1 ? usableDuration / (lines.length - 1) : 0;

        return lines.map((line, index) => {
            const time = Math.min(Math.max(0, duration - 0.5), introSeconds + index * step);
            return `[${this.formatLrcTime(time)}]${line}`;
        }).join("\n");
    }

    getAudioDuration(audioSource) {
        return new Promise((resolve, reject) => {
            if (typeof document === "undefined") {
                reject(new Error("Browser audio metadata is not available."));
                return;
            }
            const audio = document.createElement("audio");
            let objectUrl = null;
            const cleanup = () => {
                audio.removeAttribute("src");
                audio.load();
                if (objectUrl) URL.revokeObjectURL(objectUrl);
            };
            audio.preload = "metadata";
            audio.onloadedmetadata = () => {
                const duration = audio.duration;
                cleanup();
                resolve(duration);
            };
            audio.onerror = () => {
                cleanup();
                reject(audio.error || new Error("Could not read audio metadata."));
            };
            if (audioSource instanceof Blob) {
                objectUrl = URL.createObjectURL(audioSource);
                audio.src = objectUrl;
            } else {
                audio.src = String(audioSource || "");
            }
        });
    }

    formatLrcTime(seconds) {
        const safe = Math.max(0, Number(seconds) || 0);
        const minutes = Math.floor(safe / 60);
        const wholeSeconds = Math.floor(safe % 60);
        const hundredths = Math.floor((safe - Math.floor(safe)) * 100);
        return `${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
    }

    pickFile(accept) {
        return new Promise(resolve => {
            if (typeof document === "undefined") {
                resolve(null);
                return;
            }
            const input = document.createElement("input");
            input.type = "file";
            input.accept = accept;
            input.style.display = "none";
            let settled = false;
            const cleanup = () => {
                window.removeEventListener("focus", onFocus);
                input.remove();
            };
            const finish = file => {
                if (settled) return;
                settled = true;
                cleanup();
                resolve(file || null);
            };
            const onFocus = () => setTimeout(() => {
                if (!settled && (!input.files || input.files.length === 0)) finish(null);
            }, 350);
            input.addEventListener("change", () => finish(input.files && input.files[0]));
            window.addEventListener("focus", onFocus);
            document.body.appendChild(input);
            input.click();
        });
    }
}
