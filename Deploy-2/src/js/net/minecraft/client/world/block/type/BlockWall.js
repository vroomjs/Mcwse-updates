import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockWall extends Block {

    constructor(id, textureSlotId, textureName = null, textureIndex = 0, cols = 1) {
        super(id, textureSlotId);
        this.textureName = textureName;
        this.textureIndex = textureIndex;
        this.cols = cols;
        this.sound = Block.sounds.stone;
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

    getRenderType() {
        return BlockRenderType.WALL;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0.0;
    }

    // Wall collision is 1.25 blocks high to prevent jumping over
    getCollisionBoundingBox(world, x, y, z) {
        let boxes = [];
        
        let minX = 0.25;
        let maxX = 0.75;
        let minZ = 0.25;
        let maxZ = 0.75;
        let height = 1.25;

        // Center post
        boxes.push(new BoundingBox(minX, 0.0, minZ, maxX, height, maxZ));

        // Connections
        if (this.canConnect(world, x, y, z - 1)) {
            boxes.push(new BoundingBox(minX, 0.0, 0.0, maxX, height, minZ));
        }
        if (this.canConnect(world, x, y, z + 1)) {
            boxes.push(new BoundingBox(minX, 0.0, maxZ, maxX, height, 1.0));
        }
        if (this.canConnect(world, x - 1, y, z)) {
            boxes.push(new BoundingBox(0.0, 0.0, minZ, minX, height, maxZ));
        }
        if (this.canConnect(world, x + 1, y, z)) {
            boxes.push(new BoundingBox(maxX, 0.0, minZ, 1.0, height, maxZ));
        }

        return boxes;
    }

    // Visual bounding box
    getBoundingBox(world, x, y, z) {
        // Center post is 0.25 to 0.75
        let minX = 0.25;
        let maxX = 0.75;
        let minZ = 0.25;
        let maxZ = 0.75;

        if (world) {
            if (this.canConnect(world, x, y, z - 1)) minZ = 0.0;
            if (this.canConnect(world, x, y, z + 1)) maxZ = 1.0;
            if (this.canConnect(world, x - 1, y, z)) minX = 0.0;
            if (this.canConnect(world, x + 1, y, z)) maxX = 1.0;
        }

        return new BoundingBox(minX, 0.0, minZ, maxX, 1.0, maxZ);
    }

    canConnect(world, x, y, z) {
        let id = world.getBlockAt(x, y, z);
        // Connect to self (139) or Gates (not impl)
        if (id === this.id) return true;
        
        let block = Block.getById(id);
        // Connect to solid opaque blocks
        if (block && block.isSolid() && block.getOpacity() > 0) return true;
        
        return false;
    }
}



