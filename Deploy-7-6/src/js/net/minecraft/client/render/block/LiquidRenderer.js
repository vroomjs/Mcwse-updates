import EnumBlockFace from "../../../util/EnumBlockFace.js";
import BlockRenderType from "../../../util/BlockRenderType.js";
import Block from "../../world/block/Block.js";
import * as THREE from "three";

export default class LiquidRenderer {

    constructor(blockRenderer) {
        this.blockRenderer = blockRenderer;
        this.heightCache = new Map();
    }

    resetCache() {
        this.heightCache.clear();
    }

    /**
     * Helper to render sign text by drawing it into a 2D canvas and projecting it onto a mesh.
     */
    renderSignText(stack, x, y, z, lines, rotation, isWall) {
        // Optimization: Use a shared canvas for sign text generation
        if (!this.signCanvas) {
            this.signCanvas = document.createElement('canvas');
            this.signCanvas.width = 256;
            this.signCanvas.height = 128;
            this.signCtx = this.signCanvas.getContext('2d', { alpha: true });
        }
        const canvas = this.signCanvas;
        const ctx = this.signCtx;
        ctx.imageSmoothingEnabled = false;

        // Clear transparent
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Use Minecraft Font Renderer
        const fontRenderer = this.blockRenderer.worldRenderer.minecraft.fontRenderer;
        
        for (let i = 0; i < 4; i++) {
            if (lines[i]) {
                let text = lines[i];
                let width = fontRenderer.getStringWidth(text);
                // Enlarged text scale
                const scale = 3.2; 
                ctx.save();
                // Center text horizontally: (CanvasWidth - (Width * Scale)) / 2
                // Raised and updated line spacing (from 24 to 28) for better legibility
                ctx.translate(canvas.width / 2 - (width * scale) / 2, 8 + i * 28);
                ctx.scale(scale, scale);
                fontRenderer.drawString(ctx, text, 0, 0, 0x000000, false);
                ctx.restore();
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            depthWrite: false, // Prevent flickering with board mesh
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2
        });

        // Enlarged plane geometry for the text to fit the bigger sign board
        const geometry = new THREE.PlaneGeometry(0.95, 0.55);
        const mesh = new THREE.Mesh(geometry, material);

        // Position on board surface, adjusted for unified thickness (0.125)
        if (isWall) {
            // N=2 (At z=1 face, faces North), S=3 (At z=0 face, faces South), W=4 (At x=1 face, faces West), E=5 (At x=0 face, faces East)
            // Surfaces are now at offset 0.125 from block boundary
            if (rotation === 2) { mesh.position.set(x + 0.5, y + 0.5, z + 0.87); mesh.rotation.y = Math.PI; }
            else if (rotation === 3) { mesh.position.set(x + 0.5, y + 0.5, z + 0.13); mesh.rotation.y = 0; }
            else if (rotation === 4) { mesh.position.set(x + 0.87, y + 0.5, z + 0.5); mesh.rotation.y = -Math.PI / 2; }
            else { mesh.position.set(x + 0.13, y + 0.5, z + 0.5); mesh.rotation.y = Math.PI / 2; }
        } else {
            // Standing (meta 0..15)
            const angle = -(rotation * 22.5) * (Math.PI / 180);
            // Board center is at y + 0.82 (Raised to avoid stand clipping)
            mesh.position.set(x + 0.5, y + 0.82, z + 0.5);
            mesh.rotation.y = angle;
            // Nudge forward from center of post (t=0.0625)
            mesh.translateZ(0.065);
        }

        stack.add(mesh);
        return mesh;
    }

    renderLiquid(world, block, x, y, z, useLOD) {
        let tessellator = this.blockRenderer.tessellator;
        let texture = null; // Store texture ref for UV calc
        // Determine which tessellator to use based on block texture
        if (block.textureName && this.blockRenderer.textureTessellators.has(block.textureName)) {
            let customTess = this.blockRenderer.getTessellator(block.textureName);
            tessellator = customTess;
            
            // Always bind the block's specific texture (like water.png)
            if (!tessellator.material.map || tessellator.material.map.name !== block.textureName) {
                let tex = this.blockRenderer.worldRenderer.minecraft.getThreeTexture(block.textureName);
                if (tex) {
                    tex.name = block.textureName;
                    tex.magFilter = THREE.NearestFilter;
                    tex.minFilter = THREE.NearestFilter;
                    tex.wrapS = THREE.RepeatWrapping;
                    tex.wrapT = THREE.RepeatWrapping;
                    tex.flipY = false;
                    if (block.textureName.includes("water_flow")) {
                        tex.repeat.set(1, 1 / 32);
                    }
                    tessellator.bindTexture(tex);
                }
            }

            if (tessellator.material.map) {
                texture = tessellator.material.map.image;
            }
        }

        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        
        // Minimal epsilon to prevent gaps at chunk boundaries while avoiding Z-fighting
        const EPSILON = 0.0001;
        let minX = x;
        let minY = y;
        let minZ = z;
        let maxX = x + 1;
        let maxY = y + 1;
        let maxZ = z + 1;

        let minU = 0.0;
        let maxU = 1.0;
        let minV = 0.0;
        let maxV = 1.0;

        if (!block.textureName) {
            let textureIndex = block.getTextureForFace(EnumBlockFace.TOP);
            minU = (textureIndex % 14) / 14.0;
            maxU = minU + 1.0 / 14.0;
        }

        // Determine base color and opacity
        let red = 1.0, green = 1.0, blue = 1.0, alpha = 1.0;
        if (block.getId() === 9) { // Water
             // Water: Match vibrant blue tint and opacity from the reference image
             // Lightened tint to ensure texture is visible
             red = 0.2; green = 0.4; blue = 1.0;
             alpha = 0.85;
        }

        // Apply lighting brightness to liquid
        let brightness = 1.0;
        if (world) {
            brightness = world.getLightBrightness(x, y, z);
            if (brightness < 0.2) brightness = 0.2;
        }
        
        tessellator.setColor(red * brightness, green * brightness, blue * brightness, alpha);

        // Calculate corner heights
        let ySW, yNW, yNE, ySE;

        if (world) {
            ySW = this.getLiquidHeightAtVertex(world, x, y, z + 1);
            yNW = this.getLiquidHeightAtVertex(world, x, y, z);
            yNE = this.getLiquidHeightAtVertex(world, x + 1, y, z);
            ySE = this.getLiquidHeightAtVertex(world, x + 1, y, z + 1);
        } else {
             ySW = yNW = yNE = ySE = 0.875;
        }

        // Top Face
        // Render if shouldRenderFace returns true (handles self-culling and occlusion)
        if (world === null || block.shouldRenderFace(world, x, y, z, EnumBlockFace.TOP)) {
            // If realistic water is enabled, we skip rendering the top face of water blocks in the world
            // to prevent the standard blocky water texture from overlaying or Z-fighting with the shader plane.
            if (!(world !== null && block.getId() === 9 && this.blockRenderer.worldRenderer.minecraft.settings.realisticWater)) {
                // UVs for top face should match the height slope
                tessellator.addVertexWithUV(minX, minY + ySW, maxZ, minU, maxV);
                tessellator.addVertexWithUV(minX, minY + yNW, minZ, minU, minV);
                tessellator.addVertexWithUV(maxX, minY + yNE, minZ, maxU, minV);
                tessellator.addVertexWithUV(maxX, minY + ySE, maxZ, maxU, maxV);
                
                // Double side for translucent top faces so they are visible from beneath
                if (block.isTranslucent()) {
                    tessellator.addVertexWithUV(maxX, minY + ySE, maxZ, maxU, maxV);
                    tessellator.addVertexWithUV(maxX, minY + yNE, minZ, maxU, minV);
                    tessellator.addVertexWithUV(minX, minY + yNW, minZ, minU, minV);
                    tessellator.addVertexWithUV(minX, minY + ySW, maxZ, minU, maxV);
                }
            }
        }

        // Render sides
        // North (z-1)
        if (world === null || block.shouldRenderFace(world, x, y, z, EnumBlockFace.NORTH)) {
            tessellator.addVertexWithUV(minX, minY + yNW, minZ, minU, minV);
            tessellator.addVertexWithUV(minX, minY, minZ, minU, maxV);
            tessellator.addVertexWithUV(maxX, minY, minZ, maxU, maxV);
            tessellator.addVertexWithUV(maxX, minY + yNE, minZ, maxU, minV);
        }
        // South (z+1)
        if (world === null || block.shouldRenderFace(world, x, y, z, EnumBlockFace.SOUTH)) {
            tessellator.addVertexWithUV(minX, minY + ySW, maxZ, maxU, minV);
            tessellator.addVertexWithUV(maxX, minY + ySE, maxZ, minU, minV);
            tessellator.addVertexWithUV(maxX, minY, maxZ, minU, maxV);
            tessellator.addVertexWithUV(minX, minY, maxZ, maxU, maxV);
        }
        // West (x-1)
        if (world === null || block.shouldRenderFace(world, x, y, z, EnumBlockFace.WEST)) {
            tessellator.addVertexWithUV(minX, minY, maxZ, minU, maxV);
            tessellator.addVertexWithUV(minX, minY, minZ, maxU, maxV);
            tessellator.addVertexWithUV(minX, minY + yNW, minZ, maxU, minV);
            tessellator.addVertexWithUV(minX, minY + ySW, maxZ, minU, minV);
        }
        // East (x+1)
        if (world === null || block.shouldRenderFace(world, x, y, z, EnumBlockFace.EAST)) {
            tessellator.addVertexWithUV(maxX, minY + yNE, minZ, minU, minV);
            tessellator.addVertexWithUV(maxX, minY, minZ, minU, maxV);
            tessellator.addVertexWithUV(maxX, minY, maxZ, maxU, maxV);
            tessellator.addVertexWithUV(maxX, minY + ySE, maxZ, maxU, minV);
        }
        // Bottom
        if (world === null || block.shouldRenderFace(world, x, y, z, EnumBlockFace.BOTTOM)) {
            tessellator.addVertexWithUV(maxX, minY, maxZ, maxU, maxV);
            tessellator.addVertexWithUV(maxX, minY, minZ, maxU, minV);
            tessellator.addVertexWithUV(minX, minY, minZ, minU, minV);
            tessellator.addVertexWithUV(minX, minY, maxZ, minU, maxV);
        }
    }

    getLiquidHeight(meta) {
        if (meta === 0 || meta === 8) return 0.875; 
        if (meta >= 7) return 0.125;
        return (8 - meta) / 9.0;
    }

    getLiquidHeightAtVertex(world, vx, vy, vz) {
        if (!world) return 0.875;

        const key = vx + "," + vy + "," + vz;
        if (this.heightCache.has(key)) {
            return this.heightCache.get(key);
        }
        
        let totalHeight = 0;
        let count = 0;

        for (let ox = -1; ox <= 0; ox++) {
            for (let oz = -1; oz <= 0; oz++) {
                let bx = vx + ox;
                let bz = vz + oz;

                let aboveId = world.getBlockAt(bx, vy + 1, bz);
                if (aboveId === 9 || aboveId === 10) {
                    this.heightCache.set(key, 1.0);
                    return 1.0;
                }

                let id = world.getBlockAt(bx, vy, bz);
                let meta = world.getBlockDataAt(bx, vy, bz);
                let block = id !== 0 ? Block.getById(id) : null;

                const isWaterlogged = (meta & 128) !== 0;

                if (id === 9 || id === 10 || isWaterlogged) {
                    // Treat waterlogged blocks as full water sources for height calc
                    let effectiveMeta = isWaterlogged ? 0 : meta;
                    totalHeight += this.getLiquidHeight(effectiveMeta);
                    count++;
                } else if (block && (block.isSolid() || block.getRenderType() === BlockRenderType.PISTON_BASE || block.getRenderType() === BlockRenderType.PISTON_HEAD)) {
                    // Treat Piston parts as full blocks for liquid height calculation to prevent visual gaps
                    totalHeight += 1.0;
                    count++;
                }
            }
        }

        let result = 0.0;
        if (count !== 0) {
             result = totalHeight / count;
        }

        this.heightCache.set(key, result);
        return result;
    }
}


