import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiTextField from "../widgets/GuiTextField.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";
import GuiExpButton from "../experimental/GuiExpButton.js";
import GuiExpSlider from "../experimental/GuiExpSlider.js";

export default class GuiCameraConfig extends GuiScreen {
    constructor(previousScreen,cameraId,confirmDelete=false){super();this.previousScreen=previousScreen;this.cameraId=cameraId;this.confirmDelete=confirmDelete;}
    doesGuiPauseGame(){return false;}
    init(){
        super.init(); const c=this.camera, cx=this.width/2;if(!c){this.minecraft.displayScreen(this.previousScreen);return;}
        this.minecraft.cameraManager.previewRequested=true;
        this.minecraft.cameraManager.previewSourceId=this.cameraId;
        let y=42;
        const types=['static','chase'];
        this.buttonList.push(new GuiButton(`TYPE: ${String(c.type).toUpperCase()}`,cx-120,y,240,20,()=>{c.type=types[(types.indexOf(c.type)+1)%types.length];this.minecraft.cameraManager.updateCamera(c.id,{type:c.type});this.init();})); y+=26;
        this.targetField=new GuiTextField(cx-120,y,170,20);this.targetField.text=c.target||'';this.targetField.maxLength=40;this.buttonList.push(this.targetField);
        this.buttonList.push(new GuiButton('SET TARGET',cx+54,y,66,20,()=>{this.minecraft.cameraManager.updateCamera(c.id,{target:this.targetField.getText().trim()||null});})); y+=27;
        this.nameField=new GuiTextField(cx-120,y,170,20);this.nameField.text=c.name;this.nameField.maxLength=40;this.buttonList.push(this.nameField);
        this.buttonList.push(new GuiButton("SAVE NAME",cx+54,y,66,20,()=>{this.applyName();}));y+=27;
        this.addSlider("FOV",c.fov,30,120,y,1,v=>this.update({fov:v}));y+=24;
        this.addSlider("YAW",c.yaw,-180,180,y,1,v=>this.update({yaw:v}));y+=24;
        this.addSlider("PITCH",c.pitch,-90,90,y,1,v=>this.update({pitch:v}));y+=24;
        this.addSlider("ROLL",c.roll,-180,180,y,1,v=>this.update({roll:v}));y+=28;
        for(const axis of ["x","y","z"]){
            const f=new GuiTextField(cx-120,y,76,20);f.text=Number(c.position[axis]).toFixed(2);f.maxLength=14;this[axis+"Field"]=f;this.buttonList.push(f);
            this.buttonList.push(new GuiButton(`SET ${axis.toUpperCase()}`,cx-40,y,70,20,()=>this.applyPosition()));y+=23;
        }
        const dynamic=c.type==='chase';
        if(dynamic){this.addSlider('DISTANCE',Number(c.settings.distance??6),1,30,y,v=>this.update({settings:{...c.settings,distance:v}}));y+=24;this.addSlider('HEIGHT',Number(c.settings.height??3),0,15,y,v=>this.update({settings:{...c.settings,height:v}}));y+=24;this.addSlider('SMOOTHNESS',Number(c.settings.smoothness??.15),.02,1,y,v=>this.update({settings:{...c.settings,smoothness:v}}));y+=24;}
        this.buttonList.push(new GuiButton(c.online?"ONLINE: YES":"ONLINE: NO",cx+35,y-69,85,20,()=>{this.update({online:!c.online});this.init();}));
        this.buttonList.push(new GuiButton(`${c.switchBackOnRender?"[X]":"[ ]"} Switch back on render`,cx-120,y+2,240,20,()=>{this.update({switchBackOnRender:!c.switchBackOnRender});this.init();}));y+=23;
        this.buttonList.push(new GuiButton("MAKE BROADCAST SOURCE",cx-120,y+2,240,20,()=>{this.applyAll();this.minecraft.cameraManager.selectSource(c.id);this.init();}));y+=26;
        this.buttonList.push(new GuiButton(this.confirmDelete?"§4CONFIRM DELETE":"§cDELETE CAMERA",cx-120,y,117,20,()=>{if(!this.confirmDelete){this.confirmDelete=true;this.init();}else{this.minecraft.cameraManager.removeCamera(c.id);this.minecraft.displayScreen(this.previousScreen);}}));
        this.buttonList.push(new GuiButton("DONE",cx+3,y,117,20,()=>{this.applyAll();this.minecraft.displayScreen(this.previousScreen);}));
        // Use the experimental widget language for camera properties without
        // changing the surrounding screen theme.
        this.buttonList=this.buttonList.map(b=>{
            if(b instanceof GuiSliderButton){const slider=new GuiExpSlider(b.x,b.y,b.width,b.height,b.value,b.min,b.max,b.step,v=>{b.value=v;b.string=b.getDisplayName(b.settingName,v);b.callback();},v=>b.getDisplayName(b.settingName,v));slider.settingName=b.settingName;return slider;}
            if(b instanceof GuiButton && !(b instanceof GuiTextField))return new GuiExpButton(b.string,b.x,b.y,b.width,b.height,b.callback,{variant:'dark'}).setEnabled(b.enabled);
            return b;
        });
    }
    get camera(){return this.minecraft?.cameraManager?.staticCameras.get(this.cameraId);}
    update(data){this.minecraft.cameraManager.updateCamera(this.cameraId,data);}
    applyName(){const name=this.nameField.getText().trim();if(name)this.update({name});}
    applyPosition(){const c=this.camera,p={...c.position};for(const a of ["x","y","z"]){const n=Number(this[a+"Field"].getText());if(Number.isFinite(n))p[a]=n;}this.update({position:p});}
    applyAll(){this.applyName();this.applyPosition();}
    addSlider(name,value,min,max,y,step,cb){const s=new GuiSliderButton(name,value,min,max,this.width/2-120,y,240,20,cb,step).setDisplayNameBuilder((n,v)=>`${n}: ${Math.round(v)}°`);this.buttonList.push(s);}
    onClose(){if(this.minecraft?.cameraManager){this.minecraft.cameraManager.previewRequested=false;this.minecraft.cameraManager.previewSourceId=null;}}
    addSlider(name,value,min,max,y,cb){this.buttonList.push(new GuiSliderButton(name,value,min,max,this.width/2-120,y,240,20,cb,.05).setDisplayNameBuilder((n,v)=>`${n}: ${v.toFixed(2)}`));}
    drawScreen(stack,mx,my,pt){
        if(this.experimental){stack.fillStyle="#0b1623";stack.fillRect(0,0,this.width,this.height);stack.fillStyle="#123b5b";stack.fillRect(0,0,this.width,30);stack.fillStyle="#7ddcff";stack.fillRect(0,28,this.width,2);this.drawCenteredString(stack,"MCWSE PREVIEW  /  CAMERA SETTINGS",this.width/2,10,0xd8f5ff);}else this.drawDefaultBackground(stack);this.drawCenteredString(stack,this.experimental?"CAMERA SETTINGS":"§lCAMERA SETTINGS",this.width/2,10);const c=this.camera;
        if(c){this.drawCenteredString(stack,c.id,this.width/2,22,0x777777);this.drawString(stack,"NAME",this.width/2-120,33,0xaaaaaa);this.drawString(stack,"POSITION",this.width/2-120,164,0xaaaaaa);if(c.id===this.minecraft.cameraManager.session.sourceId)this.drawString(stack,"§eACTIVE SOURCE",this.width/2+35,187,0xffff55);}
        const pw=Math.min(180,Math.max(120,Math.floor(this.width*.28))),ph=Math.round(pw*9/16),px=this.width-pw-8,py=this.height-ph-8;
        stack.fillStyle="#05070a";stack.fillRect(px-2,py-12,pw+4,ph+14);stack.strokeStyle="#66ccff";stack.strokeRect(px-2,py-2,pw+4,ph+4);
        const preview=this.minecraft.cameraManager.getBroadcastCanvas();if(preview?.width)stack.drawImage(preview,px,py,pw,ph);
        this.drawString(stack,"CAMERA PREVIEW",px,py-10,0x66ccff);
        super.drawScreen(stack,mx,my,pt);
    }
}
