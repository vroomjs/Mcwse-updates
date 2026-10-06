import Block from "../Block.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockWood extends Block {

    constructor(id, textureSlotId) {
        super(id, textureSlotId);
    }

}

export class BlockButton extends Block {
    constructor(id, textureSlotId) {
        super(id, textureSlotId);
        this.sound = Block.sounds.wood;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    getBoundingBox(world, x, y, z) {
        let data = world ? world.getBlockDataAt(x, y, z) : 0;
        let pressed = (data & 8) !== 0;
        let orientation = data & 7;

        let thickness = pressed ? 0.0625 : 0.125; // 1/16 or 2/16
        let width = 0.375 / 2; // 6/16 wide
        let height = 0.25 / 2; // 4/16 tall

        // Default Floor (Meta 0)
        let minX = 0.5 - width;
        let maxX = 0.5 + width;
        let minZ = 0.5 - height;
        let maxZ = 0.5 + height;
        let minY = 0.0;
        let maxY = thickness;

        if (orientation === 1) { // Facing North (Attached to South wall)
             minX = 0.5 - width; maxX = 0.5 + width;
             minY = 0.5 - height; maxY = 0.5 + height;
             minZ = 1.0 - thickness; maxZ = 1.0;
        } else if (orientation === 2) { // Facing South (Attached to North wall)
             minX = 0.5 - width; maxX = 0.5 + width;
             minY = 0.5 - height; maxY = 0.5 + height;
             minZ = 0.0; maxZ = thickness;
        } else if (orientation === 3) { // Facing West (Attached to East wall)
             minX = 1.0 - thickness; maxX = 1.0;
             minY = 0.5 - height; maxY = 0.5 + height;
             minZ = 0.5 - width; maxZ = 0.5 + width;
        } else if (orientation === 4) { // Facing East (Attached to West wall)
             minX = 0.0; maxX = thickness;
             minY = 0.5 - height; maxY = 0.5 + height;
             minZ = 0.5 - width; maxZ = 0.5 + width;
        }

        return new BoundingBox(minX, minY, minZ, maxX, maxY, maxZ);
    }

    onBlockPlaced(world, x, y, z, face) {
        let meta = 0;
        if (face.z === -1) meta = 1; // North
        else if (face.z === 1) meta = 2; // South
        else if (face.x === -1) meta = 3; // West
        else if (face.x === 1) meta = 4; // East
        
        world.setBlockDataAt(x, y, z, meta);
    }

    onBlockActivated(world, x, y, z, player) {
        let data = world.getBlockDataAt(x, y, z);
        
        // If not pressed (using bit 3)
        if ((data & 8) === 0) {
            // Set pressed state
            world.setBlockDataAt(x, y, z, data | 8);
            
            // Schedule update to unpress after 1 second (20 ticks)
            world.scheduleBlockUpdate(x, y, z, 20);
            
            // Play click sound (using wood step with high pitch)
            world.minecraft.soundManager.playSound("step.wood", x + 0.5, y + 0.5, z + 0.5, 0.3, 2.0);

            // Notify neighbors (Redstone update)
            this.notifyNeighbors(world, x, y, z);

            // Open nearby doors
            this.toggleNearbyDoors(world, x, y, z);

            return true;
        }
        return true;
    }

    updateTick(world, x, y, z) {
        let data = world.getBlockDataAt(x, y, z);
        
        // If pressed
        if ((data & 8) !== 0) {
            // Unpress
            world.setBlockDataAt(x, y, z, data & ~8);
            
            // Play click release sound (lower pitch)
            world.minecraft.soundManager.playSound("step.wood", x + 0.5, y + 0.5, z + 0.5, 0.3, 1.5);

            // Notify neighbors (Redstone update)
            this.notifyNeighbors(world, x, y, z);

            // Toggle nearby doors (closing them back)
            this.toggleNearbyDoors(world, x, y, z);
        }
    }

    notifyNeighbors(world, x, y, z) {
        world.notifyNeighborsOfStateChange(x, y, z, this.id);
        const dirs = [{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:-1,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1}];
        for (let d of dirs) world.notifyBlockChange(x + d.x, y + d.y, z + d.z, this.id);
    }

    toggleNearbyDoors(world, x, y, z) {
        let doorsToToggle = new Set();

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    let nx = x + dx;
                    let ny = y + dy;
                    let nz = z + dz;
                    let blockId = world.getBlockAt(nx, ny, nz);
                    if (blockId === 64) { // Door
                        let meta = world.getBlockDataAt(nx, ny, nz);
                        let isTop = (meta & 8) !== 0;
                        // Identify unique door by its bottom y coordinate
                        let by = isTop ? ny - 1 : ny;
                        doorsToToggle.add(nx + "," + by + "," + nz);
                    }
                }
            }
        }

        doorsToToggle.forEach(key => {
            let coords = key.split(",");
            let dx = parseInt(coords[0]);
            let dy = parseInt(coords[1]);
            let dz = parseInt(coords[2]);
            let block = Block.getById(64);
            if (block) {
                block.onBlockActivated(world, dx, dy, dz, null);
            }
        });
    }
}