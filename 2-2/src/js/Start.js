import Minecraft from './net/minecraft/client/Minecraft.js';
import { AVAILABLE_ASSETS } from './asset-manifest.js';

class Start {

    loadTexture(path) {
        return new Promise((resolve, reject) => {
            const relativePath = path.startsWith("../../")
                ? path.substring(6)
                : "src/resources/" + path;

            // Old block/item tables contain filenames from packs that are no
            // longer part of this revision. Do not turn those into slow 404
            // requests; preserve the resource key with a safe placeholder.
            if (!AVAILABLE_ASSETS.has(relativePath) || !/\.(?:png|webp|jpe?g|ico)$/i.test(relativePath)) {
                resolve(this.createPlaceholder());
                return;
            }

            let image = new Image();
            image.decoding = "async";
            image.src = "./" + relativePath;
            image.onload = () => resolve(image);
            image.onerror = () => {
                resolve(this.createPlaceholder());
            };
        });
    }

    createPlaceholder() {
        let canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        let ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FF00FF';
        ctx.fillRect(0, 0, 1, 1);
        return canvas;
    }

    async launch(canvasWrapperId) {
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
                    console.warn("Unhandled promise rejection caught (unable to read reason)");
                    try { event.preventDefault(); } catch (_) {}
                }
            });
        }

        // Critical textures required for Main Menu and initial world loading
        const essential = [
            "gui/font.png",
            "gui/gui.png",
            "gui/background.png",
            "misc/grasscolor.png",
            // The terrain atlas is needed by the first world render. Loading
            // it before Minecraft creates its Three.js materials prevents
            // those materials from ever being initialized with the temporary
            // 1x1 lazy-loading placeholder.
            "../../blocks.png",
            "../../minecraftwebsimedition.png",
            "../../random stuff.png"
        ];

        // Game textures loaded in background
        const lazy = [
            "../../spawner.png",
            "../../structure_block (6).png",
            "../../minecart.png",
            "../../villagermob.gltf",
            "../../cat.gltf",
            "../../zombie_villager.gltf",
            "../../zombie_villager_spawn_egg.png",
            "../../cat_spawn_egg.png",
            "../../fishing_rod.png",
            "../../fishingbob.png",
            "../../birch_log.png",
            "../../birch_log_top.png",
            "../../birch_planks.png",
            "../../birch_sapling.png",
            "../../tall_grass_bottom.png",
            "../../tall_grass_top.png",
            "../../tools (1).png",
            "../../items (1).png",
            "../../water_flow (4).png",
            "../../flame.png",
            "../../foliage.png",
            "../../All doors.png",
            "../../paper.png",
            "../../sugar.png",
            "../../string.png",
            "../../iron_golem.gltf",
            "../../raw_fish.png",
            "../../book.png",
            "../../stick.png",
            "../../coal.png",
            "../../birch_boat_icon.png",
            "../../spruce_boat_icon.png",
            "../../sprucelog.png",
            "../../spruceplanks.png",
            "../../sprucesaplings.png",
            "../../spruceleave.png",
            "../../bookshelf.png",
            "../../book.png",
            "../../white_tulip.png",
            "../../lily_of_the_valley.png",
            "../../wools.png",
            "../../farming.png",
            "../../beetroot (1).png",
            "../../dye.png",
            "../../food.png",
            "../../magma3sheet.png",
            "../../food2.png",
            "../../quartz.png",
            "../../clouds.png",
            "../../desert (3).png",
            "../../coloredglass.png",
            "../../treestuff.png",
            "../../sandstuff.png",
            "../../desert (1).png",
            "../../terracottahseet.png",
            "../../endstuff.png",
            "../../lava (3).png",
            "../../lava (4).png",
            "../../smoke.png",
            "../../rainweathe.png",
            "../../signs.png",
            "../../slimestuff.png",
            "../../redstonestuff.png",
            "../../crossbow.png",
            "../../note_block.png",
            "../../critandnote.png",
            "../../dicsandbox (1).png",
            "../../enchanted_glint_item.png",
            "../../advancements (1).png",
            "../../advancements (2).png",
            "../../bottles.png",
            "../../anvil_top.png",
            "../../anvil.png",
            "gui/title/minecraft.png",
            "gui/title/background/panorama_0.png",
            "gui/title/background/panorama_1.png",
            "gui/title/background/panorama_2.png",
            "gui/title/background/panorama_3.png",
            "gui/title/background/panorama_4.png",
            "gui/title/background/panorama_5.png",
            "gui/icons.png",
            "terrain/sun.png",
            "terrain/moon.png",
            "char.png",
            "terrain/terrain.png", // Add fallback terrain if needed
            "../../inventoryUIborder.png",
            "../../inventoryslot.png",
            "../../arrow (2).png",
            "../../favicon.ico",
            "../../projectlogo.png",
            "../../recipe_book.png",
            "../../arrow_0_0.png",
            "../../arrow.png",
            "../../orestuff.png",
            "../../breakanimation.png",
            "../../All doors.png",
            "../../craftingtablesheet.png",
            "../../chest.png.png",
            "../../pumpkin.png.png",
            "../../anvil_top.png",
            "../../anvil.png",
            "../../dead_bush.png",
            "../../sugar_cane.png",
            "../../deadandsugar.png.png",
            "../../ladder.png",
            "../../nether.png",
            "../../zombie.png",
            "../../husk.png",
            "../../drowned.png",
            "../../zombieskin.png",
            "../../alex.png",
            "../../tuxedosteve.png",
            "../../plasticsteve.png",
            "../../steve.png",
            "../../steve (1).png",
            "../../technoblade.png",
            "../../notch.png",
            "../../alex (1).png",
            
            // Creative Inventory Tabs
            "../../tabselected_1_0 (2).png",
            "../../tabnotselected_0_0 (8).png",
            
            // Achievements
            "../../acquirehardware.png",
            "../../takinginventory.png",
            "../../timetomine.png",
            "../../gettinganupgrade.png",
            "../../gettingwood.png",
            "../../benchmaking.png",
            "../../timetostrike.png",
            "../../DIAMONDS.png",
            "../../Cowtipper.png",
            "../../Intothenether.png",
            "../../Thehaggler.png",
            "../../Timetofarmadvancement.png",
            "../../hottopic.png",
            "../../bakebread.png",
            "../../porkchop (3).png",
            "../../monsterhunter.png",
            "../../ironman.png",
            "../../yummyfish.png",
            "../../whenpigsfly.png",
            "../../dispsensewiththis.png",

            // Missing Items & Tools
            "../../ironingot.png",
            "../../gold_ingot.png",
            "../../diamond.png",
            "../../flint.png",
            "../../flint_and_steel.png",
            "../../feather.png",
            "../../bone.png",
            "../../bone_meal.png",
            "../../gunpowder.png",
            "../../heartfull.png",
            "../../hearthalffull.png",
            "../../heartempty.png",
            "../../foodfull.png",
            "../../foodhalffull.png",
            "../../foodempty.png",
            "../../brick.png",
            "../../clay_ball.png",
            "../../leather.png",
            "../../woodenpickaxe.png",
            "../../stone_pickaxe.png",
            "../../iron_pickaxe.png",
            "../../golden_pickaxe.png",
            "../../diamond_pickaxe.png",
            "../../woodensword.png",
            "../../stone_sword.png",
            "../../iron_sword.png",
            "../../golden_sword.png",
            "../../diamond_sword.png",
            "../../woodenshovel.png",
            "../../stone_shovel.png",
            "../../iron_shovel.png",
            "../../golden_shovel.png",
            "../../diamond_shovel.png",
            "../../wooden_axe.png",
            "../../stone_axe.png",
            "../../iron_axe.png",
            "../../golden_axe.png",
            "../../diamond_axe.png",
            "../../wooden_hoe.png",
            "../../stone_hoe.png",
            "../../iron_hoe.png",
            "../../golden_hoe.png",
            "../../diamond_hoe.png",
            "../../bowidle.png",
            "../../bowpull1.png",
            "../../bowpull2.png",
            "../../bowpull3.png",
            "../../stick.png",
            "../../sheer.png",
            "../../coal.png",
            "../../cowspawnegg.png",
            "../../chickenegg.png",
            "../../zombieegg.png",
            "../../creeper_spawn_egg.png",
            "../../snowzombiespawnegg.png.png",
            "../../huskspawnegg.png",
            "../../drownedspawnegg.png",
            "../../villager_spawn_egg.png",
            "../../pig_spawn_egg.png",
            "../../butcher.png",
            "../../farmer.png",
            "../../librarian.png",
            "../../priest.png",
            "../../smith.png",
            "../../skeleton_spawn_egg.png",
            "../../horse_spawn_egg.png",
            "../../furnace.png.png",
            "../../fire_1.png",
            "../../nether_portal.png",
            "../../farmland.png",
            "../../farmland_moist.png",
            "../../cut_sandstone.png",
            "../../chiseled_sandstone.png",
            "../../desert (3).png",

            // Missing Block Textures (Mineral/Special)
            "../../goldblock.png",
            "../../ironblock.png",
            "../../diamondblock.png",
            "../../gravel.png",
            "../../clay.png",
            "../../bricks.png",
            "../../smooth_stone.png",
            "../../stone_bricks.png",
            "../../paintingfront1by1.png",
            "../../1x1painting2.webp",
            "../../1x1painting3.png",
            "../../armorempty.png",
            "../../armorhalf.png",
            "../../armorfull.png",
            "../../paintingback.png",
            "../../grasslandfoliage.png",
            
            // Emeralds
            "../../emerald_ore.png",
            "../../emerald.png",
            "../../emerald_block.png",

            // Snow Biome Textures
            "../../snowygrassblockside.png",
            "../../snowygrassblocktop.png",
            "../../snow.png",
            "../../ice.png",
            "../../packedice.png",

            // Ensure apple, golden apple and oak sapling textures are loaded
            "../../wheat_seeds.png",
            "../../oaksapling.png",
            
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
            
            // Potatoes
            "../../potatoes_stage0.png",
            "../../potatoes_stage1.png",
            "../../potatoes_stage2.png",
            "../../potatoes_stage3.png",
            
            // Wheat
            "../../wheat.png",
            "../../map_background.png", // Map background
            "../../redstone_dust_dot.png", // Redstone Dot
            "../../redstone_dust_line0.png", // Redstone Line
            "../../redstone_block.png",
            "../../redstone_ore.png",
            "../../redstone_lamp.png",
            "../../redstone_lamp_on.png",
            "../../boat_icon.png",
            "../../dark_oak_boat.png",
            "../../oak_boat.png",
            "../../boat_planks.png", // Added boat planks texture
            "../../goldarmor.png", // Added gold armor texture
            "../../goldarmor2.png", // Added gold armor layer 2 texture
            "../../iron_layer_1.png",
            "../../iron_layer_2.png",
            "../../diamond_layer_1.png",
            "../../diamond_layer_2.png",

            // NEW: Glowstone Dust
            "../../glowstone_dust.png",
            
            // NEW: Snowball
            "../../snowball.png",
            
            // NEW: Ender Pearl
            "../../ender_pearl (1).png",

            // Armor Icons
            "../../gold_helmet.png",
            "../../gold_chestplate.png",
            "../../gold_leggings.png",
            "../../gold_boots.png",
            "../../iron_helmet.png",
            "../../iron_chestplate.png",
            "../../iron_leggings.png",
            "../../iron_boots.png",
            "../../diamond_helmet.png",
            "../../diamond_chestplate.png",
            "../../diamond_leggings.png",
            "../../diamond_boots.png",
            
            // Sandstone
            "../../sandstoneside.png",
            "../../sandstone_top.png",
            "../../sandstone_bottom.png",
            
            // NEW: TNT Textures
            "../../tnt_bottom.png",
            "../../tnt_top.png",
            "../../tnt_side.png",
            
            // Bed
            "../../bed.png",
            "../../red_mushroom.png",
            "../../brown_mushroom.png",
            "../../rail.png",
            "../../curvedrail.png",
            "../../minecart.png",
            "../../mycelium_top.png",
            "../../mycelium_side.png",
            "../../mushroom_stem.png",
            "../../brown_mushroom_block.png",
            "../../red_mushroom_block.png",
            "../../granite.png",
            "../../diorite.png",
            "../../andesite.png",
            "../../worldthumbnail (6).png",
            "../../structure_block (2).png",
            "../../commandblock.png",
            "../../command_block_front.png",
            "../../command_block_back.png",
            "../../command_block_side.png",
            "../../command_block_conditional.png",
            "../../dispenser_front.png",
            "../../lever.png",
            "../../stonesheet.png",
            "../../trapdoorsheet.png",
            "../../hay_block_top.png",
            "../../hay_block_side.png",
            "../../oak_leaves.png",
            "../../birch_leaves.png",
            "../../horse_gray (1).png",
            "../../horse_brown (1).png",
            "../../horse_white (1).png",
            "../../horse_creamy (1).png",
            "../../horse_black (1).png",
            "../../horse_darkbrown (1).png",
            "../../horse_skeleton (1).png",
            "../../horse_zombie (2).png",
            "../../donkey (1).png",
            "../../mule (1).png",
            "../../newblocksset1.png",
            "../../techstuff.png"
        ];

        // LAN server-list sprites: animated ping bars, join button states and
        // the two world-entry thumbnails.
        lazy.push("../../pinging_1.png");
        lazy.push("../../pinging_2.png");
        lazy.push("../../pinging_3.png");
        lazy.push("../../pinging_4.png");
        lazy.push("../../pinging_5.png");
        lazy.push("../../ping_unknown.png");
        lazy.push("../../join.png");
        lazy.push("../../join_highlighted.png");
        lazy.push("../../Server_pinging.png");
        lazy.push("../../server_found.png");

        // Ensure bucket textures are available (empty + water)
        lazy.push("../../bucket.png");
        lazy.push("../../water_bucket.png");
        lazy.push("../../lava.png");
        lazy.push("../../lava_bucket.png");
        lazy.push("../../saddle.png");

        // The default pack uses the canonical horizontal sprite sheets above.
        // These legacy one-sprite aliases are left for resource-pack
        // compatibility, but should not be requested by the default loader.
        const defaultAtlasAliases = new Set([
            "../../fishing_rod.png",
            "../../birch_log.png",
            "../../birch_log_top.png",
            "../../birch_planks.png",
            "../../birch_sapling.png",
            "../../tall_grass_bottom.png",
            "../../tall_grass_top.png",
            "../../paper.png",
            "../../sugar.png",
            "../../string.png",
            "../../raw_fish.png",
            "../../birch_boat_icon.png",
            "../../sprucelog.png",
            "../../spruceplanks.png",
            "../../sprucesaplings.png",
            "../../spruceleave.png",
            "../../white_tulip.png",
            "../../lily_of_the_valley.png",
            "../../dead_bush.png",
            "../../note_block.png",
            "../../emerald_ore.png",
            "../../redstone_dust_dot.png",
            "../../redstone_block.png",
            "../../redstone_ore.png",
            "../../smooth_stone.png",
            "../../hay_block_top.png",
            "../../hay_block_side.png",
            "../../birch_leaves.png",
            "../../goldblock.png",
            "../../ironblock.png",
            "../../diamondblock.png",
            "../../dispenser_front.png",
            "../../diamond.png",
            "../../flint_and_steel.png",
            "../../brick.png",
            "../../sheer.png",
            "../../iron_helmet.png",
            "../../iron_boots.png",
            "../../ironingot.png",
            "../../gold_ingot.png",
            "../../flint.png",
            "../../feather.png",
            "../../bone.png",
            "../../bone_meal.png",
            "../../gunpowder.png",
            "../../clay_ball.png",
            "../../leather.png",
            "../../woodenpickaxe.png",
            "../../stone_pickaxe.png",
            "../../iron_pickaxe.png",
            "../../golden_pickaxe.png",
            "../../diamond_pickaxe.png",
            "../../woodensword.png",
            "../../stone_sword.png",
            "../../iron_sword.png",
            "../../golden_sword.png",
            "../../diamond_sword.png",
            "../../woodenshovel.png",
            "../../stone_shovel.png",
            "../../iron_shovel.png",
            "../../golden_shovel.png",
            "../../diamond_shovel.png",
            "../../wooden_axe.png",
            "../../stone_axe.png",
            "../../iron_axe.png",
            "../../golden_axe.png",
            "../../diamond_axe.png",
            "../../wooden_hoe.png",
            "../../stone_hoe.png",
            "../../iron_hoe.png",
            "../../golden_hoe.png",
            "../../diamond_hoe.png"
        ]);

        const resources = {};
        const placeholder = this.createPlaceholder();
        const uniqueLazy = [...new Set(lazy.filter(path => !defaultAtlasAliases.has(path)))];

        // Initialize all lazy resources with placeholder immediately
        for (const path of uniqueLazy) {
            resources[path] = placeholder;
        }
        // Keep legacy keys addressable for resource-pack alias matching
        // without issuing default-pack requests for their individual files.
        for (const path of defaultAtlasAliases) {
            resources[path] = placeholder;
        }

        // Load essential textures first (wait for them)
        await Promise.all(essential.map(async path => {
            resources[path] = await this.loadTexture(path);
        }));

        // Launch game immediately with essential resources
        this.minecraft = new Minecraft(canvasWrapperId, resources);
        this.minecraft.assetsLoading = true;
        
        // Use non-enumerable property to prevent external scripts (like PostHog) 
        // from attempting to deep-clone the complex Minecraft engine object.
        Object.defineProperty(window, 'app', {
            value: this.minecraft,
            enumerable: false,
            configurable: true,
            writable: true
        });

        // Load lazy textures in small batches. Starting hundreds of image
        // decodes at once creates a large CPU/GPU upload burst and keeps every
        // decoded bitmap alive at the same time.
        const concurrency = 12;
        const loadLazyAssets = async () => {
            for (let i = 0; i < uniqueLazy.length; i += concurrency) {
                const batch = uniqueLazy.slice(i, i + concurrency);
                await Promise.all(batch.map(async path => {
                    const img = await this.loadTexture(path);

                    if (window.app && window.app.originalResources) {
                        window.app.originalResources[path] = img;
                    }

                    if (resources[path] === placeholder) {
                        resources[path] = img;
                    }

                }));
                // Yield to rendering and input between batches without
                // turning every asset into a separate timer task.
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
        };

        loadLazyAssets().then(() => {
            if (window.app) {
                window.app.assetsLoading = false;
                window.app.refreshTextures(false);
            }
        });

        this.minecraft.screenRenderer.initialize();
        // this.minecraft.worldRenderer.initialize();

        // Launch game on canvas
    }
}

// Launch game
new Start().launch("canvas-container"); 
