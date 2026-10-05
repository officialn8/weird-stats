import {createHash, randomUUID} from 'node:crypto';
import {mkdir, readFile, readdir, writeFile, rename, rm, open} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {root, validate} from './content.mjs';

export const defaultLimits={investigationsPerRun:10,promotionsPerRun:2,unfinishedPackets:5};
const idPattern=/^[a-z][a-z0-9-]*$/;
const dispositions=['open','deferred','rejected','duplicate','closed'];
const forbidden=new Set(['approval','approvedBy','approvedAt','publishedAt','release','releaseManifest','authorizedBy','releasedAt']);
const result=(outcome,fields={})=>({outcome,...fields});
const text=(value,label)=>assert(typeof value==='string'&&value.trim(),`${label} is required`);
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().filter(key=>key!=='revision').map(key=>[key,stable(value[key])])):value;
const digest=value=>createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
export const claimFingerprint=claim=>digest(String(claim).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim());
export function normalizeLocator(value) {
 const url=new URL(value);assert(url.protocol==='https:','Source locators must use HTTPS');assert(!url.username&&!url.password,'Source locators cannot contain credentials');
 for(const key of [...url.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/i.test(key))url.searchParams.delete(key);
 url.searchParams.sort();url.pathname=url.pathname.replace(/\/+$/,'')||'/';return url.href;
}
export function assertDraftOnly(value,path='input') {
 if(!value||typeof value!=='object')return;
 for(const [key,item] of Object.entries(value)) {
  assert(!forbidden.has(key)&&!/^approvals?$/i.test(key)&&!/^release/i.test(key),`${path}.${key}: approval and release fields are forbidden in drafting commands`);
  assert(!(key==='status'&&item==='published'),`${path}.status: drafting commands cannot publish`);
  assertDraftOnly(item,`${path}.${key}`);
 }
}
async function readJSON(path) {try{return JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}}
async function jsonFiles(directory) {try{return (await readdir(directory)).filter(f=>f.endsWith('.json')).sort();}catch(error){if(error.code==='ENOENT')return [];throw error;}}
async function atomic(path,value) {await mkdir(resolve(path,'..'),{recursive:true});const temp=path+'.'+randomUUID()+'.tmp';try{await writeFile(temp,JSON.stringify(value,null,2)+'\n',{flag:'wx'});await rename(temp,path);}finally{await rm(temp,{force:true});}}
function revisioned(value){return {...value,revision:digest(value)};}
function checkId(id){assert(typeof id==='string'&&idPattern.test(id),'Use a stable lowercase letter/digit/hyphen ID');return id;}
function checkCandidate(input) {
 assertDraftOnly(input);checkId(input.id);text(input.claim,'claim');
 assert(Array.isArray(input.sources)&&input.sources.length,'Candidate needs source locators, even when not yet reachable');
 for(const source of input.sources) {
  normalizeLocator(source.url);text(source.locator,'Exact table, passage or experiment locator');
  assert(['unchecked','verified','unreachable'].includes(source.status),'Source status must be unchecked, verified or unreachable');
  if(source.status==='verified'){assert(/^\d{4}-\d{2}-\d{2}$/.test(source.checkedAt??'')&&new Date(source.checkedAt).toISOString().slice(0,10)===source.checkedAt,'Verified source needs a valid actual checkedAt date');}
 }
 for(const field of ['evidenceGaps','treatmentGaps'])assert(Array.isArray(input[field])&&input[field].every(gap=>typeof gap==='string'&&gap.trim()),`${field} must be a list of explanations`);
 if(input.entry){assert(['draft','review'].includes(input.entry.status),'Promoted entries must be draft or review');assert(input.entry.id===input.id,'Candidate and entry IDs must match');validate(input.entry);}
 for(const related of input.duplicates??[]) {checkId(related.id);text(related.reason,'Duplicate reason');assert(['candidate','entry'].includes(related.type),'Duplicate target must be candidate or entry');}
 for(const other of input.distinctFrom??[]) {checkId(other.id);text(other.reason,'Reason this source contains a different discovery');}
}

export function createDesk({directory=fileURLToPath(root),limits:limitOverrides={},clock=()=>new Date()}={}) {
 const base=resolve(directory), content=join(base,'content'), candidates=join(content,'candidates'), runs=join(content,'research-runs'), entries=join(content,'entries');
 const now=()=>clock().toISOString();
 const candidatePath=id=>join(candidates,checkId(id)+'.json'),runPath=id=>join(runs,checkId(id)+'.json');
 async function limits() {const config=await readJSON(join(content,'editorial-settings.json'));const value={...defaultLimits,...config?.limits,...limitOverrides};for(const [key,n]of Object.entries(value))assert(key in defaultLimits&&Number.isInteger(n)&&n>0,`Invalid editorial limit: ${key}`);return value;}
 async function all(directory) {return Promise.all((await jsonFiles(directory)).map(async file=>{const value=await readJSON(join(directory,file));assert(value&&file===value.id+'.json',`Record ID must match ${file}`);return value;}));}
 async function storedCandidate(id) {const candidate=await readJSON(candidatePath(id));if(candidate)checkCandidate(candidate);return candidate?revisioned(candidate):null;}
 async function storedRun(id) {const run=await readJSON(runPath(id));if(run){assertDraftOnly(run);assert(run.id===id&&Array.isArray(run.investigations)&&Array.isArray(run.promotions),'Invalid research checkpoint');}return run;}
 async function writeCandidate(candidate,expectedRevision) {
  const current=await storedCandidate(candidate.id);
  if((current?.revision??null)!==expectedRevision)return result('conflict',{id:candidate.id,revision:current?.revision,reason:'Candidate changed; reload and reconcile the human edits.'});
  const next=revisioned(candidate);await atomic(candidatePath(next.id),next);return result(current?'updated':'created',{id:next.id,revision:next.revision,candidate:next});
 }
 // All command writers share a short-lived lock. A crashed process leaves a visible lock;
 // do not silently steal it. Remove it only after confirming that writer is no longer running.
 async function mutate(operation) {
  await mkdir(content,{recursive:true});let lock;
  try{lock=await open(join(content,'.editorial.lock'),'wx');await lock.writeFile(JSON.stringify({pid:process.pid,at:now()}));}
  catch(error){if(error.code==='EEXIST')return result('conflict',{reason:'Another editorial writer (or interrupted lock) is present at content/.editorial.lock.'});throw error;}
  try{return await operation();}catch(error){return result('failed',{reason:error.message});}
  finally{await lock.close();await rm(join(content,'.editorial.lock'),{force:true});}
 }
 async function duplicatesFor(input) {
  const fingerprint=claimFingerprint(input.claim),found=[];
  const locators=new Set(input.sources.map(s=>normalizeLocator(s.url)+'|'+s.locator.toLowerCase().trim()));
  for(const other of await all(candidates)) {
   if(other.id===input.id)continue;checkCandidate(other);
   const sameClaim=claimFingerprint(other.claim)===fingerprint;
   const sameSource=other.sources.some(s=>locators.has(normalizeLocator(s.url)+'|'+s.locator.toLowerCase().trim()));
   if(sameClaim||sameSource&&!input.distinctFrom?.some(d=>d.id===other.id))found.push({type:'candidate',id:other.id,reason:sameClaim?'Same normalized claim':'Same normalized source and supporting locator',disposition:other.disposition??'open',dispositionReason:other.dispositionReason??''});
  }
  for(const other of await all(entries))if(other.id!==input.id&&[other.question,other.answer,other.title].some(v=>v&&claimFingerprint(v)===fingerprint))found.push({type:'entry',id:other.id,reason:'Claim matches an existing entry',disposition:other.status});
  for(const duplicate of input.duplicates??[])if(!found.some(d=>d.id===duplicate.id&&d.type===duplicate.type))found.push(duplicate);
  return found;
 }
 async function queue() {
  const candidateRows=await all(candidates);
  const closed=new Set(candidateRows.filter(c=>['closed','rejected','duplicate'].includes(c.disposition)).map(c=>c.id));
  const items=(await all(entries)).filter(e=>['draft','review'].includes(e.status)&&!closed.has(e.id));
  const packets=candidateRows.filter(c=>!closed.has(c.id));
  // A saved promotion reservation is part of the unfinished workload even if interrupted
  // just before its entry write. Count each entry ID once across records and reservations.
  const reservations=(await all(runs)).flatMap(r=>r.promotions??[]).filter(p=>p.state==='reserved'&&!closed.has(p.entryId));
  const proposalDirectory=join(content,'revisions/proposals'),decisionDirectory=join(content,'revisions/decisions');
  const proposals=await Promise.all((await jsonFiles(proposalDirectory)).map(file=>readJSON(join(proposalDirectory,file))));
  const decisions=await Promise.all((await jsonFiles(decisionDirectory)).map(file=>readJSON(join(decisionDirectory,file))));
  const pending=proposals.filter(p=>!decisions.some(d=>d.id===p.id&&d.digest===p.digest&&['keep','reject'].includes(d.decision)));
  // An entry with a packet occupies that packet's slot; distinct correction revisions
  // each consume capacity because each requires a separate human review.
  const covered=new Set(pending.map(p=>p.id));
  const ids=new Set([...items.map(e=>e.id),...reservations.map(p=>p.entryId)].filter(id=>!covered.has(id)));
  const entryRows=[...ids].sort().map(id=>{const entry=items.find(e=>e.id===id),candidate=packets.find(c=>c.id===id);return {id,status:entry?.status??'interrupted-promotion',treatmentGaps:candidate?.treatmentGaps??[],createdAt:candidate?.createdAt??null,ageDays:candidate?.createdAt?Math.max(0,Math.floor((clock().getTime()-Date.parse(candidate.createdAt))/86400000)):null};});
  const revisionRows=pending.map(p=>({id:p.id,digest:p.digest,status:'revision-review',createdAt:p.createdAt??null,ageDays:p.createdAt?Math.max(0,Math.floor((clock().getTime()-Date.parse(p.createdAt))/86400000)):null}));
  return {count:entryRows.length+revisionRows.length,entries:[...entryRows,...revisionRows]};
 }
 const api={
  startRun(id) {return mutate(async()=>{checkId(id);const existing=await storedRun(id);if(existing){if(!['active','completed'].includes(existing.status)){existing.attempts=[...(existing.attempts??[]),{finishedAt:existing.finishedAt,summary:existing.summary}];delete existing.finishedAt;delete existing.summary;existing.status='active';existing.events.push({at:now(),action:'resume'});await atomic(runPath(id),existing);return result('created',{id,run:existing,reason:'Resumed the existing run without resetting its budget.'});}return result('unchanged',{id,run:existing});}const run={id,startedAt:now(),status:'active',investigations:[],promotions:[],events:[]};await atomic(runPath(id),run);return result('created',{id,run});});},
  record(runId,input,expectedRevision=null,extra={}) {return mutate(async()=>{
   assertDraftOnly(extra);assert(Object.keys(extra).length===0,'Unsupported record options');checkCandidate(input);
   const run=await storedRun(runId);assert(run,'Start or resume a run before recording research');assert(run.status==='active','Completed research runs cannot be extended');
   const current=await storedCandidate(input.id);
   const identical=current&&expectedRevision===null&&digest(current.input)===digest(input);
   if(!identical&&(current?.revision??null)!==expectedRevision)return result('conflict',{id:input.id,revision:current?.revision,reason:'Candidate changed; reload before recording.'});
   if(!run.investigations.includes(input.id)){
    if(run.investigations.length>=(await limits()).investigationsPerRun)return result('deferred',{id:input.id,reason:'Investigation budget exhausted for this run. Resume retains the consumed budget.'});
    run.investigations.push(input.id);run.events.push({at:now(),action:'investigate',id:input.id});await atomic(runPath(runId),run);
   }
   if(identical){if(current.runIds.includes(runId))return result('unchanged',{id:current.id,revision:current.revision,candidate:current});const saved=await writeCandidate({...current,runIds:[...current.runIds,runId],updatedAt:now()},current.revision);return saved.outcome==='updated'?{...saved,outcome:'unchanged',reason:'Same input, recorded against this run’s investigation budget.'}:saved;}
   const candidate={...input,input,claimFingerprint:claimFingerprint(input.claim),sources:input.sources.map(s=>({...s,normalizedUrl:normalizeLocator(s.url)})),duplicates:await duplicatesFor(input),disposition:current?.disposition??'open',dispositionReason:current?.dispositionReason??'',createdAt:current?.createdAt??now(),updatedAt:now(),runIds:[...new Set([...(current?.runIds??[]),runId])]};
   const saved=await writeCandidate(candidate,expectedRevision);return saved.outcome==='updated'?{...saved,outcome:'created',reason:'Saved a new candidate revision.'}:saved;
  });},
  dispose(id,expectedRevision,disposition,reason,duplicates=[]) {return mutate(async()=>{
   assert(dispositions.includes(disposition),'Unknown disposition');text(reason,'Disposition reason');const current=await storedCandidate(id);assert(current,'Unknown candidate');
   if(current.revision!==expectedRevision)return result('conflict',{id,revision:current.revision,reason:'Candidate changed; reload before recording a disposition.'});
   for(const link of duplicates){checkId(link.id);text(link.reason,'Duplicate reason');assert(['candidate','entry'].includes(link.type),'Duplicate target must be candidate or entry');}
   if(disposition==='duplicate')assert(duplicates.length||current.duplicates.length,'A duplicate must link to its earlier candidate or entry');
   const saved=await writeCandidate({...current,disposition,dispositionReason:reason,duplicates:[...current.duplicates,...duplicates],updatedAt:now()},expectedRevision);
   return saved.outcome==='updated'?{...saved,outcome:'created',reason:'Recorded the disposition.'}:saved;
  });},
  promote(runId,id,expectedRevision) {return mutate(async()=>{
   const run=await storedRun(runId);assert(run,'Unknown run');const candidate=await storedCandidate(id);assert(candidate,'Unknown candidate');
   if(candidate.revision!==expectedRevision)return result('conflict',{id,revision:candidate.revision,reason:'Candidate changed; promotion did not overwrite it.'});
   const key=id+':'+expectedRevision;
   const promotionRun=(await all(runs)).find(r=>r.promotions.some(p=>p.key===key));
   if(promotionRun)assertDraftOnly(promotionRun);
   const prior=promotionRun?.promotions.find(p=>p.key===key);
   // Always re-check the on-disk proposal and entry, even on an idempotent retry.
   assertDraftOnly(candidate);const target=join(entries,id+'.json'),existing=await readJSON(target);if(existing)assertDraftOnly(existing);
   if(prior&&existing){if(digest(existing)!==prior.entryDigest)return result('conflict',{id,reason:'The entry changed after promotion. Preserve it and reconcile manually.'});if(prior.state!=='written'){prior.state='written';await atomic(runPath(promotionRun.id),promotionRun);}return result('unchanged',{id,revision:expectedRevision,path:`content/entries/${id}.json`});}
   assert(run.status==='active','Completed research runs cannot promote new work');
   if(existing)return result('conflict',{id,reason:'An entry already owns this ID; use the separate revision review flow.'});
   if(!run.investigations.includes(id))return result('deferred',{id,reason:'Record this investigation in this run before promotion.'});
   if(['closed','rejected','duplicate'].includes(candidate.disposition))return result('deferred',{id,reason:`Candidate is ${candidate.disposition}: ${candidate.dispositionReason}`});
   const duplicateLinks=await duplicatesFor(candidate);if(duplicateLinks.length)return result('deferred',{id,reason:'Resolve duplicate discoveries before promotion.',duplicates:duplicateLinks});
   if(candidate.evidenceGaps.length||candidate.sources.some(s=>s.status!=='verified'))return result('deferred',{id,reason:'Evidence is incomplete or a source is unreachable/unverified.',evidenceGaps:candidate.evidenceGaps});
   assert(candidate.entry,'Candidate needs a proposed entry before promotion');const entry=structuredClone(candidate.entry);assertDraftOnly(entry);
   if(candidate.treatmentGaps.length)entry.status='draft';validate(entry);
   if(!prior){const caps=await limits();if(run.promotions.length>=caps.promotionsPerRun)return result('deferred',{id,reason:'Promotion budget exhausted for this run.'});if((await queue()).count>=caps.unfinishedPackets)return result('deferred',{id,reason:'Unfinished review queue is full; finish or close existing packets first.'});
    run.promotions.push({key,entryId:id,candidateRevision:expectedRevision,entryDigest:digest(entry),state:'reserved',at:now()});await atomic(runPath(runId),run);
   }
   // Recheck the proposal after asynchronous queue reads and reservation writes.
   if((await storedCandidate(id)).revision!==expectedRevision)return result('conflict',{id,reason:'Candidate changed during promotion; the reserved checkpoint remains resumable.'});
   // Exclusive create never overwrites a simultaneous manual entry or a saved proposal.
   await mkdir(entries,{recursive:true});try{await writeFile(target,JSON.stringify(entry,null,2)+'\n',{flag:'wx'});}catch(error){if(error.code==='EEXIST')return result('conflict',{id,reason:'An entry appeared during promotion; it was not overwritten.'});throw error;}
   const owner=prior?promotionRun:run;owner.promotions.find(p=>p.key===key).state='written';owner.events.push({at:now(),action:'promote',id,revision:expectedRevision});await atomic(runPath(owner.id),owner);
   return result('created',{id,revision:expectedRevision,path:`content/entries/${id}.json`,status:entry.status});
  });},
  finish(runId,summary) {return mutate(async()=>{
   assertDraftOnly(summary);assert(summary&&['completed','partial','deferred','failed'].includes(summary.outcome),'Run outcome required');
   text(summary.note,'Honest run outcome note');for(const field of ['researchMinutes','reviewMinutes'])if(summary[field]!==undefined)assert(Number.isFinite(summary[field])&&summary[field]>=0,`${field} must be an observed nonnegative duration`);
   const run=await storedRun(runId);assert(run,'Unknown run');if(run.status!=='active')return digest(run.summary)===digest(summary)?result('unchanged',{id:runId,run}):result('conflict',{id:runId,reason:'Run already closed; its historical result was preserved.'});
   run.status=summary.outcome;run.finishedAt=now();run.summary=summary;await atomic(runPath(runId),run);return result('created',{id:runId,run});
  });},
  async report() {
   const caps=await limits(),rows=(await all(candidates)).map(c=>{checkCandidate(c);return revisioned(c);}),researchRuns=await all(runs),workload=await queue();
   return {outcome:'unchanged',limits:caps,queue:{...workload,limit:caps.unfinishedPackets},candidates:rows,runs:researchRuns,editorialGate:{requiredCompletedRuns:7,recordedCompletedRuns:researchRuns.filter(r=>r.status==='completed').length,assessment:'Recorded runs are not independent verification. Review actual yield, review time and backlog age before changing caps.'},asOf:now()};
  },
  createDraft(entry) {return mutate(async()=>{assertDraftOnly(entry);assert(entry.status==='draft','Scaffolder only creates private drafts');validate(entry);if((await queue()).count>=(await limits()).unfinishedPackets)return result('deferred',{id:entry.id,reason:'Unfinished review queue is full.'});await mkdir(entries,{recursive:true});try{await writeFile(join(entries,checkId(entry.id)+'.json'),JSON.stringify(entry,null,2)+'\n',{flag:'wx'});}catch(error){if(error.code==='EEXIST')return result('conflict',{id:entry.id,reason:'Entry already exists; no overwrite.'});throw error;}return result('created',{id:entry.id,path:`content/entries/${entry.id}.json`});});}
 };
 return api;
}

export async function main(args=process.argv.slice(2),desk=createDesk()) {
 const [command,...values]=args;let output;
 switch(command){
 case 'run': assert(values.length===1,'Usage: candidates run <stable-run-id>');output=await desk.startRun(values[0]);break;
 case 'record': assert(values.length>=2&&values.length<=3,'Usage: candidates record <run-id> <private-input.json> [expected-revision]');output=await desk.record(values[0],JSON.parse(await readFile(values[1],'utf8')),values[2]??null);break;
 case 'dispose': assert(values.length>=4&&values.length<=5,'Usage: candidates dispose <id> <expected-revision> <disposition> <reason> [duplicate-links.json]');output=await desk.dispose(...values.slice(0,4),values[4]?JSON.parse(await readFile(values[4],'utf8')):[]);break;
 case 'promote': assert(values.length===3,'Usage: candidates promote <run-id> <id> <expected-revision>');output=await desk.promote(...values);break;
 case 'finish': assert(values.length===2,'Usage: candidates finish <run-id> <summary.json>');output=await desk.finish(values[0],JSON.parse(await readFile(values[1],'utf8')));break;
 case 'list':case 'report': assert(values.length===0,'Usage: candidates report');output=await desk.report();break;
 default:throw new Error('Commands: run, record, list, dispose, promote, report, finish');
 }
 return output;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const output=await main();console.log(JSON.stringify(output,null,2));if(['failed','conflict'].includes(output.outcome))process.exitCode=1;}catch(error){console.error(JSON.stringify(result('failed',{reason:error.message})));process.exitCode=1;}}
