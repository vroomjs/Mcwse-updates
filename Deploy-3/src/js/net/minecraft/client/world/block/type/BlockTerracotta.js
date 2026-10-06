import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockTerracotta extends Block {
    constructor(id, index) {
        super(id, 0);
        this.textureName = "../../terracottahseet.png";
        this.textureIndex = index;
        this.sound = Block.sounds.stone;
    }

    getRenderType() {
        return BlockRenderType.MINERAL;
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: this.textureIndex, cols: 31 };
    }
}

export class BlockGlazedTerracotta extends BlockTerracotta {
    constructor(id, index) {
        super(id, index);
    }

    getRenderType() {
        return BlockRenderType.GLAZED_TERRACOTTA;
    }

    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        // Direction: 0=South, 1=West, 2=North, 3=East
        let direction = Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3;
        world.setBlockDataAt(x, y, z, direction);
    }
}