import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import EntityCow from "../../../entity/passive/EntityCow.js";

export default class BlockSpawnEgg extends Block {

    constructor(id, entityClass, textureName) {
        super(id, 0);
        this.entityClass = entityClass;
        this.textureName = textureName;
    }

    getRenderType() {
        return BlockRenderType.ITEM;
    }

    isSolid() {
        return false;
    }

    getOpacity() {
        return 0;
    }

    canPlaceBlockAt(world, x, y, z) {
        return false; // Cannot be placed as a block
    }

    onItemUse(world, x, y, z, face, player) {
        // In multiplayer, only the host should physically spawn entities to maintain source of truth
        if (world.minecraft.multiplayer && world.minecraft.multiplayer.connected && !world.minecraft.multiplayer.isHosting) {
            // Forward request to host if we wanted to be robust, but for now simple block.
            return false; 
        }

        let spawnX = x + 0.5 + face.x;
        let spawnY = y + face.y;
        let spawnZ = z + 0.5 + face.z;

        // Offset Y slightly upwards from the placement surface to ensure it's in the air
        spawnY += 0.01; 

        let entity = new this.entityClass(world.minecraft, world);
        entity.setPosition(spawnX, spawnY, spawnZ);
        world.addEntity(entity);
        


        // Optional: Swing arm and consume item in survival
        player.swingArm();
        
        // Consume item in survival mode if successfully spawned
        if (player.gameMode !== 1) {
            player.inventory.consumeItem(this.id);
        }
        
        // If in multiplayer, this entity spawn needs to be broadcasted (Not implemented yet for general mobs)
        
        return true; // Action handled
    }
}


