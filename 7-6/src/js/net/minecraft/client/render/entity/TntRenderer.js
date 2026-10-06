import EntityRenderer from "./EntityRenderer.js";
import * as THREE from "three";
import BlockRenderType from "../../../util/BlockRenderType.js";
import BlockTNT from "../../world/block/type/BlockTNT.js";
import Block from "../../world/block/Block.js";

export default class TntRenderer extends EntityRenderer {

    constructor(worldRenderer) {
        super(null);
        this.worldRenderer = worldRenderer;
        this.tntBlock = new BlockTNT(46); // Dummy block instance for texture lookup
    }

    fillMeta(entity, meta) {
        super.fillMeta(entity, meta);
        meta.fuse = entity.fuse;
    }

    rebuild(entity) {
        let meta = {};
        this.fillMeta(entity, meta);
        this.group.buildMeta = meta;

        this.group.clear();

        // Manual mesh construction for robustness
        const geometry = new this.worldRenderer.THREE.BoxGeometry(0.98, 0.98, 0.98);
        
        const loadTex = (name) => {
            let tex = this.worldRenderer.minecraft.getThreeTexture(name);
            if (tex) {
                // Clone the texture so we can set flipY to true without affecting 
                // the static TNT blocks which use the same texture but need flipY=false
                tex = tex.clone();
                tex.magFilter = this.worldRenderer.THREE.NearestFilter;
                tex.minFilter = this.worldRenderer.THREE.NearestFilter;
                tex.flipY = true;
                tex.needsUpdate = true;
            }
            return tex;
        };

        const sideTex = loadTex('../../tnt_side.png');
        const topTex = loadTex('../../tnt_top.png');
        const bottomTex = loadTex('../../tnt_bottom.png');

        const matSide = new this.worldRenderer.THREE.MeshBasicMaterial({ map: sideTex });
        const matTop = new this.worldRenderer.THREE.MeshBasicMaterial({ map: topTex });
        const matBottom = new this.worldRenderer.THREE.MeshBasicMaterial({ map: bottomTex });
        
        // Order: Right, Left, Top, Bottom, Front, Back
        const materials = [matSide, matSide, matTop, matBottom, matSide, matSide];
        
        const mesh = new this.worldRenderer.THREE.Mesh(geometry, materials);
        
        // Store original materials for flashing
        mesh.userData.originalMaterials = materials;
        // Create flash material (white overlay look)
        mesh.userData.flashMaterial = new this.worldRenderer.THREE.MeshBasicMaterial({ color: 0xFFFFFF });

        this.group.add(mesh);
    }

    render(entity, partialTicks) {
        if (this.isRebuildRequired(entity)) {
            this.rebuild(entity);
        }

        let x = entity.prevX + (entity.x - entity.prevX) * partialTicks;
        let y = entity.prevY + (entity.y - entity.prevY) * partialTicks;
        let z = entity.prevZ + (entity.z - entity.prevZ) * partialTicks;

        this.group.position.set(x, y + 0.5, z); // Adjust Y center
        
        // Flash logic
        let fuse = entity.fuse;
        if (fuse < 1) fuse = 1;
        // Flash frequency increases as fuse decreases
        let shouldFlash = (Math.floor(fuse / 5) % 2) === 0;
        
        // Scale pulse just before explosion
        let scale = 1.0;
        if (fuse < 20) {
             scale = 1.0 + 0.1 * (1.0 - fuse / 20.0);
        }
        this.group.scale.set(scale, scale, scale);

        if (this.group.children.length > 0) {
            let mesh = this.group.children[0];
            if (shouldFlash) {
                // Apply white material to all faces
                mesh.material = mesh.userData.flashMaterial;
            } else {
                // Restore texture materials
                mesh.material = mesh.userData.originalMaterials;
            }
        }
    }
}

