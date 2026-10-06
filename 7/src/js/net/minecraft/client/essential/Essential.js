export default class Essential {
 constructor(mc){this.minecraft=mc;this.enabled=true;}
 setEnabled(v){this.enabled=!!v;}
 openSocial(){this.minecraft.addMessageToChat('§bEssential social features are available through multiplayer and chat.');}
}
