import Mob from "/src/js/net/minecraft/client/entity/Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import DroppedItem from "../DroppedItem.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";

export default class EntityChicken extends Mob {
    static name = "EntityChicken";

    constructor(minecraft, world) {
        super(minecraft, world);
        
        this.baseWidth = 0.32; // Increased 60%
        this.baseHeight = 1.12; // Increased 60%
        this.scale = 1.0; 
        
        this.setPosition(this.x, this.y, this.z);
        
        this.modelName = "chicken (3).gltf";
        this.mobSoundPrefix = "mob.chicken";
        this.health = 4;
        this.stepHeight = 1.0;

        this.aiState = 0;
        this.aiTimer = 0;
        this.targetX = 0;
        this.targetZ = 0;

        this.hurtTime = 0; 
        this.fleeUntil = 0; 
        
        this.deathTime = 0;
    }
    
    setPosition(x, y, z) {
        let width = Math.max(0.1, this.baseWidth + (this.attributeScale * 0.15));
        let height = Math.max(0.1, this.baseHeight + (this.attributeScale * 0.2));

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

        try {
            if (this.renderer && this.renderer.group) {
                this.renderer.group.scale.set(this.scale, this.scale, this.scale);
            }
        } catch (e) {
        }
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

        if (this.hurtTime > 0) {
            this.hurtTime--;
        }

        if (this.targetX === 0 && this.targetZ === 0) {
            this.targetX = this.x;
            this.targetZ = this.z;
        }

        if (this.fleeUntil > this.ticksExisted) {
            let players = this.world.entities.filter(e => e.constructor && e.constructor.name === "PlayerEntity");
            if (players.length > 0) {
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
                    let angleAway = Math.atan2(this.z - closest.z, this.x - closest.x) * 180.0 / Math.PI - 90.0;
                    this.rotationYaw = angleAway;
                    this.rotationYawHead = this.rotationYaw;
                    this.moveForward = 0.52;
                }
            } else {
                this.moveForward = 0.26;
            }
        } else {
            if (this.aiState === 0) {
                this.moveForward = 0;
                this.moveStrafing = 0;
                
                if (this.aiTimer > 0) {
                    this.aiTimer--;
                } else {
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
                        this.aiState = 1; 
                        this.aiTimer = 100;
                    } else {
                        this.aiTimer = 10;
                    }
                }
            } else {
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
            this.rotationYawHead = this.rotationYaw;
        }
        
        if (!this.onGround && this.motionY < 0) {
            this.motionY *= 0.6;
        }

        super.onLivingUpdate();

        // Jump if colliding with a block while moving
        if (this.collision && this.onGround && this.moveForward > 0) {
            this.jump();
        }
    }

    takeHit(fromEntity, damage = 1) {
        if (this.health <= 0) return;

        this.health -= damage;
        this.playMobSound("hurt");
        if (this.health <= 0) {
            this.deathTime = 0;

            // Drop Chicken
            let chickenCount = 1;
            if (Math.random() < 0.4) chickenCount++;
            let chicken = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.RAW_CHICKEN.getId(), chickenCount);
            this.world.droppedItems.push(chicken);

            // Drop Feather
            let featherCount = 0;
            if (Math.random() < 0.8) featherCount++;
            if (Math.random() < 0.4) featherCount++;
            
            if (featherCount > 0) {
                let feather = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.FEATHER.getId(), featherCount);
                this.world.droppedItems.push(feather);
            }

            return;
        }

        if (fromEntity) {
            let nx = fromEntity.x - this.x;
            let nz = fromEntity.z - this.z;
            let len = Math.sqrt(nx*nx + nz*nz);
            if (len === 0) {
                let ang = Math.random() * Math.PI * 2;
                nx = Math.cos(ang);
                nz = Math.sin(ang);
                len = 1;
            }
            nx /= len;
            nz /= len;
            const KNOCKBACK = 0.5;
            this.motionX = nx * KNOCKBACK;
            this.motionZ = nz * KNOCKBACK;
            this.motionY = 0.3; 
        }

        this.hurtTime = 10; 
        const ticks = 80; 
        this.fleeUntil = this.ticksExisted + ticks;
    }

    getAIMoveSpeed() {
        if (this.fleeUntil > this.ticksExisted) return 0.073; // Reduced 20%
        return 0.064; // Reduced 20%
    }

    getAnimationName() {
        let isMoving = Math.abs(this.x - this.prevX) > 0.01 || Math.abs(this.z - this.prevZ) > 0.01;
        return isMoving ? "walk" : "idle";
    }

    updateBodyRotation() {
        this.renderYawOffset = this.rotationYaw;
        this.rotationYawHead = this.rotationYaw;
    }

    interact(player) {
        let heldId = player.inventory.getItemInSelectedSlot();
        // Chickens breed with seeds
        if (heldId === BlockRegistry.WHEAT_SEEDS.getId() && !this.isChild && this.growingAge === 0 && this.loveTimer === 0) {
            if (player.gameMode !== 1) player.inventory.consumeItem(heldId);
            this.loveTimer = 600; 
            player.swingArm();
            this.minecraft.soundManager.playSound("random.eat", this.x, this.y, this.z, 1.0, 1.0);
            this.minecraft.particleManager.spawnHeartParticles(this.world, this.x, this.y + this.height + 0.3, this.z, 3);
            return true;
        }
        return false;
    }
}

