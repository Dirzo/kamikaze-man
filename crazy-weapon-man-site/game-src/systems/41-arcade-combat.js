// Arcade hits (phase 4, playtest feedback: "too many circles for damage, I want proper knockback,
// MapleStory/arcade style").
//
//   knockback  every hit pushes a non-boss enemy a short, fixed distance away from the hero (by
//              weapon: dagger ~26 px ... hammer ~80 px, crits x1.35, fast repeats x0.75), then a
//              brief stagger. No more stacking velocity, launches or leaf-blower flights; only
//              crits and hammers add a small hop. The enemy faces the hero and flashes white.
//   sparks     a small pixel hit spark at the contact point (white core, rays in the weapon's
//              colour; bigger gold star on crits) replaces the expanding rings and impact discs.
//   rings      ring() calls made while a hit or kill is being processed are dropped (crit rings,
//              kill rings, proc rings). Explosions and big moments outside hits keep theirs.
// ?noarcade turns this module off.
(() => {
  const PX = globalThis.CWM_PX;
  if (!PX || globalThis.__CWM_ARCADE || new URLSearchParams(location.search).has('noarcade')) return;
  globalThis.__CWM_ARCADE = true;
  const ST = { hits: 0, ringsDropped: 0, impactsReplaced: 0, sparks: 0 };
  const on = () => PX.ready && PX._lutReady && PX._lutReady();

  // total push distance in world px, by weapon type
  const PUSH = { dagger: 26, shuriken: 26, nunchucks: 32, wand: 32, bow: 38, staff: 46, katana: 50, sword: 52, hammer: 80 };
  const RECOIL = 0.1; // seconds of free slide before the core's friction phases take over

  // ---- suppress rings during hit/kill processing ----
  let depth = 0;
  const ring0 = ring;
  ring = function (...a) {
    if (on() && (depth > 0 || !(a[3] >= 120))) {
      // small rings (hits, kills, procs, enemy tells) become a coloured spark; only big set-piece
      // rings (boss phases, screen-wide moments) still expand
      ST.ringsDropped++;
      if (depth === 0 && Number.isFinite(a[0]) && Number.isFinite(a[1])) addSpark(a[0], a[1], false, PX.paletteHex(a[2] || '#f8e08e'));
      return;
    }
    return ring0.apply(this, a);
  };
  const killE0 = killE;
  killE = function (...a) {
    depth++;
    try {
      return killE0.apply(this, a);
    } finally {
      depth--;
    }
  };

  // explosions: a big pixel burst instead of an expanding ring and a smoke disc
  const boom0 = boom;
  boom = function (x, y, col, r, pow) {
    if (!on()) return boom0(x, y, col, r, pow);
    depth++;
    try {
      boom0(x, y, col, r, pow);
    } finally {
      depth--;
    }
    if (sparks.length > 24) sparks.shift();
    sparks.push({ x, y, t: 0, crit: true, big: true, col: PX.paletteHex(col || '#ff7a3d'), rot: 0 });
    flash = Math.min(flash, 0.05);
  };

  // crits: keep the freeze and rumble, drop the full-screen white flash and colour split
  const critFX0 = critFX;
  critFX = function (...a) {
    const f0 = flash,
      c0 = chroma;
    const r = critFX0.apply(this, a);
    if (on()) {
      flash = f0;
      chroma = c0;
    }
    return r;
  };

  // ---- pixel sparks (device px, drawn after the world) ----
  const sparks = [];
  const HEXW = '#f4f1e8',
    HEXG = '#ffc15a',
    HEXC = '#f8e08e',
    INK = '#1a1428';
  function addSpark(wx, wy, crit, col) {
    if (sparks.length > 24) sparks.shift();
    sparks.push({ x: wx, y: wy, t: 0, crit, col: col || HEXC, rot: Math.random() < 0.5 ? 0 : 1 });
    ST.sparks++;
  }
  PX.afterWorld.push(function drawSparks() {
    const S = 0.375,
      sx = PX.shakeX || 0,
      sy = PX.shakeY || 0;
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.t++;
      const f = Math.floor(s.t / 2); // 2 render frames per spark frame
      const last = s.crit ? 4 : 3;
      if (f > last) {
        sparks.splice(i, 1);
        continue;
      }
      const x = Math.round(s.x * S + sx),
        y = Math.round(s.y * S + sy);
      const len = s.big ? [4, 9, 13, 15, 16][f] : s.crit ? [3, 6, 8, 9, 9][f] : [2, 4, 5, 5][f],
        gap = f === 0 ? 0 : f === 1 ? 1 : f === 2 ? 2 : len - 1;
      const rays = s.rot ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const all = s.crit ? [...rays, ...(s.rot ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 1], [1, -1], [-1, 1], [-1, -1]])] : rays;
      // core flash on the first frames
      if (f <= 1) {
        X.fillStyle = INK;
        X.fillRect(x - 2, y - 2, 5, 5);
        X.fillStyle = f === 0 ? HEXW : s.crit ? HEXG : s.col;
        X.fillRect(x - 1, y - 1, 3, 3);
      }
      for (let r = 0; r < all.length; r++) {
        const [dx, dy] = all[r],
          diag = dx && dy,
          L = diag ? Math.max(1, Math.round(len * 0.7)) : len;
        for (let k = gap + 1; k <= L; k++) {
          X.fillStyle = k === L ? (s.crit ? HEXG : s.col) : f === 0 ? HEXW : s.crit ? HEXC : HEXW;
          X.fillRect(x + dx * k, y + dy * k, 1, 1);
        }
      }
    }
  });

  function weaponColour() {
    try {
      const w = curW(),
        look = w && w.__look,
        L = look && PX.looks ? PX.looks.build(w, look, PX.looks.spriteFor(w, look), 0) : null;
      return L ? L.light : w && w.col ? PX.paletteHex(w.col) : HEXC;
    } catch (_) {
      return HEXC;
    }
  }

  // ---- knockback + spark ----
  // The outermost wrapper marks the "main" target of a hit; the innermost hook (systems/00a) then
  // applies the push right after the core, for the main hit (full push + spark) and for any splash
  // or proc hits the hit sets off (small push, no spark).
  let main = null;
  const hitE0 = hitE;
  hitE = function (e, a, o = {}) {
    if (!e || e.dead || !on()) return hitE0(e, a, o);
    const prev = main;
    main = { e, done: false };
    depth++;
    try {
      return hitE0(e, a, o);
    } finally {
      depth--;
      main = prev;
    }
  };
  globalThis.CWM_ON_HIT = function (e, dealt, o) {
    if (!on() || o.ignoreCap) return;
    const primary = !main || (main.e === e && !main.done);
    if (main && main.e === e) main.done = true;
    ST.hits++;
    const px = pl.x + pl.w / 2,
      ex = e.x + e.w / 2;
    const dir = Math.sign(Number.isFinite(o.knock) && o.knock !== 0 ? o.knock : ex - px) || 1;
    if (primary) {
      // spark on the side facing the hero, at roughly weapon height
      const sy = Math.max(e.y + 6, Math.min(e.y + e.h - 6, pl.y + pl.h * 0.45));
      addSpark(ex - dir * e.w * 0.35, sy, !!o.crit, weaponColour());
    }
    if (e.boss) return;
    const type = o.sourceType || (curW() && curW().type) || 'sword';
    let dist = PUSH[type] || 30;
    if (o.crit) dist *= 1.35;
    if (!primary) dist *= 0.4;
    else if (time - (e.__arcadeHitAt || -9) < 0.3 && !o.crit) dist *= 0.75;
    if (e.elite) dist *= 0.75;
    if (primary) e.__arcadeHitAt = time;
    const d = ED[e.type] || {};
    // replace whatever velocity the core/older systems stacked up with one clean push
    const v = dist / (RECOIL + 0.058); // free slide + the friction tail that follows
    e.vx = dir * v;
    e.recoilT = RECOIL;
    e.recoverT = Math.max(e.recoverT || 0, 0.06);
    e.stun = Math.max(e.stun || 0, primary ? (o.crit ? 0.4 : 0.26) : 0.12);
    e.hitT = Math.max(e.hitT || 0, 0.12);
    e.hitDir = dir;
    if (primary) e.dir = -dir;
    if (!d.air) {
      if (primary && (o.crit || type === 'hammer')) {
        e.vy = -150; // small hop
        e.on = false;
      } else if ((e.vy || 0) < 0) e.vy = 0; // no launches: the core's pop-up is cancelled
    } else e.vy = (e.vy || 0) * 0.3;
  };

  // impact discs from the core become sparks (they were pushed during the hit)
  const update0 = update;
  update = function (dt) {
    const r = update0(dt);
    if (on())
      for (let i = F.length - 1; i >= 0; i--)
        if (F[i] && (F[i].k === 'impact' || F[i].k === 'smoke')) {
          F.splice(i, 1);
          ST.impactsReplaced++;
        }
    return r;
  };

  globalThis.CWM_ARCADE = { stats: ST, PUSH };
})();
