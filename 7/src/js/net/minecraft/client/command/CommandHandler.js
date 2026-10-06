import Block from "../world/block/Block.js";
import EntityLiving from "../entity/EntityLiving.js";
import EntityCow from "../entity/passive/EntityCow.js";
import EntityChicken from "../entity/passive/EntityChicken.js";
import EntityZombie from "../entity/monster/EntityZombie.js";
import EntityCreeper from "../entity/monster/EntityCreeper.js";
import { BlockRegistry } from "../world/block/BlockRegistry.js";
import EntitySnowZombie from "../entity/monster/EntitySnowZombie.js";
import EntityHusk from "../entity/monster/EntityHusk.js";
import EntityDrowned from "../entity/monster/EntityDrowned.js";
import EntityZombieVillager from "../entity/monster/EntityZombieVillager.js";
import EntityVillager from "../entity/passive/EntityVillager.js";
import EntityPig, { EntitySaddledPig } from "../entity/passive/EntityPig.js";
import EntitySkeleton from "../entity/monster/EntitySkeleton.js";
import EntitySnowGolem from "../entity/passive/EntitySnowGolem.js";
import EntitySheep from "../entity/passive/EntitySheep.js";
import EntitySpider from "../entity/monster/EntitySpider.js";
import EntitySlime from "../entity/monster/EntitySlime.js";
import EntityEnderman from "../entity/monster/EntityEnderman.js";
import EntityIronGolem from "../entity/passive/EntityIronGolem.js";
import EntityHorse from "../entity/passive/EntityHorse.js";
import EntityHorseSkeleton from "../entity/passive/EntityHorseSkeleton.js";
import EntityHorseZombie from "../entity/passive/EntityHorseZombie.js";
import EntityDonkey from "../entity/passive/EntityDonkey.js";
import EntityMule from "../entity/passive/EntityMule.js";
import EntityCat from "../entity/passive/EntityCat.js";
import EntityBlockDisplay from "../entity/EntityBlockDisplay.js";
import BlockLight from "../world/block/type/BlockLight.js";
import JSZip from "jszip";
import { 
    buildVillage, 
    buildVillageHouse1, 
    buildVillageHouse2, 
    buildVillageHouse3, 
    buildVillageTower1, 
    buildVillageWell, 
    buildBlacksmith,
    buildFarm,
    buildIgloo,
    buildDesertWell,
    buildDungeon
} from "../../../../../../structures.js";
import { EntityMinecart } from "../../../../../../Minecarts.js";
import SpruceTreeGenerator from "../world/generator/structure/SpruceTreeGenerator.js";
import PrimedTNT from "../entity/PrimedTNT.js";
import EntityArrow from "../entity/EntityArrow.js";
import EntitySnowball from "../entity/EntitySnowball.js";
import EntityEnderPearl from "../entity/EntityEnderPearl.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";

export default class CommandHandler {

    constructor(minecraft) {
        this.minecraft = minecraft;
        
        // Map common item names to IDs for /give command
        this.itemMap = {
            "stone": 1, "grass": 2, "dirt": 3, "cobblestone": 4, "planks": 5, "bedrock": 7,
            "water": 9, "sand": 12, "gravel": 13, "gold_ore": 14, "iron_ore": 15, "coal_ore": 16,
            "coal_block": 173, "lapis_ore": 21, "lapis_block": 22,
            "log": 17, "leaves": 18, "glass": 20, "foliage": 31, "fern": 32,
            "dandelion": 37, "rose": 38, "paeonia": 39, "gold_block": 41, "iron_block": 42, "torch": 50, "chest": 54, "bookshelf": 47, "pressure_plate": 72,
            "diamond_ore": 56, "diamond_block": 57, "crafting_table": 58, "furnace": 61, "door": 64, "button": 77,
            "clay": 82, "bricks": 45, "smooth_stone": 43, "stone_bricks": 98,
            "pumpkin": 86, "carved_pumpkin": 86, "jack_o_lantern": 91,
            "sponge": 560, "wet_sponge": 561, "polished_andesite": 562, "polished_diorite": 563, "polished_granite": 564, "iron_bars": 565, "lily_pad": 567, "lilypad": 567,
            "iron_shovel": 256, "iron_pickaxe": 257, "iron_axe": 258, "bow": 261, "coal": 263,
            "diamond": 264, "iron_ingot": 265, "gold_ingot": 266, "quartz": 415,
            "quartz_block": 155, "chiseled_quartz": 156, "quartz_pillar": 157,
            "crossbow": 499, "pistol": 568, "note_block": 25,
            "oak_door": 64, "birch_door": 205, "spruce_door": 219, "acacia_door": 426, "dark_oak_door": 427, "iron_door": 71, "cactus": 81, "vine": 106, "vines": 106,
            "acacia_log": 235, "dark_oak_log": 253, "stripped_oak_log": 254,
            "stripped_birch_log": 300, "stripped_spruce_log": 301,
            "stripped_acacia_log": 302, "stripped_dark_oak_log": 303,
            "acacia_planks": 304, "dark_oak_planks": 305,
            "acacia_sapling": 323, "dark_oak_sapling": 324,
            "acacia_leaves": 325, "dark_oak_leaves": 326,
            "wooden_sword": 268, "stone_sword": 272, "iron_sword": 267, "golden_sword": 283, "diamond_sword": 276,
            "wooden_shovel": 269, "wooden_pickaxe": 270, "wooden_axe": 271,
            "stone_shovel": 273, "stone_pickaxe": 274, "stone_axe": 275,
            "diamond_shovel": 277, "diamond_pickaxe": 278, "diamond_axe": 279,
            "wooden_hoe": 290, "stone_hoe": 291, "iron_hoe": 292, "diamond_hoe": 293, "golden_hoe": 294,
            "stick": 280, "gold_shovel": 284, "gold_pickaxe": 285, "gold_axe": 286,
            "bone": 352, "bonemeal": 351, "bone_meal": 351,
            "shears": 359, "bucket": 361, "water_bucket": 362, "lava_bucket": 368, "cow_spawn_egg": 390, "chicken_spawn_egg": 391,
            "zombie_spawn_egg": 392, "zombie_villager_spawn_egg": 520, "creeper_spawn_egg": 393,
            "flint": 318, "flint_and_steel": 259, "feather": 288, "gunpowder": 289,
            "powered_rail": 158, "active_powered_rail": 159,
            "beef": 363, "steak": 364, "cooked_beef": 364,
            "porkchop": 319, "raw_porkchop": 319, "cooked_porkchop": 320,
            "chicken": 365, "raw_chicken": 365, "cooked_chicken": 366,
            "rotten_flesh": 367,
            "brick": 336, "clay_ball": 337,
            "leather": 334, "fence": 85, "fence_gate": 107, "gate": 107, 
            "cobblestone_wall": 139, "stone_brick_wall": 140, "sandstone_wall": 143, "brick_wall": 144, "end_stone_brick_wall": 138, "wall": 139,
            "mossy_cobblestone": 48, "chiseled_stone_bricks": 97, "mossy_stone_bricks": 109, "cracked_stone_bricks": 108,
            "snow_zombie_spawn_egg": 394,
            "husk_spawn_egg": 395,
            "drowned_spawn_egg": 396,
            "cat_spawn_egg": 526,
            "villager_spawn_egg": 397,
            "pig_spawn_egg": 398,
            "saddled_pig_spawn_egg": 407,
            "horse_spawn_egg": 521,
            "donkey_spawn_egg": 522,
            "mule_spawn_egg": 523,
            "zombie_horse_spawn_egg": 524,
            "skeleton_horse_spawn_egg": 525,
            "cat_spawn_egg": 526,
            "skeleton_spawn_egg": 399,
            "snow_golem_spawn_egg": 401,
            "spider_spawn_egg": 417,
            "potato": 405, "baked_potato": 406,
            "wheat": 296, "bread": 297, "seeds": 402,
            "redstone": 331, "redstone_dust": 331, "redstone_torch": 76,
            "book": 340,
            "boat": 333, "oak_boat": 333, "birch_boat": 411, "spruce_boat": 412, "dark_oak_boat": 424, "acacia_boat": 425, "sandstone": 24,
            "cookie": 357, "mutton": 494, "raw_mutton": 494, "cooked_mutton": 495, "bowl": 281, "mushroom_stew": 282,
            "gold_helmet": 314, "gold_chestplate": 315, "gold_leggings": 316, "gold_boots": 317,
            "saddle": 408,
            "snowball": 410, "rail": 66,
            "snow_slab": 193, "snow_stairs": 194,
            "hay_bale": 170, "haybale": 170,
            "minecart": 328, "spruce_log": 209, "spruce_planks": 210, "spruce_sapling": 211, "spruce_leaves": 212,
            "ender_pearl": 413, "enderpearl": 413, "mycelium": 110, "mushroom_stem": 99, "brown_mushroom_block": 100, "red_mushroom_block": 162,
            "granite": 220, "diorite": 221, "andesite": 222, "fishing_rod": 346,
            "string": 287, "fish": 349, "raw_fish": 349, "cooked_fish": 350, "cod": 349, "cooked_cod": 350,
            "salmon": 354, "cooked_salmon": 355, "command_block": 137,
            "jukebox": 84, "ladder": 65, "dispenser": 23, "name_tag": 414, "nametag": 414, "skeleton_head": 168, "zombie_head": 169, "creeper_head": 171, "enderman_head": 172,
            "disc_11": 2200, "disc_13": 2201, "disc_blocks": 2202, "disc_cat": 2203, "disc_chirp": 2204, "disc_far": 2205, "disc_mall": 2206, "disc_mellohi": 2207, "disc_stal": 2208, "disc_strad": 2209, "disc_wait": 2210, "disc_ward": 2211,
            "tnt": 46, "primed_tnt": 46,
            "fire": 51, "flame": 51, "magma": 236,
            "lime_stained_glass": 237, "green_stained_glass": 238, "pink_stained_glass": 239,
            "orange_stained_glass": 240, "cyan_stained_glass": 241, "white_stained_glass": 242,
            "light_blue_stained_glass": 243, "magenta_stained_glass": 244, "yellow_stained_glass": 245,
            "gray_stained_glass": 246, "black_stained_glass": 247, "blue_stained_glass": 248,
            "brown_stained_glass": 249, "light_gray_stained_glass": 250,
            "oak_trapdoor": 96, "birch_trapdoor": 224, "dark_oak_trapdoor": 225,
            "spruce_trapdoor": 226, "acacia_trapdoor": 227, "iron_trapdoor": 228,
            "beetroot_seeds": 421, "beetroot": 422, "beetroot_soup": 423, "beetroots": 420,
            "cyan_dye": 430, "brown_dye": 431, "green_dye": 432, "black_dye": 433,
            "white_dye": 434, "purple_dye": 435, "red_dye": 436, "yellow_dye": 437,
            "light_gray_dye": 438, "light_blue_dye": 439, "gray_dye": 440, "pink_dye": 441,
            "blue_dye": 442, "lime_dye": 443, "magenta_dye": 444, "orange_dye": 445,
            "terracotta": 450, "brown_terracotta": 451, "orange_terracotta": 452, "green_terracotta": 453, "light_blue_terracotta": 454, "purple_terracotta": 455, "gray_terracotta": 456, "pink_terracotta": 457, "white_terracotta": 458, "black_terracotta": 459, "lime_terracotta": 460, "cyan_terracotta": 461, "light_gray_terracotta": 462, "red_terracotta": 463, "yellow_terracotta": 464, "magenta_terracotta": 465,
            "red_glazed_terracotta": 466, "orange_glazed_terracotta": 467, "yellow_glazed_terracotta": 468, "lime_glazed_terracotta": 469, "blue_glazed_terracotta": 470, "magenta_glazed_terracotta": 471, "pink_glazed_terracotta": 472, "gray_glazed_terracotta": 473, "light_gray_glazed_terracotta": 474, "cyan_glazed_terracotta": 475, "purple_glazed_terracotta": 476, "brown_glazed_terracotta": 477, "green_glazed_terracotta": 478, "black_glazed_terracotta": 479, "white_glazed_terracotta": 480,
            "glass_bottle": 550, "water_bottle": 551, "splash_potion": 552,
            "piston": 29, "sticky_piston": 30, "piston_head": 31,
            "piston_base": 29, "sticky_piston_base": 30,
            "repeater": 158, "observer": 161,
            "barrier": 816, "farmland": 62, "grass_path": 566,
            "sweet_berries": 570, "cobweb": 571, "bone_block": 572, "dropper": 573, "sweet_berry_bush": 574
        };
        // Light blocks
        for (let i = 0; i <= 15; i++) {
            this.itemMap["light_" + i] = 800 + i;
        }

        // Map mob names to Entity classes
        this.mobMap = {
            "cow": EntityCow,
            "minecart": EntityMinecart,
            "chicken": EntityChicken,
            "zombie": EntityZombie,
            "creeper": EntityCreeper,
            "snow_zombie": EntitySnowZombie,
            "husk": EntityHusk,
            "drowned": EntityDrowned,
            "zombie_villager": EntityZombieVillager,
            "villager": EntityVillager,
            "pig": EntityPig,
            "saddledpig": EntitySaddledPig,
            "skeleton": EntitySkeleton,
            "snow_golem": EntitySnowGolem,
            "sheep": EntitySheep,
            "spider": EntitySpider,
            "slime": EntitySlime,
            "enderman": EntityEnderman,
            "iron_golem": EntityIronGolem,
            "horse": EntityHorse,
            "donkey": EntityDonkey,
            "mule": EntityMule,
            "cat": EntityCat,
            "zombie_horse": EntityHorseZombie,
            "zombiehorse": EntityHorseZombie,
            "skeleton_horse": EntityHorseSkeleton,
            "skeletonhorse": EntityHorseSkeleton,
            "skeleotn_horse": EntityHorseSkeleton,
            "primed_tnt": PrimedTNT,
            "arrow": EntityArrow,
            "block_display": EntityBlockDisplay
        };

        this.commands = [
            {
                name: "shareworld",
                usage: "/shareworld",
                description: "Compresses and sends the current world to a Discord webhook",
                execute: (args) => this.shareWorld(args)
            },
            {
                name: "title",
                usage: "/title <selector> <title|subtitle|actionbar|clear|times> <text|times_json>",
                description: "Shows large text on the player's screen",
                execute: (args) => this.titleCommand(args)
            },
            {
                name: "hud",
                usage: "/hud <create|remove|clear> [id] [json]",
                description: "Manages persistent on-screen HUD elements",
                execute: (args) => this.hudCommand(args)
            },
            {
                name: "item",
                usage: "/item <modify|property> <selected|slot_id> <json|key> [value]",
                description: "Modifies item tags or specific properties",
                execute: (args) => this.itemCommand(args)
            },
            {
                name: "execute",
                usage: "/execute [if block <x y z id>] [if entity <selector>] run <command>",
                description: "Executes a command with a changed context or condition",
                execute: (args) => this.executeCommand(args)
            },
            {
                name: "ai",
                usage: "/ai <selector> <mode> [target_selector]",
                description: "Modifies mob AI mode (wander, chase, flee, stay)",
                execute: (args) => this.aiCommand(args)
            },
            {
                name: "data",
                usage: "/data merge entity <selector> <json>",
                description: "Modifies entity properties via JSON",
                execute: (args) => this.dataCommand(args)
            },
            {
                name: "clone",
                usage: "/clone <x1> <y1> <z1> <x2> <y2> <z2> <xt> <yt> <zt>",
                description: "Clones blocks from one region to another",
                execute: (args) => this.clone(args)
            },
            {
                name: "effect",
                usage: "/effect @p <effect> [seconds] [amplifier]",
                description: "Applies a status effect to the player",
                execute: (args) => this.effect(args)
            },
            {
                name: "particle",
                usage: "/particle <name> <x> <y> <z> [count]",
                description: "Spawns particles",
                execute: (args) => this.particle(args)
            },
            {
                name: "playsound",
                usage: "/playsound <sound> <x> <y> <z>",
                description: "Plays a sound at coordinates",
                execute: (args) => this.playsound(args)
            },
            {
                name: "terrain",
                usage: "/terrain <rise|sink> <radius> [amount]",
                description: "Rise or sink the terrain around you",
                execute: (args) => this.terrain(args)
            },
            {
                name: "shoot",
                usage: "/shoot <arrow|snowball|ender_pearl> [speed]",
                description: "Shoots a projectile in your look direction",
                execute: (args) => this.shoot(args)
            },
            {
                name: "blockproperty",
                usage: "/blockproperty <block> gravity <true|false>",
                description: "Changes properties of a block type",
                execute: (args) => this.blockProperty(args)
            },
            {
                name: "locate",
                usage: "/locate <village/well>",
                description: "Locates the nearest structure",
                execute: (args) => this.locate(args)
            },
            {
                name: "give",
                usage: "/give @p <item> [amount]",
                description: "Gives an item to a player",
                execute: (args) => this.give(args)
            },
            {
                name: "setblock",
                usage: "/setblock <x> <y> <z> <block> [data]",
                description: "Places a block at coordinates",
                execute: (args) => this.setblock(args)
            },
            {
                name: "fill",
                usage: "/fill <x1> <y1> <z1> <x2> <y2> <z2> <block> [data]",
                description: "Fills a region with blocks",
                execute: (args) => this.fill(args)
            },
            {
                name: "tp",
                usage: "/tp @p <x> <y> <z> OR /tp @p <biome/dimension>",
                description: "Teleports a player to coordinates, a biome, or a dimension",
                execute: (args) => this.tp(args)
            },
            {
                name: "teleport",
                usage: "/teleport @p <x> <y> <z>",
                description: "Alias for /tp",
                execute: (args) => this.tp(args)
            },
            {
                name: "health",
                usage: "/health @p <value>",
                description: "Sets player health (0-20)",
                execute: (args) => this.health(args)
            },
            {
                name: "me",
                usage: "/me <action>",
                description: "Displays a social action message",
                execute: (args) => this.me(args)
            },
            {
                name: "gamemode",
                usage: "/gamemode <survival/creative>",
                description: "Sets the game mode",
                execute: (args) => this.gamemode(args)
            },
            {
                name: "clear",
                usage: "/clear [@p]",
                description: "Clears items from player inventory",
                execute: (args) => this.clear(args)
            },
            {
                name: "seed",
                usage: "/seed",
                description: "Displays the world seed",
                execute: (args) => this.seed(args)
            },
            {
                name: "systemdialog",
                usage: "/systemdialog <text>",
                description: "Shows a system dialog popup",
                execute: (args) => this.systemDialog(args)
            },
            {
                name: "set",
                usage: "/set @p speed <value>",
                description: "Sets player walk speed (0-100)",
                execute: (args) => this.setSpeed(args)
            },
            {
                name: "time",
                usage: "/time <day/night>",
                description: "Sets the world time",
                execute: (args) => this.time(args)
            },
            {
                name: "summon",
                usage: "/summon <mob>",
                description: "Summons a mob",
                execute: (args) => this.summon(args)
            },
            {
                name: "spawn",
                usage: "/spawn <structure>",
                description: "Spawns a structure (e.g. village_house1)",
                execute: (args) => this.spawn(args)
            },
            {
                name: "weather",
                usage: "/weather <clear/snow>",
                description: "Sets the weather",
                execute: (args) => this.weather(args)
            },
            {
                name: "realism",
                usage: "/realism <true/false>",
                description: "Toggles realistic clouds, water, and directional shadows",
                execute: (args) => this.realism(args)
            },
            {
                name: "lod",
                usage: "/lod <true/false>",
                description: "Toggles level-of-detail rendering",
                execute: (args) => this.lod(args)
            },
            {
                name: "kill",
                usage: "/kill [all]",
                description: "Kills entities. Use 'all' to kill mobs.",
                execute: (args) => this.kill(args)
            },
            {
                name: "gamerule",
                usage: "/gamerule <rule> <value>",
                description: "Sets a game rule value",
                execute: (args) => this.gamerule(args)
            },
            {
                name: "cheats",
                usage: "/cheats <enable|disable>",
                description: "Enables or disables cheats for this world",
                execute: (args) => this.cheats(args)
            },
            {
                name: "say",
                usage: "/say <message>",
                description: "Broadcasts a message to chat",
                execute: (args) => this.say(args)
            },
            {
                name: "setattribute",
                usage: "/setattribute @p <scale/speed> <value>",
                description: "Modifies player attributes",
                execute: (args) => this.setAttribute(args)
            },
            {
                name: "difficulty",
                usage: "/difficulty <easy/normal/hard>",
                description: "Sets the game difficulty",
                execute: (args) => this.difficulty(args)
            },
            {
                name: "help",
                usage: "/help",
                description: "Lists available commands",
                execute: (args) => this.help(args)
            },
            {
                name: "foliagecolor",
                usage: "/foliagecolor <base|orange|murky|birch>",
                description: "Changes the color scheme of foliage and leaves",
                execute: (args) => this.foliageColor(args)
            },
            {
                name: "enchant",
                usage: "/enchant",
                description: "Enchants the held item",
                execute: (args) => this.enchantCommand(args)
            },
            {
                name: "tommy",
                usage: "/tommy",
                description: "Toggles bilinear filtering (crisp vs smooth textures)",
                execute: (args) => this.tommyCommand(args)
            }
        ];
    }

    tommyCommand(args) {
        const settings = this.minecraft.settings;
        settings.bilinearFiltering = !settings.bilinearFiltering;
        settings.save();

        // Refresh all textures to apply new filtering
        this.minecraft.refreshTextures(false);
        
        return "Bilinear filtering " + (settings.bilinearFiltering ? "§aEnabled (Smooth)" : "§cDisabled (Crisp)");
    }

    handleMessage(message, silent = false) {
        if (!message) return "";
        if (message.startsWith("/")) message = message.substring(1);
        
        const parts = message.split(" ");
        const commandName = parts[0];
        const args = parts.slice(1);

        const command = this.commands.find(c => c.name === commandName);
        if (command) {
            const cheatsEnabled = this.minecraft.world ? this.minecraft.world.gameRules.cheatsEnabled : true;
            // /cheats must remain available while cheats are disabled so the
            // player can explicitly enable them, and while enabled so they
            // can turn them back off.
            const nonCheatCommands = ["help", "seed", "me", "shareworld", "cheats"];
            
            if (!cheatsEnabled && !nonCheatCommands.includes(commandName)) {
                const result = "§cCheats are not enabled in this world.";
                if (!silent) this.minecraft.addMessageToChat(result);
                return result;
            }

            try {
                const result = command.execute(args);
                if (result && !silent) this.minecraft.addMessageToChat(result);
                return result || "";
            } catch (e) {
                const result = "§cError: " + e.message;
                if (!silent) this.minecraft.addMessageToChat(result);
                return result;
            }
        } else {
            const result = "§cUnknown command. Type /help for help.";
            if (!silent) this.minecraft.addMessageToChat(result);
            return result;
        }
    }

    give(args) {
        if (args.length < 2) return "Usage: /give <selector> <item> [amount]";
        
        const targets = this.getTargets(args[0]);
        const itemName = args[1].toLowerCase();
        const amount = args.length > 2 ? parseInt(args[2]) : 1;
        
        const id = this.itemMap[itemName];
        if (!id) return "§cItem not found: " + itemName;
        
        let count = 0;
        for (const target of targets) {
            if (target.inventory) {
                target.inventory.addItem(id, amount);
                count++;
            }
        }
        return "Given " + amount + " " + itemName + " to " + count + " players";
    }

    parseCoord(arg, playerVal) {
        if (arg.startsWith("~")) {
            const offset = arg.length === 1 ? 0 : parseFloat(arg.substring(1));
            return Math.floor(playerVal + offset);
        }
        return Math.floor(parseFloat(arg));
    }

    setblock(args) {
        if (args.length < 4) return "Usage: /setblock <x> <y> <z> <block> [data]";
        
        const p = this.minecraft.player;
        const x = this.parseCoord(args[0], p.x);
        const y = this.parseCoord(args[1], p.y);
        const z = this.parseCoord(args[2], p.z);
        
        const blockName = args[3].toLowerCase();
        const data = args.length > 4 ? parseInt(args[4]) : 0;
        
        // Handle entities acting as blocks
        if (this.mobMap[blockName]) {
            const EntityClass = this.mobMap[blockName];
            const entity = new EntityClass(this.minecraft, this.minecraft.world);
            entity.setPosition(x + 0.5, y, z + 0.5);
            this.minecraft.world.addEntity(entity);
            return "Summoned " + blockName + " at " + x + ", " + y + ", " + z;
        }

        const id = this.itemMap[blockName];
        if (id === undefined && blockName !== "air") return "§cBlock not found: " + blockName;
        
        const finalId = blockName === "air" ? 0 : id;
        this.minecraft.world.setBlockAt(x, y, z, finalId, data);
        return "Block placed at " + x + ", " + y + ", " + z;
    }

    fill(args) {
        if (args.length < 7) return "Usage: /fill <x1> <y1> <z1> <x2> <y2> <z2> <block> [data]";
        
        const p = this.minecraft.player;
        const x1 = this.parseCoord(args[0], p.x);
        const y1 = this.parseCoord(args[1], p.y);
        const z1 = this.parseCoord(args[2], p.z);
        const x2 = this.parseCoord(args[3], p.x);
        const y2 = this.parseCoord(args[4], p.y);
        const z2 = this.parseCoord(args[5], p.z);
        
        const blockName = args[6].toLowerCase();
        const data = args.length > 7 ? parseInt(args[7]) : 0;
        
        const isMob = !!this.mobMap[blockName];
        const id = this.itemMap[blockName];
        if (id === undefined && blockName !== "air" && !isMob) return "§cBlock not found: " + blockName;
        const finalId = blockName === "air" ? 0 : id;
        
        const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
        const minZ = Math.min(z1, z2), maxZ = Math.max(z1, z2);
        
        let count = 0;
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    if (isMob) {
                        const EntityClass = this.mobMap[blockName];
                        const entity = new EntityClass(this.minecraft, this.minecraft.world);
                        entity.setPosition(x + 0.5, y, z + 0.5);
                        this.minecraft.world.addEntity(entity);
                    } else {
                        // Use silent mode to prevent freeze
                        this.minecraft.world.setBlockAt(x, y, z, finalId, data, true);
                    }
                    count++;
                }
            }
        }
        
        // Trigger mass lighting update and rebuild at the end
        this.minecraft.world.updateLight(0, minX, minY, minZ, maxX, maxY, maxZ);
        this.minecraft.world.updateLight(1, minX, minY, minZ, maxX, maxY, maxZ);
        this.minecraft.worldRenderer.flushRebuild = true;

        return (isMob ? "Summoned " : "Filled ") + count + (isMob ? " entities." : " blocks.");
    }

    clear(args) {
        const inv = this.minecraft.player.inventory;
        let targetId = 0;
        
        if (args.length >= 2 && args[0] === "@p") {
            const itemName = args[1].toLowerCase();
            targetId = this.itemMap[itemName] || 0;
        }

        let count = 0;
        for (let i = 0; i < inv.items.length; i++) {
            if (targetId === 0 || inv.items[i].id === targetId) {
                inv.items[i] = {id: 0, count: 0, damage: 0};
                count++;
            }
        }
        return targetId === 0 ? "Cleared the inventory of Player" : "Cleared " + args[1] + " from Player's inventory";
    }

    seed(args) {
        return "Seed: " + this.minecraft.world.seed.toString();
    }

    systemDialog(args) {
        if (!this.minecraft.systemDialogs) return "System dialogs are unavailable.";
        const text = args.join(" ").trim();
        if (!text) return "Usage: /systemdialog <text>";
        this.minecraft.systemDialogs.show(text);
        return "Shown.";
    }

    tp(args) {
        if (args.length < 2 || args[0] !== "@p") return "Usage: /tp @p <x> <y> <z> OR /tp @p <biome/dimension>";

        // Biome/Dimension Teleport
        if (args.length === 2) {
            const target = args[1].toLowerCase();

            if (target === "dungeon") {
                const p = this.minecraft.player;
                // Spawn it slightly ahead and underground
                const look = p.getLook(1.0);
                const x = Math.floor(p.x + look.x * 12) - 4;
                const z = Math.floor(p.z + look.z * 12) - 4;
                const y = 25;
                buildDungeon(this.minecraft.world, x, y, z);
                // TP inside (center)
                p.setPosition(x + 4.5, y + 1, z + 4.5);
                return "Created and teleported to a new Dungeon at " + x + ", " + y + ", " + z;
            }
            
            if (target === "nether" || target === "overworld" || target === "end") {
                if (target === "nether" && this.minecraft.world.dimension === -1) {
                     return "§cAlready in the Nether.";
                }
                if (target === "overworld" && this.minecraft.world.dimension === 0) {
                    return "§cAlready in the Overworld.";
                }
                if (target === "end" && this.minecraft.world.dimension === 1) {
                    return "§cAlready in The End.";
                }
                
                // Use switchDimension in Minecraft instance
                let dimId = null;
                if (target === "nether") dimId = -1;
                else if (target === "overworld") dimId = 0;
                else if (target === "end") dimId = 1;

                this.minecraft.switchDimension(dimId);
                return "Teleporting to " + target + "...";
            }
            
            const biome = target;
            this.minecraft.addMessageToChat("Searching for " + biome + "...");
            
            // Search asynchronously to avoid freezing
            setTimeout(() => {
                const target = this.findBiome(biome);
                if (target) {
                    // Teleport to surface using safety logic to avoid spawning underground/in walls
                    let safeY = this.minecraft.world.findSafeSpawnY(target.x, target.z, 64);
                    
                    this.minecraft.player.setPosition(target.x, safeY, target.z);
                    this.minecraft.addMessageToChat("Teleported to nearest " + biome + " at " + target.x + ", " + target.z);
                } else {
                    this.minecraft.addMessageToChat("§cCould not find biome: " + biome + " nearby.");
                }
            }, 100);
            
            return null; // Message sent asynchronously
        }
        
        // Coordinate Teleport
        if (args.length >= 4) {
            const p = this.minecraft.player;
            const x = this.parseCoord(args[1].replace(",", ""), p.x);
            let y = this.parseCoord(args[2].replace(",", ""), p.y);
            const z = this.parseCoord(args[3].replace(",", ""), p.z);
            
            if (isNaN(x) || isNaN(y) || isNaN(z)) return "§cInvalid coordinates";
            
            // Ground safety check: if Y is very low or in empty air, find the surface
            if (y <= 5 || (this.minecraft.world.getBlockAt(x, y, z) === 0 && this.minecraft.world.getBlockAt(x, y - 1, z) === 0)) {
                let safeY = this.minecraft.world.findSafeSpawnY(x, z, y);
                if (safeY !== -1) {
                    y = safeY;
                }
            }

            this.minecraft.player.setPosition(x, y, z);
            return "Teleported to " + x + ", " + y + ", " + z;
        }

        return "Usage: /tp @p <x> <y> <z> OR /tp @p <biome/dimension>";
    }

    findBiome(targetName) {
        const world = this.minecraft.world;
        if (!world || !world.generator) return null;
        
        const player = this.minecraft.player;
        const startX = Math.floor(player.x);
        const startZ = Math.floor(player.z);
        
        const checkPos = (x, z) => {
            // Use the centralized biome noise method which includes coordinate warping
            const val = world.getBiomeNoiseAt(x, z);
            
            // Align thresholds with WorldGenerator.js
            const isDesert = val >= 0.72;
            const isSnow = val < -0.62;
            const isSpruce = val < -0.38;
            const isDark = val >= 0.1 && val < 0.35;
            
            if (targetName === "desert" && isDesert) return true;
            if (targetName === "snow" && isSnow) return true;
            if (targetName === "spruce_forest" && isSpruce) return true;
            if (targetName === "dark_forest" && isDark) return true;
            
            // Plains/Forest is the default state for everything not extreme desert or snow
            if ((targetName === "plains" || targetName === "forest") && !isDesert && !isSnow) return true;
            
            return false;
        };

        // Search in a spiral
        const range = 5000;
        const step = 64; // Check every 64 blocks (4 chunks) for performance
        
        // Check current pos first
        if (checkPos(startX, startZ)) return {x: startX, z: startZ};

        for (let r = step; r < range; r += step) {
            // Top row
            for (let i = -r; i <= r; i += step) {
                if (checkPos(startX + i, startZ - r)) return {x: startX + i, z: startZ - r};
            }
            // Bottom row
            for (let i = -r; i <= r; i += step) {
                if (checkPos(startX + i, startZ + r)) return {x: startX + i, z: startZ + r};
            }
            // Left column
            for (let i = -r + step; i < r; i += step) {
                if (checkPos(startX - r, startZ + i)) return {x: startX - r, z: startZ + i};
            }
            // Right column
            for (let i = -r + step; i < r; i += step) {
                if (checkPos(startX + r, startZ + i)) return {x: startX + r, z: startZ + i};
            }
        }
        return null;
    }

    gamemode(args) {
        if (args.length < 1) return "Usage: /gamemode <survival/creative/spectator>";
        
        const mode = args[0].toLowerCase();
        if (mode === "creative" || mode === "1") {
            this.minecraft.player.capabilities.allowFlying = true;
            this.minecraft.player.gameMode = 1;
            this.minecraft.world.gameMode = 1;
            this.minecraft.world.gameRules.cheatsEnabled = true; // Auto-enable cheats
            this.minecraft.player.flying = true;
            this.minecraft.world.time = 6000;
            return "Set game mode to Creative";
        } else if (mode === "survival" || mode === "0") {
            this.minecraft.player.capabilities.allowFlying = false;
            this.minecraft.player.flying = false;
            this.minecraft.player.gameMode = 0;
            this.minecraft.world.gameMode = 0;
            return "Set game mode to Survival";
        } else if (mode === "spectator" || mode === "3") {
            this.minecraft.player.capabilities.allowFlying = true;
            this.minecraft.player.gameMode = 3;
            this.minecraft.world.gameMode = 3; // Spectator is gamemode 3
            this.minecraft.player.flying = true;
            return "Set game mode to Spectator";
        } else {
            return "§cUnknown game mode";
        }
    }

    setSpeed(args) {
        if (args.length < 3 || args[0] !== "@p" || args[1] !== "speed") return "Usage: /set @p speed <value>";
        
        let val = parseFloat(args[2]);
        if (isNaN(val)) return "§cInvalid number";
        if (val < 0) val = 0;
        if (val > 100) val = 100;
        
        this.minecraft.player.speedMultiplier = val;
        return "Set speed to " + val;
    }

    time(args) {
        if (args.length < 1) return "Usage: /time <day/night>";
        
        const val = args[0].toLowerCase();
        if (val === "day") {
            this.minecraft.world.time = 1000;
            return "Set time to Day";
        } else if (val === "night") {
            // Set to Midnight (18000) instead of Sunset (13000) to instantly skip the light transition
            this.minecraft.world.time = 18000;
            return "Set time to Night";
        } else {
            const t = parseInt(val);
            if (!isNaN(t)) {
                this.minecraft.world.time = t;
                return "Set time to " + t;
            }
            return "§cUnknown time value";
        }
    }

    summon(args) {
        if (args.length < 1) return "Usage: /summon <mob> [x y z] [json]";
        
        let mobName = args[0].toLowerCase();
        let isBaby = false;
        
        if (mobName.startsWith("baby_")) {
            isBaby = true;
            mobName = mobName.substring(5);
        }

        const EntityClass = this.mobMap[mobName];
        
        if (!EntityClass) return "§cUnknown mob: " + mobName;
        
        const player = this.minecraft.player;
        let x = player.x, y = player.y + 0.5, z = player.z;
        let jsonStr = "";

        if (args.length >= 4) {
            x = this.parseCoord(args[1], player.x);
            y = this.parseCoord(args[2], player.y);
            z = this.parseCoord(args[3], player.z);
            if (args.length > 4) jsonStr = args.slice(4).join(" ");
        } else if (args.length > 1) {
            jsonStr = args.slice(1).join(" ");
        }

        const entity = new EntityClass(this.minecraft, this.minecraft.world);
        if (isBaby) {
            entity.isChild = true;
        }
        entity.setPosition(x, y, z);

        if (jsonStr) {
            try {
                const data = JSON.parse(jsonStr);
                for (let key in data) {
                    if (key === "sheared") {
                entity.sheared = !!data[key];
            } else if (key === "block") {
                        const blockId = typeof data[key] === 'number' ? data[key] : this.itemMap[data[key]];
                        if (blockId) entity.blockId = blockId;
                    } else if (key === "scale") {
                        entity.displayScale = parseFloat(data[key]);
                    } else if (key === "rotate") {
                        entity.rotationSpeed = parseFloat(data[key]);
                    } else if (key === "bob") {
                        entity.bobHeight = parseFloat(data[key]);
                    } else {
                        entity[key] = data[key];
                    }
                }
                // Refresh position in case JSON modified width/height/scale
                if (typeof entity.setPosition === 'function') entity.setPosition(entity.x, entity.y, entity.z);
            } catch (e) {
                console.warn("Summon data parse error:", e);
            }
        }
        
        this.minecraft.world.addEntity(entity);
        return "Summoned new " + mobName;
    }

    spawn(args) {
        if (args.length < 1) return "Usage: /spawn <structure_name>";
        const name = args[0].toLowerCase();
        const player = this.minecraft.player;
        const x = Math.floor(player.x);
        const y = Math.floor(player.y);
        const z = Math.floor(player.z);

        if (name === "spruce_tree") {
            const gen = new SpruceTreeGenerator(this.minecraft.world, this.minecraft.world.seed);
            gen.generateAtBlock(x, y, z);
            return "Spawned Spruce Tree at " + x + ", " + y + ", " + z;
        } else if (name === "blacksmith") {
            buildBlacksmith(this.minecraft.world, x, y, z);
            return "Spawned Blacksmith at " + x + ", " + y + ", " + z;
        } else if (name === "village") {
            buildVillage(this.minecraft.world, x, y, z);
            return "Spawned Village at " + x + ", " + y + ", " + z;
        } else if (name === "village_house1") {
            buildVillageHouse1(this.minecraft.world, x, y, z);
            return "Spawned Village House 1 at " + x + ", " + y + ", " + z;
        } else if (name === "village_house2") {
            buildVillageHouse2(this.minecraft.world, x, y, z);
            return "Spawned Village House 2 at " + x + ", " + y + ", " + z;
        } else if (name === "village_tower1") {
            buildVillageTower1(this.minecraft.world, x, y, z);
            return "Spawned Village Tower 1 at " + x + ", " + y + ", " + z;
        } else if (name === "village_house3") {
            buildVillageHouse3(this.minecraft.world, x, y, z);
            return "Spawned Village House 3 at " + x + ", " + y + ", " + z;
        } else if (name === "village_well") {
            buildVillageWell(this.minecraft.world, x, y, z);
            return "Spawned Village Well at " + x + ", " + y + ", " + z;
        } else if (name === "igloo") {
            buildIgloo(this.minecraft.world, x, y, z);
            return "Spawned Igloo at " + x + ", " + y + ", " + z;
        } else if (name === "desert_well") {
            buildDesertWell(this.minecraft.world, x, y, z);
            return "Spawned Desert Well at " + x + ", " + y + ", " + z;
        } else if (name === "dungeon") {
            buildDungeon(this.minecraft.world, x, y, z);
            return "Spawned Dungeon at " + x + ", " + y + ", " + z;
        } else if (["wheat_farm", "carrot_farm", "potato_farm", "beetroot_farm"].includes(name)) {
            const type = name.split('_')[0];
            buildFarm(this.minecraft.world, x - 3, y, z - 4, type);
            return "Spawned " + name + " at " + x + ", " + y + ", " + z;
        }

        // Try to load custom structure from database/localstorage
        const local = localStorage.getItem('mc_struct_' + name);
        if (local) {
            try {
                const data = JSON.parse(local);
                // Borrow spawn logic from GuiStructureBlock
                for (const [rx, ry, rz, id, blockData] of data.blocks) {
                    this.minecraft.world.setBlockAt(x + rx, y + ry, z + rz, id, blockData, true);
                }
                this.minecraft.world.updateLight(0, x, y, z, x + data.size[0], y + data.size[1], z + data.size[2]);
                this.minecraft.world.updateLight(1, x, y, z, x + data.size[0], y + data.size[1], z + data.size[2]);
                this.minecraft.worldRenderer.flushRebuild = true;
                return "Spawned custom structure '" + name + "' at " + x + ", " + y + ", " + z;
            } catch(e) {}
        }

        return "§cUnknown structure: " + name;
    }

    realism(args) {
        if(args.length!==1||!['true','false'].includes(String(args[0]).toLowerCase()))return "Usage: /realism <true/false>";
        const enabled=String(args[0]).toLowerCase()==='true';
        this.minecraft.realismMode=enabled;
        this.minecraft.settings.realisticClouds=enabled;
        this.minecraft.settings.realisticWater=enabled;
        if(this.minecraft.worldRenderer?.setRealismMode)this.minecraft.worldRenderer.setRealismMode(enabled);
        return `Realism mode ${enabled?'enabled':'disabled'}.`;
    }

    lod(args) {
        if(args.length!==1||!['true','false'].includes(String(args[0]).toLowerCase()))return "Usage: /lod <true/false>";
        const enabled=String(args[0]).toLowerCase()==='true';this.minecraft.settings.lodRendering=enabled;this.minecraft.settings.save();
        for(const chunk of this.minecraft.world?.chunks?.values?.()||[])for(const section of chunk.sections||[]){if(section)section.isModified=true;}
        return `LOD rendering ${enabled?'enabled':'disabled'}.`;
    }

    weather(args) {
        if (args.length < 1) return "Usage: /weather <clear/snow/rain/thunder>";
        const type = args[0].toLowerCase();
        
        if (type === "clear") {
            this.minecraft.world.weather = "clear";
            return "Set weather to Clear";
        } else if (type === "snow") {
            this.minecraft.world.weather = "snow";
            return "Set weather to Snow";
        } else if (type === "rain") {
            this.minecraft.world.weather = "rain";
            return "Set weather to Rain";
        } else if (type === "thunder") {
            this.minecraft.world.weather = "thunder";
            return "Set weather to Thunderstorm";
        } else if (type === "auto") {
            this.minecraft.world.weather = "auto";
            return "Set weather to Automatic";
        }
        
        return "Unknown weather type. Use clear, snow, rain, or thunder.";
    }

    kill(args) {
        if (args.length > 0 && args[0].toLowerCase() === "all") {
            let count = 0;
            const entities = [...this.minecraft.world.entities];
            for (const e of entities) {
                // Don't kill local player
                if (e === this.minecraft.player) continue;
                // Don't kill remote players in multiplayer
                if (e.constructor.name === "RemotePlayerEntity") continue;
                
                // Kill biological entities (mobs)
                if (e instanceof EntityLiving || typeof e.takeHit === "function") {
                    e.takeHit(this.minecraft.player, 10000);
                    count++;
                }
            }
            return "Killed " + count + " entities.";
        }
        
        // Default behavior: kill self
        this.minecraft.player.takeHit(null, 1000);
        return "Ouch.";
    }

    cheats(args) {
        if (!this.minecraft.world) return "§cNo world is loaded.";
        if (args.length !== 1 || !["enable", "disable"].includes(String(args[0]).toLowerCase())) {
            return "Usage: /cheats <enable|disable>";
        }

        const enabled = String(args[0]).toLowerCase() === "enable";
        this.minecraft.world.gameRules.cheatsEnabled = enabled;

        // Cheats are authoritative in a LAN world. Keep every client on the
        // same rule so command permissions and achievement blocking agree.
        const mp = this.minecraft.multiplayer;
        if (mp && mp.connected && mp.isHosting) {
            mp.broadcast({ type: "gamerules", gr: { cheatsEnabled: enabled } });
        }
        return `Cheats ${enabled ? "enabled" : "disabled"}. Achievements are ${enabled ? "disabled in this world" : "available again"}.`;
    }

    gamerule(args) {
        if (args.length < 2) return "Usage: /gamerule <rule> <value>";
        const rule = args[0].toLowerCase();
        const value = args[1].toLowerCase();

        if (rule === "domobspawning") {
            const bool = value === "true";
            this.minecraft.world.gameRules.doMobSpawning = bool;
            return "Game rule doMobSpawning has been updated to " + bool;
        }

        if (rule === "pvp") {
            const bool = value === "true";
            this.minecraft.world.gameRules.pvp = bool;
            // Clients enforce PVP locally, so the rule has to reach them or
            // they will keep accepting hits the host has just disallowed.
            const mp = this.minecraft.multiplayer;
            if (mp && mp.connected && mp.isHosting) {
                mp.broadcast({ type: "gamerules", gr: { pvp: bool } });
            }
            return "Game rule pvp has been updated to " + bool;
        }

        return "§cUnknown game rule: " + rule;
    }

    say(args) {
        if (args.length < 1) return "Usage: /say <message>";
        const message = args.join(" ");
        this.minecraft.addMessageToChat("[Server] " + message);
        if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected) {
            this.minecraft.multiplayer.sendChat("[Server] " + message);
        }
        return null;
    }

    setAttribute(args) {
        if (args.length < 3) return "Usage: /setattribute <selector> <scale/speed> <value>";
        
        const targets = this.getTargets(args[0]);
        const attr = args[1].toLowerCase();
        const val = parseFloat(args[2]);
        if (isNaN(val)) return "§cInvalid value";

        for (const target of targets) {
            if (attr === "scale" || attr === "size") {
                target.attributeScale = val;
                if (typeof target.setPosition === 'function') target.setPosition(target.x, target.y, target.z);
                if (target.renderer && target.renderer.group) delete target.renderer.group.buildMeta;
            } else if (attr === "speed") {
                target.speedMultiplier = val;
            }
        }

        return "Modified " + attr + " for " + targets.length + " targets";
    }

    difficulty(args) {
        if (args.length < 1) return "Usage: /difficulty <easy/normal/hard>";
        const diff = args[0].toLowerCase();
        return "Difficulty set to " + diff + " (visual only)";
    }

    clone(args) {
        if (args.length < 9) return "Usage: /clone <x1> <y1> <z1> <x2> <y2> <z2> <xt> <yt> <zt>";
        const p = this.minecraft.player;
        const x1 = this.parseCoord(args[0], p.x), y1 = this.parseCoord(args[1], p.y), z1 = this.parseCoord(args[2], p.z);
        const x2 = this.parseCoord(args[3], p.x), y2 = this.parseCoord(args[4], p.y), z2 = this.parseCoord(args[5], p.z);
        const xt = this.parseCoord(args[6], p.x), yt = this.parseCoord(args[7], p.y), zt = this.parseCoord(args[8], p.z);

        const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
        const minZ = Math.min(z1, z2), maxZ = Math.max(z1, z2);

        const blocks = [];
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    blocks.push({
                        rx: x - minX, ry: y - minY, rz: z - minZ,
                        id: this.minecraft.world.getBlockAt(x, y, z),
                        data: this.minecraft.world.getBlockDataAt(x, y, z),
                        te: this.minecraft.world.getTileEntity(x, y, z)
                    });
                }
            }
        }

        for (let b of blocks) {
            this.minecraft.world.setBlockAt(xt + b.rx, yt + b.ry, zt + b.rz, b.id, b.data, true);
            if (b.te) this.minecraft.world.setTileEntity(xt + b.rx, yt + b.ry, zt + b.rz, JSON.parse(JSON.stringify(b.te)));
        }

        const sizeX = maxX - minX, sizeY = maxY - minY, sizeZ = maxZ - minZ;
        this.minecraft.world.updateLight(0, xt, yt, zt, xt + sizeX, yt + sizeY, zt + sizeZ);
        this.minecraft.world.updateLight(1, xt, yt, zt, xt + sizeX, yt + sizeY, zt + sizeZ);
        this.minecraft.worldRenderer.flushRebuild = true;

        return "Cloned " + blocks.length + " blocks.";
    }

    effect(args) {
        if (args.length < 2) return "Usage: /effect <selector> <effect|clear> [seconds] [amplifier]";
        
        const targets = this.getTargets(args[0]);
        const name = args[1].toLowerCase();
        
        if (name === "clear") {
            targets.forEach(t => {
                if (t.activeEffects) t.activeEffects.clear();
                if (t.updateFOVModifier) t.updateFOVModifier();
            });
            return "Cleared all effects from " + targets.length + " targets";
        }

        const seconds = args.length > 2 ? parseInt(args[2]) : 30;
        const amp = args.length > 3 ? parseInt(args[3]) : 0;
        
        const validEffects = [
            "speed", "regeneration", "strength", "instant_health", "fire_resistance",
            "water_breathing", "night_vision", "invisibility", "jump_boost", "slow_falling", "haste"
        ];

        if (!validEffects.includes(name)) return "§cUnknown effect: " + name;
        
        targets.forEach(t => {
            if (t.addEffect) t.addEffect(name, seconds * 20, amp);
            if (t.updateFOVModifier) t.updateFOVModifier();
        });
        
        return "Applied effect " + name + " to " + targets.length + " targets";
    }

    particle(args) {
        if (args.length < 4) return "Usage: /particle <name> <x> <y> <z> [count]";
        const p = this.minecraft.player;
        const x = this.parseCoord(args[1], p.x), y = this.parseCoord(args[2], p.y), z = this.parseCoord(args[3], p.z);
        const count = args.length > 4 ? parseInt(args[4]) : 10;
        
        const block = Block.getById(1); // Stone default
        for(let i=0; i<count; i++) {
            this.minecraft.particleManager.spawnBlockBreakParticles(this.minecraft.world, x, y, z, block);
        }
        return "Spawned " + count + " particles.";
    }

    playsound(args) {
        if (args.length < 4) return "Usage: /playsound <sound> <x> <y> <z>";
        const p = this.minecraft.player;
        const sound = args[0];
        const x = this.parseCoord(args[1], p.x), y = this.parseCoord(args[2], p.y), z = this.parseCoord(args[3], p.z);
        this.minecraft.soundManager.playSound(sound, x, y, z, 1.0, 1.0);
        return "Played sound " + sound;
    }

    terrain(args) {
        if (args.length < 2) return "Usage: /terrain <rise|sink> <radius> [amount] [x] [y] [z]";
        const mode = args[0].toLowerCase();
        const radius = parseInt(args[1]);
        const amount = args.length > 2 ? parseInt(args[2]) : 1;
        const p = this.minecraft.player;
        const world = this.minecraft.world;

        if (isNaN(radius) || isNaN(amount)) return "§cInvalid numbers";

        const tx = (args.length > 3) ? this.parseCoord(args[3], p.x) : Math.floor(p.x);
        const tz = (args.length > 5) ? this.parseCoord(args[5], p.z) : Math.floor(p.z);
        
        const rSq = radius * radius;

        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                if (x * x + z * z > rSq) continue;
                const wx = tx + x, wz = tz + z;
                
                if (mode === "rise") {
                    for (let y = 127 - amount; y >= 0; y--) {
                        const id = world.getBlockAt(wx, y, wz);
                        const meta = world.getBlockDataAt(wx, y, wz);
                        world.setBlockAt(wx, y + amount, wz, id, meta, true);
                    }
                    for (let y = 0; y < amount; y++) world.setBlockAt(wx, y, wz, 0, 0, true);
                } else if (mode === "sink") {
                    for (let y = amount; y < 128; y++) {
                        const id = world.getBlockAt(wx, y, wz);
                        const meta = world.getBlockDataAt(wx, y, wz);
                        world.setBlockAt(wx, y - amount, wz, id, meta, true);
                    }
                    for (let y = 127; y > 127 - amount; y--) world.setBlockAt(wx, y, wz, 0, 0, true);
                }
            }
        }
        
        this.minecraft.world.updateLight(0, tx - radius, 0, tz - radius, tx + radius, 127, tz + radius);
        this.minecraft.world.updateLight(1, tx - radius, 0, tz - radius, tx + radius, 127, tz + radius);
        world.minecraft.worldRenderer.flushRebuild = true;
        return "Terrain " + mode + "n by " + amount + " blocks at " + tx + ", " + tz;
    }

    shoot(args) {
        if (args.length < 1) return "Usage: /shoot <arrow|snowball|ender_pearl> [speed]";
        const type = args[0].toLowerCase();
        const speed = args.length > 1 ? parseFloat(args[1]) : 1.5;
        const p = this.minecraft.player;

        let entity;
        if (type === "arrow") entity = new EntityArrow(this.minecraft, this.minecraft.world);
        else if (type === "snowball") entity = new EntitySnowball(this.minecraft, this.minecraft.world);
        else if (type === "ender_pearl") entity = new EntityEnderPearl(this.minecraft, this.minecraft.world);
        else return "§cUnknown projectile: " + type;

        const look = p.getLook(1.0);
        const eyes = p.getPositionEyes(1.0);
        entity.owner = p;
        entity.setPosition(eyes.x + look.x, eyes.y + look.y, eyes.z + look.z);
        entity.motionX = look.x * speed;
        entity.motionY = look.y * speed + 0.1;
        entity.motionZ = look.z * speed;
        this.minecraft.world.addEntity(entity);
        return "Shot " + type;
    }

    blockProperty(args) {
        if (args.length < 3) return "Usage: /blockproperty <block> gravity <true|false>";
        const blockName = args[0].toLowerCase();
        const property = args[1].toLowerCase();
        const value = args[2].toLowerCase() === "true";

        const id = this.itemMap[blockName];
        if (id === undefined) return "§cBlock not found: " + blockName;
        const block = Block.getById(id);
        if (!block) return "§cInvalid block ID";

        if (property === "gravity") {
            if (!Block.gravityIds) Block.gravityIds = new Set([12, 13]); // Default sand/gravel
            if (value) Block.gravityIds.add(id);
            else Block.gravityIds.delete(id);
            return "Set gravity for " + blockName + " to " + value;
        }
        return "§cUnknown property: " + property;
    }

    locate(args) {
        if (args.length < 1) return "Usage: /locate <village/well>";
        return "Nearest structure is at ~ ~ ~ (Search not implemented)";
    }

    health(args) {
        if (args.length < 2) return "Usage: /health <selector> <value>";
        let val = parseFloat(args[1]);
        if (isNaN(val)) return "§cInvalid health value";
        
        const targets = this.getTargets(args[0]);
        const healthPoints = val * 2;
        
        for (const target of targets) {
            target.maxHealth = Math.max(2, healthPoints);
            target.health = target.maxHealth;
        }
        
        return "Set health to " + val + " for " + targets.length + " targets";
    }

    hudCommand(args) {
        if (args.length < 1) return "Usage: /hud <create|remove|clear> [id] [json]";
        const action = args[0].toLowerCase();
        
        if (action === "clear") {
            this.minecraft.hudElements.clear();
            return "Cleared all HUD elements.";
        }

        const id = args[1];
        if (!id) return "§cMissing HUD ID.";

        if (action === "remove") {
            this.minecraft.hudElements.delete(id);
            return "Removed HUD: " + id;
        }

        if (action === "create" || action === "modify") {
            try {
                const jsonStr = args.slice(2).join(" ");
                const layout = JSON.parse(jsonStr);
                this.minecraft.hudElements.set(id, layout);
                return "HUD '" + id + "' updated.";
            } catch (e) {
                return "§cInvalid JSON: " + e.message;
            }
        }
        return "Unknown HUD action.";
    }

    me(args) {
        if (args.length < 1) return "Usage: /me <action>";
        let action = args.join(" ");
        let username = this.minecraft.player.username || "Player";
        this.minecraft.addMessageToChat("* " + username + " " + action);
        if (this.minecraft.multiplayer && this.minecraft.multiplayer.connected) {
            this.minecraft.multiplayer.sendChat("* " + username + " " + action);
        }
        return null;
    }

    itemCommand(args) {
        if (args.length < 3) return "Usage: /item <modify|property> <selected|slot_id> <json|key> [value]";
        
        const mode = args[0].toLowerCase();
        const targetSlot = args[1];
        
        let index = -1;
        if (targetSlot === "selected") index = this.minecraft.player.inventory.selectedSlotIndex;
        else index = parseInt(targetSlot);
        
        if (index < 0 || index >= this.minecraft.player.inventory.items.length) return "§cInvalid slot index.";
        const item = this.minecraft.player.inventory.items[index];
        if (item.id === 0) return "§cCannot modify an empty slot.";

        if (mode === "modify") {
            try {
                const jsonStr = args.slice(2).join(" ");
                const tags = JSON.parse(jsonStr);
                item.tag = Object.assign(item.tag || {}, tags);
                return "Item modified successfully.";
            } catch (e) {
                return "§cInvalid JSON: " + e.message;
            }
        } else if (mode === "property") {
            const key = args[2];
            let val = args[3];
            
            if (val === undefined) {
                return `Property ${key}: ${item.tag[key]}`;
            }

            // Handle math for numbers (e.g. +1, -1)
            if (val.startsWith("+") || val.startsWith("-")) {
                let current = parseFloat(item.tag[key]) || 0;
                let delta = parseFloat(val);
                item.tag[key] = current + delta;
            } else {
                // Parse as number if possible
                let num = parseFloat(val);
                item.tag[key] = isNaN(num) ? val : num;
            }
            return `Set ${key} to ${item.tag[key]}`;
        }
    }

    executeCommand(args) {
        const runIdx = args.indexOf("run");
        if (runIdx === -1) return "§cMissing 'run' keyword. Usage: /execute [if...] run <command>";
        
        const commandToRun = args.slice(runIdx + 1).join(" ");
        const conditions = args.slice(0, runIdx);
        
        let shouldRun = true;

        // Parse conditions
        if (conditions.length > 0) {
            let i = 0;
            while (i < conditions.length) {
                const type = conditions[i].toLowerCase();
                if (type === "if") {
                    const check = conditions[i + 1].toLowerCase();
                    if (check === "block") {
                        const x = this.parseCoord(conditions[i + 2], this.minecraft.player.x);
                        const y = this.parseCoord(conditions[i + 3], this.minecraft.player.y);
                        const z = this.parseCoord(conditions[i + 4], this.minecraft.player.z);
                        const blockName = conditions[i + 5].toLowerCase();
                        const targetId = blockName === "air" ? 0 : this.itemMap[blockName];
                        
                        if (this.minecraft.world.getBlockAt(x, y, z) !== targetId) {
                            shouldRun = false;
                            break;
                        }
                        i += 6;
                    } else if (check === "entity") {
                        const selector = conditions[i + 2];
                        const targets = this.getTargets(selector);
                        if (targets.length === 0) {
                            shouldRun = false;
                            break;
                        }
                        i += 3;
                    } else if (check === "data") {
                        // /execute if data storage <path> <value>
                        if (conditions[i + 2] === "storage") {
                            const path = conditions[i + 3];
                            const expected = conditions[i + 4];
                            const current = this.getStorageValue(path);
                            
                            // String comparison or JSON comparison
                            if (String(current) !== String(expected)) {
                                shouldRun = false;
                                break;
                            }
                            i += 5;
                        } else { i += 2; }
                    } else {
                        i += 2;
                    }
                } else if (type === "as" || type === "at") {
                    // Context modifiers - just skip for now
                    i += 2;
                } else {
                    i++;
                }
            }
        }

        if (shouldRun) {
            const selector = conditions.includes("as") ? conditions[conditions.indexOf("as") + 1] : "@p";
            const targets = this.getTargets(selector);
            
            for (const target of targets) {
                this.handleMessage(commandToRun);
            }
            return null; // Silent success for scripts
        }
        
        return null; // Silent fail for scripts
    }

    getTargets(selector) {
        if (!selector) return [];
        if (selector === "@s") return [this.minecraft.player];
        if (selector === "@p") {
            // Find closest player to the executing context (local player)
            return [this.minecraft.player];
        }
        if (selector === "@a") {
            // All players: local + remote players
            return this.minecraft.world.entities.filter(e => 
                e.constructor.name === "PlayerEntity" || 
                e.constructor.name === "RemotePlayerEntity"
            );
        }
        if (selector === "@r") {
            // Random player
            const players = this.minecraft.world.entities.filter(e => 
                e.constructor.name === "PlayerEntity" || 
                e.constructor.name === "RemotePlayerEntity"
            );
            return players.length > 0 ? [players[Math.floor(Math.random() * players.length)]] : [];
        }
        if (selector === "@e") return this.minecraft.world.entities;
        
        // Enhanced selector parsing for @e[type=zombie,name=...]
        if (selector.startsWith("@e[")) {
            const params = selector.substring(3, selector.length - 1).split(',');
            let filtered = [...this.minecraft.world.entities];
            
            for (let p of params) {
                const [key, val] = p.split('=');
                if (key === "type") {
                    filtered = filtered.filter(e => e.constructor.name.toLowerCase().includes(val.toLowerCase()));
                } else if (key === "name") {
                    filtered = filtered.filter(e => (e.customName || e.username || "").toLowerCase() === val.toLowerCase());
                }
            }
            return filtered;
        }
        
        // Target by name (specific username or custom name)
        return this.minecraft.world.entities.filter(e => (e.username || e.customName || "").toLowerCase() === selector.toLowerCase());
    }

    titleCommand(args) {
        if (args.length < 2) return "Usage: /title <selector> <title|subtitle|actionbar|clear|times> <text>";
        
        const targets = this.getTargets(args[0]);
        const sub = args[1].toLowerCase();

        // Note: For simplicity, since the local client manages its own title state,
        // we only apply to local player if targeted. In multiplayer, host would broadcast this.
        if (!targets.includes(this.minecraft.player)) return "Title applied (server-side only for non-self targets)";

        const state = this.minecraft.titleState;

        if (sub === "clear") {
            state.mainTitle = "";
            state.subTitle = "";
            state.actionBar = "";
            state.endTime = 0;
            return "Cleared titles.";
        }

        if (sub === "times") {
            try {
                const times = JSON.parse(args.slice(2).join(" "));
                state.fadeIn = times.fadeIn || 500;
                state.stay = times.stay || 3000;
                state.fadeOut = times.fadeOut || 500;
                return "Updated title times.";
            } catch(e) { return "§cInvalid JSON"; }
        }

        let text = args.slice(2).join(" ");
        let color = 0xFFFFFF;

        // Check for color tag like [red]
        if (text.startsWith("[")) {
            const endIdx = text.indexOf("]");
            if (endIdx !== -1) {
                const colorName = text.substring(1, endIdx).toLowerCase();
                const colors = { "red": 0xFF5555, "blue": 0x5555FF, "green": 0x55FF55, "yellow": 0xFFFF55, "gold": 0xFFAA00, "aqua": 0x55FFFF, "purple": 0xAA00AA };
                if (colors[colorName]) color = colors[colorName];
                text = text.substring(endIdx + 1).trim();
            }
        }

        state.startTime = Date.now();
        state.endTime = state.startTime + state.fadeIn + state.stay + state.fadeOut;

        if (sub === "title") { state.mainTitle = text; state.mainColor = color; }
        else if (sub === "subtitle") { state.subTitle = text; state.subColor = color; }
        else if (sub === "actionbar") { state.actionBar = text; state.actionColor = color; }

        return "Set " + sub;
    }

    aiCommand(args) {
        if (args.length < 2) return "Usage: /ai <selector> <wander|chase|flee|stay> [target_selector]";
        
        const targets = this.getTargets(args[0]);
        const mode = args[1].toLowerCase();
        const targetSelector = args[2] || "@p";

        let count = 0;
        for (const entity of targets) {
            if (entity instanceof entity.constructor && typeof entity.setAiMode === 'function') {
                entity.setAiMode(mode, targetSelector);
                count++;
            }
        }
        return "Updated AI for " + count + " entities.";
    }

    dataCommand(args) {
        const mode = args[0].toLowerCase();
        const type = args[1].toLowerCase();

        if (mode === "merge") {
            if (type === "entity") {
                const selector = args[2];
                const jsonStr = args.slice(3).join(" ");
                const targets = this.getTargets(selector);

                try {
                    const data = JSON.parse(jsonStr);
                    for (const target of targets) {
                        // Apply changes and refresh physics immediately
                        for (let key in data) {
                            target[key] = data[key];
                        }
                        if (typeof target.setPosition === 'function') {
                            target.setPosition(target.x, target.y, target.z);
                        }
                        if (target.renderer && target.renderer.group) {
                            delete target.renderer.group.buildMeta;
                        }
                    }
                    return "Merged data with " + targets.length + " entities.";
                } catch (e) {
                    return "§cInvalid JSON: " + e.message;
                }
            } else if (type === "storage") {
                const path = args[2];
                const jsonStr = args.slice(3).join(" ");
                try {
                    const data = JSON.parse(jsonStr);
                    this.setStorageValue(path, data);
                    return "Updated storage path: " + path;
                } catch (e) {
                    return "§cInvalid JSON: " + e.message;
                }
            }
        } else if (mode === "get") {
            if (type === "storage") {
                const path = args[2];
                const val = this.getStorageValue(path);
                return `Storage ${path}: ${JSON.stringify(val)}`;
            }
        } else if (mode === "modify") {
            // New logic for storage modification math
            if (type === "storage") {
                const path = args[2];
                const op = args[3]; // append, set, merge
                const source = args[4]; // value
                
                let current = this.getStorageValue(path);
                let val = source;
                try { val = JSON.parse(source); } catch(e) {}

                if (op === "set") current = val;
                else if (op === "append") {
                    if (!Array.isArray(current)) current = [];
                    current.push(val);
                }
                
                this.setStorageValue(path, current);
                return "Modified storage path: " + path;
            }
        }
        
        return "Usage: /data <merge|get|modify> <entity|storage> <selector|path> [json|op] [value]";
    }

    getStorageValue(path) {
        const parts = path.split('.');
        let obj = this.minecraft.storage;
        for (let p of parts) {
            if (!obj[p]) return undefined;
            obj = obj[p];
        }
        return obj;
    }

    setStorageValue(path, value) {
        const parts = path.split('.');
        let obj = this.minecraft.storage;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!obj[parts[i]]) obj[parts[i]] = {};
            obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;
    }

    help(args) {
        this.minecraft.addMessageToChat("§aAvailable commands:");
        for (let cmd of this.commands) {
            this.minecraft.addMessageToChat("§e" + cmd.usage + "§r - " + cmd.description);
        }
        return null;
    }

    foliageColor(args) {
        if (args.length < 1) return "Usage: /foliagecolor <base|orange|murky|birch> [intensity 0-100]";
        const mode = args[0].toLowerCase();
        const valid = ["base", "orange", "murky", "birch"];
        if (!valid.includes(mode)) return "§cInvalid mode. Use: base, orange, murky, or birch";

        const intensity = args.length > 1 ? parseInt(args[1]) : 100;
        if (isNaN(intensity) || intensity < 0 || intensity > 100) return "§cIntensity must be a number between 0 and 100.";

        this.minecraft.settings.foliageColorMode = mode;
        this.minecraft.settings.foliageColorIntensity = intensity;
        this.minecraft.settings.save();
        
        // Refresh all chunks to apply the new color
        if (this.minecraft.worldRenderer) {
            this.minecraft.worldRenderer.rebuildAll();
            this.minecraft.worldRenderer.flushRebuild = true;
        }

        return `Foliage color mode set to ${mode} with ${intensity}% intensity.`;
    }

    enchantCommand(args) {
        const p = this.minecraft.player;
        const inv = p.inventory;
        const slot = inv.selectedSlotIndex;
        const stack = inv.items[slot];
        
        if (!stack || stack.id === 0) return "§cYou must be holding an item to enchant it.";
        
        stack.tag = Object.assign(stack.tag || {}, { enchanted: true });
        
        // Trigger re-render of HUD/Inventory
        if (this.minecraft.itemRenderer) this.minecraft.itemRenderer.rebuildAllItems();
        
        // Refresh player model to show hand glint
        if (p.renderer && p.renderer.group) delete p.renderer.group.buildMeta;

        return "Applied enchantment to " + (Block.getById(stack.id).name || "item");
    }

    shareWorld(args) {
        if (!this.minecraft.world) return "§cNo world loaded.";
        
        this.minecraft.addMessageToChat("§ePreparing world for sharing...");
        
        this._doShareWorld();
        
        return null;
    }

    async _doShareWorld() {
        try {
            // Force capture latest state
            const result = await this.minecraft.world.saveWorldData();
            const worldData = result.data || this.minecraft.world.savedData;
            
            if (!worldData) {
                this.minecraft.addMessageToChat("§cFailed to capture world data.");
                return;
            }
            
            const worldName = worldData.n || "world";
            const jsonString = JSON.stringify(worldData);
            
            // Compress with JSZip
            const zip = new JSZip();
            zip.file(worldName + ".json", jsonString);
            const blob = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: { level: 9 }
            });
            
            this.minecraft.addMessageToChat("§eUploading world to Discord...");
            
            const formData = new FormData();
            const filename = worldName.replace(/\s+/g, '_').toLowerCase() + ".zip";
            formData.append('file', blob, filename);
            
            const user = await window.websim.getCurrentUser();
            const userInfo = user ? user.username : this.minecraft.player.username;
            
            formData.append('content', `**World Shared:** ${worldName}\n**Player:** ${userInfo}\n**Seed:** ${worldData.s}\n**Dimension:** ${this.minecraft.world.dimension}`);

            const webhookUrl = "https://discord.com/api/webhooks/1463384055855714384/pPzn2ktuRLUefehbZ3wd3plkO2NxGjjm_6t3nEuCUR8M0L8D8_XjtGDqrAbkxE-4J6Hd";
            
            const response = await fetch(webhookUrl, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                this.minecraft.addMessageToChat("§aWorld shared successfully to the archive!");
            } else {
                this.minecraft.addMessageToChat("§cFailed to send to Discord. Status: " + response.status);
            }
        } catch (e) {
            console.error("Shareworld error:", e);
            this.minecraft.addMessageToChat("§cError during sharing: " + e.message);
        }
    }

    getSuggestions(input) {
        if (!input.startsWith("/")) return [];
        
        const text = input.substring(1);
        const parts = text.split(" ");
        const cmdName = parts[0];
        const currentArgIndex = parts.length - 1;
        const currentText = parts[currentArgIndex];

        // 1. Suggest Command Names
        if (parts.length === 1) {
            // Include pumpkins and other missing items in suggestions by checking itemMap
            return this.commands
                .filter(c => c.name.startsWith(cmdName))
                .map(c => ({ 
                    value: "/" + c.name, 
                    display: "/" + c.name, 
                    info: c.description 
                }));
        }

        // 2. Suggest Argument Values
        const command = this.commands.find(c => c.name === cmdName);
        if (!command) return [];

        let list = [];
        let info = "";

        if (cmdName === "item") {
            if (currentArgIndex === 1) list = ["modify"];
            if (currentArgIndex === 2) list = ["selected", "0", "1", "2", "3", "4", "5", "6", "7", "8"];
            if (currentArgIndex === 3) {
                list = ['{"name":"Magic Stick"}', '{"onUse":"summon pig"}', '{"onHit":"kill all"}', '{"onBreak":"spawn village"}'];
                info = "JSON tags";
            }
        } else if (cmdName === "effect") {
            if (currentArgIndex === 1) list = ["@p"];
            if (currentArgIndex === 2) list = ["clear", "speed", "regeneration", "strength", "instant_health", "fire_resistance", "water_breathing", "night_vision", "invisibility", "jump_boost", "slow_falling", "haste"];
        } else if (cmdName === "setattribute") {
            if (currentArgIndex === 1) list = ["@p"];
            if (currentArgIndex === 2) list = ["scale", "speed"];
        } else if (cmdName === "give") {
            if (currentArgIndex === 1) list = ["@p"];
            if (currentArgIndex === 2) {
                list = Object.keys(this.itemMap);
                info = "item";
            }
        } else if (cmdName === "setblock") {
            if (currentArgIndex >= 1 && currentArgIndex <= 3) list = ["~"];
            if (currentArgIndex === 4) {
                list = ["air", ...Object.keys(this.itemMap)];
                info = "block";
            }
        } else if (cmdName === "fill") {
            if (currentArgIndex >= 1 && currentArgIndex <= 6) list = ["~"];
            if (currentArgIndex === 7) {
                list = ["air", ...Object.keys(this.itemMap)];
                info = "block";
            }
        } else if (cmdName === "clear") {
            if (currentArgIndex === 1) list = ["@p"];
        } else if (cmdName === "summon") {
            if (currentArgIndex === 1) {
                const mobs = Object.keys(this.mobMap);
                const babies = ["cow", "chicken", "zombie", "villager", "sheep", "pig", "iron_golem", "zombie_villager", "horse", "donkey", "mule"].map(n => "baby_" + n);
                list = [...mobs, ...babies];
                info = "mob";
            }
        } else if (cmdName === "spawn") {
            if (currentArgIndex === 1) {
                list = ["spruce_tree", "blacksmith", "village", "village_house1", "village_house2", "village_house3", "village_tower1", "village_well", "igloo", "desert_well", "dungeon", "wheat_farm", "carrot_farm", "potato_farm", "beetroot_farm"];
                info = "structure";
            }
        } else if (cmdName === "setblock") {
            if (currentArgIndex >= 1 && currentArgIndex <= 3) list = ["~"];
            if (currentArgIndex === 4) {
                list = ["air", "pumpkin", "jack_o_lantern", ...Object.keys(this.itemMap)];
                info = "block";
            }
        } else if (cmdName === "tp") {
            if (currentArgIndex === 1) list = ["@p"];
            if (currentArgIndex === 2) {
                list = ["nether", "overworld", "dungeon", "desert", "snow", "spruce_forest", "birch_forest", "plains", "forest"];
                info = "destination";
            }
        } else if (cmdName === "gamemode") {
            if (currentArgIndex === 1) list = ["survival", "creative", "0", "1"];
        } else if (cmdName === "time") {
            if (currentArgIndex === 1) list = ["day", "night"];
        } else if (cmdName === "weather") {
            if (currentArgIndex === 1) list = ["clear", "snow", "rain", "thunder", "auto"];
        } else if (cmdName === "set") {
            if (currentArgIndex === 1) list = ["@p"];
            if (currentArgIndex === 2) list = ["speed"];
        } else if (cmdName === "kill") {
            if (currentArgIndex === 1) list = ["all"];
        } else if (cmdName === "effect") {
            if (currentArgIndex === 1) list = ["@p"];
            if (currentArgIndex === 2) list = ["speed", "clear"];
        } else if (cmdName === "particle") {
            if (currentArgIndex === 1) list = ["smoke", "flame", "heart"];
        } else if (cmdName === "locate") {
            if (currentArgIndex === 1) list = ["village", "desert_well", "igloo"];
        } else if (cmdName === "gamerule") {
            if (currentArgIndex === 1) list = ["doMobSpawning"];
            if (currentArgIndex === 2) list = ["true", "false"];
        } else if (cmdName === "terrain") {
            if (currentArgIndex === 1) list = ["rise", "sink"];
            if (currentArgIndex === 2) list = ["5", "10", "20"];
        } else if (cmdName === "foliagecolor") {
            if (currentArgIndex === 1) list = ["base", "orange", "murky", "birch"];
        } else if (cmdName === "enchant") {
            // No arguments for simple enchant
        } else if (cmdName === "shoot") {
            if (currentArgIndex === 1) list = ["arrow", "snowball", "ender_pearl"];
        } else if (cmdName === "blockproperty") {
            if (currentArgIndex === 1) list = Object.keys(this.itemMap);
            if (currentArgIndex === 2) list = ["gravity"];
            if (currentArgIndex === 3) list = ["true", "false"];
        }

        // Filter list based on current word
        const matches = list.filter(val => val.toLowerCase().startsWith(currentText.toLowerCase()));

        return matches.map(m => ({
            value: input.substring(0, input.lastIndexOf(" ") + 1) + m,
            display: m,
            info: info
        }));
    }
}


 
