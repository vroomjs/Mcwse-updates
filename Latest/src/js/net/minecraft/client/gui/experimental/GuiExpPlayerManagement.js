import GuiScreen from "../GuiScreen.js";
import GuiExpButton from "./GuiExpButton.js";
import ExpTheme from "./ExpTheme.js";

export default class GuiExpPlayerManagement extends GuiScreen {
    constructor(previousScreen,clientId){super();this.previousScreen=previousScreen;this.clientId=clientId;}
    init(){
        super.init();const mp=this.minecraft.multiplayer, p=mp.getPlayerPermissions(this.clientId),cx=this.width/2;const cp=p.camera||{};let y=36;
        const toggle=(label,key)=>{this.buttonList.push(new GuiExpButton(`${label}: ${cp[key]?"YES":"NO"}`,cx-100,y,200,18,()=>{mp.setCameraPermission(this.clientId,key,!cp[key]);this.init();}));y+=21;};
        const producer=mp.isCoProducer(this.clientId);
        this.buttonList.push(new GuiExpButton(producer?"Remove Co Producer":"Make Co Producer",cx-100,y,178,18,()=>{producer?mp.removeCoProducer(this.clientId):mp.makeCoProducer(this.clientId);this.init();}));
        if(producer)this.buttonList.push(new GuiExpButton("✎",cx+82,y,18,18,()=>import("./GuiExpCameraPermissions.js").then(m=>this.minecraft.displayScreen(new m.default(this,this.clientId)))));
        y+=25;
        toggle("See camera feeds","see");toggle("Edit cameras","edit");toggle("Create cameras","create");toggle("Cut to cameras","cut");toggle("Start/stop streaming","stream");
        this.buttonList.push(new GuiExpButton("Back",cx-100,this.height-28,200,18,()=>this.minecraft.displayScreen(this.previousScreen)));
    }
    drawScreen(stack,mx,my,pt){this.drawDefaultBackground(stack);ExpTheme.dim(this,stack,this.width,this.height,.28);const n=this.minecraft.multiplayer.presence[this.clientId]?.username||"Player";this.drawCenteredString(stack,"MANAGE: "+n,this.width/2,12);super.drawScreen(stack,mx,my,pt);}
}
