import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {lessons} from '../src/lessons.js';
import {normalizeMathSource,renderMathMarkdown} from '../src/math.js';

test('every authored theory and example formula is valid KaTeX',()=>{
 for(const [id,lesson] of Object.entries(lessons))for(const [index,step] of lesson.steps.entries()){
  const formulas=[step.formula,...(step.examples||[]).map(example=>example.formula)].filter(Boolean);
  for(const formula of formulas)assert.doesNotThrow(()=>katex.renderToString(normalizeMathSource(formula),{throwOnError:true,strict:'ignore'}),`${id} step ${index}: ${formula}`);
 }
});

test('legacy slash notation becomes stacked fractions and matrices remain structured',()=>{
 assert.match(normalizeMathSource('E[ξ|η] = [Np(1-r) + (1-p)η]/(1-pr)'),/\\frac\{Np\(1-r\) \+ \(1-p\)η\}\{1-pr\}/);
 assert.match(normalizeMathSource('(λp)^k/k!'),/\\frac\{\(λp\)\^k\}\{k!\}/);
 assert.match(normalizeMathSource('K=[[1,1/2],[1/2,1]]'),/\\begin\{bmatrix\}1&\\frac\{1\}\{2\}&?1?/);
 assert.doesNotMatch(normalizeMathSource('a,qquad b'),/\\q\\quad/);
});

test('markdown delimiters render accessible KaTeX markup',()=>{
 globalThis.katex=katex;
 const html=renderMathMarkdown('$$\\frac{a+b}{c}$$');
 assert.match(html,/class="math-display"/);
 assert.match(html,/class="katex-mathml"/);
 assert.match(html,/mfrac/);
 delete globalThis.katex;
});

test('Cyrillic phrases keep word spacing inside mathematical notation',()=>{
 const probability=normalizeMathSource('$$P(хотя бы одно совпадение) = 1 − P(все даты различны)$$');
 assert.match(probability,/P\(\\text\{хотя бы одно совпадение\}\)/);
 assert.match(probability,/P\(\\text\{все даты различны\}\)/);
 const sentence=normalizeMathSource('A и B независимы ⇔ P(A∩B)=P(A)P(B)');
 assert.ok(sentence.includes('A \\ \\text{и}\\  B'));
 assert.ok(sentence.includes('B \\ \\text{независимы}\\  ⇔'));
 const alreadyTypeset=normalizeMathSource('σ(ξ)={\\text{объединения множеств }{ξ=x}}');
 assert.doesNotMatch(alreadyTypeset,/\\text\{\\text/);
 globalThis.katex=katex;
 const html=renderMathMarkdown('$$P(хотя бы одно совпадение)$$');
 assert.match(html,/хотя бы одно совпадение/);
 delete globalThis.katex;
});
