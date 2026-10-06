import EnumBlockFace from "../../util/EnumBlockFace.js";
import BlockRenderType from "../../util/BlockRenderType.js";
import Tessellator from "./Tessellator.js";
import MathHelper from "../../util/MathHelper.js";
import Block from "../world/block/Block.js";
import * as THREE from "../../../../../../libraries/three.module.js";
import ToolRenderer from "./ToolRenderer.js";
import LiquidRenderer from "./block/LiquidRenderer.js";
import DoorRenderer from "./block/DoorRenderer.js";
import { BlockRegistry } from "../world/block/BlockRegistry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class BlockRenderer {

    constructor(worldRenderer) {
        this.worldRenderer = worldRenderer;
        this.tessellator = new Tessellator();
        this.tessellator.bindTexture(worldRenderer.textureTerrain);

        this.foliageTessellator = new Tessellator();
        this.foliageTessellator.material.side = THREE.DoubleSide;
        this.foliageTessellator.material.alphaTest = 0.1;

        this.craftingTableTessellator = new Tessellator();
        this.doorTessellator = new Tessellator();
        this.doorTessellator.material.side = THREE.DoubleSide; // Fix visibility from both sides
        this.doorTessellator.material.alphaTest = 0.1;

        // Chest tessellator for 3-frame chest spritesheet (front / sides / top)
        this.chestTessellator = new Tessellator();
        this.chestTessellator.material.side = THREE.DoubleSide;
        this.chestTessellator.material.alphaTest = 0.1;

        this.furnaceTessellator = new Tessellator();

        // Glint Tessellators
        this.glintTessellator1 = new Tessellator();
        this.glintTessellator1.setupGlint(worldRenderer.glintMatrix1, worldRenderer.textureGlint);
        
        this.glintTessellator2 = new Tessellator();
        this.glintTessellator2.setupGlint(worldRenderer.glintMatrix2, worldRenderer.textureGlint);

        // Fire tessellator
        this.fireTessellator = new Tessellator();
        this.fireTessellator.material.side = THREE.DoubleSide;
        this.fireTessellator.material.alphaTest = 0.1;
        this.fireTessellator.material.transparent = true;

        // Portal tessellator
        this.portalTessellator = new Tessellator();
        this.portalTessellator.material.side = THREE.DoubleSide;
        this.portalTessellator.material.alphaTest = 0.1;
        this.portalTessellator.material.transparent = true;
        this.portalTessellator.material.depthWrite = false; // Translucent
        this.portalTessellator.material.opacity = 0.75;
        if (this.worldRenderer.texturePortal) {
            this.portalTessellator.bindTexture(this.worldRenderer.texturePortal);
        }

        // Tessellators for single-texture blocks (minerals)
        this.textureTessellators = new Map();
        [
            "../../bottles.png",
            "../../tools (1).png",
            "../../items (1).png",
            "../../orestuff.png",
            "../../bowpull1.png",
            "../../bowpull2.png",
            "../../bowpull3.png",
            "../../bowidle.png",
            "../../fishing_rod.png",
            "../../fishing_rod_cast.png",
            // TNT Textures
            "../../tnt_top.png",
            "../../tnt_bottom.png",
            "../../tnt_side.png",
            "../../sandstone_top.png",
            "../../sandstone_bottom.png",
            "../../gravel.png", 
            "../../clay.png", 
            "../../bricks.png", 
            "../../smooth_stone.png", 
            "../../stone_bricks.png", 
            "../../bookshelf.png",
            "../../spawner.png",
            "../../structure_block (6).png",
            "../../commandblock.png",
            "../../command_block_front.png",
            "../../command_block_back.png",
            "../../command_block_side.png",
            "../../command_block_conditional.png",
            "../../dispenser_front.png",
            "../../lever.png",
            "../../stonesheet.png",
            "../../trapdoorsheet.png",
            "../../All doors.png",
            "../../endstuff.png",
            "../../paintingfront1by1.png", 
            "../../1x1painting2.webp",
            "../../1x1painting3.png",
            "../../paintingback.png", 
            "../../snowygrassblockside.png", 
            "../../snowygrassblocktop.png", 
            "../../snow.png", 
            "../../ice.png", 
            "../../packedice.png",
            "../../ladder.png", // Add ladder texture to pre-initialized tessellators
            "../../water_flow (4).png", // Water texture
            "../../lava (4).png", // Lava texture
            "../../nether.png", // Nether texture
            "../../fire_1.png", // Fire texture
            "../../farmland.png", // Farmland Texture
            "../../farmland_moist.png",
            "../../redstone_lamp.png",
            "../../redstone_lamp_on.png", // Added
            "../../magma3sheet.png",
            "../../quartz.png",
            "../../coloredglass.png",
            "../../food.png",
            "../../farming.png",
            "../../mycelium_top.png",
            "../../mycelium_side.png",
            "../../mushroom_stem.png",
            "../../brown_mushroom_block.png",
            "../../red_mushroom_block.png",
            "../../granite.png",
            "../../diorite.png",
            "../../andesite.png",
            "redstone_dot", // Separate tessellators for redstone components
            "redstone_line",
            // Foliage textures requiring DoubleSide
            "../../grasslandfoliage.png",
            "../../dead_bush.png",
            "../../sugar_cane.png",
            "../../deadandsugar.png.png",
            "../../oaksapling.png",
            "../../terracottahseet.png",
            // Wheat stages
            "../../wheat_stage0.png",
            "../../wheat_stage1.png",
            "../../wheat_stage2.png",
            "../../wheat_stage3.png",
            "../../wheat_stage4.png",
            "../../wheat_stage5.png",
            "../../wheat_stage6.png",
            "../../wheat_stage7.png",
            // Carrot stages
            "../../carrots_stage0.png",
            "../../carrots_stage1.png",
            "../../carrots_stage2.png",
            "../../carrots_stage3.png",
            // Potato stages
            "../../potatoes_stage0.png",
            "../../potatoes_stage1.png",
            "../../potatoes_stage2.png",
            "../../potatoes_stage3.png",
            // Sandstone
            "../../sandstoneside.png",
            "../../sandstone_top.png",
            "../../sandstone_bottom.png",
            "../../birch_log.png",
            "../../birch_log_top.png",
            "../../birch_planks.png",
            "../../birch_sapling.png",
            "../../bed.png",
            "../../red_mushroom.png",
            "../../brown_mushroom.png",
            "../../rail.png",
            "../../curvedrail.png",
            "../../hay_block_top.png",
            "../../hay_block_side.png",
            "../../oak_leaves.png",
            "../../birch_leaves.png",
            "../../sprucelog.png",
            "../../spruceplanks.png",
            "../../sprucesaplings.png",
            "../../spruceleave.png",
            "../../tall_grass_bottom.png",
            "../../tall_grass_top.png",
            "../../foliage.png",
            "../../white_tulip.png",
            "../../lily_of_the_valley.png",
            "../../wools.png",
            "../../treestuff.png",
            "../../sandstuff.png",
            "../../desert (1).png",
            "../../food2.png",
            "../../beetroot (1).png",
            "../../dicsandbox (1).png",
            "../../anvil_top.png",
            "../../anvil.png",
            "../../newblocksset1.png",
            "../../random stuff.png"
        ].forEach(name => {
            let t = new Tessellator();
            // Configure double side for foliage/transparent textures and Lava
            if (name.includes("farming") || name.includes("foliage") || name.includes("sapling") || name.includes("deadandsugar") || name.includes("lava") || name.includes("water") || name.includes("wheat") || name.includes("carrots") || name.includes("potatoes") || name.includes("redstone") || name.includes("tnt_") || name.includes("bed") || name.includes("leaves") || name.includes("doors") || name.includes("magma") || name.includes("glass") || name.includes("coloredglass") || name.includes("grass") || name.includes("spawner") || name.includes("bottles")) {
                t.material.side = THREE.DoubleSide;
                t.material.alphaTest = 0.1;
            }
            if (name.includes("leave") || name.includes("leaves")) {
                t.isLeafTessellator = true;
            }
            this.textureTessellators.set(name, t);
        });

        this.toolRenderer = new ToolRenderer(worldRenderer);
        this.liquidRenderer = new LiquidRenderer(this);
        this.doorRenderer = new DoorRenderer(this);

        this.bedModel = null;
        this.skeletonHeadModel = null;
        this.zombieHeadModel = null;
        this.creeperHeadModel = null;
        this.endermanHeadModel = null;
        this.loader = new GLTFLoader();
        
        // Load Bed Model
        this.loader.load('./bed (2).gltf', (gltf) => {
            this.bedModel = gltf.scene;
            this.bedModel.traverse(child => {
                if (child.isMesh) {
                    // Fix texture encoding and filtering to match Minecraft style (pixelated, linear color)
                    if (child.material.map) {
                        child.material.map.encoding = THREE.LinearEncoding;
                        child.material.map.magFilter = THREE.NearestFilter;
                        child.material.map.minFilter = THREE.NearestFilter;
                    }

                    child.material = new THREE.MeshBasicMaterial({
                        map: child.material.map,
                        color: 0xffffff,
                        side: THREE.DoubleSide,
                        alphaTest: 0.5,
                        vertexColors: false
                    });
                }
            });
        });

        // Load Skeleton Model for the Head Block
        this.loader.load('./skelton.gltf', (gltf) => {
            gltf.scene.traverse(child => {
                if (child.name && child.name.toLowerCase().includes("head") && child.isMesh) {
                    this.skeletonHeadModel = child.clone();
                    if (this.skeletonHeadModel.material.map) {
                        this.skeletonHeadModel.material.map.magFilter = THREE.NearestFilter;
                        this.skeletonHeadModel.material.map.minFilter = THREE.NearestFilter;
                        this.skeletonHeadModel.material.map.encoding = THREE.LinearEncoding;
                    }
                    this.skeletonHeadModel.material = new THREE.MeshBasicMaterial({
                        map: this.skeletonHeadModel.material.map,
                        color: 0xffffff,
                        side: THREE.DoubleSide,
                        alphaTest: 0.5,
                        vertexColors: false
                    });
                }
            });
        });

        // Load Zombie Model for the Head Block
        this.loader.load('./zombie (3).gltf', (gltf) => {
            gltf.scene.traverse(child => {
                if (child.name && child.name.toLowerCase().includes("head") && child.isMesh) {
                    this.zombieHeadModel = child.clone();
                    if (this.zombieHeadModel.material.map) {
                        this.zombieHeadModel.material.map.magFilter = THREE.NearestFilter;
                        this.zombieHeadModel.material.map.minFilter = THREE.NearestFilter;
                        this.zombieHeadModel.material.map.encoding = THREE.LinearEncoding;
                    }
                    this.zombieHeadModel.material = new THREE.MeshBasicMaterial({
                        map: this.zombieHeadModel.material.map,
                        color: 0xffffff,
                        side: THREE.DoubleSide,
                        alphaTest: 0.5,
                        vertexColors: false
                    });
                }
            });
        });

        // Load Creeper Model for the Head Block
        this.loader.load('./creeperr.gltf', (gltf) => {
            gltf.scene.traverse(child => {
                if (child.name && child.name.toLowerCase().includes("head") && child.isMesh) {
                    this.creeperHeadModel = child.clone();
                    if (this.creeperHeadModel.material.map) {
                        this.creeperHeadModel.material.map.magFilter = THREE.NearestFilter;
                        this.creeperHeadModel.material.map.minFilter = THREE.NearestFilter;
                        this.creeperHeadModel.material.map.encoding = THREE.LinearEncoding;
                    }
                    this.creeperHeadModel.material = new THREE.MeshBasicMaterial({
                        map: this.creeperHeadModel.material.map,
                        color: 0xffffff,
                        side: THREE.DoubleSide,
                        alphaTest: 0.5,
                        vertexColors: false
                    });
                }
            });
        });

        // Load Enderman Model for the Head Block
        this.loader.load('./enderman.gltf', (gltf) => {
            gltf.scene.traverse(child => {
                // Enderman head is usually named "head"
                if (child.name && child.name.toLowerCase().includes("head") && child.isMesh) {
                    this.endermanHeadModel = child.clone();
                    if (this.endermanHeadModel.material.map) {
                        this.endermanHeadModel.material.map.magFilter = THREE.NearestFilter;
                        this.endermanHeadModel.material.map.minFilter = THREE.NearestFilter;
                        this.endermanHeadModel.material.map.encoding = THREE.LinearEncoding;
                    }
                    this.endermanHeadModel.material = new THREE.MeshBasicMaterial({
                        map: this.endermanHeadModel.material.map,
                        color: 0xffffff,
                        side: THREE.DoubleSide,
                        alphaTest: 0.5,
                        vertexColors: false
                    });
                }
            });
        });
    }

    transformAndAdd(sourceTess, targetTess, tx, ty, tz, rx, ry, rz) {
        // Simple manual rotation matrix application
        // We only really need rotation around Y for ladders usually, but support basic Euler
        
        // Precompute rotation trig
        const cosX = Math.cos(rx), sinX = Math.sin(rx);
        const cosY = Math.cos(ry), sinY = Math.sin(ry);
        const cosZ = Math.cos(rz), sinZ = Math.sin(rz);

        // Iterate vertices (x, y, z)
        for (let i = 0; i < sourceTess.addedVertices; i++) {
            let x = sourceTess.vertices[i * 3];
            let y = sourceTess.vertices[i * 3 + 1];
            let z = sourceTess.vertices[i * 3 + 2];

            // Rotate Y
            let x1 = x * cosY - z * sinY;
            let z1 = x * sinY + z * cosY;
            let y1 = y;

            // Rotate X
            let y2 = y1 * cosX - z1 * sinX;
            let z2 = y1 * sinX + z1 * cosX;
            let x2 = x1;

            // Rotate Z
            let x3 = x2 * cosZ - y2 * sinZ;
            let y3 = x2 * sinZ + y2 * cosZ;
            let z3 = z2;

            // Translate
            let xFinal = x3 + tx;
            let yFinal = y3 + ty;
            let zFinal = z3 + tz;

            // Add to target
            targetTess.addVertexWithUV(
                xFinal, yFinal, zFinal,
                sourceTess.uv[i * 2], 
                sourceTess.uv[i * 2 + 1]
            );
            
            // Copy color (ToolRenderer usually sets one color, but we should copy per vertex if present)
            // Tessellator stores colors linearly r,g,b,a
            let ci = i * 4;
            targetTess.setColor(
                sourceTess.colors[ci], 
                sourceTess.colors[ci + 1], 
                sourceTess.colors[ci + 2], 
                sourceTess.colors[ci + 3]
            );
        }
    }

    renderBlock(world, block, ambientOcclusion, x, y, z, useLOD = false, distSq = 0, group = null, brightness = 1.0, force3D = false, tag = null) {
        // Fix: Use new spritesheet for specialized blocks
        const id = block.getId();
        if (id === 573) { // Dropper
            this.renderDropper(world, block, ambientOcclusion, x, y, z);
            return;
        }

        // Enchantment Glint Logic
        // Check if we are already in a glint pass to avoid infinite recursion
        const isGlintPass = (this.tessellator === this.glintTessellator1 || this.tessellator === this.glintTessellator2);
        
        let isEnchanted = false;
        if (!isGlintPass) {
            const forced = this.worldRenderer.minecraft.devTools.glint.forced && group !== null && !world;
            isEnchanted = block.isEnchanted || (tag && tag.enchanted) || forced;
            
            // Optimization: Only check tile entities for block types that actually support them
            // This drastically reduces Map lookups during massive chunk rebuilds
            if (!isEnchanted && world && (block.isContainer || block.getRenderType() === BlockRenderType.COMMAND_BLOCK || block.getRenderType() === BlockRenderType.JUKEBOX)) {
                const te = world.getTileEntity(x, y, z);
                if (te && te.enchanted) isEnchanted = true;
            }
        }

        if (isEnchanted) {
            // Store original tessellator to render the glint passes
            const originalTess = this.tessellator;
            
            // Pass 1: Render the same block geometry using the first glint layer
            this.tessellator = this.glintTessellator1;
            this.renderBlock(world, block, false, x, y, z, useLOD, distSq, group, brightness, force3D, {enchanted: false});
            
            // Pass 2: Render using the second glint layer
            this.tessellator = this.glintTessellator2;
            this.renderBlock(world, block, false, x, y, z, useLOD, distSq, group, brightness, force3D, {enchanted: false});
            
            // Restore original tessellator for the base texture pass
            this.tessellator = originalTess;
        }

        if (block.isFoliage) {
            this.renderCross(world, block, x, y, z, distSq);
            return;
        }
        if (block.isClimbable) {
            this.renderLadder(world, block, ambientOcclusion, x, y, z);
            return;
        }

        switch (block.getRenderType()) {
            case BlockRenderType.ANVIL:
                this.renderAnvil(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.END_PORTAL_FRAME:
                this.renderEndPortalFrame(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.BLOCK:
                this.renderSolidBlock(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.CHEST:
                this.renderChest(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.TORCH:
                this.renderTorch(world, block, x, y, z, useLOD);
                break;
            case BlockRenderType.CROSS:
                // Special handling for crops using the farming spritesheet
                if (block.getId() === 59) { // Wheat ID
                    let meta = world ? world.getBlockDataAt(x, y, z) : 7;
                    this.renderCrop(world, block, x, y, z, distSq, "../../farming.png", 4 + meta, 20);
                } else if (block.getId() === 141) { // Carrots ID
                    let meta = world ? world.getBlockDataAt(x, y, z) : 3;
                    this.renderCrop(world, block, x, y, z, distSq, "../../farming.png", 12 + meta, 20);
                } else if (block.getId() === 142) { // Potatoes ID
                    let meta = world ? world.getBlockDataAt(x, y, z) : 3;
                    this.renderCrop(world, block, x, y, z, distSq, "../../farming.png", 16 + meta, 20);
                } else if (block.getId() === 420) { // Beetroots ID
                    let meta = world ? world.getBlockDataAt(x, y, z) : 3;
                    this.renderCrop(world, block, x, y, z, distSq, "../../beetroot (1).png", 3 + meta, 7);
                } else {
                    this.renderCross(world, block, x, y, z, distSq);
                }
                break;
            case BlockRenderType.ORE:
            case BlockRenderType.MINERAL:
            case BlockRenderType.STRUCTURE_BLOCK:
                let mineralMeta = world ? world.getBlockDataAt(x, y, z) : 0;
                if ((mineralMeta & 128) !== 0) {
                    this.liquidRenderer.renderLiquid(world, BlockRegistry.WATER, x, y, z, useLOD);
                }
                this.renderMineralBlock(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.CRAFTING_TABLE:
                this.renderCraftingTable(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.COMMAND_BLOCK:
                this.renderCommandBlock(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.DISPENSER:
                this.renderDispenser(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.LEVER:
                this.renderLever(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.SPAWNER:
                this.renderSpawner(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.PLANT:
                this.renderPlant(world, block, x, y, z);
                break;
            case BlockRenderType.PAINTING:
                this.renderPainting(world, block, x, y, z);
                break;
            case BlockRenderType.LIQUID:
                this.liquidRenderer.renderLiquid(world, block, x, y, z, useLOD);
                break;
            case BlockRenderType.DOOR:
                this.doorRenderer.renderDoor(world, block, x, y, z);
                break;
            case BlockRenderType.FURNACE:
                this.renderFurnace(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.PUMPKIN:
                this.renderPumpkin(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.LADDER:
                this.renderLadder(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.FENCE:
                this.renderFence(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.FENCE_GATE:
                this.renderFenceGate(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.WALL:
                this.renderWall(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.ITEM:
                // Force extruded 3D look for Crossbow (499) even in GUI slots to satisfy "ALWAYS be in that state"
                if (group !== null && !force3D && block.getId() !== 499) {
                    this.renderFlatItem(block, x, y, z, group, brightness, 1.0, tag);
                } else {
                    this.renderExtrudedItem(world, block, x, y, z, brightness, tag);
                }
                break;
            case BlockRenderType.MAP:
                this.renderMap(world, block, x, y, z);
                break;
            case BlockRenderType.SLAB:
                this.renderSlab(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.STAIRS:
                this.renderStairs(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.SNOWY_GRASS:
                this.renderSnowyGrass(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.NETHER:
                this.renderNether(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.FIRE:
                this.renderFire(world, block, x, y, z);
                break;
            case BlockRenderType.NETHER_PORTAL:
                this.renderPortal(world, block, x, y, z);
                break;
            case BlockRenderType.FARMLAND:
                this.renderFarmland(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.REDSTONE_DUST:
                this.renderRedstoneDust(world, block, x, y, z);
                break;
            case BlockRenderType.GRASS_PATH:
                this.renderGrassPath(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.LILY_PAD:
                this.renderLilyPad(world, block, x, y, z);
                break;
            case BlockRenderType.PANE:
                this.renderPane(world, block, ambientOcclusion, x, y, z);
                break;

            case BlockRenderType.LIGHT:
            case BlockRenderType.BARRIER:
                // Do not render anything for these blocks in the world geometry
                return;

            case BlockRenderType.BED:
                this.renderBed(world, block, ambientOcclusion, x, y, z, group);
                break;
            case BlockRenderType.RAIL:
                this.renderRail(world, block, x, y, z);
                break;
            case BlockRenderType.DOUBLE_SLAB:
                this.renderDoubleSlab(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.DOUBLE_PLANT:
                this.renderDoublePlant(world, block, x, y, z, distSq);
                break;
            case BlockRenderType.SNOW_LAYER:
                this.renderSnowLayer(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.VERTICAL_SLAB:
                this.renderVerticalSlab(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.TRAPDOOR:
                this.renderTrapdoor(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.GLAZED_TERRACOTTA:
                this.renderGlazedTerracotta(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.CARPET:
                this.renderCarpet(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.SIGN:
            case BlockRenderType.WALL_SIGN:
                this.renderSign(world, block, ambientOcclusion, x, y, z, block.getRenderType() === 41);
                break;
            case BlockRenderType.PISTON_BASE:
                this.renderPistonBase(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.PISTON_HEAD:
                this.renderPistonHead(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.OBSERVER:
                this.renderObserver(world, block, ambientOcclusion, x, y, z);
                break;
            case BlockRenderType.SKELETON_HEAD:
            case BlockRenderType.ZOMBIE_HEAD:
            case BlockRenderType.CREEPER_HEAD:
            case BlockRenderType.ENDERMAN_HEAD:
                this.renderMobHead(world, block, x, y, z, group);
                break;
        }
    }

    renderObserver(world, block, ambientOcclusion, x, y, z) {
        const texName = "../../redstonestuff.png";
        let meta = world ? world.getBlockDataAt(x, y, z) : 2;
        let dir = meta & 7; // 0=D, 1=U, 2=N, 3=S, 4=W, 5=E (Face/Eye direction)
        let active = (meta & 8) !== 0;

        let originalTessellator = this.tessellator;
        let sideTess = this.getTessellator(texName);
        this.bindCustomTexture(sideTess, texName);
        this.tessellator = sideTess;

        let spriteCols = 22;
        let spriteW = 1.0 / spriteCols;

        for (let face of EnumBlockFace.values()) {
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                let texIdx = 19; // Side (Index 20 in 1-based, so 19)

                let isFace = false; // The Eye
                if (dir === 0 && face === EnumBlockFace.BOTTOM) isFace = true;
                if (dir === 1 && face === EnumBlockFace.TOP) isFace = true;
                if (dir === 2 && face === EnumBlockFace.NORTH) isFace = true;
                if (dir === 3 && face === EnumBlockFace.SOUTH) isFace = true;
                if (dir === 4 && face === EnumBlockFace.WEST) isFace = true;
                if (dir === 5 && face === EnumBlockFace.EAST) isFace = true;

                if (isFace) texIdx = 18; // observer_front
                else {
                    let isBack = false;
                    if (dir === 0 && face === EnumBlockFace.TOP) isBack = true;
                    if (dir === 1 && face === EnumBlockFace.BOTTOM) isBack = true;
                    if (dir === 2 && face === EnumBlockFace.SOUTH) isBack = true;
                    if (dir === 3 && face === EnumBlockFace.NORTH) isBack = true;
                    if (dir === 4 && face === EnumBlockFace.EAST) isBack = true;
                    if (dir === 5 && face === EnumBlockFace.WEST) isBack = true;

                    if (isBack) texIdx = active ? 17 : 16; // observer_back_on or off
                    else if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) texIdx = 20; // top
                }

                let minU = texIdx * spriteW + 0.0005, maxU = (texIdx + 1) * spriteW - 0.0005;
                let brightness = world ? world.getLightBrightness(x, y, z) : 1.0;
                this.tessellator.setColor(brightness * face.getShading(), brightness * face.getShading(), brightness * face.getShading());
                this.addFace(world, face, ambientOcclusion, x, y, z, x + 1, y + 1, z + 1, minU, 0, maxU, 1);
            }
        }
        this.tessellator = originalTessellator;
    }

    renderPistonBase(world, block, ambientOcclusion, x, y, z) {
        const texName = "../../redstonestuff.png";
        let meta = world ? world.getBlockDataAt(x, y, z) : 3;
        let dir = meta & 7;
        let extended = (meta & 8) !== 0;

        let originalTessellator = this.tessellator;
        let sideTess = this.getTessellator(texName);
        this.bindCustomTexture(sideTess, texName);
        this.tessellator = sideTess;

        let minX = 0, minY = 0, minZ = 0;
        let maxX = 1, maxY = 1, maxZ = 1;

        if (extended) {
            if (dir === 0) minY = 0.25;
            else if (dir === 1) maxY = 0.75;
            else if (dir === 2) minZ = 0.25;
            else if (dir === 3) maxZ = 0.75;
            else if (dir === 4) minX = 0.25;
            else if (dir === 5) maxX = 0.75;
        }

        let bb = new THREE.Box3(new THREE.Vector3(minX, minY, minZ), new THREE.Vector3(maxX, maxY, maxZ));
        let spriteCols = 22;
        let spriteWidth = 1.0 / spriteCols;

        for (let face of EnumBlockFace.values()) {
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                let texIdx = 10;
                let isHeadFace = false;
                if (dir === 0 && face === EnumBlockFace.BOTTOM) isHeadFace = true;
                if (dir === 1 && face === EnumBlockFace.TOP) isHeadFace = true;
                if (dir === 2 && face === EnumBlockFace.NORTH) isHeadFace = true;
                if (dir === 3 && face === EnumBlockFace.SOUTH) isHeadFace = true;
                if (dir === 4 && face === EnumBlockFace.WEST) isHeadFace = true;
                if (dir === 5 && face === EnumBlockFace.EAST) isHeadFace = true;

                if (isHeadFace) {
                    texIdx = extended ? 9 : (block.isSticky ? 12 : 11);
                } else {
                    let isBottomFace = false;
                    if (dir === 0 && face === EnumBlockFace.TOP) isBottomFace = true;
                    if (dir === 1 && face === EnumBlockFace.BOTTOM) isBottomFace = true;
                    if (dir === 2 && face === EnumBlockFace.SOUTH) isBottomFace = true;
                    if (dir === 3 && face === EnumBlockFace.NORTH) isBottomFace = true;
                    if (dir === 4 && face === EnumBlockFace.EAST) isBottomFace = true;
                    if (dir === 5 && face === EnumBlockFace.WEST) isBottomFace = true;
                    if (isBottomFace) texIdx = 8;
                }

                const eps = 0.0005;
                let uBase = texIdx * spriteWidth;

                const addPistonVertex = (vx, vy, vz) => {
                    let lx = vx - x, ly = vy - y, lz = vz - z;
                    let uRel, vRel;
                    
                    // Fix: Use 0..1 relative to the FULL block instead of the sub-box
                    // to prevent texture stretching on extended pistons.
                    let nx = lx, ny = ly, nz = lz;

                    if (face === EnumBlockFace.NORTH || face === EnumBlockFace.SOUTH) { uRel = nx; vRel = ny; }
                    else if (face === EnumBlockFace.WEST || face === EnumBlockFace.EAST) { uRel = nz; vRel = ny; }
                    else { uRel = nx; vRel = nz; }

                    // Only rotate the "side" texture (index 10) to point towards the head.
                    // This creates the correct directional grain on side-facing pistons.
                    if (texIdx === 10) {
                        let rot = 0;
                        if (dir === 0) rot = 2; // Head is Down
                        else if (dir === 1) rot = 0; // Head is Up
                        else if (dir === 2) { // Head is North (-Z)
                            if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) rot = 2;
                            else rot = 1;
                        } else if (dir === 3) { // Head is South (+Z)
                            if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) rot = 0;
                            else rot = 3;
                        } else if (dir === 4) { // Head is West (-X)
                            if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) rot = 1;
                            else rot = 1;
                        } else if (dir === 5) { // Head is East (+X)
                            if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) rot = 3;
                            else rot = 3;
                        }
                        for(let r=0; r<rot; r++) { let oldU = uRel; uRel = vRel; vRel = 1.0 - oldU; }
                    }

                    let finalU = uBase + uRel * spriteWidth;
                    finalU = MathHelper.clamp(finalU, uBase + eps, uBase + spriteWidth - eps);
                    this.addBlockCorner(world, face, ambientOcclusion, vx, vy, vz, finalU, 1.0 - vRel);
                };

                let brightness = world ? world.getLightBrightness(x, y, z) : 1.0;
                this.tessellator.setColor(brightness * face.getShading(), brightness * face.getShading(), brightness * face.getShading());

                let X1 = x + bb.min.x, X2 = x + bb.max.x, Y1 = y + bb.min.y, Y2 = y + bb.max.y, Z1 = z + bb.min.z, Z2 = z + bb.max.z;

                if (face === EnumBlockFace.BOTTOM) { addPistonVertex(X2, Y1, Z2); addPistonVertex(X2, Y1, Z1); addPistonVertex(X1, Y1, Z1); addPistonVertex(X1, Y1, Z2); }
                else if (face === EnumBlockFace.TOP) { addPistonVertex(X1, Y2, Z2); addPistonVertex(X1, Y2, Z1); addPistonVertex(X2, Y2, Z1); addPistonVertex(X2, Y2, Z2); }
                else if (face === EnumBlockFace.NORTH) { addPistonVertex(X1, Y2, Z1); addPistonVertex(X1, Y1, Z1); addPistonVertex(X2, Y1, Z1); addPistonVertex(X2, Y2, Z1); }
                else if (face === EnumBlockFace.SOUTH) { addPistonVertex(X1, Y2, Z2); addPistonVertex(X2, Y2, Z2); addPistonVertex(X2, Y1, Z2); addPistonVertex(X1, Y1, Z2); }
                else if (face === EnumBlockFace.WEST) { addPistonVertex(X1, Y1, Z2); addPistonVertex(X1, Y1, Z1); addPistonVertex(X1, Y2, Z1); addPistonVertex(X1, Y2, Z2); }
                else if (face === EnumBlockFace.EAST) { addPistonVertex(X2, Y2, Z2); addPistonVertex(X2, Y2, Z1); addPistonVertex(X2, Y1, Z1); addPistonVertex(X2, Y1, Z2); }
            }
        }
        this.tessellator = originalTessellator;
    }

    renderPistonHead(world, block, ambientOcclusion, x, y, z) {
        const texName = "../../redstonestuff.png";
        let sideTess = this.getTessellator(texName);
        this.bindCustomTexture(sideTess, texName);
        let originalTessellator = this.tessellator;
        this.tessellator = sideTess;
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let dir = meta & 7; 
        
        let minX=0, maxX=1, minY=0, maxY=1, minZ=0, maxZ=1;
        if (dir === 0) { minY=0.0; maxY=0.25; } else if (dir === 1) { minY=0.75; maxY=1.0; } else if (dir === 2) { minZ=0.0; maxZ=0.25; } else if (dir === 3) { minZ=0.75; maxZ=1.0; } else if (dir === 4) { minX=0.0; maxX=0.25; } else if (dir === 5) { minX=0.75; maxX=1.0; }
        let plateBox = new THREE.Box3(new THREE.Vector3(minX, minY, minZ), new THREE.Vector3(maxX, maxY, maxZ));
        
        let rMinX=0.375, rMaxX=0.625, rMinY=0.375, rMaxY=0.625, rMinZ=0.375, rMaxZ=0.625;
        // Extend rod by 0.25 units backwards into the base block's space to close the gap
        if (dir === 0) { rMinY = 0.25; rMaxY = 1.25; }      // Down
        else if (dir === 1) { rMinY = -0.25; rMaxY = 0.75; } // Up
        else if (dir === 2) { rMinZ = 0.25; rMaxZ = 1.25; } // North
        else if (dir === 3) { rMinZ = -0.25; rMaxZ = 0.75; } // South
        else if (dir === 4) { rMinX = 0.25; rMaxX = 1.25; } // West
        else if (dir === 5) { rMinX = -0.25; rMaxX = 0.75; } // East
        let rodBox = new THREE.Box3(new THREE.Vector3(rMinX, rMinY, rMinZ), new THREE.Vector3(rMaxX, rMaxY, rMaxZ));

        const renderBox = (box) => {
            let spriteCols = 22;
            let spriteWidth = 1.0 / spriteCols;
            const eps = 0.0005;

            for (let face of EnumBlockFace.values()) {
                let texIdx = 10;
                let isPusher = false;
                let isBack = false;

                if (box === plateBox) {
                    if (dir === 0 && face === EnumBlockFace.BOTTOM) isPusher = true;
                    else if (dir === 0 && face === EnumBlockFace.TOP) isBack = true;
                    if (dir === 1 && face === EnumBlockFace.TOP) isPusher = true;
                    else if (dir === 1 && face === EnumBlockFace.BOTTOM) isBack = true;
                    if (dir === 2 && face === EnumBlockFace.NORTH) isPusher = true;
                    else if (dir === 2 && face === EnumBlockFace.SOUTH) isBack = true;
                    if (dir === 3 && face === EnumBlockFace.SOUTH) isPusher = true;
                    else if (dir === 3 && face === EnumBlockFace.NORTH) isBack = true;
                    if (dir === 4 && face === EnumBlockFace.WEST) isPusher = true;
                    else if (dir === 4 && face === EnumBlockFace.EAST) isBack = true;
                    if (dir === 5 && face === EnumBlockFace.EAST) isPusher = true;
                    else if (dir === 5 && face === EnumBlockFace.WEST) isBack = true;
                }

                if (isPusher) texIdx = (meta & 8) !== 0 ? 12 : 11;
                else if (isBack) texIdx = 9; // Back of head uses extruded area
                else if (box === rodBox) texIdx = (meta & 8) !== 0 ? 12 : 11; // Rod uses head texture
                else texIdx = 10; // Sides of head plate use side texture

                let uBase = texIdx * spriteWidth;
                const addPistonVertex = (vx, vy, vz) => {
                    let lx = vx - x, ly = vy - y, lz = vz - z;
                    let uRel, vRel;

                    // Use consistent coordinates relative to the part center to prevent UV shifting
                    let nx = lx, ny = ly, nz = lz;

                    if (face === EnumBlockFace.NORTH || face === EnumBlockFace.SOUTH) { uRel = nx; vRel = ny; }
                    else if (face === EnumBlockFace.WEST || face === EnumBlockFace.EAST) { uRel = nz; vRel = ny; }
                    else { uRel = nx; vRel = nz; }

                    // Only apply directional rotation to the side (10) and rod (9) textures.
                    if (texIdx === 10 || texIdx === 9) {
                        let rot = 0;
                        if (dir === 0) rot = 2; // Head is Down
                        else if (dir === 1) rot = 0; // Head is Up
                        else if (dir === 2) { // Head is North (-Z)
                            if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) rot = 2;
                            else rot = 1;
                        } else if (dir === 3) { // Head is South (+Z)
                            if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) rot = 0;
                            else rot = 3;
                        } else if (dir === 4) { // Head is West (-X)
                            if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) rot = 1;
                            else rot = 1;
                        } else if (dir === 5) { // Head is East (+X)
                            if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) rot = 3;
                            else rot = 3;
                        }
                        for(let r=0; r<rot; r++) { let oldU = uRel; uRel = vRel; vRel = 1.0 - oldU; }
                    }

                    let finalU = uBase + uRel * spriteWidth;
                    finalU = MathHelper.clamp(finalU, uBase + eps, uBase + spriteWidth - eps);
                    this.addBlockCorner(world, face, ambientOcclusion, vx, vy, vz, finalU, 1.0 - vRel);
                };

                let brightness = world ? world.getLightBrightness(x, y, z) : 1.0;
                this.tessellator.setColor(brightness * face.getShading(), brightness * face.getShading(), brightness * face.getShading());

                let X1 = x + box.min.x, X2 = x + box.max.x, Y1 = y + box.min.y, Y2 = y + box.max.y, Z1 = z + box.min.z, Z2 = z + box.max.z;

                if (face === EnumBlockFace.BOTTOM) { addPistonVertex(X2, Y1, Z2); addPistonVertex(X2, Y1, Z1); addPistonVertex(X1, Y1, Z1); addPistonVertex(X1, Y1, Z2); }
                else if (face === EnumBlockFace.TOP) { addPistonVertex(X1, Y2, Z2); addPistonVertex(X1, Y2, Z1); addPistonVertex(X2, Y2, Z1); addPistonVertex(X2, Y2, Z2); }
                else if (face === EnumBlockFace.NORTH) { addPistonVertex(X1, Y2, Z1); addPistonVertex(X1, Y1, Z1); addPistonVertex(X2, Y1, Z1); addPistonVertex(X2, Y2, Z1); }
                else if (face === EnumBlockFace.SOUTH) { addPistonVertex(X1, Y2, Z2); addPistonVertex(X2, Y2, Z2); addPistonVertex(X2, Y1, Z2); addPistonVertex(X1, Y1, Z2); }
                else if (face === EnumBlockFace.WEST) { addPistonVertex(X1, Y1, Z2); addPistonVertex(X1, Y1, Z1); addPistonVertex(X1, Y2, Z1); addPistonVertex(X1, Y2, Z2); }
                else if (face === EnumBlockFace.EAST) { addPistonVertex(X2, Y2, Z2); addPistonVertex(X2, Y2, Z1); addPistonVertex(X2, Y1, Z1); addPistonVertex(X2, Y1, Z2); }
            }
        };

        renderBox(plateBox);
        renderBox(rodBox);
        this.tessellator = originalTessellator;
    }

    renderSign(world, block, ambientOcclusion, x, y, z, isWall) {
        const originalTessellator = this.tessellator;
        const woodTextures = ["../../blocks.png", "../../treestuff.png", "../../treestuff.png", "../../treestuff.png", "../../treestuff.png"];
        const woodIndices = [8, 19, 14, 24, 29];
        const woodCols = [14, 30, 30, 30, 30];
        
        const type = block.woodType || 0;
        const tex = woodTextures[type];
        
        let boardTess = this.getTessellator(tex);
        this.bindCustomTexture(boardTess, tex);
        this.tessellator = boardTess;
        // Ensure signs are visible from all sides by disabling backface culling
        this.tessellator.material.side = THREE.DoubleSide;

        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let brightness = world ? world.getLightBrightness(x, y, z) : 1.0;
        this.tessellator.setColor(brightness, brightness, brightness);

        if (isWall) {
            // Wall sign: 14x8x2 pixels approx
            let bb = block.getBoundingBox(world, x, y, z);
            let partBox = new THREE.Box3(new THREE.Vector3(bb.minX, bb.minY, bb.minZ), new THREE.Vector3(bb.maxX, bb.maxY, bb.maxZ));
            // isSingleTexture should be false if we want to use atlas logic (cols > 1)
            this.renderPartialBlock(world, block, false, x, y, z, partBox, false, true);
        } else {
            // Standing sign
            let rotation = (meta * 22.5) * (Math.PI / 180);
            let cos = Math.cos(rotation), sin = Math.sin(rotation);

            const spriteCols = woodCols[type];
            const spriteW = 1.0 / spriteCols;
            
            // UVs for the main board (full sprite)
            const bu0 = woodIndices[type] * spriteW;
            const bu1 = bu0 + spriteW;
            const bv0 = 0.0, bv1 = 1.0;

            // UVs for the thin post (2px center slice)
            const pu0 = bu0 + spriteW * 0.4375;
            const pu1 = pu0 + spriteW * 0.125;
            const pv0 = 0.0, pv1 = 0.5;

            // 1. Post (Rotated with board)
            const pw = 0.0625; // half-width
            const ph = 0.5; // full height
            const postCorners = [
                {lx: -pw, ly: 0, lz: -pw}, {lx: pw, ly: 0, lz: -pw},
                {lx: pw, ly: ph, lz: -pw}, {lx: -pw, ly: ph, lz: -pw},
                {lx: -pw, ly: 0, lz: pw}, {lx: pw, ly: 0, lz: pw},
                {lx: pw, ly: ph, lz: pw}, {lx: -pw, ly: ph, lz: pw}
            ];
            const rp = postCorners.map(c => ({
                wx: x + 0.5 + (c.lx * cos - c.lz * sin),
                wy: y + c.ly,
                wz: z + 0.5 + (c.lx * sin + c.lz * cos)
            }));
            
            this.tessellator.setColor(brightness * 0.7, brightness * 0.7, brightness * 0.7);
            // Post North
            this.tessellator.addVertexWithUV(rp[0].wx, rp[0].wy, rp[0].wz, pu0, pv1);
            this.tessellator.addVertexWithUV(rp[1].wx, rp[1].wy, rp[1].wz, pu1, pv1);
            this.tessellator.addVertexWithUV(rp[2].wx, rp[2].wy, rp[2].wz, pu1, pv0);
            this.tessellator.addVertexWithUV(rp[3].wx, rp[3].wy, rp[3].wz, pu0, pv0);
            // Post South
            this.tessellator.addVertexWithUV(rp[5].wx, rp[5].wy, rp[5].wz, pu0, pv1);
            this.tessellator.addVertexWithUV(rp[4].wx, rp[4].wy, rp[4].wz, pu1, pv1);
            this.tessellator.addVertexWithUV(rp[7].wx, rp[7].wy, rp[7].wz, pu1, pv0);
            this.tessellator.addVertexWithUV(rp[6].wx, rp[6].wy, rp[6].wz, pu0, pv0);
            // Post West
            this.tessellator.addVertexWithUV(rp[4].wx, rp[4].wy, rp[4].wz, pu0, pv1);
            this.tessellator.addVertexWithUV(rp[0].wx, rp[0].wy, rp[0].wz, pu1, pv1);
            this.tessellator.addVertexWithUV(rp[3].wx, rp[3].wy, rp[3].wz, pu1, pv0);
            this.tessellator.addVertexWithUV(rp[7].wx, rp[7].wy, rp[7].wz, pu0, pv0);
            // Post East
            this.tessellator.addVertexWithUV(rp[1].wx, rp[1].wy, rp[1].wz, pu0, pv1);
            this.tessellator.addVertexWithUV(rp[5].wx, rp[5].wy, rp[5].wz, pu1, pv1);
            this.tessellator.addVertexWithUV(rp[6].wx, rp[6].wy, rp[6].wz, pu1, pv0);
            this.tessellator.addVertexWithUV(rp[2].wx, rp[2].wy, rp[2].wz, pu0, pv0);

            // 2. Board (Rotated)
            const w = 0.48, h = 0.32, t = 0.0625;
            const corners = [
                {lx: -w, ly: -h, lz: -t}, {lx: w, ly: -h, lz: -t},
                {lx: w, ly: h, lz: -t}, {lx: -w, ly: h, lz: -t},
                {lx: -w, ly: -h, lz: t}, {lx: w, ly: -h, lz: t},
                {lx: w, ly: h, lz: t}, {lx: -w, ly: h, lz: t}
            ];

            const pivotY = 0.82; // Raised to avoid post clipping
            this.tessellator.setColor(brightness, brightness, brightness);

            const rotated = corners.map(c => ({
                wx: x + 0.5 + (c.lx * cos - c.lz * sin),
                wy: y + pivotY + c.ly,
                wz: z + 0.5 + (c.lx * sin + c.lz * cos)
            }));

            // South Face
            this.tessellator.addVertexWithUV(rotated[4].wx, rotated[4].wy, rotated[4].wz, bu0, bv1);
            this.tessellator.addVertexWithUV(rotated[5].wx, rotated[5].wy, rotated[5].wz, bu1, bv1);
            this.tessellator.addVertexWithUV(rotated[6].wx, rotated[6].wy, rotated[6].wz, bu1, bv0);
            this.tessellator.addVertexWithUV(rotated[7].wx, rotated[7].wy, rotated[7].wz, bu0, bv0);
            // North Face
            this.tessellator.addVertexWithUV(rotated[1].wx, rotated[1].wy, rotated[1].wz, bu0, bv1);
            this.tessellator.addVertexWithUV(rotated[0].wx, rotated[0].wy, rotated[0].wz, bu1, bv1);
            this.tessellator.addVertexWithUV(rotated[3].wx, rotated[3].wy, rotated[3].wz, bu1, bv0);
            this.tessellator.addVertexWithUV(rotated[2].wx, rotated[2].wy, rotated[2].wz, bu0, bv0);
            
            this.tessellator.setColor(brightness * 0.8, brightness * 0.8, brightness * 0.8);
            // Top Edge
            this.tessellator.addVertexWithUV(rotated[3].wx, rotated[3].wy, rotated[3].wz, bu0, bv0);
            this.tessellator.addVertexWithUV(rotated[2].wx, rotated[2].wy, rotated[2].wz, bu1, bv0);
            this.tessellator.addVertexWithUV(rotated[6].wx, rotated[6].wy, rotated[6].wz, bu1, bv0 + 0.02);
            this.tessellator.addVertexWithUV(rotated[7].wx, rotated[7].wy, rotated[7].wz, bu0, bv0 + 0.02);
            // Bottom Edge
            this.tessellator.addVertexWithUV(rotated[4].wx, rotated[4].wy, rotated[4].wz, bu0, bv1);
            this.tessellator.addVertexWithUV(rotated[5].wx, rotated[5].wy, rotated[5].wz, bu1, bv1);
            this.tessellator.addVertexWithUV(rotated[1].wx, rotated[1].wy, rotated[1].wz, bu1, bv1 - 0.02);
            this.tessellator.addVertexWithUV(rotated[0].wx, rotated[0].wy, rotated[0].wz, bu0, bv1 - 0.02);
            // Side Edges
            this.tessellator.addVertexWithUV(rotated[0].wx, rotated[0].wy, rotated[0].wz, bu0, bv1);
            this.tessellator.addVertexWithUV(rotated[4].wx, rotated[4].wy, rotated[4].wz, bu0 + 0.02, bv1);
            this.tessellator.addVertexWithUV(rotated[7].wx, rotated[7].wy, rotated[7].wz, bu0 + 0.02, bv0);
            this.tessellator.addVertexWithUV(rotated[3].wx, rotated[3].wy, rotated[3].wz, bu0, bv0);
            this.tessellator.addVertexWithUV(rotated[5].wx, rotated[5].wy, rotated[5].wz, bu1, bv1);
            this.tessellator.addVertexWithUV(rotated[1].wx, rotated[1].wy, rotated[1].wz, bu1 - 0.02, bv1);
            this.tessellator.addVertexWithUV(rotated[2].wx, rotated[2].wy, rotated[2].wz, bu1 - 0.02, bv0);
            this.tessellator.addVertexWithUV(rotated[6].wx, rotated[6].wy, rotated[6].wz, bu1, bv0);
        }

        this.tessellator = originalTessellator;
    }

    renderCarpet(world, block, ambientOcclusion, x, y, z) {
        let originalTessellator = this.tessellator;
        let isCustomTexture = false;

        if (block.textureName) {
            isCustomTexture = true;
            let tess = this.getTessellator(block.textureName);
            this.bindCustomTexture(tess, block.textureName);
            this.tessellator = tess;
        }

        let partBox = new THREE.Box3(
            new THREE.Vector3(0.0, 0.0, 0.0),
            new THREE.Vector3(1.0, 0.0625, 1.0)
        );

        this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, partBox, isCustomTexture);

        if (isCustomTexture) {
            this.tessellator = originalTessellator;
        }
    }

    renderGlazedTerracotta(world, block, ambientOcclusion, x, y, z) {
        let tess = this.getTessellator(block.textureName);
        this.bindCustomTexture(tess, block.textureName);

        let originalTessellator = this.tessellator;
        this.tessellator = tess;

        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let rotation = meta & 3; // 0=S, 1=W, 2=N, 3=E

        let boundingBox = block.getBoundingBox(world, x, y, z);
        let spriteCols = 31;
        let spriteWidth = 1.0 / spriteCols;
        const eps = 0.0005;
        let minU = block.textureIndex * spriteWidth + eps;
        let maxU = (block.textureIndex + 1) * spriteWidth - eps;
        let minV = 0.0, maxV = 1.0;

        let values = EnumBlockFace.values();
        for (let i = 0; i < values.length; i++) {
            let face = values[i];
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                let color = block.getColor(world, x, y, z, face);
                let red = (color >> 16 & 255) / 255.0;
                let green = (color >> 8 & 255) / 255.0;
                let blue = (color & 255) / 255.0;

                if (!ambientOcclusion && world) {
                    let level = world.getTotalLightAt(x + face.x, y + face.y, z + face.z);
                    if (level < 1) level = 1;
                    let brightness = 0.9 / 15.0 * level + 0.1;

                    // Apply global brightness setting
                    let globalBrightness = this.worldRenderer.minecraft.settings.brightness;
                    brightness = brightness + (1.0 - brightness) * globalBrightness;

                    this.tessellator.setColor(red * brightness * face.getShading(), green * brightness * face.getShading(), blue * brightness * face.getShading());
                } else if (!world) this.tessellator.setColor(1, 1, 1);

                // Rotate UVs for the top face based on placement
                if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) {
                    // Start with standard UV mappings for TOP/BOTTOM from addFace
                    let uArr = [minU, minU, maxU, maxU];
                    let vArr = [0.0, 1.0, 1.0, 0.0]; 
                    
                    if (face === EnumBlockFace.BOTTOM) {
                        uArr = [maxU, maxU, minU, minU];
                        vArr = [1.0, 0.0, 0.0, 1.0];
                    }
                    
                    // Shift arrays by rotation
                    for(let r=0; r<rotation; r++) {
                        uArr.push(uArr.shift());
                        vArr.push(vArr.shift());
                    }

                    if (face === EnumBlockFace.TOP) {
                        this.addBlockCorner(world, face, ambientOcclusion, x, y + 1, z + 1, uArr[0], vArr[0], red, green, blue);
                        this.addBlockCorner(world, face, ambientOcclusion, x, y + 1, z, uArr[1], vArr[1], red, green, blue);
                        this.addBlockCorner(world, face, ambientOcclusion, x + 1, y + 1, z, uArr[2], vArr[2], red, green, blue);
                        this.addBlockCorner(world, face, ambientOcclusion, x + 1, y + 1, z + 1, uArr[3], vArr[3], red, green, blue);
                    } else {
                        // BOTTOM
                        this.addBlockCorner(world, face, ambientOcclusion, x + 1, y, z + 1, uArr[0], vArr[0], red, green, blue);
                        this.addBlockCorner(world, face, ambientOcclusion, x + 1, y, z, uArr[1], vArr[1], red, green, blue);
                        this.addBlockCorner(world, face, ambientOcclusion, x, y, z, uArr[2], vArr[2], red, green, blue);
                        this.addBlockCorner(world, face, ambientOcclusion, x, y, z + 1, uArr[3], vArr[3], red, green, blue);
                    }
                } else {
                    this.addFace(world, face, ambientOcclusion, x, y, z, x + 1, y + 1, z + 1, minU, 0, maxU, 1, red, green, blue);
                }
            }
        }
        this.tessellator = originalTessellator;
    }

    renderTrapdoor(world, block, ambientOcclusion, x, y, z) {
        let originalTessellator = this.tessellator;
        let isCustomTexture = false;

        if (block.textureName) {
            isCustomTexture = true;
            let tess = this.getTessellator(block.textureName);
            this.bindCustomTexture(tess, block.textureName);
            this.tessellator = tess;
        }

        let boundingBox = block.getBoundingBox(world, x, y, z);
        let partBox = new THREE.Box3(
            new THREE.Vector3(boundingBox.minX, boundingBox.minY, boundingBox.minZ),
            new THREE.Vector3(boundingBox.maxX, boundingBox.maxY, boundingBox.maxZ)
        );

        // UV mapping for 6-column sheet
        let spriteCols = 6;
        let spriteWidth = 1.0 / spriteCols;
        let uBase = (block.textureIndex || 0) * spriteWidth;

        let values = EnumBlockFace.values();
        for (let i = 0; i < values.length; i++) {
            let face = values[i];
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                
                let uRel1 = 0, uRel2 = 1, vRel1 = 0, vRel2 = 1;
                if (face === EnumBlockFace.NORTH || face === EnumBlockFace.SOUTH) {
                    uRel1 = partBox.min.x; uRel2 = partBox.max.x;
                    vRel1 = 1.0 - partBox.max.y; vRel2 = 1.0 - partBox.min.y;
                } else if (face === EnumBlockFace.WEST || face === EnumBlockFace.EAST) {
                    uRel1 = partBox.min.z; uRel2 = partBox.max.z;
                    vRel1 = 1.0 - partBox.max.y; vRel2 = 1.0 - partBox.min.y;
                } else { // TOP / BOTTOM
                    uRel1 = partBox.min.x; uRel2 = partBox.max.x;
                    vRel1 = partBox.min.z; vRel2 = partBox.max.z;
                }

                let minU = uBase + uRel1 * spriteWidth;
                let maxU = uBase + uRel2 * spriteWidth;
                let minV = vRel1;
                let maxV = vRel2;
                
                // Invert V
                let tempV = minV; minV = 1.0 - maxV; maxV = 1.0 - tempV;

                let color = 0xFFFFFF;
                let red = 1, green = 1, blue = 1;

                if (!ambientOcclusion) {
                    let level = world === null ? 15 : world.getTotalLightAt(Math.floor(x + face.x), Math.floor(y + face.y), Math.floor(z + face.z));
                    if (level < 1) level = 1;
                    let b = 0.9 / 15.0 * level + 0.1;
                    let shade = b * face.getShading();
                    this.tessellator.setColor(red * shade, green * shade, blue * shade);
                }

                this.addFace(world, face, ambientOcclusion, x + partBox.min.x, y + partBox.min.y, z + partBox.min.z, x + partBox.max.x, y + partBox.max.y, z + partBox.max.z, minU, minV, maxU, maxV);
            }
        }

        if (isCustomTexture) {
            this.tessellator = originalTessellator;
        }
    }

    renderVerticalSlab(world, block, ambientOcclusion, x, y, z) {
        let originalTessellator = this.tessellator;
        let isCustomTexture = false;

        if (block.textureName) {
            isCustomTexture = true;
            let tess = this.getTessellator(block.textureName);
            this.bindCustomTexture(tess, block.textureName);
            this.tessellator = tess;
        }

        let boundingBox = block.getBoundingBox(world, x, y, z);
        // Box values are already relative (0..1), do not subtract world coordinates
        let partBox = new THREE.Box3(
            new THREE.Vector3(boundingBox.minX, boundingBox.minY, boundingBox.minZ),
            new THREE.Vector3(boundingBox.maxX, boundingBox.maxY, boundingBox.maxZ)
        );

        this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, partBox, isCustomTexture);

        if (isCustomTexture) {
            this.tessellator = originalTessellator;
        }
    }

    renderSnowLayer(world, block, ambientOcclusion, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let layers = (meta & 7) + 1;
        let height = layers / 8.0;

        let originalTessellator = this.tessellator;
        let tess = this.getTessellator("../../snow.png");
        this.bindCustomTexture(tess, "../../snow.png");
        this.tessellator = tess;

        let minX = x;
        let minY = y;
        let minZ = z;
        let maxX = x + 1.0;
        let maxY = y + height;
        let maxZ = z + 1.0;

        let values = EnumBlockFace.values();
        for (let i = 0; i < values.length; i++) {
            let face = values[i];
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                let u1 = 0, u2 = 1, v1 = 0, v2 = 1;

                if (face === EnumBlockFace.NORTH || face === EnumBlockFace.SOUTH) {
                    v1 = 1.0 - height; // Top of the texture slice
                    v2 = 1.0; // Bottom of texture
                    if (face === EnumBlockFace.SOUTH) [u1, u2] = [u2, u1]; // Mirror fix if needed
                } else if (face === EnumBlockFace.WEST || face === EnumBlockFace.EAST) {
                    v1 = 1.0 - height;
                    v2 = 1.0;
                } else if (face === EnumBlockFace.TOP) {
                    // Full texture for top
                } else if (face === EnumBlockFace.BOTTOM) {
                    // Full texture for bottom
                }

                // Flip V for renderer
                let tempV = v1; v1 = 1.0 - v2; v2 = 1.0 - tempV;

                let color = 0xFFFFFF;
                let red = 1.0, green = 1.0, blue = 1.0;

                if (!ambientOcclusion) {
                    let level = world === null ? 15 : world.getTotalLightAt(Math.floor(x + face.x), Math.floor(y + face.y), Math.floor(z + face.z));
                    if (level < 1) level = 1;
                    let b = 0.9 / 15.0 * level + 0.1;
                    let shade = b * face.getShading();
                    this.tessellator.setColor(red * shade, green * shade, blue * shade);
                }

                this.addFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, u1, v1, u2, v2, red, green, blue);
            }
        }

        this.tessellator = originalTessellator;
    }

    renderDoublePlant(world, block, x, y, z, distSq) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let isTop = (meta & 8) !== 0;
        
        let oldIdx = block.textureIndex;
        block.textureIndex = isTop ? block.topIndex : block.bottomIndex;
        this.renderCross(world, block, x, y, z, distSq);
        block.textureIndex = oldIdx;
    }

    renderSandstoneSlab(world, block, ambientOcclusion, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let isTop = (meta & 8) !== 0;

        // Top
        let topTess = this.getTessellator("../../sandstone_top.png");
        this.bindCustomTexture(topTess, "../../sandstone_top.png");

        // Bottom
        let bottomTess = this.getTessellator("../../sandstone_bottom.png");
        this.bindCustomTexture(bottomTess, "../../sandstone_bottom.png");

        // Sides
        let sideTess = this.getTessellator("../../sandstoneside.png");
        this.bindCustomTexture(sideTess, "../../sandstoneside.png");

        let originalTessellator = this.tessellator;

        let partMinY = isTop ? 0.5 : 0.0;
        let partMaxY = isTop ? 1.0 : 0.5;

        let bb = new THREE.Box3(new THREE.Vector3(0, partMinY, 0), new THREE.Vector3(1, partMaxY, 1));
        
        let minX = x + bb.min.x;
        let minY = y + bb.min.y;
        let minZ = z + bb.min.z;
        let maxX = x + bb.max.x;
        let maxY = y + bb.max.y;
        let maxZ = z + bb.max.z;

        let values = EnumBlockFace.values();
        for (let i = 0; i < values.length; i++) {
            let face = values[i];
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                
                let currentTess;
                if (face === EnumBlockFace.TOP) currentTess = topTess;
                else if (face === EnumBlockFace.BOTTOM) currentTess = bottomTess;
                else currentTess = sideTess;
                
                this.tessellator = currentTess;

                // Calculate UVs based on bounding box relative position
                let u1 = 0, u2 = 1, v1 = 0, v2 = 1;

                if (face === EnumBlockFace.NORTH || face === EnumBlockFace.SOUTH) {
                    u1 = bb.min.x; u2 = bb.max.x;
                    v1 = 1.0 - bb.max.y; v2 = 1.0 - bb.min.y; 
                } else if (face === EnumBlockFace.WEST || face === EnumBlockFace.EAST) {
                    u1 = bb.min.z; u2 = bb.max.z;
                    v1 = 1.0 - bb.max.y; v2 = 1.0 - bb.min.y;
                } else {
                    u1 = bb.min.x; u2 = bb.max.x;
                    v1 = bb.min.z; v2 = bb.max.z;
                }

                let minU = u1, maxU = u2, minV = v1, maxV = v2;

                // Flip V for renderer
                let tempV = minV; minV = 1.0 - maxV; maxV = 1.0 - tempV;

                let color = block.getColor(world, x, y, z, face);
                let red = (color >> 16 & 255) / 255.0;
                let green = (color >> 8 & 255) / 255.0;
                let blue = (color & 255) / 255.0;

                if (!ambientOcclusion) {
                    let level = 15;
                    if (world) {
                        level = world.getTotalLightAt(Math.floor(x + face.x), Math.floor(y + face.y), Math.floor(z + face.z));
                    }
                    if (level < 1) level = 1;
                    let brightness = 0.9 / 15.0 * level + 0.1;
                    let shade = brightness * face.getShading();
                    this.tessellator.setColor(red * shade, green * shade, blue * shade);
                }

                this.addFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, red, green, blue);
            }
        }

        this.tessellator = originalTessellator;
    }

    renderSandstone(world, block, ambientOcclusion, x, y, z) {
        // Top
        let topTess = this.getTessellator("../../sandstone_top.png");
        this.bindCustomTexture(topTess, "../../sandstone_top.png");
        
        // Bottom
        let bottomTess = this.getTessellator("../../sandstone_bottom.png");
        this.bindCustomTexture(bottomTess, "../../sandstone_bottom.png");
        
        // Sides
        let sideTess = this.getTessellator("../../sandstoneside.png");
        this.bindCustomTexture(sideTess, "../../sandstoneside.png");
        
        let originalTessellator = this.tessellator;
        
        let boundingBox = block.getBoundingBox(world, x, y, z);
        let minX = x + boundingBox.minX;
        let minY = y + boundingBox.minY;
        let minZ = z + boundingBox.minZ;
        let maxX = x + boundingBox.maxX;
        let maxY = y + boundingBox.maxY;
        let maxZ = z + boundingBox.maxZ;

        // Render faces
        let values = EnumBlockFace.values();
        for (let i = 0; i < values.length; i++) {
            let face = values[i];
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                
                let currentTess;
                
                if (face === EnumBlockFace.TOP) {
                    currentTess = topTess;
                } else if (face === EnumBlockFace.BOTTOM) {
                    currentTess = bottomTess;
                } else {
                    currentTess = sideTess;
                }
                
                this.tessellator = currentTess;

                // Use full texture for each face (0-1 UVs)
                let minU = 0, maxU = 1, minV = 0, maxV = 1;
                
                // Flip V
                let tempV = minV; minV = 1.0 - maxV; maxV = 1.0 - tempV;

                let color = block.getColor(world, x, y, z, face);
                let red = (color >> 16 & 255) / 255.0;
                let green = (color >> 8 & 255) / 255.0;
                let blue = (color & 255) / 255.0;

                if (!ambientOcclusion) {
                    let level = world === null ? 15 : world.getTotalLightAt(minX + face.x, minY + face.y, minZ + face.z);
                    if (level < 1) level = 1;
                    let brightness = 0.9 / 15.0 * level + 0.1;

                    // Apply global brightness setting
                    let globalBrightness = this.worldRenderer.minecraft.settings.brightness;
                    brightness = brightness + (1.0 - brightness) * globalBrightness;

                    let shade = brightness * face.getShading();
                    currentTess.setColor(red * shade, green * shade, blue * shade);
                }

                this.addFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, red, green, blue);
            }
        }
        
        this.tessellator = originalTessellator;
    }

    renderRedstoneDust(world, block, x, y, z) {
        const texName = "../../redstonestuff.png";
        let originalTessellator = this.tessellator;
        let dustTess = this.getTessellator(texName);
        this.bindCustomTexture(dustTess, texName);
        this.tessellator = dustTess;

        this.tessellator.material.transparent = true;
        this.tessellator.material.alphaTest = 0.1;
        this.tessellator.material.side = THREE.DoubleSide;

        let connectN = {side:false, up:false}, connectS = {side:false, up:false}, connectE = {side:false, up:false}, connectW = {side:false, up:false};
        let isActive = false;
        let power = 0;
        
        if (world) {
            power = world.getBlockDataAt(x, y, z);
            isActive = power > 0;
            const isDust = (bx, by, bz) => {
                let id = world.getBlockAt(bx, by, bz);
                if (id === 55 || id === 152 || id === 161 || id === 76) return true;
                let b = Block.getById(id);
                return b && (b.getRenderType() === BlockRenderType.REPEATER);
            };

            const getConnect = (ox, oz) => {
                if (isDust(x + ox, y, z + oz)) return { side: true, up: false };
                if (world.getBlockAt(x, y + 1, z) === 0 && isDust(x + ox, y + 1, z + oz)) return { side: true, up: true };
                if (isDust(x + ox, y - 1, z + oz)) return { side: true, up: false };
                return { side: false, up: false };
            };

            connectN = getConnect(0, -1);
            connectS = getConnect(0, 1);
            connectW = getConnect(-1, 0);
            connectE = getConnect(1, 0);
        }

        let r, g, b;
        if (isActive) {
            let pFact = power / 15.0;
            r = 0.5 + 0.5 * pFact; g = 0.0; b = 0.0;
        } else {
            r = 0.3; g = 0.0; b = 0.0;
        }

        this.tessellator.setColor(r, g, b, 1.0);

        let spriteCols = 22;
        let spriteW = 1.0 / spriteCols;
        let yPos = y + 0.015;

        // SPRITES: 1=dot, 2=line0
        let dotU0 = 1 * spriteW + 0.0005, dotU1 = 2 * spriteW - 0.0005;
        let lineU0 = 2 * spriteW + 0.0005, lineU1 = 3 * spriteW - 0.0005;

        let straightVert = (connectN.side && connectS.side && !connectE.side && !connectW.side);
        let straightHorz = (!connectN.side && !connectS.side && connectE.side && connectW.side);

        const eps = 0.01;

        // 1. Render Dot (if not a simple straight line)
        if (!straightVert && !straightHorz) {
            this.tessellator.addVertexWithUV(x, yPos, z + 1, dotU0, 1);
            this.tessellator.addVertexWithUV(x, yPos, z, dotU0, 0);
            this.tessellator.addVertexWithUV(x + 1, yPos, z, dotU1, 0);
            this.tessellator.addVertexWithUV(x + 1, yPos, z + 1, dotU1, 1);
        }

        // 2. Render Lines (Floor)
        if (straightVert || connectN.side || connectS.side) {
            this.tessellator.addVertexWithUV(x, yPos, z + 1, lineU0, 1);
            this.tessellator.addVertexWithUV(x, yPos, z, lineU0, 0);
            this.tessellator.addVertexWithUV(x + 1, yPos, z, lineU1, 0);
            this.tessellator.addVertexWithUV(x + 1, yPos, z + 1, lineU1, 1);
        }
        if (straightHorz || connectE.side || connectW.side) {
            this.tessellator.addVertexWithUV(x, yPos, z + 1, lineU1, 0);
            this.tessellator.addVertexWithUV(x, yPos, z, lineU0, 0);
            this.tessellator.addVertexWithUV(x + 1, yPos, z, lineU0, 1);
            this.tessellator.addVertexWithUV(x + 1, yPos, z + 1, lineU1, 1);
        }

        // 3. Render Vertical Slants (Up connections)
        if (connectN.up) {
            this.tessellator.addVertexWithUV(x, y + 1, z + eps, lineU0, 0);
            this.tessellator.addVertexWithUV(x, y, z + eps, lineU0, 1);
            this.tessellator.addVertexWithUV(x + 1, y, z + eps, lineU1, 1);
            this.tessellator.addVertexWithUV(x + 1, y + 1, z + eps, lineU1, 0);
        }
        if (connectS.up) {
            this.tessellator.addVertexWithUV(x, y, z + 1 - eps, lineU0, 1);
            this.tessellator.addVertexWithUV(x, y + 1, z + 1 - eps, lineU0, 0);
            this.tessellator.addVertexWithUV(x + 1, y + 1, z + 1 - eps, lineU1, 0);
            this.tessellator.addVertexWithUV(x + 1, y, z + 1 - eps, lineU1, 1);
        }
        if (connectW.up) {
            this.tessellator.addVertexWithUV(x + eps, y, z + 1, lineU0, 1);
            this.tessellator.addVertexWithUV(x + eps, y + 1, z + 1, lineU0, 0);
            this.tessellator.addVertexWithUV(x + eps, y + 1, z, lineU1, 0);
            this.tessellator.addVertexWithUV(x + eps, y, z, lineU1, 1);
        }
        if (connectE.up) {
            this.tessellator.addVertexWithUV(x + 1 - eps, y + 1, z + 1, lineU1, 0);
            this.tessellator.addVertexWithUV(x + 1 - eps, y, z + 1, lineU1, 1);
            this.tessellator.addVertexWithUV(x + 1 - eps, y, z, lineU0, 1);
            this.tessellator.addVertexWithUV(x + 1 - eps, y + 1, z, lineU0, 0);
        }
        
        this.tessellator = originalTessellator;
    }

    renderMap(world, block, x, y, z) {
        // Maps render as a flat plane held in hand.
        // We use the dynamic texture from the block instance.
        
        let texture = block.getMapTexture(this.worldRenderer);
        
        // Use a generic tessellator or override one. 
        // We can reuse the main tessellator if we bind the new texture.
        
        // Save previous
        let originalTessellator = this.tessellator;
        
        // Just reuse one of the temporary tessellators to avoid state pollution, e.g. painting
        let tess = this.getTessellator("map_dynamic");
        tess.bindTexture(texture);
        tess.material.side = THREE.DoubleSide;
        
        this.tessellator = tess;
        this.tessellator.startDrawing();
        this.tessellator.setColor(1, 1, 1);

        // Render simple quad
        // In first person (ItemRenderer), x,y,z are relative.
        // Usually scale is applied externally.
        // Let's draw a 1x1 quad centered.
        
        // ItemRenderer passes (0,0,0) usually for in-hand.
        // renderBlockInFirstPerson positions it.
        
        let minX = x - 0.5;
        let maxX = x + 0.5;
        let minY = y - 0.5;
        let maxY = y + 0.5;
        let zPos = z;

        // Draw quad facing Z
        this.tessellator.addVertexWithUV(minX, maxY, zPos, 0, 0);
        this.tessellator.addVertexWithUV(minX, minY, zPos, 0, 1);
        this.tessellator.addVertexWithUV(maxX, minY, zPos, 1, 1);
        this.tessellator.addVertexWithUV(maxX, maxY, zPos, 1, 0);

        let mesh = this.tessellator.draw(this.worldRenderer.overlay); // Draw to overlay group if handled manually?
        // Wait, renderBlockInFirstPerson expects us to draw into the 'group' passed to it via tessellator.
        // But here renderBlock is called by renderBlockInFirstPerson?
        // No, renderBlockInFirstPerson calls renderMap indirectly via switch.
        
        // Actually renderBlockInFirstPerson calls renderMap?
        // No, renderBlockInFirstPerson has its own switch. We need to add MAP there too.
        
        this.tessellator = originalTessellator;
    }

    renderFarmland(world, block, ambientOcclusion, x, y, z) {
        let boundingBox = block.getBoundingBox(world, x, y, z);
        let originalTessellator = this.tessellator;

        // 1. Render Top Face with Custom Texture (farmland.png or farmland_moist.png)
        let isMoist = this.isFarmlandMoist(world, x, y, z);
        let textureName = isMoist ? "../../farmland_moist.png" : "../../farmland.png";
        
        let topTess = this.getTessellator(textureName);
        this.bindCustomTexture(topTess, textureName);
        this.tessellator = topTess;

        let minX = x + boundingBox.minX;
        let minY = y + boundingBox.minY;
        let minZ = z + boundingBox.minZ;
        let maxX = x + boundingBox.maxX;
        let maxY = y + boundingBox.maxY; // 0.9375
        let maxZ = z + boundingBox.maxZ;

        // Render Top Face only
        // Full UVs for the custom texture
        let minU = 0, maxU = 1, minV = 0, maxV = 1;
        // Flip V
        let tV = minV; minV = 1 - maxV; maxV = 1 - tV;

        if (world === null || block.shouldRenderFace(world, x, y, z, EnumBlockFace.TOP)) {
            let color = 0xFFFFFF;
            // No biome tint for farmland top (usually), usually moist/dry tint but texture handles it?
            // Vanilla tints stem connections but farmland itself is just the texture.
            let red = 1, green = 1, blue = 1;
            
            if (!ambientOcclusion && world) {
                let level = world.getTotalLightAt(x, y + 1, z);
                let b = 0.9 / 15.0 * level + 0.1;
                this.tessellator.setColor(b, b, b);
            } else if (!world) {
                this.tessellator.setColor(1, 1, 1);
            }
            
            this.addFace(world, EnumBlockFace.TOP, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, red, green, blue);
        }

        // 2. Render Sides/Bottom with Dirt Texture (Atlas)
        this.tessellator = originalTessellator; // Back to blocks.png

        // Dirt Texture Index: BlockRegistry.DIRT uses 0 (based on BlockDirt(3,0) and BlockGrass logic)
        let textureIndex = 0; // Dirt
        
        let values = [EnumBlockFace.BOTTOM, EnumBlockFace.NORTH, EnumBlockFace.SOUTH, EnumBlockFace.WEST, EnumBlockFace.EAST];
        
        for (let face of values) {
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                let atlasU = (textureIndex % 14) / 14.0;
                let atlasV = Math.floor(textureIndex / 14) / 16.0; // Assuming 1 row? code says 1 row for terrain
                let u1 = atlasU, u2 = atlasU + 1/14.0;
                let v1 = 0, v2 = 1;

                // For sides, since height is < 1, we should clip UVs?
                // Standard MC renders partial side textures for slabs/farmland.
                // Height is 0.9375 (15/16).
                // Top of side is maxY.
                
                let uvV1 = v1; 
                let uvV2 = v2;
                
                if (face !== EnumBlockFace.BOTTOM) {
                    // Adjust V for height
                    // v2 corresponds to bottom (y=0), v1 to top (y=1) in flipped GL logic? 
                    // Actually addFace UV mapping:
                    // v1 is top of texture? In standard UV, 0 is top.
                    // BlockRenderer flips V: minV = 1-maxV.
                    // Let's calculate standard 0-1 UVs for the partial face.
                    
                    // The face goes from y to maxY.
                    // Texture should map from 1.0 (bottom) up to (1.0 - height) (top)? 
                    // Or 0 (top) down to height? 
                    // Usually dirt side is full dirt texture cropped.
                    // Top of block (0.9375) maps to 0.0625 on texture Y?
                    // Let's assume we map the bottom 15/16ths of the texture.
                    
                    // 0 is Top, 1 is Bottom in image space.
                    // We render from y=0 to y=0.9375.
                    // So we want texture from 1.0 (bottom) to 1.0 - 0.9375 (top of slice).
                    
                    // But here v1, v2 passed to addFace are flipped inside addFace if we pass raw 0,1?
                    // No, addFace takes final UVs?
                    // `renderSolidBlock` passes minV, maxV where minV is flipped.
                    
                    // Let's compute raw UVs relative to sprite.
                    // Full sprite: vTop=0, vBottom=1.
                    // We show bottom 15/16ths.
                    // So vTop for this face = 1 - 0.9375 = 0.0625.
                    // vBottom = 1.
                    
                    let h = maxY - minY; // 0.9375
                    uvV1 = (1.0 - h); // Top of the texture slice
                    uvV2 = 1.0; // Bottom of texture
                }

                // Flip for renderer
                let temp = uvV1; uvV1 = 1.0 - uvV2; uvV2 = 1.0 - temp;

                if (!ambientOcclusion) {
                    let level = world === null ? 15 : world.getTotalLightAt(x + face.x, y + face.y, z + face.z);
                    if (level < 1) level = 1;
                    let b = 0.9 / 15.0 * level + 0.1;
                    let shade = b * face.getShading();
                    this.tessellator.setColor(shade, shade, shade);
                }

                this.addFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, u1, uvV1, u2, uvV2);
            }
        }
    }

    isFarmlandMoist(world, x, y, z) {
        if (!world) return false;
        
        // Search 4 block radius for water (ID 9)
        // Water can be at same level or 1 block up
        for (let dx = -4; dx <= 4; dx++) {
            for (let dz = -4; dz <= 4; dz++) {
                let id = world.getBlockAt(x + dx, y, z + dz);
                if (id === 9) return true;
                
                id = world.getBlockAt(x + dx, y + 1, z + dz);
                if (id === 9) return true;
            }
        }
        return false;
    }

    renderSpawner(world, block, ambientOcclusion, x, y, z) {
        // Just render the cage blocks. Mob is rendered per-frame in WorldRenderer.
        this.renderSolidBlock(world, block, ambientOcclusion, x, y, z);
    }

    renderDropper(world, block, ambientOcclusion, x, y, z) {
        const redTexName = "../../random stuff.png";
        const furnaceTexName = "../../furnace.png.png";
        let originalTessellator = this.tessellator;
        let boundingBox = block.getBoundingBox(world, x, y, z);
        let meta = world ? world.getBlockDataAt(x, y, z) : 3; 

        for (let face of EnumBlockFace.values()) {
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                let isFront = false;
                if (meta === 0 && face === EnumBlockFace.BOTTOM) isFront = true;
                else if (meta === 1 && face === EnumBlockFace.TOP) isFront = true;
                else if (meta === 2 && face === EnumBlockFace.NORTH) isFront = true;
                else if (meta === 3 && face === EnumBlockFace.SOUTH) isFront = true;
                else if (meta === 4 && face === EnumBlockFace.WEST) isFront = true;
                else if (meta === 5 && face === EnumBlockFace.EAST) isFront = true;

                let texName, texIdx, cols;
                if (isFront) {
                    texName = redTexName; texIdx = 4; cols = 9;
                } else {
                    texName = furnaceTexName; cols = 4;
                    if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) texIdx = 3;
                    else texIdx = 2;
                }

                let tess = this.getTessellator(texName);
                this.bindCustomTexture(tess, texName);
                this.tessellator = tess;
                let spriteWidth = 1.0 / cols;
                let minU = texIdx * spriteWidth + 0.0005, maxU = (texIdx + 1) * spriteWidth - 0.0005;
                let minV = 0, maxV = 1;
                let tV = minV; minV = 1.0 - maxV; maxV = 1.0 - tV;
                let brightness = world ? world.getLightBrightness(x, y, z) : 1.0;
                this.tessellator.setColor(brightness * face.getShading(), brightness * face.getShading(), brightness * face.getShading());
                this.addFace(world, face, ambientOcclusion, x + boundingBox.minX, y + boundingBox.minY, z + boundingBox.minZ, x + boundingBox.maxX, y + boundingBox.maxY, z + boundingBox.maxZ, minU, minV, maxU, maxV, 1, 1, 1);
            }
        }
        this.tessellator = originalTessellator;
    }

    renderPortal(world, block, x, y, z) {
        if (!this.worldRenderer.texturePortal) return;

        // Ensure texture is bound (in case it was refreshed)
        if (this.portalTessellator.material.map !== this.worldRenderer.texturePortal) {
            this.portalTessellator.bindTexture(this.worldRenderer.texturePortal);
        }

        let originalTessellator = this.tessellator;
        this.tessellator = this.portalTessellator;
        
        // Full brightness for portal
        this.tessellator.setColor(1, 1, 1, 0.75); // Slightly transparent

        let minU = 0;
        let maxU = 1;
        let minV = 0;
        let maxV = 1;

        // Portal block usually rotates texture to look trippy
        // For now just render static faces, animation handled by offset in WorldRenderer

        // Render visible faces
        let values = EnumBlockFace.values();
        for (let i = 0; i < values.length; i++) {
            let face = values[i];
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                // Determine bounds
                // Default block bounds
                let minX = x, minY = y, minZ = z;
                let maxX = x + 1, maxY = y + 1, maxZ = z + 1;

                this.addFace(world, face, false, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV);
            }
        }

        this.tessellator = originalTessellator;
    }

    renderFire(world, block, x, y, z) {
        let texture = this.worldRenderer.minecraft.resources[block.textureName];
        if (!texture) return;

        // Bind texture to fireTessellator
        // Check if texture needs update (e.g. was null or different image)
        if (!this.fireTessellator.material.map || this.fireTessellator.material.map.image !== texture) {
            let threeTexture = new THREE.CanvasTexture(texture);
            threeTexture.magFilter = THREE.NearestFilter;
            threeTexture.minFilter = THREE.NearestFilter;
            threeTexture.flipY = false; // Fix texture being upside down
            threeTexture.wrapS = THREE.RepeatWrapping;
            threeTexture.wrapT = THREE.RepeatWrapping;
            
            // Dynamically determine frame count from aspect ratio
            // Assuming square frames (width x width)
            let frameCount = Math.round(texture.height / texture.width);
            if (frameCount < 1) frameCount = 1;
            threeTexture.repeat.set(1, 1/frameCount);
            
            // Store frame info for animator
            threeTexture.userData = { frameCount: frameCount };
            threeTexture.needsUpdate = true;
            
            // Store reference in WorldRenderer so we can update offset
            this.worldRenderer.fireTexture = threeTexture;
            
            this.fireTessellator.bindTexture(threeTexture);
        }

        let originalTessellator = this.tessellator;
        this.tessellator = this.fireTessellator;
        
        // Render bright
        this.tessellator.setColor(1, 1, 1);

        let minU = 0, maxU = 1;
        let minV = 0, maxV = 1;
        
        // Flip V logic (matches other render methods)
        let tempV = minV; minV = 1.0 - maxV; maxV = 1.0 - tempV;

        // Fire geometry
        let h = 1.4; 
        let x0 = x, x1 = x + 1;
        let z0 = z, z1 = z + 1;
        let y0 = y, y1 = y + h;

        // Diagonal 1 (Cross)
        this.tessellator.addVertexWithUV(x0, y1, z0, minU, minV);
        this.tessellator.addVertexWithUV(x0, y0, z0, minU, maxV);
        this.tessellator.addVertexWithUV(x1, y0, z1, maxU, maxV);
        this.tessellator.addVertexWithUV(x1, y1, z1, maxU, minV);
        
        // Diagonal 1 Back
        this.tessellator.addVertexWithUV(x1, y1, z1, maxU, minV);
        this.tessellator.addVertexWithUV(x1, y0, z1, maxU, maxV);
        this.tessellator.addVertexWithUV(x0, y0, z0, minU, maxV);
        this.tessellator.addVertexWithUV(x0, y1, z0, minU, minV);

        // Diagonal 2 (Cross)
        this.tessellator.addVertexWithUV(x0, y1, z1, minU, minV);
        this.tessellator.addVertexWithUV(x0, y0, z1, minU, maxV);
        this.tessellator.addVertexWithUV(x1, y0, z0, maxU, maxV);
        this.tessellator.addVertexWithUV(x1, y1, z0, maxU, minV);

        // Diagonal 2 Back
        this.tessellator.addVertexWithUV(x1, y1, z0, maxU, minV);
        this.tessellator.addVertexWithUV(x1, y0, z0, maxU, maxV);
        this.tessellator.addVertexWithUV(x0, y0, z1, minU, maxV);
        this.tessellator.addVertexWithUV(x0, y1, z1, minU, minV);
        
        // Side Faces (Slightly inset to avoid z-fighting with adjacent blocks)
        let o = 0.001; 
        let sx0 = x + o;
        let sx1 = x + 1 - o;
        let sz0 = z + o;
        let sz1 = z + 1 - o;

        // North Face
        this.tessellator.addVertexWithUV(sx0, y1, sz0, minU, minV);
        this.tessellator.addVertexWithUV(sx0, y0, sz0, minU, maxV);
        this.tessellator.addVertexWithUV(sx1, y0, sz0, maxU, maxV);
        this.tessellator.addVertexWithUV(sx1, y1, sz0, maxU, minV);
        
        // North Face (Inner)
        this.tessellator.addVertexWithUV(sx1, y1, sz0, maxU, minV);
        this.tessellator.addVertexWithUV(sx1, y0, sz0, maxU, maxV);
        this.tessellator.addVertexWithUV(sx0, y0, sz0, minU, maxV);
        this.tessellator.addVertexWithUV(sx0, y1, sz0, minU, minV);
        
        // South Face
        this.tessellator.addVertexWithUV(sx1, y1, sz1, minU, minV);
        this.tessellator.addVertexWithUV(sx1, y0, sz1, minU, maxV);
        this.tessellator.addVertexWithUV(sx0, y0, sz1, maxU, maxV);
        this.tessellator.addVertexWithUV(sx0, y1, sz1, maxU, minV);

        // South Face (Inner)
        this.tessellator.addVertexWithUV(sx0, y1, sz1, maxU, minV);
        this.tessellator.addVertexWithUV(sx0, y0, sz1, maxU, maxV);
        this.tessellator.addVertexWithUV(sx1, y0, sz1, minU, maxV);
        this.tessellator.addVertexWithUV(sx1, y1, sz1, minU, minV);
        
        // West Face
        this.tessellator.addVertexWithUV(sx0, y1, sz1, minU, minV);
        this.tessellator.addVertexWithUV(sx0, y0, sz1, minU, maxV);
        this.tessellator.addVertexWithUV(sx0, y0, sz0, maxU, maxV);
        this.tessellator.addVertexWithUV(sx0, y1, sz0, maxU, minV);

        // West Face (Inner)
        this.tessellator.addVertexWithUV(sx0, y1, sz0, maxU, minV);
        this.tessellator.addVertexWithUV(sx0, y0, sz0, maxU, maxV);
        this.tessellator.addVertexWithUV(sx0, y0, sz1, minU, maxV);
        this.tessellator.addVertexWithUV(sx0, y1, sz1, minU, minV);
        
        // East Face
        this.tessellator.addVertexWithUV(sx1, y1, sz0, minU, minV);
        this.tessellator.addVertexWithUV(sx1, y0, sz0, minU, maxV);
        this.tessellator.addVertexWithUV(sx1, y0, sz1, maxU, maxV);
        this.tessellator.addVertexWithUV(sx1, y1, sz1, maxU, minV);

        // East Face (Inner)
        this.tessellator.addVertexWithUV(sx1, y1, sz1, maxU, minV);
        this.tessellator.addVertexWithUV(sx1, y0, sz1, maxU, maxV);
        this.tessellator.addVertexWithUV(sx1, y0, sz0, minU, maxV);
        this.tessellator.addVertexWithUV(sx1, y1, sz0, minU, minV);

        this.tessellator = originalTessellator;
    }

    renderNether(world, block, ambientOcclusion, x, y, z) {
        let textureName = block.textureName; // "../../nether.png"
        let tess = this.getTessellator(textureName);
        
        if (!tess.material.map) {
             let tex = this.worldRenderer.minecraft.getThreeTexture(textureName);
             if (tex) {
                 tex.magFilter = THREE.NearestFilter;
                 tex.minFilter = THREE.NearestFilter;
                 tex.flipY = false;
                 tess.bindTexture(tex);
             }
        }

        let originalTessellator = this.tessellator;
        this.tessellator = tess;

        let boundingBox = block.getBoundingBox(world, x, y, z);
        let values = EnumBlockFace.values();

        let spriteCount = 5;
        let spriteWidth = 1 / spriteCount;
        
        // FIX: Inset UVs to prevent bleeding
        const eps = 0.0005;
        let minU = block.textureIndex * spriteWidth + eps;
        let maxU = block.textureIndex * spriteWidth + spriteWidth - eps;
        
        let minV = 0.0;
        let maxV = 1.0;
        
        // Flip V
        let tempV = minV; minV = 1.0 - maxV; maxV = 1.0 - tempV;

        for (let i = 0; i < values.length; i++) {
            let face = values[i];
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                let minX = x + boundingBox.minX;
                let minY = y + boundingBox.minY;
                let minZ = z + boundingBox.minZ;
                let maxX = x + boundingBox.maxX;
                let maxY = y + boundingBox.maxY;
                let maxZ = z + boundingBox.maxZ;

                let color = block.getColor(world, x, y, z, face);
                let red = (color >> 16 & 255) / 255.0;
                let green = (color >> 8 & 255) / 255.0;
                let blue = (color & 255) / 255.0;

                if (!ambientOcclusion) {
                    let level = world === null ? 15 : world.getTotalLightAt(x + face.x, y + face.y, z + face.z);
                    if (level < 1) level = 1;
                    let brightness = 0.9 / 15.0 * level + 0.1;

                    // Apply global brightness setting
                    let globalBrightness = this.worldRenderer.minecraft.settings.brightness;
                    brightness = brightness + (1.0 - brightness) * globalBrightness;

                    let shade = brightness * face.getShading();
                    this.tessellator.setColor(red * shade, green * shade, blue * shade);
                }

                this.addFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, red, green, blue);
            }
        }
        this.tessellator = originalTessellator;
    }

    renderSnowyGrass(world, block, ambientOcclusion, x, y, z) {
        // Snowy grass uses the snowy grass side texture on the sides and a
        // snow-textured top, with a dirt bottom.
        let sideTex = "../../snowygrassblockside.png";
        let topTex = "../../snow.png";
        let topTess = this.getTessellator(topTex);
        this.bindCustomTexture(topTess, topTex);
        let sideTess = this.getTessellator(sideTex);
        this.bindCustomTexture(sideTess, sideTex);

        // Bottom: Dirt (Dirt is atlas index 0 in this pack)
        let bottomTess = this.tessellator; // Bound to blocks.png

        let originalTessellator = this.tessellator;
        
        let boundingBox = block.getBoundingBox(world, x, y, z);
        let minX = x + boundingBox.minX;
        let minY = y + boundingBox.minY;
        let minZ = z + boundingBox.minZ;
        let maxX = x + boundingBox.maxX;
        let maxY = y + boundingBox.maxY;
        let maxZ = z + boundingBox.maxZ;

        // Render faces
        let values = EnumBlockFace.values();
        for (let i = 0; i < values.length; i++) {
            let face = values[i];
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                
                // Determine which tessellator and UVs
                let currentTess;
                let minU = 0, maxU = 1, minV = 0, maxV = 1;
                
                if (face === EnumBlockFace.TOP) {
                    currentTess = topTess;
                } else if (face === EnumBlockFace.BOTTOM) {
                    currentTess = bottomTess;
                    // Atlas UV for Dirt (Index 0)
                    let texIdx = 0; 
                    minU = (texIdx % 14) / 14.0;
                    maxU = minU + 1.0 / 14.0;
                } else {
                    currentTess = sideTess;
                }
                
                this.tessellator = currentTess;
                
                // Flip V
                let tempV = minV; minV = 1.0 - maxV; maxV = 1.0 - tempV;

                let red = 1.0, green = 1.0, blue = 1.0;

                if (!ambientOcclusion) {
                    let level = world === null ? 15 : world.getTotalLightAt(minX + face.x, minY + face.y, minZ + face.z);
                    
                    // Visual minimum light level 1
                    if (level < 1) level = 1;

                    let brightness = 0.9 / 15.0 * level + 0.1;
                    let shade = brightness * face.getShading();
                    currentTess.setColor(red * shade, green * shade, blue * shade);
                }

                this.addFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, red, green, blue);
            }
        }
        
        this.tessellator = originalTessellator;
    }

    bindCustomTexture(tessellator, name) {
        let tex = this.worldRenderer.minecraft.getThreeTexture(name);
        if (tex && tessellator.material.map !== tex) {
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            tex.flipY = false;
            tessellator.bindTexture(tex);
        }
    }

    renderSlab(world, block, ambientOcclusion, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let isTop = (meta & 8) !== 0;

        // Prepare tessellator
        let originalTessellator = this.tessellator;
        let isCustomTexture = false;

        if (block.textureName) {
            isCustomTexture = true;
            let tess = this.getTessellator(block.textureName);
            if (!tess.material.map) {
                let tex = this.worldRenderer.minecraft.getThreeTexture(block.textureName);
                if (tex) {
                    tex.magFilter = THREE.NearestFilter;
                    tex.minFilter = THREE.NearestFilter;
                    tex.flipY = false;
                    tess.bindTexture(tex);
                }
            }
            this.tessellator = tess;
        }

        // Visual fix: respect top vs bottom half
        let minY = isTop ? 0.5 : 0.0;
        let maxY = isTop ? 1.0 : 0.5;
        let boundingBox = new THREE.Box3(new THREE.Vector3(0, minY, 0), new THREE.Vector3(1, maxY, 1));
        this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, boundingBox, isCustomTexture);

        if (isCustomTexture) {
            this.tessellator = originalTessellator;
        }
    }

    renderDoubleSlab(world, block, ambientOcclusion, x, y, z) {
        if (!world) return;
        let meta = world.getBlockDataAt(x, y, z);
        const { bottom: bottomId, top: topId } = Block.getById(block.getId()).constructor.getSlabIdsFromMeta(meta);

        const bottomBlock = Block.getById(bottomId);
        const topBlock = Block.getById(topId);

        if (bottomBlock) {
            let originalTessellator = this.tessellator;
            let isCustom = !!bottomBlock.textureName;
            if (isCustom) {
                this.tessellator = this.getTessellator(bottomBlock.textureName);
                this.bindCustomTexture(this.tessellator, bottomBlock.textureName);
            }
            let bb = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0.5, 1));
            this.renderPartialBlock(world, bottomBlock, ambientOcclusion, x, y, z, bb, isCustom);
            this.tessellator = originalTessellator;
        }

        if (topBlock) {
            let originalTessellator = this.tessellator;
            let isCustom = !!topBlock.textureName;
            if (isCustom) {
                this.tessellator = this.getTessellator(topBlock.textureName);
                this.bindCustomTexture(this.tessellator, topBlock.textureName);
            }
            let bb = new THREE.Box3(new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(1, 1.0, 1));
            this.renderPartialBlock(world, topBlock, ambientOcclusion, x, y, z, bb, isCustom);
            this.tessellator = originalTessellator;
        }
    }

    renderStairs(world, block, ambientOcclusion, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 3; // Default meta 3 (East) for inventory
        let isUpsideDown = (meta & 8) !== 0;
        let dir = meta & 3;

        // Prepare tessellator
        let originalTessellator = this.tessellator;
        let isCustomTexture = false;

        if (block.textureName) {
            isCustomTexture = true;
            let tess = this.getTessellator(block.textureName);
            if (!tess.material.map) {
                let tex = this.worldRenderer.minecraft.getThreeTexture(block.textureName);
                if (tex) {
                    tex.magFilter = THREE.NearestFilter;
                    tex.minFilter = THREE.NearestFilter;
                    tex.flipY = false;
                    tess.bindTexture(tex);
                }
            }
            this.tessellator = tess;
        }

        // Base: Main slab part
        let minY = isUpsideDown ? 0.5 : 0.0;
        let maxY = isUpsideDown ? 1.0 : 0.5;
        let baseBox = new THREE.Box3(new THREE.Vector3(0, minY, 0), new THREE.Vector3(1, maxY, 1));
        this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, baseBox, isCustomTexture);

        // Step: Quarter block part
        let stepMinY = isUpsideDown ? 0.0 : 0.5;
        let stepMaxY = isUpsideDown ? 0.5 : 1.0;

        let shape = "straight";
        if (world) {
            let force = (meta >> 4) & 7;
            if (force > 0) {
                const shapes = [null, "straight", "inner_left", "inner_right", "outer_left", "outer_right"];
                shape = shapes[force] || "straight";
            } else {
                shape = this.getStairShape(world, x, y, z, dir, isUpsideDown, block.getId());
            }
        }

        let quads = [];
        const addBox = (minX, minZ, maxX, maxZ) => {
            quads.push(new THREE.Box3(new THREE.Vector3(minX, stepMinY, minZ), new THREE.Vector3(maxX, stepMaxY, maxZ)));
        };

        // Standard Step Half
        // 0=South (Z 0.5-1.0), 1=West (X 0.0-0.5), 2=North (Z 0.0-0.5), 3=East (X 0.5-1.0)
        if (dir === 0) addBox(0.0, 0.5, 1.0, 1.0);
        else if (dir === 1) addBox(0.0, 0.0, 0.5, 1.0);
        else if (dir === 2) addBox(0.0, 0.0, 1.0, 0.5);
        else if (dir === 3) addBox(0.5, 0.0, 1.0, 1.0);

        // Modify for corners
        if (shape.startsWith("outer")) {
            quads = []; // Re-construct for outer corners (keep only 1 quadrant)
            if (dir === 0) { // S
                if (shape === "outer_right") addBox(0.0, 0.5, 0.5, 1.0);
                else if (shape === "outer_left") addBox(0.5, 0.5, 1.0, 1.0);
            } else if (dir === 1) { // W
                if (shape === "outer_right") addBox(0.0, 0.0, 0.5, 0.5);
                else if (shape === "outer_left") addBox(0.0, 0.5, 0.5, 1.0);
            } else if (dir === 2) { // N
                if (shape === "outer_right") addBox(0.5, 0.0, 1.0, 0.5);
                else if (shape === "outer_left") addBox(0.0, 0.0, 0.5, 0.5);
            } else if (dir === 3) { // E
                if (shape === "outer_right") addBox(0.5, 0.5, 1.0, 1.0);
                else if (shape === "outer_left") addBox(0.5, 0.0, 1.0, 0.5);
            }
        } else if (shape.startsWith("inner")) {
            // Add extra quadrant
            if (dir === 0) { // S
                if (shape === "inner_right") addBox(0.0, 0.0, 0.5, 0.5);
                else if (shape === "inner_left") addBox(0.5, 0.0, 1.0, 0.5);
            } else if (dir === 1) { // W
                if (shape === "inner_right") addBox(0.5, 0.0, 1.0, 0.5);
                else if (shape === "inner_left") addBox(0.5, 0.5, 1.0, 1.0);
            } else if (dir === 2) { // N
                if (shape === "inner_right") addBox(0.5, 0.5, 1.0, 1.0);
                else if (shape === "inner_left") addBox(0.0, 0.5, 0.5, 1.0);
            } else if (dir === 3) { // E
                if (shape === "inner_right") addBox(0.0, 0.5, 0.5, 1.0);
                else if (shape === "inner_left") addBox(0.0, 0.0, 0.5, 0.5);
            }
        }

        for (let b of quads) {
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, b, isCustomTexture);
        }

        if (isCustomTexture) {
            this.tessellator = originalTessellator;
        }
    }

    getStairShape(world, x, y, z, dir, upsideDown, myId) {
        const isStair = (bx, by, bz) => world.getBlockAt(bx, by, bz) === myId;
        const getStairDir = (bx, by, bz) => {
            let meta = world.getBlockDataAt(bx, by, bz);
            if (((meta & 8) !== 0) !== upsideDown) return -1;
            return meta & 3;
        };

        let shape = "straight";

        // Check front neighbor for Outer Corner
        let fd = -1;
        if (dir === 0) fd = getStairDir(x, y, z + 1); // S
        else if (dir === 1) fd = getStairDir(x - 1, y, z); // W
        else if (dir === 2) fd = getStairDir(x, y, z - 1); // N
        else if (dir === 3) fd = getStairDir(x + 1, y, z); // E

        if (fd !== -1 && !isStair(x + (dir===3?1:dir===1?-1:0), y, z + (dir===0?1:dir===2?-1:0))) fd = -1;

        if (fd !== -1) {
            if (dir === 0) { if (fd === 1) shape = "outer_right"; else if (fd === 3) shape = "outer_left"; }
            else if (dir === 1) { if (fd === 2) shape = "outer_right"; else if (fd === 0) shape = "outer_left"; }
            else if (dir === 2) { if (fd === 3) shape = "outer_right"; else if (fd === 1) shape = "outer_left"; }
            else if (dir === 3) { if (fd === 0) shape = "outer_right"; else if (fd === 2) shape = "outer_left"; }
        }

        if (shape !== "straight") return shape;

        // Check back neighbor for Inner Corner
        let bd = -1;
        if (dir === 0) bd = getStairDir(x, y, z - 1); // N
        else if (dir === 1) bd = getStairDir(x + 1, y, z); // E
        else if (dir === 2) bd = getStairDir(x, y, z + 1); // S
        else if (dir === 3) bd = getStairDir(x - 1, y, z); // W

        if (bd !== -1 && !isStair(x + (dir===3?-1:dir===1?1:0), y, z + (dir===0?-1:dir===2?1:0))) bd = -1;

        if (bd !== -1) {
            if (dir === 0) { if (bd === 1) shape = "inner_right"; else if (bd === 3) shape = "inner_left"; }
            else if (dir === 1) { if (bd === 2) shape = "inner_right"; else if (bd === 0) shape = "inner_left"; }
            else if (dir === 2) { if (bd === 3) shape = "inner_right"; else if (bd === 1) shape = "inner_left"; }
            else if (dir === 3) { if (bd === 0) shape = "inner_right"; else if (bd === 2) shape = "inner_left"; }
        }

        return shape;
    }

    renderPartialBlock(world, block, ambientOcclusion, x, y, z, bb, isSingleTexture = false, forceFullUV = false) {
        let minX = x + bb.min.x;
        let minY = y + bb.min.y;
        let minZ = z + bb.min.z;
        let maxX = x + bb.max.x;
        let maxY = y + bb.max.y;
        let maxZ = z + bb.max.z;

        let values = EnumBlockFace.values();
        for (let i = 0; i < values.length; i++) {
            let face = values[i];

            // Calculate UVs based on bounding box relative position
            let u1 = 0, u2 = 1, v1 = 0, v2 = 1;
            
            // Map UVs to the partial face to avoid stretching
            if (!forceFullUV) {
                if (face === EnumBlockFace.NORTH || face === EnumBlockFace.SOUTH) {
                    u1 = bb.min.x; u2 = bb.max.x;
                    v1 = 1.0 - bb.max.y; v2 = 1.0 - bb.min.y; // Invert Y for V
                } else if (face === EnumBlockFace.WEST || face === EnumBlockFace.EAST) {
                    u1 = bb.min.z; u2 = bb.max.z;
                    v1 = 1.0 - bb.max.y; v2 = 1.0 - bb.min.y;
                } else {
                    // Top/Bottom
                    u1 = bb.min.x; u2 = bb.max.x;
                    v1 = bb.min.z; v2 = bb.max.z;
                }
            }

            // Add texture offset
            let minU, maxU, minV, maxV;

            let textureInfo = block.getTextureForFace(face);
            if (typeof textureInfo === 'object' && textureInfo.type === 'custom') {
                // Custom spritesheet UV logic
                let cols = textureInfo.cols || 1;
                let rows = textureInfo.rows || 1;
                let index = textureInfo.index || 0;
                
                let uBase = (index % cols) / cols;
                let vBase = Math.floor(index / cols) / rows;
                let spriteW = 1.0 / cols;
                let spriteH = 1.0 / rows;
                
                minU = uBase + u1 * spriteW;
                maxU = uBase + u2 * spriteW;
                minV = vBase + v1 * spriteH;
                maxV = vBase + v2 * spriteH;
            } else if (isSingleTexture) {
                // Single texture (0-1)
                minU = u1;
                maxU = u2;
                minV = v1;
                maxV = v2;
            } else {
                // Atlas texture
                let textureIndex = textureInfo;
                let texU = (textureIndex % 14) / 14.0;
                // Texture atlas U width
                let atlasW = 1.0 / 14.0;
                
                minU = texU + u1 * atlasW;
                maxU = texU + u2 * atlasW;
                minV = v1;
                maxV = v2;
            }

            // Flip V for renderer
            let tempV = minV;
            minV = 1.0 - maxV;
            maxV = 1.0 - tempV;

            let color = block.getColor(world, x, y, z, face);
            let red = (color >> 16 & 255) / 255.0;
            let green = (color >> 8 & 255) / 255.0;
            let blue = (color & 255) / 255.0;

            if (!ambientOcclusion) {
                let level = 15;
                if (world) {
                    // Use face normal offset for lighting check
                    level = world.getTotalLightAt(Math.floor(x + face.x), Math.floor(y + face.y), Math.floor(z + face.z));
                }
                
                // Visual minimum light level 1
                if (level < 1) level = 1;

                let brightness = 0.9 / 15.0 * level + 0.1;

                // Apply global brightness setting
                let globalBrightness = this.worldRenderer.minecraft.settings.brightness;
                brightness = brightness + (1.0 - brightness) * globalBrightness;

                let shade = brightness * face.getShading();
                this.tessellator.setColor(red * shade, green * shade, blue * shade);
            }

            this.addFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, red, green, blue);
        }
    }

    renderPainting(world, block, x, y, z) {
        // Textures
        let frontTex = this.worldRenderer.minecraft.getThreeTexture("../../paintingfront1by1.png");
        let backTex = this.worldRenderer.minecraft.getThreeTexture("../../paintingback.png");
        
        // Ensure filtering
        if (frontTex) {
            frontTex.magFilter = THREE.NearestFilter;
            frontTex.minFilter = THREE.NearestFilter;
            frontTex.flipY = false; // Standard UVs
        }
        
        if (backTex) {
            backTex.magFilter = THREE.NearestFilter;
            backTex.minFilter = THREE.NearestFilter;
            backTex.flipY = false;
        }

        // Get Tessellators from texture map or create/get generic ones
        // We use the textureTessellators map to get a tessellator for specific textures
        let frontTess = this.getTessellator("../../paintingfront1by1.png");
        let backTess = this.getTessellator("../../paintingback.png");

        // Bind textures if not already
        if (!frontTess.material.map && frontTex) frontTess.bindTexture(frontTex);
        if (!backTess.material.map && backTex) backTess.bindTexture(backTex);

        // Save original tessellator to restore later
        let originalTessellator = this.tessellator;

        // Determine orientation and variant
        let meta = world ? world.getBlockDataAt(x, y, z) : 2;
        let dir = meta & 7;
        let variant = (meta >> 3) & 3;

        // Select variant texture
        const variants = [
            "../../paintingfront1by1.png",
            "../../1x1painting2.webp",
            "../../1x1painting3.png"
        ];
        let variantPath = variants[variant] || variants[0];
        frontTess = this.getTessellator(variantPath);
        
        // Ensure variant texture is loaded and bound
        if (!frontTess.material.map) {
            let tex = this.worldRenderer.minecraft.getThreeTexture(variantPath);
            if (tex) {
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
                tex.flipY = false;
                frontTess.bindTexture(tex);
            }
        }

        let bb = block.getBoundingBox(world, x, y, z);
        
        let minX = x + bb.minX;
        let minY = y + bb.minY;
        let minZ = z + bb.minZ;
        let maxX = x + bb.maxX;
        let maxY = y + bb.maxY;
        let maxZ = z + bb.maxZ;

        // Determine visible face based on meta dir
        let frontFace = null;
        if (dir === 1) frontFace = EnumBlockFace.NORTH;
        else if (dir === 2) frontFace = EnumBlockFace.SOUTH;
        else if (dir === 3) frontFace = EnumBlockFace.WEST;
        else if (dir === 4) frontFace = EnumBlockFace.EAST;

        // Draw visible face with front texture
        this.tessellator = frontTess;
        this.tessellator.setColor(1, 1, 1);
        this.addFace(world, frontFace, false, minX, minY, minZ, maxX, maxY, maxZ, 0, 0, 1, 1);

        // Draw other faces with back texture
        this.tessellator = backTess;
        this.tessellator.setColor(1, 1, 1);
        
        // Iterate all faces, skip the front face
        let faces = EnumBlockFace.values();
        for (let f of faces) {
            if (f === frontFace) continue;
            
            // For side faces of the painting, we can just map a part of the back texture (wood)
            this.addFace(world, f, false, minX, minY, minZ, maxX, maxY, maxZ, 0, 0, 1, 1);
        }
        
        // Restore default tessellator
        this.tessellator = originalTessellator;
    }

    getTessellator(textureName) {
        if (!this.textureTessellators.has(textureName)) {
            this.textureTessellators.set(textureName, new Tessellator());
        }
        return this.textureTessellators.get(textureName);
    }

    renderMineralBlock(world, block, ambientOcclusion, x, y, z) {
        let tess = this.getTessellator(block.textureName);
        
        // Bind texture if not set
        if (!tess.material.map) {
             let tex = this.worldRenderer.minecraft.getThreeTexture(block.textureName);
             if (tex) {
                 tex.magFilter = THREE.NearestFilter;
                 tex.minFilter = THREE.NearestFilter;
                 tex.flipY = false;
                 tess.bindTexture(tex);
             }
        }

        let originalTessellator = this.tessellator;
        this.tessellator = tess;

        let boundingBox = block.getBoundingBox(world, x, y, z);

        let values = EnumBlockFace.values();
        for (let i = 0; i < values.length; i++) {
            let face = values[i];

            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                let minX = x + boundingBox.minX;
                let minY = y + boundingBox.minY;
                let minZ = z + boundingBox.minZ;
                let maxX = x + boundingBox.maxX;
                let maxY = y + boundingBox.maxY;
                let maxZ = z + boundingBox.maxZ;

                // Fix: Detect if texture is a strip or single square
                let spriteCount = 1;
                if (tess.material.map && tess.material.map.image) {
                    const img = tess.material.map.image;
                    if (img.width && img.height && img.width > img.height) {
                        // Assume strip if width > height (like ores)
                        // orestuff.png is 14 frames
                        spriteCount = Math.floor(img.width / img.height);
                    }
                }
                
                // Fallback for known strips if image check fails (e.g. not loaded yet)
                // FIX: Use exact check to avoid catching emerald_ore.png or redstone_ore.png via include()
                if (block.textureName && block.textureName.includes("orestuff.png")) spriteCount = 14;
                if (block.textureName && block.textureName.includes("redstonestuff.png")) spriteCount = 22;
                if (block.textureName && block.textureName.includes("endstuff.png")) spriteCount = 7;
                if (block.textureName && block.textureName.includes("nether.png")) spriteCount = 5;
                if (block.textureName && block.textureName.includes("quartz.png")) spriteCount = 8;
                if (block.textureName && block.textureName.includes("treestuff.png")) spriteCount = 30;
                if (block.textureName && block.textureName.includes("wools.png")) spriteCount = 15;
                // Animated blocks should map UV 0..1 in geometry so the material's offset/repeat can handle the animation frames.
                if (block.textureName && block.textureName.includes("magma")) spriteCount = 1;

                let spriteWidth = 1.0 / spriteCount;
                
                // FIX: Inset UVs to prevent bleeding
                const eps = 0.0005;
                let minU = (block.textureIndex || 0) * spriteWidth + eps;
                let maxU = (block.textureIndex || 0) * spriteWidth + spriteWidth - eps;
                
                let minV = 0;
                let maxV = 1;

                // Flip V
                let tempV = minV;
                minV = 1.0 - maxV;
                maxV = 1.0 - tempV;

                let color = block.getColor(world, x, y, z, face);
                let red = (color >> 16 & 255) / 255.0;
                let green = (color >> 8 & 255) / 255.0;
                let blue = (color & 255) / 255.0;

                if (!ambientOcclusion) {
                    // Keep mineral blocks on the same lighting curve and
                    // integer face sample as regular stone blocks.
                    let level = world === null ? 15 : world.getTotalLightAt(
                        Math.floor(minX + face.x),
                        Math.floor(minY + face.y),
                        Math.floor(minZ + face.z)
                    );
                    
                    // Visual minimum light level 1
                    if (level < 1) level = 1;

                    if (this.worldRenderer.minecraft.player?.activeEffects?.has("night_vision")) {
                        level = 15;
                    }

                    let brightness = this.getVisualLightBrightness(level);
                    let shade = brightness * face.getShading();
                    this.tessellator.setColor(red * shade, green * shade, blue * shade);
                }

                this.addFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, red, green, blue);
            }
        }

        this.tessellator = originalTessellator;
    }

    renderFurnace(world, block, ambientOcclusion, x, y, z) {
        let texture = this.worldRenderer.minecraft.resources[block.textureName];
        if (!texture) return;

        // Use furnace tessellator since it handles 4-slot sheets well and we bind texture anyway.
        if (!this.furnaceTessellator.material.map || this.furnaceTessellator.material.map.image !== texture) {
            let threeTexture = new THREE.CanvasTexture(texture);
            threeTexture.magFilter = THREE.NearestFilter;
            threeTexture.minFilter = THREE.NearestFilter;
            threeTexture.flipY = false; // Fix texture being upside down
            this.furnaceTessellator.bindTexture(threeTexture);
        }

        let originalTessellator = this.tessellator;
        this.tessellator = this.furnaceTessellator;

        let boundingBox = block.getBoundingBox(world, x, y, z);
        let meta = world ? world.getBlockDataAt(x, y, z) : 0; // Default to South for GUI visibility

        // Sheet: 0=Lit Front, 1=Unlit Front, 2=Side, 3=Top
        let spriteCount = 4;
        let spriteWidth = 1.0 / spriteCount;

        let values = EnumBlockFace.values();
        for (let i = 0; i < values.length; i++) {
            let face = values[i];

            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                let minX = x + boundingBox.minX;
                let minY = y + boundingBox.minY;
                let minZ = z + boundingBox.minZ;
                let maxX = x + boundingBox.maxX;
                let maxY = y + boundingBox.maxY;
                let maxZ = z + boundingBox.maxZ;

                let textureIndex = 2; // Side default (index 2)

                if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) {
                    textureIndex = 3; // Top
                } else {
                    // Check front
                    let isFront = false;
                    // Meta: 0=South, 1=West, 2=North, 3=East
                    let rotation = meta & 3;
                    
                    if (rotation === 0 && face === EnumBlockFace.SOUTH) isFront = true;
                    else if (rotation === 1 && face === EnumBlockFace.WEST) isFront = true;
                    else if (rotation === 2 && face === EnumBlockFace.NORTH) isFront = true;
                    else if (rotation === 3 && face === EnumBlockFace.EAST) isFront = true;

                    if (isFront) {
                        // 0 is Lit, 1 is Unlit. Lit state is bit 2 (val 4) of meta.
                        textureIndex = (meta & 4) !== 0 ? 0 : 1;
                    }
                }

                const eps = 0.0005;
                let minU = textureIndex * spriteWidth + eps;
                let maxU = (textureIndex + 1) * spriteWidth - eps;
                let minV = 0.0;
                let maxV = 1.0;

                // Flip V
                let tempV = minV;
                minV = 1.0 - maxV;
                maxV = 1.0 - tempV;

                let color = block.getColor(world, x, y, z, face);
                let red = (color >> 16 & 255) / 255.0;
                let green = (color >> 8 & 255) / 255.0;
                let blue = (color & 255) / 255.0;

                if (!ambientOcclusion) {
                    let level = world === null ? 15 : world.getTotalLightAt(minX + face.x, minY + face.y, minZ + face.z);
                    
                    // Visual minimum light level 1
                    if (level < 1) level = 1;

                    let brightness = 0.9 / 15.0 * level + 0.1;
                    let shade = brightness * face.getShading();
                    this.tessellator.setColor(red * shade, green * shade, blue * shade);
                }

                this.addFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, red, green, blue);
            }
        }

        this.tessellator = originalTessellator;
    }

    renderPumpkin(world, block, ambientOcclusion, x, y, z) {
        let texture = this.worldRenderer.minecraft.resources[block.textureName];
        if (!texture) return;

        // Use furnace tessellator since it handles 4-slot sheets well and we bind texture anyway.
        if (!this.furnaceTessellator.material.map || this.furnaceTessellator.material.map.image !== texture) {
            let threeTexture = new THREE.CanvasTexture(texture);
            threeTexture.magFilter = THREE.NearestFilter;
            threeTexture.minFilter = THREE.NearestFilter;
            threeTexture.flipY = false;
            this.furnaceTessellator.bindTexture(threeTexture);
        }

        let originalTessellator = this.tessellator;
        this.tessellator = this.furnaceTessellator;

        let boundingBox = block.getBoundingBox(world, x, y, z);
        let meta = world ? world.getBlockDataAt(x, y, z) : 0; // Default to South for GUI visibility

        // Sheet: 0=Top, 1=Side, 2=Front(Unlit), 3=Front(Lit)
        // (Based on description: 1st=Top, 2nd=Side, 3rd=Front, 4th=Jack)
        let spriteCount = 4;
        let spriteWidth = 1.0 / spriteCount;

        let values = EnumBlockFace.values();
        for (let i = 0; i < values.length; i++) {
            let face = values[i];

            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                let minX = x + boundingBox.minX;
                let minY = y + boundingBox.minY;
                let minZ = z + boundingBox.minZ;
                let maxX = x + boundingBox.maxX;
                let maxY = y + boundingBox.maxY;
                let maxZ = z + boundingBox.maxZ;

                let textureIndex = 1; // Side default

                if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) {
                    textureIndex = 0; // Top
                } else {
                    // Check front
                    let isFront = false;
                    // Meta: 0=South, 1=West, 2=North, 3=East
                    let rotation = meta & 3;
                    
                    if (rotation === 0 && face === EnumBlockFace.SOUTH) isFront = true;
                    else if (rotation === 1 && face === EnumBlockFace.WEST) isFront = true;
                    else if (rotation === 2 && face === EnumBlockFace.NORTH) isFront = true;
                    else if (rotation === 3 && face === EnumBlockFace.EAST) isFront = true;

                    if (isFront) {
                        textureIndex = block.isLit ? 3 : 2;
                    }
                }

                const eps = 0.0005;
                let minU = textureIndex * spriteWidth + eps;
                let maxU = (textureIndex + 1) * spriteWidth - eps;
                let minV = 0.0;
                let maxV = 1.0;

                // Flip V
                let tempV = minV;
                minV = 1.0 - maxV;
                maxV = 1.0 - tempV;

                let color = block.getColor(world, x, y, z, face);
                let red = (color >> 16 & 255) / 255.0;
                let green = (color >> 8 & 255) / 255.0;
                let blue = (color & 255) / 255.0;

                if (!ambientOcclusion) {
                    let level = world === null ? 15 : world.getTotalLightAt(minX + face.x, minY + face.y, minZ + face.z);
                    
                    // Visual minimum light level 1
                    if (level < 1) level = 1;

                    let brightness = 0.9 / 15.0 * level + 0.1;
                    let shade = brightness * face.getShading();
                    this.tessellator.setColor(red * shade, green * shade, blue * shade);
                }

                this.addFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, red, green, blue);
            }
        }

        this.tessellator = originalTessellator;
    }

    renderLadder(world, block, ambientOcclusion, x, y, z) {
        const texName = block.textureName || "../../items (1).png";
        let texture = this.worldRenderer.minecraft.getThreeTexture(texName);
        if (!texture) return;

        // Determine which tessellator to use (specific for ladder texture)
        let originalTessellator = this.tessellator;
        let ladderTess = this.getTessellator(texName);
        
        if (!ladderTess.material.map || ladderTess.material.map.image !== texture.image) {
            ladderTess.bindTexture(texture);
        }
        
        // Ensure double sided rendering for the flat ladder quad
        if (ladderTess.material.side !== THREE.DoubleSide) {
            ladderTess.material.side = THREE.DoubleSide;
            ladderTess.material.alphaTest = 0.1;
        }

        this.tessellator = ladderTess;

        let spriteCols = block.cols || 37;
        let spriteWidth = 1.0 / spriteCols;
        let uBase = (block.textureIndex !== undefined ? block.textureIndex : 36) * spriteWidth;

        // Inset UVs slightly to avoid bleeding from neighboring icons in the strip
        const eps = 0.0005;
        let minU = uBase + eps;
        let maxU = uBase + spriteWidth - eps;
        let minV = 0;
        let maxV = 1;
        
        // Flip V
        let tempV = minV; minV = 1.0 - maxV; maxV = 1.0 - tempV;

        let level = 15;
        if (world) {
            level = world.getTotalLightAt(x, y, z);
        }
        
        // Apply global brightness
        let light = level / 15.0;
        let globalBrightness = this.worldRenderer.minecraft.settings.brightness;
        let brightness = Math.pow(light, 1.5 - globalBrightness);
        brightness = 0.1 + 0.9 * brightness;

        let color = block.getColor(world, x, y, z, EnumBlockFace.NORTH);
        let r = (color >> 16 & 255) / 255.0;
        let g = (color >> 8 & 255) / 255.0;
        let b = (color & 255) / 255.0;
        
        this.tessellator.setColor(r * brightness, g * brightness, b * brightness);

        if (world === null) {
            // Inventory render: Flat quad centered
            // Render 0..1 in X/Y, Z=0.5
            this.tessellator.addVertexWithUV(x + 0, y + 1, z + 0.5, minU, minV); // TL
            this.tessellator.addVertexWithUV(x + 0, y + 0, z + 0.5, minU, maxV); // BL
            this.tessellator.addVertexWithUV(x + 1, y + 0, z + 0.5, maxU, maxV); // BR
            this.tessellator.addVertexWithUV(x + 1, y + 1, z + 0.5, maxU, minV); // TR
        } else {
            let meta = world.getBlockDataAt(x, y, z);
            let offset = 0.05; // Distance from wall

            // Standard Ladder Meta:
            // 2: Facing North (Attached to block at Z+1) -> Render at Z = 1.0 - offset
            // 3: Facing South (Attached to block at Z-1) -> Render at Z = 0.0 + offset
            // 4: Facing West  (Attached to block at X+1) -> Render at X = 1.0 - offset
            // 5: Facing East  (Attached to block at X-1) -> Render at X = 0.0 + offset

            if (meta === 2) { 
                let zPos = z + 1 - offset;
                this.tessellator.addVertexWithUV(x + 1, y + 1, zPos, minU, minV);
                this.tessellator.addVertexWithUV(x + 1, y + 0, zPos, minU, maxV);
                this.tessellator.addVertexWithUV(x + 0, y + 0, zPos, maxU, maxV);
                this.tessellator.addVertexWithUV(x + 0, y + 1, zPos, maxU, minV);
            } else if (meta === 3) {
                let zPos = z + offset;
                this.tessellator.addVertexWithUV(x + 0, y + 1, zPos, minU, minV);
                this.tessellator.addVertexWithUV(x + 0, y + 0, zPos, minU, maxV);
                this.tessellator.addVertexWithUV(x + 1, y + 0, zPos, maxU, maxV);
                this.tessellator.addVertexWithUV(x + 1, y + 1, zPos, maxU, minV);
            } else if (meta === 4) {
                let xPos = x + 1 - offset;
                this.tessellator.addVertexWithUV(xPos, y + 1, z + 0, minU, minV);
                this.tessellator.addVertexWithUV(xPos, y + 0, z + 0, minU, maxV);
                this.tessellator.addVertexWithUV(xPos, y + 0, z + 1, maxU, maxV);
                this.tessellator.addVertexWithUV(xPos, y + 1, z + 1, maxU, minV);
            } else if (meta === 5) {
                let xPos = x + offset;
                this.tessellator.addVertexWithUV(xPos, y + 1, z + 1, minU, minV);
                this.tessellator.addVertexWithUV(xPos, y + 0, z + 1, minU, maxV);
                this.tessellator.addVertexWithUV(xPos, y + 0, z + 0, maxU, maxV);
                this.tessellator.addVertexWithUV(xPos, y + 1, z + 0, maxU, minV);
            } else {
                // Fallback (e.g. meta 0)
                let zPos = z + 0.5;
                this.tessellator.addVertexWithUV(x + 1, y + 1, zPos, minU, minV);
                this.tessellator.addVertexWithUV(x + 1, y + 0, zPos, minU, maxV);
                this.tessellator.addVertexWithUV(x + 0, y + 0, zPos, maxU, maxV);
                this.tessellator.addVertexWithUV(x + 0, y + 1, zPos, maxU, minV);
            }
        }

        // Restore original tessellator
        this.tessellator = originalTessellator;
    }

    renderFence(world, block, ambientOcclusion, x, y, z) {
        // Prepare tessellator
        let originalTessellator = this.tessellator;
        let isCustomTexture = false;

        if (block.textureName) {
            isCustomTexture = true;
            let tess = this.getTessellator(block.textureName);
            this.bindCustomTexture(tess, block.textureName);
            this.tessellator = tess;
        }

        // Center Post: 0.375 to 0.625 (Width 0.25)
        let postBox = new THREE.Box3(
            new THREE.Vector3(0.375, 0.0, 0.375),
            new THREE.Vector3(0.625, 1.0, 0.625)
        );
        this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, postBox, isCustomTexture);

        if (!world) {
            // Inventory renderer: Draw side posts to look like reference icon
            let rail1 = new THREE.Box3(new THREE.Vector3(0.625, 0.75, 0.4375), new THREE.Vector3(1.0, 0.9375, 0.5625));
            let rail2 = new THREE.Box3(new THREE.Vector3(0.625, 0.375, 0.4375), new THREE.Vector3(1.0, 0.5625, 0.5625));
            let rail3 = new THREE.Box3(new THREE.Vector3(0.0, 0.75, 0.4375), new THREE.Vector3(0.375, 0.9375, 0.5625));
            let rail4 = new THREE.Box3(new THREE.Vector3(0.0, 0.375, 0.4375), new THREE.Vector3(0.375, 0.5625, 0.5625));
            
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, rail1, isCustomTexture);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, rail2, isCustomTexture);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, rail3, isCustomTexture);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, rail4, isCustomTexture);
            
            if (isCustomTexture) this.tessellator = originalTessellator;
            return;
        }

        // Check connections
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let forced = (meta & 16) !== 0;
        let connectN, connectS, connectW, connectE;

        if (forced) {
            connectN = (meta & 1) !== 0;
            connectS = (meta & 2) !== 0;
            connectW = (meta & 4) !== 0;
            connectE = (meta & 8) !== 0;
        } else {
            connectN = block.canConnect(world, x, y, z - 1);
            connectS = block.canConnect(world, x, y, z + 1);
            connectW = block.canConnect(world, x - 1, y, z);
            connectE = block.canConnect(world, x + 1, y, z);
        }

        let y1Min = 0.75, y1Max = 0.9375;
        let y2Min = 0.375, y2Max = 0.5625;
        let widthMin = 0.4375, widthMax = 0.5625;

        if (connectN) {
            let r1 = new THREE.Box3(new THREE.Vector3(widthMin, y1Min, 0.0), new THREE.Vector3(widthMax, y1Max, 0.375));
            let r2 = new THREE.Box3(new THREE.Vector3(widthMin, y2Min, 0.0), new THREE.Vector3(widthMax, y2Max, 0.375));
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, r1, isCustomTexture);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, r2, isCustomTexture);
        }
        if (connectS) {
            let r1 = new THREE.Box3(new THREE.Vector3(widthMin, y1Min, 0.625), new THREE.Vector3(widthMax, y1Max, 1.0));
            let r2 = new THREE.Box3(new THREE.Vector3(widthMin, y2Min, 0.625), new THREE.Vector3(widthMax, y2Max, 1.0));
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, r1, isCustomTexture);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, r2, isCustomTexture);
        }
        if (connectW) {
            let r1 = new THREE.Box3(new THREE.Vector3(0.0, y1Min, widthMin), new THREE.Vector3(0.375, y1Max, widthMax));
            let r2 = new THREE.Box3(new THREE.Vector3(0.0, y2Min, widthMin), new THREE.Vector3(0.375, y2Max, widthMax));
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, r1, isCustomTexture);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, r2, isCustomTexture);
        }
        if (connectE) {
            let r1 = new THREE.Box3(new THREE.Vector3(0.625, y1Min, widthMin), new THREE.Vector3(1.0, y1Max, widthMax));
            let r2 = new THREE.Box3(new THREE.Vector3(0.625, y2Min, widthMin), new THREE.Vector3(1.0, y2Max, widthMax));
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, r1, isCustomTexture);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, r2, isCustomTexture);
        }

        if (isCustomTexture) this.tessellator = originalTessellator;
    }

    renderFenceGate(world, block, ambientOcclusion, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let dir = meta & 3;
        let open = (meta & 4) !== 0;

        // Texture 8 (Planks)
        let spriteWidth = 1.0 / 14.0; // 14 columns
        let textureIndex = 8;
        let minU = textureIndex * spriteWidth;
        let maxU = minU + spriteWidth;
        let minV = 0.0;
        let maxV = 1.0;
        
        // Flip V
        let tV = minV; minV = 1.0 - maxV; maxV = 1.0 - tV;

        // UVs for posts (full height, partial width)
        // 4 pixels = 0.25 width
        let uSize = (maxU - minU);
        let postU1 = minU + uSize * 0.375; // 6/16
        let postU2 = minU + uSize * 0.625; // 10/16

        // Posts are 4x4 pixels (0.25x0.25 blocks), height 1.0
        // Positioned at borders.
        // Along axis:
        // If gate runs along X (Dir 0/2): Posts at X=0 and X=0.75? No, X=0 and X=1-width.
        // Post size 0.25. So 0.0-0.25 and 0.75-1.0.
        // Z is centered (0.375 to 0.625).

        // Determine axis
        let alongX = (dir === 0 || dir === 2);
        
        // If open, the bar swings.
        
        // 2. Render Gate Plank
        if (open) {
            // Render wings for open gate (swung 90 degrees)
            
            // Dimensions for bars
            let y1Min = 0.75, y1Max = 0.9375;
            let y2Min = 0.375, y2Max = 0.5625;
            let wThick = 0.125; // Thickness
            let halfThick = wThick / 2;
            
            let boxes = [];
            
            // Assuming opening direction is positive (+Z or +X) for simplicity
            
            if (alongX) {
                // Closed was along X. Open wings extend along Z.
                // Left Wing hinges at 0. Right Wing hinges at 1.
                
                let zStart = 0.5; // Start at center line (where it was closed)
                let zEnd = 1.0;   // Swing out 0.5 units
                
                // Wing 1 (Left, X=0)
                boxes.push(new THREE.Box3(new THREE.Vector3(0.0, y1Min, zStart), new THREE.Vector3(0.125, y1Max, zEnd))); // Top
                boxes.push(new THREE.Box3(new THREE.Vector3(0.0, y2Min, zStart), new THREE.Vector3(0.125, y2Max, zEnd))); // Bottom
                // Vertical joiner at tip
                boxes.push(new THREE.Box3(new THREE.Vector3(0.0, y2Max, zEnd - 0.125), new THREE.Vector3(0.125, y1Min, zEnd)));

                // Wing 2 (Right, X=1)
                boxes.push(new THREE.Box3(new THREE.Vector3(0.875, y1Min, zStart), new THREE.Vector3(1.0, y1Max, zEnd))); // Top
                boxes.push(new THREE.Box3(new THREE.Vector3(0.875, y2Min, zStart), new THREE.Vector3(1.0, y2Max, zEnd))); // Bottom
                // Vertical joiner at tip
                boxes.push(new THREE.Box3(new THREE.Vector3(0.875, y2Max, zEnd - 0.125), new THREE.Vector3(1.0, y1Min, zEnd)));

            } else {
                // Along Z originally. Open wings extend along X.
                
                let xStart = 0.5;
                let xEnd = 1.0;
                
                // Wing 1 (Back, Z=0)
                boxes.push(new THREE.Box3(new THREE.Vector3(xStart, y1Min, 0.0), new THREE.Vector3(xEnd, y1Max, 0.125))); // Top
                boxes.push(new THREE.Box3(new THREE.Vector3(xStart, y2Min, 0.0), new THREE.Vector3(xEnd, y2Max, 0.125))); // Bottom
                // Vertical joiner at tip
                boxes.push(new THREE.Box3(new THREE.Vector3(xEnd - 0.125, y2Max, 0.0), new THREE.Vector3(xEnd, y1Min, 0.125)));

                // Wing 2 (Front, Z=1)
                boxes.push(new THREE.Box3(new THREE.Vector3(xStart, y1Min, 0.875), new THREE.Vector3(xEnd, y1Max, 1.0))); // Top
                boxes.push(new THREE.Box3(new THREE.Vector3(xStart, y2Min, 0.875), new THREE.Vector3(xEnd, y2Max, 1.0))); // Bottom
                // Vertical joiner at tip
                boxes.push(new THREE.Box3(new THREE.Vector3(xEnd - 0.125, y2Max, 0.875), new THREE.Vector3(xEnd, y1Min, 1.0)));
            }
            
            for (let b of boxes) {
                this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, b);
            }
            
            return;
        }
        
        // Render Closed Gate Bar
        // Connects 0.0 to 1.0 (Full width).
        // Dimensions:
        // Top Bar: Y=0.75-0.9375
        // Bottom Bar: Y=0.375-0.5625
        // Thickness: 0.125 (0.4375 - 0.5625)
        
        let barY1_min = 0.75, barY1_max = 0.9375;
        let barY2_min = 0.375, barY2_max = 0.5625;
        let thickMin = 0.4375, thickMax = 0.5625;
        
        if (alongX) {
            // Along X: Z is thickness
            let b1 = new THREE.Box3(new THREE.Vector3(0.0, barY1_min, thickMin), new THREE.Vector3(1.0, barY1_max, thickMax));
            let b2 = new THREE.Box3(new THREE.Vector3(0.0, barY2_min, thickMin), new THREE.Vector3(1.0, barY2_max, thickMax));
            
            // Center vertical joiner
            let b3 = new THREE.Box3(new THREE.Vector3(0.4375, barY2_max, thickMin), new THREE.Vector3(0.5625, barY1_min, thickMax));
            
            // Side frames (to close the ends)
            let b4 = new THREE.Box3(new THREE.Vector3(0.0, barY2_min, thickMin), new THREE.Vector3(0.125, barY1_max, thickMax));
            let b5 = new THREE.Box3(new THREE.Vector3(0.875, barY2_min, thickMin), new THREE.Vector3(1.0, barY1_max, thickMax));

            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, b1);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, b2);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, b3);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, b4);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, b5);
        } else {
            // Along Z: X is thickness
            let b1 = new THREE.Box3(new THREE.Vector3(thickMin, barY1_min, 0.0), new THREE.Vector3(thickMax, barY1_max, 1.0));
            let b2 = new THREE.Box3(new THREE.Vector3(thickMin, barY2_min, 0.0), new THREE.Vector3(thickMax, barY2_max, 1.0));
            
            let b3 = new THREE.Box3(new THREE.Vector3(thickMin, barY2_max, 0.4375), new THREE.Vector3(thickMax, barY1_min, 0.5625));

            // Side frames
            let b4 = new THREE.Box3(new THREE.Vector3(thickMin, barY2_min, 0.0), new THREE.Vector3(thickMax, barY1_max, 0.125));
            let b5 = new THREE.Box3(new THREE.Vector3(thickMin, barY2_min, 0.875), new THREE.Vector3(thickMax, barY1_max, 1.0));

            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, b1);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, b2);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, b3);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, b4);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, b5);
        }
    }

    renderLever(world, block, ambientOcclusion, x, y, z) {
        let originalTessellator = this.tessellator;
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let orientation = meta & 7;
        let active = (meta & 8) !== 0;
        let brightness = world ? world.getLightBrightness(x, y, z) : 1.0;

        // 1. Render Base (Cobblestone)
        let bW = 0.1875, bH = 0.1875, bL = 0.25;
        let bx1, bx2, by1, by2, bz1, bz2;
        
        // Default Floor NS
        bx1 = 0.5 - bW; bx2 = 0.5 + bW; by1 = 0; by2 = 0.2; bz1 = 0.5 - bL; bz2 = 0.5 + bL;

        if (orientation === 1) { bx1 = 0; bx2 = 0.2; by1 = 0.5 - bW; by2 = 0.5 + bW; bz1 = 0.5 - bL; bz2 = 0.5 + bL; }
        else if (orientation === 2) { bx1 = 0.8; bx2 = 1.0; by1 = 0.5 - bW; by2 = 0.5 + bW; bz1 = 0.5 - bL; bz2 = 0.5 + bL; }
        else if (orientation === 3) { bx1 = 0.5 - bL; bx2 = 0.5 + bL; by1 = 0.5 - bW; by2 = 0.5 + bW; bz1 = 0; bz2 = 0.2; }
        else if (orientation === 4) { bx1 = 0.5 - bL; bx2 = 0.5 + bL; by1 = 0.5 - bW; by2 = 0.5 + bW; bz1 = 0.8; bz2 = 1.0; }
        else if (orientation === 5) { bx1 = 0.5 - bL; bx2 = 0.5 + bL; by1 = 0; by2 = 0.2; bz1 = 0.5 - bW; bz2 = 0.5 + bW; }
        else if (orientation === 0 || orientation === 7) { by1 = 0.8; by2 = 1.0; }

        let baseBox = new THREE.Box3(new THREE.Vector3(bx1, by1, bz1), new THREE.Vector3(bx2, by2, bz2));
        this.tessellator = originalTessellator;
        this.tessellator.setColor(brightness, brightness, brightness);
        let cobbleBlock = { 
            getTextureForFace: () => 4, 
            getColor: () => 0xFFFFFF, 
            isTranslucent: () => false,
            shouldRenderFace: () => true 
        };
        this.renderPartialBlock(world, cobbleBlock, ambientOcclusion, x, y, z, baseBox, false);

        // 2. Render Handle (lever.png)
        let leverTess = this.getTessellator("../../lever.png");
        this.bindCustomTexture(leverTess, "../../lever.png");
        this.tessellator = leverTess;
        this.tessellator.setColor(brightness, brightness, brightness);

        // Sample a centered 2x10 pixel crop from the lever texture, matching torch UV logic
        let px = 1/16;
        let hMinU = 7 * px, hMaxU = 9 * px;
        let hMinV = 0 * px, hMaxV = 8.5 * px; // Reduced crop height to match 15% reduction
        let tmpV = hMinV; hMinV = 1.0 - hMaxV; hMaxV = 1.0 - tmpV;

        // Stick Pivot and endpoints
        let sw = 0.0725; // stick half-width (slightly wider)
        let sl = 0.53125;  // stick length (15% less tall: 0.625 * 0.85)
        let tilt = active ? 0.6 : -0.6; // Tilt angle

        // Apply Torch-like distortion
        let hx = x + 0.5, hy = y + (orientation === 0 || orientation === 7 ? 0.8 : 0.2), hz = z + 0.5;
        let dx = 0, dz = 0;

        // Determine tilt direction based on orientation
        // Meta 5/6 are floors. 1-4 are walls.
        if (orientation === 5 || orientation === 1 || orientation === 2) { 
             dx = Math.sin(tilt) * sl;
        } else { 
             dz = Math.sin(tilt) * sl;
        }
        
        // Fix inverted height for ceiling placement
        let actualSl = sl;
        if (orientation === 0 || orientation === 7) actualSl = -sl;

        let mX1 = hx - sw, mX2 = hx + sw;
        let mY1 = hy, mY2 = hy + actualSl * Math.cos(tilt);
        let mZ1 = hz - sw, mZ2 = hz + sw;

        this.addDistortFace(world, EnumBlockFace.NORTH, false, mX1 + dx, mY1, mZ1 + dz, mX2 + dx, mY2, mZ1 + dz, hMinU, hMinV, hMaxU, hMaxV, -dx, -dz);
        this.addDistortFace(world, EnumBlockFace.SOUTH, false, mX1 + dx, mY1, mZ2 + dz, mX2 + dx, mY2, mZ2 + dz, hMinU, hMinV, hMaxU, hMaxV, -dx, -dz);
        this.addDistortFace(world, EnumBlockFace.WEST, false, mX1 + dx, mY1, mZ1 + dz, mX1 + dx, mY2, mZ2 + dz, hMinU, hMinV, hMaxU, hMaxV, -dx, -dz);
        this.addDistortFace(world, EnumBlockFace.EAST, false, mX2 + dx, mY1, mZ1 + dz, mX2 + dx, mY2, mZ2 + dz, hMinU, hMinV, hMaxU, hMaxV, -dx, -dz);
        
        // Proper top face rendering (2x2 crop), matching torch top face logic
        // Use pixels 8-10 for the top tip (flipped)
        let sMinV = 1.0 - (10 * px), sMaxV = 1.0 - (8 * px);
        this.addFace(world, EnumBlockFace.TOP, false, mX1 + dx, mY2, mZ1 + dz, mX2 + dx, mY2, mZ2 + dz, hMinU, sMinV, hMaxU, sMaxV);

        this.tessellator = originalTessellator;
    }

    // The command block uses four separate animated textures rather than one
    // sheet, so each face binds its own tessellator. Frames are stacked
    // vertically and selected through the material's repeat/offset, which is
    // the same mechanism fire, water and the portal already use.
    static COMMAND_BLOCK_TEXTURES = {
        front: "../../command_block_front.png",
        back: "../../command_block_back.png",
        side: "../../command_block_side.png",
        conditional: "../../command_block_conditional.png"
    };
    static COMMAND_BLOCK_FRAMES = 4;

    // Unit vector each facing value points at. 0=South, 1=West, 2=North, 3=East.
    static COMMAND_BLOCK_FACING = [
        { x: 0, z: 1 },
        { x: -1, z: 0 },
        { x: 0, z: -1 },
        { x: 1, z: 0 }
    ];

    /**
     * Which of the four textures a face uses. Top and bottom take the side
     * texture, matching the vanilla model, and a conditional block swaps the
     * side texture for the chevron variant.
     */
    commandBlockTextureFor(dir, conditional, face) {
        const names = BlockRenderer.COMMAND_BLOCK_TEXTURES;
        const facing = BlockRenderer.COMMAND_BLOCK_FACING[dir & 3];
        if (face.y === 0) {
            if (face.x === facing.x && face.z === facing.z) return names.front;
            if (face.x === -facing.x && face.z === -facing.z) return names.back;
        }
        return conditional ? names.conditional : names.side;
    }

    getCommandBlockTessellator(textureName) {
        let tess = this.getTessellator(textureName);
        let tex = this.worldRenderer.minecraft.getThreeTexture(textureName);
        if (!tex) return null;

        // Command-block sheets are 16x(16 * frameCount). Always configure the
        // existing texture as well as the first-time path: resource textures
        // can be reused by the loader and may otherwise retain repeat=1,
        // which exposes the complete animation sheet on every face.
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.flipY = false;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 1 / BlockRenderer.COMMAND_BLOCK_FRAMES);
        tex.needsUpdate = true;
        tess.bindTexture(tex);
        return tess;
    }

    renderCommandBlock(world, block, ambientOcclusion, x, y, z) {
        let originalTessellator = this.tessellator;
        const names = BlockRenderer.COMMAND_BLOCK_TEXTURES;

        // Fall back to the old single-texture path if the set is unavailable,
        // so a missing file degrades instead of rendering an invisible block.
        const frontTess = this.getCommandBlockTessellator(names.front);
        if (!frontTess) {
            this.renderMineralBlock(world, block, ambientOcclusion, x, y, z);
            this.tessellator = originalTessellator;
            return;
        }

        let boundingBox = block.getBoundingBox(world, x, y, z);
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let dir = meta & 3;                       // 0=S, 1=W, 2=N, 3=E
        let conditional = (meta & 8) !== 0;       // bit 3 marks conditional

        for (let face of EnumBlockFace.values()) {
            if (world !== null && !block.shouldRenderFace(world, x, y, z, face)) continue;

            let textureName = this.commandBlockTextureFor(dir, conditional, face);
            let tess = this.getCommandBlockTessellator(textureName);
            if (!tess) continue;
            this.tessellator = tess;

            let color = block.getColor(world, x, y, z, face);
            let red = (color >> 16 & 255) / 255.0, green = (color >> 8 & 255) / 255.0, blue = (color & 255) / 255.0;

            if (!ambientOcclusion && world) {
                let level = world.getTotalLightAt(x + face.x, y + face.y, z + face.z);
                let brightness = 0.9 / 15.0 * Math.max(1, level) + 0.1;
                this.tessellator.setColor(red * brightness, green * brightness, blue * brightness);
            } else if (!world) {
                this.tessellator.setColor(1, 1, 1);
            }

            // Geometry spans the full 0..1 range; the material's repeat/offset
            // narrows it to the current frame.
            this.addFace(world, face, ambientOcclusion,
                x + boundingBox.minX, y + boundingBox.minY, z + boundingBox.minZ,
                x + boundingBox.maxX, y + boundingBox.maxY, z + boundingBox.maxZ,
                0.0, 0.0, 1.0, 1.0, red, green, blue);
        }

        this.tessellator = originalTessellator;
    }

    renderEndPortalFrame(world, block, ambientOcclusion, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let originalTessellator = this.tessellator;
        let tess = this.getTessellator(block.textureName);
        
        if (!tess.material.map) {
            let tex = this.worldRenderer.minecraft.getThreeTexture(block.textureName);
            if (tex) {
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
                tex.flipY = false;
                tess.bindTexture(tex);
            }
        }
        this.tessellator = tess;

        let boundingBox = block.getBoundingBox(world, x, y, z);
        let spriteCols = 7;
        let spriteWidth = 1.0 / spriteCols;

        for (let face of EnumBlockFace.values()) {
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                let textureInfo = block.getTextureForFace(face, meta);
                let textureIndex = textureInfo.index;

                // Adjust height: Sides are full block, Top is recessed by 0.2
                let currentMaxY = 1.0;
                if (face === EnumBlockFace.TOP) {
                    // Always render index 3 (empty top) as base
                    textureIndex = 3;
                    currentMaxY = 0.8;
                }

                const eps = 0.0005;
                let minU = textureIndex * spriteWidth + eps;
                let maxU = (textureIndex + 1) * spriteWidth - eps;
                let minV = 0.0, maxV = 1.0;
                
                let tempV = minV; minV = 1.0 - maxV; maxV = 1.0 - tempV;

                let color = block.getColor(world, x, y, z, face);
                let red = (color >> 16 & 255) / 255.0, green = (color >> 8 & 255) / 255.0, blue = (color & 255) / 255.0;

                if (!ambientOcclusion && world) {
                    let level = world.getTotalLightAt(x + face.x, y + face.y, z + face.z);
                    let b = 0.9 / 15.0 * Math.max(1, level) + 0.1;
                    this.tessellator.setColor(red * b * face.getShading(), green * b * face.getShading(), blue * b * face.getShading());
                } else if (!world) this.tessellator.setColor(1, 1, 1);

                this.addFace(world, face, ambientOcclusion, x, y, z, x + 1, y + currentMaxY, z + 1, minU, minV, maxU, maxV, red, green, blue);

                // Overlay the Eye of Ender (Index 4) if present
                if (face === EnumBlockFace.TOP && (meta & 4) !== 0) {
                    let overlayIdx = 4;
                    let oMinU = overlayIdx * spriteWidth + eps;
                    let oMaxU = (overlayIdx + 1) * spriteWidth - eps;
                    
                    // Render slightly higher than recessed face to avoid Z-fighting
                    this.addFace(world, face, ambientOcclusion, x, y, z, x + 1, y + 0.8 + 0.001, z + 1, oMinU, minV, oMaxU, maxV, red, green, blue);
                }
            }
        }
        this.tessellator = originalTessellator;
    }

    renderLilyPad(world, block, x, y, z) {
        let originalTessellator = this.tessellator;
        let texName = "../../newblocksset1.png";
        let tess = this.getTessellator(texName);
        this.bindCustomTexture(tess, texName);
        this.tessellator = tess;

        let spriteWidth = 1.0 / 9.0;
        let minU = 8 * spriteWidth + 0.0005, maxU = 9 * spriteWidth - 0.0005;
        let minV = 0, maxV = 1;
        let tV = minV; minV = 1.0 - maxV; maxV = 1.0 - tV;

        let brightness = world ? world.getLightBrightness(x, y, z) : 1.0;
        let color = block.getColor(world, x, y, z, null);
        let r = (color >> 16 & 255) / 255.0;
        let g = (color >> 8 & 255) / 255.0;
        let b = (color & 255) / 255.0;
        this.tessellator.setColor(r * brightness, g * brightness, b * brightness);

        // Flat plane on water surface
        let yPos = y + 0.015;
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let dir = meta & 3;

        // Rotation logic: rotate corners relative to (0.5, 0.5)
        let offsets = [
            [0, 1], [0, 0], [1, 0], [1, 1]
        ];
        // Rotate indices in the offsets array based on direction meta
        // dir 0: no change. dir 1: shift 1. etc.
        for(let i=0; i<dir; i++) {
            offsets.push(offsets.shift());
        }

        this.tessellator.addVertexWithUV(x + offsets[0][0], yPos, z + offsets[0][1], minU, maxV);
        this.tessellator.addVertexWithUV(x + offsets[1][0], yPos, z + offsets[1][1], minU, minV);
        this.tessellator.addVertexWithUV(x + offsets[2][0], yPos, z + offsets[2][1], maxU, minV);
        this.tessellator.addVertexWithUV(x + offsets[3][0], yPos, z + offsets[3][1], maxU, maxV);

        this.tessellator = originalTessellator;
    }

    renderPane(world, block, ambientOcclusion, x, y, z) {
        let originalTessellator = this.tessellator;
        let texName = "../../newblocksset1.png";
        let tess = this.getTessellator(texName);
        this.bindCustomTexture(tess, texName);
        this.tessellator = tess;

        let connectN = block.canConnect(world, x, y, z - 1);
        let connectS = block.canConnect(world, x, y, z + 1);
        let connectW = block.canConnect(world, x - 1, y, z);
        let connectE = block.canConnect(world, x + 1, y, z);

        if (!connectN && !connectS && !connectW && !connectE) {
            connectN = connectS = connectW = connectE = true;
        }

        let thick = 0.125;
        let x1 = 0.5 - thick / 2, x2 = 0.5 + thick / 2;
        let z1 = 0.5 - thick / 2, z2 = 0.5 + thick / 2;

        let level = world ? world.getTotalLightAt(x, y, z) : 15;
        let brightness = 0.9 / 15.0 * Math.max(1, level) + 0.1;
        this.tessellator.setColor(brightness, brightness, brightness);

        const part = (bx1, bz1, bx2, bz2) => {
            let bb = new THREE.Box3(new THREE.Vector3(bx1, 0, bz1), new THREE.Vector3(bx2, 1, bz2));
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, bb, false, false);
        };

        part(x1, z1, x2, z2);
        if (connectN) part(x1, 0, x2, z1);
        if (connectS) part(x1, z2, x2, 1);
        if (connectW) part(0, z1, x1, z2);
        if (connectE) part(x2, z1, 1, z2);

        this.tessellator = originalTessellator;
    }

    renderGrassPath(world, block, ambientOcclusion, x, y, z) {
        let partBox = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0.9375, 1));
        this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, partBox, false, false);
    }

    renderAnvil(world, block, ambientOcclusion, x, y, z) {
        let originalTessellator = this.tessellator;
        let sideTess = this.getTessellator("../../anvil.png");
        this.bindCustomTexture(sideTess, "../../anvil.png");
        let topTess = this.getTessellator("../../anvil_top.png");
        this.bindCustomTexture(topTess, "../../anvil_top.png");

        let meta = world ? world.getBlockDataAt(x, y, z) : 3; 
        let dir = meta & 3; 
        // 0=S, 1=W, 2=N, 3=E. X-Axis is 1 and 3.
        let isXAxis = (dir === 1 || dir === 3);

        // Standard Anvil Parts (in 1/16ths)
        const partsData = [
            // Base (12x4x12)
            { min: new THREE.Vector3(2/16, 0, 2/16), max: new THREE.Vector3(14/16, 4/16, 14/16), tex: sideTess },
            // Pedestal Lower (8x1x10)
            { min: new THREE.Vector3(4/16, 4/16, 3/16), max: new THREE.Vector3(12/16, 5/16, 13/16), tex: sideTess },
            // Pillar (4x5x8)
            { min: new THREE.Vector3(6/16, 5/16, 4/16), max: new THREE.Vector3(10/16, 10/16, 12/16), tex: sideTess },
            // Top Body (10x6x16)
            { min: new THREE.Vector3(3/16, 10/16, 0), max: new THREE.Vector3(13/16, 1, 1), tex: sideTess, main: true }
        ];

        let level = world ? world.getTotalLightAt(x, y, z) : 15;
        if (level < 1) level = 1;
        let brightness = 0.9 / 15.0 * level + 0.1;
        let globalBrightness = this.worldRenderer.minecraft.settings.brightness;
        brightness = brightness + (1.0 - brightness) * globalBrightness;

        for (let p of partsData) {
            let bb = new THREE.Box3(p.min.clone(), p.max.clone());
            if (isXAxis) {
                // Rotate by swapping X and Z relative to center
                let minX = bb.min.x, maxX = bb.max.x;
                let minZ = bb.min.z, maxZ = bb.max.z;
                bb.min.x = minZ; bb.max.x = maxZ;
                bb.min.z = minX; bb.max.z = maxX;
            }

            for (let face of EnumBlockFace.values()) {
                // Texture selection
                if (p.main && face === EnumBlockFace.TOP) {
                    this.tessellator = topTess;
                } else {
                    this.tessellator = sideTess;
                }

                let shade = brightness * face.getShading();
                this.tessellator.setColor(shade, shade, shade);

                let u1, u2, v1, v2;
                if (face.isYAxis()) {
                    if (isXAxis && face === EnumBlockFace.TOP) {
                        // For rotated top face, swap UVs to match model orientation
                        u1 = bb.min.z; u2 = bb.max.z; v1 = bb.min.x; v2 = bb.max.x;
                    } else {
                        u1 = bb.min.x; u2 = bb.max.x; v1 = bb.min.z; v2 = bb.max.z;
                    }
                } else if (face.isZAxis()) { 
                    u1 = bb.min.x; u2 = bb.max.x; v1 = 1.0 - bb.max.y; v2 = 1.0 - bb.min.y; 
                } else { 
                    u1 = bb.min.z; u2 = bb.max.z; v1 = 1.0 - bb.max.y; v2 = 1.0 - bb.min.y; 
                }

                let finalV1 = 1.0 - v2;
                let finalV2 = 1.0 - v1;

                this.addFace(world, face, false, x + bb.min.x, y + bb.min.y, z + bb.min.z, x + bb.max.x, y + bb.max.y, z + bb.max.z, u1, finalV1, u2, finalV2);
            }
        }

        this.tessellator = originalTessellator;
    }

    renderWall(world, block, ambientOcclusion, x, y, z) {
        // Prepare tessellator
        let originalTessellator = this.tessellator;
        let isCustomTexture = false;

        if (block.textureName) {
            isCustomTexture = true;
            let tess = this.getTessellator(block.textureName);
            this.bindCustomTexture(tess, block.textureName);
            this.tessellator = tess;
        }

        // Center Post: 0.25 to 0.75 (Width 0.5)
        let postBox = new THREE.Box3(
            new THREE.Vector3(0.25, 0.0, 0.25),
            new THREE.Vector3(0.75, 1.0, 0.75)
        );
        this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, postBox, isCustomTexture);

        if (!world) {
            // Inventory: Draw simple side extensions to show shape
            let left = new THREE.Box3(
                new THREE.Vector3(0.0, 0.0, 0.3125),
                new THREE.Vector3(0.25, 0.8125, 0.6875)
            );
            let right = new THREE.Box3(
                new THREE.Vector3(0.75, 0.0, 0.3125),
                new THREE.Vector3(1.0, 0.8125, 0.6875)
            );
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, left, isCustomTexture);
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, right, isCustomTexture);
            
            if (isCustomTexture) this.tessellator = originalTessellator;
            return;
        }

        // Check connections
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let forced = (meta & 16) !== 0;
        let connectN, connectS, connectW, connectE;

        if (forced) {
            connectN = (meta & 1) !== 0;
            connectS = (meta & 2) !== 0;
            connectW = (meta & 4) !== 0;
            connectE = (meta & 8) !== 0;
        } else {
            connectN = block.canConnect(world, x, y, z - 1);
            connectS = block.canConnect(world, x, y, z + 1);
            connectW = block.canConnect(world, x - 1, y, z);
            connectE = block.canConnect(world, x + 1, y, z);
        }

        let wallHeight = 0.8125;
        let minT = 0.3125;
        let maxT = 0.6875;

        if (connectN) {
            let box = new THREE.Box3(new THREE.Vector3(minT, 0.0, 0.0), new THREE.Vector3(maxT, wallHeight, 0.25));
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, box, isCustomTexture);
        }
        if (connectS) {
            let box = new THREE.Box3(new THREE.Vector3(minT, 0.0, 0.75), new THREE.Vector3(maxT, wallHeight, 1.0));
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, box, isCustomTexture);
        }
        if (connectW) {
            let box = new THREE.Box3(new THREE.Vector3(0.0, 0.0, minT), new THREE.Vector3(0.25, wallHeight, maxT));
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, box, isCustomTexture);
        }
        if (connectE) {
            let box = new THREE.Box3(new THREE.Vector3(0.75, 0.0, minT), new THREE.Vector3(1.0, wallHeight, maxT));
            this.renderPartialBlock(world, block, ambientOcclusion, x, y, z, box, isCustomTexture);
        }

        if (isCustomTexture) this.tessellator = originalTessellator;
    }

    renderExtrudedItem(world, block, x, y, z, brightness = 1.0, tag = null) {
        const forced = this.worldRenderer.minecraft.devTools.glint.forced && world === null;
        let isEnchanted = block.isEnchanted || (tag && tag.enchanted) || forced;

        let textureName = block.textureName;
        let textureIndex = block.textureIndex !== undefined ? block.textureIndex : -1;
        let textureCols = block.cols || 1;

        const type = block.getRenderType();
        const id = block.getId();

        // 1. Resolve Texture and Index for non-standard item blocks
        let customTexInfo = block.getTextureForFace(EnumBlockFace.NORTH);
        if (typeof customTexInfo === 'object' && customTexInfo.type === 'custom') {
            textureName = customTexInfo.name;
            textureIndex = customTexInfo.index;
            textureCols = customTexInfo.cols || 1;
        } else if (type === BlockRenderType.TORCH) {
            textureName = "../../blocks.png";
            textureIndex = customTexInfo;
        } else if (type === BlockRenderType.RAIL) {
            textureName = "../../items (1).png";
            if (id === 159) textureIndex = 34;
            else if (id === 158) textureIndex = 35;
            else textureIndex = 32;
        } else if (id === 55) { // Redstone Dust
            textureName = "../../redstonestuff.png";
            textureIndex = 0;
            textureCols = 22;
        } else if (type === BlockRenderType.LADDER) {
            textureName = block.textureName || "../../items (1).png";
            textureIndex = block.textureIndex !== undefined ? block.textureIndex : 36;
        } else if (type === BlockRenderType.DOUBLE_PLANT) {
            textureName = block.textureName;
            textureIndex = block.bottomIndex;
        } else if (type === BlockRenderType.SIGN || type === BlockRenderType.WALL_SIGN) {
            textureName = "../../signs.png";
            textureIndex = block.textureIndex;
        } else if (id === 358) { // Map
            textureName = "../../tools (1).png";
            textureIndex = 40;
        }

        if (id === 59) { // Wheat
            textureName = "../../farming.png";
            let meta = world ? world.getBlockDataAt(x, y, z) : 7;
            textureIndex = 4 + meta;
        } else if (id === 141) { // Carrots
            textureName = "../../farming.png";
            let meta = world ? world.getBlockDataAt(x, y, z) : 3;
            textureIndex = 12 + meta;
        } else if (id === 142) { // Potatoes
            textureName = "../../farming.png";
            let meta = world ? world.getBlockDataAt(x, y, z) : 3;
            textureIndex = 16 + meta;
        } else if (id === 420) { // Beetroots
            textureName = "../../beetroot (1).png";
            let meta = world ? world.getBlockDataAt(x, y, z) : 3;
            textureIndex = 3 + meta;
        }

        // Standard item path normalization
        if (textureName && !textureName.startsWith("http") && !textureName.startsWith("blob:") && !textureName.startsWith("/") && !textureName.startsWith("../../")) {
            textureName = "../../" + textureName;
        }

        // Handle fishing rod animation using spritesheet indices
        if (id === 346) {
            textureName = "../../tools (1).png";
            let player = this.worldRenderer.minecraft.player;
            textureIndex = (player && player.fishEntity) ? 42 : 41;
        }

        // Handle bow animation
        if (id === 261) {
            textureName = "../../tools (1).png";
            textureIndex = 37;
            if (this.worldRenderer.minecraft.bowPullDuration > 0) {
                let duration = this.worldRenderer.minecraft.bowPullDuration;
                if (duration >= 16) textureName = "../../bowpull3.png";
                else if (duration >= 8) textureName = "../../bowpull2.png";
                else textureName = "../../bowpull1.png";
                textureIndex = -1;
            }
        }

        // Handle crossbow animation
        if (id === 499) {
            textureName = "../../crossbow.png";
            textureCols = 5;
            
            // Check tag passed to renderer first, then world data if available
            let isCharged = !!(tag && tag.charged);
            let duration = 0;

            if (this.worldRenderer.minecraft.player) {
                const inv = this.worldRenderer.minecraft.player.inventory;
                const stack = inv.getStackInSlot(inv.selectedSlotIndex);
                // Check if we are rendering the local player's held item to sync pull animation
                if (world === null && stack && stack.id === 499) {
                    isCharged = isCharged || !!(stack.tag && stack.tag.charged);
                    duration = this.worldRenderer.minecraft.crossbowPullDuration;
                }
            }
            
            if (isCharged) {
                textureIndex = 4; // Frame 5: Loaded Arrow
            } else if (duration >= 16) {
                textureIndex = 3; // Frame 4: Pulling 2
            } else if (duration >= 8) {
                textureIndex = 2; // Frame 3: Pulling 1
            } else if (duration > 0) {
                textureIndex = 1; // Frame 2: Pulling 0
            } else {
                textureIndex = 0; // Frame 1: Standby
            }
        }

        if (!textureName) {
            textureName = "../../blocks.png";
            if (textureIndex === -1) textureIndex = block.textureSlotId || 0;
        }

        // Determine column count for spritesheets
        if (textureName.includes("random stuff")) textureCols = 9;
        else if (textureName.includes("tools (1).png")) textureCols = 43;
        else if (textureName.includes("items (1).png")) textureCols = 37;
        else if (textureName.includes("food.png")) textureCols = 18;
        else if (textureName.includes("farming.png")) textureCols = 20;
        else if (textureName.includes("foliage.png")) textureCols = 21;
        else if (textureName.includes("treestuff.png")) textureCols = 30;
        else if (textureName.includes("sandstuff.png") || textureName.includes("desert (1).png")) textureCols = 10;
        else if (textureName.includes("orestuff.png")) textureCols = 14;
        else if (textureName.includes("nether.png")) textureCols = 5;
        else if (textureName.includes("blocks.png")) textureCols = 14;
        else if (textureName.includes("beetroot")) textureCols = 7;
        else if (textureName.includes("dye.png")) textureCols = 16;
        else if (textureName.includes("endstuff.png")) textureCols = 7;
        else if (textureName.includes("signs.png")) textureCols = 5;
        else if (textureName.includes("food2.png")) textureCols = 5;
        else if (textureName.includes("dicsandbox")) textureCols = 14;
        else if (textureName.includes("bottles.png")) textureCols = 3;
        else if (textureName.includes("slimestuff.png")) textureCols = 2;

        // Use texture-specific tessellator to avoid corrupting shared terrain tessellator
        let targetTessellator;
        if (textureName === "../../blocks.png") {
            targetTessellator = this.tessellator;
        } else {
            targetTessellator = this.getTessellator(textureName);
            this.bindCustomTexture(targetTessellator, textureName);
        }

        let textureRes = this.worldRenderer.minecraft.resources[textureName] || this.worldRenderer.minecraft.resources[textureName.replace("../../", "")];
        if (textureRes) {
            // Set color based on block (for foliage tinting)
            let color = block.getColor(null, 0, 0, 0, null);
            let r = ((color >> 16 & 255) / 255.0) * brightness;
            let g = ((color >> 8 & 255) / 255.0) * brightness;
            let b = ((color & 255) / 255.0) * brightness;
            targetTessellator.setColor(r, g, b, 1);

            // Use 1.0 scale for block space
            this.toolRenderer.renderTool(targetTessellator, textureRes, x, y, z, 1.0, 0.0, textureIndex, textureCols);

            // Apply glint if enchanted
            if (isEnchanted) {
                this.toolRenderer.renderTool(this.glintTessellator1, textureRes, x, y, z, 1.0, 0.0, textureIndex, textureCols);
                this.toolRenderer.renderTool(this.glintTessellator2, textureRes, x, y, z, 1.0, 0.0, textureIndex, textureCols);
            }

            // Render Overlay if present (Potions)
            if (block.overlayName) {
                let overlayTess = this.getTessellator(block.overlayName);
                this.bindCustomTexture(overlayTess, block.overlayName);
                
                const ocColor = block.overlayColor || 0xFFFFFF;
                const ocr = (ocColor >> 16 & 255) / 255.0;
                const ocg = (ocColor >> 8 & 255) / 255.0;
                const ocb = (ocColor & 255) / 255.0;
                overlayTess.setColor(ocr * brightness, ocg * brightness, ocb * brightness, 1);

                const oc = block.overlayCols || textureCols;
                // Nudge slightly forward in Z to avoid gaps
                this.toolRenderer.renderTool(overlayTess, overlayTess.material.map.image, x, y, z, 1.0, 0.02, block.overlayIndex, oc);
            }
        }
    }

    renderDoor(world, block, x, y, z) {
        this.doorRenderer.renderDoor(world, block, x, y, z);
    }

    renderSolidBlock(world, block, ambientOcclusion, x, y, z) {
        let boundingBox = block.getBoundingBox(world, x, y, z);

        // Check for Waterlogging (Bit 7: 128)
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        if ((meta & 128) !== 0) {
            this.liquidRenderer.renderLiquid(world, BlockRegistry.WATER, x, y, z, useLOD);
        }

        // Render all faces
        let values = EnumBlockFace.values();
        for (let i = 0; i < values.length; i++) {
            let face = values[i];

            // Check if face is hidden by other block
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {

                // Render face
                this.renderFace(world, block, boundingBox, face, ambientOcclusion, x, y, z);
            }
        }
    }

    renderFace(world, block, boundingBox, face, ambientOcclusion, x, y, z) {
        // Vertex mappings
        let minX = x + boundingBox.minX;
        let minY = y + boundingBox.minY;
        let minZ = z + boundingBox.minZ;
        let maxX = x + boundingBox.maxX;
        let maxY = y + boundingBox.maxY;
        let maxZ = z + boundingBox.maxZ;

        // UV Mapping logic: Handle custom textures first, otherwise fall back to atlas
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let textureInfo = block.getTextureForFace(face, meta);
        
        // Mod multi-texture override
        let modTex = null;
        if (face === EnumBlockFace.TOP) modTex = block.customTextures.top;
        else if (face === EnumBlockFace.BOTTOM) modTex = block.customTextures.bottom;
        else modTex = block.customTextures.side;

        if (modTex) {
             textureInfo = { type: 'custom', name: modTex, index: 0, cols: 1 };
        }

        let targetTessellator = this.tessellator;
        let minU = 0.0, maxU = 1.0, minV = 0.0, maxV = 1.0;

        const isGlintPass = (this.tessellator === this.glintTessellator1 || this.tessellator === this.glintTessellator2);

        // If textureInfo is an object, it specifies a custom texture name/type
        if (typeof textureInfo === 'object' && textureInfo.type === 'custom') {
            let textureName = textureInfo.name;
            let index = textureInfo.index !== undefined ? textureInfo.index : (block.textureIndex || 0);
            let cols = textureInfo.cols !== undefined ? textureInfo.cols : 1;
            
            if (!isGlintPass) {
                targetTessellator = this.getTessellator(textureName);
                if (!targetTessellator.material.map) {
                     let tex = this.worldRenderer.minecraft.getThreeTexture(textureName);
                     if (tex) {
                         tex.magFilter = THREE.NearestFilter;
                         tex.minFilter = THREE.NearestFilter;
                         tex.flipY = false;
                         targetTessellator.bindTexture(tex);
                     }
                }
            }
            
            if (isGlintPass) {
                minU = 0.0; maxU = 1.0; minV = 0.0; maxV = 1.0;
            } else {
                const eps = 0.0005;
                minU = (index % cols) / cols + eps;
                maxU = (index % cols + 1) / cols - eps;
                minV = 0.0; 
                maxV = 1.0;
            }

        } else {
            // Atlas Texture Fallback (textureInfo is assumed to be textureIndex here)
            let textureIndex = textureInfo;
            const eps = 0.0005; 
            let spriteW = 1.0 / 14.0;
            
            // Calculate base atlas coordinates
            let uBase = (textureIndex % 14) * spriteW;
            let vBase = 0.0; // Assuming 1 row
            
            // Calculate relative UVs from boundingBox to support partial block texture mapping ("cut uv")
            let uRel1 = 0, uRel2 = 1, vRel1 = 0, vRel2 = 1;
            if (face === EnumBlockFace.NORTH || face === EnumBlockFace.SOUTH) {
                uRel1 = boundingBox.minX; uRel2 = boundingBox.maxX;
                vRel1 = 1.0 - boundingBox.maxY; vRel2 = 1.0 - boundingBox.minY;
            } else if (face === EnumBlockFace.WEST || face === EnumBlockFace.EAST) {
                uRel1 = boundingBox.minZ; uRel2 = boundingBox.maxZ;
                vRel1 = 1.0 - boundingBox.maxY; vRel2 = 1.0 - boundingBox.minY;
            } else { // TOP / BOTTOM
                uRel1 = boundingBox.minX; uRel2 = boundingBox.maxX;
                vRel1 = boundingBox.minZ; vRel2 = boundingBox.maxZ;
            }

            if (isGlintPass) {
                minU = uRel1; maxU = uRel2; minV = vRel1; maxV = vRel2;
            } else {
                minU = uBase + uRel1 * spriteW + eps;
                maxU = uBase + uRel2 * spriteW - eps;
                minV = vBase + vRel1;
                maxV = vBase + vRel2;
            }
        }

        // Switch tessellator if needed
        let originalTessellator = this.tessellator;
        
        // If we are currently in a glint pass, don't allow targetTessellator to override our glint setup.
        // This ensures the glint geometry uses its specialized material while maintaining block-specific coordinates.
        if (!isGlintPass) {
            this.tessellator = targetTessellator;
        }

        // Enable swaying for leaf blocks
        const prevWaving = this.tessellator.wavingWeight;
        if (this.tessellator.isLeafTessellator) {
            this.tessellator.wavingWeight = 0.4; // Subtle sway for the whole leaf block
        }

        // Flip V
        let tempV = minV;
        minV = 1.0 - maxV;
        maxV = 1.0 - tempV;

        // Get color multiplier
        let color = block.getColor(world, x, y, z, face);
        // Low mode: force simple solid colors per block type so they are not black
        if (this.worldRenderer && this.worldRenderer.minecraft && this.worldRenderer.minecraft.settings.lowQualityTextures) {
            switch (block.getId()) {
                case 1:
                    color = 0x888888;
                    break; // stone - gray
                case 2:
                    color = 0x2e8b57;
                    break; // grass - green
                case 3:
                    color = 0x8b4513;
                    break; // dirt - brown
                case 5:
                    color = 0xa0522d;
                    break; // wood/planks - brown
                case 12:
                    color = 0xe5d38e;
                    break; // sand - sand yellow
                case 17:
                    color = 0x5b3a1a;
                    break; // log - dark brown
                case 18:
                    color = 0x3fa34d;
                    break; // leaves - leaf green
                case 9:
                    color = 0x2f66ff;
                    break; // water - blue (translucent by block)
                case 50:
                    color = 0xffc800;
                    break; // torch - warm yellow
                default:
                    color = 0xffffff;
                    break; // fallback white
            }
        }
        let red = (color >> 16 & 255) / 255.0;
        let green = (color >> 8 & 255) / 255.0;
        let blue = (color & 255) / 255.0;

        // Classic lightning
        if (!ambientOcclusion) {
            let level = world === null ? 15 : world.getTotalLightAt(Math.floor(minX + face.x), Math.floor(minY + face.y), Math.floor(minZ + face.z));
            
            // Visual minimum light level 1
            if (level < 1) level = 1;

            if (this.worldRenderer.minecraft.player.activeEffects.has("night_vision")) {
                level = 15;
            }

            // Force full brightness for blocks that are themselves light sources
            if (block.getLightValue(world, x, y, z) > 0) {
                level = 15;
            }

            let brightness = this.getVisualLightBrightness(level);

            let shade = brightness * face.getShading();
            this.tessellator.setColor(red * shade, green * shade, blue * shade);
        }

        // Set opacity of block (Using alpha channel in texture right now)
        // this.tessellator.setAlpha(1 - block.getTransparency());

        // Add face to tessellator
        this.addFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, red, green, blue);

        // Restore state
        this.tessellator.wavingWeight = prevWaving;
        this.tessellator = originalTessellator;
    }

    renderDispenser(world, block, ambientOcclusion, x, y, z) {
        const redTexName = "../../redstonestuff.png";
        const furnaceTexName = "../../furnace.png.png";
        
        let originalTessellator = this.tessellator;
        let boundingBox = block.getBoundingBox(world, x, y, z);
        // Default to facing South (3) for GUI visibility, matching furnace front placement
        let meta = world ? world.getBlockDataAt(x, y, z) : 3; 

        for (let face of EnumBlockFace.values()) {
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                let isFront = false;
                if (meta === 0 && face === EnumBlockFace.BOTTOM) isFront = true;
                else if (meta === 1 && face === EnumBlockFace.TOP) isFront = true;
                else if (meta === 2 && face === EnumBlockFace.NORTH) isFront = true;
                else if (meta === 3 && face === EnumBlockFace.SOUTH) isFront = true;
                else if (meta === 4 && face === EnumBlockFace.WEST) isFront = true;
                else if (meta === 5 && face === EnumBlockFace.EAST) isFront = true;

                let texName, texIdx, cols;
                if (isFront) {
                    texName = redTexName;
                    texIdx = 21;
                    cols = 22;
                } else {
                    texName = furnaceTexName;
                    cols = 4;
                    // Furnace spritesheet columns: 0=Lit Front, 1=Unlit Front, 2=Sides, 3=Top/Bottom
                    if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) texIdx = 3;
                    else texIdx = 2;
                }

                let tess = this.getTessellator(texName);
                this.bindCustomTexture(tess, texName);
                this.tessellator = tess;

                let spriteWidth = 1.0 / cols;
                let minU = texIdx * spriteWidth + 0.0005, maxU = (texIdx + 1) * spriteWidth - 0.0005;
                let minV = 0, maxV = 1;

                let tV = minV; minV = 1.0 - maxV; maxV = 1.0 - tV;

                let color = block.getColor(world, x, y, z, face);
                let red = (color >> 16 & 255) / 255.0, green = (color >> 8 & 255) / 255.0, blue = (color & 255) / 255.0;

                if (!ambientOcclusion && world) {
                    let level = world.getTotalLightAt(x + face.x, y + face.y, z + face.z);
                    let b = 0.9 / 15.0 * Math.max(1, level) + 0.1;
                    this.tessellator.setColor(red * b * face.getShading(), green * b * face.getShading(), blue * b * face.getShading());
                } else if (!world) this.tessellator.setColor(1, 1, 1);

                this.addFace(world, face, ambientOcclusion, x + boundingBox.minX, y + boundingBox.minY, z + boundingBox.minZ, x + boundingBox.maxX, y + boundingBox.maxY, z + boundingBox.maxZ, minU, minV, maxU, maxV, red, green, blue);
            }
        }
        this.tessellator = originalTessellator;
    }

    renderCraftingTable(world, block, ambientOcclusion, x, y, z) {
        let texture = this.worldRenderer.minecraft.resources[block.textureName];
        if (!texture) return;

        if (!this.craftingTableTessellator.material.map || this.craftingTableTessellator.material.map.image !== texture) {
            let threeTexture = new THREE.CanvasTexture(texture);
            threeTexture.magFilter = THREE.NearestFilter;
            threeTexture.minFilter = THREE.NearestFilter;
            threeTexture.flipY = false; // Fix texture being upside down
            this.craftingTableTessellator.bindTexture(threeTexture);
        }

        let originalTessellator = this.tessellator;
        this.tessellator = this.craftingTableTessellator;

        let boundingBox = block.getBoundingBox(world, x, y, z);
        let meta = world ? world.getBlockDataAt(x, y, z) : 2; // Default to facing North (2) for GUI

        let values = EnumBlockFace.values();
        for (let i = 0; i < values.length; i++) {
            let face = values[i];

            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                let minX = x + boundingBox.minX;
                let minY = y + boundingBox.minY;
                let minZ = z + boundingBox.minZ;
                let maxX = x + boundingBox.maxX;
                let maxY = y + boundingBox.maxY;
                let maxZ = z + boundingBox.maxZ;

                // Determine texture index
                let textureIndex = 2; // Default side
                if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) {
                    textureIndex = 0; // Top/Bottom
                } else {
                    // 0=South, 1=West, 2=North, 3=East
                    let dir = meta & 3;
                    let oppositeDir = (dir + 2) % 4;
                    
                    let faceDir = -1;
                    if (face === EnumBlockFace.SOUTH) faceDir = 0;
                    else if (face === EnumBlockFace.WEST) faceDir = 1;
                    else if (face === EnumBlockFace.NORTH) faceDir = 2;
                    else if (face === EnumBlockFace.EAST) faceDir = 3;

                    if (faceDir === dir || faceDir === oppositeDir) {
                        textureIndex = 1; // Front/Back
                    }
                }

                let spriteCount = 3;
                let spriteWidth = 1 / spriteCount;
                let minU = textureIndex * spriteWidth;
                let maxU = minU + spriteWidth;
                let minV = 0.0;
                let maxV = 1.0;

                // Don't flip V for this texture
                // let tempV = minV;
                // minV = 1.0 - maxV;
                // maxV = 1.0 - tempV;

                let color = block.getColor(world, x, y, z, face);
                let red = (color >> 16 & 255) / 255.0;
                let green = (color >> 8 & 255) / 255.0;
                let blue = (color & 255) / 255.0;

                if (!ambientOcclusion) {
                    let level = world === null ? 15 : world.getTotalLightAt(x + face.x, y + face.y, z + face.z);
                    
                    // Visual minimum light level 1
                    if (level < 1) level = 1;

                    let brightness = 0.9 / 15.0 * level + 0.1;
                    let shade = brightness * face.getShading();
                    this.tessellator.setColor(red * shade, green * shade, blue * shade);
                }

                this.addFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, red, green, blue);
            }
        }

        this.tessellator = originalTessellator;
    }


    renderCross(world, block, x, y, z, distSq = 0, textureOverride = null) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let textureInfo = block.getTextureForFace(null, meta);
        
        let textureName = textureOverride;
        let textureIndex = block.textureIndex;
        let spriteCount = 1;

        if (typeof textureInfo === 'object' && textureInfo.type === 'custom') {
            textureName = textureInfo.name;
            textureIndex = textureInfo.index;
            spriteCount = textureInfo.cols || 1;
        } else if (!textureName) {
            textureName = block.textureName;
        }

        if (textureName && !textureName.startsWith("http") && !textureName.startsWith("blob:") && !textureName.startsWith("/") && !textureName.startsWith("../../")) {
            textureName = "../../" + textureName;
        }

        let texture = this.worldRenderer.minecraft.resources[textureName];
        if (!texture) return;

        // Get specific tessellator for this foliage texture
        let tessellator = this.getTessellator(textureName);
        if (tessellator.material.side !== THREE.DoubleSide) {
            tessellator.material.side = THREE.DoubleSide;
            tessellator.material.alphaTest = 0.1;
        }

        if (!tessellator.material.map || tessellator.material.map.image !== texture) {
            let threeTexture = new THREE.CanvasTexture(texture);
            threeTexture.magFilter = THREE.NearestFilter;
            threeTexture.minFilter = THREE.NearestFilter;
            threeTexture.flipY = false;
            tessellator.bindTexture(threeTexture);
        }

        let color = block.getColor(world, x, y, z, null);
        let red = (color >> 16 & 0xFF) / 255.0;
        let green = (color >> 8 & 0xFF) / 255.0;
        let blue = (color & 0xFF) / 255.0;

        let level = world === null ? 15 : world.getTotalLightAt(x, y, z);
        
        // Visual minimum light level 1
        if (level < 1) level = 1;

        let brightness = 0.9 / 15.0 * level + 0.1;
        let shade = brightness;
        tessellator.setColor(red * shade, green * shade, blue * shade);

        // Determine sprite count per-file if not already set by textureInfo
        if (spriteCount === 1 && textureName) {
            const name = textureName.toLowerCase();
            if (name.includes("foliage.png")) spriteCount = 21;
            else if (name.includes("deadandsugar")) spriteCount = 2;
            else if (name.includes("desert") || name.includes("sandstuff")) spriteCount = 10;
            else if (name.includes("treestuff.png")) spriteCount = 30;
            else if (name.includes("grasslandfoliage.png")) spriteCount = 5;
            else if (name.includes("random stuff")) spriteCount = 9;
            else if (name.includes("tulip") || name.includes("lily") || name.includes("mushroom") || name.includes("sapling") || name.includes("grass_bottom") || name.includes("grass_top") || block.getId() === 59) {
                spriteCount = 1;
            }
        }
        let spriteWidth = 1 / spriteCount;

        // FIX: Inset UVs to prevent bleeding
        const eps = 0.0005;
        let minU = textureIndex * spriteWidth + eps;
        let maxU = textureIndex * spriteWidth + spriteWidth - eps;
        
        let minV = 0;
        let maxV = 1;

        let minX = x + 0.1;
        let minY = y;
        let minZ = z + 0.1;
        let maxX = x + 0.9;
        let maxY = y + 0.8;
        let maxZ = z + 0.9;

        // Fix: Sugarcane, Cobwebs, and Bushes render specific sizes.
        const id = block.getId();
        if (id === 83 || id === 571 || id === 574 || block.getRenderType() === BlockRenderType.DOUBLE_PLANT) {
            if (id === 574) { // Berry Bush height based on stage (meta)
                let stage = meta & 3;
                // Increased heights for better visibility (Substantially larger as requested)
                if (stage === 0) maxY = y + 0.7;
                else if (stage === 1) maxY = y + 0.85;
                else if (stage === 2) maxY = y + 0.95;
                else maxY = y + 1.0;
            } else {
                maxY = y + 1.0;
            }
            
            // Width and positioning logic
            if (id === 571) { // Cobweb - 10% less wide (0.05 block insets)
                minX = x + 0.05;
                minZ = z + 0.05;
                maxX = x + 0.95;
                maxZ = z + 0.95;
            } else if (id === 83 || id === 574) { // Full width for reeds and bushes
                minX = x + 0.0;
                minZ = z + 0.0;
                maxX = x + 1.0;
                maxZ = z + 1.0;
            }
        }

        // Plane 1
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(minX, maxY, minZ, minU, minV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(minX, minY, minZ, minU, maxV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(maxX, minY, maxZ, maxU, maxV);
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(maxX, maxY, maxZ, maxU, minV);

        // Plane 2
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(minX, maxY, maxZ, minU, minV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(minX, minY, maxZ, minU, maxV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(maxX, minY, minZ, maxU, maxV);
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(maxX, maxY, minZ, maxU, minV);
    }

    renderCrop(world, block, x, y, z, distSq, textureOverride, textureIndex = 0, spriteCols = 1) {
        let textureName = textureOverride ? textureOverride : "../../" + block.textureName;
        let texture = this.worldRenderer.minecraft.resources[textureName];
        if (!texture) return;

        let tessellator = this.getTessellator(textureName);
        if (tessellator.material.side !== THREE.DoubleSide) {
            tessellator.material.side = THREE.DoubleSide;
            tessellator.material.alphaTest = 0.1;
        }

        if (!tessellator.material.map || tessellator.material.map.image !== texture) {
            let threeTexture = new THREE.CanvasTexture(texture);
            threeTexture.magFilter = THREE.NearestFilter;
            threeTexture.minFilter = THREE.NearestFilter;
            threeTexture.flipY = false;
            tessellator.bindTexture(threeTexture);
        }

        let color = block.getColor(world, x, y, z, null);
        let red = (color >> 16 & 0xFF) / 255.0;
        let green = (color >> 8 & 0xFF) / 255.0;
        let blue = (color & 0xFF) / 255.0;

        let level = world === null ? 15 : world.getTotalLightAt(x, y, z);
        
        // Visual minimum light level 1
        if (level < 1) level = 1;

        let brightness = 0.9 / 15.0 * level + 0.1;
        tessellator.setColor(red * brightness, green * brightness, blue * brightness);

        let spriteWidth = 1.0 / spriteCols;
        const eps = 0.0005;
        let minU = textureIndex * spriteWidth + eps;
        let maxU = minU + spriteWidth - eps * 2;
        let minV = 0;
        let maxV = 1;
        
        // Bounds
        let minX = x; let maxX = x + 1;
        let minZ = z; let maxZ = z + 1;
        let minY = y; let maxY = y + 1;

        // 1. Cross (X)
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(minX, maxY, minZ, minU, minV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(minX, minY, minZ, minU, maxV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(maxX, minY, maxZ, maxU, maxV);
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(maxX, maxY, maxZ, maxU, minV);

        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(minX, maxY, maxZ, minU, minV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(minX, minY, maxZ, minU, maxV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(maxX, minY, minZ, maxU, maxV);
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(maxX, maxY, minZ, maxU, minV);

        // 2. Hash (#) - 4 Orthogonal Planes at offset 0.25
        let o = 0.25;
        
        // Z planes (Along X axis)
        // Front (Z=0.25)
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(minX, maxY, z + o, minU, minV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(minX, minY, z + o, minU, maxV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(maxX, minY, z + o, maxU, maxV);
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(maxX, maxY, z + o, maxU, minV);
        
        // Back (Z=0.75)
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(minX, maxY, z + 1 - o, minU, minV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(minX, minY, z + 1 - o, minU, maxV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(maxX, minY, z + 1 - o, maxU, maxV);
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(maxX, maxY, z + 1 - o, maxU, minV);

        // X planes (Along Z axis)
        // Left (X=0.25)
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(x + o, maxY, maxZ, minU, minV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(x + o, minY, maxZ, minU, maxV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(x + o, minY, minZ, maxU, maxV);
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(x + o, maxY, minZ, maxU, minV);

        // Right (X=0.75)
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(x + 1 - o, maxY, maxZ, minU, minV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(x + 1 - o, minY, maxZ, minU, maxV);
        tessellator.wavingWeight = 0.0;
        tessellator.addVertexWithUV(x + 1 - o, minY, minZ, maxU, maxV);
        tessellator.wavingWeight = 1.0;
        tessellator.addVertexWithUV(x + 1 - o, maxY, minZ, maxU, minV);
    }

    addFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, red = 1, green = 1, blue = 1) {
        if (face === EnumBlockFace.BOTTOM) {
            this.addBlockCorner(world, face, ambientOcclusion, maxX, minY, maxZ, maxU, maxV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, maxX, minY, minZ, maxU, minV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, minX, minY, minZ, minU, minV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, minX, minY, maxZ, minU, maxV, red, green, blue);
        }
        if (face === EnumBlockFace.TOP) {
            this.addBlockCorner(world, face, ambientOcclusion, minX, maxY, maxZ, minU, minV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, minX, maxY, minZ, minU, maxV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, maxX, maxY, minZ, maxU, maxV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, maxX, maxY, maxZ, maxU, minV, red, green, blue);
        }
        if (face === EnumBlockFace.NORTH) {
            this.addBlockCorner(world, face, ambientOcclusion, minX, maxY, minZ, minU, minV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, minX, minY, minZ, minU, maxV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, maxX, minY, minZ, maxU, maxV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, maxX, maxY, minZ, maxU, minV, red, green, blue);
        }
        if (face === EnumBlockFace.SOUTH) {
            this.addBlockCorner(world, face, ambientOcclusion, minX, maxY, maxZ, maxU, minV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, maxX, maxY, maxZ, minU, minV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, maxX, minY, maxZ, minU, maxV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, minX, minY, maxZ, maxU, maxV, red, green, blue);
        }
        if (face === EnumBlockFace.WEST) {
            this.addBlockCorner(world, face, ambientOcclusion, minX, minY, maxZ, minU, maxV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, minX, minY, minZ, maxU, maxV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, minX, maxY, minZ, maxU, minV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, minX, maxY, maxZ, minU, minV, red, green, blue);
        }
        if (face === EnumBlockFace.EAST) {
            this.addBlockCorner(world, face, ambientOcclusion, maxX, maxY, maxZ, maxU, minV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, maxX, maxY, minZ, minU, minV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, maxX, minY, minZ, minU, maxV, red, green, blue);
            this.addBlockCorner(world, face, ambientOcclusion, maxX, minY, maxZ, maxU, maxV, red, green, blue);
        }
    }

    addBlockCorner(world, face, ambientOcclusion, x, y, z, u, v, red, green, blue) {
        // Smooth lightning
        if (ambientOcclusion) {
            this.setAverageBrightness(world, face, x, y, z, red, green, blue);
        }

        this.tessellator.addVertexWithUV(x, y, z, u, v);
    }

    /**
     * Convert a light-map value into the visible brightness used by block
     * faces. The old blend added the full Brightness slider value even when
     * the light map was zero, making caves look like they had a gray fill
     * light. Keep a small readable floor, but let actual cave darkness win.
     */
    getVisualLightBrightness(lightLevel) {
        const light = MathHelper.clamp((Number(lightLevel) || 0) / 15.0, 0.0, 1.0);
        const dev = this.worldRenderer.minecraft.devTools.lighting;
        const gamma = Math.max(1.0, Number(dev.gamma) || 2.2);
        const globalBrightness = MathHelper.clamp(
            Number(this.worldRenderer.minecraft.settings.brightness) || 0,
            0.0,
            1.0
        );

        // Brightness still helps visibility, but only raises the dark floor
        // modestly. Full skylight remains full brightness.
        const ambientFloor = 0.06 + globalBrightness * 0.16;
        return ambientFloor + (1.0 - ambientFloor) * Math.pow(light, gamma);
    }

    setAverageBrightness(world, face, x, y, z, red = 1, green = 1, blue = 1) {
        // Get the average light level of all blocks at this corner
        let lightLevelAtThisCorner = this.getAverageLightLevelAt(world, face, x, y, z);

        // Check if the current block is a light source and force full brightness
        const blockId = world ? world.getBlockAt(Math.floor(x - face.x * 0.1), Math.floor(y - face.y * 0.1), Math.floor(z - face.z * 0.1)) : 0;
        const currentBlock = Block.getById(blockId);
        if (currentBlock && currentBlock.getLightValue() > 0) {
            lightLevelAtThisCorner = 15;
        }

        if (this.worldRenderer.minecraft.player.activeEffects.has("night_vision")) {
            lightLevelAtThisCorner = 15;
        }

        const brightness = this.getVisualLightBrightness(lightLevelAtThisCorner);

        let shading = brightness * face.getShading();

        // Transform brightness of edge
        this.tessellator.setColor(red * shading, green * shading, blue * shading);
    }

    getAverageLightLevelAt(world, face, x, y, z) {
        if (world === null) return 15;

        // Coordinates of the block we are currently rendering the face of.
        // We shift by a tiny amount in the direction of the face's normal to sample the "outside" light.
        const ox = x + (face.x > 0 ? 0 : -1);
        const oy = y + (face.y > 0 ? 0 : -1);
        const oz = z + (face.z > 0 ? 0 : -1);

        let totalLight = 0;
        let solidCount = 0;

        // Sample 4 light values around the vertex in the plane of the face.
        // To prevent leaking through solid corners, we check the occupancy of the adjacent neighbors.
        let l1, l2, l3, l4; // Light levels
        let s1, s2, s3, s4; // Solid flags

        /**
         * Enhanced solid check for AO: only full-cube opaque blocks should contribute to darkening.
         * This prevents thin models like fences or stairs from making their own corners dark.
         */
        const isAOOccluder = (sx, sy, sz) => {
            const id = world.getBlockAt(sx, sy, sz);
            if (id === 0) return false;
            const b = Block.getById(id);
            if (!b || !b.isSolid() || b.isTranslucent()) return false;
            
            // Check if the block is a full cube. If it isn't (like a fence), it doesn't occlude AO.
            const bb = b.getBoundingBox(world, sx, sy, sz);
            return bb && bb.isFullCube();
        };

        if (face.y !== 0) { // Plane XZ
            l1 = world.getTotalLightAt(x, oy, z); s1 = isAOOccluder(x, oy, z);
            l2 = world.getTotalLightAt(x - 1, oy, z); s2 = isAOOccluder(x - 1, oy, z);
            l3 = world.getTotalLightAt(x, oy, z - 1); s3 = isAOOccluder(x, oy, z - 1);
            l4 = world.getTotalLightAt(x - 1, oy, z - 1); s4 = isAOOccluder(x - 1, oy, z - 1);
        } else if (face.x !== 0) { // Plane YZ
            l1 = world.getTotalLightAt(ox, y, z); s1 = isAOOccluder(ox, y, z);
            l2 = world.getTotalLightAt(ox, y - 1, z); s2 = isAOOccluder(ox, y - 1, z);
            l3 = world.getTotalLightAt(ox, y, z - 1); s3 = isAOOccluder(ox, y, z - 1);
            l4 = world.getTotalLightAt(ox, y - 1, z - 1); s4 = isAOOccluder(ox, y - 1, z - 1);
        } else { // Plane XY
            l1 = world.getTotalLightAt(x, y, oz); s1 = isAOOccluder(x, y, oz);
            l2 = world.getTotalLightAt(x - 1, y, oz); s2 = isAOOccluder(x - 1, y, oz);
            l3 = world.getTotalLightAt(x, y - 1, oz); s3 = isAOOccluder(x, y - 1, oz);
            l4 = world.getTotalLightAt(x - 1, y - 1, oz); s4 = isAOOccluder(x - 1, y - 1, oz);
        }

        // Calculate average light level.
        // Robust diagonal shadowing: if two orthogonal neighbors are solid, 
        // they form a light-tight seal for the diagonal between them.
        if (s2 && s3) l4 = (l2 + l3) / 2;
        if (s2 && s3) l1 = (l2 + l3) / 2;
        if (s1 && s4) l2 = (l1 + l4) / 2;
        if (s1 && s4) l3 = (l1 + l4) / 2;

        totalLight = l1 + l2 + l3 + l4;
        solidCount = (s1 ? 1 : 0) + (s2 ? 1 : 0) + (s3 ? 1 : 0) + (s4 ? 1 : 0);

        const avgLight = totalLight / 4.0;
        const dev = this.worldRenderer.minecraft.devTools.lighting;
        // AO is only a contact shadow. Cap its strength so enclosed darkness
        // is expressed by the light map, not by black-looking block corners.
        const aoStrength = Math.min(0.08, Math.max(0.0, Number(dev.ao) || 0.0));
        const aoFactor = Math.max(0.7, 1.0 - (solidCount * aoStrength));

        return avgLight * aoFactor;
    }

    renderTorch(world, block, x, y, z, useLOD) {
        let originalTessellator = this.tessellator;

        // Thickness of the torch
        let size = 1 / 16;

        let distortX = 0;
        let distortZ = 0;

        // Attach torch at wall
        if (world != null && !useLOD) {
            switch (world.getBlockDataAt(x, y, z)) {
                case 1:
                    distortX = -0.2;
                    break;
                case 2:
                    distortX = 0.2;
                    break;
                case 3:
                    distortZ = -0.2;
                    break;
                case 4:
                    distortZ = 0.2;
                    break;
            }
        }

        // Model type
        let centerX = 0.5 + distortX * 1.5;
        let centerZ = 0.5 + distortZ * 1.5;

        // Lift the torch up
        if (distortX !== 0 || distortZ !== 0) {
            y += 0.2;
        }

        // Vertex mappings
        let minX = x + centerX - size;
        let minY = y;
        let minZ = z + centerZ - size;
        let maxX = x + centerX + size;
        let maxY = y + 10 / 16;
        let maxZ = z + centerZ + size;

        // UV Mapping
        let textureInfo = block.getTextureForFace(EnumBlockFace.NORTH);
        let uBase = 0, spriteWidth = 1.0, sheetCols = 1;

        if (typeof textureInfo === 'object' && textureInfo.type === 'custom') {
            let customTess = this.getTessellator(textureInfo.name);
            this.bindCustomTexture(customTess, textureInfo.name);
            this.tessellator = customTess;
            uBase = (textureInfo.index / textureInfo.cols);
            spriteWidth = 1.0 / textureInfo.cols;
            sheetCols = textureInfo.cols;
        } else {
            let textureIndex = textureInfo;
            sheetCols = 14;
            spriteWidth = 1.0 / sheetCols;
            uBase = (textureIndex % sheetCols) * spriteWidth;
        }

        // Use normalized ratios for 2x10 crop inside 16x16 to support high-res packs
        const rW = 2/16;
        const rH = 10/16;
        const rX = (1.0 - rW) / 2; // Center horizontally
        const rY = 0.0; // cy was 0 in old code after -3px offset

        let minU = uBase + rX * spriteWidth;
        let maxU = uBase + (rX + rW) * spriteWidth;
        let minV = rY;
        let maxV = rH;

        // Flip V to match renderer convention
        let tmpV = minV; minV = 1.0 - maxV; maxV = 1.0 - tmpV;

        // Set color with shading
        this.tessellator.setColor(1, 1, 1);

        // Add faces to tessellator
        this.addDistortFace(world, EnumBlockFace.NORTH, false, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, distortX, distortZ);
        this.addDistortFace(world, EnumBlockFace.EAST, false, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, distortX, distortZ);
        this.addDistortFace(world, EnumBlockFace.SOUTH, false, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, distortX, distortZ);
        this.addDistortFace(world, EnumBlockFace.WEST, false, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, distortX, distortZ);

        // --- Use explicit 2x2 crop at (7,8) for the top face so it's NOT just a scaled down full sprite ---
        const rsW = 2/16, rsH = 2/16;
        const rsX = 7/16, rsY = 8/16;

        let sMinU = uBase + rsX * spriteWidth;
        let sMaxU = uBase + (rsX + rsW) * spriteWidth;
        let sMinV = rsY;
        let sMaxV = rsY + rsH;
        // Flip V for renderer
        let tmp2 = sMinV; sMinV = 1.0 - sMaxV; sMaxV = 1.0 - tmp2;

        // Add top face using the 2x2 crop UVs
        this.addFace(world, EnumBlockFace.TOP, false, minX, minY, minZ, maxX, maxY, maxZ, sMinU, sMinV, sMaxU, sMaxV);
        
        // Restore standard tessellator if we switched for a custom torch texture
        this.tessellator = originalTessellator;


    }

    addDistortFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, distortX, distortZ) {
        if (face === EnumBlockFace.NORTH) {
            this.addBlockCorner(world, face, ambientOcclusion, minX, maxY, minZ, minU, minV);
            this.addBlockCorner(world, face, ambientOcclusion, minX + distortX, minY, minZ + distortZ, minU, maxV);
            this.addBlockCorner(world, face, ambientOcclusion, maxX + distortX, minY, minZ + distortZ, maxU, maxV);
            this.addBlockCorner(world, face, ambientOcclusion, maxX, maxY, minZ, maxU, minV);
        }
        if (face === EnumBlockFace.SOUTH) {
            this.addBlockCorner(world, face, ambientOcclusion, minX, maxY, maxZ, maxU, minV);
            this.addBlockCorner(world, face, ambientOcclusion, maxX, maxY, maxZ, minU, minV);
            this.addBlockCorner(world, face, ambientOcclusion, maxX + distortX, minY, maxZ + distortZ, minU, maxV);
            this.addBlockCorner(world, face, ambientOcclusion, minX + distortX, minY, maxZ + distortZ, maxU, maxV);
        }
        if (face === EnumBlockFace.WEST) {
            this.addBlockCorner(world, face, ambientOcclusion, minX + distortX, minY, maxZ + distortZ, minU, maxV);
            this.addBlockCorner(world, face, ambientOcclusion, minX + distortX, minY, minZ + distortZ, maxU, maxV);
            this.addBlockCorner(world, face, ambientOcclusion, minX, maxY, minZ, maxU, minV);
            this.addBlockCorner(world, face, ambientOcclusion, minX, maxY, maxZ, minU, minV);
        }
        if (face === EnumBlockFace.EAST) {
            this.addBlockCorner(world, face, ambientOcclusion, maxX, maxY, maxZ, maxU, minV);
            this.addBlockCorner(world, face, ambientOcclusion, maxX, maxY, minZ, minU, minV);
            this.addBlockCorner(world, face, ambientOcclusion, maxX + distortX, minY, minZ + distortZ, minU, maxV);
            this.addBlockCorner(world, face, ambientOcclusion, maxX + distortX, minY, maxZ + distortZ, maxU, maxV);
        }
    }



    renderItemHand(group, block, brightness, isOffhand) {
        const type = block.getRenderType();
        const id = block.getId();

        // Check for blocks that should be extruded in hand
        const forceExtruded = (
            type === BlockRenderType.CROSS ||
            type === BlockRenderType.TORCH ||
            type === BlockRenderType.RAIL ||
            type === BlockRenderType.REDSTONE_DUST ||
            type === BlockRenderType.DOUBLE_PLANT ||
            type === BlockRenderType.LADDER ||
            type === BlockRenderType.ITEM ||
            type === BlockRenderType.MAP ||
            type === BlockRenderType.SIGN ||
            type === BlockRenderType.WALL_SIGN ||
            id === 83 || // Sugar Cane
            id === 33    // Dead Bush
        );

        // Collect and prepare all possible tessellators
        const tessellators = [
            this.tessellator, this.foliageTessellator,
            this.craftingTableTessellator, this.doorTessellator, this.furnaceTessellator,
            this.chestTessellator, this.fireTessellator, this.portalTessellator
        ];
        this.textureTessellators.forEach(t => tessellators.push(t));

        tessellators.forEach(t => {
            t.setTransparent(block.isTranslucent());
            t.startDrawing();
            t.setColor(1, 1, 1, 1);
        });

        this.tessellator.bindTexture(this.worldRenderer.textureTerrain);

        // Perform standard rendering
        if (forceExtruded) {
            this.renderExtrudedItem(null, block, 0, 0, 0);
        } else {
            this.renderBlock(null, block, false, 0, 0, 0, false, 0, group, brightness, true);
        }

        // Draw and transform the results
        for (let tess of tessellators) {
            if (tess.addedVertices === 0) continue;

            tess.transformBrightness(brightness);
            let mesh = tess.draw(group);
            if (!mesh) continue;

            // Center geometry for easy pivot rotation
            mesh.geometry.center();
            mesh.material.side = THREE.DoubleSide;

            // Proper 3rd person hand positioning/scaling (Bone-space)
            if (forceExtruded) {
                // Tools/Items - Scaled to 12.0 units in bone-space
                mesh.scale.set(12, 12, 12);
                mesh.position.set(0, 10, 0);
                
                // Rotation for "held" look (pointing forward/down)
                mesh.rotation.set(Math.PI / 2, 0, (isOffhand ? -1 : 1) * Math.PI / 4);
                // Nudge out of palm slightly
                mesh.position.z += isOffhand ? 1.5 : -1.5;
            } else {
                // Blocks - Scaled to 5.0 units in bone-space
                mesh.scale.set(5, 5, 5);
                mesh.position.set(0, 10, 0);
                // Tilted blocks look more natural
                mesh.rotation.set(0, Math.PI / 4, 0);
            }
        }
    }

    renderBlockInFirstPerson(group, block, brightness) {
        const player = this.worldRenderer.minecraft.player;
        const inv = player.inventory;
        const stack = inv.getStackInSlot(inv.selectedSlotIndex);
        const tag = stack ? stack.tag : null;

        const isEating = (player.itemInUse !== null) || (this.worldRenderer.minecraft.currentScreen && this.worldRenderer.minecraft.currentScreen.constructor.name === "GuiDevTools" && this.worldRenderer.minecraft.devTools.mode === "eating");
        const isCrossbowMode = (this.worldRenderer.minecraft.currentScreen && this.worldRenderer.minecraft.currentScreen.constructor.name === "GuiDevTools" && this.worldRenderer.minecraft.devTools.mode === "crossbow");
        const isFishingMode = (this.worldRenderer.minecraft.currentScreen && this.worldRenderer.minecraft.currentScreen.constructor.name === "GuiDevTools" && this.worldRenderer.minecraft.devTools.mode === "fishingHand");

        const type = block.getRenderType();
        const id = block.getId();

        // Check for blocks that should be extruded in hand (Redstone, Torch, Rails, Saplings/Foliage, Signs)
        const forceExtruded = (
            type === BlockRenderType.CROSS ||
            type === BlockRenderType.TORCH ||
            type === BlockRenderType.RAIL ||
            type === BlockRenderType.REDSTONE_DUST ||
            type === BlockRenderType.DOUBLE_PLANT ||
            type === BlockRenderType.LADDER ||
            type === BlockRenderType.ITEM ||
            type === BlockRenderType.SIGN ||
            type === BlockRenderType.WALL_SIGN ||
            id === 83 || // Sugar Cane
            id === 33    // Dead Bush
        );

        // Collect all utilized tessellators to flush vertices from complex blocks
        const tessellators = [
            this.tessellator, this.foliageTessellator,
            this.craftingTableTessellator, this.doorTessellator, this.furnaceTessellator,
            this.chestTessellator, this.fireTessellator, this.portalTessellator,
            this.glintTessellator1, this.glintTessellator2
        ];
        this.textureTessellators.forEach(t => tessellators.push(t));

        // Prepare all tessellators
        tessellators.forEach(t => {
            t.setTransparent(block.isTranslucent());
            t.startDrawing();
            t.setColor(1, 1, 1, 1);
        });

        // Ensure default terrain is bound
        this.tessellator.bindTexture(this.worldRenderer.textureTerrain);

        // Perform standard rendering
        if (forceExtruded) {
            this.renderExtrudedItem(null, block, 0, 0, 0, brightness, tag);
        } else {
            this.renderBlock(null, block, false, 0, 0, 0, false, 0, group, brightness, true, tag);
        }

        // Change brightness and draw all utilized tessellators
        for (let tess of tessellators) {
            if (tess.addedVertices === 0) continue;

            // tess.transformBrightness(brightness); // Removed: we apply dynamic lighting to the mesh material color in the render loop
            let mesh = tess.draw(group);
            if (!mesh) continue;

            mesh.geometry.center();

            const dev = this.worldRenderer.minecraft.devTools;
            let mode = isEating ? "eating" : (isCrossbowMode ? "crossbow" : (isFishingMode ? "fishingHand" : (forceExtruded ? "item" : "block")));
            
            // Apply unique specialty positioning
            if (id === 499) mode = "crossbow";
            if (id === 346) mode = "fishingHand";
            
            const vals = dev[mode];

            mesh.material.side = THREE.DoubleSide;
            
            if (block.getRenderType() === BlockRenderType.MAP) {
                // Position Map centered relative to parent group
                mesh.position.set(0, 0, 0);
                // Rotate to face camera
                mesh.rotation.set(0, Math.PI, 0); 
                // Scale to fill view nicely
                mesh.scale.set(18, 18, 18);
            } else {
                mesh.position.set(vals.x, vals.y, vals.z);
                mesh.rotation.order = 'ZYX';
                mesh.rotation.set(vals.rotationX, vals.rotationY, vals.rotationZ);
                mesh.scale.set(vals.scale, vals.scale, vals.scale);
            }
        }
    }

    renderGuiBlock(group, block, x, y, size, brightness, force3D = false, tag = null) {
        const type = block.getRenderType();
        const id = block.getId();

        // Check if the block should be rendered as a 2D texture (sprite) in GUI
        const forceExtruded = (
            type === BlockRenderType.CROSS ||
            type === BlockRenderType.TORCH ||
            type === BlockRenderType.LADDER ||
            type === BlockRenderType.RAIL ||
            type === BlockRenderType.PAINTING ||
            type === BlockRenderType.TRAPDOOR ||
            type === BlockRenderType.ITEM ||
            type === BlockRenderType.MAP ||
            type === BlockRenderType.DOUBLE_PLANT ||
            type === BlockRenderType.LEVER ||
            type === BlockRenderType.SIGN ||
            type === BlockRenderType.WALL_SIGN ||
            type === BlockRenderType.LIGHT ||
            type === BlockRenderType.BARRIER ||
            id === 33 || // Dead bush
            id === 83    // Sugar cane
        );

        if (forceExtruded && !force3D) {
            // Use 0, 0 because the parent group is already positioned at x, -y by the ItemRenderer
            const itemGroup = new THREE.Group();
            this.renderFlatItem(block, 0, 0, -10, itemGroup, brightness, size, tag);
            group.add(itemGroup);
            return;
        }

        // --- 3D GUI Rendering for standard blocks or extruded items ---

        // Ensure any custom tessellator utilized by renderBlock is initialized and flushed
        if (block.textureName) {
            this.getTessellator(block.textureName);
        }

        // Collect all possible tessellators to flush vertices from complex blocks
        const tessellators = [
            this.tessellator, this.foliageTessellator,
            this.craftingTableTessellator, this.doorTessellator, this.furnaceTessellator,
            this.chestTessellator, this.fireTessellator, this.portalTessellator,
            this.glintTessellator1, this.glintTessellator2
        ];
        
        this.textureTessellators.forEach(t => tessellators.push(t));

        // Prepare all tessellators for this pass
        tessellators.forEach(t => {
            t.setTransparent(block.isTranslucent());
            t.startDrawing();
            // Reset color/brightness to white
            t.setColor(1, 1, 1, 1);
        });

        // Ensure default terrain is bound
        this.tessellator.bindTexture(this.worldRenderer.textureTerrain);

        // Perform standard rendering into a temporary group to catch meshes/models
        const tempGroup = new THREE.Group();

        if (forceExtruded && force3D) {
            this.renderExtrudedItem(null, block, 0, 0, 0, brightness, tag);
        } else {
            this.renderBlock(null, block, false, 0, 0, 0, false, 0, tempGroup, brightness, force3D);
        }

        // Flush data from all tessellators that were utilized during renderBlock
        tessellators.forEach(t => {
            if (t.addedVertices > 0) {
                t.transformBrightness(brightness);
                t.draw(tempGroup);
            }
        });

        // Calculate combined bounding box of all parts to center the block correctly as a unit
        const combinedBox = new THREE.Box3().setFromObject(tempGroup);
        const center = new THREE.Vector3();
        
        // Safety check for empty geometry to prevent NaN positioning (which crashes the UI render)
        if (combinedBox.isEmpty()) {
            center.set(0, 0, 0);
        } else {
            combinedBox.getCenter(center);
        }

        // Apply GUI transformations (rotation, position, scale) to all children (meshes and models)
        tempGroup.children.forEach(child => {
            // Apply 3D tilt for blocks (showing more side/front for better recognition)
            child.rotation.x = MathHelper.toRadians(30);
            child.rotation.y = MathHelper.toRadians(45);
            child.rotation.z = 0;

            // Adjust scale to fit the slot nicely
            const s = size * 0.9823;
            child.scale.set(s, s, s);

            // Offset child relative to its own center so the group as a whole is centered.
            // Nudge left (0.20 units) and up (0.09 units) to correct the visual bias of rotated blocks in slots.
            child.position.x -= (center.x + 0.20);
            child.position.y -= (center.y - 0.09);
            child.position.z -= center.z;
            child.position.multiplyScalar(s);
            
            // Depth offset
            child.position.z -= 10;
        });

        // Transfer results to the actual target group
        while (tempGroup.children.length > 0) {
            group.add(tempGroup.children[0]);
        }
    }

    renderMobHead(world, block, x, y, z, group) {
        if (!group) return;
        
        let headModel = this.skeletonHeadModel;
        if (block.mobType === "zombie") headModel = this.zombieHeadModel;
        else if (block.mobType === "creeper") headModel = this.creeperHeadModel;
        else if (block.mobType === "enderman") headModel = this.endermanHeadModel;

        if (!headModel) return;

        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        // 0-15 rotation mapping
        let rotation = (meta & 15) * (360.0 / 16.0);

        let model = headModel.clone();
        model.material = model.material.clone();
        
        if (model.geometry) {
            model.geometry.computeBoundingBox();
            const offset = new THREE.Vector3();
            model.geometry.boundingBox.getCenter(offset);
            model.geometry.translate(-offset.x, -model.geometry.boundingBox.min.y, -offset.z);
        }

        // Apply 15% scale increase from base 0.625 (0.625 * 1.15 = 0.71875)
        model.scale.set(0.71875, 0.71875, 0.71875);

        // Align with floor and rotate towards player (flipped 180 degrees from previous)
        model.position.set(x + 0.5, y, z + 0.5);
        model.rotation.y = MathHelper.toRadians(-rotation);

        // Apply block-consistent lighting instead of mob-entity curve
        let light = world ? world.getLightBrightness(x, y, z) : 1.0;
        let globalBrightness = this.worldRenderer.minecraft.settings.brightness;
        const dev = this.worldRenderer.minecraft.devTools.lighting;
        
        // Match the smooth lighting curve used for block faces
        let brightness = Math.pow(light, dev.gamma); 
        brightness = brightness + (1.0 - brightness) * globalBrightness;
        brightness = Math.max(0.35, brightness); // Higher floor (0.35) for better visibility
        
        model.material.color.setScalar(brightness);

        group.add(model);
        model.updateMatrixWorld(true);
    }

    renderBed(world, block, ambientOcclusion, x, y, z, group) {
        // Tradition render if no 3D group provided (e.g. legacy fallback) or model not loaded
        if (!group || !this.bedModel) {
            this.renderBedTraditional(world, block, ambientOcclusion, x, y, z);
            return;
        }

        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let isHead = (meta & 8) !== 0;
        let dir = meta & 3;

        // Only render from the foot part to avoid double rendering in the chunk
        if (isHead && world !== null) return;

        let model = this.bedModel.clone();
        
        // Adjust position: base block is x, y, z. 
        // 3D model might need centering depending on its internal origin.
        model.position.set(x + 0.5, y, z + 0.5);
        
        // Apply rotation and offset based on metadata
        // Direction: 0=S, 1=W, 2=N, 3=E
        let rotationY = 0;
        if (dir === 0) { // South (+Z)
            rotationY = 0;
            model.position.z += 0.5;
        } else if (dir === 1) { // West (-X)
            rotationY = Math.PI / 2;
            model.position.x -= 0.5;
        } else if (dir === 2) { // North (-Z)
            rotationY = Math.PI;
            model.position.z -= 0.5;
        } else if (dir === 3) { // East (+X)
            rotationY = -Math.PI / 2;
            model.position.x += 0.5;
        }
        model.rotation.y = rotationY;

        // Apply world lighting
        let brightness = world ? Math.max(world.getLightBrightness(x, y + 1, z), 0.3) : 1.0;
        model.traverse(child => {
            if (child.isMesh) {
                child.material = child.material.clone();
                child.material.color.setScalar(brightness);
                child.material.needsUpdate = true;
            }
        });

        group.add(model);
        // Force update of the model's world matrix immediately so it renders correctly 
        // in the current frame's frustum check, even if its parents have matrixAutoUpdate=false.
        model.updateMatrixWorld(true);
    }

    renderRail(world, block, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        const id = block.getId();
        
        let isPoweredOn = (id === 159);
        let isPoweredOff = (id === 158);
        let isCurved = meta >= 6;
        
        let textureName = "../../items (1).png";
        let textureIndex = 32;

        if (isCurved) textureIndex = 33;
        else if (isPoweredOn) textureIndex = 34;
        else if (isPoweredOff) textureIndex = 35;
        
        let tessellator = this.getTessellator(textureName);
        this.bindCustomTexture(tessellator, textureName);
        
        let originalTessellator = this.tessellator;
        this.tessellator = tessellator;

        let level = world ? world.getTotalLightAt(x, y, z) : 15;
        let brightness = 0.9 / 15.0 * Math.max(1, level) + 0.1;
        this.tessellator.setColor(brightness, brightness, brightness);

        let yOffset = 0.01; 
        let x0 = x, x1 = x + 1;
        let y0 = y + yOffset;
        let z0 = z, z1 = z + 1;

        // UVs from items (1).png sheet
        let spriteCols = 37;
        let spriteWidth = 1.0 / spriteCols;
        let u0 = textureIndex * spriteWidth;
        let u1 = u0 + spriteWidth;
        let v0 = 0, v1 = 1;

        // Unified Rail Geometry Logic to fix rotation bugs
        // Corrected UV mapping for all rail states.
        
        // Handle Slopes (Meta 2-5)
        if (meta === 2) { // Ascending East (+X)
            this.tessellator.addVertexWithUV(x0, y0, z1, u0, v1);
            this.tessellator.addVertexWithUV(x0, y0, z0, u1, v1);
            this.tessellator.addVertexWithUV(x1, y0 + 1, z0, u1, v0);
            this.tessellator.addVertexWithUV(x1, y0 + 1, z1, u0, v0);
        } else if (meta === 3) { // Ascending West (-X)
            this.tessellator.addVertexWithUV(x1, y0, z0, u0, v1);
            this.tessellator.addVertexWithUV(x1, y0, z1, u1, v1);
            this.tessellator.addVertexWithUV(x0, y0 + 1, z1, u1, v0);
            this.tessellator.addVertexWithUV(x0, y0 + 1, z0, u0, v0);
        } else if (meta === 4) { // Ascending North (-Z)
            this.tessellator.addVertexWithUV(x1, y0, z1, u1, v1);
            this.tessellator.addVertexWithUV(x0, y0, z1, u0, v1);
            this.tessellator.addVertexWithUV(x0, y0 + 1, z0, u0, v0);
            this.tessellator.addVertexWithUV(x1, y0 + 1, z0, u1, v0);
        } else if (meta === 5) { // Ascending South (+Z)
            this.tessellator.addVertexWithUV(x0, y0, z0, u1, v1);
            this.tessellator.addVertexWithUV(x1, y0, z0, u0, v1);
            this.tessellator.addVertexWithUV(x1, y0 + 1, z1, u0, v0);
            this.tessellator.addVertexWithUV(x0, y0 + 1, z1, u1, v0);
        }
        // Flat Straight
        else if (meta === 0) { // N-S
            this.tessellator.addVertexWithUV(x0, y0, z1, u0, v1);
            this.tessellator.addVertexWithUV(x0, y0, z0, u0, v0);
            this.tessellator.addVertexWithUV(x1, y0, z0, u1, v0);
            this.tessellator.addVertexWithUV(x1, y0, z1, u1, v1);
        } else if (meta === 1) { // E-W
            this.tessellator.addVertexWithUV(x0, y0, z0, u0, v1);
            this.tessellator.addVertexWithUV(x1, y0, z0, u0, v0);
            this.tessellator.addVertexWithUV(x1, y0, z1, u1, v0);
            this.tessellator.addVertexWithUV(x0, y0, z1, u1, v1);
        } 
        // Flat Curved
        else if (meta === 6) { // S-E
            this.tessellator.addVertexWithUV(x0, y0, z1, u0, v1);
            this.tessellator.addVertexWithUV(x0, y0, z0, u0, v0);
            this.tessellator.addVertexWithUV(x1, y0, z0, u1, v0);
            this.tessellator.addVertexWithUV(x1, y0, z1, u1, v1);
        } else if (meta === 7) { // S-W
            this.tessellator.addVertexWithUV(x0, y0, z0, u0, v1);
            this.tessellator.addVertexWithUV(x1, y0, z0, u0, v0);
            this.tessellator.addVertexWithUV(x1, y0, z1, u1, v0);
            this.tessellator.addVertexWithUV(x0, y0, z1, u1, v1);
        } else if (meta === 8) { // N-W
            this.tessellator.addVertexWithUV(x1, y0, z0, u0, v1);
            this.tessellator.addVertexWithUV(x1, y0, z1, u0, v0);
            this.tessellator.addVertexWithUV(x0, y0, z1, u1, v0);
            this.tessellator.addVertexWithUV(x0, y0, z0, u1, v1);
        } else if (meta === 9) { // N-E
            this.tessellator.addVertexWithUV(x1, y0, z1, u0, v1);
            this.tessellator.addVertexWithUV(x0, y0, z1, u0, v0);
            this.tessellator.addVertexWithUV(x0, y0, z0, u1, v0);
            this.tessellator.addVertexWithUV(x1, y0, z0, u1, v1);
        }

        this.tessellator = originalTessellator;
    }

    renderBedTraditional(world, block, ambientOcclusion, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let isHead = (meta & 8) !== 0;
        let dir = meta & 3;

        let originalTessellator = this.tessellator;
        let tess = this.getTessellator("../../bed.png");
        this.bindCustomTexture(tess, "../../bed.png");
        this.tessellator = tess;

        const u = 0.25, v = 0.5;
        let bodyMinY = y + 0.1875, bodyMaxY = y + 0.5625;

        for (let face of EnumBlockFace.values()) {
            if (world !== null && face === EnumBlockFace.BOTTOM) continue;
            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                let uIdx = 0, vIdx = 0;
                if (face === EnumBlockFace.TOP) { uIdx = isHead ? 0 : 1; vIdx = 0; }
                else if (face === EnumBlockFace.BOTTOM) { uIdx = 2; vIdx = 1; }
                else {
                    if (isHead) {
                        if ((dir === 0 && face === EnumBlockFace.NORTH) || (dir === 1 && face === EnumBlockFace.EAST) || (dir === 2 && face === EnumBlockFace.SOUTH) || (dir === 3 && face === EnumBlockFace.WEST)) continue;
                        uIdx = ((dir === 0 && face === EnumBlockFace.SOUTH) || (dir === 1 && face === EnumBlockFace.WEST) || (dir === 2 && face === EnumBlockFace.NORTH) || (dir === 3 && face === EnumBlockFace.EAST)) ? 0 : 2;
                        vIdx = ((dir === 0 && face === EnumBlockFace.SOUTH) || (dir === 1 && face === EnumBlockFace.WEST) || (dir === 2 && face === EnumBlockFace.NORTH) || (dir === 3 && face === EnumBlockFace.EAST)) ? 1 : 0;
                    } else {
                        if ((dir === 0 && face === EnumBlockFace.SOUTH) || (dir === 1 && face === EnumBlockFace.WEST) || (dir === 2 && face === EnumBlockFace.NORTH) || (dir === 3 && face === EnumBlockFace.EAST)) continue;
                        uIdx = ((dir === 0 && face === EnumBlockFace.NORTH) || (dir === 1 && face === EnumBlockFace.EAST) || (dir === 2 && face === EnumBlockFace.SOUTH) || (dir === 3 && face === EnumBlockFace.WEST)) ? 1 : 3;
                        vIdx = ((dir === 0 && face === EnumBlockFace.NORTH) || (dir === 1 && face === EnumBlockFace.EAST) || (dir === 2 && face === EnumBlockFace.SOUTH) || (dir === 3 && face === EnumBlockFace.WEST)) ? 1 : 0;
                    }
                }
                let minU = uIdx * u, maxU = minU + u, minV = vIdx * v, maxV = minV + v;
                let tempV = minV; minV = 1.0 - maxV; maxV = 1.0 - tempV;
                if (!ambientOcclusion) {
                    let level = world === null ? 15 : world.getTotalLightAt(x + face.x, y + face.y, z + face.z);
                    let b = 0.9 / 15.0 * Math.max(1, level) + 0.1;
                    let shade = b * face.getShading();
                    this.tessellator.setColor(shade, shade, shade);
                }
                this.addFace(world, face, ambientOcclusion, x, bodyMinY, z, x + 1, bodyMaxY, z + 1, minU, minV, maxU, maxV);
            }
        }
        this.tessellator = originalTessellator;
    }

    renderChest(world, block, ambientOcclusion, x, y, z) {
        // Prefer a THREE texture (created via minecraft helper) to avoid comparing raw Image objects
        let threeTexture = null;
        try {
            threeTexture = this.worldRenderer.minecraft.getThreeTexture(block.textureName);
        } catch (e) {
            threeTexture = null;
        }
        // Fallback: try lookup without path if stored under filename key
        if (!threeTexture && block.textureName.includes('/')) {
            const parts = block.textureName.split('/');
            threeTexture = this.worldRenderer.minecraft.getThreeTexture(parts[parts.length - 1]);
        }
        if (!threeTexture) {
            // Last resort: try raw image resource and wrap it (keeps encapsulation local)
            const img = this.worldRenderer.minecraft.resources[block.textureName];
            if (!img) return;
            threeTexture = new THREE.CanvasTexture(img);
            threeTexture.magFilter = THREE.NearestFilter;
            threeTexture.minFilter = THREE.NearestFilter;
            threeTexture.flipY = false;
        }

        // Only rebind when needed
        if (!this.chestTessellator.material.map || this.chestTessellator.material.map !== threeTexture) {
            threeTexture.magFilter = THREE.NearestFilter;
            threeTexture.minFilter = THREE.NearestFilter;
            threeTexture.flipY = false;
            this.chestTessellator.bindTexture(threeTexture);
        }

        let originalTessellator = this.tessellator;
        this.tessellator = this.chestTessellator;

        let boundingBox = block.getBoundingBox(world, x, y, z);

        // Check for adjacent chests
        let adjacentN = world ? world.getBlockAt(x, y, z - 1) === block.getId() : false;
        let adjacentS = world ? world.getBlockAt(x, y, z + 1) === block.getId() : false;
        let adjacentW = world ? world.getBlockAt(x - 1, y, z) === block.getId() : false;
        let adjacentE = world ? world.getBlockAt(x + 1, y, z) === block.getId() : false;

        // chest sprite sheet has 3 columns: 0=front,1=sides,2=top
        let spriteCount = 3;
        let spriteWidth = 1 / spriteCount;

        const eps = 0.0005;

        let values = EnumBlockFace.values();
        for (let i = 0; i < values.length; i++) {
            let face = values[i];

            if (world === null || block.shouldRenderFace(world, x, y, z, face)) {
                
                // Skip internal faces for double chest
                if (face === EnumBlockFace.NORTH && adjacentN) continue;
                if (face === EnumBlockFace.SOUTH && adjacentS) continue;
                if (face === EnumBlockFace.WEST && adjacentW) continue;
                if (face === EnumBlockFace.EAST && adjacentE) continue;

                let minX = x + boundingBox.minX;
                let minY = y + boundingBox.minY;
                let minZ = z + boundingBox.minZ;
                let maxX = x + boundingBox.maxX;
                let maxY = y + boundingBox.maxY;
                let maxZ = z + boundingBox.maxZ;

                // Determine texture index for chest: top/bottom->2, front->0, sides->1
                let textureIndex = 1;
                if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) {
                    textureIndex = 2;
                } else {
                    // attempt to use block meta orientation if available (0..3)
                    let meta = world ? world.getBlockDataAt(x, y, z) : 0;
                    let dir = meta & 3;
                    // Map front to one face (use same mapping as doors/furnace code)
                    let isFront = false;
                    if (dir === 0 && face === EnumBlockFace.SOUTH) isFront = true;
                    else if (dir === 1 && face === EnumBlockFace.WEST) isFront = true;
                    else if (dir === 2 && face === EnumBlockFace.NORTH) isFront = true;
                    else if (dir === 3 && face === EnumBlockFace.EAST) isFront = true;
                    
                    if (isFront) textureIndex = 0;
                }

                let minU = textureIndex * spriteWidth + eps;
                let maxU = (textureIndex + 1) * spriteWidth - eps;
                let minV = 0.0;
                let maxV = 1.0;

                // Flip V for renderer
                let tempV = minV;
                minV = 1.0 - maxV; 
                maxV = 1.0 - tempV;

                let color = block.getColor(world, x, y, z, face);
                let red = (color >> 16 & 255) / 255.0;
                let green = (color >> 8 & 255) / 255.0;
                let blue = (color & 255) / 255.0;

                if (!ambientOcclusion) {
                    let level = world === null ? 15 : world.getTotalLightAt(minX + face.x, minY + face.y, minZ + face.z);
                    
                    // Visual minimum light level 1
                    if (level < 1) level = 1;

                    let brightness = this.getVisualLightBrightness(level);

                    let shade = brightness * face.getShading();
                    this.tessellator.setColor(red * shade, green * shade, blue * shade);
                }

                this.addFace(world, face, ambientOcclusion, minX, minY, minZ, maxX, maxY, maxZ, minU, minV, maxU, maxV, red, green, blue);
            }
        }

        this.tessellator = originalTessellator;
    }

    renderFlatItem(block, x, y, z, group, brightness = 1.0, size = 1.0, tag = null) {
        let isEnchanted = block.isEnchanted || (tag && tag.enchanted);
        let textureImage;
        let textureIndex = 0;
        let textureCols = block.cols || 1;
        let textureRows = block.rows || 1;
        let color = 0xffffff;

        const type = block.getRenderType();
        const id = block.getId();

        // 1. Determine Texture, Index, and Color (logic ported from Gui.js)
        let textureInfo = block.getTextureForFace(EnumBlockFace.NORTH);

        if (typeof textureInfo === 'object' && textureInfo.type === 'custom') {
            textureImage = this.worldRenderer.minecraft.resources[textureInfo.name];
            textureIndex = textureInfo.index || 0;
            textureCols = textureInfo.cols || 1;
            textureRows = textureInfo.rows || 1;

            if (type === BlockRenderType.CROSS || type === BlockRenderType.DOUBLE_PLANT) {
                color = block.getColor(null, 0, 0, 0, null);
            }
        } else if (block.textureWidth > 0 && block.textureHeight > 0) {
            textureImage = this.worldRenderer.minecraft.resources[block.textureName] || this.worldRenderer.minecraft.resources["../../" + block.textureName] || this.worldRenderer.minecraft.resources[block.textureName.replace(/^\.?\.?\/+/, '')];
            textureCols = Math.floor(block.textureWidth / 16);
            textureRows = Math.floor(block.textureHeight / 16);
            textureIndex = block.textureIndex || 0;
        } else if (type === BlockRenderType.ORE || type === BlockRenderType.MINERAL) {
            let path = block.textureName;
            if (path && !path.startsWith("../../")) path = "../../" + path;
            textureImage = this.worldRenderer.minecraft.resources[path] || this.worldRenderer.minecraft.resources[block.textureName];
            textureIndex = block.textureIndex || 0;
            textureCols = 1;
            if (path && path.includes("orestuff.png")) textureCols = 14;
            else if (path && path.includes("stonesheet.png")) textureCols = 8;
            else if (path && path.includes("nether.png")) textureCols = 5;
            else if (path && path.includes("magma")) textureCols = 3;
            else if (textureImage && textureImage.width > textureImage.height) textureCols = Math.floor(textureImage.width / textureImage.height);
            textureRows = 1;
        } else if (type === BlockRenderType.CROSS || type === BlockRenderType.DOUBLE_PLANT) {
            let path = block.textureName;
            if (path && !path.startsWith("../../")) path = "../../" + path;
            textureImage = this.worldRenderer.minecraft.resources[path] || this.worldRenderer.minecraft.resources[block.textureName];
            
            // Check for custom texture result (handles berry bush stages)
            let textureInfo = block.getTextureForFace(null, 0);
            if (typeof textureInfo === 'object' && textureInfo.type === 'custom') {
                textureIndex = textureInfo.index;
                textureCols = textureInfo.cols || 1;
            } else {
                textureIndex = block.textureIndex;
            }
            
            if (path && path.includes("foliage.png")) {
                textureCols = 21;
            } else {
                textureCols = (type === BlockRenderType.DOUBLE_PLANT) ? 1 : 3;
                if (block.textureName && type === BlockRenderType.CROSS) {
                    const name = block.textureName.toLowerCase();
                    if (name.includes("deadandsugar")) textureCols = 2;
                    else if (name.includes("desert") || name.includes("sandstuff")) textureCols = 10;
                    else if (name.includes("random stuff")) textureCols = 9;
                    else if (name.includes("tulip") || name.includes("lily") || name.includes("mushroom") || name.includes("sapling") || name.includes("wheat_stage")) textureCols = 1;
                }
            }
            color = block.getColor(null, 0, 0, 0, null);
        } else if (type === BlockRenderType.PAINTING) {
            textureImage = this.worldRenderer.minecraft.resources[block.textureName];
            textureCols = 1;
        } else if (type === BlockRenderType.MAP) {
            // Use the standard 2D map icon from tools (1).png for icons
            textureImage = this.worldRenderer.minecraft.resources[block.textureName];
            textureIndex = block.textureIndex !== undefined ? block.textureIndex : 40;
            textureCols = 43; // tools (1).png has 43 cols
        } else if (type === BlockRenderType.BED) {
            textureImage = this.worldRenderer.minecraft.resources["../../bed.png"];
            textureIndex = 1; // Use foot top
            textureCols = 4;
            textureRows = 2;
        } else if (type === BlockRenderType.RAIL) {
            textureImage = this.worldRenderer.minecraft.resources["../../items (1).png"];
            const id = block.getId();
            if (id === 159) textureIndex = 34;
            else if (id === 158) textureIndex = 35;
            else textureIndex = 32;
            textureCols = 37;
        } else if (type === BlockRenderType.LADDER) {
            let path = block.textureName || "../../items (1).png";
            if (path && !path.startsWith("../../")) path = "../../" + path;
            textureImage = this.worldRenderer.minecraft.resources[path] || this.worldRenderer.minecraft.resources[block.textureName];
            textureIndex = block.textureIndex !== undefined ? block.textureIndex : 36;
            textureCols = block.cols || 37;
        } else if (type === BlockRenderType.TORCH) {
            textureImage = this.worldRenderer.minecraft.resources["../../blocks.png"];
            textureIndex = block.getTextureForFace(EnumBlockFace.NORTH);
            textureCols = 14;
        } else if (type === BlockRenderType.DOUBLE_PLANT) {
            let path = block.bottomTexture;
            if (path && !path.startsWith("../../")) path = "../../" + path;
            textureImage = this.worldRenderer.minecraft.resources[path] || this.worldRenderer.minecraft.resources[block.bottomTexture];
            textureCols = 1;
        } else if (type === BlockRenderType.TRAPDOOR) {
            textureImage = this.worldRenderer.minecraft.resources[block.textureName];
            textureIndex = block.textureIndex || 0;
            textureCols = 6;
        } else if (type === BlockRenderType.LEVER) {
            textureImage = this.worldRenderer.minecraft.resources[block.textureName];
            textureIndex = 0;
            textureCols = 1;
        } else if (type === BlockRenderType.ITEM || type === BlockRenderType.SIGN || type === BlockRenderType.WALL_SIGN) {
            let textureName = block.textureName;
            textureIndex = block.textureIndex !== undefined ? block.textureIndex : 0;
            textureCols = 1;

            if (textureName && textureName.includes("random stuff")) {
                textureCols = 9;
            } else if (textureName && textureName.includes("tools (1).png")) {
                textureCols = 43;
            } else if (textureName && textureName.includes("items (1).png")) {
                textureCols = 37;
            } else if (textureName && textureName.includes("redstonestuff")) {
                textureCols = 22;
            } else if (textureName && textureName.includes("farming.png")) {
                textureCols = 20;
            } else if (textureName && textureName.includes("food.png")) {
                textureCols = 18;
            } else if (textureName && textureName.includes("beetroot (1).png")) {
                textureCols = 7;
            } else if (textureName && (textureName.includes("foliage.png") || textureName === "foliage.png")) {
                textureCols = 21;
            } else if (textureName && textureName.includes("dye.png")) {
                textureCols = 16;
            } else if (textureName && textureName.includes("endstuff.png")) {
                textureCols = 7;
            } else if (textureName && textureName.includes("signs.png")) {
                textureCols = 5;
            } else if (textureName && textureName.includes("food2.png")) {
                textureCols = 5;
            } else if (textureName && textureName.includes("dicsandbox")) {
                textureCols = 14;
            } else if (textureName && textureName.includes("crossbow.png")) {
                textureCols = 5;
            } else if (textureName && textureName.includes("bottles.png")) {
                textureCols = 3;
            } else if (textureName && textureName.includes("slimestuff.png")) {
                textureCols = 2;
            }

            // Handle bow animation in GUI
            if (id === 261 && this.worldRenderer.minecraft.bowPullDuration > 0) {
                let duration = this.worldRenderer.minecraft.bowPullDuration;
                if (duration >= 16) textureName = "../../bowpull3.png";
                else if (duration >= 8) textureName = "../../bowpull2.png";
                else textureName = "../../bowpull1.png";
                textureIndex = 0;
                textureCols = 1;
            }

            // Handle crossbow animation in GUI (Fixed 2D fallback display)
            if (id === 499) {
                textureName = "../../crossbow.png";
                textureCols = 5;
                
                let isCharged = !!(tag && tag.charged);
                let duration = 0;

                if (this.worldRenderer.minecraft.player) {
                    const inv = this.worldRenderer.minecraft.player.inventory;
                    const stack = inv.getStackInSlot(inv.selectedSlotIndex);
                    if (stack && stack.id === 499) {
                        isCharged = isCharged || !!(stack.tag && stack.tag.charged);
                        duration = this.worldRenderer.minecraft.crossbowPullDuration;
                    }
                }
                
                if (isCharged) {
                    textureIndex = 4;
                } else if (duration > 0) {
                    if (duration >= 16) textureIndex = 3;
                    else if (duration >= 8) textureIndex = 2;
                    else textureIndex = 1;
                } else {
                    textureIndex = 0;
                }
            }
            textureImage = this.worldRenderer.minecraft.resources[textureName];
        } else {
            // Handle custom objects vs atlas indices
            let textureInfo = block.getTextureForFace(EnumBlockFace.NORTH);
            if (typeof textureInfo === 'object' && textureInfo.type === 'custom') {
                textureImage = this.worldRenderer.minecraft.resources[textureInfo.name];
                textureIndex = textureInfo.index || 0;
                textureCols = textureInfo.cols || 1;
                textureRows = textureInfo.rows || 1;
            } else {
                textureImage = this.worldRenderer.minecraft.resources["../../blocks.png"];
                textureIndex = textureInfo;
                textureCols = 14;
                textureRows = 1;
            }
        }

        if (!textureImage) return;

        // 2. Crop the selected sprite before creating the Three.js texture.
        // Keeping the full sheet and relying on flipY + offset/repeat makes
        // different sheets disagree about which row is "up" in the GUI.
        // A standalone canvas gives every item the same, unambiguous UV space.
        const spriteWidth = Math.max(1, Math.floor(textureImage.width / textureCols));
        const spriteHeight = Math.max(1, Math.floor(textureImage.height / textureRows));
        const spriteColumn = textureIndex % textureCols;
        const spriteRow = Math.floor(textureIndex / textureCols);
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = spriteWidth;
        spriteCanvas.height = spriteHeight;
        const spriteContext = spriteCanvas.getContext('2d');
        spriteContext.imageSmoothingEnabled = false;
        spriteContext.drawImage(
            textureImage,
            spriteColumn * spriteWidth,
            spriteRow * spriteHeight,
            spriteWidth,
            spriteHeight,
            0,
            0,
            spriteWidth,
            spriteHeight
        );

        let threeTexture = new THREE.CanvasTexture(spriteCanvas);
        threeTexture.magFilter = THREE.NearestFilter;
        threeTexture.minFilter = THREE.NearestFilter;
        threeTexture.flipY = true;

        // 3. Create material and mesh
        let material = new THREE.MeshBasicMaterial({
            map: threeTexture,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide
        });

        // Apply tint color and brightness
        const r = (color >> 16 & 255) / 255.0;
        const g = (color >> 8 & 255) / 255.0;
        const b = (color & 255) / 255.0;
        material.color.setRGB(r * brightness, g * brightness, b * brightness);

        // Use a plane scaled to the requested GUI size
        // Use 1.6x scale for 2D sprites to ensure they fill the slots appropriately
        // Shrunk by another 6% (1.52 * 0.94 ≈ 1.4288)
        let geometry = new THREE.PlaneGeometry(1, 1);
        let mesh = new THREE.Mesh(geometry, material);
        // Nudge up by 0.09 units as requested
        mesh.position.set(x, y + 0.09, z);
        mesh.scale.set(size * 1.4288, size * 1.4288, size * 1.4288);
        
        if (group) group.add(mesh);

        // Render Overlay if present (Potions)
        if (block.overlayName) {
            const overlayRes = this.worldRenderer.minecraft.resources[block.overlayName];
            if (overlayRes) {
                // Use overlay-specific columns if defined, otherwise assume same as base.
                const oc = block.overlayCols || textureCols;
                const or = block.overlayRows || textureRows;
                const overlaySpriteWidth = Math.max(1, Math.floor(overlayRes.width / oc));
                const overlaySpriteHeight = Math.max(1, Math.floor(overlayRes.height / or));
                const overlayColumn = block.overlayIndex % oc;
                const overlayRow = Math.floor(block.overlayIndex / oc);
                const overlayCanvas = document.createElement('canvas');
                overlayCanvas.width = overlaySpriteWidth;
                overlayCanvas.height = overlaySpriteHeight;
                const overlayContext = overlayCanvas.getContext('2d');
                overlayContext.imageSmoothingEnabled = false;
                overlayContext.drawImage(
                    overlayRes,
                    overlayColumn * overlaySpriteWidth,
                    overlayRow * overlaySpriteHeight,
                    overlaySpriteWidth,
                    overlaySpriteHeight,
                    0,
                    0,
                    overlaySpriteWidth,
                    overlaySpriteHeight
                );
                const overlayTex = new THREE.CanvasTexture(overlayCanvas);
                overlayTex.magFilter = THREE.NearestFilter;
                overlayTex.minFilter = THREE.NearestFilter;
                overlayTex.flipY = true;

                const overlayMat = new THREE.MeshBasicMaterial({
                    map: overlayTex,
                    transparent: true,
                    alphaTest: 0.1,
                    side: THREE.DoubleSide
                });

                const ocColor = block.overlayColor || 0xFFFFFF;
                const ocr = (ocColor >> 16 & 255) / 255.0;
                const ocg = (ocColor >> 8 & 255) / 255.0;
                const ocb = (ocColor & 255) / 255.0;
                overlayMat.color.setRGB(ocr * brightness, ocg * brightness, ocb * brightness);

                const overlayMesh = new THREE.Mesh(geometry, overlayMat);
                // Nudge slightly forward to avoid Z-fighting with base item mesh
                overlayMesh.position.set(x, y + 0.09, z + 0.02);
                overlayMesh.scale.set(size * 1.4288, size * 1.4288, size * 1.4288);
                group.add(overlayMesh);
            }
        }

        // Render Glint Overlay for 2D icons
        if (isEnchanted) {
            const createGlintLayer = (tessellator) => {
                const glintMat = tessellator.material.clone();
                
                // Mask the glint by the item texture's alpha
                glintMat.uniforms.glintMatrix = tessellator.material.uniforms.glintMatrix;
                glintMat.uniforms.alphaMap = { value: threeTexture };
                glintMat.uniforms.alphaTransform = { value: new THREE.Matrix3().set(
                    threeTexture.repeat.x, 0, threeTexture.offset.x,
                    0, threeTexture.repeat.y, threeTexture.offset.y,
                    0, 0, 1
                ) };
                glintMat.uniforms.useAlpha = { value: true };
                glintMat.uniforms.brightness = { value: brightness };
                
                const glintMesh = new THREE.Mesh(geometry, glintMat);
                // Use a larger z-offset to ensure glint stays on top of the icon mesh
                glintMesh.position.set(x, y + 0.09, z + 0.05);
                glintMesh.scale.set(size * 1.4288, size * 1.4288, size * 1.4288);
                group.add(glintMesh);
            };
            createGlintLayer(this.glintTessellator1);
            createGlintLayer(this.glintTessellator2);
        }
    }
}    
