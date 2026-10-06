import Block from "../Block.js";
import BoundingBox from "../../../../util/BoundingBox.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockVerticalSlab extends Block {

    constructor(id, texture, textureIndex = 0, cols = 1) {
        super(id, typeof texture === 'number' ? texture : 0);
        
        if (typeof texture === 'string') {
            this.textureName = texture;
            this.textureIndex = textureIndex;
            this.cols = cols;
        }

        this.sound = Block.sounds.wood;
        const name = (this.textureName || "").toLowerCase();
        if (name.includes("stone") || name.includes("brick") || name.includes("cobble") || name.includes("sandstone")) {
            this.sound = Block.sounds.stone;
        } else if (typeof texture === 'number') {
            if (texture === 3 || texture === 4) this.sound = Block.sounds.stone;
        }
    }

    getRenderType() {
        return BlockRenderType.VERTICAL_SLAB;
    }

    getTextureForFace(face) {
        if (this.textureName) {
            return {
                type: 'custom',
                name: this.textureName,
                index: this.textureIndex || 0,
                cols: this.cols || 1
            };
        }
        return super.getTextureForFace(face);
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0.0;
    }

    getCollisionBoundingBox(world, x, y, z) {
        return this.getBoundingBox(world, x, y, z);
    }

    getBoundingBox(world, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 2; 
        let thickness = 0.5;

        // Meta: 2:North (Z 0-0.5), 3:South (Z 0.5-1), 4:West (X 0-0.5), 5:East (X 0.5-1)
        if (meta === 2) return new BoundingBox(0.0, 0.0, 0.0, 1.0, 1.0, thickness);
        if (meta === 3) return new BoundingBox(0.0, 0.0, 1.0 - thickness, 1.0, 1.0, 1.0);
        if (meta === 4) return new BoundingBox(0.0, 0.0, 0.0, thickness, 1.0, 1.0);
        if (meta === 5) return new BoundingBox(1.0 - thickness, 0.0, 0.0, 1.0, 1.0, 1.0);

        return new BoundingBox(0, 0, 0, 1, 1, thickness);
    }

    onBlockActivated(world, x, y, z, player) {
        let heldId = player.inventory.getItemInSelectedSlot();
        if (heldId !== this.id) return false;

        let meta = world.getBlockDataAt(x, y, z);
        
        // Raytrace to see where we clicked on the existing slab
        let hitResult = player.rayTrace(5, 1.0, true);
        if (!hitResult) return false;

        let relX = hitResult.vector.x - x;
        let relZ = hitResult.vector.z - z;

        let combine = false;
        // North(2): Z 0-0.5. South(3): Z 0.5-1. West(4): X 0-0.5. East(5): X 0.5-1.
        if (meta === 2 && (relZ > 0.5 || hitResult.face === EnumBlockFace.SOUTH)) combine = true;
        if (meta === 3 && (relZ < 0.5 || hitResult.face === EnumBlockFace.NORTH)) combine = true;
        if (meta === 4 && (relX > 0.5 || hitResult.face === EnumBlockFace.EAST)) combine = true;
        if (meta === 5 && (relX < 0.5 || hitResult.face === EnumBlockFace.WEST)) combine = true;

        if (combine) {
            const slabToFull = { 230: 5, 231: 1, 232: 4, 233: 201, 234: 210 };
            let fullId = slabToFull[this.id];
            if (fullId) {
                world.setBlockAt(x, y, z, fullId);
                if (player.gameMode !== 1) player.inventory.consumeItem(heldId);
                player.swingArm();
                world.minecraft.soundManager.playSound(this.sound.getStepSound(), x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
                return true;
            }
        }
        return false;
    }

    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let hit = player.rayTrace(5, 1.0);
        let meta = 2;

        if (face.isXAxis() || face.isZAxis()) {
            if (face === EnumBlockFace.NORTH) meta = 3;
            else if (face === EnumBlockFace.SOUTH) meta = 2;
            else if (face === EnumBlockFace.WEST) meta = 5;
            else if (face === EnumBlockFace.EAST) meta = 4;
        } else if (hit) {
            let rx = hit.vector.x - x;
            let rz = hit.vector.z - z;
            let dx = Math.min(rx, 1.0 - rx);
            let dz = Math.min(rz, 1.0 - rz);
            if (dx < dz) meta = (rx < 0.5) ? 4 : 5;
            else meta = (rz < 0.5) ? 2 : 3;
        }
        world.setBlockDataAt(x, y, z, meta);
    }
}