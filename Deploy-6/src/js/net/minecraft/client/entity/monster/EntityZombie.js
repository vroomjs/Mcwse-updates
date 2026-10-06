import Mob from "/src/js/net/minecraft/client/entity/Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import EntityLiving from "../EntityLiving.js";
import DroppedItem from "../DroppedItem.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";

export default class EntityZombie extends Mob {
    static name = "EntityZombie";

    constructor(minecraft, world) {
        super(minecraft, world);
        
        this.baseWidth = 0.48; // Increased 60%
        this.baseHeight = 3.12; // Increased 60%
        
        this.setPosition(this.x, this.y, this.z);
        
        this.modelName = "zombie (3).gltf";
        this.mobSoundPrefix = "mob.zombie";
        this.health = 20;
        this.stepHeight = 1.0;

        // AI State
        this.aiState = 0; // 0=Idle, 1=Walk
        this.aiTimer = 0;
        this.targetX = 0;
        this.targetZ = 0;

        this.attackTimer = 0;
        this.hurtTime = 0;
        this.deathTime = 0;
    }
    
    setPosition(x, y, z) {
        let width = Math.max(0.1, this.baseWidth + (this.attributeScale * 0.25));
        let height = Math.max(0.1, this.baseHeight + (this.attributeScale * 0.5));

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
            const isHusk = this.constructor.name === "EntityHusk";
            const inWater = this.isInWater();
            const hasHelmet = this.inventory && this.inventory.getArmor(0).id !== 0;

            if (!isHusk && !inWater && !hasHelmet && this.world.isAboveGround(this.x, this.y, this.z)) {
                this.remainingFireTicks = 100; // Keep burning
            }
        }

        // Initialize target if unset
        if (this.targetX === 0 && this.targetZ === 0) {
            this.targetX = this.x;
            this.targetZ = this.z;
        }

        const player = this.world.minecraft.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dz = player.z - this.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

        // Chase Logic
        if (dist < 15 && player.health > 0 && player.gameMode !== 1 && player.gameMode !== 3) {
            // Use pathfinding instead of direct movement
            if (dist > 1.0) {
                this.navigateTo(player.x, player.y, player.z, 1.0);
            } else {
                this.moveForward = 0;
                // Face player directly for attack
                this.faceLocation(player.x, player.z, 30, 30);
            }

            // Attack (0.8s cooldown = 16 ticks)
            if (dist < 1.5 && this.attackTimer === 0) {
                this.swingArm();
                if (typeof player.takeHit === "function") {
                    let damage = 2.25; // 10% less than 2.5
                    const diff = this.minecraft.settings.difficulty;
                    if (diff === 1) damage *= 0.7; // 30% less
                    if (diff === 3) damage *= 1.25; // 25% more
                    player.takeHit(this, damage);
                }
                this.attackTimer = 16; 
            }
        } else {
            // Reset path if lost target
            this.currentPath = null;
            
            // Wander logic (Matched to Cow/Chicken behavior)
            if (this.aiState === 0) { // Idle
                this.moveForward = 0;
                this.moveStrafing = 0;
                
                if (this.aiTimer > 0) {
                    this.aiTimer--;
                } else {
                    // Pick new target
                    let angle = Math.random() * Math.PI * 2;
                    let dist = 5 + Math.random() * 3;
                    
                    let tx = this.x + Math.sin(angle) * dist;
                    let tz = this.z + Math.cos(angle) * dist;
                    
                    // Find highest block at target
                    let ix = Math.floor(tx);
                    let iz = Math.floor(tz);
                    let iy = 127;
                    while (iy > 0) {
                        if (this.world.getBlockAt(ix, iy - 1, iz) !== 0) break;
                        iy--;
                    }
                    
                    if (Math.abs(iy - this.y) < 2 && this.world.getBlockAt(ix, iy, iz) === 0) {
                        this.targetX = tx;
                        this.targetZ = tz;
                        this.targetY = iy;
                        this.aiState = 1; // Start walking
                        this.aiTimer = 100;
                    } else {
                        this.aiTimer = 10;
                    }
                }
            } else { // Walking
                if (this.aiTimer > 0) this.aiTimer--;

                let tdx = this.targetX - this.x;
                let tdz = this.targetZ - this.z;
                let distSq = tdx*tdx + tdz*tdz;
                
                if (distSq < 1.0 || this.aiTimer <= 0) {
                    // Arrived
                    this.aiState = 0;
                    this.moveForward = 0;
                    
                    if (Math.random() < 0.5) {
                        this.aiTimer = 14 + Math.floor(Math.random() * 15);
                    } else {
                        this.aiTimer = 0;
                    }
                } else {
                    this.moveForward = 1.0;
                    
                    let targetYaw = Math.atan2(tdz, tdx) * 180.0 / Math.PI - 90.0;
                    
                    let diff = targetYaw - this.rotationYaw;
                    while (diff < -180) diff += 360;
                    while (diff >= 180) diff -= 360;
                    
                    this.rotationYaw += diff * 0.15;
                }
            }
        }

        this.rotationYawHead = this.rotationYaw;
        super.onLivingUpdate();
    }
    
    getAnimationName() {
        // If cooldown is active, we are attacking
        if (this.attackTimer > 0) {
            return "attack";
        }
        
        // Check movement
        let isMoving = Math.abs(this.x - this.prevX) > 0.01 || Math.abs(this.z - this.prevZ) > 0.01;
        if (isMoving) {
            return "walk";
        }
        
        return "idle";
    }

    getAIMoveSpeed() {
        return 0.064 * this.speedMultiplier; // Reduced 20%
    }

    takeHit(fromEntity, damage = 1) {
        if (!super.takeHit(fromEntity, damage)) return;

        this.playMobSound("hurt");
        
        if (this.health <= 0) {
            this.deathTime = 0;
            
            // Drop Rotten Flesh
            let fleshCount = 1;
            if (Math.random() < 0.6) fleshCount++;
            if (Math.random() < 0.2) fleshCount++;
            
            let flesh = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.ROTTEN_FLESH.getId(), fleshCount);
            this.world.droppedItems.push(flesh);

            // Drop Iron Ingot (1% chance)
            if (Math.random() < 0.01) {
                let iron = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.IRON_INGOT.getId(), 1);
                this.world.droppedItems.push(iron);
            }
        }

        if (fromEntity) {
            // Knockback: Calculate vector FROM attacker TO zombie so motionX points towards attacker.
            // Since travel() negates motionX, this results in moving AWAY from attacker.
            let dx = fromEntity.x - this.x;
            let dz = fromEntity.z - this.z;
            let mag = Math.sqrt(dx*dx + dz*dz);
            if (mag > 0) {
                this.motionX = (dx/mag) * 0.44; // Increased 10%
                this.motionZ = (dz/mag) * 0.44; // Increased 10%
                this.motionY = 0.2;
            }
        }
    }

    // Force the rendered body to always face the actual movement yaw (like other mobs)
    updateBodyRotation() {
        this.renderYawOffset = this.rotationYaw;
        this.rotationYawHead = this.rotationYaw;
    }
}

