import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,pathLength,position,towerTypes} from '../engine.js';
function tick(g,seconds){for(let t=0;t<seconds;t+=.05)g.update(.05);}
test('building spends gold, rejects occupied sites and unaffordable towers',()=>{const g=new Game();assert.equal(g.build(0,'bolt'),true);assert.equal(g.gold,155);assert.equal(g.build(0,'splash'),false);assert.equal(g.build(1,'splash'),true);assert.equal(g.build(2,'frost'),false);assert.equal(g.gold,45);});
test('path reaches the southern city gate',()=>{assert.deepEqual(position(0),{x:122,y:-30,angle:Math.PI/2});assert.equal(position(pathLength).y,754);});
test('undefended boats cost integrity and clearing a wave awards a bonus',()=>{const g=new Game();g.startWave();tick(g,100);assert.equal(g.health,11);assert.equal(g.active,false);assert.equal(g.status,'ready');assert.equal(g.gold,248);});
test('towers kill enemies and earn gold',()=>{const g=new Game();g.build(0,'bolt');g.build(1,'bolt');g.build(2,'bolt');g.startWave();tick(g,100);assert.ok(g.kills>0);assert.ok(g.health>11);assert.ok(g.gold>25);});
test('upgrades are capped and selling refunds invested gold',()=>{const g=new Game();g.build(0,'bolt');const t=g.towers[0];assert.equal(g.upgrade(t),true);assert.equal(t.level,2);g.gold=1000;assert.equal(g.upgrade(t),true);assert.equal(g.upgrade(t),false);const before=g.gold;g.sell(t);assert.equal(g.towers.length,0);assert.equal(g.gold-before,Math.floor(towerTypes.bolt.cost*3.25*.65));});
test('slow towers slow enemies, splash hits adjacent boats',()=>{for(const type of ['frost','splash']){const g=new Game();g.build(0,type);g.wave=1;g.enemies=[0,5].map((offset,i)=>({x:122,y:60+offset,distance:90+offset,speed:1,hp:100,maxHp:100,slow:0,reward:1,id:i}));g.update(.05);assert.ok(g.enemies.every(e=>e.hp===100));tick(g,.4);if(type==='frost')assert.ok(g.enemies.some(e=>e.slow>1&&e.slow<=2));else assert.ok(g.enemies.every(e=>e.hp===71));}});
test('loss ends spawning and blocks builds and waves',()=>{const g=new Game();g.health=1;g.startWave();tick(g,70);assert.equal(g.status,'lost');assert.equal(g.health,0);assert.equal(g.startWave(),false);assert.equal(g.build(0,'bolt'),false);});
test('clearing the tenth wave wins',()=>{const g=new Game();g.wave=9;g.startWave();g.queue=[];g.update(.05);assert.equal(g.status,'won');assert.equal(g.startWave(),false);});

test('waves grow from 9 to 68 boats, with increasing counts and tighter spawns',()=>{
 const waves=Array.from({length:10},(_,index)=>{const game=new Game();game.wave=index;game.startWave();return game.queue;});
 assert.equal(waves[0].length,9);assert.equal(waves[9].length,68);
 for(let i=1;i<waves.length;i++){
  assert.ok(waves[i].length>waves[i-1].length);
  assert.ok(waves[i][1].at-waves[i][0].at<waves[i-1][1].at-waves[i-1][0].at);
 }
 assert.ok(waves[9].some(enemy=>enemy.kind===2));
});
