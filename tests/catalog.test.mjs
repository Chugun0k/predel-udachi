import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,excluded} from '../src/catalog.js';
import {lessons} from '../src/lessons.js';
import {checkResponse} from '../src/engine.js';

test('90 standalone tasks, 4 documented exclusions, no duplicate task IDs',()=>{
 assert.equal(catalog.length,90);
 assert.equal(excluded.length,4);
 assert.equal(new Set(catalog.map(x=>x.id)).size,90);
 assert.ok(catalog.every(t=>!t.starred&&t.statement.length>30));
 assert.deepEqual(excluded.map(x=>x.id).sort(),['S01-Q02','S02-Q12','S02-Q14','S03-Q10']);
 assert.deepEqual(excluded.filter(x=>x.exclusionReason==='requires_missing_lecture').map(x=>x.id).sort(),['S01-Q02','S02-Q12']);
});
test('counts of included tasks for all 9 sheets',()=>{
 const expected=[10,12,9,11,7,7,8,15,11];
 for(let s=1;s<=9;s++)assert.equal(catalog.filter(t=>t.seminar===s).length,expected[s-1]);
});
test('implemented implies complete lesson content',()=>{
 assert.deepEqual(catalog.filter(x=>x.implemented).map(x=>x.id).sort(),Object.keys(lessons).sort());
 for(const [id,l] of Object.entries(lessons)){
  assert.ok(l.steps.length>=4,id);
  assert.equal(l.steps[0].kind,'theory',id);
  assert.match(l.steps[0].formula,/^\$\$[\s\S]*\$\$$/,`${id} theory formula must use Markdown math fences`);
  assert.ok(l.steps[0].examples?.length>=2,`${id} needs worked theory examples`);
  assert.equal(l.steps[1].kind,'experiment',id);
  assert.ok(['final','proof'].includes(l.steps.at(-1).kind),id);
  for(const step of l.steps){assert.ok(step.title&&['theory','experiment','number','choice','text','expression','set','proof','final'].includes(step.kind),id);}
 }
});
test('S01-Q01 is a full proof lesson with three atoms and two implications',()=>{
 const lesson=lessons['S01-Q01'];
 assert.equal(lesson.steps.length,6);
 assert.deepEqual(lesson.steps.slice(2,5).map(x=>x.kind),['text','expression','set']);
 const proof=lesson.steps.at(-1);
 assert.equal(proof.kind,'proof');
 assert.deepEqual(proof.groups.map(x=>x.id),['onlyIf','if']);
 assert.ok(proof.groups.every(x=>x.stepIds.length>=3));
 assert.ok(lesson.steps.slice(2).every(x=>x.hints.length===2));
 assert.equal(lesson.practice.length,3);
 assert.ok(lesson.practice.every(x=>x.problem&&x.hint&&x.solution&&x.answer));
});
test('lecture-dependent tasks are excluded from the playable catalog',()=>{
 assert.equal(catalog.some(x=>x.id==='S01-Q02'||x.id==='S02-Q12'),false);
 assert.ok(excluded.filter(x=>['S01-Q02','S02-Q12'].includes(x.id)).every(x=>x.exclusionReason==='requires_missing_lecture'));
});
test('S01-Q03 covers sampling without replacement and paper practice',()=>{
 const lesson=lessons['S01-Q03'];
 assert.deepEqual(lesson.steps.map(x=>x.kind),['theory','experiment','number','number','number','final']);
 assert.equal(lesson.steps[1].mode,'urnColors');
 assert.equal(lesson.practice.length,3);
});
test('chapter 1 is a complete ten-lesson learning path',()=>{
 const chapter=catalog.filter(t=>t.seminar===1);
 assert.equal(chapter.length,10);
 assert.ok(chapter.every(t=>t.implemented));
 assert.deepEqual(chapter.map(t=>t.id),['S01-Q01','S01-Q03','S01-Q04','S01-Q05','S01-Q06','S01-Q07','S01-Q08','S01-Q09','S01-Q10','S01-Q11']);
 const expectedModes={
  'S01-Q05':'diceOrder','S01-Q06':'permutation','S01-Q08':'vennAtoms',
  'S01-Q09':'suitProfiles','S01-Q10':'children','S01-Q11':'continuity'
 };
 for(const [id,mode] of Object.entries(expectedModes)){
  const lesson=lessons[id];
  assert.equal(lesson.steps[1].mode,mode,id);
  assert.ok(lesson.steps.slice(2,-1).length>=2,id);
  assert.ok(lesson.steps.slice(2).every(step=>step.hints?.length===2),id);
  assert.ok(lesson.practice.length>=2,id);
  assert.ok(lesson.practice.every(item=>item.problem&&item.hint&&item.solution&&item.answer),id);
 }
});
test('chapter 1 compound finals preserve source subparts',()=>{
 const venn=lessons['S01-Q08'].steps.at(-1);
 assert.equal(venn.kind,'proof');
 assert.deepEqual(venn.groups.map(group=>group.id),['bound','construction']);
 const children=lessons['S01-Q10'].steps.at(-1);
 assert.equal(children.kind,'proof');
 assert.deepEqual(children.groups.map(group=>group.id),['ab','bc','ac','model']);
 assert.ok(children.groups.every(group=>group.stepIds.length===3));
 const continuity=lessons['S01-Q11'].steps.at(-1);
 assert.equal(continuity.kind,'proof');
 assert.deepEqual(continuity.groups.map(group=>group.id),['forward','reverse']);
 assert.ok(continuity.groups.every(group=>group.stepIds.length===4));
});
test('answer placeholders demonstrate syntax without revealing the current answer',()=>{
 for(const [id,lesson] of Object.entries(lessons))for(const step of lesson.steps){
  if(!step.placeholder)continue;
  const sample=step.placeholder.replace(/^(?:например,?|можно ввести)\s*/iu,'').trim();
  assert.equal(checkResponse(step,sample),false,`${id}: placeholder reveals the answer for “${step.title}”`);
 }
});
test('chapter 2 has twelve complete and distinct learning paths',()=>{
 const ids=['S02-Q01','S02-Q02','S02-Q03','S02-Q04','S02-Q05','S02-Q06','S02-Q07','S02-Q08','S02-Q09','S02-Q10','S02-Q11','S02-Q13'];
 assert.deepEqual(catalog.filter(t=>t.seminar===2).map(t=>t.id),ids);
 assert.ok(ids.every(id=>catalog.find(t=>t.id===id)?.implemented));
 const modes=['binomial','graphCycle','diceCondition','diagnosticMix','fixedHeads','conditionalTree','parityRecurrence','coinMixture','subsetBits','parityDice','bagMixture','bipartiteCycle'];
 assert.deepEqual(ids.map(id=>lessons[id].steps[1].mode),modes);
 for(const id of ids){
  const lesson=lessons[id];
  assert.ok(lesson.practice?.length>=2,id);
  assert.ok(lesson.steps.slice(2,-1).length>=2,id);
  assert.ok(lesson.steps.slice(2).every(step=>step.hints?.length===2),id);
 }
});
test('chapter 3 has nine source-complete learning paths',()=>{
 const ids=Array.from({length:9},(_,i)=>`S03-Q${String(i+1).padStart(2,'0')}`);
 assert.deepEqual(catalog.filter(t=>t.seminar===3).map(t=>t.id),ids);
 assert.ok(ids.every(id=>catalog.find(t=>t.id===id)?.implemented));
 assert.deepEqual(ids.map(id=>lessons[id].steps[1].mode),['jointLaw','bernoulliFunctions','geometricGrid','binomialSum','coinThinning','walkPosition','reflection','ballot','orderStats']);
 for(const id of ids){
  const lesson=lessons[id];
  assert.ok(lesson.practice?.length>=2,id);
  assert.ok(lesson.steps.slice(2,-1).length>=2,id);
  assert.ok(lesson.steps.slice(2).every(step=>step.hints?.length===2),id);
 }
 assert.deepEqual(lessons['S03-Q09'].steps.at(-1).groups.map(g=>g.id),['white','min','max','first']);
});
test('chapter 4 implements ten source-grounded lessons and keeps Q11 blocked',()=>{
 const ready=Array.from({length:10},(_,i)=>`S04-Q${String(i+1).padStart(2,'0')}`);
 assert.ok(ready.every(id=>catalog.find(t=>t.id===id)?.implemented));
 assert.equal(catalog.find(t=>t.id==='S04-Q11')?.implemented,false);
 assert.equal(lessons['S04-Q11'],undefined);
 assert.deepEqual(ready.map(id=>lessons[id].steps[1].mode),['conditionalChain','permutationFibers','jointProduct','uniformStopping','poissonThinning','shiftMixture','factoryRisk','poissonConvolution','geometricMemory','rareEvents']);
 for(const id of ready){
  assert.ok(lessons[id].practice.length>=2,id);
  assert.ok(lessons[id].steps.slice(2,-1).length>=2,id);
  assert.ok(lessons[id].steps.slice(2).every(step=>step.hints?.length===2),id);
 }
 assert.equal(lessons['S04-Q04'].steps.at(-1).groups.length,3);
 assert.equal(lessons['S04-Q07'].steps.at(-1).groups.length,4);
});
test('chapter 5 has seven complete expectation lessons',()=>{
 const ids=Array.from({length:7},(_,i)=>`S05-Q${String(i+1).padStart(2,'0')}`);
 assert.deepEqual(catalog.filter(t=>t.seminar===5).map(t=>t.id),ids);
 assert.ok(ids.every(id=>catalog.find(t=>t.id===id)?.implemented));
 const sourceTable=catalog.find(t=>t.id==='S05-Q01').sourceTable;
 assert.equal(sourceTable.columns.length,4);
 assert.deepEqual(sourceTable.rows.map(row=>row.length),[5,5,5,5]);
 assert.equal(sourceTable.rows.at(-1).at(-1),'1');
 assert.deepEqual(ids.map(id=>lessons[id].steps[1].mode),['probabilityTable','fixedPointMoments','truncatedDonations','transformedJoint','lootboxTail','signalRing','poissonMoments']);
 for(const id of ids){
  assert.ok(lessons[id].practice.length>=2,id);
  assert.ok(lessons[id].steps.slice(2,-1).length>=2,id);
  assert.ok(lessons[id].steps.slice(2).every(step=>step.hints?.length===2),id);
 }
 assert.deepEqual(lessons['S05-Q01'].steps.at(-1).groups.map(g=>g.id),['marg','ind','cond']);
});
test('chapter 6 has seven source-complete conditional expectation lessons',()=>{
 const ids=Array.from({length:7},(_,i)=>`S06-Q${String(i+1).padStart(2,'0')}`);
 assert.deepEqual(catalog.filter(t=>t.seminar===6).map(t=>t.id),ids);
 assert.ok(ids.every(id=>catalog.find(t=>t.id===id)?.implemented));
 assert.deepEqual(ids.map(id=>lessons[id].steps[1].mode),['covarianceCross','poissonSplit','maxRegression','conditionalRows','poissonEggs','correlationBound','defectTesting']);
 for(const id of ids){
  assert.equal(lessons[id].steps.length,5,id);
  assert.ok(lessons[id].practice.length>=2,id);
  assert.equal(lessons[id].steps[0].examples.length,3,id);
  assert.equal(lessons[id].steps.at(-1).kind,'proof',id);
  assert.ok(lessons[id].steps.slice(2).every(step=>step.hints?.length===2),id);
 }
 assert.deepEqual(lessons['S06-Q03'].steps.at(-1).groups.map(g=>g.id),['conditional','affine','errors']);
 assert.deepEqual(lessons['S06-Q04'].steps.at(-1).groups.map(g=>g.id),['joint','marg','cond','mean']);
});
test('chapter 7 has eight source-complete concentration lessons',()=>{
 const ids=Array.from({length:8},(_,i)=>`S07-Q${String(i+1).padStart(2,'0')}`);
 assert.deepEqual(catalog.filter(t=>t.seminar===7).map(t=>t.id),ids);
 assert.ok(ids.every(id=>catalog.find(t=>t.id===id)?.implemented));
 assert.deepEqual(ids.map(id=>lessons[id].steps[1].mode),['boundedMean','rareOutlier','concentrationCompare','mixedCdf','profitBound','sampleSize','adjacentPairs','interleavedLLN']);
 for(const id of ids){
  assert.equal(lessons[id].steps.length,5,id);
  assert.ok(lessons[id].practice.length>=2,id);
  assert.equal(lessons[id].steps[0].examples.length,3,id);
  assert.equal(lessons[id].steps.at(-1).kind,'proof',id);
  assert.ok(lessons[id].steps.slice(2).every(step=>step.hints?.length===2),id);
 }
 assert.deepEqual(lessons['S07-Q01'].steps.at(-1).groups.map(g=>g.id),['a','b','c','d']);
 assert.deepEqual(lessons['S07-Q03'].steps.at(-1).groups.map(g=>g.id),['literal','half','root','compare']);
});
test('chapter 8 has fifteen source-complete continuous-distribution lessons',()=>{
 const ids=Array.from({length:15},(_,i)=>`S08-Q${String(i+1).padStart(2,'0')}`);
 assert.deepEqual(catalog.filter(t=>t.seminar===8).map(t=>t.id),ids);
 assert.ok(ids.every(id=>catalog.find(t=>t.id===id)?.implemented));
 assert.deepEqual(ids.map(id=>lessons[id].steps[1].mode),['uniformGraphs','sineBranches','characteristicSpin','triangleSlices','normalTruncation','triangleIntegrals','singularCurve','normalStandardize','gammaDensity','monteCarlo','vectorBlocks','orderStatsContinuous','normalSquare','lognormalShape','simplexStopping']);
 for(const id of ids){
  assert.equal(lessons[id].steps.length,5,id);
  assert.ok(lessons[id].practice.length>=2,id);
  assert.equal(lessons[id].steps[0].examples.length,3,id);
  assert.equal(lessons[id].steps.at(-1).kind,'proof',id);
  assert.ok(lessons[id].steps.slice(2).every(step=>step.hints?.length===2),id);
 }
 assert.notEqual(lessons['S08-Q04'].steps[1].mode,lessons['S08-Q06'].steps[1].mode);
 assert.match(lessons['S08-Q09'].steps[0].detail,/1\/ξ²/);
});
test('chapter 9 has eleven source-complete Gaussian lessons',()=>{
 const ids=Array.from({length:11},(_,i)=>`S09-Q${String(i+1).padStart(2,'0')}`);
 assert.deepEqual(catalog.filter(t=>t.seminar===9).map(t=>t.id),ids);
 assert.ok(ids.every(id=>catalog.find(t=>t.id===id)?.implemented));
 assert.deepEqual(ids.map(id=>lessons[id].steps[1].mode),['quarterDisk','signedNormal','coatingSlices','outlierContest','supportRace','varianceInterval','normalReflection','towerDensity','gaussianDiagnostic','gaussianRegression','gaussianBlock']);
 for(const id of ids){
  assert.equal(lessons[id].steps.length,5,id);
  assert.ok(lessons[id].practice.length>=2,id);
  assert.equal(lessons[id].steps[0].examples.length,3,id);
  assert.equal(lessons[id].steps.at(-1).kind,'proof',id);
  assert.ok(lessons[id].steps.slice(2).every(step=>step.hints?.length===2),id);
 }
 assert.deepEqual(lessons['S09-Q03'].steps.at(-1).groups.map(g=>g.id),['direct','conditional','tower']);
 assert.match(lessons['S09-Q06'].steps[0].detail,/противоречив/);
 assert.deepEqual(lessons['S09-Q11'].steps.at(-1).groups.map(g=>g.id),['gaussian','matrix','density']);
});
