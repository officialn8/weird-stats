import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {newestFirst} from '../scripts/collection-order.mjs';
import {build} from '../scripts/build.mjs';
import {publishedFixture,reviewFixture} from './fixtures/entries.mjs';

test('recency uses first release/review dates, not revisions, manual order or input order',()=>{
 const old={...publishedFixture(),id:'old',order:1,publishedAt:'2020-05-01T00:00:00Z'};
 const newer={...publishedFixture(),id:'newer',order:99,publishedAt:'2020-02-01T00:00:00Z'};
 const draft={...reviewFixture(),id:'draft',order:999};
 const newerDraft={...reviewFixture(),id:'newer-draft',order:0};
 const input=[old,newerDraft,newer,draft];
 const revisions=[{id:'old',release:{authorizedBy:'Editor',at:'2020-05-01T00:00:00Z'}},{id:'old',release:{authorizedBy:'Editor',at:'2020-01-01T00:00:00Z'}}];
 const packets=[{id:'draft',createdAt:'2020-03-01T00:00:00Z'},{id:'draft',createdAt:'2020-06-01T00:00:00Z'},{id:'newer-draft',createdAt:'2020-04-01T00:00:00Z'}];
 assert.deepEqual(newestFirst(input,{revisions,packets}).map(e=>e.id),['newer-draft','draft','newer','old']);
 assert.equal(input[0],old,'ordering does not mutate the records');
 assert.deepEqual(newestFirst([{...newer,id:'z'}, {...newer,id:'a'}]).map(e=>e.id),['a','z']);
});

test('collection, first heading, skip link and feed use newest-first after preview selection',async t=>{
 const dir=await mkdtemp(tmpdir()+'/weird-order-');t.after(()=>rm(dir,{recursive:true,force:true}));
 const output=pathToFileURL(dir+'/'),now=new Date('2020-06-01');
 const old={...publishedFixture(),id:'old',order:1},recent={...publishedFixture(),id:'recent',order:99,publishedAt:'2020-02-01T00:00:00Z'};
 const draft={...reviewFixture(),id:'new-draft',order:999};
 const records=[old,draft,recent];
 let result=await build({records,output,now});
 assert.deepEqual(result.entries.map(e=>e.id),['recent','old']);
 const report={packets:[{id:draft.id,packetId:'test-packet',changes:{claim:[],data:[],sources:[]},readiness:[],state:'pending',entry:draft,createdAt:'2020-05-01T00:00:00Z'}],unpacketized:[]};
 result=await build({records,output,now,drafts:true,reviewReport:report});
 const ids=['new-draft','recent','old'];
 assert.deepEqual(result.entries.map(e=>e.id),ids);
 assert(result.html.indexOf('id="new-draft"')<result.html.indexOf('id="recent"'));
 assert(result.html.includes('href="#new-draft"'));
 assert(result.html.includes('<h1 id="new-draft-title"'));
 const feed=JSON.parse(await readFile(new URL('feed.json',output),'utf8'));
 assert.deepEqual(feed.entries.map(e=>e.id),ids);
});
