import GuiScreen from "../GuiScreen.js";
import GuiExpButton from "./GuiExpButton.js";
import ExpTheme from "./ExpTheme.js";

/**
 * Skin customiser in the Experimental visual language.
 *
 * Deliberately Three-free. The classic GuiSkins spins a real 3D ModelPlayer
 * through the Tessellator; that pulls the whole renderer into a screen that
 * only needs to show what a skin looks like. This one composites the preview
 * straight out of the 64x64 (or 64x32) skin texture as a flat paper-doll,
 * including the hat/jacket overlay layers, so the screen stays in the same
 * dependency-free tier as the rest of experimental/ and keeps rendering in
 * the headless harness.
 *
 * Storage is shared with the classic screen: the same `mc_custom_skins` key
 * and the same `settings.skin` value, so switching UIs does not lose skins.
 */
export default class GuiExpSkins extends GuiScreen {

    static PREMADE = [
        { name: "Steve", path: "../../steve (1).png" },
        { name: "Technoblade", path: "../../technoblade.png" },
        { name: "Notch", path: "../../notch.png" },
        { name: "Alex", path: "../../alex (1).png" }
    ];

    // Front-facing paper-doll, in 64x64 skin-texture coordinates.
    // [sx, sy, sw, sh, dx, dy] with dx/dy in 8px-wide "model units".
    static PARTS = [
        [8, 8, 8, 8, 4, 0],      // head
        [20, 20, 8, 12, 4, 8],   // body
        [44, 20, 4, 12, 0, 8],   // right arm
        [36, 52, 4, 12, 12, 8],  // left arm
        [4, 20, 4, 12, 4, 20],   // right leg
        [20, 52, 4, 12, 8, 20]   // left leg
    ];

    // Overlay (hat / jacket / sleeve) layers, 64x64 skins only.
    static OVERLAY = [
        [40, 8, 8, 8, 4, 0],
        [20, 36, 8, 12, 4, 8],
        [44, 36, 4, 12, 0, 8],
        [52, 52, 4, 12, 12, 8],
        [4, 36, 4, 12, 4, 20],
        [4, 52, 4, 12, 8, 20]
    ];

    constructor(parent) {
        super();
        this.isExperimental = true;
        this.parent = parent || null;
        this.previousScreen = this.parent;
        this.customSkins = new Array(4).fill(null);
        this._loaded = false;
        this.status = "";
    }

    // --------------------------------------------------------------- storage

    loadCustomSkins() {
        try {
            const saved = localStorage.getItem("mc_custom_skins");
            if (!saved) return;
            const data = JSON.parse(saved);
            for (let i = 0; i < 4; i++) {
                if (!data[i]) continue;
                const img = new Image();
                img.src = data[i];
                this.customSkins[i] = img;
                this.minecraft.resources[`custom_slot_${i}`] = img;
            }
        } catch (e) {
            console.warn("Failed to load custom skins", e);
        }
    }

    saveCustomSkins() {
        try {
            localStorage.setItem("mc_custom_skins",
                JSON.stringify(this.customSkins.map(img => img ? img.src : null)));
        } catch (e) {
            console.warn("Failed to save custom skins", e);
        }
    }

    currentSkin() { return this.minecraft.settings.skin; }

    selectSkin(path) {
        const s = this.minecraft.settings;
        s.skin = path;
        s.save();
        // Push the change at the live player so it applies without a reload.
        const p = this.minecraft.player;
        if (p) p.skin = path;
        this.init();
    }

    /** File picker -> data URL -> slot. */
    uploadTo(slot) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/png";
        input.onchange = () => {
            const file = input.files && input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    if (img.width !== 64 || (img.height !== 64 && img.height !== 32)) {
                        this.status = "Skin must be 64x64 or 64x32.";
                        return;
                    }
                    this.customSkins[slot] = img;
                    this.minecraft.resources[`custom_slot_${slot}`] = img;
                    this.saveCustomSkins();
                    this.selectSkin(`custom_slot_${slot}`);
                    this.status = "";
                };
                img.src = String(reader.result);
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    clearSlot(slot) {
        if (this.currentSkin() === `custom_slot_${slot}`) this.selectSkin(GuiExpSkins.PREMADE[0].path);
        this.customSkins[slot] = null;
        delete this.minecraft.resources[`custom_slot_${slot}`];
        this.saveCustomSkins();
        this.init();
    }

    // ---------------------------------------------------------------- layout

    layout() {
        const W = this.width, H = this.height;
        const pad = 6;
        const previewW = Math.round(Math.max(72, Math.min(W * 0.26, 120)));
        const previewX = W - previewW - pad;
        const listX = pad;
        const listW = previewX - pad * 2;
        const rowH = H < 260 ? 16 : 18;
        const gap = 3;
        const titleH = 20;
        const listTop = pad + titleH;
        const doneH = 20;
        return { pad, previewW, previewX, listX, listW, rowH, gap, titleH, listTop, doneH,
                 actionW: Math.round(Math.max(40, Math.min(listW * 0.26, 70))) };
    }

    init() {
        super.init();
        if (!this._loaded) { this.loadCustomSkins(); this._loaded = true; }

        const L = this.layout();
        const mc = this.minecraft;
        let y = L.listTop;

        // Premade skins: one selectable row each.
        for (const skin of GuiExpSkins.PREMADE) {
            const active = this.currentSkin() === skin.path;
            this.buttonList.push(new GuiExpButton(skin.name, L.listX, y, L.listW, L.rowH,
                () => this.selectSkin(skin.path),
                { align: "left", selected: active }));
            y += L.rowH + L.gap;
        }

        // Room for the CUSTOM SLOTS caption, which is painted at customTop-10.
        y += 14;
        this.customTop = y;

        // Custom slots: select / upload / clear.
        for (let i = 0; i < 4; i++) {
            const key = `custom_slot_${i}`;
            const has = !!this.customSkins[i];
            const active = this.currentSkin() === key;
            const mainW = L.listW - (has ? L.actionW * 2 + 4 : L.actionW) - 4;

            const main = new GuiExpButton(has ? `Custom ${i + 1}` : `Empty slot ${i + 1}`,
                L.listX, y, mainW, L.rowH,
                () => { if (has) this.selectSkin(key); else this.uploadTo(i); },
                { align: "left", selected: active });
            if (!has) main.setEnabled(true);
            this.buttonList.push(main);

            this.buttonList.push(new GuiExpButton(has ? "Replace" : "Upload",
                L.listX + mainW + 4, y, L.actionW, L.rowH,
                () => this.uploadTo(i), { variant: "chip" }));

            if (has) {
                this.buttonList.push(new GuiExpButton("Clear",
                    L.listX + mainW + 4 + L.actionW + 4, y, L.actionW, L.rowH,
                    () => this.clearSlot(i), { variant: "chip" }));
            }
            y += L.rowH + L.gap;
        }

        this.buttonList.push(new GuiExpButton("Done", L.listX, this.height - L.doneH - L.pad,
            Math.min(L.listW, 120), L.doneH,
            () => mc.displayScreen(this.parent || null), { bold: true }));
    }

    keyTyped(key, character) {
        if (key === "Escape") { this.minecraft.displayScreen(this.parent || null); return true; }
        return super.keyTyped(key, character);
    }

    // ----------------------------------------------------------------- paint

    /** Resolve the live texture for a skin id, rejecting the 1x1 placeholder. */
    skinTexture(path) {
        const tex = this.getTexture(path);
        if (!tex) return null;
        const w = tex.width || tex.naturalWidth || 0;
        const h = tex.height || tex.naturalHeight || 0;
        if (w <= 1 && h <= 1) return null;
        return tex;
    }

    /** Flat front-facing composite of a skin texture. */
    drawPaperDoll(stack, tex, x, y, unit) {
        const h = tex.height || tex.naturalHeight || 64;
        const sets = h >= 64 ? [GuiExpSkins.PARTS, GuiExpSkins.OVERLAY] : [GuiExpSkins.PARTS];
        for (const set of sets) {
            for (const [sx, sy, sw, sh, dx, dy] of set) {
                this.drawSprite(stack, tex, sx, sy, sw, sh,
                    x + dx * unit / 4, y + dy * unit / 4,
                    sw * unit / 4, sh * unit / 4);
            }
        }
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        const L = this.layout();
        const C = ExpTheme.C, T = ExpTheme.T;
        this.drawDefaultBackground(stack);
        ExpTheme.dim(this, stack, this.width, this.height, 0.35);

        ExpTheme.bigText(this, stack, "Customize Skin", L.pad, L.pad, 1.5, T.white);

        this.drawString(stack, "CUSTOM SLOTS", L.listX + 1,
            (this.customTop || L.listTop) - 10, T.version);

        // Preview column.
        ExpTheme.plate(this, stack, L.previewX, L.listTop, L.previewW,
            this.height - L.listTop - L.pad - L.doneH - 6);

        const tex = this.skinTexture(this.currentSkin());
        const boxH = this.height - L.listTop - L.pad - L.doneH - 6;
        if (tex) {
            // 16 model units tall, 16 wide; fit inside the plate with margin.
            const unit = Math.max(4, Math.min(
                Math.floor((L.previewW - 16) / 4),
                Math.floor((boxH - 20) / 8)));
            const dollW = 16 * unit / 4, dollH = 32 * unit / 4;
            this.drawPaperDoll(stack, tex,
                L.previewX + Math.round((L.previewW - dollW) / 2),
                L.listTop + Math.round((boxH - dollH) / 2), unit);
        } else {
            const msg = "Loading...";
            this.drawString(stack, msg,
                L.previewX + Math.round((L.previewW - this.getStringWidth(stack, msg)) / 2),
                L.listTop + Math.round(boxH / 2) - 4, T.muted);
        }

        if (this.status) {
            this.drawString(stack, this.status, L.listX, this.height - L.doneH - L.pad - 12, T.red);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}
