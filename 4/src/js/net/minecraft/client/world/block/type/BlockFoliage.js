import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";
import { BlockRegistry } from "../BlockRegistry.js";

export default class BlockFoliage extends Block {
    constructor(id, textureName, textureIndex = 0) {
        super(id, 0); // textureSlotId is not used
        this.textureName = textureName;
        this.textureIndex = textureIndex;
        this.sound = Block.sounds.grass;
    }

    getColor(world, x, y, z, face) {
        // Inventory items color logic
        if (world === null) {
            // Only tint specific greenery IDs: Grass (31), Fern (32), Vines (106), Lily Pad (567)
            if ([31, 32, 106, 567].includes(this.id)) {
                return 0x72ad62;
            }
            // Flowers should be their natural color (white multiplier)
            return 0xFFFFFF;
        }

        // Check if this is a flower block (don't tint flowers in-world either)
        // IDs: Dandelion(37), Rose/Poppy(38), Tulips(175,176,206), Azure(177), Allium(178), Lily(207), Cobweb(571), Sweet Berry Bush(574)
        if ([37, 38, 175, 176, 206, 177, 178, 207, 571, 574].includes(this.id)) {
            return 0xFFFFFF;
        }

        // Check block below for snowy coloring (ID 60 is BlockSnowyGrass)
        if (world) {
            const belowId = world.getBlockAt(x, y - 1, z);
            if (BlockRegistry.SNOWY_GRASS && belowId === BlockRegistry.SNOWY_GRASS.getId()) {
                // Use a light, slightly blue-tinted color for snowy foliage
                return 0xddeeff; // Light blue/white
            }
        }

        let temperature = world.getTemperature(x, y, z);
        let humidity = world.getHumidity(x, y, z);
        let biomeColor = world.minecraft.grassColorizer.getColor(temperature, humidity);

        // Global color overrides
        const mode = world.minecraft.settings.foliageColorMode;
        let tintColor = biomeColor;
        if (mode === 'orange') tintColor = 0xd67d28;
        else if (mode === 'murky') tintColor = 0x4d5d2e;
        else if (mode === 'birch') tintColor = 0x88bb67;

        // Apply intensity blend
        const intensity = world.minecraft.settings.foliageColorIntensity / 100.0;
        
        let rB = (biomeColor >> 16) & 255, gB = (biomeColor >> 8) & 255, bB = biomeColor & 255;
        let rT = (tintColor >> 16) & 255, gT = (tintColor >> 8) & 255, bT = tintColor & 255;
        
        let r = Math.floor(rB + (rT - rB) * intensity);
        let g = Math.floor(gB + (gT - gB) * intensity);
        let b = Math.floor(bB + (bT - bB) * intensity);
        
        // Darken by 8% (0.92 multiplier)
        r = Math.floor(r * 0.92);
        g = Math.floor(g * 0.92);
        b = Math.floor(b * 0.92);
        
        return (r << 16) | (g << 8) | b;
    }

    getRenderType() {
        if (this.id === 565) return BlockRenderType.CROSS; // Iron Bars
        return BlockRenderType.CROSS;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    // Allow interaction so right/left clicks can hit/activate them
    canInteract() {
        return true;
    }

    /**
     * Provide a small, non-full collision box so foliage can be targeted and broken.
     * Returning null prevented ray-trace detection; a thin 0.8x0.8x0.8 box centered on the block works well.
     */
    getBoundingBox(world, x, y, z) {
        // Small volume to represent the plant; no full-block collision but hittable.
        return new BoundingBox(0.1, 0.0, 0.1, 0.9, 0.8, 0.9);
    }

    // Ensure the engine can pick up a collision box when needed
    getCollisionBoundingBox(world, x, y, z) {
        // Foliage should not provide a physical collision box — allow ray-targeting via getBoundingBox()
        // but return null here so entities and movement are not blocked by foliage.
        return null;
    }

    canPlaceBlockAt(world, x, y, z) {
        if (this.id === 565) return true; // Iron Bars can be placed anywhere
        let below = world.getBlockAt(x, y - 1, z);
        // Grass (2), Dirt (3), Snowy Grass (60)
        return below === 2 || below === 3 || below === 60;
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        if (this.id === 565) return; // Iron Bars don't need support
        if (!this.canPlaceBlockAt(world, x, y, z)) {
            // Use breakBlock to ensure item drop and particles when the ground is removed
            if (world.minecraft) {
                world.minecraft.breakBlock(x, y, z, null, true);
            } else {
                world.setBlockAt(x, y, z, 0);
            }
        }
    }
}