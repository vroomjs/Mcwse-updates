import Mob from "/src/js/net/minecraft/client/entity/Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";

export default class EntitySlime extends Mob {
    static name = "EntitySlime";

    constructor(minecraft, world, size = 4) {
        super(minecraft, world);
        this.size = size; // 4: Large, 2: Medium, 1: Small
        this.modelName = "slime.gltf";
        this.mobSoundPrefix = "mob.slime";
        
        this.jumpTimer = 20 + Math.floor(Math.random() * 20);
        this.squish = 0;
        
        // Base dimensions (approx Small size) - Increased another 80%
        this.baseWidth = 0.5625;
        this.baseHeight = 1.17;
        
        this.updateSize();
    }

    updateSize() {
        // Large (4) -> ~1.0 radius, Medium (2) -> ~0.5 radius, Small (1) -> ~0.25 radius
        this.width = this.baseWidth * this.size;
        this.height = this.baseHeight * this.size;
        
        // HP: Large=16, Medium=4, Small=1
        this.health = this.size === 4 ? 16 : (this.size === 2 ? 4 : 1);
        
        this.setPosition(this.x, this.y, this.z);
    }

    onLivingUpdate() {
        if (this.isRemote) {
            return super.onLivingUpdate();
        }

        if (this.health <= 0) {
            this.deathTime++;
            if (this.deathTime === 1) this.playMobSound("death");
            if (this.deathTime >= 20) {
                this.split();
                this.world.removeEntityById(this.id);
            }
            // Stop movement while dying
            this.motionX = 0;
            this.motionZ = 0;
            this.moveForward = 0;
            this.moveStrafing = 0;
            return;
        }

        const player = this.minecraft.player;
        const dist = this.getDistanceToEntity(player);

        // Always face player if nearby
        if (dist < 16) {
            this.faceLocation(player.x, player.z, 30, 30);
        }

        if (this.onGround) {
            // Return to normal shape on ground
            this.squish += (0.0 - this.squish) * 0.4;
            
            if (this.jumpTimer > 0) {
                this.jumpTimer--;
                this.moveForward = 0;
            } else {
                // Determine next jump interval
                this.jumpTimer = 10 + Math.floor(Math.random() * 30);
                this.jump();
                
                // Move forward during the jump launch
                if (dist < 16) {
                    let yawRad = this.rotationYaw * Math.PI / 180;
                    let speed = 0.09 * this.size; // Increased jump movement distance
                    // Invert motion values because moveCollide negates them before applying
                    this.motionX = Math.sin(yawRad) * speed;
                    this.motionZ = -Math.cos(yawRad) * speed;
                }
            }
        } else {
            // Stretch in air
            this.squish += (1.0 - this.squish) * 0.1;
        }

        // Apply squish to scale for the renderer to pick up
        // landed: squish < 0 (wider, shorter), in air: squish > 0 (thinner, taller)
        let s = this.size * 0.9;
        this.scaleX = s * (1.0 + this.squish * 0.35); // Increased squish
        this.scaleY = s * (1.0 - this.squish * 0.5);  // Increased squish
        this.scaleZ = s * (1.0 + this.squish * 0.35);

        // Collision damage (Large and Medium stages only)
        // Fixed: Ensure the check triggers even if the player is just beside the slime
        if (this.size > 1) {
            if (this.boundingBox.grow(0.2, 0.1, 0.2).intersects(player.boundingBox) && this.ticksExisted % 10 === 0) {
                // Large deals 2 hearts (4), Medium deals 1 heart (2)
                player.takeHit(this, this.size === 4 ? 4 : 2);
                this.minecraft.soundManager.playSound("mob.slime.attack", this.x, this.y, this.z, 1.0, 1.0);
            }
        }

        super.onLivingUpdate();
    }

    jump() {
        this.motionY = 0.22 + (this.size * 0.05);
        this.squish = -0.6; // Initial impact compression visual
        
        const soundKey = this.size > 2 ? "mob.slime.big" : "mob.slime.small";
        this.minecraft.soundManager.playSound(soundKey, this.x, this.y, this.z, 1.0, 1.0);
    }

    split() {
        if (this.size <= 1) return;
        
        let nextSize = this.size / 2;
        let count = (this.size === 4) ? 2 : 4;
        
        for (let i = 0; i < count; i++) {
            let child = new EntitySlime(this.minecraft, this.world, nextSize);
            // Spawn children slightly randomized around parent
            child.setPosition(this.x + (Math.random() - 0.5) * 0.5, this.y + 0.5, this.z + (Math.random() - 0.5) * 0.5);
            this.world.addEntity(child);
        }
    }

    getAIMoveSpeed() {
        return 0; // Movement is handled via jump impulses
    }

    // Slimes always use idle "animation" since we handle visual hopping via scale/physics
    getAnimationName() {
        return "idle";
    }

    updateBodyRotation() {
        this.renderYawOffset = this.rotationYaw;
        this.rotationYawHead = this.rotationYaw;
    }

    takeHit(fromEntity, damage = 1) {
        if (!super.takeHit(fromEntity, damage)) return;
        this.playMobSound("hurt");

        if (this.health <= 0) {
            this.deathTime = 0;
        }

        if (fromEntity) {
            let dx = fromEntity.x - this.x;
            let dz = fromEntity.z - this.z;
            let mag = Math.sqrt(dx * dx + dz * dz);
            if (mag > 0) {
                this.motionX = (dx / mag) * 0.33; // Increased 10%
                this.motionZ = (dz / mag) * 0.33; // Increased 10%
                this.motionY = 0.15;
            }
        }
    }
}