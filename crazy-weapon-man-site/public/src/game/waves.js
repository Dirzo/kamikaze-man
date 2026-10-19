// Finite map director: enter -> clear every resident -> boss (if any) -> open exit -> Forge.
// No timer spawns or repeat waves. The remaining count always includes undiscovered enemies.
import { W, GROUND, HERO, C } from '../config.js';
import { world } from './world.js';
import { ZONES, bossSong } from '../data/zones.js';
import { ENEMIES } from '../data/enemies.js';
import { makeMap } from '../data/maps.js';
import { enemyPool } from '../data/progression.js';
import { spawnEnemy } from './enemy.js';
import { callout } from './fx.js';
import { music, sfx } from '../engine/audio.js';
import { startBoss, bossDone, clearBoss } from './bosses.js';
import { makeWeapon } from './loot.js';
import { dropWeapon } from './combat.js';
import { openForge, updateForge } from './forge.js';
import { updateCamera } from './camera.js';

export function startZone(z) {
  clearBoss();
  for(const key of ['echoes','shots','drops','pickups','enemies','bolts']) world[key].length=0;
  world.nearDrop=null;
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
        } else openExit();
      }
      break;
    case 'boss':
      if(bossDone() && aliveResidents()===0) openExit();
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
