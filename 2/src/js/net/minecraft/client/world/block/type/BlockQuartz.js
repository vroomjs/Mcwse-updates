import Block from "../Block.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockQuartz extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../quartz.png";
        this.sound = Block.sounds.stone;
    }

    getTextureForFace(face) {
        if (face === EnumBlockFace.TOP) {
            return { type: 'custom', name: '../../quartz.png', index: 3, cols: 8 };
        }
        if (face === EnumBlockFace.BOTTOM) {
            return { type: 'custom', name: '../../quartz.png', index: 7, cols: 8 };
        }
        return { type: 'custom', name: '../../quartz.png', index: 6, cols: 8 };
    }
}

export class BlockChiseledQuartz extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../quartz.png";
        this.sound = Block.sounds.stone;
    }

    getTextureForFace(face) {
        if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) {
            return { type: 'custom', name: '../../quartz.png', index: 4, cols: 8 };
        }
        return { type: 'custom', name: '../../quartz.png', index: 1, cols: 8 };
    }
}

export class BlockQuartzPillar extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../quartz.png";
        this.sound = Block.sounds.stone;
    }

    getTextureForFace(face) {
        if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) {
            return { type: 'custom', name: '../../quartz.png', index: 2, cols: 8 };
        }
        return { type: 'custom', name: '../../quartz.png', index: 5, cols: 8 };
    }
}

import BlockSlab from "./BlockSlab.js";
import BlockStairs from "./BlockStairs.js";

export class BlockQuartzSlab extends BlockSlab {
    constructor(id) {
        super(id, "../../quartz.png");
    }

    getTextureForFace(face) {
        if (face === EnumBlockFace.TOP) return { type: 'custom', name: '../../quartz.png', index: 3, cols: 8 };
        if (face === EnumBlockFace.BOTTOM) return { type: 'custom', name: '../../quartz.png', index: 7, cols: 8 };
        return { type: 'custom', name: '../../quartz.png', index: 6, cols: 8 };
    }
}

export class BlockQuartzStairs extends BlockStairs {
    constructor(id) {
        super(id, "../../quartz.png");
    }

    getTextureForFace(face) {
        if (face === EnumBlockFace.TOP) return { type: 'custom', name: '../../quartz.png', index: 3, cols: 8 };
        if (face === EnumBlockFace.BOTTOM) return { type: 'custom', name: '../../quartz.png', index: 7, cols: 8 };
        return { type: 'custom', name: '../../quartz.png', index: 6, cols: 8 };
    }
}