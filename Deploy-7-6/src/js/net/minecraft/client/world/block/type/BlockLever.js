import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockLever extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../lever.png";
        this.sound = Block.sounds.wood;
    }

    getRenderType() {
        return BlockRenderType.LEVER;
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: 0, cols: 1 };
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
        let orientation = meta & 7;
        let thickness = 0.2;
        let width = 0.25;

        // Default floor (meta 0 or 7)
        let minX = 0.5 - width, maxX = 0.5 + width;
        let minZ = 0.5 - 0.3, maxZ = 0.5 + 0.3;
        let minY = 0.0, maxY = thickness;

        if (orientation === 1) { // East (Attached to West wall)
            minX = 0.0; maxX = thickness;
            minY = 0.5 - width; maxY = 0.5 + width;
            minZ = 0.5 - 0.3; maxZ = 0.5 + 0.3;
        } else if (orientation === 2) { // West (Attached to East wall)
            minX = 1.0 - thickness; maxX = 1.0;
            minY = 0.5 - width; maxY = 0.5 + width;
            minZ = 0.5 - 0.3; maxZ = 0.5 + 0.3;
        } else if (orientation === 3) { // South (Attached to North wall)
            minX = 0.5 - 0.3; maxX = 0.5 + 0.3;
            minY = 0.5 - width; maxY = 0.5 + width;
            minZ = 0.0; maxZ = thickness;
        } else if (orientation === 4) { // North (Attached to South wall)
            minX = 0.5 - 0.3; maxX = 0.5 + 0.3;
            minY = 0.5 - width; maxY = 0.5 + width;
            minZ = 1.0 - thickness; maxZ = 1.0;
        } else if (orientation === 5) { // Floor WE
            minX = 0.5 - 0.3; maxX = 0.5 + 0.3;
            minY = 0.0; maxY = thickness;
            minZ = 0.5 - width; maxZ = 0.5 + width;
        } else if (orientation === 6) { // Floor NS
            minX = 0.5 - width; maxX = 0.5 + width;
            minY = 0.0; maxY = thickness;
            minZ = 0.5 - 0.3; maxZ = 0.5 + 0.3;
        } else if (orientation === 0 || orientation === 7) { // Ceiling
            minY = 1.0 - thickness; maxY = 1.0;
        }

        return new BoundingBox(minX, minY, minZ, maxX, maxY, maxZ);
    }

    onBlockPlaced(world, x, y, z, face) {
        let meta = 0;
        // 0: Ceiling (NS), 1: East, 2: West, 3: South, 4: North, 5: Floor (WE), 6: Floor (NS), 7: Ceiling (WE)
        if (face === EnumBlockFace.TOP) meta = 6;
        else if (face === EnumBlockFace.BOTTOM) meta = 0;
        else if (face === EnumBlockFace.NORTH) meta = 4;
        else if (face === EnumBlockFace.SOUTH) meta = 3;
        else if (face === EnumBlockFace.WEST) meta = 2;
        else if (face === EnumBlockFace.EAST) meta = 1;

        world.setBlockDataAt(x, y, z, meta);
    }

    onBlockActivated(world, x, y, z, player) {
        let meta = world.getBlockDataAt(x, y, z);
        let active = (meta & 8) !== 0;
        let newMeta = meta ^ 8; // Toggle bit 3

        world.setBlockDataAt(x, y, z, newMeta);
        
        // Sound
        world.minecraft.soundManager.playSound("random.click", x + 0.5, y + 0.5, z + 0.5, 0.6, active ? 0.5 : 0.6);

        // Notify neighbors (Redstone update)
        this.notifyNeighbors(world, x, y, z);
        
        return true;
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        // Support check could go here
    }

    notifyNeighbors(world, x, y, z) {
        world.notifyNeighborsOfStateChange(x, y, z, this.id);
        // Directions
        const dirs = [
            {x:1,y:0,z:0}, {x:-1,y:0,z:0},
            {x:0,y:1,z:0}, {x:0,y:-1,z:0},
            {x:0,y:0,z:1}, {x:0,y:0,z:-1}
        ];
        for (let d of dirs) {
            world.notifyBlockChange(x + d.x, y + d.y, z + d.z, this.id);
        }
    }
}