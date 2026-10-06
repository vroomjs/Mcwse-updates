import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockBirchPlanks extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../birch_planks.png";
        this.sound = Block.sounds.wood;
    }

    getRenderType() {
        return BlockRenderType.BLOCK; // Standard block render type will pick up textureName
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName };
    }
}

