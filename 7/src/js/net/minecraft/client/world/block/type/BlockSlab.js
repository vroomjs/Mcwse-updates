import Block from "../Block.js";
import BoundingBox from "../../../../util/BoundingBox.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

// Map slab ID to corresponding full block ID (filled in BlockRegistry.create)
let SLAB_TO_FULL_BLOCK = {};

export default class BlockSlab extends Block {

    constructor(id, texture, textureIndex = 0, cols = 1) {
        // If texture is a string, it's a texture name (single file). 
        // If number, it's an atlas index.
        // Pass 0 to super if string, we'll handle textureName manually.
        super(id, typeof texture === 'number' ? texture : 0);
        
        if (typeof texture === 'string') {
            this.textureName = texture;
            this.textureIndex = textureIndex;
            this.cols = cols;
        }
        
        // Default to bottom half bounding box
        this.boundingBox = new BoundingBox(0.0, 0.0, 0.0, 1.0, 0.5, 1.0);
        
        // Default sound
        this.sound = Block.sounds.wood;
        
        // Select sound based on texture
        const name = (this.textureName || "").toLowerCase();
        if (name.includes("stone") || name.includes("brick") || name.includes("cobble") || name.includes("sandstone")) {
            this.sound = Block.sounds.stone;
        } else if (typeof texture === 'number') {
            if (texture === 3 || texture === 4) this.sound = Block.sounds.stone;
        }
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0.0;
    }

    getRenderType() {
        return BlockRenderType.SLAB;
    }

    getTextureForFace(face) {
        if (this.textureName) {
            return {
                type: 'custom',
                name: this.textureName,
                index: this.textureIndex || 0,
                cols: this.cols || 1,
                rows: this.rows || 1
            };
        }
        return super.getTextureForFace(face);
    }

    onBlockActivated(world, x, y, z, player) {
        let heldId = player.inventory.getItemInSelectedSlot();
        let isHeldSlab = !!SLAB_TO_FULL_BLOCK[heldId];
        if (!isHeldSlab) return false;

        let meta = world.getBlockDataAt(x, y, z);
        let isTop = (meta & 8) !== 0;

        // Determine if we should combine based on which half was clicked
        let hitResult = player.rayTrace(5, 1.0, true);
        if (!hitResult) return false;

        let relativeHitY = hitResult.vector.y - hitResult.y;
        let combine = false;

        // If bottom slab, combine if we click top half or top face
        if (!isTop && (relativeHitY > 0.5 || hitResult.face === EnumBlockFace.TOP)) combine = true;
        // If top slab, combine if we click bottom half or bottom face
        if (isTop && (relativeHitY < 0.5 || hitResult.face === EnumBlockFace.BOTTOM)) combine = true;

        if (combine) {
            if (player.gameMode !== 1) player.inventory.consumeItem(heldId);
            player.swingArm();

            let soundName = this.sound.getStepSound();
            world.minecraft.soundManager.playSound(soundName, x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);

            if (heldId === this.id) {
                // Same type -> convert to corresponding full block
                let fullBlockId = SLAB_TO_FULL_BLOCK[this.id];
                world.setBlockAt(x, y, z, fullBlockId);
            } else {
                // Different types -> convert to Mixed Double Slab
                // Metadata: BottomID (12 bits) | TopID (12 bits)
                let bottomId = isTop ? heldId : this.id;
                let topId = isTop ? this.id : heldId;
                let mixedMeta = (bottomId & 0xFFF) | ((topId & 0xFFF) << 12);
                
                world.setBlockAt(x, y, z, 181, mixedMeta);
            }
            return true;
        }
        return false;
    }


    onBlockPlaced(world, x, y, z, face) {
        // This function is mostly overridden by logic in Minecraft.js to set metadata for slabs
        let meta = world.getBlockDataAt(x, y, z);
        
        // Only update metadata if it was set to the default (0) and there's logic to change it.
        // Minecraft.js calls setBlockAt with metadata, which then calls onBlockPlaced.
        // If the metadata was already set (e.g. meta 8 for top slab from Minecraft.js), we honor it.
        // If we place the block, the metadata is typically already handled, but we ensure consistency.
        
        // Since this method is mainly for complex blocks (like Door/Furnace orientation), 
        // we ensure the initial metadata set during placement (0 or 8) is persisted here if needed.
        // But since slab orientation is only vertical, we just ensure it gets set.
        // Meta 0: Bottom slab (default)
        // Meta 8: Top slab (set by Minecraft.js)
    }

    // Static helper function defined outside the class scope to access BlockRegistry later
    static setLinks(registry) {
        SLAB_TO_FULL_BLOCK = {};
        // Link all implemented slabs to their respective full blocks
        if (registry.WOODEN_SLAB && registry.WOOD) SLAB_TO_FULL_BLOCK[registry.WOODEN_SLAB.getId()] = registry.WOOD.getId();
        if (registry.COBBLESTONE_SLAB && registry.COBBLESTONE) SLAB_TO_FULL_BLOCK[registry.COBBLESTONE_SLAB.getId()] = registry.COBBLESTONE.getId();
        if (registry.STONE_SLAB && registry.STONE) SLAB_TO_FULL_BLOCK[registry.STONE_SLAB.getId()] = registry.STONE.getId();
        if (registry.BRICK_SLAB && registry.BRICK_BLOCK) SLAB_TO_FULL_BLOCK[registry.BRICK_SLAB.getId()] = registry.BRICK_BLOCK.getId();
        if (registry.SANDSTONE_SLAB && registry.SANDSTONE) SLAB_TO_FULL_BLOCK[registry.SANDSTONE_SLAB.getId()] = registry.SANDSTONE.getId();
        if (registry.CUT_SANDSTONE_SLAB && registry.CUT_SANDSTONE) SLAB_TO_FULL_BLOCK[registry.CUT_SANDSTONE_SLAB.getId()] = registry.CUT_SANDSTONE.getId();
        if (registry.BIRCH_SLAB && registry.BIRCH_PLANKS) SLAB_TO_FULL_BLOCK[registry.BIRCH_SLAB.getId()] = registry.BIRCH_PLANKS.getId();
        if (registry.SPRUCE_SLAB && registry.SPRUCE_PLANKS) SLAB_TO_FULL_BLOCK[registry.SPRUCE_SLAB.getId()] = registry.SPRUCE_PLANKS.getId();
        if (registry.QUARTZ_SLAB && registry.QUARTZ_BLOCK) SLAB_TO_FULL_BLOCK[registry.QUARTZ_SLAB.getId()] = registry.QUARTZ_BLOCK.getId();
        if (registry.SNOW_SLAB && registry.SNOW_BLOCK) SLAB_TO_FULL_BLOCK[registry.SNOW_SLAB.getId()] = registry.SNOW_BLOCK.getId();
        if (registry.GRANITE_SLAB && registry.GRANITE) SLAB_TO_FULL_BLOCK[registry.GRANITE_SLAB.getId()] = registry.GRANITE.getId();
        if (registry.DIORITE_SLAB && registry.DIORITE) SLAB_TO_FULL_BLOCK[registry.DIORITE_SLAB.getId()] = registry.DIORITE.getId();
        if (registry.ANDESITE_SLAB && registry.ANDESITE) SLAB_TO_FULL_BLOCK[registry.ANDESITE_SLAB.getId()] = registry.ANDESITE.getId();
        if (registry.SMOOTH_STONE_SLAB && registry.SMOOTH_STONE) SLAB_TO_FULL_BLOCK[registry.SMOOTH_STONE_SLAB.getId()] = registry.SMOOTH_STONE.getId();
    }


    getCollisionBoundingBox(world, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let isTop = (meta & 8) !== 0; // Top slab flag (bit 3)
        
        if (isTop) {
            return new BoundingBox(0.0, 0.5, 0.0, 1.0, 1.0, 1.0);
        } else {
            return this.boundingBox; // Default bottom half (0.0 to 0.5)
        }
    }
    
    getBoundingBox(world, x, y, z) {
        // Use full bounding box if no world context (inventory render)
        if (world === null) return this.boundingBox;

        return this.getCollisionBoundingBox(world, x, y, z);
    }

    static getSlabIdsFromMeta(meta) {
        return {
            bottom: meta & 0xFFF,
            top: (meta >> 12) & 0xFFF
        };
    }

    shouldRenderFace(world, x, y, z, face) {
        // Inventory
        if (world === null) return true;

        let meta = world.getBlockDataAt(x, y, z);
        let isTop = (meta & 8) !== 0;
        
        if (face === EnumBlockFace.TOP) {
            // Top face of a bottom slab is at Y=0.5, so it's internal and always visible
            if (!isTop) return true;
            return super.shouldRenderFace(world, x, y, z, face);
        } else if (face === EnumBlockFace.BOTTOM) {
            // Bottom face of a top slab is at Y=0.5, so it's internal and always visible
            if (isTop) return true;
            return super.shouldRenderFace(world, x, y, z, face);
        } else {
            // Side faces: cull if neighbor covers our half
            let neighborId = world.getBlockAtFace(x, y, z, face);
            if (neighborId !== 0) {
                let neighbor = Block.getById(neighborId);
                if (neighbor && neighbor.isSolid() && !neighbor.isTranslucent()) {
                    if (neighbor.getRenderType() === BlockRenderType.SLAB) {
                        let nMeta = world.getBlockDataAtFace(x, y, z, face);
                        if (isTop === ((nMeta & 8) !== 0)) return false; // Same half culls
                    } else {
                        return false; // Solid full block culls
                    }
                }
            }
            return true;
        }
    }
}

export class BlockDoubleSlab extends Block {
    constructor(id) {
        super(id, 0);
        this.sound = Block.sounds.stone;
    }

    getRenderType() {
        return BlockRenderType.DOUBLE_SLAB;
    }

    isSolid() {
        return true;
    }

    getOpacity() {
        return 1.0;
    }

    static getSlabIdsFromMeta(meta) {
        return {
            bottom: meta & 0xFFF,
            top: (meta >> 12) & 0xFFF
        };
    }
}

