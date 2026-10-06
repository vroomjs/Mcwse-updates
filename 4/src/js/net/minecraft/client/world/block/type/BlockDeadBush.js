import BlockFoliage from "./BlockFoliage.js";
import { BlockRegistry } from "../BlockRegistry.js";
import Block from "../Block.js";

export default class BlockDeadBush extends BlockFoliage {
    constructor(id) {
        super(id, "../../sandstuff.png", 6);
        this.sound = Block.sounds.grass;
    }

    getColor(world, x, y, z, face) {
        return 0xFFFFFF;
    }

    canPlaceBlockAt(world, x, y, z) {
        let below = world.getBlockAt(x, y - 1, z);
        return below === BlockRegistry.SAND.getId() || below === BlockRegistry.DIRT.getId() || below === BlockRegistry.CLAY.getId();
    }


}

