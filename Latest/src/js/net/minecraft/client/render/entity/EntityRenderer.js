import Tessellator from "../Tessellator.js";
import MathHelper from "../../../util/MathHelper.js";
import * as THREE from "three";

export default class EntityRenderer {

    constructor(model) {
        this.model = model;
        this.tessellator = new Tessellator();
        this.group = new THREE.Object3D();
    }

    rebuild(entity) {
        // Create meta for group
        let meta = {};
        this.fillMeta(entity, meta);
        this.group.buildMeta = meta;

        // Dispose old entity meshes
        this.group.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            }
        });
        this.group.clear();

        // Render Nametag if applicable
        if (entity.customName) {
            this.renderNameTag(entity, entity.customName);
        }

        // Apply brightness and rebuild
        let light = (this.group.buildMeta && this.group.buildMeta.brightness !== undefined) ? this.group.buildMeta.brightness : entity.getEntityBrightness();
        
        const mc = this.minecraft || entity.minecraft;
        let globalBrightness = mc ? mc.settings.brightness : 0.5;
        const dev = mc ? mc.devTools.lighting : { gamma: 2.2 };
        
        // Match the synchronized shadow depth and brightness logic
        let brightness = Math.pow(light, dev.gamma);
        brightness = brightness + (1.0 - brightness) * globalBrightness;
        brightness = 0.1 + 0.9 * brightness;
        
        this.tessellator.setColor(brightness, brightness, brightness);
        if (this.model) {
            this.model.rebuild(this.tessellator, this.group);
        }

        // Setup Fire Mesh if entity is burning (Rendered after model to ensure it is on top)
        this.renderFireOverlay(entity);
        
        // Ensure the group is in the scene if it was somehow detached
        if (this.worldRenderer && this.worldRenderer.scene && !this.group.parent) {
            this.worldRenderer.scene.add(this.group);
        }
    }

    fillMeta(entity, meta) {
        meta.brightness = entity.getEntityBrightness();
        meta.customName = entity.customName;
        meta.isBurning = entity.remainingFireTicks > 0;
    }

    renderFireOverlay(entity) {
        let existingFire = this.group.getObjectByName("fire_overlay");
        if (existingFire) {
            this.group.remove(existingFire);
        }

        if (entity.remainingFireTicks <= 0) return;

        const texture = this.worldRenderer.minecraft.resources["../../fire_1.png"];
        if (!texture) return;

        // Calculate model-space dimensions for the fire box
        // modelScale is the base scaling factor used in render()
        const modelScale = 7.0 / 120.0;
        const scaleFactor = (1.8 + (entity.attributeScale || 0) * 0.5) / 1.8;
        
        // Entity world-space height and width
        const worldW = (entity.baseWidth || 0.4) * 2.0 * scaleFactor;
        const worldH = (entity.baseHeight || 1.8) * scaleFactor;
        
        // Convert world dimensions back to local group coordinates
        // We want a box that engulfs the model entirely
        const localW = (worldW * 1.3) / (modelScale * scaleFactor);
        const localH = (worldH * 1.1) / (modelScale * scaleFactor);

        const geometry = new THREE.BoxGeometry(localW, localH, localW);
        
        // Setup texture with scrolling animation
        const fireTex = new THREE.CanvasTexture(texture);
        fireTex.magFilter = THREE.NearestFilter;
        fireTex.minFilter = THREE.NearestFilter;
        fireTex.wrapS = THREE.RepeatWrapping;
        fireTex.wrapT = THREE.RepeatWrapping;
        
        const frameCount = Math.round(texture.height / texture.width) || 31;
        // Stretch fire vertically over the face by using a small repeat factor
        fireTex.repeat.set(1, 1.0 / frameCount);
        
        const currentFrame = Math.floor(Date.now() / 45) % frameCount;
        fireTex.offset.y = (frameCount - 1 - currentFrame) / frameCount;

        const material = new THREE.MeshBasicMaterial({
            map: fireTex,
            transparent: true,
            alphaTest: 0.05,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const fireMesh = new THREE.Mesh(geometry, material);
        fireMesh.name = "fire_overlay";
        
        // Center the fire mesh on the entity body
        // The group is offset by 1.4*SF from the feet. Torso center is roughly at 0.9*SF from feet.
        // LocalY (relative to group center) = (1.4 - 0.9) / modelScale
        const localY = 0.5 / modelScale;
        
        fireMesh.position.set(0, localY, 0);

        this.group.add(fireMesh);
    }

    renderNameTag(entity, text) {
        // Remove existing nametag if present
        let existingTag = this.group.getObjectByName("nametag");
        if (existingTag) {
            this.group.remove(existingTag);
        }

        if (!text || text.length === 0) return;

        // Use Minecraft font renderer for the nametag canvas
        const fontRenderer = this.worldRenderer.minecraft.fontRenderer;
        const textWidth = fontRenderer.getStringWidth(text);
        
        // Higher scale for crisp text on a 3D sprite
        // Shrunk by 45% (4.4 * 0.55 = ~2.4)
        const scale = 2.4; 
        const paddingX = 16;
        const paddingY = 8;
        
        let canvasWidth = textWidth * scale + paddingX * 2;
        let canvasHeight = 8 * scale + paddingY * 2;

        let canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        let ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Dark background plate (darker as requested)
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw Minecraft font text centered
        ctx.save();
        ctx.translate(paddingX, paddingY);
        ctx.scale(scale, scale);
        fontRenderer.drawString(ctx, text, 0, 0, 0xFFFFFF, true);
        ctx.restore();

        let texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        let spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            depthTest: false, // Ensure visibility through blocks
            depthWrite: false,
            transparent: true
        });

        let sprite = new THREE.Sprite(spriteMaterial);
        sprite.name = "nametag";
        sprite.renderOrder = 9999; // Ensure it renders on top of everything

        // -- Intelligent Scale & Position Logic --
        
        let parentScale = 1.0;
        let isInverted = false; // For PlayerRenderer which uses negative scale

        if (this.constructor.name === "PlayerRenderer" || this.constructor.name === "BoatRenderer") {
            // Player/Legacy models scale by approx 0.0583 (7/120)
            let base = 7.0 / 120.0;
            // Apply attribute scaling if present
            let scaleFactor = (1.8 + (entity.attributeScale || 0) * 0.5) / 1.8;
            parentScale = base * scaleFactor;
            isInverted = true;
        } else if (this.constructor.name === "GltfEntityRenderer") {
            // GLTF Renderers usually use 1.0 base
            parentScale = 1.0;
            if (entity.constructor.name === "EntityMinecart") parentScale = 0.06;
            
            // Check dynamic entity scale (e.g. Slimes, Babies)
            let s = (entity.scale !== undefined ? entity.scale : 1.0);
            if (entity.isChild) s *= 0.5;
            parentScale *= s;
        }

        if (parentScale === 0) parentScale = 1.0;

        // Target height of the nametag in world blocks (shrunk 40% from 0.275 -> 0.165)
        const TARGET_H = 0.165; 
        
        // Calculate sprite local scale
        let sy = TARGET_H / Math.abs(parentScale);
        let sx = sy * (canvasWidth / canvasHeight);

        // Adjust for inverted parent matrix
        if (isInverted) {
            sy = -Math.abs(sy);
            sx = Math.abs(sx);
        } else {
            sy = Math.abs(sy);
            sx = Math.abs(sx);
        }

        sprite.scale.set(sx, sy, 1);
        
        // Position above head
        let h = entity.height || 1.8;
        let yPadding = 0.2; 

        let worldYOffset = h + yPadding;
        
        let localY = 0;
        
        if (isInverted) {
            // PlayerRenderer calculates Y origin weirdly (feet + 1.4*SF)
            let scaleFactor = (1.8 + (entity.attributeScale || 0) * 0.5) / 1.8;
            let groupYOrigin = 1.4 * scaleFactor;
            // Calculate local Y needed to reach world height relative to group origin
            // WorldY = GroupOrigin + (LocalY * -ParentScale)
            // WorldYOffset = GroupOrigin - (LocalY * ParentScale)
            // LocalY * ParentScale = GroupOrigin - WorldYOffset
            // LocalY = (GroupOrigin - WorldYOffset) / ParentScale
            localY = (groupYOrigin - worldYOffset) / (7.0 / 120.0 * scaleFactor);
        } else {
            // Standard GLTF: Origin is feet (0,0,0)
            localY = worldYOffset / parentScale;
            // Special fix for Minecart center origin
            if (entity.constructor.name === "EntityMinecart") localY += 0.5;
        }

        sprite.position.set(0, localY, 0);
        this.group.add(sprite);
    }

    isRebuildRequired(entity) {
        if (typeof this.group.buildMeta === "undefined") {
            return true;
        }

        // Compare meta of group manually instead of JSON.stringify for performance
        let currentMeta = {};
        this.fillMeta(entity, currentMeta);
        let previousMeta = this.group.buildMeta;
        
        for (let key in currentMeta) {
            // Optimization: skip brightness and isBurning for rebuild check as they are handled in render()
            // This prevents expensive full mesh re-instantiation every frame if light changes slightly.
            if (key === "brightness" || key === "isBurning") continue;
            if (currentMeta[key] !== previousMeta[key]) {
                return true;
            }
        }
        return false;
    }

    render(entity, partialTicks) {
        this.prepareModel(entity);

        // Update Fire Animation if present
        let fireMesh = this.group.getObjectByName("fire_overlay");
        if (fireMesh && fireMesh.material.map) {
            const tex = fireMesh.material.map;
            const frameCount = 31; // fallback
            const currentFrame = Math.floor(Date.now() / 40) % frameCount;
            tex.offset.y = (frameCount - 1 - currentFrame) / frameCount;
        }

        // Dynamic Lighting Update: Apply brightness to meshes every frame
        // This fixes the bug where remote players/3rd person models stay dark after moving.
        let light = entity.getEntityBrightness();
        let mc = entity.minecraft;
        let globalBrightness = mc ? mc.settings.brightness : 0.5;
        let brightness = Math.pow(light, 1.5 - globalBrightness);
        
        // We use a floor to prevent models becoming pitch black in dark areas
        // Players/NPCs have a higher floor (0.60) to ensure they are visible to one another in multiplayer
        const isPlayer = (entity.constructor.name === "PlayerEntity" || entity.constructor.name === "RemotePlayerEntity");
        const floor = isPlayer ? 0.60 : 0.25;
        brightness = Math.max(floor, 0.1 + 0.9 * brightness);

        this.group.traverse(child => {
            if (child.isMesh && child.material && child.name !== "nametag" && child.name !== "fire_overlay") {
                if (child.material.color) {
                    if (entity.hurtTime && entity.hurtTime > 0) {
                        child.material.color.setRGB(1.0, 0.35, 0.35); // Hurt flash
                    } else if (child.material.userData && child.material.userData.baseColor !== undefined) {
                        child.material.color.setHex(child.material.userData.baseColor).multiplyScalar(brightness);
                    } else {
                        child.material.color.setScalar(brightness);
                    }
                }
            }
        });

        let rotationBody = this.interpolateRotation(entity.prevRenderYawOffset, entity.renderYawOffset, partialTicks);
        let rotationHead = this.interpolateRotation(entity.prevRotationYawHead, entity.rotationYawHead, partialTicks);

        let limbSwingStrength = entity.prevLimbSwingStrength + (entity.limbSwingStrength - entity.prevLimbSwingStrength) * partialTicks;
        let limbSwing = entity.limbSwingProgress - entity.limbSwingStrength * (1.0 - partialTicks);

        let yaw = rotationHead - rotationBody;
        // Normalize yaw to prevent snapping when crossing the 180/-180 boundary
        while (yaw < -180) yaw += 360;
        while (yaw >= 180) yaw -= 360;

        let pitch = entity.prevRotationPitch + (entity.rotationPitch - entity.prevRotationPitch) * partialTicks;

        // Interpolate entity position
        let interpolatedX = entity.prevX + (entity.x - entity.prevX) * partialTicks;
        let interpolatedY = entity.prevY + (entity.y - entity.prevY) * partialTicks;
        let interpolatedZ = entity.prevZ + (entity.z - entity.prevZ) * partialTicks;

        // Translate using interpolated position
        if (!isNaN(interpolatedX) && !isNaN(interpolatedY) && !isNaN(interpolatedZ)) {
            this.group.position.setX(interpolatedX);
            // Y handled by scaleFactor logic above
            this.group.position.setZ(interpolatedZ);
        }

        // Actual size of the entity (Accounting for attribute scale)
        // Base scale for player/mobs is approx 1.8 blocks high
        let scale = 7.0 / 120.0;
        let scaleFactor = (1.8 + (entity.attributeScale || 0) * 0.5) / 1.8;
        
        // Final scale applied to the three.js group
        this.group.scale.set(-scale * scaleFactor, -scale * scaleFactor, scale * scaleFactor);

        // Update Y position to account for scaling so feet stay grounded
        this.group.position.setY(interpolatedY + 1.4 * scaleFactor);

        // Rotate entity model
        this.group.rotation.y = MathHelper.toRadians(-rotationBody + 180);

        // Render entity model
        let timeAlive = entity.ticksExisted + partialTicks;
        let stack = entity.renderer.group;
        this.model.render(stack, limbSwing, limbSwingStrength, timeAlive, yaw, pitch, partialTicks);
    }

    interpolateRotation(prevValue, value, partialTicks) {
        let factor;
        for (factor = value - prevValue; factor < -180.0; factor += 360.0) {
        }
        while (factor >= 180.0) {
            factor -= 360.0;
        }
        return prevValue + partialTicks * factor;
    }

    dispose() {
        // Entity meshes frequently use shared atlas textures. Release
        // per-entity geometry/materials and cloned textures, but preserve
        // textures owned by Minecraft's global cache.
        const cachedTextures = new Set(
            this.worldRenderer?.minecraft?._threeTextureCache?.values?.() || []
        );

        this.group.traverse(child => {
            if (!child.isMesh && !child.isSprite) return;
            if (child.geometry) child.geometry.dispose();

            const materials = Array.isArray(child.material) ? child.material : [child.material];
            for (const material of materials) {
                if (!material) continue;
                if (material.map && !cachedTextures.has(material.map)) {
                    material.map.dispose();
                }
                material.dispose();
            }
        });
        this.group.clear();
    }

    resetCache() {
        this.dispose();
    }

    prepareModel(entity) {
        if (this.isRebuildRequired(entity)) {
            this.rebuild(entity);
        }
    }

}
