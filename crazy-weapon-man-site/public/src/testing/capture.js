// Deterministic visual fixtures for CI screenshots. Opt in with ?capture=combat|bag|swarm|results|ladder|late|kills,
// ?capture=secret1..secret10 for where each map hides its easter egg,
// ?capture=tour1..tour10 for a look at each zone's layout with its residents in place,
// ?capture=walk1..walk10 for the same zone left running (the hero can't be hurt) to film its weather
// and animated props, or
// ?capture=boss1..boss10 for each zone's boss mid-swarm, pulling its surprise, ?capture=lv1-3 (any
// level id) for that overworld level's own boss, or ?capture=powers0..3 for the POWERS window tabs (3: an open constellation).
// The polish pass: ?capture=book (the Monster Book), sheet (the stat sheet), maptemper (relic stars,
// gimmick badges and a TEMPER tier on the map), ghost, scroll, water, ice (the level gimmicks),
// room (a golden secret room) and goose, boar, griffin (riding each mount). stable / stableshut: the
// STABLE tab after the third family head falls, and still shut. ?capture=collection: the unlock tracker; anvil: the map's bag (first POWERS tab) at the Legendary Anvil.
import { world } from '../game/world.js';
import { makeWeapon } from '../game/loot.js';
import { startZone, updateWaves, startSurvival } from '../game/waves.js';
import { updateEnemy, updateBolts } from '../game/enemy.js';
import { fireTrait } from '../game/traits.js';
import { ENEMIES } from '../data/enemies.js';
import { spawnEnemy } from '../game/enemy.js';
import { openInventory, logWeapon } from '../game/inventory.js';
import { startBoss, updateBoss, updateHazards, castMove } from '../game/bosses.js';
import { ZONES } from '../data/zones.js';
import { updateAmbience } from '../game/ambience.js';
import { MOVES } from '../data/weapons.js';
import { logDamage } from '../game/speedrun.js';
import { addProficiency } from '../data/proficiency.js';
import { GROUND, W } from '../config.js';
import { updateCamera } from '../game/camera.js';
import { newSave, revealAll, clearLevel, writeSave, NODES, REGIONS } from '../data/overworld.js';
import { bankShards, buyRank, winTrophy, choosePerk, setLock, chooseMount } from '../data/meta.js';
import { useFile, eraseFile } from '../data/saves.js';
import { openPowers, TAB, P as powers, buy as investNode, pick as pickPerk, updatePowers } from '../game/powers.js';
import { TREE_BY_ID } from '../data/meta.js';
import { hitEnemy, DEATH_T } from '../game/combat.js';
import { updateFx } from '../game/fx.js';
import { recordKill, recordBoss, PAGES } from '../data/book.js';
import { keepRelics } from '../data/relics.js';
import { LEVELS } from '../data/overworld.js';
import { anvil as anvilStrike } from '../game/inventory.js';
import { enterRoom } from '../game/hidden.js';
import { mount } from '../game/mount.js';
import { updateGimmick } from '../game/gimmicks.js';
// ?capture=map: a first visit (two levels down, at the first fork); ?capture=mapall: every road open
function mapScene(game, all) {
  const s = all ? revealAll(newSave()) : newSave();
  if (!all) { clearLevel(s, '1-1'); clearLevel(s, '1-2'); }
  s.at = all ? '6-2' : '1-2';
  s.seen = REGIONS.map(R => R.id); // (no fly-over, unless the scene asks for one)
  game.ow.save = s;
  game.openMap();
}
// ?capture=mapzoom: the world view, every island in sight; ?capture=mapfly: the fly-over of world 3,
// part way along
function mapView(game, fly) {
  mapScene(game, true);
  if (fly) { game.ow.save.at = '3-1'; game.ow.save.seen = [1, 2]; game.openMap(); game.ow.fly.t = 1.2; }
  else { game.ow.zoomOn = true; game.ow.zoom = 1; game.ow.spin = NODES[game.ow.save.at].x / 4032 * 2 * Math.PI; }
}
// a few hours in: some ranks bought, two trophies, a sword well on its way to mastery
function powersScene(game, tab) {
  bankShards(9000); setLock('blades');
  for (const id of ['core', 'sharp', 'sharp', 'sharp', 'band', 'band', 'skin', 'skin', 'tutor', 'magnet', 'magnet', 'learn', 'slice', 'slice', 'slice', 'longb', 'longb', 'longb', 'cleave', 'cleave', 'cleave', 'whirl', 'whirl', 'fleet', 'bounty', 'nova']) buyRank(id);
  winTrophy(1); winTrophy(2);
  addProficiency('sword', 2200); addProficiency('bow', 300); addProficiency('katana', 60000); addProficiency('hammer', 9000); addProficiency('wand', 900);
  choosePerk('sword', 0, 0); choosePerk('sword', 1, 1); choosePerk('sword', 2, 0); choosePerk('bow', 0, 1);
  mapScene(game, false);
  openPowers([TAB.TREE, TAB.MASTERY, TAB.TROPHIES, TAB.MASTERY, TAB.TREE, TAB.MASTERY][tab] ?? TAB.TREE);
  powers.troph = 1; // the trophies tab shows the Yeti King's broadhead
  powers.tree.sel = tab === 0 ? 'whirl' : 'brutal'; powers.mast.open = tab === 3 || tab === 5; powers.mast.tier = 2; powers.mast.opt = 1;
  // 4: shards mid-flight into a node being bought; 5: a mastery perk charging up
  if (tab === 4) { powers.tab = TAB.TREE; powers.tree.sel = 'echo'; investNode(TREE_BY_ID.echo); for (let i = 0; i < 16; i++) updatePowers(1 / 60); }
  if (tab === 5) { powers.tab = TAB.MASTERY; pickPerk('sword', 3, 0); for (let i = 0; i < 40; i++) updatePowers(1 / 60); }
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
// the polish pass scenes
function polishScene(game, mode) {
  if (mode === 'book') {
    for (const [t, n] of [['gosling', 260], ['honker', 95], ['gsquire', 31], ['fencer', 12], ['gtoss', 4], ['whirl', 1], ['ggrave', 22], ['berserker', 81], ['swan', 3]]) recordKill(t, n);
    PAGES[0].kinds.forEach(recordBoss); PAGES[1].kinds.slice(0, 3).forEach(recordBoss);
    mapScene(game, false);
    openPowers(TAB.BOOK);
    powers.book.sel = 1;
    return;
  }
  if (mode === 'stable' || mode === 'stableshut') {
    // the stable after the third family head falls (or still shut with two)
    winTrophy(1); winTrophy(2); if (mode === 'stable') { winTrophy(3); chooseMount('ironboar'); }
    mapScene(game, false);
    openPowers(TAB.STABLE);
    powers.stable = 2;
    return;
  }
  if (mode === 'collection' || mode === 'anvil') {
    // world 1 finished, world 2 half way, a few relics in world 3
    const s = newSave();
    for (const n of LEVELS.filter(n => n.region === 1)) { clearLevel(s, n.id, n.secret.length ? 'secret' : 'next'); keepRelics(s, n.id, 31); }
    for (const id of ['2-1', '2-2', '2-3', '2-4']) clearLevel(s, id), keepRelics(s, id, id === '2-1' ? 31 : 11);
    clearLevel(s, '3-1'); keepRelics(s, '3-1', 5);
    s.at = '3-1';
    try { localStorage.setItem('crazyWeaponMan.secrets.v1', '[0]'); } catch (_) {}
    winTrophy(1); PAGES[0].kinds.forEach(recordBoss);
    for (const [t, n] of [['gosling', 260], ['honker', 95], ['gsquire', 31]]) recordKill(t, n);
    game.ow.save = s; game.openMap();
    openPowers(mode === 'anvil' ? TAB.BAG : TAB.COLL);
    powers.coll = 1;
    if (mode === 'anvil') {
      // the katana in hand struck to +3, asking for its fourth strike
      const w = makeWeapon(1, { type: 'katana', q: 3, standout: false });
      world.hero.weapon = w;
      logWeapon(w); logWeapon(makeWeapon(2, { type: 'bow', q: 2 })); logWeapon(makeWeapon(0, { type: 'hammer', q: 1 }));
      world.inv.sel = world.bag.indexOf(w);
      for (let i = 0; i < 3; i++) { world.inv.anvilAsk = true; anvilStrike(); }
      world.inv.anvilAsk = false; anvilStrike();
    }
    return;
  }
  if (mode === 'maptemper') {
    const s = revealAll(newSave());
    for (const [id, m] of [['1-1', 31], ['1-2', 31], ['1-3', 7], ['1-4', 31], ['1-S', 3], ['2-1', 31]]) keepRelics(s, id, m);
    s.temper = { on: 4, max: 6 }; s.at = '1-4';
    game.ow.save = s; game.openMap();
    game.ow.temperFlash = 2.4;
    return;
  }
  const lv = { ghost: '9-2', scroll: '2-5', water: '3-3', ice: '6-2', room: '1-2', goose: '1-2', boar: '1-2', griffin: '1-2', sheet: '4-2' }[mode];
  game.snapshot(() => {
    game.ow.save = revealAll(newSave());
    game.enterLevel(NODES[lv]);
    const h = world.hero, m = world.map;
    h.lv = 1 + NODES[lv].zone * 3; h.weapon = makeWeapon(NODES[lv].zone, { type: 'katana', q: 4, standout: false }); h.inv = 0;
    world.director.phase = 'fight';
    for (const e of world.enemies) e.spawnT = 0;
    if (mode === 'room') { world.hidden.kind = 'golden'; world.hidden.room.map.title = 'SECRET ROOM'; enterRoom(); }
    else if (mode === 'goose' || mode === 'boar' || mode === 'griffin') { mount(h, { goose: 'wargoose', boar: 'ironboar', griffin: 'griffin' }[mode]); h.x = m.startX + 140; h.vx = 90; }
    else if (mode === 'sheet') { addProficiency('katana', 9000); openInventory(); world.inv.sheet = true; }
    else {
      const sp = m.spawns[Math.floor(m.spawns.length * 0.3)];
      h.x = sp.x - 40; h.y = sp.y - h.h; h.face = 1;
      if (mode === 'ghost') for (const g of world.haunts.slice(0, 3)) (g.x = h.x - 40 - Math.random() * 60), (g.y = h.y - 10);
      for (let i = 0; i < 90; i++) { world.t += 1 / 60; updateGimmick(1 / 60); }
    }
    updateCamera(0, true);
  });
  document.documentElement.dataset.capture = 'ready';
}
export function captureScene(game, mode) {
  if(['book','collection','anvil','maptemper','ghost','scroll','water','ice','room','goose','boar','griffin','stable','stableshut','sheet'].includes(mode)) return polishScene(game, mode);
  if(mode==='map' || mode==='mapall') return mapScene(game, mode==='mapall');
  if(mode==='mapzoom' || mode==='mapfly') return mapView(game, mode==='mapfly');
  if(/^powers\d$/.test(mode)) return powersScene(game, +mode.slice(6));
  if(mode==='files') return filesScene(game);
  if(/^clear/.test(mode)) return clearSheet(game, mode);
  // the level-clear screen as you take the world 8 trophy (her castle is cleared on the next frame)
  if(mode==='trophy') { mapScene(game, true); game.enterLevel(NODES['8-C']); world.phase='cleared'; return; }
  // Keep weapon names, looks and actor layout stable between captures.
  let seed=1234567; Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  if(/^tour\d+$/.test(mode)) return tour(game,+mode.slice(4));
  if(/^walk\d+$/.test(mode)) return walk(game,+mode.slice(4));
  if(/^sprint\d+$/.test(mode)) return sprint(game,+mode.slice(6));
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
      for(const [type,q,standout] of [['sword',0,false],['bow',1,false],['dagger',0,true],['spear',4,false],['axe',2,false],['boomerang',3,true],['hammer',2,false],['staff',1,false],['katana',2,false],['sword',1,false]]) logWeapon(makeWeapon(z,{type,q,standout}));
      logWeapon(h.weapon);openInventory();world.inv.sel=1;
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
    for(let i=0;i<180;i++) updateAmbience(1/60); // let the weather, smoke and critters get going
  });
  document.documentElement.dataset.capture='ready';
}
// a zone left running: the hero can't be hurt, so a recording can follow them along the route
function walk(game,n) {
  game.play(()=>{
    const z=Math.max(0,Math.min(9,n-1));
    startZone(z);world.director={phase:'fight',toSpawn:0,bossStarted:false};
    const m=world.map,spot=m.spawns[Math.floor(m.spawns.length*0.2)],h=world.hero;
    h.x=spot.x-60;h.y=spot.y-h.h;h.inv=1e9;h.lv=1+z*3;h.weapon=makeWeapon(z,{type:'katana',q:3,standout:false});
    updateCamera(0,true);
    for(let i=0;i<180;i++) updateAmbience(1/60);
  });
  document.documentElement.dataset.capture='ready';
}

// ?capture=sprintN&w=type: the zone's longest straightaway cleared of residents, the hero at its
// start with a weapon of that type, left running (for filming the sprint); window.cwmWorld for the recorder
function sprint(game,n) {
  game.play(()=>{
    const z=Math.max(0,Math.min(9,n-1)),type=new URLSearchParams(location.search).get('w')||'katana';
    startZone(z);world.director={phase:'fight',toSpawn:0,bossStarted:false};
    const foes=new URLSearchParams(location.search).has('foes');if(!foes)world.enemies.length=0;
    const g=world.map.platforms.filter(p=>p.ground && p.x>0 && p.x<world.map.bossLeft-W).sort((a,b)=>b.w-a.w)[0],h=world.hero;
    h.x=g.x+8;h.y=g.y-h.h;
    // &at=kind: start a run-up before the first gadget of that kind (springs, ropes, ziplines...)
    // (or wall, bridge, high, sky: a breakable wall, a crumbling bridge, a high road or sky road ledge;
    // slope, downhill, uphill: a ramp; fight: a fight pad; nook: a nook's perch)
    const at=new URLSearchParams(location.search).get('at'),M=world.map,list=at==='fight'?M.platforms.filter(p=>p.fight):at==='nook'?M.platforms.filter(p=>p.nook):at==='wall'?M.walls:at==='bridge'?M.pits.filter(p=>p.bridge):at==='high'?M.platforms.filter(p=>p.tier===1):at==='sky'?M.platforms.filter(p=>p.tier===2):at==='slope'?M.slopes.filter(q=>q.w>=48):at==='downhill'?M.slopes.filter(q=>q.k>0&&q.w>=48):at==='uphill'?M.slopes.filter(q=>q.k<0&&q.w>=48):M.gadgets.filter(o=>o.kind===at),gd=at&&list[+(new URLSearchParams(location.search).get('n')||0)];
    if(gd){const gx=(gd.x??gd.x0)-(+new URLSearchParams(location.search).get('back')||170),p=new URLSearchParams(location.search).has('on')?gd:world.map.platforms.filter(p=>p.ground && gx>=p.x && gx<p.x+p.w)[0];if(p){h.x=p===gd?gd.x+8:gx;h.y=p.y-h.h;}}h.inv=0;h.lv=1+z*3;h.weapon=makeWeapon(z,{type,q:3,standout:false});h.face=1;
    if(foes) {h.god=true;for(const e of world.enemies) e.spawnT=0;}
    updateCamera(0,true);
    window.cwmWorld=world;
  });
  document.documentElement.dataset.capture='ready';
}
// ?capture=clear (a strong run: a high grade) or clearslow (a slow, partial one): the level-clear
// stat sheet for 1-2 animating in, left running so the grade can be filmed
function clearSheet(game, mode) {
  const slow = mode === 'clearslow';
  game.openMap();
  game.enterLevel(NODES['1-2']);
  const R = world.run, m = world.map;
  R.t = slow ? 260 : 118; R.residentKills = Math.round(m.spawns.length * (slow ? 0.55 : 1)); R.top = slow ? 141 : 168; R.sprintT = slow ? 12.4 : 41.7;
  const types = slow ? ['sword', 'bow'] : ['katana', 'hammer', 'bow', 'dagger'];
  types.forEach((type, i) => logDamage((slow ? 900 : 2600) / (i + 1) + 137 * i, makeWeapon(0, { type, q: 2 + i, standout: i === 1 })));
  world.shards = slow ? 96 : 318;
  for (const r of world.relics.slice(0, slow ? 1 : world.relics.length)) r.got = true;
  if (world.secret && !slow) world.secret.found = true;
  world.phase = 'cleared';
  document.documentElement.dataset.capture = 'ready';
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
