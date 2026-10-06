import BlockSapling from "../../../../../../../../Saplings.js";
import { BlockRegistry } from "../BlockRegistry.js";
import DarkOakTreeGenerator from "../../generator/structure/DarkOakTreeGenerator.js";

export default class BlockDarkOakSapling extends BlockSapling {
    constructor(id) {
        super(id, 4); // Index 4 in treestuff.png
    }

    growTree(world, x, y, z) {
        // Dark Oak requires a 2x2 grid
        let cornerX = -1, cornerZ = -1;
        
        // Find the top-left corner of a 2x2 area
        for (let dx = 0; dx >= -1; dx--) {
            for (let dz = 0; dz >= -1; dz--) {
                if (this.isSaplingAt(world, x + dx, y, z + dz) &&
                    this.isSaplingAt(world, x + dx + 1, y, z + dz) &&
                    this.isSaplingAt(world, x + dx, y, z + dz + 1) &&
                    this.isSaplingAt(world, x + dx + 1, y, z + dz + 1)) {
                    cornerX = x + dx;
                    cornerZ = z + dz;
                    break;
                }
            }
            if (cornerX !== -1) break;
        }

        if (cornerX === -1) {
            // Not a 2x2, just fail and reschedule (Dark Oak cannot grow alone)
            world.scheduleBlockUpdate(x, y, z, 1200);
            return;
        }

        // Remove all 4 saplings
        world.setBlockAt(cornerX, y, cornerZ, 0, 0, true);
        world.setBlockAt(cornerX + 1, y, cornerZ, 0, 0, true);
        world.setBlockAt(cornerX, y, cornerZ + 1, 0, 0, true);
        world.setBlockAt(cornerX + 1, y, cornerZ + 1, 0, 0, true);

        let generator = new DarkOakTreeGenerator(world, world.seed);
        if (!generator.generateAtBlock(cornerX, y, cornerZ)) {
            // Restore saplings if blocked
            world.setBlockAt(cornerX, y, cornerZ, this.id);
            world.setBlockAt(cornerX + 1, y, cornerZ, this.id);
            world.setBlockAt(cornerX, y, cornerZ + 1, this.id);
            world.setBlockAt(cornerX + 1, y, cornerZ + 1, this.id);
            world.scheduleBlockUpdate(x, y, z, 1200);
        }
    }

    isSaplingAt(world, x, y, z) {
        return world.getBlockAt(x, y, z) === this.id;
    }
}