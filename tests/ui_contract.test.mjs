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

test('answer field focus changes only the compound control border color',()=>{
 assert.match(css,/\.answer-input-wrap:focus-within\{border-color:var\(--focus\)\}/);
 assert.doesNotMatch(css,/\.answer-input-wrap:focus-within\{[^}]*outline/);
 assert.match(css,/\.answer-input-wrap input:focus-visible\{outline:none\}/);
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

test('proof finals use written self-review instead of card-order guessing',()=>{
 assert.doesNotMatch(app,/data-proof-add|data-proof-remove/);
 assert.match(app,/data-proof-draft/);
 assert.match(app,/data-proof-review/);
 assert.match(app,/data-proof-criterion/);
 assert.match(app,/data-surrender/);
 assert.match(app,/data-retry/);
 assert.match(app,/Этот просмотр не засчитывает шаг и не приносит XP/);
});

test('wide learning regions expose themed scrollbars and keyboard access',()=>{
 assert.match(app,/class="math-plate horizontal-scroll-region" tabindex="0" role="region"/);
 assert.match(app,/class="source-table-scroll" tabindex="0" role="region"/);
 assert.match(app,/continuity-layers horizontal-scroll-region" tabindex="0"/);
 assert.match(app,/c3-axis horizontal-scroll-region" tabindex="0"/);
 assert.match(css,/--scrollbar-track:/);
 assert.match(css,/--scrollbar-thumb-hover:/);
 assert.match(css,/--scrollbar-thumb-active:/);
 assert.match(css,/scrollbar-color:var\(--scrollbar-thumb\) var\(--scrollbar-track\)/);
 assert.match(css,/scrollbar-width:thin/);
 assert.match(css,/::-webkit-scrollbar\{height:10px;background:transparent\}/);
 assert.match(css,/::-webkit-scrollbar-thumb\{min-width:48px/);
 assert.match(css,/border-radius:999px!important/);
 assert.match(css,/:hover::-webkit-scrollbar-thumb\{background-color:var\(--scrollbar-thumb-hover\)\}/);
 assert.match(css,/::-webkit-scrollbar-thumb:active\{background-color:var\(--scrollbar-thumb-active\)\}/);
});

test('activity surfaces are mapped to semantic theme tokens',()=>{
 for(const token of ['--viz-primary-soft','--viz-warning-soft','--viz-success-soft','--viz-error-soft'])assert.match(css,new RegExp(token));
 assert.match(css,/\.dice-lab>div,[\s\S]*?background:var\(--surface-raised\)/);
 assert.match(css,/\.atom-circle\.a\{background:var\(--viz-primary-soft\)\}/);
 assert.match(css,/\.source-data-table\{color:var\(--text\)\}/);
 assert.match(css,/\.proof-workbook textarea\{[\s\S]*?background:var\(--surface-raised\)/);
});

test('lab range controls have a complete theme-aware interaction treatment',()=>{
 assert.match(css,/input\[type="range"\]\{-webkit-appearance:none;appearance:none/);
 assert.match(css,/input\[type="range"\]::-webkit-slider-runnable-track\{height:6px;background:var\(--surface-muted\)/);
 assert.match(css,/input\[type="range"\]::-webkit-slider-thumb\{[\s\S]*?width:22px;height:22px[\s\S]*?background:var\(--primary\)/);
 assert.match(css,/input\[type="range"\]:focus-visible::-webkit-slider-thumb\{[\s\S]*?var\(--focus\)/);
 assert.match(css,/input\[type="range"\]::-moz-range-progress\{height:6px;background:var\(--primary\)/);
 assert.match(css,/input\[type="range"\]:focus-visible::-moz-range-thumb\{[\s\S]*?var\(--focus\)/);
 assert.doesNotMatch(css,/input\[type="range"\]::-webkit-slider-thumb\{border-radius:0/);
 assert.doesNotMatch(css,/input\[type="range"\]::-moz-range-thumb\{border-radius:0/);
});

test('bundled Cyrillic font assets exist for offline standalone builds',()=>{
 for(const file of ['NotoSans-Regular.ttf','NotoSans-Bold.ttf','NotoSerif-Regular.ttf','NotoSerif-Bold.ttf']){
  assert.equal(existsSync(new URL(`../src/fonts/${file}`,import.meta.url)),true,file);
 }
 assert.match(css,/Noto Local/);
 assert.match(readFileSync(new URL('../scripts/build_standalone.py',import.meta.url),'utf8'),/inline_local_font/);
});
