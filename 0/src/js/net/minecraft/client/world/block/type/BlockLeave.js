import Block from "../Block.js";
import { BlockRegistry } from "../BlockRegistry.js";
import DroppedItem from "../../../entity/DroppedItem.js";

export default class BlockLeave extends Block {

    constructor(id, textureName, textureIndex = 0, cols = 1, colorOverride = null) {
        super(id, 0);

        this.textureName = textureName;
        this.textureIndex = textureIndex;
        this.cols = cols;
        this.colorOverride = colorOverride;

        // Sound
        this.sound = Block.sounds.grass;
        this.decayTime = 50; // 2.5 seconds * 20 ticks
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: this.textureIndex, cols: this.cols };
    }

    getColor(world, x, y, z, face) {
        if (this.colorOverride !== null) {
            return this.colorOverride;
        }

        // Inventory items have a default color
        if (world === null) {
            return 0x48b518;
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

        return (r << 16) | (g << 8) | b;
    }

    isSolid() {
        return false;
    }

    getCollisionBoundingBox(world, x, y, z) {
        return this.boundingBox;
    }

    getOpacity() {
        if (typeof window !== 'undefined' && window.app && window.app.settings.optimizedLeaves) {
            return 1.0;
        }
        return 0.3;
    }





    shouldRenderFace(world, x, y, z, face) {
        // Always render leaf faces to prevent culling issues with touching blocks
        return true;
    }

    onBlockAdded(world, x, y, z) {
        world.scheduleBlockUpdate(x, y, z, 10);
    }

    onBlockPlaced(world, x, y, z, face) {
        // Bit 4 indicates the block was placed by a player and should not decay
        let meta = world.getBlockDataAt(x, y, z);
        world.setBlockDataAt(x, y, z, meta | 4);
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        world.scheduleBlockUpdate(x, y, z, 10);
    }

    updateTick(world, x, y, z) {
        let meta = world.getBlockDataAt(x, y, z);

        // If the persistent bit (4) is set, never decay
        if ((meta & 4) !== 0) {
            return;
        }

        if (!this.checkSupport(world, x, y, z)) {
            let decaying = (meta & 8) !== 0; // Use bit 8 as decay flag

            if (!decaying) {
                // Mark as decaying and add to the world's sequential decay queue
                world.setBlockDataAt(x, y, z, meta | 8);
                if (typeof world.queueLeafDecay === "function") {
                    world.queueLeafDecay(x, y, z);
                } else {
                    world.leafDecayQueue.push({x, y, z});
                }
            }
        } else {
            // Supported. If marked decaying, unmark.
            if ((meta & 8) !== 0) {
                world.setBlockDataAt(x, y, z, meta & ~8);
                // The world tick handler will filter out supported leaves from the queue
            }
            // Occasionally re-check support (1-2 minutes)
            world.scheduleBlockUpdate(x, y, z, 1200 + (world.random ? world.random.nextInt(600) : 0));
        }
    }

    destroy(world, x, y, z) {
        world.setBlockAt(x, y, z, 0);
        
        // Leaf Drops
        // 5% Sapling
        if (Math.random() < 0.05) {
             let item = new DroppedItem(world, x+0.5, y+0.5, z+0.5, BlockRegistry.OAK_SAPLING.getId(), 1);
             world.droppedItems.push(item);
        }
        // 2% Stick
        if (Math.random() < 0.02) {
             let item = new DroppedItem(world, x+0.5, y+0.5, z+0.5, 280, 1);
             world.droppedItems.push(item);
        }
        // 0.5% Apple
        if (Math.random() < 0.005) {
             let item = new DroppedItem(world, x+0.5, y+0.5, z+0.5, BlockRegistry.APPLE.getId(), 1);
             world.droppedItems.push(item);
        }
    }

    checkSupport(world, x, y, z) {
        // Check for logs within radius 4
        const range = 4;
        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                for (let dz = -range; dz <= range; dz++) {
                    if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 6) continue;
                    
                    let id = world.getBlockAt(x + dx, y + dy, z + dz);
                    // Support all known log types (Oak, Birch, Spruce, Acacia, Dark Oak)
                    if (id === 17 || id === 200 || id === 209 || id === 235 || id === 253) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
