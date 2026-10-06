import EntityRenderer from "./EntityRenderer.js";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Block from "../../world/block/Block.js";
import { disposeObject } from "../../../util/dispose.js";

// Let Three.js reuse downloaded GLTF response data for mobs that share a
// model. Parsing/rendering still gets its own scene per entity.
THREE.Cache.enabled = true;

export default class GltfEntityRenderer extends EntityRenderer {

    constructor(worldRenderer) {
        super(null); // No ModelBase
        this.worldRenderer = worldRenderer;
        this.loader = new GLTFLoader();
        this.mesh = null;
        this.mixer = null;
        this.loaded = false;
        this.loading = false;
        this.disposed = false;
        this.loadGeneration = 0;
        
        this.actions = {};
        this.activeAction = null;
        this.secondaryActions = new Map(); // For overlapping animations
        this.headParts = [];
        this.lastUpdateFrame = -1;

        // Create a temporary placeholder box so we know the entity exists while loading
        let geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        let mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true });
        this.placeholder = new THREE.Mesh(geo, mat);
        this.group.add(this.placeholder);
    }

    preload(entity) {
        // Start the asynchronous model request as soon as the entity enters
        // the world instead of waiting for the next render pass.
        if (!this.loaded && !this.loading && entity?.modelName) {
            this.rebuild(entity);
        }
    }

    rebuild(entity) {
        this.disposed = false;
        // Create meta for group
        let meta = {};
        this.fillMeta(entity, meta);
        this.group.buildMeta = meta;

        // Update Nametag if present
        if (entity.customName) {
            this.renderNameTag(entity, entity.customName);
        } else {
            // Remove if no name
            let tag = this.group.getObjectByName("nametag");
            if (tag) this.group.remove(tag);
        }

        // If already loaded, just update sub-mesh visibility (Professions, Saddles, etc)
        if (this.loaded) {
            this.applyMeshMetadata(entity);
            return;
        }
        
        if (!this.loading && entity.modelName) {
            this.loading = true;
            const loadGeneration = ++this.loadGeneration;
            
            // Ensure path is safe
            let path = entity.modelName;
            // If path doesn't start with /, add it (unless it's a full URL or blob URL)
            if (!path.startsWith('http') && !path.startsWith('/') && !path.startsWith('blob:')) {
                path = "/" + path;
            }

            this.loader.load(path, (gltf) => {
                if (this.disposed || loadGeneration !== this.loadGeneration) {
                    // The entity may have despawned while its model was
                    // loading. Release the late-arriving GLTF immediately.
                    disposeObject(gltf.scene);
                    return;
                }
                // Remove placeholder
                if (this.placeholder) {
                    this.group.remove(this.placeholder);
                    this.placeholder = null;
                }

                this.mesh = gltf.scene;
                this.group.add(this.mesh);

                // Find and cache head parts to scale correctly (avoids double scaling children)
                this.headParts = [];
                this.mesh.traverse(child => {
                    const lowName = child.name ? child.name.toLowerCase() : "";
                    if (lowName.includes("head") || lowName.includes("craneo")) {
                        // Ensure we only add the highest-level "head" node in a hierarchy
                        let hasHeadAncestor = false;
                        let p = child.parent;
                        while(p && p !== this.mesh) {
                            if (p.name && (p.name.toLowerCase().includes("head") || p.name.toLowerCase().includes("craneo"))) {
                                hasHeadAncestor = true;
                                break;
                            }
                            p = p.parent;
                        }
                        if (!hasHeadAncestor) {
                            this.headParts.push(child);
                        }
                    }
                });
                
                // Center the model and fix rotation
                if (entity.constructor.name === "EntitySnowGolem") {
                    this.mesh.rotation.y = 0; // Fix Snow Golem looking backwards
                } else {
                    this.mesh.rotation.y = Math.PI; 
                }

                // Apply specific model metadata (Professions, Saddles, etc)
                this.applyMeshMetadata(entity);
                
                // Setup animations
                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.mesh);
                    
                    // Index animations
                    gltf.animations.forEach(clip => {
                        let name = clip.name.toLowerCase();
                        
                        // Register by explicit name
                        this.actions[name] = this.mixer.clipAction(clip);

                        // Standard fallbacks for generic mob logic
                        if (name.includes("walk") && !this.actions["walk"]) this.actions["walk"] = this.mixer.clipAction(clip);
                        if (name.includes("idle") && !this.actions["idle"]) this.actions["idle"] = this.mixer.clipAction(clip);
                        if ((name.includes("attack") || name.includes("hit")) && !this.actions["attack"]) this.actions["attack"] = this.mixer.clipAction(clip);
                        if ((name.includes("aim") || name.includes("shoot")) && !this.actions["aim"]) this.actions["aim"] = this.mixer.clipAction(clip);
                        if (name === "animation" && !this.actions["walk"]) this.actions["walk"] = this.mixer.clipAction(clip);
                    });

                    // If we found 'walk' but no 'idle', use 'walk' as 'idle' (handled in render for speed)
                    if (this.actions['walk'] && !this.actions['idle']) {
                        this.actions['idle'] = this.actions['walk'];
                    }
                }

                // Process materials to support Minecraft-style lighting (Basic Material + Brightness modulation)
                this.mesh.traverse((child) => {
                    if (child.isMesh && child.material) {
                        // Convert to MeshBasicMaterial to avoid needing scene lights
                        // This fixes the "black texture" issue
                        let oldMat = child.material;
                        
                        // Fix: Ensure texture encoding is correct to prevent oversaturation/darkness issues
                        // We use LinearEncoding because the renderer is Linear and we want raw texture colors
                        if (oldMat.map) {
                            oldMat.map.encoding = THREE.LinearEncoding;
                        }

                        let newMat = new THREE.MeshBasicMaterial({
                            map: oldMat.map,
                            color: 0xffffff,
                            skinning: true, // Enable skinning support
                            side: THREE.DoubleSide,
                            transparent: oldMat.transparent,
                            alphaTest: 0.5,
                            // Disable vertex colors to prevent weird tints from GLTF data
                            vertexColors: false 
                        });

                        // Special handling for Slime outer layer transparency
                        if (entity.constructor.name === "EntitySlime") {
                            const lowName = child.name ? child.name.toLowerCase() : "";
                            if (lowName.includes("outer") || lowName.includes("layer") || lowName.includes("cube") || 
                                lowName.includes("eye0") || lowName.includes("eye1") || lowName.includes("mouth")) {
                                newMat.transparent = true;
                                newMat.opacity = 0.5;
                                newMat.alphaTest = 0.05; // Lower alpha test to allow semi-transparency

                                // Apply subtle polygon offsets to separate layers and fix z-fighting
                                newMat.polygonOffset = true;
                                if (lowName.includes("eye") || lowName.includes("mouth")) {
                                    newMat.polygonOffsetFactor = -0.2; // Pull features slightly forward
                                    newMat.polygonOffsetUnits = -0.2;
                                } else if (lowName.includes("outer") || lowName.includes("layer")) {
                                    newMat.polygonOffsetFactor = -0.1; // Pull outer shell slightly forward
                                    newMat.polygonOffsetUnits = -0.1;
                                } else {
                                    newMat.polygonOffsetFactor = 0.1; // Push inner cube slightly back
                                    newMat.polygonOffsetUnits = 0.1;
                                }
                            }
                        }
                        
                        child.material = newMat;
                    }
                });

                // Custom attachment for Skeleton: Bow
                if (entity.constructor.name === "EntitySkeleton") {
                    const holdbow = this.mesh.getObjectByName("leftitem");
                    if (holdbow) {
                        const tex = this.worldRenderer.minecraft.getThreeTexture("../../bowidle.png");
                        if (tex) {
                            tex.magFilter = THREE.NearestFilter;
                            tex.minFilter = THREE.NearestFilter;
                            tex.flipY = false;
                            
                            const mat = new THREE.MeshBasicMaterial({
                                map: tex,
                                side: THREE.DoubleSide,
                                transparent: true,
                                alphaTest: 0.5,
                                color: 0xffffff
                            });
                            const geo = new THREE.PlaneGeometry(1, 1);
                            const bow = new THREE.Mesh(geo, mat);
                            
                            // Adjust scale and rotation
                            bow.scale.set(0.8, 0.8, 0.8);
                            // Orient to hold nicely in hand
                            bow.rotation.x = Math.PI;
                            bow.rotation.y = Math.PI / 2;
                            bow.rotation.z = -Math.PI / 2;
                            bow.position.set(0, 0.2, 0);

                            holdbow.add(bow);
                        }
                    }
                }

                this.loaded = true;
            }, undefined, (error) => {
                console.error("Failed to load GLTF model:", entity.modelName, error);
                this.loading = false; 
            });
        }
    }

    resetCache() {
        this.dispose();
        this.loaded = false;
        this.loading = false;
        this.actions = {};
        this.activeAction = null;
        this.mesh = null;
        this.mixer = null;
        this.secondaryActions.clear();
    }

    dispose() {
        this.disposed = true;
        this.loadGeneration++;
        if (this.mixer) this.mixer.stopAllAction();
        super.dispose();
    }



    playAnimation(name, isSecondary = false) {
        let action = this.actions[name];
        if (!action) return;

        if (isSecondary) {
            if (!this.secondaryActions.has(name)) {
                action.reset().fadeIn(0.1).play();
                action.setEffectiveWeight(1.0);
                this.secondaryActions.set(name, action);

                if (name === "head-scream" || name === "arm-hold") {
                    action.loop = THREE.LoopOnce;
                    action.clampWhenFinished = true;
                }
            }
            return;
        }

        if (this.activeAction !== action) {
            // Make "sit" transition instant as requested for cats
            const fadeTime = (name === "sit" || name === "idle" || name === "walk") ? 0.05 : 0.2;
            if (this.activeAction) this.activeAction.fadeOut(fadeTime);
            action.reset().fadeIn(fadeTime).play();

            const oneShots = ["aim", "kick", "idletap", "idlewag1", "idlewag2", "eat"];
            if (oneShots.includes(name)) {
                action.loop = THREE.LoopOnce;
                action.clampWhenFinished = true;
            } else {
                action.loop = THREE.LoopRepeat;
                action.clampWhenFinished = false;
            }
            this.activeAction = action;
        }
    }

    stopAnimation(name) {
        let action = this.actions[name];
        if (action && this.secondaryActions.has(name)) {
            action.fadeOut(0.2);
            this.secondaryActions.delete(name);
        }
    }

    applyMeshMetadata(entity) {
        if (!this.mesh) return;
        const name = entity.constructor.name;

        // Sheep Color (Apply to Fur)
        if (name === "EntitySheep") {
            const color = entity.fleeceColor || 0xFFFFFF;
            this.mesh.traverse(child => {
                if (child.isMesh && child.material && child.name && child.name.toLowerCase().endsWith("fur")) {
                    // Clone material to avoid coloring all sheep the same if material is shared (though GLTF loader usually creates unique mats per instance unless cached)
                    // Just in case, ensure we modify this instance's material color
                    if (!child.material.isClonedForSheep) {
                        child.material = child.material.clone();
                        child.material.isClonedForSheep = true;
                    }
                    child.material.color.setHex(color);
                }
            });
        }

        // 0. Handle Enderman Carried Block Attachment
        if (name === "EntityEnderman") {
            const blockHolder = this.mesh.getObjectByName("block");
            if (blockHolder) {
                // Clear previous real block attachment if exists
                const existing = blockHolder.getObjectByName("real_block_mesh");
                if (existing) blockHolder.remove(existing);

                if (entity.carriedBlockId !== 0) {
                    const block = Block.getById(entity.carriedBlockId);
                    if (block) {
                        const blockGroup = new THREE.Group();
                        blockGroup.name = "real_block_mesh";
                        // Generate a true 3D representation of the block
                        this.worldRenderer.blockRenderer.renderGuiBlock(blockGroup, block, 0, 0, 1.0, 1.0, true);
                        
                        // Center individual meshes within the group and fix rotations
                        blockGroup.traverse(c => {
                            if (c.isMesh) {
                                if (c.geometry) c.geometry.center();
                                c.rotation.set(0, 0, 0);
                                c.position.set(0, 0, 0);
                                c.material.side = THREE.DoubleSide;
                            }
                        });
                        
                        // Scale to fit Enderman's hands in model space (typically 0.5 - 0.6)
                        // Increased by 45% (0.55 * 1.45 = ~0.8)
                        blockGroup.scale.set(0.8, 0.8, 0.8);
                        blockGroup.position.y = 0.15; // Slightly more up
                        blockHolder.add(blockGroup);
                        blockGroup.visible = true;
                    }
                }
            }
        }

        // 1. Handle Villager Professions
        if (name === "EntityVillager" && entity.profession) {
            const professionToTexture = {
                "butcher": "../../butcher.png", "farmer": "../../farmer.png",
                "librarian": "../../librarian.png", "smith": "../../smith.png", "priest": "../../priest.png"
            };
            const texturePath = professionToTexture[entity.profession];
            if (texturePath) {
                const texture = this.worldRenderer.minecraft.getThreeTexture(texturePath);
                if (texture) {
                    texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter; texture.flipY = false;
                    this.mesh.traverse(child => {
                        if (child.isMesh && child.material) {
                            child.material.map = texture;
                            child.material.needsUpdate = true;
                        }
                    });
                }
            }
        }

        // 2. Handle Zombie/Husk/Drowned/Horse Skins (Unified Model)
        const mobSkins = {
            "EntityZombie": "../../zombie.png",
            "EntityHusk": "../../husk.png",
            "EntityDrowned": "../../drowned.png",
            "EntitySnowZombie": "../../zombie.png"
        };

        let mobSkinPath = mobSkins[name];
        if (name.includes("Horse") || name === "EntityDonkey" || name === "EntityMule") {
            mobSkinPath = entity.variantTexture;
        }

        if (mobSkinPath) {
            const texture = this.worldRenderer.minecraft.getThreeTexture(mobSkinPath);
            if (texture) {
                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;
                texture.flipY = false;
                this.mesh.traverse(child => {
                    if (child.isMesh && child.material) {
                        // For horses, don't overwrite materials that are likely overlays (saddles, markings) 
                        // if they don't explicitly use the base skin.
                        // However, the user specifically asked to replace the horse's base, 
                        // so we target meshes that look like body parts.
                        const lowName = child.name ? child.name.toLowerCase() : "";
                        // Refining overlay check: "marking" is often used for base patterns in horse models.
                        // Only exclude explicit high-level gear.
                        const isOverlay = lowName.includes("saddle") || lowName.includes("armor") || lowName.includes("chest") || lowName.includes("bag");
                        
                        if (!isOverlay) {
                            child.material.map = texture;
                            child.material.needsUpdate = true;
                        }
                    }
                });
            }
        }

        // 3. Handle Mobs with variable visibility parts (Pig Saddles, Sheep Wool, Snow Golem Pumpkins, Horse Gear)
        this.mesh.traverse(child => {
            if (child.name) {
                const lowName = child.name.toLowerCase();
                
                // Horses specific visibility
                if (name.includes("Horse") || name === "EntityDonkey" || name === "EntityMule") {
                    // Hide head saddle part specifically
                    if (lowName.includes("head") && lowName.includes("saddle")) {
                        child.visible = false;
                        return;
                    }

                    // Hide bags, mule ears, and other unwanted attachments unless it's a donkey/mule
                    if (lowName.includes("bag") || lowName.includes("chest")) {
                        child.visible = false;
                        return;
                    }

                    if (lowName.includes("mule") || lowName.includes("ear")) {
                        const isLongEared = (name === "EntityDonkey" || name === "EntityMule");
                        // Only hide "mule" specific nodes for non-donkeys/mules.
                        // General "ear" nodes should remain visible for all horse types.
                        if (lowName.includes("mule")) {
                            child.visible = isLongEared;
                        } else {
                            child.visible = true;
                        }
                        return;
                    }

                    if (lowName.includes("bag") || lowName.includes("chest")) {
                        child.visible = !!entity.hasChest;
                        return;
                    }

                    // Saddle visibility based on entity state
                    if (lowName.includes("saddle")) {
                        child.visible = !!entity.isSaddled;
                        return;
                    }
                }

                // Pigs
                if (lowName.includes("saddle")) {
                    child.visible = (name === "EntitySaddledPig" || (name === "EntityHorse" && entity.isSaddled));
                }
                // Sheep
                if (lowName.endsWith("fur")) {
                    child.visible = !entity.sheared;
                }
                // Snow Golem
                if (lowName.includes("pumpkin")) {
                    child.visible = !entity.sheared;
                }

                // Enderman: hide the model's built-in block meshes but allow our dynamic one
                if (lowName === "block") {
                    child.traverse(sub => {
                        if (sub !== child && sub.isMesh) {
                            // Only hide if it's not part of the 'real_block_mesh' group we added
                            let isRealBlock = false;
                            let p = sub;
                            while (p && p !== child) {
                                if (p.name === "real_block_mesh") {
                                    isRealBlock = true;
                                    break;
                                }
                                p = p.parent;
                            }
                            if (!isRealBlock) {
                                sub.visible = false;
                            }
                        }
                    });
                }
            }
        });
    }

    fillMeta(entity, meta) {
        meta.brightness = entity.getEntityBrightness();
        meta.profession = entity.profession;
        meta.isSaddled = (entity.constructor.name === "EntitySaddledPig");
        meta.deathTime = entity.deathTime > 0;
        meta.isChild = entity.isChild;
        meta.sheared = entity.sheared;
        meta.isSaddled = entity.isSaddled;
        meta.carriedBlockId = entity.carriedBlockId;
        meta.isScreaming = entity.isScreaming;
        meta.variantTexture = entity.variantTexture;
        // meta.fleeceColor = entity.fleeceColor; // Removed to prevent rebuild loops on jeb_ sheep
        meta.customName = entity.customName; // Track custom name for rebuilds
        
        // Track the actual image resource to detect resource pack updates
        if (entity.variantTexture) {
            meta.textureRef = this.worldRenderer.minecraft.resources[entity.variantTexture];
        }
    }

    render(entity, partialTicks) {
        if (this.isRebuildRequired(entity)) {
            this.rebuild(entity);
        }

        // Interpolate position using standard Minecraft partialTicks logic
        let interpolatedX = entity.prevX + (entity.x - entity.prevX) * partialTicks;
        let interpolatedY = entity.prevY + (entity.y - entity.prevY) * partialTicks;
        let interpolatedZ = entity.prevZ + (entity.z - entity.prevZ) * partialTicks;

        // Ensure rotation is also interpolated correctly to prevent jittery turning
        let rotationBody = this.interpolateRotation(entity.prevRenderYawOffset, entity.renderYawOffset, partialTicks);
        
        if (!isNaN(interpolatedX) && !isNaN(interpolatedY) && !isNaN(interpolatedZ)) {
            this.group.position.set(interpolatedX, interpolatedY, interpolatedZ);
        }

        // Interpolate rotation
        let bodyYaw = rotationBody;
        if (entity.constructor.name === "EntityMinecart") {
            bodyYaw = this.interpolateRotation(entity.prevRotationYaw, entity.rotationYaw, partialTicks);
        }
        let yawRad = -(bodyYaw * Math.PI / 180);
        if (entity.constructor.name === "EntityMinecart") yawRad -= Math.PI / 2;
        this.group.rotation.y = yawRad;

        if (entity.constructor.name === "EntityShark") {
            const pitch = this.interpolateRotation(entity.prevRotationPitch || 0, entity.rotationPitch || 0, partialTicks);
            this.group.rotation.x = pitch * Math.PI / 180;
        } else {
            this.group.rotation.x = 0;
        }

        if (!this.loaded) {
            if (this.placeholder) {
                // Ensure placeholder is centered and visible
                this.placeholder.position.set(0, 0.9, 0);
            }
            return;
        }

        // Apply Scale
        // Minecraft models are tiny, GLTFs are often meters.
        // If it's a Minecart, use a specific scaling factor to match the world.
        let isMinecart = entity.constructor.name === "EntityMinecart";
        let baseScale = isMinecart ? 0.06 : 1.0;
        
        // Support non-uniform scaling (for squish effects)
        let sx = (entity.scaleX || entity.scale || 1.0) * baseScale;
        let sy = (entity.scaleY || entity.scale || 1.0) * baseScale;
        let sz = (entity.scaleZ || entity.scale || 1.0) * baseScale;
        
        if (entity.isChild) {
            sx *= 0.5; sy *= 0.5; sz *= 0.5;
        }

        // Tiny: 50% scale (adults only)
        if (entity.customName === "tiny" && !entity.isChild) {
            sx *= 0.5; sy *= 0.5; sz *= 0.5;
        }

        this.group.scale.set(sx, sy, sz);

        // Animation Handler logic
        if (this.mixer) {
            let animName = 'idle';
            if (typeof entity.getAnimationName === 'function') {
                animName = entity.getAnimationName();
            }

            this.playAnimation(animName);

            if (this.activeAction) {
                if (animName === 'walk') {
                    let velocity = Math.sqrt(entity.motionX * entity.motionX + entity.motionZ * entity.motionZ);
                    this.activeAction.timeScale = Math.max(0.8, Math.min(2.5, velocity * 12.0));
                } else {
                    if (animName === 'idle' && this.actions['idle'] === this.actions['walk']) {
                        this.activeAction.timeScale = 0.15;
                    } else {
                        this.activeAction.timeScale = 1.0;
                    }
                }
            }

            // Only update the mixer once per frame to prevent double-speed animations in splitscreen
            const currentFrame = this.worldRenderer.minecraft.frames;
            if (this.lastUpdateFrame !== currentFrame) {
                this.mixer.update(this.worldRenderer.animationDelta || 0.025);
                this.lastUpdateFrame = currentFrame;
            }
        }

        // Force head scaling for babies after animation mixer update
        if (this.mesh) {
            // If body is 0.5x scale, headScale 1.62 makes it 0.81x absolute size (approx 10% smaller than previous 0.9)
            const headScale = entity.isChild ? 1.62 : 1.0;
            for (let part of this.headParts) {
                part.scale.set(headScale, headScale, headScale);
            }
        }

        // Offset Y for Minecart as its origin might be at center
        if (entity.constructor.name === "EntityMinecart") {
            this.group.position.y += 0.05;
        }

        // Invisibility
        if (entity.activeEffects && entity.activeEffects.has("invisibility")) {
            this.group.visible = false;
        }

        // Apply Entity Brightness (Fake Lighting)
        let light = entity.getEntityBrightness(); // 0..1
        let mc = this.worldRenderer.minecraft;
        let globalBrightness = mc.settings.brightness;
        const dev = mc.devTools.lighting;
        
        // Match the synchronized shadow depth and brightness logic
        let brightness = Math.pow(light, dev.gamma);
        brightness = brightness + (1.0 - brightness) * globalBrightness;
        
        // We use a floor to prevent models becoming pitch black in dark areas
        // Players/NPCs have a higher floor (0.60) to ensure they are visible to one another in multiplayer
        const isPlayer = (entity.constructor.name === "PlayerEntity" || entity.constructor.name === "RemotePlayerEntity");
        const floor = isPlayer ? 0.60 : 0.25;
        brightness = Math.max(floor, brightness);

        if (this.mesh) {
            this.mesh.position.set(
                entity.modelOffsetX || 0,
                entity.modelOffsetY || 0,
                entity.modelOffsetZ || 0
            );

            // Apply death rotation (tip over to 90 degrees)
            // We rotate the mesh inside the group, around Z axis (roll)
            if (entity.deathTime > 0) {
                let dt = entity.deathTime + partialTicks;
                if (dt > 20) dt = 20;
                let rot = (dt / 20.0) * 90.0; 
                this.mesh.rotation.z = rot * (Math.PI / 180);
            } else {
                this.mesh.rotation.z = 0;
            }

            this.mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    // If entity is hurt, tint red
                    if (entity.hurtTime && entity.hurtTime > 0) {
                        child.material.color.setRGB(1.0, 0.35, 0.35);
                    } else {
                        // For sheep fur, mix brightness with fleece color
                        // Broadened check to apply to body/coat if "fur" is missing, excluding head/limbs
                        if (entity.constructor.name === "EntitySheep" && entity.fleeceColor) {
                            const n = child.name ? child.name.toLowerCase() : "";
                            const isFur = n.includes("fur") || n.includes("wool") || n.includes("coat") || 
                                         (!n.includes("head") && !n.includes("leg") && !n.includes("face") && !n.includes("eye"));
                            
                            if (isFur) {
                                const col = entity.fleeceColor;
                                const r = ((col >> 16) & 255) / 255.0;
                                const g = ((col >> 8) & 255) / 255.0;
                                const b = (col & 255) / 255.0;
                                child.material.color.setRGB(r * brightness, g * brightness, b * brightness);
                            } else {
                                child.material.color.setScalar(brightness);
                            }
                        } else {
                            child.material.color.setScalar(brightness);
                        }
                    }
                }
            });
        }
    }
}
