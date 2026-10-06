export default class SoundPhysicsRemastered {
 constructor(mc){this.minecraft=mc;this.enabled=true;this.reverb=0;}
 setEnabled(v){this.enabled=!!v;}
 // Browser-safe approximation: expose an audio-effects switch to existing
 // SoundManager consumers without replacing the game's audio pipeline.
 getOptions(){return {enabled:this.enabled,reverb:this.reverb};}
}
