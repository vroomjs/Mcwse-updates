import BoundingBox from "../../util/BoundingBox.js";
import MathHelper from "../../util/MathHelper.js";
import Block from "../world/block/Block.js";
import * as THREE from "three";
import BlockRenderType from "../../util/BlockRenderType.js";
import EnumBlockFace from "../../util/EnumBlockFace.js";
import { disposeObject } from "../../util/dispose.js";

export default class DroppedItem {
    constructor(world, x, y, z, blockId, count, tag = null, manuallyDropped = false, pickupDelayTicks = 16) {
        this.world = world;
        this.blockId = blockId;
        this.count = count;
        this.tag = tag;
        this.damage = 0;

        this.x = x;
        this.y = y;
        this.z = z;

        this.serverID = "it_" + Date.now() + "_" + Math.random();
        this.serverID_synced = false;
        this.remote = false;

        this.motionX = (Math.random() - 0.5) * 0.1;
        this.motionY = 0.2;
        this.motionZ = (Math.random() - 0.5) * 0.1;

        this.onGround = false;
        this.isDead = false;

        this.age = 0;
        // Callers can use a shorter delay for block-break drops while
        // preserving the normal delay for mob, machine, and manual drops.
        this.pickupDelay = pickupDelayTicks;
        
        // Delay gliding to player (2 seconds = 40 ticks for manual drops)
        this.glideDelay = manuallyDropped ? 40 : 0;

        this.height = 0.25;
        this.width = 0.25;

        // The y parameter is the center of the item.
        // We set the bounding box around this center.
        this.boundingBox = new BoundingBox(
            x - this.width / 2,
            y - this.height / 2,
            z - this.width / 2,
            x + this.width / 2,
            y + this.height / 2,
            z + this.width / 2
        );

        this.mesh = this.createMesh();
        this.world.group.add(this.mesh);
    }

    createMesh() {
        let block = Block.getById(this.blockId);
        if (!block) return new THREE.Object3D();

        // Determine if this block renders as a 3D model
        const type = block.getRenderType();
        const is3D = (
            type === BlockRenderType.BLOCK ||
            type === BlockRenderType.ORE ||
            type === BlockRenderType.MINERAL ||
            type === BlockRenderType.CRAFTING_TABLE ||
            type === BlockRenderType.FURNACE ||
            type === BlockRenderType.CHEST ||
            type === BlockRenderType.PUMPKIN ||
            type === BlockRenderType.SANDSTONE ||
            type === BlockRenderType.NETHER ||
            type === BlockRenderType.SLAB ||
            type === BlockRenderType.STAIRS ||
            type === BlockRenderType.BED ||
            type === BlockRenderType.FENCE ||
            type === BlockRenderType.FENCE_GATE ||
            type === BlockRenderType.WALL ||
            type === BlockRenderType.CROSS ||
            type === BlockRenderType.TORCH ||
            type === BlockRenderType.LADDER ||
            type === BlockRenderType.RAIL ||
            type === BlockRenderType.ITEM ||
            type === BlockRenderType.DOUBLE_PLANT ||
            this.blockId === 83 || // Sugar Cane
            this.blockId === 33 || // Dead Bush
            this.blockId === 566   // Grass Path
        );

        // Render 3D block mesh
        if (is3D) {
            const group = new THREE.Group();
            const renderer = this.world.minecraft.worldRenderer.blockRenderer;
            
            // Use GUI renderer to build the mesh, passing brightness 1.0 and force3D=true
            renderer.renderGuiBlock(group, block, 0, 0, 1.0, 1.0, true);
            
            // Reset the fixed GUI rotations/offsets on the generated mesh children
            // so we can rotate the group freely in the world.
            // Center geometry to ensure pivot-based rotation is correct.
            if (group.children.length > 0) {
                group.children.forEach(mesh => {
                    if (mesh.geometry) {
                        mesh.geometry.center();
                    }
                    mesh.position.set(0, 0, 0);
                    mesh.rotation.set(0, 0, 0);
                    mesh.scale.set(1, 1, 1);
                    if (mesh.material) {
                        mesh.material.side = THREE.DoubleSide;
                    }
                });
            }
            
            // Scale down to item size (Increased by 25% from 0.27)
            group.scale.set(0.3375, 0.3375, 0.3375);
            group.position.set(this.x, this.y, this.z);
            
            group.userData = {
                bobOffset: Math.random() * Math.PI * 2,
                bobHeight: 0.1,
                bobSpeed: 2.0,
                rotateSpeed: 1.5,
                is3D: true
            };
            
            return group;
        }

        // 2D Sprite Fallback for Items / Flat Blocks
        let texture;
        let textureIndex = 0;
        let textureCols = 16;
        let textureRows = 1;
        let spriteWidth = 16;
        let spriteHeight = 16;
        let textureImage;

        // Determine texture and sprite info
        if (block.textureWidth > 0 && block.textureHeight > 0) {
            textureImage = this.world.minecraft.resources[block.textureName] || this.world.minecraft.resources["../../" + block.textureName] || this.world.minecraft.resources[block.textureName.replace(/^\.?\.?\/+/, '')];
            textureCols = Math.floor(block.textureWidth / 16); // Assuming 16x16 standard unit
            textureRows = Math.floor(block.textureHeight / 16);
            textureIndex = block.textureIndex || 0;
        } else if (block.getRenderType() === BlockRenderType.ORE || block.getRenderType() === BlockRenderType.MINERAL) {
            let path = block.textureName;
            if (path && !path.startsWith("../../")) path = "../../" + path;
            textureImage = this.world.minecraft.resources[path] || this.world.minecraft.resources[block.textureName];
            textureIndex = block.textureIndex || 0;
            textureCols = 1;
            if (path && path.includes("orestuff.png")) textureCols = 14;
            else if (path && path.includes("stonesheet.png")) textureCols = 8;
            else if (path && path.includes("nether.png")) textureCols = 5;
            else if (path && (path.includes("items (1).png") || path.includes("items.png"))) textureCols = 37;
            else if (path && path.includes("magma")) textureCols = 3;
            else if (textureImage && textureImage.width > textureImage.height) textureCols = Math.floor(textureImage.width / textureImage.height);
            textureRows = 1;
        } else if (block.getRenderType() === BlockRenderType.NETHER) {
            textureImage = this.world.minecraft.resources["../../nether.png"];
            textureIndex = block.textureIndex;
            textureCols = 5;
            textureRows = 1;
        } else if (block.getRenderType() === BlockRenderType.DOOR) {
            let path = block.textureName;
            if (path && !path.startsWith("../../")) path = "../../" + path;
            textureImage = this.world.minecraft.resources[path] || this.world.minecraft.resources[block.textureName];
            // Use specific icon index if provided, otherwise fallback to textureIndex
            textureIndex = (block.iconIndex !== undefined) ? block.iconIndex : (block.textureIndex || 0); 
            textureCols = 17;
            textureRows = 1;
        } else if (block.getRenderType() === BlockRenderType.CROSS) {
            const name = block.textureName;
            textureImage = this.world.minecraft.resources[name] || this.world.minecraft.resources["../../" + name];
            textureIndex = block.textureIndex;
            textureCols = 1;
            if (name) {
                if (name.includes("foliage.png")) textureCols = 21;
                else if (name.includes("grasslandfoliage.png")) textureCols = 5;
                else if (name.includes("deadandsugar.png.png")) textureCols = 2;
                else if (name.includes("desert (3)")) textureCols = 11;
                else if (name.includes("treestuff.png")) textureCols = 30;
                else if (name.includes("sandstuff.png")) textureCols = 10;
                else if (name.includes("farming.png")) textureCols = 20;
                else if (name.includes("beetroot")) textureCols = 7;
                else textureCols = 3;
            }
            textureRows = 1;
        } else if (block.getRenderType() === BlockRenderType.FURNACE || block.getRenderType() === BlockRenderType.CHEST || block.getRenderType() === BlockRenderType.CRAFTING_TABLE || block.getRenderType() === BlockRenderType.PUMPKIN || block.getRenderType() === BlockRenderType.BED) {
            // Use the block's dedicated spritesheet (furnace.png.png, chest.png.png, craftingtablesheet.png, pumpkin.png.png)
            // These spritesheets have a small number of columns; detect reasonable defaults.
            const name = block.textureName || "";
            // Try direct lookup with/without leading path
            textureImage = this.world.minecraft.resources[name] || this.world.minecraft.resources[name.replace(/^\.?\.?\/+/, '')];
            if (textureImage) {
                if (name.includes("furnace")) {
                    // furnace sheet: 4 columns (lit front, unlit front, sides, top)
                    textureCols = 4;
                    textureRows = 1;
                    textureIndex = 1; // default to unlit front for inventory/dropped icon
                } else if (name.includes("pumpkin")) {
                    // pumpkin sheet: 4 columns (top, side, front, jack)
                    textureCols = 4;
                    textureRows = 1;
                    textureIndex = block.isLit ? 3 : 2;
                } else if (name.includes("chest")) {
                    textureCols = 3; // front / sides / top
                    textureRows = 1;
                    textureIndex = 0; // front
                } else if (name.includes("craftingtablesheet")) {
                    textureCols = 3;
                    textureRows = 1;
                    // use front texture for the crafting table
                    textureIndex = block.getTextureForFace(EnumBlockFace.NORTH);
                } else {
                    // generic fallback to single-sprite sheet
                    textureCols = 1;
                    textureRows = 1;
                    textureIndex = 0;
                }
            } else {
                // fallback to terrain blocks if sprite not found
                textureImage = this.world.minecraft.resources["../../blocks.png"];
                textureIndex = block.getTextureForFace(EnumBlockFace.NORTH);
                textureCols = 14;
                textureRows = 1;
            }
        } else {
            // Unify sprite logic with Gui.js for consistency
            let textureInfo = block.getTextureForFace(EnumBlockFace.NORTH);
            if (typeof textureInfo === 'object' && textureInfo.type === 'custom') {
                textureImage = this.world.minecraft.resources[textureInfo.name] || this.world.minecraft.resources["../../" + textureInfo.name];
                textureIndex = textureInfo.index || 0;
                textureCols = textureInfo.cols || 1;
                textureRows = textureInfo.rows || 1;
            } else if (block.textureWidth > 0 && block.textureHeight > 0) {
                textureImage = this.world.minecraft.resources[block.textureName] || this.world.minecraft.resources["../../" + block.textureName];
                textureCols = Math.floor(block.textureWidth / 16);
                textureRows = Math.floor(block.textureHeight / 16);
                textureIndex = block.textureIndex || 0;
            } else if (block.textureName) {
                const name = block.textureName;
                textureImage = this.world.minecraft.resources[name] || this.world.minecraft.resources["../../" + name];
                textureIndex = block.textureIndex || 0;
                textureCols = 1;
                
                if (name.includes("tools (1).png")) textureCols = 43;
                else if (name.includes("items (1).png")) textureCols = 37;
                else if (name.includes("farming.png")) textureCols = 20;
                else if (name.includes("food.png")) textureCols = 18;
                else if (name.includes("sandstuff.png") || name.includes("desert (1).png")) textureCols = 10;
                else if (name.includes("orestuff.png")) textureCols = 14;
                else if (name.includes("nether.png")) textureCols = 5;
                else if (name.includes("furnace")) textureCols = 4;
                else if (name.includes("chest")) textureCols = 3;
                else if (name.includes("stonesheet")) textureCols = 8;
                else if (name.includes("trapdoorsheet")) textureCols = 6;
                else if (name.includes("All doors")) textureCols = 17;
                else if (name.includes("magma")) textureCols = 3;
                else if (name.includes("coloredglass")) textureCols = 14;
                else if (name.includes("wools.png")) textureCols = 15;
                else if (name.includes("grasslandfoliage")) textureCols = 5;
                else if (name.includes("deadandsugar")) textureCols = 2;
                else if (name.includes("treestuff")) textureCols = 30;
                else if (name.includes("beetroot")) textureCols = 7;
                else if (name.includes("dye.png")) textureCols = 16;
                else if (name.includes("foliage.png")) textureCols = 21;
                else if (name.includes("signs.png")) textureCols = 5;
                else if (name.includes("food2.png")) textureCols = 5;
                else if (name.includes("slimestuff.png")) textureCols = 2;
                else if (name.includes("dicsandbox")) textureCols = 14;
                else if (name.includes("newblocksset1.png")) textureCols = 9;
                else if (textureImage && textureImage.width > textureImage.height) textureCols = Math.floor(textureImage.width / textureImage.height);
                
                textureRows = 1;
            } else {
                textureImage = this.world.minecraft.resources["../../blocks.png"];
                textureIndex = typeof textureInfo === 'number' ? textureInfo : block.textureSlotId;
                textureCols = 14;
                textureRows = 1;
            }
        }

        if (!textureImage) return new THREE.Object3D();

        texture = new THREE.CanvasTexture(textureImage);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        // Calculate UVs
        const u = (textureIndex % textureCols) / textureCols;
        const v = 1.0 - (Math.floor(textureIndex / textureCols) + 1) / textureRows;

        texture.offset.set(u, v);
        texture.repeat.set(1 / textureCols, 1 / textureRows);

        let material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });

        let sprite = new THREE.Sprite(material);
        // Scale increased by 25% (0.5 -> 0.625)
        sprite.scale.set(0.625, 0.625, 0.625);
        sprite.position.set(this.x, this.y, this.z);

        sprite.userData = {
            bobOffset: Math.random() * Math.PI * 2,
            bobHeight: 0.2, // Increased bob height
            bobSpeed: 1.5,
            item: this
        };

        return sprite;
    }

    onTick() {
        this.age++;
        if (this.pickupDelay > 0) {
            this.pickupDelay--;
        }

        if (this.age > 18000) { // 15 minutes (15 * 60 * 20 ticks)
            this.kill();
        }

        this.prevX = this.x;
        this.prevY = this.y;
        this.prevZ = this.z;

        if (this.remote) {
            // Updated by network, keep mesh in sync with manual coordinates
            if (this.mesh) this.mesh.position.set(this.x, this.y, this.z);
            return;
        }

        // Attraction to the player
        if (this.glideDelay > 0) {
            this.glideDelay--;
        } else {
            const player = this.world.minecraft.player;
            if (player) {
                let tx = player.x;
                let ty = player.y + player.getEyeHeight() * 0.5; // Target player's torso
                let tz = player.z;

                let dx = tx - this.x;
                let dy = ty - this.y;
                let dz = tz - this.z;
                let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                let radius = 2.0; // 2 block radius

                if (dist < radius && dist > 0.2) {
                    // Scaling: further = slower, closer = faster
                    let strength = (1.0 - (dist / radius)) * 0.18;
                    this.motionX += (dx / dist) * strength;
                    this.motionY += (dy / dist) * strength;
                    this.motionZ += (dz / dist) * strength;
                }
            }
        }

        this.motionY -= 0.04;

        // Cobwebs heavily damp dropped-item movement, including falling.
        const minY = Math.floor(this.boundingBox.minY);
        const maxY = Math.floor(this.boundingBox.maxY - 0.0001);
        let isInCobweb = false;
        for (let blockY = minY; blockY <= maxY; blockY++) {
            if (this.world.getBlockAt(Math.floor(this.x), blockY, Math.floor(this.z)) === 571) {
                isInCobweb = true;
                break;
            }
        }
        if (isInCobweb) {
            this.motionX *= 0.25;
            this.motionY *= 0.25;
            this.motionZ *= 0.25;
        }

        this.move(this.motionX, this.motionY, this.motionZ);

        this.motionX *= 0.98;
        this.motionY *= 0.98;
        this.motionZ *= 0.98;

        if (this.onGround) {
            this.motionX *= 0.7;
            this.motionZ *= 0.7;
            this.motionY = 0; // Stop bouncing
        }

        // Bobbing is now handled in WorldRenderer
        //this.mesh.position.set(this.x, this.y, this.z);
    }

    move(dx, dy, dz) {
        let boundingBoxList = this.world.getCollisionBoxes(this.boundingBox.expand(dx, dy, dz));

        for (const bb of boundingBoxList) {
            dy = bb.clipYCollide(this.boundingBox, dy);
        }
        this.boundingBox.move(0, dy, 0);

        for (const bb of boundingBoxList) {
            dx = bb.clipXCollide(this.boundingBox, dx);
        }
        this.boundingBox.move(dx, 0, 0);

        for (const bb of boundingBoxList) {
            dz = bb.clipZCollide(this.boundingBox, dz);
        }
        this.boundingBox.move(0, 0, dz);

        this.onGround = dy !== this.motionY && this.motionY < 0;

        if (dx !== this.motionX) {
            this.motionX = 0;
        }
        if (dy !== this.motionY) {
            this.motionY = 0;
        }
        if (dz !== this.motionZ) {
            this.motionZ = 0;
        }

        this.x = (this.boundingBox.minX + this.boundingBox.maxX) / 2.0;
        this.y = (this.boundingBox.minY + this.boundingBox.maxY) / 2.0;
        this.z = (this.boundingBox.minZ + this.boundingBox.maxZ) / 2.0;
    }

    kill() {
        this.isDead = true;
        if (this.mesh) disposeObject(this.mesh);
    }
}
