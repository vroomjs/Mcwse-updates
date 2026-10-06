export default class EnhancedBlockEntities {
 constructor(mc){this.minecraft=mc;this.enabled=true;this.cache=new Map();}
 setEnabled(v){this.enabled=!!v;if(!this.enabled)this.clear();}
 clear(){for(const o of this.cache.values())o?.dispose?.();this.cache.clear();}
 getKey(x,y,z,id){return `${x},${y},${z},${id}`;}
 // Browser port hook for reusing static block-entity render data instead of
 // rebuilding equivalent meshes every frame.
 remember(key,value){if(this.enabled&&!this.cache.has(key))this.cache.set(key,value);return this.cache.get(key)||value;}
}
