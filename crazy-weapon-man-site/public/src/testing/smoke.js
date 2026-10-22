// Real browser regression tests. Opt in with ?smoke; never loaded in a normal run.
import { input } from '../engine/input.js';
import { world, resetWorld } from '../game/world.js';
import { createHero, updateHero } from '../game/hero.js';
import { spawnEnemy, updateEnemy, drawEnemy } from '../game/enemy.js';
import { secretRoom } from '../data/maps.js';
import { hitEnemy, hurtHero, dropWeapon } from '../game/combat.js';
import { makeWeapon, dps, powerScore } from '../game/loot.js';
import { updateDrops } from '../game/drops.js';
import { updateEvolution, attackMutation, impactMutation } from '../game/evolution.js';
import { startBoss, updateBoss, updateHazards, drawHazards, bossDone, clearBoss, castMove, MOVES } from '../game/bosses.js';
import { updateCamera } from '../game/camera.js';
import { worldLayer, screenLayer, X } from '../engine/gfx.js';
import { startZone, updateWaves, enemiesLeft } from '../game/waves.js';
import { openInventory, updateInventory, stash, autoLoot, BAG_SIZE, equipFromBag } from '../game/inventory.js';
import { BOSS_OF, HEAD_KINDS, SIBLING_KINDS, SIBLING_DEFS, headOfZone } from '../data/families.js';
import { LEVELS } from '../data/overworld.js';
import { bossName } from '../game/bosses.js';
import { A } from '../engine/assets.js';
import { quirkHit } from '../game/quirks.js';
import { QUIRK_LIST } from '../data/quirks.js';
import { proficiency, PROF_KEY } from '../data/proficiency.js';
import { ZONES } from '../data/zones.js';
import { MUTATIONS } from '../data/progression.js';
import { C, STEP, GROUND, HERO, W } from '../config.js';
const FLOOR = () => world.map?.startY ?? GROUND; // the stage's runway (stages are no longer all at GROUND)
import { lookOf } from '../game/looks.js';
import { feel, clearFx } from '../game/fx.js';
import { cx } from '../game/physics.js';
import { heroPose } from '../game/anim.js';
import { tickRun, splitZone } from '../game/speedrun.js';
import { resetRecords } from '../data/speedrun.js';
import { addProficiency } from '../data/proficiency.js';
import { ENEMIES } from '../data/enemies.js';
import { attackBox } from '../game/attack-rules.js';
import { resetMeta, bankShards, buyRank, setLock, winTrophy, chooseMount, CLASSES } from '../data/meta.js';
import { keepInClass, applyLock } from '../game/classlock.js';
import { TYPES, TYPE_LIST } from '../data/weapons.js';
import { ABILITY_LIST } from '../data/abilities.js';
import { fireTrait } from '../game/traits.js';
import { updateBolts } from '../game/enemy.js';
import { updateSecret, SECRETS, SECRET_KEY } from '../game/secrets.js';
import { updateAbilities, abilityHit } from '../game/abilities.js';
import { NODES, OVERWORLD_KEY, isOpen } from '../data/overworld.js';
import { updateHidden } from '../game/hidden.js';
import { updateRelics } from '../game/relics.js';
import { mount, updateMount, flap } from '../game/mount.js';
import { heroPhysics, updateGimmick } from '../game/gimmicks.js';
import { setLootFilter, lootFilter } from '../game/inventory.js';
import { cardKills, resetBook } from '../data/book.js';
import { RELIC_COUNT } from '../data/relics.js';

export function runSmoke(game) {
  const results=[];
  const check=(label,fn)=>{ try { fn(); results.push('PASS '+label); } catch(e) { results.push('FAIL '+label+': '+e.message); console.error(label,e); } };
  const ok=(v,msg='assertion')=>{if(!v)throw Error(msg);};
  let clock=0;
  const key=(code,on)=>window.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));
  const poll=()=>input.poll(clock+=STEP);
  const reset=()=>{key('ArrowUp',false);key('ArrowDown',false);key('KeyZ',false);key('ArrowRight',false);key('ArrowLeft',false);key('KeyX',false);key('KeyV',false);poll();game.startRun();world.enemies=[];world.director=null;world.hero.inv=0;clearFx();};
  check('two thumbs move and attack independently, with safe cancellation',()=>{
    reset();const touchPanel=document.getElementById('touch'),oldDisplay=touchPanel.style.display;touchPanel.style.display='block';const stick=document.getElementById('joystick'),hit=document.querySelector('[data-action="attack"]');
    const send=(el,type,id,x=0,y=0)=>el.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType:'touch',clientX:x,clientY:y,bubbles:true,cancelable:true}));
    const b=stick.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height/2;
    send(stick,'pointerdown',101,x+50,y);send(hit,'pointerdown',102);poll();
    ok(input.held('right') && input.held('attack'),'two-thumb input dropped');
    send(stick,'pointermove',101,x-100,y);poll();ok(input.held('left') && !input.held('right') && input.held('attack'));
    send(stick,'pointercancel',101);poll();ok(!input.held('left') && input.held('attack'),'stick cancelled attack');
    send(hit,'lostpointercapture',102);poll();ok(!input.held('attack'),'attack stuck after lost capture');
    send(stick,'pointerdown',103,x,y-40);poll();ok(input.held('up'),'ladder direction missing');
    window.dispatchEvent(new Event('blur'));poll();ok(!input.held('up') && !input.held('attack'),'blur left input stuck');touchPanel.style.display=oldDisplay;
  });
  if(new URLSearchParams(location.search).has('mobile')) check('landscape touch layout fits the viewport with clear thumb gutters',()=>{
    const canvas=document.getElementById('screen').getBoundingClientRect(),stick=document.getElementById('joystick').getBoundingClientRect(),actions=document.getElementById('touch-actions').getBoundingClientRect();
    ok(matchMedia('(any-pointer:coarse)').matches,'touch device was not emulated');
    ok(canvas.left>=stick.right && canvas.right<=actions.left,'controls cover the playfield');
    ok(canvas.top>=0 && canvas.bottom<=innerHeight && actions.bottom<=innerHeight,'mobile layout clipped');
    ok(canvas.width>300 && canvas.height>170,'landscape canvas is too small');
  });
  check('all nine weapons render with awakened silhouettes',()=>{
    for(const type of Object.keys(game.types)) {const w=makeWeapon(9,{type,q:8});w.mutation='orbit';ok(lookOf(w).cv.width>0);}
  });
  check('held attack finishes and chains, without replacing a live attack',()=>{
    reset(); const h=world.hero;key('KeyZ',true);poll();updateHero(h,STEP);const first=h.attack;let swings=1;
    updateHero(h,STEP);ok(h.attack===first,'attack overwritten');
    let last=first;for(let i=0;i<150;i++){poll();updateHero(h,STEP);if(h.attack && h.attack!==last){swings++;last=h.attack;}}
    ok(swings>=5,'held attack stopped');key('ArrowUp',false);key('ArrowDown',false);key('KeyZ',false);poll();
  });
  check('a melee swing slows you down and locks your facing without cancelling (feel #7)',()=>{
    reset();const h=world.hero;h.weapon=makeWeapon(0,{type:'hammer',q:0,standout:false});
    h.vx=HERO.speed;key('ArrowRight',true);key('KeyZ',true);poll();updateHero(h,STEP);
    const attack=h.attack,x=h.x;key('ArrowUp',false);key('ArrowDown',false);key('KeyZ',false);poll();updateHero(h,STEP);
    ok(h.attack===attack && h.vx<HERO.speed && h.vx>0 && h.x>x,'swing should slow, not stop, movement');
    key('ArrowRight',false);key('ArrowLeft',true);poll();updateHero(h,STEP);
    ok(h.face===1 && h.attack===attack,'facing should stay locked for the swing');
    for(let i=0;i<8;i++){poll();updateHero(h,STEP);}
    ok(h.vx<0 && h.attack===attack,'you can still back off mid-swing');
    key('ArrowLeft',false);poll();
  });
  check('one swing hits each enemy once, never during wind-up',()=>{
    reset();const h=world.hero,e=spawnEnemy('crawler',h.x+23,FLOOR());e.spawnT=0;e.hp=e.max=10000;
    key('KeyZ',true);poll();updateHero(h,STEP);key('ArrowUp',false);key('ArrowDown',false);key('KeyZ',false);poll();
    const hp=e.hp;ok(hp===10000,'damage before contact frame');
    for(let i=0;i<23;i++){poll();updateHero(h,STEP);} const after=e.hp;ok(after<hp,'swing missed');
    for(let i=0;i<8;i++){poll();updateHero(h,STEP);} ok(e.hp===after,'swing multi-hit');
  });
  check('dash is immune to every hurt source; normal hurt cancels swing',()=>{
    reset();const h=world.hero;h.dashT=0.1;const hp=h.hp;hurtHero(30);ok(h.hp===hp);
    h.dashT=0;h.inv=0;h.attack={};hurtHero(10);ok(h.hp===hp-10 && !h.attack);
  });
  check('DOWN-equipping a looted upgrade never replaces an attack in progress',()=>{
    reset();const h=world.hero,old=h.weapon,w=makeWeapon(5,{q:6,type:'sword'});stash(w);world.quick={item:w,t:4};
    h.attack={};key('ArrowDown',true);poll();updateDrops(STEP);ok(h.weapon===old);
    h.attack=null;updateDrops(STEP);key('ArrowDown',false);poll();ok(h.weapon===w);
  });
  check('all five mutations deal damage and terminate their pending effects',()=>{
    for(const mutation of Object.keys(MUTATIONS)) {
      reset();const h=world.hero;h.weapon=makeWeapon(9,{q:9,type:'sword'});h.weapon.mutation=mutation;
      const e=spawnEnemy('brute',h.x+26,FLOOR());e.spawnT=0;e.hp=e.max=100000;
      if(mutation==='seeker') { const n=spawnEnemy('crawler',h.x+65,FLOOR());n.spawnT=0;n.hp=n.max=100000; }
      if(mutation==='cataclysm'){h.attackCount=2;attackMutation(h);}else impactMutation(h,e,{weapon:h.weapon,move:{big:true}});
      for(let i=0;i<90;i++){world.t+=STEP;updateEvolution(STEP);game.updateShots(STEP);}
      ok(world.enemies.some(n=>n.hp<n.max),mutation+' did no damage');ok(world.echoes.length===0,'pending effect leaked');
    }
  });
  check('every boss of every family executes patterns, phase changes and defeat',()=>{
    for(const kind of [...HEAD_KINDS,...SIBLING_KINDS]) {
      const z=SIBLING_DEFS[kind]?SIBLING_DEFS[kind].family-1:HEAD_KINDS.indexOf(kind);
      reset();startZone(z);world.hero.x=world.map.bossLeft+40;world.hero.y=world.map.bossFloor-world.hero.h;world.hero.inv=1e9;startBoss(kind,0.5);const e=world.boss;
      for(let i=0;i<600;i++){world.t+=STEP;updateBoss(e,STEP);updateHazards(STEP);world.hero.inv=1e9;}
      ok(e.pattern,kind+' has no attack pattern');ok(Number.isFinite(e.x)&&Number.isFinite(e.y),'bad boss position');
      e.hp=e.max*0.25;updateBoss(e,STEP);ok(e.phase===e.phases,kind+' phase did not advance');
      e.hp=0;updateBoss(e,STEP);ok(e.dead);for(let i=0;i<150;i++)updateBoss(e,STEP);ok(bossDone(),'boss clear stalled');
    }
  });
  check('every themed boss move and surprise telegraphs, plays out and cleans up',()=>{
    reset();startZone(9);const h=world.hero;h.x=world.map.bossLeft+40;h.y=world.map.bossFloor-h.h;h.inv=1e9;startBoss('bossweapon');const e=world.boss;
    for(const name of MOVES) {
      const hp0=h.hp;castMove(e,name);
      for(let i=0;i<600;i++){world.t+=STEP;updateHazards(STEP);if(i%60===0)drawHazards(i*STEP);h.inv=1e9;}
      ok(Number.isFinite(e.x) && h.hp===hp0,'move '+name+' broke');
      world.bolts.length=0;
    }
    // with no i-frames, the slash hits a standing hero and a jump clears it
    h.inv=0;h.hp=h.maxHp;castMove(e,'iai');for(let i=0;i<70;i++){world.t+=STEP;updateHazards(STEP);}
    ok(h.hp<h.maxHp,'the iai slash missed a standing hero');
  });
  check('a new run starts clean',()=>{
    reset();game.startRun();ok(world.echoes.length===0 && !world.deadT && world.zone===0);
  });
  check('drops hover, fly to you and auto-loot; DOWN equips a looted upgrade and feeds Weapon Lust',()=>{
    reset();const h=world.hero;h.weapon=makeWeapon(0,{type:'sword',q:0,standout:false});const old=h.weapon;
    const better=makeWeapon(1,{type:'dagger',q:1,standout:true});dropWeapon(h.x+90,h.y,better);const d=world.drops.at(-1),y0=d.y;
    let low=-1e9;for(let i=0;i<20;i++){updateDrops(STEP);low=Math.max(low,d.y);}
    ok(low<=y0+4,'drop sank below where it spawned');
    for(let i=0;i<180 && world.drops.includes(d);i++)updateDrops(STEP);
    ok(!world.drops.includes(d) && world.bag.includes(better) && h.weapon===old,'drop was not auto-looted into the bag');
    ok(world.quick && world.quick.item===better,'a better loot was not offered on DOWN');
    const dmg0=game.hitDamage(better);key('ArrowDown',true);poll();updateDrops(STEP);key('ArrowDown',false);poll();
    ok(h.weapon===better && world.bag.includes(old) && !world.bag.includes(better),'DOWN did not equip the looted weapon');
    ok(h.lust>0 && h.newToyT>0 && game.hitDamage(better)>dmg0,'no Weapon Lust bonus for a new weapon');
  });
  check('the bag keeps every drop until it is full, then swaps out the weakest unlocked weapon',()=>{
    reset();const h=world.hero;
    const a=makeWeapon(0,{type:'bow',q:0,standout:false}),b=makeWeapon(3,{type:'bow',q:4,standout:false}),c=makeWeapon(6,{type:'bow',q:8,standout:false});
    ok(dps(a)<dps(b) && dps(b)<dps(c),'test weapons out of order');
    autoLoot(b);autoLoot(a);ok(world.bag.includes(a) && world.bag.includes(b),'a weaker bow was salvaged before the bag was full');
    while(world.bag.includes(null)) autoLoot(makeWeapon(0,{type:'dagger',q:0,standout:false}));
    ok(world.bag.filter(Boolean).length===BAG_SIZE,'bag did not fill');
    a.locked=true;let sh=world.shards;
    ok(autoLoot(c)==='upgraded' && world.bag.includes(c) && world.bag.includes(a) && !world.bag.includes(b) && world.shards>sh,'full bag did not swap the weakest unlocked bow');
    const weakBow=makeWeapon(0,{type:'bow',q:0,standout:false});
    if(dps(weakBow)<dps(c)) {sh=world.shards;ok(autoLoot(weakBow)==='salvaged' && world.shards>sh && world.bag.includes(a) && world.bag.includes(c),'weaker loot into a full bag was not salvaged');}
    const big=makeWeapon(9,{type:'hammer',q:10,standout:true});ok(autoLoot(big)==='upgraded' && world.bag.includes(big),'a new type did not replace the weakest weapon in a full bag');
    ok(world.bag.filter(Boolean).length===BAG_SIZE,'full bag overfilled on loot');
    world.bag[world.bag.findIndex(w=>w&&w.type==='dagger')]=null;const d=makeWeapon(6,{type:'bow',q:9,standout:true});autoLoot(d);
    ok(openInventory() && world.inv,'bag did not open');world.inv.t=1;world.inv.sel=world.bag.indexOf(d);
    key('KeyX',true);poll();updateInventory(STEP);key('KeyX',false);poll();ok(d.locked,'X did not lock');
    sh=world.shards;key('KeyC',true);poll();updateInventory(STEP);key('KeyC',false);poll();key('KeyC',true);poll();updateInventory(STEP);key('KeyC',false);poll();
    ok(world.bag.includes(d) && world.shards===sh,'locked weapon was salvaged');
    key('KeyX',true);poll();updateInventory(STEP);key('KeyX',false);poll();ok(!d.locked,'X did not unlock');
    key('KeyZ',true);poll();updateInventory(STEP);key('KeyZ',false);poll();ok(h.weapon===d && !world.bag.includes(d),'equip from bag failed');
    world.inv.sel=world.bag.indexOf(c);sh=world.shards;
    key('KeyC',true);poll();updateInventory(STEP);key('KeyC',false);poll();ok(world.bag.includes(c),'salvage did not ask to confirm');
    key('KeyC',true);poll();updateInventory(STEP);key('KeyC',false);poll();ok(!world.bag.includes(c) && world.shards>sh,'salvage failed');
    key('KeyE',true);poll();updateInventory(STEP);key('KeyE',false);poll();ok(!world.inv,'E did not close the bag');
    game.startRun();ok(world.bag.every(x=>!x) && !world.inv,'new run kept the old bag');
  });
  check('speedrun clock, splits, per-weapon damage, mastery and an animated results screen',()=>{
    resetRecords();reset();const h=world.hero,R=world.run;ok(R && R.t===0 && R.weapons.size===0,'no fresh run record');
    tickRun(1.5);ok(Math.abs(R.t-1.5)<1e-9,'clock did not run');
    const e=spawnEnemy('brute',h.x+30,FLOOR());e.spawnT=0;e.hp=e.max=1e6;
    const w1=h.weapon;hitEnemy(e,100,{dir:1});const w2=makeWeapon(1,{type:'bow',q:2});h.weapon=w2;hitEnemy(e,40,{dir:1});hitEnemy(e,40,{dir:1});
    ok(R.weapons.get(w1).dmg===100 && R.weapons.get(w2).dmg===80 && R.dealt===180,'damage was not credited per weapon');
    e.hp=5;hitEnemy(e,500,{dir:1});ok(R.weapons.get(w2).dmg===85,'overkill counted as damage dealt');
    world.zone=0;splitZone();ok(R.splits.length===1 && Math.abs(R.splits[0].t-1.5)<1e-9 && R.splits[0].prev==null,'first split wrong');
    ok(world.toasts.some(t=>t.kind==='split'),'no split toast');
    tickRun(2);world.zone=1;splitZone();ok(Math.abs(R.splits[1].t-2)<1e-9,'second split did not start at the portal');
    reset();world.run.t=1;world.zone=0;splitZone();ok(world.run.splits[0].prev===1.5 && world.run.splits[0].t<1.5,'best split not remembered');
    addProficiency('bow',3,3);world.run.t=42;
    game.results(true,0);ok(game.scene==='won' && world.run.ended && world.run.newBest,'win did not record a best');
    const t0=world.run.t;tickRun(5);ok(world.run.t===t0,'clock kept running after the run ended');
    for(const T of [0,0.6,1.3,2,2.8,4]) {game.results(true,T);game.render();}
    game.results(true,1);
    key('KeyZ',true);poll();game.update(STEP);key('KeyZ',false);poll();ok(game.scene==='won' && game.sceneT()>=3.6,'first press did not skip the animation');
    key('KeyZ',true);poll();game.update(STEP);key('KeyZ',false);poll();ok(game.scene==='play' && world.run.t===0,'second press did not start a new run');
    reset();game.results(false,4);game.render();ok(game.scene==='over','death results did not show');
    resetRecords();game.startRun();
  });
  check('overworld: walk the map, clear a level to open the fork, fail one and keep everything',()=>{
    localStorage.removeItem(OVERWORLD_KEY);game.ow.save=null;game.openMap();
    ok(game.scene==='map' && game.ow.save.at==='home','map did not open at the crash site');
    key('ArrowRight',true);for(let i=0;i<120 && game.ow.save.at!=='1-1';i++){poll();game.update(STEP);}key('ArrowRight',false);
    ok(game.ow.save.at==='1-1','could not walk to 1-1');
    for(let i=0;i<5;i++){poll();game.update(STEP);}
    key('KeyX',true);poll();game.update(STEP);key('KeyX',false);
    ok(game.scene==='play' && world.level?.id==='1-1' && world.zone===0 && world.hero.hp===world.hero.maxHp,'1-1 did not start');
    const h=world.hero;h.lv=3;world.enemies.length=0;world.director.phase='exit';world.director.t=0;
    h.x=world.map.exitX-h.w/2;h.y=world.map.exitY-h.h;game.update(STEP);
    ok(game.scene==='levelEnd' && world.levelEnd.result==='clear','clearing 1-1 did not end the level');
    for(let i=0;i<260 && game.scene!=='map';i++){poll();game.update(STEP);}
    const save=JSON.parse(localStorage.getItem(OVERWORLD_KEY));
    ok(game.scene==='map' && save.cleared['1-1'] && save.hero.lv===3 && isOpen(game.ow.save,'1-2'),'clear was not saved');
    game.enterLevel(NODES['1-2']);ok(world.hero.lv===3,'saved hero not restored');
    world.hero.lv=50;world.hero.dead=true;world.phase='dead';
    for(let i=0;i<120 && game.scene==='play';i++)game.update(STEP);
    ok(game.scene==='levelEnd' && world.levelEnd.result==='fail','death did not fail the level');
    const after=JSON.parse(localStorage.getItem(OVERWORLD_KEY));
    ok(after.hero.lv===3 && !after.cleared['1-2'] && after.cleared['1-1'],'failing changed the save');
    localStorage.removeItem(OVERWORLD_KEY);game.ow.save=null;world.level=null;
  });
  check('every level has its own boss with its own art, and family heads tower over their siblings',()=>{
    const kinds=new Set(),names=new Set();
    for(const n of LEVELS) {
      const kind=BOSS_OF[n.id],art=A.bosses[kind];
      ok(kind && art && art.im.width===art.w*3,'no boss art for '+n.id);kinds.add(kind);names.add(bossName(kind));
      if(n.kind!=='castle') {const head=A.bosses[headOfZone(n.zone)];ok(art.h<head.h*0.9 && art.w<head.w*0.9,n.id+' sibling is as big as its head');}
    }
    ok(kinds.size===LEVELS.length && names.size===LEVELS.length,'bosses repeat across levels');
  });
  check('residents never walk off their platform on their own',()=>{
    let tested=0;
    for(const z of [0,3,6]) {
      reset();startZone(z);for(const e of world.enemies)e.dead=true;world.enemies.length=0;
      const p=world.platforms.find(p=>!p.solid && p.w>=40 && p.y<world.map.floorY-30);
      if(!p) continue;tested++;
      for(const type of ['stalker','roller','goose','wizard']) {
        const e=spawnEnemy(type,p.x+p.w/2,p.y);e.spawnT=0;e.cool=0;
        const h=world.hero;h.x=p.x+p.w+40;h.y=p.y+40-h.h;h.inv=100;
        for(let i=0;i<300;i++){world.t+=STEP;updateEnemy(e,STEP);}
        ok(e.onGround && e.platform===p && cx(e)>=p.x && cx(e)<=p.x+p.w,`${type} left its platform in zone ${z+1}`);
        world.enemies.length=0;
      }
    }
    ok(tested>0,'no one-way platform to test');
  });
  check('every enemy type has its own alerted trick that flies, can hurt and cleans up',()=>{
    const types=Object.keys(ENEMIES).filter(k=>ENEMIES[k].alert);ok(types.length>=25,'only '+types.length+' tricks');
    ok(new Set(types.map(k=>ENEMIES[k].alert.do)).size===types.length,'two enemy types share a trick');
    for(const type of types) {
      reset();const h=world.hero;h.inv=99;const e=spawnEnemy(type,h.x-60,FLOOR());e.spawnT=0;e.calm=false;e.face=1;
      const before=world.bolts.length;fireTrait(e);ok(world.bolts.length>before,type+' trick made nothing');
      for(let i=0;i<400;i++){world.t+=STEP;updateBolts(STEP);}
      ok(world.bolts.length===0,type+' trick never cleaned up');
    }
    // calm residents keep wandering: no tricks until they notice you
    reset();const h=world.hero;const e=spawnEnemy('squirrel',h.x+400,FLOOR());e.spawnT=0;
    for(let i=0;i<600;i++){world.t+=STEP;updateEnemy(e,STEP);updateBolts(STEP);}
    ok(e.calm && world.bolts.length===0,'a calm resident used its trick');
  });
  check('the four new weapon types swing, shoot and use their specials',()=>{
    for(const type of ['spear','axe','scythe','boomerang']) {
      ok(TYPE_LIST.includes(type),type+' missing');
      reset();const h=world.hero;h.weapon=makeWeapon(5,{type,q:3});const e=spawnEnemy('brute',h.x+24,FLOOR());e.spawnT=0;e.hp=e.max=1e7;
      for(let i=0;i<60;i++){key('KeyZ',i%10<5);poll();world.t+=STEP;updateHero(h,STEP);game.updateShots(STEP);}
      key('KeyZ',false);poll();h.specialCd=0;h.attack=null;h.cd=0;
      key('KeyC',true);poll();for(let i=0;i<60;i++){world.t+=STEP;updateHero(h,STEP);game.updateShots(STEP);poll();}key('KeyC',false);poll();
      ok(e.hp<e.max,type+' never hit');ok(!h.special,type+' special never ended');heroPose(h,world.t);
    }
  });
  check('shard tree area augments: splash, finisher shockwave and kill nova reach the neighbours',()=>{
    const fresh=(type,ids,lock)=>{resetMeta();bankShards(1e7);if(lock)setLock(lock);for(const id of ids)buyRank(id);reset();const h=world.hero;h.weapon=makeWeapon(3,{type,q:3});
      const es=[0,18,40].map(dx=>{const e=spawnEnemy('brute',h.x+30+dx,FLOOR());e.spawnT=0;e.hp=e.max=1e6;return e;});return [h,es];};
    let [h,es]=fresh('sword',['core','skin','skin','skin','ripple']);hitEnemy(es[0],1000,{dir:1});
    ok(es[1].hp<es[1].max && es[1].hp>es[1].max-1000*0.1,'ripple did not splash a little onto the neighbour');
    [h,es]=fresh('hammer',['core','skin','skin','skin','heft','heft','heft','heavy','heavy','heavy','crush','crush','crush','shock'],'blunt');world.lastWave=-9;hitEnemy(es[0],1000,{dir:1});
    ok(es[1].hp===es[1].max,'a shockwave without a finisher');hitEnemy(es[0],1000,{dir:1,big:true});ok(es[1].hp<es[1].max,'the finisher sent no shockwave');
    [h,es]=fresh('bow',['core','learn','learn','learn','fast','fast','fast','quick','quick','quick','scatter'],'ranged');es[0].hp=5;hitEnemy(es[0],100,{dir:1});
    ok(es[0].dead && es[1].hp<es[1].max,'the kill did not scatter onto the next foe');
    [h,es]=fresh('sword',['core','learn','learn','learn','fast','fast','fast','quick','quick','quick','scatter'],'ranged');es[0].hp=5;hitEnemy(es[0],100,{dir:1});
    ok(es[1].hp===es[1].max,'a ranged augment worked with a sword');
    resetMeta();
  });
  check('shard tree feel upgrades: reach grows the weapon, echoes strike twice, shots fly faster and pierce',()=>{
    const T=game.types.sword,mv={big:false,from:0,to:90},h0={x:100,y:80,w:11,face:1};
    ok(attackBox(h0,T,mv,0.3).w>attackBox(h0,T,mv,0).w*1.25,'reach did not grow the swing');
    resetMeta();bankShards(1e7);setLock('blades');for(const id of ['core','sharp','sharp','sharp','slice','slice','slice','longb','longb','longb','cleave','cleave','cleave','whirl','whirl','whirl','echo','echo','echo','echo','echo'])buyRank(id);
    reset();let h=world.hero;h.weapon=makeWeapon(3,{type:'sword',q:3});let e=spawnEnemy('brute',h.x+30,FLOOR());e.spawnT=0;e.hp=e.max=1e7;
    let twice=0;for(let i=0;i<60;i++){const hp=e.hp;hitEnemy(e,100,{dir:1});if(hp-e.hp>100)twice++;}
    ok(twice>3,'no echo slashes ('+twice+'/60)');
    resetMeta();bankShards(1e7);setLock('ranged');for(const id of ['core','learn','learn','learn','fast','fast','fast','quick','quick','quick','scatter','scatter','scatter','pierce','pierce'])buyRank(id);
    reset();h=world.hero;h.weapon=makeWeapon(3,{type:'bow',q:3});world.shots.length=0;h.cd=0;key('KeyZ',true);poll();for(let i=0;i<40&&!world.shots.length;i++){world.t+=STEP;updateHero(h,STEP);poll();}key('KeyZ',false);poll();
    const s=world.shots[0];ok(s && Math.abs(s.vx)>game.types.bow.speed*1.25 && s.pierce>=game.types.bow.pierce+2,'shots did not speed up or pierce');
    resetMeta();
  });
  check('every weapon ability does its thing',()=>{
    const fresh=ab=>{reset();const h=world.hero;h.weapon=makeWeapon(3,{type:'sword',q:3});h.weapon.ability=ab;const e=spawnEnemy('brute',h.x+20,FLOOR());e.spawnT=0;e.hp=e.max=1e7;return [h,e];};
    let [h,e]=fresh('vampire');h.hp=10;abilityHit(h,e,5,false);ok(h.hp>10,'thirsty did not heal');
    [h,e]=fresh('meteor');abilityHit(h,e,5,true);for(let i=0;i<120;i++){world.t+=STEP;updateAbilities(STEP);}ok(e.hp<e.max,'no meteor landed');
    [h,e]=fresh('bubble');let hp=h.hp;hurtHero(10,1);ok(h.hp===hp,'bubble did not block');h.inv=0;hurtHero(10,1);ok(h.hp<hp,'bubble blocked twice');
    [h,e]=fresh('thorns');h.x=e.x-4;hurtHero(5,1);ok(e.hp<e.max,'thorns did not bite back');
    [h,e]=fresh('frenzy');e.hp=1;hitEnemy(e,5,{dir:1});ok(h.frenzyT>0,'no frenzy on kill');
    [h,e]=fresh('giantslayer');e.elite=true;const d1=hitEnemy(e,100,{dir:1});h.weapon.ability=null;const d2=hitEnemy(e,100,{dir:1});ok(d1>d2,'giant slayer did nothing');
    [h,e]=fresh('hops');h.y-=60;h.onGround=false;h.coyote=0;h.vy=50;key('KeyX',true);poll();updateHero(h,STEP);key('KeyX',false);poll();ok(h.vy<0 && h.hopped,'no double jump');
    [h,e]=fresh('dashcut');h.x=e.x-30;h.face=1;key('KeyV',true);poll();for(let i=0;i<15;i++){world.t+=STEP;updateHero(h,STEP);poll();}key('KeyV',false);poll();ok(e.hp<e.max,'dash cut missed');
    ok(ABILITY_LIST.length===9);
  });
  check('every map hides one easter egg on an existing ledge, found by touching it',()=>{
    try{localStorage.removeItem(SECRET_KEY);}catch(_){}
    for(let z=0;z<10;z++) {
      reset();startZone(z);const s=world.secret,m=world.map;ok(s && s.zone===z,'no secret on map '+(z+1));
      ok(m.platforms.some(p=>p.y===s.y+s.h && s.x+s.w/2>=p.x && s.x+s.w/2<=p.x+p.w),'secret '+(z+1)+' floats');
      ok(s.x<m.bossLeft-20,'secret '+(z+1)+' is in the arena');
      const h=world.hero;h.x=s.x;h.y=s.y+s.h-h.h;const lv=h.lv,drops=world.drops.length;updateSecret(STEP);
      ok(s.found && world.secretsFound===1,'secret '+(z+1)+' not found');
      updateSecret(STEP);ok(world.secretsFound===1,'secret '+(z+1)+' found twice');
    }
    ok(JSON.parse(localStorage.getItem(SECRET_KEY)).length===10,'found secrets not remembered');
    ok(SECRETS.length===10);
    try{localStorage.removeItem(SECRET_KEY);}catch(_){}
  });
  check('every quirk fires on cheap weapons and never recurses',()=>{
    for(const id of QUIRK_LIST) {
      reset();const h=world.hero;h.weapon=makeWeapon(0,{type:'sword',q:0,standout:false});h.weapon.quirk=id;h.hp=h.maxHp-20;
      const e=spawnEnemy('crawler',h.x+20,FLOOR());e.spawnT=0;e.hp=e.max=1e6;const e2=spawnEnemy('stalker',h.x-20,FLOOR());e2.spawnT=0;e2.hp=e2.max=1e6;
      const rnd=Math.random;Math.random=()=>0;let fired;try{fired=quirkHit(h,e,50,1);}finally{Math.random=rnd;}
      ok(fired,'quirk '+id+' did not fire');
      for(let i=0;i<120;i++){world.t+=STEP;game.updateShots(STEP);updateEnemy(e,STEP);}
      ok(world.shots.length===0 || world.shots.every(s=>s.proc),'quirk '+id+' left a non-proc shot');
    }
    reset();let n=0;const h=world.hero;h.weapon=makeWeapon(0,{q:0,standout:false});
    const e=spawnEnemy('crawler',h.x+20,FLOOR());e.spawnT=0;e.hp=e.max=1e9;
    for(let i=0;i<400;i++){world.t+=1;if(quirkHit(h,e,1,1))n++;}
    ok(n>160 && n<240,'common quirk rate off: '+n+'/400');
    h.weapon=makeWeapon(9,{q:10,standout:true});n=0;
    for(let i=0;i<400;i++){world.t+=1;if(quirkHit(h,e,1,1))n++;}
    ok(n>80,'rare weapons stopped being quirky: '+n+'/400');
  });
  check('every new weapon comes with a quirk and is never weaker than the one in hand',()=>{
    reset();const h=world.hero;
    for(let z=0;z<10;z++){
      h.weapon=makeWeapon(z,{q:Math.min(10,z+2),standout:z%3===0});
      for(let i=0;i<30;i++){
        const w=makeWeapon(z);ok(QUIRK_LIST.includes(w.quirk),'weapon without a quirk: '+w.name);
        dropWeapon(h.x+90,h.y,w);
        ok(powerScore(w)>=powerScore(h.weapon)*0.999,'a new drop was weaker than the held weapon in zone '+(z+1));
      }
      world.drops.length=0;
    }
  });
  check('weapon mastery grows from kills, persists in storage and boosts damage',()=>{
    reset();const h=world.hero;h.weapon=makeWeapon(0,{type:'staff',q:0,standout:false});
    const before=proficiency('staff').lv,dmg0=game.hitDamage(h.weapon);
    for(let i=0;i<60;i++){const e=spawnEnemy('crawler',h.x+30,FLOOR());e.spawnT=0;hitEnemy(e,1e9,{dir:1});}
    ok(proficiency('staff').lv>before,'no staff mastery from kills');
    ok(game.hitDamage(h.weapon)>dmg0,'mastery did not add damage');
    const saved=JSON.parse(localStorage.getItem(PROF_KEY));ok(saved.staff.lv===proficiency('staff').lv,'mastery not saved');
  });
  check('all ten zones can clear and go straight on to the next zone',()=>{
    for(let z=0;z<10;z++) {
      reset();startZone(z);world.hero.inv=100;
      for(let i=0;i<10000 && world.zone===z && world.phase!=='won';i++) {
        for(const e of world.enemies) if(!e.boss) {e.dead=true;e.deathT=0;}
        world.enemies=world.enemies.filter(e=>e.boss); // resolve boss outro through its own handler
        if(world.boss){world.hero.x=world.map.bossLeft+40;world.hero.y=world.map.bossFloor-world.hero.h;world.boss.dead=false;world.boss.hp=0;updateBoss(world.boss,STEP);for(let j=0;j<150;j++)updateBoss(world.boss,STEP);world.enemies=[];world.boss=null;}
        if(world.director.phase==='exit' || world.director.phase==='arena') {world.hero.x=world.map.exitX-world.hero.w/2;world.hero.y=world.map.exitY-world.hero.h;}
        updateWaves(STEP);world.t+=STEP;
      }
      ok(z===9?world.phase==='won':world.zone===z+1,'zone '+z+' stalled');
    }
  });
  check('a pit costs 15% of your health and puts you back on the last safe ground; foes knocked in are gone',()=>{
    reset();startZone(1);world.enemies=[];const h=world.hero,m=world.map,q=m.pits[0];
    ok(q,'stage has no pit');
    const lip=m.platforms.find(p=>p.ground && p.x+p.w===q.x);
    h.x=lip.x+lip.w-h.w-20;h.y=lip.y-h.h;h.vx=0;h.vy=0;h.onGround=true;h.platform=lip;h.inv=0;
    updateHero(h,STEP);const safe={...h.safe},hp=h.hp;ok(safe && safe.y===lip.y-h.h,'safe ground not remembered');
    h.x=q.x+q.w/2-h.w/2;h.y=lip.y-h.h+4;h.onGround=false;h.platform=null;
    for(let i=0;i<120 && h.hp===hp;i++){poll();updateHero(h,STEP);}
    ok(h.hp===hp-Math.ceil(h.maxHp*0.15),'the fall cost the wrong amount');
    ok(Math.abs(h.x-safe.x)<1 && Math.abs(h.y-safe.y)<1 && h.inv>0,'not put back on safe ground');
    const e=spawnEnemy('crawler',q.x+q.w/2,lip.y);e.spawnT=0;e.x=q.x+q.w/2-e.w/2;e.y=m.floorY-e.h;e.onGround=false;
    for(let i=0;i<30 && !e.dead;i++)updateEnemy(e,STEP);ok(e.dead,'a foe in the pit lived');
  });
  check('ladders in secret rooms still climb and stop at the top',()=>{
    reset();world.enemies=[];world.map=secretRoom(0,'vault');world.platforms=world.map.platforms;const h=world.hero,l=world.map.ladders[0];
    h.x=l.x-h.w/2;h.y=l.bottom-h.h;h.vx=h.vy=0;h.onGround=true;
    key('ArrowUp',true);for(let i=0;i<270;i++){poll();updateHero(h,STEP);}key('ArrowUp',false);poll();
    ok(h.onGround && Math.abs(h.y+h.h-l.exitY)<1 && h.x===l.exitX,'upper dismount failed');
    startZone(0);
  });
  check('stages run straight to the arena: residents left behind never respawn, and a full clear pays',()=>{
    reset();startZone(0);const count=world.enemies.length, ids=world.enemies.map(e=>e.id).join(',');
    for(let i=0;i<300;i++)updateWaves(STEP);
    ok(world.director.phase==='fight' && world.enemies.length===count && world.enemies.map(e=>e.id).join(',')===ids,'map respawned enemies');
    const shards=world.pickups.length;for(const e of world.enemies)e.dead=true;
    updateWaves(STEP);ok(world.director.phase==='arena' && !world.lock && world.pickups.length>shards,'a full clear paid nothing');
    reset();startZone(0);ok(world.enemies.some(e=>!e.dead),'stage has no residents');
    world.hero.x=world.map.bossLeft+10;world.hero.y=world.map.bossFloor-world.hero.h;
    for(let i=0;i<200 && world.director.phase!=='survive';i++)updateWaves(STEP);ok(world.director.phase==='survive' && world.lock && world.lock.x1===world.map.width,'the arena did not start with residents left behind');
    let peak=0;for(let i=0;i<240;i++){updateWaves(STEP);peak=Math.max(peak,world.enemies.filter(e=>!e.dead).length);}
    ok(peak>=3,'swarm did not pour in');
    for(const e of world.enemies.filter(e=>e.swarm && !e.dead)) ok(e.x>=world.lock.x0 && e.x+e.w<=world.lock.x1,'swarm left the locked screen');
    const foe=world.enemies.find(e=>e.swarm && !e.dead);foe.spawnT=0;foe.hp=foe.max=1e6;
    hitEnemy(foe,1,{dir:1});hitEnemy(foe,1,{dir:1});ok(world.swarmCombo.n===2,'swarm hits did not build a combo');
    const boosted=game.hitDamage(world.hero.weapon);world.swarmCombo.n=50;ok(game.hitDamage(world.hero.weapon)>boosted,'combo gave no damage');world.swarmCombo.n=2;
    for(let i=0;i<200;i++)updateWaves(STEP);ok(world.swarmCombo.n===0,'combo did not fall off without hits');
    if(!world.boss){world.director.t=0;updateWaves(STEP);}
    const boss=world.boss;ok(world.director.phase==='survive' && boss && boss.boss && boss.w>30 && boss.name===bossName(headOfZone(0)),'the family head did not arrive when the timer ran out');
    for(let i=0;i<60;i++)updateWaves(STEP);ok(world.director.phase==='survive','swarm ended before its boss fell');
    boss.hp=0;for(let i=0;i<200 && world.director.phase==='survive';i++){updateBoss(boss,STEP);updateWaves(STEP);}
    ok(world.director.phase==='exit' && !world.lock && world.enemies.every(e=>e.dead||e.boss||e.x+e.w<=world.map.width-W) && !world.swarmCombo,'boss defeat did not open the exit');
    world.hero.x=world.map.exitX-world.hero.w/2;world.hero.y=world.map.exitY-world.hero.h;
    for(let i=0;i<90;i++)updateWaves(STEP);
    ok(world.zone===1,'cleared exit did not advance');
  });
  check('world-space movement, camera and projectiles work beyond the first screen',()=>{
    reset();const h=world.hero,g=world.map.platforms.find(p=>p.ground && p.x>800 && p.w>=120);h.x=g.x+8;h.y=g.y-h.h;h.inv=100;h.weapon=makeWeapon(1,{type:'bow',q:1,standout:false});
    const e=spawnEnemy('crawler',h.x+55,g.y);e.spawnT=0;e.hp=e.max=10000;
    key('KeyZ',true);poll();updateHero(h,STEP);key('ArrowUp',false);key('ArrowDown',false);key('KeyZ',false);
    for(let i=0;i<50;i++){poll();updateHero(h,STEP);game.updateShots(STEP);}
    ok(h.x>800 && e.x>800 && e.hp<e.max,'offscreen projectile or actor was clipped');
    updateCamera(STEP,true);ok(world.cameraX>500);
    worldLayer();ok(X.getTransform().e===-Math.round(world.cameraX),'camera transform is not world-space');screenLayer();
  });
  check('distant enemy packs wait rather than rushing the entrance',()=>{
    reset();startZone(1);const e=world.enemies.find(e=>e.x>900), x=e.x;e.spawnT=0;
    for(let i=0;i<180;i++)updateEnemy(e,STEP);
    ok(e.x===x,'distant pack left its map section');
  });
  check('residents stroll peacefully until the hero comes close or hits them',()=>{
    reset();const h=world.hero,e=spawnEnemy('stalker',h.x+150,FLOOR());e.spawnT=0;h.inv=100;
    let attacked=false;
    for(let i=0;i<240;i++){world.t+=STEP;updateEnemy(e,STEP);attacked||=e.state!=='idle';}
    ok(e.calm && !attacked,'resident attacked from across the screen');
    const far=spawnEnemy('crawler',h.x+150,FLOOR());far.spawnT=0;hitEnemy(far,1,{dir:1});ok(!far.calm,'a hit did not provoke');
    e.x=h.x+30;for(let i=0;i<60;i++){world.t+=STEP;updateEnemy(e,STEP);}
    ok(!e.calm,'resident ignored the hero right next to it');
  });
  reset();
  const failed=results.filter(s=>s.startsWith('FAIL'));
  document.documentElement.dataset.smoke=failed.length?'fail':'pass';

  // ---- the polish pass: hidden portals, relics, the War Goose, gimmicks, the loot filter, the book, TEMPER
  const level=id=>{reset();game.openMap();game.enterLevel(NODES[id]);world.hero.inv=0;world.lock=null;return world.hero;};
  const stand=(h,x,y)=>Object.assign(h,{x:x-h.w/2,y:y-h.h,vx:0,vy:0,onGround:true,ladder:null});
  check('a hidden portal opens a secret room with the fifth relic, and the map waits as you left it',()=>{
    const h=level('1-2'),H=world.hidden;ok(H,'no hidden portal');const map=world.map,foes=world.enemies.length;
    ok(world.relics.length===RELIC_COUNT && world.relics.filter(r=>r.room).length===1,'relics not placed');
    stand(h,H.x,H.y);key('ArrowUp',true);poll();updateHidden(STEP);key('ArrowUp',false);poll();
    ok(H.inRoom && world.map.secretRoom && world.map!==map,'did not enter the room');
    const r=world.relics.find(r=>r.room);stand(h,r.x,r.y+8);updateRelics(STEP);ok(r.got && world.relicMask===1<<4,'room relic not taken');
    H.t=1;stand(h,world.map.startX,world.map.floorY);key('ArrowUp',true);poll();updateHidden(STEP);key('ArrowUp',false);poll();
    ok(!H.inRoom && world.map===map && world.enemies.length===foes,'the map changed while away');
    ok(Math.abs(h.x+h.w/2-H.x)<2,'not set back on the portal');
  });
  check('mounts wait for the stable (three family heads), then your pick hatches and a hit throws you from the saddle',()=>{
    resetMeta();let h=level('1-2');ok(!world.egg,'an egg before the stable opened');
    winTrophy(1);winTrophy(2);winTrophy(3);h=level('1-2');ok(!world.egg,'an egg before a mount was picked');
    chooseMount('wargoose');h=level('1-2');ok(world.egg,'no egg on 1-2');
    mount(h);ok(h.mount && h.mount.kind==='wargoose' && !world.loose,'did not mount');let hp=h.hp;hurtHero(30,1);
    ok(!h.mount && world.loose && world.loose.kind==='wargoose' && h.hp===hp,'the hit was not soaked by the goose');
    for(let i=0;i<60*6;i++){world.t+=STEP;updateMount(STEP);}ok(!world.loose,'the goose never flew off');
    // the Iron Boar's barding soaks the first hit, the second throws you
    chooseMount('ironboar');h=level('1-2');mount(h);ok(h.mount.kind==='ironboar','the egg hatched the wrong mount');hp=h.hp;
    hurtHero(30,1);ok(h.mount && h.hp===hp,'the barding did not take the first hit');h.inv=0;
    hurtHero(30,1);ok(!h.mount && h.hp===hp,'the second hit did not throw you');
    // the War Griffin flaps once in mid-air
    chooseMount('griffin');h=level('1-2');mount(h);h.onGround=false;h.coyote=0;h.vy=50;
    ok(flap(h) && h.vy<0,'no sky flap');ok(!flap(h),'flapped twice');
    resetMeta();
  });
  check('specialized: an off-class weapon in hand is swapped or reforged, and the bag can never equip one',()=>{
    resetMeta();setLock('ranged');reset();const h=world.hero;
    h.weapon=makeWeapon(3,{type:'sword',q:5,standout:false});const pow=powerScore(h.weapon);world.bag.fill(null);
    keepInClass();ok(CLASSES.ranged.types.includes(h.weapon.type),'still swinging a '+h.weapon.type);
    ok(powerScore(h.weapon)>=pow*0.99,'the reforged weapon came out weaker');
    const bow=makeWeapon(3,{type:'bow',q:4,standout:false});world.bag[0]=bow;h.weapon=makeWeapon(3,{type:'katana',q:4,standout:false});
    keepInClass();ok(h.weapon===bow && world.bag[0]===null,'the bow in the bag did not take the katana\'s place');
    const axe=makeWeapon(3,{type:'axe',q:4,standout:false});axe.locked=true;world.bag[2]=axe;
    ok(!equipFromBag(2) && h.weapon===bow,'equipped an axe while a ranged specialist');
    applyLock();ok(!world.bag.includes(axe),'a locked off-class weapon survived the melt');
    resetMeta();
  });
  check('ghost houses, auto-scrollers, water and ice change how the level plays',()=>{
    level('9-2');ok(world.gimmick==='ghost' && world.haunts.length>0,'no haunted blades');
    const h=level('2-5');ok(world.scroll,'no auto-scroll');world.director.phase='fight';const x0=world.scroll.x;
    for(let i=0;i<60;i++){world.t+=STEP;updateGimmick(STEP);}ok(world.scroll.x>x0,'the screen did not move');
    stand(h,world.scroll.x-50,h.y+h.h);updateGimmick(STEP);ok(h.x>=world.scroll.x,'left behind the screen');
    level('3-3');ok(heroPhysics()?.swim>0,'no swimming underwater');
    level('6-2');ok(heroPhysics()?.friction<1,'ice is not slippery');
    level('1-1');ok(!world.gimmick,'1-1 must stay as it is');
  });
  check('the loot filter salvages drops below its rarity and always keeps standouts',()=>{
    reset();const was=lootFilter();setLootFilter(3);world.bag=new Array(BAG_SIZE).fill(null);const s0=world.shards;
    ok(autoLoot(makeWeapon(2,{q:1,standout:false}))==='filtered' && world.shards>s0,'a common weapon got through');
    ok(autoLoot(makeWeapon(2,{q:1,standout:true}))!=='filtered','a standout was filtered');
    ok(autoLoot(makeWeapon(2,{q:4,standout:false}))!=='filtered','a heroic weapon was filtered');
    setLootFilter(was);
  });
  check('the Monster Book counts kills, and TEMPER makes residents tougher',()=>{
    resetBook();reset();const h=world.hero,e=spawnEnemy('stalker',h.x+20,FLOOR());e.spawnT=0;hitEnemy(e,e.hp*10,{dir:1});
    ok(cardKills('stalker')===1,'kill not in the book');resetBook();
    reset();const a=spawnEnemy('brute',h.x+40,FLOOR());world.temper=5;const b=spawnEnemy('brute',h.x+40,FLOOR());world.temper=0;
    ok(b.hp>a.hp*2 && b.dmg>a.dmg,'TEMPER 5 did not toughen them');
  });
  const report=document.createElement('pre');report.id='smoke-results';report.textContent=results.join('\n');document.body.append(report);
  console.log(results.join('\n'));
}
