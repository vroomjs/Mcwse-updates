import ModelPlayer from "../model/model/ModelPlayer.js";
import EntityRenderer from "./EntityRenderer.js";
import MathHelper from "../../../util/MathHelper.js";
import * as THREE from "three";

/**
 * The Mimicer is now a player double: the standard player model wearing a
 * completely black skin, so it reads as the player's silhouette/shadow rather
 * than a bespoke creature.
 *
 * The previous Bedrock/GeckoLib geometry pipeline (fetching mimicer.geo.json
 * and mapping its per-face UVs onto generated boxes) is gone along with the
 * procedural fallback skeleton. Nothing else referenced it.
 */

// A legacy 64x32 skin layout is used deliberately: ModelPlayer only builds the
// second "overlay" layer for 64x64 skins, and an opaque overlay stacked on an
// opaque base just z-fights for no visual gain on a solid colour.
const SKIN_WIDTH = 64;
const SKIN_HEIGHT = 32;

// Total height of the player model in world units, derived the same way the
// base renderer does it: 32 model units at 7/120 scale.
const MODEL_HEIGHT = 32 * (7.0 / 120.0);

function createSolidSkin(cssColor) {
    const canvas = document.createElement("canvas");
    canvas.width = SKIN_WIDTH;
    canvas.height = SKIN_HEIGHT;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, SKIN_WIDTH, SKIN_HEIGHT);

    // Generated in-memory rather than shipped as a PNG, so there is no new
    // asset to register in the manifest and nothing to 404.
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
}

export default class MimicerRenderer extends EntityRenderer {

    constructor(worldRenderer) {
        super(new ModelPlayer(SKIN_WIDTH, SKIN_HEIGHT));

        this.worldRenderer = worldRenderer;
        this.blackSkin = null;
        // Pure black swallows the usual red hurt flash completely, so damage
        // swaps in a very dark red skin instead. Still unmistakably a shadow,
        // but hits stay readable.
        this.hurtSkin = null;
    }

    ensureSkins() {
        if (!this.blackSkin) this.blackSkin = createSolidSkin("#000000");
        if (!this.hurtSkin) this.hurtSkin = createSolidSkin("#3a0d0d");
        return this.blackSkin;
    }

    rebuild(entity) {
        // Bind before super.rebuild: EntityRenderer clones the tessellator
        // material for each generated mesh, so the map has to be in place
        // first or the body parts come out untextured.
        this.tessellator.bindTexture(this.ensureSkins());
        super.rebuild(entity);
    }

    /** Swaps every body part between the black and hurt skins. */
    applySkin(texture) {
        this.group.traverse(child => {
            if (!child.isMesh || child.name === "nametag" || child.name === "fire_overlay") return;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            for (const material of materials) {
                if (material && material.map !== texture) {
                    material.map = texture;
                    material.needsUpdate = true;
                }
            }
        });
    }

    render(entity, partialTicks) {
        this.ensureSkins();

        // Drive the player model's own animation state from the Mimicer's AI
        // flags so it walks, sneaks and swings like a player would.
        if (this.model) {
            let swingProgress = entity.swingProgress - entity.prevSwingProgress;
            if (swingProgress < 0.0) swingProgress++;
            this.model.swingProgress = (entity.prevSwingProgress || 0) + swingProgress * partialTicks;
            this.model.isSneaking = !!(entity.isCrouching || entity.isCrawling);
            this.model.hasItemInHand = false;
            this.model.isRiding = false;
        }

        super.render(entity, partialTicks);

        // The base renderer sizes everything against a 1.8-block player. Scale
        // from the Mimicer's actual hitbox height instead, so changing
        // baseHeight on the entity is all it takes to make it tower over the
        // player again.
        const scale = 7.0 / 120.0;
        const height = entity.height || 1.8;
        const factor = height / MODEL_HEIGHT;
        this.group.scale.set(-scale * factor, -scale * factor, scale * factor);

        const interpolatedY = entity.prevY + (entity.y - entity.prevY) * partialTicks;
        const sneakOffset = this.model && this.model.isSneaking ? 3.0 * scale * factor : 0;
        this.group.position.setY(interpolatedY + 1.4 * factor - sneakOffset);

        // Lean into the pose a little when it has been noticed or is charging,
        // keeping the old renderer's body language.
        const spotted = entity.isSpotted && !entity.isAggressive;
        if (this.model && this.model.body) {
            this.model.body.bone.rotation.x = MathHelper.toRadians(entity.isAggressive ? -8 : (spotted ? 5 : 0));
        }

        this.applySkin(entity.hurtTime && entity.hurtTime > 0 ? this.hurtSkin : this.blackSkin);
    }

    dispose() {
        super.dispose();
        this.blackSkin?.dispose?.();
        this.hurtSkin?.dispose?.();
        this.blackSkin = null;
        this.hurtSkin = null;
    }
}
