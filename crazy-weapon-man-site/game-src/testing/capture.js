// Deterministic visual fixtures for CI screenshots. Opt in with ?capture=combat|forge|late.
import { world } from '../game/world.js';
import { makeWeapon } from '../game/loot.js';
import { startZone } from '../game/waves.js';
import { spawnEnemy } from '../game/enemy.js';
import { openForge } from '../game/forge.js';
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
    const offset=mode==='late'?world.map.width-480:mode==='forge'?0:480;
    world.cameraX=offset;
    const floor=mode==='late'?world.map.floorY:mode==='canyon'?GROUND:mode==='depths'?494:350;
    world.cameraY=Math.max(0,floor-GROUND);
    const h=world.hero;h.x=offset+184;h.y=floor-h.h;h.inv=0;h.lv=1+z*3;world.shards=68;
    h.weapon=makeWeapon(z,{type:mode==='late'?'hammer':'katana',q:mode==='late'?10:3,standout:false});
    if(mode==='late') {h.weapon.mutation='cataclysm';startBoss('bossweapon');const b=world.boss;b.x=offset+336;b.y=floor-b.h;b.state='wind';b.pattern='swordrain';b.phase=3;b.hp=b.max*0.3;}
    h.attack={move:MOVES.slashDown,moveName:'slashDown',t:0.16,dur:0.34,hit:new Set(),weapon:h.weapon};
    for(const [type,x,y] of [['crawler',234,floor],['goose',298,floor],['wizard',388,floor],['shieldbro',72,floor]]){
      const e=spawnEnemy(type,offset+x,y,{elite:type==='shieldbro',wave:3});e.spawnT=0;if(type==='crawler'){e.flash=0.1;e.hp=e.max*0.4;}
    }
    if(mode==='forge') {openForge();world.forge.t=1;}
  });
  document.documentElement.dataset.capture='ready';
}
