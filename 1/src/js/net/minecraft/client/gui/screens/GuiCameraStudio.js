import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiCameraConfig from "./GuiCameraConfig.js";

/**
 * OBS-inspired production desk built on the existing CameraManager. Offline,
 * source selection cues the preview and CUT promotes it to Program. While live,
 * source selection cuts directly so the single broadcast canvas and MediaStream
 * remain authoritative and viewers never reconnect.
 */
export default class GuiCameraStudio extends GuiScreen {
    constructor(previousScreen=null) {
        super(); this.previousScreen=previousScreen; this.page=0; this.previewSourceId=null;
    }
    doesGuiPauseGame(){ return false; }

    layout(){
        const m=8, header=26;
        const previewW=Math.max(270,Math.floor(this.width*.68)-m*2);
        const sideX=m+previewW+8, sideW=Math.max(120,this.width-sideX-m);
        const previewH=Math.min(Math.floor(previewW*9/16),Math.max(105,Math.floor(this.height*.48)));
        const transitionY=header+previewH+5, bottomY=transitionY+25, bottomH=Math.max(86,this.height-bottomY-31);
        const usable=this.width-m*2, scenesW=Math.floor(usable*.20), sourcesW=Math.floor(usable*.38), mixerW=Math.floor(usable*.22);
        return {m,header,previewW,sideX,sideW,previewH,transitionY,bottomY,bottomH,scenesW,sourcesW,mixerW,controlsX:m+scenesW+sourcesW+mixerW,controlsW:usable-scenesW-sourcesW-mixerW};
    }

    init(){
        super.init();
        const cm=this.minecraft.cameraManager, L=this.layout();
        if(!this.previewSourceId || !cm.getSource(this.previewSourceId)) this.previewSourceId=cm.session.sourceId;
        cm.previewRequested=true; cm.previewSourceId=this.previewSourceId;

        // Program/transition controls beneath the monitor.
        const cutW=Math.min(110,Math.max(70,Math.floor(L.previewW*.23)));
        this.buttonList.push(new GuiButton("CUT TO PROGRAM",L.m+L.previewW-cutW,L.transitionY,cutW,20,()=>{
            if(cm.selectSource(this.previewSourceId)) this.init();
        }));

        // One persistent scene for this MVP. Sources provide the switching.
        this.buttonList.push(new GuiButton("> Main Broadcast",L.m+4,L.bottomY+19,Math.max(35,L.scenesW-8),20,()=>{}));
        this.buttonList.push(new GuiButton("+",L.m+4,L.bottomY+L.bottomH-23,24,18,()=>{this.minecraft.displayScreen(null);cm.startPlacement();}));

        // Source list: clicking cues PREVIEW, exactly like studio mode in OBS.
        const sources=cm.listSources();
        const visible=Math.max(2,Math.floor((L.bottomH-46)/20));
        const pages=Math.max(1,Math.ceil(sources.length/visible)); this.page=Math.min(this.page,pages-1);
        const sourceX=L.m+L.scenesW+4, sourceW=Math.max(50,L.sourcesW-8);
        sources.slice(this.page*visible,this.page*visible+visible).forEach((source,i)=>{
            const preview=source.id===this.previewSourceId, program=source.id===cm.session.sourceId;
            const type=source.type==="static"?"STATIC":source.type==="cameraman"?"CAM":"POV";
            const name=String(source.name||"Unnamed Camera");
            const label=`${preview?">":" "}${program?" [PGM]":""} ${name} - ${type}`;
            this.buttonList.push(new GuiButton(label,sourceX,L.bottomY+19+i*20,sourceW,18,()=>{
                this.previewSourceId=source.id;cm.previewSourceId=source.id;if(cm.session.active)cm.selectSource(source.id);this.init();
            }));
        });
        const preview=cm.getSource(this.previewSourceId);
        const sourceFooter=L.bottomY+L.bottomH-23;
        this.buttonList.push(new GuiButton("ADD",sourceX,sourceFooter,Math.max(28,Math.floor(sourceW*.31)),18,()=>{this.minecraft.displayScreen(null);cm.startPlacement();}));
        this.buttonList.push(new GuiButton("PROPERTIES",sourceX+Math.floor(sourceW*.33),sourceFooter,Math.max(42,Math.floor(sourceW*.40)),18,()=>{
            if(preview?.type==="static")this.minecraft.displayScreen(new GuiCameraConfig(this,preview.id));
        }).setEnabled(preview?.type==="static"));
        this.buttonList.push(new GuiButton("-",sourceX+Math.floor(sourceW*.75),sourceFooter,Math.max(20,Math.floor(sourceW*.25)),18,()=>{
            if(preview?.type==="static")this.minecraft.displayScreen(new GuiCameraConfig(this,preview.id,true));
        }).setEnabled(preview?.type==="static"));

        // Right-side production controls.
        const cx=L.controlsX+4,cw=Math.max(45,L.controlsW-8);let cy=L.bottomY+19;
        this.buttonList.push(new GuiButton(cm.session.active?"§cSTOP STREAMING":"§aSTART STREAMING",cx,cy,cw,20,()=>{cm.setBroadcasting(!cm.session.active);this.init();}));cy+=23;
        this.buttonList.push(new GuiButton(this.minecraft.player.isCameraman?"CAMERAMAN ON":"CAMERAMAN OFF",cx,cy,cw,20,()=>{this.minecraft.setCameramanEnabled(!this.minecraft.player.isCameraman);this.init();}));cy+=23;
        this.buttonList.push(new GuiButton("PLACE CAMERA",cx,cy,cw,20,()=>{this.minecraft.displayScreen(null);cm.startPlacement();}));
        this.buttonList.push(new GuiButton("EXIT STUDIO",cx,L.bottomY+L.bottomH-23,cw,18,()=>this.minecraft.displayScreen(this.previousScreen)));
    }

    handleMouseScroll(delta){
        const cm=this.minecraft.cameraManager,L=this.layout(),visible=Math.max(2,Math.floor((L.bottomH-46)/20));
        const pages=Math.max(1,Math.ceil(cm.listSources().length/visible));
        if(pages>1){this.page=(this.page+(delta>0?-1:1)+pages)%pages;this.init();}
    }
    onClose(){if(this.minecraft?.cameraManager){this.minecraft.cameraManager.previewRequested=false;this.minecraft.cameraManager.previewSourceId=null;}}

    panel(stack,x,y,w,h,title){
        stack.fillStyle="#17191e";stack.fillRect(x,y,w,h);stack.strokeStyle="#3a3d45";stack.strokeRect(x+.5,y+.5,w-1,h-1);
        stack.fillStyle="#23262c";stack.fillRect(x+1,y+1,w-2,16);this.drawString(stack,title,x+5,y+5,0xd6d6d8);
    }

    drawScreen(stack,mx,my,pt){
        const cm=this.minecraft.cameraManager,L=this.layout(),live=cm.session.active;
        stack.fillStyle="#101216";stack.fillRect(0,0,this.width,this.height);
        stack.fillStyle="#202329";stack.fillRect(0,0,this.width,22);
        this.drawString(stack,"MINEWATCH STUDIO",8,7,0xe6e6e8);
        this.drawString(stack,live?"§cLIVE":"§7OFFLINE",this.width-58,7,live?0xff5555:0xaaaaaa);

        // Preview monitor.
        this.panel(stack,L.m,L.header,L.previewW,L.previewH,"PREVIEW");
        const vx=L.m+3,vy=L.header+18,vw=L.previewW-6,vh=L.previewH-21;
        stack.fillStyle="#000";stack.fillRect(vx,vy,vw,vh);
        const canvas=cm.getBroadcastCanvas();if(canvas?.width){const scale=Math.min(vw/canvas.width,vh/canvas.height),dw=Math.floor(canvas.width*scale),dh=Math.floor(canvas.height*scale),dx=vx+Math.floor((vw-dw)/2),dy=vy+Math.floor((vh-dh)/2);stack.drawImage(canvas,dx,dy,dw,dh);}
        const preview=cm.getSource(this.previewSourceId);
        if(preview)this.drawString(stack,preview.name||"Camera",vx+5,vy+5,0xffffff);

        // Program/status monitor at right.
        this.panel(stack,L.sideX,L.header,L.sideW,L.previewH,"PROGRAM");
        const program=cm.getSource(cm.session.sourceId);
        this.drawString(stack,live?"§c● LIVE":"§7OFFLINE",L.sideX+8,L.header+25,live?0xff5555:0xaaaaaa);
        this.drawString(stack,"Program:",L.sideX+8,L.header+43,0x8f949e);
        this.drawString(stack,program?.name||"No Source",L.sideX+8,L.header+54,0xffffff);
        this.drawString(stack,"Type:",L.sideX+8,L.header+72,0x8f949e);
        this.drawString(stack,program?.type?.toUpperCase()||"—",L.sideX+8,L.header+83,0xffffff);
        if(live&&this.minecraft.multiplayer?.lanCode)this.drawString(stack,"Code: "+this.minecraft.multiplayer.lanCode,L.sideX+8,L.header+103,0xb4b7bd);
        const viewers=this.minecraft.broadcastMedia?.viewers?.size||0;
        this.drawString(stack,"Viewers: "+viewers,L.sideX+8,L.header+116,0xb4b7bd);
        if(live&&this.minecraft.broadcastMedia?.metadata?.startedAt){
            const elapsed=Math.max(0,Date.now()-this.minecraft.broadcastMedia.metadata.startedAt),sec=Math.floor(elapsed/1000),time=`${String(Math.floor(sec/3600)).padStart(2,"0")}:${String(Math.floor(sec/60)%60).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;
            this.drawString(stack,"LIVE "+time,L.sideX+8,L.header+134,0xff7777);
        }

        // Transition strip.
        stack.fillStyle="#191b20";stack.fillRect(L.m,L.transitionY,L.previewW,20);
        this.drawString(stack,preview?.id===program?.id?"Preview is on Program":"Preview ready",L.m+5,L.transitionY+6,preview?.id===program?.id?0x8f949e:0xffcc66);

        // Docked panels.
        this.panel(stack,L.m,L.bottomY,L.scenesW,L.bottomH,"SCENES");
        this.panel(stack,L.m+L.scenesW,L.bottomY,L.sourcesW,L.bottomH,"SOURCES");
        this.panel(stack,L.m+L.scenesW+L.sourcesW,L.bottomY,L.mixerW,L.bottomH,"AUDIO MIXER");
        this.panel(stack,L.controlsX,L.bottomY,L.controlsW,L.bottomH,"CONTROLS");

        // Honest mixer: visual OBS treatment without pretending audio exists.
        const ax=L.m+L.scenesW+L.sourcesW+6,aw=Math.max(20,L.mixerW-12),ay=L.bottomY+23;
        this.drawString(stack,"Desktop Audio",ax,ay,0xbfc2c8);stack.fillStyle="#292c32";stack.fillRect(ax,ay+12,aw,7);stack.fillStyle="#555a63";stack.fillRect(ax+2,ay+14,Math.max(0,aw*.08),3);
        this.drawString(stack,"Mic/Aux",ax,ay+28,0xbfc2c8);stack.fillStyle="#292c32";stack.fillRect(ax,ay+40,aw,7);
        this.drawString(stack,"§8No audio sources",ax,L.bottomY+L.bottomH-13,0x777b84);

        super.drawScreen(stack,mx,my,pt);
    }
}
