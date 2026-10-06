import Mob from "/src/js/net/minecraft/client/entity/Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import DroppedItem from "../DroppedItem.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";
import Block from "../../world/block/Block.js";

export default class EntitySnowGolem extends Mob {
    static name = "EntitySnowGolem";

    constructor(minecraft, world) {
        super(minecraft, world);
        
        this.baseWidth = 0.56; // Increased 60%
        this.baseHeight = 3.04; // Increased 60%
        this.scale = 1.0; 
        
        this.setPosition(this.x, this.y, this.z);
        
        this.modelName = "snow golem (2).gltf";
        this.health = 4;
        this.stepHeight = 1.0;

        this.aiState = 0;
        this.aiTimer = 0;
        this.targetX = 0;
        this.targetZ = 0;
        
        this.sheared = false;
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
            if (this.deathTime >= 20) {
                this.world.removeEntityById(this.id);
            }
            this.motionX = 0;
            this.motionZ = 0;
            this.moveForward = 0;
            this.moveStrafing = 0;
            return;
        }

        // Wander AI
        if (this.targetX === 0 && this.targetZ === 0) {
            this.targetX = this.x;
            this.targetZ = this.z;
        }

        if (this.aiState === 0) {
            this.moveForward = 0;
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
                if (Math.random() < 0.5) {
                    this.aiTimer = 14 + Math.floor(Math.random() * 15);
                } else {
                    this.aiTimer = 0;
                }
            } else {
                this.moveForward = 0.2;
                let targetYaw = Math.atan2(dz, dx) * 180.0 / Math.PI - 90.0;
                let diff = targetYaw - this.rotationYaw;
                while (diff < -180) diff += 360;
                while (diff >= 180) diff -= 360;
                this.rotationYaw += diff * 0.15;
            }
        }
        this.rotationYawHead = this.rotationYaw;
        
        super.onLivingUpdate();

        // Update model visibility (Sheared state)
        if (this.renderer && this.renderer.mesh) {
            this.renderer.mesh.traverse(child => {
                if (child.name && child.name.toLowerCase().includes("pumpkin")) {
                    child.visible = !this.sheared;
                }
            });
        }

        // Snow trail logic: leave snow layer when walking
        if (Math.abs(this.x - this.prevX) > 0.01 || Math.abs(this.z - this.prevZ) > 0.01) {
            let x = Math.floor(this.x);
            let y = Math.floor(this.y);
            let z = Math.floor(this.z);

            if (this.world.getBlockAt(x, y, z) === 0) {
                let belowId = this.world.getBlockAt(x, y - 1, z);
                let belowBlock = Block.getById(belowId);
                if (belowBlock && belowBlock.isSolid()) {
                    this.world.setBlockAt(x, y, z, BlockRegistry.SNOW_LAYER.getId());
                }
            }
        }
    }

    interact(player) {
        let itemId = player.inventory.getItemInSelectedSlot();
        if (itemId === BlockRegistry.SHEARS.getId() && !this.sheared) {
            this.sheared = true;
            player.swingArm();
            
            // Drop Pumpkin
            let drop = new DroppedItem(this.world, this.x, this.y + 1.3, this.z, BlockRegistry.PUMPKIN.getId(), 1);
            this.world.droppedItems.push(drop);
            
            // Sound (using cloth step sound as shear proxy)
            this.minecraft.soundManager.playSound("step.cloth", this.x, this.y, this.z, 1.0, 1.0);
            
            // Damage Shears (Survival)
            if (player.gameMode !== 1) {
                let slot = player.inventory.selectedSlotIndex;
                let stack = player.inventory.items[slot];
                if (stack && stack.id === BlockRegistry.SHEARS.getId()) {
                    stack.damage = (stack.damage || 0) + 1;
                    if (stack.damage >= 238) { // Break tool
                        player.inventory.setStackInSlot(slot, 0, 0);
                        this.minecraft.soundManager.playSound("random.break", player.x, player.y, player.z, 1.0, 1.0);
                    }
                }
            }
            return true;
        }
        return false;
    }

    takeHit(fromEntity, damage = 1) {
        if (this.health <= 0) return;
        this.health -= damage;
        if (this.health <= 0) {
            this.deathTime = 0;
            // Drop Snow Blocks
            let count = 2 + Math.floor(Math.random() * 4);
            let drop = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, BlockRegistry.SNOW_BLOCK.getId(), count);
            this.world.droppedItems.push(drop);
            return;
        }
        if (fromEntity) {
            let nx = fromEntity.x - this.x;
            let nz = fromEntity.z - this.z;
            let len = Math.sqrt(nx*nx + nz*nz);
            if (len > 0) {
                nx /= len; nz /= len;
                this.motionX = -nx * 0.4;
                this.motionZ = -nz * 0.4;
                this.motionY = 0.3; 
            }
        }
    }

    updateBodyRotation() {
        this.renderYawOffset = this.rotationYaw;
        this.rotationYawHead = this.rotationYaw;
    }
}

