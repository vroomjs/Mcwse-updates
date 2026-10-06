import GuiScreen from "../GuiScreen.js";
import GuiExpButton from "./GuiExpButton.js";
import ExpTheme from "./ExpTheme.js";

/**
 * "Add Server" modal, opened by the + tile on the Servers row.
 *
 * NOTE ON THE DESIGN: the request referred to "the screenshot" for this
 * panel, but no such reference was attached to the conversation, so this is
 * built from the shared Experimental language instead - a centred dark plate
 * over a dimmed backdrop, light title, dark inset fields, one green primary
 * action. If a reference does exist, this is the one screen that should be
 * re-checked against it.
 *
 * A "server" here is another player's world, reached by its LAN code, which
 * is what Minecraft Websim Edition's multiplayer actually uses. The name
 * field is cosmetic: it is what the card shows in the list.
 */
export default class GuiExpAddServer extends GuiScreen {

    static FIELDS = [
        // The name you join AS, not a label for the server. Left blank it
        // falls back to the global username from settings.
        { key: "joinName", label: "Join Name", hint: "(your username)", max: 16 },
        { key: "code", label: "LAN Code", hint: "ABC123", max: 16, upper: true }
    ];

    /**
     * @param parent  screen to return to
     * @param onAdded callback once an entry is written
     * @param edit    existing entry to modify; omit to create a new one
     */
    constructor(parent, onAdded, edit) {
        super();
        this.isExperimental = true;
        this.parent = parent || null;
        this.previousScreen = this.parent;
        this.onAdded = onAdded || null;
        this.edit = edit || null;
        this.values = {
            joinName: (edit && edit.joinName) || "",
            code: (edit && edit.code) || ""
        };
        this.focus = this.edit ? "joinName" : "code";
        this.error = "";
    }

    title() { return this.edit ? "Edit Server" : "Add Server"; }

    /** Join Name shows the name it would fall back to, so blank is clear. */
    hintFor(f) {
        if (f.key !== "joinName") return f.hint;
        const u = this.minecraft && this.minecraft.settings && this.minecraft.settings.username;
        return u ? "(" + u + ")" : f.hint;
    }

    layout() {
        const W = this.width, H = this.height;
        const panelW = Math.round(Math.max(170, Math.min(W * 0.62, 240)));
        const fieldH = 18;
        const btnH = 18;
        const pad = 8;
        const titleH = 16;
        const panelH = titleH + pad + GuiExpAddServer.FIELDS.length * (fieldH + 16) + btnH + pad * 2;
        const panelX = Math.round((W - panelW) / 2);
        const panelY = Math.round((H - panelH) / 2);
        return { panelW, panelH, panelX, panelY, pad, fieldH, btnH, titleH,
                 fieldX: panelX + pad, fieldW: panelW - pad * 2,
                 firstFieldY: panelY + titleH + pad + 8 };
    }

    fieldRect(L, i) {
        return { x: L.fieldX, y: L.firstFieldY + i * (L.fieldH + 16), w: L.fieldW, h: L.fieldH };
    }

    init() {
        super.init();
        const L = this.layout();
        const mc = this.minecraft;
        const half = Math.floor((L.fieldW - 4) / 2);
        const by = L.panelY + L.panelH - L.pad - L.btnH;

        this.buttonList.push(new GuiExpButton("Cancel", L.fieldX, by, half, L.btnH,
            () => mc.displayScreen(this.parent || null)));

        this.addButton = new GuiExpButton(this.edit ? "Save" : "Add",
            L.fieldX + half + 4, by, L.fieldW - half - 4, L.btnH,
            () => this.submit(), { selected: true, bold: true });
        this.buttonList.push(this.addButton);
    }

    submit() {
        const mc = this.minecraft;
        const code = this.values.code.trim().toUpperCase();
        const joinName = this.values.joinName.trim();
        if (!code) { this.error = "Enter a LAN code."; return; }
        if (!mc.remoteWorlds) { this.error = "Multiplayer is unavailable."; return; }

        if (this.edit) {
            const moved = code !== String(this.edit.code).toUpperCase();
            if (moved && mc.remoteWorlds.get(code)) {
                this.error = "Another saved server already uses that code.";
                return;
            }
            const ok = mc.remoteWorlds.update(this.edit.code, { code, joinName });
            if (!ok) { this.error = "Could not save those changes."; return; }
        } else {
            if (mc.remoteWorlds.get(code)) { this.error = "That server is already in your list."; return; }
            mc.remoteWorlds.add({
                code,
                hostUsername: "Unknown",
                worldName: `${code}'s World`,
                joinName
            });
        }

        mc.remoteWorlds.pingAll?.(true);
        if (this.onAdded) this.onAdded(code);
        mc.displayScreen(this.parent || null);
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        const L = this.layout();
        GuiExpAddServer.FIELDS.forEach((f, i) => {
            const r = this.fieldRect(L, i);
            if (mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h) {
                this.focus = f.key;
            }
        });
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }

    keyTyped(key, character) {
        const field = GuiExpAddServer.FIELDS.find(f => f.key === this.focus);
        if (key === "Escape") { this.minecraft.displayScreen(this.parent || null); return true; }
        if (key === "Enter") { this.submit(); return true; }
        if (key === "Tab") {
            const i = GuiExpAddServer.FIELDS.findIndex(f => f.key === this.focus);
            this.focus = GuiExpAddServer.FIELDS[(i + 1) % GuiExpAddServer.FIELDS.length].key;
            return true;
        }
        if (field) {
            this.error = "";
            if (key === "Backspace") {
                this.values[field.key] = this.values[field.key].slice(0, -1);
                return true;
            }
            if (character && character.length === 1 && character >= " ") {
                if (this.values[field.key].length < field.max) {
                    this.values[field.key] += field.upper ? character.toUpperCase() : character;
                }
                return true;
            }
        }
        return super.keyTyped(key, character);
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        const L = this.layout();
        const T = ExpTheme.T;
        this.drawDefaultBackground(stack);
        ExpTheme.dim(this, stack, this.width, this.height, 0.6);

        ExpTheme.plate(this, stack, L.panelX, L.panelY, L.panelW, L.panelH);
        ExpTheme.bigText(this, stack, this.title(), L.panelX + L.pad, L.panelY + L.pad - 1, 1.25, T.white);

        GuiExpAddServer.FIELDS.forEach((f, i) => {
            const r = this.fieldRect(L, i);
            this.drawString(stack, f.label, r.x, r.y - 10, T.version);

            const focused = this.focus === f.key;
            ExpTheme.chip(this, stack, r.x, r.y, r.w, r.h, { hover: focused });

            const val = this.values[f.key];
            const shown = val || this.hintFor(f);
            this.drawString(stack, shown, r.x + 5, ExpTheme.textY(r.y, r.h),
                val ? T.white : 0x9A9A9A);

            if (focused && Math.floor(Date.now() / 500) % 2 === 0) {
                const cx = r.x + 5 + this.getStringWidth(stack, val);
                this.drawRect(stack, cx, r.y + 4, cx + 1, r.y + r.h - 4, "#FFFFFF");
            }
        });

        if (this.error) {
            this.drawString(stack, this.error, L.fieldX,
                L.panelY + L.panelH - L.pad - L.btnH - 11, T.red);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}
