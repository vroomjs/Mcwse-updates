import Timer from "../util/Timer.js";
import * as THREE from "../../../../../../../libraries/three.module.js";

export default class Start {

    loadTextures(textures) {
        return Promise.all(textures.map((texture) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = "src/resources/" + texture;
                img.onload = () => {
                    resolve(img);
                };
                img.onerror = () => {
                    reject("Failed to load texture: " + texture);
                }
            });
        }).then((resources) => {
            return resources;
        });
    }

    launch(canvasWrapperId) {
        // Global handler to avoid unhandledRejection noise (e.g. permissions denied for clipboard)
        if (typeof window !== "undefined" && !window.__mc_unhandled_rejection_installed) {
            window.__mc_unhandled_rejection_installed = true;
            window.addEventListener('unhandledrejection', (event) => {
                // Prevent errors when accessing event.reason or calling preventDefault (some browsers throw)
                try {
                    console.warn("Unhandled promise rejection caught:", event.reason);
                    try {
                        event.preventDefault();
                    } catch (e) {
                        // ignore preventDefault errors
                    }
                } catch (err) {
                    // If reading reason fails (e.g. permissions/opaque errors), log minimal info and still try to prevent default
                    console.warn("Unhandled promise rejection caught (unable to read reason):", err);
                    try { event.preventDefault(); } catch (_) {}
                }
            });
        }

        this.minecraft = new Minecraft(canvasWrapperId, this.loadTextures([
            "misc/grasscolor.png",
            "gui/font.png",
            "gui/gui.png",
            "gui/background.png",
            "gui/icons.png",
            "terrain/terrain.png",
            "terrain/sun.png",
            "terrain/moon.png",
            "char.png",
            "gui/title/minecraft.png",
            "gui/title/background/panorama_0.png",
            "gui/title/background/panorama_1.png",
            "gui/title/background/panorama_2.png",
            "gui/title/background/panorama_3.png",
            "gui/title/background/panorama_4.png",
            "gui/title/background/panorama_5.png",
            "../../inventoryUIborder.png",
            "../../inventoryslot.png",
            "../../inventory_background.png",
            "../../arrow_0_0.png",
            "../../blocks.png",
            "../../ore.png",
            "../../breakanimation.png",
            "../../craftingtablesheet.png",
            "../../zombieskin.png",
            "../../alex.png",
            "../../tuxedosteve.png",
            "../../plasticsteve.png",
            "../../steve.png",
            "../../fire_1.png",
            "../../nether_portal.png",
            "../../farmland.png",
            "../../farmland_moist.png",
            
            // Wheat Stages
            "../../wheat_stage0.png",
            "../../wheat_stage1.png",
            "../../wheat_stage2.png",
            "../../wheat_stage3.png",
            "../../wheat_stage4.png",
            "../../wheat_stage5.png",
            "../../wheat_stage6.png",
            "../../wheat_stage7.png",
            
            // Carrots
            "../../carrots_stage0.png",
            "../../carrots_stage1.png",
            "../../carrots_stage2.png",
            "../../carrots_stage3.png",
            "../../carrot.png",
            "../../golden_carrot.png",
            
            // Potatoes
            "../../potatoes_stage0.png",
            "../../potatoes_stage1.png",
            "../../potatoes_stage2.png",
            "../../potatoes_stage3.png",
            "../../potato.png",
            "../../baked_potato.png",
            
            // Porkchops
            "../../porkchop.png",
            "../../cooked_porkchop.png",
            "../../oak_boat.png",
            "../../boat_planks.png",
            "../../goldarmor.png",
            "../../goldarmor2.png",
            "../../iron_layer_1.png",
            "../../iron_layer_2.png",
            "../../diamond_layer_1.png",
            "../../diamond_layer_2.png",
            
            // Sandstone
            "../../sandstoneside.png",
            "../../huskspawnegg.png",
            "../../drownedspawnegg.png",
            "../../villager_spawn_egg.png",
            "../../zombie_villager_spawn_egg.png",
            "../../pig_spawn_egg.png",
            "../../skeleton_spawn_egg.png",
            "../../furnace.png",
            "../../water.png",
            "../../water_flow (4).png",
            "../../lava (4).png",
            "../../crossbow.png",
            "../../newblocksset1.png",
            "../../random stuff.png",
        ]));

        this.minecraft.screenRenderer.initialize();
        this.minecraft.worldRenderer.initialize();

        // Launch game on canvas
        this.minecraft.displayScreen(new GuiMainMenu());
    }

}

new Start().launch("canvas-container");