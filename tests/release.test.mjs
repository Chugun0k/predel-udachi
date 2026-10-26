import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {catalog,excluded} from '../src/catalog.js';

const packageJson=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const workflow=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
const builder=readFileSync(new URL('../scripts/build_pages.py',import.meta.url),'utf8');

test('GitHub Pages release is reproducible and gated by tests',()=>{
 assert.equal(packageJson.scripts.pages,'npm run standalone && python3 scripts/build_pages.py');
 assert.match(workflow,/run: npm test/);
 assert.match(workflow,/run: npm run pages/);
 assert.match(workflow,/actions\/upload-pages-artifact@v4/);
 assert.match(workflow,/actions\/deploy-pages@v4/);
 assert.match(workflow,/pages: write/);
 assert.match(workflow,/id-token: write/);
});

test('Pages artifact contains only the anonymous standalone app',()=>{
 assert.match(builder,/OUTPUT \/ "index\.html"/);
 assert.match(builder,/OUTPUT \/ "\.nojekyll"/);
 assert.doesNotMatch(builder,/glob\(|copytree\(|target="_blank"/i);
});

test('public task records contain full statements without source metadata',()=>{
 const allowed=new Set(['id','seminar','number','title','topic','statement','starred','implemented','contentStatus','exclusionReason','externalDependency','sourceTable']);
 for(const task of [...catalog,...excluded]){
  assert.ok(task.statement.length>30,task.id);
  assert.ok(Object.keys(task).every(key=>allowed.has(key)),task.id);
  assert.equal('page' in task,false,task.id);
 }
});
