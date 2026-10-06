import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import { BlockRegistry } from "../BlockRegistry.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockSponge extends Block {
    constructor(id, isWet) {
        super(id, 0);
        this.textureName = "../../newblocksset1.png";
        this.textureIndex = isWet ? 1 : 0;
        this.cols = 9;
        this.isWet = isWet;
        this.sound = Block.sounds.sand;
        this.name = isWet ? "Wet Sponge" : "Sponge";
    }

    getRenderType() {
        return BlockRenderType.BLOCK;
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: this.textureIndex, cols: 9 };
    }

    onBlockAdded(world, x, y, z) {
        if (!this.isWet) {
            this.tryAbsorb(world, x, y, z);
        }
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        if (!this.isWet) {
            this.tryAbsorb(world, x, y, z);
        }
    }

    tryAbsorb(world, x, y, z) {
        if (this.isWet) return;

        let absorbed = false;
        const radius = 3; // 7x7x7 radius centered on block

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    const tx = x + dx;
                    const ty = y + dy;
                    const tz = z + dz;

                    const id = world.getBlockAt(tx, ty, tz);
                    // Check for water (ID 9) or any water variant
                    if (id === 9 || id === 8) {
                        // Use silent placement for the batch to improve performance
                        world.setBlockAt(tx, ty, tz, 0, 0, true);
                        absorbed = true;
                    }
                }
            }
        }

        if (absorbed) {
            // Turn into wet sponge
            world.setBlockAt(x, y, z, 561, 0);
            
            // Visual/Audio feedback
            if (world.minecraft) {
                world.minecraft.soundManager.playSound("random.fizz", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
            }

            // After 1 second (20 ticks), notify neighbors so water begins to flow again
            // Standard Minecraft water usually flows back immediately, but user specifically asked for a delay.
            // Using world.scheduleBlockUpdate is tricky since air doesn't tick. 
            // Instead, we manually trigger neighbor updates on a delay.
            setTimeout(() => {
                if (!world || world.dimension !== world.dimension) return; // World safety check
                
                // Re-calculate lighting and trigger neighbor updates for the hollow area
                world.updateLight(0, x - radius, y - radius, z - radius, x + radius, y + radius, z + radius);
                
                // Trigger flow check for all air blocks on the boundary of the cleared cube
                for (let dx = -radius - 1; dx <= radius + 1; dx++) {
                    for (let dy = -radius - 1; dy <= radius + 1; dy++) {
                        for (let dz = -radius - 1; dz <= radius + 1; dz++) {
                            // Only edges of the 7x7x7 cube (expanded to 9x9x9 to catch flowing water)
                            const isEdge = Math.abs(dx) === radius + 1 || Math.abs(dy) === radius + 1 || Math.abs(dz) === radius + 1;
                            if (isEdge) {
                                world.notifyNeighborsOfStateChange(x + dx, y + dy, z + dz, 0);
                            }
                        }
                    }
                }
                
                if (world.minecraft && world.minecraft.worldRenderer) {
                    world.minecraft.worldRenderer.flushRebuild = true;
                }
            }, 1000);
        }
    }
}