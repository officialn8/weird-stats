'use strict';
(() => {
  const mounted=new WeakMap();
  function initialize(entry) {
    if(mounted.has(entry)) return mounted.get(entry);
    const controller=new AbortController();
    const listen=(target,type,fn)=>target?.addEventListener(type,fn,{signal:controller.signal});
    const controls=entry.querySelector('.discovery-chart .data-controls');
    if(controls) {
      controls.hidden=false;
      controls.querySelectorAll('[data-view]').forEach(button=>listen(button,'click',()=>{
        controls.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
        entry.querySelectorAll('.data-view').forEach(view=>view.hidden=view.id!==button.dataset.view);
        const active=entry.querySelector('.data-view:not([hidden])');
        entry.querySelector('.data-status').textContent=active.querySelector('.data-unit').textContent+'. '+active.querySelector('.data-axis').textContent;
      }));
    }
    const choices=entry.querySelector('.discovery-guess');
    if(choices) {
      choices.hidden=false;
      choices.querySelectorAll('[data-guess]').forEach(button=>listen(button,'click',()=>{
        choices.querySelectorAll('[data-guess]').forEach(choice=>choice.setAttribute('aria-pressed',String(choice===button)));
        entry.querySelector('.guess-status').textContent=`You chose ${button.textContent}. Reveal when you’re ready.`;
        entry.querySelectorAll('[data-feedback]').forEach(feedback=>feedback.hidden=feedback.dataset.feedback!==button.dataset.guess);
      }));
    }
    // Native details preserves a complete keyboard/no-JS path. Guessing never opens it.
    const reveal=entry.querySelector('.discovery-reveal');
    listen(reveal,'toggle',()=>{
      entry.dispatchEvent(new CustomEvent('discoveryreveal',{detail:{open:reveal.open}}));
      if(reveal.open)window.WeirdAnalytics?.reveal(entry.id);
    });
    const cleanup=()=>{controller.abort();mounted.delete(entry);};
    mounted.set(entry,cleanup);return cleanup;
  }
  function observeVisual(visual,{prepare=()=>{},play=()=>{},pause=()=>{},finish=()=>{},replay}={}) {
    let visible=false,prepared=false,active=false;
    const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('reduce-motion');
    const sync=()=>{
      const shouldPlay=visible&&!document.hidden&&!reduced();
      if(reduced()) finish();
      if(shouldPlay&&!active)play();
      if(!shouldPlay&&active)pause();
      active=shouldPlay;
    };
    const near=new IntersectionObserver(items=>{if(items.some(i=>i.isIntersecting)&&!prepared){prepared=true;prepare();near.disconnect();}},{rootMargin:'400px'});
    const visibility=new IntersectionObserver(items=>{visible=items[0].isIntersecting&&items[0].intersectionRatio>=.35;sync();},{threshold:[0,.35]});
    near.observe(visual);visibility.observe(visual);
    document.addEventListener('visibilitychange',sync);document.addEventListener('motionchange',sync);
    const replayAction=()=>{if(visible&&!document.hidden){if(reduced())finish();else replay?.();}};
    visual.addEventListener('discoveryreplay',replayAction);
    return ()=>{near.disconnect();visibility.disconnect();pause();document.removeEventListener('visibilitychange',sync);document.removeEventListener('motionchange',sync);visual.removeEventListener('discoveryreplay',replayAction);};
  }
  window.WeirdDiscoveries={initialize,observeVisual};
  const cleanups=[...document.querySelectorAll('.data-discovery')].map(initialize);
  // A bfcache page keeps its controllers and revealed state when restored.
  window.addEventListener('pagehide',event=>{if(!event.persisted)cleanups.forEach(cleanup=>cleanup());});
})();
