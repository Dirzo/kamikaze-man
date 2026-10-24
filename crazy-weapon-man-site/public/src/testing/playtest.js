// Bot playtester (?playtest). Plays whole runs headlessly with real key presses through the real
// update loop, so every number (damage, health, loot) is the live game's. Only the
// route is helped: when the bot cannot find a way to its target for a few seconds it is moved next
// to it (counted as a "warp"), so the results measure the fights rather than the bot's platforming.
//   ?playtest=20&bot=skilled|casual&from=0
//   casual: walks in and holds attack, takes DOWN upgrades
//   skilled: also dodges bolts, uses specials, keeps the best weapon in the bag equipped
//   ?playtest=4&campaign: plays the overworld instead, level by level from a fresh account until the
//   final castle falls. Shards are banked and spent on the tree, mastery perks are picked, and a
//   failed level is simply tried again (each attempt banks its shards, so the account grows).
// Results land in window.CWM_PLAYTEST (and data-playtest="done" on <html>).
import { world } from '../game/world.js';
import { STEP } from '../config.js';
import { TYPES } from '../data/weapons.js';
import { ZONES } from '../data/zones.js';
import { equipFromBag } from '../game/inventory.js';
import { powerScore, hitDamage } from '../game/loot.js';
import { refHP } from '../data/curve.js';
import { resetProficiency } from '../data/proficiency.js';
import { cx, cy } from '../game/physics.js';
import { kill } from '../game/combat.js';
import { NODES, LEVELS, newSave, isOpen } from '../data/overworld.js';
import { resetMeta, meta, TREE, cantBuy, buyRank, rank, choosePerk, unpicked, metaPower, stats, setLock, treeSpent } from '../data/meta.js';
import { TYPE_LIST } from '../data/weapons.js';
import { proficiency } from '../data/proficiency.js';
import { perfProbe } from './perf.js';

const CODES = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', jump: 'KeyX', attack: 'KeyZ', special: 'KeyC', dash: 'KeyV' };
const held = new Set();
function press(want) {
  for (const k of Object.keys(CODES)) {
    const on = want.has(k);
    if (on === held.has(k)) continue;
    window.dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { code: CODES[k], bubbles: true }));
    on ? held.add(k) : held.delete(k);
  }
}

export function runPlaytest(game) {
  const q = new URLSearchParams(location.search);
  const runs = +q.get('playtest') || 10, skill = q.get('bot') || 'skilled', from = +q.get('from') || 0;
  const out = { skill, runs: [] };
  window.CWM_PLAYTEST = out;
  if (q.has('campaign')) return runCampaign(game, runs, skill, out);
  let n = 0;
  const next = () => {
    if (n++ >= runs) { press(new Set()); document.documentElement.dataset.playtest = 'done'; return; }
    if (!q.has('keep')) resetProficiency(); // a fresh player every run (?keep: carry mastery over)
    const bot = newRun(game, skill, from);
    const chunk = () => {
      steps(bot);
      if (bot.done) { out.runs.push(bot.report); setTimeout(next, 0); } else setTimeout(chunk, 0);
    };
    chunk();
  };
  next();
}

// ---------------------------------------------------------------- campaign
// the bot's spec: cheap ranks first, damage and health before the rest
const SPEC = ['core', 'sharp', 'skin', 'ripple', 'slice', 'longb', 'cleave', 'whirl', 'nova', 'echo', 'fleet', 'blink', 'dashcut', 'edge', 'fire', 'bolt', 'frenzy', 'magnet', 'band', 'hearts', 'learn', 'tutor', 'bounty', 'grace', 'combo'];
function spend() {
  for (let bought = true; bought;) {
    bought = false;
    const pick = TREE.filter(n => !cantBuy(n.id)).sort((a, b) => (SPEC.indexOf(a.id) + 99) % 99 - (SPEC.indexOf(b.id) + 99) % 99 || rank(a.id) - rank(b.id))[0];
    if (pick) bought = buyRank(pick.id);
  }
  for (const t of TYPE_LIST) for (const tier of unpicked(t)) choosePerk(t, tier, tier % 2); // alternate A / B
}
function runCampaign(game, campaigns, skill, out) {
  let n = 0;
  const next = () => {
    if (n++ >= campaigns) { press(new Set()); document.documentElement.dataset.playtest = 'done'; return; }
    resetProficiency(); resetMeta(); setLock('blades'); // the bot specializes in blades
    const save = newSave(), C = { levels: [], won: false };
    out.runs.push(C);
    game.ow.save = save;
    let tries = {}, bot = null;
    const pickLevel = () => LEVELS.find(l => isOpen(save, l.id) && !save.cleared[l.id] && (l.kind !== 'secret' || Math.random() < 0.5)) || null;
    const start = () => {
      spend();
      const node = pickLevel();
      if (!node || C.levels.length > 400) { C.won = !!save.cleared['10-C']; setTimeout(next, 0); return false; }
      tries[node.id] = (tries[node.id] || 0) + 1;
      game.openMap();
      game.enterLevel(node);
      bot = newRun(game, skill, 0, node);
      bot.report.id = node.id; bot.report.kind = node.kind; bot.report.region = node.region; bot.report.attempt = tries[node.id];
      bot.report.meta = metaPower(); bot.report.ranks = TREE.reduce((s, x) => s + rank(x.id), 0); bot.report.banked = meta().earned;
      return true;
    };
    const chunk = () => {
      steps(bot);
      if (!bot.done) return setTimeout(chunk, 0);
      const r = bot.report, h = world.hero;
      r.mastery = proficiency(h.weapon.type).lv; r.weapon = h.weapon.type;
      r.topMastery = Math.max(...TYPE_LIST.map(t => proficiency(t).lv));
      r.treePct = Math.round(100 * treeSpent() / TREE.filter(n => !n.branch || n.branch === meta().lock).reduce((s, n) => s + n.cost * n.max * (n.max + 1) / 2, 0));
      C.levels.push(r);
      if (start()) setTimeout(chunk, 0);
    };
    if (start()) chunk();
  };
  next();
}

// a crash in the game ends the attempt (logged as report.error) instead of hanging the playtest
function steps(bot) {
  try { for (let i = 0; i < 4000 && !bot.done; i++) bot.step(); } catch (err) {
    bot.report.error = String(err.stack || err).split('\n').slice(0, 3).join(' | ');
    bot.report.zone = world.zone;
    bot.done = true;
  }
}

function newRun(game, skill, from, level = null) {
  const skilled = skill === 'skilled';
  if (!level) from ? game.jump(from) : game.startRun();
  const S = { t: 0, target: null, targetT: 0, best: Infinity, bestT: 0, jumpT: 0, lastHp: world.hero.hp, zone: -1, zt: 0 };
  const trace = new URLSearchParams(location.search).has('trace');
  const report = { won: false, zone: from, zones: [], warps: 0, skips: 0, trace: [] };
  let Z = null;
  // ?perf: time every update and every other frame drawn, and log where the run slows (perf.js)
  const probe = level && new URLSearchParams(location.search).has('perf') ? perfProbe() : null;
  const startZoneLog = () => {
    const h = world.hero;
    Z = { zone: world.zone, hpIn: Math.round(h.hp / h.maxHp * 100), lv: h.lv, power: +(hitDamage(h.weapon) / refHP(world.zone)).toFixed(2), weapon: h.weapon.type, q: h.weapon.q,
      time: 0, fightT: 0, swarmT: 0, bossT: 0, dmg: { fight: 0, swarm: 0, boss: 0 }, warps: 0, minHp: 100, src: {} };
    report.zones.push(Z);
    S.zone = world.zone;
    equipBest();
  };
  const phaseKey = () => { const D = world.director; return D?.phase === 'survive' ? (D.sboss ? 'boss' : 'swarm') : 'fight'; };
  const bot = { report, done: false };
  bot.step = () => {
    const h = world.hero, D = world.director;
    // an overworld level: let a death play out until the level-end screen (it banks the shards)
    if (level && world.phase === 'dead' && game.scene === 'play') { press(new Set()); game.update(STEP); return; }
    if (level ? game.scene === 'levelEnd' : game.scene === 'over' || game.scene === 'won' || world.phase === 'dead' || world.phase === 'won') {
      report.won = level ? world.levelEnd.result === 'clear' : world.phase === 'won' || game.scene === 'won';
      report.bossHp = world.boss && !report.won ? +(world.boss.hp / world.boss.max).toFixed(2) : null;
      report.zone = world.zone;
      report.diedIn = report.won ? null : phaseKey();
      report.boss = world.boss?.name || null;
      report.time = Math.round(S.t);
      report.lv = h.lv;
      if (probe) probe.finish(report);
      if (level && world.levelEnd?.tally) { const Y = world.levelEnd.tally; report.grade = report.won ? Y.grade.g : null; report.par = +(Y.t / Y.par).toFixed(2); report.done = +Y.done.toFixed(2); report.top = Y.top; }
      bot.done = true;
      return;
    }
    if (S.t > (level ? 15 : 60) * 60) { report.zone = world.zone; report.timeout = `${world.director?.phase} ${S.target?.type || '-'}`; bot.done = true; return; }
    if (world.zone !== S.zone) startZoneLog();
    S.t += STEP;
    const want = new Set();
    if (!world.inv) play(want, h, D);
    press(want);
    if (probe) {
      probe.update(() => game.update(STEP));
      probe.sample();
      if (probe && (S.t * 60) % 4 < 1) probe.draw(() => game.render());
    } else game.update(STEP);
    // bookkeeping
    if (Z) {
      const p = phaseKey();
      Z.time += STEP;
      Z[p === 'fight' ? 'fightT' : p === 'swarm' ? 'swarmT' : 'bossT'] += STEP;
      if (h.hp < S.lastHp) {
        const lost = Math.round((S.lastHp - h.hp) / h.maxHp * 100);
        Z.dmg[p] += lost;
        // blame the closest thing: an enemy body or one of its bolts
        let src = 'other', bd = 70;
        for (const e of world.enemies) { const d = Math.hypot(cx(e) - cx(h), cy(e) - cy(h)) - e.w / 2; if (!e.dead && d < bd) { bd = d; src = e.type; } }
        for (const b of world.bolts) { const d = Math.hypot(b.x - cx(h), b.y - cy(h)); if (d < Math.min(bd, 30)) { bd = d; src = (b.owner?.type || 'bolt') + ':bolt'; } }
        Z.src[src] = (Z.src[src] || 0) + lost;
      }
      Z.minHp = Math.min(Z.minHp, Math.round(h.hp / h.maxHp * 100));
    }
    S.lastHp = h.hp;
    if (trace && (S.t * 60) % 300 < 1) report.trace.push([Math.round(S.t), world.zone, D?.phase, Math.round(h.x), Math.round(h.y + h.h), Math.round(h.hp),
      S.target ? `${S.target.type}@${Math.round(cx(S.target))},${Math.round(S.target.y + S.target.h)}` : '-', world.enemies.filter(e => !e.dead).length, [...held].join('+')]);
  };

  function equipBest() {
    const h = world.hero;
    let bi = -1, bs = powerScore(h.weapon);
    world.bag.forEach((w, i) => { if (w && powerScore(w) > bs * 1.02) { bs = powerScore(w); bi = i; } });
    if (bi >= 0) equipFromBag(bi);
  }

  function pickTarget(h, D) {
    const alive = world.enemies.filter(e => !e.dead && !(e.spawnT > 0.3));
    const cost = e => Math.abs(cx(e) - cx(h)) + 2.5 * Math.abs(e.y + e.h - (h.y + h.h)) * (e.air ? 0.3 : 1);
    if (D.phase === 'fight' || D.phase === 'intro') {
      const pool = alive.filter(e => !e.boss);
      // stick with a target for a while unless something is right on top of us
      const near = pool.filter(e => cost(e) < 50).sort((a, b) => cost(a) - cost(b))[0];
      if (near) return near;
      if (S.target && !S.target.dead && pool.includes(S.target)) return S.target;
      return pool.sort((a, b) => cost(a) - cost(b))[0] || null;
    }
    if (D.phase === 'survive') return alive.sort((a, b) => cost(a) - cost(b) - (a === world.boss ? 30 : 0) + (b === world.boss ? 30 : 0))[0] || null;
    return null;
  }

  function play(want, h, D) {
    if (!D || h.dead) return;
    if (world.quick && !h.attack && !h.special && h.dashT <= 0 && !h.ladder && (S.t * 60) % 6 < 1) { want.add('down'); return; }
    if (skilled && (S.t * 60) % 120 < 1) equipBest();
    let goal = null;
    const target = pickTarget(h, D);
    if (target !== S.target) { S.target = target; S.best = Infinity; S.bestT = S.t; S.hp = target ? target.hp : 0; S.hitT = S.t; }
    if (D.phase === 'arena') goal = { x: world.map.bossLeft + 40, feet: world.map.bossFloor };
    else if (D.phase === 'exit') goal = { x: world.map.exitX, feet: world.map.exitY };
    else if (target) goal = { x: cx(target), feet: target.y + target.h, e: target };
    if (!goal) return;
    const T = TYPES[h.weapon.type], feet = h.y + h.h, dx = goal.x - cx(h), dir = Math.sign(dx) || h.face;
    // a breakable wall in the way: smash it (game/walls.js)
    const wall = (world.map.walls || []).find(w => !w.broken && Math.sign(w.x + w.w / 2 - cx(h)) === dir && Math.abs(w.x + w.w / 2 - cx(h)) < 44 && feet > w.y && feet <= w.y + w.h + 1);
    if (wall && h.onGround) {
      if (h.face !== dir) want.add(dir > 0 ? 'right' : 'left');
      want.add('attack');
      return;
    }
    // dodge incoming bolts with a hop
    if (skilled && h.onGround) {
      for (const b of world.bolts) {
        const bx = b.x - cx(h), by = (b.y || 0) - cy(h);
        if (Math.abs(by) < 18 && Math.abs(bx) < 46 && Math.sign(b.vx || 0) === -Math.sign(bx || 1)) { want.add('jump'); S.jumpT = 0.2; break; }
      }
    }
    // fighting range
    const e = goal.e;
    if (e) {
      const gap = Math.abs(dx) - e.w / 2 - h.w / 2;
      const vOver = e.y < h.y + 11 + 14 && e.y + e.h > h.y + 11 - 14;
      const inReach = T.melee ? gap < T.reach - 2 && vOver : Math.abs(cy(e) - (h.y + 12)) < 14 + e.h / 3 && Math.abs(dx) < 230;
      if (skilled && h.specialCd <= 0 && !h.attack && Math.abs(dx) < 70 && Math.abs(cy(e) - cy(h)) < 30) {
        const crowd = world.enemies.filter(o => !o.dead && Math.abs(cx(o) - cx(h)) < 70).length;
        if (crowd >= 2 || e.boss || e.swarmBoss || e.elite) want.add('special');
      }
      if (e.hp < S.hp) { S.hp = e.hp; S.bestT = S.hitT = S.t; } // landing hits is progress
      // a resident the bot can't land a hit on for 30s (a hover it can't reach) is written off
      if (!e.boss && !e.swarmBoss && S.t - S.hitT > 30) { kill(e); report.skips = (report.skips || 0) + 1; (report.skipAt ||= {})[e.type] = (report.skipAt[e.type] || 0) + 1; return; }
      if (inReach && !h.ladder) {
        want.add('attack');
        // over a pit mid-jump: keep carrying on toward the far side while swinging
        if (!h.onGround && !world.map.platforms.some(p => p.y >= h.y + h.h && cx(h) >= p.x && cx(h) < p.x + p.w)) want.add(h.vx < 0 ? 'left' : 'right');
        if (h.face !== dir && !pitAhead(h, dir)) want.add(dir > 0 ? 'right' : 'left');
        else if (T.melee && gap > T.reach * 0.5 && !pitAhead(h, dir)) want.add(dir > 0 ? 'right' : 'left');
        if (S.t - S.bestT > 6) warp(h, goal);
        return;
      }
      // air targets just out of reach above: jump and swing
      // air targets just out of reach above: jump, and swing near the top of the jump
      if (e.air && T.melee && gap < T.reach + 6 && cy(e) < h.y) {
        if (h.onGround) { want.add('jump'); S.jumpT = 0.3; }
        else if (h.vy > -90) want.add('attack');
        if (h.face !== dir) want.add(dir > 0 ? 'right' : 'left');
      }
    }
    if (S.jumpT > 0) { S.jumpT -= STEP; want.add('jump'); }
    route(want, h, goal, feet, dx, dir);
    progress(Math.abs(dx) + 2 * Math.abs(goal.feet - feet));
    if (S.t - S.bestT > 5) warp(h, goal);
  }

  function progress(c) {
    if (c < S.best - 12) { S.best = c; S.bestT = S.t; }
  }

  // a pit (or a drop too deep to step down) just ahead on the stage: jump it, holding for distance
  function pitAhead(h, dir) {
    if (!world.map.pits?.length || !(h.onGround || (h.coyote > 0 && h.vy >= 0))) return false;
    const feet = h.y + h.h, x = cx(h) + dir * (h.w / 2 + 12);
    return !world.map.platforms.some(p => x >= p.x && x < p.x + p.w && p.y >= feet - 34 && p.y <= feet + 34);
  }
  function route(want, h, goal, feet, dx, dir) {
    const dy = goal.feet - feet, ladders = world.map.ladders;
    const walk = () => {
      if (Math.abs(dx) > 4) want.add(dir > 0 ? 'right' : 'left');
      // (a jump still held from before has to be let go for a frame first)
      if (pitAhead(h, dir)) {
        // the goal is just short of the edge: stop there rather than walk off
        if (Math.abs(dx) <= 24) { want.delete(dir > 0 ? 'right' : 'left'); return; }
        if (held.has('jump')) { want.delete('jump'); S.jumpT = 0; }
        else { want.add('jump'); S.jumpT = 0.4; }
      }
    };
    if (h.ladder) {
      if (dy < -6) want.add('up');
      else if (dy > 6) want.add('down');
      else { want.add('jump'); walk(); }
      return;
    }
    const airGoal = goal.e && goal.e.air;
    if (Math.abs(dy) <= 10 || (airGoal && dy > -10 && dy < 90)) {
      walk();
      if (h.hitWall && h.onGround) { want.add('jump'); S.jumpT = 0.3; }
      return;
    }
    if (dy < 0) {
      // up: the ladder from this level that best heads for the goal
      let best = null, bc = Infinity;
      for (const l of ladders) {
        if (l.top >= feet - 8 || feet > l.bottom + 2 || feet < l.top) continue;
        const c = Math.abs(l.x - cx(h)) + Math.abs(l.x - goal.x) * 0.6 + Math.abs(l.top - goal.feet) * 0.5;
        if (c < bc) { bc = c; best = l; }
      }
      if (best && Math.abs(best.x - cx(h)) < 6) { want.add('up'); return; }
      if (best && bc < 900) { want.add(best.x > cx(h) ? 'right' : 'left'); return; }
      walk();
      if (h.onGround && (h.hitWall || Math.abs(dx) < 40) && dy > -60) { want.add('jump'); S.jumpT = 0.3; }
      return;
    }
    // down: drop through a ledge, or walk off its edge
    const under = world.map.platforms.some(p => p.y > feet && cx(h) >= p.x && cx(h) < p.x + p.w);
    if (h.onGround && h.platform && !h.platform.solid && under && Math.abs(dx) < 120) { want.add('down'); want.add('jump'); return; }
    walk();
    if (h.hitWall && h.onGround) { want.add('jump'); S.jumpT = 0.3; }
  }

  function warp(h, goal) {
    const solids = world.map.solids;
    for (const side of [-1, 1, -2, 2]) {
      const x = goal.x + side * 28 - h.w / 2, y = goal.feet - h.h - (goal.e && goal.e.air ? -40 : 0) - 1;
      const box = { x, y, w: h.w, h: h.h };
      if (x < 2 || x + h.w > world.map.width - 2) continue;
      if (solids.some(p => box.x < p.x + p.w && box.x + box.w > p.x && box.y < p.y + p.h && box.y + box.h > p.y)) continue;
      if (world.map.pits?.length && !world.map.platforms.some(p => p.y >= y + h.h - 2 && x + h.w / 2 >= p.x && x + h.w / 2 < p.x + p.w)) continue; // never over a pit
      h.x = x; h.y = Math.min(y, world.map.floorY - h.h); h.vx = h.vy = 0; h.ladder = null;
      break;
    }
    report.warps++;
    const k = goal.e ? goal.e.type + (goal.e.air ? '^' : '') : world.director?.phase || '-';
    (report.warpAt ||= {})[k] = (report.warpAt[k] || 0) + 1;
    if (Z) Z.warps++;
    S.best = Infinity; S.bestT = S.t;
  }
  return bot;
}
