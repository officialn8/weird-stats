'use strict';
const $=selector=>document.querySelector(selector);
const story=$('#copper'), question=$('.copper-question'), answer=$('.copper-answer');
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
const darkQuery=matchMedia('(prefers-color-scheme: dark)');
let manualMotion=false, journeyTimers=[];
const reduced=()=>manualMotion||motionQuery.matches;
const pile=$('#penny-pile');
for(let i=0;i<60;i++){
  const img=document.createElement('img');img.src='assets/penny.webp';img.alt='';img.width=500;img.height=500;
  img.style.setProperty('--i',i);img.style.setProperty('--launch-x',(-85-(i%6)*24)+'px');img.style.setProperty('--launch-y',(120-Math.floor(i/6)*25)+'px');img.style.setProperty('--turn',((i*37)%50-25)+'deg');pile.append(img);
}
let lastChoice = $('#reveal');
function reveal(value, trigger) {
  if (trigger) lastChoice = trigger;
  if (value) {
    const picked = trigger?.dataset.coin;
    $('#coin-feedback').textContent = picked === 'penny'
      ? 'You picked the penny. It’s the nickel.'
      : picked === 'nickel' ? 'You picked the nickel. Here’s how much more.'
      : 'The nickel. And it’s not even close.';
  }
  question.hidden = value;
  answer.hidden = !value;
  story.classList.toggle('revealed', value);
  (value ? $('#copper-result') : lastChoice).focus({preventScroll:true});
  if (value && story.getBoundingClientRect().top < 0) story.scrollIntoView({block:'start', behavior:reduced() ? 'instant' : 'smooth'});
}
$('#reveal').addEventListener('click', event => reveal(true, event.currentTarget));
$$('.coin-choice').forEach(button => button.addEventListener('click', event => reveal(true, event.currentTarget)));
$('#again').addEventListener('click', () => reveal(false));
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target);}
}),{threshold:.18});
$$('.mail-intro').forEach(el=>observer.observe(el));
function $$(selector){return [...document.querySelectorAll(selector)]}
function stopJourney(){journeyTimers.forEach(clearTimeout);journeyTimers=[];$('.journey-score').classList.remove('playing');$('#replay-journey').disabled=false;}
function playJourney(){
  stopJourney();const bars=$$('.hour-marks i');bars.forEach(el=>el.classList.remove('arrived'));
  if(reduced()){bars.forEach(el=>el.classList.add('arrived'));$('#journey-status').textContent='3 hours down. 5 hours back. 8 hours total.';return;}
  $('.journey-score').classList.add('playing');$('#replay-journey').disabled=true;
  $('#journey-status').textContent='Heading down to Supai…';
  bars.forEach((bar,i)=>journeyTimers.push(setTimeout(()=>{
    bar.classList.add('arrived');
    $('#journey-status').textContent=i<2?`${i+1} hours into the descent…`:i===2?'3 hours. The mail reaches Supai.':i<7?`${i-2} hours into the return…`:'8 hours total. Back at the rim.';
    if(i===7){$('#replay-journey').disabled=false;$('#replay-journey').innerHTML='Watch it again <span aria-hidden="true">↺</span>';}
  },(i+1)*650)));
}
$('#replay-journey').addEventListener('click',playJourney);
const journeyObserver=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){playJourney();journeyObserver.disconnect()}},{threshold:.65});
journeyObserver.observe($('.journey-score'));
function syncMotion(){document.body.classList.toggle('reduce-motion',reduced());$('#motion').textContent=reduced()?'Motion off':'Motion on';$('#motion').setAttribute('aria-pressed',String(reduced()));if(reduced())stopJourney();}
$('#motion').addEventListener('click',()=>{manualMotion=!manualMotion;syncMotion()});motionQuery.addEventListener('change',syncMotion);syncMotion();
function theme(){document.documentElement.dataset.theme=$('#theme').value==='system'?(darkQuery.matches?'dark':'light'):$('#theme').value;}
try{const value=localStorage.getItem('weird-stats-appearance');if(['system','light','dark'].includes(value))$('#theme').value=value;}catch{}
$('#theme').addEventListener('change',()=>{theme();try{localStorage.setItem('weird-stats-appearance',$('#theme').value)}catch{}});darkQuery.addEventListener('change',theme);theme();
document.body.classList.add('motion-ready');
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopJourney()});

// Pause ambient object movement outside the viewport; pointer response is desktop-only.
const duet=$('.coin-duet');
const visibilityObserver=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('is-visible',e.isIntersecting)),{threshold:.1});
visibilityObserver.observe(duet);
const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
let pointerFrame=0,pointerBounds=null;
duet.addEventListener('pointerenter',()=>{pointerBounds=duet.getBoundingClientRect()});
duet.addEventListener('pointermove',event=>{
 if(reduced()||!finePointer.matches||!pointerBounds)return;
 const x=((event.clientX-pointerBounds.left)/pointerBounds.width-.5)*22;
 const y=((event.clientY-pointerBounds.top)/pointerBounds.height-.5)*16;
 cancelAnimationFrame(pointerFrame);
 pointerFrame=requestAnimationFrame(()=>{duet.style.setProperty('--pointer-x',x+'px');duet.style.setProperty('--pointer-y',y+'px')});
});
duet.addEventListener('pointerleave',()=>{cancelAnimationFrame(pointerFrame);duet.style.setProperty('--pointer-x','0px');duet.style.setProperty('--pointer-y','0px');pointerBounds=null});
document.addEventListener('visibilitychange',()=>{duet.classList.toggle('is-paused',document.hidden)});

// The browser owns continuous zoom progress. Buttons offer direct, keyboard-accessible stops.
const scaleJourney = $('#scale-journey');
const scaleStops = [0, 0.51, 0.95];
$$('[data-scale]').forEach(button => button.addEventListener('click', () => {
  const index = Number(button.dataset.scale);
  if (getComputedStyle($('.scale-sticky')).position === 'sticky') {
    const rect = scaleJourney.getBoundingClientRect();
    const travel = scaleJourney.offsetHeight - $('.scale-sticky').offsetHeight;
    window.scrollTo({top: window.scrollY + rect.top + travel * scaleStops[index], behavior: reduced() ? 'instant' : 'smooth'});
  } else {
    $$('.scale-panel')[index].scrollIntoView({block:'center', behavior:'instant'});
  }
}));
