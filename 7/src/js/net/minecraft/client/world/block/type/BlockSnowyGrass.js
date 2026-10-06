import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import { BlockRegistry } from "../BlockRegistry.js";

export default class BlockSnowyGrass extends Block {
    constructor(id) {
        super(id, 0);
        this.sound = Block.sounds.grass;
    }
    getRenderType() { return BlockRenderType.SNOWY_GRASS; }

    onBlockActivated(world, x, y, z, player) {
        let item = player.inventory.getItemInSelectedSlot();
        if (item === BlockRegistry.BONE_MEAL.getId()) {
            // Use Bonemeal
            if (player.gameMode !== 1) {
                player.inventory.consumeItem(item);
            }
            player.swingArm();
            
            // Grow foliage in radius
            let radius = 6;
            let chance = 0.6; // Slightly lower chance than normal grass

            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        let tx = x + dx;
                        let ty = y + dy;
                        let tz = z + dz;

                        if (world.getBlockAt(tx, ty, tz) === this.id && world.getBlockAt(tx, ty + 1, tz) === 0) {
                            if (world.random.nextFloat() < chance) {
                                // Only spawn grass (FOLIAGE) or ferns (FERN)
                                let plantType = BlockRegistry.FOLIAGE.getId(); 
                                if (world.random.nextFloat() < 0.25) plantType = BlockRegistry.FERN.getId();
                                
                                world.setBlockAt(tx, ty + 1, tz, plantType);
                            }
                        }
                    }
                }
            }
            
            // Play sound
            world.minecraft.soundManager.playSound("item.bonemeal", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
            
            return true;
        }
        return false;
    }
}

