import BlockFoliage from "./BlockFoliage.js";

export default class BlockFlower extends BlockFoliage {
    constructor(id, textureName, textureIndex = 0) {
        super(id, textureName, textureIndex);
    }



    getColor(world, x, y, z, face) {
        return 0xFFFFFF;
    }
}

