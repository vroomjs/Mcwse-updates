import * as THREE from "three";
import StaticCamera from "./StaticCamera.js";
import CameraSource from "./CameraSource.js";
import CameramanController from "./CameramanController.js";
import BroadcastSession from "./BroadcastSession.js";

export default class CameraManager {
    constructor(minecraft) {
        this.minecraft = minecraft;
        this.staticCameras = new Map();
        this.models = new Map();
        this.group = new THREE.Group();
        this.group.name = "broadcastCameraModels";
        this.session = new BroadcastSession();
        this.controller = new CameramanController(minecraft);
        this.broadcastCanvas = document.createElement("canvas");
        // Capture at native HD so full-window playback stays crisp. Physical
        // camera monitors retain their lighter 640x360 readback path.
        this.broadcastCanvas.width = 1280; this.broadcastCanvas.height = 720;
        this.broadcastCanvas.style.display = "none";
        this._broadcastStateDirty = false;
        this.previewRequested = false; this.previewSourceId = null; this.lastPreviewRender = 0; this.placement = null;
        this.returnCameraId = null;
        this.lastMonitorRender = 0; this.monitorCursor = 0;
        this.activeRemoteWasCameraman = false;
        this.triggerZones = new Map();
        this.triggerCooldowns = new Map();
        this.triggerInside = new Map();
        this.triggerVisuals = new Map();
    }

    attach() { const scene=this.minecraft.worldRenderer?.scene; if (scene && this.group.parent!==scene) scene.add(this.group); }
    clear() { this.staticCameras.clear(); this.triggerVisuals.forEach(v=>{this.group.remove(v);v.geometry?.dispose?.();v.material?.dispose?.();});this.triggerVisuals.clear(); this.triggerZones.clear(); this.triggerCooldowns.clear(); this.triggerInside.clear(); this.models.forEach(m=>this.disposeModel(m)); this.models.clear(); this.group.clear(); }
    disposeModel(root) { root.traverse(o=>{o.geometry?.dispose?.();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.());});root.userData?.previewTexture?.dispose?.(); }

    makeModel(recording=false) {
        const root=new THREE.Group(); root.name="cameraModel";const visual=new THREE.Group();root.add(visual);root.userData.cameraVisual=visual;root.userData.assetKind='procedural';
        const dark=new THREE.MeshBasicMaterial({color:0x25282d});
        const black=new THREE.MeshBasicMaterial({color:0x090a0c});
        const metal=new THREE.MeshBasicMaterial({color:0x555b63});
        const red=new THREE.MeshBasicMaterial({color:0xff2020});
        const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);visual.add(m);return m;};
        add(new THREE.BoxGeometry(.7,.42,.48),dark,0,0,0);
        const hood=add(new THREE.CylinderGeometry(.24,.34,.38,4),dark,0,0,-.38); hood.rotation.x=Math.PI/2; hood.rotation.z=Math.PI/4;
        const lens=add(new THREE.CylinderGeometry(.16,.16,.24,20),black,0,0,-.67); lens.rotation.x=Math.PI/2;
        add(new THREE.BoxGeometry(.24,.15,.18),metal,0,.29,.03);
        add(new THREE.BoxGeometry(.07,.19,.22),metal,.39,.02,.02);
        const light=new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),red);light.position.set(.28,.17,-.25);root.add(light); light.name="recordingLight"; light.visible=recording;
        root.userData.recordingLight=light;
        return root;
    }

    createCamera(data={}, sync=true) {
        const mp=this.minecraft.multiplayer, cp=mp?.cameraPermissions?.();
        if(sync && mp?.connected && !mp.isHosting && !cp?.create) return null;
        const allowed=new Set(['static','chase']);
        if(!(data instanceof StaticCamera) && data.type && !allowed.has(String(data.type))) return null;
        const camera=data instanceof StaticCamera?data:new StaticCamera(data);
        this.staticCameras.set(camera.id,camera); this.attach(); this.ensureModel(camera);
        if(sync) this.minecraft.multiplayer?.sendCameraMessage?.("camera_create",camera.toJSON());
        return camera;
    }
    updateCamera(id,data={},sync=true) { const mp=this.minecraft.multiplayer,cp=mp?.cameraPermissions?.(); if(sync&&mp?.connected&&!mp.isHosting&&!cp?.edit)return null; const c=this.staticCameras.get(id); if(!c)return null; if(c.type==='chase'){c.settings={...c.settings};if(data.yaw!==undefined)c.settings.yawOffset=Number(data.yaw);if(data.pitch!==undefined)c.settings.pitchOffset=Number(data.pitch);} c.update(data); this.updateModel(c); if(this.session.sourceId===id)this.minecraft.broadcastMedia?.updateSource(id); if(sync)this.minecraft.multiplayer?.sendCameraMessage?.("camera_update",c.toJSON()); return c; }
    removeCamera(id,sync=true) { const mp=this.minecraft.multiplayer,cp=mp?.cameraPermissions?.(); if(sync&&mp?.connected&&!mp.isHosting&&!cp?.edit)return false; const c=this.staticCameras.get(id); if(!c)return false; if(this.returnCameraId===id)this.returnCameraId=null; this.staticCameras.delete(id); const m=this.models.get(id); if(m){this.group.remove(m);this.disposeModel(m);this.models.delete(id);} if(sync)this.minecraft.multiplayer?.sendCameraMessage?.("camera_remove",{id}); if(this.session.sourceId===id)this.selectSource("player:local"); return true; }
    load(list=[]) { this.clear(); for(const data of list||[]){if(!['static','chase'].includes(String(data.type||'static')))continue;this.createCamera(data,false);} }
    serialize() { return [...this.staticCameras.values()].map(c=>c.toJSON()); }
    ensureModel(c) { let m=this.models.get(c.id); if(!m){m=this.makeModel(false);this.addPreviewMonitor(m,c);this.models.set(c.id,m);this.group.add(m);} this.updateModel(c); return m; }
    addPreviewMonitor(root,camera){
        const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;
        const ctx=canvas.getContext('2d');ctx.fillStyle='#080a0d';ctx.fillRect(0,0,640,360);ctx.fillStyle='#66ccff';ctx.font='bold 36px sans-serif';ctx.fillText(camera.name||'Camera',28,56);ctx.fillStyle='#78818d';ctx.font='28px sans-serif';ctx.fillText('CAMERA PREVIEW',28,104);
        const texture=new THREE.CanvasTexture(canvas);texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
        const externalPreview=new THREE.Group();externalPreview.name='externalCameraPreview';root.add(externalPreview);
        const frame=new THREE.Mesh(new THREE.BoxGeometry(1.02,.62,.06),new THREE.MeshBasicMaterial({color:0x101318}));frame.position.set(.98,.03,.02);externalPreview.add(frame);
        const screenMaterial=new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide,toneMapped:false});
        const rearScreen=new THREE.Mesh(new THREE.PlaneGeometry(.94,.529),screenMaterial);rearScreen.position.set(.98,.03,.055);externalPreview.add(rearScreen);
        // Matching display on the lens/front side. Rotate it so the image is
        // correctly oriented rather than mirrored when viewed from the front.
        const frontScreen=new THREE.Mesh(new THREE.PlaneGeometry(.94,.529),screenMaterial.clone());frontScreen.position.set(.98,.03,-.055);frontScreen.rotation.y=Math.PI;externalPreview.add(frontScreen);
        root.userData.previewCanvas=canvas;root.userData.previewTexture=texture;root.userData.externalPreview=externalPreview;
    }
    updateModel(c) { const m=this.models.get(c.id); if(!m)return; m.position.set(c.position.x,c.position.y,c.position.z); this.applyRotation(m,c.yaw,c.pitch,c.roll); m.visible=c.online && c.dimension===(this.minecraft.world?.dimension||0);
        if(m.userData.recordingLight)m.userData.recordingLight.visible=!!(this.session.active&&this.session.sourceId===c.id); }
    applyRotation(obj,yaw,pitch,roll=0) { obj.rotation.order="YXZ"; obj.rotation.set(-pitch*Math.PI/180,-(yaw+180)*Math.PI/180,roll*Math.PI/180); }

    createPlacementPreview(){if(this.placementPreview)return;const wrap=document.createElement('div');wrap.style.cssText='position:fixed;right:18px;bottom:18px;width:240px;height:150px;background:#000;border:3px solid #35e06f;z-index:99999;box-shadow:0 4px 18px #0009;pointer-events:none';const canvas=document.createElement('canvas');canvas.width=480;canvas.height=270;canvas.style.cssText='width:100%;height:100%;image-rendering:auto';wrap.appendChild(canvas);const label=document.createElement('div');label.textContent='CAMERA PREVIEW';label.style.cssText='position:absolute;left:6px;top:5px;color:#35e06f;font:bold 12px monospace;text-shadow:1px 1px #000';wrap.appendChild(label);document.body.appendChild(wrap);this.placementPreview={wrap,canvas};}
    destroyPlacementPreview(){if(this.placementPreview){this.placementPreview.wrap.remove();this.placementPreview=null;}}
    renderPlacementPreview(){const q=this.placementPreview,st=this.placement;if(!q||!st||st.kind==='trigger'||!this.minecraft.worldRenderer)return;const d=st.data;const src={...d,type:'static',online:true,dimension:this.minecraft.world?.dimension||0};const wasVisible=st.ghost.visible;st.ghost.visible=false;try{this.minecraft.worldRenderer.renderBroadcastView(src,q.canvas,0,'monitor');}catch(e){}finally{st.ghost.visible=wasVisible;}}
    startPlacement() {
        if (!this.minecraft.player || this.placement) return;
        this.attach(); this.createPlacementPreview(); const ghost=this.makeModel(false);
        ghost.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.42;o.material.depthWrite=false;}});
        // Placement-only green view-volume preview. It is removed with the
        // placement ghost as soon as the camera is placed or cancelled.
        const cone=new THREE.Mesh(new THREE.ConeGeometry(1.15,2.5,4,1,true),new THREE.MeshBasicMaterial({color:0x35e06f,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,wireframe:false}));
        cone.rotation.x=-Math.PI/2;cone.position.z=-1.65;ghost.add(cone);
        const frame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.1,1.35)),new THREE.LineBasicMaterial({color:0x35e06f,transparent:true,opacity:.8}));
        frame.position.z=-2.9;frame.visible=false;ghost.add(frame);this.group.add(ghost);this.placement={ghost};this.updatePlacement();
        this.minecraft.addMessageToChat("§bCamera placement: aim, left click to place; right click/Esc to cancel.");
    }
    updatePlacement(){const p=this.minecraft.player,st=this.placement;if(!p||!st)return;if(st.kind==='trigger'){const v=p.getVectorForRotation(p.rotationPitch,p.rotationYaw);st.data.position={x:p.x+v.x*4,y:p.y+p.getEyeHeight(),z:p.z+v.z*4};st.ghost.position.set(st.data.position.x,st.data.position.y,st.data.position.z);st.ghost.scale.set(st.data.size.x,st.data.size.y,st.data.size.z);return;}const v=p.getVectorForRotation(p.rotationPitch,p.rotationYaw);st.data={name:`Camera ${this.staticCameras.size+1}`,position:{x:p.x+v.x*2,y:p.y+p.getEyeHeight()+v.y*2,z:p.z+v.z*2},yaw:p.rotationYaw,pitch:p.rotationPitch,roll:0,fov:70,dimension:this.minecraft.world?.dimension||0};st.ghost.position.set(st.data.position.x,st.data.position.y,st.data.position.z);this.applyRotation(st.ghost,st.data.yaw,st.data.pitch,0);}
    confirmPlacement(){if(!this.placement)return null;if(this.placement.kind==='trigger')return this.confirmTriggerPlacement();const data=this.placement.data;this.cancelPlacement(false);const c=this.createCamera(data,true);this.minecraft.openCameraConfig?.(c.id);return c;}
    cancelPlacement(message=true){if(!this.placement)return;this.destroyPlacementPreview();const g=this.placement.ghost;this.group.remove(g);this.disposeModel(g);this.placement=null;if(message)this.minecraft.addMessageToChat("§7Camera placement cancelled.");}
    placeStaticCamera(){this.startPlacement();}
    getLookedAtCamera(maxDistance=5){const p=this.minecraft.player;if(!p)return null;const eye=new THREE.Vector3(p.x,p.y+p.getEyeHeight(),p.z),dir=p.getVectorForRotation(p.rotationPitch,p.rotationYaw);let best=null,bestT=maxDistance;for(const c of this.staticCameras.values()){if(!c.online||c.dimension!==(this.minecraft.world?.dimension||0))continue;const d=new THREE.Vector3(c.position.x-eye.x,c.position.y-eye.y,c.position.z-eye.z),t=d.x*dir.x+d.y*dir.y+d.z*dir.z;if(t<0||t>bestT)continue;const perp=d.clone().sub(new THREE.Vector3(dir.x,dir.y,dir.z).multiplyScalar(t)).length();if(perp<.65){best=c;bestT=t;}}return best;}
    getPlayerSource(player=this.minecraft.player) { return new CameraSource({id:player===this.minecraft.player?"player:local":`player:${player.id}`,name:player.username||"Player POV",type:player.isCameraman?"cameraman":"player",position:{x:player.x,y:player.y+player.getEyeHeight(),z:player.z},yaw:player.rotationYaw,pitch:player.rotationPitch,roll:player.cameraRoll||0,fov:player.cameraFov||this.minecraft.settings.fov,online:true,dimension:this.minecraft.world?.dimension||0}); }
    getSource(id=this.session.sourceId) {
        if(id==="player:local")return this.minecraft.player?this.getPlayerSource():null;
        const localPeerId=this.minecraft.multiplayer?.peer?.id;
        if(localPeerId&&id===`player:${localPeerId}`)return this.minecraft.player?this.getPlayerSource():null;
        if(this.staticCameras.has(id))return this.staticCameras.get(id);
        for(const p of this.minecraft.multiplayer?.remotePlayers?.values?.()||[])if(`player:${p.id}`===id)return this.getPlayerSource(p);
        return null;
    }
    listSources() { const a=[]; if(this.minecraft.player)a.push(this.getPlayerSource()); for(const p of this.minecraft.multiplayer?.remotePlayers?.values?.()||[])a.push(this.getPlayerSource(p)); return a.concat([...this.staticCameras.values()]); }
    selectSource(id,automatic=false) { const mp=this.minecraft.multiplayer,cp=mp?.cameraPermissions?.(); if(mp?.connected&&!mp.isHosting&&!automatic&&!cp?.cut){this.minecraft.addMessageToChat("§cYou do not have permission to cut the broadcast.");return false;} const source=this.getSource(id); if(!source)return false; if(!automatic)this.returnCameraId=null; this.activeRemoteWasCameraman=source.type==="cameraman"&&id.startsWith("player:")&&id!=="player:local"; this.session.select(id); this.minecraft.broadcastMedia?.updateSource(id); this.syncBroadcastState(); return true; }
    cycleSource() { const list=this.listSources().filter(x=>x.online); if(!list.length)return; let i=list.findIndex(x=>x.id===this.session.sourceId); this.selectSource(list[(i+1)%list.length].id); this.minecraft.addMessageToChat(`§bBroadcast source: ${this.getSource()?.name}`); }
    setBroadcasting(active) {
        const mp=this.minecraft.multiplayer,cp=mp?.cameraPermissions?.();
        if(mp?.connected&&!mp.isHosting&&!cp?.stream){this.minecraft.addMessageToChat("§cYou do not have permission to start or stop streaming.");return false;}
        if (active) {
            const result=this.minecraft.broadcastMedia?.start(this.session.sourceId);
            if (!result?.success) { this.minecraft.addMessageToChat("§c"+(result?.error||"Unable to start broadcast.")); return false; }
            this.session.start();
            this.minecraft.addMessageToChat(`§aBroadcast live. Watch code: ${result.metadata.code}`);
        } else {
            this.minecraft.broadcastMedia?.stop("stopped"); this.session.stop(); this.returnCameraId=null;
        }
        if(this.minecraft.player)this.minecraft.player.broadcasting=!!active&&this.session.sourceId==="player:local";
        this.syncBroadcastState(); this.minecraft.multiplayer?.updateMyPresence?.(); return true;
    }
    syncBroadcastState() {
        const mp=this.minecraft.multiplayer;
        const state=this.session.toJSON();
        // `player:local` is only meaningful inside one browser. On LAN,
        // publish the host peer id so viewers can distinguish the host POV
        // from their own POV and hide private camera feeds correctly.
        if(mp?.isHosting && mp.peer?.id && state.sourceId==="player:local") state.sourceId=`player:${mp.peer.id}`;
        mp?.sendCameraMessage?.("broadcast_state",state);
    }
    getBroadcastCanvas(){return this.broadcastCanvas;}
    updateTriggerVisual(z){let v=this.triggerVisuals.get(z.id);if(!v){v=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:z.type==='exit'?0xff3030:0x35e06f,transparent:true,opacity:z.opacity,depthWrite:false,wireframe:false}));v.name='triggerZone:'+z.id;this.group.add(v);this.triggerVisuals.set(z.id,v);}v.position.set(z.position.x,z.position.y,z.position.z);v.scale.set(z.size.x,z.size.y,z.size.z);v.material.color.set(z.type==='exit'?0xff3030:0x35e06f);v.material.opacity=z.opacity;v.visible=!!z.enabled;}
    startTriggerPlacement(){if(this.placement)return;this.attach();this.placement={kind:'trigger',data:{type:'enter',position:{x:0,y:0,z:0},size:{x:8,y:4,z:8},opacity:.22,enabled:true,actions:[]},ghost:new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0x35e06f,transparent:true,opacity:.35,wireframe:true}))};this.group.add(this.placement.ghost);this.updatePlacement();this.minecraft.addMessageToChat('§aTrigger placement: aim, left click to place; right click/Esc to cancel.');}
    confirmTriggerPlacement(){const d=this.placement.data;this.cancelPlacement(false);const z=this.addTrigger(d);this.minecraft.openTriggerConfig?.(z.id);return z;}
    addTrigger(data={}){const id=String(data.id||`trigger-${Date.now().toString(36)}`);const z={id,type:data.type||'enter',position:{x:Number(data.position?.x||0),y:Number(data.position?.y||0),z:Number(data.position?.z||0)},size:{x:Number(data.size?.x||1),y:Number(data.size?.y||1),z:Number(data.size?.z||1)},opacity:Number(data.opacity??.22),enabled:data.enabled!==false,conditions:data.conditions||[],actions:data.actions||[{type:'switch',cameraId:data.cameraId}],cooldown:Number(data.cooldown||3000),priority:Number(data.priority||0)};this.triggerZones.set(id,z);this.updateTriggerVisual(z);return z;}
    removeTrigger(id){const v=this.triggerVisuals.get(id);if(v){this.group.remove(v);v.geometry?.dispose?.();v.material?.dispose?.();this.triggerVisuals.delete(id);}return this.triggerZones.delete(id);}
    serializeTriggers(){return [...this.triggerZones.values()].map(z=>({...z,position:{...z.position},size:{...z.size}}));}
    evaluateTriggers(){const p=this.minecraft.player;if(!p)return;const now=performance.now();const hits=[];for(const z of this.triggerZones.values()){if(!z.enabled)continue;const q=z.position,s=z.size,inside=p.x>=q.x-s.x/2&&p.x<=q.x+s.x/2&&p.y>=q.y-s.y/2&&p.y<=q.y+s.y/2&&p.z>=q.z-s.z/2&&p.z<=q.z+s.z/2,key=z.id,was=this.triggerInside.get(key)||false;this.triggerInside.set(key,inside);const fire=z.type==='exit'?!inside&&was:inside&&!was;if(fire&&now-(this.triggerCooldowns.get(key)||0)>=z.cooldown)hits.push(z);}hits.sort((a,b)=>b.priority-a.priority);const z=hits[0];if(!z)return;this.triggerCooldowns.set(z.id,now);for(const a of z.actions||[]){if(a.type==='switch'&&a.cameraId)this.selectSource(a.cameraId,true);else if(a.type==='return'&&this.returnCameraId)this.selectSource(this.returnCameraId,true);else if(a.type==='fov'&&this.getSource())this.getSource().fov=Number(a.value||70);}}
    findTarget(id){
        // An unassigned camera targets the owner/streamer by default. This
        // keeps follow-like cameras useful in single-player and when no remote
        // players are present.
        if(!id || id==='player:local') return this.minecraft.player;
        for(const p of this.minecraft.multiplayer?.remotePlayers?.values?.()||[]) if(p.id===id || `player:${p.id}`===id || p.username===id) return p;
        return null;
    }
    updateDynamicCamera(c, now=performance.now()){
        const type=String(c.type||'static').toLowerCase(), target=this.findTarget(c.target || c.settings?.target);
        if(['chase'].includes(type) && !target){c.online=false;return;}
        if(type==='chase'){
            const yaw=(target.rotationYaw||0)*Math.PI/180, behind=type==='chase'?Number(c.settings.distance??8):Number(c.settings.distance??6);
            const off=Number(c.settings.offset||0), desired={x:target.x-Math.sin(yaw)*behind+Math.cos(yaw)*off,y:target.y+Number(c.settings.height??3),z:target.z+Math.cos(yaw)*behind+Math.sin(yaw)*off};
            const a=Math.max(.02,Math.min(1,Number(c.settings.smoothness??.15))); c.position.x+=(desired.x-c.position.x)*a;c.position.y+=(desired.y-c.position.y)*a;c.position.z+=(desired.z-c.position.z)*a;
            // Dynamic cameras always aim at the target, rather than inheriting
            // the target's own facing direction.
            const lookY=target.y+Number(target.getEyeHeight?.()||1.6)+Number(c.settings.lookAheadY||0);
            const dx=target.x-c.position.x, dy=lookY-c.position.y, dz=target.z-c.position.z;
            c.yaw=Math.atan2(-dx,dz)*180/Math.PI+Number(c.settings.yawOffset||0);
            c.pitch=-Math.atan2(dy,Math.max(.001,Math.hypot(dx,dz)))*180/Math.PI+Number(c.settings.pitchOffset||0);
            c.online=true;
        } else if(type==='security'){
            const range=Number(c.settings.horizontalRange??45), speed=Number(c.settings.scanSpeed??.5);c.yaw+=Math.sin(now*.001*speed)*range*.002;
        } else if(type==='cinematic'){
            const points=c.settings.points||[];if(points.length>1){const dur=Math.max(100,Number(c.settings.duration||3000)), t=(now%(dur*(points.length-1)))/dur, i=Math.min(points.length-2,Math.floor(t)), f=t-i;const a=points[i],b=points[i+1];for(const k of ['x','y','z'])c.position[k]=(a.position?.[k]||0)+((b.position?.[k]||0)-(a.position?.[k]||0))*f;c.yaw=(a.yaw||0)+((b.yaw||0)-(a.yaw||0))*f;c.pitch=(a.pitch||0)+((b.pitch||0)-(a.pitch||0))*f;}}
    }
    tick(){ this.attach(); if(this.placement){this.updatePlacement();this.renderPlacementPreview();} const now=performance.now(); for(const c of this.staticCameras.values()){this.updateDynamicCamera(c,now);this.updateModel(c);} if(this.activeRemoteWasCameraman&&!this.getSource(this.session.sourceId)){this.activeRemoteWasCameraman=false;if(this.selectSource("player:local",true))this.minecraft.addMessageToChat("§eCameraman left the world; switched to streamer POV.");} }

    isInsideOwnerRender(source){
        const p=this.minecraft.player;if(!p||!source)return false;
        const pcx=Math.floor(p.x)>>4,pcz=Math.floor(p.z)>>4,scx=Math.floor(source.position.x)>>4,scz=Math.floor(source.position.z)>>4;
        const range=Math.max(1,(this.minecraft.settings.viewDistance||8)-1);
        return source.dimension===(this.minecraft.world?.dimension||0)&&Math.abs(scx-pcx)<range&&Math.abs(scz-pcz)<range;
    }
    recallCameraman(source){
        if(!source?.id?.startsWith("player:")||source.id==="player:local")return;
        const peerId=source.id.slice(7),entity=this.minecraft.multiplayer?.remotePlayers?.get(peerId),p=this.minecraft.player;
        if(!entity||!p)return;
        const yaw=p.rotationYaw*Math.PI/180,x=p.x+Math.sin(yaw)*2,z=p.z-Math.cos(yaw)*2,y=p.y;
        entity.setPosition(x,y,z);entity.targetX=x;entity.targetY=y;entity.targetZ=z;
        this.minecraft.multiplayer?.recallCameraman?.(peerId,{x,y,z,yaw:p.rotationYaw});
        const now=Date.now();if(!this._lastRecallNotice||now-this._lastRecallNotice>3000){this._lastRecallNotice=now;this.minecraft.addMessageToChat("§eCameraman left the rendered world and was recalled to the streamer.");}
    }
    ensureBroadcastSource(source){
        if(!this.session.active||!source)return source;
        if(this.returnCameraId){
            const returnCamera=this.staticCameras.get(this.returnCameraId);
            if(!returnCamera){this.returnCameraId=null;}
            else if(returnCamera.online&&this.isInsideOwnerRender(returnCamera)){
                this.returnCameraId=null;this.selectSource(returnCamera.id,true);
                this.minecraft.addMessageToChat(`§a${returnCamera.name} is rendered again; switched back automatically.`);
                return this.getSource(returnCamera.id);
            }
        }
        if(this.isInsideOwnerRender(source))return source;
        if(source.type==="cameraman"){this.recallCameraman(source);return this.getSource(source.id);}
        if(source.type==="static"){
            this.returnCameraId=source.switchBackOnRender?source.id:null;
            const cameraman=this.listSources().find(s=>s.type==="cameraman"&&s.online);
            if(cameraman){if(!this.isInsideOwnerRender(cameraman))this.recallCameraman(cameraman);this.selectSource(cameraman.id,true);return this.getSource(cameraman.id);}
            this.selectSource("player:local",true);
            const now=Date.now();if(!this._lastFallbackNotice||now-this._lastFallbackNotice>3000){this._lastFallbackNotice=now;this.minecraft.addMessageToChat("§eStatic camera left the rendered world; switched to streamer POV.");}
            return this.getSource("player:local");
        }
        this.selectSource("player:local");return this.getSource("player:local");
    }
    drawSignalLost(canvas,text,now=performance.now()){
        if(!this.signalCanvas){this.signalCanvas=document.createElement('canvas');this.signalCanvas.width=160;this.signalCanvas.height=90;this.signalImage=this.signalCanvas.getContext('2d').createImageData(160,90);}
        const data=this.signalImage.data,t=now*.006;for(let y=0;y<90;y++)for(let x=0;x<160;x++){const i=(y*160+x)*4,band=Math.sin(y*.55+t*3)*16,n=(Math.random()*185+band)|0;data[i]=n;data[i+1]=Math.max(0,n-10);data[i+2]=Math.min(255,n+14);data[i+3]=255;}
        const small=this.signalCanvas.getContext('2d');small.putImageData(this.signalImage,0,0);const ctx=canvas.getContext('2d');ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(this.signalCanvas,0,0,canvas.width,canvas.height);ctx.globalAlpha=.3;ctx.fillStyle='#000';for(let y=(now/12)%8;y<canvas.height;y+=8)ctx.fillRect(0,y,canvas.width,2);ctx.globalAlpha=1;const band=canvas.height*.23;ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(0,canvas.height/2-band/2,canvas.width,band);ctx.fillStyle='#ff2525';ctx.font=`bold ${Math.round(canvas.height*.095)}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,canvas.width/2,canvas.height/2);ctx.restore();
    }
    renderBroadcast(partialTicks=0){ if(!this.session.active&&!this.previewRequested)return; const now=performance.now(); if(now-this.lastPreviewRender<(this.session.active?33:66))return; this.lastPreviewRender=now;if(this.session.active&&this.minecraft.player?.health<=0){this.drawSignalLost(this.broadcastCanvas,'[NO CAMERAS ACTIVE]',now);return;} let source=this.getSource(!this.session.active&&this.previewRequested&&this.previewSourceId?this.previewSourceId:this.session.sourceId); source=this.ensureBroadcastSource(source); if(!source||!source.online||source.dimension!==(this.minecraft.world?.dimension||0))return; this.minecraft.worldRenderer.renderBroadcastView(source,this.broadcastCanvas,partialTicks); }

    // Refresh one nearby physical monitor every 200 ms. The round-robin pass
    // feels responsive while still avoiding simultaneous multi-camera renders.
    renderWorldMonitors(partialTicks=0){
        const now=performance.now();if(now-this.lastMonitorRender<200||!this.minecraft.world)return;this.lastMonitorRender=now;
        const cameras=[...this.staticCameras.values()].filter(c=>c.online&&this.isInsideOwnerRender(c));if(!cameras.length)return;
        const camera=cameras[this.monitorCursor%cameras.length];this.monitorCursor=(this.monitorCursor+1)%cameras.length;
        const model=this.models.get(camera.id),canvas=model?.userData?.previewCanvas,texture=model?.userData?.previewTexture;if(!canvas||!texture)return;
        this.minecraft.worldRenderer.renderBroadcastView(camera,canvas,partialTicks,'monitor');
        if(this.session.sourceId!==camera.id){
            const ctx=canvas.getContext('2d');ctx.save();ctx.fillStyle='rgba(0,0,0,.68)';ctx.fillRect(0,142,640,76);ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=2;ctx.strokeRect(1,143,638,74);ctx.fillStyle='#ffffff';ctx.font='bold 38px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('NOT ACTIVE',320,180);ctx.restore();
        }
        texture.needsUpdate=true;
    }
}
