import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockPressurePlate extends Block {

    constructor(id, textureSlotId, sound = Block.sounds.wood) {
        super(id, textureSlotId);
        this.sound = sound;
    }

    getRenderType() {
        return BlockRenderType.BLOCK; // Uses simple block rendering but with partial BB
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    getCollisionBoundingBox(world, x, y, z) {
        return null;
    }

    getBoundingBox(world, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let pressed = (meta & 1) !== 0;
        let height = pressed ? 0.03125 : 0.0625; // 1/32 or 1/16
        return new BoundingBox(0.0625, 0.0, 0.0625, 0.9375, height, 0.9375);
    }

    onBlockAdded(world, x, y, z) {
        world.scheduleBlockUpdate(x, y, z, 20);
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        if (!world.isSolidBlockAt(x, y - 1, z)) {
            world.setBlockAt(x, y, z, 0);
        }
    }

    updateTick(world, x, y, z) {
        if (world.isRemote) return;

        let meta = world.getBlockDataAt(x, y, z);
        let isPressed = (meta & 1) !== 0;

        // Check for entities in the area
        let bb = new BoundingBox(x + 0.1, y, z + 0.1, x + 0.9, y + 0.2, z + 0.9);
        let found = false;
        for (let entity of world.entities) {
            if (entity.canBeCollidedWith && entity.boundingBox.intersects(bb)) {
                found = true;
                break;
            }
        }

        if (found && !isPressed) {
            world.setBlockDataAt(x, y, z, meta | 1);
            world.minecraft.soundManager.playSound("random.click", x + 0.5, y + 0.1, z + 0.5, 0.3, 0.6);
            this.notifyNeighbors(world, x, y, z);
        } else if (!found && isPressed) {
            world.setBlockDataAt(x, y, z, meta & ~1);
            world.minecraft.soundManager.playSound("random.click", x + 0.5, y + 0.1, z + 0.5, 0.3, 0.5);
            this.notifyNeighbors(world, x, y, z);
        }

        world.scheduleBlockUpdate(x, y, z, 10);
    }

    notifyNeighbors(world, x, y, z) {
        world.notifyNeighborsOfStateChange(x, y, z, this.id);
        world.notifyBlockChange(x, y - 1, z, this.id);
    }
}