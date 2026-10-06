import GuiButton from "../widgets/GuiButton.js";
import ExpTheme from "./ExpTheme.js";

/**
 * Continuous-range control for the Experimental settings pane.
 *
 * The classic settings screens expose a lot of genuinely continuous values
 * (volumes, brightness, render distance, the light-engine budgets). Cycling
 * those through four preset stops, which is all the old "value chip" row
 * could do, loses resolution the player had before. This widget keeps the
 * full range.
 *
 * Drag handling mirrors GuiSliderButton so it behaves identically to the
 * classic sliders: press anywhere on the track to jump, then drag.
 */
export default class GuiExpSlider extends GuiButton {

    constructor(x, y, w, h, value, min, max, step, onChange, format) {
        super("", x, y, w, h, () => {});
        this.min = min;
        this.max = max;
        this.step = step || 0;
        this.value = this.clamp(value);
        this.onChange = onChange;
        this.format = format || (v => String(v));
        this.dragging = false;
    }

    clamp(v) {
        let n = Number(v);
        if (!Number.isFinite(n)) n = this.min;
        if (this.step > 0) n = Math.round(n / this.step) * this.step;
        return Math.max(this.min, Math.min(this.max, n));
    }

    frac() {
        const span = this.max - this.min;
        return span <= 0 ? 0 : (this.value - this.min) / span;
    }

    fromMouse(mouseX) {
        const usable = this.width - 6;
        const t = usable <= 0 ? 0 : (mouseX - this.x - 3) / usable;
        return this.clamp(this.min + Math.max(0, Math.min(1, t)) * (this.max - this.min));
    }

    apply(mouseX) {
        const next = this.fromMouse(mouseX);
        if (next === this.value) return;
        this.value = next;
        if (this.onChange) this.onChange(next);
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        if (!this.enabled || !this.isMouseOver(mouseX, mouseY)) return;
        this.dragging = true;
        this.apply(mouseX);
        return true;
    }

    mouseDragged(mouseX, mouseY, mouseButton) {
        if (this.dragging) this.apply(mouseX);
    }

    mouseReleased(mouseX, mouseY, mouseButton) { this.dragging = false; }

    render(stack, mouseX, mouseY, partialTicks) {
        if (!this.minecraft) return;
        const hover = this.enabled && (this.dragging || this.isMouseOver(mouseX, mouseY));
        ExpTheme.slider(this, stack, this.x, this.y, this.width, this.height, this.frac(), { hover });
        const label=this.format(this.value);
        this.drawString(stack, label, this.x+7, this.y+Math.max(2,Math.floor(this.height/2)-4), 0xFFFFFF);
        // The owning screen paints the formatted value inside the label
        // plate, so it can right-align it without overflowing the pane.
    }
}
