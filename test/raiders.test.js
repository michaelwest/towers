import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,enemyTypes,waveProfile,position,pathPoints,pathLength,airRoute,airRouteLength} from '../engine.js';
import {damSites} from '../canals.js';
function target(kind,distance=200){const spec=enemyTypes[kind];return {...spec,kind,distance,routePoints:pathPoints,routeLength:pathLength,speed:0,hp:100,maxHp:100,slow:0,hit:0,id:1,...position(distance)};}
function advance(game,seconds){for(let t=0;t<seconds;t+=.01)game.update(.01);}
test('Ironclad armour reduces bolts by 65 percent but takes full cannon damage',()=>{
 for(const [type,damage] of [['bolt',19*.35],['splash',29]]){
  const g=new Game();g.build(0,type);const ironclad=target(3);g.enemies=[ironclad];g.update(.01);
  assert.equal(ironclad.hp,100,'damage must wait for impact');advance(g,.4);
  assert.ok(Math.abs(ironclad.hp-(100-damage))<.0001);
  assert.equal(ironclad.hitType,type);
 }
});
test('Smugglers move faster than skiffs and frost slows them only on impact',()=>{
 assert.ok(enemyTypes[4].speed>enemyTypes[0].speed);
 const g=new Game();g.build(0,'frost');const boat=target(4);g.enemies=[boat];g.update(.01);
 assert.equal(boat.slow,0);advance(g,.6);assert.ok(boat.slow>1);assert.equal(boat.hp,94);
});
test('cannons neither select airships nor damage them with a nearby ground explosion',()=>{
 const g=new Game();g.build(0,'splash');const air=target(5),boat=target(0,205);g.enemies=[air];g.update(.01);
 assert.equal(g.projectiles.length,0);
 g.enemies.push(boat);g.update(.01);assert.equal(g.projectiles[0].target,boat);
 advance(g,.4);assert.equal(air.hp,100);assert.equal(boat.hp,71);
});
test('crossbows and frost can intercept and slow an airship',()=>{
 for(const type of ['bolt','frost']){
  const g=new Game();g.build(0,type);const air=target(5);g.enemies=[air];g.update(.01);
  assert.equal(g.projectiles[0].target,air);assert.equal(g.projectiles[0].flying,true);
  advance(g,.6);assert.ok(air.hp<100);if(type==='frost')assert.ok(air.slow>1);
 }
});
test('airships follow a direct flight path that remains unchanged when dams open or close',()=>{
 const g=new Game();g.wave=6;g.queue=[{kind:5,at:0}];g.update(.01);const air=g.enemies[0];
 assert.equal(air.flying,true);assert.deepEqual(air.routePoints,airRoute);assert.equal(air.routeLength,airRouteLength);
 advance(g,1);const before={x:air.x,y:air.y,distance:air.distance};g.gold=1000;
 for(const dam of damSites){assert.ok(g.buildDam(dam.id));assert.deepEqual({x:air.x,y:air.y,distance:air.distance},before);}
 for(const dam of damSites)assert.ok(g.removeDam(dam.id));
 assert.deepEqual(air.routePoints,airRoute);assert.equal(air.distance,before.distance);
 advance(g,1);assert.ok(Math.abs(air.distance-before.distance-36)<.001);assert.deepEqual({x:air.x,y:air.y},(({x,y})=>({x,y}))(position(air.distance,airRoute)));
});
test('an escaped airship deals three gate damage exactly once and emits a visible gate impact',()=>{
 const g=new Game(),air={...enemyTypes[5],kind:5,id:1,hp:100,maxHp:100,slow:0,distance:airRouteLength-.1,routePoints:airRoute,routeLength:airRouteLength};
 g.enemies=[air];g.update(.01);assert.equal(g.health,17);assert.equal(g.enemies.length,0);
 assert.ok(g.effects.some(e=>e.kind==='gate-hit'&&e.damage===3&&e.y===686));
 g.update(.01);assert.equal(g.health,17);assert.equal(g.effects.filter(e=>e.kind==='gate-hit').length,1);
});
test('hits flash briefly, kills emit destruction effects, and dead enemies cannot damage the gate',()=>{
 const g=new Game(),boat=target(3);g.enemies=[boat];g.hit(boat,10,'bolt');assert.ok(boat.hit>0);
 advance(g,.2);assert.equal(boat.hit,0);
 boat.hp=0;boat.distance=pathLength;g.update(.01);assert.equal(g.health,20);assert.equal(g.kills,1);
 assert.ok(g.effects.some(e=>e.kind==='sink'&&e.special));
 const air=target(5);air.hp=0;g.enemies=[air];g.update(.01);assert.ok(g.effects.some(e=>e.kind==='air-burst'));
});
test('new threats are introduced gradually and airships remain rare',()=>{
 const waves=Array.from({length:10},(_,i)=>waveProfile(i+1));
 assert.ok(!waves[0].spawnOrder.some(k=>k>=3));assert.ok(!waves[1].spawnOrder.some(k=>k>=3));
 assert.ok(waves[2].spawnOrder.includes(4));assert.ok(waves[4].spawnOrder.includes(3));
 const airWaves=waves.flatMap((w,i)=>w.spawnOrder.filter(k=>k===5).map(()=>i+1));assert.deepEqual(airWaves,[6,8,10]);
 assert.ok(waves.every(w=>w.spawnOrder.filter(k=>k===5).length<=1));
});
