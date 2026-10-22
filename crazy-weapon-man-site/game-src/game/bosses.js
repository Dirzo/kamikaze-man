// Bosses: a big enemy (world.enemies, boss: true, no knockback) running a list of attack patterns,
// faster and meaner after each third of its health. Telegraphs are pixel markers, never circles.
import { C, W, GROUND } from '../config.js';
import { A } from '../engine/assets.js';
import { frame, rect, X, text, tinted } from '../engine/gfx.js';
import { sfx } from '../engine/audio.js';
import { world, newId } from './world.js';
import { move, overlap, cx, cy, worldWidth, worldFloor } from './physics.js';
import { refHP, refDmg } from '../data/curve.js';
import { hurtHero, shotSrc, dropWeapon, dropShards, tickStatus, kill } from './combat.js';
import { innate } from './perks.js';
import { makeWeapon, baseDps } from './loot.js';
import { ROLES, TIER_HP, TIER_DMG, WORLD_RAMP, HEAD_DMG, NEW_HEADS, SIBLING_DEFS } from '../data/families.js';
import { stats } from '../data/meta.js';
import { spawnEnemy, jitter } from './enemy.js';
import { emit, burst, spark, shake, hitstop, callout } from './fx.js';
import { say, updateBubble } from './bubbles.js';
import { gainXp, gainProficiency, toast } from './progress.js';
import { recordBoss, PAGES, PAGE_BONUS } from '../data/book.js';
import { temper } from '../data/temper.js';

// Each boss lives in its weapon zone and fights with that zone's theme. They all crash into the
// survival swarm partway through (waves.js); `warn` is shouted just before they arrive and
// `surprise` is the twist they pull at each phase change. These six and the four in NEW_HEADS head
// the boss families (data/families.js); every other level's boss is one of their siblings.
const BOSSES = {
  bossjr: {
    name: 'CRAZY WEAPON MAN JR.',
    patterns: ['charge', 'tide', 'shell', 'toss'],
    surprise: 'surf',
    warn: 'THE TIDE IS GOING OUT... FAST',
    intro: ['DAD SAID I COULD USE THE BIG SWORD', 'THIS SWORD IS TALLER THAN ME. GOOD.'],
    phase: ['WATCH ME SPIN IT!', 'THE BIG SWORD IS WINNING, DAD!'],
    defeat: 'REMATCH... WITH A BIGGER SWORD',
    bolt: 'pink',
    speed: 46
  },
  bossman: {
    name: 'OGRE KING GRUMBLEFOOT',
    patterns: ['stomp', 'avalanche', 'fan', 'summon:monk'],
    surprise: 'avalanche',
    warn: 'THE MOUNTAIN GROANS...',
    intro: ['MY STAFF HAS BROKEN A THOUSAND HEROES', 'I MEDITATE ON THE PERFECT SWING'],
    phase: ['INNER PEACE... SHATTERED!', 'THE STAFF SPINS FASTER NOW'],
    defeat: 'MY STAFF... STILL... SPINS...',
    bolt: 'gold',
    speed: 30
  },
  bosssr: {
    name: 'CRAZY WEAPON MAN SR.',
    patterns: ['anvils', 'charge', 'strikes', 'molten'],
    surprise: 'overheat',
    warn: 'SOMEONE LEFT THE FORGE ON HIGH',
    intro: ['WHO LEFT THE FORGE DOOR OPEN', 'I FORGED YOUR FIRST SWORD, KID'],
    phase: ['THIS HAMMER MADE EVERY BLADE YOU OWN', 'BACK IN MY DAY WE SHARED ONE ANVIL'],
    defeat: 'KEEP... YOUR EDGE... SHARP',
    bolt: 'sky',
    speed: 40
  },
  bossgrandma: {
    name: 'GRANDMA, ARMED',
    patterns: ['lob', 'sparkles', 'cookies', 'summon:crawler'],
    surprise: 'helpings',
    warn: 'A WAND CRACKLES IN THE KITCHEN...',
    intro: ['SIT DOWN, DEAR. THIS WAND STINGS', 'I CAST SPELLS BEFORE SWORDS HAD EDGES'],
    phase: ['SECOND HELPINGS... OF LIGHTNING!', 'NOBODY OUT-WANDS GRANDMA'],
    defeat: 'TAKE MY OLD WAND FOR THE ROAD',
    bolt: 'orange',
    speed: 28
  },
  bossceo: {
    name: 'THE USURPER NINJA LORD',
    patterns: ['stars', 'vanish', 'coins', 'summon:ninja'],
    surprise: 'clones',
    warn: 'A SHADOW MOVES ON THE ROOF...',
    intro: ['I TOOK THIS CASTLE ONE STAR AT A TIME', 'TEN THOUSAND SHURIKEN. ALL SHARPENED.'],
    phase: ['RAIN OF STARS!', 'NINJAS! BRING ME MORE STARS!'],
    defeat: 'THE CROWN... WAS ALWAYS... TOO TIGHT',
    bolt: 'violet',
    speed: 44
  },
  bossweapon: {
    name: 'THE SENTIENT ARMORY',
    patterns: ['swordrain', 'charge', 'graves', 'stars', 'strikes'],
    surprise: 'arsenal',
    warn: 'EVERY WEAPON YOU DROPPED IS HUMMING...',
    intro: ['I AM EVERY WEAPON YOU DROPPED', 'YOU SOLD MY COUSIN FOR SHARDS'],
    phase: ['THE RACKS ARE EMPTY. I AM THE RACKS.', 'I KNOW ALL YOUR MOVES'],
    defeat: 'EQUIP... ME...',
    bolt: 'violet',
    speed: 50
  }
};
Object.assign(BOSSES, NEW_HEADS, SIBLING_DEFS);
export const bossWarning = kind => BOSSES[kind]?.warn;
export const bossName = kind => BOSSES[kind]?.name;

const bossFloor=()=>world.map?.bossFloor??worldFloor();
// long boss fights shake loose a couple of hearts at each turning point (phase change / half health)
export function bossHearts(e) {
  for (let i = 0; i < 2; i++) world.pickups.push({ kind: 'heart', x: cx(e) - 3, y: e.y + 6, vx: (i ? 1 : -1) * (50 + Math.random() * 40), vy: -170, life: 14 });
}
const hazards = [];
const MONOCLE = 1.5; // the Fat Cat's Monocle stretches boss tells and floor warnings this much
let boss = null,
  done = false,
  outroT = 0;

// tier: how far along its world's road the level is (0..1, families.js levelTier)
export function startBoss(kind, tier = 1) {
  const D = BOSSES[kind],
    art = A.bosses[kind],
    z = world.zone,
    R = ROLES[D.role || (world.level ? 'castle' : 'classic')];
  // tough enough to need real damage, measured against the gear (not the hero's long-term growth)
  const ramp = k => (world.level ? 1 + WORLD_RAMP[k] * z : 1);
  const T = temper(world.temper); // TEMPER: tougher across the board, and THE ARMORY AWAKES on top
  const hp = Math.round(Math.max(refHP(z) * R.hp * (1 + TIER_HP * tier), baseDps() * R.secs * ramp('bossSecs')) * T.hp * T.bossHp);
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
    // crashes down into the arena on the side away from the hero
    x: world.map && cx(world.hero) > (world.map.bossLeft + world.map.bossRight) / 2 ? world.map.bossLeft + 30 : worldWidth() - 90,
    y: world.map ? world.map.bossFloor - art.h - 120 : -art.h,
    w: Math.round((art.w - 2) * 0.7),
    h: art.h - 4,
    vx: 0,
    vy: 0,
    face: -1,
    hp,
    max: hp,
    dmg: refDmg(z) * R.dmg * (1 + TIER_DMG * tier) * ramp('bossDmg') * (world.level ? HEAD_DMG[kind] || 1 : 1) * T.dmg,
    role: D.role || 'castle',
    phases: R.phases,
    speed: D.speed * R.speed * T.bossSpeed,
    haste: T.bossSpeed,
    state: 'enter',
    st: 1.2,
    stun: 0,
    kbT: 0,
    flash: 0,
    spawnT: 0,
    phase: 1,
    queue: [],
    elite: true,
    xp: (40 + z * 20) * (D.role ? 0.6 : 1.5),
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
  // End-chamber bosses wait for you; they cannot fire hazards across an unexplored map.
  if(!e.dead && world.map && cx(hero)<world.map.bossLeft-100) return;
  updateBubble(e, dt);
  e.flash = Math.max(0, e.flash - dt);
  e.white = Math.max(0, (e.white || 0) - dt);
  e.anim += dt;
  if (e.dead) {
    outroT += dt;
    e.vx = 0;
    if (Math.random() < 0.5) spark(e.x + Math.random() * e.w, e.y + Math.random() * e.h, { big: Math.random() < 0.3, col: C.orange });
    if (outroT > 2.2 && !done) {
      done = true;
      e.deathT = 0;
    }
    move(e, dt, world.platforms, {minX:world.map?.bossLeft ?? 2,maxX:world.map?.bossRight ?? worldWidth()-2});
    return;
  }
  tickStatus(e, dt);
  if (e.hp <= 0) return defeat(e);
  // phase changes at 2/3 and 1/3 (a two-phase sibling turns at half health)
  const ph = e.phases === 2 ? (e.hp < e.max / 2 ? 2 : 1) : e.hp < e.max / 3 ? 3 : e.hp < (e.max * 2) / 3 ? 2 : 1;
  if (ph > e.phase) {
    e.phase = ph;
    speak(D.phase);
    callout(`PHASE ${ph}`, W / 2, 60, C.coral, { big: true, life: 80 });
    shake(0.5);
    hitstop(0.1);
    if (D.surprise) castMove(e, D.surprise);
    // a family head's last phase: it stops to shout, then fights faster than any sibling
    if (e.role === 'castle' && ph === 3) {
      callout('THE HEAD OF THE FAMILY IS FURIOUS!', W / 2, 108, C.red, { big: true, life: 110 });
      e.queue = [];
      e.rage = true;
    }
    bossHearts(e);
    e.state = 'idle';
    e.st = 1.1;
  }
  const rate = (e.phase === 1 ? 1 : e.phase === 2 ? 1.25 : 1.5) * (e.rage ? 1.15 : 1) * (e.haste || 1);
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
      e.vx = Math.abs(cx(hero) - cx(e)) > 70 ? toward * e.speed : 0;
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
  move(e, dt, world.platforms, {dropThrough:true,minX:world.map?.bossLeft ?? 2,maxX:world.map?.bossRight ?? worldWidth()-2});
  // its body only hurts while charging or slamming
  if (e.state === 'act' && (e.pattern === 'charge' || e.slam) && overlap(e, hero)) hurtHero(e.dmg * 0.8, Math.sign(cx(hero) - cx(e)) || 1);
}

function nextPattern(e) {
  if (!e.queue.length) {
    // Fisher-Yates: each move once before repeats, never the same opener by sort accident.
    e.queue = [...e.D.patterns];
    for (let i=e.queue.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [e.queue[i],e.queue[j]]=[e.queue[j],e.queue[i]]; }
  }
  e.pattern = e.queue.shift();
  e.aimX = cx(world.hero);
  e.face = Math.sign(e.aimX - cx(e)) || 1;
  e.state = 'wind';
  e.st = e.tellT = 0.7 * (innate('monocle') ? MONOCLE : 1); // THE FAT CAT'S MONOCLE: a longer look at every tell
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
      e.vx = e.face * (210 + e.phase * 15);
      e.st = 1.3;
      break;
    case 'slam':
      e.vy = -330;
      e.onGround = false;
      e.vx = (e.aimX - cx(e)) * 1.2;
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
      for (let i = 0; i < 2; i++) spawnEnemy(arg, cx(e) + (i ? 40 : -40), bossFloor(), { wave: 3 });
      e.st = 0.8;
      break;
    case 'anvils':
    case 'swordrain':
    case 'coins':
      for (let i = 0; i < 4 + e.phase * 2; i++) {
        const x = i === 0 ? cx(hero) : (world.map?.bossLeft ?? 0) + 20 + Math.random() * ((world.map ? world.map.bossRight-world.map.bossLeft : W)-40);
        hazards.push({ kind: 'fall', x, y: -20, t: 0.8 + i * 0.12, vy: 0, dmg: e.dmg, look: name });
      }
      e.st = 1.6;
      break;
    case 'strikes':
      for (let i = 0; i < 3 + e.phase; i++) hazards.push({ kind: 'column', x: i === 0 ? cx(hero) : (world.map?.bossLeft ?? 0) + 20 + Math.random() * ((world.map ? world.map.bossRight-world.map.bossLeft : W)-40), t: 0.9 + i * 0.15, life: 0.25, dmg: e.dmg });
      e.st = 1.6;
      break;
    case 'vanish':
      castMove(e, 'vanish');
      e.st = 0.9;
      break;
    default:
      castMove(e, name);
      e.st = 1.5;
  }
}

// ---------------------------------------------------------------- themed moves
// Shared by the story bosses (as patterns and phase surprises) and the swarm bosses (waves.js
// fires their `moves` on a timer and their `surprise` at half health). Everything telegraphs.
const arenaL = () => world.map?.bossLeft ?? 8, arenaR = () => world.map?.bossRight ?? worldWidth() - 8;
const randX = () => arenaL() + 16 + Math.random() * (arenaR() - arenaL() - 32);
const strength = e => e.phase || (e.hp < e.max / 2 ? 2 : 1);
function ring(e, n, speed, dmg, col, turn = 0) {
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * Math.PI * 2;
    bolt(cx(e), cy(e) - 4, Math.cos(a) * speed, Math.sin(a) * speed, dmg, col);
  }
}
function rain(e, look, n, gap = 0.1) {
  for (let i = 0; i < n; i++) hazards.push({ kind: 'fall', x: i === 0 ? cx(world.hero) : randX(), y: -20, t: 0.8 + i * gap, vy: 0, dmg: e.dmg * 0.8, look });
}
function wave(e, dir, look, hgt, speed, delay = 0, bounces = 0) {
  hazards.push({ kind: 'wave', x: dir > 0 ? arenaL() : arenaR(), dir, t: -delay, life: 9, dmg: e.dmg * 0.9, hit: false, look, hgt, speed, bounces });
}
export const MOVES = ['graves', 'arrows', 'tide', 'shell', 'smoke', 'iai', 'petals', 'avalanche', 'molten', 'sparkles', 'cookies', 'stars',
  'vanish', 'surf', 'overheat', 'helpings', 'clones', 'arsenal', 'honk', 'volley', 'decoys', 'storm'];
// the move being cast, so its bolts know what they are (spells, shuriken) for the trophy perks
let casting = null;
const SRC_OF = { sparkles: 'magic', cookies: 'magic', stars: 'star' };
export function castMove(e, name) {
  const was = casting;
  casting = name;
  try { cast(e, name); } finally { casting = was; }
}
function cast(e, name) {
  const hero = world.hero, k = strength(e), col = C[e.D?.bolt] || C.paper;
  const say1 = s => callout(s, 0, 0, C.gold, { follow: e, life: 50 });
  switch (name) {
    case 'graves': // swords burst up out of the graves, one right under you
      for (let i = 0; i < 3 + k; i++) hazards.push({ kind: 'spike', x: i === 0 ? cx(hero) : randX(), t: 0.75 + i * 0.12, life: 0.35, dmg: e.dmg * 0.8, look: 'sword' });
      say1('RISE, SWORDS!');
      break;
    case 'arrows': // a volley of arrows from the canopy
      rain(e, 'arrow', 6 + k * 2, 0.06);
      say1('LOOSE!');
      break;
    case 'tide': // a tall wave rolls across the arena: jump it
      wave(e, Math.random() < 0.5 ? 1 : -1, 'tide', 18, 150);
      say1('TIDE!');
      break;
    case 'shell': // a turtle shell skids wall to wall
      wave(e, cx(hero) > cx(e) ? 1 : -1, 'shell', 9, 230, 0, 2 + k);
      say1('SHELL SHOCK!');
      break;
    case 'smoke': // poof: reappear behind the hero
    case 'vanish': {
      burst(cx(e), cy(e), 14, 'smoke', ['fog', 'mist', 'slate']);
      // THE OWL ARCHMAGE'S SPECTACLES: nothing gets behind you; it lands where you are looking
      const behind = cx(hero) - (hero.face || 1) * 46 * (innate('glasses') ? -1 : 1);
      if (innate('glasses')) callout('THE OWL SAW THAT!', 0, 0, C.cream, { follow: hero, life: 50 });
      e.x = Math.max(arenaL(), Math.min(arenaR() - e.w, behind - e.w / 2));
      e.face = Math.sign(cx(hero) - cx(e)) || 1;
      burst(cx(e), cy(e), 14, 'smoke', ['fog', 'mist', 'slate']);
      if (name === 'vanish') ring(e, 6 + k * 2, 110, e.dmg * 0.6, col);
      say1(name === 'vanish' ? 'NINJA VANISH!' : 'POOF!');
      break;
    }
    case 'iai': // a full-width slash at standing height: jump over it
      hazards.push({ kind: 'slash', y: bossFloor() - 8, t: 0.9, life: 0.22, dmg: e.dmg });
      if (k > 1) hazards.push({ kind: 'slash', y: bossFloor() - 40, t: 1.5, life: 0.22, dmg: e.dmg });
      say1('IAI!');
      break;
    case 'petals': // a storm of sharp cherry petals
      rain(e, 'petal', 8 + k * 2, 0.05);
      ring(e, 8, 90, e.dmg * 0.5, C.pink, Math.random());
      break;
    case 'avalanche': // snowballs roll down from both sides, one after another
      for (let i = 0; i < 1 + k; i++) wave(e, i % 2 ? -1 : 1, 'snow', 12, 140, i * 0.7);
      shake(0.4);
      say1('AVALANCHE!');
      break;
    case 'molten': // strips of the forge floor glow and then erupt
      for (let i = 0; i < 4 + k; i++) hazards.push({ kind: 'spike', x: i === 0 ? cx(hero) : randX(), t: 0.9 + i * 0.1, life: 0.6, dmg: e.dmg * 0.8, look: 'lava' });
      say1('HOT METAL!');
      break;
    case 'sparkles': // a bullet-hell bloom of wand sparkles, twice
      ring(e, 10 + k * 2, 95, e.dmg * 0.6, C.violet, Math.random());
      ring(e, 10 + k * 2, 70, e.dmg * 0.6, C.pink, Math.random());
      say1('BIBBIDI BONK!');
      break;
    case 'cookies':
      rain(e, 'cookie', 6 + k * 2, 0.08);
      say1('FRESH FROM THE OVEN!');
      break;
    case 'stars': // shuriken rings, the second one offset to fill the gaps
      ring(e, 10 + k * 2, 120, e.dmg * 0.6, C.mist);
      ring(e, 10 + k * 2, 85, e.dmg * 0.6, C.violet, Math.PI / (10 + k * 2));
      say1('SHURIKEN!');
      break;
    // ---- surprises: the twists at a phase change or half health
    case 'surf':
      wave(e, 1, 'tide', 18, 150); wave(e, -1, 'tide', 18, 150, 1.2);
      for (let i = 0; i < 2; i++) spawnEnemy('turtle', i ? arenaR() - 30 : arenaL() + 30, bossFloor(), { wave: 4 });
      say1("SURF'S UP!");
      break;
    case 'overheat':
      castMove(e, 'molten'); rain(e, 'anvils', 4 + k);
      callout('THE FORGE OVERHEATS!', W / 2, 92, C.orange, { big: true, life: 90 });
      break;
    case 'helpings':
      castMove(e, 'sparkles'); castMove(e, 'cookies');
      for (let i = 0; i < 3; i++) spawnEnemy('crawler', randX(), bossFloor(), { wave: 4 });
      break;
    case 'clones':
      castMove(e, 'vanish');
      for (let i = 0; i < 3; i++) spawnEnemy('ninja', randX(), bossFloor(), { wave: 4 });
      callout('NINJA CLONES!', W / 2, 92, C.violet, { big: true, life: 90 });
      break;
    case 'arsenal':
      castMove(e, 'graves'); castMove(e, 'stars'); rain(e, 'swordrain', 5);
      callout('THE WHOLE ARSENAL!', W / 2, 92, C.gold, { big: true, life: 90 });
      break;
    case 'honk': // Mother Goose: a shockwave honk and a second row of graves
      sfx.honk();
      shake(0.5);
      wave(e, 1, 'honk', 10, 180); wave(e, -1, 'honk', 10, 180);
      castMove(e, 'graves');
      callout('HONK OF THE GRAVES!', W / 2, 92, C.paper, { big: true, life: 90 });
      break;
    case 'volley':
      rain(e, 'arrow', 14, 0.04); ring(e, 8, 100, e.dmg * 0.5, C.orange);
      callout('ARROW STORM!', W / 2, 92, C.orange, { big: true, life: 90 });
      break;
    case 'decoys':
      castMove(e, 'smoke');
      for (let i = 0; i < 3; i++) spawnEnemy('raccoon', randX(), bossFloor(), { wave: 4 });
      callout('WHICH ONE IS REAL?', W / 2, 92, C.ice, { big: true, life: 90 });
      break;
    case 'storm':
      castMove(e, 'iai'); castMove(e, 'petals');
      callout('PETAL STORM!', W / 2, 92, C.pink, { big: true, life: 90 });
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
        burst(e.hitWall > 0 ? (world.map?.bossRight ?? worldWidth()) - 4 : (world.map?.bossLeft ?? 0) + 4, e.y + e.h / 2, 10, 'chip', ['stone', 'paper']);
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
  world.bolts.push({ x: x - 2, y: y - 2, w: 4, h: 4, vx, vy, g, dmg, col, life: 4, src: SRC_OF[casting] || shotSrc() });
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
  gainProficiency('boss');
  world.kills++;
  // a family head drops three weapons (one a standout), a fort's big sibling two, the rest one
  const n = e.role === 'castle' ? 3 : e.role === 'level' ? 1 : 2;
  for (let i = 0; i < n; i++) dropWeapon(cx(e) + (i - (n - 1) / 2) * 24, e.y + 10, makeWeapon(world.zone, { boss: true, standout: e.role === 'castle' && i === 1 ? true : null }));
  dropShards(cx(e), cy(e), Math.round({ castle: 40, fort: 20, secret: 20, level: 10 }[e.role] * (1 + stats().bossShards)));
  world.bossBeaten = e.type;
  // the Monster Book's boss pages
  const page = recordBoss(e.type);
  if (page === 'page') {
    const P = PAGES.find(p => p.kinds.includes(e.type));
    toast('card', { name: P.name, tier: 'PAGE COMPLETE', gold: true, bonus: PAGE_BONUS.bonus });
  } else if (page === 'new') toast('card', { name: e.D.name, tier: 'NEW BOSS PAGE ENTRY', gold: false });
  hazards.length = 0;
  world.bolts.length = 0;
  for (const o of [...world.enemies]) if (o !== e && !o.dead) kill(o,{dir:1});
}

// ---------------------------------------------------------------- hazards
export function updateHazards(dt) {
  const hero = world.hero, tell = innate('monocle') ? 1 / MONOCLE : 1; // a warning counts down slower
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    if (h.kind === 'fall') {
      h.t -= h.t > 0 ? dt * tell : dt;
      if (h.t <= 0) {
        h.vy += 900 * dt;
        h.y += h.vy * dt;
        if (overlap({ x: h.x - 5, y: h.y - 8, w: 10, h: 12 }, hero)) {
          hurtHero(h.dmg, Math.sign(cx(hero) - h.x) || 1, h.look === 'cookie' ? 'magic' : 'shot');
          h.y = bossFloor() + 1;
        }
        if (h.y >= bossFloor() - 4) {
          burst(h.x, bossFloor() - 2, 6, 'chip', h.look === 'coins' ? ['gold', 'cream'] : ['stone', 'fog']);
          sfx.land();
          hazards.splice(i, 1);
        }
      }
    } else if (h.kind === 'column') {
      h.t -= h.t > 0 ? dt * tell : dt;
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
      if (h.t < 0) continue;
      h.x += h.dir * (h.speed || 170) * dt;
      const hgt = h.hgt || 7;
      if (Math.random() < 0.8) emit(h.x, bossFloor() - 2, 'chip', h.look === 'tide' ? C.sky : h.look === 'snow' ? C.paper : Math.random() < 0.5 ? C.sand : C.wood);
      if (!h.hit && Math.abs(cx(hero) - h.x) < 5 + (h.look === 'tide' ? 4 : 2) && hero.y + hero.h >= bossFloor() - hgt + 2) {
        h.hit = true;
        hurtHero(h.dmg, h.dir);
      }
      // shells bounce off the arena walls a few times
      if (h.bounces && (h.x < arenaL() || h.x > arenaR())) { h.dir *= -1; h.bounces--; h.hit = false; sfx.clang(); }
      else if (h.t > h.life || h.x < arenaL() - 8 || h.x > arenaR() + 8) hazards.splice(i, 1);
    } else if (h.kind === 'spike') {
      h.t -= h.t > 0 ? dt * tell : dt;
      if (h.t <= 0) {
        if (!h.fired) {
          h.fired = true;
          sfx.land();
          burst(h.x, bossFloor() - 2, 5, 'chip', h.look === 'lava' ? ['orange', 'gold'] : ['mist', 'stone']);
        }
        if (!h.hit && Math.abs(cx(hero) - h.x) < 8 && hero.y + hero.h > bossFloor() - 24) { h.hit = true; hurtHero(h.dmg, Math.sign(cx(hero) - h.x) || 1, h.look === 'lava' ? 'lava' : null); }
        h.life -= dt;
        if (h.life <= 0) hazards.splice(i, 1);
      }
    } else if (h.kind === 'slash') {
      h.t -= h.t > 0 ? dt * tell : dt;
      if (h.t <= 0) {
        if (!h.fired) { h.fired = true; sfx.boom(0.5); shake(0.3); }
        if (!h.hit && hero.y < h.y + 2 && hero.y + hero.h > h.y - 2) { h.hit = true; hurtHero(h.dmg, 1); }
        h.life -= dt;
        if (h.life <= 0) hazards.splice(i, 1);
      }
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
          rect(x - 5, bossFloor() - 2, 11, 2, C.red);
          rect(x - 1, bossFloor() - 6, 3, 3, C.red);
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
        } else if (h.look === 'arrow') {
          rect(x - 3, y - 8, 7, 12, C.ink);
          rect(x, y - 8, 1, 9, C.wood);
          rect(x - 1, y - 8, 3, 2, C.lime);
          rect(x - 1, y + 1, 3, 2, C.mist);
        } else if (h.look === 'cookie') {
          rect(x - 4, y - 7, 9, 9, C.wood);
          rect(x - 3, y - 6, 7, 7, C.sand);
          rect(x - 1, y - 4, 1, 1, C.ink); rect(x + 2, y - 2, 1, 1, C.ink);
        } else if (h.look === 'petal') {
          rect(x - 3, y - 6, 7, 6, C.ink);
          rect(x - 2, y - 5, 5, 4, C.pink);
          rect(x - 1, y - 5, 2, 1, C.paper);
        } else {
          rect(x - 4, y - 7, 9, 4, C.stone);
          rect(x - 2, y - 3, 5, 6, C.slate);
        }
      }
    } else if (h.kind === 'column') {
      if (h.t > 0) {
        if (Math.floor(t * 14) % 2) for (let y = 20; y < bossFloor(); y += 6) rect(x, y, 1, 3, C.sky);
      } else {
        rect(x - 4, 0, 9, bossFloor(), C.ink);
        rect(x - 3, 0, 7, bossFloor(), C.sky);
        rect(x - 1, 0, 3, bossFloor(), C.paper);
      }
    } else if (h.kind === 'wave') {
      if (h.t < 0) continue;
      const f = bossFloor();
      if (h.look === 'tide') {
        rect(x - 7, f - 19, 15, 19, C.ink);
        rect(x - 6, f - 18, 13, 18, C.blue);
        rect(x - 6, f - 18, 13, 3, C.sky);
        rect(x - 4 * h.dir, f - 21, 5, 3, C.paper);
      } else if (h.look === 'shell') {
        rect(x - 6, f - 9, 13, 9, C.ink);
        rect(x - 5, f - 8, 11, 7, C.leaf);
        rect(x - 3, f - 7, 3, 2, C.lime);
      } else if (h.look === 'snow') {
        rect(x - 6, f - 12, 13, 12, C.ink);
        rect(x - 5, f - 11, 11, 10, C.paper);
        rect(x - 3, f - 9, 3, 3, C.ice);
      } else if (h.look === 'honk') {
        for (let k = 0; k < 3; k++) rect(x - h.dir * k * 4, f - 10 + k * 2, 2, 10 - k * 2, C.paper);
      } else {
        rect(x - 3, f - 7, 7, 7, C.ink);
        rect(x - 2, f - 6, 5, 6, C.sand);
        rect(x - 1, f - 9, 3, 3, C.wood);
      }
    } else if (h.kind === 'spike') {
      const f = bossFloor(), hot = h.look === 'lava';
      if (h.t > 0) {
        if (Math.floor(t * 12) % 2) rect(x - 5, f - 2, 11, 2, hot ? C.orange : C.red);
      } else if (hot) {
        rect(x - 5, f - 26, 11, 26, C.ink);
        rect(x - 4, f - 25, 9, 25, C.orange);
        rect(x - 2, f - 25, 5, 25, C.gold);
      } else {
        rect(x - 2, f - 25, 5, 25, C.ink);
        rect(x - 1, f - 24, 3, 18, C.mist);
        rect(x - 4, f - 7, 9, 2, C.gold);
        rect(x - 1, f - 5, 3, 5, C.wood);
      }
    } else if (h.kind === 'slash') {
      const L = arenaL(), R = arenaR(), y = Math.round(h.y);
      if (h.t > 0) {
        if (Math.floor(t * 14) % 2) for (let sx = L; sx < R; sx += 8) rect(sx, y, 4, 1, C.coral);
      } else {
        rect(L, y - 2, R - L, 5, C.ink);
        rect(L, y - 1, R - L, 3, C.paper);
        rect(L, y, R - L, 1, C.pink);
      }
    }
  }
}

export function drawBoss(e, t) {
  const art = A.bosses[e.type];
  const sx = Math.round(cx(e) - art.w / 2),
    sy = Math.round(e.y + e.h - (art.h - 3));
  if (e.dead && Math.floor(t * 20) % 2) return;
  const f = e.flash > 0 ? 2 : Math.floor(e.anim * 2) % 2;
  frame(e.white > 0 ? tinted(art.im, C.paper) : art.im, f, art.w, art.h, sx + jitter(e), sy, e.face < 0);
  if (e.state === 'wind') {
    const label = { charge: 'DASH THROUGH', slam: 'JUMP / DASH', stomp: 'JUMP', fan: 'FIND THE GAP', toss: 'KEEP MOVING', summon: 'CLEAR ADDS', strikes: 'MOVE OFF MARKS', tide: 'JUMP THE WAVE', shell: 'JUMP THE SHELL', avalanche: 'JUMP THE SNOWBALLS', stars: 'FIND THE GAP', sparkles: 'FIND THE GAP', vanish: 'WATCH YOUR BACK', iai: 'JUMP!' }[e.pattern.split(':')[0]] || 'MOVE OFF MARKS';
    text(label, cx(e), sy - 30, C.gold, {align:'center'});
    if (e.pattern === 'charge') for(let x=cx(e); x>(world.map?.bossLeft ?? 2) && x<(world.map?.bossRight ?? worldWidth()-2); x+=e.face*6) rect(x, e.y+e.h-2, 3, 1, C.coral);
  }
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
