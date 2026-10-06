import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export default class BlockRail extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../items (1).png";
        this.textureIndex = 32;
        this.sound = Block.sounds.stone;
        this.boundingBox = new BoundingBox(0.0, 0.0, 0.0, 1.0, 0.125, 1.0);
    }

    getRenderType() {
        return BlockRenderType.RAIL;
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

    canPlaceBlockAt(world, x, y, z) {
        let below = world.getBlockAt(x, y - 1, z);
        let block = Block.getById(below);
        return block && block.isSolid();
    }

    onBlockAdded(world, x, y, z) {
        if (!world.isRemote) {
            this.updateRailState(world, x, y, z);
            this.checkPower(world, x, y, z);
        }
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        if (!world) return;
        if (!this.canPlaceBlockAt(world, x, y, z)) {
            world.setBlockAt(x, y, z, 0);
            return;
        }
        this.updateRailState(world, x, y, z);
        this.checkPower(world, x, y, z);
    }

    checkPower(world, x, y, z) {
        const id = world.getBlockAt(x, y, z);
        if (id !== 158 && id !== 159) return;
        
        // Propagate power within a 9-block range along the track
        let powered = this.findPower(world, x, y, z, 0, new Set());
        
        const targetId = powered ? 159 : 158;
        if (id !== targetId) {
            const meta = world.getBlockDataAt(x, y, z);
            world.setBlockAt(x, y, z, targetId, meta);
            
            if (world.minecraft) {
                world.minecraft.soundManager.playSound("random.click", x + 0.5, y + 0.5, z + 0.5, 0.3, powered ? 0.6 : 0.5);
                if (world.minecraft.worldRenderer) {
                    world.minecraft.worldRenderer.flushRebuild = true;
                }
            }
            
            // Notify neighbors to ensure power state cascades along the track
            world.notifyNeighborsOfStateChange(x, y, z, targetId);
        }
    }

    findPower(world, x, y, z, depth, visited) {
        if (depth >= 9) return false;
        const key = `${x},${y},${z}`;
        if (visited.has(key)) return false;
        visited.add(key);

        // Check if directly powered by a redstone source
        if (this.isNeighborPowered(world, x, y, z)) return true;

        // Check adjacent powered rails for propagated power
        const offsets = [
            {x: 1, y: 0, z: 0}, {x: -1, y: 0, z: 0},
            {x: 0, y: 0, z: 1}, {x: 0, y: 0, z: -1},
            {x: 1, y: 1, z: 0}, {x: -1, y: 1, z: 0},
            {x: 0, y: 1, z: 1}, {x: 0, y: 1, z: -1},
            {x: 1, y: -1, z: 0}, {x: -1, y: -1, z: 0},
            {x: 0, y: -1, z: 1}, {x: 0, y: -1, z: -1}
        ];

        for (let off of offsets) {
            let nx = x + off.x, ny = y + off.y, nz = z + off.z;
            let nid = world.getBlockAt(nx, ny, nz);
            if (nid === 158 || nid === 159) {
                if (this.findPower(world, nx, ny, nz, depth + 1, visited)) return true;
            }
        }
        return false;
    }

    isNeighborPowered(world, x, y, z) {
        const offsets = [
            {x: 1, y: 0, z: 0}, {x: -1, y: 0, z: 0},
            {x: 0, y: 0, z: 1}, {x: 0, y: 0, z: -1},
            {x: 0, y: -1, z: 0}, {x: 0, y: 1, z: 0}
        ];

        for (let off of offsets) {
            let bx = x + off.x, by = y + off.y, bz = z + off.z;
            let id = world.getBlockAt(bx, by, bz);
            
            if (id === 152) return true; // Redstone Block
            if (id === 69 && (world.getBlockDataAt(bx, by, bz) & 8) !== 0) return true; // Lever
            if (id === 77 && (world.getBlockDataAt(bx, by, bz) & 8) !== 0) return true; // Button
            if (id === 223 && (world.getBlockDataAt(bx, by, bz) & 8) !== 0) return true; // Stone Button
            if (id === 72 && (world.getBlockDataAt(bx, by, bz) & 1) !== 0) return true; // Pressure Plate
            if (id === 70 && (world.getBlockDataAt(bx, by, bz) & 1) !== 0) return true; // Stone Pressure Plate
            if (id === 55 && world.getBlockDataAt(bx, by, bz) > 0) return true; // Powered Dust
        }
        return false;
    }

    updateRailState(world, x, y, z) {
        const isRail = (bx, by, bz) => {
            const id = world.getBlockAt(bx, by, bz);
            return id === 66 || id === 158 || id === 159;
        };
        
        // Check flat neighbors
        let n = isRail(x, y, z - 1);
        let s = isRail(x, y, z + 1);
        let w = isRail(x - 1, y, z);
        let e = isRail(x + 1, y, z);

        // Check sloped neighbors (up)
        let nUp = !n && isRail(x, y + 1, z - 1);
        let sUp = !s && isRail(x, y + 1, z + 1);
        let wUp = !w && isRail(x - 1, y + 1, z);
        let eUp = !e && isRail(x + 1, y + 1, z);

        // Check sloped neighbors (down)
        let nDown = !n && !nUp && isRail(x, y - 1, z - 1);
        let sDown = !s && !sUp && isRail(x, y - 1, z + 1);
        let wDown = !w && !wUp && isRail(x - 1, y - 1, z);
        let eDown = !e && !eUp && isRail(x + 1, y - 1, z);

        let meta = 0; // Default N-S

        // Determine slope first
        if (nUp) meta = 4; // Ascend North
        else if (sUp) meta = 5; // Ascend South
        else if (eUp) meta = 2; // Ascend East
        else if (wUp) meta = 3; // Ascend West
        // Determine curves
        else if ((s || sDown) && (e || eDown)) meta = 6;      // S-E
        else if ((s || sDown) && (w || wDown)) meta = 7; // S-W
        else if ((n || nDown) && (w || wDown)) meta = 8; // N-W
        else if ((n || nDown) && (e || eDown)) meta = 9; // N-E
        // Straight lines
        else if (e || w || eDown || wDown) meta = 1; // E-W
        else meta = 0;             // N-S (default or isolated)

        if (world.getBlockDataAt(x, y, z) !== meta) {
            world.setBlockDataAt(x, y, z, meta);
            if (world.minecraft && world.minecraft.worldRenderer) {
                world.minecraft.worldRenderer.flushRebuild = true;
            }
        }
    }
}

