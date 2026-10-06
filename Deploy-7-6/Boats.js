import Entity from "./src/js/net/minecraft/client/entity/Entity.js";
import ModelBase from "./src/js/net/minecraft/client/render/model/ModelBase.js";
import ModelRenderer from "./src/js/net/minecraft/client/render/model/renderer/ModelRenderer.js";
import EntityRenderer from "./src/js/net/minecraft/client/render/entity/EntityRenderer.js";
import BlockItem from "./src/js/net/minecraft/client/world/block/type/BlockItem.js";
import BoundingBox from "./src/js/net/minecraft/util/BoundingBox.js";
import MathHelper from "./src/js/net/minecraft/util/MathHelper.js";
import * as THREE from "three";
import DroppedItem from "./src/js/net/minecraft/client/entity/DroppedItem.js";
import PlayerEntity from "./src/js/net/minecraft/client/entity/PlayerEntity.js";

export class EntityBoat extends Entity {
    static name = "EntityBoat";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.preventEntitySpawning = true;
        this.width = 1.375;
        this.height = 0.6;
        this.yOffset = 0.0;
        this.woodType = 0; // 0=Oak, 1=Birch, 2=Spruce
        
        this.setPosition(this.x, this.y, this.z);
        
        this.motionX = 0.0;
        this.motionY = 0.0;
        this.motionZ = 0.0;
        
        this.rotationYaw = 0;
        this.deltaRotation = 0;
        this.speedMultiplier = 0.07;
        
        this.timeSinceHit = 0;
        this.damageTaken = 0;
    }

    setPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        let w = this.width / 2;
        this.boundingBox = new BoundingBox(x - w, y, z - w, x + w, y + this.height, z + w);
    }
    
    canBeCollidedWith() { return true; }
    
    getShadowSize() { return 0.8; }

    getMountedYOffset() {
        // Lower player into boat seat
        return -0.2;
    }

    onUpdate() {
        // Ensure prevX/Y/Z are updated before we modify current coordinates
        super.onUpdate();

        if (this.isRemote) {
            // Interpolate position
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

        if (this.timeSinceHit > 0) {
            this.timeSinceHit--;
        }
        if (this.damageTaken > 0) {
            this.damageTaken -= 1;
        }

        // Water check
        let waterLevel = -100;
        let inWater = false;
        
        let bb = this.boundingBox.expand(0, 0.0, 0);
        let minX = Math.floor(bb.minX);
        let maxX = Math.ceil(bb.maxX);
        let minY = Math.floor(bb.minY);
        let maxY = Math.ceil(bb.maxY + 0.1); // Check slightly higher
        let minZ = Math.floor(bb.minZ);
        let maxZ = Math.ceil(bb.maxZ);

        for (let x = minX; x < maxX; x++) {
            for (let y = minY; y < maxY; y++) {
                for (let z = minZ; z < maxZ; z++) {
                    let id = this.world.getBlockAt(x, y, z);
                    if (id === 9 || id === 8) { // Water
                        inWater = true;
                        // Find top of water
                        let top = y + 1.0;
                        // If block above is not water, accurate level is slightly less than 1.0 usually, but 1.0 works for now
                        if (top > waterLevel) {
                            waterLevel = top;
                            // Check metadata for exact height if needed, but full block assumption is okay
                        }
                    }
                }
            }
        }

        // Passenger Logic
        if (this.riddenByEntity) {
            let passenger = this.riddenByEntity;
            
            // Read inputs
            let forward = 0;
            let turn = 0;
            
            // Check if passenger has movement properties (PlayerEntity)
            if (passenger.moveForward !== undefined && passenger.moveStrafing !== undefined) {
                forward = passenger.moveForward;
                turn = passenger.moveStrafing;
            }
            
            // Steer
            if (turn !== 0) {
                this.rotationYaw -= turn * 4.0;
            }
            
            // Accelerate
            // Limit speed if not in water (ground/air)
            let currentSpeed = this.speedMultiplier;
            let currentFriction = 0.9;

            if (!inWater) {
                let onIce = false;
                let idBelow = this.world.getBlockAt(Math.floor(this.x), Math.floor(this.y - 0.1), Math.floor(this.z));
                if (idBelow === 79 || idBelow === 174) onIce = true;

                if (onIce) {
                    currentSpeed = 0.18; // Very fast on ice
                    currentFriction = 0.99; // Low drag on ice
                } else if (this.onGround) {
                    currentSpeed = 0.02; // Slow land speed
                    currentFriction = 0.5;
                } else {
                    currentSpeed = 0.0; // No control in air
                    currentFriction = 0.99;
                }
            }

            if (forward > 0) {
                let yawRad = this.rotationYaw * Math.PI / 180;
                this.motionX += -Math.sin(yawRad) * currentSpeed;
                this.motionZ += Math.cos(yawRad) * currentSpeed;
            } else if (forward < 0) {
                let yawRad = this.rotationYaw * Math.PI / 180;
                this.motionX -= -Math.sin(yawRad) * currentSpeed * 0.3; // Slower backwards
                this.motionZ -= Math.cos(yawRad) * currentSpeed * 0.3;
            }

            // Apply specific friction
            this.motionX *= currentFriction;
            this.motionZ *= currentFriction;
        } else {
            // Collect nearby mobs into boat
            this.collectNearbyEntities();
        }

        // Gravity
        if (!inWater && !this.onGround) {
            this.motionY -= 0.04;
        }
        
        // Improved Buoyancy Logic
        if (inWater) {
            // Desired height: submerged by about 0.2
            let targetY = waterLevel - 0.2;
            let currentY = this.y;
            
            // Difference
            let diff = targetY - currentY;
            
            // If we are far below, float up fast
            if (diff > 1.0) {
                this.motionY = 0.1;
            } else {
                // Spring force: Proportional to distance
                // Damping: Proportional to velocity
                
                // Tuning values
                const spring = 0.05; // Reduced from 0.1 to reduce oscillation
                const damping = 0.9; // Increased from 0.8 to stabilize (more friction)
                
                this.motionY += diff * spring;
                this.motionY *= damping;
                
                // Cap slight oscillation (deadzone)
                if (Math.abs(this.motionY) < 0.01 && Math.abs(diff) < 0.1) {
                    this.motionY = 0;
                    // Snap or very slow drift to target
                    this.y += diff * 0.1;
                }
            }

            // Water drag (Only if not ridden, handled in passenger logic otherwise)
            if (!this.riddenByEntity) {
                this.motionX *= 0.9;
                this.motionZ *= 0.9;
            }
        } else if (this.onGround) {
            // Ground friction
            this.motionX *= 0.5;
            this.motionZ *= 0.5;
            this.motionY = 0;
        } else {
            // Air drag
            this.motionX *= 0.99;
            this.motionZ *= 0.99;
        }

        this.x += this.motionX;
        this.y += this.motionY;
        this.z += this.motionZ;
        
        // Basic Collision
        let boxes = this.world.getCollisionBoxes(this.boundingBox);
        if (boxes.length > 0) {
            // Push out
            this.y += 0.01; // Just nudge up to avoid getting stuck in floor
            this.onGround = true;
            // Kill downward momentum if hitting floor
            if (this.motionY < 0) this.motionY = 0;
        } else {
            this.onGround = false;
        }

        this.setPosition(this.x, this.y, this.z);
    }
    
    takeHit(attacker, damage) {
        if (this.isDead) return;
        
        this.timeSinceHit = 10;
        this.damageTaken += damage * 10;
        
        // Rock the boat
        // TODO: Add rocking animation variable

        if (this.damageTaken > 40) {
            // Break boat
            this.kill();
            
            // Drop boat item (ID 333)
            let drop = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, 333, 1);
            this.world.droppedItems.push(drop);
        }
    }
    
    kill() {
        if (this.riddenByEntity) {
            this.riddenByEntity.mountEntity(null);
        }
        this.world.removeEntityById(this.id);
    }

    interact(player) {
        if (this.riddenByEntity) {
            this.riddenByEntity.mountEntity(null);
            return true;
        }
        
        // Mount/Dismount
        player.mountEntity(this);
        return true;
    }

    collectNearbyEntities() {
        if (this.riddenByEntity) return;
        
        const world = this.world;
        const radius = 1.2;
        for (let entity of world.entities) {
            // Mobs can be placed in boats
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
}

export class BoatModel extends ModelBase {
    constructor() {
        super();
        this.boatSides = [];
        
        // Use 64x64 texture dimensions as the BoatRenderer generates a 64x64 tiled plank texture
        const w = 64; 
        const h = 64; 
        
        // Dimensions based on standard MC Boat
        // Bottom: 24 long, 10 wide (approx), height 3?
        // Sides: length 24, height 6
        // Front/Back: width ~12?
        
        // 0: Bottom (Plane/Box)
        // Texture Offset: 0, 0 -> 0, 0 (Bottom has large area)
        // Box: x=-14, y=-5, z=-2 (flat) ... size 28, 16, 4 ?
        // Let's try to approximate the shape from the image provided previously
        
        // Bottom
        this.boatSides[0] = new ModelRenderer("bottom", w, h).setTextureOffset(0, 0).addBox(-14, -9, -3, 28, 16, 3, 0.0);
        this.boatSides[0].setRotationPoint(0, 3, 1); 
        this.boatSides[0].rotateAngleX = Math.PI / 2;
        
        // 1: Back
        this.boatSides[1] = new ModelRenderer("back", w, h).setTextureOffset(0, 19).addBox(-13, -7, -1, 18, 6, 2, 0.0);
        this.boatSides[1].setRotationPoint(-15, 4, 4);
        this.boatSides[1].rotateAngleY = Math.PI * 1.5;

        // 2: Front
        this.boatSides[2] = new ModelRenderer("front", w, h).setTextureOffset(0, 27).addBox(-8, -7, -1, 16, 6, 2, 0.0);
        this.boatSides[2].setRotationPoint(15, 4, 0);
        this.boatSides[2].rotateAngleY = Math.PI * 0.5;

        // 3: Right (Outer)
        this.boatSides[3] = new ModelRenderer("right", w, h).setTextureOffset(0, 35).addBox(-14, -7, -1, 28, 6, 2, 0.0);
        this.boatSides[3].setRotationPoint(0, 4, -9);
        this.boatSides[3].rotateAngleY = Math.PI;

        // 4: Left (Outer)
        this.boatSides[4] = new ModelRenderer("left", w, h).setTextureOffset(0, 43).addBox(-14, -7, -1, 28, 6, 2, 0.0);
        this.boatSides[4].setRotationPoint(0, 4, 9);
    }

    rebuild(tessellator, group) {
        super.rebuild(tessellator, group);
        for (let i = 0; i < 5; i++) {
            this.boatSides[i].rebuild(tessellator, group);
        }
    }

    render(stack, limbSwing, limbSwingStrength, timeAlive, yaw, pitch, partialTicks) {
        for (let i = 0; i < 5; i++) {
            this.boatSides[i].render();
        }
    }
}

export class BoatRenderer extends EntityRenderer {
    constructor(worldRenderer) {
        super(new BoatModel());
        this.worldRenderer = worldRenderer;
        this.boatTextures = [];
    }

    fillMeta(entity, meta) {
        super.fillMeta(entity, meta);
        meta.woodType = entity.woodType;
        
        // Track the resolution of the source image to detect when it replaces a placeholder
        let sourceImage = null;
        const woodType = entity.woodType || 0;
        if (woodType === 0) sourceImage = this.worldRenderer.minecraft.resources["../../blocks.png"];
        else if (woodType === 1 || woodType === 2) sourceImage = this.worldRenderer.minecraft.resources["../../treestuff.png"];
        else if (woodType === 3 || woodType === 4) sourceImage = this.worldRenderer.minecraft.resources["../../treestuff.png"];
        
        meta.sourceWidth = sourceImage ? sourceImage.width : 0;
    }

    resetCache() {
        this.boatTextures = [];
    }
    
    rebuild(entity) {
        const woodType = entity.woodType || 0;
        
        // Generate plank texture from terrain atlas if needed
        // Force regeneration if source image was a placeholder (width=1)
        if (!this.boatTextures[woodType] || (this.boatTextures[woodType].image && this.boatTextures[woodType].image.width === 1)) {
            let sourceImage = null;
            // Wood Types: 0=Oak, 1=Birch, 2=Spruce, 3=Dark Oak, 4=Acacia
            if (woodType === 0) sourceImage = this.worldRenderer.minecraft.resources["../../blocks.png"];
            else if (woodType === 1 || woodType === 2) sourceImage = this.worldRenderer.minecraft.resources["../../treestuff.png"];
            else if (woodType === 3 || woodType === 4) sourceImage = this.worldRenderer.minecraft.resources["../../treestuff.png"];

            if (sourceImage && sourceImage.width > 1) {
                const canvas = document.createElement('canvas');
                // Use 64x64 to allow better tiling detail if the source is high res
                canvas.width = 64;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                
                if (woodType === 0) {
                    // Oak Planks from blocks.png atlas (Index 8)
                    const index = 8;
                    const sx = (index % 14) * 16;
                    const sy = Math.floor(index / 14) * 16;
                    // Tile it 4x4 to fill the 64x64 area
                    for (let tx = 0; tx < 4; tx++) {
                        for (let ty = 0; ty < 4; ty++) {
                            ctx.drawImage(sourceImage, sx, sy, 16, 16, tx * 16, ty * 16, 16, 16);
                        }
                    }
                } else if (woodType === 3 || woodType === 4) {
                    // Dark Oak (29) or Acacia (24) from treestuff.png
                    const index = woodType === 3 ? 29 : 24;
                    const cols = 30;
                    const sw = Math.floor(sourceImage.width / cols);
                    const sh = sourceImage.height;
                    const sx = (index % cols) * sw;
                    const sy = Math.floor(index / cols) * sh;
                    for (let tx = 0; tx < 64; tx += sw) {
                        for (let ty = 0; ty < 64; ty += sh) {
                            ctx.drawImage(sourceImage, sx, sy, sw, sh, tx, ty, sw, sh);
                        }
                    }
                } else {
                    // Birch or spruce planks from the shared tree atlas.
                    const index = woodType === 1 ? 19 : 14;
                    const cols = 30;
                    const sw = Math.floor(sourceImage.width / cols);
                    const sh = sourceImage.height;
                    const sx = index * sw;
                    for (let tx = 0; tx < canvas.width; tx += sw) {
                        for (let ty = 0; ty < canvas.height; ty += sh) {
                            ctx.drawImage(sourceImage, sx, 0, sw, sh, tx, ty, sw, sh);
                        }
                    }
                }
                
                let tex = new THREE.CanvasTexture(canvas);
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.flipY = false; // Sync with ModelRenderer manual flip
                this.boatTextures[woodType] = tex;
            }
        }

        if (this.boatTextures[woodType]) {
            this.tessellator.bindTexture(this.boatTextures[woodType]);
        } else {
            let fallback = this.worldRenderer.minecraft.getThreeTexture("char.png");
            if (fallback) this.tessellator.bindTexture(fallback);
        }

        this.group.clear();
        let meta = {};
        this.fillMeta(entity, meta);
        this.group.buildMeta = meta;
        
        let brightness = entity.getEntityBrightness();
        this.tessellator.setColor(brightness, brightness, brightness);
        this.model.rebuild(this.tessellator, this.group);
    }

    render(entity, partialTicks) {
        // Ensure model is built
        if (this.isRebuildRequired(entity)) {
            this.rebuild(entity);
        }

        // Interpolate position
        let x = entity.prevX + (entity.x - entity.prevX) * partialTicks;
        let y = entity.prevY + (entity.y - entity.prevY) * partialTicks;
        let z = entity.prevZ + (entity.z - entity.prevZ) * partialTicks;

        // Interpolate rotation
        let prevYaw = entity.prevRotationYaw;
        let yaw = entity.rotationYaw;
        // Smooth rotation interpolation
        let interpYaw = prevYaw + (yaw - prevYaw) * partialTicks;

        // Position
        // Lower slightly to sit in water (Boat height is 0.6, center around 0.3)
        this.group.position.set(x, y + 0.5, z); 

        // Rotation
        // Standard entity yaw is clockwise degrees.
        // THREE rotation Y is counter-clockwise radians.
        // Adjust by 90 degrees to align model front with movement?
        // Model front is +X in design above? No, usually +Z or -Z.
        // Based on model: Front is at x=15. So Front is +X.
        // If Yaw 0 = South (+Z), and model faces +X, we need -90 deg rotation.
        
        this.group.rotation.order = 'ZYX';
        this.group.rotation.y = MathHelper.toRadians(180 - interpYaw - 90); 
        this.group.rotation.x = 0;
        this.group.rotation.z = 0;

        // Scale
        let scale = 7.0 / 120.0;
        this.group.scale.set(-scale, -scale, scale);

        // Render model
        let timeAlive = entity.ticksExisted + partialTicks;
        this.model.render(this.group, 0, 0, timeAlive, 0, 0, partialTicks);
    }
}

export class BlockBoatItem extends BlockItem {
    constructor(id, woodType, icon, textureIndex = 0) {
        super(id, icon, textureIndex); 
        this.woodType = woodType;
        this.setMaxStackSize(1);
    }
    
    onItemUse(world, x, y, z, face, player) {
        // Spawn boat centered on the block clicked
        let boat = new EntityBoat(world.minecraft, world);
        boat.woodType = this.woodType;
        boat.setPosition(x + 0.5, y + 1.2, z + 0.5);
        boat.rotationYaw = player.rotationYaw - 90;
        
        world.addEntity(boat);
        
        // Play wood sound for boat placement
        world.minecraft.soundManager.playSound("step.wood", x + 0.5, y + 1.0, z + 0.5, 1.0, 1.0);

        // Consume item is handled by Minecraft.js because we return true
        
        return true;
    }
}

  
