import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import GuiCommandBlock from "../../../gui/screens/GuiCommandBlock.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockCommand extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../commandblock.png";
        this.sound = Block.sounds.stone;
    }

    getRenderType() {
        return BlockRenderType.COMMAND_BLOCK;
    }

    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        // Direction: 0=S, 1=W, 2=N, 3=E
        let direction = Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3;
        // Invert to face player
        world.setBlockDataAt(x, y, z, (direction + 2) & 3);
    }

    onBlockActivated(world, x, y, z, player) {
        if (player.gameMode !== 1) return false; // Only creative can edit

        let te = world.getTileEntity(x, y, z);
        if (!te) {
            te = { command: "", lastPowered: false };
            world.setTileEntity(x, y, z, te);
        }

        world.minecraft.displayScreen(new GuiCommandBlock(player, x, y, z, te));
        return true;
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        this.checkRedstone(world, x, y, z);
    }

    checkRedstone(world, x, y, z) {
        let powered = world.getSavedLightValue(1, x, y, z) > 0 || this.isNeighborPowered(world, x, y, z);
        
        let te = world.getTileEntity(x, y, z);
        if (!te) {
            te = { command: "", lastPowered: false };
            world.setTileEntity(x, y, z, te);
        }

        if (powered && !te.lastPowered) {
            // Trigger Command
            if (te.command && te.command.length > 0) {
                world.minecraft.commandHandler.handleMessage(te.command);
            }
        }
        
        te.lastPowered = powered;
        // No need to setTileEntity again if we modify the object reference, 
        // but for safety/multiplayer sync:
        world.setTileEntity(x, y, z, te);
    }

    isNeighborPowered(world, x, y, z) {
        const offsets = [
            {x:1,y:0,z:0}, {x:-1,y:0,z:0},
            {x:0,y:1,z:0}, {x:0,y:-1,z:0},
            {x:0,y:0,z:1}, {x:0,y:0,z:-1}
        ];
        for (let o of offsets) {
            let nx = x + o.x, ny = y + o.y, nz = z + o.z;
            let id = world.getBlockAt(nx, ny, nz);
            if (id === 152) return true; // Redstone block
            if (id === 69 && (world.getBlockDataAt(nx, ny, nz) & 8) !== 0) return true; // Lever
            if (id === 77 && (world.getBlockDataAt(nx, ny, nz) & 8) !== 0) return true; // Button
            if (id === 72 && (world.getBlockDataAt(nx, ny, nz) & 1) !== 0) return true; // Plate
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
            if (id === 55 && world.getBlockDataAt(nx, ny, nz) > 0) return true; // Redstone dust
        }
        return false;
    }
}