import EntityRenderer from "./EntityRenderer.js";
import * as THREE from "three";

export default class SnowballRenderer extends EntityRenderer {

    constructor(worldRenderer) {
        super(null);
        this.worldRenderer = worldRenderer;
    }

    rebuild(entity) {
        this.group.clear();
        
        let texPath = '../../items (1).png';
        let textureIndex = 4; // Snowball index in the 37-column sheet
        let cols = 37; // Updated to match the current items (1).png layout

        if (entity.constructor.name === "EntityEnderPearl") {
            textureIndex = 0; // Ender Pearl index
        }

        let texture = this.worldRenderer.minecraft.getThreeTexture(texPath);
        if (texture) {
            // Clone texture to avoid modifying the original for other items
            texture = texture.clone();
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.flipY = true;
            
            let uSize = 1.0 / cols;
            texture.offset.set(textureIndex * uSize, 0);
            texture.repeat.set(uSize, 1);
            texture.needsUpdate = true;
        }

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide
        });
        
        this.sprite = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), material);
        this.group.add(this.sprite);
    }

    render(entity, partialTicks) {
        if (this.group.children.length === 0) {
            this.rebuild(entity);
        }

        // Update texture if resource changed
        const texPath = entity.constructor.name === "EntityEnderPearl" ? "../../items (1).png" : "../../items (1).png";
        const currentRes = this.worldRenderer.minecraft.resources[texPath];
        if (this.sprite && this.sprite.material && this.sprite.material.map && this.sprite.material.map.image !== currentRes) {
             // Invalidate build meta to trigger re-clone in rebuild()
             delete this.group.buildMeta;
             this.rebuild(entity);
        }

        let x = entity.prevX + (entity.x - entity.prevX) * partialTicks;
        let y = entity.prevY + (entity.y - entity.prevY) * partialTicks;
        let z = entity.prevZ + (entity.z - entity.prevZ) * partialTicks;

        this.group.position.set(x, y, z);
        
        // Billboard effect
        this.group.quaternion.copy(this.worldRenderer.camera.quaternion);
        
        this.group.visible = true;
    }
}

