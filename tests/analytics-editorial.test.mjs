import test from 'node:test';
import assert from 'node:assert/strict';
import {createVisit,filterEvent} from '../public/analytics.js';
import {pageContext} from '../public/analytics-context.js';
import {analyticsHead} from '../scripts/analytics.mjs';

const entries=[{id:'essay',revealable:false,kind:'custom',format:'deep-dive',position:1,revision:'abc'},{id:'finding',revealable:false,kind:'custom',position:2,revision:'def'},{id:'reveal',revealable:true,kind:'reveal',position:3}];
const setup=(pageKind='collection')=>{
  const events=[];const visit=createVisit({entries,capture:(event,properties)=>events.push({event,properties}),visitId:'visit',pageKind,context:{build_id:'build',release_id:'release'}});
  return {visit,events};
};
test('source attribution has finite output and never copies raw campaigns, referrers or queries',()=>{
  const location=new URL('https://weirdstats.dev/?utm_source=reddit&utm_campaign=community&email=secret');
  assert.deepEqual(pageContext(location,'https://private.example/path?token=secret',390),{source_category:'social',campaign_code:'community',viewport_bucket:'narrow'});
  assert.deepEqual(pageContext(new URL('https://weirdstats.dev/?utm_source=user@example.com&utm_campaign=user@example.com'),'https://secret.example/user@example.com',1300),{source_category:'referral',campaign_code:'none',viewport_bucket:'wide'});
  assert.equal(pageContext(new URL('https://weirdstats.dev/'),'https://www.google.com/search?q=secret',900).source_category,'search');
  assert.equal(pageContext(new URL('https://weirdstats.dev/'),'https://google.com.evil.example/',900).source_category,'referral');
  assert.equal(pageContext(location,'',390).campaign_code,'community');
  assert.equal(pageContext(new URL('https://weirdstats.dev/'),'https://weirdstats.dev/discoveries/essay/',900).source_category,'internal');
});
test('immediate findings support continuation without inventing reveals or changing legacy measurement',()=>{
  const {visit,events}=setup();visit.view('essay');visit.view('finding');visit.view('essay');visit.view('finding');
  visit.reveal('essay');visit.reveal('finding');
  assert.equal(events.filter(e=>e.event==='discovery_revealed').length,0);
  assert.equal(events.filter(e=>e.event==='discovery_continued').length,0);
  assert.equal(events.filter(e=>e.event==='discovery_explored').length,2);
  assert.equal(events.filter(e=>e.event==='visit_started').length,1);
  assert.equal(events[0].properties.schema_version,1);
  assert.equal(events[0].properties.instrumentation_version,2);
});
test('page start identifies an article before any heading view; entry context preserves collection placement',()=>{
  const {visit,events}=setup('discovery');visit.start();visit.view('finding');
  assert.equal(events[0].properties.page_entry_id,'essay');
  assert.equal(events[1].properties.entry_position,2);
  assert.equal(events[1].properties.content_revision,'def');
  assert.equal(events[1].properties.build_id,'build');
});
test('editorial milestones and control values deduplicate per page, while different choices remain visible',()=>{
  const {visit,events}=setup();
  for(let i=0;i<20;i++)visit.record('discovery_interacted','essay',{control_id:'occupancy',control_value:'2'});
  visit.record('discovery_interacted','essay',{control_id:'occupancy',control_value:'4'});
  visit.record('reading_milestone','essay',{section_id:'closing'});visit.record('reading_milestone','essay',{section_id:'closing'});
  visit.record('discovery_revealed','essay');visit.record('source_clicked','missing');
  assert.equal(events.filter(e=>e.event==='discovery_interacted').length,2);
  assert.equal(events.filter(e=>e.event==='reading_milestone').length,1);
  assert.equal(events.filter(e=>e.event==='discovery_revealed').length,0);
  assert.equal(events.filter(e=>e.properties.entry_id==='missing').length,0);
});
test('technical errors cannot transmit messages; vitals preserve repeat metric IDs for latest-value reporting',()=>{
  const {visit,events}=setup();
  visit.error('script');visit.error('script');visit.error('secret error body');
  for(const value of [12,16])visit.vital({name:'INP',id:'v6-123-456',value,rating:'good',entries:[{url:'secret'}]});
  visit.vital({name:'INP',id:'secret',value:18,rating:'good'});
  visit.vital({name:'INP',id:'v6-123-456',value:NaN,rating:'good'});
  assert.equal(events.filter(e=>e.event==='technical_error').length,1);
  const vitals=events.filter(e=>e.event==='web_vital');assert.equal(vitals.length,2);
  assert.equal(vitals[1].properties.metric_value,16);assert(!JSON.stringify(events).includes('secret'));
  assert.equal(filterEvent({event:'$exception',properties:{message:'secret'}}),null);
  const filtered=filterEvent({event:'web_vital',properties:{metric_name:'INP',metric_value:16,message:'secret',entries:[{url:'secret'}],'$current_url':'secret','$raw_user_agent':'secret'}});
  assert.deepEqual(filtered.properties,{metric_name:'INP',metric_value:16});
});
test('individual tracking metadata keeps the collection order and approved content revision',()=>{
  const a={id:'older',treatment:{kind:'custom'},format:'deep-dive'},b={id:'newer',treatment:{kind:'reveal'}};
  const html=analyticsHead({enabled:true,projectToken:'phc_Test',apiHost:'https://us.i.posthog.com',publicOrigin:'https://example.com'},{entries:[a],catalog:[b,a],publicOrigin:'https://example.com',releaseId:'released',buildId:'build',revisions:new Map([['older',{digest:'abc'}]])});
  const config=JSON.parse(html.match(/id="analytics-config">(.*?)<\/script>/)[1]);
  assert.deepEqual(config.entries,[{id:'older',position:2,kind:'custom',format:'deep-dive',revision:'abc',revealable:false}]);
  assert.equal(config.releaseId,'released');assert.equal(config.buildId,'build');
});
