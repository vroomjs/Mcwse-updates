import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockFire extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../fire_1.png";
        this.sound = Block.sounds.wood;
    }

    getRenderType() {
        return BlockRenderType.FIRE;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }
    
    getCollisionBoundingBox(world, x, y, z) {
        return null;
    }

    getLightValue(world, x, y, z) {
        return 15;
    }
    
    canPlaceBlockAt(world, x, y, z) {
        return true; 
    }
}

