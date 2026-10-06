import Mob from "/src/js/net/minecraft/client/entity/Mob.js";
import BoundingBox from "../../../util/BoundingBox.js";
import { BlockRegistry } from "../../world/block/BlockRegistry.js";
import Block from "../../world/block/Block.js";
import DroppedItem from "../DroppedItem.js";
import Vector3 from "../../../util/Vector3.js";

export default class EntityEnderman extends Mob {
    static name = "EntityEnderman";

    constructor(minecraft, world) {
        super(minecraft, world);
        
        this.baseWidth = 0.3; 
        this.baseHeight = 2.9; 
        this.modelName = "enderman.gltf";
        this.mobSoundPrefix = "mob.enderman";
        this.health = 40;
        this.stepHeight = 1.0;
        this.speedMultiplier = 4.016; // 15% slower than previous 4.725

        this.carriedBlockId = 0;
        this.carriedBlockData = 0;

        this.isScreaming = false;
        this.isAggressive = false;

        this.teleportTimer = this.getRandomTeleportTime();
        this.blockActionTimer = 100; // Check every 5s
        this.blockPlaceTimer = 0;

        this.setPosition(this.x, this.y, this.z);
    }

    getRandomTeleportTime() {
        // 5 to 15 seconds (100 to 300 ticks)
        return 100 + Math.floor(Math.random() * 200);
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
            if (this.deathTime >= 20) this.world.removeEntityById(this.id);
            this.motionX = this.motionZ = this.moveForward = 0;
            return;
        }

        const player = this.minecraft.player;
        const dist = this.getDistanceToEntity(player);

        // 1. Screaming / Aggro Logic
        if (dist < 64 && player.health > 0 && player.gameMode !== 1 && player.gameMode !== 3) {
            let looking = this.isPlayerLookingAtMe(player);
            if (looking) {
                if (!this.isScreaming) {
                    this.isScreaming = true;
                    this.playMobSound("stare");
                    
                    // Force teleport towards player if stared at
                    if (!this.isRemote) {
                        this.teleportTowardsPlayer(player);
                        if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected) {
                            this.minecraft.multiplayer.broadcast({
                                type: "mob_aggro",
                                id: this.id,
                                aggro: true,
                                isScreaming: true
                            });
                        }
                    }
                }
                this.isAggressive = true;
            }

            // De-aggro if player is too far (e.g. 32 blocks)
            if (this.isAggressive && dist > 32) {
                this.isAggressive = false;
                this.isScreaming = false;
            }
        } else {
            this.isScreaming = false;
            this.isAggressive = false;
        }

        // 2. Teleportation Logic
        if (!this.isRemote) {
            this.teleportTimer--;
            
            // Aggressive teleportation: frequently teleport around player while chasing
            if (this.isAggressive && Math.random() < 0.04) { 
                this.teleportTowardsPlayer(player);
            }

            if (this.teleportTimer <= 0 || (this.isAggressive && Math.random() < 0.005)) {
                this.teleportRandomly();
                this.teleportTimer = this.getRandomTeleportTime();
            }
        }

        // 3. Block Manipulation
        if (!this.isRemote) {
            this.blockActionTimer--;
            if (this.blockActionTimer <= 0) {
                this.blockActionTimer = 100;
                // 2% chance to pick up
                if (this.carriedBlockId === 0 && Math.random() < 0.02) {
                    this.tryPickUpBlock();
                }
            }

            if (this.carriedBlockId !== 0) {
                this.blockPlaceTimer--;
                if (this.blockPlaceTimer <= 0) {
                    this.tryPlaceBlock();
                }
            }
        }

        // 4. Movement AI
        if (this.isAggressive) {
            this.navigateTo(player.x, player.y, player.z, 1.0);
            if (dist < 1.5 && this.ticksExisted % 20 === 0) {
                player.takeHit(this, 7); // 3.5 hearts
                this.swingArm();
            }
            // Essential physics update for aggressive mode
            this.onEntityUpdate();
            this.pushEntities();
            this.moveEntityWithHeading(this.moveForward, this.moveStrafing);
        } else {
            super.onLivingUpdate();
        }

        // Water Damage
        if (this.isInWater() && this.ticksExisted % 20 === 0) {
            this.takeHit(null, 1);
            this.teleportRandomly();
        }

        // Spawn 5 magenta smoke particles per second (1 every 4 ticks)
        if (!this.isRemote && this.ticksExisted % 4 === 0) {
            let px = this.x + (Math.random() - 0.5) * 0.6;
            let py = this.y + Math.random() * 2.5;
            let pz = this.z + (Math.random() - 0.5) * 0.6;
            this.minecraft.particleManager.spawnCustomSmoke(this.world, px, py, pz, 0xCC00CC);
        }

        this.rotationYawHead = this.rotationYaw;
    }

    isPlayerLookingAtMe(player) {
        // Raytrace check: is the player's crosshair hitting the Enderman's upper half?
        let hit = player.rayTrace(64, 1.0);
        if (hit && hit.entity === this) return true; // Simple entity hit check

        // Vector math check for accuracy
        let eye = player.getPositionEyes(1.0);
        let look = player.getLook(1.0);
        let toHead = new Vector3(this.x - eye.x, (this.y + this.height) - eye.y, this.z - eye.z);
        let d = toHead.distanceTo(new Vector3(0,0,0));
        toHead.x /= d; toHead.y /= d; toHead.z /= d;
        
        let dot = look.x * toHead.x + look.y * toHead.y + look.z * toHead.z;
        return dot > 0.99; // Very narrow cone
    }

    tryPickUpBlock() {
        let bx = Math.floor(this.x);
        let by = Math.floor(this.y - 0.1);
        let bz = Math.floor(this.z);
        let id = this.world.getBlockAt(bx, by, bz);
        
        const grabbable = [2, 3, 12, 13, 18, 37, 38, 39, 81, 82, 83, 86, 91, 103, 110, 121];
        if (grabbable.includes(id)) {
            this.carriedBlockId = id;
            this.carriedBlockData = this.world.getBlockDataAt(bx, by, bz);
            this.world.setBlockAt(bx, by, bz, 0);
            this.blockPlaceTimer = 600 + Math.floor(Math.random() * 600); // 30-60s
            this.playMobSound("pickup");
        }
    }

    tryPlaceBlock() {
        let bx = Math.floor(this.x + (Math.random() - 0.5) * 4);
        let bz = Math.floor(this.z + (Math.random() - 0.5) * 4);
        let by = this.world.getHeightAt(bx, bz);
        
        if (this.world.getBlockAt(bx, by, bz) === 0) {
            this.world.setBlockAt(bx, by, bz, this.carriedBlockId, this.carriedBlockData);
            this.carriedBlockId = 0;
            this.playMobSound("place");
        } else {
            this.blockPlaceTimer = 20; // Try again in 1s
        }
    }

    spawnTeleportParticles(x, y, z) {
        for (let i = 0; i < 32; i++) {
            let px = x + (Math.random() - 0.5) * 1.2;
            let py = y + Math.random() * 2.8;
            let pz = z + (Math.random() - 0.5) * 1.2;
            this.minecraft.particleManager.spawnCustomSmoke(this.world, px, py, pz, 0xCC00CC);
        }
    }

    teleportRandomly() {
        for (let i = 0; i < 64; i++) {
            let tx = this.x + (Math.random() - 0.5) * 40; // 20 block radius
            let tz = this.z + (Math.random() - 0.5) * 40;
            let ty = this.world.findSafeSpawnY(Math.floor(tx), Math.floor(tz), this.y);
            
            if (ty !== -1) {
                // MUST teleport on a solid block
                let bid = this.world.getBlockAt(Math.floor(tx), Math.floor(ty - 1), Math.floor(tz));
                if (bid === 0) continue;
                let b = Block.getById(bid);
                if (!b || !b.isSolid()) continue;

                this.spawnTeleportParticles(this.x, this.y, this.z);
                this.minecraft.soundManager.playSound("mob.enderman.portal", this.x, this.y, this.z, 1.0, 1.0);
                
                this.setPosition(tx, ty, tz);
                
                this.spawnTeleportParticles(this.x, this.y, this.z);
                this.minecraft.soundManager.playSound("mob.enderman.portal", this.x, this.y, this.z, 1.0, 1.0);
                return true;
            }
        }
        return false;
    }

    teleportTowardsPlayer(player) {
        for (let i = 0; i < 64; i++) {
            let angle = Math.random() * Math.PI * 2;
            let dist = 2 + Math.random() * 4;
            let tx = player.x + Math.cos(angle) * dist;
            let tz = player.z + Math.sin(angle) * dist;
            let ty = this.world.findSafeSpawnY(Math.floor(tx), Math.floor(tz), player.y);

            if (ty !== -1) {
                let bid = this.world.getBlockAt(Math.floor(tx), Math.floor(ty - 1), Math.floor(tz));
                if (bid === 0) continue;
                let b = Block.getById(bid);
                if (!b || !b.isSolid()) continue;

                this.spawnTeleportParticles(this.x, this.y, this.z);
                this.minecraft.soundManager.playSound("mob.enderman.portal", this.x, this.y, this.z, 1.0, 1.0);
                
                this.setPosition(tx, ty, tz);

                this.spawnTeleportParticles(this.x, this.y, this.z);
                this.minecraft.soundManager.playSound("mob.enderman.portal", this.x, this.y, this.z, 1.0, 1.0);
                
                // Immediately face player after teleport
                this.faceLocation(player.x, player.z, 360, 360);
                return true;
            }
        }
        return false;
    }

    takeHit(fromEntity, damage = 1) {
        if (!super.takeHit(fromEntity, damage)) return;

        this.playMobSound("hurt");

        if (this.health <= 0) {
            this.deathTime = 1; // Start death animation

            // 60% chance to drop Ender Pearl
            if (Math.random() < 0.6) {
                this.world.droppedItems.push(new DroppedItem(this.world, this.x, this.y + 0.5, this.z, 413, 1));
            }

            // Drop held block
            if (this.carriedBlockId !== 0) {
                this.world.droppedItems.push(new DroppedItem(this.world, this.x, this.y + 0.5, this.z, this.carriedBlockId, 1, { damage: this.carriedBlockData }));
                this.carriedBlockId = 0;
            }
        } else {
            this.isAggressive = true;
            // Retaliation teleport
            if (Math.random() < 0.5) this.teleportRandomly();
        }

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
    }

    getAIMoveSpeed() {
        return 0.064 * this.speedMultiplier;
    }

    getAnimationName() {
        let isMoving = Math.abs(this.x - this.prevX) > 0.005 || Math.abs(this.z - this.prevZ) > 0.005;
        const hasBlock = this.carriedBlockId !== 0;

        if (isMoving) {
            if (this.isScreaming || this.isAggressive) return "walkscream";
            if (hasBlock) return "holdwalk";
            return "walk";
        } else {
            if (hasBlock) return "holdidle";
            return "idle";
        }
    }
}