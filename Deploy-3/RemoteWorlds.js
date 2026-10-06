import { Peer } from "peerjs";

/**
 * Worlds you have been approved to join, kept in the local world list.
 *
 * When a host accepts a join request the client no longer drops straight into
 * the world. The host's world is saved here instead, survives reloads via
 * localStorage, and is joined later from the Select World screen -- at which
 * point we re-check that the host is actually still online.
 *
 * Liveness is checked with PeerJS directly rather than by joining: a single
 * shared probe Peer dials the host's id, and whether that connection opens is
 * the answer. A real reply (lan_pong) additionally gives us the world name and
 * player count, but is not required to call the host "found".
 */

const STORAGE_KEY = "mc_remote_worlds_v1";

// A dial that never opens is reported by PeerJS as peer-unavailable, but that
// can take a while on a bad network, so cap it ourselves.
const PING_TIMEOUT_MS = 9000;
// Once the connection is open the host is alive; this is only how long we wait
// for the richer lan_pong payload before settling for what we know.
const PONG_GRACE_MS = 2500;
const FRAME_MS = 140;
const PING_FRAMES = 5;
// How long a found/unknown result stays good before the list re-checks.
const RECHECK_MS = 30000;

export const PingStatus = {
    IDLE: "idle",
    PINGING: "pinging",
    FOUND: "found",
    UNKNOWN: "unknown"
};

export default class RemoteWorlds {

    constructor(minecraft) {
        this.minecraft = minecraft;
        this.entries = [];

        this.probePeer = null;
        this.probeReady = null;
        this.pendingProbes = new Map();
        // Bumped whenever the probe peer is torn down. A ping captures the
        // value at start and refuses to write a result if it has moved on,
        // so a cancelled probe can never demote an entry after the fact.
        this.probeGeneration = 0;

        this.load();
    }

    // ---------------------------------------------------------------- storage

    load() {
        this.entries = [];
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return;

            for (const item of parsed) {
                if (!item || !item.code) continue;
                this.entries.push({
                    code: String(item.code).toUpperCase(),
                    hostUsername: item.hostUsername || "Unknown",
                    worldName: item.worldName || `${item.hostUsername || "Unknown"}'s World`,
                    token: item.token || null,
                    joinName: item.joinName || null,
                    addedAt: item.addedAt || Date.now(),
                    lastSeen: item.lastSeen || 0,
                    // Runtime only -- a status is never trusted across a reload.
                    status: PingStatus.IDLE,
                    pingStartedAt: 0,
                    players: null
                });
            }
        } catch (e) {
            console.warn("Failed to read remote world list", e);
            this.entries = [];
        }
    }

    save() {
        try {
            const data = this.entries.map(e => ({
                code: e.code,
                hostUsername: e.hostUsername,
                worldName: e.worldName,
                token: e.token,
                joinName: e.joinName || null,
                addedAt: e.addedAt,
                lastSeen: e.lastSeen
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn("Failed to save remote world list", e);
        }
    }

    // ----------------------------------------------------------------- access

    list() {
        return this.entries;
    }

    get(code) {
        if (!code) return null;
        const upper = String(code).toUpperCase();
        return this.entries.find(e => e.code === upper) || null;
    }

    /** Adds, or refreshes an existing entry for the same LAN code. */
    add(info) {
        if (!info || !info.code) return null;

        const code = String(info.code).toUpperCase();
        const host = info.hostUsername || "Unknown";
        let entry = this.get(code);

        if (entry) {
            entry.hostUsername = host;
            if (info.worldName) entry.worldName = info.worldName;
            if (info.token) entry.token = info.token;
            if (info.joinName !== undefined) entry.joinName = info.joinName || null;
        } else {
            entry = {
                code,
                hostUsername: host,
                worldName: info.worldName || `${host}'s World`,
                token: info.token || null,
                // Name to announce ourselves as on this server; null = use
                // the global username.
                joinName: info.joinName || null,
                addedAt: Date.now(),
                lastSeen: 0,
                status: PingStatus.IDLE,
                pingStartedAt: 0,
                players: null
            };
            this.entries.push(entry);
        }

        this.save();
        return entry;
    }

    /**
     * Edits a saved server in place. Changing the code rewrites the key, so
     * the entry is re-keyed and its ping result invalidated.
     */
    update(code, changes = {}) {
        const entry = this.get(code);
        if (!entry) return null;

        if (changes.joinName !== undefined) entry.joinName = changes.joinName || null;
        if (changes.worldName) entry.worldName = changes.worldName;

        const nextCode = changes.code ? String(changes.code).toUpperCase() : null;
        if (nextCode && nextCode !== entry.code) {
            if (this.get(nextCode)) return null;          // refuse a collision
            entry.code = nextCode;
            entry.status = PingStatus.IDLE;               // must be re-verified
            entry.lastChecked = 0;
            entry.players = null;
        }

        this.save();
        return entry;
    }

    remove(code) {
        const upper = String(code || "").toUpperCase();
        const before = this.entries.length;
        this.entries = this.entries.filter(e => e.code !== upper);
        if (this.entries.length !== before) {
            this.save();
            return true;
        }
        return false;
    }

    // ------------------------------------------------------------------ ping

    /** Frame 1..5 for the sweeping bar animation. */
    getPingFrame(entry) {
        if (!entry || !entry.pingStartedAt) return 1;
        const elapsed = performance.now() - entry.pingStartedAt;
        return 1 + (Math.floor(elapsed / FRAME_MS) % PING_FRAMES);
    }

    /** Re-pings anything idle, or whose last result has gone stale. */
    pingAll(force = false) {
        const now = performance.now();
        for (const entry of this.entries) {
            if (entry.status === PingStatus.PINGING) continue;
            const stale = !entry.lastChecked || (now - entry.lastChecked) > RECHECK_MS;
            if (force || entry.status === PingStatus.IDLE || stale) {
                this.ping(entry);
            }
        }
    }

    /** True while we are actually joined to this world right now. */
    isConnectedTo(entry) {
        const mp = this.minecraft?.multiplayer;
        if (!mp || !mp.connected || mp.isHosting) return false;
        const code = String(entry?.code || "").toUpperCase();
        return !!code && String(mp.lanCode || "").toUpperCase() === code;
    }

    async ping(entry) {
        if (!entry || entry.status === PingStatus.PINGING) return;

        // Never probe a world we are already inside. The host answers our
        // real session on one connection and tends to drop the extra probe
        // dial immediately, which used to flip a world we were standing in
        // to "offline".
        if (this.isConnectedTo(entry)) {
            entry.status = PingStatus.FOUND;
            entry.lastChecked = performance.now();
            entry.lastSeen = Date.now();
            return;
        }

        entry.status = PingStatus.PINGING;
        entry.pingStartedAt = performance.now();

        const gen = this.probeGeneration;
        const peerId = this.getPeerId(entry.code);
        let settled = false;
        let opened = false;
        let conn = null;
        let timeoutId = null;
        let graceId = null;

        const finish = (status, payload) => {
            if (settled) return;
            settled = true;

            // The probe peer was torn down under us (we are joining, or the
            // list closed). Say nothing rather than reporting a stale result.
            if (gen !== this.probeGeneration) {
                clearTimeout(timeoutId);
                clearTimeout(graceId);
                this.pendingProbes.delete(peerId);
                if (entry.status === PingStatus.PINGING) entry.status = PingStatus.IDLE;
                try { conn?.close(); } catch (_) { /* already gone */ }
                return;
            }

            clearTimeout(timeoutId);
            clearTimeout(graceId);
            this.pendingProbes.delete(peerId);

            entry.status = status;
            entry.lastChecked = performance.now();

            if (status === PingStatus.FOUND) {
                entry.lastSeen = Date.now();
                if (payload) {
                    if (payload.worldName) entry.worldName = payload.worldName;
                    if (payload.hostUsername) entry.hostUsername = payload.hostUsername;
                    if (typeof payload.players === "number") entry.players = payload.players;
                }
                this.save();
            }

            try { conn?.close(); } catch (_) { /* already gone */ }
        };

        // Routed here from the shared probe peer's error handler. If the
        // dial had already opened, the host exists; a later probe-peer fault
        // says nothing about the host and must not demote it.
        this.pendingProbes.set(peerId, () => finish(opened ? PingStatus.FOUND : PingStatus.UNKNOWN));

        timeoutId = setTimeout(() => finish(PingStatus.UNKNOWN), PING_TIMEOUT_MS);

        try {
            const peer = await this.ensureProbePeer();
            if (settled) return;
            if (!peer) return finish(PingStatus.UNKNOWN);

            conn = peer.connect(peerId, { reliable: true });
            if (!conn) return finish(PingStatus.UNKNOWN);

            conn.on("open", () => {
                // The dial succeeded, so the host exists. Ask for details but
                // do not make the result depend on getting them.
                opened = true;
                try { conn.send({ type: "lan_ping" }); } catch (_) { /* ignore */ }
                graceId = setTimeout(() => finish(PingStatus.FOUND), PONG_GRACE_MS);
            });

            conn.on("data", (data) => {
                if (data?.type === "lan_pong") finish(PingStatus.FOUND, data);
            });

            // An error after a successful dial is about this throwaway probe
            // connection, not about whether anyone is home.
            conn.on("error", () => finish(opened ? PingStatus.FOUND : PingStatus.UNKNOWN));
            conn.on("close", () => {
                if (settled) return;
                // This was the bug behind "online, then offline while it was
                // still up": a busy host closes the extra probe connection
                // well inside PONG_GRACE_MS. The dial opening is already
                // proof of life, so honour that instead of the close.
                finish(opened ? PingStatus.FOUND : PingStatus.UNKNOWN);
            });
        } catch (e) {
            finish(PingStatus.UNKNOWN);
        }
    }

    getPeerId(code) {
        const mp = this.minecraft?.multiplayer;
        if (mp && typeof mp.getPeerId === "function") return mp.getPeerId(code);
        return "wsmc-" + String(code).toLowerCase();
    }

    /**
     * One probe Peer shared by every entry. PeerJS reports a failed dial on the
     * Peer rather than the connection, so failures are routed back to the right
     * entry by matching the peer id inside the error message.
     */
    ensureProbePeer() {
        if (this.probeReady) return this.probeReady;

        this.probeReady = new Promise((resolve) => {
            let peer;
            try {
                peer = new Peer();
            } catch (e) {
                this.probeReady = null;
                return resolve(null);
            }

            const giveUp = setTimeout(() => {
                this.probeReady = null;
                resolve(null);
            }, 10000);

            peer.on("open", () => {
                clearTimeout(giveUp);
                this.probePeer = peer;
                resolve(peer);
            });

            peer.on("error", (err) => {
                if (err?.type === "peer-unavailable") {
                    const message = String(err.message || "");
                    for (const [peerId, onFail] of this.pendingProbes) {
                        if (message.includes(peerId)) {
                            onFail();
                            break;
                        }
                    }
                    return;
                }

                // Anything else means the probe peer itself is unusable; fail
                // everything waiting on it and allow a rebuild next time.
                clearTimeout(giveUp);
                for (const onFail of [...this.pendingProbes.values()]) onFail();
                this.probePeer = null;
                this.probeReady = null;
                resolve(null);
            });
        });

        return this.probeReady;
    }

    /**
     * Drops the shared probe peer without demoting anything.
     *
     * Called before a join: the probe peer holds its own registration with
     * the PeerJS signalling server, and leaving it open while a second Peer
     * dials the same host is a needless way to lose the race. Anything still
     * pinging simply reverts to idle and will be re-checked later.
     */
    releaseProbe() {
        this.probeGeneration++;
        this.pendingProbes.clear();
        for (const e of this.entries) {
            if (e.status === PingStatus.PINGING) e.status = PingStatus.IDLE;
        }
        try { this.probePeer?.destroy(); } catch (_) { /* ignore */ }
        this.probePeer = null;
        this.probeReady = null;
    }

    dispose() {
        for (const onFail of [...this.pendingProbes.values()]) onFail();
        this.pendingProbes.clear();
        try { this.probePeer?.destroy(); } catch (_) { /* ignore */ }
        this.probePeer = null;
        this.probeReady = null;
    }
}
