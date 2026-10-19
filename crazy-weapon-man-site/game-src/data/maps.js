// Finite, traversable side-scrolling routes. Surface heights differ by at most 38px: every tier
// is reachable with the normal jump (about 45px), with overlapping landings and a safe ground path.
import { W, GROUND } from '../config.js';
const ROUTES = [
  {name:'Graveyard Road', sections:3, pattern:0},
  {name:'The Spore Trail', sections:3, pattern:1},
  {name:'Crater Ascent', sections:4, pattern:2},
  {name:'The Banquet Run', sections:4, pattern:3},
  {name:'Bellkeeper Walk', sections:4, pattern:1},
  {name:'Frostbite Pass', sections:4, pattern:2},
  {name:'Anvil Highway', sections:5, pattern:3},
  {name:'Grandma\'s Garden', sections:5, pattern:0},
  {name:'The Crown Road', sections:5, pattern:2},
  {name:'The Last Inventory', sections:5, pattern:1}
];
const SHAPES = [
  [[76,168,112],[166,132,112],[264,168,126]],
  [[64,168,100],[144,132,108],[238,100,100],[322,168,110]],
  [[70,170,108],[162,134,108],[256,100,112],[340,136,100]],
  [[56,168,142],[176,132,120],[280,168,150]]
];
export function makeMap(zone) {
  const route=ROUTES[zone], width=route.sections*W;
  const platforms=[];
  for(let s=0;s<route.sections;s++) {
    const shape=SHAPES[(route.pattern+s)%SHAPES.length];
    // The boss has a flat 480px end chamber; its entry steps remain reachable.
    if(s===route.sections-1 && [2,5,6,7,8,9].includes(zone)) {
      platforms.push({x:s*W+40,y:168,w:100},{x:s*W+310,y:168,w:110});
    } else for(const [x,y,w] of shape) platforms.push({x:s*W+x,y,w});
  }
  const count=10+zone*2;
  const spawns=[];
  for(let i=0;i<count;i++) {
    const x=190+(width-290)*i/Math.max(1,count-1);
    const section=Math.min(route.sections-1,Math.floor(x/W));
    const choices=platforms.filter(p=>Math.floor(p.x/W)===section);
    const p=i%3===1 && i>1 ? choices[Math.floor(i/3)%choices.length] : null;
    spawns.push({x:p?p.x+p.w/2:x,y:p?p.y:GROUND,section,wave:Math.min(4,section+1),elite:zone>0 && i>0 && i%7===0});
  }
  return {name:route.name,width,sections:route.sections,platforms,spawns,exitX:width-36,bossLeft:width-W+8,bossRight:width-8};
}
export function cameraTarget(x, width) { return Math.max(0,Math.min(width-W,x-W*0.42)); }
