import {markerCount, markerField, highlightOrder} from './death-row-model.js';

const figure = document.querySelector('.death-graphic');
if (figure) {
  // Load the renderer only near the graphic. The headline and native disclosures
  // have no WebGL/JavaScript dependency, and the factual fallback starts visible.
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    mount(figure).catch(() => { /* The original static reading remains in place. */ });
  }, {rootMargin: '300px'});
  observer.observe(figure);
}

async function mount(figure) {
  const THREE = await import('./three/three.module.js');
  if (!figure.isConnected) return;
  const canvas = figure.querySelector('canvas');
  const fallback = figure.querySelector('.death-field-fallback');
  const tools = figure.querySelector('.death-graphic-tools');
  const field = figure.querySelector('.death-field');
  const countText = figure.querySelector('[data-marker-count]');
  const rateText = figure.querySelector('[data-marker-label]');
  const status = figure.querySelector('[role="status"]');
  const turn = figure.querySelector('input');
  const sceneButtons = [...figure.querySelectorAll('[data-scene]')];
  const sceneSwitch = figure.querySelector('.death-scene-switch');
  const sceneCaption = figure.querySelector('.death-scene-caption');
  let sceneMode = 'cell';
  const buttons = [...figure.querySelectorAll('[data-marker-rate]')];
  const total = Number(figure.querySelector('[data-marker-total]').textContent.replaceAll(',', ''));
  const rates = buttons.map(button => ({button, rate: parseFloat(button.querySelector('strong').textContent), label: button.childNodes[0].textContent.trim()}));
  rates.forEach(({rate}) => markerCount(rate, total));
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'low-power'}); }
  catch { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x29211b, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5,5,4,-4,.1,650);
  const crowd = new THREE.Group(), closeCell = new THREE.Group();
  scene.add(crowd,closeCell); crowd.visible=false;
  const resources = [], colored = [];
  const locations = markerField(total);
  const box = new THREE.BoxGeometry(1,1,1), head = new THREE.SphereGeometry(1,12,8);
  resources.push(box,head);
  const concrete = new THREE.MeshStandardMaterial({color:0x6c645b,roughness:1});
  const iron = new THREE.MeshStandardMaterial({color:0x534e47,roughness:.7,metalness:.5});
  const cloth = new THREE.MeshStandardMaterial({color:0xa69a80,roughness:1});
  const body = new THREE.MeshStandardMaterial({color:0xdecbb0,roughness:1});
  const lit = new THREE.MeshStandardMaterial({color:0xffffff,roughness:1});
  resources.push(concrete,iron,cloth,body,lit);
  const transform = new THREE.Object3D();
  function part(geometry,material,position,scale) {
    const mesh = new THREE.InstancedMesh(geometry,material,total);
    locations.forEach(({x,z,index})=>{
      transform.position.set(x+position[0],position[1],z+position[2]);
      transform.scale.set(...scale); transform.updateMatrix(); mesh.setMatrixAt(index,transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true; crowd.add(mesh);
    const detail = new THREE.Mesh(geometry,material);
    detail.position.set(...position);detail.scale.set(...scale);detail.castShadow=true;detail.receiveShadow=true;closeCell.add(detail);
    colored.push(mesh);
  }
  // Open-roof schematic: concrete, a narrow bed, a seated figure and a locked grille.
  part(box,lit,[0,-.12,0],[3.6,.24,4.6]);
  part(box,concrete,[-1.75,1.45,0],[.16,2.9,4.6]);
  part(box,concrete,[0,1.45,-2.25],[3.6,2.9,.16]);
  part(box,iron,[1.03,.45,-.5],[1.02,.14,2.5]);
  part(box,cloth,[1.03,.58,-.5],[1,.17,2.45]);
  part(box,cloth,[1.03,.73,-1.35],[.82,.13,.48]);
  for(const z of [-1.5,.5]) part(box,iron,[1.03,.22,z],[.75,.44,.08]);
  // Anatomically legible, anonymous seated silhouette; no claim about a real person.
  part(head,body,[-.25,1.53,.25],[.18,.22,.18]);
  part(box,body,[-.25,1.08,.23],[.43,.55,.24]);
  for(const x of [-.39,-.11]) {
    part(box,body,[x,.75,.48],[.16,.16,.6]);
    part(box,body,[x,.41,.71],[.14,.65,.15]);
    part(box,iron,[x,.08,.8],[.18,.14,.32]);
  }
  for(const x of [-.55,.05]) part(box,body,[x,.96,.42],[.12,.13,.57]);
  part(box,iron,[-.25,.64,.1],[.65,.12,.55]);
  for(const x of [-.49,-.01]) part(box,iron,[x,.3,.1],[.06,.6,.4]);
  for(let i=0;i<9;i++) part(box,iron,[-1.6+i*.4,1.45,2.2],[.055,2.9,.055]);
  for(const y of [.12,1.1,2.83]) part(box,iron,[0,y,2.2],[3.5,.075,.075]);
  part(box,iron,[.32,1.22,2.22],[.2,.28,.08]);
  // No actual facility is reconstructed.
  const groundGeometry = new THREE.PlaneGeometry(700,700);
  const groundMaterial = new THREE.ShadowMaterial({opacity:.4});
  resources.push(groundGeometry,groundMaterial);
  const ground = new THREE.Mesh(groundGeometry,groundMaterial);
  ground.rotation.x=-Math.PI/2;ground.position.y=-.25;ground.receiveShadow=true;scene.add(ground);
  scene.add(new THREE.HemisphereLight(0xfff7e7,0x4a3429,2.3));
  const key = new THREE.DirectionalLight(0xffe2b0,4);
  key.position.set(-3,9,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
  Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:1,far:30});
  key.shadow.bias=-.001;key.shadow.normalBias=.025;scene.add(key);
  const ranking = highlightOrder(total);
  const muted = new THREE.Color('#584330'), pale = new THREE.Color('#fff4ce');
  let active = true, visible = true, frame = 0;
  const signal = new AbortController();
  function requestDraw() {
    if (!active || !visible || document.hidden || frame) return;
    frame = requestAnimationFrame(() => { frame = 0; if(active && visible && !document.hidden) renderer.render(scene,camera); });
  }
  function resize() {
    const width = field.clientWidth, height = field.clientHeight;
    if (!width || !height || !active) return;
    const aspect = width/height;
    const angle=(26+Number(turn.value))*Math.PI/180, distance=sceneMode==='cell'?12:250;
    // Include the rotated 40-by-25 block's full projected width and a margin.
    const populationWidth = 176*Math.abs(Math.cos(angle)) + 134*Math.abs(Math.sin(angle)) + 16;
    const vertical = sceneMode==='cell' ? Math.max(6.5,7.8/aspect) : Math.max(150,populationWidth/aspect);
    camera.position.set(Math.sin(angle)*distance,sceneMode==='cell'?7:220,Math.cos(angle)*distance);
    camera.lookAt(0,sceneMode==='cell'?1:0,0);
    camera.left = -vertical*aspect/2; camera.right = vertical*aspect/2;
    camera.top = vertical/2; camera.bottom = -vertical/2; camera.updateProjectionMatrix();
    renderer.setSize(width,height,false); requestDraw();
  }
  function choose({button,rate,label}, announce=false) {
    const count = markerCount(rate,total), selected = new Set(ranking.slice(0,count));
    for(const mesh of colored) {
      for(let i=0;i<total;i++) mesh.setColorAt(i,selected.has(i)?pale:muted);
      mesh.instanceColor.needsUpdate=true;
    }
    buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    countText.textContent = String(count);
    rateText.textContent = `sentences illustrated in pale light · ${rate}% ${label.toLowerCase()}`;
    if(announce) setScene('all');
    if(announce) status.textContent = `${label}: ${rate}%. ${count} of ${total.toLocaleString('en-US')} sentences illustrated in pale light. Illustration, not identified people.`;
    requestDraw();
  }
  rates.forEach(item=>item.button.addEventListener('click',()=>choose(item,true),{signal:signal.signal}));
  turn.addEventListener('input',()=>{
    resize();
    turn.setAttribute('aria-valuetext', Number(turn.value)===0?'Starting view':`${Math.abs(Number(turn.value))} degrees ${Number(turn.value)<0?'left':'right'} of starting view`);
    requestDraw();
  },{signal:signal.signal});
  function setScene(mode) {
    sceneMode=mode;crowd.visible=sceneMode==='all';closeCell.visible=!crowd.visible;
    sceneButtons.forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.scene===mode)));
    sceneCaption.textContent=sceneMode==='cell'?'One imagined cell. One life behind the number.':'1,000 illustrated sentences. The same locked doors.';
    status.textContent=sceneMode==='cell'?'Close view of an imagined prison cell, with a seated person, bed and barred door.':'Overview of 1,000 illustrated prison cells. Pale cells show the selected proportion.';
    resize();
  }
  sceneButtons.forEach(button=>button.addEventListener('click',()=>setScene(button.dataset.scene),{signal:signal.signal}));
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(field);
  const visibility = new IntersectionObserver(entries=>{
    visible = entries.some(entry=>entry.isIntersecting);
    if(!visible) {cancelAnimationFrame(frame);frame=0;} else requestDraw();
  }); visibility.observe(field);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) {cancelAnimationFrame(frame);frame=0;} else requestDraw();
  },{signal:signal.signal});
  function cleanup() {
    if(!active) return; active=false;
    cancelAnimationFrame(frame); signal.abort(); resizeObserver.disconnect(); visibility.disconnect();
    scene.traverse(object=>{if(object.isInstancedMesh) object.dispose();});
    resources.forEach(resource=>resource.dispose());renderer.dispose();
  }
  function restoreFallback() {
    canvas.hidden=true; tools.hidden=true; sceneSwitch.hidden=true;sceneCaption.hidden=true;fallback.hidden=false;
    // Restore the static estimate label too; an endpoint must not label a 4.1% fallback.
    countText.textContent=String(markerCount(rates[1].rate,total));
    rateText.textContent=`sentences illustrated in pale light · ${rates[1].rate}% estimate`;
    status.textContent='The 3D view is unavailable. The estimate and evidence remain readable.';
    cleanup();
  }
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();restoreFallback();},{once:true});
  window.addEventListener('pagehide',event=>{if(!event.persisted) cleanup();},{signal:signal.signal});
  choose(rates.find(item=>item.button.getAttribute('aria-pressed')==='true') || rates[1]);
  // First draw succeeds before replacing the static illustration or exposing controls.
  resize(); renderer.render(scene,camera);
  canvas.hidden=false; fallback.hidden=true; tools.hidden=false;sceneSwitch.hidden=false;sceneCaption.hidden=false;
}
