import GuiScreen from "../GuiScreen.js";
import GuiExpButton from "./GuiExpButton.js";
import ExpTheme from "./ExpTheme.js";

export default class GuiExpCameraPermissions extends GuiScreen {
    constructor(previousScreen,clientId){super();this.previousScreen=previousScreen;this.clientId=clientId;}
    init(){
        super.init();const mp=this.minecraft.multiplayer,p=mp.getPlayerPermissions(this.clientId),cp=p.camera||{},cx=this.width/2;let y=34;
        const cams=[...this.minecraft.cameraManager.staticCameras.values()];
        cams.forEach(c=>{const on=cp.feeds==="*"||!!cp.feeds?.[c.id];this.buttonList.push(new GuiExpButton(`${c.name||c.id}: ${on?"VISIBLE":"HIDDEN"}`,cx-110,y,220,18,()=>{const feeds=cp.feeds==="*"?{}:{...(cp.feeds||{})};feeds[c.id]=!on;mp.setCameraPermission(this.clientId,"feeds",feeds);this.init();}));y+=21;});
        this.buttonList.push(new GuiExpButton("Back",cx-100,this.height-28,200,18,()=>this.minecraft.displayScreen(this.previousScreen)));
    }
    drawScreen(stack,mx,my,pt){this.drawDefaultBackground(stack);ExpTheme.dim(this,stack,this.width,this.height,.28);this.drawCenteredString(stack,"CAMERA FEEDS",this.width/2,12);this.drawCenteredString(stack,"Choose which feeds are visible",this.width/2,22,0xAAAAAA);super.drawScreen(stack,mx,my,pt);}
}
