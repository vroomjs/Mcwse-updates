import Block from "../Block.js";
import BlockRenderType from "../../../../util/BlockRenderType.js";
import MathHelper from "../../../../util/MathHelper.js";
import { BlockRegistry } from "../BlockRegistry.js";
import EntitySnowGolem from "../../../entity/passive/EntitySnowGolem.js";

export default class BlockPumpkin extends Block {

    constructor(id, isLit) {
        super(id, 0);
        this.textureName = "../../pumpkin.png.png";
        this.isLit = isLit;
        this.sound = Block.sounds.wood;
    }

    getRenderType() {
        return BlockRenderType.PUMPKIN;
    }

    isSolid() {
        return true;
    }

    getLightValue(world, x, y, z) {
        return this.isLit ? 15 : 0;
    }

    onBlockPlaced(world, x, y, z, face) {
        let player = world.minecraft.player;
        let yaw = player.rotationYaw;
        // 0=South, 1=West, 2=North, 3=East
        let direction = Math.floor((yaw * 4.0 / 360.0) + 0.5) & 3;
        // Invert to face player
        world.setBlockDataAt(x, y, z, (direction + 2) & 3);

        // Check for Snow Golem Spawn
        this.checkSnowGolem(world, x, y, z);
    }
    
    onBlockAdded(world, x, y, z) {
        this.checkSnowGolem(world, x, y, z);
    }

    checkSnowGolem(world, x, y, z) {
        // Pattern: Pumpkin over Snow over Snow
        let b1 = world.getBlockAt(x, y - 1, z);
        let b2 = world.getBlockAt(x, y - 2, z);
        
        if (b1 === BlockRegistry.SNOW_BLOCK.getId() && b2 === BlockRegistry.SNOW_BLOCK.getId()) {
            // Remove blocks
            world.setBlockAt(x, y, z, 0);
            world.setBlockAt(x, y - 1, z, 0);
            world.setBlockAt(x, y - 2, z, 0);
            
            // Spawn Golem
            let golem = new EntitySnowGolem(world.minecraft, world);
            golem.setPosition(x + 0.5, y - 2, z + 0.5);
            world.addEntity(golem);
            
            return;
        }

        // --- Iron Golem Check ---
        // Pattern: Pumpkin (x,y,z) over Iron Block (x,y-1,z) over Iron Block (x,y-2,z)
        // With arms: Iron Block (x-1,y-1,z) and Iron Block (x+1,y-1,z) OR Z-axis
        let ironId = BlockRegistry.IRON_BLOCK.getId();
        if (world.getBlockAt(x, y - 1, z) === ironId && world.getBlockAt(x, y - 2, z) === ironId) {
            // Check X axis arms
            if (world.getBlockAt(x - 1, y - 1, z) === ironId && world.getBlockAt(x + 1, y - 1, z) === ironId) {
                world.setBlockAt(x, y, z, 0);
                world.setBlockAt(x, y - 1, z, 0);
                world.setBlockAt(x, y - 2, z, 0);
                world.setBlockAt(x - 1, y - 1, z, 0);
                world.setBlockAt(x + 1, y - 1, z, 0);
                this.spawnIronGolem(world, x, y - 2, z);
            }
            // Check Z axis arms
            else if (world.getBlockAt(x, y - 1, z - 1) === ironId && world.getBlockAt(x, y - 1, z + 1) === ironId) {
                world.setBlockAt(x, y, z, 0);
                world.setBlockAt(x, y - 1, z, 0);
                world.setBlockAt(x, y - 2, z, 0);
                world.setBlockAt(x, y - 1, z - 1, 0);
                world.setBlockAt(x, y - 1, z + 1, 0);
                this.spawnIronGolem(world, x, y - 2, z);
            }
        }
    }

    spawnIronGolem(world, x, y, z) {
        import("../../entity/passive/EntityIronGolem.js").then(module => {
            const EntityIronGolem = module.default;
            const golem = new EntityIronGolem(world.minecraft, world);
            golem.setPosition(x + 0.5, y, z + 0.5);
            world.addEntity(golem);
            world.minecraft.soundManager.playSound("random.pop", x + 0.5, y + 1.0, z + 0.5, 1.0, 0.5);
        });
    }
}


