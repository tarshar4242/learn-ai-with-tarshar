import * as THREE from './vendor/three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// Four illustrative research companions. Tarshar's approved model stays in its own unchanged module.
export function createResearchCompanion(profile) {
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.83,metalness:0});
  const owned=[];const group=new THREE.Group();group.name=profile.id;
  const skin=0xf4ceb0,ink=0x352e32,cream=0xfff3dc;
  const professor=profile.role==='professor',female=profile.gender==='female';
  const hair=new THREE.Color(profile.hair),coat=new THREE.Color(profile.clothing),pants=new THREE.Color(profile.trousers);
  function part(list,geo,color,p=[0,0,0],s=[1,1,1],r=[0,0,0]) {
    const g=geo.index?geo.toNonIndexed():geo.clone();geo.dispose();g.deleteAttribute('uv');
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)),new THREE.Vector3(...s)));
    const c=new THREE.Color(color),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}
    g.setAttribute('color',new THREE.BufferAttribute(a,3));list.push(g);
  }
  const sphere=(l,c,p,s)=>part(l,new THREE.SphereGeometry(1,14,10),c,p,s);
  const box=(l,c,p,s,r)=>part(l,new THREE.BoxGeometry(1,1,1),c,p,s,r);
  function mesh(list){const g=mergeGeometries(list,false);list.forEach(x=>x.dispose());owned.push(g);const m=new THREE.Mesh(g,material);m.castShadow=true;return m;}
  const torso=new THREE.Group();group.add(torso);
  const head=[];
  sphere(head,skin,[0,.865,0],[.218,.224,.195]);
  // A single smooth cap, with a short back panel only for the female student's bob.
  part(head,new THREE.SphereGeometry(1,18,12,0,Math.PI*2,0,female?1.45:1.2),hair,[0,.883,female?-.005:-.019],[.225,.229,female?.217:.203]);
  if(female)sphere(head,hair,[0,.805,-.105],[.216,.195,.117]);
  else sphere(head,hair,[professor?-.038:.03,.986,.092],[.171,.077,.104]);
  for(const side of [-1,1]){
    sphere(head,skin,[side*.218,.846,0],[.036,.052,.027]);
    sphere(head,cream,[side*.081,.864,.181],[.044,.049,.018]);
    sphere(head,ink,[side*.081,.863,.197],[.025,.031,.009]);
    sphere(head,0xffffff,[side*.074,.875,.205],[.008,.009,.004]);
    sphere(head,0xefa99b,[side*.126,.806,.165],[.029,.012,.006]);
    box(head,hair,[side*.081,.925,.181],[.063,.012,.013],[0,0,side*-.05]);
    if(profile.glasses)part(head,new THREE.TorusGeometry(.058,.008,6,20),0x4c4546,[side*.084,.868,.205],[1,.88,1]);
  }
  if(profile.glasses)box(head,0x4c4546,[0,.868,.207],[.053,.008,.008]);
  sphere(head,skin,[0,.831,.197],[.021,.025,.023]);
  part(head,new THREE.TorusGeometry(.035,.006,5,16,Math.PI),0xa26158,[0,.792,.184],[1,.6,1],[0,0,Math.PI]);
  torso.add(mesh(head));
  const body=[];
  part(body,new THREE.CapsuleGeometry(.135,.19,5,14),coat,[0,.49,0],[1,1,.73]);
  sphere(body,skin,[0,.668,0],[.052,.055,.049]);
  if(professor){
    box(body,cream,[0,.523,.1],[.095,.205,.021]);
    box(body,coat,[-.071,.548,.119],[.05,.19,.018],[0,0,-.25]);box(body,coat,[.071,.548,.119],[.05,.19,.018],[0,0,.25]);
    box(body,profile.accent,[0,.556,.129],[.022,.11,.012]);
    for(let k=0;k<2;k++)sphere(body,0xcbbd9c,[.025,.445+k*.052,.116],[.009,.009,.005]);
    // A book tucked under one arm distinguishes the academic outfit.
    box(body,profile.accent,[-.173,.464,.058],[.057,.172,.12],[0,0,-.1]);box(body,cream,[-.179,.464,.068],[.045,.15,.097],[0,0,-.1]);
  }else{
    box(body,cream,[0,.52,.112],[.075,.1,.012]);
    if(!female){part(body,new THREE.TorusGeometry(.088,.026,6,16),coat,[0,.614,-.017],[1,.8,.85],[Math.PI/2,0,0]);}
    // Backpack and straps; the student's notebook is distinct from professors' books.
    sphere(body,profile.accent,[0,.498,-.127],[.119,.148,.065]);
    for(const side of [-1,1])box(body,profile.accent,[side*.105,.516,.099],[.022,.2,.018],[0,0,side*.07]);
    if(female){box(body,0xf0d895,[-.175,.455,.084],[.04,.15,.104]);box(body,cream,[-.18,.455,.09],[.025,.128,.088]);}
  }
  torso.add(mesh(body));
  const limbs=[];
  for(const side of [-1,1]){
    const arm=[];part(arm,new THREE.CapsuleGeometry(.046,.15,4,10),coat,[0,-.095,0]);sphere(arm,skin,[0,-.204,.012],[.044,.047,.041]);
    const am=mesh(arm);am.position.set(side*.166,.592,0);am.rotation.z=side*.1;torso.add(am);
    const leg=[];part(leg,new THREE.CapsuleGeometry(.052,.115,4,10),pants,[0,-.086,0]);sphere(leg,professor?0x51443b:0xfff4dc,[0,-.208,.025],[.061,.037,.088]);
    const lm=mesh(leg);lm.position.set(side*.068,.245,0);group.add(lm);limbs.push({am,lm,side});
  }
  function step(t,walking=true){const ph=t*7.5+(profile.phase||0),amp=walking?1:0;for(const {am,lm,side}of limbs){am.rotation.x=Math.sin(ph)*.4*side*amp;lm.rotation.x=-Math.sin(ph)*.5*side*amp;}torso.position.y=Math.abs(Math.sin(ph))*.012*amp;}
  step(0,false);
  return {group,height:1.12,step,dispose(){owned.forEach(g=>g.dispose());material.dispose();}};
}
