export default class ReplayRecorder {
    constructor(minecraft){this.minecraft=minecraft;this.recording=false;this.startedAt=0;this.frames=[];this.maxFrames=36000;}
    start(){this.frames=[];this.startedAt=performance.now();this.recording=true;}
    stop(){this.recording=false;return this.frames;}
    tick(){if(!this.recording||!this.minecraft.player)return;const p=this.minecraft.player,cm=this.minecraft.cameraManager;const source=cm?.getSource?.();this.frames.push({t:Math.round(performance.now()-this.startedAt),player:{x:p.x,y:p.y,z:p.z,yaw:p.rotationYaw,pitch:p.rotationPitch},camera:source?{id:source.id,x:source.position.x,y:source.position.y,z:source.position.z,yaw:source.yaw,pitch:source.pitch,fov:source.fov}:null});if(this.frames.length>=this.maxFrames)this.stop();}
    download(){const data={format:'mcwse-replay-v1',created:new Date().toISOString(),frames:this.frames};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));a.download=`replay-${Date.now()}.mcwse-replay.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
}
