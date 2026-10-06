export default class WorldStorage {
    static DB_NAME = 'minecraft_websim_storage';
    static DB_VERSION = 5;
    static STORE_WORLDS = 'worlds';
    static STORE_STRUCTURES = 'structures';
    static STORE_PACKS = 'resource_packs';
    static STORE_MODS = 'mods';
    // Chunk data is kept as separate records instead of being serialized into
    // one large world JSON value. IndexedDB is the browser equivalent of a
    // folder containing metadata plus one file per chunk.
    static STORE_CHUNKS = 'world_chunks';

    static async getDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.STORE_WORLDS)) {
                    db.createObjectStore(this.STORE_WORLDS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(this.STORE_STRUCTURES)) {
                    db.createObjectStore(this.STORE_STRUCTURES, { keyPath: 'name' });
                }
                if (!db.objectStoreNames.contains(this.STORE_PACKS)) {
                    db.createObjectStore(this.STORE_PACKS, { keyPath: 'name' });
                }
                if (!db.objectStoreNames.contains(this.STORE_MODS)) {
                    db.createObjectStore(this.STORE_MODS, { keyPath: 'name' });
                }
                if (!db.objectStoreNames.contains(this.STORE_CHUNKS)) {
                    db.createObjectStore(this.STORE_CHUNKS, { keyPath: 'id' });
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    static async saveWorld(worldId, worldData) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const chunks = worldData.c || {};
            // Metadata stays small; chunk payloads are stored independently so
            // future saves can update records without rebuilding one huge JSON
            // blob in IndexedDB.
            const metadata = { ...worldData, c: {} };
            const tx = db.transaction([this.STORE_WORLDS, this.STORE_CHUNKS], 'readwrite');
            const worlds = tx.objectStore(this.STORE_WORLDS);
            const chunkStore = tx.objectStore(this.STORE_CHUNKS);
            worlds.put({ id: worldId, name: worldData.n, lastPlayed: Date.now(), data: metadata });

            const prefix = `${worldId}:`;
            chunkStore.getAllKeys().onsuccess = event => {
                const oldKeys = event.target.result || [];
                const nextKeys = new Set(Object.keys(chunks).map(key => prefix + key));
                for (const key of oldKeys) {
                    if (String(key).startsWith(prefix) && !nextKeys.has(key)) chunkStore.delete(key);
                }
                for (const [key, value] of Object.entries(chunks)) {
                    chunkStore.put({ id: prefix + key, worldId, key, data: value });
                }
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error('World save transaction failed'));
        });
    }

    static async loadWorld(worldId) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.STORE_WORLDS, this.STORE_CHUNKS], 'readonly');
            const worlds = tx.objectStore(this.STORE_WORLDS);
            const chunks = tx.objectStore(this.STORE_CHUNKS);
            let worldEntry = null;
            let chunkEntries = [];
            worlds.get(worldId).onsuccess = event => { worldEntry = event.target.result || null; };
            chunks.getAll().onsuccess = event => {
                const prefix = `${worldId}:`;
                chunkEntries = (event.target.result || []).filter(row => String(row.id).startsWith(prefix));
            };
            tx.oncomplete = () => {
                if (!worldEntry) return resolve(null);
                const data = worldEntry.data || {};
                // Legacy worlds still have their chunks embedded in c.
                if (chunkEntries.length) {
                    data.c = Object.fromEntries(chunkEntries.map(row => [row.key, row.data]));
                } else if (!data.c) {
                    data.c = {};
                }
                resolve(data);
            };
            tx.onerror = () => reject(tx.error);
        });
    }

    static async deleteWorld(worldId) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.STORE_WORLDS, this.STORE_CHUNKS], 'readwrite');
            tx.objectStore(this.STORE_WORLDS).delete(worldId);
            const chunks = tx.objectStore(this.STORE_CHUNKS);
            chunks.getAllKeys().onsuccess = event => {
                const prefix = `${worldId}:`;
                for (const key of event.target.result || []) {
                    if (String(key).startsWith(prefix)) chunks.delete(key);
                }
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    static async getWorldList() {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_WORLDS, 'readonly');
            const store = tx.objectStore(this.STORE_WORLDS);
            const request = store.getAll();
            request.onsuccess = () => {
                const list = request.result.map(w => ({
                    id: w.id,
                    name: w.name,
                    lastPlayed: w.lastPlayed,
                    gm: w.data.gm,
                    // POV captured at the last save; may be absent on worlds
                    // saved before thumbnails existed.
                    thumb: w.data.thumb || null,
                    size: JSON.stringify(w.data).length
                }));
                list.sort((a, b) => b.lastPlayed - a.lastPlayed);
                resolve(list);
            };
            request.onerror = () => reject(request.error);
        });
    }

    static async saveStructure(name, data) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_STRUCTURES, 'readwrite');
            const store = tx.objectStore(this.STORE_STRUCTURES);
            const request = store.put({ name, data });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    static async loadStructure(name) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_STRUCTURES, 'readonly');
            const store = tx.objectStore(this.STORE_STRUCTURES);
            const request = store.get(name);
            request.onsuccess = () => resolve(request.result ? request.result.data : null);
            request.onerror = () => reject(request.error);
        });
    }

    static async saveResourcePack(name, blob) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_PACKS, 'readwrite');
            const store = tx.objectStore(this.STORE_PACKS);
            const entry = {
                name: name,
                date: Date.now(),
                data: blob
            };
            const request = store.put(entry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    static async getResourcePack(name) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_PACKS, 'readonly');
            const store = tx.objectStore(this.STORE_PACKS);
            const request = store.get(name);
            request.onsuccess = () => resolve(request.result ? request.result.data : null);
            request.onerror = () => reject(request.error);
        });
    }

    static async deleteResourcePack(name) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_PACKS, 'readwrite');
            const store = tx.objectStore(this.STORE_PACKS);
            const request = store.delete(name);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    static async getResourcePackList() {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_PACKS, 'readonly');
            const store = tx.objectStore(this.STORE_PACKS);
            const request = store.getAll();
            request.onsuccess = () => {
                const list = request.result.map(p => ({
                    name: p.name,
                    date: p.date,
                    size: p.data.size
                }));
                list.sort((a, b) => b.date - a.date);
                resolve(list);
            };
            request.onerror = () => reject(request.error);
        });
    }

    static async saveMod(name, blob) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_MODS, 'readwrite');
            const store = tx.objectStore(this.STORE_MODS);
            const entry = { name: name, date: Date.now(), data: blob, enabled: true };
            const request = store.put(entry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    static async getMod(name) {
        const db = await this.getDB();
        if (!db.objectStoreNames.contains(this.STORE_MODS)) return null;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_MODS, 'readonly');
            const store = tx.objectStore(this.STORE_MODS);
            const request = store.get(name);
            request.onsuccess = () => resolve(request.result ? request.result.data : null);
            request.onerror = () => reject(request.error);
        });
    }

    static async deleteMod(name) {
        const db = await this.getDB();
        if (!db.objectStoreNames.contains(this.STORE_MODS)) return;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_MODS, 'readwrite');
            const store = tx.objectStore(this.STORE_MODS);
            const request = store.delete(name);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    static async setModEnabled(name, enabled) {
        const db = await this.getDB();
        if (!db.objectStoreNames.contains(this.STORE_MODS)) return false;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_MODS, 'readwrite');
            const store = tx.objectStore(this.STORE_MODS);
            const request = store.get(name);
            request.onsuccess = () => {
                const entry = request.result;
                if (!entry) return resolve(false);
                entry.enabled = !!enabled;
                store.put(entry);
            };
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error || request.error);
        });
    }

    static async getModList() {
        const db = await this.getDB();
        if (!db.objectStoreNames.contains(this.STORE_MODS)) return [];
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_MODS, 'readonly');
            const store = tx.objectStore(this.STORE_MODS);
            const request = store.getAll();
            request.onsuccess = () => {
                const list = request.result.map(p => ({
                    name: p.name,
                    date: p.date,
                    size: p.data.size,
                    enabled: p.enabled !== false
                }));
                list.sort((a, b) => b.date - a.date);
                resolve(list);
            };
            request.onerror = () => reject(request.error);
        });
    }

    static async migrateFromLocalStorage() {
        const worldListJson = localStorage.getItem('mc_wl');
        if (!worldListJson) return;

        try {
            const list = JSON.parse(worldListJson);
            for (const info of list) {
                const dataJson = localStorage.getItem('mc_w_' + info.id);
                if (dataJson) {
                    await this.saveWorld(info.id, JSON.parse(dataJson));
                    localStorage.removeItem('mc_w_' + info.id);
                }
            }
            localStorage.removeItem('mc_wl');
            console.log("Migration to IndexedDB complete.");
        } catch (e) {
            console.error("Migration failed:", e);
        }
    }
}