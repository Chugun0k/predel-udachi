#!/usr/bin/env python3
"""Package modules into one offline HTML, alongside the editable source project."""
from pathlib import Path
import base64, re
R=Path(__file__).resolve().parent.parent
css=(R/'src/styles.css').read_text()
def inline_local_font(match):
 font_name=match.group(1)
 encoded=base64.b64encode((R/'src'/'fonts'/font_name).read_bytes()).decode('ascii')
 return f'url(data:font/ttf;base64,{encoded})'
css=re.sub(r'url\(["\']?\./fonts/([^"\')]+\.ttf)["\']?\)',inline_local_font,css)
katex_root=R/'node_modules'/'katex'/'dist'
if not katex_root.exists():
 raise SystemExit('KaTeX is missing. Run npm install before building the standalone file.')
katex_css=(katex_root/'katex.min.css').read_text()
def inline_katex_font(match):
 font_name=match.group(1)
 encoded=base64.b64encode((katex_root/'fonts'/font_name).read_bytes()).decode('ascii')
 return f'src:url(data:font/woff2;base64,{encoded}) format("woff2")'
katex_css=re.sub(r'src:url\(fonts/([^)]*\.woff2)\)[^}]+',inline_katex_font,katex_css)
katex_js=(katex_root/'katex.min.js').read_text()
js=[]
for filename in ['catalog.js','lessons.js','engine.js','math.js','app.js']:
 text=(R/'src'/filename).read_text()
 text=re.sub(r'(?m)^import\s+.+?;\s*$', '', text)
 text=re.sub(r'(?m)^export (const|function)\b',r'\1',text)
 js.append('// --- '+filename+' ---\n'+text)
page=(R/'index.html').read_text()
page=page.replace('<link rel="stylesheet" href="./node_modules/katex/dist/katex.min.css">','<style>'+katex_css+'</style>')
page=page.replace('<link rel="stylesheet" href="./src/styles.css">','<style>'+css+'</style>')
page=page.replace('<script src="./node_modules/katex/dist/katex.min.js"></script>','<script>'+katex_js.replace('</script','<\\/script')+'</script>')
page=page.replace('<script type="module" src="./src/app.js"></script>','<script>\n'+'\n'.join(js).replace('</script','<\\/script')+'\n</script>')
(R/'play.html').write_text(page,encoding='utf8')
print('Wrote',R/'play.html',len(page),'characters')
