import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDesk, normalizeLocator} from '../scripts/candidates.mjs';
import {reviewFixture} from './fixtures/entries.mjs';
async function setup(t,limits={}) {
 const root=await mkdtemp(join(tmpdir(),'weird-candidates-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await mkdir(join(root,'content/entries'),{recursive:true});
 const desk=createDesk({directory:root,limits,clock:()=>new Date('2020-06-01T12:00:00Z')});
 await desk.startRun('fixture-run');return {root,desk};
}
function candidate(id='fictional-discovery') {return {id,claim:`Fixture claim ${id}`,sources:[{url:'https://example.org/table?utm_source=test',locator:`Table ${id}`,status:'verified',checkedAt:'2020-06-01'}],evidenceGaps:[],treatmentGaps:[],entry:{...reviewFixture(),id},notes:'Fictional tests only.'};}
test('resuming one run preserves budgets and promotion is idempotent',async t=>{
 const {desk}=await setup(t,{investigationsPerRun:1,promotionsPerRun:1,unfinishedPackets:5});
 const c=await desk.record('fixture-run',candidate());assert.equal(c.outcome,'created');
 assert.equal((await desk.startRun('fixture-run')).outcome,'unchanged');
 assert.equal((await desk.record('fixture-run',candidate('second'))).outcome,'deferred');
 const p=await desk.promote('fixture-run',c.id,c.revision);assert.equal(p.outcome,'created');
 assert.equal((await desk.promote('fixture-run',c.id,c.revision)).outcome,'unchanged');
 const report=await desk.report();assert.equal(report.runs[0].investigations.length,1);assert.equal(report.runs[0].promotions.length,1);assert.equal(report.queue.count,1);
});
test('a human edit conflicts instead of being overwritten',async t=>{
 const {root,desk}=await setup(t);const c=await desk.record('fixture-run',candidate());
 const path=join(root,'content/candidates',c.id+'.json');const current=JSON.parse(await readFile(path,'utf8'));current.notes='Human correction';await writeFile(path,JSON.stringify(current));
 assert.equal((await desk.dispose(c.id,c.revision,'rejected','Familiar')).outcome,'conflict');
 assert.equal((await desk.promote('fixture-run',c.id,c.revision)).outcome,'conflict');
 assert.equal(JSON.parse(await readFile(path,'utf8')).notes,'Human correction');
});
test('unreachable evidence, blocked treatments and full queues are honest',async t=>{
 const {desk}=await setup(t,{unfinishedPackets:1});const unreachable=candidate();unreachable.sources[0].status='unreachable';
 let c=await desk.record('fixture-run',unreachable);assert.equal((await desk.promote('fixture-run',c.id,c.revision)).outcome,'deferred');
 const blocked=candidate('blocked');blocked.treatmentGaps=['Needs an unbuilt visual form'];blocked.entry.status='draft';c=await desk.record('fixture-run',blocked);assert.equal((await desk.promote('fixture-run',c.id,c.revision)).outcome,'created');
 c=await desk.record('fixture-run',candidate('third'));assert.equal((await desk.promote('fixture-run',c.id,c.revision)).outcome,'deferred');
 const report=await desk.report();assert.equal(report.queue.count,1);assert.equal(report.queue.entries[0].treatmentGaps.length,1);
});
test('duplicate identities link to rejection before promotion',async t=>{
 const {desk}=await setup(t);let first=await desk.record('fixture-run',candidate());first=await desk.dispose(first.id,first.revision,'rejected','Already familiar');
 const other=candidate('rephrased');other.claim=candidate().claim.toUpperCase()+'!';const c=await desk.record('fixture-run',other);
 assert.equal(c.outcome,'created');assert.equal(c.candidate.duplicates[0].id,first.id);assert.equal(c.candidate.duplicates[0].disposition,'rejected');
 assert.equal((await desk.promote('fixture-run',c.id,c.revision)).outcome,'deferred');
 assert.equal(normalizeLocator('https://EXAMPLE.org/table/?b=2&utm_source=x&a=1#p3'),'https://example.org/table?a=1&b=2#p3');
});
test('approval and release fields are rejected on new and resumed records',async t=>{
 const {root,desk}=await setup(t);const bad=candidate();bad.entry.approval={by:'Robot'};assert.equal((await desk.record('fixture-run',bad)).outcome,'failed');
 const c=await desk.record('fixture-run',candidate());const file=join(root,'content/candidates',c.id+'.json');const stored=JSON.parse(await readFile(file,'utf8'));stored.entry.status='published';await writeFile(file,JSON.stringify(stored));
 assert.equal((await desk.promote('fixture-run',c.id,c.revision)).outcome,'failed');
 assert.equal((await desk.record('fixture-run',candidate('bad-release'),null,{release:{authorizedBy:'Robot'}})).outcome,'failed');
});

test('partial runs resume their same budget and promotion identity crosses runs',async t=>{
 const {desk}=await setup(t,{investigationsPerRun:1});const c=await desk.record('fixture-run',candidate());
 await desk.finish('fixture-run',{outcome:'partial',note:'Fictional source interruption'});
 assert.equal((await desk.startRun('fixture-run')).run.status,'active');
 assert.equal((await desk.record('fixture-run',candidate('another'))).outcome,'deferred');
 assert.equal((await desk.promote('fixture-run',c.id,c.revision)).outcome,'created');
 await desk.startRun('next-run');assert.equal((await desk.promote('next-run',c.id,c.revision)).outcome,'unchanged');
});
test('rejected and closed packets stop consuming the unfinished queue',async t=>{
 const {desk}=await setup(t,{unfinishedPackets:1});const c=await desk.record('fixture-run',candidate());await desk.promote('fixture-run',c.id,c.revision);
 await desk.dispose(c.id,c.revision,'rejected','Creator rejected this fictional packet');assert.equal((await desk.report()).queue.count,0);
});
test('an interrupted promotion recovers without duplication and preserves later entry edits',async t=>{
 const {root,desk}=await setup(t);const c=await desk.record('fixture-run',candidate());await desk.promote('fixture-run',c.id,c.revision);
 const path=join(root,'content/research-runs/fixture-run.json');const run=JSON.parse(await readFile(path,'utf8'));run.promotions[0].state='reserved';await writeFile(path,JSON.stringify(run));
 assert.equal((await desk.promote('fixture-run',c.id,c.revision)).outcome,'unchanged');assert.equal((await desk.report()).runs[0].promotions[0].state,'written');
 const entryPath=join(root,'content/entries',c.id+'.json');const entry=JSON.parse(await readFile(entryPath,'utf8'));entry.question='Human revision';await writeFile(entryPath,JSON.stringify(entry));
 assert.equal((await desk.promote('fixture-run',c.id,c.revision)).outcome,'conflict');assert.equal(JSON.parse(await readFile(entryPath,'utf8')).question,'Human revision');
});
test('full queue also blocks manual scaffold and command writers respect an active lock',async t=>{
 const {root,desk}=await setup(t,{unfinishedPackets:1});const c=await desk.record('fixture-run',candidate());await desk.promote('fixture-run',c.id,c.revision);
 assert.equal((await desk.createDraft({...reviewFixture(),id:'scaffold',status:'draft'})).outcome,'deferred');
 await writeFile(join(root,'content/.editorial.lock'),'fictional active writer');assert.equal((await desk.startRun('concurrent')).outcome,'conflict');
});
test('an unchanged candidate consumes its new run investigation before next-day promotion',async t=>{
 const {desk}=await setup(t,{promotionsPerRun:1});const first=await desk.record('fixture-run',candidate('first'));await desk.promote('fixture-run',first.id,first.revision);
 const saved=await desk.record('fixture-run',candidate());assert.equal((await desk.promote('fixture-run',saved.id,saved.revision)).outcome,'deferred');
 await desk.startRun('next-run');const again=await desk.record('next-run',candidate());assert.equal(again.outcome,'unchanged');assert(again.candidate.runIds.includes('next-run'));
 assert.equal((await desk.promote('next-run',again.id,again.revision)).outcome,'created');assert.equal((await desk.report()).runs.find(r=>r.id==='next-run').investigations.length,1);
 assert.equal((await desk.startRun(undefined)).outcome,'failed');
});

test('exclusive atomic creation hides partial writes and preserves a competing final file',async t=>{
 const {atomicCreate}=await import('../scripts/editorial-io.mjs');const {root}=await setup(t),path=join(root,'content/entries/atomic.json');
 await assert.rejects(atomicCreate(path,()=>'{"complete":true}',{write:async(temp)=>{await writeFile(temp,'{"partial":');throw new Error('Injected interrupted write');}}),/interrupted/);
 await assert.rejects(readFile(path),{code:'ENOENT'});
 await atomicCreate(path,()=>'{"complete":true}');assert.deepEqual(JSON.parse(await readFile(path,'utf8')),{complete:true});
 await assert.rejects(atomicCreate(path,()=>'{"overwrite":true}'),{code:'EEXIST'});assert.deepEqual(JSON.parse(await readFile(path,'utf8')),{complete:true});
 const race=join(root,'content/entries/race.json');const {link}=await import('node:fs/promises');
 await assert.rejects(atomicCreate(race,()=>'{"automation":true}',{install:async(temp,target)=>{await writeFile(target,'{"human":true}',{flag:'wx'});await link(temp,target);}}),{code:'EEXIST'});
 assert.deepEqual(JSON.parse(await readFile(race,'utf8')),{human:true});
});

test('reserved promotion retries absent final JSON; legacy corrupt JSON fails closed',async t=>{
 const {root,desk}=await setup(t);const c=await desk.record('fixture-run',candidate());await desk.promote('fixture-run',c.id,c.revision);
 const path=join(root,'content/research-runs/fixture-run.json'),run=JSON.parse(await readFile(path,'utf8'));run.promotions[0].state='reserved';await writeFile(path,JSON.stringify(run));
 const final=join(root,'content/entries',c.id+'.json');await rm(final);
 assert.equal((await desk.promote('fixture-run',c.id,c.revision)).outcome,'created');assert.equal((await desk.report()).runs[0].promotions.length,1);assert.equal((await desk.report()).runs[0].promotions[0].state,'written');
 await writeFile(final,'{"legacy-partial":');assert.equal((await desk.promote('fixture-run',c.id,c.revision)).outcome,'failed');assert.equal(await readFile(final,'utf8'),'{"legacy-partial":');
});
