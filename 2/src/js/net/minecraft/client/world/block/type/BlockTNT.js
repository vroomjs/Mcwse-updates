import Block from "../Block.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";
import { BlockRegistry } from "../BlockRegistry.js";
import PrimedTNT from "../../../entity/PrimedTNT.js";

export default class BlockTNT extends Block {

    constructor(id) {
        super(id, 0);
        this.sound = Block.sounds.grass; 
    }

    getTextureForFace(face) {
        // Use relative paths to project root for files in project root
        if (face === EnumBlockFace.TOP) {
            return { type: 'custom', name: '../../tnt_top.png' };
        }
        if (face === EnumBlockFace.BOTTOM) {
            return { type: 'custom', name: '../../tnt_bottom.png' };
        }
        return { type: 'custom', name: '../../tnt_side.png' };
    }

    isSolid() {
        return true;
    }
    
    // Activation logic: right click with non-activate item, or flint and steel
    onBlockActivated(world, x, y, z, player) {
        let heldId = player.inventory.getItemInSelectedSlot();
        
        // If activated with Flint and Steel (ID 259)
        if (heldId === 259) {
            this.prime(world, x, y, z);
            
            // Consume durability
            if (player.gameMode !== 1) {
                let slotIndex = player.inventory.selectedSlotIndex;
                let itemStack = player.inventory.items[slotIndex];
                let toolBlock = Block.getById(heldId);
                if (itemStack && toolBlock && toolBlock.maxDamage > 0) {
                    itemStack.damage = (itemStack.damage || 0) + 1;
                    if (itemStack.damage >= toolBlock.maxDamage) {
                        player.inventory.setStackInSlot(slotIndex, 0, 0);
                        world.minecraft.soundManager.playSound("random.break", player.x, player.y, player.z, 1.0, 1.0);
                    }
                }
            }
            return true;
        }
        
        return false; 
    }
    
    onNeighborBlockChange(world, x, y, z, neighborId) {
        // Activate if adjacent to fire (ID 51) or redstone power
        const isFire = neighborId === 51;
        const isPowered = world.getSavedLightValue(1, x, y, z) > 0;
        
        if (isFire || isPowered) {
            this.prime(world, x, y, z);
        }
    }

    prime(world, x, y, z) {
        // 1. Remove TNT block
        world.setBlockAt(x, y, z, 0); 
        
        world.minecraft.addMessageToChat("§eTNT Primed!");
        world.minecraft.soundManager.playSound("random.fuse", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
        
        // Spawn exploding entity
        const explodingTNT = new PrimedTNT(world.minecraft, world, x + 0.5, y, z + 0.5);
        world.addEntity(explodingTNT);
    }
}

