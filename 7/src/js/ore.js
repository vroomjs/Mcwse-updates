import Block from "./net/minecraft/client/world/block/Block.js";
import BlockRenderType from "./net/minecraft/util/BlockRenderType.js";

export default class BlockOre extends Block {
    constructor(id, textureIndex) {
        super(id, 0); // textureSlotId not used from terrain.png
        this.textureName = "../../orestuff.png";
        this.textureIndex = textureIndex;
        this.sound = Block.sounds.stone;
    }

    getRenderType() {
        return BlockRenderType.MINERAL;
    }
}