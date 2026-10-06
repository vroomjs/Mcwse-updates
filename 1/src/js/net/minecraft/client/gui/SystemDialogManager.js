import Gui from "./Gui.js";

/**
 * Bedrock-style system dialogs.
 *
 * These are the small dark-blue popups used for client-side status messages
 * ("Requested to join Steve's world.") as opposed to achievement toasts, which
 * are owned by AchievementManager and render in the top-right corner.
 *
 * Rendered from ScreenRenderer rather than IngameOverlay, because these need to
 * appear over menu screens too -- the join request fires while GuiMultiplayer is
 * still open, and IngameOverlay only draws when a world is loaded.
 *
 * Timing is wall-clock rather than tick-based for the same reason: onTick() is
 * not a reliable heartbeat while sitting in a menu, so animation and expiry are
 * driven off performance.now().
 */

// Sampled from the reference art, which is 160x64 with a 1px black outline and
// a 2px inner border.
const PALETTE = {
    outline: "#000000",
    border: "#286485",
    fill: "#082C4C",
    iconCore: "#CAB60D",
    iconHighlight: "#FFFFFF",
    iconShadow: "#5C5C00"
};

const SLIDE_IN_MS = 180;
const SLIDE_OUT_MS = 220;

const PADDING = 8;
const ICON_WIDTH = 4;
const ICON_GAP = 8;
const LINE_HEIGHT = 10;

let nextDialogId = 1;

export default class SystemDialogManager extends Gui {

    constructor(minecraft) {
        super(minecraft);

        this.dialogs = [];
        this.defaultWidth = 160;
        this.minHeight = 64;
        this.defaultDuration = 4000;
        this.maxVisible = 4;
    }

    /**
     * Queue a dialog. Returns an id usable with setText()/dismiss(), which lets
     * a caller revise a message in place -- used by the join flow, which opens
     * the dialog before the host's name is known and fills it in on reply.
     */
    show(text, options = {}) {
        const id = options.id || nextDialogId++;

        // Reuse the slot if this id is already on screen so repeat calls update
        // rather than stack duplicates.
        const existing = this.dialogs.find(d => d.id === id && !d.closing);
        if (existing) {
            existing.text = String(text);
            existing.lines = null;
            existing.duration = options.duration ?? existing.duration;
            existing.born = performance.now();
            return id;
        }

        this.dialogs.push({
            id,
            text: String(text),
            lines: null,
            width: options.width || this.defaultWidth,
            duration: options.duration ?? this.defaultDuration,
            sticky: options.sticky === true,
            born: performance.now(),
            closing: false,
            closedAt: 0
        });

        while (this.dialogs.length > this.maxVisible) this.dialogs.shift();

        return id;
    }

    setText(id, text) {
        const dialog = this.dialogs.find(d => d.id === id);
        if (!dialog) return false;
        dialog.text = String(text);
        dialog.lines = null;
        return true;
    }

    /** Begin the slide-out, or remove instantly when immediate is set. */
    dismiss(id, immediate = false) {
        const index = this.dialogs.findIndex(d => d.id === id);
        if (index === -1) return false;

        if (immediate) {
            this.dialogs.splice(index, 1);
            return true;
        }

        const dialog = this.dialogs[index];
        if (!dialog.closing) {
            dialog.closing = true;
            dialog.closedAt = performance.now();
        }
        return true;
    }

    clear() {
        this.dialogs.length = 0;
    }

    render(stack, screenWidth, screenHeight) {
        if (this.dialogs.length === 0) return;
        if (!this.minecraft || !this.minecraft.fontRenderer) return;

        const now = performance.now();
        let cursorY = 6;

        for (let i = this.dialogs.length - 1; i >= 0; i--) {
            const dialog = this.dialogs[i];

            if (dialog.lines === null) {
                const textWidth = dialog.width - PADDING * 2 - ICON_WIDTH - ICON_GAP;
                dialog.lines = this.wrapText(stack, dialog.text, textWidth);
            }

            const height = Math.max(
                this.minHeight,
                PADDING * 2 + dialog.lines.length * LINE_HEIGHT
            );

            // Non-sticky dialogs start closing once they outlive their duration.
            if (!dialog.closing && !dialog.sticky && now - dialog.born > dialog.duration) {
                dialog.closing = true;
                dialog.closedAt = now;
            }

            let progress = 1;
            if (dialog.closing) {
                const t = (now - dialog.closedAt) / SLIDE_OUT_MS;
                if (t >= 1) {
                    this.dialogs.splice(i, 1);
                    continue;
                }
                progress = 1 - (t * t);
            } else {
                const t = Math.min(1, (now - dialog.born) / SLIDE_IN_MS);
                progress = 1 - Math.pow(1 - t, 3);
            }

            const x = Math.floor((screenWidth - dialog.width) / 2);
            // Slide down from above the top edge.
            const y = Math.floor(cursorY - (1 - progress) * (height + cursorY + 4));

            this.drawDialog(stack, dialog, x, y, height, progress);

            cursorY += height + 4;
        }
    }

    drawDialog(stack, dialog, x, y, height, alpha) {
        const w = dialog.width;

        // Frame: 1px black outline, 2px border, flat fill.
        this.drawRect(stack, x, y, x + w, y + height, PALETTE.outline, alpha);
        this.drawRect(stack, x + 1, y + 1, x + w - 1, y + height - 1, PALETTE.border, alpha);
        this.drawRect(stack, x + 3, y + 3, x + w - 3, y + height - 3, PALETTE.fill, alpha);

        // Centre the icon+text block vertically. The reference art is an empty
        // 160x64 template, so top-aligning real text to its 8px padding leaves
        // the bottom half visibly dead.
        const contentHeight = dialog.lines.length * LINE_HEIGHT;
        const textX = x + PADDING + ICON_WIDTH + ICON_GAP;
        const textY = y + Math.max(PADDING, Math.floor((height - contentHeight) / 2));

        this.drawWarningIcon(stack, x + PADDING, textY, dialog.lines.length, alpha);

        stack.save();
        stack.globalAlpha = alpha;
        for (let i = 0; i < dialog.lines.length; i++) {
            this.drawString(stack, dialog.lines[i], textX, textY + i * LINE_HEIGHT, 0xFFFFFF);
        }
        stack.restore();
    }

    /**
     * The beveled exclamation mark from the reference: a tall stem, a 2px gap,
     * then a square dot. Drawn procedurally so it needs no texture and stays
     * crisp at any GUI scale.
     *
     * Bevel rule, matching the source pixels exactly: the top row is highlight
     * except its last column, the bottom row is shadow except its first column,
     * the left column is highlight and the right column is shadow.
     */
    drawWarningIcon(stack, x, y, lineCount, alpha) {
        // Height tracks the text block so the mark never overhangs a short
        // message. The 4/2/11 split of the reference art falls out of this
        // exactly at two lines, which is the case the reference depicts.
        const total = Math.max(10, lineCount * LINE_HEIGHT - 3);
        const dotHeight = Math.max(2, Math.round(total * 4 / 17));
        const gap = Math.max(1, Math.round(total * 2 / 17));
        const stemHeight = Math.max(3, total - gap - dotHeight);

        this.drawBeveledBar(stack, x, y, ICON_WIDTH, stemHeight, alpha);
        this.drawBeveledBar(stack, x, y + stemHeight + gap, ICON_WIDTH, dotHeight, alpha);
    }

    drawBeveledBar(stack, x, y, w, h, alpha) {
        const core = PALETTE.iconCore;
        const highlight = PALETTE.iconHighlight;
        const shadow = PALETTE.iconShadow;

        this.drawRect(stack, x, y, x + w, y + h, core, alpha);

        // Left highlight / right shadow.
        this.drawRect(stack, x, y, x + 1, y + h, highlight, alpha);
        this.drawRect(stack, x + w - 1, y, x + w, y + h, shadow, alpha);

        // Top row: highlight, except the final column stays core.
        this.drawRect(stack, x, y, x + w - 1, y + 1, highlight, alpha);
        this.drawRect(stack, x + w - 1, y, x + w, y + 1, core, alpha);

        // Bottom row: shadow, except the first column stays core.
        this.drawRect(stack, x + 1, y + h - 1, x + w, y + h, shadow, alpha);
        this.drawRect(stack, x, y + h - 1, x + 1, y + h, core, alpha);
    }

    /** Greedy word wrap, with a hard character break for unspaced runs. */
    wrapText(stack, text, maxWidth) {
        const words = String(text).split(/\s+/).filter(w => w.length > 0);
        if (words.length === 0) return [""];

        const lines = [];
        let line = "";

        for (const word of words) {
            const candidate = line.length === 0 ? word : line + " " + word;

            if (this.getStringWidth(stack, candidate) <= maxWidth) {
                line = candidate;
                continue;
            }

            if (line.length > 0) {
                lines.push(line);
                line = "";
            }

            // A single word too long for the box: break it by character.
            if (this.getStringWidth(stack, word) > maxWidth) {
                let chunk = "";
                for (const char of word) {
                    if (this.getStringWidth(stack, chunk + char) > maxWidth && chunk.length > 0) {
                        lines.push(chunk);
                        chunk = char;
                    } else {
                        chunk += char;
                    }
                }
                line = chunk;
            } else {
                line = word;
            }
        }

        if (line.length > 0) lines.push(line);
        return lines;
    }
}
