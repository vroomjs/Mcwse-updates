import Block from "./src/js/net/minecraft/client/world/block/Block.js";
import BlockRenderType from "./src/js/net/minecraft/util/BlockRenderType.js";
import BoundingBox from "./src/js/net/minecraft/util/BoundingBox.js";
import EnumBlockFace from "./src/js/net/minecraft/util/EnumBlockFace.js";
import BlockItem from "./src/js/net/minecraft/client/world/block/type/BlockItem.js";
import GuiEditSign from "./src/js/net/minecraft/client/gui/screens/SignGUI.js";

export class BlockSign extends Block {
    constructor(id, woodType = 0) {
        super(id, 0);
        this.woodType = woodType; // 0=Oak, 1=Birch, 2=Spruce, 3=Acacia, 4=Dark Oak
        
        // Metadata for held item rendering (extruding the 2D icon)
        this.textureName = "../../signs.png";
        const itemIndices = [3, 4, 1, 2, 0];
        this.textureIndex = itemIndices[woodType];

        this.sound = Block.sounds.wood;
        // Generally enlarged bounding box
        this.boundingBox = new BoundingBox(0.0, 0.0, 0.0, 1.0, 1.07, 1.0);
    }

    getRenderType() {
        return BlockRenderType.SIGN;
    }

    onBlockAdded(world, x, y, z) {
        // Ensure a tile entity exists immediately upon placement so text is persistent
        if (!world.getTileEntity(x, y, z)) {
            world.setTileEntity(x, y, z, { lines: ["", "", "", ""] });
        }
    }

    isSolid() { return false; }
    getOpacity() { return 0; }
    getCollisionBoundingBox() { return null; }

    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        // Divide 360 into 16 directions
        let rotation = Math.floor((yaw + 180 + 11.25) / 22.5) & 15;
        world.setBlockDataAt(x, y, z, rotation);

        // Open GUI immediately for the placing player
        setTimeout(() => {
            world.minecraft.displayScreen(new GuiEditSign(player, x, y, z));
        }, 50);
    }

    onBlockActivated(world, x, y, z, player) {
        // Allow editing by right clicking
        world.minecraft.displayScreen(new GuiEditSign(player, x, y, z));
        return true;
    }

    getTextureForFace(face) {
        const woodTextures = ["../../blocks.png", "../../treestuff.png", "../../treestuff.png", "../../treestuff.png", "../../treestuff.png"];
        const woodIndices = [8, 19, 14, 24, 29];
        const woodCols = [14, 30, 30, 30, 30];
        const type = this.woodType || 0;
        return { type: 'custom', name: woodTextures[type], index: woodIndices[type], cols: woodCols[type] };
    }
}

export class BlockWallSign extends Block {
    constructor(id, woodType = 0) {
        super(id, 0);
        this.woodType = woodType;
        this.sound = Block.sounds.wood;

        // Metadata for held item rendering
        this.textureName = "../../signs.png";
        const itemIndices = [3, 4, 1, 2, 0];
        this.textureIndex = itemIndices[woodType];
    }

    getRenderType() { return 41; } // New constant: WALL_SIGN

    onBlockAdded(world, x, y, z) {
        if (!world.getTileEntity(x, y, z)) {
            world.setTileEntity(x, y, z, { lines: ["", "", "", ""] });
        }
    }

    isSolid() { return false; }
    getOpacity() { return 0; }
    getCollisionBoundingBox() { return null; }

    getBoundingBox(world, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 2;
        let w = 0.48; // Enlarged half-width
        let h = 0.32; // Enlarged half-height
        let t = 0.125; // Unified thickness matching post
        
        // 2=N (South wall of sign block), 3=S (North wall), 4=W (East wall), 5=E (West wall)
        if (meta === 2) return new BoundingBox(0.5 - w, 0.5 - h, 1 - t, 0.5 + w, 0.5 + h, 1);
        if (meta === 3) return new BoundingBox(0.5 - w, 0.5 - h, 0, 0.5 + w, 0.5 + h, t);
        if (meta === 4) return new BoundingBox(1 - t, 0.5 - h, 0.5 - w, 1, 0.5 + h, 0.5 + w);
        if (meta === 5) return new BoundingBox(0, 0.5 - h, 0.5 - w, t, 0.5 + h, 0.5 + w);
        return this.boundingBox;
    }

    onBlockPlaced(world, x, y, z, face) {
        let meta = 2;
        if (face === EnumBlockFace.NORTH) meta = 2;
        if (face === EnumBlockFace.SOUTH) meta = 3;
        if (face === EnumBlockFace.WEST) meta = 4;
        if (face === EnumBlockFace.EAST) meta = 5;
        world.setBlockDataAt(x, y, z, meta);

        setTimeout(() => {
            world.minecraft.displayScreen(new GuiEditSign(world.minecraft.player, x, y, z));
        }, 50);
    }

    onBlockActivated(world, x, y, z, player) {
        world.minecraft.displayScreen(new GuiEditSign(player, x, y, z));
        return true;
    }

    getTextureForFace(face) {
        const woodTextures = ["../../blocks.png", "../../treestuff.png", "../../treestuff.png", "../../treestuff.png", "../../treestuff.png"];
        const woodIndices = [8, 19, 14, 24, 29];
        const woodCols = [14, 30, 30, 30, 30];
        const type = this.woodType || 0;
        return { type: 'custom', name: woodTextures[type], index: woodIndices[type], cols: woodCols[type] };
    }
}

export class BlockSignItem extends BlockItem {
    constructor(id, woodType) {
        // woodType: 0=Oak, 1=Birch, 2=Spruce, 3=Acacia, 4=Dark Oak
        // signs.png sprites: 0=Dark Oak, 1=Spruce, 2=Acacia, 3=Oak, 4=Birch
        const itemIndices = [3, 4, 1, 2, 0];
        super(id, "../../signs.png", itemIndices[woodType]); 
        this.woodType = woodType;
    }

    getRenderType() {
        return BlockRenderType.SIGN;
    }

    onItemUse(world, x, y, z, face, player) {
        if (face === EnumBlockFace.BOTTOM) return false;

        let tx = x + face.x;
        let ty = y + face.y;
        let tz = z + face.z;

        if (world.getBlockAt(tx, ty, tz) !== 0) return false;

        // Map wood type to block IDs (Synced with BlockRegistry.js)
        // 0:Oak, 1:Birch, 2:Spruce, 3:Acacia, 4:Dark Oak
        const blockMap = [
            { floor: 63, wall: 68 },   // Oak
            { floor: 484, wall: 488 }, // Birch
            { floor: 485, wall: 489 }, // Spruce
            { floor: 486, wall: 490 }, // Acacia
            { floor: 487, wall: 491 }  // Dark Oak
        ];
        
        const ids = blockMap[this.woodType];
        const targetId = (face === EnumBlockFace.TOP) ? ids.floor : ids.wall;

        world.minecraft.achievementManager.grant('itsasign');
        world.setBlockAt(tx, ty, tz, targetId);
        let block = Block.getById(targetId);
        if (block) {
            block.onBlockPlaced(world, tx, ty, tz, face);
            world.minecraft.soundManager.playSound("step.wood", tx+0.5, ty+0.5, tz+0.5, 1, 0.8);
        }

        player.swingArm();
        if (player.gameMode !== 1) player.inventory.consumeItem(this.id);
        
        return true;
    }
} 