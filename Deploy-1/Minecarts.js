import Entity from "./src/js/net/minecraft/client/entity/Entity.js";
import EntityRenderer from "./src/js/net/minecraft/client/render/entity/EntityRenderer.js";
import BlockItem from "./src/js/net/minecraft/client/world/block/type/BlockItem.js";
import BoundingBox from "./src/js/net/minecraft/util/BoundingBox.js";
import MathHelper from "./src/js/net/minecraft/util/MathHelper.js";
import * as THREE from "three";
import DroppedItem from "./src/js/net/minecraft/client/entity/DroppedItem.js";
import GltfEntityRenderer from "./src/js/net/minecraft/client/render/entity/GltfEntityRenderer.js";

export class EntityMinecart extends Entity {
    static name = "EntityMinecart";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.width = 0.98;
        this.height = 0.7;
        this.modelName = "minecart.gltf";
        this.scale = 1.0; 
        
        this.setPosition(this.x, this.y, this.z);
        
        this.motionX = 0;
        this.motionY = 0;
        this.motionZ = 0;
        
        this.onRail = false;
        this.railMeta = 0;

        this.ambientMinecartSound = null;
    }

    setPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        let w = this.width / 2;
        this.boundingBox = new BoundingBox(x - w, y, z - w, x + w, y + this.height, z + w);
    }

    getMountedYOffset() {
        return 0.35;
    }

    onUpdate() {
        // Ensure prevX/Y/Z are updated before we modify current coordinates
        super.onUpdate();

        if (this.isRemote) {
            // Interpolate position towards target synced from server
            let factor = 0.3;
            this.x += (this.targetX - this.x) * factor;
            this.y += (this.targetY - this.y) * factor;
            this.z += (this.targetZ - this.z) * factor;

            // Interpolate rotation
            let yawDiff = this.targetYaw - this.rotationYaw;
            while (yawDiff < -180) yawDiff += 360;
            while (yawDiff >= 180) yawDiff -= 360;
            this.rotationYaw += yawDiff * factor;
            
            this.setPosition(this.x, this.y, this.z);
            return;
        }

        let blockX = Math.floor(this.x);
        let blockY = Math.floor(this.y);
        let blockZ = Math.floor(this.z);
        
        // Handle slanting rails (if the rail is one block below or current)
        let blockId = this.world.getBlockAt(blockX, blockY, blockZ);
        if (blockId !== 66) {
            blockId = this.world.getBlockAt(blockX, blockY - 1, blockZ);
            if (blockId === 66) blockY--;
        }

        this.onRail = (blockId === 66);

        if (this.onRail) {
            this.railMeta = this.world.getBlockDataAt(blockX, blockY, blockZ);
            let railY = blockY + 0.0625;

            // Handle slopes
            if (this.railMeta >= 2 && this.railMeta <= 5) {
                let dx = this.x - blockX;
                let dz = this.z - blockZ;
                let h = 0;
                // 2: Asc East, 3: Asc West, 4: Asc North, 5: Asc South
                if (this.railMeta === 2) h = dx;
                else if (this.railMeta === 3) h = 1.0 - dx;
                else if (this.railMeta === 4) h = 1.0 - dz;
                else if (this.railMeta === 5) h = dz;
                railY += h;

                // Gravity on slope
                let gravity = 0.0078125;
                if (this.railMeta === 2) this.motionX += gravity;
                else if (this.railMeta === 3) this.motionX -= gravity;
                else if (this.railMeta === 4) this.motionZ -= gravity;
                else if (this.railMeta === 5) this.motionZ += gravity;
            }

            this.y = railY;
            this.motionY = 0;

            // Snap to axis and align rotation with smooth nudging
            const snapSpeed = 0.4;
            if (this.railMeta === 0 || (this.railMeta >= 4 && this.railMeta <= 5)) { // N-S or NS-Slope
                this.x += (blockX + 0.5 - this.x) * snapSpeed;
                this.rotationYaw = 0;
                this.motionX *= 0.5; // Dampen perpendicular momentum
            } else if (this.railMeta === 1 || (this.railMeta >= 2 && this.railMeta <= 3)) { // E-W or EW-Slope
                this.z += (blockZ + 0.5 - this.z) * snapSpeed;
                this.rotationYaw = 90;
                this.motionZ *= 0.5;
            } else if (this.railMeta >= 6 && this.railMeta <= 9) {
                // Curved Rail Logic: Redirect momentum and rotate
                let speed = Math.sqrt(this.motionX * this.motionX + this.motionZ * this.motionZ);
                if (speed > 0.01) {
                    // Meta 6: S-E, 7: S-W, 8: N-W, 9: N-E
                    if (this.railMeta === 6) { // South-East
                        if (this.motionZ < 0) { this.motionX = speed; this.motionZ = 0; }
                        else if (this.motionX < 0) { this.motionZ = speed; this.motionX = 0; }
                        this.rotationYaw = 45;
                    } else if (this.railMeta === 7) { // South-West
                        if (this.motionZ < 0) { this.motionX = -speed; this.motionZ = 0; }
                        else if (this.motionX > 0) { this.motionZ = speed; this.motionX = 0; }
                        this.rotationYaw = -45;
                    } else if (this.railMeta === 8) { // North-West
                        if (this.motionZ > 0) { this.motionX = -speed; this.motionZ = 0; }
                        else if (this.motionX > 0) { this.motionZ = -speed; this.motionX = 0; }
                        this.rotationYaw = -135;
                    } else if (this.railMeta === 9) { // North-East
                        if (this.motionZ > 0) { this.motionX = speed; this.motionZ = 0; }
                        else if (this.motionX < 0) { this.motionZ = -speed; this.motionX = 0; }
                        this.rotationYaw = 135;
                    }
                }
                
                // Centering on curve: nudge towards the midpoint of the arc
                this.x += (blockX + 0.5 - this.x) * snapSpeed;
                this.z += (blockZ + 0.5 - this.z) * snapSpeed;
            }

            // Player Pushing Logic
            let player = this.minecraft.player;
            if (player && this.boundingBox.grow(0.2, 0.2, 0.2).intersects(player.boundingBox)) {
                let dx = this.x - player.x;
                let dz = this.z - player.z;
                let dist = Math.sqrt(dx*dx + dz*dz);
                if (dist > 0) {
                    let pushForce = 0.04;
                    if (this.railMeta === 0 || this.railMeta >= 4) { // Only Z push
                        this.motionZ += Math.sign(dz) * pushForce;
                    } else if (this.railMeta === 1 || this.railMeta <= 3) { // Only X push
                        this.motionX += Math.sign(dx) * pushForce;
                    }
                }
            }

            // Riding control
            if (this.riddenByEntity) {
                let p = this.riddenByEntity;
                let move = p.moveForward || 0;
                let speedBoost = 0.08; // 60% faster boost (from 0.05)
                if (move !== 0) {
                    let look = p.getLook(1.0);
                    // Standardized control: WASD applies force relative to cart direction
                    this.motionX += look.x * speedBoost * Math.sign(move);
                    this.motionZ += look.z * speedBoost * Math.sign(move);
                }
            } else {
                // Collect nearby mobs into cart
                this.collectNearbyEntities();
            }

            // Friction (Lowered friction for smoother gliding)
            this.motionX *= 0.994;
            this.motionZ *= 0.994;
            
            // Limit speed
            const maxSpeed = 0.96; // 60% faster top speed (from 0.6)
            this.motionX = Math.max(-maxSpeed, Math.min(maxSpeed, this.motionX));
            this.motionZ = Math.max(-maxSpeed, Math.min(maxSpeed, this.motionZ));

            this.x += this.motionX;
            this.z += this.motionZ;

            // Minecart Movement Sounds
            const speed = Math.sqrt(this.motionX**2 + this.motionZ**2);
            if (speed > 0.01) {
                const sm = this.minecraft.soundManager;
                const isRidden = (this.riddenByEntity === this.minecraft.player);
                const soundKey = isRidden ? "minecart.inside" : "minecart.base";

                if (!this.ambientMinecartSound || !this.ambientMinecartSound.isPlaying || this.ambientMinecartSound.minecraftKey !== soundKey) {
                    if (this.ambientMinecartSound) this.ambientMinecartSound.stop();
                    this.ambientMinecartSound = sm.playSound(soundKey, this.x, this.y, this.z, isRidden ? 0.6 : 0.4, 1.0);
                    if (this.ambientMinecartSound) {
                        this.ambientMinecartSound.minecraftKey = soundKey;
                        this.ambientMinecartSound.onEnded = () => { this.ambientMinecartSound = null; };
                    }
                } else if (this.ambientMinecartSound instanceof THREE.PositionalAudio) {
                    this.ambientMinecartSound.position.set(this.x, this.y, this.z);
                }
            } else if (this.ambientMinecartSound) {
                this.ambientMinecartSound.stop();
                this.ambientMinecartSound = null;
            }
        } else {
            if (this.ambientMinecartSound) {
                this.ambientMinecartSound.stop();
                this.ambientMinecartSound = null;
            }
            // Gravity and friction off-rail
            this.motionY -= 0.04;
            this.motionX *= 0.95;
            this.motionZ *= 0.95;
            this.x += this.motionX;
            this.y += this.motionY;
            this.z += this.motionZ;

            // Basic floor collision
            let groundY = this.world.getHeightAt(Math.floor(this.x), Math.floor(this.z));
            if (this.y < groundY) {
                this.y = groundY;
                this.motionY = 0;
            }
        }

        this.setPosition(this.x, this.y, this.z);
    }

    interact(player) {
        if (this.riddenByEntity) {
            this.riddenByEntity.mountEntity(null);
        } else {
            player.mountEntity(this);
        }
        return true;
    }

    collectNearbyEntities() {
        if (this.riddenByEntity) return;
        
        const world = this.world;
        const radius = 1.0;
        for (let entity of world.entities) {
            // Mobs can be placed in minecarts
            if (entity !== this && entity.canBeCollidedWith && !entity.isRiding()) {
                const isMob = entity.constructor.name.startsWith("Entity") && entity.constructor.name !== "PlayerEntity" && entity.constructor.name !== "RemotePlayerEntity";
                if (isMob) {
                    const dx = entity.x - this.x;
                    const dz = entity.z - this.z;
                    if (dx*dx + dz*dz < radius * radius) {
                        entity.mountEntity(this);
                        break;
                    }
                }
            }
        }
    }

    takeHit(attacker, damage) {
        this.world.removeEntityById(this.id);
        let drop = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, 328, 1);
        this.world.droppedItems.push(drop);
    }
}

export class BlockMinecartItem extends BlockItem {
    constructor(id) {
        super(id, "../../items (1).png", 11);
        this.setMaxStackSize(1);
    }

    onItemUse(world, x, y, z, face, player) {
        let cart = new EntityMinecart(world.minecraft, world);
        // Spawn on top of the block clicked or on the rail
        cart.setPosition(x + 0.5, y + face.y, z + 0.5);
        world.addEntity(cart);
        
        // Play stone sound for minecart placement
        world.minecraft.soundManager.playSound("step.stone", x + 0.5, y + face.y, z + 0.5, 1.0, 1.0);

        if (player.gameMode !== 1) player.inventory.consumeItem(this.id);
        return true;
    }
}

