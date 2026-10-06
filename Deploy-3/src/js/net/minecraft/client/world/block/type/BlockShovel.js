import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import { BlockRegistry } from "../BlockRegistry.js";

export default class BlockShovel extends Block {

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
        let typeId = world.getBlockAt(x, y, z);
        // Grass (2), Dirt (3), Mycelium (110)
        if (typeId === 2 || typeId === 3 || typeId === 110) {
            // Must have air above
            if (world.getBlockAt(x, y + 1, z) !== 0) return false;

            // Convert to Grass Path
            world.setBlockAt(x, y, z, BlockRegistry.GRASS_PATH.getId());
            
            // Sound - Shovel "flattening" sound
            world.minecraft.soundManager.playSound("step.gravel", x + 0.5, y + 0.5, z + 0.5, 1.0, 0.8);
            
            // Swing arm
            player.swingArm();
            
            // Damage tool
            if (player.gameMode !== 1) {
                let slotIndex = player.inventory.selectedSlotIndex;
                let itemStack = player.inventory.items[slotIndex];
                if (itemStack && itemStack.id !== 0) {
                    itemStack.damage = (itemStack.damage || 0) + 1;
                    if (itemStack.damage >= this.maxDamage && this.maxDamage > 0) {
                        player.inventory.setItemInSelectedSlot(0);
                        world.minecraft.soundManager.playSound("random.break", player.x, player.y, player.z, 1.0, 1.0);
                    }
                }
            }

            return true;
        }
        return false;
    }
}

