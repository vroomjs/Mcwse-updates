import Block from "../Block.js";
import EnumBlockFace from "../../../../util/EnumBlockFace.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import GuiCraftingTable from "../../../gui/screens/GuiCraftingTable.js";

export default class BlockCraftingTable extends Block {

    constructor(id) {
        super(id, 0);

        this.sound = Block.sounds.wood;
        this.textureName = "../../craftingtablesheet.png";
    }

    getRenderType() {
        return BlockRenderType.CRAFTING_TABLE;
    }

    getTextureForFace(face) {
        // Deprecated: Texture determination moved to BlockRenderer.renderCraftingTable
        if (face === EnumBlockFace.TOP || face === EnumBlockFace.BOTTOM) {
            return 0; // First sprite: top & bottom
        }
        if (face === EnumBlockFace.NORTH || face === EnumBlockFace.SOUTH) {
            return 1; // Second sprite: front & back
        }
        // EAST and WEST are sides
        return 2; // Third sprite: sides
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
        world.minecraft.displayScreen(new GuiCraftingTable(player));
        return true;
    }

}