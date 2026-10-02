import BlockItem from "./BlockItem.js";

export default class BlockEnchantedBook extends BlockItem {
    constructor(id, name, enchantments) {
        super(id, "../../items (1).png", 1); // Book icon
        this.name = name;
        this.enchantmentName = name;
        this.enchantments = enchantments; // e.g. { sharpness: 5 }
        this.isEnchanted = true;
        this.setMaxStackSize(1);
    }
}