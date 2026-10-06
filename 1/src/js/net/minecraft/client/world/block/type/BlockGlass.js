import Block from "../Block.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockGlass extends Block {

    constructor(id, textureSlotId) {
        super(id, textureSlotId);
    }

    getOpacity() {
        return 0.01;
    }

    getTransparency() {
        return 0.3;
    }



    isSolid() {
        return false;
    }

    getCollisionBoundingBox(world, x, y, z) {
        return this.boundingBox;
    }

    shouldRenderFace(world, x, y, z, face) {
        return true;
    }

}

