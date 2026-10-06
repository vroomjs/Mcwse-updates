import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockMagma extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../magma3sheet.png";
        this.sound = Block.sounds.stone;
    }

    getRenderType() {
        return BlockRenderType.MINERAL;
    }

    getLightValue(world, x, y, z) {
        return 4;
    }

    onUpdate() {
        // Magma blocks traditionally cause burn damage, but we'll stick to visual/light for now
    }
}