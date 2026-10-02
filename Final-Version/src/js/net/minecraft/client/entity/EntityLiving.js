import Entity from "./Entity.js";
import MathHelper from "../../util/MathHelper.js";
import Block from "../world/block/Block.js";
import {BlockRegistry} from "../world/block/BlockRegistry.js";

export default class EntityLiving extends Entity {

    constructor(minecraft, world) {
        super(minecraft, world);

        this.jumpTicks = 0;

        this.jumping = false;
        this.flying = false; // Default false
        this.collision = false;

        this.moveForward = 0.0;
        this.moveStrafing = 0.0;

        this.swingProgress = 0;
        this.prevSwingProgress = 0;
        this.swingProgressInt = 0;
        this.isSwingInProgress = false;

        this.renderYawOffset = 0;
        this.rotationYawHead = 0;

        this.prevRotationYawHead = 0;
        this.prevRenderYawOffset = 0;

        this.limbSwingProgress = 0;
        this.limbSwingStrength = 0;
        this.prevLimbSwingStrength = 0;

        this.health = 20.0;
        this.stepHeight = 0.5; // Default step height
        this.deathTime = 0;

        this.canBeCollidedWith = true;

        // Attributes for /data and /attribute commands
        this.attributeScale = 0; // 0 = base
        this.speedMultiplier = 1.0;

        // Breeding & Aging
        this.isChild = false;
        this.growingAge = 0; // Negative = child, 0 = adult, Positive = breeding cooldown
        this.loveTimer = 0;

        // Base dimensions for scaling
        this.baseWidth = 0.4;
        this.baseHeight = 1.8;

        // Active status effects
        this.activeEffects = new Map();

        this.remainingFireTicks = 0;
    }

    pushEntities() {
        if (!this.world || !this.canBeCollidedWith) return;

        let list = this.world.entities;
        for (let i = 0; i < list.length; i++) {
            let entity = list[i];
            if (entity !== this && entity.canBeCollidedWith) {
                if (this.boundingBox.intersects(entity.boundingBox)) {
                    let dx = entity.x - this.x;
                    let dz = entity.z - this.z;
                    let dist = Math.sqrt(dx * dx + dz * dz);
                    
                    if (dist < 0.01) {
                        dx = Math.random() - 0.5;
                        dz = Math.random() - 0.5;
                        dist = Math.sqrt(dx * dx + dz * dz);
                    }
                    
                    dx /= dist;
                    dz /= dist;
                    
                    let force = 0.05;
                    // Note: moveCollide uses -motionX, so adding (other.x - this.x) results in moving away from other
                    this.motionX += dx * force;
                    this.motionZ += dz * force;
                }
            }
        }
    }

    setPosition(x, y, z) {
        // Calculate dimensions from attributes
        // Scale: 1 unit adds 0.5 blocks total (0.25 to radius)
        let width = Math.max(0.05, this.baseWidth + (this.attributeScale * 0.25));
        let height = Math.max(0.1, this.baseHeight + (this.attributeScale * 0.5));

        this.x = x;
        this.y = y;
        this.z = z;

        // The y parameter is for the feet. We build the hitbox up from there.
        this.boundingBox.minX = x - width;
        this.boundingBox.minY = y;
        this.boundingBox.minZ = z - width;
        this.boundingBox.maxX = x + width;
        this.boundingBox.maxY = y + height;
        this.boundingBox.maxZ = z + width;
    }

    addEffect(name, duration, amplifier = 0) {
        // Handle instant effects
        if (name === "instant_health") {
            let amount = 4 << amplifier;
            if (this.isUndead()) {
                this.takeHit(null, amount, "magic");
            } else {
                this.health = Math.min(this.maxHealth || 20, this.health + amount);
            }
            return;
        }
        if (name === "instant_damage") {
            let amount = 6 << amplifier;
            if (this.isUndead()) {
                this.health = Math.min(this.maxHealth || 20, this.health + (amount / 2));
            } else {
                this.takeHit(null, amount, "magic");
            }
            return;
        }

        this.activeEffects.set(name, { duration, amplifier });
    }

    isUndead() {
        const name = this.constructor.name;
        return name === "EntityZombie" || name === "EntitySkeleton" || name === "EntitySnowZombie" || name === "EntityHusk" || name === "EntityDrowned";
    }

    onUpdate() {
        super.onUpdate();

        // Handle group visibility for invisibility effect
        if (this.renderer && this.renderer.group) {
            const isInvisible = this.activeEffects.has("invisibility");
            // If it's the player, PlayerRenderer handles sub-mesh hiding to keep hands visible in 1st person.
            // For mobs, we hide the whole group.
            if (this.constructor.name !== "PlayerEntity") {
                this.renderer.group.visible = !isInvisible;
            }
        }

        // Tick effects
        for (let [name, effect] of this.activeEffects) {
            effect.duration--;

            // Effect Logic
            if (name === "poison") {
                // Poison deals 1 damage every 25 ticks per level, stops at 1 HP
                let interval = 25 >> effect.amplifier;
                if (interval < 1) interval = 1;
                if (this.ticksExisted % interval === 0 && this.health > 1) {
                    this.health--;
                    this.hurtTime = 10;
                    this.minecraft.soundManager.playSound("random.hurt", this.x, this.y, this.z, 0.5, 0.8);
                }
            }

            if (name === "regeneration") {
                // Regeneration restores 1 HP every 50 ticks per level
                let interval = 50 >> effect.amplifier;
                if (interval < 1) interval = 1;
                if (this.ticksExisted % interval === 0 && this.health < (this.maxHealth || 20)) {
                    this.health++;
                }
            }

            if (effect.duration <= 0) {
                this.activeEffects.delete(name);
                if (this === this.minecraft.player) {
                    this.minecraft.player.updateFOVModifier();
                }
            }
        }

        this.onLivingUpdate();

        // Fire damage logic
        if (this.remainingFireTicks > 0) {
            if (this.remainingFireTicks % 20 === 0) {
                let damage = 1.0;
                // Fire deals 40% less damage to mobs
                if (this.constructor.name !== "PlayerEntity" && this.constructor.name !== "RemotePlayerEntity") {
                    damage = 0.6;
                }
                this.takeHit(null, damage, "fire");
            }
            this.remainingFireTicks--;
        }

        this.updateBodyRotation();

        while (this.rotationYaw - this.prevRotationYaw < -180.0) {
            this.prevRotationYaw -= 360.0;
        }
        while (this.rotationYaw - this.prevRotationYaw >= 180.0) {
            this.prevRotationYaw += 360.0;
        }

        while (this.renderYawOffset - this.prevRenderYawOffset < -180.0) {
            this.prevRenderYawOffset -= 360.0;
        }
        while (this.renderYawOffset - this.prevRenderYawOffset >= 180.0) {
            this.prevRenderYawOffset += 360.0;
        }

        while (this.rotationPitch - this.prevRotationPitch < -180.0) {
            this.prevRotationPitch -= 360.0;
        }
        while (this.rotationPitch - this.prevRotationPitch >= 180.0) {
            this.prevRotationPitch += 360.0;
        }

        while (this.rotationYawHead - this.prevRotationYawHead < -180.0) {
            this.prevRotationYawHead -= 360.0;
        }
        while (this.rotationYawHead - this.prevRotationYawHead >= 180.0) {
            this.prevRotationYawHead += 360.0;
        }
    }

    onLivingUpdate() {
        if (this.health <= 0) {
            this.deathTime++;
            if (this.deathTime >= 20) {
                this.world.removeEntityById(this.id);
            }
            this.moveForward = 0;
            this.moveStrafing = 0;
            this.jumping = false;

            // Process gravity for falling corpse
            this.moveEntityWithHeading(0, 0);
            return;
        }

        if (this.hurtTime > 0) {
            this.hurtTime--;
        }

        if (this.jumpTicks > 0) {
            --this.jumpTicks;
        }

        // Stop if too slow
        if (Math.abs(this.motionX) < 0.003) {
            this.motionX = 0.0;
        }
        if (Math.abs(this.motionY) < 0.003) {
            this.motionY = 0.0;
        }
        if (Math.abs(this.motionZ) < 0.003) {
            this.motionZ = 0.0;
        }

        this.rotationYawHead = this.rotationYaw;

        // Reset jumping/sneaking to be set by inputs this tick
        let wasJumping = this.jumping;
        let wasSneaking = this.sneaking;

        // Automatic buoyancy for mobs (All non-player living entities float in water)
        if (this.isInWater() && this.constructor.name !== "PlayerEntity" && this.constructor.name !== "RemotePlayerEntity") {
            this.motionY += 0.04;
        }

        // Jump
        if (this.jumping) {
            if (this.isInWater()) {
                this.motionY += 0.04;
            } else if (this.onGround && this.jumpTicks === 0) {
                this.jump();
                this.jumpTicks = 10;
            }
        } else {
            this.jumpTicks = 0;
        }

        // Removed artificial decay on intention variables which caused "extended" movement feeling.
        // Intentional movement is handled by Input or AI every tick.
        this.pushEntities();
        this.moveEntityWithHeading(this.moveForward, this.moveStrafing);

        // Reset inputs for next tick
        this.jumping = false;
        // Sneaking reset removed to allow it to be persistent for rendering and camera logic
    }

    jump() {
        this.motionY = 0.42;
    }

    moveEntityWithHeading(moveForward, moveStrafing) {
        if (this.flying) {
            this.travelFlying(moveForward, 0, moveStrafing);
        } else {
            if (this.isInWater()) {
                // Is inside of water
                this.travelInWater(moveForward, 0, moveStrafing);
            } else {
                // Is on land
                this.travel(moveForward, 0, moveStrafing);
            }
        }

        this.prevLimbSwingStrength = this.limbSwingStrength;

        let motionX = this.x - this.prevX;
        let motionZ = this.z - this.prevZ;

        let distance = Math.sqrt(motionX * motionX + motionZ * motionZ) * 4.0;
        if (distance > 1.0) {
            distance = 1.0;
        }
        this.limbSwingStrength += (distance - this.limbSwingStrength) * 0.4;
        this.limbSwingProgress += this.limbSwingStrength;
    }

    travel(forward, vertical, strafe) {
        let prevSlipperiness = this.getBlockSlipperiness() * 0.91;

        let prevX = this.x;
        let prevZ = this.z;

        // Calculate friction
        let value = 0.16277136 / (prevSlipperiness * prevSlipperiness * prevSlipperiness);
        let friction;

        if (this.onGround) {
            friction = this.getAIMoveSpeed() * value;
        } else {
            friction = 0.02; // Air speed
        }

        // Check every block intersecting the mob's body so webs above its feet
        // still slow it down.
        const webBlockX = Math.floor(this.x);
        const webBlockZ = Math.floor(this.z);
        const minY = Math.floor(this.boundingBox.minY);
        const maxY = Math.floor(this.boundingBox.maxY - 0.0001);
        let isInWebOrBush = false;
        for (let blockY = minY; blockY <= maxY; blockY++) {
            const id = this.world.getBlockAt(webBlockX, blockY, webBlockZ);
            if (id === 571 || id === 574) {
                isInWebOrBush = true;
                break;
            }
        }

        if (isInWebOrBush) {
            friction *= 0.25; // Reduce input effectiveness by 75%
        }

        this.moveRelative(forward, vertical, strafe, friction);

        if (isInWebOrBush) {
            // Apply 75% total velocity reduction as requested
            this.motionX *= 0.25;
            this.motionZ *= 0.25;
            // Reduce vertical fall speed too
            if (!this.flying && this.motionY < 0) this.motionY *= 0.5;
        }

        // Get new speed
        let slipperiness = this.getBlockSlipperiness() * 0.91;

        // Move
        this.collision = this.moveCollide(-this.motionX, this.motionY, -this.motionZ);

        // Gravity
        if (!this.flying) {
            this.motionY -= 0.08;
        }

        // Decrease motion
        this.motionX *= slipperiness;
        this.motionY *= 0.98;
        this.motionZ *= slipperiness;

        // Step sound
        let blockX = MathHelper.floor(this.x);
        let blockY = MathHelper.floor(this.y - 0.1);
        let blockZ = MathHelper.floor(this.z);
        let typeId = this.world.getBlockAt(blockX, blockY, blockZ);

        let distanceX = this.x - prevX;
        let distanceZ = this.z - prevZ;
        let movedDist = Math.sqrt(distanceX * distanceX + distanceZ * distanceZ);

        // Only trigger step sounds if we are on the ground and not flying and actually moving
        if (this.onGround && !this.flying && movedDist > 0.001) {
            this.distanceWalked += movedDist * 0.6;
            if (this.distanceWalked > this.nextStepDistance && typeId !== 0) {
                this.nextStepDistance = this.distanceWalked + 1.0;

                // Silent mob check
                if (this.customName === "silent") return;

                let block = Block.getById(typeId);
                if (block) {
                    let sound = block.getSound();
                    if (!block.isLiquid()) {
                        // Play for player AND nearby entities to fix silent bug? 
                        // Prompt implied disabling step sounds for "silent" entities.
                        // Originally only player played step sounds locally. 
                        // If we want mobs to step (visually/audio), we usually rely on packets.
                        // But if this logic runs for mobs on client, we should mute it if silent.
                        if (this === this.minecraft.player) {
                            this.minecraft.soundManager.playSound(sound.getStepSound(), this.x, this.y, this.z, 0.10, sound.getPitch());
                        }
                    }
                }
            }
        } else {
            // While in air or stationary, we sync nextStepDistance so that landing 
            // doesn't trigger a burst of sounds if distanceWalked accumulated.
            this.nextStepDistance = this.distanceWalked + 1.0;
        }
    }

    travelInWater(forward, vertical, strafe) {
        let slipperiness = 0.8;
        let friction = 0.02;

        this.moveRelative(forward, vertical, strafe, friction);
        this.moveCollide(-this.motionX, this.motionY, -this.motionZ);

        this.motionX *= slipperiness;
        this.motionY *= 0.8;
        this.motionZ *= slipperiness;
        this.motionY -= 0.02;
    }

    travelFlying(forward, vertical, strafe) {
        let flySpeed = 0.05; // Base fly speed
        
        let prevMotionY = this.motionY;
        
        // Flying logic: similar to walking but without gravity and with vertical control
        if (this.sneaking) {
            this.motionY -= flySpeed * 3.0;
        }
        if (this.jumping) {
            this.motionY += flySpeed * 3.0;
        }

        this.moveRelative(forward, vertical, strafe, flySpeed);
        this.moveCollide(-this.motionX, this.motionY, -this.motionZ);

        this.motionX *= 0.6;
        this.motionY *= 0.6;
        this.motionZ *= 0.6;
    }

    moveRelative(forward, up, strafe, friction) {
        let distance = strafe * strafe + up * up + forward * forward;

        if (distance >= 0.0001) {
            distance = Math.sqrt(distance);

            if (distance < 1.0) {
                distance = 1.0;
            }

            distance = friction / distance;
            strafe = strafe * distance;
            up = up * distance;
            forward = forward * distance;

            let yawRadians = MathHelper.toRadians(this.rotationYaw + 180);
            let sin = Math.sin(yawRadians);
            let cos = Math.cos(yawRadians);

            this.motionX += strafe * cos - forward * sin;
            this.motionY += up;
            this.motionZ += forward * cos + strafe * sin;
        }
    }

    moveCollide(targetX, targetY, targetZ) {
        let originalTargetX = targetX;
        let originalTargetY = targetY;
        let originalTargetZ = targetZ;

        // Get level tiles as bounding boxes
        let boundingBoxList = this.world.getCollisionBoxes(this.boundingBox.expand(targetX, targetY, targetZ));

        // Move bounding box (Y axis)
        for (let aABB of boundingBoxList) {
            targetY = aABB.clipYCollide(this.boundingBox, targetY);
        }
        this.boundingBox.move(0.0, targetY, 0.0);

        // Move bounding box (X axis)
        for (let aABB of boundingBoxList) {
            targetX = aABB.clipXCollide(this.boundingBox, targetX);
        }
        this.boundingBox.move(targetX, 0.0, 0.0);

        // Move bounding box (Z axis)
        for (let aABB of boundingBoxList) {
            targetZ = aABB.clipZCollide(this.boundingBox, targetZ);
        }
        this.boundingBox.move(0.0, 0.0, targetZ);

        this.onGround = originalTargetY !== targetY && originalTargetY < 0.0;

        // Stop motion on collision
        if (originalTargetX !== targetX) {
            this.motionX = 0.0;
        }
        if (originalTargetY !== targetY) {
            this.motionY = 0.0;
        }
        if (originalTargetZ !== targetZ) {
            this.motionZ = 0.0;
        }

        // Update position
        let nextX = (this.boundingBox.minX + this.boundingBox.maxX) / 2.0;
        let nextY = this.boundingBox.minY;
        let nextZ = (this.boundingBox.minZ + this.boundingBox.maxZ) / 2.0;

        if (isFinite(nextX) && isFinite(nextY) && isFinite(nextZ)) {
            this.x = nextX;
            this.y = nextY;
            this.z = nextZ;
        }

        return originalTargetX !== targetX || originalTargetZ !== targetZ;
    }

    getBlockSlipperiness() {
        return this.onGround ? 0.6 : 1.0;
    }

    getAIMoveSpeed() {
        let speed = 0.064;
        if (this.activeEffects.has("speed")) {
            speed *= (1.0 + 0.2 * (this.activeEffects.get("speed").amplifier + 1));
        }
        if (this.activeEffects.has("slowness")) {
            speed *= Math.max(0, 1.0 - 0.15 * (this.activeEffects.get("slowness").amplifier + 1));
        }
        return speed;
    }

    onEntityUpdate() {
        this.prevRenderYawOffset = this.renderYawOffset;
        this.prevRotationYawHead = this.rotationYawHead;
        this.prevSwingProgress = this.swingProgress;

        this.prevRenderArmYaw = this.renderArmYaw;
        this.prevRenderArmPitch = this.renderArmPitch;
        this.renderArmPitch = (this.renderArmPitch + (this.rotationPitch - this.renderArmPitch) * 0.5);
        this.renderArmYaw = (this.renderArmYaw + (this.rotationYaw - this.renderArmYaw) * 0.5);

        this.updateArmSwingProgress();

        super.onEntityUpdate();
    }

    updateBodyRotation() {
        let motionX = this.x - this.prevX;
        let motionZ = this.z - this.prevZ;

        let bodyRotation = this.renderYawOffset;

        let distanceTravelled = motionX * motionX + motionZ * motionZ;
        if (distanceTravelled > 0.0025000002) {
            bodyRotation = Math.atan2(motionZ, motionX) * 180.0 / Math.PI - 90.0;
        }

        if (this.swingProgress > 0.0) {
            bodyRotation = this.rotationYaw;
        }

        let bodyRotationDifference = MathHelper.wrapAngleTo180(bodyRotation - this.renderYawOffset);
        this.renderYawOffset += bodyRotationDifference * 0.3;

        let yaw = MathHelper.wrapAngleTo180(this.rotationYaw - this.renderYawOffset);
        if (yaw < -75.0) {
            yaw = -75.0;
        }
        if (yaw >= 75.0) {
            yaw = 75.0;
        }
        this.renderYawOffset = this.rotationYaw - yaw;

        if (yaw * yaw > 2500.0) {
            this.renderYawOffset += yaw * 0.2;
        }
    }

    swingArm(hand = 'main') {
        let swingAnimationEnd = 6;
        if (!this.isSwingInProgress || this.swingProgressInt >= swingAnimationEnd / 2 || this.swingProgressInt < 0) {
            this.swingProgressInt = -1;
            this.isSwingInProgress = true;
            this.swingingHand = hand;

            // Sync to multiplayer if this is the local player
            if (this === this.minecraft.player && this.minecraft.multiplayer && this.minecraft.multiplayer.connected) {
                this.minecraft.multiplayer.broadcast({
                    type: "swing_arm",
                    hand: hand
                });
            }
        }
    }

    updateArmSwingProgress() {
        let swingAnimationEnd = 6;
        if (this.isSwingInProgress) {
            ++this.swingProgressInt;

            if (this.swingProgressInt >= swingAnimationEnd) {
                this.swingProgressInt = 0;
                this.isSwingInProgress = false;
            }
        } else {
            this.swingProgressInt = 0;
        }

        this.swingProgress = this.swingProgressInt / swingAnimationEnd;
    }

    getSwingProgress(partialTicks) {
        let swingProgressDiff = this.swingProgress - this.prevSwingProgress;
        if (swingProgressDiff < 0.0) {
            swingProgressDiff++;
        }
        return this.prevSwingProgress + swingProgressDiff * partialTicks;
    }

    computeAngleWithBound(value, subtract, limit) {
        let wrapped = MathHelper.wrapAngleTo180(value - subtract);
        if (wrapped < -limit) {
            wrapped = -limit;
        }
        if (wrapped >= limit) {
            wrapped = limit;
        }
        return value - wrapped;
    }

    takeHit(fromEntity, damage, cause = "generic") {
        if (this.hurtTime > 0 || this.health <= 0) return false;

        // Play hit sound for mobs
        if (this.customName !== "silent") {
            this.minecraft.soundManager.playSound("random.hit", this.x, this.y, this.z, 0.6, 1.0);
        }

        this.hurtTime = 13; // Increased delay by ~25% (from 10 to 13)
        this.health -= damage;
        
        if (this.health <= 0) {
            // Increment mob kill stat if killed by player
            if (fromEntity && fromEntity === this.minecraft.player && this.constructor.name !== "PlayerEntity") {
                this.minecraft.stats.mobsKilled++;
                
                const hostiles = ["EntityZombie", "EntityCreeper", "EntitySkeleton", "EntitySnowZombie", "EntityHusk", "EntityDrowned", "EntitySpider", "EntitySlime", "EntityEnderman"];
                if (hostiles.includes(this.constructor.name)) {
                    this.minecraft.achievementManager.grant('monsterhunter');
                }
            }

            this.health = 0;
            this.deathTime = 0;
        }
        return true;
    }

}
