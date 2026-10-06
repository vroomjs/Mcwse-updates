import Mob from "/src/js/net/minecraft/client/entity/Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import DroppedItem from "../DroppedItem.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";

export default class EntitySpider extends Mob {
    static name = "EntitySpider";

    constructor(minecraft, world) {
        super(minecraft, world);
        
        this.baseWidth = 1.12; // Increased 60%
        this.baseHeight = 1.44; // Increased 60%
        
        this.setPosition(this.x, this.y, this.z);
        
        this.modelName = "spider.gltf";
        this.mobSoundPrefix = "mob.spider";
        this.health = 16;
        this.stepHeight = 1.0;

        this.aiState = 0; 
        this.aiTimer = 0;
        this.targetX = 0;
        this.targetZ = 0;

        this.attackTimer = 0;
        this.hurtTime = 0;
        this.deathTime = 0;
        
        this.isAggressive = false;

        // Editable speed values
        this.baseSpeed = 0.096; // Reduced 20%
        this.chaseSpeed = 0.2; // Reduced 20%
    }
    
    setPosition(x, y, z) {
        let width = Math.max(0.1, this.baseWidth + (this.attributeScale * 0.4));
        let height = Math.max(0.1, this.baseHeight + (this.attributeScale * 0.2));

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
            return;
        }

        if (this.hurtTime > 0) {
            this.hurtTime--;
            if (!this.isAggressive) {
                this.isAggressive = true; // Become aggressive if hit
                if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected && !this.isRemote) {
                    this.minecraft.multiplayer.broadcast({
                        type: "mob_aggro",
                        id: this.id,
                        aggro: true
                    });
                }
            }
        }
        if (this.attackTimer > 0) this.attackTimer--;

        // Check aggression state
        // Spiders are aggressive at night or if previously hit. 
        // In daylight (skylightSubtracted < 4) they are passive unless provoked.
        let isNight = this.world.time % 24000 > 13000 && this.world.time % 24000 < 23000;
        let inDaylight = this.world.skylightSubtracted < 4;
        
        let aggressive = this.isAggressive || (isNight && !inDaylight);

        const player = this.world.minecraft.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dz = player.z - this.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

        if (aggressive && dist < 16 && player.health > 0 && player.gameMode !== 1 && player.gameMode !== 3) {
            this.nextMoveUpdate = this.ticksExisted + 20;
            
            // Chase logic
            if (dist > 1.2) {
                this.navigateTo(player.x, player.y, player.z, 1.0);
            } else {
                this.moveForward = 0;
                this.faceLocation(player.x, player.z, 30, 30);
                
                // Attack jump
                if (this.onGround && this.attackTimer === 0) {
                    this.motionY = 0.4;
                    // Ensure no division by zero
                    let safeDist = Math.max(0.1, dist);
                    this.motionX = (dx / safeDist) * 0.5;
                    this.motionZ = (dz / safeDist) * 0.5;
                    this.attackTimer = 20;
                    
                    if (dist < 1.5) {
                        player.takeHit(this, 2);
                    }
                }
            }
        } else {
            // Normal wander if not aggressive or player far away
            this.isAggressive = false; // Reset temporary aggro if player lost
            // Wander logic inherited from Mob.js handles this
        }

        // Climbing wall logic
        if (this.isCollidedHorizontally) {
            this.motionY = 0.2;
        }

        this.rotationYawHead = this.rotationYaw;
        super.onLivingUpdate();
    }

    getAnimationName() {
        if (this.attackTimer > 0) return "attack";
        let isMoving = Math.abs(this.x - this.prevX) > 0.01 || Math.abs(this.z - this.prevZ) > 0.01;
        return isMoving ? "walk" : "idle";
    }

    getAIMoveSpeed() {
        return 0.08 * this.speedMultiplier;
    }

    takeHit(fromEntity, damage = 1) {
        if (!super.takeHit(fromEntity, damage)) return;
        this.isAggressive = true; // Retaliate

        if (fromEntity) {
            let dx = fromEntity.x - this.x;
            let dz = fromEntity.z - this.z;
            let mag = Math.sqrt(dx * dx + dz * dz);
            if (mag > 0) {
                this.motionX = (dx / mag) * 0.44; // Increased 10%
                this.motionZ = (dz / mag) * 0.44; // Increased 10%
                this.motionY = 0.2;
            }
        }

        this.playMobSound("hurt");
        
        if (this.health <= 0) {
            this.deathTime = 0;
            // Drop String (1-2)
            let count = 1 + Math.floor(Math.random() * 2);
            this.world.droppedItems.push(new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.STRING_ITEM.getId(), count));
            
            // 33% chance for Spider Eye (Using Raw Chicken as proxy if eye doesn't exist, but user only asked for string)
        }
    }

    updateBodyRotation() {
        this.renderYawOffset = this.rotationYaw;
        this.rotationYawHead = this.rotationYaw;
    }
}