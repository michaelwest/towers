import {Game,towerTypes,enemyTypes,waveProfile,pathLength} from '../engine.js';

export const strategies={
 'canal-line':[[2,'bolt'],[6,'bolt'],[7,'splash'],[8,'frost'],[11,'bolt'],[12,'splash'],[13,'frost'],[16,'bolt'],[17,'splash'],[18,'frost']],
 'spread-out':[[6,'bolt'],[11,'bolt'],[8,'frost'],[12,'splash'],[17,'splash'],[13,'frost'],[2,'bolt'],[16,'bolt'],[7,'splash'],[18,'frost']],
 'cannon-first':[[6,'bolt'],[7,'splash'],[11,'frost'],[12,'bolt'],[17,'splash'],[13,'frost'],[8,'bolt'],[16,'bolt'],[18,'frost'],[2,'splash']]
};
export function simulate({strategy='canal-line',dt=1/60,stopAfter=10,invest=true}={}){
 const game=new Game(),rows=[];
 for(let wave=1;wave<=stopAfter;wave++){
  if(invest||wave===1){
   for(const [site,type] of strategies[strategy])if(!game.towers.some(t=>t.site===site)&&game.gold>=towerTypes[type].cost)game.build(site,type);
   if(game.towers.length>=8)for(const tower of game.towers)if(game.gold>=game.upgradeCost(tower))game.upgrade(tower);
  }
  const bankBefore=game.gold,healthBefore=game.health;
  game.startWave();
  let furthest=0,steps=0;
  const start=game.time;
  while(game.active&&steps++<30000){
   const active=game.enemies;
   game.update(dt);
   for(const enemy of active)furthest=Math.max(furthest,enemy.distance/pathLength);
  }
  if(game.active)throw new Error('Wave failed to finish');
  rows.push({wave,towers:game.towers.length,levels:game.towers.map(t=>t.level).join(''),income:game.gold-bankBefore,bank:game.gold,leaks:healthBefore-game.health,furthest:+furthest.toFixed(4),duration:+(game.time-start).toFixed(1)});
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
