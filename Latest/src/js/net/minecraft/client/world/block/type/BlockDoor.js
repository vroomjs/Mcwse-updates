import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockDoor extends Block {

    constructor(id, textureIndex = 0, iconIndex = 0) {
        super(id, 0);
        this.textureName = "../../All doors.png";
        this.textureIndex = textureIndex; // Base index for the door pair (top/bottom)
        this.iconIndex = iconIndex;
        this.sound = Block.sounds.wood;
    }

    getRenderType() {
        return BlockRenderType.DOOR;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    canPlaceBlockAt(world, x, y, z) {
        // Requires 2 blocks of vertical space
        // Check current block (should be replaceable, handled by Minecraft.js generally) and block above
        return y < 127 && world.getBlockAt(x, y + 1, z) === 0;
    }

    onBlockPlaced(world, x, y, z, face) {
        // Determine orientation based on player rotation
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        let direction = Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3;
        
        // Directions: 0=South, 1=West, 2=North, 3=East
        // Store orientation in bits 0-1
        // Bottom half (default) -> bit 3 is 0
        // Open state -> bit 2 is 0 (closed)

        let meta = direction;
        world.setBlockDataAt(x, y, z, meta);

        // Set top block
        world.setBlockAt(x, y + 1, z, this.id);
        world.setBlockDataAt(x, y + 1, z, meta | 8); // Bit 3 set for top half
    }

    onBlockActivated(world, x, y, z, player) {
        // Iron doors (ID 71) cannot be opened manually by players
        if (this.id === 71) return false;

        let meta = world.getBlockDataAt(x, y, z);
        let top = (meta & 8) !== 0;
        let isOpen = (meta & 4) !== 0;

        let otherY = top ? y - 1 : y + 1;
        let otherMeta = world.getBlockDataAt(x, otherY, z);

        if (world.getBlockAt(x, otherY, z) !== this.id) return true;

        let newMeta = meta ^ 4;
        let newOtherMeta = otherMeta ^ 4;

        world.setBlockDataAt(x, y, z, newMeta);
        world.setBlockDataAt(x, otherY, z, newOtherMeta);

        world.scheduleBlockUpdate(x, y, z, 10);
        
        // Play Minecraft-style door sounds
        const soundKey = isOpen ? "door.close" : "door.open";
        world.minecraft.soundManager.playSound(soundKey, x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);

        return true;
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        // Prevent self-destruction during placement (when the block itself is being set)
        if (neighborId === this.id) return;

        let meta = world.getBlockDataAt(x, y, z);
        let top = (meta & 8) !== 0;
        let otherY = top ? y - 1 : y + 1;

        if (world.getBlockAt(x, otherY, z) !== this.id) {
            world.setBlockAt(x, y, z, 0);
        }
        // Check support for bottom
        if (!top && world.getBlockAt(x, y - 1, z) === 0) {
            world.setBlockAt(x, y, z, 0);
            // Top will be removed by its own neighbor check
        }
    }

    getCollisionBoundingBox(world, x, y, z) {
        let meta = world.getBlockDataAt(x, y, z);
        let open = (meta & 4) !== 0;
        if (open) return null;
        return this.getBoundingBox(world, x, y, z);
    }

    getBoundingBox(world, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        
        let open = (meta & 4) !== 0;
        let dir = meta & 3;

        // If open, rotate the bounding box 90 degrees
        // Assuming standard left hinge, opening rotates to the next direction CW
        if (open) {
            dir = (dir + 1) % 4;
        }

        let thickness = 0.1875; // 3/16
        
        let minX = 0, minY = 0, minZ = 0;
        let maxX = 1, maxY = 1, maxZ = 1;

        // 0=South (Closed at Z=0), 1=West (Closed at X=1), 2=North (Closed at Z=1), 3=East (Closed at X=0)
        if (dir === 0) { 
            minZ = 0; maxZ = thickness; minX = 0; maxX = 1; 
        } else if (dir === 1) { 
            minX = 1 - thickness; maxX = 1; minZ = 0; maxZ = 1; 
        } else if (dir === 2) { 
            minZ = 1 - thickness; maxZ = 1; minX = 0; maxX = 1; 
        } else if (dir === 3) { 
            minX = 0; maxX = thickness; minZ = 0; maxZ = 1; 
        }

        return new BoundingBox(minX, minY, minZ, maxX, maxY, maxZ);
    }
}


