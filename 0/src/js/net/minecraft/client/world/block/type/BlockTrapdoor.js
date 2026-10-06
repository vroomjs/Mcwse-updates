import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockTrapdoor extends Block {

    constructor(id, textureIndex) {
        super(id, 0);
        this.textureName = "../../trapdoorsheet.png";
        this.textureIndex = textureIndex;
        this.sound = Block.sounds.wood;
        if (textureIndex === 5) this.sound = Block.sounds.stone; // Iron
    }

    getRenderType() {
        return BlockRenderType.TRAPDOOR;
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: this.textureIndex, cols: 6 };
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    getCollisionBoundingBox(world, x, y, z) {
        return this.getBoundingBox(world, x, y, z);
    }

    getBoundingBox(world, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let open = (meta & 4) !== 0;
        let top = (meta & 8) !== 0;
        let dir = meta & 3; // 0: South, 1: West, 2: North, 3: East

        let thickness = 0.1875; // 3/16

        if (!open) {
            // Closed
            let minY = top ? 1.0 - thickness : 0.0;
            let maxY = top ? 1.0 : thickness;
            return new BoundingBox(0, minY, 0, 1, maxY, 1);
        } else {
            // Open
            // Attached side: 0: South, 1: West, 2: North, 3: East
            if (dir === 0) return new BoundingBox(0, 0, 1 - thickness, 1, 1, 1); // Attached to South wall
            if (dir === 1) return new BoundingBox(0, 0, 0, thickness, 1, 1);     // Attached to West wall
            if (dir === 2) return new BoundingBox(0, 0, 0, 1, 1, thickness);     // Attached to North wall
            if (dir === 3) return new BoundingBox(1 - thickness, 0, 0, 1, 1, 1); // Attached to East wall
        }

        return this.boundingBox;
    }

    onBlockPlaced(world, x, y, z, face) {
        let meta = 0;
        
        // Attachment side
        if (face === EnumBlockFace.NORTH) meta = 0; // Clicked North side of block -> Attached to South face of air
        else if (face === EnumBlockFace.SOUTH) meta = 2; // Attached to North face
        else if (face === EnumBlockFace.WEST) meta = 3; // Attached to East face
        else if (face === EnumBlockFace.EAST) meta = 1; // Attached to West face
        else {
            // If placed on top or bottom, use player look direction for hinge
            let yaw = world.minecraft.player.rotationYaw;
            meta = (Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3);
        }

        // Top/Bottom half logic
        let hit = world.minecraft.player.rayTrace(5, 1.0);
        if (hit && face !== EnumBlockFace.TOP && face !== EnumBlockFace.BOTTOM) {
            let relY = hit.vector.y - y;
            if (relY > 0.5) meta |= 8;
        } else if (face === EnumBlockFace.BOTTOM) {
            meta |= 8;
        }

        world.setBlockDataAt(x, y, z, meta);
    }

    onBlockActivated(world, x, y, z, player) {
        if (this.id === 228 && player.gameMode !== 1) return false; // Iron trapdoor only creative interact?

        let meta = world.getBlockDataAt(x, y, z);
        world.setBlockDataAt(x, y, z, meta ^ 4); // Toggle open bit
        
        world.minecraft.soundManager.playSound("random.click", x + 0.5, y + 0.5, z + 0.5, 1.0, (meta & 4) ? 0.5 : 0.6);
        return true;
    }

    canPlaceBlockAt(world, x, y, z) {
        return true;
    }
}