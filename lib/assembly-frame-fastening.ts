import {assemblyPhaseProgress} from "./assembly-timing.ts";

/** Centres and entry faces fitted to the actual cylindrical walls of the
 * registered surport.step. Coordinates are in the level frame's world XY;
 * zOffsetMM is relative to a layer's magnetic centre. A geometric Ø5 bore
 * does not establish a purchasing thread size, bolt length or torque. */
export const FRAME_HOLDER_SOURCE_SHA256="10ae5c66feb127811b985b15a468acd73e28654a10ce660853bd93612c44df3d";
export const FRAME_HOLDER_FASTENERS=[
 {id:"right-outer-upper",support:"right",entry:[260.2,20,1],outward:[1,0,0],wallMM:5},
 {id:"right-outer-lower",support:"right",entry:[260.2,-20,1],outward:[1,0,0],wallMM:5},
 {id:"right-top",support:"right",entry:[235.1,45.1,1.9],outward:[0,1,0],wallMM:5},
 {id:"left-outer-upper",support:"left",entry:[-260.2,20,1],outward:[-1,0,0],wallMM:5},
 {id:"left-outer-lower",support:"left",entry:[-260.2,-20,1],outward:[-1,0,0],wallMM:5},
 {id:"left-top",support:"left",entry:[-235.1,45.1,1.9],outward:[0,1,0],wallMM:5},
 {id:"bottom-left",support:"bottom",entry:[-20.05,-211,1],outward:[0,1,0],wallMM:4},
 {id:"bottom-right",support:"bottom",entry:[20.05,-211,1],outward:[0,1,0],wallMM:4},
] as const;
export const frameLayerArrival=(progress:number)=>assemblyPhaseProgress(progress,.035,.44);
export function frameFastenerProgress(progress:number,index:number){
 const delay=index*.008;
 return {
  nut:assemblyPhaseProgress(progress,.46+delay,.60+delay),
  bolt:assemblyPhaseProgress(progress,.62+delay,.79+delay),
  tighten:assemblyPhaseProgress(progress,.81+delay,.94+delay),
  visible:progress>=.44+delay,
 };
}
