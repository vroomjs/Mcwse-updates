import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import GuiDispenser from "../../../gui/screens/GuiDispenser.js";
import { BlockRegistry } from "../BlockRegistry.js";
import EntityArrow from "../../../entity/EntityArrow.js";
import EntitySnowball from "../../../entity/EntitySnowball.js";
import EntityEnderPearl from "../../../entity/EntityEnderPearl.js";
import PrimedTNT from "../../../entity/PrimedTNT.js";
import DroppedItem from "../../../entity/DroppedItem.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockDispenser extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../redstonestuff.png";
        this.textureIndex = 21;
        this.cols = 22;
        this.sound = Block.sounds.stone;
    }

    getRenderType() {
        return BlockRenderType.DISPENSER;
    }

    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        let pitch = player.rotationPitch;

        let meta = 0;
        // Logic for 6-way orientation
        if (Math.abs(pitch) > 50) {
            meta = pitch > 0 ? 0 : 1; // 0=Down, 1=Up
        } else {
            // Horizontal: 2=N, 3=S, 4=W, 5=E
            let direction = Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3;
            // Map 0=S, 1=W, 2=N, 3=E to facing AWAY (0:S->N, 1:W->E, 2:N->S, 3:E->W)
            const map = [2, 5, 3, 4];
            meta = map[direction];
        }

        world.setBlockDataAt(x, y, z, meta);
    }

    onBlockActivated(world, x, y, z, player) {
        let te = world.getTileEntity(x, y, z);
        if (!te) {
            te = {
                items: new Array(9).fill(null).map(() => ({id: 0, count: 0})),
                lastPowered: false
            };
            world.setTileEntity(x, y, z, te);
        }

        world.minecraft.displayScreen(new GuiDispenser(player, x, y, z));
        return true;
    }

    onNeighborBlockChange(world, x, y, z, neighborId) {
        this.checkRedstone(world, x, y, z);
    }

    checkRedstone(world, x, y, z) {
        let powered = this.isNeighborPowered(world, x, y, z);
        let te = world.getTileEntity(x, y, z);
        
        if (!te) {
            te = { items: new Array(9).fill(null).map(() => ({id: 0, count: 0})), lastPowered: false };
            world.setTileEntity(x, y, z, te);
        }

        if (powered && !te.lastPowered) {
            this.dispense(world, x, y, z, te);
        }
        
        te.lastPowered = powered;
        world.setTileEntity(x, y, z, te);
    }

    isNeighborPowered(world, x, y, z) {
        const offsets = [
            {x:1,y:0,z:0}, {x:-1,y:0,z:0},
            {x:0,y:1,z:0}, {x:0,y:-1,z:0},
            {x:0,y:0,z:1}, {x:0,y:0,z:-1}
        ];
        for (let o of offsets) {
            let nx = x + o.x, ny = y + o.y, nz = z + o.z;
            let id = world.getBlockAt(nx, ny, nz);
            if (id === 152 || id === 76) return true; // Redstone block or Torch
            if (id === 69 && (world.getBlockDataAt(nx, ny, nz) & 8) !== 0) return true; // Lever
            if (id === 77 && (world.getBlockDataAt(nx, ny, nz) & 8) !== 0) return true; // Button
            if (id === 72 && (world.getBlockDataAt(nx, ny, nz) & 1) !== 0) return true; // Plate
            if (id === 55 && world.getBlockDataAt(nx, ny, nz) > 0) return true; // Redstone dust
        }
        return false;
    }

    dispense(world, x, y, z, te) {
        // Play click sound on activation attempt
        world.minecraft.soundManager.playSound("random.click", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);

        // Pick a random non-empty slot
        let indices = [];
        for (let i = 0; i < 9; i++) {
            if (te.items[i] && te.items[i].id !== 0) indices.push(i);
        }

        if (indices.length === 0) {
            world.minecraft.soundManager.playSound("random.click", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.2);
            return;
        }

        let slotIdx = indices[Math.floor(Math.random() * indices.length)];
        let stack = te.items[slotIdx];
        let itemId = stack.id;

        // Consume item
        stack.count--;
        if (stack.count <= 0) te.items[slotIdx] = {id: 0, count: 0};
        world.setTileEntity(x, y, z, te);

        // Determine launch vector from meta
        let meta = world.getBlockDataAt(x, y, z) & 7;
        let dx = 0, dy = 0, dz = 0;
        // 0:D, 1:U, 2:N, 3:S, 4:W, 5:E
        if (meta === 0) dy = -1;
        else if (meta === 1) dy = 1;
        else if (meta === 2) dz = -1;
        else if (meta === 3) dz = 1;
        else if (meta === 4) dx = -1;
        else if (meta === 5) dx = 1;

        let spawnX = x + 0.5 + dx * 0.7;
        let spawnY = y + 0.5 + dy * 0.7;
        let spawnZ = z + 0.5 + dz * 0.7;

        let speed = 1.1;
        let inaccuracy = 0.1;

        // Projectile check
        if (itemId === 262 || itemId === BlockRegistry.ARROW.getId()) { // Arrow
            let arrow = new EntityArrow(world.minecraft, world);
            arrow.setPosition(spawnX, spawnY - 0.2, spawnZ);
            arrow.motionX = dx * speed + (Math.random() - 0.5) * inaccuracy;
            arrow.motionY = dy * speed + 0.1 + (Math.random() - 0.5) * inaccuracy;
            arrow.motionZ = dz * speed + (Math.random() - 0.5) * inaccuracy;
            world.addEntity(arrow);
            world.minecraft.soundManager.playSound("random.bow", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.2);
        } else if (itemId === 410 || itemId === BlockRegistry.SNOWBALL.getId()) { // Snowball
            let ball = new EntitySnowball(world.minecraft, world);
            ball.setPosition(spawnX, spawnY, spawnZ);
            ball.motionX = dx * speed; ball.motionY = dy * speed + 0.1; ball.motionZ = dz * speed;
            world.addEntity(ball);
            world.minecraft.soundManager.playSound("random.bow", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.2);
        } else if (itemId === 413 || itemId === BlockRegistry.ENDER_PEARL.getId()) { // Ender Pearl
            let pearl = new EntityEnderPearl(world.minecraft, world);
            pearl.setPosition(spawnX, spawnY, spawnZ);
            pearl.motionX = dx * speed; pearl.motionY = dy * speed + 0.1; pearl.motionZ = dz * speed;
            world.addEntity(pearl);
            world.minecraft.soundManager.playSound("random.bow", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.2);
        } else if (itemId === 46 || itemId === BlockRegistry.TNT.getId()) { // TNT
            let tnt = new PrimedTNT(world.minecraft, world, spawnX, spawnY, spawnZ);
            tnt.motionX = dx * 0.3; tnt.motionY = 0.2; tnt.motionZ = dz * 0.3;
            world.addEntity(tnt);
            world.minecraft.soundManager.playSound("random.fuse", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
        } else if (itemId === 362 || itemId === 368) { // Water Bucket (362) or Lava Bucket (368)
            let fluidId = (itemId === 362) ? 9 : 10;
            let current = world.getBlockAt(Math.floor(spawnX), Math.floor(spawnY), Math.floor(spawnZ));
            if (current === 0 || !Block.getById(current).isSolid()) {
                world.setBlockAt(Math.floor(spawnX), Math.floor(spawnY), Math.floor(spawnZ), fluidId);
                // Return empty bucket to dispenser
                te.items[slotIdx] = {id: 361, count: 1};
                world.setTileEntity(x, y, z, te);
            }
        } else {
            const block = Block.getById(itemId);
            
            // Check for Spawn Egg
            if (block && block.constructor.name === "BlockSpawnEgg") {
                let entity = new block.entityClass(world.minecraft, world);
                entity.setPosition(spawnX, spawnY, spawnZ);
                world.addEntity(entity);
                world.minecraft.soundManager.playSound("random.pop", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.2);
                return;
            }

            // Default: Drop as item
            const tag = (block && block.armorType !== undefined) ? { dispensedArmor: true } : null;
            let item = new DroppedItem(world, spawnX, spawnY, spawnZ, itemId, 1, tag);
            item.pickupDelay = 10;
            item.motionX = dx * 0.3 + (Math.random() - 0.5) * 0.05;
            item.motionY = dy * 0.3 + 0.1;
            item.motionZ = dz * 0.3 + (Math.random() - 0.5) * 0.05;
            world.droppedItems.push(item);
            world.minecraft.soundManager.playSound("random.click", x + 0.5, y + 0.5, z + 0.5, 1.0, 1.0);
        }
    }
}