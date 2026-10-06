import Block from "../Block.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockBookshelf extends Block {
    constructor(id) {
        super(id, 0);
        this.sound = Block.sounds.wood;
    }

    getTextureForFace(face) {
        if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) {
            return 8; // Planks texture from atlas
        }
        return { type: 'custom', name: '../../bookshelf.png' };
    }
}