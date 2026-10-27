from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parent.parent
html=(R/'play.html').read_text()
with sync_playwright() as p:
 candidates=[Path('/usr/bin/chromium'),Path('/usr/bin/chromium-browser'),Path('/opt/vivaldi/vivaldi-bin')]
 executable=next((path for path in candidates if path.exists()),None)
 if executable is None:
  raise RuntimeError('Install Chromium or Vivaldi to run the browser smoke test')
 args=['--no-sandbox']
 if 'vivaldi' in str(executable):
  args.extend(['--disable-gpu','--disable-vivaldi','--disable-extensions'])
 browser=p.chromium.launch(headless=True,executable_path=str(executable),args=args)
 page=browser.new_page(viewport={'width':1470,'height':1050},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('about:blank')
 page.evaluate('''() => {let data={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data[k]||null,setItem:(k,v)=>{data[k]=v},removeItem:k=>{delete data[k]}}})}''')
 page.set_content(html,wait_until='domcontentloaded')
 print('START',page.locator('body').inner_text()[:140],errors)
 assert 'Предел удачи' in page.title()
 assert '/90' in page.locator('.progress-number').inner_text().replace(' ','')
 assert page.locator('.quest').count()==10
 assert page.locator('.theory-example').count()==3
 assert not page.locator('.map-launch').is_visible()
 page.locator('[data-focus]').click()
 assert 'focus-mode' in page.locator('body').get_attribute('class')
 assert page.locator('.map-launch').is_visible()
 page.locator('.map-launch').click()
 assert 'map-open' in page.locator('body').get_attribute('class')
 page.locator('.focus-map-close').click()
 page.locator('[data-focus]').click()
 page.locator('.settings > summary').click()
 assert page.locator('html').get_attribute('data-art')=='unified'
 assert page.locator('[data-art-choice]').count()==0
 page.locator('[data-palette-choice="nord"]').click()
 assert page.locator('html').get_attribute('data-palette')=='nord'
 page.locator('[data-theme-choice="dark"]').click()
 assert page.locator('html').get_attribute('data-theme')=='dark'
 page.locator('[data-theme-choice="light"]').click()
 page.screenshot(path=str(R/'docs/desktop_preview.png'),full_page=True)
 def answer(text):
  page.locator('#answerInput').fill(text)
  page.locator('[data-check]').click()
  assert 'Отлично' in page.locator('.feedback.success').inner_text(),page.locator('#lessonPane').inner_text()[-300:]
  page.locator('[data-advance]').click()
 page.locator('[data-advance]').click()
 page.locator('[data-predict="edges"]').click()
 slider=page.locator('[data-exp="selfP"]')
 slider.scroll_into_view_if_needed()
 slider.evaluate("el => el.dataset.dragIdentity='kept'")
 box=slider.bounding_box()
 page.mouse.move(box['x']+box['width']*.8,box['y']+box['height']/2)
 page.mouse.down()
 page.mouse.move(box['x']+box['width']*.2,box['y']+box['height']/2,steps=8)
 page.mouse.up()
 assert float(slider.input_value()) < .5
 assert slider.get_attribute('data-drag-identity')=='kept'
 slider.fill('0')
 page.locator('[data-advance]').click()
 answer('E');answer('p=p^2');answer('0;1')
 for group,ids in [('onlyIf',['n1','n2','n3','n4']),('if',['s1','s2','s3'])]:
  for card in ids:page.locator(f'[data-proof-add="{group}"][data-proof-card="{card}"]').click()
 page.locator('[data-check]').click()
 assert 'опорных шагов' in page.locator('.feedback.success').inner_text()
 page.locator('[data-advance]').click()
 assert 'ЗАДАНИЕ ОСВОЕНО' in page.locator('#lessonPane').inner_text()
 assert '1/90' in page.locator('.progress-number').inner_text().replace(' ','')
 xp_after_q1=page.locator('.level-stat strong').inner_text()
 page.locator('[data-step-back="5"]').click()
 assert page.locator('.proof-lane').count()==2
 page.locator('[data-step-back="0"]').click()
 assert 'Что означает независимость' in page.locator('#lessonPane').inner_text()
 assert page.locator('[data-step-return]').count()==1
 page.locator('[data-step-return]').click()
 assert 'ЗАДАНИЕ ОСВОЕНО' in page.locator('#lessonPane').inner_text()
 assert page.locator('.level-stat strong').inner_text()==xp_after_q1
 assert page.locator('.practice-card').count()==3
 page.locator('[data-practice-toggle="S01-Q01:0:hint"]').click()
 assert 'Сравни P(A∩B)' in page.locator('.practice-reveal.hint').inner_text()
 page.locator('[data-task="S01-Q03"]').click()
 page.locator('[data-advance]').click()
 page.locator('[data-urn-predict="middle"]').click()
 page.locator('[data-urn-draw]').click()
 page.locator('[data-advance]').click()
 answer('15');answer('96');answer('1365');answer('32/455')
 assert '2/90' in page.locator('.progress-number').inner_text().replace(' ','')
 page.locator('[data-task="S01-Q04"]').click()
 page.locator('[data-advance]').click()
 page.locator('[data-exp="birthN"]').fill('23')
 page.locator('[data-advance]').click()
 page.locator('[data-choice="1"]').click()
 page.locator('[data-check]').click()
 assert 'Отлично' in page.locator('.feedback').inner_text()
 page.locator('[data-advance]').click()
 answer('364/365');answer('364/365*363/365');answer('23')
 assert 'ЗАДАНИЕ ОСВОЕНО' in page.locator('#lessonPane').inner_text()
 assert '3/90' in page.locator('.progress-number').inner_text().replace(' ','')
 page.locator('[data-task="S01-Q07"]').click()
 page.locator('[data-advance]').click()
 page.locator('[data-exp="meetingX"]').fill('55')
 page.locator('[data-advance]').click()
 answer('50');answer('2500');answer('11/36')
 assert '4/90' in page.locator('.progress-number').inner_text().replace(' ','')
 page.locator('[data-chapter="2"]').click()
 assert page.locator('.quest').count()==13
 assert 'S02-Q01' in page.locator('#lessonPane').inner_text()
 page.locator('[data-advance]').click()
 page.locator('[data-concept-predict="right"]').click()
 page.locator('[data-exp="errorP"]').fill('0.2')
 page.locator('[data-advance]').click()
 answer('0.9');answer('0.9^10');answer('120*0.1^3*0.9^7');answer('0.9872')
 assert '5/90' in page.locator('.progress-number').inner_text().replace(' ','')
 page.locator('[data-chapter="3"]').click()
 assert page.locator('.quest').count()==9
 for task in [f'S03-Q{i:02d}' for i in range(1,10)]:
  page.locator(f'[data-task="{task}"]').click()
  page.locator('[data-advance]').click()
  page.locator('[data-concept-predict="structure"]').click()
  slider=page.locator('[data-exp]').last
  slider.evaluate("el => { el.value = el.max; el.dispatchEvent(new Event('input',{bubbles:true})) }")
  page.locator('[data-advance]').click()
  assert 'АТОМАРНЫЙ НАВЫК' in page.locator('#lessonPane').inner_text()
 page.locator('[data-chapter="4"]').click()
 assert page.locator('.quest').count()==11
 for task in [f'S04-Q{i:02d}' for i in range(1,11)]:
  page.locator(f'[data-task="{task}"]').click()
  page.locator('[data-advance]').click()
  page.locator('[data-concept-predict="structure"]').click()
  slider=page.locator('[data-exp]').last
  slider.evaluate("el => { el.value = el.max; el.dispatchEvent(new Event('input',{bubbles:true})) }")
  page.locator('[data-advance]').click()
  assert 'АТОМАРНЫЙ НАВЫК' in page.locator('#lessonPane').inner_text()
 page.locator('[data-task="S04-Q11"]').click()
 assert 'Не хватает определения' in page.locator('#lessonPane').inner_text()
 page.locator('[data-chapter="5"]').click()
 assert page.locator('.quest').count()==7
 for task in [f'S05-Q{i:02d}' for i in range(1,8)]:
  page.locator(f'[data-task="{task}"]').click()
  page.locator('[data-advance]').click()
  page.locator('[data-concept-predict="structure"]').click()
  slider=page.locator('[data-exp]').last
  slider.evaluate("el => { el.value = el.max; el.dispatchEvent(new Event('input',{bubbles:true})) }")
  page.locator('[data-advance]').click()
  assert 'АТОМАРНЫЙ НАВЫК' in page.locator('#lessonPane').inner_text()
 page.locator('[data-chapter="6"]').click()
 assert page.locator('.quest').count()==7
 for task in [f'S06-Q{i:02d}' for i in range(1,8)]:
  page.locator(f'[data-task="{task}"]').click()
  page.locator('[data-advance]').click()
  page.locator('[data-concept-predict="structure"]').click()
  slider=page.locator('[data-exp]').last
  slider.evaluate("el => { el.value = el.max; el.dispatchEvent(new Event('input',{bubbles:true})) }")
  page.locator('[data-advance]').click()
  assert 'АТОМАРНЫЙ НАВЫК' in page.locator('#lessonPane').inner_text()
 page.locator('[data-chapter="7"]').click()
 assert page.locator('.quest').count()==8
 for task in [f'S07-Q{i:02d}' for i in range(1,9)]:
  page.locator(f'[data-task="{task}"]').click()
  page.locator('[data-advance]').click()
  page.locator('[data-concept-predict="structure"]').click()
  slider=page.locator('[data-exp]').last
  slider.evaluate("el => { el.value = el.max; el.dispatchEvent(new Event('input',{bubbles:true})) }")
  page.locator('[data-advance]').click()
  assert 'АТОМАРНЫЙ НАВЫК' in page.locator('#lessonPane').inner_text()
 page.locator('[data-chapter="8"]').click()
 assert page.locator('.quest').count()==15
 for task in [f'S08-Q{i:02d}' for i in range(1,16)]:
  page.locator(f'[data-task="{task}"]').click()
  page.locator('[data-advance]').click()
  page.locator('[data-concept-predict="structure"]').click()
  slider=page.locator('[data-exp]').last
  slider.evaluate("el => { el.value = el.max; el.dispatchEvent(new Event('input',{bubbles:true})) }")
  page.locator('[data-advance]').click()
  assert 'АТОМАРНЫЙ НАВЫК' in page.locator('#lessonPane').inner_text()
 page.locator('[data-chapter="9"]').click()
 assert page.locator('.quest').count()==11
 for task in [f'S09-Q{i:02d}' for i in range(1,12)]:
  page.locator(f'[data-task="{task}"]').click()
  page.locator('[data-advance]').click()
  page.locator('[data-concept-predict="structure"]').click()
  slider=page.locator('[data-exp]').last
  slider.evaluate("el => { el.value = el.max; el.dispatchEvent(new Event('input',{bubbles:true})) }")
  page.locator('[data-advance]').click()
  assert 'АТОМАРНЫЙ НАВЫК' in page.locator('#lessonPane').inner_text()
 print('XP',page.locator('.level-stat').inner_text())
 page.screenshot(path=str(R/'docs/victory_preview.png'),full_page=True)
 progress=page.evaluate("window.localStorage.getItem('probquest-academy-v2')")
 assert 'S02-Q01' in progress
 assert not errors,errors
 print('DESKTOP SUCCESS, 5 full missions, zero JS errors')
 mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
 mobile.goto('about:blank')
 mobile.evaluate('''() => {let data={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data[k]||null,setItem:(k,v)=>{data[k]=v}}})}''')
 mobile.evaluate("""() => localStorage.setItem('probquest-academy-v2', JSON.stringify({version:2,xp:40,lastActive:'S09-Q11',dayCompletions:{},lessons:{'S09-Q11':{index:4,doneSteps:[0,1,2,3],attempts:0,hintsUsed:0,completedAt:null}}}))""")
 mobile.set_content(html)
 assert mobile.locator('.map-launch').is_visible()
 mobile.locator('.map-launch').click()
 assert 'map-open' in mobile.locator('body').get_attribute('class')
 mobile.locator('.focus-map-close').click()
 mobile.screenshot(path=str(R/'docs/mobile_preview.png'),full_page=True)
 over=mobile.evaluate('document.documentElement.scrollWidth - window.innerWidth')
 print('MOBILE HORIZONTAL OVERFLOW',over)
 assert over<4
 assert mobile.locator('.quest').count()==11
 assert mobile.locator('.proof-lane').count()==3
 browser.close()
