import Entity from "./Entity.js";
import BoundingBox from "../../util/BoundingBox.js";
import Vector3 from "../../util/Vector3.js";
import { BlockRegistry } from "../world/block/BlockRegistry.js";

export default class EntitySnowball extends Entity {
    static name = "EntitySnowball";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.setSize(0.25, 0.25);
        this.damage = 0; 
        this.inGround = false;
        this.ticksInGround = 0;
        this.ticksInAir = 0;
        this.maxAge = 600; 
        this.owner = null;
        this.thrownBlockId = 0; // The item ID that was thrown (e.g. splash potion)
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

        // Raytrace for impact
        let vec3 = new Vector3(this.x, this.y, this.z);
        let nextVec3 = new Vector3(this.x + this.motionX, this.y + this.motionY, this.z + this.motionZ);
        let hit = this.world.rayTraceBlocks(vec3, nextVec3, false);

        if (hit) {
            // Items landing in water splash
            if (hit.id === 9 || hit.id === 8) {
                this.minecraft.soundManager.playSound("random.splash", this.x, this.y, this.z, 0.5, 1.0);
            } else {
                this.minecraft.soundManager.playSound("step.grass", this.x, this.y, this.z, 0.8, 1.2);
            }
            if (this.onImpact) {
                this.onImpact(hit.vector.x, hit.vector.y, hit.vector.z);
            }
            this.world.removeEntityById(this.id);
            return;
        }

        // Entity Collision
        for (let entity of this.world.entities) {
            if (entity.canBeCollidedWith && entity !== this.owner && this.ticksInAir >= 1) {
                if (entity.boundingBox.intersects(this.boundingBox.expand(this.motionX, this.motionY, this.motionZ))) {
                    if (entity.takeHit) entity.takeHit(this.owner, 0); 
                    entity.motionX += this.motionX * 0.15;
                    entity.motionZ += this.motionZ * 0.15;
                    this.minecraft.soundManager.playSound("step.cloth", this.x, this.y, this.z, 0.8, 1.0);
                    this.world.removeEntityById(this.id);
                    return;
                }
            }
        }

        this.x += this.motionX;
        this.y += this.motionY;
        this.z += this.motionZ;

        // Subtle Gravity Arc
        this.motionX *= 0.99;
        this.motionZ *= 0.99;
        this.motionY *= 0.99;
        this.motionY -= 0.03; 
        
        this.setPosition(this.x, this.y, this.z);
    }
}

