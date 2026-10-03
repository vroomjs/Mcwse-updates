import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiCameraConfig from "./GuiCameraConfig.js";

/**
 * OBS-inspired production desk built on the existing CameraManager. Offline,
 * source selection cues the preview and CUT promotes it to Program. While live,
 * source selection cuts directly so the single broadcast canvas and MediaStream
 * remain authoritative and viewers never reconnect.
 *
 * Layout notes: the engine's GUI scale pins the logical canvas near 240 tall as
 * the window grows, so a bigger window means a *shorter and wider* canvas, not
 * a roomier one. Everything below is therefore derived from a real vertical
 * budget -- nothing has a fixed minimum that can push the dock off-screen --
 * and the monitor tracks 16:9 so the feed fills it instead of sitting in
 * letterbox bars. On canvases wide enough for two dock columns the dock moves
 * beside the monitor rather than under it, which buys the preview back roughly
 * three times the picture area.
 */
export default class GuiCameraStudio extends GuiScreen {
    constructor(previousScreen=null) {
        super(); this.previousScreen=previousScreen; this.page=0; this.previewSourceId=null;
    }
    doesGuiPauseGame(){ return false; }
    cameraPermissions(){
        const mp=this.minecraft?.multiplayer;
        return mp?.cameraPermissions?.() || {see:true,edit:true,create:true,cut:true,stream:true,feeds:"*"};
    }
    canSeeSource(source){
        const cp=this.cameraPermissions();
        if(!cp.see || !source) return false;
        if(source.type!=="static") return true;
        return cp.feeds==="*" || !!cp.feeds?.[source.id];
    }
    isNonHost(){ const mp=this.minecraft?.multiplayer; return !!(mp?.connected && !mp.isHosting && !this.cameraPermissions().see); }

    static TITLE_H = 14;   // panel caption strip
    static ROW_H = 19;     // source list row pitch

    layout(){
        const W=this.width, H=this.height;
        const m=6, topBar=22, gap=3, transH=15, titleH=GuiCameraStudio.TITLE_H;
        const contentY=topBar+2;
        const contentH=Math.max(110, H-contentY-m);
        const usableW=W-m*2;
        const r=(x,y,w,h)=>({x:Math.round(x),y:Math.round(y),w:Math.max(1,Math.round(w)),h:Math.max(1,Math.round(h))});

        // Two dock columns need real width; below that the dock has to stay
        // underneath or the panels end up too short to hold their buttons.
        const wide = usableW>=540 && W/H>=1.95;
        const L={mode:wide?"wide":"stacked",m,gap,topBar,transH,titleH,contentY,contentH,usableW};

        // Guests get a deliberately minimal monitoring desk: no camera list,
        // controls, scenes, or mixer. They can see the program sidebar and a
        // preview only when the host is currently broadcasting their own POV.
        if(this.isNonHost()){
            const programW=Math.max(105,Math.floor(usableW*.30));
            const previewW=usableW-programW-gap;
            L.preview=r(m,contentY,previewW,contentH-20);
            L.program=r(m+previewW+gap,contentY,programW,contentH-20);
            L.controls=r(m,contentY+contentH-17,usableW,17);
            L.transition=r(m,contentY+contentH-17,0,1);
            L.scenes=L.sources=L.mixer=null;
            L.guest=true;
            return L;
        }

        if(wide){
            const previewH=Math.max(96,contentH-transH-gap);
            let previewW=Math.round((previewH-titleH-3)*16/9)+6;
            previewW=Math.max(200,Math.min(previewW,Math.floor(usableW*0.52)));
            L.preview=r(m,contentY,previewW,previewH);
            L.transition=r(m,contentY+previewH+gap,previewW,transH);

            const rx=m+previewW+gap, rw=W-rx-m;
            const c1=Math.floor((rw-gap)/2), c2w=rw-c1-gap, c2x=rx+c1+gap;
            const topH=Math.max(80,Math.floor(contentH*0.46));
            const restH=contentH-topH-gap;
            L.program=r(rx,contentY,c1,topH);
            L.sources=r(rx,contentY+topH+gap,c1,restH);

            const ctrlH=Math.max(90,Math.min(118,contentH-70));
            const rest2=contentH-ctrlH-gap;
            const scenesH=Math.max(34,Math.floor(rest2*0.52));
            L.controls=r(c2x,contentY,c2w,ctrlH);
            L.scenes=r(c2x,contentY+ctrlH+gap,c2w,scenesH);
            L.mixer=r(c2x,contentY+ctrlH+gap+scenesH+gap,c2w,rest2-scenesH-gap);
        } else {
            const avail=contentH-transH-gap*2;
            const DOCK_MIN=78, MON_MIN=84;
            let dockH=Math.max(DOCK_MIN,Math.round(avail*0.40));
            let previewH=avail-dockH;
            if(previewH<MON_MIN){
                previewH=Math.min(MON_MIN,Math.max(56,avail-DOCK_MIN));
                dockH=avail-previewH;
            }
            let previewW=Math.round((previewH-titleH-3)*16/9)+6;
            previewW=Math.max(Math.floor(usableW*0.32),Math.min(previewW,Math.floor(usableW*0.66)));
            L.preview=r(m,contentY,previewW,previewH);
            L.program=r(m+previewW+gap,contentY,W-(m+previewW+gap)-m,previewH);
            L.transition=r(m,contentY+previewH+gap,previewW,transH);

            const dockY=contentY+previewH+gap+transH+gap;
            const sW=Math.floor(usableW*0.16), srcW=Math.floor(usableW*0.34), mxW=Math.floor(usableW*0.16);
            L.scenes=r(m,dockY,sW,dockH);
            L.sources=r(m+sW,dockY,srcW,dockH);
            L.mixer=r(m+sW+srcW,dockY,mxW,dockH);
            L.controls=r(m+sW+srcW+mxW,dockY,usableW-sW-srcW-mxW,dockH);
        }
        return L;
    }

    /** Rows the source list can show, shared by init and the scroll handler. */
    visibleRows(L){
        return Math.max(1,Math.floor((L.sources.h-GuiCameraStudio.TITLE_H-24)/GuiCameraStudio.ROW_H));
    }

    init(){
        super.init();
        const cm=this.minecraft.cameraManager, L=this.layout();
        this.L=L;
        if(!this.previewSourceId || !cm.getSource(this.previewSourceId)) this.previewSourceId=cm.session.sourceId;
        cm.previewRequested=true; cm.previewSourceId=this.previewSourceId;
        const T=GuiCameraStudio.TITLE_H;

        if(this.isNonHost()){
            // Keep the stream control visible for parity, but it is inert for
            // guests. In particular, do not expose placement, properties, or
            // any camera/source rows that could reveal a trolling stream.
            const live=cm.session.active;
            const stream=new GuiButton(live?"§cSTOP STREAMING":"§aSTART STREAMING",L.controls.x+4,L.controls.y,Math.max(80,L.controls.w-8),15,()=>{});
            stream.setEnabled(false);
            this.buttonList.push(stream);
            return;
        }

        // Program/transition controls beneath the monitor.
        const cutW=Math.min(108,Math.max(66,Math.floor(L.preview.w*0.34)));
        this.buttonList.push(new GuiButton("CUT TO PROGRAM",L.preview.x+L.preview.w-cutW,L.transition.y,cutW,L.transH,()=>{
            if(cm.selectSource(this.previewSourceId)) this.init();
        }).setEnabled(this.cameraPermissions().cut));

        // One persistent scene for this MVP. Sources provide the switching.
        const sc=L.scenes, scInner=Math.max(28,sc.w-8);
        this.buttonList.push(new GuiButton(sc.w<90?"> Main":"> Main Broadcast",sc.x+4,sc.y+T+3,scInner,18,()=>{}));
        if(sc.h>=T+3+18+20) this.buttonList.push(new GuiButton("+",sc.x+4,sc.y+sc.h-19,22,16,()=>{this.minecraft.displayScreen(null);cm.startPlacement();}));

        // Source list: clicking cues PREVIEW, exactly like studio mode in OBS.
        const src=L.sources, sources=cm.listSources().filter(source=>this.canSeeSource(source));
        const visible=this.visibleRows(L);
        const pages=Math.max(1,Math.ceil(sources.length/visible)); this.page=Math.min(this.page,pages-1);
        const sourceX=src.x+4, sourceW=Math.max(44,src.w-8);
        sources.slice(this.page*visible,this.page*visible+visible).forEach((source,i)=>{
            const preview=source.id===this.previewSourceId, program=source.id===cm.session.sourceId;
            const type=source.type==="static"?"STATIC":source.type==="cameraman"?"CAM":"POV";
            const name=String(source.name||"Unnamed Camera");
            const label=sourceW<110?`${preview?">":" "}${program?"*":""} ${name}`:`${preview?">":" "}${program?" [PGM]":""} ${name} - ${type}`;
            this.buttonList.push(new GuiButton(label,sourceX,src.y+T+3+i*GuiCameraStudio.ROW_H,sourceW,17,()=>{
                this.previewSourceId=source.id;cm.previewSourceId=source.id;if(cm.session.active)cm.selectSource(source.id);this.init();
            }));
        });
        const preview=cm.getSource(this.previewSourceId);
        const isStatic=preview?.type==="static";
        const sf=src.y+src.h-19;
        const cp=this.cameraPermissions();
        this.buttonList.push(new GuiButton("ADD",sourceX,sf,Math.max(24,Math.floor(sourceW*0.30)),16,()=>{this.minecraft.displayScreen(null);cm.startPlacement();}).setEnabled(cp.create));
        this.buttonList.push(new GuiButton(sourceW<120?"PROPS":"PROPERTIES",sourceX+Math.floor(sourceW*0.32),sf,Math.max(38,Math.floor(sourceW*0.40)),16,()=>{
            if(isStatic)this.minecraft.displayScreen(new GuiCameraConfig(this,preview.id));
        }).setEnabled(isStatic&&cp.edit));
        this.buttonList.push(new GuiButton("-",sourceX+Math.floor(sourceW*0.76),sf,Math.max(18,Math.floor(sourceW*0.24)),16,()=>{
            if(isStatic)this.minecraft.displayScreen(new GuiCameraConfig(this,preview.id,true));
        }).setEnabled(isStatic&&cp.edit));

        // Production controls. Four stacked buttons need ~105px; when the dock
        // is shorter than that they fold into a 2x2 grid with short labels.
        const c=L.controls, live=cm.session.active, camOn=this.minecraft.player.isCameraman;
        const stack=c.h>=T+3+4*21+4;
        const onStream=()=>{cm.setBroadcasting(!live);this.init();};
        const onCam=()=>{this.minecraft.setCameramanEnabled(!camOn);this.init();};
        const onPlace=()=>{this.minecraft.displayScreen(null);cm.startPlacement();};
        const onExit=()=>this.minecraft.displayScreen(this.previousScreen);
        if(stack){
            const cx=c.x+4, cw=Math.max(40,c.w-8); let cy=c.y+T+3;
            this.buttonList.push(new GuiButton(live?"§cSTOP STREAMING":"§aSTART STREAMING",cx,cy,cw,19,onStream)); cy+=21;
            this.buttonList.push(new GuiButton(camOn?"CAMERAMAN ON":"CAMERAMAN OFF",cx,cy,cw,19,onCam)); cy+=21;
            this.buttonList.push(new GuiButton("PLACE CAMERA",cx,cy,cw,19,onPlace));
            this.buttonList.push(new GuiButton("EXIT STUDIO",cx,c.y+c.h-20,cw,17,onExit));
        } else {
            const cx=c.x+4, cw=Math.max(30,Math.floor((c.w-11)/2)), cx2=cx+cw+3;
            const ry=c.y+T+3, ry2=Math.min(ry+20,c.y+c.h-20);
            const wide=cw>=70;
            this.buttonList.push(new GuiButton(live?(wide?"§cSTOP STREAM":"§cSTOP"):(wide?"§aSTART STREAM":"§aSTREAM"),cx,ry,cw,18,onStream));
            this.buttonList.push(new GuiButton(camOn?(wide?"CAMERAMAN ON":"CAM ON"):(wide?"CAMERAMAN OFF":"CAM OFF"),cx2,ry,cw,18,onCam));
            this.buttonList.push(new GuiButton(wide?"PLACE CAMERA":"PLACE",cx,ry2,cw,18,onPlace));
            this.buttonList.push(new GuiButton(wide?"EXIT STUDIO":"EXIT",cx2,ry2,cw,18,onExit));
        }
    }

    handleMouseScroll(delta){
        const cm=this.minecraft.cameraManager,L=this.L||this.layout(),visible=this.visibleRows(L);
        const pages=Math.max(1,Math.ceil(cm.listSources().length/visible));
        if(pages>1){this.page=(this.page+(delta>0?-1:1)+pages)%pages;this.init();}
    }
    onClose(){if(this.minecraft?.cameraManager){this.minecraft.cameraManager.previewRequested=false;this.minecraft.cameraManager.previewSourceId=null;}}

    panel(stack,rect,title){
        const {x,y,w,h}=rect;
        stack.fillStyle="#17191e";stack.fillRect(x,y,w,h);stack.strokeStyle="#3a3d45";stack.strokeRect(x+.5,y+.5,w-1,h-1);
        stack.fillStyle="#23262c";stack.fillRect(x+1,y+1,w-2,GuiCameraStudio.TITLE_H-1);
        this.drawString(stack,title,x+5,y+4,0xd6d6d8);
    }

    /** Label/value pairs for PROGRAM, flowed into however many columns fit. */
    drawProgramInfo(stack,rect,cm,live){
        const program=cm.getSource(cm.session.sourceId);
        const rows=[
            [null,live?"§c● LIVE":"§7OFFLINE",live?0xff5555:0xaaaaaa],
            ["Program:",program?.name||"No Source",0xffffff],
            ["Type:",program?.type?.toUpperCase()||"—",0xffffff]
        ];
        if(live&&this.minecraft.multiplayer?.lanCode) rows.push(["Code:",this.minecraft.multiplayer.lanCode,0xb4b7bd]);
        rows.push(["Viewers:",String(this.minecraft.broadcastMedia?.viewers?.size||0),0xb4b7bd]);
        if(live&&this.minecraft.broadcastMedia?.metadata?.startedAt){
            const sec=Math.floor(Math.max(0,Date.now()-this.minecraft.broadcastMedia.metadata.startedAt)/1000);
            rows.push(["Uptime:",`${String(Math.floor(sec/3600)).padStart(2,"0")}:${String(Math.floor(sec/60)%60).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`,0xff7777]);
        }
        const availH=rect.h-GuiCameraStudio.TITLE_H-8, rowH=11;
        const maxRows=Math.max(1,Math.floor(availH/rowH));
        // Spread across as many columns as the width affords, then centre the
        // block vertically, so a wide panel reads as laid out rather than as
        // one short list clinging to the top-left corner.
        const cols=Math.max(1,Math.min(rows.length,Math.floor((rect.w-10)/100),Math.ceil(rows.length/1)));
        const perCol=Math.max(1,Math.min(maxRows,Math.ceil(rows.length/cols)));
        const colW=Math.floor((rect.w-10)/cols);
        const top=rect.y+GuiCameraStudio.TITLE_H+4+Math.max(0,Math.floor((availH-perCol*rowH)/2));
        rows.forEach((row,i)=>{
            const col=Math.min(cols-1,Math.floor(i/perCol)), idx=i-col*perCol;
            if(idx>=perCol) return;
            const x=rect.x+6+col*colW, y=top+idx*rowH;
            if(y+8>rect.y+rect.h) return;
            if(row[0]){
                this.drawString(stack,row[0],x,y,0x8f949e);
                this.drawString(stack,String(row[1]),x+Math.min(52,Math.floor(colW*0.46)),y,row[2]);
            } else {
                this.drawString(stack,String(row[1]),x,y,row[2]);
            }
        });
    }

    drawScreen(stack,mx,my,pt){
        const cm=this.minecraft.cameraManager,L=this.layout(),live=cm.session.active;
        this.L=L;
        const T=GuiCameraStudio.TITLE_H;
        stack.fillStyle="#101216";stack.fillRect(0,0,this.width,this.height);
        stack.fillStyle="#202329";stack.fillRect(0,0,this.width,L.topBar);
        this.drawString(stack,"MINEWATCH STUDIO",8,7,0xe6e6e8);
        this.drawString(stack,live?"§cLIVE":"§7OFFLINE",this.width-58,7,live?0xff5555:0xaaaaaa);

        if(this.isNonHost()){
            const T=GuiCameraStudio.TITLE_H;
            this.panel(stack,L.preview,"PREVIEW");
            this.panel(stack,L.program,"PROGRAM");
            const vx=L.preview.x+3,vy=L.preview.y+T+3,vw=L.preview.w-6,vh=L.preview.h-T-6;
            stack.fillStyle="#08090b";stack.fillRect(vx,vy,vw,vh);
            const peerId=this.minecraft.multiplayer?.peer?.id;
            const ownSourceId=peerId?`player:${peerId}`:"player:local";
            const canSeePreview=cm.session.sourceId===ownSourceId;
            if(canSeePreview){
                const canvas=cm.getBroadcastCanvas();
                if(canvas?.width){
                    const scale=Math.min(vw/canvas.width,vh/canvas.height);
                    const dw=Math.floor(canvas.width*scale),dh=Math.floor(canvas.height*scale);
                    stack.drawImage(canvas,vx+Math.floor((vw-dw)/2),vy+Math.floor((vh-dh)/2),dw,dh);
                }
            }else{
                this.drawString(stack,"[HIDDEN]",vx+Math.max(4,Math.floor(vw/2)-28),vy+Math.floor(vh/2)-4,0xff3333);
            }
            this.drawProgramInfo(stack,L.program,cm,live);
            this.panel(stack,L.controls,"CONTROLS");
            super.drawScreen(stack,mx,my,pt);
            return;
        }

        // Preview monitor.
        this.panel(stack,L.preview,"PREVIEW");
        const vx=L.preview.x+3,vy=L.preview.y+T+3,vw=L.preview.w-6,vh=L.preview.h-T-6;
        stack.fillStyle="#000";stack.fillRect(vx,vy,vw,vh);
        const canvas=cm.getBroadcastCanvas();
        if(canvas?.width){
            const scale=Math.min(vw/canvas.width,vh/canvas.height);
            const dw=Math.floor(canvas.width*scale),dh=Math.floor(canvas.height*scale);
            stack.drawImage(canvas,vx+Math.floor((vw-dw)/2),vy+Math.floor((vh-dh)/2),dw,dh);
        }
        const preview=cm.getSource(this.previewSourceId);
        if(preview)this.drawString(stack,preview.name||"Camera",vx+5,vy+5,0xffffff);

        // Program monitor / status.
        this.panel(stack,L.program,"PROGRAM");
        this.drawProgramInfo(stack,L.program,cm,live);

        // Transition strip.
        const program=cm.getSource(cm.session.sourceId);
        stack.fillStyle="#191b20";stack.fillRect(L.transition.x,L.transition.y,L.transition.w,L.transition.h);
        const onAir=preview?.id===program?.id;
        this.drawString(stack,onAir?"Preview is on Program":"Preview ready",L.transition.x+5,L.transition.y+4,onAir?0x8f949e:0xffcc66);

        // Docked panels.
        this.panel(stack,L.scenes,"SCENES");
        this.panel(stack,L.sources,"SOURCES");
        this.panel(stack,L.mixer,L.mixer.w<90?"AUDIO":"AUDIO MIXER");
        this.panel(stack,L.controls,"CONTROLS");

        // Honest mixer: visual OBS treatment without pretending audio exists.
        const mx0=L.mixer.x+6,aw=Math.max(16,L.mixer.w-12),ay=L.mixer.y+T+5;
        if(L.mixer.h>T+22){
            this.drawString(stack,"Desktop Audio",mx0,ay,0xbfc2c8);
            stack.fillStyle="#292c32";stack.fillRect(mx0,ay+11,aw,6);
            stack.fillStyle="#555a63";stack.fillRect(mx0+2,ay+13,Math.max(0,aw*0.08),2);
        }
        if(L.mixer.h>T+48){
            this.drawString(stack,"Mic/Aux",mx0,ay+25,0xbfc2c8);
            stack.fillStyle="#292c32";stack.fillRect(mx0,ay+36,aw,6);
        }
        if(L.mixer.h>T+62)this.drawString(stack,"§8No audio sources",mx0,L.mixer.y+L.mixer.h-12,0x777b84);

        super.drawScreen(stack,mx,my,pt);
    }
}
