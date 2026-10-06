import BlockItem from "./BlockItem.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import EntityFishHook from "../../../entity/EntityFishHook.js";

export default class BlockFishingRod extends BlockItem {
    constructor(id, textureName = "../../tools (1).png", textureIndex = 41) {
        super(id, textureName, textureIndex);
        this.setMaxStackSize(1);
        this.setMaxDamage(64);
    }

    getRenderType() {
        return BlockRenderType.ITEM;
    }

    onItemUse(world, x, y, z, face, player) {
        // Right click block - usually same as right click air for rod
        return false; 
    }
}