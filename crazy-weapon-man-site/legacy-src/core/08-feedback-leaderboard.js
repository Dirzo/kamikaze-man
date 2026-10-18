  function txt(x, y, s, col = '#fff', big = false) {
    if (T.length > 64) T.shift();
    let life = big ? 1.55 : 0.98;
    T.push({ x, y, s, col, big, life, max: life });
  }
  function damagePop(e, n, crit = false, col = '#fff') {
    if (T.length > 70) T.shift();
    let digits = String(Math.max(1, Math.round(n))).length,
      tier = clamp(Math.log10(Math.max(1, n)) - 1, 0, 5),
      size = 22 + tier * 7 + (crit ? 12 : 0),
      scale = 1 + (crit ? 0.16 : 0.04);
    let critCol = tier >= 4 ? '#ff74ef' : tier >= 3 ? '#72efff' : tier >= 2 ? '#ffe16d' : '#ffb35d',
      normalCol = tier >= 4 ? '#9df7ff' : tier >= 2 ? '#f5fbff' : col;
    let label = crit
      ? tier >= 4
        ? 'WORLD-ENDING CRIT'
        : tier >= 3
          ? 'MONSTROUS CRIT'
          : tier >= 2
            ? 'MEGA CRIT'
            : 'CRIT'
      : tier >= 3
        ? 'HEAVY HIT'
        : '';
    let labelCol = crit ? (tier >= 4 ? '#ffd8ff' : tier >= 3 ? '#d3fbff' : '#fff7c3') : '#d7f6ff';
    if (crit) uiChime(tier >= 2);
    else if (tier >= 3 && Math.random() < 0.28) uiChime(false);
    T.push({
      kind: 'damage',
      x: e.x + e.w / 2 + rand(-9, 9),
      y: e.y - 6 - rand(0, 6),
      s: Math.round(n).toLocaleString('en-US'),
      col: crit ? critCol : normalCol,
      crit,
      life: crit ? 1.48 : 1.02,
      max: crit ? 1.48 : 1.02,
      size: Math.min(74, size),
      scale,
      vx: rand(-10, 10),
      rise: crit ? 82 : 66,
      digits,
      label,
      labelCol
    });
  }
  function fxPush(o) {
    if (F.length >= fxBudget) F.splice(0, Math.max(1, F.length - fxBudget + 1));
    F.push(o);
  }
  function part(x, y, col, n = 8, sp = 150, sz = 5) {
    n = Math.min(n, 36);
    for (let i = 0; i < n; i++) {
      let a = Math.random() * Math.PI * 2,
        v = rand(sp * 0.2, sp);
      fxPush({
        k: 'p',
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: rand(0.22, 0.58),
        sz: rand(2, sz),
        col
      });
    }
  }
  function ring(x, y, col, r = 100, w = 4) {
    fxPush({ k: 'r', x, y, r: 8, mr: r, life: 0.3, max: 0.3, col, w });
  }
  function beam(x, y, x2, y2, col, w = 4) {
    fxPush({ k: 'b', x, y, x2, y2, col, w, life: 0.11 });
  }
  function boom(x, y, col = '#ff7a3d', r = 120, pow = 1) {
    sfxExplosion(pow);
    ring(x, y, col, r, 5);
    part(x, y, col, Math.min(14, 8 + Math.round(pow * 4)), 250, 7);
    shake = Math.max(shake, 9 * pow);
    flash = Math.max(flash, 0.1 * pow);
    fxPush({ k: 'smoke', x, y, r: 20, mr: r * 0.8, life: 0.58, max: 0.58, col });
  }
  function announce(w) {
    sfxLoot(w);
    let q = rarityRank(w),
      riq = rarityIndex(w),
      dur = 1.45 + q * 0.14;
    bannerT = dur;
    U.banner.style.display = 'block';
    U.banner.style.borderColor = w.col;
    U.banner.style.color = w.col;
    U.banner.style.boxShadow = `0 0 ${18 + q * 8}px ${w.col}77,0 10px 34px #000b`;
    U.banner.style.animation = 'none';
    void U.banner.offsetWidth;
    U.banner.style.animation = `lootPop ${q >= 4 ? 0.46 : 0.34}s cubic-bezier(.2,.8,.2,1)`;
    let special = {
      8: '✦✦ MYTHIC DISCOVERY ✦✦',
      9: '✦✦ ULTRA MYTHIC — EXCUSE ME? ✦✦',
      10: '✦ EXOTIC WEAPON ✦',
      11: '✦✦ ULTRA EXOTIC ✦✦',
      12: '◆ RELIC RECOVERED ◆',
      13: '◆ ANCIENT OBJECT ◆',
      14: '✦ TRANSCENDENT DISCOVERY ✦',
      15: '??? UNHEARD OF ???',
      16: '★★★★★ SUPER ULTRA RARE ★★★★★',
      17: '☠ FORBIDDEN WEAPON ☠',
      18: '✦✦✦ IMPOSSIBLE OBJECT ✦✦✦',
      19: '!!! CATACLYSMIC ARMAMENT !!!',
      20: 'WHAT?! THIS SHOULD NOT EXIST'
    };
    let label =
      special[riq] ||
      (riq === 7
        ? '✦ LEGENDARY FOUND ✦'
        : riq === 6
          ? '✦ HEROIC WEAPON ✦'
          : riq === 5
            ? '✦ EPIC WEAPON FOUND ✦'
            : riq === 4
              ? '★★ SUPER RARE ★★'
              : riq === 3
                ? '★ RARE UPGRADE ★'
                : w.rar.toUpperCase() + ' WEAPON');
    U.br.textContent = label;
    U.bn.textContent = w.name;
    U.be.textContent = 'Higher DPS? Crazy Weapon Man instantly equips it. ' + w.text;
    uiChime(riq >= 4);
    if (riq >= 3) {
      let freeze = Math.min(0.58, 0.1 + riq * 0.024);
      stop = Math.max(stop, freeze);
      txt(pl.x + 17, pl.y - 44, w.rar.toUpperCase() + '!', w.col, true);
      ring(pl.x + 17, pl.y + 22, w.col, 80 + q * 20, 3 + q * 0.32);
      part(pl.x + 17, pl.y + 22, w.col, Math.min(34, 10 + q * 3), 145 + q * 22, 5 + q * 0.35);
      shake = Math.max(shake, 2 + q * 1.5);
      flash = Math.max(flash, 0.025 * q);
    }
    if (riq >= 7) {
      chroma = Math.max(chroma, 0.1 + q * 0.025);
      for (let i = 0; i < Math.min(4, 2 + Math.floor(q / 3)); i++)
        ring(pl.x + 17, pl.y + 22, i % 2 ? '#ffffff' : w.col, 100 + i * 28, 2 + q * 0.28);
    }
    if (riq >= 9) {
      for (let i = 0; i < Math.min(3, 1 + Math.floor((riq - 8) / 4)); i++) {
        let x = rand(100, W - 100);
        beam(x, 0, x + rand(-60, 60), G, w.col, 2 + q * 0.22);
      }
    }
    if (riq >= 16) {
      flash = 0.38;
      shake = 18;
    }
  }
  function feedLine(h) {
    feed.unshift(h);
    feed = feed.slice(0, 5);
    U.feed.innerHTML = feed.map(x => `<div class="feeditem">${x}</div>`).join('');
  }
  const LB_KEY = 'crazyWeaponMan.highDpsWeapons.v1';
  const NAME_KEY = 'crazyWeaponMan.playerName.v1';
  let leaderboard = [],
    globalBoard = false;
  function playerName() {
    let n = (U.playerName?.value || 'Anonymous Lunatic').trim().replace(/\s+/g, ' ');
    return n.slice(0, 20) || 'Anonymous Lunatic';
  }
  function loadLeaderboard() {
    try {
      let raw = localStorage.getItem(LB_KEY),
        v = raw ? JSON.parse(raw) : [];
      leaderboard = Array.isArray(v) ? v.filter(x => x && Number.isFinite(x.dps)).slice(0, 10) : [];
    } catch (e) {
      leaderboard = [];
    }
    try {
      let n = localStorage.getItem(NAME_KEY);
      if (n && U.playerName) U.playerName.value = n;
    } catch (e) {}
    globalBoard = false;
    if (U.globalStatus) U.globalStatus.textContent = 'OFFLINE • SAVED LOCALLY';
    renderLeaderboard();
  }
  function saveLeaderboard() {
    try {
      localStorage.setItem(LB_KEY, JSON.stringify(leaderboard.slice(0, 10)));
      localStorage.setItem(NAME_KEY, playerName());
    } catch (e) {}
  }
  function escapeHtml(v) {
    return String(v ?? '').replace(
      /[&<>"']/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  }
  function renderLeaderboard(newId = '') {
    if (!U.leaderboard) return;
    if (!leaderboard.length) {
      U.leaderboard.innerHTML = '<div class="lbempty">Collect something irresponsible.</div>';
      if (U.titleBest) U.titleBest.textContent = 'No weapon has earned the throne yet.';
      return;
    }
    U.leaderboard.innerHTML = leaderboard
      .map(
        (x, i) =>
          `<div class="lbrow${x.id === newId ? ' lbNew' : ''}"><div class="lbrank">${i + 1}</div><div><div class="lbname" style="color:${x.col || '#fff'}">${escapeHtml(x.name)}</div><div class="lbmeta">${escapeHtml(x.player || 'Anonymous Lunatic')} • ${escapeHtml(x.rar)} ${escapeHtml(x.type)} • seed ${escapeHtml(x.seed)}</div></div><div class="lbdps">${Number(x.dps).toLocaleString()} DPS</div></div>`
      )
      .join('');
    let b = leaderboard[0];
    if (U.titleBest) {
      U.titleBest.innerHTML = `${escapeHtml(b.name)} — ${Number(b.dps).toLocaleString()} DPS<br><span style="font-size:11px;color:#aebfd3">held by ${escapeHtml(b.player || 'Anonymous Lunatic')}</span>`;
    }
  }
  function syncGlobalLeaderboard() {
    globalBoard = false;
    if (U.globalStatus) U.globalStatus.textContent = 'OFFLINE • SAVED LOCALLY';
  }
  function submitGlobalWeapon(rec) {
    return false;
  }
  function recordWeapon(w, dps) {
    if (!w || w.rar === 'Training') return false;
    updateMuseum(w, dps);
    if (rarityIndex(w) >= 8 && Math.random() < 0.22)
      awardMeta(1, 'A sufficiently irresponsible weapon was documented.');
    let rec = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      player: playerName(),
      name: w.name,
      rar: w.rar,
      type: WM[w.type]?.label || w.type,
      col: w.col,
      dps: Math.round(dps),
      seed: runSeed,
      zone: Z[zoneI]?.name || 'Unknown',
      boss: bossMode || '',
      when: new Date().toISOString()
    };
    let local = [...leaderboard, rec].sort((a, b) => b.dps - a.dps).slice(0, 10),
      placed = local.some(x => x.id === rec.id);
    leaderboard = local;
    saveLeaderboard();
    renderLeaderboard(placed ? rec.id : '');
    if (placed && leaderboard[0].id === rec.id) {
      txt(pl.x + 17, pl.y - 82, 'NEW LOCAL DPS RECORD!', w.col, true);
      ring(pl.x + 17, pl.y + 10, w.col, 150, 6);
      shake = Math.max(shake, 8);
    }
    return placed;
  }

  function chip(label, major = false, col = '') {
    return `<span class="chip${major ? ' major' : ''}"${col ? ` style="border-color:${col};color:${col}"` : ''}>${label}</span>`;
  }
