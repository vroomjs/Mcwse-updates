import Block from "../Block.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockStainedGlass extends Block {

    constructor(id, index) {
        super(id, 0);
        this.textureName = "../../coloredglass.png";
        this.textureIndex = index;
        this.sound = Block.sounds.stone; // Fallback to stone sound
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: this.textureIndex, cols: 14 };
    }

    getOpacity() {
        return 0.01;
    }

    getTransparency() {
        return 0.5;
    }



    isSolid() {
        return false;
    }

    getCollisionBoundingBox(world, x, y, z) {
        return this.boundingBox;
    }

    shouldRenderFace(world, x, y, z, face) {
        let typeId = world.getBlockAtFace(x, y, z, face);
        // Cull against self to avoid seeing internal faces of the same glass block
        if (typeId === this.id) return false;
        
        // Also cull against other glass-like blocks if they are solid-ish
        let neighbor = Block.getById(typeId);
        if (neighbor && neighbor.constructor.name === "BlockStainedGlass") {
             return false;
        }

        return true;
    }
}