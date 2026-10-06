import Entity from "./Entity.js";
import BoundingBox from "../../util/BoundingBox.js";
import Vector3 from "../../util/Vector3.js";
import Block from "../world/block/Block.js";
import DroppedItem from "./DroppedItem.js";
import { BlockRegistry } from "../world/block/BlockRegistry.js";

export default class EntityFishHook extends Entity {
    static name = "EntityFishHook";

    constructor(minecraft, world, owner) {
        super(minecraft, world);
        this.owner = owner;
        this.setSize(0.25, 0.25);
        
        this.inGround = false;
        this.inWater = false;
        this.ticksInAir = 0;
        this.ticksInGround = 0;
        
        this.bobOffset = Math.random() * Math.PI * 2;
        
        this.waitTimer = 0;
        this.biteTimer = 0;
        this.hookedEntity = null;
    }

    setSize(w, h) {
        this.width = w;
        this.height = h;
        this.boundingBox = new BoundingBox(this.x - w/2, this.y, this.z - w/2, this.x + w/2, this.y + h, this.z + w/2);
    }

    onUpdate() {
        super.onUpdate();

        // Check if owner is still holding rod
        if (!this.owner || this.owner.isDead || (this.owner.inventory && this.owner.inventory.getItemInSelectedSlot() !== 346)) {
            this.remove();
            return;
        }

        // Check distance
        let dx = this.x - this.owner.x;
        let dy = this.y - this.owner.y;
        let dz = this.z - this.owner.z;
        let distSq = dx*dx + dy*dy + dz*dz;
        if (distSq > 1024) { // 32 blocks
            this.remove();
            return;
        }

        // Handle hooked entity attachment
        if (this.hookedEntity) {
            if (this.hookedEntity.isDead || distSq > 1024) {
                this.hookedEntity = null;
            } else {
                // Update bobber to follow entity center
                let bb = this.hookedEntity.boundingBox;
                this.x = (bb.minX + bb.maxX) / 2;
                this.y = (bb.minY + bb.maxY) / 2;
                this.z = (bb.minZ + bb.maxZ) / 2;
                this.setPosition(this.x, this.y, this.z);
                return;
            }
        }

        if (this.inGround) {
            this.ticksInGround++;
            if (this.ticksInGround > 1200) this.remove();
            return;
        }

        this.ticksInAir++;

        // Water check
        let blockId = this.world.getBlockAt(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
        this.inWater = (blockId === 9 || blockId === 8);

        if (this.inWater) {
            // Floating logic: Increased drag to reduce sliding
            this.motionX *= 0.75;
            this.motionZ *= 0.75;
            
            // Buoyancy
            let waterLevel = Math.floor(this.y) + 1.0;
            let targetY = waterLevel - 0.1;
            
            // Fishing state machine
            if (this.biteTimer > 0) {
                this.biteTimer--;
                targetY -= 0.6; // Dipped!
                if (this.biteTimer <= 0) {
                    this.waitTimer = 100 + Math.random() * 400; // Reset wait
                }
            } else {
                if (this.waitTimer > 0) {
                    this.waitTimer--;
                } else {
                    // Start bite!
                    this.biteTimer = 20; // 1 second bite window
                    this.minecraft.soundManager.playSound("random.splash", this.x, this.y, this.z, 0.8, 1.0);
                }
                // Idle bobbing
                targetY += Math.sin(this.ticksExisted * 0.1 + this.bobOffset) * 0.05;
            }
            
            this.motionY += (targetY - this.y) * 0.1;
            this.motionY *= 0.8;
            
            this.move(this.motionX, this.motionY, this.motionZ);
        } else {
            // Reset timers if out of water
            this.waitTimer = 100 + Math.random() * 400;
            this.biteTimer = 0;

            // Normal projectile physics
            let vec3 = new Vector3(this.x, this.y, this.z);
            let nextVec3 = new Vector3(this.x + this.motionX, this.y + this.motionY, this.z + this.motionZ);
            let hit = this.world.rayTraceBlocks(vec3, nextVec3, false);

            if (hit) {
                this.x = hit.vector.x;
                this.y = hit.vector.y;
                this.z = hit.vector.z;
                this.inGround = true;
                this.motionX = this.motionY = this.motionZ = 0;
                return;
            }

            // Entity collision
            for (let entity of this.world.entities) {
                if (entity !== this.owner && entity.canBeCollidedWith && this.ticksInAir > 3) {
                    if (entity.boundingBox.intersects(this.boundingBox.expand(this.motionX, this.motionY, this.motionZ))) {
                        // Hook entity!
                        this.hookedEntity = entity;
                        this.minecraft.soundManager.playSound("random.bowhit", this.x, this.y, this.z, 1.0, 1.2);
                        return;
                    }
                }
            }

            this.move(this.motionX, this.motionY, this.motionZ);
            
            this.motionX *= 0.99;
            this.motionY *= 0.99;
            this.motionZ *= 0.99;
            this.motionY -= 0.04; // Gravity
        }

        this.setPosition(this.x, this.y, this.z);
    }

    move(dx, dy, dz) {
        let boundingBoxList = this.world.getCollisionBoxes(this.boundingBox.expand(dx, dy, dz));

        for (const bb of boundingBoxList) dy = bb.clipYCollide(this.boundingBox, dy);
        this.boundingBox.move(0, dy, 0);
        for (const bb of boundingBoxList) dx = bb.clipXCollide(this.boundingBox, dx);
        this.boundingBox.move(dx, 0, 0);
        for (const bb of boundingBoxList) dz = bb.clipZCollide(this.boundingBox, dz);
        this.boundingBox.move(0, 0, dz);

        this.onGround = dy !== this.motionY && this.motionY < 0;

        if (dx !== this.motionX) this.motionX = 0;
        if (dy !== this.motionY) this.motionY = 0;
        if (dz !== this.motionZ) this.motionZ = 0;

        this.x = (this.boundingBox.minX + this.boundingBox.maxX) / 2.0;
        this.y = this.boundingBox.minY;
        this.z = (this.boundingBox.minZ + this.boundingBox.maxZ) / 2.0;
    }

    reelIn() {
        if (this.biteTimer > 0) {
            // Success! Spawn loot
            this.spawnLoot();
        } else if (this.hookedEntity) {
            // Pull entity
            this.pullEntity();
        }
        
        this.remove();
    }

    spawnLoot() {
        this.minecraft.stats.fishCaught++;
        const fish = [349, 354];
        const junk = [281, 262, 550, 280, 287, 334, 352, 346];
        const treasureByMaterial = {
            gold: [283, 285, 284, 286, 294, 314, 315, 316, 317],
            iron: [267, 257, 256, 258, 292, 306, 307, 308, 309],
            diamond: [276, 278, 277, 279, 293, 310, 311, 312, 313]
        };
        const enchantmentPools = {
            armor: ["protection", "fire_protection", "blast_protection", "projectile_protection", "thorns", "unbreaking"],
            boots: ["feather_falling", "depth_strider", "frost_walker", "unbreaking"],
            sword: ["sharpness", "smite", "bane_of_arthropods", "knockback", "fire_aspect", "looting", "unbreaking"],
            tool: ["efficiency", "silk_touch", "fortune", "unbreaking"]
        };

        const pick = values => values[Math.floor(Math.random() * values.length)];
        const roll = Math.random() * 100;
        let finalId;
        let tag = {};
        let damage = 0;

        if (roll < 70) {
            // 70% fish
            finalId = pick(fish);
        } else if (roll < 90) {
            // 20% junk
            finalId = pick(junk);
        } else if (roll < 96) {
            // 6% damaged enchanted equipment: 40% gold, 50% iron, 10% diamond.
            const materialRoll = Math.random() * 100;
            const material = materialRoll < 40 ? "gold" : materialRoll < 90 ? "iron" : "diamond";
            finalId = pick(treasureByMaterial[material]);

            const block = Block.getById(finalId);
            damage = block && block.maxDamage > 1
                ? 1 + Math.floor(Math.random() * (block.maxDamage - 1))
                : 1;

            let pool;
            if ([283, 267, 276].includes(finalId)) pool = enchantmentPools.sword;
            else if ([314, 315, 316, 317, 306, 307, 308, 309, 310, 311, 312, 313].includes(finalId)) pool = enchantmentPools.armor;
            else pool = enchantmentPools.tool;

            tag.enchanted = true;
            tag.enchantments = {};
            const enchantCount = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < enchantCount; i++) {
                const name = pick(pool);
                tag.enchantments[name] = Math.max(tag.enchantments[name] || 0, 1 + Math.floor(Math.random() * 3));
            }
        } else {
            // 4% enchanted book. Pick from registered book IDs so no invalid
            // placeholder item can be generated.
            const books = [];
            for (let id = 3000; id <= 3135; id++) {
                if (Block.getById(id)) books.push(id);
            }
            finalId = books.length > 0 ? pick(books) : 3000;
        }

        const drop = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, finalId, 1, tag);
        drop.damage = damage;
        drop.pickupDelay = 0; // Make instantly collectible for fishing success
        
        // Calculate vector to player
        let dx = this.owner.x - this.x;
        let dy = (this.owner.y + 1.0) - this.y;
        let dz = this.owner.z - this.z;
        let dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist > 0) {
            let speed = 0.2 + dist * 0.05;
            drop.motionX = (dx / dist) * speed;
            drop.motionY = (dy / dist) * speed + 0.2;
            drop.motionZ = (dz / dist) * speed;
        }
        
        this.world.droppedItems.push(drop);
        this.minecraft.soundManager.playSound("random.pop", this.x, this.y, this.z, 0.5, 1.2);
    }

    pullEntity() {
        if (!this.hookedEntity) return;
        
        let dx = this.owner.x - this.hookedEntity.x;
        let dy = (this.owner.y + 1.0) - this.hookedEntity.y;
        let dz = this.owner.z - this.hookedEntity.z;
        let dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist > 0) {
            let pullForce = 0.6;
            // Negate X and Z force because EntityLiving displacement is -motionX/-motionZ
            this.hookedEntity.motionX -= (dx / dist) * pullForce;
            this.hookedEntity.motionY += (dy / dist) * pullForce + 0.2;
            this.hookedEntity.motionZ -= (dz / dist) * pullForce;
        }
    }

    remove() {
        if (this.owner && this.owner.fishEntity === this) {
            this.owner.fishEntity = null;
        }
        this.world.removeEntityById(this.id);
    }
}
