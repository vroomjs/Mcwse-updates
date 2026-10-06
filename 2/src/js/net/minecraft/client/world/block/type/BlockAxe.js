import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockAxe extends Block {

    constructor(id, textureName, textureIndex = 0) {
        super(id, 0);
        this.textureName = textureName;
        this.textureIndex = textureIndex;
    }

    getRenderType() {
        return BlockRenderType.ITEM;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    canPlaceBlockAt(world, x, y, z) {
        return false;
    }
}

