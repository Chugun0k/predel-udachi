const htmlEscape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

function fractionize(source){
 let tex=source;
 const rules=[
  [/\[([^\[\]\n]+)\]\/\(([^()\n]+)\)/g,'\\frac{$1}{$2}'],
  [/\(([^()\n]+)\)\^(\{[^{}]+\}|[A-Za-zА-Яа-я0-9]+)\/([A-Za-zА-Яа-яΑ-ω0-9]+!)/g,'\\frac{($1)^$2}{$3}'],
  [/\(([^()\n]+)\)\/\(([^()\n]+)\)/g,'\\frac{$1}{$2}'],
  [/([A-Za-zА-Яа-яΑ-ω0-9]+(?:\^\{[^{}]+\}|\^[A-Za-zА-Яа-яΑ-ω0-9]+)?!?)\/\(([^()\n]+)\)/g,'\\frac{$1}{$2}'],
  [/([A-Za-zА-Яа-яΑ-ω0-9]+(?:\^\{[^{}]+\}|\^[A-Za-zА-Яа-яΑ-ω0-9]+)?!?)\/([A-Za-zА-Яа-яΑ-ω0-9]+(?:\^\{[^{}]+\}|\^[A-Za-zА-Яа-яΑ-ω0-9]+)?!)/g,'\\frac{$1}{$2}'],
  [/([A-Za-zА-Яа-яΑ-ω0-9]+(?:\^\{[^{}]+\}|\^[A-Za-zА-Яа-яΑ-ω0-9]+)?!?)\/([A-Za-zА-Яа-яΑ-ω0-9]+)(?![_^])/g,'\\frac{$1}{$2}']
 ];
 for(const [pattern,replacement] of rules)tex=tex.replace(pattern,replacement);
 return tex;
}

function matrixize(source){
 return source.replace(/\[\[([^\[\]]+)\](?:,\[([^\[\]]+)\])(?:,\[([^\[\]]+)\])?\]/g,(_,a,b,c)=>{
  const rows=[a,b,c].filter(Boolean).map(row=>row.split(',').join('&')).join('\\\\');
  return `\\begin{bmatrix}${rows}\\end{bmatrix}`;
 });
}

function alignRelation(line){
 let depth=0;
 for(let i=0;i<line.length;i++){
  const char=line[i];
  if('([{'.includes(char))depth++;
  else if(')]}'.includes(char))depth=Math.max(0,depth-1);
  else if(depth===0&&'=⇔⇏⇒→≤≥≠'.includes(char))return `${line.slice(0,i)}&${line.slice(i)}`;
 }
 return line;
}
function alignLines(source){
 const lines=source.split(/\n+/).map(line=>line.trim()).filter(Boolean);
 if(lines.length<2)return lines[0]||'';
 const aligned=lines.map(alignRelation);
 return `\\begin{aligned}${aligned.join('\\\\[0.7em]')}\\end{aligned}`;
}

function textualizeCyrillic(source){
 const protectedText=[];
 let tex=source.replace(/\\text\{[^{}]*\}/g,match=>{
  const token=`@@MATH_TEXT_${protectedText.length}@@`;
  protectedText.push(match);
  return token;
 });
 tex=tex.replace(/[А-Яа-яЁё]+(?:[ \t]+[А-Яа-яЁё]+)*/g,(phrase,offset,whole)=>{
  const left=offset>0&&/[ \t]/.test(whole[offset-1])?'\\ ':'';
  const end=offset+phrase.length;
  const right=end<whole.length&&/[ \t]/.test(whole[end])?'\\ ':'';
  return `${left}\\text{${phrase}}${right}`;
 });
 return tex.replace(/@@MATH_TEXT_(\d+)@@/g,(_,index)=>protectedText[Number(index)]);
}

export function normalizeMathSource(value){
 let source=String(value??'').trim().replace(/^\$\$?|\$\$?$/g,'').trim();
 source=source
  .replace(/\u000crac/g,'\\frac')
  .replace(/\u0009ext/g,'\\text')
  .replace(/\\?qquad\b/g,'\\qquad ')
  .replace(/(?<!q)\\?quad\b/g,'\\quad ')
  .replace(/(?:\\?sqrt|\bsqrt)\{([^{}]+)\}/g,'\\sqrt{$1}')
  .replace(/√\{([^{}]+)\}/g,'\\sqrt{$1}')
  .replace(/√\(([^()]+)\)/g,'\\sqrt{$1}')
  .replace(/√([A-Za-zΑ-ω0-9]+)/g,'\\sqrt{$1}')
  .replace(/Σ/g,'\\sum ')
  .replace(/∑/g,'\\sum ')
  .replace(/∏/g,'\\prod ')
  .replace(/∞/g,'\\infty ')
  .replace(/(?:\\?Rightarrow|\bRightarrow\b)/g,'\\Rightarrow ')
  .replace(/(?:\\?mapsto|\bmapsto\b)/g,'\\mapsto ')
  .replace(/(?:\\?perp|\bperp\b)/g,'\\perp ')
  .replace(/\bmid\b/g,'\\mid ')
  .replace(/\bCov\b/g,'\\operatorname{Cov}')
  .replace(/\bVar\b/g,'\\operatorname{Var}')
  .replace(/\bBin\b/g,'\\operatorname{Bin}')
  .replace(/\bGeo\b/g,'\\operatorname{Geo}')
  .replace(/\bBern\b/g,'\\operatorname{Bern}')
  .replace(/\bPoi\b/g,'\\operatorname{Poi}')
  .replace(/\barcsin\b/g,'\\arcsin')
  .replace(/\bsin\b/g,'\\sin')
  .replace(/\bcos\b/g,'\\cos')
  .replace(/\bmax\b/g,'\\max')
  .replace(/\bmin\b/g,'\\min')
  .replace(/\bdet\b/g,'\\det')
  .replace(/\biid\b/g,'\\mathrm{iid}')
  .replace(/\bcontinuous\b/g,'\\text{continuous}')
  .replace(/\bnormal\b/g,'\\text{normal}')
  .replace(/\bGaussian\b/g,'\\text{Gaussian}')
  .replace(/(^|[=\s])или(?=$|[=\s])/g,'$1\\text{или}')
  .replace(/#/g,'\\#')
  .replace(/·/g,'\\cdot ')
  .replace(/\^(?:\(([^()]+)\))/g,'^{$1}');
 source=textualizeCyrillic(source);
 source=fractionize(source);
 source=matrixize(source);
 return alignLines(source);
}

function renderExpression(expression,displayMode){
 const tex=normalizeMathSource(expression);
 const renderer=globalThis.katex;
 if(!renderer?.renderToString)return `<span class="math-fallback">${htmlEscape(tex)}</span>`;
 try{return renderer.renderToString(tex,{displayMode,throwOnError:false,strict:'ignore',trust:false,output:'htmlAndMathml'});}
 catch(error){return `<span class="math-error" title="Формула не распознана">${htmlEscape(tex)}</span>`;}
}

export function renderMathMarkdown(value,{display=true}={}){
 let source=String(value??'').trim();
 if(!source.includes('$'))source=display?`$$${source}$$`:`$${source}$`;
 return source.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g).filter(Boolean).map(part=>{
  if(part.startsWith('$$'))return `<div class="math-display">${renderExpression(part.slice(2,-2),true)}</div>`;
  if(part.startsWith('$'))return `<span class="math-inline">${renderExpression(part.slice(1,-1),false)}</span>`;
  return htmlEscape(part).replaceAll('\n','<br>');
 }).join('');
}
