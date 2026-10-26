export const STORAGE_KEY = 'probquest-academy-v2';
export const VERSION = 2;
export function initialProgress(){return {version:VERSION,lessons:{},xp:0,lastActive:null,dayCompletions:{}};}
export function safeLoad(storage){try{const parsed=JSON.parse(storage.getItem(STORAGE_KEY));if(parsed?.version===VERSION && parsed?.lessons && Number.isFinite(parsed.xp))return parsed;}catch(_){}return initialProgress();}
export function safeSave(storage,state){try{storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch(_){return false;}}
export function lessonState(progress,id){return progress.lessons[id]||{index:0,doneSteps:[],attempts:0,hintsUsed:0,completedAt:null};}
export function completedCount(progress,allowedIds=null){return Object.entries(progress.lessons).filter(([id,l])=>(!allowedIds||allowedIds.has(id))&&l.completedAt).length;}
export function masteredInChapter(progress,chapter,allowedIds=null){return Object.entries(progress.lessons).filter(([k,v])=>(!allowedIds||allowedIds.has(k))&&k.startsWith(`S${String(chapter).padStart(2,'0')}-`)&&v.completedAt).length;}
export function xpLevel(xp){return Math.floor(xp/100)+1;}
export function xpInLevel(xp){return xp%100;}
export function localDayKey(now=new Date()){return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');}
export function markStep(progress,id,index,total,{final=false,award=true}={}){
 const old=lessonState(progress,id);
 if(old.doneSteps.includes(index)){
  const lessons={...progress.lessons,[id]:{...old,index:Math.min(index+1,total-1)}};
  return {progress:{...progress,lessons,lastActive:id},awarded:0,completedNow:false};
 }
 if(final&&!Array.from({length:index},(_,i)=>i).every(i=>old.doneSteps.includes(i)))return {progress,awarded:0,completedNow:false,blocked:true};
 const earned=award?(final?70:10):0;
 const completedNow=final&&!old.completedAt;
 const doneSteps=[...old.doneSteps,index];
 const lessons={...progress.lessons,[id]:{...old,doneSteps,index:Math.min(index+1,total-1),completedAt:completedNow?new Date().toISOString():old.completedAt}};
 const dayCompletions={...progress.dayCompletions};
 if(completedNow){const key=localDayKey();dayCompletions[key]=(dayCompletions[key]||0)+1;}
 return {progress:{...progress,xp:progress.xp+earned,lessons,dayCompletions,lastActive:id},awarded:earned,completedNow};
}
// Simple arithmetic grammar; no eval/Function, accepts a/b, parentheses, powers and decimal comma.
export function parseAnswer(text){
 const source=String(text).trim().replace(/,/g,'.').replace(/[×·]/g,'*').replace(/[÷]/g,'/');
 if(!source||source.length>120||!/^[0-9+\-*/^().\s]+$/.test(source))return NaN;
 const tokens=source.match(/\d+(?:\.\d+)?|\.\d+|[()+\-*/^]/g);
 if(!tokens||tokens.join('')!==source.replace(/\s/g,''))return NaN;
 let i=0;
 const atom=()=>{if(tokens[i]==='+'){i++;return atom()}if(tokens[i]==='-'){i++;return -atom()}if(tokens[i]==='('){i++;const x=add();if(tokens[i++]!==')')throw Error('paren');return x}let t=tokens[i++];if(!t||!/^\d*\.?\d+$/.test(t))throw Error('number');return +t;};
 const power=()=>{let n=atom();if(tokens[i]==='^'){i++;n=Math.pow(n,power());}return n;};
 const mul=()=>{let n=power();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++];const d=power();n=op==='*'?n*d:n/d;}return n;};
 const add=()=>{let n=mul();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++];const r=mul();n=op==='+'?n+r:n-r;}return n;};
 try{let val=add();return i===tokens.length&&Number.isFinite(val)?val:NaN}catch(_){return NaN}
}
export function checkResponse(step,input){if(step.kind==='choice')return Number(input)===step.answer;
 if(step.kind==='final'&&step.accepted){const normalize=x=>String(x).trim().toLowerCase().replace(/²/g,'^2').replace(/[·×*]/g,'').replace(/\s+/g,'');return step.accepted.some(expected=>normalize(input)===normalize(expected));}
 if(step.kind==='number'||step.kind==='final'){
 const value=parseAnswer(input);return Number.isFinite(value)&&Math.abs(value-step.answer)<=(step.tolerance??0.00001);
}
 if(step.kind==='text'||step.kind==='expression'){
  const normalize=x=>String(x).trim().toLowerCase().replace(/²/g,'^2').replace(/[·×*]/g,'').replace(/\s+/g,'');
  return (step.accepted||[]).some(expected=>normalize(input)===normalize(expected));
 }
 if(step.kind==='set'){
  const parts=String(input).trim().replace(/[{}\[\]]/g,'').replace(/\s+(?:и|and)\s+/gi,';').split(/[;,]/).map(parseAnswer);
  const expected=[...(step.answer||[])].sort((a,b)=>a-b),actual=parts.sort((a,b)=>a-b);
  return actual.length===expected.length&&actual.every((x,i)=>Number.isFinite(x)&&Math.abs(x-expected[i])<=(step.tolerance??0.00001));
 }
 if(step.kind==='proof')return step.groups.every(group=>{
  const selected=input?.[group.id];return Array.isArray(selected)&&selected.length===group.stepIds.length&&selected.every((id,i)=>id===group.stepIds[i]);
 });
 return false;}
