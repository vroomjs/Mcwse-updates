import BlockSand from "./BlockSand.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import Block from "../Block.js";

export default class BlockGravel extends BlockSand {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../gravel.png";
        this.sound = Block.sounds.gravel;
    }

    getRenderType() {
        return BlockRenderType.MINERAL;
    }

}

