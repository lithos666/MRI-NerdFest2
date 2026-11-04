import asset from "./comb-alignment-asset.json" with {type:"json"};
import {assemblyPhaseProgress} from "./assembly-timing.ts";

export const COMB_STATION_ANGLES_DEG=[22,82,142,202,248,322] as const;
export const COMB_GAP_CENTERS_MM=asset.derivedUnit.gapCenterZMM;
export const COMB_PER_GAP=6;
export const COMB_UNIT_COUNT=COMB_GAP_CENTERS_MM.length*COMB_PER_GAP;
// Original source transverse array centre, preserved in the CAD audit.
export const COMB_TOP_RADIUS_MM=asset.derivedUnit.sourceCenterMM[2]-7.71801948466347;
export const COMB_APPROACH_MM=44;
export const COMB_CLEARANCE_STATUS="separated-support-frame-projections-nominal-axial-face-contact";
export function combUnitProgress(progress:number,gap:number,station:number){
 const start=gap===0?.035+station*.034:.32+(gap-1)*.035+station*.003;
 const end=start+(gap===0?.095:.13);
 const seated=assemblyPhaseProgress(progress,start,end);
 return {visible:progress>=start,seated,radialOffsetMM:COMB_APPROACH_MM*(1-seated)};
}
export function combUnitPose(progress:number,gap:number,station:number){
 const state=combUnitProgress(progress,gap,station),angle=COMB_STATION_ANGLES_DEG[station]*Math.PI/180;
 const radius=COMB_TOP_RADIUS_MM+state.radialOffsetMM;
 return {...state,position:[radius*Math.cos(angle),radius*Math.sin(angle),COMB_GAP_CENTERS_MM[gap]] as const,rotationZ:angle-Math.PI/2};
}
export function combCameraBlend(progress:number){return assemblyPhaseProgress(progress,.02,.09)*(1-assemblyPhaseProgress(progress,.3,.52));}
