// Boats turn within a fixed camera; masts and sails must never rotate with the hull.
const view=(crop,pivot)=>({crop,pivot});
export const raiderArt={
 skiff:{file:'skiff-views.png',box:64,scale:.071,frames:[
  view([8,125,665,450],[340,348]),view([708,35,535,560],[965,350]),
  view([17,697,670,463],[340,955]),view([708,638,536,600],[960,900])
 ]},
 raider:{file:'raider-views.png',box:78,scale:.078,frames:[
  view([50,34,700,568],[395,350]),view([788,0,336,600],[964,330]),
  view([11,657,700,518],[345,973]),view([790,602,350,639],[964,949])
 ]},
 galleon:{file:'galleon-views.png',box:96,scale:.08,frames:[
  view([35,50,800,540],[432,389]),view([850,0,350,624],[1019,359]),
  view([0,660,805,510],[401,1005]),view([850,625,350,625],[1018,973])
 ]},
 ironclad:{file:'ironclad-views.png',box:86,scale:.085,frames:[
  view([0,110,740,500],[380,415]),view([740,36,505,580],[975,400]),
  view([0,686,730,538],[373,1020]),view([736,640,510,590],[970,980])
 ]},
 smuggler:{file:'smuggler-views.png',box:74,scale:.066,frames:[
  view([75,30,735,570],[445,443]),view([855,0,290,620],[1005,376]),
  view([45,640,770,540],[425,1074]),view([858,620,300,615],[1008,980])
 ]},
 airship:{file:'airship.png',box:106}
};
export function boatDirection(angle){return ((Math.round(angle/(Math.PI/2))%4)+4)%4;}
export function spriteFrame(image,sprite,angle){
 const art=raiderArt[sprite];
 if(art.frames){const f=art.frames[boatDirection(angle)];return {...f,scale:art.scale};}
 if(sprite==='airship')return {crop:[0,0,image.naturalWidth,image.naturalHeight],pivot:[image.naturalWidth*.5,image.naturalHeight*.51],scale:art.box/image.naturalWidth};
 const direction=boatDirection(angle),w=image.naturalWidth/2,h=image.naturalHeight/2,x=direction%2*w,y=Math.floor(direction/2)*h;
 return {crop:[x,y,w,h],pivot:[x+w/2,y+h*.58],scale:art.box/w};
}
export function flashAtlas(image){
 const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
 const c=canvas.getContext('2d');c.drawImage(image,0,0);c.globalCompositeOperation='source-in';c.fillStyle='#f3fffa';c.fillRect(0,0,canvas.width,canvas.height);
 return canvas;
}
function circle(c,x,y,r,fill,stroke){c.beginPath();c.arc(x,y,Math.max(0,r),0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function polygon(c,points,fill,stroke){c.beginPath();for(let i=0;i<points.length;i++)i?c.lineTo(...points[i]):c.moveTo(...points[i]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function snowflake(c,x,y,r){c.beginPath();for(let i=0;i<3;i++){const a=i*Math.PI/3,dx=Math.cos(a)*r,dy=Math.sin(a)*r;c.moveTo(x-dx,y-dy);c.lineTo(x+dx,y+dy);}c.stroke();}
export function drawRaider(c,e,anim,images,flashes){
 const sprite=e.sprite||['skiff','raider','galleon'][e.kind]||'skiff',art=raiderArt[sprite],image=images[sprite];
 const length=e.length||37,width=e.width||22,bob=e.flying?Math.sin(anim*.002+e.id)*1.5:0;
 c.save();c.translate(e.x,e.y+bob);
 // Airships cast a detached shadow across both stone and water.
 c.save();c.translate(e.flying?18:2,e.flying?30:4);c.rotate(e.angle);c.globalAlpha=e.flying?.24:.18;c.fillStyle='#071d25';c.beginPath();c.ellipse(0,0,length*.5,width*.32,0,0,Math.PI*2);c.fill();c.restore();
 if(!e.flying){
  c.save();c.rotate(e.angle);c.lineWidth=1.1;c.strokeStyle=e.slow>0?'#dcfff5':'#c1eee0';
  for(let i=0;i<3;i++){const offset=(anim*(sprite==='smuggler'?.026:.018)+i*8)%28;c.globalAlpha=(1-offset/32)*.55;c.beginPath();c.moveTo(-length/2-offset,-width*.33-offset*.15);c.quadraticCurveTo(-length/2-offset-8,0,-length/2-offset,width*.33+offset*.15);c.stroke();}
  c.restore();
 }
 if(e.slow>0){
  c.save();c.rotate(e.angle);c.fillStyle='#90eae943';c.strokeStyle='#b7fff3bb';c.lineWidth=1.2;c.beginPath();c.ellipse(0,2,length*.65,width*.65,0,0,Math.PI*2);c.fill();c.stroke();
  for(let i=0;i<6;i++){const a=i*Math.PI/3;polygon(c,[[Math.cos(a)*length*.55,Math.sin(a)*width*.5],[Math.cos(a+.12)*length*.7,Math.sin(a+.12)*width*.75],[Math.cos(a+.28)*length*.55,Math.sin(a+.28)*width*.5]],'#d4fff2b0');}c.restore();
 }
 if(image){
  const {crop,pivot,scale}=spriteFrame(image,sprite,e.angle),[sx,sy,sw,sh]=crop,box=[(sx-pivot[0])*scale,(sy-pivot[1])*scale,sw*scale,sh*scale];
  // Anchors stay in screen space. No canvas rotation is applied to painted vessels.
  c.drawImage(image,...crop,...box);
  const flash=flashes[sprite];
  if(flash&&(e.hit>0||e.slow>0)){
   c.save();c.globalAlpha=e.hit>0?Math.min(.8,e.hit/.14*.8):.25;c.drawImage(flash,...crop,...box);c.restore();
  }
 }else{
  c.save();c.rotate(e.angle);
  if(e.flying){const g=c.createLinearGradient(0,-18,0,18);g.addColorStop(0,'#fbefcc');g.addColorStop(.5,'#b8614e');g.addColorStop(1,'#7c4138');c.fillStyle=g;c.beginPath();c.ellipse(0,0,36,18,0,0,Math.PI*2);c.fill();c.strokeStyle='#e9c788';for(const x of [-18,0,18]){c.beginPath();c.ellipse(x,0,4,16,0,0,Math.PI*2);c.stroke();}}
  else polygon(c,[[length/2,0],[length/3,-width/2],[-length/2,-width/2],[-length/2,width/2],[length/3,width/2]],sprite==='ironclad'?'#536168':sprite==='smuggler'?'#b96842':'#986e4b','#e4c08a');
  c.restore();
  if(sprite!=='ironclad'&&!e.flying){c.strokeStyle='#d7b17c';c.lineWidth=2;c.beginPath();c.moveTo(0,3);c.lineTo(0,-24);c.stroke();polygon(c,[[0,-24],[15,-5],[1,-4]],'#f4e7c8');}
 }
 if(e.slow>0){c.strokeStyle='#d9fff6';c.lineWidth=1.2;for(const [x,y,r] of [[-12,-5,4],[9,6,3],[3,-17,4]])snowflake(c,x,y,r);}
 c.restore();
}
// Draw status in a final foreground pass, above piers, towers, the gate and effects.
export function drawRaiderHealth(c,e,anim){
 const sprite=e.sprite||['skiff','raider','galleon'][e.kind]||'skiff',art=raiderArt[sprite];
 const bob=e.flying?Math.sin(anim*.002+e.id)*1.5:0;
 c.save();c.translate(e.x,e.y+bob);
 const barY=-art.box*.45-5,barW=e.flying?42:34;
 c.fillStyle='#10262ae8';c.fillRect(-barW/2-1,barY-1,barW+2,5);
 c.fillStyle=e.slow>0?'#b0fff0':sprite==='ironclad'?'#b9ced7':e.flying?'#eea984':'#ecc181';c.fillRect(-barW/2,barY,barW*Math.max(0,e.hp/e.maxHp),3);
 if(sprite==='ironclad')polygon(c,[[-barW/2-9,barY-2],[-barW/2-3,barY-2],[-barW/2-3,barY+3],[-barW/2-6,barY+6],[-barW/2-9,barY+3]],'#a9c2cc','#e1edf0');
 if(e.flying){c.strokeStyle='#ebcba1';c.lineWidth=1;c.beginPath();c.moveTo(-barW/2-12,barY+1);c.lineTo(-barW/2-8,barY+4);c.lineTo(-barW/2-4,barY+1);c.stroke();}
 c.restore();
}
export function drawGateDamage(c,health,anim){
 if(health>=20)return;
 const severity=(20-health)/20;
 c.save();
 // Fissures stay attached to the masonry, with soot and embers as integrity falls.
 c.strokeStyle='#3f302bd9';c.lineWidth=1+severity;
 const cracks=[[[326,660],[330,667],[326,672],[331,680],[329,691]],[[388,666],[382,675],[386,680],[381,690],[384,701]],[[340,653],[344,658],[342,664],[350,668]]];
 for(let i=0;i<Math.ceil(severity*3);i++){c.beginPath();cracks[i].forEach((p,n)=>n?c.lineTo(...p):c.moveTo(...p));c.stroke();}
 if(health<=10){
  const soot=c.createRadialGradient(382,690,1,382,690,17);soot.addColorStop(0,'#1d242985');soot.addColorStop(1,'#1d242900');c.fillStyle=soot;c.fillRect(365,673,34,34);
  for(const [x,y] of [[310,682],[402,688]]){
   const stain=c.createRadialGradient(x,y,1,x,y,11);stain.addColorStop(0,'#212429aa');stain.addColorStop(1,'#21242900');c.fillStyle=stain;c.fillRect(x-11,y-11,22,22);
  }
  const pulse=.7+Math.sin(anim*.004)*.15;c.globalAlpha=pulse;circle(c,386,695,health<=5?5:3,'#d7834599');circle(c,386,694,health<=5?2.5:1.5,'#ffd591');
  if(health<=5){
   c.globalAlpha=.9;
   for(const [x,y,h] of [[310,687,12],[402,693,9]]){
    polygon(c,[[x-4,y],[x-3,y-h*.55],[x,y-h],[x+1,y-h*.4],[x+4,y-2],[x+2,y+2]],'#cf6f3f');
    polygon(c,[[x-2,y],[x,y-h*.65],[x+2,y]],'#ffe4a0');
   }
   for(let i=0;i<6;i++){const x=i<3?304+i*6:390+(i-3)*6,y=710+(i%2)*3;polygon(c,[[x,y],[x+3,y-4],[x+7,y+1]],'#79766a','#bcb59c');}
  }
  for(let i=0;i<3;i++){const phase=(anim*.0003+i*.31)%1;c.globalAlpha=(1-phase)*.18;circle(c,384+Math.sin(i+phase*4)*5,686-phase*24,3+phase*5,'#283039');}
 }
 c.restore();
}
function sparks(c,x,y,r,count,fade,color){
 c.strokeStyle=color;c.lineWidth=1.4;for(let i=0;i<count;i++){const a=i*Math.PI*2/count+.3,inner=r*.65;c.beginPath();c.moveTo(x+Math.cos(a)*inner,y+Math.sin(a)*inner);c.lineTo(x+Math.cos(a)*(r+4*fade),y+Math.sin(a)*(r+4*fade));c.stroke();}
}
export function drawCombatEffect(c,e){
 const fade=e.life/e.max,t=1-fade;c.save();
 if(e.kind==='muzzle'){
  c.globalAlpha=fade;c.shadowColor=e.type==='frost'?'#aefff3':'#ffd888';c.shadowBlur=8;circle(c,e.x,e.y,(e.type==='splash'?8:e.type==='frost'?6:3)*fade,e.type==='frost'?'#c9fff3':'#ffe3a1');
 }else if(e.kind==='gate-hit'){
  c.globalAlpha=fade;c.lineWidth=2;circle(c,e.x,e.y,12+t*35,null,'#ffb17c');sparks(c,e.x,e.y,8+t*26,9,fade,'#f8dfaf');
  for(let i=0;i<5;i++){c.globalAlpha=fade*.4;circle(c,e.x+(i-2)*(5+t*5),e.y-5-t*(15+i*3),4+t*6,'#c7baa2');}
  c.globalAlpha=fade;c.fillStyle='#ffd2b5';c.font='bold 16px sans-serif';c.textAlign='center';c.fillText('−'+e.damage,e.x,e.y-25-t*23);
 }else if(e.kind==='sink'||e.kind==='air-burst'){
  c.globalAlpha=fade;
  if(e.kind==='sink'){c.lineWidth=1;circle(c,e.x,e.y,9+t*22,null,'#b3e5d0');circle(c,e.x,e.y,3+t*14,null,'#e2f3d7');}
  else{const glow=c.createRadialGradient(e.x,e.y,0,e.x,e.y,8+t*25);glow.addColorStop(0,'#fff0bc');glow.addColorStop(.4,'#ed9b5caa');glow.addColorStop(1,'#b8694b00');c.fillStyle=glow;c.fillRect(e.x-34,e.y-34,68,68);}
  for(let i=0;i<5;i++){const a=i*2.4+(e.angle||0),r=6+t*20;c.fillStyle=e.kind==='sink'?'#a18054':'#e3a86e';c.fillRect(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r+t*t*8,3*fade,2*fade);}
  if(e.special){c.fillStyle='#f2d58e';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText('+'+e.reward,e.x,e.y-15-t*22);}
 }else if(e.kind==='impact'){
  c.globalAlpha=fade;
  if(e.type==='splash'){
   const radius=10+t*47,glow=c.createRadialGradient(e.x,e.y,0,e.x,e.y,radius);
   glow.addColorStop(0,'#fff1c2dd');glow.addColorStop(.28,'#f3ba6fa0');glow.addColorStop(.7,'#c27a4d44');glow.addColorStop(1,'#c27a4d00');c.fillStyle=glow;c.fillRect(e.x-radius,e.y-radius,radius*2,radius*2);
   c.lineWidth=2*fade+.5;circle(c,e.x,e.y,radius,null,'#f3d6a9');sparks(c,e.x,e.y,6+t*35,9,fade,'#ffe4a8');
   for(let i=0;i<5;i++){const a=i*1.9;c.globalAlpha=fade*.28;circle(c,e.x+Math.cos(a)*t*23,e.y+Math.sin(a)*t*17-t*9,3+t*8,'#918b7e');}
  }else if(e.type==='frost'){
   circle(c,e.x,e.y,4+t*23,'#acfff529','#c7fff1');c.strokeStyle='#edfff8';c.lineWidth=1.2;for(let i=0;i<6;i++){const a=i*Math.PI/3,r=5+t*20;snowflake(c,e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,3*fade);}
  }else{circle(c,e.x,e.y,5*fade,e.armoured?'#e4f5ff':'#fff0bf');sparks(c,e.x,e.y,3+t*13,e.armoured?6:4,fade,e.armoured?'#c9e9f5':'#ffd395');}
 }
 c.restore();
}
