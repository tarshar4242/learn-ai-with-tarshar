// One geometric definition drives both the visible paths and the walker.
import {PATH_RADIUS} from './world-layout.js';
export const WALK_RADIUS = PATH_RADIUS;
export const WALK_Y = .76;
export function ringPoint(index, radius=WALK_RADIUS) {
  const angle=index*Math.PI/6;
  const r=index%2 ? radius*Math.cos(Math.PI/6) : radius;
  return {x:Math.sin(angle)*r,z:Math.cos(angle)*r};
}
export function makeWalkNetwork(islands) {
  const nodes=[],edges=[],adj=[];
  const addEdge=(a,b,kind)=>{
    const length=Math.hypot(nodes[a].x-nodes[b].x,nodes[a].z-nodes[b].z);
    const e={a,b,kind,length};edges.push(e);adj[a].push({node:b,edge:e});adj[b].push({node:a,edge:e});
  };
  for(const [i,island] of islands.entries())for(let k=0;k<12;k++){
    const p=ringPoint(k);nodes.push({x:island.x+p.x,y:WALK_Y,z:island.z+p.z,islandId:island.id,index:k});adj.push([]);
  }
  islands.forEach((_,i)=>{for(let k=0;k<12;k++)addEdge(i*12+k,i*12+(k+1)%12,'path');});
  for(let i=0;i<islands.length;i++)for(let j=i+1;j<islands.length;j++){
    const a=islands[i],b=islands[j],dq=a.axial[0]-b.axial[0],dr=a.axial[1]-b.axial[1];
    if(Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))!==1)continue;
    let best=null;
    for(let ka=1;ka<12;ka+=2)for(let kb=1;kb<12;kb+=2){
      const na=i*12+ka,nb=j*12+kb,d=Math.hypot(nodes[na].x-nodes[nb].x,nodes[na].z-nodes[nb].z);
      if(!best||d<best.d)best={na,nb,d};
    }
    addEdge(best.na,best.nb,'bridge');
  }
  function shortest(start,end){
    const dist=nodes.map(()=>Infinity),prev=nodes.map(()=>null),unseen=new Set(nodes.map((_,i)=>i));dist[start]=0;
    while(unseen.size){let u=null;for(const n of unseen)if(u===null||dist[n]<dist[u])u=n;if(!Number.isFinite(dist[u]))break;unseen.delete(u);if(u===end)break;
      for(const next of adj[u])if(dist[u]+next.edge.length<dist[next.node]){dist[next.node]=dist[u]+next.edge.length;prev[next.node]={node:u,edge:next.edge};}
    }
    if(!Number.isFinite(dist[end]))throw new Error('Disconnected walking route');
    const path=[];let u=end;while(u!==start){const p=prev[u];path.unshift({from:p.node,to:u,kind:p.edge.kind,length:p.edge.length});u=p.node;}return path;
  }
  return {nodes,edges,shortest};
}
export function makeTour(network,islands,ids){
  const order=ids.map(id=>islands.findIndex(i=>i.id===id)).filter(i=>i>=0).map(i=>i*12);
  if(order.length<2)throw new Error('Walking tour needs at least two islands');
  const segments=[];for(let k=0;k<order.length;k++)segments.push(...network.shortest(order[k],order[(k+1)%order.length]));
  let total=0;segments.forEach(s=>{s.start=total;total+=s.length;s.end=total;});
  return {segments,length:total};
}
export function sampleTour(network,tour,distance){
  const d=((distance%tour.length)+tour.length)%tour.length;
  const segment=tour.segments.find(s=>d<s.end)||tour.segments.at(-1);
  const t=(d-segment.start)/segment.length,a=network.nodes[segment.from],b=network.nodes[segment.to];
  return {x:a.x+(b.x-a.x)*t,y:WALK_Y+(segment.kind==='bridge'?.1*Math.sin(t*Math.PI):0),z:a.z+(b.z-a.z)*t,
    heading:Math.atan2(b.x-a.x,b.z-a.z),kind:segment.kind,islandId:t<.5?a.islandId:b.islandId,from:segment.from,to:segment.to,t};
}
