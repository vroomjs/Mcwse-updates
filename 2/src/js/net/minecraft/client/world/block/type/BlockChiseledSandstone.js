import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockChiseledSandstone extends Block {
    constructor(id) {
        super(id, 0);
        this.sound = Block.sounds.stone;
        this.textureName = "../../sandstuff.png";
        this.textureIndex = 4;
    }

    getRenderType() {
        return BlockRenderType.BLOCK;
    }

    getTextureForFace(face) {
        if (face === EnumBlockFace.TOP) return { type: 'custom', name: '../../sandstuff.png', index: 2, cols: 10 };
        if (face === EnumBlockFace.BOTTOM) return { type: 'custom', name: '../../sandstuff.png', index: 5, cols: 10 };
        return { type: 'custom', name: this.textureName, index: this.textureIndex, cols: 10 };
    }
}
