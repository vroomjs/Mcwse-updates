import Mob from "./Mob.js";
import BoundingBox from "../../util/BoundingBox.js";
import DroppedItem from "./DroppedItem.js";
import { BlockRegistry } from "../world/block/BlockRegistry.js";

export default class EntityMod extends Mob {
    static name = "EntityMod";

    constructor(minecraft, world, modData) {
        super(minecraft, world);
        this.modData = modData;
        
        this.baseWidth = (modData.width || 0.6) / 2;
        this.baseHeight = modData.height || 1.8;
        this.modelName = modData.model; // Expected to be a key in resources
        this.health = modData.health || 20;
        
        // AI Settings
        this.aiType = modData.aiType || "passive"; // hostile, passive, neutral
        this.isAggressive = false;
        
        this.baseSpeed = modData.speed || 0.064; // Reduced another 20%
        this.chaseSpeed = this.baseSpeed * 1.5;

        this.setPosition(this.x, this.y, this.z);
    }

    onLivingUpdate() {
        if (this.health <= 0) {
            this.deathTime++;
            if (this.deathTime >= 20) {
                this.world.removeEntityById(this.id);
            }
            this.motionX = 0;
            this.motionZ = 0;
            return;
        }

        const player = this.minecraft.player;
        const dist = this.getDistanceToEntity(player);
        
        // Hostile logic or provoked neutral logic
        let shouldAttack = (this.aiType === "hostile");
        if (this.aiType === "neutral" && this.isAggressive) shouldAttack = true;

        if (shouldAttack && dist < 16 && player.health > 0 && player.gameMode !== 1 && player.gameMode !== 3) {
            // Face and navigate to player
            this.faceLocation(player.x, player.z, 30, 30);
            this.navigateTo(player.x, player.y, player.z, 1.0);
            
            // Attack logic (range: 1.5 blocks, cooldown: 1s)
            if (dist < 1.5 && this.ticksExisted % 20 === 0) {
                this.swingArm();
                if (typeof player.takeHit === "function") {
                    player.takeHit(this, this.modData.damage || 2);
                }
            }
        } else if (this.aiType === "scared" && dist < 8) {
            // Run away
            let angleAway = Math.atan2(this.z - player.z, this.x - player.x) * 180.0 / Math.PI - 90.0;
            this.rotationYaw = angleAway;
            this.moveForward = 1.0;
        } else if (this.aiType === "stalker" && dist < 16 && dist > 4) {
            // Stalk player but stay at distance
            this.faceLocation(player.x, player.z, 30, 30);
            this.navigateTo(player.x, player.y, player.z, 0.6);
        } else {
            // Normal wander/idle AI
            super.onLivingUpdate();
        }
        
        // Jump if colliding
        if (this.collision && this.onGround && this.moveForward > 0) this.jump();

        this.rotationYawHead = this.rotationYaw;
    }

    takeHit(fromEntity, damage = 1) {
        if (!super.takeHit(fromEntity, damage)) return;

        if (this.aiType === "neutral") this.isAggressive = true;

        if (this.health <= 0) {
            this.deathTime = 0;
            this.dropModItems();
        }

        // Apply knockback
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

    dropModItems() {
        if (!this.modData.drops) return;
        for (let drop of this.modData.drops) {
            if (Math.random() < (drop.chance || 1.0)) {
                let count = drop.min || 1;
                if (drop.max > drop.min) count += Math.floor(Math.random() * (drop.max - drop.min + 1));
                
                let itemId = drop.id;
                // resolve name to id if string
                if (typeof itemId === 'string') itemId = this.minecraft.commandHandler.itemMap[itemId.toLowerCase()];
                
                if (itemId) {
                    let item = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, itemId, count);
                    this.world.droppedItems.push(item);
                }
            }
        }
    }

    getAIMoveSpeed() {
        return this.isAggressive ? this.chaseSpeed : this.baseSpeed;
    }
}