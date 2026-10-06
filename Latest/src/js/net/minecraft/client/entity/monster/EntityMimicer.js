import Mob from "../Mob.js";
import EntityLiving from "../EntityLiving.js";
import BoundingBox from "../../../util/BoundingBox.js";
import DroppedItem from "../DroppedItem.js";
import Block from "../../world/block/Block.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";

export default class EntityMimicer extends Mob {
    static name = "EntityMimicer";

    constructor(minecraft, world) {
        super(minecraft, world);

        this.baseWidth = 0.72;
        this.baseHeight = 2.85;
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        this.stepHeight = 1.0;

        this.maxHealth = 70;
        this.health = this.maxHealth;
        this.attackDamage = 7;
        this.attackTimer = 0;
        this.spottedTimer = 0;
        this.chaseTimer = 0;
        this.fleeTimer = 0;
        this.vanishTimer = 20 * 60 * 5;
        this.lastSpecialSoundTick = -9999;
        this.hasPlayedSpotted = false;
        this.hasPlayedFlee = false;
        this.hasPlayedChase = false;
        this.hurtTime = 0;
        this.deathTime = 0;
        this.isAggressive = false;
        this.isFleeing = false;
        this.isSpotted = false;
        this.isCrouching = false;
        this.isCrawling = false;
        this.mobSoundPrefix = "mob.mimicer";
        this.aiMode = "wander";
        this.aiTargetSelector = "@p";
        this.nextMoveUpdate = 0;
        this.randomYawVelocity = 0;
        this.ambientSoundTimer = 80 + Math.floor(Math.random() * 160);
        this.setPosition(this.x, this.y, this.z);
    }

    setPosition(x, y, z) {
        const width = Math.max(0.18, this.baseWidth + (this.attributeScale || 0) * 0.3);
        const height = Math.max(0.4, this.baseHeight + (this.attributeScale || 0) * 0.45);
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.z = z;
        const w = width / 2;
        this.boundingBox = new BoundingBox(x - w, y, z - w, x + w, y + height, z + w);
    }

    getAIMoveSpeed() {
        const base = this.isFleeing ? 0.34 : (this.isAggressive ? 0.31 : 0.14);
        return base * (this.speedMultiplier || 1.0);
    }

    getAnimationName() {
        if (this.health <= 0) return "death";
        if (this.attackTimer > 10 || this.swingProgress > 0) return "attack";
        if (this.isFleeing) return "flee";
        if (this.isSpotted) return "spotted";
        if (this.isCrouching || this.isCrawling) return "crouch";
        const moving = Math.abs(this.x - this.prevX) > 0.01 || Math.abs(this.z - this.prevZ) > 0.01;
        return moving ? (this.isAggressive ? "run" : "walk") : "idle";
    }

    getDistanceToEntity(entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const dz = this.z - entity.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    getPrimaryTarget() {
        const player = this.minecraft.player;
        if (!player || player.health <= 0 || player.gameMode === 1 || player.gameMode === 3) return null;
        if (this.minecraft.settings.difficulty === 0) return null;
        return player;
    }

    canSeeTarget(target) {
        if (!target) return false;
        const eyeY = this.y + Math.min(this.height, 2.2);
        const targetEyeY = target.y + (typeof target.getEyeHeight === "function" ? target.getEyeHeight() : 1.62);
        const steps = 14;
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const x = Math.floor(this.x + (target.x - this.x) * t);
            const y = Math.floor(eyeY + (targetEyeY - eyeY) * t);
            const z = Math.floor(this.z + (target.z - this.z) * t);
            const id = this.world.getBlockAt(x, y, z);
            if (id !== 0) {
                const block = Block.getById(id);
                if (!block || (block.isSolid && block.isSolid())) return false;
            }
        }
        return true;
    }

    isTargetLookingAtMe(target) {
        if (!target) return false;
        const dx = this.x - target.x;
        const dz = this.z - target.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 30 || dist < 0.001) return false;
        const targetYaw = Math.atan2(dz, dx) * 180 / Math.PI - 90;
        let diff = target.rotationYaw - targetYaw;
        while (diff < -180) diff += 360;
        while (diff >= 180) diff -= 360;
        return Math.abs(diff) < 22 && this.canSeeTarget(target);
    }

    playMimicerSound(name, volume = 1.0, pitch = 1.0) {
        if (this.customName === "silent") return;
        this.minecraft.soundManager?.playSound?.(`mob.mimicer.${name}`, this.x, this.y + 1.2, this.z, volume, pitch);
    }

    playTimedSound(name, cooldown = 60, volume = 1.0, pitch = 1.0) {
        if (this.ticksExisted - this.lastSpecialSoundTick < cooldown) return;
        this.lastSpecialSoundTick = this.ticksExisted;
        this.playMimicerSound(name, volume, pitch);
    }

    vanish() {
        if (this.isRemote || this.health <= 0) return;
        this.playMimicerSound("disappear", 1.0, 1.0);
        this.world.removeEntityById(this.id);
    }

    onLivingUpdate() {
        if (this.isRemote) {
            super.onLivingUpdate();
            return;
        }

        if (this.health <= 0) {
            if (this.deathTime === 0) this.playMimicerSound("death", 1.0, 0.9);
            EntityLiving.prototype.onLivingUpdate.call(this);
            return;
        }

        if (this.ambientSoundTimer > 0) this.ambientSoundTimer--;
        else {
            this.playMimicerSound("say", 0.9, 0.9 + Math.random() * 0.15);
            this.ambientSoundTimer = 160 + Math.floor(Math.random() * 260);
        }

        if (this.attackTimer > 0) this.attackTimer--;
        if (this.spottedTimer > 0) this.spottedTimer--;
        if (this.chaseTimer > 0) this.chaseTimer--;
        if (this.fleeTimer > 0) this.fleeTimer--;
        if (this.vanishTimer > 0) this.vanishTimer--;
        if (this.vanishTimer <= 0 && this.getDistanceToEntity(this.minecraft.player) > 32) {
            this.vanish();
            return;
        }

        const target = this.getPrimaryTarget();
        if (!target) {
            this.isAggressive = false;
            this.isFleeing = false;
            this.isSpotted = false;
            this.isCrouching = false;
            EntityLiving.prototype.onLivingUpdate.call(this);
            return;
        }

        const dx = target.x - this.x;
        const dz = target.z - this.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const targetLooking = this.isTargetLookingAtMe(target);
        this.isSpotted = targetLooking && dist < 30;
        this.isCrouching = this.isSpotted && !this.isAggressive && this.spottedTimer > 0;
        this.isCrawling = this.isAggressive && dist < 2.5;

        if (this.isSpotted && !this.hasPlayedSpotted) {
            this.playTimedSound("spotted", 80, 1.2, 1.0);
            this.hasPlayedSpotted = true;
            this.spottedTimer = 30;
        }
        if (!this.isSpotted) this.hasPlayedSpotted = false;

        if (this.isAggressive || this.chaseTimer > 0 || dist < 4.2 || (this.isSpotted && dist < 18 && this.spottedTimer <= 0)) {
            this.isAggressive = true;
            this.isFleeing = false;
            this.chaseTimer = Math.max(this.chaseTimer, 20 * 18);
            if (!this.hasPlayedChase) {
                this.playTimedSound("chase", 90, 1.1, 1.0);
                this.hasPlayedChase = true;
            }
            if (dist > 1.6) {
                this.navigateTo(target.x, target.y, target.z, this.getAIMoveSpeed());
            } else {
                this.moveForward = 0;
                this.faceLocation(target.x, target.z, 30, 30);
                if (this.attackTimer <= 0) {
                    target.takeHit(this, this.attackDamage, "mob");
                    this.attackTimer = 24;
                    this.swingArm();
                }
            }
        } else if (this.isSpotted && dist > 10) {
            this.isFleeing = true;
            this.fleeTimer = Math.max(this.fleeTimer, 50);
            if (!this.hasPlayedFlee) {
                this.playTimedSound("flee", 80, 1.0, 1.0);
                this.hasPlayedFlee = true;
            }
            const away = Math.atan2(this.z - target.z, this.x - target.x) * 180 / Math.PI - 90;
            this.rotationYaw = away;
            this.moveForward = this.getAIMoveSpeed();
        } else {
            this.hasPlayedChase = false;
            if (this.fleeTimer <= 0) {
                this.isFleeing = false;
                this.hasPlayedFlee = false;
            }
            // Stalk from the edge of vision; otherwise wander quietly.
            if (dist < 24 && dist > 8 && this.canSeeTarget(target)) {
                const side = Math.sin(this.ticksExisted * 0.05) * 3.0;
                const mag = Math.max(0.1, Math.sqrt(dx * dx + dz * dz));
                const sx = target.x - (dx / mag) * 7 + (dz / mag) * side;
                const sz = target.z - (dz / mag) * 7 - (dx / mag) * side;
                this.navigateTo(sx, target.y, sz, 0.7);
            } else if (this.ticksExisted > this.nextMoveUpdate) {
                this.nextMoveUpdate = this.ticksExisted + 45 + Math.floor(Math.random() * 60);
                this.randomYawVelocity = (Math.random() - 0.5) * 35;
                this.moveForward = Math.random() < 0.55 ? 0.35 : 0;
            }
        }

        if (this.isCollidedHorizontally) this.motionY = Math.max(this.motionY, 0.18);
        this.rotationYawHead = this.rotationYaw;
        EntityLiving.prototype.onLivingUpdate.call(this);
    }

    takeHit(fromEntity, damage = 1) {
        if (!super.takeHit(fromEntity, damage)) return false;
        this.isAggressive = true;
        this.chaseTimer = 20 * 20;
        this.playMimicerSound("hurt", 1.0, 0.95 + Math.random() * 0.1);
        if (fromEntity) {
            const dx = fromEntity.x - this.x;
            const dz = fromEntity.z - this.z;
            const mag = Math.max(0.1, Math.sqrt(dx * dx + dz * dz));
            this.motionX -= (dx / mag) * 0.18;
            this.motionZ -= (dz / mag) * 0.18;
            this.motionY += 0.1;
        }
        if (this.health <= 0) {
            const count = 1 + Math.floor(Math.random() * 3);
            this.world.droppedItems.push(new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.STRING_ITEM.getId(), count));
        }
        return true;
    }

    updateBodyRotation() {
        this.renderYawOffset = this.rotationYaw;
        this.rotationYawHead = this.rotationYaw;
    }
}
