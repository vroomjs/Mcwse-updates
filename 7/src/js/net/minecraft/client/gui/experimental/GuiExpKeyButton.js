import GuiButton from "../widgets/GuiButton.js";
import ExpTheme from "./ExpTheme.js";

/**
 * Keybind chip for the Experimental Controls page.
 *
 * Click to arm, then the next key pressed is captured. Escape cancels
 * instead of binding, which the classic GuiKeyButton did not allow and
 * which makes it possible to back out of a mis-click.
 */
export default class GuiExpKeyButton extends GuiButton {

    constructor(x, y, w, h, key, onBind) {
        super("", x, y, w, h, () => {});
        this.key = key;
        this.onBind = onBind;
        this.listening = false;
    }

    onPress() { this.listening = true; }

    keyTyped(key, character) {
        if (!this.listening) return;
        this.listening = false;
        if (key === "Escape") return;          // cancel, keep the old bind
        this.key = key;
        if (this.onBind) this.onBind(key);
    }

    /** Compact display for the long DOM key names. */
    static pretty(key) {
        if (key == null || key === "") return "None";
        const k = String(key);
        const map = {
            " ": "Space", "ArrowUp": "Up", "ArrowDown": "Down",
            "ArrowLeft": "Left", "ArrowRight": "Right",
            "Control": "Ctrl", "Escape": "Esc"
        };
        if (map[k]) return map[k];
        if (k.startsWith("Key") && k.length === 4) return k.slice(3);
        if (k.startsWith("Digit") && k.length === 6) return k.slice(5);
        if (k.length === 1) return k.toUpperCase();
        return k;
    }

    render(stack, mouseX, mouseY, partialTicks) {
        if (!this.minecraft) return;
        const hover = this.enabled && this.isMouseOver(mouseX, mouseY);
        ExpTheme.chip(this, stack, this.x, this.y, this.width, this.height,
            { hover: hover || this.listening });

        const label = this.listening ? "> ... <" : GuiExpKeyButton.pretty(this.key);
        const w = this.getStringWidth(stack, label);
        this.drawString(stack, label,
            this.x + Math.round((this.width - w) / 2),
            ExpTheme.textY(this.y, this.height),
            this.listening ? ExpTheme.T.yellow : ExpTheme.T.white);
    }
}
