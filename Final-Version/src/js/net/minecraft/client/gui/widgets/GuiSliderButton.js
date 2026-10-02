import GuiButton from "./GuiButton.js";
import MathHelper from "../../../util/MathHelper.js";

export default class GuiSliderButton extends GuiButton {

    constructor(name, value, min, max, x, y, width, height, callback, step = 1) {
        super(name, x, y, width, height, _ => callback(this.value));

        this.settingName = name;
        this.value = value;

        this.min = min;
        this.max = max;
        this.step = step;

        this.enabled = true;
        this.dragging = false;

        this.setDisplayNameBuilder((name, value) => {
            return name + ": " + value;
        })
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        if (this.isMouseOver(mouseX, mouseY)) {
            this.dragging = true;
            this.updateValueFromMouse(mouseX);
            return true;
        }
    }

    mouseDragged(mouseX, mouseY, mouseButton) {
        if (this.dragging) {
            this.updateValueFromMouse(mouseX);
        }
    }

    updateValueFromMouse(mouseX) {
        let val = this.min + (mouseX - 4 - this.x) / (this.width - 8) * (this.max - this.min);
        if (this.step > 0) {
            val = Math.round(val / this.step) * this.step;
        }
        this.value = MathHelper.clamp(val, this.min, this.max);

        this.string = this.getDisplayName(this.settingName, this.value);
        this.callback();
    }

    mouseReleased(mouseX, mouseY, mouseButton) {
        this.dragging = false;
    }

    render(stack, mouseX, mouseY, partialTicks) {
        let mouseOver = this.isMouseOver(mouseX, mouseY);
        let percent = (this.value - this.min) / (this.max - this.min);
        let offset = Math.round(percent * (this.width - 8));

        // Draw slider track (darkened button background)
        this.drawButton(stack, false, false, this.x, this.y, this.width, this.height);
        
        // Draw slider thumb (active button look)
        this.drawButton(stack, this.enabled, this.dragging || mouseOver, this.x + offset, this.y, 8, this.height);
        
        this.drawCenteredString(stack, this.string, this.x + this.width / 2, this.y + this.height / 2 - 4);
    }

    setDisplayNameBuilder(builder) {
        this.getDisplayName = builder;
        this.string = this.getDisplayName(this.settingName, this.value);
        return this;
    }
}