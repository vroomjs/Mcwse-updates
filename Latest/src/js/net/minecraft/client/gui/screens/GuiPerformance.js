import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";

export default class GuiPerformance extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
    }

    init() {
        super.init();

        const s = this.minecraft.settings;
        const btnW = 150;
        const gap = 10;
        const centerX = this.width / 2;
        const leftX = centerX - btnW - gap / 2;
        const rightX = centerX + gap / 2;
        let y = 50;

        // Column 1: Lighting
        this.buttonList.push(new GuiSliderButton("Light Updates/Frame", s.maxLightUpdatesPerFrame, 50, 5000, leftX, y, btnW, 20, val => {
            s.maxLightUpdatesPerFrame = val;
        }, 50));

        this.buttonList.push(new GuiSliderButton("Light Budget", s.lightUpdateBudgetMs, 2, 32, leftX, y + 24, btnW, 20, val => {
            s.lightUpdateBudgetMs = val;
        }, 1).setDisplayNameBuilder((n, v) => n + ": " + v + "ms"));

        this.buttonList.push(new GuiSliderButton("Max Light Queue", s.maxLightQueueSize, 5000, 100000, leftX, y + 48, btnW, 20, val => {
            s.maxLightQueueSize = val;
        }, 5000));

        // Column 2: Chunk / World
        this.buttonList.push(new GuiSliderButton("Chunk Load Radius", s.chunkLoad, 1, 10, rightX, y, btnW, 20, val => {
            s.chunkLoad = val;
        }));

        this.buttonList.push(new GuiSliderButton("Chunk Rebuild Budget", s.chunkRebuildBudgetMs, 1, 16, rightX, y + 24, btnW, 20, val => {
            s.chunkRebuildBudgetMs = val;
        }, 1).setDisplayNameBuilder((n, v) => n + ": " + v + "ms"));

        this.buttonList.push(new GuiButton("Accessibility Settings...", rightX, y + 48, btnW, 20, () => {
            import("./GuiAccessibility.js").then(module => {
                this.minecraft.displayScreen(new module.default(this));
            });
        }));

        // Done button
        this.buttonList.push(new GuiButton("Done", centerX - 100, this.height - 40, 200, 20, () => {
            this.minecraft.settings.save();
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Performance Settings", this.width / 2, 20);
        
        const qSize = this.minecraft.world ? this.minecraft.world.lightUpdateQueue.length : 0;
        this.drawCenteredString(stack, "Current Light Queue: " + qSize, this.width / 2, this.height - 65, qSize > 1000 ? 0xFFFF55 : 0xAAAAAA);

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}