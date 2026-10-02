import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";
import BlockSlab from "./BlockSlab.js";
import BlockStairs from "./BlockStairs.js";

export default class BlockCutSandstone extends Block {
    constructor(id) {
        super(id, 0);
        this.sound = Block.sounds.stone;
        this.textureName = "../../sandstuff.png";
        this.textureIndex = 3;
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

export class BlockCutSandstoneSlab extends BlockSlab {
    constructor(id) {
        super(id, "../../sandstuff.png", 3, 10);
    }

    getTextureForFace(face) {
        if (face === EnumBlockFace.TOP) return { type: 'custom', name: '../../sandstuff.png', index: 2, cols: 10 };
        if (face === EnumBlockFace.BOTTOM) return { type: 'custom', name: '../../sandstuff.png', index: 5, cols: 10 };
        return { type: 'custom', name: '../../sandstuff.png', index: 3, cols: 10 };
    }
}

export class BlockCutSandstoneStairs extends BlockStairs {
    constructor(id) {
        super(id, "../../sandstuff.png", 3, 10);
    }

    getTextureForFace(face) {
        if (face === EnumBlockFace.TOP) return { type: 'custom', name: '../../sandstuff.png', index: 2, cols: 10 };
        if (face === EnumBlockFace.BOTTOM) return { type: 'custom', name: '../../sandstuff.png', index: 5, cols: 10 };
        return { type: 'custom', name: '../../sandstuff.png', index: 3, cols: 10 };
    }
}
