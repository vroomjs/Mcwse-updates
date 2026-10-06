import PlayerRenderer from "./entity/PlayerRenderer.js";
import PlayerEntity from "../../entity/PlayerEntity.js";
import RemotePlayerEntity from "../../entity/RemotePlayerEntity.js";
import EntityCow from "../../entity/passive/EntityCow.js";
import EntityChicken from "../../entity/passive/EntityChicken.js";
import EntityZombie from "../../entity/monster/EntityZombie.js";
import GltfEntityRenderer from "./GltfEntityRenderer.js";
import EntityArrow from "../../entity/EntityArrow.js";
import ArrowRenderer from "./ArrowRenderer.js";
import EntityCreeper from "../../entity/monster/EntityCreeper.js";
import EntitySnowZombie from "../../entity/monster/EntitySnowZombie.js";
import EntityHusk from "../../entity/monster/EntityHusk.js";
import EntityDrowned from "../../entity/monster/EntityDrowned.js";
import EntityZombieVillager from "../../entity/monster/EntityZombieVillager.js";
import EntityVillager from "../../entity/passive/EntityVillager.js";
import EntityPig, { EntitySaddledPig } from "../../entity/passive/EntityPig.js";
import EntitySnowball from "../../entity/EntitySnowball.js";
import SnowballRenderer from "./SnowballRenderer.js";
import EntitySkeleton from "../../entity/monster/EntitySkeleton.js";
import EntitySnowGolem from "../../entity/passive/EntitySnowGolem.js";
import EntitySheep from "../../entity/passive/EntitySheep.js";
import EntitySpider from "../../entity/monster/EntitySpider.js";
import EntitySlime from "../../entity/monster/EntitySlime.js";
import EntityEnderman from "../../entity/monster/EntityEnderman.js";
import EntityIronGolem from "../../entity/passive/EntityIronGolem.js";
import EntityHorse from "../../entity/passive/EntityHorse.js";
import EntityHorseSkeleton from "../../entity/passive/EntityHorseSkeleton.js";
import EntityHorseZombie from "../../entity/passive/EntityHorseZombie.js";
import EntityDonkey from "../../entity/passive/EntityDonkey.js";
import EntityMule from "../../entity/passive/EntityMule.js";
import EntityCat from "../../entity/passive/EntityCat.js";
import { EntityBoat, BoatRenderer } from "../../../../../../../Boats.js";
import { EntityMinecart } from "../../../../../../../Minecarts.js";
import PrimedTNT from "../../entity/PrimedTNT.js";
import TntRenderer from "./TntRenderer.js";
import EntityEnderPearl from "../../entity/EntityEnderPearl.js";
import EntityFishHook from "../../entity/EntityFishHook.js";
import FishHookRenderer from "./FishHookRenderer.js";
import EntityBlockDisplay from "../../entity/EntityBlockDisplay.js";
import EntityFallingBlock from "../../entity/EntityFallingBlock.js";
import BlockDisplayRenderer from "./BlockDisplayRenderer.js";

export default class EntityRenderManager {

    constructor(worldRenderer) {
        this.worldRenderer = worldRenderer;

        this.renderers = [];
        this.push(PlayerEntity, PlayerRenderer);
        this.push(RemotePlayerEntity, PlayerRenderer);
        this.push(EntityCow, GltfEntityRenderer);
        this.push(EntityChicken, GltfEntityRenderer);
        this.push(EntityZombie, GltfEntityRenderer);
        this.push(EntityArrow, ArrowRenderer);
        this.push(EntityCreeper, GltfEntityRenderer);
        // REGISTER NEW ZOMBIE VARIANTS
        this.push(EntitySnowZombie, GltfEntityRenderer);
        this.push(EntityHusk, GltfEntityRenderer);
        this.push(EntityDrowned, GltfEntityRenderer);
        this.push(EntityZombieVillager, GltfEntityRenderer);
        this.push(EntityVillager, GltfEntityRenderer);
        this.push(EntityPig, GltfEntityRenderer);
        this.push(EntitySaddledPig, GltfEntityRenderer);
        this.push(EntitySkeleton, GltfEntityRenderer);
        this.push(EntitySnowGolem, GltfEntityRenderer);
        this.push(EntitySheep, GltfEntityRenderer);
        this.push(EntitySpider, GltfEntityRenderer);
        this.push(EntitySlime, GltfEntityRenderer);
        this.push(EntityEnderman, GltfEntityRenderer);
        this.push(EntityIronGolem, GltfEntityRenderer);
        this.push(EntityHorse, GltfEntityRenderer);
        this.push(EntityHorseSkeleton, GltfEntityRenderer);
        this.push(EntityHorseZombie, GltfEntityRenderer);
        this.push(EntityDonkey, GltfEntityRenderer);
        this.push(EntityMule, GltfEntityRenderer);
        this.push(EntityCat, GltfEntityRenderer);
        
        // Snowball
        this.push(EntitySnowball, SnowballRenderer);

        // Ender Pearl
        this.push(EntityEnderPearl, SnowballRenderer);

        // Fish Hook
        this.push(EntityFishHook, FishHookRenderer);
        
        // TNT
        this.push(PrimedTNT, TntRenderer);

        // Boats
        this.push(EntityBoat, BoatRenderer);

        // Minecarts
        this.push(EntityMinecart, GltfEntityRenderer);

        // Block Display
        this.push(EntityBlockDisplay, BlockDisplayRenderer);
        this.push(EntityFallingBlock, BlockDisplayRenderer);
    }

    push(entityType, entityRenderer) {
        this.renderers[entityType.name] = entityRenderer;
    }

    createEntityRendererByEntity(entity) {
        return new this.renderers[entity.constructor.name].prototype.constructor(this.worldRenderer);
    }
}