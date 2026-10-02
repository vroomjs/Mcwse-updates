import EntityZombie from "./EntityZombie.js";

export default class EntitySnowZombie extends EntityZombie {
    static name = "EntitySnowZombie";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.modelName = "zombie (3).gltf";
        this.mobSoundPrefix = "mob.zombie";
    }
}

