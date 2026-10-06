import {kineticUSScenario} from './transport-physics.js?v=human-scale-polish-1';

const KG_PER_LB=.45359237, KM_PER_MILE=1.609344;
const number=(value,digits=0)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:digits}).format(value);

// Direct inputs only: gasoline energy and gross rider metabolism, not lifecycle energy.
export function tripEnergyScenario(mpg=30,occupants=1) {
 if(!Number.isFinite(mpg)||mpg<=0||!Number.isInteger(occupants)||occupants<1||occupants>4)throw new RangeError('Fuel economy must be positive; occupancy must be 1–4.');
 const bikeKcalPerMile=6.8*70/11;
 const carWhPerMile=33700/mpg/occupants,bikeWhPerMile=bikeKcalPerMile*4184/3600;
 return {carWhPerMile,bikeWhPerMile,bikeKcalPerMile,ratio:carWhPerMile/bikeWhPerMile};
}
export function displayScenario(weightLb,speedMph,metric=false) {
 const physics=kineticUSScenario(weightLb,speedMph);
 return {...physics,mass:metric?weightLb*KG_PER_LB:weightLb,speed:metric?speedMph*KM_PER_MILE:speedMph,height:metric?physics.heightM:physics.heightFt,energy:metric?physics.energyJ/1000:physics.energyFtLb};
}
export function mountTransportTools(scene,reduced) {
 let metric=false;
 const set=(selector,value)=>scene.querySelectorAll(selector).forEach(el=>el.textContent=value);
 const demo=scene.querySelector('[data-kinetic-demo]');
 if(!demo)return;
 const mass=demo.querySelector('[data-kinetic-mass]'),speed=demo.querySelector('[data-kinetic-speed]');
 const mover=demo.querySelector('[data-drop-motion]'),position=demo.querySelector('[data-drop-position]');
 const button=demo.querySelector('[data-drop-play]'),status=demo.querySelector('[data-physics-status]');
 let weightLb=4000,speedMph=30,current,animation;
 function resetDrop(){animation?.cancel();animation=null;button.textContent='See the equivalent drop';}
 function updatePhysics(announce=false){
  resetDrop();current=displayScenario(weightLb,speedMph,metric);
  const massText=number(current.mass),speedText=number(current.speed,metric?1:0),height=current.height.toFixed(1);
  const y=450-current.heightFt*400/140,massUnit=metric?'kg':'lb',speedUnit=metric?'km/h':'mph';
  set('[data-kinetic-mass-value]',massText);set('[data-kinetic-speed-value]',speedText);
  set('[data-mass-unit]',massUnit);set('[data-speed-unit]',speedUnit);
  set('[data-kinetic-energy]',number(current.energy,metric?1:0));set('[data-energy-unit]',metric?'kilojoules':'foot-pounds');
  set('[data-kinetic-height]',height);set('[data-height-unit]',metric?'meters':'feet');
  set('[data-kinetic-height-rounded]',number(current.height,metric?1:0));
  set('[data-kinetic-ratio]',number(current.relativeTo20,2));set('[data-reference-speed]',metric?'32.2 km/h':'20 mph');
  set('[data-drop-mass]',`${massText} ${massUnit}`);
  set('[data-kinetic-tons]',metric?`${number(current.mass/1000,2)} metric tonnes`:`${number(weightLb/2000,2)} US ${weightLb===2000?'ton':'tons'}`);
  set('[data-story-height]',metric?'3.048 meters':'10 feet');set('[data-gravity]',metric?'9.81 m/s²':'32.2 ft/s²');
  set('[data-drop-axis-title]',metric?'Height in meters':'Height in feet');
  demo.querySelectorAll('[data-drop-tick]').forEach(el=>el.textContent=number(Number(el.dataset.dropTick)*(metric?.3048:1),metric?1:0));
  const stories=current.heightFt/10;
  set('[data-kinetic-stories]',stories<1?'Less than one story high.':`Roughly ${Math.round(stories)} ${Math.round(stories)===1?'story':'stories'} high.`);
  demo.querySelector('[data-drop-building-fill]').setAttribute('y',y);
  demo.querySelector('[data-drop-building-fill]').setAttribute('height',450-y);
  demo.querySelector('[data-drop-level]').setAttribute('d',`M105 ${y}H450`);
  position.setAttribute('transform',`translate(325 ${y})`);
  demo.querySelector('[data-drop-guide]').setAttribute('d',`M460 ${y}V450 M453 ${y}h14 M453 450h14`);
  const guide=demo.querySelector('[data-drop-guide-label]');guide.setAttribute('y',(y+450)/2+5);guide.textContent=`${height} ${metric?'m':'ft'}`;
  mass.setAttribute('aria-label',`Illustrative vehicle ${metric?'mass in kilograms':'weight in pounds'}`);
  mass.setAttribute('aria-valuetext',`${massText} ${metric?'kilograms':'pounds'}`);
  speed.setAttribute('aria-label',`Vehicle speed in ${metric?'kilometers':'miles'} per hour`);
  speed.setAttribute('aria-valuetext',`${speedText} ${metric?'kilometers':'miles'} per hour`);
  [mass,speed].forEach(input=>input.style.setProperty('--range-progress',`${(input.value-input.min)/(input.max-input.min)*100}%`));
  demo.querySelectorAll('[data-speed-preset]').forEach(b=>{const value=Number(b.dataset.speedPreset);b.textContent=`${number(value*(metric?KM_PER_MILE:1),metric?1:0)} ${speedUnit}`;b.setAttribute('aria-pressed',String(Math.abs(value-speedMph)<1e-6));});
  if(announce)status.textContent=`${massText} ${massUnit} at ${speedText} ${speedUnit}: equal in energy to a ${height} ${metric?'meter':'foot'} drop.`;
 }
 function configureRanges(){
  const massFactor=metric?KG_PER_LB:1,speedFactor=metric?KM_PER_MILE:1;
  mass.min=2000*massFactor;mass.max=8000*massFactor;mass.step=500*massFactor;mass.value=weightLb*massFactor;
  speed.min=10*speedFactor;speed.max=60*speedFactor;speed.step=5*speedFactor;speed.value=speedMph*speedFactor;
  set('[data-mass-min]',`${number(2000*massFactor)} ${metric?'kg':'lb'}`);set('[data-mass-max]',`${number(8000*massFactor)} ${metric?'kg':'lb'}`);
  set('[data-speed-min]',`${number(10*speedFactor,metric?1:0)} ${metric?'km/h':'mph'}`);set('[data-speed-max]',`${number(60*speedFactor,metric?1:0)} ${metric?'km/h':'mph'}`);
 }
 [mass,speed].forEach(input=>{const update=announce=>{weightLb=Number(mass.value)/(metric?KG_PER_LB:1);speedMph=Number(speed.value)/(metric?KM_PER_MILE:1);updatePhysics(announce);};input.addEventListener('input',()=>update(false));input.addEventListener('change',()=>update(true));});
 demo.querySelectorAll('[data-speed-preset]').forEach(preset=>preset.addEventListener('click',()=>{speedMph=Number(preset.dataset.speedPreset);configureRanges();updatePhysics(true);}));
 button.addEventListener('click',()=>{
  resetDrop();
  if(reduced.matches||document.body.classList.contains('reduce-motion')){updatePhysics(true);status.textContent+=' Motion is off.';return;}
  const distance=current.heightFt*400/140;
  const frames=Array.from({length:41},(_,i)=>({transform:`translateY(${distance*(i/40)**2}px)`,offset:i/40}));
  animation=mover.animate(frames,{duration:current.dropSeconds*1000,easing:'linear',fill:'forwards'});button.textContent='Replay the drop';
  animation.onfinish=()=>{status.textContent=`Equivalent drop complete: ${number(current.speed,metric?1:0)} ${metric?'km/h':'mph'} just before the ground. Equal energy does not mean equal injury.`;};
 });
 const stop=()=>resetDrop();
 document.addEventListener('motionchange',()=>{if(document.body.classList.contains('reduce-motion'))stop();});
 reduced.addEventListener('change',()=>{if(reduced.matches)stop();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
 new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();}).observe(demo);

 const comparison=scene.querySelector('[data-trip-comparison]');
 const economy=comparison.querySelector('[data-car-economy]'),occupancy=comparison.querySelector('[data-car-occupancy]');
 function updateComparison(announce=false){
  const mpg=Number(economy.value),people=Number(occupancy.value),result=tripEnergyScenario(mpg,people),distance=metric?KM_PER_MILE:1;
  const unit=`Wh per person-${metric?'km':'mile'}`,car=number(result.carWhPerMile/distance),bike=number(result.bikeWhPerMile/distance);
  set('[data-trip-energy-unit]',unit);set('[data-car-energy]',car);set('[data-bike-energy]',bike);set('[data-trip-energy-ratio]',number(result.ratio,1));
  set('[data-car-economy-value]',metric?`${number(235.214583/mpg,2)} L/100 km`:`${mpg} US mpg`);
  set('[data-car-occupancy-value]',`${people} ${people===1?'person':'people'}`);
  set('[data-bike-assumption]',metric?'70 kg rider at 17.7 km/h':'154 lb rider at 11 mph');
  set('[data-economy-min]',metric?'15.68 L/100 km':'15 US mpg');set('[data-economy-max]',metric?'3.92 L/100 km':'60 US mpg');
  economy.setAttribute('aria-valuetext',metric?`${number(235.214583/mpg,2)} liters per 100 kilometers`:`${mpg} miles per US gallon`);
  set('[data-energy-scale-max]',`${number(2250/distance)} ${unit}`);
  comparison.querySelector('[data-car-energy-bar]').style.width=`${result.carWhPerMile/2250*100}%`;
  comparison.querySelector('[data-bike-energy-bar]').style.width=`${result.bikeWhPerMile/2250*100}%`;
  set('[data-bike-calories]',number(result.bikeKcalPerMile/distance,1));set('[data-distance-name]',metric?'kilometer':'mile');
  comparison.querySelector('[data-energy-chart]').setAttribute('aria-label',`Illustrative direct energy inputs: car ${car}, bicycle ${bike}, ${unit}. Car uses ${number(result.ratio,1)} times the energy in this model.`);
  [economy,occupancy].forEach(input=>input.style.setProperty('--range-progress',`${(input.value-input.min)/(input.max-input.min)*100}%`));
  if(announce)comparison.querySelector('[data-trip-comparison-status]').textContent=`Car: ${car}; bicycle: ${bike} ${unit}. ${number(result.ratio,1)} times as much energy for the car in this example.`;
 }
 [economy,occupancy].forEach(input=>{input.addEventListener('input',()=>updateComparison());input.addEventListener('change',()=>updateComparison(true));});
 const unitButtons=[...scene.querySelectorAll('[data-trip-unit]')];
 unitButtons.forEach(b=>b.addEventListener('click',()=>{metric=b.dataset.tripUnit==='metric';unitButtons.forEach(other=>other.setAttribute('aria-pressed',String(other.dataset.tripUnit===b.dataset.tripUnit)));configureRanges();updatePhysics();updateComparison();set('[data-unit-status]',`Units changed to ${metric?'metric':'US customary'}. The physical scenario is unchanged.`);}));
 scene.querySelectorAll('[data-unit-controls]').forEach(el=>el.hidden=false);
 comparison.querySelector('[data-comparison-controls]').hidden=false;demo.querySelector('[data-kinetic-controls]').hidden=false;button.hidden=false;
 configureRanges();updatePhysics();updateComparison();
}
