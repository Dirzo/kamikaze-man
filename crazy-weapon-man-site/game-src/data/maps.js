// Ant Tunnel's layout language: offset chambers descending through a connected cave network.
// Biome art and names belong to ZONES; geometry never replaces their identity.
import { W, GROUND } from '../config.js';
import { ZONES } from './zones.js';
export function makeMap(zone) {
  const sections=8+Math.floor(zone/2),width=sections*W,countRooms=4+Math.floor(zone/3);
  const weights=[1,.76,1.2,.86,1.12,.82,1.04].slice(0,countRooms);
  const total=weights.reduce((a,b)=>a+b,0),rooms=[];
  let x=0,y=GROUND;
  for(let i=0;i<countRooms;i++) {
    const end=i===countRooms-1?width:Math.round((x+width*weights[i]/total)/8)*8;
    rooms.push({x,end,w:end-x,floor:y,index:i});x=end;
    y+=[168,210,150,224,178,202][(i+zone)%6];
  }
  const floorY=rooms.at(-1).floor,platforms=[],solids=[],ladders=[];
  const hasBoss=!!ZONES[zone].boss;
  const ladder=(x,bottom,p,exitX)=>ladders.push({x,top:p.y-28,bottom,exitX,exitY:p.y,section:Math.floor(x/W)});
  for(const room of rooms) {
    const {x,w,floor,index}=room, bossRoom=hasBoss && index===rooms.length-1;
    const base={x,y:floor,w,h:floorY-floor+64,solid:true,room:index,ground:true};
    platforms.push(base);solids.push(base);
    // Massive overhangs shape each neck and chamber; no repeated horizontal storeys.
    if(index>0) {
      const roof={x:x+148,y:0,w:w-148,h:floor-(bossRoom?218:172+index%2*24),ceiling:true,solid:true};
      solids.push(roof);
      const prev=platforms.find(p=>p.ground && p.room===index-1);
      ladder(x+36,floor,prev,x-28);
      // Small resting shelves break up the vertical passage beside the return rope.
      const drop=floor-prev.y;
      for(let step=1;step<Math.ceil(drop/76);step++)platforms.push({x:x+54+(step%2)*16,y:prev.y+step*68,w:64,room:index,connector:true});
    }
    const usable=bossRoom?w-W-40:w;
    if(usable>370) {
      const shelfX=x+Math.round(usable*.28),shelfW=Math.min(360,Math.round(usable*.44));
      const shelf={x:shelfX,y:floor-76,w:shelfW,room:index,hunt:true};
      platforms.push(shelf);
      platforms.push({x:shelfX-90,y:floor-38,w:104,room:index,connector:true});
      platforms.push({x:shelfX+shelfW-12,y:floor-38,w:112,room:index,connector:true});
      ladder(shelfX+shelfW-26,floor,shelf,shelfX+shelfW-48);
      // An offset alcove is a branch off the chamber, not another full-width lane.
      if(index%2===0 && usable>650) {
        const alcove={x:x+usable-190,y:floor-112,w:146,room:index,hunt:true};
        platforms.push(alcove);ladder(alcove.x+30,floor,alcove,alcove.x+12);
      }
    }
  }
  const count=28+zone*3,spawns=[];
  const hunt=platforms.filter(p=>p.ground||p.hunt);
  for(let i=0;i<count;i++) {
    const p=hunt[i%hunt.length],slot=Math.floor(i/hunt.length);
    const left=p.ground?p.x+Math.min(190,p.w*.24):p.x+24;
    const span=Math.max(1,p.x+p.w-28-left);
    const sx=left+((slot*137+i*53)%span);
    spawns.push({x:sx,y:p.y,section:Math.floor(sx/W),room:p.room,wave:Math.min(4,1+Math.floor(p.room*4/countRooms)),elite:zone>0&&i>0&&i%9===0});
  }
  return {name:ZONES[zone].name,width,height:floorY+64,floorY,rooms,sections,platforms,solids,ladders,spawns,
    exitX:width-36,exitY:floorY,bossFloor:floorY,bossLeft:width-W+8,bossRight:width-8};
}
export function cameraTarget(x,width) {return Math.max(0,Math.min(width-W,x-W*.42));}
export function cameraTargetY(feet,floorY) {return Math.max(0,Math.min(floorY-GROUND,feet-GROUND+12));}
