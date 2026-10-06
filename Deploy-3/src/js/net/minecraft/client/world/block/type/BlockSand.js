import Block from "../Block.js";

export default class BlockSand extends Block {

    constructor(id, textureSlotId) {
        super(id, textureSlotId);
        this.textureName = "../../sandstuff.png";
        this.textureIndex = 0;

        // Sound
        this.sound = Block.sounds.sand;
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: this.textureIndex, cols: 10 };
    }

    onBlockAdded(world, x, y, z) {
        world.scheduleBlockUpdate(x, y, z, 3);
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        world.scheduleBlockUpdate(x, y, z, 3);
    }



}

