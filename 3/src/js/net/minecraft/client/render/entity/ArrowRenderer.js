import EntityRenderer from "./EntityRenderer.js";
import * as THREE from "three";
import MathHelper from "../../../util/MathHelper.js";

export default class ArrowRenderer extends EntityRenderer {

    constructor(worldRenderer) {
        super(null);
        this.worldRenderer = worldRenderer;
        
        this.texture = worldRenderer.minecraft.getThreeTexture("../../arrow (2).png");
        const map = this.texture ? this.texture.clone() : null;

        // We use two intersecting planes (cross shape) for a 3D arrow look
        // 16x5 pixels strip ratio is 3.2:1.
        const arrowWidth = 1.0;
        const arrowHeight = arrowWidth * (5 / 16); 
        const geometry = new THREE.PlaneGeometry(arrowWidth, arrowHeight);
        
        this.mat1 = new THREE.MeshBasicMaterial({ map: map, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide });
        this.mat2 = new THREE.MeshBasicMaterial({ map: map ? map.clone() : null, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide });

        // Initial UVs for normal arrow (Now both planes use the top-most 5px strip)
        if (this.mat1.map) this.updateUVs(this.mat1.map, 0); 
        if (this.mat2.map) this.updateUVs(this.mat2.map, 0);

        this.mesh1 = new THREE.Mesh(geometry, this.mat1);
        this.mesh2 = new THREE.Mesh(geometry, this.mat2);
        
        // Rotate so points forward along local Y (since Plane is XY, and we lookAt Y)
        // Mesh 1: Long axis (1.1) becomes Y. Plane remains XY.
        this.mesh1.rotation.z = Math.PI / 2;
        
        // Mesh 2: Long axis (1.1) remains Y. Plane becomes YZ (perpendicular to Mesh 1).
        this.mesh2.rotation.z = Math.PI / 2;
        this.mesh2.rotation.y = Math.PI / 2;

        this.group.add(this.mesh1);
        this.group.add(this.mesh2);
        
        this.lastEnchantedState = null;
    }

    updateUVs(tex, stripIndex) {
        if (!tex || !tex.image || !tex.image.height) return;
        
        // Texture strips are explicitly 5px tall. 
        // Samples only the top-most strip (0) as requested.
        const totalH = tex.image.height;
        const stripH = 5; 
        const h = stripH / totalH;
        
        // Use a tiny epsilon to avoid sampling adjacent pixels/strips
        const eps = 0.001;
        
        tex.repeat.set(1, h - eps * 2);
        // Invert V: 0,0 is bottom-left. Strip 0 (top) starts at 1.0 - h
        tex.offset.set(0, 1.0 - h + eps);
        
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
    }

    render(entity, partialTicks) {
        // Update texture if resource changed (lazy loading support)
        const texPath = "../../arrow (2).png";
        const currentRes = this.worldRenderer.minecraft.resources[texPath];
        if (currentRes && currentRes.width > 1 && (!this.mat1.map || this.mat1.map.image !== currentRes)) {
            const filter = this.worldRenderer.minecraft.getTextureFilter();
            
            const createTex = (img) => {
                const tex = new THREE.CanvasTexture(img);
                tex.magFilter = filter;
                tex.minFilter = filter;
                tex.flipY = true;
                return tex;
            };

            this.mat1.map = createTex(currentRes);
            this.mat2.map = createTex(currentRes);
            
            // Re-apply strip slicing immediately on new texture
            this.updateUVs(this.mat1.map, 0);
            this.updateUVs(this.mat2.map, 0);
            
            this.lastEnchantedState = null; 
        }

        // Force UV update once image is fully loaded if it wasn't before
        if (this.mat1.map && this.mat1.map.image && this.mat1.map.image.height > 1 && this.lastEnchantedState === null) {
            this.updateUVs(this.mat1.map, 0);
            this.updateUVs(this.mat2.map, 0);
            this.lastEnchantedState = entity.isEnchanted;
        }

        // Position
        let x = entity.prevX + (entity.x - entity.prevX) * partialTicks;
        let y = entity.prevY + (entity.y - entity.prevY) * partialTicks;
        let z = entity.prevZ + (entity.z - entity.prevZ) * partialTicks;
        this.group.position.set(x, y, z);

        // Calculate motion vector for orientation
        let mx = entity.motionX;
        let my = entity.motionY;
        let mz = entity.motionZ;
        
        if (mx*mx + my*my + mz*mz > 0.0001) {
            let dir = new THREE.Vector3(mx, my, mz).normalize();
            // Align local Y with velocity
            this.group.lookAt(x + dir.x, y + dir.y, z + dir.z);
            this.group.rotateX(Math.PI / 2);
        }
        
        this.group.visible = true;
    }
}
