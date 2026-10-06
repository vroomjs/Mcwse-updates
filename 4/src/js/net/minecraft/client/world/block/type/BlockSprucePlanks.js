import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockSprucePlanks extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../spruceplanks.png";
        this.sound = Block.sounds.wood;
    }

    getRenderType() {
        return BlockRenderType.BLOCK;
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName };
    }
}

