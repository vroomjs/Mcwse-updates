import Block from "../../block/Block.js";
import Generator from "../Generator.js";
import {BlockRegistry} from "../../block/BlockRegistry.js";
import TreeGenerator from "./TreeGenerator.js";

export default class BirchTreeGenerator extends TreeGenerator {

    constructor(world, seed) {
        super(world, seed);
    }

    // Override to use Birch blocks
    generateAtBlock(x, y, z) {
        // Use a flag to swap blocks during generation or copy logic. 
        // Since TreeGenerator methods hardcode IDs, we should copy the logic or override the setBlock method on the fly?
        // Simpler: Copy the generateAtBlock logic but swap IDs.
        
        // Generate random height
        let height = this.random.nextInt(3) + 4;
        if (y < 1 || y + height + 1 > 128) {
            return false;
        }

        const LOG_ID = BlockRegistry.BIRCH_LOG.getId();
        const LEAF_ID = BlockRegistry.BIRCH_LEAVE.getId();
        const DIRT_ID = BlockRegistry.DIRT.getId();
        const GRASS_ID = BlockRegistry.GRASS.getId();

        // Check space
        for (let totalY = y; totalY <= y + 1 + height; totalY++) {
            let radius = 1;
            if (totalY === y) radius = 0;
            if (totalY >= (y + 1 + height) - 2) radius = 2;

            for (let totalX = x - radius; totalX <= x + radius; totalX++) {
                for (let totalZ = z - radius; totalZ <= z + radius; totalZ++) {
                    if (totalY >= 0 && totalY < 128) {
                        let typeId = this.world.getBlockAt(totalX, totalY, totalZ);
                        if (typeId !== 0 && typeId !== LEAF_ID) {
                            let block = Block.getById(typeId);
                            if (block && block.isSolid()) return false;
                        }
                    } else {
                        return false;
                    }
                }
            }
        }

        let typeIdBelowTree = this.world.getBlockAt(x, y - 1, z);
        if ((typeIdBelowTree !== GRASS_ID && typeIdBelowTree !== DIRT_ID && typeIdBelowTree !== BlockRegistry.SNOWY_GRASS.getId()) || y >= 128 - height - 1) {
            return false;
        }

        this.world.setBlockAt(x, y - 1, z, DIRT_ID);

        // Leaves
        for (let totalY = (y - 3) + height; totalY <= y + height; totalY++) {
            let offsetY = totalY - (y + height);
            let radius = Math.floor(1 - offsetY / 2);

            for (let totalX = x - radius; totalX <= x + radius; totalX++) {
                let offsetX = totalX - x;
                for (let totalZ = z - radius; totalZ <= z + radius; totalZ++) {
                    let offsetZ = totalZ - z;
                    if (Math.abs(offsetX) !== radius || Math.abs(offsetZ) !== radius || this.random.nextInt(2) !== 0 && offsetY !== 0) {
                        this.world.setBlockAt(totalX, totalY, totalZ, LEAF_ID);
                    }
                }
            }
        }

        // Trunk
        for (let i = 0; i < height; i++) {
            let typeId = this.world.getBlockAt(x, y + i, z);
            if (typeId === 0 || typeId === LEAF_ID) {
                this.world.setBlockAt(x, y + i, z, LOG_ID);
            }
        }

        return true;
    }
}

