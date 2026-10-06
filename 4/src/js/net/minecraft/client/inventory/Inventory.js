import Block from "../world/block/Block.js";

export default class Inventory {

    constructor(minecraft, isCreative = false) {
        this.minecraft = minecraft;
        this.selectedSlotIndex = 0;
        this.items = new Array(36).fill(null).map(() => ({id: 0, count: 0, damage: 0, tag: {}}));
        this.armor = new Array(4).fill(null).map(() => ({id: 0, count: 0, damage: 0, tag: {}})); // 0:Helmet, 1:Chest, 2:Legs, 3:Boots
        this.offhand = {id: 0, count: 0, damage: 0, tag: {}};
    }

    getArmor(slot) {
        if (slot < 0 || slot >= 4) return {id: 0, count: 0};
        return this.armor[slot];
    }

    setArmor(slot, itemStack) {
        if (slot < 0 || slot >= 4) return;
        this.armor[slot] = itemStack;

        // Check for Iron Man achievement
        if (this.armor[0].id === 306 && this.armor[1].id === 307 && this.armor[2].id === 308 && this.armor[3].id === 309) {
            this.minecraft.achievementManager.grant('ironman');
        }
    }

    addItem(id, count, tag = {}, damage = 0) {
        // Redirect to safer stack-aware method
        const remainder = this.addItemStack({ id, count, damage: damage, tag });
        return remainder === 0;
    }

    checkPickupAchievement(id) {
        if (this.minecraft && this.minecraft.achievementManager) {
            if (id === 17 || id === 200 || id === 209 || id === 235 || id === 253) this.minecraft.achievementManager.grant('gettingwood'); // Logs
            if (id === 264) this.minecraft.achievementManager.grant('diamonds'); // Diamond
            if (id === 334) this.minecraft.achievementManager.grant('cowtipper'); // Leather
            if (id === 4) this.minecraft.achievementManager.grant('stoneage'); // Cobble
            if (id === 49) this.minecraft.achievementManager.grant('icebucket'); // Obsidian
        }
    }

    setItemInSelectedSlot(typeId) {
        if (typeId === 0) {
            this.items[this.selectedSlotIndex] = {id: 0, count: 0, damage: 0, tag: {}};
        } else {
            this.items[this.selectedSlotIndex] = {id: typeId, count: 1, damage: 0, tag: {}};
        }
    }

    getItemInSelectedSlot() {
        return this.getItemInSlot(this.selectedSlotIndex);
    }

    shiftSelectedSlot(offset) {
        if (this.selectedSlotIndex + offset < 0) {
            this.selectedSlotIndex = 9 + (this.selectedSlotIndex + offset);
        } else {
            this.selectedSlotIndex = (this.selectedSlotIndex + offset) % 9;
        }
    }

    getItemInSlot(slot) {
        if (!this.items.hasOwnProperty(slot)) return 0;
        const item = this.items[slot];
        return item && item.id ? item.id : 0;
    }

    getStackInSlot(slot) {
        if (slot === 45) return this.offhand;
        if (!this.items.hasOwnProperty(slot)) return {id: 0, count: 0, damage: 0, tag: {}};
        return this.items[slot] || {id: 0, count: 0, damage: 0, tag: {}};
    }

    setStackInSlot(slot, id, count, damage = 0, tag = {}) {
        if (slot === 45) {
            this.offhand = { id: id || 0, count: count || 0, damage: damage || 0, tag: tag || {} };
            return;
        }
        if (slot < 0 || slot >= this.items.length) return;
        this.items[slot] = {
            id: id || 0,
            count: count || 0,
            damage: damage || 0,
            tag: tag || {}
        };
    }

    /**
     * Tries to add an item stack to the inventory.
     * Returns the number of items that COULD NOT be added (remainder).
     * @param {Object} itemStack - {id, count, damage}
     * @returns {number} remaining count
     */
    addItemStack(itemStack) {
        return this.addItemStackRange(itemStack, 0, 35);
    }

    addItemStackRange(itemStack, start, end) {
        let id = itemStack.id;
        let count = itemStack.count;
        let damage = itemStack.damage || 0;
        let tag = itemStack.tag || {};

        let block = Block.getById(id);
        let maxStack = block ? block.maxStackSize : 64;

        // 1. Try to stack
        for (let i = start; i <= end; i++) {
            let slotItem = this.items[i];
            if (slotItem.id === id && slotItem.count < maxStack) {
                if ((slotItem.damage || 0) === damage && JSON.stringify(slotItem.tag || {}) === JSON.stringify(tag)) {
                    let canAdd = maxStack - slotItem.count;
                    let toAdd = Math.min(canAdd, count);
                    slotItem.count += toAdd;
                    count -= toAdd;
                    if (count <= 0) {
                        this.checkPickupAchievement(id);
                        return 0;
                    }
                }
            }
        }

        // 2. Add to new slots
        for (let i = start; i <= end; i++) {
            if (this.items[i].id === 0) {
                let toAdd = Math.min(count, maxStack);
                this.items[i] = { id: id, count: toAdd, damage: damage, tag: JSON.parse(JSON.stringify(tag)) };
                count -= toAdd;
                if (count <= 0) {
                    this.checkPickupAchievement(id);
                    return 0;
                }
            }
        }

        if (count < itemStack.count) this.checkPickupAchievement(id);
        return count;
    }

    consumeItem(id) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === id) {
                this.items[i].count--;
                if (this.items[i].count <= 0) {
                    this.items[i] = {id: 0, count: 0, damage: 0};
                }
                return true;
            }
        }
        return false;
    }
}