import GuiCameraStudio from "../screens/GuiCameraStudio.js";
import GuiExpButton from "./GuiExpButton.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiTextField from "../widgets/GuiTextField.js";
import GuiSliderButton from "../widgets/GuiSliderButton.js";
import GuiExpSlider from "./GuiExpSlider.js";
/** Experimental-themed entry point using the existing Camera Studio engine. */
export default class GuiExpCameraStudio extends GuiCameraStudio {
    constructor(previous=null){super(previous);this.experimental=false;}
    init(){super.init();this.buttonList=this.buttonList.map(b=>{
            if(b instanceof GuiSliderButton){const slider=new GuiExpSlider(b.x,b.y,b.width,b.height,b.value,b.min,b.max,b.step,v=>{b.value=v;b.string=b.getDisplayName(b.settingName,v);b.callback();},v=>b.getDisplayName(b.settingName,v));slider.settingName=b.settingName;return slider;}
            if(b instanceof GuiButton && !(b instanceof GuiExpButton)) return new GuiExpButton(b.string,b.x,b.y,b.width,b.height,b.callback,{variant:'dark'}).setEnabled(b.enabled);
            return b;
        });}
    drawScreen(stack,mx,my,pt){
        super.drawScreen(stack,mx,my,pt);
    }
}
