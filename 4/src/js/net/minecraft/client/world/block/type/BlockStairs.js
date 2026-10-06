import Block from "../Block.js";
import BoundingBox from "../../../../util/BoundingBox.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockStairs extends Block {

    constructor(id, texture, textureIndex = 0, cols = 1) {
        super(id, typeof texture === 'number' ? texture : 0);
        
        if (typeof texture === 'string') {
            this.textureName = texture;
            this.textureIndex = textureIndex;
            this.cols = cols;
        }

        this.boundingBox = new BoundingBox(0.0, 0.0, 0.0, 1.0, 1.0, 1.0);
        this.sound = Block.sounds.wood;
        if (this.textureName && this.textureName.includes("brick")) {
            this.sound = Block.sounds.stone;
        }
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0.0;
    }

    getCollisionBoundingBox(world, x, y, z) {
        let boxes = [];
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let isUpsideDown = (meta & 8) !== 0;
        let dir = meta & 3;

        // Base slab
        if (isUpsideDown) {
            boxes.push(new BoundingBox(0.0, 0.5, 0.0, 1.0, 1.0, 1.0));
        } else {
            boxes.push(new BoundingBox(0.0, 0.0, 0.0, 1.0, 0.5, 1.0));
        }

        // Step
        let minX = 0, minZ = 0, maxX = 1, maxZ = 1;
        let minY = isUpsideDown ? 0.0 : 0.5;
        let maxY = isUpsideDown ? 0.5 : 1.0;

        if (dir === 0) minZ = 0.5;      // South
        else if (dir === 1) maxX = 0.5; // West
        else if (dir === 2) maxZ = 0.5; // North
        else if (dir === 3) minX = 0.5; // East

        boxes.push(new BoundingBox(minX, minY, minZ, maxX, maxY, maxZ));
        
        return boxes;
    }

    getRenderType() {
        return BlockRenderType.STAIRS;
    }

    getTextureForFace(face) {
        if (this.textureName) {
            return {
                type: 'custom',
                name: this.textureName,
                index: this.textureIndex || 0,
                cols: this.cols || 1,
                rows: this.rows || 1
            };
        }
        return super.getTextureForFace(face);
    }

    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        // 0=South, 1=West, 2=North, 3=East
        let direction = Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3;
        
        let meta = world.getBlockDataAt(x, y, z);
        // Preserve upside-down bit (8) while setting direction
        world.setBlockDataAt(x, y, z, (meta & 8) | direction);
    }
    
    shouldRenderFace(world, x, y, z, face) {
        return true;
    }
}

