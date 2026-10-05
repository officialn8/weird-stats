import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from '../scripts/build.mjs';
import {validate,contentDigest,renderEntry,createPageContext} from '../scripts/content.mjs';
import {publishedFixture,reviewFixture} from './fixtures/entries.mjs';
const now=new Date('2020-06-01T00:00:00Z');
async function output(t){const dir=await mkdtemp(join(tmpdir(),'weird-routes-'));t.after(()=>rm(dir,{recursive:true,force:true}));return pathToFileURL(dir+sep);}
const page=(out,id)=>readFile(new URL(`discoveries/${id}/index.html`,out),'utf8');
test('individual routes have question-only canonical metadata and distinct real PNGs',async t=>{
 const first=publishedFixture(),second={...publishedFixture(),id:'fixture-second',question:'Where did this sample go?',answer:'SPOILER PRIVATE ANSWER'};
 const out=await output(t);await build({now,records:[first,second],output:out,publicOrigin:'https://example.org'});
 const buffers=[];
 for(const entry of [first,second]) {
  const html=await page(out,entry.id),head=html.split('</head>')[0];
  assert(head.includes(`rel="canonical" href="https://example.org/discoveries/${entry.id}/"`));
  assert(head.includes(entry.question));assert(!head.includes(entry.answer));assert(!head.includes('SPOILER'));
  assert(html.includes('href="/"')&&html.includes('Keep wandering'));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  const png=await readFile(new URL(`share/${entry.id}.png`,out));assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);buffers.push(png);
  assert(head.includes(`https://example.org/share/${entry.id}.png`));assert(head.includes('og:image:alt'));
  assert(html.includes(`data-share-url="https://example.org/discoveries/${entry.id}/"`));
 }
 assert(!buffers[0].equals(buffers[1]));
 const feed=JSON.parse(await readFile(new URL('feed.json',out),'utf8'));assert.equal(feed.entries[0].url,'https://example.org/discoveries/fixture-published/');
 assert((await readFile(new URL('404.html',out),'utf8')).includes('Discovery not found'));
 assert(!(await readdir(new URL('discoveries/',out))).includes('unknown'));
});
test('route, PNG, data and metadata selection excludes private and future entries',async t=>{
 const draft={...reviewFixture(),assets:[{path:'assets/mule.webp'}]},future={...publishedFixture(),id:'future-entry',publishedAt:'2030-01-01T00:00:00Z'};
 const out=await output(t);await build({now,records:[publishedFixture(),draft,future],output:out});
 assert.deepEqual(await readdir(new URL('discoveries/',out)),['fixture-published']);assert.deepEqual(await readdir(new URL('share/',out)),['fixture-published.png']);
 assert(!(await readdir(new URL('assets/',out))).includes('mule.webp'));
 await build({now,records:[publishedFixture(),draft,future],drafts:true,output:out});
 assert((await page(out,draft.id)).includes('noindex,nofollow'));
 assert(!(await readdir(new URL('discoveries/',out))).includes(future.id));
});
test('withdrawn routes contain a safe notice but no withdrawn graphic, CSV or question metadata',async t=>{
 const entry=publishedFixture(),digest=contentDigest(entry);entry.approval.digest=digest;
 const revisions=[{id:entry.id,digest,entry,release:{at:'2020-01-01T00:00:00Z',authorizedBy:'Fixture editor'}}];
 const manifest={version:1,releasedAt:'2020-06-01T00:00:00Z',authorizedBy:'Fixture editor',entries:[],withdrawals:[{id:entry.id,reason:'Withdrawn for review.',at:'2020-06-01',authorizedBy:'Fixture editor'}]};
 const out=await output(t);await build({now,records:[],manifest,revisions,output:out});
 const html=await page(out,entry.id);assert(html.includes('Discovery withdrawn'));assert(!html.includes(entry.question));assert(!html.includes(entry.answer));assert(!html.includes('og:image'));assert.deepEqual(await readdir(new URL('share/',out)),[]);assert.deepEqual(await readdir(new URL('data/',out)),[]);
});
test('all custom srcset candidates and nested assets are root relative',async()=>{
 const html=await renderEntry({...publishedFixture(),id:'crunch',treatment:{kind:'custom',template:'crunch'}},null,now,createPageContext({mode:'discovery'}));
 assert(html.includes('srcset="/assets/chip-small.webp 600w, /assets/chip.webp 800w"'));
 for(const match of html.matchAll(/(?:src|href)="(assets\/[^\"]+)"/g))assert.fail(`Relative asset: ${match[1]}`);
});
test('invalid origins and missing/non-string IDs fail before destroying output',async t=>{
 for(const id of [undefined,null,123,'../escape'])assert.throws(()=>validate({...publishedFixture(),id}),/Invalid entry id/);
 const out=await output(t);
 for(const publicOrigin of ['http://example.org','https://user:pass@example.org','https://example.org/path','https://example.org/?key=x','https://example.org/#hash','not a URL'])await assert.rejects(build({now,records:[publishedFixture()],output:out,publicOrigin}),/public origin/i);
});
// share.js is a deferred classic script; analytics.js, a module, runs after it on the same page.
const canonical='https://example.org/discoveries/fictional/';
class ShareNode {constructor(){this.hidden=true;this.listeners={};this.value='';}addEventListener(type,fn){this.listeners[type]=fn;}focus(){this.focused=true;}select(){this.selected=true;}getAttribute(name){return name==='href'?this.href??null:null;}setAttribute(name,value){if(name==='href')this.href=String(value);}}
async function loadShare(navigator,page=canonical){
 const {runInNewContext}=await import('node:vm');
 const source=await readFile(new URL('../public/share.js',import.meta.url),'utf8');
 const nodes=Object.fromEntries(['[data-share-button]','[data-share-link]','[data-share-fallback]','input','[role="status"]'].map(key=>[key,new ShareNode()]));
 nodes['[data-share-link]'].href='/discoveries/fictional/';
 const control={dataset:{shareUrl:canonical,shareTitle:'A question?'},querySelector:key=>nodes[key]};
 const document={title:'A question?',body:{prepend(){}},createElement:()=>({}),querySelectorAll:selector=>selector==='a[href]'?[nodes['[data-share-link]']]:[control]};
 const location=new URL(page);
 runInNewContext(source,{document,navigator,location});
 return {nodes,control,document,location};
}
const clickShare=async({nodes})=>{await nodes['[data-share-button]'].listeners.click();return nodes;};
test('share is keyboard-native and preserves canonical URLs through native, clipboard and selectable fallback paths',async()=>{
 const run=async(navigator,page)=>clickShare(await loadShare(navigator,page));
 let received;let nodes=await run({share:async payload=>received=payload});assert.equal(received.url,'https://example.org/discoveries/fictional/');assert(!received.url.includes('#'));assert.equal(nodes['[role="status"]'].textContent,'Share sheet opened.');
 nodes=await run({clipboard:{writeText:async url=>received=url}});assert.equal(received,'https://example.org/discoveries/fictional/');assert.equal(nodes['[role="status"]'].textContent,'Link copied');
 nodes=await run({share:async()=>{throw new Error('Unavailable');},clipboard:{writeText:async()=>{throw new Error('Denied');}}});assert.equal(nodes['[data-share-fallback]'].hidden,false);assert(nodes.input.focused&&nodes.input.selected);assert.equal(nodes.input.value,'https://example.org/discoveries/fictional/');assert.equal(nodes['[data-share-button]'].disabled,false);
 let copied=false;nodes=await run({share:async()=>{throw Object.assign(new Error('Canceled'),{name:'AbortError'});},clipboard:{writeText:async()=>copied=true}});assert.equal(copied,false);assert.equal(nodes['[data-share-fallback]'].hidden,true);
 // Only the canonical origin swaps in the canonical permalink; local and preview origins keep the relative link, so navigation stays there.
 for(const [page,permalink] of [[canonical,canonical],['http://localhost:63014/','/discoveries/fictional/'],['https://weird-stats-git-fix.vercel.app/discoveries/fictional/','/discoveries/fictional/']]){
  const shared=[];
  nodes=await run({share:async payload=>shared.push(payload.url)},page);assert.equal(nodes['[data-share-link]'].href,permalink,page);
  await run({clipboard:{writeText:async url=>shared.push(url)}},page);
  shared.push((await run({},page)).input.value);
  assert.deepEqual(shared,[canonical,canonical,canonical],page);
 }
 const html=await renderEntry(publishedFixture());assert(html.includes('<button class="text-button" type="button" data-share-button hidden>'));assert(html.indexOf('data-share-url')>html.indexOf('</details><div class="discovery-evidence">'));
});
test('QA marking follows the permalink but never reaches shared values',async()=>{
 const {markQA}=await import('../public/analytics.js');
 for(const [page,permalink] of [['https://example.org/?qa=1',canonical+'?qa=1'],['http://localhost:63014/discoveries/fictional/?qa=1','/discoveries/fictional/?qa=1']]){
  const shared=[];
  for(const navigator of [{share:async payload=>shared.push(payload.url)},{clipboard:{writeText:async url=>shared.push(url)}},{}]){
   const loaded=await loadShare(navigator,page);
   assert.equal(markQA(loaded.document,loaded.location),true,page);
   const nodes=await clickShare(loaded);
   assert.equal(nodes['[data-share-link]'].href,permalink,page);assert.equal(loaded.control.dataset.shareUrl,canonical,page);
   if(!nodes['[data-share-fallback]'].hidden)shared.push(nodes.input.value);
  }
  assert.deepEqual(shared,[canonical,canonical,canonical],page);
 }
});
test('share copy participates in exact editorial digests',()=>{
 const entry=publishedFixture();assert.notEqual(contentDigest(entry),contentDigest({...entry,share:{question:'A different question?'}}));
});
test('legacy chip markup still reveals and resets without optional guessing nodes',async()=>{
 const {runInNewContext}=await import('node:vm');
 class Element extends EventTarget {constructor(){super();this.hidden=true;this.style={setProperty(){},removeProperty(){}};this.classList={contains:()=>false,toggle(){}};this.value='35';this.attrs={};}querySelector(){return new Element();}setAttribute(k,v){this.attrs[k]=v;}focus(){}scrollIntoView(){}pause(){} }
 const selectors=['.chip-stage','#crunch-status','#crunch-volume','#crunch-mute','#crunch-answer','#crunch-reveal','#crunch-reset','#crunch-result','.crunch-player','#crunch-level'];
 const nodes=Object.fromEntries(selectors.map(s=>[s,new Element()]));
 const section=new Element();section.querySelector=key=>nodes[key]??null;section.querySelectorAll=()=>[];section.append=()=>{};
 const document=new EventTarget();document.querySelector=()=>section;document.createElement=()=>new Element();document.body=new Element();
 const observer=class{observe(){}};
 runInNewContext(await readFile(new URL('../public/crunch.js',import.meta.url),'utf8'),{document,window:new EventTarget(),IntersectionObserver:observer,MutationObserver:observer,cancelAnimationFrame(){}});
 nodes['#crunch-reveal'].dispatchEvent(new Event('click'));assert.equal(nodes['#crunch-answer'].hidden,false);
 nodes['#crunch-reset'].dispatchEvent(new Event('click'));assert.equal(nodes['#crunch-answer'].hidden,true);
});
test('both page shells expose the existing copper explanation when scripts are disabled',async()=>{
 for(const file of ['shell.html','discovery-shell.html']) {
  const shell=await readFile(new URL(`../src/${file}`,import.meta.url),'utf8');
  const fallback=shell.match(/<noscript><style>([\s\S]*?)<\/style><\/noscript>/)?.[1]??'';
  assert(fallback.includes('#copper .copper-answer[hidden]{display:grid!important'),`${file}: hidden answer needs a no-script fallback`);
  assert(fallback.includes('.copper-question'),`${file}: question must not overlay the static answer`);
 }
});
