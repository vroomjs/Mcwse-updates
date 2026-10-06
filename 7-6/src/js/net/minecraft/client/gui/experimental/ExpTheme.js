/**
 * Shared palette and drawing primitives for the Experimental UI.
 *
 * Every colour here was sampled straight out of the reference screenshots
 * rather than eyeballed. The references turned out to use one consistent
 * palette across all six screens, and it is the same palette as the
 * GuiToggleSwitch: #48494A surfaces, #1C211B outlines, #4F8236 green,
 * #D0D2D4 / #EAEDF0 for light elements.
 *
 * Methods take the calling Gui so they can reuse its drawRect/drawString.
 * Remember the split in that API: drawRect wants CSS colour strings,
 * drawString wants numbers.
 */
export default class ExpTheme {

    static C = {
        border:      "#1C211B",
        surface:     "#48494A",
        surfaceHi:   "#5C5D5E",
        surfaceLo:   "#3A3B3C",
        surfaceEdge: "#5E5F60",
        chip:        "#6D6D6D",
        chipHi:      "#7E7E7E",
        green:       "#4F8236",
        greenHi:     "#5E9641",
        greenLight:  "#739F5F",
        greenDark:   "#3C5E2B",
        light:       "#D0D2D4",
        lightHi:     "#EAEDF0",
        lightLo:     "#B9BBBD",
        lightDark:   "#57595B",
        tabBar:      "#080E18",
        backdrop:    "#131313",
        badgeSurvival: "#4F8335",
        badgeCreative: "#A5813B",
        badgeHardcore: "#AE3028",
        online:      "#4F8335",
        offline:     "#AE3028"
    };

    // Text colours are numeric: FontRenderer takes ints, not CSS strings.
    static T = {
        white:   0xFFFFFF,
        dark:    0x1F2123,
        muted:   0x7D7D7D,
        version: 0xA19663,
        yellow:  0xFFFF55,
        red:     0xFF5555
    };

    static M = {
        btnH:   20,
        gap:    5,
        pad:    8,
        rowH:   22,
        tabH:   20
    };

    /** Dark surface plate: the workhorse of the pause, settings and world UIs. */
    static plate(gui, stack, x, y, w, h, opt = {}) {
        const C = ExpTheme.C;
        if (w <= 2 || h <= 2) return;
        const sel = opt.selected, dis = opt.disabled, hov = opt.hover && !dis;
        const body  = sel ? (hov ? C.greenHi : C.green) : (dis ? C.surfaceLo : (hov ? C.surfaceHi : C.surface));
        const light = sel ? C.greenLight : C.surfaceEdge;
        const dark  = sel ? C.greenDark  : C.surfaceLo;
        gui.drawRect(stack, x, y, x + w, y + h, C.border);
        gui.drawRect(stack, x + 1, y + 1, x + w - 1, y + h - 1, body);
        gui.drawRect(stack, x + 1, y + 1, x + w - 1, y + 2, light);
        gui.drawRect(stack, x + 1, y + 1, x + 2, y + h - 1, light);
        gui.drawRect(stack, x + 1, y + h - 2, x + w - 1, y + h - 1, dark);
        gui.drawRect(stack, x + w - 2, y + 1, x + w - 1, y + h - 1, dark);
    }

    /** Light plate: the main-menu buttons, which invert the scheme. */
    static lightPlate(gui, stack, x, y, w, h, opt = {}) {
        const C = ExpTheme.C;
        if (w <= 2 || h <= 2) return;
        const hov = opt.hover && !opt.disabled;
        gui.drawRect(stack, x, y, x + w, y + h, C.border);
        gui.drawRect(stack, x + 1, y + 1, x + w - 1, y + h - 1, opt.disabled ? C.lightLo : (hov ? C.lightHi : C.light));
        gui.drawRect(stack, x + 1, y + 1, x + w - 1, y + 2, C.lightHi);
        gui.drawRect(stack, x + 1, y + 1, x + 2, y + h - 1, C.lightHi);
        gui.drawRect(stack, x + 1, y + h - 2, x + w - 1, y + h - 1, C.lightDark);
        gui.drawRect(stack, x + w - 2, y + 1, x + w - 1, y + h - 1, C.lightDark);
    }

    /** Lighter inset chip, used for option values on the settings screen. */
    static chip(gui, stack, x, y, w, h, opt = {}) {
        const C = ExpTheme.C;
        if (w <= 2 || h <= 2) return;
        gui.drawRect(stack, x, y, x + w, y + h, C.border);
        gui.drawRect(stack, x + 1, y + 1, x + w - 1, y + h - 1, opt.hover ? C.chipHi : C.chip);
        gui.drawRect(stack, x + 1, y + 1, x + w - 1, y + 2, "#8A8A8A");
        gui.drawRect(stack, x + 1, y + h - 2, x + w - 1, y + h - 1, C.surfaceLo);
    }

    /** Full-screen scrim. The references dim the world heavily behind menus. */
    static dim(gui, stack, w, h, alpha = 0.72) {
        gui.drawRect(stack, 0, 0, w, h, "#000000", alpha);
    }

    /**
     * The main menu's left panel: a solid block that fades out across its
     * right edge so the backdrop shows through, as in the reference.
     */
    static sidePanel(gui, stack, w, h, panelW) {
        const solid = Math.max(0, panelW - 28);
        gui.drawRect(stack, 0, 0, solid, h, "#101010", 0.82);
        for (let i = 0; i < 28; i++) {
            const a = 0.82 * (1 - i / 28);
            gui.drawRect(stack, solid + i, 0, solid + i + 1, h, "#101010", a);
        }
    }

    /** Small coloured badge with a label, e.g. the world cards' game mode. */
    static badge(gui, stack, x, y, label, color) {
        const w = gui.getStringWidth(stack, label) + 6;
        gui.drawRect(stack, x, y, x + w, y + 11, color);
        gui.drawStringNoShadow(stack, label, x + 3, y + 2, ExpTheme.T.white);
        return w;
    }

    /** Magnifying glass for search fields, drawn from rects (no texture). */
    static magnifier(gui, stack, x, y, color = "#FFFFFF") {
        gui.drawRect(stack, x + 1, y,     x + 6, y + 1, color);
        gui.drawRect(stack, x + 1, y + 6, x + 6, y + 7, color);
        gui.drawRect(stack, x,     y + 1, x + 1, y + 6, color);
        gui.drawRect(stack, x + 6, y + 1, x + 7, y + 6, color);
        gui.drawRect(stack, x + 6, y + 6, x + 9, y + 9, color);
    }

    /** Vertical scrollbar for the scrolling panes. */
    static scrollbar(gui, stack, x, y, h, scroll, contentH, viewH) {
        if (contentH <= viewH) return;
        const C = ExpTheme.C;
        gui.drawRect(stack, x, y, x + 4, y + h, "#000000", 0.45);
        const thumbH = Math.max(12, Math.round(h * viewH / contentH));
        const maxScroll = contentH - viewH;
        const t = y + Math.round((h - thumbH) * (maxScroll ? scroll / maxScroll : 0));
        gui.drawRect(stack, x, t, x + 4, t + thumbH, C.light);
        gui.drawRect(stack, x, t, x + 4, t + 1, C.lightHi);
    }

    /** Centre a single line of 8px text inside a box of height h. */
    static textY(y, h) { return y + Math.floor((h - 8) / 2) + 1; }

    /**
     * Text drawn at an integer multiple of the 8px font, via a canvas
     * transform. Used for the section headings, which the references set far
     * larger than body copy.
     *
     * This replaces the old "draw twice, 1px apart" "bold", which at 8px
     * merged adjacent glyphs into each other and made headings unreadable.
     */
    static bigText(gui, stack, text, x, y, scale, color, shadow = true) {
        stack.save();
        stack.translate(x, y);
        stack.scale(scale, scale);
        if (shadow) gui.drawString(stack, text, 0, 0, color);
        else gui.drawStringNoShadow(stack, text, 0, 0, color);
        stack.restore();
    }

    /** Pixel width of bigText at a given scale. */
    static bigWidth(gui, stack, text, scale) {
        return gui.getStringWidth(stack, text) * scale;
    }

    /**
     * Horizontal slider: a sunken track with a filled portion and a raised
     * knob. Matches the light/dark language of the rest of the kit.
     */
    static slider(gui, stack, x, y, w, h, frac, opt = {}) {
        const C = ExpTheme.C;
        if (w <= 4 || h <= 4) return;
        const f = Math.max(0, Math.min(1, frac));
        const trackY = y + Math.floor((h - 6) / 2);
        gui.drawRect(stack, x, trackY, x + w, trackY + 6, C.border);
        gui.drawRect(stack, x + 1, trackY + 1, x + w - 1, trackY + 5, C.surfaceLo);
        const fillW = Math.round((w - 2) * f);
        if (fillW > 0) {
            gui.drawRect(stack, x + 1, trackY + 1, x + 1 + fillW, trackY + 5, opt.hover ? C.greenHi : C.green);
            gui.drawRect(stack, x + 1, trackY + 1, x + 1 + fillW, trackY + 2, C.greenLight);
        }
        const kw = 6;
        const kx = x + Math.round((w - kw) * f);
        gui.drawRect(stack, kx, y + 1, kx + kw, y + h - 1, C.border);
        gui.drawRect(stack, kx + 1, y + 2, kx + kw - 1, y + h - 2, opt.hover ? C.lightHi : C.light);
        gui.drawRect(stack, kx + 1, y + 2, kx + kw - 1, y + 3, C.lightHi);
        gui.drawRect(stack, kx + 1, y + h - 3, kx + kw - 1, y + h - 2, C.lightDark);
    }
}
