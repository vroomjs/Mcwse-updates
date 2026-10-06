import BlockFoliage from "./BlockFoliage.js";
import { BlockRegistry } from "../BlockRegistry.js";
import Block from "../Block.js";

export default class BlockSugarCane extends BlockFoliage {
    constructor(id) {
        super(id, "../../sandstuff.png", 7);
        this.sound = Block.sounds.grass;
    }

    getColor(world, x, y, z, face) {
        return 0xFFFFFF;
    }

    canPlaceBlockAt(world, x, y, z) {
        let below = world.getBlockAt(x, y - 1, z);
        return below === BlockRegistry.GRASS.getId() || below === BlockRegistry.SAND.getId() || below === this.id;
    }
}

