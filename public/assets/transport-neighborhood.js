const figure=document.querySelector('.trip-neighborhood');
if(figure) {
 const observer=new IntersectionObserver(entries=>{
  if(!entries.some(entry=>entry.isIntersecting))return;
  observer.disconnect();mountNeighborhood(figure).catch(()=>{});
 },{rootMargin:'350px'});observer.observe(figure);
}
async function mountNeighborhood(figure) {
 const T=await import('./three/three.module.js');
 const canvas=figure.querySelector('canvas'),field=figure.querySelector('.trip-city-field');
 let renderer;
 try {renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});}catch{return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor('#eedbc2');
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
 const brandImage=new Image();brandImage.src=new URL('./trader-joes-logo.svg',import.meta.url).href;await brandImage.decode();
 const scene=new T.Scene(),world=new T.Group();scene.add(world);
 const camera=new T.OrthographicCamera(-50,50,35,-35,.1,350);
 const resources=[],geometries={box:new T.BoxGeometry(1,1,1),sphere:new T.IcosahedronGeometry(1,1),cylinder:new T.CylinderGeometry(1,1,1,10)};
 resources.push(...Object.values(geometries));const materials=new Map();
 function mat(color) {if(!materials.has(color)){const m=new T.MeshStandardMaterial({color,roughness:.85});materials.set(color,m);resources.push(m);}return materials.get(color);}
 function part(parent,geometry,color,x,y,z,w,h,d,shadows=true) {
  const mesh=new T.Mesh(geometries[geometry],mat(color));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=shadows;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 const c={base:'#bd8660',sidewalk:'#ecdbbf',road:'#554f45',white:'#fff4dc',glass:'#36555b',roof:'#cdb592',green:'#5a7850',leaf:'#71935a',orange:'#e7612e',cycle:'#74977f'};
 part(world,'box',c.base,0,-1.3,0,88,2.5,56);
 part(world,'box','#e0cfac',0,.05,0,88,.2,56);
 part(world,'box',c.road,0,.2,0,88,.15,11);
 // Dedicated bus lanes, one in each direction; protected cycle tracks outside.
 for(const side of [-1,1]) {
  part(world,'box','#c46a45',0,.3,side*2.2,88,.04,3.4,false);
  part(world,'box',c.cycle,0,.31,side*6.3,88,.08,1.4,false);
  part(world,'box',c.sidewalk,0,.39,side*8,88,.3,2.1);
  for(let x=-41;x<43;x+=3) part(world,'box',c.white,x,.35,side*4.4,1.5,.03,.08,false);
  for(let x=-42;x<44;x+=4) part(world,'box',c.white,x,.52,side*7.15,.55,.35,.2);
 }
 // Two connecting side streets and raised crossings.
 for(const x of [-19,19]) {
  part(world,'box',c.road,x,.2,0,5,.12,56);
  for(const z of [-5.2,5.2])for(let i=0;i<6;i++)part(world,'box',c.white,x-2+i*.8,.4,z,.4,.04,2.3,false);
 }
 for(const z of [-7.8,7.8]) for(let x=-16;x<17;x+=1.1)part(world,'box',c.white,x,.57,z,.5,.04,1.8,false);
 // A pedestrian passage connects the two halves of the neighborhood.
 part(world,'box','#e9ba73',0,.28,0,5,.12,56);
 part(world,'box',c.road,0,.31,0,5,.1,10.9);
 for(let z=-4.7;z<5;z+=1)part(world,'box',c.white,0,.4,z,4,.04,.48,false);
 const palette=['#b7674a','#e9bc79','#f1ddad','#b0bca1','#cf8e62','#e4bd92','#c97555','#e8d6b0'];
 function marketLogo(x,z) {
  const board=document.createElement('canvas');board.width=1536;board.height=384;
  const ctx=board.getContext('2d');ctx.fillStyle='#fff8ed';ctx.fillRect(0,0,1536,384);
  const logoWidth=1230,logoHeight=logoWidth*23/210;
  ctx.drawImage(brandImage,(1536-logoWidth)/2,(384-logoHeight)/2,logoWidth,logoHeight);
  const texture=new T.CanvasTexture(board);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());resources.push(texture);
  const material=new T.MeshBasicMaterial({map:texture});resources.push(material);
  const geometry=new T.PlaneGeometry(6,1.5);resources.push(geometry);
  // Mount beyond the shop awnings (.825 from the facade) so they cannot pierce the sign.
  part(world,'box','#d4bc97',x,3.75,z+.55,6.2,1.65,.7);
  const logo=new T.Mesh(geometry,material);logo.position.set(x,3.75,z+.91);world.add(logo);
 }
 function sign(text,x,y,z,rotation=0) {
  const board=document.createElement('canvas');board.width=256;board.height=64;
  const ctx=board.getContext('2d');ctx.fillStyle='#304d4b';ctx.fillRect(0,0,256,64);ctx.fillStyle='#fff0cb';ctx.font='500 28px Outfit, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,34);
  const texture=new T.CanvasTexture(board);texture.colorSpace=T.SRGBColorSpace;resources.push(texture);
  const material=new T.MeshBasicMaterial({map:texture});resources.push(material);
  const geometry=new T.PlaneGeometry(4.5,1.1);resources.push(geometry);
  const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.rotation.y=rotation;world.add(mesh);
 }
 const shops=['GROCER','BOOKS','CAFÉ','BAKERY','MARKET','REPAIR','FLOWERS','CORNER'];
 let b=0;
 for(const z of [-17,17])for(const x of [-31,-9,9,31]) {
  const back=z<0,h=back?[14,18,15,12][b%4]:[10,8,11,9][b%4],w=12,d=13;
  part(world,'box',palette[b],x,h/2+.6,z,w,h,d);
  part(world,'box',c.roof,x,h+.7,z,w+.45,.5,d+.45);
  part(world,'box','#ead8b8',x,h+1.3,z,w-1.3,.8,d-1.3);
  part(world,'box','#b4b69a',x,h+1.8,z,5,.6,4);
  // Street-level shopfront and upper-floor windows on all visible facades.
  const front=z+(back?1:-1)*(d/2+.03),facing=back?1:-1;
  for(let col=-1;col<=1;col++) {
   part(world,'box',c.glass,x+col*3.6,2,front,2.8,2.6,.12,false);
   part(world,'box','#f0d5a4',x+col*3.6,3.5,front+facing*.4,3,.2,.85);
  }
  for(let y=5;y<h-1;y+=2.8) {
   for(let col=-1;col<=1;col++) {
    part(world,'box',c.glass,x+col*3.5,y,front,1.8,1.7,.1,false);
    part(world,'box',c.glass,x+col*3.5,y,z-facing*(d/2+.04),1.8,1.7,.1,false);
    part(world,'box',c.white,x+col*3.5,y-.96,front+facing*.26,2.2,.15,.7);
   }
   for(const side of [-1,1])for(let col=-1;col<=1;col++)part(world,'box',c.glass,x+side*(w/2+.04),y,z+col*3.5,.12,1.7,1.8,false);
  }
  if(b===1)marketLogo(x,front);else sign(shops[b],x,3.8,front+facing*.51,back?0:Math.PI);b++;
 }
 function tree(x,z,scale=1) {
  part(world,'cylinder','#795239',x,1.3*scale,z,.15*scale,2.6*scale,.15*scale);
  part(world,'sphere',c.green,x,3.1*scale,z,1.35*scale,1.7*scale,1.35*scale);
  part(world,'sphere',c.leaf,x-.35*scale,3.8*scale,z-.2*scale,1*scale,1.2*scale,1*scale);
 }
 for(const z of [-9,9])for(const x of [-41,-23,-15,-3,3,15,23,41])tree(x,z,.7);
 for(const x of [-43,43])for(const z of [-23,-14,14,23])tree(x,z,1);
 // Rear gardens, benches, roof gardens and little planted courtyards.
 for(const x of [-9,9])for(const z of [-26,26]) {
  part(world,'box','#90a16d',x,.38,z,13,.4,3.5);for(let i=-1;i<=1;i++)tree(x+i*4,z,.65);
 }
 for(const z of [-18,-24,17,24]) {
  part(world,'box','#a77d52',-2,.8,z,1,.18,2);
  part(world,'box','#a77d52',2,.8,z,1,.18,2);
 }
 function vehicle(x,z,bus=false,rotation=0) {
  const group=new T.Group();world.add(group);group.position.set(x,.4,z);group.rotation.y=rotation;
  const length=bus?9:3.4,width=bus?2.25:1.55,height=bus?2.7:1.25;
  part(group,'box',bus?'#ee9827':'#e6d6b8',0,height/2,0,length,height,width);
  part(group,'box',bus?'#f8e6ba':'#385657',0,height+.08,0,length-.7,.2,width-.3);
  for(const side of [-1,1]) {
   part(group,'box',c.glass,0,height*.67,side*(width/2+.02),length-.7,height*.4,.04,false);
   for(const end of [-1,1])part(group,'cylinder','#302e29',end*(length/2-1),.27,side*(width/2),.4,.24,.4).rotation.x=Math.PI/2;
  }
  part(group,'box','#fff3cd',-length/2-.03,height*.6,0,.08,.6,width-.35,false);
  return group;
 }
 vehicle(-10,-2.1,true);vehicle(24,2.1,true,Math.PI);
 // Street paint makes the dedicated corridor legible from the overview.
 const paintCanvas=document.createElement('canvas');paintCanvas.width=256;paintCanvas.height=80;
 const paintContext=paintCanvas.getContext('2d');paintContext.fillStyle='#fff2d6';paintContext.font='bold 60px Outfit, sans-serif';paintContext.textAlign='center';paintContext.fillText('BUS',128,62);
 const paintTexture=new T.CanvasTexture(paintCanvas);paintTexture.colorSpace=T.SRGBColorSpace;resources.push(paintTexture);
 const paintMaterial=new T.MeshBasicMaterial({map:paintTexture,transparent:true,depthWrite:false});resources.push(paintMaterial);
 const paintGeometry=new T.PlaneGeometry(4,1.3);resources.push(paintGeometry);
 for(const [x,z]of [[-29,-2.2],[8,-2.2],[-10,2.2],[36,2.2]]) {const paint=new T.Mesh(paintGeometry,paintMaterial);paint.rotation.x=-Math.PI/2;paint.position.set(x,.39,z);world.add(paint);}
 // A small number of access/service vehicles on the cross streets.
 for(const [x,z]of [[-19,-19],[19,20],[-19,22]])vehicle(x,z,false,Math.PI/2);
 // Transit shelters with clear roof, bench, route post and waiting passengers.
 for(const [x,z] of [[-4,-7.7],[16,7.7]]) {
  part(world,'box','#345453',x,2.9,z,6,.2,1.8);
  for(const end of [-1,1])part(world,'box','#345453',x+end*2.6,1.65,z,.12,2.5,.12);
  part(world,'box','#936345',x,.9,z,4,.2,.6);
  part(world,'box','#345453',x+3.5,2,z,.12,3.2,.12);
  part(world,'box',c.orange,x+3.5,3.5,z,.8,.7,.12);
 }
 function person(x,z,color) {
  part(world,'cylinder',color,x,1,z,.19,.9,.19,false);part(world,'sphere','#b7805c',x,1.6,z,.2,.23,.2,false);
 }
 for(let i=0;i<30;i++) {const x=-39+(i*7)%79,z=(i%2?1:-1)*(7.65+(i%3)*.25);person(x,z,['#d86536','#385b60','#e0b657'][i%3]);}
 for(let i=0;i<8;i++)person((i%2?1:-1)*1.4,-23+i*6,'#395d60');
 scene.add(new T.HemisphereLight('#fff4d9','#a88b68',2.4));
 const sun=new T.DirectionalLight('#fff0c7',4);sun.position.set(-25,50,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:160});sun.shadow.normalBias=.035;scene.add(sun);
 const ground=part(scene,'box','#eedbc2',0,-3.1,0,600,.6,600,false);ground.receiveShadow=true;
 const views={
  neighborhood:{position:[62,53,67],target:[0,3,0],span:72,copy:'Homes above shops. A transit corridor through the middle. Walking and cycling routes that join it all up.'},
  transit:{position:[46,52,14],target:[0,1,0],span:47,copy:'Give buses their own space, accessible stops and safe crossings. Pair that street design with frequent, reliable service.'},
  homes:{position:[11,24,19],target:[-7,7,-15],span:34,copy:'Put homes close to groceries, services and transit. Mid-rise buildings can bring more daily life within reach.'}
 };
 let selected='neighborhood',frame=0,animation=0,visible=true,active=true;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const target=new T.Vector3();
 function draw(){if(active&&visible&&!document.hidden)renderer.render(scene,camera);}
 function size(){const w=field.clientWidth,h=field.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const aspect=w/h;const span=Math.max(views[selected].span,110/aspect*(selected==='neighborhood'?1:selected==='transit'?.65:.45));camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();draw();}
 function select(name,animate=true) {
  selected=name;const view=views[name];cancelAnimationFrame(animation);
  const start=camera.position.clone(),startTarget=target.clone(),endTarget=new T.Vector3(...view.target);
  const end=new T.Vector3(...view.position).sub(endTarget).multiplyScalar(2).add(endTarget);
  const immediate=!animate||reduced.matches||document.body.classList.contains('reduce-motion');const beginning=performance.now();
  function step(now) {const t=immediate?1:Math.min(1,(now-beginning)/850),e=1-Math.pow(1-t,4);camera.position.lerpVectors(start,end,e);target.lerpVectors(startTarget,endTarget,e);camera.lookAt(target);size();if(t<1&&active&&visible&&!document.hidden)animation=requestAnimationFrame(step);}
  step(beginning);figure.querySelector('[data-city-caption]').textContent=view.copy;
  figure.querySelectorAll('[data-city-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.cityView===name)));
 }
 const abort=new AbortController();figure.querySelectorAll('[data-city-view]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.cityView),{signal:abort.signal}));
 document.addEventListener('motionchange',()=>{if(document.body.classList.contains('reduce-motion'))select(selected,false);},{signal:abort.signal});
 const resize=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(size);});resize.observe(field);
 const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)select(selected,false);else cancelAnimationFrame(animation);});visibility.observe(field);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(animation);else select(selected,false);},{signal:abort.signal});
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();canvas.hidden=true;figure.querySelector('.trip-city-fallback').hidden=false;figure.querySelector('.trip-city-controls').hidden=true;},{signal:abort.signal});
 function dispose(){active=false;cancelAnimationFrame(frame);cancelAnimationFrame(animation);resize.disconnect();visibility.disconnect();abort.abort();resources.forEach(resource=>resource.dispose());renderer.dispose();}
 window.addEventListener('pagehide',event=>{if(!event.persisted)dispose();},{once:true});
 canvas.hidden=false;select('neighborhood',false);figure.querySelector('.trip-city-fallback').hidden=true;figure.querySelector('.trip-city-controls').hidden=false;
}
