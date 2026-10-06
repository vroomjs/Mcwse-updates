import ModelRenderer from "../renderer/ModelRenderer.js";
import MathHelper from "../../../../util/MathHelper.js";
import ModelBase from "../ModelBase.js";

export default class ModelPlayer extends ModelBase {

    /**
     * Create cubes for the zombie model
     */
    constructor(width = 64, height = 32, inflate = 0.0) {
        super();

        this.textureWidth = width;
        this.textureHeight = height;
        this.isModern = height === 64;

        this.swingProgress = 0;
        this.hasItemInHand = false;
        this.isSneaking = false;
        this.isRiding = false;

        const overlayInflate = inflate + 0.25;

        // --- BASE LAYERS ---

        // Create head ModelRenderer
        this.head = new ModelRenderer("head", width, height)
            .setTextureOffset(0, 0)
            .addBox(-4.0, -8.0, -4.0, 8, 8, 8, inflate);

        // Create body ModelRenderer
        this.body = new ModelRenderer("body", width, height)
            .setTextureOffset(16, 16)
            .addBox(-4.0, 0.0, -2.0, 8, 12, 4, inflate);

        // Right arm ModelRenderer (Negative X)
        this.rightArm = new ModelRenderer("right_arm", width, height)
            .setTextureOffset(40, 16)
            .setRotationPoint(-5.0, 2.0, 0.0)
            .addBox(-3.0, -2.0, -2.0, 4, 12, 4, inflate);

        // Left arm ModelRenderer (Positive X)
        // 64x64 skins have dedicated left limb textures
        const leftArmOffset = this.isModern ? [32, 48] : [40, 16];
        this.leftArm = new ModelRenderer("left_arm", width, height)
            .setTextureOffset(leftArmOffset[0], leftArmOffset[1])
            .setRotationPoint(5.0, 2.0, 0.0)
            .addBox(-1.0, -2.0, -2.0, 4, 12, 4, inflate, !this.isModern);

        // Right Legs ModelRenderer (Negative X)
        this.rightLeg = new ModelRenderer("right_leg", width, height)
            .setTextureOffset(0, 16)
            .setRotationPoint(-2.0, 12.0, 0.0)
            .addBox(-2.0, 0.0, -2.0, 4, 12, 4, inflate);

        // Left leg ModelRenderer (Positive X)
        const leftLegOffset = this.isModern ? [16, 48] : [0, 16];
        this.leftLeg = new ModelRenderer("left_leg", width, height)
            .setTextureOffset(leftLegOffset[0], leftLegOffset[1])
            .setRotationPoint(2.0, 12.0, 0.0)
            .addBox(-2.0, 0.0, -2.0, 4, 12, 4, inflate, !this.isModern);

        // --- OVERLAY LAYERS ---
        if (this.isModern) {
            this.headOverlay = new ModelRenderer("head_overlay", width, height)
                .setTextureOffset(32, 0)
                .addBox(-4.0, -8.0, -4.0, 8, 8, 8, overlayInflate);
            this.head.addChild(this.headOverlay);

            this.bodyOverlay = new ModelRenderer("body_overlay", width, height)
                .setTextureOffset(16, 32)
                .addBox(-4.0, 0.0, -2.0, 8, 12, 4, overlayInflate);
            this.body.addChild(this.bodyOverlay);

            this.rightArmOverlay = new ModelRenderer("right_arm_overlay", width, height)
                .setTextureOffset(40, 32)
                .addBox(-3.0, -2.0, -2.0, 4, 12, 4, overlayInflate);
            this.rightArm.addChild(this.rightArmOverlay);

            this.leftArmOverlay = new ModelRenderer("left_arm_overlay", width, height)
                .setTextureOffset(48, 48)
                .addBox(-1.0, -2.0, -2.0, 4, 12, 4, overlayInflate);
            this.leftArm.addChild(this.leftArmOverlay);

            this.rightLegOverlay = new ModelRenderer("right_leg_overlay", width, height)
                .setTextureOffset(0, 32)
                .addBox(-2.0, 0.0, -2.0, 4, 12, 4, overlayInflate);
            this.rightLeg.addChild(this.rightLegOverlay);

            this.leftLegOverlay = new ModelRenderer("left_leg_overlay", width, height)
                .setTextureOffset(0, 48)
                .addBox(-2.0, 0.0, -2.0, 4, 12, 4, overlayInflate);
            this.leftLeg.addChild(this.leftLegOverlay);
        }
    }

    rebuild(tessellator, group) {
        super.rebuild(tessellator, group);

        this.head.rebuild(tessellator, group);
        this.body.rebuild(tessellator, group);
        this.leftArm.rebuild(tessellator, group);
        this.rightArm.rebuild(tessellator, group);
        this.leftLeg.rebuild(tessellator, group);
        this.rightLeg.rebuild(tessellator, group);
    }

    render(stack, limbSwing, limbSwingStrength, timeAlive, yaw, pitch, partialTicks) {
        this.setRotationAngles(stack, limbSwing, limbSwingStrength, timeAlive, yaw, pitch, partialTicks);

        // Render base cubes
        this.head.render();
        this.body.render();
        this.rightArm.render();
        this.leftArm.render();
        this.rightLeg.render();
        this.leftLeg.render();

        // Render overlays
        if (this.isModern) {
            this.headOverlay.render();
            this.bodyOverlay.render();
            this.rightArmOverlay.render();
            this.leftArmOverlay.render();
            this.rightLegOverlay.render();
            this.leftLegOverlay.render();
        }

        super.render(stack, limbSwing, limbSwingStrength, timeAlive, yaw, pitch, partialTicks);
    }

    setRotationAngles(stack, limbSwing, limbSwingStrength, timeAlive, yaw, pitch, partialTicks) {
        // Head rotation
        this.head.rotateAngleY = MathHelper.toRadians(yaw);
        this.head.rotateAngleX = MathHelper.toRadians(pitch);

        // Limb swing leg animation
        this.rightArm.rotateAngleX = Math.cos(limbSwing * 0.6662 + Math.PI) * 2.0 * limbSwingStrength * 0.5;
        this.leftArm.rotateAngleX = Math.cos(limbSwing * 0.6662) * 2.0 * limbSwingStrength * 0.5;
        this.rightArm.rotateAngleZ = 0.0;
        this.leftArm.rotateAngleZ = 0.0;
        this.rightLeg.rotateAngleX = Math.cos(limbSwing * 0.6662) * 1.4 * limbSwingStrength;
        this.leftLeg.rotateAngleX = Math.cos(limbSwing * 0.6662 + Math.PI) * 1.4 * limbSwingStrength;
        this.rightLeg.rotateAngleY = 0.0;
        this.leftLeg.rotateAngleY = 0.0;

        if (this.isRiding) {
            // Only apply riding rotation to right arm if NOT holding an item
            if (!this.hasItemInHand) {
                this.rightArm.rotateAngleX = -Math.PI / 5;
            }
            this.leftArm.rotateAngleX = -Math.PI / 5;
            this.rightLeg.rotateAngleX = -Math.PI / 2;
            this.leftLeg.rotateAngleX = -Math.PI / 2;
            this.rightLeg.rotateAngleY = Math.PI / 10;
            this.leftLeg.rotateAngleY = -Math.PI / 10;
        }

        // Reset arms for swing progress
        this.rightArm.rotateAngleY = 0.0;
        this.rightArm.rotateAngleZ = 0.0;
        this.leftArm.rotateAngleY = 0.0;

        // Held item animation
        if (this.hasItemInHand) {
            this.rightArm.rotateAngleX = this.rightArm.rotateAngleX * 0.5 - (Math.PI / 10);
        }

        if (this.swingProgress > -9990.0) {
            let swingProgress = this.swingProgress;

            this.body.rotateAngleY = Math.sin(Math.sqrt(swingProgress) * Math.PI * 2.0) * 0.2;

            this.rightArm.rotationPointZ = Math.sin(this.body.rotateAngleY) * 5.0;
            this.rightArm.rotationPointX = -Math.cos(this.body.rotateAngleY) * 5.0;
            this.leftArm.rotationPointZ = -Math.sin(this.body.rotateAngleY) * 5.0;
            this.leftArm.rotationPointX = Math.cos(this.body.rotateAngleY) * 5.0;

            this.rightArm.rotateAngleY += this.body.rotateAngleY;
            this.leftArm.rotateAngleY += this.body.rotateAngleY;
            this.leftArm.rotateAngleX += this.body.rotateAngleY;

            swingProgress = 1.0 - swingProgress;
            swingProgress = swingProgress * swingProgress;
            swingProgress = swingProgress * swingProgress;
            swingProgress = 1.0 - swingProgress;

            let value1 = Math.sin(swingProgress * Math.PI);
            let value2 = Math.sin(swingProgress * Math.PI) * -(this.head.rotateAngleX - 0.7) * 0.75;

            this.rightArm.rotateAngleX = (this.rightArm.rotateAngleX - (value1 * 1.2 + value2));
            this.rightArm.rotateAngleY += this.body.rotateAngleY * 2.0;
            this.rightArm.rotateAngleZ += Math.sin(swingProgress * Math.PI) * -0.4;
        }

        // Sneaking animation
        if (this.isSneaking) {
            this.body.rotateAngleX = 0.5;
            this.rightArm.rotateAngleX += 0.4;
            this.leftArm.rotateAngleX += 0.4;
            this.rightLeg.rotationPointZ = 4.0;
            this.leftLeg.rotationPointZ = 4.0;
            this.rightLeg.rotationPointY = 9.0;
            this.leftLeg.rotationPointY = 9.0;
            this.head.rotationPointY = 1.0;
        } else {
            this.body.rotateAngleX = 0.0;
            this.rightLeg.rotationPointZ = 0.1;
            this.leftLeg.rotationPointZ = 0.1;
            this.rightLeg.rotationPointY = 12.0;
            this.leftLeg.rotationPointY = 12.0;
            this.head.rotationPointY = 0.0;
            this.body.rotationPointY = 0.0;
        }

        // Limb swing arm animation (breathing), disabled when riding
        if (!this.isRiding) {
            this.rightArm.rotateAngleZ += Math.cos(timeAlive * 0.09) * 0.05 + 0.05;
            this.leftArm.rotateAngleZ -= Math.cos(timeAlive * 0.09) * 0.05 + 0.05;
            this.rightArm.rotateAngleX += Math.sin(timeAlive * 0.067) * 0.05;
            this.leftArm.rotateAngleX -= Math.sin(timeAlive * 0.067) * 0.05;
        }
    }

}