import BlockItem from "./BlockItem.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockSnowball extends BlockItem {

    constructor(id) {
        super(id, "../../items (1).png", 4);
    }

    getRenderType() {
        return BlockRenderType.ITEM;
    }
}

