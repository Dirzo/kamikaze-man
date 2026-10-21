// Deterministic visual fixtures for CI screenshots. Opt in with ?capture=combat|bag|swarm|results|ladder|late|kills,
// ?capture=secret1..secret10 for where each map hides its easter egg,
// ?capture=tour1..tour10 for a look at each zone's layout with its residents in place, or
// ?capture=boss1..boss10 for each zone's boss mid-swarm, pulling its surprise, ?capture=lv1-3 (any
// level id) for that overworld level's own boss, or ?capture=powers0..3 for the POWERS window tabs (3: an open constellation).
import { world } from '../game/world.js';
import { makeWeapon } from '../game/loot.js';
import { startZone, updateWaves, startSurvival } from '../game/waves.js';
import { updateEnemy, updateBolts } from '../game/enemy.js';
import { fireTrait } from '../game/traits.js';
import { ENEMIES } from '../data/enemies.js';
import { spawnEnemy } from '../game/enemy.js';
import { openInventory, stash } from '../game/inventory.js';
import { startBoss, updateBoss, updateHazards, castMove } from '../game/bosses.js';
import { ZONES } from '../data/zones.js';
import { MOVES } from '../data/weapons.js';
import { logDamage } from '../game/speedrun.js';
import { addProficiency } from '../data/proficiency.js';
import { GROUND } from '../config.js';
import { updateCamera } from '../game/camera.js';
import { newSave, revealAll, clearLevel, writeSave, NODES } from '../data/overworld.js';
import { bankShards, buyRank, winTrophy, choosePerk, setLock } from '../data/meta.js';
import { useFile, eraseFile } from '../data/saves.js';
import { openPowers, P as powers } from '../game/powers.js';
import { hitEnemy, DEATH_T } from '../game/combat.js';
import { updateFx } from '../game/fx.js';
// ?capture=map: a first visit (two levels down, at the first fork); ?capture=mapall: every road open
function mapScene(game, all) {
  const s = all ? revealAll(newSave()) : newSave();
  if (!all) { clearLevel(s, '1-1'); clearLevel(s, '1-2'); }
  s.at = all ? '6-2' : '1-2';
  game.ow.save = s;
  game.openMap();
}
// a few hours in: some ranks bought, two trophies, a sword well on its way to mastery
function powersScene(game, tab) {
  bankShards(4200); setLock('blades');
  for (const id of ['core', 'sharp', 'sharp', 'sharp', 'sharp', 'sharp', 'band', 'band', 'skin', 'skin', 'tutor', 'magnet', 'magnet', 'learn', 'edge', 'edge', 'swarm', 'brutal', 'brutal', 'fire']) buyRank(id);
  winTrophy(1); winTrophy(2);
  addProficiency('sword', 2200); addProficiency('bow', 300);
  choosePerk('sword', 0, 0); choosePerk('sword', 1, 1); choosePerk('sword', 2, 0); choosePerk('bow', 0, 1);
  mapScene(game, false);
  openPowers(tab === 3 ? 1 : tab);
  powers.tree.sel = tab === 0 ? 'core' : 'brutal'; powers.mast.open = tab === 3; powers.mast.tier = 2; powers.mast.opt = 1;
}
// the save files menu: file 1 a few worlds in, file 2 just started, file 3 empty
function filesScene(game) {
  for (const i of [2, 1, 0]) eraseFile(i);
  useFile(1);
  bankShards(140);
  const s1 = newSave(); clearLevel(s1, '1-1'); s1.at = '1-2'; s1.hero = { lv: 3 }; writeSave(s1);
  useFile(0);
  bankShards(5400); winTrophy(1); winTrophy(2); addProficiency('sword', 2200);
  const s0 = revealAll(newSave(), false); for (const id of Object.keys(s0.cleared)) if (!/^[1-3]-/.test(id) && id !== 'home') delete s0.cleared[id];
  s0.at = '3-C'; s0.hero = { lv: 14 }; writeSave(s0);
  game.showFiles();
}
export function captureScene(game, mode) {
  if(mode==='map' || mode==='mapall') return mapScene(game, mode==='mapall');
  if(/^powers\d$/.test(mode)) return powersScene(game, +mode.slice(6));
  if(mode==='files') return filesScene(game);
  // Keep weapon names, looks and actor layout stable between captures.
  let seed=1234567; Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  if(/^tour\d+$/.test(mode)) return tour(game,+mode.slice(4));
  if(/^secret\d+$/.test(mode)) return secret(game,+mode.slice(6));
  if(/^boss\d+$/.test(mode)) return bossFight(game,+mode.slice(4));
  if(/^lv[\dSFC-]+$/.test(mode) && NODES[mode.slice(2)]) return bossFight(game,NODES[mode.slice(2)].zone+1,NODES[mode.slice(2)]);
  game.snapshot(()=>{
    const z=mode==='late'?9:mode==='canyon'?0:1;
    startZone(z);world.wave=3;world.director={phase:'fight',toSpawn:0,bossStarted:mode==='late'};world.t=12;
    world.enemies=[];
    const room=world.map.rooms[mode==='late'?world.map.rooms.length-1:mode==='depths'?2:mode==='canyon'?0:1];
    const offset=mode==='late'?world.map.width-480:room.x+60;
    world.cameraX=offset;
    // stand everyone on whatever floor is under them: layouts are rarely flat for a whole screen
    const floorAt=(x,near)=>{const ps=world.map.platforms.filter(p=>x>=p.x && x<p.x+p.w);ps.sort((a,b)=>Math.abs(a.y-near)-Math.abs(b.y-near));return ps[0]?.y??near;};
    const floor=floorAt(offset+190,room.floor);
    world.cameraY=Math.max(0,Math.min(world.map.floorY-GROUND,floor-GROUND+12));
    const h=world.hero;h.x=offset+184;h.y=floor-h.h;h.inv=0;h.lv=1+z*3;world.shards=68;
    h.weapon=makeWeapon(z,{type:mode==='late'?'hammer':'katana',q:mode==='late'?10:3,standout:false});
    if(mode==='late') {h.weapon.mutation='cataclysm';startBoss('bossweapon');const b=world.boss;b.x=offset+336;b.y=floor-b.h;b.state='wind';b.pattern='swordrain';b.phase=3;b.hp=b.max*0.3;}
    h.attack={move:MOVES.slashDown,moveName:'slashDown',t:0.16,dur:0.34,hit:new Set(),weapon:h.weapon};
    for(const [type,x] of [['crawler',234],['goose',298],['wizard',388],['shieldbro',72]]){
      const e=spawnEnemy(type,offset+x,floorAt(offset+x,floor),{elite:type==='shieldbro',wave:3});e.spawnT=0;if(type==='crawler'){e.flash=0.1;e.faceUntil=world.t+.4;e.funnyFace=0;e.hp=e.max*0.4;}
    }
    if(mode==='swarm') {
      h.attack=null;h.lust=70;h.newToyT=3;world.director={phase:'fight',t:0,bossStarted:true};
      for(const e of world.enemies) e.dead=true;
      updateWaves(1/60);h.x=world.map.bossLeft+150;h.y=world.map.bossFloor-h.h; // map clear: into the arena
      for(let i=0;i<420;i++){world.t+=1/60;updateWaves(1/60);for(const e of world.enemies) if(!e.dead) updateEnemy(e,1/60);}
      world.director.t=0; // timer out: the zone's swarm boss arrives
      for(let i=0;i<90;i++){world.t+=1/60;h.inv=1;updateWaves(1/60);for(const e of world.enemies) if(!e.dead) updateEnemy(e,1/60);}
      world.swarmCombo.n=37;world.swarmCombo.best=37;world.swarmCombo.t=1.4;
      h.inv=1;
    }
    if(mode==='kills') {
      // MapleStory-style feedback: stacked big numbers, a colour-cycling crit, and residents at each
      // stage of falling over (topple, flip, spin, squash, rise) before they burst into shards
      world.enemies=[];h.attack=null;h.inv=99;h.x=offset+16;
      const row=[['stalker',1,false],['crawler',1,true],['goose',1,false],['bombchicken',1,false],['wraith',1,false],['turtle',0,false],['raccoon',0,true],['monk',0,false]];
      const es=row.map(([type],i)=>{const x=offset+70+i*54,e=spawnEnemy(type,x,ENEMIES[type].air?floor-50:floorAt(x,floor),{wave:3});e.spawnT=0;e.calm=false;e.face=-1;e.hp=e.max=1e6;return e;});
      es.forEach((e,i)=>{const [,dies,crit]=row[i];
        for(const d of dies?[1840]:[1840,crit?9650:2470]) hitEnemy(e,d,{crit:crit&&d>9e3,dir:1});
        if(dies) {hitEnemy(e,e.hp,{crit:i===1,dir:1});e.deathT=DEATH_T-0.12-0.06*i;}
      });
      for(let i=0;i<8;i++){updateFx(1/60);}
      for(const e of world.enemies) if(e.dead) {const n=Math.round((DEATH_T-e.deathT)*60);e.deathT=DEATH_T;for(let k=0;k<n;k++){world.t+=1/60;updateEnemy(e,1/60);}}
    }
    if(mode==='ladder') {
      const l=world.map.ladders[0];h.attack=null;h.ladder=l;h.x=l.x-h.w/2;h.y=Math.round((l.top+l.bottom)/2)-h.h;h.climbT=0.1;h.face=1;
      world.cameraX=Math.max(0,Math.round(l.x-240));world.cameraY=Math.max(0,Math.round(h.y-150));
    }
    if(mode==='results') {
      h.weapon=makeWeapon(9,{type:'hammer',q:9,standout:true});
      const R=world.run;R.t=1514.37;world.kills=812;world.shards=1240;h.lv=31;world.zone=9;
      const prev=[121,140,155,149,170,188,166,190,201,210];
      [130.2,128.9,161.4,140.7,175.1,181.3,170.9,184.2,199.6,215.07].forEach((t,i)=>{R.splits.push({zone:i,t,total:0,prev:prev[i]});});
      [['hammer',9,9,true,92e4],['katana',7,6,false,51e4],['sword',3,3,false,18e4],['bow',5,4,false,9.5e4],['wand',8,7,false,6.1e4],['dagger',0,1,false,8e3],['staff',2,2,false,4e3]]
        .forEach(([type,z,q,standout,d])=>logDamage(d,type==='hammer'?h.weapon:makeWeapon(z,{type,q,standout})));
      for(const [type,kills] of [['hammer',90],['katana',60],['sword',30],['bow',14],['wand',8]]) {R.prof[type]={lv:0,xp:0,kills:0};addProficiency(type,kills,kills);}
      R.prevBest=1530;world.phase='won';
      game.results(true,99);world.run.prevBest=1530;world.run.newBest=true;
    }
    if(/^traits\d$/.test(mode)) {
      // every alerted trick in flight, a row of residents at a time (traits1..traits3)
      const types=Object.keys(ENEMIES).filter(k=>ENEMIES[k].alert),n=+mode.slice(6)-1,row=types.slice(n*9,n*9+9);
      world.enemies=[];h.attack=null;h.x=offset+440;h.y=floor-h.h;h.inv=99;
      row.forEach((type,i)=>{const e=spawnEnemy(type,offset+24+i*44,ENEMIES[type].air?floor-50:floorAt(offset+24+i*44,floor),{wave:3});e.spawnT=0;e.calm=false;e.face=1;e.hoverY=e.y;});
      for(const e of world.enemies) fireTrait(e);
      for(let i=0;i<20;i++){world.t+=1/60;updateBolts(1/60);}
      h.inv=0;
    }
    if(mode==='bag') {
      h.attack=null;h.weapon=makeWeapon(z,{type:'scythe',q:6,standout:true});
      for(const [type,q,standout] of [['sword',0,false],['bow',1,false],['dagger',0,true],['spear',4,false],['axe',2,false],['boomerang',3,true],['hammer',2,false],['staff',1,false],['katana',2,false],['sword',1,false]]) stash(makeWeapon(z,{type,q,standout}));
      world.bag[1].locked=true;openInventory();world.inv.sel=1;
    }
  });
  document.documentElement.dataset.capture='ready';
}

// a zone as the player finds it, a third of the way along its route
function tour(game,n) {
  game.snapshot(()=>{
    const z=Math.max(0,Math.min(9,n-1));
    startZone(z);world.director={phase:'fight',toSpawn:0,bossStarted:false};world.t=12;
    const m=world.map,spot=m.spawns[Math.floor(m.spawns.length*0.35)],h=world.hero;
    h.x=spot.x-30;h.y=spot.y-h.h;h.inv=0;h.lv=1+z*3;h.weapon=makeWeapon(z,{type:'katana',q:3,standout:false});
    for(const e of world.enemies) e.spawnT=0;
    updateCamera(0,true);
  });
  document.documentElement.dataset.capture='ready';
}

// where each map's easter egg hides (secret1..secret10): the hero a few steps away from it
function secret(game,n) {
  game.snapshot(()=>{
    const z=Math.max(0,Math.min(9,n-1));
    startZone(z);world.director={phase:'fight',toSpawn:0,bossStarted:false};world.t=12;
    const s=world.secret,h=world.hero;
    const on=x=>world.map.platforms.some(p=>p.y===s.y+s.h && x>=p.x && x<=p.x+p.w);h.x=on(s.x-36)?s.x-36:s.x+40;h.y=s.y+s.h-h.h;h.inv=0;h.face=Math.sign(s.x-h.x);
    for(const e of world.enemies) e.spawnT=0;
    updateCamera(0,true);
  });
  document.documentElement.dataset.capture='ready';
}

// a zone's boss a moment after it crashed into the swarm, in the middle of its surprise
function bossFight(game,n,node=null) {
  game.snapshot(()=>{
    world.level=node; // an overworld level fights its own boss
    const z=Math.max(0,Math.min(9,n-1)),m=(startZone(z),world.map),h=world.hero;
    world.enemies.length=0;world.director.phase='fight';
    h.lv=1+z*3;h.weapon=makeWeapon(z,{type:ZONES[z].weapon||'sword',q:Math.min(10,z+2),standout:false});
    h.x=m.bossLeft+150;h.y=m.bossFloor-h.h;h.face=1;
    startSurvival();
    const step=()=>{world.t+=1/60;h.inv=1;updateWaves(1/60);updateHazards(1/60);for(const e of world.enemies) if(!e.dead) e.boss?updateBoss(e,1/60):updateEnemy(e,1/60);};
    for(let i=0;i<300;i++) step();
    world.director.t=Math.min(world.director.t,0.01);
    for(let i=0;i<150 && !(world.boss && world.boss.onGround);i++) step();
    const b=world.boss;
    if(b) {b.spawnT=0;b.hp=b.max*0.6;castMove(b,b.D.surprise);}
    for(let i=0;i<48;i++) step();
    h.inv=0;
  });
  document.documentElement.dataset.capture='ready';
}
