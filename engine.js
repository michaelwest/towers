import {findRoutes,chooseRoute,routesFromPoint,locationOnNetwork,damSites,damCost} from './canals.js';
import {weaponMount,muzzlePosition} from './tower-art.js';
export const W=720, H=730;
export const pathPoints=[[122,-30],[122,119],[578,119],[578,270],[142,270],[142,424],[578,424],[578,578],[357,578],[357,754]];
export const sites=[[70,75],[184,65],[295,65],[415,65],[537,65],[632,158],[516,213],[397,213],[245,200],[82,235],[82,350],[205,363],[345,363],[445,363],[633,385],[633,514],[515,516],[367,516],[297,523],[270,652],[454,680],[210,488]];
export const towerTypes={
 bolt:{name:'Campanile',cost:65,range:155,cooldown:.65,damage:19,color:'#e5bd76',description:'Fast, precise fire against boats and airships. Ironclad armour resists its bolts.'},
 splash:{name:'Bombard',cost:110,range:145,cooldown:1.65,damage:29,color:'#ed9474',description:'Explosive shells bypass Ironclad armour and damage clustered boats. Ground targets only.'},
 frost:{name:'Tidekeeper',cost:85,range:138,cooldown:.95,damage:6,color:'#76d6cd',description:'Slows boats and airships by 48% for 2 seconds. Especially useful against fast smugglers.'}
};
export const enemyTypes=[
 {name:'Skiff',hp:45,speed:69,reward:3,size:10,sprite:'skiff',length:37,width:22,description:'Light canal raider.'},
 {name:'Raider',hp:105,speed:48,reward:5,size:15,sprite:'raider',length:49,width:28,description:'A sturdy raiding boat.'},
 {name:'Galleon',hp:240,speed:31,reward:8,size:21,sprite:'galleon',length:62,width:37,description:'Heavy hull. Cannon blasts and frost work well together.'},
 {name:'Ironclad',hp:150,speed:30,reward:8,size:23,sprite:'ironclad',length:61,width:36,boltMultiplier:.35,description:'Armoured: resists 65% of bolt damage. Cannon blasts bypass its armour.'},
 {name:'Smuggler',hp:36,speed:96,reward:4,size:10,sprite:'smuggler',length:43,width:23,description:'Fast and fragile. Frost holds it in range; crossbows track it reliably.'},
 {name:'Airship',hp:85,speed:36,reward:12,size:25,sprite:'airship',length:76,width:40,flying:true,gateDamage:3,description:'Flies straight to the gate, ignoring dams. Use crossbows and frost; cannons cannot hit it. Deals 3 gate damage.'}
];
export const airRoute=[[122,-45],[357,686]];
export const airRouteLength=Math.hypot(airRoute[1][0]-airRoute[0][0],airRoute[1][1]-airRoute[0][1]);
export function canTarget(type,enemy){return type!=='splash'||!enemy.flying;}
export function hitDamage(enemy,damage,type){return damage*(type==='bolt'?(enemy.boltMultiplier??1):1);}

export const balance={startingGold:220,clearBonus:80,hpMultipliers:[1.65,2.1,2.45,2.65,2.9,3.2,3.5,3.75,4.6,4.9]};
export function waveProfile(wave){
 const progression=wave-1,count=9+progression*3+Math.floor(progression*progression*.4);
 const spawnOrder=Array.from({length:count},(_,i)=>{
  const original=wave<2?0:wave<4?(i%3===0?1:0):i%5===0?2:i%2===0?1:0;
  if(wave>=5&&i%15===10)return 3;
  if(wave>=3&&original===0&&i%7===5)return 4;
  return original;
 });
 // Three airships in the entire campaign: teach the threat, then revisit it sparsely.
 if(wave>=6&&wave%2===0)spawnOrder[Math.floor(count*.55)]=5;
 return {count,spawnInterval:Math.max(.5,.95-progression*.05),hpMultiplier:balance.hpMultipliers[progression],clearBonus:balance.clearBonus,spawnOrder};
}
const segments=pathPoints.slice(1).map((p,i)=>Math.hypot(p[0]-pathPoints[i][0],p[1]-pathPoints[i][1]));
export const pathLength=segments.reduce((a,b)=>a+b,0);
export function position(distance,points=pathPoints){
 let d=Math.max(0,distance);
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(d<=length)return {x:a[0]+(b[0]-a[0])*d/length,y:a[1]+(b[1]-a[1])*d/length,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};
  d-=length;
 }
 const a=points.at(-2)||points[0],b=points.at(-1);
 return {x:b[0],y:b[1],angle:Math.atan2(b[1]-a[1],b[0]-a[0])};
}
export class Game {
 constructor(){this.gold=balance.startingGold;this.health=20;this.wave=0;this.kills=0;this.towers=[];this.dams=[];this.routes=findRoutes();this.enemies=[];this.projectiles=[];this.effects=[];this.queue=[];this.active=false;this.status='ready';this.time=0;this.lastId=0;this.notice='Build your first line of defence.';}
 build(site,type){const spec=towerTypes[type];if(!spec||!sites[site]||this.status==='lost'||this.status==='won')return false;if(this.towers.some(t=>t.site===site)){this.notice='That mooring already has a tower.';return false;}if(this.gold<spec.cost){this.notice='Not enough gold. Defeat raiders to earn more.';return false;}this.gold-=spec.cost;this.towers.push({site,type,level:1,cooldown:0,aim:-Math.PI/2});this.notice=spec.name+' built. Ready for the tide.';return true;}
 upgrade(tower){const cost=this.upgradeCost(tower);if(tower.level>=3||this.gold<cost||!this.towers.includes(tower)||['won','lost'].includes(this.status))return false;this.gold-=cost;tower.level++;this.notice=towerTypes[tower.type].name+' upgraded to level '+tower.level+'.';return true;}
 upgradeCost(tower){return Math.round(towerTypes[tower.type].cost*.75*tower.level);}
 sell(tower){if(!this.towers.includes(tower)||['won','lost'].includes(this.status))return;this.gold+=Math.floor(towerTypes[tower.type].cost*(1+.75*(tower.level-1)*tower.level/2)*.65);this.towers=this.towers.filter(t=>t!==tower);this.notice='Tower sold. Its mooring is available.';}
 damCheck(edgeId){
  if(['lost','won'].includes(this.status))return {ok:false,reason:'Start a new game to build.'};
  if(!damSites.some(site=>site.id===edgeId))return {ok:false,reason:'Choose a marked dam site.'};
  if(this.dams.includes(edgeId))return {ok:false,reason:'This canal already has a dam.'};
  const closed=[...this.dams,edgeId];
  if(!findRoutes(closed).length)return {ok:false,reason:'Keep at least one route to the gate open.'};
  for(const enemy of this.enemies){
   if(enemy.flying||enemy.escaped||enemy.hp<=0)continue;
   if(locationOnNetwork(enemy)?.edge?.id===edgeId)return {ok:false,reason:'A boat is in this canal. Wait until it passes.'};
   if(!routesFromPoint(enemy,closed).length)return {ok:false,reason:'This dam would trap a boat. Keep an escape route open.'};
  }
  if(this.gold<damCost)return {ok:false,reason:'Not enough gold for a dam.'};
  return {ok:true};
 }
 buildDam(edgeId){
  const check=this.damCheck(edgeId);
  if(!check.ok){this.notice=check.reason;return false;}
  this.gold-=damCost;this.dams.push(edgeId);this.rerouteBoats();
  this.notice='Dam built. Boats will take the open canals.';return true;
 }
 removeDam(edgeId){
  if(!this.dams.includes(edgeId)||['lost','won'].includes(this.status))return false;
  this.dams=this.dams.filter(id=>id!==edgeId);this.gold+=Math.floor(damCost*.65);this.rerouteBoats();
  this.notice='Dam removed. Canal reopened.';return true;
 }
 rerouteBoats(){
  this.routes=findRoutes(this.dams);
  for(const enemy of this.enemies){
   if(enemy.flying||enemy.hp<=0||enemy.escaped)continue;
   const route=chooseRoute(routesFromPoint(enemy,this.dams),enemy.id);
   if(route){enemy.routePoints=route.points;enemy.routeLength=route.length;enemy.distance=0;}
  }
 }
 startWave(){
  if(this.active||['lost','won'].includes(this.status))return false;
  this.wave++;this.status='playing';this.active=true;
  const profile=waveProfile(this.wave);
  this.queue=profile.spawnOrder.map((kind,i)=>({at:this.time+i*profile.spawnInterval,kind}));
  this.notice='Wave '+this.wave+' — raiders on the horizon.';return true;
 }

 update(dt){
  if(['lost','won'].includes(this.status))return;
  this.time+=dt;
  this.effects=this.effects.filter(e=>(e.life-=dt)>0);
  while(this.queue.length&&this.queue[0].at<=this.time){
   const q=this.queue.shift(),k=enemyTypes[q.kind],hp=Math.round(k.hp*waveProfile(this.wave).hpMultiplier);
   const id=++this.lastId,route=k.flying?{points:airRoute,length:airRouteLength}:chooseRoute(this.routes,id);
   this.enemies.push({...k,hp,maxHp:hp,kind:q.kind,distance:0,slow:0,hit:0,id,routePoints:route.points,routeLength:route.length,...position(0,route.points)});
  }
  for(const e of this.enemies){
   if(e.hp<=0||e.escaped)continue;
   e.hit=Math.max(0,(e.hit||0)-dt);
   e.slow=Math.max(0,e.slow-dt);
   e.distance+=e.speed*(e.slow>0?.52:1)*dt;
   Object.assign(e,position(e.distance,e.routePoints));
   if(e.distance>=(e.routeLength||pathLength)){
    e.escaped=true;const damage=e.gateDamage||1;this.health=Math.max(0,this.health-damage);
    this.effects.push({kind:'gate-hit',x:357,y:686,damage,life:.85,max:.85});
   }
  }
  // Damage is resolved at arrival, never when a tower starts its shot.
  for(const shot of this.projectiles){
   shot.age+=dt;
   if(shot.type==='splash'){
    const progress=Math.min(1,shot.age/shot.duration);
    shot.x=shot.sx+(shot.tx-shot.sx)*progress;
    shot.y=shot.sy+(shot.ty-shot.sy)*progress;
    if(progress>=1){
     shot.done=true;
     for(const enemy of this.enemies){
      if(enemy.hp>0&&!enemy.escaped&&canTarget('splash',enemy)&&Math.hypot(enemy.x-shot.tx,enemy.y-shot.ty)<57)this.hit(enemy,shot.damage,shot.type);
     }
     this.impact(shot);
    }
   }else{
    const target=shot.target;
    if(target.hp>0&&!target.escaped){shot.tx=target.x;shot.ty=target.y;}
    const dx=shot.tx-shot.x,dy=shot.ty-shot.y,distance=Math.hypot(dx,dy),step=shot.speed*dt;
    if(distance<=step){
     shot.x=shot.tx;shot.y=shot.ty;shot.done=true;
     if(target.hp>0&&!target.escaped){
      this.hit(target,shot.damage,shot.type);
      if(shot.type==='frost')target.slow=2;
      this.impact(shot);
     }
    }else{
     shot.x+=dx/distance*step;shot.y+=dy/distance*step;
    }
    if(shot.age>2)shot.done=true;
   }
  }
  this.projectiles=this.projectiles.filter(p=>!p.done);
  for(const t of this.towers){
   t.cooldown-=dt;
   const spec=towerTypes[t.type],p=sites[t.site];
   const targets=this.enemies.filter(e=>e.hp>0&&!e.escaped&&canTarget(t.type,e)&&Math.hypot(e.x-p[0],e.y-p[1])<=spec.range+12*(t.level-1)).sort((a,b)=>((a.routeLength||pathLength)-a.distance)-((b.routeLength||pathLength)-b.distance));
   if(!targets.length)continue;
   let target=targets[0];
   if(t.type==='frost'){
    // Spread slowing across the fleet, including shots from other Tidekeepers.
    const incoming=new Set(this.projectiles.filter(shot=>shot.type==='frost').map(shot=>shot.target));
    target=targets.find(enemy=>enemy.slow<=0&&!incoming.has(enemy))
     ||targets.find(enemy=>!incoming.has(enemy))||target;
   }
   const mount=weaponMount(t.type);
   t.aim=Math.atan2(target.y-p[1]-mount[1],target.x-p[0]-mount[0]);
   if(t.cooldown>0)continue;
   t.cooldown=spec.cooldown/(1+(t.level-1)*.12);
   const origin=muzzlePosition(t.type,p[0],p[1],t.aim);
   const velocity={bolt:480,splash:285,frost:300}[t.type];
   const duration=Math.max(.18,Math.hypot(target.x-origin.x,target.y-origin.y)/velocity);
   // Cannonballs land at a predicted point and can miss fast boats near a turn.
   const destination=t.type==='splash'?position(target.distance+target.speed*(target.slow>0?.52:1)*duration,target.routePoints):target;
   this.projectiles.push({
    ...origin,sx:origin.x,sy:origin.y,tx:destination.x,ty:destination.y,
    target,type:t.type,flying:!!target.flying,site:t.site,age:0,duration,speed:velocity,
    damage:spec.damage*(1+(t.level-1)*.55)
   });
   this.effects.push({...origin,site:t.site,type:t.type,kind:'muzzle',life:.14,max:.14});
  }
  for(const e of this.enemies)if(e.hp<=0&&!e.escaped){
   this.gold+=e.reward;this.kills++;
   this.effects.push({kind:e.flying?'air-burst':'sink',x:e.x,y:e.y,angle:e.angle,size:e.size||10,reward:e.reward,special:e.kind>=3,life:.75,max:.75});
  }
  this.enemies=this.enemies.filter(e=>e.hp>0&&!e.escaped);
  if(this.health<=0){this.status='lost';this.active=false;this.projectiles=[];this.notice='The lagoon has fallen.';return;}
  if(this.active&&!this.queue.length&&!this.enemies.length&&!this.projectiles.length){
   this.active=false;this.gold+=balance.clearBonus;
   if(this.wave===10){this.status='won';this.notice='Venice stands. The lagoon is yours!';}
   else{this.status='ready';this.notice='Wave cleared! Reinforce your defences.';}
  }
 }
 hit(enemy,damage,type){
  enemy.hp-=hitDamage(enemy,damage,type);enemy.hit=.14;enemy.hitType=type;
 }
 impact(shot){
  const life=shot.type==='splash'?.55:.3;
  this.effects.push({x:shot.x,y:shot.y,type:shot.type,kind:'impact',flying:shot.flying,armoured:shot.type==='bolt'&&shot.target?.boltMultiplier<1,life,max:life});
 }
}
