import BlockSapling from "../../../../../../../../Saplings.js";
import { BlockRegistry } from "../BlockRegistry.js";
import SpruceTreeGenerator from "../../generator/structure/SpruceTreeGenerator.js";

export default class BlockSpruceSapling extends BlockSapling {
    constructor(id) {
        super(id, 1);
    }

    onBlockAdded(world, x, y, z) {
        world.scheduleBlockUpdate(x, y, z, this.growthTime);
    }

    onBlockActivated(world, x, y, z, player) {
        let item = player.inventory.getItemInSelectedSlot();
        if (item === BlockRegistry.BONE_MEAL.getId()) {
            player.swingArm();
            if (player.gameMode !== 1) player.inventory.consumeItem(item);
            if (Math.random() < 0.25) this.growTree(world, x, y, z);
            else world.minecraft.soundManager.playSound("step.grass", x+0.5, y+0.5, z+0.5, 1.0, 1.5);
            return true;
        }
        return false;
    }

    updateTick(world, x, y, z) {
        if (!world.isHighestBlock(x, y + 1, z) && world.getTotalLightAt(x, y + 1, z) < 9) {
             world.scheduleBlockUpdate(x, y, z, 1200);
             return;
        }
        this.growTree(world, x, y, z);
    }

    growTree(world, x, y, z) {
        world.setBlockAt(x, y, z, 0);
        let generator = new SpruceTreeGenerator(world, world.seed);
        if (!generator.generateAtBlock(x, y, z)) {
            world.setBlockAt(x, y, z, this.id);
            world.scheduleBlockUpdate(x, y, z, 1200);
        }
    }
    
    canPlaceBlockAt(world, x, y, z) {
        let below = world.getBlockAt(x, y - 1, z);
        return below === BlockRegistry.GRASS.getId() || below === BlockRegistry.DIRT.getId() || below === BlockRegistry.SNOWY_GRASS.getId();
    }
}

