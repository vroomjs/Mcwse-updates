import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import BoundingBox from "../../../../util/BoundingBox.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";

export default class BlockAnvil extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../anvil.png"; // Side texture
        this.topTextureName = "../../anvil_top.png";
        this.sound = Block.sounds.stone;
        this.name = "Anvil";
    }

    getRenderType() {
        return BlockRenderType.ANVIL;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        // Direction: 0=S, 1=W, 2=N, 3=E
        let direction = Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3;
        world.setBlockDataAt(x, y, z, direction);
    }

    getBoundingBox(world, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let dir = meta & 3; 
        // 0=S, 1=W, 2=N, 3=E. X-Axis is 1 and 3.
        let isXAxis = (dir === 1 || dir === 3);
        
        if (isXAxis) {
            return new BoundingBox(0.0, 0.0, 0.125, 1.0, 1.0, 0.875);
        } else {
            return new BoundingBox(0.125, 0.0, 0.0, 0.875, 1.0, 1.0);
        }
    }

    getCollisionBoundingBox(world, x, y, z) {
        let meta = world ? world.getBlockDataAt(x, y, z) : 0;
        let dir = meta & 3;
        let isXAxis = (dir === 1 || dir === 3);

        let boxes = [];
        // Base
        boxes.push(new BoundingBox(0.125, 0.0, 0.125, 0.875, 0.25, 0.875));
        // Pedestal
        boxes.push(new BoundingBox(0.25, 0.25, 0.25, 0.75, 0.3125, 0.75));
        // Pillar
        boxes.push(new BoundingBox(0.375, 0.3125, 0.375, 0.625, 0.625, 0.625));
        // Top
        if (isXAxis) {
            boxes.push(new BoundingBox(0.0, 0.625, 0.1875, 1.0, 1.0, 0.8125));
        } else {
            boxes.push(new BoundingBox(0.1875, 0.625, 0.0, 0.8125, 1.0, 1.0));
        }
        return boxes;
    }

    onBlockActivated(world, x, y, z, player) {
        import("../../../gui/screens/GuiAnvil.js").then(module => {
            world.minecraft.displayScreen(new module.default(player, x, y, z));
        });
        return true;
    }
}