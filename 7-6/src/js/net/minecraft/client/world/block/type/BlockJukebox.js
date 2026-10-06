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
            te = { recordId: 0, recordTag: null, playingSound: null };
            world.setTileEntity(x, y, z, te);
        }

        if (te.recordId !== 0) {
            this.ejectRecord(world, x, y, z, te);
            return true;
        }

        let heldStack = player.inventory.getStackInSlot(player.inventory.selectedSlotIndex);
        if (heldStack && this.isMusicDisc(heldStack)) {
            this.insertRecord(world, x, y, z, te, heldStack.id, player, heldStack.tag || {});
            return true;
        }

        return false;
    }

    isMusicDisc(stack) {
        if (!stack || !stack.id) return false;
        if (stack.id >= 2200 && stack.id <= 2211) return true;
        return stack.id === 2212 && !!(stack.tag && stack.tag.customMusicTrackId);
    }

    consumeSelectedRecord(player) {
        if (!player || player.gameMode === 1) return;
        const slot = player.inventory.selectedSlotIndex;
        const stack = player.inventory.getStackInSlot(slot);
        if (!stack || !stack.id) return;
        stack.count--;
        if (stack.count <= 0) {
            player.inventory.setStackInSlot(slot, 0, 0, 0, {});
        }
    }

    insertRecord(world, x, y, z, te, recordId, player, recordTag = null) {
        te.recordId = recordId;
        te.recordTag = recordTag ? JSON.parse(JSON.stringify(recordTag)) : null;
        world.setTileEntity(x, y, z, te);

        this.consumeSelectedRecord(player);

        if (player) player.swingArm();
        
        // Find song name
        if (recordId === 2212 && te.recordTag) {
            const trackName = te.recordTag.customMusicTrackName || "Custom Track";
            if (world.minecraft.player) world.minecraft.addMessageToChat("§eNow playing: " + trackName);
            te.playingSound = world.minecraft.soundManager.playCustomMusicDisc(te.recordTag, x + 0.5, y + 1.2, z + 0.5);
        } else {
            const discBlock = Block.getById(recordId);
            if (discBlock && discBlock.songName) {
                if (world.minecraft.player) world.minecraft.addMessageToChat("§eNow playing: " + discBlock.discName);
                te.playingSound = world.minecraft.soundManager.playSound(discBlock.songName, x + 0.5, y + 1.2, z + 0.5, 3.0, 1.0);
            }
        }
        
        world.minecraft.soundManager.playSound("block.jukebox.insert", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);

        // Sync to multiplayer. Uploaded songs are local-browser assets, so the
        // remote client can only play them if it has an uploaded track with the
        // same saved customMusicTrackId/name.
        if (world.minecraft.multiplayer && world.minecraft.multiplayer.connected && player) {
            world.minecraft.multiplayer.broadcast({
                type: "jukebox_play",
                x, y, z,
                recordId,
                recordTag: te.recordTag
            });
        }
    }

    ejectRecord(world, x, y, z, te) {
        if (te.recordId === 0) return;

        // Stop music with a fade to prevent popping
        if (te.playingSound) {
            world.minecraft.soundManager.stopSound(te.playingSound, 0.35);
            te.playingSound = null;
        }

        const oldRecordId = te.recordId;
        const oldRecordTag = te.recordTag ? JSON.parse(JSON.stringify(te.recordTag)) : null;
        te.recordId = 0;
        te.recordTag = null;
        world.setTileEntity(x, y, z, te);

        // Spawn item
        import("../../../entity/DroppedItem.js").then(module => {
            const DroppedItem = module.default;
            const drop = new DroppedItem(world, x + 0.5, y + 1.2, z + 0.5, oldRecordId, 1, oldRecordTag);
            world.droppedItems.push(drop);
        });

        world.minecraft.soundManager.playSound("random.pop", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);

        // Sync to multiplayer. Remote jukebox-stop packets are replayed
        // locally; do not bounce them back to the host and create duplicate
        // stop/drop traffic.
        const mp = world.minecraft.multiplayer;
        if (mp && mp.connected && !mp.isProcessingRemoteJukebox) {
            mp.broadcast({
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