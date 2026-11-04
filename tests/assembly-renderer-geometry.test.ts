import assert from "node:assert/strict";
import {test} from "node:test";
import {BufferGeometry,Float32BufferAttribute} from "three";
import {createAssemblyGeometryOwner} from "../lib/assembly-renderer-geometry.ts";

test("concurrent assembly viewers own independent geometry while reusing their CPU cache",()=>{
 const source=new BufferGeometry();source.setAttribute("position",new Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
 const parent=createAssemblyGeometryOwner(),modal=createAssemblyGeometryOwner();
 const parentGeometry=parent.get(source),modalGeometry=modal.get(source);
 assert.equal(parent.get(source),parentGeometry);assert.equal(parent.size,1);
 assert.notEqual(parentGeometry,source);assert.notEqual(modalGeometry,parentGeometry);
 assert.notEqual(parentGeometry.getAttribute("position").array,source.getAttribute("position").array);
 let parentDisposals=0,modalDisposals=0,sourceDisposals=0;
 parentGeometry.addEventListener("dispose",()=>parentDisposals++);
 modalGeometry.addEventListener("dispose",()=>modalDisposals++);
 source.addEventListener("dispose",()=>sourceDisposals++);
 modal.dispose();modal.dispose();
 assert.equal(modalDisposals,1);assert.equal(parentDisposals,0);assert.equal(sourceDisposals,0);
 assert.equal(parent.get(source),parentGeometry,"Closing a modal cannot replace its parent's geometry");
 assert.deepEqual(Array.from(source.getAttribute("position").array),[0,0,0,1,0,0,0,1,0]);
 assert.throws(()=>modal.get(source),/disposed/);
 parent.dispose();assert.equal(parentDisposals,1);assert.equal(parent.size,0);assert.equal(sourceDisposals,0);
 const later=createAssemblyGeometryOwner();assert.notEqual(later.get(source),parentGeometry);later.dispose();source.dispose();
});
