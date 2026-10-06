import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockBed extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../bed.png";
        this.sound = Block.sounds.wood;
        this.boundingBox = new BoundingBox(0.0, 0.0, 0.0, 1.0, 0.5625, 1.0);
    }

    getRenderType() {
        return BlockRenderType.BED;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    getBoundingBox(world, x, y, z) {
        return this.boundingBox;
    }

    getCollisionBoundingBox(world, x, y, z) {
        return this.boundingBox;
    }

    onItemUse(world, x, y, z, face, player) {
        if (face !== EnumBlockFace.TOP) return false;

        let yaw = player.rotationYaw;
        // Direction: 0=S, 1=W, 2=N, 3=E
        let dir = Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3;
        
        let targetX = x + face.x;
        let targetY = y + face.y;
        let targetZ = z + face.z;

        // Head position
        let hx = targetX, hz = targetZ;
        if (dir === 0) hz++;      // South
        else if (dir === 1) hx--; // West
        else if (dir === 2) hz--; // North
        else if (dir === 3) hx++; // East

        if (world.getBlockAt(targetX, targetY, targetZ) === 0 && world.getBlockAt(hx, targetY, hz) === 0) {
            // Must have floor below both parts
            if (!world.isSolidBlockAt(targetX, targetY - 1, targetZ) || !world.isSolidBlockAt(hx, targetY - 1, hz)) {
                return false;
            }

            // Place Foot (metadata 0-3 = direction)
            world.setBlockAt(targetX, targetY, targetZ, this.id, dir);
            // Place Head (metadata 8-11 = direction | 8)
            world.setBlockAt(hx, targetY, hz, this.id, dir | 8);

            player.swingArm();
            if (player.gameMode !== 1) {
                player.inventory.consumeItem(this.id);
            }
            world.minecraft.soundManager.playSound("step.wood", targetX + 0.5, targetY + 0.5, targetZ + 0.5, 1.0, 1.0);
            return true;
        }

        return false;
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        let meta = world.getBlockDataAt(x, y, z);
        let dir = meta & 3;
        let isHead = (meta & 8) !== 0;

        let ox = x, oz = z;
        if (isHead) {
            if (dir === 0) oz--;
            else if (dir === 1) ox++;
            else if (dir === 2) oz++;
            else if (dir === 3) ox--;
        } else {
            if (dir === 0) oz++;
            else if (dir === 1) ox--;
            else if (dir === 2) oz--;
            else if (dir === 3) ox++;
        }

        if (world.getBlockAt(ox, y, oz) !== this.id) {
            world.setBlockAt(x, y, z, 0);
        }
    }

    onBlockActivated(world, x, y, z, player) {
        // Set spawn point
        let meta = world.getBlockDataAt(x, y, z);
        let isHead = (meta & 8) !== 0;

        let spawnX = x, spawnZ = z;
        if (!isHead) {
            let dir = meta & 3;
            // Direction: 0=S, 1=W, 2=N, 3=E
            if (dir === 0) spawnZ++;
            else if (dir === 1) spawnX--;
            else if (dir === 2) spawnZ--;
            else if (dir === 3) spawnX++;
        }

        // Update world's global spawn point to this bed's head
        world.spawn.x = spawnX + 0.5;
        world.spawn.y = y + 0.5;
        world.spawn.z = spawnZ + 0.5;

        world.minecraft.achievementManager.grant('sweetdreams');
        world.minecraft.addMessageToChat("§eSpawn point set!");

        // Sleeping Logic (Host/Singleplayer only)
        if (!world.isRemote) {
            let time = world.time % 24000;
            // Standard Minecraft sleeping range: 12541 (sunset) to 23458 (sunrise)
            let isNight = time >= 12541 && time <= 23458;
            
            if (isNight) {
                if (typeof world.minecraft.startSleeping === 'function') {
                    world.minecraft.startSleeping();
                }
            } else {
                world.minecraft.addMessageToChat("§cYou can only sleep at night.");
            }
        }

        player.swingArm();
        return true;
    }
}

