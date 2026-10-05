import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {validate,renderEntry} from '../scripts/content.mjs';
import {build} from '../scripts/build.mjs';
import {publishedFixture} from './fixtures/entries.mjs';
function runway(){return {id:'fixture-runway',title:'A fictional airfield',topic:'navigation',status:'review',order:50,question:'Why change the number?',answer:'The reference changed.',explanation:'Fictional example only.',qualification:'Not measured airport data.',whyCare:'Labels describe a direction.',evidence:{kind:'reported',scope:'Test airfield',dataAsOf:'Test period',checkedAt:'2020-01-01',reviewDue:'2021-01-01',sources:[{label:'Test source',url:'https://example.org/airfield',primary:true}]},treatment:{kind:'bearing-shift',from:184,to:186,trueBearing:180,duration:4000,exampleLabel:'Illustrative headings. Not airport measurements.'}};}
test('runway reveal preserves anticipation and no-script explanation with escaped content',async()=>{
 const entry=runway(); validate(entry);const html=await renderEntry(entry,null);
 const split=html.indexOf('<details class="discovery-reveal ');assert(split>0);
 assert(!html.slice(0,split).includes(entry.answer));
 assert(html.slice(split).includes(entry.answer));assert(!html.includes('runway-reveal" open'));
 assert(html.includes('184°'));assert(html.includes('186°'));assert(html.includes('18 → 19'));
 assert(html.includes('type="range"'));assert(html.includes('hidden'));
 entry.question='<img src=x onerror=alert(1)>';assert((await renderEntry(entry,null)).includes('&lt;img'));
});
test('bearing treatment rejects impossible headings and unbounded motion parameters',()=>{
 for(const changes of [{from:NaN},{to:361},{from:-1},{to:184},{trueBearing:Infinity},{duration:900000},{from:181,to:183}])assert.throws(()=>validate({...runway(),treatment:{...runway().treatment,...changes}}));
});
test('unpublished runway assets and copy stay out of the public build',async()=>{
 const dir=await mkdtemp(tmpdir()+'/weird-runway-');const output=pathToFileURL(dir+'/');
 try{const records=[publishedFixture(),runway()];const live=await build({records,output});assert(!live.html.includes('fixture-runway'));assert(!live.assets.includes('treatments/runway.js'));
 const preview=await build({records,drafts:true,output});assert(preview.html.includes('fixture-runway'));assert(preview.assets.includes('treatments/runway.js'));assert((await readFile(new URL('discoveries/fixture-runway/index.html',output),'utf8')).includes('noindex'));}finally{await rm(dir,{recursive:true,force:true});}
});

test('runway motion waits for reveal and visibility; scrub, reduced motion, replay and cleanup work',async()=>{
 const {runInNewContext}=await import('node:vm');
 class Element extends EventTarget{constructor(){super();this.nodes={};this.dataset={};this.attributes={};this.style={setProperty(){}};this.hidden=true;this.textContent='';}querySelector(s){return this.nodes[s];}querySelectorAll(){return [];}setAttribute(k,v){this.attributes[k]=v;}}
 const entry=new Element(),visual=new Element(),reveal=new Element(),range=new Element(),replay=new Element();reveal.open=false;
 entry.dataset={from:'184',to:'186',trueBearing:'180',duration:'4000'};
 entry.nodes={'.runway-visual':visual,'.discovery-reveal':reveal,'input[type="range"]':range,'.runway-replay':replay};
 for(const s of ['.runway-magnetic','.runway-heading-value','.runway-painted-number','.runway-sign-number','.runway-sign-change','.runway-announcement','.runway-controls'])entry.nodes[s]=new Element();
 const media=new EventTarget();media.matches=false;
 let siteReduced=false,observer,disconnected=false,next=0;const frames=new Map();
 const document=new EventTarget();document.hidden=false;document.body={classList:{contains:()=>siteReduced}};document.querySelectorAll=()=>[entry];
 const window=new EventTarget();window.WeirdDiscoveries={observeVisual:(node,callbacks)=>{observer=callbacks;return ()=>{disconnected=true;};}};
 const sandbox={document,window,Event,AbortController,matchMedia:()=>media,requestAnimationFrame:cb=>{frames.set(++next,cb);return next;},cancelAnimationFrame:id=>frames.delete(id)};
 runInNewContext(await readFile(new URL('../public/treatments/runway.js',import.meta.url),'utf8'),sandbox);
 const advance=now=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(cb=>cb(now));};
 assert.equal(frames.size,0);observer.play();assert.equal(frames.size,0,'viewport alone never reveals');
 reveal.open=true;reveal.dispatchEvent(new Event('toggle'));assert.equal(frames.size,1);
 advance(0);advance(1000);assert.equal(range.value,'25');
 observer.pause();assert.equal(frames.size,0,'offscreen pauses');observer.play();advance(10000);assert.equal(range.value,'25','resume excludes time offscreen');advance(11000);assert.equal(entry.nodes['.runway-sign-number'].textContent,'19');
 range.value='10';range.dispatchEvent(new Event('input'));assert.equal(frames.size,0);assert.equal(entry.nodes['.runway-sign-number'].textContent,'18');observer.pause();observer.play();assert.equal(frames.size,0,'manual scrubbing takes over');
 replay.dispatchEvent(new Event('click'));assert.equal(range.value,'0');advance(12000);advance(16000);assert.equal(range.value,'100');assert.equal(frames.size,0);
 replay.dispatchEvent(new Event('click'));siteReduced=true;document.dispatchEvent(new Event('motionchange'));assert.equal(frames.size,0);assert.equal(range.value,'100');assert.equal(replay.disabled,true);
 range.value='0';range.dispatchEvent(new Event('input'));assert.equal(entry.nodes['.runway-sign-number'].textContent,'18','motion off still allows direct manipulation');
 media.matches=true;media.dispatchEvent(new Event('change'));siteReduced=false;document.dispatchEvent(new Event('motionchange'));assert.equal(replay.disabled,true);
 media.matches=false;media.dispatchEvent(new Event('change'));assert.equal(replay.disabled,false);
 const cleanup=window.WeirdRunway.initialize(entry);cleanup();assert(disconnected);assert.equal(frames.size,0);replay.dispatchEvent(new Event('click'));assert.equal(frames.size,0);
});

test('OS motion can be re-enabled without requiring another viewport event',async()=>{
 const {runInNewContext}=await import('node:vm');
class El extends EventTarget {
 constructor(){super();this.nodes={};this.dataset={};this.style={setProperty(){}};}
 querySelector(s){return this.nodes[s];}
 querySelectorAll(){return [];}
 setAttribute(){}
}
const entry=new El(),visual=new El(),reveal=new El(),slider=new El(),button=new El();
reveal.open=false;
entry.dataset={from:'184',to:'186',trueBearing:'180',duration:'4000'};
entry.nodes={'.runway-visual':visual,'.discovery-reveal':reveal,'input[type="range"]':slider,'.runway-replay':button};
for(const n of ['magnetic','heading-value','painted-number','sign-number','sign-change','announcement','controls'])entry.nodes['.runway-'+n]=new El();
const media=new EventTarget();media.matches=true;
const document=new EventTarget();document.hidden=false;document.body={classList:{contains:()=>false}};document.querySelectorAll=()=>[entry];
const window=new EventTarget(),observers=[];
class IO{constructor(cb){this.cb=cb;observers.push(this);}observe(){}disconnect(){}}
const frames=new Map();let next=0;
const sandbox={document,window,AbortController,Event,CustomEvent,IntersectionObserver:IO,matchMedia:()=>media,requestAnimationFrame:cb=>{frames.set(++next,cb);return next;},cancelAnimationFrame:id=>frames.delete(id)};
const root=new URL('../',import.meta.url);
runInNewContext(await readFile(new URL('public/discoveries.js',root),'utf8'),sandbox);
runInNewContext(await readFile(new URL('public/treatments/runway.js',root),'utf8'),sandbox);
observers[1].cb([{isIntersecting:true,intersectionRatio:1}]);
media.matches=false;media.dispatchEvent(new Event('change'));
reveal.open=true;reveal.dispatchEvent(new Event('toggle'));
button.dispatchEvent(new Event('click'));
assert.equal(button.disabled,false);
assert.equal(frames.size,1,'Enabling OS motion then revealing/replaying should schedule animation');
 window.WeirdRunway.initialize(entry)();
});
