import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { getTreatment, esc } from '../src/treatments/registry.mjs';
export { esc, linePoints } from '../src/treatments/registry.mjs';
export const root = new URL('../', import.meta.url);
const text = (v, name) => assert(typeof v === 'string' && v.trim(), `Missing ${name}`);
const date = (v, name) => { text(v,name); assert(/^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(v).toISOString().slice(0,10) === v, `Invalid ${name}`); };
export function validate(entry) {
  const {id,status,treatment:t,evidence:e} = entry;
  assert(/^[a-z][a-z0-9-]*$/.test(id), 'Invalid entry id');
  text(entry.title,'title'); text(entry.topic,'topic');
  assert(['draft','review','published','retired'].includes(status), `${id}: invalid status`);
  assert(Number.isFinite(entry.order), `${id}: order must be a number`);
  assert(t, `${id}: treatment required`);
  const definition=getTreatment(t.kind);
  validateAssets(entry.assets);
  if(entry.guess) validateGuess(entry.guess);
  if (status === 'draft' || status === 'retired') return entry;
  assert(e, `${id}: evidence required`);
  assert(['experiment','reported','measurement','estimate','calculation'].includes(e.kind), `${id}: evidence kind required`);
  for (const key of ['scope','dataAsOf']) text(e[key],key);
  date(e.checkedAt,'checkedAt'); date(e.reviewDue,'reviewDue');
  assert(e.reviewDue >= e.checkedAt, `${id}: review due precedes source check`);
  assert(Array.isArray(e.sources) && e.sources.length && e.sources.some(s=>s.primary === true), `${id}: primary source required`);
  for(const s of e.sources){text(s.label,'source label'); assert(/^https:\/\//.test(s.url) && new URL(s.url).hostname, `${id}: HTTPS source URL required`);}
  if(status === 'published') {
    text(entry.approval?.by,'approval.by'); date(entry.approval?.at,'approval.at');
    assert(typeof entry.publishedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(entry.publishedAt) && Number.isFinite(Date.parse(entry.publishedAt)), `${id}: publication timestamp required`);
  }
  if(entry.topic === 'politics') {assert(e.sources.filter(s=>s.primary).length>=2,'Political comparisons require at least two primary source references'); text(e.denominator,'political data denominator'); text(e.methodology,'political data methodology');}
  if(!definition.custom) for(const key of ['question','answer','explanation','qualification','whyCare']) text(entry[key], key);
  definition.validate(entry);
  return entry;
}
export async function loadEntries() {
  const files=(await readdir(new URL('content/entries/',root))).filter(f=>f.endsWith('.json')).sort();
  const entries=await Promise.all(files.map(async f=>{try{return validate(JSON.parse(await readFile(new URL('content/entries/'+f,root),'utf8')));}catch(e){throw new Error(`${f}: ${e.message}`);}}));
  assert(new Set(entries.map(e=>e.id)).size===entries.length,'Duplicate entry ids');
  return entries.sort((a,b)=>a.order-b.order || a.id.localeCompare(b.id));
}
export function selectEntries(entries,{drafts=false,now=new Date()}={}) {
  return entries.filter(e=>e.status==='published' && Date.parse(e.publishedAt)<=now.getTime() || drafts && e.status==='review');
}
export function reviewState(entry, now=new Date()) {
  return entry.evidence?.reviewDue < now.toISOString().slice(0,10) ? 'Review due' : 'Checked';
}
export function createPageContext({mode='collection', assetBase='/', collectionHref='/', ...overrides}={}) {
  assert(['collection','discovery'].includes(mode), 'Invalid page context');
  return {
    mode, assetHref:path => assetBase+path.replace(/^\//,''),
    dataHref:id => `/data/${id}.csv`, discoveryHref:id => `/discoveries/${id}/`,
    nextHref:collectionHref, collectionHref, ...overrides
  };
}
export async function renderEntry(entry,next,now=new Date(),context=createPageContext()) {
  const definition=getTreatment(entry.treatment.kind);
  const page={...context,nextHref:next ? (context.mode==='collection' ? '#'+next.id : context.discoveryHref(next.id)) : context.collectionHref};
  const graphic=await definition.render(entry,page);
  if(definition.custom) return graphic.replace(/(["'])assets\//g,(_,quote)=>quote+page.assetHref('assets/'));
  const {id,evidence:e}=entry;
  const guess=entry.guess ? `<div class="data-controls discovery-guess" role="group" aria-label="Optional guess" hidden>${entry.guess.choices.map(c=>`<button type="button" data-guess="${esc(c.id)}" aria-pressed="false">${esc(c.label)}</button>`).join('')}</div><p class="guess-status" role="status"></p>` : '';
  const feedback=entry.guess ? `<div class="guess-feedback" role="status">${entry.guess.choices.map(c=>`<p data-feedback="${esc(c.id)}" hidden>${esc(c.feedback)}</p>`).join('')}</div>` : '';
  return `<section class="data-discovery" data-treatment="${esc(entry.treatment.kind)}" id="${id}" aria-labelledby="${id}-title"><div class="discovery-heading"><p class="edition-note">${entry.status==='review'?'Draft for review · ':''}${esc(e.dataAsOf)}</p><h2 id="${id}-title">${esc(entry.question)}</h2><p>${esc(entry.whyCare)}</p></div>${guess}<details class="discovery-reveal"><summary>${entry.guess?'Show me':'Reveal the discovery'} <span aria-hidden="true">↗</span></summary>${feedback}${definition.answerAfterGraphic?graphic:''}<div class="discovery-answer"><h3>${esc(entry.answer)}</h3><p>${esc(entry.explanation)}</p><p class="discovery-qualification">${esc(entry.qualification)}</p></div>${definition.answerAfterGraphic?'':graphic}</details><div class="discovery-evidence"><p>${reviewState(entry,now)} ${esc(e.checkedAt)} · Data: ${esc(e.dataAsOf)}</p><details class="source"><summary>The receipts</summary><p>${esc(e.scope)}</p>${e.methodology?`<p>${esc(e.methodology)}</p>`:''}${e.denominator?`<p>Denominator: ${esc(e.denominator)}</p>`:''}<ul>${e.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a></li>`).join('')}</ul></details><a class="text-button" href="${esc(page.discoveryHref(id))}">Link to this discovery</a></div></section>`;
}
function validateGuess(guess) {
  assert(Array.isArray(guess.choices) && guess.choices.length>=2, 'Guess needs at least two choices');
  assert(new Set(guess.choices.map(c=>c.id)).size===guess.choices.length, 'Duplicate guess choice');
  for(const c of guess.choices) { assert(/^[a-z][a-z0-9-]*$/.test(c.id),'Invalid guess choice id'); text(c.label,'guess label');text(c.feedback,'guess feedback'); }
}
export function validateAssets(assets=[]) {
  assert(Array.isArray(assets),'assets must be a list');
  for(const asset of assets) assert(typeof asset.path==='string' && /^assets\/[a-zA-Z0-9_./-]+$/.test(asset.path) && !asset.path.split('/').some(p=>p==='..'||p==='.'||!p),`Invalid owned asset path: ${asset.path}`);
  assert(new Set(assets.map(a=>a.path)).size===assets.length,'Duplicate owned asset');
}
// Stable editorial subject: approval, release timing, ordering and generated URLs are not content.
function stable(value) {
  if(Array.isArray(value)) return value.map(stable);
  if(value && typeof value==='object') return Object.fromEntries(Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>[k,stable(value[k])]));
  return value;
}
function decodeHTML(value) {
  const named={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',lsquo:'‘',rsquo:'’',ldquo:'“',rdquo:'”',hellip:'…',times:'×',divide:'÷',copy:'©',reg:'®',deg:'°'};
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,(entity,name)=>{
    if(name[0]!=='#') return named[name]??entity;
    const code=name[1].toLowerCase()==='x'?parseInt(name.slice(2),16):Number(name.slice(1));
    return code>0&&code<=0x10ffff&&!(code>=0xd800&&code<=0xdfff)?String.fromCodePoint(code):'�';
  }).replace(/\s+/g,' ').trim();
}
export function fragmentEditorialContent(fragment='') {
  const clean=fragment.replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
  const labels=[],sources=[];
  const text=clean.replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g,tag=>{
    const values=new Map();
    for(const match of tag.matchAll(/([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) values.set(match[1].toLowerCase(),decodeHTML(match[2]??match[3]??match[4]));
    for(const name of ['aria-label','alt','title']) if(values.has(name)) labels.push([name,values.get(name)]);
    if(values.get('href')?.startsWith('https://'))sources.push(values.get('href'));
    return ' ';
  });
  return {text:decodeHTML(text),labels,sources};
}
export function contentDigest(entry,{fragment='',assetDigests={}}={}) {
  const fields=['id','title','topic','question','answer','explanation','qualification','whyCare','evidence','treatment','guess','assets'];
  const subject=Object.fromEntries(fields.filter(k=>entry[k]!==undefined).map(k=>[k,entry[k]]));
  if(entry.treatment.kind==='custom') subject.fragment=fragmentEditorialContent(fragment);
  subject.assetDigests=assetDigests;
  return createHash('sha256').update(JSON.stringify(stable(subject))).digest('hex');
}
export function selectRelease(records,{manifest,revisions=[],drafts=false,now=new Date()}={}) {
  if(!manifest) return {entries:selectEntries(records,{drafts,now}),withdrawals:[],revisions:new Map(),legacy:true};
  assert(manifest.version===1,'Unknown release manifest version');
  text(manifest.authorizedBy,'release authorizedBy');
  assert(Number.isFinite(Date.parse(manifest.releasedAt)),'Invalid release timestamp');
  assert(Date.parse(manifest.releasedAt)<=now.getTime(),'Release is not due');
  assert(Array.isArray(manifest.entries) && Array.isArray(manifest.withdrawals),'Release entries and withdrawals required');
  const ids=[...manifest.entries,...manifest.withdrawals].map(p=>p.id);
  assert(ids.every(id=>/^[a-z][a-z0-9-]*$/.test(id)) && new Set(ids).size===ids.length,'Invalid or duplicate release id');
  const selected=new Map();
  const entries=manifest.entries.map(pin=>{
    const revision=revisions.find(r=>r.id===pin.id && r.digest===pin.digest);
    assert(revision,`${pin.id}: pinned revision ${pin.digest} is missing`);
    const entry=validate(revision.entry);
    assert(entry.id===pin.id && entry.approval?.digest===pin.digest,`${pin.id}: revision approval digest mismatch`);
    assert(entry.status==='published' && Date.parse(entry.publishedAt)<=now.getTime(),`${pin.id}: pinned revision is not publishable`);
    assert(contentDigest(entry,revision)===pin.digest,`${pin.id}: revision content digest mismatch`);
    selected.set(pin.id,revision);return entry;
  });
  for(const w of manifest.withdrawals){text(w.reason,'withdrawal reason');text(w.authorizedBy,'withdrawal authorizedBy');date(w.at,'withdrawal at');assert(w.at<=now.toISOString().slice(0,10),'Withdrawal is not due');assert(revisions.some(r=>r.id===w.id && r.entry.approval?.digest===r.digest && contentDigest(r.entry,r)===r.digest && r.release?.authorizedBy && Number.isFinite(Date.parse(r.release.at)) && Date.parse(r.release.at)<=Date.parse(w.at+'T23:59:59Z')),`${w.id}: withdrawal needs a previously released revision with release evidence`);}
  if(drafts) for(const e of records.filter(e=>e.status==='review')) {const i=entries.findIndex(p=>p.id===e.id);if(i>=0)entries[i]=e;else entries.push(e);selected.delete(e.id);}
  return {entries,withdrawals:manifest.withdrawals,revisions:selected,legacy:false};
}
export function csv(entry){
  const cell=v=>'"'+String(v).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
  return [['measure','observation','value','unit','data_as_of'],...entry.treatment.views.flatMap(v=>v.values.map(d=>[v.label,d.label,d.value,v.unit,entry.evidence.dataAsOf]))].map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
