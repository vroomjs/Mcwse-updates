import EntityLiving from "../EntityLiving.js";
import MathHelper from "../../../util/MathHelper.js";

export default class EntityShark extends EntityLiving {
    static name = "EntityShark";

    constructor(minecraft, world) {
        super(minecraft, world);

        this.modelName = "minecraft_shark.glb";

        // The shark GLB is authored as a large Minecraft-style model. Keep the
        // full detail but scale/offset it so its visual body is centered on the
        // entity hitbox instead of several blocks ahead of it.
        this.scale = 0.35;
        this.modelOffsetX = 0.8;
        this.modelOffsetY = -0.5;
        this.modelOffsetZ = 2.1;

        this.baseWidth = 0.75;
        this.baseHeight = 0.9;
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        this.stepHeight = 0.0;

        this.maxHealth = 20;
        this.health = this.maxHealth;
        this.attackDamage = 4;
        this.attackCooldown = 0;
        this.biteTicks = 0;
        this.outOfWaterTicks = 0;

        this.aiMode = "wander";
        this.aiTargetSelector = "@p";
        this.nextMoveUpdate = 0;
        this.wanderYaw = Math.random() * 360.0;
        this.wanderY = 62;
    }

    setAiMode(mode, targetSelector = "@p") {
        this.aiMode = mode;
        this.aiTargetSelector = targetSelector;
    }

    getAnimationName() {
        return (this.biteTicks > 0 || this.swingProgress > 0)
            ? "animation.model.eating"
            : "animation.model.swimming";
    }

    getDistanceToEntity(entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const dz = this.z - entity.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    isWaterBlock(x, y, z) {
        return this.world.getBlockAt(Math.floor(x), Math.floor(y), Math.floor(z)) === 9;
    }

    isBodyInWater() {
        // Sample the lower and mid body; the shark may skim the surface with
        // its dorsal fin above water, but its body should stay in water.
        return this.isWaterBlock(this.x, this.y + 0.25, this.z) ||
               this.isWaterBlock(this.x, this.y + 0.65, this.z);
    }

    findWaterYNear(x, z, preferredY) {
        const bx = Math.floor(x);
        const bz = Math.floor(z);
        let bestY = null;
        let bestDist = Infinity;

        for (let y = 4; y <= 126; y++) {
            if (this.world.getBlockAt(bx, y, bz) === 9) {
                const d = Math.abs(y - preferredY);
                if (d < bestDist) {
                    bestDist = d;
                    bestY = y;
                }
            }
        }

        return bestY;
    }

    faceMotion(dx, dy, dz) {
        const horizontal = Math.sqrt(dx * dx + dz * dz);
        if (horizontal > 0.001) {
            const targetYaw = Math.atan2(dz, dx) * 180.0 / Math.PI - 90.0;
            const diff = MathHelper.wrapAngleTo180(targetYaw - this.rotationYaw);
            this.rotationYaw += diff * 0.22;
            this.rotationYawHead = this.rotationYaw;
            this.renderYawOffset = this.rotationYaw;
        }

        if (horizontal > 0.001 || Math.abs(dy) > 0.001) {
            const targetPitch = -Math.atan2(dy, Math.max(horizontal, 0.001)) * 180.0 / Math.PI;
            this.rotationPitch += (targetPitch - this.rotationPitch) * 0.18;
            this.rotationPitch = MathHelper.clamp(this.rotationPitch, -35, 35);
        }
    }

    getCommandTarget() {
        const handler = this.minecraft.commandHandler;
        if (!handler || typeof handler.getTargets !== "function") return null;
        const targets = handler.getTargets(this.aiTargetSelector || "@p") || [];
        return targets.length > 0 ? targets[0] : null;
    }

    chooseTarget() {
        if (this.aiMode === "stay") return null;

        if (this.aiMode === "chase" || this.aiMode === "flee") {
            return this.getCommandTarget();
        }

        const player = this.minecraft.player;
        if (!player || player.health <= 0 || player.gameMode === 1) return null;
        if (this.minecraft.settings.difficulty === 0) return null;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dz = player.z - this.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        // Sharks hunt nearby swimmers. They will also circle just below a
        // player standing in shallow water, but do not pathfind onto land.
        const playerInWater = typeof player.isInWater === "function" && player.isInWater();
        const waterUnderPlayer = this.world.getBlockAt(Math.floor(player.x), Math.floor(this.y), Math.floor(player.z)) === 9;
        if (distSq < 18 * 18 && (playerInWater || waterUnderPlayer || Math.abs(player.y - this.y) < 2.5)) {
            return player;
        }

        return null;
    }

    attackEntity(target) {
        if (!target || typeof target.takeHit !== "function") return;
        if (this.attackCooldown > 0) return;
        if (this.minecraft.settings.difficulty === 0) return;

        const dist = this.getDistanceToEntity(target);
        if (dist <= 1.85 && Math.abs(target.y - this.y) < 1.6) {
            target.takeHit(this, this.attackDamage, "mob");
            this.attackCooldown = 28;
            this.biteTicks = 12;
            this.swingArm();
        }
    }

    swimToward(tx, ty, tz, speed = 0.028) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dz = tz - this.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 0.001) return;

        this.faceMotion(dx, dy, dz);

        const accel = speed * (this.speedMultiplier || 1.0);
        this.motionX += (dx / dist) * accel;
        this.motionY += (dy / dist) * accel * 0.75;
        this.motionZ += (dz / dist) * accel;
    }

    updateWanderTarget() {
        if (this.ticksExisted <= this.nextMoveUpdate) return;

        this.nextMoveUpdate = this.ticksExisted + 45 + Math.floor(Math.random() * 55);
        this.wanderYaw = this.rotationYaw + (Math.random() - 0.5) * 110.0;

        const waterY = this.findWaterYNear(this.x, this.z, Math.floor(this.y));
        if (waterY !== null) {
            this.wanderY = waterY + 0.15 + (Math.random() - 0.5) * 1.1;
        } else {
            this.wanderY = this.y;
        }
    }

    keepInsideWater() {
        if (this.isBodyInWater()) return true;

        const waterY = this.findWaterYNear(this.x, this.z, Math.floor(this.y));
        if (waterY !== null) {
            this.motionY += (waterY + 0.15 - this.y) * 0.04;
        }

        // If a horizontal move pushed the shark onto shore or into a wall, undo
        // that part of the move and turn around instead of letting it beach.
        if (!this.isWaterBlock(this.x, Math.max(1, Math.floor(this.y + 0.25)), this.z) &&
            this.isWaterBlock(this.prevX, Math.max(1, Math.floor(this.prevY + 0.25)), this.prevZ)) {
            this.setPosition(this.prevX, this.y, this.prevZ);
            this.motionX *= -0.35;
            this.motionZ *= -0.35;
            this.wanderYaw += 150 + Math.random() * 60;
        }

        return this.isBodyInWater();
    }

    onLivingUpdate() {
        if (this.health <= 0) {
            super.onLivingUpdate();
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.biteTicks > 0) this.biteTicks--;

        if (this.customName === "statue") {
            this.motionX = this.motionY = this.motionZ = 0;
            return;
        }

        if (this.isRemote) {
            const factor = 0.45;
            const nx = this.x + (this.targetX - this.x) * factor;
            const ny = this.y + (this.targetY - this.y) * factor;
            const nz = this.z + (this.targetZ - this.z) * factor;
            this.setPosition(nx, ny, nz);

            let yawDiff = this.targetYaw - this.rotationYaw;
            while (yawDiff < -180) yawDiff += 360;
            while (yawDiff >= 180) yawDiff -= 360;
            this.rotationYaw += yawDiff * factor;
            this.rotationPitch += (this.targetPitch - this.rotationPitch) * factor;
            this.rotationYawHead = this.rotationYaw;
            this.renderYawOffset = this.rotationYaw;
            this.motionX = this.motionY = this.motionZ = 0;
            return;
        }

        const inWater = this.isBodyInWater();
        if (!inWater) {
            this.outOfWaterTicks++;
            this.moveForward = 0;
            this.moveStrafing = 0;

            // Flop occasionally and slowly dry out if stranded.
            if (this.onGround && this.ticksExisted % 18 === 0) {
                const angle = Math.random() * Math.PI * 2;
                this.motionX += Math.cos(angle) * 0.08;
                this.motionZ += Math.sin(angle) * 0.08;
                this.motionY = 0.22;
                this.rotationYaw += 60 + Math.random() * 120;
            }
            if (this.outOfWaterTicks > 120 && this.outOfWaterTicks % 40 === 0) {
                this.takeHit(null, 1, "dryout");
            }

            super.onLivingUpdate();
            return;
        }

        this.outOfWaterTicks = 0;

        let target = this.chooseTarget();
        let desiredY = this.y;

        if (target) {
            desiredY = target.y + 0.25;
            const waterY = this.findWaterYNear(target.x, target.z, Math.floor(desiredY));
            if (waterY !== null) desiredY = waterY + 0.15;

            if (this.aiMode === "flee") {
                const dx = this.x - target.x;
                const dz = this.z - target.z;
                const len = Math.max(0.001, Math.sqrt(dx * dx + dz * dz));
                this.swimToward(this.x + (dx / len) * 5, this.y, this.z + (dz / len) * 5, 0.03);
            } else {
                this.swimToward(target.x, desiredY, target.z, 0.036);
                this.attackEntity(target);
            }
        } else if (this.aiMode !== "stay") {
            this.updateWanderTarget();
            const yawRad = MathHelper.toRadians(this.wanderYaw + 90.0);
            const tx = this.x + Math.cos(yawRad) * 5.0;
            const tz = this.z + Math.sin(yawRad) * 5.0;
            this.swimToward(tx, this.wanderY, tz, 0.021);
        }

        // Cap swim speed to keep pathing stable in tight water columns.
        const horizontalSpeed = Math.sqrt(this.motionX * this.motionX + this.motionZ * this.motionZ);
        const maxHorizontal = target ? 0.23 : 0.16;
        if (horizontalSpeed > maxHorizontal) {
            const scale = maxHorizontal / horizontalSpeed;
            this.motionX *= scale;
            this.motionZ *= scale;
        }
        this.motionY = MathHelper.clamp(this.motionY, -0.14, 0.14);

        this.collision = this.moveCollide(this.motionX, this.motionY, this.motionZ);
        if (this.collision) {
            this.wanderYaw += 120 + Math.random() * 120;
            this.motionY += 0.025;
        }

        this.keepInsideWater();

        this.motionX *= 0.86;
        this.motionY *= 0.82;
        this.motionZ *= 0.86;

        // Preserve limb swing values for renderers that use generic movement,
        // while the shark GLB uses its own swimming/eating clips.
        const movedX = this.x - this.prevX;
        const movedZ = this.z - this.prevZ;
        const moved = Math.sqrt(movedX * movedX + movedZ * movedZ) * 4.0;
        this.prevLimbSwingStrength = this.limbSwingStrength;
        this.limbSwingStrength += (Math.min(1.0, moved) - this.limbSwingStrength) * 0.4;
        this.limbSwingProgress += this.limbSwingStrength;
    }
}
