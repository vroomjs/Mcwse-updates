import GuiScreen from "../GuiScreen.js";
import Block from "../../world/block/Block.js";
import Keyboard from "../../../util/Keyboard.js";
import Crafting from "../../crafting/Crafting.js";
import { getToolInfo } from "../../world/block/BlockBreakTimes.js";
import { getFoodStats } from "../../food/FoodStats.js";

export default class GuiInventory extends GuiScreen {

    constructor(player) {
        super();
        this.player = player;
        this.inventory = player.inventory;
        this.craftingItems = new Array(5).fill(null).map(() => ({id: 0, count: 0})); // 0-3 input, 4 output

        this.heldItem = {id: 0, count: 0};
        
        this.selectedTab = 0;
        this.currentScroll = 0.0;
        this.isScrolling = false;
        
        this.creativeTabs = [
            { name: "Building Blocks", icon: 45, items: [2, 3, 110, 62, 566, 1, 4, 48, 121, 122, 120, 220, 221, 222, 562, 563, 564, 560, 561, 45, 98, 109, 108, 97, 43, 497, 498, 5, 201, 210, 304, 305, 47, 208, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 7, 12, 13, 24, 179, 180, 44, 147, 149, 145, 151, 182, 193, 213, 214, 384, 389, 230, 231, 232, 233, 234, 386, 418, 53, 148, 150, 146, 154, 183, 194, 215, 216, 385, 428, 100, 162, 99, 41, 42, 173, 22, 73, 16, 15, 14, 21, 56, 129, 57, 133, 145, 170, 79, 174, 80, 78, 49, 87, 88, 89, 236, 153, 155, 156, 157, 251, 252, 20, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 85, 217, 218, 387, 419, 107, 139, 140, 143, 144, 138, 86, 91, 46, 255, 137] },
            { name: "Decoration Blocks", icon: 38, items: [17, 200, 209, 235, 253, 254, 300, 301, 302, 303, 18, 203, 212, 325, 326, 31, 32, 106, 567, 565, 204, 190, 37, 38, 206, 175, 176, 177, 178, 207, 191, 39, 192, 34, 35, 33, 83, 81, 165, 400, 202, 211, 323, 444, 445, 324, 50, 54, 58, 61, 167, 168, 169, 171, 64, 205, 219, 426, 427, 71, 96, 224, 225, 226, 227, 228, 92, 65, 321, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515] },
            { name: "Redstone", icon: 331, items: [331, 76, 75, 152, 123, 52, 69, 77, 223, 72, 70, 71, 46, 23, 573, 25, 29, 30, 158, 161] },
            { name: "Transportation", icon: 66, items: [66, 158, 328, 333, 411, 412, 424, 425, 408] },
            { name: "Misc", icon: 368, items: [361, 362, 368, 560, 561, 84, 816, 800, 801, 802, 803, 804, 805, 806, 807, 808, 809, 810, 811, 812, 813, 814, 815, 2200, 2201, 2202, 2203, 2204, 2205, 2206, 2207, 2208, 2209, 2210, 2211, 449, 360, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 414, 410, 413, 390, 391, 392, 520, 393, 447, 448, 394, 395, 396, 397, 398, 521, 522, 523, 524, 525, 399, 401, 416, 417, 526, 281, 481, 482, 483, 492, 493, 571] },
            { name: "Foodstuffs", icon: 260, items: [260, 322, 296, 297, 357, 282, 363, 364, 365, 366, 367, 319, 320, 494, 495, 349, 350, 354, 355, 422, 423, 403, 404, 405, 406, 402, 421, 570] },
            { name: "Tools", icon: 258, items: [256, 257, 258, 269, 270, 271, 273, 274, 275, 284, 285, 286, 277, 278, 279, 290, 291, 292, 293, 294, 259, 359, 318, 358, 346] },
            { name: "Combat", icon: 267, items: [267, 268, 272, 283, 276, 261, 499, 262, 306, 307, 308, 309, 314, 315, 316, 317, 310, 311, 312, 313] },
            { name: "Materials", icon: 280, items: [263, 264, 388, 265, 266, 415, 280, 288, 289, 287, 334, 336, 337, 352, 351, 409, 339, 340, 353, 496] },
            { name: "Brewing", icon: 551, items: [550, 551, 552] },
            { name: "Inventory", icon: 54, items: [] }
        ];

        // Populate Combat tab with Enchanted Books
        const combatTab = this.creativeTabs.find(t => t.name === "Combat");
        if (combatTab) {
            for (let i = 3000; i <= 3135; i++) {
                if (Block.getById(i)) combatTab.items.push(i);
            }
        }

        // Populate Brewing tab with all newly registered potions
        const brewingTab = this.creativeTabs.find(t => t.name === "Brewing");
        if (brewingTab) {
            for (let i = 600; i <= 638; i++) if (Block.getById(i)) brewingTab.items.push(i);
            for (let i = 700; i <= 738; i++) if (Block.getById(i)) brewingTab.items.push(i);
        }
        
        this.itemNames = {
            349: "Raw Cod",
            350: "Cooked Cod",
            354: "Raw Salmon",
            355: "Cooked Salmon",
            72: "Wooden Pressure Plate",
            70: "Stone Pressure Plate",
            48: "Mossy Cobblestone",
            97: "Chiseled Stone Bricks",
            109: "Mossy Stone Bricks",
            108: "Cracked Stone Bricks",
            77: "Wooden Button",
            223: "Stone Button",
            1: "Stone", 2: "Grass", 3: "Dirt", 4: "Cobblestone", 5: "Planks", 7: "Bedrock",
            12: "Sand", 13: "Gravel", 14: "Gold Ore", 15: "Iron Ore", 16: "Coal Ore", 73: "Redstone Ore", 129: "Emerald Ore", 17: "Log", 18: "Leaves", 20: "Glass", 24: "Sandstone",
            31: "Grass", 32: "Fern", 37: "Dandelion", 38: "Rose", 39: "Paeonia", 41: "Gold Block", 42: "Iron Block", 
            43: "Smooth Stone", 45: "Bricks", 50: "Torch",
            54: "Chest", 56: "Diamond Ore", 57: "Diamond Block", 133: "Emerald Block", 58: "Crafting Table", 61: "Furnace", 
            64: "Oak Door", 205: "Birch Door", 219: "Spruce Door", 71: "Iron Door", 77: "Button",
            82: "Clay", 98: "Stone Bricks",
            60: "Snowy Grass", 78: "Snow Layer", 79: "Ice", 80: "Snow Block", 174: "Packed Ice",
            497: "Smooth Stone Slab", 498: "Smooth Stone Stairs",
            86: "Pumpkin", 91: "Jack o' Lantern", 33: "Sugar Cane", 83: "Sugar Cane", 81: "Cactus", 106: "Vines",
            44: "Wooden Slab", 53: "Wooden Stairs",
            65: "Ladder", 85: "Fence", 107: "Fence Gate", 139: "Cobblestone Wall",
            145: "Brick Slab", 146: "Brick Stairs",
            147: "Cobblestone Slab", 148: "Cobblestone Stairs",
            149: "Stone Slab", 150: "Stone Stairs",
            151: "Sandstone Slab", 154: "Sandstone Stairs",
            213: "Birch Slab", 215: "Birch Stairs", 217: "Birch Fence",
            214: "Spruce Slab", 216: "Spruce Stairs", 218: "Spruce Fence",
            235: "Acacia Log", 253: "Dark Oak Log",
            254: "Stripped Oak Log", 300: "Stripped Birch Log", 301: "Stripped Spruce Log",
            302: "Stripped Acacia Log", 303: "Stripped Dark Oak Log",
            304: "Acacia Planks", 305: "Dark Oak Planks",
            323: "Acacia Sapling", 324: "Dark Oak Sapling",
            325: "Acacia Leaves", 326: "Dark Oak Leaves",
            321: "Painting",
            87: "Netherrack", 88: "Soul Sand", 49: "Obsidian", 89: "Glowstone", 153: "Nether Quartz Ore",
            155: "Block of Quartz", 156: "Chiseled Quartz Block", 157: "Quartz Pillar",
            256: "Iron Shovel", 257: "Iron Pickaxe", 258: "Iron Axe",
            259: "Flint and Steel",
            306: "Iron Helmet", 307: "Iron Chestplate", 308: "Iron Leggings", 309: "Iron Boots",
            310: "Diamond Helmet", 311: "Diamond Chestplate", 312: "Diamond Leggings", 313: "Diamond Boots",
            314: "Gold Helmet", 315: "Gold Chestplate", 316: "Gold Leggings", 317: "Gold Boots",
            261: "Bow", 262: "Arrow", 263: "Coal", 264: "Diamond", 388: "Emerald", 265: "Iron Ingot", 266: "Gold Ingot", 415: "Nether Quartz",
            268: "Wooden Sword", 269: "Wooden Shovel", 270: "Wooden Pickaxe", 271: "Wooden Axe",
            272: "Stone Sword", 273: "Stone Shovel", 274: "Stone Pickaxe", 275: "Stone Axe",
            276: "Diamond Sword", 277: "Diamond Shovel", 278: "Diamond Pickaxe", 279: "Diamond Axe",
            280: "Stick", 283: "Golden Sword", 284: "Gold Shovel", 285: "Gold Pickaxe", 286: "Gold Axe",
            290: "Wooden Hoe", 291: "Stone Hoe", 292: "Iron Hoe", 293: "Diamond Hoe", 294: "Golden Hoe",
            288: "Feather", 289: "Gunpowder",
            318: "Flint", 334: "Leather", 336: "Brick", 337: "Clay Ball",
            351: "Bone Meal", 352: "Bone",
            359: "Shears", 361: "Bucket", 362: "Water Bucket", 368: "Lava Bucket",
            363: "Raw Beef", 364: "Steak", 365: "Raw Chicken", 366: "Cooked Chicken", 367: "Rotten Flesh",
            319: "Raw Porkchop", 320: "Cooked Porkchop",
            306: "Iron Helmet", 307: "Iron Chestplate", 308: "Iron Leggings", 309: "Iron Boots",
            310: "Diamond Helmet", 311: "Diamond Chestplate", 312: "Diamond Leggings", 313: "Diamond Boots",
            314: "Gold Helmet", 315: "Gold Chestplate", 316: "Gold Leggings", 317: "Gold Boots",
            390: "Cow Spawn Egg", 391: "Chicken Spawn Egg", 392: "Zombie Spawn Egg", 393: "Creeper Spawn Egg",
            394: "Snow Zombie Spawn Egg", 395: "Husk Spawn Egg", 396: "Drowned Spawn Egg", 397: "Villager Spawn Egg", 
            398: "Pig Spawn Egg", 407: "Saddled Pig Spawn Egg", 399: "Skeleton Spawn Egg", 401: "Snow Golem Spawn Egg", 416: "Sheep Spawn Egg", 417: "Spider Spawn Egg",
            448: "Enderman Spawn Egg",
            408: "Saddle", 409: "Glowstone Dust", 410: "Snowball",
            339: "Paper", 353: "Sugar",
            46: "TNT",
            333: "Oak Boat", 411: "Birch Boat", 412: "Spruce Boat",
            400: "Oak Sapling",
            260: "Apple",
            322: "Golden Apple",
            402: "Wheat Seeds",
            296: "Wheat",
            297: "Bread",
            403: "Carrot",
            404: "Golden Carrot",
            405: "Potato",
            406: "Baked Potato",
            34: "Red Mushroom",
            35: "Brown Mushroom",
            66: "Rail",
            170: "Hay Bale",
            110: "Mycelium",
            99: "Mushroom Stem",
            100: "Brown Mushroom Block",
            162: "Red Mushroom Block",
            200: "Birch Log",
            201: "Birch Planks",
            202: "Birch Sapling",
            203: "Birch Leaves",
            209: "Spruce Log",
            210: "Spruce Planks",
            211: "Spruce Sapling",
            212: "Spruce Leaves",
            96: "Oak Trapdoor", 224: "Birch Trapdoor", 225: "Dark Oak Trapdoor",
            226: "Spruce Trapdoor", 227: "Acacia Trapdoor", 228: "Iron Trapdoor",
            204: "Tall Grass",
            384: "Acacia Slab",
            385: "Acacia Stairs",
            386: "Vertical Acacia Slab",
            387: "Acacia Fence",
            389: "Dark Oak Slab",
            428: "Dark Oak Stairs",
            418: "Vertical Dark Oak Slab",
            419: "Dark Oak Fence",
            206: "White Tulip",
            207: "Lily of the Valley",
            208: "White Wool",
            369: "Orange Wool",
            370: "Magenta Wool",
            371: "Light Blue Wool",
            372: "Yellow Wool",
            373: "Lime Wool",
            374: "Pink Wool",
            375: "Gray Wool",
            376: "Light Gray Wool",
            377: "Cyan Wool",
            378: "Purple Wool",
            379: "Blue Wool",
            380: "Brown Wool",
            381: "Green Wool",
            382: "Red Wool",
            383: "Black Wool",
            230: "Vertical Oak Slab",
            231: "Vertical Stone Slab",
            232: "Vertical Cobblestone Slab",
            233: "Vertical Birch Slab",
            234: "Vertical Spruce Slab",
            220: "Granite",
            221: "Diorite",
            222: "Andesite",
            173: "Block of Coal",
            21: "Lapis Lazuli Ore",
            22: "Lapis Lazuli Block",
            255: "Structure Block",
            137: "Command Block",
            236: "Magma Block",
            179: "Cut Sandstone",
            180: "Chiseled Sandstone",
            251: "Quartz Slab",
            252: "Quartz Stairs",
            237: "Lime Stained Glass",
            238: "Green Stained Glass",
            239: "Pink Stained Glass",
            240: "Orange Stained Glass",
            241: "Cyan Stained Glass",
            242: "White Stained Glass",
            243: "Light Blue Stained Glass",
            244: "Magenta Stained Glass",
            245: "Yellow Stained Glass",
            246: "Gray Stained Glass",
            247: "Black Stained Glass",
            248: "Blue Stained Glass",
            249: "Brown Stained Glass",
            250: "Light Gray Stained Glass",
            84: "Jukebox",
            172: "Enderman Head",
            2200: "Music Disc (11)",
            2201: "Music Disc (13)",
            2202: "Music Disc (Blocks)",
            2203: "Music Disc (Cat)",
            2204: "Music Disc (Chirp)",
            2205: "Music Disc (Far)",
            2206: "Music Disc (Mall)",
            2207: "Music Disc (Mellohi)",
            2208: "Music Disc (Stal)",
            2209: "Music Disc (Strad)",
            2210: "Music Disc (Wait)",
            2211: "Music Disc (Ward)",
            29: "Piston",
            30: "Sticky Piston",
            76: "Redstone Torch",
            420: "Beetroots",
            421: "Beetroot Seeds",
            422: "Beetroot",
            423: "Beetroot Soup",
            123: "Redstone Lamp",
            450: "Terracotta", 451: "Brown Terracotta", 452: "Orange Terracotta", 453: "Green Terracotta", 454: "Light Blue Terracotta", 455: "Purple Terracotta", 456: "Gray Terracotta", 457: "Pink Terracotta", 458: "White Terracotta", 459: "Black Terracotta", 460: "Lime Terracotta", 461: "Cyan Terracotta", 462: "Light Gray Terracotta", 463: "Red Terracotta", 464: "Yellow Terracotta", 465: "Magenta Terracotta",
            466: "Red Glazed Terracotta", 467: "Orange Glazed Terracotta", 468: "Yellow Glazed Terracotta", 469: "Lime Glazed Terracotta", 470: "Blue Glazed Terracotta", 471: "Magenta Glazed Terracotta", 472: "Pink Glazed Terracotta", 473: "Gray Glazed Terracotta", 474: "Light Gray Glazed Terracotta", 475: "Cyan Glazed Terracotta", 476: "Purple Glazed Terracotta", 477: "Brown Glazed Terracotta", 478: "Green Glazed Terracotta", 479: "Black Glazed Terracotta", 480: "White Glazed Terracotta",
            121: "End Stone", 122: "End Stone Bricks", 120: "End Portal Frame", 360: "Eye of Ender",
            165: "Slime Block", 496: "Slime Ball", 167: "Anvil", 168: "Skeleton Head", 169: "Zombie Head", 171: "Creeper Head",
            500: "White Carpet", 501: "Orange Carpet", 502: "Magenta Carpet", 503: "Light Blue Carpet",
            504: "Yellow Carpet", 505: "Lime Carpet", 506: "Pink Carpet", 507: "Gray Carpet",
            508: "Light Gray Carpet", 509: "Cyan Carpet", 510: "Purple Carpet", 511: "Blue Carpet",
            512: "Brown Carpet", 513: "Green Carpet", 514: "Red Carpet", 515: "Black Carpet"
        };

        this.swordDamages = {
            268: 1.25, // Wooden
            283: 1.25, // Golden
            272: 2.0,  // Stone
            267: 3.5,  // Iron
            276: 4.0   // Diamond
        };
    }

    init() {
        super.init();
        this.inventoryBackground = this.getTexture("../../inventoryUIborder.png");
        this.inventorySlot = this.getTexture("../../inventoryslot.png");
        this.arrow = this.getTexture("../../arrow_0_0.png");
        
        this.tabSelected = this.getTexture("../../tabselected_1_0 (2).png");
        this.tabUnselected = this.getTexture("../../tabnotselected_0_0 (8).png");
        this.textureGui = this.getTexture("gui/gui.png");

        this.inventoryWidth = 176;
        this.inventoryHeight = 170; // Slightly increased height for the gap

        this.guiLeft = (this.width - this.inventoryWidth) / 2;
        this.guiTop = (this.height - this.inventoryHeight) / 2 - 5;

        // Trigger Achievement
        this.minecraft.achievementManager.grant('takinginventory');
    }

    updateScreen() {
        super.updateScreen();
        // Removed auto-rotation for inventory preview
    }

    doesGuiPauseGame() {
        return false;
    }

    getVisibleItemsForTab(tabIndex) {
        // Safety for tabs that might not have defined item arrays (like Inventory tab 10)
        if (!this.creativeTabs[tabIndex] || !this.creativeTabs[tabIndex].items) {
            return [];
        }

        return this.creativeTabs[tabIndex].items;
    }

    handleMouseScroll(delta) {
        if (this.selectedTab === 10) return; // No scroll in inventory tab (index 10)
        
        let items = this.getVisibleItemsForTab(this.selectedTab);
        let totalRows = Math.ceil(items.length / 9);
        if (totalRows <= 5) return;

        // Browser wheel deltaY is positive when scrolling down.
        // Step size: 1 row = 1 / (totalRows - 5)
        
        let step = 1.0 / (totalRows - 5);
        this.currentScroll += delta * step;
        
        if (this.currentScroll < 0) this.currentScroll = 0;
        if (this.currentScroll > 1) this.currentScroll = 1;
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        // Draw transparent background
        this.drawRect(stack, 0, 0, this.width, this.height, 'black', 0.6);

        let isCreative = this.player.gameMode === 1;

        if (isCreative) {
            this.drawCreativeScreen(stack, mouseX, mouseY);
        } else {
            this.drawSurvivalScreen(stack, mouseX, mouseY);
        }

        // Draw character preview area (black rectangle beside armor slots)
        if (!isCreative || this.selectedTab === 10) { // 10 is now the Inventory tab index
            const boxX = this.guiLeft + 25;
            // Raised by 1 pixel and shifted left to be directly beside armor
            const boxY = this.guiTop + 7;
            const boxW = 51; 
            const boxH = 72;

            // Draw slot-like outer rim
            this.drawRect(stack, boxX, boxY, boxX + boxW, boxY + boxH, "#373737"); // Dark top/left
            this.drawRect(stack, boxX + 1, boxY + 1, boxX + boxW, boxY + boxH, "#FFFFFF"); // Light bottom/right
            this.drawRect(stack, boxX + 1, boxY + 1, boxX + boxW - 1, boxY + boxH - 1, "black"); // Inner fill

            // Render 3D Player Model - Reactive to mouse cursor
            const centerX = boxX + boxW / 2;
            const centerLookY = boxY + 12; // Approximate head level for looking logic
            const renderY = boxY + boxH - 52; // Adjusted vertically to center correctly in the preview box
            
            // Calculate rotation to face mouse
            let dx = mouseX - centerX; 
            let dy = mouseY - centerLookY;
            
            // Calculate relative look angles (degrees)
            // headYaw: Positive dx (mouse right) results in positive yaw (turns to player's left, our right)
            let headYaw = Math.atan(dx / 40.0) * 40.0;
            let headPitch = Math.atan(dy / 40.0) * 20.0;
            
            // bodyYaw: Base is 180 (facing us). Increase rotation responsiveness for body turning.
            let bodyYaw = 180 + Math.atan(dx / 40.0) * 40.0; 

            // Scale 1.8 relative to pixel units for ~60px height
            this.minecraft.itemRenderer.renderPlayerInGui(this.player, centerX, renderY, 1.85, bodyYaw * (Math.PI / 180), headYaw, headPitch);
        }

        // Render held item at cursor position if present
        if (this.heldItem && this.heldItem.id !== 0) {
            let block = Block.getById(this.heldItem.id);
            if (block) {
                // Held item is centered exactly on the cursor. Pass z=30 to ensure it stays above slots.
                this.minecraft.itemRenderer.renderItemInGui("held_item", block, mouseX, mouseY, 10, 1.0, 30, this.heldItem.tag);
                if (this.heldItem.count > 1) {
                    this.drawRightString(stack, "" + this.heldItem.count, mouseX + 8, mouseY + 4, 0xFFFFFF);
                }
            }
        } else {
            // Clear held item mesh
            if (this.minecraft.itemRenderer.items["held_item"]) {
                this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items["held_item"].group);
                delete this.minecraft.itemRenderer.items["held_item"];
            }
        }
        
    }

    drawForeground(stack, mouseX, mouseY, partialTicks) {
        let isCreative = this.player.gameMode === 1;

        // Draw Durability and Counts for all slots on the top layer
        // Hotbar
        for (let i = 0; i < 9; i++) {
            let x = this.guiLeft + 8 + i * 18;
            let y = this.guiTop + 146; // Shifted down 4px
            this.drawSlotForeground(stack, x, y, i);
        }

        if (isCreative && this.selectedTab !== 10) {
            // No additional foreground items for creative grid as they are virtual and have no durability
        } else {
            // Main Inventory
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 9; col++) {
                    let x = this.guiLeft + 8 + col * 18;
                    let y = this.guiTop + 84 + row * 18; // Shifted down 4px for gap
                    this.drawSlotForeground(stack, x, y, col + row * 9 + 9);
                }
            }
            // Armor
            for (let i = 0; i < 4; i++) {
                this.drawSlotForeground(stack, this.guiLeft + 8, this.guiTop + 8 + i * 18, 41 + i);
            }
            // Offhand
            this.drawSlotForeground(stack, this.guiLeft + 77, this.guiTop + 62, 45);
            // Crafting
            let x_craft = this.guiLeft + 84;
            let y_craft = this.guiTop + 26;
            this.drawSlotForeground(stack, x_craft, y_craft, 36);
            this.drawSlotForeground(stack, x_craft + 18, y_craft, 37);
            this.drawSlotForeground(stack, x_craft, y_craft + 18, 38);
            this.drawSlotForeground(stack, x_craft + 18, y_craft + 18, 39);
            this.drawSlotForeground(stack, x_craft + 68, y_craft + 9, 40);
        }

        this.drawTooltips(stack, mouseX, mouseY, isCreative);
    }

    drawSlotForeground(stack, x, y, index) {
        let itemStack;
        if (index >= 41 && index <= 44) itemStack = this.inventory.getArmor(index - 41);
        else if (index >= 36) {
            if (index === 40) itemStack = this.craftingItems[4];
            else itemStack = this.craftingItems[index - 36];
        } else itemStack = this.inventory.getStackInSlot(index);

        if (itemStack && itemStack.id !== 0) {
            let block = Block.getById(itemStack.id);
            if (!block) return;

            // Count
            if (itemStack.count > 1 && (!block.maxStackSize || block.maxStackSize > 1)) {
                this.drawRightString(stack, "" + itemStack.count, x + 17, y + 9, 0xFFFFFF);
            }

            // Durability
            if (block.maxDamage > 0 && itemStack.damage > 0) {
                this.drawDurabilityBar(stack, x, y, itemStack.damage, block.maxDamage);
            }
        }
    }

    drawTooltips(stack, mouseX, mouseY, isCreative) {
        // 1. Tab Tooltips
        if (isCreative) {
            for (let i = 0; i < this.creativeTabs.length; i++) {
                let col = i % 6;
                let isBottom = i >= 6;
                let x = this.guiLeft + col * 29;
                let y = isBottom ? this.guiTop + 162 : this.guiTop - 28;
                if (mouseX >= x && mouseX < x + 28 && mouseY >= y && mouseY < y + 32) {
                    this.drawTooltip(stack, this.creativeTabs[i].name, mouseX, mouseY);
                    return; // Only show one tooltip
                }
            }
        }

        // 2. Item Tooltips
        let slot = this.getSlotAt(mouseX, mouseY);
        if (slot === -1) return;

        let targetStack = null;

        if (isCreative) {
            if (slot <= -200 && slot > -300) {
                // Creative grid item
                let index = -(slot + 200);
                let items = this.getVisibleItemsForTab(this.selectedTab);
                let totalRows = Math.ceil(items.length / 9);
                let scrollRow = (totalRows > 5) ? Math.round(this.currentScroll * (totalRows - 5)) : 0;
                let realIndex = (scrollRow * 9) + index;
                
                if (realIndex < items.length) {
                    let entry = items[realIndex];
                    if (typeof entry === 'number') {
                        targetStack = { id: entry, count: 1, tag: {} };
                    }
                }
            } else if (this.selectedTab === 10 && slot >= 36 && slot <= 40) { // Inventory tab check
                targetStack = (slot === 40) ? this.craftingItems[4] : this.craftingItems[slot - 36];
            } else if (slot >= 41 && slot <= 44) {
                targetStack = this.inventory.getArmor(slot - 41);
            } else if (slot === 45) {
                targetStack = this.inventory.offhand;
            } else if (slot >= 0) {
                targetStack = this.inventory.getStackInSlot(slot);
            }
        } else {
            // Survival
            if (slot >= 41 && slot <= 44) targetStack = this.inventory.getArmor(slot - 41);
            else if (slot === 45) targetStack = this.inventory.offhand;
            else if (slot >= 36 && slot <= 40) targetStack = (slot === 40) ? this.craftingItems[4] : this.craftingItems[slot - 36];
            else targetStack = this.inventory.getStackInSlot(slot);
        }

        if (targetStack && targetStack.id !== 0) {
            let block = Block.getById(targetStack.id);
            let name = (block ? block.name : null) || this.itemNames[targetStack.id] || "Unknown Item";
            
            // Special handling for Enchanted Book name
            if (block && block.enchantmentName) {
                name = "§e" + block.enchantmentName;
            }

            let tag = targetStack.tag || {};
            if (tag.name) name = tag.name;
            
            this.drawTooltip(stack, name, mouseX, mouseY, targetStack.id, tag, targetStack);
        }
    }

    getRoman(num) {
        const lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
        let roman = '';
        for (let i in lookup) {
            while (num >= lookup[i]) {
                roman += i;
                num -= lookup[i];
            }
        }
        return roman || String(num);
    }

    drawTooltip(stack, text, x, y, itemId, tag = null, itemStack = null) {
        let width = this.getStringWidth(stack, text);
        let height = 8;

        // Check for additional stats (Tools/Swords)
        let extraLines = [];

        // Apply Enchantment Stat Boosts to Tooltip
        let damageBoost = 0;
        let speedBoost = 1.0;
        let protectionBoost = 0;

        if (tag && tag.enchantments) {
            const en = tag.enchantments;
            if (en.sharpness) damageBoost += (en.sharpness * 0.5) + 0.5;
            if (en.efficiency) speedBoost += (en.efficiency * en.efficiency + 1);
            if (en.protection) protectionBoost += en.protection;
        }
        
        // Food values
        const foodBlock = Block.getById(itemId);
        const foodStats = getFoodStats(itemId) || (foodBlock && foodBlock.isFood ? {
            hunger: foodBlock.hungerValue || 0,
            saturation: foodBlock.saturation || 0
        } : null);

        if (foodStats && foodStats.hunger > 0) {
            extraLines.push("§a+ " + foodStats.hunger + " hunger points");
            extraLines.push("§6+ " + foodStats.saturation.toFixed(1) + " saturation");
            if (itemId === 322) {
                extraLines.push("§dRegeneration x2 (20s)");
            }
            if (itemId === 367) {
                extraLines.push("§c80% Hunger (30s)");
            }
            if (itemId === 365) {
                extraLines.push("§c40% Hunger (30s)");
            }
        }

        // Check Sword
        if (this.swordDamages[itemId]) {
            const totalDmg = (this.swordDamages[itemId] + damageBoost).toFixed(1);
            extraLines.push("§9+ " + totalDmg + " Attack Damage");
        } else {
            // Check Tool
            let toolInfo = getToolInfo(itemId);
            if (toolInfo) {
                let profession = "tool";
                if (toolInfo.type === 'pickaxe') profession = "mining";
                if (toolInfo.type === 'shovel') profession = "digging";
                if (toolInfo.type === 'axe') profession = "chopping";
                if (toolInfo.type === 'plant') profession = "pruning";
                
                // Format like "+1.0x mining"
                const totalSpeed = (toolInfo.speed * speedBoost).toFixed(1);
                extraLines.push("§7+ " + totalSpeed + "x " + profession);
            }
        }

        // Check Armor
        const armorBlock = Block.getById(itemId);
        if (armorBlock && armorBlock.armorType !== undefined) {
             let defense = 0; // Simplified defense calculation
             if (itemId >= 306 && itemId <= 309) defense = 2; // Iron base
             if (itemId >= 310 && itemId <= 313) defense = 3; // Diamond base
             if (itemId >= 314 && itemId <= 317) defense = 1; // Gold base
             
             // Adjust per type: Helmet/Boots=1, Chestplate=3, Leggings=2
             let typeMod = 0;
             if (armorBlock.armorType === 0 || armorBlock.armorType === 3) typeMod = 1;
             else if (armorBlock.armorType === 1) typeMod = 3;
             else if (armorBlock.armorType === 2) typeMod = 2;
             
             // Total defense (half hearts)
             let totalDefense = (defense * typeMod) + protectionBoost;

             if (totalDefense > 0) {
                extraLines.push("§b+ " + totalDefense + " Defense Points");
             }
        }

        // Display durability value
        const block = Block.getById(itemId);
        if (block && block.maxDamage > 0) {
            let damage = tag ? (tag.damage || 0) : (itemStack ? (itemStack.damage || 0) : 0);
            let current = block.maxDamage - damage;
            extraLines.push(`§7Durability: ${current} / ${block.maxDamage}`);
        }

        // Display enchantments in tooltip
        if (tag && tag.enchantments) {
            for (let enchId in tag.enchantments) {
                const level = tag.enchantments[enchId];
                const cleanName = enchId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                extraLines.push("§9" + cleanName + " " + this.getRoman(level));
            }
        }

        // Display tags for debug/info
        if (tag) {
            if (tag.onUse) extraLines.push("§eRight-Click: " + tag.onUse);
            if (tag.onHit) extraLines.push("§cOn Hit: " + tag.onHit);
            if (tag.onBreak) extraLines.push("§bOn Break: " + tag.onBreak);
        }

        if (extraLines.length > 0) {
            height += extraLines.length * 12; // Increase height
            // Recalculate width if extra lines are wider
            for (let line of extraLines) {
                let w = this.getStringWidth(stack, line);
                if (w > width) width = w;
            }
        }
        
        let rectX = x + 12;
        let rectY = y - 12;
        
        // Standard Minecraft Tooltip Colors
        // Background: Dark purple (almost black)
        const bgColor = "rgba(16, 0, 16, 0.9)";
        // Border Start: Bright Purple
        const borderStart = "rgba(80, 0, 255, 1)";
        // Border End: Dark Purple
        const borderEnd = "rgba(40, 0, 127, 1)";

        // Background
        this.drawRect(stack, rectX - 3, rectY - 4, rectX + width + 3, rectY - 3, bgColor);
        this.drawRect(stack, rectX - 3, rectY + height + 3, rectX + width + 3, rectY + height + 4, bgColor);
        this.drawRect(stack, rectX - 3, rectY - 3, rectX + width + 3, rectY + height + 3, bgColor);
        this.drawRect(stack, rectX - 4, rectY - 3, rectX - 3, rectY + height + 3, bgColor);
        this.drawRect(stack, rectX + width + 3, rectY - 3, rectX + width + 4, rectY + height + 3, bgColor);
        
        // Border Gradient
        this.drawGradientRect(stack, rectX - 3, rectY - 3 + 1, rectX - 3 + 1, rectY + height + 3 - 1, borderStart, borderEnd);
        this.drawGradientRect(stack, rectX + width + 2, rectY - 3 + 1, rectX + width + 3, rectY + height + 3 - 1, borderStart, borderEnd);
        this.drawGradientRect(stack, rectX - 3, rectY - 3, rectX + width + 3, rectY - 3 + 1, borderStart, borderStart);
        this.drawGradientRect(stack, rectX - 3, rectY + height + 2, rectX + width + 3, rectY + height + 3, borderEnd, borderEnd);

        // Text
        this.drawString(stack, text, rectX, rectY, 0xFFFFFF);

        // Draw extra lines
        for (let i = 0; i < extraLines.length; i++) {
            this.drawString(stack, extraLines[i], rectX, rectY + 12 + i * 12, 0xFFFFFF);
        }
    }

    drawSurvivalScreen(stack, mouseX, mouseY) {
        // Draw inventory background
        this.drawSprite(stack, this.inventoryBackground, 0, 0, this.getTextureWidth(this.inventoryBackground, 176), this.getTextureHeight(this.inventoryBackground, 170), this.guiLeft, this.guiTop, this.inventoryWidth, this.inventoryHeight);

        // Draw crafting grid
        let x_craft = this.guiLeft + 84;
        let y_craft = this.guiTop + 26;

        // 2x2 input
        this.drawSlot(stack, x_craft, y_craft, 36);
        this.drawSlot(stack, x_craft + 18, y_craft, 37);
        this.drawSlot(stack, x_craft, y_craft + 18, 38);
        this.drawSlot(stack, x_craft + 18, y_craft + 18, 39);

        // Arrow
        this.drawSprite(stack, this.arrow, 0, 0, this.getTextureWidth(this.arrow, 22), this.getTextureHeight(this.arrow, 15), x_craft + 40, y_craft + 9, 22, 15);

        // Output
        this.drawSlot(stack, x_craft + 68, y_craft + 9, 40);

        // Armor Slots
        let x_armor = this.guiLeft + 8;
        let y_armor_start = this.guiTop + 8;
        for (let i = 0; i < 4; i++) {
            this.drawSlot(stack, x_armor, y_armor_start + i * 18, 41 + i);
        }

        // Offhand Slot (Beside the preview box)
        this.drawSlot(stack, this.guiLeft + 77, this.guiTop + 62, 45);

        // Draw player inventory slots
        // Main inventory: 3 rows of 9
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                let x = this.guiLeft + 8 + col * 18;
                let y = this.guiTop + 84 + row * 18; // Shifted down 4px for gap
                let index = col + row * 9 + 9; // slots 9 to 35
                this.drawSlot(stack, x, y, index);
            }
        }

        // Hotbar: 1 row of 9
        for (let i = 0; i < 9; i++) {
            let x = this.guiLeft + 8 + i * 18;
            let y = this.guiTop + 146; // Shifted down 4px
            this.drawSlot(stack, x, y, i);
        }
    }

    drawCreativeScreen(stack, mouseX, mouseY) {
        // Draw unselected tabs first
        for (let i = 0; i < this.creativeTabs.length; i++) {
            if (i !== this.selectedTab) {
                this.drawTab(stack, i, false);
            }
        }

        // Draw background
        this.drawSprite(stack, this.inventoryBackground, 0, 0, this.getTextureWidth(this.inventoryBackground, 176), this.getTextureHeight(this.inventoryBackground, 170), this.guiLeft, this.guiTop, this.inventoryWidth, this.inventoryHeight);
        
        if (this.selectedTab !== 10) {
            // Cover the survival inventory slots with a flat color to provide a clean canvas for the creative grid
            this.drawRect(stack, this.guiLeft + 8, this.guiTop + 17, this.guiLeft + 168, this.guiTop + 138, "#C6C6C6");
            
            // Draw Scrollbar
            let items = this.getVisibleItemsForTab(this.selectedTab);
            let totalRows = Math.ceil(items.length / 9);
            let canScroll = totalRows > 5;
            
            let scrollX = this.guiLeft + 175; // Right edge
            let scrollY = this.guiTop + 18;
            let scrollH = 112; // Height of scroll track
            
            // Track (darker)
            // this.drawRect(stack, scrollX, scrollY, scrollX + 12, scrollY + scrollH, "#202020");
            // Standard MC uses a specific texture, we can draw a rectangle
            
            let thumbH = 15;
            let thumbY = scrollY;
            
            if (canScroll) {
                thumbY += this.currentScroll * (scrollH - thumbH);
            }
            
            // Draw Scrollbar (active or disabled look)
            let color = canScroll ? "#808080" : "#606060"; // Disabled is darker
            let border = canScroll ? "#FFFFFF" : "#A0A0A0";
            
            this.drawRect(stack, scrollX, thumbY, scrollX + 12, thumbY + thumbH, "#000000"); // Border
            this.drawRect(stack, scrollX + 1, thumbY + 1, scrollX + 11, thumbY + thumbH - 1, color); // Fill
            // Highlights
            this.drawRect(stack, scrollX + 1, thumbY + 1, scrollX + 11, thumbY + 2, border); 
            this.drawRect(stack, scrollX + 1, thumbY + 1, scrollX + 2, thumbY + thumbH - 1, border);
        }

        // Draw selected tab (to cover border)
        this.drawTab(stack, this.selectedTab, true);

        // Draw tab icons
        for (let i = 0; i < this.creativeTabs.length; i++) {
            let col = i % 6;
            let isBottom = i >= 6;
            let x = this.guiLeft + col * 29 + 6;
            let y = isBottom ? this.guiTop + 172 : this.guiTop - 20;
            let iconId = this.creativeTabs[i].icon;
            let block = Block.getById(iconId);
            
            if (block) {
                this.minecraft.itemRenderer.renderItemInGui("creative_tab_icon_" + i, block, x + 8, y + 8, 10, 1.0);
            }
        }

        // Draw Tab Name (No Shadow for cleaner look on tabs)
        this.drawStringNoShadow(stack, this.creativeTabs[this.selectedTab].name, this.guiLeft + 8, this.guiTop + 6, 0x404040);

        // Draw Content
        if (this.selectedTab === 10) { // Inventory Tab (Now at index 10)
            // Draw Crafting Grid (copied from drawSurvivalScreen)
            let x_craft = this.guiLeft + 84;
            let y_craft = this.guiTop + 26;

            // 2x2 input
            this.drawSlot(stack, x_craft, y_craft, 36);
            this.drawSlot(stack, x_craft + 18, y_craft, 37);
            this.drawSlot(stack, x_craft, y_craft + 18, 38);
            this.drawSlot(stack, x_craft + 18, y_craft + 18, 39);

            // Arrow
            this.drawSprite(stack, this.arrow, 0, 0, this.getTextureWidth(this.arrow, 22), this.getTextureHeight(this.arrow, 15), x_craft + 40, y_craft + 9, 22, 15);

            // Output
            this.drawSlot(stack, x_craft + 68, y_craft + 9, 40);

            // Armor Slots
            let x_armor = this.guiLeft + 8;
            let y_armor_start = this.guiTop + 8;
            for (let i = 0; i < 4; i++) {
                this.drawSlot(stack, x_armor, y_armor_start + i * 18, 41 + i);
            }

            // Draw player inventory slots (same positions as survival)
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 9; col++) {
                    let x = this.guiLeft + 8 + col * 18;
                    let y = this.guiTop + 84 + row * 18; // Shifted down 4px for gap
                    let index = col + row * 9 + 9;
                    this.drawSlot(stack, x, y, index);
                }
            }
            // Hotbar
            for (let i = 0; i < 9; i++) {
                let x = this.guiLeft + 8 + i * 18;
                let y = this.guiTop + 146; // Fixed Y position to align with background
                this.drawSlot(stack, x, y, i);
            }
        } else {
            // Draw Creative Item Grid
            let items = this.getVisibleItemsForTab(this.selectedTab);
            let rows = 5;
            let cols = 9;
            
            let totalRows = Math.ceil(items.length / 9);
            let scrollRow = 0;
            if (totalRows > 5) {
                scrollRow = Math.round(this.currentScroll * (totalRows - 5));
            }
            let startIndex = scrollRow * 9;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    let slotIndex = r * cols + c; // visual index 0-44
                    let realIndex = startIndex + slotIndex;
                    
                    let x = this.guiLeft + 9 + c * 18;
                    let y = this.guiTop + 34 + r * 18;
                    
                    // Draw slot background
                    this.drawSprite(stack, this.inventorySlot, 0, 0, 18, 18, x - 1, y - 1, 18, 18);
                    
                    if (realIndex < items.length) {
                        let id = items[realIndex];
                        let block = Block.getById(id);
                        let renderId = "creative_slot_" + slotIndex;
                        // Center item in 18x18 slot
                        this.minecraft.itemRenderer.renderItemInGui(renderId, block, x + 8, y + 8, 10, 1.0, 0, null);
                    } else {
                        // Clear slot
                        let renderId = "creative_slot_" + slotIndex;
                        if (this.minecraft.itemRenderer.items[renderId]) {
                            this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items[renderId].group);
                            delete this.minecraft.itemRenderer.items[renderId];
                        }
                    }
                }
            }

            // Draw Hotbar (so player can put items in it)
            for (let i = 0; i < 9; i++) {
                let x = this.guiLeft + 8 + i * 18;
                let y = this.guiTop + 146; // Shifted down 4px
                this.drawSlot(stack, x, y, i);
            }
        }
    }

    drawTab(stack, index, isSelected) {
        let col = index % 6;
        let isBottom = index >= 6;
        let x = this.guiLeft + col * 29;
        let y = isBottom ? this.guiTop + 162 : this.guiTop - 28;
        let w = 28;
        let h = 32;
        
        let texture = isSelected ? this.tabSelected : this.tabUnselected;
        
        stack.save();
        if (isBottom) {
            // Flip tab for bottom row
            stack.translate(x + w / 2, y + h / 2);
            stack.scale(1, -1);
            this.drawSprite(stack, texture, 0, 0, this.getTextureWidth(texture, w), this.getTextureHeight(texture, h), -w / 2, -h / 2, w, h);
        } else {
            this.drawSprite(stack, texture, 0, 0, this.getTextureWidth(texture, w), this.getTextureHeight(texture, h), x, y, w, h);
        }
        stack.restore();
    }

    drawSlot(stack, x, y, index) {
        this.drawSprite(stack, this.inventorySlot, 0, 0, this.getTextureWidth(this.inventorySlot, 18), this.getTextureHeight(this.inventorySlot, 18), x - 1, y - 1, 18, 18);

        // Hover highlight
        let mouseX = this.minecraft.window.mouseX;
        let mouseY = this.minecraft.window.mouseY;
        if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
            this.drawRect(stack, x, y, x + 16, y + 16, "rgba(255, 255, 255, 0.3)");
        }

        let itemStack;
        if (index === 45) {
            itemStack = this.inventory.getStackInSlot(45);
        } else if (this.player.gameMode === 1 && this.selectedTab !== 10) {
             itemStack = this.inventory.getStackInSlot(index);
        } else {
            // Survival or Creative Inventory Tab
            if (index >= 41 && index <= 44) {
                // Armor Slots (41=H, 42=C, 43=L, 44=B -> Index 0..3)
                itemStack = this.inventory.getArmor(index - 41);
            } else if (index >= 36 && index <= 40) {
                if (index === 40) itemStack = this.craftingItems[4];
                else itemStack = this.craftingItems[index - 36];
            } else {
                itemStack = this.inventory.getStackInSlot(index);
            }
        }

        const prefix = (this.playerIdx === 1 ? "p2_" : "p1_");
        let renderId = prefix + "inventory_slot_" + index;
        if (itemStack && itemStack.id !== 0) {
            let block = Block.getById(itemStack.id);
            // Center item in 18x18 slot
            this.minecraft.itemRenderer.renderItemInGui(renderId, block, x + 8, y + 8, 10, 1.0, 0, itemStack.tag);
        } else {
            // Clear slot mesh if empty
            if (this.minecraft.itemRenderer.items[renderId]) {
                this.minecraft.itemRenderer.scene.remove(this.minecraft.itemRenderer.items[renderId].group);
                delete this.minecraft.itemRenderer.items[renderId];
            }
        }
    }

    updateCraftingOutput() {
        if (this.player.gameMode === 1 && this.selectedTab !== 10) return; 
        const input = [
            this.craftingItems[0].id,
            this.craftingItems[1].id,
            this.craftingItems[2].id,
            this.craftingItems[3].id
        ];
        const output = Crafting.checkRecipe(input, 2);
        this.craftingItems[4] = output;
    }

    consumeIngredients() {
        // Check achievements on craft
        if (this.craftingItems[4].id !== 0) {
            this.minecraft.stats.itemsCrafted++;
            this.checkCraftAchievement(this.craftingItems[4].id);
        }

        if (this.player.gameMode === 1 && this.selectedTab !== 10) return;
        for (let i = 0; i < 4; i++) {
            if (this.craftingItems[i].id !== 0) {
                this.craftingItems[i].count--;
                if (this.craftingItems[i].count <= 0) {
                    this.craftingItems[i] = {id: 0, count: 0};
                }
            }
        }
    }

    onClose() {
        // Return held item to inventory or drop if full
        if (this.heldItem.id !== 0) {
            // In creative, if holding an item and closing, just destroy it or return?
            // Vanilla keeps it on cursor or returns. Let's return.
            let remainder = this.inventory.addItemStack(this.heldItem);
            // Drop remainder? Or just void it in creative? Voiding is fine.
            if (remainder > 0 && this.player.gameMode !== 1) {
                for (let k = 0; k < remainder; k++) {
                    this.minecraft.player.dropItem({id: this.heldItem.id, count: 1});
                }
            }
            this.heldItem = {id: 0, count: 0};
        }
        
        if (this.player.gameMode === 0) {
            // Return crafting items to inventory or drop
            for (let i = 0; i < 4; i++) {
                let item = this.craftingItems[i];
                if (item.id !== 0) {
                    let remainder = this.inventory.addItemStack(item);
                    if (remainder > 0) {
                        for (let k = 0; k < remainder; k++) {
                            this.minecraft.player.dropItem({id: item.id, count: 1});
                        }
                    }
                    this.craftingItems[i] = {id: 0, count: 0};
                }
            }
        }
    }

    keyTyped(key, character) {
        if (key === this.minecraft.settings.inventory || key === "Escape") {
            this.minecraft.displayScreen(null);
            return true;
        }
        return super.keyTyped(key, character);
    }

    getSlotAt(mouseX, mouseY) {
        if (this.player.gameMode === 1) {
            // Creative Mode
            // Tabs
            for (let i = 0; i < this.creativeTabs.length; i++) {
                let col = i % 6; // Updated to support more tabs per row
                let isBottom = i >= 6;
                let x = this.guiLeft + col * 29;
                let y = isBottom ? this.guiTop + 162 : this.guiTop - 28;
                if (mouseX >= x && mouseX < x + 28 && mouseY >= y && mouseY < y + 32) {
                    return -100 - i; // Special IDs for tabs
                }
            }
            
            // Check Scrollbar click area
            if (this.selectedTab !== 10) {
                let scrollX = this.guiLeft + 175;
                let scrollY = this.guiTop + 18;
                if (mouseX >= scrollX && mouseX <= scrollX + 12 && mouseY >= scrollY && mouseY <= scrollY + 112) {
                    return -300; // Scrollbar ID
                }
            }

            if (this.selectedTab === 10) {
                // Inventory Tab: Main inventory + Hotbar + Crafting
                
                // Crafting grid
                let x_craft = this.guiLeft + 84;
                let y_craft = this.guiTop + 26;
                for (let row = 0; row < 2; row++) {
                    for (let col = 0; col < 2; col++) {
                        let x = x_craft + col * 18;
                        let y = y_craft + row * 18;
                        if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
                            return 36 + col + row * 2;
                        }
                    }
                }

                // Crafting output
                let x_output = x_craft + 68;
                let y_output = y_craft + 9;
                if (mouseX >= x_output && mouseX < x_output + 18 && mouseY >= y_output && mouseY < y_output + 18) {
                    return 40;
                }

                // Armor slots (41-44)
                let x_armor = this.guiLeft + 8;
                let y_armor_start = this.guiTop + 8;
                for (let i = 0; i < 4; i++) {
                    let y = y_armor_start + i * 18;
                    if (mouseX >= x_armor && mouseX < x_armor + 18 && mouseY >= y && mouseY < y + 18) {
                        return 41 + i;
                    }
                }

                // Offhand
                if (mouseX >= this.guiLeft + 77 && mouseX < this.guiLeft + 95 && mouseY >= this.guiTop + 62 && mouseY < this.guiTop + 80) return 45;

                // Main inventory
                for (let row = 0; row < 3; row++) {
                    for (let col = 0; col < 9; col++) {
                        let x = this.guiLeft + 8 + col * 18;
                        let y = this.guiTop + 84 + row * 18;
                        if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
                            return col + row * 9 + 9;
                        }
                    }
                }
            } else {
                // Creative Grid (Virtual Slots)
                let items = this.getVisibleItemsForTab(this.selectedTab);
                let rows = 5;
                let cols = 9;
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        let index = r * cols + c;
                        // Always return the visual slot index, we resolve real item later
                        let x = this.guiLeft + 9 + c * 18;
                        let y = this.guiTop + 34 + r * 18;
                        if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
                            return -200 - index; // Virtual item slot 0-44
                        }
                    }
                }
            }

            // Hotbar (always visible)
            for (let i = 0; i < 9; i++) {
                let x = this.guiLeft + 8 + i * 18;
                let y = this.guiTop + 146; // Shifted down 4px
                if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
                    return i;
                }
            }

            return -1;
        }

        // Survival Mode
        // Armor Slots
        let x_armor = this.guiLeft + 8;
        let y_armor_start = this.guiTop + 8;
        for (let i = 0; i < 4; i++) {
            let y = y_armor_start + i * 18;
            if (mouseX >= x_armor && mouseX < x_armor + 18 && mouseY >= y && mouseY < y + 18) {
                return 41 + i;
            }
        }

        // Offhand
        if (mouseX >= this.guiLeft + 77 && mouseX < this.guiLeft + 95 && mouseY >= this.guiTop + 62 && mouseY < this.guiTop + 80) return 45;

        // Main inventory
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                let x = this.guiLeft + 8 + col * 18;
                let y = this.guiTop + 84 + row * 18;
                if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
                    return col + row * 9 + 9;
                }
            }
        }
    
        // Hotbar
        for (let i = 0; i < 9; i++) {
            let x = this.guiLeft + 8 + i * 18;
            let y = this.guiTop + 146;
            if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
                return i;
            }
        }

        // Crafting grid
        let x_craft = this.guiLeft + 84;
        let y_craft = this.guiTop + 26;
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                let x = x_craft + col * 18;
                let y = y_craft + row * 18;
                if (mouseX >= x && mouseX < x + 18 && mouseY >= y && mouseY < y + 18) {
                    return 36 + col + row * 2;
                }
            }
        }

        // Crafting output
        let x_output = x_craft + 68;
        let y_output = y_craft + 9;
        if (mouseX >= x_output && mouseX < x_output + 18 && mouseY >= y_output && mouseY < y_output + 18) {
            return 40;
        }
    
        return -1;
    }

    handleShiftMove(slot) {
        let isCreative = this.player.gameMode === 1;
        let targetStack = null;
        let isArmor = slot >= 41 && slot <= 44;
        let isOffhand = slot === 45;
        let isCrafting = slot >= 36 && slot <= 39;
        let isOutput = slot === 40;
        let isHotbar = slot >= 0 && slot <= 8;
        let isMainInv = slot >= 9 && slot <= 35;

        // Resolve stack
        if (isArmor) targetStack = this.inventory.getArmor(slot - 41);
        else if (isOffhand) targetStack = this.inventory.offhand;
        else if (isOutput) targetStack = this.craftingItems[4];
        else if (isCrafting) targetStack = this.craftingItems[slot - 36];
        else targetStack = this.inventory.getStackInSlot(slot);

        if (!targetStack || targetStack.id === 0) return;

        // Logic
        let countBefore = targetStack.count;
        if (isHotbar) {
            // Move 0-8 to 9-35
            targetStack.count = this.inventory.addItemStackRange(targetStack, 9, 35);
        } else {
            // Everything else (Main Inv, Armor, Crafting) moves to Hotbar first
            targetStack.count = this.inventory.addItemStackRange(targetStack, 0, 8);
            if (targetStack.count > 0 && !isMainInv) {
                // If hotbar is full, try main inv
                targetStack.count = this.inventory.addItemStackRange(targetStack, 9, 35);
            }
        }

        // Fix: consume ingredients if taking from crafting output via shift-click
        if (isOutput && targetStack.count < countBefore) {
            this.consumeIngredients();
        }

        if (targetStack.count === 0) {
            targetStack.id = 0;
            targetStack.tag = {};
            targetStack.damage = 0;
        }

        if (isOutput || isCrafting) this.updateCraftingOutput();
        this.minecraft.soundManager.playSound("random.click", 0, 0, 0, 0.4, 1.2);
    }

    mouseClicked(mouseX, mouseY, mouseButton) {
        super.mouseClicked(mouseX, mouseY, mouseButton);

        if (this.player.gameMode === 1) {
            // Creative Click Logic
            if (mouseButton === 0) {
                let slot = this.getSlotAt(mouseX, mouseY);

                // Handle Shift-Click in Creative
                if (slot !== -1 && (Keyboard.isKeyDown("ShiftLeft") || Keyboard.isKeyDown("ShiftRight"))) {
                    if (slot <= -200) { // Clicked creative grid item
                        let index = -(slot + 200);
                        let items = this.getVisibleItemsForTab(this.selectedTab);
                        let totalRows = Math.ceil(items.length / 9);
                        let scrollRow = (totalRows > 5) ? Math.round(this.currentScroll * (totalRows - 5)) : 0;
                        let realIndex = (scrollRow * 9) + index;
                        if (realIndex < items.length) {
                            this.inventory.addItemStack({ id: items[realIndex], count: 64 });
                            this.minecraft.soundManager.playSound("random.click", 0, 0, 0, 0.4, 1.2);
                        }
                    } else if (slot >= 0) {
                        // Clear slot or move? Creative shift-click usually just moves/stacks.
                        this.handleShiftMove(slot);
                    }
                    return;
                }
                
                // Tab clicked
                if (slot <= -100 && slot > -200) {
                    let nextTab = -(slot + 100);
                    if (this.selectedTab !== nextTab) {
                        this.selectedTab = nextTab;
                        this.currentScroll = 0; // Reset scroll on tab change

                        // Clear previous items to prevent ghosts when switching tabs
                        if (this.minecraft.itemRenderer) {
                            this.minecraft.itemRenderer.reset();
                        }
                    }
                    return;
                }
                
                // Scrollbar clicked
                if (slot === -300) {
                    this.isScrolling = true;
                    // Initial update
                    this.mouseDragged(mouseX, mouseY, mouseButton);
                    return;
                }

                // Creative Item clicked
                if (slot <= -200) {
                    let index = -(slot + 200);
                    
                    let items = this.getVisibleItemsForTab(this.selectedTab);
                    let totalRows = Math.ceil(items.length / 9);
                    let scrollRow = 0;
                    if (totalRows > 5) {
                        scrollRow = Math.round(this.currentScroll * (totalRows - 5));
                    }
                    let realIndex = (scrollRow * 9) + index;
                    
                    if (realIndex < items.length) {
                        let id = items[realIndex];
                        let block = Block.getById(id);
                        // Pick up full stack (or 1 if unstackable)
                        this.heldItem = {id: id, count: block.maxStackSize > 1 ? 64 : 1};
                    }
                    return;
                }

                // Inventory/Hotbar slot clicked
                if (slot >= 0) {
                    // Handle creative inventory vs survival slots
                    let targetStack;
                    let isCrafting = false;
                    let isOutput = false;

                    if (this.selectedTab === 10 && slot >= 36 && slot <= 40) { // Inventory tab check
                        isCrafting = true;
                        isOutput = (slot === 40);
                        if (isOutput) targetStack = this.craftingItems[4];
                        else if (isCrafting) targetStack = this.craftingItems[slot - 36];
                        else targetStack = this.inventory.getStackInSlot(slot);
                    } else {
                        targetStack = this.inventory.getStackInSlot(slot);
                    }
                    
                    if (isOutput) {
                        if (targetStack.id !== 0) {
                            // Pick up output
                            if (this.heldItem.id === 0) {
                                this.heldItem = {id: targetStack.id, count: targetStack.count};
                                this.consumeIngredients();
                                this.updateCraftingOutput();
                            } else if (this.heldItem.id === targetStack.id) {
                                if (this.heldItem.count + targetStack.count <= 64) {
                                    this.heldItem.count += targetStack.count;
                                    this.consumeIngredients();
                                    this.updateCraftingOutput();
                                }
                            }
                        }
                        return;
                    }

                    if (this.heldItem.id === 0) {
                        if (targetStack.id !== 0) {
                            // Pick up
                            this.heldItem = {
                                id: targetStack.id, 
                                count: targetStack.count, 
                                damage: targetStack.damage || 0, 
                                tag: JSON.parse(JSON.stringify(targetStack.tag || {}))
                            };
                            if (isCrafting) this.craftingItems[slot - 36] = {id: 0, count: 0, tag: {}};
                            else this.inventory.setStackInSlot(slot, 0, 0);
                        }
                    } else {
                        // Place or swap
                        if (targetStack.id === 0) {
                            // Place
                            if (isCrafting) this.craftingItems[slot - 36] = JSON.parse(JSON.stringify(this.heldItem));
                            else this.inventory.setStackInSlot(slot, this.heldItem.id, this.heldItem.count, this.heldItem.damage || 0, this.heldItem.tag || {});
                            this.heldItem = {id: 0, count: 0, tag: {}};
                        } else if (targetStack.id === this.heldItem.id) {
                            // Stack
                            let block = Block.getById(targetStack.id);
                            let maxStack = block ? block.maxStackSize : 64;
                            let canAdd = maxStack - targetStack.count;
                            let toAdd = Math.min(canAdd, this.heldItem.count);
                            targetStack.count += toAdd;
                            this.heldItem.count -= toAdd;
                            if (this.heldItem.count <= 0) this.heldItem = {id: 0, count: 0};
                            
                            if (isCrafting) this.craftingItems[slot - 36] = targetStack;
                            else this.inventory.setStackInSlot(slot, targetStack.id, targetStack.count);
                        } else {
                            // Swap
                            let temp = {
                                id: targetStack.id, 
                                count: targetStack.count, 
                                damage: targetStack.damage || 0, 
                                tag: JSON.parse(JSON.stringify(targetStack.tag || {}))
                            };
                            if (isCrafting) this.craftingItems[slot - 36] = JSON.parse(JSON.stringify(this.heldItem));
                            else this.inventory.setStackInSlot(slot, this.heldItem.id, this.heldItem.count, this.heldItem.damage || 0, this.heldItem.tag || {});
                            this.heldItem = temp;
                        }
                    }
                    
                    if (this.selectedTab === 10) this.updateCraftingOutput();
                }
            } else if (mouseButton === 2) {
                // Right click in creative
                let slot = this.getSlotAt(mouseX, mouseY);
                
                if (slot >= 0) {
                    // Place one or split logic
                    let targetStack;
                    let isCrafting = false;
                    let isOutput = false;

                    if (this.selectedTab === 10 && slot >= 36 && slot <= 40) { // Inventory tab check
                        isCrafting = true;
                        isOutput = (slot === 40);
                        if (isOutput) targetStack = this.craftingItems[4];
                        else if (isCrafting) targetStack = this.craftingItems[slot - 36];
                        else targetStack = this.inventory.getStackInSlot(slot);
                    } else {
                        targetStack = this.inventory.getStackInSlot(slot);
                    }

                    if (isOutput) return; // No right click output

                    if (this.heldItem.id !== 0) {
                        // Place one
                        if (targetStack.id === 0) {
                            let newStack = {id: this.heldItem.id, count: 1, damage: this.heldItem.damage || 0, tag: this.heldItem.tag || {}};
                            if (isCrafting) this.craftingItems[slot - 36] = newStack;
                            else this.inventory.setStackInSlot(slot, newStack.id, newStack.count, newStack.damage, newStack.tag);
                            this.heldItem.count--;
                        } else if (targetStack.id === this.heldItem.id && targetStack.count < 64) {
                            targetStack.count++;
                            if (isCrafting) this.craftingItems[slot - 36] = targetStack;
                            else this.inventory.setStackInSlot(slot, targetStack.id, targetStack.count, targetStack.damage, targetStack.tag);
                            this.heldItem.count--;
                        }
                        if (this.heldItem.count <= 0) this.heldItem = {id: 0, count: 0};
                    } else if (targetStack.id !== 0) {
                        // Split half
                        let half = Math.ceil(targetStack.count / 2);
                        this.heldItem = {id: targetStack.id, count: half};
                        targetStack.count -= half;
                    
                        let newCount = targetStack.count;
                        if (newCount <= 0) newCount = 0; // Should be handled
                    
                        if (targetStack.count <= 0) {
                             if (isCrafting) this.craftingItems[slot - 36] = {id: 0, count: 0, damage: 0, tag: {}};
                             else this.inventory.setStackInSlot(slot, 0, 0);
                        } else {
                             if (isCrafting) this.craftingItems[slot - 36] = targetStack;
                             else this.inventory.setStackInSlot(slot, targetStack.id, targetStack.count, targetStack.damage, targetStack.tag);
                        }
                    }
                    
                    if (this.selectedTab === 10) this.updateCraftingOutput();
                }
            }
            return;
        }

        // Survival Logic (Standard)
        if (mouseButton === 0) { // Left click
            let slotIndex = this.getSlotAt(mouseX, mouseY);
            if (slotIndex !== -1) {
                // Handle Shift-Click (Quick Move)
                if (Keyboard.isKeyDown("ShiftLeft") || Keyboard.isKeyDown("ShiftRight")) {
                    this.handleShiftMove(slotIndex);
                    return;
                }

                let targetStack;
                let isOutput = slotIndex === 40;
                let isCraftingInput = slotIndex >= 36 && slotIndex < 40;
                let isArmorSlot = slotIndex >= 41 && slotIndex <= 44;

                if (isOutput) targetStack = this.craftingItems[4];
                else if (isCraftingInput) targetStack = this.craftingItems[slotIndex - 36];
                else if (isArmorSlot) targetStack = this.inventory.getArmor(slotIndex - 41);
                else targetStack = this.inventory.getStackInSlot(slotIndex);

                // Handle Output
                if (isOutput) {
                    if (targetStack.id !== 0) {
                        if (this.heldItem.id === 0) {
                            this.heldItem = {id: targetStack.id, count: targetStack.count, damage: targetStack.damage, tag: targetStack.tag};
                            this.craftingItems[4] = {id: 0, count: 0}; // Clear output slot before update
                            this.consumeIngredients();
                            this.updateCraftingOutput();
                        } else if (this.heldItem.id === targetStack.id && JSON.stringify(this.heldItem.tag) === JSON.stringify(targetStack.tag)) {
                            if (this.heldItem.count + targetStack.count <= 64) {
                                this.heldItem.count += targetStack.count;
                                this.craftingItems[4] = {id: 0, count: 0}; // Clear output slot before update
                                this.consumeIngredients();
                                this.updateCraftingOutput();
                            }
                        }
                    }
                    return;
                }

                // Handle armor placement/swap (Survival Mode)
                if (isArmorSlot) {
                    const armorIndex = slotIndex - 41;
                    const heldBlock = Block.getById(this.heldItem.id);
                    
                    let isHeldArmor = heldBlock && heldBlock.armorType !== undefined;
                    let isSuitableSlot = isHeldArmor && heldBlock.armorType === armorIndex;

                    if (this.heldItem.id === 0) {
                        if (targetStack.id !== 0) {
                            // Pick up armor
                            this.heldItem = {id: targetStack.id, count: targetStack.count, damage: targetStack.damage};
                            this.inventory.setArmor(armorIndex, {id: 0, count: 0});
                        }
                    } else if (isSuitableSlot) {
                        // Place/Swap armor
                        let temp = {id: targetStack.id, count: targetStack.count, damage: targetStack.damage};
                        this.inventory.setArmor(armorIndex, this.heldItem);
                        this.heldItem = temp;
                    }
                    return; // Done with armor slot interaction
                }

                // Normal Slots
                if (this.heldItem.id === 0) {
                    if (targetStack.id !== 0) {
                        // Pick up
                        this.heldItem = {
                            id: targetStack.id, 
                            count: targetStack.count, 
                            damage: targetStack.damage || 0, 
                            tag: JSON.parse(JSON.stringify(targetStack.tag || {}))
                        };
                        if (isCraftingInput) {
                            this.craftingItems[slotIndex - 36] = {id: 0, count: 0, tag: {}};
                        } else {
                            this.inventory.setStackInSlot(slotIndex, 0, 0);
                        }
                    }
                } else {
                    if (targetStack.id === 0) {
                        // Place
                        if (isCraftingInput) {
                            this.craftingItems[slotIndex - 36] = JSON.parse(JSON.stringify(this.heldItem));
                        } else {
                            this.inventory.setStackInSlot(slotIndex, this.heldItem.id, this.heldItem.count, this.heldItem.damage, this.heldItem.tag);
                        }
                        this.heldItem = {id: 0, count: 0, tag: {}, damage: 0};
                    } else if (targetStack.id === this.heldItem.id && JSON.stringify(targetStack.tag) === JSON.stringify(this.heldItem.tag)) {
                        // Stack
                        let block = Block.getById(targetStack.id);
                        let maxStack = block ? block.maxStackSize : 64;
                        let space = maxStack - targetStack.count;
                        let toAdd = Math.min(space, this.heldItem.count);
                        
                        targetStack.count += toAdd;
                        this.heldItem.count -= toAdd;
                        
                        if (this.heldItem.count <= 0) this.heldItem = {id: 0, count: 0};
                        
                        if (isCraftingInput) {
                            this.craftingItems[slotIndex - 36] = targetStack;
                        } else {
                            this.inventory.setStackInSlot(slotIndex, targetStack.id, targetStack.count, targetStack.damage, targetStack.tag);
                        }
                    } else {
                        // Swap
                        let temp = {
                            id: targetStack.id, 
                            count: targetStack.count, 
                            damage: targetStack.damage || 0, 
                            tag: JSON.parse(JSON.stringify(targetStack.tag || {}))
                        };
                        if (isCraftingInput) {
                            this.craftingItems[slotIndex - 36] = JSON.parse(JSON.stringify(this.heldItem));
                        } else {
                            this.inventory.setStackInSlot(slotIndex, this.heldItem.id, this.heldItem.count, this.heldItem.damage, this.heldItem.tag);
                        }
                        this.heldItem = temp;
                    }
                }
                
                if (isCraftingInput) this.updateCraftingOutput();
            }
        } else if (mouseButton === 2) { // Right click
            let slotIndex = this.getSlotAt(mouseX, mouseY);
            if (slotIndex !== -1) {
                if (slotIndex === 40) return; // Ignore right click on output for now
                if (slotIndex >= 41 && slotIndex <= 44) return; // Ignore right click on armor

                let isCraftingInput = slotIndex >= 36 && slotIndex < 40;
                let targetStack = isCraftingInput ? this.craftingItems[slotIndex - 36] : this.inventory.getStackInSlot(slotIndex);

                if (this.heldItem.id !== 0) {
                    // Place one
                    if (targetStack.id === 0) {
                        let newStack = {id: this.heldItem.id, count: 1, damage: this.heldItem.damage || 0, tag: JSON.parse(JSON.stringify(this.heldItem.tag || {}))};
                        if (isCraftingInput) this.craftingItems[slotIndex - 36] = newStack;
                        else this.inventory.setStackInSlot(slotIndex, newStack.id, newStack.count, newStack.damage, newStack.tag);
                        this.heldItem.count--;
                    } else if (targetStack.id === this.heldItem.id && targetStack.count < 64 && JSON.stringify(targetStack.tag) === JSON.stringify(this.heldItem.tag)) {
                        targetStack.count++;
                        if (isCraftingInput) this.craftingItems[slotIndex - 36] = JSON.parse(JSON.stringify(targetStack));
                        else this.inventory.setStackInSlot(slotIndex, targetStack.id, targetStack.count, targetStack.damage, targetStack.tag);
                        this.heldItem.count--;
                    }
                    if (this.heldItem.count <= 0) this.heldItem = {id: 0, count: 0, damage: 0, tag: {}};
                } else if (targetStack.id !== 0) {
                    // Split half
                    let half = Math.ceil(targetStack.count / 2);
                    this.heldItem = {id: targetStack.id, count: half, damage: targetStack.damage || 0, tag: JSON.parse(JSON.stringify(targetStack.tag || {}))};
                    targetStack.count -= half;
                    
                    let newCount = targetStack.count;
                    if (newCount <= 0) newCount = 0; // Should be handled
                    
                    if (targetStack.count <= 0) {
                        if (isCraftingInput) this.craftingItems[slotIndex - 36] = {id: 0, count: 0, damage: 0, tag: {}};
                        else this.inventory.setStackInSlot(slotIndex, 0, 0);
                    } else {
                        if (isCraftingInput) this.craftingItems[slotIndex - 36] = targetStack;
                        else this.inventory.setStackInSlot(slotIndex, targetStack.id, targetStack.count, targetStack.damage, targetStack.tag);
                    }
                }

                if (isCraftingInput) this.updateCraftingOutput();
            }
        }
    }
    
    mouseDragged(mouseX, mouseY, mouseButton) {
        super.mouseDragged(mouseX, mouseY, mouseButton);
        if (this.isScrolling) {
            let scrollY = this.guiTop + 18;
            let scrollH = 112;
            let thumbH = 15;
            
            // Calculate scroll position relative to track
            let val = (mouseY - scrollY - thumbH / 2) / (scrollH - thumbH);
            if (val < 0) val = 0;
            if (val > 1) val = 1;
            
            this.currentScroll = val;
        }
    }
    
    mouseReleased(mouseX, mouseY, mouseButton) {
        super.mouseReleased(mouseX, mouseY, mouseButton);
        this.isScrolling = false;
    }

    checkCraftAchievement(id) {
        const mgr = this.minecraft.achievementManager;
        if (id === 270) mgr.grant('timetomine'); // Wooden Pickaxe
        if (id === 272 || id === 274 || id === 257 || id === 285 || id === 278) mgr.grant('gettinganupgrade'); // Stone/Iron/Gold/Diamond Pickaxe
        if (id === 268 || id === 272 || id === 267 || id === 283 || id === 276) mgr.grant('timetostrike'); // Sword
        if (id === 58) mgr.grant('benchmaking'); // Crafting Table
        if (id === 61) mgr.grant('hottopic'); // Furnace
        if (id === 297) mgr.grant('bakebread'); // Bread
    }

}
