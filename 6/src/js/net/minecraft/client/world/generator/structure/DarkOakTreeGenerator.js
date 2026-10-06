import Generator from "../Generator.js";
import { BlockRegistry } from "../../block/BlockRegistry.js";

export default class DarkOakTreeGenerator extends Generator {

    constructor(world, seed) {
        super(world, seed);
    }

    generateAtBlock(x, y, z) {
        let height = this.random.nextInt(3) + 6;
        if (y < 1 || y + height + 1 > 128) return false;

        const LOG_ID = BlockRegistry.DARK_OAK_LOG.getId();
        const LEAF_ID = BlockRegistry.DARK_OAK_LEAVE.getId();
        const DIRT_ID = BlockRegistry.DIRT.getId();

        // 1. Check for 2x2 space
        for (let dy = y; dy <= y + 1 + height; dy++) {
            let radius = (dy >= y + height - 2) ? 3 : 1;
            for (let dx = 0; dx <= 1; dx++) {
                for (let dz = 0; dz <= 1; dz++) {
                    for (let rx = -radius; rx <= radius; rx++) {
                        for (let rz = -radius; rz <= radius; rz++) {
                            let tx = x + dx + rx;
                            let tz = z + dz + rz;
                            if (dy >= 0 && dy < 128) {
                                let tid = this.world.getBlockAt(tx, dy, tz);
                                if (tid !== 0 && tid !== LEAF_ID && tid !== LOG_ID) return false;
                            }
                        }
                    }
                }
            }
        }

        // Set dirt below the 2x2
        for (let dx = 0; dx <= 1; dx++) {
            for (let dz = 0; dz <= 1; dz++) {
                this.world.setBlockAt(x + dx, y - 1, z + dz, DIRT_ID);
            }
        }

        // 2. Build 2x2 Trunk
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx <= 1; dx++) {
                for (let dz = 0; dz <= 1; dz++) {
                    this.world.setBlockAt(x + dx, y + dy, z + dz, LOG_ID);
                    
                    // Variant: Extra branching trunk logs sticking out (from image 1)
                    if (dy > height - 4 && dy < height && this.random.nextFloat() < 0.25) {
                        let odx = (dx === 0 ? -1 : 1);
                        let odz = (dz === 0 ? -1 : 1);
                        if (this.random.nextFloat() < 0.5) {
                            this.world.setBlockAt(x + dx + odx, y + dy, z + dz, LOG_ID);
                        } else {
                            this.world.setBlockAt(x + dx, y + dy, z + dz + odz, LOG_ID);
                        }
                    }
                }
            }
        }

        // 3. Build Canopy (Centered on the 2x2 trunk)
        // Dark Oak canopy is very thick and wide
        for (let dy = height - 3; dy <= height + 1; dy++) {
            let topDist = (height + 1) - dy;
            let radius = 2;
            if (topDist === 0) radius = 1;
            if (topDist === 1) radius = 2;
            if (topDist >= 2) radius = 3;
            
            // Center is at x+0.5, z+0.5
            for (let dx = -radius; dx <= radius + 1; dx++) {
                for (let dz = -radius; dz <= radius + 1; dz++) {
                    // Soften corners of the square canopy
                    const isCorner = (dx === -radius || dx === radius + 1) && (dz === -radius || dz === radius + 1);
                    if (isCorner && radius > 1 && this.random.nextFloat() < 0.7) continue;

                    let tx = x + dx;
                    let tz = z + dz;
                    let ty = y + dy;
                    if (this.world.getBlockAt(tx, ty, tz) === 0) {
                        this.world.setBlockAt(tx, ty, tz, LEAF_ID);
                    }
                }
            }
        }

        return true;
    }
}