import Block from "../../world/block/Block.js";

export const LAMB_DYNAMIC_LIGHTS_MOD_STORAGE_KEY = "mcwse_builtin_mod_enabled_lambdynamiclights";

export const LAMB_DYNAMIC_LIGHTS_MOD_META = Object.freeze({
    id: "lambdynlights",
    name: "LambDynamicLights",
    version: "1.3.4+1.16 • MCWSE Port",
    badge: "Both",
    environment: "Both",
    authors: ["LambdAurora", "MCWSE Port"],
    summary: "Adds dynamic carried and dropped-item lighting.",
    description: "Native MCWSE port of LambDynamicLights. The original Fabric/JVM mod cannot run in the browser, so this port adds equivalent dynamic light sources for players, remote multiplayer players, burning entities, and dropped luminous items. Multiplayer equipment sync means every client can see light from all players holding torches, glowstone, lava buckets, and other light-emitting blocks/items.",
    icon: "lambdynlights",
    iconImage: "src/js/net/minecraft/client/mods/both/lambdynamiclights_icon.png",
    license: "MIT",
    website: "https://github.com/LambdAurora/LambDynamicLights",
    issues: "https://github.com/LambdAurora/LambDynamicLights/issues",
    removable: false,
    builtIn: true,
    clientSide: true,
    serverSide: true
});

const MANUAL_ITEM_LIGHT_LEVELS = new Map([
    [10, 11],   // Lava
    [11, 11],
    [50, 15],   // Torch
    [51, 15],   // Fire
    [76, 15],   // Redstone Torch (active)
    [89, 15],   // Glowstone
    [91, 15],   // Jack o' Lantern
    [124, 15],  // Redstone Lamp (lit)
    [236, 4],   // Magma Block
    [368, 14],  // Lava Bucket
    [409, 8]    // Glowstone Dust
]);

export function isLambDynamicLightsModEnabled() {
    try {
        return localStorage.getItem(LAMB_DYNAMIC_LIGHTS_MOD_STORAGE_KEY) !== "false";
    } catch (_) {
        return true;
    }
}

export function setLambDynamicLightsModEnabled(enabled) {
    try {
        localStorage.setItem(LAMB_DYNAMIC_LIGHTS_MOD_STORAGE_KEY, enabled ? "true" : "false");
    } catch (_) {}
}

export default class LambDynamicLightsMod {
    constructor(minecraft) {
        this.minecraft = minecraft;
        this.metadata = LAMB_DYNAMIC_LIGHTS_MOD_META;
        this.sources = [];
        this.lastSourceKeys = new Set();
        this.lastSources = [];
        this.lastWorld = null;
        this.tickCounter = 0;
        this.enabled = isLambDynamicLightsModEnabled();
    }

    install() {
        this.minecraft.lambDynamicLightsMod = this;
    }

    isGloballyEnabled() {
        return this.enabled;
    }

    setGloballyEnabled(enabled) {
        this.enabled = !!enabled;
        setLambDynamicLightsModEnabled(this.enabled);
        if (!this.enabled) this.clearDynamicSources(true);
        else this.tick(true);
    }

    clearDynamicSources(mark = false) {
        if (mark && this.lastWorld) {
            for (const source of this.lastSources) this.markSourceArea(this.lastWorld, source, true);
        }
        this.sources = [];
        this.lastSources = [];
        this.lastSourceKeys.clear();
        this.lastWorld = null;
    }

    getItemLightLevel(itemId) {
        const id = Number(itemId) || 0;
        if (!id) return 0;
        if (MANUAL_ITEM_LIGHT_LEVELS.has(id)) return MANUAL_ITEM_LIGHT_LEVELS.get(id);
        const block = Block.getById(id);
        if (!block || typeof block.getLightValue !== "function") return 0;
        try {
            return Math.max(0, Math.min(15, Number(block.getLightValue(null, 0, 0, 0)) || 0));
        } catch (_) {
            return Math.max(0, Math.min(15, Number(block.lightValue) || 0));
        }
    }

    isWaterAt(world, x, y, z) {
        const id = world?.getBlockAt?.(Math.floor(x), Math.floor(y), Math.floor(z));
        return id === 8 || id === 9;
    }

    addSource(list, world, x, y, z, level, kind = "item") {
        level = Math.max(0, Math.min(15, Number(level) || 0));
        if (level <= 0 || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
        // Match LambDynamicLights' water-sensitive behavior loosely: submerged
        // carried/dropped light sources are heavily damped but not allowed to
        // make the area brighter than a faint glow.
        if (this.isWaterAt(world, x, y, z)) level = Math.min(level, 3);
        if (level <= 0) return;
        const fx = Math.floor(x), fy = Math.floor(y), fz = Math.floor(z);
        list.push({
            x: fx,
            y: Math.max(0, Math.min(127, fy)),
            z: fz,
            level,
            kind,
            key: `${kind}:${fx},${Math.max(0, Math.min(127, fy))},${fz}:${level}`
        });
    }

    addEntityLight(list, world, entity, kind = "entity") {
        if (!entity) return;
        let level = 0;
        const inv = entity.inventory;
        if (inv) {
            const held = typeof inv.getItemInSelectedSlot === "function" ? inv.getItemInSelectedSlot() : 0;
            const offhand = inv.offhand?.id || 0;
            level = Math.max(level, this.getItemLightLevel(held), this.getItemLightLevel(offhand));
        }
        if ((entity.remainingFireTicks || entity.fireTicks || 0) > 0) level = Math.max(level, 15);
        if (level <= 0) return;
        const eye = typeof entity.getEyeHeight === "function" ? entity.getEyeHeight() : (entity.height ? entity.height * 0.75 : 1.2);
        this.addSource(list, world, entity.x, entity.y + eye * 0.62, entity.z, level, kind);
    }

    collectSources(world) {
        const list = [];
        const localPlayer = this.minecraft.player;
        if (localPlayer && localPlayer.world === world) this.addEntityLight(list, world, localPlayer, "player");

        for (const entity of world.entities || []) {
            if (!entity || entity === localPlayer) continue;
            // Remote players expose the same small inventory surface as local
            // players, so their held torch/lava/glowstone lights everybody's
            // multiplayer world client-side.
            this.addEntityLight(list, world, entity, entity.constructor?.name === "RemotePlayerEntity" ? "remote_player" : "entity");
        }

        for (const item of world.droppedItems || []) {
            if (!item || item.isDead) continue;
            const level = this.getItemLightLevel(item.blockId);
            if (level > 0) this.addSource(list, world, item.x, item.y + 0.15, item.z, level, "dropped_item");
        }
        return list;
    }

    tick(force = false) {
        const world = this.minecraft.world;
        if (!world) {
            this.clearDynamicSources(true);
            return;
        }
        if (!this.isGloballyEnabled()) {
            this.clearDynamicSources(true);
            return;
        }
        this.tickCounter++;
        if (!force && this.tickCounter % 4 !== 0) return;

        if (world !== this.lastWorld) {
            this.clearDynamicSources(false);
            this.lastWorld = world;
        }

        const nextSources = this.collectSources(world);
        const nextKeys = new Set(nextSources.map(source => source.key));
        let changed = nextKeys.size !== this.lastSourceKeys.size;
        if (!changed) {
            for (const key of nextKeys) {
                if (!this.lastSourceKeys.has(key)) { changed = true; break; }
            }
        }
        if (changed) {
            for (const source of this.lastSources) this.markSourceArea(world, source, true);
            for (const source of nextSources) this.markSourceArea(world, source, true);
        }

        this.sources = nextSources;
        this.lastSources = nextSources.map(source => ({...source}));
        this.lastSourceKeys = nextKeys;
        this.lastWorld = world;
    }

    markSourceArea(world, source, priority = false) {
        if (!world || !source || source.level <= 0) return;
        const r = Math.max(2, Math.min(15, source.level));
        try {
            world.setModified(source.x - r, source.y - r, source.z - r, source.x + r, source.y + r, source.z + r, priority);
        } catch (_) {}
    }

    getLightLevelAt(x, y, z, baseLevel = 0) {
        if (!this.isGloballyEnabled() || !this.sources.length) return baseLevel;
        let best = Number(baseLevel) || 0;
        for (const source of this.sources) {
            const dx = Math.abs((x | 0) - source.x);
            const dy = Math.abs((y | 0) - source.y);
            const dz = Math.abs((z | 0) - source.z);
            if (dx > source.level || dy > source.level || dz > source.level) continue;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const level = Math.max(0, source.level - Math.floor(distance));
            if (level > best) {
                best = level;
                if (best >= 15) return 15;
            }
        }
        return best;
    }
}
