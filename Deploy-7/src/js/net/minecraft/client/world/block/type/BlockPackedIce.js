import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockPackedIce extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../packedice.png";
        this.sound = Block.sounds.glass;
    }
    getRenderType() { return BlockRenderType.MINERAL; }

    shouldRenderFace(world, x, y, z, face) {
        let typeId = world.getBlockAtFace(x, y, z, face);
        
        // Cull against self
        if (typeId === this.id) return false;
        
        // Default behavior
        if (typeId === 0) return true;
        let neighbor = Block.getById(typeId);
        return neighbor && !neighbor.isSolid();
    }
}

