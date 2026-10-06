import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";
import { BlockRegistry } from "../BlockRegistry.js";
import BoundingBox from "../../../../util/BoundingBox.js";

export class BlockPistonBase extends Block {

    constructor(id, isSticky) {
        super(id, 0);
        this.textureName = "../../redstonestuff.png";
        this.isSticky = isSticky;
        this.sound = Block.sounds.stone;
        this.name = isSticky ? "Sticky Piston" : "Piston";
        this.cols = 22;
        this.textureIndex = 10; // Side by default
    }

    getRenderType() {
        return BlockRenderType.PISTON_BASE;
    }

    isSolid() {
        return false; // Complex shape when extended
    }

    getOpacity() {
        return 0; // Does not block light fully
    }

    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        let pitch = player.rotationPitch;

        let meta = 0;
        // Direction: 0=D, 1=U, 2=N, 3=S, 4=W, 5=E
        if (Math.abs(pitch) > 50) {
            meta = pitch > 0 ? 0 : 1; // Looking down -> facing Down (0), Looking up -> facing Up (1)
        } else {
            // Horizontal based on yaw: 0=S, 1=W, 2=N, 3=E
            let direction = Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3;
            // Map direction to meta facing AWAY from player
            const map = [3, 4, 2, 5]; 
            meta = map[direction];
        }

        world.setBlockDataAt(x, y, z, meta);
        this.checkRedstone(world, x, y, z);
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        this.checkRedstone(world, x, y, z);
    }

    checkRedstone(world, x, y, z) {
        let meta = world.getBlockDataAt(x, y, z);
        let isExtended = (meta & 8) !== 0;
        let powered = this.isPowered(world, x, y, z);

        if (powered && !isExtended) {
            this.tryExtend(world, x, y, z, meta);
        } else if (!powered && isExtended) {
            this.tryRetract(world, x, y, z, meta);
        }
    }

    isPowered(world, x, y, z) {
        const offsets = [
            {x:1,y:0,z:0}, {x:-1,y:0,z:0},
            {x:0,y:1,z:0}, {x:0,y:-1,z:0},
            {x:0,y:0,z:1}, {x:0,y:0,z:-1}
        ];
        for (let o of offsets) {
            let nx = x + o.x, ny = y + o.y, nz = z + o.z;
            let id = world.getBlockAt(nx, ny, nz);
            if (id === 152 || id === 76) return true; // Redstone block or Redstone Torch
            if (id === 124) return true; // Lit Redstone Lamp (conductive)
            if (id === 69 && (world.getBlockDataAt(nx, ny, nz) & 8) !== 0) return true; // Lever
            if (id === 77 && (world.getBlockDataAt(nx, ny, nz) & 8) !== 0) return true; // Button
            if (id === 223 && (world.getBlockDataAt(nx, ny, nz) & 8) !== 0) return true; // Stone Button
            if (id === 72 && (world.getBlockDataAt(nx, ny, nz) & 1) !== 0) return true; // Plate
            if (id === 70 && (world.getBlockDataAt(nx, ny, nz) & 1) !== 0) return true; // Stone Plate
            if (id === 161) { // Observer
                let m = world.getBlockDataAt(nx, ny, nz);
                if ((m & 8) !== 0) {
                    let dir = m & 7;
                    if (dir === 0 && ny + 1 === y) return true;
                    else if (dir === 1 && ny - 1 === y) return true;
                    else if (dir === 2 && nz + 1 === z) return true;
                    else if (dir === 3 && nz - 1 === z) return true;
                    else if (dir === 4 && nx + 1 === x) return true;
                    else if (dir === 5 && nx - 1 === x) return true;
                }
            }
            if (id === 55 && world.getBlockDataAt(nx, ny, nz) > 0) return true; // Powered Redstone Dust
        }
        return false;
    }

    tryExtend(world, x, y, z, meta) {
        let dir = meta & 7;
        let dx = 0, dy = 0, dz = 0;
        if (dir === 0) dy = -1;
        else if (dir === 1) dy = 1;
        else if (dir === 2) dz = -1;
        else if (dir === 3) dz = 1;
        else if (dir === 4) dx = -1;
        else if (dir === 5) dx = 1;

        let blocksToPush = [];
        let curX = x + dx, curY = y + dy, curZ = z + dz;
        
        for (let i = 0; i < 12; i++) {
            if (curY < 0 || curY > 127) return;
            let id = world.getBlockAt(curX, curY, curZ);
            if (id === 0 || Block.getById(id).isLiquid()) break;
            
            let block = Block.getById(id);
            if (id === 7 || id === 49 || (block && block.hardness < 0) || (block && block.isContainer) || id === 332) return;
            if ((id === 29 || id === 30) && (world.getBlockDataAt(curX, curY, curZ) & 8) !== 0) return;

            blocksToPush.push({x: curX, y: curY, z: curZ, id: id, meta: world.getBlockDataAt(curX, curY, curZ)});
            curX += dx; curY += dy; curZ += dz;
        }
        
        if (curY < 0 || curY > 127) return;
        let endId = world.getBlockAt(curX, curY, curZ);
        if (endId !== 0 && !Block.getById(endId).isLiquid()) return;

        world.setBlockDataAt(x, y, z, meta | 8);

        for (let i = blocksToPush.length - 1; i >= 0; i--) {
            let b = blocksToPush[i];
            world.setBlockAt(b.x + dx, b.y + dy, b.z + dz, b.id, b.meta);
        }
        
        world.setBlockAt(x + dx, y + dy, z + dz, 332, dir | (this.isSticky ? 8 : 0));
        world.minecraft.soundManager.playSound("random.click", x + 0.5, y + 0.5, z + 0.5, 0.5, 1.2);
    }

    tryRetract(world, x, y, z, meta) {
        world.setBlockDataAt(x, y, z, meta & 7); 
        
        let dir = meta & 7;
        let dx = 0, dy = 0, dz = 0;
        if (dir === 0) dy = -1; else if (dir === 1) dy = 1; else if (dir === 2) dz = -1; else if (dir === 3) dz = 1; else if (dir === 4) dx = -1; else if (dir === 5) dx = 1;

        let headX = x + dx, headY = y + dy, headZ = z + dz;

        if (world.getBlockAt(headX, headY, headZ) === 332) {
            world.setBlockAt(headX, headY, headZ, 0);
        }

        if (this.isSticky) {
            let tx = x + dx * 2, ty = y + dy * 2, tz = z + dz * 2;
            if (ty >= 0 && ty <= 127) {
                let id = world.getBlockAt(tx, ty, tz);
                let block = Block.getById(id);
                if (id !== 0 && id !== 7 && id !== 49 && id !== 332 && (!block || block.hardness >= 0) && (!block || !block.isContainer)) {
                     let m = world.getBlockDataAt(tx, ty, tz);
                     world.setBlockAt(tx, ty, tz, 0);
                     world.setBlockAt(headX, headY, headZ, id, m);
                }
            }
        }

        world.minecraft.soundManager.playSound("random.click", x + 0.5, y + 0.5, z + 0.5, 0.5, 0.8);
    }

    getCollisionBoundingBox(world, x, y, z) {
        if (!world) return this.boundingBox;
        
        let meta = world.getBlockDataAt(x, y, z);
        let extended = (meta & 8) !== 0;
        if (!extended) return this.boundingBox;

        let dir = meta & 7;
        // The base is 3/4th size when extended
        if (dir === 0) return new BoundingBox(0, 0.25, 0, 1, 1, 1);
        if (dir === 1) return new BoundingBox(0, 0, 0, 1, 0.75, 1);
        if (dir === 2) return new BoundingBox(0, 0, 0.25, 1, 1, 1);
        if (dir === 3) return new BoundingBox(0, 0, 0, 1, 1, 0.75);
        if (dir === 4) return new BoundingBox(0.25, 0, 0, 1, 1, 1);
        if (dir === 5) return new BoundingBox(0, 0, 0, 0.75, 1, 1);

        return this.boundingBox;
    }

    getBoundingBox(world, x, y, z) {
        return this.getCollisionBoundingBox(world, x, y, z);
    }
}

export class BlockPistonHead extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../redstonestuff.png";
        this.sound = Block.sounds.stone;
        this.name = "Piston Head";
        this.cols = 22;
    }

    getRenderType() {
        return BlockRenderType.PISTON_HEAD;
    }
    
    isSolid() { return false; }
    getOpacity() { return 0; }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        let meta = world.getBlockDataAt(x, y, z);
        let dir = meta & 7;
        let dx = 0, dy = 0, dz = 0;
        
        if (dir === 0) dy = 1;
        else if (dir === 1) dy = -1;
        else if (dir === 2) dz = 1;
        else if (dir === 3) dz = -1;
        else if (dir === 4) dx = 1;
        else if (dir === 5) dx = -1;

        let baseId = world.getBlockAt(x + dx, y + dy, z + dz);
        if (baseId !== 29 && baseId !== 30) {
            world.setBlockAt(x, y, z, 0);
        }
    }

    getBoundingBox(world, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let dir = meta & 7;
        // Head plate is at the "front" of the piston head block (farthest from base)
        if (dir === 0) return new BoundingBox(0, 0.0, 0, 1, 0.25, 1);
        if (dir === 1) return new BoundingBox(0, 0.75, 0, 1, 1.0, 1);
        if (dir === 2) return new BoundingBox(0, 0, 0.0, 1, 1, 0.25);
        if (dir === 3) return new BoundingBox(0, 0, 0.75, 1, 1, 1.0);
        if (dir === 4) return new BoundingBox(0.0, 0, 0, 0.25, 1, 1);
        if (dir === 5) return new BoundingBox(0.75, 0, 0, 1.0, 1, 1);
        return new BoundingBox(0,0,0,1,1,1);
    }
    
    getCollisionBoundingBox(world, x, y, z) {
        return this.getBoundingBox(world, x, y, z);
    }
}