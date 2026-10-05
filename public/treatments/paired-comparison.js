'use strict';
(() => {
  const mounted=new WeakMap();
  function initialize(entry) {
    if(mounted.has(entry))return mounted.get(entry);
    const visual=entry.querySelector('.paired-visual');
    if(!visual||!window.WeirdDiscoveries)return ()=>{};
    const replayButton=entry.querySelector('.paired-replay');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let animations=[],settled=false;
    const motionAvailable=typeof visual.animate==='function';
    function prepare() {
      if(animations.length||settled||!motionAvailable)return;
      const animate=(element,frames,options)=>{
        const animation=element.animate(frames,{fill:'both',easing:'cubic-bezier(.2,.8,.2,1)',...options});
        animation.pause();animations.push(animation);
      };
      visual.querySelectorAll('.paired-ribbon').forEach(el=>animate(el,[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:700}));
      visual.querySelectorAll('.paired-object-field').forEach(field=>{
        const objects=[...field.querySelectorAll('.paired-object')];
        objects.forEach((el,i)=>animate(el,[{opacity:0,transform:'translateY(18px) rotate(-8deg) scale(.8)'},{opacity:1,transform:'none'}],{duration:450,delay:600+i/Math.max(1,objects.length-1)*900}));
      });
      const cycle=animations;
      let remaining=cycle.length;
      cycle.forEach(animation=>{animation.onfinish=()=>{if(--remaining===0&&animations===cycle)settled=true;};});
    }
    const finish=()=>{settled=true;animations.forEach(a=>a.cancel());animations=[];};
    const play=()=>{if(settled)return;prepare();animations.forEach(a=>a.play());};
    const pause=()=>animations.forEach(a=>a.pause());
    const replay=()=>{animations.forEach(a=>a.cancel());animations=[];settled=false;play();};
    const stop=window.WeirdDiscoveries.observeVisual(visual,{prepare,play,pause,finish,replay});
    const requestReplay=()=>{if(!replayButton.disabled)visual.dispatchEvent(new Event('discoveryreplay'));};
    const syncMotion=()=>{
      replayButton.disabled=!motionAvailable||reduced.matches||document.body.classList.contains('reduce-motion');
      if(replayButton.disabled)finish();
    };
    replayButton.hidden=!motionAvailable;
    replayButton.addEventListener('click',requestReplay);
    reduced.addEventListener('change',syncMotion);
    document.addEventListener('motionchange',syncMotion);
    syncMotion();
    const cleanup=()=>{stop();finish();replayButton.removeEventListener('click',requestReplay);reduced.removeEventListener('change',syncMotion);document.removeEventListener('motionchange',syncMotion);mounted.delete(entry);};
    mounted.set(entry,cleanup);return cleanup;
  }
  window.WeirdPairedComparison={initialize};
  const cleanups=[...document.querySelectorAll('[data-treatment="paired-comparison"]')].map(initialize);
  window.addEventListener('pagehide',event=>{if(!event.persisted)cleanups.forEach(cleanup=>cleanup());});
})();
