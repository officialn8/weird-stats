// Bind known controls without changing the approved exhibits or their content/asset pins.
export function observeEditorial({document,window,entries,visit}) {
  const roots=entries.map(entry=>({entry,root:document.getElementById(entry.id)})).filter(item=>item.root);
  const cleanups=[],targets=new Map(),timers=new Map(),visible=new Set();
  const listen=(node,event,callback,options)=>{node.addEventListener(event,callback,options);cleanups.push(()=>node.removeEventListener(event,callback,options));};
  const record=(event,id,extra)=>{if(!document.hidden)visit.record(event,id,extra);};
  function schedule(target){
    if(document.hidden||timers.has(target)||!visible.has(target))return;
    timers.set(target,window.setTimeout(()=>{timers.delete(target);if(!document.hidden&&visible.has(target))targets.get(target).run();},targets.get(target).delay));
  }
  const observer=new window.IntersectionObserver(records=>{
    for(const item of records){
      if(item.isIntersecting&&item.intersectionRatio>=.5){visible.add(item.target);schedule(item.target);}
      else{visible.delete(item.target);window.clearTimeout(timers.get(item.target));timers.delete(item.target);}
    }
  },{threshold:[0,.5]});
  const watch=(target,run,delay)=>{if(target){targets.set(target,{run,delay});observer.observe(target);}};
  const buttons=[
    ['[data-crunch]','listen',(node)=>node.dataset.crunch],
    ['[data-crunch-guess]','sound_guess',(node,root)=>String([...root.querySelectorAll('[data-crunch-guess]')].indexOf(node))],
    ['[data-scale]','painting_scale',(node)=>node.dataset.scale],
    ['#replay-journey','journey_replay',()=> 'play'],
    ['[data-trip-load]','occupancy',(node)=>node.dataset.tripLoad],
    ['[data-speed-preset]','speed_preset',(node)=>node.dataset.speedPreset],
    ['[data-city-view]','neighborhood_view',(node)=>node.dataset.cityView],
    ['[data-scene]','prison_view',(node)=>node.dataset.scene],
    ['[data-marker-rate]','estimate_bound',(node,root)=>String([...root.querySelectorAll('[data-marker-rate]')].indexOf(node))],
    ['[data-view]','chart_view',(node,root)=>String([...root.querySelectorAll('[data-view]')].indexOf(node))],
    ['[data-guess],.coin-choice','guess',(node,root)=>String([...root.querySelectorAll('[data-guess],.coin-choice')].indexOf(node))],
  ];
  const ranges=[['[data-kinetic-mass]','vehicle_mass'],['[data-kinetic-speed]','vehicle_speed'],['.death-view-control input','prison_angle']];
  for(const {entry,root} of roots){
    watch(root.querySelector('h1,h2'),()=>visit.view(entry.id),1000);
    // Small headings/labels can reach 50% even when their containing article is taller than the viewport.
    const milestones=entry.format==='deep-dive' ? [
      ['#trip-space h3','space'],['#trip-energy h3','energy'],['#trip-resources h3','mass_speed'],
      ['#trip-neighborhood h3','neighborhood'],['.trip-closing h3','closing'],
    ] : [['.death-graphic h3','illustration'],['.death-context h3','context']];
    for(const [selector,section_id] of milestones)watch(root.querySelector(selector),()=>record('reading_milestone',entry.id,{section_id}),2000);
    for(const [selector,control_id,value] of buttons)for(const node of root.querySelectorAll(selector)){
      listen(node,'click',()=>record('discovery_interacted',entry.id,{control_id,control_value:value(node,root)}));
    }
    // change commits a pointer gesture/key adjustment; bucket and deduplicate rather than streaming input.
    for(const [selector,control_id] of ranges)for(const node of root.querySelectorAll(selector)){
      listen(node,'change',()=>{
        const fraction=(Number(node.value)-Number(node.min))/(Number(node.max)-Number(node.min));
        if(Number.isFinite(fraction))record('discovery_interacted',entry.id,{control_id,control_value:String(Math.max(0,Math.min(4,Math.floor(fraction*5))))});
      });
    }
    for(const details of root.querySelectorAll('details:not(.discovery-reveal)'))listen(details,'toggle',()=>{
      if(details.open)record('evidence_opened',entry.id,{evidence_kind:details.matches('.death-uncertainty')?'uncertainty':'sources'});
    });
    for(const link of root.querySelectorAll('.trip-open'))listen(link,'click',()=>record('deep_dive_opened',entry.id,{}));
    const sourceKeys=new Map();
    for(const link of root.querySelectorAll('a[href]')){
      let url;try{url=new URL(link.href,document.baseURI);}catch{continue;}
      const download=link.hasAttribute('download')||url.pathname.endsWith('.csv');
      if(!download&&(!['https:','http:'].includes(url.protocol)||url.origin===window.location.origin))continue;
      // IDs repeat for duplicate links to a source. No URL or anchor text is captured.
      const key=url.origin+url.pathname;
      if(!sourceKeys.has(key))sourceKeys.set(key,`source-${sourceKeys.size+1}`);
      const source_id=sourceKeys.get(key),source_type=download?'data':url.pathname.endsWith('.pdf')?'paper':'citation';
      listen(link,'click',()=>record('source_clicked',entry.id,{source_id,source_type}));
      listen(link,'auxclick',event=>{if(event.button===1)record('source_clicked',entry.id,{source_id,source_type});});
    }
  }
  listen(document,'visibilitychange',()=>{
    if(!document.hidden){visit.start();visible.forEach(schedule);}
    else{timers.forEach(timer=>window.clearTimeout(timer));timers.clear();}
  });
  for(const link of document.querySelectorAll('.discovery-onward a,.trip-next'))listen(link,'click',()=>{if(!document.hidden)visit.onward();});
  const cleanup=()=>{observer.disconnect();timers.forEach(timer=>window.clearTimeout(timer));cleanups.forEach(fn=>fn());};
  listen(window,'pagehide',event=>{if(!event.persisted)cleanup();});
  return cleanup;
}
