import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

// Tessellate the supplied BREP without scaling, rebuilding teeth or changing features.
// The two components are different source shapes, not an asserted installed quantity.
const project=path.resolve(import.meta.dirname,'..');
const options=Object.fromEntries(process.argv.slice(2).map(arg=>{const [key,...value]=arg.split('=');return [key.replace(/^--/,''),value.join('=')];}));
const sourceFilename='comb-device.step';
const archivedSource=path.join(project,'assets/cad/comb-device.step');
const source=options.source?path.resolve(options.source):fs.existsSync(archivedSource)?archivedSource:'G:/OneDrive/桌面/MRI/1_big ioring_new_generation_prototype/CAD模型/comb-device.step';
const publishedFinal=path.join(project,'public/resources/Final.step');
const finalSource=options.final?path.resolve(options.final):fs.existsSync(publishedFinal)?publishedFinal:'G:/OneDrive/桌面/MRI/1_big ioring_new_generation_prototype/CAD模型/Final.step';
const toolkit=path.resolve(options.toolkit||path.join(project,'../qa/cad-toolkit/node_modules/occt-import-js/dist/occt-import-js.js'));
const browserToolkit=path.resolve(options['browser-toolkit']||path.join(project,'../qa/node_modules/playwright/index.mjs'));
const output=path.join(project,'public/assembly/tools');
fs.mkdirSync(output,{recursive:true});
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const boundsOf=positions=>{const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<positions.length;i++){const d=i%3;min[d]=Math.min(min[d],positions[i]);max[d]=Math.max(max[d],positions[i]);}return {min,max,size:min.map((v,d)=>max[d]-v)};};
const midpoint=b=>b.min.map((v,i)=>(v+b.max[i])/2);
const bytes=fs.readFileSync(source);
assert(bytes.toString('utf8').includes('SI_UNIT(.MILLI.,.METRE.)'),'STEP must declare millimetres.');
const {default:factory}=await import(pathToFileURL(toolkit).href);
const occt=await factory();
const parsed=occt.ReadStepFile(bytes,{linearUnit:'millimeter',linearDeflectionType:'absolute_value',linearDeflection:0.045,angularDeflection:0.12});
assert(parsed.success&&parsed.meshes?.length===2,'Review new source identities before converting.');
const components=parsed.meshes.map((mesh,index)=>{
 const sourceBounds=boundsOf(mesh.attributes.position.array),center=midpoint(sourceBounds);
 const slots=index===0?4:5,length=slots*38+18;
 assert.equal(mesh.name,`comb-device-${slots}`);
 assert(Math.abs(sourceBounds.size[0]-length)<1e-6,'Unexpected comb axial length.');
 const planes=[...new Set(mesh.attributes.position.array.filter((v,i)=>i%3===0&&Math.abs(mesh.attributes.normal.array[i])>.99999).map(v=>Math.round(v*1e6)/1e6))].sort((a,b)=>a-b);
 assert.equal(planes.length,(slots+1)*2,'Expected two axial tooth faces per tooth.');
 planes.slice(1).forEach((v,i)=>assert(Math.abs(v-planes[i]-(i%2===0?18:20))<2e-6,'Tooth/slot spacing changed.'));
 return {id:mesh.name,sourceMeshIndex:index,sourceName:mesh.name,sourceBoundsMM:sourceBounds,sourceCenterMM:center,lengthMM:length,slotCount:slots,toothCount:slots+1,slotWidthMM:20,toothWidthMM:18,pitchMM:38,slotCentersLocalMM:Array.from({length:slots},(_,i)=>[0,0,(i-(slots-1)/2)*38]),localAxis:[0,0,1],vertices:mesh.attributes.position.array.length/3,triangles:mesh.index.array.length/3};
});

function writeGLB(filename, selected, arrange) {
 const chunks=[],bufferViews=[],accessors=[],meshes=[],nodes=[];let binaryLength=0;
 const append=(typed,target,componentType,type,count,bounds)=>{
  const data=Buffer.from(typed.buffer,typed.byteOffset,typed.byteLength),view=bufferViews.length;
  bufferViews.push({buffer:0,byteOffset:binaryLength,byteLength:data.length,target});chunks.push(data);binaryLength+=data.length;
  const pad=(4-binaryLength%4)%4;if(pad){chunks.push(Buffer.alloc(pad));binaryLength+=pad;}
  const index=accessors.length;accessors.push({bufferView:view,componentType,count,type,...(bounds?{min:bounds.min,max:bounds.max}:{})});return index;
 };
 selected.forEach((c,nodeIndex)=>{
  const m=c.meshOverride||parsed.meshes[c.sourceMeshIndex],center=c.sourceCenterMM;
  const positions=new Float32Array(m.attributes.position.array.length),normals=new Float32Array(m.attributes.normal.array.length);
  for(let i=0;i<positions.length;i+=3){positions[i]=m.attributes.position.array[i+1]-center[1];positions[i+1]=m.attributes.position.array[i+2]-center[2];positions[i+2]=m.attributes.position.array[i]-center[0];normals[i]=m.attributes.normal.array[i+1];normals[i+1]=m.attributes.normal.array[i+2];normals[i+2]=m.attributes.normal.array[i];}
  const attributes={POSITION:append(positions,34962,5126,'VEC3',positions.length/3,boundsOf(positions)),NORMAL:append(normals,34962,5126,'VEC3',normals.length/3)};
  const indices=append(new Uint32Array(m.index.array),34963,5125,'SCALAR',m.index.array.length);
  const extras={sourceMeshIndex:c.sourceMeshIndex,sourceName:c.sourceName,role:'comb-alignment-tool',unit:'millimeter',sourceSha256:hash(bytes)};
  meshes.push({name:c.id,primitives:[{attributes,indices,material:0}],extras});
  nodes.push({name:c.id,mesh:nodeIndex,translation:arrange?[(nodeIndex-.5)*61,0,(nodeIndex-.5)*12]:[0,0,0],extras});
 });
 const gltf={asset:{version:'2.0',generator:'portableMRI NerdFest: exact supplied comb STEP',extras:{unit:'millimeter',sourceSha256:hash(bytes),presentation:arrange?'Two original shapes translated side-by-side; not installed relationships.':'One rigidly centred source component.'}},scene:0,scenes:[{nodes:nodes.map((_,i)=>i)}],nodes,meshes,materials:[{name:'Illustrative printed-polymer appearance; manufacturing material unconfirmed',pbrMetallicRoughness:{baseColorFactor:[.17,.31,.40,1],metallicFactor:0,roughnessFactor:.46},doubleSided:false}],buffers:[{byteLength:binaryLength}],bufferViews,accessors};
 const jsonRaw=Buffer.from(JSON.stringify(gltf)),json=Buffer.concat([jsonRaw,Buffer.alloc((4-jsonRaw.length%4)%4,0x20)]),binary=Buffer.concat(chunks),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);
 header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+binary.length,8);jh.writeUInt32LE(json.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(binary.length);bh.writeUInt32LE(0x004e4942,4);
 const data=Buffer.concat([header,jh,json,bh,binary]);fs.writeFileSync(path.join(output,filename),data);
 return {url:`/assembly/tools/${filename}`,bytes:data.length,sha256:hash(data)};
}
components.forEach(c=>{
 Object.assign(c,writeGLB(c.id+'.glb',[c],false));
 c.modelURL=c.url;
 c.centeredBoundsMM={min:[-c.sourceBoundsMM.size[1]/2,-c.sourceBoundsMM.size[2]/2,-c.lengthMM/2],max:[c.sourceBoundsMM.size[1]/2,c.sourceBoundsMM.size[2]/2,c.lengthMM/2],size:[c.sourceBoundsMM.size[1],c.sourceBoundsMM.size[2],c.lengthMM]};
 const [x,y,z]=c.sourceCenterMM;c.sourceToModel=[0,0,1,0,1,0,0,0,0,1,0,0,-y,-z,-x,1];
});
const combined=writeGLB('comb-device.glb',components,true);
// Derive one identical 18 mm inter-layer tooth from the complete source front
// cross-section. This is a clearly labelled teaching derivative, not a new STEP
// manufacturing part and not 78 copies of either complete source rack.
function deriveToothUnit(){
 const original=parsed.meshes[1],a=original.attributes.position.array,ix=original.index.array,x0=components[1].sourceBoundsMM.min[0];
 const points=[],map=new Map(),triangles=[];
 const getPoint=i=>{const p=a.slice(i*3,i*3+3),key=p.slice(1).map(v=>v.toFixed(7)).join(',');if(!map.has(key)){map.set(key,points.length);points.push(p);}return map.get(key);};
 for(let i=0;i<ix.length;i+=3){const t=[ix[i],ix[i+1],ix[i+2]];if(t.every(j=>Math.abs(a[j*3]-x0)<1e-5))triangles.push(t.map(getPoint));}
 assert(points.length>20&&triangles.length>20,'Review full source end section before deriving a tooth.');
 const edges=new Map();for(const t of triangles)for(let i=0;i<3;i++){const edge=[t[i],t[(i+1)%3]],key=[...edge].sort((a,b)=>a-b).join(',');if(edges.has(key))edges.get(key).count++;else edges.set(key,{edge,count:1});}
 const boundary=[...edges.values()].filter(e=>e.count===1).map(e=>e.edge);assert.equal(boundary.length,points.length,'Expected one closed, unperforated source profile.');
 const positions=[],normals=[],indices=[];
 const addTri=(p,q,r)=>{const u=q.map((v,i)=>v-p[i]),v=r.map((w,i)=>w-p[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...n);assert(length>1e-8);const start=positions.length/3;for(const point of [p,q,r]){positions.push(...point);normals.push(...n.map(v=>v/length));}indices.push(start,start+1,start+2);};
 const back=p=>[p[0]+18,p[1],p[2]];
 for(const [i,j,k] of triangles){addTri(points[i],points[j],points[k]);addTri(back(points[k]),back(points[j]),back(points[i]));}
 for(const [i,j] of boundary){addTri(points[i],back(points[i]),points[j]);addTri(points[j],back(points[i]),back(points[j]));}
 const meshOverride={attributes:{position:{array:positions},normal:{array:normals}},index:{array:indices}};
 const sourceBounds=boundsOf(positions),sourceCenter=midpoint(sourceBounds),c={id:'comb-tooth-unit',sourceMeshIndex:1,sourceName:'comb-device-5: derived end-tooth cross-section',sourceCenterMM:sourceCenter,meshOverride};
 const profileIndices=[boundary[0][0]];let cursor=boundary[0][1];while(cursor!==profileIndices[0]){profileIndices.push(cursor);const edge=boundary.find(e=>e[0]===cursor);assert(edge,'Unclosed source section boundary.');cursor=edge[1];assert(profileIndices.length<=points.length,'Cyclic boundary failed.');}assert.equal(profileIndices.length,points.length);
 const file=writeGLB(c.id+'.glb',[c],false);
 return {...file,modelURL:file.url,id:c.id,geometryStatus:'derived-teaching-geometry-not-manufacturing-cad',sourceVariantId:'comb-device-5',sourceCrossSectionPlaneMM:x0,axialThicknessMM:18,centeredBoundsMM:{min:[-sourceBounds.size[1]/2,-sourceBounds.size[2]/2,-9],max:[sourceBounds.size[1]/2,sourceBounds.size[2]/2,9],size:[sourceBounds.size[1],sourceBounds.size[2],18]},vertices:positions.length/3,triangles:indices.length/3,closedSectionVertices:points.length,profileXYMM:profileIndices.map(i=>[points[i][1]-sourceCenter[1],points[i][2]-sourceCenter[2]]),sectionTrianglesXYMM:triangles.map(t=>t.map(i=>[points[i][1]-sourceCenter[1],points[i][2]-sourceCenter[2]])),sourceCenterMM:sourceCenter,sourceToModel:[0,0,1,0,1,0,0,0,0,1,0,0,-sourceCenter[1],-sourceCenter[2],-sourceCenter[0],1],confirmedQuantity:78,quantityBasis:'13 inter-layer gaps × 6 identical locating structures per gap; three upper and three lower positions, as specified by the user.',gapCenterZMM:Array.from({length:13},(_,i)=>229-38*i),localAxis:[0,0,1],evidence:'The exact unperforated end-section boundary and cap triangulation of comb-device-5 are retained, then rigidly extruded through the source tooth width18 mm. No profile scaling, invented teeth or end-to-end rack overlap is used.',limitations:['This isolated unit is a visual teaching derivative and has no supplied manufacturing STEP file.','18 mm thickness equals the nominal gap between20 mm housing/cap envelopes at38 mm pitch; manufacturing clearance is not established.','The six angular placements require collision checking against the actual supports, frame and rods.']};
}
const derivedUnit=deriveToothUnit();
let finalEvidence={status:'not-provided-to-generator'};
if(fs.existsSync(finalSource)){
 const finalBytes=fs.readFileSync(finalSource),finalParsed=occt.ReadStepFile(finalBytes,{linearUnit:'millimeter',linearDeflectionType:'absolute_value',linearDeflection:.12,angularDeflection:.2});assert(finalParsed.success);
 const productNames=[];const walk=r=>{productNames.push(r.name||'');r.children?.forEach(walk);};walk(finalParsed.root);
 assert(!productNames.some(n=>/comb/i.test(n)),'Comb identity appeared in Final; reassess registration rather than claiming absent.');
 finalEvidence={status:'no-comb-product-instance-identified',sourceFilename:'Final.step',sourceSha256:hash(finalBytes),sourceBytes:finalBytes.length,meshCount:finalParsed.meshes.length,evidence:'The supplied Final product tree contains layers and supports but no comb-named product. Its 108 tessellated solids contain no 170/208 mm axial component; an installed comb transform is not established.'};
}
const gamma=-6.206896551723931*Math.PI/180;
const crossOffset=components[1].sourceCenterMM[2]-7.7180194846639125;
const manifest={schemaVersion:1,id:'comb-alignment',role:'inter-layer-alignment',unit:'millimeter',sourceFilename,sourceRelativePath:'assets/cad/comb-device.step',sourceSha256:hash(bytes),sourceBytes:bytes.length,sourceMeshCount:parsed.meshes.length,...combined,modelURL:combined.url,components,derivedUnit,previewLayout:'The two exact source shapes are rigidly centred and translated side-by-side for inspection. They are source reference profiles, not the78 isolated inter-layer units. No source-profile geometry scaling or tooth synthesis is used.',materialStatus:'unconfirmed',quantityStatus:'user-confirmed-78-identical-inter-layer-locating-units',confirmedUsage:{interLayerGaps:13,azimuthalPositionsPerGap:6,upperPositionsPerGap:3,lowerPositionsPerGap:3,identicalLocatingUnits:78,azimuthalPositionsDegrees:[22,82,142,202,248,322],angularLayoutNote:'Three positions in each semicircle. Angles are adjusted for clearance against the actual supports and frame; they are not a strictly uniform60-degree pattern.',sourceRackCountStatus:'unconfirmed-manufacturing-count-separate-from-the-78-derived-units'},finalAssemblyEvidence:finalEvidence,
 assemblyRegistration:{status:'illustrative-pitch-matched-not-clearance-certified',pitchMM:38,nominalLayerHousingCapThicknessMM:20,nominalClearSlotMM:20,toothWidthMM:18,
  evidence:'Alternating axial STEP faces and mesh ray intersections establish 18 mm material teeth and 20 mm clear slots at 38 mm pitch. A layer is nominally 20 mm from housing back to cap front; the 26 mm magnet-face gap is a different dimension.',
  canonicalAxes:{longitudinal:'+Z',transverse:'XY'},
  referenceProfileExamples:[{componentId:'comb-device-5',layerNumbers:[1,2,3,4,5],positionMM:[-Math.sin(gamma)*crossOffset,Math.cos(gamma)*crossOffset,172],rotationZRadians:gamma,nominalSlotCenterZMM:[96,134,172,210,248]},{componentId:'comb-device-4',layerNumbers:[6,7,8,9],positionMM:[-Math.sin(gamma)*crossOffset,Math.cos(gamma)*crossOffset,1],rotationZRadians:gamma,nominalSlotCenterZMM:[-56,-18,20,58]}],
  limitations:['These are one-at-a-time teaching examples, not simultaneous installed instances or a confirmed hardware quantity.','Final.step does not establish an installed comb transform. Axial pitch and nominal layer envelopes alone do not certify fit, tolerance, collision clearance or retention.','The source contact-profile cylinder radius is 212.718019484663 mm about source Z=0, while the array outer radius is205 mm about source Z=7.718019484664 mm. Their top poles coincide after a translation, but their curvatures differ away from the pole.','No source geometry is resized to force a match. The comb-device-4 hexagonal axial feature is preserved without assigning an unconfirmed mechanical function.']},
 presentation:'The original two rack profiles are exact STEP tessellations; their manufacturing count remains unconfirmed. The78 identical derived teaching units are user-confirmed (13gaps ×6), with three upper and three lower clearance-adjusted stations per gap. Display colour is illustrative; manufacturing material and tolerances remain unconfirmed.'};
manifest.derivedUnit.azimuthalPositionsDegrees=[...manifest.confirmedUsage.azimuthalPositionsDegrees];
manifest.derivedUnit.placementStatus='clearance-adjusted-rendered-layout';
manifest.derivedUnit.placementNote='Three upper and three lower stations per gap; conservative actual support/frame projection and44mm radial approach were checked separately. This does not certify manufacturing tolerances or the unconfirmed physical material.';
manifest.derivedUnit.limitations[2]='The rendered six-station layout has a separate conservative support/frame projection and44mm radial approach-path check. This does not certify manufacturing tolerances or physical retention.';
fs.mkdirSync(path.dirname(archivedSource),{recursive:true});if(path.resolve(source)!==path.resolve(archivedSource))fs.copyFileSync(source,archivedSource);
fs.writeFileSync(path.join(project,'lib/comb-alignment-asset.json'),JSON.stringify(manifest,null,2)+'\n');
const html=`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;background:white;overflow:hidden}canvas{display:block}</style><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script></head><body><script type="module">
import * as THREE from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('white');const env=new THREE.PMREMGenerator(renderer);scene.environment=env.fromScene(new RoomEnvironment(),.03).texture;scene.environmentIntensity=.48;scene.add(new THREE.HemisphereLight(0xffffff,0x9a9fa5,.65));
const key=new THREE.DirectionalLight(0xfff3e5,2.6);key.position.set(150,200,160);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.00006;key.shadow.normalBias=.03;scene.add(key);const fill=new THREE.DirectionalLight(0xc9dfff,.85);fill.position.set(-150,80,70);scene.add(fill);const rim=new THREE.DirectionalLight(0xffffff,1.8);rim.position.set(-30,100,-170);scene.add(rim);
const unit=new URL(location.href).searchParams.get('part')==='unit';const model=(await new GLTFLoader().loadAsync(unit?'/assembly/tools/comb-tooth-unit.glb':'/assembly/tools/comb-device.glb')).scene;scene.add(model);model.rotation.y=-.25;model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material.envMapIntensity=.5;const edge=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,35),new THREE.LineBasicMaterial({color:0x162b38,transparent:true,opacity:.20}));o.add(edge);}});
const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());model.position.y-=box.min.y;const camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,3000),target=new THREE.Vector3(0,size.y*.45,0);camera.position.copy(target).add(new THREE.Vector3(1.25,.9,1.1).normalize().multiplyScalar(800));camera.lookAt(target);camera.updateMatrixWorld();
const b=new THREE.Box3().setFromObject(model);let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(let i=0;i<8;i++){const p=new THREE.Vector3(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z).applyMatrix4(camera.matrixWorldInverse);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}const aspect=innerWidth/innerHeight,span=Math.max((maxX-minX)/aspect,maxY-minY)*1.25;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();
const floor=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.ShadowMaterial({color:0x53606e,opacity:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-.05;floor.receiveShadow=true;scene.add(floor);const extent=350;key.shadow.camera.left=-extent;key.shadow.camera.right=extent;key.shadow.camera.top=extent;key.shadow.camera.bottom=-extent;key.shadow.camera.near=.1;key.shadow.camera.far=1500;key.target.position.copy(target);scene.add(key.target);key.shadow.camera.updateProjectionMatrix();renderer.render(scene,camera);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));renderer.render(scene,camera);document.body.dataset.ready='true';window.renderFacts={meshCount:2,units:'millimeter'};
</script></body></html>`;
const threeDir=path.join(project,'node_modules/three');
const server=http.createServer((request,response)=>{try{const p=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);if(p==='/'){response.setHeader('Content-Type','text/html;charset=utf-8');response.end(html);return;}const base=p.startsWith('/three/')?threeDir:p.startsWith('/assembly/tools/')?output:null;const relative=p.startsWith('/three/')?p.slice(7):p.slice('/assembly/tools/'.length);const filename=base&&path.resolve(base,relative);if(!filename||!filename.startsWith(base+path.sep)){response.writeHead(404);response.end();return;}response.setHeader('Content-Type',filename.endsWith('.js')?'text/javascript':'model/gltf-binary');response.end(fs.readFileSync(filename));}catch{response.writeHead(404);response.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{const {chromium}=await import(pathToFileURL(browserToolkit).href);const browserTemp=path.join(project,'../qa/comb-device-2026-11-04/browser-temp');fs.mkdirSync(browserTemp,{recursive:true});browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--disable-crash-reporter'],env:{...process.env,TEMP:browserTemp,TMP:browserTemp}});const page=await browser.newPage({viewport:{width:800,height:520},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));for(const part of ['profiles','unit']){await page.goto('http://127.0.0.1:'+server.address().port+'/?part='+part,{waitUntil:'domcontentloaded'});await page.waitForSelector('body[data-ready="true"]');assert.equal(errors.length,0,errors.join('\n'));const name=part==='unit'?'comb-tooth-unit.png':'comb-alignment.png',filename=path.join(project,'public/bom',name);await page.locator('canvas').screenshot({path:filename});const image=fs.readFileSync(filename),thumbnail={url:'/bom/'+name,bytes:image.length,sha256:hash(image),width:800,height:520};if(part==='unit')manifest.derivedUnit.thumbnail=thumbnail;else manifest.thumbnail=thumbnail;}}finally{await browser?.close();await new Promise(r=>server.close(r));}
fs.writeFileSync(path.join(project,'lib/comb-alignment-asset.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({id:manifest.id,url:manifest.url,thumbnail:manifest.thumbnail.url,sourceSha256:manifest.sourceSha256,components:manifest.components.map(({id,slotCount,toothCount,lengthMM,vertices,triangles})=>({id,slotCount,toothCount,lengthMM,vertices,triangles})),finalAssemblyEvidence:manifest.finalAssemblyEvidence}));
