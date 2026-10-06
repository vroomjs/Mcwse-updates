export default class MemoryLeakFix {
 constructor(mc){this.minecraft=mc;this.enabled=true;this.lastWorld=null;}
 setEnabled(v){this.enabled=!!v;}
 onWorldChange(world){if(!this.enabled)return;this.lastWorld=world;}
 cleanup(){if(!this.enabled)return;const cm=this.minecraft.cameraManager;cm?.signalCanvas?.getContext?.('2d')?.clearRect(0,0,160,90);}
}
