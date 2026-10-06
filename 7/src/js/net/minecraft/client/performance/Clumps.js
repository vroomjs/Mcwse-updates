export default class Clumps {
 constructor(mc){this.minecraft=mc;this.enabled=true;this.radius=1.5;}
 setEnabled(v){this.enabled=!!v;}
 merge(items=[]){if(!this.enabled)return items;const out=[];for(const item of items){const same=out.find(x=>x.blockId===item.blockId&&Math.hypot(x.x-item.x,x.y-item.y,x.z-item.z)<=this.radius);if(same){same.count=(same.count||0)+(item.count||0);item.dead=true;}else out.push(item);}return out.filter(x=>!x.dead);}
}
