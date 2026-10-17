import test from 'node:test';
import assert from 'node:assert/strict';
import {cityLayout,pointClearance} from '../city.js';
import {canalEdges} from '../canals.js';
import {sites} from '../engine.js';
test('city scenery leaves canal water and interactive tower moorings clear',()=>{
 for(const item of cityLayout){
  for(const edge of canalEdges){
   const [a,b]=edge.points;
   const water={left:Math.min(a[0],b[0])-36.5,right:Math.max(a[0],b[0])+36.5,top:Math.min(a[1],b[1])-36.5,bottom:Math.max(a[1],b[1])+36.5};
   const intersects=item.x<water.right&&item.x+item.w>water.left&&item.y<water.bottom&&item.y+item.h>water.top;
   assert.equal(intersects,false,'scenery must not cover navigable water');
  }
  for(const [x,y] of sites){
   const closestX=Math.max(item.x,Math.min(x,item.x+item.w));
   const closestY=Math.max(item.y,Math.min(y,item.y+item.h));
   assert.ok(Math.hypot(closestX-x,closestY-y)>=23,'tower moorings must remain readable');
  }
 }
});
test('the city includes dense residential blocks and lower-density markets and gardens',()=>{
 const kinds=new Set(cityLayout.map(item=>item.kind));
 for(const kind of ['dense','market','piazza','garden','palazzo','warehouses','townhouse','workshop','civic'])assert.ok(kinds.has(kind),kind+' district must appear');
});

test('relocated tower moorings stay on dry land beside the staggered shortcuts',()=>{
 for(const site of [8,12,17])for(const edge of canalEdges){
  const [a,b]=edge.points;
  const rect={x:Math.min(a[0],b[0]),y:Math.min(a[1],b[1]),w:Math.abs(a[0]-b[0]),h:Math.abs(a[1]-b[1])};
  assert.ok(pointClearance(rect,sites[site])>=60,'mooring '+site+' must clear the canal');
 }
});
