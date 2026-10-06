import EntityLiving from "./EntityLiving.js";
import Block from "../world/block/Block.js";

export default class Mob extends EntityLiving {

    constructor(minecraft, world) {
        super(minecraft, world);
        this.randomYawVelocity = 0;
        this.nextMoveUpdate = 0;
        
        // Pathfinding
        this.currentPath = null;
        this.pathIndex = 0;
        this.pathTimer = 0;

        // Custom AI
        this.aiMode = "wander"; // wander, chase, flee, stay
        this.aiTargetSelector = "@p";

        this.ambientSoundTimer = 0;
        this.resetAmbientSoundTimer();
        this.mobSoundPrefix = "mob.generic"; // Default to be overridden
    }

    resetAmbientSoundTimer() {
        // Random interval for ambient sounds (approx 6-20 seconds)
        this.ambientSoundTimer = 120 + Math.floor(Math.random() * 280);
    }

    setAiMode(mode, targetSelector = "@p") {
        this.aiMode = mode;
        this.aiTargetSelector = targetSelector;
        this.currentPath = null;
    }

    getAnimationName() {
        if (this.swingProgress > 0) return "attack";
        // Increase threshold to avoid micro-movements triggering walk animation
        let isMoving = Math.abs(this.x - this.prevX) > 0.01 || Math.abs(this.z - this.prevZ) > 0.01;
        return isMoving ? "walk" : "idle";
    }

    checkLuring() {
        const player = this.minecraft.player;
        if (!player || this.isRemote) return false;
        
        const dist = this.getDistanceToEntity(player);
        if (dist > 9.0) return false;

        const heldId = player.inventory.getItemInSelectedSlot();
        let isInterested = false;
        
        const name = this.constructor.name;
        // Favorite foods: Wheat (296), Seeds (402), Carrot (403), Potato (405)
        if (name === "EntityCow" || name === "EntitySheep") isInterested = (heldId === 296);
        else if (name === "EntityPig") isInterested = (heldId === 403 || heldId === 405);
        else if (name === "EntityChicken") isInterested = (heldId === 402);

        if (isInterested) {
            this.faceLocation(player.x, player.z, 30, 30);
            if (dist > 2.0) {
                // Use normalized input (1.0 = full forward) to prevent exponential speed dampening
                this.moveForward = 1.0;
            } else {
                this.moveForward = 0;
            }
            return true;
        }
        return false;
    }

    onLivingUpdate() {
        if (this.health <= 0) {
            super.onLivingUpdate();
            return;
        }

        // Statue: Freeze AI and body rotation
        if (this.customName === "statue") {
            this.moveForward = 0;
            this.moveStrafing = 0;
            this.jumping = false;
            // Lock rotation to prevent drift
            this.rotationYaw = this.prevRotationYaw;
            this.renderYawOffset = this.rotationYaw;
            this.rotationYawHead = this.rotationYaw;
            // Skip AI logic
            super.onLivingUpdate();
            return;
        }

        // Dusty: Emit particles
        if (this.customName === "dusty" && this.ticksExisted % 10 === 0) {
            const bx = Math.floor(this.x);
            const by = Math.floor(this.y - 0.2); // Check block below
            const bz = Math.floor(this.z);
            const id = this.world.getBlockAt(bx, by, bz);
            const block = Block.getById(id);
            if (block && block.isSolid()) {
                this.minecraft.particleManager.spawnBlockBreakParticles(this.world, this.x, this.y + 0.5, this.z, block);
            }
        }

        // Ambient sound logic
        if (!this.isRemote) {
            if (this.ambientSoundTimer > 0) {
                this.ambientSoundTimer--;
            } else {
                this.playMobSound("say");
                this.resetAmbientSoundTimer();
            }
        }

        // Breeding & Aging Logic (Host/Singleplayer only)
        if (!this.isRemote) {
            if (this.growingAge < 0) {
                this.growingAge++;
                if (this.growingAge === 0) {
                    if (this.renderer && this.renderer.group) delete this.renderer.group.buildMeta;
                }
            } else if (this.growingAge > 0) {
                this.growingAge--;
            }

            if (this.loveTimer > 0) {
                this.loveTimer--;
                if (this.ticksExisted % 20 === 0) {
                    this.minecraft.particleManager.spawnHeartParticles(this.world, this.x, this.y + this.height + 0.5, this.z);
                }

                // Look for partner
                let partner = this.world.entities.find(e => 
                    e !== this && 
                    e.constructor.name === this.constructor.name && 
                    e.loveTimer > 0 &&
                    !e.isChild &&
                    this.getDistanceToEntity(e) < 8
                );

                if (partner) {
                    this.faceLocation(partner.x, partner.z, 30, 30);
                    this.moveForward = this.getAIMoveSpeed();
                    
                    if (this.getDistanceToEntity(partner) < 1.0) {
                        this.breedWith(partner);
                    }
                }
            }
        }

        // If remote entity (client side), interpolate position instead of AI
        if (this.isRemote) {
            // Interpolate position
            let factor = 0.5; // Snap faster to target to reduce perceived lag
            this.x += (this.targetX - this.x) * factor;
            this.y += (this.targetY - this.y) * factor;
            this.z += (this.targetZ - this.z) * factor;

            // Interpolate rotation
            let yawDiff = this.targetYaw - this.rotationYaw;
            while (yawDiff < -180) yawDiff += 360;
            while (yawDiff >= 180) yawDiff -= 360;
            this.rotationYaw += yawDiff * factor;
            
            this.rotationPitch += (this.targetPitch - this.rotationPitch) * factor;
            
            this.rotationYawHead = this.rotationYaw;
            this.renderYawOffset = this.rotationYaw;
            
            // Move bounding box
            let width = Math.max(0.1, this.baseWidth + (this.attributeScale * 0.25));
            let height = Math.max(0.1, this.baseHeight + (this.attributeScale * 0.5));
            let w = width / 2;
            this.boundingBox.minX = this.x - w;
            this.boundingBox.maxX = this.x + w;
            this.boundingBox.minY = this.y;
            this.boundingBox.maxY = this.y + height;
            this.boundingBox.minZ = this.z - w;
            this.boundingBox.maxZ = this.z + w;
            
            // Animation state
            if (this.prevX !== 0) {
                let moved = Math.sqrt((this.x - this.prevX)**2 + (this.z - this.prevZ)**2);
                if (moved > 0.005) {
                    // Simulate limb swing
                    this.limbSwingStrength += (Math.min(1.0, moved * 4.0) - this.limbSwingStrength) * 0.4;
                    this.limbSwingProgress += this.limbSwingStrength;
                } else {
                    this.limbSwingStrength *= 0.8;
                }
            }

            // Zero out local physics motion for remote entities to prevent fighting the sync
            this.motionX = 0;
            this.motionY = 0;
            this.motionZ = 0;
            
            return;
        }

        // AI logic based on mode
        if (this.checkLuring()) {
            // Luring overrides normal AI
        } else if (this.aiMode === "stay") {
            this.moveForward = 0;
            this.moveStrafing = 0;
        } else if (this.aiMode === "chase" || this.aiMode === "flee") {
            const targets = this.minecraft.commandHandler.getTargets(this.aiTargetSelector);
            if (targets.length > 0) {
                const target = targets[0]; // Chase closest or first
                const dist = this.getDistanceToEntity(target);
                const speed = this.getAIMoveSpeed() * (this.aiMode === "flee" ? 1.5 : 1.0);
                
                if (this.aiMode === "chase") {
                    if (dist > 1.5) this.navigateTo(target.x, target.y, target.z, speed);
                    else this.moveForward = 0;
                } else {
                    // Flee
                    let angleAway = Math.atan2(this.z - target.z, this.x - target.x) * 180.0 / Math.PI - 90.0;
                    this.rotationYaw = angleAway;
                    this.moveForward = speed;
                }
            }
        } else {
            // Basic random AI (Wander)
            if (this.ticksExisted > this.nextMoveUpdate) {
                this.nextMoveUpdate = this.ticksExisted + 40 + Math.floor(Math.random() * 40);
                
                if (Math.random() < 0.6) {
                    this.randomYawVelocity = (Math.random() - 0.5) * 40;
                    this.moveForward = Math.random() * 0.3;
                } else {
                    this.moveForward = 0;
                    this.randomYawVelocity = 0;
                }
            }
            this.rotationYaw += this.randomYawVelocity;
        }
        this.randomYawVelocity *= 0.9;
        
        // Clamp head rotation
        this.rotationYawHead = this.rotationYaw;

        // Call super to handle physics and movement
        super.onLivingUpdate();

        // Jump if colliding with a block while moving (Basic obstacle avoidance)
        if (this.collision && this.onGround && this.moveForward > 0) {
            this.jump();
        }
    }

    updateKeyboardInput() {
        // Override to disable keyboard control for mobs
        this.jumping = false;
        this.sneaking = false;
        this.moveStrafing = 0;
        // this.moveForward is controlled by AI
    }

    navigateTo(x, y, z, speedMultiplier = 1.0) {
        // Recalculate path occasionally or if target moved significantly
        if (this.pathTimer > 0) {
            this.pathTimer--;
        }
        
        if (this.pathTimer <= 0) {
            // Search radius of 20x20 blocks
            this.currentPath = this.world.pathFinder.createPath(this, x, y, z, 20);
            this.pathIndex = 0;
            this.pathTimer = 20 + Math.floor(Math.random() * 10);
        }

        if (this.currentPath && this.currentPath.length > 0) {
            this.followPath(speedMultiplier);
        } else {
            // Fallback to direct movement if no path found
            this.faceLocation(x, z, 30, 30);
            this.moveForward = speedMultiplier;
        }
    }

    followPath(speedMultiplier = 1.0) {
        if (!this.currentPath || this.pathIndex >= this.currentPath.length) {
            this.moveForward = 0;
            this.currentPath = null;
            return;
        }

        let point = this.currentPath[this.pathIndex];
        
        let dx = point.x - this.x;
        let dz = point.z - this.z;
        let distSq = dx*dx + dz*dz;

        // If reached intermediate waypoint
        if (distSq < 0.6) {
            this.pathIndex++;
            if (this.pathIndex >= this.currentPath.length) {
                this.moveForward = 0;
                this.currentPath = null;
                return;
            }
            point = this.currentPath[this.pathIndex];
            dx = point.x - this.x;
            dz = point.z - this.z;
        }

        this.faceLocation(point.x, point.z, 30, 30);
        this.moveForward = speedMultiplier;

        if (this.isCollidedHorizontally && this.onGround) {
            this.jump();
        }
    }

    getDistanceToEntity(entity) {
        let dx = this.x - entity.x;
        let dy = this.y - entity.y;
        let dz = this.z - entity.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }

    breedWith(partner) {
        this.minecraft.stats.animalsBred++;
        this.minecraft.achievementManager.grant('parrotsbats');
        this.loveTimer = 0;
        partner.loveTimer = 0;
        this.growingAge = 6000; // 5 min cooldown
        partner.growingAge = 6000;

        // Spawn child
        let child = new this.constructor(this.minecraft, this.world);
        child.isChild = true;
        child.growingAge = -24000; // 20 mins to grow up
        child.setPosition(this.x, this.y, this.z);
        this.world.addEntity(child);

        // Effects & XP (Visual only)
        this.minecraft.particleManager.spawnHeartParticles(this.world, this.x, this.y + this.height + 0.5, this.z, 5);
        this.minecraft.soundManager.playSound("random.pop", this.x, this.y, this.z, 1.0, 1.0);
    }

    faceLocation(x, z, maxYaw, maxPitch) {
        let dx = x - this.x;
        let dz = z - this.z;
        let diffYaw = Math.atan2(dz, dx) * 180.0 / Math.PI - 90.0;
        
        let diff = diffYaw - this.rotationYaw;
        while (diff < -180) diff += 360;
        while (diff >= 180) diff -= 360;
        
        // High responsiveness factor (0.9) to make movement snappy and prevent diagonal jitter/sliding
        this.rotationYaw += diff * 0.9;
        this.rotationYawHead = this.rotationYaw;
    }

    playMobSound(category) {
        if (this.customName === "silent") return;
        if (this.health <= 0 && category !== "death") return;

        const sm = this.minecraft.soundManager;
        const hasSound = (name) => Boolean(sm?.constructor?.SOUND_DATA?.[name]);
        let soundName = `${this.mobSoundPrefix}.${category}`;

        // Some mobs do not have a dedicated hurt/death clip in the old
        // resource pack. Pick the known fallback before checking the cache.
        if (!hasSound(soundName) &&
            (category === "hurt" || category === "death")) {
            soundName = `${this.mobSoundPrefix}.say`;
        }

        const buffers = sm.bufferCache.get(soundName);
        if (!buffers || buffers.length === 0) {
            // Ambient sounds used to be dropped here because only already
            // cached groups were playable. Queue the request and start the
            // load so the first sound is heard as soon as it is ready.
            if (hasSound(soundName)) {
                sm.pendingSounds.set(soundName, {
                    x: this.x,
                    y: this.y,
                    z: this.z,
                    volume: 1.0,
                    pitch: 1.0
                });
                sm.preloadSoundGroup(soundName).catch(() => {});
            }
            return;
        }

        // Requirement: Hurt sounds interrupt ambient loops for that specific entity
        if (category === "hurt" || category === "fuse" || category === "death") {
            // Requirement: Hurt sounds interrupt ambient sounds
            if (this.activeVoice && this.activeVoice.isPlaying) {
                this.activeVoice.stop();
            }
        }

        // Play and track voice
        this.activeVoice = sm.playSound(soundName, this.x, this.y, this.z, 1.0, 1.0);
    }
}
