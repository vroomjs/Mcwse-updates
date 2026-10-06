import EntityHorse from "./EntityHorse.js";

export default class EntityMule extends EntityHorse {
    static name = "EntityMule";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.variantTexture = "../../mule (1).png";
        this.mobSoundPrefix = "mob.mule";
    }
}