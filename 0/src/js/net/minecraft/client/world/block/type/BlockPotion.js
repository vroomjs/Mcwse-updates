import BlockItem from "./BlockItem.js";

export default class BlockPotion extends BlockItem {
    constructor(id, textureIndex, name, isSplash = false) {
        super(id, "../../bottles.png", textureIndex);
        this.isPotion = true;
        this.name = name;
        this.isSplash = isSplash;
        this.setMaxStackSize(isSplash ? 1 : 1); // Potions usually don't stack
        this.cols = 3;
        
        if (isSplash) {
            this.isThrowable = true;
            this.onThrowCommand = "splash"; // Generic splash effect
        } else {
            // Potions with effects are drinkable (treated like food with 0 hunger)
            this.isFood = (id !== 550); 
            this.isDrinkable = (id !== 550);
            this.hungerValue = 0;
        }

        // Apply enchantment glint to all non-empty bottles, excluding basic water and splash bottles
        if (id > 552) {
            this.isEnchanted = true;
        }
    }

    onItemUse(world, x, y, z, face, player) {
        // Glass Bottle (ID 550) logic to fill from water
        if (this.id === 550) {
            let hit = player.rayTrace(5, 1.0, true); // stopOnLiquid = true
            if (hit) {
                let blockId = world.getBlockAt(hit.x, hit.y, hit.z);
                if (blockId === 9 || blockId === 8) { // Water
                    if (player.gameMode !== 1) {
                        player.inventory.consumeItem(this.id);
                        player.inventory.addItem(551, 1); // Water Bottle
                    }
                    world.minecraft.soundManager.playSound("bucket.fill_water", player.x, player.y, player.z, 1.0, 1.0);
                    player.swingArm();
                    return true;
                }
            }
        }
        return super.onItemUse(world, x, y, z, face, player);
    }
}