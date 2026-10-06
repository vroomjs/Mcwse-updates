import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockPainting extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../paintingfront1by1.png"; // For inventory item icon
        this.sound = Block.sounds.wood;
    }

    getRenderType() {
        return BlockRenderType.PAINTING;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    getBoundingBox(world, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 2;
        let dir = meta & 7;
        // Thickness 1/10th block
        let thickness = 1.0 / 10.0;
        
        // Meta dir: 1=North (on South wall), 2=South (on North wall), 3=West (on East wall), 4=East (on West wall)
        // Default 2 for inventory
        if (dir === 1) { // Facing North
            return new BoundingBox(0, 0, 1 - thickness, 1, 1, 1);
        } else if (dir === 2) { // Facing South
            return new BoundingBox(0, 0, 0, 1, 1, thickness);
        } else if (dir === 3) { // Facing West
            return new BoundingBox(1 - thickness, 0, 0, 1, 1, 1);
        } else { // Facing East
            return new BoundingBox(0, 0, 0, thickness, 1, 1);
        }
    }

    canPlaceBlockAt(world, x, y, z) {
        return true; // Simplified placement check
    }

    onBlockPlaced(world, x, y, z, face) {
        let meta = 0;
        // Determine orientation based on the face of the supporting block
        if (face === EnumBlockFace.NORTH) meta = 1; // On South wall, facing North
        else if (face === EnumBlockFace.SOUTH) meta = 2; // On North wall, facing South
        else if (face === EnumBlockFace.WEST) meta = 3; // On East wall, facing West
        else if (face === EnumBlockFace.EAST) meta = 4; // On West wall, facing East
        else meta = 2; 

        // Random Variant (0, 1, or 2) stored in bits 3-4 (shift by 3)
        let variant = Math.floor(Math.random() * 3);
        meta |= (variant << 3);

        world.setBlockDataAt(x, y, z, meta);
    }
    
    onNeighborBlockChange(world, x, y, z, neighborId) {
        // Prevent self-destruction during placement (when the block itself is being set)
        if (neighborId === this.id) return;

        let meta = world.getBlockDataAt(x, y, z);
        let dir = meta & 7; // Bits 0-2 for orientation
        let supported = false;
        
        // Check support
        if (dir === 1 && world.isSolidBlockAt(x, y, z + 1)) supported = true;
        else if (dir === 2 && world.isSolidBlockAt(x, y, z - 1)) supported = true;
        else if (dir === 3 && world.isSolidBlockAt(x + 1, y, z)) supported = true;
        else if (dir === 4 && world.isSolidBlockAt(x - 1, y, z)) supported = true;
        
        if (!supported) {
            world.setBlockAt(x, y, z, 0);
            // Drop item logic is generic in Minecraft.js based on drops
        }
    }
}


