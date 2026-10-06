export default class DistantHorizons {
 constructor(mc){this.minecraft=mc;this.enabled=true;this.horizonDistance=256;this.lodStep=8;this.cache=new Map();}
 setEnabled(v){this.enabled=!!v;}
 clear(){this.cache.clear();}
 // Browser-safe LOD hook. WorldRenderer can use this budget to build coarse
 // far terrain without generating full-detail chunks.
 getConfig(){return {enabled:this.enabled,distance:this.horizonDistance,step:this.lodStep};}
}
