import Block from "../Block.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockWater extends Block {

    constructor(id, textureSlotId) {
        super(id, textureSlotId);
        this.textureName = "../../water_flow (4).png";
        this.tickRate = 5;
    }

    getRenderType() {
        return BlockRenderType.LIQUID;
    }

    getOpacity() {
        // Reduced opacity to allow more light to penetrate underwater
        return 0.1;
    }

    getTransparency() {
        // High transparency for visibility of items/entities through water
        return 0.7;
    }

    isTranslucent() {
        return true;
    }

    isSolid() {
        // Water is not solid for culling because it is translucent
        return false;
    }

    isLiquid() {
        return true;
    }

    canInteract() {
        return false;
    }

    shouldRenderFace(world, x, y, z, face) {
        let typeId = world.getBlockAtFace(x, y, z, face);
        
        // Special case: Render water top face even if Ice (79) or Packed Ice (174) is above it
        if ((typeId === 79 || typeId === 174) && face === EnumBlockFace.TOP) {
            return true;
        }

        // Don't render face if neighbor is same liquid (standard culling)
        if (typeId === this.id) {
            return false;
        }

        // Don't render face if neighbor is a solid opaque block (prevents Z-fighting/clipping into ground)
        if (typeId !== 0) {
            let block = Block.getById(typeId);
            // Added check: only cull if the neighbor is a full block to avoid gaps with slabs/stairs
            if (block && block.isSolid() && !block.isTranslucent() && block.getBoundingBox(world, x+face.x, y+face.y, z+face.z).isFullCube()) {
                // EXCEPTION: Transparent blocks like Light/Barrier should not cull water
                if (typeId >= 800 && typeId <= 816) return true;
                return false;
            }
        }

        return true;
    }

    getBoundingBox(world, x, y, z) {
        return new BoundingBox(0, 0, 0, 1, 1, 1);
    }

    onBlockAdded(world, x, y, z) {
        world.scheduleBlockUpdate(x, y, z, this.tickRate);
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        world.scheduleBlockUpdate(x, y, z, this.tickRate);
        // Instant check for source blocks when neighbors change
        if (world.getBlockDataAt(x, y, z) === 0) {
            this.flow(world, x, y, z, 0);
        }
    }

    updateTick(world, x, y, z) {
        let meta = world.getBlockDataAt(x, y, z);
        
        // 1. Source creation logic (Infinite Water)
        if (meta !== 0 && this.id === 9) { 
            let sourceNeighbors = 0;
            const horizontal = [{x: 1, z: 0}, {x: -1, z: 0}, {x: 0, z: 1}, {x: 0, z: -1}];
            for (let n of horizontal) {
                if (world.getBlockAt(x + n.x, y, z + n.z) === this.id && world.getBlockDataAt(x + n.x, y, z + n.z) === 0) {
                    sourceNeighbors++;
                }
            }
            if (sourceNeighbors >= 2) {
                let belowId = world.getBlockAt(x, y - 1, z);
                let belowBlock = Block.getById(belowId);
                if (belowId !== 0 && (belowId === this.id || (belowBlock && belowBlock.isSolid()))) {
                    world.setBlockAt(x, y, z, this.id, 0);
                    meta = 0;
                }
            }
        }

        if (meta === 0) {
            this.flow(world, x, y, z, meta);
            return;
        }

        // 2. Support Check
        let supported = false;
        let newMeta = 100;

        let upId = world.getBlockAt(x, y + 1, z);
        if (upId === this.id) {
            supported = true;
            newMeta = 8; // Falling
        } else {
            const neighbors = [{x: x + 1, z: z}, {x: x - 1, z: z}, {x: x, z: z + 1}, {x: x, z: z - 1}];
            for (let n of neighbors) {
                if (world.getBlockAt(n.x, y, n.z) === this.id) {
                    let nmeta = world.getBlockDataAt(n.x, y, n.z);
                    let val = (nmeta === 0 || nmeta === 8) ? 0 : nmeta;
                    if (val < newMeta) newMeta = val;
                }
            }
            
            const maxDist = this.id === 10 ? (world.dimension === -1 ? 7 : 3) : 7;
            if (newMeta < maxDist) {
                supported = true;
                newMeta += 1;
            }
        }

        if (!supported) {
            world.setBlockAt(x, y, z, 0);
            return;
        }

        if (newMeta !== meta) {
            world.setBlockDataAt(x, y, z, newMeta);
            meta = newMeta;
            world.scheduleBlockUpdate(x, y, z, this.tickRate);
        }

        this.flow(world, x, y, z, meta);
        
        // Ensure continuous flow updates even if meta didn't change
        if (world.time % 20 === 0) {
            world.scheduleBlockUpdate(x, y, z, this.tickRate);
        }
    }

    flow(world, x, y, z, meta) {
        if (meta === 8) {
            if (this.canFlowInto(world, x, y - 1, z)) {
                this.tryFlow(world, x, y - 1, z, 8);
            }
            return;
        }

        const maxDist = this.id === 10 ? (world.dimension === -1 ? 7 : 3) : 7;
        let flowMeta = meta + 1;
        if (flowMeta > maxDist && meta !== 0) return;
        if (meta === 0) flowMeta = 1;

        if (this.canFlowInto(world, x, y - 1, z)) {
            this.tryFlow(world, x, y - 1, z, 8);
            return; 
        }

        const flowFlags = this.getOptimalFlowDirections(world, x, y, z);
        if (flowFlags[0]) this.tryFlow(world, x + 1, y, z, flowMeta);
        if (flowFlags[1]) this.tryFlow(world, x - 1, y, z, flowMeta);
        if (flowFlags[2]) this.tryFlow(world, x, y, z + 1, flowMeta);
        if (flowFlags[3]) this.tryFlow(world, x, y, z - 1, flowMeta);
    }

    getOptimalFlowDirections(world, x, y, z) {
        const searchRange = 5;
        let results = [false, false, false, false]; // E, W, S, N
        let minDropDist = 100;
        const dirs = [{x: 1, z: 0}, {x: -1, z: 0}, {x: 0, z: 1}, {x: 0, z: -1}];

        for (let i = 0; i < 4; i++) {
            let d = dirs[i];
            if (!this.canFlowInto(world, x + d.x, y, z + d.z)) continue;
            let dist = this.findNearestHole(world, x + d.x, y, z + d.z, searchRange);
            if (dist < minDropDist) {
                minDropDist = dist;
                results = [false, false, false, false];
                results[i] = true;
            } else if (dist === minDropDist && dist < 100) {
                results[i] = true;
            }
        }

        if (minDropDist >= 100) {
            for (let i = 0; i < 4; i++) {
                let d = dirs[i];
                if (this.canFlowInto(world, x + d.x, y, z + d.z)) results[i] = true;
            }
        }
        return results;
    }

    findNearestHole(world, startX, y, startZ, range) {
        let queue = [{x: startX, z: startZ, d: 0}];
        let visited = new Set();
        visited.add(`${startX},${startZ}`);
        while (queue.length > 0) {
            let curr = queue.shift();
            if (curr.d > range) continue;
            if (this.canFlowInto(world, curr.x, y - 1, curr.z)) return curr.d;
            const neighbors = [{x: 1, z: 0}, {x: -1, z: 0}, {x: 0, z: 1}, {x: 0, z: -1}];
            for (let n of neighbors) {
                let nx = curr.x + n.x;
                let nz = curr.z + n.z;
                if (!visited.has(`${nx},${nz}`) && this.canFlowInto(world, nx, y, nz)) {
                    visited.add(`${nx},${nz}`);
                    queue.push({x: nx, z: nz, d: curr.d + 1});
                }
            }
        }
        return 100;
    }

    canFlowInto(world, x, y, z) {
        if (y < 0) return false;
        let id = world.getBlockAt(x, y, z);
        if (id === 0) return true;
        if (id === 9 || id === 10 || id === this.id) return true;
        let block = Block.getById(id);
        if (!block) return true;
        if (id === 20 || (id >= 237 && id <= 250)) return false; 

        const replaceableTypes = [
            BlockRenderType.CROSS, BlockRenderType.TORCH, BlockRenderType.FIRE,
            BlockRenderType.REDSTONE_DUST, BlockRenderType.DOUBLE_PLANT,
            BlockRenderType.SNOW_LAYER, BlockRenderType.FOLIAGE
        ];
        if (replaceableTypes.includes(block.getRenderType())) return true;
        if (block.getCollisionBoundingBox(world, x, y, z) !== null) return false;
        if (block.isSolid() || block.getOpacity() > 0) return false;
        return true;
    }

    tryFlow(world, x, y, z, newMeta) {
        if (this.canFlowInto(world, x, y, z)) {
            let id = world.getBlockAt(x, y, z);
            if (this.checkForMixing(world, x, y, z, id)) return;
            if (id === this.id) {
                let currentMeta = world.getBlockDataAt(x, y, z);
                if (currentMeta === 0) return; 
                if (currentMeta === 8 && newMeta !== 0) return;
                if (currentMeta <= newMeta && currentMeta !== 8) return;
            }
            world.setBlockAt(x, y, z, this.id, newMeta);
            world.scheduleBlockUpdate(x, y, z, this.tickRate);
        }
    }

    checkForMixing(world, x, y, z, targetId) {
        // Water (9) flowing into Lava (10)
        if (this.id === 9 && targetId === 10) {
            let meta = world.getBlockDataAt(x, y, z);
            // Flowing water touches Source Lava -> Obsidian
            if (meta === 0 || meta === 8) {
                world.setBlockAt(x, y, z, 49); // Obsidian
            } 
            // Flowing water touches Flowing Lava -> Stone
            else {
                world.setBlockAt(x, y, z, 1); // Stone
            }
            world.minecraft.soundManager.playSound("random.fizz", x + 0.5, y + 0.5, z + 0.5, 0.5, 2.6);
            return true;
        }
        // Lava (10) flowing into Water (9)
        if (this.id === 10 && targetId === 9) {
            let meta = world.getBlockDataAt(x, y, z);
            // Flowing Lava touches Source Water -> Cobblestone
            if (meta === 0 || meta === 8) {
                world.setBlockAt(x, y, z, 4); // Cobblestone
            } 
            // Flowing Lava touches Flowing Water -> Stone
            else {
                world.setBlockAt(x, y, z, 1); // Stone
            }
            world.minecraft.soundManager.playSound("random.fizz", x + 0.5, y + 0.5, z + 0.5, 0.5, 2.6);
            return true;
        }
        return false;
    }
}