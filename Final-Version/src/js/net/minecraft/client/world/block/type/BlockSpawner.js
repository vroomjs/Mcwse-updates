import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import { BlockRegistry } from "../BlockRegistry.js";

export default class BlockSpawner extends Block {
    constructor(id) {
        super(id, 0); 
        this.textureName = "../../spawner.png";
        this.sound = Block.sounds.stone;
        this.name = "Mob Spawner";
    }

    getRenderType() {
        return BlockRenderType.SPAWNER;
    }

    getTextureForFace(face) {
        return { type: 'custom', name: this.textureName, index: 0, cols: 1 };
    }

    isTranslucent() {
        return true;
    }

    isSolid() {
        // Return false for culling (so blocks it is placed on render their faces)
        return false;
    }

    getCollisionBoundingBox(world, x, y, z) {
        // Keep physical collision solid
        return this.boundingBox;
    }

    getOpacity() {
        return 0.0; // Transparent for light and culling
    }

    onBlockAdded(world, x, y, z) {
        this.onBlockPlaced(world, x, y, z, null);
    }

    onBlockPlaced(world, x, y, z, face) {
        let te = world.getTileEntity(x, y, z);
        if (!te) {
            te = {
                mobType: null,
                timer: 80,
                spawnedIds: []
            };
            world.setTileEntity(x, y, z, te);
        }
    }

    onBlockActivated(world, x, y, z, player) {
        const heldId = player.inventory.getItemInSelectedSlot();
        const heldBlock = Block.getById(heldId);

        // Check if player is holding a spawn egg
        if (heldBlock && heldBlock.constructor.name === "BlockSpawnEgg") {
            let te = world.getTileEntity(x, y, z);
            if (!te) {
                this.onBlockPlaced(world, x, y, z, null);
                te = world.getTileEntity(x, y, z);
            }

            // Set the mob type from the egg
            te.mobType = heldBlock.entityClass.name;
            te.timer = 80;
            te.spawnedIds = [];
            
            world.setTileEntity(x, y, z, te);
            player.swingArm();
            world.minecraft.soundManager.playSound("random.pop", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.2);
            return true;
        }
        return false;
    }

    updateTileEntity(world, x, y, z, te) {
        if (!te.mobType) return;

        // Visual idle particles (Increased frequency and count for more active interior)
        if (world.minecraft && Math.random() < 0.5) {
            for (let i = 0; i < 2; i++) {
                let px = x + 0.2 + Math.random() * 0.6;
                let py = y + 0.2 + Math.random() * 0.6;
                let pz = z + 0.2 + Math.random() * 0.6;
                world.minecraft.particleManager.spawnFlameParticle(world, px, py, pz, (Math.random() - 0.5) * 0.01, 0.01, (Math.random() - 0.5) * 0.01, 0.4);
            }
        }

        if (world.isRemote) return;

        // Clean up dead mobs from tracking list
        te.spawnedIds = te.spawnedIds.filter(id => world.getEntityById(id) !== null);

        if (te.timer > 0) {
            te.timer--;
        } else {
            // Check cap
            if (te.spawnedIds.length < 5) {
                this.spawnMob(world, x, y, z, te);
                te.timer = 80; // 4 seconds
            } else {
                te.timer = 20; // Check again in 1 second if full
            }
        }
    }

    spawnMob(world, x, y, z, te) {
        const MobClass = world.minecraft.commandHandler.mobMap[te.mobType.replace("Entity", "").toLowerCase()];
        if (MobClass) {
            const mob = new MobClass(world.minecraft, world);
            
            // Try to find a valid air spot in a 4x4x4 volume around the spawner
            let found = false;
            let rx = x, ry = y, rz = z;

            for (let i = 0; i < 20; i++) {
                rx = x + (Math.random() * 8 - 4);
                rz = z + (Math.random() * 8 - 4);
                ry = y + Math.floor(Math.random() * 3) - 1;

                // Check if current block is air and block below is solid
                if (world.getBlockAt(Math.floor(rx), Math.floor(ry), Math.floor(rz)) === 0 &&
                    world.isSolidBlockAt(Math.floor(rx), Math.floor(ry - 1), Math.floor(rz))) {
                    found = true;
                    break;
                }
            }

            if (!found) return;
            
            mob.setPosition(rx, ry, rz);
            world.addEntity(mob);
            te.spawnedIds.push(mob.id);
            
            // Visual effect
            world.minecraft.soundManager.playSound("random.pop", x + 0.5, y + 0.5, z + 0.5, 0.5, 0.8);
            if (world.minecraft) {
                for (let i = 0; i < 20; i++) {
                    world.minecraft.particleManager.spawnFlameParticle(world, x + 0.5 + (Math.random() - 0.5) * 2, y + 0.5 + (Math.random() - 0.5) * 2, z + 0.5 + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, 1.0);
                }
            }
        }
    }
}