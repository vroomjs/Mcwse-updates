import GuiButton from "./GuiButton.js";

/**
 * Two-cell toggle switch matching the reference UI: a coloured track cell
 * carrying an "I" sits beside a raised light knob. The knob is on the right
 * when the switch is on and slides to the left when it is off.
 *
 * Extends GuiButton so it drops straight into a screen's buttonList and
 * inherits hit testing, the click sound and the enabled flag; only the
 * drawing is replaced.
 */
export default class GuiToggleSwitch extends GuiButton {

    static SWITCH_W = 30;
    static SWITCH_H = 16;
    static LABEL_GAP = 6;
    // The track is shorter than the knob and bottom-aligned, so the knob reads
    // as a raised block standing above the track, as in the reference.
    static TRACK_DROP = 3;

    // Sampled from the reference screenshots.
    static COLORS = {
        border:    "#1C211B",
        onBody:    "#4F8236", onLight:   "#739F5F", onDark:   "#3C5E2B",
        offBody:   "#5A5C5E", offLight:  "#7E8083", offDark:  "#3C3E40",
        knobBody:  "#D0D2D4", knobLight: "#EAEDF0", knobDark: "#57595B",
        glyph:     "#FFFFFF"
    };

    /** Width of switch + gap + label, so a screen can right-align the row. */
    static widthFor(minecraft, label) {
        const text = label ? minecraft.fontRenderer.getStringWidth(label) : 0;
        return GuiToggleSwitch.SWITCH_W + (label ? GuiToggleSwitch.LABEL_GAP + text : 0);
    }

    /**
     * @param getState  () => boolean   read the current value
     * @param onToggle  (next) => void  persist the new value
     */
    constructor(label, x, y, totalWidth, getState, onToggle) {
        super(label, x, y, totalWidth || GuiToggleSwitch.SWITCH_W, GuiToggleSwitch.SWITCH_H, null);
        this.label = label;
        this.getState = getState;
        this.onToggle = onToggle;
        // Assigned after super() so the arrow never closes over an uninitialised this.
        this.callback = () => { if (this.onToggle) this.onToggle(!this.getState()); };
    }

    isOn() { return !!(this.getState && this.getState()); }

    render(stack, mouseX, mouseY, partialTicks) {
        if (!this.minecraft) return;
        const mouseOver = this.isMouseOver(mouseX, mouseY);
        this.drawSwitch(stack, this.x, this.y, this.isOn());
        if (this.label) {
            const color = !this.enabled ? 0xA0A0A0 : (mouseOver ? 0xFFFF55 : 0xFFFFFF);
            this.drawString(stack, this.label,
                this.x + GuiToggleSwitch.SWITCH_W + GuiToggleSwitch.LABEL_GAP,
                this.y + Math.floor((GuiToggleSwitch.SWITCH_H - 8) / 2) + 1,
                color);
        }
    }

    drawSwitch(stack, x, y, on) {
        const C = GuiToggleSwitch.COLORS;
        const W = GuiToggleSwitch.SWITCH_W, H = GuiToggleSwitch.SWITCH_H;
        const drop = GuiToggleSwitch.TRACK_DROP;
        const half = Math.floor(W / 2);

        const trackX = on ? x : x + half;
        const knobX  = on ? x + half : x;

        // Track: shorter than the knob, bottom aligned, with its own outline.
        const tY = y + drop, tH = H - drop;
        this.drawRect(stack, trackX, tY, trackX + half, y + H, C.border);
        this.drawCell(stack, trackX + 1, tY + 1, half - 2, tH - 2,
            on ? C.onBody : C.offBody,
            on ? C.onLight : C.offLight,
            on ? C.onDark : C.offDark);

        // The "I" reads as "on", so it rides with the lit track.
        if (on) {
            const gw = 2;
            const gh = Math.max(4, Math.round((tH - 2) * 0.5));
            const gx = trackX + 1 + Math.floor((half - 2 - gw) / 2);
            const gy = tY + 1 + Math.floor((tH - 2 - gh) / 2);
            this.drawRect(stack, gx, gy, gx + gw, gy + gh, C.glyph);
        }

        // Knob: full height, lit on three sides over a thick dark base.
        this.drawRect(stack, knobX, y, knobX + half, y + H, C.border);
        this.drawKnob(stack, knobX + 1, y + 1, half - 2, H - 2);
    }

    /** Raised light knob: highlight on top/left/right, 2px shadow underneath. */
    drawKnob(stack, x, y, w, h) {
        const C = GuiToggleSwitch.COLORS;
        this.drawRect(stack, x, y, x + w, y + h, C.knobBody);
        this.drawRect(stack, x, y, x + w, y + 1, C.knobLight);
        this.drawRect(stack, x, y, x + 1, y + h, C.knobLight);
        this.drawRect(stack, x + w - 1, y, x + w, y + h, C.knobLight);
        this.drawRect(stack, x, y + h - 2, x + w, y + h, C.knobDark);
    }

    /** Flat fill with a light top/left bevel and a dark bottom/right one. */
    drawCell(stack, x, y, w, h, body, light, dark) {
        this.drawRect(stack, x, y, x + w, y + h, body);
        this.drawRect(stack, x, y, x + w, y + 1, light);
        this.drawRect(stack, x, y, x + 1, y + h, light);
        this.drawRect(stack, x, y + h - 1, x + w, y + h, dark);
        this.drawRect(stack, x + w - 1, y, x + w, y + h, dark);
    }
}
