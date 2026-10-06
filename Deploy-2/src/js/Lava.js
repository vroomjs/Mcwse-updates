import BlockWater from "./net/minecraft/client/world/block/type/BlockWater.js";
import Block from "./net/minecraft/client/world/block/Block.js";

export default class BlockLava extends BlockWater {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../lava (4).png";
        this.tickRate = 30; // Standard lava is slower (1.5s)
    }

    getLightValue(world, x, y, z) {
        return 11;
    }

    onBlockAdded(world, x, y, z) {
        world.scheduleBlockUpdate(x, y, z, 18);
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        world.scheduleBlockUpdate(x, y, z, 18);
        if (world.getBlockDataAt(x, y, z) === 0) {
            this.flow(world, x, y, z, 0);
        }
    }

    updateTick(world, x, y, z) {
        let meta = world.getBlockDataAt(x, y, z);
        if (meta === 0) {
            this.flow(world, x, y, z, meta);
            return;
        }
        
        let supported = false;
        let newMeta = meta;

        let upId = world.getBlockAt(x, y + 1, z);
        if (upId === this.id) {
            supported = true;
            let upMeta = world.getBlockDataAt(x, y + 1, z);
            let effectiveUp = (upMeta === 0 || upMeta === 8) ? 0 : upMeta;
            newMeta = effectiveUp + 1;
        } else {
            let minNeighborMeta = 100;
            const neighbors = [{x: x + 1, z: z}, {x: x - 1, z: z}, {x: x, z: z + 1}, {x: x, z: z - 1}];
            for (let n of neighbors) {
                let nid = world.getBlockAt(n.x, y, n.z);
                if (nid === this.id) {
                    let nmeta = world.getBlockDataAt(n.x, y, n.z);
                    let effective = (nmeta === 0 || nmeta === 8) ? 0 : nmeta;
                    if (effective < minNeighborMeta) minNeighborMeta = effective;
                }
            }
            if (minNeighborMeta < 6) {
                supported = true;
                newMeta = minNeighborMeta + 1;
            }
        }

        if (newMeta >= 7) {
            supported = false;
        }

        if (!supported) {
            world.setBlockAt(x, y, z, 0);
            return;
        }

        if (newMeta !== meta) {
            world.setBlockAt(x, y, z, this.id, newMeta);
            meta = newMeta;
            world.scheduleBlockUpdate(x, y, z, this.tickRate);
        }

        this.flow(world, x, y, z, meta);

        if (world.time % 30 === 0) {
            world.scheduleBlockUpdate(x, y, z, this.tickRate);
        }
    }

    flow(world, x, y, z, meta) {
        let flowMeta = (meta === 0 || meta === 8) ? 1 : meta + 1;
        if (flowMeta >= 7) return;

        let downId = world.getBlockAt(x, y - 1, z);
        if (this.canFlowInto(world, x, y - 1, z)) {
            // Prevent weak flow from going down (last 2 states: 5 and 6)
            if (meta < 5) {
                if (downId !== this.id) {
                    world.setBlockAt(x, y - 1, z, this.id);
                    world.setBlockDataAt(x, y - 1, z, flowMeta);
                    world.scheduleBlockUpdate(x, y - 1, z, this.tickRate);
                } else {
                    let downMeta = world.getBlockDataAt(x, y - 1, z);
                    if (downMeta !== 0 && downMeta > flowMeta) {
                        world.setBlockDataAt(x, y - 1, z, flowMeta);
                        world.scheduleBlockUpdate(x, y - 1, z, this.tickRate);
                    }
                }
                return;
            }
        }

        this.tryFlow(world, x + 1, y, z, flowMeta);
        this.tryFlow(world, x - 1, y, z, flowMeta);
        this.tryFlow(world, x, y, z + 1, flowMeta);
        this.tryFlow(world, x, y, z - 1, flowMeta);
    }

    tryFlow(world, x, y, z, newMeta) {
        if (this.canFlowInto(world, x, y, z)) {
            let id = world.getBlockAt(x, y, z);
            
            // Check mixing
            if (this.checkForMixing(world, x, y, z, id)) return;

            if (id === this.id) {
                let currentMeta = world.getBlockDataAt(x, y, z);
                if (currentMeta === 0 || currentMeta === 8) return; 
                if (currentMeta <= newMeta) return;
            }
            world.setBlockAt(x, y, z, this.id);
            world.setBlockDataAt(x, y, z, newMeta);
            world.scheduleBlockUpdate(x, y, z, this.tickRate);
        }
    }

    shouldRenderFace(world, x, y, z, face) {
        let typeId = world.getBlockAtFace(x, y, z, face);
        
        // Cull against self or other lava/water variants
        if (typeId === this.id || typeId === 9 || typeId === 8 || typeId === 11) return false;

        // Cull against solid opaque blocks
        if (typeId !== 0) {
            let block = Block.getById(typeId);
            if (block && block.isSolid() && !block.isTranslucent()) return false;
        }
        
        return true;
    }

    // Set to false to prevent adjacent blocks from culling their faces against lava.
    isSolid() {
        return false;
    }

    // Ensure entities don't actually collide with the lava "solid" block
    getCollisionBoundingBox(world, x, y, z) {
        return null;
    }

    getTransparency() {
        return 0.0; // Opaque visually
    }
}

