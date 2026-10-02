import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import GuiChest from "../../../gui/screens/GuiChest.js";

export default class BlockChest extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../chest.png.png";
        this.sound = Block.sounds.wood;
    }

    getRenderType() {
        return BlockRenderType.CHEST;
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
                items: new Array(27).fill(null).map(() => ({id: 0, count: 0}))
            };
            world.setTileEntity(x, y, z, tileEntity);
        }

        world.minecraft.displayScreen(new GuiChest(player, x, y, z));
        return true;
    }
}



