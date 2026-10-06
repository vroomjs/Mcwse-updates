export default class DynamicFPS {
 constructor(mc){this.minecraft=mc;this.active=true;this.backgroundCap=5;this.originalCap=null;this.onVisibility=()=>this.apply();document.addEventListener('visibilitychange',this.onVisibility);window.addEventListener('blur',this.onVisibility);window.addEventListener('focus',this.onVisibility);this.apply();}
 apply(){if(!this.active)return;const s=this.minecraft.settings;if(document.hidden||!document.hasFocus()){if(this.originalCap===null)this.originalCap=s.fpsCap;s.fpsCap=this.backgroundCap;}else if(this.originalCap!==null){s.fpsCap=this.originalCap;this.originalCap=null;} }
 setEnabled(v){this.active=!!v;if(!this.active&&this.originalCap!==null){this.minecraft.settings.fpsCap=this.originalCap;this.originalCap=null;}this.apply();}
 dispose(){document.removeEventListener('visibilitychange',this.onVisibility);window.removeEventListener('blur',this.onVisibility);window.removeEventListener('focus',this.onVisibility);}
}
