import GuiScreen from "../GuiScreen.js";
import GuiToggleSwitch from "../widgets/GuiToggleSwitch.js";
import GuiExpButton from "./GuiExpButton.js";
import GuiExpSlider from "./GuiExpSlider.js";
import GuiExpKeyButton from "./GuiExpKeyButton.js";
import ExpTheme from "./ExpTheme.js";
import ExpRouter from "./ExpRouter.js";

/**
 * Experimental settings: category sidebar on the left, a searchable pane of
 * rows on the right.
 *
 * Every option the classic settings tree exposed now lives here directly,
 * rather than bouncing the player out to a classic sub-screen: the full key
 * bindings list, every volume, the chat colours, the light-engine budgets.
 * The classic screens are still on disk and still work, but nothing in this
 * UI needs them any more.
 *
 * Row shapes:
 *   value  - dark label plate, lighter chip on the right (discrete cycle)
 *   slider - dark label plate with the value right-aligned, track on the right
 *   key    - dark label plate, keybind chip on the right
 *   toggle - plain label text with a switch on the right, no plate
 *   action - a full-width button
 *   header - a muted caption that groups the rows under it
 *
 * Only the interactive parts are widgets. Plates and labels are painted in
 * drawScreen from the same visibleRows() window init() used, so the two can
 * never disagree about what is on screen.
 */
export default class GuiExpSettings extends GuiScreen {

    static CATEGORIES = ["Customize Skin", "Video Settings", "Performance", "Language",
        "Music & Sounds", "Controls", "Chat Settings", "Accessibility Settings",
        "Resource Packs", "Mods"];

    static CHAT_COLORS = [
        { name: "White", val: 0xFFFFFF }, { name: "Red", val: 0xFF5555 },
        { name: "Green", val: 0x55FF55 }, { name: "Blue", val: 0x5555FF },
        { name: "Yellow", val: 0xFFFF55 }, { name: "Aqua", val: 0x55FFFF },
        { name: "Pink", val: 0xFF55FF }, { name: "Gray", val: 0xAAAAAA }
    ];

    static KEY_BINDS = [
        ["Forward", "forward"], ["Left", "left"], ["Back", "back"], ["Right", "right"],
        ["Jump", "jump"], ["Sneak", "crouching"], ["Sprint", "sprinting"],
        ["Inventory", "inventory"], ["Drop", "drop"], ["Chat", "chat"],
        ["Command", "command"], ["Perspective", "togglePerspective"]
    ];

    constructor(parent) {
        super();
        this.isExperimental = true;
        this.parent = parent || null;
        this.previousScreen = this.parent;
        this.category = "Video Settings";
        this.scrollY = 0;
        this.search = "";
        this.searchFocused = false;
    }

    // ------------------------------------------------------------- row model

    cycle(key, values, labels) {
        const s = this.minecraft.settings;
        const i = Math.max(0, values.indexOf(s[key]));
        return {
            label: labels.name,
            type: "value",
            get: () => labels.of(s[key]),
            next: () => {
                s[key] = values[(i + 1) % values.length];
                s.save();
                if (labels.after) labels.after(this.minecraft);
            }
        };
    }

    toggle(name, key) {
        const s = this.minecraft.settings;
        return {
            label: name, type: "toggle",
            get: () => !!s[key],
            set: (v) => { s[key] = v; s.save(); }
        };
    }

    /** Continuous setting backed by a real slider. */
    slider(name, key, min, max, step, format) {
        const s = this.minecraft.settings;
        return {
            label: name, type: "slider", min, max, step,
            get: () => {
                const v = Number(s[key]);
                return Number.isFinite(v) ? v : min;
            },
            set: (v) => { s[key] = v; s.save(); },
            text: format || (v => String(Math.round(v * 100) / 100))
        };
    }

    keybind(name, key) {
        const s = this.minecraft.settings;
        return {
            label: name, type: "key",
            get: () => s[key],
            set: (v) => { s[key] = v; s.save(); }
        };
    }

    action(name, run) { return { label: name, type: "action", run }; }

    header(name) { return { label: name, type: "header" }; }

    rowsFor(category) {
        const mc = this.minecraft, s = mc.settings;
        const open = (file) => () => import("../screens/" + file).then(m =>
            mc.displayScreen(new m.default(this)));
        const pct = v => Math.round(v * 100) + "%";
        const int = v => String(Math.round(v));

        switch (category) {
            case "Video Settings": return [
                this.slider("Render Distance", "viewDistance", 2, 20, 1, v => int(v) + " chunks"),
                this.slider("Field of View", "fov", 30, 110, 1, int),
                this.slider("Brightness", "brightness", 0, 1, 0.05,
                    v => v <= 0 ? "Moody" : v >= 1 ? "Bright" : pct(v)),
                this.slider("Resolution Scale", "resolutionScale", 0.25, 1, 0.05, pct),
                this.slider("Fog Density", "fogDensity", 0, 1, 0.05, pct),
                this.slider("LOD Distance", "lodRenderDistance", 32, 256, 8, int),
                this.cycle("particles", [0, 1, 2],
                    { name: "Particles", of: v => ["Minimal", "Normal", "Extra"][v] || "Normal" }),
                this.cycle("autosaveInterval", [0, 1, 2, 3, 4],
                    { name: "Autosave", of: v => ["1m", "5m", "10m", "30m", "Off"][v] || "5m" }),
                this.toggle("View Bobbing", "viewBobbing"),
                this.toggle("Smooth Lighting", "ambientOcclusion"),
                this.toggle("LOD Rendering", "lodRendering"),
                this.toggle("Optimized Leaves", "optimizedLeaves"),
                this.toggle("Waving Foliage", "wavingFoliage"),
                this.toggle("Realistic Water", "realisticWater"),
                this.toggle("Realistic Clouds", "realisticClouds"),
                this.toggle("Low Quality Textures", "lowQualityTextures"),
                this.toggle("Bilinear Filtering", "bilinearFiltering"),
                this.action("Toggle Fullscreen", () => this.toggleFullscreen())
            ];
            case "Performance": return [
                this.slider("FPS Cap", "fpsCap", 30, 130, 10, v => v >= 130 ? "Unlimited" : int(v)),
                this.slider("Chunk Load Radius", "chunkLoad", 1, 10, 1, int),
                this.slider("Chunk Rebuild Budget", "chunkRebuildBudgetMs", 1, 16, 1, v => int(v) + " ms"),
                this.header("Light engine"),
                this.slider("Light Updates/Frame", "maxLightUpdatesPerFrame", 50, 5000, 50, int),
                this.slider("Light Budget", "lightUpdateBudgetMs", 2, 32, 1, v => int(v) + " ms"),
                this.slider("Max Light Queue", "maxLightQueueSize", 5000, 100000, 1000, int),
                this.header("Rendering"),
                this.slider("Resolution Scale", "resolutionScale", 0.25, 1, 0.05, pct),
                this.toggle("LOD Rendering", "lodRendering"),
                this.toggle("Optimized Leaves", "optimizedLeaves"),
                this.toggle("Low Quality Textures", "lowQualityTextures")
            ];
            case "Music & Sounds": return [
                this.slider("Master Volume", "soundVolume", 0, 1, 0.05, pct),
                this.slider("Music Volume", "musicVolume", 0, 1, 0.05, pct),
                this.slider("SFX Volume", "sfxVolume", 0, 1, 0.05, pct),
                this.slider("Mob Volume", "mobVolume", 0, 1, 0.05, pct),
                this.slider("Music Delay", "musicDelay", 0.5, 10, 0.5, v => v + " min"),
                this.toggle("3D Audio", "threeDAudio"),
                this.action("Music Tracks...", open("GuiMusicSettings.js"))
            ];
            case "Controls": return [
                this.slider("Sensitivity", "sensitivity", 10, 200, 5, v => Math.round(v) + "%"),
                this.cycle("thirdPersonView", [0, 1, 2],
                    { name: "Camera", of: v => ["First Person", "Third Person", "Front"][v] || "First Person" }),
                this.toggle("View Bobbing", "viewBobbing"),
                this.header("Key bindings"),
                ...GuiExpSettings.KEY_BINDS.map(([name, key]) => this.keybind(name, key)),
                this.header("Controller"),
                this.action("Controller Settings...", open("GuiControllerControls.js")),
                this.action("Pair Controller...", open("GuiPairController.js")),
                this.action("Reset All Binds", () => { s.reset(); this.init(); })
            ];
            case "Chat Settings": return [
                this.slider("Background Opacity", "chatOpacity", 0, 1, 0.05, pct),
                this.slider("Text Opacity", "chatTextOpacity", 0.1, 1, 0.05, pct),
                this.slider("Chat Hiding Time", "chatFadeSpeed", 1, 15, 1, v => Math.round(v) + "s"),
                this.slider("Chat Scale", "chatScale", 0.5, 1.5, 0.05, pct),
                this.cycle("chatNameColor", GuiExpSettings.CHAT_COLORS.map((_, i) => i),
                    { name: "Name Color", of: v => (GuiExpSettings.CHAT_COLORS[v] || {}).name || "White" }),
                this.cycle("chatMessageColor", GuiExpSettings.CHAT_COLORS.map((_, i) => i),
                    { name: "Message Color", of: v => (GuiExpSettings.CHAT_COLORS[v] || {}).name || "White" })
            ];
            case "Accessibility Settings": return [
                this.slider("Brightness", "brightness", 0, 1, 0.05,
                    v => v <= 0 ? "Moody" : v >= 1 ? "Bright" : pct(v)),
                this.slider("FPS Cap", "fpsCap", 30, 130, 10, v => v >= 130 ? "Unlimited" : int(v)),
                this.cycle("particles", [0, 1, 2],
                    { name: "Particles", of: v => ["Minimal", "Normal", "Extra"][v] || "Normal" }),
                this.toggle("High Contrast", "highContrast"),
                this.toggle("Show Day Counter", "showDayCounter"),
                this.toggle("Cheats Enabled", "cheatsEnabled"),
                this.action("Toggle Fullscreen", () => this.toggleFullscreen())
            ];
            case "Customize Skin": return [
                this.action("Open Skin Customiser...", () => import("./GuiExpSkins.js").then(m =>
                    mc.displayScreen(new m.default(this))))
            ];
            case "Resource Packs": return [this.action("Open Resource Packs...", open("GuiResourcePacks.js"))];
            case "Language": return [this.action("Language", () => ExpRouter.notAvailable(mc, "Language selection"))];
            case "Mods": return [this.action("Mods", () => ExpRouter.notAvailable(mc, "Mods"))];
            default: return [];
        }
    }

    toggleFullscreen() {
        try {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen();
        } catch (e) { /* denied without a user gesture; nothing to do */ }
    }

    filtered() {
        const rows = this.rowsFor(this.category);
        const q = this.search.trim().toLowerCase();
        if (!q) return rows;
        // Headers only survive a search if something under them matches, so
        // the filtered list never shows an empty group caption.
        const out = [];
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            if (r.type === "header") continue;
            if (r.label.toLowerCase().includes(q)) out.push(r);
        }
        return out;
    }

    // ---------------------------------------------------------------- layout

    layout() {
        const W = this.width, H = this.height;
        const sideW = Math.round(Math.max(88, Math.min(W * 0.26, 136)));
        const pad = 6;
        const paneX = sideW + pad * 2;
        const paneW = W - paneX - pad;
        const searchH = 18;
        const paneTop = pad + searchH + pad;
        const rowH = H < 260 ? 16 : 18;
        const rowGap = 3;
        const doneH = 20;
        const sideTop = pad;
        const sideRowH = Math.max(11, Math.min(18,
            Math.floor((H - pad * 2 - doneH - 6) / GuiExpSettings.CATEGORIES.length) - 2));
        return { sideW, pad, paneX, paneW, searchH, paneTop, rowH, rowGap, doneH, sideTop, sideRowH,
                 paneH: H - paneTop - pad, chipW: Math.round(Math.max(46, Math.min(paneW * 0.33, 92))) };
    }

    visibleRows(L) {
        return Math.max(1, Math.floor((L.paneH + L.rowGap) / (L.rowH + L.rowGap)));
    }

    maxScroll(L) { return Math.max(0, this.filtered().length - this.visibleRows(L)); }

    // ------------------------------------------------------------------ init

    init() {
        super.init();
        const L = this.layout();
        const mc = this.minecraft;
        this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScroll(L)));

        GuiExpSettings.CATEGORIES.forEach((c, i) => {
            const b = new GuiExpButton(c, L.pad, L.sideTop + i * (L.sideRowH + 2),
                L.sideW, L.sideRowH, () => {
                    this.category = c; this.scrollY = 0; this.init();
                }, { selected: c === this.category });
            this.buttonList.push(b);
        });

        this.buttonList.push(new GuiExpButton("Done", L.pad, this.height - L.doneH - L.pad,
            L.sideW, L.doneH, () => {
                mc.displayScreen(this.parent || null);
            }, { bold: true }));

        // Rows, only the visible window of them.
        const rows = this.filtered();
        const n = this.visibleRows(L);
        for (let i = 0; i < n; i++) {
            const row = rows[this.scrollY + i];
            if (!row) break;
            const y = L.paneTop + i * (L.rowH + L.rowGap);
            if (row.type === "value") {
                this.buttonList.push(new GuiExpButton(row.get(), L.paneX + L.paneW - L.chipW, y,
                    L.chipW, L.rowH, () => { row.next(); this.init(); }, { variant: "chip" }));
            } else if (row.type === "slider") {
                this.buttonList.push(new GuiExpSlider(L.paneX + L.paneW - L.chipW, y,
                    L.chipW, L.rowH, row.get(), row.min, row.max, row.step,
                    (v) => row.set(v), row.text));
            } else if (row.type === "key") {
                this.buttonList.push(new GuiExpKeyButton(L.paneX + L.paneW - L.chipW, y,
                    L.chipW, L.rowH, row.get(), (k) => row.set(k)));
            } else if (row.type === "toggle") {
                const swW = GuiToggleSwitch.SWITCH_W;
                this.buttonList.push(new GuiToggleSwitch(null,
                    L.paneX + L.paneW - swW, y + Math.floor((L.rowH - GuiToggleSwitch.SWITCH_H) / 2), swW,
                    () => row.get(), (v) => { row.set(v); }));
            } else if (row.type === "action") {
                this.buttonList.push(new GuiExpButton(row.label, L.paneX, y, L.paneW, L.rowH,
                    () => row.run(), { align: "left" }));
            }
            // headers are paint-only
        }
    }

    // ------------------------------------------------------------ interaction

    handleMouseScroll(delta) {
        const L = this.layout();
        const before = this.scrollY;
        this.scrollY = Math.max(0, Math.min(this.scrollY + (delta > 0 ? -1 : 1), this.maxScroll(L)));
        if (this.scrollY !== before) this.init();
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        const L = this.layout();
        this.searchFocused = mouseX >= L.paneX && mouseX <= L.paneX + L.paneW &&
                             mouseY >= L.pad && mouseY <= L.pad + L.searchH;
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }

    /** True while any keybind chip is armed and swallowing keystrokes. */
    capturing() {
        return this.buttonList.some(b => b instanceof GuiExpKeyButton && b.listening);
    }

    keyTyped(key, character) {
        // A keybind chip waiting for input outranks search and Escape.
        if (this.capturing()) { super.keyTyped(key, character); this.init(); return; }
        if (this.searchFocused) {
            if (key === "Backspace") { this.search = this.search.slice(0, -1); this.scrollY = 0; this.init(); return; }
            if (key === "Escape") { this.searchFocused = false; return; }
            if (character && character.length === 1 && character >= " ") {
                this.search += character; this.scrollY = 0; this.init(); return;
            }
        }
        super.keyTyped(key, character);
    }

    // ----------------------------------------------------------------- paint

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        const L = this.layout();
        const T = ExpTheme.T;
        this.drawDefaultBackground(stack);
        ExpTheme.dim(this, stack, this.width, this.height, 0.35);

        // Search field.
        ExpTheme.plate(this, stack, L.paneX, L.pad, L.paneW - L.searchH - 2, L.searchH,
            { hover: this.searchFocused });
        const shown = this.search || (this.searchFocused ? "" : "Search");
        this.drawString(stack, this.trim(stack, shown, L.paneW - L.searchH - 14),
            L.paneX + 5, ExpTheme.textY(L.pad, L.searchH),
            this.search ? T.white : 0x9A9A9A);
        if (this.searchFocused && Math.floor(Date.now() / 500) % 2 === 0) {
            const cx = L.paneX + 5 + this.getStringWidth(stack, this.search);
            this.drawRect(stack, cx, L.pad + 4, cx + 1, L.pad + L.searchH - 4, "#FFFFFF");
        }
        ExpTheme.plate(this, stack, L.paneX + L.paneW - L.searchH, L.pad, L.searchH, L.searchH);
        ExpTheme.magnifier(this, stack, L.paneX + L.paneW - L.searchH + 4, L.pad + 4);

        // Row plates and labels, from the same window init() used.
        const rows = this.filtered();
        const n = this.visibleRows(L);
        for (let i = 0; i < n; i++) {
            const row = rows[this.scrollY + i];
            if (!row) break;
            const y = L.paneTop + i * (L.rowH + L.rowGap);

            if (row.type === "header") {
                this.drawString(stack, row.label.toUpperCase(), L.paneX + 2,
                    ExpTheme.textY(y, L.rowH), T.version);
                this.drawRect(stack, L.paneX + 2, y + L.rowH - 3,
                    L.paneX + L.paneW, y + L.rowH - 2, "#4A4A4A");
                continue;
            }

            if (row.type === "value" || row.type === "slider" || row.type === "key") {
                const plateW = L.paneW - L.chipW - 4;
                ExpTheme.plate(this, stack, L.paneX, y, plateW, L.rowH);

                // Sliders show their live value right-aligned in the plate.
                let budget = plateW - 10;
                if (row.type === "slider") {
                    const vt = row.text(row.get());
                    const vw = this.getStringWidth(stack, vt);
                    this.drawString(stack, vt, L.paneX + plateW - vw - 5,
                        ExpTheme.textY(y, L.rowH), T.version);
                    budget = plateW - vw - 14;
                }
                this.drawString(stack, this.trim(stack, row.label, budget),
                    L.paneX + 6, ExpTheme.textY(y, L.rowH), T.white);
            } else if (row.type === "toggle") {
                this.drawString(stack, this.trim(stack, row.label, L.paneW - GuiToggleSwitch.SWITCH_W - 10),
                    L.paneX + 2, ExpTheme.textY(y, L.rowH), T.white);
            }
        }

        if (rows.length === 0) {
            this.drawString(stack, "No settings match \"" + this.search + "\"",
                L.paneX + 4, L.paneTop + 4, T.muted);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);

        ExpTheme.scrollbar(this, stack, this.width - 5, L.paneTop, L.paneH,
            this.scrollY, rows.length, this.visibleRows(L));
    }

    /** Clip a string to a pixel budget, with an ellipsis. */
    trim(stack, s, maxW) {
        if (this.getStringWidth(stack, s) <= maxW) return s;
        let out = s;
        while (out.length > 1 && this.getStringWidth(stack, out + "...") > maxW) out = out.slice(0, -1);
        return out + "...";
    }
}
