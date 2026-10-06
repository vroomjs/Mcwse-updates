import * as THREE from "three";

export default class DoorRenderer {

    constructor(blockRenderer) {
        this.blockRenderer = blockRenderer;
    }

    renderDoor(world, block, x, y, z) {
        let texture = this.blockRenderer.worldRenderer.minecraft.resources[block.textureName];
        // Fallback if full path lookup fails (try just filename)
        if (!texture && block.textureName && block.textureName.includes('/')) {
            let parts = block.textureName.split('/');
            texture = this.blockRenderer.worldRenderer.minecraft.resources[parts[parts.length - 1]];
        }
        if (!texture) return;

        let doorTessellator = this.blockRenderer.doorTessellator;

        if (!doorTessellator.material.map || doorTessellator.material.map.image !== texture) {
            let threeTexture = new THREE.CanvasTexture(texture);
            threeTexture.magFilter = THREE.NearestFilter;
            threeTexture.minFilter = THREE.NearestFilter;
            threeTexture.flipY = false; // Use standard UV coordinates
            doorTessellator.bindTexture(threeTexture);
        }

        let originalTessellator = this.blockRenderer.tessellator;
        this.blockRenderer.tessellator = doorTessellator;

        if (world === null) {
            // Render full door for item/hand (bottom + top stacked)
            this.renderDoorFragment(world, block, x, y - 0.5, z, false);
            this.renderDoorFragment(world, block, x, y + 0.5, z, true);
        } else {
            let meta = world.getBlockDataAt(x, y, z);
            let top = (meta & 8) !== 0;
            this.renderDoorFragment(world, block, x, y, z, top);
        }

        this.blockRenderer.tessellator = originalTessellator;
    }

    renderDoorFragment(world, block, x, y, z, top) {
        let tessellator = this.blockRenderer.tessellator;
        // Get Metadata
        let meta = world ? world.getBlockDataAt(x, y, z) : 0; // inventory default: closed, bottom (logic handled by params)
        let open = false;
        let dir = 0; // 0=South, 1=West, 2=North, 3=East

        if (world) {
            open = (meta & 4) !== 0;
            dir = meta & 3;
        }
        
        // Calculate effective direction for texture mapping
        let effectiveDir = dir;
        if (open) {
            effectiveDir = (effectiveDir + 1) % 4;
        }

        // Use block's bounding box logic to get geometry
        let bb = block.getBoundingBox(world, x, y, z);
        let minX = bb.minX; let maxX = bb.maxX;
        let minY = bb.minY; let maxY = bb.maxY;
        let minZ = bb.minZ; let maxZ = bb.maxZ;

        // UV Mapping for 17-column strip (@All doors.png)
        // Sprite pairs: 5/6 (Oak), 7/8 (Birch), 9/10 (Iron), 11/12 (Spruce), 13/14 (Dark Oak), 15/16 (Acacia)
        let cols = 17;
        let spriteW = 1.0 / cols;
        let baseIndex = block.textureIndex || 0;
        let currentSprite = top ? baseIndex : baseIndex + 1;

        let minU = currentSprite * spriteW;
        let maxU = minU + spriteW;
        let minV = 0.0;
        let maxV = 1.0;

        // Apply shading
        tessellator.setColor(1, 1, 1);
        if (world) {
             let brightness = world.getLightBrightness(x, y, z);
             tessellator.setColor(brightness, brightness, brightness);
        }

        // Adjust coordinates to world
        let X1 = x + minX, X2 = x + maxX;
        let Y1 = y + minY, Y2 = y + maxY;
        let Z1 = z + minZ, Z2 = z + maxZ;

        let alignedX = (maxX - minX) > (maxZ - minZ);

        // Determine if we need to flip U coordinates based on hinge position
        let flipU = false;
        if (alignedX) {
            if (effectiveDir === 2) flipU = true;
        } else {
            if (effectiveDir === 3) flipU = true;
        }
        
        let u1 = flipU ? maxU : minU;
        let u2 = flipU ? minU : maxU;

        // Use the front sprite's leftmost 2 pixels for the actual door sides.
        // Each sprite is 16 pixels wide, so keep this slice relative to the
        // current 16-pixel sprite instead of using a fraction of the full
        // 17-column sheet.
        const sideSliceU = spriteW * (2 / 16);
        const sideMinU = minU;
        const sideMaxU = minU + sideSliceU;
        let sideU = flipU ? sideMaxU : sideMinU;
        let sideU2 = flipU ? sideMinU : sideMaxU;
        
        // Top/Bottom slice UVs
        let topV = minV; 
        let topV2 = minV + 1/16.0; 
        let botV = maxV;
        let botV2 = maxV - 1/16.0;

        if (alignedX) {
            // Front (Z2) - South face
            tessellator.addVertexWithUV(X2, Y2, Z2, u2, minV);
            tessellator.addVertexWithUV(X2, Y1, Z2, u2, maxV);
            tessellator.addVertexWithUV(X1, Y1, Z2, u1, maxV);
            tessellator.addVertexWithUV(X1, Y2, Z2, u1, minV);
            
            // Back (Z1) - North face
            tessellator.addVertexWithUV(X1, Y2, Z1, u1, minV);
            tessellator.addVertexWithUV(X1, Y1, Z1, u1, maxV);
            tessellator.addVertexWithUV(X2, Y1, Z1, u2, maxV);
            tessellator.addVertexWithUV(X2, Y2, Z1, u2, minV);

            // Caps
            tessellator.addVertexWithUV(X1, Y2, Z2, sideU, minV);
            tessellator.addVertexWithUV(X1, Y1, Z2, sideU, maxV);
            tessellator.addVertexWithUV(X1, Y1, Z1, sideU2, maxV);
            tessellator.addVertexWithUV(X1, Y2, Z1, sideU2, minV);
            
            tessellator.addVertexWithUV(X2, Y2, Z1, sideU, minV);
            tessellator.addVertexWithUV(X2, Y1, Z1, sideU, maxV);
            tessellator.addVertexWithUV(X2, Y1, Z2, sideU2, maxV);
            tessellator.addVertexWithUV(X2, Y2, Z2, sideU2, minV);

            // Top/Bottom
            tessellator.addVertexWithUV(X1, Y2, Z1, u1, topV);
            tessellator.addVertexWithUV(X1, Y2, Z2, u1, topV2);
            tessellator.addVertexWithUV(X2, Y2, Z2, u2, topV2);
            tessellator.addVertexWithUV(X2, Y2, Z1, u2, topV);

            tessellator.addVertexWithUV(X1, Y1, Z1, u1, botV);
            tessellator.addVertexWithUV(X2, Y1, Z1, u2, botV);
            tessellator.addVertexWithUV(X2, Y1, Z2, u2, botV2);
            tessellator.addVertexWithUV(X1, Y1, Z2, u1, botV2);

        } else {
            // Side A (X1) - West face
            tessellator.addVertexWithUV(X1, Y2, Z2, u2, minV);
            tessellator.addVertexWithUV(X1, Y1, Z2, u2, maxV);
            tessellator.addVertexWithUV(X1, Y1, Z1, u1, maxV);
            tessellator.addVertexWithUV(X1, Y2, Z1, u1, minV);

            // Side B (X2) - East face
            tessellator.addVertexWithUV(X2, Y2, Z1, u1, minV);
            tessellator.addVertexWithUV(X2, Y1, Z1, u1, maxV);
            tessellator.addVertexWithUV(X2, Y1, Z2, u2, maxV);
            tessellator.addVertexWithUV(X2, Y2, Z2, u2, minV);

            // Caps
            tessellator.addVertexWithUV(X2, Y2, Z2, sideU, minV);
            tessellator.addVertexWithUV(X2, Y1, Z2, sideU, maxV);
            tessellator.addVertexWithUV(X1, Y1, Z2, sideU2, maxV);
            tessellator.addVertexWithUV(X1, Y2, Z2, sideU2, minV);

            tessellator.addVertexWithUV(X1, Y2, Z1, sideU, minV);
            tessellator.addVertexWithUV(X1, Y1, Z1, sideU, maxV);
            tessellator.addVertexWithUV(X2, Y1, Z1, sideU2, maxV);
            tessellator.addVertexWithUV(X2, Y2, Z1, sideU2, minV);

            // Top/Bottom
            tessellator.addVertexWithUV(X1, Y2, Z1, u1, topV);
            tessellator.addVertexWithUV(X1, Y2, Z2, u2, topV);
            tessellator.addVertexWithUV(X2, Y2, Z2, u2, topV2);
            tessellator.addVertexWithUV(X2, Y2, Z1, u1, topV2);

            tessellator.addVertexWithUV(X1, Y1, Z1, u1, botV);
            tessellator.addVertexWithUV(X2, Y1, Z1, u1, botV2);
            tessellator.addVertexWithUV(X2, Y1, Z2, u2, botV2);
            tessellator.addVertexWithUV(X1, Y1, Z2, u2, botV);
        }
    }
}
