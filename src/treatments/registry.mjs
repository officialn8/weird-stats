import assert from 'node:assert/strict';
import { pairedComparison } from './paired-comparison.mjs';
import { readFile } from 'node:fs/promises';
const root = new URL('../../', import.meta.url);
export const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const definitions = new Map();
export function registerTreatment(kind, definition) {
  assert(/^[a-z][a-z0-9-]*$/.test(kind), 'Invalid treatment kind');
  assert(!definitions.has(kind), `Treatment already registered: ${kind}`);
  assert(typeof definition.validate === 'function' && typeof definition.render === 'function', `${kind}: validator and renderer required`);
  definitions.set(kind, Object.freeze({assets: [], scripts: [], ...definition}));
}
export function getTreatment(kind) {
  assert(definitions.has(kind), `Unknown treatment: ${kind}`);
  return definitions.get(kind);
}
export function treatmentKinds() { return [...definitions.keys()]; }
const required = (v, name) => assert(typeof v === 'string' && v.trim(), `Missing ${name}`);
export function validateChart(entry) {
  const {id,treatment:t}=entry;
  assert(Array.isArray(t.views) && t.views.length>0, `${id}: chart views required`);
  assert(new Set(t.views.map(v=>v.id)).size === t.views.length, `${id}: duplicate chart view`);
  for(const v of t.views) {
    assert(/^[a-z][a-z0-9-]*$/.test(v.id), 'Invalid chart view id');
    for(const key of ['label','unit','note']) required(v[key],key);
    assert(Number.isFinite(v.max) && v.max>0, 'Chart maximum must be positive');
    assert(v.baseline === 0, 'Charts require an explicit zero baseline');
    assert(Array.isArray(v.values) && v.values.length >=2, 'Chart needs at least two observations');
    let previousX=-Infinity;
    for(const d of v.values){required(d.label,'data label'); assert(Number.isFinite(d.value) && d.value>=0 && d.value<=v.max,'Chart value outside zero-based domain'); if(t.kind==='line'){assert(Number.isFinite(d.x)&&d.x>previousX,'Line x values must increase');previousX=d.x;}}
  }
}
export const customAssets = Object.freeze({
  crunch:['assets/chip.webp','assets/chip-small.webp','assets/chip-a.mp3','assets/chip-b.mp3'],
  copper:['assets/penny.webp','assets/nickel.webp'],
  mail:['assets/mule.webp'], painting:['assets/nightwatch.webp']
});
const number = v=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(v);
export function linePoints(values, max) {
  const start=values[0].x, span=values.at(-1).x-start;
  return values.map(d=>`${40+(d.x-start)/span*500},${210-d.value/max*180}`).join(' ');
}
function chart(entry, context) {
  const {id,treatment:t}=entry;
  if(t.kind==='reveal') return '';
  const views=t.views.map((v,index)=>{
    const description=esc(v.values.map(d=>`${d.label}: ${number(d.value)} ${v.unit}`).join("; "));
    let graphic;
    if(t.kind==='bar') graphic=`<div class="data-bars" role="img" aria-label="${description}">${v.values.map(d=>`<div class="data-row"><div><span>${esc(d.label)}</span><strong>${number(d.value)}</strong></div><div class="data-track"><span style="--portion:${d.value/v.max}"></span></div></div>`).join('')}</div>`;
    else {
      const points=linePoints(v.values,v.max),coordinates=points.split(' ');
      graphic=`<svg class="data-line" viewBox="0 0 600 250" role="img" aria-label="${description}"><path d="M40 30V210H540" fill="none" stroke="currentColor"/><polyline points="${points}" fill="none" stroke="var(--display)" stroke-width="4"/>${v.values.map((d,i)=>{const [x,y]=coordinates[i].split(',');return `<circle cx="${x}" cy="${y}" r="5" fill="var(--display)"/><text x="${x}" y="235" text-anchor="middle">${esc(d.label)}</text>`;}).join('')}<text x="35" y="214" text-anchor="end">0</text><text x="40" y="20">${number(v.max)} ${esc(v.unit)}</text></svg>`;
    }
    return `<div id="${id}-view-${v.id}" class="data-view" ${index?'hidden':''}><p class="data-unit">${esc(v.label)} · ${esc(v.unit)}</p>${graphic}<p class="data-axis">Scale: 0–${number(v.max)} ${esc(v.unit)}. ${esc(v.note)}</p></div>`;
  }).join('');
  const controls=t.views.length>1 ? `<div class="data-controls" role="group" aria-label="Choose comparison" hidden>${t.views.map((v,i)=>`<button type="button" data-view="${id}-view-${v.id}" aria-pressed="${i===0}">${esc(v.label)}</button>`).join('')}</div>` : '';
  const table=`<details class="source data-table"><summary>See the numbers</summary><table><caption>Values behind every chart view</caption><thead><tr><th scope="col">Measure</th><th scope="col">Observation</th><th scope="col">Value</th><th scope="col">Unit</th></tr></thead><tbody>${t.views.flatMap(v=>v.values.map(d=>`<tr><td>${esc(v.label)}</td><th scope="row">${esc(d.label)}</th><td>${number(d.value)}</td><td>${esc(v.unit)}</td></tr>`)).join('')}</tbody></table><a href="${esc(context.dataHref(id))}" download>Download the data (CSV)</a></details>`;
  return `<div class="discovery-chart">${controls}${views}<p class="data-status" role="status"></p>${table}</div>`;
}

registerTreatment('reveal', {validate() {}, render() { return ''; }});
for(const kind of ['bar','line']) registerTreatment(kind, {validate:validateChart,render:chart, exportsData:true});
registerTreatment('custom', {
  custom:true,
  validate(entry) { assert(Object.hasOwn(customAssets,entry.treatment.template) && entry.id===entry.treatment.template, `${entry.id}: custom template must use its stable id`); },
  assets: entry => customAssets[entry.treatment.template],
  scripts: entry => entry.treatment.template==='crunch' ? ['crunch.js'] : [],
  async render(entry,context) {
    const fragment=context.fragment ?? await readFile(new URL(`src/exhibits/${entry.treatment.template}.html`,root),'utf8');
    return fragment.replaceAll('{{nextHref}}',context.nextHref);
  }
});

registerTreatment('paired-comparison',pairedComparison({esc,validateChart}));
