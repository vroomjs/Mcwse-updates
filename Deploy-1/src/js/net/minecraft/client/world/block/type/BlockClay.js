import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockClay extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../clay.png";
        this.sound = Block.sounds.gravel;
    }

    getRenderType() {
        return BlockRenderType.MINERAL;
    }

}

