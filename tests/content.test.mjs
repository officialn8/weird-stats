import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validate, selectEntries, renderEntry, reviewState, linePoints, csv, createPageContext, esc } from '../scripts/content.mjs';
import { build } from '../scripts/build.mjs';
import { shareCopy } from '../scripts/share-copy.mjs';
import { reviewFixture, publishedFixture } from './fixtures/entries.mjs';
const now=new Date('2020-06-01T00:00:00Z');
test('normal edition excludes review, retired, and future scheduled entries',()=>{
 const published=publishedFixture(), draft=reviewFixture();
 const future={...published,id:'future',publishedAt:'2030-01-01T00:00:00Z'};
 assert.deepEqual(selectEntries([published,draft,future],{now}).map(e=>e.id),[published.id]);
 assert(selectEntries([published,draft],{now,drafts:true}).some(e=>e.id===draft.id));
 assert(!selectEntries([{...draft,status:'retired'}],{now,drafts:true}).length);
});
test('publishing requires an explicit approval record',()=>{
 const e=reviewFixture();e.status='published';e.publishedAt='2020-01-01T12:00:00Z';assert.throws(()=>validate(e),/approval/);
});
test('review entries require primary evidence and chart integrity',()=>{
 let e=reviewFixture();e.evidence.sources=[];assert.throws(()=>validate(e),/primary source/);
 e=reviewFixture();e.treatment.views[0].baseline=5;assert.throws(()=>validate(e),/zero baseline/);
 e=reviewFixture();e.treatment.views[0].values[0].value=NaN;assert.throws(()=>validate(e),/outside/);
 e=reviewFixture();e.treatment.views[0].max=10;assert.throws(()=>validate(e),/outside/);
 e=reviewFixture();delete e.evidence.denominator;assert.throws(()=>validate(e),/denominator/);
});
test('line chart preserves irregular time spacing and rejects out-of-order points',()=>{
 assert.equal(linePoints([{x:2000,value:0},{x:2001,value:50},{x:2010,value:100}],100),'40,210 90,120 540,30');
 const e=reviewFixture();e.treatment.kind='line';e.treatment.views=[{...e.treatment.views[0],values:[{label:'2000',x:2000,value:10},{label:'1990',x:1990,value:20}]}];assert.throws(()=>validate(e),/must increase/);
});
test('source text is escaped and non-HTTPS sources are rejected',async()=>{
 const e=reviewFixture();e.question='<script>alert(1)</script>';const html=await renderEntry(e,null,now);assert(!html.includes('<script>alert'));assert(html.includes('&lt;script&gt;'));
 e.evidence.sources[0].url='javascript:alert(1)';assert.throws(()=>validate(e),/HTTPS/);
});
test('stale sources are flagged, not silently refreshed',()=>{
 assert.equal(reviewState(reviewFixture(),new Date('2022-01-01')),'Review due');assert.equal(reviewState(reviewFixture(),now),'Checked');
});
test('data export includes both measures and guards spreadsheet formulas',()=>{
 const data=csv(reviewFixture());assert(data.includes('"Sample count","Test North","100","items"'));assert(data.includes('"Groups","Test South","10","groups"'));
 for(const prefix of ['=','+','-','@']) {const e=reviewFixture();e.treatment.views[0].values[0].label=prefix+'1+1';assert(csv(e).includes("'"+prefix+'1+1'));}
});
test('bar and line graphics, controls, and data stay inside a closed reveal',async()=>{
 for(const kind of ['bar','line']) {
   const e=reviewFixture();e.treatment.kind=kind;
   e.treatment.views.forEach(v=>v.values.forEach((d,i)=>d.x=2000+i));
   const html=await renderEntry(e,null,now);
   const disclosure=html.indexOf('<details class="discovery-reveal">');
   assert(disclosure>=0,'reveal must start closed');
   // Track nested disclosures: the table has its own details element.
   let depth=0,end;
   for(const match of html.slice(disclosure).matchAll(/<details\b[^>]*>|<\/details>/g)) {
     depth+=match[0].startsWith('</')?-1:1;
     if(depth===0){end=disclosure+match.index;break;}
   }
   assert(end>disclosure);
   for(const marker of ['class="discovery-chart"','class="data-controls"','class="data-view"','<table>','Download the data (CSV)']) {
     const index=html.indexOf(marker);assert(index>disclosure&&index<end,`${kind}: ${marker} leaked outside reveal`);
   }
   assert(!html.slice(0,disclosure).includes('Test North'));
 }
});
test('isolated builds exclude draft HTML, data and metadata; rejecting or removing drafts is safe',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'weird-stats-test-'));
 t.after(()=>rm(directory,{recursive:true,force:true}));
 const output=name=>pathToFileURL(join(directory,name)+sep);
 const published=publishedFixture(),draft=reviewFixture(),records=[published,draft];
 const prod=await build({now,records,output:output('published')});
 assert(!prod.html.includes(draft.id));assert(!prod.html.includes('Draft for review'));
 assert.equal((prod.html.match(/<h1\b/g)||[]).length,1);
 assert(!(await readdir(new URL('data/',prod.output))).includes(draft.id+'.csv'));
 assert(!(await readFile(new URL('feed.json',prod.output),'utf8')).includes(draft.id));
 assert(!(await readdir(prod.output)).includes('content'));
 const review=await build({now,records,drafts:true,output:output('review')});
 assert(review.html.includes(draft.id));assert(review.html.includes('noindex,nofollow'));
 assert((await readFile(new URL('data/'+draft.id+'.csv',review.output),'utf8')).includes('Test South'));
 for(const remaining of [[published,{...draft,status:'retired'}],[published]]) {
   const result=await build({now,records:remaining,drafts:true,output:output('rejected')});
   assert(!result.html.includes(draft.id));assert.deepEqual(result.entries.map(e=>e.id),[published.id]);
 }
});
test('the collection head names no discovery, and only the private review build is noindex',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'weird-collection-head-'));
 t.after(()=>rm(directory,{recursive:true,force:true}));
 const published={...publishedFixture(),answer:'The published answer stays in the page body.'};
 const draft={...reviewFixture(),question:'Which private draft sample is larger?',answer:'The private draft answer.'},records=[published,draft];
 for(const drafts of [false,true]) {
   const result=await build({now,records,drafts,output:pathToFileURL(join(directory,drafts?'review':'published')+sep)});
   const head=result.html.split('</head>')[0],body=result.html.slice(head.length),label=drafts?'review':'public';
   assert(body.includes(published.question)&&body.includes(published.answer));assert.equal(body.includes(draft.question),drafts);
   for(const entry of records)for(const text of new Set([entry.id,entry.title,entry.question,shareCopy(entry).question,entry.answer].filter(Boolean)))
     assert(!head.includes(text)&&!head.includes(esc(text)),`${label} collection head leaks ${text}`);
   assert.equal((head.match(/name="robots"/g)||[]).length,drafts?1:0,`${label} robots tags`);
   if(drafts)assert(head.includes('<meta name="robots" content="noindex,nofollow">'));
   assert(head.includes('property="og:image"'),`${label} collection head has a link preview`);
 }
});
test('bespoke links resolve to the actual next entry when reordered',async()=>{
 const e={...publishedFixture(),id:'crunch',treatment:{kind:'custom',template:'crunch'}};
 const html=await renderEntry(e,reviewFixture(),now);assert(html.includes('href="#fixture-comparison"'));assert(!html.includes('href="#copper"'));
});

test('political evidence rules apply to plain reveals and custom scenes',()=>{
 for(const treatment of [{kind:'reveal'},{kind:'custom',template:'copper'}]) {
  const entry={...reviewFixture(),id:treatment.template??'fictional-reveal',treatment};
  delete entry.evidence.denominator;
  assert.throws(()=>validate(entry),/denominator/);
  entry.evidence.denominator='Fixture denominator';delete entry.evidence.methodology;
  assert.throws(()=>validate(entry),/methodology/);
 }
});
test('existing custom scene copy and reveal contracts survive context adapters',async()=>{
 const expected={crunch:['id="crunch-title"','id="crunch-answer" hidden','id="crunch-reveal"'],copper:['id="copper-title"','class="copper-answer"','id="penny-pile"'],mail:['id="mail-title"','journey-score','replay-journey'],painting:['id="painting-title"','scale-panel','scale-journey']};
 for(const [id,markers] of Object.entries(expected)) {
  const html=await renderEntry({...publishedFixture(),id,treatment:{kind:'custom',template:id}},null,now);
  for(const marker of markers)assert(html.includes(marker),`${id}: ${marker}`);
  const fragment='<section><h2>Fictional question?</h2><p>A fictional answer.</p></section>';
  const fixture=await renderEntry({...publishedFixture(),id,treatment:{kind:'custom',template:id}},null,now,{...createPageContext(),fragment});
  assert(fixture.includes(fragment),'The adapter must preserve the selected revision copy');
 }
});
test('owned assets exclude private media and scene preloads from unrelated pages',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'weird-owned-test-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const draft={...reviewFixture(),assets:[{path:'assets/mule.webp'}]};
 const result=await build({now,records:[publishedFixture(),draft],output:pathToFileURL(dir+sep)});
 const assets=await readdir(new URL('assets/',result.output));
 assert(!assets.includes('mule.webp'));assert(!assets.includes('chip-a.mp3'));assert(!assets.includes('chip.webp'));
 assert(!result.html.includes('assets/chip'));assert(assets.includes('outfit.ttf'));
 const missing={...publishedFixture(),assets:[{path:'assets/does-not-exist.webp'}]};
 await assert.rejects(build({now,records:[missing],output:result.output}),/Missing asset.*does-not-exist/);
 assert.equal(await readFile(new URL('index.html',result.output),'utf8'),result.html,'invalid inputs must not destroy prior output');
});
test('generic guesses are optional and instance IDs/context URLs are independent',async()=>{
 const {createPageContext}=await import('../scripts/content.mjs');
 const first=reviewFixture();first.guess={choices:[{id:'north',label:'North',feedback:'You chose north.'},{id:'south',label:'South',feedback:'You chose south.'}]};
 const second={...first,id:'fixture-other'};
 const context=createPageContext({mode:'discovery'});
 const html=(await renderEntry(first,second,now,context))+(await renderEntry(second,null,now,context));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 assert(html.includes('href="/data/fixture-comparison.csv"'));assert(html.includes('href="/discoveries/fixture-comparison/"'));
 assert.equal((html.match(/data-guess="north"/g)||[]).length,2);
 assert.equal((html.match(/Show me/g)||[]).length,2);
 const disclosure=html.indexOf('<details class="discovery-reveal">');assert(html.indexOf('You chose north.')>disclosure,'choice feedback cannot spoil the pre-reveal state');
});
test('release pins keep approved baselines and distinguish withdrawals from never-public retirements',async()=>{
 const {contentDigest,selectRelease}=await import('../scripts/content.mjs');
 const entry=publishedFixture();const digest=contentDigest(entry);entry.approval.digest=digest;
 const manifest={version:1,releasedAt:'2020-01-01T00:00:00Z',authorizedBy:'Fixture release',entries:[{id:entry.id,digest}],withdrawals:[]};
 const revision={id:entry.id,digest,entry,release:{at:'2020-01-01T00:00:00Z',authorizedBy:'Fixture release'}};
 const replacement={...entry,status:'retired',answer:'Rejected replacement'};
 assert.deepEqual(selectRelease([replacement],{manifest,revisions:[revision],now}).entries.map(e=>e.answer),[entry.answer]);
 const withdrawal={id:entry.id,reason:'This discovery was withdrawn.',at:'2020-06-01',authorizedBy:'Fixture release'};
 const result=selectRelease([replacement,{...replacement,id:'never-public'}],{manifest:{...manifest,entries:[],withdrawals:[withdrawal]},revisions:[revision],now});
 assert.equal(result.entries.length,0);assert.deepEqual(result.withdrawals,[withdrawal]);
 assert.throws(()=>selectRelease([],{manifest,revisions:[{...revision,entry:{...entry,answer:'Unapproved change'}}],now}),/digest|revision/);
 const approvedNext={...entry,id:'new-approved'};assert.equal(selectRelease([approvedNext],{manifest,revisions:[revision],now}).entries.length,1,'approval alone does not advance a release');
});

test('release build preserves its pinned payload, omits review media, and renders safe withdrawal notices',async t=>{
 const {contentDigest}=await import('../scripts/content.mjs');
 const directory=await mkdtemp(join(tmpdir(),'weird-release-test-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const entry=publishedFixture(),digest=contentDigest(entry);entry.approval.digest=digest;
 const revision={id:entry.id,digest,entry,release:{at:'2020-01-01T00:00:00Z',authorizedBy:'Fixture release'}};
 const manifest={version:1,releasedAt:'2020-01-01T00:00:00Z',authorizedBy:'Fixture release',entries:[{id:entry.id,digest}],withdrawals:[]};
 const output=pathToFileURL(directory+sep);
 const result=await build({now,output,records:[{...entry,status:'retired',answer:'Private replacement'}, {...reviewFixture(),assets:[{path:'assets/mule.webp'}]}],manifest,revisions:[revision]});
 assert(result.html.includes(entry.answer));assert(!result.html.includes('Private replacement'));
 assert(!(await readdir(new URL('assets/',output))).includes('mule.webp'));
 const withdrawn=await build({now,output,records:[],manifest:{...manifest,entries:[],withdrawals:[{id:entry.id,reason:'Withdrawn <safely>',at:'2020-01-02',authorizedBy:'Fixture editor'}]},revisions:[revision]});
 assert(withdrawn.html.includes('Withdrawn &lt;safely&gt;'));assert(!withdrawn.html.includes(entry.answer));assert.deepEqual(await readdir(new URL('data/',output)),[]);
});
test('custom media and script dependencies belong to their selected scene',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'weird-scene-test-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 for(const id of ['crunch','copper']) {
  const entry={...publishedFixture(),id,treatment:{kind:'custom',template:id}};
  const result=await build({now,records:[entry],output:pathToFileURL(join(directory,id)+sep)});
  const assets=await readdir(new URL('assets/',result.output));
  if(id==='crunch'){assert(assets.includes('chip-a.mp3'));assert(assets.includes('chip-b.mp3'));assert(result.html.includes('rel="preload" href="/assets/chip.webp"'));assert(!assets.includes('penny.webp'));}
  else {assert(assets.includes('penny.webp'));assert(!assets.includes('chip-a.mp3'));assert(!result.html.includes('src="/crunch.js"'));}
 }
});
test('editorial digest changes for claims, accessible copy and assets, not markup or approval bookkeeping',async()=>{
 const {contentDigest}=await import('../scripts/content.mjs');
 const entry={...publishedFixture(),id:'copper',treatment:{kind:'custom',template:'copper'}};
 const fragment='<div class="a"><h2>A question</h2><img alt="Object"><a href="https://example.org/source">Source</a></div>';
 const digest=contentDigest(entry,{fragment});
 assert.equal(contentDigest({...entry,order:999,approval:{by:'Another approver',at:'2020-05-01'}},{fragment:fragment.replace('class="a"','class="b"').replaceAll('h2','h1')}),digest);
 assert.notEqual(contentDigest(entry,{fragment:fragment.replace('Object','Different object')}),digest);
 assert.notEqual(contentDigest(entry,{fragment,assetDigests:{'assets/penny.webp':'different'}}),digest);
});
test('shared reveal controller keeps two same-form choices and disclosures independent and cleans up',async()=>{
 const {runInNewContext}=await import('node:vm');
 class Element extends EventTarget {constructor(text=''){super();this.textContent=text;this.hidden=true;this.dataset={};this.attributes={};this.nodes={};}querySelector(key){return this.nodes[key]??null;}querySelectorAll(key){return this.nodes[key]??[];}setAttribute(k,v){this.attributes[k]=v;}}
 function fixture() {
  const entry=new Element(),choices=new Element(),status=new Element(),reveal=new Element();reveal.open=false;
  const buttons=['north','south'].map(id=>{const b=new Element(id);b.dataset.guess=id;return b;});
  const feedback=buttons.map(b=>{const e=new Element();e.dataset.feedback=b.dataset.guess;return e;});
  choices.nodes['[data-guess]']=buttons;
  entry.nodes={'.discovery-guess':choices,'.guess-status':status,'.discovery-reveal':reveal,'[data-feedback]':feedback};return {entry,buttons,status,reveal,feedback};
 }
 const first=fixture(),second=fixture(),window=new EventTarget();
 runInNewContext(await readFile(new URL('../public/discoveries.js',import.meta.url),'utf8'),{window,document:{querySelectorAll:()=>[first.entry,second.entry]},AbortController,CustomEvent:class extends Event{constructor(name,options){super(name);this.detail=options.detail;}}});
 first.buttons[0].dispatchEvent(new Event('click'));
 assert.equal(first.buttons[0].attributes['aria-pressed'],'true');assert.equal(second.buttons[0].attributes['aria-pressed'],undefined);
 assert.equal(first.feedback[0].hidden,false);assert.equal(second.feedback[0].hidden,true);assert.equal(first.reveal.open,false,'guess remains optional and distinct from reveal');
 first.reveal.open=true;const cleanup=window.WeirdDiscoveries.initialize(first.entry);assert.equal(first.reveal.open,true);
 cleanup();first.buttons[1].dispatchEvent(new Event('click'));assert.equal(first.buttons[0].attributes['aria-pressed'],'true','removed controller no longer changes selection');
});
test('an approved but never-released revision cannot justify a withdrawal',async()=>{
 const {contentDigest,selectRelease}=await import('../scripts/content.mjs');
 const entry=publishedFixture(),digest=contentDigest(entry);entry.approval.digest=digest;
 const manifest={version:1,releasedAt:'2020-01-01T00:00:00Z',authorizedBy:'Fixture editor',entries:[],withdrawals:[{id:entry.id,reason:'Withdrawn',at:'2020-01-02',authorizedBy:'Fixture editor'}]};
 assert.throws(()=>selectRelease([],{manifest,revisions:[{id:entry.id,digest,entry}],now}),/previously released/);
});
test('editorial fragment digest understands HTML attribute quoting and character references',async()=>{
 const {contentDigest}=await import('../scripts/content.mjs');
 const entry={...publishedFixture(),id:'copper',treatment:{kind:'custom',template:'copper'}};
 const first='<p>One &amp; two</p><img alt="Copper"><a href="https://example.org/source">Receipt</a>';
 const equivalent="<p class='refactor'>One &#38; two</p><img alt='Copper'><a href=https://example.org/source>Receipt</a>";
 assert.equal(contentDigest(entry,{fragment:first}),contentDigest(entry,{fragment:equivalent}));
 assert.notEqual(contentDigest(entry,{fragment:equivalent}),contentDigest(entry,{fragment:equivalent.replace("alt='Copper'","alt='Nickel'")}));
 assert.notEqual(contentDigest(entry,{fragment:equivalent}),contentDigest(entry,{fragment:equivalent.replace('example.org/source','example.org/other')}));
});
