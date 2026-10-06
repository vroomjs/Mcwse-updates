import EntityZombie from "./EntityZombie.js";

export default class EntityHusk extends EntityZombie {
    static name = "EntityHusk";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.modelName = "zombie (3).gltf";
        this.mobSoundPrefix = "mob.zombie";
    }
}

