import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {raiderArt,boatDirection,drawRaider} from '../combat-art.js';
import {enemyTypes} from '../engine.js';
test('every painted vessel view contains its hull pivot and stays inside the generated atlas',()=>{
 for(const [type,art] of Object.entries(raiderArt)){
  const data=readFileSync(new URL('../assets/'+art.file,import.meta.url)),w=data.readUInt32BE(16),h=data.readUInt32BE(20);
  assert.ok(w>=1000&&h>=1000,'sprites must retain enough detail for high DPI screens');
  if(type==='airship')continue;
  assert.equal(art.frames.length,4);
  for(const {crop:[x,y,cw,ch],pivot:[px,py]} of art.frames){
   assert.ok(x>=0&&y>=0&&x+cw<=w&&y+ch<=h,type+' crop is inside its source image');
   assert.ok(px>=x&&px<=x+cw&&py>=y&&py<=y+ch,type+' crop contains the hull anchor');
  }
 }
});
test('cardinal turns switch painted views without rotating sails or masts',()=>{
 const records=[],stack=[];let rotation=0;
 const c={save(){stack.push(rotation);},restore(){rotation=stack.pop();},rotate(a){rotation+=a;},translate(){},beginPath(){},ellipse(){},fill(){},stroke(){},moveTo(){},lineTo(){},quadraticCurveTo(){},closePath(){},arc(){},fillRect(){},drawImage(image,...args){records.push({rotation,crop:args.slice(0,4),dest:args.slice(4)});}};
 for(const spec of enemyTypes.filter(e=>!e.flying)){
  records.length=0;const image={naturalWidth:1254,naturalHeight:1254};
  for(let direction=0;direction<4;direction++){
   const angle=direction*Math.PI/2;assert.equal(boatDirection(angle),direction);
   drawRaider(c,{...spec,x:0,y:0,hp:100,maxHp:100,angle,slow:0},0,{[spec.sprite]:image},{});
  }
  assert.equal(records.length,4);assert.equal(new Set(records.map(r=>r.crop.join(','))).size,4);
  assert.ok(records.every(r=>Math.abs(r.rotation)<.0001),'painted '+spec.name+' must keep the fixed camera');
  for(const turn of [-2,-1,1,2])assert.equal(boatDirection(turn*Math.PI*2),0);
 }
});
