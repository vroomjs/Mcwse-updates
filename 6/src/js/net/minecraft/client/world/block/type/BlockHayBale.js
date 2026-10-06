import BlockLog from "./BlockLog.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockHayBale extends BlockLog {

    constructor(id) {
        super(id, 0); // textureSlotId ignored
        this.textureName = "../../farming.png";
    }

    getTextureForFace(face, meta = 0) {
        const axis = (meta >> 2) & 3; // 0=Y, 1=X, 2=Z, 3=None
        let isTop = false;

        if (axis === 0 && (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM)) isTop = true;
        else if (axis === 1 && face.isXAxis()) isTop = true;
        else if (axis === 2 && face.isZAxis()) isTop = true;

        if (isTop) {
            return { type: 'custom', name: '../../farming.png', index: 3, cols: 20 };
        }
        return { type: 'custom', name: '../../farming.png', index: 2, cols: 20 };
    }
}

