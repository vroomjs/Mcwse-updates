import { EntityMinecart, BlockMinecartItem } from "../../../../../../../Minecarts.js";
import BlockLog from "./type/BlockLog.js";
import BlockStone from "./type/BlockStone.js";
import BlockGrass from "./type/BlockGrass.js";
import BlockDirt from "./type/BlockDirt.js";
import BlockLeave from "./type/BlockLeave.js";
import BlockWater from "./type/BlockWater.js";
import BlockSand from "./type/BlockSand.js";
import BlockTorch from "./type/BlockTorch.js";
import Sound from "./sound/Sound.js";
import Block from "./Block.js";
import BlockWood, { BlockButton } from "./type/BlockWood.js";
import BlockFoliage from "./type/BlockFoliage.js";
import BlockFlower from "./type/BlockFlower.js";
import BlockSnowball from "./type/BlockSnowball.js";
import BlockOre from "../../../../../ore.js";
import BlockGlass from "./type/BlockGlass.js";
import BlockCraftingTable from "./type/BlockCraftingTable.js";
import BlockDoor from "./type/BlockDoor.js";
import BlockPickaxe from "./type/BlockPickaxe.js";
import BlockSword from "./type/BlockSword.js";
import BlockShovel from "./type/BlockShovel.js";
import BlockAxe from "./type/BlockAxe.js";
import BlockBow from "./type/BlockBow.js";
import BlockStick from "./type/BlockStick.js";
import BlockShears from "./type/BlockShears.js";
import BlockFurnace from "./type/BlockFurnace.js";
import BlockCoal from "./type/BlockCoal.js";
import BlockItem from "./type/BlockItem.js";
import BlockChest from "./type/BlockChest.js";
import BlockSpawnEgg from "./type/BlockSpawnEgg.js";
import EntityCow from "../../entity/passive/EntityCow.js";
import EntityChicken from "../../entity/passive/EntityChicken.js";
import EntityZombie from "../../entity/monster/EntityZombie.js";
import BlockTNT from "./type/BlockTNT.js";
import BlockMineral from "./type/BlockMineral.js";
import BlockGravel from "./type/BlockGravel.js";
import BlockClay from "./type/BlockClay.js";
import BlockPainting from "./type/BlockPainting.js";
import BlockStairs from "./type/BlockStairs.js";
import BlockSnowyGrass from "./type/BlockSnowyGrass.js";
import BlockSnow, { BlockSnowLayer } from "./type/BlockSnow.js";
import BlockIce from "./type/BlockIce.js";
import BlockPackedIce from "./type/BlockPackedIce.js";
import BlockPumpkin from "./type/BlockPumpkin.js";
import BlockDeadBush from "./type/BlockDeadBush.js";
import BlockSugarCane from "./type/BlockSugarCane.js";
import BlockCactus from "./type/BlockCactus.js";
import EntityCreeper from "../../entity/monster/EntityCreeper.js";
import BlockLadder from "./type/BlockLadder.js";
import EntitySnowZombie from "../../entity/monster/EntitySnowZombie.js";
import EntityHusk from "../../entity/monster/EntityHusk.js";
import EntityDrowned from "../../entity/monster/EntityDrowned.js";
import EntityZombieVillager from "../../entity/monster/EntityZombieVillager.js";
import EntityVillager from "../../entity/passive/EntityVillager.js";
import EntityPig, { EntitySaddledPig } from "../../entity/passive/EntityPig.js";
import EntitySkeleton from "../../entity/monster/EntitySkeleton.js";
import EntitySnowGolem from "../../entity/passive/EntitySnowGolem.js";
import EntitySheep from "../../entity/passive/EntitySheep.js";
import EntitySpider from "../../entity/monster/EntitySpider.js";
import EntitySlime from "../../entity/monster/EntitySlime.js";
import EntityEnderman from "../../entity/monster/EntityEnderman.js";
import EntityIronGolem from "../../entity/passive/EntityIronGolem.js";
import EntityHorse from "../../entity/passive/EntityHorse.js";
import EntityHorseSkeleton from "../../entity/passive/EntityHorseSkeleton.js";
import EntityHorseZombie from "../../entity/passive/EntityHorseZombie.js";
import EntityDonkey from "../../entity/passive/EntityDonkey.js";
import EntityMule from "../../entity/passive/EntityMule.js";
import EntityCat from "../../entity/passive/EntityCat.js";
import BlockFence, { BlockFenceGate } from "./type/BlockFence.js";
import BlockWall from "./type/BlockWall.js";
import BlockLava from "../../../../../Lava.js";
import BlockNether from "./type/BlockNether.js";
import BlockFire from "./type/BlockFire.js";
import BlockPortal from "./type/BlockPortal.js";
import BlockSapling from "../../../../../../../Saplings.js";
import BlockHoe from "./type/BlockHoe.js";
import BlockMycelium from "./type/BlockMycelium.js";
import { BlockFarmland, BlockWheat, BlockSeeds, BlockCarrot, BlockCarrotItem, BlockPotato, BlockPotatoItem, BlockBeetrootCrop, BlockBeetrootSeeds } from "../../../../../../../Farming.js";
import BlockGrassPath from "./type/BlockGrassPath.js";
import BlockMap from "../../../../../../../Map.js";
import { BlockRedstoneDust, BlockRedstoneItem, BlockRedstoneLamp, BlockRedstoneBlock, BlockRedstoneTorch } from "../../../../../../../Redstone.js";
import { BlockBoatItem } from "../../../../../../../Boats.js";
import BlockSandstone, { BlockSandstoneSlab, BlockSandstoneStairs } from "./type/BlockSandstone.js";
import BlockCutSandstone, { BlockCutSandstoneSlab, BlockCutSandstoneStairs } from "./type/BlockCutSandstone.js";
import BlockChiseledSandstone from "./type/BlockChiseledSandstone.js";
import BlockFishingRod from "./type/BlockFishingRod.js";
import { BlockArmor } from "../../../../../../../Armor.js";
import BlockBirchLog from "./type/BlockBirchLog.js";
import BlockBirchPlanks from "./type/BlockBirchPlanks.js";
import BlockBirchSapling from "./type/BlockBirchSapling.js";
import BlockAcaciaSapling from "./type/BlockAcaciaSapling.js";
import BlockDarkOakSapling from "./type/BlockDarkOakSapling.js";
import BlockSpruceLog from "./type/BlockSpruceLog.js";
import BlockSprucePlanks from "./type/BlockSprucePlanks.js";
import BlockSpruceSapling from "./type/BlockSpruceSapling.js";
import BlockBed from "./type/BlockBed.js";
import BlockBookshelf from "./type/BlockBookshelf.js";
import BlockSlab, { BlockDoubleSlab } from "./type/BlockSlab.js";
import BlockRail from "./type/BlockRail.js";
import BlockHayBale from "./type/BlockHayBale.js";
import BlockDoublePlant from "./type/BlockDoublePlant.js";
import BlockStructure from "./type/BlockStructure.js";
import BlockCommand from "./type/BlockCommand.js";
import BlockLever from "./type/BlockLever.js";
import BlockDispenser from "./type/BlockDispenser.js";
import BlockPressurePlate from "./type/BlockPressurePlate.js";
import BlockVerticalSlab from "./type/BlockVerticalSlab.js";
import BlockQuartz, { BlockChiseledQuartz, BlockQuartzPillar, BlockQuartzSlab, BlockQuartzStairs } from "./type/BlockQuartz.js";
import BlockSponge from "./type/BlockSponge.js";
import BlockMagma from "./type/BlockMagma.js";
import BlockStainedGlass from "./type/BlockStainedGlass.js";
import BlockTrapdoor from "./type/BlockTrapdoor.js";
import BlockTerracotta, { BlockGlazedTerracotta } from "./type/BlockTerracotta.js";
import BlockSpawner from "./type/BlockSpawner.js";
import BlockEndPortalFrame from "./type/BlockEndPortalFrame.js";
import BlockDebugStick from "./type/BlockDebugStick.js";
import { BlockSign, BlockWallSign, BlockSignItem } from "../../../../../../../Signs.js";
import BlockSlime from "./type/BlockSlime.js";
import BlockCarpet from "./type/BlockCarpet.js";
import BlockNote from "./type/BlockNote.js";
import BlockJukebox from "./type/BlockJukebox.js";
import BlockMusicDisc from "./type/BlockMusicDisc.js";
import BlockPotion from "./type/BlockPotion.js";
import BlockAnvil from "./type/BlockAnvil.js";
import BlockEnchantedBook from "./type/BlockEnchantedBook.js";
import { BlockPistonBase, BlockPistonHead } from "./type/BlockPiston.js";
import BlockObserver from "./type/BlockObserver.js";
import BlockMobHead from "./type/BlockMobHead.js";
import BlockLight from "./type/BlockLight.js";
import BlockBarrier from "./type/BlockBarrier.js";
import BoundingBox from "../../../util/BoundingBox.js";
import BlockRenderType from "../../../util/BlockRenderType.js";
import GuiDispenser from "../../gui/screens/GuiDispenser.js";
import { FOOD_STATS } from "../../food/FoodStats.js";

export class BlockDropper extends BlockDispenser {
    constructor(id) {
        super(id);
        this.textureName = "../../random stuff.png";
        this.textureIndex = 4;
        this.cols = 9;
        this.name = "Dropper";
    }
    getRenderType() { return BlockRenderType.DISPENSER; }
    onBlockActivated(world, x, y, z, player) {
        let te = world.getTileEntity(x, y, z);
        if (!te) {
            te = { items: new Array(9).fill(null).map(() => ({id: 0, count: 0})), lastPowered: false };
            world.setTileEntity(x, y, z, te);
        }
        world.minecraft.displayScreen(new GuiDispenser(player, x, y, z));
        return true;
    }
    dispense(world, x, y, z, te) {
        world.minecraft.soundManager.playSound("random.click", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
        let indices = [];
        for (let i = 0; i < 9; i++) if (te.items[i] && te.items[i].id !== 0) indices.push(i);
        if (indices.length === 0) {
            world.minecraft.soundManager.playSound("random.click", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.2);
            return;
        }
        let slotIdx = indices[Math.floor(Math.random() * indices.length)];
        let stack = te.items[slotIdx];
        let itemId = stack.id;
        let itemTag = stack.tag || {};
        stack.count--;
        if (stack.count <= 0) te.items[slotIdx] = {id: 0, count: 0};
        world.setTileEntity(x, y, z, te);
        let meta = world.getBlockDataAt(x, y, z) & 7;
        let dx = 0, dy = 0, dz = 0;
        if (meta === 0) dy = -1; else if (meta === 1) dy = 1; else if (meta === 2) dz = -1; else if (meta === 3) dz = 1; else if (meta === 4) dx = -1; else if (meta === 5) dx = 1;
        let spawnX = x + 0.5 + dx * 0.7;
        let spawnY = y + 0.5 + dy * 0.7;
        let spawnZ = z + 0.5 + dz * 0.7;
        let item = new DroppedItem(world, spawnX, spawnY, spawnZ, itemId, 1, itemTag);
        item.pickupDelay = 10;
        item.motionX = dx * 0.3 + (Math.random() - 0.5) * 0.05;
        item.motionY = dy * 0.3 + 0.1;
        item.motionZ = dz * 0.3 + (Math.random() - 0.5) * 0.05;
        world.droppedItems.push(item);
    }
}

export class BlockCobweb extends BlockFoliage {
    constructor(id) {
        super(id, "../../random stuff.png", 1);
        this.cols = 9;
        this.sound = Block.sounds.cloth;
        this.name = "Cobweb";
        this.hardness = 4.0;
    }
    getRenderType() { return BlockRenderType.CROSS; }
    getBoundingBox(world, x, y, z) { return new BoundingBox(0.0, 0.0, 0.0, 1.0, 1.0, 1.0); }
    canPlaceBlockAt(world, x, y, z) { return true; }
    onNeighborBlockChange(world, x, y, z, neighborId) {}
}

export class BlockSweetBerryBush extends BlockFoliage {
    constructor(id) {
        super(id, "../../random stuff.png", 8); // Default to index 8 for inventory icon
        this.cols = 9;
        this.sound = Block.sounds.grass;
        this.name = "Sweet Berry Bush";
        this.hardness = 0.0;
    }
    getRenderType() { return BlockRenderType.CROSS; }
    getBoundingBox(world, x, y, z) { return new BoundingBox(0.0, 0.0, 0.0, 1.0, 1.0, 1.0); }
    getTextureForFace(face, meta = 0) {
        // Stages 0, 1, 2, 3 correspond to indices 5, 6, 7, 8 in the sheet
        let stage = meta & 3;
        return { type: 'custom', name: this.textureName, index: 5 + stage, cols: 9 };
    }
    onBlockAdded(world, x, y, z) {
        // Force an immediate refresh of the geometry to show the correct stage height
        if (world.minecraft && world.minecraft.worldRenderer) {
            world.minecraft.worldRenderer.flushRebuild = true;
        }
        // 25 mins total / 2 stages (starting from 1) = 12.5 mins per stage = 15000 ticks
        world.scheduleBlockUpdate(x, y, z, 15000); 
    }
    updateTick(world, x, y, z) {
        let meta = world.getBlockDataAt(x, y, z);
        if (meta < 3) {
            world.setBlockDataAt(x, y, z, meta + 1);
            world.scheduleBlockUpdate(x, y, z, 15000);
        }
    }
    onBlockActivated(world, x, y, z, player) {
        let meta = world.getBlockDataAt(x, y, z);
        // Stage 1 drops 1, 2 drops 2, 3 drops 3 as requested
        if (meta > 0) {
            let count = meta; 
            // Reset to empty stage (0)
            world.setBlockAt(x, y, z, this.id, 0);
            for(let i=0; i<count; i++) world.droppedItems.push(new DroppedItem(world, x+0.5, y+0.5, z+0.5, 570, 1));
            world.minecraft.soundManager.playSound("random.pop", x+0.5, y+0.5, z+0.5, 1, 1);
            player.swingArm();
            return true;
        }
        return false;
    }
    canPlaceBlockAt(world, x, y, z) { return true; }
    onNeighborBlockChange(world, x, y, z, neighborId) {}
}

export class BlockLilyPad extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../newblocksset1.png";
        this.textureIndex = 8;
        this.cols = 9;
        this.sound = Block.sounds.grass;
        this.boundingBox = new BoundingBox(0.0, 0.0, 0.0, 1.0, 0.015625, 1.0);
    }
    getRenderType() { return 54; } // BlockRenderType.LILY_PAD
    isSolid() { return false; }
    getOpacity() { return 0.0; }
    getCollisionBoundingBox(world, x, y, z) { return this.boundingBox; }
    canPlaceBlockAt(world, x, y, z) {
        let id = world.getBlockAt(x, y - 1, z);
        return id === 9 || id === 8; // Water source/flowing
    }
    getColor(world, x, y, z, face) {
        if (world === null) return 0x22aa22; // Inventory green
        let temp = world.getTemperature(x, y, z);
        let hum = world.getHumidity(x, y, z);
        return world.minecraft.grassColorizer.getColor(temp, hum);
    }
    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        let rotation = Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3;
        world.setBlockDataAt(x, y, z, rotation);
    }
}

export class BlockIronBars extends Block {
    constructor(id) {
        super(id, 0);
        this.textureName = "../../newblocksset1.png";
        this.textureIndex = 5;
        this.cols = 9;
        this.sound = Block.sounds.stone;
    }

    getTextureForFace(face, meta = 0) {
        return { type: 'custom', name: this.textureName, index: this.textureIndex, cols: this.cols };
    }
    getRenderType() { return BlockRenderType.PANE; }
    isSolid() { return false; }
    getOpacity() { return 0.0; }
    getCollisionBoundingBox(world, x, y, z) {
        let boxes = [];
        let thick = 0.125;
        let h = 0.5 - thick / 2;
        boxes.push(new BoundingBox(0.5 - thick / 2, 0.0, 0.5 - thick / 2, 0.5 + thick / 2, 1.0, 0.5 + thick / 2));
        if (this.canConnect(world, x, y, z - 1)) boxes.push(new BoundingBox(0.5 - thick / 2, 0.0, 0.0, 0.5 + thick / 2, 1.0, 0.5 - thick / 2));
        if (this.canConnect(world, x, y, z + 1)) boxes.push(new BoundingBox(0.5 - thick / 2, 0.0, 0.5 + thick / 2, 0.5 + thick / 2, 1.0, 1.0));
        if (this.canConnect(world, x - 1, y, z)) boxes.push(new BoundingBox(0.0, 0.0, 0.5 - thick / 2, 0.5 - thick / 2, 1.0, 0.5 + thick / 2));
        if (this.canConnect(world, x + 1, y, z)) boxes.push(new BoundingBox(0.5 + thick / 2, 0.0, 0.5 - thick / 2, 1.0, 1.0, 0.5 + thick / 2));
        return boxes;
    }
    getBoundingBox(world, x, y, z) {
        let thick = 0.125;
        let minX = 0.5 - thick/2, maxX = 0.5 + thick/2;
        let minZ = 0.5 - thick/2, maxZ = 0.5 + thick/2;
        if (world) {
            if (this.canConnect(world, x, y, z - 1)) minZ = 0.0;
            if (this.canConnect(world, x, y, z + 1)) maxZ = 1.0;
            if (this.canConnect(world, x - 1, y, z)) minX = 0.0;
            if (this.canConnect(world, x + 1, y, z)) maxX = 1.0;
        }
        return new BoundingBox(minX, 0.0, minZ, maxX, 1.0, maxZ);
    }
    canConnect(world, x, y, z) {
        if (!world) return false;
        let id = world.getBlockAt(x, y, z);
        if (id === this.id) return true;
        let b = Block.getById(id);
        return b && b.isSolid() && !b.isTranslucent();
    }
}

export class BlockRegistry {

    static create() {
        // Sounds
        Block.sounds.stone = new Sound("stone", 1.0);
        Block.sounds.granite = new Sound("granite", 1.0);
        Block.sounds.diorite = new Sound("diorite", 1.0);
        Block.sounds.andesite = new Sound("andesite", 1.0);
        Block.sounds.wood = new Sound("wood", 1.0);
        Block.sounds.gravel = new Sound("gravel", 1.0);
        Block.sounds.grass = new Sound("grass", 1.0);
        Block.sounds.cloth = new Sound("cloth", 1.0);
        Block.sounds.sand = new Sound("sand", 1.0);
        Block.sounds.snow = new Sound("snow", 1.0);
        Block.sounds.glass = new Sound("stone", 1.0);

        // Blocks
        BlockRegistry.DIRT = new BlockDirt(3, 0); BlockRegistry.DIRT.name = "Dirt";
        BlockRegistry.DIRT.sound = Block.sounds.grass;
        BlockRegistry.GRASS = new BlockGrass(2, 0); BlockRegistry.GRASS.name = "Grass Block";
        BlockRegistry.GRASS.sound = Block.sounds.grass;
        BlockRegistry.STONE = new BlockStone(1, 3); BlockRegistry.STONE.name = "Stone";
        BlockRegistry.STONE.sound = Block.sounds.stone;
        BlockRegistry.COBBLESTONE = new BlockStone(4, 4); BlockRegistry.COBBLESTONE.name = "Cobblestone";
        BlockRegistry.COBBLESTONE.sound = Block.sounds.stone;
        BlockRegistry.MOSSY_COBBLESTONE = new BlockMineral(48, "../../stonesheet.png", 7); BlockRegistry.MOSSY_COBBLESTONE.name = "Mossy Cobblestone";
        BlockRegistry.MOSSY_COBBLESTONE.sound = Block.sounds.stone;
        BlockRegistry.GRANITE = new BlockMineral(220, "../../granite.png");
        BlockRegistry.GRANITE.sound = Block.sounds.granite; BlockRegistry.GRANITE.name = "Granite";
        BlockRegistry.DIORITE = new BlockMineral(221, "../../diorite.png");
        BlockRegistry.DIORITE.sound = Block.sounds.diorite; BlockRegistry.DIORITE.name = "Diorite";
        BlockRegistry.ANDESITE = new BlockMineral(222, "../../andesite.png");
        BlockRegistry.ANDESITE.sound = Block.sounds.andesite; BlockRegistry.ANDESITE.name = "Andesite";
        BlockRegistry.BOOKSHELF = new BlockBookshelf(47); BlockRegistry.BOOKSHELF.name = "Bookshelf";
        BlockRegistry.STRUCTURE_BLOCK = new BlockStructure(255); BlockRegistry.STRUCTURE_BLOCK.name = "Structure Block";
        BlockRegistry.COMMAND_BLOCK = new BlockCommand(137); BlockRegistry.COMMAND_BLOCK.name = "Command Block";
        BlockRegistry.DISPENSER = new BlockDispenser(23); BlockRegistry.DISPENSER.name = "Dispenser";
        BlockRegistry.LEVER = new BlockLever(69); BlockRegistry.LEVER.name = "Lever";
        BlockRegistry.PRESSURE_PLATE = new BlockPressurePlate(72, 8, Block.sounds.wood); BlockRegistry.PRESSURE_PLATE.name = "Wooden Pressure Plate";
        BlockRegistry.STONE_PRESSURE_PLATE = new BlockPressurePlate(70, 3, Block.sounds.stone); BlockRegistry.STONE_PRESSURE_PLATE.name = "Stone Pressure Plate";
        BlockRegistry.LEAVE = new BlockLeave(18, "../../treestuff.png", 5, 30); BlockRegistry.LEAVE.name = "Oak Leaves";
        BlockRegistry.LOG = new BlockLog(17, "../../treestuff.png", 7, 6, 30); BlockRegistry.LOG.name = "Oak Log";
        BlockRegistry.WOOD = new BlockMineral(5, "../../treestuff.png", 9); BlockRegistry.WOOD.name = "Oak Planks";
        BlockRegistry.WOOD.sound = Block.sounds.wood;
        BlockRegistry.SAND = new BlockSand(12, 9); BlockRegistry.SAND.name = "Sand";
        BlockRegistry.GRAVEL = new BlockGravel(13); BlockRegistry.GRAVEL.name = "Gravel";
        BlockRegistry.CLAY = new BlockClay(82); BlockRegistry.CLAY.name = "Clay Block";
        BlockRegistry.PAINTING = new BlockPainting(321); BlockRegistry.PAINTING.name = "Painting";
        
        // Snow Biome Blocks
        BlockRegistry.SNOWY_GRASS = new BlockSnowyGrass(60); BlockRegistry.SNOWY_GRASS.name = "Snowy Grass";
        BlockRegistry.SNOW_BLOCK = new BlockSnow(80); BlockRegistry.SNOW_BLOCK.name = "Snow Block";
        BlockRegistry.SNOW_SLAB = new BlockSlab(193, "../../snow.png"); BlockRegistry.SNOW_SLAB.name = "Snow Slab";
        BlockRegistry.SNOW_STAIRS = new BlockStairs(194, "../../snow.png"); BlockRegistry.SNOW_STAIRS.name = "Snow Stairs";
        BlockRegistry.SNOW_LAYER = new BlockSnowLayer(78); BlockRegistry.SNOW_LAYER.name = "Snow Layer";
        BlockRegistry.ICE = new BlockIce(79); BlockRegistry.ICE.name = "Ice";
        BlockRegistry.PACKED_ICE = new BlockPackedIce(174); BlockRegistry.PACKED_ICE.name = "Packed Ice";

        // Pumpkin & Jack o Lantern
        BlockRegistry.PUMPKIN = new BlockPumpkin(86, false); BlockRegistry.PUMPKIN.name = "Pumpkin";
        BlockRegistry.JACK_O_LANTERN = new BlockPumpkin(91, true); BlockRegistry.JACK_O_LANTERN.name = "Jack o' Lantern";

        // Plants
        BlockRegistry.DEAD_BUSH = new BlockDeadBush(33); BlockRegistry.DEAD_BUSH.name = "Dead Bush";
        BlockRegistry.SUGAR_CANE = new BlockSugarCane(83); BlockRegistry.SUGAR_CANE.name = "Sugar Cane";
        BlockRegistry.CACTUS = new BlockCactus(81); BlockRegistry.CACTUS.name = "Cactus";
        BlockRegistry.LADDER = new BlockLadder(65); BlockRegistry.LADDER.name = "Ladder";
        BlockRegistry.VINE = new BlockLadder(106, "../../foliage.png", 6, 21); BlockRegistry.VINE.name = "Vines";
        BlockRegistry.FENCE = new BlockFence(85, 8); BlockRegistry.FENCE.name = "Oak Fence";
        BlockRegistry.FENCE_GATE = new BlockFenceGate(107); BlockRegistry.FENCE_GATE.name = "Oak Fence Gate";
        BlockRegistry.COBBLESTONE_WALL = new BlockWall(139, 4); BlockRegistry.COBBLESTONE_WALL.name = "Cobblestone Wall";
        BlockRegistry.STONE_BRICK_WALL = new BlockWall(140, 0, "../../stonesheet.png", 2, 8); BlockRegistry.STONE_BRICK_WALL.name = "Stone Brick Wall";
        BlockRegistry.SANDSTONE_WALL = new BlockWall(143, 0, "../../sandstuff.png", 1, 10); BlockRegistry.SANDSTONE_WALL.name = "Sandstone Wall";
        BlockRegistry.BRICK_WALL = new BlockWall(144, 0, "../../bricks.png", 0, 1); BlockRegistry.BRICK_WALL.name = "Brick Wall";
        BlockRegistry.END_STONE_BRICK_WALL = new BlockWall(138, 0, "../../endstuff.png", 6, 7); BlockRegistry.END_STONE_BRICK_WALL.name = "End Stone Brick Wall";

        // Wooden Slabs and Stairs (using Wood texture id 8 (atlas))
        BlockRegistry.WOODEN_SLAB = new BlockSlab(44, 8); BlockRegistry.WOODEN_SLAB.name = "Oak Slab";
        BlockRegistry.WOODEN_STAIRS = new BlockStairs(53, 8); BlockRegistry.WOODEN_STAIRS.name = "Oak Stairs";

        // Cobblestone variants (Atlas index 4 = Cobblestone on blocks.png)
        BlockRegistry.COBBLESTONE_SLAB = new BlockSlab(147, 4); BlockRegistry.COBBLESTONE_SLAB.name = "Cobblestone Slab";
        BlockRegistry.COBBLESTONE_STAIRS = new BlockStairs(148, 4); BlockRegistry.COBBLESTONE_STAIRS.name = "Cobblestone Stairs";

        BlockRegistry.COAL_BLOCK = new BlockMineral(173, "../../orestuff.png", 1); BlockRegistry.COAL_BLOCK.name = "Block of Coal";

        // Stone variants (Atlas index 3 = Stone on blocks.png)
        BlockRegistry.STONE_SLAB = new BlockSlab(149, 3); BlockRegistry.STONE_SLAB.name = "Stone Slab";
        BlockRegistry.STONE_STAIRS = new BlockStairs(150, 3); BlockRegistry.STONE_STAIRS.name = "Stone Stairs";

        // Lapis Blocks
        BlockRegistry.LAPIS_ORE = new BlockOre(21, 12); BlockRegistry.LAPIS_ORE.name = "Lapis Lazuli Ore";
        BlockRegistry.LAPIS_BLOCK = new BlockMineral(22, "../../orestuff.png", 13); BlockRegistry.LAPIS_BLOCK.name = "Lapis Lazuli Block";

        // Brick variants (Using texture name)
        BlockRegistry.BRICK_SLAB = new BlockSlab(145, "../../bricks.png"); BlockRegistry.BRICK_SLAB.name = "Brick Slab";
        BlockRegistry.BRICK_STAIRS = new BlockStairs(146, "../../bricks.png"); BlockRegistry.BRICK_STAIRS.name = "Brick Stairs";

        BlockRegistry.BRICK_BLOCK = new BlockMineral(45, "../../bricks.png"); BlockRegistry.BRICK_BLOCK.name = "Bricks";
        // TNT
        BlockRegistry.TNT = new BlockTNT(46); BlockRegistry.TNT.name = "TNT";
        BlockRegistry.SMOOTH_STONE = new BlockMineral(43, "../../stonesheet.png", 0); BlockRegistry.SMOOTH_STONE.name = "Smooth Stone";
        BlockRegistry.SMOOTH_STONE_SLAB = new BlockSlab(497, "../../stonesheet.png", 0, 8); BlockRegistry.SMOOTH_STONE_SLAB.name = "Smooth Stone Slab";
        BlockRegistry.SMOOTH_STONE_STAIRS = new BlockStairs(498, "../../stonesheet.png", 0, 8); BlockRegistry.SMOOTH_STONE_STAIRS.name = "Smooth Stone Stairs";
        BlockRegistry.STONE_BRICKS = new BlockMineral(98, "../../stonesheet.png", 2); BlockRegistry.STONE_BRICKS.name = "Stone Bricks";
        BlockRegistry.CHISELED_STONE_BRICKS = new BlockMineral(97, "../../stonesheet.png", 1); BlockRegistry.CHISELED_STONE_BRICKS.name = "Chiseled Stone Bricks";
        BlockRegistry.MOSSY_STONE_BRICKS = new BlockMineral(109, "../../stonesheet.png", 3); BlockRegistry.MOSSY_STONE_BRICKS.name = "Mossy Stone Bricks";
        BlockRegistry.CRACKED_STONE_BRICKS = new BlockMineral(108, "../../stonesheet.png", 4); BlockRegistry.CRACKED_STONE_BRICKS.name = "Cracked Stone Bricks";
        BlockRegistry.GLASS = new BlockGlass(20, 10); BlockRegistry.GLASS.name = "Glass";
        BlockRegistry.TORCH = new BlockTorch(50, 11); BlockRegistry.TORCH.name = "Torch";
        BlockRegistry.WATER = new BlockWater(9, 12); BlockRegistry.WATER.name = "Water";
        BlockRegistry.LAVA = new BlockLava(10); BlockRegistry.LAVA.name = "Lava";
        BlockRegistry.SANDSTONE = new BlockSandstone(24); BlockRegistry.SANDSTONE.name = "Sandstone";
        BlockRegistry.CUT_SANDSTONE = new BlockCutSandstone(179); BlockRegistry.CUT_SANDSTONE.name = "Cut Sandstone";
        BlockRegistry.CHISELED_SANDSTONE = new BlockChiseledSandstone(180); BlockRegistry.CHISELED_SANDSTONE.name = "Chiseled Sandstone";
        BlockRegistry.SANDSTONE_SLAB = new BlockSandstoneSlab(151);
        BlockRegistry.SANDSTONE_SLAB.sound = Block.sounds.stone; BlockRegistry.SANDSTONE_SLAB.name = "Sandstone Slab";
        BlockRegistry.SANDSTONE_STAIRS = new BlockSandstoneStairs(154);
        BlockRegistry.SANDSTONE_STAIRS.sound = Block.sounds.stone; BlockRegistry.SANDSTONE_STAIRS.name = "Sandstone Stairs";

        // Cut Sandstone Variants
        BlockRegistry.CUT_SANDSTONE_SLAB = new BlockCutSandstoneSlab(182); BlockRegistry.CUT_SANDSTONE_SLAB.name = "Cut Sandstone Slab";
        BlockRegistry.CUT_SANDSTONE_STAIRS = new BlockCutSandstoneStairs(183); BlockRegistry.CUT_SANDSTONE_STAIRS.name = "Cut Sandstone Stairs";

        BlockRegistry.BEDROCK = new BlockStone(7, 13); BlockRegistry.BEDROCK.name = "Bedrock";
        BlockRegistry.CRAFTING_TABLE = new BlockCraftingTable(58); BlockRegistry.CRAFTING_TABLE.name = "Crafting Table";
        BlockRegistry.BUTTON = new BlockButton(77, 8); BlockRegistry.BUTTON.name = "Wooden Button";
        BlockRegistry.STONE_BUTTON = new BlockButton(223, 3);
        BlockRegistry.STONE_BUTTON.sound = Block.sounds.stone; BlockRegistry.STONE_BUTTON.name = "Stone Button";
        
        // Doors (Indices strictly matched to the 17-sprite @All doors.png sheet)
        BlockRegistry.DOOR = new BlockDoor(64, 5, 1); BlockRegistry.DOOR.name = "Oak Door";
        BlockRegistry.BIRCH_DOOR = new BlockDoor(205, 7, 0); BlockRegistry.BIRCH_DOOR.name = "Birch Door";
        BlockRegistry.ACACIA_DOOR = new BlockDoor(426, 15, 2); BlockRegistry.ACACIA_DOOR.name = "Acacia Door";
        BlockRegistry.DARK_OAK_DOOR = new BlockDoor(427, 13, 3); BlockRegistry.DARK_OAK_DOOR.name = "Dark Oak Door";
        BlockRegistry.SPRUCE_DOOR = new BlockDoor(219, 11, 4); BlockRegistry.SPRUCE_DOOR.name = "Spruce Door";
        BlockRegistry.IRON_DOOR = new BlockDoor(71, 9, 9); // Icon 9 matches Iron Top (placeholder as icon is missing in sheet)
        BlockRegistry.IRON_DOOR.sound = Block.sounds.stone; BlockRegistry.IRON_DOOR.name = "Iron Door";

        BlockRegistry.CHEST = new BlockChest(54); BlockRegistry.CHEST.name = "Chest";

        // Mineral Blocks
        BlockRegistry.GOLD_BLOCK = new BlockMineral(41, "../../orestuff.png", 11); BlockRegistry.GOLD_BLOCK.name = "Gold Block";
        BlockRegistry.IRON_BLOCK = new BlockMineral(42, "../../orestuff.png", 3); BlockRegistry.IRON_BLOCK.name = "Iron Block";
        BlockRegistry.DIAMOND_BLOCK = new BlockMineral(57, "../../orestuff.png", 7); BlockRegistry.DIAMOND_BLOCK.name = "Diamond Block";
        BlockRegistry.EMERALD_BLOCK = new BlockMineral(133, "../../orestuff.png", 9); BlockRegistry.EMERALD_BLOCK.name = "Emerald Block";
        
        // Items / Materials
        BlockRegistry.IRON_INGOT = new BlockItem(265, "../../items (1).png", 19); BlockRegistry.IRON_INGOT.name = "Iron Ingot";
        BlockRegistry.GOLD_INGOT = new BlockItem(266, "../../items (1).png", 18); BlockRegistry.GOLD_INGOT.name = "Gold Ingot";

        // New Tree Stuff Blocks
        BlockRegistry.ACACIA_LOG = new BlockLog(235, "../../treestuff.png", 22, 21, 30); BlockRegistry.ACACIA_LOG.name = "Acacia Log";
        BlockRegistry.ACACIA_PLANKS = new BlockMineral(304, "../../treestuff.png", 24); BlockRegistry.ACACIA_PLANKS.name = "Acacia Planks";
        BlockRegistry.ACACIA_PLANKS.sound = Block.sounds.wood;
        BlockRegistry.ACACIA_SAPLING = new BlockAcaciaSapling(323); BlockRegistry.ACACIA_SAPLING.name = "Acacia Sapling";
        BlockRegistry.ACACIA_LEAVE = new BlockLeave(325, "../../treestuff.png", 20, 30, 0x8ab533); BlockRegistry.ACACIA_LEAVE.name = "Acacia Leaves";

        BlockRegistry.DARK_OAK_LOG = new BlockLog(253, "../../treestuff.png", 12, 11, 30); BlockRegistry.DARK_OAK_LOG.name = "Dark Oak Log";
        BlockRegistry.DARK_OAK_PLANKS = new BlockMineral(305, "../../treestuff.png", 29); BlockRegistry.DARK_OAK_PLANKS.name = "Dark Oak Planks";
        BlockRegistry.DARK_OAK_PLANKS.sound = Block.sounds.wood;
        BlockRegistry.DARK_OAK_SAPLING = new BlockDarkOakSapling(324); BlockRegistry.DARK_OAK_SAPLING.name = "Dark Oak Sapling";
        BlockRegistry.DARK_OAK_LEAVE = new BlockLeave(326, "../../treestuff.png", 10, 30, 0x1d3a11); BlockRegistry.DARK_OAK_LEAVE.name = "Dark Oak Leaves";

        BlockRegistry.STRIPPED_OAK_LOG = new BlockMineral(254, "../../treestuff.png", 8); BlockRegistry.STRIPPED_OAK_LOG.name = "Stripped Oak Log";
        BlockRegistry.STRIPPED_BIRCH_LOG = new BlockMineral(300, "../../treestuff.png", 18); BlockRegistry.STRIPPED_BIRCH_LOG.name = "Stripped Birch Log";
        BlockRegistry.STRIPPED_SPRUCE_LOG = new BlockMineral(301, "../../treestuff.png", 28); BlockRegistry.STRIPPED_SPRUCE_LOG.name = "Stripped Spruce Log";
        BlockRegistry.STRIPPED_ACACIA_LOG = new BlockMineral(302, "../../treestuff.png", 23); BlockRegistry.STRIPPED_ACACIA_LOG.name = "Stripped Acacia Log";
        BlockRegistry.STRIPPED_DARK_OAK_LOG = new BlockMineral(303, "../../treestuff.png", 13); BlockRegistry.STRIPPED_DARK_OAK_LOG.name = "Stripped Dark Oak Log";
        BlockRegistry.DIAMOND = new BlockItem(264, "../../items (1).png", 16); BlockRegistry.DIAMOND.name = "Diamond";
        BlockRegistry.EMERALD = new BlockItem(388, "../../emerald.png"); BlockRegistry.EMERALD.name = "Emerald";
        BlockRegistry.PAPER = new BlockItem(339, "../../items (1).png", 2); BlockRegistry.PAPER.name = "Paper";
        BlockRegistry.BOOK = new BlockItem(340, "../../items (1).png", 1); BlockRegistry.BOOK.name = "Book";
        BlockRegistry.SUGAR = new BlockItem(353, "../../items (1).png", 3); BlockRegistry.SUGAR.name = "Sugar";

        // New Items
        BlockRegistry.ARROW = new BlockItem(262, "../../items (1).png", 30); BlockRegistry.ARROW.name = "Arrow";
        BlockRegistry.FLINT = new BlockItem(318, "../../items (1).png", 28); BlockRegistry.FLINT.name = "Flint";
        BlockRegistry.FLINT_AND_STEEL = new BlockItem(259, "../../tools (1).png", 39).setMaxStackSize(1).setMaxDamage(64); BlockRegistry.FLINT_AND_STEEL.name = "Flint and Steel";
        BlockRegistry.COOKED_CHICKEN = new BlockItem(366, "../../food.png", 10); BlockRegistry.COOKED_CHICKEN.name = "Cooked Chicken";
        BlockRegistry.FEATHER = new BlockItem(288, "../../items (1).png", 21); BlockRegistry.FEATHER.name = "Feather";
        BlockRegistry.BEEF = new BlockItem(363, "../../food.png", 7); BlockRegistry.BEEF.name = "Raw Beef";
        BlockRegistry.COOKED_BEEF = new BlockItem(364, "../../food.png", 8); BlockRegistry.COOKED_BEEF.name = "Steak";
        BlockRegistry.ROTTEN_FLESH = new BlockItem(367, "../../food.png", 13); BlockRegistry.ROTTEN_FLESH.name = "Rotten Flesh";
        BlockRegistry.RAW_CHICKEN = new BlockItem(365, "../../food.png", 9); BlockRegistry.RAW_CHICKEN.name = "Raw Chicken";
        BlockRegistry.SALMON = new BlockItem(354, "../../food.png", 14); BlockRegistry.SALMON.name = "Raw Salmon";
        BlockRegistry.COOKED_SALMON = new BlockItem(355, "../../food.png", 15); BlockRegistry.COOKED_SALMON.name = "Cooked Salmon";
        BlockRegistry.RAW_FISH = new BlockItem(349, "../../food.png", 16); BlockRegistry.RAW_FISH.name = "Raw Cod";
        BlockRegistry.COOKED_FISH = new BlockItem(350, "../../food.png", 17); BlockRegistry.COOKED_FISH.name = "Cooked Cod";
        BlockRegistry.BRICK_ITEM = new BlockItem(336, "../../items (1).png", 17); BlockRegistry.BRICK_ITEM.name = "Brick";
        BlockRegistry.CLAY_BALL = new BlockItem(337, "../../items (1).png", 24); BlockRegistry.CLAY_BALL.name = "Clay Ball";
        BlockRegistry.LEATHER = new BlockItem(334, "../../items (1).png", 23); BlockRegistry.LEATHER.name = "Leather";
        BlockRegistry.BONE = new BlockItem(352, "../../items (1).png", 26); BlockRegistry.BONE.name = "Bone";
        BlockRegistry.BONE_MEAL = new BlockItem(351, "../../items (1).png", 25); BlockRegistry.BONE_MEAL.name = "Bone Meal";
        BlockRegistry.GUNPOWDER = new BlockItem(289, "../../items (1).png", 22); BlockRegistry.GUNPOWDER.name = "Gunpowder";

        // Tools
        BlockRegistry.WOODEN_PICKAXE = new BlockPickaxe(270, "../../tools (1).png", 2).setMaxStackSize(1).setMaxDamage(59); BlockRegistry.WOODEN_PICKAXE.name = "Wooden Pickaxe";
        BlockRegistry.STONE_PICKAXE = new BlockPickaxe(274, "../../tools (1).png", 7).setMaxStackSize(1).setMaxDamage(131); BlockRegistry.STONE_PICKAXE.name = "Stone Pickaxe";
        BlockRegistry.IRON_PICKAXE = new BlockPickaxe(257, "../../tools (1).png", 12).setMaxStackSize(1).setMaxDamage(250); BlockRegistry.IRON_PICKAXE.name = "Iron Pickaxe";
        BlockRegistry.GOLD_PICKAXE = new BlockPickaxe(285, "../../tools (1).png", 17).setMaxStackSize(1).setMaxDamage(33); BlockRegistry.GOLD_PICKAXE.name = "Golden Pickaxe";
        BlockRegistry.DIAMOND_PICKAXE = new BlockPickaxe(278, "../../tools (1).png", 22).setMaxStackSize(1).setMaxDamage(1561); BlockRegistry.DIAMOND_PICKAXE.name = "Diamond Pickaxe";

        // Swords
        BlockRegistry.WOODEN_SWORD = new BlockSword(268, "../../tools (1).png", 0).setMaxStackSize(1).setMaxDamage(59); BlockRegistry.WOODEN_SWORD.name = "Wooden Sword";
        BlockRegistry.STONE_SWORD  = new BlockSword(272, "../../tools (1).png", 5).setMaxStackSize(1).setMaxDamage(131); BlockRegistry.STONE_SWORD.name = "Stone Sword";
        BlockRegistry.IRON_SWORD   = new BlockSword(267, "../../tools (1).png", 10).setMaxStackSize(1).setMaxDamage(250); BlockRegistry.IRON_SWORD.name = "Iron Sword";
        BlockRegistry.GOLDEN_SWORD = new BlockSword(283, "../../tools (1).png", 15).setMaxStackSize(1).setMaxDamage(33); BlockRegistry.GOLDEN_SWORD.name = "Golden Sword";
        BlockRegistry.DIAMOND_SWORD = new BlockSword(276, "../../tools (1).png", 20).setMaxStackSize(1).setMaxDamage(1561); BlockRegistry.DIAMOND_SWORD.name = "Diamond Sword";

        BlockRegistry.WOODEN_SHOVEL = new BlockShovel(269, "../../tools (1).png", 1).setMaxStackSize(1).setMaxDamage(59); BlockRegistry.WOODEN_SHOVEL.name = "Wooden Shovel";
        BlockRegistry.STONE_SHOVEL = new BlockShovel(273, "../../tools (1).png", 6).setMaxStackSize(1).setMaxDamage(131); BlockRegistry.STONE_SHOVEL.name = "Stone Shovel";
        BlockRegistry.IRON_SHOVEL = new BlockShovel(256, "../../tools (1).png", 11).setMaxStackSize(1).setMaxDamage(250); BlockRegistry.IRON_SHOVEL.name = "Iron Shovel";
        BlockRegistry.GOLD_SHOVEL = new BlockShovel(284, "../../tools (1).png", 16).setMaxStackSize(1).setMaxDamage(33); BlockRegistry.GOLD_SHOVEL.name = "Golden Shovel";
        BlockRegistry.DIAMOND_SHOVEL = new BlockShovel(277, "../../tools (1).png", 21).setMaxStackSize(1).setMaxDamage(1561); BlockRegistry.DIAMOND_SHOVEL.name = "Diamond Shovel";

        BlockRegistry.WOODEN_AXE = new BlockAxe(271, "../../tools (1).png", 4).setMaxStackSize(1).setMaxDamage(59); BlockRegistry.WOODEN_AXE.name = "Wooden Axe";
        BlockRegistry.STONE_AXE = new BlockAxe(275, "../../tools (1).png", 9).setMaxStackSize(1).setMaxDamage(131); BlockRegistry.STONE_AXE.name = "Stone Axe";
        BlockRegistry.IRON_AXE = new BlockAxe(258, "../../tools (1).png", 14).setMaxStackSize(1).setMaxDamage(250); BlockRegistry.IRON_AXE.name = "Iron Axe";
        BlockRegistry.GOLD_AXE = new BlockAxe(286, "../../tools (1).png", 19).setMaxStackSize(1).setMaxDamage(33); BlockRegistry.GOLD_AXE.name = "Golden Axe";
        BlockRegistry.DIAMOND_AXE = new BlockAxe(279, "../../tools (1).png", 24).setMaxStackSize(1).setMaxDamage(1561); BlockRegistry.DIAMOND_AXE.name = "Diamond Axe";

        BlockRegistry.WOODEN_HOE = new BlockHoe(290, "../../tools (1).png", 3).setMaxStackSize(1).setMaxDamage(59); BlockRegistry.WOODEN_HOE.name = "Wooden Hoe";
        BlockRegistry.STONE_HOE = new BlockHoe(291, "../../tools (1).png", 8).setMaxStackSize(1).setMaxDamage(131); BlockRegistry.STONE_HOE.name = "Stone Hoe";
        BlockRegistry.IRON_HOE = new BlockHoe(292, "../../tools (1).png", 13).setMaxStackSize(1).setMaxDamage(250); BlockRegistry.IRON_HOE.name = "Iron Hoe";
        BlockRegistry.DIAMOND_HOE = new BlockHoe(293, "../../tools (1).png", 23).setMaxStackSize(1).setMaxDamage(1561); BlockRegistry.DIAMOND_HOE.name = "Diamond Hoe";
        BlockRegistry.GOLD_HOE = new BlockHoe(294, "../../tools (1).png", 18).setMaxStackSize(1).setMaxDamage(33); BlockRegistry.GOLD_HOE.name = "Golden Hoe";

        BlockRegistry.BOW = new BlockBow(261, "../../tools (1).png", 37).setMaxStackSize(1).setMaxDamage(384); BlockRegistry.BOW.name = "Bow";
        BlockRegistry.STICK = new BlockStick(280); BlockRegistry.STICK.name = "Stick";
        BlockRegistry.SHEARS = new BlockShears(359, "../../tools (1).png", 38).setMaxStackSize(1).setMaxDamage(238); BlockRegistry.SHEARS.name = "Shears";
        BlockRegistry.FLINT_AND_STEEL = new BlockItem(259, "../../tools (1).png", 39).setMaxStackSize(1).setMaxDamage(64); BlockRegistry.FLINT_AND_STEEL.name = "Flint and Steel";
        BlockRegistry.FURNACE = new BlockFurnace(61); BlockRegistry.FURNACE.name = "Furnace";
        BlockRegistry.COAL = new BlockCoal(263); BlockRegistry.COAL.name = "Coal";
        BlockRegistry.ROSE = new BlockFlower(38, "foliage.png", 8); BlockRegistry.ROSE.cols = 21; BlockRegistry.ROSE.name = "Poppy";
        BlockRegistry.DANDELION = new BlockFlower(37, "foliage.png", 7); BlockRegistry.DANDELION.cols = 21; BlockRegistry.DANDELION.name = "Dandelion";
        BlockRegistry.PAEONIA = new BlockDoublePlant(39, "foliage.png", 13, 12); BlockRegistry.PAEONIA.cols = 21; BlockRegistry.PAEONIA.name = "Peony";
        BlockRegistry.RED_MUSHROOM = new BlockFlower(34, "red_mushroom.png", 0); BlockRegistry.RED_MUSHROOM.name = "Red Mushroom";
        BlockRegistry.RED_MUSHROOM.isFood = true; BlockRegistry.RED_MUSHROOM.hungerValue = 1;
        BlockRegistry.BROWN_MUSHROOM = new BlockFlower(35, "brown_mushroom.png", 0); BlockRegistry.BROWN_MUSHROOM.name = "Brown Mushroom";
        BlockRegistry.BROWN_MUSHROOM.isFood = true; BlockRegistry.BROWN_MUSHROOM.hungerValue = 1;
        BlockRegistry.FOLIAGE = new BlockFoliage(31, "foliage.png", 0); BlockRegistry.FOLIAGE.cols = 21; BlockRegistry.FOLIAGE.name = "Grass";
        BlockRegistry.FERN = new BlockFoliage(32, "foliage.png", 3); BlockRegistry.FERN.cols = 21; BlockRegistry.FERN.name = "Fern";

        BlockRegistry.DIAMOND_ORE = new BlockOre(56, 6); BlockRegistry.DIAMOND_ORE.name = "Diamond Ore";
        BlockRegistry.IRON_ORE = new BlockOre(15, 2); BlockRegistry.IRON_ORE.name = "Iron Ore";
        BlockRegistry.COAL_ORE = new BlockOre(16, 0); BlockRegistry.COAL_ORE.name = "Coal Ore";
        BlockRegistry.GOLD_ORE = new BlockOre(14, 10); BlockRegistry.GOLD_ORE.name = "Gold Ore";
        BlockRegistry.EMERALD_ORE = new BlockOre(129, 8); BlockRegistry.EMERALD_ORE.name = "Emerald Ore";

        // Buckets (empty and water variants as items)
        BlockRegistry.BUCKET = new BlockItem(361, "../../items (1).png", 13); BlockRegistry.BUCKET.name = "Bucket";
        BlockRegistry.WATER_BUCKET = new BlockItem(362, "../../items (1).png", 14); BlockRegistry.WATER_BUCKET.name = "Water Bucket";
        BlockRegistry.LAVA_BUCKET = new BlockItem(368, "../../items (1).png", 12); BlockRegistry.LAVA_BUCKET.name = "Lava Bucket";
        
        // Spawn Eggs
        const SK_EGG = "../../skeleton_spawn_egg.png";
        BlockRegistry.COW_SPAWN_EGG = new BlockSpawnEgg(390, EntityCow, SK_EGG); BlockRegistry.COW_SPAWN_EGG.name = "Spawn Cow";
        BlockRegistry.CHICKEN_SPAWN_EGG = new BlockSpawnEgg(391, EntityChicken, SK_EGG); BlockRegistry.CHICKEN_SPAWN_EGG.name = "Spawn Chicken";
        BlockRegistry.ZOMBIE_SPAWN_EGG = new BlockSpawnEgg(392, EntityZombie, SK_EGG); BlockRegistry.ZOMBIE_SPAWN_EGG.name = "Spawn Zombie";
        BlockRegistry.ZOMBIE_VILLAGER_SPAWN_EGG = new BlockSpawnEgg(520, EntityZombieVillager, SK_EGG); BlockRegistry.ZOMBIE_VILLAGER_SPAWN_EGG.name = "Spawn Zombie Villager";
        BlockRegistry.CREEPER_SPAWN_EGG = new BlockSpawnEgg(393, EntityCreeper, SK_EGG); BlockRegistry.CREEPER_SPAWN_EGG.name = "Spawn Creeper";
        // NEW SPAWN EGGS
        BlockRegistry.SNOW_ZOMBIE_SPAWN_EGG = new BlockSpawnEgg(394, EntitySnowZombie, SK_EGG); BlockRegistry.SNOW_ZOMBIE_SPAWN_EGG.name = "Spawn Snow Zombie";
        BlockRegistry.HUSK_SPAWN_EGG = new BlockSpawnEgg(395, EntityHusk, SK_EGG); BlockRegistry.HUSK_SPAWN_EGG.name = "Spawn Husk";
        BlockRegistry.DROWNED_SPAWN_EGG = new BlockSpawnEgg(396, EntityDrowned, SK_EGG); BlockRegistry.DROWNED_SPAWN_EGG.name = "Spawn Drowned";
        BlockRegistry.VILLAGER_SPAWN_EGG = new BlockSpawnEgg(397, EntityVillager, SK_EGG); BlockRegistry.VILLAGER_SPAWN_EGG.name = "Spawn Villager";
        BlockRegistry.PIG_SPAWN_EGG = new BlockSpawnEgg(398, EntityPig, SK_EGG); BlockRegistry.PIG_SPAWN_EGG.name = "Spawn Pig";

        BlockRegistry.SKELETON_SPAWN_EGG = new BlockSpawnEgg(399, EntitySkeleton, SK_EGG); BlockRegistry.SKELETON_SPAWN_EGG.name = "Spawn Skeleton";
        BlockRegistry.IRON_GOLEM_SPAWN_EGG = new BlockSpawnEgg(401, EntityIronGolem, SK_EGG); BlockRegistry.IRON_GOLEM_SPAWN_EGG.name = "Spawn Iron Golem";
        BlockRegistry.SHEEP_SPAWN_EGG = new BlockSpawnEgg(416, EntitySheep, SK_EGG); BlockRegistry.SHEEP_SPAWN_EGG.name = "Spawn Sheep";
        BlockRegistry.SPIDER_SPAWN_EGG = new BlockSpawnEgg(417, EntitySpider, SK_EGG); BlockRegistry.SPIDER_SPAWN_EGG.name = "Spawn Spider";
        BlockRegistry.SLIME_SPAWN_EGG = new BlockSpawnEgg(447, EntitySlime, SK_EGG); BlockRegistry.SLIME_SPAWN_EGG.name = "Spawn Slime";
        BlockRegistry.ENDERMAN_SPAWN_EGG = new BlockSpawnEgg(448, EntityEnderman, SK_EGG); BlockRegistry.ENDERMAN_SPAWN_EGG.name = "Spawn Enderman";
        BlockRegistry.HORSE_SPAWN_EGG = new BlockSpawnEgg(521, EntityHorse, SK_EGG); BlockRegistry.HORSE_SPAWN_EGG.name = "Spawn Horse";
        BlockRegistry.DONKEY_SPAWN_EGG = new BlockSpawnEgg(522, EntityDonkey, SK_EGG); BlockRegistry.DONKEY_SPAWN_EGG.name = "Spawn Donkey";
        BlockRegistry.MULE_SPAWN_EGG = new BlockSpawnEgg(523, EntityMule, SK_EGG); BlockRegistry.MULE_SPAWN_EGG.name = "Spawn Mule";
        BlockRegistry.ZOMBIE_HORSE_SPAWN_EGG = new BlockSpawnEgg(524, EntityHorseZombie, SK_EGG); BlockRegistry.ZOMBIE_HORSE_SPAWN_EGG.name = "Spawn Zombie Horse";
        BlockRegistry.SKELETON_HORSE_SPAWN_EGG = new BlockSpawnEgg(525, EntityHorseSkeleton, SK_EGG); BlockRegistry.SKELETON_HORSE_SPAWN_EGG.name = "Spawn Skeleton Horse";
        BlockRegistry.CAT_SPAWN_EGG = new BlockSpawnEgg(526, EntityCat, SK_EGG); 
        BlockRegistry.CAT_SPAWN_EGG.name = "Spawn Cat";

        // NEW ITEM: SADDLE
        BlockRegistry.SADDLE = new BlockItem(408, "../../items (1).png", 10).setMaxStackSize(1); BlockRegistry.SADDLE.name = "Saddle";
        
        // NEW ITEM: Glowstone Dust
        BlockRegistry.GLOWSTONE_DUST = new BlockItem(409, "../../items (1).png", 27); BlockRegistry.GLOWSTONE_DUST.name = "Glowstone Dust";
        
        // NEW ITEM: Name Tag
        BlockRegistry.NAME_TAG = new BlockItem(414, "../../items (1).png", 31); BlockRegistry.NAME_TAG.name = "Name Tag";

        // NEW ITEM: Snowball
        BlockRegistry.SNOWBALL = new BlockSnowball(410); BlockRegistry.SNOWBALL.name = "Snowball";

        // NEW ITEM: Ender Pearl
        BlockRegistry.ENDER_PEARL = new BlockItem(413, "../../items (1).png", 0).setMaxStackSize(16); BlockRegistry.ENDER_PEARL.name = "Ender Pearl";

        // New Fishing Loot
        BlockRegistry.STRING_ITEM = new BlockItem(287, "../../items (1).png", 29); BlockRegistry.STRING_ITEM.name = "String";

        // NEW: Oak sapling (Custom Class) + Apples
        BlockRegistry.OAK_SAPLING = new BlockSapling(400, 0); BlockRegistry.OAK_SAPLING.name = "Oak Sapling";
        BlockRegistry.FISHING_ROD = new BlockFishingRod(346, "../../tools (1).png", 41); BlockRegistry.FISHING_ROD.name = "Fishing Rod";
        BlockRegistry.DEBUG_STICK = new BlockDebugStick(449); BlockRegistry.DEBUG_STICK.name = "Debug Stick";
        BlockRegistry.CROSSBOW = new BlockItem(499, "../../crossbow.png", 0).setMaxStackSize(1).setMaxDamage(326); BlockRegistry.CROSSBOW.name = "Crossbow";

        // Custom first-person pistol imported from pistol.glb. The model is rendered by BlockRenderer.
        BlockRegistry.PISTOL = new BlockItem(568, "../../pistol_icon.png", 0).setMaxStackSize(1).setMaxDamage(512);
        BlockRegistry.PISTOL.name = "Pistol";
        BlockRegistry.MAP = new BlockMap(358); BlockRegistry.MAP.name = "Map";
        BlockRegistry.BOWL = new BlockItem(281, "../../food2.png", 1); BlockRegistry.BOWL.name = "Bowl";
        BlockRegistry.MUSHROOM_STEW = new BlockItem(282, "../../food2.png", 2).setMaxStackSize(1); BlockRegistry.MUSHROOM_STEW.name = "Mushroom Stew";
        BlockRegistry.MUSHROOM_STEW.isFood = true; BlockRegistry.MUSHROOM_STEW.hungerValue = 6;
        BlockRegistry.COOKIE = new BlockItem(357, "../../food2.png", 0); BlockRegistry.COOKIE.name = "Cookie";
        BlockRegistry.COOKIE.isFood = true; BlockRegistry.COOKIE.hungerValue = 2;
        BlockRegistry.MUTTON = new BlockItem(494, "../../food2.png", 3); BlockRegistry.MUTTON.name = "Raw Mutton";
        BlockRegistry.MUTTON.isFood = true; BlockRegistry.MUTTON.hungerValue = 2;
        BlockRegistry.COOKED_MUTTON = new BlockItem(495, "../../food2.png", 4); BlockRegistry.COOKED_MUTTON.name = "Cooked Mutton";
        BlockRegistry.COOKED_MUTTON.isFood = true; BlockRegistry.COOKED_MUTTON.hungerValue = 6;
        BlockRegistry.APPLE = new BlockItem(260, "../../food.png", 0); BlockRegistry.APPLE.name = "Apple";
        BlockRegistry.GOLDEN_APPLE = new BlockItem(322, "../../food.png", 1); BlockRegistry.GOLDEN_APPLE.name = "Golden Apple";
        BlockRegistry.WHEAT_SEEDS = new BlockSeeds(402); BlockRegistry.WHEAT_SEEDS.name = "Wheat Seeds";
        BlockRegistry.CARROT_ITEM = new BlockCarrotItem(403); BlockRegistry.CARROT_ITEM.name = "Carrot";
        BlockRegistry.GOLDEN_CARROT = new BlockItem(404, "../../food.png", 3); BlockRegistry.GOLDEN_CARROT.name = "Golden Carrot";
        
        // Wheat & Bread
        BlockRegistry.WHEAT_ITEM = new BlockItem(296, "../../farming.png", 0); BlockRegistry.WHEAT_ITEM.name = "Wheat";
        BlockRegistry.BREAD = new BlockItem(297, "../../food.png", 6); BlockRegistry.BREAD.name = "Bread";
        
        // Porkchops
        BlockRegistry.PORKCHOP = new BlockItem(319, "../../food.png", 11); BlockRegistry.PORKCHOP.name = "Raw Porkchop";
        BlockRegistry.COOKED_PORKCHOP = new BlockItem(320, "../../food.png", 12); BlockRegistry.COOKED_PORKCHOP.name = "Cooked Porkchop";

        // Nether Blocks
        BlockRegistry.NETHERRACK = new BlockNether(87, 0); BlockRegistry.NETHERRACK.name = "Netherrack";
        BlockRegistry.SOUL_SAND = new BlockNether(88, 1);
        BlockRegistry.SOUL_SAND.sound = Block.sounds.sand; BlockRegistry.SOUL_SAND.name = "Soul Sand";
        BlockRegistry.OBSIDIAN = new BlockNether(49, 2); BlockRegistry.OBSIDIAN.name = "Obsidian";
        BlockRegistry.GLOWSTONE = new BlockNether(89, 3, 15); BlockRegistry.GLOWSTONE.name = "Glowstone";
        
        // Quartz Ore (Index 4)
        BlockRegistry.QUARTZ_ORE = new BlockNether(153, 4); BlockRegistry.QUARTZ_ORE.name = "Nether Quartz Ore";
        BlockRegistry.QUARTZ_ITEM = new BlockItem(415, "../../quartz.png", 0).setTextureSize(128, 16); BlockRegistry.QUARTZ_ITEM.name = "Nether Quartz";
        BlockRegistry.QUARTZ_BLOCK = new BlockQuartz(155); BlockRegistry.QUARTZ_BLOCK.name = "Block of Quartz";
        BlockRegistry.CHISELED_QUARTZ = new BlockChiseledQuartz(156); BlockRegistry.CHISELED_QUARTZ.name = "Chiseled Quartz Block";
        BlockRegistry.QUARTZ_PILLAR = new BlockQuartzPillar(157); BlockRegistry.QUARTZ_PILLAR.name = "Quartz Pillar";
        BlockRegistry.QUARTZ_SLAB = new BlockQuartzSlab(251); BlockRegistry.QUARTZ_SLAB.name = "Quartz Slab";
        BlockRegistry.QUARTZ_STAIRS = new BlockQuartzStairs(252); BlockRegistry.QUARTZ_STAIRS.name = "Quartz Stairs";

        // Fire
        BlockRegistry.FIRE = new BlockFire(51); BlockRegistry.FIRE.name = "Fire";
        BlockRegistry.PORTAL = new BlockPortal(90); BlockRegistry.PORTAL.name = "Nether Portal";
        
        // Farmland (ID 62)
        BlockRegistry.FARMLAND = new BlockFarmland(62); BlockRegistry.FARMLAND.name = "Farmland";
        
        // Wheat (ID 59)
        BlockRegistry.WHEAT = new BlockWheat(59); BlockRegistry.WHEAT.name = "Wheat Crops";
        
        // Carrots (ID 141)
        BlockRegistry.CARROTS = new BlockCarrot(141); BlockRegistry.CARROTS.name = "Carrots";

        // Potatoes (ID 142)
        BlockRegistry.POTATOES = new BlockPotato(142); BlockRegistry.POTATOES.name = "Potatoes";
        BlockRegistry.POTATO_ITEM = new BlockPotatoItem(405); BlockRegistry.POTATO_ITEM.name = "Potato";
        BlockRegistry.BAKED_POTATO = new BlockItem(406, "../../food.png", 5); BlockRegistry.BAKED_POTATO.name = "Baked Potato";

        // Map
        BlockRegistry.MAP = new BlockMap(358); BlockRegistry.MAP.name = "Map";

        // Beetroots
        BlockRegistry.BEETROOT_SEEDS = new BlockBeetrootSeeds(421); BlockRegistry.BEETROOT_SEEDS.name = "Beetroot Seeds";
        BlockRegistry.BEETROOT = new BlockItem(422, "../../beetroot (1).png", 1); BlockRegistry.BEETROOT.name = "Beetroot";
        BlockRegistry.BEETROOT_SOUP = new BlockItem(423, "../../beetroot (1).png", 2).setMaxStackSize(1); BlockRegistry.BEETROOT_SOUP.name = "Beetroot Soup";
        BlockRegistry.BEETROOTS = new BlockBeetrootCrop(420); BlockRegistry.BEETROOTS.name = "Beetroots";

        // Dyes
        const DYE_TEX = "../../dye.png";
        BlockRegistry.CYAN_DYE = new BlockItem(430, DYE_TEX, 0); BlockRegistry.CYAN_DYE.name = "Cyan Dye";
        BlockRegistry.BROWN_DYE = new BlockItem(431, DYE_TEX, 1); BlockRegistry.BROWN_DYE.name = "Brown Dye";
        BlockRegistry.GREEN_DYE = new BlockItem(432, DYE_TEX, 2); BlockRegistry.GREEN_DYE.name = "Green Dye";
        BlockRegistry.BLACK_DYE = new BlockItem(433, DYE_TEX, 3); BlockRegistry.BLACK_DYE.name = "Black Dye";
        BlockRegistry.WHITE_DYE = new BlockItem(434, DYE_TEX, 4); BlockRegistry.WHITE_DYE.name = "White Dye";
        BlockRegistry.PURPLE_DYE = new BlockItem(435, DYE_TEX, 5); BlockRegistry.PURPLE_DYE.name = "Purple Dye";
        BlockRegistry.RED_DYE = new BlockItem(436, DYE_TEX, 6); BlockRegistry.RED_DYE.name = "Red Dye";
        BlockRegistry.YELLOW_DYE = new BlockItem(437, DYE_TEX, 7); BlockRegistry.YELLOW_DYE.name = "Yellow Dye";
        BlockRegistry.LIGHT_GRAY_DYE = new BlockItem(438, DYE_TEX, 8); BlockRegistry.LIGHT_GRAY_DYE.name = "Light Gray Dye";
        BlockRegistry.LIGHT_BLUE_DYE = new BlockItem(439, DYE_TEX, 9); BlockRegistry.LIGHT_BLUE_DYE.name = "Light Blue Dye";
        BlockRegistry.GRAY_DYE = new BlockItem(440, DYE_TEX, 10); BlockRegistry.GRAY_DYE.name = "Gray Dye";
        BlockRegistry.PINK_DYE = new BlockItem(441, DYE_TEX, 11); BlockRegistry.PINK_DYE.name = "Pink Dye";
        BlockRegistry.BLUE_DYE = new BlockItem(442, DYE_TEX, 12); BlockRegistry.BLUE_DYE.name = "Blue Dye";
        BlockRegistry.LIME_DYE = new BlockItem(443, DYE_TEX, 13); BlockRegistry.LIME_DYE.name = "Lime Dye";
        BlockRegistry.MAGENTA_DYE = new BlockItem(444, DYE_TEX, 14); BlockRegistry.MAGENTA_DYE.name = "Magenta Dye";
        BlockRegistry.ORANGE_DYE = new BlockItem(445, DYE_TEX, 15); BlockRegistry.ORANGE_DYE.name = "Orange Dye";

        // Terracotta
        const TC_TEX = "../../terracottahseet.png";
        BlockRegistry.TERRACOTTA = new BlockTerracotta(450, 0); BlockRegistry.TERRACOTTA.name = "Terracotta";
        BlockRegistry.BROWN_TERRACOTTA = new BlockTerracotta(451, 1); BlockRegistry.BROWN_TERRACOTTA.name = "Brown Terracotta";
        BlockRegistry.ORANGE_TERRACOTTA = new BlockTerracotta(452, 2); BlockRegistry.ORANGE_TERRACOTTA.name = "Orange Terracotta";
        BlockRegistry.GREEN_TERRACOTTA = new BlockTerracotta(453, 3); BlockRegistry.GREEN_TERRACOTTA.name = "Green Terracotta";
        BlockRegistry.LIGHT_BLUE_TERRACOTTA = new BlockTerracotta(454, 4); BlockRegistry.LIGHT_BLUE_TERRACOTTA.name = "Light Blue Terracotta";
        BlockRegistry.PURPLE_TERRACOTTA = new BlockTerracotta(455, 5); BlockRegistry.PURPLE_TERRACOTTA.name = "Purple Terracotta";
        BlockRegistry.GRAY_TERRACOTTA = new BlockTerracotta(456, 6); BlockRegistry.GRAY_TERRACOTTA.name = "Gray Terracotta";
        BlockRegistry.PINK_TERRACOTTA = new BlockTerracotta(457, 7); BlockRegistry.PINK_TERRACOTTA.name = "Pink Terracotta";
        BlockRegistry.WHITE_TERRACOTTA = new BlockTerracotta(458, 8); BlockRegistry.WHITE_TERRACOTTA.name = "White Terracotta";
        BlockRegistry.BLACK_TERRACOTTA = new BlockTerracotta(459, 9); BlockRegistry.BLACK_TERRACOTTA.name = "Black Terracotta";
        BlockRegistry.LIME_TERRACOTTA = new BlockTerracotta(460, 10); BlockRegistry.LIME_TERRACOTTA.name = "Lime Terracotta";
        BlockRegistry.CYAN_TERRACOTTA = new BlockTerracotta(461, 11); BlockRegistry.CYAN_TERRACOTTA.name = "Cyan Terracotta";
        BlockRegistry.LIGHT_GRAY_TERRACOTTA = new BlockTerracotta(462, 12); BlockRegistry.LIGHT_GRAY_TERRACOTTA.name = "Light Gray Terracotta";
        BlockRegistry.RED_TERRACOTTA = new BlockTerracotta(463, 13); BlockRegistry.RED_TERRACOTTA.name = "Red Terracotta";
        BlockRegistry.YELLOW_TERRACOTTA = new BlockTerracotta(464, 14); BlockRegistry.YELLOW_TERRACOTTA.name = "Yellow Terracotta";
        BlockRegistry.MAGENTA_TERRACOTTA = new BlockTerracotta(465, 15); BlockRegistry.MAGENTA_TERRACOTTA.name = "Magenta Terracotta";

        // Glazed terracotta occupies slots 16-30 in terracottahseet.png.
        // Keep these indices aligned with the atlas rather than with the block IDs.
        BlockRegistry.RED_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(466, 16); BlockRegistry.RED_GLAZED_TERRACOTTA.name = "Red Glazed Terracotta";
        BlockRegistry.ORANGE_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(467, 17); BlockRegistry.ORANGE_GLAZED_TERRACOTTA.name = "Orange Glazed Terracotta";
        BlockRegistry.YELLOW_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(468, 18); BlockRegistry.YELLOW_GLAZED_TERRACOTTA.name = "Yellow Glazed Terracotta";
        BlockRegistry.LIME_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(469, 19); BlockRegistry.LIME_GLAZED_TERRACOTTA.name = "Lime Glazed Terracotta";
        BlockRegistry.BLUE_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(470, 20); BlockRegistry.BLUE_GLAZED_TERRACOTTA.name = "Blue Glazed Terracotta";
        BlockRegistry.MAGENTA_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(471, 21); BlockRegistry.MAGENTA_GLAZED_TERRACOTTA.name = "Magenta Glazed Terracotta";
        BlockRegistry.PINK_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(472, 22); BlockRegistry.PINK_GLAZED_TERRACOTTA.name = "Pink Glazed Terracotta";
        BlockRegistry.GRAY_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(473, 23); BlockRegistry.GRAY_GLAZED_TERRACOTTA.name = "Gray Glazed Terracotta";
        BlockRegistry.LIGHT_GRAY_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(474, 24); BlockRegistry.LIGHT_GRAY_GLAZED_TERRACOTTA.name = "Light Gray Glazed Terracotta";
        BlockRegistry.CYAN_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(475, 25); BlockRegistry.CYAN_GLAZED_TERRACOTTA.name = "Cyan Glazed Terracotta";
        BlockRegistry.PURPLE_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(476, 26); BlockRegistry.PURPLE_GLAZED_TERRACOTTA.name = "Purple Glazed Terracotta";
        BlockRegistry.BROWN_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(477, 27); BlockRegistry.BROWN_GLAZED_TERRACOTTA.name = "Brown Glazed Terracotta";
        BlockRegistry.GREEN_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(478, 28); BlockRegistry.GREEN_GLAZED_TERRACOTTA.name = "Green Glazed Terracotta";
        BlockRegistry.BLACK_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(479, 29); BlockRegistry.BLACK_GLAZED_TERRACOTTA.name = "Black Glazed Terracotta";
        BlockRegistry.WHITE_GLAZED_TERRACOTTA = new BlockGlazedTerracotta(480, 30); BlockRegistry.WHITE_GLAZED_TERRACOTTA.name = "White Glazed Terracotta";

        // Redstone
        BlockRegistry.REDSTONE_DUST = new BlockRedstoneDust(55); 
        BlockRegistry.REDSTONE_DUST.name = "Redstone Dust";
        BlockRegistry.REDSTONE_DUST.cols = 22;
        
        BlockRegistry.REDSTONE = new BlockRedstoneItem(331); 
        BlockRegistry.REDSTONE.name = "Redstone";
        BlockRegistry.REDSTONE.cols = 22;
        
        BlockRegistry.REDSTONE_BLOCK = new BlockRedstoneBlock(152, 5); BlockRegistry.REDSTONE_BLOCK.name = "Redstone Block";
        
        BlockRegistry.REDSTONE_ORE = new BlockOre(73, 4); BlockRegistry.REDSTONE_ORE.name = "Redstone Ore";
        BlockRegistry.REDSTONE_LAMP = new BlockRedstoneLamp(123, false); BlockRegistry.REDSTONE_LAMP.name = "Redstone Lamp";
        BlockRegistry.REDSTONE_LAMP_ON = new BlockRedstoneLamp(124, true); BlockRegistry.REDSTONE_LAMP_ON.name = "Redstone Lamp (Lit)";

        BlockRegistry.REDSTONE_TORCH = new BlockRedstoneTorch(76, true); BlockRegistry.REDSTONE_TORCH.name = "Redstone Torch";
        BlockRegistry.REDSTONE_TORCH_OFF = new BlockRedstoneTorch(75, false); BlockRegistry.REDSTONE_TORCH_OFF.name = "Redstone Torch (Off)";
        
        // Birch
        BlockRegistry.BIRCH_LOG = new BlockBirchLog(200); BlockRegistry.BIRCH_LOG.name = "Birch Log";
        BlockRegistry.BIRCH_PLANKS = new BlockMineral(201, "../../treestuff.png", 19); BlockRegistry.BIRCH_PLANKS.name = "Birch Planks";
        BlockRegistry.BIRCH_PLANKS.sound = Block.sounds.wood;
        BlockRegistry.BIRCH_SAPLING = new BlockBirchSapling(202); BlockRegistry.BIRCH_SAPLING.name = "Birch Sapling";
        BlockRegistry.BIRCH_LEAVE = new BlockLeave(203, "../../treestuff.png", 15, 30, 0x80a755); BlockRegistry.BIRCH_LEAVE.name = "Birch Leaves";

        BlockRegistry.BIRCH_SLAB = new BlockSlab(213, "../../treestuff.png");
        BlockRegistry.BIRCH_SLAB.textureIndex = 19; BlockRegistry.BIRCH_SLAB.cols = 30;
        BlockRegistry.BIRCH_SLAB.name = "Birch Slab";
        BlockRegistry.BIRCH_STAIRS = new BlockStairs(215, "../../treestuff.png");
        BlockRegistry.BIRCH_STAIRS.textureIndex = 19; BlockRegistry.BIRCH_STAIRS.cols = 30;
        BlockRegistry.BIRCH_STAIRS.name = "Birch Stairs";

        BlockRegistry.BIRCH_FENCE = new BlockFence(217, 0, "../../treestuff.png", 19, 30);
        BlockRegistry.BIRCH_FENCE.name = "Birch Fence";

        BlockRegistry.SPRUCE_LOG = new BlockSpruceLog(209); BlockRegistry.SPRUCE_LOG.name = "Spruce Log";
        BlockRegistry.SPRUCE_PLANKS = new BlockMineral(210, "../../treestuff.png", 14); BlockRegistry.SPRUCE_PLANKS.name = "Spruce Planks";
        BlockRegistry.SPRUCE_PLANKS.sound = Block.sounds.wood;
        BlockRegistry.SPRUCE_SAPLING = new BlockSpruceSapling(211); BlockRegistry.SPRUCE_SAPLING.name = "Spruce Sapling";
        BlockRegistry.SPRUCE_LEAVE = new BlockLeave(212, "../../treestuff.png", 25, 30, 0x619961); BlockRegistry.SPRUCE_LEAVE.name = "Spruce Leaves";

        BlockRegistry.SPRUCE_SLAB = new BlockSlab(214, "../../treestuff.png");
        BlockRegistry.SPRUCE_SLAB.textureIndex = 14; BlockRegistry.SPRUCE_SLAB.cols = 30;
        BlockRegistry.SPRUCE_SLAB.name = "Spruce Slab";
        BlockRegistry.SPRUCE_STAIRS = new BlockStairs(216, "../../treestuff.png");
        BlockRegistry.SPRUCE_STAIRS.textureIndex = 14; BlockRegistry.SPRUCE_STAIRS.cols = 30;
        BlockRegistry.SPRUCE_STAIRS.name = "Spruce Stairs";

        BlockRegistry.SPRUCE_FENCE = new BlockFence(218, 0, "../../treestuff.png", 14, 30);
        BlockRegistry.SPRUCE_FENCE.name = "Spruce Fence";

        BlockRegistry.BED = new BlockBed(92); BlockRegistry.BED.name = "Bed";
        BlockRegistry.MIXED_SLAB = new BlockDoubleSlab(181); BlockRegistry.MIXED_SLAB.name = "Mixed Double Slab";
        BlockRegistry.RAIL = new BlockRail(66); BlockRegistry.RAIL.name = "Rail";
        BlockRegistry.POWERED_RAIL = new BlockRail(158); BlockRegistry.POWERED_RAIL.name = "Powered Rail";
        BlockRegistry.POWERED_RAIL_ON = new BlockRail(159); BlockRegistry.POWERED_RAIL_ON.name = "Powered Rail (Active)";
        BlockRegistry.HAY_BALE = new BlockHayBale(170); BlockRegistry.HAY_BALE.name = "Hay Bale";
        BlockRegistry.MINECART = new BlockMinecartItem(328); BlockRegistry.MINECART.name = "Minecart";

        BlockRegistry.MYCELIUM = new BlockMycelium(110); BlockRegistry.MYCELIUM.name = "Mycelium";
        BlockRegistry.MUSHROOM_STEM = new BlockMineral(99, "../../mushroom_stem.png"); BlockRegistry.MUSHROOM_STEM.name = "Mushroom Stem";
        BlockRegistry.BROWN_MUSHROOM_BLOCK = new BlockMineral(100, "../../brown_mushroom_block.png"); BlockRegistry.BROWN_MUSHROOM_BLOCK.name = "Brown Mushroom Block";
        BlockRegistry.RED_MUSHROOM_BLOCK = new BlockMineral(162, "../../red_mushroom_block.png"); BlockRegistry.RED_MUSHROOM_BLOCK.name = "Red Mushroom Block";

        BlockRegistry.TALL_GRASS = new BlockDoublePlant(204, "foliage.png", 1, 2); BlockRegistry.TALL_GRASS.cols = 21; BlockRegistry.TALL_GRASS.name = "Tall Grass";
        BlockRegistry.LARGE_FERN = new BlockDoublePlant(190, "foliage.png", 4, 5); BlockRegistry.LARGE_FERN.cols = 21; BlockRegistry.LARGE_FERN.name = "Large Fern";
        BlockRegistry.ROSE_BUSH = new BlockDoublePlant(191, "foliage.png", 11, 10); BlockRegistry.ROSE_BUSH.cols = 21; BlockRegistry.ROSE_BUSH.name = "Rose Bush";
        BlockRegistry.LILAC = new BlockDoublePlant(192, "foliage.png", 18, 17); BlockRegistry.LILAC.cols = 21; BlockRegistry.LILAC.name = "Lilac";
        BlockRegistry.WHITE_TULIP = new BlockFlower(206, "foliage.png", 14); BlockRegistry.WHITE_TULIP.cols = 21; BlockRegistry.WHITE_TULIP.name = "White Tulip";
        BlockRegistry.PINK_TULIP = new BlockFlower(175, "foliage.png", 15); BlockRegistry.PINK_TULIP.cols = 21; BlockRegistry.PINK_TULIP.name = "Pink Tulip";
        BlockRegistry.RED_TULIP = new BlockFlower(176, "foliage.png", 16); BlockRegistry.RED_TULIP.cols = 21; BlockRegistry.RED_TULIP.name = "Red Tulip";
        BlockRegistry.AZURE_BLUET = new BlockFlower(177, "foliage.png", 19); BlockRegistry.AZURE_BLUET.cols = 21; BlockRegistry.AZURE_BLUET.name = "Azure Bluet";
        BlockRegistry.ALLIUM = new BlockFlower(178, "foliage.png", 20); BlockRegistry.ALLIUM.cols = 21; BlockRegistry.ALLIUM.name = "Allium";
        BlockRegistry.LILY_OF_THE_VALLEY = new BlockFlower(207, "foliage.png", 9); BlockRegistry.LILY_OF_THE_VALLEY.cols = 21; BlockRegistry.LILY_OF_THE_VALLEY.name = "Lily of the Valley";
        
        // Wools from wools.png spritesheet
        const WOOL_TEX = "../../wools.png";
        BlockRegistry.WHITE_WOOL = new BlockMineral(208, WOOL_TEX, 0); BlockRegistry.WHITE_WOOL.name = "White Wool";
        BlockRegistry.ORANGE_WOOL = new BlockMineral(369, WOOL_TEX, 5); BlockRegistry.ORANGE_WOOL.name = "Orange Wool";
        BlockRegistry.MAGENTA_WOOL = new BlockMineral(370, WOOL_TEX, 8); BlockRegistry.MAGENTA_WOOL.name = "Magenta Wool";
        BlockRegistry.LIGHT_BLUE_WOOL = new BlockMineral(371, WOOL_TEX, 2); BlockRegistry.LIGHT_BLUE_WOOL.name = "Light Blue Wool";
        BlockRegistry.YELLOW_WOOL = new BlockMineral(372, WOOL_TEX, 9); BlockRegistry.YELLOW_WOOL.name = "Yellow Wool";
        BlockRegistry.LIME_WOOL = new BlockMineral(373, WOOL_TEX, 10); BlockRegistry.LIME_WOOL.name = "Lime Wool";
        BlockRegistry.PINK_WOOL = new BlockMineral(374, WOOL_TEX, 11); BlockRegistry.PINK_WOOL.name = "Pink Wool";
        BlockRegistry.GRAY_WOOL = new BlockMineral(375, WOOL_TEX, 6); BlockRegistry.GRAY_WOOL.name = "Gray Wool";
        BlockRegistry.LIGHT_GRAY_WOOL = new BlockMineral(376, WOOL_TEX, 13); BlockRegistry.LIGHT_GRAY_WOOL.name = "Light Gray Wool";
        BlockRegistry.CYAN_WOOL = new BlockMineral(377, WOOL_TEX, 3); BlockRegistry.CYAN_WOOL.name = "Cyan Wool";
        BlockRegistry.PURPLE_WOOL = new BlockMineral(378, WOOL_TEX, 8); BlockRegistry.PURPLE_WOOL.name = "Purple Wool"; // Note: Magenta/Purple mapped to same for now if ambiguous
        BlockRegistry.BLUE_WOOL = new BlockMineral(379, WOOL_TEX, 14); BlockRegistry.BLUE_WOOL.name = "Blue Wool";
        BlockRegistry.BROWN_WOOL = new BlockMineral(380, WOOL_TEX, 1); BlockRegistry.BROWN_WOOL.name = "Brown Wool";
        BlockRegistry.GREEN_WOOL = new BlockMineral(381, WOOL_TEX, 4); BlockRegistry.GREEN_WOOL.name = "Green Wool";
        BlockRegistry.RED_WOOL = new BlockMineral(382, WOOL_TEX, 12); BlockRegistry.RED_WOOL.name = "Red Wool";
        BlockRegistry.BLACK_WOOL = new BlockMineral(383, WOOL_TEX, 7); BlockRegistry.BLACK_WOOL.name = "Black Wool";

        [
            BlockRegistry.WHITE_WOOL, BlockRegistry.ORANGE_WOOL, BlockRegistry.MAGENTA_WOOL,
            BlockRegistry.LIGHT_BLUE_WOOL, BlockRegistry.YELLOW_WOOL, BlockRegistry.LIME_WOOL,
            BlockRegistry.PINK_WOOL, BlockRegistry.GRAY_WOOL, BlockRegistry.LIGHT_GRAY_WOOL,
            BlockRegistry.CYAN_WOOL, BlockRegistry.PURPLE_WOOL, BlockRegistry.BLUE_WOOL,
            BlockRegistry.BROWN_WOOL, BlockRegistry.GREEN_WOOL, BlockRegistry.RED_WOOL,
            BlockRegistry.BLACK_WOOL
        ].forEach(w => w.sound = Block.sounds.cloth);

        // Boats
        BlockRegistry.BOAT = new BlockBoatItem(333, 0, "../../items (1).png", 5); BlockRegistry.BOAT.name = "Oak Boat";
        BlockRegistry.BIRCH_BOAT = new BlockBoatItem(411, 1, "../../items (1).png", 7); BlockRegistry.BIRCH_BOAT.name = "Birch Boat";
        BlockRegistry.SPRUCE_BOAT = new BlockBoatItem(412, 2, "../../items (1).png", 6); BlockRegistry.SPRUCE_BOAT.name = "Spruce Boat";
        BlockRegistry.DARK_OAK_BOAT = new BlockBoatItem(424, 3, "../../items (1).png", 8); BlockRegistry.DARK_OAK_BOAT.name = "Dark Oak Boat";
        BlockRegistry.ACACIA_BOAT = new BlockBoatItem(425, 4, "../../items (1).png", 9); BlockRegistry.ACACIA_BOAT.name = "Acacia Boat";

        // Armor
        // Gold
        BlockRegistry.GOLD_HELMET = new BlockArmor(314, 0, "../../tools (1).png", 28); BlockRegistry.GOLD_HELMET.name = "Golden Helmet";
        BlockRegistry.GOLD_CHESTPLATE = new BlockArmor(315, 1, "../../tools (1).png", 31); BlockRegistry.GOLD_CHESTPLATE.name = "Golden Chestplate";
        BlockRegistry.GOLD_LEGGINGS = new BlockArmor(316, 2, "../../tools (1).png", 29); BlockRegistry.GOLD_LEGGINGS.name = "Golden Leggings";
        BlockRegistry.GOLD_BOOTS = new BlockArmor(317, 3, "../../tools (1).png", 32); BlockRegistry.GOLD_BOOTS.name = "Golden Boots";

        // Iron
        BlockRegistry.IRON_HELMET = new BlockArmor(306, 0, "../../tools (1).png", 27); BlockRegistry.IRON_HELMET.name = "Iron Helmet";
        BlockRegistry.IRON_CHESTPLATE = new BlockArmor(307, 1, "../../tools (1).png", 26); BlockRegistry.IRON_CHESTPLATE.name = "Iron Chestplate";
        BlockRegistry.IRON_LEGGINGS = new BlockArmor(308, 2, "../../tools (1).png", 35); BlockRegistry.IRON_LEGGINGS.name = "Iron Leggings";
        BlockRegistry.IRON_BOOTS = new BlockArmor(309, 3, "../../tools (1).png", 25); BlockRegistry.IRON_BOOTS.name = "Iron Boots";

        // End Dimension Blocks
        BlockRegistry.END_STONE = new BlockMineral(121, "../../endstuff.png", 5); 
        BlockRegistry.END_STONE.cols = 7; BlockRegistry.END_STONE.name = "End Stone";
        
        BlockRegistry.END_STONE_BRICKS = new BlockMineral(122, "../../endstuff.png", 6); 
        BlockRegistry.END_STONE_BRICKS.cols = 7; BlockRegistry.END_STONE_BRICKS.name = "End Stone Bricks";
        
        BlockRegistry.END_PORTAL_FRAME = new BlockEndPortalFrame(120); 
        BlockRegistry.END_PORTAL_FRAME.name = "End Portal Frame";

        BlockRegistry.ENDER_EYE = new BlockItem(360, "../../endstuff.png", 1); 
        BlockRegistry.ENDER_EYE.name = "Eye of Ender";

        // Diamond
        BlockRegistry.DIAMOND_HELMET = new BlockArmor(310, 0, "../../tools (1).png", 34); BlockRegistry.DIAMOND_HELMET.name = "Diamond Helmet";
        BlockRegistry.DIAMOND_CHESTPLATE = new BlockArmor(311, 1, "../../tools (1).png", 33); BlockRegistry.DIAMOND_CHESTPLATE.name = "Diamond Chestplate";
        BlockRegistry.DIAMOND_LEGGINGS = new BlockArmor(312, 2, "../../tools (1).png", 30); BlockRegistry.DIAMOND_LEGGINGS.name = "Diamond Leggings";
        BlockRegistry.DIAMOND_BOOTS = new BlockArmor(313, 3, "../../tools (1).png", 36); BlockRegistry.DIAMOND_BOOTS.name = "Diamond Boots";

        // Vertical Slabs (Creative/Commands Only)
        BlockRegistry.VERTICAL_OAK_SLAB = new BlockVerticalSlab(230, 8); BlockRegistry.VERTICAL_OAK_SLAB.name = "Vertical Oak Slab";
        BlockRegistry.VERTICAL_STONE_SLAB = new BlockVerticalSlab(231, 3); BlockRegistry.VERTICAL_STONE_SLAB.name = "Vertical Stone Slab";
        BlockRegistry.VERTICAL_COBBLE_SLAB = new BlockVerticalSlab(232, 4); BlockRegistry.VERTICAL_COBBLE_SLAB.name = "Vertical Cobblestone Slab";
        BlockRegistry.VERTICAL_BIRCH_SLAB = new BlockVerticalSlab(233, "../../treestuff.png", 19, 30); BlockRegistry.VERTICAL_BIRCH_SLAB.name = "Vertical Birch Slab";
        BlockRegistry.VERTICAL_SPRUCE_SLAB = new BlockVerticalSlab(234, "../../treestuff.png", 14, 30); BlockRegistry.VERTICAL_SPRUCE_SLAB.name = "Vertical Spruce Slab";

        BlockRegistry.MAGMA_BLOCK = new BlockMagma(236); BlockRegistry.MAGMA_BLOCK.name = "Magma Block";

        // Acacia
        BlockRegistry.ACACIA_SLAB = new BlockSlab(384, "../../treestuff.png", 24, 30); BlockRegistry.ACACIA_SLAB.name = "Acacia Slab";
        BlockRegistry.ACACIA_STAIRS = new BlockStairs(385, "../../treestuff.png", 24, 30); BlockRegistry.ACACIA_STAIRS.name = "Acacia Stairs";
        BlockRegistry.VERTICAL_ACACIA_SLAB = new BlockVerticalSlab(386, "../../treestuff.png", 24, 30); BlockRegistry.VERTICAL_ACACIA_SLAB.name = "Vertical Acacia Slab";
        BlockRegistry.ACACIA_FENCE = new BlockFence(387, 0, "../../treestuff.png", 24, 30); BlockRegistry.ACACIA_FENCE.name = "Acacia Fence";
        BlockRegistry.ACACIA_FENCE_GATE = new BlockFenceGate(429); BlockRegistry.ACACIA_FENCE_GATE.name = "Acacia Fence Gate";

        // Dark Oak
        BlockRegistry.DARK_OAK_SLAB = new BlockSlab(389, "../../treestuff.png", 29, 30); BlockRegistry.DARK_OAK_SLAB.name = "Dark Oak Slab";
        BlockRegistry.DARK_OAK_STAIRS = new BlockStairs(428, "../../treestuff.png", 29, 30); BlockRegistry.DARK_OAK_STAIRS.name = "Dark Oak Stairs";
        BlockRegistry.VERTICAL_DARK_OAK_SLAB = new BlockVerticalSlab(418, "../../treestuff.png", 29, 30); BlockRegistry.VERTICAL_DARK_OAK_SLAB.name = "Vertical Dark Oak Slab";
        BlockRegistry.DARK_OAK_FENCE = new BlockFence(419, 0, "../../treestuff.png", 29, 30); BlockRegistry.DARK_OAK_FENCE.name = "Dark Oak Fence";
        BlockRegistry.DARK_OAK_FENCE_GATE = new BlockFenceGate(446); BlockRegistry.DARK_OAK_FENCE_GATE.name = "Dark Oak Fence Gate";

        // Slabs and Stairs for Stones
        BlockRegistry.GRANITE_SLAB = new BlockSlab(184, "../../granite.png"); BlockRegistry.GRANITE_SLAB.name = "Granite Slab";
        BlockRegistry.GRANITE_STAIRS = new BlockStairs(185, "../../granite.png"); BlockRegistry.GRANITE_STAIRS.name = "Granite Stairs";
        BlockRegistry.DIORITE_SLAB = new BlockSlab(186, "../../diorite.png"); BlockRegistry.DIORITE_SLAB.name = "Diorite Slab";
        BlockRegistry.DIORITE_STAIRS = new BlockStairs(187, "../../diorite.png"); BlockRegistry.DIORITE_STAIRS.name = "Diorite Stairs";
        BlockRegistry.ANDESITE_SLAB = new BlockSlab(188, "../../andesite.png"); BlockRegistry.ANDESITE_SLAB.name = "Andesite Slab";
        BlockRegistry.ANDESITE_STAIRS = new BlockStairs(189, "../../andesite.png"); BlockRegistry.ANDESITE_STAIRS.name = "Andesite Stairs";

        // Stained Glass
        BlockRegistry.LIME_STAINED_GLASS = new BlockStainedGlass(237, 0); BlockRegistry.LIME_STAINED_GLASS.name = "Lime Stained Glass";
        BlockRegistry.GREEN_STAINED_GLASS = new BlockStainedGlass(238, 1); BlockRegistry.GREEN_STAINED_GLASS.name = "Green Stained Glass";
        BlockRegistry.PINK_STAINED_GLASS = new BlockStainedGlass(239, 2); BlockRegistry.PINK_STAINED_GLASS.name = "Pink Stained Glass";
        BlockRegistry.ORANGE_STAINED_GLASS = new BlockStainedGlass(240, 3); BlockRegistry.ORANGE_STAINED_GLASS.name = "Orange Stained Glass";
        BlockRegistry.CYAN_STAINED_GLASS = new BlockStainedGlass(241, 4); BlockRegistry.CYAN_STAINED_GLASS.name = "Cyan Stained Glass";
        BlockRegistry.WHITE_STAINED_GLASS = new BlockStainedGlass(242, 5); BlockRegistry.WHITE_STAINED_GLASS.name = "White Stained Glass";
        BlockRegistry.LIGHT_BLUE_STAINED_GLASS = new BlockStainedGlass(243, 6); BlockRegistry.LIGHT_BLUE_STAINED_GLASS.name = "Light Blue Stained Glass";
        BlockRegistry.MAGENTA_STAINED_GLASS = new BlockStainedGlass(244, 7); BlockRegistry.MAGENTA_STAINED_GLASS.name = "Magenta Stained Glass";
        BlockRegistry.YELLOW_STAINED_GLASS = new BlockStainedGlass(245, 8); BlockRegistry.YELLOW_STAINED_GLASS.name = "Yellow Stained Glass";
        BlockRegistry.GRAY_STAINED_GLASS = new BlockStainedGlass(246, 9); BlockRegistry.GRAY_STAINED_GLASS.name = "Gray Stained Glass";
        BlockRegistry.BLACK_STAINED_GLASS = new BlockStainedGlass(247, 10); BlockRegistry.BLACK_STAINED_GLASS.name = "Black Stained Glass";
        BlockRegistry.BLUE_STAINED_GLASS = new BlockStainedGlass(248, 11); BlockRegistry.BLUE_STAINED_GLASS.name = "Blue Stained Glass";
        BlockRegistry.BROWN_STAINED_GLASS = new BlockStainedGlass(249, 12); BlockRegistry.BROWN_STAINED_GLASS.name = "Brown Stained Glass";
        BlockRegistry.LIGHT_GRAY_STAINED_GLASS = new BlockStainedGlass(250, 13); BlockRegistry.LIGHT_GRAY_STAINED_GLASS.name = "Light Gray Stained Glass";
        
        // Trapdoors (1: birch, 2: dark_oak, 3: oak, 4: spruce, 5: acacia, 6: iron)
        BlockRegistry.BIRCH_TRAPDOOR = new BlockTrapdoor(224, 0); BlockRegistry.BIRCH_TRAPDOOR.name = "Birch Trapdoor";
        BlockRegistry.DARK_OAK_TRAPDOOR = new BlockTrapdoor(225, 1); BlockRegistry.DARK_OAK_TRAPDOOR.name = "Dark Oak Trapdoor";
        BlockRegistry.OAK_TRAPDOOR = new BlockTrapdoor(96, 2); BlockRegistry.OAK_TRAPDOOR.name = "Oak Trapdoor";
        BlockRegistry.SPRUCE_TRAPDOOR = new BlockTrapdoor(226, 3); BlockRegistry.SPRUCE_TRAPDOOR.name = "Spruce Trapdoor";
        BlockRegistry.ACACIA_TRAPDOOR = new BlockTrapdoor(227, 4); BlockRegistry.ACACIA_TRAPDOOR.name = "Acacia Trapdoor";
        BlockRegistry.IRON_TRAPDOOR = new BlockTrapdoor(228, 5); BlockRegistry.IRON_TRAPDOOR.name = "Iron Trapdoor";

        BlockRegistry.MOB_SPAWNER = new BlockSpawner(52); BlockRegistry.MOB_SPAWNER.name = "Mob Spawner";

        // End Dimension Blocks
        BlockRegistry.END_STONE = new BlockMineral(121, "../../endstuff.png", 5); 
        BlockRegistry.END_STONE.cols = 7; BlockRegistry.END_STONE.name = "End Stone";
        
        BlockRegistry.END_STONE_BRICKS = new BlockMineral(122, "../../endstuff.png", 6); 
        BlockRegistry.END_STONE_BRICKS.cols = 7; BlockRegistry.END_STONE_BRICKS.name = "End Stone Bricks";
        
        BlockRegistry.END_PORTAL_FRAME = new BlockEndPortalFrame(120); 
        BlockRegistry.END_PORTAL_FRAME.name = "End Portal Frame";

        // Signs (Mapped to safe ID range 481-493)
        BlockRegistry.OAK_SIGN_BLOCK = new BlockSign(63, 0);
        BlockRegistry.OAK_WALL_SIGN = new BlockWallSign(68, 0);
        BlockRegistry.OAK_SIGN = new BlockSignItem(481, 0); BlockRegistry.OAK_SIGN.name = "Oak Sign";
        
        BlockRegistry.BIRCH_SIGN_BLOCK = new BlockSign(484, 1);
        BlockRegistry.BIRCH_WALL_SIGN = new BlockWallSign(488, 1);
        BlockRegistry.BIRCH_SIGN = new BlockSignItem(482, 1); BlockRegistry.BIRCH_SIGN.name = "Birch Sign";

        BlockRegistry.SPRUCE_SIGN_BLOCK = new BlockSign(485, 2);
        BlockRegistry.SPRUCE_WALL_SIGN = new BlockWallSign(489, 2);
        BlockRegistry.SPRUCE_SIGN = new BlockSignItem(483, 2); BlockRegistry.SPRUCE_SIGN.name = "Spruce Sign";

        BlockRegistry.ACACIA_SIGN_BLOCK = new BlockSign(486, 3);
        BlockRegistry.ACACIA_WALL_SIGN = new BlockWallSign(490, 3);
        BlockRegistry.ACACIA_SIGN = new BlockSignItem(492, 3); BlockRegistry.ACACIA_SIGN.name = "Acacia Sign";

        BlockRegistry.DARK_OAK_SIGN_BLOCK = new BlockSign(487, 4);
        BlockRegistry.DARK_OAK_WALL_SIGN = new BlockWallSign(491, 4);
        BlockRegistry.DARK_OAK_SIGN = new BlockSignItem(493, 4); BlockRegistry.DARK_OAK_SIGN.name = "Dark Oak Sign";

        BlockRegistry.SLIME_BALL = new BlockItem(496, "../../slimestuff.png", 0);
        BlockRegistry.SLIME_BALL.cols = 2; BlockRegistry.SLIME_BALL.name = "Slime Ball";
        BlockRegistry.SLIME_BLOCK = new BlockSlime(165); // ID 165 is standard for Slime Block
        BlockRegistry.NOTE_BLOCK = new BlockNote(25); BlockRegistry.NOTE_BLOCK.name = "Note Block";
        BlockRegistry.JUKEBOX = new BlockJukebox(84); BlockRegistry.JUKEBOX.name = "Jukebox";

        BlockRegistry.ANVIL = new BlockAnvil(167); BlockRegistry.ANVIL.name = "Anvil";

        // Pistons
        BlockRegistry.PISTON = new BlockPistonBase(29, false);
        BlockRegistry.PISTON.name = "Piston";
        BlockRegistry.STICKY_PISTON = new BlockPistonBase(30, true);
        BlockRegistry.STICKY_PISTON.name = "Sticky Piston";
        BlockRegistry.PISTON_HEAD = new BlockPistonHead(332); 
        BlockRegistry.PISTON_HEAD.name = "Piston Head";

        BlockRegistry.OBSERVER = new BlockObserver(161);
        BlockRegistry.OBSERVER.name = "Observer";

        BlockRegistry.SKELETON_HEAD = new BlockMobHead(168, "skeleton");
        BlockRegistry.ZOMBIE_HEAD = new BlockMobHead(169, "zombie");
        BlockRegistry.CREEPER_HEAD = new BlockMobHead(171, "creeper");
        BlockRegistry.ENDERMAN_HEAD = new BlockMobHead(172, "enderman");

        // New Blocks from newblocksset1.png
        BlockRegistry.SPONGE = new BlockSponge(560, false);
        BlockRegistry.WET_SPONGE = new BlockSponge(561, true);
        BlockRegistry.POLISHED_ANDESITE = new BlockMineral(562, "../../newblocksset1.png", 2);
        BlockRegistry.POLISHED_ANDESITE.cols = 9; BlockRegistry.POLISHED_ANDESITE.name = "Polished Andesite";
        BlockRegistry.POLISHED_DIORITE = new BlockMineral(563, "../../newblocksset1.png", 3);
        BlockRegistry.POLISHED_DIORITE.cols = 9; BlockRegistry.POLISHED_DIORITE.name = "Polished Diorite";
        BlockRegistry.POLISHED_GRANITE = new BlockMineral(564, "../../newblocksset1.png", 4);
        BlockRegistry.POLISHED_GRANITE.cols = 9; BlockRegistry.POLISHED_GRANITE.name = "Polished Granite";
        
        BlockRegistry.IRON_BARS = new BlockIronBars(565);
        BlockRegistry.IRON_BARS.name = "Iron Bars";
        
        BlockRegistry.GRASS_PATH = new BlockGrassPath(566); BlockRegistry.GRASS_PATH.name = "Grass Path";
        BlockRegistry.LILY_PAD = new BlockLilyPad(567); BlockRegistry.LILY_PAD.name = "Lily Pad";

        // Tech Blocks
        for (let i = 0; i <= 15; i++) {
            const id = 800 + i;
            BlockRegistry["LIGHT_" + i] = new BlockLight(id, i);
        }
        BlockRegistry.BARRIER = new BlockBarrier(816);

        // Music Discs
        BlockRegistry.DISC_11 = new BlockMusicDisc(2200, 0, "11", "music.disc.11");
        BlockRegistry.DISC_13 = new BlockMusicDisc(2201, 1, "13", "music.disc.13");
        BlockRegistry.DISC_BLOCKS = new BlockMusicDisc(2202, 2, "Blocks", "music.disc.blocks");
        BlockRegistry.DISC_CAT = new BlockMusicDisc(2203, 3, "Cat", "music.disc.cat");
        BlockRegistry.DISC_CHIRP = new BlockMusicDisc(2204, 4, "Chirp", "music.disc.chirp");
        BlockRegistry.DISC_FAR = new BlockMusicDisc(2205, 5, "Far", "music.disc.far");
        BlockRegistry.DISC_MALL = new BlockMusicDisc(2206, 6, "Mall", "music.disc.mall");
        BlockRegistry.DISC_MELLOHI = new BlockMusicDisc(2207, 7, "Mellohi", "music.disc.mellohi");
        BlockRegistry.DISC_STAL = new BlockMusicDisc(2208, 8, "Stal", "music.disc.stal");
        BlockRegistry.DISC_STRAD = new BlockMusicDisc(2209, 9, "Strad", "music.disc.strad");
        BlockRegistry.DISC_WAIT = new BlockMusicDisc(2210, 10, "Wait", "music.disc.wait");
        BlockRegistry.DISC_WARD = new BlockMusicDisc(2211, 11, "Ward", "music.disc.ward");

        // Potions & Bottles
        BlockRegistry.GLASS_BOTTLE = new BlockPotion(550, 1, "Glass Bottle");
        
        BlockRegistry.WATER_BOTTLE = new BlockPotion(551, 1, "Water Bottle");
        BlockRegistry.WATER_BOTTLE.overlayName = "../../bottles.png";
        BlockRegistry.WATER_BOTTLE.overlayIndex = 2;
        BlockRegistry.WATER_BOTTLE.overlayColor = 0x385dc6; // Classic Blue

        BlockRegistry.SPLASH_POTION = new BlockPotion(552, 0, "Splash Potion", true);
        BlockRegistry.SPLASH_POTION.overlayName = "../../bottles.png";
        BlockRegistry.SPLASH_POTION.overlayIndex = 2;
        BlockRegistry.SPLASH_POTION.overlayColor = 0xAA00FF; // Classic Purple

        // --- NEW POTIONS REGISTRATION ---
        const effectList = [
            { id: "regeneration", name: "Regeneration", color: 0xcd5cab },
            { id: "speed", name: "Swiftness", color: 0x7cafc6 },
            { id: "fire_resistance", name: "Fire Resistance", color: 0xe49a3a },
            { id: "instant_health", name: "Healing", color: 0xf82423, instant: true },
            { id: "night_vision", name: "Night Vision", color: 0x1f1fa1 },
            { id: "strength", name: "Strength", color: 0x932423 },
            { id: "jump_boost", name: "Leaping", color: 0x22ee4c },
            { id: "water_breathing", name: "Water Breathing", color: 0x2e5299 },
            { id: "invisibility", name: "Invisibility", color: 0x7f8392 },
            { id: "poison", name: "Poison", color: 0x4e9331 },
            { id: "weakness", name: "Weakness", color: 0x484d48 },
            { id: "slowness", name: "Slowness", color: 0x5a6c81 },
            { id: "instant_damage", name: "Harming", color: 0x430a09, instant: true }
        ];

        let baseId = 600;
        let splashBaseId = 700;

        effectList.forEach((effect, effectIdx) => {
            for (let tier = 1; tier <= 3; tier++) {
                const suffix = tier > 1 ? " " + "I".repeat(tier) : "";
                const duration = effect.instant ? 1 : (tier === 1 ? 3600 : (tier === 2 ? 1800 : 900));
                
                // 1. Regular Potion
                const pId = baseId + effectIdx * 3 + (tier - 1);
                const pot = new BlockPotion(pId, 1, "Potion of " + effect.name + suffix);
                pot.overlayName = "../../bottles.png";
                pot.overlayIndex = 2;
                pot.overlayColor = effect.color;
                pot.potionEffect = { name: effect.id, duration: duration, amplifier: tier - 1, isInstant: !!effect.instant };
                BlockRegistry["POTION_" + effect.id.toUpperCase() + "_" + tier] = pot;

                // 2. Splash Potion
                const sId = splashBaseId + effectIdx * 3 + (tier - 1);
                const spot = new BlockPotion(sId, 0, "Splash Potion of " + effect.name + suffix, true);
                spot.overlayName = "../../bottles.png";
                spot.overlayIndex = 2;
                spot.overlayColor = effect.color;
                spot.potionEffect = pot.potionEffect;
                BlockRegistry["SPLASH_POTION_" + effect.id.toUpperCase() + "_" + tier] = spot;
            }
        });

        // --- ENCHANTED BOOKS REGISTRATION ---
        const enchants = [
            { id: "sharpness", name: "Sharpness", max: 5 },
            { id: "smite", name: "Smite", max: 5 },
            { id: "bane_of_arthropods", name: "Bane of Arthropods", max: 5 },
            { id: "knockback", name: "Knockback", max: 2 },
            { id: "fire_aspect", name: "Fire Aspect", max: 2 },
            { id: "looting", name: "Looting", max: 3 },
            { id: "unbreaking", name: "Unbreaking", max: 3 },
            { id: "power", name: "Power", max: 5 },
            { id: "punch", name: "Punch", max: 2 },
            { id: "flame", name: "Flame", max: 1 },
            { id: "infinity", name: "Infinity", max: 1 },
            { id: "quick_charge", name: "Quick Charge", max: 3 },
            { id: "piercing", name: "Piercing", max: 4 },
            { id: "multishot", name: "Multishot", max: 1 },
            { id: "protection", name: "Protection", max: 4 },
            { id: "fire_protection", name: "Fire Protection", max: 4 },
            { id: "blast_protection", name: "Blast Protection", max: 4 },
            { id: "projectile_protection", name: "Projectile Protection", max: 4 },
            { id: "thorns", name: "Thorns", max: 3 },
            { id: "feather_falling", name: "Feather Falling", max: 4 },
            { id: "depth_strider", name: "Depth Strider", max: 3 },
            { id: "frost_walker", name: "Frost Walker", max: 2 },
            { id: "efficiency", name: "Efficiency", max: 5 },
            { id: "silk_touch", name: "Silk Touch", max: 1 },
            { id: "fortune", name: "Fortune", max: 3 },
            { id: "luck_of_the_sea", name: "Luck of the Sea", max: 3 },
            { id: "lure", name: "Lure", max: 3 }
        ];

        const getRoman = (num) => {
            const lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
            let roman = '';
            for (let i in lookup) {
                while (num >= lookup[i]) {
                    roman += i;
                    num -= lookup[i];
                }
            }
            return roman;
        };

        let bookBaseId = 3000;
        enchants.forEach((ench, idx) => {
            for (let lv = 1; lv <= ench.max; lv++) {
                const bookId = bookBaseId + idx * 5 + (lv - 1);
                const suffix = " " + getRoman(lv);
                const book = new BlockEnchantedBook(bookId, ench.name + suffix, { [ench.id]: lv });
                BlockRegistry["ENCHANTED_BOOK_" + ench.id.toUpperCase() + "_" + lv] = book;
            }
        });

        // Carpets (IDs 500-515)
        const woolMap = [
            { id: 500, name: "White", tex: 0 },
            { id: 501, name: "Orange", tex: 5 },
            { id: 502, name: "Magenta", tex: 8 },
            { id: 503, name: "Light Blue", tex: 2 },
            { id: 504, name: "Yellow", tex: 9 },
            { id: 505, name: "Lime", tex: 10 },
            { id: 506, name: "Pink", tex: 11 },
            { id: 507, name: "Gray", tex: 6 },
            { id: 508, name: "Light Gray", tex: 13 },
            { id: 509, name: "Cyan", tex: 3 },
            { id: 510, name: "Purple", tex: 8 },
            { id: 511, name: "Blue", tex: 14 },
            { id: 512, name: "Brown", tex: 1 },
            { id: 513, name: "Green", tex: 4 },
            { id: 514, name: "Red", tex: 12 },
            { id: 515, name: "Black", tex: 7 }
        ];

        woolMap.forEach(w => {
            const key = w.name.toUpperCase() + "_CARPET";
            BlockRegistry[key] = new BlockCarpet(w.id, w.tex);
            BlockRegistry[key].name = w.name + " Carpet";
        });

        // Bone Block
        BlockRegistry.BONE_BLOCK = new BlockLog(572, "../../random stuff.png", 2, 3, 9);
        BlockRegistry.BONE_BLOCK.name = "Bone Block";

        // Dropper
        BlockRegistry.DROPPER = new BlockDropper(573);

        // Cobweb
        BlockRegistry.COBWEB = new BlockCobweb(571);

        // Sweet Berries
        BlockRegistry.SWEET_BERRIES = new BlockItem(570, "../../random stuff.png", 0);
        BlockRegistry.SWEET_BERRIES.cols = 9;
        BlockRegistry.SWEET_BERRIES.name = "Sweet Berries";
        BlockRegistry.SWEET_BERRIES.isFood = true;
        BlockRegistry.SWEET_BERRIES.hungerValue = 2;
        BlockRegistry.SWEET_BERRIES.onItemUse = (world, x, y, z, face, player) => {
            if (face.y === 1 && world.getBlockAt(x, y + 1, z) === 0) {
                // Planting starts at stage 1 as requested (index 6 in the 9-column sheet)
                world.setBlockAt(x, y + 1, z, 574, 1);
                if (player.gameMode !== 1) player.inventory.consumeItem(570);
                player.swingArm();
                world.minecraft.soundManager.playSound("step.grass", x+0.5, y+1.5, z+0.5, 1, 1);
                // Trigger an immediate visual refresh
                if (world.minecraft && world.minecraft.worldRenderer) world.minecraft.worldRenderer.flushRebuild = true;
                return true;
            }
            return false;
        };

        // Sweet Berry Bush
        BlockRegistry.SWEET_BERRY_BUSH = new BlockSweetBerryBush(574);

        // Keep all food behavior driven by one shared table. This also makes
        // food items that are not in the legacy hard-coded lists edible.
        for (const [id, stats] of Object.entries(FOOD_STATS)) {
            const food = Block.getById(Number(id));
            if (food) {
                food.isFood = true;
                food.hungerValue = stats.hunger;
                food.saturation = stats.saturation;
            }
        }

        // Link slabs to full blocks AFTER all blocks are defined
        BlockSlab.setLinks(BlockRegistry);
    }

    static registerModBlock(id, name, textureKey, hardness, soundType = "stone", props = {}) {
        const modBlock = new BlockMineral(id, textureKey);
        modBlock.name = name;
        
        switch(soundType.toLowerCase()) {
            case "wood": modBlock.sound = Block.sounds.wood; break;
            case "grass": modBlock.sound = Block.sounds.grass; break;
            case "sand": modBlock.sound = Block.sounds.sand; break;
            case "stone": 
            default: modBlock.sound = Block.sounds.stone; break;
        }

        // Apply custom properties
        if (props.gravity) {
            if (!Block.gravityIds) Block.gravityIds = new Set();
            Block.gravityIds.add(id);
        }
        modBlock.lightValue = props.light || 0;
        modBlock.damageOnStand = props.damage || 0;
        
        // New Modding Toggles
        modBlock.isFoliage = !!props.foliage;
        modBlock.isClimbable = !!props.climbable;
        modBlock.isContainer = !!props.container;
        modBlock.containerName = props.containerName || name;
        modBlock.isFood = !!props.food;
        modBlock.hungerValue = props.hunger || 0;

        // Custom multi-textures
        if (props.textures) {
            modBlock.customTextures.top = props.textures.top;
            modBlock.customTextures.bottom = props.textures.bottom;
            modBlock.customTextures.side = props.textures.side;
        }

        BlockRegistry[name.toUpperCase().replace(/\s+/g, '_')] = modBlock;
        return modBlock;
    }

    static registerModItem(id, name, textureKey, props = {}) {
        const modItem = new BlockItem(id, textureKey);
        modItem.name = name;
        modItem.maxStackSize = props.stackSize || 64;
        modItem.maxDamage = props.durability || 0;
        modItem.attackDamage = props.damage || 1;
        modItem.isThrowable = !!props.throwable;
        modItem.onThrowCommand = props.onThrow;

        BlockRegistry[name.toUpperCase().replace(/\s+/g, '_')] = modItem;
        return modItem;
    }
}
