import Mob from "../Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import DroppedItem from "../DroppedItem.js";
import Vector3 from "../../../util/Vector3.js";

export default class EntityCat extends Mob {
    static name = "EntityCat";

    constructor(minecraft, world) {
        super(minecraft, world);
        
        this.baseWidth = 0.3; // Reverted to 0.3 to prevent physics glitches
        this.baseHeight = 0.7; // Reverted to 0.7 to prevent physics glitches
        this.scale = 0.9; // Apply the 10% shrink via scale instead of base hitbox to prevent sky-launching
        
        this.modelName = "cat.gltf";
        this.mobSoundPrefix = "mob.cat";
        this.health = 10;
        this.stepHeight = 1.0;

        this.isTamed = false;
        this.sitting = false;
        this.laying = false;
        this.tamingChance = 0.2;
        
        this.attackTimer = 0;
        this.attackTarget = null;

        // Laying down behavior timers (ticks)
        this.layCooldown = 1200 + Math.floor(Math.random() * 2400); // 1-3 minutes
        this.layDuration = 0;

        this.setPosition(this.x, this.y, this.z);
    }
    
    setPosition(x, y, z) {
        let width = Math.max(0.1, this.baseWidth + (this.attributeScale * 0.1));
        let height = Math.max(0.1, this.baseHeight + (this.attributeScale * 0.1));

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
    }

    onLivingUpdate() {
        if (this.isRemote) {
            return super.onLivingUpdate();
        }

        // Cats always land on their feet - no fall damage
        this.fallDistance = 0;

        // Slow falling
        if (!this.onGround && this.motionY < 0) {
            this.motionY *= 0.8;
        }

        if (this.health <= 0) {
            this.deathTime++;
            if (this.deathTime >= 20) {
                this.world.removeEntityById(this.id);
            }
            this.motionX = this.motionZ = this.moveForward = 0;
            return;
        }

        if (this.hurtTime > 0) {
            this.hurtTime--;
            this.laying = false; // Wake up if hurt
        }
        if (this.attackTimer > 0) this.attackTimer--;

        const player = this.minecraft.player;

        if (this.isTamed) {
            if (!this.sitting && !this.laying) {
                // Find potential hostile target
                this.updateAttackTarget();

                if (this.attackTarget) {
                    const distToTarget = this.getDistanceToEntity(this.attackTarget);
                    this.faceLocation(this.attackTarget.x, this.attackTarget.z, 30, 30);
                    this.navigateTo(this.attackTarget.x, this.attackTarget.y, this.attackTarget.z, 1.2);
                    
                    if (distToTarget < 1.5 && this.attackTimer === 0) {
                        this.attackTimer = 10;
                        this.swingArm();
                        this.attackTarget.takeHit(this, 3);
                        this.minecraft.soundManager.playSound("random.hit", this.x, this.y, this.z, 0.5, 1.2);
                    }
                } else {
                    // Follow player logic: maintain tether distance
                    const distToPlayer = this.getDistanceToEntity(player);
                    if (distToPlayer > 18.0) {
                        // Teleport if too far
                        let tx = player.x + (Math.random() - 0.5) * 6;
                        let tz = player.z + (Math.random() - 0.5) * 6;
                        let ty = this.world.findSafeSpawnY(Math.floor(tx), Math.floor(tz), player.y);
                        if (ty !== -1) {
                            this.setPosition(tx, ty, tz);
                            this.motionX = this.motionY = this.motionZ = 0;
                        }
                    } else if (distToPlayer > 12.0) {
                        // Return to player if outside the "freedom radius"
                        this.navigateTo(player.x, player.y, player.z, 1.2);
                    } else {
                        // Inside the radius: can wander freely using standard Mob AI
                        this.moveForward = 0;
                        
                        // Small chance to randomly lay down while in tether radius
                        if (this.layCooldown > 0) {
                            this.layCooldown--;
                        } else {
                            this.laying = true;
                            this.layDuration = 600 + Math.floor(Math.random() * 1200); 
                            this.layCooldown = 1200 + Math.floor(Math.random() * 2400); 
                        }

                        // Use base wander logic
                        if (!this.checkLuring()) {
                            super.onLivingUpdate();
                        }
                    }
                }
            } else if (this.laying) {
                this.moveForward = 0;
                this.moveStrafing = 0;
                this.currentPath = null;
                this.layDuration--;
                if (this.layDuration <= 0) {
                    this.laying = false;
                }
                // Wake up if player moves too far, or is interested in food, or if target appears
                if (this.getDistanceToEntity(player) > 6.0 || this.checkLuring()) {
                    this.laying = false;
                }
            } else {
                // Sitting
                this.moveForward = 0;
                this.moveStrafing = 0;
                this.currentPath = null;
            }
        } else {
            // Wild cat: Wander or be lured
            if (!this.checkLuring()) {
                // Randomly lay down while wandering
                if (this.laying) {
                    this.moveForward = 0;
                    this.layDuration--;
                    if (this.layDuration <= 0) this.laying = false;
                } else {
                    if (this.layCooldown > 0) {
                        this.layCooldown--;
                    } else {
                        this.laying = true;
                        this.layDuration = 600 + Math.floor(Math.random() * 1200);
                        this.layCooldown = 1200 + Math.floor(Math.random() * 2400);
                    }
                    super.onLivingUpdate();
                }
            } else {
                this.laying = false;
            }
        }

        // Fix: Force rotation to movement direction to prevent walking sideways/backwards
        let speedXZ = Math.sqrt(this.motionX * this.motionX + this.motionZ * this.motionZ);
        if (speedXZ > 0.01 && !this.sitting && !this.laying) {
            let targetYaw = Math.atan2(-this.motionX, -this.motionZ) * 180.0 / Math.PI;
            let diff = targetYaw - this.rotationYaw;
            while (diff < -180) diff += 360;
            while (diff >= 180) diff -= 360;
            this.rotationYaw += diff * 0.5;
        }

        this.rotationYawHead = this.rotationYaw;
        super.onLivingUpdate();

        if (this.collision && this.onGround && this.moveForward > 0) {
            this.jump();
        }
    }

    updateAttackTarget() {
        if (this.attackTarget && (this.attackTarget.isDead || this.getDistanceToEntity(this.attackTarget) > 16)) {
            this.attackTarget = null;
        }

        if (!this.attackTarget) {
            const hostileNames = ["EntityZombie", "EntityCreeper", "EntitySkeleton", "EntitySnowZombie", "EntityHusk", "EntityDrowned", "EntitySpider", "EntitySlime", "EntityEnderman"];
            let closest = null;
            let minDist = 12.0;

            for (let entity of this.world.entities) {
                if (hostileNames.includes(entity.constructor.name) && entity.health > 0) {
                    let d = this.getDistanceToEntity(entity);
                    if (d < minDist) {
                        minDist = d;
                        closest = entity;
                    }
                }
            }
            this.attackTarget = closest;
        }
    }

    checkLuring() {
        const player = this.minecraft.player;
        if (!player) return false;
        
        const heldId = player.inventory.getItemInSelectedSlot();
        const isFish = (heldId === 349 || heldId === 354);
        const dist = this.getDistanceToEntity(player);

        if (isFish && dist < 10.0) {
            this.faceLocation(player.x, player.z, 30, 30);
            if (dist > 2.5) {
                this.moveForward = 0.6;
            } else {
                this.moveForward = 0;
            }
            return true;
        }
        return false;
    }

    interact(player) {
        const heldId = player.inventory.getItemInSelectedSlot();
        const isFish = (heldId === 349 || heldId === 354);

        if (isFish) {
            if (player.gameMode !== 1) player.inventory.consumeItem(heldId);
            this.minecraft.soundManager.playSound("random.eat", this.x, this.y, this.z, 1.0, 1.2);
            
            if (!this.isTamed) {
                if (Math.random() < this.tamingChance) {
                    this.isTamed = true;
                    this.laying = false;
                    this.playMobSound("purreow");
                    this.minecraft.particleManager.spawnHeartParticles(this.world, this.x, this.y + this.height + 0.2, this.z, 5);
                    this.minecraft.soundManager.playSound("random.levelup", this.x, this.y, this.z, 0.5, 1.5);
                } else {
                    this.minecraft.particleManager.spawnCustomSmoke(this.world, this.x, this.y + this.height, this.z, 0x555555);
                    this.playMobSound("say");
                }
            } else {
                // Heal if already tamed
                this.health = Math.min(20, this.health + 4);
                this.playMobSound("purreow");
                this.minecraft.particleManager.spawnHeartParticles(this.world, this.x, this.y + this.height + 0.2, this.z, 2);
                
                // If kitten, advance growth
                if (this.isChild) {
                    this.growingAge += 2400; // Fast grow
                    if (this.growingAge >= 0) {
                        this.isChild = false;
                        this.updateSize();
                        if (this.renderer && this.renderer.group) delete this.renderer.group.buildMeta;
                    }
                }
            }
            return true;
        }

        if (this.isTamed) {
            this.sitting = !this.sitting;
            this.laying = false;
            
            // Interaction sound
            this.playMobSound("purreow");
            
            // Rebuild immediately to update animation state
            if (this.renderer && this.renderer.group) delete this.renderer.group.buildMeta;
            
            return true;
        }

        return false;
    }

    playMobSound(category) {
        // Map ambient vocalizations based on state
        if (category === "say") {
            if (this.sitting || this.laying) {
                category = "purr";
            } else if (this.checkLuring()) {
                category = "purreow";
            }
        }
        super.playMobSound(category);
    }

    getAnimationName() {
        if (this.health <= 0 || this.laying) return "lay";
        if (this.sitting) return "sit";
        let isMoving = Math.abs(this.x - this.prevX) > 0.01 || Math.abs(this.z - this.prevZ) > 0.01;
        return isMoving ? "walk" : "idle";
    }

    getAIMoveSpeed() {
        // Boosted base speed (from 0.12 to 0.16)
        let speed = 0.16 * this.speedMultiplier;
        // Faster when following player
        if (this.isTamed && !this.attackTarget && this.getDistanceToEntity(this.minecraft.player) > 12) {
            speed *= 1.4;
        }
        return speed;
    }

    takeHit(fromEntity, damage = 1) {
        if (!super.takeHit(fromEntity, damage)) return;

        this.playMobSound("hurt");
        if (this.health > 0 && this.onGround) {
            // Cats are nimble, they jump away when hit, but cap impulse to prevent sky-launching
            this.motionY = 0.3;
            this.motionX = (Math.random() - 0.5) * 0.44; // Increased 10%
            this.motionZ = (Math.random() - 0.5) * 0.44; // Increased 10%
        }
    }
}