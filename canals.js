// The original winding route remains available; three cross-canals create shortcuts.
export const canalNodes={
 entry:[122,-30],north:[122,119],fork:[142,119],ne:[578,119],east:[578,270],
 west:[142,270],sw:[142,424],centre:[357,424],se:[578,424],south:[578,578],
 exitFork:[357,578],gate:[357,754]
};
const edge=(id,a,b,dam=false)=>({id,a,b,dam,points:[canalNodes[a],canalNodes[b]],length:Math.hypot(canalNodes[a][0]-canalNodes[b][0],canalNodes[a][1]-canalNodes[b][1])});
export const canalEdges=[
 edge('entry','entry','north'),edge('north','north','fork'),edge('upper','fork','ne'),
 edge('east-upper','ne','east',true),edge('middle','east','west'),edge('west-middle','west','sw',true),
 edge('lower-left','sw','centre'),edge('lower-right','centre','se'),edge('east-lower','se','south',true),
 edge('bottom','south','exitFork'),edge('exit','exitFork','gate'),
 edge('west-cut','fork','west',true),edge('east-cut','east','se',true),edge('centre-cut','centre','exitFork',true)
];
export const damSites=canalEdges.filter(edge=>edge.dam).map(edge=>({...edge,x:(edge.points[0][0]+edge.points[1][0])/2,y:(edge.points[0][1]+edge.points[1][1])/2}));
export const damCost=125;
const cache=new Map();
export function findRoutes(blocked=[],start='entry'){
 const closed=new Set(blocked),key=[...closed].sort().join(',')+'|'+start;
 if(cache.has(key))return cache.get(key);
 const routes=[];
 function visit(node,nodes,length){
  if(node==='gate'){routes.push({nodes,points:nodes.map(n=>canalNodes[n]),length});return;}
  for(const e of canalEdges){
   if(closed.has(e.id))continue;
   const next=e.a===node?e.b:e.b===node?e.a:null;
   if(next&&!nodes.includes(next))visit(next,[...nodes,next],length+e.length);
  }
 }
 visit(start,[start],0);routes.sort((a,b)=>a.length-b.length);cache.set(key,routes);return routes;
}
export function chooseRoute(routes,serial=0){
 if(!routes.length)return null;
 // Most boats take the shortest route; every third takes a viable close alternative.
 return serial%3===0&&routes[1]?.length<=routes[0].length*1.5?routes[1]:routes[0];
}
export function locationOnNetwork(point){
 const node=Object.entries(canalNodes).find(([,p])=>Math.hypot(p[0]-point.x,p[1]-point.y)<.01);
 if(node)return {node:node[0]};
 for(const e of canalEdges){
  const [a,b]=e.points,dx=b[0]-a[0],dy=b[1]-a[1];
  const t=((point.x-a[0])*dx+(point.y-a[1])*dy)/(dx*dx+dy*dy);
  if(t>0&&t<1&&Math.hypot(point.x-a[0]-t*dx,point.y-a[1]-t*dy)<.01)return {edge:e};
 }
 return null;
}
export function routesFromPoint(point,blocked=[]){
 const location=locationOnNetwork(point);
 if(!location)return [];
 if(location.node)return findRoutes(blocked,location.node).map(r=>({...r}));
 const edge=location.edge;
 if(blocked.includes(edge.id))return [];
 const choices=[];
 for(const endpoint of [edge.a,edge.b])for(const tail of findRoutes([...blocked,edge.id],endpoint)){
  const extra=Math.hypot(point.x-canalNodes[endpoint][0],point.y-canalNodes[endpoint][1]);
  choices.push({nodes:tail.nodes,points:[[point.x,point.y],...tail.points],length:extra+tail.length});
 }
 return choices.sort((a,b)=>a.length-b.length);
}
