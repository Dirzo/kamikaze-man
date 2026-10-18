// Floating-text budget and compact numbers (phase 4). Replaces the pixel renderer's overlap
// stopgap as the main readability rule.
//   - Hits on the same enemy within 0.3 s merge into one rising number instead of a pile.
//   - At most 8 damage numbers and 2 callouts (3 if one is big), stacked, on screen; duplicate callouts within 1.2 s dropped.
//   - Numbers are compact: 999, 12.3K, 4.5M, 6.7B ... and then joke units when truly absurd.
(() => {
  if (globalThis.CWM_FMT) return;
  const JOKE = ['GAZILLION', 'BAJILLION', 'KAJILLION', 'TOO MANY', 'YES'];
  function fmt(n) {
    n = Math.max(0, Math.round(Number(n) || 0));
    if (n < 1000) return String(n);
    const units = ['K', 'M', 'B', 'T'];
    let u = -1,
      v = n;
    while (v >= 1000 && u < units.length - 1) {
      v /= 1000;
      u++;
    }
    if (v >= 1000) return JOKE[Math.min(JOKE.length - 1, Math.floor(Math.log10(v) / 3) - 1)];
    return (v < 10 ? v.toFixed(1) : String(Math.round(v))).replace(/\.0$/, '') + units[u];
  }
  globalThis.CWM_FMT = fmt;
  const S = { merged: 0, droppedDamage: 0, droppedCallouts: 0 };
  globalThis.CWM_TEXT = S;

  const damagePop0 = damagePop;
  damagePop = function (e, n, crit = false, col = '#fff') {
    const now = time;
    const prev = T.findLast?.(t => t.kind === 'damage' && t.eid === e?.id && now - t.born < 0.3 && t.life > 0);
    if (prev && !crit) {
      prev.total += n;
      prev.s = fmt(prev.total);
      prev.life = Math.max(prev.life, prev.max * 0.85);
      S.merged++;
      return;
    }
    const before = T.length;
    const r = damagePop0(e, n, crit, col);
    const t = T[T.length - 1];
    if (T.length > before && t && t.kind === 'damage') {
      t.eid = e?.id;
      t.born = now;
      t.total = n;
      t.s = fmt(n);
    }
    const dmg = T.filter(x => x.kind === 'damage');
    while (dmg.length > 8) {
      const old = dmg.shift();
      T.splice(T.indexOf(old), 1);
      S.droppedDamage++;
    }
    return r;
  };

  const recent = new Map();
  const txt0 = txt;
  txt = function (x, y, s, col = '#fff', big = false) {
    const key = String(s);
    if (now() - (recent.get(key) || -9) < 1.2) {
      S.droppedCallouts++;
      return;
    }
    const callouts = T.filter(t => t.kind !== 'damage' && t.life > 0);
    if (callouts.length >= (big ? 3 : 2)) {
      if (!big) {
        S.droppedCallouts++;
        return;
      }
      const drop = callouts.find(t => !t.big) || callouts[0];
      T.splice(T.indexOf(drop), 1);
    }
    recent.set(key, now());
    if (recent.size > 80) recent.clear();
    const before = T.length;
    const r = txt0(x, y, s, col, big);
    const t = T.length > before ? T[T.length - 1] : null;
    // stack instead of overlapping: nudge up past any nearby callout
    if (t && typeof t.y === 'number') {
      for (let guard = 0; guard < 4; guard++) {
        const hit = T.find(o => o !== t && o.kind !== 'damage' && o.life > 0 && Math.abs(o.x - t.x) < 200 && Math.abs(o.y - t.y) < 26);
        if (!hit) break;
        t.y = hit.y - 28;
      }
    }
    return r;
  };
  function now() {
    return typeof time === 'number' ? time : performance.now() / 1000;
  }
})();
