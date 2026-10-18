// Damage budget: the phase-4 weapon curve (loaded FIRST among systems, so its hitE wrapper is the
// innermost one and sees the final amount after every crit/proc/element/boon multiplier).
//
// Before: ~20 systems multiplied hit damage (crits, procs, elements, augments, player level running
// ahead of the zone), so one swing deleted anything and the HUD showed thousands of DPS at level 1.
//
// Now every swing has a budget against each non-boss enemy, expressed as a share of that enemy's
// health in the zone the weapon was found in:
//   normal weapon     0.24 .. 0.44 of its health per swing (by rarity)   -> 3-5 swings in its zone
//   standout (1 in 5) 1.55 per swing at home (a plain hit one-shots)     -> one-shots in its zone,
//                     never more than 0.70 further on                       2 swings next zone, 4 after
//   elites take 0.6x the share. Each zone has ~1.4-2x the health of the last, so every weapon fades
//   as you push on and new drops take over.
// A plain hit is normalised to ~80% of the budget against a typical enemy; crits/procs/multi-hits
// push above that and bend smoothly toward the budget (big crits still look bigger, they just never
// skip the fight). Hits on one enemy within one attack's
// cadence count as one swing (multishot volleys, pierce, splash, procs).
// Debug: CWM_BUDGET.share(w), CWM_BUDGET.stats; ?nobudget turns it off.
(() => {
  if (globalThis.CWM_BUDGET) return;
  const off = new URLSearchParams(location.search).has('nobudget');
  const ST = { swings: 0, bent: 0, oneSwing: 0, kills: 0, standouts: 0, drops: 0, hist: {}, byStandout: [0, 0] };
  const STANDOUT_CHANCE = 0.2;

  // How strong is the weapon's home zone compared with where we are now (1 at home, ~0.5 next zone).
  function levelRatio(w) {
    const home = Math.max(1, Number(w?.lv) || 1),
      here = Math.max(1, Z[zoneI]?.lv || 1);
    return mobHP(home) / mobHP(here);
  }
  // Share of a typical enemy's health one swing may take, here and now.
  //   normal:   (0.24 + 0.02 * rarity) at home, falling with the zone ratio
  //   standout: 1.55 at home (plain hits one-shot), then at most 0.7 anywhere further on
  function share(w) {
    if (!w) return 0.25;
    const r = levelRatio(w);
    if (w.__standout) return r >= 0.95 ? 1.55 : Math.min(0.7, 1.55 * r);
    const q = Math.max(0, Math.min(10, Number(rarityRank(w)) || 0));
    return (0.24 + 0.02 * q) * Math.min(1.25, r);
  }
  function budgetFor(e, w) {
    return e.max * share(w) * (e.elite ? 0.6 : 1);
  }
  // Normalise the weapon's base hit onto the curve: a plain hit lands at ~80% of the swing budget,
  // so crits, procs and multi-hits are what push a swing up into the bend.
  function curveScale(e, w) {
    const base = baseD(pl.lv) * (w.m || 1) * weaponDamageMult(w) * combatScale(w);
    if (!(base > 0)) return 1;
    // against a typical enemy of this one's level (so a goose and a brute show the same numbers)
    return ((w.__standout ? 0.8 : 0.85) * mobHP(Math.max(1, e.lv || 1)) * share(w)) / base;
  }
  // smooth bend: identity up to 70% of the budget, then eases toward (never past) 100%
  function bend(x, b) {
    if (x <= 0.7 * b) return x;
    return b * (0.7 + 0.3 * (1 - Math.exp(-(x - 0.7 * b) / (0.3 * b))));
  }

  // ---- standout drops (innermost makeW wrapper, so the name system sees the flag) ----
  function markStandout(w) {
    if (!w || typeof w !== 'object' || w.kind === 'armor' || !w.type) return w;
    ST.drops++;
    if (Math.random() < STANDOUT_CHANCE) {
      Object.defineProperty(w, '__standout', { value: true, enumerable: false, configurable: true });
      ST.standouts++;
    }
    return w;
  }
  const makeW0 = makeW;
  makeW = function (...a) {
    return markStandout(makeW0.apply(this, a));
  };

  if (!off) {
    const hitE0 = hitE;
    hitE = function (e, a, o = {}) {
      if (!e || e.dead || e.boss || o.ignoreCap || !(a > 0)) return hitE0(e, a, o);
      const w = curW(),
        win = Math.max(0.08, Math.min(0.35, heldAttackCooldown(w) * 0.9));
      let sw = e.__swing;
      if (!sw || time - sw.t > win || sw.w !== w) {
        if (sw && sw.dealt >= 0.05 * e.max) e.__swings = (e.__swings || 0) + 1; // count real swings only
        sw = e.__swing = { t: time, raw: 0, dealt: 0, w, full: e.hp >= e.max };
        ST.swings++;
      }
      const b = budgetFor(e, w);
      sw.raw += a * curveScale(e, w);
      const allowed = bend(sw.raw, b),
        n = Math.max(1, Math.round(allowed - sw.dealt));
      if (allowed < sw.raw - 0.5) ST.bent++;
      if (allowed - sw.dealt < 0.5) {
        // budget for this swing is spent: a token tick keeps the hit feel
        sw.dealt += 1;
        const r = hitE0(e, 1, o);
        return r;
      }
      sw.dealt += n;
      // standouts may exceed the core's 52% impact cap; everything else stays under it anyway
      const o2 = w.__standout && b >= e.hp ? { ...o, ignoreCap: true } : o;
      const r = hitE0(e, n, o2);
      if (e.dead || e.hp <= 0) {
        ST.kills++;
        e.__swings = (e.__swings || 0) + 1;
        if (sw.full) ST.oneSwing++;
        (ST.hist[e.__swings] = (ST.hist[e.__swings] || 0) + 1), (ST.byStandout[w.__standout ? 1 : 0] += e.__swings);
      }
      return r;
    };
  }

  // ---- test arena (debug): put the hero in zone z with a fresh drop from zone `from` ----
  let god = false,
    lockW = null;
  const update0 = update;
  update = function (dt) {
    if (god) {
      if (lockW) pl.weapon = lockW;
      pl.hp = pl.max;
      pl.inv = Math.max(pl.inv || 0, 0.2);
    }
    return update0(dt);
  };
  function arena({ zone = 0, from = zone, standout = false, rank = null, count = 6, elite = false, type = null } = {}) {
    god = true;
    zoneI = Math.max(0, Math.min(Z.length - 1, zone));
    try {
      applyMap(zoneI);
    } catch (_) {}
    pl.lv = Z[zoneI].lv + 1;
    const L = Z[Math.max(0, Math.min(Z.length - 1, from))].lv;
    let w = rank == null ? makeW(L) : makeExactRankWeapon(L, rank);
    w.lv = L;
    Object.defineProperty(w, '__standout', { value: !!standout, enumerable: false, configurable: true });
    pl.weapon = lockW = w;
    E.length = 0;
    for (const k in ST.hist) delete ST.hist[k];
    ST.kills = ST.oneSwing = ST.swings = ST.bent = 0;
    ST.byStandout[0] = ST.byStandout[1] = 0;
    for (let i = 0; i < count; i++) spawn(type || Z[zoneI].pool[i % Z[zoneI].pool.length], pl.x + 160 + i * 60, elite);
    return { zone: Z[zoneI].name, weapon: w.name, rar: w.rar, q: rarityRank(w), standout: !!standout, lv: L };
  }

  globalThis.CWM_BUDGET = {
    arena,
    curveScale,
    god: on => ((god = !!on), on || (lockW = null)), share, levelRatio, budgetFor, bend, stats: ST, STANDOUT_CHANCE, off };
})();
