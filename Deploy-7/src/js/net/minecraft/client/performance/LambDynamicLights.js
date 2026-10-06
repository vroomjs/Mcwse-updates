export default class LambDynamicLights {
 constructor(mc){this.minecraft=mc;this.enabled=true;this.lightLevel=12;}
 setEnabled(v){this.enabled=!!v;}
 // Browser port hook: the renderer already owns the light engine; this flag
 // lets dynamic held-item/entity light consumers share one lightweight switch.
 getLightLevel(entity){if(!this.enabled||!entity)return 0;const id=entity.inventory?.getItemInSelectedSlot?.()||0;return [50,76,89,91,169].includes(id)?this.lightLevel:0;}
}
