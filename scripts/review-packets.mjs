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
   const firstRelease=stored?null:(await rows(approved)).filter(r=>r.id===entryId&&r.release?.authorizedBy&&Number.isFinite(Date.parse(r.release.at))).sort((a,b)=>Date.parse(a.release.at)-Date.parse(b.release.at))[0]?.release.at;
   const publishedAt=firstRelease??(packet.baselineDigest?current?.publishedAt:null)??human.at;
   const entry=stored?.entry??{...packet.entry,status:'published',publishedAt,approval:{by:human.by,at:human.at.slice(0,10),digest,inputReference:human.inputReference,note:human.note}};
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
export function packetDiff(baseline,proposal){const before=baseline?.entry?{...baseline.entry,share:shareCopy(baseline.entry)}:{};const after={...proposal.entry,share:shareCopy(proposal.entry)};const fields={claim:['title','format','question','answer','explanation','qualification','whyCare','guess','share'],data:['treatment','dataReuse'],sources:['evidence','assets']};return Object.fromEntries(Object.entries(fields).map(([group,keys])=>[group,[...keys.filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key])).map(key=>({field:key,before:before[key]??null,after:after[key]??null})),...(group==='claim'&&JSON.stringify(fragmentEditorialContent(baseline?.fragment))!==JSON.stringify(fragmentEditorialContent(proposal.fragment))?[{field:'custom fragment',before:fragmentEditorialContent(baseline?.fragment),after:fragmentEditorialContent(proposal.fragment)}]:[])]]));}
export function reviewIndex(report) {
 const pending=report.packets.filter(p=>!['reject','keep','superseded','closed'].includes(p.state));
 const labels={share:'share headline','custom fragment':'page text and labels',title:'title',format:'editorial format',question:'question',answer:'answer',explanation:'explanation',qualification:'context',whyCare:'why it matters',guess:'optional guess',treatment:'visual comparison',dataReuse:'data attribution',evidence:'sources and method',assets:'imagery'};
 const cards=pending.map(p=>{
  const path='/review/'+esc(p.id)+'/'+esc(p.packetId??p.digest)+'/';
  const before=p.changes.claim.find(c=>c.field==='share')?.before?.question;
  const changes=Object.values(p.changes).flat().map(c=>labels[c.field]??c.field).join(', ');
  return `<article><div class="review-art">${p.entry.status==='review'?`<a href="${path}"><img src="${path}share.png" width="1200" height="630" alt="Proposed share image: ${esc(shareCopy(p.entry).question)}"></a>`:''}</div><div class="review-copy"><p class="state">${esc(p.id)} · ${esc(p.state)}</p><h2>${esc(shareCopy(p.entry).question)}</h2>${before?`<p class="before">Released headline: ${esc(before)}</p>`:''}<p>${p.baselineDigest?'Changes to an existing discovery.':'New discovery. Not yet published.'} ${esc(changes)}</p>${p.entry.answer?`<details><summary>Proposed answer</summary><p>${esc(p.entry.answer)}</p><p>${esc(p.entry.qualification??'')}</p></details>`:''}<p class="readiness">${p.conflict?'Working version changed. Reconcile this proposal before deciding.':esc(p.readiness.join('; ')||'Ready for your editorial review.')}</p>${p.entry.status==='review'?`<a class="preview" href="${path}">Preview exact revision ↗</a>`:'<p>Complete this draft before preview.</p>'}<details class="technical"><summary>Full changes and revision IDs</summary><p>Packet: <code>${esc(p.packetId??p.digest)}</code><br>Content: <code>${esc(p.digest)}</code></p><pre>${esc(JSON.stringify(p.changes,null,2))}</pre></details></div></article>`;
 }).join('');
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Private editorial review</title><style>@font-face{font-family:Outfit;src:url('/assets/outfit.ttf');font-weight:100 900;font-display:swap}*{box-sizing:border-box}body{max-width:1200px;margin:0 auto;padding:48px 24px 80px;background:#fff8f0;color:#29211b;font:18px/1.5 Outfit,system-ui}h1,h2{line-height:1.05;letter-spacing:-.04em}h1{font-size:clamp(40px,6vw,70px);margin:24px 0}h2{font-size:32px;margin:10px 0 20px}header{max-width:760px;margin-bottom:50px}a{color:inherit;text-underline-offset:4px}article{display:grid;grid-template-columns:1fr 1fr;gap:38px;border-top:1px solid #cdbbad;padding:38px 0}img{width:100%;height:auto;display:block}.review-art{align-self:start;position:sticky;top:20px}.state,.before{font-size:15px;color:#695b50}.preview{display:inline-block;background:#ff681f;color:#291b10;padding:14px 22px;border-radius:40px;text-decoration:none;font-weight:600}.technical{margin-top:24px;font-size:14px}summary{cursor:pointer}code,pre{overflow-wrap:anywhere;white-space:pre-wrap}details p{margin:16px 0}.readiness{font-size:15px}a:focus-visible,summary:focus-visible{outline:3px solid currentColor;outline-offset:5px}@media(max-width:700px){body{padding:24px 18px}article{grid-template-columns:1fr;gap:16px}.review-art{position:static}}@media(prefers-color-scheme:dark){body{background:#211b17;color:#fff5e9}.state,.before{color:#cdb9a8}article{border-color:#725a47}}</style></head><body><header><a href="/">Preview collection ↗</a><h1>${pending.length} discoveries to review.</h1><p>Open each preview, then tell me <strong>keep, revise, or reject</strong> for that discovery. Keeping a proposal records content approval. Release and deployment still need your direction.</p><p>These previews are local. The public build retains its released versions.</p></header>${cards}${report.unpacketized.map(e=>`<article><div><h2>${esc(e.title)}</h2><p>${esc(e.status)}: prepare an exact packet before a decision.</p>${e.status==='review'?`<a href="/discoveries/${esc(e.id)}/">Preview discovery</a>`:''}</div></article>`).join('')}</body></html>`;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [command,...args]=process.argv.slice(2),desk=createReviewDesk();let result;
 if(command==='report')result=await desk.report();else if(command==='propose')result=await desk.propose(JSON.parse(await readFile(args[0],'utf8')));else if(command==='decide')result=await desk.decide(args[0],args[1],args[2],JSON.parse(await readFile(args[3],'utf8')));else if(command==='close')result=await desk.close(args[0],args[1],JSON.parse(await readFile(args[2],'utf8')));else if(command==='release')result=await desk.release(JSON.parse(await readFile(args[0],'utf8')));else throw new Error('Use report | propose PACKET.json | decide ID PACKET_ID keep|revise|reject HUMAN.json | close ID PACKET_ID HUMAN.json | release RELEASE.json');console.log(JSON.stringify(result,null,2));if(['failed','conflict'].includes(result.outcome))process.exitCode=1;
}
