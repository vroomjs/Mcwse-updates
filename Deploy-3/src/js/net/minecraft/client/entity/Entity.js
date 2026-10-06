import BoundingBox from "../../util/BoundingBox.js";
import MathHelper from "../../util/MathHelper.js";

export default class Entity {

    static nextId = 0;

    constructor(minecraft, world) {
        this.minecraft = minecraft;
        this.world = world;

        this.id = Entity.nextId++;

        this.renderer = this.minecraft.worldRenderer.entityRenderManager.createEntityRendererByEntity(this);

        this.x = 0;
        this.y = 0;
        this.z = 0;

        this.motionX = 0;
        this.motionY = 0;
        this.motionZ = 0;

        this.onGround = false;
        this.sneaking = false;

        this.rotationYaw = 0;
        this.rotationPitch = 0;

        this.prevX = 0;
        this.prevY = 0;
        this.prevZ = 0;

        this.prevRotationYaw = 0;
        this.prevRotationPitch = 0;

        this.prevDistanceWalked = 0;
        this.distanceWalked = 0;
        this.nextStepDistance = 1;

        this.ticksExisted = 0;

        this.fallDistance = 0;

        this.boundingBox = new BoundingBox();

        this.isRemote = false; // Synced from server
        this.serverID = null; // ID from server
        this.targetX = 0;
        this.targetY = 0;
        this.targetZ = 0;
        this.targetYaw = 0;
        this.targetPitch = 0;

        this.ridingEntity = null;
        this.riddenByEntity = null;

        this.customName = null;
        
        // Reference to the current audio voice being played by this entity (e.g., mob sounds)
        this.activeVoice = null;

        this.wasInWater = false;
        this.unloadedTicks = 0;
    }

    getBlockPosX() {
        return MathHelper.floor(this.x);
    }

    getBlockPosY() {
        return MathHelper.floor(this.y);
    }

    getBlockPosZ() {
        return MathHelper.floor(this.z);
    }

    isInWater() {
        let id = this.world.getBlockAt(this.getBlockPosX(), this.getBlockPosY(), this.getBlockPosZ());
        return id === 9 || id === 10;
    }

    onUpdate() {
        // Perform a standard entity update every tick regardless of distance.
        // Skipping ticks at distance caused jittering because interpolation
        // start/end points would not be updated consistently.
        this.onEntityUpdate();
    }

    onEntityUpdate() {
        const inWater = this.isInWater();
        if (inWater && !this.wasInWater) {
            // Just entered water - Splash!
            const velocity = Math.sqrt(this.motionX**2 + this.motionY**2 + this.motionZ**2);
            if (velocity > 0.4) {
                this.minecraft.soundManager.playSound("random.splash_heavy", this.x, this.y, this.z, 1.0, 1.0);
            } else if (velocity > 0.05) {
                this.minecraft.soundManager.playSound("random.splash", this.x, this.y, this.z, 0.6, 1.0);
            }
        }
        this.wasInWater = inWater;

        this.prevX = this.x;
        this.prevY = this.y;
        this.prevZ = this.z;

        this.prevDistanceWalked = this.distanceWalked;

        this.prevRotationPitch = this.rotationPitch;
        this.prevRotationYaw = this.rotationYaw;

        this.ticksExisted++;
    }

    getEntityBrightness() {
        let x = MathHelper.floor(this.x);
        // Sample light at torso height (y + 0.5) instead of eye height for more consistent body lighting
        let y = MathHelper.floor(this.y + 0.5);
        let z = MathHelper.floor(this.z);
        return this.world.getLightBrightness(x, y, z);
    }

    getEyeHeight() {
        return this.boundingBox.height() * 0.8;
    }

    getYOffset() {
        return 0.0;
    }

    getMountedYOffset() {
        return this.height * 0.75;
    }

    mountEntity(entity) {
        if (this.ridingEntity) {
            if (this.ridingEntity.riddenByEntity === this) {
                this.ridingEntity.riddenByEntity = null;
            }
            this.ridingEntity = null;
            this.y += 0.5; // Dismount offset
            return;
        }

        if (entity) {
            if (entity.riddenByEntity) {
                // Already occupied
                return;
            }
            this.ridingEntity = entity;
            entity.riddenByEntity = this;
            this.setPosition(entity.x, entity.y + entity.getMountedYOffset() + this.getYOffset(), entity.z);
        }
    }

    isRiding() {
        return this.ridingEntity != null;
    }

    setPosition(x, y, z) {
        let width = this.width || 0.3;
        let height = this.height || 1.8;

        // The y parameter is for the feet. We build the hitbox up from there.
        this.boundingBox = new BoundingBox(
            x - width,
            y,
            z - width,
            x + width,
            y + height,
            z + width
        );

        // Ensure prev values are initialized for first-frame rendering to avoid origin-flicker
        if (this.ticksExisted === 0 || isNaN(this.prevX)) {
            this.prevX = x;
            this.prevY = y;
            this.prevZ = z;
        }

        this.x = x;
        this.y = y;
        this.z = z;
    }

}