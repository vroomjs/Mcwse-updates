import Mob from "/src/js/net/minecraft/client/entity/Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import DroppedItem from "../DroppedItem.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";
import MathHelper from "../../../util/MathHelper.js";

export default class EntitySheep extends Mob {
    static name = "EntitySheep";

    constructor(minecraft, world) {
        super(minecraft, world);
        
        this.baseWidth = 0.72; // Increased 60%
        this.baseHeight = 2.08; // Increased 60%
        this.scale = 1.0; 
        
        this.setPosition(this.x, this.y, this.z);
        
        this.modelName = "sheepmob.gltf";
        this.mobSoundPrefix = "mob.sheep";
        this.health = 10; // Increased 25% from 8
        this.stepHeight = 1.0;

        this.aiState = 0; // 0=Idle, 1=Walk
        this.aiTimer = 0;
        this.targetX = 0;
        this.targetZ = 0;

        this.hurtTime = 0; 
        this.fleeUntil = 0; 
        this.deathTime = 0;
        
        this.sheared = false;
        
        // Define all 16 colors with their Wool Block IDs
        this.SHEEP_VARIANTS = [
            { id: 208, color: 0xFFFFFF }, // White
            { id: 369, color: 0xD87F33 }, // Orange
            { id: 370, color: 0xB24CD8 }, // Magenta
            { id: 371, color: 0x6699D8 }, // Light Blue
            { id: 372, color: 0xE5E533 }, // Yellow
            { id: 373, color: 0x7FCC19 }, // Lime
            { id: 374, color: 0xF27FA5 }, // Pink
            { id: 375, color: 0x4C4C4C }, // Gray
            { id: 376, color: 0x999999 }, // Light Gray
            { id: 377, color: 0x4C7F99 }, // Cyan
            { id: 378, color: 0x7F3FB2 }, // Purple
            { id: 379, color: 0x334CB2 }, // Blue
            { id: 380, color: 0x664C33 }, // Brown
            { id: 381, color: 0x667F33 }, // Green
            { id: 382, color: 0x993333 }, // Red
            { id: 383, color: 0x191919 }  // Black
        ];
        
        this.fleeceIndex = this.getRandomFleeceIndex();
        this.fleeceColor = this.SHEEP_VARIANTS[this.fleeceIndex].color;
    }

    getRandomFleeceIndex() {
        const r = Math.random();
        if (r < 0.81836) return 0;           // White: ~81.8%
        if (r < 0.86836) return 15;          // Black: ~5%
        if (r < 0.91836) return 7;           // Gray: ~5%
        if (r < 0.96836) return 8;           // Light Gray: ~5%
        if (r < 0.99836) return 12;          // Brown: ~3%
        return 6;                          // Pink: ~0.164%
    }

    setFleeceColor(index) {
        this.fleeceIndex = index;
        this.fleeceColor = this.SHEEP_VARIANTS[this.fleeceIndex].color;
    }
    
    setPosition(x, y, z) {
        let width = Math.max(0.1, this.baseWidth + (this.attributeScale * 0.25));
        let height = Math.max(0.1, this.baseHeight + (this.attributeScale * 0.4));

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
            // Jeb_ Rainbow Sheep Logic still runs locally for visual effect
            if (this.customName === "jeb_") {
                const hue = (this.ticksExisted % 60) / 60.0;
                this.fleeceColor = MathHelper.hsbToRgb(hue, 1.0, 1.0) & 0xFFFFFF;
            }
            return super.onLivingUpdate();
        }

        // Jeb_ Rainbow Sheep Logic
        if ((this.customName || "").toLowerCase() === "jeb_") {
            // Cycle hue over 3 seconds (60 ticks)
            const hue = (this.ticksExisted % 60) / 60.0;
            this.fleeceColor = MathHelper.hsbToRgb(hue, 1.0, 1.0) & 0xFFFFFF;
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

        // Wander logic
        if (this.targetX === 0 && this.targetZ === 0) {
            this.targetX = this.x;
            this.targetZ = this.z;
        }

        if (this.fleeUntil > this.ticksExisted) {
            let players = this.world.entities.filter(e => e.constructor && e.constructor.name === "PlayerEntity");
            if (players.length > 0) {
                let closest = players[0];
                let closestDist = Infinity;
                for (let p of players) {
                    let dx = p.x - this.x;
                    let dz = p.z - this.z;
                    let dsq = dx*dx + dz*dz;
                    if (dsq < closestDist) { closestDist = dsq; closest = p; }
                }
                let angleAway = Math.atan2(this.z - closest.z, this.x - closest.x) * 180.0 / Math.PI - 90.0;
                this.rotationYaw = angleAway;
                this.moveForward = 1.0;
            }
        } else {
            this.nextMoveUpdate = this.ticksExisted + 20;

            if (this.aiState === 0) {
                this.moveForward = 0;
                if (this.aiTimer > 0) this.aiTimer--;
                else {
                    // Try to eat grass and regrow wool
                    if (this.sheared && Math.random() < 0.2) {
                        let bx = Math.floor(this.x), by = Math.floor(this.y), bz = Math.floor(this.z);
                        if (this.world.getBlockAt(bx, by - 1, bz) === BlockRegistry.GRASS.getId()) {
                            this.world.setBlockAt(bx, by - 1, bz, BlockRegistry.DIRT.getId());
                            this.sheared = false;
                            this.minecraft.soundManager.playSound("step.grass", this.x, this.y, this.z, 1.0, 0.7);
                            this.aiTimer = 40; // Graze for a while
                            return;
                        }
                    }

                    let angle = Math.random() * Math.PI * 2;
                    let dist = 5 + Math.random() * 3;
                    let tx = this.x + Math.sin(angle) * dist;
                    let tz = this.z + Math.cos(angle) * dist;
                    let iy = this.world.getHeightAt(Math.floor(tx), Math.floor(tz));
                    if (Math.abs(iy - this.y) < 2) {
                        this.targetX = tx; this.targetZ = tz; this.targetY = iy;
                        this.aiState = 1; this.aiTimer = 100;
                    } else { this.aiTimer = 10; }
                }
            } else {
                if (this.aiTimer > 0) this.aiTimer--;
                let dx = this.targetX - this.x;
                let dz = this.targetZ - this.z;
                if (dx*dx + dz*dz < 1.0 || this.aiTimer <= 0) {
                    this.aiState = 0;
                    this.moveForward = 0;
                    this.currentPath = null;
                    this.aiTimer = 14 + Math.floor(Math.random() * 30);
                } else {
                    this.navigateTo(this.targetX, this.targetY, this.targetZ, 1.0);
                }
            }
        }
        
        this.rotationYawHead = this.rotationYaw;
        super.onLivingUpdate();

        if (this.collision && this.onGround && this.moveForward > 0) this.jump();

    }

    takeHit(fromEntity, damage = 1) {
        if (!super.takeHit(fromEntity, damage)) return;

        this.playMobSound("hurt");
        this.fleeUntil = this.ticksExisted + 80;
        
        if (this.health <= 0) {
            this.deathTime = 0;
            if (!this.sheared) {
                const woolId = this.SHEEP_VARIANTS[this.fleeceIndex].id;
                this.world.droppedItems.push(new DroppedItem(this.world, this.x, this.y + 0.5, this.z, woolId, 1));
            }
            // Sheep now drop raw mutton (ID 494)
            this.world.droppedItems.push(new DroppedItem(this.world, this.x, this.y + 0.5, this.z, 494, 1));
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

    interact(player) {
        const heldId = player.inventory.getItemInSelectedSlot();

        // Breeding
        if (heldId === BlockRegistry.WHEAT_ITEM.getId() && !this.isChild && this.growingAge === 0 && this.loveTimer === 0) {
            if (player.gameMode !== 1) player.inventory.consumeItem(heldId);
            this.loveTimer = 600;
            player.swingArm();
            this.minecraft.soundManager.playSound("random.eat", this.x, this.y, this.z, 1.0, 1.0);
            this.minecraft.particleManager.spawnHeartParticles(this.world, this.x, this.y + this.height + 0.5, this.z, 3);
            return true;
        }

        if (heldId === BlockRegistry.SHEARS.getId() && !this.sheared) {
            this.sheared = true;
            player.swingArm();
            
            // Drop 1-3 Wool as separate items with random velocity
            let count = 1 + Math.floor(Math.random() * 3);
            this.playMobSound("shear");
            
            const woolId = this.SHEEP_VARIANTS[this.fleeceIndex].id;
            
            for (let i = 0; i < count; i++) {
                let drop = new DroppedItem(this.world, this.x, this.y + 1.0, this.z, woolId, 1);
                drop.motionX = (Math.random() - 0.5) * 0.2;
                drop.motionZ = (Math.random() - 0.5) * 0.2;
                this.world.droppedItems.push(drop);
            }
            
            this.minecraft.soundManager.playSound("step.cloth", this.x, this.y, this.z, 1.0, 1.0);
            
            if (player.gameMode !== 1) {
                let slot = player.inventory.selectedSlotIndex;
                let stack = player.inventory.items[slot];
                if (stack && stack.id === BlockRegistry.SHEARS.getId()) {
                    stack.damage = (stack.damage || 0) + 1;
                    if (stack.damage >= 238) {
                        player.inventory.setStackInSlot(slot, 0, 0);
                        this.minecraft.soundManager.playSound("random.break_tool", player.x, player.y, player.z, 1.0, 1.0);
                    }
                }
            }
            return true;
        }
        return false;
    }

    getAnimationName() {
        let isMoving = Math.abs(this.x - this.prevX) > 0.01 || Math.abs(this.z - this.prevZ) > 0.01;
        return isMoving ? "walk" : "idle";
    }

    getAIMoveSpeed() {
        if (this.fleeUntil > this.ticksExisted) return 0.073; // Reduced 20%
        return 0.064; // Reduced 20%
    }

    updateBodyRotation() {
        this.renderYawOffset = this.rotationYaw;
        this.rotationYawHead = this.rotationYaw;
    }
}  