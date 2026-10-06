import EntityHorse from "./EntityHorse.js";

export default class EntityHorseSkeleton extends EntityHorse {
    static name = "EntityHorseSkeleton";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.variantTexture = "../../horse_skeleton (1).png";
        this.mobSoundPrefix = "mob.horse";
        this.isTamed = true;
    }
}