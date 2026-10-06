import Mob from "/src/js/net/minecraft/client/entity/Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import DroppedItem from "../DroppedItem.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";

export default class EntityCreeper extends Mob {
    static name = "EntityCreeper";

    constructor(minecraft, world) {
        super(minecraft, world);
        
        this.baseWidth = 0.48; // Increased 60%
        this.baseHeight = 2.72; // Increased 60%
        this.scale = 1.0; 
        
        this.setPosition(this.x, this.y, this.z);
        
        this.modelName = "creeperr.gltf";
        this.mobSoundPrefix = "mob.creeper";
        this.health = 20;
        this.stepHeight = 0.5;

        this.aiState = 0;
        this.aiTimer = 0;
        this.targetX = 0;
        this.targetZ = 0;

        this.fuseTime = 0;
        // Standard Creeper fuse is 30 ticks (1.5 seconds)
        this.MAX_FUSE = 30;
        this.deathTime = 0;
        this.hurtTime = 0;
    }
    
    setPosition(x, y, z) {
        let width = Math.max(0.1, this.baseWidth + (this.attributeScale * 0.25));
        let height = Math.max(0.1, this.baseHeight + (this.attributeScale * 0.5));

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

        if (this.hurtTime > 0) this.hurtTime--;

        const player = this.world.minecraft.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dz = player.z - this.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

        // Creeper AI
        if (dist < 16 && player.health > 0 && player.gameMode !== 1 && player.gameMode !== 3) {
            // Delay random wandering from Mob.js
            this.nextMoveUpdate = this.ticksExisted + 20;
            this.randomYawVelocity = 0;

            // Stop moving at 2 blocks. Keep trying until 3 blocks.
            let threshold = (this.fuseTime > 0) ? 3.0 : 2.0;

            if (dist > threshold) {
                // Use pathfinding
                this.navigateTo(player.x, player.y, player.z, 1.0);
                this.fuseTime = Math.max(0, this.fuseTime - 1);
            } else {
                this.moveForward = 0;
                this.currentPath = null; // Reset path
                
                // Face player for explosion
                this.faceLocation(player.x, player.z, 30, 30);
                
                this.fuseTime++;
                
                if (this.fuseTime === 1) {
                    this.playMobSound("fuse");
                }

                // Flash effect
                if ((this.fuseTime >> 1) % 2 === 0) {
                    this.hurtTime = 2;
                }

                if (this.fuseTime >= this.MAX_FUSE) {
                    this.explode();
                }
            }
        } else {
            this.fuseTime = Math.max(0, this.fuseTime - 1);
        }
        super.onLivingUpdate();
    }

    explode() {
        this.health = 0;
        this.deathTime = 20;
        
        const player = this.world.minecraft.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dz = player.z - this.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        // Create crater - slightly bigger and less patterned
        const radius = 4.0; // Increased from 3.0
        const rSq = radius * radius;
        const cx = Math.floor(this.x);
        const cy = Math.floor(this.y);
        const cz = Math.floor(this.z);

        for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
            for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
                for (let z = Math.floor(cz - radius); z <= Math.ceil(cz + radius); z++) {
                    let dSq = (x - this.x) ** 2 + (y - this.y) ** 2 + (z - this.z) ** 2;
                    // Introduce more noise to break the perfect sphere pattern
                    let noise = (Math.random() - 0.5) * 3.5;
                    if (dSq <= rSq + noise) {
                        let blockId = this.world.getBlockAt(x, y, z);
                        if (blockId !== 0 && blockId !== BlockRegistry.BEDROCK.getId()) {
                            this.world.setBlockAt(x, y, z, 0);
                        }
                    }
                }
            }
        }
        
        if (this.world.minecraft.worldRenderer) {
            this.world.minecraft.worldRenderer.flushRebuild = true;
        }

        let damage = 0;
        if (dist <= 1.5) {
            damage = 100; // Fatal at 1.5 blocks
        } else if (dist <= 2.5) {
            damage = 28; // Increased 40%
        } else if (dist <= 3.5) {
            damage = 13; // Increased 40%
        }

        if (damage > 0) {
            const diff = this.minecraft.settings.difficulty;
            if (diff === 1) damage *= 0.7;
            if (diff === 3) damage *= 1.25;
            player.takeHit(this, damage);
        }
        
        // Knockback scales down with distance
        if (dist < 5.0) {
            let scale = (5.0 - dist) / 5.0;
            let strength = 0.6 * scale;
            
            // Avoid division by zero
            let safeDist = dist + 0.01;
            
            player.motionX -= (dx / safeDist) * strength;
            player.motionY += 0.4 + scale * 0.4;
            player.motionZ -= (dz / safeDist) * strength;
        }
        
        // Sound
        this.world.minecraft.soundManager.playSound("random.explode", this.x, this.y, this.z, 4.0, (1.0 + (Math.random() - Math.random()) * 0.2) * 0.7);
        
        // Kill entity immediately
        this.world.removeEntityById(this.id);
        
        // Drop gunpowder (using coal texture as placeholder if needed, or just drop nothing for now)
        // User didn't ask for gunpowder.
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
        return 0.064 * this.speedMultiplier; // Reduced 20%
    }

    takeHit(fromEntity, damage = 1) {
        if (!super.takeHit(fromEntity, damage)) return;
        this.playMobSound("hurt");
        
        if (this.health <= 0) {
            this.deathTime = 0;
            
            // Drop Gunpowder (2-3)
            let count = 2 + Math.floor(Math.random() * 2); // 2 or 3
            let drop = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.GUNPOWDER.getId(), count);
            this.world.droppedItems.push(drop);
        }

        if (fromEntity) {
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
}


