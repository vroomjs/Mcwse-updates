import EntityRenderer from "./EntityRenderer.js";
import * as THREE from "three";
import Block from "../../world/block/Block.js";

export default class BlockDisplayRenderer extends EntityRenderer {

    constructor(worldRenderer) {
        super(null);
        this.worldRenderer = worldRenderer;
    }

    rebuild(entity) {
        this.group.clear();
        
        const block = Block.getById(entity.blockId || 1);
        if (!block) return;

        // Use BlockRenderer to build a high-quality 3D block representation
        const tempGroup = new THREE.Group();
        // Force 3D mode so we get true models for things like flowers and tools
        this.worldRenderer.blockRenderer.renderGuiBlock(tempGroup, block, 0, 0, 1.0, 1.0, true);

        // Adjust the meshes in the group
        tempGroup.traverse(child => {
            if (child.isMesh) {
                // Center geometry to ensure the block unit's visual origin matches its center
                if (child.geometry) {
                    child.geometry.center();
                }

                // Reset GUI-specific rotations and offsets applied by renderGuiBlock
                child.rotation.set(0, 0, 0);
                child.position.set(0, 0, 0);
                
                if (child.material) {
                    child.material.side = THREE.DoubleSide;
                }
            }
        });

        // Apply display scale to the entire group
        const s = entity.displayScale || 1.0;
        tempGroup.scale.set(s, s, s);

        // Add the processed block meshes to our entity group
        this.group.add(tempGroup);

        // Metadata for rebuild check
        let meta = {};
        this.fillMeta(entity, meta);
        this.group.buildMeta = meta;
    }

    fillMeta(entity, meta) {
        super.fillMeta(entity, meta);
        meta.blockId = entity.blockId;
        meta.displayScale = entity.displayScale;
    }

    render(entity, partialTicks) {
        if (this.isRebuildRequired(entity)) {
            this.rebuild(entity);
        }

        let x = entity.prevX + (entity.x - entity.prevX) * partialTicks;
        let y = entity.prevY + (entity.y - entity.prevY) * partialTicks;
        let z = entity.prevZ + (entity.z - entity.prevZ) * partialTicks;

        // Apply bobbing offset visually
        if (entity.bobHeight > 0) {
            const time = (entity.ticksExisted + partialTicks) * (entity.bobSpeed || 0.1);
            y += Math.sin(time) * entity.bobHeight;
        }

        // Center the block display (blocks are 1x1x1)
        this.group.position.set(x, y + 0.5 * (entity.displayScale || 1.0), z);

        // Rotation
        let yaw = this.interpolateRotation(entity.prevRotationYaw, entity.rotationYaw, partialTicks);
        this.group.rotation.y = -yaw * Math.PI / 180;

        this.group.visible = true;
        this.group.updateMatrix();

        // Apply brightness
        let light = entity.getEntityBrightness();
        let globalBrightness = this.worldRenderer.minecraft.settings.brightness;
        let brightness = Math.pow(light, 1.5 - globalBrightness);
        brightness = Math.max(0.1, 0.1 + 0.9 * brightness);

        this.group.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.color.setScalar(brightness);
            }
        });
    }
}