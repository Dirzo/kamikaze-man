// Large three-tier hunting maps: sandstone ridges and enclosed fungal tunnels, joined by shafts.
// The bottom floor is a recovery route: falling never strands the player or loses a required mob.
import { W, GROUND } from '../config.js';
const ROUTES = [
  ['Gravebreaker Badlands','canyon',8],['The Fungal Warrens','tunnel',8],
  ['Ember Ant Galleries','tunnel',9],['The Bone Mesa','canyon',9],
  ['Buried Bell Catacombs','tunnel',10],['The Redstone Steps','canyon',10],
  ['Cinder Mine Depths','tunnel',11],['Witchroot Burrows','tunnel',11],
  ['Crownrock Highlands','canyon',12],['The Deep Armory','tunnel',12]
];
export function makeMap(zone) {
  const [name,style,sections]=ROUTES[zone], width=sections*W, floorY=GROUND+384;
  const levels=[GROUND,GROUND+144,GROUND+288], platforms=[],solids=[],ladders=[];
  const hasBoss=[2,5,6,7,8,9].includes(zone);
  for(let s=0;s<sections;s++) {
    const base=s*W, chamber=hasBoss && s===sections-1;
    for(let lane=0;lane<3;lane++) {
      if(chamber) {
        const p={x:base+(lane===2?268:0),y:levels[lane],w:lane===0?144:lane===1?190:160,lane};
        platforms.push(p);continue;
      }
      const inset=style==='canyon'?(lane===1?36:0):(lane===1?20:0);
      const block={x:base+inset,y:levels[lane],w:420-inset,h:style==='tunnel'?56:68,lane,solid:true};
      solids.push(block);platforms.push(block);
      // Short bridges cross some shafts. They remain one-way so DOWN+JUMP opens the lower route.
      if(lane===1 || (style==='canyon' && lane===0 && s%2===1))
        platforms.push({x:base+420,y:levels[lane],w:60+inset,lane,bridge:true});
      // Raised ledges vary the fight silhouettes without blocking the broad hunting decks.
      if(style==='canyon' && lane===0 && s%2===0)
        platforms.push({x:base+220,y:levels[lane]-32,w:110,lane,ledge:true});
    }
    ladders.push({x:base+(chamber?184:450),top:levels[0]-30,bottom:floorY,
      exitX:base+(chamber?120:400),exitY:levels[0],section:s});
  }
  const count=28+zone*3, spawns=[];
  for(let i=0;i<count;i++) {
    const section=Math.min(sections-1,Math.floor(i*sections/count)), lane=(i+Math.floor(i/sections))%3;
    const decks=platforms.filter(p=>Math.floor(p.x/W)===section && p.lane===lane && !p.bridge && !p.ledge);
    const p=decks[0];
    const x=p.x+Math.min(p.w-28,70+(i%2)*170);
    spawns.push({x,y:p.y,section,lane,wave:Math.min(4,1+Math.floor(section*4/sections)),elite:zone>0 && i>0 && i%9===0});
  }
  return {name,style,width,height:floorY+40,floorY,levels,sections,platforms,solids,ladders,spawns,
    exitX:width-36,exitY:floorY,bossFloor:floorY,bossLeft:width-W+8,bossRight:width-8};
}
export function cameraTarget(x,width) {return Math.max(0,Math.min(width-W,x-W*0.42));}
export function cameraTargetY(feet,floorY) {return Math.max(0,Math.min(floorY-GROUND,feet-GROUND+12));}
