import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import {test} from "node:test";
import asset from "../lib/comb-alignment-asset.json" with {type:"json"};
import {models} from "../lib/mri.ts";
import {VERIFIED_ROD_AXES} from "../lib/assembly-sequence-geometry.ts";
import {COMB_STATION_ANGLES_DEG,COMB_GAP_CENTERS_MM,COMB_PER_GAP,COMB_UNIT_COUNT,COMB_TOP_RADIUS_MM,combUnitPose,combCameraBlend} from "../lib/assembly-comb-layout.ts";

test("thirteen nominal gaps each receive six identical source-derived units, three per semicircle",()=>{
 assert.equal(COMB_UNIT_COUNT,78);assert.equal(COMB_PER_GAP,6);assert.equal(COMB_GAP_CENTERS_MM.length,13);
 assert.equal(COMB_STATION_ANGLES_DEG.filter(angle=>angle>0&&angle<180).length,3);assert.equal(COMB_STATION_ANGLES_DEG.filter(angle=>angle>180&&angle<360).length,3);
 const count=(progress:number)=>COMB_GAP_CENTERS_MM.reduce((sum,_,gap)=>sum+COMB_STATION_ANGLES_DEG.filter((_,station)=>combUnitPose(progress,gap,station).visible).length,0);
 assert.equal(count(0),0);assert.equal(count(1),78);
 for(let gap=0;gap<13;gap++){
  const upper=models.latest.rings[gap].zMM-9,lower=models.latest.rings[gap+1].zMM+11,center=COMB_GAP_CENTERS_MM[gap];
  assert.equal(upper-lower,18);assert.equal(center-9,lower);assert.equal(center+9,upper);
  for(let station=0;station<6;station++){
   let previous=44;for(let sample=0;sample<=500;sample++){const pose=combUnitPose(sample/500,gap,station);assert.ok(pose.radialOffsetMM<=previous+1e-10&&pose.radialOffsetMM>=0);assert.equal(pose.position[2],center);previous=pose.radialOffsetMM;}
   assert.equal(combUnitPose(1,gap,station).seated,1);
  }
 }
 assert.equal(combCameraBlend(0),0);assert.equal(combCameraBlend(1),0);assert.ok(combCameraBlend(.18)>.99);
});

test("unit identity is a hashed eighteen-mm derivative, not seventy-eight complete long racks",()=>{
 assert.equal(asset.derivedUnit.geometryStatus,"derived-teaching-geometry-not-manufacturing-cad");assert.equal(asset.derivedUnit.axialThicknessMM,18);
 const bytes=fs.readFileSync(new URL(`../public${asset.derivedUnit.url}`,import.meta.url));assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"),asset.derivedUnit.sha256);
 const length=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+length).toString("utf8"));
 assert.ok(gltf.meshes.length>=1);assert.equal(asset.components.length,2,"Keep both original source variants as references");
 assert.ok(asset.components.every(component=>component.lengthMM>18));
});

test("module stations cannot overlap each other or the rod/spacer radial envelopes",()=>{
 const points=asset.derivedUnit.profileXYMM;
 const localRadius=Math.max(...points.map(([x,y])=>Math.hypot(x,y))),radialMinimum=Math.min(...points.map(([x,y])=>Math.hypot(x,y+COMB_TOP_RADIUS_MM)));
 for(let a=0;a<6;a++)for(let b=a+1;b<6;b++){
  let angle=Math.abs(COMB_STATION_ANGLES_DEG[a]-COMB_STATION_ANGLES_DEG[b])*Math.PI/180;angle=Math.min(angle,Math.PI*2-angle);
  assert.ok(2*COMB_TOP_RADIUS_MM*Math.sin(angle/2)>2*localRadius,"The six local module envelopes must remain separated");
 }
 const spacerOuterRadius=7,rodAndSpacerOuter=Math.max(...VERIFIED_ROD_AXES.map(axis=>Math.hypot(axis.x,axis.y)+spacerOuterRadius));
 assert.ok(radialMinimum>rodAndSpacerOuter,"All azimuths and outward approach paths remain outside rods and spacers");
});
