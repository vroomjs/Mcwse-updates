import GuiScreen from "../GuiScreen.js";
import GuiToggleSwitch from "../widgets/GuiToggleSwitch.js";
import GuiExpButton from "./GuiExpButton.js";
import GuiExpPauseMenu from "./GuiExpPauseMenu.js";
import ExpTheme from "./ExpTheme.js";

/**
 * The AFK screen. Raised by AfkTracker once the player has been idle past the
 * configured threshold, and reports how long that has been.
 */
export default class GuiExpSleepMode extends GuiScreen {

    constructor(minutes = 0) {
        super();
        this.isExperimental = true;
        this.minutes = minutes;
    }

    static TITLE = "You're currently in sleep mode!";

    subtitle() {
        const m = Math.max(1, Math.round(this.minutes));
        return `You've been AFK for ${m} minute${m === 1 ? "" : "s"}`;
    }

    init() {
        super.init();
        const mc = this.minecraft;
        const settings = mc.settings;
        const btnW = Math.round(Math.max(110, Math.min(this.width * 0.26, 170)));
        const btnH = this.height < 260 ? 18 : 20;
        const cx = Math.round(this.width / 2 - btnW / 2);
        const top = Math.round(this.height * 0.5) + 6;

        const asClient = !!(mc.multiplayer && mc.multiplayer.connected && !mc.multiplayer.isHosting);

        this.buttonList.push(new GuiExpButton("Back to Game", cx, top, btnW, btnH, () => {
            if (mc.afkTracker) mc.afkTracker.wake();
            mc.displayScreen(null);
        }, { bold: true }));

        this.buttonList.push(new GuiExpButton(asClient ? "Disconnect" : "Quit to Title",
            cx, top + btnH + 5, btnW, btnH,
            () => GuiExpPauseMenu.quitToTitle(mc, this, asClient), { bold: true }));

        // Bottom-right sleep-mode switch, as in the reference.
        const swW = GuiToggleSwitch.SWITCH_W;
        this.buttonList.push(new GuiToggleSwitch(null, this.width - swW - 6,
            this.height - GuiToggleSwitch.SWITCH_H - 6, swW,
            () => !!settings.afkSleepMode,
            (next) => {
                settings.afkSleepMode = next;
                settings.save();
                if (!next) {
                    if (mc.afkTracker) mc.afkTracker.wake();
                    mc.displayScreen(null);
                }
            }));
    }

    /** Any interaction here means the player is back. */
    keyTyped(key, character) {
        if (this.minecraft.afkTracker) this.minecraft.afkTracker.wake();
        if (key === "Escape") { this.minecraft.displayScreen(null); return true; }
        return super.keyTyped(key, character);
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        ExpTheme.dim(this, stack, this.width, this.height, 0.78);

        const title = GuiExpSleepMode.TITLE;
        const tw = this.getStringWidth(stack, title);
        const ty = Math.round(this.height * 0.5) - 44;
        // Double-strike to approximate the reference's heavier title.
        this.drawString(stack, title, Math.round(this.width / 2 - tw / 2), ty, ExpTheme.T.white);
        this.drawString(stack, title, Math.round(this.width / 2 - tw / 2) + 1, ty, ExpTheme.T.white);

        const sub = this.subtitle();
        const sw = this.getStringWidth(stack, sub);
        this.drawString(stack, sub, Math.round(this.width / 2 - sw / 2), ty + 16, 0xD8D8D8);

        super.drawScreen(stack, mouseX, mouseY, partialTicks);

        const label = "Sleep mode";
        const lw = this.getStringWidth(stack, label);
        this.drawString(stack, label, this.width - GuiToggleSwitch.SWITCH_W - 12 - lw,
            ExpTheme.textY(this.height - GuiToggleSwitch.SWITCH_H - 6, GuiToggleSwitch.SWITCH_H),
            ExpTheme.T.white);
    }

    doesGuiPauseGame() { return true; }
}
