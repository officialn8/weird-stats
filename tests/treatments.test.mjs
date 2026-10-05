import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {validate,renderEntry,csv,createPageContext} from '../scripts/content.mjs';
import {getTreatment} from '../src/treatments/registry.mjs';
import {pairedFixture} from './fixtures/paired.mjs';

test('paired comparison keeps both honest measures inside the optional native reveal',async()=>{
 const entry=pairedFixture();validate(entry);
 const html=await renderEntry(entry,null,new Date('2020-06-01'),createPageContext());
 const start=html.indexOf('<details class="discovery-reveal">'),end=html.indexOf('<div class="discovery-evidence">');
 const before=html.slice(0,start),reveal=html.slice(start,end);
 assert(!before.includes('160'));assert(!before.includes('12</strong>'));assert(!before.includes('The smaller orchard.'));
 assert(!reveal.startsWith('<details class="discovery-reveal" open'));
 assert(reveal.includes('Show me'));assert(reveal.includes('Fruit harvested'));assert(reveal.includes('Baskets available'));
 assert(reveal.includes('160'));assert(reveal.includes('120'));assert(reveal.includes('3</strong>'));assert(reveal.includes('12</strong>'));
 assert.equal((reveal.match(/class="paired-object"/g)||[]).length,15);
 assert(reveal.includes('0–200 fruit'));assert(reveal.includes('One tile is one basket.'));
 assert(!reveal.includes('data-view='));assert(!reveal.includes('California'));assert(!reveal.includes('Senate'));
 assert(reveal.includes('/data/fictional-orchards.csv'));assert(csv(entry).includes('Baskets available'));
 assert.equal(getTreatment('paired-comparison').answerAfterGraphic,true);
 assert.deepEqual(getTreatment('paired-comparison').scripts,['treatments/paired-comparison.js']);
});
test('paired comparison rejects mismatched labels, unit objects, scales and excessive object counts',()=>{
 const alter=fn=>{const e=pairedFixture();fn(e.treatment);return e;};
 for(const e of [alter(t=>t.views[1].values[0].label='Other orchard'),alter(t=>t.views[1].values[0].value=1.5),alter(t=>t.views[0].baseline=10),alter(t=>t.views[1].max=101),alter(t=>t.views[1].object='unknown'),alter(t=>t.views.pop())])assert.throws(()=>validate(e));
 const escaped=pairedFixture();escaped.treatment.transition='<img src=x>';return renderEntry(escaped,null).then(html=>assert(html.includes('&lt;img src=x&gt;')));
});
test('paired comparison animation waits for its visual, suspends, preserves completion and explicitly replays',async()=>{
 class Element extends EventTarget {
  constructor(){super();this.nodes={};this.hidden=true;}
  querySelector(key){return this.nodes[key]??null;}
  querySelectorAll(key){return this.nodes[key]??[];}
  animate(){const a={plays:0,pauses:0,cancels:0,play(){this.plays++;},pause(){this.pauses++;},cancel(){this.cancels++;}};animations.push(a);return a;}
 }
 const animations=[],observers=[];
 const visual=new Element(),entry=new Element(),button=new Element(),field=new Element();
 visual.nodes['.paired-ribbon']=[new Element(),new Element()];
 visual.nodes['.paired-object-field']=[field];field.nodes['.paired-object']=[new Element(),new Element(),new Element()];
 entry.nodes={'.paired-visual':visual,'.paired-replay':button};
 const document=new EventTarget();document.hidden=false;document.body={classList:{contains:()=>false}};document.querySelectorAll=selector=>selector==='[data-treatment="paired-comparison"]'?[entry]:[];
 const media=new EventTarget();media.matches=false;
 const window=new EventTarget();
 const sandbox={window,document,Event,AbortController,matchMedia:()=>media,IntersectionObserver:class{constructor(callback,options){this.callback=callback;this.options=options;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}}};
 runInNewContext(await readFile(new URL('../public/discoveries.js',import.meta.url),'utf8'),sandbox);
 runInNewContext(await readFile(new URL('../public/treatments/paired-comparison.js',import.meta.url),'utf8'),sandbox);
 assert.equal(animations.length,0,'page load does not consume the reveal');
 const near=observers.find(o=>o.options.rootMargin),visible=observers.find(o=>o.options.threshold);
 near.callback([{isIntersecting:true}]);assert.equal(animations.length,5);assert(animations.every(a=>a.plays===0&&a.pauses===1));
 visible.callback([{isIntersecting:true,intersectionRatio:.1}]);assert(animations.every(a=>a.plays===0));
 visible.callback([{isIntersecting:true,intersectionRatio:.5}]);assert(animations.every(a=>a.plays===1));
 document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));assert(animations.every(a=>a.pauses===2));
 document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));assert(animations.every(a=>a.plays===2));
 visible.callback([{isIntersecting:false,intersectionRatio:0}]);assert(animations.every(a=>a.pauses===3));
 button.dispatchEvent(new Event('click'));assert.equal(animations.length,5,'offscreen replay cannot consume the animation');
 visible.callback([{isIntersecting:true,intersectionRatio:.5}]);assert(animations.every(a=>a.plays===3));
 animations.forEach(a=>a.onfinish());visible.callback([{isIntersecting:false,intersectionRatio:0}]);visible.callback([{isIntersecting:true,intersectionRatio:.5}]);
 assert(animations.every(a=>a.plays===3),'returning does not reset a completed discovery');
 button.dispatchEvent(new Event('click'));assert.equal(animations.length,10,'reader can explicitly replay');assert(animations.slice(5).every(a=>a.plays===1));
 media.matches=true;media.dispatchEvent(new Event('change'));assert(animations.every(a=>a.cancels>0),'reduced motion leaves the complete CSS state');
 const cleanup=window.WeirdPairedComparison.initialize(entry);cleanup();assert(observers.every(o=>o.disconnected));
});
test('comparison leads the answer only for treatments that request it',async()=>{
 const paired=await renderEntry(pairedFixture(),null);
 assert(paired.indexOf('class="paired-comparison"')<paired.indexOf('class="discovery-answer"'));
 const {reviewFixture}=await import('./fixtures/entries.mjs');
 const ordinary=await renderEntry(reviewFixture(),null);
 assert(ordinary.indexOf('class="discovery-answer"')<ordinary.indexOf('class="discovery-chart"'));
});
