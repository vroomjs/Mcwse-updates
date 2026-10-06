import GuiScreen from "../GuiScreen.js";
import GuiExpButton from "./GuiExpButton.js";
import GuiToggleSwitch from "../widgets/GuiToggleSwitch.js";
import ExpTheme from "./ExpTheme.js";

/**
 * Experimental "Create New World".
 *
 * NOTE ON THE DESIGN: there is no reference screenshot for world creation
 * (the attached images cover the loading, AFK, worlds, main menu, paused and
 * settings screens only). This is therefore built from the shared
 * Experimental language rather than copied from a reference: a titled
 * full-screen layout, one scrolling pane of rows, and the right-hand action
 * panel that GuiExpWorlds already established. If a reference turns up, this
 * and GuiExpAddServer are the two screens to re-check against it.
 *
 * It replaces both GuiCreateWorld and the little GuiCreateWorldChoice
 * dialog: "Import Previous World" is just another row here, which saves a
 * screen on the way to making a world.
 *
 * World construction itself is deliberately NOT reimplemented. Create hands
 * the collected state to the classic GuiCreateWorld.createWorld(), so seed
 * hashing, generator selection and game-rule wiring stay in exactly one
 * place and this screen cannot drift away from the classic one.
 */
export default class GuiExpCreateWorld extends GuiScreen {

    static WORLD_TYPES = ["Default", "Flat", "Small (350x350)", "Large (1000x1000)",
                          "Amplified", "V2 (Classic Alpha)", "Debug"];
    static GAME_TYPES = [
        { id: "normal",   label: "Normal" },
        { id: "skyblock", label: "Skyblock" },
        { id: "oneblock", label: "One Block" }
    ];
    static DIFFICULTIES = ["Peaceful", "Easy", "Normal", "Hard"];

    constructor(parent, preset = null) {
        super();
        this.isExperimental = true;
        this.parent = parent || null;
        this.previousScreen = this.parent;

        this.name = "New World";
        this.seed = "";
        this.gameType = "normal";
        this.worldType = 0;
        this.gameMode = 0;
        this.bonusChest = false;
        this.startingMap = false;
        this.keepInventory = false;
        this.cheatsEnabled = false;
        this.showDayCounter = false;
        // GuiMoreWorldSettings writes these two straight onto its parent.
        this.generateStructures = true;
        this.spawnBiome = "all";
        this.superflatLayers = [
            { id: 7, count: 1 },
            { id: 3, count: 2 },
            { id: 2, count: 1 }
        ];

        if (preset) {
            if (preset.name) this.name = "Copy of " + preset.name;
            if (preset.seed) this.seed = String(preset.seed);
            if (preset.worldType !== undefined) this.worldType = preset.worldType;
            if (preset.gameMode !== undefined) this.gameMode = preset.gameMode;
            if (preset.bonusChest !== undefined) this.bonusChest = !!preset.bonusChest;
        }

        this.focus = "name";
        this.scrollY = 0;
        this.error = "";
        this._settingsPulled = false;
    }

    // --------------------------------------------------------------- model

    /**
     * The row list. Difficulty is a global setting rather than per-world, so
     * it reads and writes minecraft.settings like the classic screen does.
     */
    rows() {
        const mc = this.minecraft;
        const T = GuiExpCreateWorld;
        const out = [
            { type: "header", label: "World" },
            { type: "text", key: "name", label: "World Name", max: 32, hint: "New World" },
            { type: "text", key: "seed", label: "Seed", max: 30, hint: "(leave blank for random)" },
            {
                type: "value", label: "World Type",
                get: () => T.WORLD_TYPES[this.worldType],
                next: () => { this.worldType = (this.worldType + 1) % T.WORLD_TYPES.length; }
            }
        ];

        // Only meaningful for Flat, so it appears only for Flat rather than
        // sitting there greyed out.
        if (this.worldType === 1) {
            out.push({
                type: "action", label: "Customize Flat...",
                run: () => import("../screens/GuiSuperflatLayers.js").then(m =>
                    mc.displayScreen(new m.default(this, this.superflatLayers)))
            });
        }

        out.push(
            { type: "header", label: "Gameplay" },
            {
                type: "value", label: "Game Type",
                get: () => (T.GAME_TYPES.find(g => g.id === this.gameType) || T.GAME_TYPES[0]).label,
                next: () => {
                    const i = T.GAME_TYPES.findIndex(g => g.id === this.gameType);
                    this.gameType = T.GAME_TYPES[(i + 1) % T.GAME_TYPES.length].id;
                    // One Block is unplayable if a death scatters the island.
                    if (this.gameType === "oneblock") this.keepInventory = true;
                }
            },
            {
                type: "value", label: "Game Mode",
                get: () => (this.gameMode === 1 ? "Creative" : "Survival"),
                next: () => { this.gameMode = (this.gameMode + 1) % 2; }
            },
            {
                type: "value", label: "Difficulty",
                get: () => T.DIFFICULTIES[(mc && mc.settings && mc.settings.difficulty) || 0],
                next: () => {
                    if (mc && mc.settings) {
                        mc.settings.difficulty = (((mc.settings.difficulty || 0) + 1) % 4);
                        mc.settings.save?.();
                    }
                }
            },

            { type: "header", label: "Options" },
            { type: "toggle", label: "Starter Chest",
              get: () => this.bonusChest,    set: v => { this.bonusChest = v; } },
            { type: "toggle", label: "Starting Map",
              get: () => this.startingMap,   set: v => { this.startingMap = v; } },
            { type: "toggle", label: "Keep Inventory",
              get: () => this.keepInventory, set: v => { this.keepInventory = v; } },
            { type: "toggle", label: "Activate Cheats",
              get: () => this.cheatsEnabled, set: v => { this.cheatsEnabled = v; } },
            { type: "toggle", label: "Show Day Counter",
              get: () => this.showDayCounter, set: v => { this.showDayCounter = v; } },
            {
                type: "action", label: "More World Settings...",
                run: () => import("../screens/GuiMoreWorldSettings.js").then(m =>
                    mc.displayScreen(new m.default(this)))
            },

            { type: "header", label: "Existing Save" },
            { type: "action", label: "Import Previous World...", run: () => this.importWorld() }
        );
        return out;
    }

    // -------------------------------------------------------------- layout

    layout() {
        const W = this.width, H = this.height;
        const pad = 6;
        const rightW = Math.round(Math.max(76, Math.min(W * 0.21, 120)));
        const headerH = 16;
        const rowH = H < 260 ? 16 : 18;
        const btnH = H < 260 ? 16 : 18;
        const paneX = pad;
        // -10 rather than -4: the extra gutter is where the scrollbar
        // lives, so it cannot sit on top of the Create button.
        const paneW = W - rightW - pad * 2 - 10;
        const paneTop = pad + headerH + 4;
        return {
            pad, rightW, headerH, rowH, btnH, paneX, paneW, paneTop,
            paneH: H - paneTop - pad,
            rightX: W - rightW - pad,
            chipW: Math.round(Math.max(46, Math.min(paneW * 0.36, 104)))
        };
    }

    rowHeight(row, L) {
        if (row.type === "header") return 12;
        // Text rows carry their caption above the field, as the Add Server
        // modal does, because a 46-104px value chip cannot hold 32 characters.
        if (row.type === "text") return L.rowH + 10;
        return L.rowH;
    }

    /** Rows that fit entirely in the pane; the pane is never clipped. */
    visible(L) {
        const rows = this.rows();
        const out = [];
        let y = L.paneTop;
        for (let i = this.scrollY; i < rows.length; i++) {
            const h = this.rowHeight(rows[i], L);
            if (y + h > L.paneTop + L.paneH) break;
            out.push({ row: rows[i], y, h, index: i });
            y += h + 3;
        }
        return out;
    }

    maxScroll(L) {
        const rows = this.rows();
        let h = 0, i = rows.length - 1;
        for (; i >= 0; i--) {
            const rh = this.rowHeight(rows[i], L) + 3;
            if (h + rh > L.paneH + 3) break;
            h += rh;
        }
        return Math.max(0, i + 1);
    }

    fieldRect(entry, L) {
        return { x: L.paneX, y: entry.y + 10, w: L.paneW, h: L.rowH };
    }

    // ---------------------------------------------------------------- init

    init() {
        super.init();
        const mc = this.minecraft;
        const L = this.layout();

        // Mirror the classic screen: cheats and the day counter default to
        // whatever the player last used.
        if (!this._settingsPulled && mc && mc.settings) {
            this.cheatsEnabled = !!mc.settings.cheatsEnabled;
            this.showDayCounter = !!mc.settings.showDayCounter;
            this._settingsPulled = true;
        }

        this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScroll(L)));

        for (const entry of this.visible(L)) {
            const { row, y } = entry;
            if (row.type === "value") {
                this.buttonList.push(new GuiExpButton(row.get(), L.paneX + L.paneW - L.chipW, y,
                    L.chipW, L.rowH, () => { row.next(); this.init(); }, { variant: "chip" }));
            } else if (row.type === "toggle") {
                const swW = GuiToggleSwitch.SWITCH_W;
                this.buttonList.push(new GuiToggleSwitch(null,
                    L.paneX + L.paneW - swW,
                    y + Math.floor((L.rowH - GuiToggleSwitch.SWITCH_H) / 2), swW,
                    () => row.get(), v => row.set(v)));
            } else if (row.type === "action") {
                this.buttonList.push(new GuiExpButton(row.label, L.paneX, y, L.paneW, L.rowH,
                    () => row.run(), { align: "left" }));
            }
            // "header" paints only; "text" is handled by keyboard focus.
        }

        // Right-hand action panel, matching GuiExpWorlds.
        const rx = L.rightX;
        this.buttonList.push(new GuiExpButton("Create", rx, L.pad - 2, L.rightW, L.btnH,
            () => this.create(), { selected: true, bold: true }));
        this.buttonList.push(new GuiExpButton("Back", rx, L.pad - 2 + L.btnH + 3, L.rightW, L.btnH,
            () => this.goBack()));
    }

    goBack() {
        this.minecraft.displayScreen(this.parent || null);
    }

    // --------------------------------------------------------- interaction

    handleMouseScroll(delta) {
        const L = this.layout();
        const before = this.scrollY;
        this.scrollY = Math.max(0, Math.min(this.scrollY + (delta > 0 ? -1 : 1), this.maxScroll(L)));
        if (this.scrollY !== before) this.init();
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        const L = this.layout();
        for (const entry of this.visible(L)) {
            if (entry.row.type !== "text") continue;
            const r = this.fieldRect(entry, L);
            if (mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h) {
                this.focus = entry.row.key;
            }
        }
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }

    /** Text rows currently on screen, in order, for Tab cycling. */
    textRows() { return this.rows().filter(r => r.type === "text"); }

    keyTyped(key, character) {
        if (key === "Escape") { this.goBack(); return true; }
        if (key === "Enter") { this.create(); return true; }

        const fields = this.textRows();
        if (key === "Tab") {
            const i = fields.findIndex(f => f.key === this.focus);
            this.focus = fields[(i + 1) % fields.length].key;
            return true;
        }

        const field = fields.find(f => f.key === this.focus);
        if (field) {
            this.error = "";
            if (key === "Backspace") {
                this[field.key] = String(this[field.key]).slice(0, -1);
                return true;
            }
            if (character && character.length === 1 && character >= " ") {
                if (String(this[field.key]).length < field.max) this[field.key] += character;
                return true;
            }
        }
        return super.keyTyped(key, character);
    }

    // -------------------------------------------------------------- create

    /**
     * Collect state, then let the classic screen build the world so the two
     * paths cannot diverge.
     */
    create() {
        const mc = this.minecraft;
        const name = this.name.trim() || "New World";

        Promise.all([
            import("../screens/GuiCreateWorld.js"),
            import("../screens/GuiLoadingScreen.js")
        ]).then(([createMod, loadingMod]) => {
            const loading = new loadingMod.default();
            loading.setTitle("Loading world. This may take a moment,");
            mc.displayScreen(loading);

            const builder = new createMod.default(this.parent || null);
            builder.minecraft = mc;
            builder.cachedName = name;
            builder.cachedSeed = this.seed.trim();
            builder.gameType = this.gameType;
            builder.worldType = this.worldType;
            builder.gameMode = this.gameMode;
            builder.bonusChest = this.bonusChest;
            builder.startingMap = this.startingMap;
            builder.keepInventory = this.keepInventory;
            builder.cheatsEnabled = this.cheatsEnabled;
            builder.showDayCounter = this.showDayCounter;
            builder.generateStructures = this.generateStructures;
            builder.spawnBiome = this.spawnBiome;
            builder.superflatLayers = this.superflatLayers;

            // Let the loading screen paint before generation locks the thread.
            setTimeout(() => builder.createWorld(), 50);
        }).catch(err => {
            console.error("Could not start world creation:", err);
            this.error = "Could not start world creation.";
        });
    }

    importWorld() {
        const mc = this.minecraft;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = e => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                Promise.all([
                    import("../../world/World.js"),
                    import("../../world/storage/WorldStorage.js")
                ]).then(([worldMod, storageMod]) => {
                    const data = JSON.parse(event.target.result);
                    const worldId = data.id || "w_imp_" + Date.now();
                    const world = new worldMod.default(mc, data.s || "0", worldId);
                    world.name = data.n || "Imported World";
                    world.savedData = data;
                    return storageMod.default.saveWorld(worldId, data)
                        .then(() => mc.loadWorld(world));
                }).catch(err => {
                    console.error("Failed to import world:", err);
                    mc.systemDialogs?.show("That file is not a valid world save.", { duration: 5000 });
                });
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // ---------------------------------------------------------------- paint

    trim(stack, text, budget) {
        if (budget <= 0) return "";
        if (this.getStringWidth(stack, text) <= budget) return text;
        let out = text;
        while (out.length > 1 && this.getStringWidth(stack, out + "...") > budget) {
            out = out.slice(0, -1);
        }
        return out + "...";
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        const L = this.layout();
        const T = ExpTheme.T;

        this.drawDefaultBackground(stack);
        ExpTheme.dim(this, stack, this.width, this.height, 0.72);
        ExpTheme.bigText(this, stack, "Create New World", L.pad, L.pad - 1, 1.5, T.white);

        for (const entry of this.visible(L)) {
            const { row, y } = entry;

            if (row.type === "header") {
                this.drawString(stack, row.label.toUpperCase(), L.paneX, y + 2, T.version);
                this.drawRect(stack, L.paneX, y + 11, L.paneX + L.paneW, y + 12, "#000000", 0.35);
                continue;
            }

            if (row.type === "text") {
                const r = this.fieldRect(entry, L);
                this.drawString(stack, row.label, r.x, y, T.version);
                const focused = this.focus === row.key;
                ExpTheme.chip(this, stack, r.x, r.y, r.w, r.h, { hover: focused });

                const val = String(this[row.key]);
                this.drawString(stack, this.trim(stack, val || row.hint, r.w - 10),
                    r.x + 5, ExpTheme.textY(r.y, r.h), val ? T.white : 0x9A9A9A);

                if (focused && Math.floor(Date.now() / 500) % 2 === 0) {
                    const cx = r.x + 5 + this.getStringWidth(stack, val);
                    this.drawRect(stack, cx, r.y + 4, cx + 1, r.y + r.h - 4, "#FFFFFF");
                }
                continue;
            }

            if (row.type === "value") {
                const plateW = L.paneW - L.chipW - 4;
                ExpTheme.plate(this, stack, L.paneX, y, plateW, L.rowH);
                this.drawString(stack, this.trim(stack, row.label, plateW - 10),
                    L.paneX + 6, ExpTheme.textY(y, L.rowH), T.white);
            } else if (row.type === "toggle") {
                this.drawString(stack,
                    this.trim(stack, row.label, L.paneW - GuiToggleSwitch.SWITCH_W - 10),
                    L.paneX + 2, ExpTheme.textY(y, L.rowH), T.white);
            }
            // "action" rows are painted by their own GuiExpButton.
        }

        if (this.error) {
            this.drawString(stack, this.error, L.paneX, this.height - L.pad - 9, T.red);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);

        ExpTheme.scrollbar(this, stack, L.paneX + L.paneW + 2, L.paneTop, L.paneH,
            this.scrollY, this.rows().length, this.visible(L).length);
    }

    onClose() {}
}
