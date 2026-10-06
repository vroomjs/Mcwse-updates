import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockNether extends Block {
    constructor(id, textureIndex, lightValue = 0) {
        super(id, 0);
        this.textureName = "../../nether.png";
        this.textureIndex = textureIndex;
        this.sound = Block.sounds.stone;
        this.lightValue = lightValue;
    }

    getRenderType() {
        return BlockRenderType.NETHER;
    }

    getLightValue(world, x, y, z) {
        return this.lightValue;
    }
}

