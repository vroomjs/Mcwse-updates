import BlockItem from "./src/js/net/minecraft/client/world/block/type/BlockItem.js";

export class BlockArmor extends BlockItem {
    constructor(id, armorType, texture, textureIndex = 0) {
        super(id, texture, textureIndex);
        this.armorType = armorType; // 0=Helmet, 1=Chestplate, 2=Leggings, 3=Boots
        this.setMaxStackSize(1);
    }

    onItemUse(world, x, y, z, face, player) {
        // Equip Armor
        let slotIndex = player.inventory.selectedSlotIndex;
        let heldStack = player.inventory.getStackInSlot(slotIndex);
        
        if (heldStack.id !== this.id) return false;

        let current = player.inventory.getArmor(this.armorType);
        
        // Preserve tag and damage when equipping
        player.inventory.setArmor(this.armorType, {
            id: this.id, 
            count: 1, 
            damage: heldStack.damage || 0, 
            tag: JSON.parse(JSON.stringify(heldStack.tag || {}))
        });
        
        // Swap logic: put old armor in hand
        if (current.id !== 0) {
            player.inventory.setStackInSlot(slotIndex, current.id, 1, current.damage || 0, current.tag || {});
        } else {
            player.inventory.setStackInSlot(slotIndex, 0, 0);
        }
        
        // Armor equip sounds
        let soundKey = "armor.equip_iron";
        if (this.id >= 314 && this.id <= 317) soundKey = "armor.equip_gold";
        if (this.id >= 310 && this.id <= 313) {
            soundKey = "armor.equip_diamond";
            world.minecraft.achievementManager.grant('covermediamonds');
        }
        if (this.id >= 306 && this.id <= 309) {
            world.minecraft.achievementManager.grant('suitup');
        }

        world.minecraft.soundManager.playSound(soundKey, player.x, player.y, player.z, 1.0, 1.0);
        return true;
    }
}

       