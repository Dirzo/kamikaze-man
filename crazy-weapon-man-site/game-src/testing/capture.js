// Deterministic visual fixtures for CI screenshots. Opt in with ?capture=combat|forge|bag|swarm|late.
import { world } from '../game/world.js';
import { makeWeapon } from '../game/loot.js';
import { startZone, updateWaves } from '../game/waves.js';
import { updateEnemy } from '../game/enemy.js';
import { spawnEnemy } from '../game/enemy.js';
import { openForge } from '../game/forge.js';
import { openInventory, stash } from '../game/inventory.js';
import { startBoss } from '../game/bosses.js';
import { MOVES } from '../data/weapons.js';
import { GROUND } from '../config.js';
export function captureScene(game, mode) {
  // Keep weapon names, looks and actor layout stable between captures.
  let seed=1234567; Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  game.snapshot(()=>{
    const z=mode==='late'?9:mode==='forge'?3:mode==='canyon'?0:1;
    startZone(z);world.wave=3;world.director={phase:'fight',toSpawn:0,bossStarted:mode==='late'};world.t=12;
    world.enemies=[];
    const room=world.map.rooms[mode==='late'?world.map.rooms.length-1:mode==='depths'?2:mode==='canyon'||mode==='forge'?0:1];
    const offset=mode==='late'?world.map.width-480:room.x+60;
    world.cameraX=offset;
    const floor=room.floor;
    world.cameraY=Math.max(0,floor-GROUND);
    const h=world.hero;h.x=offset+184;h.y=floor-h.h;h.inv=0;h.lv=1+z*3;world.shards=68;
    h.weapon=makeWeapon(z,{type:mode==='late'?'hammer':'katana',q:mode==='late'?10:3,standout:false});
    if(mode==='late') {h.weapon.mutation='cataclysm';startBoss('bossweapon');const b=world.boss;b.x=offset+336;b.y=floor-b.h;b.state='wind';b.pattern='swordrain';b.phase=3;b.hp=b.max*0.3;}
    h.attack={move:MOVES.slashDown,moveName:'slashDown',t:0.16,dur:0.34,hit:new Set(),weapon:h.weapon};
    for(const [type,x,y] of [['crawler',234,floor],['goose',298,floor],['wizard',388,floor],['shieldbro',72,floor]]){
      const e=spawnEnemy(type,offset+x,y,{elite:type==='shieldbro',wave:3});e.spawnT=0;if(type==='crawler'){e.flash=0.1;e.faceUntil=world.t+.4;e.funnyFace=0;e.hp=e.max*0.4;}
    }
    if(mode==='forge') {openForge();world.forge.t=1;}
    if(mode==='swarm') {
      h.attack=null;h.lust=70;h.newToyT=3;world.director={phase:'fight',t:0,bossStarted:true};
      for(const e of world.enemies) e.dead=true;
      for(let i=0;i<420;i++){world.t+=1/60;updateWaves(1/60);for(const e of world.enemies) if(!e.dead) updateEnemy(e,1/60);}
      world.director.t=0; // timer out: the zone's swarm boss arrives
      for(let i=0;i<90;i++){world.t+=1/60;h.inv=1;updateWaves(1/60);for(const e of world.enemies) if(!e.dead) updateEnemy(e,1/60);}
      world.swarmCombo.n=37;world.swarmCombo.best=37;world.swarmCombo.t=1.4;
      h.inv=1;
    }
    if(mode==='bag') {
      h.attack=null;
      for(const [type,q,standout] of [['sword',0,false],['bow',1,false],['dagger',0,true],['hammer',2,false],['staff',1,false],['katana',2,false],['sword',1,false]]) stash(makeWeapon(z,{type,q,standout}));
      world.bag[1].locked=true;openInventory();world.inv.sel=1;
    }
  });
  document.documentElement.dataset.capture='ready';
}
