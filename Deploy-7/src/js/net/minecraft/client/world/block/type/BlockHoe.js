import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import { BlockRegistry } from "../BlockRegistry.js";

export default class BlockHoe extends Block {

    constructor(id, textureName, textureIndex = 0) {
        super(id, 0);
        this.textureName = textureName;
        this.textureIndex = textureIndex;
    }

    getRenderType() {
        return BlockRenderType.ITEM;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    canPlaceBlockAt(world, x, y, z) {
        return false;
    }

    onItemUse(world, x, y, z, face, player) {
        // Only trigger if clicking top face (optional, but standard for hoes)
        // Actually vanilla allows clicking side too if target is valid.
        
        let typeId = world.getBlockAt(x, y, z);
        
        // Dirt (3) or Grass (2)
        if (typeId === 2 || typeId === 3) {
            // Must have air above
            if (world.getBlockAt(x, y + 1, z) !== 0) return false;

            // Convert to Farmland
            world.setBlockAt(x, y, z, BlockRegistry.FARMLAND.getId());
            
            world.minecraft.achievementManager.grant('timetofarm');

            // Sound - Tilling sound
            world.minecraft.soundManager.playSound("hoe.till", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
            
            // Swing arm
            player.swingArm();
            
            // Return true to indicate item was used (will trigger damage logic in Minecraft.js)
            return true;
        }
        return false;
    }
}

