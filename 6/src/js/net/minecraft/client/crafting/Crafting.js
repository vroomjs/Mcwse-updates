import { BlockRegistry } from "../world/block/BlockRegistry.js";

export default class Crafting {
    static recipes = [
        {
            // Log -> Planks (1 Log -> 4 Planks) - Strict so Birch Log doesn't make Oak Planks
            shape: [17],
            size: [1, 1],
            output: {id: 5, count: 4},
            strict: true
        },
        {
            // Birch Log -> Birch Planks
            shape: [200],
            size: [1, 1],
            output: {id: 201, count: 4},
            strict: true
        },
        {
            // Spruce Log -> Spruce Planks
            shape: [209],
            size: [1, 1],
            output: {id: 210, count: 4},
            strict: true
        },
        {
            // Birch Door: 2x3 Birch Planks
            shape: [
                201, 201,
                201, 201,
                201, 201
            ],
            size: [2, 3],
            output: {id: 205, count: 3},
            strict: true
        },
        {
            // Spruce Door: 2x3 Spruce Planks
            shape: [
                210, 210,
                210, 210,
                210, 210
            ],
            size: [2, 3],
            output: {id: 219, count: 3},
            strict: true
        },
        {
            // Birch Trapdoor
            shape: [
                201, 201, 201,
                201, 201, 201
            ],
            size: [3, 2],
            output: {id: 224, count: 2},
            strict: true
        },
        {
            // Spruce Trapdoor
            shape: [
                210, 210, 210,
                210, 210, 210
            ],
            size: [3, 2],
            output: {id: 226, count: 2},
            strict: true
        },
        {
            // Birch Slab
            shape: [201, 201, 201],
            size: [3, 1],
            output: {id: 213, count: 6},
            strict: true
        },
        {
            // Spruce Slab
            shape: [210, 210, 210],
            size: [3, 1],
            output: {id: 214, count: 6},
            strict: true
        },
        {
            // Birch Stairs
            shape: [
                201, 0, 0,
                201, 201, 0,
                201, 201, 201
            ],
            size: [3, 3],
            output: {id: 215, count: 4},
            strict: true
        },
        {
            // Spruce Stairs
            shape: [
                210, 0, 0,
                210, 210, 0,
                210, 210, 210
            ],
            size: [3, 3],
            output: {id: 216, count: 4},
            strict: true
        },
        {
            // Birch Fence (Using Birch Planks 201)
            shape: [
                201, 280, 201,
                201, 280, 201
            ],
            size: [3, 2],
            output: { id: 217, count: 3 },
            strict: true
        },
        {
            // Spruce Fence (Using Spruce Planks 210)
            shape: [
                210, 280, 210,
                210, 280, 210
            ],
            size: [3, 2],
            output: { id: 218, count: 3 },
            strict: true
        },
        {
            // Acacia Door: 2x3 Acacia Planks
            shape: [
                304, 304,
                304, 304,
                304, 304
            ],
            size: [2, 3],
            output: {id: 426, count: 3},
            strict: true
        },
        {
            // Dark Oak Door: 2x3 Dark Oak Planks
            shape: [
                305, 305,
                305, 305,
                305, 305
            ],
            size: [2, 3],
            output: {id: 427, count: 3},
            strict: true
        },
        {
            // Crafting Table: 2x2 planks
            shape: [5, 5, 5, 5],
            size: [2, 2],
            output: {id: 58, count: 1}
        },
        {
            // Sticks: 2 planks vertical (Shaped, can float)
            shape: [5, 5],
            size: [1, 2],
            output: {id: 280, count: 4}
        },
        {
            // Sticks: 2 planks horizontal (Additional variant for user flexibility)
            shape: [5, 5],
            size: [2, 1],
            output: {id: 280, count: 4}
        },
        {
            // Wooden Shovel: Plank over Stick over Stick
            shape: [5, 280, 280],
            size: [1, 3],
            output: {id: 269, count: 1}
        },
        // --- Axes ---
        // Wooden Axe: 
        // M M
        // M S
        //   S
        {
            shape: [5, 5, 5, 280, 0, 280],
            size: [2, 3],
            output: {id: 271, count: 1}
        },
        // Wooden Axe (Mirrored):
        // M M
        // S M
        // S
        {
            shape: [5, 5, 280, 5, 280, 0],
            size: [2, 3],
            output: {id: 271, count: 1}
        },
        // --- Stone Tools ---
        {
            // Stone Pickaxe
            shape: [
                4, 4, 4,
                0, 280, 0,
                0, 280, 0
            ],
            size: [3, 3],
            output: {id: 274, count: 1}
        },
        {
            // Stone Shovel
            shape: [4, 280, 280],
            size: [1, 3],
            output: {id: 273, count: 1}
        },
        {
            // Stone Axe
            shape: [4, 4, 4, 280, 0, 280],
            size: [2, 3],
            output: {id: 275, count: 1}
        },
        {
            // Stone Axe (Mirrored)
            shape: [4, 4, 280, 4, 280, 0],
            size: [2, 3],
            output: {id: 275, count: 1}
        },
        // --- Iron Tools (Ingot ID 265) ---
        {
            // Iron Pickaxe
            shape: [
                265, 265, 265,
                0, 280, 0,
                0, 280, 0
            ],
            size: [3, 3],
            output: {id: 257, count: 1}
        },
        {
            // Iron Shovel
            shape: [265, 280, 280],
            size: [1, 3],
            output: {id: 256, count: 1}
        },
        {
            // Iron Axe
            shape: [265, 265, 265, 280, 0, 280],
            size: [2, 3],
            output: {id: 258, count: 1}
        },
        {
            // Iron Axe (Mirrored)
            shape: [265, 265, 280, 265, 280, 0],
            size: [2, 3],
            output: {id: 258, count: 1}
        },
        // --- Gold Tools (Ingot ID 266) ---
        {
            // Gold Pickaxe
            shape: [
                266, 266, 266,
                0, 280, 0,
                0, 280, 0
            ],
            size: [3, 3],
            output: {id: 285, count: 1}
        },
        {
            // Gold Shovel
            shape: [266, 280, 280],
            size: [1, 3],
            output: {id: 284, count: 1}
        },
        {
            // Gold Axe
            shape: [266, 266, 266, 280, 0, 280],
            size: [2, 3],
            output: {id: 286, count: 1}
        },
        {
            // Gold Axe (Mirrored)
            shape: [266, 266, 280, 266, 280, 0],
            size: [2, 3],
            output: {id: 286, count: 1}
        },
        // --- Diamond Tools (Diamond ID 264) ---
        {
            // Diamond Pickaxe
            shape: [
                264, 264, 264,
                0, 280, 0,
                0, 280, 0
            ],
            size: [3, 3],
            output: {id: 278, count: 1}
        },
        {
            // Diamond Shovel
            shape: [264, 280, 280],
            size: [1, 3],
            output: {id: 277, count: 1}
        },
        {
            // Diamond Axe
            shape: [264, 264, 264, 280, 0, 280],
            size: [2, 3],
            output: {id: 279, count: 1}
        },
        {
            // Diamond Axe (Mirrored)
            shape: [264, 264, 280, 264, 280, 0],
            size: [2, 3],
            output: {id: 279, count: 1}
        },
        // --- Hoes ---
        {
            // Wooden Hoe
            shape: [5, 5, 0, 280, 0, 280],
            size: [2, 3],
            output: {id: 290, count: 1}
        },
        {
            // Wooden Hoe (Mirrored)
            shape: [5, 5, 280, 0, 280, 0],
            size: [2, 3],
            output: {id: 290, count: 1}
        },
        {
            // Stone Hoe
            shape: [4, 4, 0, 280, 0, 280],
            size: [2, 3],
            output: {id: 291, count: 1}
        },
        {
            // Stone Hoe (Mirrored)
            shape: [4, 4, 280, 0, 280, 0],
            size: [2, 3],
            output: {id: 291, count: 1}
        },
        {
            // Iron Hoe
            shape: [265, 265, 0, 280, 0, 280],
            size: [2, 3],
            output: {id: 292, count: 1}
        },
        {
            // Iron Hoe (Mirrored)
            shape: [265, 265, 280, 0, 280, 0],
            size: [2, 3],
            output: {id: 292, count: 1}
        },
        {
            // Diamond Hoe
            shape: [264, 264, 0, 280, 0, 280],
            size: [2, 3],
            output: {id: 293, count: 1}
        },
        {
            // Diamond Hoe (Mirrored)
            shape: [264, 264, 280, 0, 280, 0],
            size: [2, 3],
            output: {id: 293, count: 1}
        },
        {
            // Gold Hoe
            shape: [266, 266, 0, 280, 0, 280],
            size: [2, 3],
            output: {id: 294, count: 1}
        },
        {
            // Gold Hoe (Mirrored)
            shape: [266, 266, 280, 0, 280, 0],
            size: [2, 3],
            output: {id: 294, count: 1}
        },
        {
            // Wooden Pickaxe: 3 Planks top, Stick middle, Stick bottom
            // [5, 5, 5]
            // [0, 280, 0]
            // [0, 280, 0]
            shape: [
                5, 5, 5,
                0, 280, 0,
                0, 280, 0
            ],
            size: [3, 3],
            output: {id: 270, count: 1}
        },
        {
            // Bow: String, String, String + Sticks
            // S L .
            // S . L
            // S L .
            shape: [
                287, 280, 0,
                287, 0, 280,
                287, 280, 0
            ],
            size: [3, 3],
            output: {id: 261, count: 1}
        },
        {
            // Bow (Mirrored)
            shape: [
                0, 280, 287,
                280, 0, 287,
                0, 280, 287
            ],
            size: [3, 3],
            output: {id: 261, count: 1}
        },
        {
            // Fishing Rod: Diagonal Sticks + 2 strings
            // . . S
            // . S L
            // S . L
            shape: [
                0, 0, 280,
                0, 280, 287,
                280, 0, 287
            ],
            size: [3, 3],
            output: {id: 346, count: 1}
        },
        {
            // Fishing Rod (Mirrored)
            shape: [
                280, 0, 0,
                287, 280, 0,
                287, 0, 280
            ],
            size: [3, 3],
            output: {id: 346, count: 1}
        },
        {
            // Wooden Sword: Plank over Plank over Stick
            shape: [5, 5, 280],
            size: [1, 3],
            output: {id: 268, count: 1}
        },
        {
            // Stone Sword: Cobblestone over Cobblestone over Stick
            shape: [4, 4, 280],
            size: [1, 3],
            output: {id: 272, count: 1}
        },
        {
            // Iron Sword: Iron Ingot over Iron Ingot over Stick
            shape: [265, 265, 280],
            size: [1, 3],
            output: {id: 267, count: 1}
        },
        {
            // Minecart: 5 Iron Ingots in U shape
            shape: [
                265, 0, 265,
                265, 265, 265
            ],
            size: [3, 2],
            output: {id: 328, count: 1}
        },
        {
            // Snow Block: 2x2 snowballs
            shape: [
                410, 410,
                410, 410
            ],
            size: [2, 2],
            output: {id: 80, count: 1}
        },
        {
            // Snow Slab
            shape: [80, 80, 80],
            size: [3, 1],
            output: {id: 193, count: 6}
        },
        {
            // Snow Stairs
            shape: [
                80, 0, 0,
                80, 80, 0,
                80, 80, 80
            ],
            size: [3, 3],
            output: {id: 194, count: 4}
        },
        {
            // Snow Stairs (Mirrored)
            shape: [
                0, 0, 80,
                0, 80, 80,
                80, 80, 80
            ],
            size: [3, 3],
            output: {id: 194, count: 4}
        },
        {
            // Gold Sword: Gold Ingot over Gold Ingot over Stick
            shape: [266, 266, 280],
            size: [1, 3],
            output: {id: 283, count: 1}
        },
        {
            // Diamond Sword: Diamond over Diamond over Stick
            shape: [264, 264, 280],
            size: [1, 3],
            output: {id: 276, count: 1}
        },
        {
            // Oak Door: 2x3 Oak Planks
            shape: [
                5, 5,
                5, 5,
                5, 5
            ],
            size: [2, 3],
            output: {id: 64, count: 3}
        },

        {
            // Iron Door: 2x3 Iron Ingots
            shape: [
                265, 265,
                265, 265,
                265, 265
            ],
            size: [2, 3],
            output: {id: 71, count: 3}
        },
        {
            // Oak Trapdoor: 3x2 Planks
            shape: [
                5, 5, 5,
                5, 5, 5
            ],
            size: [3, 2],
            output: {id: 96, count: 2}
        },

        {
            // Iron Trapdoor: 2x2 Iron Ingots
            shape: [
                265, 265,
                265, 265
            ],
            size: [2, 2],
            output: {id: 228, count: 1}
        },
        {
            // Furnace: 3x3 Ring of Cobblestone
            shape: [
                4, 4, 4,
                4, 0, 4,
                4, 4, 4
            ],
            size: [3, 3],
            output: {id: 61, count: 1}
        },
        {
            // Dispenser: Cobble ring with bow and redstone
            shape: [
                4, 4, 4,
                4, 261, 4,
                4, 331, 4
            ],
            size: [3, 3],
            output: {id: 23, count: 1}
        },
        {
            // Chest: 8 Planks in Ring
            shape: [
                5, 5, 5,
                5, 0, 5,
                5, 5, 5
            ],
            size: [3, 3],
            output: {id: 54, count: 1}
        },
        {
            // Bowl: 3 planks in V shape (Smallest bounding box: 3x2)
            shape: [
                5, 0, 5,
                0, 5, 0
            ],
            size: [3, 2],
            output: {id: 281, count: 4}
        },
        {
            // Mushroom Stew: Bowl + Red + Brown (Shapeless-like, 2x2 bounding box)
            shape: [
                281, 34,
                35, 0
            ],
            size: [2, 2],
            output: {id: 282, count: 1}
        },
        {
            // Beetroot Soup: Bowl + 6 Beetroots
            shape: [
                422, 422, 422,
                422, 422, 422,
                0, 281, 0
            ],
            size: [3, 3],
            output: {id: 423, count: 1}
        },
        {
            // White Wool: 4 String
            shape: [
                287, 287,
                287, 287
            ],
            size: [2, 2],
            output: {id: 208, count: 1}
        },
        {
            // Wooden Slab: 3 planks horizontal -> 6 slabs
            shape: [5, 5, 5],
            size: [3, 1],
            output: {id: 44, count: 6}
        },

        {
            // Wooden Stairs: 6 planks stair shape -> 4 stairs
            // P  
            // P P 
            // P P P
            shape: [
                5, 0, 0,
                5, 5, 0,
                5, 5, 5
            ],
            size: [3, 3],
            output: {id: 53, count: 4}
        },
        {
            // Wooden Stairs (Mirrored)
            shape: [
                0, 0, 5,
                0, 5, 5,
                5, 5, 5
            ],
            size: [3, 3],
            output: {id: 53, count: 4}
        },
        {
            // Birch Stairs (Mirrored)
            shape: [
                0, 0, 201,
                0, 201, 201,
                201, 201, 201
            ],
            size: [3, 3],
            output: {id: 215, count: 4},
            strict: true
        },
        {
            // Spruce Stairs (Mirrored)
            shape: [
                0, 0, 210,
                0, 210, 210,
                210, 210, 210
            ],
            size: [3, 3],
            output: {id: 216, count: 4},
            strict: true
        },
        {
            // Acacia Log -> Acacia Planks
            shape: [235],
            size: [1, 1],
            output: {id: 304, count: 4},
            strict: true
        },
        {
            // Dark Oak Log -> Dark Oak Planks
            shape: [253],
            size: [1, 1],
            output: {id: 305, count: 4},
            strict: true
        },
        {
            // Acacia Slab
            shape: [304, 304, 304],
            size: [3, 1],
            output: {id: 384, count: 6},
            strict: true
        },
        {
            // Dark Oak Slab
            shape: [305, 305, 305],
            size: [3, 1],
            output: {id: 389, count: 6},
            strict: true
        },
        {
            // Acacia Stairs
            shape: [
                304, 0, 0,
                304, 304, 0,
                304, 304, 304
            ],
            size: [3, 3],
            output: {id: 385, count: 4},
            strict: true
        },
        {
            // Dark Oak Stairs
            shape: [
                305, 0, 0,
                305, 305, 0,
                305, 305, 305
            ],
            size: [3, 3],
            output: {id: 428, count: 4},
            strict: true
        },
        {
            // Acacia Fence
            shape: [
                304, 280, 304,
                304, 280, 304
            ],
            size: [3, 2],
            output: { id: 387, count: 3 },
            strict: true
        },
        {
            // Dark Oak Fence
            shape: [
                305, 280, 305,
                305, 280, 305
            ],
            size: [3, 2],
            output: { id: 419, count: 3 },
            strict: true
        },

        // --- Cobblestone Variants ---
        {
            // Cobblestone Slab
            shape: [4, 4, 4],
            size: [3, 1],
            output: {id: 147, count: 6}
        },
        {
            // Cobblestone Stairs
            shape: [
                4, 0, 0,
                4, 4, 0,
                4, 4, 4
            ],
            size: [3, 3],
            output: {id: 148, count: 4}
        },
        {
            // Cobblestone Stairs (Mirrored)
            shape: [
                0, 0, 4,
                0, 4, 4,
                4, 4, 4
            ],
            size: [3, 3],
            output: {id: 148, count: 4}
        },
        // --- Stone Variants ---
        {
            // Stone Slab
            shape: [1, 1, 1],
            size: [3, 1],
            output: {id: 149, count: 6}
        },
        {
            // Stone Stairs
            shape: [
                1, 0, 0,
                1, 1, 0,
                1, 1, 1
            ],
            size: [3, 3],
            output: {id: 150, count: 4}
        },
        {
            // Stone Stairs (Mirrored)
            shape: [
                0, 0, 1,
                0, 1, 1,
                1, 1, 1
            ],
            size: [3, 3],
            output: {id: 150, count: 4}
        },
        // --- Brick Variants ---
        {
            // Brick Slab
            shape: [45, 45, 45],
            size: [3, 1],
            output: {id: 145, count: 6}
        },
        {
            // Brick Stairs
            shape: [
                45, 0, 0,
                45, 45, 0,
                45, 45, 45
            ],
            size: [3, 3],
            output: {id: 146, count: 4}
        },
        {
            // Brick Stairs (Mirrored)
            shape: [
                0, 0, 45,
                0, 45, 45,
                45, 45, 45
            ],
            size: [3, 3],
            output: {id: 146, count: 4}
        },
        // --- Sandstone Variants ---
        {
            // Sandstone Slab
            shape: [24, 24, 24],
            size: [3, 1],
            output: {id: 151, count: 6}
        },
        {
            // Sandstone Stairs
            shape: [
                24, 0, 0,
                24, 24, 0,
                24, 24, 24
            ],
            size: [3, 3],
            output: {id: 154, count: 4}
        },
        {
            // Sandstone Stairs (Mirrored)
            shape: [
                0, 0, 24,
                0, 24, 24,
                24, 24, 24
            ],
            size: [3, 3],
            output: {id: 154, count: 4}
        },
        {
            // Cut Sandstone: 2x2 Sandstone
            shape: [
                24, 24,
                24, 24
            ],
            size: [2, 2],
            output: {id: 179, count: 4}
        },
        {
            // Cut Sandstone Slab
            shape: [179, 179, 179],
            size: [3, 1],
            output: {id: 182, count: 6}
        },
        {
            // Cut Sandstone Stairs
            shape: [
                179, 0, 0,
                179, 179, 0,
                179, 179, 179
            ],
            size: [3, 3],
            output: {id: 183, count: 4}
        },
        {
            // Cut Sandstone Stairs (Mirrored)
            shape: [
                0, 0, 179,
                0, 179, 179,
                179, 179, 179
            ],
            size: [3, 3],
            output: {id: 183, count: 4}
        },
        // --- Granite Variants ---
        {
            shape: [220, 220, 220],
            size: [3, 1],
            output: {id: 184, count: 6}
        },
        {
            shape: [220, 0, 0, 220, 220, 0, 220, 220, 220],
            size: [3, 3],
            output: {id: 185, count: 4}
        },
        // --- Diorite Variants ---
        {
            shape: [221, 221, 221],
            size: [3, 1],
            output: {id: 186, count: 6}
        },
        {
            shape: [221, 0, 0, 221, 221, 0, 221, 221, 221],
            size: [3, 3],
            output: {id: 187, count: 4}
        },
        // --- Andesite Variants ---
        {
            shape: [222, 222, 222],
            size: [3, 1],
            output: {id: 188, count: 6}
        },
        {
            shape: [222, 0, 0, 222, 222, 0, 222, 222, 222],
            size: [3, 3],
            output: {id: 189, count: 4}
        },
        // --- New Recipes ---
        {
            // Torch: Coal over Stick
            shape: [263, 280],
            size: [1, 2],
            output: {id: 50, count: 4}
        },
        {
            // Bucket: 3 iron ingots in V shape
            shape: [
                265, 0, 265,
                0,   265, 0,
                0,   0,   0
            ],
            size: [3, 3],
            output: {id: 361, count: 1}
        },
        {
            // Shears: 2 Iron Ingots diagonal
            shape: [265, 0, 0, 265],
            size: [2, 2],
            output: {id: 359, count: 1}
        },
        {
            // Shears (Mirrored)
            shape: [0, 265, 265, 0],
            size: [2, 2],
            output: {id: 359, count: 1}
        },
        // --- Mineral Blocks ---
        {
            // Gold Block
            shape: [
                266, 266, 266,
                266, 266, 266,
                266, 266, 266
            ],
            size: [3, 3],
            output: {id: 41, count: 1}
        },
        {
            // Iron Block
            shape: [
                265, 265, 265,
                265, 265, 265,
                265, 265, 265
            ],
            size: [3, 3],
            output: {id: 42, count: 1}
        },
        {
            // Diamond Block
            shape: [
                264, 264, 264,
                264, 264, 264,
                264, 264, 264
            ],
            size: [3, 3],
            output: {id: 57, count: 1}
        },
        {
            // Emerald Block
            shape: [
                388, 388, 388,
                388, 388, 388,
                388, 388, 388
            ],
            size: [3, 3],
            output: {id: 133, count: 1}
        },
        {
            // Bed: 3 Wool over 3 Planks
            shape: [
                208, 208, 208,
                5, 5, 5
            ],
            size: [3, 2],
            output: {id: 92, count: 1}
        },
        {
            // Painting: 8 sticks around 1 leather -> painting item id 321
            shape: [
                280, 280, 280,
                280, 334, 280,
                280, 280, 280
            ],
            size: [3, 3],
            output: {id: 321, count: 1}
        },
        {
            // Lever: Stick over Cobble
            shape: [280, 4],
            size: [1, 2],
            output: {id: 69, count: 1}
        },
        {
            // Button: single plank in center -> button id 77
            shape: [
                0, 0, 0,
                0, 5, 0,
                0, 0, 0
            ],
            size: [3, 3],
            output: {id: 77, count: 1}
        },
        {
            // Stone Button
            shape: [
                0, 0, 0,
                0, 1, 0,
                0, 0, 0
            ],
            size: [3, 3],
            output: {id: 223, count: 1}
        },
        {
            // TNT: Gunpowder (289) and Sand (12)
            shape: [
                289, 12, 289,
                12, 289, 12,
                289, 12, 289
            ],
            size: [3, 3],
            output: {id: 46, count: 1}
        },
        {
            // Redstone Block: 9 Redstone Dust (331)
            shape: [
                331, 331, 331,
                331, 331, 331,
                331, 331, 331
            ],
            size: [3, 3],
            output: {id: 152, count: 1}
        },
        {
            // Redstone Lamp: 4 redstone around 1 glowstone (89)
            shape: [
                0, 331, 0,
                331, 89, 331,
                0, 331, 0
            ],
            size: [3, 3],
            output: {id: 123, count: 1}
        },
        {
            // Flint and Steel: Ingot and Flint
            shape: [265, 0, 0, 318],
            size: [2, 2],
            output: {id: 259, count: 1}
        },
        {
            // Clay Block: 2x2 of clay balls -> Clay block
            shape: [
                337, 337,
                337, 337
            ],
            size: [2, 2],
            output: {id: 82, count: 1}
        },
        // New: Arrow recipe — column of Flint -> Stick -> Feather produces 4 arrows (works in any column/row position)
        {
            shape: [
                318,
                280,
                288
            ],
            size: [1, 3],
            output: { id: 262, count: 4 }
        },
        // New: Stone Bricks — 2x2 of Stone -> 4 Stone Bricks
        {
            shape: [
                1, 1,
                1, 1
            ],
            size: [2, 2],
            output: { id: 98, count: 4 }
        },
        // New: Brick Block — 2x2 of Brick items -> Brick block
        {
            shape: [
                336, 336,
                336, 336
            ],
            size: [2, 2],
            output: { id: 45, count: 1 }
        },
        // New: Ladder — H shape of sticks
        {
            shape: [
                280, 0, 280,
                280, 280, 280,
                280, 0, 280
            ],
            size: [3, 3],
            output: { id: 65, count: 3 }
        },
        // New: Fence — 6 sticks (2 rows of 3) -> 2 Fences
        {
            shape: [
                280, 280, 280,
                280, 280, 280
            ],
            size: [3, 2],
            output: { id: 85, count: 2 }
        },
        {
            // Cobblestone Wall
            shape: [
                4, 4, 4,
                4, 4, 4
            ],
            size: [3, 2],
            output: {id: 139, count: 6}
        },
        {
            // Stone Brick Wall
            shape: [
                98, 98, 98,
                98, 98, 98
            ],
            size: [3, 2],
            output: {id: 140, count: 6},
            strict: true
        },
        {
            // Sandstone Wall
            shape: [
                24, 24, 24,
                24, 24, 24
            ],
            size: [3, 2],
            output: {id: 143, count: 6},
            strict: true
        },
        {
            // Brick Wall
            shape: [
                45, 45, 45,
                45, 45, 45
            ],
            size: [3, 2],
            output: {id: 144, count: 6},
            strict: true
        },
        {
            // End Stone Brick Wall
            shape: [
                122, 122, 122,
                122, 122, 122
            ],
            size: [3, 2],
            output: {id: 138, count: 6},
            strict: true
        },
        {
            // Birch Fence
            shape: [
                280, 280, 280,
                280, 280, 280
            ],
            size: [3, 2],
            output: { id: 217, count: 2 },
            customCheck: (grid) => {
                // Ensure wood type matches for birch fence?
                // Standard recipes here are just IDs.
            }
        },
        // We actually need planks for modern fences, but the current recipe uses sticks.
        // I will follow the existing pattern for Birch/Spruce:

        // Fence Gate: Stick Plank Stick / Stick Plank Stick
        {
            shape: [
                280, 5, 280,
                280, 5, 280
            ],
            size: [3, 2],
            output: { id: 107, count: 1 }
        },
        // Bone -> 3 Bonemeal
        {
            shape: [352],
            size: [1, 1],
            output: { id: 351, count: 3 }
        },
        // Bread: 3 Wheat horizontal
        {
            shape: [296, 296, 296],
            size: [3, 1],
            output: { id: 297, count: 1 }
        },
        // --- Armor Recipes ---
        // Iron Armor (Ingot 265)
        {
            // Iron Helmet
            shape: [265, 265, 265, 265, 0, 265],
            size: [3, 2],
            output: {id: 306, count: 1}
        },
        {
            // Iron Chestplate
            shape: [265, 0, 265, 265, 265, 265, 265, 265, 265],
            size: [3, 3],
            output: {id: 307, count: 1}
        },
        {
            // Iron Leggings
            shape: [265, 265, 265, 265, 0, 265, 265, 0, 265],
            size: [3, 3],
            output: {id: 308, count: 1}
        },
        {
            // Iron Boots
            shape: [265, 0, 265, 265, 0, 265],
            size: [3, 2],
            output: {id: 309, count: 1}
        },
        // Gold Armor (Ingot 266)
        {
            // Gold Helmet
            shape: [266, 266, 266, 266, 0, 266],
            size: [3, 2],
            output: {id: 314, count: 1}
        },
        {
            // Gold Chestplate
            shape: [266, 0, 266, 266, 266, 266, 266, 266, 266],
            size: [3, 3],
            output: {id: 315, count: 1}
        },
        {
            // Gold Leggings
            shape: [266, 266, 266, 266, 0, 266, 266, 0, 266],
            size: [3, 3],
            output: {id: 316, count: 1}
        },
        {
            // Gold Boots
            shape: [266, 0, 266, 266, 0, 266],
            size: [3, 2],
            output: {id: 317, count: 1}
        },
        {
            // Gold Boots (Alternative)
            shape: [266, 0, 266, 266, 0, 266],
            size: [3, 2],
            output: {id: 317, count: 1},
            offsetY: 1
        },
        // --- Glowstone Block ---
        {
            // Glowstone Block: 2x2 Glowstone Dust
            shape: [
                409, 409,
                409, 409
            ],
            size: [2, 2],
            output: {id: 89, count: 1}
        },
        // Diamond Armor (Gem 264)
        {
            // Diamond Helmet
            shape: [264, 264, 264, 264, 0, 264],
            size: [3, 2],
            output: {id: 310, count: 1}
        },
        {
            // Diamond Chestplate
            shape: [264, 0, 264, 264, 264, 264, 264, 264, 264],
            size: [3, 3],
            output: {id: 311, count: 1}
        },
        {
            // Diamond Leggings
            shape: [264, 264, 264, 264, 0, 264, 264, 0, 264],
            size: [3, 3],
            output: {id: 312, count: 1}
        },
        {
            // Diamond Boots
            shape: [264, 0, 264, 264, 0, 264],
            size: [3, 2],
            output: {id: 313, count: 1}
        },
        {
            // Hay Bale: 9 Wheat
            shape: [
                296, 296, 296,
                296, 296, 296,
                296, 296, 296
            ],
            size: [3, 3],
            output: {id: 170, count: 1}
        },
        {
            // Sugar: 1 Sugarcane
            shape: [83],
            size: [1, 1],
            output: {id: 353, count: 1}
        },
        {
            // Paper: 3 Sugarcane horizontal
            shape: [83, 83, 83],
            size: [3, 1],
            output: {id: 339, count: 3}
        },
        {
            // Book: 3 vertical paper + 1 leather
            shape: [
                339, 334,
                339, 0,
                339, 0
            ],
            size: [2, 3],
            output: {id: 340, count: 1}
        },
        {
            // Bookshelf: 3 planks top/bottom, 3 books middle
            shape: [
                5, 5, 5,
                340, 340, 340,
                5, 5, 5
            ],
            size: [3, 3],
            output: {id: 47, count: 1}
        },
        // --- Quartz Variants ---
        {
            // Quartz Slab: 3 blocks horizontal
            shape: [155, 155, 155],
            size: [3, 1],
            output: {id: 251, count: 6}
        },
        {
            // Quartz Stairs
            shape: [
                155, 0, 0,
                155, 155, 0,
                155, 155, 155
            ],
            size: [3, 3],
            output: {id: 252, count: 4}
        },
        {
            // Quartz Stairs (Mirrored)
            shape: [
                0, 0, 155,
                0, 155, 155,
                155, 155, 155
            ],
            size: [3, 3],
            output: {id: 252, count: 4}
        },
        // --- Dyes ---
        { shape: [37], size: [1, 1], output: {id: 437, count: 1} }, // Dandelion -> Yellow
        { shape: [38], size: [1, 1], output: {id: 436, count: 1} }, // Rose/Poppy -> Red
        { shape: [176], size: [1, 1], output: {id: 436, count: 1} }, // Red Tulip -> Red
        { shape: [175], size: [1, 1], output: {id: 441, count: 1} }, // Pink Tulip -> Pink
        { shape: [206], size: [1, 1], output: {id: 434, count: 1} }, // White Tulip -> White
        { shape: [207], size: [1, 1], output: {id: 434, count: 1} }, // Lily of the Valley -> White
        { shape: [177], size: [1, 1], output: {id: 438, count: 1} }, // Azure Bluet -> Light Gray
        { shape: [178], size: [1, 1], output: {id: 444, count: 1} }, // Allium -> Magenta
        { shape: [191], size: [1, 1], output: {id: 436, count: 2} }, // Rose Bush -> 2x Red
        { shape: [192], size: [1, 1], output: {id: 444, count: 2} }, // Lilac -> 2x Magenta
        { shape: [39], size: [1, 1], output: {id: 444, count: 2} }, // Paeonia -> 2x Magenta/Pink
        // --- Wool Dyeing ---
        { shape: [208, 430], size: [2, 1], output: {id: 377, count: 1} }, // White Wool + Cyan Dye -> Cyan Wool
        { shape: [208, 431], size: [2, 1], output: {id: 380, count: 1} }, // Brown
        { shape: [208, 432], size: [2, 1], output: {id: 381, count: 1} }, // Green
        { shape: [208, 433], size: [2, 1], output: {id: 383, count: 1} }, // Black
        { shape: [208, 434], size: [2, 1], output: {id: 208, count: 1} }, // White (redundant but standard)
        { shape: [208, 435], size: [2, 1], output: {id: 378, count: 1} }, // Purple
        { shape: [208, 436], size: [2, 1], output: {id: 382, count: 1} }, // Red
        { shape: [208, 437], size: [2, 1], output: {id: 372, count: 1} }, // Yellow
        { shape: [208, 438], size: [2, 1], output: {id: 376, count: 1} }, // Light Gray
        { shape: [208, 439], size: [2, 1], output: {id: 371, count: 1} }, // Light Blue
        { shape: [208, 440], size: [2, 1], output: {id: 375, count: 1} }, // Gray
        { shape: [208, 441], size: [2, 1], output: {id: 374, count: 1} }, // Pink
        { shape: [208, 442], size: [2, 1], output: {id: 379, count: 1} }, // Blue
        { shape: [208, 443], size: [2, 1], output: {id: 373, count: 1} }, // Lime
        { shape: [208, 444], size: [2, 1], output: {id: 370, count: 1} }, // Magenta
        { shape: [208, 445], size: [2, 1], output: {id: 369, count: 1} },  // Orange

        // --- Terracotta Dyeing ---
        { shape: [450, 430], size: [2, 1], output: {id: 461, count: 1} }, // Cyan
        { shape: [450, 431], size: [2, 1], output: {id: 451, count: 1} }, // Brown
        { shape: [450, 432], size: [2, 1], output: {id: 453, count: 1} }, // Green
        { shape: [450, 433], size: [2, 1], output: {id: 459, count: 1} }, // Black
        { shape: [450, 434], size: [2, 1], output: {id: 458, count: 1} }, // White
        { shape: [450, 435], size: [2, 1], output: {id: 455, count: 1} }, // Purple
        { shape: [450, 436], size: [2, 1], output: {id: 463, count: 1} }, // Red
        { shape: [450, 437], size: [2, 1], output: {id: 464, count: 1} }, // Yellow
        { shape: [450, 438], size: [2, 1], output: {id: 462, count: 1} }, // Light Gray
        { shape: [450, 439], size: [2, 1], output: {id: 454, count: 1} }, // Light Blue
        { shape: [450, 440], size: [2, 1], output: {id: 456, count: 1} }, // Gray
        { shape: [450, 441], size: [2, 1], output: {id: 457, count: 1} }, // Pink
        { shape: [450, 442], size: [2, 1], output: {id: 454, count: 1} }, // Blue (Mapped to Lt Blue)
        { shape: [450, 443], size: [2, 1], output: {id: 460, count: 1} }, // Lime
        { shape: [450, 444], size: [2, 1], output: {id: 465, count: 1} }, // Magenta
        { shape: [450, 445], size: [2, 1], output: {id: 452, count: 1} },  // Orange

        // --- Signs ---
        {
            // Oak Sign
            shape: [5, 5, 5, 5, 5, 5, 0, 280, 0],
            size: [3, 3],
            output: {id: 481, count: 3}
        },
        {
            // Birch Sign
            shape: [201, 201, 201, 201, 201, 201, 0, 280, 0],
            size: [3, 3],
            output: {id: 482, count: 3},
            strict: true
        },
        {
            // Spruce Sign
            shape: [210, 210, 210, 210, 210, 210, 0, 280, 0],
            size: [3, 3],
            output: {id: 483, count: 3},
            strict: true
        },
        {
            // Acacia Sign
            shape: [304, 304, 304, 304, 304, 304, 0, 280, 0],
            size: [3, 3],
            output: {id: 492, count: 3},
            strict: true
        },
        {
            // Dark Oak Sign
            shape: [305, 305, 305, 305, 305, 305, 0, 280, 0],
            size: [3, 3],
            output: {id: 493, count: 3},
            strict: true
        },
        {
            // Cookie: Wheat - Sugar - Wheat
            shape: [296, 353, 296],
            size: [3, 1],
            output: {id: 357, count: 8}
        },
        {
            // Crossbow
            shape: [
                280, 265, 280,
                287, 265, 287,
                0,   280, 0
            ],
            size: [3, 3],
            output: {id: 499, count: 1}
        },
        {
            // Block of Coal
            shape: [
                263, 263, 263,
                263, 263, 263,
                263, 263, 263
            ],
            size: [3, 3],
            output: {id: 173, count: 1}
        },
        {
            // Lapis Lazuli Block (using Blue Dye 442 as proxy)
            shape: [
                442, 442, 442,
                442, 442, 442,
                442, 442, 442
            ],
            size: [3, 3],
            output: {id: 22, count: 1}
        },
        {
            // Anvil
            shape: [
                42, 42, 42,
                0,  265, 0,
                265, 265, 265
            ],
            size: [3, 3],
            output: {id: 167, count: 1}
        },
        {
            // Powered Rail
            shape: [
                266, 0,   266,
                266, 280, 266,
                266, 331, 266
            ],
            size: [3, 3],
            output: {id: 158, count: 6}
        },
        {
            // Rail
            shape: [
                265, 0,   265,
                265, 280, 265,
                265, 0,   265
            ],
            size: [3, 3],
            output: {id: 66, count: 16}
        },
        {
            // Piston
            shape: [
                5,   5,   5,
                4,   265, 4,
                4,   331, 4
            ],
            size: [3, 3],
            output: {id: 29, count: 1}
        },
        {
            // Sticky Piston
            shape: [496, 29],
            size: [1, 2],
            output: {id: 30, count: 1}
        },
        {
            // Slime Block
            shape: [
                496, 496, 496,
                496, 496, 496,
                496, 496, 496
            ],
            size: [3, 3],
            output: {id: 165, count: 1}
        },
        {
            // Observer
            shape: [
                4, 4, 4,
                4, 415, 4,
                331, 331, 331
            ],
            size: [3, 3],
            output: {id: 161, count: 1}
        },
        {
            // Boat
            shape: [
                5, 0, 5,
                5, 5, 5
            ],
            size: [3, 2],
            output: {id: 333, count: 1}
        },
        {
            // Jukebox
            shape: [
                5, 5, 5,
                5, 264, 5,
                5, 5, 5
            ],
            size: [3, 3],
            output: {id: 84, count: 1}
        },
        {
            // Note Block
            shape: [
                5, 5, 5,
                5, 331, 5,
                5, 5, 5
            ],
            size: [3, 3],
            output: {id: 25, count: 1}
        },
        {
            // Bone Block
            shape: [
                351, 351, 351,
                351, 351, 351,
                351, 351, 351
            ],
            size: [3, 3],
            output: {id: 572, count: 1}
        },
        {
            // Dropper
            shape: [
                4, 4, 4,
                4, 0, 4,
                4, 4, 4
            ],
            size: [3, 3],
            output: {id: 573, count: 1}
        }
    ];

    /**
     * Checks if the input grid matches any recipe.
     * 
     * @param {Array} inputIds Array of item IDs in the crafting grid (row-major)
     * @param {number} gridWidth Width of the crafting grid (2 or 3)
     */
    static checkRecipe(inputIds, gridWidth) {
        const gridHeight = inputIds.length / gridWidth;

        for (const recipe of Crafting.recipes) {
            if (!recipe || !recipe.shape || !recipe.size || !recipe.output) continue;

            // Try to match the recipe at every possible position in the grid
            const [rw, rh] = recipe.size; // recipe width, height
            
            // If recipe is bigger than grid, skip
            if (rw > gridWidth || rh > gridHeight) continue;

            // Iterate over possible top-left positions for the recipe in the grid
            for (let startY = 0; startY <= gridHeight - rh; startY++) {
                for (let startX = 0; startX <= gridWidth - rw; startX++) {
                    if (Crafting.matchesAt(inputIds, gridWidth, gridHeight, recipe, rw, rh, startX, startY)) {
                        return {id: recipe.output.id, count: recipe.output.count};
                    }
                }
            }
        }
        return {id: 0, count: 0};
    }

    static itemsMatch(gridId, recipeId, isStrict = false) {
        if (gridId === recipeId) return true;
        if (isStrict) return false;

        // Group: Wood Planks (Oak, Birch, Spruce, Acacia, Dark Oak)
        const woodPlanks = [5, 201, 210, 304, 305];
        if (woodPlanks.includes(recipeId) && woodPlanks.includes(gridId)) return true;

        // Group: Logs (Oak, Birch, Spruce, Acacia, Dark Oak)
        const logs = [17, 200, 209, 235, 253];
        if (logs.includes(recipeId) && logs.includes(gridId)) return true;

        return false;
    }

    static matchesAt(grid, gw, gh, recipe, rw, rh, startX, startY) {
        const shape = recipe.shape;
        // Check every slot in the grid
        for (let y = 0; y < gh; y++) {
            for (let x = 0; x < gw; x++) {
                const gridIndex = y * gw + x;
                const gridItem = grid[gridIndex];

                // Check if this grid slot is inside the recipe bounds relative to startX, startY
                const rx = x - startX;
                const ry = y - startY;

                let recipeItem = 0;
                if (rx >= 0 && rx < rw && ry >= 0 && ry < rh) {
                    recipeItem = shape[ry * rw + rx];
                }

                // Use material matching logic
                if (!Crafting.itemsMatch(gridItem, recipeItem, recipe.strict)) {
                    return false;
                }
            }
        }
        return true;
    }
}