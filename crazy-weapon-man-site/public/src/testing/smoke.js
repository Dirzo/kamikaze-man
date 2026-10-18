// Real browser regression tests. Opt in with ?smoke; never loaded in a normal run.
import { input } from '../engine/input.js';
import { world, resetWorld } from '../game/world.js';
import { createHero, updateHero } from '../game/hero.js';
import { spawnEnemy, updateEnemy } from '../game/enemy.js';
import { hitEnemy, hurtHero, dropWeapon } from '../game/combat.js';
import { makeWeapon } from '../game/loot.js';
import { updateDrops } from '../game/drops.js';
import { updateEvolution, attackMutation, impactMutation } from '../game/evolution.js';
import { startBoss, updateBoss, updateHazards, bossDone, clearBoss } from '../game/bosses.js';
import { startZone, updateWaves } from '../game/waves.js';
import { openForge, updateForge } from '../game/forge.js';
import { ZONES } from '../data/zones.js';
import { MUTATIONS } from '../data/progression.js';
import { C, STEP, GROUND, HERO } from '../config.js';
import { lookOf } from '../game/looks.js';
import { feel, clearFx } from '../game/fx.js';

export function runSmoke(game) {
  const results=[];
  const check=(label,fn)=>{ try { fn(); results.push('PASS '+label); } catch(e) { results.push('FAIL '+label+': '+e.message); console.error(label,e); } };
  const ok=(v,msg='assertion')=>{if(!v)throw Error(msg);};
  let clock=0;
  const key=(code,on)=>window.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));
  const poll=()=>input.poll(clock+=STEP);
  const reset=()=>{key('KeyZ',false);key('ArrowRight',false);key('ArrowLeft',false);key('KeyX',false);key('KeyV',false);poll();game.startRun();world.enemies=[];world.director=null;world.hero.inv=0;clearFx();};
  check('all nine weapons render with awakened silhouettes',()=>{
    for(const type of Object.keys(game.types)) {const w=makeWeapon(9,{type,q:8});w.mutation='orbit';ok(lookOf(w).cv.width>0);}
  });
  check('held attack finishes and chains, without replacing a live attack',()=>{
    reset(); const h=world.hero;key('KeyZ',true);poll();updateHero(h,STEP);const first=h.attack;let swings=1;
    updateHero(h,STEP);ok(h.attack===first,'attack overwritten');
    let last=first;for(let i=0;i<150;i++){poll();updateHero(h,STEP);if(h.attack && h.attack!==last){swings++;last=h.attack;}}
    ok(swings>=5,'held attack stopped');key('KeyZ',false);poll();
  });
  check('move at full speed and turn without cancelling a live attack',()=>{
    reset();const h=world.hero;h.weapon=makeWeapon(0,{type:'hammer',q:0,standout:false});
    h.vx=HERO.speed;key('ArrowRight',true);key('KeyZ',true);poll();updateHero(h,STEP);
    const attack=h.attack,x=h.x;key('KeyZ',false);poll();updateHero(h,STEP);
    ok(h.attack===attack && h.vx===HERO.speed && h.x>x,'attack slowed movement');
    key('ArrowRight',false);key('ArrowLeft',true);poll();updateHero(h,STEP);
    ok(h.face===-1 && h.attack===attack,'turn cancelled or locked attack');
    for(let i=0;i<8;i++){poll();updateHero(h,STEP);}
    ok(h.vx<0 && h.attack===attack,'cannot reverse movement mid-animation');
    key('ArrowLeft',false);poll();
  });
  check('one swing hits each enemy once, never during wind-up',()=>{
    reset();const h=world.hero,e=spawnEnemy('crawler',h.x+23,GROUND);e.spawnT=0;e.hp=e.max=10000;
    key('KeyZ',true);poll();updateHero(h,STEP);key('KeyZ',false);poll();
    const hp=e.hp;ok(hp===10000,'damage before contact frame');
    for(let i=0;i<23;i++){poll();updateHero(h,STEP);} const after=e.hp;ok(after<hp,'swing missed');
    for(let i=0;i<8;i++){poll();updateHero(h,STEP);} ok(e.hp===after,'swing multi-hit');
  });
  check('dash is immune to every hurt source; normal hurt cancels swing',()=>{
    reset();const h=world.hero;h.dashT=0.1;const hp=h.hp;hurtHero(30);ok(h.hp===hp);
    h.dashT=0;h.inv=0;h.attack={};hurtHero(10);ok(h.hp===hp-10 && !h.attack);
  });
  check('better drops do not replace an attack in progress',()=>{
    reset();const h=world.hero,old=h.weapon;dropWeapon(h.x+6,h.y+10,makeWeapon(5,{q:6,type:'sword'}));
    const d=world.drops[0];d.x=h.x;d.y=h.y+8;d.vx=d.vy=0;d.t=1;
    h.attack={};updateDrops(STEP);ok(h.weapon===old);
    h.attack=null;updateDrops(STEP);ok(h.weapon!==old);
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
      reset();startZone(z);world.hero.inv=100;startBoss(ZONES[z].boss);const e=world.boss;
      for(let i=0;i<600;i++){world.t+=STEP;updateBoss(e,STEP);updateHazards(STEP);}
      ok(e.pattern,'no attack pattern');ok(Number.isFinite(e.x)&&Number.isFinite(e.y),'bad boss position');
      e.hp=e.max*0.25;updateBoss(e,STEP);ok(e.phase===3,'phase did not advance');
      e.hp=0;updateBoss(e,STEP);ok(e.dead);for(let i=0;i<150;i++)updateBoss(e,STEP);ok(bossDone(),'boss clear stalled');
    }
  });
  check('forge choice preserves simulation and reset clears it',()=>{
    reset();openForge();ok(world.forge.draft && world.forge.offers.length===3);
    world.forge.t=1;key('KeyZ',true);poll();updateForge(STEP);key('KeyZ',false);poll();ok(!world.forge.draft);
    game.startRun();ok(!world.forge && world.echoes.length===0 && !world.deadT);
  });
  check('all ten zones can clear and transition through the forge',()=>{
    for(let z=0;z<10;z++) {
      reset();startZone(z);world.hero.inv=100;
      for(let i=0;i<10000 && !world.forge && world.phase!=='won';i++) {
        for(const e of world.enemies) if(!e.boss) {e.dead=true;e.deathT=0;}
        world.enemies=world.enemies.filter(e=>e.boss); // resolve boss outro through its own handler
        if(world.boss){world.boss.dead=false;world.boss.hp=0;updateBoss(world.boss,STEP);for(let j=0;j<150;j++)updateBoss(world.boss,STEP);world.enemies=[];world.boss=null;}
        updateWaves(STEP);world.t+=STEP;
      }
      ok(z===9?world.phase==='won':!!world.forge,'zone '+z+' stalled');
    }
  });
  reset();
  const failed=results.filter(s=>s.startsWith('FAIL'));
  document.documentElement.dataset.smoke=failed.length?'fail':'pass';
  const report=document.createElement('pre');report.id='smoke-results';report.textContent=results.join('\n');document.body.append(report);
  console.log(results.join('\n'));
}
