import Generator from "../Generator.js";
import { BlockRegistry } from "../../block/BlockRegistry.js";

export default class AcaciaTreeGenerator extends Generator {

    constructor(world, seed) {
        super(world, seed);
    }

    generateAtBlock(x, y, z) {
        let height = this.random.nextInt(3) + 5;
        if (y < 1 || y + height + 2 > 128) return false;

        const LOG_ID = BlockRegistry.ACACIA_LOG.getId();
        const LEAF_ID = BlockRegistry.ACACIA_LEAVE.getId();
        const DIRT_ID = BlockRegistry.DIRT.getId();

        // Foundation check
        let ground = this.world.getBlockAt(x, y - 1, z);
        if (ground !== BlockRegistry.GRASS.getId() && ground !== DIRT_ID && ground !== BlockRegistry.SAND.getId()) return false;
        this.world.setBlockAt(x, y - 1, z, DIRT_ID);

        // 1. Trunk and Branching
        let curX = x, curY = y, curZ = z;
        let mainTrunkH = Math.floor(height * 0.6);
        
        for (let i = 0; i < mainTrunkH; i++) {
            this.world.setBlockAt(curX, curY + i, curZ, LOG_ID);
        }
        curY += mainTrunkH;

        // Create 1 to 3 diagonal branches
        let branches = this.random.nextInt(3) + 1;
        for (let b = 0; b < branches; b++) {
            let bx = curX, by = curY, bz = curZ;
            // Branch direction
            let dirX = this.random.nextInt(3) - 1;
            let dirZ = this.random.nextInt(3) - 1;
            if (dirX === 0 && dirZ === 0) {
                dirX = this.random.nextFloat() < 0.5 ? 1 : -1;
                dirZ = this.random.nextFloat() < 0.5 ? 1 : -1;
            }
            
            // Random variation in branch length and height offset
            let branchLen = 4 + this.random.nextInt(4);
            for (let j = 0; j < branchLen; j++) {
                // Slanted growth: always rise occasionally, but move mostly horizontally
                if (this.random.nextFloat() < 0.3 || j === branchLen - 1) {
                    by++;
                }
                bx += dirX;
                bz += dirZ;
                
                this.world.setBlockAt(bx, by, bz, LOG_ID);
                
                // Variant: Occasionally sprout a secondary mini-canopy along the branch
                if (j > 2 && this.random.nextFloat() < 0.2) {
                    this.generateCanopy(bx, by, bz, LEAF_ID, 2);
                }
            }
            // Generate main wide flat canopy at branch end
            this.generateCanopy(bx, by, bz, LEAF_ID, 3 + this.random.nextInt(2));
        }

        return true;
    }

    generateCanopy(x, y, z, leafId, baseRadius = 3) {
        // Umbrella shape: wide flat layers
        for (let dy = 0; dy <= 1; dy++) {
            let radius = dy === 0 ? baseRadius : baseRadius - 1;
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    if (Math.abs(dx) === radius && Math.abs(dz) === radius && radius > 1) continue;
                    if (this.world.getBlockAt(x + dx, y + dy, z + dz) === 0) {
                        this.world.setBlockAt(x + dx, y + dy, z + dz, leafId);
                    }
                }
            }
        }
    }
}