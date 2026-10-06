import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockJukebox extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../dicsandbox (1).png";
        this.sound = Block.sounds.wood;
    }

    getTextureForFace(face, meta = 0) {
        // Spritesheet mapping: 12 is side, 13 is top
        if (face === EnumBlockFace.TOP) {
            return { type: 'custom', name: this.textureName, index: 13, cols: 14 };
        }
        return { type: 'custom', name: this.textureName, index: 12, cols: 14 };
    }

    onBlockActivated(world, x, y, z, player) {
        let te = world.getTileEntity(x, y, z);
        if (!te) {
            te = { recordId: 0, playingSound: null };
            world.setTileEntity(x, y, z, te);
        }

        if (te.recordId !== 0) {
            this.ejectRecord(world, x, y, z, te);
            return true;
        }

        let heldStack = player.inventory.getStackInSlot(player.inventory.selectedSlotIndex);
        if (heldStack && heldStack.id >= 2200 && heldStack.id <= 2211) {
            this.insertRecord(world, x, y, z, te, heldStack.id, player);
            return true;
        }

        return false;
    }

    insertRecord(world, x, y, z, te, recordId, player) {
        te.recordId = recordId;
        world.setTileEntity(x, y, z, te);

        if (player && player.gameMode !== 1) {
            player.inventory.consumeItem(recordId);
        }

        if (player) player.swingArm();
        
        // Find song name
        const discBlock = Block.getById(recordId);
        if (discBlock && discBlock.songName) {
            if (world.minecraft.player) world.minecraft.addMessageToChat("§eNow playing: " + discBlock.discName);
            te.playingSound = world.minecraft.soundManager.playSound(discBlock.songName, x + 0.5, y + 1.2, z + 0.5, 3.0, 1.0);
        }
        
        world.minecraft.soundManager.playSound("block.jukebox.insert", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);

        // Sync to multiplayer
        if (world.minecraft.multiplayer && world.minecraft.multiplayer.connected && player) {
            world.minecraft.multiplayer.broadcast({
                type: "jukebox_play",
                x, y, z,
                recordId
            });
        }
    }

    ejectRecord(world, x, y, z, te) {
        if (te.recordId === 0) return;

        // Stop music with a fade to prevent popping
        if (te.playingSound) {
            world.minecraft.soundManager.stopSound(te.playingSound);
            te.playingSound = null;
        }

        const oldRecordId = te.recordId;
        te.recordId = 0;
        world.setTileEntity(x, y, z, te);

        // Spawn item
        import("../../../entity/DroppedItem.js").then(module => {
            const DroppedItem = module.default;
            const drop = new DroppedItem(world, x + 0.5, y + 1.2, z + 0.5, oldRecordId, 1);
            world.droppedItems.push(drop);
        });

        world.minecraft.soundManager.playSound("random.pop", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);

        // Sync to multiplayer
        if (world.minecraft.multiplayer && world.minecraft.multiplayer.connected) {
            world.minecraft.multiplayer.broadcast({
                type: "jukebox_stop",
                x, y, z
            });
        }
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        // Redstone support could be added here
    }

    onDestroy(world, x, y, z) {
        let te = world.getTileEntity(x, y, z);
        if (te && te.recordId !== 0) {
            this.ejectRecord(world, x, y, z, te);
        }
    }
}