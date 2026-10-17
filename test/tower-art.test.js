import test from 'node:test';
import assert from 'node:assert/strict';
import {aimDirection,directionalArt,muzzlePosition,weaponMount} from '../tower-art.js';
import {Game,sites} from '../engine.js';
test('all eight screen directions and wrapped angles choose the correct view',()=>{
  for(let i=0;i<8;i++)for(const turn of [-2,0,3])assert.equal(aimDirection(i*Math.PI/4+turn*Math.PI*2),i);
  assert.equal(aimDirection(-.01),0);
  assert.equal(aimDirection(Math.PI/8-.001),0);
  assert.equal(aimDirection(Math.PI/8+.001),1);
});
test('all generated weapon crops contain their mounting pivot and muzzle',()=>{
  for(const [type,art] of Object.entries(directionalArt))for(const f of art.frames){
    const [x,y,w,h]=f.crop;
    for(const [px,py] of [f.pivot,f.tip])assert.ok(px>=x&&px<=x+w&&py>=y&&py<=y+h,type+' crop must contain anchors');
  }
});
test('weapons track between shots and effects begin at the painted muzzle',()=>{
  const g=new Game();g.build(0,'bolt');const tower=g.towers[0];tower.cooldown=5;
  g.enemies=[{distance:110,speed:0,hp:100,maxHp:100,slow:0,reward:1}];
  g.update(.01);const [x,y]=sites[0],mount=weaponMount('bolt');
  assert.equal(tower.aim,Math.atan2(g.enemies[0].y-y-mount[1],g.enemies[0].x-x-mount[0]));
  assert.equal(g.effects.length,0);
  tower.cooldown=0;g.update(.01);
  const muzzle=muzzlePosition('bolt',x,y,tower.aim);
  assert.equal(g.effects[0].x,muzzle.x);assert.equal(g.effects[0].y,muzzle.y);assert.equal(g.effects[0].site,0);
});

test('tower hit bounds include the roof and weapon beyond the mooring',async()=>{
 const {towerBounds}=await import('../tower-art.js');
 for(const type of ['bolt','splash','frost']){
  const bounds=towerBounds(type,300,300,-Math.PI/2);
  assert.ok(bounds.top<265,'the tower roof must be selectable above the base hit target');
  assert.ok(bounds.left<300&&bounds.right>300&&bounds.bottom>300);
 }
});
