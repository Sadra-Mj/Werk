import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function initializeAudi() {
  const section=document.querySelector('#audi-experience');
  const host=document.querySelector('#audi-canvas');
  const status=document.querySelector('#model-status');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const buttons=[...document.querySelectorAll('.audi-buttons button')];
  let renderer;
  function unavailable() {
    section.classList.add('model-unavailable');
    section.classList.remove('model-ready');
    status.textContent='Statische Ansicht · 3D wird von diesem Browser nicht unterstützt.';
    buttons.forEach((button)=>button.disabled=true);
  }
  try {
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  } catch { unavailable(); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1.4:1.8));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.0;
  renderer.setClearColor(0x101510,0);
  host.append(renderer.domElement);
  const canvas=renderer.domElement;
  canvas.tabIndex=0;
  canvas.setAttribute('aria-label','Interaktives Audi RS 6 Modell. Zum Drehen horizontal ziehen oder die Pfeiltasten links und rechts verwenden.');
  canvas.setAttribute('role','img');
  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0x101510,14,32);
  const camera=new THREE.PerspectiveCamera(34,1,.05,60);
  const pmrem=new THREE.PMREMGenerator(renderer);
  const environment=new RoomEnvironment();
  const envTarget=pmrem.fromScene(environment,.04);
  scene.environment=envTarget.texture;
  environment.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xecf3ff,0x20281b,.65));
  const key=new THREE.DirectionalLight(0xffe8d0,2.0);key.position.set(-4,7,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0xc6dcff,1.4);rim.position.set(4,3,-5);scene.add(rim);
  const front=new THREE.DirectionalLight(0xffffff,.9);front.position.set(-6,2,-2);scene.add(front);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshBasicMaterial({color:0x131a12}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.035;scene.add(floor);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
  const context=shadowCanvas.getContext('2d');
  const gradient=context.createRadialGradient(64,64,5,64,64,62);gradient.addColorStop(0,'rgba(0,0,0,.85)');gradient.addColorStop(.5,'rgba(0,0,0,.6)');gradient.addColorStop(1,'rgba(0,0,0,0)');context.fillStyle=gradient;context.fillRect(0,0,128,128);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(6.7,3.1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,opacity:.8}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-.015;scene.add(shadow);
  const ring=new THREE.Mesh(new THREE.RingGeometry(3.45,3.457,128),new THREE.MeshBasicMaterial({color:0x7f906a,transparent:true,opacity:.2,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-.01;scene.add(ring);
  const turntable=new THREE.Group();scene.add(turntable);
  const target=new THREE.Vector3(0,.95,0);
  const state={ready:false,visible:false,progress:0,yaw:0,renderYaw:0,dragging:false,lastX:0,frame:0,chapter:-1,disposed:false};
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function resize() {
    const width=host.clientWidth,height=host.clientHeight;
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
    updateScroll();requestRender();
  }
  function updateScroll() {
    const rect=section.getBoundingClientRect();
    const travel=Math.max(1,section.offsetHeight-innerHeight);
    state.progress=reduced.matches?0:clamp(-rect.top/travel,0,1);
    document.querySelector('#audi-progress-fill').style.transform=`scaleX(${state.progress})`;
    const chapter=Math.min(2,Math.floor(state.progress*3));
    if(chapter!==state.chapter){
      state.chapter=chapter;
      const chapters=[['01 / DIE LINIE','Charakter zeigt sich aus jeder Perspektive.'],['02 / DER CHARAKTER','Kraft und Ruhe. In einer klaren Form.'],['03 / DAS DETAIL','Nehmen Sie sich Zeit. Drehen Sie weiter.']];
      document.querySelector('#audi-chapter-number').textContent=chapters[chapter][0];
      document.querySelector('#audi-chapter-description').textContent=chapters[chapter][1];
    }
    requestRender();
  }
  function render() {
    state.frame=0;
    if(!state.ready||!state.visible||document.hidden||state.disposed)return;
    state.renderYaw+=(state.yaw-state.renderYaw)*(reduced.matches?1:.16);
    turntable.rotation.y=state.renderYaw;
    const progress=state.progress;
    const theta=-.88+progress*3.5;
    const mobile=host.clientWidth<760;
    const distance=mobile?12.7:8.4-progress*.7;
    const elevation=mobile?2.75:2.1+Math.sin(progress*Math.PI)*.65;
    camera.position.set(Math.sin(theta)*distance,elevation,Math.cos(theta)*distance);
    target.y=mobile?1.05:.95;
    camera.lookAt(target);
    renderer.render(scene,camera);
    section.dataset.view=`${Math.round(progress*100)}:${Math.round(state.renderYaw*100)}`;
    if(Math.abs(state.yaw-state.renderYaw)>.0003)requestRender();
  }
  function requestRender(){if(!state.frame)state.frame=requestAnimationFrame(render);}
  new ResizeObserver(resize).observe(host);
  const observer=new IntersectionObserver(([entry])=>{state.visible=entry.isIntersecting;if(state.visible)requestRender();},{threshold:0});observer.observe(section);
  addEventListener('scroll',updateScroll,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestRender();});
  reduced.addEventListener('change',()=>{updateScroll();requestRender();});
  function rotate(amount){state.yaw+=amount;requestRender();}
  document.querySelector('#audi-left').addEventListener('click',()=>rotate(-.4));
  document.querySelector('#audi-right').addEventListener('click',()=>rotate(.4));
  document.querySelector('#audi-reset').addEventListener('click',()=>{state.yaw=0;requestRender();});
  canvas.addEventListener('pointerdown',(event)=>{
    if(!state.ready||event.button!==0)return;
    state.dragging=true;state.lastX=event.clientX;canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',(event)=>{
    if(!state.dragging)return;
    rotate((event.clientX-state.lastX)*.009);state.lastX=event.clientX;
  });
  function finishDrag(){state.dragging=false;}
  canvas.addEventListener('pointerup',finishDrag);canvas.addEventListener('pointercancel',finishDrag);
  canvas.addEventListener('keydown',(event)=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();rotate(event.key==='ArrowLeft'?-.25:.25);}
    if(event.key==='Home'){event.preventDefault();state.yaw=0;requestRender();}
  });
  canvas.addEventListener('webglcontextlost',(event)=>{event.preventDefault();unavailable();state.disposed=true;});
  const draco=new DRACOLoader();draco.setDecoderPath(new URL('./vendor/three/draco/',import.meta.url).href);draco.setWorkerLimit(2);
  const loader=new GLTFLoader();loader.setDRACOLoader(draco);
  loader.load(new URL('./assets/models/audi-rs6.glb',import.meta.url).href,(gltf)=>{
    const model=gltf.scene;
    const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
    model.scale.multiplyScalar(4.9/Math.max(size.x,size.z));
    box.setFromObject(model);
    const center=box.getCenter(new THREE.Vector3());
    model.position.x-=center.x;model.position.z-=center.z;model.position.y-=box.min.y;
    model.traverse((object)=>{if(object.isMesh){const mats=Array.isArray(object.material)?object.material:[object.material];mats.forEach((material)=>{material.envMapIntensity=.8;});}});
    turntable.add(model);
    state.ready=true;
    section.classList.add('model-ready');section.dataset.model='loaded';
    buttons.forEach((button)=>button.disabled=false);
    status.textContent='Audi RS 6 bereit. Zum Drehen ziehen oder Pfeiltasten verwenden.';
    draco.dispose();resize();requestRender();
  },(event)=>{
    status.textContent=event.total?`Audi wird geladen … ${Math.round(event.loaded/event.total*100)} %`:'Audi wird geladen …';
  },()=>{unavailable();status.textContent='Die 3D-Ansicht ist gerade nicht verfügbar. Statische Vorschau aktiv.';draco.dispose();});
  resize();
}
