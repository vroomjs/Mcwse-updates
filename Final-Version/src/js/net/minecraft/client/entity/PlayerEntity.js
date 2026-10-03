import Inventory from "../inventory/Inventory.js";
import EntityLiving from "./EntityLiving.js";
import BoundingBox from "../../util/BoundingBox.js";
import Block from "../world/block/Block.js";
import MathHelper from "../../util/MathHelper.js";
import Keyboard from "../../util/Keyboard.js";
import Vector3 from "../../util/Vector3.js";
import {BlockRegistry} from "../world/block/BlockRegistry.js";
import DroppedItem from "./DroppedItem.js";
import GuiChat from "../gui/screens/GuiChat.js";
import { getFoodStats } from "../food/FoodStats.js";

export default class PlayerEntity extends EntityLiving {

    static name = "PlayerEntity";

    constructor(minecraft, world) {
        super(minecraft, world);

        this.gameMode = world.gameMode; // 0: Survival, 1: Creative
        this.skin = "char.png";
        this.capabilities = {
            allowFlying: this.gameMode === 1
        };

        this.inventory = new Inventory(minecraft, this.gameMode === 1);

        this.collision = false;

        this.foodLevel = 20; // Default food level
        // A newly spawned player has full hunger but only the normal starter
        // saturation reservoir. Starting at the hard cap would hide hunger
        // loss until hundreds of blocks of exhaustion had accumulated.
        this.foodSaturationLevel = 2.5;
        this.foodExhaustionLevel = 0;
        this.foodTimer = 0;
        this.healthRegenTimer = 0;
        this.regenBoostTimer = 0; // For golden apple effect
        this.hungerEffectTimer = 0; // For "Hunger" status effect (Rotten Flesh/Raw Chicken)

        this.itemInUse = null;
        this.itemInUseTimer = 0;

        this.jumpMovementFactor = 0.02;
        this.speedInAir = 0.02;
        this.flySpeed = 0.05;
        this.stepHeight = 0.5;
        this.maxHealth = 20.0;

        this.flyToggleTimer = 0;
        this.sprintToggleTimer = 0;

        this.sprinting = false;
        this.flying = false;

        this.isSneakingPersistent = false;

        this.prevFovModifier = 0;
        this.fovModifier = 0;
        this.timeFovChanged = 0;

        this.renderArmPitch = 0;
        this.renderArmYaw = 0;
        this.swingingHand = 'main'; // 'main' or 'off'

        this.prevRenderArmPitch = 0;
        this.prevRenderArmYaw = 0;

        // For first person bobbing
        this.cameraYaw = 0;
        this.cameraPitch = 0;
        this.prevCameraYaw = 0;
        this.prevCameraPitch = 0;

        // Custom jump timer (in ticks). When >0 we reduce gravity so the jump lasts ~5 seconds.
        this.jumpFallTimer = 0;
        this.JUMP_FALL_DURATION_TICKS = 0; // 0.5 seconds at 60 TPS
        // Reduced gravity to apply during jump timer (small per-tick gravity)
        this.REDUCED_GRAVITY = 0.08;

        // Speed multiplier for /set @p speed command
        this.speedMultiplier = 1.0;
        
        // Portal state
        this.timeInPortal = 0;
        this.inPortal = false;
        this.prevTimeInPortal = 0;

        this.airTicks = 300;

        this.attributeScale = 0; // 0 = base, 1 = +0.5 blocks total, 2 = +1.0 blocks total

        this.jumpWasDown = false;
        
        // Loopable ambience trackers
        this.ambientWaterSound = null;
        this.ambientLavaSound = null;

        this.isCameraman = false;
        this.cameraMode = "operator";
        this.cameraRoll = 0;
        this.cameraFov = minecraft.settings.fov;
        this.broadcasting = false;
    }

    respawn() {
        let spawn = this.world.getSpawn();
        this.setPosition(spawn.x, spawn.y, spawn.z);
        this.foodLevel = 20;
        this.foodSaturationLevel = 2.5;
        this.foodExhaustionLevel = 0;
        // Clear chunk queue on respawn/teleport to avoid loading outdated regions
        if (this.world) this.world.chunkLoadQueue = [];
        if (this.world && this.world.chunkLoadSet) this.world.chunkLoadSet.clear();
    }

    turn(motionX, motionY) {
        let sensitivity = this.minecraft.settings.sensitivity / 500;
        this.rotationYaw = this.rotationYaw + motionX * sensitivity;
        this.rotationPitch = this.rotationPitch - motionY * sensitivity;

        if (this.rotationPitch < -90.0) {
            this.rotationPitch = -90.0;
        }

        if (this.rotationPitch > 90.0) {
            this.rotationPitch = 90.0;
        }
    }

    onUpdate() {
        super.onUpdate();
    }

    onLivingUpdate() {
        if (this.isCameraman && this.cameraMode === "freecam" && this.minecraft.cameraManager?.controller.update(this)) {
            this.prevCameraYaw = this.cameraYaw; this.prevCameraPitch = this.cameraPitch;
            this.cameraYaw *= 0.9; this.cameraPitch *= 0.9;
            return;
        }
        if (this.health <= 0) {
            this.moveForward = 0;
            this.moveStrafing = 0;
            this.jumping = false;
            this.sprinting = false;
            super.onLivingUpdate();
            return;
        }

        // Void Damage
        if (this.y < -32) {
            this.takeHit(null, 1000, "void");
        }

        if (this.gameMode === 3) {
            this.flying = true;
        }

        // Environmental Damage: Magma, Lava, Fire and Custom Modded Blocks
        if (this.gameMode === 0 && !this.activeEffects.has("fire_resistance")) {
            let bx = Math.floor(this.x);
            let by = Math.floor(this.y);
            let bz = Math.floor(this.z);

            // Floor checks (Standing on)
            if (this.onGround) {
                let idBelow = this.world.getBlockAt(bx, Math.floor(this.y - 0.1), bz);
                
                // 1. Magma Block (ID 236)
                if (idBelow === 236 && this.ticksExisted % 20 === 0) {
                    this.takeHit(null, 1, "magma");
                }

                // 2. Custom Modded Damage On Stand
                let blockBelow = Block.getById(idBelow);
                if (blockBelow && blockBelow.damageOnStand > 0 && this.ticksExisted % 20 === 0) {
                    this.takeHit(null, blockBelow.damageOnStand, "block");
                }
            }

            // 2. Lava (ID 10) - Overlapping feet or head
            let idFeet = this.world.getBlockAt(bx, by, bz);
            let idHead = this.world.getBlockAt(bx, by + 1, bz);
            if (idFeet === 10 || idHead === 10) {
                if (this.ticksExisted % 10 === 0) {
                    this.takeHit(null, 4, "lava"); // 2 hearts per 0.5s
                }
            }

            // 3. Fire (ID 51) - Overlapping feet or head
            if (idFeet === 51 || idHead === 51) {
                if (this.ticksExisted % 20 === 0) {
                    this.takeHit(null, 1, "fire"); // 0.5 hearts per 1s
                }
            }

            // 4. Berry Bush (ID 574)
            if ((idFeet === 574 || idHead === 574) && !this.sneaking) {
                let isMoving = Math.abs(this.motionX) > 0.003 || Math.abs(this.motionZ) > 0.003 || Math.abs(this.motionY) > 0.003;
                if (isMoving && this.ticksExisted % 20 === 0) {
                    this.takeHit(null, 1, "block");
                }
            }
        }

        this.prevCameraYaw = this.cameraYaw;
        this.prevCameraPitch = this.cameraPitch;

        // Drowning Logic
        if (this.isHeadInWater()) {
            if (this.activeEffects.has("water_breathing")) {
                this.airTicks = 300;
            } else {
                this.airTicks--;
                if (this.airTicks <= 0) {
                    this.airTicks = 0;
                    if (this.ticksExisted % 20 === 0) {
                        this.takeHit(null, 2, "drown");
                    }
                }
            }
        } else {
            this.airTicks = 300;
        }

        // Regeneration effect
        if (this.activeEffects.has("regeneration")) {
            let amp = this.activeEffects.get("regeneration").amplifier;
            let rate = 50 >> amp;
            if (rate < 1) rate = 1;
            if (this.ticksExisted % rate === 0 && this.health < 20) {
                this.health++;
            }
        }
        
        // Check for portal block (ID 90)
        this.prevTimeInPortal = this.timeInPortal;
        
        let blockX = Math.floor(this.x);
        let blockY = Math.floor(this.y);
        let blockZ = Math.floor(this.z);
        
        let blockId = this.world.getBlockAt(blockX, blockY, blockZ);
        // Check feet and head
        let blockIdHead = this.world.getBlockAt(blockX, blockY + 1, blockZ);
        
        if (blockId === 90 || blockIdHead === 90 || blockId === 123 || blockIdHead === 123) { 
            this.inPortal = true;
        } else {
            this.inPortal = false;
        }
        
        if (this.inPortal) {
            this.timeInPortal++;
            // 6 seconds = 120 ticks (at 20tps)
            if (this.timeInPortal >= 120) {
                let targetDim = (blockId === 123 || blockIdHead === 123) ? 1 : null;
                // If in End, returning always goes to Overworld (0)
                if (this.world.dimension === 1) targetDim = 0;

                this.minecraft.switchDimension(targetDim);
                this.timeInPortal = 0; // Reset after switch
            }
        } else {
            if (this.timeInPortal > 0) {
                this.timeInPortal -= 4; // Decay faster
                if (this.timeInPortal < 0) this.timeInPortal = 0;
            }
        }

        // If riding, sync position with vehicle and skip movement logic
        if (this.isRiding()) {
            this.updateKeyboardInput(); // Still update inputs for vehicle control
            
            // Snap to vehicle
            let v = this.ridingEntity;
            if (v.isDead) {
                this.mountEntity(null);
            } else {
                this.setPosition(v.x, v.y + v.getMountedYOffset() + this.getYOffset(), v.z);
                this.motionX = 0;
                this.motionY = 0;
                this.motionZ = 0;

                // Sync body rotation with vehicle to face forward
                this.renderYawOffset = v.rotationYaw;
                
                // Allow looking around
                if (!this.isPaused()) {
                    this.turn(this.minecraft.window.mouseMotionX, this.minecraft.window.mouseMotionY);
                    this.minecraft.window.mouseMotionX = 0;
                    this.minecraft.window.mouseMotionY = 0;
                }
                
                // Clamp head rotation visual only (so player can look around freely with camera, but head model has limits)
                let yawDiff = this.rotationYaw - this.renderYawOffset;
                while (yawDiff < -180) yawDiff += 360;
                while (yawDiff >= 180) yawDiff -= 360;
                
                // Yaw Diff limit should be small relative to actual entity (90 degrees, fixed in renderer)
                // For riding, fix head rotation relative to the body (which matches vehicle rotation)
                this.rotationYawHead = this.renderYawOffset;
            }
            
            // Handle dismount (Shift/Sneak)
            if (this.sneaking) {
                this.mountEntity(null);
                // Add cooldown to prevent immediate remount?
            }
            
            // Ensure inputs are reset even when riding to prevent indefinite actions
            this.jumping = false;
            
            return;
        }

        if (this.isOnLadder()) {
            this.fallDistance = 0;
            if (this.motionY < -0.15) {
                this.motionY = -0.15;
            }
            
            if (this.sneaking) {
                this.motionY = -0.15;
            } else if (this.isCollidedHorizontally || this.moveForward !== 0 || this.moveStrafing !== 0 || this.jumping) {
                this.motionY = 0.2;
            } else {
                this.motionY = 0;
            }
        }

        if (this.sprintToggleTimer > 0) {
            --this.sprintToggleTimer;
        }
        if (this.flyToggleTimer > 0) {
            --this.flyToggleTimer;
        }

        let prevMoveForward = this.moveForward;

        this.updateKeyboardInput();

        // Toggle jumping (Edge detection for fly toggle)
        if (!this.jumpWasDown && this.jumping) {
            if (this.flyToggleTimer === 0) {
                this.flyToggleTimer = 7;
            } else {
                if (this.capabilities.allowFlying) {
                    this.flying = !this.flying;
                    this.flyToggleTimer = 0;
                    this.updateFOVModifier();
                }
            }
        }

        // Toggle sprint
        if (prevMoveForward === 0 && this.moveForward > 0 && this.foodLevel > 6) {
            if (this.sprintToggleTimer === 0) {
                this.sprintToggleTimer = 7;
            } else {
                this.sprinting = true;
                this.sprintToggleTimer = 0;

                this.updateFOVModifier();
            }
        }

        if (this.sprinting && (this.moveForward <= 0 || this.collision || this.sneaking || this.foodLevel <= 6)) {
            this.sprinting = false;

            this.updateFOVModifier();
        }

        // Snapshot jump state for next tick edge detection
        this.jumpWasDown = this.jumping;

        this.updateAmbience();
        this.collideWithItems();

        super.onLivingUpdate();

        // Hunger Logic
        const diff = this.minecraft.settings.difficulty;
        // Hunger is a Survival mechanic. Use the actual game mode here rather
        // than allowFlying, since that capability can remain enabled for
        // Creative/Spectator transitions.
        if (this.gameMode === 0 && diff > 0) {
            const distanceMoved = Math.sqrt((this.x - this.prevX) ** 2 + (this.z - this.prevZ) ** 2);
            if (this.sprinting) {
                this.addExhaustion(distanceMoved * 0.1);
            } else if (this.isInWater()) {
                this.addExhaustion(distanceMoved * 0.015);
            } else if (this.onGround) {
                this.addExhaustion(distanceMoved * 0.01);
            }

            // Exhaustion drains saturation first. Every 4 exhaustion removes
            // exactly one saturation point, then one hunger point after the
            // saturation reservoir is empty.
            const exhaustionThreshold = this.hungerEffectTimer > 0 ? 2.0 : 4.0;
            if (this.hungerEffectTimer > 0) this.hungerEffectTimer--;

            while (this.foodExhaustionLevel >= exhaustionThreshold) {
                this.foodExhaustionLevel -= exhaustionThreshold;
                if (this.foodSaturationLevel > 0) {
                    this.foodSaturationLevel = Math.max(0, this.foodSaturationLevel - 1);
                } else if (this.foodLevel > 0) {
                    this.foodLevel = Math.max(0, this.foodLevel - 1);
                }
            }

            // Starvation
            if (this.foodLevel <= 0) {
                this.foodTimer++;
                if (this.foodTimer >= 80) { // Damage every 4 seconds
                    if (this.health > 10) { // Don't kill, just reduce to 5 hearts
                        this.takeHit(null, 1, "starve");
                    }
                    this.foodTimer = 0;
                }
            } else {
                this.foodTimer = 0;
            }

            // Health Regeneration
            // Golden Apple boost
            let regenRate = 80; // Default 4 seconds
            if (this.regenBoostTimer > 0) {
                this.regenBoostTimer--;
                regenRate = 40; // 2 seconds (Twice as fast)
            }

            if (this.foodLevel >= 18 && this.health < 20 && this.health > 0) {
                this.healthRegenTimer++;
                if (this.healthRegenTimer >= regenRate) {
                    this.health = Math.min(20, this.health + 1);
                    this.healthRegenTimer = 0;
                    // Regen costs a tiny bit of food in vanilla, ignoring for simplicity based on prompt
                }
            }
        }

        this.jumpMovementFactor = this.speedInAir;

        if (this.sprinting) {
            this.jumpMovementFactor = this.jumpMovementFactor + this.speedInAir * 0.3;
        }

        let speedXZ = Math.sqrt(this.motionX * this.motionX + this.motionZ * this.motionZ);
        let speedY = (Math.atan(-this.motionY * 0.2) * 15.0);

        if (speedXZ > 0.1) {
            speedXZ = 0.1;
        }
        if (!this.onGround || this.health <= 0.0) {
            speedXZ = 0.0;
        }
        if (this.onGround || this.health <= 0.0) {
            speedY = 0.0;
        }

        if (this.onGround && (Math.abs(this.motionX) > 0.003 || Math.abs(this.motionZ) > 0.003)) {
            this.cameraYaw += (speedXZ - this.cameraYaw) * 0.4;
            this.cameraPitch += (speedY - this.cameraPitch) * 0.8;
        } else {
            this.cameraYaw *= 0.9;
            this.cameraPitch *= 0.9;
        }

        // Prevent tiny vertical movement while walking: if player is on ground and not jumping, ensure no vertical motion
        // Added !this.flying check to prevent flight upward acceleration from being nuked every tick while touching ground
        if (this.onGround && !this.jumping && this.jumpFallTimer === 0 && !this.flying) {
            this.motionY = 0.0;
        }

        // Frost Walker Logic
        if (this.onGround && !this.isRemote && this.ticksExisted % 2 === 0) {
            const boots = this.inventory.getArmor(3);
            if (boots && boots.tag && boots.tag.enchantments && boots.tag.enchantments.frost_walker) {
                const radius = 1 + boots.tag.enchantments.frost_walker;
                const wx_base = Math.floor(this.x);
                const wz_base = Math.floor(this.z);
                const wy = Math.floor(this.y - 1);
                
                for (let dx = -radius; dx <= radius; dx++) {
                    for (let dz = -radius; dz <= radius; dz++) {
                        if (dx * dx + dz * dz > radius * radius) continue;
                        const targetX = wx_base + dx;
                        const targetZ = wz_base + dz;
                        
                        // Only freeze if block is water source and has air above
                        if (this.world.getBlockAt(targetX, wy, targetZ) === 9 && this.world.getBlockAt(targetX, wy + 1, targetZ) === 0) {
                            this.world.setBlockAt(targetX, wy, targetZ, 79); // Frozen Ice
                        }
                    }
                }
            }
        }
    }

    updateAmbience() {
        if (this.ticksExisted % 20 !== 0) return;

        const range = 8;
        let foundWater = false;
        let foundLava = false;
        let foundFire = false;

        const px = Math.floor(this.x);
        const py = Math.floor(this.y);
        const pz = Math.floor(this.z);

        // Search small radius for liquid/fire blocks
        for (let x = px - 4; x <= px + 4; x++) {
            for (let y = py - 2; y <= py + 3; y++) {
                for (let z = pz - 4; z <= pz + 4; z++) {
                    const id = this.world.getBlockAt(x, y, z);
                    if (id === 9 || id === 8) foundWater = true;
                    if (id === 10 || id === 11) foundLava = true;
                    if (id === 51) foundFire = true;
                    if (foundWater && foundLava && foundFire) break;
                }
                if (foundWater && foundLava && foundFire) break;
            }
            if (foundWater && foundLava && foundFire) break;
        }

        const sm = this.minecraft.soundManager;
        
        // Manage Water Ambience
        if (foundWater && (!this.ambientWaterSound || !this.ambientWaterSound.isPlaying)) {
            this.ambientWaterSound = sm.playSound("liquid.water", this.x, this.y, this.z, 0.15, 1.0);
            if (this.ambientWaterSound) this.ambientWaterSound.onEnded = () => { this.ambientWaterSound = null; };
        }

        // Manage Lava Ambience
        if (foundLava && (!this.ambientLavaSound || !this.ambientLavaSound.isPlaying)) {
            this.ambientLavaSound = sm.playSound("liquid.lava", this.x, this.y, this.z, 0.2, 1.0);
            if (this.ambientLavaSound) this.ambientLavaSound.onEnded = () => { this.ambientLavaSound = null;

        this.isCameraman = false;
        this.cameraMode = "operator";
        this.cameraRoll = 0;
        this.cameraFov = minecraft.settings.fov;
        this.broadcasting = false; };
        }

        // Manage Fire Ambience
        if (foundFire && (!this.ambientFireSound || !this.ambientFireSound.isPlaying)) {
            this.ambientFireSound = sm.playSound("fire.idle", this.x, this.y, this.z, 0.25, 1.0);
            if (this.ambientFireSound) this.ambientFireSound.onEnded = () => { this.ambientFireSound = null; };
        }
    }

    addExhaustion(amount) {
        this.foodExhaustionLevel += amount;
    }

    eat(itemId) {
        const block = Block.getById(itemId);
        const food = getFoodStats(itemId) || (block && block.isFood ? {
            hunger: block.hungerValue || 0,
            saturation: block.saturation || 0
        } : null);
        
        // Handle Potion Drinking
        if (block && block.isPotion && !block.isSplash) {
            this.minecraft.soundManager.playSound("random.eat", this.x, this.y, this.z, 0.5, 1.1); // Use higher pitch for drink
            if (block.potionEffect) {
                this.addEffect(block.potionEffect.name, block.potionEffect.duration, block.potionEffect.amplifier);
            }
            // Return glass bottle
            if (this.gameMode !== 1) {
                this.inventory.addItem(550, 1);
            }
            this.updateFOVModifier();
            return;
        }

        if (!food) return;

        // Play eating sound (randomized)
        this.minecraft.soundManager.playSound("random.eat", this.x, this.y, this.z, 0.5, 1.0);

        // Check for A Delicious Fish achievement
        if (itemId === 350 || itemId === 355) { // Cooked Cod or Salmon
            this.minecraft.achievementManager.grant('yummyfish');
        }

        // Golden Apple
        if (itemId === 322) {
            this.regenBoostTimer = 400; // 20 seconds * 20 ticks
            this.health = Math.min(20, this.health + 4); // Instant heal small amount too? Prompt says heal regen twice as fast.
            // Vanilla golden apple also gives Absorption and Regeneration effect.
            // Prompt says "regenerate twice as fast for the next 20 seconds".
        }
        // Rotten Flesh
        else if (itemId === 367) {
            if (Math.random() < 0.80) {
                this.hungerEffectTimer = 600; // 30 seconds * 20 ticks
            }
        }
        // Raw Chicken
        if (itemId === 365) {
            if (Math.random() < 0.40) {
                this.hungerEffectTimer = 600; // 30 seconds
            }
        }

        const isGoldenApple = itemId === 322 || (block && block.enchantedGoldenApple);
        this.healHunger(food.hunger, food.saturation, isGoldenApple);
    }

    healHunger(amount, saturationAmount = 0, allowSaturationOverHunger = false) {
        this.foodLevel = Math.min(20, this.foodLevel + amount);
        const saturationCap = allowSaturationOverHunger ? 20 : this.foodLevel;
        this.foodSaturationLevel = Math.min(20, saturationCap, this.foodSaturationLevel + saturationAmount);
        this.foodExhaustionLevel = 0; // Reset exhaustion on eat
    }

    collideWithItems() {
        for (let i = this.world.droppedItems.length - 1; i >= 0; i--) {
            const item = this.world.droppedItems[i];
            // Reliable pickup: accept either bounding-box intersection OR close-distance pickup.
            const playerCenterX = (this.boundingBox.minX + this.boundingBox.maxX) / 2.0;
            const playerCenterY = (this.boundingBox.minY + this.boundingBox.maxY) / 2.0;
            const playerCenterZ = (this.boundingBox.minZ + this.boundingBox.maxZ) / 2.0;
            const dx = playerCenterX - item.x;
            const dy = playerCenterY - item.y;
            const dz = playerCenterZ - item.z;
            const sqDist = dx * dx + dy * dy + dz * dz;
            const PICKUP_RADIUS = 1.4;

            if (this.boundingBox.intersects(item.boundingBox) || sqDist <= PICKUP_RADIUS * PICKUP_RADIUS) {
                // Play pickup sound
                if (item.pickupDelay === 0) {
                    this.minecraft.soundManager.playSound("random.pop", this.x, this.y, this.z, 0.4, 1.0);
                }

                // Special check for dispensed armor auto-equip
                if (item.tag && item.tag.dispensedArmor && item.age < 10) {
                    let block = Block.getById(item.blockId);
                    if (block && block.armorType !== undefined) {
                        let current = this.inventory.getArmor(block.armorType);
                        if (current.id === 0) {
                            this.inventory.setArmor(block.armorType, {id: item.blockId, count: 1});
                            item.kill();
                            this.minecraft.soundManager.playSound("random.click", this.x, this.y, this.z, 1.0, 1.0);
                            continue;
                        }
                    }
                }

                if (item.pickupDelay === 0) {
                    if (this.inventory.addItem(item.blockId, item.count, item.tag || {}, item.damage || 0)) {
                        item.kill();
                    }
                }
            }
        }
    }

    isInWater() {
        let id = this.world.getBlockAt(this.getBlockPosX(), this.getBlockPosY(), this.getBlockPosZ());
        return id === BlockRegistry.WATER.getId() || id === BlockRegistry.LAVA.getId();
    }

    isOnLadder() {
        let x = MathHelper.floor(this.x);
        let y = MathHelper.floor(this.y);
        let z = MathHelper.floor(this.z);
        let id = this.world.getBlockAt(x, y, z);
        return id === BlockRegistry.LADDER.getId() || id === 106; // Ladder or Vines
    }

    isHeadInWater() {
        let cameraPosition = this.world.minecraft.worldRenderer.camera.position;
        let id = this.world.getBlockAt(
            Math.floor(cameraPosition.x),
            Math.floor(cameraPosition.y + 0.12),
            Math.floor(cameraPosition.z)
        );
        return id === BlockRegistry.WATER.getId() || id === BlockRegistry.LAVA.getId();
    }

    jump() {
        // Jump to approximately one block height
        this.motionY = 0.41;
        this.minecraft.stats.jumps++;
        if (this.activeEffects.has("jump_boost")) {
            this.motionY += 0.1 * (this.activeEffects.get("jump_boost").amplifier + 1);
        }
        this.jumpFallTimer = 0;

        if (this.gameMode === 0) {
            this.addExhaustion(this.sprinting ? 0.2 : 0.05);
        }
    }

    travelFlying(forward, vertical, strafe) {
        // Fly move up and down
        if (this.sneaking) {
            this.motionY -= this.flySpeed * 3.0;
        }

        if (this.jumping) {
            this.motionY += this.flySpeed * 3.0;
        }

        let prevJumpMovementFactor = this.jumpMovementFactor;
        this.jumpMovementFactor = this.flySpeed * (this.sprinting ? 2 : 1);

        this.travel(forward, vertical, strafe);

        this.motionY *= 0.6; // Consistent damping for flight
        this.jumpMovementFactor = prevJumpMovementFactor;

        // Only land if moving downwards or stationary to prevent flight being canceled while ascending
        if (this.onGround && this.motionY <= 0) {
            this.flying = false;
        }
    }

    travelInWater(forward, vertical, strafe) {
        let slipperiness = 0.8;
        let friction = 0.02;

        this.moveRelative(forward, vertical, strafe, friction);
        this.collision = this.moveCollide(-this.motionX, this.motionY, -this.motionZ);

        this.motionX *= slipperiness;
        this.motionY *= 0.8;
        this.motionZ *= slipperiness;
        this.motionY -= 0.02;

        // Swimming sounds
        if ((forward !== 0 || strafe !== 0) && this.ticksExisted % 30 === 0) {
            this.minecraft.soundManager.playSound("random.swim", this.x, this.y, this.z, 0.4, 1.0);
        }
    }

    travel(forward, vertical, strafe) {
        let prevSlipperiness = this.getBlockSlipperiness() * 0.91;

        let prevX = this.x;
        let prevZ = this.z;

        let isSlow = this.onGround && this.sneaking;

        let value = 0.16277136 / (prevSlipperiness * prevSlipperiness * prevSlipperiness);
        let friction;

        if (this.onGround) {
            friction = this.getAIMoveSpeed() * value;
        } else {
            friction = this.jumpMovementFactor;
        }

        this.moveRelative(forward, vertical, strafe, friction);

        // --- Cobweb & Berry Bush dragging effect ---
        // Sample feet and torso for slow-blocks (Cobweb=571, Bush=574)
        const idFeet = this.world.getBlockAt(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
        const idTorso = this.world.getBlockAt(Math.floor(this.x), Math.floor(this.y + 1), Math.floor(this.z));
        
        if (idFeet === 571 || idFeet === 574 || idTorso === 571 || idTorso === 574) {
            // Apply 75% speed reduction as requested (0.25 multiplier)
            this.motionX *= 0.25;
            this.motionZ *= 0.25;
            // Reduce vertical fall speed too
            if (!this.flying && this.motionY < 0) this.motionY *= 0.5;
        }

        // Get new speed
        let slipperiness = this.getBlockSlipperiness() * 0.91;

        // Move
        this.collision = this.moveCollide(-this.motionX, this.motionY, -this.motionZ);

        // Gravity
        if (!this.flying) {
            let gravity = 0.08;
            if (this.activeEffects.has("slow_falling")) {
                let effect = this.activeEffects.get("slow_falling");
                // Base slow falling is 0.01, each level further reduces it
                gravity = 0.01 / (effect.amplifier + 1);
            }
            this.motionY -= gravity;
            
            if (this.activeEffects.has("slow_falling")) {
                let effect = this.activeEffects.get("slow_falling");
                let maxFallSpeed = -0.1 / (effect.amplifier + 1);
                if (this.motionY < maxFallSpeed) {
                    this.motionY = maxFallSpeed;
                }
            }
        }

        // Decrease motion
        this.motionX *= slipperiness;
        this.motionY *= 0.98;
        this.motionZ *= slipperiness;

        // Fall damage & Bouncing
        if (this.onGround) {
            if (this.fallDistance > 0.0) {
                let bx = MathHelper.floor(this.x), by = MathHelper.floor(this.y - 0.1), bz = MathHelper.floor(this.z);
                let bId = this.world.getBlockAt(bx, by, bz);

                // Slime block bounce and damage negation
                if (bId === 165 && !this.sneaking) {
                    // Negate fall damage and bounce
                    if (this.fallDistance > 0.5) {
                        // Calculate target bounce height based on fall distance
                        // fall 5 -> 3.1, fall 10 -> 8, fall 15 -> 12, fall 20 -> 16
                        let targetBounceHeight = 0;
                        if (this.fallDistance <= 5) {
                            targetBounceHeight = this.fallDistance * 0.62;
                        } else if (this.fallDistance <= 10) {
                            let t = (this.fallDistance - 5) / 5;
                            targetBounceHeight = 3.1 + t * (8 - 3.1);
                        } else {
                            targetBounceHeight = Math.min(16, 8 + (this.fallDistance - 10) * 0.8);
                        }

                        // Convert height to initial velocity: v = sqrt(2 * g * h)
                        // Note: moveCollide already zeroed out motionY, so we set a new upward impulse.
                        this.motionY = Math.sqrt(2 * 0.08 * targetBounceHeight);
                        this.onGround = false;
                        this.minecraft.soundManager.playSound("step.cloth", this.x, this.y, this.z, 1.0, 0.5);
                    }
                    this.fallDistance = 0.0;
                } else {
                    // Normal fall damage logic
                    if (this.fallDistance >= 4.0) {
                        if (bId !== 0) {
                            this.minecraft.particleManager.spawnBlockBreakParticles(this.world, bx, this.y, bz, Block.getById(bId));
                            this.minecraft.particleManager.spawnBlockBreakParticles(this.world, bx, this.y, bz, Block.getById(bId));
                        }
                    }

                    let damage = Math.ceil((this.fallDistance - 3.0) * 1.25);
                    if (this.activeEffects.has("jump_boost")) {
                        damage -= (this.activeEffects.get("jump_boost").amplifier + 1);
                    }
                    if (this.activeEffects.has("slow_falling")) {
                        damage = 0;
                    }
                    if (damage > 0 && !this.capabilities.allowFlying) {
                        this.takeHit(null, damage, "fall");
                    }

                    if (this.fallDistance > 3.0) {
                        const soundKey = this.fallDistance > 8.0 ? "random.fall.big" : "random.fall.small";
                        this.minecraft.soundManager.playSound(soundKey, this.x, this.y, this.z, 1.0, 1.0);
                    }

                    this.fallDistance = 0.0;
                }
            }
        } else if (this.motionY < 0.0) {
            this.fallDistance -= this.motionY;
        }

        // --- Extra damping when player stops on ground: reduce residual horizontal momentum by ~80% ---
        // If player is on the ground and there is no input, apply stronger damping to reduce slide.
        // Skip this if we are on ice to allow sliding.
        let onIce = false;
        let idBelow = this.world.getBlockAt(MathHelper.floor(this.x), MathHelper.floor(this.y - 0.1), MathHelper.floor(this.z));
        if (idBelow === 79 || idBelow === 174) onIce = true;

        if (!onIce && this.onGround && Math.abs(this.moveForward) < 0.001 && Math.abs(this.moveStrafing) < 0.001) {
            const STOP_DAMPING = 0.2; // keep 20% of speed -> reduce ~80%
            this.motionX *= STOP_DAMPING;
            this.motionZ *= STOP_DAMPING;
        }
        // -------------------------------------------------------------------------------

        // Step sound
        if (!isSlow) {
            let blockX = MathHelper.floor(this.x);
            let blockY = MathHelper.floor(this.y - 0.2);
            let blockZ = MathHelper.floor(this.z);
            let typeId = this.world.getBlockAt(blockX, blockY, blockZ);

            let distanceX = this.x - prevX;
            let distanceZ = this.z - prevZ;

            let moved = Math.sqrt(distanceX * distanceX + distanceZ * distanceZ);
            this.minecraft.stats.distanceWalked += moved;

            this.distanceWalked += moved * 0.6;
            if (this.distanceWalked > this.nextStepDistance && typeId !== 0) {
                this.nextStepDistance = this.distanceWalked + 1;

                let block = Block.getById(typeId);
                let sound = block.getSound();

                // Play sound
                if (!block.isLiquid()) {
                    this.minecraft.soundManager.playSound(sound.getStepSound(), this.x, this.y, this.z, 0.10, sound.getPitch());
                }
            }
        }
    }

    getBlockSlipperiness() {
        if (this.onGround) {
            let id = this.world.getBlockAt(MathHelper.floor(this.x), MathHelper.floor(this.y - 0.1), MathHelper.floor(this.z));
            if (id === 79 || id === 174) return 0.98; // Ice and Packed Ice
            return 0.6;
        }
        return 1.0;
    }

    getAIMoveSpeed() {
        // Lower walk speed by another 5% (0.152 -> 0.1444)
        // Run speed remains at 0.2024
        let baseSpeed = this.sprinting ? 0.2024 : 0.1444;
        
        // Depth Strider (Boots Slot 3)
        if (this.isInWater()) {
            const boots = this.inventory.getArmor(3);
            if (boots.tag && boots.tag.enchantments && boots.tag.enchantments.depth_strider) {
                baseSpeed *= (1.0 + boots.tag.enchantments.depth_strider * 0.3);
            }
        }

        let speed = baseSpeed * this.speedMultiplier;

        // Crouching penalty (approx 66% slower -> 33.75% remaining speed)
        // Reduced from 0.45 by another 25% (0.45 * 0.75 = 0.3375)
        if (this.sneaking) {
            speed *= 0.3375;
        }
        
        // Speed bonus on ice (+10%)
        let idBelow = this.world.getBlockAt(MathHelper.floor(this.x), MathHelper.floor(this.y - 0.1), MathHelper.floor(this.z));
        if (idBelow === 79 || idBelow === 174) {
            speed *= 1.1;
        }

        // Slime block slowing effect (60% slow)
        if (idBelow === 165) {
            speed *= 0.4;
        }

        // Speed penalty while eating (-20%)
        if (this.itemInUse !== null) {
            speed *= 0.8;
        }

        if (this.activeEffects.has("speed")) {
            speed *= (1.0 + 0.2 * (this.activeEffects.get("speed").amplifier + 1));
        }
        if (this.activeEffects.has("slowness")) {
            speed *= Math.max(0, 1.0 - 0.15 * (this.activeEffects.get("slowness").amplifier + 1));
        }

        return speed;
    }

    moveRelative(forward, up, strafe, friction) {
        let distance = strafe * strafe + up * up + forward * forward;

        if (distance >= 0.0001) {
            distance = Math.sqrt(distance);

            if (distance < 1.0) {
                distance = 1.0;
            }

            distance = friction / distance;
            strafe = strafe * distance;
            up = up * distance;
            forward = forward * distance;

            let yawRadians = MathHelper.toRadians(this.rotationYaw + 180);
            let sin = Math.sin(yawRadians);
            let cos = Math.cos(yawRadians);

            this.motionX += strafe * cos - forward * sin;
            this.motionY += up;
            this.motionZ += forward * cos + strafe * sin;
        }
    }

    updateKeyboardInput() {
        if (this.health <= 0) return;

        // Keyboard inputs (Only additive to controller if needed, but usually exclusive)
        let moveForward = 0.0;
        let moveStrafe = 0.0;

        let jumping = false;
        let sneaking = false;
        
        const settings = this.minecraft.settings;

        if (this.minecraft.hasInGameFocus()) {
            if (Keyboard.isKeyDown("KeyR")) { // R - Debug Reload
                // this.respawn();
            }
            if (Keyboard.isKeyDown(settings.forward)) { // Forward
                moveForward++;
            }
            if (Keyboard.isKeyDown(settings.back)) { // Back
                moveForward--;
            }
            if (Keyboard.isKeyDown(settings.left)) { // Left
                moveStrafe++;
            }
            if (Keyboard.isKeyDown(settings.right)) { // Right
                moveStrafe--;
            }
            if (Keyboard.isKeyDown(settings.jump)) { // Jump
                jumping = true;
            }
            if (Keyboard.isKeyDown(settings.sprinting)) {
                if (this.moveForward > 0 && !this.sneaking && !this.sprinting && this.motionX !== 0 && this.motionZ !== 0) {
                    this.sprinting = true;

                    this.updateFOVModifier();
                }
            }
            if (Keyboard.isKeyDown(settings.crouching)) { // Sneak
                sneaking = true;
            }

            if (Keyboard.isKeyDown(settings.drop)) { // Drop
                // Prevent dropping while typing in chat
                if (!(this.minecraft.currentScreen instanceof GuiChat)) {
                    // Drop item logic is handled in Minecraft.js onKeyPressed to avoid rapid dropping
                }
            }
        }

        // Apply keyboard state. Keyboard only affects P1.
        const isP1 = (this === this.minecraft.player);
        const ctrlActive = isP1 ? this.minecraft.controllerActive1 : this.minecraft.controllerActive2;
        
        if (isP1) {
            if (moveForward !== 0 || !ctrlActive) {
                this.moveForward = moveForward;
            }
            if (moveStrafe !== 0 || !ctrlActive) {
                this.moveStrafing = moveStrafe;
            }
        }
        
        this.jumping = jumping;

        // Combine keyboard 'hold' sneaking with controller 'toggle' sneaking.
        // The !ctrlActive force-reset was causing flickers when standing still.
        this.sneaking = sneaking || this.isSneakingPersistent;

        // Update Bounding Box height for sneaking
        let targetHeight = this.sneaking ? 1.5 : 1.8;
        if (this.boundingBox.height() !== targetHeight) {
            this.boundingBox.maxY = this.boundingBox.minY + targetHeight;
        }
    }

    moveCollide(targetX, targetY, targetZ) {
        // Target position
        let originalTargetX = targetX;
        let originalTargetY = targetY;
        let originalTargetZ = targetZ;

        if (this.gameMode === 3) {
            this.x += targetX;
            this.y += targetY;
            this.z += targetZ;
            this.boundingBox.move(targetX, targetY, targetZ);
            return false;
        }

        // Sneaking movement must keep the inset footprint over the current
        // support surface.  Resolve each horizontal axis independently so a
        // blocked direction is stopped without turning tangent movement into
        // a tiny residual crawl along the edge.
        let crouchMovementClamped = false;
        let crouchBlockedX = false;
        let crouchBlockedZ = false;
        let crouchEdgeInset = null;
        let crouchFloorY = null;
        if (this.sneaking && !this.flying && (targetX !== 0 || targetZ !== 0)) {
            // Allow the player's default 0.4-block half-width to overhang
            // the edge while crouching.  Keep 0.1 blocks of that overhang
            // protected so the player stops about 0.3 blocks off the edge.
            const allowedOverhang = 0.3;
            const inset = Math.max(0, this.boundingBox.width() * 0.5 - allowedOverhang);
            const floorY = MathHelper.floor(this.y - 0.1);
            const supportedThisTick = !this.flying && targetY <= 0 &&
                this.isSupportedAt(this.boundingBox.grow(-0.001, 0, -0.001), floorY);
            const crouchGrounded = this.onGround || supportedThisTick;

            if (crouchGrounded) {
                crouchEdgeInset = inset;
                crouchFloorY = floorY;
                const isSupportedAfterMove = (moveX, moveZ) => {
                    const movedBox = this.boundingBox
                        .offset(moveX, 0, moveZ)
                        .grow(-inset, 0, -inset);
                    return this.isSupportedAt(movedBox, floorY);
                };

                if (!isSupportedAfterMove(targetX, targetZ)) {
                    crouchMovementClamped = true;

                    // Treat an unsafe axis as fully blocked.  Applying a
                    // fractional "last safe" movement every tick was the source
                    // of the slow fight between input velocity and edge stopping.
                    const canMoveX = targetX === 0 || isSupportedAfterMove(targetX, 0);
                    const canMoveZ = targetZ === 0 || isSupportedAfterMove(0, targetZ);
                    const safeX = canMoveX ? targetX : 0;
                    const safeZ = canMoveZ ? targetZ : 0;

                    // If the independent axes cut across a corner, choose the
                    // longest safe axis-aligned result instead of allowing a
                    // diagonal sliver to creep.
                    const candidates = [
                        [safeX, safeZ],
                        [safeX, 0],
                        [0, safeZ],
                        [0, 0]
                    ];
                    let bestX = 0;
                    let bestZ = 0;
                    let bestDistance = -1;

                    for (const [candidateX, candidateZ] of candidates) {
                        if (!isSupportedAfterMove(candidateX, candidateZ)) continue;
                        const distance = candidateX * candidateX + candidateZ * candidateZ;
                        if (distance > bestDistance) {
                            bestDistance = distance;
                            bestX = candidateX;
                            bestZ = candidateZ;
                        }
                    }

                    targetX = bestX;
                    targetZ = bestZ;
                    crouchBlockedX = originalTargetX !== targetX;
                    crouchBlockedZ = originalTargetZ !== targetZ;
                }
            }
        }

        // Get level tiles as bounding boxes
        let boundingBoxList = this.world.getCollisionBoxes(this.boundingBox.expand(targetX, targetY, targetZ));

        // Move bounding box
        for (let aABB of boundingBoxList) {
            targetY = aABB.clipYCollide(this.boundingBox, targetY);
        }
        this.boundingBox.move(0.0, targetY, 0.0);

        for (let aABB of boundingBoxList) {
            targetX = aABB.clipXCollide(this.boundingBox, targetX);
        }
        this.boundingBox.move(targetX, 0.0, 0.0);

        for (let aABB of boundingBoxList) {
            targetZ = aABB.clipZCollide(this.boundingBox, targetZ);
        }
        this.boundingBox.move(0.0, 0.0, targetZ);

        // A diagonal move can pass the independent edge checks while the
        // collision resolver processes X and Z separately.  Validate the
        // actual final footprint and roll back the horizontal move if it no
        // longer has support, preventing corner slips from becoming falls.
        if (crouchEdgeInset !== null &&
            !this.isSupportedAt(this.boundingBox.grow(-crouchEdgeInset, 0, -crouchEdgeInset), crouchFloorY)) {
            crouchMovementClamped = true;
            if (targetX !== 0 && originalTargetX !== 0) crouchBlockedX = true;
            if (targetZ !== 0 && originalTargetZ !== 0) crouchBlockedZ = true;
            this.boundingBox.move(-targetX, 0, -targetZ);
            targetX = 0;
            targetZ = 0;
        }

        this.onGround = originalTargetY !== targetY && originalTargetY < 0.0;

        // --- Step Assist ---
        // A crouch edge clamp is intentional horizontal collision.  Do not
        // run step assist with the original vector or it can walk the player
        // back over the ledge that was just protected.
        if (!crouchMovementClamped && this.onGround && (originalTargetX !== targetX || originalTargetZ !== targetZ)) {
            let oldX = targetX;
            let oldY = targetY;
            let oldZ = targetZ;

            // Revert partial move
            this.boundingBox.move(-targetX, -targetY, -targetZ);

            // Try step move
            // 1. Move up stepHeight
            let stepY = this.stepHeight;
            // Clip stepY against ceiling
            let bbs = this.world.getCollisionBoxes(this.boundingBox.expand(0, stepY, 0));
            for (let bb of bbs) stepY = bb.clipYCollide(this.boundingBox, stepY);
            this.boundingBox.move(0, stepY, 0);

            // 2. Move horizontally with original full desired distance
            let stepX = originalTargetX;
            let stepZ = originalTargetZ;
            
            bbs = this.world.getCollisionBoxes(this.boundingBox.expand(stepX, 0, 0));
            for (let bb of bbs) stepX = bb.clipXCollide(this.boundingBox, stepX);
            this.boundingBox.move(stepX, 0, 0);

            bbs = this.world.getCollisionBoxes(this.boundingBox.expand(0, 0, stepZ));
            for (let bb of bbs) stepZ = bb.clipZCollide(this.boundingBox, stepZ);
            this.boundingBox.move(0, 0, stepZ);

            // 3. Move down
            let stepDownY = -stepY;
            bbs = this.world.getCollisionBoxes(this.boundingBox.expand(0, stepDownY, 0));
            for (let bb of bbs) stepDownY = bb.clipYCollide(this.boundingBox, stepDownY);
            this.boundingBox.move(0, stepDownY, 0);

            // Compare distance squared
            let distSqNormal = oldX*oldX + oldZ*oldZ;
            let distSqStep = stepX*stepX + stepZ*stepZ;

            if (distSqStep > distSqNormal) {
                // Use step result
                targetX = stepX;
                targetY = stepY + stepDownY; // Net vertical change
                targetZ = stepZ;
            } else {
                // Revert to normal result
                this.boundingBox.move(-stepX, -(stepY + stepDownY), -stepZ);
                this.boundingBox.move(oldX, oldY, oldZ);
            }
        }
        // -------------------

        // Stop motion on collision
        if (originalTargetX !== targetX) {
            if (crouchBlockedX) {
                // targetX is the negated horizontal velocity.  Adding it
                // back applies the exact opposite impulse to the attempted
                // movement, cancelling the edgeward speed instead of letting
                // input velocity fight the clamp on the next tick.
                this.motionX += originalTargetX;
            } else {
                this.motionX = 0.0;
            }
        }
        if (originalTargetY !== targetY) {
            this.motionY = 0.0;
        }
        if (originalTargetZ !== targetZ) {
            if (crouchBlockedZ) {
                this.motionZ += originalTargetZ;
            } else {
                this.motionZ = 0.0;
            }
        }

        if (crouchBlockedX && Math.abs(this.motionX) < 0.000001) this.motionX = 0.0;
        if (crouchBlockedZ && Math.abs(this.motionZ) < 0.000001) this.motionZ = 0.0;

        // Update position
        let nextX = (this.boundingBox.minX + this.boundingBox.maxX) / 2.0;
        let nextY = this.boundingBox.minY;
        let nextZ = (this.boundingBox.minZ + this.boundingBox.maxZ) / 2.0;

        if (isFinite(nextX) && isFinite(nextY) && isFinite(nextZ)) {
            this.x = nextX;
            this.y = nextY;
            this.z = nextZ;
        }

        // Prevent tiny vertical movement while walking
        if (this.onGround && targetY === originalTargetY) {
            this.motionY = 0.0;
        }

        // Horizontal collision?
        return originalTargetX !== targetX || originalTargetZ !== targetZ;
    }

    getEyeHeight() {
        return this.sneaking ? 1.54 : 1.62;
    }

    updateFOVModifier() {
        let value = 1.0;

        if (this.sprinting) {
            // Increase FOV by 10 (multiplier 0.2 * 50 = 10)
            value += 0.20;
        }

        if (this.flying) {
            value *= 1.1;
        }

        if (this.activeEffects.has("speed")) {
            value += 0.1 * (this.activeEffects.get("speed").amplifier + 1);
        }

        // Standard scaling for sprinting/effects
        let fov = (value - 1.0) * 50.0; 

        // Decrease FOV by 15 for aiming
        if (this.minecraft.bowPullDuration > 0 || this.minecraft.crossbowPullDuration > 0) {
            fov -= 15.0;
        }

        this.setFOVModifier(fov);
    }


    setFOVModifier(fov) {
        this.prevFovModifier = this.fovModifier;
        this.fovModifier = fov;
        this.timeFovChanged = Date.now();
    }

    getFOVModifier() {
        let timePassed = Date.now() - this.timeFovChanged;
        let distance = this.prevFovModifier - this.fovModifier;
        let duration = 100;
        let progress = distance / duration * timePassed;
        return timePassed > duration ? this.fovModifier : this.prevFovModifier - progress;
    }

    getPositionEyes(partialTicks) {
        if (partialTicks === 1.0) {
            return new Vector3(this.x, this.y + this.getEyeHeight(), this.z);
        } else {
            let x = this.prevX + (this.x - this.prevX) * partialTicks;
            let y = this.prevY + (this.y - this.prevY) * partialTicks + this.getEyeHeight();
            let z = this.prevZ + (this.z - this.prevZ) * partialTicks;
            return new Vector3(x, y, z);
        }
    }

    /**
     * interpolated look vector
     */
    getLook(partialTicks) {
        // TODO interpolation
        return this.getVectorForRotation(this.rotationPitch, this.rotationYaw);
    }

    /**
     * Creates a Vec3 using the pitch and yaw of the entities rotation.
     */
    getVectorForRotation(pitch, yaw) {
        let z = Math.cos(-yaw * 0.017453292 - Math.PI);
        let x = Math.sin(-yaw * 0.017453292 - Math.PI);
        let xz = -Math.cos(-pitch * 0.017453292);
        let y = Math.sin(-pitch * 0.017453292);
        return new Vector3(x * xz, y, z * xz);
    }

    isSupportedAt(bb, y) {
        const epsilon = 0.000001;

        // Use half-open ranges.  floor(maxX) includes the block on the far
        // side when maxX is exactly on a boundary, which made a box appear
        // supported after it had already crossed the ledge.
        const minX = Math.floor(bb.minX + epsilon);
        const maxX = Math.ceil(bb.maxX - epsilon) - 1;
        const minZ = Math.floor(bb.minZ + epsilon);
        const maxZ = Math.ceil(bb.maxZ - epsilon) - 1;

        // The support check is for the player's current feet height.  This
        // keeps decorative/non-solid blocks from counting while still
        // supporting slabs, stairs, and other multi-box blocks correctly.
        const feetY = this.y;
        const overlaps = (min, max, otherMin, otherMax) =>
            max > otherMin + epsilon && min < otherMax - epsilon;

        for (let x = minX; x <= maxX; x++) {
            for (let z = minZ; z <= maxZ; z++) {
                const id = this.world.getBlockAt(x, y, z);
                if (id === 0) continue;

                const block = Block.getById(id);
                if (!block) continue;

                const collision = block.getCollisionBoundingBox(this.world, x, y, z);
                if (collision === null) continue;

                const boxes = Array.isArray(collision) ? collision : [collision];
                for (const box of boxes) {
                    const topY = y + box.maxY;
                    if (topY < feetY - 0.05) continue;

                    if (
                        overlaps(bb.minX, bb.maxX, x + box.minX, x + box.maxX) &&
                        overlaps(bb.minZ, bb.maxZ, z + box.minZ, z + box.maxZ)
                    ) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    rayTrace(blockReachDistance, partialTicks, stopOnLiquid = false) {
        let from = this.getPositionEyes(partialTicks);
        let direction = this.getLook(partialTicks);
        let to = from.addVector(direction.x * blockReachDistance, direction.y * blockReachDistance, direction.z * blockReachDistance);
        return this.world.rayTraceBlocks(from, to, stopOnLiquid);
    }

    dropItem(itemStack) {
        if (!itemStack || itemStack.id === 0 || itemStack.count <= 0) return;

        let reach = 0.5;
        let lookVector = this.getLook(0);
        let x = this.x + lookVector.x * reach;
        let y = this.y + this.getEyeHeight() - 0.6;
        let z = this.z + lookVector.z * reach;

        // Pass manuallyDropped=true to trigger 2s glide delay
        const droppedItem = new DroppedItem(this.world, x, y, z, itemStack.id, itemStack.count, itemStack.tag, true);
        
        // Give it a little toss
        droppedItem.motionX = lookVector.x * 0.2;
        droppedItem.motionY = lookVector.y * 0.2 + 0.1;
        droppedItem.motionZ = lookVector.z * 0.2;
        
        this.world.droppedItems.push(droppedItem);
    }

    dropCurrentItem() {
        // Get actual stack object, not just the ID
        let itemStack = this.inventory.getStackInSlot(this.inventory.selectedSlotIndex);
        if (itemStack && itemStack.id !== 0 && itemStack.count > 0) {
            let blockId = itemStack.id;
            let tag = JSON.parse(JSON.stringify(itemStack.tag || {}));

            // Remove one item from the stack
            itemStack.count--;
            if (itemStack.count <= 0) {
                this.inventory.setItemInSelectedSlot(0);
            }
            
            // Spawn dropped item in front of the player
            let reach = 0.5;
            let lookVector = this.getLook(0);
            let x = this.x + lookVector.x * reach;
            let y = this.y + this.getEyeHeight() - 0.6;
            let z = this.z + lookVector.z * reach;

            // Pass manuallyDropped=true to trigger 2s glide delay
            const droppedItem = new DroppedItem(this.world, x, y, z, blockId, 1, tag, true);
            
            // Give it a little toss
            droppedItem.motionX = lookVector.x * 0.2;
            droppedItem.motionY = lookVector.y * 0.2 + 0.1;
            droppedItem.motionZ = lookVector.z * 0.2;
            
            this.world.droppedItems.push(droppedItem);
        }
    }

    takeHit(fromEntity, damage, cause = "generic") {
        if (this.hurtTime > 0 || this.health <= 0) return; // Respect damage immunity delay
        if (this.gameMode === 1 || this.gameMode === 3) return; // Invincible in Creative/Spectator

        // Armor Protection Enchantments
        let reduction = 0;
        for (let i = 0; i < 4; i++) {
            const stack = this.inventory.getArmor(i);
            if (stack.tag && stack.tag.enchantments) {
                const en = stack.tag.enchantments;
                if (en.protection) reduction += en.protection * 0.04;
                if (cause === "fire" && en.fire_protection) reduction += en.fire_protection * 0.08;
                if (cause === "fall" && en.feather_falling) reduction += en.feather_falling * 0.12;
                
                // Thorns logic
                if (fromEntity && en.thorns && Math.random() < (en.thorns * 0.15)) {
                    const thornsDamage = 1 + Math.floor(Math.random() * 4);
                    if (fromEntity.constructor.name === "RemotePlayerEntity") {
                        // Hitting the render proxy would do nothing; the real
                        // attacker has to be told.
                        this.minecraft.multiplayer?.sendPlayerDamage(fromEntity, thornsDamage, this);
                    } else if (fromEntity.takeHit) {
                        fromEntity.takeHit(this, thornsDamage);
                    }
                }
            }
        }
        damage *= (1.0 - Math.min(0.8, reduction));

        this.hurtTime = 13; // Increased delay by ~25% (from 10 to 13)

        // Play damage sound
        this.minecraft.soundManager.playSound("random.hurt", this.x, this.y, this.z, 1.0, 1.0);

        this.health -= damage;
        this.addExhaustion(0.1);
        
        // Knockback
        if (fromEntity) {
            let dx = this.x - fromEntity.x;
            let dz = this.z - fromEntity.z;
            let dist = Math.sqrt(dx*dx + dz*dz);
            if (dist > 0) {
                this.motionX -= (dx / dist) * 0.4;
                this.motionZ -= (dz / dist) * 0.4;
                this.motionY += 0.2;
            }
        }
        
        // Death
        if (this.health <= 0) {
            this.minecraft.stats.deaths++;
            // Determine death message
            let msg = "";
            let name = this.username || "Player";
            if (fromEntity) {
                let attackerName = fromEntity.constructor.name.replace("Entity", "").toLowerCase();
                // Another player is named, not called "remoteplayer".
                if (fromEntity.constructor.name === "RemotePlayerEntity") msg = `${name} was slain by ${fromEntity.username || "another player"}`;
                else if (attackerName === "creeper") msg = `${name} was blown up by a creeper`;
                else if (attackerName === "zombie") msg = `${name} was slain by a zombie`;
                else if (attackerName === "skeleton") msg = `${name} was shot by a skeleton`;
                else if (attackerName === "spider") msg = `${name} was bit by a spider`;
                else if (attackerName === "enderman") msg = `${name} was teleported out of existence by an enderman`;
                else if (attackerName === "husk") msg = `${name} was slain by a husk`;
                else if (attackerName === "drowned") msg = `${name} was slain by a drowned`;
                else if (attackerName === "snowzombie") msg = `${name} was slain by a snow zombie`;
                else if (attackerName === "slime") msg = `${name} was squashed by a slime`;
                else msg = `${name} was slain by ${attackerName}`;
            } else {
                if (cause === "fall") msg = `${name} fell from a high place`;
                else if (cause === "void") msg = `${name} fell out of the world`;
                else if (cause === "lava") msg = `${name} tried to swim in lava`;
                else if (cause === "fire") msg = `${name} went up in flames`;
                else if (cause === "drown") msg = `${name} drowned`;
                else if (cause === "starve") msg = `${name} starved to death`;
                else if (cause === "magma") msg = `${name} discovered floor was lava`;
                else if (cause === "ender_pearl") msg = `${name} was teleported by an ender pearl`;
                else msg = `${name} died`;
            }

            this.health = 0;
            if (!this.world.gameRules.keepInventory) {
                this.dropInventory();
            }
            
            // Open death screen
            import("../gui/screens/GuiDeath.js").then(module => {
                this.minecraft.displayScreen(new module.default(msg));
            });
            
            this.minecraft.addMessageToChat("§c" + msg);

            // Everyone sharing the world should see the death, not just the
            // victim. Covers every cause, so PVP kills, falls and lava all
            // announce themselves.
            const multiplayer = this.minecraft.multiplayer;
            if (multiplayer && multiplayer.connected) {
                multiplayer.broadcast({ type: "chat", message: "§c" + msg });
            }
        }
    }

    dropInventory() {
        if (this.gameMode === 1) return; // Don't drop in creative

        const radius = 2;
        const world = this.world;

        // Drop normal items
        for (let i = 0; i < this.inventory.items.length; i++) {
            const stack = this.inventory.items[i];
            if (stack && stack.id !== 0 && stack.count > 0) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * radius;
                const dx = Math.cos(angle) * dist;
                const dz = Math.sin(angle) * dist;
                
                const drop = new DroppedItem(world, this.x + dx, this.y + 0.5, this.z + dz, stack.id, stack.count, stack.tag);
                // Give it a little random motion
                drop.motionX = (Math.random() - 0.5) * 0.2;
                drop.motionY = 0.3 + Math.random() * 0.2;
                drop.motionZ = (Math.random() - 0.5) * 0.2;
                world.droppedItems.push(drop);
                
                // Clear slot
                this.inventory.items[i] = {id: 0, count: 0, damage: 0, tag: {}};
            }
        }

        // Drop armor items
        for (let i = 0; i < this.inventory.armor.length; i++) {
            const stack = this.inventory.armor[i];
            if (stack && stack.id !== 0) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * radius;
                const dx = Math.cos(angle) * dist;
                const dz = Math.sin(angle) * dist;
                
                const drop = new DroppedItem(world, this.x + dx, this.y + 0.5, this.z + dz, stack.id, 1, stack.tag);
                world.droppedItems.push(drop);
                this.inventory.armor[i] = {id: 0, count: 0, damage: 0, tag: {}};
            }
        }
    }

    updateBodyRotation() {
        if (this.isRiding()) {
            return;
        }
        super.updateBodyRotation();
    }

}
