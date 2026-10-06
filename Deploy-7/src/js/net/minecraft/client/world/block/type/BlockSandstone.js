import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockSandstone extends Block {

    constructor(id) {
        super(id, 0);
        this.sound = Block.sounds.stone;
    }

    getRenderType() {
        return BlockRenderType.BLOCK;
    }

    getTextureForFace(face) {
        if (face === EnumBlockFace.TOP) return { type: 'custom', name: '../../sandstuff.png', index: 2, cols: 10 };
        if (face === EnumBlockFace.BOTTOM) return { type: 'custom', name: '../../sandstuff.png', index: 5, cols: 10 };
        return { type: 'custom', name: '../../sandstuff.png', index: 1, cols: 10 };
    }
}

import BlockSlab from "./BlockSlab.js";
import BlockStairs from "./BlockStairs.js";

export class BlockSandstoneSlab extends BlockSlab {
    constructor(id) {
        super(id, "../../sandstuff.png", 1, 10);
    }

    getTextureForFace(face) {
        if (face === EnumBlockFace.TOP) return { type: 'custom', name: '../../sandstuff.png', index: 2, cols: 10 };
        if (face === EnumBlockFace.BOTTOM) return { type: 'custom', name: '../../sandstuff.png', index: 5, cols: 10 };
        return { type: 'custom', name: '../../sandstuff.png', index: 1, cols: 10 };
    }
}

export class BlockSandstoneStairs extends BlockStairs {
    constructor(id) {
        super(id, "../../sandstuff.png", 1, 10);
    }

    getTextureForFace(face) {
        if (face === EnumBlockFace.TOP) return { type: 'custom', name: '../../sandstuff.png', index: 2, cols: 10 };
        if (face === EnumBlockFace.BOTTOM) return { type: 'custom', name: '../../sandstuff.png', index: 5, cols: 10 };
        return { type: 'custom', name: '../../sandstuff.png', index: 1, cols: 10 };
    }
}
