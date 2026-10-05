// Only explicit events. A visit ID lives in memory and dies on a full navigation.
const events=new Set(['visit_started','discovery_viewed','discovery_revealed','discovery_continued','discovery_share','collection_opened']);
const properties=new Set(['token','distinct_id','$lib','$lib_version','$process_person_profile','visit_id','page_kind','entry_id','from_entry_id','revealed_count','available_reveals','method','outcome','schema_version','qa']);
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
export function createVisit({entries,capture,visitId,pageKind,qa=false}) {
  const ids=new Set(entries.map(e=>e.id)),revealable=new Set(entries.filter(e=>e.revealable).map(e=>e.id));
  const viewed=new Set(),revealed=new Set(),continued=new Set();
  let started=false,lastRevealed=null;
  const send=(event,extra={})=>capture(event,{visit_id:visitId,page_kind:pageKind,available_reveals:revealable.size,schema_version:1,qa,...extra});
  const start=()=>{if(!started){started=true;send('visit_started');}};
  return {
    start,
    view(id){
      if(!ids.has(id))return;
      start();
      if(!viewed.has(id)){viewed.add(id);send('discovery_viewed',{entry_id:id});}
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
    onward(){start();send('collection_opened');},
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
    if(client){try{client.capture(event,properties);}catch{}}else if(pending.length<100)pending.push([event,properties]);
  };
  const visit=createVisit({entries:config.entries,capture,visitId:crypto.randomUUID(),pageKind:location.pathname==='/'?'collection':'discovery',qa});
  // These callbacks never block an interaction if analytics fails or is blocked.
  window.WeirdAnalytics={
    reveal:id=>{if(!document.hidden)visit.reveal(id);},
    share:(...args)=>{if(!document.hidden)visit.share(...args);},
  };
  const targets=new Map(),timers=new Map(),visible=new Set();
  function schedule(target){
    if(document.hidden||timers.has(target)||!visible.has(target))return;
    timers.set(target,setTimeout(()=>{timers.delete(target);if(!document.hidden&&visible.has(target))visit.view(targets.get(target));},1000));
  }
  const observer=new IntersectionObserver(records=>{
    for(const record of records){
      if(record.isIntersecting&&record.intersectionRatio>=.5){visible.add(record.target);schedule(record.target);}
      else{visible.delete(record.target);clearTimeout(timers.get(record.target));timers.delete(record.target);}
    }
  },{threshold:[0,.5]});
  for(const {id} of config.entries){
    const target=document.getElementById(id)?.querySelector('h1,h2');
    if(target){targets.set(target,id);observer.observe(target);}
  }
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden){visit.start();visible.forEach(schedule);}
    else{timers.forEach(clearTimeout);timers.clear();}
  });
  document.querySelector('.discovery-onward a')?.addEventListener('click',()=>visit.onward());
  if(!document.hidden)visit.start();
  try {
    const {default:posthog}=await import('/vendor/posthog.mjs');
    client=posthog.init(config.projectToken,posthogOptions(config));
    for(const [event,properties] of pending)client.capture(event,properties);
  } catch { /* The site remains fully functional without analytics. */ }
  pending.length=0;
}
if(typeof document!=='undefined')boot().catch(()=>{});
