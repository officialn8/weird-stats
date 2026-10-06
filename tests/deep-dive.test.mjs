import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validate,contentDigest,renderEntry,createPageContext} from '../scripts/content.mjs';
import {packetDiff} from '../scripts/review-packets.mjs';
import {build} from '../scripts/build.mjs';
import {reviewFixture,publishedFixture} from './fixtures/entries.mjs';

test('custom Deep Dives render a compact collection and a complete standalone discovery',async()=>{
 const entry={...reviewFixture(),id:'crunch',format:'deep-dive',treatment:{kind:'custom',template:'crunch'}};
 const fragment='<section id="crunch"><h2>Fixture essay</h2><p>Shared opening</p><!-- page:collection --><a href="{{discoveryHref}}">Read the Deep Dive</a><!-- /page:collection --><!-- page:discovery --><script src="assets/full-essay.js"></script><nav><a href="#fixture-chapter">Chapter</a></nav><div id="fixture-chapter">Full essay</div><a href="{{nextHref}}">Keep wandering</a><!-- /page:discovery --></section>';
 for(const mode of ['collection','discovery']) {
  const html=await renderEntry(entry,null,'2026-10-06',createPageContext({mode,fragment,privateReview:true}));
  assert.match(html,/Shared opening/);
  assert.equal(html.includes('Read the Deep Dive'),mode==='collection');
  assert.equal(html.includes('Full essay'),mode==='discovery');
  assert.equal(html.includes('assets\/full-essay.js'),mode==='discovery');
  assert.equal(html.includes('href="#fixture-chapter"'),mode==='discovery');
  assert.doesNotMatch(html,/<!-- \/?page:|\{\{/);
  assert.match(html,/href="\/discoveries\/crunch\/"/);
 }
 const escaped=await renderEntry(entry,null,'2026-10-06',createPageContext({fragment,discoveryHref:()=>'/fixture/?a=1&b="2"'}));
 assert.match(escaped,/href="\/fixture\/\?a=1&amp;b=&quot;2&quot;"/);
 const ordinary=await renderEntry({...entry,format:undefined},null,'2026-10-06',createPageContext({fragment:'<section>Unchanged custom discovery</section>'}));
 assert.match(ordinary,/<section>Unchanged custom discovery<\/section>/);
 await assert.rejects(()=>renderEntry(entry,null,'2026-10-06',createPageContext({fragment:'<!-- page:discovery -->Missing end'})),/page blocks must be paired/);
});

test('editorial format is validated, bound to approval, and visible in review differences',()=>{
 const baseline=reviewFixture(), deep={...baseline,format:'deep-dive'};
 assert.equal(validate(deep).format,'deep-dive');
 assert.notEqual(contentDigest(baseline),contentDigest(deep));
 assert.throws(()=>validate({...baseline,format:'unsupported'}),/editorial format/);
 assert(packetDiff({entry:baseline},{entry:deep}).claim.some(change=>change.field==='format'));
});

test('a private Deep Dive appears in review feed and stays out of public output',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'weird-deep-dive-'));
 t.after(()=>rm(directory,{recursive:true,force:true}));
 const records=[publishedFixture(),{...reviewFixture(),format:'deep-dive'}];
 for(const drafts of [false,true]) {
  const output=pathToFileURL(join(directory,drafts?'review/':'public/'));
  const result=await build({records,drafts,output});
  const feed=JSON.parse(await readFile(new URL('feed.json',output),'utf8'));
  assert.equal(feed.entries.some(entry=>entry.format==='deep-dive'),drafts);
  assert.equal(result.pages.has('fixture-comparison'),drafts);
  assert(feed.entries.some(entry=>entry.format==='discovery'));
 }
});

test('vehicle-energy scenarios preserve SI units and physical scaling',async()=>{
 const {kineticScenario}=await import('../public/assets/transport-physics.js');
 const ordinary=kineticScenario(2000,30),twiceMass=kineticScenario(4000,30),twiceSpeed=kineticScenario(2000,60);
 assert(Math.abs(ordinary.speedMps-13.4112)<1e-10);
 assert(Math.abs(ordinary.energyJ-179860.28544)<1e-6);
 assert.equal(twiceMass.energyJ,ordinary.energyJ*2);
 assert.equal(twiceMass.heightM,ordinary.heightM);
 assert.equal(twiceSpeed.energyJ,ordinary.energyJ*4);
 assert.equal(twiceSpeed.heightM,ordinary.heightM*4);
 assert.equal(twiceSpeed.dropSeconds,ordinary.dropSeconds*2);
 for(const mass of [1000,2000,3500])for(const speed of [10,20,40,60]) {
  const result=kineticScenario(mass,speed);
  assert(Math.abs(mass*9.81*result.heightM-result.energyJ)<1e-6);
  assert(Math.abs(.5*9.81*result.dropSeconds**2-result.heightM)<1e-10);
  assert(result.heightM<40&&result.energyJ<1400000,'scenario fits the fixed graphic scales');
 }
 assert.equal(kineticScenario(2000,0).energyJ,0);
 assert.throws(()=>kineticScenario(-1,30),RangeError);
});

test('American-unit vehicle scenarios convert weight and preserve energy equivalence',async()=>{
 const {kineticUSScenario}=await import('../public/assets/transport-physics.js');
 const result=kineticUSScenario(4000,30);
 assert(Math.abs(result.energyFtLb-120345.4390643084)<1e-6);
 assert(Math.abs(result.heightFt-30.07608562691131)<1e-10);
 assert.equal(kineticUSScenario(8000,30).energyFtLb,result.energyFtLb*2);
 assert.equal(kineticUSScenario(4000,60).heightFt,result.heightFt*4);
 assert(kineticUSScenario(8000,60).energyFtLb<1000000);
 assert(kineticUSScenario(8000,60).heightFt<140);
});
