// Only fixed error categories and numeric metrics leave the browser. No messages, stacks or resource URLs.
export function observeHealth({document,window,entries,visit,loadVitals=()=>import('/vendor/web-vitals.js')}) {
  const cleanups=[];
  const listen=(node,event,callback,options)=>{node.addEventListener(event,callback,options);cleanups.push(()=>node.removeEventListener(event,callback,options));};
  listen(window,'error',event=>{if(!document.hidden)visit.error(event.target&&event.target!==window?'resource':'script');},true);
  listen(window,'unhandledrejection',()=>{if(!document.hidden)visit.error('promise');});
  for(const entry of entries){
    const root=document.getElementById(entry.id);
    if(!root)continue;
    for(const [selector,visualization_id] of [['.death-graphic','prison'],['.trip-neighborhood','neighborhood']]){
      const figure=root.querySelector(selector),canvas=figure?.querySelector('canvas');
      if(!canvas)continue;
      let near=false,timer=null,ready=false;
      const pending=new Set();
      const flush=()=>{if(!document.hidden){for(const status of pending)visit.record('visualization_status',entry.id,{visualization_id,status});pending.clear();}};
      const record=status=>{pending.add(status);flush();};
      listen(document,'visibilitychange',flush);
      const check=()=>{if(!canvas.hidden){ready=true;window.clearTimeout(timer);record('ready');}};
      const mutation=new window.MutationObserver(check);mutation.observe(canvas,{attributes:true,attributeFilter:['hidden']});
      const schedule=()=>{
        window.clearTimeout(timer);
        if(near&&!document.hidden&&!ready)timer=window.setTimeout(()=>{if(!document.hidden&&near&&canvas.hidden)record('fallback_after_10s');},10000);
      };
      const visibility=new window.IntersectionObserver(items=>{near=items.some(item=>item.isIntersecting);schedule();});visibility.observe(figure);
      listen(document,'visibilitychange',schedule);
      listen(canvas,'webglcontextlost',()=>record('context_lost'));
      check();
      cleanups.push(()=>{mutation.disconnect();visibility.disconnect();window.clearTimeout(timer);});
    }
  }
  // Start observers early; final reports also arrive on visibility change. Import only after the privacy gate.
  loadVitals().then(({onLCP,onINP,onCLS})=>{for(const observe of [onLCP,onINP,onCLS])observe(metric=>visit.vital(metric));}).catch(()=>{});
  listen(window,'pagehide',event=>{if(!event.persisted)cleanups.forEach(fn=>fn());});
}
