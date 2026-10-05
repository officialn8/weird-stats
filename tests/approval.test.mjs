import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {publishedFixture,reviewFixture} from './fixtures/entries.mjs';
import {contentDigest,selectRelease,csv} from '../scripts/content.mjs';
import {createReviewDesk,releaseReadiness,carryForward,verifyWorkingRevision,packetDiff} from '../scripts/review-packets.mjs';
import {build} from '../scripts/build.mjs';
import {renderShareImage} from '../scripts/share-images.mjs';
import {createDesk} from '../scripts/candidates.mjs';
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
 const {desk,entry,digest,manifest,revision,directory}=await setup(t);const next={...structuredClone(entry),status:'review',answer:'Private B',question:'Private B question?'};next.treatment.views[0].values[0].value=73;delete next.approval;delete next.publishedAt;
 const p=await desk.propose({entry:next,baselineDigest:digest});assert.equal((await desk.decide(entry.id,p.digest,'keep',human)).outcome,'created');
 const state=await desk.report();assert.deepEqual(state.manifest,manifest);
 const output=pathToFileURL(join(directory,'output')+'/');const result=await build({records:[next],manifest:state.manifest,revisions:state.revisions,output,now});
 assert(!result.html.includes('Private B'));assert(!(await readFile(new URL('feed.json',output),'utf8')).includes('Private B'));assert(!result.pages.get(entry.id).includes('Private B'));
 assert.equal(await readFile(new URL(`data/${entry.id}.csv`,output),'utf8'),csv(entry));assert.deepEqual(await readFile(new URL(`share/${entry.id}.png`,output)),renderShareImage(entry));
 assert.equal(selectRelease([next],{manifest,revisions:[revision],now}).entries[0].answer,entry.answer);
 const released=await desk.release({entries:[{id:entry.id,digest:p.digest}],withdrawals:[],expectedManifest:state.manifestDigest,human});assert.equal(released.outcome,'created');
 const after=await desk.report();assert.equal(after.manifest.entries[0].digest,p.digest);
 await build({records:[next],manifest:after.manifest,revisions:after.revisions,output,now});
 assert.equal(await readFile(new URL(`data/${entry.id}.csv`,output),'utf8'),csv(next));assert.deepEqual(await readFile(new URL(`share/${entry.id}.png`,output)),renderShareImage(next));assert.notDeepEqual(renderShareImage(entry),renderShareImage(next));
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
test('multiple packets have exact instance-addressed private previews and no public sharing control',async t=>{
 const {desk,entry,digest,directory}=await setup(t);const a={...entry,status:'review',question:'Private question A?'},b={...a,question:'Private question B?'};delete a.approval;delete b.approval;
 const first=await desk.propose({entry:a,baselineDigest:digest}),second=await desk.propose({entry:b,baselineDigest:digest});
 const report=await desk.report(),output=pathToFileURL(join(directory,'review-output')+'/');
 await build({records:[entry],drafts:true,reviewReport:report,manifest:report.manifest,revisions:report.revisions,now,output});
 for(const packet of [first,second]){const path=`review/${entry.id}/${packet.packetId}/index.html`,html=await readFile(new URL(path,output),'utf8');assert(html.includes(packet.packet.entry.question));assert(html.includes(`<title>${packet.packet.entry.question} | weird.stats</title>`));assert(!html.includes('data-share-url'));assert(html.includes('noindex,nofollow'));assert((await readFile(new URL('review.html',output),'utf8')).includes(`/review/${entry.id}/${packet.packetId}/`));}
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

test('revision cycles transfer one queue slot and preserve prior decisions',async t=>{
 const {desk,entry,digest,directory}=await setup(t);await writeFile(join(directory,'content/editorial-settings.json'),JSON.stringify({limits:{unfinishedPackets:1}}));
 let prior;
 for(let i=0;i<3;i++){
  const proposed={...entry,status:'review',answer:`Revision ${i}`};delete proposed.approval;
  const packet=await desk.propose({entry:proposed,baselineDigest:digest});assert.equal(packet.outcome,'created');
  assert.equal((await createDesk({directory}).report()).queue.count,1);
  if(prior){const old=(await desk.report()).packets.find(p=>p.packetId===prior.packetId);assert.equal(old.state,'superseded');assert.equal(old.decision.decision,'revise');assert.equal(old.superseded.by,packet.packetId);}
  assert.equal((await desk.decide(entry.id,packet.packetId,'revise',human)).outcome,'created');prior=packet;
 }
 assert.equal((await desk.close(entry.id,prior.packetId,human)).outcome,'created');assert.equal((await createDesk({directory}).report()).queue.count,0);
 const closed=(await desk.report()).packets.find(p=>p.packetId===prior.packetId);assert.equal(closed.state,'closed');assert.equal(closed.decision.decision,'revise');
});

test('same content can become review-ready and can be rebased without losing historical instances',async t=>{
 const {desk,entry,digest,directory}=await setup(t);
 const draft={...reviewFixture(),status:'draft'},path=join(directory,'content/entries',draft.id+'.json');await writeFile(path,JSON.stringify(draft));
 const first=await desk.propose({entry:draft});const ready={...draft,status:'review'};await writeFile(path,JSON.stringify(ready));
 const second=await desk.propose({entry:ready});assert.equal(first.digest,second.digest);assert.notEqual(first.packetId,second.packetId);assert.equal(second.outcome,'created');
 assert.equal((await desk.propose({entry:ready})).outcome,'unchanged');assert.equal((await desk.decide(draft.id,second.packetId,'keep',human)).outcome,'created');
 const a={...entry,status:'review',answer:'A replacement'},b={...a,answer:'B alternative'};delete a.approval;delete b.approval;
 const pa=await desk.propose({entry:a,baselineDigest:digest}),pb=await desk.propose({entry:b,baselineDigest:digest});
 assert.equal((await desk.decide(entry.id,pa.packetId,'keep',human)).outcome,'created');
 assert.equal((await desk.report()).packets.find(p=>p.packetId===pb.packetId).state,'superseded');
 const rebased=await desk.propose({entry:b,baselineDigest:pa.digest});assert.equal(rebased.outcome,'created');assert.equal(rebased.digest,pb.digest);assert.notEqual(rebased.packetId,pb.packetId);
 assert.equal((await desk.decide(entry.id,pb.digest,'keep',human)).outcome,'failed');
 assert.equal((await desk.decide(entry.id,rebased.packetId,'keep',human)).outcome,'created');
});

test('same-digest approval and repeated release preserve first approval and release provenance',async t=>{
 const {desk,entry,digest,directory,revision}=await setup(t);
 const original={...revision,release:{at:'2020-01-01T00:00:00Z',authorizedBy:'Original release'},provenance:{reference:'Original verified evidence'}};
 const path=join(directory,'content/revisions/approved',entry.id+'-'+digest+'.json');await writeFile(path,JSON.stringify(original));const bytes=await readFile(path,'utf8');
 const proposed={...entry,status:'review'};delete proposed.approval;delete proposed.publishedAt;
 const packet=await desk.propose({entry:proposed,baselineDigest:digest});assert.equal(packet.digest,digest);
 assert.equal((await desk.decide(entry.id,packet.packetId,'keep',human)).outcome,'created');assert.equal(await readFile(path,'utf8'),bytes);
 assert.deepEqual(JSON.parse(await readFile(join(directory,'content/entries',entry.id+'.json'),'utf8')),entry);
 const state=await desk.report();assert.equal((await desk.release({entries:state.manifest.entries,expectedManifest:state.manifestDigest,human})).outcome,'created');assert.equal(await readFile(path,'utf8'),bytes);
});

test('release must preserve public IDs and withdrawal notices until explicitly restored',async t=>{
 const {desk,entry,digest,directory,revision}=await setup(t);
 await writeFile(join(directory,'content/revisions/approved',entry.id+'-'+digest+'.json'),JSON.stringify({...revision,release:{at:'2020-01-01T00:00:00Z',authorizedBy:'Original release'}}));
 let state=await desk.report();assert.equal((await desk.release({entries:[],expectedManifest:state.manifestDigest,human})).outcome,'failed');assert.deepEqual((await desk.report()).manifest,state.manifest);
 const withdrawal={id:entry.id,reason:'Fixture withdrawal',authorizedBy:human.by,at:'2020-06-01'};
 assert.equal((await desk.release({entries:[],withdrawals:[withdrawal],expectedManifest:state.manifestDigest,human})).outcome,'created');
 state=await desk.report();assert.equal((await desk.release({entries:[],expectedManifest:state.manifestDigest,human})).outcome,'failed');
 const output=pathToFileURL(join(directory,'withdrawn')+'/');await build({records:[entry],manifest:state.manifest,revisions:state.revisions,output,now});
 assert((await readFile(new URL(`discoveries/${entry.id}/index.html`,output),'utf8')).includes('Fixture withdrawal'));await assert.rejects(readFile(new URL(`share/${entry.id}.png`,output)),{code:'ENOENT'});await assert.rejects(readFile(new URL(`data/${entry.id}.csv`,output)),{code:'ENOENT'});
 assert.equal((await desk.release({entries:[{id:entry.id,digest}],expectedManifest:state.manifestDigest,human})).outcome,'created');assert.deepEqual((await desk.report()).manifest.withdrawals,[]);
});

test('closed or rejected content can be explicitly resubmitted without replacing earlier decisions',async t=>{
 const {desk,entry,digest}=await setup(t);const proposed={...entry,status:'review',answer:'Unchanged proposed content'};delete proposed.approval;
 const first=await desk.propose({entry:proposed,baselineDigest:digest});await desk.decide(entry.id,first.packetId,'reject',human);
 const second=await desk.propose({entry:proposed,baselineDigest:digest});assert.equal(second.outcome,'created');assert.equal(second.digest,first.digest);assert.notEqual(second.packetId,first.packetId);
 await desk.close(entry.id,second.packetId,human);const third=await desk.propose({entry:proposed,baselineDigest:digest});assert.equal(third.outcome,'created');assert.notEqual(third.packetId,second.packetId);
 const packets=(await desk.report()).packets;assert.equal(packets.find(p=>p.packetId===first.packetId).decision.decision,'reject');assert.equal(packets.find(p=>p.packetId===second.packetId).state,'closed');
});
