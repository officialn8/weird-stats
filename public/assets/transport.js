import {mountKineticDemo} from './transport-physics.js?v=human-scale-polish-1';
// The same 60 people remain visible in every occupancy state.
const scene = document.querySelector('#one-person-sixty-cars');
if (scene) {
  const svg=scene.querySelector('.trip-field');
  const roadScene=svg.querySelector('.trip-road-scene');
  const vehicles=[...svg.querySelectorAll('[data-trip-car]')];
  const people=[...svg.querySelectorAll('[data-trip-travelers] .trip-passenger')];
  const buttons=[...scene.querySelectorAll('[data-trip-load]')];
  const count=scene.querySelector('[data-trip-count]'),status=scene.querySelector('[data-trip-status]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const ns='http://www.w3.org/2000/svg';
  function shape(parent,tag,attributes) {
    const element=document.createElementNS(ns,tag);
    for(const [key,value] of Object.entries(attributes))element.setAttribute(key,value);
    parent.append(element);return element;
  }
  function slot(index) {
    const arm=index%4,n=Math.floor(index/4),lane=n%2,row=Math.floor(n/2);
    return [
      {x:355-row*46,y:474+lane*45,angle:0},
      {x:645+row*46,y:426-lane*45,angle:180},
      {x:476-lane*45,y:305-row*40,angle:90},
      {x:524+lane*45,y:595+row*40,angle:-90}
    ][arm];
  }
  const bus=shape(svg.querySelector('[data-trip-vehicles]'),'g',{class:'trip-road-bus',transform:'translate(217 474) scale(.62)'});
  shape(bus,'path',{d:'M-68-24h18v6h-18z M52-24h18v6H52z M-68 18h18v6h-18z M52 18h18v6H52z',class:'trip-tire'});
  shape(bus,'rect',{x:-91,y:-21,width:182,height:42,rx:6,fill:'#ff681f',stroke:'#291b10','stroke-width':1.5});
  shape(bus,'rect',{x:-75,y:-17,width:146,height:34,rx:3,class:'trip-cabin'});
  shape(bus,'path',{d:'M76-17h10v34H76Z',class:'trip-glass'});
  shape(bus,'circle',{cx:81,cy:-9,r:3,fill:'#a7b9af'});
  shape(bus,'path',{d:'M88-16v7 M88 9v7',stroke:'#fff3ce','stroke-width':3});
  shape(bus,'path',{d:'M-90-16v7 M-90 9v7',stroke:'#bc5037','stroke-width':3});
  bus.style.display='none';
  const traffic=shape(roadScene,'g',{'data-trip-traffic':''});traffic.style.display='none';
  for(let arm=0;arm<4;arm++)for(let n=0;n<8;n++) {
    // Two cars precede the bus, with two behind it in the same approach lane.
    const group=arm===0&&n===4?10:arm===0&&n===6?12:n;
    const p=slot(group*4+arm),car=shape(traffic,'g',{class:'trip-vehicle',transform:`translate(${p.x} ${p.y}) rotate(${p.angle}) scale(.62)`,style:`color:${['#ded4c2','#8faaa5','#bfa184','#7d929b','#c9c4b4'][(arm*8+n)%5]}`});
    shape(car,'use',{href:'#trip-car-shape'});
    shape(car,'circle',{cx:4,cy:-5,r:4.35,class:'trip-passenger'});
  }
  function position(index,occupancy) {
    if(occupancy===60)return{x:217+(-67+(index%15)*9.5)*.62,y:474+(-12+Math.floor(index/15)*8)*.62};
    const p=slot(Math.floor(index/occupancy)),seat=index%occupancy;
    const x=(seat<2?4:-5)*.62,y=(seat%2===0?-5:5)*.62,a=p.angle*Math.PI/180;
    return{x:p.x+x*Math.cos(a)-y*Math.sin(a),y:p.y+x*Math.sin(a)+y*Math.cos(a)};
  }
  function change(value) {
    const inTraffic=value==='traffic',occupancy=inTraffic?60:value;
    traffic.style.display=inTraffic?'':'none';
    bus.style.display=occupancy===60?'':'none';
    scene.querySelector('[data-trip-traffic-reading]').hidden=!inTraffic;
    scene.querySelector('[data-trip-people]').textContent=inTraffic?'92':'60';
    const animate=!reduced.matches&&!document.body.classList.contains('reduce-motion');
    people.forEach((dot,index)=>{
      const before={x:Number(dot.getAttribute('cx')),y:Number(dot.getAttribute('cy'))},after=position(index,occupancy);
      dot.getAnimations().forEach(animation=>animation.cancel());
      dot.setAttribute('cx',after.x);dot.setAttribute('cy',after.y);dot.setAttribute('r',occupancy===60?'1.9':'2.7');
      if(animate)dot.animate([{transform:`translate(${before.x-after.x}px,${before.y-after.y}px)`},{transform:'translate(0px,0px)'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
    });
    vehicles.forEach((car,index)=>{car.style.display=occupancy===60||index>=60/occupancy?'none':'';});
    count.textContent=inTraffic?'32 cars + 1 bus':occupancy===60?'1 bus':`${60/occupancy} cars`;
    const description=inTraffic?'Illustrative traffic: 32 single-occupancy cars and one bus carrying 60 passengers, plus its operator. 92 travelers in 33 vehicles.':`60 travelers in ${occupancy===60?'one bus, plus its operator':`${60/occupancy} cars`}.`;
    svg.setAttribute('aria-label',description+' Roof cutaways reveal people. Illustrative four-way intersection, not measured road area or a traffic-flow simulation.');
    status.textContent=description+(inTraffic?' This view adds 32 motorists to the original 60 travelers.':' The traveler count stays the same.');
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tripLoad===String(value))));
  }
  buttons.forEach(button=>button.addEventListener('click',()=>change(button.dataset.tripLoad==='traffic'?'traffic':Number(button.dataset.tripLoad))));
  document.addEventListener('motionchange',()=>{if(document.body.classList.contains('reduce-motion'))people.forEach(dot=>dot.getAnimations().forEach(animation=>animation.cancel()));});
  scene.querySelector('.trip-controls').hidden=false;
  mountKineticDemo(scene,reduced);
  // Four equal streams make the 25/75 split legible without changing the data.
  const energy=scene.querySelector('.trip-energy-figure');
  if(energy) {
    let energyVisible=false;
    const updateEnergyMotion=()=>{
      energy.dataset.energyActive=String(energyVisible&&!document.hidden&&!reduced.matches&&!document.body.classList.contains('reduce-motion'));
    };
    const energyObserver=new IntersectionObserver(entries=>{
      energyVisible=entries[0].isIntersecting;updateEnergyMotion();
    },{threshold:.15});
    energyObserver.observe(energy);
    document.addEventListener('motionchange',updateEnergyMotion);
    document.addEventListener('visibilitychange',updateEnergyMotion);
    reduced.addEventListener('change',updateEnergyMotion);
    window.addEventListener('pageshow',updateEnergyMotion);
    window.addEventListener('pagehide',event=>{
      energy.dataset.energyActive='false';
      if(event.persisted)return;
      energyObserver.disconnect();
      document.removeEventListener('motionchange',updateEnergyMotion);
      document.removeEventListener('visibilitychange',updateEnergyMotion);
      reduced.removeEventListener('change',updateEnergyMotion);
      window.removeEventListener('pageshow',updateEnergyMotion);
    });
  }
}
