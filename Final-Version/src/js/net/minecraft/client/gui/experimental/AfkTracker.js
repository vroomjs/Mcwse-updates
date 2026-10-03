import ExpRouter from "./ExpRouter.js";

/**
 * Idle detection behind the sleep-mode screen.
 *
 * The game had no notion of AFK, so this listens for real input on the window
 * and raises GuiExpSleepMode once the player has been quiet past the
 * threshold. It is deliberately self-contained — it owns its listeners and its
 * own 1s interval — so no hot loop had to be touched to support it.
 *
 * Only runs while the Experimental UI is on and sleep mode is enabled.
 */
export default class AfkTracker {

    static EVENTS = ["mousedown", "mousemove", "wheel", "keydown", "touchstart"];

    constructor(minecraft) {
        this.minecraft = minecraft;
        this.last = Date.now();
        this.sleeping = false;
        this._onInput = () => this.reset();
        for (const e of AfkTracker.EVENTS) {
            window.addEventListener(e, this._onInput, { passive: true });
        }
        this.timer = setInterval(() => this.check(), 1000);
    }

    reset() {
        // While the sleep screen is up, moving the mouse should not silently
        // reset the clock behind it; the player must dismiss it explicitly.
        if (this.sleeping) return;
        this.last = Date.now();
    }

    /** Called when the player dismisses the sleep screen. */
    wake() {
        this.sleeping = false;
        this.last = Date.now();
    }

    thresholdMs() {
        const m = Number(this.minecraft.settings?.afkMinutes);
        return (Number.isFinite(m) && m > 0 ? m : 5) * 60000;
    }

    idleMinutes() { return (Date.now() - this.last) / 60000; }

    enabled() {
        const s = this.minecraft.settings;
        return !!(s && s.afkSleepMode) && ExpRouter.enabled(this.minecraft);
    }

    check() {
        const mc = this.minecraft;
        if (this.sleeping) return;

        if (!this.enabled() || !mc.world || mc.currentScreen) {
            // Any open screen means the player is present, so keep the clock
            // fresh rather than firing the moment they close an inventory.
            this.last = Date.now();
            return;
        }

        if (Date.now() - this.last < this.thresholdMs()) return;

        this.sleeping = true;
        import("./GuiExpSleepMode.js").then(m => {
            // Re-check: the player may have acted while the import resolved.
            if (!this.sleeping || mc.currentScreen || !mc.world) { this.sleeping = false; return; }
            mc.displayScreen(new m.default(this.idleMinutes()));
        }).catch(err => {
            console.warn("Could not open sleep mode screen:", err);
            this.sleeping = false;
        });
    }

    dispose() {
        clearInterval(this.timer);
        for (const e of AfkTracker.EVENTS) window.removeEventListener(e, this._onInput);
    }
}
