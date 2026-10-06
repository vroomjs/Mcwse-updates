import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";
import { BlockRegistry } from "../BlockRegistry.js";

export default class BlockFence extends Block {

    constructor(id, textureSlotId, textureName = null, textureIndex = 0, cols = 1) {
        super(id, textureSlotId);
        this.textureName = textureName;
        this.textureIndex = textureIndex;
        this.cols = cols;
        this.sound = Block.sounds.wood;
    }

    getTextureForFace(face) {
        if (this.textureName) {
            return {
                type: 'custom',
                name: this.textureName,
                index: this.textureIndex || 0,
                cols: this.cols || 1
            };
        }
        return super.getTextureForFace(face);
    }

    getRenderType() {
        return BlockRenderType.FENCE;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0.0;
    }

    // Fence is 1.25 blocks high for collision to prevent jumping over
    getCollisionBoundingBox(world, x, y, z) {
        let boxes = [];
        
        let minX = 0.375;
        let maxX = 0.625;
        let minZ = 0.375;
        let maxZ = 0.625;
        let height = 1.25;

        // Center post
        boxes.push(new BoundingBox(minX, 0.0, minZ, maxX, height, maxZ));

        // Connections
        if (this.canConnect(world, x, y, z - 1)) {
            boxes.push(new BoundingBox(minX, 0.0, 0.0, maxX, height, minZ));
        }
        if (this.canConnect(world, x, y, z + 1)) {
            boxes.push(new BoundingBox(minX, 0.0, maxZ, maxX, height, 1.0));
        }
        if (this.canConnect(world, x - 1, y, z)) {
            boxes.push(new BoundingBox(0.0, 0.0, minZ, minX, height, maxZ));
        }
        if (this.canConnect(world, x + 1, y, z)) {
            boxes.push(new BoundingBox(maxX, 0.0, minZ, 1.0, height, maxZ));
        }

        return boxes;
    }

    // Visual bounding box for selection
    getBoundingBox(world, x, y, z) {
        let minX = 0.375;
        let maxX = 0.625;
        let minZ = 0.375;
        let maxZ = 0.625;

        if (world) {
            if (this.canConnect(world, x, y, z - 1)) minZ = 0.0;
            if (this.canConnect(world, x, y, z + 1)) maxZ = 1.0;
            if (this.canConnect(world, x - 1, y, z)) minX = 0.0;
            if (this.canConnect(world, x + 1, y, z)) maxX = 1.0;
        }

        return new BoundingBox(minX, 0.0, minZ, maxX, 1.0, maxZ);
    }

    canConnect(world, x, y, z) {
        let id = world.getBlockAt(x, y, z);
        if (id === this.id) return true;
        
        let block = Block.getById(id);
        // Connect to solid opaque blocks OR fence gates
        if (block && (block.getRenderType() === BlockRenderType.FENCE_GATE || (block.isSolid() && block.getOpacity() > 0))) return true;
        
        return false;
    }
}

export class BlockFenceGate extends Block {
    constructor(id) {
        super(id, 8); // Plank texture
        this.sound = Block.sounds.wood;
    }

    getRenderType() {
        return BlockRenderType.FENCE_GATE;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0.0;
    }

    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        // 0=South, 1=West, 2=North, 3=East
        let direction = Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3;
        world.setBlockDataAt(x, y, z, direction);
    }

    onBlockActivated(world, x, y, z, player) {
        let meta = world.getBlockDataAt(x, y, z);
        let open = (meta & 4) !== 0;
        let newMeta = meta ^ 4; // Toggle open bit
        
        world.setBlockDataAt(x, y, z, newMeta);
        world.minecraft.soundManager.playSound("random.click", x + 0.5, y + 0.5, z + 0.5, 1.0, open ? 0.9 : 1.0);
        return true;
    }

    getCollisionBoundingBox(world, x, y, z) {
        let meta = world.getBlockDataAt(x, y, z);
        let open = (meta & 4) !== 0;
        
        if (open) return null;

        let dir = meta & 3;
        let thickness = 0.125;
        let height = 1.25;

        // Dir 0(S) & 2(N): Gate runs East-West (along X), blocks Z movement? 
        // Wait, if I face South (0), the gate should block me. I am moving Z+. The gate surface must be perpendicular to Z.
        // So the gate extends along X.
        
        if (dir === 0 || dir === 2) {
            // Along X
            return new BoundingBox(0.0, 0.0, 0.5 - thickness, 1.0, height, 0.5 + thickness);
        } else {
            // Along Z
            return new BoundingBox(0.5 - thickness, 0.0, 0.0, 0.5 + thickness, height, 1.0);
        }
    }

    getBoundingBox(world, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let dir = meta & 3;
        // let open = (meta & 4) !== 0; // Unused now
        let thickness = 0.125;

        // Removing the 'if (open) return null;' line to fix the crash/lag
        // We return the closed bounding box for selection purposes so the player can click to close it.

        if (dir === 0 || dir === 2) {
            return new BoundingBox(0.0, 0.0, 0.5 - thickness, 1.0, 1.0, 0.5 + thickness);
        } else {
            return new BoundingBox(0.5 - thickness, 0.0, 0.0, 0.5 + thickness, 1.0, 1.0);
        }
    }
}


