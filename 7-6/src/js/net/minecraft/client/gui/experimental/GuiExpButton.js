import GuiButton from "../widgets/GuiButton.js";
import ExpTheme from "./ExpTheme.js";

/**
 * Button for the Experimental UI. Extends GuiButton so clicks keep routing
 * through GuiScreen.buttonList, and swaps only the painting.
 *
 * Variants, all taken from the references:
 *   "light"    main-menu buttons  (#D0D2D4 body, dark text)
 *   "dark"     pause / settings / world buttons (#48494A body, white text)
 *   "selected" the green active sidebar entry
 *   "chip"     lighter inset value chip on the settings rows
 */
export default class GuiExpButton extends GuiButton {

    constructor(label, x, y, w, h, callback, opt = {}) {
        super(label, x, y, w, h, callback);
        this.variant  = opt.variant || "dark";
        this.align    = opt.align || "center";
        this.icon     = opt.icon || null;
        this.selected = !!opt.selected;
        this.bold     = !!opt.bold;
        this.padX     = opt.padX != null ? opt.padX : 8;
    }

    setSelected(v) { this.selected = v; return this; }

    render(stack, mouseX, mouseY, partialTicks) {
        if (!this.minecraft) return;
        const hover = this.enabled && this.isMouseOver(mouseX, mouseY);
        const C = ExpTheme.C, T = ExpTheme.T;
        const opt = { hover, selected: this.selected, disabled: !this.enabled };

        // "tab", "card" and "flat" are hit zones whose visuals the owning
        // screen paints, so they draw only hover feedback (or nothing).
        if (this.variant === "card") {
            if (hover) this.drawRect(stack, this.x, this.y, this.x + this.width, this.y + this.height, "#FFFFFF", 0.06);
            return;
        }
        if (this.variant === "tab") {
            if (hover) this.drawRect(stack, this.x, this.y + this.height - 1, this.x + this.width, this.y + this.height, "#FFFFFF", 0.5);
            return;
        }
        if (this.variant === "flat") {
            if (hover) this.drawRect(stack, this.x - 1, this.y - 1, this.x + this.width + 1, this.y + this.height + 1, "#FFFFFF", 0.18);
            if (this.icon) GuiExpButton.drawIcon(this, stack, this.icon, this.x, this.y, hover ? "#FFFF55" : "#D8D8D8");
            return;
        }
        if (this.variant === "light") ExpTheme.lightPlate(this, stack, this.x, this.y, this.width, this.height, opt);
        else if (this.variant === "chip") ExpTheme.chip(this, stack, this.x, this.y, this.width, this.height, opt);
        else ExpTheme.plate(this, stack, this.x, this.y, this.width, this.height, opt);

        let color = this.variant === "light" ? T.dark : T.white;
        if (!this.enabled) color = this.variant === "light" ? 0x6A6A6A : 0x9A9A9A;
        else if (hover && this.variant !== "light" && !this.selected) color = T.yellow;

        if (this.icon) {
            GuiExpButton.drawIcon(this, stack, this.icon,
                this.x + Math.floor((this.width - 10) / 2),
                this.y + Math.floor((this.height - 10) / 2),
                this.variant === "light" ? "#1F2123" : "#FFFFFF");
            if (!this.string) return;
        }

        // Dark-on-light text is drawn without a shadow, as in the reference;
        // a shadow under dark glyphs just reads as mud.
        const draw = this.variant === "light"
            ? (s, x, y, c) => this.drawStringNoShadow(stack, s, x, y, c)
            : (s, x, y, c) => this.drawString(stack, s, x, y, c);
        const ty = ExpTheme.textY(this.y, this.height);
        const w = this.getStringWidth(stack, this.string);
        const tx = this.align === "left" ? this.x + this.padX : this.x + Math.floor((this.width - w) / 2);
        draw(this.string, tx, ty, color);
        // The reference renders a couple of labels heavier. This used to be a
        // 1px horizontal double-strike, but at an 8px font that merges
        // adjacent glyphs ("Done" came out as a smear), so emphasis is now
        // carried by a brighter fill and the plate itself.
    }

    /** Tiny rect-drawn icons, so no new texture assets are needed. */
    static drawIcon(gui, stack, name, x, y, color) {
        const px = (a, b, w = 1, h = 1) => gui.drawRect(stack, x + a, y + b, x + a + w, y + b + h, color);
        switch (name) {
            case "pencil":
                px(6, 0, 3, 3); px(4, 2, 3, 3); px(2, 4, 3, 3); px(1, 6, 2, 2); px(0, 8, 2, 2);
                break;
            case "trash":
                px(2, 0, 6, 1); px(0, 1, 10, 2); px(1, 3, 8, 7);
                gui.drawRect(stack, x + 3, y + 4, x + 4, y + 9, "#2A2A2A");
                gui.drawRect(stack, x + 6, y + 4, x + 7, y + 9, "#2A2A2A");
                break;
            case "gear":
                px(4, 0, 2, 10); px(0, 4, 10, 2); px(1, 1, 2, 2); px(7, 1, 2, 2);
                px(1, 7, 2, 2); px(7, 7, 2, 2);
                gui.drawRect(stack, x + 4, y + 4, x + 6, y + 6, "#48494A");
                break;
            case "plus":
                px(4, 0, 2, 10); px(0, 4, 10, 2);
                break;
            case "arrow-right":
                px(1, 4, 6, 2); px(5, 2, 2, 2); px(7, 4, 2, 2); px(5, 6, 2, 2);
                break;
            case "coin":
                px(2, 0, 6, 1); px(1, 1, 8, 8); px(2, 9, 6, 1);
                gui.drawRect(stack, x + 3, y + 3, x + 7, y + 4, "#2A2A2A");
                gui.drawRect(stack, x + 3, y + 5, x + 7, y + 6, "#2A2A2A");
                break;
        }
    }
}
