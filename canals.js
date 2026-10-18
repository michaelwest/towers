// Three independent shortcuts skip successive bends of the permanent main canal.
export const canalNodes={
 entry:[122,-30],north:[122,119],upperFork:[310,119],ne:[578,119],
 east:[578,270],upperJoin:[310,270],middleFork:[280,270],west:[142,270],
 sw:[142,424],middleJoin:[280,424],lowerFork:[430,424],se:[578,424],
 south:[578,578],lowerJoin:[430,578],exitFork:[357,578],gate:[357,754]
};
const edge=(id,a,b,dam=false,at=.5)=>({id,a,b,dam,at,points:[canalNodes[a],canalNodes[b]],length:Math.hypot(canalNodes[a][0]-canalNodes[b][0],canalNodes[a][1]-canalNodes[b][1])});
export const canalEdges=[
 edge('entry','entry','north'),edge('upper-left','north','upperFork'),edge('upper-right','upperFork','ne'),
 edge('east-upper','ne','east'),edge('middle-right','east','upperJoin'),edge('middle-link','upperJoin','middleFork'),edge('middle-left','middleFork','west'),
 edge('west-middle','west','sw'),edge('lower-left','sw','middleJoin'),edge('lower-middle','middleJoin','lowerFork'),edge('lower-right','lowerFork','se'),
 edge('east-lower','se','south'),edge('bottom-right','south','lowerJoin'),edge('bottom-left','lowerJoin','exitFork'),edge('exit','exitFork','gate'),
 edge('west-cut','upperFork','upperJoin',true,.38),
 edge('east-cut','middleFork','middleJoin',true,.57),
 edge('centre-cut','lowerFork','lowerJoin',true,.65)
];
export const damSites=canalEdges.filter(edge=>edge.dam).map(edge=>({...edge,x:edge.points[0][0]+(edge.points[1][0]-edge.points[0][0])*edge.at,y:edge.points[0][1]+(edge.points[1][1]-edge.points[0][1])*edge.at}));
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
export function chooseRoute(routes,roll=Math.random()){
 if(!routes.length)return null;
 // Routes are sorted by length: 75% shortest, 25% longest still open.
 return roll<.75?routes[0]:routes.at(-1);
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
