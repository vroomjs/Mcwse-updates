import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockCarpet extends Block {
    constructor(id, textureIndex) {
        super(id, 0);
        this.textureName = "../../wools.png";
        this.textureIndex = textureIndex;
        this.cols = 15; // Wools sheet has 15-16 columns
        this.sound = Block.sounds.cloth;
    }

    getRenderType() {
        return BlockRenderType.CARPET;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: this.textureIndex, cols: 15 };
    }

    getBoundingBox(world, x, y, z) {
        return new BoundingBox(0.0, 0.0, 0.0, 1.0, 0.0625, 1.0);
    }

    getCollisionBoundingBox(world, x, y, z) {
        return this.getBoundingBox(world, x, y, z);
    }

    canPlaceBlockAt(world, x, y, z) {
        let belowId = world.getBlockAt(x, y - 1, z);
        let block = Block.getById(belowId);
        return block && block.isSolid();
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        if (!this.canPlaceBlockAt(world, x, y, z)) {
            world.setBlockAt(x, y, z, 0);
        }
    }
}