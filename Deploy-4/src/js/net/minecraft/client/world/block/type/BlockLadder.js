import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockLadder extends Block {

    constructor(id, textureName = "../../items (1).png", textureIndex = 36, cols = 37) {
        super(id, 0);
        this.textureName = textureName;
        this.textureIndex = textureIndex;
        this.cols = cols;
        this.sound = Block.sounds.wood;
    }

    getRenderType() {
        return BlockRenderType.LADDER;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    getCollisionBoundingBox(world, x, y, z) {
        return null;
    }

    getBoundingBox(world, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let thickness = 0.125;

        let minX = 0;
        let maxX = 1;
        let minZ = 0;
        let maxZ = 1;

        // Meta: 2=North (Z 1.0-offset), 3=South (Z 0.0+offset), 4=West (X 1.0-offset), 5=East (X 0.0+offset)
        if (meta === 2) { 
            minZ = 1.0 - thickness; 
        } else if (meta === 3) { 
            maxZ = thickness; 
        } else if (meta === 4) { 
            minX = 1.0 - thickness; 
        } else if (meta === 5) { 
            maxX = thickness; 
        }

        return new BoundingBox(minX, 0, minZ, maxX, 1, maxZ);
    }

    onBlockPlaced(world, x, y, z, face) {
        let meta = 0;
        
        // Map face to meta
        // Face is the face of the block we clicked on.
        // If we click the North face (Z-1) of a block, we place the ladder South of it.
        // The ladder is attached to the South face of the new block space (which is the North face of the support).
        
        if (face === EnumBlockFace.NORTH) meta = 2; // Attached to North face of clicking block? (South face of ladder block)
        if (face === EnumBlockFace.SOUTH) meta = 3;
        if (face === EnumBlockFace.WEST) meta = 4;
        if (face === EnumBlockFace.EAST) meta = 5;

        world.setBlockDataAt(x, y, z, meta);
    }
    
    canPlaceBlockAt(world, x, y, z) {
        return true;
    }

    getColor(world, x, y, z, face) {
        // Only tint Vines (ID 106)
        if (this.id !== 106) return 0xFFFFFF;

        if (world === null) return 0x72ad62;

        let temperature = world.getTemperature(x, y, z);
        let humidity = world.getHumidity(x, y, z);
        let color = world.minecraft.grassColorizer.getColor(temperature, humidity);
        
        let r = Math.floor(((color >> 16) & 255) * 0.92);
        let g = Math.floor(((color >> 8) & 255) * 0.92);
        let b = Math.floor((color & 255) * 0.92);
        return (r << 16) | (g << 8) | b;
    }
}


