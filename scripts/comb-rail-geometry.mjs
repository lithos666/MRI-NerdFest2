import * as THREE from 'three';
import assert from 'node:assert/strict';

/** Direct sections of the verified source rack mesh, not a new manufacturing CAD. */
export function sourceRailSections(positions,indices){
 const point=i=>positions.slice(i*3,i*3+3),round=v=>Math.round(v*1e5)/1e5,key=p=>p.map(round).join(',');
 function loopsFromEdges(edges){
  const unique=new Map();for(const[a,b]of edges){const x=key(a),y=key(b);if(x===y)continue;const k=[x,y].sort().join('|');if(!unique.has(k))unique.set(k,{a:a.map(round),b:b.map(round),count:1});else unique.get(k).count++;}
  const active=[...unique.values()].filter(e=>e.count%2),map=new Map();for(const e of active)for(const[a,b]of[[e.a,e.b],[e.b,e.a]]){const k=key(a);if(!map.has(k))map.set(k,[]);map.get(k).push(b);}
  const remaining=new Set(map.keys()),loops=[];while(remaining.size){const start=[...remaining][0];let previous=null,current=start;const loop=[];do{remaining.delete(current);loop.push(current.split(',').map(Number));const next=map.get(current).find(q=>key(q)!==previous);assert(next,'Unclosed source section');previous=current;current=key(next);assert(loop.length<=active.length+1);}while(current!==start);loops.push(loop);}
  return loops.map(loop=>{let changed=true;while(changed){changed=false;for(let i=0;i<loop.length;i++){const a=loop[(i+loop.length-1)%loop.length],b=loop[i],c=loop[(i+1)%loop.length],cross=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);if(Math.abs(cross)<.0002){loop.splice(i,1);changed=true;break;}}}return loop;});
 }
 const sectionEdges=[];for(let i=0;i<indices.length;i+=3){const tri=indices.slice(i,i+3).map(point),hits=[];for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3];if(a[2]*b[2]<0){const t=-a[2]/(b[2]-a[2]);hits.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}if(hits.length===2)sectionEdges.push(hits);}
 const spine=loopsFromEdges(sectionEdges);assert.equal(spine.length,1);
 function planarFace(z){const triangles=[];for(let i=0;i<indices.length;i+=3){const tri=indices.slice(i,i+3).map(point);if(tri.every(p=>Math.abs(p[2]-z)<1e-5))triangles.push(tri.map(p=>p.slice(0,2).map(round)));}const loops=loopsFromEdges(triangles.flatMap(t=>t.map((p,i)=>[p,t[(i+1)%3]])));assert.equal(loops.length,1);return{triangles,outline:loops[0]};}
 const tooth=planarFace(-104),difference=planarFace(-86),area=p=>Math.abs(THREE.ShapeUtils.area(p.map(p=>new THREE.Vector2(...p))));
 const result={spineProfileXYMM:spine[0],toothProfileXYMM:tooth.outline,toothOnlyProfileXYMM:difference.outline,toothOnlySourceCapTrianglesXYMM:difference.triangles,spineAreaMM2:area(spine[0]),toothAreaMM2:area(tooth.outline),toothOnlyAreaMM2:area(difference.outline)};
 assert(Math.abs(result.spineAreaMM2+result.toothOnlyAreaMM2-result.toothAreaMM2)<.005);return result;
}

export function buildRailGeometry(sourceSections){
 const s=sourceSections,canonical=[];
 const snap=p=>{let q=canonical.find(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<.0001);if(!q){q=[...p];canonical.push(q);}return q;};
 const raw={T:s.toothProfileXYMM.map(snap),S:s.spineProfileXYMM.map(snap),D:s.toothOnlyProfileXYMM.map(snap)};
 function splitEdges(poly){const result=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);result.push(...canonical.filter(p=>Math.abs((p[0]-a[0])*dy-(p[1]-a[1])*dx)/length<.0001).map(p=>({p,t:((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(length*length)})).filter(({t})=>t>=-1e-7&&t<1-1e-7).sort((a,b)=>a.t-b.t).map(v=>v.p));}const outline=result.filter((p,i)=>!i||p!==result[i-1]);if(THREE.ShapeUtils.area(outline.map(p=>new THREE.Vector2(...p)))<0)outline.reverse();return outline;}
 const outlines=Object.fromEntries(Object.entries(raw).map(([k,p])=>[k,splitEdges(p)]));
 function triangulate(poly){let triangles=THREE.ShapeUtils.triangulateShape(poly.map(p=>new THREE.Vector2(...p)),[]).map(t=>t.map(i=>poly[i]));let changed=true;while(changed){changed=false;outer:for(let ti=0;ti<triangles.length;ti++){const t=triangles[ti];for(let e=0;e<3;e++){const a=t[e],b=t[(e+1)%3],c=t[(e+2)%3],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);for(const p of poly){if(p===a||p===b||p===c)continue;const u=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(length*length),distance=Math.abs((p[0]-a[0])*dy-(p[1]-a[1])*dx)/length;if(u>1e-7&&u<1-1e-7&&distance<1e-7){triangles.splice(ti,1,[a,p,c],[p,b,c]);changed=true;break outer;}}}}}return triangles.map(t=>{const[a,b,c]=t;return(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])>0?t:[t[0],t[2],t[1]];});}
 const caps=Object.fromEntries(Object.entries(outlines).map(([k,p])=>[k,triangulate(p)])),gapCenters=Array.from({length:13},(_,i)=>229-38*i);
 function make(id,low,high){const positions=[],normals=[],indices=[];let signedVolume=0;
  const triangle=(a,b,c)=>{const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...n);assert(length>1e-8);const index=positions.length/3;for(const p of[a,b,c]){positions.push(...p);normals.push(...n.map(v=>v/length));}indices.push(index,index+1,index+2);signedVolume+=(a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;};
  const cap=(kind,z,positive)=>{for(const[a,b,c]of caps[kind]){if(positive)triangle([...a,z],[...b,z],[...c,z]);else triangle([...c,z],[...b,z],[...a,z]);}};
  const breaks=[low,high,...gapCenters.flatMap(z=>[z-9,z+9]).filter(z=>z>low&&z<high)].sort((a,b)=>a-b),cells=[];
  for(let i=0;i<breaks.length-1;i++){const a=breaks[i],b=breaks[i+1],mid=(a+b)/2,kind=gapCenters.some(z=>Math.abs(mid-z)<9)?'T':'S';cells.push({low:a,high:b,kind});for(let j=0;j<outlines[kind].length;j++){const p=outlines[kind][j],q=outlines[kind][(j+1)%outlines[kind].length];triangle([...p,a],[...q,a],[...q,b]);triangle([...p,a],[...q,b],[...p,b]);}}
  cap(cells[0].kind,low,false);cap(cells.at(-1).kind,high,true);for(let i=1;i<cells.length;i++)if(cells[i-1].kind!==cells[i].kind)cap('D',cells[i].low,cells[i-1].kind==='T');
  const edges=new Map();for(let i=0;i<indices.length;i+=3){const t=indices.slice(i,i+3).map(j=>positions.slice(j*3,j*3+3).map(v=>Math.round(v*1e4)/1e4).join(','));for(let e=0;e<3;e++){const a=t[e],b=t[(e+1)%3],key=[a,b].sort().join('|'),v=edges.get(key)||{count:0,winding:0};v.count++;v.winding+=a<b?1:-1;edges.set(key,v);}}
  const badEdges=[...edges.values()].filter(v=>v.count!==2||v.winding!==0);assert.equal(badEdges.length,0,'Rail must be watertight and consistently wound');
  const toothAxialLength=cells.filter(c=>c.kind==='T').reduce((n,c)=>n+c.high-c.low,0),expectedVolume=s.spineAreaMM2*(high-low)+s.toothOnlyAreaMM2*toothAxialLength;assert(Math.abs(expectedVolume-signedVolume)<.1);
  return{id,zMinMM:low,zMaxMM:high,lengthMM:high-low,toothAxialLengthMM:toothAxialLength,positions,normals,indices,signedVolumeMM3:signedVolume,expectedVolumeMM3:expectedVolume,cells};
 }
 return{sourceSections:s,meshProfiles:outlines,sectionCapTrianglesXYMM:{spine:caps.S,tooth:caps.T,toothOnly:caps.D},gapCenterZMM:gapCenters,sections:[make('comb-rail-front',77,258),make('comb-rail-middle',-75,77),make('comb-rail-rear',-256,-75)],complete:make('comb-rail-complete',-256,258)};
}

/** Exact point-to-segment distance on the displayed polygon, not just vertices. */
export function minimumProfileRadius(profile,centerY){let minimum=Infinity;for(let i=0;i<profile.length;i++){const a=[profile[i][0],profile[i][1]+centerY],b=[profile[(i+1)%profile.length][0],profile[(i+1)%profile.length][1]+centerY],d=b.map((v,j)=>v-a[j]),t=Math.max(0,Math.min(1,-(a[0]*d[0]+a[1]*d[1])/(d[0]*d[0]+d[1]*d[1])));minimum=Math.min(minimum,Math.hypot(a[0]+t*d[0],a[1]+t*d[1]));}return minimum;}
