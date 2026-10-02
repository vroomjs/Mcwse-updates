import BlockRenderType from "../../../util/BlockRenderType.js";
import EnumBlockFace from "../../../util/EnumBlockFace.js";
import MovingObjectPosition from "../../../util/MovingObjectPosition.js";
import BoundingBox from "../../../util/BoundingBox.js";

export default class Block {

    static blocks = [];

    static sounds = {};

    constructor(id, textureSlotId) {
        this.id = id;
        this.textureSlotId = textureSlotId;

        // Bounding box
        this.boundingBox = new BoundingBox(0.0, 0.0, 0.0, 1.0, 1.0, 1.0);

        // Default sound
        this.sound = Block.sounds.stone;

        // Register block
        Block.blocks[id] = this;

        this.name = "Block";
        this.maxStackSize = 64;
        this.maxDamage = 0;

        this.cols = 1;
        this.rows = 1;

        this.textureWidth = 0;
        this.textureHeight = 0;

        // Custom modded properties
        this.damageOnStand = 0;
        this.lightValue = 0;
        this.hardness = 1.0;

        // Modding Toggles
        this.isFoliage = false;
        this.isEnchanted = false;
        this.isClimbable = false;
        this.isContainer = false;
        this.containerName = "Container";
        this.isFood = false;
        this.hungerValue = 0;
        this.saturation = 0;

        // Multi-texture support
        this.customTextures = {
            top: null,
            bottom: null,
            side: null
        };

        // Overlay support for items (Potions, etc)
        this.overlayName = null;
        this.overlayIndex = -1;
        this.overlayColor = 0xFFFFFF;
    }

    static gravityIds = new Set([12, 13, 167]); // Sand, Gravel, Anvil

    hasGravity() {
        return Block.gravityIds.has(this.id);
    }

    getId() {
        return this.id;
    }

    setTextureSize(width, height) {
        this.textureWidth = width;
        this.textureHeight = height;
        return this;
    }

    setMaxStackSize(size) {
        this.maxStackSize = size;
        return this;
    }

    setMaxDamage(damage) {
        this.maxDamage = damage;
        return this;
    }

    getRenderType() {
        return BlockRenderType.BLOCK;
    }

    getTextureForFace(face, meta = 0) {
        return this.textureSlotId;
    }

    getTransparency() {
        return 0.0;
    }

    isTranslucent() {
        return this.getTransparency() > 0.0;
    }

    shouldRenderFace(world, x, y, z, face) {
        let typeId = world.getBlockAtFace(x, y, z, face);
        // If no block, render face
        if (typeId === 0) return true;

        // FIXED: Tech blocks (Light/Barrier) should never cull neighbor faces
        if (typeId >= 800 && typeId <= 816) return true;

        let neighbor = Block.getById(typeId);
        if (!neighbor) return true;

        // Special handling for translucent blocks to fix X-Ray culling issues
        const isNeighborTranslucent = neighbor.isTranslucent();
        const amITranslucent = this.isTranslucent();

        // If neighbor is translucent, we should always render our face (unless we are also translucent of the same type)
        // This fixes light leaking through block edges and seeing through walls via glass.
        if (isNeighborTranslucent) {
            // Cull shared faces between identical translucent blocks (e.g., connected glass)
            if (amITranslucent && neighbor.id === this.id) return false;
            return true;
        }

        // Only cull face if the neighbor is solid AND not translucent
        // We also check if the neighbor has a custom bounding box that is smaller than a full cube;
        // if it is smaller (like a slab), we MUST render our face to prevent a hole.
        if (neighbor.isSolid() && !neighbor.isTranslucent()) {
            const bb = neighbor.getBoundingBox(world, x + face.x, y + face.y, z + face.z);
            if (bb && bb.isFullCube()) {
                return false;
            }
        }

        return true;
    }

    getColor(world, x, y, z, face) {
        return 0xffffff;
    }

    getLightValue(world, x, y, z) {
        return this.lightValue;
    }

    isSolid() {
        return true;
    }

    getOpacity() {
        return 1.0;
    }

    canInteract() {
        return true;
    }

    isLiquid() {
        return false;
    }

    getSound() {
        return this.sound;
    }

    getBoundingBox(world, x, y, z) {
        return this.boundingBox;
    }

    getCollisionBoundingBox(world, x, y, z) {
        return this.isSolid() ? this.boundingBox : null;
    }

    onBlockAdded(world, x, y, z) {

    }

    onBlockPlaced(world, x, y, z, face) {

    }

    onBlockActivated(world, x, y, z, player) {
        if (this.isContainer) {
            import("../../gui/screens/GuiChest.js").then(module => {
                const gui = new module.default(player, x, y, z);
                // Dynamically override display string if needed
                if (this.containerName) {
                    // Logic to set gui name would go here
                }
                world.minecraft.displayScreen(gui);
            });
            return true;
        }
        return false;
    }

    onNeighborBlockChange(world, x, y, z, neighborId, fromX, fromY, fromZ) {

    }

    onDestroy(world, x, y, z) {

    }

    updateTick(world, x, y, z) {
        if (this.hasGravity()) {
            this.tryToFall(world, x, y, z);
        }
    }

    tryToFall(world, x, y, z) {
        // Prevent falling if this is the "One Block"
        if (world._gameType === 'oneblock' && world.oneBlock && 
            x === world.oneBlock.pos.x && y === world.oneBlock.pos.y && z === world.oneBlock.pos.z) {
            return;
        }

        if (y > 0 && this.canFallInto(world, x, y - 1, z)) {
            // Store current metadata
            let meta = world.getBlockDataAt(x, y, z);
            
            // Remove block from grid
            world.setBlockAt(x, y, z, 0);

            // Spawn FallingBlock entity to handle smooth physics and landing
            // Use dynamic import to prevent circular dependency at top-level
            import("../../entity/EntityFallingBlock.js").then(module => {
                const EntityFallingBlock = module.default;
                const fallingBlock = new EntityFallingBlock(world.minecraft, world, x + 0.5, y, z + 0.5, this.id, meta);
                world.addEntity(fallingBlock);
            });
        }
    }

    canFallInto(world, x, y, z) {
        let typeId = world.getBlockAt(x, y, z);
        if (typeId === 0) return true;

        let block = Block.getById(typeId);
        return block && block.isLiquid();
    }

    canPlaceBlockAt(world, x, y, z) {
        return true;
    }

    /**
     * Called when the item is used (right-clicked) on a block.
     * Return true if the action was consumed (preventing block placement).
     */
    onItemUse(world, x, y, z, face, player) {
        return false;
    }

    collisionRayTrace(world, x, y, z, start, end) {
        start = start.addVector(-x, -y, -z);
        end = end.addVector(-x, -y, -z);

        let vec3 = start.getIntermediateWithXValue(end, this.boundingBox.minX);
        let vec31 = start.getIntermediateWithXValue(end, this.boundingBox.maxX);
        let vec32 = start.getIntermediateWithYValue(end, this.boundingBox.minY);
        let vec33 = start.getIntermediateWithYValue(end, this.boundingBox.maxY);
        let vec34 = start.getIntermediateWithZValue(end, this.boundingBox.minZ);
        let vec35 = start.getIntermediateWithZValue(end, this.boundingBox.maxZ);

        if (!this.isVecInsideYZBounds(vec3)) {
            vec3 = null;
        }

        if (!this.isVecInsideYZBounds(vec31)) {
            vec31 = null;
        }

        if (!this.isVecInsideXZBounds(vec32)) {
            vec32 = null;
        }

        if (!this.isVecInsideXZBounds(vec33)) {
            vec33 = null;
        }

        if (!this.isVecInsideXYBounds(vec34)) {
            vec34 = null;
        }

        if (!this.isVecInsideXYBounds(vec35)) {
            vec35 = null;
        }

        let vec36 = null;
        if (vec3 != null && (vec36 == null || start.squareDistanceTo(vec3) < start.squareDistanceTo(vec36))) {
            vec36 = vec3;
        }
        if (vec31 != null && (vec36 == null || start.squareDistanceTo(vec31) < start.squareDistanceTo(vec36))) {
            vec36 = vec31;
        }
        if (vec32 != null && (vec36 == null || start.squareDistanceTo(vec32) < start.squareDistanceTo(vec36))) {
            vec36 = vec32;
        }
        if (vec33 != null && (vec36 == null || start.squareDistanceTo(vec33) < start.squareDistanceTo(vec36))) {
            vec36 = vec33;
        }
        if (vec34 != null && (vec36 == null || start.squareDistanceTo(vec34) < start.squareDistanceTo(vec36))) {
            vec36 = vec34;
        }
        if (vec35 != null && (vec36 == null || start.squareDistanceTo(vec35) < start.squareDistanceTo(vec36))) {
            vec36 = vec35;
        }

        if (vec36 == null) {
            return null;
        }

        let face = null;
        if (vec36 === vec3) {
            face = EnumBlockFace.WEST;
        }
        if (vec36 === vec31) {
            face = EnumBlockFace.EAST;
        }
        if (vec36 === vec32) {
            face = EnumBlockFace.BOTTOM;
        }
        if (vec36 === vec33) {
            face = EnumBlockFace.TOP;
        }
        if (vec36 === vec34) {
            face = EnumBlockFace.NORTH;
        }
        if (vec36 === vec35) {
            face = EnumBlockFace.SOUTH;
        }
        return new MovingObjectPosition(vec36.addVector(x, y, z), face, x, y, z);
    }

    /**
     * Checks if a vector is within the Y and Z bounds of the block.
     */
    isVecInsideYZBounds(point) {
        return point == null ? false : point.y >= this.boundingBox.minY
            && point.y <= this.boundingBox.maxY
            && point.z >= this.boundingBox.minZ
            && point.z <= this.boundingBox.maxZ;
    }

    /**
     * Checks if a vector is within the X and Z bounds of the block.
     */
    isVecInsideXZBounds(point) {
        return point == null ? false : point.x >= this.boundingBox.minX
            && point.x <= this.boundingBox.maxX
            && point.z >= this.boundingBox.minZ
            && point.z <= this.boundingBox.maxZ;
    }

    /**
     * Checks if a vector is within the X and Y bounds of the block.
     */
    isVecInsideXYBounds(point) {
        return point == null ? false : point.x >= this.boundingBox.minX
            && point.x <= this.boundingBox.maxX
            && point.y >= this.boundingBox.minY
            && point.y <= this.boundingBox.maxY;
    }

    static getById(typeId) {
        return Block.blocks[typeId];
    }
}
