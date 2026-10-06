import Mob from "/src/js/net/minecraft/client/entity/Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";
import DroppedItem from "../DroppedItem.js";

export default class EntityIronGolem extends Mob {
    static name = "EntityIronGolem";

    constructor(minecraft, world) {
        super(minecraft, world);
        
        this.baseWidth = 0.7; // Approx 1.4 blocks total width
        this.baseHeight = 2.7;
        this.scale = 1.0;
        
        this.modelName = "iron_golem.gltf";
        this.mobSoundPrefix = "mob.irongolem"; // Placeholder if sounds exist, otherwise fallbacks used
        this.health = 100;
        this.stepHeight = 1.0;

        this.aiState = 0; // 0=Idle, 1=Wander
        this.aiTimer = 0;
        this.targetX = 0;
        this.targetZ = 0;
        
        this.isAggressive = false;
        this.attackTimer = 0;
        this.playerAttacker = null;
        this.attackTarget = null;

        this.setPosition(this.x, this.y, this.z);
    }
    
    setPosition(x, y, z) {
        let width = Math.max(0.1, this.baseWidth + (this.attributeScale * 0.4));
        let height = Math.max(0.1, this.baseHeight + (this.attributeScale * 0.5));

        this.x = x;
        this.y = y;
        this.z = z;

        let w = width; // Radius
        this.boundingBox = new BoundingBox(
            x - w, y, z - w,
            x + w, y + height, z + w
        );

        try {
            if (this.renderer && this.renderer.group) {
                this.renderer.group.scale.set(this.scale, this.scale, this.scale);
            }
        } catch (e) {}
    }

    onLivingUpdate() {
        if (this.isRemote) {
            return super.onLivingUpdate();
        }

        if (this.health <= 0) {
            this.deathTime++;

            // Handle death drops on the first frame of death
            if (this.deathTime === 1) {
                this.playMobSound("death");
                
                // Drop Iron Ingots (5-7) as requested
                let ingotCount = 5 + Math.floor(Math.random() * 3);
                this.world.droppedItems.push(new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.IRON_INGOT.getId(), ingotCount));
                
                if (Math.random() < 0.5) {
                    let poppyCount = 1 + Math.floor(Math.random() * 2);
                    this.world.droppedItems.push(new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.ROSE.getId(), poppyCount));
                }
            }

            if (this.deathTime >= 20) {
                this.world.removeEntityById(this.id);
            }
            this.motionX = this.motionZ = this.moveForward = 0;
            return;
        }

        if (this.hurtTime > 0) this.hurtTime--;
        if (this.attackTimer > 0) this.attackTimer--;

        const player = this.minecraft.player;
        
        // --- 1. Target Management ---
        // Priority 1: Player if provoked
        // Priority 2: Nearest hostile mob within 10 blocks
        
        let target = null;
        const distToPlayer = this.getDistanceToEntity(player);
        
        if (this.isAggressive && player.health > 0 && player.gameMode !== 1 && player.gameMode !== 3 && distToPlayer < 32) {
            target = player;
        } else {
            // Scan for hostile mobs
            const hostileNames = ["EntityZombie", "EntityCreeper", "EntitySkeleton", "EntitySnowZombie", "EntityHusk", "EntityDrowned", "EntitySpider", "EntitySlime", "EntityEnderman"];
            let closestHostile = null;
            let minDist = 10.0; // 10 block radius as requested
            
            for (let entity of this.world.entities) {
                if (entity === this || entity === player || entity.health <= 0) continue;
                if (hostileNames.includes(entity.constructor.name)) {
                    let d = this.getDistanceToEntity(entity);
                    if (d < minDist) {
                        minDist = d;
                        closestHostile = entity;
                    }
                }
            }
            target = closestHostile;
        }

        // --- 2. Action Logic ---
        if (target) {
            const dist = this.getDistanceToEntity(target);
            this.faceLocation(target.x, target.z, 30, 30);
            this.navigateTo(target.x, target.y, target.z, 1.0);
            
            // Attack logic (range: 2.5 blocks for better reach)
            if (dist < 2.5 && this.attackTimer === 0) {
                this.attackTimer = 20; // 1s cooldown
                this.swingArm();
                // Deal exactly 7.5 hearts (15 points)
                const damage = 15;
                if (typeof target.takeHit === 'function') {
                    target.takeHit(this, damage);
                }
                this.minecraft.soundManager.playSound("random.hit", this.x, this.y, this.z, 1.0, 0.5);
                
                // Toss target up
                target.motionY += 0.4;
            }
        } else {
            // Calm down if player is gone/dead
            if (this.isAggressive && (distToPlayer > 32 || player.health <= 0)) {
                this.isAggressive = false;
            }
            
            // Wander AI
            if (this.aiState === 0) {
                this.moveForward = 0;
                if (this.aiTimer > 0) this.aiTimer--;
                else {
                    let angle = Math.random() * Math.PI * 2;
                    let distWander = 8 + Math.random() * 8;
                    let tx = this.x + Math.sin(angle) * distWander;
                    let tz = this.z + Math.cos(angle) * distWander;
                    let iy = this.world.getHighestBlockAt(Math.floor(tx), Math.floor(tz)) + 1;
                    
                    if (Math.abs(iy - this.y) < 3) {
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
                    this.aiTimer = 40 + Math.floor(Math.random() * 60);
                } else {
                    this.navigateTo(this.targetX, this.targetY, this.targetZ, 0.5);
                }
            }
        }
        
        this.rotationYawHead = this.rotationYaw;
        super.onLivingUpdate();

        if (this.collision && this.onGround && this.moveForward > 0) {
            this.jump();
        }
    }

    takeHit(fromEntity, damage = 1) {
        if (!super.takeHit(fromEntity, damage)) return;

        // Retaliate if hit by player
        if (fromEntity && fromEntity.constructor.name === "PlayerEntity") {
            this.isAggressive = true;
        }

        if (this.health <= 0) {
            this.deathTime = 0; // Will be incremented in onLivingUpdate
        }
    }

    getAnimationName() {
        if (this.attackTimer > 10) return "hit";
        let isMoving = Math.abs(this.x - this.prevX) > 0.01 || Math.abs(this.z - this.prevZ) > 0.01;
        return isMoving ? "walk" : "idle";
    }

    getAIMoveSpeed() {
        // Lowered base speed by 35% (0.12 * 0.65 = 0.078)
        // Constant speed for wander and chase
        return 0.078;
    }
}  