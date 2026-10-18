// Pixel HUD (phase 3 of the noobscrub update), drawn into the 480x270 canvas after each frame.
//
//   bottom: framed bar  HP | SPECIAL | WEAPON (icon, name, DPS) | SHARDS + LV + XP   (style sheet)
//   top-left: zone name, wave progress and rift status   (like the "COURTYARD" label in ref 03)
//   top-centre: boss bar while a boss is up, and a short "new weapon" toast on auto-equip
// Replaces the HTML #fsHud panels and the shard-bank button, which pixel-theme.css hides
// whenever the pixel renderer is active (html.px). Uses CWM_PX helpers; ?nopx turns it off.
(() => {
  const PX = globalThis.CWM_PX;
  if (!PX || globalThis.__CWM_PIXEL_HUD) return;
  globalThis.__CWM_PIXEL_HUD = true;

  const PW = 480,
    PH = 270;
  const COL = {
    ink: '#1a1428', night: '#2b2442', slate: '#3e3a5c', stone: '#5d5a7a', fog: '#8a89a6', mist: '#c3c4d6',
    paper: '#f4f1e8', woodD: '#5d2f14', wood: '#8a4f22', gold: '#ffc15a', cream: '#f8e08e', orange: '#f08a2c',
    rust: '#c4501f', wine: '#7a1f2b', red: '#c4363e', coral: '#f06a52', teal: '#3bb8a8', pine: '#2f5a2c',
    lime: '#b7e27a', ice: '#a8dcfd', sky: '#5aa6f0', violet: '#7a4bc2'
  };
  const r = (x, y, w, h, c) => {
    X.fillStyle = COL[c] || c;
    X.fillRect(x, y, w, h);
  };
  const px = (x, y, c) => r(x, y, 1, 1, c);

  // tiny icons as fill maps (outline drawn by hand: these are 5-7px)
  function icon(map, key, x, y) {
    for (let j = 0; j < map.length; j++)
      for (let i = 0; i < map[j].length; i++) {
        const ch = map[j][i];
        if (ch !== '.') px(x + i, y + j, key[ch]);
      }
  }
  const HEART = ['.k.k.', 'krkrk', 'kwrrk', 'krrrk', '.krk.', '..k..'];
  const BOLT = ['..kk', '.ktk', 'kttk', '.ktk', 'ktk.', 'kk..'];
  const GEM = ['.kk.', 'kwik', 'kisk', '.kk.'];

  function bar(x, y, w, frac, col, dark) {
    r(x - 1, y - 1, w + 2, 6, 'ink');
    r(x, y, w, 4, 'night');
    const f = Math.max(0, Math.min(w, Math.round(w * frac)));
    if (f > 0) {
      r(x, y, f, 4, col);
      r(x, y + 3, f, 1, dark);
      r(x, y, f, 1, 'paper');
    }
  }

  // frame + slot dividers + labels on the top rule (MAIL / ARMS / KEY / GOLD style)
  const Y0 = 247,
    BH = 23,
    SLOTS = [
      [4, 112, 'HP'],
      [118, 92, 'SPECIAL'],
      [212, 186, 'WEAPON'],
      [400, 76, 'SHARDS']
    ];
  function frame() {
    r(0, Y0, PW, BH, 'woodD');
    r(1, Y0 + 1, PW - 2, BH - 2, 'wood');
    r(2, Y0 + 2, PW - 4, BH - 4, 'gold');
    r(3, Y0 + 3, PW - 6, BH - 6, 'night');
    for (const [sx] of SLOTS.slice(1)) {
      r(sx - 3, Y0 + 2, 3, BH - 4, 'wood');
      r(sx - 2, Y0 + 2, 1, BH - 4, 'gold');
      for (const k of [4, 10, 16]) px(sx - 2, Y0 + k, 'cream');
    }
    for (const [sx, , lab] of SLOTS) {
      const lw = PX.textWidth(lab);
      r(sx + 6, Y0 - 1, lw + 4, 10, 'woodD');
      PX.text(lab, sx + 8, Y0, COL.cream);
    }
  }

  let lastLv = 0,
    lvToast = 0;
  let specialMax = 1,
    lastW = null,
    lastDps = 0,
    toast = null;

  function hudFrame() {
    if (!PX.ready || !gameStarted) return;
    const w = curW();
    if (!w) return;
    const cy = Y0 + 12;
    X.save();
    X.setTransform(1, 0, 0, 1, 0, 0);
    X.globalAlpha = 1;
    frame();

    // HP
    icon(HEART, { k: 'ink', r: 'red', w: 'paper' }, 8, cy - 1);
    bar(18, cy + 1, 62, pl.hp / pl.max, pl.hp / pl.max < 0.3 ? 'coral' : 'red', 'wine');
    PX.text(globalThis.CWM_FMT ? CWM_FMT(Math.max(0, Math.ceil(pl.hp))) : String(Math.ceil(pl.hp)), 86, cy, COL.paper);

    // Special (space): cooldown fills up, READY when charged
    const rem = Math.max(0, Number(pl.scd) || 0);
    specialMax = Math.max(0.5, pl.__specialMax || (rem > specialMax ? rem : specialMax));
    const ready = rem <= 0.01;
    icon(BOLT, { k: 'ink', t: ready ? 'lime' : 'teal' }, 122, cy - 1);
    bar(130, cy + 1, 36, ready ? 1 : 1 - rem / specialMax, 'teal', 'pine');
    PX.text(ready ? 'READY' : rem.toFixed(1) + 'S', 171, cy, ready ? COL.lime : COL.mist);

    // Weapon: tinted sprite, name in rarity colour (trimmed), DPS
    const ic = PX.weaponIconFor ? PX.weaponIconFor(w) : PX.weaponIcon(w.type, w.col);
    let nx = 218;
    if (ic) {
      const k = Math.min(1, 10 / ic.h, 24 / ic.w),
        ih = Math.max(1, Math.round(ic.h * k)),
        iw = Math.max(1, Math.round(ic.w * k));
      X.imageSmoothingEnabled = false;
      X.drawImage(ic.cv, nx, cy + 3 - Math.floor(ih / 2), iw, ih);
      nx += iw + 4;
    }
    const dps = Math.round(estimateDPS(w));
    const dpsText = (globalThis.CWM_FMT ? CWM_FMT(dps) : dps) + ' DPS',
      dpsW = PX.textWidth(dpsText);
    const nameHex = PX.paletteHex(w.col);
    // long relic names scroll (pause, slide to the end, pause, snap back) instead of being cut off
    const room = 394 - dpsW - 10 - nx,
      nmW = PX.textWidth(w.name),
      nmCol = nameHex === COL.ink ? COL.mist : nameHex;
    if (nmW <= room) PX.text(w.name, nx, cy, nmCol);
    else {
      const over = nmW - room,
        slide = over / 14, // seconds at 14 px/s
        cyc = slide + 3,
        t = (performance.now() / 1000) % cyc,
        off = Math.round(t < 1.5 ? 0 : t < 1.5 + slide ? (t - 1.5) * 14 : over);
      X.save();
      X.beginPath();
      X.rect(nx, cy - 2, room, 12);
      X.clip();
      PX.text(w.name, nx - off, cy, nmCol);
      X.restore();
    }
    PX.text(dpsText, 394, cy, COL.gold, 1, 'right');

    // Shards, level, XP
    icon(GEM, { k: 'ink', w: 'paper', i: 'ice', s: 'sky' }, 404, cy + 1);
    PX.text(String(weaponShards), 410, cy, COL.ice);
    PX.text('LV' + pl.lv, 430, cy, COL.cream);
    bar(452, cy + 1, 20, pl.xp / pl.xpn, 'gold', 'rust');

    // top-left: zone + wave + rift
    PX.text(Z[zoneI].name, 6, 5, COL.paper);
    const alive = E.filter(e => !e.dead && !e.boss).length;
    let line = bossActive ? 'BOSS FIGHT' : `WAVE ${Math.min(stageClears + 1, stageGoal())}/${stageGoal()}  ${alive} LEFT`;
    const lw = PX.text(line, 6, 15, COL.mist);
    if (!bossActive && riftReady && Math.floor(time * 3) % 2 === 0) PX.text('RIFT OPEN', 6 + lw + 8, 15, COL.gold);
    PX.text(kills + ' KILLS', PW - 6, 5, COL.mist, 1, 'right');

    // boss bar
    const boss = bossActive && E.find(e => e.boss && !e.dead);
    if (boss) {
      const name = (APPROACH_THEMES[bossMode] || {}).name || 'BOSS';
      PX.text(name, PW / 2, 28, COL.gold, 1, 'center');
      r(PW / 2 - 101, 38, 202, 8, 'woodD');
      r(PW / 2 - 100, 39, 200, 6, 'gold');
      bar(PW / 2 - 99, 40, 198, boss.hp / boss.max, boss.hp / boss.max < 0.34 ? 'coral' : 'red', 'wine');
    }

    // new-weapon toast (auto-equip)
    if (w !== lastW) {
      if (lastW && dps > lastDps) toast = { name: w.name, hex: nameHex, standout: !!w.__standout, gain: Math.round((dps / Math.max(1, lastDps) - 1) * 100), t: 2.6 };
      lastW = w;
    }
    lastDps = dps;
    if (toast && toast.t > 0) {
      toast.t -= 1 / 60;
      const ty = boss ? 52 : 30,
        name = PX.fit(toast.name, 300),
        tw = Math.max(PX.textWidth(name), 90) + 16;
      r(PW / 2 - tw / 2 - 1, ty - 1, tw + 2, 24, 'ink');
      r(PW / 2 - tw / 2, ty, tw, 22, 'night');
      r(PW / 2 - tw / 2, ty, tw, 1, 'gold');
      PX.text((toast.standout ? 'STANDOUT WEAPON!  +' : 'NEW WEAPON  +') + toast.gain + '% DPS', PW / 2, ty + 3, toast.standout ? COL.lime || COL.gold : COL.gold, 1, 'center');
      PX.text(name, PW / 2, ty + 12, toast.hex === COL.ink ? COL.paper : toast.hex, 1, 'center');
    }
    // level-up toast (replaces the HTML level splash, which lived in the hidden juice HUD)
    if (pl.lv > lastLv) {
      if (lastLv) lvToast = 2;
      lastLv = pl.lv;
    }
    if (lvToast > 0) {
      lvToast -= 1 / 60;
      const blink = Math.floor(lvToast * 8) % 2 === 0;
      const ty = 92;
      r(PW / 2 - 70, ty - 2, 140, 36, 'ink');
      r(PW / 2 - 69, ty - 1, 138, 34, 'gold');
      r(PW / 2 - 68, ty, 136, 32, 'night');
      PX.text('LEVEL UP!', PW / 2, ty + 3, blink ? COL.cream : COL.gold, 2, 'center');
      PX.text('LV ' + pl.lv + '  MAX HP UP', PW / 2, ty + 21, COL.mist, 1, 'center');
    }
    X.restore();
  }

  const draw0 = draw;
  draw = function () {
    const out = draw0();
    try {
      hudFrame();
    } catch (e) {
      PX.hudError = String(e);
    }
    return out;
  };
})();
