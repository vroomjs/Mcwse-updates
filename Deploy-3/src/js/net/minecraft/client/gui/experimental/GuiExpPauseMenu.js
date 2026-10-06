import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiToggleSwitch from "../widgets/GuiToggleSwitch.js";
import GuiExpButton from "./GuiExpButton.js";
import ExpTheme from "./ExpTheme.js";
import ExpRouter from "./ExpRouter.js";
import WorldStorage from "../../world/storage/WorldStorage.js";

/**
 * Experimental pause menu: the world name and the two primary actions on the
 * left, a secondary column on the right headed by the sleep-mode switch.
 *
 * Everything the classic pause menu could do is still reachable. The DEV and
 * 2P buttons and the unseen-join-request badge are kept even though the
 * reference has no equivalent, because dropping them would be a regression.
 */
export default class GuiExpPauseMenu extends GuiScreen {

    static SLIDE_MS = 220;

    constructor() {
        super();
        this.isExperimental = true;
        this.openedAt = 0;
        this.backupState = "";
    }

    /**
     * Eased 0..1 progress of the open animation. Wall-clock, never ticks, so
     * the slide runs at the same speed regardless of frame rate.
     */
    slideProgress() {
        if (!this.openedAt) return 1;
        const t = (performance.now() - this.openedAt) / GuiExpPauseMenu.SLIDE_MS;
        if (t >= 1) return 1;
        if (t <= 0) return 0;
        return 1 - Math.pow(1 - t, 3);          // ease-out cubic
    }

    /**
     * Horizontal offset for a widget, in pixels, at the current progress.
     * Left-hand widgets come in from off the left edge, right-hand ones from
     * off the right, so each group enters from its own side.
     */
    slideOffset(fromRight) {
        const p = this.slideProgress();
        if (p >= 1) return 0;
        const travel = (fromRight ? this.width : -this.width) * 0.35;
        return Math.round(travel * (1 - p));
    }

    layout() {
        const W = this.width, H = this.height;
        const colW = Math.round(Math.max(96, Math.min(W * 0.26, 150)));
        const colX = W - colW - 8;
        const rowH = H < 260 ? 16 : 18;
        const gap = H < 250 ? 2 : 3;
        const sleepH = 14;
        const rows = 7;          // matches the entries[] list below (Quests removed)
        const block = rows * rowH + (rows - 1) * gap;
        let colTop = Math.round((H - block) / 2) + 6;
        colTop = Math.max(10 + sleepH + 6, Math.min(colTop, H - block - 6));

        const leftW = Math.round(Math.max(96, Math.min(W * 0.26, 150)));
        const leftX = Math.max(8, Math.round(W * 0.03));
        const leftBtnH = H < 260 ? 18 : 20;
        return { colW, colX, rowH, gap, colTop, block, leftW, leftX, leftBtnH, sleepH };
    }

    /** Greedy wrap of the world name into the left column. */
    titleLines(stack, maxW) {
        const name = (this.minecraft.world && this.minecraft.world.name) || "Game Menu";
        const words = String(name).split(/\s+/);
        const lines = [];
        let cur = "";
        for (const w of words) {
            const test = cur ? cur + " " + w : w;
            if (cur && this.getStringWidth(stack, test) > maxW) { lines.push(cur); cur = w; }
            else cur = test;
        }
        if (cur) lines.push(cur);
        return lines.slice(0, 3);
    }

    init() {
        super.init();
        const L = this.layout();
        const mc = this.minecraft;
        const settings = mc.settings;

        const mp = mc.multiplayer;
        const hosting = !!(mp && mp.connected && mp.isHosting);
        const asClient = !!(mp && mp.connected && !mp.isHosting);

        // ---- left column: the two primary actions
        const leftTop = Math.round(this.height * 0.5);
        this.buttonList.push(new GuiExpButton("Back to Game", L.leftX, leftTop, L.leftW, L.leftBtnH,
            () => mc.displayScreen(null), { bold: true }));
        this.buttonList.push(new GuiExpButton(asClient ? "Disconnect" : "Quit to Title",
            L.leftX, leftTop + L.leftBtnH + 4, L.leftW, L.leftBtnH,
            () => this.quit(asClient), { bold: true }));

        // ---- right column
        const entries = [
            ["Create Backup", () => this.createBackup()],
            ["Advancements", () => this.openScreen("GuiAchievements.js")],
            ["Statistics", () => this.openScreen("GuiStats.js")],
            [hosting ? "Manage LAN" : "Open to LAN", () => this.openLan()],
            ["Camera Studio", () => this.openScreen("GuiCameraStudio.js")],
            ["Mods", () => ExpRouter.notAvailable(mc, "Mods")],
            ["Settings", () => import("./GuiExpSettings.js").then(m =>
                mc.displayScreen(new m.default(this)))]
        ];
        entries.forEach(([label, cb], i) => {
            const b = new GuiExpButton(label, L.colX, L.colTop + i * (L.rowH + L.gap),
                L.colW, L.rowH, cb);
            if (label === "Open to LAN" && asClient) b.setEnabled(false);
            if (label === "Open to LAN" || label === "Manage LAN") this.lanButton = b;
            if (label === "Create Backup") this.backupButton = b;
            this.buttonList.push(b);
        });

        // ---- sleep mode switch, heading the right column
        const swW = GuiToggleSwitch.SWITCH_W;
        this.buttonList.push(new GuiToggleSwitch(null, L.colX + L.colW - swW,
            L.colTop - L.sleepH - 5, swW,
            () => !!settings.afkSleepMode,
            (next) => {
                settings.afkSleepMode = next;
                settings.save();
                if (mc.afkTracker) mc.afkTracker.reset();
            }));

        // ---- preserved classic affordances
        this.buttonList.push(new GuiButton("2P", this.width - 25, 5, 20, 20, () => {
            import("../screens/GuiSplitscreen.js").then(m => mc.displayScreen(new m.default(this)));
        }));
        this.buttonList.push(new GuiButton("DEV", 5, 5, 25, 20, () => {
            import("../screens/GuiDevTools.js").then(m => mc.displayScreen(new m.default(this)));
        }));

        // Remember where every widget belongs and which edge it enters from,
        // so drawScreen can offset them without losing their real positions.
        // Resizing re-runs init() but must not replay the animation, so the
        // clock is only started the first time.
        for (const b of this.buttonList) {
            b._homeX = b.x;
            b._fromRight = (b.x + b.width / 2) > this.width / 2;
        }
        if (!this.openedAt) this.openedAt = performance.now();
    }

    /** Apply the current slide offset to every widget. */
    applySlide() {
        const dxL = this.slideOffset(false), dxR = this.slideOffset(true);
        for (const b of this.buttonList) {
            if (b._homeX == null) continue;
            b.x = b._homeX + (b._fromRight ? dxR : dxL);
        }
    }

    /**
     * Opens a classic sub-screen by file name.
     *
     * These used to be bare `import(...).then(...)` chains with no rejection
     * handler, so if the module failed to load or its constructor threw, the
     * click did nothing at all and no error reached the console in a form the
     * player could see. Statistics was hitting exactly that. Now a failure
     * says so.
     */
    openScreen(file) {
        const mc = this.minecraft;
        return import("../screens/" + file)
            .then(m => { mc.displayScreen(new m.default(this)); })
            .catch(err => {
                console.error("Could not open " + file, err);
                mc.systemDialogs?.show("That screen failed to open.", { duration: 4000 });
            });
    }

    /**
     * Writes the current world to a .json the player keeps.
     *
     * Saves first so the backup reflects what is on screen rather than the
     * last autosave, then reads the canonical record back out of IndexedDB
     * so the file is byte-identical to what the game itself would load.
     */
    createBackup() {
        const mc = this.minecraft;
        const world = mc.world;
        if (!world) { mc.systemDialogs?.show("No world is open to back up."); return; }

        const btn = this.backupButton;
        const done = (msg) => {
            if (btn) { btn.setEnabled(true); btn.string = "Create Backup"; }
            if (msg) mc.systemDialogs?.show(msg, { duration: 4000 });
        };

        if (btn) { btn.setEnabled(false); btn.string = "Backing up..."; }

        Promise.resolve(world.saveWorldData())
            .then(() => WorldStorage.loadWorld(world.worldId))
            .then(data => {
                if (!data) throw new Error("world not found in storage");
                const name = (world.name || "world").replace(/[^\w\-. ]+/g, "_").trim() || "world";
                const stamp = new Date().toISOString().slice(0, 10);
                GuiExpPauseMenu.downloadJson(data, `${name}-backup-${stamp}.json`);
                done("Backup downloaded.");
            })
            .catch(err => {
                console.error("Backup failed:", err);
                done("Could not create a backup.");
            });
    }

    /** Blob + object URL download, same approach as GuiSaveError. */
    static downloadJson(data, fileName) {
        const json = typeof data === "string" ? data : JSON.stringify(data);
        const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    openLan() {
        const mc = this.minecraft, mp = mc.multiplayer;
        if (!mp || !mc.world) return;
        if (mp.connected && mp.isHosting) {
            import("../screens/GuiMultiplayerHostSettings.js").then(m =>
                mc.displayScreen(new m.default(this)));
            return;
        }
        const b = this.lanButton;
        if (b) { b.setEnabled(false); b.string = "Opening LAN..."; }
        mp.host(mc.world).then(code => {
            import("../screens/GuiLANOpened.js").then(m => mc.displayScreen(new m.default(this, code)));
        }).catch(error => {
            console.error("Unable to open LAN game:", error);
            if (b) { b.setEnabled(true); b.string = "Open to LAN"; }
            mc.addMessageToChat("§cCould not open this world to LAN.");
        });
    }

    quit(asClient) { GuiExpPauseMenu.quitToTitle(this.minecraft, this, asClient); }

    /**
     * Mirrors the classic quit path exactly, including the save-error screen.
     * Static so the sleep-mode screen can reuse it without subclassing.
     */
    static quitToTitle(mc, screen, asClient) {
        if (asClient) {
            mc.multiplayer.saveClientData();
            mc.multiplayer.disconnect();
            mc.loadWorld(null);
            return;
        }
        if (!mc.world) { mc.loadWorld(null); return; }
        if (mc.multiplayer && mc.multiplayer.connected) mc.multiplayer.disconnect();
        mc.displaySavingScreen("Saving world...");
        mc.world.saveWorldData().then(result => {
            if (result.success) { mc.loadWorld(null); return; }
            if (result.data) {
                import("../screens/GuiSaveError.js").then(m =>
                    mc.displayScreen(new m.default(screen, result.data,
                        (mc.world.name || "world") + ".json")));
            } else {
                console.error("Fatal save error:", result.error);
                mc.displayScreen(screen);
            }
        });
    }

    keyTyped(key, character) {
        if (key === "Escape") { this.minecraft.displayScreen(null); return true; }
        return super.keyTyped(key, character);
    }

    getUnseenBadgeRect() { return { x: 34 + this.slideOffset(false), y: 10, size: 10 }; }

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
        if (names.length === 1) text = `${names[0]} tried to join your world.`;
        else if (names.length === 2) text = `${names[0]} and ${names[1]} tried to join your world.`;
        else text = `${names.length} players tried to join your world.`;
        this.minecraft.systemDialogs?.show(text, { duration: 5000 });
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        const L = this.layout();
        this.applySlide();
        const dxL = this.slideOffset(false), dxR = this.slideOffset(true);
        ExpTheme.dim(this, stack, this.width, this.height, 0.68);

        // World name, left, above the primary actions. Scaled rather than
        // double-struck: at 8px a 1px second pass merges the glyphs.
        const lines = this.titleLines(stack, (L.leftW + 24) / 1.25);
        const top = Math.round(this.height * 0.5) - lines.length * 12 - 6;
        lines.forEach((s, i) => {
            ExpTheme.bigText(this, stack, s, L.leftX + dxL, top + i * 12, 1.25, ExpTheme.T.white);
        });

        this.drawString(stack, "Sleep mode",
            dxR + L.colX + L.colW - GuiToggleSwitch.SWITCH_W - 6 - this.getStringWidth(stack, "Sleep mode"),
            ExpTheme.textY(L.colTop - L.sleepH - 5, GuiToggleSwitch.SWITCH_H), ExpTheme.T.white);

        super.drawScreen(stack, mouseX, mouseY, partialTicks);

        if (this.hasUnseenNotifications()) {
            const r = this.getUnseenBadgeRect();
            this.drawUnseenBadge(stack, r.x, r.y);
        }
    }
}
