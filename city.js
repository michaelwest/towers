import {canalEdges,damSites} from './canals.js';
import {sites} from './engine.js';

export const citySprites={
 dense:[57,10,432,360],palazzo:[553,9,422,372],warehouses:[1032,49,480,299],
 market:[38,386,451,271],piazza:[534,379,474,283],garden:[1034,324,477,354],
 townhouse:[135,650,270,350],workshop:[522,700,487,268],civic:[1038,664,473,345]
};
const reserved=[{x:4,y:318,w:92,h:100},{x:277,y:634,w:160,h:92},...damSites.map(s=>({x:s.x-47,y:s.y-20,w:94,h:40}))];
const gap=(a,b,c,d)=>Math.max(0,a-d,c-b);
export function canalClearance(rect){
 let nearest=Infinity;
 for(const edge of canalEdges){const [a,b]=edge.points;
  nearest=Math.min(nearest,Math.hypot(gap(rect.x,rect.x+rect.w,Math.min(a[0],b[0]),Math.max(a[0],b[0])),gap(rect.y,rect.y+rect.h,Math.min(a[1],b[1]),Math.max(a[1],b[1]))));
 }
 return nearest;
}
export function pointClearance(rect,p){return Math.hypot(Math.max(rect.x-p[0],0,p[0]-rect.x-rect.w),Math.max(rect.y-p[1],0,p[1]-rect.y-rect.h));}
function overlaps(a,b,pad=3){return a.x<b.x+b.w+pad&&a.x+a.w+pad>b.x&&a.y<b.y+b.h+pad&&a.y+a.h+pad>b.y;}
export function createCityLayout(){
 const layout=[];let seed=5739;
 const random=()=>{seed=seed*16807%2147483647;return (seed-1)/2147483646;};
 function place(kind,x,y,w,h){
  const rect={kind,x,y,w,h};
  const visible=Math.max(0,Math.min(720,x+w)-Math.max(0,x))*Math.max(0,Math.min(730,y+h)-Math.max(0,y));
  if(visible<w*h*.6||canalClearance(rect)<44||sites.some(p=>pointClearance(rect,p)<24)||reserved.some(r=>overlaps(rect,r,2))||layout.some(r=>overlaps(rect,r,['market','piazza','garden'].includes(kind)||['market','piazza','garden'].includes(r.kind)?3:-9)))return false;
  layout.push(rect);return true;
 }
 // Larger destinations establish neighbourhood character before filling streets.
 const landmarks=[
  ['market',82,610,138,83],['garden',500,639,112,83],['piazza',634,16,76,48],
  ['dense',13,435,75,63],['dense',17,510,90,75],['dense',118,493,65,55],['warehouses',192,550,94,58],['dense',627,590,82,68],['dense',630,670,76,61],
  ['civic',442,0,68,50],['palazzo',192,164,56,50],['dense',305,166,61,49],
  ['warehouses',423,165,63,43],['dense',235,315,60,46],['workshop',354,315,62,37],
  ['market',473,315,56,34],['workshop',239,469,52,29],['dense',440,471,49,42],
  ['palazzo',638,227,71,63],['warehouses',637,434,77,48],['workshop',636,548,76,42],
  ['townhouse',18,432,43,58],['dense',14,518,60,50],['civic',8,102,57,50]
 ];
 for(const item of landmarks)place(...item);
 // Pack different-sized footprints, leaving alleys and clear tower moorings.
 for(const height of [48,40,32]){
  for(let y=-9;y<730;y+=11)for(let x=-9;x<720;x+=11){
   const roll=random();
   const palette=y>585?['dense','dense','dense','palazzo','warehouses','warehouses','townhouse','workshop','market','piazza','garden']:['dense','dense','dense','palazzo','warehouses','warehouses','townhouse','workshop'];
   const kind=palette[Math.floor(roll*palette.length)],crop=citySprites[kind];
   const h=height+(random()-.5)*6,w=h*crop[2]/crop[3];
   place(kind,x+(random()-.5)*3,y+(random()-.5)*3,w,h);
  }
 }
 return layout.sort((a,b)=>(a.y+a.h)-(b.y+b.h));
}
export const cityLayout=createCityLayout();
export function paintCitySprite(context,image,item){context.drawImage(image,...citySprites[item.kind],item.x,item.y,item.w,item.h);}
