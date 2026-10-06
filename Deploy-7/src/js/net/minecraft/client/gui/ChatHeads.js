export default class ChatHeads {
 constructor(mc){this.minecraft=mc;this.enabled=true;}
 setEnabled(v){this.enabled=!!v;}
 getHead(player){return this.enabled?(player?.skin||this.minecraft.settings?.skin||null):null;}
}
