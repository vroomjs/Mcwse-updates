import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import MathHelper from "../../../util/MathHelper.js";
import JSZip from "jszip";

export default class GuiResourcePacks extends GuiScreen {

    constructor(previousScreen) {
        super();
        this.previousScreen = previousScreen;
        this.status = "Manage your game textures";
        this.savedPacks = [];
        this.isLoading = true;
        this.scrollY = 0;
        
        // Define layouts for cutting and re-stitching
        this.sheetLayouts = {
            "blocks.png": { 
                cols: 14, rows: 1, folder: "blocks", 
                names: ["dirt", "grass_block_side", "grass_block_top", "stone", "cobblestone", "mossy_cobblestone_base", "oak_log_top", "oak_log", "oak_planks", "sand_base", "glass", "torch", "water_still", "bedrock"]
            },
            "stonesheet.png": { 
                cols: 8, rows: 1, folder: "blocks", 
                names: ["smooth_stone", "chiseled_stone_bricks", "stone_bricks", "mossy_stone_bricks", "cracked_stone_bricks", "stone_variant", "cobblestone_variant", "mossy_cobblestone"]
            },
            "orestuff.png": { 
                cols: 14, rows: 1, folder: "blocks", 
                names: ["coal_ore", "coal_block", "iron_ore", "iron_block", "redstone_ore", "redstone_block", "diamond_ore", "diamond_block", "emerald_ore", "emerald_block", "gold_ore", "gold_block", "lapis_ore", "lapis_block"]
            },
            "nether.png": { 
                cols: 5, rows: 1, folder: "blocks", 
                names: ["netherrack", "soul_sand", "obsidian", "glowstone", "quartz_ore"]
            },
            "farming.png": { 
                cols: 20, rows: 1, folder: "items", 
                names: ["wheat_item", "seeds_item", "hay_bale_side", "hay_bale_top", "wheat_stage_0", "wheat_stage_1", "wheat_stage_2", "wheat_stage_3", "wheat_stage_4", "wheat_stage_5", "wheat_stage_6", "wheat_stage_7", "carrots_stage_0", "carrots_stage_1", "carrots_stage_2", "carrots_stage_3", "potatoes_stage_0", "potatoes_stage_1", "potatoes_stage_2", "potatoes_stage_3"]
            },
            "food.png": { 
                cols: 18, rows: 1, folder: "items", 
                names: ["apple", "golden_apple", "carrot", "golden_carrot", "potato", "baked_potato", "bread", "beef", "cooked_beef", "raw_chicken", "cooked_chicken", "raw_porkchop", "cooked_porkchop", "rotten_flesh", "salmon", "cooked_salmon", "raw_fish", "cooked_fish"]
            },
            "items (1).png": { 
                cols: 37, rows: 1, folder: "items", 
                names: ["ender_pearl", "book", "paper", "sugar", "snowball", "oak_boat", "spruce_boat", "birch_boat", "dark_oak_boat", "acacia_boat", "saddle", "minecart", "lava_bucket", "bucket", "water_bucket", "coal", "diamond", "brick", "gold_ingot", "iron_ingot", "stick", "feather", "gunpowder", "leather", "clay_ball", "bone_meal", "bone", "glowstone_dust", "flint", "string", "arrow", "name_tag", "rail", "rail_corner", "powered_rail_on", "powered_rail", "ladder"]
            },
            "tools (1).png": { 
                cols: 43, rows: 1, folder: "items", 
                names: ["wooden_sword", "wooden_shovel", "wooden_pickaxe", "wooden_hoe", "wooden_axe", "stone_sword", "stone_shovel", "stone_pickaxe", "stone_hoe", "stone_axe", "iron_sword", "iron_shovel", "iron_pickaxe", "iron_hoe", "iron_axe", "golden_sword", "golden_shovel", "golden_pickaxe", "golden_hoe", "golden_axe", "diamond_sword", "diamond_shovel", "diamond_pickaxe", "diamond_hoe", "diamond_axe", "iron_boots", "iron_chestplate", "iron_helmet", "gold_helmet", "gold_leggings", "diamond_leggings", "gold_chestplate", "gold_boots", "diamond_chestplate", "diamond_helmet", "iron_leggings", "diamond_boots", "bow_idle", "shears", "flint_and_steel", "map_icon", "fishing_rod", "fishing_rod_cast"]
            },
            "chest.png.png": { 
                cols: 3, rows: 1, folder: "entity", 
                names: ["chest_front", "chest_side", "chest_top"]
            },
            "furnace.png.png": { 
                cols: 4, rows: 1, folder: "entity", 
                names: ["furnace_front_lit", "furnace_front", "furnace_side", "furnace_top"]
            },
            "pumpkin.png.png": { 
                cols: 4, rows: 1, folder: "blocks", 
                names: ["pumpkin_top", "pumpkin_side", "pumpkin_front", "jack_o_lantern"]
            },
            "bed.png": { 
                cols: 4, rows: 2, folder: "entity", 
                names: ["bed_top_head", "bed_top_foot", "bed_side_head", "bed_side_foot", "bed_bottom_head", "bed_bottom_foot", "bed_end_head", "bed_end_foot"]
            },
            "magma3sheet.png": { 
                cols: 3, rows: 1, folder: "blocks", 
                names: ["magma_0", "magma_1", "magma_2"]
            },
            "grasslandfoliage.png": { 
                cols: 5, rows: 1, folder: "blocks", 
                names: ["rose", "dandelion", "paeonia", "short_grass", "fern"]
            },
            "deadandsugar.png.png": { 
                cols: 2, rows: 1, folder: "blocks", 
                names: ["dead_bush", "sugar_cane"]
            },
            "breakanimation.png": { 
                cols: 6, rows: 1, folder: "misc", 
                names: ["destroy_stage_0", "destroy_stage_1", "destroy_stage_2", "destroy_stage_3", "destroy_stage_4", "destroy_stage_5"]
            },
            "trapdoorsheet.png": { 
                cols: 6, rows: 1, folder: "blocks", 
                names: ["birch_trapdoor", "dark_oak_trapdoor", "oak_trapdoor", "spruce_trapdoor", "acacia_trapdoor", "iron_trapdoor"]
            },
            "coloredglass.png": { 
                cols: 14, rows: 1, folder: "blocks", 
                names: ["glass_lime", "glass_green", "glass_pink", "glass_orange", "glass_cyan", "glass_white", "glass_light_blue", "glass_magenta", "glass_yellow", "glass_gray", "glass_black", "glass_blue", "glass_brown", "glass_light_gray"]
            },
            "desert (1).png": { 
                cols: 10, rows: 1, folder: "blocks", 
                names: ["desert_sand", "desert_sugar_cane", "desert_sandstone_side", "desert_sandstone_top", "desert_cut_sandstone", "desert_chiseled_sandstone", "desert_sandstone_bottom", "unused_desert", "glass_clear", "desert_dead_bush"]
            },
            "beetroot (1).png": {
                cols: 7, rows: 1, folder: "items",
                names: ["beetroot_seeds", "beetroot", "beetroot_soup", "beetroots_stage_0", "beetroots_stage_1", "beetroots_stage_2", "beetroots_stage_3"]
            },
            "dye.png": {
                cols: 16, rows: 1, folder: "items",
                names: ["dye_cyan", "dye_brown", "dye_green", "dye_black", "dye_white", "dye_purple", "dye_red", "dye_yellow", "dye_light_gray", "dye_light_blue", "dye_gray", "dye_pink", "dye_blue", "dye_lime", "dye_magenta", "dye_orange"]
            },
            "wools.png": {
                cols: 15, rows: 1, folder: "blocks",
                names: ["white_wool", "brown_wool", "light_blue_wool", "cyan_wool", "green_wool", "orange_wool", "gray_wool", "black_wool", "purple_wool", "yellow_wool", "lime_wool", "pink_wool", "red_wool", "light_gray_wool", "blue_wool"]
            },
            "terracottahseet.png": {
                cols: 31, rows: 1, folder: "blocks",
                names: ["terracotta", "brown_terracotta", "orange_terracotta", "green_terracotta", "light_blue_terracotta", "purple_terracotta", "gray_terracotta", "pink_terracotta", "white_terracotta", "black_terracotta", "lime_terracotta", "cyan_terracotta", "light_gray_terracotta", "red_terracotta", "yellow_terracotta", "magenta_terracotta", "red_glazed_terracotta", "orange_glazed_terracotta", "yellow_glazed_terracotta", "lime_glazed_terracotta", "blue_glazed_terracotta", "magenta_glazed_terracotta", "pink_glazed_terracotta", "gray_glazed_terracotta", "light_gray_glazed_terracotta", "cyan_glazed_terracotta", "purple_glazed_terracotta", "brown_glazed_terracotta", "green_glazed_terracotta", "black_glazed_terracotta", "white_glazed_terracotta"]
            },
            "signs.png": {
                cols: 5, rows: 1, folder: "items",
                names: ["sign_dark_oak", "sign_spruce", "sign_acacia", "sign_oak", "sign_birch"]
            },
            "food2.png": {
                cols: 5, rows: 1, folder: "items",
                names: ["cookie", "bowl", "mushroom_stew", "raw_mutton", "cooked_mutton"]
            },
            "slimestuff.png": {
                cols: 2, rows: 1, folder: "items",
                names: ["slimeball", "slimeblock"]
            },
            "dicsandbox (1).png": {
                cols: 14, rows: 1, folder: "items",
                names: ["disc_11", "disc_13", "disc_blocks", "disc_cat", "disc_chirp", "disc_far", "disc_mall", "disc_mellohi", "disc_stal", "disc_strad", "disc_wait", "disc_ward", "jukebox_side", "jukebox_top"]
            },
            "critandnote.png": {
                cols: 2, rows: 1, folder: "misc",
                names: ["crit", "note"]
            },
            "bottles.png": {
                cols: 3, rows: 1, folder: "items",
                names: ["splash_bottle", "potion_bottle", "potion_overlay"]
            },
            "water_flow (4).png": {
                cols: 1, rows: 32, folder: "environment",
                names: Array.from({length:32}, (_, i) => `water_flow_${i}`)
            },
            "foliage.png": {
                cols: 21, rows: 1, folder: "blocks",
                names: ["short_grass", "tall_grass_bottom", "tall_grass_top", "fern", "double_fern_bottom", "double_fern_top", "vines", "dandelion", "poppy", "lily_of_the_valley", "rose_bush_top", "rose_bush_bottom", "peony_top", "peony_bottom", "white_tulip", "pink_tulip", "red_tulip", "lilac_top", "lilac_bottom", "azure_bluet", "allium"]
            },
            "desert (3).png": {
                cols: 11, rows: 1, folder: "blocks",
                names: ["desert_bamboo", "desert_sand", "desert_sandstone_side", "desert_sandstone_top", "desert_cut_sandstone", "desert_chiseled_sandstone", "desert_sandstone_bottom", "desert_cactus_top", "desert_cactus_side", "desert_dead_bush", "unknown_void"]
            },
            "smoke.png": {
                cols: 8, rows: 1, folder: "misc",
                names: ["smoke_0", "smoke_1", "smoke_2", "smoke_3", "smoke_4", "smoke_5", "smoke_6", "smoke_7"]
            },
            "crossbow.png": {
                cols: 5, rows: 1, folder: "items",
                names: ["crossbow_standby", "crossbow_pulling_0", "crossbow_pulling_1", "crossbow_pulling_2", "crossbow_arrow"]
            },
            "endstuff.png": {
                cols: 7, rows: 1, folder: "blocks",
                names: ["end_portal", "eye_of_ender", "end_portal_frame_side", "end_portal_frame_top_empty", "end_portal_frame_top_filled", "end_stone", "end_stone_bricks"]
            },
            "treestuff.png": {
                cols: 30, rows: 1, folder: "blocks",
                names: [
                    "oak_sapling", "spruce_sapling", "birch_sapling", "acacia_sapling", "dark_oak_sapling", "oak_leaves_regular",
                    "oak_log_top", "oak_log", "stripped_oak", "oak_planks", "oak_leaves", "dark_oak_log_top",
                    "dark_oak_log", "stripped_dark_oak", "spruce_planks", "birch_leaves", "birch_log_top", "birch_log",
                    "stripped_birch", "birch_planks", "acacia_leaves", "acacia_log_top", "acacia_log", "stripped_acacia",
                    "acacia_planks", "spruce_leaves", "spruce_log_top", "spruce_log", "stripped_spruce", "dark_oak_planks"
                ]
            },
            "sandstuff.png": {
                cols: 10, rows: 1, folder: "blocks",
                names: ["sand", "sandstone", "sandstone_top", "cut_sandstone", "chiseled_sandstone", "sandstone_bottom", "sandstone_unused_6", "sandstone_unused_7", "sandstone_unused_8", "sandstone_unused_9"]
            },
            "craftingtablesheet.png": {
                cols: 3, rows: 1, folder: "blocks",
                names: ["crafting_table_top", "crafting_table_front", "crafting_table_side"]
            },
            "newblocksset1.png": {
                cols: 9, rows: 1, folder: "blocks",
                names: ["sponge", "wet_sponge", "polished_andesite", "polished_diorite", "polished_granite", "new_block_5", "grass_path_side", "grass_path_top", "lily_pad"]
            },
            "All doors.png": {
                cols: 17, rows: 1, folder: "blocks",
                names: ["door_unused_0", "door_unused_1", "door_unused_2", "door_unused_3", "door_unused_4", "oak_door_top", "oak_door_bottom", "birch_door_top", "birch_door_bottom", "iron_door_top", "iron_door_bottom", "spruce_door_top", "spruce_door_bottom", "dark_oak_door_top", "dark_oak_door_bottom", "acacia_door_top", "acacia_door_bottom"]
            }
        };
    }

    init() {
        super.init();

        if (this.isLoading) {
            import("../../world/storage/WorldStorage.js").then(module => {
                module.default.getResourcePackList().then(list => {
                    this.savedPacks = list;
                    this.isLoading = false;
                    this.init();
                }).catch(err => {
                    console.error("Failed to load resource packs:", err);
                    this.savedPacks = [];
                    this.isLoading = false;
                    this.init();
                });
            }).catch(err => {
                console.error("Failed to load WorldStorage module:", err);
                this.isLoading = false;
                this.init();
            });
            return;
        }

        const centerX = this.width / 2;

        this.buttonList.push(new GuiButton("Upload Pack (.zip)", centerX - 154, this.height - 48, 150, 20, () => {
            this.minecraft.window._openTextureZipPicker();
        }));

        this.buttonList.push(new GuiButton("Default Pack", centerX + 4, this.height - 48, 150, 20, () => {
            this.minecraft.settings.activeResourcePack = null;
            this.minecraft.settings.save();
            this.minecraft.refreshTextures(true);
            this.init();
        }));

        this.buttonList.push(new GuiButton("Download Template", centerX - 154, this.height - 24, 150, 20, () => {
            this.downloadDefaultPack();
        }));

        this.buttonList.push(new GuiButton("Done", centerX + 4, this.height - 24, 150, 20, () => {
            this.minecraft.displayScreen(this.previousScreen);
        }));
    }

    handleMouseScroll(delta) {
        const listTop = 32;
        const listBottom = this.height - 64;
        const viewH = listBottom - listTop;
        const totalH = this.savedPacks.length * 36;
        if (totalH > viewH) {
            this.scrollY = MathHelper.clamp(this.scrollY + delta * 30, 0, totalH - viewH);
        }
    }

    async downloadDefaultPack() {
        this.status = "Generating pack... please wait";
        const zip = new JSZip();
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        for (const [resKey, img] of Object.entries(this.minecraft.resources)) {
            if (!img || img.width <= 1) continue;

            const fileName = resKey.split('/').pop();
            const layout = this.sheetLayouts[fileName];

            if (layout) {
                // Cut sheet into individual files
                const sw = Math.floor(img.width / layout.cols);
                const sh = Math.floor(img.height / layout.rows);
                canvas.width = sw;
                canvas.height = sh;

                for (let r = 0; r < layout.rows; r++) {
                    for (let c = 0; c < layout.cols; c++) {
                        ctx.clearRect(0, 0, sw, sh);
                        ctx.drawImage(img, c * sw, r * sh, sw, sh, 0, 0, sw, sh);
                        
                        const blob = await new Promise(resolve => canvas.toBlob(resolve));
                        const idx = r * layout.cols + c;
                        const spriteName = (layout.names && layout.names[idx]) ? layout.names[idx] : `sprite_${idx}`;
                        zip.file(`${layout.folder}/${spriteName}.png`, blob);
                    }
                }
            } else {
                // Standard single texture
                // Determine folder
                let folder = "misc";
                if (resKey.includes("gui/")) folder = "gui";
                else if (resKey.includes("char.png")) folder = "entity";
                else if (resKey.includes("terrain/")) folder = "environment";
                
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.clearRect(0, 0, img.width, img.height);
                ctx.drawImage(img, 0, 0);
                const blob = await new Promise(resolve => canvas.toBlob(resolve));
                // Use the canonical block name for the oak bookshelf sprite.
                // The runtime still keeps the legacy internal resource key.
                const exportedFileName = fileName === "bookshelf.png" ? "oak_bookshelf.png" : fileName;
                zip.file(`${folder}/${exportedFileName}`, blob);
            }
        }

        const content = await zip.generateAsync({type: "blob"});
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Default_Texture_Pack.zip";
        a.click();
        URL.revokeObjectURL(url);
        
        this.status = "Pack downloaded successfully!";
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        this.drawDefaultBackground(stack);
        this.drawCenteredString(stack, "Select Resource Packs", this.width / 2, 8);
        this.drawCenteredString(stack, "§cWORK IN PROGRESS - Many packs will not work.", this.width / 2, 18);

        if (this.isLoading) {
            this.drawCenteredString(stack, "Loading packs...", this.width / 2, this.height / 2, 0xAAAAAA);
        } else {
            const listTop = 32;
            const listBottom = this.height - 64;
            const listX = this.width / 2 - 130;
            const listW = 260;
            const slotH = 36;

            stack.save();
            stack.beginPath();
            stack.rect(listX, listTop, listW, listBottom - listTop);
            stack.clip();

            for (let i = 0; i < this.savedPacks.length; i++) {
                const pack = this.savedPacks[i];
                const y = listTop + i * slotH - this.scrollY;
                if (y + slotH < listTop || y > listBottom) continue;

                const isActive = this.minecraft.settings.activeResourcePack === pack.name;
                const isHovered = mouseX >= listX && mouseX <= listX + listW && mouseY >= y && mouseY < y + slotH && mouseY >= listTop && mouseY <= listBottom;

                this.drawRect(stack, listX, y, listX + listW, y + slotH - 2, "rgba(0,0,0,0.5)");
                if (isActive) {
                    this.drawRect(stack, listX, y, listX + listW, y + slotH - 2, "rgba(255,255,255,0.1)");
                }

                this.drawStringNoShadow(stack, pack.name, listX + 5, y + 5, isActive ? 0x55FF55 : 0xFFFFFF);
                const sizeKB = (pack.size / 1024).toFixed(0) + " KB";
                this.drawStringNoShadow(stack, sizeKB, listX + 5, y + 16, 0x808080);

                // Draw Mini Buttons for selection/delete
                const btnY = y + 4;
                const selectX = listX + listW - 60;
                const deleteX = listX + listW - 30;
                const btnSize = 22;

                // Use drawButton logic for miniature buttons
                const drawMiniBtn = (bx, by, color, text, textColor, hovered) => {
                    // Border
                    this.drawRect(stack, bx, by, bx + btnSize, by + btnSize, "#000000");
                    // Top/Left highlights
                    this.drawRect(stack, bx + 1, by + 1, bx + btnSize - 1, by + btnSize - 1, hovered ? "#FFFFFF" : "#A0A0A0");
                    // Main face
                    this.drawRect(stack, bx + 2, by + 2, bx + btnSize - 1, by + btnSize - 1, color);
                    // Text
                    this.drawCenteredStringNoShadow(stack, text, bx + btnSize / 2, by + btnSize / 2 - 4, textColor);
                };

                // Select Icon (ON)
                drawMiniBtn(selectX, btnY, isActive ? "#55FF55" : "#505050", "ON", isActive ? 0x000000 : 0xFFFFFF, mouseX >= selectX && mouseX < selectX + btnSize && mouseY >= btnY && mouseY < btnY + btnSize);

                // Delete Icon (X)
                drawMiniBtn(deleteX, btnY, "#AA0000", "X", 0xFFFFFF, mouseX >= deleteX && mouseX < deleteX + btnSize && mouseY >= btnY && mouseY < btnY + btnSize);
            }

            stack.restore();
            
            if (this.savedPacks.length === 0) {
                this.drawCenteredString(stack, "No custom packs found.", this.width / 2, this.height / 2, 0x606060);
            }
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        const listTop = 32;
        const listBottom = this.height - 64;
        const listX = this.width / 2 - 130;
        const listW = 260;
        const slotH = 36;

        if (mouseX >= listX && mouseX <= listX + listW && mouseY >= listTop && mouseY <= listBottom) {
            const idx = Math.floor((mouseY - listTop + this.scrollY) / slotH);
            if (idx >= 0 && idx < this.savedPacks.length) {
                const pack = this.savedPacks[idx];
                const y = listTop + idx * slotH - this.scrollY;
                const btnY = y + 4;
                const selectX = listX + listW - 60;
                const deleteX = listX + listW - 30;

                if (mouseX >= selectX && mouseX <= selectX + 24 && mouseY >= btnY && mouseY <= btnY + 24) {
                    this.minecraft.settings.activeResourcePack = pack.name;
                    this.minecraft.settings.save();
                    
                    // Minecraft.js refreshTextures will now show the loading screen automatically
                    this.minecraft.refreshTextures(true);
                    this.minecraft.soundManager.playSound("random.click", 0,0,0, 1, 1);
                } else if (mouseX >= deleteX && mouseX <= deleteX + 24 && mouseY >= btnY && mouseY <= btnY + 24) {
                    import("../../world/storage/WorldStorage.js").then(module => {
                        module.default.deleteResourcePack(pack.name).then(() => {
                            if (this.minecraft.settings.activeResourcePack === pack.name) {
                                this.minecraft.settings.activeResourcePack = null;
                                this.minecraft.settings.save();
                                this.minecraft.refreshTextures(true);
                            }
                            this.savedPacks = this.savedPacks.filter(p => p.name !== pack.name);
                            this.init();
                        });
                    });
                }
            }
        }

        super.mouseClicked(mouseX, mouseY, mouseButton);
    }
}
