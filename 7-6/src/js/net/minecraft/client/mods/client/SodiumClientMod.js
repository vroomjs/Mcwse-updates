export const SODIUM_CLIENT_MOD_STORAGE_KEY = "mcwse_builtin_mod_enabled_sodium";

export const SODIUM_CLIENT_MOD_META = Object.freeze({
    id: "sodium",
    name: "Sodium",
    version: "MCWSE 1.07",
    badge: "Client",
    environment: "Client",
    authors: ["JellySquid", "MCWSE Port"],
    summary: "Renderer optimization mod ported for MCWSE.",
    description: "Native MCWSE port of Sodium's client-side optimization goals. The original Fabric/JVM bytecode cannot run in the browser, so this port applies equivalent WebGL/JavaScript renderer optimizations: adaptive chunk rebuild budgets, stale rebuild culling, tighter frustum/empty-section checks, and front-to-back chunk scheduling.",
    icon: "sodium",
    iconImage: "src/js/net/minecraft/client/mods/client/sodium_icon.png",
    license: "LGPL-3.0-only",
    website: "https://github.com/CaffeineMC/sodium-fabric",
    issues: "https://github.com/CaffeineMC/sodium-fabric/issues",
    removable: false,
    builtIn: true,
    clientSide: true
});

export function isSodiumClientModEnabled() {
    try {
        return localStorage.getItem(SODIUM_CLIENT_MOD_STORAGE_KEY) !== "false";
    } catch (_) {
        return true;
    }
}

export function setSodiumClientModEnabled(enabled) {
    try {
        localStorage.setItem(SODIUM_CLIENT_MOD_STORAGE_KEY, enabled ? "true" : "false");
    } catch (_) {}
}

export function getSodiumChunkRebuildBudget(settings, performanceFactor = 1, isLoading = false, queueLength = 0) {
    if (!isSodiumClientModEnabled()) {
        return isLoading ? 20 : Math.max(2, Math.min(6, (settings.chunkRebuildBudgetMs || 4) * (0.5 + 0.5 * performanceFactor)));
    }

    if (isLoading) return 26;

    const base = Math.max(1.5, settings.chunkRebuildBudgetMs || 2.5);
    const scaled = base * (0.65 + 0.55 * Math.max(0.35, Math.min(1.4, performanceFactor || 1)));
    const pressureBoost = queueLength > 512 ? 2.5 : queueLength > 256 ? 1.5 : queueLength > 96 ? 0.75 : 0;
    return Math.max(2.5, Math.min(8.5, scaled + pressureBoost));
}

export function cullSodiumRebuildQueue(queue, renderer) {
    if (!isSodiumClientModEnabled() || !queue || queue.length < 384 || !renderer?.minecraft?.player) return;

    const settings = renderer.minecraft.settings;
    const player = renderer.activeViewer || renderer.minecraft.player;
    const playerChunkX = Math.floor(player.x) >> 4;
    const playerChunkZ = Math.floor(player.z) >> 4;
    const playerSectionY = Math.floor(player.y) >> 4;
    const normal = settings.viewDistance || 3;
    const lod = settings.lodRendering === false ? normal : Math.max(normal, Math.ceil((settings.lodRenderDistance || 64) / 16));
    const maxHorizontal = lod + 5;
    const maxVertical = lod + 4;

    for (let i = queue.length - 1; i >= 0; i--) {
        const section = queue[i];
        if (!section || !section.chunk || !section.chunk.loaded) {
            if (section) section.inUpdateQueue = false;
            queue.splice(i, 1);
            continue;
        }

        const dx = Math.abs(section.x - playerChunkX);
        const dz = Math.abs(section.z - playerChunkZ);
        const dy = Math.abs(section.y - playerSectionY);
        if (dx > maxHorizontal || dz > maxHorizontal || dy > maxVertical) {
            section.inUpdateQueue = false;
            queue.splice(i, 1);
        }
    }
}

export default class SodiumClientMod {
    constructor(minecraft) {
        this.minecraft = minecraft;
        this.metadata = SODIUM_CLIENT_MOD_META;
    }

    install() {
        this.minecraft.sodiumClientMod = this;
        this.applyRendererHints();
    }

    isGloballyEnabled() {
        return isSodiumClientModEnabled();
    }

    setGloballyEnabled(enabled) {
        setSodiumClientModEnabled(enabled);
        this.applyRendererHints();
        if (this.minecraft.worldRenderer) {
            this.minecraft.worldRenderer.rebuildAll();
            this.minecraft.worldRenderer.flushRebuild = true;
        }
    }

    applyRendererHints() {
        const renderer = this.minecraft.worldRenderer?.webRenderer;
        if (!renderer || !this.isGloballyEnabled()) return;

        // Sodium's biggest wins are avoiding unnecessary render state churn.
        // These are safe in MCWSE's chunk renderer and already match the fast
        // path, but re-asserting them keeps resource-pack/renderer reloads on
        // the optimized path.
        renderer.shadowMap.enabled = false;
        renderer.sortObjects = false;
        renderer.autoClear = false;
    }
}
