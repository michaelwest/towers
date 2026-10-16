import {weaponMount,muzzlePosition} from './tower-art.js';
export const W=720, H=730;
export const pathPoints=[[122,-30],[122,119],[578,119],[578,270],[142,270],[142,424],[578,424],[578,578],[357,578],[357,754]];
export const sites=[[70,75],[184,65],[295,65],[415,65],[537,65],[632,158],[516,213],[397,213],[277,213],[82,235],[82,350],[205,363],[325,363],[445,363],[633,385],[633,514],[515,516],[410,516],[297,523],[300,650],[419,680],[210,488]];
export const towerTypes={
 bolt:{name:'Campanile',cost:65,range:155,cooldown:.65,damage:19,color:'#e5bd76',description:'A dependable, single-target crossbow.'},
 splash:{name:'Bombard',cost:110,range:145,cooldown:1.65,damage:29,color:'#ed9474',description:'Cannon fire damages clustered boats.'},
 frost:{name:'Tidekeeper',cost:85,range:138,cooldown:.95,damage:6,color:'#76d6cd',description:'Slows enemies by 48% for 2 seconds.'}
};
const kinds=[{name:'Skiff',hp:45,speed:69,reward:9,size:10},{name:'Raider',hp:105,speed:48,reward:15,size:15},{name:'Galleon',hp:240,speed:31,reward:25,size:21}];
const segments=pathPoints.slice(1).map((p,i)=>Math.hypot(p[0]-pathPoints[i][0],p[1]-pathPoints[i][1]));
export const pathLength=segments.reduce((a,b)=>a+b,0);
export function position(distance){let d=distance;for(let i=0;i<segments.length;i++){if(d<=segments[i]){const a=pathPoints[i],b=pathPoints[i+1],t=d/segments[i];return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};}d-=segments[i];}return {x:357,y:754,angle:Math.PI/2};}
export class Game {
 constructor(){this.gold=220;this.health=20;this.wave=0;this.kills=0;this.towers=[];this.enemies=[];this.effects=[];this.queue=[];this.active=false;this.status='ready';this.time=0;this.lastId=0;this.notice='Build your first line of defence.';}
 build(site,type){const spec=towerTypes[type];if(!spec||!sites[site]||this.status==='lost'||this.status==='won')return false;if(this.towers.some(t=>t.site===site)){this.notice='That mooring already has a tower.';return false;}if(this.gold<spec.cost){this.notice='Not enough gold. Defeat raiders to earn more.';return false;}this.gold-=spec.cost;this.towers.push({site,type,level:1,cooldown:0,aim:-Math.PI/2});this.notice=spec.name+' built. Ready for the tide.';return true;}
 upgrade(tower){const cost=this.upgradeCost(tower);if(tower.level>=3||this.gold<cost||!this.towers.includes(tower)||['won','lost'].includes(this.status))return false;this.gold-=cost;tower.level++;this.notice=towerTypes[tower.type].name+' upgraded to level '+tower.level+'.';return true;}
 upgradeCost(tower){return Math.round(towerTypes[tower.type].cost*.75*tower.level);}
 sell(tower){if(!this.towers.includes(tower)||['won','lost'].includes(this.status))return;this.gold+=Math.floor(towerTypes[tower.type].cost*(1+.75*(tower.level-1)*tower.level/2)*.65);this.towers=this.towers.filter(t=>t!==tower);this.notice='Tower sold. Its mooring is available.';}
 startWave(){if(this.active||['lost','won'].includes(this.status))return false;this.wave++;this.status='playing';this.active=true;const count=7+this.wave*2;this.queue=Array.from({length:count},(_,i)=>({at:this.time+i*.95,kind:this.wave<2?0:this.wave<4?(i%3===0?1:0):i%5===0?2:i%2===0?1:0}));this.notice='Wave '+this.wave+' — raiders on the horizon.';return true;}
 update(dt){if(['lost','won'].includes(this.status))return;this.time+=dt;this.effects=this.effects.filter(e=>(e.life-=dt)>0);while(this.queue.length&&this.queue[0].at<=this.time){const q=this.queue.shift(),k=kinds[q.kind],hp=k.hp*(1+(this.wave-1)*.22);this.enemies.push({...k,hp,maxHp:hp,kind:q.kind,distance:0,slow:0,id:++this.lastId,...position(0)});}
 for(const e of this.enemies){e.slow=Math.max(0,e.slow-dt);e.distance+=e.speed*(e.slow>0?.52:1)*dt;Object.assign(e,position(e.distance));if(e.distance>=pathLength){e.escaped=true;this.health=Math.max(0,this.health-1);}}
 for(const t of this.towers){t.cooldown-=dt;const spec=towerTypes[t.type],p=sites[t.site];const targets=this.enemies.filter(e=>e.hp>0&&!e.escaped&&Math.hypot(e.x-p[0],e.y-p[1])<=spec.range+12*(t.level-1)).sort((a,b)=>b.distance-a.distance);if(targets.length){const mount=weaponMount(t.type),target=targets[0];t.aim=Math.atan2(target.y-p[1]-mount[1],target.x-p[0]-mount[0]);}if(t.cooldown<=0&&targets.length){const e=targets[0];t.cooldown=spec.cooldown/(1+(t.level-1)*.12);const damage=spec.damage*(1+(t.level-1)*.55);if(t.type==='splash'){for(const other of this.enemies)if(!other.escaped&&Math.hypot(other.x-e.x,other.y-e.y)<57)other.hp-=damage;}else{e.hp-=damage;if(t.type==='frost')e.slow=2;}
 this.effects.push({...muzzlePosition(t.type,p[0],p[1],t.aim),site:t.site,tx:e.x,ty:e.y,type:t.type,life:.25,max:.25});}}
 for(const e of this.enemies)if(e.hp<=0&&!e.escaped){this.gold+=e.reward;this.kills++;}this.enemies=this.enemies.filter(e=>e.hp>0&&!e.escaped);
 if(this.health<=0){this.status='lost';this.active=false;this.notice='The lagoon has fallen.';return;}
 if(this.active&&!this.queue.length&&!this.enemies.length){this.active=false;this.gold+=25+this.wave*3;if(this.wave===10){this.status='won';this.notice='Venice stands. The lagoon is yours!';}else{this.status='ready';this.notice='Wave cleared! Reinforce your defences.';}}
 }
}
