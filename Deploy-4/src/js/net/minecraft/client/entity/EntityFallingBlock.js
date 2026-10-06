import Entity from "./Entity.js";
import BoundingBox from "../../util/BoundingBox.js";
import Block from "../world/block/Block.js";

export default class EntityFallingBlock extends Entity {
    static name = "EntityFallingBlock";

    constructor(minecraft, world, x, y, z, blockId, blockData = 0) {
        super(minecraft, world);
        this.blockId = blockId;
        this.blockData = blockData;
        
        // Small collision box for the entity itself
        this.width = 0.49;
        this.height = 0.98;
        
        this.setPosition(x, y, z);
        
        this.motionX = 0;
        this.motionY = 0;
        this.motionZ = 0;
        
        this.canBeCollidedWith = false;
        this.displayScale = 1.0; // Requirement for BlockDisplayRenderer
    }

    onUpdate() {
        super.onUpdate();

        // Apply gravity
        this.motionY -= 0.04;
        
        // Apply movement with collision
        this.move(this.motionX, this.motionY, this.motionZ);

        // Drag
        this.motionX *= 0.98;
        this.motionY *= 0.98;
        this.motionZ *= 0.98;

        // Anvil damage logic
        if (this.blockId === 167 && this.fallDistance > 1.0) {
            for (let entity of this.world.entities) {
                if (entity !== this && entity.canBeCollidedWith && entity.boundingBox.intersects(this.boundingBox)) {
                    // Anvils deal significant damage based on fall height
                    let damage = Math.ceil(this.fallDistance * 2.0);
                    if (typeof entity.takeHit === 'function') {
                        entity.takeHit(null, damage, "anvil");
                    }
                }
            }
        }

        // Check if we landed
        if (this.onGround) {
            let ix = Math.floor(this.x);
            let iy = Math.floor(this.y);
            let iz = Math.floor(this.z);

            // Attempt to turn back into a block
            const currentId = this.world.getBlockAt(ix, iy, iz);
            const targetBlock = Block.getById(this.blockId);
            
            // Allow replacing air or liquids
            if (currentId === 0 || Block.getById(currentId).isLiquid()) {
                this.world.setBlockAt(ix, iy, iz, this.blockId, this.blockData);
                
                // Play landing sound
                if (targetBlock) {
                    if (this.blockId === 167) {
                        this.minecraft.soundManager.playSound("random.anvil_land", this.x, this.y, this.z, 1.0, 1.0);
                    } else {
                        let sound = targetBlock.getSound();
                        this.minecraft.soundManager.playSound(sound.getStepSound(), this.x, this.y, this.z, 0.5, sound.getPitch());
                    }
                }
            } else {
                // If the landing spot is occupied, we could drop as an item, 
                // but for now we just let the entity vanish to avoid clutter.
            }
            
            this.world.removeEntityById(this.id);
        }

        this.setPosition(this.x, this.y, this.z);
    }

    /**
     * Simplified move method with collision detection
     */
    move(dx, dy, dz) {
        let boundingBoxList = this.world.getCollisionBoxes(this.boundingBox.expand(dx, dy, dz));

        for (const bb of boundingBoxList) {
            dy = bb.clipYCollide(this.boundingBox, dy);
        }
        this.boundingBox.move(0, dy, 0);

        for (const bb of boundingBoxList) {
            dx = bb.clipXCollide(this.boundingBox, dx);
        }
        this.boundingBox.move(dx, 0, 0);

        for (const bb of boundingBoxList) {
            dz = bb.clipZCollide(this.boundingBox, dz);
        }
        this.boundingBox.move(0, 0, dz);

        // Check if we hit the ground
        this.onGround = dy !== this.motionY && this.motionY < 0;

        if (dx !== this.motionX) this.motionX = 0;
        if (dy !== this.motionY) this.motionY = 0;
        if (dz !== this.motionZ) this.motionZ = 0;

        this.x = (this.boundingBox.minX + this.boundingBox.maxX) / 2.0;
        this.y = this.boundingBox.minY;
        this.z = (this.boundingBox.minZ + this.boundingBox.maxZ) / 2.0;
    }
}