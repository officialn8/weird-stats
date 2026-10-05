import assert from 'node:assert/strict';
const designation=heading=>Math.round(heading/10)||36;
export function bearingShift({esc,required}) {
 return {
  custom:true,
  scripts:['treatments/runway.js'],
  validate(entry) {
   const t=entry.treatment;
   for(const key of ['question','answer','explanation','qualification','whyCare'])required(entry[key],key);
   for(const key of ['from','to','trueBearing'])assert(Number.isFinite(t[key])&&t[key]>=0&&t[key]<=360,'Bearing must be within 0–360 degrees');
   assert(t.to>t.from&&t.to-t.from<=10,'Show a small increasing heading change');
   assert(designation(t.to)===designation(t.from)+1,'The example must cross one runway-number boundary');
   assert(t.trueBearing===180,'This south-facing diagram requires a true bearing of 180 degrees');
   assert(Number.isFinite(t.duration)&&t.duration>=1000&&t.duration<=8000,'Bounded reveal duration required');
   assert(typeof t.exampleLabel==='string'&&t.exampleLabel.trim(),'Illustration qualification required');
  },
  render(entry) {
   const t=entry.treatment,e=entry.evidence,start=designation(t.from),end=designation(t.to);
   const stripes=Array.from({length:5},(_,i)=>`<rect x="${229+i*12}" y="131" width="6" height="36"/><rect x="${310+i*12}" y="131" width="6" height="36"/>`).join('');
   return `<section class="data-discovery runway-story" id="${esc(entry.id)}" data-treatment="bearing-shift" data-from="${t.from}" data-to="${t.to}" data-true-bearing="${t.trueBearing}" data-duration="${t.duration}" aria-labelledby="${esc(entry.id)}-title">
    <div class="runway-inner">
     <header class="runway-intro"><p class="runway-kicker">${entry.status==='review'?'Private study / ':''}A change of direction</p><h2 id="${esc(entry.id)}-title">${esc(entry.question)}</h2><p class="runway-tease">Same strip of tarmac.<br>A different number.</p></header>
     <details class="discovery-reveal runway-reveal"><summary>Show me why <span aria-hidden="true">↗</span></summary>
      <div class="runway-answer"><h3>${esc(entry.answer)}</h3><p>${esc(entry.explanation)}</p><p class="discovery-qualification">${esc(entry.qualification)}</p>

       <p class="runway-static">${t.from}° → ${t.to}°. Runway ${start} → ${end}.<br>The pavement stays in exactly the same place.</p>
      </div>
     </details>
     <figure class="runway-visual" aria-label="Illustrative stationary runway">
      <div class="runway-scene" aria-hidden="true">
       <div class="runway-orbit"></div><span class="runway-direction">N</span><span class="runway-map-label">FIXED GROUND</span>
       <svg class="runway-airfield" viewBox="0 0 600 650" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path class="runway-taxiway" d="M50 600V450Q50 410 90 410H188Q210 410 210 388M440 35V465Q440 505 480 505H590M100 282H208M390 315H440M105 338H207"/>
        <path class="runway-taxiway-line" d="M50 600V450Q50 410 90 410H188Q210 410 210 388M440 35V465Q440 505 480 505H590"/>
        <rect x="209" y="100" width="180" height="465" rx="3" fill="#141a19" stroke="#747c71" stroke-width="1"/>
        <path d="M220 110V555M378 110V555" stroke="#e5e5cf" stroke-width="2"/>
        <g fill="#e5e5cf">${stripes}</g><path d="M300 296V532" stroke="#e5e5cf" stroke-width="4" stroke-dasharray="24 23"/>
        <text class="runway-painted-number" x="300" y="268" text-anchor="middle" fill="#fff8ee" font-family="Outfit, sans-serif" font-size="104" font-weight="700">${start}</text>
        <path d="M196 110V554M402 110V554" stroke="#ff893e" stroke-width="3" stroke-dasharray="2 25"/>
        <g class="runway-magnetic" transform="rotate(${t.trueBearing-t.from} 300 328)"><path d="M300 326V28" stroke="#ff893e" stroke-width="2"/><path d="M290 45L300 23L310 45" stroke="#ff893e" stroke-width="2"/><circle cx="300" cy="328" r="6" fill="#ff893e"/></g>
       </svg>
       <div class="runway-number-plate"><span>RUNWAY</span><strong class="runway-sign-number">${start}</strong><span class="runway-sign-change" hidden>NUMBER UPDATED</span></div>
       <div class="runway-bearing-readout"><span>Magnetic heading</span><strong><span class="runway-heading-value">${t.from.toFixed(1)}</span>°</strong></div>
       <div class="runway-drift-tape"><span>${t.from}°</span><span>${(t.from+t.to)/2}°</span><span>${t.to}°</span><i class="runway-tape-needle"></i></div>
      </div>
      <figcaption><span class="runway-before-caption">A runway number is a direction, not a count.</span><span class="runway-after-caption">${esc(t.exampleLabel)}<br>Orange arrow: magnetic north. N: true north.<br>Heading scale below the runway is magnified.</span></figcaption>
       <div class="runway-controls" hidden><label for="${esc(entry.id)}-drift">Move the magnetic reference</label><input id="${esc(entry.id)}-drift" type="range" min="0" max="100" value="0" step="1" aria-valuetext="${t.from} degrees; runway ${start}"><div class="runway-control-ends"><span>${t.from}°</span><span>${t.to}°</span></div><button type="button" class="text-button runway-replay">Replay the shift ↻</button></div>
      <p class="runway-announcement" role="status"></p>
     </figure>
     <div class="runway-receipts"><p>${esc(e.dataAsOf)} · Checked ${esc(e.checkedAt)}</p><details class="source"><summary>The receipts</summary><p>${esc(e.scope)}</p><p>${esc(e.methodology??'')}</p><ul>${e.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a></li>`).join('')}</ul></details></div>
    </div>
   </section>`;
  }
 };
}
