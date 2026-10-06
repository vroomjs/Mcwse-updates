import Mob from "/src/js/net/minecraft/client/entity/Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import DroppedItem from "../DroppedItem.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";

export default class EntityHorse extends Mob {
    static name = "EntityHorse";

    constructor(minecraft, world) {
        super(minecraft, world);
        
        this.baseWidth = 0.65;
        this.baseHeight = 1.6;
        this.scale = 1.0; 
        
        this.setPosition(this.x, this.y, this.z);
        
        this.modelName = "horse.gltf";
        this.mobSoundPrefix = "mob.horse"; // Placeholder

        // Randomly select horse texture
        const textures = [
            "../../horse_gray (1).png",
            "../../horse_brown (1).png",
            "../../horse_white (1).png",
            "../../horse_creamy (1).png",
            "../../horse_black (1).png",
            "../../horse_darkbrown (1).png"
        ];
        const variantIdx = Math.floor(Math.random() * textures.length);
        this.variantTexture = textures[variantIdx];
        
        // Stats mapping based on variant (Skin index)
        // Ranges: Speed (0.187 - 0.224), Health (20 - 34), Jump (0.42 - 0.62)
        const statsMap = [
            { hp: 30, speed: 0.190, jump: 0.48 }, // Gray
            { hp: 24, speed: 0.205, jump: 0.44 }, // Brown
            { hp: 20, speed: 0.187, jump: 0.62 }, // White (High jump)
            { hp: 22, speed: 0.218, jump: 0.45 }, // Creamy
            { hp: 26, speed: 0.224, jump: 0.52 }, // Black (High speed)
            { hp: 34, speed: 0.195, jump: 0.42 }  // Dark Brown (High health)
        ];
        
        const stats = statsMap[variantIdx];
        this.health = stats.hp;
        this.maxHealth = stats.hp;
        this.baseSpeed = stats.speed;
        this.jumpStrength = stats.jump;

        this.stepHeight = 1.0;

        // AI State
        this.aiState = 0; // 0=Idle, 1=Walk
        this.aiTimer = 0;
        this.targetX = 0;
        this.targetZ = 0;

        this.isTamed = false;
        this.tamingTimer = 0;
        
        // Randomly determine if this horse is a baby (10% chance on spawn)
        if (Math.random() < 0.1) {
            this.isChild = true;
            this.growingAge = -24000;
        }
        // 0: Saddle, 1: Armor, 2-13: Storage (12 slots)
        this.horseInventory = new Array(14).fill(null).map(() => ({id: 0, count: 0, tag: {}}));

        this.idleAnimationTimer = 0;
        this.currentIdleAnim = "idle";
        
        this.hurtTime = 0; 
        this.deathTime = 0;
        this.wasOnGround = true;
    }

    getMountedYOffset() {
        // Higher mounting point for horses compared to pigs
        return 0.65;
    }

    get isSaddled() {
        return this.horseInventory[0].id === BlockRegistry.SADDLE.getId();
    }

    get hasChest() {
        return this.horseInventory[1].id === BlockRegistry.CHEST.getId();
    }

    setPosition(x, y, z) {
        let width = Math.max(0.1, this.baseWidth + (this.attributeScale * 0.3));
        let height = Math.max(0.1, this.baseHeight + (this.attributeScale * 0.4));

        this.x = x;
        this.y = y;
        this.z = z;

        let w = width; 
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
            return;
        }

        if (this.hurtTime > 0) this.hurtTime--;

        if (this.riddenByEntity) {
            const player = this.riddenByEntity;

            // Taming logic
            if (!this.isTamed) {
                this.tamingTimer++;
                if (this.tamingTimer >= 40) { // 2 seconds
                    this.tamingTimer = 0;
                    if (Math.random() < 0.20) {
                        this.isTamed = true;
                        this.minecraft.soundManager.playSound("random.levelup", this.x, this.y, this.z, 0.5, 1.5);
                        this.minecraft.particleManager.spawnHeartParticles(this.world, this.x, this.y + this.height + 0.5, this.z, 5);
                    } else {
                        // Buck off
                        player.mountEntity(null);
                        player.motionY = 0.3;
                        player.motionZ = -Math.cos(this.rotationYaw * Math.PI / 180) * 0.4;
                        player.motionX = Math.sin(this.rotationYaw * Math.PI / 180) * 0.4;
                        this.hurtTime = 10; // Use hurt flash for bucking visual
                        this.playMobSound("angry");
                    }
                }
            }

            // Sync rotation
            this.rotationYaw = player.rotationYaw;
            this.prevRotationYaw = this.rotationYaw;
            this.rotationPitch = player.rotationPitch * 0.5;
            this.rotationYawHead = this.rotationYaw;
            this.renderYawOffset = this.rotationYaw;

            // Handle jumping
            if (player.jumping && this.onGround && this.hurtTime === 0) {
                this.jump();
            }

            // Handle movement input - ONLY if tamed AND saddled
            let forward = player.moveForward;
            let strafe = player.moveStrafing;

            // Stop moving if kicking (hurt animation)
            if (this.hurtTime > 0) {
                forward = 0;
                strafe = 0;
            }

            if (this.isTamed && this.isSaddled) {
                if (forward <= 0) {
                    forward *= 0.25; // Slower moving backwards
                }

                this.moveForward = forward;
                this.moveStrafing = strafe;

                this.moveEntityWithHeading(this.moveForward, this.moveStrafing);
            } else {
                this.moveForward = 0;
                this.moveStrafing = 0;
            }

            // Auto-jump for 1-block obstacles
            if (this.collision && this.onGround && this.moveForward > 0) {
                this.jump();
            }
            return;
        }

        // Idle animation cycling logic
        if (this.aiState === 0) {
            if (this.idleAnimationTimer > 0) {
                this.idleAnimationTimer--;
            } else {
                // Pick a random idle variant
                const r = Math.random();
                if (r < 0.1) {
                    this.currentIdleAnim = "idlewag1";
                    this.idleAnimationTimer = 40;
                } else if (r < 0.2) {
                    this.currentIdleAnim = "idlewag2";
                    this.idleAnimationTimer = 40;
                } else if (r < 0.25) {
                    this.currentIdleAnim = "idletap";
                    this.idleAnimationTimer = 30;
                } else if (r < 0.3) {
                    this.currentIdleAnim = "eat";
                    this.idleAnimationTimer = 60;
                } else {
                    this.currentIdleAnim = "idle";
                    this.idleAnimationTimer = 100;
                }
            }
        } else {
            this.currentIdleAnim = "idle";
            this.idleAnimationTimer = 0;
        }

        if (this.targetX === 0 && this.targetZ === 0) {
            this.targetX = this.x;
            this.targetZ = this.z;
        }

        // Wander AI (Basic)
        if (this.aiState === 0) {
            this.moveForward = 0;
            if (this.aiTimer > 0) {
                this.aiTimer--;
            } else {
                let angle = Math.random() * Math.PI * 2;
                let dist = 8 + Math.random() * 8;
                let tx = this.x + Math.sin(angle) * dist;
                let tz = this.z + Math.cos(angle) * dist;
                let iy = this.world.getHeightAt(Math.floor(tx), Math.floor(tz));
                
                if (Math.abs(iy - this.y) < 2) {
                    this.targetX = tx;
                    this.targetZ = tz;
                    this.targetY = iy;
                    this.aiState = 1; 
                    this.aiTimer = 160;
                } else {
                    this.aiTimer = 20;
                }
            }
        } else {
            if (this.aiTimer > 0) this.aiTimer--;
            let dx = this.targetX - this.x;
            let dz = this.targetZ - this.z;
            if (dx*dx + dz*dz < 1.0 || this.aiTimer <= 0) {
                this.aiState = 0;
                this.moveForward = 0;
                this.currentPath = null;
                this.aiTimer = 60 + Math.floor(Math.random() * 100);
            } else {
                this.navigateTo(this.targetX, this.targetY, this.targetZ, 0.6);
            }
        }

        this.rotationYawHead = this.rotationYaw;

        // Landing sound
        if (this.onGround && !this.wasOnGround) {
            this.playMobSound("land");
        }
        this.wasOnGround = this.onGround;

        super.onLivingUpdate();

        // Step / Gallop sounds
        if (this.onGround && !this.isRemote) {
            let movedDist = Math.sqrt((this.x - this.prevX)**2 + (this.z - this.prevZ)**2);
            if (movedDist > 0.01) {
                // We reuse EntityLiving's distanceWalked but apply our own step logic
                if (this.distanceWalked > this.nextStepDistance) {
                    // Horses step roughly every 0.45 - 0.7 units depending on speed
                    this.nextStepDistance = this.distanceWalked + (this.riddenByEntity ? 0.45 : 0.7);
                    this.playMobSound("gallop");
                }
            }
        }

        if (this.collision && this.onGround && this.moveForward > 0) {
            this.jump();
        }
    }

    takeHit(fromEntity, damage = 1) {
        // Prevent rapid hitting (0.9s delay)
        if (this.hurtTime > 0 || this.health <= 0) return;

        if (!super.takeHit(fromEntity, damage)) return;

        this.playMobSound("hurt");
        this.hurtTime = 18; // 0.9s (18 ticks)
        
        if (this.health <= 0) {
            this.deathTime = 0;
            // Drop Leather (0-2)
            let count = Math.floor(Math.random() * 3);
            if (count > 0) {
                this.world.droppedItems.push(new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.LEATHER.getId(), count));
            }
        }

        if (fromEntity) {
            let dx = fromEntity.x - this.x;
            let dz = fromEntity.z - this.z;
            let mag = Math.sqrt(dx*dx + dz*dz);
            if (mag > 0) {
                this.motionX = (dx/mag) * 0.4;
                this.motionZ = (dz/mag) * 0.4;
                this.motionY = 0.2;
            }
        }
    }

    getAnimationName() {
        if (this.hurtTime > 0) return "kick";
        let isMoving = Math.abs(this.x - this.prevX) > 0.005 || Math.abs(this.z - this.prevZ) > 0.005;
        if (isMoving) return "walk";
        return this.currentIdleAnim;
    }

    getAIMoveSpeed() {
        let speed = (this.baseSpeed || 0.187) * this.speedMultiplier;
        if (this.riddenByEntity) speed *= 1.1; // Slight multiplier when ridden
        return speed;
    }

    jump() {
        this.motionY = this.jumpStrength || 0.42;
        this.playMobSound("jump");
    }

    interact(player) {
        let heldId = player.inventory.getItemInSelectedSlot();
        
        // 1. Healing & Breeding & Growth logic
        if (heldId === BlockRegistry.APPLE.getId() || heldId === BlockRegistry.GOLDEN_APPLE.getId() || heldId === BlockRegistry.WHEAT_ITEM.getId() || heldId === BlockRegistry.SUGAR.getId()) {
            let used = false;
            
            // Heal
            if (this.health < this.maxHealth) {
                this.health = Math.min(this.maxHealth, this.health + (heldId === BlockRegistry.WHEAT_ITEM.getId() ? 2 : 4));
                used = true;
            }
            
            // Growth
            if (this.isChild) {
                this.growingAge += 1200; // Accelerated growth per item
                if (this.growingAge >= 0) {
                    this.growingAge = 0;
                    this.isChild = false;
                    this.setPosition(this.x, this.y, this.z);
                    if (this.renderer && this.renderer.group) delete this.renderer.group.buildMeta;
                }
                used = true;
            }
            
            // Breeding (Adult + Tamed)
            if (!this.isChild && this.isTamed && this.loveTimer === 0 && this.growingAge === 0 && (heldId === BlockRegistry.GOLDEN_APPLE.getId() || heldId === BlockRegistry.APPLE.getId())) {
                this.loveTimer = 600;
                used = true;
            }

            if (used) {
                if (player.gameMode !== 1) player.inventory.consumeItem(heldId);
                this.minecraft.soundManager.playSound("random.eat", this.x, this.y, this.z, 0.5, 1.0);
                this.minecraft.particleManager.spawnHeartParticles(this.world, this.x, this.y + this.height + 0.2, this.z, 2);
                return true;
            }
        }

        // 2. Mounting logic
        if (this.riddenByEntity && this.riddenByEntity !== player) {
            return false;
        }
        player.mountEntity(this);
        this.tamingTimer = 0;
        return true;
    }

    updateBodyRotation() {
        this.renderYawOffset = this.rotationYaw;
        this.rotationYawHead = this.rotationYaw;
    }
}