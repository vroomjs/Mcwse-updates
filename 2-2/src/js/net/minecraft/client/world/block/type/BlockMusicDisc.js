import BlockItem from "./BlockItem.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockMusicDisc extends BlockItem {

    constructor(id, textureIndex, discName, songName) {
        super(id, "../../dicsandbox (1).png", textureIndex);
        this.name = "Music Disc " + discName;
        this.discName = discName;
        this.songName = songName;
        this.cols = 14;
        this.setMaxStackSize(1);
    }

    getRenderType() {
        return BlockRenderType.ITEM;
    }
}