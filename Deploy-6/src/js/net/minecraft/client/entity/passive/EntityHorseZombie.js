import EntityHorse from "./EntityHorse.js";

export default class EntityHorseZombie extends EntityHorse {
    static name = "EntityHorseZombie";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.variantTexture = "../../horse_zombie (2).png";
        this.mobSoundPrefix = "mob.horse";
        this.isTamed = true;
    }
}