export default class Zoomify {
 constructor(mc){this.minecraft=mc;this.enabled=true;this.active=false;this.normalFov=null;}
 setEnabled(v){this.enabled=!!v;if(!this.enabled)this.end();}
 start(){if(!this.enabled||this.active)return;this.active=true;this.normalFov=this.minecraft.settings.fov;this.minecraft.settings.fov=Math.max(15,this.normalFov*.35);}
 end(){if(!this.active)return;this.active=false;if(this.normalFov!==null)this.minecraft.settings.fov=this.normalFov;this.normalFov=null;}
 toggle(){this.active?this.end():this.start();}
}
