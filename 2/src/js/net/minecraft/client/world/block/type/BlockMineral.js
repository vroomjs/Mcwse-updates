import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockMineral extends Block {

    constructor(id, textureName, textureIndex = 0) {
        super(id, 0);
        this.textureName = textureName;
        this.textureIndex = textureIndex;
        this.sound = Block.sounds.stone;
    }

    getRenderType() {
        return BlockRenderType.MINERAL;
    }

}

