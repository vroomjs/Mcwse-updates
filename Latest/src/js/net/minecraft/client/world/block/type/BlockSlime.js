import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockSlime extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../slimestuff.png";
        this.textureIndex = 1; // Second sprite in sheet
        this.cols = 2;
        this.sound = Block.sounds.cloth; // Squishy sound
        this.name = "Slime Block";
    }

    getRenderType() {
        return BlockRenderType.BLOCK;
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: 1, cols: 2 };
    }

    isSolid() {
        return false;
    }

    getCollisionBoundingBox(world, x, y, z) {
        return this.boundingBox;
    }

    getOpacity() {
        return 0.5;
    }

    getTransparency() {
        return 0.4;
    }

    isTranslucent() {
        return true;
    }

    shouldRenderFace(world, x, y, z, face) {
        let typeId = world.getBlockAtFace(x, y, z, face);
        // Cull against other slime blocks
        if (typeId === this.id) {
            return false;
        }
        return true;
    }
}