import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockPortal extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../nether_portal.png";
        this.sound = Block.sounds.glass;
    }

    getRenderType() {
        return BlockRenderType.NETHER_PORTAL;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }
    
    isTranslucent() {
        return true;
    }

    getCollisionBoundingBox(world, x, y, z) {
        return null;
    }

    shouldRenderFace(world, x, y, z, face) {
        let typeId = world.getBlockAtFace(x, y, z, face);
        if (typeId === this.id) return false;
        
        let neighbor = Block.getById(typeId);
        if (neighbor && neighbor.isSolid()) return false;
        
        return true;
    }
    
    getLightValue(world, x, y, z) {
        return 11;
    }
}

