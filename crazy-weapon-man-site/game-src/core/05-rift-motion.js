  function stageGoal() {
    return Math.max(Z[zoneI]?.goal || 6, (Z[zoneI]?.pool || []).length || 0);
  }
  function chooseRiftX() {
    let candidates = [115, W - 115, W / 2],
      safe = candidates.filter(x => !inMapWater(x));
    if (!safe.length) safe = candidates;
    safe.sort((a, b) => Math.abs(b - (pl.x + pl.w / 2)) - Math.abs(a - (pl.x + pl.w / 2)));
    return safe[0];
  }
  function openRift(fromBoss = false) {
    if (riftReady) return;
    lootSlow = 0;
    riftReady = true;
    riftEnterT = 0;
    riftX = chooseRiftX();
    packLive = false;
    chaosEvent = null;
    chaosT = 0;
    terrainMode = null;
    terrainHazards = [];
    master = 9;
    sfxStageClear();
    stop = Math.max(stop, 0.12);
    flash = Math.max(flash, 0.14);
    shake = Math.max(shake, 6);
    txt(W / 2, 150, fromBoss ? 'BOSS STAGE CLEAR!' : 'STAGE CLEAR!', '#8ff8ff', true);
    txt(W / 2, 184, 'RIFT OPEN — WALK INTO IT', '#fff176', true);
    ring(riftX, G - 52, '#8ff8ff', 95, 5);
    part(riftX, G - 55, '#b6f7ff', 16, 175, 6);
    U.msg.textContent = fromBoss
      ? 'Boon secured. The exit rift is open — walk into it when you are ready.'
      : `Stage cleared: ${stageClears}/${stageGoal()} packs. The rift is open; no surprise teleport.`;
  }
  function enterRift() {
    if (!riftReady || riftEnterT > 0) return;
    riftReady = false;
    riftEnterT = 0.72;
    pl.vx = 0;
    pl.vy = 0;
    pl.inv = Math.max(pl.inv, 1);
    sfxZone();
    stop = Math.max(stop, 0.12);
    txt(riftX, G - 118, 'ENTERING RIFT', '#bff8ff', true);
    ring(riftX, G - 55, '#ffffff', 125, 6);
    U.msg.textContent = 'Crazy Weapon Man voluntarily enters the rift. This was a conscious bad decision.';
  }
  function drawRift() {
    if (!riftReady && riftEnterT <= 0) return;
    let x = riftX,
      y = G - 115,
      pulse = 1 + Math.sin(time * 5) * 0.08;
    X.save();
    X.translate(x, y);
    X.globalAlpha = 0.9;
    X.shadowBlur = 16;
    X.shadowColor = '#73eaff';
    for (let i = 0; i < 4; i++) {
      X.strokeStyle = i % 2 ? '#ffffff' : '#70e8ff';
      X.lineWidth = 6 - i;
      X.beginPath();
      X.ellipse(
        0,
        0,
        (38 + i * 10) * pulse,
        (66 + i * 8) * pulse,
        time * (i % 2 ? -0.7 : 0.55),
        0,
        Math.PI * 2
      );
      X.stroke();
    }
    X.fillStyle = 'rgba(72,20,128,.42)';
    X.beginPath();
    X.ellipse(0, 0, 34 * pulse, 60 * pulse, 0, 0, Math.PI * 2);
    X.fill();
    for (let i = 0; i < 9; i++) {
      let a = time * (1.4 + i * 0.06) + (i * Math.PI * 2) / 9;
      X.fillStyle = i % 2 ? '#fff' : '#8ff8ff';
      X.beginPath();
      X.arc(Math.cos(a) * (45 + i), Math.sin(a) * (58 + i * 0.6), 2.2 + i * 0.08, 0, Math.PI * 2);
      X.fill();
    }
    X.shadowBlur = 0;
    X.textAlign = 'center';
    X.fillStyle = '#efffff';
    X.font = '1000 17px system-ui';
    X.fillText(riftEnterT > 0 ? 'RIFTING...' : 'WALK INTO THE RIFT', 0, -86);
    X.fillStyle = '#8ff8ff';
    X.font = '900 11px system-ui';
    X.fillText('STAGE CLEAR', 0, -68);
    X.restore();
    X.textAlign = 'left';
  }
  function attackMotion(w) {
    let q = rarityRank(w),
      sc = weaponScale(w),
      col = w.col;
    F.push({
      k: 'ghost',
      x: pl.x + 17 - pl.dir * (7 + q),
      y: pl.y + 25,
      dir: pl.dir,
      life: 0.14,
      max: 0.14,
      col,
      sc: 1 + q * 0.025
    });
    if (w.type === 'wand' || w.type === 'staff')
      F.push({
        k: 'rune',
        x: pl.x + 17 + pl.dir * (48 * sc),
        y: pl.y + 8,
        r: 22 + q * 3,
        life: 0.22,
        max: 0.22,
        col,
        spin: pl.dir
      });
    if (w.type === 'bow' || w.type === 'shuriken')
      F.push({
        k: 'speed',
        x: pl.x + 17,
        y: pl.y + 18,
        dir: pl.dir,
        life: 0.13,
        max: 0.13,
        col,
        n: 3 + Math.min(q, 5)
      });
    if (w.type === 'dagger' || w.type === 'nunchucks' || w.type === 'katana')
      F.push({
        k: 'speed',
        x: pl.x + 17,
        y: pl.y + 20,
        dir: pl.dir,
        life: 0.1,
        max: 0.1,
        col,
        n: w.type === 'nunchucks' ? 7 : 5
      });
    if (w.type === 'hammer')
      F.push({ k: 'speed', x: pl.x + 17, y: pl.y + 20, dir: pl.dir, life: 0.16, max: 0.16, col, n: 4 });
  }
  function skillMotion(w) {
    let q = rarityRank(w),
      ao = weaponAoe(w);
    F.push({
      k: 'rune',
      x: pl.x + 17,
      y: pl.y + 22,
      r: (42 + q * 5) * Math.min(1.8, ao),
      life: 0.42,
      max: 0.42,
      col: w.col,
      spin: pl.dir
    });
    for (let i = 0; i < Math.min(5, 2 + Math.floor(q / 2)); i++)
      F.push({
        k: 'r',
        x: pl.x + 17,
        y: pl.y + 22,
        r: 8,
        mr: (75 + i * 28) * Math.min(1.8, ao),
        life: 0.36 + i * 0.04,
        max: 0.36 + i * 0.04,
        col: i % 2 ? '#ffffff' : w.col,
        w: 2 + q * 0.25
      });
  }
  function enemyMeleeFX(e, d) {
    let big = d.atk === 'cleave';
    if (d.atk === 'hack' || d.atk === 'cleave') {
      F.push({
        k: 'enemySlash',
        x: e.x + e.w / 2 + e.dir * (big ? 24 : 18),
        y: e.y + e.h * 0.52,
        dir: e.dir,
        r: big ? 62 : 40,
        life: big ? 0.24 : 0.17,
        max: big ? 0.24 : 0.17,
        col: big ? '#ff7a58' : '#dfeaff',
        wide: big
      });
    } else if (d.atk === 'bite' || d.atk === 'leap') {
      F.push({
        k: 'impact',
        x: e.x + e.w / 2 + e.dir * 22,
        y: e.y + e.h * 0.55,
        col: d.col,
        life: 0.18,
        max: 0.18,
        r: big ? 35 : 24
      });
    }
  }

