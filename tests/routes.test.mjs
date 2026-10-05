import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from '../scripts/build.mjs';
import {validate,contentDigest,renderEntry,createPageContext,esc} from '../scripts/content.mjs';
import {collectionCopy,collectionImagePath} from '../scripts/collection-copy.mjs';
import {renderShareImage,renderCollectionShareImage} from '../scripts/share-images.mjs';
import {publishedFixture,reviewFixture} from './fixtures/entries.mjs';
const now=new Date('2020-06-01T00:00:00Z');
async function output(t){const dir=await mkdtemp(join(tmpdir(),'weird-routes-'));t.after(()=>rm(dir,{recursive:true,force:true}));return pathToFileURL(dir+sep);}
const page=(out,id)=>readFile(new URL(`discoveries/${id}/index.html`,out),'utf8');
// The home tab title and search description predate the link preview and keep their exact text.
const homeTitle='weird.stats | Wonderfully unnecessary',homeDescription='Unexpected discoveries, interactive comparisons, and sourced numbers about the world. A collection for the incurably curious.';
const values=(head,pattern)=>[...head.matchAll(pattern)].map(m=>m[1]);
function meta(head,attribute,key) {
 const found=values(head,new RegExp(`<meta ${attribute}="${key}" content="([^"]*)">`,'g'));
 assert.equal(found.length,1,`exactly one ${key}`);return found[0];
}
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
test('the collection head carries the approved link preview in its initial HTML, with a versioned card outside share/',async t=>{
 const first=publishedFixture(),second={...publishedFixture(),id:'fixture-second',question:'Where did this sample go?'};
 const out=await output(t),result=await build({now,records:[first,second],output:out,publicOrigin:'https://example.org'});
 const html=await readFile(new URL('index.html',out),'utf8'),head=html.split('</head>')[0];
 assert.equal(html,result.html);
 assert.equal((head.match(/<title\b/g)||[]).length,1);assert.deepEqual(values(head,/<title>([^<]*)<\/title>/g),[homeTitle]);
 assert.equal((head.match(/name="description"/g)||[]).length,1);assert.equal(meta(head,'name','description'),esc(homeDescription));
 assert.equal((head.match(/rel="canonical"/g)||[]).length,1);assert.deepEqual(values(head,/<link rel="canonical" href="([^"]*)">/g),['https://example.org/']);
 const image=`https://example.org/${collectionImagePath()}`;
 for(const [attribute,key,value] of [
  ['property','og:type','website'],['property','og:site_name','weird.stats'],
  ['property','og:title',collectionCopy.title],['property','og:description',collectionCopy.description],['property','og:url','https://example.org/'],
  ['property','og:image',image],['property','og:image:type','image/png'],['property','og:image:width','1200'],['property','og:image:height','630'],['property','og:image:alt',collectionCopy.alt],
  ['name','twitter:card','summary_large_image'],['name','twitter:image',image],['name','twitter:image:alt',collectionCopy.alt]
 ])assert.equal(meta(head,attribute,key),esc(value),key);
 assert(!head.includes('name="robots"'),'the public collection stays indexable, which also keeps analytics on');
 const png=await readFile(new URL(collectionImagePath(),out));
 assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
 assert(png.equals(renderCollectionShareImage()),'the build writes the collection renderer output');
 const cards=await readdir(new URL('share/',out));assert.deepEqual(cards,['fixture-published.png','fixture-second.png']);
 for(const card of cards)assert(!png.equals(await readFile(new URL(`share/${card}`,out))),`${card} must differ from the collection card`);
});
// Production builds run no tests, so the build itself refuses link-preview copy that differs from the approval record.
test('a build with unapproved home-preview copy throws before replacing prior output',async t=>{
 const out=await output(t),options={now,records:[publishedFixture()],output:out,publicOrigin:'https://example.org'};
 await build({...options,homeCopy:{...collectionCopy}});
 const before=await readFile(new URL('index.html',out),'utf8'),files=await readdir(out,{recursive:true});
 for(const [field,value] of [['title','weird.stats: wonderfully necessary discoveries'],['description','Sourced numbers about the world.'],['alt','weird.stats: A collection.'],['headline','Wonderfully unnecessary findings.'],['version',2]])
  await assert.rejects(build({...options,homeCopy:{...collectionCopy,[field]:value}}),/home preview needs a new version and a new approval record/,field);
 assert.equal(await readFile(new URL('index.html',out),'utf8'),before);assert.deepEqual(await readdir(out,{recursive:true}),files);
});
test('discovery previews keep their exact metadata and card bytes',async t=>{
 const entry=publishedFixture(),out=await output(t);await build({now,records:[entry],output:out,publicOrigin:'https://example.org'});
 const head=(await page(out,entry.id)).split('</head>')[0];
 const question='Which sample is larger?',description='A small question. A surprising discovery. Take a look at weird.stats.',url='https://example.org/discoveries/fixture-published/',image='https://example.org/share/fixture-published.png';
 assert(head.includes(`<meta name="viewport" content="width=device-width,initial-scale=1"><title>${question} | weird.stats</title><meta name="description" content="${description}"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:site_name" content="weird.stats"><meta property="og:title" content="${question}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${question}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${image}"><meta name="twitter:image:alt" content="${question}"><link rel="icon"`));
 assert.equal((head.match(/<title\b/g)||[]).length,1);assert(!head.includes('social/'));assert(!head.includes(collectionCopy.title));
 assert((await readFile(new URL(`share/${entry.id}.png`,out))).equals(await renderShareImage(entry)));
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
 const home=(await readFile(new URL('index.html',out),'utf8')).split('</head>')[0];
 assert(meta(home,'property','og:image').endsWith(`/${collectionImagePath()}`));assert(!home.includes(entry.question));
 assert((await readFile(new URL(collectionImagePath(),out))).equals(renderCollectionShareImage()),'a withdrawals-only collection still has its card');
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
const shareSource=readFile(new URL('../public/share.js',import.meta.url),'utf8');
async function loadShare(navigator,page=canonical){
 const {runInNewContext}=await import('node:vm');
 const nodes=Object.fromEntries(['[data-share-button]','[data-share-link]','[data-share-fallback]','input','[role="status"]'].map(key=>[key,new ShareNode()]));
 nodes['[data-share-link]'].href='/discoveries/fictional/';
 const control={dataset:{shareUrl:canonical,shareTitle:'A question?'},querySelector:key=>nodes[key]};
 const document={title:'A question?',body:{prepend(){}},createElement:()=>({}),querySelectorAll:selector=>selector==='a[href]'?[nodes['[data-share-link]']]:[control]};
 const location=new URL(page);
 runInNewContext(await shareSource,{document,navigator,location});
 return {nodes,control,document,location};
}
const clickShare=async({nodes})=>{await nodes['[data-share-button]'].listeners.click();return nodes;};
test('share is keyboard-native and preserves canonical URLs through native, clipboard and selectable fallback paths',async()=>{
 const run=async(navigator,page)=>clickShare(await loadShare(navigator,page));
 let received;let nodes=await run({share:async payload=>received=payload});assert.equal(received.url,canonical);assert(!received.url.includes('#'));assert.equal(nodes['[role="status"]'].textContent,'Share sheet opened.');
 nodes=await run({clipboard:{writeText:async url=>received=url}});assert.equal(received,canonical);assert.equal(nodes['[role="status"]'].textContent,'Link copied');
 nodes=await run({share:async()=>{throw new Error('Unavailable');},clipboard:{writeText:async()=>{throw new Error('Denied');}}});assert.equal(nodes['[data-share-fallback]'].hidden,false);assert(nodes.input.focused&&nodes.input.selected);assert.equal(nodes.input.value,canonical);assert.equal(nodes['[data-share-button]'].disabled,false);
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
