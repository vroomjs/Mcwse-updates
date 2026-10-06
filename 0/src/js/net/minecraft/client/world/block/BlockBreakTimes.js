import { BlockRegistry } from "./BlockRegistry.js";

const MATERIALS = {
    ROCK: 'rock',
    WOOD: 'wood',
    DIRT: 'dirt',
    PLANT: 'plant'
};

const TOOLS = {
    PICKAXE: 'pickaxe',
    SHOVEL: 'shovel',
    AXE: 'axe',
    SWORD: 'sword'
};

const blockData = {};
const toolData = {};
let initialized = false;

function registerBlock(id, hardness, material, harvestLevel = 0) {
    blockData[id] = { hardness, material, harvestLevel };
}

function registerTool(id, type, speed, level) {
    toolData[id] = { type, speed, level };
}

function ensureInitialized() {
    if (initialized) return;
    initialized = true;

    // --- BLOCKS ---
    // Rock (Pickaxe)
    registerBlock(1, 8.0, MATERIALS.ROCK, 0); // Stone (Level 0: Wooden+)
    registerBlock(4, 8.0, MATERIALS.ROCK, 0); // Cobblestone
    registerBlock(220, 8.0, MATERIALS.ROCK, 0); // Granite
    registerBlock(221, 8.0, MATERIALS.ROCK, 0); // Diorite
    registerBlock(222, 8.0, MATERIALS.ROCK, 0); // Andesite
    registerBlock(61, 14.0, MATERIALS.ROCK, 0); // Furnace
    registerBlock(16, 12.0, MATERIALS.ROCK, 0); // Coal Ore (Level 0)
    registerBlock(73, 12.0, MATERIALS.ROCK, 1); // Redstone Ore (Stone+)
    registerBlock(152, 12.0, MATERIALS.ROCK, 1); // Redstone Block (Stone+)
    registerBlock(173, 15.0, MATERIALS.ROCK, 0); // Coal Block
    registerBlock(15, 12.0, MATERIALS.ROCK, 1); // Iron Ore (Level 1: Stone+)
    registerBlock(14, 12.0, MATERIALS.ROCK, 2); // Gold Ore (Level 2: Iron+)
    registerBlock(21, 12.0, MATERIALS.ROCK, 1); // Lapis Ore
    registerBlock(22, 12.0, MATERIALS.ROCK, 1); // Lapis Block
    registerBlock(56, 12.0, MATERIALS.ROCK, 2); // Diamond Ore (Level 2: Iron+)
    registerBlock(129, 12.0, MATERIALS.ROCK, 2); // Emerald Ore (Level 2: Iron+)
    registerBlock(133, 15.0, MATERIALS.ROCK, 2); // Emerald Block (Level 2: Iron+)
    registerBlock(24, 0.8, MATERIALS.ROCK, 0); // Sandstone (Pickaxe)
    registerBlock(179, 0.8, MATERIALS.ROCK, 0); // Cut Sandstone
    registerBlock(180, 0.8, MATERIALS.ROCK, 0); // Chiseled Sandstone
    registerBlock(110, 0.6, MATERIALS.DIRT); // Mycelium
    registerBlock(99, 0.2, MATERIALS.WOOD); // Mushroom Stem
    registerBlock(100, 0.2, MATERIALS.WOOD); // Brown Mushroom Block
    registerBlock(162, 0.2, MATERIALS.WOOD); // Red Mushroom Block
    registerBlock(62, 0.6, MATERIALS.DIRT); // Farmland
    registerBlock(7, -1.0, MATERIALS.ROCK, 100); // Bedrock (Unbreakable)
    registerBlock(228, 15.0, MATERIALS.ROCK, 1); // Iron Trapdoor

    // Glazed Terracotta (Hardness 1.4)
    for (let i = 466; i <= 480; i++) {
        registerBlock(i, 7.0, MATERIALS.ROCK, 0); // 1.4 base
    }

    // Terracotta (Hardness 1.25)
    for (let i = 450; i <= 480; i++) {
        registerBlock(i, 6.25, MATERIALS.ROCK, 0); // 1.25 base * 5 scaling = 6.25
    }

    // Wood (Axe)
    registerBlock(17, 3.0, MATERIALS.WOOD); // Log
    registerBlock(200, 3.0, MATERIALS.WOOD); // Birch Log
    registerBlock(209, 3.0, MATERIALS.WOOD); // Spruce Log
    registerBlock(235, 3.0, MATERIALS.WOOD); // Acacia Log
    registerBlock(253, 3.0, MATERIALS.WOOD); // Dark Oak Log
    registerBlock(254, 3.0, MATERIALS.WOOD); // Stripped Oak Log
    registerBlock(300, 3.0, MATERIALS.WOOD); // Stripped Birch Log
    registerBlock(301, 3.0, MATERIALS.WOOD); // Stripped Spruce Log
    registerBlock(302, 3.0, MATERIALS.WOOD); // Stripped Acacia Log
    registerBlock(303, 3.0, MATERIALS.WOOD); // Stripped Dark Oak Log
    registerBlock(5, 3.0, MATERIALS.WOOD); // Planks
    registerBlock(47, 2.5, MATERIALS.WOOD); // Bookshelf
    registerBlock(201, 3.0, MATERIALS.WOOD); // Birch Planks
    registerBlock(210, 3.0, MATERIALS.WOOD); // Spruce Planks
    registerBlock(213, 2.0, MATERIALS.WOOD); // Birch Slab
    registerBlock(214, 2.0, MATERIALS.WOOD); // Spruce Slab
    registerBlock(215, 2.0, MATERIALS.WOOD); // Birch Stairs
    registerBlock(216, 2.0, MATERIALS.WOOD); // Spruce Stairs
    registerBlock(217, 2.0, MATERIALS.WOOD); // Birch Fence
    registerBlock(218, 2.0, MATERIALS.WOOD); // Spruce Fence
    registerBlock(208, 0.8, MATERIALS.PLANT); // White Wool
    registerBlock(369, 0.8, MATERIALS.PLANT); // Orange Wool
    registerBlock(370, 0.8, MATERIALS.PLANT); // Magenta Wool
    registerBlock(371, 0.8, MATERIALS.PLANT); // Light Blue Wool
    registerBlock(372, 0.8, MATERIALS.PLANT); // Yellow Wool
    registerBlock(373, 0.8, MATERIALS.PLANT); // Lime Wool
    registerBlock(374, 0.8, MATERIALS.PLANT); // Pink Wool
    registerBlock(375, 0.8, MATERIALS.PLANT); // Gray Wool
    registerBlock(376, 0.8, MATERIALS.PLANT); // Light Gray Wool
    registerBlock(377, 0.8, MATERIALS.PLANT); // Cyan Wool
    registerBlock(378, 0.8, MATERIALS.PLANT); // Purple Wool
    registerBlock(379, 0.8, MATERIALS.PLANT); // Blue Wool
    registerBlock(380, 0.8, MATERIALS.PLANT); // Brown Wool
    registerBlock(381, 0.8, MATERIALS.PLANT); // Green Wool
    registerBlock(382, 0.8, MATERIALS.PLANT); // Red Wool
    registerBlock(383, 0.8, MATERIALS.PLANT); // Black Wool
    registerBlock(92, 1.0, MATERIALS.WOOD); // Bed
    registerBlock(66, 0.7, MATERIALS.ROCK); // Rail
    registerBlock(158, 0.7, MATERIALS.ROCK); // Powered Rail
    registerBlock(159, 0.7, MATERIALS.ROCK); // Powered Rail
    registerBlock(58, 3.0, MATERIALS.WOOD); // Crafting Table (Classified as Wood)
    registerBlock(54, 2.5, MATERIALS.WOOD); // Chest
    registerBlock(64, 3.0, MATERIALS.WOOD); // Oak Door
    registerBlock(205, 3.0, MATERIALS.WOOD); // Birch Door
    registerBlock(219, 3.0, MATERIALS.WOOD); // Spruce Door
    registerBlock(426, 3.0, MATERIALS.WOOD); // Acacia Door
    registerBlock(427, 3.0, MATERIALS.WOOD); // Dark Oak Door
    registerBlock(96, 3.0, MATERIALS.WOOD); // Oak Trapdoor
    registerBlock(224, 3.0, MATERIALS.WOOD); // Birch Trapdoor
    registerBlock(225, 3.0, MATERIALS.WOOD); // Dark Oak Trapdoor
    registerBlock(226, 3.0, MATERIALS.WOOD); // Spruce Trapdoor
    registerBlock(227, 3.0, MATERIALS.WOOD); // Acacia Trapdoor
    registerBlock(71, 15.0, MATERIALS.ROCK, 1); // Iron Door
    registerBlock(77, 3.0, MATERIALS.WOOD); // Wooden Button
    registerBlock(223, 1.5, MATERIALS.ROCK, 0); // Stone Button
    registerBlock(69, 0.5, MATERIALS.WOOD); // Lever
    registerBlock(23, 15.0, MATERIALS.ROCK, 0); // Dispenser
    registerBlock(84, 3.0, MATERIALS.WOOD); // Jukebox
    registerBlock(86, 5.0, MATERIALS.WOOD); // Pumpkin
    registerBlock(91, 5.0, MATERIALS.WOOD); // Jack o' Lantern

    // Dirt/Sand/Grass (Shovel)
    registerBlock(2, 1.0, MATERIALS.DIRT); // Grass
    registerBlock(3, 1.0, MATERIALS.DIRT); // Dirt
    registerBlock(12, 1.0, MATERIALS.DIRT); // Sand
    registerBlock(13, 1.0, MATERIALS.DIRT); // Gravel
    registerBlock(82, 0.6, MATERIALS.DIRT); // Clay

    // Brick / Stone types
    registerBlock(45, 2.0, MATERIALS.ROCK, 0); // Bricks
    registerBlock(43, 1.5, MATERIALS.ROCK, 0); // Smooth Stone
    registerBlock(497, 1.5, MATERIALS.ROCK, 0); // Smooth Stone Slab
    registerBlock(498, 1.5, MATERIALS.ROCK, 0); // Smooth Stone Stairs
    registerBlock(98, 1.5, MATERIALS.ROCK, 0); // Stone Bricks
    registerBlock(97, 1.5, MATERIALS.ROCK, 0); // Chiseled Stone Bricks
    registerBlock(109, 1.5, MATERIALS.ROCK, 0); // Mossy Stone Bricks
    registerBlock(108, 1.5, MATERIALS.ROCK, 0); // Cracked Stone Bricks
    registerBlock(48, 2.0, MATERIALS.ROCK, 0); // Mossy Cobblestone
    
    // Slabs & Stairs
    registerBlock(44, 2.0, MATERIALS.WOOD); // Wooden Slab
    registerBlock(53, 2.0, MATERIALS.WOOD); // Wooden Stairs
    registerBlock(145, 2.0, MATERIALS.ROCK, 0); // Brick Slab
    registerBlock(146, 2.0, MATERIALS.ROCK, 0); // Brick Stairs
    registerBlock(147, 2.0, MATERIALS.ROCK, 0); // Cobblestone Slab
    registerBlock(148, 2.0, MATERIALS.ROCK, 0); // Cobblestone Stairs
    registerBlock(149, 2.0, MATERIALS.ROCK, 0); // Stone Slab
    registerBlock(150, 2.0, MATERIALS.ROCK, 0); // Stone Stairs
    registerBlock(151, 0.8, MATERIALS.ROCK, 0); // Sandstone Slab
    registerBlock(154, 0.8, MATERIALS.ROCK, 0); // Sandstone Stairs
    registerBlock(213, 2.0, MATERIALS.WOOD); // Birch Slab
    registerBlock(214, 2.0, MATERIALS.WOOD); // Spruce Slab
    registerBlock(215, 2.0, MATERIALS.WOOD); // Birch Stairs
    registerBlock(216, 2.0, MATERIALS.WOOD); // Spruce Stairs

    registerBlock(230, 2.0, MATERIALS.WOOD); // Vertical Oak Slab
    registerBlock(231, 2.0, MATERIALS.ROCK, 0); // Vertical Stone Slab
    registerBlock(232, 2.0, MATERIALS.ROCK, 0); // Vertical Cobble Slab
    registerBlock(233, 2.0, MATERIALS.WOOD); // Vertical Birch Slab
    registerBlock(234, 2.0, MATERIALS.WOOD); // Vertical Spruce Slab

    // Fence
    registerBlock(85, 2.0, MATERIALS.WOOD);
    registerBlock(217, 2.0, MATERIALS.WOOD); // Birch Fence
    registerBlock(218, 2.0, MATERIALS.WOOD); // Spruce Fence
    registerBlock(107, 2.0, MATERIALS.WOOD); // Fence Gate
    // Wall
    registerBlock(139, 2.0, MATERIALS.ROCK, 0); // Cobblestone Wall
    registerBlock(140, 1.5, MATERIALS.ROCK, 0); // Stone Brick Wall
    registerBlock(143, 0.8, MATERIALS.ROCK, 0); // Sandstone Wall
    registerBlock(144, 2.0, MATERIALS.ROCK, 0); // Brick Wall
    registerBlock(138, 3.0, MATERIALS.ROCK, 0); // End Stone Brick Wall

    // Special Blocks
    registerBlock(255, 15.0, MATERIALS.ROCK, 0); // Structure Block
    registerBlock(137, -1.0, MATERIALS.ROCK, 100); // Command Block (Unbreakable like Bedrock)
    registerBlock(70, 1.5, MATERIALS.ROCK, 0); // Stone Pressure Plate
    registerBlock(167, 5.0, MATERIALS.ROCK, 0); // Anvil
    registerBlock(29, 2.5, MATERIALS.ROCK, 0); // Piston
    registerBlock(30, 2.5, MATERIALS.ROCK, 0); // Sticky Piston
    registerBlock(31, 2.5, MATERIALS.ROCK, 0); // Piston Head
    registerBlock(560, 3.0, MATERIALS.DIRT); // Sponge
    registerBlock(561, 3.0, MATERIALS.DIRT); // Wet Sponge
    registerBlock(562, 8.0, MATERIALS.ROCK, 0); // Polished Andesite
    registerBlock(563, 8.0, MATERIALS.ROCK, 0); // Polished Diorite
    registerBlock(564, 8.0, MATERIALS.ROCK, 0); // Polished Granite
    registerBlock(565, 25.0, MATERIALS.ROCK, 1); // Iron Bars

    // Snow / Ice
    registerBlock(79, 1.0, MATERIALS.DIRT); // Ice (Hand/Shovel) - Allow breaking
    registerBlock(174, 1.0, MATERIALS.DIRT); // Packed Ice (Hand/Shovel) - Allow breaking
    registerBlock(80, 0.2, MATERIALS.DIRT); // Snow Block (Shovel)
    registerBlock(193, 0.2, MATERIALS.DIRT); // Snow Slab
    registerBlock(194, 0.2, MATERIALS.DIRT); // Snow Stairs
    registerBlock(60, 0.6, MATERIALS.DIRT); // Snowy Grass (Shovel)
    registerBlock(566, 0.6, MATERIALS.DIRT); // Grass Path
    registerBlock(567, 0.0, MATERIALS.PLANT); // Lily Pad

    // Painting (Instant)
    registerBlock(321, 0.0, MATERIALS.WOOD);

    // Nether Blocks
    registerBlock(87, 1.0, MATERIALS.ROCK, 0); // Netherrack (Hardness of dirt: 1.0)
    registerBlock(153, 3.0, MATERIALS.ROCK, 0); // Quartz Ore (Hardness 3.0)
    registerBlock(155, 0.8, MATERIALS.ROCK, 0); // Quartz Block
    registerBlock(156, 0.8, MATERIALS.ROCK, 0); // Chiseled Quartz
    registerBlock(157, 0.8, MATERIALS.ROCK, 0); // Quartz Pillar
    registerBlock(251, 0.8, MATERIALS.ROCK, 0); // Quartz Slab
    registerBlock(252, 0.8, MATERIALS.ROCK, 0); // Quartz Stairs
    registerBlock(184, 2.0, MATERIALS.ROCK, 0); // Granite Slab
    registerBlock(185, 2.0, MATERIALS.ROCK, 0); // Granite Stairs
    registerBlock(186, 2.0, MATERIALS.ROCK, 0); // Diorite Slab
    registerBlock(187, 2.0, MATERIALS.ROCK, 0); // Diorite Stairs
    registerBlock(188, 2.0, MATERIALS.ROCK, 0); // Andesite Slab
    registerBlock(189, 2.0, MATERIALS.ROCK, 0); // Andesite Stairs
    registerBlock(88, 1.0, MATERIALS.DIRT); // Soul Sand (Hardness of sand: 1.0)
    registerBlock(49, 45.0, MATERIALS.ROCK, 3); // Obsidian (Hardness 45, Diamond Pickaxe)
    registerBlock(89, 1.0, MATERIALS.PLANT); // Glowstone (Glass-like, 1s)

    // Plants/Other
    registerBlock(18, 0.3, MATERIALS.PLANT); // Oak Leaves
    registerBlock(203, 0.3, MATERIALS.PLANT); // Birch Leaves
    registerBlock(212, 0.3, MATERIALS.PLANT); // Spruce Leaves
    registerBlock(325, 0.3, MATERIALS.PLANT); // Acacia Leaves
    registerBlock(326, 0.3, MATERIALS.PLANT); // Dark Oak Leaves

    // Saplings
    registerBlock(400, 0.1, MATERIALS.PLANT); // Oak Sapling
    registerBlock(202, 0.1, MATERIALS.PLANT); // Birch Sapling
    registerBlock(211, 0.1, MATERIALS.PLANT); // Spruce Sapling
    registerBlock(323, 0.1, MATERIALS.PLANT); // Acacia Sapling
    registerBlock(324, 0.1, MATERIALS.PLANT); // Dark Oak Sapling

    registerBlock(20, 0.5, MATERIALS.PLANT); // Glass (Fragile)

    // Stained Glass
    for (let i = 237; i <= 250; i++) {
        registerBlock(i, 0.5, MATERIALS.PLANT);
    }

    registerBlock(50, 0.0, MATERIALS.PLANT); // Torch (Instant)
    registerBlock(37, 0.0, MATERIALS.PLANT); // Dandelion
    registerBlock(38, 0.0, MATERIALS.PLANT); // Rose
    registerBlock(39, 0.0, MATERIALS.PLANT); // Paeonia
    registerBlock(31, 0.0, MATERIALS.PLANT); // Foliage
    registerBlock(32, 0.0, MATERIALS.PLANT); // Fern
    
    registerBlock(59, 0.0, MATERIALS.PLANT); // Wheat
    registerBlock(141, 0.0, MATERIALS.PLANT); // Carrots
    registerBlock(142, 0.0, MATERIALS.PLANT); // Potatoes
    registerBlock(204, 0.0, MATERIALS.PLANT); // Tall Grass
    registerBlock(190, 0.0, MATERIALS.PLANT); // Large Fern
    registerBlock(191, 0.0, MATERIALS.PLANT); // Rose Bush
    registerBlock(192, 0.0, MATERIALS.PLANT); // Lilac
    registerBlock(206, 0.0, MATERIALS.PLANT); // White Tulip
    registerBlock(175, 0.0, MATERIALS.PLANT); // Pink Tulip
    registerBlock(176, 0.0, MATERIALS.PLANT); // Red Tulip
    registerBlock(177, 0.0, MATERIALS.PLANT); // Azure Bluet
    registerBlock(178, 0.0, MATERIALS.PLANT); // Allium
    registerBlock(207, 0.0, MATERIALS.PLANT); // Lily of the valley
    registerBlock(55, 0.0, MATERIALS.PLANT); // Redstone Dust (Instant)
    registerBlock(420, 0.0, MATERIALS.PLANT); // Beetroots
    registerBlock(165, 0.0, MATERIALS.PLANT); // Slime Block (Instant break)

    // Carpets (Hardness 0.1)
    for (let i = 500; i <= 515; i++) {
        registerBlock(i, 0.5, MATERIALS.PLANT);
    }

    // --- TOOLS ---
    // Wooden (Speed x2.0, Level 0)
    registerTool(270, TOOLS.PICKAXE, 2.0, 0);
    registerTool(269, TOOLS.SHOVEL, 2.0, 0);
    registerTool(271, TOOLS.AXE, 2.0, 0);

    // Stone (Speed x4.0, Level 1)
    registerTool(274, TOOLS.PICKAXE, 4.0, 1);
    registerTool(273, TOOLS.SHOVEL, 4.0, 1);
    registerTool(275, TOOLS.AXE, 4.0, 1);

    // Iron (Speed x6.0, Level 2)
    registerTool(257, TOOLS.PICKAXE, 6.0, 2);
    registerTool(256, TOOLS.SHOVEL, 6.0, 2);
    registerTool(258, TOOLS.AXE, 6.0, 2);

    // Diamond (Speed x8.0, Level 3)
    registerTool(278, TOOLS.PICKAXE, 8.0, 3);
    registerTool(277, TOOLS.SHOVEL, 8.0, 3);
    registerTool(279, TOOLS.AXE, 8.0, 3);

    // Golden (Speed x12.0, Level 0)
    registerTool(285, TOOLS.PICKAXE, 12.0, 0);
    registerTool(284, TOOLS.SHOVEL, 12.0, 0);
    registerTool(286, TOOLS.AXE, 12.0, 0);

    // Swords (Efficient on Cobwebs)
    registerTool(268, TOOLS.SWORD, 1.5, 0); // Wooden
    registerTool(272, TOOLS.SWORD, 1.5, 0); // Stone
    registerTool(267, TOOLS.SWORD, 1.5, 0); // Iron
    registerTool(283, TOOLS.SWORD, 1.5, 0); // Golden
    registerTool(276, TOOLS.SWORD, 30.0, 0); // Diamond (30.0 speed for 1s break on 30.0 hardness)

    // Special Mod Items
    registerBlock(571, 30.0, MATERIALS.PLANT); // Cobweb (30s hand break)
    registerBlock(574, 0.0, MATERIALS.PLANT);  // Berry Bush (Instant break)
}

export function getToolInfo(toolId) {
    ensureInitialized();
    return toolData[toolId];
}

export function getBlockBreakTime(blockId, toolId) {
    ensureInitialized();
    let block = blockData[blockId];
    
    // If not in static data, try to fetch from instance (for mods)
    if (!block) {
        const instance = Block.getById(blockId);
        if (instance) {
            block = { 
                hardness: instance.hardness * 5.0, // Scale to match internal system (stone 1.5 -> 8.0 approx)
                material: instance.sound?.name === 'wood' ? MATERIALS.WOOD : 
                          instance.sound?.name === 'grass' ? MATERIALS.PLANT : MATERIALS.ROCK,
                harvestLevel: 0 
            };
        }
    }

    // If block not registered or instant
    if (!block) return 0.0;
    if (block.hardness === -1.0) return Infinity; // Bedrock
    if (block.hardness === 0.0) return 0.0;

    let speed = 1.0; // Hand speed
    const tool = toolData[toolId];

    if (tool) {
        // Check efficiency
        let efficient = false;
        if (block.material === MATERIALS.ROCK && tool.type === TOOLS.PICKAXE) efficient = true;
        else if (block.material === MATERIALS.WOOD && tool.type === TOOLS.AXE) efficient = true;
        else if (block.material === MATERIALS.DIRT && tool.type === TOOLS.SHOVEL) efficient = true;
        else if (block.material === MATERIALS.PLANT && tool.type === TOOLS.SHEARS) efficient = true;
        else if (blockId === 571 && tool.type === TOOLS.SWORD) efficient = true;

        if (efficient) {
            speed = tool.speed;
        }
    }

    return block.hardness / speed;
}

export function canHarvestBlock(blockId, toolId) {
    ensureInitialized();
    const block = blockData[blockId];
    if (!block) return true; // Default harvestable

    // Unbreakable
    if (block.hardness === -1.0) return false;

    // Rock types require pickaxes of sufficient level
    if (block.material === MATERIALS.ROCK) {
        const tool = toolData[toolId];
        // If no tool or wrong tool, cannot harvest rock
        if (!tool || tool.type !== TOOLS.PICKAXE) return false;
        
        // Check tier level
        return tool.level >= block.harvestLevel;
    }

    // Other materials (Wood, Dirt, Plants) are generally harvestable by hand in vanilla logic
    // (Though speed is slow, they drop)
    return true;
}

export default {
    getBlockBreakTime,
    canHarvestBlock
};