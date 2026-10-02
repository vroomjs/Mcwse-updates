import Entity from "./Entity.js";
import BoundingBox from "../../util/BoundingBox.js";
import Vector3 from "../../util/Vector3.js";
import MathHelper from "../../util/MathHelper.js";

export default class EntityArrow extends Entity {
    static name = "EntityArrow";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.setSize(0.5, 0.5);
        this.damage = 4.0;
        this.inGround = false;
        this.isEnchanted = false;
        this.ticksInGround = 0;
        this.ticksInAir = 0;
        this.owner = null; // Who shot this arrow
    }

    setSize(w, h) {
        this.width = w;
        this.height = h;
        this.boundingBox = new BoundingBox(this.x - w/2, this.y, this.z - w/2, this.x + w/2, this.y + h, this.z + w/2);
    }

    setPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.setSize(0.5, 0.5);
    }

    onUpdate() {
        super.onUpdate();

        if (this.inGround) {
            this.ticksInGround++;
            if (this.ticksInGround >= 1200) this.world.removeEntityById(this.id);
            return;
        } else {
            this.ticksInAir++;
        }

        // Raytrace for impact
        let vec3 = new Vector3(this.x, this.y, this.z);
        let nextVec3 = new Vector3(this.x + this.motionX, this.y + this.motionY, this.z + this.motionZ);
        let hit = this.world.rayTraceBlocks(vec3, nextVec3, false);

        if (hit) {
            this.x = hit.vector.x;
            this.y = hit.vector.y;
            this.z = hit.vector.z;
            this.inGround = true;
            this.minecraft.soundManager.playSound("random.bowhit", this.x, this.y, this.z, 1.0, 1.2);
            return;
        }

        // Entity Collision (Traced from current position to next predicted position)
        let from = new Vector3(this.x, this.y, this.z);
        let to = new Vector3(this.x + this.motionX, this.y + this.motionY, this.z + this.motionZ);
        let closestEntity = null;
        let minDistance = 1.0;

        for (let entity of this.world.entities) {
            if (entity.canBeCollidedWith && entity !== this.owner && this.ticksInAir >= 1) {
                // Arrows have a small impact radius (approx 0.3 blocks)
                let border = 0.3;
                let eb = entity.boundingBox.grow(border, border, border);
                
                // Ray-box intersection returns the parametric distance 't' (0 to 1) along the path
                let hitDist = eb.calculateIntercept(from, to);
                if (hitDist !== null) {
                    if (hitDist < minDistance) {
                        minDistance = hitDist;
                        closestEntity = entity;
                    }
                }
            }
        }

        if (closestEntity) {
            // Calculate impact point based on minDistance (t)
            this.x = from.x + (to.x - from.x) * minDistance;
            this.y = from.y + (to.y - from.y) * minDistance;
            this.z = from.z + (to.z - from.z) * minDistance;

            let speed = Math.sqrt(this.motionX**2 + this.motionY**2 + this.motionZ**2);
            let finalDamage = speed * this.damage;
            
            if (closestEntity.takeHit) {
                closestEntity.takeHit(this.owner, finalDamage);
            }
            
            this.minecraft.soundManager.playSound("random.bowhit", this.x, this.y, this.z, 1.0, 1.2);
            this.world.removeEntityById(this.id);
            return;
        }

        // Move
        this.x += this.motionX;
        this.y += this.motionY;
        this.z += this.motionZ;

        // Subtle Gravity Arc
        this.motionX *= 0.99;
        this.motionZ *= 0.99;
        this.motionY *= 0.99;
        this.motionY -= 0.05; 
        
        this.setPosition(this.x, this.y, this.z);
    }
}


