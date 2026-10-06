import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import EntityLiving from "../../../entity/EntityLiving.js";

export default class BlockItem extends Block {

    constructor(id, textureName, textureIndex = 0) {
        super(id, 0);
        this.textureName = textureName;
        this.textureIndex = textureIndex;
    }

    getRenderType() {
        return BlockRenderType.ITEM;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    canPlaceBlockAt(world, x, y, z) {
        return false;
    }

    onItemUse(world, x, y, z, face, player) {
        if (this.isThrowable) {
            this.throwItem(world, player);
            return true;
        }
        return false;
    }

    throwItem(world, player) {
        player.swingArm();
        if (player.gameMode !== 1) {
            player.inventory.consumeItem(this.id);
        }

        // Check for specific throw actions in tags or mod properties
        const itemStack = player.inventory.getStackInSlot(player.inventory.selectedSlotIndex);
        const onThrow = this.onThrowCommand || (itemStack && itemStack.tag && itemStack.tag.onThrow);

        let ProjectilePromise;
        let impactAction = null;

        if (onThrow === "teleport") {
            ProjectilePromise = import("../../../entity/EntityEnderPearl.js");
        } else if (onThrow === "explode") {
            ProjectilePromise = import("../../../entity/EntitySnowball.js");
            impactAction = (hitX, hitY, hitZ) => {
                // Instant explosion without summoning TNT entity
                world.minecraft.soundManager.playSound("random.explode", hitX, hitY, hitZ, 4.0, 0.7);
                const radius = 3.0;
                const rSq = radius * radius;
                
                for (let dx = -radius; dx <= radius; dx++) {
                    for (let dy = -radius; dy <= radius; dy++) {
                        for (let dz = -radius; dz <= radius; dz++) {
                            let rx = Math.floor(hitX + dx), ry = Math.floor(hitY + dy), rz = Math.floor(hitZ + dz);
                            if (dx*dx + dy*dy + dz*dz <= rSq) {
                                let id = world.getBlockAt(rx, ry, rz);
                                if (id !== 0 && id !== 7) world.setBlockAt(rx, ry, rz, 0);
                            }
                        }
                    }
                }
                world.minecraft.worldRenderer.flushRebuild = true;
                
                // Damage entities
                const dist = player.getDistanceToEntity({x: hitX, y: hitY, z: hitZ, getEyeHeight: () => 0});
                if (dist < radius) player.takeHit(null, Math.floor((1 - dist/radius) * 20));
            };
        } else if (onThrow === "fire") {
            ProjectilePromise = import("../../../entity/EntitySnowball.js");
            impactAction = (hitX, hitY, hitZ) => {
                world.setBlockAt(Math.floor(hitX), Math.floor(hitY), Math.floor(hitZ), 51);
                world.minecraft.soundManager.playSound("fire.ignite", hitX, hitY, hitZ, 1.0, 1.0);
            };
        } else if (onThrow === "lightning") {
            ProjectilePromise = import("../../../entity/EntitySnowball.js");
            impactAction = (hitX, hitY, hitZ) => {
                world.minecraft.soundManager.playSound("random.explode", hitX, hitY, hitZ, 2.0, 2.0);
                world.setBlockAt(Math.floor(hitX), Math.floor(hitY), Math.floor(hitZ), 51);
            };
        } else if (onThrow === "splash") {
            ProjectilePromise = import("../../../entity/EntitySnowball.js");
            impactAction = (hitX, hitY, hitZ) => {
                world.minecraft.soundManager.playSound("random.splash", hitX, hitY, hitZ, 1.0, 1.0);
                // Particle effect matching potion color
                for (let i = 0; i < 25; i++) {
                    world.minecraft.particleManager.spawnCustomSmoke(world, hitX + (Math.random() - 0.5), hitY + (Math.random() - 0.5), hitZ + (Math.random() - 0.5), this.overlayColor || 0xFFFFFF);
                }

                // Apply effects in radius
                const radius = 4.0;
                const splashBlock = Block.getById(this.id);
                if (splashBlock && splashBlock.potionEffect) {
                    for (let entity of world.entities) {
                        if (entity instanceof EntityLiving) {
                            let dist = Math.sqrt((entity.x - hitX)**2 + (entity.y - hitY)**2 + (entity.z - hitZ)**2);
                            if (dist < radius) {
                                // Scale duration by distance
                                let factor = 1.0 - (dist / radius);
                                let e = splashBlock.potionEffect;
                                if (e.isInstant) {
                                    entity.takeHit(null, (e.amplifier + 1) * 6 * factor);
                                } else {
                                    entity.addEffect(e.name, Math.floor(e.duration * factor), e.amplifier);
                                }
                            }
                        }
                    }
                }
            };
        } else {
            ProjectilePromise = import("../../../entity/EntitySnowball.js");
        }

        ProjectilePromise.then(module => {
            const ProjectileClass = module.default;
            const projectile = new ProjectileClass(world.minecraft, world);
            
            if (this.id === 322) { // Golden Apple
                world.minecraft.achievementManager.grant('heartofgold');
            }
            
            // Store original item ID for impact logic (e.g. splash potions)
            if (projectile.constructor.name === "EntitySnowball") {
                projectile.thrownBlockId = this.id;
            }

            if (impactAction) {
                projectile.onImpact = impactAction;
            }

            const look = player.getLook(1.0);
            const eyePos = player.getPositionEyes(1.0);
            
            projectile.owner = player;
            projectile.setPosition(eyePos.x + look.x * 0.5, eyePos.y + look.y * 0.5, eyePos.z + look.z * 0.5);

            let speed = 1.5;
            projectile.motionX = look.x * speed;
            projectile.motionY = look.y * speed + 0.15;
            projectile.motionZ = look.z * speed;
            
            world.addEntity(projectile);
            world.minecraft.soundManager.playSound("random.bow", player.x, player.y, player.z, 0.5, 0.4);
            
            if (onThrow && onThrow.startsWith("/")) {
                world.minecraft.commandHandler.handleMessage(onThrow);
            }
        });
    }
}

