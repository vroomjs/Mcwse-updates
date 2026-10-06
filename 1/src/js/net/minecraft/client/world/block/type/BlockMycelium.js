import Block from "../Block.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockMycelium extends Block {

    constructor(id) {
        super(id, 0);
        this.sound = Block.sounds.grass;
    }

    getTextureForFace(face) {
        if (face === EnumBlockFace.TOP) {
            return { type: 'custom', name: '../../mycelium_top.png' };
        }
        if (face === EnumBlockFace.BOTTOM) {
            return 0; // Dirt from atlas
        }
        return { type: 'custom', name: '../../mycelium_side.png' };
    }
}