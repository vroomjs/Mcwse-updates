import BlockItem from "./BlockItem.js";

export default class BlockDebugStick extends BlockItem {
    constructor(id) {
        super(id, "../../items (1).png", 20); // Reuse stick icon
    }
}