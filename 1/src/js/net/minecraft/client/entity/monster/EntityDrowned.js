import EntityZombie from "./EntityZombie.js";

export default class EntityDrowned extends EntityZombie {
    static name = "EntityDrowned";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.modelName = "zombie (3).gltf";
        this.mobSoundPrefix = "mob.zombie";
    }
}

