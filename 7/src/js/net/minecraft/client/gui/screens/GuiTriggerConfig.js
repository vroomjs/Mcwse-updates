import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiTextField from "../widgets/GuiTextField.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";

export default class GuiTriggerConfig extends GuiScreen {
 constructor(previous, triggerId=null){ super(); this.previousScreen=previous; this.triggerId=triggerId; }
 get trigger(){ return this.minecraft.cameraManager.triggerZones.get(this.triggerId); }
 init(){ super.init(); const z=this.trigger, cx=this.width/2; if(!z){this.minecraft.displayScreen(this.previousScreen);return;} let y=38;
  this.drawFields=[];
  this.idField=new GuiTextField(cx-110,y,220,20); this.idField.text=z.id; this.buttonList.push(this.idField); y+=25;
  this.buttonList.push(new GuiButton(`TYPE: ${String(z.type).toUpperCase()}`,cx-110,y,105,20,()=>{z.type=z.type==='enter'?'exit':'enter';this.init();}));
  this.buttonList.push(new GuiButton(z.enabled?'ENABLED':'DISABLED',cx+5,y,105,20,()=>{z.enabled=!z.enabled;this.init();})); y+=27;
  for(const axis of ['x','y','z']){const f=new GuiTextField(cx-110,y,90,20);f.text=String(z.position[axis]);this[axis+'Field']=f;this.buttonList.push(f);this.buttonList.push(new GuiButton(`POS ${axis.toUpperCase()}`,cx-10,y,110,20,()=>this.applyPosition()));y+=23;}
  for(const axis of ['x','y','z']){const f=new GuiTextField(cx-110,y,90,20);f.text=String(z.size[axis]);this['size'+axis]=f;this.buttonList.push(f);this.buttonList.push(new GuiButton(`SIZE ${axis.toUpperCase()}`,cx-10,y,110,20,()=>this.applySize()));y+=23;}
  this.addSlider('OPACITY',z.opacity,0,.8,y,v=>{z.opacity=v;});y+=25;
  this.addSlider('COOLDOWN',z.cooldown/1000,0,30,y,v=>{z.cooldown=v*1000;});y+=25;
  this.buttonList.push(new GuiButton('SAVE',cx-110,y,105,20,()=>{this.applyPosition();this.applySize();this.minecraft.displayScreen(this.previousScreen);}));
  this.buttonList.push(new GuiButton('DELETE',cx+5,y,105,20,()=>{this.minecraft.cameraManager.removeTrigger(z.id);this.minecraft.displayScreen(this.previousScreen);}));
 }
 addSlider(name,value,min,max,y,cb){this.buttonList.push(new GuiSliderButton(name,value,min,max,this.width/2-110,y,220,20,cb,.1).setDisplayNameBuilder((n,v)=>`${n}: ${v.toFixed(1)}`));}
 applyPosition(){const z=this.trigger;for(const a of ['x','y','z']){const n=Number(this[a+'Field'].getText());if(Number.isFinite(n))z.position[a]=n;}}
 applySize(){const z=this.trigger;for(const a of ['x','y','z']){const n=Number(this['size'+a].getText());if(Number.isFinite(n)&&n>0)z.size[a]=n;}}
 drawScreen(stack,mx,my,pt){this.drawDefaultBackground(stack);this.drawCenteredString(stack,'TRIGGER ZONE',this.width/2,10);this.drawCenteredString(stack,this.trigger?.id||'',this.width/2,23,0x888888);super.drawScreen(stack,mx,my,pt);}
}
