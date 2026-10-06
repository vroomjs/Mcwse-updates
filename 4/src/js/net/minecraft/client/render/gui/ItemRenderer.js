import * as THREE from "three";
import BlockRenderType from "../../../util/BlockRenderType.js";
import ModelPlayer from "../model/model/ModelPlayer.js";
import Tessellator from "../Tessellator.js";

export default class ItemRenderer {

    constructor(minecraft, window) {
        this.minecraft = minecraft;
        this.window = window;

        this.items = {};
    }

    initialize() {
        // Create item camera using direct screen-coordinate mapping (0..width, 0..-height)
        this.camera = new THREE.OrthographicCamera(0, this.window.width, 0, -this.window.height, -100, 300);
        this.camera.near = -100;
        this.camera.far = 300;
        this.camera.rotation.order = 'ZYX';
        this.camera.up = new THREE.Vector3(0, 1, 0);

        // Create scene
        this.scene = new THREE.Scene();
        // matrixAutoUpdate must be true so the held item mesh follows mouse correctly in first pass
        this.scene.matrixAutoUpdate = true;

        // Create web renderer
        this.webRenderer = new THREE.WebGLRenderer({
            canvas: this.window.canvasItems,
            antialias: false,
            alpha: true,
            preserveDrawingBuffer: true
        });

        // Settings
        this.webRenderer.setSize(this.window.width, this.window.height);
        this.webRenderer.autoClear = false;
        this.webRenderer.sortObjects = false;
        this.webRenderer.setClearColor(0x000000, 0);
        this.webRenderer.clear();
    }

    render(partialTicks) {
        this.webRenderer.clear();

        // Update camera projection to match window size
        this.camera.left = 0;
        this.camera.right = this.window.width;
        this.camera.top = 0;
        this.camera.bottom = -this.window.height;
        this.camera.updateProjectionMatrix();

        // Ensure all world matrices are current before render
        this.scene.updateMatrixWorld(true);

        // Render scene
        this.webRenderer.render(this.scene, this.camera);
    }

    renderItemInGui(renderId, block, x, y, size = 10, brightness = 1.0, z = 0, tag = null) {
        if (!block || block.getId() === 0) {
            if (this.items[renderId]) {
                const group = this.items[renderId].group;
                group.traverse(child => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) child.material.dispose();
                    }
                });
                this.scene.remove(group);
                delete this.items[renderId];
            }
            return;
        }
        
        // Handle render type switching if an item becomes a block or vice-versa
        if (this.items[renderId] && this.items[renderId].typeId !== block.getId()) {
            const group = this.items[renderId].group;
            group.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                }
            });
            this.scene.remove(group);
            delete this.items[renderId];
        }

        let meta = this.items[renderId];
        if (typeof meta === "undefined") {
            meta = {};

            // To make the items darker
            let paused = this.minecraft.isPaused();

            // Render item
            let group = new THREE.Group();
            // Align the group position exactly with the provided GUI coordinates.
            // Centering within slots is handled by the caller or geometry calculation.
            group.position.set(x, -y, z);
            
            // Slight brightness boost for Quartz item specifically
            if (block.getId() === 415) brightness *= 1.2;
            
            // Force Redstone components to use correct columns in cache
            if (block.textureName && block.textureName.includes("redstonestuff")) {
                block.cols = 22;
                if (block.textureIndex === undefined) {
                    // Fallback mapping if instance lacks it
                    if (block.id === 331) block.textureIndex = 0;
                    else if (block.id === 55) block.textureIndex = 1;
                    else if (block.id === 76) block.textureIndex = 6;
                    else if (block.id === 75) block.textureIndex = 7;
                }
            }

            // Render item using the block renderer's GUI rendering method
            this.minecraft.worldRenderer.blockRenderer.renderGuiBlock(group, block, x, y, size, paused ? 0.5 * brightness : brightness, false, tag);
            
            this.scene.add(group);

            // Create meta
            meta.group = group;
            meta.typeId = block.getId();
            meta.tagHash = tag ? JSON.stringify(tag) : null;
            meta.x = x;
            meta.y = y;
            meta.z = z;
            meta.dirty = false;
            this.items[renderId] = meta;
        } else {
            let currentTagHash = null;
            try {
                currentTagHash = tag ? JSON.stringify(tag) : null;
            } catch (e) {
                currentTagHash = "circular_error";
            }

            // Check if rendered item has changed
            if (meta.dirty || meta.typeId !== block.getId() || meta.tagHash !== currentTagHash) {
                // Rebuild item
                this.scene.remove(meta.group);
                delete this.items[renderId];
                this.renderItemInGui(renderId, block, x, y, size, brightness, z, tag);
            } else if (meta.x !== x || meta.y !== y || meta.z !== z) {
                // Only update position if it changed
                meta.group.position.set(x, -y, z);
                meta.x = x;
                meta.y = y;
                meta.z = z;
            }
        }
    }

    renderEntityInGui(renderId, entity, x, y, size, bodyYaw, headYaw, headPitch) {
        let meta = this.items[renderId];

        if (!meta) {
            meta = {
                group: new THREE.Group(),
                dirty: true
            };
            this.scene.add(meta.group);
            this.items[renderId] = meta;
        }

        // Setup the group in the GUI scene
        meta.group.clear();
        meta.group.position.set(x, -y, 50);
        
        // We use the entity's own renderer but redirect its group content
        if (entity && entity.renderer) {
            const renderer = entity.renderer;
            
            // Re-bind texture if resource was refreshed
            if (entity.variantTexture && renderer.loaded) {
                const tex = this.minecraft.getThreeTexture(entity.variantTexture);
                if (tex && renderer.mesh) {
                    renderer.mesh.traverse(child => {
                        if (child.isMesh && child.material) {
                            const lowName = child.name ? child.name.toLowerCase() : "";
                            const isOverlay = lowName.includes("saddle") || lowName.includes("armor") || lowName.includes("chest") || lowName.includes("bag");
                            if (!isOverlay) {
                                child.material.map = tex;
                                child.material.needsUpdate = true;
                            }
                        }
                    });
                }
            }

            // Snapshot current world transform
            const oldGroupParent = renderer.group.parent;
            const oldPos = renderer.group.position.clone();
            const oldRot = renderer.group.rotation.clone();
            const oldScale = renderer.group.scale.clone();
            const oldVisible = renderer.group.visible;

            // Redirect renderer to GUI group
            meta.group.add(renderer.group);
            
            // Set GUI-specific transform
            renderer.group.position.set(0, 0, 0);
            // Invert scale for GUI flip
            const s = size * 18.0; 
            renderer.group.scale.set(-s, -s, s);
            renderer.group.rotation.set(0, bodyYaw, 0);
            renderer.group.visible = true;

            // Force a render pass to update meshes
            const oldYaw = entity.rotationYaw, oldPitch = entity.rotationPitch;
            const oldPrevYaw = entity.prevRotationYaw, oldPrevPitch = entity.prevRotationPitch;
            const oldBodyYaw = entity.renderYawOffset, oldPrevBodyYaw = entity.prevRenderYawOffset;
            const oldHeadYaw = entity.rotationYawHead, oldPrevHeadYaw = entity.prevRotationYawHead;

            entity.rotationYaw = entity.prevRotationYaw = MathHelper.toDegrees(-bodyYaw);
            entity.rotationPitch = entity.prevRotationPitch = headPitch;
            entity.renderYawOffset = entity.prevRenderYawOffset = MathHelper.toDegrees(-bodyYaw);
            entity.rotationYawHead = entity.prevRotationYawHead = MathHelper.toDegrees(-bodyYaw) + headYaw;

            renderer.render(entity, 0);

            // Restore entity world state
            entity.rotationYaw = oldYaw; entity.rotationPitch = oldPitch;
            entity.prevRotationYaw = oldPrevYaw; entity.prevRotationPitch = oldPrevPitch;
            entity.renderYawOffset = oldBodyYaw; entity.prevRenderYawOffset = oldPrevBodyYaw;
            entity.rotationYawHead = oldHeadYaw; entity.prevRotationYawHead = oldPrevHeadYaw;

            // Brightness fix for GUI
            renderer.group.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.color.setScalar(1.0);
                    // Ensure depth testing is on for GUI models
                    child.material.depthTest = true;
                    child.material.depthWrite = true;
                }
            });

            // Move group back to world scene
            if (oldGroupParent) {
                oldGroupParent.add(renderer.group);
                renderer.group.position.copy(oldPos);
                renderer.group.rotation.copy(oldRot);
                renderer.group.scale.copy(oldScale);
                renderer.group.visible = oldVisible;
            }
        }
    }

    renderPlayerInGui(player, x, y, size, bodyYaw, headYaw, headPitch) {
        const renderId = "gui_player_preview";
        let meta = this.items[renderId];

        if (!meta) {
            meta = {
                group: new THREE.Group(),
                playerModel: new ModelPlayer(64, 32),
                armorModels: {
                    iron: new ModelPlayer(64, 32, 1.0),
                    gold: new ModelPlayer(64, 32, 1.0),
                    diamond: new ModelPlayer(64, 32, 1.0)
                },
                armorModels2: {
                    iron: new ModelPlayer(64, 32, 0.5),
                    gold: new ModelPlayer(64, 32, 0.5),
                    diamond: new ModelPlayer(64, 32, 0.5)
                },
                tessellator: new Tessellator(),
                dirty: true
            };
            this.scene.add(meta.group);
            this.items[renderId] = meta;
        }

        // Determine skin to use
        let skinKey = this.minecraft.settings.skin || '../../steve (1).png';
        if (skinKey === "char.png" || skinKey === "src/resources/char.png") {
            skinKey = "../../steve (1).png";
        }
        let skinTexture = this.minecraft.getThreeTexture(skinKey);
        
        // Update model resolution if necessary
        if (skinTexture && skinTexture.image) {
            const h = skinTexture.image.height;
            const w = skinTexture.image.width;
            if (meta.playerModel.head.textureHeight !== h) {
                meta.playerModel = new ModelPlayer(w, h);
            }
        }

        // Rebuild model in the GUI group
        meta.group.clear();
        meta.group.position.set(x, -y, 50);
        
        const tess = meta.tessellator;
        tess.bindTexture(skinTexture);
        tess.setColor(1, 1, 1, 1);
        
        meta.playerModel.rebuild(tess, meta.group);
        


        // Armor Rendering logic
        if (player.inventory) {
            const armorMaterials = [
                { name: "iron", idStart: 306, tex1: "../../iron_layer_1.png", tex2: "../../iron_layer_2.png" },
                { name: "diamond", idStart: 310, tex1: "../../diamond_layer_1.png", tex2: "../../diamond_layer_2.png" },
                { name: "gold", idStart: 314, tex1: "../../goldarmor.png", tex2: "../../goldarmor2.png" }
            ];

            const helmId = player.inventory.getArmor(0).id;
            const chestId = player.inventory.getArmor(1).id;
            const legsId = player.inventory.getArmor(2).id;
            const bootsId = player.inventory.getArmor(3).id;

            for (const mat of armorMaterials) {
                const offset = mat.idStart;
                const hasHelm = helmId === offset;
                const hasChest = chestId === offset + 1;
                const hasLegs = legsId === offset + 2;
                const hasBoots = bootsId === offset + 3;

                if (hasHelm || hasChest || hasBoots) {
                    let tex = this.minecraft.getThreeTexture(mat.tex1);
                    if (tex) {
                        let model = meta.armorModels[mat.name];
                        tess.bindTexture(tex);
                        tess.material.polygonOffset = true;
                        tess.material.polygonOffsetFactor = -1.0;
                        model.head.bone.visible = hasHelm;
                        model.body.bone.visible = hasChest;
                        model.rightArm.bone.visible = hasChest;
                        model.leftArm.bone.visible = hasChest;
                        model.rightLeg.bone.visible = hasBoots;
                        model.leftLeg.bone.visible = hasBoots;
                        model.rebuild(tess, meta.group);
                    }
                }
                if (hasLegs) {
                    let tex = this.minecraft.getThreeTexture(mat.tex2);
                    if (tex) {
                        let model = meta.armorModels2[mat.name];
                        tess.bindTexture(tex);
                        tess.material.polygonOffset = true;
                        tess.material.polygonOffsetFactor = -1.0;
                        model.head.bone.visible = false;
                        model.body.bone.visible = hasLegs;
                        model.rightArm.bone.visible = false;
                        model.leftArm.bone.visible = false;
                        model.rightLeg.bone.visible = hasLegs;
                        model.leftLeg.bone.visible = hasLegs;
                        model.rebuild(tess, meta.group);
                    }
                }
            }
            tess.material.polygonOffset = false;
        }

        // Transform the group
        meta.group.scale.set(-size, -size, size);
        meta.group.rotation.y = bodyYaw;

        // Sync animation state
        const sp = player.getSwingProgress(this.minecraft.timer.partialTicks);
        const sn = player.sneaking;
        
        [meta.playerModel, ...Object.values(meta.armorModels), ...Object.values(meta.armorModels2)].forEach(m => {
            m.swingProgress = sp;
            m.isSneaking = sn;
            m.render(meta.group, 0, 0, 0, headYaw, headPitch, 0);
        });

        // Apply GUI brightness and ensure depth properties are correctly set for ALL parts (limb + items)
        meta.group.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.color.setScalar(1.0);
                child.material.depthTest = true;
                child.material.depthWrite = true;
                // Double side for thin items/extruded blocks
                child.material.side = THREE.DoubleSide;
            }
        });
    }

    rebuildAllItems() {
        for (let i in this.items) {
            this.items[i].dirty = true;
        }
        this.itemInHand = null;
    }

    reset() {
        // Aggressively clear and dispose of everything in the UI item scene
        this.scene.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            }
        });
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
        this.items = {};
        if (this.webRenderer) {
            this.webRenderer.clear();
        }
    }
}