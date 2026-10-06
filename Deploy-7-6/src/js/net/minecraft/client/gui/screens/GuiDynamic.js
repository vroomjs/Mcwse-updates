import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";

export default class GuiDynamic extends GuiScreen {

    constructor(title, layout) {
        super();
        this.title = title || "Custom UI";
        this.layout = layout || { elements: [] };
    }

    init() {
        super.init();
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Simple layout engine: stack elements vertically or use relative offsets
        let currentY = centerY - (this.layout.elements.length * 24) / 2;

        for (let i = 0; i < this.layout.elements.length; i++) {
            const el = this.layout.elements[i];
            
            // Resolve display text for this frame (don't overwrite template)
            const resolvedText = this.resolveText(el.text);

            if (el.type === "button") {
                const w = el.width || 200;
                const h = el.height || 20;
                const x = el.x !== undefined ? centerX + el.x - w/2 : centerX - w/2;
                const y = el.y !== undefined ? centerY + el.y - h/2 : currentY;
                
                let btn = new GuiButton(resolvedText, x, y, w, h, () => {
                    if (el.command) {
                        // Resolve command string every time it's clicked
                        const resolvedCmd = this.resolveText(el.command);
                        this.minecraft.commandHandler.handleMessage(resolvedCmd);
                    }
                    
                    if (el.close !== false) {
                        this.minecraft.displayScreen(null);
                    } else {
                        // Refresh UI to show updated storage values
                        this.init();
                    }
                });
                this.buttonList.push(btn);
                if (el.y === undefined) currentY += 24;
            }
        }

        // Close button always added at bottom if not explicitly hidden
        if (this.layout.showClose !== false) {
            this.buttonList.push(new GuiButton("Close", centerX - 100, this.height - 30, 200, 20, () => {
                this.minecraft.displayScreen(null);
            }));
        }
    }

    resolveText(text) {
        if (!text || typeof text !== 'string') return text;
        let final = text;
        // Resolve {storage:path}
        const matches = final.match(/\{storage:([a-zA-Z0-9.]+)\}/g);
        if (matches) {
            for (let m of matches) {
                const path = m.substring(9, m.length - 1);
                const val = this.minecraft.commandHandler.getStorageValue(path);
                final = final.replace(m, val !== undefined ? (typeof val === 'object' ? JSON.stringify(val) : val) : "?");
            }
        }
        return final;
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, this.title, this.width / 2, 20);

        // Draw labels/text from layout
        for (let el of this.layout.elements) {
            if (el.type === "text") {
                const resolvedText = this.resolveText(el.text);
                const x = el.x !== undefined ? this.width/2 + el.x : this.width/2;
                const y = el.y !== undefined ? this.height/2 + el.y : 40;
                const color = el.color !== undefined ? (typeof el.color === 'string' ? parseInt(el.color.replace('#','0x')) : el.color) : 0xFFFFFF;
                this.drawCenteredString(stack, resolvedText, x, y, color);
            }
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}