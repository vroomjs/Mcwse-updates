export default class BroadcastMedia {
    constructor(minecraft) {
        this.minecraft = minecraft;
        this.stream = null;
        this.metadata = null;
        this.viewers = new Map();
        this.viewerDataConnections = new Map();
        this.viewerChatTimes = new Map();
        this.boundPeer = null;
        this.lastError = null;
        this.discoveryHeartbeat = 0;
    }

    isHostReady() {
        const mp = this.minecraft.multiplayer;
        return !!(mp?.connected && mp.isHosting && mp.peer?.open);
    }

    attachPeer(peer) {
        if (!peer || this.boundPeer === peer) return;
        this.boundPeer = peer;
        peer.on('call', call => this.handleIncomingCall(call));
        peer.on('close', () => this.stop('broadcaster_disconnected'));
        peer.on('disconnected', () => this.stop('broadcaster_disconnected'));
    }

    start(sourceId, title = '') {
        this.lastError = null;
        if (!this.isHostReady()) {
            this.lastError = 'Open the world to LAN before starting a broadcast.';
            return { success: false, error: this.lastError };
        }
        const canvas = this.minecraft.cameraManager?.getBroadcastCanvas();
        if (!canvas || typeof canvas.captureStream !== 'function') {
            this.lastError = 'This browser does not support canvas.captureStream().';
            return { success: false, error: this.lastError };
        }
        this.stop('restarted', false);
        try {
            let stream;
            try { stream = canvas.captureStream(30); }
            catch (_) { stream = canvas.captureStream(15); }
            if (!stream || !stream.getVideoTracks || stream.getVideoTracks().length === 0) throw new Error('No video track was created.');
            this.stream = stream;
            for(const track of stream.getVideoTracks())try{track.contentHint='detail';}catch(_){}
            this.attachPeer(this.minecraft.multiplayer.peer);
            const mp = this.minecraft.multiplayer;
            this.metadata = {
                broadcastId: `minewatch-${mp.lanCode}`,
                worldId: this.minecraft.world?.worldId || null,
                hostPeerId: mp.peer.id,
                sourceId,
                title: title || this.minecraft.world?.name || "Minecraft Broadcast",
                cameraName: this.minecraft.cameraManager.getSource(sourceId)?.name || "Camera",
                startedAt: Date.now(), live: true, viewerCount: 0,
                code: mp.lanCode
            };
            this.notifyMetadata();
            clearInterval(this.discoveryHeartbeat);
            this.discoveryHeartbeat=setInterval(()=>this.publishLocalDiscovery(),3000);
            for (const conn of this.viewerDataConnections.values()) this.connectViewer(conn.peer);
            return { success: true, metadata: this.metadata };
        } catch (error) {
            this.lastError = error?.message || String(error);
            this.stop('capture_failed');
            return { success: false, error: this.lastError };
        }
    }

    updateSource(sourceId) {
        if (!this.metadata) return;
        this.metadata.sourceId = sourceId;
        this.metadata.cameraName = this.minecraft.cameraManager.getSource(sourceId)?.name || "Camera";
        this.notifyMetadata();
    }

    handleIncomingCall(call) {
        if (!this.stream || !this.metadata?.live || call.metadata?.type !== 'broadcast_viewer') {
            try { call.close(); } catch (_) {}
            return;
        }
        try {
            call.answer(this.stream);
            this.viewers.set(call.peer, call);
            this.updateViewerCount();
            call.on('close', () => this.removeViewer(call.peer));
            call.on('error', () => this.removeViewer(call.peer));
        } catch (_) { try { call.close(); } catch (_) {} }
    }

    handleViewerChat(peerId, message) {
        const conn=this.viewerDataConnections.get(peerId);
        if(!conn || !this.metadata?.live)return;
        const now=Date.now(),last=this.viewerChatTimes.get(peerId)||0;
        if(now-last<1200){try{conn.send({type:'watch_chat_status',ok:false,message:'Please wait before sending another message.'});}catch(_){}return;}
        const text=String(message||'').replace(/[§]/g,'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
        if(!text)return;
        this.viewerChatTimes.set(peerId,now);
        if(text.toLowerCase().startsWith('!request')){
            const username=text.slice(8).trim().slice(0,16)||'Viewer';
            const queued=this.minecraft.multiplayer?.queueJoinRequest(peerId,username,conn,true);
            try{conn.send({type:'watch_chat_status',ok:!!queued,message:queued?'Requested to Join':'Your join request is already pending.'});}catch(_){}
            return;
        }
        // Minecraft section-sign formatting: dark purple MineWatch messages.
        this.minecraft.addMessageToChat(`§5<MineWatch> ${text}`);
        try{conn.send({type:'watch_chat_status',ok:true});}catch(_){}
    }

    handleBrowseProbe(conn) {
        if (!conn) return;
        try {
            if (conn.open) conn.send(this.metadata?.live ? {type:'browse_metadata',metadata:this.publicMetadata()} : {type:'browse_offline'});
        } catch (_) {}
        setTimeout(()=>{try{conn.close();}catch(_){}},100);
    }

    handleWatchRequest(conn) {
        if (!conn) return;
        this.viewerDataConnections.set(conn.peer, conn);
        const send = data => { try { if (conn.open) conn.send(data); } catch (_) {} };
        send(this.metadata?.live ? {type:'broadcast_metadata', metadata:this.publicMetadata()} : {type:'broadcast_offline'});
        if (this.metadata?.live) this.connectViewer(conn.peer);
        conn.on('close', () => {this.viewerDataConnections.delete(conn.peer);this.viewerChatTimes.delete(conn.peer);this.minecraft.multiplayer?.cancelJoinRequest(conn.peer);});
        conn.on('error', () => {this.viewerDataConnections.delete(conn.peer);this.viewerChatTimes.delete(conn.peer);this.minecraft.multiplayer?.cancelJoinRequest(conn.peer);});
    }

    connectViewer(peerId) {
        if (!this.stream || !this.metadata?.live || !this.boundPeer || this.viewers.has(peerId)) return;
        try {
            const call=this.boundPeer.call(peerId,this.stream,{metadata:{type:'broadcast_stream',broadcastId:this.metadata.broadcastId}});
            if(call){setTimeout(()=>{for(const sender of call.peerConnection?.getSenders?.()||[]){if(sender.track?.kind!=='video')continue;const p=sender.getParameters();if(!p.encodings?.length)p.encodings=[{}];p.encodings[0].maxBitrate=6000000;p.degradationPreference='maintain-resolution';sender.setParameters(p).catch(()=>{});}},0);this.viewers.set(peerId,call);this.updateViewerCount();call.on('close',()=>this.removeViewer(peerId));call.on('error',()=>this.removeViewer(peerId));}
        } catch (_) {}
    }

    publicMetadata() {
        if (!this.metadata) return null;
        return {...this.metadata, viewerCount:this.viewers.size};
    }

    updateViewerCount() {
        if (this.metadata) this.metadata.viewerCount = this.viewers.size;
        this.notifyMetadata();
    }

    removeViewer(peerId) {
        this.viewers.delete(peerId);
        this.updateViewerCount();
    }

    notifyMetadata() {
        if (!this.metadata) return;
        const packet={type:'broadcast_metadata',metadata:this.publicMetadata()};
        for (const conn of this.viewerDataConnections.values()) { try { if(conn.open)conn.send(packet); } catch (_) {} }
        this.publishLocalDiscovery();
    }

    publishLocalDiscovery() {
        try {
            const key='minewatch.liveBroadcasts',now=Date.now(),registry=JSON.parse(localStorage.getItem(key)||'{}');
            for(const [id,item] of Object.entries(registry))if(!item?.updatedAt||now-item.updatedAt>15000)delete registry[id];
            if(this.metadata?.live)registry[this.metadata.broadcastId]={metadata:this.publicMetadata(),updatedAt:now};
            localStorage.setItem(key,JSON.stringify(registry));
        } catch (_) {}
    }

    removeLocalDiscovery() {
        try { const key='minewatch.liveBroadcasts',registry=JSON.parse(localStorage.getItem(key)||'{}'),id=this.metadata?.broadcastId;if(id)delete registry[id];localStorage.setItem(key,JSON.stringify(registry)); } catch (_) {}
    }

    stop(reason='stopped', notify=true) {
        clearInterval(this.discoveryHeartbeat);this.discoveryHeartbeat=0;this.removeLocalDiscovery();
        if (notify) for (const conn of this.viewerDataConnections.values()) { try { if(conn.open)conn.send({type:'broadcast_ended',reason}); } catch (_) {} }
        for (const call of this.viewers.values()) { try { call.close(); } catch (_) {} }
        this.viewers.clear();
        if (this.stream) for (const track of this.stream.getTracks()) { try { track.stop(); } catch (_) {} }
        this.stream=null;
        if(this.metadata)this.metadata.live=false;
        this.metadata=null;
        if(this.minecraft.cameraManager?.session)this.minecraft.cameraManager.session.stop();
        if(this.minecraft.player)this.minecraft.player.broadcasting=false;
    }
}
