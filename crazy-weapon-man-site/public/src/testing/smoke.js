// Real browser regression tests. Opt in with ?smoke; never loaded in a normal run.
import { input } from '../engine/input.js';
import { world, resetWorld } from '../game/world.js';
import { createHero, updateHero } from '../game/hero.js';
import { spawnEnemy, updateEnemy, drawEnemy } from '../game/enemy.js';
import { hitEnemy, hurtHero, dropWeapon } from '../game/combat.js';
import { makeWeapon, dps, powerScore } from '../game/loot.js';
import { updateDrops } from '../game/drops.js';
import { updateEvolution, attackMutation, impactMutation } from '../game/evolution.js';
import { startBoss, updateBoss, updateHazards, drawHazards, bossDone, clearBoss, castMove, MOVES } from '../game/bosses.js';
import { updateCamera } from '../game/camera.js';
import { worldLayer, screenLayer, X } from '../engine/gfx.js';
import { startZone, updateWaves, enemiesLeft, spawnSwarmBoss } from '../game/waves.js';
import { openForge, updateForge } from '../game/forge.js';
import { openInventory, updateInventory, stash, autoLoot, BAG_SIZE } from '../game/inventory.js';
import { SWARM_BOSSES } from '../data/swarm.js';
import { quirkHit } from '../game/quirks.js';
import { QUIRK_LIST } from '../data/quirks.js';
import { proficiency, PROF_KEY } from '../data/proficiency.js';
import { ZONES } from '../data/zones.js';
import { MUTATIONS } from '../data/progression.js';
import { C, STEP, GROUND, HERO } from '../config.js';
import { lookOf } from '../game/looks.js';
import { feel, clearFx } from '../game/fx.js';
import { cx } from '../game/physics.js';
import { heroPose } from '../game/anim.js';
import { tickRun, splitZone } from '../game/speedrun.js';
import { resetRecords } from '../data/speedrun.js';
import { addProficiency } from '../data/proficiency.js';

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
  check('move at full speed and turn without cancelling a live attack',()=>{
    reset();const h=world.hero;h.weapon=makeWeapon(0,{type:'hammer',q:0,standout:false});
    h.vx=HERO.speed;key('ArrowRight',true);key('KeyZ',true);poll();updateHero(h,STEP);
    const attack=h.attack,x=h.x;key('ArrowUp',false);key('ArrowDown',false);key('KeyZ',false);poll();updateHero(h,STEP);
    ok(h.attack===attack && h.vx===HERO.speed && h.x>x,'attack slowed movement');
    key('ArrowRight',false);key('ArrowLeft',true);poll();updateHero(h,STEP);
    ok(h.face===-1 && h.attack===attack,'turn cancelled or locked attack');
    for(let i=0;i<8;i++){poll();updateHero(h,STEP);}
    ok(h.vx<0 && h.attack===attack,'cannot reverse movement mid-animation');
    key('ArrowLeft',false);poll();
  });
  check('one swing hits each enemy once, never during wind-up',()=>{
    reset();const h=world.hero,e=spawnEnemy('crawler',h.x+23,GROUND);e.spawnT=0;e.hp=e.max=10000;
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
      const e=spawnEnemy('brute',h.x+26,GROUND);e.spawnT=0;e.hp=e.max=100000;
      if(mutation==='seeker') { const n=spawnEnemy('crawler',h.x+65,GROUND);n.spawnT=0;n.hp=n.max=100000; }
      if(mutation==='cataclysm'){h.attackCount=2;attackMutation(h);}else impactMutation(h,e,{weapon:h.weapon,move:{big:true}});
      for(let i=0;i<90;i++){world.t+=STEP;updateEvolution(STEP);game.updateShots(STEP);}
      ok(world.enemies.some(n=>n.hp<n.max),mutation+' did no damage');ok(world.echoes.length===0,'pending effect leaked');
    }
  });
  check('every boss executes patterns, phase changes and defeat',()=>{
    for(let z=0;z<ZONES.length;z++) if(ZONES[z].boss) {
      reset();startZone(z);world.hero.x=world.map.bossLeft+40;world.hero.y=world.map.bossFloor-world.hero.h;world.hero.inv=100;startBoss(ZONES[z].boss);const e=world.boss;
      for(let i=0;i<600;i++){world.t+=STEP;updateBoss(e,STEP);updateHazards(STEP);}
      ok(e.pattern,'no attack pattern');ok(Number.isFinite(e.x)&&Number.isFinite(e.y),'bad boss position');
      e.hp=e.max*0.25;updateBoss(e,STEP);ok(e.phase===3,'phase did not advance');
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
  check('forge opens straight to the workshop with no weapon draft, and reset clears it',()=>{
    reset();const before=world.hero.weapon;openForge();ok(!world.forge.draft && !world.forge.offers,'weapon draft still offered');
    world.forge.t=1;key('KeyZ',true);poll();updateForge(STEP);key('KeyZ',false);poll();ok(world.hero.weapon===before,'forge changed the weapon');
    game.startRun();ok(!world.forge && world.echoes.length===0 && !world.deadT);
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
    const e=spawnEnemy('brute',h.x+30,GROUND);e.spawnT=0;e.hp=e.max=1e6;
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
  check('every zone has its own swarm boss that spawns, fights and draws',()=>{
    const names=new Set();
    for(let z=0;z<ZONES.length;z++) {
      reset();startZone(z);world.enemies.length=0;const h=world.hero;h.inv=1e9;
      updateCamera(0,true);world.lock={x0:world.cameraX,x1:world.cameraX+480,y0:world.cameraY,feet:h.y+h.h};world.director.phase='survive';
      const e=spawnSwarmBoss();ok(e && e.swarmBoss && world.boss===e && e.hp>0,'no swarm boss in zone '+(z+1));names.add(e.name);
      for(let i=0;i<240;i++){world.t+=STEP;updateEnemy(e,STEP);h.inv=1e9;}
      ok(Number.isFinite(e.x) && Number.isFinite(e.y) && !e.dead,'swarm boss broke in zone '+(z+1));
      drawEnemy(e,1);
    }
    ok(names.size===ZONES.length,'swarm bosses are not unique per zone');
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
  check('every quirk fires on cheap weapons and never recurses',()=>{
    for(const id of QUIRK_LIST) {
      reset();const h=world.hero;h.weapon=makeWeapon(0,{type:'sword',q:0,standout:false});h.weapon.quirk=id;h.hp=h.maxHp-20;
      const e=spawnEnemy('crawler',h.x+20,GROUND);e.spawnT=0;e.hp=e.max=1e6;const e2=spawnEnemy('stalker',h.x-20,GROUND);e2.spawnT=0;e2.hp=e2.max=1e6;
      const rnd=Math.random;Math.random=()=>0;let fired;try{fired=quirkHit(h,e,50,1);}finally{Math.random=rnd;}
      ok(fired,'quirk '+id+' did not fire');
      for(let i=0;i<120;i++){world.t+=STEP;game.updateShots(STEP);updateEnemy(e,STEP);}
      ok(world.shots.length===0 || world.shots.every(s=>s.proc),'quirk '+id+' left a non-proc shot');
    }
    reset();let n=0;const h=world.hero;h.weapon=makeWeapon(0,{q:0,standout:false});
    const e=spawnEnemy('crawler',h.x+20,GROUND);e.spawnT=0;e.hp=e.max=1e9;
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
    for(let i=0;i<60;i++){const e=spawnEnemy('crawler',h.x+30,GROUND);e.spawnT=0;hitEnemy(e,1e9,{dir:1});}
    ok(proficiency('staff').lv>before,'no staff mastery from kills');
    ok(game.hitDamage(h.weapon)>dmg0,'mastery did not add damage');
    const saved=JSON.parse(localStorage.getItem(PROF_KEY));ok(saved.staff.lv===proficiency('staff').lv,'mastery not saved');
  });
  check('all ten zones can clear and transition through the forge',()=>{
    for(let z=0;z<10;z++) {
      reset();startZone(z);world.hero.inv=100;
      for(let i=0;i<10000 && !world.forge && world.phase!=='won';i++) {
        for(const e of world.enemies) if(!e.boss) {e.dead=true;e.deathT=0;}
        world.enemies=world.enemies.filter(e=>e.boss); // resolve boss outro through its own handler
        if(world.boss && world.boss.swarmBoss && world.boss.dead) world.boss=null;
        if(world.boss){world.hero.x=world.map.bossLeft+40;world.hero.y=world.map.bossFloor-world.hero.h;world.boss.dead=false;world.boss.hp=0;updateBoss(world.boss,STEP);for(let j=0;j<150;j++)updateBoss(world.boss,STEP);world.enemies=[];world.boss=null;}
        if(world.director.phase==='exit' || world.director.phase==='arena') {world.hero.x=world.map.exitX-world.hero.w/2;world.hero.y=world.map.exitY-world.hero.h;}
        updateWaves(STEP);world.t+=STEP;
      }
      ok(z===9?world.phase==='won':!!world.forge,'zone '+z+' stalled');
    }
  });
  check('ladders connect chamber floors to suspended hunting ledges',()=>{
    reset();startZone(1);world.enemies=[];const h=world.hero,l=world.map.ladders[0];
    h.x=l.x-h.w/2;h.y=l.bottom-h.h;
    key('ArrowUp',true);let drew=false;
    for(let i=0;i<270;i++){poll();updateHero(h,STEP);drew||=!h.ladder && h.drawT>0 && !heroPose(h,1).sheath;}
    key('ArrowUp',false);poll();
    ok(h.onGround && Math.abs(h.y+h.h-l.exitY)<1 && h.x===l.exitX,'upper dismount failed');
    ok(drew,'weapon was not drawn again off the ladder');
    h.x=l.x-h.w/2;key('ArrowDown',true);
    for(let i=0;i<20;i++){poll();updateHero(h,STEP);}
    ok(h.ladder && heroPose(h,1).sheath,'weapon not sheathed on the ladder');
    const c0=h.climbT;key('ArrowDown',false);poll();updateHero(h,STEP);ok(h.ladder && h.climbT===c0,'climb animation ran while holding still');
    key('ArrowDown',true);
    for(let i=0;i<260;i++){poll();updateHero(h,STEP);}
    key('ArrowDown',false);poll();
    ok(h.onGround && Math.abs(h.y+h.h-l.bottom)<1,'bottom dismount failed');
    updateCamera(STEP,true);ok(Math.abs(world.cameraY-(l.bottom-GROUND+12))<1,'camera missed chamber route');
  });
  check('story bosses crash into the swarm after a themed warning, and the swarm keeps coming',()=>{
    reset();startZone(2);const h=world.hero;h.inv=1e9;world.director.phase='fight';
    for(const e of world.enemies)e.dead=true;
    updateWaves(STEP);h.x=world.map.bossLeft+40;h.y=world.map.bossFloor-h.h;updateWaves(STEP);
    ok(world.director.phase==='survive' && !world.boss,'the boss was there before the swarm');
    let warnedFirst=false,steps=0;
    for(;steps<1200 && !world.boss;steps++){updateWaves(STEP);h.inv=1e9;if(world.director.warned && !world.boss)warnedFirst=true;}
    ok(world.boss && world.boss.type==='bossjr' && warnedFirst,'no warned boss arrival in the swarm');
    ok(steps>=60*5,'the boss arrived too soon to be a swarm moment');
    world.enemies=world.enemies.filter(e=>!e.swarm);
    for(let i=0;i<300;i++){updateWaves(STEP);world.t+=STEP;h.inv=1e9;}
    ok(world.enemies.some(e=>e.swarm && !e.dead),'the swarm stopped when the boss arrived');
    const b=world.boss;b.hp=0;for(let i=0;i<200;i++){updateBoss(b,STEP);updateWaves(STEP);}
    ok(world.director.phase==='exit','beating the boss did not end the swarm');
  });
  check('nonlethal hits trigger expressive faces',()=>{
    reset();const e=spawnEnemy('goose',100,GROUND);e.spawnT=0;e.hp=e.max=10000;
    hitEnemy(e,2,{dir:1});ok(e.faceUntil>world.t);const first=e.funnyFace;
    hitEnemy(e,2,{dir:1});ok(e.funnyFace!==first);
  });
  check('finite map stays locked with undiscovered enemies and never replenishes them',()=>{
    reset();startZone(0);const count=world.enemies.length, ids=world.enemies.map(e=>e.id).join(',');
    world.hero.x=world.map.exitX-world.hero.w/2;world.hero.y=world.map.exitY-world.hero.h;
    for(let i=0;i<1200;i++)updateWaves(STEP);
    ok(world.director.phase==='fight' && !world.forge,'escaped with enemies left');
    ok(world.enemies.length===count && world.enemies.map(e=>e.id).join(',')===ids,'map respawned enemies');
    for(const e of world.enemies)e.dead=true;
    updateWaves(STEP);ok(world.director.phase==='arena' && !world.lock,'clear did not send the hero to the arena');
    updateWaves(STEP);ok(world.director.phase==='survive' && world.lock && world.lock.x1===world.map.width,'the arena did not start the survival swarm');
    let peak=0;for(let i=0;i<240;i++){updateWaves(STEP);peak=Math.max(peak,world.enemies.filter(e=>!e.dead).length);}
    ok(peak>=3,'swarm did not pour in');
    for(const e of world.enemies.filter(e=>e.swarm && !e.dead)) ok(e.x>=world.lock.x0 && e.x+e.w<=world.lock.x1,'swarm left the locked screen');
    const foe=world.enemies.find(e=>e.swarm && !e.dead);foe.spawnT=0;foe.hp=foe.max=1e6;
    hitEnemy(foe,1,{dir:1});hitEnemy(foe,1,{dir:1});ok(world.swarmCombo.n===2,'swarm hits did not build a combo');
    const boosted=game.hitDamage(world.hero.weapon);world.swarmCombo.n=50;ok(game.hitDamage(world.hero.weapon)>boosted,'combo gave no damage');world.swarmCombo.n=2;
    for(let i=0;i<200;i++)updateWaves(STEP);ok(world.swarmCombo.n===0,'combo did not fall off without hits');
    if(!world.boss){world.director.t=0;updateWaves(STEP);}
    const boss=world.boss;ok(world.director.phase==='survive' && boss && boss.swarmBoss && boss.scale>1 && boss.name===SWARM_BOSSES[0].name,'no swarm boss when the timer ran out');
    for(let i=0;i<60;i++)updateWaves(STEP);ok(world.director.phase==='survive','swarm ended before its boss fell');
    boss.spawnT=0;hitEnemy(boss,boss.hp+1,{dir:1});updateWaves(STEP);
    ok(world.director.phase==='exit' && !world.lock && world.enemies.every(e=>e.dead) && !world.swarmCombo,'swarm boss defeat did not open the exit');
    for(let i=0;i<90;i++)updateWaves(STEP);
    ok(!!world.forge,'cleared exit did not advance');
  });
  check('world-space movement, camera and projectiles work beyond the first screen',()=>{
    reset();const h=world.hero;h.x=850;h.inv=100;h.weapon=makeWeapon(1,{type:'bow',q:1,standout:false});
    const e=spawnEnemy('crawler',h.x+55,GROUND);e.spawnT=0;e.hp=e.max=10000;
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
    reset();const h=world.hero,e=spawnEnemy('stalker',h.x+150,GROUND);e.spawnT=0;h.inv=100;
    let attacked=false;
    for(let i=0;i<240;i++){world.t+=STEP;updateEnemy(e,STEP);attacked||=e.state!=='idle';}
    ok(e.calm && !attacked,'resident attacked from across the screen');
    const far=spawnEnemy('crawler',h.x+150,GROUND);far.spawnT=0;hitEnemy(far,1,{dir:1});ok(!far.calm,'a hit did not provoke');
    e.x=h.x+30;for(let i=0;i<60;i++){world.t+=STEP;updateEnemy(e,STEP);}
    ok(!e.calm,'resident ignored the hero right next to it');
  });
  reset();
  const failed=results.filter(s=>s.startsWith('FAIL'));
  document.documentElement.dataset.smoke=failed.length?'fail':'pass';
  const report=document.createElement('pre');report.id='smoke-results';report.textContent=results.join('\n');document.body.append(report);
  console.log(results.join('\n'));
}
