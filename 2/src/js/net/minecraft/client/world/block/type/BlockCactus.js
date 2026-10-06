import Block from "../Block.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockCactus extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../sandstuff.png";
        this.sound = Block.sounds.wood;
        this.name = "Cactus";
    }

    getTextureForFace(face) {
        if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) {
            return { type: 'custom', name: '../../sandstuff.png', index: 9, cols: 10 };
        }
        return { type: 'custom', name: '../../sandstuff.png', index: 8, cols: 10 };
    }

    getBoundingBox(world, x, y, z) {
        return new BoundingBox(0.0625, 0.0, 0.0625, 0.9375, 1.0, 0.9375);
    }

    getCollisionBoundingBox(world, x, y, z) {
        // Slightly smaller collision box to allow walking into the "prickly" area
        return new BoundingBox(0.0625, 0.0, 0.0625, 0.9375, 0.9375, 0.9375);
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    canPlaceBlockAt(world, x, y, z) {
        const below = world.getBlockAt(x, y - 1, z);
        // Cactus can only be placed on Sand or other Cacti
        if (below !== 12 && below !== this.id) return false;

        // Cactus cannot be adjacent to any solid opaque blocks
        const neighbors = [
            world.getBlockAt(x + 1, y, z),
            world.getBlockAt(x - 1, y, z),
            world.getBlockAt(x, y, z + 1),
            world.getBlockAt(x, y, z - 1)
        ];
        for (let id of neighbors) {
            if (id !== 0) {
                let b = Block.getById(id);
                if (b && b.isSolid() && !b.isLiquid()) return false;
            }
        }

        return true;
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        if (!this.canPlaceBlockAt(world, x, y, z)) {
            world.setBlockAt(x, y, z, 0);
            // In a fuller implementation, this would drop the item
        }
    }
}