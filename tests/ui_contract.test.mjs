import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('the unified art direction, palettes and light modes are applied and saved',()=>{
 assert.doesNotMatch(app,/data-art-choice=/);
 assert.match(app,/dataset\.art='unified'/);
 for(const palette of ['original','nord','sonokai','biscuit','mountain']){
  assert.match(app,new RegExp(`\\['${palette}'`));
  if(palette!=='original'){
   assert.match(css,new RegExp(`data-palette="${palette}"\\]\\[data-theme="light"`));
   assert.match(css,new RegExp(`data-palette="${palette}"\\]\\[data-theme="dark"`));
  }
 }
 for(const theme of ['system','light','dark'])assert.match(app,new RegExp(`\\['${theme}'`));
 assert.match(app,/probquest-appearance-v1/);
 assert.match(index,/prefers-color-scheme: dark/);
 assert.match(index,/data-art="unified"/);
 assert.match(index,/data-palette="original"/);
 assert.match(css,/html\[data-art="unified"\]\[data-theme="dark"\]/);
 assert.match(css,/html\[data-art="unified"\]\[data-theme="light"\]\{--canvas:#f4efe4/);
 assert.match(css,/html\[data-art="unified"\]\[data-theme="dark"\]\{--canvas:#1d211f/);
});

test('appearance controls cannot collide with root html data attributes',()=>{
 assert.doesNotMatch(app,/closest\('\[data-art\]'\)/);
 assert.doesNotMatch(app,/closest\('\[data-theme\]'\)/);
 assert.doesNotMatch(app,/closest\('button\[data-art-choice\]'\)/);
 assert.match(app,/closest\('button\[data-theme-choice\]'\)/);
 assert.match(app,/closest\('button\[data-palette-choice\]'\)/);
 assert.doesNotMatch(app,/documentElement\.dataset\.themeChoice/);
});

test('range controls keep their node while dragging and refresh on commit',()=>{
 assert.match(app,/addEventListener\('input',e=>\{updateExperimentControl\(e\.currentTarget\);liveRefreshExperiment\(mode\)\}\)/);
 assert.match(app,/addEventListener\('change',e=>\{updateExperimentControl\(e\.currentTarget\);refreshExperiment\(mode\)\}\)/);
 assert.match(app,/function syncExperimentNode/);
 assert.match(app,/const keepRange=current\.matches\('\[data-exp\]'\)/);
 assert.match(css,/\*,\*::before,\*::after\{border-radius:0!important\}/);
 assert.match(css,/\.sim-metrics \.equal\{background:var\(--success-bg\)/);
});

test('phone layout removes the redundant focus control',()=>{
 assert.match(app,/class="focus-toggle" data-focus="1"/);
 assert.match(css,/@media\(max-width:599px\)[\s\S]*?\.lesson-tools\{display:none\}/);
});

test('course map has one responsive launcher outside the drawer',()=>{
 assert.doesNotMatch(app,/class="map-toggle"/);
 assert.match(css,/html\[data-art="unified"\] \.map-launch,html\[data-art="unified"\] \.map-close\{display:none\}/);
 assert.match(css,/body\.focus-mode \.map-launch,body\.focus-mode\.map-open \.map-close\{display:inline-flex\}/);
});

test('added palette text and controls meet WCAG AA contrast',()=>{
 const luminance=hex=>{
  const [r,g,b]=hex.slice(1).match(/../g).map(value=>parseInt(value,16)/255).map(value=>value<=.03928?value/12.92:((value+.055)/1.055)**2.4);
  return .2126*r+.7152*g+.0722*b;
 };
 const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 for(const palette of ['nord','sonokai','biscuit','mountain'])for(const mode of ['light','dark']){
  const selector=`html[data-palette="${palette}"][data-theme="${mode}"]`;
  const body=css.match(new RegExp(`${selector.replaceAll('[','\\[').replaceAll(']','\\]')}\\{([^}]*)\\}`))?.[1];
  assert.ok(body,selector);
  const tokens=Object.fromEntries([...body.matchAll(/--([\w-]+):(#[0-9a-f]{6})/gi)].map(match=>[match[1],match[2]]));
  for(const [foreground,background] of [['text','surface'],['text-muted','surface'],['primary','surface'],['on-primary','primary'],['text','success-bg'],['text','error-bg']]){
   assert.ok(contrast(tokens[foreground],tokens[background])>=4.5,`${selector} ${foreground}/${background}`);
  }
 }
});

test('lesson-first shell keeps accessibility and motion requirements',()=>{
 assert.doesNotMatch(app,/<section class="hero">/);
 assert.doesNotMatch(app,/Прозрачный реестр/);
 assert.match(app,/class="skip-link"/);
 assert.match(app,/<h1 tabindex="-1">/);
 assert.match(app,/aria-current="step"/);
 assert.match(app,/role="\$\{warning==='correct'\?'status':'alert'\}"/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/min-width:44px;min-height:44px/);
 assert.match(app,/function focusCurrentStage\(\)/);
 assert.doesNotMatch(app,/target="_blank"|rel="noopener"/i);
});

test('mathematics and focus mode use theme tokens',()=>{
 assert.match(css,/--math-text:/);
 assert.match(css,/\.math-inline\{color:inherit\}/);
 assert.match(css,/\.focus-mode\{background:var\(--canvas\)\}/);
 assert.doesNotMatch(app,/data-step-return/);
 assert.match(app,/data-step-target/);
 assert.match(css,/\.quest-scroll\{max-height:none;overflow:visible\}/);
 assert.match(css,/\.step-dot\.resume\{/);
 assert.match(css,/\.step-dot\.now\.cleared\{/);
});

test('bundled Cyrillic font assets exist for offline standalone builds',()=>{
 for(const file of ['NotoSans-Regular.ttf','NotoSans-Bold.ttf','NotoSerif-Regular.ttf','NotoSerif-Bold.ttf']){
  assert.equal(existsSync(new URL(`../src/fonts/${file}`,import.meta.url)),true,file);
 }
 assert.match(css,/Noto Local/);
 assert.match(readFileSync(new URL('../scripts/build_standalone.py',import.meta.url),'utf8'),/inline_local_font/);
});
