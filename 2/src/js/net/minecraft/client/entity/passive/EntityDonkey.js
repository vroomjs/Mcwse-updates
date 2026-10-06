import EntityHorse from "./EntityHorse.js";

export default class EntityDonkey extends EntityHorse {
    static name = "EntityDonkey";

    constructor(minecraft, world) {
        super(minecraft, world);
        this.variantTexture = "../../donkey (1).png";
        this.mobSoundPrefix = "mob.donkey";
    }
}