'use strict';
(() => {
 const mounted=new WeakMap();
 function initialize(entry) {
  if(mounted.has(entry))return mounted.get(entry);
  const visual=entry.querySelector('.runway-visual'),reveal=entry.querySelector('.discovery-reveal');
  if(!visual||!reveal||!window.WeirdDiscoveries)return ()=>{};
  const range=entry.querySelector('input[type="range"]'),replay=entry.querySelector('.runway-replay');
  const elements=Object.fromEntries(['magnetic','heading-value','painted-number','sign-number','sign-change','announcement','controls','plane','plane-shadow'].map(name=>[name,entry.querySelector('.runway-'+name)]));
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const from=Number(entry.dataset.from),to=Number(entry.dataset.to),bearing=Number(entry.dataset.trueBearing),duration=Number(entry.dataset.duration);
  const controller=new AbortController(),listen=(target,type,fn)=>target.addEventListener(type,fn,{signal:controller.signal});
  let landing=0;
  const landingDuration=3600;
  let progress=0,visible=false,automatic=true,frame=0,last=null,number=Math.round(from/10)||36;
  const reduced=()=>media.matches||document.body.classList.contains('reduce-motion');
  const paint=p=>{
   progress=Math.max(0,Math.min(1,p));const heading=from+(to-from)*progress,next=Math.round(heading/10)||36;
   visual.style.setProperty('--drift',progress);
   elements['magnetic'].setAttribute('transform',`rotate(${bearing-heading} 300 328)`);
   elements['heading-value'].textContent=heading.toFixed(1);
   elements['painted-number'].textContent=String(next);
   elements['sign-number'].textContent=String(next);
   elements['sign-change'].hidden=next===(Math.round(from/10)||36);
   range.value=String(Math.round(progress*100));range.setAttribute('aria-valuetext',`${heading.toFixed(1)} degrees; runway ${next}`);
   if(next!==number&&reveal.open)elements['announcement'].textContent=`Runway ${next}. The pavement has not moved.`;
   number=next;
  };
  const paintLanding=p=>{
   landing=Math.max(0,Math.min(1,p));
   const approach=Math.min(1,landing/.6),roll=Math.max(0,(landing-.6)/.4);
   const y=-100+380*approach+170*(1-(1-roll)**2),scale=1.25-.65*approach;
   const altitude=1-approach;
   elements.plane.setAttribute('transform',`translate(300 ${y}) scale(${scale})`);
   elements.plane.setAttribute('opacity',landing>0?'1':'0');
   elements['plane-shadow'].setAttribute('transform',`translate(${303+45*altitude} ${y+4+32*altitude}) scale(.6)`);
   elements['plane-shadow'].setAttribute('opacity',landing>0?String(.18+.22*approach):'0');
  };
  const stop=()=>{cancelAnimationFrame(frame);frame=0;last=null;};
  const tick=now=>{
   if(last!==null){
    const elapsed=now-last;
    if(progress<1)paint(progress+elapsed/duration);
    else paintLanding(landing+elapsed/landingDuration);
   }
   last=now;
   if(progress<1||landing<1)frame=requestAnimationFrame(tick);else{frame=0;last=null;}
  };
  const play=()=>{if(!frame&&visible&&reveal.open&&((automatic&&progress<1)||(progress===1&&landing<1))&&!document.hidden&&!reduced())frame=requestAnimationFrame(tick);};
  const finish=()=>{stop();if(reveal.open){paint(1);paintLanding(1);}};
  const sync=()=>{replay.disabled=reduced();if(reduced())finish();else play();};
  const stopObserver=window.WeirdDiscoveries.observeVisual(visual,{play:()=>{visible=true;play();},pause:()=>{visible=false;stop();},finish});
  elements['controls'].hidden=false;
  listen(reveal,'toggle',()=>{if(!reveal.open)stop();else sync();});
  listen(range,'input',()=>{stop();automatic=false;paint(Number(range.value)/100);paintLanding(reduced()&&progress===1?1:0);play();});
  listen(replay,'click',()=>{if(replay.disabled)return;stop();automatic=true;paint(0);paintLanding(0);play();});
  listen(media,'change',()=>document.dispatchEvent(new Event('motionchange')));listen(document,'motionchange',sync);
  sync();
  const cleanup=()=>{stopObserver();stop();controller.abort();mounted.delete(entry);};
  mounted.set(entry,cleanup);return cleanup;
 }
 window.WeirdRunway={initialize};
 const cleanups=[...document.querySelectorAll('[data-treatment="bearing-shift"]')].map(initialize);
 window.addEventListener('pagehide',event=>{if(!event.persisted)cleanups.forEach(cleanup=>cleanup());});
})();
