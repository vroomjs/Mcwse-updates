import Mob from "/src/js/net/minecraft/client/entity/Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";
import GuiVillager from "../../gui/screens/GuiVillager.js";

export default class EntityVillager extends Mob {
    static name = "EntityVillager";

    constructor(minecraft, world) {
        super(minecraft, world);
        
        this.baseWidth = 0.48; // Increased 60%
        this.baseHeight = 3.12; // Increased 60%
        
        // Randomize profession between Butcher, Farmer, Librarian, Smith (Blacksmith), Priest (Cleric)
        this.profession = ["butcher", "farmer", "librarian", "smith", "priest"][Math.floor(Math.random() * 5)];
        this.modelName = "villagermob.gltf";
        this.mobSoundPrefix = "mob.villager";
        this.health = 20;
        this.stepHeight = 0.5;
        
        this.setPosition(this.x, this.y, this.z);

        // AI State
        this.aiState = 0;
        this.aiTimer = 0;
        this.targetX = 0;
        this.targetZ = 0;

        this.trades = null;
    }

    getTrades() {
        if (!this.trades) {
            this.generateTrades();
        }
        return this.trades;
    }

    generateTrades() {
        const trades = [];
        const E = BlockRegistry.EMERALD.getId();

        switch (this.profession) {
            case "butcher":
                trades.push({ in1: {id: BlockRegistry.BEEF.getId(), count: 14}, out: {id: E, count: 1} });
                trades.push({ in1: {id: BlockRegistry.PORKCHOP.getId(), count: 14}, out: {id: E, count: 1} });
                trades.push({ in1: {id: BlockRegistry.RAW_CHICKEN.getId(), count: 14}, out: {id: E, count: 1} });
                trades.push({ in1: {id: E, count: 1}, out: {id: BlockRegistry.COOKED_BEEF.getId(), count: 3} });
                trades.push({ in1: {id: E, count: 1}, out: {id: BlockRegistry.COOKED_CHICKEN.getId(), count: 3} });
                break;
            case "farmer":
                trades.push({ in1: {id: BlockRegistry.WHEAT_ITEM.getId(), count: 18}, out: {id: E, count: 1} });
                trades.push({ in1: {id: BlockRegistry.CARROT_ITEM.getId(), count: 15}, out: {id: E, count: 1} });
                trades.push({ in1: {id: BlockRegistry.POTATO_ITEM.getId(), count: 15}, out: {id: E, count: 1} });
                trades.push({ in1: {id: E, count: 1}, out: {id: BlockRegistry.BREAD.getId(), count: 4} });
                trades.push({ in1: {id: E, count: 1}, out: {id: BlockRegistry.PUMPKIN.getId(), count: 1} });
                break;
            case "librarian":
                trades.push({ in1: {id: BlockRegistry.PAPER.getId(), count: 24}, out: {id: E, count: 1} });
                trades.push({ in1: {id: E, count: 1}, out: {id: BlockRegistry.BOOK.getId(), count: 1} });
                trades.push({ in1: {id: E, count: 4}, out: {id: BlockRegistry.BOOKSHELF.getId(), count: 1} });
                trades.push({ in1: {id: E, count: 1}, out: {id: BlockRegistry.GLASS.getId(), count: 4} });
                break;
            case "priest":
                trades.push({ in1: {id: BlockRegistry.ROTTEN_FLESH.getId(), count: 32}, out: {id: E, count: 1} });
                trades.push({ in1: {id: BlockRegistry.GOLD_INGOT.getId(), count: 8}, out: {id: E, count: 1} });
                trades.push({ in1: {id: E, count: 1}, out: {id: BlockRegistry.REDSTONE.getId(), count: 4} });
                trades.push({ in1: {id: E, count: 2}, out: {id: BlockRegistry.GLOWSTONE.getId(), count: 1} });
                break;
            case "smith":
            default:
                trades.push({ in1: {id: BlockRegistry.COAL.getId(), count: 16}, out: {id: E, count: 1} });
                trades.push({ in1: {id: BlockRegistry.IRON_INGOT.getId(), count: 4}, out: {id: E, count: 1} });
                trades.push({ in1: {id: E, count: 3}, out: {id: BlockRegistry.IRON_PICKAXE.getId(), count: 1} });
                break;
        }

        this.trades = trades;
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
            return;
        }

        // Suppress Mob.js random wandering
        this.nextMoveUpdate = this.ticksExisted + 20;

        if (this.targetX === 0 && this.targetZ === 0) {
            this.targetX = this.x;
            this.targetZ = this.z;
        }

        if (this.aiState === 0) { // Idle
            this.moveForward = 0;
            this.moveStrafing = 0;
            
            if (this.aiTimer > 0) {
                this.aiTimer--;
            } else {
                // Pick new target frequently (active wandering)
                let angle = Math.random() * Math.PI * 2;
                let dist = 5 + Math.random() * 5;
                
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
        } else { // Walking
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
        super.onLivingUpdate();
    }

    getAnimationName() {
        let isMoving = Math.abs(this.x - this.prevX) > 0.01 || Math.abs(this.z - this.prevZ) > 0.01;
        return isMoving ? "walk" : "idle";
    }

    getAIMoveSpeed() {
        return 0.064; // Reduced another 20%
    }

    updateBodyRotation() {
        this.renderYawOffset = this.rotationYaw;
        this.rotationYawHead = this.rotationYaw;
    }

    takeHit(fromEntity, damage = 1) {
        if (this.health <= 0) return;
        this.health -= damage;
        this.hurtTime = 10;
        this.playMobSound("hurt");
        if (this.health <= 0) {
            this.deathTime = 0;
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

    interact(player) {
        this.playMobSound("haggle");
        this.minecraft.displayScreen(new GuiVillager(player, this));
        return true;
    }
}

