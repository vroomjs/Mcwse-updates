import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockEndPortalFrame extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../endstuff.png";
        this.sound = Block.sounds.stone;
        // End portal frame outline is a full block for selection
        this.boundingBox = new BoundingBox(0.0, 0.0, 0.0, 1.0, 1.0, 1.0);
    }

    getRenderType() {
        return BlockRenderType.END_PORTAL_FRAME;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0.0;
    }

    getCollisionBoundingBox(world, x, y, z) {
        return this.boundingBox;
    }

    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        // Direction: 0=S, 1=W, 2=N, 3=E
        let direction = Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3;
        // Store rotation in bits 0-1
        world.setBlockDataAt(x, y, z, direction);
    }

    onBlockActivated(world, x, y, z, player) {
        let heldId = player.inventory.getItemInSelectedSlot();
        if (heldId === 360) { // Eye of Ender ID
            let meta = world.getBlockDataAt(x, y, z);
            if ((meta & 4) === 0) { // Check if eye bit is already set
                world.setBlockDataAt(x, y, z, meta | 4);
                if (player.gameMode !== 1) {
                    player.inventory.consumeItem(360);
                }
                player.swingArm();
                world.minecraft.soundManager.playSound("random.click", x + 0.5, y + 0.8, z + 0.5, 1.0, 1.0);
                
                // Portal check
                this.checkPortalCreation(world, x, y, z);
                return true;
            }
        }
        return false;
    }

    checkPortalCreation(world, x, y, z) {
        for (let cx = x - 2; cx <= x + 2; cx++) {
            for (let cz = z - 2; cz <= z + 2; cz++) {
                if (this.isCompletePortal(world, cx, y, cz)) {
                    this.spawnEndPortal(world, cx, y, cz);
                }
            }
        }
    }

    isCompletePortal(world, cx, cy, cz) {
        const frames = [[-2,-1], [-2,0], [-2,1], [2,-1], [2,0], [2,1], [-1,-2], [0,-2], [1,-2], [-1,2], [0,2], [1,2]];
        for(let f of frames) {
            let id = world.getBlockAt(cx + f[0], cy, cz + f[1]);
            let meta = world.getBlockDataAt(cx + f[0], cy, cz + f[1]);
            if (id !== this.id || (meta & 4) === 0) return false;
        }
        return true;
    }

    spawnEndPortal(world, cx, cy, cz) {
        for(let dx = -1; dx <= 1; dx++) {
            for(let dz = -1; dz <= 1; dz++) {
                world.setBlockAt(cx + dx, cy, cz + dz, 123); // END_BLOCK
            }
        }
    }

    getTextureForFace(face, meta = 0) {
        // Spritesheet mapping (7 cols):
        // 0: end.png
        // 1: ender_eye.png
        // 2: side
        // 3: top (empty)
        // 4: top (with eye)
        // 5: end_stone
        // 6: end_stone_bricks

        if (face === EnumBlockFace.TOP) {
            let hasEye = (meta & 4) !== 0;
            return { type: 'custom', name: this.textureName, index: hasEye ? 4 : 3, cols: 7 };
        }
        if (face === EnumBlockFace.BOTTOM) {
            return { type: 'custom', name: this.textureName, index: 5, cols: 7 }; // End Stone texture
        }
        return { type: 'custom', name: this.textureName, index: 2, cols: 7 }; // Side texture
    }
}