import EntityRenderer from "./EntityRenderer.js";
import * as THREE from "three";

export default class FishHookRenderer extends EntityRenderer {
    constructor(worldRenderer) {
        super(null);
        this.worldRenderer = worldRenderer;
        
        const geometry = new THREE.PlaneGeometry(0.25, 0.25);
        const texture = worldRenderer.minecraft.getThreeTexture("../../fishingbob.png");
        if (texture) {
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
        }
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.group.add(this.mesh);
    }

    render(entity, partialTicks) {
        let x = entity.prevX + (entity.x - entity.prevX) * partialTicks;
        let y = entity.prevY + (entity.y - entity.prevY) * partialTicks + 0.125;
        let z = entity.prevZ + (entity.z - entity.prevZ) * partialTicks;
        
        this.group.position.set(x, y, z);
        this.group.quaternion.copy(this.worldRenderer.camera.quaternion);
        this.group.visible = true;
    }
}