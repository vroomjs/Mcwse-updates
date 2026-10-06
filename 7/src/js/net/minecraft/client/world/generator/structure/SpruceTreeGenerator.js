import Block from "../../block/Block.js";
import {BlockRegistry} from "../../block/BlockRegistry.js";
import Generator from "../Generator.js";

export default class SpruceTreeGenerator extends Generator {

    constructor(world, seed) {
        super(world, seed);
    }

    generateAtBlock(x, y, z) {
        let height = this.random.nextInt(4) + 8; // Height 8-11
        let leafStart = 1 + this.random.nextInt(2); // Leaves start at 1 or 2 blocks from bottom
        let leafHeight = height - leafStart;
        
        if (y < 1 || y + height + 1 > 128) {
            return false;
        }

        const LOG_ID = BlockRegistry.SPRUCE_LOG.getId();
        const LEAF_ID = BlockRegistry.SPRUCE_LEAVE.getId();
        const DIRT_ID = BlockRegistry.DIRT.getId();
        const GRASS_ID = BlockRegistry.GRASS.getId();

        // Check space (Rough check)
        for (let totalY = y; totalY <= y + 1 + height; totalY++) {
            let radius = 2;
            for (let totalX = x - radius; totalX <= x + radius; totalX++) {
                for (let totalZ = z - radius; totalZ <= z + radius; totalZ++) {
                    if (totalY >= 0 && totalY < 128) {
                        let typeId = this.world.getBlockAt(totalX, totalY, totalZ);
                        if (typeId !== 0 && typeId !== LEAF_ID && typeId !== LOG_ID) {
                            // Ignore non-solid blocks (foliage, etc)
                            let block = Block.getById(typeId);
                            if (block && block.isSolid()) return false;
                        }
                    } else return false;
                }
            }
        }

        let typeIdBelowTree = this.world.getBlockAt(x, y - 1, z);
        if ((typeIdBelowTree !== GRASS_ID && typeIdBelowTree !== DIRT_ID && typeIdBelowTree !== BlockRegistry.SNOWY_GRASS.getId()) || y >= 128 - height - 1) {
            return false;
        }

        this.world.setBlockAt(x, y - 1, z, DIRT_ID);

        // --- Layered Conical Leaves ---
        let currentRadius = 0;
        let isDecreaseNext = false;

        for (let dy = height; dy >= leafStart; dy--) {
            let absoluteY = y + dy;
            
            // Calculate radius based on distance from top (layered effect)
            // Sequence of radii tapering up: 0, 1, 2, 1, 2, 3, 2, 3...
            let topDist = height - dy;
            
            if (topDist === 0) currentRadius = 0;
            else if (topDist === 1) currentRadius = 1;
            else {
                // Alternating layers: small ring followed by large ring
                if (isDecreaseNext) {
                    currentRadius--;
                    isDecreaseNext = false;
                } else {
                    currentRadius++;
                    if (currentRadius > 3) currentRadius = 3; // Cap
                    isDecreaseNext = true;
                }
            }

            for (let lx = x - currentRadius; lx <= x + currentRadius; lx++) {
                for (let lz = z - currentRadius; lz <= z + currentRadius; lz++) {
                    let dx = Math.abs(lx - x);
                    let dz = Math.abs(lz - z);
                    
                    // Round the corners of larger rings
                    if (currentRadius > 1 && dx === currentRadius && dz === currentRadius) {
                        continue;
                    }
                    
                    if (this.world.getBlockAt(lx, absoluteY, lz) === 0 || this.world.getBlockAt(lx, absoluteY, lz) === LEAF_ID) {
                        this.world.setBlockAt(lx, absoluteY, lz, LEAF_ID);
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

        // Spruce point (1 leaf on very top)
        if (this.world.getBlockAt(x, y + height, z) === 0) {
            this.world.setBlockAt(x, y + height, z, LEAF_ID);
        }

        return true;
    }
}

