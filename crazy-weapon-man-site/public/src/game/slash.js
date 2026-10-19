// A three-frame pixel crescent drawn over the SAME box the combat resolver uses.
// No legacy arcs, aura circles, strokes or post-processing layer.
import { X, rect } from '../engine/gfx.js';
import { C } from '../config.js';
import { TYPES } from '../data/weapons.js';
import { attackBox, activeWindow } from './attack-rules.js';
import { lookOf } from './looks.js';
const FRAMES = [
  ['.....##.', '.......#', '.......#', '.......#', '.......#', '.....##.'],
  ['..#####.', '......##', '.......#', '.......#', '......##', '..#####.'],
  ['.##.....', '....##..', '......##', '......##', '....##..', '.##.....']
];
export function drawSlash(h) {
  const a=h.attack;
  if(!a || a.ranged) return;
  const T=TYPES[h.weapon.type], [start,end]=activeWindow(h.weapon.type,a.move.big), p=a.t/a.dur;
  if(p<start || p>end) return;
  const box=attackBox(h,T,a.move), f=Math.min(2,Math.floor((p-start)/(end-start)*3)), rows=FRAMES[f];
  const col=lookOf(h.weapon).light;
  for(let y=0;y<6;y++) for(let x=0;x<8;x++) if(rows[y][x]==='#') {
    const xx=h.face>0?x:7-x;
    rect(box.x+xx*box.w/8, box.y+y*box.h/6, Math.max(1,box.w/8), Math.max(1,box.h/6), f===1?C.paper:col);
  }
}
