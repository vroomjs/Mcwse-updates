import Block from "./src/js/net/minecraft/client/world/block/Block.js";
import BlockRenderType from "./src/js/net/minecraft/util/BlockRenderType.js";
import BoundingBox from "./src/js/net/minecraft/util/BoundingBox.js";
import BlockItem from "./src/js/net/minecraft/client/world/block/type/BlockItem.js";

import BlockMineral from "./src/js/net/minecraft/client/world/block/type/BlockMineral.js";
import BlockTorch from "./src/js/net/minecraft/client/world/block/type/BlockTorch.js";

export class BlockRedstoneDust extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../redstonestuff.png"; 
        this.textureIndex = 1; // Dot sprite for inventory
        this.boundingBox = new BoundingBox(0.0, 0.0, 0.0, 1.0, 0.0625, 1.0);
        this.sound = Block.sounds.sand; 
        this.cols = 22;
    }

    getRenderType() {
        return BlockRenderType.REDSTONE_DUST;
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
        // Schedule first update
        world.scheduleBlockUpdate(x, y, z, 1);
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        if (!this.canPlaceBlockAt(world, x, y, z)) {
            world.setBlockAt(x, y, z, 0);
            return;
        }
        // Force update on any neighbor state change
        this.updateState(world, x, y, z);
    }

    updateTick(world, x, y, z) {
        this.updateState(world, x, y, z);
    }

    updateState(world, x, y, z) {
        let maxPower = 0;

        const getPowerAt = (bx, by, bz) => {
            const bid = world.getBlockAt(bx, by, bz);
            if (bid === 0) return 0;

            // 1. Direct Sources (Full 15)
            if (bid === 152 || bid === 76) return 15; // Redstone Block or Torch
            const m = world.getBlockDataAt(bx, by, bz);
            if ((bid === 69 || bid === 77 || bid === 223) && (m & 8) !== 0) return 15; // Lever/Button
            if ((bid === 72 || bid === 70) && (m & 1) !== 0) return 15; // Plate
            if (bid === 161 && (m & 8) !== 0) return 15; // Observer pulse

            // 2. Conduction through solid blocks (Conductor is at bx, by, bz)
            // If the target neighbor is a solid block, check if it's being powered from its other sides
            let block = Block.getById(bid);
            if (block && block.isSolid() && !block.isTranslucent()) {
                // Check 6 sides of the conductor block
                const dirs = [{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:-1,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1}];
                for (let d of dirs) {
                    let nx = bx + d.x, ny = by + d.y, nz = bz + d.z;
                    // Don't check the block we are currently evaluating power FOR
                    if (nx === x && ny === y && nz === z) continue;

                    let nid = world.getBlockAt(nx, ny, nz);
                    // Redstone Block or Torch strongly powers the block
                    if (nid === 152 || nid === 76) return 15;
                    // Redstone Wire below powers the block (Conduction check)
                    if (nid === 55 && ny === by - 1) return world.getBlockDataAt(nx, ny, nz);
                }
            }

            // 3. Wire propagation
            if (bid === 55) return m;
            
            return 0;
        };

        // 1. Check direct adjacent sources (6 directions)
        const adj = [{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:-1,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1}];
        for (let o of adj) {
            let p = getPowerAt(x + o.x, y + o.y, z + o.z);
            // Wire logic: neighbors power us at neighborPower - 1
            if (world.getBlockAt(x + o.x, y + o.y, z + o.z) === 55) p -= 1;
            if (p > maxPower) maxPower = p;
        }

        // 2. Check Slanting Connections (4 horizontal directions, up and down)
        const horiz = [{x:1,z:0},{x:-1,z:0},{x:0,z:1},{x:0,z:-1}];
        for (let o of horiz) {
            const nx = x + o.x, nz = z + o.z;
            
            // Slant Up: (nx, y+1, nz) if air above us
            if (world.getBlockAt(x, y + 1, z) === 0) {
                let p = getPowerAt(nx, y + 1, nz);
                if (world.getBlockAt(nx, y + 1, nz) === 55) p -= 1;
                if (p > maxPower) maxPower = p;
            }
            
            // Slant Down: (nx, y-1, nz) if air above neighbor
            if (world.getBlockAt(nx, y, nz) === 0) {
                let p = getPowerAt(nx, y - 1, nz);
                if (world.getBlockAt(nx, y - 1, nz) === 55) p -= 1;
                if (p > maxPower) maxPower = p;
            }
        }

        if (maxPower < 0) maxPower = 0;

        let currentPower = world.getBlockDataAt(x, y, z);
        if (currentPower !== maxPower) {
            world.setBlockDataAt(x, y, z, maxPower);
            
            // Notify neighbors so propagation continues
            for (let o of adj) {
                world.notifyBlockChange(x + o.x, y + o.y, z + o.z, this.id, x, y, z);
            }
            // Notify slanted neighbors
            for (let o of horiz) {
                world.notifyBlockChange(x + o.x, y + 1, z + o.z, this.id, x, y, z);
                world.notifyBlockChange(x + o.x, y - 1, z + o.z, this.id, x, y, z);
            }
            
            if (world.minecraft && world.minecraft.worldRenderer) {
                world.minecraft.worldRenderer.flushRebuild = true;
            }
        }
    }
}

export class BlockRedstoneBlock extends BlockMineral {
    constructor(id, textureIndex = 5) {
        super(id, "../../orestuff.png", textureIndex);
    }

    onBlockAdded(world, x, y, z) {
        // Power the blocks around it in the light map
        world.updateLight(1, x - 1, y - 1, z - 1, x + 1, y + 1, z + 1);
        world.notifyNeighborsOfStateChange(x, y, z, this.id);
    }

    onDestroy(world, x, y, z) {
        world.updateLight(1, x - 1, y - 1, z - 1, x + 1, y + 1, z + 1);
        world.notifyNeighborsOfStateChange(x, y, z, this.id);
    }
}

export class BlockRedstoneTorch extends BlockTorch {
    constructor(id, active) {
        super(id, 0);
        this.active = active;
        this.textureName = "../../redstonestuff.png";
        this.textureIndex = active ? 6 : 7;
        this.cols = 22;
        this.sound = Block.sounds.wood;
    }

    getRenderType() {
        return BlockRenderType.TORCH;
    }

    getLightValue(world, x, y, z) {
        return this.active ? 15 : 0;
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: this.textureIndex, cols: 22 };
    }

    onBlockAdded(world, x, y, z) {
        super.onBlockAdded(world, x, y, z);
        this.checkPower(world, x, y, z);
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        this.checkPower(world, x, y, z);
    }

    checkPower(world, x, y, z) {
        if (world.isRemote) return;
        
        let meta = world.getBlockDataAt(x, y, z) & 7;
        let dx = 0, dy = 0, dz = 0;
        
        if (meta === 1) dx = 1;
        else if (meta === 2) dx = -1;
        else if (meta === 3) dz = 1;
        else if (meta === 4) dz = -1;
        else if (meta === 5) dy = -1;

        const ax = x + dx, ay = y + dy, az = z + dz;

        // Check if attached block is powered (strongly or weakly)
        let isBlockPowered = world.getSavedLightValue(1, ax, ay, az) > 0;
        
        if (!isBlockPowered) {
            const neighbors = [{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:-1,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1}];
            for (let o of neighbors) {
                let id = world.getBlockAt(ax + o.x, ay + o.y, az + o.z);
                if (id === 152 || id === 76) { isBlockPowered = true; break; }
                let m = world.getBlockDataAt(ax + o.x, ay + o.y, az + o.z);
                if ((id === 69 || id === 77 || id === 223) && (m & 8) !== 0) { isBlockPowered = true; break; }
                if ((id === 72 || id === 70) && (m & 1) !== 0) { isBlockPowered = true; break; }
                if (id === 55 && world.getBlockDataAt(ax + o.x, ay + o.y, az + o.z) > 0) { isBlockPowered = true; break; }
            }
        }
        
        // Torch inversion logic: switch state if powered state differs
        if (isBlockPowered === this.active) {
            world.scheduleBlockUpdate(x, y, z, 2); 
        }
    }

    updateTick(world, x, y, z) {
        let meta = world.getBlockDataAt(x, y, z);
        let orientation = meta & 7;
        let dx = 0, dy = 0, dz = 0;
        if (orientation === 1) dx = 1;
        else if (orientation === 2) dx = -1;
        else if (orientation === 3) dz = 1;
        else if (orientation === 4) dz = -1;
        else if (orientation === 5) dy = -1;

        const ax = x + dx, ay = y + dy, az = z + dz;
        let isBlockPowered = world.getSavedLightValue(1, ax, ay, az) > 0;

        if (!isBlockPowered) {
            const neighbors = [{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:-1,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1}];
            for (let o of neighbors) {
                let id = world.getBlockAt(ax + o.x, ay + o.y, az + o.z);
                if (id === 152) { isBlockPowered = true; break; }
                let m = world.getBlockDataAt(ax + o.x, ay + o.y, az + o.z);
                if ((id === 69 || id === 77 || id === 223) && (m & 8) !== 0) { isBlockPowered = true; break; }
                if ((id === 72 || id === 70) && (m & 1) !== 0) { isBlockPowered = true; break; }
                if (id === 55 && world.getBlockDataAt(ax + o.x, ay + o.y, az + o.z) > 0) { isBlockPowered = true; break; }
            }
        }

        if (isBlockPowered && this.active) {
            world.setBlockAt(x, y, z, 75, meta); // Turn OFF (ID 75)
            this.notifyNeighbors(world, x, y, z);
        } else if (!isBlockPowered && !this.active) {
            world.setBlockAt(x, y, z, 76, meta); // Turn ON (ID 76)
            this.notifyNeighbors(world, x, y, z);
        }
    }

    notifyNeighbors(world, x, y, z) {
        world.updateLight(1, x - 1, y - 1, z - 1, x + 1, y + 1, z + 1);
        world.notifyNeighborsOfStateChange(x, y, z, this.id);
    }
}

export class BlockRedstoneLamp extends Block {
    constructor(id, active) {
        super(id, 0);
        this.active = active;
        this.textureName = "../../redstonestuff.png";
        this.textureIndex = active ? 5 : 4;
        this.cols = 22;
        this.sound = Block.sounds.glass;
    }

    getRenderType() {
        return BlockRenderType.MINERAL;
    }
    
    getLightValue(world, x, y, z) {
        return this.active ? 15 : 0;
    }

    onBlockAdded(world, x, y, z) {
        this.checkPower(world, x, y, z);
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        this.checkPower(world, x, y, z);
    }
    
    updateTick(world, x, y, z) {
        this.checkPower(world, x, y, z);
    }
    
    onRedstoneUpdate(world, x, y, z) {
        this.checkPower(world, x, y, z);
    }

    checkPower(world, x, y, z) {
        if (!world) return;
        
        let powered = false;
        
        const offsets = [
            {x: 1, y: 0, z: 0}, {x: -1, y: 0, z: 0},
            {x: 0, y: 0, z: 1}, {x: 0, y: 0, z: -1},
            {x: 0, y: 1, z: 0}, {x: 0, y: -1, z: 0}
        ];

        for (let off of offsets) {
            let bx = x + off.x, by = y + off.y, bz = z + off.z;
            let id = world.getBlockAt(bx, by, bz);
            
            // Redstone Block or Torch
            if (id === 152 || id === 76) {
                powered = true;
                break;
            }
            // Lever
            if (id === 69 && (world.getBlockDataAt(bx, by, bz) & 8) !== 0) {
                powered = true;
                break;
            }
            // Button
            if (id === 77 && (world.getBlockDataAt(bx, by, bz) & 8) !== 0) {
                powered = true;
                break;
            }
            // Pressure Plate
            if (id === 72 && (world.getBlockDataAt(bx, by, bz) & 1) !== 0) {
                powered = true;
                break;
            }
            // Observer
            if (id === 161) {
                let meta = world.getBlockDataAt(bx, by, bz);
                if ((meta & 8) !== 0) {
                    let dir = meta & 7;
                    let isOutputFacingMe = false;
                    if (dir === 0 && by + 1 === y) isOutputFacingMe = true;
                    else if (dir === 1 && by - 1 === y) isOutputFacingMe = true;
                    else if (dir === 2 && bz + 1 === z) isOutputFacingMe = true;
                    else if (dir === 3 && bz - 1 === z) isOutputFacingMe = true;
                    else if (dir === 4 && bx + 1 === x) isOutputFacingMe = true;
                    else if (dir === 5 && bx - 1 === x) isOutputFacingMe = true;
                    if (isOutputFacingMe) { powered = true; break; }
                }
            }
            // Powered Redstone Dust
            if (id === 55) {
                let power = world.getBlockDataAt(bx, by, bz);
                if (power > 0) {
                    powered = true;
                    break;
                }
            }
        }

        if (powered && !this.active) {
            world.setBlockAt(x, y, z, 124); // Lamp On
        } else if (!powered && this.active) {
            world.setBlockAt(x, y, z, 123); // Lamp Off
        }
    }
}

export class BlockRedstoneItem extends BlockItem {
    constructor(id) {
        super(id, "../../redstonestuff.png", 0);
        this.cols = 22;
    }

    onItemUse(world, x, y, z, face, player) {
        let tx = x + face.x;
        let ty = y + face.y;
        let tz = z + face.z;

        if (face.y === 1) {
             if (world.getBlockAt(tx, ty, tz) === 0) {
                 // Check support: Redstone dust needs a solid block below
                 let belowId = world.getBlockAt(tx, ty - 1, tz);
                 let belowBlock = Block.getById(belowId);
                 if (belowBlock && belowBlock.isSolid()) {
                     world.setBlockAt(tx, ty, tz, 55); // REDSTONE_DUST ID
                     world.minecraft.soundManager.playSound("step.sand", tx+0.5, ty+0.5, tz+0.5, 1.0, 1.0);
                     if (player.gameMode !== 1) player.inventory.consumeItem(this.id);
                     player.swingArm();
                     
                     if (world.minecraft.multiplayer && world.minecraft.multiplayer.connected) {
                         world.minecraft.multiplayer.onBlockChanged(tx, ty, tz, 55);
                     }
                     return true;
                 }
             }
        }
        return false;
    }
}

