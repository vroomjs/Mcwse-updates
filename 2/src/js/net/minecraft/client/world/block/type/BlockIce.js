import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockIce extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../ice.png";
        this.sound = Block.sounds.glass;
        this.hardness = 2.5; 
    }
    getRenderType() { return BlockRenderType.MINERAL; }
    
    // Set to false so neighbors render their faces against ice (fixing X-ray effect on adjacent blocks)
    isSolid() { return false; }
    
    // Restore collision box since isSolid=false removes it by default in Block.js
    getCollisionBoundingBox(world, x, y, z) {
        return this.boundingBox;
    }

    onBlockAdded(world, x, y, z) {
        // Force update neighbors to fix culling if ice is placed/removed
        world.notifyNeighborsOfStateChange(x, y, z, this.id);
    }

    getOpacity() { return 0.3; }
    
    shouldRenderFace(world, x, y, z, face) {
        let typeId = world.getBlockAtFace(x, y, z, face);
        
        // Cull against self (so we don't see internal faces)
        if (typeId === this.id) return false;
        
        // Render against anything else (since isSolid is false, we need to be careful not to over-cull)
        // Standard behavior: render if neighbor is not opaque.
        // But since we want to see adjacent blocks through ice, we rely on THEM rendering their faces.
        // For the ice face itself, we render if neighbor is not ice.
        // Actually, if neighbor is solid (like dirt), we generally DON'T render the ice face touching it to avoid z-fighting or waste,
        // UNLESS the neighbor is also translucent.
        // However, the prompt asks to "do not face cull other objects by it". That is solved by isSolid()=false.
        // For "shouldRenderFace" (rendering the ice itself):
        
        // Default behavior: render if neighbor is air/translucent.
        if (typeId === 0) return true;
        let neighbor = Block.getById(typeId);
        return neighbor && !neighbor.isSolid();
    }
}

