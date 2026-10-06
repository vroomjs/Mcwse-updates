import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import GuiStructureBlock from "../../../gui/screens/GuiStructureBlock.js";

export default class BlockStructure extends Block {

    constructor(id) {
        super(id, 0);
        this.textureName = "../../structure_block (6).png";
        this.sound = Block.sounds.stone;
    }

    getRenderType() {
        return BlockRenderType.STRUCTURE_BLOCK;
    }

    onBlockPlaced(world, x, y, z, face) {
        // Initialize default tile entity data
        let te = world.getTileEntity(x, y, z);
        if (!te) {
            te = {
                sizeX: 5, sizeY: 5, sizeZ: 5,
                offsetX: 0, offsetY: 1, offsetZ: 0,
                name: "mystructure",
                mode: "SAVE", // SAVE or LOAD
                showAir: true,
                showEntities: true
            };
            world.setTileEntity(x, y, z, te);
        }
    }

    onBlockActivated(world, x, y, z, player) {
        let te = world.getTileEntity(x, y, z);
        if (!te) {
            this.onBlockPlaced(world, x, y, z, null);
            te = world.getTileEntity(x, y, z);
        }

        world.minecraft.displayScreen(new GuiStructureBlock(player, x, y, z, te));
        return true;
    }
}