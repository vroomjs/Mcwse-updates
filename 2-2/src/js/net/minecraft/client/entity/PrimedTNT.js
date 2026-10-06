import Entity from "./Entity.js";
import BoundingBox from "../../util/BoundingBox.js";
import { BlockRegistry } from "../world/block/BlockRegistry.js";

export default class PrimedTNT extends Entity {
    static name = "PrimedTNT";

    constructor(minecraft, world, x, y, z) {
        super(minecraft, world);
        this.width = 0.98;
        this.height = 0.98;
        // Standard TNT fuse is 80 ticks (4 seconds), matching the typical fuse sound duration
        this.fuse = 80; 
        this.explosionRadius = 5.0; // Slightly bigger
        
        this.setPosition(x, y, z);
        this.motionY = 0.2; // Slight upward bounce
        this.canBeCollidedWith = false; // Cannot be collided with while primed

        // Start fuse sound immediately on creation
        this.minecraft.soundManager.playSound("random.fuse", this.x, this.y, this.z, 1.0, 1.0);
    }

    setPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        let w = this.width / 2;
        this.boundingBox = new BoundingBox(x - w, y, z - w, x + w, y + this.height, z + w);
    }

    onUpdate() {
        super.onUpdate();
        this.fuse--;

        // Simple floating/gravity physics
        this.motionY -= 0.04;
        this.move(this.motionX, this.motionY, this.motionZ);
        
        this.motionX *= 0.98;
        this.motionY *= 0.98;
        this.motionZ *= 0.98;

        if (this.onGround) {
            this.motionX *= 0.7;
            this.motionZ *= 0.7;
            this.motionY = 0;
        }

        if (this.fuse <= 0) {
            this.explode();
            this.world.removeEntityById(this.id);
        }
    }
    
    move(dx, dy, dz) {
        let boundingBoxList = this.world.getCollisionBoxes(this.boundingBox.expand(dx, dy, dz));

        for (const bb of boundingBoxList) dy = bb.clipYCollide(this.boundingBox, dy);
        this.boundingBox.move(0, dy, 0);
        for (const bb of boundingBoxList) dx = bb.clipXCollide(this.boundingBox, dx);
        this.boundingBox.move(dx, 0, 0);
        for (const bb of boundingBoxList) dz = bb.clipZCollide(this.boundingBox, dz);
        this.boundingBox.move(0, 0, dz);

        this.onGround = dy !== this.motionY && this.motionY < 0;

        if (dx !== this.motionX) this.motionX = 0;
        if (dy !== this.motionY) this.motionY = 0;
        if (dz !== this.motionZ) this.motionZ = 0;

        this.x = (this.boundingBox.minX + this.boundingBox.maxX) / 2.0;
        this.y = this.boundingBox.minY;
        this.z = (this.boundingBox.minZ + this.boundingBox.maxZ) / 2.0;
    }
    
    explode() {
        const x = Math.floor(this.x);
        const y = Math.floor(this.y);
        const z = Math.floor(this.z);
        
        const explosionRSq = this.explosionRadius * this.explosionRadius;
        
        this.minecraft.soundManager.playSound("random.explode", x + 0.5, y + 0.5, z + 0.5, 4.0, (1.0 + (Math.random() - Math.random()) * 0.2) * 0.7);

        // 1. Destroy blocks (Guaranteed destruction within radius, like creeper)
        // Reduce downward depth by 1 block relative to the floor coordinate Y.
        const minDy = -Math.floor(this.explosionRadius) + 1; 

        for (let dx = -this.explosionRadius; dx <= this.explosionRadius; dx++) {
            for (let dy = minDy; dy <= this.explosionRadius; dy++) {
                for (let dz = -this.explosionRadius; dz <= this.explosionRadius; dz++) {
                    let rx = x + dx;
                    let ry = y + dy;
                    let rz = z + dz;
                    
                    let dSq = dx*dx + dy*dy + dz*dz;
                    // Introduce more noise to break the perfect sphere pattern
                    let noise = (Math.random() - 0.5) * 4.0;
                    if (dSq <= explosionRSq + noise) { 
                        let blockId = this.world.getBlockAt(rx, ry, rz);
                        if (blockId !== 0 && blockId !== BlockRegistry.BEDROCK.getId()) {
                            this.world.setBlockAt(rx, ry, rz, 0);
                        }
                    }
                }
            }
        }
        
        this.world.minecraft.worldRenderer.flushRebuild = true;

        // 2. Damage nearby entities (Players)
        const player = this.minecraft.player;
        if (player) {
            let pdx = player.x - this.x;
            let pdy = player.y + player.getEyeHeight() - this.y;
            let pdz = player.z - this.z;
            let dist = Math.sqrt(pdx*pdx + pdy*pdy + pdz*pdz);
            
            if (dist < this.explosionRadius) {
                // Calculate raw impact based on normalized distance (0=max damage, 1=min damage 0)
                let impact = (1 - dist / this.explosionRadius);
                
                // Scale damage: Max damage 60 (30 hearts).
                let maxDamage = 60; 
                let damage = Math.floor(impact * maxDamage);
                
                // Add minimum damage threshold for splash effect
                if (damage < 1 && impact > 0.05) damage = 1;

                if (damage > 0) {
                    player.takeHit(null, damage);
                }
                
                // Knockback scales down with distance
                let scale = impact;
                let strength = 1.0 * scale; // Increased strength for TNT
                
                let safeDist = dist + 0.01;
                
                player.motionX -= (pdx / safeDist) * strength;
                player.motionY += 0.4 + scale * 0.4;
                player.motionZ -= (pdz / safeDist) * strength;
            }
        }
    }
}

