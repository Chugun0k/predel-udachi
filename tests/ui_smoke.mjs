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

async function openAt(width,height,theme,task='S01-Q01'){
 const page=await browser.newPage({viewport:{width,height}});
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.goto(`${appUrl}${querySeparator}task=${task}&theme=${theme}`,{waitUntil:'domcontentloaded'});
 await page.locator('#lessonPane').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth),0,`${width}px overflow`);
 assert.equal(await page.locator('[data-art-choice]').count(),0,'legacy A/B controls');
 assert.equal(await page.locator('html').getAttribute('data-art'),'unified');
 assert.equal(await page.locator('.lesson-pane').evaluate(el=>getComputedStyle(el).borderRadius),'0px');
 assert.notEqual(await page.locator('.math-plate').evaluate(el=>getComputedStyle(el).scrollbarColor),'auto',`${width}px themed formula scrollbar`);
 assert.deepEqual(await page.locator('.math-plate').evaluate(el=>({width:getComputedStyle(el,'::-webkit-scrollbar').height,track:getComputedStyle(el,'::-webkit-scrollbar-track').backgroundColor,radius:getComputedStyle(el,'::-webkit-scrollbar-thumb').borderRadius})),{width:'10px',track:'rgba(0, 0, 0, 0)',radius:'999px'},`${width}px polished scrollbar geometry`);
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
 assert.notEqual(await page.locator('.experiment-card').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(248, 246, 239)','experiment kept its light-only surface');
 assert.notEqual(await page.locator('.sim-metrics>div').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)','metric kept its light-only surface');
 assert.notEqual(await page.locator('.sim-svg [stroke="#4258d4"]').evaluate(el=>getComputedStyle(el).stroke),'rgb(66, 88, 212)','SVG kept its light-only stroke');
 await page.locator('[data-predict="edges"]').click();
 const slider=page.locator('[data-exp="selfP"]');
 const rangeGeometry=await slider.evaluate(el=>({height:getComputedStyle(el).height,appearance:getComputedStyle(el).appearance}));
 assert.deepEqual(rangeGeometry,{height:'44px',appearance:'none'},'range control fell back to browser-default input styling');
 await slider.focus();
 await page.locator('.control-row').last().screenshot({path:join(output,'range-control-dark.png')});
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
 const xpBeforeSurrender=await page.locator('.level-stat strong').textContent();
 await page.locator('[data-surrender]').click();
 assert.equal(await answerInput.inputValue(),'E','surrender does not reveal the expected answer');
 assert.equal(await answerInput.getAttribute('readonly'),'','revealed answer remains editable');
 assert.match(await page.locator('.feedback.surrendered').textContent(),/не засчитывает шаг/);
 assert.equal(await page.locator('.level-stat strong').textContent(),xpBeforeSurrender,'surrender awarded XP');
 assert.equal(await page.locator('#toast').count(),0,'stale XP toast conflicts with surrender feedback');
 await page.screenshot({path:join(output,'surrender-dark.png')});
 await page.locator('[data-retry]').click();
 assert.equal(await page.locator('#answerInput').inputValue(),'','retry did not clear the revealed answer');
 assert.equal(await page.locator('#answerInput').getAttribute('readonly'),null,'retry kept the field readonly');
 await page.close();

 const lightRangePage=await openAt(390,844,'light');
 await lightRangePage.locator('[data-advance]').click();
 const lightRange=lightRangePage.locator('[data-exp="selfP"]');
 await lightRange.focus();
 const lightRangeBox=await lightRange.boundingBox();
 assert.ok(lightRangeBox&&lightRangeBox.width<=358&&lightRangeBox.height===44,'light-theme phone range is clipped');
 await lightRangePage.locator('.control-row').last().screenshot({path:join(output,'range-control-phone-light.png')});
 await lightRangePage.close();

 const proofPage=await openAt(1440,960,'dark','S03-Q02');
 await proofPage.evaluate(()=>localStorage.setItem('probquest-academy-v2',JSON.stringify({
  version:2,xp:40,lastActive:'S03-Q02',dayCompletions:{},
  lessons:{'S03-Q02':{index:4,doneSteps:[0,1,2,3],attempts:0,hintsUsed:0,completedAt:null}}
 })));
 await proofPage.reload({waitUntil:'domcontentloaded'});
 await proofPage.locator('[data-proof-draft]').first().waitFor();
 assert.equal(await proofPage.locator('.proof-workbook-section').count(),2);
 assert.equal(await proofPage.locator('[data-proof-add]').count(),0,'legacy ordering UI returned');
 assert.notEqual(await proofPage.locator('[data-proof-draft]').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)','proof draft kept a light-only surface');
 for(const draft of await proofPage.locator('[data-proof-draft]').all())await draft.fill('Записываю исходную опору, логический переход и вывод своими словами.');
 await proofPage.locator('[data-proof-review]').click();
 assert.equal(await proofPage.locator('[data-proof-criterion]').count(),6);
 for(const criterion of await proofPage.locator('[data-proof-criterion]').all())await criterion.click();
 await proofPage.locator('[data-check]').click();
 assert.match(await proofPage.locator('.feedback.success').textContent(),/Самопроверка завершена/);
 await proofPage.screenshot({path:join(output,'proof-workbook-dark.png'),fullPage:true});
 await proofPage.setViewportSize({width:390,height:844});
 assert.equal(await proofPage.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth),0,'proof worksheet phone overflow');
 await proofPage.screenshot({path:join(output,'proof-workbook-phone-dark.png'),fullPage:true});
 await proofPage.close();

 const tablePage=await openAt(1440,960,'dark','S05-Q01');
 await tablePage.locator('.source-context summary').click();
 const sourceScroll=tablePage.locator('.source-table-scroll');
 await sourceScroll.waitFor();
 assert.notEqual(await sourceScroll.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)','source table kept its light-only surface');
 assert.notEqual(await sourceScroll.evaluate(el=>getComputedStyle(el).scrollbarColor),'auto','source table lost its themed scrollbar');
 assert.deepEqual(await tablePage.locator('.source-data-table td').first().evaluate(el=>[getComputedStyle(el).borderRightStyle,getComputedStyle(el).borderBottomStyle]),['solid','solid'],'source table cell grid disappeared');
 await tablePage.screenshot({path:join(output,'source-table-dark.png'),fullPage:true});
 await tablePage.setViewportSize({width:390,height:844});
 await sourceScroll.scrollIntoViewIfNeeded();
 await sourceScroll.hover();
 assert.ok(await sourceScroll.evaluate(el=>el.scrollWidth>el.clientWidth),'mobile source table does not exercise horizontal scrolling');
 await sourceScroll.screenshot({path:join(output,'scrollbar-phone-dark.png')});
 await tablePage.close();

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
