import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,position} from '../engine.js';
import {findRoutes,damSites,damCost,canalEdges,chooseRoute,routesFromPoint} from '../canals.js';
function advance(game,time){for(let t=0;t<time;t+=1/60)game.update(1/60);}
test('dams cost 125 gold and a second dam requires more income',()=>{
 const game=new Game({random:()=>0});assert.equal(damCost,125);
 assert.ok(game.buildDam('west-cut'));assert.equal(game.gold,95);
 assert.equal(game.buildDam('centre-cut'),false);assert.equal(game.gold,95);
 assert.match(game.notice,/Not enough gold/);
});
test('open canals offer multiple routes and dams lengthen the shortest route',()=>{
 const game=new Game({random:()=>0});game.gold=damCost*3;assert.ok(game.routes.length>1);assert.equal(game.routes[0].length,1225);
 assert.ok(game.buildDam('west-cut'));assert.ok(game.routes[0].length>1225);
 assert.ok(game.buildDam('centre-cut'));assert.ok(game.buildDam('east-cut'));
 assert.equal(game.routes.length,1);assert.equal(game.routes[0].length,2333);
});
test('every individual dam adds its own detour while the main canal stays open',()=>{
 const open=findRoutes()[0].length;
 const detours={'west-cut':536,'east-cut':276,'centre-cut':296};
 for(const site of damSites){
  const game=new Game({random:()=>0});assert.ok(game.buildDam(site.id));
  assert.equal(game.routes[0].length-open,detours[site.id]);
 }
 const game=new Game({random:()=>0});game.gold=1000;
 for(const site of damSites)assert.ok(game.buildDam(site.id));
 const before=game.gold;
 for(const edge of canalEdges.filter(e=>!e.dam))assert.equal(game.buildDam(edge.id),false);
 assert.equal(game.gold,before);assert.equal(game.routes[0].length,2333);
});
test('all reachable dam configurations reject any closure that disconnects the entrance',()=>{
 for(let mask=0;mask<1<<damSites.length;mask++){
  const blocked=damSites.filter((_,i)=>mask&(1<<i)).map(s=>s.id);
  if(!findRoutes(blocked).length)continue;
  for(const site of damSites){
   if(blocked.includes(site.id))continue;
   const game=new Game({random:()=>0});game.gold=1000;game.dams=[...blocked];game.routes=findRoutes(blocked);
   const possible=findRoutes([...blocked,site.id]).length>0;
   const before=game.routes[0].length;
   assert.equal(game.buildDam(site.id),possible,'configuration '+mask+' / '+site.id);
   assert.ok(game.routes[0].length>before,'each remaining dam must add a detour on configuration '+mask);
   assert.ok(game.routes.length>0);
  }
 }
});
test('live boats reroute without teleporting and continue along open canals',()=>{
 const game=new Game({random:()=>0});game.startWave();advance(game,1);
 const boat=game.enemies[0],before={x:boat.x,y:boat.y};
 assert.ok(game.buildDam('west-cut'));assert.equal(boat.x,before.x);assert.equal(boat.y,before.y);
 assert.deepEqual(position(boat.distance,boat.routePoints),{...before,angle:Math.PI/2});
 game.update(1/60);assert.ok(Math.hypot(boat.x-before.x,boat.y-before.y)<=boat.speed/60+.001);
});
test('cannot build through boats already inside the canal',()=>{
 const game=new Game({random:()=>0});game.startWave();advance(game,6);const before=game.gold;
 assert.equal(game.buildDam('west-cut'),false);assert.equal(game.gold,before);assert.match(game.notice,/boat is in this canal/);
});
test('spawned boats use more than one open route',()=>{
 const rolls=[.1,.8,.2];let index=0;const game=new Game({random:()=>rolls[index++%rolls.length]});game.startWave();advance(game,2.1);
 assert.ok(new Set(game.enemies.map(e=>e.routePoints.map(p=>p.join(',')).join('|'))).size>1);
});
test('dam removal reopens paths, refunds part of cost, and cannot be refunded twice',()=>{
 const game=new Game({random:()=>0});game.buildDam('west-cut');const before=game.gold;
 assert.ok(game.removeDam('west-cut'));assert.equal(game.gold,before+Math.floor(damCost*.65));
 assert.equal(game.routes[0].length,1225);assert.equal(game.removeDam('west-cut'),false);
});
test('invalid, duplicate, unaffordable, and post-game dam purchases do not mutate state',()=>{
 const game=new Game({random:()=>0});assert.equal(game.buildDam('entry'),false);game.buildDam('west-cut');const gold=game.gold;
 assert.equal(game.buildDam('west-cut'),false);assert.equal(game.gold,gold);
 game.gold=0;assert.equal(game.buildDam('centre-cut'),false);game.gold=100;game.status='lost';assert.equal(game.buildDam('centre-cut'),false);
});
test('all dam markers sit on existing canals and every route ends at the gate',()=>{
 for(const site of damSites)assert.ok(canalEdges.some(e=>e.id===site.id));
 for(const route of findRoutes())assert.deepEqual(route.points.at(-1),[357,754]);
});

test('towers prioritise the boat nearest the goal across routes of different lengths',()=>{
 const game=new Game({random:()=>0});game.build(0,'bolt');
 const long={hp:100,maxHp:100,distance:200,routeLength:2000,speed:0,slow:0,reward:1};
 const short={hp:100,maxHp:100,distance:180,routeLength:300,speed:0,slow:0,reward:1};
 game.enemies=[long,short];game.update(.01);assert.equal(game.projectiles[0].target,short);
});

test('route choice uses a 75 percent shortest / 25 percent longest probability split',()=>{
 const routes=findRoutes();assert.ok(routes.length>2);
 assert.equal(chooseRoute(routes,0),routes[0]);assert.equal(chooseRoute(routes,.749999),routes[0]);
 assert.equal(chooseRoute(routes,.75),routes.at(-1));assert.equal(chooseRoute(routes,.999999),routes.at(-1));
 const choices=Array.from({length:100},(_,i)=>chooseRoute(routes,(i+.5)/100));
 assert.equal(choices.filter(r=>r===routes[0]).length,75);assert.equal(choices.filter(r=>r===routes.at(-1)).length,25);
 assert.equal(chooseRoute([],0),null);assert.equal(chooseRoute([routes[0]],.9),routes[0]);
});
test('boats retain their route preference when a dam changes the open canals',()=>{
 let samples=0;const game=new Game({random:()=>{samples++;return .9;}});game.startWave();advance(game,.1);
 const boat=game.enemies[0];assert.equal(boat.routeLength,findRoutes().at(-1).length);assert.equal(samples,1);
 const before={x:boat.x,y:boat.y};assert.ok(game.buildDam('west-cut'));
 assert.equal(samples,1,'rerouting must reuse the existing choice');assert.equal(boat.routeRoll,.9);
 assert.deepEqual({x:boat.x,y:boat.y},before);assert.ok(!boat.routePoints.some(p=>!p.every(Number.isFinite)));
 assert.equal(boat.routeLength,routesFromPoint(before,game.dams).at(-1).length);
});
