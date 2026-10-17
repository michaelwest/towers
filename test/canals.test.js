import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,position} from '../engine.js';
import {findRoutes,damSites,damCost,canalEdges} from '../canals.js';
function advance(game,time){for(let t=0;t<time;t+=1/60)game.update(1/60);}
test('open canals offer multiple routes and dams lengthen the shortest route',()=>{
 const game=new Game();assert.ok(game.routes.length>1);assert.equal(game.routes[0].length,1019);
 assert.ok(game.buildDam('west-cut'));assert.ok(game.routes[0].length>1019);
 assert.ok(game.buildDam('centre-cut'));assert.ok(game.buildDam('east-cut'));
 assert.equal(game.routes.length,1);assert.equal(game.routes[0].length,2333);
});
test('a complete blockade is rejected without spending gold or changing the map',()=>{
 const game=new Game();game.buildDam('west-cut');const before=game.gold;
 assert.equal(game.buildDam('east-upper'),false);assert.equal(game.gold,before);
 assert.deepEqual(game.dams,['west-cut']);assert.match(game.notice,/route.*open/);
});
test('all reachable dam configurations reject any closure that disconnects the entrance',()=>{
 for(let mask=0;mask<1<<damSites.length;mask++){
  const blocked=damSites.filter((_,i)=>mask&(1<<i)).map(s=>s.id);
  if(!findRoutes(blocked).length)continue;
  for(const site of damSites){
   if(blocked.includes(site.id))continue;
   const game=new Game();game.gold=1000;game.dams=[...blocked];game.routes=findRoutes(blocked);
   const possible=findRoutes([...blocked,site.id]).length>0;
   assert.equal(game.buildDam(site.id),possible,'configuration '+mask+' / '+site.id);
   assert.ok(game.routes.length>0);
  }
 }
});
test('live boats reroute without teleporting and continue along open canals',()=>{
 const game=new Game();game.startWave();advance(game,1);
 const boat=game.enemies[0],before={x:boat.x,y:boat.y};
 assert.ok(game.buildDam('west-cut'));assert.equal(boat.x,before.x);assert.equal(boat.y,before.y);
 assert.deepEqual(position(boat.distance,boat.routePoints),{...before,angle:Math.PI/2});
 game.update(1/60);assert.ok(Math.hypot(boat.x-before.x,boat.y-before.y)<=boat.speed/60+.001);
});
test('cannot build through boats already inside the canal',()=>{
 const game=new Game();game.startWave();advance(game,3);const before=game.gold;
 assert.equal(game.buildDam('west-cut'),false);assert.equal(game.gold,before);assert.match(game.notice,/boat is in this canal/);
});
test('spawned boats use more than one open route',()=>{
 const game=new Game();game.startWave();advance(game,2.1);
 assert.ok(new Set(game.enemies.map(e=>e.routePoints.map(p=>p.join(',')).join('|'))).size>1);
});
test('dam removal reopens paths, refunds part of cost, and cannot be refunded twice',()=>{
 const game=new Game();game.buildDam('west-cut');const before=game.gold;
 assert.ok(game.removeDam('west-cut'));assert.equal(game.gold,before+Math.floor(damCost*.65));
 assert.equal(game.routes[0].length,1019);assert.equal(game.removeDam('west-cut'),false);
});
test('invalid, duplicate, unaffordable, and post-game dam purchases do not mutate state',()=>{
 const game=new Game();assert.equal(game.buildDam('entry'),false);game.buildDam('west-cut');const gold=game.gold;
 assert.equal(game.buildDam('west-cut'),false);assert.equal(game.gold,gold);
 game.gold=0;assert.equal(game.buildDam('centre-cut'),false);game.gold=100;game.status='lost';assert.equal(game.buildDam('centre-cut'),false);
});
test('all dam markers sit on existing canals and every route ends at the gate',()=>{
 for(const site of damSites)assert.ok(canalEdges.some(e=>e.id===site.id));
 for(const route of findRoutes())assert.deepEqual(route.points.at(-1),[357,754]);
});

test('towers prioritise the boat nearest the goal across routes of different lengths',()=>{
 const game=new Game();game.build(0,'bolt');
 const long={hp:100,maxHp:100,distance:200,routeLength:2000,speed:0,slow:0,reward:1};
 const short={hp:100,maxHp:100,distance:180,routeLength:300,speed:0,slow:0,reward:1};
 game.enemies=[long,short];game.update(.01);assert.equal(game.projectiles[0].target,short);
});
