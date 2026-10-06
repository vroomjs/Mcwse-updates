import EntityLiving from "./EntityLiving.js";
import BoundingBox from "../../util/BoundingBox.js";

export default class RemotePlayerEntity extends EntityLiving {
    
    static name = "RemotePlayerEntity";

    constructor(minecraft, world, skin) {
        super(minecraft, world);
        
        this.skin = skin; // Custom skin texture path or object
        this.width = 0.8;
        this.height = 2.0;
        this.stepHeight = 0.0; // Remote players don't step locally
        this.ignoreFrustumCheck = false;

        this.attributeScale = 0;
        
        // Breaking progress for animation sync
        this.currentBreakingPos = null;
        this.breakingProgress = 0;

        // Target positions for interpolation
        this.targetX = 0;
        this.targetY = 0;
        this.targetZ = 0;
        this.targetYaw = 0;
        this.targetPitch = 0;
        
        // Initialize bounding box
        this.setPosition(0, 0, 0);
    }

    setPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        // Prevent interpolation glitch on spawn
        this.prevX = x;
        this.prevY = y;
        this.prevZ = z;
        this.targetX = x;
        this.targetY = y;
        this.targetZ = z;

        let w = this.width / 2;
        this.boundingBox = new BoundingBox(x - w, y, z - w, x + w, y + this.height, z + w);
    }

    onUpdate() {
        // Save previous position/rotation (Entity.onEntityUpdate)
        // and run EntityLiving logic (which calls onLivingUpdate)
        super.onUpdate();
        
        // Teleport if distance is too far (lag spike or teleport)
        const distSq = (this.targetX - this.x)**2 + (this.targetY - this.y)**2 + (this.targetZ - this.z)**2;
        if (distSq > 36) { // > 6 blocks
            this.x = this.targetX;
            this.y = this.targetY;
            this.z = this.targetZ;
        } else {
            // Interpolate position towards network target.
            // Increased factor for snappier response to prevent "diagonal sliding" feel
            let factor = 0.6;
            this.x += (this.targetX - this.x) * factor;
            this.y += (this.targetY - this.y) * factor;
            this.z += (this.targetZ - this.z) * factor;
        }
        
        // Interpolate rotation smoothly
        let yawDiff = this.targetYaw - this.rotationYaw;
        while (yawDiff < -180) yawDiff += 360;
        while (yawDiff >= 180) yawDiff -= 360;
        
        this.rotationYaw += yawDiff * 0.3;
        this.rotationPitch += (this.targetPitch - this.rotationPitch) * 0.3;

        // Update head rotation to match new yaw (fixes head direction lag)
        this.rotationYawHead = this.rotationYaw;

        // Re-calculate body rotation and limb swing now that position is updated
        this.updateBodyRotation(); 
        
        // Manual limb swing calculation based on actual movement
        let dx = this.x - this.prevX;
        let dz = this.z - this.prevZ;
        let distance = Math.sqrt(dx * dx + dz * dz) * 4.0;
        
        if (distance > 1.0) distance = 1.0;
        
        this.prevLimbSwingStrength = this.limbSwingStrength;
        this.limbSwingStrength += (distance - this.limbSwingStrength) * 0.4;
        this.limbSwingProgress += this.limbSwingStrength;
        
        // Update bounding box to match new position
        let w = this.width / 2;
        this.boundingBox = new BoundingBox(this.x - w, this.y, this.z - w, this.x + w, this.y + this.height, this.z + w);
    }

    // Override to prevent local physics/movement logic from EntityLiving
    onLivingUpdate() {
        // No physics for remote player
        
        // Ensure head rotation matches look direction (fixes head rendering position)
        this.rotationYawHead = this.rotationYaw;
    }

    updateFromPresence(presence) {
        if (presence.x !== undefined) this.targetX = presence.x;
        if (presence.y !== undefined) this.targetY = presence.y;
        if (presence.z !== undefined) this.targetZ = presence.z;
        if (presence.yaw !== undefined) this.targetYaw = presence.yaw;
        if (presence.pitch !== undefined) this.targetPitch = presence.pitch;
        if (presence.sneaking !== undefined) this.sneaking = presence.sneaking;
        if (presence.attributeScale !== undefined) {
            if (this.attributeScale !== presence.attributeScale) {
                this.attributeScale = presence.attributeScale;
                this.setPosition(this.x, this.y, this.z); // Refresh hitbox scaling
            }
        }
        
        // If skin changes dynamically
        if (presence.skin && presence.skin !== this.skin) {
            this.skin = presence.skin;
        }
    }
    
    getEyeHeight() {
        return 1.62;
    }

    takeHit(fromEntity, damage) {
        // PvP Disabled
        return false;
    }
}


