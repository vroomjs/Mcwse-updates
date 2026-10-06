import Block from "../Block.js";
import BoundingBox from "../../../../util/BoundingBox.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockGrassPath extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../newblocksset1.png";
        this.cols = 9;
        this.sound = Block.sounds.grass;
        this.hardness = 0.6;
        this.name = "Grass Path";
        // Indented box: 15/16 height
        this.boundingBox = new BoundingBox(0.0, 0.0, 0.0, 1.0, 0.9375, 1.0);
    }

    getRenderType() {
        return BlockRenderType.FARMLAND;
    }

    isSolid() {
        return false;
    }

    shouldRenderFace(world, x, y, z, face) {
        // Indented top face is always visible
        if (face === EnumBlockFace.TOP) return true;
        
        let typeId = world.getBlockAtFace(x, y, z, face);
        if (typeId === 0) return true;
        
        let neighbor = Block.getById(typeId);
        // Only cull if neighbor is solid full block
        if (neighbor && neighbor.isSolid() && !neighbor.isTranslucent() && neighbor.getBoundingBox(world, x+face.x, y+face.y, z+face.z).isFullCube()) {
            return false;
        }
        return true;
    }

    getOpacity() {
        return 0.0;
    }

    getCollisionBoundingBox(world, x, y, z) {
        return this.boundingBox;
    }

    getColor(world, x, y, z, face) {
        return 0xFFFFFF;
    }

    getTextureForFace(face, meta = 0) {
        // Sprite mapping in newblocksset1.png: 7 is top, 6 is side
        if (face === EnumBlockFace.TOP) {
            return { type: 'custom', name: this.textureName, index: 7, cols: 9 };
        }
        if (face === EnumBlockFace.BOTTOM) {
            return 0; // Dirt from atlas
        }
        return { type: 'custom', name: this.textureName, index: 6, cols: 9 };
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        // Revert to dirt if something solid is above
        let above = world.getBlockAt(x, y + 1, z);
        let blockAbove = Block.getById(above);
        if (blockAbove && blockAbove.isSolid()) {
            world.setBlockAt(x, y, z, 3); // Dirt ID
        }
    }
}