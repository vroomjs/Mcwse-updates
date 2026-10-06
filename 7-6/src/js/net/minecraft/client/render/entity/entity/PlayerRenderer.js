import ModelPlayer from "../../model/model/ModelPlayer.js";
import EntityRenderer from "../EntityRenderer.js";
import Block from "../../../world/block/Block.js";
import * as THREE from "three";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import { disposeGroup } from "../../../../util/dispose.js";

export default class PlayerRenderer extends EntityRenderer {

    constructor(worldRenderer) {
        super(new ModelPlayer());

        this.worldRenderer = worldRenderer;
        
        // Initialize Armor Models (Inflated) per material to prevent state overlapping
        this.armorModels = {};
        this.armorModels2 = {};
        
        const materials = ["iron", "gold", "diamond"];
        
        materials.forEach(mat => {
            this.armorModels[mat] = new ModelPlayer(64, 32, 1.0); // Layer 1
            this.armorModels2[mat] = new ModelPlayer(64, 32, 0.5); // Layer 2
        });
        
        // Armor Textures are loaded on demand or preloaded in Start.js

        // Load character texture
        this.textureCharacter = worldRenderer.minecraft.getThreeTexture('../../steve (1).png');
        this.textureCharacter.magFilter = THREE.NearestFilter;
        this.textureCharacter.minFilter = THREE.NearestFilter;

        // First person right-hand holder
        this.handModel = null;
        this.firstPersonGroup = new THREE.Object3D();
        this.firstPersonGroup.name = "firstPersonGroup";
        this.firstPersonOffhandGroup = new THREE.Object3D();
        this.firstPersonOffhandGroup.name = "firstPersonOffhandGroup";
        this.worldRenderer.overlay.add(this.firstPersonGroup);
        this.worldRenderer.overlay.add(this.firstPersonOffhandGroup);

        this.cameramanModel = this.createCameramanModel();

    }

    createCameramanModel() {
        const root = new THREE.Group(); root.name = "cameramanModel";
        const dark=new THREE.MeshBasicMaterial({color:0x25282d}), black=new THREE.MeshBasicMaterial({color:0x08090b}), metal=new THREE.MeshBasicMaterial({color:0x59616b}), red=new THREE.MeshBasicMaterial({color:0xff2020});
        const add=(g,m,x,y,z)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);root.add(o);return o;};
        add(new THREE.BoxGeometry(.7,.42,.48),dark,0,0,0);
        const hood=add(new THREE.CylinderGeometry(.24,.34,.38,4),dark,0,0,-.38); hood.rotation.x=Math.PI/2;hood.rotation.z=Math.PI/4;
        const lens=add(new THREE.CylinderGeometry(.16,.16,.25,20),black,0,0,-.68);lens.rotation.x=Math.PI/2;
        add(new THREE.BoxGeometry(.24,.15,.18),metal,0,.29,.03); add(new THREE.BoxGeometry(.07,.19,.22),metal,.39,.02,.02);
        root.userData.recordingLight=add(new THREE.SphereGeometry(.045,10,8),red,.28,.17,-.25);
        return root;
    }

    renderCameraman(entity, partialTicks) {
        if (this.cameramanModel.parent !== this.group) this.group.add(this.cameramanModel);
        for (const child of this.group.children) child.visible = child === this.cameramanModel;
        this.firstPersonGroup.visible=false; this.firstPersonOffhandGroup.visible=false;
        const x=entity.prevX+(entity.x-entity.prevX)*partialTicks, y=entity.prevY+(entity.y-entity.prevY)*partialTicks+1.55, z=entity.prevZ+(entity.z-entity.prevZ)*partialTicks;
        this.group.position.set(x,y,z); this.group.scale.set(1,1,1); this.group.rotation.set(0,0,0);
        this.cameramanModel.rotation.order="YXZ";
        const yaw=entity.prevRotationYaw+(entity.rotationYaw-entity.prevRotationYaw)*partialTicks;
        const pitch=entity.prevRotationPitch+(entity.rotationPitch-entity.prevRotationPitch)*partialTicks;
        this.cameramanModel.rotation.set(-THREE.MathUtils.degToRad(pitch),-THREE.MathUtils.degToRad(yaw+180),THREE.MathUtils.degToRad(entity.cameraRoll||0));
        this.cameramanModel.userData.recordingLight.visible=!!entity.broadcasting;
        this.group.visible=true;
    }



    createThirdPersonPistolModel(brightness = 1.0, isOffhand = false) {
        const root = new THREE.Group();
        root.name = isOffhand ? "thirdPersonPistolOffhand" : "thirdPersonPistol";

        const makeMaterial = (hex) => {
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color(hex).multiplyScalar(brightness),
                side: THREE.DoubleSide
            });
            // EntityRenderer normally overwrites material.color with a flat
            // brightness scalar. Remember the intended color so dynamic
            // lighting can keep the pistol black/metal instead of white.
            material.userData.baseColor = hex;
            return material;
        };

        const slideMat = makeMaterial(0x2b3035);
        const frameMat = makeMaterial(0x17191c);
        const gripMat = makeMaterial(0x0b0c0e);
        const accentMat = makeMaterial(0x6d747a);

        const addBox = (name, sx, sy, sz, x, y, z, mat, rx = 0, ry = 0, rz = 0) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
            mesh.name = name;
            mesh.position.set(x, y, z);
            mesh.rotation.set(rx, ry, rz);
            root.add(mesh);
            return mesh;
        };

        // Bone-space blocky pistol. Negative Z is forward from the player's
        // palm; Y is along the arm toward the hand.
        addBox("pistol_slide", 1.65, 0.72, 6.2, 0, -0.10, -2.95, slideMat);
        addBox("pistol_barrel", 0.72, 0.36, 6.65, 0, -0.10, -3.10, accentMat);
        addBox("pistol_frame", 1.42, 0.55, 3.7, 0, -0.78, -2.10, frameMat);
        addBox("pistol_dust_cover", 1.22, 0.38, 2.2, 0, -1.15, -3.15, frameMat);

        // Grip leans back into the palm.
        const grip = new THREE.Group();
        grip.name = "pistol_grip_group";
        grip.position.set(0, -1.20, 0.20);
        grip.rotation.x = -0.28;
        root.add(grip);
        const gripMesh = new THREE.Mesh(new THREE.BoxGeometry(1.35, 3.0, 0.95), gripMat);
        gripMesh.name = "pistol_grip";
        gripMesh.position.set(0, -1.25, 0);
        grip.add(gripMesh);
        const magBase = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.32, 1.05), accentMat);
        magBase.name = "pistol_mag_base";
        magBase.position.set(0, -2.85, 0.18);
        grip.add(magBase);

        // Trigger guard and trigger.
        addBox("pistol_trigger_guard_front", 0.22, 0.95, 0.22, 0, -1.50, -0.72, accentMat, -0.15);
        addBox("pistol_trigger_guard_bottom", 0.22, 0.20, 1.05, 0, -1.92, -0.25, accentMat);
        addBox("pistol_trigger", 0.18, 0.85, 0.18, 0, -1.60, -0.18, frameMat, -0.35);

        // Small front sight and muzzle cap.
        addBox("pistol_front_sight", 0.35, 0.28, 0.22, 0, 0.42, -5.75, accentMat);
        const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 12), accentMat);
        muzzle.name = "pistol_muzzle";
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, -0.08, -6.18);
        root.add(muzzle);

        // Place it in the blocky hand. The mirrored offhand path is mostly for
        // completeness; normal pistol use is the main hand.
        root.position.set(isOffhand ? 1.0 : -1.0, 9.8, -2.25);
        root.rotation.set(-0.08, isOffhand ? Math.PI : 0, isOffhand ? -0.06 : 0.06);
        if (isOffhand) root.scale.x = -1;

        return root;
    }

    /**
     * Hangs the held and offhand items off the arm bones.
     *
     * Must run after super.rebuild(): ModelRenderer.rebuild() clears its bone,
     * so anything attached earlier is thrown away.
     */
    rebuildHeldItems(entity, mainId, offhandId) {
        if (!this.model || !this.model.rightArm) return;
        const brightness = Math.max(0.3, entity.getEntityBrightness ? entity.getEntityBrightness() : 1.0);

        const attach = (bone, id, isOffhand) => {
            if (!bone || !id) return;
            const block = Block.getById(id);
            if (!block) return;
            const holder = new THREE.Object3D();
            holder.name = isOffhand ? "heldItemOffhand" : "heldItem";
            try {
                if (id === 568) {
                    holder.add(this.createThirdPersonPistolModel(brightness, isOffhand));
                } else {
                    this.worldRenderer.blockRenderer.renderItemHand(holder, block, brightness, isOffhand);
                }
            } catch (e) {
                return; // a bad id must never take the whole player model down
            }
            if (holder.children.length) bone.add(holder);
        };

        attach(this.model.rightArm.bone, mainId, false);
        attach(this.model.leftArm && this.model.leftArm.bone, offhandId, true);
    }

    rebuild(entity) {
        // Determine skin to use
        let skinKey = (entity === this.worldRenderer.minecraft.player) ? 
                      this.worldRenderer.minecraft.settings.skin : (entity.skin || "../../steve (1).png");
        
        // Correct legacy or malformed skin keys
        if (!skinKey || skinKey === "char.png" || skinKey === "src/resources/char.png") {
            skinKey = "../../steve (1).png";
        }

        let skinTexture = this.worldRenderer.minecraft.getThreeTexture(skinKey);
        if (!skinTexture) {
             skinTexture = this.textureCharacter;
        }

        // Check texture dimensions to support 64x64 skins
        if (skinTexture && skinTexture.image) {
            const h = skinTexture.image.height;
            const w = skinTexture.image.width;
            // Assuming default model is 64x32. If skin is 64x64, we need a new model instance
            if (this.model && (this.model.textureHeight !== h || this.model.textureWidth !== w)) {
                this.model = new ModelPlayer(w, h);
                // Force hand model recreation
                this.handModel = null;
            }
        }

        // Initialize hand model if missing
        if (!this.handModel && this.model) {
            this.handModel = this.model.rightArm.clone();
        }

        // Always bind the skin texture to the tessellator before calling super.rebuild.
        // This ensures the 3rd person body meshes (rebuilt in EntityRenderer) use the correct skin.
        this.tessellator.bindTexture(skinTexture);

        let firstPerson = (entity === this.worldRenderer.activeViewer) && this.worldRenderer.minecraft.settings.thirdPersonView === 0;

        // Check if inventory exists safely
        let inventoryItem = (entity.inventory && typeof entity.inventory.getItemInSelectedSlot === 'function') ? entity.inventory.getItemInSelectedSlot() : 0;
        const offhandOf = e => (e.inventory && e.inventory.offhand && e.inventory.offhand.id) || 0;
        
        // Use local itemToRender only for local player in first person
        let itemId = firstPerson ? this.worldRenderer.itemToRender : inventoryItem;
        let hasItem = itemId !== 0;

        // Render Item in Hand
        if (firstPerson) {
            super.rebuild(entity);
            this.firstPersonGroup.clear();
            this.firstPersonOffhandGroup.clear();

            // Ensure first-person hand brightness has a floor to prevent "black hand" before world light is ready
            let handBrightness = Math.max(0.4, entity.getEntityBrightness());

            // Main Hand
            if (hasItem) {
                let itemGroup = new THREE.Object3D();
                this.firstPersonGroup.add(itemGroup);
                let block = Block.getById(itemId);
                if (block) {
                    // Generate meshes at full brightness (1.0) so we can multiply them by dynamic brightness in the render loop
                    this.worldRenderer.blockRenderer.renderBlockInFirstPerson(itemGroup, block, 1.0);
                    if (itemGroup.children.length > 0) {
                        let mesh = itemGroup.children[0];
                        if (block.getRenderType() === BlockRenderType.ITEM && mesh.material) {
                            mesh.material.side = THREE.DoubleSide;
                        }
                    }
                }
            }

            // Off Hand
            let offhandId = entity.inventory.offhand.id;
            if (offhandId !== 0) {
                let offhandGroup = new THREE.Object3D();
                this.firstPersonOffhandGroup.add(offhandGroup);
                let block = Block.getById(offhandId);
                if (block) {
                    this.worldRenderer.blockRenderer.renderBlockInFirstPerson(offhandGroup, block, 1.0);
                    if (offhandGroup.children.length > 0) {
                        let mesh = offhandGroup.children[0];
                        if (block.getRenderType() === BlockRenderType.ITEM && mesh.material) {
                            mesh.material.side = THREE.DoubleSide;
                        }
                    }
                }
            }
        } else {
            super.rebuild(entity);

            // Third person (and every remote player). BlockRenderer already
            // had renderItemHand() written in bone-space for exactly this,
            // but nothing ever called it, which is why held items were
            // invisible on anyone you could actually see.
            this.rebuildHeldItems(entity, inventoryItem, offhandOf(entity));
        }

        // Render Armor (Must be after super.rebuild which clears the group)
        if (entity.inventory && typeof entity.inventory.getArmor === 'function') {
            const armorMaterials = [
                { name: "iron", idStart: 306, tex1: "../../iron_layer_1.png", tex2: "../../iron_layer_2.png" },
                { name: "diamond", idStart: 310, tex1: "../../diamond_layer_1.png", tex2: "../../diamond_layer_2.png" },
                { name: "gold", idStart: 314, tex1: "../../goldarmor.png", tex2: "../../goldarmor2.png" }
            ];

            const helmId = entity.inventory.getArmor(0).id;
            const chestId = entity.inventory.getArmor(1).id;
            const legsId = entity.inventory.getArmor(2).id;
            const bootsId = entity.inventory.getArmor(3).id;

            // Sync animation state for all models
            [this.armorModels, this.armorModels2].forEach(collection => {
                Object.values(collection).forEach(model => {
                    model.isSneaking = this.model.isSneaking;
                    model.isRiding = this.model.isRiding;
                    model.hasItemInHand = this.model.hasItemInHand;
                    model.swingProgress = this.model.swingProgress;
                });
            });

            if (!firstPerson) {
                // Iterate materials and render layers if present
                for (const mat of armorMaterials) {
                    const offset = mat.idStart;
                    // Check IDs match this material set
                    const hasHelm = helmId === offset;
                    const hasChest = chestId === offset + 1;
                    const hasLegs = legsId === offset + 2;
                    const hasBoots = bootsId === offset + 3;

                    if (hasHelm || hasChest || hasBoots) {
                        // Layer 1
                        let tex = this.worldRenderer.minecraft.getThreeTexture(mat.tex1);
                        if (tex) {
                            let model = this.armorModels[mat.name];
                            
                            tex.magFilter = THREE.NearestFilter;
                            tex.minFilter = THREE.NearestFilter;
                            this.tessellator.bindTexture(tex);
                            let prevSide = this.tessellator.material.side;
                            this.tessellator.material.side = THREE.DoubleSide;

                            // Apply polygon offset to material before rebuilding so generated meshes inherit it
                            this.tessellator.material.polygonOffset = true;
                            this.tessellator.material.polygonOffsetFactor = -1.0;
                            this.tessellator.material.polygonOffsetUnits = -1.0;

                            // Configure visibility
                            model.head.bone.visible = hasHelm;
                            model.body.bone.visible = hasChest;
                            model.rightArm.bone.visible = hasChest;
                            model.leftArm.bone.visible = hasChest;
                            model.rightLeg.bone.visible = hasBoots;
                            model.leftLeg.bone.visible = hasBoots;

                            model.rebuild(this.tessellator, this.group);
                            
                            // Reset material props
                            this.tessellator.material.polygonOffset = false;
                            this.tessellator.material.side = prevSide;
                        }
                    }

                    if (hasLegs) {
                        // Layer 2
                        let tex = this.worldRenderer.minecraft.getThreeTexture(mat.tex2);
                        if (tex) {
                            let model = this.armorModels2[mat.name];
                            
                            tex.magFilter = THREE.NearestFilter;
                            tex.minFilter = THREE.NearestFilter;
                            this.tessellator.bindTexture(tex);
                            let prevSide = this.tessellator.material.side;
                            this.tessellator.material.side = THREE.DoubleSide;

                            // Apply polygon offset
                            this.tessellator.material.polygonOffset = true;
                            this.tessellator.material.polygonOffsetFactor = -1.0;
                            this.tessellator.material.polygonOffsetUnits = -1.0;

                            model.head.bone.visible = false;
                            model.body.bone.visible = hasLegs;
                            model.rightArm.bone.visible = false;
                            model.leftArm.bone.visible = false;
                            model.rightLeg.bone.visible = hasLegs;
                            model.leftLeg.bone.visible = hasLegs;

                            model.rebuild(this.tessellator, this.group);

                            // Reset
                            this.tessellator.material.polygonOffset = false;
                            this.tessellator.material.side = prevSide;
                        }
                    }
                }
            }
        }

        // Render Nametag for Players (Must be added after super.rebuild because super clears the group)
        if (entity.constructor.name === "RemotePlayerEntity" || entity.constructor.name === "PlayerEntity") {
            this.renderNameTag(entity, entity.customName || entity.username || "Player");
        }
    }



    render(entity, partialTicks) {
        if (entity.isCameraman) { this.renderCameraman(entity, partialTicks); return; }
        this.cameramanModel.visible = false;

        let swingProgress = entity.swingProgress - entity.prevSwingProgress;
        if (swingProgress < 0.0) {
            swingProgress++;
        }
        this.model.swingProgress = entity.prevSwingProgress + swingProgress * partialTicks;
        
        // Sync swing to all armor models
        [this.armorModels, this.armorModels2].forEach(collection => {
            Object.values(collection).forEach(model => {
                model.swingProgress = this.model.swingProgress;
            });
        });
        
        // Check if inventory exists safely
        this.model.hasItemInHand = (entity.inventory && typeof entity.inventory.getItemInSelectedSlot === 'function') ? entity.inventory.getItemInSelectedSlot() !== 0 : false;
        
        // Sync item state
        [this.armorModels, this.armorModels2].forEach(collection => {
            Object.values(collection).forEach(model => {
                model.hasItemInHand = this.model.hasItemInHand;
            });
        });
        
        this.model.isSneaking = entity.sneaking;
        // Sync sneaking
        [this.armorModels, this.armorModels2].forEach(collection => {
            Object.values(collection).forEach(model => {
                model.isSneaking = entity.sneaking;
            });
        });

        this.model.isRiding = entity.isRiding ? entity.isRiding() : false;
        // Sync riding
        [this.armorModels, this.armorModels2].forEach(collection => {
            Object.values(collection).forEach(model => {
                model.isRiding = this.model.isRiding;
            });
        });

        // Invisibility logic (including Spectator mode)
        let isInvisible = (entity.activeEffects && entity.activeEffects.has("invisibility")) || (entity.gameMode === 3);
        
        // Use activeViewer to identify if we are rendering for the local player's first-person view
        let firstPerson = (entity === this.worldRenderer.activeViewer) && this.worldRenderer.minecraft.settings.thirdPersonView === 0;
        
        if (this.model && this.model.head) {
            const vis = !(isInvisible && !firstPerson);
            this.model.head.bone.visible = vis;
            this.model.body.bone.visible = vis;
            this.model.rightArm.bone.visible = vis;
            this.model.leftArm.bone.visible = vis;
            this.model.rightLeg.bone.visible = vis;
            this.model.leftLeg.bone.visible = vis;
        }

        super.render(entity, partialTicks);

        // Hide armor and held items if invisible and in 3rd person
        if (isInvisible && !firstPerson) {
            this.group.traverse(child => {
                // Identify armor meshes (they are children of group built by rebuild)
                if (child.isMesh && child !== this.group.getObjectByName("nametag")) {
                    child.visible = false;
                }
                // Also hide first person hands if they were attached
                if (child.name === "firstPersonGroup" || child.name === "firstPersonOffhandGroup") {
                    child.visible = false;
                }
            });
        }

        // Actual size of the entity (Accounting for attribute scale)
        let scale = 7.0 / 120.0;
        let scaleFactor = (1.8 + (entity.attributeScale || 0) * 0.5) / 1.8;
        this.group.scale.set(-scale * scaleFactor, -scale * scaleFactor, scale * scaleFactor);

        // Update Y position to account for scaling so feet stay grounded
        let interpolatedY = entity.prevY + (entity.y - entity.prevY) * partialTicks;
        
        // Counteract the leg animation dip (3 units in model space) to prevent hovering
        let sneakOffset = entity.sneaking ? (3.0 * (7.0 / 120.0)) : 0;
        this.group.position.setY(interpolatedY + 1.4 * scaleFactor - sneakOffset * scaleFactor);

        // Calculate synced animation parameters
        let rotationBody = this.interpolateRotation(entity.prevRenderYawOffset, entity.renderYawOffset, partialTicks);
        let rotationHead = this.interpolateRotation(entity.prevRotationYawHead, entity.rotationYawHead, partialTicks);
        let limbSwingStrength = entity.prevLimbSwingStrength + (entity.limbSwingStrength - entity.prevLimbSwingStrength) * partialTicks;
        let limbSwing = entity.limbSwingProgress - entity.limbSwingStrength * (1.0 - partialTicks);
        let yaw = rotationHead - rotationBody;
        
        // Normalize yaw to -180 to 180 to prevent snapping when wrapping around
        while (yaw < -180) yaw += 360;
        while (yaw >= 180) yaw -= 360;
        
        // Head orientation relative to the body model
        let finalYaw = yaw;
        
        // Clamp head rotation to 90 degrees left/right of body yaw
        if (finalYaw > 90) finalYaw = 90;
        if (finalYaw < -90) finalYaw = -90;
        
        let pitch = entity.prevRotationPitch + (entity.rotationPitch - entity.prevRotationPitch) * partialTicks;
        let timeAlive = entity.ticksExisted + partialTicks;

        // Force head rotation update for main model BEFORE calling super.render
        // This ensures the body and head models use the same synchronized yaw
        if (this.model) {
            this.model.setRotationAngles(this.group, limbSwing, limbSwingStrength, timeAlive, finalYaw, pitch, partialTicks);
        }

        // Update armor model bones for all materials using the same parameters
        Object.values(this.armorModels).forEach(model => {
            model.render(this.group, limbSwing, limbSwingStrength, timeAlive, finalYaw, pitch, partialTicks);
        });
        Object.values(this.armorModels2).forEach(model => {
            model.render(this.group, limbSwing, limbSwingStrength, timeAlive, finalYaw, pitch, partialTicks);
        });

        // Update first-person hand brightness to follow world lighting every frame
        if (firstPerson) {
            let handBrightness = Math.max(0.4, entity.getEntityBrightness());
            [this.firstPersonGroup, this.firstPersonOffhandGroup].forEach(g => {
                g.traverse(child => {
                    if (child.isMesh && child.material && child.material.color) {
                        child.material.color.setScalar(handBrightness);
                    }
                });
            });
        }
    }

    updateFirstPerson(player) {
        // Asset refreshes dispose the first-person meshes while the cached
        // body metadata can remain unchanged. Force a rebuild in that case
        // so the hand cannot disappear until the next view/state change.
        if (!this.handModel || !this.group.buildMeta) {
            delete this.group.buildMeta;
        }
        this.prepareModel(player);
        const pistolEquipped = player.inventory.getItemInSelectedSlot() === 568;
        if (pistolEquipped && !player.minecraft.pistolWasEquipped) player.minecraft.queuePistolAnimation("draw");
        if (!pistolEquipped && player.minecraft.pistolWasEquipped) player.minecraft.queuePistolAnimation("holster");
        player.minecraft.pistolWasEquipped = pistolEquipped;
        // updateFirstPerson runs every frame for both held-item and empty-hand
        // paths. Advance the pistol Scene clip here rather than only in
        // renderRightHand, which is skipped while an item is held.
        this.worldRenderer.blockRenderer.updatePistolAnimation(player.inventory.getItemInSelectedSlot() === 568);

        // Make the groups visible
        this.firstPersonGroup.visible = true;
        this.firstPersonOffhandGroup.visible = true;
    }

    renderRightHand(player, partialTicks) {
        if (player.isCameraman) { this.firstPersonGroup.visible=false; this.firstPersonOffhandGroup.visible=false; return; }
        this.updateFirstPerson(player);
        // Bind skin texture
        let skinKey = (player === this.worldRenderer.minecraft.player) ? this.worldRenderer.minecraft.settings.skin : player.skin;
        let skinTexture = this.worldRenderer.minecraft.getThreeTexture(skinKey);
        
        if (!skinTexture) {
            skinTexture = this.textureCharacter;
        }
        
        if (skinTexture) {
            skinTexture.magFilter = THREE.NearestFilter;
            skinTexture.minFilter = THREE.NearestFilter;
            this.tessellator.bindTexture(skinTexture);
        }

        if (this.handModel) {
            // Clear previous content (e.g. items) and rebuild hand geometry
            this.firstPersonGroup.clear();

            // Apply dynamic brightness to hand with floor to prevent black hand bug
            let brightness = Math.max(0.4, player.getEntityBrightness());
            this.tessellator.setColor(brightness, brightness, brightness);

            this.tessellator.startDrawing();
            this.handModel.rebuild(this.tessellator, this.firstPersonGroup);

            // Set transform of renderer
            this.model.swingProgress = 0;
            this.model.hasItemInHand = false;
            this.model.isSneaking = false;
            this.model.isRiding = false; // Reset riding state for first person hand
            this.model.setRotationAngles(player, 0, 0, 0, 0, 0, 0);
            
            this.handModel.copyTransformOf(this.model.rightArm);

            // Render hand model
            this.handModel.render();
        }
    }

    resetCache() {
        super.resetCache();
        // First-person meshes live outside the body group.
        disposeGroup(this.firstPersonGroup, false);
        disposeGroup(this.firstPersonOffhandGroup, false);
        this.handModel = null;
        delete this.group.buildMeta;
    }

    dispose() {
        super.dispose();
        disposeGroup(this.firstPersonGroup, false);
        disposeGroup(this.firstPersonOffhandGroup, false);
    }

    fillMeta(entity, meta) {
        super.fillMeta(entity, meta);

        // Include active viewer in metadata so cache invalidates when camera switches in splitscreen
        meta.activeViewerId = this.worldRenderer.activeViewer ? this.worldRenderer.activeViewer.id : -1;

        let firstPerson = (entity === this.worldRenderer.activeViewer) && this.worldRenderer.minecraft.settings.thirdPersonView === 0;

        meta.firstPerson = firstPerson;
        // Use setting for local player, entity field for remote
        meta.skin = (entity === this.worldRenderer.minecraft.player) ? 
                    this.worldRenderer.minecraft.settings.skin : entity.skin;
        
        // Check if inventory exists safely
        let inventoryItem = (entity.inventory && typeof entity.inventory.getItemInSelectedSlot === 'function') ? entity.inventory.getItemInSelectedSlot() : 0;
        meta.itemInHand = firstPerson ? this.worldRenderer.itemToRender : inventoryItem;
        
        if (entity.inventory) {
            meta.offhandItem = entity.inventory.offhand.id;
        }

        meta.isRiding = entity.isRiding ? entity.isRiding() : false;
        meta.isEating = (entity.itemInUse !== null);
        meta.isFishing = !!entity.fishEntity;
        meta.attributeScale = entity.attributeScale;

        // Add armor state to meta so we rebuild when armor changes
        if (entity.inventory && typeof entity.inventory.getArmor === 'function') {
            meta.armor = [
                entity.inventory.getArmor(0).id,
                entity.inventory.getArmor(1).id,
                entity.inventory.getArmor(2).id,
                entity.inventory.getArmor(3).id
            ].join(",");
        }

        // Trigger rebuild for bow animation
        if (meta.itemInHand === 261 && entity === this.worldRenderer.minecraft.player) {
            const duration = this.worldRenderer.minecraft.bowPullDuration;
            if (duration >= 16) meta.bowFrame = 3;
            else if (duration >= 8) meta.bowFrame = 2;
            else if (duration > 0) meta.bowFrame = 1;
            else meta.bowFrame = 0;
        }

        // Trigger rebuild for crossbow animation
        if (meta.itemInHand === 499 && entity === this.worldRenderer.minecraft.player) {
            const duration = this.worldRenderer.minecraft.crossbowPullDuration;
            const charged = entity.inventory.getStackInSlot(entity.inventory.selectedSlotIndex).tag?.charged;
            if (charged) meta.crossbowFrame = 4; // Fifth sprite: Arrow
            else if (duration >= 16) meta.crossbowFrame = 3;
            else if (duration >= 8) meta.crossbowFrame = 2;
            else if (duration > 0) meta.crossbowFrame = 1;
            else meta.crossbowFrame = 0;
        }
    }

}
