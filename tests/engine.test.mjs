import test from 'node:test';
import assert from 'node:assert/strict';
import {initialProgress,markStep,completedCount,masteredInChapter,parseAnswer,checkResponse,xpLevel,lessonState} from '../src/engine.js';
import {lessons} from '../src/lessons.js';
test('calculator fractions powers arithmetic and invalid data',()=>{
 assert.ok(Math.abs(parseAnswer('364/365*363/365')-(364/365)*(363/365))<1e-12);
 assert.ok(Math.abs(parseAnswer('0,9^10')-Math.pow(.9,10))<1e-12);
 assert.ok(Math.abs(parseAnswer('11/36')-11/36)<1e-12);
 assert.ok(Number.isNaN(parseAnswer('globalThis.alert(1)')));
 assert.ok(Number.isNaN(parseAnswer('1/0')));
 assert.ok(Number.isNaN(parseAnswer('2***3')));
});
test('lesson final results match known source exercises',()=>{
 const urn=lessons['S01-Q03'].steps.at(-1),b=lessons['S01-Q04'].steps.at(-1),w=lessons['S01-Q07'].steps.at(-1),bin=lessons['S02-Q01'].steps.at(-1);
 assert.ok(checkResponse(urn,'32/455'));
 assert.ok(checkResponse(urn,'0.07032967'));
 assert.ok(!checkResponse(urn,'96/15'));
 assert.ok(checkResponse(b,'23'));
 assert.ok(!checkResponse(b,'22'));
 assert.ok(checkResponse(w,'11/36'));
 assert.ok(checkResponse(bin,'0,9872'));
 assert.ok(!checkResponse(bin,'0.9'));
});
test('S01-Q03 atomic combinatorial counts reject common mistakes',()=>{
 const steps=lessons['S01-Q03'].steps;
 assert.ok(checkResponse(steps[2],'15'));
 assert.ok(checkResponse(steps[3],'96'));
 assert.ok(checkResponse(steps[4],'1365'));
 assert.ok(!checkResponse(steps[2],'13'));
 assert.ok(!checkResponse(steps[3],'24'));
 assert.ok(!checkResponse(steps[4],'15*14*13*12'));
});
test('S01-Q01 symbolic atoms, roots and both proof directions are checked',()=>{
 const steps=lessons['S01-Q01'].steps;
 assert.ok(checkResponse(steps[2],' E '));
 assert.ok(!checkResponse(steps[2],'Ω'));
 assert.ok(checkResponse(steps[3],'p² = p'));
 assert.ok(!checkResponse(steps[3],'p=2p'));
 assert.ok(checkResponse(steps[4],'{1; 0}'));
 assert.ok(!checkResponse(steps[4],'0'));
 const proof=steps[5];
 assert.ok(checkResponse(proof,{onlyIf:['n1','n2','n3','n4'],if:['s1','s2','s3']}));
 assert.ok(!checkResponse(proof,{onlyIf:['n2','n1','n3','n4'],if:['s1','s2','s3']}));
 assert.ok(!checkResponse(proof,{onlyIf:['n1'],if:[]}));
});
test('progress and xp cannot be farmed on repeated steps',()=>{
 let p=initialProgress();const id='S01-Q07';const total=5;
 p=markStep(p,id,0,total,{award:false}).progress;
 assert.equal(p.xp,0);
 p=markStep(p,id,1,total).progress;
 assert.equal(p.xp,10);
 const repeated=markStep(p,id,1,total);
 assert.equal(repeated.awarded,0);
 assert.equal(repeated.progress.xp,10);
 const blocked=markStep(p,id,4,total,{final:true});
 assert.equal(blocked.blocked,true);
 assert.equal(blocked.progress.xp,10);
 p=markStep(p,id,2,total).progress;
 p=markStep(p,id,3,total).progress;
 p=markStep(p,id,4,total,{final:true}).progress;
 assert.equal(completedCount(p),1);
 assert.equal(masteredInChapter(p,1),1);
 assert.equal(p.xp,100);
 assert.equal(xpLevel(p.xp),2);
 assert.ok(lessonState(p,id).completedAt);
 p.lessons.UNKNOWN={completedAt:new Date().toISOString()};
 assert.equal(completedCount(p,new Set([id])),1);
 const replay=markStep({...p,lessons:{...p.lessons,[id]:{...p.lessons[id],index:0}}},id,0,total,{award:false});
 assert.equal(lessonState(replay.progress,id).index,1);
 assert.equal(replay.awarded,0);
});
test('new chapter 1 numeric finals and boundaries are graded',()=>{
 const finals=['S01-Q05','S01-Q06','S01-Q09'].map(id=>lessons[id].steps.at(-1));
 assert.ok(checkResponse(finals[0],'5/54'));
 assert.ok(!checkResponse(finals[0],'1/6'));
 assert.ok(checkResponse(finals[1],'11/30'));
 assert.ok(!checkResponse(finals[1],'19/30'));
 const boundary=lessons['S01-Q08'].steps[4];
 assert.ok(checkResponse(boundary,'1/2'));
 assert.ok(!checkResponse(boundary,'.51'));
 assert.ok(checkResponse(finals[2],'83486/195755'));
 assert.ok(checkResponse(finals[2],'.426482'));
 assert.ok(!checkResponse(finals[2],'.5'));
 const suits=lessons['S01-Q09'].steps;
 assert.ok(checkResponse(suits[3],'2513368'));
 assert.ok(checkResponse(suits[4],'6169176'));
 assert.ok(!checkResponse(suits[3],'2513367'));
});
test('children and continuity proof builders require every source chain in order',()=>{
 const venn=lessons['S01-Q08'].steps.at(-1);
 const vennAnswer={bound:['b1','b2','b3','b4'],construction:['c1','c2','c3']};
 assert.ok(checkResponse(venn,vennAnswer));
 assert.ok(!checkResponse(venn,{...vennAnswer,bound:['b2','b1','b3','b4']}));
 const children=lessons['S01-Q10'].steps.at(-1);
 const childAnswer={ab:['ab1','ab2','ab3'],bc:['bc1','bc2','bc3'],ac:['ac1','ac2','ac3'],model:['m1','m2','m3']};
 assert.ok(checkResponse(children,childAnswer));
 assert.ok(!checkResponse(children,{...childAnswer,bc:['bc2','bc1','bc3']}));
 assert.ok(!checkResponse(children,{...childAnswer,model:['m1','m2']}));
 const continuity=lessons['S01-Q11'].steps.at(-1);
 const continuityAnswer={forward:['f1','f2','f3','f4'],reverse:['r1','r2','r3','r4']};
 assert.ok(checkResponse(continuity,continuityAnswer));
 assert.ok(!checkResponse(continuity,{...continuityAnswer,reverse:['r2','r1','r3','r4']}));
});
test('chapter 2 numerical and symbolic checkpoints match the source solutions',()=>{
 const checks=[
  ['S02-Q02',2,'12'],['S02-Q02',3,'5'],
  ['S02-Q03',2,'18'],['S02-Q03',3,'1/2'],
  ['S02-Q04',2,'.18'],['S02-Q04',3,'.09'],
  ['S02-Q05',2,'15'],['S02-Q05',3,'5'],['S02-Q05',4,'m/n'],
  ['S02-Q06',3,'.8'],
  ['S02-Q07',2,'p(1-pₙ₋₁)+(1-p)pₙ₋₁'],['S02-Q07',3,'0'],['S02-Q07',4,'(1+(1-2p)^n)/2'],
  ['S02-Q08',2,'5/8'],['S02-Q08',3,'13/32'],
  ['S02-Q09',2,'7/8'],['S02-Q09',3,'p+(1-p)^3'],
  ['S02-Q10',2,'8'],['S02-Q10',3,'1'],
  ['S02-Q11',2,'3/8'],['S02-Q11',3,'1/4'],
  ['S02-Q13',2,'8'],['S02-Q13',3,'6']
 ];
 for(const [id,index,value] of checks)assert.ok(checkResponse(lessons[id].steps[index],value),`${id} step ${index}`);
 assert.ok(!checkResponse(lessons['S02-Q03'].steps[3],'1/4'));
 assert.ok(!checkResponse(lessons['S02-Q08'].steps[3],'25/64'));
 assert.ok(!checkResponse(lessons['S02-Q11'].steps[2],'1/4'));
});
test('every chapter 2 proof boss checks all groups and their order',()=>{
 const ids=['S02-Q02','S02-Q03','S02-Q04','S02-Q06','S02-Q08','S02-Q09','S02-Q10','S02-Q11','S02-Q13'];
 for(const id of ids){
  const boss=lessons[id].steps.at(-1);
  assert.equal(boss.kind,'proof',id);
  const correct=Object.fromEntries(boss.groups.map(group=>[group.id,[...group.stepIds]]));
  assert.ok(checkResponse(boss,correct),id);
  const first=boss.groups[0],wrong={...correct,[first.id]:[...first.stepIds].reverse()};
  assert.ok(!checkResponse(boss,wrong),`${id} must reject wrong order`);
 }
});
test('chapter 3 checkpoints cover joint laws, tails, thinning and lattice boundaries',()=>{
 const checks=[
  ['S03-Q01',2,'1/2'],['S03-Q01',3,'1/16'],
  ['S03-Q02',2,'0'],['S03-Q03',2,'1/3'],['S03-Q03',3,'15/16'],
  ['S03-Q04',2,'1/32'],['S03-Q04',3,'Bin(n+m,p)'],
  ['S03-Q05',2,'.16'],['S03-Q05',3,'Bin(n,p^2)'],
  ['S03-Q06',2,'5'],['S03-Q07',3,'-1'],
  ['S03-Q08',2,'2'],['S03-Q08',3,'C(a+b-1,a)'],
  ['S03-Q09',2,String(1-Math.pow(.8,5))],['S03-Q09',3,'14/15']
 ];
 for(const [id,index,value] of checks)assert.ok(checkResponse(lessons[id].steps[index],value),`${id} step ${index}`);
 assert.ok(!checkResponse(lessons['S03-Q01'].steps[3],'1/4'));
 assert.ok(!checkResponse(lessons['S03-Q05'].steps[3],'Bin(n,p)'));
 assert.ok(!checkResponse(lessons['S03-Q09'].steps[3],'1/15'));
});
test('chapter 3 proof bosses require every source component in order',()=>{
 for(let q=1;q<=9;q++){
  const id=`S03-Q${String(q).padStart(2,'0')}`,boss=lessons[id].steps.at(-1);
  assert.equal(boss.kind,'proof',id);
  const correct=Object.fromEntries(boss.groups.map(g=>[g.id,[...g.stepIds]]));
  assert.ok(checkResponse(boss,correct),id);
  const first=boss.groups[0];
  assert.ok(!checkResponse(boss,{...correct,[first.id]:[...first.stepIds].reverse()}),id);
 }
});
test('chapter 4 checkpoints and all proof groups are graded',()=>{
 const checks=[['S04-Q01',2,'P(A|B∩C)'],['S04-Q02',2,'0;1;3'],['S04-Q04',2,'1/3'],['S04-Q04',3,'(1-θ)^n'],['S04-Q05',2,'Bin(n,p)'],['S04-Q05',3,'Poi(λp)'],['S04-Q06',2,'x+1'],['S04-Q07',2,'.025'],['S04-Q08',2,'6'],['S04-Q08',3,'Poi(μ+ν)'],['S04-Q09',2,'(1-p)^n'],['S04-Q09',3,'.2'],['S04-Q10',2,'Σλ_j']];
 for(const [id,index,value] of checks)assert.ok(checkResponse(lessons[id].steps[index],value),`${id} step ${index}`);
 assert.ok(!checkResponse(lessons['S04-Q07'].steps[2],'.03'));
 assert.ok(!checkResponse(lessons['S04-Q09'].steps[2],'(1-p)^(n-1)'));
 for(let q=1;q<=10;q++){
  const id=`S04-Q${String(q).padStart(2,'0')}`,boss=lessons[id].steps.at(-1);
  assert.equal(boss.kind,'proof',id);
  const correct=Object.fromEntries(boss.groups.map(g=>[g.id,[...g.stepIds]]));
  assert.ok(checkResponse(boss,correct),id);
  const first=boss.groups[0];
  assert.ok(!checkResponse(boss,{...correct,[first.id]:[...first.stepIds].reverse()}),id);
 }
});
test('chapter 5 checkpoints and proof bosses cover every source part',()=>{
 const checks=[['S05-Q01',2,'5;6;7'],['S05-Q01',3,'2/3'],['S05-Q02',2,'1'],['S05-Q02',3,'1'],['S05-Q03',2,'n*mu'],['S05-Q04',2,'1/3'],['S05-Q04',3,'1/2'],['S05-Q05',2,'q^m'],['S05-Q05',3,'327.68'],['S05-Q06',2,'1/4'],['S05-Q06',3,'250'],['S05-Q07',2,'λ²'],['S05-Q07',3,'λ²+λ']];
 for(const [id,index,value] of checks)assert.ok(checkResponse(lessons[id].steps[index],value),`${id} step ${index}`);
 assert.ok(!checkResponse(lessons['S05-Q04'].steps[2],'1/6'));
 assert.ok(!checkResponse(lessons['S05-Q05'].steps[3],'32.768'));
 for(let q=1;q<=7;q++){
  const id=`S05-Q${String(q).padStart(2,'0')}`,boss=lessons[id].steps.at(-1);
  const correct=Object.fromEntries(boss.groups.map(g=>[g.id,[...g.stepIds]]));
  assert.ok(checkResponse(boss,correct),id);
  const first=boss.groups[0];
  assert.ok(!checkResponse(boss,{...correct,[first.id]:[...first.stepIds].reverse()}),id);
 }
});
test('chapter 6 checkpoints and proof bosses cover every source part',()=>{
 const checks=[
  ['S06-Q01',2,'0'],['S06-Q01',3,'1/16'],
  ['S06-Q02',2,'.4'],['S06-Q02',3,'Bin(n,1/2)'],
  ['S06-Q03',2,'24/5'],['S06-Q03',3,'16/11'],
  ['S06-Q04',2,'2/3'],['S06-Q04',3,'1/3'],
  ['S06-Q05',2,'p*eta'],['S06-Q05',3,'xi+lambda*(1-p)'],
  ['S06-Q06',2,'2'],['S06-Q06',3,'1'],
  ['S06-Q07',2,'1/9'],['S06-Q07',3,'1']
 ];
 for(const [id,index,value] of checks)assert.ok(checkResponse(lessons[id].steps[index],value),`${id} step ${index}`);
 assert.ok(!checkResponse(lessons['S06-Q01'].steps[3],'0'));
 assert.ok(!checkResponse(lessons['S06-Q03'].steps[2],'5'));
 assert.ok(!checkResponse(lessons['S06-Q07'].steps[2],'1/10'));
 for(let q=1;q<=7;q++){
  const id=`S06-Q${String(q).padStart(2,'0')}`,boss=lessons[id].steps.at(-1);
  const correct=Object.fromEntries(boss.groups.map(g=>[g.id,[...g.stepIds]]));
  assert.ok(checkResponse(boss,correct),id);
  const first=boss.groups[0];
  assert.ok(!checkResponse(boss,{...correct,[first.id]:[...first.stepIds].reverse()}),id);
 }
});
test('chapter 7 checkpoints and proof bosses cover every source part',()=>{
 const checks=[
  ['S07-Q01',2,'3/7'],['S07-Q01',3,'4/7'],
  ['S07-Q02',2,'1.54851'],['S07-Q02',3,'122.6053'],
  ['S07-Q03',2,'.2'],['S07-Q03',3,'.2346383322'],
  ['S07-Q04',2,'31/72'],['S07-Q04',3,'31/5184'],
  ['S07-Q05',2,'1/3'],['S07-Q05',3,'2/3'],
  ['S07-Q06',2,'.0025'],['S07-Q06',3,'4000'],
  ['S07-Q07',2,'p^2'],['S07-Q07',3,'1/16'],
  ['S07-Q08',2,'0'],['S07-Q08',3,'.16']
 ];
 for(const [id,index,value] of checks)assert.ok(checkResponse(lessons[id].steps[index],value),`${id} step ${index}`);
 assert.ok(!checkResponse(lessons['S07-Q01'].steps[3],'1/2'));
 assert.ok(!checkResponse(lessons['S07-Q04'].steps[3],'31/162'));
 assert.ok(!checkResponse(lessons['S07-Q06'].steps[3],'3999'));
 for(let q=1;q<=8;q++){
  const id=`S07-Q${String(q).padStart(2,'0')}`,boss=lessons[id].steps.at(-1);
  const correct=Object.fromEntries(boss.groups.map(g=>[g.id,[...g.stepIds]]));
  assert.ok(checkResponse(boss,correct),id);
  const first=boss.groups[0];
  assert.ok(!checkResponse(boss,{...correct,[first.id]:[...first.stepIds].reverse()}),id);
 }
});
test('chapter 8 checkpoints and proof bosses cover every source part',()=>{
 const checks=[
  ['S08-Q01',2,'.25'],['S08-Q01',3,'.25'],
  ['S08-Q02',2,'1/3'],['S08-Q02',3,'.6366197724'],
  ['S08-Q03',2,'1-p+pe^{it}'],['S08-Q03',3,'(1-p+pe^{it})^n'],
  ['S08-Q04',2,'1'],['S08-Q04',3,'1.5'],
  ['S08-Q05',2,'.3989422804'],['S08-Q05',3,'.5'],
  ['S08-Q06',2,'.8'],['S08-Q06',3,'1.2'],
  ['S08-Q07',2,'1'],['S08-Q07',3,'1'],
  ['S08-Q08',2,'2'],['S08-Q08',3,'.6065306597'],
  ['S08-Q09',2,'.5'],['S08-Q09',3,'.5'],
  ['S08-Q10',2,'cos(x)'],['S08-Q10',3,'2'],
  ['S08-Q11',2,'0'],['S08-Q11',3,'1'],
  ['S08-Q12',2,'.25'],['S08-Q12',3,'.875'],
  ['S08-Q13',2,'.682689492'],['S08-Q13',3,'.5'],
  ['S08-Q14',2,'.3989422804'],['S08-Q14',3,'1.6487212707'],
  ['S08-Q15',2,'1/48'],['S08-Q15',3,'2']
 ];
 for(const [id,index,value] of checks)assert.ok(checkResponse(lessons[id].steps[index],value),`${id} step ${index}`);
 assert.ok(!checkResponse(lessons['S08-Q02'].steps[3],'.5'));
 assert.ok(!checkResponse(lessons['S08-Q09'].steps[3],'3'));
 assert.ok(!checkResponse(lessons['S08-Q15'].steps[2],'1/8'));
 for(let q=1;q<=15;q++){
  const id=`S08-Q${String(q).padStart(2,'0')}`,boss=lessons[id].steps.at(-1);
  const correct=Object.fromEntries(boss.groups.map(g=>[g.id,[...g.stepIds]]));
  assert.ok(checkResponse(boss,correct),id);
  const first=boss.groups[0];
  assert.ok(!checkResponse(boss,{...correct,[first.id]:[...first.stepIds].reverse()}),id);
 }
});
test('chapter 9 checkpoints and proof bosses cover every source part',()=>{
 const checks=[
  ['S09-Q01',2,'.42441318'],['S09-Q01',3,'.15915494'],
  ['S09-Q02',2,'1'],['S09-Q02',3,'0'],
  ['S09-Q03',2,'.35'],['S09-Q03',3,'.15625'],
  ['S09-Q04',2,'.51'],['S09-Q04',3,'-48.49'],
  ['S09-Q05',2,'1'],['S09-Q05',3,'.5'],
  ['S09-Q06',2,'.25'],['S09-Q06',3,'9'],
  ['S09-Q07',2,'0'],['S09-Q07',3,'.602503914'],
  ['S09-Q08',2,'.5'],['S09-Q08',3,'.5'],
  ['S09-Q09',2,'1'],['S09-Q09',3,'.5'],
  ['S09-Q10',2,'1/3'],['S09-Q10',3,'2'],
  ['S09-Q11',2,'.75'],['S09-Q11',3,'-2/3']
 ];
 for(const [id,index,value] of checks)assert.ok(checkResponse(lessons[id].steps[index],value),`${id} step ${index}`);
 assert.ok(!checkResponse(lessons['S09-Q01'].steps[3],'.25'));
 assert.ok(!checkResponse(lessons['S09-Q04'].steps[3],'48.49'));
 assert.ok(!checkResponse(lessons['S09-Q11'].steps[2],'1'));
 for(let q=1;q<=11;q++){
  const id=`S09-Q${String(q).padStart(2,'0')}`,boss=lessons[id].steps.at(-1);
  const correct=Object.fromEntries(boss.groups.map(g=>[g.id,[...g.stepIds]]));
  assert.ok(checkResponse(boss,correct),id);
  const first=boss.groups[0];
  assert.ok(!checkResponse(boss,{...correct,[first.id]:[...first.stepIds].reverse()}),id);
 }
});
