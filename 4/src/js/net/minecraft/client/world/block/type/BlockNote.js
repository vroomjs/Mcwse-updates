import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";

export default class BlockNote extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../dicsandbox (1).png";
        this.textureIndex = 12;
        this.cols = 14;
        this.sound = Block.sounds.wood;
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: this.textureIndex, cols: this.cols };
    }

    onBlockActivated(world, x, y, z, player) {
        if (world.isRemote) return true;

        let meta = world.getBlockDataAt(x, y, z);
        let note = meta & 31;
        note = (note + 1) % 25; // 0-24 range
        
        world.setBlockDataAt(x, y, z, note);
        this.playNote(world, x, y, z);

        return true;
    }

    onBlockAdded(world, x, y, z) {
        this.checkRedstone(world, x, y, z);
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        this.checkRedstone(world, x, y, z);
    }

    checkRedstone(world, x, y, z) {
        let powered = world.getSavedLightValue(1, x, y, z) > 0 || this.isNeighborPowered(world, x, y, z);
        let te = world.getTileEntity(x, y, z);
        if (!te) {
            te = { lastPowered: false };
            world.setTileEntity(x, y, z, te);
        }

        if (powered && !te.lastPowered) {
            this.playNote(world, x, y, z);
        }
        
        te.lastPowered = powered;
        world.setTileEntity(x, y, z, te);
    }

    isNeighborPowered(world, x, y, z) {
        const offsets = [{x:1,y:0,z:0}, {x:-1,y:0,z:0}, {x:0,y:1,z:0}, {x:0,y:-1,z:0}, {x:0,y:0,z:1}, {x:0,y:0,z:-1}];
        for (let o of offsets) {
            let nx = x + o.x, ny = y + o.y, nz = z + o.z;
            let id = world.getBlockAt(nx, ny, nz);
            if (id === 152 || id === 76) return true;
            if (id === 69 && (world.getBlockDataAt(nx, ny, nz) & 8) !== 0) return true;
            if (id === 77 && (world.getBlockDataAt(nx, ny, nz) & 8) !== 0) return true;
            if (id === 72 && (world.getBlockDataAt(nx, ny, nz) & 1) !== 0) return true;
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
            if (id === 55 && world.getBlockDataAt(nx, ny, nz) > 0) return true;
        }
        return false;
    }

    playNote(world, x, y, z) {
        // Must have air above to play
        if (world.getBlockAt(x, y + 1, z) !== 0) return;

        let meta = world.getBlockDataAt(x, y, z);
        let note = meta & 31;
        
        // 1. Determine instrument based on block below
        let belowId = world.getBlockAt(x, y - 1, z);
        let instrument = "instrument.harp"; // Default (Air / Unlisted)
        let pitchOffset = 0; // Octave shifts
        let isPercussive = false;

        const woodBlocks = [5, 17, 200, 201, 209, 210, 235, 253, 304, 305, 47, 58, 64, 205, 219, 426, 427, 96, 224, 225, 226, 227];
        const stoneBlocks = [1, 4, 14, 15, 16, 21, 56, 73, 129, 153, 220, 221, 222, 45, 98, 97, 109, 108, 43, 61, 236];
        const sandBlocks = [12, 13];
        const woolBlocks = [208, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383];
        const glassBlocks = [20, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 123, 124];

        if (woodBlocks.includes(belowId)) {
            instrument = "instrument.bass";
            pitchOffset = -24; // F#1 -> F#3
        } else if (stoneBlocks.includes(belowId)) {
            instrument = "instrument.bd";
            isPercussive = true;
        } else if (sandBlocks.includes(belowId)) {
            instrument = "instrument.snare";
            isPercussive = true;
        } else if (glassBlocks.includes(belowId)) {
            instrument = "instrument.hat";
            isPercussive = true;
        } else if (belowId === 41) { // Gold Block
            instrument = "instrument.bell";
            pitchOffset = 24; // F#5 -> F#7
        } else if (belowId === 82) { // Clay
            instrument = "instrument.flute";
            pitchOffset = 12; // F#4 -> F#6
        } else if (belowId === 174) { // Packed Ice
            instrument = "instrument.icechime";
            pitchOffset = 24; // F#5 -> F#7
        } else if (woolBlocks.includes(belowId)) {
            instrument = "instrument.guitar";
            pitchOffset = -12; // F#2 -> F#4
        } else if (belowId === 352) { // Bone (Item check as proxy for Block)
            instrument = "instrument.xylobone";
            pitchOffset = 24; // F#5 -> F#7
        } else if (belowId === 42) { // Iron Block
            instrument = "instrument.iron_xylophone";
            pitchOffset = 0; // 0 -> 24
        } else if (belowId === 88) { // Soul Sand
            instrument = "instrument.cow_bell";
            pitchOffset = 6; // Mid-high
        } else if (belowId === 86 || belowId === 91) { // Pumpkin / Jack
            instrument = "instrument.didgeridoo";
            pitchOffset = -24; // F#1 -> F#3
        } else if (belowId === 133) { // Emerald Block
            instrument = "instrument.bit";
            pitchOffset = 0; // 0 -> 24
        } else if (belowId === 170) { // Hay Bale
            instrument = "instrument.banjo";
            pitchOffset = 0; // 0 -> 24
        } else if (belowId === 89) { // Glowstone
            instrument = "instrument.pling";
            pitchOffset = 0; // 0 -> 20 (mapped via note cap)
            if (note > 20) note = 20; 
        }

        // 2. Calculate Pitch Multiplier (0.5 to 2.0 base)
        let pitchMultiplier = 1.0;
        if (!isPercussive) {
            // Note 12 is center (1.0 pitch), each +/- 12 is an octave (2.0 or 0.5)
            pitchMultiplier = Math.pow(2, (note + pitchOffset - 12) / 12);
        }

        // 3. Play Sound
        world.minecraft.soundManager.playSound(instrument, x + 0.5, y + 1.2, z + 0.5, 3.0, pitchMultiplier);

        // 4. Spawn Note Particle
        if (world.minecraft.particleManager) {
            world.minecraft.particleManager.spawnNoteParticles(world, x + 0.5, y + 1.2, z + 0.5);
        }
    }
}
