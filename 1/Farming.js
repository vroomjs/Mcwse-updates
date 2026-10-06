import Block from "./src/js/net/minecraft/client/world/block/Block.js";
import BoundingBox from "./src/js/net/minecraft/util/BoundingBox.js";
import EnumBlockFace from "./src/js/net/minecraft/util/EnumBlockFace.js";
import BlockRenderType from "./src/js/net/minecraft/util/BlockRenderType.js";
import BlockFoliage from "./src/js/net/minecraft/client/world/block/type/BlockFoliage.js";
import BlockItem from "./src/js/net/minecraft/client/world/block/type/BlockItem.js";

export class BlockFarmland extends Block {
    constructor(id) {
        super(id, 2); // Default to Dirt texture slot (index 2 usually, but here 0 is dirt?)
        // Based on BlockGrass, 0 is dirt.
        this.textureSlotId = 0; 
        
        this.textureName = "../../farmland.png";
        this.sound = Block.sounds.gravel;
        
        // Indented box: 1/10th indent means height is ~0.9
        this.boundingBox = new BoundingBox(0.0, 0.0, 0.0, 1.0, 0.9375, 1.0); // 15/16 is standard farmland height (close to 0.9)
    }

    getRenderType() {
        return BlockRenderType.FARMLAND;
    }

    isSolid() {
        return false; // Not a full block
    }

    getCollisionBoundingBox(world, x, y, z) {
        return this.boundingBox;
    }

    getOpacity() {
        return 0.0; // Allow light
    }
    
    shouldRenderFace(world, x, y, z, face) {
        // Always render top face because it's indented
        if (face === EnumBlockFace.TOP) return true;
        // Check others normally
        return super.shouldRenderFace(world, x, y, z, face);
    }
    
    onNeighborBlockChange(world, x, y, z, neighborId) {
        // Revert to dirt if something solid is above
        let above = world.getBlockAt(x, y + 1, z);
        let blockAbove = Block.getById(above);
        if (blockAbove && blockAbove.isSolid()) {
            world.setBlockAt(x, y, z, 3); // Dirt ID
        }
    }
}

export class BlockCarrot extends BlockFoliage {
    constructor(id) {
        super(id, "carrots_stage0.png", 0);
        this.boundingBox = new BoundingBox(0.1, 0.0, 0.1, 0.9, 0.5, 0.9);
    }

    getColor(world, x, y, z, face) {
        return 0xFFFFFF;
    }

    onBlockAdded(world, x, y, z) {
        this.scheduleGrowth(world, x, y, z);
    }

    scheduleGrowth(world, x, y, z) {
        let isMoist = this.isSoilMoist(world, x, y - 1, z);
        // Wheat takes ~30000 ticks total (moist) or ~54000 (dry) for 7 stages.
        // Carrots have 3 growth steps (0->1->2->3).
        // Delay = TotalTime / 3.
        // Moist: 10000 ticks. Dry: 18000 ticks.
        let delay = isMoist ? 10000 : 18000;
        
        world.scheduleBlockUpdate(x, y, z, delay);
    }

    isSoilMoist(world, x, y, z) {
        let id = world.getBlockAt(x, y, z);
        if (id !== 62) return false;

        for (let dx = -4; dx <= 4; dx++) {
            for (let dz = -4; dz <= 4; dz++) {
                let checkId = world.getBlockAt(x + dx, y, z + dz);
                if (checkId === 9) return true;
                checkId = world.getBlockAt(x + dx, y + 1, z + dz);
                if (checkId === 9) return true;
            }
        }
        return false;
    }

    updateTick(world, x, y, z) {
        let soil = world.getBlockAt(x, y - 1, z);
        if (soil !== 62) { 
            world.setBlockAt(x, y, z, 0); 
            return;
        }

        if (world.getTotalLightAt(x, y, z) < 8) return;

        let meta = world.getBlockDataAt(x, y, z);
        if (meta < 3) {
            meta++;
            world.setBlockDataAt(x, y, z, meta);
            this.scheduleGrowth(world, x, y, z);
        }
    }

    onBlockActivated(world, x, y, z, player) {
        let item = player.inventory.getItemInSelectedSlot();
        if (item === 351) { // Bonemeal
            let meta = world.getBlockDataAt(x, y, z);
            if (meta < 3) {
                // Bonemeal advances stage by random amount
                let nextMeta = Math.min(3, meta + Math.floor(Math.random() * 2) + 1);
                world.setBlockDataAt(x, y, z, nextMeta);
                
                player.swingArm();
                if (player.gameMode !== 1) {
                    player.inventory.consumeItem(item);
                }
                world.minecraft.soundManager.playSound("item.bonemeal", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
            }
            return true;
        }
        return false;
    }
    
    canPlaceBlockAt(world, x, y, z) {
        return world.getBlockAt(x, y - 1, z) === 62;
    }
}

export class BlockCarrotItem extends BlockItem {
    constructor(id) {
        super(id, "../../food.png", 2);
    }

    onItemUse(world, x, y, z, face, player) {
        let blockId = world.getBlockAt(x, y, z);
        
        if (blockId === 62 && face.y === 1) {
            let above = world.getBlockAt(x, y + 1, z);
            if (above === 0) {
                world.setBlockAt(x, y + 1, z, 141); // BlockCarrot ID
                player.swingArm();
                
                if (player.gameMode !== 1) {
                    player.inventory.consumeItem(this.id);
                }
                
                world.minecraft.soundManager.playSound("step.grass", x + 0.5, y + 1.5, z + 0.5, 1.0, 1.0);
                
                if (world.minecraft.multiplayer && world.minecraft.multiplayer.connected) {
                    world.minecraft.multiplayer.onBlockChanged(x, y + 1, z, 141);
                }
                
                world.minecraft.achievementManager.grant('seedyplace');

                return true;
            }
        }
        return false;
    }
}

export class BlockPotato extends BlockFoliage {
    constructor(id) {
        super(id, "potatoes_stage0.png", 0);
        this.boundingBox = new BoundingBox(0.1, 0.0, 0.1, 0.9, 0.5, 0.9);
    }

    getColor(world, x, y, z, face) {
        return 0xFFFFFF;
    }

    onBlockAdded(world, x, y, z) {
        this.scheduleGrowth(world, x, y, z);
    }

    scheduleGrowth(world, x, y, z) {
        let isMoist = this.isSoilMoist(world, x, y - 1, z);
        // Same timing as Carrots (3 growth steps)
        let delay = isMoist ? 10000 : 18000;
        
        world.scheduleBlockUpdate(x, y, z, delay);
    }

    isSoilMoist(world, x, y, z) {
        let id = world.getBlockAt(x, y, z);
        if (id !== 62) return false;

        for (let dx = -4; dx <= 4; dx++) {
            for (let dz = -4; dz <= 4; dz++) {
                let checkId = world.getBlockAt(x + dx, y, z + dz);
                if (checkId === 9) return true;
                checkId = world.getBlockAt(x + dx, y + 1, z + dz);
                if (checkId === 9) return true;
            }
        }
        return false;
    }

    updateTick(world, x, y, z) {
        let soil = world.getBlockAt(x, y - 1, z);
        if (soil !== 62) { 
            world.setBlockAt(x, y, z, 0); 
            return;
        }

        if (world.getTotalLightAt(x, y, z) < 8) return;

        let meta = world.getBlockDataAt(x, y, z);
        if (meta < 3) {
            meta++;
            world.setBlockDataAt(x, y, z, meta);
            this.scheduleGrowth(world, x, y, z);
        }
    }

    onBlockActivated(world, x, y, z, player) {
        let item = player.inventory.getItemInSelectedSlot();
        if (item === 351) { // Bonemeal
            let meta = world.getBlockDataAt(x, y, z);
            if (meta < 3) {
                // Bonemeal advances stage by random amount
                let nextMeta = Math.min(3, meta + Math.floor(Math.random() * 2) + 1);
                world.setBlockDataAt(x, y, z, nextMeta);
                
                player.swingArm();
                if (player.gameMode !== 1) {
                    player.inventory.consumeItem(item);
                }
                world.minecraft.soundManager.playSound("item.bonemeal", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
            }
            return true;
        }
        return false;
    }
    
    canPlaceBlockAt(world, x, y, z) {
        return world.getBlockAt(x, y - 1, z) === 62;
    }
}

export class BlockPotatoItem extends BlockItem {
    constructor(id) {
        super(id, "../../food.png", 4);
    }

    onItemUse(world, x, y, z, face, player) {
        let blockId = world.getBlockAt(x, y, z);
        
        if (blockId === 62 && face.y === 1) {
            let above = world.getBlockAt(x, y + 1, z);
            if (above === 0) {
                world.setBlockAt(x, y + 1, z, 142); // BlockPotato ID
                player.swingArm();
                
                if (player.gameMode !== 1) {
                    player.inventory.consumeItem(this.id);
                }
                
                world.minecraft.soundManager.playSound("step.grass", x + 0.5, y + 1.5, z + 0.5, 1.0, 1.0);
                
                if (world.minecraft.multiplayer && world.minecraft.multiplayer.connected) {
                    world.minecraft.multiplayer.onBlockChanged(x, y + 1, z, 142);
                }
                
                world.minecraft.achievementManager.grant('seedyplace');

                return true;
            }
        }
        return false;
    }
}

export class BlockBeetrootCrop extends BlockFoliage {
    constructor(id) {
        super(id, "../../beetroot (1).png", 3);
        this.boundingBox = new BoundingBox(0.1, 0.0, 0.1, 0.9, 0.5, 0.9);
    }

    getColor(world, x, y, z, face) {
        return 0xFFFFFF;
    }

    onBlockAdded(world, x, y, z) {
        this.scheduleGrowth(world, x, y, z);
    }

    scheduleGrowth(world, x, y, z) {
        let isMoist = this.isSoilMoist(world, x, y - 1, z);
        let delay = isMoist ? 10000 : 18000;
        world.scheduleBlockUpdate(x, y, z, delay);
    }

    isSoilMoist(world, x, y, z) {
        let id = world.getBlockAt(x, y, z);
        if (id !== 62) return false;

        for (let dx = -4; dx <= 4; dx++) {
            for (let dz = -4; dz <= 4; dz++) {
                let checkId = world.getBlockAt(x + dx, y, z + dz);
                if (checkId === 9) return true;
                checkId = world.getBlockAt(x + dx, y + 1, z + dz);
                if (checkId === 9) return true;
            }
        }
        return false;
    }

    updateTick(world, x, y, z) {
        let soil = world.getBlockAt(x, y - 1, z);
        if (soil !== 62) { 
            world.setBlockAt(x, y, z, 0); 
            return;
        }

        if (world.getTotalLightAt(x, y, z) < 8) return;

        let meta = world.getBlockDataAt(x, y, z);
        if (meta < 3) {
            meta++;
            world.setBlockDataAt(x, y, z, meta);
            this.scheduleGrowth(world, x, y, z);
        }
    }

    onBlockActivated(world, x, y, z, player) {
        let item = player.inventory.getItemInSelectedSlot();
        if (item === 351) { // Bonemeal
            let meta = world.getBlockDataAt(x, y, z);
            if (meta < 3) {
                let nextMeta = Math.min(3, meta + Math.floor(Math.random() * 2) + 1);
                world.setBlockDataAt(x, y, z, nextMeta);
                
                player.swingArm();
                if (player.gameMode !== 1) {
                    player.inventory.consumeItem(item);
                }
                world.minecraft.soundManager.playSound("item.bonemeal", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
            }
            return true;
        }
        return false;
    }
    
    canPlaceBlockAt(world, x, y, z) {
        return world.getBlockAt(x, y - 1, z) === 62;
    }
}

export class BlockBeetrootSeeds extends BlockItem {
    constructor(id) {
        super(id, "../../beetroot (1).png", 0);
    }

    onItemUse(world, x, y, z, face, player) {
        let blockId = world.getBlockAt(x, y, z);
        
        if (blockId === 62 && face.y === 1) {
            let above = world.getBlockAt(x, y + 1, z);
            if (above === 0) {
                world.setBlockAt(x, y + 1, z, 420); // BEETROOTS block ID
                player.swingArm();
                
                if (player.gameMode !== 1) {
                    player.inventory.consumeItem(this.id);
                }
                
                world.minecraft.soundManager.playSound("step.grass", x + 0.5, y + 1.5, z + 0.5, 1.0, 1.0);
                
                if (world.minecraft.multiplayer && world.minecraft.multiplayer.connected) {
                    world.minecraft.multiplayer.onBlockChanged(x, y + 1, z, 420);
                }
                
                world.minecraft.achievementManager.grant('seedyplace');

                return true;
            }
        }
        return false;
    }
}

export class BlockWheat extends BlockFoliage {
    constructor(id) {
        super(id, "wheat_stage0.png", 0);
        this.boundingBox = new BoundingBox(0.1, 0.0, 0.1, 0.9, 0.8, 0.9);
    }

    getColor(world, x, y, z, face) {
        return 0xFFFFFF;
    }

    onBlockAdded(world, x, y, z) {
        this.scheduleGrowth(world, x, y, z);
    }

    scheduleGrowth(world, x, y, z) {
        let isMoist = this.isSoilMoist(world, x, y - 1, z);
        // Moist: 25 mins (30000 ticks) for 7 stages -> ~4285 ticks per stage
        // Dry: 45 mins (54000 ticks) for 7 stages -> ~7714 ticks per stage
        let delay = isMoist ? 4285 : 7714;
        
        world.scheduleBlockUpdate(x, y, z, delay);
    }

    isSoilMoist(world, x, y, z) {
        // Check if block at x,y,z is farmland and check nearby water
        let id = world.getBlockAt(x, y, z);
        if (id !== 62) return false; // Not farmland

        // Search 4 block radius for water (ID 9)
        for (let dx = -4; dx <= 4; dx++) {
            for (let dz = -4; dz <= 4; dz++) {
                let checkId = world.getBlockAt(x + dx, y, z + dz);
                if (checkId === 9) return true;
                checkId = world.getBlockAt(x + dx, y + 1, z + dz);
                if (checkId === 9) return true;
            }
        }
        return false;
    }

    updateTick(world, x, y, z) {
        // Check support
        let soil = world.getBlockAt(x, y - 1, z);
        if (soil !== 62) { // Farmland ID
            world.setBlockAt(x, y, z, 0); // Break if soil gone
            return;
        }

        // Check light
        if (world.getTotalLightAt(x, y, z) < 8) return;

        let meta = world.getBlockDataAt(x, y, z);
        if (meta < 7) {
            meta++;
            world.setBlockDataAt(x, y, z, meta);
            this.scheduleGrowth(world, x, y, z);
        }
    }

    onBlockActivated(world, x, y, z, player) {
        let item = player.inventory.getItemInSelectedSlot();
        if (item === 351) { // Bonemeal ID
            let meta = world.getBlockDataAt(x, y, z);
            if (meta < 7) {
                world.setBlockDataAt(x, y, z, meta + 1);
                player.swingArm();
                if (player.gameMode !== 1) {
                    player.inventory.consumeItem(item);
                }
                world.minecraft.soundManager.playSound("item.bonemeal", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
            }
            return true;
        }
        return false;
    }
    
    canPlaceBlockAt(world, x, y, z) {
        return world.getBlockAt(x, y - 1, z) === 62; // Farmland
    }
}

export class BlockSeeds extends BlockItem {
    constructor(id) {
        super(id, "../../farming.png", 1);
    }

    onItemUse(world, x, y, z, face, player) {
        let blockId = world.getBlockAt(x, y, z);
        
        // If clicking on farmland (ID 62) top face
        if (blockId === 62 && face.y === 1) {
            let above = world.getBlockAt(x, y + 1, z);
            if (above === 0) {
                // Place Wheat (ID 59)
                world.setBlockAt(x, y + 1, z, 59);
                player.swingArm();
                
                if (player.gameMode !== 1) {
                    player.inventory.consumeItem(this.id);
                }
                
                world.minecraft.soundManager.playSound("step.grass", x + 0.5, y + 1.5, z + 0.5, 1.0, 1.0);
                
                // Sync multiplayer
                if (world.minecraft.multiplayer && world.minecraft.multiplayer.connected) {
                    world.minecraft.multiplayer.onBlockChanged(x, y + 1, z, 59);
                }
                
                world.minecraft.achievementManager.grant('seedyplace');

                return true;
            }
        }
        return false;
    }
}

