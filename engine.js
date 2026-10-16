import {weaponMount,muzzlePosition} from './tower-art.js';
export const W=720, H=730;
export const pathPoints=[[122,-30],[122,119],[578,119],[578,270],[142,270],[142,424],[578,424],[578,578],[357,578],[357,754]];
export const sites=[[70,75],[184,65],[295,65],[415,65],[537,65],[632,158],[516,213],[397,213],[277,213],[82,235],[82,350],[205,363],[325,363],[445,363],[633,385],[633,514],[515,516],[410,516],[297,523],[270,652],[454,680],[210,488]];
export const towerTypes={
 bolt:{name:'Campanile',cost:65,range:155,cooldown:.65,damage:19,color:'#e5bd76',description:'A dependable, single-target crossbow.'},
 splash:{name:'Bombard',cost:110,range:145,cooldown:1.65,damage:29,color:'#ed9474',description:'Cannon fire damages clustered boats.'},
 frost:{name:'Tidekeeper',cost:85,range:138,cooldown:.95,damage:6,color:'#76d6cd',description:'Slows enemies by 48% for 2 seconds.'}
};
export const enemyTypes=[{name:'Skiff',hp:45,speed:69,reward:3,size:10},{name:'Raider',hp:105,speed:48,reward:5,size:15},{name:'Galleon',hp:240,speed:31,reward:8,size:21}];
export const balance={startingGold:220,clearBonus:80,hpMultipliers:[1.65,2.1,2.45,2.65,2.9,3.2,3.5,3.75,4.6,4.9]};
export function waveProfile(wave){
 const progression=wave-1,count=9+progression*3+Math.floor(progression*progression*.4);
 const spawnOrder=Array.from({length:count},(_,i)=>wave<2?0:wave<4?(i%3===0?1:0):i%5===0?2:i%2===0?1:0);
 return {count,spawnInterval:Math.max(.5,.95-progression*.05),hpMultiplier:balance.hpMultipliers[progression],clearBonus:balance.clearBonus,spawnOrder};
}
const segments=pathPoints.slice(1).map((p,i)=>Math.hypot(p[0]-pathPoints[i][0],p[1]-pathPoints[i][1]));
export const pathLength=segments.reduce((a,b)=>a+b,0);
export function position(distance){let d=distance;for(let i=0;i<segments.length;i++){if(d<=segments[i]){const a=pathPoints[i],b=pathPoints[i+1],t=d/segments[i];return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};}d-=segments[i];}return {x:357,y:754,angle:Math.PI/2};}
export class Game {
 constructor(){this.gold=balance.startingGold;this.health=20;this.wave=0;this.kills=0;this.towers=[];this.enemies=[];this.projectiles=[];this.effects=[];this.queue=[];this.active=false;this.status='ready';this.time=0;this.lastId=0;this.notice='Build your first line of defence.';}
 build(site,type){const spec=towerTypes[type];if(!spec||!sites[site]||this.status==='lost'||this.status==='won')return false;if(this.towers.some(t=>t.site===site)){this.notice='That mooring already has a tower.';return false;}if(this.gold<spec.cost){this.notice='Not enough gold. Defeat raiders to earn more.';return false;}this.gold-=spec.cost;this.towers.push({site,type,level:1,cooldown:0,aim:-Math.PI/2});this.notice=spec.name+' built. Ready for the tide.';return true;}
 upgrade(tower){const cost=this.upgradeCost(tower);if(tower.level>=3||this.gold<cost||!this.towers.includes(tower)||['won','lost'].includes(this.status))return false;this.gold-=cost;tower.level++;this.notice=towerTypes[tower.type].name+' upgraded to level '+tower.level+'.';return true;}
 upgradeCost(tower){return Math.round(towerTypes[tower.type].cost*.75*tower.level);}
 sell(tower){if(!this.towers.includes(tower)||['won','lost'].includes(this.status))return;this.gold+=Math.floor(towerTypes[tower.type].cost*(1+.75*(tower.level-1)*tower.level/2)*.65);this.towers=this.towers.filter(t=>t!==tower);this.notice='Tower sold. Its mooring is available.';}
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
   this.enemies.push({...k,hp,maxHp:hp,kind:q.kind,distance:0,slow:0,id:++this.lastId,...position(0)});
  }
  for(const e of this.enemies){
   e.slow=Math.max(0,e.slow-dt);
   e.distance+=e.speed*(e.slow>0?.52:1)*dt;
   Object.assign(e,position(e.distance));
   if(e.distance>=pathLength){e.escaped=true;this.health=Math.max(0,this.health-1);}
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
      if(enemy.hp>0&&!enemy.escaped&&Math.hypot(enemy.x-shot.tx,enemy.y-shot.ty)<57)enemy.hp-=shot.damage;
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
      target.hp-=shot.damage;
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
   const targets=this.enemies.filter(e=>e.hp>0&&!e.escaped&&Math.hypot(e.x-p[0],e.y-p[1])<=spec.range+12*(t.level-1)).sort((a,b)=>b.distance-a.distance);
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
   const destination=t.type==='splash'?position(target.distance+target.speed*(target.slow>0?.52:1)*duration):target;
   this.projectiles.push({
    ...origin,sx:origin.x,sy:origin.y,tx:destination.x,ty:destination.y,
    target,type:t.type,site:t.site,age:0,duration,speed:velocity,
    damage:spec.damage*(1+(t.level-1)*.55)
   });
   this.effects.push({...origin,site:t.site,type:t.type,kind:'muzzle',life:.14,max:.14});
  }
  for(const e of this.enemies)if(e.hp<=0&&!e.escaped){this.gold+=e.reward;this.kills++;}
  this.enemies=this.enemies.filter(e=>e.hp>0&&!e.escaped);
  if(this.health<=0){this.status='lost';this.active=false;this.projectiles=[];this.notice='The lagoon has fallen.';return;}
  if(this.active&&!this.queue.length&&!this.enemies.length&&!this.projectiles.length){
   this.active=false;this.gold+=balance.clearBonus;
   if(this.wave===10){this.status='won';this.notice='Venice stands. The lagoon is yours!';}
   else{this.status='ready';this.notice='Wave cleared! Reinforce your defences.';}
  }
 }
 impact(shot){
  const life=shot.type==='splash'?.38:.22;
  this.effects.push({x:shot.x,y:shot.y,type:shot.type,kind:'impact',life,max:life});
 }
}
