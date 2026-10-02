import { EntityMinecart } from "/Minecarts.js";
import { EntityBoat } from "/Boats.js";
import RemotePlayerEntity from "./src/js/net/minecraft/client/entity/RemotePlayerEntity.js";
import World from "./src/js/net/minecraft/client/world/World.js";
import { Peer } from "peerjs";
import DroppedItem from "./src/js/net/minecraft/client/entity/DroppedItem.js";
import EntityCow from "./src/js/net/minecraft/client/entity/passive/EntityCow.js";
import EntityChicken from "./src/js/net/minecraft/client/entity/passive/EntityChicken.js";
import EntityPig, { EntitySaddledPig } from "./src/js/net/minecraft/client/entity/passive/EntityPig.js";
import EntityZombie from "./src/js/net/minecraft/client/entity/monster/EntityZombie.js";
import EntityCreeper from "./src/js/net/minecraft/client/entity/monster/EntityCreeper.js";
import EntitySkeleton from "./src/js/net/minecraft/client/entity/monster/EntitySkeleton.js";
import EntitySnowZombie from "./src/js/net/minecraft/client/entity/monster/EntitySnowZombie.js";
import EntityHusk from "./src/js/net/minecraft/client/entity/monster/EntityHusk.js";
import EntityDrowned from "./src/js/net/minecraft/client/entity/monster/EntityDrowned.js";
import EntityZombieVillager from "./src/js/net/minecraft/client/entity/monster/EntityZombieVillager.js";
import EntityVillager from "./src/js/net/minecraft/client/entity/passive/EntityVillager.js";
import EntitySnowGolem from "./src/js/net/minecraft/client/entity/passive/EntitySnowGolem.js";
import EntitySheep from "./src/js/net/minecraft/client/entity/passive/EntitySheep.js";
import EntitySpider from "./src/js/net/minecraft/client/entity/monster/EntitySpider.js";
import EntitySlime from "./src/js/net/minecraft/client/entity/monster/EntitySlime.js";
import EntityEnderman from "./src/js/net/minecraft/client/entity/monster/EntityEnderman.js";
import EntityHorse from "./src/js/net/minecraft/client/entity/passive/EntityHorse.js";
import EntityHorseSkeleton from "./src/js/net/minecraft/client/entity/passive/EntityHorseSkeleton.js";
import EntityHorseZombie from "./src/js/net/minecraft/client/entity/passive/EntityHorseZombie.js";
import EntityDonkey from "./src/js/net/minecraft/client/entity/passive/EntityDonkey.js";
import EntityMule from "./src/js/net/minecraft/client/entity/passive/EntityMule.js";
import Keyboard from "./src/js/net/minecraft/util/Keyboard.js";

export default class Multiplayer {

    constructor(minecraft) {
        this.minecraft = minecraft;
        
        this.connected = false;
        this.isHosting = false;
        this.lanCode = null;
        
        // LAN gameplay is direct PeerJS P2P. The optional room state mirror is
        // only used for mob persistence when the Websim runtime provides it.
        this.room = null;
        try {
            if (typeof WebsimSocket !== "undefined") this.room = new WebsimSocket();
        } catch (error) {
            console.warn("Optional room-state mirror unavailable; using direct P2P only.", error);
        }
        this.peer = null;
        this.connections = new Map(); // For host: peerId -> DataConnection
        this.hostConn = null; // For client: DataConnection to host
        this.presence = {}; // Map of peerId -> presence data

        this.remotePlayers = new Map();
        this.banList = new Set();
        this.permissions = new Map(); // clientId -> { canBuild: true, canCommand: true, canFly: false }
        this.playerGameModes = new Map(); // clientId -> gamemode id

        this.lastPresenceUpdate = 0;
        this.lastPosUpdate = 0;
        this.lastInvUpdate = 0;
        
        this.lastSentX = 0;
        this.lastSentY = 0;
        this.lastSentZ = 0;
        this.lastSentYaw = 0;

        this.timeSyncTimer = 0;
        this.mobUpdateTimer = 0;

        this.blockUpdateBuffer = [];
        this.pendingJoinRequests = [];
        this.joinHoldTicks = 0;
        this.joinNotice = null;
        this.suppressJoinKeyUntilRelease = false;
        this.approvedJoinTokens = new Map();
        this.isProcessingRemoteUpdate = false;
        this.remoteItems = new Map(); // serverID -> DroppedItem

        this.mobClassMap = {
            "EntityCow": EntityCow,
            "EntityChicken": EntityChicken,
            "EntityPig": EntityPig,
            "EntitySaddledPig": EntitySaddledPig,
            "EntityZombie": EntityZombie,
            "EntityCreeper": EntityCreeper,
            "EntitySkeleton": EntitySkeleton,
            "EntitySnowZombie": EntitySnowZombie,
            "EntityHusk": EntityHusk,
            "EntityDrowned": EntityDrowned,
            "EntityZombieVillager": EntityZombieVillager,
            "EntityVillager": EntityVillager,
            "EntitySnowGolem": EntitySnowGolem,
            "EntitySheep": EntitySheep,
            "EntitySpider": EntitySpider,
            "EntitySlime": EntitySlime,
            "EntityEnderman": EntityEnderman,
            "EntityHorse": EntityHorse,
            "EntityHorseSkeleton": EntityHorseSkeleton,
            "EntityHorseZombie": EntityHorseZombie,
            "EntityDonkey": EntityDonkey,
            "EntityMule": EntityMule,
            "EntityMinecart": EntityMinecart,
            "EntityBoat": EntityBoat
        };

    }

    getPeerId(code) {
        return "wsmc-" + code.toLowerCase();
    }

    generateCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    showJoinNotification(title, interactive=false, duration=3200) {
        if(this.joinNotice){this.joinNotice.remove();this.joinNotice=null;}
        const notice=document.createElement('div');notice.style.cssText='position:fixed;left:18px;top:18px;z-index:100000;min-width:280px;max-width:390px;padding:14px 16px;background:#5a5a5f;color:#fff;border:1px solid #74747a;border-radius:9px;box-shadow:0 12px 35px #0008;font:600 14px system-ui,sans-serif;transform:translateX(-120%);opacity:0;transition:transform .28s ease,opacity .28s ease;pointer-events:none';
        const heading=document.createElement('div');heading.textContent=title;heading.style.cssText='font-weight:800;font-size:15px';notice.appendChild(heading);
        if(interactive){const sub=document.createElement('div');sub.style.cssText='margin-top:9px;color:#d5d5d8;font-size:13px';sub.append('Hold ');const key=document.createElement('span');key.textContent='E';key.style.cssText='display:inline-block;min-width:24px;padding:3px 7px;margin:0 3px;text-align:center;color:#eee;background:#707075;border:1px solid #89898e;border-radius:6px;box-shadow:inset 0 -2px 0 #555';sub.append(key,' to join');notice.appendChild(sub);}
        document.body.appendChild(notice);this.joinNotice=notice;requestAnimationFrame(()=>{notice.style.transform='translateX(0)';notice.style.opacity='1';});
        if(!interactive)setTimeout(()=>{if(this.joinNotice===notice){notice.style.transform='translateX(-120%)';notice.style.opacity='0';setTimeout(()=>{notice.remove();if(this.joinNotice===notice)this.joinNotice=null;},300);}},duration);
    }

    refreshJoinRequestNotice(){const req=this.pendingJoinRequests[0];if(req)this.showJoinNotification(`${req.username} wants to join your world`,true);else if(this.joinNotice){this.joinNotice.remove();this.joinNotice=null;}}
    consumeJoinAcceptKey(button){
        if(button!=='KeyE'||!this.isHosting)return false;
        if(this.pendingJoinRequests.length>0)this.suppressJoinKeyUntilRelease=true;
        return this.pendingJoinRequests.length>0||this.suppressJoinKeyUntilRelease;
    }
    releaseJoinAcceptKey(button){if(button==='KeyE'){this.suppressJoinKeyUntilRelease=false;this.joinHoldTicks=0;}}
    queueJoinRequest(peerId,username,conn=null,watcher=false){
        username=String(username||'Viewer').replace(/[§\u0000-\u001f]/g,'').trim().slice(0,16)||'Viewer';
        if(this.pendingJoinRequests.some(r=>r.peerId===peerId))return false;
        this.pendingJoinRequests.push({peerId,username,conn,watcher});if(this.pendingJoinRequests.length===1)this.refreshJoinRequestNotice();return true;
    }
    cancelJoinRequest(peerId){const first=this.pendingJoinRequests[0]?.peerId===peerId;this.pendingJoinRequests=this.pendingJoinRequests.filter(r=>r.peerId!==peerId);if(first){this.joinHoldTicks=0;this.refreshJoinRequestNotice();}}
    acceptPendingJoin(){
        const req=this.pendingJoinRequests.shift();if(!req)return;const conn=req.conn||this.connections.get(req.peerId);
        if(conn?.open){
            if(req.watcher){const token=crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now();this.approvedJoinTokens.set(token,Date.now()+120000);conn.send({type:'watch_join_approved',code:this.lanCode,token});}
            else{conn.send({type:'join_approved'});conn._sendWorldInfo?.();}
        }
        this.suppressJoinKeyUntilRelease=true;this.joinHoldTicks=0;this.refreshJoinRequestNotice();
    }

    async host(world) {
        if (this.connected) {
            if (this.isHosting) return this.lanCode;
            throw new Error("A joined player cannot host the current LAN world.");
        }

        this.lanCode = this.generateCode();
        const peerId = this.getPeerId(this.lanCode);
        console.log("Hosting LAN Game via PeerJS. Code: " + this.lanCode);
        
        if (this.room) {
            try {
                await this.room.initialize();
                this.room.subscribeRoomState(() => {
                    // Host is source of truth, doesn't need to sync from room state.
                });
            } catch (error) {
                console.warn("Room-state mirror unavailable; continuing with direct P2P.", error);
                this.room = null;
            }
        }

        return new Promise((resolve, reject) => {
            this.peer = new Peer(peerId);
            
            this.peer.on('open', (id) => {
                this.connected = true;
                this.isHosting = true;
                this.minecraft.broadcastMedia?.attachPeer(this.peer);
                this.minecraft.addMessageToChat("§eLAN Game hosted. Code: " + this.lanCode);
                
                // Clear any stale mob data from the optional persistence mirror.
                if (this.room) this.room.updateRoomState({ mobs: {} });

                resolve(this.lanCode);
            });

            this.peer.on('connection', (conn) => {
                if (this.banList.has(conn.peer)) {
                    console.log("Blocking connection from banned peer: " + conn.peer);
                    conn.close();
                    return;
                }
                this.setupConnection(conn);
                const sendWorldInfo = () => {
                    if (!conn.open) return;
                    conn.send({
                        type: "world_info",
                        seed: world.getSeed().toString(),
                        worldType: world.worldType,
                        superflatLayers: world.superflatLayers,
                        gameType: world._gameType || 'normal',
                        gameMode: world.gameMode || 0,
                        gameRules: world.gameRules,
                        spawnBiome: world.spawnBiome,
                        // The host owns the world's spawn. A joining client
                        // must use these coordinates instead of independently
                        // searching its generated copy of the world.
                        spawn: world.spawn ? [
                            world.spawn.x,
                            world.spawn.y,
                            world.spawn.z
                        ] : null
                    });
                    this.sendCameraSnapshot(conn);
                };
                // Gameplay world data is sent only after the host accepts the
                // join request. Watch/Browse peers never need world data.
                conn._sendWorldInfo = sendWorldInfo;
            });

            this.peer.on('error', (err) => {
                console.error("PeerJS Error:", err);
                if (err.type === 'unavailable-id') {
                    // Release the failed Peer instance before choosing a new code.
                    // Retrying with the same Peer object can leave the host flow
                    // permanently stuck in PeerJS's unavailable-id state.
                    if (this.peer) this.peer.destroy();
                    this.peer = null;
                    this.connected = false;
                    this.lanCode = null;
                    this.host(world).then(resolve).catch(reject);
                } else {
                    this.connected = false;
                    reject(err);
                }
            });
        });
    }

    async join(code) {
        if (!code) return;
        this.disconnect();
        
        this.lanCode = code.toUpperCase();
        const peerId = this.getPeerId(this.lanCode);
        console.log("Joining LAN Game via PeerJS: " + this.lanCode);
        
        if (this.room) {
            try {
                await this.room.initialize();
                this.room.subscribeRoomState((state) => {
                    if (state.mobs && !this.isHosting && this.minecraft.world) {
                        this.handleRoomMobSync(state.mobs);
                    }
                });
            } catch (error) {
                console.warn("Room-state mirror unavailable; continuing with direct P2P.", error);
                this.room = null;
            }
        }

        return new Promise((resolve, reject) => {
            let settled = false;
            const fail = (error) => {
                if (settled) return;
                settled = true;
                this.connected = false;
                if (this.peer) {
                    this.peer.destroy();
                    this.peer = null;
                }
                this.hostConn = null;
                this.pendingJoinResolve=null;this.pendingJoinUsername=null;
                reject(error);
            };

            this.peer = new Peer();
            
            this.peer.on('open', (id) => {
                const conn = this.peer.connect(peerId);
                this.setupConnection(conn);
                this.hostConn = conn;
                this.isHosting = false;
                
                conn.on('open', () => {
                    if (settled) return;
                    let username = this.minecraft.settings.username || "Player";
                    if (window.websim && window.websim.user && window.websim.user.username && username === "Player") {
                        username = window.websim.user.username;
                    }

                    const approvalToken=new URLSearchParams(location.search).get('approval');
                    conn.send({type:"join_request",username,approvalToken});
                    this.showJoinNotification("Requested to Join");
                    this.pendingJoinResolve=()=>{if(settled)return;settled=true;this.connected=true;resolve();};
                    this.pendingJoinUsername=username;
                });
                conn.on('error', fail);
            });

            this.peer.on('error', (err) => {
                console.error("Join PeerJS Error:", err);
                this.minecraft.addMessageToChat("§cCould not find LAN game with code: " + this.lanCode);
                fail(err);
            });

            // Do not leave the join screen waiting forever when a code is stale
            // or the PeerJS signaling service cannot reach the host.
            setTimeout(() => {
                if (!settled) fail(new Error("LAN connection timed out"));
            }, 30000);
        });
    }

    setupConnection(conn) {
        if (this.isHosting) {
            this.connections.set(conn.peer, conn);
        }

        conn.on('data', (data) => {
            this.handleIncomingData(data, conn.peer);
        });

        conn.on('close', () => {
            if (this.isHosting) {
                this.connections.delete(conn.peer);
                const before=this.pendingJoinRequests.length;this.pendingJoinRequests=this.pendingJoinRequests.filter(r=>r.peerId!==conn.peer);if(before!==this.pendingJoinRequests.length){this.joinHoldTicks=0;this.refreshJoinRequestNotice();}
                // Remove player from presence
                delete this.presence[conn.peer];
                this.handlePresenceUpdate(this.presence);
                this.broadcast({ type: "player_left", clientId: conn.peer });
            } else {
                this.minecraft.addMessageToChat("§cDisconnected from host.");
                this.disconnect();
                this.minecraft.loadWorld(null);
            }
        });
    }

    handleIncomingData(data, fromPeerId) {
        if(data?.type==='watch_join_request'&&this.isHosting){
            const conn=this.minecraft.broadcastMedia?.viewerDataConnections?.get(fromPeerId);
            const queued=!!conn&&this.queueJoinRequest(fromPeerId,data.username,conn,true);
            try{conn?.send({type:'watch_chat_status',ok:queued,message:queued?'Requested to Join':'Your join request is already pending.'});}catch(_){}
            return;
        }
        if(data?.type === "watch_chat" && this.isHosting){
            this.minecraft.broadcastMedia?.handleViewerChat(fromPeerId,data.message);
            return;
        }
        if ((data?.type === "watch_request" || data?.type === "browse_probe") && this.isHosting) {
            const conn=this.connections.get(fromPeerId);
            if(conn){
                this.connections.delete(fromPeerId);
                if(data.type === "watch_request")this.minecraft.broadcastMedia?.handleWatchRequest(conn);
                else this.minecraft.broadcastMedia?.handleBrowseProbe(conn);
            }
            return;
        }
        if(data?.type==='join_request'&&this.isHosting){
            const token=String(data.approvalToken||''),expiry=this.approvedJoinTokens.get(token);
            if(token&&expiry>Date.now()){this.approvedJoinTokens.delete(token);const conn=this.connections.get(fromPeerId);if(conn?.open){conn.send({type:'join_approved'});conn._sendWorldInfo?.();}return;}
            this.queueJoinRequest(fromPeerId,data.username);
            return;
        }
        if(data?.type==='join_approved'&&!this.isHosting){
            const username=this.pendingJoinUsername||this.minecraft.settings.username||'Player';this.hostConn?.send({type:'client_join',username});this.pendingJoinResolve?.();this.pendingJoinResolve=null;return;
        }
        // Relay messages if host
        if (this.isHosting) {
            // Permission checks for clients
            const perms = this.getPlayerPermissions(fromPeerId);
            if ((data.type === "block_update" || data.type === "block_batch") && !perms.canBuild) return;
            
            const isCommandMessage = data.type === "command" ||
                (data.type === "chat" && data.message && data.message.startsWith("/"));
            if (isCommandMessage) {
                if (!perms.canCommand) {
                    const conn = this.connections.get(fromPeerId);
                    if (conn) conn.send({ type: "chat", message: "§cYou do not have permission to use commands." });
                    return;
                }

                const commandText = data.type === "command"
                    ? String(data.command || "")
                    : String(data.message || "").substring(1);

                // Commands that operate on the issuing player's inventory or
                // position must run on that player's client. The host does
                // not hold a full inventory for RemotePlayerEntity.
                const commandName = commandText.trim().split(/\s+/)[0].toLowerCase();
                const clientOwnedCommands = new Set([
                    "gamemode", "give", "clear", "tp", "teleport", "set", "enchant",
                    "item", "effect", "health", "title", "attribute", "setattribute",
                    "me", "help", "seed"
                ]);
                const conn = this.connections.get(fromPeerId);
                if (conn && clientOwnedCommands.has(commandName)) {
                    conn.send({ type: "client_command", command: commandText });
                    return;
                }

                // Host executes command
                const result = this.minecraft.commandHandler.handleMessage(commandText, true);
                if (conn && result) {
                    conn.send({ type: "chat", message: result });
                }
            }

            // Relay position, chat, presence, and block batches
            // Commands are handled by the host and must not be echoed as chat.
            if (data.type === "pos" || (data.type === "chat" && !isCommandMessage) ||
                data.type === "presence" || data.type === "block_batch" || data.type === "player_damage" ||
                data.type === "camera_create" || data.type === "camera_update" || data.type === "camera_remove" || data.type === "broadcast_state") {
                // Use shallow copy to ensure we're broadcasting a clean data object 
                // and not any non-serializable internal PeerJS properties.
                this.broadcast({ ...data }, fromPeerId);
            }

            // Do not let a legacy slash-command chat packet fall through to
            // the normal incoming-chat handler below.
            if (isCommandMessage) return;
        }

        if (data.type === "world_info" && !this.isHosting) {
            const world = new World(this.minecraft, data.seed, "mp_" + this.lanCode, data.gameMode || 0);
            world.worldType = data.worldType !== undefined ? data.worldType : 0;
            if (Array.isArray(data.superflatLayers) && data.superflatLayers.length > 0) {
                world.superflatLayers = data.superflatLayers;
            }
            if (data.gameRules) {
                Object.assign(world.gameRules, data.gameRules);
            }
            if (data.spawnBiome) world.spawnBiome = data.spawnBiome;
            if (Array.isArray(data.spawn) && data.spawn.length >= 3 &&
                data.spawn.every(value => Number.isFinite(Number(value)))) {
                world.spawn.x = Number(data.spawn[0]);
                world.spawn.y = Number(data.spawn[1]);
                world.spawn.z = Number(data.spawn[2]);
                world.spawnIsSet = true;
            }
            world._gameType = data.gameType;
            // World chooses its generator in the constructor, so refresh it
            // after applying the host's world type and game type before chunks
            // are generated.
            world.setSeed(data.seed);
            world.name = "LAN: " + this.lanCode;
            this.minecraft.loadWorld(world);
        } else if (data.type === "pos") {
            this.handlePositionUpdate({ ...data, clientId: fromPeerId });
        } else if (data.type === "presence") {
            this.presence[fromPeerId] = data.presence;
            this.handlePresenceUpdate(this.presence);
        } else if (data.type === "player_left") {
            delete this.presence[data.clientId];
            this.handlePresenceUpdate(this.presence);
        } else if (data.type === "camera_create") {
            this.minecraft.cameraManager?.createCamera(data.camera, false);
        } else if (data.type === "camera_update") {
            this.minecraft.cameraManager?.updateCamera(data.camera.id, data.camera, false);
        } else if (data.type === "camera_remove") {
            this.minecraft.cameraManager?.removeCamera(data.camera.id, false);
        } else if (data.type === "camera_snapshot") {
            this.minecraft.cameraManager?.load(data.cameras || []);
        } else if (data.type === "broadcast_state") {
            const rp=this.remotePlayers.get(fromPeerId); if(rp) rp.broadcasting=!!data.state?.active && String(data.state?.sourceId||"").startsWith("player:");
            if (data.state && this.minecraft.cameraManager) {
                this.minecraft.cameraManager.session.active=!!data.state.active;
                if(data.state.sourceId)this.minecraft.cameraManager.session.sourceId=data.state.sourceId;
            }
        } else if (data.type === "block_update") {
            this.handleBlockUpdate(data, fromPeerId);
        } else if (data.type === "block_batch") {
            this.handleBlockBatch(data, fromPeerId);
        } else if (data.type === "chat") {
            this.minecraft.addMessageToChat(data.message);
        } else if (data.type === "mob_spawn") {
            this.handleMobSpawn(data);
        } else if (data.type === "mob_update") {
            this.handleMobUpdate(data);
        } else if (data.type === "mob_remove") {
            this.handleMobRemove(data);
        } else if (data.type === "client_join" && this.isHosting) {
            // Check if user is banned by username
            if (this.banList.has(data.username)) {
                const conn = this.connections.get(fromPeerId);
                if (conn) {
                    conn.send({ type: "chat", message: "§cYou are banned from this server." });
                    setTimeout(() => conn.close(), 100);
                }
                return;
            }
            this.handleClientJoin({ username: data.username, clientId: fromPeerId });
        } else if (data.type === "client_save" && this.isHosting) {
            this.handleClientSave(data);
        } else if (data.type === "client_load" && !this.isHosting) {
            this.handleClientLoad(data);
        } else if (data.type === "client_command" && !this.isHosting) {
            this.runClientCommand(data.command);
        } else if (data.type === "set_gamemode" && !this.isHosting) {
            this.runClientCommand("gamemode " + data.mode);
        } else if (data.type === "cameraman_recall" && !this.isHosting) {
            const p=this.minecraft.player;
            if(p?.isCameraman&&data.pos){p.setPosition(data.pos.x,data.pos.y,data.pos.z);p.motionX=p.motionY=p.motionZ=0;if(Number.isFinite(data.pos.yaw))p.rotationYaw=data.pos.yaw;}
        } else if (data.type === "set_permissions" && !this.isHosting) {
            // Locally enforce permissions (visual/logic feedback)
            this._localPermissions = data.perms;
            if (this.minecraft.player) {
                this.minecraft.player.capabilities.allowFlying = data.perms.canFly;
                if (!data.perms.canFly && this.minecraft.player.flying) {
                    this.minecraft.player.flying = false;
                }
            }
        } else if (data.type === "tile_entity_sync") {
            if (this.minecraft.world) {
                this.minecraft.world.setTileEntity(data.x, data.y, data.z, data.data);
                if (this.minecraft.worldRenderer) this.minecraft.worldRenderer.flushRebuild = true;
            }
            if (this.isHosting) {
                this.broadcast(data, fromPeerId);
            }
        } else if (data.type === "time" && !this.isHosting) {
            if (this.minecraft.world) {
                let diff = Math.abs(this.minecraft.world.time - data.time);
                if (diff > 20) this.minecraft.world.time = data.time;
            }
        } else if (data.type === "items_sync" && !this.isHosting) {
            this.handleItemsSync(data.items);
        } else if (data.type === "particle_burst") {
            this.handleRemoteParticle(data);
        } else if (data.type === "jukebox_play") {
            this.handleJukeboxPlay(data);
        } else if (data.type === "jukebox_stop") {
            this.handleJukeboxStop(data);
        } else if (data.type === "mob_aggro") {
            this.handleMobAggro(data);
        } else if (data.type === "swing_arm") {
            const remotePlayer = this.remotePlayers.get(fromPeerId);
            if (remotePlayer) remotePlayer.swingArm(data.hand);
        } else if (data.type === "break_progress") {
            const remotePlayer = this.remotePlayers.get(fromPeerId);
            if (remotePlayer) {
                remotePlayer.currentBreakingPos = data.pos;
                remotePlayer.breakingProgress = data.progress;
            }

        }
    }

    handleRemoteParticle(data) {
        if (!this.minecraft.particleManager || !this.minecraft.world) return;
        this.minecraft.particleManager.isRemoteParticle = true;
        if (data.pType === "block_break") {
            const block = Block.getById(data.blockId);
            this.minecraft.particleManager.spawnBlockBreakParticles(this.minecraft.world, data.x, data.y, data.z, block);
        }
        this.minecraft.particleManager.isRemoteParticle = false;
    }

    handleJukeboxPlay(data) {
        const world = this.minecraft.world;
        if (!world) return;
        const block = Block.getById(world.getBlockAt(data.x, data.y, data.z));
        if (block && block.constructor.name === "BlockJukebox") {
            let te = world.getTileEntity(data.x, data.y, data.z);
            if (!te) {
                te = { recordId: 0, playingSound: null };
                world.setTileEntity(data.x, data.y, data.z, te);
            }
            block.insertRecord(world, data.x, data.y, data.z, te, data.recordId, null);
        }
    }

    handleJukeboxStop(data) {
        const world = this.minecraft.world;
        if (!world) return;
        const block = Block.getById(world.getBlockAt(data.x, data.y, data.z));
        if (block && block.constructor.name === "BlockJukebox") {
            let te = world.getTileEntity(data.x, data.y, data.z);
            if (te) block.ejectRecord(world, data.x, data.y, data.z, te);
        }
    }

    handleMobAggro(data) {
        if (!this.minecraft.world) return;
        const entity = this.minecraft.world.getEntityById(data.id);
        if (entity) {
            entity.isAggressive = data.aggro;
            if (data.isScreaming !== undefined) entity.isScreaming = data.isScreaming;
        }
    }

    syncMobsToRoomState() {
        if (!this.minecraft.world || !this.room) return;
        
        const mobData = {};
        for (const entity of this.minecraft.world.entities) {
            const isPlayer = entity instanceof RemotePlayerEntity || entity === this.minecraft.player;
            if (!isPlayer) {
                mobData[entity.id] = {
                    c: entity.constructor.name,
                    x: entity.x,
                    y: entity.y,
                    z: entity.z,
                    h: entity.health,
                    cn: entity.customName,
                    sc: entity.attributeScale
                };
            }
        }
        
        this.room.updateRoomState({ mobs: mobData });
    }

    handleRoomMobSync(mobData) {
        const world = this.minecraft.world;
        const currentMobIds = Object.keys(mobData).map(Number);
        
        // Remove entities not in server state
        for (let i = world.entities.length - 1; i >= 0; i--) {
            const entity = world.entities[i];
            const isPlayer = entity instanceof RemotePlayerEntity || entity === this.minecraft.player;
            if (!isPlayer && !currentMobIds.includes(entity.id)) {
                world.removeEntityById(entity.id);
            }
        }

        // Spawn missing entities
        for (const idStr in mobData) {
            const id = parseInt(idStr);
            const data = mobData[idStr];
            if (!world.getEntityById(id)) {
                const ClassRef = this.mobClassMap[data.c];
                if (ClassRef) {
                    const entity = new ClassRef(this.minecraft, world);
                    entity.id = id;
                    entity.setPosition(data.x, data.y, data.z);
                    entity.health = data.h;
                    entity.customName = data.cn;
                    entity.attributeScale = data.sc;
                    entity.isRemote = true;
                    world.addEntity(entity);
                }
            }
        }
    }



    recallCameraman(peerId,pos){
        if(!this.isHosting)return;const conn=this.connections.get(peerId);if(conn?.open)conn.send({type:"cameraman_recall",pos});
    }

    sendCameraMessage(type, camera) {
        if (!this.connected) return;
        const payload = type === "broadcast_state" ? {type, state: camera} : {type, camera};
        this.broadcast(payload);
    }

    sendCameraSnapshot(conn) {
        if (conn?.open && this.minecraft.cameraManager) conn.send({type:"camera_snapshot", cameras:this.minecraft.cameraManager.serialize()});
    }

    broadcast(data, excludePeerId = null) {
        if (!this.isHosting) {
            if (this.hostConn) this.hostConn.send(data);
            return;
        }
        for (let [id, conn] of this.connections) {
            if (id !== excludePeerId) {
                conn.send(data);
            }
        }
    }

    disconnect() {
        if (this.isHosting) this.minecraft.broadcastMedia?.stop("broadcaster_disconnected");
        if (this.connected && !this.isHosting) {
            this.saveClientData();
        }
        
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        this.connected = false;
        this.isHosting = false;
        this.connections.clear();
        this.hostConn = null;
        this.presence = {};
        this.permissions.clear();
        this.playerGameModes.clear();
        this.blockUpdateBuffer = [];
        this.pendingJoinRequests=[];this.joinHoldTicks=0;this.suppressJoinKeyUntilRelease=false;this.approvedJoinTokens.clear();this.pendingJoinResolve=null;this.pendingJoinUsername=null;if(this.joinNotice){this.joinNotice.remove();this.joinNotice=null;}

        this.remotePlayers.forEach(entity => {
            if (this.minecraft.world) this.minecraft.world.removeEntityById(entity.id);
        });
        this.remotePlayers.clear();
    }

    onTick() {
        if (!this.connected || !this.minecraft.player) return;

        const now = Date.now();
        const p = this.minecraft.player;

        const joinKeyDown=Keyboard.isKeyDown('KeyE');
        if(this.isHosting&&this.pendingJoinRequests.length){if(joinKeyDown){this.joinHoldTicks++;if(this.joinHoldTicks>=20)this.acceptPendingJoin();}else this.joinHoldTicks=0;}

        // Persistent Server Sync for Mobs (Every 3 seconds)
        if (this.isHosting && this.minecraft.frames % 60 === 0) {
            this.syncMobsToRoomState();
        }

        // Position sync with movement threshold to reduce spam
        if (now - this.lastPosUpdate > 50) {
            const distSq = (p.x - this.lastSentX)**2 + (p.y - this.lastSentY)**2 + (p.z - this.lastSentZ)**2;
            const yawDiff = Math.abs(p.rotationYaw - this.lastSentYaw);

            if (distSq > 0.0001 || yawDiff > 0.1) {
                const posData = {
                    type: "pos",
                    x: p.x, y: p.y, z: p.z,
                    yaw: p.rotationYaw, pitch: p.rotationPitch,
                    sneaking: p.sneaking,
                    isCameraman: !!p.isCameraman, cameraMode: p.cameraMode || "operator",
                    roll: p.cameraRoll || 0, fov: p.cameraFov || this.minecraft.settings.fov, broadcasting: !!p.broadcasting
                };
                this.broadcast(posData);
                this.lastPosUpdate = now;
                this.lastSentX = p.x; this.lastSentY = p.y; this.lastSentZ = p.z;
                this.lastSentYaw = p.rotationYaw;
            }
        }
        
        // Flush block update batch
        if (this.blockUpdateBuffer.length > 0) {
            this.broadcast({ type: "block_batch", b: this.blockUpdateBuffer });
            this.blockUpdateBuffer = [];
        }
        
        if (now - this.lastPresenceUpdate > 2000) {
            this.updateMyPresence();
            this.lastPresenceUpdate = now;
        }

        if (this.isHosting) {
            if (now - this.timeSyncTimer > 1000) {
                this.broadcast({ type: "time", time: this.minecraft.world.time });
                this.timeSyncTimer = now;
            }
            if (now - this.mobUpdateTimer > 66) {
                this.syncMobs();
                this.mobUpdateTimer = now;
            }
        }
    }

    syncMobs() {
        if (!this.minecraft.world) return;
        
        // Sync standard entities
        for (let entity of this.minecraft.world.entities) {
            if (!(entity instanceof RemotePlayerEntity) && entity !== this.minecraft.player) {
                this.broadcast({
                    type: "mob_update",
                    id: entity.id,
                    class: entity.constructor.name,
                    x: entity.x, y: entity.y, z: entity.z,
                    yaw: entity.rotationYaw, pitch: entity.rotationPitch,
                    health: entity.health,
                    swinging: entity.isSwingInProgress,
                    hand: entity.swingingHand,
                    aggro: entity.isAggressive,
                    screaming: entity.isScreaming
                });
            }
        }

        // Sync dropped items
        const itemStates = this.minecraft.world.droppedItems.map(item => ({
            sId: item.serverID,
            id: item.blockId,
            x: item.x, y: item.y, z: item.z,
            count: item.count
        }));
        this.broadcast({ type: "items_sync", items: itemStates });
    }

    handleItemsSync(items) {
        if (!this.minecraft.world) return;
        const world = this.minecraft.world;
        
        const currentItemIds = new Set(items.map(it => it.sId));

        // 1. Remove items no longer in world
        for (let i = world.droppedItems.length - 1; i >= 0; i--) {
            const item = world.droppedItems[i];
            // If item has a serverID and is not in the sync list, it was picked up/despawned
            if (item.serverID && !currentItemIds.has(item.serverID)) {
                world.group.remove(item.mesh);
                if (typeof item.kill === "function") item.kill();
                world.droppedItems.splice(i, 1);
                this.remoteItems.delete(item.serverID);
            }
        }

        // 2. Update or create items
        for (const data of items) {
            let item = this.remoteItems.get(data.sId);
            
            // Try matching local items by proximity to avoid flicker on block breaks
            if (!item) {
                item = world.droppedItems.find(it => !it.serverID_synced && it.blockId === data.id && Math.abs(it.x - data.x) < 1.5 && Math.abs(it.z - data.z) < 1.5);
                if (item) {
                    item.serverID = data.sId;
                    item.serverID_synced = true;
                    this.remoteItems.set(data.sId, item);
                }
            }

            if (item) {
                // Update position (host is source of truth)
                item.x = data.x;
                item.y = data.y;
                item.z = data.z;
                item.count = data.count;
                item.remote = true; // Adopt remote behavior
                if (item.mesh) item.mesh.position.set(item.x, item.y, item.z);
            } else {
                // Check if this item already exists in world but not in remote map
                item = world.droppedItems.find(it => it.serverID === data.sId);
                if (item) {
                    this.remoteItems.set(data.sId, item);
                    return;
                }

                // Create new networked item
                item = new DroppedItem(world, data.x, data.y, data.z, data.id, data.count);
                item.serverID = data.sId;
                item.serverID_synced = true;
                item.remote = true; 
                this.remoteItems.set(data.sId, item);
                world.droppedItems.push(item);
            }
        }
    }

    broadcastMobSpawn(entity) {
        if (!this.isHosting) return;
        this.broadcast({
            type: "mob_spawn",
            id: entity.id,
            class: entity.constructor.name,
            x: entity.x, y: entity.y, z: entity.z
        });
    }

    broadcastMobRemove(id) {
        if (!this.isHosting) return;
        this.broadcast({ type: "mob_remove", id: id });
    }

    onBlockChanged(x, y, z, typeId, meta = 0) {
        if (!this.connected) return;
        // Batch updates to prevent network flood and thread freezing
        this.blockUpdateBuffer.push({ x, y, z, id: typeId, m: meta });
    }

    handleBlockUpdate(data, fromPeerId) {
        if (!this.minecraft.world) return;

        // If host receives a block update where ID is air (0), treat it as a block break
        // to trigger drop logic and particles on the server side.
        if (this.isHosting && (data.id === 0 || data.typeId === 0)) {
            this.minecraft.breakBlock(data.x, data.y, data.z, null, true);
            // Broadcast the authoritative post-break state. In One Block
            // mode this is the regenerated block, not the stale air request.
            const world = this.minecraft.world;
            this.broadcast({
                ...data,
                id: world.getBlockAt(data.x, data.y, data.z),
                m: world.getBlockDataAt(data.x, data.y, data.z)
            }, fromPeerId);
            return;
        }

        this.isProcessingRemoteUpdate = true;
        const id = data.id !== undefined ? data.id : data.typeId;
        const meta = data.m !== undefined ? data.m : data.meta;
        this.minecraft.world.setBlockAt(data.x, data.y, data.z, id, meta, false);
        this.isProcessingRemoteUpdate = false;
        if (this.minecraft.worldRenderer) this.minecraft.worldRenderer.flushRebuild = true;
    }

    handleBlockBatch(data, fromPeerId) {
        if (!this.minecraft.world || !data.b) return;

        // On host, we check if blocks are being broken to trigger collective sync
        if (this.isHosting) {
            const syncedBlocks = [];
            for (const b of data.b) {
                if (b.id === 0) {
                    this.minecraft.breakBlock(b.x, b.y, b.z, null, true);
                } else {
                    this.minecraft.world.setBlockAt(b.x, b.y, b.z, b.id, b.m);
                }
                syncedBlocks.push({
                    ...b,
                    id: this.minecraft.world.getBlockAt(b.x, b.y, b.z),
                    m: this.minecraft.world.getBlockDataAt(b.x, b.y, b.z)
                });
            }
            // Re-broadcast authoritative states, including regenerated
            // One Block replacements.
            this.broadcast({...data, b: syncedBlocks}, fromPeerId);
            return;
        }

        const world = this.minecraft.world;
        
        this.isProcessingRemoteUpdate = true;
        const affectedSections = new Set();

        for (const b of data.b) {
            // Apply blocks silently to collect modified sections for a single batch rebuild
            world.setBlockAt(b.x, b.y, b.z, b.id, b.m, true);
            
            // Still trigger neighbor updates for logic (water, redstone, etc)
            world.notifyNeighborsOfStateChange(b.x, b.y, b.z, b.id);
            
            // Mark surrounding sections for rebuild
            for (let ox = -1; ox <= 1; ox++) {
                for (let oy = -1; oy <= 1; oy++) {
                    for (let oz = -1; oz <= 1; oz++) {
                        const sx = (b.x + ox) >> 4;
                        const sy = (b.y + oy) >> 4;
                        const sz = (b.z + oz) >> 4;
                        if (sy >= 0 && sy < 16) {
                            affectedSections.add(`${sx},${sy},${sz}`);
                        }
                    }
                }
            }
        }

        // Apply visual updates once for all modified sections
        for (const sectionKey of affectedSections) {
            const [sx, sy, sz] = sectionKey.split(',').map(Number);
            if (world.chunkExists(sx, sz)) {
                world.getChunkSectionAt(sx, sy, sz).isModified = true;
            }
        }

        this.isProcessingRemoteUpdate = false;
        if (this.minecraft.worldRenderer) this.minecraft.worldRenderer.flushRebuild = true;
    }

    updateMyPresence() {
        const p = this.minecraft.player;
        const presence = {
            skin: this.minecraft.settings.skin,
            attributeScale: p.attributeScale,
            username: this.minecraft.settings.username || "Player",
            isCameraman: !!p.isCameraman, cameraMode: p.cameraMode || "operator",
            roll: p.cameraRoll || 0, fov: p.cameraFov || this.minecraft.settings.fov, broadcasting: !!p.broadcasting
        };
        this.broadcast({ type: "presence", presence });
    }

    handlePresenceUpdate(allPresence) {
        const activePeerIds = Object.keys(allPresence);
        const myPeerId = this.peer ? this.peer.id : null;

        for (const peerId of activePeerIds) {
            if (peerId === myPeerId) continue;
            const data = allPresence[peerId];
            let remotePlayer = this.remotePlayers.get(peerId);
            if (!remotePlayer) {
                remotePlayer = new RemotePlayerEntity(this.minecraft, this.minecraft.world, data.skin);
                remotePlayer.id = peerId;
                remotePlayer.username = data.username || "Guest";
                this.minecraft.world.addEntity(remotePlayer);
                this.remotePlayers.set(peerId, remotePlayer);
                this.minecraft.addMessageToChat("§e" + remotePlayer.username + " joined");
            }
            remotePlayer.skin = data.skin;
            remotePlayer.isCameraman = !!data.isCameraman; remotePlayer.cameraMode = data.cameraMode || "operator";
            remotePlayer.cameraRoll = data.roll || 0; remotePlayer.cameraFov = data.fov || 70; remotePlayer.broadcasting = !!data.broadcasting;
        }

        for (const [peerId, entity] of this.remotePlayers) {
            if (!allPresence[peerId]) {
                this.minecraft.world.removeEntityById(entity.id);
                this.remotePlayers.delete(peerId);
                this.minecraft.addMessageToChat("§e" + (entity.username || "Guest") + " left");
            }
        }
    }

    handlePositionUpdate(data) {
        const remotePlayer = this.remotePlayers.get(data.clientId);
        if (remotePlayer) remotePlayer.updateFromPresence(data);
    }

    sendChat(message) {
        if (!this.connected || !this.minecraft.player) return;
        const username = this.minecraft.player.username || "Player";
        this.broadcast({ type: "chat", message: `<${username}> ${message}` });
    }

    sendCommand(command) {
        if (!this.connected || !this.minecraft.player) return;

        const commandText = String(command || "").trim().replace(/^\/+/, "");
        if (!commandText) return;

        // The host is already authoritative locally. Joined clients send the
        // command over the existing P2P data connection for host execution.
        if (this.isHosting) {
            this.minecraft.commandHandler.handleMessage(commandText);
            return;
        }

        this.broadcast({
            type: "command",
            command: commandText
        });
    }

    runClientCommand(command) {
        if (!this.minecraft.player || !this.minecraft.commandHandler) return "";

        const world = this.minecraft.world;
        const previousCheats = world && world.gameRules
            ? world.gameRules.cheatsEnabled
            : false;

        // The host has already checked the client's command permission. Apply
        // the approved command locally without requiring local cheats, while
        // restoring the client's visible rule afterward.
        if (world && world.gameRules) world.gameRules.cheatsEnabled = true;
        try {
            return this.minecraft.commandHandler.handleMessage(command);
        } finally {
            if (world && world.gameRules) {
                world.gameRules.cheatsEnabled = previousCheats;
            }
        }
    }

    saveClientData() {
        if (!this.connected || this.isHosting || !this.minecraft.player) return;
        const p = this.minecraft.player;
        this.broadcast({
            type: "client_save",
            username: p.username || "Player",
            inventory: p.inventory.items.map(i => ({id: i.id, count: i.count, damage: i.damage})),
            armor: p.inventory.armor.map(i => ({id: i.id, count: i.count, damage: i.damage})),
            pos: {x: p.x, y: p.y, z: p.z, yaw: p.rotationYaw, pitch: p.rotationPitch},
            gameMode: p.gameMode
        });
    }

    handleMobSpawn(data) {
        if (this.isHosting || !this.minecraft.world) return;
        if (this.minecraft.world.getEntityById(data.id)) return;
        const ClassRef = this.mobClassMap[data.class];
        if (ClassRef) {
            const entity = new ClassRef(this.minecraft, this.minecraft.world);
            entity.id = data.id;
            entity.setPosition(data.x, data.y, data.z);
            entity.isRemote = true;
            this.minecraft.world.addEntity(entity);
        }
    }

    handleMobUpdate(data) {
        if (this.isHosting || !this.minecraft.world) return;
        let entity = this.minecraft.world.getEntityById(data.id);
        
        // If entity doesn't exist on client but host sent update, spawn it
        if (!entity && data.class) {
            const ClassRef = this.mobClassMap[data.class];
            if (ClassRef) {
                entity = new ClassRef(this.minecraft, this.minecraft.world);
                entity.id = data.id;
                entity.setPosition(data.x, data.y, data.z);
                entity.isRemote = true;
                this.minecraft.world.addEntity(entity);
            }
        }

        if (entity) {
            entity.targetX = data.x; entity.targetY = data.y; entity.targetZ = data.z;
            entity.targetYaw = data.yaw; entity.targetPitch = data.pitch;
            entity.health = data.health;
            entity.isAggressive = data.aggro;
            entity.isScreaming = data.screaming;
            
            if (data.swinging && !entity.isSwingInProgress) {
                entity.swingArm(data.hand || 'main');
            }

            // For smoother rotation
            entity.targetYawHead = data.yaw;
        }
    }

    handleMobRemove(data) {
        if (this.isHosting || !this.minecraft.world) return;
        this.minecraft.world.removeEntityById(data.id);
    }

    handleClientJoin(data) {
        const savedData = this.minecraft.world.playerData[data.username];
        if (savedData) {
            const conn = this.connections.get(data.clientId);
            if (conn) conn.send({ type: "client_load", targetUser: data.username, data: savedData });
        }
    }

    handleClientSave(data) {
        this.minecraft.world.playerData[data.username] = {
            inventory: data.inventory, armor: data.armor,
            pos: data.pos, gameMode: data.gameMode
        };
    }

    handleClientLoad(data) {
        if (!this.minecraft.player || data.targetUser !== this.minecraft.player.username) return;
        const p = this.minecraft.player;
        const d = data.data;
        if (d.pos) p.setPosition(d.pos.x, d.pos.y, d.pos.z);
        if (d.inventory) d.inventory.forEach((item, i) => { if(i < p.inventory.items.length) p.inventory.items[i] = item; });
        this.minecraft.addMessageToChat("§eRestored player data from host.");
    }

    getPlayerPermissions(clientId) {
        if (!this.permissions.has(clientId)) {
            this.permissions.set(clientId, { canBuild: true, canCommand: true, canFly: false });
        }
        return this.permissions.get(clientId);
    }

    setPermission(clientId, key, value) {
        if (!this.isHosting) return;
        const perms = this.getPlayerPermissions(clientId);
        perms[key] = value;
        const conn = this.connections.get(clientId);
        if (conn) conn.send({ type: "set_permissions", perms });
    }

    getPlayerGameMode(clientId) {
        return this.playerGameModes.get(clientId) || 0;
    }

    setPlayerGameMode(clientId, mode) {
        if (!this.isHosting) return;
        this.playerGameModes.set(clientId, mode);
        const conn = this.connections.get(clientId);
        if (conn) conn.send({ type: "set_gamemode", mode });
    }

    kick(clientId) {
        if (!this.isHosting) return;
        const conn = this.connections.get(clientId);
        if (conn) {
            conn.send({ type: "chat", message: "§cYou have been kicked from the game." });
            setTimeout(() => conn.close(), 100);
        }
    }

    ban(clientId) {
        if (!this.isHosting) return;
        
        // Ban by username if possible for better persistence
        const presence = this.presence[clientId];
        if (presence && presence.username) {
            this.banList.add(presence.username);
            this.minecraft.addMessageToChat(`§eBanned player: ${presence.username}`);
        } else {
            this.banList.add(clientId);
        }
        
        this.kick(clientId);
    }

    onTileEntityChanged(x, y, z, data) {
        this.broadcast({
            type: "tile_entity_sync",
            x, y, z, data
        });
    }
}
 
