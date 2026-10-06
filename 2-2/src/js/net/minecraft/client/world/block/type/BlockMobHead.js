import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockMobHead extends Block {
    constructor(id, type = "skeleton") {
        super(id, 0);
        this.mobType = type;
        this.name = type.charAt(0).toUpperCase() + type.slice(1) + " Head";
        this.sound = Block.sounds.stone;
        // Standard mob head size is 8x8x8 pixels (0.5x0.5x0.5 blocks)
        this.boundingBox = new BoundingBox(0.25, 0.0, 0.25, 0.75, 0.5, 0.75);
    }

    getRenderType() {
        if (this.mobType === "zombie") return BlockRenderType.ZOMBIE_HEAD;
        if (this.mobType === "creeper") return BlockRenderType.CREEPER_HEAD;
        if (this.mobType === "enderman") return BlockRenderType.ENDERMAN_HEAD;
        return BlockRenderType.SKELETON_HEAD;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        // 0-15 rotation like signs for high precision placement
        let rotation = Math.floor((yaw * 16.0 / 360.0) + 0.5) & 15;
        world.setBlockDataAt(x, y, z, rotation);
    }
}