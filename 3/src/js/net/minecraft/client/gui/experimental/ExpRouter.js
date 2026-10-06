import GuiExpMainMenu from "./GuiExpMainMenu.js";
import GuiExpPauseMenu from "./GuiExpPauseMenu.js";
import GuiExpSettings from "./GuiExpSettings.js";
import GuiExpWorlds from "./GuiExpWorlds.js";
import GuiExpSkins from "./GuiExpSkins.js";
import GuiExpCreateWorld from "./GuiExpCreateWorld.js";

/**
 * Swaps classic screens for their Experimental counterparts while the
 * "MCWSE Preview" switch is on.
 *
 * Hooked into Minecraft.displayScreen, which is the single place every screen
 * change funnels through, so no call site has to know the Experimental UI
 * exists and turning the switch off restores the classic screens immediately.
 *
 * Classic screens are matched by constructor name rather than instanceof on
 * purpose: importing them here would create a cycle back through Minecraft.js.
 * There is no build step in this project, so class names are stable.
 */
export default class ExpRouter {

    static enabled(minecraft) {
        return !!(minecraft && minecraft.settings && minecraft.settings.mcwsePreview);
    }

    static route(minecraft, screen) {
        if (!screen || screen.isExperimental) return screen;
        if (!ExpRouter.enabled(minecraft)) return screen;

        const name = screen.constructor && screen.constructor.name;
        // Classic screens store their back-target as previousScreen.
        const parent = screen.previousScreen || screen.parent || null;
        switch (name) {
            case "GuiMainMenu":    return new GuiExpMainMenu();
            case "GuiIngameMenu":  return new GuiExpPauseMenu();
            case "GuiOptions":     return new GuiExpSettings(parent);
            case "GuiSelectWorld": return new GuiExpWorlds(parent, "singleplayer");
            case "GuiMultiplayer": return new GuiExpWorlds(parent, "servers");
            case "GuiSkins":       return new GuiExpSkins(parent);
            // The classic flow puts a Create/Import chooser in front of the
            // creation screen; the Experimental one folds Import into a row,
            // so both classic entry points land on the same screen.
            case "GuiCreateWorld":       return new GuiExpCreateWorld(parent, screen.preset || null);
            case "GuiCreateWorldChoice": return new GuiExpCreateWorld(parent);
            // The remaining classic settings sub-screens are folded into the
            // Experimental settings pane, so anything that still opens one
            // lands back on the pane with that category selected.
            case "GuiPerformance":   return ExpRouter.settingsAt(parent, "Performance");
            case "GuiSoundSettings": return ExpRouter.settingsAt(parent, "Music & Sounds");
            case "GuiControls":      return ExpRouter.settingsAt(parent, "Controls");
            case "GuiChatSettings":  return ExpRouter.settingsAt(parent, "Chat Settings");
            case "GuiAccessibility": return ExpRouter.settingsAt(parent, "Accessibility Settings");
            default:               return screen;
        }
    }

    /** Experimental settings opened straight onto one category. */
    static settingsAt(parent, category) {
        const screen = new GuiExpSettings(parent);
        screen.category = category;
        return screen;
    }

    /**
     * The references show entries for systems this game does not have.
     * They are drawn so the layouts match, and say so plainly when used,
     * reusing the system-dialog styling rather than failing silently.
     */
    static notAvailable(minecraft, feature) {
        if (minecraft && minecraft.systemDialogs) {
            minecraft.systemDialogs.show(feature + " is not available in Minecraft Websim Edition yet.");
        }
    }
}
