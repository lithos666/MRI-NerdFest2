import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import {test} from "node:test";
import asset from "../lib/comb-alignment-asset.json" with {type:"json"};
import {models} from "../lib/mri.ts";
import {VERIFIED_ROD_AXES} from "../lib/assembly-sequence-geometry.ts";
import {COMB_STATION_ANGLES_DEG,COMB_GAP_CENTERS_MM,COMB_ASSEMBLY_COUNT,COMB_TOOTH_COUNT,COMB_SECTIONS,COMB_JOINT_PLANES_MM,COMB_TOP_RADIUS_MM,COMB_DISPLAY_RADIAL_ALLOWANCE_MM,combSectionPose,combSectionProgress,combToothState,combCameraBlend} from "../lib/assembly-comb-layout.ts";

test("six continuous combs bridge fourteen layers with thirteen teeth each",()=>{
 assert.equal(COMB_ASSEMBLY_COUNT,6);assert.equal(COMB_TOOTH_COUNT,78);assert.equal(COMB_GAP_CENTERS_MM.length,13);
 assert.equal(COMB_STATION_ANGLES_DEG.filter(angle=>angle>0&&angle<180).length,3);assert.equal(COMB_STATION_ANGLES_DEG.filter(angle=>angle>180&&angle<360).length,3);
 assert.equal(COMB_SECTIONS[0].zMaxMM,models.latest.rings[0].zMM+11);assert.equal(COMB_SECTIONS[2].zMinMM,models.latest.rings[13].zMM-9);
 assert.deepEqual(COMB_SECTIONS.map(section=>section.zMaxMM-section.zMinMM),[181,152,181]);
 assert.equal(COMB_SECTIONS[0].zMinMM,COMB_SECTIONS[1].zMaxMM);assert.equal(COMB_SECTIONS[1].zMinMM,COMB_SECTIONS[2].zMaxMM);assert.deepEqual([...COMB_JOINT_PLANES_MM],[77,-75]);
 for(let gap=0;gap<13;gap++){
  const upper=models.latest.rings[gap].zMM-9,lower=models.latest.rings[gap+1].zMM+11,center=COMB_GAP_CENTERS_MM[gap];assert.equal(upper-lower,18);assert.equal(center-9,lower);assert.equal(center+9,upper);
  const covered=COMB_SECTIONS.map(section=>Math.max(0,Math.min(section.zMaxMM,upper)-Math.max(section.zMinMM,lower))).filter(length=>length>0);assert.equal(covered.reduce((sum,length)=>sum+length,0),18);
  if(gap===4||gap===8)assert.deepEqual(covered,[9,9],"Joint teeth are two nonoverlapping halves");else assert.deepEqual(covered,[18]);
  for(let station=0;station<6;station++){assert.equal(combToothState(0,gap,station).visible,false);assert.equal(combToothState(1,gap,station).engaged,true);}
 }
});

test("three longitudinal sections seat radially in front-middle-rear order",()=>{
 for(let section=0;section<3;section++)for(let station=0;station<6;station++){
  let previous=44;for(let sample=0;sample<=500;sample++){const pose=combSectionPose(sample/500,section,station);assert.ok(pose.radialOffsetMM<=previous+1e-10&&pose.radialOffsetMM>=0);assert.equal(pose.position[2],0,"Do not slide teeth axially through layers");previous=pose.radialOffsetMM;}
  assert.equal(combSectionPose(1,section,station).seated,1);
  if(section>0)for(let sample=0;sample<=500;sample++){const progress=sample/500;if(combSectionProgress(progress,section,station).visible)assert.equal(combSectionProgress(progress,section-1,station).seated,1);}
 }
 assert.equal(combCameraBlend(0),0);assert.equal(combCameraBlend(1),0);assert.ok(combCameraBlend(.18)>.99);
});

test("section files preserve array-local extents and source-derived geometry",()=>{
 assert.equal(asset.derivedRail.sections.length,3);assert.equal(COMB_DISPLAY_RADIAL_ALLOWANCE_MM,.1);
 asset.derivedRail.sections.forEach((section,index)=>{assert.equal(section.zMinMM,COMB_SECTIONS[index].zMinMM);assert.equal(section.zMaxMM,COMB_SECTIONS[index].zMaxMM);const bytes=fs.readFileSync(new URL(`../public${section.url}`,import.meta.url));assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"),section.sha256);const length=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+length).toString("utf8"));assert.ok(gltf.meshes.length>=1);});
 assert.equal(asset.components.length,2,"Keep original short-rack CAD variants as reference assets");
});

test("combs remain separated from each other and the rod-spacer radial envelopes",()=>{
 const points=asset.derivedUnit.profileXYMM,localRadius=Math.max(...points.map(([x,y])=>Math.hypot(x,y))),radialMinimum=Math.min(...points.map(([x,y])=>Math.hypot(x,y+COMB_TOP_RADIUS_MM)));
 for(let a=0;a<6;a++)for(let b=a+1;b<6;b++){let angle=Math.abs(COMB_STATION_ANGLES_DEG[a]-COMB_STATION_ANGLES_DEG[b])*Math.PI/180;angle=Math.min(angle,Math.PI*2-angle);assert.ok(2*COMB_TOP_RADIUS_MM*Math.sin(angle/2)>2*localRadius);}
 const rodAndSpacerOuter=Math.max(...VERIFIED_ROD_AXES.map(axis=>Math.hypot(axis.x,axis.y)+7));assert.ok(radialMinimum>rodAndSpacerOuter);
});
