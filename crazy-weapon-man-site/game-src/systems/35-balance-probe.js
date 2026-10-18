// Balance probe (debug only; no effect on play). CWM_BALANCE.probe() measures, per zone, what the
// live (fully patched) weapon factory and spawner produce: weapon hit damage, DPS, hits-to-kill
// against that zone's enemies, name length and rarity mix. Used by the phase-4 balance pass.
(() => {
  if (globalThis.CWM_BALANCE) return;
  const pct = (a, p) => {
    const s = [...a].sort((x, y) => x - y);
    return s.length ? s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] : 0;
  };
  function hitOf(w, lv) {
    return baseD(lv) * w.m * weaponDamageMult(w) * combatScale(w);
  }
  function probe({ zones = Z.map((_, i) => i), samples = 300, playerLv = null } = {}) {
    const saved = { lv: pl.lv, zone: zoneI, E: E.length, weapon: pl.weapon, rnd: null };
    const out = [];
    try {
      for (const z of zones) {
        zoneI = z;
        const L = playerLv ? playerLv(z) : Z[z].lv;
        pl.lv = L;
        // enemies: spawn a pack of the zone's pool (normal + some elites), read hp, remove
        const hp = [],
          ehp = [];
        const before = E.length;
        for (let i = 0; i < 40; i++) {
          const t = Z[z].pool[i % Z[z].pool.length];
          try {
            spawn(t, -999, i % 8 === 7);
          } catch (_) {}
        }
        for (const e of E.slice(before)) (e.elite ? ehp : hp).push(e.max);
        E.length = before;
        // weapons
        const hits = [],
          dps = [],
          names = [],
          rar = {};
        for (let i = 0; i < samples; i++) {
          let w;
          try {
            w = makeW(L);
          } catch (_) {
            continue;
          }
          const h = hitOf(w, L);
          hits.push(h);
          dps.push(estimateDPS(w));
          names.push(String(w.name || '').length);
          rar[w.rar] = (rar[w.rar] || 0) + 1;
        }
        const hpMed = pct(hp, 50);
        out.push({
          zone: z,
          name: Z[z].name,
          lv: L,
          enemyHp: { p50: Math.round(hpMed), elite: Math.round(pct(ehp, 50)) },
          hit: { p10: Math.round(pct(hits, 10)), p50: Math.round(pct(hits, 50)), p80: Math.round(pct(hits, 80)), p95: Math.round(pct(hits, 95)), max: Math.round(pct(hits, 100)) },
          dps: { p50: Math.round(pct(dps, 50)), p95: Math.round(pct(dps, 95)), max: Math.round(pct(dps, 100)) },
          hitsToKill: { p10: +(hpMed / pct(hits, 10)).toFixed(2), p50: +(hpMed / pct(hits, 50)).toFixed(2), p80: +(hpMed / pct(hits, 80)).toFixed(2), p95: +(hpMed / pct(hits, 95)).toFixed(2) },
          oneShotPct: Math.round((100 * hits.filter(h => h >= hpMed).length) / Math.max(1, hits.length)),
          nameLen: { p50: pct(names, 50), p95: pct(names, 95), max: pct(names, 100) },
          rarity: rar
        });
      }
    } finally {
      pl.lv = saved.lv;
      zoneI = saved.zone;
      E.length = Math.min(E.length, saved.E);
      pl.weapon = saved.weapon;
    }
    return out;
  }
  globalThis.CWM_BALANCE = { probe, hitOf };
})();
