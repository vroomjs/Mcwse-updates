import GuiScreen from "../GuiScreen.js";
import GuiExpButton from "./GuiExpButton.js";
import ExpTheme from "./ExpTheme.js";

export default class GuiExpManageLAN extends GuiScreen {
    constructor(previousScreen){super();this.previousScreen=previousScreen;}
    init(){
        super.init(); const mp=this.minecraft.multiplayer, cx=this.width/2; const players=[...mp.connections.keys()];
        this.buttonList.push(new GuiExpButton("Regenerate Code",cx-105,28,100,18,()=>{mp.disconnect();mp.host(this.minecraft.world);}));
        this.buttonList.push(new GuiExpButton("Close LAN",cx+5,28,100,18,()=>{mp.disconnect();this.minecraft.displayScreen(this.previousScreen);}));
        let y=60;
        players.forEach(id=>{
            const name=mp.presence[id]?.username||`Guest (${id.slice(0,4)})`;
            this.buttonList.push(new GuiExpButton(name,cx-105,y,210,20,()=>import("./GuiExpPlayerManagement.js").then(m=>this.minecraft.displayScreen(new m.default(this,id)))));
            y+=24;
        });
        if(!players.length)this.empty="No players connected.";
        const rules=this.minecraft.world?.gameRules;
        this.buttonList.push(new GuiExpButton(`PVP: ${rules?.pvp===false?"OFF":"ON"}`,cx-105,this.height-54,100,18,()=>{
            const next=this.minecraft.world.gameRules.pvp===false;this.minecraft.world.gameRules.pvp=next;mp.broadcast({type:"gamerules",gr:{pvp:next}});this.init();
        }));
        this.buttonList.push(new GuiExpButton("Done",cx+5,this.height-54,100,18,()=>this.minecraft.displayScreen(this.previousScreen)));
    }
    drawScreen(stack,mx,my,pt){
        this.drawDefaultBackground(stack);ExpTheme.dim(this,stack,this.width,this.height,.28);
        this.drawCenteredString(stack,"MANAGE LAN",this.width/2,10);
        this.drawCenteredString(stack,"World code: "+(this.minecraft.multiplayer.lanCode||"—"),this.width/2,20,0x55FF55);
        if(this.empty)this.drawCenteredString(stack,this.empty,this.width/2,this.height/2,0xAAAAAA);
        super.drawScreen(stack,mx,my,pt);
    }
}
