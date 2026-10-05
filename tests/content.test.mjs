import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validate, selectEntries, renderEntry, reviewState, linePoints, csv } from '../scripts/content.mjs';
import { build } from '../scripts/build.mjs';
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
test('bespoke links resolve to the actual next entry when reordered',async()=>{
 const e={...publishedFixture(),id:'crunch',treatment:{kind:'custom',template:'crunch'}};
 const html=await renderEntry(e,reviewFixture(),now);assert(html.includes('href="#fixture-comparison"'));assert(!html.includes('href="#copper"'));
});
