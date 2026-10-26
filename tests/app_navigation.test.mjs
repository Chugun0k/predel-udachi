import test from 'node:test';
import assert from 'node:assert/strict';

test('the primary transition button advances from theory to experiment',async()=>{
 const listeners={};
 const panel={innerHTML:'',style:{},getBoundingClientRect(){return {height:1200}}};
 const heading={setAttribute(){},focus(){},scrollIntoView(){}};
 const activeStep={focus(){}};
 const root={innerHTML:'',addEventListener(type,handler){listeners[type]=handler}};
 const classes=new Set();
 const classList={toggle(name,force){const enabled=force===undefined?!classes.has(name):force;enabled?classes.add(name):classes.delete(name);return enabled}};
 const storage=new Map();
 globalThis.requestAnimationFrame=callback=>{callback();return 1};
 globalThis.document={
  body:{classList,appendChild(){}},
  documentElement:{dataset:{},style:{}},
  querySelector(selector){
   if(selector==='#app')return root;
   if(selector==='#lessonPane')return panel;
   if(selector==='.stage-heading h3')return heading;
   if(selector==='.step-dot.now')return activeStep;
   return null;
  },
  querySelectorAll(){return []},
  getElementById(){return null},
  createElement(){return {setAttribute(){},remove(){}}}
 };
 globalThis.window={
  localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},
  location:{href:'http://example.test/?task=S01-Q01',search:'?task=S01-Q01',hash:''},
  history:{pushState(){},replaceState(){}},
  innerWidth:1440,
  scrollX:0,scrollY:420,scrollCalls:[],scrollTo(options){this.scrollCalls.push(options)},
  addEventListener(){},
  matchMedia(){return {matches:false,addEventListener(){}}}
 };

 await import(`../src/app.js?navigation-test=${Date.now()}`);
 assert.match(panel.innerHTML,/Что означает независимость/);
 listeners.click({target:{closest(selector){return selector==='[data-advance]'?{}:null}}});
 assert.match(panel.innerHTML,/Одна вероятность — две стороны/);
 listeners.click({target:{closest(selector){return selector==='[data-step-target]'?{dataset:{stepTarget:'0'}}:null}}});
 assert.match(panel.innerHTML,/Что означает независимость/);
 assert.match(panel.innerHTML,/data-step-target="1"/);
 assert.match(panel.innerHTML,/class="step-dot [^"]*resume[^"]*"[^>]*data-step-target="1"/);
 assert.doesNotMatch(panel.innerHTML,/data-step-return/);
 listeners.click({target:{closest(selector){return selector==='[data-step-target]'?{dataset:{stepTarget:'1'}}:null}}});
 assert.match(panel.innerHTML,/Одна вероятность — две стороны/);
 assert.deepEqual(window.scrollCalls.at(-1),{left:0,top:420,behavior:'auto'});
 listeners.click({target:{closest(selector){if(selector==='[data-art]'||selector==='[data-theme]')return document.documentElement;return selector==='[data-focus]'?{}:null}}});
 assert.equal(classes.has('focus-mode'),true);
 listeners.click({target:{closest(selector){return selector==='[data-task]'?{dataset:{task:'S01-Q03'}}:null}}});
 assert.match(panel.innerHTML,/S01-Q03/);
 listeners.click({target:{closest(selector){return selector==='button[data-palette-choice]'?{dataset:{paletteChoice:'nord'},closest(){return null}}:null}}});
 assert.equal(document.documentElement.dataset.palette,'nord');
 assert.match(storage.get('probquest-appearance-v1'),/"palette":"nord"/);
 listeners.click({target:{closest(selector){return selector==='button[data-theme-choice]'?{dataset:{themeChoice:'dark'},closest(){return null}}:null}}});
 assert.equal(document.documentElement.dataset.theme,'dark');
 listeners.click({target:{closest(selector){return selector==='button[data-art-choice]'?{dataset:{artChoice:'instrument'},closest(){return null}}:null}}});
 assert.equal(document.documentElement.dataset.art,'instrument');
 listeners.click({target:{closest(selector){return selector==='[data-map-toggle]'?{}:null}}});
 assert.equal(classes.has('map-open'),true);
});
