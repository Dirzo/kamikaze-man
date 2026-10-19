// Finite map director: enter -> clear every resident -> boss (if any) -> survival swarm -> open exit
// -> Forge. While exploring there are no timer spawns; the remaining count includes undiscovered
// enemies. The swarm locks the screen and pours enemies in until its timer runs out, then the
// zone's swarm boss arrives; beat it to open the exit. Hits during the swarm build a combo.
import { W, GROUND, HERO, C } from '../config.js';
import { world } from './world.js';
import { ZONES, bossSong } from '../data/zones.js';
import { ENEMIES } from '../data/enemies.js';
import { makeMap } from '../data/maps.js';
import { enemyPool } from '../data/progression.js';
import { spawnEnemy } from './enemy.js';
import { kill } from './combat.js';
import { overlap } from './physics.js';
import { callout, shake } from './fx.js';
import { music, sfx } from '../engine/audio.js';
import { startBoss, bossDone, clearBoss } from './bosses.js';
import { makeWeapon } from './loot.js';
import { dropWeapon } from './combat.js';
import { openForge, updateForge } from './forge.js';
import { updateCamera } from './camera.js';
import { refHP, refDmg } from '../data/curve.js';
import { COMBO, SWARM_BOSS, SWARM_BOSSES } from '../data/swarm.js';
import { dropShards } from './combat.js';
import { say } from './bubbles.js';

export function startZone(z) {
  clearBoss();
  for(const key of ['echoes','shots','drops','pickups','enemies','bolts']) world[key].length=0;
  world.nearDrop=null;
  world.lock=null;
  world.swarmCombo=null;
  world.zone=z;
  world.wave=1; // encounter tier, retained for summoned-enemy scaling
  world.map=makeMap(z);
  world.platforms=world.map.platforms;
  world.cameraX=world.cameraY=0;
  const h=world.hero;
  if(h) {
    h.x=48;h.y=GROUND-HERO.h;h.vx=h.vy=0;h.onGround=true;h.platform=null;
    h.attack=h.special=h.ladder=null;h.climbLock=0;h.trail=null;h.dashT=h.dropT=0;h.inv=Math.max(h.inv,1);
    if(z>0) h.hp=Math.min(h.maxHp,h.hp+Math.round(h.maxHp*0.3));
  }
  world.director={phase:'intro',t:2.6,toSpawn:0,initialCount:world.map.spawns.length,bossStarted:false};
  for(const spot of world.map.spawns) {
    const pool=enemyPool(z,spot.wave,ZONES[z].pool);
    const type=pool[Math.floor(Math.random()*pool.length)], d=ENEMIES[type];
    spawnEnemy(type,spot.x,d.air?Math.max(70,spot.y-65):spot.y,{elite:spot.elite,wave:spot.wave});
  }
  music.play('zone:'+z,ZONES[z].music);
  sfx.zone();
  updateCamera(0,true);
}
const aliveResidents=()=>world.enemies.filter(e=>!e.dead && !e.boss).length;

export function updateWaves(dt) {
  const D=world.director;
  if(!D || world.phase==='dead') return;
  D.t-=dt;
  switch(D.phase) {
    case 'intro':
      if(D.t<=0) D.phase='fight';
      break;
    case 'fight':
      if(aliveResidents()===0) {
        if(ZONES[world.zone].boss && !D.bossStarted) {
          D.bossStarted=true;D.phase='boss';
          music.play('boss:'+ZONES[world.zone].boss,bossSong(ZONES[world.zone].boss));
          startBoss(ZONES[world.zone].boss);
        } else startSurvival();
      }
      break;
    case 'boss':
      if(bossDone() && aliveResidents()===0) startSurvival();
      break;
    case 'survive':
      updateSurvival(dt);
      break;
    case 'exit':
      // Reaching the portal is the forward transition. No button ambiguity with loot swaps.
      if(D.t<=0 && Math.abs(world.hero.x+world.hero.w/2-world.map.exitX)<24 && Math.abs(world.hero.y+world.hero.h-world.map.exitY)<20) {
        if(world.zone+1>=ZONES.length) world.phase='won';
        else {D.phase='forge';openForge();}
      }
      break;
    case 'forge':
      if(updateForge(dt)) startZone(world.zone+1);
      break;
  }
}
// ---------------------------------------------------------------- survival swarm
export const SURVIVE = { time: z => 30 + z * 2, alive: z => Math.min(22, 12 + z), every: z => Math.max(0.22, 0.5 - z * 0.025), hp: 0.55 };
function startSurvival() {
  const D=world.director,h=world.hero;
  D.phase='survive';D.t=SURVIVE.time(world.zone);D.spawnT=1;D.swarmKills=world.kills;D.sboss=null;D.sbossT=0;
  updateCamera(0,true); // lock the screen the hero is standing in
  world.lock={x0:Math.round(world.cameraX),x1:Math.round(world.cameraX)+W,y0:Math.round(world.cameraY),feet:h.y+h.h};
  world.swarmCombo={n:0,t:0,best:0,lost:0};
  world.bolts.length=0;
  sfx.clear();
  callout('SURVIVE!',W/2,104,C.coral,{big:true,life:120});
}
// a hit landed during the swarm: grow the combo and refill its timer
export function comboHit() {
  const c=world.swarmCombo;
  if(!c || world.director?.phase!=='survive') return;
  c.n++;c.best=Math.max(c.best,c.n);c.t=COMBO.window(c.n);
  if(c.n%25===0) callout(`${c.n} COMBO!`,W/2,118,C.gold,{life:50});
}
function updateCombo(dt) {
  const c=world.swarmCombo;
  if(!c || c.n<=0) return;
  c.t-=dt;
  if(c.t<=0) {
    if(c.n>=10) callout('COMBO DROPPED',W/2,118,C.coral,{life:50});
    c.lost=c.n;c.n=0;
  }
}
function swarmSpot(d) {
  const L=world.lock,h=world.hero,solids=world.map?.solids||[];
  for(let i=0;i<12;i++) {
    const x=L.x0+16+Math.random()*(W-32);
    if(Math.abs(x-(h.x+h.w/2))<70) continue;
    const y=d.air?L.feet-60-Math.random()*40:L.feet;
    const box={x:x-8,y:y-24,w:16,h:23};
    if(!solids.some(p=>overlap(box,p))) return [x,y];
  }
  const side=Math.random()<0.5?-1:1;
  return [Math.max(L.x0+12,Math.min(L.x1-12,h.x+side*110)),d.air?L.feet-70:L.feet];
}
// the zone's unique swarm boss: a giant, named resident with a boss bar
export function spawnSwarmBoss() {
  const D=world.director,L=world.lock,h=world.hero,z=world.zone,B=SWARM_BOSSES[z%SWARM_BOSSES.length];
  const d=ENEMIES[B.type],side=h.x+h.w/2<(L.x0+L.x1)/2?1:-1;
  const x=side>0?L.x1-50:L.x0+50,y=d.air?L.feet-70:L.feet;
  const e=spawnEnemy(B.type,x,y,{elite:true,wave:4});
  if(!e) return null;
  const feet=e.y+e.h,mid=e.x+e.w/2;
  e.w=Math.round(e.w*B.scale);e.h=Math.round(e.h*B.scale);
  e.x=mid-e.w/2;e.y=d.air?y-e.h/2:feet-e.h;
  e.scale=B.scale;e.swarm=e.swarmBoss=true;
  e.d={...d,range:d.range*(d.kind==='melee'||d.kind==='shield'||d.kind==='blink'?B.scale:1)};
  e.name=B.name;
  e.max=e.hp=Math.round(refHP(z)*SWARM_BOSS.hp);
  e.dmg=refDmg(z)*d.dmg*SWARM_BOSS.dmg;
  e.xp*=5;
  e.spawnT=0.9;
  D.sboss=e;D.sbossT=0;
  world.boss=e;
  callout(B.name,W/2,104,C.gold,{big:true,life:140});
  say(e,B.line,2.4,true);
  shake(0.5);
  return e;
}
function updateSurvival(dt) {
  const D=world.director,L=world.lock,h=world.hero;
  D.spawnT-=dt;
  updateCombo(dt);
  const alive=world.enemies.filter(e=>!e.dead && !e.boss && !e.swarmBoss).length;
  const bossUp=!!D.sboss,cap=SURVIVE.alive(world.zone)*(bossUp?SWARM_BOSS.alive:1);
  if(D.spawnT<=0 && alive<cap && !(bossUp && D.sboss.dead)) {
    D.spawnT=SURVIVE.every(world.zone)*(bossUp?SWARM_BOSS.every:1);
    const pool=enemyPool(world.zone,4,ZONES[world.zone].pool).filter(t=>ENEMIES[t].kind!=='mimic');
    const type=pool[Math.floor(Math.random()*pool.length)],[x,y]=swarmSpot(ENEMIES[type]);
    const e=spawnEnemy(type,x,y,{elite:Math.random()<0.06,wave:4});
    if(e){e.swarm=true;e.max=e.hp=Math.max(1,Math.round(e.hp*SURVIVE.hp));}
  }
  // the screen is the arena: nobody leaves it
  h.x=Math.max(L.x0+2,Math.min(L.x1-2-h.w,h.x));
  for(const e of world.enemies) if(!e.dead && e.swarm) e.x=Math.max(L.x0,Math.min(L.x1-e.w,e.x));
  if(!bossUp) {
    if(D.t<=0) spawnSwarmBoss() || endSurvival();
    return;
  }
  D.sbossT+=dt;
  if(D.sboss.dead) endSurvival();
}
function endSurvival() {
  const D=world.director,h=world.hero,c=world.swarmCombo||{best:0};
  for(const e of [...world.enemies]) if(!e.dead && !e.boss) kill(e,{dir:Math.sign(e.x-h.x)||1});
  const bonus=Math.floor(c.best/COMBO.shardsPer);
  if(bonus>0) dropShards(h.x+h.w/2,h.y,Math.min(40,bonus));
  callout(`SURVIVED! ${world.kills-D.swarmKills} KILLS  BEST COMBO ${c.best}`,W/2,104,C.lime,{big:true,life:150});
  world.lock=null;
  world.swarmCombo=null;
  openExit();
}
export const survivalLeft=()=>world.director?.phase==='survive'?Math.max(0,world.director.t):0;
export const swarmBossUp=()=>world.director?.phase==='survive' && !!world.director.sboss;

function openExit() {
  const D=world.director;
  D.phase='exit';D.t=1.2;
  world.bolts.length=0;
  sfx.clear();
  callout('MAP CLEAR - EXIT OPEN',W/2,64,C.gold,{big:true,life:120});
  if(world.zone===0) dropWeapon(world.hero.x+18,world.hero.y,makeWeapon(0,{q:1,standout:false}));
}
export function enemiesLeft() {
  if(!world.director) return 0;
  const alive=world.enemies.filter(e=>!e.dead).length;
  // Reserve the boss in the count from the start: "0 left" always means the map is really clear.
  return alive+(ZONES[world.zone].boss && !world.director.bossStarted?1:0);
}
