  function renderWeaponArt(w) {
    const cv = U.wArt;
    if (!cv) return;
    let portraitId = w.id || w.name;
    if (portraitId === lastPortraitId && time - lastPortraitT < 0.24) return;
    lastPortraitId = portraitId;
    lastPortraitT = time;
    const g = cv.getContext('2d'),
      cw = cv.width,
      ch = cv.height,
      q = rarityRank(w);
    g.clearRect(0, 0, cw, ch);
    let bg = g.createRadialGradient(cw * 0.5, ch * 0.43, 8, cw * 0.5, ch * 0.5, cw * 0.72);
    bg.addColorStop(0, q >= 4 ? w.col + '55' : '#203148');
    bg.addColorStop(0.5, '#0e1722');
    bg.addColorStop(1, '#05080d');
    g.fillStyle = bg;
    g.fillRect(0, 0, cw, ch);
    g.strokeStyle = w.col;
    g.globalAlpha = 0.34 + 0.025 * q;
    g.lineWidth = 2 + q * 0.2;
    g.strokeRect(5, 5, cw - 10, ch - 10);
    g.globalAlpha = 1;
    for (let i = 0; i < 8 + Math.min(q, 8); i++) {
      let a = time * 0.5 + i * 0.77,
        r = 44 + q * 3 + (i % 3) * 9;
      g.fillStyle = q >= 8 ? `hsl(${(time * 80 + i * 31) % 360} 100% 72%)` : i % 2 ? w.col : '#ffffff';
      g.globalAlpha = 0.13 + 0.014 * q;
      g.beginPath();
      g.arc(
        cw / 2 + Math.cos(a) * r,
        ch / 2 + Math.sin(a * 1.2) * (26 + q * 2),
        1.5 + q * 0.14,
        0,
        Math.PI * 2
      );
      g.fill();
    }
    g.globalAlpha = 1;
    const fat = hasTrait(w, 'fat') ? 1.15 : 1,
      rar = 1 + Math.min(q, 10) * 0.055,
      int = w.intensity ? 1.06 : 1;
    let natural = {
      sword: [132, 42],
      dagger: [98, 34],
      nunchucks: [128, 78],
      katana: [150, 48],
      bow: [118, 92],
      shuriken: [92, 92],
      wand: [116, 68],
      staff: [146, 108],
      hammer: [150, 88]
    }[w.type] || [120, 70];
    let desiredW = cw * 0.64,
      desiredH = ch * 0.5,
      fit = Math.min(desiredW / natural[0], desiredH / natural[1]);
    let s = Math.min(fit * fat * rar * int, fit * 1.28); // rarity gets larger, but never clips the portrait
    g.save();
    g.translate(cw / 2, ch / 2 + 8);
    g.rotate(-0.08 + Math.sin(time * 0.8) * 0.018);
    g.scale(s, s);
    g.shadowColor = w.col;
    g.shadowBlur = (8 + q * 5) / s;
    function line(x1, y1, x2, y2, width, col) {
      g.strokeStyle = col;
      g.lineWidth = width;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
    }
    if (w.type === 'sword') {
      line(-58, 0, -36, 0, 6, '#6f5039');
      line(-38, -14, -38, 14, 5, '#d9c8a5');
      g.fillStyle = w.col;
      g.beginPath();
      g.moveTo(-32, -7);
      g.lineTo(58, -4);
      g.lineTo(70, 0);
      g.lineTo(58, 4);
      g.lineTo(-32, 7);
      g.closePath();
      g.fill();
      line(-20, -3, 54, -2, 2.3, q >= 2 ? '#fff8d6' : '#e8f5ff');
    } else if (w.type === 'dagger') {
      line(-44, 0, -28, 0, 6, '#674832');
      line(-30, -10, -30, 10, 4, '#d8c5a6');
      g.fillStyle = w.col;
      g.beginPath();
      g.moveTo(-25, -6);
      g.lineTo(40, -4);
      g.lineTo(53, 0);
      g.lineTo(40, 4);
      g.lineTo(-25, 6);
      g.closePath();
      g.fill();
      line(-15, -2, 38, -1.5, 2, '#f5fbff');
    } else if (w.type === 'nunchucks') {
      line(-48, -15, -8, -4, 9, w.col);
      line(8, 4, 48, 15, 9, w.col);
      g.strokeStyle = '#d7dde5';
      g.lineWidth = 2.8;
      g.beginPath();
      g.moveTo(-8, -4);
      g.quadraticCurveTo(0, 16, 8, 4);
      g.stroke();
      for (let i = 0; i < 4; i++) {
        let a = time * 3 + (i * Math.PI) / 2;
        g.fillStyle = q >= 6 ? `hsl(${(time * 120 + i * 70) % 360} 100% 72%)` : w.col;
        g.beginPath();
        g.arc(Math.cos(a) * 55, Math.sin(a) * 30, 3 + q * 0.15, 0, Math.PI * 2);
        g.fill();
      }
    } else if (w.type === 'katana') {
      line(-62, 7, -41, 7, 7, '#5f3c2f');
      line(-43, -6, -43, 18, 5, '#e2c78d');
      g.strokeStyle = w.col;
      g.lineWidth = 7;
      g.beginPath();
      g.moveTo(-37, 4);
      g.quadraticCurveTo(25, -2, 68, -18);
      g.stroke();
      g.strokeStyle = '#fff8dc';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-30, 1);
      g.quadraticCurveTo(27, -5, 63, -17);
      g.stroke();
    } else if (w.type === 'shuriken') {
      g.save();
      g.rotate(time * 1.7);
      g.fillStyle = w.col;
      for (let i = 0; i < 4; i++) {
        g.rotate(Math.PI / 2);
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(46, 0);
        g.lineTo(16, 15);
        g.closePath();
        g.fill();
      }
      g.fillStyle = '#f7fbff';
      g.beginPath();
      g.arc(0, 0, 8, 0, Math.PI * 2);
      g.fill();
      g.restore();
      if (q >= 4) {
        g.strokeStyle = '#fff';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(0, 0, 58, 0, Math.PI * 2);
        g.stroke();
      }
    } else if (w.type === 'bow') {
      g.strokeStyle = w.col;
      g.lineWidth = 6;
      g.beginPath();
      g.arc(0, 0, 42, -1.15, 1.15);
      g.stroke();
      line(18, -38, 18, 38, 1.8, q >= 3 ? '#fff3c1' : '#d8e0e8');
      line(18, 0, 58, 0, 2.5, '#f7fbff');
    } else if (w.type === 'wand') {
      line(-48, 22, 38, -18, 7, q >= 3 ? '#ead9ff' : '#715a52');
      g.fillStyle = w.col;
      g.beginPath();
      g.arc(45, -22, 12 + q * 0.45, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#fff';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(45, -22, 19 + q * 0.7, 0, Math.PI * 2);
      g.stroke();
    } else if (w.type === 'staff') {
      line(-56, 38, 44, -36, 9, q >= 3 ? '#eadfff' : '#755b48');
      g.fillStyle = w.col;
      g.beginPath();
      g.arc(51, -42, 15 + q * 0.55, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = q >= 5 ? `hsl(${(time * 130) % 360} 100% 72%)` : '#fff';
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(51, -42, 24 + q * 0.85, 0, Math.PI * 2);
      g.stroke();
      if (hasTrait(w, 'fat')) {
        g.globalAlpha = 0.22;
        g.fillStyle = '#fff';
        g.beginPath();
        g.ellipse(-6, 8, 34, 16, 0, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
      }
    } else {
      line(-52, 0, 10, 0, 9, '#6f5442');
      let hw = 58 + q * 2.4,
        hh = 38 + q * 1.5;
      g.fillStyle = w.col;
      g.fillRect(6, -hh / 2, hw, hh);
      g.strokeStyle = q >= 2 ? '#fff0b7' : '#d6dde5';
      g.lineWidth = 2.6;
      g.strokeRect(6, -hh / 2, hw, hh);
    }
    if (w.material) {
      let mc =
        {
          diamond: '#a7ffff',
          obsidian: '#af89ff',
          bone: '#f3dfb8',
          glass: '#dcfbff',
          void: '#b481ff',
          meat: '#ff7b94',
          gold: '#ffdc62',
          rubber: '#efff6e',
          nuclear: '#caff5f',
          frozen: '#9deeff',
          living: '#ff7bab',
          plasma: '#67eaff'
        }[w.material.code] || w.col;
      g.strokeStyle = mc;
      g.lineWidth = 2.2;
      g.globalAlpha = 0.85;
      for (let i = 0; i < 3; i++) {
        let a = time * 1.8 + (i * Math.PI * 2) / 3;
        g.beginPath();
        g.arc(Math.cos(a) * (28 + q), Math.sin(a) * (18 + q * 0.5), 7 + q * 0.25, 0, Math.PI * 2);
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    if (q >= 4) {
      g.strokeStyle = q >= 8 ? `hsl(${(time * 90) % 360} 100% 72%)` : '#ffffff';
      g.lineWidth = 1.5;
      for (let i = 0; i < Math.min(7, q - 2); i++) {
        let a = time * 0.8 + (i * Math.PI * 2) / Math.min(7, q - 2);
        g.beginPath();
        g.arc(Math.cos(a) * (52 + q * 1.2), Math.sin(a) * (34 + q * 0.8), 3 + q * 0.12, 0, Math.PI * 2);
        g.stroke();
      }
    }
    g.shadowBlur = 0;
    // trait/material visual language: the picture itself tells you what kind of nonsense this is
    if (hasTrait(w, 'rhythmic')) {
      g.fillStyle = '#fff39a';
      g.font = '18px system-ui';
      g.fillText('♪', -58, -34);
      g.fillText('♫', 35, 32);
    }
    if (hasTrait(w, 'asthma')) {
      g.strokeStyle = '#d9f7ff';
      g.globalAlpha = 0.65;
      g.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.arc(-45 - i * 9, 28 + i * 2, 7 + i * 3, 0.3, 2.8);
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    if (hasTrait(w, 'hex')) {
      g.strokeStyle = '#d17aff';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-18, -26);
      g.lineTo(0, -36);
      g.lineTo(18, -26);
      g.lineTo(13, -7);
      g.lineTo(-13, -7);
      g.closePath();
      g.stroke();
    }
    if (hasTrait(w, 'recursive')) {
      g.globalAlpha = 0.25;
      g.scale(0.7, 0.7);
      g.strokeStyle = w.col;
      g.strokeRect(-70, -45, 140, 90);
      g.globalAlpha = 1;
    }
    if (w.material && w.material.code === 'living') {
      g.fillStyle = '#fff';
      g.beginPath();
      g.ellipse(2, -8, 10, 6, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#15111b';
      g.beginPath();
      g.arc(4, -8, 3, 0, Math.PI * 2);
      g.fill();
    }
    if (w.material && w.material.code === 'nuclear') {
      g.strokeStyle = '#d7ff67';
      g.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        g.save();
        g.rotate((i * Math.PI * 2) / 3);
        g.beginPath();
        g.arc(0, 0, 36, 0.25, 1.8);
        g.stroke();
        g.restore();
      }
    }
    if (hasTrait(w, 'dark')) {
      g.globalAlpha = 0.82;
      g.fillStyle = '#05020b';
      g.beginPath();
      g.arc(0, 0, 44, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#7552ff';
      g.lineWidth = 4;
      g.beginPath();
      g.arc(0, 0, 52, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 1;
    }
    if (hasTrait(w, 'assbackwards')) {
      g.fillStyle = '#ffad7a';
      g.font = '900 15px system-ui';
      g.fillText('← ASS CANNON', -62, 48);
      g.strokeStyle = '#ffad7a';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-48, 34);
      g.lineTo(-70, 34);
      g.lineTo(-61, 27);
      g.moveTo(-70, 34);
      g.lineTo(-61, 41);
      g.stroke();
    }
    if (hasTrait(w, 'speedy')) {
      g.strokeStyle = '#79f7ff';
      g.lineWidth = 2.5;
      g.globalAlpha = 0.8;
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.moveTo(-70 - i * 5, -34 + i * 13);
        g.lineTo(-38 - i * 3, -34 + i * 13);
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    if (hasTrait(w, 'explosive')) {
      g.fillStyle = '#ff7f38';
      for (let i = 0; i < 6; i++) {
        let a = time * 2 + (i * Math.PI) / 3;
        g.beginPath();
        g.arc(Math.cos(a) * 48, Math.sin(a) * 35, 4, 0, Math.PI * 2);
        g.fill();
      }
    }
    if (hasTrait(w, 'gravitywrong')) {
      g.fillStyle = '#d0a8ff';
      g.font = '900 18px system-ui';
      g.fillText('↑', -54, -34);
      g.fillText('↓', 44, 40);
    }
    if (hasTrait(w, 'haunted')) {
      g.fillStyle = '#e7edff';
      g.globalAlpha = 0.65;
      for (let i = 0; i < 2; i++) {
        g.beginPath();
        g.arc(-28 + i * 56, -34, 8, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#4853a8';
        g.beginPath();
        g.arc(-26 + i * 56, -34, 3, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#e7edff';
      }
      g.globalAlpha = 1;
    }
    if (hasTrait(w, 'jazzhands')) {
      g.strokeStyle = `hsl(${(time * 150) % 360} 100% 70%)`;
      g.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        let a = (i * Math.PI) / 4;
        g.beginPath();
        g.moveTo(Math.cos(a) * 45, Math.sin(a) * 30);
        g.lineTo(Math.cos(a) * 65, Math.sin(a) * 48);
        g.stroke();
      }
    }
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.8)';
    g.font = '800 11px system-ui';
    g.textAlign = 'left';
    g.fillText(w.capName || w.rar.toUpperCase(), 11, 17);
  }
  function equip(w) {
    if (w && w.kind === 'armor') return equipArmor(w);
    let old = pl.weapon,
      oldD = old ? estimateDPS(old) : 0,
      newD = estimateDPS(w),
      better = !old || newD > oldD * 1.01;
    recordWeapon(w, newD);
    if (pl.boonCurator && rarityIndex(w) >= 5) styleAdd(12, 'CURATOR APPROVED');
    if (better) {
      let gain = oldD ? Math.round((newD / oldD - 1) * 100) : 100;
      pl.weapon = w;
      equipTypeHistory.push(w.type);
      equipTypeHistory = equipTypeHistory.slice(-6);
      announce(w);
      setEquipFx(w, 'WEAPON EQUIPPED');
      chaosTraitEquipFX(w);
      if (w.synergy) showSynergy(w);
      hudUpgradeT = rarityRank(w) >= 4 ? 2.5 : 1.7;
      U.fsUpgradeName.textContent = w.name;
      U.fsUpgradeName.style.color = w.col;
      U.fsUpgradeGain.textContent = `+${gain}% DPS — AUTO-EQUIPPED`;
      U.fsUpgrade.classList.add('show');
      lootSlow = 0;
      feedLine(
        `<b style="color:${w.col}">${w.name}</b><br>${w.rar} ${WM[w.type].label} • ${Math.round(newD)} DPS • <b>+${gain}% AUTO-EQUIP</b>`
      );
      U.msg.textContent = `AUTO-EQUIPPED ${w.name}: +${gain}% estimated DPS. Impact pause — then straight back to violence.`;
    } else {
      pl.hp = Math.min(pl.max, pl.hp + 25);
      pl.mana = Math.min(100, pl.mana + 8);
      lootSlow = 0;
      if (!w.fromShardForge) addWeaponShards(w, newD, oldD);
      else
        feedLine(
          `<span style="color:${w.col}">${w.name}</span> • D20 forge result rejected • ${Math.round(newD)} DPS < ${Math.round(oldD)} DPS`
        );
      U.msg.textContent = w.fromShardForge
        ? `THE SHARD D20 MADE GARBAGE: ${w.name} was weaker than your current weapon.`
        : `SALVAGED ${w.name} into weapon shards because ${Math.round(newD)} DPS could not beat ${Math.round(oldD)}.`;
    }
    render();
  }
  function makeUpgradeW(level) {
    let oldD = estimateDPS(curW()),
      best = null,
      bestD = 0;
    for (let i = 0; i < 80; i++) {
      let c = makeW(level + ri(0, 3), true),
        d = estimateDPS(c);
      if (d > bestD) {
        best = c;
        bestD = d;
      }
      if (d > oldD * 1.08) return c;
    }
    if (best && bestD <= oldD * 1.08) {
      best.m *= (oldD * 1.1) / Math.max(1, bestD);
      best.text += ' Clear-streak tuning forced this roll above your current DPS.';
    }
    return best || makeW(level + 2, true);
  }
  function clearReward() {
    let w = makeUpgradeW(Z[zoneI].lv + Math.floor(goodClears / 2)),
      x = clamp(pl.x + pl.dir * 85, 70, W - 70);
    spawnDrop(x, pl.y - 70, w, true);
    txt(pl.x + 17, pl.y - 65, 'MURDER STREAK CACHE', '#8ff8ff', true);
    ring(pl.x + 17, pl.y + 10, '#8ff8ff', 115, 5);
    U.msg.textContent = 'Fast clears forced a guaranteed higher-DPS weapon roll.';
  }

