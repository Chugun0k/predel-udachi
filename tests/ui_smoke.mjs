import assert from 'node:assert/strict';
import {access, mkdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';

const candidates=[
 process.env.BROWSER_EXECUTABLE,
 '/usr/bin/chromium',
 '/usr/bin/chromium-browser',
 '/opt/vivaldi/vivaldi-bin'
].filter(Boolean);
let executablePath;
for(const candidate of candidates){
 try{await access(candidate,constants.X_OK);executablePath=candidate;break}catch{}
}
if(!executablePath)throw new Error('Set BROWSER_EXECUTABLE to a Chromium-compatible browser');

const browser=await chromium.launch({
 headless:true,
 executablePath,
 args:executablePath.includes('vivaldi')?['--no-sandbox','--disable-gpu','--disable-vivaldi','--disable-extensions']:['--no-sandbox']
});
const output=join(tmpdir(),'predel-udachi-ui-smoke');
await mkdir(output,{recursive:true});
const appUrl=process.env.UI_SMOKE_URL||pathToFileURL(join(process.cwd(),'play.html')).href;
const querySeparator=appUrl.includes('?')?'&':'?';

async function openAt(width,height,theme){
 const page=await browser.newPage({viewport:{width,height}});
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.goto(`${appUrl}${querySeparator}task=S01-Q01&theme=${theme}`,{waitUntil:'domcontentloaded'});
 await page.locator('#lessonPane').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth),0,`${width}px overflow`);
 assert.equal(await page.locator('[data-art-choice]').count(),0,'legacy A/B controls');
 assert.equal(await page.locator('html').getAttribute('data-art'),'unified');
 assert.equal(await page.locator('.lesson-pane').evaluate(el=>getComputedStyle(el).borderRadius),'0px');
 assert.deepEqual(errors,[]);
 return page;
}

try{
 for(const width of [390,768,1440]){
  for(const theme of ['light','dark']){
   const height=width===390?844:width===768?1024:960;
   const page=await openAt(width,height,theme);
   const mapButton=page.locator('.map-launch');
   assert.equal(await mapButton.isVisible(),width<1024,`${width}px map button visibility`);
   assert.equal(await page.locator('[data-focus]').isVisible(),width>599,`${width}px focus button visibility`);
   assert.equal(await page.locator('[data-map-toggle]').evaluateAll(elements=>elements.filter(element=>element.checkVisibility()).length),width<1024?1:0,`${width}px duplicate map controls`);
   if(width<1024){
    await mapButton.click();
    assert.match(await page.locator('body').getAttribute('class')||'',/map-open/);
    await page.locator('.focus-map-close').click();
   }
   if(width===1440){
    await page.locator('[data-focus]').click();
    assert.equal(await mapButton.isVisible(),true,'focus map button visibility');
    await mapButton.click();
    assert.match(await page.locator('body').getAttribute('class')||'',/map-open/);
    await page.locator('.focus-map-close').click();
    await page.locator('[data-focus]').click();
   }
   await page.screenshot({path:join(output,`${width}-${theme}.png`)});
   await page.close();
  }
 }

 const page=await openAt(1440,960,'dark');
 await page.locator('[data-advance]').click();
 await page.locator('[data-predict="edges"]').click();
 const slider=page.locator('[data-exp="selfP"]');
 await slider.scrollIntoViewIfNeeded();
 await slider.evaluate(el=>window.__draggedRange=el);
 const label=page.locator('label[for="selfRange"]');
 const labelBefore=await label.textContent();
 const box=await slider.boundingBox();
 assert.ok(box);
 await page.mouse.move(box.x+box.width*.8,box.y+box.height/2);
 await page.mouse.down();
 await page.mouse.move(box.x+box.width*.2,box.y+box.height/2,{steps:8});
 assert.equal(await slider.evaluate(el=>el===window.__draggedRange),true,'range node was replaced while dragging');
 assert.ok(Number(await slider.inputValue())<.5,'range value did not follow pointer drag');
 assert.notEqual(await label.textContent(),labelBefore,'activity output did not update while dragging');
 await page.mouse.up();
 assert.ok(Number(await page.locator('[data-exp="selfP"]').inputValue())<.5,'range value was not committed');
 await page.locator('#advanceExperiment').click();
 const answerInput=page.locator('#answerInput');
 const answerWrap=page.locator('.answer-input-wrap');
 const borderBefore=await answerWrap.evaluate(el=>({color:getComputedStyle(el).borderColor,width:getComputedStyle(el).borderWidth}));
 await answerInput.focus();
 assert.equal(await answerInput.evaluate(el=>getComputedStyle(el).outlineStyle),'none','inner answer input has a second focus ring');
 const borderAfter=await answerWrap.evaluate(el=>({color:getComputedStyle(el).borderColor,width:getComputedStyle(el).borderWidth,outline:getComputedStyle(el).outlineStyle}));
 assert.equal(borderAfter.outline,'none','compound answer control has an extra focus outline');
 assert.equal(borderAfter.width,borderBefore.width,'answer border thickness changes on focus');
 assert.notEqual(borderAfter.color,borderBefore.color,'answer border color does not change on focus');
 assert.equal(await answerWrap.evaluate(el=>new Set([getComputedStyle(el).borderTopWidth,getComputedStyle(el).borderRightWidth,getComputedStyle(el).borderBottomWidth,getComputedStyle(el).borderLeftWidth]).size),1,'answer control border is uneven');
 await page.screenshot({path:join(output,'answer-input-dark.png')});
 await page.close();

 const phone=await openAt(390,844,'dark');
 await phone.locator('[data-advance]').click();
 await phone.locator('[data-predict="edges"]').click();
 await phone.locator('[data-exp="selfP"]').fill('0');
 await phone.locator('#advanceExperiment').click();
 const phoneInput=phone.locator('#answerInput');
 await phoneInput.focus();
 const phoneWrap=phone.locator('.answer-input-wrap');
 const phoneBox=await phoneWrap.boundingBox();
 assert.ok(phoneBox&&phoneBox.x>=0&&phoneBox.x+phoneBox.width<=390,'phone answer control is clipped');
 assert.equal(await phoneInput.evaluate(el=>getComputedStyle(el).outlineStyle),'none');
 await phone.screenshot({path:join(output,'answer-input-phone-dark.png')});
 await phone.close();
 console.log(`UI smoke passed; screenshots: ${output}`);
}finally{
 await browser.close();
}
