import Block from "../Block.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";
import { BlockRegistry } from "../BlockRegistry.js";

export default class BlockGrass extends Block {

    constructor(id, textureSlotId) {
        super(id, textureSlotId);

        // Sound
        this.sound = Block.sounds.grass;
    }

    onBlockActivated(world, x, y, z, player) {
        let item = player.inventory.getItemInSelectedSlot();
        if (item === BlockRegistry.BONE_MEAL.getId()) {
            // Use Bonemeal
            if (player.gameMode !== 1) {
                player.inventory.consumeItem(item);
            }
            player.swingArm();
            
            // Grow foliage in radius
            // "6 by 6 block radius" -> interpret as radius 6 circle or box +/- 6
            let radius = 6;
            let chance = 0.8;

            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    for (let dy = -1; dy <= 1; dy++) { // Check slightly up/down slopes
                        let tx = x + dx;
                        let ty = y + dy;
                        let tz = z + dz;

                        if (world.getBlockAt(tx, ty, tz) === this.id && world.getBlockAt(tx, ty + 1, tz) === 0) {
                            if (Math.random() < chance) {
                                // Pick random plant: Grass (most likely), Dandelion, Rose
                                let plantType = BlockRegistry.FOLIAGE.getId(); // Default Tall Grass
                                let r = Math.random();
                                if (r < 0.1) plantType = BlockRegistry.DANDELION.getId();
                                else if (r < 0.15) plantType = BlockRegistry.ROSE.getId();
                                
                                world.setBlockAt(tx, ty + 1, tz, plantType);
                            }
                        }
                    }
                }
            }
            
            // Play sound
            world.minecraft.soundManager.playSound("item.bonemeal", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
            
            return true;
        }
        return false;
    }

    getColor(world, x, y, z, face) {
        // Check for forced snowy state (Bit 4: 16)
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        if ((meta & 16) !== 0) {
            return 0xFFFFFF; // Snowy look
        }

        // Only top face has a biome color
        if (face !== EnumBlockFace.TOP) {
            return 0xFFFFFF;
        }

        // Inventory items have a default color
        if (world === null) {
            return 0x72ad62;
        }

        let temperature = world.getTemperature(x, y, z);
        let humidity = world.getHumidity(x, y, z);
        let biomeColor = world.minecraft.grassColorizer.getColor(temperature, humidity);

        // Global color overrides
        const mode = world.minecraft.settings.foliageColorMode;
        let tintColor = biomeColor;
        if (mode === 'orange') tintColor = 0xd67d28;
        else if (mode === 'murky') tintColor = 0x4d5d2e;
        else if (mode === 'birch') tintColor = 0x88bb67;

        // Apply intensity blend
        const intensity = world.minecraft.settings.foliageColorIntensity / 100.0;
        
        let rB = (biomeColor >> 16) & 255, gB = (biomeColor >> 8) & 255, bB = biomeColor & 255;
        let rT = (tintColor >> 16) & 255, gT = (tintColor >> 8) & 255, bT = tintColor & 255;
        
        let r = Math.floor(rB + (rT - rB) * intensity);
        let g = Math.floor(gB + (gT - gB) * intensity);
        let b = Math.floor(bB + (bT - bB) * intensity);
        
        // Darken by 8% (0.92 multiplier)
        r = Math.floor(r * 0.92);
        g = Math.floor(g * 0.92);
        b = Math.floor(b * 0.92);
        
        return (r << 16) | (g << 8) | b;
    }

    getTextureForFace(face, meta = 0) {
        let isSnowy = (meta & 16) !== 0;
        switch (face) {
            case EnumBlockFace.TOP:
                return isSnowy ? { type: 'custom', name: '../../snowygrassblockside.png' } : 2;
            case EnumBlockFace.BOTTOM:
                return 0; // dirt
            default:
                return isSnowy ? { type: 'custom', name: '../../snowygrassblockside.png' } : 1;
        }
    }

}
