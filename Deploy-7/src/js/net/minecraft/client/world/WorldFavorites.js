export default class WorldFavorites {
 constructor(){try{this.ids=new Set(JSON.parse(localStorage.getItem('mc_cherished_worlds')||'[]'));}catch(_){this.ids=new Set();}}
 has(id){return this.ids.has(id);}
 toggle(id){if(this.ids.has(id))this.ids.delete(id);else this.ids.add(id);localStorage.setItem('mc_cherished_worlds',JSON.stringify([...this.ids]));}
}
