import EntityRenderer from "./EntityRenderer.js";
import MathHelper from "../../../util/MathHelper.js";
import * as THREE from "three";

const TEXTURE_PATH = "/assets/mimicer/textures/entity/mimicer_texture.png";
const GEO_PATH = "/assets/mimicer/geo/mimicer.geo.json";

function deg(value = 0) {
    return MathHelper.toRadians(value || 0);
}

function pivotRotationMatrix(pivot = [0, 0, 0], rotation = [0, 0, 0]) {
    const matrix = new THREE.Matrix4();
    const p = new THREE.Vector3(pivot[0] || 0, pivot[1] || 0, pivot[2] || 0);
    const t1 = new THREE.Matrix4().makeTranslation(p.x, p.y, p.z);
    const r = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(deg(rotation[0]), deg(rotation[1]), deg(rotation[2]), "XYZ"));
    const t2 = new THREE.Matrix4().makeTranslation(-p.x, -p.y, -p.z);
    matrix.multiply(t1).multiply(r).multiply(t2);
    return matrix;
}

export default class MimicerRenderer extends EntityRenderer {
    constructor(worldRenderer) {
        super(null);
        this.worldRenderer = worldRenderer;
        this.texture = null;
        this.bodyParts = [];
        this.eyeParts = [];
        this.loader = new THREE.TextureLoader();
        this.geoData = null;
        this.geoVersion = 0;
        this.geoMode = false;
        this.modelRoot = null;
        this.loadGeo();
    }

    loadGeo() {
        if (typeof fetch !== "function") return;
        fetch(GEO_PATH)
            .then(response => response.ok ? response.json() : null)
            .then(data => {
                if (!data) return;
                this.geoData = data;
                this.geoVersion++;
                this.group.buildMeta = undefined;
            })
            .catch(() => {
                // The procedural fallback below still gives the Mimicer a native
                // renderer if a local file server blocks JSON fetches.
            });
    }

    loadTexture() {
        if (this.texture) return this.texture;
        this.texture = this.loader.load(TEXTURE_PATH);
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.NearestFilter;
        this.texture.wrapS = THREE.RepeatWrapping;
        this.texture.wrapT = THREE.RepeatWrapping;
        return this.texture;
    }

    material(color = 0xffffff, map = true) {
        const mat = new THREE.MeshBasicMaterial({
            map: map ? this.loadTexture() : null,
            color,
            side: THREE.DoubleSide,
            transparent: false,
            alphaTest: 0.05
        });
        mat.userData.baseColor = color;
        return mat;
    }

    addBox(name, sx, sy, sz, x, y, z, color = 0xffffff, map = true) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), this.material(color, map));
        mesh.name = name;
        mesh.position.set(x, y, z);
        this.group.add(mesh);
        this.bodyParts.push(mesh);
        return mesh;
    }

    buildGeoModel(entity) {
        const geometry = this.geoData?.["minecraft:geometry"]?.[0];
        const bones = geometry?.bones;
        if (!Array.isArray(bones) || bones.length === 0) return false;

        this.geoMode = true;
        this.modelRoot = new THREE.Object3D();
        this.modelRoot.name = "mimicer_geo_root";
        this.group.add(this.modelRoot);
        const matrices = new Map();
        const baseMaterial = this.material(0xffffff, true);

        for (const bone of bones) {
            const parentMatrix = bone.parent && matrices.has(bone.parent) ? matrices.get(bone.parent).clone() : new THREE.Matrix4();
            const boneMatrix = parentMatrix.multiply(pivotRotationMatrix(bone.pivot || [0, 0, 0], bone.rotation || [0, 0, 0]));
            matrices.set(bone.name, boneMatrix);

            if (!Array.isArray(bone.cubes)) continue;
            for (let i = 0; i < bone.cubes.length; i++) {
                const cube = bone.cubes[i];
                const size = cube.size || [1, 1, 1];
                const origin = cube.origin || [0, 0, 0];
                const geom = new THREE.BoxGeometry(size[0] || 1, size[1] || 1, size[2] || 1);
                geom.translate((origin[0] || 0) + (size[0] || 1) / 2, (origin[1] || 0) + (size[1] || 1) / 2, (origin[2] || 0) + (size[2] || 1) / 2);
                const cubeMatrix = pivotRotationMatrix(cube.pivot || [0, 0, 0], cube.rotation || [0, 0, 0]);
                geom.applyMatrix4(cubeMatrix);
                geom.applyMatrix4(boneMatrix);
                const mesh = new THREE.Mesh(geom, baseMaterial.clone());
                mesh.name = `mimicer_${bone.name}_${i}`;
                mesh.userData.boneName = bone.name;
                mesh.material.userData.baseColor = 0xffffff;
                this.modelRoot.add(mesh);
                this.bodyParts.push(mesh);
            }
        }

        const box = new THREE.Box3().setFromObject(this.modelRoot);
        if (!Number.isFinite(box.min.y) || box.isEmpty()) return false;
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const targetHeight = entity.height || 2.85;
        const s = targetHeight / Math.max(size.y, 1);
        this.modelRoot.scale.set(s, s, s);
        this.modelRoot.position.set(-center.x * s, -box.min.y * s, -center.z * s);
        this.modelRoot.userData.basePosition = this.modelRoot.position.clone();
        return true;
    }

    buildProceduralModel(entity) {
        this.geoMode = false;
        this.modelRoot = null;

        // Fallback: a tall, crooked, spider-like humanoid silhouette matching
        // the Mimicer feel if the Bedrock/GeckoLib geometry JSON has not
        // finished loading yet.
        this.lowerBody = this.addBox("lowerbody", 0.46, 0.95, 0.38, 0, 0.95, 0, 0x7d6f77);
        this.upperBody = this.addBox("upperbody", 0.62, 0.98, 0.44, 0, 1.78, 0, 0x8d8088);
        this.neck = this.addBox("neck", 0.25, 0.45, 0.25, 0, 2.43, -0.04, 0x786d75);
        this.head = this.addBox("head", 0.58, 0.62, 0.50, 0, 2.83, -0.08, 0x9a8c90);

        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe9fff2, side: THREE.DoubleSide });
        eyeMat.userData.isMimicerEye = true;
        const eyeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.018);
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
        leftEye.name = "mimicer_eye_left";
        leftEye.position.set(-0.13, 2.88, -0.34);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
        rightEye.name = "mimicer_eye_right";
        rightEye.position.set(0.13, 2.88, -0.34);
        this.group.add(leftEye, rightEye);
        this.eyeParts.push(leftEye, rightEye);

        this.leftUpperArm = this.addBox("leftupperarm", 0.20, 0.95, 0.20, -0.52, 1.86, -0.02, 0x766d74);
        this.leftLowerArm = this.addBox("leftlowerarm", 0.18, 1.05, 0.18, -0.72, 0.98, -0.16, 0x6a626a);
        this.rightUpperArm = this.addBox("rightupperarm", 0.20, 0.95, 0.20, 0.52, 1.86, -0.02, 0x766d74);
        this.rightLowerArm = this.addBox("rightlowerarm", 0.18, 1.05, 0.18, 0.72, 0.98, -0.16, 0x6a626a);
        this.leftLeg = this.addBox("leftleg", 0.22, 1.05, 0.22, -0.22, 0.34, 0.04, 0x6d646d);
        this.rightLeg = this.addBox("rightleg", 0.22, 1.05, 0.22, 0.22, 0.34, 0.04, 0x6d646d);

        this.upperBody.rotation.z = MathHelper.toRadians(-7);
        this.neck.rotation.z = MathHelper.toRadians(10);
        this.head.rotation.z = MathHelper.toRadians(-5);
        this.leftUpperArm.rotation.z = MathHelper.toRadians(-22);
        this.leftLowerArm.rotation.z = MathHelper.toRadians(18);
        this.rightUpperArm.rotation.z = MathHelper.toRadians(22);
        this.rightLowerArm.rotation.z = MathHelper.toRadians(-18);
        this.leftLeg.rotation.z = MathHelper.toRadians(8);
        this.rightLeg.rotation.z = MathHelper.toRadians(-8);
    }

    rebuild(entity) {
        this.group.traverse(child => {
            if (child.isMesh) {
                child.geometry?.dispose?.();
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                for (const mat of mats) mat?.dispose?.();
            }
        });
        this.group.clear();
        this.bodyParts = [];
        this.eyeParts = [];
        this.lowerBody = this.upperBody = this.neck = this.head = null;
        this.leftUpperArm = this.leftLowerArm = this.rightUpperArm = this.rightLowerArm = null;
        this.leftLeg = this.rightLeg = null;
        this.fillMeta(entity, this.group.buildMeta = {});
        this.group.buildMeta.geoVersion = this.geoVersion;

        if (!this.geoData || !this.buildGeoModel(entity)) {
            this.buildProceduralModel(entity);
        }

        if (entity.customName) this.renderNameTag(entity, entity.customName);
    }

    isRebuildRequired(entity) {
        if (!this.group.buildMeta) return true;
        if (this.group.buildMeta.geoVersion !== this.geoVersion) return true;
        return this.group.buildMeta.customName !== entity.customName;
    }

    render(entity, partialTicks) {
        this.prepareModel(entity);

        const ix = entity.prevX + (entity.x - entity.prevX) * partialTicks;
        const iy = entity.prevY + (entity.y - entity.prevY) * partialTicks;
        const iz = entity.prevZ + (entity.z - entity.prevZ) * partialTicks;
        this.group.position.set(ix, iy, iz);

        const bodyYaw = this.interpolateRotation(entity.prevRenderYawOffset, entity.renderYawOffset, partialTicks);
        this.group.rotation.y = MathHelper.toRadians(-bodyYaw + 180);
        const scale = entity.scale || 1.0;
        this.group.scale.set(scale, scale, scale);

        const light = entity.getEntityBrightness ? entity.getEntityBrightness() : 1;
        const mc = entity.minecraft;
        const globalBrightness = mc ? mc.settings.brightness : 0.5;
        let brightness = Math.pow(light, 1.5 - globalBrightness);
        brightness = Math.max(0.18, 0.1 + 0.9 * brightness);

        const hurt = entity.hurtTime && entity.hurtTime > 0;
        for (const part of this.bodyParts) {
            const base = part.material.userData.baseColor || 0xffffff;
            if (hurt) part.material.color.setRGB(1.0, 0.32, 0.32);
            else part.material.color.setHex(base).multiplyScalar(brightness);
        }
        for (const eye of this.eyeParts) {
            const pulse = 0.78 + Math.sin((entity.ticksExisted + partialTicks) * 0.45) * 0.22;
            const aggressive = entity.isAggressive || entity.isSpotted;
            eye.material.color.setRGB(aggressive ? 1.0 : 0.82, aggressive ? 0.25 + pulse * 0.25 : 0.95, aggressive ? 0.18 : 0.82);
        }

        const speed = Math.min(1.0, Math.sqrt((entity.x - entity.prevX) ** 2 + (entity.z - entity.prevZ) ** 2) * 8);
        const t = (entity.ticksExisted + partialTicks) * (entity.isAggressive ? 0.55 : 0.28);
        const walk = Math.sin(t) * speed;
        const crouch = entity.isCrouching || entity.isCrawling;
        const spotted = entity.isSpotted && !entity.isAggressive;

        if (this.geoMode && this.modelRoot) {
            const basePos = this.modelRoot.userData.basePosition || new THREE.Vector3();
            this.modelRoot.position.set(basePos.x, basePos.y + Math.abs(walk) * 0.055, basePos.z);
            this.modelRoot.rotation.x = MathHelper.toRadians(entity.isAggressive ? -5 : (spotted ? 4 : 0));
            this.modelRoot.rotation.z = Math.sin(t * 0.5) * 0.035 * (speed + (entity.isFleeing ? 0.6 : 0));
        } else {
            this.lowerBody.position.y = crouch ? 0.68 : 0.95;
            this.upperBody.position.y = crouch ? 1.38 : 1.78;
            this.neck.position.y = crouch ? 1.95 : 2.43;
            this.head.position.y = crouch ? 2.27 : 2.83;
            for (const eye of this.eyeParts) eye.position.y = crouch ? 2.32 : 2.88;

            this.upperBody.rotation.x = MathHelper.toRadians(entity.isAggressive ? -10 : (spotted ? 8 : 0));
            this.head.rotation.x = MathHelper.toRadians(entity.isAggressive ? -14 : (spotted ? 12 : 0));
            this.leftUpperArm.rotation.x = walk * 0.65 + MathHelper.toRadians(crouch ? -45 : -10);
            this.rightUpperArm.rotation.x = -walk * 0.65 + MathHelper.toRadians(crouch ? -45 : -10);
            this.leftLowerArm.rotation.x = -walk * 0.45 + MathHelper.toRadians(crouch ? 35 : 5);
            this.rightLowerArm.rotation.x = walk * 0.45 + MathHelper.toRadians(crouch ? 35 : 5);
            this.leftLeg.rotation.x = -walk * 0.7;
            this.rightLeg.rotation.x = walk * 0.7;
        }

        const tag = this.group.getObjectByName("nametag");
        if (tag && this.worldRenderer?.camera) tag.quaternion.copy(this.worldRenderer.camera.quaternion);
    }
}
