import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,position} from '../engine.js';
function enemy(distance=200){return {distance,speed:0,hp:100,maxHp:100,slow:0,reward:9,kind:0,...position(distance)};}
function fixture(type){const game=new Game();game.build(0,type);game.enemies=[enemy()];game.update(.01);return game;}
function advance(game,time){for(let t=0;t<time;t+=.01)game.update(.01);}
test('bolts leave the muzzle, move through space, and damage only on arrival',()=>{
 const game=fixture('bolt'),target=game.enemies[0],shot=game.projectiles[0];
 assert.equal(target.hp,100);assert.equal(shot.x,shot.sx);assert.equal(shot.y,shot.sy);
 game.update(.04);assert.notEqual(shot.x,shot.sx);assert.equal(target.hp,100);
 advance(game,.4);assert.equal(target.hp,81);assert.equal(game.projectiles.length,0);
 assert.ok(game.effects.some(e=>e.kind==='impact'));
});
test('cannonballs land before applying area damage to nearby enemies',()=>{
 const game=new Game();game.build(0,'splash');game.enemies=[enemy(),enemy(205),enemy(280)];game.update(.01);
 assert.ok(game.enemies.every(e=>e.hp===100));assert.equal(game.projectiles.length,1);
 const flight=game.projectiles[0].duration;advance(game,flight+.02);
 assert.deepEqual(game.enemies.map(e=>e.hp),[71,71,100]);
 assert.ok(game.effects.some(e=>e.kind==='impact'&&e.type==='splash'));
});
test('frost slows a boat only when the projectile arrives',()=>{
 const game=fixture('frost'),target=game.enemies[0];
 assert.equal(target.slow,0);assert.equal(target.hp,100);
 advance(game,.6);assert.equal(target.hp,94);assert.ok(target.slow>1&&target.slow<=2);
});
test('a shot whose target is already dead grants no duplicate kill or gold',()=>{
 const game=fixture('bolt');game.enemies[0].hp=0;const initialGold=game.gold;
 game.update(.01);assert.equal(game.kills,1);assert.equal(game.gold,initialGold+9);
 advance(game,.5);assert.equal(game.kills,1);assert.equal(game.gold,initialGold+9);assert.equal(game.projectiles.length,0);
});
test('waves wait for in-flight projectiles and clear after they expire',()=>{
 const game=fixture('bolt');game.active=true;game.wave=1;game.enemies[0].escaped=true;
 game.update(.01);assert.equal(game.active,true);
 advance(game,.5);assert.equal(game.active,false);assert.equal(game.projectiles.length,0);
});
