import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {readFile,readdir,mkdir,rm,open} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {root,validate,contentDigest,fragmentEditorialContent,selectRelease,esc} from './content.mjs';
import {createDesk} from './candidates.mjs';
import {shareCopy} from './share-copy.mjs';
import {entryAssets} from './assets.mjs';
import {readJSON as json,atomicWrite} from './editorial-io.mjs';
const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const text=(v,label)=>assert(typeof v==='string'&&v.trim(),`${label} required`);
const id=v=>{assert(/^[a-z][a-z0-9-]*$/.test(v),'Invalid ID');return v;};
const digestId=v=>{assert(/^[a-f0-9]{64}$/.test(v),'Invalid digest');return v;};
async function rows(path){try{return await Promise.all((await readdir(path)).filter(f=>f.endsWith('.json')).sort().map(f=>json(join(path,f))));}catch(e){if(e.code==='ENOENT')return [];throw e;}}
const atomic=(path,value)=>atomicWrite(path,()=>typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
function humanInput(human){text(human?.by,'Actual human identity');text(human?.inputReference,'Actual human input reference');text(human?.note,'Human decision note');assert(/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(human?.at??'')&&Number.isFinite(Date.parse(human.at)),'Human decision timestamp required');}
export function releaseReadiness(entry){
 const gaps=[];const rights=(value,label)=>{if(!value||typeof value!=='object'||!value.basis?.trim()||/unknown|pending|unverified/i.test(value.basis)||!value.source?.trim()||!value.attribution?.trim())gaps.push(`${label}: declared rights basis, source and attribution required`);};
 for(const path of entryAssets(entry)){const asset=entry.assets?.find(a=>a.path===path);rights(asset?.rights,path);}
 for(const [i,reuse] of (entry.dataReuse??[]).entries())rights(reuse.rights,`Reused dataset ${i+1}`);
 return gaps;
}
export function verifyWorkingRevision(entry,revision,{fragment='',assetDigests={}}={}){
 assert(revision&&entry.approval?.digest===revision.digest&&contentDigest(entry,{fragment,assetDigests})===revision.digest,`${entry.id}: working fragment, record or assets differ from approved revision`);
}
export function carryForward({entry,current=entry,fragment='',currentFragment=fragment,assetDigests={},evidence}){
 assert(evidence?.reference&&evidence?.authorizedBy&&Number.isFinite(Date.parse(evidence?.releasedAt)),'Verified baseline evidence required; migration cannot infer approval');
 assert(entry.approval?.by&&entry.approval?.at,'Original approval provenance required');
 const baseline=structuredClone(entry);baseline.publishedAt=evidence.releasedAt;const digest=contentDigest(baseline,{fragment,assetDigests});baseline.approval.digest=digest;
 const revision={id:entry.id,digest,entry:baseline,fragment,assetDigests,release:{at:evidence.releasedAt,authorizedBy:evidence.authorizedBy},provenance:evidence};
 let proposal=null;if(contentDigest(current,{fragment:currentFragment,assetDigests})!==digest){const proposed=structuredClone(current);proposed.status='review';delete proposed.approval;delete proposed.publishedAt;proposal={id:entry.id,entry:proposed,fragment:currentFragment,assetDigests,baselineDigest:digest,digest:contentDigest(proposed,{fragment:currentFragment,assetDigests}),state:'pending',origin:'Unmatched local changes retained during baseline migration'};}
 return {revision,proposal};
}
export async function loadReleaseState(directory=fileURLToPath(root)){
 const manifest=await json(join(directory,'content/releases/current.json'));assert(manifest,'Verified release manifest missing; production cannot use status-only selection');
 return {manifest,revisions:await rows(join(directory,'content/revisions/approved'))};
}
export function createReviewDesk({directory=fileURLToPath(root),clock=()=>new Date()}={}){
 const base=resolve(directory),content=join(base,'content'),approved=join(content,'revisions/approved'),proposals=join(content,'revisions/proposals'),decisions=join(content,'revisions/decisions');
 const entryPath=v=>join(content,'entries',id(v)+'.json');const packetPath=(v,d)=>join(proposals,id(v)+'-'+digestId(d)+'.json');
 const approvedPath=(v,d)=>join(approved,id(v)+'-'+digestId(d)+'.json');const decisionPath=(v,d)=>join(decisions,id(v)+'-'+digestId(d)+'.json');
 async function subject(entry,fragment){const assetDigests=Object.fromEntries(await Promise.all(entryAssets(entry).map(async path=>[path,hash(await readFile(join(base,'public',path)))])));if(entry.treatment.kind==='custom'&&fragment===undefined)fragment=await readFile(join(base,'src/exhibits',entry.treatment.template+'.html'),'utf8');return {fragment:fragment??'',assetDigests};}
 async function mutate(operation){await mkdir(content,{recursive:true});let lock;try{lock=await open(join(content,'.editorial.lock'),'wx');await lock.writeFile(JSON.stringify({pid:process.pid,at:clock().toISOString()}));}catch(e){if(e.code==='EEXIST')return {outcome:'conflict',reason:'Another editorial writer or interrupted lock is present.'};throw e;}try{return await operation();}catch(e){return {outcome:'failed',reason:e.message};}finally{await lock.close();await rm(join(content,'.editorial.lock'),{force:true});}}
 const key=packet=>packet.packetId??packet.digest;
 const decisionFor=(packet,recorded)=>recorded.find(d=>d.id===packet.id&&(d.packetId??d.digest)===key(packet));
 const active=(packet,recorded)=>!packet.superseded&&!packet.closed&&!['keep','reject'].includes(decisionFor(packet,recorded)?.decision);
 async function findPacket(entryId,reference){
  id(entryId);digestId(reference);
  const packets=(await rows(proposals)).filter(p=>p.id===entryId);
  const exact=packets.find(p=>key(p)===reference);if(exact)return exact;
  const matches=packets.filter(p=>p.digest===reference);
  assert(matches.length<=1,'Content digest identifies multiple packet instances; use packetId');return matches[0];
 }
 async function supersede(packet,by,reason){await atomic(packetPath(packet.id,key(packet)),{...packet,superseded:{by,reason,at:clock().toISOString()}});}
 const api={
 async report(){
  const {manifest,revisions}=await loadReleaseState(base),packets=await rows(proposals),recorded=await rows(decisions),entries=await rows(join(content,'entries'));
  return {manifest,manifestDigest:hash(manifest),revisions,packets:packets.map(p=>{
   const baseline=revisions.find(r=>r.id===p.id&&r.digest===p.baselineDigest),decision=decisionFor(p,recorded),current=entries.find(e=>e.id===p.id)??null;
   let validation=[];try{validate({...p.entry,status:'review'});}catch(e){validation=[e.message];}
   return {...p,packetId:key(p),state:p.superseded?'superseded':p.closed?'closed':decision?.decision??p.state??'pending',decision,conflict:(current?.approval?.digest??null)!==p.baselineDigest||Boolean(p.workingRecordHash&&hash(current)!==p.workingRecordHash),readiness:[...validation,...releaseReadiness(p.entry)],changes:packetDiff(baseline,p)};
  }),unpacketized:entries.filter(e=>['draft','review'].includes(e.status)&&!packets.some(p=>p.id===e.id&&active(p,recorded)))};
 },
 propose({entry,fragment,baselineDigest=null,supersedes=[]}){return mutate(async()=>{
  validate(entry);assert(['draft','review'].includes(entry.status),'Proposals must be private drafts or review records');assert(!entry.approval&&!entry.release,'Proposal cannot carry approval or release');
  const current=await json(entryPath(entry.id));if((current?.approval?.digest??null)!==baselineDigest)return {outcome:'conflict',reason:'Approval baseline changed; reload and reconcile.'};
  const material=await subject(entry,fragment),digest=contentDigest(entry,material),workingRecordHash=hash(current),packets=(await rows(proposals)).filter(p=>p.id===entry.id),recorded=await rows(decisions);
  const context={digest,baselineDigest,workingRecordHash,status:entry.status};
  const sameContext=p=>p.digest===digest&&p.baselineDigest===baselineDigest&&p.workingRecordHash===workingRecordHash&&p.entry.status===entry.status;
  const existing=packets.find(p=>active(p,recorded)&&sameContext(p)&&decisionFor(p,recorded)?.decision!=='revise');
  if(existing&&!supersedes.length){
   // Finish any interrupted supersession writes from this already-saved instance.
   for(const old of packets.filter(p=>(existing.supersedes??[]).includes(key(p))&&active(p,recorded)))await supersede(old,key(existing),'Replacement packet reconciles the requested revision or changed working baseline.');
   return {outcome:'unchanged',digest,packetId:key(existing),packet:existing};
  }
  assert(Array.isArray(supersedes),'supersedes must be packet IDs');
  for(const reference of supersedes)assert(packets.some(p=>key(p)===reference&&active(p,recorded)),'Only active packets for this entry can be superseded');
  const replaced=packets.filter(p=>active(p,recorded)&&(supersedes.includes(key(p))||decisionFor(p,recorded)?.decision==='revise'||p.baselineDigest!==baselineDigest||(p.workingRecordHash&&p.workingRecordHash!==workingRecordHash)||(p.digest===digest&&p.entry.status!==entry.status)));
  const workload=await createDesk({directory:base,clock}).report(),replacesSlot=replaced.length||workload.queue.entries.some(row=>row.id===entry.id&&!row.digest);
  if(!replacesSlot&&workload.queue.count>=workload.queue.limit)return {outcome:'deferred',reason:'Unfinished review queue is full; finish or close an existing packet.'};
  // The content digest identifies approved content; packetId identifies this review context.
  // Preserve every historical decision even when the same content is reviewed again.
  const supersededIds=replaced.map(key).sort(),packetId=hash({...context,supersedes:supersededIds,instance:randomUUID()});
  const path=packetPath(entry.id,packetId);
  const packet={id:entry.id,packetId,digest,baselineDigest,entry,...material,state:'pending',createdAt:clock().toISOString(),workingRecordHash,supersedes:supersededIds};
  await atomic(path,packet);
  for(const old of replaced)await supersede(old,packetId,'Replacement packet reconciles the requested revision or changed working baseline.');
  return {outcome:'created',digest,packetId,packet};
 });},
 decide(entryId,reference,decision,human){return mutate(async()=>{
  humanInput(human);assert(['keep','revise','reject'].includes(decision),'Decision must be keep, revise or reject');const packet=await findPacket(entryId,reference);assert(packet,'Unknown review packet');
  const {digest}=packet,packetId=key(packet);assert(contentDigest(packet.entry,packet)===digest,'Review packet changed after review');
  if(!active(packet,await rows(decisions))||await json(decisionPath(entryId,packetId)))return {outcome:'conflict',reason:'This packet is closed or already decided; prepare a new review instance.'};
  const current=await json(entryPath(entryId));
  if(decision!=='reject'){
   if(packet.workingRecordHash&&hash(current)!==packet.workingRecordHash)return {outcome:'conflict',reason:'Working record changed after the packet was prepared; reconcile it.'};
   if((current?.approval?.digest??null)!==packet.baselineDigest)return {outcome:'conflict',reason:'Approval baseline changed; reconcile the proposal.'};
  }
  if(decision==='keep'){
   validate({...packet.entry,status:'review'});assert(packet.entry.status==='review','Incomplete draft cannot be approved');const gaps=releaseReadiness(packet.entry);assert(!gaps.length,gaps.join('; '));
   const material=await subject(packet.entry,packet.fragment);assert(contentDigest(packet.entry,material)===digest,'Assets changed after review');
   const stored=await json(approvedPath(entryId,digest));
   if(stored)assert(stored.id===entryId&&stored.digest===digest&&stored.entry.approval?.digest===digest&&contentDigest(stored.entry,stored)===digest,'Existing approved snapshot does not match its identity');
   const entry=stored?.entry??{...packet.entry,status:'published',publishedAt:human.at,approval:{by:human.by,at:human.at.slice(0,10),digest,inputReference:human.inputReference,note:human.note}};
   if(!stored)await atomic(approvedPath(entryId,digest),{id:entryId,digest,entry,...material});
   if(entry.treatment.kind==='custom')await atomic(join(base,'src/exhibits',entry.treatment.template+'.html'),stored?.fragment??material.fragment);
   await atomic(entryPath(entryId),entry);
  }else if(!packet.baselineDigest&&current&&['draft','review'].includes(current.status)){
   const material=await subject(current,packet.fragment);
   // Closing a stale packet must never retire or overwrite a newer working draft.
   if((!packet.workingRecordHash||hash(current)===packet.workingRecordHash)&&contentDigest(current,material)===digest)await atomic(entryPath(entryId),{...current,status:decision==='reject'?'retired':'draft'});
  }
  if(decision==='reject'&&(!current||current.status==='retired'||(!packet.baselineDigest&&(!packet.workingRecordHash||hash(current)===packet.workingRecordHash)))){
   const path=join(content,'candidates',entryId+'.json'),candidate=await json(path);if(candidate){const next={...candidate,disposition:'rejected',dispositionReason:human.note,updatedAt:human.at};delete next.revision;await atomic(path,next);}
  }
  await atomic(decisionPath(entryId,packetId),{id:entryId,packetId,digest,decision,human});
  if(decision==='keep')for(const sibling of await rows(proposals))if(sibling.id===entryId&&key(sibling)!==packetId&&active(sibling,await rows(decisions)))await supersede(sibling,packetId,'A sibling review instance was approved; reconcile against that approved baseline.');
  return {outcome:'created',id:entryId,packetId,digest,decision};
 });},
 close(entryId,reference,human){return mutate(async()=>{
  humanInput(human);const packet=await findPacket(entryId,reference);assert(packet,'Unknown review packet');
  if(!active(packet,await rows(decisions)))return {outcome:'unchanged',packetId:key(packet)};
  await atomic(packetPath(entryId,key(packet)),{...packet,closed:{human}});return {outcome:'created',packetId:key(packet)};
 });},
 release({entries,withdrawals=[],expectedManifest,human}){return mutate(async()=>{
  humanInput(human);const state=await loadReleaseState(base);if(hash(state.manifest)!==expectedManifest)return {outcome:'conflict',reason:'Release manifest changed; review the new release baseline.'};
  const nextIds=new Set([...entries,...withdrawals].map(pin=>pin.id));
  for(const previous of [...state.manifest.entries,...state.manifest.withdrawals])assert(nextIds.has(previous.id),`${previous.id}: previously public IDs must remain pinned or explicitly withdrawn; retain withdrawal notices until restored`);
  const manifest={version:1,releasedAt:human.at,authorizedBy:human.by,inputReference:human.inputReference,note:human.note,entries,withdrawals},selected=selectRelease([],{...state,manifest,now:clock()});
  for(const entry of selected.entries){assert(!releaseReadiness(entry).length,releaseReadiness(entry).join('; '));const revision=selected.revisions.get(entry.id),material=await subject(entry,revision.fragment);assert(contentDigest(entry,material)===revision.digest,'Released asset identity changed');}
  // Record the first release only. Re-release must not rewrite historical provenance.
  for(const revision of selected.revisions.values())if(!revision.release)await atomic(approvedPath(revision.id,revision.digest),{...revision,release:{at:human.at,authorizedBy:human.by,inputReference:human.inputReference}});
  await atomic(join(content,'releases/current.json'),manifest);return {outcome:'created',manifest};
 });}

 };return api;
}
export function packetDiff(baseline,proposal){const before=baseline?.entry?{...baseline.entry,share:shareCopy(baseline.entry)}:{};const after={...proposal.entry,share:shareCopy(proposal.entry)};const fields={claim:['title','question','answer','explanation','qualification','whyCare','guess','share'],data:['treatment','dataReuse'],sources:['evidence','assets']};return Object.fromEntries(Object.entries(fields).map(([group,keys])=>[group,[...keys.filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key])).map(key=>({field:key,before:before[key]??null,after:after[key]??null})),...(group==='claim'&&JSON.stringify(fragmentEditorialContent(baseline?.fragment))!==JSON.stringify(fragmentEditorialContent(proposal.fragment))?[{field:'custom fragment',before:fragmentEditorialContent(baseline?.fragment),after:fragmentEditorialContent(proposal.fragment)}]:[])]]));}
export function reviewIndex(report){return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Private editorial review</title><style>body{max-width:70rem;margin:3rem auto;padding:1rem;font:18px system-ui}pre{white-space:pre-wrap;overflow-wrap:anywhere}article{border-top:1px solid;padding:1rem 0}</style><h1>Private editorial review</h1><p>Local only. Approval and release are separate human decisions. <a href="/">Preview collection</a></p>${report.packets.filter(p=>!['reject','keep','superseded','closed'].includes(p.state)).map(p=>`<article><h2>${esc(p.entry.title)}</h2><p>${esc(p.state)} · ${p.conflict?'Baseline conflict':'Baseline unchanged'}</p><p>Packet: ${esc(p.packetId??p.digest)} · Content: ${esc(p.digest)}</p><p>Readiness: ${esc(p.readiness.join('; ')||'Structurally ready; factual and visual judgment still required')}</p>${p.entry.status==='review'?`<a href="/review/${esc(p.id)}/${esc(p.packetId??p.digest)}/">Preview exact revision</a>`:'<p>Complete this draft before preview.</p>'}<pre>${esc(JSON.stringify(p.changes,null,2))}</pre></article>`).join('')}${report.unpacketized.map(e=>`<article><h2>${esc(e.title)}</h2><p>${esc(e.status)} — prepare an exact revision packet before recording a decision.</p>${e.status==='review'?`<a href="/discoveries/${esc(e.id)}/">Preview discovery</a>`:''}</article>`).join('')}</html>`;}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [command,...args]=process.argv.slice(2),desk=createReviewDesk();let result;
 if(command==='report')result=await desk.report();else if(command==='propose')result=await desk.propose(JSON.parse(await readFile(args[0],'utf8')));else if(command==='decide')result=await desk.decide(args[0],args[1],args[2],JSON.parse(await readFile(args[3],'utf8')));else if(command==='close')result=await desk.close(args[0],args[1],JSON.parse(await readFile(args[2],'utf8')));else if(command==='release')result=await desk.release(JSON.parse(await readFile(args[0],'utf8')));else throw new Error('Use report | propose PACKET.json | decide ID PACKET_ID keep|revise|reject HUMAN.json | close ID PACKET_ID HUMAN.json | release RELEASE.json');console.log(JSON.stringify(result,null,2));if(['failed','conflict'].includes(result.outcome))process.exitCode=1;
}
