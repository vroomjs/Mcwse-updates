import GuiMods from "../screens/GuiMods.js";
import GuiButton from "../widgets/GuiButton.js";
import GuiExpButton from "./GuiExpButton.js";

/** Full-screen experimental mod manager. Reuses the classic storage/actions. */
export default class GuiExpMods extends GuiMods {
    constructor(previous){super(previous);this.experimental=true;}
    init(){
        super.init();
        this.buttonList=this.buttonList.map(b=>b instanceof GuiButton ? new GuiExpButton(b.string,b.x,b.y,b.width,b.height,b.callback,{variant:'dark'}).setEnabled(b.enabled) : b);
    }
    drawScreen(stack,mx,my,pt){
        stack.fillStyle="#101216";stack.fillRect(0,0,this.width,this.height);
        stack.fillStyle="#202329";stack.fillRect(0,0,this.width,30);
        stack.fillStyle="#6bdcff";stack.fillRect(0,28,this.width,2);
        this.drawString(stack,"MCWSE PREVIEW  /  MODS",10,9,0xd8f5ff);
        super.drawScreen(stack,mx,my,pt);
    }
}
