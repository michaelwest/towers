import {Game,W,H,pathPoints,sites,towerTypes,position} from './engine.js';
import {paintSprite} from './art.js';
import {directionalArt,drawDirectionalTower} from './tower-art.js';
const $=id=>document.getElementById(id), canvas=$('board'),ctx=canvas.getContext('2d');
let game=new Game(),selected='bolt',focus=null,paused=false,speed=1,last=0,sound=false,audio,hover=-1,accumulator=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const decor=document.createElement('canvas');decor.width=W;decor.height=H;const d=decor.getContext('2d');
function resizeBoard(){
 const width=Math.max(1,Math.round(canvas.getBoundingClientRect().width*Math.min(window.devicePixelRatio||1,3)));
 const height=Math.round(width*H/W);
 if(canvas.width===width&&canvas.height===height)return;
 canvas.width=decor.width=width;canvas.height=decor.height=height;
 const scale=width/W;
 for(const context of [ctx,d]){context.setTransform(scale,0,0,scale,0,0);context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';}
 makeDecor();
}

function poly(c,pts,fill,stroke){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function circle(c,x,y,r,fill,stroke){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
let seed=187;function rand(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
function canal(c,width,color){c.beginPath();pathPoints.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.stroke();}
function nearPath(x,y,margin){for(let i=1;i<pathPoints.length;i++){const a=pathPoints[i-1],b=pathPoints[i];const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));if(Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)<margin)return true;}return false;}
const terrain=new Image();
let terrainReady=false;
terrain.onload=()=>{terrainReady=true;makeDecor();};
terrain.src=new URL('./assets/venice-stone.png',import.meta.url).href;
const gate=new Image();
let gateReady=false;
gate.onload=()=>{gateReady=true;makeDecor();};
gate.src=new URL('./assets/arsenal-gate.png',import.meta.url).href;
const atlas=new Image();
let artReady=false,buildingIndex=0;
atlas.src=new URL('./assets/venice-atlas.png',import.meta.url).href;
const directionalImages={};
function updateTowerIcons(){if(!artReady)return;document.querySelectorAll('.tower-art').forEach(el=>{const icon=document.createElement('canvas');icon.width=240;icon.height=288;icon.setAttribute('aria-hidden','true');const c=icon.getContext('2d'),type=el.parentElement.dataset.type;c.scale(2,2);c.imageSmoothingQuality='high';if(directionalImages[type]){c.translate(60,117);c.scale(1.5,1.5);drawDirectionalTower(c,directionalImages[type],type,-Math.PI/4);}else{paintSprite(c,atlas,type,10,0,100,142);}el.replaceChildren(icon);});}
for(const [type,art] of Object.entries(directionalArt)){const image=new Image();image.onload=()=>{directionalImages[type]=image;updateTowerIcons();};image.src=new URL('./assets/'+art.file,import.meta.url).href;}
atlas.onload=()=>{artReady=true;makeDecor();updateTowerIcons();};
atlas.onerror=()=>{game.notice='Illustrations unavailable. Using the built-in map artwork.';};
function house(x,y,w,h,color){if(artReady){const kind=buildingIndex++%2?'townhouses':'palazzo';paintSprite(d,atlas,kind,x-6,y,w+14,h+10);return;}d.fillStyle='#142e2b66';d.fillRect(x+7,y+8,w,h);d.fillStyle=color;d.fillRect(x,y,w,h);d.fillStyle='#ad9c73';d.fillRect(x,y+h-8,w,8);poly(d,[[x-3,y],[x+w/2,y-13],[x+w+3,y],[x+w/2,y+12]],'#89674d','#4b5547');d.fillStyle='#b78660';d.fillRect(x+2,y,w-4,3);d.fillStyle='#263c35';for(let i=7;i<w-4;i+=12){d.fillRect(x+i,y+15,5,9);if(h>40)d.fillRect(x+i,y+30,5,8);}d.fillStyle='#d1b680';d.fillRect(x+w/2-4,y+h-14,8,14);}
function tree(x,y){d.fillStyle='#132e2866';d.fillRect(x+3,y+1,12,23);circle(d,x,y,12,'#314c3d');circle(d,x-4,y-4,8,'#45634a');circle(d,x+4,y-7,6,'#526c4e');}
function makeDecor(){seed=187;buildingIndex=0;d.clearRect(0,0,W,H);d.fillStyle='#697962';d.fillRect(0,0,W,H);if(terrainReady){const paving=d.createPattern(terrain,'repeat');paving.setTransform(new DOMMatrix().scale(240/terrain.naturalWidth,240/terrain.naturalHeight));d.fillStyle=paving;d.fillRect(0,0,W,H);d.fillStyle='#243c3538';d.fillRect(0,0,W,H);}for(let y=0;y<H&&!terrainReady;y+=24)for(let x=0;x<W;x+=29){d.strokeStyle=rand()>.5?'#75816b16':'#253f3322';d.strokeRect(x+(y%48?14:0),y,28,23);}
canal(d,105,'#354c3b');canal(d,97,'#6c8066');canal(d,91,'#beb18a');canal(d,80,'#d0c099');canal(d,73,'#173e40');canal(d,65,'#286364');canal(d,52,'#2b6c6a');canal(d,31,'#2e716c');
// Sunlit limestone and a deep water gradient make the banks readable at phone size.
for(let i=0;i<1150;i++){const x=rand()*W,y=rand()*H;if(nearPath(x,y,29)){d.fillStyle=rand()>.5?'#a6e0c612':'#062e3910';d.fillRect(x,y,8+rand()*12,1);}}
// Masonry joints along the pale canal banks.
for(let i=0;i<pathPoints.length-1;i++){const a=pathPoints[i],b=pathPoints[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=(b[0]-a[0])/len,dy=(b[1]-a[1])/len;for(let v=10;v<len-35;v+=19){d.strokeStyle='#697b6022';d.lineWidth=2;for(const side of [-1,1]){d.beginPath();d.moveTo(a[0]+dx*v-dy*side*37,a[1]+dy*v+dx*side*37);d.lineTo(a[0]+dx*v-dy*side*44,a[1]+dy*v+dx*side*44);d.stroke();}}}
for(let i=0;i<170;i++){const x=rand()*W,y=rand()*H;if(!nearPath(x,y,76)&&!sites.some(p=>Math.hypot(x-p[0],y-p[1])<36)){if(rand()>.64)tree(x,y);else{d.fillStyle='#80907133';d.fillRect(x,y,3,2);}}}
// Venetian blocks, terracotta roofs and waterfront palazzi.
house(224,157,39,38,'#b3a17c');house(274,158,44,34,'#bba681');house(325,160,31,36,'#988e6e');house(373,155,51,40,'#b8aa82');house(443,164,32,30,'#a59670');
house(231,307,47,34,'#a99878');house(294,309,35,31,'#c0ae87');house(349,311,50,30,'#aa9874');house(425,310,51,32,'#b7ab81');house(492,310,36,31,'#a99372');
house(198,462,49,40,'#baab82');house(262,461,37,30,'#a79474');house(333,461,39,37,'#b8a784');house(391,461,40,31,'#a39773');house(452,460,42,33,'#c0ac83');house(511,463,35,28,'#a69673');
house(25,463,41,51,'#bbaa81');house(26,550,39,42,'#b9a17b');house(87,581,45,36,'#b4a57d');house(156,577,35,40,'#bfa67e');house(199,589,44,35,'#a69c78');house(84,665,39,37,'#b9a880');house(150,660,55,36,'#b7a27e');house(224,673,35,38,'#9f936e');
house(481,647,48,43,'#c1af82');house(547,647,39,41,'#b39d75');house(610,609,35,46,'#bcaa84');house(620,688,45,40,'#a79772');house(664,232,34,45,'#b09c72');house(665,321,36,32,'#9d9470');house(666,440,33,39,'#b1a17b');
// Small piazza and a domed basilica in the lower-left quarter.
if(artReady){paintSprite(d,atlas,'basilica',9,323,82,90);}else{d.fillStyle='#a5a181';d.fillRect(22,318,61,100);d.strokeStyle='#777e60';d.strokeRect(26,322,53,92);d.fillStyle='#ac9d75';d.fillRect(30,352,44,51);d.fillStyle='#d0ba8a';d.fillRect(34,363,36,40);poly(d,[[28,352],[52,336],[76,352]],'#b6a37b');circle(d,52,336,13,'#819482');d.fillStyle='#819482';d.fillRect(39,336,26,15);d.fillStyle='#d3c08f';d.fillRect(50,316,4,9);d.fillStyle='#33493d';for(let x=40;x<70;x+=11)d.fillRect(x,377,5,17);
}
// Retain a simple gate if the generated landmark cannot load.
if(!gateReady){
 d.fillStyle='#263f36';d.fillRect(317,686,82,40);d.fillStyle='#b5aa81';d.fillRect(318,678,25,48);d.fillRect(371,678,25,48);d.fillRect(337,685,40,13);d.fillStyle='#7e8e75';d.fillRect(318,674,25,6);d.fillRect(371,674,25,6);
}
}
makeDecor();
resizeBoard();
new ResizeObserver(resizeBoard).observe(canvas);
window.addEventListener('resize',resizeBoard);
function drawTower(c,t){const [x,y]=sites[t.site],spec=towerTypes[t.type];c.save();c.translate(x,y);circle(c,3,5,22,'#152f2b55');circle(c,0,0,21,'#9a9b75','#c2bb91');circle(c,0,0,17,'#576853','#738669');if(directionalImages[t.type]){const shot=game.effects.find(e=>e.site===t.site&&e.kind==='muzzle');drawDirectionalTower(c,directionalImages[t.type],t.type,t.aim,shot?Math.sin(shot.life/shot.max*Math.PI)*2:0);}else if(artReady&&t.type==='frost'){const height=66;paintSprite(c,atlas,t.type,-27,17-height,54,height);if(t.type==='frost'){c.save();c.globalAlpha=.25;circle(c,0,-37,12,'#8bf4e8');c.restore();}}else if(t.type==='bolt'){c.fillStyle='#cbb985';c.fillRect(-10,-17,20,28);c.fillStyle='#a38e65';c.fillRect(3,-17,7,28);poly(c,[[-14,-17],[0,-30],[14,-17]],'#966b4b','#c19461');c.fillStyle='#33463a';c.fillRect(-4,-12,7,10);c.save();c.rotate(t.aim);c.strokeStyle='#e1c58c';c.lineWidth=4;c.beginPath();c.moveTo(1,0);c.lineTo(22,0);c.stroke();c.lineWidth=2;c.beginPath();c.moveTo(17,-10);c.lineTo(20,0);c.lineTo(17,10);c.stroke();c.restore();}else if(t.type==='splash'){circle(c,0,0,13,'#a58c66');c.save();c.rotate(t.aim);c.fillStyle='#283c37';c.fillRect(-5,-8,29,16);c.fillStyle='#6d8172';c.fillRect(-3,-6,24,4);c.fillStyle='#1a302e';c.fillRect(20,-8,5,16);c.restore();circle(c,-6,6,4,'#d4ac73');}else{poly(c,[[-12,10],[0,-24],[12,10]],'#83b5a5','#c3d7ba');poly(c,[[0,-24],[3,7],[12,10]],'#4c968d');circle(c,0,-12,5,'#c3eee0');c.fillStyle='#9ba780';c.fillRect(-14,9,28,5);}if(t.level>1){c.fillStyle=spec.color;for(let i=0;i<t.level;i++)circle(c,(i-(t.level-1)/2)*7,24,2,spec.color);}c.restore();}
function draw(time){ctx.clearRect(0,0,W,H);ctx.drawImage(decor,0,0,W,H);const anim=reduced?0:time;
// Soft canal currents, directional arrows and gently moving ripples.
ctx.save();ctx.strokeStyle='#9bc9b324';ctx.lineWidth=1;for(let i=15;i<2800;i+=57){const p=position((i+anim*.015)%2800);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.beginPath();ctx.moveTo(-7,-13);ctx.quadraticCurveTo(0,-9,7,-13);ctx.moveTo(-3,12);ctx.lineTo(8,12);ctx.stroke();ctx.restore();}ctx.setLineDash([3,10]);ctx.strokeStyle='#abc9b51a';ctx.beginPath();pathPoints.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();ctx.restore();
for(let i=0;i<sites.length;i++){if(game.towers.some(t=>t.site===i))continue;const [x,y]=sites[i];const bright=i===hover;circle(ctx,x+2,y+3,20,'#203e3155');circle(ctx,x,y,19,bright?'#bcb38a':'#8c9773','#bdba8c80');circle(ctx,x,y,15,'#576d5544');ctx.save();ctx.setLineDash([3,4]);circle(ctx,x,y,13,null,bright?'#f1db9d':'#d3cc9b88');ctx.restore();ctx.fillStyle=bright?'#f5e1ab':'#cec79a';ctx.font='20px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('+',x,y);}
const shown=focus||((hover>=0&&!game.towers.some(t=>t.site===hover))?{site:hover,type:selected,level:1}:null);if(shown){const [x,y]=sites[shown.site];circle(ctx,x,y,towerTypes[shown.type].range+12*(shown.level-1),'#bcdcb610','#d7deae44');}
for(const t of game.towers)drawTower(ctx,t);
for(const e of game.enemies){
ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);
const length=[37,49,62][e.kind],width=[22,28,37][e.kind];
// The wake follows the hull's heading and fades back into the canal.
ctx.save();ctx.strokeStyle=e.slow>0?'#a6f3e2aa':'#b5e4d375';ctx.lineWidth=1.2;
for(let i=0;i<3;i++){const offset=(anim*.018+i*8)%26;ctx.globalAlpha=1-offset/30;ctx.beginPath();ctx.moveTo(-length/2-offset,-width/3-offset*.17);ctx.quadraticCurveTo(-length/2-offset-8,0,-length/2-offset,width/3+offset*.17);ctx.stroke();}ctx.restore();
if(e.slow>0){ctx.shadowColor='#7cf6e7';ctx.shadowBlur=9;}
if(artReady){paintSprite(ctx,atlas,['skiff','raider','galleon'][e.kind],-length/2,-width/2,length,width);}else{poly(ctx,[[length/2,0],[length/3,-width/2],[-length/2,-width/2],[-length/2,width/2],[length/3,width/2]],['#bd795b','#c09362','#9a6b59'][e.kind],'#e0b180');}
ctx.restore();ctx.fillStyle='#102e30cc';ctx.fillRect(e.x-16,e.y-width/2-9,32,4);ctx.fillStyle=e.slow>0?'#99eee0':'#ecc181';ctx.fillRect(e.x-15,e.y-width/2-8,30*Math.max(0,e.hp/e.maxHp),2);
}
// Foreground arch occludes passing boats while its transparent opening reveals the canal.
if(gateReady)ctx.drawImage(gate,24,70,1585,818,285,642,144,74.3);
// Compact moving projectiles, with a separate shadow for lofted cannonballs.
for(const shot of game.projectiles){
 const progress=Math.min(1,shot.age/shot.duration);
 const lift=shot.type==='splash'?Math.sin(progress*Math.PI)*34:0;
 const angle=Math.atan2(shot.ty-shot.y,shot.tx-shot.x);
 ctx.save();
 if(shot.type==='splash'){
  ctx.globalAlpha=.28;ctx.fillStyle='#10282b';ctx.beginPath();ctx.ellipse(shot.x+2,shot.y+3,4,2,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 }
 ctx.translate(shot.x,shot.y-lift);ctx.rotate(angle);
 if(shot.type==='bolt'){
  ctx.strokeStyle='#654328';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(5,0);ctx.stroke();
  ctx.strokeStyle='#f1d29b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-8,-.5);ctx.lineTo(5,-.5);ctx.stroke();
  poly(ctx,[[9,0],[3,-2.5],[4,0],[3,2.5]],'#e8e8d4');
  poly(ctx,[[-7,0],[-11,-3],[-11,3]],'#c38560');
 }else if(shot.type==='splash'){
  circle(ctx,0,0,4,'#19292a','#b1a18a');circle(ctx,-1.3,-1.4,1.1,'#9ca79c');
 }else{
  ctx.shadowColor='#7df5e7';ctx.shadowBlur=12;
  for(let i=3;i>0;i--){ctx.globalAlpha=.22*(1-i/4);circle(ctx,-i*4,Math.sin(shot.age*25+i)*1.4,3-i*.5,'#93eee2');}
  ctx.globalAlpha=1;poly(ctx,[[6,0],[0,-4],[-6,0],[0,4]],'#a6f5e7','#e1fff4');
 }
 ctx.restore();
}
for(const e of game.effects){
 const fade=e.life/e.max;ctx.save();ctx.globalAlpha=fade;
 if(e.kind==='muzzle'){
  if(e.type==='frost'){circle(ctx,e.x,e.y,6*fade,'#a3f6e6');}
  else{ctx.shadowColor='#ffd888';ctx.shadowBlur=8;circle(ctx,e.x,e.y,(e.type==='splash'?7:3)*fade,'#ffe3a1');}
 }else{
  const radius=(e.type==='splash'?57:13)*(1-fade);
  ctx.strokeStyle=towerTypes[e.type].color;ctx.lineWidth=1.5;
  circle(ctx,e.x,e.y,radius,e.type==='splash'?'#eab46628':null,towerTypes[e.type].color);
  if(e.type==='splash')for(let i=0;i<7;i++){const angle=i*Math.PI*2/7;circle(ctx,e.x+Math.cos(angle)*radius*.7,e.y+Math.sin(angle)*radius*.7,2*fade,'#ffdc8d');}
 }
 ctx.restore();
}
}
function beep(freq=330){if(!sound)return;try{audio||=new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.6,audio.currentTime+.12);g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.16);}catch{}}
function ui(){ $('gold').textContent=game.gold;$('health').textContent=game.health;$('health-fill').style.width=game.health*5+'%';$('wave').textContent=String(Math.min(10,game.wave+(game.active?0:1))).padStart(2,'0');$('wave-fill').style.width=game.wave*10+'%';$('notice').textContent=game.notice;$('start').disabled=game.active||['lost','won'].includes(game.status);$('start').innerHTML=game.active?'Wave '+game.wave+' in progress <span>≈</span>':game.wave===0?'Launch wave <span><i class="arrow" aria-hidden="true"></i></span>':'Launch next wave <span><i class="arrow" aria-hidden="true"></i></span>';$('pause').disabled=!game.active;$('pause').textContent=paused?'Resume':'Pause';$('map-tip').textContent=focus?'✧  Tower selected · Manage it below':game.active?'≈  '+(game.enemies.length+game.queue.length)+' raiders remaining':'✧  Tap a marked mooring to build';
 document.querySelectorAll('.tower-card').forEach(el=>{el.classList.toggle('selected',el.dataset.type===selected&&!focus);el.setAttribute('aria-pressed',String(el.dataset.type===selected&&!focus));el.classList.toggle('unaffordable',game.gold<towerTypes[el.dataset.type].cost);});
 $('tower-detail').hidden=!focus;if(focus){$('detail-title').textContent=towerTypes[focus.type].name+' · Level '+focus.level;$('detail-copy').textContent=towerTypes[focus.type].description;$('upgrade').textContent=focus.level===3?'Fully upgraded':'Upgrade · ◈ '+game.upgradeCost(focus);$('upgrade').disabled=focus.level>=3||game.gold<game.upgradeCost(focus);}
 const finished=['won','lost'].includes(game.status);$('result').hidden=!finished;if(finished){$('result-title').textContent=game.status==='won'?'Venice stands.':'The lagoon has fallen.';$('result-symbol').textContent=game.status==='won'?'✦':'♜';$('result-copy').textContent=game.status==='won'?`All 10 waves repelled. ${game.kills} raiders defeated. The city remembers its admiral.`:`You held the canals through wave ${game.wave} and defeated ${game.kills} raiders. Reinforce, rethink, and try again.`;}}
function siteAt(event){const r=canvas.getBoundingClientRect(),x=(event.clientX-r.left)*W/r.width,y=(event.clientY-r.top)*H/r.height;let best=-1,dist=31;sites.forEach((p,i)=>{const n=Math.hypot(x-p[0],y-p[1]);if(n<dist){dist=n;best=i;}});return best;}
canvas.addEventListener('pointermove',e=>{hover=siteAt(e);canvas.style.cursor=hover>=0?'pointer':'default';});canvas.addEventListener('pointerleave',()=>hover=-1);
canvas.addEventListener('click',e=>{const site=siteAt(e);if(site<0){focus=null;ui();return;}const tower=game.towers.find(t=>t.site===site);if(tower){focus=tower;game.notice=towerTypes[tower.type].name+' selected. Upgrade or sell below.';}else{focus=null;if(game.build(site,selected))beep(480);}ui();});
document.querySelectorAll('.tower-card').forEach(el=>el.addEventListener('click',()=>{selected=el.dataset.type;focus=null;game.notice=towerTypes[selected].name+' selected — choose a marked mooring.';ui();if(innerWidth<=680)$('board').scrollIntoView({behavior:reduced?'instant':'smooth',block:'center'});}));
$('start').onclick=()=>{if(game.startWave()){paused=false;beep(210);ui();if(innerWidth<=680)$('board').scrollIntoView({behavior:reduced?'instant':'smooth',block:'center'});}};$('pause').onclick=()=>{paused=!paused;ui();};$('speed').onclick=()=>{speed=speed===1?2:1;$('speed').textContent=speed+'×  Speed';};
function reset(){accumulator=0;game=new Game();focus=null;paused=false;speed=1;$('speed').textContent='1×  Speed';ui();}let resetArmed=false;$('restart').onclick=()=>{if(!resetArmed&&(game.wave||game.towers.length)){resetArmed=true;$('restart').textContent='Confirm reset?';setTimeout(()=>{resetArmed=false;$('restart').textContent='↻  Reset';},3000);return;}resetArmed=false;$('restart').textContent='↻  Reset';reset();};$('again').onclick=reset;$('upgrade').onclick=()=>{if(focus&&game.upgrade(focus))beep(650);ui();};$('sell').onclick=()=>{if(focus){game.sell(focus);focus=null;ui();}};$('close-detail').onclick=()=>{focus=null;ui();};
$('help').onclick=()=>{$('help-dialog').showModal();};$('close-help').onclick=$('got-it').onclick=()=>$('help-dialog').close();$('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Disable sound':'Enable sound');$('sound').style.color=sound?'#e7ca8b':'';beep(530);};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.active){paused=true;ui();}last=0;});let uiTimer=0;function frame(now){const dt=last?Math.min((now-last)/1000,.06):0;last=now;if(!paused&&!$('help-dialog').open){accumulator+=dt*speed;while(accumulator>=1/60){game.update(1/60);accumulator-=1/60;}}draw(now);uiTimer+=dt;if(uiTimer>.1){ui();uiTimer=0;}requestAnimationFrame(frame);}ui();requestAnimationFrame(frame);
