import BlockFoliage from "./src/js/net/minecraft/client/world/block/type/BlockFoliage.js";

import TreeGenerator from "./src/js/net/minecraft/client/world/generator/structure/TreeGenerator.js";
import BigTreeGenerator from "./src/js/net/minecraft/client/world/generator/structure/BigTreeGenerator.js";

export default class BlockSapling extends BlockFoliage {
    constructor(id, textureIndex = 0) {
        super(id, "../../treestuff.png", textureIndex);
        this.textureIndex = textureIndex;
        this.cols = 30;
        this.growthTime = 1800; // ~1.5 minutes
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: this.textureIndex, cols: this.cols };
    }

    onBlockAdded(world, x, y, z) {
        world.scheduleBlockUpdate(x, y, z, this.growthTime);
    }

    onBlockActivated(world, x, y, z, player) {
        let item = player.inventory.getItemInSelectedSlot();
        if (item === 351) { // BONE_MEAL ID
            player.swingArm();
            
            // Consume bonemeal in survival
            if (player.gameMode !== 1) {
                player.inventory.consumeItem(item);
            }

            // 15% chance to grow
            if (Math.random() < 0.15) {
                this.growTree(world, x, y, z);
            }
            // Always play bonemeal sound
            world.minecraft.soundManager.playSound("item.bonemeal", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
            return true;
        }
        return false;
    }

    updateTick(world, x, y, z) {
        // Check light level (needs light to grow)
        if (!world.isHighestBlock(x, y + 1, z) && world.getTotalLightAt(x, y + 1, z) < 9) {
             // Too dark, try again later
             world.scheduleBlockUpdate(x, y, z, 1200); // 1 minute
             return;
        }

        // Grow
        this.growTree(world, x, y, z);
    }

    growTree(world, x, y, z) {
        // Remove sapling first to allow tree generation
        world.setBlockAt(x, y, z, 0);

        let generator;
        // 10% chance for Big Tree
        if (Math.random() < 0.1) {
            generator = new BigTreeGenerator(world, world.seed);
        } else {
            generator = new TreeGenerator(world, world.seed);
        }

        if (!generator.generateAtBlock(x, y, z)) {
            // Failed (obstructed), place sapling back
            world.setBlockAt(x, y, z, this.id);
            // Reschedule growth slightly later
            world.scheduleBlockUpdate(x, y, z, 1200);
        }
    }
    
    canPlaceBlockAt(world, x, y, z) {
        let below = world.getBlockAt(x, y - 1, z);
        // Grass (2), Dirt (3), Snowy Grass (60)
        return below === 2 || below === 3 || below === 60;
    }


}

