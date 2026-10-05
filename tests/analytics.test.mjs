import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createVisit,filterEvent,mayTrack,posthogOptions} from '../public/analytics.js';
import {analyticsHead} from '../scripts/analytics.mjs';
import {build} from '../scripts/build.mjs';
import {publishedFixture} from './fixtures/entries.mjs';
const config={enabled:true,projectToken:'phc_Fixture123',apiHost:'https://us.i.posthog.com',publicOrigin:'https://example.org'};
const entries=[{id:'first',revealable:true},{id:'second',revealable:true},{id:'immediate',revealable:false}];
test('replays and repeat views cannot inflate the two-distinct-reveals metric',()=>{
  const calls=[];const visit=createVisit({entries,capture:(event,properties)=>calls.push({event,properties}),visitId:'fixture',pageKind:'collection'});
  visit.start();visit.start();visit.view('first');visit.view('first');visit.reveal('first');visit.reveal('first');visit.reveal('immediate');visit.reveal('unknown');
  visit.view('second');visit.view('second');visit.reveal('second');visit.reveal('second');
  visit.view('first');
  assert.equal(calls.filter(e=>e.event==='visit_started').length,1);
  assert.deepEqual(calls.filter(e=>e.event==='discovery_revealed').map(e=>[e.properties.entry_id,e.properties.revealed_count]),[['first',1],['second',2]]);
  assert.equal(calls.filter(e=>e.event==='discovery_continued').length,1);
  assert.equal(calls[0].properties.available_reveals,2);
  assert(calls.every(e=>e.properties.visit_id==='fixture'));
});
test('shares distinguish intent, cancellation, fallback, and browser completion',()=>{
  const calls=[];const visit=createVisit({entries,capture:(event,properties)=>calls.push({event,properties}),visitId:'fixture',pageKind:'discovery'});
  visit.share('first','button','intent');visit.share('first','native','cancelled');visit.share('first','manual','fallback');visit.share('first','clipboard','completed');
  visit.share('unknown','clipboard','completed');visit.share('first','arbitrary','completed');
  assert.deepEqual(calls.filter(e=>e.event==='discovery_share').map(e=>e.properties.outcome),['intent','cancelled','fallback','completed']);
});
test('privacy boundary rejects other origins, review pages, automation and opt-outs',()=>{
  const location={origin:config.publicOrigin,pathname:'/'};
  assert.equal(mayTrack(config,location,{}),true);
  for(const navigator of [{doNotTrack:'1'},{globalPrivacyControl:true},{webdriver:true}])assert.equal(mayTrack(config,location,navigator),false);
  for(const pathname of ['/review.html','/review/first/digest/','/404.html'])assert.equal(mayTrack(config,{...location,pathname},{}),false);
  for(const origin of ['http://localhost:63014','https://preview.vercel.app'])assert.equal(mayTrack(config,{...location,origin},{}),false);
  assert.equal(mayTrack(config,location,{},true),false);
  assert.equal(mayTrack({...config,enabled:false},location,{}),false);
});
test('SDK sends only approved event properties and keeps no persistent identity',()=>{
  const options=posthogOptions(config);
  assert.equal(options.persistence,'memory');assert.equal(options.disable_persistence,true);assert.equal(options.person_profiles,'never');assert.equal(options.ip,false);
  assert.equal(options.autocapture,false);assert.equal(options.capture_pageview,false);assert.equal(options.disable_session_recording,true);assert.equal(options.disable_external_dependency_loading,true);
  assert.equal(filterEvent({event:'$autocapture',properties:{}}),null);
  const event=filterEvent({event:'discovery_revealed',properties:{entry_id:'first',distinct_id:'temporary',token:'fixture','$current_url':'https://example.org/?email=private','$referrer':'private',email:'private','$set':{email:'private'}}});
  assert.deepEqual(event.properties,{entry_id:'first',distinct_id:'temporary',token:'fixture'});
});
// markQA (run from the analytics module's boot) must see permalinks already rewritten by share.js,
// so share.js has to be a deferred classic script placed before the analytics module tag.
function assertShareBeforeAnalytics(html,label){
  const tags=src=>html.match(new RegExp(`<script\\b[^>]*\\bsrc="${src.replace('.','\\.')}"[^>]*>`,'g'))??[];
  const [share,...extraShare]=tags('/share.js'),[analytics,...extraAnalytics]=tags('/analytics.js');
  assert(share&&!extraShare.length,`${label}: exactly one share.js script tag`);
  assert(analytics&&!extraAnalytics.length,`${label}: exactly one analytics.js script tag`);
  assert(/\sdefer(?=[\s>=])/.test(share),`${label}: share.js is deferred`);
  assert(!/\sasync(?=[\s>=])/.test(share),`${label}: share.js is not async`);
  assert(!/\stype\s*=/.test(share),`${label}: share.js is a classic script, not a module`);
  assert(/\stype="module"/.test(analytics),`${label}: analytics.js is a module`);
  assert(html.indexOf(share)<html.indexOf(analytics),`${label}: share.js tag precedes the analytics.js module tag`);
}
test('tracking config is validated and public builds alone load the pinned SDK',async t=>{
  const entry=publishedFixture();
  assert.equal(analyticsHead(config,{drafts:true,entries:[entry],publicOrigin:config.publicOrigin}),'');
  assert.throws(()=>analyticsHead({...config,projectToken:'secret<script>'},{entries:[entry],publicOrigin:config.publicOrigin}),/token/);
  assert.throws(()=>analyticsHead(config,{entries:[entry],publicOrigin:'https://elsewhere.org'}),/origin/);
  const dir=await mkdtemp(join(tmpdir(),'weird-analytics-'));t.after(()=>rm(dir,{recursive:true,force:true}));const output=pathToFileURL(dir+sep);
  const args={records:[entry],analytics:config,publicOrigin:config.publicOrigin,output,now:new Date('2020-06-01')};
  await build(args);
  assert((await readFile(new URL('index.html',output),'utf8')).includes('id="analytics-config"'));
  assert((await readFile(new URL('discoveries/fixture-published/index.html',output),'utf8')).includes('id="analytics-config"'));
  assert(!(await readFile(new URL('404.html',output),'utf8')).includes('id="analytics-config"'));
  assertShareBeforeAnalytics(await readFile(new URL('index.html',output),'utf8'),'collection index.html');
  assertShareBeforeAnalytics(await readFile(new URL('discoveries/fixture-published/index.html',output),'utf8'),'discovery page');
  await access(new URL('vendor/posthog.mjs',output));
  await build({...args,drafts:true});
  assert(!(await readFile(new URL('index.html',output),'utf8')).includes('id="analytics-config"'));
  await assert.rejects(access(new URL('vendor/posthog.mjs',output)),{code:'ENOENT'});
});
// A fake page for QA marking: anchors expose only their raw href attribute, as the DOM does.
function qaPage(href,links=[]){
  const anchors=links.map(value=>({attributes:{href:value},getAttribute(name){return this.attributes[name]??null;},setAttribute(name,next){this.attributes[name]=String(next);}}));
  const prepended=[];
  const document={title:'weird.stats | Wonderfully unnecessary',body:{prepend:(...nodes)=>prepended.unshift(...nodes)},
    createElement:tagName=>({tagName,className:'',textContent:''}),querySelectorAll:selector=>selector==='a[href]'?anchors:[],querySelector:()=>null};
  return {document,location:new URL(href),prepended,hrefs:()=>anchors.map(a=>a.getAttribute('href'))};
}
test('QA marking follows only same-origin collection and discovery links',async()=>{
  const {qaHref}=await import('../public/analytics.js');
  const page='https://weirdstats.dev/discoveries/copper/?qa=1';
  for(const [href,marked] of [
    ['/discoveries/mail/','/discoveries/mail/?qa=1'],['/','/?qa=1'],['https://weirdstats.dev/','https://weirdstats.dev/?qa=1'],
    ['https://weirdstats.dev/discoveries/mail/','https://weirdstats.dev/discoveries/mail/?qa=1'],
    ['/discoveries/mail/?ref=feed','/discoveries/mail/?ref=feed&qa=1'],['/discoveries/mail/#receipts','/discoveries/mail/?qa=1#receipts'],
    ['/discoveries/mail/?qa=0','/discoveries/mail/?qa=1'],['/discoveries/mail/?qa=1&qa=1','/discoveries/mail/?qa=1'],
  ])assert.equal(qaHref(href,page),marked,href);
  for(const href of ['#copper','#top','','/data/same-two-seats.csv','https://facts.usps.com/fun/','https://elsewhere.org/discoveries/mail/','http://weirdstats.dev/',
    '/review.html','/review/first/digest/','/404.html','/discoveries/','/discoveries/mail','/discoveries/mail/extra/',
    '/discoveries/mail/?qa=1','https://weirdstats.dev/?qa=1#top','/?ref=feed&qa=1'])assert.equal(qaHref(href,page),href,href);
  assert.equal(qaHref(qaHref('/discoveries/mail/?ref=feed',page),page),'/discoveries/mail/?ref=feed&qa=1');
  // Off the canonical origin, local links stay local and a production URL is never marked.
  assert.equal(qaHref('/discoveries/mail/','http://localhost:63014/?qa=1'),'/discoveries/mail/?qa=1');
  assert.equal(qaHref('https://weirdstats.dev/discoveries/mail/','http://localhost:63014/?qa=1'),'https://weirdstats.dev/discoveries/mail/');
});
test('a qa=1 page shows the test-mode cue and records the visit as QA',async()=>{
  const {markQA}=await import('../public/analytics.js');
  const page=qaPage('http://localhost:63014/?ref=feed&qa=1',['/discoveries/mail/','#copper','/data/same-two-seats.csv','https://facts.usps.com/fun/','https://weirdstats.dev/']);
  const qa=markQA(page.document,page.location);
  assert.equal(qa,true);
  assert.deepEqual(page.hrefs(),['/discoveries/mail/?qa=1','#copper','/data/same-two-seats.csv','https://facts.usps.com/fun/','https://weirdstats.dev/']);
  assert.equal(page.document.title,'QA · weird.stats | Wonderfully unnecessary');
  assert.equal(page.prepended.length,1);
  const [strip]=page.prepended;
  assert.equal(strip.className,'draft-banner');assert.match(strip.textContent,/not counted/);assert.match(strip.textContent,/\?qa=1/);
  const calls=[];createVisit({entries,capture:(event,properties)=>calls.push({event,properties}),visitId:'fixture',pageKind:'collection',qa}).start();
  assert.deepEqual(calls.map(e=>[e.event,e.properties.qa,e.properties.schema_version]),[['visit_started',true,1]]);
});
test('without exactly qa=1 nothing is rewritten and no cue appears',async()=>{
  const {markQA}=await import('../public/analytics.js');
  for(const search of ['','?qa=0','?qa=true','?qa=','?QA=1','?ref=qa%3D1']){
    const page=qaPage('https://weirdstats.dev/'+search,['/discoveries/mail/','https://weirdstats.dev/']);
    assert.equal(markQA(page.document,page.location),false,search);
    assert.deepEqual(page.hrefs(),['/discoveries/mail/','https://weirdstats.dev/'],search);
    assert.equal(page.document.title,'weird.stats | Wonderfully unnecessary',search);assert.equal(page.prepended.length,0,search);
  }
});
test('boot marks a QA page before the tracking gate, so local builds show it without starting analytics',async t=>{
  const page=qaPage('http://localhost:63014/discoveries/copper/?qa=1',['/','/discoveries/mail/','#copper']);
  page.document.querySelector=selector=>selector==='#analytics-config'?{textContent:JSON.stringify({...config,entries})}:null;
  Object.assign(globalThis,{document:page.document,location:page.location});
  t.after(()=>{delete globalThis.document;delete globalThis.location;delete globalThis.WeirdAnalytics;});
  await import('../public/analytics.js?boot=qa');
  assert.deepEqual(page.hrefs(),['/?qa=1','/discoveries/mail/?qa=1','#copper']);
  assert.equal(page.prepended.length,1);assert(page.document.title.startsWith('QA · '));
  assert.equal(globalThis.WeirdAnalytics,undefined,'localhost must not start analytics');
});
