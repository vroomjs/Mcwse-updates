import EntityZombie from "./EntityZombie.js";

export default class EntityZombieVillager extends EntityZombie {
    static name = "EntityZombieVillager";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.modelName = "zombie_villager.gltf";
        this.mobSoundPrefix = "mob.zombie";
    }
}