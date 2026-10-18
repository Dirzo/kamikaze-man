// Build-defining weapon mutations. Only primary attacks trigger procs; procs never trigger procs.
import { C } from '../config.js';
import { world, newId } from './world.js';
import { hitEnemy } from './combat.js';
import { hitDamage } from './loot.js';
import { cx, cy } from './physics.js';
import { emit, spark, shake } from './fx.js';
import { rect, text } from '../engine/gfx.js';

export function attackMutation(h) {
  h.attackCount = (h.attackCount || 0) + 1;
  if (h.weapon.mutation === 'cataclysm' && h.attackCount % 3 === 0)
    world.echoes.push({ kind: 'cataclysm', x: cx(h), y: cy(h), t: 0.42, dmg: hitDamage(h.weapon) * 1.35, face: h.face, uid: h.weapon.uid });
}
export function impactMutation(h, e, attack) {
  const w = attack.weapon || h.weapon;
  const m = w.mutation;
  if (!m || attack.proc) return;
  if (m === 'seeker') {
    attack.proc = true;
    const target = world.enemies.find(o => o !== e && !o.dead && Math.hypot(cx(o)-cx(e),cy(o)-cy(e)) < 140) || e;
    const a = Math.atan2(cy(target)-cy(e), cx(target)-cx(e));
    world.shots.push({ id: newId(), type: 'wand', x: cx(e), y: cy(e)-8, w: 4, h: 4,
      vx: Math.cos(a)*170, vy: Math.sin(a)*170, dmg: hitDamage(w)*0.55, crit: false,
      knock: 6, pierce: 0, homing: 7, life: 1.1, hit: new Set([e]), element: null,
      col: C.lime, light: C.paper, weapon: w, emitters: [], spin: 0, proc: true });
  }
  if ((m === 'echo' || m === 'eruption') && attack.move?.big) {
    attack.proc = true;
    world.echoes.push({ kind: m, x: cx(e), y: cy(e), t: m === 'echo' ? 0.17 : 0.3,
      dmg: hitDamage(w)*(m === 'echo' ? 0.7 : 1.05), face: h.face, uid: w.uid });
  }
}
export function updateEvolution(dt) {
  const h = world.hero;
  if (!h || h.dead) return;
  if (h.weapon.mutation === 'orbit') {
    h.orbitTick = (h.orbitTick || 0) - dt;
    if (h.orbitTick <= 0) {
      h.orbitTick = 0.3;
      for (let i=0;i<3;i++) {
        const a=world.t*3+i*Math.PI*2/3, x=cx(h)+Math.cos(a)*27, y=cy(h)+Math.sin(a)*18;
        for (const e of world.enemies) if (!e.dead && Math.abs(cx(e)-x)<e.w/2+5 && Math.abs(cy(e)-y)<e.h/2+5)
          hitEnemy(e,hitDamage(h.weapon)*0.22,{chip:true,dir:Math.sign(x-cx(h))||1,knock:3,col:C.violet});
      }
    }
  }
  for (let i=world.echoes.length-1;i>=0;i--) {
    const q=world.echoes[i]; q.t-=dt;
    if (q.t>0) continue;
    const r=q.kind==='cataclysm'?125:q.kind==='eruption'?48:26;
    for (const e of world.enemies) if (!e.dead && Math.abs(cx(e)-q.x)<r && Math.abs(cy(e)-q.y)<(q.kind==='cataclysm'?60:32))
      hitEnemy(e,q.dmg,{special:true,dir:Math.sign(cx(e)-q.x)||q.face,knock:18,sparkCol:q.kind==='echo'?C.sky:C.gold});
    spark(q.x,q.y,{big:true,col:q.kind==='echo'?C.sky:C.orange});
    for (let x=-r;x<=r;x+=5) emit(q.x+x,q.y,'spark',q.kind==='echo'?C.sky:C.gold);
    if(q.kind==='cataclysm') shake(0.6);
    world.echoes.splice(i,1);
  }
}
export function drawEvolution() {
  const h=world.hero;
  if (!h || h.dead) return;
  if(h.weapon.mutation==='orbit') for(let i=0;i<3;i++) {
    const a=world.t*3+i*Math.PI*2/3, x=cx(h)+Math.cos(a)*27, y=cy(h)+Math.sin(a)*18;
    rect(x-3,y-3,7,7,C.ink);rect(x-2,y,5,1,C.violet);rect(x,y-2,1,5,C.paper);
  }
  for(const q of world.echoes) {
    const r=q.kind==='cataclysm'?125:q.kind==='eruption'?48:26;
    for(let x=-r;x<=r;x+=6) rect(q.x+x,q.y+12,3,1,q.kind==='echo'?C.sky:C.gold);
    if(q.kind==='cataclysm') text('MOON BREAK',q.x,q.y-28,C.gold,{align:'center'});
  }
}
