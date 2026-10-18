  function limb(x1, y1, x2, y2, w, c) {
    X.strokeStyle = c;
    X.lineWidth = w;
    X.lineCap = 'round';
    X.beginPath();
    X.moveTo(x1, y1);
    X.lineTo(x2, y2);
    X.stroke();
  }
  function drawBg() {
    let z = Z[zoneI],
      g = X.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, z.a);
    g.addColorStop(1, z.b);
    X.fillStyle = g;
    X.fillRect(0, 0, W, H);
    X.save();
    if (z.bg === 'moon') {
      X.globalAlpha = 0.32;
      X.fillStyle = '#d8e4ff';
      X.beginPath();
      X.arc(1030, 145, 105, 0, Math.PI * 2);
      X.fill();
      X.fillStyle = '#25334d';
      X.beginPath();
      X.arc(995, 130, 12, 0, Math.PI * 2);
      X.arc(1060, 130, 12, 0, Math.PI * 2);
      X.fill();
      X.strokeStyle = '#25334d';
      X.lineWidth = 7;
      X.beginPath();
      X.arc(1028, 160, 43, 0.15, Math.PI - 0.15);
      X.stroke();
      X.globalAlpha = 0.18;
      X.fillStyle = z.h;
      for (let i = 0; i < 20; i++) {
        X.save();
        X.translate(i * 72, G - 55);
        X.rotate(-0.45 + Math.sin(i) * 0.25);
        X.fillRect(-3, -90, 6, 95);
        X.restore();
      }
    } else if (z.bg === 'disco') {
      X.globalAlpha = 0.28;
      for (let i = 0; i < 12; i++) {
        X.fillStyle = `hsl(${(i * 34 + time * 80) % 360} 85% 60%)`;
        X.fillRect(i * 112, 120 + (i % 3) * 42, 65, 330);
      }
      X.globalAlpha = 0.7;
      X.fillStyle = '#dffcff';
      X.beginPath();
      X.arc(W / 2, 105, 42, 0, Math.PI * 2);
      X.fill();
      X.strokeStyle = '#8affea';
      X.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        let a = (i * Math.PI) / 4 + time * 0.5;
        X.beginPath();
        X.moveTo(W / 2, 105);
        X.lineTo(W / 2 + Math.cos(a) * 500, 105 + Math.sin(a) * 430);
        X.stroke();
      }
    } else if (z.bg === 'volcano') {
      X.globalAlpha = 0.52;
      X.fillStyle = '#4b1a13';
      X.beginPath();
      X.moveTo(760, G);
      X.lineTo(980, 210);
      X.lineTo(1190, G);
      X.fill();
      X.fillStyle = '#ff6a2a';
      X.beginPath();
      X.moveTo(930, 315);
      X.lineTo(980, 210);
      X.lineTo(1032, 320);
      X.lineTo(990, 300);
      X.fill();
      X.globalAlpha = 0.55;
      X.fillStyle = '#ffcc4d';
      X.beginPath();
      X.arc(180, 120, 70, 0, Math.PI * 2);
      X.fill();
      X.fillStyle = '#24120d';
      X.fillRect(145, 105, 25, 12);
      X.fillRect(194, 105, 25, 12);
      X.strokeStyle = '#24120d';
      X.lineWidth = 7;
      X.beginPath();
      X.arc(182, 142, 30, 0, Math.PI);
      X.stroke();
    } else if (z.bg === 'train') {
      let tx = ((time * 105) % 1700) - 260;
      X.globalAlpha = 0.34;
      X.fillStyle = '#7d879e';
      X.fillRect(tx, 260, 760, 120);
      for (let i = 0; i < 7; i++) {
        X.fillStyle = i % 2 ? '#d7d8b0' : '#6b7690';
        X.fillRect(tx + 35 + i * 100, 285, 65, 48);
      }
      X.fillStyle = '#252c38';
      for (let i = 0; i < 8; i++) {
        X.beginPath();
        X.arc(tx + 55 + i * 95, 390, 20, 0, Math.PI * 2);
        X.fill();
      }
      X.globalAlpha = 0.14;
      X.fillStyle = z.h;
      for (let i = 0; i < 12; i++) X.fillRect(i * 115, 150, 18, 400);
    } else if (z.bg === 'eyes') {
      X.globalAlpha = 0.32;
      for (let i = 0; i < 8; i++) {
        let x = 110 + i * 155,
          y = 130 + (i % 3) * 120,
          r = 38 + (i % 2) * 15;
        X.fillStyle = '#e8ddff';
        X.beginPath();
        X.ellipse(x, y, r, r * 0.55, Math.sin(i) * 0.2, 0, Math.PI * 2);
        X.fill();
        X.fillStyle = '#2a0e3c';
        X.beginPath();
        X.arc(x + Math.sin(time + i) * 8, y, 12 + (i % 2) * 5, 0, Math.PI * 2);
        X.fill();
      }
      X.globalAlpha = 0.18;
      X.fillStyle = '#b16cff';
      for (let i = 0; i < 7; i++) {
        X.save();
        X.translate(100 + i * 190, 260);
        X.rotate(i % 2 ? Math.PI : 0);
        X.fillRect(-25, -160, 50, 360);
        X.restore();
      }
    } else if (z.bg === 'meat') {
      X.globalAlpha = 0.42;
      for (let i = 0; i < 7; i++) {
        let x = ((i * 210 + time * (12 + i * 3)) % (W + 180)) - 90,
          y = 100 + (i % 3) * 115;
        X.save();
        X.translate(x, y);
        X.rotate(time * 0.15 + i);
        X.fillStyle = '#d98586';
        X.beginPath();
        X.ellipse(0, 0, 70, 38, 0, 0, Math.PI * 2);
        X.fill();
        X.fillStyle = '#f1d5b8';
        X.beginPath();
        X.arc(42, 0, 24, 0, Math.PI * 2);
        X.fill();
        X.restore();
      }
      X.fillStyle = '#dff5ff';
      for (let i = 0; i < 60; i++) {
        let x = (i * 97) % W,
          y = (i * 61 + time * 45) % G;
        X.fillRect(x, y, 2, 5);
      }
    } else if (z.bg === 'grandma') {
      X.globalAlpha = 0.28;
      X.fillStyle = '#f5c7d8';
      for (let i = 0; i < 12; i++) X.fillRect(i * 118, 55, 52, H - 120);
      X.globalAlpha = 0.18;
      X.fillStyle = '#fff3c7';
      for (let i = 0; i < 7; i++) {
        X.beginPath();
        X.arc(105 + i * 190, 120 + (i % 2) * 85, 42, 0, Math.PI * 2);
        X.fill();
        X.strokeStyle = '#9f5b78';
        X.lineWidth = 5;
        X.stroke();
      }
      X.globalAlpha = 0.55;
      X.fillStyle = '#6b334f';
      X.font = '900 30px system-ui';
      X.fillText('PLEASE EAT SOMETHING', 650, 185);
      X.globalAlpha = 0.16;
      for (let i = 0; i < 10; i++) {
        X.fillStyle = i % 2 ? '#ffd6e6' : '#ffeaa6';
        X.fillRect(45 + i * 135, 390 + (i % 2) * 25, 72, 38);
      }
    } else if (z.bg === 'ceo') {
      X.globalAlpha = 0.34;
      X.fillStyle = '#0c1018';
      for (let i = 0; i < 10; i++) {
        X.fillRect(35 + i * 130, 65, 92, 390);
        X.fillStyle = '#ffd24f';
        for (let j = 0; j < 5; j++) X.fillRect(48 + i * 130, 85 + j * 66, 18 + (j % 2) * 13, 22);
        X.fillStyle = '#0c1018';
      }
      X.globalAlpha = 0.55;
      X.strokeStyle = '#ffd24f';
      X.lineWidth = 5;
      X.beginPath();
      X.moveTo(70, 370);
      X.lineTo(265, 320);
      X.lineTo(430, 345);
      X.lineTo(650, 230);
      X.lineTo(850, 260);
      X.lineTo(1130, 120);
      X.stroke();
      X.globalAlpha = 0.22;
      X.fillStyle = '#fff3ad';
      X.font = '1000 38px system-ui';
      X.fillText('Q4 HOSTILE TAKEOVER', 690, 180);
    } else if (z.bg === 'armory') {
      X.globalAlpha = 0.22;
      X.strokeStyle = '#e9f0ff';
      X.lineWidth = 5;
      for (let i = 0; i < 9; i++) {
        let x = 75 + i * 145;
        X.beginPath();
        X.moveTo(x, 95);
        X.lineTo(x, 430);
        X.stroke();
        X.beginPath();
        X.moveTo(x - 35, 145);
        X.lineTo(x + 35, 145);
        X.moveTo(x - 30, 245);
        X.lineTo(x + 30, 245);
        X.moveTo(x - 25, 345);
        X.lineTo(x + 25, 345);
        X.stroke();
      }
      X.globalAlpha = 0.32;
      for (let i = 0; i < 16; i++) {
        X.strokeStyle = i % 3 === 0 ? '#ff66d1' : i % 3 === 1 ? '#79f6ff' : '#fff176';
        X.lineWidth = 3;
        let x = 55 + (i % 8) * 165,
          y = 120 + Math.floor(i / 8) * 175;
        X.beginPath();
        X.moveTo(x, y);
        X.lineTo(x + 70, y + 35);
        X.stroke();
      }
      X.globalAlpha = 0.18;
      X.fillStyle = '#ffffff';
      X.font = '1000 40px system-ui';
      X.fillText('INVENTORY HAS ESCAPED', 645, 195);
    } else if (z.bg === 'storm') {
      X.globalAlpha = 0.4;
      X.fillStyle = '#101827';
      for (let i = 0; i < 9; i++) {
        X.beginPath();
        X.arc(80 + i * 150, 90 + (i % 2) * 35, 80, 0, Math.PI * 2);
        X.fill();
      }
      X.globalAlpha = 0.42;
      X.strokeStyle = '#cce7ff';
      X.lineWidth = 4;
      for (let i = 0; i < 5; i++) {
        let x = 150 + i * 250 + Math.sin(time * 2 + i) * 30;
        X.beginPath();
        X.moveTo(x, 0);
        X.lineTo(x - 25, 85);
        X.lineTo(x + 10, 100);
        X.lineTo(x - 20, 185);
        X.stroke();
      }
      X.globalAlpha = 0.18;
      X.fillStyle = '#ffffff';
      X.font = '900 36px system-ui';
      X.fillText('DEPARTMENT OF WEATHER', 700, 190);
      X.fillText('PLEASE HOLD', 815, 235);
    }
    X.restore();
    if (chaosEvent === 'disco') {
      X.globalAlpha = 0.14;
      for (let i = 0; i < 8; i++) {
        X.fillStyle = `hsl(${(time * 170 + i * 45) % 360} 100% 60%)`;
        X.fillRect((i * W) / 8, 0, W / 8, H);
      }
    }
    if (chaosEvent === 'lava') {
      let pulse = 0.55 + 0.2 * Math.sin(time * 8);
      X.globalAlpha = pulse;
      X.fillStyle = '#ff3d14';
      X.fillRect(0, G - 10, W, H - G + 10);
      X.fillStyle = '#ffd34c';
      for (let i = 0; i < 18; i++) {
        X.beginPath();
        X.arc(i * 80 + ((time * 80) % 80), G - 7, 8 + Math.sin(time * 6 + i) * 5, 0, Math.PI * 2);
        X.fill();
      }
    }
    X.globalAlpha = 1;
    // map-specific terrain silhouette layer
    if (mapScene.mountains)
      for (const m of mapScene.mountains) {
        X.fillStyle = zoneI === 2 ? '#4e2218' : '#263349';
        X.globalAlpha = 0.62;
        X.beginPath();
        X.moveTo(m.cx - m.base / 2, G);
        X.lineTo(m.cx, m.peak);
        X.lineTo(m.cx + m.base / 2, G);
        X.closePath();
        X.fill();
        X.globalAlpha = 1;
      }
    if (mapScene.hills)
      for (const h of mapScene.hills) {
        X.fillStyle = zoneI === 0 ? '#263242' : '#34475a';
        X.globalAlpha = 0.7;
        X.beginPath();
        X.ellipse(h.x + h.w / 2, G, h.w / 2, h.h, 0, Math.PI, Math.PI * 2);
        X.fill();
        X.globalAlpha = 1;
      }
    X.fillStyle = '#3e454f';
    X.fillRect(0, G, W, H - G);
    if (mapScene.water) {
      let wv = mapScene.water;
      X.globalAlpha = 0.78;
      X.fillStyle = wv.col;
      X.fillRect(wv.x, G - 13, wv.w, H - G + 13);
      X.globalAlpha = 0.55;
      X.strokeStyle = '#eaffff';
      X.lineWidth = 2;
      for (let xx = wv.x; xx < wv.x + wv.w; xx += 34) {
        X.beginPath();
        X.moveTo(xx, G - 10 + Math.sin(time * 3 + xx) * 3);
        X.quadraticCurveTo(xx + 9, G - 18, xx + 18, G - 10 + Math.cos(time * 3 + xx) * 3);
        X.stroke();
      }
      X.globalAlpha = 1;
      X.fillStyle = '#ffffffbb';
      X.font = '900 11px system-ui';
      X.textAlign = 'center';
      X.fillText(wv.name, wv.x + wv.w / 2, G + 25);
      X.textAlign = 'left';
    }
    if (chaosEvent === 'lava') {
      X.globalAlpha = 0.36;
      X.fillStyle = '#ff3d14';
      X.fillRect(0, G, W, H - G);
      X.globalAlpha = 1;
    }
    X.fillStyle = '#59606b';
    for (const p of platforms) {
      X.fillStyle =
        p.tag === 'ice'
          ? '#99e9ff'
          : p.tag === 'bone'
            ? '#e7dfcb'
            : p.tag === 'cloud'
              ? '#d8eaff'
              : p.tag === 'stone'
                ? '#777f87'
                : '#59606b';
      X.fillRect(p.x, p.y, p.w, p.h);
      X.fillStyle = p.tag === 'cloud' ? '#8da9c9' : '#2c323a';
      X.fillRect(p.x, p.y + p.h - 5, p.w, 5);
    }
  }
  function creature(e) {
    let d = ED[e.type];
    if (e.boss) {
      drawBoss(e);
      return;
    }
    if (e.state === 'spawn') {
      X.globalAlpha = 0.35;
      X.fillStyle = e.elite ? '#ff4a59' : '#6a3040';
      X.beginPath();
      X.ellipse(e.x + e.w / 2, d.air ? e.y + e.h : e.y + e.h - 2, e.w * 0.9, 8, 0, 0, Math.PI * 2);
      X.fill();
      X.globalAlpha = 1;
      return;
    }
    X.save();
    X.translate(e.x + e.w / 2, e.y + e.h / 2);
    if (!e.dead && e.hitT > 0) {
      let hp = e.hitT / 0.16;
      X.translate((e.hitDir || 1) * 8 * Math.sin(Math.PI * clamp(hp, 0, 1)), 0);
      X.scale(1 + 0.08 * hp, 1 - 0.06 * hp);
    }
    if (e.dead) {
      let q = 1 - clamp(e.death / 0.38, 0, 1);
      X.rotate(e.dir * q * 1.35);
      X.scale(1, 1 - q * 0.7);
      X.globalAlpha = 1 - q * 0.85;
    } else X.scale(e.dir, 1);
    let pulse = 1 + Math.sin(time * 6 + e.anim) * 0.04,
      hit = (e.hitT || 0) > 0 ? clamp((e.hitT || 0) / 0.22, 0, 1) : 0,
      recoil = (e.recoilT || 0) > 0 ? clamp((e.recoilT || 0) / 0.26, 0, 1) : 0;
    X.translate(-(e.hitDir || 0) * recoil * 9, 0);
    X.rotate(-(e.hitDir || 0) * recoil * 0.12);
    X.scale(pulse * (1 + hit * 0.14), pulse * (1 - hit * 0.18));
    if (e.themeCol) {
      X.save();
      X.globalAlpha = e.elite ? 0.24 : 0.11;
      X.strokeStyle = e.themeCol;
      X.lineWidth = e.elite ? 5 : 3;
      X.shadowBlur = e.elite ? 12 : 5;
      X.shadowColor = e.themeCol;
      X.beginPath();
      X.ellipse(0, 2, e.w * 0.62, e.h * 0.58, 0, 0, Math.PI * 2);
      X.stroke();
      X.restore();
    }
    let windP = e.state === 'wind' ? 1 - clamp(e.st / d.wind, 0, 1) : 0,
      atkP = e.state === 'lunge' ? 1 - clamp(e.st / (d.atk === 'cleave' ? 0.22 : 0.14), 0, 1) : 0,
      castP = e.state === 'cast' ? 1 - clamp(e.st / 0.18, 0, 1) : 0;
    if (d.shape === 'crawler') {
      X.fillStyle = e.elite ? '#a94452' : e.col;
      X.beginPath();
      X.ellipse(0, 4, e.w * 0.45, e.h * 0.36, 0, 0, Math.PI * 2);
      X.fill();
      for (let i = -1; i <= 1; i++) {
        let kick = e.state === 'lunge' ? 8 : 0;
        limb(-8 + i * 6, 8, -18 + i * 7 - kick, 18, 4, '#46545a');
        limb(8 + i * 6, 8, 18 + i * 7 + kick, 18, 4, '#46545a');
      }
      X.fillStyle = e.state === 'wind' ? '#ff3e3e' : '#12181d';
      X.fillRect(8, -2, 4, 4);
      if (e.state === 'lunge') {
        X.strokeStyle = '#d9fff0';
        X.lineWidth = 4;
        X.beginPath();
        X.arc(18, 4, 15, -0.8, 0.8);
        X.stroke();
      }
    } else if (d.shape === 'brute') {
      X.fillStyle = e.elite ? '#a73f4c' : e.col;
      X.fillRect(-e.w * 0.35, -e.h * 0.25, e.w * 0.7, e.h * 0.56);
      X.fillStyle = '#9b7b6e';
      X.beginPath();
      X.arc(0, -e.h * 0.34, 13, 0, Math.PI * 2);
      X.fill();
      limb(-18, 10, -24, 30, 8, '#4c4547');
      limb(18, 10, 24, 30, 8, '#4c4547');
      X.strokeStyle = '#d8b58c';
      X.lineWidth = 5;
      X.beginPath();
      X.moveTo(-8, -42);
      X.lineTo(-18, -56);
      X.moveTo(8, -42);
      X.lineTo(18, -56);
      X.stroke();
      let ang = e.state === 'wind' ? -1.9 + windP * 0.65 : e.state === 'lunge' ? -1.25 + atkP * 2.7 : 0.45;
      let hx = Math.cos(ang) * 34,
        hy = Math.sin(ang) * 34;
      limb(15, -8, hx, hy, 8, '#72594f');
      X.save();
      X.translate(hx, hy);
      X.rotate(ang);
      X.strokeStyle = '#d9e1e6';
      X.lineWidth = 7;
      X.beginPath();
      X.moveTo(-4, -14);
      X.lineTo(4, 14);
      X.stroke();
      X.restore();
      if (e.state === 'lunge') {
        X.strokeStyle = 'rgba(255,113,75,.75)';
        X.lineWidth = 7;
        X.beginPath();
        X.arc(10, 0, 48, -1.4, 1.2);
        X.stroke();
      }
      X.fillStyle = e.state === 'wind' ? '#ff3636' : '#111820';
      X.fillRect(4, -28, 5, 5);
    } else if (d.shape === 'wraith') {
      X.fillStyle = e.elite ? '#9d476a' : e.col;
      X.beginPath();
      X.moveTo(-16, -18);
      X.quadraticCurveTo(0, -36, 16, -18);
      X.lineTo(11, 20);
      X.lineTo(0, 10);
      X.lineTo(-11, 20);
      X.closePath();
      X.fill();
      X.fillStyle = e.state === 'wind' ? '#ff954f' : '#9fe3ff';
      X.fillRect(4, -18, 4, 4);
      let orb = e.state === 'wind' || e.state === 'cast' ? 9 + windP * 7 : 0;
      if (orb) {
        X.shadowBlur = 18;
        X.shadowColor = d.bolt;
        X.fillStyle = d.bolt;
        X.beginPath();
        X.arc(22, -6, orb * 0.55, 0, Math.PI * 2);
        X.fill();
        X.shadowBlur = 0;
        limb(7, -5, 18, -5, 4, '#8ba3bf');
      }
      if (e.state === 'cast') {
        X.strokeStyle = d.bolt;
        X.lineWidth = 5;
        X.beginPath();
        X.arc(20, -6, 18 + castP * 18, -0.7, 0.7);
        X.stroke();
      }
    } else if (d.shape === 'maw') {
      X.fillStyle = e.elite ? '#a34364' : e.col;
      X.beginPath();
      X.ellipse(0, 2, e.w * 0.46, e.h * 0.4, 0, 0, Math.PI * 2);
      X.fill();
      let bite = e.state === 'lunge' ? Math.sin(atkP * Math.PI) * 8 : 0;
      X.fillStyle = '#150e12';
      X.beginPath();
      X.ellipse(12 + bite, 5, 20 + bite * 0.4, 15, 0, 0, Math.PI * 2);
      X.fill();
      X.strokeStyle = '#f0d4cf';
      X.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        X.beginPath();
        X.moveTo(0 + i * 6, -3);
        X.lineTo(4 + i * 6 + bite, 4);
        X.stroke();
      }
      limb(-22, 15, -30, 28, 5, '#493f4a');
      limb(4, 18, 12, 30, 5, '#493f4a');
      if (e.state === 'lunge') {
        X.strokeStyle = '#ffb0c3';
        X.lineWidth = 4;
        X.beginPath();
        X.arc(28, 5, 22, -1, 1);
        X.stroke();
      }
    } else if (d.shape === 'flyer') {
      X.fillStyle = e.elite ? '#9c4876' : e.col;
      X.beginPath();
      X.ellipse(0, 0, 17, 13, 0, 0, Math.PI * 2);
      X.fill();
      X.strokeStyle = '#8d7ec1';
      X.lineWidth = 5;
      X.beginPath();
      X.moveTo(-9, -3);
      X.lineTo(-30, -17 - Math.sin(time * 12 + e.anim) * 9);
      X.moveTo(9, -3);
      X.lineTo(30, -17 - Math.sin(time * 12 + e.anim) * 9);
      X.stroke();
      X.fillStyle = e.state === 'wind' ? '#ffcf5c' : '#d8dcff';
      X.fillRect(5, -5, 4, 4);
      if (e.state === 'wind' || e.state === 'cast') {
        X.shadowBlur = 18;
        X.shadowColor = d.bolt;
        X.fillStyle = d.bolt;
        X.beginPath();
        X.arc(18, 2, 6 + windP * 5, 0, Math.PI * 2);
        X.fill();
        X.shadowBlur = 0;
      }
    } else if (d.shape === 'wizard') {
      X.fillStyle = e.elite ? '#a843d1' : e.col;
      X.beginPath();
      X.moveTo(-18, 20);
      X.lineTo(0, -28);
      X.lineTo(18, 20);
      X.closePath();
      X.fill();
      X.fillStyle = '#e6cfba';
      X.beginPath();
      X.arc(0, -18, 8, 0, Math.PI * 2);
      X.fill();
      X.fillStyle = '#5e2d8d';
      X.beginPath();
      X.moveTo(-15, -22);
      X.lineTo(0, -48);
      X.lineTo(14, -20);
      X.closePath();
      X.fill();
      let orb = e.state === 'wind' || e.state === 'cast' ? 8 + windP * 10 : 3;
      X.shadowBlur = 22;
      X.shadowColor = d.bolt;
      X.fillStyle = d.bolt;
      X.beginPath();
      X.arc(25, -4, orb, 0, Math.PI * 2);
      X.fill();
      X.shadowBlur = 0;
      limb(7, -7, 21, -5, 4, '#e6cfba');
    } else if (d.shape === 'taxman') {
      X.fillStyle = '#344154';
      X.fillRect(-13, -15, 26, 34);
      X.fillStyle = '#e6d5c7';
      X.beginPath();
      X.arc(0, -22, 9, 0, Math.PI * 2);
      X.fill();
      X.fillStyle = '#111820';
      X.fillRect(4, -24, 4, 4);
      X.fillStyle = '#ffffff';
      X.fillRect(13, -12, 18, 24);
      X.strokeStyle = '#ff496b';
      X.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        X.beginPath();
        X.moveTo(16, -7 + i * 6);
        X.lineTo(28, -7 + i * 6);
        X.stroke();
      }
      if (e.state === 'wind') {
        X.fillStyle = '#ff496b';
        X.font = '900 12px system-ui';
        X.fillText('AUDIT', 12, -20);
      }
    } else if (d.shape === 'mimic') {
      let open = e.state === 'wind' || e.state === 'lunge' ? 8 + windP * 8 : 0;
      X.fillStyle = e.elite ? '#b87835' : e.col;
      X.fillRect(-29, -8, 58, 31);
      X.strokeStyle = '#5a3a20';
      X.lineWidth = 5;
      X.strokeRect(-29, -8, 58, 31);
      X.fillStyle = '#1a0e08';
      X.beginPath();
      X.moveTo(-28, -6);
      X.lineTo(28, -6);
      X.lineTo(24, -19 - open);
      X.lineTo(-24, -19 - open);
      X.closePath();
      X.fill();
      X.strokeStyle = '#f5e5c4';
      X.lineWidth = 3;
      for (let i = -18; i <= 18; i += 9) {
        X.beginPath();
        X.moveTo(i, -7);
        X.lineTo(i + 3, -15 - open * 0.5);
        X.stroke();
      }
      X.fillStyle = '#ff445c';
      X.beginPath();
      X.arc(14, -23 - open, 5, 0, Math.PI * 2);
      X.fill();
    } else if (d.shape === 'eyeball') {
      X.fillStyle = e.elite ? '#ff8bd5' : '#f2d8ec';
      X.beginPath();
      X.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
      X.fill();
      X.fillStyle = e.state === 'wind' ? '#ff3eeb' : '#58255d';
      X.beginPath();
      X.arc(5, 0, 9 + windP * 3, 0, Math.PI * 2);
      X.fill();
      X.strokeStyle = '#ad6ba2';
      X.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        let a = (i * Math.PI * 2) / 5;
        X.beginPath();
        X.moveTo(-12, Math.sin(a) * 8);
        X.lineTo(-28, Math.sin(a) * 15);
        X.stroke();
      }
    } else if (d.shape === 'chicken') {
      let flap = Math.sin(time * 18 + e.anim) * 7;
      X.fillStyle = e.elite ? '#ffb53c' : e.col;
      X.beginPath();
      X.ellipse(0, 2, 17, 13, 0, 0, Math.PI * 2);
      X.fill();
      X.fillStyle = '#f5e6aa';
      X.beginPath();
      X.arc(10, -9, 9, 0, Math.PI * 2);
      X.fill();
      X.fillStyle = '#ff5538';
      X.beginPath();
      X.moveTo(18, -9);
      X.lineTo(29, -5);
      X.lineTo(18, -2);
      X.fill();
      X.strokeStyle = '#e8d287';
      X.lineWidth = 4;
      X.beginPath();
      X.moveTo(-5, 3);
      X.lineTo(-22, -6 - flap);
      X.stroke();
      if (e.state === 'bomb') {
        X.fillStyle = Math.floor(e.st * 12) % 2 ? '#ff3344' : '#fff35b';
        X.font = '900 16px system-ui';
        X.fillText('!', -3, -24);
      }
    } else if (d.shape === 'shield') {
      X.fillStyle = e.elite ? '#6f93a8' : e.col;
      X.fillRect(-13, -15, 26, 34);
      X.fillStyle = '#d5c5b8';
      X.beginPath();
      X.arc(0, -22, 9, 0, Math.PI * 2);
      X.fill();
      limb(-7, 8, -9, 27, 6, '#46515a');
      limb(7, 8, 9, 27, 6, '#46515a');
      X.fillStyle = '#7699ad';
      X.strokeStyle = '#d6f0ff';
      X.lineWidth = 3;
      X.beginPath();
      X.roundRect(10, -24, 25, 48, 6);
      X.fill();
      X.stroke();
      X.fillStyle = '#d6f0ff';
      X.font = '900 9px system-ui';
      X.fillText('AP', 17, 2);
      if (e.turnT > 0) {
        X.fillStyle = '#ffe08a';
        X.font = '900 9px system-ui';
        X.fillText('TURN', -13, -34);
      }
      if (e.state === 'lunge') {
        X.strokeStyle = '#bde8ff';
        X.lineWidth = 6;
        X.beginPath();
        X.arc(30, 0, 28, -1.1, 1.1);
        X.stroke();
      }
    } else if (d.shape === 'blinker') {
      X.fillStyle = e.elite ? '#c36fff' : e.col;
      X.beginPath();
      X.moveTo(-12, -16);
      X.lineTo(12, -16);
      X.lineTo(9, 20);
      X.lineTo(-9, 20);
      X.closePath();
      X.fill();
      X.fillStyle = '#d8c8c2';
      X.beginPath();
      X.arc(0, -21, 8, 0, Math.PI * 2);
      X.fill();
      X.fillStyle = '#24152f';
      X.fillRect(-8, -23, 16, 5);
      for (let i = 1; i <= 3; i++) {
        X.globalAlpha = 0.18 / i;
        X.fillStyle = d.col;
        X.fillRect(-12 - e.dir * i * 12, -16, 24, 36);
      }
      X.globalAlpha = 1;
      let a = e.state === 'lunge' ? -1 + atkP * 2.5 : 0.3;
      limb(7, -5, Math.cos(a) * 25, Math.sin(a) * 25, 4, '#cab7ae');
      X.strokeStyle = '#ead9ff';
      X.lineWidth = 4;
      X.beginPath();
      X.moveTo(Math.cos(a) * 25, Math.sin(a) * 25);
      X.lineTo(Math.cos(a) * 42, Math.sin(a) * 42);
      X.stroke();
    } else if (d.shape === 'summoner') {
      X.fillStyle = e.elite ? '#70c780' : e.col;
      X.beginPath();
      X.moveTo(-19, 22);
      X.lineTo(-7, -27);
      X.lineTo(7, -27);
      X.lineTo(19, 22);
      X.closePath();
      X.fill();
      X.fillStyle = '#d9d4c8';
      X.beginPath();
      X.arc(0, -20, 8, 0, Math.PI * 2);
      X.fill();
      X.strokeStyle = '#9dffac';
      X.lineWidth = 5;
      X.beginPath();
      X.moveTo(12, 8);
      X.lineTo(27, -23);
      X.stroke();
      X.fillStyle = '#91ffaa';
      X.beginPath();
      X.arc(29, -27, 7, 0, Math.PI * 2);
      X.fill();
      if (e.state === 'summonwind') {
        X.strokeStyle = '#7dff9a';
        X.lineWidth = 4;
        for (let i = 0; i < 3; i++) {
          X.beginPath();
          X.arc(0, 12, 20 + i * 10, time * (i + 1), time * (i + 1) + 4.5);
          X.stroke();
        }
      }
    } else if (d.shape === 'sniper') {
      X.fillStyle = e.elite ? '#b87361' : e.col;
      X.fillRect(-12, -15, 24, 34);
      X.fillStyle = '#dbc8bb';
      X.beginPath();
      X.arc(0, -22, 8, 0, Math.PI * 2);
      X.fill();
      X.strokeStyle = '#e4d4a2';
      X.lineWidth = 6;
      X.beginPath();
      X.moveTo(3, -7);
      X.lineTo(42, -7);
      X.stroke();
      X.strokeStyle = '#ffdf7a';
      X.lineWidth = 2;
      X.beginPath();
      X.moveTo(25, -9);
      X.lineTo(32, -16);
      X.stroke();
      if (e.state === 'wind') {
        X.strokeStyle = 'rgba(255,70,70,.85)';
        X.lineWidth = 2;
        X.beginPath();
        X.moveTo(40, -7);
        X.lineTo((pl.x + pl.w / 2 - (e.x + e.w / 2)) * e.dir, pl.y + pl.h / 2 - (e.y + e.h / 2));
        X.stroke();
      }
    } else if (d.shape === 'roller') {
      X.rotate(time * 8 * e.dir);
      X.fillStyle = e.elite ? '#c0ced9' : e.col;
      X.beginPath();
      X.arc(0, 0, 22, 0, Math.PI * 2);
      X.fill();
      X.strokeStyle = '#e3edf5';
      X.lineWidth = 5;
      for (let i = 0; i < 8; i++) {
        let a = (i * Math.PI) / 4;
        X.beginPath();
        X.moveTo(Math.cos(a) * 19, Math.sin(a) * 19);
        X.lineTo(Math.cos(a) * 31, Math.sin(a) * 31);
        X.stroke();
      }
      X.fillStyle = '#20262d';
      X.beginPath();
      X.arc(0, 0, 8, 0, Math.PI * 2);
      X.fill();
    } else {
      let run = Math.min(1, Math.abs(e.vx) / 80),
        cy = time * 9 + e.anim,
        st = Math.sin(cy) * 8 * run;
      limb(-7, 10, -8 + st * 0.4, 25, 6, '#414b53');
      limb(7, 10, 8 - st * 0.4, 25, 6, '#414b53');
      X.fillStyle = e.elite ? '#a5404c' : e.col;
      X.fillRect(-12, -14, 24, 30);
      X.fillStyle = '#9da7af';
      X.beginPath();
      X.arc(0, -20, 9, 0, Math.PI * 2);
      X.fill();
      let ang = e.state === 'wind' ? -1.5 + windP * 0.5 : e.state === 'lunge' ? -1 + atkP * 2.35 : 0.25;
      let hx = Math.cos(ang) * 27,
        hy = -2 + Math.sin(ang) * 27;
      limb(8, -5, hx, hy, 5, '#8f7970');
      X.save();
      X.translate(hx, hy);
      X.rotate(ang);
      X.strokeStyle = '#cfd7dc';
      X.lineWidth = 5;
      X.beginPath();
      X.moveTo(0, 0);
      X.lineTo(22, 0);
      X.stroke();
      X.restore();
      if (e.state === 'lunge') {
        X.strokeStyle = 'rgba(230,240,255,.7)';
        X.lineWidth = 5;
        X.beginPath();
        X.arc(12, 0, 35, -1.25, 1.1);
        X.stroke();
      }
      X.fillStyle = e.state === 'wind' ? '#ff3636' : '#111820';
      X.fillRect(4, -23, 4, 4);
    }
    if (e.rareMutator && !e.dead) {
      let rr = Math.max(e.w, e.h) * 0.68 + 5 + Math.sin(time * 6 + (e.rarePulse || 0)) * 4;
      X.save();
      X.globalAlpha = 0.78;
      X.strokeStyle = e.rareMutator.col;
      X.shadowBlur = 18;
      X.shadowColor = e.rareMutator.col;
      X.lineWidth = 3;
      X.beginPath();
      X.arc(0, 0, rr, 0, Math.PI * 2);
      X.stroke();
      for (let i = 0; i < 3; i++) {
        let a = time * 2.2 + (i * Math.PI * 2) / 3;
        X.fillStyle = i === 1 ? '#fff' : e.rareMutator.col;
        X.beginPath();
        X.arc(Math.cos(a) * rr, Math.sin(a) * rr, 3.5, 0, Math.PI * 2);
        X.fill();
      }
      X.restore();
    }
    if (e.traits && e.traits.length) {
      for (let i = 0; i < e.traits.length; i++) {
        let tt = e.traits[i],
          a = time * 1.5 + (i * Math.PI * 2) / e.traits.length;
        X.fillStyle = tt.col;
        X.shadowBlur = 8;
        X.shadowColor = tt.col;
        X.beginPath();
        X.arc(Math.cos(a) * (e.w * 0.48 + 8), Math.sin(a) * (e.h * 0.34 + 5), 3.5, 0, Math.PI * 2);
        X.fill();
      }
      X.shadowBlur = 0;
    }
    if (e.elite) {
      X.strokeStyle = '#ff5c69';
      X.lineWidth = 2;
      X.globalAlpha = 0.8;
      X.beginPath();
      X.arc(0, 0, Math.max(e.w, e.h) * 0.58 + Math.sin(time * 8) * 3, 0, Math.PI * 2);
      X.stroke();
    }
    X.restore();
    if (e.state === 'wind' && !e.dead) {
      let p = 1 - e.st / d.wind;
      X.strokeStyle = `rgba(255,65,65,${0.28 + 0.65 * p})`;
      X.lineWidth = 3;
      X.beginPath();
      X.arc(
        e.x + e.w / 2,
        d.air ? e.y + e.h / 2 : G - 6,
        (d.range > 150 ? 44 : d.range + 12) * (0.6 + 0.4 * p),
        0,
        Math.PI * 2
      );
      X.stroke();
    }
    if (e.elite || e.hp < e.max) {
      X.fillStyle = '#0b0e13';
      X.fillRect(e.x, e.y - 11, e.w, 5);
      X.fillStyle = e.elite ? '#ff5d69' : '#d95d6a';
      X.fillRect(e.x, e.y - 11, e.w * (e.hp / e.max), 5);
    }
    if (
      e.themeReveal > 0 ||
      e.rareMutator ||
      e.elite ||
      ['shieldbro', 'blinker', 'summoner', 'sniper', 'roller'].includes(e.type)
    ) {
      X.textAlign = 'center';
      X.font = e.rareMutator
        ? '1000 12px system-ui'
        : e.themeReveal > 0
          ? '900 10px system-ui'
          : '800 11px system-ui';
      X.fillStyle = e.rareMutator
        ? e.rareMutator.col
        : e.elite
          ? e.themeCol || '#ff9aa4'
          : e.themeReveal > 0
            ? e.themeCol || '#c9d8e8'
            : '#c9d8e8';
      X.strokeStyle = 'rgba(5,8,14,.9)';
      X.lineWidth = 3;
      if (e.rareMutator) X.strokeText(e.label || enemyName(e.type, e.elite), e.x + e.w / 2, e.y - 29);
      X.fillText(e.label || enemyName(e.type, e.elite), e.x + e.w / 2, e.rareMutator ? e.y - 29 : e.y - 17);
      if (e.rareMutator) {
        X.font = '900 9px system-ui';
        X.fillStyle = '#f4f8ff';
        X.strokeText('KILL → ' + e.rareMutator.name, e.x + e.w / 2, e.y - 17);
        X.fillText('KILL → ' + e.rareMutator.name, e.x + e.w / 2, e.y - 17);
      }
    }
    if (e.traits && e.traits.length) {
      X.textAlign = 'center';
      X.font = '900 8px system-ui';
      X.fillStyle = e.traits[0].col;
      X.fillText(enemyTraitText(e), e.x + e.w / 2, e.y - 6);
    }
    X.textAlign = 'left';
  }
  function playerDraw() {
    let w = curW(),
      q = rarityRank(w),
      sc = weaponScale(w),
      run = pl.on ? Math.min(1, Math.abs(pl.vx) / 190) : 0,
      cy = time * 12,
      st = Math.sin(cy) * 9 * run,
      bob = Math.abs(Math.sin(cy)) * 2 * run,
      atk = pl.at > 0 ? 1 - pl.at / Math.max(0.01, pl.atMax) : 0,
      step = pl.combo % 3,
      body = 0,
      ang = 0.1,
      breathe = 1 + Math.sin(time * 5.2) * 0.018,
      headArmor = pl.armors?.head || null,
      bodyArmor = pl.armors?.body || null,
      feetArmor = pl.armors?.feet || null,
      dpsNow = Math.max(10, estimateDPS(w)),
      mad = clamp((Math.log10(dpsNow) - 1.45) / 2.55, 0, 1),
      headScale = 1 + mad * 0.78,
      faceTilt = Math.sin(time * (6 + mad * 5)) * 0.02 + mad * 0.05,
      hairLift = 7 + mad * 18,
      hairSwing = 1 + mad * 1.4,
      eyeWild = mad * 0.9,
      grinLift = mad * 6,
      jawDrop = mad * 3;
    if (atk && w.type === 'sword') {
      if (step === 1) {
        ang = -1.9 + atk * 2.8;
        body = -0.18 + atk * 0.3;
      } else if (step === 2) {
        ang = 1.55 - atk * 2.85;
        body = 0.17 - atk * 0.3;
      } else {
        ang = -2.25 + atk * 3.2;
        body = -0.24 + atk * 0.42;
      }
    } else if (atk && w.type === 'dagger') {
      ang = -1.4 + atk * 2.2;
      body = -0.08 + atk * 0.12;
    } else if (atk && w.type === 'nunchucks') {
      ang = -1.8 + atk * 5.4 + (pl.combo % 2 ? Math.PI : 0.0);
      body = Math.sin(atk * Math.PI * 2) * 0.1;
    } else if (atk && w.type === 'katana') {
      ang = -2.15 + atk * 3.25;
      body = -0.22 + atk * 0.36;
    } else if (atk && w.type === 'shuriken') {
      ang = -0.45 + atk * 0.8;
      body = -0.05;
    } else if (atk && w.type === 'hammer') {
      ang = -2.18 + atk * 3.05;
      body = -0.2 + atk * 0.32;
    } else if (atk && w.type === 'staff') {
      ang = -1.7 + atk * 1.45;
      body = -0.1;
    } else if (atk && w.type === 'bow') {
      ang = -0.2;
      body = -0.09;
    } else if (atk && w.type === 'wand') {
      ang = -0.7 + atk * 0.55;
      body = -0.06;
    } else if (atk) {
      ang = -1.15 + atk * 2.3;
    }
    X.save();
    X.translate(pl.x + 17, pl.y + 25 + bob);
    X.scale(pl.dir * 1.08, breathe * 1.08);
    X.rotate(body);
    if (pl.inv > 0 && Math.floor(time * 18) % 2 === 0) X.globalAlpha = 0.45;
    limb(-6, 10, -8 + st * 0.4, 24, 6, '#75869b');
    limb(6, 10, 8 - st * 0.4, 24, 6, '#75869b');
    if (feetArmor) {
      let fc = feetArmor.col,
        lx = -8 + st * 0.4,
        rx = 8 - st * 0.4;
      X.save();
      X.shadowColor = fc;
      X.shadowBlur = 8;
      X.fillStyle = fc;
      X.beginPath();
      X.roundRect(lx - 5, 17, 9, 13, 3);
      X.roundRect(rx - 4, 17, 9, 13, 3);
      X.fill();
      X.fillStyle = '#101722';
      X.globalAlpha = 0.32;
      X.fillRect(lx - 5, 26, 12, 4);
      X.fillRect(rx - 4, 26, 12, 4);
      X.globalAlpha = 1;
      X.strokeStyle = '#fff';
      X.globalAlpha = 0.28;
      X.lineWidth = 1.5;
      X.strokeRect(lx - 4, 18, 7, 9);
      X.strokeRect(rx - 3, 18, 7, 9);
      X.restore();
    }
    let ac = bodyArmor?.col || '#dce2e9';
    X.shadowBlur = bodyArmor ? 9 : 0;
    X.shadowColor = ac;
    X.fillStyle = bodyArmor ? ac : '#dce2e9';
    X.beginPath();
    X.roundRect(-11, -14, 22, 29, 7);
    X.fill();
    X.shadowBlur = 0;
    if (bodyArmor) {
      X.save();
      X.fillStyle = ac;
      X.shadowColor = ac;
      X.shadowBlur = 7;
      X.beginPath();
      X.roundRect(-15, -12, 6, 10, 3);
      X.roundRect(9, -12, 6, 10, 3);
      X.fill();
      X.fillStyle = '#0d1420';
      X.globalAlpha = 0.24;
      X.fillRect(-7, -10, 14, 3);
      X.fillRect(-6, 1, 12, 3);
      X.globalAlpha = 0.45;
      X.strokeStyle = '#fff';
      X.lineWidth = 1.4;
      X.strokeRect(-8, -11, 16, 23);
      X.restore();
    }
    X.fillStyle = bodyArmor ? ac : '#566a84';
    X.globalAlpha = 0.58;
    X.beginPath();
    X.moveTo(-10, 2);
    X.lineTo(-15, 19 + Math.sin(time * 10) * 2);
    X.lineTo(-2, 12);
    X.lineTo(2, 12);
    X.lineTo(15, 19 - Math.sin(time * 10) * 2);
    X.lineTo(10, 2);
    X.closePath();
    X.fill();
    X.globalAlpha = 1;
    X.save();
    X.translate(0, -19);
    X.rotate(faceTilt);
    X.scale(headScale, headScale);
    X.fillStyle = '#ead9c7';
    X.beginPath();
    X.arc(0, 0, 9, 0, Math.PI * 2);
    X.fill();
    if (headArmor) {
      let hc = headArmor.col;
      X.save();
      X.shadowColor = hc;
      X.shadowBlur = 9 + mad * 6;
      X.fillStyle = hc;
      X.beginPath();
      X.arc(0, -2, 11.2, Math.PI, Math.PI * 2);
      X.lineTo(10, 1);
      X.lineTo(8, 6);
      X.lineTo(4, 0);
      X.lineTo(-4, 0);
      X.lineTo(-8, 6);
      X.lineTo(-10, 1);
      X.closePath();
      X.fill();
      X.fillStyle = '#0c121c';
      X.globalAlpha = 0.34;
      X.fillRect(-8, -4, 16, 3);
      X.globalAlpha = 1;
      X.strokeStyle = '#fff';
      X.globalAlpha = 0.32;
      X.lineWidth = 1.5;
      X.beginPath();
      X.moveTo(-8, -3);
      X.lineTo(8, -3);
      X.stroke();
      X.globalAlpha = 1;
      for (let i = 0; i < Math.max(1, Math.round(1 + mad * 3)); i++) {
        let ox = -4 + i * 4,
          h = 7 + hairLift * 0.42 + i * 2 + Math.sin(time * 7 + i) * 2;
        X.beginPath();
        X.moveTo(ox, -10);
        X.lineTo(ox + 2, -10 - h);
        X.lineTo(ox + 5, -10);
        X.closePath();
        X.fill();
      }
      X.restore();
    } else {
      X.fillStyle = q >= 5 ? `hsl(${(time * 90) % 360} 70% ${18 + mad * 22}%)` : '#202631';
      X.beginPath();
      X.moveTo(-10, -6);
      X.lineTo(-14, -14 - hairLift * 0.25);
      X.lineTo(-9, -11 - hairLift * 0.18);
      X.lineTo(-6, -20 - hairLift * 0.48);
      X.lineTo(-1, -12 - hairLift * 0.16);
      X.lineTo(2, -22 - hairLift * 0.58);
      X.lineTo(6, -12 - hairLift * 0.1);
      X.lineTo(10, -19 - hairLift * 0.42);
      X.lineTo(14, -11 - hairLift * 0.2);
      X.lineTo(11, -4);
      X.closePath();
      X.fill();
      if (mad > 0.35) {
        X.fillStyle = w.col;
        X.globalAlpha = 0.28 + 0.18 * mad;
        for (let i = 0; i < 3; i++) {
          let hx = -6 + i * 6;
          X.beginPath();
          X.moveTo(hx, -8);
          X.lineTo(hx + 2, -17 - hairLift * 0.3 - Math.sin(time * 8 + i) * 3);
          X.lineTo(hx + 4, -8);
          X.closePath();
          X.fill();
        }
        X.globalAlpha = 1;
      }
    }
    X.strokeStyle = '#2d3340';
    X.lineWidth = 1.6 + eyeWild * 0.9;
    X.beginPath();
    X.moveTo(-7.6, -6.6 - eyeWild * 0.7);
    X.lineTo(-0.8, -8.6 - eyeWild * 1.5);
    X.moveTo(1.4, -4.9 - eyeWild * 0.2);
    X.lineTo(7.6, -6.8 - eyeWild * 0.7);
    X.stroke();
    X.fillStyle = '#111820';
    X.beginPath();
    X.ellipse(-3.8, -2.2 - eyeWild * 0.65, 2.25 + eyeWild * 0.7, 3.1 + eyeWild * 1.8, 0.18, 0, Math.PI * 2);
    X.fill();
    X.beginPath();
    X.ellipse(
      4.0,
      -0.2 + Math.sin(time * 17) * 0.12,
      1.8 + eyeWild * 1.3,
      1.55 + eyeWild * 1.05,
      -0.15,
      0,
      Math.PI * 2
    );
    X.fill();
    X.fillStyle = '#fff';
    X.beginPath();
    X.arc(-4.3, -3.0 - eyeWild * 0.35, 1.0 + eyeWild * 0.25, 0, Math.PI * 2);
    X.fill();
    X.beginPath();
    X.arc(4.3, -0.5, 0.45 + eyeWild * 0.12, 0, Math.PI * 2);
    X.fill();
    if (mad > 0.45) {
      X.fillStyle = '#ff7f96';
      X.beginPath();
      X.arc(-6.4, 1.6, 1.1 + mad * 0.8, 0, Math.PI * 2);
      X.arc(6.0, 2.2, 1.0 + mad * 0.7, 0, Math.PI * 2);
      X.fill();
    }
    X.strokeStyle = '#71182b';
    X.lineWidth = 1.9 + mad * 1.8;
    X.beginPath();
    X.moveTo(-5.5, 6.2);
    X.quadraticCurveTo(1.5, 12.8 + grinLift, 8.1, 4.5 - jawDrop * 0.14);
    X.stroke();
    if (mad > 0.55) {
      X.fillStyle = '#ff6b8c';
      X.globalAlpha = 0.65;
      X.beginPath();
      X.ellipse(1.5, 8.8 + grinLift * 0.22, 3.8 + mad * 1.6, 1.6 + mad * 0.8, 0.04, 0, Math.PI);
      X.fill();
      X.globalAlpha = 1;
    }
    X.restore();
    let ax = 12,
      ay = -4;
    if (atk) {
      let ad = attackDir(w);
      if (ad !== pl.dir) ang = Math.PI - ang;
      ax = Math.cos(ang) * 19;
      ay = -2 + Math.sin(ang) * 19;
      if (hasTrait(w, 'speedy')) {
        ax *= 1.18;
        ay *= 1.18;
      }
    }
    limb(7, -5, ax, ay, 5, '#ead9c7');
    X.save();
    X.translate(ax, ay);
    X.rotate(atk ? ang : 0);
    weaponAura(w, 18 * sc, 0);
    X.lineCap = 'round';
    X.shadowColor = w.col;
    X.shadowBlur = q ? 8 + q * 7 : 2;
    if (w.type === 'sword') {
      let len = 58 * sc,
        th = 6 + q * 1.5;
      X.strokeStyle = '#7b5b3e';
      X.lineWidth = 5;
      X.beginPath();
      X.moveTo(-6, 0);
      X.lineTo(14, 0);
      X.stroke();
      X.strokeStyle = w.col;
      X.lineWidth = th;
      X.beginPath();
      X.moveTo(12, 0);
      X.lineTo(len, 0);
      X.stroke();
      X.strokeStyle = q >= 2 ? '#fff2b4' : '#f8fbff';
      X.lineWidth = q >= 4 ? 3 : 2;
      X.beginPath();
      X.moveTo(18, -2);
      X.lineTo(len - 3, -2);
      X.stroke();
      if (q >= 3) {
        X.strokeStyle = q >= 5 ? `hsl(${(time * 120) % 360} 95% 72%)` : '#ffffff';
        X.lineWidth = 2;
        for (let i = 0; i < q; i++) {
          let xx = 25 + (i * (len - 30)) / (q + 1);
          X.beginPath();
          X.moveTo(xx, -5);
          X.lineTo(xx + 6, 5);
          X.stroke();
        }
      }
    } else if (w.type === 'dagger') {
      let len = 36 * sc,
        th = 5 + q * 0.9;
      X.strokeStyle = '#6b4d39';
      X.lineWidth = 5;
      X.beginPath();
      X.moveTo(-5, 0);
      X.lineTo(10, 0);
      X.stroke();
      X.strokeStyle = w.col;
      X.lineWidth = th;
      X.beginPath();
      X.moveTo(8, 0);
      X.lineTo(len, 0);
      X.stroke();
      X.strokeStyle = q >= 2 ? '#fff' : '#dff';
      X.lineWidth = 2;
      X.beginPath();
      X.moveTo(13, -2);
      X.lineTo(len - 2, -2);
      X.stroke();
      if (q >= 4) {
        X.fillStyle = w.col;
        for (let i = 0; i < Math.min(6, q); i++) {
          let a = time * 3 + (i * Math.PI * 2) / Math.min(6, q);
          X.beginPath();
          X.arc(18 + Math.cos(a) * (12 + q * 2), Math.sin(a) * (8 + q), 2 + q * 0.25, 0, Math.PI * 2);
          X.fill();
        }
      }
    } else if (w.type === 'nunchucks') {
      let swing = atk ? Math.sin(atk * Math.PI * 2) : 0,
        len = 30 * sc;
      X.strokeStyle = w.col;
      X.lineWidth = 7 + q * 0.6;
      X.beginPath();
      X.moveTo(-3, 0);
      X.lineTo(len, 0);
      X.stroke();
      X.strokeStyle = '#d8dde5';
      X.lineWidth = 2;
      X.beginPath();
      X.moveTo(len, 0);
      X.quadraticCurveTo(len + 12, 12 + swing * 12, len + 29, 8 + swing * 18);
      X.stroke();
      X.strokeStyle = w.col;
      X.lineWidth = 7 + q * 0.6;
      X.beginPath();
      X.moveTo(len + 29, 8 + swing * 18);
      X.lineTo(len + 52, 13 + swing * 23);
      X.stroke();
    } else if (w.type === 'katana') {
      let len = 70 * sc;
      X.strokeStyle = '#654432';
      X.lineWidth = 5;
      X.beginPath();
      X.moveTo(-7, 0);
      X.lineTo(13, 0);
      X.stroke();
      X.strokeStyle = '#e6ca8e';
      X.lineWidth = 4;
      X.beginPath();
      X.moveTo(8, -9);
      X.lineTo(8, 9);
      X.stroke();
      X.strokeStyle = w.col;
      X.lineWidth = 5 + q * 0.8;
      X.beginPath();
      X.moveTo(12, 0);
      X.quadraticCurveTo(len * 0.62, -4, len, -13);
      X.stroke();
      X.strokeStyle = '#fff7d5';
      X.lineWidth = 2;
      X.beginPath();
      X.moveTo(18, -2);
      X.quadraticCurveTo(len * 0.62, -6, len - 4, -14);
      X.stroke();
    } else if (w.type === 'shuriken') {
      let rr = (15 + q * 0.7) * sc;
      X.save();
      X.translate(24 * sc, 0);
      X.rotate(time * 12);
      X.fillStyle = w.col;
      for (let i = 0; i < 4; i++) {
        X.rotate(Math.PI / 2);
        X.beginPath();
        X.moveTo(0, 0);
        X.lineTo(rr, 0);
        X.lineTo(rr * 0.38, rr * 0.42);
        X.closePath();
        X.fill();
      }
      X.fillStyle = '#fff';
      X.beginPath();
      X.arc(0, 0, 3 * sc, 0, Math.PI * 2);
      X.fill();
      X.restore();
    } else if (w.type === 'bow') {
      let rad = 22 * sc,
        pull = atk ? Math.sin(atk * Math.PI) * 13 * sc : 0;
      X.strokeStyle = w.col;
      X.lineWidth = 4 + q * 0.8;
      X.beginPath();
      X.arc(16 * sc, 0, rad, -1.25, 1.25);
      X.stroke();
      X.strokeStyle = q >= 3 ? '#fff0ae' : '#ddd';
      X.lineWidth = 1.5;
      X.beginPath();
      X.moveTo(21 * sc, -rad * 0.94);
      X.lineTo(21 * sc - pull, 0);
      X.lineTo(21 * sc, rad * 0.94);
      X.stroke();
      if (q >= 2) {
        X.fillStyle = w.col;
        for (let i = -1; i <= 1; i++) {
          X.beginPath();
          X.arc(16 * sc, i * rad * 0.55, 2 + q * 0.6, 0, Math.PI * 2);
          X.fill();
        }
      }
      if (atk) {
        X.strokeStyle = '#fff';
        X.lineWidth = 2 + q * 0.3;
        X.beginPath();
        X.moveTo(21 * sc - pull, 0);
        X.lineTo(48 * sc, 0);
        X.stroke();
      }
    } else if (w.type === 'wand') {
      let len = 39 * sc;
      X.strokeStyle = q >= 3 ? '#f0d8ff' : '#6f5a55';
      X.lineWidth = 5 + q * 0.45;
      X.beginPath();
      X.moveTo(0, 6);
      X.lineTo(len, -10 * sc);
      X.stroke();
      X.fillStyle = w.col;
      X.beginPath();
      X.arc(
        len + 4 * sc,
        -11 * sc,
        (5 + q * 1.6) * sc * 0.75 + (atk ? Math.sin(atk * Math.PI) * 4 : 0),
        0,
        Math.PI * 2
      );
      X.fill();
      if (q >= 4) {
        X.strokeStyle = '#fff';
        X.lineWidth = 2;
        X.beginPath();
        X.arc(len + 4 * sc, -11 * sc, 12 + q * 3, 0, Math.PI * 2);
        X.stroke();
      }
    } else if (w.type === 'staff') {
      let len = 52 * sc;
      X.strokeStyle = q >= 3 ? '#e9ddff' : '#785c48';
      X.lineWidth = 7 + q * 0.65;
      X.beginPath();
      X.moveTo(-2, 18);
      X.lineTo(len, -28 * sc);
      X.stroke();
      X.fillStyle = w.col;
      X.beginPath();
      X.arc(len + 4 * sc, -30 * sc, (7 + q * 1.8) * sc * 0.7 + (atk ? 4 : 0), 0, Math.PI * 2);
      X.fill();
      if (q >= 2) {
        X.strokeStyle = q >= 5 ? `hsl(${(time * 150) % 360} 100% 70%)` : '#fff';
        X.lineWidth = 2 + q * 0.3;
        X.beginPath();
        X.arc(len + 4 * sc, -30 * sc, 15 + q * 4 + Math.sin(time * 8) * 3, 0, Math.PI * 2);
        X.stroke();
      }
    } else {
      let shaft = 34 * sc,
        headW = (24 + q * 7) * sc,
        headH = (20 + q * 5) * sc;
      X.strokeStyle = '#6f5546';
      X.lineWidth = 8 + q * 0.5;
      X.beginPath();
      X.moveTo(0, 0);
      X.lineTo(shaft, 0);
      X.stroke();
      X.fillStyle = w.col;
      X.fillRect(shaft - 2, -headH / 2, headW, headH);
      X.strokeStyle = q >= 2 ? '#fff1b8' : '#cfd6dd';
      X.lineWidth = 2 + q * 0.4;
      X.strokeRect(shaft - 2, -headH / 2, headW, headH);
      if (q >= 4) {
        X.fillStyle = '#fff';
        X.fillRect(shaft + headW * 0.45, -headH * 0.32, 4 + q, headH * 0.64);
      }
    }
    X.shadowBlur = 0;
    X.restore();
    if ((pl.equipFxT || 0) > 0) {
      let ef = pl.equipFxT / 2.4,
        a = clamp(ef, 0, 1),
        orbit = (1 - a) * 28 + 28;
      X.save();
      X.globalAlpha = 0.25 + 0.55 * a;
      X.strokeStyle = pl.equipFxCol || w.col;
      X.lineWidth = 2.6;
      for (let i = 0; i < 2; i++) {
        X.beginPath();
        X.arc(0, -3, orbit + i * 12, time * 2.5 + i, time * 2.5 + i + Math.PI * 1.45);
        X.stroke();
      }
      for (let i = 0; i < 3; i++) {
        let ang = time * 4 + (i * Math.PI * 2) / 3,
          ox = Math.cos(ang) * (24 + 8 * a),
          oy = -6 + Math.sin(ang) * (14 + 6 * a);
        X.fillStyle = i === 1 ? '#fff' : pl.equipFxCol || w.col;
        X.beginPath();
        X.moveTo(ox, oy - 5);
        X.lineTo(ox + 5, oy);
        X.lineTo(ox, oy + 5);
        X.lineTo(ox - 5, oy);
        X.closePath();
        X.fill();
      }
      X.globalAlpha = 0.88 * a;
      X.textAlign = 'center';
      X.font = '1000 12px system-ui';
      X.fillStyle = '#ffffff';
      X.strokeStyle = 'rgba(10,8,16,.85)';
      X.lineWidth = 4;
      let top = -(58 + 18 * (1 - a) + mad * 8);
      X.strokeText(pl.equipFxKind || 'EQUIPPED', 0, top);
      X.fillText(pl.equipFxKind || 'EQUIPPED', 0, top);
      X.font = '900 11px system-ui';
      X.fillStyle = pl.equipFxCol || w.col;
      X.strokeText(pl.equipFxName || '', 0, top + 14);
      X.fillText(pl.equipFxName || '', 0, top + 14);
      X.restore();
    }
    if (mad > 0.18) {
      X.save();
      X.globalAlpha = 0.12 + 0.18 * mad;
      X.strokeStyle = q >= 5 ? `hsl(${(time * 100) % 360} 90% 72%)` : w.col;
      X.lineWidth = 2 + mad * 1.5;
      for (let i = 0; i < 2 + Math.floor(mad * 3); i++) {
        let rr = 18 + i * 9 + Math.sin(time * 7 + i) * 2;
        X.beginPath();
        X.arc(0, -18, rr, Math.PI * 0.2 + i * 0.25, Math.PI * 1.28 + i * 0.25);
        X.stroke();
      }
      X.restore();
    }
    X.restore();
  }
  function drawP() {
    for (const p of P) {
      let sz = p.size || 1;
      if (p.k === 'shuriken') {
        X.save();
        X.translate(p.x, p.y);
        X.rotate(time * 18 * (p.vx >= 0 ? 1 : -1));
        X.strokeStyle = p.col;
        X.fillStyle = p.col;
        X.shadowBlur = 10;
        X.shadowColor = p.col;
        X.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          X.rotate(Math.PI / 2);
          X.beginPath();
          X.moveTo(0, 0);
          X.lineTo(13 * sz, 0);
          X.lineTo(5 * sz, 5 * sz);
          X.closePath();
          X.fill();
        }
        X.fillStyle = '#fff';
        X.beginPath();
        X.arc(0, 0, 2.5 * sz, 0, Math.PI * 2);
        X.fill();
        X.restore();
      } else if (p.k === 'arrow' || p.k === 'spectral') {
        X.strokeStyle = p.col;
        X.lineWidth = (p.k === 'spectral' ? 5 : 3) * Math.min(2.1, sz);
        X.shadowBlur = p.k === 'spectral' ? 12 : 0;
        X.shadowColor = p.col;
        X.beginPath();
        X.moveTo(p.x - 10 * sz, p.y);
        X.lineTo(p.x + 10 * sz, p.y);
        X.stroke();
        X.shadowBlur = 0;
      } else if (p.k === 'blade') {
        X.strokeStyle = p.col;
        X.lineWidth = 10 * Math.min(1.8, sz);
        X.shadowBlur = 14;
        X.shadowColor = p.col;
        X.beginPath();
        X.moveTo(p.x - 26 * sz, p.y - 8 * sz);
        X.lineTo(p.x + 26 * sz, p.y + 8 * sz);
        X.stroke();
        X.shadowBlur = 0;
      } else if (p.k === 'orb') {
        X.fillStyle = p.col;
        X.shadowBlur = 16;
        X.shadowColor = p.col;
        X.beginPath();
        X.arc(p.x, p.y, 7 * Math.min(2, sz), 0, Math.PI * 2);
        X.fill();
        X.shadowBlur = 0;
      } else {
        X.strokeStyle = p.col || '#fff';
        X.lineWidth = (p.k === 'meteor' ? 10 : 6) * Math.min(1.8, sz);
        X.beginPath();
        X.moveTo(p.x, p.y - 50 * Math.min(1.8, sz));
        X.lineTo(p.x, p.y);
        X.stroke();
      }
    }
  }
  function drawQ() {
    for (const q of Q) {
      let pulse = 1 + Math.sin(time * 28) * 0.18,
        sp = Math.hypot(q.vx, q.vy) || 1;
      if (q.effect === 'gas') {
        X.globalAlpha = 0.22;
        X.fillStyle = '#86ff68';
        X.shadowBlur = 16;
        X.shadowColor = '#86ff68';
        X.beginPath();
        X.arc(q.x, q.y, q.r, 0, Math.PI * 2);
        X.fill();
        X.shadowBlur = 0;
        X.globalAlpha = 1;
        continue;
      }
      if (q.effect === 'rabbit') {
        X.save();
        X.translate(q.x, q.y);
        X.fillStyle = '#f4eed8';
        X.beginPath();
        X.ellipse(0, 2, 10, 7, 0, 0, Math.PI * 2);
        X.fill();
        X.beginPath();
        X.ellipse(-4, -8, 3, 8, -0.25, 0, Math.PI * 2);
        X.ellipse(4, -8, 3, 8, 0.25, 0, Math.PI * 2);
        X.fill();
        X.fillStyle = '#ff6a88';
        X.fillRect(4, -1, 2, 2);
        X.restore();
        continue;
      }
      if (q.effect === 'banana') {
        X.save();
        X.translate(q.x, q.y);
        X.rotate(time * 5);
        X.strokeStyle = '#fff46b';
        X.lineWidth = 5;
        X.beginPath();
        X.arc(0, 0, 10, 0.2, 2.8);
        X.stroke();
        X.restore();
        continue;
      }
      if (q.effect !== 'audit') {
        X.globalAlpha = 0.28;
        X.strokeStyle = q.col;
        X.lineWidth = q.r * 1.05;
        X.beginPath();
        X.moveTo(q.x - (q.vx / sp) * (24 + q.r * 1.4), q.y - (q.vy / sp) * (24 + q.r * 1.4));
        X.lineTo(q.x, q.y);
        X.stroke();
        X.globalAlpha = 1;
      }
      X.save();
      X.translate(q.x, q.y);
      X.rotate((q.spin || 0) * time);
      X.shadowBlur = 20;
      X.shadowColor = q.col;
      if (q.effect === 'audit') {
        X.fillStyle = '#ffffff';
        X.fillRect(-10, -13, 20, 26);
        X.strokeStyle = '#ff4167';
        X.lineWidth = 2;
        for (let i = -7; i <= 7; i += 5) {
          X.beginPath();
          X.moveTo(-6, i);
          X.lineTo(6, i);
          X.stroke();
        }
      } else if (q.effect === 'coupon') {
        X.fillStyle = '#fff7a1';
        X.fillRect(-9, -6, 18, 12);
        X.fillStyle = '#7a5b00';
        X.font = '900 5px system-ui';
        X.fillText('15% OFF', -7, 2);
      } else if (q.effect === 'goose') {
        X.fillStyle = '#f5f5dd';
        X.beginPath();
        X.ellipse(0, 0, 12, 7, 0, 0, Math.PI * 2);
        X.fill();
        X.strokeStyle = '#f5f5dd';
        X.lineWidth = 5;
        X.beginPath();
        X.moveTo(7, -2);
        X.lineTo(12, -12);
        X.stroke();
        X.fillStyle = '#ff9b42';
        X.beginPath();
        X.moveTo(11, -13);
        X.lineTo(20, -10);
        X.lineTo(12, -8);
        X.fill();
      } else {
        X.fillStyle = q.col;
        X.beginPath();
        X.arc(0, 0, q.r * pulse, 0, Math.PI * 2);
        X.fill();
        X.fillStyle = '#fff2c7';
        X.beginPath();
        X.arc(-q.r * 0.18, -q.r * 0.18, q.r * 0.38, 0, Math.PI * 2);
        X.fill();
      }
      X.restore();
    }
  }
  function drawF() {
    for (const f of F) {
      if (f.k === 'p') {
        X.globalAlpha = clamp(f.life * 2, 0, 1);
        X.fillStyle = f.col;
        X.fillRect(f.x, f.y, f.sz, f.sz);
      } else if (f.k === 'r') {
        X.globalAlpha = clamp(f.life / f.max, 0, 1);
        X.strokeStyle = f.col;
        X.lineWidth = f.w;
        X.beginPath();
        X.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        X.stroke();
      } else if (f.k === 'b') {
        X.globalAlpha = clamp(f.life * 8, 0, 1);
        X.strokeStyle = f.col;
        X.lineWidth = f.w;
        X.shadowBlur = 10;
        X.shadowColor = f.col;
        X.beginPath();
        X.moveTo(f.x, f.y);
        X.lineTo(f.x2, f.y2);
        X.stroke();
        X.shadowBlur = 0;
      } else if (f.k === 'ghost') {
        X.globalAlpha = clamp(f.life / f.max, 0, 1) * 0.2;
        X.save();
        X.translate(f.x, f.y);
        X.scale(f.dir, 1);
        X.fillStyle = f.col;
        X.shadowBlur = 16;
        X.shadowColor = f.col;
        X.fillRect(-10, -15, 20, 30);
        X.beginPath();
        X.arc(0, -20, 9, 0, Math.PI * 2);
        X.fill();
        X.shadowBlur = 0;
        X.restore();
      } else if (f.k === 'rune') {
        let t = 1 - f.life / f.max;
        X.globalAlpha = clamp(f.life / f.max, 0, 1) * 0.72;
        X.save();
        X.translate(f.x, f.y);
        X.rotate((f.spin || 1) * t * 2.4);
        X.strokeStyle = f.col;
        X.shadowBlur = 18;
        X.shadowColor = f.col;
        X.lineWidth = 2.5;
        X.beginPath();
        X.arc(0, 0, f.r, 0, Math.PI * 2);
        X.stroke();
        X.rotate(-t * 4);
        X.strokeRect(-f.r * 0.62, -f.r * 0.62, f.r * 1.24, f.r * 1.24);
        for (let i = 0; i < 6; i++) {
          let a = (i * Math.PI) / 3;
          X.beginPath();
          X.moveTo(Math.cos(a) * f.r * 0.7, Math.sin(a) * f.r * 0.7);
          X.lineTo(Math.cos(a) * f.r, Math.sin(a) * f.r);
          X.stroke();
        }
        X.shadowBlur = 0;
        X.restore();
      } else if (f.k === 'speed') {
        X.globalAlpha = clamp(f.life / f.max, 0, 1) * 0.7;
        X.strokeStyle = f.col;
        X.lineWidth = 2.5;
        for (let i = 0; i < (f.n || 4); i++) {
          let yy = f.y + (i - (f.n || 4) / 2) * 6,
            ln = 30 + i * 9;
          X.beginPath();
          X.moveTo(f.x - f.dir * 8, yy);
          X.lineTo(f.x - f.dir * ln, yy + rand(-2, 2));
          X.stroke();
        }
      } else if (f.k === 'impact') {
        let t = 1 - f.life / f.max,
          r = f.r * (0.4 + t * 0.9);
        X.globalAlpha = clamp(f.life / f.max, 0, 1);
        X.strokeStyle = f.col;
        X.shadowBlur = 12;
        X.shadowColor = f.col;
        X.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
          let a = (i * Math.PI) / 3;
          X.beginPath();
          X.moveTo(f.x + Math.cos(a) * r * 0.25, f.y + Math.sin(a) * r * 0.25);
          X.lineTo(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r);
          X.stroke();
        }
        X.shadowBlur = 0;
      } else if (f.k === 'enemySlash') {
        let t = 1 - f.life / f.max;
        X.globalAlpha = clamp(f.life / f.max, 0, 1) * 0.8;
        X.save();
        X.translate(f.x, f.y);
        X.scale(f.dir, 1);
        X.strokeStyle = f.col;
        X.shadowBlur = 10;
        X.shadowColor = f.col;
        X.lineWidth = f.wide ? 8 : 5;
        X.beginPath();
        X.arc(0, 0, f.r, -1.35, -1.35 + 2.5 * t + 0.5);
        X.stroke();
        X.shadowBlur = 0;
        X.restore();
      } else if (f.k === 'slash') {
        let q = 1 - f.life / f.max,
          base = f.step === 1 ? -1.35 : f.step === 2 ? 0.3 : -1.8,
          span = f.step === 0 ? 2.7 : 2.25;
        X.globalAlpha = clamp(f.life / f.max, 0, 1);
        X.save();
        X.translate(f.x, f.y);
        X.scale(f.dir, 1);
        X.strokeStyle = f.col;
        X.shadowBlur = 18;
        X.shadowColor = f.col;
        X.lineWidth = f.step === 0 ? 9 : 7;
        X.beginPath();
        X.arc(0, 0, f.r, base, base + span * q + 0.45);
        X.stroke();
        X.shadowBlur = 0;
        X.restore();
      } else if (f.k === 'after') {
        X.globalAlpha = clamp(f.life / f.max, 0, 1);
        X.save();
        X.translate(f.x, f.y);
        X.scale(f.dir, 1);
        X.strokeStyle = f.col;
        X.lineWidth = 7;
        X.beginPath();
        X.arc(0, 0, 48, -1.4, 1.1);
        X.stroke();
        X.restore();
      } else if (f.k === 'argument') {
        X.globalAlpha = clamp(f.life / f.max, 0, 1);
        X.strokeStyle = f.col;
        X.lineWidth = 4;
        X.beginPath();
        X.arc(f.x, f.y, 35 + (1 - f.life / f.max) * 40, 0, Math.PI * 2);
        X.stroke();
      } else if (f.k === 'sun') {
        X.globalAlpha = 0.55 + 0.2 * Math.sin(time * 12);
        X.shadowBlur = 25;
        X.shadowColor = f.col;
        X.fillStyle = f.col;
        X.beginPath();
        X.arc(f.x, f.y, 28 + Math.sin(time * 9) * 5, 0, Math.PI * 2);
        X.fill();
        X.shadowBlur = 0;
      } else if (f.k === 'smoke') {
        X.globalAlpha = clamp(f.life / f.max, 0, 0.32);
        X.fillStyle = f.col;
        X.beginPath();
        X.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        X.fill();
      } else if (f.k === 'vortex') {
        X.save();
        X.translate(f.x, f.y);
        X.globalAlpha = 0.75;
        for (let i = 0; i < 4; i++) {
          X.strokeStyle = i % 2 ? '#b072ff' : '#301347';
          X.lineWidth = 5;
          X.beginPath();
          X.arc(0, 0, 20 + i * 15, time * (2 + i) + i, time * (2 + i) + i + 4.6);
          X.stroke();
        }
        X.restore();
      }
    }
    X.globalAlpha = 1;
  }
  function drawWeaponWorldFX() {
    let w = curW();
    if (superT > 0) {
      X.save();
      let gx = pl.x + pl.w / 2,
        gy = pl.y + pl.h / 2,
        p = 0.55 + 0.22 * Math.sin(time * 18);
      for (let i = 0; i < 3; i++) {
        X.globalAlpha = 0.18 + p * 0.08 - i * 0.03;
        X.strokeStyle = i === 1 ? curW().col : '#fff176';
        X.lineWidth = 5 - i;
        X.beginPath();
        X.arc(gx, gy, 34 + i * 18 + Math.sin(time * 10 + i) * 4, 0, Math.PI * 2);
        X.stroke();
      }
      X.globalAlpha = 0.2 + 0.08 * Math.sin(time * 24);
      X.fillStyle = '#fff6a8';
      X.beginPath();
      X.ellipse(gx, gy, 28, 52, 0, 0, Math.PI * 2);
      X.fill();
      X.restore();
    }
    if (hasTrait(w, 'dark')) {
      X.save();
      let gx = pl.x + pl.w / 2,
        gy = pl.y + pl.h / 2,
        gr = X.createRadialGradient(gx, gy, 55, gx, gy, 270);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(0.42, 'rgba(5,2,12,.18)');
      gr.addColorStop(0.72, 'rgba(2,0,8,.72)');
      gr.addColorStop(1, 'rgba(0,0,0,.96)');
      X.fillStyle = gr;
      X.fillRect(0, 0, W, H);
      X.globalAlpha = 0.72;
      X.strokeStyle = '#6e50ff';
      X.shadowBlur = 12;
      X.shadowColor = '#4c32d9';
      X.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        let a = time * 0.45 + (i * Math.PI) / 3;
        X.beginPath();
        X.arc(gx, gy, 105 + i * 10, a, a + 1.1);
        X.stroke();
      }
      X.shadowBlur = 0;
      X.restore();
    }
    if (hasTrait(w, 'speedy') && Math.abs(pl.vx) > 80) {
      X.save();
      X.globalAlpha = 0.16;
      for (let i = 1; i <= 5; i++) {
        X.fillStyle = i % 2 ? w.col : '#fff';
        X.fillRect(pl.x - pl.dir * i * 12, pl.y + 8, pl.w, pl.h - 12);
      }
      X.restore();
    }
    if (hasTrait(w, 'drunk')) {
      X.save();
      X.globalAlpha = 0.05;
      X.fillStyle = '#ffcf7d';
      X.fillRect(Math.sin(time * 2.7) * 5, 0, W, H);
      X.restore();
    }
  }
  function draw() {
    X.clearRect(0, 0, W, H);
    X.save();
    let shakeX = 0,
      shakeY = 0;
    if (shake > 0) {
      shakeX = rand(-shake, shake);
      shakeY = rand(-shake, shake);
      X.translate(shakeX, shakeY);
    }
    drawBg();
    if (bossMode) {
      X.save();
      X.globalAlpha = 0.22;
      X.fillStyle =
        bossMode === 'jr'
          ? '#ff57ce'
          : bossMode === 'sr'
            ? '#79f6ff'
            : bossMode === 'grandma'
              ? '#ff9fc9'
              : bossMode === 'ceo'
                ? '#ffd24f'
                : bossMode === 'weapon'
                  ? '#ffffff'
                  : '#ffb34b';
      for (let i = 0; i < 9; i++) {
        X.fillRect(40 + i * 150, 120 + (i % 3) * 46, 90, 8);
      }
      X.globalAlpha = 0.18;
      X.font = '1000 42px system-ui';
      X.fillStyle = '#fff';
      X.textAlign = 'center';
      X.fillText(
        bossMode === 'jr'
          ? 'JR. WEAPON TESTING FACILITY'
          : bossMode === 'sr'
            ? "DAD'S GARAGE OF TERRIBLE IDEAS"
            : bossMode === 'grandma'
              ? "GRANDMA'S ARMED LIVING ROOM"
              : bossMode === 'ceo'
                ? 'HOSTILE TAKEOVER PENTHOUSE'
                : bossMode === 'weapon'
                  ? 'THE ARMORY HAS BECOME SENTIENT'
                  : 'EXECUTIVE PERFORMANCE CHAMBER',
        W / 2,
        190
      );
      if (bossMode === 'weapon') {
        X.globalAlpha = 0.08 + 0.05 * Math.sin(time * 7);
        for (let i = 0; i < 6; i++) {
          X.strokeStyle = `hsl(${(time * 90 + i * 60) % 360} 100% 72%)`;
          X.lineWidth = 5;
          X.beginPath();
          X.arc(W / 2, 310, 110 + i * 58, time * (0.3 + i * 0.07), time * (0.3 + i * 0.07) + 4.8);
          X.stroke();
        }
      }
      X.restore();
      drawBossHazards();
    } else {
      drawTerrain();
      drawRift();
    }
    for (const d of D) {
      let q = rarityRank(d.item),
        riq = rarityIndex(d.item),
        sz = 9 + q * 3;
      X.save();
      X.translate(d.x, d.y);
      X.rotate(time * (4 + q * 0.7));
      X.shadowBlur = 8 + q * 8;
      X.shadowColor = d.item.col;
      X.fillStyle = d.item.col;
      if (d.item.kind === 'armor') {
        if (d.item.slot === 'head') {
          X.beginPath();
          X.arc(0, 0, sz * 0.78, Math.PI, Math.PI * 2);
          X.lineTo(sz * 0.72, sz * 0.45);
          X.lineTo(-sz * 0.72, sz * 0.45);
          X.closePath();
          X.fill();
          X.fillStyle = '#fff';
          X.globalAlpha = 0.45;
          X.fillRect(-sz * 0.55, -2, sz * 1.1, 3);
          X.globalAlpha = 1;
        } else if (d.item.slot === 'feet') {
          X.fillRect(-sz * 0.92, -sz * 0.45, sz * 0.72, sz * 0.9);
          X.fillRect(sz * 0.18, -sz * 0.45, sz * 0.72, sz * 0.9);
          X.fillStyle = '#fff';
          X.globalAlpha = 0.42;
          X.fillRect(-sz * 0.9, sz * 0.18, sz * 0.72, 3);
          X.fillRect(sz * 0.2, sz * 0.18, sz * 0.72, 3);
          X.globalAlpha = 1;
        } else {
          X.beginPath();
          X.moveTo(-sz * 0.78, -sz * 0.52);
          X.lineTo(-sz * 0.3, -sz);
          X.lineTo(sz * 0.3, -sz);
          X.lineTo(sz * 0.78, -sz * 0.52);
          X.lineTo(sz * 0.58, sz * 0.82);
          X.lineTo(-sz * 0.58, sz * 0.82);
          X.closePath();
          X.fill();
          X.fillStyle = '#ffffff';
          X.globalAlpha = 0.55;
          X.fillRect(-2, -sz * 0.75, 4, sz * 1.35);
          X.globalAlpha = 1;
          X.fillStyle = d.item.col;
        }
      } else {
        X.beginPath();
        X.moveTo(0, -sz);
        X.lineTo(sz * 0.75, 0);
        X.lineTo(0, sz);
        X.lineTo(-sz * 0.75, 0);
        X.closePath();
        X.fill();
      }
      if (q >= 2) {
        X.strokeStyle = q >= 4 ? '#fff' : '#ffe8a3';
        X.lineWidth = 2;
        X.stroke();
        X.globalAlpha = 0.22 + 0.08 * q;
        X.fillStyle = d.item.col;
        X.fillRect(-2, -90 - q * 16, 4, 90 + q * 16);
      }
      X.restore();
      X.fillStyle = d.item.col;
      X.textAlign = 'center';
      X.font = (riq >= 7 ? '900 16px' : riq >= 3 ? '800 14px' : '700 12px') + ' system-ui';
      X.fillText((riq >= 7 ? '✦ ' : '') + d.item.name + (riq >= 7 ? ' ✦' : ''), d.x, d.y - 18 - q * 2);
    }
    for (const e of E) creature(e);
    drawP();
    drawQ();
    playerDraw();
    drawF();
    drawWeaponWorldFX();
    if (chroma > 0) {
      X.globalAlpha = 0.08;
      X.fillStyle = '#ff004c';
      X.fillRect(-4, 0, W, H);
      X.fillStyle = '#00d9ff';
      X.fillRect(4, 0, W, H);
      X.globalAlpha = 1;
    }
    if (flash > 0) {
      X.fillStyle = `rgba(255,245,220,${Math.min(0.42, flash * 2.3)})`;
      X.fillRect(0, 0, W, H);
    }
    X.save();
    X.translate(-shakeX, -shakeY);
    for (const t of T) {
      let alpha = clamp(t.life / t.max, 0, 1);
      X.globalAlpha = alpha;
      X.textAlign = 'center';
      if (t.kind === 'damage') {
        let p = 1 - t.life / t.max,
          pop = 1 + Math.sin(Math.min(1, p / 0.24) * Math.PI) * (t.crit ? 0.26 : 0.12),
          fs = (t.size || 22) * pop;
        X.font = `1000 ${fs}px system-ui`;
        X.lineJoin = 'round';
        let nw = X.measureText(t.s).width,
          tx = clamp(t.x, nw / 2 + 12, W - nw / 2 - 12);
        X.strokeStyle = 'rgba(10,8,16,.96)';
        X.lineWidth = Math.max(5, fs * 0.17);
        X.shadowBlur = t.crit ? 18 : 8;
        X.shadowColor = t.crit ? t.col || '#ffd84f' : '#000';
        X.strokeText(t.s, tx, t.y);
        X.fillStyle = t.col;
        X.fillText(t.s, tx, t.y);
        if (t.label) {
          X.font = `1000 ${Math.max(11, fs * 0.25)}px system-ui`;
          let lw = X.measureText(t.label).width,
            lx = clamp(tx, lw / 2 + 10, W - lw / 2 - 10);
          X.fillStyle = t.labelCol || '#fff8c7';
          X.strokeStyle = 'rgba(30,16,8,.96)';
          X.lineWidth = 4;
          X.strokeText(t.label, lx, t.y - fs * 0.78);
          X.fillText(t.label, lx, t.y - fs * 0.78);
        }
        X.shadowBlur = 0;
      } else if (t.kind === 'chainScore') {
        let p = 1 - t.life / t.max,
          fs = 17 + Math.sin(Math.min(1, p / 0.22) * Math.PI) * 7;
        X.font = `1000 ${fs}px system-ui`;
        X.strokeStyle = 'rgba(7,10,16,.96)';
        X.lineWidth = 5;
        X.shadowBlur = 12;
        X.shadowColor = t.col;
        X.strokeText(t.s, t.x, t.y);
        X.fillStyle = t.col;
        X.fillText(t.s, t.x, t.y);
        X.font = '1000 10px system-ui';
        X.fillStyle = '#fff';
        X.strokeText(t.sub, t.x, t.y + 15);
        X.fillText(t.sub, t.x, t.y + 15);
        X.shadowBlur = 0;
      } else if (t.kind === 'chainCash') {
        X.font = '1000 30px system-ui';
        X.strokeStyle = 'rgba(7,10,16,.96)';
        X.lineWidth = 7;
        X.shadowBlur = 18;
        X.shadowColor = t.col;
        X.strokeText(t.s, t.x, t.y);
        X.fillStyle = t.col;
        X.fillText(t.s, t.x, t.y);
        X.font = '1000 18px system-ui';
        X.strokeText(t.sub, t.x, t.y + 25);
        X.fillStyle = '#fff';
        X.fillText(t.sub, t.x, t.y + 25);
        X.shadowBlur = 0;
      } else {
        X.fillStyle = t.col;
        X.strokeStyle = 'rgba(7,10,16,.82)';
        X.lineWidth = t.big ? 5 : 3;
        X.font = (t.big ? '1000 24px' : '800 15px') + ' system-ui';
        let tw = X.measureText(t.s).width,
          tx = clamp(t.x, tw / 2 + 10, W - tw / 2 - 10);
        X.strokeText(t.s, tx, t.y);
        X.fillText(t.s, tx, t.y);
      }
    }
    X.globalAlpha = 1;
    if (levelUpT > 0) {
      let a = Math.min(1, levelUpT * 2);
      X.save();
      X.globalAlpha = a;
      X.textAlign = 'center';
      X.shadowBlur = 22;
      X.shadowColor = '#ffd85f';
      X.fillStyle = '#fff5bd';
      X.font = '1000 26px system-ui';
      X.fillText('LEVEL UP!', W / 2, 92);
      X.fillStyle = '#ffd85f';
      X.font = '1000 52px system-ui';
      X.fillText('LEVEL ' + levelUpLv, W / 2, 137);
      X.shadowBlur = 0;
      X.restore();
    }
    X.restore();
    if ((paused || over) && !deathOfferOpen) {
      X.fillStyle = 'rgba(0,0,0,.58)';
      X.fillRect(0, 0, W, H);
      X.fillStyle = '#fff';
      X.textAlign = 'center';
      X.font = '1000 44px system-ui';
      X.fillText(over ? 'RUN ENDED' : 'PAUSED', W / 2, H / 2);
      if (over) {
        X.font = '16px system-ui';
        X.fillText('Restart and become irresponsible again.', W / 2, H / 2 + 34);
      }
    }
    X.restore();
  }
  function weaponHudAttributes(w) {
    let a = [];
    a.push({ n: WM[w.type].label, d: WM[w.type].desc });
    if (w.material) a.push({ n: w.material.n, d: w.material.desc });
    for (const t of w.traits || []) a.push({ n: t.n, d: t.desc });
    if (w.cap) a.push({ n: w.capName || 'CAPSTONE', d: w.capText || 'does something deeply irresponsible' });
    if (w.intensity)
      a.push({ n: w.intensity, d: 'the weapon has escalated beyond the amount of weapon anyone requested' });
    if (!a.length)
      a.push({ n: 'TRAINING', d: 'simple steel. still emotionally committed to increasing the number' });
    return a.slice(0, 6);
  }
  function renderHudAttributes(w) {
    if (!U.fsAttrs) return;
    U.fsAttrs.innerHTML = weaponHudAttributes(w)
      .map((a, i) => `<div class="fsAttr${i === 0 ? ' base' : ''}"><b>${a.n}</b><span>${a.d}</span></div>`)
      .join('');
  }
  function render() {
    let w = curW(),
      dps = estimateDPS(w),
      aps = 1 / heldAttackCooldown(w),
      chips = [];
    updateShardHud();
    U.zoneLabel.textContent = Z[zoneI].name;
    U.hpT.textContent = `${Math.ceil(pl.hp)} / ${pl.max}`;
    U.manaT.textContent = `${Math.floor(pl.mana)} / 100`;
    U.xpT.textContent = `${pl.xp} / ${pl.xpn}`;
    U.hp.style.width = `${(pl.hp / pl.max) * 100}%`;
    U.mana.style.width = `${pl.mana}%`;
    U.xp.style.width = `${(pl.xp / pl.xpn) * 100}%`;
    U.stats.innerHTML = `<span>Level</span><b>${pl.lv}</b><span>Est. DPS</span><b>${Math.round(dps)}</b><span>Damage / hit</span><b>${Math.round(wdmg())}</b><span>Crit</span><b>${Math.round(cchance() * 100)}%</b><span>Armor</span><b>${Math.round(pl.armor)}</b><span>Head</span><b style="color:${pl.armors?.head?.col || '#7d8b9d'}">${pl.armors?.head?.name || 'Empty'}</b><span>Body</span><b style="color:${pl.armors?.body?.col || '#7d8b9d'}">${pl.armors?.body?.name || 'Empty'}</b><span>Feet</span><b style="color:${pl.armors?.feet?.col || '#7d8b9d'}">${pl.armors?.feet?.name || 'Empty'}</b><span>Enemy Lv.</span><b>~${Math.round((Z[zoneI].lv + pl.lv) / 2)}</b><span>Run seed</span><b>${runSeed}</b><span>Chaos</span><b>${chaosEvent ? chaosEvent.toUpperCase() : 'stable-ish'}</b><span>Terrain</span><b>${terrainMode ? terrainMode.toUpperCase() : 'normal-ish'}</b><span>Temp Augment</span><b style="color:${tempAugment?.col || '#7d8b9d'}">${tempAugment ? tempAugment.name + ' ' + tempAugment.t.toFixed(1) + 's' : 'None'}</b><span>Weapon Shards</span><b style="color:#9fe8ff">${weaponShards}/${SHARD_CAP}${weaponShards >= SHARD_UNLOCK ? ' • D20 READY' : ''}</b>`;
    U.wType.textContent = WM[w.type].label + ' • ' + w.rar;
    U.wName.textContent = w.name;
    U.wName.style.color = w.col;
    chips.push(chip(`${Math.round(dps)} DPS`, true, w.col));
    chips.push(chip(`${Math.round(wdmg())} DMG`));
    chips.push(chip(`${aps.toFixed(2)} APS`));
    chips.push(chip(`${Math.round((pl.crit + weaponCritBonus(w)) * 100)}% Crit`));
    if (w.material) chips.push(chip(w.material.n, false, w.col));
    for (const t of (w.traits || []).slice(0, 4)) chips.push(chip(t.n, false, w.col));
    if (w.intensity) chips.push(chip(w.intensity, false, w.col));
    if (w.capName) chips.push(chip(w.capName, false, w.col));
    if (w.synergy) chips.push(chip('SYNERGY: ' + w.synergy.name, true, '#fff176'));
    U.wInfo.innerHTML = chips.join('');
    renderWeaponArt(w);
    if (U.fsWArt) {
      let fg = U.fsWArt.getContext('2d');
      fg.clearRect(0, 0, U.fsWArt.width, U.fsWArt.height);
      fg.drawImage(U.wArt, 0, 0, U.fsWArt.width, U.fsWArt.height);
    }
    U.fsWName.textContent = w.name;
    U.fsWName.style.color = w.col;
    let nlen = w.name.length,
      nsize = nlen > 72 ? 20 : nlen > 58 ? 22 : nlen > 44 ? 25 : nlen > 30 ? 29 : 34;
    U.fsWName.style.setProperty('font-size', nsize + 'px', 'important');
    U.fsDps.textContent = `${Math.round(dps)} DPS`;
    U.fsDps.style.color = w.col;
    U.fsMeta.textContent = `${w.rar} ${WM[w.type].label} • ${Math.round(wdmg())} HIT • ${Math.round((pl.crit + weaponCritBonus(w)) * 100)}% CRIT • ARMOR ${armorLoadoutShort()}`;
    renderHudAttributes(w);
    U.fsHp.style.width = `${(pl.hp / pl.max) * 100}%`;
    U.fsMp.style.width = `${pl.mana}%`;
    U.fsXp.style.width = `${(pl.xp / pl.xpn) * 100}%`;
    U.fsMastery.style.width = `${Math.min(100, (master / 9) * 100)}%`;
    U.fsHpT.textContent = `${Math.ceil(pl.hp)}/${pl.max}`;
    U.fsMpT.textContent = `${Math.floor(pl.mana)}/100`;
    U.fsXpT.textContent = `${pl.xp}/${pl.xpn}`;
    U.fsMasteryT.textContent = riftReady ? 'OPEN' : `${stageClears}/${stageGoal()}`;
    U.fsLv.textContent = pl.lv;
    U.fsZone.textContent = Z[zoneI].name;
    U.fsKills.textContent = `${kills} kills • ${ones} one-shots • ${tempAugment ? 'AUGMENT ' + tempAugment.name + ' ' + tempAugment.t.toFixed(1) + 's' : superT > 0 ? 'D20 ' + superRoll + ' • SUPER SAIYAN ' + superT.toFixed(1) + 's' : approachLabel()}`;
    if (bossMode) {
      let be = E.find(e => e.boss && !e.dead);
      if (be) {
        U.bossFill.style.width = `${Math.max(0, (be.hp / be.max) * 100)}%`;
        U.bossSub.textContent = `PHASE ${be.phase || 1} • COUNTERING ${(be.adaptType || curW().type).toUpperCase()} • ${bossMode === 'jr' || bossMode === 'sr' || bossMode === 'weapon' ? (be.weaponStyle || 'sword').toUpperCase() : bossMode === 'grandma' ? 'ARMED HOSPITALITY' : 'CORPORATE WARFARE'}`;
      }
    }
    let m = Math.min(100, (master / 9) * 100);
    U.mastery.style.width = m + '%';
    U.mastT.textContent = riftReady ? 'OPEN' : `${stageClears}/${stageGoal()}`;
  }
