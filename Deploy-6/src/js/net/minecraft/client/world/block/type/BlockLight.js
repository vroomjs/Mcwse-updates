import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockLight extends Block {
    constructor(id, level) {
        super(id, 0);
        this.level = level;
        this.textureName = "../../techstuff.png";
        this.textureIndex = level;
        this.cols = 17;
        this.name = "Light Block " + level;
        this.hardness = -1.0; // Unbreakable normally
    }

    getRenderType() {
        return BlockRenderType.LIGHT;
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: this.textureIndex, cols: 17 };
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    getLightValue() {
        return this.level;
    }

    // Only have a bounding box if the player is holding a light block
    getBoundingBox(world, x, y, z) {
        if (world && world.minecraft.player) {
            const held = world.minecraft.player.inventory.getItemInSelectedSlot();
            const b = Block.getById(held);
            if (b instanceof BlockLight) return this.boundingBox;
        }
        return null;
    }

    getCollisionBoundingBox() {
        return null;
    }

    shouldRenderFace(world, x, y, z, face) {
        // Never cull neighbors by light blocks
        return true;
    }

    onItemUse(world, x, y, z, face, player) {
        const targetId = world.getBlockAt(x, y, z);
        const targetBlock = Block.getById(targetId);
        const heldId = player.inventory.getItemInSelectedSlot();
        const heldBlock = Block.getById(heldId);

        // Only handle replacement if the player is clicking an existing light block while holding a light block
        if (targetBlock instanceof BlockLight && heldBlock instanceof BlockLight) {
            // "in order to remove them, place a light block 0"
            if (heldId === 800) { 
                world.setBlockAt(x, y, z, 0);
            } else {
                world.setBlockAt(x, y, z, heldId);
            }
            player.swingArm();
            return true;
        }
        // Return false to allow regular block placement adjacent to the clicked block
        return false;
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        if (!world.isSolidBlockAt(x, y - 1, z)) {
            world.setBlockAt(x, y, z, 0);
        }
    }
}