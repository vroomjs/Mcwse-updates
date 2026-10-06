import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockObserver extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../redstonestuff.png";
        this.sound = Block.sounds.stone;
        this.cols = 22;
    }

    getRenderType() {
        return BlockRenderType.OBSERVER;
    }

    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        let pitch = player.rotationPitch;

        let meta = 0;
        // Direction: 0=D, 1=U, 2=N, 3=S, 4=W, 5=E
        if (Math.abs(pitch) > 50) {
            meta = pitch > 0 ? 0 : 1; 
        } else {
            let direction = Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3;
            const map = [2, 5, 3, 4];
            meta = map[direction];
        }
        // Metadata is where the "face" (the eye) points
        world.setBlockDataAt(x, y, z, meta);
    }

    onNeighborBlockChange(world, x, y, z, neighborId, fromX, fromY, fromZ) {
        if (world.isRemote) return;
        
        let meta = world.getBlockDataAt(x, y, z);
        let dir = meta & 7;

        // Check if the update came from the block directly in front
        let dx = 0, dy = 0, dz = 0;
        if (dir === 0) dy = -1;
        else if (dir === 1) dy = 1;
        else if (dir === 2) dz = -1;
        else if (dir === 3) dz = 1;
        else if (dir === 4) dx = -1;
        else if (dir === 5) dx = 1;

        // Verify source position matches observer's face
        if (fromX !== undefined && (x + dx !== fromX || y + dy !== fromY || z + dz !== fromZ)) {
            return;
        }

        let active = (meta & 8) !== 0;
        if (active) return; // Ignore if already pulsing

        // Schedule activation to 1 tick later to avoid immediate recursion
        world.scheduleBlockUpdate(x, y, z, 1);
    }

    updateTick(world, x, y, z) {
        let meta = world.getBlockDataAt(x, y, z);
        let active = (meta & 8) !== 0;

        if (active) {
            // Turning off after pulse duration
            world.setBlockDataAt(x, y, z, meta & 7);
            this.notifyOutput(world, x, y, z, false);
        } else {
            // Activating the pulse
            world.setBlockDataAt(x, y, z, meta | 8);
            // Pulse logic: 4 game ticks (~0.2 seconds)
            world.scheduleBlockUpdate(x, y, z, 4);
            this.notifyOutput(world, x, y, z, true);
        }
    }

    notifyOutput(world, x, y, z, powered) {
        let meta = world.getBlockDataAt(x, y, z);
        let dir = meta & 7;
        
        // Output is OPPOSITE of the eye (bits 0-2)
        // 0:D->U, 1:U->D, 2:N->S, 3:S->N, 4:W->E, 5:E->W
        let dx = 0, dy = 0, dz = 0;
        if (dir === 0) dy = 1;
        else if (dir === 1) dy = -1;
        else if (dir === 2) dz = 1;
        else if (dir === 3) dz = -1;
        else if (dir === 4) dx = 1;
        else if (dir === 5) dx = -1;

        // Ensure the neighbor directly behind the observer receives a block update
        world.notifyBlockChange(x + dx, y + dy, z + dz, this.id, x, y, z);
        world.notifyNeighborsOfStateChange(x + dx, y + dy, z + dz, this.id);
    }
}