import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";

export default class GuiCameraPermissions extends GuiScreen {
    constructor(previousScreen, clientId) {
        super(); this.previousScreen=previousScreen; this.clientId=clientId;
    }
    init(){
        super.init();
        const mp=this.minecraft.multiplayer, perms=mp.getPlayerPermissions(this.clientId);
        const cp=perms.camera || {see:false,edit:false,create:false,cut:false,stream:false,feeds:{}};
        const cx=this.width/2; let y=34;
        const toggle=(label,key)=>{ const b=new GuiButton(`${label}: ${cp[key]?"YES":"NO"}`,cx-100,y,200,20,()=>{mp.setCameraPermission(this.clientId,key,!cp[key]);this.init();});this.buttonList.push(b);y+=23; };
        toggle("See camera feeds","see");
        toggle("Edit cameras","edit");
        toggle("Create cameras","create");
        toggle("Cut to cameras","cut");
        toggle("Start/stop streaming","stream");
        y+=5;
        const cameras=[...mp.minecraft.cameraManager.staticCameras.values()];
        this.drawCameraCount=cameras.length;
        cameras.forEach(camera=>{
            const allowed=cp.feeds==="*"||!!cp.feeds?.[camera.id];
            this.buttonList.push(new GuiButton(`Feed: ${camera.name||camera.id}: ${allowed?"VISIBLE":"HIDDEN"}`,cx-100,y,200,20,()=>{
                const feeds=cp.feeds==="*"?{}:{...(cp.feeds||{})}; feeds[camera.id]=!allowed;
                mp.setCameraPermission(this.clientId,"feeds",feeds);this.init();
            })); y+=23;
        });
        this.buttonList.push(new GuiButton("Done",cx-100,this.height-30,200,20,()=>this.minecraft.displayScreen(this.previousScreen)));
    }
    drawScreen(stack,mouseX,mouseY,partialTicks){
        this.drawDefaultBackground(stack);
        const name=this.minecraft.multiplayer.presence[this.clientId]?.username||"Player";
        this.drawCenteredString(stack,"Camera Permissions: "+name,this.width/2,12);
        this.drawCenteredString(stack,"Choose what this player can control",this.width/2,23,0xAAAAAA);
        super.drawScreen(stack,mouseX,mouseY,partialTicks);
    }
}
