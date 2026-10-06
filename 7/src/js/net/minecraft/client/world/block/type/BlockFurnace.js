import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import GuiFurnace from "../../../gui/screens/GuiFurnace.js";

export default class BlockFurnace extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../furnace.png.png";
        this.sound = Block.sounds.stone;
    }

    getRenderType() {
        return BlockRenderType.FURNACE;
    }

    getLightValue(world, x, y, z) {
        if (!world) return 0;
        let meta = world.getBlockDataAt(x, y, z);
        // Check if lit bit (4) is set
        return (meta & 4) !== 0 ? 13 : 0;
    }

    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        // Determine orientation: 0=South, 1=West, 2=North, 3=East
        let direction = Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3;
        // Invert direction so front faces player
        world.setBlockDataAt(x, y, z, (direction + 2) & 3);
    }

    onBlockActivated(world, x, y, z, player) {
        // Get or create tile entity data
        let tileEntity = world.getTileEntity(x, y, z);
        if (!tileEntity) {
            tileEntity = {
                items: [
                    {id: 0, count: 0}, // Input
                    {id: 0, count: 0}, // Fuel
                    {id: 0, count: 0}  // Output
                ],
                burnTime: 0,
                cookTime: 0,
                currentItemBurnTime: 0
            };
            world.setTileEntity(x, y, z, tileEntity);
        }

        world.minecraft.displayScreen(new GuiFurnace(player, x, y, z));
        return true;
    }

    updateTileEntity(world, x, y, z, data) {
        let wasBurning = data.burnTime > 0;
        let isModified = false;

        if (data.burnTime > 0) {
            data.burnTime--;
            isModified = true;
        }

        // Smelting Logic
        let inputStack = data.items[0];
        let fuelStack = data.items[1];
        let outputStack = data.items[2];

        let recipeResult = this.getSmeltingResult(inputStack.id);

        // Try to start burning if stopped
        if (data.burnTime === 0 && recipeResult !== 0 && this.canSmelt(recipeResult, outputStack)) {
            let fuelValue = this.getBurnTime(fuelStack.id);
            if (fuelValue > 0) {
                data.currentItemBurnTime = fuelValue;
                data.burnTime = fuelValue;
                
                if (fuelStack.count > 0) {
                    fuelStack.count--;
                    if (fuelStack.count === 0) {
                        data.items[1] = {id: 0, count: 0};
                    }
                    isModified = true;
                }
            }
        }

        // Processing smelting progress
        if (data.burnTime > 0 && this.canSmelt(recipeResult, outputStack)) {
            data.cookTime++;
            isModified = true;
            if (data.cookTime >= 200) { // 10 seconds (200 ticks at 20tps)
                data.cookTime = 0;
                this.smeltItem(recipeResult, inputStack, outputStack);
                world.minecraft.stats.itemsSmelted++;
                
                // Trigger achievements
                if (recipeResult === 265) world.minecraft.achievementManager.grant('acquirehardware');
                if (recipeResult === 320) world.minecraft.achievementManager.grant('porkchop');
            }
        } else {
            if (data.cookTime > 0) {
                data.cookTime = 0;
                isModified = true;
            }
        }

        // Update block lit state and light if changed
        let isBurning = data.burnTime > 0;
        if (wasBurning !== isBurning) {
            this.updateBlockState(world, x, y, z, isBurning);
        }

        // Notify world of data change for persistence if needed
        if (isModified) {
            // world.setTileEntity already marks the chunk as dirty
        }
    }

    getBurnTime(id) {
        if (id === 263) return 1600; // Coal/Charcoal (8 items)
        if (id === 368) return 20000; // Lava Bucket (1000 seconds)

        // Wood types (Planks, logs, slabs, stairs, fences, trapdoors, doors, etc.)
        const woodBlocks = [
            17, 200, 209, 235, 253, // Logs
            5, 201, 210, 304, 305, // Planks
            44, 213, 214, 384, 389, // Slabs
            53, 215, 216, 385, 407, // Stairs
            85, 217, 218, 387, 419, // Fences
            107, 429, 446, // Fence Gates
            64, 205, 219, 426, 427, // Doors
            96, 224, 225, 226, 227, // Trapdoors
            47, 58, 65, 106, 280, 281, 72, 77, 321, 333, 411, 412, 424, 425 // Bookshelf, CraftTable, Ladder, Vine, Stick, Bowl, Button, Plate, Painting, Boats
        ];
        if (woodBlocks.includes(id)) return 300; // 15 seconds (300 ticks)

        return 0;
    }

    updateBlockState(world, x, y, z, isBurning) {
        let meta = world.getBlockDataAt(x, y, z);
        
        // Meta format: bits 0-1 = rotation. Bit 2 (value 4) = lit.
        let rotation = meta & 3;
        let newMeta = rotation | (isBurning ? 4 : 0);
        
        if (meta !== newMeta) {
            // Update metadata to reflect lit state change
            world.setBlockDataAt(x, y, z, newMeta);
            
            // Trigger light update (1 = EnumSkyBlock.BLOCK)
            world.updateLight(1, x - 1, y - 1, z - 1, x + 1, y + 1, z + 1); 
            
            // Trigger render update
            world.minecraft.worldRenderer.flushRebuild = true;
        }
    }

    getSmeltingResult(inputId) {
        if (inputId === 12) return 20; // Sand -> Glass
        if (inputId === 15) return 265; // Iron Ore Block -> Iron Ingot
        if (inputId === 14) return 266; // Gold Ore -> Gold Ingot
        if (inputId === 4) return 1; // Cobblestone -> Stone
        if (inputId === 17 || inputId === 200 || inputId === 209 || inputId === 235 || inputId === 253) return 263; // Log -> Coal (Charcoal)
        if (inputId === 1) return 43; // Stone -> Smooth Stone
        if (inputId === 337) return 336; // Clay Ball -> Brick
        if (inputId === 363) return 364; // Raw Beef -> Steak
        if (inputId === 365) return 366; // Raw Chicken -> Cooked Chicken
        if (inputId === 319) return 320; // Raw Porkchop -> Cooked Porkchop
        if (inputId === 349) return 350; // Raw Cod -> Cooked Cod
        if (inputId === 354) return 355; // Raw Salmon -> Cooked Salmon

        // Terracotta Smelting
        if (inputId === 82) return 450; // Clay Block -> Terracotta
        
        // Colored Terracotta -> Glazed Terracotta
        const glazedMap = {
            451: 477, 452: 467, 453: 478, 454: 470, 455: 476,
            456: 473, 457: 472, 458: 480, 459: 479, 460: 469,
            461: 475, 462: 474, 463: 466, 464: 468, 465: 471
        };
        if (glazedMap[inputId]) return glazedMap[inputId];

        return 0;
    }

    canSmelt(resultId, outputStack) {
        if (resultId === 0) return false;
        if (outputStack.id === 0) return true;
        if (outputStack.id !== resultId) return false;
        if (outputStack.count < 64) return true;
        return false;
    }

    smeltItem(resultId, inputStack, outputStack) {
        if (outputStack.id === 0) {
            outputStack.id = resultId;
            outputStack.count = 1;
        } else if (outputStack.id === resultId) {
            outputStack.count++;
        }

        inputStack.count--;
        if (inputStack.count <= 0) {
            inputStack.id = 0;
            inputStack.count = 0;
        }
    }
}