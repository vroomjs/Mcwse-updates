import Mob from "/src/js/net/minecraft/client/entity/Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import DroppedItem from "../DroppedItem.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";

export default class EntityPig extends Mob {
    static name = "EntityPig";

    constructor(minecraft, world) {
        super(minecraft, world);
        
        this.baseWidth = 0.72; // Increased 60%
        this.baseHeight = 1.44; // Increased 60%
        this.scale = 1.0; 
        
        this.setPosition(this.x, this.y, this.z);
        
        this.modelName = "pig.gltf";
        this.mobSoundPrefix = "mob.pig";
        this.health = 10;
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
        let width = Math.max(0.1, this.baseWidth + (this.attributeScale * 0.3));
        let height = Math.max(0.1, this.baseHeight + (this.attributeScale * 0.3));

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
        } catch (e) {}
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
                    this.moveForward = 1.0;
                }
            } else {
                this.moveForward = 1.0;
            }
        } else {
            // Suppress Mob.js random wandering
            this.nextMoveUpdate = this.ticksExisted + 20;

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
        
        super.onLivingUpdate();

        if (this.collision && this.onGround && this.moveForward > 0) {
            this.jump();
        }
    }

    takeHit(fromEntity, damage = 1) {
        if (!super.takeHit(fromEntity, damage)) return;

        this.playMobSound("hurt");
        if (this.health <= 0) {
            this.deathTime = 0;
            
            // Drop Porkchop
            let count = 1;
            if (Math.random() < 0.5) count++;
            if (Math.random() < 0.15) count++;
            
            // Check if burning (not fully impl in Entity yet, but generic logic)
            // For now just raw porkchop
            let dropId = BlockRegistry.PORKCHOP.getId();
            
            let drop = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, dropId, count);
            this.world.droppedItems.push(drop);

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
            const KNOCKBACK = 0.44; // Increased 10%
            this.motionX = nx * KNOCKBACK;
            this.motionZ = nz * KNOCKBACK;
            this.motionY = 0.3; 
        }

        this.hurtTime = 10; 
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

    interact(player) {
        const heldId = player.inventory.getItemInSelectedSlot();

        // Breeding
        if ((heldId === BlockRegistry.CARROT_ITEM.getId() || heldId === BlockRegistry.POTATO_ITEM.getId()) && !this.isChild && this.growingAge === 0 && this.loveTimer === 0) {
            if (player.gameMode !== 1) player.inventory.consumeItem(heldId);
            this.loveTimer = 600;
            player.swingArm();
            this.minecraft.soundManager.playSound("random.eat", this.x, this.y, this.z, 1.0, 1.0);
            this.minecraft.particleManager.spawnHeartParticles(this.world, this.x, this.y + this.height + 0.5, this.z, 3);
            return true;
        }
        
        // Check if item is a Saddle (ID 408)
        if (heldId === BlockRegistry.SADDLE.getId()) {
            if (this.constructor.name === "EntityPig") { 
                // 1. Consume Saddle
                if (player.gameMode !== 1) {
                    player.inventory.consumeItem(heldId);
                }
                
                // 2. Kill current pig and spawn saddled version
                const newPig = new EntitySaddledPig(this.minecraft, this.world);
                newPig.id = this.id; 
                newPig.setPosition(this.x, this.y, this.z);
                newPig.rotationYaw = this.rotationYaw;
                newPig.rotationPitch = this.rotationPitch;
                newPig.health = this.health;
                
                this.world.removeEntityById(this.id);
                this.world.addEntity(newPig);
                
                player.swingArm();
                this.world.minecraft.soundManager.playSound("random.pop", this.x, this.y, this.z, 1.0, 1.0);
                
                // Immediately mount the player after saddling
                player.mountEntity(newPig);
                
                return true;
            }
        }
        
        return false;
    }
}

export class EntitySaddledPig extends EntityPig {
    static name = "EntitySaddledPig";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.modelName = "pig.gltf";
        this.stepHeight = 1.0;
    }

    getMountedYOffset() {
        // Lower the player into the pig so they sit on the back, not hover
        return 0;
    }

    interact(player) {
        if (this.riddenByEntity && this.riddenByEntity !== player) {
            return false;
        }
        if (!this.world.isRemote) {
            player.mountEntity(this);
        }
        return true;
    }

    onLivingUpdate() {
        if (this.health > 0) {
            if (this.onGround) {
                if (this.fallDistance > 3.0) {
                    let damage = Math.ceil((this.fallDistance - 3.0) * 1.25);
                    this.takeHit(null, damage);
                    if (this.health <= 0) {
                        this.minecraft.achievementManager.grant('whenpigsfly');
                    }
                }
                this.fallDistance = 0;
            } else if (this.motionY < 0) {
                this.fallDistance -= this.motionY;
            }
        }

        if (this.riddenByEntity) {
            const player = this.riddenByEntity;

            // Sync rotation
            this.rotationYaw = player.rotationYaw;
            this.prevRotationYaw = this.rotationYaw;
            this.rotationPitch = player.rotationPitch * 0.5;
            this.rotationYawHead = this.rotationYaw;
            this.renderYawOffset = this.rotationYaw;

            // Handle jumping
            if (player.jumping && this.onGround) {
                this.jump();
            }

            // Handle movement input
            let forward = player.moveForward;
            let strafe = player.moveStrafing;

            if (forward <= 0) {
                forward *= 0.25; // Slower moving backwards
            }

            this.moveForward = forward;
            this.moveStrafing = strafe;

            this.moveEntityWithHeading(this.moveForward, this.moveStrafing);

            // Auto-jump for 1-block obstacles
            if (this.collision && this.onGround && this.moveForward > 0) {
                this.jump();
            }
            return;
        }
        super.onLivingUpdate();
    }
    
    getAIMoveSpeed() {
        // Player base walk is 0.1444. 5% faster is ~0.1516
        let base = 0.1516;
        if (this.riddenByEntity) return base * 1.3; 
        if (this.fleeUntil > this.ticksExisted) return base * 1.15;
        return base;
    }
}

