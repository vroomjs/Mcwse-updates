import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockBarrier extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../techstuff.png";
        this.textureIndex = 16;
        this.cols = 17;
        this.name = "Barrier";
        this.hardness = -1.0; // Unbreakable in survival
    }

    getRenderType() {
        return BlockRenderType.BARRIER;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    getCollisionBoundingBox(world, x, y, z) {
        return this.boundingBox;
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: this.textureIndex, cols: 17 };
    }

    // Only have a selection box if the player is holding a barrier
    getBoundingBox(world, x, y, z) {
        if (world && world.minecraft.player) {
            const held = world.minecraft.player.inventory.getItemInSelectedSlot();
            if (held === this.id) return this.boundingBox;
        }
        return null;
    }

    shouldRenderFace(world, x, y, z, face) {
        // Never cull neighbors by barrier blocks
        return true;
    }
}