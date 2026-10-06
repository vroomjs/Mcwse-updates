import GuiScreen from "../GuiScreen.js";
import GuiExpButton from "./GuiExpButton.js";
import ExpTheme from "./ExpTheme.js";

/**
 * "Add Server" modal, opened by the + tile on the Servers row.
 *
 * It now asks whether the entry is an MCWSE LAN-code world or a real Minecraft
 * Java server. Real servers are handed to the LabyStudio/js-minecraft protocol
 * bridge when joined.
 */
export default class GuiExpAddServer extends GuiScreen {

    static BASE_FIELDS = [
        { key: "joinName", label: "Join Name", hint: "(your username)", max: 16 }
    ];

    constructor(parent, onAdded, edit) {
        super();
        this.isExperimental = true;
        this.parent = parent || null;
        this.previousScreen = this.parent;
        this.onAdded = onAdded || null;
        this.edit = edit || null;
        this.isRealServer = !!(edit && edit.realServer);
        this.values = {
            joinName: (edit && edit.joinName) || "",
            code: (edit && !edit.realServer && edit.code) || "",
            address: (edit && edit.realServer && (edit.address || String(edit.code || "").replace(/^REAL:/i, ""))) || ""
        };
        this.focus = this.edit ? "joinName" : (this.isRealServer ? "address" : "code");
        this.error = "";
    }

    title() { return this.edit ? "Edit Server" : "Add Server"; }

    fields() {
        return [
            ...GuiExpAddServer.BASE_FIELDS,
            this.isRealServer
                ? { key: "address", label: "Real Server Address", hint: "example.org:25565", max: 80, upper: false }
                : { key: "code", label: "LAN Code", hint: "ABC123", max: 16, upper: true }
        ];
    }

    hintFor(f) {
        if (f.key !== "joinName") return f.hint;
        const u = this.minecraft && this.minecraft.settings && this.minecraft.settings.username;
        return u ? "(" + u + ")" : f.hint;
    }

    layout() {
        const W = this.width, H = this.height;
        const panelW = Math.round(Math.max(190, Math.min(W * 0.68, 270)));
        const fieldH = 18;
        const btnH = 18;
        const pad = 8;
        const titleH = 16;
        const questionH = 32;
        const fields = this.fields().length;
        const panelH = titleH + questionH + pad + fields * (fieldH + 16) + btnH + pad * 2;
        const panelX = Math.round((W - panelW) / 2);
        const panelY = Math.round((H - panelH) / 2);
        return { panelW, panelH, panelX, panelY, pad, fieldH, btnH, titleH, questionH,
                 fieldX: panelX + pad, fieldW: panelW - pad * 2,
                 questionY: panelY + titleH + pad + 4,
                 firstFieldY: panelY + titleH + questionH + pad + 8 };
    }

    fieldRect(L, i) {
        return { x: L.fieldX, y: L.firstFieldY + i * (L.fieldH + 16), w: L.fieldW, h: L.fieldH };
    }

    modeRects(L) {
        const gap = 4;
        const w = Math.floor((L.fieldW - gap) / 2);
        return {
            lan: { x: L.fieldX, y: L.questionY + 13, w, h: 15 },
            real: { x: L.fieldX + w + gap, y: L.questionY + 13, w: L.fieldW - w - gap, h: 15 }
        };
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

    normalizeAddress(raw) {
        return String(raw || "").trim().replace(/^minecraft:\/\//i, "");
    }

    realCode(address) {
        return "REAL:" + this.normalizeAddress(address).toUpperCase();
    }

    submit() {
        const mc = this.minecraft;
        const joinName = this.values.joinName.trim();
        if (!mc.remoteWorlds) { this.error = "Multiplayer is unavailable."; return; }

        if (this.isRealServer) {
            const address = this.normalizeAddress(this.values.address);
            if (!address) { this.error = "Enter a real server address."; return; }
            const code = this.realCode(address);
            if (this.edit) {
                const moved = code !== String(this.edit.code).toUpperCase();
                if (moved && mc.remoteWorlds.get(code)) { this.error = "That server is already in your list."; return; }
                const ok = mc.remoteWorlds.update(this.edit.code, {
                    code, realServer: true, address, joinName,
                    hostUsername: "Real Server", worldName: address
                });
                if (!ok) { this.error = "Could not save those changes."; return; }
            } else {
                if (mc.remoteWorlds.get(code)) { this.error = "That server is already in your list."; return; }
                mc.remoteWorlds.add({
                    code, realServer: true, address,
                    hostUsername: "Real Server",
                    worldName: address,
                    joinName
                });
            }
            mc.remoteWorlds.pingAll?.(true);
            if (this.onAdded) this.onAdded(code);
            mc.displayScreen(this.parent || null);
            return;
        }

        const code = this.values.code.trim().toUpperCase();
        if (!code) { this.error = "Enter a LAN code."; return; }

        if (this.edit) {
            const moved = code !== String(this.edit.code).toUpperCase();
            if (moved && mc.remoteWorlds.get(code)) {
                this.error = "Another saved server already uses that code.";
                return;
            }
            const ok = mc.remoteWorlds.update(this.edit.code, { code, realServer: false, address: null, joinName });
            if (!ok) { this.error = "Could not save those changes."; return; }
        } else {
            if (mc.remoteWorlds.get(code)) { this.error = "That server is already in your list."; return; }
            mc.remoteWorlds.add({
                code,
                realServer: false,
                hostUsername: "Unknown",
                worldName: `${code}'s World`,
                joinName
            });
        }

        mc.remoteWorlds.pingAll?.(true);
        if (this.onAdded) this.onAdded(code);
        mc.displayScreen(this.parent || null);
    }

    setMode(real) {
        if (this.isRealServer === real) return;
        this.isRealServer = real;
        this.focus = real ? "address" : "code";
        this.error = "";
        this.init();
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        const L = this.layout();
        const modes = this.modeRects(L);
        for (const [key, r] of Object.entries(modes)) {
            if (mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h) {
                this.setMode(key === "real");
                return true;
            }
        }
        this.fields().forEach((f, i) => {
            const r = this.fieldRect(L, i);
            if (mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h) {
                this.focus = f.key;
            }
        });
        super.mouseClicked(mouseX, mouseY, mouseButton);
    }

    keyTyped(key, character) {
        const fields = this.fields();
        const field = fields.find(f => f.key === this.focus);
        if (key === "Escape") { this.minecraft.displayScreen(this.parent || null); return true; }
        if (key === "Enter") { this.submit(); return true; }
        if (key === "Tab") {
            const i = fields.findIndex(f => f.key === this.focus);
            this.focus = fields[(i + 1) % fields.length].key;
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

    drawModeButton(stack, r, label, active) {
        ExpTheme.chip(this, stack, r.x, r.y, r.w, r.h, { hover: active });
        const color = active ? ExpTheme.T.white : 0xA8A8A8;
        const text = this.trim ? this.trim(stack, label, r.w - 6) : label;
        const tw = this.getStringWidth(stack, text);
        this.drawString(stack, text, r.x + Math.max(3, Math.floor((r.w - tw) / 2)), ExpTheme.textY(r.y, r.h), color);
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        const L = this.layout();
        const T = ExpTheme.T;
        this.drawDefaultBackground(stack);
        ExpTheme.dim(this, stack, this.width, this.height, 0.6);

        ExpTheme.plate(this, stack, L.panelX, L.panelY, L.panelW, L.panelH);
        ExpTheme.bigText(this, stack, this.title(), L.panelX + L.pad, L.panelY + L.pad - 1, 1.25, T.white);

        this.drawString(stack, "Is this a real Minecraft server?", L.fieldX, L.questionY, T.version);
        const modes = this.modeRects(L);
        this.drawModeButton(stack, modes.lan, "No, LAN Code", !this.isRealServer);
        this.drawModeButton(stack, modes.real, "Yes, Real Server", this.isRealServer);

        this.fields().forEach((f, i) => {
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

        if (this.isRealServer) {
            this.drawString(stack, "Real servers use LabyStudio/js-minecraft's 1.8 protocol bridge.",
                L.fieldX, L.panelY + L.panelH - L.pad - L.btnH - 22, 0x9A9A9A);
        }
        if (this.error) {
            this.drawString(stack, this.error, L.fieldX,
                L.panelY + L.panelH - L.pad - L.btnH - 11, T.red);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}
