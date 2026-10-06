import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockSnow extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../snow.png";
        this.sound = Block.sounds.snow;
    }
    getRenderType() { return BlockRenderType.MINERAL; }
}

export class BlockSnowLayer extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../snow.png";
        this.sound = Block.sounds.snow;
    }

    getRenderType() {
        return BlockRenderType.SNOW_LAYER;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    onItemUse(world, x, y, z, face, player) {
        // Case 1: Use on existing snow layer block
        let id = world.getBlockAt(x, y, z);
        if (id === this.id) {
            let meta = world.getBlockDataAt(x, y, z);
            if (meta < 7) {
                world.setBlockDataAt(x, y, z, meta + 1);
                
                player.swingArm();
                if (player.gameMode !== 1) {
                    player.inventory.consumeItem(this.id);
                }
                
                world.minecraft.soundManager.playSound("step.cloth", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
                return true;
            }
            // If full, allow normal placement on top (case 2 handles checking the spot above)
        }

        // Case 2: Clicked adjacent block and target spot is an existing snow layer
        let tx = x + face.x;
        let ty = y + face.y;
        let tz = z + face.z;
        let tid = world.getBlockAt(tx, ty, tz);
        if (tid === this.id) {
            let meta = world.getBlockDataAt(tx, ty, tz);
            if (meta < 7) {
                world.setBlockDataAt(tx, ty, tz, meta + 1);
                
                player.swingArm();
                if (player.gameMode !== 1) {
                    player.inventory.consumeItem(this.id);
                }
                
                world.minecraft.soundManager.playSound("step.cloth", tx + 0.5, ty + 0.5, tz + 0.5, 1.0, 1.0);
                return true;
            }
        }
        return false;
    }

    getBoundingBox(world, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let layers = (meta & 15) + 1;
        let height = layers / 8.0; 
        return new BoundingBox(0, 0, 0, 1, height, 1);
    }
    
    getCollisionBoundingBox(world, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let height = ((meta & 15) + 1) / 8.0;
        // If thin enough, allow walking through/up without jumping (like carpet/slab logic)
        if (height < 0.5) return null; 
        return new BoundingBox(0, 0, 0, 1, height, 1);
    }

    shouldRenderFace(world, x, y, z, face) {
        if (face.y === -1) return true; // Always render bottom face if visible
        // Render top face always
        if (face.y === 1) return true;
        
        return super.shouldRenderFace(world, x, y, z, face);
    }
    
    canPlaceBlockAt(world, x, y, z) {
        let below = world.getBlockAt(x, y - 1, z);
        let block = Block.getById(below);
        return block && block.isSolid();
    }
    
    onNeighborBlockChange(world, x, y, z, neighborId) {
        if (!this.canPlaceBlockAt(world, x, y, z)) {
            world.setBlockAt(x, y, z, 0);
        }
    }
}

