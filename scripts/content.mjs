import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
export const root = new URL('../', import.meta.url);
export const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = (v, name) => assert(typeof v === 'string' && v.trim(), `Missing ${name}`);
const date = (v, name) => { text(v,name); assert(/^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(v).toISOString().slice(0,10) === v, `Invalid ${name}`); };
export function validate(entry) {
  const {id,status,treatment:t,evidence:e} = entry;
  assert(/^[a-z][a-z0-9-]*$/.test(id), 'Invalid entry id');
  text(entry.title,'title'); text(entry.topic,'topic');
  assert(['draft','review','published','retired'].includes(status), `${id}: invalid status`);
  assert(Number.isFinite(entry.order), `${id}: order must be a number`);
  assert(t && ['custom','reveal','bar','line'].includes(t.kind), `${id}: unknown treatment`);
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
  if(t.kind === 'custom') { assert(['crunch','copper','mail','painting'].includes(t.template) && id === t.template, `${id}: custom template must use its stable id`); return entry; }
  for(const key of ['question','answer','explanation','qualification','whyCare']) text(entry[key], key);
  if(t.kind === 'reveal') return entry;
  assert(Array.isArray(t.views) && t.views.length>0, `${id}: chart views required`);
  assert(new Set(t.views.map(v=>v.id)).size === t.views.length, `${id}: duplicate chart view`);
  for(const v of t.views) {
    assert(/^[a-z][a-z0-9-]*$/.test(v.id), 'Invalid chart view id');
    for(const key of ['label','unit','note']) text(v[key],key);
    assert(Number.isFinite(v.max) && v.max>0, 'Chart maximum must be positive');
    assert(v.baseline === 0, 'Charts require an explicit zero baseline');
    assert(Array.isArray(v.values) && v.values.length >=2, 'Chart needs at least two observations');
    let previousX=-Infinity;
    for(const d of v.values){text(d.label,'data label'); assert(Number.isFinite(d.value) && d.value>=0 && d.value<=v.max,'Chart value outside zero-based domain'); if(t.kind==='line'){assert(Number.isFinite(d.x)&&d.x>previousX,'Line x values must increase');previousX=d.x;}}
  }
  if(entry.topic === 'politics') {assert(e.sources.filter(s=>s.primary).length>=2,'Political comparisons require at least two primary source references'); text(e.denominator,'political data denominator'); text(e.methodology,'political data methodology');}
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
const number = v=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(v);
export function linePoints(values, max) {
  const start=values[0].x, span=values.at(-1).x-start;
  return values.map(d=>`${40+(d.x-start)/span*500},${210-d.value/max*180}`).join(' ');
}
function chart(entry) {
  const {id,treatment:t}=entry;
  if(t.kind==='reveal') return '';
  const views=t.views.map((v,index)=>{
    const description=esc(v.values.map(d=>`${d.label}: ${number(d.value)} ${v.unit}`).join("; "));
    let graphic;
    if(t.kind==='bar') graphic=`<div class="data-bars" role="img" aria-label="${description}">${v.values.map(d=>`<div class="data-row"><div><span>${esc(d.label)}</span><strong>${number(d.value)}</strong></div><div class="data-track"><span style="--portion:${d.value/v.max}"></span></div></div>`).join('')}</div>`;
    else graphic=`<svg class="data-line" viewBox="0 0 600 250" role="img" aria-label="${description}"><path d="M40 30V210H540" fill="none" stroke="currentColor"/><polyline points="${linePoints(v.values,v.max)}" fill="none" stroke="var(--display)" stroke-width="4"/>${v.values.map((d,i)=>{const [x,y]=linePoints(v.values,v.max).split(' ')[i].split(',');return `<circle cx="${x}" cy="${y}" r="5" fill="var(--display)"/><text x="${x}" y="235" text-anchor="middle">${esc(d.label)}</text>`;}).join('')}<text x="35" y="214" text-anchor="end">0</text><text x="40" y="20">${number(v.max)} ${esc(v.unit)}</text></svg>`;
    return `<div id="${id}-view-${v.id}" class="data-view" ${index?'hidden':''}><p class="data-unit">${esc(v.label)} · ${esc(v.unit)}</p>${graphic}<p class="data-axis">Scale: 0–${number(v.max)} ${esc(v.unit)}. ${esc(v.note)}</p></div>`;
  }).join('');
  const controls=t.views.length>1 ? `<div class="data-controls" role="group" aria-label="Choose comparison" hidden>${t.views.map((v,i)=>`<button type="button" data-view="${id}-view-${v.id}" aria-pressed="${i===0}">${esc(v.label)}</button>`).join('')}</div>` : '';
  const table=`<details class="source data-table"><summary>See the numbers</summary><table><caption>Values behind every chart view</caption><thead><tr><th scope="col">Measure</th><th scope="col">Observation</th><th scope="col">Value</th><th scope="col">Unit</th></tr></thead><tbody>${t.views.flatMap(v=>v.values.map(d=>`<tr><td>${esc(v.label)}</td><th scope="row">${esc(d.label)}</th><td>${number(d.value)}</td><td>${esc(v.unit)}</td></tr>`)).join('')}</tbody></table><a href="data/${id}.csv" download>Download the data (CSV)</a></details>`;
  return `<div class="discovery-chart">${controls}${views}<p class="data-status" role="status"></p>${table}</div>`;
}
export async function renderEntry(entry,next,now) {
  if(entry.treatment.kind==='custom') {
    return (await readFile(new URL(`src/exhibits/${entry.treatment.template}.html`,root),'utf8')).replaceAll('{{nextHref}}',next ? '#'+next.id : '#top');
  }
  const {id,evidence:e}=entry;
  return `<section class="data-discovery" id="${id}" aria-labelledby="${id}-title"><div class="discovery-heading"><p class="edition-note">${entry.status==='review'?'Draft for review · ':''}${esc(e.dataAsOf)}</p><h2 id="${id}-title">${esc(entry.question)}</h2><p>${esc(entry.whyCare)}</p></div><details class="discovery-reveal"><summary>Reveal the discovery <span aria-hidden="true">↗</span></summary><div class="discovery-answer"><h3>${esc(entry.answer)}</h3><p>${esc(entry.explanation)}</p><p class="discovery-qualification">${esc(entry.qualification)}</p></div>${chart(entry)}</details><div class="discovery-evidence"><p>${reviewState(entry,now)} ${esc(e.checkedAt)} · Data: ${esc(e.dataAsOf)}</p><details class="source"><summary>The receipts</summary><p>${esc(e.scope)}</p>${e.methodology?`<p>${esc(e.methodology)}</p>`:''}${e.denominator?`<p>Denominator: ${esc(e.denominator)}</p>`:''}<ul>${e.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a></li>`).join('')}</ul></details><a class="text-button" href="#${id}">Link to this discovery</a></div></section>`;
}
export function csv(entry){
  const cell=v=>'"'+String(v).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
  return [['measure','observation','value','unit','data_as_of'],...entry.treatment.views.flatMap(v=>v.values.map(d=>[v.label,d.label,d.value,v.unit,entry.evidence.dataAsOf]))].map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
