import GuiCameraConfig from "../screens/GuiCameraConfig.js";
import GuiExpButton from "./GuiExpButton.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiTextField from "../widgets/GuiTextField.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";
import GuiExpSlider from "./GuiExpSlider.js";
/** Experimental-themed camera settings, preserving the existing config logic. */
export default class GuiExpCameraSettings extends GuiCameraConfig {
    constructor(previous,id,del=false){super(previous,id,del);this.experimental=false;}
    init(){super.init();this.buttonList=this.buttonList.map(b=>{
            if(b instanceof GuiSliderButton){const slider=new GuiExpSlider(b.x,b.y,b.width,b.height,b.value,b.min,b.max,b.step,v=>{b.value=v;b.string=b.getDisplayName(b.settingName,v);b.callback();},v=>b.getDisplayName(b.settingName,v));slider.settingName=b.settingName;return slider;}
            if(b instanceof GuiButton && !(b instanceof GuiExpButton)) return new GuiExpButton(b.string,b.x,b.y,b.width,b.height,b.callback,{variant:'dark'}).setEnabled(b.enabled);
            return b;
        });}
    drawScreen(stack,mx,my,pt){
        super.drawScreen(stack,mx,my,pt);
    }
}
