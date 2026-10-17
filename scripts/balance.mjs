import {Game,towerTypes,enemyTypes,waveProfile,pathLength} from '../engine.js';

// Each row lists purchases before that wave; all use the live engine prices.
export const strategies={
 cannonFirst:[
  [[8,'bolt'],[12,'bolt'],[17,'bolt']], // Wave 1
  [[6,'bolt'],[11,'bolt']], // Wave 2
  [[6,'upgrade'],[21,'bolt']], // Wave 3
  [[17,'upgrade'],[18,'bolt']], // Wave 4
  [[18,'upgrade'],[13,'splash']], // Wave 5
  [['west-cut','dam'],['east-cut','dam']], // Wave 6
  [['centre-cut','dam'],[7,'splash']], // Wave 7
  [[16,'frost'],[13,'upgrade'],[7,'upgrade'],[8,'upgrade']], // Wave 8
  [[13,'upgrade'],[7,'upgrade']], // Wave 9
  [[16,'upgrade'],[16,'upgrade'],[8,'upgrade'],[12,'upgrade']] // Wave 10
 ],
 frostFirst:[
  [[8,'bolt'],[12,'bolt'],[17,'bolt']], // Wave 1
  [[6,'bolt'],[11,'bolt']], // Wave 2
  [[6,'upgrade'],[21,'bolt']], // Wave 3
  [[17,'upgrade'],[18,'bolt']], // Wave 4
  [[18,'upgrade'],[13,'splash']], // Wave 5
  [['west-cut','dam'],['east-cut','dam']], // Wave 6
  [['centre-cut','dam'],[16,'frost']], // Wave 7
  [[7,'splash'],[13,'upgrade'],[7,'upgrade'],[8,'upgrade']], // Wave 8
  [[13,'upgrade'],[7,'upgrade']], // Wave 9
  [[16,'upgrade'],[16,'upgrade'],[8,'upgrade'],[12,'upgrade']] // Wave 10
 ]
};
export function simulate({strategy='cannonFirst',dt=1/60,stopAfter=10,invest=true}={}){
 const game=new Game(),rows=[];
 for(let wave=1;wave<=stopAfter;wave++){
  if(invest||wave===1){
   for(const [site,type] of strategies[strategy][wave-1]||[]){
    const bought=type==='dam'?game.buildDam(site):type==='upgrade'?game.upgrade(game.towers.find(t=>t.site===site)):game.build(site,type);
    if(!bought)throw new Error('Unaffordable or invalid purchase before wave '+wave+': '+site+' / '+type);
   }
  }
  const bankBefore=game.gold,healthBefore=game.health;
  game.startWave();
  let furthest=0,steps=0;
  const start=game.time;
  while(game.active&&steps++<30000){
   const active=game.enemies;
   game.update(dt);
   for(const enemy of active)furthest=Math.max(furthest,enemy.distance/(enemy.routeLength||pathLength));
  }
  if(game.active)throw new Error('Wave failed to finish');
  rows.push({wave,towers:game.towers.length,dams:game.dams.length,levels:game.towers.map(t=>t.level).join(''),income:game.gold-bankBefore,bank:game.gold,leaks:healthBefore-game.health,furthest:+furthest.toFixed(4),duration:+(game.time-start).toFixed(1)});
  if(game.status==='lost')break;
 }
 return {status:game.status,rows};
}
export function waveBudget(wave){
 const profile=waveProfile(wave),counts=enemyTypes.map((_,kind)=>profile.spawnOrder.filter(k=>k===kind).length);
 const hp=enemyTypes.map(enemy=>Math.round(enemy.hp*profile.hpMultiplier));
 const rewards=counts.reduce((sum,count,kind)=>sum+count*enemyTypes[kind].reward,0);
 return {wave,count:profile.count,counts,hp,totalHp:counts.reduce((sum,count,kind)=>sum+count*hp[kind],0),spawnInterval:profile.spawnInterval,killGold:rewards,bonus:profile.clearBonus,totalGold:rewards+profile.clearBonus};
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 console.table(Object.entries(towerTypes).map(([type,t])=>({type,cost:t.cost,damage:t.damage,seconds:t.cooldown,dps:+(t.damage/t.cooldown).toFixed(2),dpsPer100Gold:+(t.damage/t.cooldown/t.cost*100).toFixed(2)})));
 console.table(Array.from({length:10},(_,i)=>waveBudget(i+1)).map(row=>({...row,counts:row.counts.join('/'),hp:row.hp.join('/')})));
 for(const strategy of Object.keys(strategies)){const result=simulate({strategy});console.log(strategy,result.status);console.table(result.rows);}
}
