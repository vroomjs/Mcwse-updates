import * as THREE from "three";

export default class ToolRenderer {

    constructor(worldRenderer) {
        this.worldRenderer = worldRenderer;
        this.pixelCanvas = document.createElement('canvas');
        this.pixelContext = this.pixelCanvas.getContext('2d', { willReadFrequently: true });
    }

    renderTool(tessellator, texture, x, y, z, scale = 1.0, zOffset = 0.0, textureIndex = -1, textureCols = 26) {
        if (!texture) return;

        const img = texture.image ? texture.image : texture;
        if (!img.width) return;

        // Determine raise for bow textures (raise slightly)
        let raiseY = 0;
        try {
            const src = img.src || (texture && texture.image && texture.image.src);
            if (src && /bow(?:pull|idle)?/i.test(src)) {
                raiseY = 0.18; // small upward offset
            }
        } catch (e) {
            // ignore
        }

        // Ensure pixel data
        let w = img.width;
        let h = img.height;

        let sx = 0;
        let sy = 0;
        let sw = w;
        let sh = h;

        if (textureIndex !== -1) {
            sw = Math.floor(w / textureCols);
            sh = h; // Assume 1 row
            sx = (textureIndex % textureCols) * sw;
            sy = Math.floor(textureIndex / textureCols) * sh;
        }

        // Detect if this tool needs to be flipped horizontally (Fishing rod faces right in texture)
        let isFlipped = false;
        try {
            const src = img.src || (texture && texture.image && texture.image.src);
            if (src && /fishing_rod/i.test(src)) {
                isFlipped = true;
            }
        } catch (e) {}
        if (this.pixelCanvas.width !== sw || this.pixelCanvas.height !== sh) {
            this.pixelCanvas.width = sw;
            this.pixelCanvas.height = sh;
        }
        this.pixelContext.clearRect(0, 0, sw, sh);
        this.pixelContext.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        const data = this.pixelContext.getImageData(0, 0, sw, sh).data;

        const px = 1.0 / sw * scale;
        const py = 1.0 / sh * scale;
        // Increase base depth slightly and apply a tiny epsilon bias so front/back faces don't leave micro-gaps
        const baseDepth = 1.0 / 16.0 * scale * 1.45;
        const MIN_DEPTH = 0.02 * scale;
        const EPS = 0.00075; // small epsilon to nudge faces and avoid gaps/z-fighting
        const depth = Math.max(baseDepth, MIN_DEPTH);
        const frontZ = z + depth + zOffset + EPS;
        const backZ = z + zOffset - EPS;

        // Helper to check if a pixel is transparent or black
        const isTransparent = (index) => {
            return data[index + 3] < 10; // Only check alpha channel
        };

        // Store original color
        const r = tessellator.red;
        const g = tessellator.green;
        const b = tessellator.blue;
        const a = tessellator.alpha;

        // Render Pixels (Front, Back and Sides)
        for (let iy = 0; iy < sh; iy++) {
            for (let ix = 0; ix < sw; ix++) {
                let i = (iy * sw + ix) * 4;
                if (isTransparent(i)) continue; // Transparent

                // UVs for this pixel
                // FIX: Inset UVs slightly to prevent texture bleeding on extruded item edges
                const uvEps = 0.002; 
                let u0 = (sx + ix + uvEps) / w;
                let u1 = (sx + ix + 1 - uvEps) / w;
                let v0 = (sy + iy + uvEps) / h;
                let v1 = (sy + iy + 1 - uvEps) / h;

                // World coordinates for this pixel (Y is inverted relative to loop)
                // If flipped, reverse the X calculation
                let X = x + (isFlipped ? (sw - 1 - ix) : ix) * px;
                // apply raiseY to lift bow slightly
                let Y = y + (sh - 1 - iy) * py + raiseY;

                // Front Face (at frontZ)
                tessellator.setColor(r, g, b, a);
                tessellator.addVertexWithUV(X, Y, frontZ, u0, v1); // BL
                tessellator.addVertexWithUV(X + px, Y, frontZ, u1, v1); // BR
                tessellator.addVertexWithUV(X + px, Y + py, frontZ, u1, v0); // TR
                tessellator.addVertexWithUV(X, Y + py, frontZ, u0, v0); // TL

                // Back Face (at z)
                tessellator.addVertexWithUV(X, Y + py, backZ, u0, v0); // TL
                tessellator.addVertexWithUV(X + px, Y + py, backZ, u1, v0); // TR
                tessellator.addVertexWithUV(X + px, Y, backZ, u1, v1); // BR
                tessellator.addVertexWithUV(X, Y, backZ, u0, v1); // BL

                // Sample center of pixel for solid color to avoid bleeding on sides
                let pixelU = (sx + ix + 0.5) / w;
                let pixelV = (sy + iy + 0.5) / h;
                
                // Left neighbor check (accounting for horizontal flip)
                let leftTransparent;
                if (isFlipped) {
                    let rightI = (iy * sw + (ix + 1)) * 4;
                    leftTransparent = (ix === sw - 1) || isTransparent(rightI);
                } else {
                    let leftI = (iy * sw + (ix - 1)) * 4;
                    leftTransparent = (ix === 0) || isTransparent(leftI);
                }

                if (leftTransparent) {
                    tessellator.setColor(r * 0.6, g * 0.6, b * 0.6, a);
                    tessellator.addVertexWithUV(X, Y, backZ, pixelU, pixelV);
                    tessellator.addVertexWithUV(X, Y, frontZ, pixelU, pixelV);
                    tessellator.addVertexWithUV(X, Y + py, frontZ, pixelU, pixelV);
                    tessellator.addVertexWithUV(X, Y + py, backZ, pixelU, pixelV);
                }
                
                // Right neighbor check (accounting for horizontal flip)
                let rightTransparent;
                if (isFlipped) {
                    let leftI = (iy * sw + (ix - 1)) * 4;
                    rightTransparent = (ix === 0) || isTransparent(leftI);
                } else {
                    let rightI = (iy * sw + (ix + 1)) * 4;
                    rightTransparent = (ix === sw - 1) || isTransparent(rightI);
                }

                if (rightTransparent) {
                    tessellator.setColor(r * 0.6, g * 0.6, b * 0.6, a);
                    let X1 = X + px;
                    tessellator.addVertexWithUV(X1, Y + py, backZ, pixelU, pixelV);
                    tessellator.addVertexWithUV(X1, Y + py, frontZ, pixelU, pixelV);
                    tessellator.addVertexWithUV(X1, Y, frontZ, pixelU, pixelV);
                    tessellator.addVertexWithUV(X1, Y, backZ, pixelU, pixelV);
                }

                // Top
                let topI = ((iy - 1) * sw + ix) * 4;
                if (iy === 0 || isTransparent(topI)) {
                    tessellator.setColor(r * 0.5, g * 0.5, b * 0.5, a);
                    let Y1 = Y + py;
                    tessellator.addVertexWithUV(X, Y1, backZ, pixelU, pixelV);
                    tessellator.addVertexWithUV(X, Y1, frontZ, pixelU, pixelV);
                    tessellator.addVertexWithUV(X + px, Y1, frontZ, pixelU, pixelV);
                    tessellator.addVertexWithUV(X + px, Y1, backZ, pixelU, pixelV);
                }

                // Bottom
                let bottomI = ((iy + 1) * sw + ix) * 4;
                if (iy === sh - 1 || isTransparent(bottomI)) {
                    tessellator.setColor(r * 0.5, g * 0.5, b * 0.5, a);
                    tessellator.addVertexWithUV(X + px, Y, backZ, pixelU, pixelV);
                    tessellator.addVertexWithUV(X + px, Y, frontZ, pixelU, pixelV);
                    tessellator.addVertexWithUV(X, Y, frontZ, pixelU, pixelV);
                    tessellator.addVertexWithUV(X, Y, backZ, pixelU, pixelV);
                }
            }
        }

        // Restore original color
        tessellator.setColor(r, g, b, a);
    }
}


