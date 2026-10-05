import assert from 'node:assert/strict';

// Two groups, two separately labelled measures. Object counts stay literal: no
// scaling a seat to several seats, no fractions and no cross-unit axis.
export function pairedComparison({esc,validateChart}) {
  const number=value=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(value);
  return {
    exportsData:true,
    answerAfterGraphic:true,
    scripts:['treatments/paired-comparison.js'],
    validate(entry) {
      validateChart(entry);
      const {views,transition}=entry.treatment;
      assert(views.length===2,'Paired comparison needs exactly two measures');
      assert(typeof transition==='string'&&transition.trim(),'Paired comparison needs a transition');
      assert(views[0].display==='bars'&&views[1].display==='objects','Paired comparison uses bars followed by objects');
      assert(views.every(v=>v.values.length===2),'Paired comparison needs exactly two groups');
      assert(views[0].values.every((d,i)=>d.label===views[1].values[i].label),'Paired comparison group labels must match in order');
      assert(new Set(views[0].values.map(d=>d.label)).size===2,'Paired comparison needs distinct group labels');
      assert(['seat','tile'].includes(views[1].object),'Paired comparison needs a supported object');
      assert(views[1].max<=100&&views[1].values.every(d=>Number.isInteger(d.value)),'Object comparison needs whole counts with a maximum of 100');
    },
    render(entry,context) {
      const [quantity,objects]=entry.treatment.views;
      const bar=(d,index)=>`<div class="paired-group paired-group-${index}"><p class="paired-group-name">${esc(d.label)}</p><strong class="paired-quantity">${number(d.value)}</strong><span class="paired-unit">${esc(quantity.unit)}</span><div class="paired-ribbon-track" aria-hidden="true"><span class="paired-ribbon" style="--portion:${d.value/quantity.max}"></span></div></div>`;
      const pile=(d,index)=>`<div class="paired-group paired-group-${index}"><p class="paired-group-name">${esc(d.label)}</p><div class="paired-object-count"><strong>${number(d.value)}</strong><span>${esc(objects.unit)}</span></div><div class="paired-object-field paired-object-${esc(objects.object)}" aria-hidden="true">${Array.from({length:d.value},(_,i)=>`<i class="paired-object" style="--object-index:${i}"></i>`).join('')}</div></div>`;
      const rows=entry.treatment.views.flatMap(v=>v.values.map(d=>`<tr><td>${esc(v.label)}</td><th scope="row">${esc(d.label)}</th><td>${number(d.value)}</td><td>${esc(v.unit)}</td></tr>`)).join('');
      return `<div class="paired-comparison"><div class="paired-visual"><div class="paired-measure paired-populations"><p class="paired-measure-title">${esc(quantity.label)}</p><div class="paired-groups">${quantity.values.map(bar).join('')}</div><p class="paired-scale">Shared scale: 0–${number(quantity.max)} ${esc(quantity.unit)}. ${esc(quantity.note)}</p></div><p class="paired-transition">${esc(entry.treatment.transition)}</p><div class="paired-measure paired-allocations"><p class="paired-measure-title">${esc(objects.label)}</p><div class="paired-groups">${objects.values.map(pile).join('')}</div><p class="paired-scale">${esc(objects.note)}</p></div></div><div class="paired-after"><p>Both measures, side by side. Different units; separate scales.</p><button type="button" class="text-button paired-replay" hidden>Replay the comparison <span aria-hidden="true">↻</span></button></div><details class="source data-table"><summary>See the numbers</summary><table><caption>Values behind both comparisons</caption><thead><tr><th scope="col">Measure</th><th scope="col">Group</th><th scope="col">Value</th><th scope="col">Unit</th></tr></thead><tbody>${rows}</tbody></table><a href="${esc(context.dataHref(entry.id))}" download>Download the data (CSV)</a></details></div>`;
    }
  };
}
