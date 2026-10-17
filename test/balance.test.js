import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,strategies,waveBudget} from '../scripts/balance.mjs';
for(const strategy of Object.keys(strategies)){
 test('balanced campaign clears every boat with '+strategy,()=>{
  const result=simulate({strategy});
  assert.equal(result.status,'won');assert.equal(result.rows.length,10);
  for(const row of result.rows){
   assert.equal(row.leaks,0,'wave '+row.wave+' must clear');
   assert.ok(row.dams>=2,'dam purchases must be included in the defence budget');
   assert.equal(row.income,waveBudget(row.wave).totalGold,'kill rewards and clear bonus must reconcile');
  }
  const late=result.rows.slice(6);
  assert.ok(late.some(row=>row.furthest>.8),'late waves must pressure the back line');
  assert.ok(result.rows.at(-1).bank-result.rows.at(-1).income<80,'money should be invested before the final wave');
 });
}
test('sitting on the starting defence cannot win the campaign',()=>{
 assert.equal(simulate({invest:false}).status,'lost');
});
test('wave health and income rise without an unaffordable health cliff',()=>{
 const budgets=Array.from({length:10},(_,i)=>waveBudget(i+1));
 for(let i=1;i<budgets.length;i++){
  assert.ok(budgets[i].totalHp>budgets[i-1].totalHp);
  assert.ok(budgets[i].totalGold>budgets[i-1].totalGold);
 }
 assert.equal(budgets.reduce((sum,row)=>sum+row.totalGold,220),2596);
 assert.equal(budgets.at(-1).totalHp,36336);
});
