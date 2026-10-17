import {Game,W,H,sites,towerTypes} from './engine.js';
import {paintSprite} from './art.js';
import {cityLayout,paintCitySprite} from './city.js';
import {canalEdges,damSites,damCost,findRoutes} from './canals.js';
import {directionalArt,drawDirectionalTower} from './tower-art.js';
const $=id=>document.getElementById(id), canvas=$('board'),ctx=canvas.getContext('2d');
let game=new Game(),selected='bolt',focus=null,paused=false,speed=1,last=0,feedback=null,hover=-1,damHover=null,damFocus=null,accumulator=0;
const damChecks=new Map();
const damPreview=id=>damChecks.get(id)||game.damCheck(id);
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
function canal(c,width,color){c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;for(const edge of canalEdges){c.beginPath();c.moveTo(...edge.points[0]);c.lineTo(...edge.points[1]);c.stroke();}}
function nearPath(x,y,margin){for(const edge of canalEdges){const [a,b]=edge.points,dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));if(Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)<margin)return true;}return false;}
const terrain=new Image();
let terrainReady=false;
terrain.onload=()=>{terrainReady=true;makeDecor();};
terrain.src=new URL('./assets/venice-paving.png',import.meta.url).href;
const damArt=new Image();
let damReady=false;
function paintDam(context,x,y,w=94,h=25){context.drawImage(damArt,50,110,1930,510,x,y,w,h);}
damArt.onload=()=>{damReady=true;const icon=document.createElement('canvas');icon.width=240;icon.height=112;icon.setAttribute('aria-hidden','true');paintDam(icon.getContext('2d'),0,8,240,64);document.querySelector('.dam-art').replaceChildren(icon);};
damArt.src=new URL('./assets/canal-dam.png',import.meta.url).href;
const gate=new Image();
let gateReady=false;
gate.onload=()=>{gateReady=true;makeDecor();};
gate.src=new URL('./assets/arsenal-gate.png',import.meta.url).href;
const cityArt=new Image();
let cityReady=false;
cityArt.onload=()=>{cityReady=true;makeDecor();};
cityArt.src=new URL('./assets/city-districts.png',import.meta.url).href;
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
function makeDecor(){seed=187;buildingIndex=0;d.clearRect(0,0,W,H);d.fillStyle='#a4ac9c';d.fillRect(0,0,W,H);if(terrainReady){const paving=d.createPattern(terrain,'repeat');paving.setTransform(new DOMMatrix().scale(160/terrain.naturalWidth,160/terrain.naturalHeight));d.fillStyle=paving;d.fillRect(0,0,W,H);d.fillStyle='#9ca58f33';d.fillRect(0,0,W,H);}for(let y=0;y<H&&!terrainReady;y+=24)for(let x=0;x<W;x+=29){d.strokeStyle=rand()>.5?'#75816b16':'#253f3322';d.strokeRect(x+(y%48?14:0),y,28,23);}
canal(d,105,'#354c3b');canal(d,97,'#6c8066');canal(d,91,'#beb18a');canal(d,80,'#d0c099');canal(d,73,'#173e40');canal(d,65,'#286364');canal(d,52,'#2b6c6a');canal(d,31,'#2e716c');
// Sunlit limestone and a deep water gradient make the banks readable at phone size.
for(let i=0;i<1150;i++){const x=rand()*W,y=rand()*H;if(nearPath(x,y,29)){d.fillStyle=rand()>.5?'#a6e0c612':'#062e3910';d.fillRect(x,y,8+rand()*12,1);}}
// Masonry joints along the pale canal banks.
for(const edge of canalEdges){const [a,b]=edge.points,len=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=(b[0]-a[0])/len,dy=(b[1]-a[1])/len;for(let v=10;v<len-35;v+=19){d.strokeStyle='#697b6022';d.lineWidth=2;for(const side of [-1,1]){d.beginPath();d.moveTo(a[0]+dx*v-dy*side*37,a[1]+dy*v+dx*side*37);d.lineTo(a[0]+dx*v-dy*side*44,a[1]+dy*v+dx*side*44);d.stroke();}}}
// Mixed-density neighbourhoods fill dry land while retaining canal and mooring clearance.
for(const item of cityLayout){
 if(cityReady)paintCitySprite(d,cityArt,item);
 else house(item.x,item.y,item.w-14,item.h-10,'#b6a37c');
}
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
// Flow marks cover every open canal, rather than implying one fixed route.
ctx.save();ctx.strokeStyle='#9bc9b324';ctx.lineWidth=1;
for(const edge of canalEdges){
 if(game.dams.includes(edge.id))continue;
 const [a,b]=edge.points,angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
 for(let offset=15+(anim*.015)%48;offset<edge.length;offset+=48){ctx.save();ctx.translate(a[0]+Math.cos(angle)*offset,a[1]+Math.sin(angle)*offset);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(-7,-13);ctx.quadraticCurveTo(0,-9,7,-13);ctx.moveTo(-3,12);ctx.lineTo(8,12);ctx.stroke();ctx.restore();}
}
// Dam mode previews the route that remains after a proposed closure.
if(selected==='dam'){
 const check=damHover&&!game.dams.includes(damHover)?damPreview(damHover):null;
 const route=damHover&&check?.ok?findRoutes([...game.dams,damHover])[0]:game.routes[0];
 if(route){ctx.setLineDash([7,8]);ctx.lineWidth=2;ctx.strokeStyle=check&&!check.ok?'#e8a38b99':'#b7e8d3aa';ctx.beginPath();route.points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}
}
ctx.restore();
for(let i=0;i<sites.length;i++){if(game.towers.some(t=>t.site===i))continue;const [x,y]=sites[i];const bright=i===hover;circle(ctx,x+2,y+3,20,'#203e3155');circle(ctx,x,y,19,bright?'#bcb38a':'#8c9773','#bdba8c80');circle(ctx,x,y,15,'#576d5544');ctx.save();ctx.setLineDash([3,4]);circle(ctx,x,y,13,null,bright?'#f1db9d':'#d3cc9b88');ctx.restore();ctx.fillStyle=bright?'#f5e1ab':'#cec79a';ctx.font='20px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('+',x,y);}
const shown=focus||((selected!=='dam'&&hover>=0&&!game.towers.some(t=>t.site===hover))?{site:hover,type:selected,level:1}:null);if(shown){const [x,y]=sites[shown.site];circle(ctx,x,y,towerTypes[shown.type].range+12*(shown.level-1),'#bcdcb610','#d7deae44');}
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
// Timber dams span the water, with small marked foundations in placement mode.
for(const site of damSites){
 const built=game.dams.includes(site.id);if(!built&&selected!=='dam')continue;
 const active=damHover===site.id||damFocus===site.id;
 ctx.save();ctx.translate(site.x,site.y);
 if(built){
  if(damReady){
   ctx.save();ctx.strokeStyle='#b6dfce55';ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(-13+i*13,14+i%2,8,1.8,0,0,Math.PI);ctx.stroke();}ctx.restore();
   paintDam(ctx,-47,-14);
  }else{
  ctx.fillStyle='#132c2b77';ctx.fillRect(-43,-5,86,20);
  const wood=ctx.createLinearGradient(0,-12,0,12);wood.addColorStop(0,'#c4a474');wood.addColorStop(.4,'#886544');wood.addColorStop(1,'#583f2c');ctx.fillStyle=wood;ctx.fillRect(-43,-10,86,20);
  ctx.strokeStyle='#493a2b';ctx.lineWidth=1;for(let y=-5;y<=5;y+=5){ctx.beginPath();ctx.moveTo(-40,y);ctx.lineTo(40,y);ctx.stroke();}
  for(const x of [-39,-19,19,39]){ctx.fillStyle='#bea67d';ctx.fillRect(x-3,-15,6,30);circle(ctx,x,-10,1.2,'#4b5146');circle(ctx,x,10,1.2,'#4b5146');}
  }
  if(active){ctx.strokeStyle='#f0d294';ctx.lineWidth=2;ctx.strokeRect(-46,-17,92,34);}
 }else{
  const allowed=damPreview(site.id).ok;ctx.fillStyle=allowed?'#263c32dd':'#492f2cdd';ctx.strokeStyle=allowed?'#d5bc82':'#da907a';ctx.setLineDash([4,4]);ctx.lineWidth=active?2:1;ctx.strokeRect(-42,-12,84,24);ctx.fillRect(-20,-13,40,26);ctx.setLineDash([]);ctx.fillStyle=allowed?'#efdbb0':'#e5aa96';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(allowed?'+':'×',0,0);
 }
 ctx.restore();
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
function ui(){ if(selected==='dam'){damChecks.clear();for(const site of damSites)damChecks.set(site.id,game.damCheck(site.id));} $('gold').textContent=game.gold;$('health').textContent=game.health;$('health-fill').style.width=game.health*5+'%';$('start').disabled=game.active||['lost','won'].includes(game.status);$('start').innerHTML=game.active?'Wave '+game.wave+' in progress <span>≈</span>':game.wave===0?'Launch wave <span><i class="arrow" aria-hidden="true"></i></span>':'Launch next wave <span><i class="arrow" aria-hidden="true"></i></span>';$('pause').disabled=!game.active;$('pause').textContent=paused?'Resume':'Pause';$('map-tip').textContent=feedback&&feedback.until>performance.now()?feedback.text:selected==='dam'?(damFocus?'Dam selected · Remove it below':damHover&&!game.dams.includes(damHover)&&!damPreview(damHover).ok?damPreview(damHover).reason:'Tap a marked crossing · ◈ '+damCost):focus?'✧  Tower selected · Manage it below':game.active?'≈  '+(game.enemies.length+game.queue.length)+' raiders remaining':'✧  Tap a marked mooring to build';
 document.querySelectorAll('.tower-card[data-type]').forEach(el=>{el.classList.toggle('selected',el.dataset.type===selected&&!focus);el.setAttribute('aria-pressed',String(el.dataset.type===selected&&!focus));el.classList.toggle('unaffordable',game.gold<towerTypes[el.dataset.type].cost);});
 $('dam-tool').classList.toggle('selected',selected==='dam');$('dam-tool').classList.toggle('unaffordable',game.gold<damCost);$('dam-tool').setAttribute('aria-pressed',String(selected==='dam'));$('upgrade').hidden=!!damFocus;$('sell').textContent='Sell tower';$('tower-detail').hidden=!focus&&!damFocus;if(damFocus){$('detail-title').textContent='Canal dam';$('detail-copy').textContent='Blocks this canal. Remove it to reopen the route.';$('sell').textContent='Remove · ◈ '+Math.floor(damCost*.65);}if(focus){$('detail-title').textContent=towerTypes[focus.type].name+' · Level '+focus.level;$('detail-copy').textContent=towerTypes[focus.type].description;$('upgrade').textContent=focus.level===3?'Fully upgraded':'Upgrade · ◈ '+game.upgradeCost(focus);$('upgrade').disabled=focus.level>=3||game.gold<game.upgradeCost(focus);}
 const finished=['won','lost'].includes(game.status);$('result').hidden=!finished;if(finished){$('result-title').textContent=game.status==='won'?'Venice stands.':'The lagoon has fallen.';$('result-symbol').textContent=game.status==='won'?'✦':'♜';$('result-copy').textContent=game.status==='won'?`All 10 waves repelled. ${game.kills} raiders defeated. The city remembers its admiral.`:`You held the canals through wave ${game.wave} and defeated ${game.kills} raiders. Reinforce, rethink, and try again.`;}}
function siteAt(event){const r=canvas.getBoundingClientRect(),x=(event.clientX-r.left)*W/r.width,y=(event.clientY-r.top)*H/r.height;let best=-1,dist=31;sites.forEach((p,i)=>{const n=Math.hypot(x-p[0],y-p[1]);if(n<dist){dist=n;best=i;}});return best;}
function damAt(event){const r=canvas.getBoundingClientRect(),x=(event.clientX-r.left)*W/r.width,y=(event.clientY-r.top)*H/r.height;return damSites.find(site=>Math.abs(site.x-x)<46&&Math.abs(site.y-y)<26)?.id||null;}
canvas.addEventListener('pointermove',e=>{hover=siteAt(e);damHover=damAt(e);canvas.style.cursor=(selected==='dam'?damHover:hover>=0)?'pointer':'default';});canvas.addEventListener('pointerleave',()=>{hover=-1;damHover=null;});
canvas.addEventListener('click',e=>{
 const edge=damAt(e);
 if(edge&&(selected==='dam'||game.dams.includes(edge))){focus=null;if(game.dams.includes(edge)){damFocus=edge;}else{damFocus=null;if(!game.buildDam(edge))feedback={text:game.notice,until:performance.now()+3000};else feedback=null;}ui();return;}
 if(selected==='dam'){game.notice='Choose one of the marked canal crossings.';ui();return;}
 const site=siteAt(e);damFocus=null;if(site<0){focus=null;ui();return;}
 const tower=game.towers.find(t=>t.site===site);if(tower){focus=tower;game.notice=towerTypes[tower.type].name+' selected. Upgrade or sell below.';}else{focus=null;if(!game.build(site,selected))feedback={text:game.notice,until:performance.now()+3000};else feedback=null;}ui();
});
function showBoard(){if(innerWidth<=680)$('board').scrollIntoView({behavior:reduced?'instant':'smooth',block:'center'});}
document.querySelectorAll('.tower-card[data-type]').forEach(el=>el.addEventListener('click',()=>{selected=el.dataset.type;feedback=null;focus=null;damFocus=null;game.notice=towerTypes[selected].name+' selected — choose a marked mooring.';ui();showBoard();}));
$('dam-tool').onclick=()=>{selected='dam';feedback=null;focus=null;damFocus=null;game.notice='Dams close canals. At least one route must stay open.';ui();showBoard();};
$('start').onclick=()=>{if(game.startWave()){paused=false;feedback=null;ui();if(innerWidth<=680)$('board').scrollIntoView({behavior:reduced?'instant':'smooth',block:'center'});}};$('pause').onclick=()=>{paused=!paused;ui();};$('speed').onclick=()=>{speed=speed===1?2:1;$('speed').textContent=speed+'×  Speed';};
function reset(){feedback=null;damChecks.clear();accumulator=0;game=new Game();focus=null;damFocus=null;damHover=null;selected='bolt';paused=false;speed=1;$('speed').textContent='1×  Speed';ui();}let resetArmed=false;$('restart').onclick=()=>{if(!resetArmed&&(game.wave||game.towers.length||game.dams.length)){resetArmed=true;$('restart').textContent='Confirm reset?';setTimeout(()=>{resetArmed=false;$('restart').textContent='↻  Reset';},3000);return;}resetArmed=false;$('restart').textContent='↻  Reset';reset();};$('again').onclick=reset;$('upgrade').onclick=()=>{if(focus)game.upgrade(focus);ui();};$('sell').onclick=()=>{if(damFocus){game.removeDam(damFocus);damFocus=null;ui();return;}if(focus){game.sell(focus);focus=null;ui();}};$('close-detail').onclick=()=>{focus=null;damFocus=null;ui();};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.active){paused=true;ui();}last=0;});let uiTimer=0;function frame(now){const dt=last?Math.min((now-last)/1000,.06):0;last=now;if(!paused){accumulator+=dt*speed;while(accumulator>=1/60){game.update(1/60);accumulator-=1/60;}}draw(now);uiTimer+=dt;if(uiTimer>.1){ui();uiTimer=0;}requestAnimationFrame(frame);}ui();requestAnimationFrame(frame);
