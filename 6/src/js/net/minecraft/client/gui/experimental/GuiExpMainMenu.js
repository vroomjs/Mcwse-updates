import GuiScreen from "../GuiScreen.js";
import GuiToggleSwitch from "../widgets/GuiToggleSwitch.js";
import GuiExpButton from "./GuiExpButton.js";
import ExpTheme from "./ExpTheme.js";
import ExpRouter from "./ExpRouter.js";

/**
 * Experimental main menu: logo top-left, a left-aligned button column over a
 * darkened side panel, the preview switch bottom-left and version info
 * bottom-right.
 *
 * Navigation targets are pulled in with dynamic import inside the callbacks,
 * matching the pattern the rest of the codebase uses, so this module never
 * participates in the import cycle back through Minecraft.js.
 */
export default class GuiExpMainMenu extends GuiScreen {

    static ENTRIES = ["Play", "Servers", "Settings", "Mods", "Accessibility"];

    constructor() {
        super();
        this.isExperimental = true;
    }

    /** Panel and button geometry, derived so it holds at any logical size. */
    layout() {
        const W = this.width, H = this.height;
        const panelW = Math.round(Math.max(150, Math.min(W * 0.42, 280)));
        const btnX = Math.max(8, Math.round(W * 0.055));
        const btnW = Math.max(90, Math.min(panelW - btnX * 2, Math.round(W * 0.30)));
        const btnH = H < 260 ? 18 : 20;
        const gap = H < 260 ? 4 : 6;
        const n = GuiExpMainMenu.ENTRIES.length;
        const block = n * btnH + (n - 1) * gap;

        // Keep the column clear of the logo above and the switch below.
        const logoH = Math.round(Math.min(64, H * 0.22));
        const topLimit = 12 + logoH + 10;
        const botLimit = H - 30;
        let top = Math.round(H * 0.5 - block * 0.42);
        top = Math.max(topLimit, Math.min(top, botLimit - block));
        return { panelW, btnX, btnW, btnH, gap, top, logoH, block };
    }

    init() {
        super.init();
        this.textureLogo = this.getTexture("../../minecraftwebsimedition.png");
        const L = this.layout();
        const settings = this.minecraft.settings;

        const open = (factory) => factory();
        const actions = {
            "Play": () => import("./GuiExpWorlds.js").then(m =>
                this.minecraft.displayScreen(new m.default(this, "singleplayer"))),
            "Servers": () => import("./GuiExpWorlds.js").then(m =>
                this.minecraft.displayScreen(new m.default(this, "servers"))),
            "Settings": () => import("./GuiExpSettings.js").then(m =>
                this.minecraft.displayScreen(new m.default(this))),
            "Mods": () => ExpRouter.notAvailable(this.minecraft, "Mods"),
            "Accessibility": () => ExpRouter.notAvailable(this.minecraft, "Accessibility")
        };

        GuiExpMainMenu.ENTRIES.forEach((label, i) => {
            this.buttonList.push(new GuiExpButton(label, L.btnX, L.top + i * (L.btnH + L.gap),
                L.btnW, L.btnH, () => open(actions[label]), { variant: "light" }));
        });

        // The switch lives here too, so the Experimental UI can always be
        // switched back off from inside itself.
        const label = "MCWSE Preview";
        const swW = GuiToggleSwitch.widthFor(this.minecraft, label);
        this.buttonList.push(new GuiToggleSwitch(label, L.btnX, this.height - 24, swW,
            () => !!settings.mcwsePreview,
            (next) => {
                settings.mcwsePreview = next;
                settings.save();
                // Leaving preview mode hands control straight back to the
                // classic menu rather than stranding the player here.
                if (!next) import("../screens/GuiMainMenu.js").then(m =>
                    this.minecraft.displayScreen(new m.default()));
            }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        const L = this.layout();
        this.drawDefaultBackground(stack);
        ExpTheme.sidePanel(this, stack, this.width, this.height, L.panelW);

        // Logo, top-left, scaled to the panel.
        if (this.textureLogo && this.textureLogo.width > 1) {
            const w = Math.min(L.panelW - L.btnX * 2 + 40, Math.round(this.width * 0.33));
            const h = (this.textureLogo.height / this.textureLogo.width) * w;
            this.drawSprite(stack, this.textureLogo, 0, 0,
                this.textureLogo.width, this.textureLogo.height,
                L.btnX, Math.max(6, Math.round(this.height * 0.08)), w, h);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);

        // Version block, bottom-right, two lines as in the reference.
        const lines = ["Experimental UI", "Minecraft Websim Edition - 1.01"];
        lines.forEach((s, i) => {
            const w = this.getStringWidth(stack, s);
            this.drawString(stack, s, this.width - w - 4,
                this.height - 20 + i * 10, ExpTheme.T.version);
        });
    }
}
