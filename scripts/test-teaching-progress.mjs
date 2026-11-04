import assert from 'node:assert/strict';
import {TEACHING_ID, TEACHING_STAGE_COUNT, initialProgress, teachingSteps, teachingParts, normalizeTeachingResource, normalizeLegacyResourceStepIds, validateProgress, validateStoredIds} from '../lib/teaching.ts';

const progress=(currentStep,stepOrderVersion,completedStepIds=[])=>({schemaVersion:1,tutorialId:TEACHING_ID,currentStep,stepOrderVersion,currentRing:10,completedStepIds});
assert.equal(TEACHING_STAGE_COUNT,11);
assert.equal(initialProgress().stepOrderVersion,6);
const currentIds=Array.from({length:11},(_,index)=>`step-${index+11}`);
assert.deepEqual(teachingSteps.map(step=>step.id),currentIds);
assert.deepEqual(teachingSteps.map(step=>step.sceneStep),Array.from({length:11},(_,index)=>index+11));
// The semicircle-first lesson changes the physical sequence. A previous lesson
// cannot certify completion of these new actions, but selection is preserved.
let legacyResetCases=0;
for(const [version,count] of [[undefined,9],[2,9],[3,10]]){
 for(let current=1;current<=count;current++){
  const saved=progress(current,version,['step-01','step-04','step-10','step-11']);
  const before=structuredClone(saved);
  const migrated=validateProgress(saved);
  assert.equal(migrated.currentStep,1,`Old version ${version}, stage ${current}`);
  assert.equal(migrated.currentRing,10);
  assert.equal(migrated.stepOrderVersion,6);
  assert.deepEqual(migrated.completedStepIds,[]);
  assert.deepEqual(saved,before,'Migration must not mutate browser data');
  legacyResetCases++;
 }
}
const readyIds=teachingSteps.filter(step=>step.status!=='pending-design').map(step=>step.id);
assert.equal(readyIds.length,11);
for(let current=1;current<=11;current++){
 const restored=validateProgress(progress(current,6,readyIds));
 assert.equal(restored.currentStep,current);
 assert.deepEqual(restored.completedStepIds,readyIds);
 assert.deepEqual(validateProgress(restored),restored,'Current progress must round-trip');
}
assert.equal(teachingSteps.at(-1).status,undefined);
const changedStages=['step-18','step-21'];
for(let current=1;current<=11;current++){
 const old=progress(current,4,currentIds),before=structuredClone(old),migrated=validateProgress(old);
 assert.equal(migrated.currentStep,current,'The stage order is unchanged');
 assert.equal(migrated.currentRing,10);
 assert.equal(migrated.stepOrderVersion,6);
 assert.deepEqual(migrated.completedStepIds,currentIds.filter(id=>!changedStages.includes(id)),'Only frame bolting and the formerly pending comb stage need rechecking');
 assert.deepEqual(old,before);
}
for(let current=1;current<=11;current++){
 const old=progress(current,5,currentIds),before=structuredClone(old),migrated=validateProgress(old);
 assert.equal(migrated.currentStep,current);
 assert.equal(migrated.currentRing,10);
 assert.equal(migrated.stepOrderVersion,6);
 assert.deepEqual(migrated.completedStepIds,currentIds.filter(id=>id!=='step-21'),'The continuous-comb correction must preserve frame bolting and every unrelated completion');
 assert.ok(migrated.completedStepIds.includes('step-18'));
 assert.deepEqual(old,before);
}
assert.deepEqual(validateProgress(progress(11,6,['step-11','step-11','step-21','unknown','step-03'])).completedStepIds,['step-11','step-21'],'Current manual continuous-comb completion is valid');
assert.deepEqual(initialProgress().completedStepIds,[],'A supplied CAD file does not automatically complete an inspection');
assert.equal(validateProgress(progress(99,6)).currentStep,1);
assert.equal(validateProgress({...progress(1,6),currentRing:99}).currentRing,1);
assert.equal(validateProgress({...progress(5,6),tutorialId:'other'}),null);

const allowedChecks=new Set(teachingSteps.flatMap(step=>step.checks.map(check=>check.id)));
const oldChecks=['step-04-holes','step-10-count-v4','step-10-capture','step-01-interface','step-18-check-1-v4','step-21-check-1-v4','step-21-fit-check-v5','step-21-attachment-check-v5'];
assert.deepEqual(validateStoredIds({schemaVersion:1,tutorialId:TEACHING_ID,ids:oldChecks},allowedChecks),[]);
assert.deepEqual(validateStoredIds({schemaVersion:1,tutorialId:TEACHING_ID,ids:['step-18-bolting-check-v5']},allowedChecks),['step-18-bolting-check-v5'],'Frame attachment checks survive the comb correction');
const firstCheck=teachingSteps[0].checks[0].id;
assert.deepEqual(validateStoredIds({schemaVersion:1,tutorialId:TEACHING_ID,ids:[firstCheck,firstCheck,'unknown']},allowedChecks),[firstCheck]);
assert.deepEqual(normalizeLegacyResourceStepIds(['step-06'],['locator']),['step-20']);
assert.deepEqual(normalizeLegacyResourceStepIds(['step-06'],['ring-support']),['step-17']);
const oldResource={id:'fastener-m3-reference',titleZh:'磁环螺丝',titleEn:'Ring screws',stepIds:['step-05'],partIds:['short-screw']};
const migratedResource=normalizeTeachingResource(oldResource);
assert.deepEqual(migratedResource.stepIds,['step-13','step-14','step-16']);
assert.equal(migratedResource.titleZh,'磁层螺丝');
assert.equal(migratedResource.titleEn,'layer screws');
assert.deepEqual(normalizeTeachingResource(migratedResource),migratedResource);
assert.deepEqual(oldResource.stepIds,['step-05']);
assert.deepEqual(normalizeTeachingResource({id:'final-4',titleZh:'最终打印文件',titleEn:'Final print file',stepIds:[],partIds:[]}).stepIds,[]);
for(const part of teachingParts)for(const id of part.stepIds)assert.ok(currentIds.includes(id),`${part.id}: ${id}`);
console.log(JSON.stringify({status:'passed',stages:11,progressVersion:6,legacyResetCases,currentProgressRoundtrips:11,version4TargetedMigrations:11,version5TargetedMigrations:11,selectedLayerPreserved:true,frameCompletionPreserved:true,onlyOldCombInspectionInvalidated:true,combCompletionManual:true,resourceMigrationIdempotent:true}));
