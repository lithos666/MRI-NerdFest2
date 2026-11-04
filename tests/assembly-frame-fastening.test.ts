import assert from "node:assert/strict";
import fs from "node:fs";
import {test} from "node:test";
import {FRAME_HOLDER_FASTENERS,FRAME_HOLDER_SOURCE_SHA256,frameLayerArrival,frameFastenerProgress} from "../lib/assembly-frame-fastening.ts";

test("frame fastening follows layer arrival, nut placement, bolt insertion and tightening",()=>{
 assert.equal(FRAME_HOLDER_FASTENERS.length,8);
 assert.deepEqual(["left","right","bottom"].map(side=>FRAME_HOLDER_FASTENERS.filter(anchor=>anchor.support===side).length),[3,3,2]);
 for(let sample=0;sample<=1000;sample++)for(let index=0;index<8;index++){
  const progress=sample/1000,state=frameFastenerProgress(progress,index);
  if(state.visible)assert.equal(frameLayerArrival(progress),1,"Show frame hardware only after the layer is seated");
  if(state.bolt>0)assert.equal(state.nut,1,"Seat each T-nut before inserting its bolt");
  if(state.tighten>0)assert.equal(state.bolt,1,"Seat each bolt before tightening");
  if(sample===1000)assert.deepEqual(state,{visible:true,nut:1,bolt:1,tighten:1});
 }
});

test("frame fastening axes retain the registered support provenance and correct entry faces",()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL("../lib/cad-manifest.json",import.meta.url),"utf8"));
 assert.equal(manifest.parts.find((part:{id:string})=>part.id==="cad-ring-support").sourceSha256,FRAME_HOLDER_SOURCE_SHA256);
 for(const anchor of FRAME_HOLDER_FASTENERS){
  assert.equal(Math.hypot(...anchor.outward),1);
  assert.ok(anchor.entry.every(Number.isFinite));
  if(anchor.id.includes("outer")){assert.equal(Math.abs(anchor.entry[0]),260.2);assert.equal(Math.abs(anchor.entry[1]),20);}
  if(anchor.id.endsWith("top")){assert.equal(Math.abs(anchor.entry[0]),235.1);assert.equal(anchor.entry[1],45.1);}
  if(anchor.support==="bottom"){assert.equal(Math.abs(anchor.entry[0]),20.05);assert.equal(anchor.entry[1],-211);}
 }
});
