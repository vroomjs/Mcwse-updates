import World from "./World.js";
import Chunk from "./Chunk.js";
import Vector3 from "../../util/Vector3.js";

/**
 * Client-side world used by the LabyStudio real-server protocol bridge.
 *
 * The normal MCWSE World generates local chunks on demand. A real Minecraft
 * server is authoritative instead, so this class creates empty chunks and lets
 * chunk packets fill them. That keeps the existing renderer/entity systems but
 * prevents local terrain generation from overwriting server terrain.
 */
export default class WorldClient extends World {
    constructor(minecraft, name = "Real Server") {
        super(minecraft, 0, null, 0);
        this.name = name;
        this.isRealServer = true;
        this.isMultiplayer = true;
        this.isHost = false;
        this.spawn = new Vector3(0, 64, 0);
        this.spawnIsSet = true;
        this.worldType = 6;
        this._gameType = "real_server";
        this.chunks.clear();
        this.chunkLoadQueue = [];
        this.chunkLoadSet?.clear?.();
    }

    findSpawn() {
        this.spawnIsSet = true;
        return this.spawn;
    }

    loadSpawnChunks() {
        // Server chunk packets decide which terrain is available.
    }

    saveWorldData() {
        // Real-server worlds are not local saves.
        return Promise.resolve();
    }

    getChunkKey(x, z) {
        return x + "," + z;
    }

    getChunkAt(x, z) {
        const key = this.getChunkKey(x, z);
        let chunk = this.chunks.get(key);
        if (!chunk) {
            chunk = new Chunk(this, x, z);
            chunk.loaded = true;
            chunk.lightReady = true;
            chunk.isTerrainPopulated = true;
            this.chunks.set(key, chunk);
            this.group.add(chunk.group);
            chunk.group.updateMatrixWorld(true);
        }
        return chunk;
    }

    chunkExists(x, z) {
        return this.chunks.has(this.getChunkKey(x, z));
    }

    unloadChunk(x, z) {
        const key = this.getChunkKey(x, z);
        const chunk = this.chunks.get(key);
        if (!chunk) return;
        try { chunk.unload(); } catch (_) {}
        this.group.remove(chunk.group);
        this.chunks.delete(key);
    }

    onTick() {
        this.time++;
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            if (entity !== this.minecraft.player) entity.onUpdate();
        }
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (entity.health <= 0 && entity.deathTime >= 20 && entity.constructor.name !== "PlayerEntity") {
                this.removeEntityById(entity.id);
            }
        }
    }
}
