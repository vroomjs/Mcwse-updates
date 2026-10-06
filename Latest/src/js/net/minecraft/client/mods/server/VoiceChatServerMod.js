export const VOICE_CHAT_SERVER_MOD_STORAGE_KEY = "mcwse_builtin_mod_enabled_server_voice_chat";

export const VOICE_CHAT_SERVER_MOD_META = Object.freeze({
    id: "server_voice_chat",
    name: "Voice Chat",
    version: "1.0.0 • Server",
    badge: "Server",
    environment: "Server",
    authors: ["MCWSE"],
    summary: "Adds opt-in voice chat to hosted LAN worlds.",
    description: "Server-side LAN mod that relays voice availability through the host and connects players with PeerJS WebRTC media calls. Each player still grants browser microphone permission locally; game audio never passes through world saves.",
    icon: "voice",
    iconImage: "src/js/net/minecraft/client/mods/server/voice_chat_icon.png",
    license: "Bundled server mod",
    website: "Built into the hosted LAN server",
    issues: "Use /voice status for connection diagnostics",
    removable: false,
    builtIn: true,
    serverSide: true
});

/**
 * Bundled server mod for LAN voice chat.
 *
 * The browser game has no separate dedicated JVM-style mod loader for code
 * mods, so the LAN host installs this module at Multiplayer construction time.
 * It behaves like a server mod: the host relays lightweight voice_state packets
 * and peers establish direct WebRTC audio calls with each other.
 */
export default class VoiceChatServerMod {
    constructor(multiplayer) {
        this.multiplayer = multiplayer;
        this.minecraft = multiplayer.minecraft;
        this.metadata = VOICE_CHAT_SERVER_MOD_META;
        this.enabled = false;
        this.muted = false;
        this.localStream = null;
        this.calls = new Map(); // peerId -> MediaConnection
        this.remoteAudios = new Map(); // peerId -> HTMLAudioElement
        this.handlersPeer = null;
        this.peers = new Map(); // peerId -> {enabled, muted, username}
    }

    install() {
        const mp = this.multiplayer;
        mp.voiceChatServerMod = this;
        mp.serverVoiceChatMod = this;

        Object.defineProperties(mp, {
            voiceEnabled: {
                configurable: true,
                get: () => this.enabled,
                set: value => { this.enabled = !!value; }
            },
            voiceMuted: {
                configurable: true,
                get: () => this.muted,
                set: value => { this.muted = !!value; }
            },
            localVoiceStream: {
                configurable: true,
                get: () => this.localStream,
                set: value => { this.localStream = value || null; }
            },
            voiceCalls: {
                configurable: true,
                get: () => this.calls,
                set: value => { this.calls = value instanceof Map ? value : new Map(); }
            },
            remoteVoiceAudios: {
                configurable: true,
                get: () => this.remoteAudios,
                set: value => { this.remoteAudios = value instanceof Map ? value : new Map(); }
            },
            _voiceHandlersPeer: {
                configurable: true,
                get: () => this.handlersPeer,
                set: value => { this.handlersPeer = value || null; }
            },
            voicePeers: {
                configurable: true,
                get: () => this.peers,
                set: value => { this.peers = value instanceof Map ? value : new Map(); }
            }
        });

        // Install as instance methods so all existing callers use the server
        // mod implementation while the rest of Multiplayer stays unchanged.
        mp.setupVoiceHandlers = this.setupPeerHandlers.bind(this);
        mp.enableVoiceChat = this.enable.bind(this);
        mp.disableVoiceChat = this.disable.bind(this);
        mp.toggleVoiceChat = this.toggle.bind(this);
        mp.setVoiceMuted = this.setMuted.bind(this);
        mp.getVoicePeerIds = this.getPeerIds.bind(this);
        mp.shouldInitiateVoiceCall = this.shouldInitiateCall.bind(this);
        mp.callAllVoicePeers = this.callAllPeers.bind(this);
        mp.callVoicePeer = this.callPeer.bind(this);
        mp.registerVoiceCall = this.registerCall.bind(this);
        mp.attachRemoteVoice = this.attachRemoteAudio.bind(this);
        mp.closeVoicePeer = this.closePeer.bind(this);
        mp.sendVoiceState = this.sendState.bind(this);
        mp.handleVoiceState = this.handleState.bind(this);
        mp.stopVoiceChatForDisconnect = this.stopForDisconnect.bind(this);
    }

    get username() {
        return this.minecraft.settings?.username || "Player";
    }

    isGloballyEnabled() {
        try {
            // Opt-in: built-in mods are off until the player enables them in
            // the Mods menu. An explicit stored "true" is the only way on,
            // so anyone who already turned this on keeps it.
            return localStorage.getItem(VOICE_CHAT_SERVER_MOD_STORAGE_KEY) === "true";
        } catch (_) {
            return false;
        }
    }

    setGloballyEnabled(enabled) {
        try {
            localStorage.setItem(VOICE_CHAT_SERVER_MOD_STORAGE_KEY, enabled ? "true" : "false");
        } catch (_) {}
        if (!enabled && this.enabled) this.disable();
    }

    setupPeerHandlers() {
        const mp = this.multiplayer;
        if (!mp.peer || this.handlersPeer === mp.peer) return;
        this.handlersPeer = mp.peer;
        mp.peer.on("call", (call) => {
            const peerId = call.peer;
            if (!this.enabled || !this.localStream) {
                try { call.close(); } catch (_) {}
                return;
            }
            try {
                call.answer(this.localStream);
                this.registerCall(peerId, call);
            } catch (error) {
                console.warn("Failed to answer voice call:", error);
                try { call.close(); } catch (_) {}
            }
        });
    }

    async enable() {
        const mp = this.multiplayer;
        if (!this.isGloballyEnabled()) {
            this.minecraft.addMessageToChat("§cVoice Chat Server mod is disabled in the Mods menu.");
            return false;
        }
        if (!mp.connected || !mp.peer) {
            this.minecraft.addMessageToChat("§cJoin or host a LAN world before using voice chat.");
            return false;
        }
        if (this.enabled && this.localStream) return true;

        const mediaDevices = globalThis.navigator?.mediaDevices;
        if (!mediaDevices?.getUserMedia) {
            this.minecraft.addMessageToChat("§cVoice chat is not supported by this browser.");
            return false;
        }

        try {
            const stream = await mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
            this.localStream = stream;
            this.enabled = true;
            this.muted = false;
            this.setMuted(false, false);
            this.setupPeerHandlers();
            this.sendState();
            this.callAllPeers();
            this.minecraft.addMessageToChat("§aVoice chat enabled. §7(Server mod)");
            return true;
        } catch (error) {
            console.warn("Voice chat microphone permission failed:", error);
            this.minecraft.addMessageToChat("§cMicrophone permission was denied or unavailable.");
            return false;
        }
    }

    disable() {
        this.enabled = false;
        this.muted = false;
        this.sendState();
        for (const peerId of Array.from(this.calls.keys())) this.closePeer(peerId);
        for (const audio of this.remoteAudios.values()) {
            try { audio.pause(); } catch (_) {}
            try { audio.remove(); } catch (_) {}
        }
        this.remoteAudios.clear();
        if (this.localStream) {
            for (const track of this.localStream.getTracks()) {
                try { track.stop(); } catch (_) {}
            }
        }
        this.localStream = null;
        this.minecraft.addMessageToChat("§eVoice chat disabled. §7(Server mod)");
    }

    async toggle() {
        if (this.enabled) {
            this.disable();
            return false;
        }
        return await this.enable();
    }

    setMuted(muted, announce = true) {
        this.muted = !!muted;
        if (this.localStream) {
            for (const track of this.localStream.getAudioTracks()) track.enabled = !this.muted;
        }
        this.sendState();
        if (announce) this.minecraft.addMessageToChat(this.muted ? "§eVoice chat muted." : "§aVoice chat unmuted.");
    }

    getPeerIds() {
        const mp = this.multiplayer;
        const peers = new Set();
        if (mp.isHosting) {
            for (const [peerId, conn] of mp.connections) {
                if (conn?.open !== false) peers.add(peerId);
            }
        } else if (mp.hostConn?.peer) {
            peers.add(mp.hostConn.peer);
        }
        for (const [peerId, state] of this.peers) {
            if (state?.enabled) peers.add(peerId);
        }
        return Array.from(peers).filter(peerId => peerId && peerId !== mp.peer?.id);
    }

    shouldInitiateCall(peerId) {
        const mp = this.multiplayer;
        if (!mp.peer?.id || !peerId) return false;
        // One media call is bidirectional once the callee answers with its
        // stream. Use a stable lexical rule to prevent duplicate calls/audio.
        return String(mp.peer.id) < String(peerId);
    }

    callAllPeers() {
        for (const peerId of this.getPeerIds()) {
            if (this.shouldInitiateCall(peerId)) this.callPeer(peerId);
        }
    }

    callPeer(peerId) {
        const mp = this.multiplayer;
        if (!this.enabled || !this.localStream || !mp.peer || !peerId) return;
        if (!this.shouldInitiateCall(peerId)) return;
        if (this.calls.has(peerId)) return;
        try {
            const call = mp.peer.call(peerId, this.localStream, {
                metadata: {
                    type: "voice_chat_server_mod",
                    modId: VOICE_CHAT_SERVER_MOD_META.id,
                    username: this.username
                }
            });
            if (call) this.registerCall(peerId, call);
        } catch (error) {
            console.warn("Failed to start voice call:", error);
        }
    }

    registerCall(peerId, call) {
        if (!peerId || !call) return;
        const existing = this.calls.get(peerId);
        this.calls.set(peerId, call);
        if (existing && existing !== call) {
            try { existing.close(); } catch (_) {}
        }
        call.on("stream", (stream) => this.attachRemoteAudio(peerId, stream));
        call.on("close", () => {
            if (this.calls.get(peerId) === call) this.closePeer(peerId, false);
        });
        call.on("error", (error) => {
            console.warn("Voice call error:", error);
            if (this.calls.get(peerId) === call) this.closePeer(peerId, false);
        });
    }

    attachRemoteAudio(peerId, stream) {
        if (!stream || typeof document === "undefined") return;
        let audio = this.remoteAudios.get(peerId);
        if (!audio) {
            audio = document.createElement("audio");
            audio.autoplay = true;
            audio.playsInline = true;
            audio.style.display = "none";
            audio.dataset.peerId = peerId;
            audio.dataset.modId = VOICE_CHAT_SERVER_MOD_META.id;
            document.body.appendChild(audio);
            this.remoteAudios.set(peerId, audio);
        }
        audio.srcObject = stream;
        audio.volume = 1.0;
        audio.play().catch(error => {
            console.warn("Remote voice autoplay blocked:", error);
            this.minecraft.addMessageToChat("§eClick once to allow voice chat playback.");
        });
    }

    closePeer(peerId, closeCall = true) {
        const call = this.calls.get(peerId);
        this.calls.delete(peerId);
        if (closeCall && call) {
            try { call.close(); } catch (_) {}
        }
        const audio = this.remoteAudios.get(peerId);
        this.remoteAudios.delete(peerId);
        if (audio) {
            try { audio.pause(); } catch (_) {}
            try { audio.remove(); } catch (_) {}
        }
        this.peers.delete(peerId);
    }

    sendState(conn = null) {
        const mp = this.multiplayer;
        if (!mp.peer) return;
        const packet = {
            type: "voice_state",
            modId: VOICE_CHAT_SERVER_MOD_META.id,
            peerId: mp.peer.id,
            enabled: !!this.enabled,
            muted: !!this.muted,
            username: this.username
        };
        if (conn) {
            try { if (conn.open) conn.send(packet); } catch (_) {}
        } else {
            mp.broadcast(packet);
        }
    }

    handleState(data, fromPeerId) {
        const peerId = data.peerId || fromPeerId;
        if (!peerId || peerId === this.multiplayer.peer?.id) return;
        if (data.enabled) {
            this.peers.set(peerId, {enabled: true, muted: !!data.muted, username: data.username || "Player"});
            if (this.enabled && this.shouldInitiateCall(peerId)) this.callPeer(peerId);
        } else {
            this.closePeer(peerId);
        }
    }

    stopForDisconnect() {
        const wasEnabled = this.enabled;
        this.enabled = false;
        this.muted = false;
        for (const peerId of Array.from(this.calls.keys())) this.closePeer(peerId);
        for (const audio of this.remoteAudios.values()) {
            try { audio.pause(); } catch (_) {}
            try { audio.remove(); } catch (_) {}
        }
        this.remoteAudios.clear();
        if (this.localStream) {
            for (const track of this.localStream.getTracks()) {
                try { track.stop(); } catch (_) {}
            }
        }
        this.localStream = null;
        this.peers.clear();
        if (wasEnabled) console.log("Voice chat server mod stopped for disconnect.");
    }
}
