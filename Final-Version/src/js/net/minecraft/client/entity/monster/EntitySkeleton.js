import Mob from "/src/js/net/minecraft/client/entity/Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import EntityArrow from "../EntityArrow.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";
import DroppedItem from "../DroppedItem.js";
import Vector3 from "../../../util/Vector3.js";

export default class EntitySkeleton extends Mob {
    static name = "EntitySkeleton";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.modelName = "skelton.gltf";
        this.mobSoundPrefix = "mob.skeleton";
        this.baseWidth = 0.48; // Increased 60%
        this.baseHeight = 3.18; // Increased 60%
        this.health = 20;
        this.attackTimer = 0;
        this.hurtTime = 0;
        this.deathTime = 0;
        this.stepHeight = 0.5;


        
        this.strafeTimer = 0;
        this.strafeDir = 0;
        this.isAiming = false;

        this.setPosition(this.x, this.y, this.z);
    }

    setPosition(x, y, z) {
        let width = Math.max(0.1, this.baseWidth + (this.attributeScale * 0.25));
        let height = Math.max(0.1, this.baseHeight + (this.attributeScale * 0.5));

        this.x = x;
        this.y = y;
        this.z = z;

        let w = width / 2;
        this.boundingBox = new BoundingBox(
            x - w, y, z - w,
            x + w, y + height, z + w
        );
    }

    onLivingUpdate() {
        if (this.isRemote) {
            return super.onLivingUpdate();
        }

        if (this.health <= 0) {
            this.deathTime++;
            if (this.deathTime === 1) {
                this.playMobSound("death");
            }
            if (this.deathTime >= 20) {
                this.world.removeEntityById(this.id);
            }
            this.motionX = 0; 
            this.motionZ = 0; 
            this.moveForward = 0;
            this.moveStrafing = 0;
            return;
        }

        if (this.hurtTime > 0) this.hurtTime--;
        if (this.attackTimer > 0) this.attackTimer--;

        // Daylight burning check
        if (!this.isRemote && this.world.dimension === 0 && this.world.skylightSubtracted < 4) {
            const inWater = this.isInWater();
            const hasHelmet = this.inventory && this.inventory.getArmor(0).id !== 0;

            if (!inWater && !hasHelmet && this.world.isAboveGround(this.x, this.y, this.z)) {
                this.remainingFireTicks = 100;
            }
        }

        const player = this.world.minecraft.player;
        const dist = this.getDistanceToEntity(player);

        if (dist < 16 && player.health > 0 && player.gameMode !== 1 && player.gameMode !== 3) {
            this.isAiming = true;
            this.faceEntity(player, 30, 30);
            this.nextMoveUpdate = this.ticksExisted + 20; // Delay random walking
            
            // Strafe / Move logic
            if (dist > 10) {
                // Too far, move closer
                this.navigateTo(player.x, player.y, player.z, 1.0);
                this.strafeDir = 0;
            } else if (dist < 4) {
                // Too close, back away (direct logic works for backing away usually)
                this.moveForward = -0.15; 
                this.strafeDir = 0;
                this.currentPath = null;
            } else {
                this.moveForward = 0;
                // Random strafing to keep moving/animating while shooting
                if (this.strafeTimer > 0) {
                    this.strafeTimer--;
                } else {
                    this.strafeTimer = 20 + Math.floor(Math.random() * 40);
                    this.strafeDir = (Math.random() > 0.5 ? 1 : -1) * 0.2;
                    if (Math.random() < 0.3) this.strafeDir = 0; // Pause occasionally
                }
                this.moveStrafing = this.strafeDir;
            }

            // Shoot
            if (this.attackTimer === 0 && this.canEntityBeSeen(player)) {
                this.attackEntityWithRangedAttack(player);
                this.attackTimer = 40 + this.world.random.nextInt(20); // 2-3 seconds
            }
        } else {
            this.isAiming = false;
            // Idle wander handled by super
            // Ensure rotation matches if wandering
            this.rotationYawHead = this.rotationYaw;
        }
        
        super.onLivingUpdate();
    }

    getAnimationName() {
        if (this.isAiming) {
            return "aim";
        }
        // Consistent movement threshold
        let isMoving = Math.abs(this.x - this.prevX) > 0.01 || Math.abs(this.z - this.prevZ) > 0.01;
        return isMoving ? "walk" : "idle";
    }

    updateBodyRotation() {
        this.renderYawOffset = this.rotationYaw;
        this.rotationYawHead = this.rotationYaw;
    }

    attackEntityWithRangedAttack(target) {
        let arrow = new EntityArrow(this.minecraft, this.world);
        arrow.owner = this;
        
        // 25% less damage
        arrow.damage = 3.0; 

        const diff = this.minecraft.settings.difficulty;
        if (diff === 1) arrow.damage *= 0.7;
        if (diff === 3) arrow.damage *= 1.25;
        
        // Position at eye height
        let eyeY = this.y + this.getEyeHeight();
        // Offset slightly forward
        let yawRad = this.rotationYaw * Math.PI / 180;
        let offset = 0.5;
        arrow.setPosition(
            this.x - Math.sin(yawRad) * offset, 
            eyeY - 0.1, 
            this.z + Math.cos(yawRad) * offset
        );
        
        // Calculate velocity to target
        let dx = target.x - this.x;
        let dy = (target.y + target.getEyeHeight() - 1.1) - arrow.y;
        let dz = target.z - this.z;
        let dist = Math.sqrt(dx*dx + dz*dz);
        
        let velocity = 1.6;
        // Add some inaccuracy
        let inaccuracy = 0.1;
        
        // Ensure no division by zero if entities overlap exactly on XZ
        let safeDist = Math.max(0.1, dist);

        arrow.motionX = (dx / safeDist) * velocity + (Math.random() - 0.5) * inaccuracy;
        arrow.motionZ = (dz / safeDist) * velocity + (Math.random() - 0.5) * inaccuracy;
        arrow.motionY = (dy / safeDist * velocity) + 0.2; // Arc
        
        this.world.addEntity(arrow);
        this.minecraft.soundManager.playSound("random.bow", this.x, this.y, this.z, 1.0, 1.0 / (Math.random() * 0.4 + 0.8));
        
        // Visual swing (optional)
        this.swingArm();
    }
    
    getDistanceToEntity(entity) {
        let dx = this.x - entity.x;
        let dy = this.y - entity.y;
        let dz = this.z - entity.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
    
    faceEntity(entity, maxYaw, maxPitch) {
        let dx = entity.x - this.x;
        let dz = entity.z - this.z;
        let dy = (entity.y + entity.getEyeHeight()) - (this.y + this.getEyeHeight());
        let dist = Math.sqrt(dx*dx + dz*dz);
        let yaw = (Math.atan2(dz, dx) * 180.0 / Math.PI) - 90.0;
        let pitch = -(Math.atan2(dy, dist) * 180.0 / Math.PI);
        
        // Smooth rotation
        let diff = yaw - this.rotationYaw;
        while (diff < -180) diff += 360;
        while (diff >= 180) diff -= 360;
        this.rotationYaw += diff * 0.3;
        
        this.rotationPitch = pitch;
        this.rotationYawHead = this.rotationYaw;
    }
    
    canEntityBeSeen(entity) {
        let eyes = new Vector3(this.x, this.y + this.getEyeHeight(), this.z);
        let targetEyes = new Vector3(entity.x, entity.y + entity.getEyeHeight(), entity.z);
        return this.world.rayTraceBlocks(eyes, targetEyes, false) === null;
    }

    getAIMoveSpeed() {
        return 0.1 * this.speedMultiplier;
    }

    takeHit(fromEntity, damage) {
        if (!super.takeHit(fromEntity, damage)) return;

        if (fromEntity) {
            let dx = fromEntity.x - this.x;
            let dz = fromEntity.z - this.z;
            let mag = Math.sqrt(dx * dx + dz * dz);
            if (mag > 0) {
                this.motionX = (dx / mag) * 0.44; // Increased 10%
                this.motionZ = (dz / mag) * 0.44; // Increased 10%
                this.motionY = 0.2;
            }
        }

        this.playMobSound("hurt");
        
        if (this.health <= 0) {
            this.deathTime = 0;
            
            // Drop Bones
            let r = Math.random();
            let boneCount = 1;
            if (r < 0.65) boneCount = 1;
            else if (r < 0.90) boneCount = 2; // 65 + 25 = 90
            else boneCount = 3;

            let drop = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.BONE.getId(), boneCount);
            this.world.droppedItems.push(drop);

            // Drop Bow (20% chance)
            if (Math.random() < 0.20) {
                let bow = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.BOW.getId(), 1);
                this.world.droppedItems.push(bow);
            }
        }
    }
}


