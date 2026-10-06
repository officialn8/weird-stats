import {pageContext} from './analytics-context.js';
import {observeEditorial} from './analytics-dom.js';
import {observeHealth} from './analytics-health.js';
// Only explicit events. A visit ID lives in memory and dies on a full navigation.
const events=new Set(['visit_started','discovery_viewed','discovery_revealed','discovery_continued','discovery_share','collection_opened','discovery_interacted','deep_dive_opened','reading_milestone','evidence_opened','source_clicked','discovery_explored','visualization_status','technical_error','web_vital']);
const properties=new Set(['token','distinct_id','$lib','$lib_version','$process_person_profile','visit_id','page_kind','entry_id','from_entry_id','revealed_count','available_reveals','method','outcome','schema_version','qa','instrumentation_version','page_entry_id','entry_position','treatment_kind','entry_format','content_revision','release_id','build_id','source_category','campaign_code','viewport_bucket','control_id','control_value','section_id','evidence_kind','source_id','source_type','visualization_id','status','error_kind','metric_name','metric_value','metric_rating','metric_id']);
export function filterEvent(event) {
  if(!event||!events.has(event.event))return null;
  return {...event,properties:Object.fromEntries(Object.entries(event.properties??{}).filter(([key])=>properties.has(key)))};
}
// The collection and released discovery pages: the only pages that track, and the only links QA marking follows.
const trackedPath=/^\/(?:discoveries\/[a-z][a-z0-9-]*\/)?$/;
export function mayTrack(config,location,navigator,privatePage=false) {
  return Boolean(config?.enabled&&!privatePage&&location.origin===config.publicOrigin&&trackedPath.test(location.pathname)&&
    navigator.doNotTrack!=='1'&&!navigator.globalPrivacyControl&&!navigator.webdriver);
}
// Returns href carrying qa=1 when it leads to a tracked page on pageUrl's origin; any other value comes back unchanged.
export function qaHref(href,pageUrl) {
  if(typeof href!=='string'||!href||href.startsWith('#'))return href;
  let page,url;
  try{page=new URL(pageUrl);url=new URL(href,page);}catch{return href;}
  if(url.origin!==page.origin||!trackedPath.test(url.pathname))return href;
  const marks=url.searchParams.getAll('qa');
  if(marks.length===1&&marks[0]==='1')return href;
  url.searchParams.set('qa','1');
  return /^[a-z][a-z\d+.-]*:/i.test(href)?url.href:url.pathname+url.search+url.hash;
}
// A qa=1 page keeps the marker on its own page links (new tabs included) and says so. Nothing is stored or sent.
export function markQA(document,location) {
  if(new URLSearchParams(location.search).get('qa')!=='1')return false;
  for(const link of document.querySelectorAll('a[href]')){
    const href=link.getAttribute('href'),marked=qaHref(href,location.href);
    if(marked!==href)link.setAttribute('href',marked);
  }
  document.title='QA · '+document.title;
  const strip=document.createElement('aside');
  strip.className='draft-banner';
  strip.textContent='QA test mode · This visit is marked as a test and not counted. Remove ?qa=1 from the address to leave.';
  document.body.prepend(strip);
  return true;
}
export function posthogOptions(config) {
  return {
    api_host:config.apiHost,
    persistence:'memory',disable_persistence:true,
    person_profiles:'never',ip:false,respect_dnt:true,
    autocapture:false,capture_pageview:false,capture_pageleave:false,
    capture_exceptions:false,capture_performance:false,capture_dead_clicks:false,rageclick:false,
    disable_session_recording:true,disable_surveys:true,advanced_disable_flags:true,
    disable_external_dependency_loading:true,
    before_send:filterEvent,
  };
}
export function createVisit({entries,capture,visitId,pageKind,qa=false,context={}}) {
  const ids=new Set(entries.map(e=>e.id)),revealable=new Set(entries.filter(e=>e.revealable).map(e=>e.id));
  const viewed=new Set(),revealed=new Set(),continued=new Set();
  let started=false,lastRevealed=null,lastViewed=null;
  const recorded=new Set();
  const catalog=new Map(entries.map((entry,index)=>[entry.id,{entry_position:entry.position??index+1,treatment_kind:entry.kind??'unknown',entry_format:entry.format??'discovery',content_revision:entry.revision??'unknown'}]));
  const send=(event,extra={})=>capture(event,{...context,visit_id:visitId,page_kind:pageKind,page_entry_id:pageKind==='discovery'?entries[0]?.id:'collection',available_reveals:revealable.size,schema_version:1,instrumentation_version:2,qa,...catalog.get(extra.entry_id),...extra});
  const once=(event,extra)=>{const key=event+JSON.stringify(extra);if(recorded.has(key))return;recorded.add(key);start();send(event,extra);};
  const start=()=>{if(!started){started=true;send('visit_started');}};
  return {
    start,
    view(id){
      if(!ids.has(id))return;
      start();
      if(!viewed.has(id)){viewed.add(id);send('discovery_viewed',{entry_id:id});}
      if(lastViewed&&lastViewed!==id)once('discovery_explored',{entry_id:id,from_entry_id:lastViewed});
      lastViewed=id;
      if(lastRevealed&&entries.findIndex(e=>e.id===id)>entries.findIndex(e=>e.id===lastRevealed)&&!continued.has(lastRevealed+'>'+id)){
        continued.add(lastRevealed+'>'+id);send('discovery_continued',{entry_id:id,from_entry_id:lastRevealed});
      }
    },
    reveal(id){
      if(!revealable.has(id)||revealed.has(id))return;
      start();revealed.add(id);lastRevealed=id;
      send('discovery_revealed',{entry_id:id,revealed_count:revealed.size});
    },
    share(id,method,outcome){
      if(!ids.has(id)||!['button','native','clipboard','manual'].includes(method)||!['intent','completed','cancelled','fallback'].includes(outcome))return;
      start();send('discovery_share',{entry_id:id,method,outcome});
    },
    onward(){once('collection_opened',{});},
    record(event,id,extra={}) {
      if(!ids.has(id)||!['discovery_interacted','deep_dive_opened','reading_milestone','evidence_opened','source_clicked','visualization_status'].includes(event))return;
      once(event,{entry_id:id,...extra});
    },
    error(kind){if(['script','resource','promise'].includes(kind))once('technical_error',{error_kind:kind});},
    vital(metric){
      if(!started)return;
      if(!['LCP','INP','CLS'].includes(metric.name)||!Number.isFinite(metric.value)||metric.value<0)return;
      if(!['good','needs-improvement','poor'].includes(metric.rating)||!/^v[0-9]+-[0-9]+-[0-9]+$/.test(metric.id))return;
      start();send('web_vital',{metric_name:metric.name,metric_value:Math.round(metric.value*1000)/1000,metric_rating:metric.rating,metric_id:metric.id});
    },
  };
}

async function boot() {
  // Before the tracking gate, so local and preview builds show QA marking too.
  const qa=markQA(document,location);
  const node=document.querySelector('#analytics-config');
  if(!node)return;
  const config=JSON.parse(node.textContent);
  if(!mayTrack(config,location,navigator,Boolean(document.querySelector('meta[name="robots"][content*="noindex"]'))))return;
  const pending=[];
  let client;
  const capture=(event,properties)=>{
    if(client){try{client.capture(event,properties,{send_instantly:true,transport:'sendBeacon'});}catch{}}else if(pending.length<100)pending.push([event,properties]);
  };
  const visit=createVisit({entries:config.entries,capture,visitId:crypto.randomUUID(),pageKind:location.pathname==='/'?'collection':'discovery',qa,context:{...pageContext(location,document.referrer,window.innerWidth),release_id:config.releaseId,build_id:config.buildId}});
  // These callbacks never block an interaction if analytics fails or is blocked.
  window.WeirdAnalytics={
    reveal:id=>{if(!document.hidden)visit.reveal(id);},
    // Native share/clipboard promises may settle while the browser is hidden.
    share:(...args)=>visit.share(...args),
  };
  observeEditorial({document,window,entries:config.entries,visit});
  observeHealth({document,window,entries:config.entries,visit});
  if(!document.hidden)visit.start();
  try {
    const {default:posthog}=await import('/vendor/posthog.mjs');
    client=posthog.init(config.projectToken,posthogOptions(config));
    for(const [event,properties] of pending)client.capture(event,properties,{send_instantly:true,transport:'sendBeacon'});
  } catch { /* The site remains fully functional without analytics. */ }
  pending.length=0;
}
if(typeof document!=='undefined')boot().catch(()=>{});
