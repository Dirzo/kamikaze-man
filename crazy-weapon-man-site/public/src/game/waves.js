// Wave director: zone intro -> waves 1..4 -> (boss) -> zone clear -> next zone.
import { W, GROUND } from '../config.js';
import { world } from './world.js';
import { ZONES, WAVES_PER_ZONE, bossSong } from '../data/zones.js';
import { ENEMIES } from '../data/enemies.js';
import { spawnEnemy, rouse } from './enemy.js';
import { callout } from './fx.js';
import { music, sfx } from '../engine/audio.js';
import { C } from '../config.js';
import { startBoss, bossDone } from './bosses.js';
import { waveBudget, enemyPool } from '../data/progression.js';
import { makeWeapon } from './loot.js';
import { dropWeapon } from './combat.js';
import { clearBoss } from './bosses.js';
import { openForge, updateForge } from './forge.js';

const rand = (a, b) => a + Math.random() * (b - a);

export function startZone(z) {
  world.nearDrop = null;
  clearBoss();
  world.echoes.length = 0;
  world.shots.length = 0;
  world.drops.length = 0;
  world.pickups.length = 0;
  world.zone = z;
  world.wave = 0;
  const Z = ZONES[z];
  world.platforms = Z.platforms.map(([x, y, w]) => ({ x, y, w }));
  world.enemies.length = 0;
  world.bolts.length = 0;
  world.boss = null;
  world.director = { phase: 'intro', t: 2.6, toSpawn: 0, spawnT: 0, elites: 0, maxAlive: 4 };
  music.play('zone:' + z, Z.music);
  sfx.zone();
  if (world.hero && z > 0) world.hero.hp = Math.min(world.hero.maxHp, world.hero.hp + Math.round(world.hero.maxHp * 0.3));
}

function startWave(n) {
  const z = world.zone,
    D = world.director;
  world.wave = n;
  D.phase = 'fight';
  const budget = waveBudget(z, n);
  D.toSpawn = budget.count;
  D.maxAlive = budget.alive;
  D.elites = budget.elites;
  D.interval = budget.interval;
  D.spawnT = 0.6;
  // sleepers: some elites start the wave already on the field, asleep
  while (D.elites > 0 && Math.random() < 0.3) {
    D.elites--;
    D.toSpawn--;
    const type = pickType(true);
    const p = world.platforms[Math.floor(Math.random() * world.platforms.length)];
    const onPlat = Math.random() < 0.5 && p;
    spawnEnemy(type, onPlat ? p.x + p.w / 2 : rand(140, W - 140), onPlat ? p.y : GROUND, { elite: true, asleep: true, wave: n });
  }
  callout(`WAVE ${n}`, W / 2, 70, C.cream, { big: true, life: 70 });
}

function pickType(groundOnly = false) {
  const pool = enemyPool(world.zone, world.wave, ZONES[world.zone].pool).filter(t => !(groundOnly && (ENEMIES[t].air || ENEMIES[t].kind === 'mimic' || ENEMIES[t].kind === 'bomb')));
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnOne() {
  const D = world.director;
  const elite = D.elites > 0 && Math.random() < 0.35;
  if (elite) D.elites--;
  const type = pickType();
  const d = ENEMIES[type];
  const hero = world.hero;
  if (d.air) {
    spawnEnemy(type, Math.random() < 0.5 ? rand(20, 140) : rand(W - 140, W - 20), rand(70, 120), { elite, wave: world.wave });
  } else if (d.kind === 'mimic') {
    spawnEnemy(type, rand(60, W - 60), GROUND, { wave: world.wave });
  } else if (Math.random() < 0.35 && world.platforms.length) {
    const p = world.platforms[Math.floor(Math.random() * world.platforms.length)];
    spawnEnemy(type, p.x + 8 + Math.random() * (p.w - 16), p.y, { elite, wave: world.wave });
  } else {
    // from the side away from the hero (mostly)
    const left = hero.x > W / 2 ? Math.random() < 0.75 : Math.random() < 0.25;
    spawnEnemy(type, left ? rand(10, 40) : rand(W - 40, W - 10), GROUND, { elite, wave: world.wave });
  }
  D.toSpawn--;
}

export function updateWaves(dt) {
  const D = world.director;
  if (!D || world.phase === 'dead') return;
  D.t -= dt;
  const alive = world.enemies.filter(e => !e.dead).length;
  switch (D.phase) {
    case 'intro':
      if (D.t <= 0) startWave(1);
      break;
    case 'fight':
      D.spawnT -= dt;
      if (D.toSpawn > 0 && D.spawnT <= 0 && alive < D.maxAlive) {
        spawnOne();
        D.spawnT = D.interval * rand(0.85, 1.15);
      }
      // nothing left but sleepers/mimics (or a long lull): they wake up and come to you
      if (D.toSpawn <= 0 && alive > 0) {
        const hidden = world.enemies.filter(e => !e.dead && (e.state === 'sleep' || e.state === 'disguised'));
        D.lull = hidden.length === alive ? (D.lull || 0) + dt : 0;
        if (D.lull > 2.5) for (const e of hidden) rouse(e);
      }
      if (D.toSpawn <= 0 && alive === 0) {
        if (world.wave === 1 && world.zone === 0) dropWeapon(world.hero.x + 20, world.hero.y, makeWeapon(0, { q: 1, standout: false }));
        D.phase = 'clear';
        D.t = 2;
        sfx.clear();
        callout('WAVE CLEAR', W / 2, 70, C.lime, { big: true, life: 90 });
      }
      break;
    case 'clear':
      if (D.t <= 0) {
        if (world.wave < WAVES_PER_ZONE) startWave(world.wave + 1);
        else if (ZONES[world.zone].boss) {
          D.phase = 'boss';
          music.play('boss:' + ZONES[world.zone].boss, bossSong(ZONES[world.zone].boss));
          startBoss(ZONES[world.zone].boss);
        } else zoneClear();
      }
      break;
    case 'boss':
      if (bossDone()) zoneClear();
      break;
    case 'zoneclear':
      if (D.t <= 0) {
        if (world.zone + 1 < ZONES.length) {
          D.phase = 'forge';
          openForge();
        } else world.phase = 'won';
      }
      break;
    case 'forge':
      if (updateForge(dt)) startZone(world.zone + 1);
      break;
  }
}

function zoneClear() {
  const D = world.director;
  D.phase = 'zoneclear';
  D.t = 2.4;
  sfx.clear();
  callout('ZONE CLEAR', W / 2, 70, C.gold, { big: true, life: 150 });
}

export function enemiesLeft() {
  const D = world.director;
  if (!D || D.phase !== 'fight') return 0;
  return D.toSpawn + world.enemies.filter(e => !e.dead).length;
}
