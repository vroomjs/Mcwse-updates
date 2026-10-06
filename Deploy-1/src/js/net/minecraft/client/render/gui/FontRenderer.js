import Gui from "../../gui/Gui.js";
import MathHelper from "../../../util/MathHelper.js";

export default class FontRenderer {

    static BITMAP_SIZE = 16;
    static FIELD_SIZE = 8;

    static COLOR_CODE_INDEX_LOOKUP = "0123456789abcdef";

    constructor(minecraft) {
        this.charWidths = [];
        this.rawWidths = []; // Store actual pixel widths to prevent quad overlap
        this.colorCache = new Map(); // Cache for tinted font textures

        this.texture = minecraft.resources["gui/font.png"];
        // Support HD fonts by calculating cell size dynamically
        this.cellWidth = Math.floor(this.texture.width / 16);

        let bitMap = this.createBitMap(this.texture);

        // Calculate character width
        for (let i = 0; i < 256; i++) {
            let w = this.calculateCharacterWidthAt(bitMap, i % 16, Math.floor(i / 16));
            this.rawWidths[i] = w;
            // Spacing: empty chars (like space) default to roughly half cell width, others are actual width + 1px gap
            this.charWidths[i] = (w === 0) ? Math.floor(this.cellWidth / 2) : w + 1;
        }
    }

    getColoredTexture(color) {
        const hexKey = color.toString(16).padStart(8, '0');
        if (this.colorCache.has(hexKey)) {
            return this.colorCache.get(hexKey);
        }

        let a = (color >> 24) & 255;
        if (a === 0 && color > 0xFFFFFF) a = 255; // Default opaque if not specified but bits used
        if (color <= 0xFFFFFF) a = 255; // Standard 24-bit color

        let r = (color >> 16) & 255;
        let g = (color >> 8) & 255;
        let b = color & 255;

        let canvas = document.createElement('canvas');
        canvas.width = this.texture.width;
        canvas.height = this.texture.height;
        let ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        ctx.drawImage(this.texture, 0, 0);
        
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        this.colorCache.set(hexKey, canvas);
        return canvas;
    }

    calculateCharacterWidthAt(bitMap, indexX, indexY) {
        const cw = this.cellWidth;
        const startX = indexX * cw;
        const endX = startX + cw;
        const startY = indexY * cw;
        const endY = startY + cw;

        // Scan the bitmap cell from right to left to find the rightmost opaque pixel
        for (let x = endX - 1; x >= startX; x--) {
            for (let y = startY; y < endY; y++) {
                let i = (x + y * this.texture.width) * 4;
                // Check alpha channel (3) primarily for transparency-based font sheets
                if (bitMap[i + 3] > 32) { 
                    return x - startX + 1;
                }
            }
        }
        return 0; // Empty/space
    }

    drawString(stack, string, x, y, color = -1, dropShadow = true) {
        if (dropShadow) {
            this.drawStringRaw(stack, string, x + 1, y + 1, color, true);
        }
        this.drawStringRaw(stack, string, x, y, color, false);
    }

    drawStringRaw(stack, string, x, y, color = -1, isShadow = false) {
        if (color === -1) color = 0xFFFFFF;

        if (isShadow) {
            let r = (color >> 16) & 255;
            let g = (color >> 8) & 255;
            let b = color & 255;
            r = Math.floor(r / 4);
            g = Math.floor(g / 4);
            b = Math.floor(b / 4);
            color = (r << 16) | (g << 8) | b;
        }

        let currentTexture = this.getColoredTexture(color);

        stack.save();

        for (let i = 0; i < string.length; i++) {
            let character = string[i];
            let code = string.charCodeAt(i);

            if ((character === '&' || character === '§') && i !== string.length - 1) {
                let nextCharacter = string[i + 1];
                let nextColor = this.getColorOfCharacter(nextCharacter);
                if (isShadow) {
                    let r = (nextColor >> 16) & 255;
                    let g = (nextColor >> 8) & 255;
                    let b = nextColor & 255;
                    r = Math.floor(r / 4);
                    g = Math.floor(g / 4);
                    b = Math.floor(b / 4);
                    nextColor = (r << 16) | (g << 8) | b;
                }
                currentTexture = this.getColoredTexture(nextColor);
                i += 1;
                continue;
            }

            if (code >= 256) code = 63; // ?

            let textureOffsetX = (code % 16) * this.cellWidth;
            let textureOffsetY = Math.floor(code / 16) * this.cellWidth;
            
            // Only draw the actual used width of the character to prevent cell bleeding
            let rawW = this.rawWidths[code];
            let displayW = Math.max(1, rawW);

            // Apply a small vertical height reduction (0.05px) to the source rectangle to prevent 
            // the bottom of the character from sampling pixels from the next row in the spritesheet.
            Gui.drawSprite(
                stack,
                currentTexture,
                textureOffsetX, textureOffsetY,
                displayW, this.cellWidth - 0.05,
                x, y, 
                displayW, this.cellWidth
            );

            // Increment x by integer width for consistent character spacing
            x += this.charWidths[code];
        }

        stack.restore();
    }

    getColorOfCharacter(character) {
        let index = FontRenderer.COLOR_CODE_INDEX_LOOKUP.indexOf(character);
        let brightness = (index & 0x8) * 8;

        // Convert index to RGB
        let b = (index & 0x1) * 191 + brightness;
        let g = ((index & 0x2) >> 1) * 191 + brightness;
        let r = ((index & 0x4) >> 2) * 191 + brightness;

        return r << 16 | g << 8 | b;
    }

    getStringWidth(string) {
        let length = 0;

        // For each character
        for (let i = 0; i < string.length; i++) {

            // Check for color code
            if (string[i] === '&' || string[i] === '§') {
                // Skip the next character
                i++;
            } else {
                // Add the width of the character
                let code = string[i].charCodeAt(0);
                length += this.charWidths[code];
            }
        }
        return length;
    }


    createBitMap(img) {
        let canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
        return canvas.getContext('2d').getImageData(0, 0, img.width, img.height).data;
    }
}