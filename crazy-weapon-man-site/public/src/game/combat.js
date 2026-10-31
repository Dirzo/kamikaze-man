// Hit resolution: every hit on an enemy goes through hitEnemy(), every hit on the hero through
// hurtHero(). Knockback is a fixed push (arcade style): a short free slide then friction.
import { C, HERO } from '../config.js';
import { world, newId } from './world.js';
import { spark, damageNumber, heroDamageNumber, shake, hitstop, burst, emit, callout, feel, bleed, kick, zoomPunch, slowmo, impactFrame } from './fx.js';
import { hitFeel, reaction, killLaunch, rushMult, MOVE, FIGHT, fightMult, POLISH, POISE, hasPoise, poiseHit, materialOf } from '../data/feel.js';
import { sfx, duck } from '../engine/audio.js';
import { makeWeapon, noWeaker, hitDamage } from './loot.js';
import { cx, cy, overlap } from './physics.js';
import { ELEMENTS } from '../data/weapons.js';
import { LINES } from '../data/enemies.js';
import { gainXp, gainProficiency } from './progress.js';
import { say } from './bubbles.js';
import { comboHit } from './waves.js';
import { logDamage } from './speedrun.js';
import { BOSS_TOUGH } from '../data/swarm.js';
import { abilityKill, abilityBlock, abilityHurt, bigFoeMult } from './abilities.js';
import { heroStats, foeMult, innate } from './perks.js';
import { stats } from '../data/meta.js';
import { buck } from './mount.js';
import { recordKill, CARD_TIERS, CARDS } from '../data/book.js';
import { toast } from './progress.js';
import { ENEMIES } from '../data/enemies.js';
import { alertPack } from './enemy.js';
import { beastHit, beastDeath, beastPush, beastGuard, beastTaken } from './beastkin.js';
import { modOn, temper } from '../data/temper.js';
import { KILL_PAY } from '../data/maps.js';
import { emote } from './faces.js';

const KB_SLIDE = 0.1;
const pickLine = a => a[Math.floor(Math.random() * a.length)];
let lastStopAt = -9;
// hits landed close together: each one plays a step higher (audio pitch), up to 8
let streakN = 0, streakAt = -9;
function streak() {
  const t = feel.frame / 60;
  streakN = t - streakAt < 0.6 ? Math.min(8, streakN + 1) : 0;
  streakAt = t;
  return streakN;
}

// the field combo: live out on the route (the survival swarm keeps its own, waves.js)
const fieldCombo = () => (world.director?.phase === 'survive' ? null : world.fight?.n > 0 && world.fight.t > 0 ? world.fight : null);
function fightHit(o) {
  if (world.director?.phase === 'survive') return;
  const f = (world.fight ||= { n: 0, t: 0, best: 0 }), h = world.hero;
  if (f.t <= 0) f.n = 0;
  f.n++;
  f.best = Math.max(f.best, f.n);
  f.t = FIGHT.window;
  if (!o.special) h.specialCd = Math.max(0, h.specialCd - FIGHT.cut);
  if (f.n === 10 || f.n === 20 || f.n === 40) callout(`${f.n} HITS!`, 0, 0, C.gold, { follow: h, life: 40 });
}
export function updateFight(dt) {
  const f = world.fight;
  if (f && f.t > 0 && (f.t -= dt) <= 0) f.n = 0;
}

// o: { crit, dir, knock (px), hop, element (family), special, big (a finisher), chain, chip (small/no-feedback
// hit), aoe (an area augment's hit: starts no more area hits), nova, col }
export function hitEnemy(e, dmg, o = {}) {
  if (!e || e.dead || e.hp <= 0 || e.spawnT > 0) return 0;
  const hero = world.hero;
  const dir = o.dir || Math.sign(cx(e) - cx(hero)) || 1;
  if (e.asleep) wake(e);
  e.calm = false; // a peaceful resident fights back once hit
  if (e.kind === 'mimic' && e.disguised) reveal(e);
  // shields block from the front unless it's a crit or a special
  // a phasing ghost, a parrying swan: no damage, but the swing still keeps the field combo going
  // and charges the special, which is what cracks a shell or a guard
  if (e.kind === 'beast' && beastGuard(e, dir, o)) {
    if (!o.chip && !e.hidden) fightHit(o);
    return 0;
  }
  if ((e.kind === 'shield' || e.d?.block) && !o.crit && !o.special && !o.chip && e.face === -dir && e.state !== 'attack' && !innate('broadhead')) {
    dmg *= 0.2;
    if (!o.chain) {
      callout('CLANG', 0, 0, C.ice, { follow: e, life: 40 });
      sfx.clang();
      spark(cx(e) - dir * e.w * 0.4, cy(e), { col: C.ice });
    }
    o = { ...o, knock: (o.knock || 0) * 0.3 };
  }
  // TEMPER: WARDED: the ward takes the first real hit whole
  if (e.ward && !o.chip) {
    e.ward = 0;
    callout('WARD BROKEN', 0, 0, C.violet, { follow: e, life: 40 });
    sfx.clang();
    burst(cx(e), cy(e), 10, 'twinkle', ['violet', 'ice']);
    e.calm = false;
    return 0;
  }
  dmg *= bigFoeMult(e) * foeMult(e) * (e.kind === 'beast' ? beastTaken(e) : 1); // a flipped Spin Turtle takes double
  // RUSH: hits at speed land harder (data/feel.js); the first one out of a full sprint shouts it
  const rush = rushMult(hero.mom || 0, heroStats().rush, !!(e.elite || e.boss || e.swarmBoss));
  dmg *= rush;
  if (rush > 1 && hero.sprint && !o.chip && !o.chain && world.t > (hero.rushCall || 0)) {
    callout('RUSH!', 0, 0, C.sky, { follow: e, life: 30 });
    hero.rushCall = world.t + 0.8;
  }
  // the field combo (data/feel.js FIGHT): hits strung together land harder, a special cashes it in
  const fc = fieldCombo();
  if (fc) dmg *= fightMult(fc.n, !!o.special);
  // EXECUTION: a foe whose poise broke takes the next real hit many times over
  const exec = e.broken > 0 && !o.chip && !o.chain && !o.aoe && !o.echo && hasPoise(e);
  if (exec) dmg *= POISE.exec;
  // bosses shrug off any single hit bigger than a sliver of their health (see BOSS_TOUGH)
  if (e.boss || e.swarmBoss) dmg = Math.min(dmg, e.max * BOSS_TOUGH.hitCap);
  dmg = Math.max(1, Math.round(dmg));
  logDamage(Math.min(dmg, Math.max(0, e.hp)));
  e.hp -= dmg;
  e.flash = e.boss ? 0.05 : 0.12;
  // THE YAK ABBOT'S FROST BEADS: now and then a hit chills the foe to half speed
  if (!o.chip && heroStats().chillHit && Math.random() < heroStats().chillHit) e.chill = Math.max(e.chill || 0, 1.6);
  damageNumber(e, dmg, { crit: o.crit, chip: o.chip, col: o.col });
  const F = hitFeel(hero.weapon?.type, { crit: o.crit, big: o.big || o.plunge, chain: o.chain || o.aoe || o.echo });
  o = { ...o, weight: F.w };
  if (!o.chip) {
    // the white flash: a pure white cut-out for the first frames (held through the freeze), then
    // the hurt frame; the victim jitters while the world is frozen
    e.white = 0.05;
    e.jitAt = performance.now();
    e.jitFor = F.stop * 1000 + 20;
    const sy = Math.max(e.y + 4, Math.min(e.y + e.h - 4, hero.y + hero.h * 0.45));
    spark(cx(e) - dir * e.w * 0.35, sy, { crit: o.crit, col: o.sparkCol || C.cream });
    if (o.crit) burst(cx(e) - dir * e.w * 0.35, sy, 7, 'twinkle', ['gold', 'pink', 'orange', 'paper']);
    if (!e.d?.bloodless) bleed(cx(e), sy, dir, (o.crit ? 9 : 4) + F.w * 2, e.onGround ? e.y + e.h : null);
    e.faceUntil = world.t + 0.42;
    e.funnyFace = ((e.funnyFace || 0) + 1) % 3;
    sfx.hit(o.crit, o.chain ? null : hero.weapon?.type, o.chain ? 0 : streak()); // the weapon's signature sound
    sfx.thud(o.crit, e.type === 'goose');
    if (!o.chain) sfx.mat(materialOf(e.type), F.w, o.crit); // what it's made of: fur, shell, scale...
    if (!e.boss && world.t > (e.nextBonk || 0)) {
      callout(['BONK!', 'OOF!', 'PLOP!'][e.funnyFace], 0, 0, C.cream, {follow:e, life:22});
      e.nextBonk = world.t + 0.65;
    }
    // the freeze and the camera kick scale with the weapon's weight (data/feel.js); light hits in a
    // crowd only freeze every 0.13 s so a pack doesn't stutter
    const now = feel.frame / 60, heavy = 1 + heroStats().impact; // HEAVY IMPACT: longer freeze, bigger shake
    if (o.crit || o.big || e.boss || now - lastStopAt > 0.13) {
      hitstop(F.stop * heavy);
      lastStopAt = now;
    }
    if (!o.chain && !o.aoe) kick(dir, F.kick * (heavy > 1 ? 1.3 : 1));
    if (o.crit) shake(0.32 * heavy);
    if ((o.crit || o.big) && !o.chain && !o.aoe) duck(o.big ? 0.5 : 0.35, 0.3);
    if (o.big && !o.chain) {
      // FINISHER: a zoom punch, ground dust for blunt weapons, a slash streak for blades
      zoomPunch(0.025);
      if (F.w >= 2 && e.onGround) for (let i = -5; i <= 5; i++) emit(cx(e) + i * 4, e.y + e.h - 1, 'dust', i % 2 ? C.sand : C.mist);
      else for (let x = -20; x <= 20; x += 2) emit(cx(e) + x, sy + x * 0.25 * -dir, 'streak', x % 4 ? C.paper : o.sparkCol || C.cream);
    }
  }
  if (!o.chip) comboHit(), fightHit(o);
  if (exec) execute(e, dir);
  else if (!o.chip && hasPoise(e) && e.hp > 0) wearPoise(e, F.w, o);
  // knockback + reaction (not bosses): light hits flinch, heavy weapons and finishers launch the
  // foe so you can juggle it (data/feel.js reaction)
  if (!e.boss && !e.swarmBoss) {
    const R = reaction(F.w, { big: o.big || o.hop, crit: o.crit, elite: e.elite, chip: o.chip });
    let push = (o.knock || 0) * (1 + heroStats().impact * 0.5 + heroStats().knock); // HEAVY IMPACT / KNOCKOUT
    if (e.kind === 'beast') beastHit(e), (push = beastPush(e, push));
    if (o.crit) push *= 1.35;
    if (e.elite) push *= 0.75;
    if (world.t - (e.lastHitAt || -9) < 0.3 && !o.crit) push *= 0.75;
    if (push > 0) {
      e.vx = (dir * push) / (KB_SLIDE + 0.06);
      e.kbT = KB_SLIDE;
      const heavy = e.d?.heavy && !o.big && !o.crit;
      e.stun = Math.max(e.stun, R.stun * (heavy ? 0.3 : 1));
      e.face = -dir;
      if (!e.air && !o.chain && !o.aoe) {
        if (e.juggle && !e.onGround) e.vy = Math.min(e.vy, -100); // already up: keep it up
        else if (R.launch && !heavy) {
          e.vy = -R.launch;
          e.onGround = false;
          e.juggle = true;
        }
      } else if (!e.air && o.hop) {
        e.vy = -110;
        e.onGround = false;
      }
    }
    if (e.state === 'wind' && (o.crit || o.special || o.big || (F.w >= 2 && !e.d?.heavy))) e.state = 'idle'; // big hits interrupt wind-ups
    if (e.calm === false && !e.packAlerted) alertPack(e);
  }
  e.lastHitAt = world.t;
  if (o.element && !o.chip) {
    applyElement(e, dmg, o);
    // shard tree keystones: a chance to also strike with another element
    if (!o.chain) for (const [el, p] of Object.entries(heroStats().infuse)) if (el !== o.element && Math.random() < p) applyElement(e, dmg, { ...o, element: el });
  }
  if (!o.chip && !o.chain && !o.aoe) areaHits(e, dmg, o);
  // ECHO SLASH: a ghostly second strike
  if (!o.chip && !o.chain && !o.aoe && !o.echo && e.hp > 0 && Math.random() < heroStats().echo) {
    burst(cx(e), cy(e), 4, 'ghost', ['violet', 'mist']);
    spark(cx(e) + dir * 3, cy(e) - 3, { col: C.violet });
    hitEnemy(e, dmg * 0.6, { ...o, echo: true, chain: true, crit: false, col: C.violet, sparkCol: C.violet });
  }
  // TEMPER: ENRAGED: wounded foes see red
  if (e.hp > 0 && e.hp < e.max / 2 && !e.enraged && !e.boss && modOn(world.temper, 'enraged')) {
    e.enraged = true;
    e.dmg *= 1.3;
    e.speed *= 1.15;
    callout('ENRAGED!', 0, 0, C.red, { follow: e, life: 40 });
  }
  if (e.hp <= 0) kill(e, o);
  return dmg;
}

// ---------------------------------------------------------------- poise and executions (data/feel.js POISE)
function wearPoise(e, w, o) {
  if (e.broken > 0) return;
  e.poise = (e.poise ?? POISE.max) - poiseHit(w, { big: o.big, crit: o.crit, plunge: o.plunge }) * (o.chain || o.aoe || o.echo ? 0.4 : 1);
  if (e.poise > 0) return;
  // BROKEN: it reels, open for an execution
  e.broken = POISE.broken;
  e.stun = Math.max(e.stun || 0, POISE.broken);
  if (e.state === 'wind' || e.state === 'attack') e.state = 'idle';
  callout('BROKEN!', 0, 0, C.gold, { follow: e, life: 45 });
  sfx.poiseBreak();
  burst(cx(e), cy(e), 10, 'twinkle', ['gold', 'paper', 'orange']);
  hitstop(0.07);
  shake(0.3);
}
function execute(e, dir) {
  e.broken = 0;
  e.poise = POISE.max;
  e.stun = Math.min(e.stun, 0.3);
  hitstop(POISE.execStop);
  impactFrame(2);
  zoomPunch(0.04);
  shake(0.5);
  duck(0.6, 0.45);
  sfx.execute();
  callout('EXECUTED!', 0, 0, C.red, { follow: e, life: 50 });
  for (let x = -26; x <= 26; x += 2) emit(cx(e) + x, cy(e) - x * 0.4 * dir, 'streak', x % 4 ? C.paper : C.red);
  dropShards(cx(e), cy(e), POISE.shards);
  if (world.run) world.run.execs = (world.run.execs || 0) + 1;
}
// poise comes back once a foe has gone a while without being hit; a broken foe recovers
export function tickPoise(e, dt) {
  if (e.broken > 0) e.broken = Math.max(0, e.broken - dt);
  if (e.poise != null && e.poise < POISE.max && !(e.broken > 0) && world.t - (e.lastHitAt ?? -9) > POISE.regenAfter) e.poise = Math.min(POISE.max, e.poise + dt * 4);
}

// ---------------------------------------------------------------- wall slams and bowling
// a foe knocked (or a body thrown) fast enough into a wall slams off it, and into another foe
// bowls it over; each takes a share of a hit (POLISH.slam). vx0: its speed before this step
export function knockCollide(e, vx0, dead = false) {
  const S = POLISH.slam, h = world.hero;
  if (Math.abs(vx0) < S.minV || !h?.weapon || world.t < (e.slamAt ?? -9) + S.every) return;
  const base = hitDamage(h.weapon), dir = Math.sign(vx0);
  if (!dead && e.hitWall && !e.boss) {
    e.slamAt = world.t;
    hitEnemy(e, base * S.wall, { dir: -dir, chain: true, slam: true });
    if (!e.dead) (e.vx = -vx0 * 0.35), (e.kbT = 0.08);
    callout('SLAM!', 0, 0, C.orange, { follow: e, life: 30 });
    sfx.slam();
    burst(cx(e) + dir * e.w * 0.5, cy(e), 6, 'dust', ['mist', 'fog', 'stone']);
    shake(0.3);
    return;
  }
  for (const o of world.enemies) {
    if (o === e || o.dead || o.boss || o.swarmBoss || o.spawnT > 0 || o.calm || world.t < (o.slamAt ?? -9) + S.every || !overlap(e, o)) continue;
    o.slamAt = e.slamAt = world.t;
    hitEnemy(o, base * S.bowl, { dir, knock: 22, chain: true, slam: true });
    if (!dead) e.vx = vx0 * 0.5;
    callout('BOWLED!', 0, 0, C.orange, { follow: o, life: 28 });
    sfx.slam();
    burst(cx(o), cy(o), 4, 'chip', ['paper', 'mist']);
    break;
  }
}

// ---------------------------------------------------------------- area augments (shard tree)
// the living foes around a point, nearest first
function around(x, y, r, not = null) {
  r *= 1 + heroStats().aoeSize; // BIG BOOMS
  return world.enemies
    .filter(n => n !== not && !n.dead && n.spawnT <= 0 && Math.abs(cx(n) - x) < r + n.w / 2 && Math.abs(cy(n) - y) < 30 + n.h / 2)
    .sort((a, b) => Math.abs(cx(a) - x) - Math.abs(cx(b) - x));
}
const AREA_MAX = 8; // foes one area effect can reach
// RIPPLE / WIDE CLEAVE / FRAG SHOTS splash part of a hit onto its neighbours; WHIRLWIND / SHOCKWAVE
// turn a finisher or special into a ring around the hero
function areaHits(e, dmg, o) {
  const S = heroStats(), h = world.hero;
  if (S.splash > 0) {
    const ns = around(cx(e), cy(e), 34, e).slice(0, AREA_MAX);
    if (ns.length) burst(cx(e), cy(e), 6, 'spark', ['orange', 'gold', 'paper']);
    for (const n of ns) hitEnemy(n, dmg * S.splash, { aoe: true, dir: Math.sign(cx(n) - cx(e)) || 1, knock: 6, sparkCol: C.orange, col: C.gold });
  }
  if (S.wave > 0 && h && (o.big || o.special) && world.t - (world.lastWave ?? -9) > 0.3) {
    world.lastWave = world.t;
    const x = cx(h), y = h.y + h.h;
    const wr = 52 * (1 + S.aoeSize);
    for (let i = -6; i <= 6; i++) emit(x + (i * wr) / 6, y - 2, 'dust', i % 2 ? C.mist : C.paper);
    spark(x - wr, y - 6, { big: true, col: C.orange });
    spark(x + wr, y - 6, { big: true, col: C.orange });
    shake(0.25);
    sfx.thud(true);
    for (const n of around(x, cy(h), 56, e).slice(0, AREA_MAX)) hitEnemy(n, dmg * S.wave, { aoe: true, dir: Math.sign(cx(n) - x) || 1, knock: 22, hop: true, sparkCol: C.orange, col: C.gold });
  }
}
// SHARD NOVA / AFTERSHOCK / SCATTER BURST: a kill bursts into shards that hit the foes around it
// for part of the fallen foe's health (a nova's own kills don't nova again)
function nova(e, o) {
  const p = heroStats().nova;
  if (!(p > 0) || o.nova) return;
  const x = cx(e), y = cy(e), ns = around(x, y, 44, e).slice(0, AREA_MAX);
  burst(x, y, 10, 'chip', ['ice', 'sky', 'violet']);
  for (const n of ns) {
    zap(x, y, cx(n), cy(n), C.ice);
    hitEnemy(n, e.max * p, { aoe: true, nova: true, dir: Math.sign(cx(n) - x) || 1, knock: 14, sparkCol: C.ice, col: C.ice });
  }
}

function applyElement(e, dmg, o) {
  const el = ELEMENTS[o.element];
  if (!el) return;
  sfx.element(el.effect);
  const col = C[el.col];
  switch (el.effect) {
    case 'burn':
      e.burn = { t: 2, dmg: Math.max(1, dmg * 0.12), tick: 0.5 };
      break;
    case 'venom':
      e.venom = { t: 3, stacks: Math.min(5, (e.venom ? e.venom.stacks : 0) + 1), dmg: Math.max(1, dmg * 0.06), tick: 0.5 };
      break;
    case 'chill':
      e.chill = 1.6;
      break;
    case 'chain':
      if (!o.chain) {
        const near = world.enemies
          .filter(n => n !== e && !n.dead && Math.abs(cx(n) - cx(e)) < 70 && Math.abs(cy(n) - cy(e)) < 50)
          .sort((a, b) => Math.abs(cx(a) - cx(e)) - Math.abs(cx(b) - cx(e)))
          .slice(0, 2);
        for (const n of near) {
          zap(cx(e), cy(e), cx(n), cy(n), col);
          hitEnemy(n, dmg * 0.4, { chain: true, dir: Math.sign(cx(n) - cx(e)) || 1, knock: 6, sparkCol: col });
        }
      }
      break;
    case 'wave':
      if (!e.boss) e.vx *= 1.7;
      for (let i = 0; i < 4; i++) emit(cx(e), cy(e), 'drip', C.sky);
      break;
    case 'stun':
      if (Math.random() < 0.25 && !e.boss) {
        e.stun = Math.max(e.stun, 0.7);
        callout('STUNNED', 0, 0, C.sand, { follow: e, life: 36 });
      }
      break;
    case 'gust':
      if (!e.boss && !e.air) {
        e.vy = -150;
        e.onGround = false;
      }
      break;
    case 'holy':
      if (o.crit) world.hero.hp = Math.min(world.hero.maxHp, world.hero.hp + Math.ceil(world.hero.maxHp * 0.02));
      break;
    case 'pull':
      for (const n of world.enemies)
        if (n !== e && !n.dead && !n.boss && Math.abs(cx(n) - cx(e)) < 60) {
          n.vx = Math.sign(cx(e) - cx(n)) * 140;
          n.kbT = 0.08;
        }
      break;
  }
}

// pixel lightning between two points
export function zap(x0, y0, x1, y1, col) {
  const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 4));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    emit(x0 + (x1 - x0) * t + (Math.random() - 0.5) * 4, y0 + (y1 - y0) * t + (Math.random() - 0.5) * 4, 'spark', i % 2 ? col : C.paper);
  }
}

// damage over time ticks (burn, venom) — called from the enemy update
export function tickStatus(e, dt) {
  for (const k of ['burn', 'venom', 'rash']) {
    const s = e[k];
    if (!s) continue;
    s.t -= dt;
    s.tick -= dt;
    if (s.tick <= 0) {
      s.tick = 0.5;
      const d = k === 'venom' ? s.dmg * s.stacks : s.dmg;
      const col = k === 'burn' ? C.orange : k === 'rash' ? C.rust : C.lime;
      hitEnemy(e, d, { chip: true, col });
      emit(cx(e), e.y + 2, k === 'burn' ? 'ember' : k === 'rash' ? 'dot' : 'bubble', col);
    }
    if (s.t <= 0) e[k] = null;
  }
  if (e.chill > 0) {
    e.chill -= dt;
    if (Math.random() < 0.15) emit(e.x + Math.random() * e.w, e.y + Math.random() * e.h, 'frost', C.ice);
  }
}

export function wake(e) {
  e.asleep = false;
  e.state = 'idle';
  e.wakeT = 0.4;
  say(e, pickLine(LINES.wake), 2.4, true);
  callout('!', 0, 0, C.gold, { follow: e, life: 30 });
}
function reveal(e) {
  e.disguised = false;
  e.state = 'idle';
  say(e, pickLine(LINES.mimic), 1.6, true);
  sfx.enemyMelee();
}

// the last foe of a real fight: slow motion and a zoom as it falls, then a burst of speed out of
// the fight and back into the run (Sonic)
function lastKill(e) {
  const h = world.hero, P = POLISH.clear;
  if (!h || world.director?.phase === 'survive' || !(world.fight?.n >= P.minHits)) return;
  if (world.enemies.some(o => o !== e && !o.dead && !o.calm && !o.boss && o.spawnT <= 0 && Math.abs(cx(o) - cx(h)) < P.near && Math.abs(cy(o) - cy(h)) < 110)) return;
  slowmo(P.slow, P.slowK);
  zoomPunch(P.zoom);
  sfx.clearFight();
  callout('CLEAR!', 0, 0, C.sky, { follow: h, life: 40 });
  h.boostT = Math.max(h.boostT || 0, 0.7);
  h.mom = Math.max(h.mom || 0, MOVE.sprintAt);
  h.ghostT = Math.max(h.ghostT || 0, 0.5);
  if (world.run) world.run.clears = (world.run.clears || 0) + 1;
}

// a defeated resident falls over (its DEATHS style, drawn in enemy.js) for DEATH_T seconds, and
// with SHATTER_T left its body bursts into the shards it was carrying
export const DEATH_T = 0.8, SHATTER_T = 0.22;
export function kill(e, o = {}) {
  if (e.dead || e.boss) return; // bosses handle their own defeat (bosses.js)
  e.dead = true;
  e.deathT = DEATH_T;
  e.fallDir = o.dir || Math.sign(cx(e) - cx(world.hero)) || 1;
  const floorY = e.onGround ? e.y + e.h : null;
  // OVERKILL: the harder the killing blow, the further the body flies (and spins, and bounces off walls)
  const L = killLaunch(Math.max(0, -e.hp) / (e.max || 1), o.weight ?? 0, o.big);
  e.vx = e.fallDir * L.vx;
  e.launched = L.launched && !e.air;
  if (!e.air) (e.vy = L.vy), (e.onGround = false);
  if (!e.d?.bloodless) bleed(cx(e), cy(e), e.fallDir, e.elite ? 16 : 10, floorY);
  world.kills++;
  emote(world.hero, 'smirk', e.elite ? 0.9 : 0.5); // got him
  sfx.die(e.type, e.elite);
  sfx.crunch(o.weight ?? 1);
  burst(cx(e), cy(e), e.elite ? 14 : 8, 'chip', ['paper', 'mist', 'fog']);
  if (e.elite) {
    hitstop(0.08);
    shake(0.45);
    duck(0.55, 0.45);
  }
  if (e.sleeper) say(e, pickLine(LINES.last), 1.4, true);
  if (world.run && !e.swarm && !e.boss && !e.swarmBoss) world.run.residentKills++; // the level-clear tally
  if (world.hero && world.hero.mom > 0.3) world.hero.mom = Math.min(1, world.hero.mom + MOVE.killMomentum); // a kill at speed feeds the run
  // a kill at speed gives the dash back
  if (world.hero && world.hero.mom >= POLISH.speedKill && world.hero.dashCd > 0) (world.hero.dashCd = 0), emit(cx(world.hero), world.hero.y + 4, 'twinkle', C.sky);
  if (!e.swarm) lastKill(e);
  const pay = e.swarm ? 1 : KILL_PAY(world.zone); // stages hold fewer residents than they used to, each pays more
  gainXp(Math.round(e.xp * pay));
  gainProficiency(e.elite ? 'elite' : 'normal');
  abilityKill();
  nova(e, o);
  bookKill(e);
  // loot: the shards come out of the body when it shatters (shatter below)
  const zone = world.zone;
  e.shardLoot = Math.round((e.elite ? 6 : 1 + (Math.random() < 0.4 ? 1 : 0)) * (e.golden ? 4 : 1) * pay); // a secret room's golden pack pays four times
  world.killsSinceDrop = (world.killsSinceDrop || 0) + 1;
  // (10 kills / 7%: was 7 / 10% before maps held 40+ residents, so weapons keep the same pace)
  if (world.killsSinceDrop >= Math.round(10 / pay) || Math.random() < (e.elite ? 0.65 : 0.07 * pay)) dropWeapon(cx(e), e.y, makeWeapon(zone, { elite: e.elite }));
  if (Math.random() < ((e.elite ? 0.4 : 0.035) + stats().hearts) * temper(world.temper).hearts) world.pickups.push({ kind: 'heart', x: cx(e) - 3, y: cy(e), vx: (Math.random() - 0.5) * 40, vy: -120, life: 14 });
  if (e.kind === 'bomb') explode(cx(e), cy(e), e.dmg, true);
  if (e.kind === 'beast') beastDeath(e);
  // TEMPER: VENGEFUL: a ring of slow bolts from the fallen
  if (modOn(world.temper, 'vengeful') && !e.swarm && !e.eaten) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      world.bolts.push({ x: cx(e) - 2, y: cy(e) - 2, w: 4, h: 4, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, dmg: e.dmg * 0.4, col: C.violet, life: 1.6 });
    }
  }
}
// the Monster Book: every resident's kill fills in its card; a new tier gets a toast
function bookKill(e) {
  if (!CARDS[e.type] || e.escaped) return;
  const tier = recordKill(e.type, e.golden ? 3 : 1);
  if (tier < 0) return;
  sfx.card(tier);
  world.cardUps.push({ type: e.type, tier });
  toast('card', { name: ENEMIES[e.type].name.toUpperCase(), tier: CARD_TIERS[tier], gold: tier === CARD_TIERS.length - 1, bonus: CARDS[e.type].bonus });
}

// the fallen body bursts into crystal: a flash, flying shard chips and sparkles, then the shards
// themselves pop out for the magnet to pull in
export function shatter(e) {
  if (e.shattered) return;
  e.shattered = true;
  const x = cx(e), y = cy(e), big = e.elite || !!e.scale;
  spark(x, y, { big, col: C.ice });
  burst(x, y, big ? 22 : 12, 'chip', ['ice', 'sky', 'paper', 'violet']);
  burst(x, y, big ? 10 : 6, 'twinkle', ['ice', 'paper', 'sky']);
  burst(x, y, 4, 'mote', ['sky', 'ice']);
  sfx.shatter(big);
  if (e.shardLoot) dropShards(x, y, e.shardLoot);
  e.shardLoot = 0;
}

export function dropWeapon(x, y, w) {
  world.killsSinceDrop = 0;
  noWeaker(w);
  if (world.drops.length >= 8) world.drops.shift();
  world.drops.push({ id: newId(), x: x - 6, y: y - 6, w: 12, h: 8, vx: (Math.random() - 0.5) * 50, vy: -150, item: w, life: 40, t: 0 });
  sfx.loot(w.q);
}
// n pickups worth `total` shards between them (one each by default)
export function dropShards(x, y, n, total = n) {
  for (let i = 0; i < n; i++)
    world.pickups.push({ kind: 'shard', x: x - 2, y: y - 2, vx: (Math.random() - 0.5) * 90, vy: -100 - Math.random() * 80, life: 20, value: Math.floor(total / n) + (i < total % n ? 1 : 0) });
}

// explosion: hurts the hero and (if `friendly`) other enemies; big pixel burst, no circles
export function explode(x, y, dmg, friendly = false, radius = 34) {
  sfx.boom(1);
  shake(0.55);
  hitstop(0.05);
  spark(x, y, { big: true, col: C.orange });
  burst(x, y, 16, 'chip', ['orange', 'gold', 'red', 'paper']);
  burst(x, y, 6, 'smoke', ['stone', 'fog']);
  const hero = world.hero;
  if (Math.abs(cx(hero) - x) < radius && Math.abs(cy(hero) - y) < radius) hurtHero(dmg, Math.sign(cx(hero) - x) || 1);
  if (friendly)
    for (const e of world.enemies)
      if (!e.dead && Math.abs(cx(e) - x) < radius && Math.abs(cy(e) - y) < radius) hitEnemy(e, dmg * 2, { dir: Math.sign(cx(e) - x) || 1, knock: 30, hop: true });
}

// PERFECT DODGE: a dash (or the moment after one) that a real attack passes through. Once per dash:
// slow motion, a free dash, a burst of momentum and a chunk off the special's cooldown
const dodging = h => h.dashT > 0 || (h.inv > 0 && world.t - (h.dashAt ?? -9) < HERO.dashTime + POLISH.dodge.window);
function perfectDodge(h) {
  if (h.dodged) return;
  const P = POLISH.dodge;
  h.dodged = true;
  slowmo(P.slow, P.slowK);
  h.dashCd = 0;
  h.mom = Math.min(1, (h.mom || 0) + P.mom);
  h.specialCd = Math.max(0, h.specialCd - P.specialCut);
  h.ghostT = Math.max(h.ghostT || 0, 0.35);
  zoomPunch(0.02);
  sfx.perfect();
  callout('PERFECT!', 0, 0, C.sky, { follow: h, life: 40 });
  burst(cx(h), cy(h), 10, 'twinkle', ['sky', 'paper', 'ice']);
  if (world.run) world.run.dodges = (world.run.dodges || 0) + 1;
}

// what a bolt counts as when nothing says otherwise: the wand cottage's are spells, the ninja
// castle's are shuriken
export const shotSrc = () => (world.zone === 7 ? 'magic' : world.zone === 8 ? 'star' : 'shot');
// src says what hit you, for the trophy perks that soften it: 'shot' (a bolt or something thrown),
// 'magic' (a spell: also a shot), 'star' (a shuriken: also a shot) or 'lava'. Enemy bolts set
// world.hitBy while they fly (enemy.js updateBolts) instead of passing it.
export function hurtHero(dmg, dir = 1, src = world.hitBy) {
  const h = world.hero;
  if (h && !h.dead && dodging(h)) return src !== 'touch' && src !== 'lava' && perfectDodge(h), 0;
  if (!h || h.dead || h.cheer || h.inv > 0 || h.dashT > 0) return 0;
  if (abilityBlock(h)) return 0;
  if (h.mount) return buck(h, dir), 0; // the War Goose takes the hit: you are thrown off instead
  const S = heroStats();
  if (src === 'shot' || src === 'magic' || src === 'star') dmg *= 1 - S.shotArmor;
  if (src === 'magic') dmg *= 1 - S.magicArmor;
  if (src === 'star') dmg *= 1 - S.starArmor;
  if (src === 'lava') dmg *= 1 - S.lavaArmor;
  dmg = Math.max(1, Math.round(dmg * (1 - S.armor)));
  h.hp -= dmg;
  if (world.run) world.run.hits = (world.run.hits || 0) + 1; // the level-clear grade counts them (data/grade.js)
  h.inv = 0.8 * (1 + S.inv);
  h.hurtT = 0.25;
  // a hit costs half your momentum, not all of it (Sonic): you're back up to speed in a moment
  h.mom = (h.mom || 0) * MOVE.hurtKeep;
  h.keepMom = h.mom > 0;
  // knocked back 40px or so, unless that would throw you into a pit: then you just hop where you stand
  const land = cx(h) + dir * 40, pits = world.map?.pits?.length;
  h.vx = dir * (!pits || world.map.platforms.some(p => !p.gone && p.y >= h.y + h.h - 2 && land >= p.x && land < p.x + p.w) ? 130 : 20) * (1 - S.knockRes);
  h.vy = -120 * (1 - S.knockRes * 0.5);
  h.onGround = false;
  h.attack = null;
  heroDamageNumber(h, dmg);
  sfx.hurt();
  shake(0.4);
  hitstop(0.05);
  burst(cx(h), cy(h), 6, 'chip', ['red', 'paper']);
  if (h.hp <= 0 && h.oneUp) {
    // the golden mushroom's spare life (secrets.js)
    h.oneUp = false;
    h.hp = Math.round(h.maxHp / 2);
    h.inv = 2;
    callout('1UP!', 0, 0, C.lime, { follow: h, life: 70 });
    burst(cx(h), cy(h), 16, 'twinkle', ['lime', 'gold', 'paper']);
  }
  if (h.hp <= 0) {
    h.hp = 0;
    h.dead = true;
    world.phase = 'dead';
  }
  abilityHurt(h);
  return dmg;
}
