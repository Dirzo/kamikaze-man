// Finite map director: enter -> run to the arena at the end of the stage -> survival swarm with the
// boss in it -> open exit -> next zone. You don't have to clear the residents on the way (it's a
// speedrun stage); clearing every one before the arena is a FULL CLEAR and pays shards. While
// exploring there are no timer spawns. The swarm locks the screen and pours enemies in until its timer runs out, then the
// zone's swarm boss arrives; beat it to open the exit. Hits during the swarm build a combo.
import { W, GROUND, HERO, C } from '../config.js';
import { world } from './world.js';
import { ZONES, bossSong, zoneSong } from '../data/zones.js';
import { ENEMIES } from '../data/enemies.js';
import { makeMap, CLEAR_BONUS } from '../data/maps.js';
import { enemyPool, maxRarity } from '../data/progression.js';
import { spawnEnemy } from './enemy.js';
import { kill } from './combat.js';
import { overlap } from './physics.js';
import { callout, shake } from './fx.js';
import { music, sfx } from '../engine/audio.js';
import { startBoss, bossDone, clearBoss, bossWarning } from './bosses.js';
import { clearAbilities } from './abilities.js';
import { clearSpecials } from './specials.js';
import { placeSecret } from './secrets.js';
import { makeWeapon } from './loot.js';
import { dropWeapon } from './combat.js';
import { updateCamera } from './camera.js';
import { splitZone } from './speedrun.js';
import { COMBO, SWARM_BOSS, BOSS_ARRIVES } from '../data/swarm.js';
import { BOSS_OF, headOfZone, levelTier, FOE_TIER, WORLD_RAMP } from '../data/families.js';
import { dropShards } from './combat.js';
import { stats } from '../data/meta.js';
import { placeRelics } from './relics.js';
import { placeHidden } from './hidden.js';
import { placeEgg } from './mount.js';
import { startGimmick } from './gimmicks.js';
import { modOn } from '../data/temper.js';

export function startZone(z) {
  clearBoss();
  clearAbilities();
  clearSpecials();
  world.boss=null;
  for(const key of ['echoes','shots','drops','pickups','enemies','bolts']) world[key].length=0;
  world.nearDrop=null;
  world.lock=null;
  world.swarmCombo=null;
  world.zone=z;
  world.wave=1; // encounter tier, retained for summoned-enemy scaling
  world.map=makeMap(z,world.level?.id);
  const tier=world.level?levelTier(world.level.id):0; // the road to the castle gets harder
  world.foeScale={hp:1+FOE_TIER.hp*tier,dmg:(1+FOE_TIER.dmg*tier)*(world.level?1+WORLD_RAMP.foeDmg*z:1)};
  placeSecret(z);
  placeEgg(z);
  placeHidden(z);
  placeRelics();
  world.lastRoom=null;
  world.platforms=world.map.platforms;
  world.cameraX=world.cameraY=0;
  const h=world.hero;
  if(h) {
    h.x=world.map.startX;h.y=world.map.startY-HERO.h;h.vx=h.vy=0;h.onGround=true;h.platform=null;
    h.attack=h.special=h.ladder=null;h.climbLock=0;h.trail=null;h.dashT=h.dropT=0;h.inv=Math.max(h.inv,1);
    if(z>0) h.hp=Math.min(h.maxHp,h.hp+Math.round(h.maxHp*0.6)); // a breather between maps
  }
  world.director={phase:'intro',t:2.6,toSpawn:0,initialCount:world.map.spawns.length,bossStarted:false};
  const elites=modOn(world.temper,'elites'); // TEMPER: ELITE PACKS
  const packType={};
  world.map.spawns.forEach((spot,i)=>{
    const pool=enemyPool(z,spot.wave,ZONES[z].pool,world.level?tier:null);
    // a pack keeps to one kind, with the odd straggler of another (a yeti and its fuzzlets)
    const lead=packType[spot.pack]??=pool[Math.floor(Math.random()*pool.length)];
    const type=Math.random()<0.7&&pool.includes(lead)?lead:pool[Math.floor(Math.random()*pool.length)], d=ENEMIES[type];
    spawnEnemy(type,spot.x,d.air?spot.airY:spot.y,{elite:spot.elite||(elites&&i%9===4),wave:spot.wave});
  });
  startGimmick();
  const song=zoneSong(z,world.level?.kind,world.map.dark); // the level's arrangement of the zone theme
  music.play(song.id,song.spec);
  sfx.zone();
  updateCamera(0,true);
}
const aliveResidents=()=>world.enemies.filter(e=>!e.dead && !e.boss).length;

export function updateWaves(dt) {
  const D=world.director,c=world.swarmCombo;
  music.layer(D && D.phase==='survive' && c && c.n>=10 && world.phase!=='dead'); // combo bongos
  if(!D || world.phase==='dead' || world.hidden?.inRoom) return; // a secret room is outside the map's count
  D.t-=dt;
  switch(D.phase) {
    case 'intro':
      if(D.t<=0) D.phase='fight';
      break;
    case 'fight':
      // the swarm, and the boss inside it, wait in the arena at the end of the stage: run there
      // any time. Clearing every resident first is a FULL CLEAR, with shards for it.
      if(world.hero.x+world.hero.w/2>=world.map.bossLeft+8) { startSurvival(); break; }
      if(aliveResidents()===0) {
        D.phase='arena';
        callout('FULL CLEAR! - TO THE ARENA >',W/2,64,C.gold,{big:true,life:120});
        dropShards(world.hero.x+world.hero.w/2,world.hero.y,8,CLEAR_BONUS(world.zone));
        sfx.clear();
      }
      break;
    case 'arena':
      if(world.hero.x+world.hero.w/2>=world.map.bossLeft+8) startSurvival();
      break;
    case 'survive':
      updateSurvival(dt);
      break;
    case 'exit':
      // Reaching the portal is the forward transition. No button ambiguity with loot swaps.
      if(D.t<=0 && Math.abs(world.hero.x+world.hero.w/2-world.map.exitX)<24 && Math.abs(world.hero.y+world.hero.h-world.map.exitY)<20) {
        if(world.level) {world.levelExit=world.secret?.found?'secret':'next';world.phase='cleared';break;} // overworld level: back to the map (the map's secret opens its secret exit)
        splitZone();
        if(world.zone+1>=ZONES.length) world.phase='won';
        else startZone(world.zone+1);
      }
      break;
  }
}
// ---------------------------------------------------------------- survival swarm
export const SURVIVE = { alive: z => Math.min(22, 12 + z), every: z => Math.max(0.22, 0.5 - z * 0.025), hp: 0.55 };
export function startSurvival() {
  const D=world.director,h=world.hero,m=world.map;
  // the boss shows up a few seconds in, at a moment you can't count down to
  D.phase='survive';D.t=BOSS_ARRIVES.min+Math.random()*BOSS_ARRIVES.spread;D.warned=false;
  D.spawnT=1;D.swarmKills=world.kills;D.sboss=null;D.sbossT=0;D.moveT=2;D.surprised=false;
  updateCamera(0,true);
  // the arena screen is locked; the boss fights inside the same walls
  world.lock={x0:m.width-W,x1:m.width,y0:Math.max(0,Math.min(m.floorY-GROUND,m.bossFloor-GROUND+12)),feet:m.bossFloor};
  world.swarmCombo={n:0,t:0,best:0,lost:0};
  world.bolts.length=0;
  sfx.clear();
  callout('SURVIVE!',W/2,104,C.coral,{big:true,life:120});
}
// a hit landed during the swarm: grow the combo and refill its timer
export function comboHit() {
  const c=world.swarmCombo;
  if(!c || world.director?.phase!=='survive') return;
  c.n++;c.best=Math.max(c.best,c.n);c.t=COMBO.window(c.n)*(1+stats().combo);
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
function updateSurvival(dt) {
  const D=world.director,L=world.lock,h=world.hero;
  D.spawnT-=dt;
  updateCombo(dt);
  const alive=world.enemies.filter(e=>!e.dead && !e.boss && e.x+e.w>L.x0).length; // (residents left behind on the stage don't count)
  const bossUp=!!D.sboss,cap=SURVIVE.alive(world.zone)*(bossUp?SWARM_BOSS.alive:1);
  if(D.spawnT<=0 && alive<cap && !(world.boss && world.boss.dead)) {
    D.spawnT=SURVIVE.every(world.zone)*(bossUp?SWARM_BOSS.every:1);
    const pool=enemyPool(world.zone,4,ZONES[world.zone].pool,world.level?levelTier(world.level.id):null).filter(t=>ENEMIES[t].kind!=='mimic');
    const type=pool[Math.floor(Math.random()*pool.length)],[x,y]=swarmSpot(ENEMIES[type]);
    const e=spawnEnemy(type,x,y,{elite:Math.random()<0.06,wave:4});
    if(e){e.swarm=true;e.max=e.hp=Math.max(1,Math.round(e.hp*SURVIVE.hp));}
  }
  // the screen is the arena: nobody leaves it
  h.x=Math.max(L.x0+2,Math.min(L.x1-2-h.w,h.x));
  for(const e of world.enemies) if(!e.dead && e.swarm) e.x=Math.max(L.x0,Math.min(L.x1-e.w,e.x));
  if(!bossUp) {
    if(D.t<=BOSS_ARRIVES.warn && !D.warned) {
      // the surprise: a themed rumble, then the boss crashes in
      D.warned=true;
      callout(bossWarning(levelBoss())||'SOMETHING IS COMING...',W/2,92,C.coral,{big:true,life:100});
      shake(0.6);sfx.enemyCast();
    }
    if(D.t<=0) bossArrives() || endSurvival();
    return;
  }
  D.sbossT+=dt;
  if(bossDone()) endSurvival();
}
// An overworld level's own boss (a sibling, or the family head in a castle). A classic ten-map
// run meets each world's head.
export const levelBoss=()=>world.level?BOSS_OF[world.level.id]:headOfZone(world.zone);
function bossArrives() {
  const D=world.director,kind=levelBoss();
  const song=headOfZone(world.zone); // the family's battle theme
  music.play('boss:'+song+':'+world.zone,bossSong(song,world.zone));
  startBoss(kind,world.level?levelTier(world.level.id):1);
  D.sboss=world.boss;D.sbossT=0;D.bossStarted=true;
  return world.boss;
}
function endSurvival() {
  const D=world.director,h=world.hero,c=world.swarmCombo||{best:0};
  // the arena's foes fall with the boss; residents you ran past stay where they are (no free loot)
  for(const e of [...world.enemies]) if(!e.dead && !e.boss && e.x+e.w>world.map.width-W) kill(e,{dir:Math.sign(e.x-h.x)||1});
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
  // a parting gift from the zone: its own weapon (a better sword from the Sword Graveyard), already
  // tuned for the next map at the best tier this one rolls, so there is always something ready to carry on with
  const z=world.zone,home=ZONES[z].weapon;
  if(home) dropWeapon(world.hero.x+18,world.hero.y,makeWeapon(Math.min(9,z+1),{type:home,q:maxRarity(z),standout:false}));
}
export function enemiesLeft() {
  if(!world.director) return 0;
  return world.enemies.filter(e=>!e.dead).length;
}
