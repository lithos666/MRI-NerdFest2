import type {BufferGeometry} from "three";

/** Keep cached CPU geometry independent of renderer-specific GPU listeners.
 * Each mounted viewer owns one clone per source, even when another viewer
 * displays the same cached CAD at the same time. Disposing this owner cannot
 * invalidate that other viewer or erase the source's CPU attribute arrays. */
export function createAssemblyGeometryOwner(){
 const clones=new Map<BufferGeometry,BufferGeometry>();
 let disposed=false;
 return {
  get(source:BufferGeometry){
   if(disposed)throw new Error("Assembly geometry owner is disposed");
   let clone=clones.get(source);
   if(!clone){clone=source.clone();clones.set(source,clone);}
   return clone;
  },
  get size(){return clones.size;},
  dispose(){
   if(disposed)return;
   disposed=true;clones.forEach(geometry=>geometry.dispose());clones.clear();
  }
 };
}
