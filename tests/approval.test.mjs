import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {publishedFixture,reviewFixture} from './fixtures/entries.mjs';
import {contentDigest,selectRelease} from '../scripts/content.mjs';
import {createReviewDesk,releaseReadiness,carryForward,verifyWorkingRevision,packetDiff} from '../scripts/review-packets.mjs';
import {build} from '../scripts/build.mjs';
const human={by:'Fictional editor',at:'2020-06-01T12:00:00Z',inputReference:'Fixture human response',note:'Fictional decision'};
const now=new Date('2020-06-02T00:00:00Z');
async function setup(t,entry=publishedFixture()){
 const directory=await mkdtemp(join(tmpdir(),'weird-approval-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 for(const path of ['content/entries','content/releases','content/revisions/approved','src/exhibits'])await mkdir(join(directory,path),{recursive:true});
 const digest=contentDigest(entry);entry.approval.digest=digest;
 const revision={id:entry.id,digest,entry};const manifest={version:1,releasedAt:'2020-01-01T00:00:00Z',authorizedBy:'Fixture existing release',entries:[{id:entry.id,digest}],withdrawals:[]};
 await writeFile(join(directory,'content/entries',entry.id+'.json'),JSON.stringify(entry));
 await writeFile(join(directory,'content/revisions/approved',entry.id+'-'+digest+'.json'),JSON.stringify(revision));
 await writeFile(join(directory,'content/releases/current.json'),JSON.stringify(manifest));
 return {directory,entry,digest,manifest,revision,desk:createReviewDesk({directory,clock:()=>now})};
}
test('claim, data, evidence, asset bytes and reuse provenance participate in approval',()=>{
 const entry=publishedFixture(),a=contentDigest(entry);
 for(const change of [e=>e.answer='Changed',e=>e.treatment.views[0].values[0].value=99,e=>e.evidence.scope='Changed',e=>e.dataReuse=[{rights:'unknown'}]]){const b=structuredClone(entry);change(b);assert.notEqual(contentDigest(b),a);}
 assert.notEqual(contentDigest(entry,{assetDigests:{x:'changed'}}),a);
});
test('CSS-only fragment changes preserve digest; custom claim changes require approval',()=>{
 const entry={...publishedFixture(),treatment:{kind:'custom',template:'crunch'}};
 assert.equal(contentDigest(entry,{fragment:'<h1 class="a">Claim</h1>'}),contentDigest(entry,{fragment:'<h2 class="b">Claim</h2>'}));
 assert.notEqual(contentDigest(entry,{fragment:'Claim'}),contentDigest(entry,{fragment:'Different claim'}));
});
test('reject leaves release intact; keep needs actual human input and targets reviewed revision',async t=>{
 const {desk,entry,digest,manifest}=await setup(t);const next={...entry,status:'review',answer:'Private B'};delete next.approval;delete next.publishedAt;
 const p=await desk.propose({entry:next,baselineDigest:digest});assert.equal(p.outcome,'created');
 assert.equal((await desk.decide(entry.id,p.digest,'keep',{})).outcome,'failed');
 assert.equal((await desk.decide(entry.id,p.digest,'reject',human)).outcome,'created');
 assert.deepEqual((await desk.report()).manifest,manifest);
 assert.equal((await desk.decide(entry.id,p.digest,'keep',human)).outcome,'conflict');
});
test('carry-forward requires evidence and keeps original approval provenance; differences become proposals',()=>{
 const entry=publishedFixture(),current={...entry,answer:'Unapproved'};
 assert.throws(()=>carryForward({entry,current}),/baseline evidence/);
 const migrated=carryForward({entry,current,evidence:{reference:'Verified original release',releasedAt:'2020-01-01T00:00:00Z',authorizedBy:'Original release'}});
 assert.equal(migrated.revision.entry.approval.by,entry.approval.by);assert.equal(migrated.proposal.entry.answer,'Unapproved');assert.equal(migrated.proposal.baselineDigest,migrated.revision.digest);
});
test('approval B alone keeps A across generated public surfaces; release is separate',async t=>{
 const {desk,entry,digest,manifest,revision,directory}=await setup(t);const next={...entry,status:'review',answer:'Private B',question:'Private B question?'};delete next.approval;delete next.publishedAt;
 const p=await desk.propose({entry:next,baselineDigest:digest});assert.equal((await desk.decide(entry.id,p.digest,'keep',human)).outcome,'created');
 const state=await desk.report();assert.deepEqual(state.manifest,manifest);
 const output=pathToFileURL(join(directory,'output')+'/');const result=await build({records:[next],manifest:state.manifest,revisions:state.revisions,output,now});
 assert(!result.html.includes('Private B'));assert(!(await readFile(new URL('feed.json',output),'utf8')).includes('Private B'));assert(!result.pages.get(entry.id).includes('Private B'));
 assert.equal(selectRelease([next],{manifest,revisions:[revision],now}).entries[0].answer,entry.answer);
 const released=await desk.release({entries:[{id:entry.id,digest:p.digest}],withdrawals:[],expectedManifest:state.manifestDigest,human});assert.equal(released.outcome,'created');
 assert.equal((await desk.report()).manifest.entries[0].digest,p.digest);
});
test('outdated baseline conflicts and preserves newer approval',async t=>{
 const {desk,entry,digest}=await setup(t);const a={...entry,status:'review',answer:'B'},b={...a,answer:'C'};delete a.approval;delete b.approval;
 const p=await desk.propose({entry:a,baselineDigest:digest}),q=await desk.propose({entry:b,baselineDigest:digest});
 assert.equal((await desk.decide(entry.id,p.digest,'keep',human)).outcome,'created');assert.equal((await desk.decide(entry.id,q.digest,'keep',human)).outcome,'conflict');
});
test('unknown incorporated rights block release; ordinary citations do not',()=>{
 const entry=publishedFixture();assert.deepEqual(releaseReadiness(entry),[]);
 assert(releaseReadiness({...entry,assets:[{path:'assets/example.webp'}]}).length);
 assert(releaseReadiness({...entry,dataReuse:[{source:'https://example.org/data',rights:'unknown'}]}).length);
 assert.deepEqual(releaseReadiness({...entry,assets:[{path:'assets/example.webp',rights:{basis:'CC0',source:'https://example.org',attribution:'Fixture'}}]}),[]);
});
test('working custom copy must match approved head while released snapshot remains A',()=>{
 const entry={...publishedFixture(),treatment:{kind:'custom',template:'crunch'}},fragment='<h1>A</h1>',digest=contentDigest(entry,{fragment});entry.approval.digest=digest;
 const revision={id:entry.id,entry,digest,fragment};
 assert.doesNotThrow(()=>verifyWorkingRevision(entry,revision,{fragment:'<h2 class="new">A</h2>',assetDigests:{}}));
 assert.throws(()=>verifyWorkingRevision(entry,revision,{fragment:'<h1>Unapproved</h1>',assetDigests:{}}),/working/);
});
test('multiple packets have exact digest-addressed private previews and no public sharing control',async t=>{
 const {desk,entry,digest,directory}=await setup(t);const a={...entry,status:'review',question:'Private question A?'},b={...a,question:'Private question B?'};delete a.approval;delete b.approval;
 const first=await desk.propose({entry:a,baselineDigest:digest}),second=await desk.propose({entry:b,baselineDigest:digest});
 const report=await desk.report(),output=pathToFileURL(join(directory,'review-output')+'/');
 await build({records:[entry],drafts:true,reviewReport:report,manifest:report.manifest,revisions:report.revisions,now,output});
 for(const packet of [first,second]){const path=`review/${entry.id}/${packet.digest}/index.html`,html=await readFile(new URL(path,output),'utf8');assert(html.includes(packet.packet.entry.question));assert(html.includes(`<title>${packet.packet.entry.question} | weird.stats</title>`));assert(!html.includes('data-share-url'));assert(html.includes('noindex,nofollow'));assert((await readFile(new URL('review.html',output),'utf8')).includes(`/review/${entry.id}/${packet.digest}/`));}
});
test('draft edits and shared editorial locks produce conflicts; rejecting a draft retires it',async t=>{
 const {desk,directory}=await setup(t);const entry=reviewFixture();const path=join(directory,'content/entries',entry.id+'.json');await writeFile(path,JSON.stringify(entry));
 const packet=await desk.propose({entry});await writeFile(path,JSON.stringify({...entry,answer:'Human edit after packet'}));
 assert.equal((await desk.decide(entry.id,packet.digest,'keep',human)).outcome,'conflict');
 await writeFile(path,JSON.stringify(entry));await writeFile(join(directory,'content/.editorial.lock'),'fixture lock');assert.equal((await desk.decide(entry.id,packet.digest,'reject',human)).outcome,'conflict');await rm(join(directory,'content/.editorial.lock'));
 assert.equal((await desk.decide(entry.id,packet.digest,'reject',human)).outcome,'created');assert.equal(JSON.parse(await readFile(path,'utf8')).status,'retired');
});
test('unknown rights block pinned build before it removes existing output',async t=>{
 const {directory}=await setup(t);const entry={...publishedFixture(),dataReuse:[{rights:{basis:'unknown'}}]},digest=contentDigest(entry);entry.approval.digest=digest;
 const output=pathToFileURL(join(directory,'safe-output')+'/');await mkdir(output);await writeFile(new URL('index.html',output),'Preserve previous output');
 await assert.rejects(build({records:[entry],revisions:[{id:entry.id,entry,digest}],manifest:{version:1,releasedAt:human.at,authorizedBy:human.by,entries:[{id:entry.id,digest}],withdrawals:[]},now,output}),/rights/);
 assert.equal(await readFile(new URL('index.html',output),'utf8'),'Preserve previous output');
});

test('review diffs show effective share questions when proposal uses a default',()=>{
 const entry={...publishedFixture(),id:'mail',treatment:{kind:'custom',template:'mail'}};
 const diff=packetDiff({entry:{...entry,share:{question:'The last 9 miles.'}}},{entry});
 assert.deepEqual(diff.claim.find(change=>change.field==='share').after,{question:'How does the mail reach the bottom of a canyon?',description:'A small question. A surprising discovery. Take a look at weird.stats.'});
});
test('correction packets share the bounded queue with drafts without counting the entry twice',async t=>{
 const {desk,entry,digest,directory}=await setup(t);await writeFile(join(directory,'content/editorial-settings.json'),JSON.stringify({limits:{unfinishedPackets:2}}));
 const draft=reviewFixture();await writeFile(join(directory,'content/entries',draft.id+'.json'),JSON.stringify(draft));
 assert.equal((await desk.propose({entry:draft})).outcome,'created');
 const b={...entry,status:'review',answer:'B'};delete b.approval;
 assert.equal((await desk.propose({entry:b,baselineDigest:digest})).outcome,'created');
 assert.equal((await desk.propose({entry:{...b,answer:'C'},baselineDigest:digest})).outcome,'deferred');
 const {createDesk}=await import('../scripts/candidates.mjs');assert.equal((await createDesk({directory}).report()).queue.count,2);
});
