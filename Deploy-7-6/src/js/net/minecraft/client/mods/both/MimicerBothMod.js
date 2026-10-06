import SoundManager from "../../sound/SoundManager.js";

export const MIMICER_BOTH_MOD_STORAGE_KEY = "mcwse_builtin_mod_enabled_mimicer";

export const MIMICER_BOTH_MOD_META = Object.freeze({
    id: "mimicer",
    name: "mimicer",
    version: "1.7.0 • MCWSE Port",
    badge: "Both",
    environment: "Both",
    authors: ["Cadentem", "MCWSE Port"],
    summary: "Adds the cave-stalking Mimicer mob.",
    description: "Native MCWSE port of the Forge/GeckoLib Mimicer mod. The original Java mod cannot run directly in this browser game, so this port adds a Mimicer entity, spawn egg, cave spawns, stalk/chase/flee AI, multiplayer mob sync, and the bundled Mimicer textures and sounds.",
    icon: "mimicer",
    iconImage: "src/js/net/minecraft/client/mods/both/mimicer_icon.png",
    license: "MIT",
    removable: false,
    builtIn: true,
    clientSide: true,
    serverSide: true
});

const S = "/assets/mimicer/sounds/";

export function isMimicerBothModEnabled() {
    try {
        return localStorage.getItem(MIMICER_BOTH_MOD_STORAGE_KEY) !== "false";
    } catch (_) {
        return true;
    }
}

export function setMimicerBothModEnabled(enabled) {
    try {
        localStorage.setItem(MIMICER_BOTH_MOD_STORAGE_KEY, enabled ? "true" : "false");
    } catch (_) {}
}

export default class MimicerBothMod {
    constructor(minecraft) {
        this.minecraft = minecraft;
        this.metadata = MIMICER_BOTH_MOD_META;
        this.enabled = isMimicerBothModEnabled();
    }

    install() {
        this.minecraft.mimicerBothMod = this;
        this.registerSounds();
    }

    registerSounds() {
        Object.assign(SoundManager.SOUND_DATA, {
            "mob.mimicer.say": [`${S}cavenoise_1.ogg`, `${S}cavenoise_2.ogg`, `${S}cavenoise_3.ogg`, `${S}cavenoise_4.ogg`],
            "mob.mimicer.chase": [`${S}chase_1.ogg`, `${S}chase_2.ogg`, `${S}chase_3.ogg`, `${S}chase_4.ogg`],
            "mob.mimicer.flee": [`${S}flee_1.ogg`, `${S}flee_2.ogg`],
            "mob.mimicer.spotted": [`${S}spotted.ogg`],
            "mob.mimicer.disappear": [`${S}disappear.ogg`],
            "mob.mimicer.hurt": [`${S}dweller_hurt_1.ogg`, `${S}dweller_hurt_2.ogg`, `${S}dweller_hurt_3.ogg`, `${S}dweller_hurt_4.ogg`],
            "mob.mimicer.death": [`${S}dweller_death.ogg`]
        });
    }

    isGloballyEnabled() {
        return this.enabled;
    }

    setGloballyEnabled(enabled) {
        this.enabled = !!enabled;
        setMimicerBothModEnabled(this.enabled);
    }
}
