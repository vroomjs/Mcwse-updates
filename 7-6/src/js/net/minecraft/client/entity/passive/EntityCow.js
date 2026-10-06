import Mob from "/src/js/net/minecraft/client/entity/Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import DroppedItem from "../DroppedItem.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";

export default class EntityCow extends Mob {
    static name = "EntityCow";

    constructor(minecraft, world) {
        super(minecraft, world);
        
        this.baseWidth = 0.72; // Increased 60%
        this.baseHeight = 2.24; // Increased 60%
        this.scale = 1.0; // Used by renderer to scale mesh
        
        // Initialize position and bounding box
        this.setPosition(this.x, this.y, this.z);
        
        this.modelName = "cow (6).gltf";
        this.mobSoundPrefix = "mob.cow";
        this.health = 10;
        this.stepHeight = 1.0; // Cows can climb blocks easily

        // AI State
        this.aiState = 0; // 0=Idle, 1=Walk
        this.aiTimer = 0;
        this.targetX = 0;
        this.targetZ = 0;

        // Hurt / flee state
        this.hurtTime = 0; // ticks left to flash
        this.fleeUntil = 0; // ticksExisted threshold to stop fleeing
        
        this.deathTime = 0;
    }
    
    setPosition(x, y, z) {
        // Calculate dimensions based on base size and attribute scale
        let width = Math.max(0.1, this.baseWidth + (this.attributeScale * 0.4));
        let height = Math.max(0.1, this.baseHeight + (this.attributeScale * 0.6));

        if (this.isChild) {
            width *= 0.5;
            height *= 0.5;
        }

        this.x = x;
        this.y = y;
        this.z = z;

        let w = width / 2;
        this.boundingBox = new BoundingBox(
            x - w, y, z - w,
            x + w, y + height, z + w
        );

        // Ensure renderer group uses the cow scale immediately so size is correct right after spawning
        try {
            if (this.renderer && this.renderer.group) {
                // Apply uniform scale factor (preserve orientation)
                this.renderer.group.scale.set(this.scale, this.scale, this.scale);
            }
        } catch (e) {
            // ignore if renderer not yet ready
        }
    }

    onLivingUpdate() {
        if (this.isRemote) {
            return super.onLivingUpdate();
        }

        // Handle death
        if (this.health <= 0) {
            this.deathTime++;
            if (this.deathTime === 1) {
                this.playMobSound("death");
            }
            if (this.deathTime >= 20) { // 1 second death animation
                this.world.removeEntityById(this.id);
            }
            // Stop movement while dying
            this.motionX = 0;
            this.motionZ = 0;
            this.moveForward = 0;
            this.moveStrafing = 0;
            return;
        }

        // Decrease hurt timer if active
        if (this.hurtTime > 0) {
            this.hurtTime--;
        }

        // Initialize target on first run if 0
        if (this.targetX === 0 && this.targetZ === 0) {
            this.targetX = this.x;
            this.targetZ = this.z;
        }

        // If currently fleeing because of being hit, override normal AI
        if (this.fleeUntil > this.ticksExisted) {
            // Run away from nearest player (prefer the last attacker stored)
            let players = this.world.entities.filter(e => e.constructor && e.constructor.name === "PlayerEntity");
            if (players.length > 0) {
                // Choose closest player
                let closest = null;
                let closestDist = Infinity;
                for (let p of players) {
                    let dx = p.x - this.x;
                    let dz = p.z - this.z;
                    let dsq = dx*dx + dz*dz;
                    if (dsq < closestDist) {
                        closestDist = dsq;
                        closest = p;
                    }
                }
                if (closest) {
                    // Set target away from player
                    let angleAway = Math.atan2(this.z - closest.z, this.x - closest.x) * 180.0 / Math.PI;
                    this.rotationYaw = angleAway;
                    this.rotationYawHead = this.rotationYaw;
                    // Normalized forward input. Actual speed is governed by getAIMoveSpeed()
                    this.moveForward = 1.0; 
                }
            } else {
                // fallback to normal wandering while fleeing
                this.moveForward = 0.726;
            }
        } else {
            // normal AI
            if (this.aiState === 0) { // Idle
                this.moveForward = 0;
                this.moveStrafing = 0;
                
                if (this.aiTimer > 0) {
                    this.aiTimer--;
                } else {
                    // Pick new target in 5-8 block radius
                    let angle = Math.random() * Math.PI * 2;
                    let dist = 5 + Math.random() * 3;
                    
                    let tx = this.x + Math.sin(angle) * dist;
                    let tz = this.z + Math.cos(angle) * dist;
                    
                    // Find the highest block at this X/Z to set correct target altitude
                    let ix = Math.floor(tx);
                    let iz = Math.floor(tz);
                    let iy = 127;
                    while (iy > 0) {
                        let id = this.world.getBlockAt(ix, iy - 1, iz);
                        if (id !== 0) break; // Found solid block
                        iy--;
                    }
                    
                    // Check reachability: Vertical diff < 2 blocks and target is not inside a block
                    if (Math.abs(iy - this.y) < 2 && this.world.getBlockAt(ix, iy, iz) === 0) {
                        this.targetX = tx;
                        this.targetZ = tz;
                        this.targetY = iy;
                        this.aiState = 1; // Start walking
                        this.aiTimer = 100; // 5 seconds timeout to reach target
                    } else {
                        this.aiTimer = 10; // Try again soon
                    }
                }
            } else { // Walking
                // Timeout check
                if (this.aiTimer > 0) this.aiTimer--;
                
                let dx = this.targetX - this.x;
                let dz = this.targetZ - this.z;
                let distSq = dx*dx + dz*dz;
                
                if (distSq < 1.0 || this.aiTimer <= 0) {
                    this.aiState = 0;
                    this.moveForward = 0;
                    this.currentPath = null;
                    this.aiTimer = Math.random() < 0.5 ? (14 + Math.floor(Math.random() * 15)) : 0;
                } else {
                    this.navigateTo(this.targetX, this.targetY, this.targetZ, 1.0);
                }
            }
            
            this.rotationYawHead = this.rotationYaw; // Force head to follow body
        }
        
        super.onLivingUpdate();

        // Jump if colliding with a block while moving
        if (this.collision && this.onGround && this.moveForward > 0) {
            this.jump();
        }
    }

    /**
     * Take a hit from an entity (e.g. player)
     * Applies knockback, flash and triggers flee for 4 seconds.
     */
    takeHit(fromEntity, damage = 1) {
        if (!super.takeHit(fromEntity, damage)) return;

        this.playMobSound("hurt");
        if (this.health <= 0) {
            this.deathTime = 0;
            
            // Drop Beef
            let beefCount = 1;
            if (Math.random() < 0.5) beefCount++;
            if (Math.random() < 0.15) beefCount++;
            
            let beef = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.BEEF.getId(), beefCount);
            this.world.droppedItems.push(beef);

            // Drop Leather
            let leatherCount = 0;
            if (Math.random() < 0.8) leatherCount++;
            if (Math.random() < 0.6) leatherCount++;
            if (Math.random() < 0.4) leatherCount++;
            if (Math.random() < 0.2) leatherCount++;
            
            if (leatherCount > 0) {
                let leather = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.LEATHER.getId(), leatherCount);
                this.world.droppedItems.push(leather);
            }

            return;
        }

        // Knockback away from attacker (ensure vector points from cow toward player,
        // which is then inverted by the movement system to move away from the player)
        if (fromEntity) {
            // Direction from cow to player
            let nx = fromEntity.x - this.x;
            let nz = fromEntity.z - this.z;
            let len = Math.sqrt(nx*nx + nz*nz);
            if (len === 0) {
                // If exactly overlapping, push in a random outward direction
                let ang = Math.random() * Math.PI * 2;
                nx = Math.cos(ang);
                nz = Math.sin(ang);
                len = 1;
            }
            nx /= len;
            nz /= len;
            const KNOCKBACK = 0.55; // Increased 10%
            // Movement system calls moveCollide(-motionX, ...), so using the
            // cow->player vector here results in motion away from the player.
            this.motionX = nx * KNOCKBACK;
            this.motionZ = nz * KNOCKBACK;
            this.motionY = 0.25; // slight upward knock
        }

        // Set separate timers
        // Red flash for 0.5s (10 ticks)
        this.hurtTime = 10; 
        // Flee for 4s (80 ticks)
        const ticks = 80; 
        this.fleeUntil = this.ticksExisted + ticks;
    }

    getAnimationName() {
        let isMoving = Math.abs(this.x - this.prevX) > 0.01 || Math.abs(this.z - this.prevZ) > 0.01;
        return isMoving ? "walk" : "idle";
    }

    updateBodyRotation() {
        this.renderYawOffset = this.rotationYaw;
        this.rotationYawHead = this.rotationYaw;
    }

    getAIMoveSpeed() {
        if (this.riddenByEntity) return 0.083; // Reduced 20%
        if (this.fleeUntil > this.ticksExisted) return 0.073; // Reduced 20%
        return 0.064; // Reduced 20%
    }

    interact(player) {
        let heldId = player.inventory.getItemInSelectedSlot();
        if (heldId === BlockRegistry.WHEAT_ITEM.getId() && !this.isChild && this.growingAge === 0 && this.loveTimer === 0) {
            if (player.gameMode !== 1) player.inventory.consumeItem(heldId);
            this.loveTimer = 600; // 30 seconds
            player.swingArm();
            this.minecraft.soundManager.playSound("random.eat", this.x, this.y, this.z, 1.0, 1.0);
            this.minecraft.particleManager.spawnHeartParticles(this.world, this.x, this.y + this.height + 0.5, this.z, 3);
            return true;
        }
        return false;
    }
}


