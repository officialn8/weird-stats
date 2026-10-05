import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { root, loadEntries, validate, selectEntries, renderEntry, reviewState, linePoints, csv } from '../scripts/content.mjs';
import {build} from '../scripts/build.mjs';
const now=new Date('2026-10-05T00:00:00Z');
const entries=await loadEntries();
const draft=entries.find(e=>e.id==='same-two-seats');
const clone=()=>structuredClone(draft);
test('normal edition excludes review, retired, and future scheduled entries',()=>{
 const future={...entries[0],id:'future',publishedAt:'2030-01-01T00:00:00Z'};
 assert.deepEqual(selectEntries([...entries,future],{now}).map(e=>e.id),['crunch','copper','mail','painting']);
 assert(selectEntries(entries,{now,drafts:true}).some(e=>e.id===draft.id));
 assert(!selectEntries([{...draft,status:'retired'}],{now,drafts:true}).length);
});
test('publishing requires an explicit approval record',()=>{
 const e=clone();e.status='published';e.publishedAt='2026-10-04T12:00:00Z';assert.throws(()=>validate(e),/approval/);
});
test('review entries require primary evidence and chart integrity',()=>{
 let e=clone();e.evidence.sources=[];assert.throws(()=>validate(e),/primary source/);
 e=clone();e.treatment.views[0].baseline=5;assert.throws(()=>validate(e),/zero baseline/);
 e=clone();e.treatment.views[0].values[0].value=NaN;assert.throws(()=>validate(e),/outside/);
 e=clone();e.treatment.views[0].max=10;assert.throws(()=>validate(e),/outside/);
 e=clone();delete e.evidence.denominator;assert.throws(()=>validate(e),/denominator/);
});
test('line chart preserves irregular time spacing and rejects out-of-order points',()=>{
 assert.equal(linePoints([{x:2000,value:0},{x:2001,value:50},{x:2010,value:100}],100),'40,210 90,120 540,30');
 const e=clone();e.treatment.kind='line';e.treatment.views=[{...e.treatment.views[0],values:[{label:'2000',x:2000,value:10},{label:'1990',x:1990,value:20}]}];assert.throws(()=>validate(e),/must increase/);
});
test('source text is escaped and non-HTTPS sources are rejected',async()=>{
 const e=clone();e.question='<script>alert(1)</script>';const html=await renderEntry(e,null,now);assert(!html.includes('<script>alert'));assert(html.includes('&lt;script&gt;'));
 e.evidence.sources[0].url='javascript:alert(1)';assert.throws(()=>validate(e),/HTTPS/);
});
test('stale sources are flagged, not silently refreshed',()=>{
 assert.equal(reviewState(draft,new Date('2028-01-01')),'Review due');assert.equal(reviewState(draft,now),'Checked');
});
test('data export includes both measures and guards spreadsheet formulas',()=>{
 const data=csv(draft);assert(data.includes('39538223'));assert(data.includes('"Senate seats","Wyoming","2","seats"'));
 const e=clone();e.treatment.views[0].values[0].label='=1+1';assert(csv(e).includes("'=1+1"));
 assert.equal((39538223/576851).toFixed(1),'68.5');
});
test('production build excludes draft markup, data, metadata and editorial files',async()=>{
 const prod=await build({now});assert(!prod.html.includes('same-two-seats'));assert(!prod.html.includes('Draft for review'));
 assert.equal((prod.html.match(/<h1\b/g)||[]).length,1);
 assert(!(await readdir(new URL('data/',prod.output))).includes('same-two-seats.csv'));
 assert(!(await readFile(new URL('feed.json',prod.output),'utf8')).includes('same-two-seats'));
 assert(!(await readdir(prod.output)).includes('content'));
 const review=await build({now,drafts:true});assert(review.html.includes('same-two-seats'));assert(review.html.includes('noindex,nofollow'));
 assert((await readFile(new URL('data/same-two-seats.csv',review.output),'utf8')).includes('576851'));
});
test('bespoke links resolve to the actual next entry when reordered',async()=>{
 const html=await renderEntry(entries.find(e=>e.id==='crunch'),draft,now);assert(html.includes('href="#same-two-seats"'));assert(!html.includes('href="#copper"'));
});
