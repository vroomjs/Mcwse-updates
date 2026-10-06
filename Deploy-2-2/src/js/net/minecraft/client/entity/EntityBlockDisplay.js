import Entity from "./Entity.js";
import BoundingBox from "../../util/BoundingBox.js";

export default class EntityBlockDisplay extends Entity {
    static name = "EntityBlockDisplay";

    constructor(minecraft, world) {
        super(minecraft, world);
        
        this.blockId = 1; // Default stone
        this.displayScale = 1.0;
        this.rotationSpeed = 0.0;
        this.bobSpeed = 0.0;
        this.bobHeight = 0.0;
        this.floating = true; // No gravity by default
        
        this.canBeCollidedWith = false;
        this.renderYawOffset = 0;
        
        this.setSize(1, 1);
    }

    setSize(w, h) {
        this.width = w;
        this.height = h;
        this.setPosition(this.x, this.y, this.z);
    }

    setPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        let w = (this.width || 1) / 2;
        this.boundingBox = new BoundingBox(x - w, y, z - w, x + w, y + (this.height || 1), z + w);
    }

    onUpdate() {
        super.onUpdate();

        // Apply constant rotation if set
        if (this.rotationSpeed !== 0) {
            this.rotationYaw = (this.rotationYaw + this.rotationSpeed) % 360;
        }

        // Bobbing is handled purely visually in the renderer to stay smooth
        
        // No physics move unless not floating
        if (!this.floating) {
            this.motionY -= 0.04;
            this.x += this.motionX;
            this.y += this.motionY;
            this.z += this.motionZ;
            
            this.motionX *= 0.98;
            this.motionY *= 0.98;
            this.motionZ *= 0.98;
            
            if (this.onGround) {
                this.motionY = 0;
            }
        }

        this.setPosition(this.x, this.y, this.z);
    }
}