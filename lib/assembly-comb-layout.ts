import asset from "./comb-alignment-asset.json" with {type:"json"};
import {assemblyPhaseProgress} from "./assembly-timing.ts";

export const COMB_STATION_ANGLES_DEG=[22,82,142,202,248,322] as const;
export const COMB_GAP_CENTERS_MM=asset.derivedUnit.gapCenterZMM;
export const COMB_PER_GAP=6;
export const COMB_ASSEMBLY_COUNT=6;
export const COMB_TEETH_PER_ASSEMBLY=13;
export const COMB_TOOTH_COUNT=COMB_ASSEMBLY_COUNT*COMB_TEETH_PER_ASSEMBLY;
export const COMB_SECTIONS=[{id:"front",zMinMM:77,zMaxMM:258},{id:"middle",zMinMM:-75,zMaxMM:77},{id:"rear",zMinMM:-256,zMaxMM:-75}] as const;
export const COMB_JOINT_PLANES_MM=[77,-75] as const;
// Original source transverse array centre, preserved in the CAD audit.
export const COMB_SOURCE_TOP_RADIUS_MM=asset.derivedUnit.sourceCenterMM[2]-7.71801948466347;
export const COMB_DISPLAY_RADIAL_ALLOWANCE_MM=.1;
export const COMB_TOP_RADIUS_MM=COMB_SOURCE_TOP_RADIUS_MM+COMB_DISPLAY_RADIAL_ALLOWANCE_MM;
export const COMB_APPROACH_MM=44;
export const COMB_CLEARANCE_STATUS="continuous-spine-profile-checked-radial-display-allowance-nominal-axial-contact";
export function combSectionProgress(progress:number,section:number,station:number){
 const intervals=[[.035,.29],[.34,.58],[.64,.88]],delay=station*.007;
 const start=intervals[section][0]+delay,end=intervals[section][1]+delay;
 const seated=assemblyPhaseProgress(progress,start,end);
 return {visible:progress>=start,seated,radialOffsetMM:COMB_APPROACH_MM*(1-seated)};
}
export function combSectionPose(progress:number,section:number,station:number){
 const state=combSectionProgress(progress,section,station),angle=COMB_STATION_ANGLES_DEG[station]*Math.PI/180;
 const radius=COMB_TOP_RADIUS_MM+state.radialOffsetMM;
 return {...state,position:[radius*Math.cos(angle),radius*Math.sin(angle),0] as const,rotationZ:angle-Math.PI/2};
}
/** A tooth split by a section joint counts once, only after both sections are
 * present. Engaged teeth additionally require their radial seating to finish. */
export function combToothState(progress:number,gap:number,station:number){
 const lo=COMB_GAP_CENTERS_MM[gap]-9,hi=COMB_GAP_CENTERS_MM[gap]+9;
 const required=COMB_SECTIONS.map((section,index)=>({section,index})).filter(({section})=>Math.min(section.zMaxMM,hi)-Math.max(section.zMinMM,lo)>0).map(({index})=>index);
 const states=required.map(section=>combSectionProgress(progress,section,station));
 return {visible:states.every(state=>state.visible),engaged:states.every(state=>state.seated===1),sections:required};
}
export function combCameraBlend(progress:number){return assemblyPhaseProgress(progress,.02,.09)*(1-assemblyPhaseProgress(progress,.3,.52));}
