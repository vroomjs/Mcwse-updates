import Entity from "./Entity.js";
import BoundingBox from "../../util/BoundingBox.js";
import Vector3 from "../../util/Vector3.js";

export default class EntityEnderPearl extends Entity {
    static name = "EntityEnderPearl";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.setSize(0.25, 0.25);
        this.maxAge = 1200; 
        this.owner = null;
        this.ticksInAir = 0;
    }

    setSize(w, h) {
        this.width = w;
        this.height = h;
        this.boundingBox = new BoundingBox(this.x - w/2, this.y, this.z - w/2, this.x + w/2, this.y + h, this.z + w/2);
    }
    
    onUpdate() {
        super.onUpdate();
        
        if (this.ticksExisted > this.maxAge) {
            this.world.removeEntityById(this.id);
            return;
        }

        this.ticksInAir++;

        // Raytrace for impact
        let vec3 = new Vector3(this.x, this.y, this.z);
        let nextVec3 = new Vector3(this.x + this.motionX, this.y + this.motionY, this.z + this.motionZ);
        let hit = this.world.rayTraceBlocks(vec3, nextVec3, false);

        if (hit) {
            this.impact(hit.vector.x, hit.vector.y, hit.vector.z);
            return;
        }

        // Entity Collision
        for (let entity of this.world.entities) {
            if (entity.canBeCollidedWith && entity !== this.owner && this.ticksInAir >= 2) {
                if (entity.boundingBox.intersects(this.boundingBox.expand(this.motionX, this.motionY, this.motionZ))) {
                    this.impact(this.x, this.y, this.z);
                    return;
                }
            }
        }

        this.x += this.motionX;
        this.y += this.motionY;
        this.z += this.motionZ;

        // Physics
        this.motionX *= 0.99;
        this.motionZ *= 0.99;
        this.motionY *= 0.99;
        this.motionY -= 0.03; 
        
        this.setPosition(this.x, this.y, this.z);
    }

    impact(x, y, z) {
        if (this.owner && this.owner.constructor.name === "PlayerEntity") {
            // Teleport player
            this.owner.setPosition(x, y, z);
            
            // Apply damage (5 points = 2.5 hearts)
            if (this.owner.gameMode !== 1) {
                this.owner.takeHit(null, 5, "ender_pearl");
            }
            
            // Sound effects
            this.minecraft.soundManager.playSound("random.glass", x, y, z, 1.0, 1.2);
            this.minecraft.soundManager.playSound("step.stone", x, y, z, 1.0, 0.5);
        }
        
        this.world.removeEntityById(this.id);
    }
}