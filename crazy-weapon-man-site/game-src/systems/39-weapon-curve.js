// Weapon curve, display side (phase 4): the DPS shown in the HUD and used for auto-equip and the
// "+X% DPS" toast follows the damage budget in systems/00-damage-budget.js, so the number matches
// what the weapon really does to this zone's enemies instead of the uncapped multiplier stack.
(() => {
  const B = globalThis.CWM_BUDGET;
  if (!B || B.off || globalThis.__CWM_WEAPON_CURVE) return;
  globalThis.__CWM_WEAPON_CURVE = true;
  const estimateDPS0 = estimateDPS;
  estimateDPS = function (w) {
    const raw = estimateDPS0(w);
    if (!w || !(raw > 0)) return raw;
    // typical enemy here vs. the most one swing may take from it
    const hpHere = mobHP(Math.max(1, Z[zoneI]?.lv || 1)),
      budget = hpHere * B.share(w),
      cd = Math.max(0.05, heldAttackCooldown(w)),
      swing = raw * cd; // raw damage per swing
    const dealt = B.bend(swing, budget);
    return dealt / cd;
  };
  // debug: what the live drop factory produces at level L
  B.sample = (n = 300, L = Z[zoneI]?.lv || 1) => {
    let so = 0;
    const names = { normal: [], standout: [] };
    for (let i = 0; i < n; i++) {
      const w = makeW(L);
      if (w.__standout) so++;
      const list = w.__standout ? names.standout : names.normal;
      if (list.length < 6) list.push(w.name);
    }
    return { standoutPct: Math.round((100 * so) / n), names };
  };
})();
