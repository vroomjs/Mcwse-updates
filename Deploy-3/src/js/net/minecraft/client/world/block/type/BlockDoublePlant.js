import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";
import { BlockRegistry } from "../BlockRegistry.js";

export default class BlockDoublePlant extends Block {

    constructor(id, textureName, bottomIndex, topIndex) {
        super(id, 0);
        this.textureName = textureName;
        this.bottomIndex = bottomIndex;
        this.topIndex = topIndex;
        this.sound = Block.sounds.grass;
        this.textureIndex = bottomIndex;
    }

    getRenderType() {
        return BlockRenderType.DOUBLE_PLANT;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    canInteract() {
        return true;
    }

    getBoundingBox(world, x, y, z) {
        return new BoundingBox(0.1, 0.0, 0.1, 0.9, 1.0, 0.9);
    }

    getCollisionBoundingBox(world, x, y, z) {
        return null;
    }

    canPlaceBlockAt(world, x, y, z) {
        // Needs 2 blocks of space and grass/dirt below
        let below = world.getBlockAt(x, y - 1, z);
        let above = world.getBlockAt(x, y + 1, z);
        return (below === 2 || below === 3) && above === 0;
    }

    onBlockAdded(world, x, y, z) {
        let meta = world.getBlockDataAt(x, y, z);
        if ((meta & 8) === 0) { // If bottom
            // Check if top is already there or place it (e.g. during natural spawning)
            if (y < 127) {
                let aboveId = world.getBlockAt(x, y + 1, z);
                let aboveMeta = world.getBlockDataAt(x, y + 1, z);
                // Only place top half if there isn't already a top-half of this plant there
                if (aboveId !== this.id || (aboveMeta & 8) === 0) {
                    world.setBlockAt(x, y + 1, z, this.id, 8);
                }
            }
        }
    }

    onBlockPlaced(world, x, y, z, face) {
        // Meta 0 = Bottom, Meta 8 = Top
        world.setBlockDataAt(x, y, z, 0);
        world.setBlockAt(x, y + 1, z, this.id, 8);
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        let meta = world.getBlockDataAt(x, y, z);
        let isTop = (meta & 8) !== 0;
        let otherY = isTop ? y - 1 : y + 1;

        // Break if the other half is gone
        if (world.getBlockAt(x, otherY, z) !== this.id) {
            world.setBlockAt(x, y, z, 0);
            return;
        }

        // Check ground support for bottom part
        if (!isTop) {
            let below = world.getBlockAt(x, y - 1, z);
            if (below === 0) {
                world.setBlockAt(x, y, z, 0);
            }
        }
    }

    onDestroy(world, x, y, z) {
        // Breaking either half must remove the other half as well. Without
        // this, the upper half can remain as a stray foliage block.
        const meta = world.getBlockDataAt(x, y, z);
        const isTop = (meta & 8) !== 0;
        const otherY = isTop ? y - 1 : y + 1;
        if (world.getBlockAt(x, otherY, z) === this.id) {
            world.setBlockAt(x, otherY, z, 0);
        }
    }

    getColor(world, x, y, z, face) {
        // Inventory items color logic
        if (world === null) {
            // Only tint specific greenery IDs: Tall Grass (204), Large Fern (190)
            if ([204, 190].includes(this.id)) {
                return 0x72ad62;
            }
            // Double flowers should be their natural color: Peony (39), Rose Bush (191), Lilac (192)
            return 0xFFFFFF;
        }

        // Check if this is a flower block (don't tint double flowers in-world either)
        if ([39, 191, 192].includes(this.id)) {
            return 0xFFFFFF;
        }

        // Check block below for snowy coloring (ID 60 is BlockSnowyGrass)
        if (world) {
            const belowId = world.getBlockAt(x, y - 1, z);
            if (BlockRegistry.SNOWY_GRASS && belowId === BlockRegistry.SNOWY_GRASS.getId()) {
                return 0xddeeff; // Light blue/white for snow biome
            }
        }

        let temperature = world.getTemperature(x, y, z);
        let humidity = world.getHumidity(x, y, z);

        // Global color overrides
        if (world) {
            const mode = world.minecraft.settings.foliageColorMode;
            if (mode === 'orange') return 0xd67d28;
            if (mode === 'murky') return 0x4d5d2e;
            if (mode === 'birch') return 0x88bb67;
        }

        let color = world.minecraft.grassColorizer.getColor(temperature, humidity);

        // Darken by 8% (0.92 multiplier)
        let r = Math.floor(((color >> 16) & 255) * 0.92);
        let g = Math.floor(((color >> 8) & 255) * 0.92);
        let b = Math.floor((color & 255) * 0.92);
        return (r << 16) | (g << 8) | b;
    }
}
