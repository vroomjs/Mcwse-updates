import GuiScreen from "../GuiScreen.js";
import GuiExpButton from "./GuiExpButton.js";
import ExpTheme from "./ExpTheme.js";
import ExpRouter from "./ExpRouter.js";
import GuiExpCreateWorld from "./GuiExpCreateWorld.js";
import { describeJoinError } from "../../../util/JoinErrors.js";

/**
 * Experimental world management: a tabbed, searchable browser of singleplayer
 * worlds and saved LAN servers, laid out as cards.
 *
 * This replaces both GuiSelectWorld and GuiMultiplayer, because the reference
 * puts local worlds and servers on one screen behind tabs.
 *
 * Cards are positioned into content space first, then only the ones
 * intersecting the viewport become widgets, which is what keeps scrolling
 * cheap and stops off-screen cards from swallowing clicks.
 */
export default class GuiExpWorlds extends GuiScreen {

    static TABS = ["All", "Singleplayer", "Servers"];

    constructor(parent, tab = "All") {
        super();
        this.isExperimental = true;
        this.parent = parent || null;
        this.previousScreen = this.parent;
        this.tab = GuiExpWorlds.TABS.includes(tab) ? tab : "All";
        this.scrollY = 0;
        this.search = "";
        this.searchFocused = false;
        this.worlds = null;          // null = still loading
        this.loadError = false;
    }

    // ------------------------------------------------------------------ data

    loadWorlds() {
        import("../../world/storage/WorldStorage.js").then(m => {
            m.default.migrateFromLocalStorage().then(() =>
                m.default.getWorldList().then(list => {
                    this.worlds = list;
                    this.init();
                }).catch(err => {
                    console.error("Failed to load world list:", err);
                    this.worlds = []; this.loadError = true; this.init();
                }));
        }).catch(err => {
            console.error("Failed to load WorldStorage:", err);
            this.worlds = []; this.loadError = true; this.init();
        });
    }

    servers() {
        const rw = this.minecraft.remoteWorlds;
        return rw ? rw.list() : [];
    }

    matches(text) {
        const q = this.search.trim().toLowerCase();
        return !q || String(text || "").toLowerCase().includes(q);
    }

    /** Sections to show for the active tab, after search filtering. */
    sections() {
        const out = [];
        const wantLocal = this.tab === "All" || this.tab === "Singleplayer";
        const wantRemote = this.tab === "All" || this.tab === "Servers";

        if (wantLocal) {
            const items = (this.worlds || []).filter(w => this.matches(w.name))
                .map(w => ({ kind: "world", data: w }));
            // The full Singleplayer tab is an unrestricted grid. The All tab
            // gets compact preview controls, filled in by place() once the
            // available row width is known.
            if (this.tab === "Singleplayer") items.push({ kind: "add-world" });
            out.push({ title: "Singleplayer", items, empty: this.worlds === null ? "Loading worlds..." : "No worlds yet." });
        }
        if (wantRemote) {
            const items = this.servers().filter(e => this.matches(e.worldName) || this.matches(e.hostUsername) || this.matches(e.address))
                .map(e => ({ kind: "server", data: e }));
            items.push({ kind: "add-server" });
            out.push({ title: "Servers", items });
        }
        return out;
    }

    // ---------------------------------------------------------------- layout

    layout() {
        const W = this.width, H = this.height;
        const rightW = Math.round(Math.max(76, Math.min(W * 0.21, 120)));
        const tabH = 16;
        const pad = 5;
        const btnH = 15;
        const searchH = 16;
        const contentX = pad;
        const contentW = W - rightW - pad * 3;
        const searchY = tabH + pad;
        const contentY = searchY + searchH + pad;
        const backH = 16;
        const contentH = H - contentY - pad;
        const cardW = Math.round(Math.max(68, Math.min(contentW * 0.31, 104)));
        const thumbH = Math.round(cardW * 0.5);
        const nameH = 12, metaH = 10;
        const cardH = thumbH + nameH + metaH;
        const cardGap = 5;
        const headerH = 16;      // fits the 1.5x section heading (12px) plus air
        return { rightW, tabH, pad, btnH, searchH, contentX, contentW, searchY, contentY,
                 contentH, cardW, cardH, thumbH, nameH, metaH, cardGap, headerH, backH,
                 perRow: Math.max(1, Math.floor((contentW + cardGap) / (cardW + cardGap))) };
    }

    /** Places every card in content space; returns placements and total height. */
    place(L) {
        const out = [];
        let y = 0;
        for (const sec of this.sections()) {
            // In All, keep the Singleplayer preview to one row. When there
            // are too many worlds, the last slot becomes a right-arrow See
            // more card instead of spilling into a second row.
            if (this.tab === "All" && sec.title === "Singleplayer") {
                const capacity = Math.max(1, L.perRow);
                const worlds = sec.items.filter(item => item.kind === "world");
                const controls = worlds.length + 1 > capacity
                    ? [...worlds.slice(0, Math.max(0, capacity - 2)), { kind: "add-world" }, { kind: "more-worlds" }]
                    : [...worlds, { kind: "add-world" }];
                sec.items = controls;
            }
            out.push({ type: "header", title: sec.title, x: L.contentX, y, w: L.contentW, h: L.headerH });
            y += L.headerH + 2;
            if (sec.items.length === 0) {
                out.push({ type: "empty", text: sec.empty || "Nothing here.", x: L.contentX, y, w: L.contentW, h: 12 });
                y += 14;
                continue;
            }
            sec.items.forEach((item, i) => {
                const col = i % L.perRow, row = Math.floor(i / L.perRow);
                out.push({
                    type: "card", item,
                    x: L.contentX + col * (L.cardW + L.cardGap),
                    y: y + row * (L.cardH + L.cardGap),
                    w: L.cardW, h: L.cardH
                });
            });
            const rows = Math.ceil(sec.items.length / L.perRow);
            y += rows * (L.cardH + L.cardGap) + 4;
        }
        return { items: out, totalH: Math.max(0, y) };
    }

    maxScroll(L, placed) { return Math.max(0, placed.totalH - L.contentH); }

    // ------------------------------------------------------------------ init

    /**
     * Builds the tab buttons, fitted to the width actually available.
     *
     * The strip may never reach into the right-hand action panel. Gaps shrink
     * from 8px down to 1px before any label is touched; if even the tightest
     * strip overflows, labels are clipped with an ellipsis and share the space
     * evenly. That is what stopped "Singleplayer"/"Friends" colliding with the
     * "Create New World" button at small logical widths.
     */
    tabButtons(L) {
        const tabs = GuiExpWorlds.TABS;
        const n = tabs.length;
        // Everything left of the action panel, minus a safety gutter.
        const avail = this.width - L.rightW - L.pad * 2 - 4;
        const natural = tabs.map(t => this.getStringWidth(null, t));

        const total = (widths, padX, gap) =>
            widths.reduce((a, w) => a + w + padX * 2, 0) + gap * (n - 1);

        let widths = natural.slice();
        let padX = 4, gap = 6;

        // Give up the outer gap first, then the inner padding, and only
        // clip the labels themselves as a last resort.
        while (gap > 1 && total(widths, padX, gap) > avail) gap--;
        while (padX > 1 && total(widths, padX, gap) > avail) padX--;
        if (total(widths, padX, gap) > avail) {
            const each = Math.max(6,
                Math.floor((avail - gap * (n - 1) - padX * 2 * n) / n));
            widths = tabs.map(() => each);
        }

        const out = [];
        let tx = L.pad;
        tabs.forEach((t, i) => {
            const bw = widths[i] + padX * 2;
            const b = new GuiExpButton(t, tx, 0, bw, L.tabH, () => {
                this.tab = t; this.scrollY = 0; this.init();
            }, { variant: "tab" });
            b.isTab = true;
            b.active = (t === this.tab);
            b.labelWidth = widths[i];
            out.push(b);
            tx += bw + gap;
        });
        return out;
    }

    /** Leaves to whatever opened this screen, or the main menu. */
    goBack() {
        const mc = this.minecraft;
        const back = this.previousScreen || this.parent || null;
        if (back) { mc.displayScreen(back); return; }
        import("./GuiExpMainMenu.js").then(m => mc.displayScreen(new m.default()));
    }

    openAddServer() {
        const mc = this.minecraft;
        import("./GuiExpAddServer.js").then(m =>
            mc.displayScreen(new m.default(this, () => {
                // Force the server list to re-read on the way back in.
                this._pinged = false;
            })));
    }

    init() {
        super.init();
        const L = this.layout();
        const mc = this.minecraft;

        if (this.worlds === null && !this._loading) { this._loading = true; this.loadWorlds(); }
        if (mc.remoteWorlds && !this._pinged) { this._pinged = true; mc.remoteWorlds.pingAll(); }

        // Tabs. These used to be laid out at their natural width with a fixed
        // 2px gap, which at narrow logical widths ran the strip straight under
        // the "Create New World" / "Add Server" panel on the right. The strip
        // is now fitted to the space it actually has: padding tightens first,
        // and only if that is not enough do the labels themselves shorten.
        for (const b of this.tabButtons(L)) this.buttonList.push(b);

        // Right-hand actions
        const rx = this.width - L.rightW - L.pad;
        this.buttonList.push(new GuiExpButton("Create New World", rx, L.pad - 2, L.rightW, L.btnH,
            // Straight to the Experimental creation screen: it carries the
            // "Import Previous World" action that used to need a chooser.
            () => mc.displayScreen(new GuiExpCreateWorld(this))));
        this.buttonList.push(new GuiExpButton("Add Server", rx, L.pad - 2 + L.btnH + 3, L.rightW, L.btnH,
            () => this.openAddServer()));

        // Bottom-right icon strip
        const iy = this.height - 16 - L.pad;

        // Back lives at the foot of the right-hand action panel, directly
        // under Create New World / Add Server. The card column is clipped to
        // contentW and never reaches this far right, so unlike a bottom-left
        // placement it can never end up sitting on top of a world card.
        this.buttonList.push(new GuiExpButton("Back", rx, iy - L.backH - 4,
            L.rightW, L.backH, () => this.goBack(), { bold: true }));
        [["pencil", () => this.editBridge()],
         ["coin", () => ExpRouter.notAvailable(mc, "Marketplace")],
         ["gear", () => import("./GuiExpSettings.js").then(m => mc.displayScreen(new m.default(this)))]
        ].forEach(([icon, cb], i) => {
            this.buttonList.push(new GuiExpButton("", this.width - L.pad - (3 - i) * 19 + 1, iy, 16, 16, cb, { icon }));
        });

        // Cards, only those intersecting the viewport.
        const placed = this.place(L);
        this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScroll(L, placed)));
        this.placed = placed;

        for (const p of placed.items) {
            if (p.type !== "card") continue;
            const sy = L.contentY + p.y - this.scrollY;
            if (sy + p.h < L.contentY || sy > L.contentY + L.contentH) continue;

            if (p.item.kind === "add-server") {
                this.buttonList.push(new GuiExpButton("", p.x, sy, p.w, p.h,
                    () => this.openAddServer(), { icon: "plus" }));
                continue;
            }
            if (p.item.kind === "add-world") {
                this.buttonList.push(new GuiExpButton("", p.x, sy, p.w, p.h,
                    () => mc.displayScreen(new GuiExpCreateWorld(this)), { icon: "plus" }));
                continue;
            }
            if (p.item.kind === "more-worlds") {
                this.buttonList.push(new GuiExpButton("", p.x, sy, p.w, p.h,
                    () => { this.tab = "Singleplayer"; this.scrollY = 0; this.init(); }, { icon: "arrow-right" }));
                continue;
            }

            // Whole card is the primary action.
            const body = new GuiExpButton("", p.x, sy, p.w, p.h, () => this.activate(p.item), { variant: "card" });
            body.isCard = true;
            body.card = p.item;
            this.buttonList.push(body);

            // Pencil + trash on the name bar.
            const by = sy + L.thumbH;
            this.buttonList.push(new GuiExpButton("", p.x + p.w - 23, by + 1, 10, 10,
                () => this.edit(p.item), { icon: "pencil", variant: "flat" }));
            this.buttonList.push(new GuiExpButton("", p.x + p.w - 12, by + 1, 10, 10,
                () => this.remove(p.item), { icon: "trash", variant: "flat" }));
        }
    }

    // --------------------------------------------------------------- actions

    activate(item) {
        const mc = this.minecraft;
        if (item.kind === "world") {
            import("../../world/storage/WorldStorage.js").then(m =>
                m.default.loadWorld(item.data.id).then(data => {
                    if (!data) { console.error("World data not found"); return; }
                    import("../../world/World.js").then(wm => {
                        const World = wm.default;
                        const world = new World(mc, data.s, item.data.id, data.gm);
                        world.name = data.n;
                        world.worldType = data.wt !== undefined ? data.wt : (data.f === 1 ? 1 : 0);
                        world._gameType = data.gt;
                        world.savedData = data;
                        mc.loadWorld(world);
                    });
                }));
        } else if (item.kind === "server") {
            const e = item.data;
            if (e.realServer) {
                import("../screens/GuiRealServerConnecting.js").then(m =>
                    mc.displayScreen(new m.default(this, e.address || String(e.code || "").replace(/^REAL:/i, ""), e.joinName || undefined)));
                return;
            }
            if (e.status !== "found") {
                mc.systemDialogs?.show(`${e.hostUsername}'s world is not reachable right now.`, { duration: 4000 });
                return;
            }
            // The probe peer holds its own PeerJS registration. Hand the
            // signalling slot over before dialling rather than racing it.
            mc.remoteWorlds?.releaseProbe?.();

            mc.multiplayer?.join(e.code, {
                enterOnApproval: true,
                approvalToken: e.token,
                username: e.joinName || undefined
            })
                .catch(error => {
                    console.error("Failed to join saved world:", error);
                    // A failed join attempt says nothing about whether the
                    // host is up: the code can be stale, an approval can be
                    // refused, signalling can wobble. Demoting the card to
                    // "Offline" here was wrong and was the reported bug.
                    // Leave the status alone and re-check it instead.
                    mc.systemDialogs?.show(
                        `Could not join ${e.worldName || e.hostUsername}: ${describeJoinError(error)}`,
                        { duration: 6000 });
                    mc.remoteWorlds?.ping?.(e);
                });
        }
    }

    remove(item) {
        const mc = this.minecraft;
        if (item.kind === "server") {
            const name = item.data.worldName || item.data.code;
            const ok = mc.remoteWorlds?.remove(item.data.code);
            mc.systemDialogs?.show(ok ? `Removed "${name}".` : "Could not remove that server.",
                { duration: 3000 });
            this.init();
            return;
        }
        import("../../world/storage/WorldStorage.js").then(m =>
            m.default.deleteWorld(item.data.id).then(() => {
                this.worlds = (this.worlds || []).filter(w => w.id !== item.data.id);
                mc.systemDialogs?.show(`Deleted "${item.data.name}".`, { duration: 3000 });
                this.init();
            }).catch(err => {
                console.error("Failed to delete world:", err);
                mc.systemDialogs?.show("Could not delete that world.", { duration: 3000 });
            }));
    }

    /**
     * Edits the card that was clicked.
     *
     * This used to ignore its argument entirely and just open the classic
     * world list, which is why the pencil appeared to do nothing useful on
     * a server card. Servers now open the Add/Edit Server modal pre-filled;
     * local worlds hand off to the classic rename screen.
     */
    edit(item) {
        const mc = this.minecraft;
        if (item && item.kind === "server") {
            import("./GuiExpAddServer.js").then(m =>
                mc.displayScreen(new m.default(this, () => { this._pinged = false; }, item.data)));
            return;
        }
        this.editBridge();
    }

    /** Renaming a local world lives in a screen the classic list owns. */
    editBridge() {
        import("../screens/GuiSelectWorld.js").then(m => {
            const s = new m.default(this);
            s.isExperimental = true;   // do not bounce straight back here
            this.minecraft.displayScreen(s);
        });
    }

    // ----------------------------------------------------------------- input

    handleMouseScroll(delta) {
        const L = this.layout();
        const placed = this.placed || this.place(L);
        const before = this.scrollY;
        this.scrollY = Math.max(0, Math.min(this.scrollY + delta * 16, this.maxScroll(L, placed)));
        if (this.scrollY !== before) this.init();
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        const L = this.layout();
        this.searchFocused = mouseY >= L.searchY && mouseY <= L.searchY + L.searchH &&
                             mouseX >= L.contentX && mouseX <= L.contentX + L.contentW;
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }

    keyTyped(key, character) {
        if (this.searchFocused) {
            if (key === "Backspace") { this.search = this.search.slice(0, -1); this.scrollY = 0; this.init(); return; }
            if (key === "Escape") { this.searchFocused = false; return; }
            if (character && character.length === 1 && character >= " ") {
                this.search += character; this.scrollY = 0; this.init(); return;
            }
        }
        if (key === "Escape") { this.minecraft.displayScreen(this.parent || null); return; }
        super.keyTyped(key, character);
    }

    // ----------------------------------------------------------------- paint

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        const L = this.layout();
        const C = ExpTheme.C, T = ExpTheme.T;
        this.drawDefaultBackground(stack);
        ExpTheme.dim(this, stack, this.width, this.height, 0.30);

        // Tab bar strip behind the tabs.
        this.drawRect(stack, 0, 0, this.width, L.tabH, C.tabBar, 0.92);

        // Search field.
        const sw = L.contentW;
        ExpTheme.plate(this, stack, L.contentX, L.searchY, sw - L.searchH - 2, L.searchH,
            { hover: this.searchFocused });
        const shown = this.search || (this.searchFocused ? "" : "Search");
        this.drawString(stack, shown, L.contentX + 5, ExpTheme.textY(L.searchY, L.searchH),
            this.search ? T.white : 0x9A9A9A);
        if (this.searchFocused && Math.floor(Date.now() / 500) % 2 === 0) {
            const cx = L.contentX + 5 + this.getStringWidth(stack, this.search);
            this.drawRect(stack, cx, L.searchY + 4, cx + 1, L.searchY + L.searchH - 4, "#FFFFFF");
        }
        ExpTheme.plate(this, stack, L.contentX + sw - L.searchH, L.searchY, L.searchH, L.searchH);
        ExpTheme.magnifier(this, stack, L.contentX + sw - L.searchH + 3, L.searchY + 3);

        // Section headers, empties and card faces.
        const placed = this.placed || this.place(L);
        for (const p of placed.items) {
            const sy = L.contentY + p.y - this.scrollY;
            if (sy + p.h < L.contentY - 2 || sy > L.contentY + L.contentH + 2) continue;
            if (p.type === "header") {
                // Scaled rather than double-struck: drawing 8px text twice
                // 1px apart ran the glyphs into each other and made
                // "Singleplayer" unreadable.
                ExpTheme.bigText(this, stack, p.title, p.x, sy, 1.5, T.white);
            } else if (p.type === "empty") {
                this.drawString(stack, p.text, p.x + 2, sy + 2, T.muted);
            } else if (p.type === "card" && (p.item.kind === "world" || p.item.kind === "server")) {
                this.drawCard(stack, p, L, mouseX, mouseY);
            }
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);

        // Tab labels and the active underline are painted over the buttons.
        for (const b of this.buttonList) {
            if (!b.isTab) continue;
            // labelWidth is the slice tabButtons() reserved; clip to it so a
            // squeezed strip ellipsises instead of overlapping its neighbour.
            const label = this.trim(stack, b.string, b.labelWidth || b.width);
            const w = this.getStringWidth(stack, label);
            this.drawString(stack, label, b.x + Math.round((b.width - w) / 2),
                ExpTheme.textY(b.y, b.height), b.active ? T.white : 0xA8AAB0);
            if (b.active) this.drawRect(stack, b.x + 4, b.y + b.height - 2, b.x + b.width - 4, b.y + b.height - 1, "#FFFFFF");
        }

        ExpTheme.scrollbar(this, stack, this.width - L.rightW - L.pad * 2 - 1, L.contentY,
            L.contentH, this.scrollY, placed.totalH, L.contentH);
    }

    drawCard(stack, p, L, mouseX, mouseY) {
        const C = ExpTheme.C, T = ExpTheme.T;
        const d = p.item.data;
        const sy = L.contentY + p.y - this.scrollY;
        const hover = mouseX >= p.x && mouseX <= p.x + p.w && mouseY >= sy && mouseY <= sy + p.h;

        // Thumbnail. No world screenshots are stored, so draw a deterministic
        // stand-in derived from the entry's own identity.
        this.drawThumb(stack, p.x, sy, p.w, L.thumbH, p.item);

        if (p.item.kind === "world") {
            const gm = ["Survival", "Creative", "Adventure", "Spectator"][d.gm] || "Survival";
            const col = d.gm === 1 ? C.badgeCreative : (d.gm === 0 ? C.badgeSurvival : C.badgeHardcore);
            ExpTheme.badge(this, stack, p.x + 2, sy + L.thumbH - 13, gm, col);
        } else {
            const online = d.realServer || d.status === "found";
            const label = d.realServer ? "Real" : (online ? "Online" : (d.status === "pinging" ? "Checking" : "Offline"));
            ExpTheme.badge(this, stack, p.x + 2, sy + L.thumbH - 13, label, online ? C.online : C.offline);
        }

        // Name bar.
        const by = sy + L.thumbH;
        this.drawRect(stack, p.x, by, p.x + p.w, by + L.nameH, hover ? C.surfaceHi : C.surface);
        const name = p.item.kind === "world" ? d.name : (d.worldName || d.hostUsername || "Server");
        this.drawString(stack, this.trim(stack, name, p.w - 26), p.x + 3, by + 2, T.white);

        // Meta bar.
        const my = by + L.nameH;
        this.drawRect(stack, p.x, my, p.x + p.w, my + L.metaH, C.surfaceLo);
        let left, right;
        if (p.item.kind === "world") {
            left = this.dateStr(d.lastPlayed);
            right = this.sizeStr(d.size);
        } else {
            left = d.realServer ? (d.address || String(d.code || "").replace(/^REAL:/i, "")) : (d.code || "");
            right = d.realServer ? "Java" : (d.players != null ? String(d.players) : "");
        }
        this.drawStringNoShadow(stack, this.trim(stack, left, p.w * 0.6), p.x + 3, my + 1, T.muted);
        const rw = this.getStringWidth(stack, right);
        this.drawStringNoShadow(stack, right, p.x + p.w - rw - 3, my + 1, T.muted);

        this.drawRect(stack, p.x, sy, p.x + p.w, sy + 1, C.border);
        this.drawRect(stack, p.x, my + L.metaH - 1, p.x + p.w, my + L.metaH, C.border);
    }

    /** Deterministic placeholder art, stable per world/server. */
    /**
     * Resolves a lazily-loaded texture, rejecting the 1x1 magenta placeholder
     * the loader hands out before the real image arrives. Never cache the
     * result across frames: the placeholder would be cached instead.
     */
    lanTexture(name) {
        const tex = this.getTexture("../../" + name);
        if (!tex) return null;
        const tw = tex.width || tex.naturalWidth || 0;
        const th = tex.height || tex.naturalHeight || 0;
        if (tw <= 1 && th <= 1) return null;
        return tex;
    }

    /**
     * Decoded <img> for a world's stored POV thumbnail, built on demand and
     * cached per screen. Returns null until the image has decoded.
     */
    worldThumb(id, dataUrl) {
        if (!dataUrl) return null;
        this._thumbCache = this._thumbCache || new Map();
        let img = this._thumbCache.get(id);
        if (img === undefined) {
            img = new Image();
            img.src = dataUrl;
            this._thumbCache.set(id, img);
        }
        return (img.complete && img.naturalWidth > 1) ? img : null;
    }

    drawThumb(stack, x, y, w, h, item) {
        // Servers use the shipped artwork, matching the classic list: the
        // colour tile once the host has answered, the grey one until then.
        if (item.kind === "server") {
            const found = item.data.realServer || item.data.status === "found";
            const tex = this.lanTexture(found ? "server_found.png" : "Server_pinging.png");
            if (tex) {
                this.drawSprite(stack, tex, 0, 0,
                    tex.width || tex.naturalWidth, tex.height || tex.naturalHeight,
                    x, y, w, h);
                return;
            }
            this.drawRect(stack, x, y, x + w, y + h, found ? "#45505C" : "#3A3B3C");
            return;
        }

        // Local worlds show the player's own view, saved with the world.
        const img = this.worldThumb(item.data.id, item.data.thumb);
        if (img) {
            this.drawSprite(stack, img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, w, h);
            return;
        }

        // Fallback for worlds saved before thumbnails existed.
        const key = String(item.data.id || item.data.code || item.data.name || "x");
        let n = 0;
        for (let i = 0; i < key.length; i++) n = (n * 31 + key.charCodeAt(i)) >>> 0;
        // Shifts must be unsigned: n is >>> 0, and a signed >> on a hash past
        // 2^31 yields a negative index and an undefined colour.
        const pick = (arr, shift) => arr[((n >>> shift) % arr.length)];
        const sky = pick(["#5A7FA8", "#6E5A8A", "#A87A5A", "#4A6E7A", "#7A5A5A"], 0);
        const ground = pick(["#4F8236", "#6B5636", "#8A7A4A", "#3F6E4A", "#6E6E6E"], 3);
        this.drawRect(stack, x, y, x + w, y + h, sky);
        const horizon = y + Math.round(h * 0.58);
        this.drawRect(stack, x, horizon, x + w, y + h, ground);
        this.drawRect(stack, x, horizon, x + w, horizon + 1, "#00000055");
        for (let i = 0; i < 4; i++) {
            const bw = 6 + ((n >>> (i * 2)) % 5) * 3;
            const bx = x + ((n >>> (i * 3)) % Math.max(1, w - bw));
            const bh = 3 + ((n >>> (i + 1)) % 6);
            this.drawRect(stack, bx, horizon - bh, bx + bw, horizon, "#00000033");
        }
    }

    dateStr(ms) {
        if (!ms) return "";
        const d = new Date(ms);
        const p = v => String(v).padStart(2, "0");
        return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    sizeStr(bytes) {
        if (!bytes) return "";
        if (bytes < 1024) return bytes + "B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
        return (bytes / 1048576).toFixed(1) + "MB";
    }

    trim(stack, s, maxW) {
        s = String(s == null ? "" : s);
        if (this.getStringWidth(stack, s) <= maxW) return s;
        let out = s;
        while (out.length > 1 && this.getStringWidth(stack, out + "...") > maxW) out = out.slice(0, -1);
        return out + "...";
    }
}
