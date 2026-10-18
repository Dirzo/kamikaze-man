// Bosses: a big enemy (world.enemies, boss: true, no knockback) running a list of attack patterns,
// faster and meaner after each third of its health. Telegraphs are pixel markers, never circles.
import { C, W, GROUND } from '../config.js';
import { A } from '../engine/assets.js';
import { frame, rect, X, text } from '../engine/gfx.js';
import { sfx } from '../engine/audio.js';
import { world, newId } from './world.js';
import { move, overlap, cx, cy } from './physics.js';
import { refHP, refDmg } from '../data/curve.js';
import { hurtHero, dropWeapon, dropShards } from './combat.js';
import { makeWeapon } from './loot.js';
import { spawnEnemy } from './enemy.js';
import { emit, burst, spark, shake, hitstop, callout } from './fx.js';
import { say, updateBubble } from './bubbles.js';
import { gainXp } from './progress.js';

const BOSSES = {
  bossjr: {
    name: 'CRAZY WEAPON MAN JR.',
    patterns: ['charge', 'slam', 'toss'],
    intro: ['DAD SAID I COULD USE THE BIG ONE', 'THIS ONE IS A PROTOTYPE. PROBABLY.'],
    phase: ['OW! OKAY NOW I MEAN IT', 'I AM TELLING DAD'],
    defeat: 'I WANT A REMATCH... AFTER NAP',
    bolt: 'pink',
    speed: 46
  },
  bossman: {
    name: 'CRAZY BOSS MAN',
    patterns: ['stomp', 'fan', 'summon:taxman'],
    intro: ['YOU ARE LATE FOR YOUR REVIEW', 'LET US CIRCLE BACK ON YOUR FACE'],
    phase: ['THIS IS GOING IN YOUR FILE', 'MANDATORY OVERTIME!'],
    defeat: 'I... AM... DOWNSIZED',
    bolt: 'gold',
    speed: 30
  },
  bosssr: {
    name: 'CRAZY WEAPON MAN SR.',
    patterns: ['anvils', 'charge', 'strikes'],
    intro: ['WHO TOUCHED MY THERMOSTAT', 'HI HUNGRY, I AM DAD'],
    phase: ['DO NOT MAKE ME TURN THIS FORGE AROUND', 'BACK IN MY DAY WE HAD TWO WEAPONS'],
    defeat: 'GO ASK YOUR MOTHER',
    bolt: 'sky',
    speed: 40
  },
  bossgrandma: {
    name: 'GRANDMA, ARMED',
    patterns: ['lob', 'summon:crawler', 'fan'],
    intro: ['YOU LOOK THIN. HAVE A CASSEROLE', 'SIT DOWN, DEAR. THIS WILL HURT'],
    phase: ['SECOND HELPINGS!', 'NOBODY LEAVES MY TABLE HUNGRY'],
    defeat: 'TAKE SOME COOKIES FOR THE ROAD',
    bolt: 'orange',
    speed: 28
  },
  bossceo: {
    name: 'THE CEO',
    patterns: ['coins', 'charge', 'summon:shieldbro', 'slam'],
    intro: ['YOUR POSITION HAS BEEN ELIMINATED', 'I OWN THESE STAIRS. AND YOU.'],
    phase: ['GOLDEN PARACHUTE ENGAGED', 'HOSTILE TAKEOVER!'],
    defeat: 'MY SHAREHOLDERS WILL HEAR OF THIS',
    bolt: 'gold',
    speed: 44
  },
  bossweapon: {
    name: 'THE SENTIENT ARMORY',
    patterns: ['swordrain', 'charge', 'fan', 'strikes'],
    intro: ['I AM EVERY WEAPON YOU DROPPED', 'YOU SOLD MY COUSIN FOR SHARDS'],
    phase: ['THE INVENTORY IS FULL', 'I HAVE LEARNED YOUR BUILD'],
    defeat: 'EQUIP... ME...',
    bolt: 'violet',
    speed: 50
  }
};

const hazards = [];
let boss = null,
  done = false,
  outroT = 0;

export function startBoss(kind) {
  const D = BOSSES[kind],
    art = A.bosses[kind],
    z = world.zone;
  const hp = refHP(z) * 10;
  done = false;
  outroT = 0;
  hazards.length = 0;
  boss = {
    id: newId(),
    type: kind,
    kind: 'boss',
    boss: true,
    D,
    name: D.name,
    x: W - 80,
    y: -art.h,
    w: Math.round((art.w - 2) * 0.7),
    h: art.h - 4,
    vx: 0,
    vy: 0,
    face: -1,
    hp,
    max: hp,
    dmg: refDmg(z) * 1.5,
    state: 'enter',
    st: 1.2,
    stun: 0,
    kbT: 0,
    flash: 0,
    spawnT: 0,
    phase: 1,
    queue: [],
    elite: true,
    xp: 60 + z * 25,
    anim: 0,
    bubble: null,
    dead: false
  };
  world.enemies.push(boss);
  world.boss = boss;
  callout(D.name, W / 2, 60, C.gold, { big: true, life: 120 });
}
export const bossDone = () => done;

function speak(lines) {
  say(boss, lines[Math.floor(Math.random() * lines.length)], 2.6, true);
}

// called from the enemy loop for the boss
export function updateBoss(e, dt) {
  const hero = world.hero,
    D = e.D;
  updateBubble(e, dt);
  e.flash = Math.max(0, e.flash - dt);
  e.anim += dt;
  if (e.dead) {
    outroT += dt;
    e.vx = 0;
    if (Math.random() < 0.5) spark(e.x + Math.random() * e.w, e.y + Math.random() * e.h, { big: Math.random() < 0.3, col: C.orange });
    if (outroT > 2.2 && !done) {
      done = true;
      e.deathT = 0;
    }
    move(e, dt, world.platforms);
    return;
  }
  if (e.hp <= 0) return defeat(e);
  // phase changes at 2/3 and 1/3
  const ph = e.hp < e.max / 3 ? 3 : e.hp < (e.max * 2) / 3 ? 2 : 1;
  if (ph > e.phase) {
    e.phase = ph;
    speak(D.phase);
    callout(`PHASE ${ph}`, W / 2, 60, C.coral, { big: true, life: 80 });
    shake(0.5);
    hitstop(0.1);
    e.state = 'idle';
    e.st = 0.6;
  }
  const rate = e.phase === 1 ? 1 : e.phase === 2 ? 1.25 : 1.5;
  e.st -= dt * rate;
  const toward = Math.sign(cx(hero) - cx(e)) || 1;
  switch (e.state) {
    case 'enter':
      if (e.onGround && e.st < 0.6 && !e.spoke) {
        e.spoke = true;
        speak(D.intro);
        shake(0.6);
        burst(cx(e), e.y + e.h, 14, 'chip', ['sand', 'fog']);
      }
      if (e.st <= 0) {
        e.state = 'idle';
        e.st = 0.8;
      }
      break;
    case 'idle':
      e.face = toward;
      e.vx = Math.abs(cx(hero) - cx(e)) > 70 ? toward * D.speed : 0;
      if (e.st <= 0) nextPattern(e);
      break;
    case 'wind':
      e.vx = 0;
      if (e.st <= 0) doPattern(e);
      break;
    case 'act':
      acting(e, dt);
      break;
  }
  move(e, dt, world.platforms, { dropThrough: true });
  // its body only hurts while charging or slamming
  if (e.state === 'act' && (e.pattern === 'charge' || e.slam) && overlap(e, hero)) hurtHero(e.dmg * 0.8, Math.sign(cx(hero) - cx(e)) || 1);
}

function nextPattern(e) {
  if (!e.queue.length) e.queue = [...e.D.patterns].sort(() => Math.random() - 0.5);
  e.pattern = e.queue.shift();
  e.state = 'wind';
  e.st = 0.7;
  e.tellT = 0.7;
  sfx.enemyCast();
}

function doPattern(e) {
  const hero = world.hero,
    D = e.D;
  const [name, arg] = e.pattern.split(':');
  e.state = 'act';
  e.st = 1;
  e.hitDone = false;
  switch (name) {
    case 'charge':
      e.face = Math.sign(cx(hero) - cx(e)) || 1;
      e.vx = e.face * 230;
      e.st = 1.3;
      break;
    case 'slam':
      e.vy = -330;
      e.onGround = false;
      e.vx = (cx(hero) - cx(e)) * 1.2;
      e.st = 1.4;
      e.slam = true;
      break;
    case 'stomp':
      groundWave(cx(e), -1, e.dmg);
      groundWave(cx(e), 1, e.dmg);
      shake(0.5);
      e.st = 0.9;
      break;
    case 'toss':
    case 'lob':
      for (let i = 0; i < (e.phase + 2); i++) {
        const tx = cx(hero) + (i - 1) * 30;
        const t = 0.9;
        bolt(cx(e), e.y + 6, (tx - cx(e)) / t, -240, e.dmg, C[D.bolt], 520);
      }
      e.st = 0.9;
      break;
    case 'fan':
      for (let i = -2; i <= 2; i++) {
        const ang = Math.atan2(cy(hero) - cy(e), cx(hero) - cx(e)) + i * 0.2;
        bolt(cx(e), cy(e) - 6, Math.cos(ang) * 150, Math.sin(ang) * 150, e.dmg * 0.8, C[D.bolt]);
      }
      e.st = 0.8;
      break;
    case 'summon':
      for (let i = 0; i < 2; i++) spawnEnemy(arg, cx(e) + (i ? 40 : -40), GROUND, { wave: 3 });
      e.st = 0.8;
      break;
    case 'anvils':
    case 'swordrain':
    case 'coins':
      for (let i = 0; i < 4 + e.phase * 2; i++) {
        const x = i === 0 ? cx(hero) : 20 + Math.random() * (W - 40);
        hazards.push({ kind: 'fall', x, y: -20, t: 0.8 + i * 0.12, vy: 0, dmg: e.dmg, look: name });
      }
      e.st = 1.6;
      break;
    case 'strikes':
      for (let i = 0; i < 3 + e.phase; i++) hazards.push({ kind: 'column', x: i === 0 ? cx(hero) : 20 + Math.random() * (W - 40), t: 0.9 + i * 0.15, life: 0.25, dmg: e.dmg });
      e.st = 1.6;
      break;
  }
}

function acting(e, dt) {
  const hero = world.hero;
  if (e.pattern === 'charge') {
    if (Math.random() < 0.5) emit(cx(e), e.y + e.h, 'dust', C.fog);
    if (e.hitWall || e.st <= 0) {
      if (e.hitWall) {
        shake(0.5);
        burst(e.hitWall > 0 ? W - 4 : 4, e.y + e.h / 2, 10, 'chip', ['stone', 'paper']);
        e.stun = 0.6;
      }
      e.vx = 0;
      e.state = 'idle';
      e.st = 0.9;
    }
  } else if (e.slam && e.onGround && e.vy >= 0 && e.st < 1.2) {
    e.slam = false;
    e.vx = 0;
    groundWave(cx(e), -1, e.dmg);
    groundWave(cx(e), 1, e.dmg);
    spark(cx(e), e.y + e.h, { big: true, col: C.sand });
    shake(0.6);
    hitstop(0.05);
    e.state = 'idle';
    e.st = 0.9;
  } else if (e.st <= 0) {
    e.state = 'idle';
    e.st = 0.6;
  }
}

function bolt(x, y, vx, vy, dmg, col, g = 0) {
  world.bolts.push({ x: x - 2, y: y - 2, w: 4, h: 4, vx, vy, g, dmg, col, life: 4 });
}
function groundWave(x, dir, dmg) {
  hazards.push({ kind: 'wave', x, dir, t: 0, life: 1.6, dmg, hit: false });
}

function defeat(e) {
  e.dead = true;
  e.deathT = 99;
  say(e, e.D.defeat, 2.4, true);
  sfx.boom(2);
  shake(0.8);
  hitstop(0.2);
  callout('BOSS DOWN', W / 2, 60, C.gold, { big: true, life: 140 });
  gainXp(e.xp);
  world.kills++;
  for (let i = 0; i < 3; i++) dropWeapon(cx(e) + (i - 1) * 24, e.y + 10, makeWeapon(world.zone, { boss: true, standout: i === 1 ? true : null }));
  dropShards(cx(e), cy(e), 20);
  hazards.length = 0;
  for (const o of world.enemies) if (o !== e && !o.dead) o.hp = 0;
}

// ---------------------------------------------------------------- hazards
export function updateHazards(dt) {
  const hero = world.hero;
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    if (h.kind === 'fall') {
      h.t -= dt;
      if (h.t <= 0) {
        h.vy += 900 * dt;
        h.y += h.vy * dt;
        if (overlap({ x: h.x - 5, y: h.y - 8, w: 10, h: 12 }, hero)) {
          hurtHero(h.dmg, Math.sign(cx(hero) - h.x) || 1);
          h.y = GROUND + 1;
        }
        if (h.y >= GROUND - 4) {
          burst(h.x, GROUND - 2, 6, 'chip', h.look === 'coins' ? ['gold', 'cream'] : ['stone', 'fog']);
          sfx.land();
          hazards.splice(i, 1);
        }
      }
    } else if (h.kind === 'column') {
      h.t -= dt;
      if (h.t <= 0) {
        if (!h.fired) {
          h.fired = true;
          sfx.boom(0.6);
          shake(0.3);
          if (Math.abs(cx(hero) - h.x) < 9) hurtHero(h.dmg, Math.sign(cx(hero) - h.x) || 1);
        }
        h.life -= dt;
        if (h.life <= 0) hazards.splice(i, 1);
      }
    } else if (h.kind === 'wave') {
      h.t += dt;
      h.x += h.dir * 170 * dt;
      if (Math.random() < 0.8) emit(h.x, GROUND - 2, 'chip', Math.random() < 0.5 ? C.sand : C.wood);
      if (!h.hit && hero.onGround && Math.abs(cx(hero) - h.x) < 7 && hero.y + hero.h >= GROUND - 2) {
        h.hit = true;
        hurtHero(h.dmg, h.dir);
      }
      if (h.t > h.life || h.x < 0 || h.x > W) hazards.splice(i, 1);
    }
  }
}

export function drawHazards(t) {
  for (const h of hazards) {
    const x = Math.round(h.x);
    if (h.kind === 'fall') {
      if (h.t > 0) {
        // ground marker blinking where it will land
        if (Math.floor(t * 12) % 2) {
          rect(x - 5, GROUND - 2, 11, 2, C.red);
          rect(x - 1, GROUND - 6, 3, 3, C.red);
        }
      } else {
        const y = Math.round(h.y);
        rect(x - 5, y - 8, 11, 12, C.ink);
        if (h.look === 'coins') {
          rect(x - 4, y - 7, 9, 10, C.gold);
          rect(x - 2, y - 5, 2, 6, C.cream);
        } else if (h.look === 'swordrain') {
          rect(x - 1, y - 7, 3, 10, C.mist);
          rect(x - 4, y - 7, 9, 2, C.gold);
        } else {
          rect(x - 4, y - 7, 9, 4, C.stone);
          rect(x - 2, y - 3, 5, 6, C.slate);
        }
      }
    } else if (h.kind === 'column') {
      if (h.t > 0) {
        if (Math.floor(t * 14) % 2) for (let y = 20; y < GROUND; y += 6) rect(x, y, 1, 3, C.sky);
      } else {
        rect(x - 4, 0, 9, GROUND, C.ink);
        rect(x - 3, 0, 7, GROUND, C.sky);
        rect(x - 1, 0, 3, GROUND, C.paper);
      }
    } else if (h.kind === 'wave') {
      rect(x - 3, GROUND - 7, 7, 7, C.ink);
      rect(x - 2, GROUND - 6, 5, 6, C.sand);
      rect(x - 1, GROUND - 9, 3, 3, C.wood);
    }
  }
}

export function drawBoss(e, t) {
  const art = A.bosses[e.type];
  const sx = Math.round(cx(e) - art.w / 2),
    sy = Math.round(e.y + e.h - (art.h - 3));
  if (e.dead && Math.floor(t * 20) % 2) return;
  const f = e.flash > 0 ? 2 : Math.floor(e.anim * 2) % 2;
  frame(art.im, f, art.w, art.h, sx, sy, e.face < 0);
  if (e.state === 'wind' && Math.floor(t * 12) % 2 === 0) {
    const mx = Math.round(cx(e)),
      top = sy - 18;
    rect(mx - 3, top - 1, 7, 13, C.ink);
    rect(mx - 1, top, 3, 7, C.red);
    rect(mx - 1, top + 8, 3, 3, C.red);
  }
}
export function clearBoss() {
  hazards.length = 0;
  boss = null;
  done = false;
}
