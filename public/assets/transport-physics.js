// Idealized translational energy. This is not a force or injury model.
export function kineticScenario(massKg,speedMph) {
 if(!Number.isFinite(massKg)||massKg<=0||!Number.isFinite(speedMph)||speedMph<0)throw new RangeError('Mass must be positive and speed nonnegative.');
 const speedMps=speedMph*.44704,gravity=9.81;
 return {speedMps,energyJ:.5*massKg*speedMps**2,heightM:speedMps**2/(2*gravity),dropSeconds:speedMps/gravity,relativeTo20:(speedMph/20)**2};
}
export function kineticUSScenario(weightLb,speedMph) {
 const result=kineticScenario(weightLb*.45359237,speedMph);
 return {...result,heightFt:result.heightM/.3048,energyFtLb:result.energyJ/1.3558179483314004};
}
export function mountKineticDemo(scene,reduced) {
 const demo=scene.querySelector('[data-kinetic-demo]');if(!demo)return;
 const mass=demo.querySelector('[data-kinetic-mass]'),speed=demo.querySelector('[data-kinetic-speed]');
 const mover=demo.querySelector('[data-drop-motion]'),position=demo.querySelector('[data-drop-position]');
 const button=demo.querySelector('[data-drop-play]'),status=demo.querySelector('[data-physics-status]');
 const number=new Intl.NumberFormat('en-US',{maximumFractionDigits:0});
 let current,animation;
 function resetDrop() {animation?.cancel();animation=null;button.textContent='See the equivalent drop';}
 function update(announce=false) {
  resetDrop();current=kineticUSScenario(Number(mass.value),Number(speed.value));
  const height=current.heightFt.toFixed(1),energy=number.format(current.energyFtLb),y=450-current.heightFt*400/140;
  const set=(selector,value)=>demo.querySelectorAll(selector).forEach(el=>el.textContent=value);
  set('[data-kinetic-mass-value]',number.format(mass.value));set('[data-kinetic-speed-value]',speed.value);
  set('[data-kinetic-energy]',energy);
  set('[data-kinetic-height]',height);set('[data-kinetic-ratio]',Number(current.relativeTo20.toFixed(2)));
  set('[data-drop-mass]',`${number.format(mass.value)} lb`);
  set('[data-kinetic-height-rounded]',Math.round(current.heightFt));
  const tons=Number(mass.value)/2000;
  set('[data-kinetic-tons]',`${tons} US ${tons===1?'ton':'tons'}`);
  [mass,speed].forEach(input=>input.style.setProperty('--range-progress',`${(input.value-input.min)/(input.max-input.min)*100}%`));
  const stories=current.heightFt/10;
  set('[data-kinetic-stories]',stories<1?'Less than one story high.':`Roughly ${Math.round(stories)} ${Math.round(stories)===1?'story':'stories'} high.`);
  demo.querySelector('[data-drop-building-fill]').setAttribute('y',String(y));
  demo.querySelector('[data-drop-building-fill]').setAttribute('height',String(450-y));
  demo.querySelector('[data-drop-level]').setAttribute('d',`M105 ${y}H450`);
  position.setAttribute('transform',`translate(325 ${y})`);
  demo.querySelector('[data-drop-guide]').setAttribute('d',`M460 ${y}V450 M453 ${y}h14 M453 450h14`);
  demo.querySelector('[data-drop-guide-label]').setAttribute('y',String((y+450)/2+5));
  demo.querySelector('[data-drop-guide-label]').textContent=`${height} ft`;
  mass.setAttribute('aria-valuetext',`${number.format(mass.value)} pounds of vehicle weight`);
  speed.setAttribute('aria-valuetext',`${speed.value} miles per hour`);
  demo.querySelectorAll('[data-speed-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.speedPreset===speed.value)));
  if(announce)status.textContent=`${number.format(mass.value)} pounds at ${speed.value} miles per hour: equivalent in energy to dropping that vehicle ${height} feet.`;
 }
 [mass,speed].forEach(input=>{input.addEventListener('input',()=>update());input.addEventListener('change',()=>update(true));});
 demo.querySelectorAll('[data-speed-preset]').forEach(preset=>preset.addEventListener('click',()=>{speed.value=preset.dataset.speedPreset;update(true);}));
 button.addEventListener('click',()=>{
  resetDrop();const distance=current.heightFt*400/140;
  if(reduced.matches||document.body.classList.contains('reduce-motion')) {
   status.textContent=`A ${number.format(mass.value)}-pound vehicle falling ${current.heightFt.toFixed(1)} feet reaches ${speed.value} miles per hour just before the ground. Motion is off.`;
   return;
  }
  const frames=Array.from({length:41},(_,i)=>({transform:`translateY(${distance*(i/40)**2}px)`,offset:i/40}));
  animation=mover.animate(frames,{duration:current.dropSeconds*1000,easing:'linear',fill:'forwards'});
  button.textContent='Replay the drop';
  animation.onfinish=()=>{status.textContent=`Equivalent drop complete: ${speed.value} miles per hour just before the ground. Equal energy does not mean equal injury.`;};
 });
 const stop=()=>resetDrop();
 document.addEventListener('motionchange',()=>{if(document.body.classList.contains('reduce-motion'))stop();});
 reduced.addEventListener('change',()=>{if(reduced.matches)stop();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 window.addEventListener('pagehide',stop);
 new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();}).observe(demo);
 demo.querySelector('[data-kinetic-controls]').hidden=false;button.hidden=false;update();
}
