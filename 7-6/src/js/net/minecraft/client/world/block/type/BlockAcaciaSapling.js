import BlockSapling from "../../../../../../../../Saplings.js";
import { BlockRegistry } from "../BlockRegistry.js";
import AcaciaTreeGenerator from "../../generator/structure/AcaciaTreeGenerator.js";

export default class BlockAcaciaSapling extends BlockSapling {
    constructor(id) {
        super(id, 3); // Index 3 in treestuff.png
    }

    growTree(world, x, y, z) {
        world.setBlockAt(x, y, z, 0);
        let generator = new AcaciaTreeGenerator(world, world.seed);
        if (!generator.generateAtBlock(x, y, z)) {
            world.setBlockAt(x, y, z, this.id);
            world.scheduleBlockUpdate(x, y, z, 1200);
        }
    }
}