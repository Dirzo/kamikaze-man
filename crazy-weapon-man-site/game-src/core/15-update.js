  function updateE(dt) {
    for (const e of E) {
      if (e.dead) {
        e.death -= dt;
        continue;
      }
      e.themeReveal = Math.max(0, (e.themeReveal || 0) - dt);
      if (e.boss) {
        updateBoss(e, dt);
        continue;
      }
      e.stun = Math.max(0, e.stun - dt);
      e.hitT = Math.max(0, (e.hitT || 0) - dt);
      e.recoilT = Math.max(0, (e.recoilT || 0) - dt);
      e.recoverT = Math.max(0, (e.recoverT || 0) - dt);
      e.specialCd = Math.max(0, (e.specialCd || 0) - dt);
      e.traitCd = Math.max(0, (e.traitCd || 0) - dt);
      e.faceCd = Math.max(0, (e.faceCd || 0) - dt);
      e.hypeT = Math.max(0, (e.hypeT || 0) - dt);
      e.moonT = Math.max(0, (e.moonT || 0) - dt);
      e.soapT = Math.max(0, (e.soapT || 0) - dt);
      e.motivateT = Math.max(0, (e.motivateT || 0) - dt);
      if (e.state === 'spawn') {
        e.st -= dt;
        if (e.st <= 0) e.state = 'approach';
        continue;
      }
      let d = ED[e.type];
      if (
        e.traitCd <= 0 &&
        ['approach', 'recover'].includes(e.state) &&
        Math.abs(pl.x - e.x) < 520 &&
        e.recoilT <= 0 &&
        e.stun <= 0
      ) {
        triggerEnemyTrait(e, d);
      }
      if (e.recoilT > 0) {
        if (!d.air) {
          let py = e.y;
          e.vy += 820 * dt;
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          resolve(e, py);
        } else {
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          e.vx *= 0.96;
          e.vy *= 0.95;
        }
        if (e.wallReady && (e.x <= 6 || e.x >= W - e.w - 6)) {
          e.x = clamp(e.x, 6, W - e.w - 6);
          e.vx *= -0.22;
          e.stun = Math.max(e.stun, 0.42);
          e.recoilT = 0.1;
          e.wallReady = false;
          styleAdd(15, 'WALL SPLAT');
          txt(e.x + e.w / 2, e.y - 28, 'WALL SPLAT', '#fff176', true);
          ring(e.x + e.w / 2, e.y + e.h / 2, '#fff176', 54, 4);
          if (pl.boonForklift) pl.mana = Math.min(100, pl.mana + 6);
        }
        continue;
      }
      if (e.recoverT > 0) {
        e.vx *= 0.78;
        if (!d.air) {
          let py = e.y;
          e.vy += 950 * dt;
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          resolve(e, py);
        } else e.x += e.vx * dt;
        continue;
      }
      if (e.stun > 0) {
        e.vx *= 0.84;
        if (!d.air) {
          let py = e.y;
          e.vy += 950 * dt;
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          resolve(e, py);
        } else e.x += e.vx * dt;
        continue;
      }
      let dx = pl.x - e.x,
        dy = pl.y - e.y,
        dist = Math.abs(dx),
        wantedDir = dx >= 0 ? 1 : -1;
      if (e.soapT > 0) {
        e.vx *= 1.003;
        if (e.x < 12 || e.x > W - e.w - 12) e.vx = -e.vx;
      }
      if (e.moonT > 0) e.vx = -e.dir * Math.max(180, Math.abs(e.vx));
      if (e.type === 'shieldbro') {
        if (e.turnT > 0) {
          e.turnT = Math.max(0, e.turnT - dt);
          e.vx *= 0.62;
          if (e.turnT <= 0) {
            e.dir = e.pendingDir;
            e.faceCd = 0.78;
          }
        } else if (wantedDir !== e.dir && e.faceCd <= 0 && e.state === 'approach') {
          e.pendingDir = wantedDir;
          e.turnT = 0.52;
          e.faceCd = 1.22;
          txt(e.x + e.w / 2, e.y - 30, 'SLOWLY TURNING...', '#bde8ff', false);
        }
      } else e.dir = wantedDir;
      let sep = 0;
      for (const o of E) {
        if (o === e || o.dead) continue;
        let q = e.x - o.x;
        if (Math.abs(q) < 74) sep += Math.sign(q || 1) * (74 - Math.abs(q));
      }
      let traitSp =
        e.sp * (e.hypeT > 0 ? 1.9 : e.motivateT > 0 ? 1.25 : 1) * (chaosEvent === 'disco' ? 1.18 : 1);
      if (e.type === 'summoner' && e.state === 'approach' && e.specialCd <= 0 && dist > 120) {
        e.state = 'summonwind';
        e.st = 0.85;
        e.vx = 0;
        txt(e.x + e.w / 2, e.y - 28, 'TEAM BUILDING', '#8dffad', false);
      } else if (e.type === 'blinker' && e.state === 'approach' && e.specialCd <= 0 && dist > 80) {
        e.state = 'blinkwind';
        e.st = 0.48;
        e.vx = 0;
        F.push({
          k: 'rune',
          x: e.x + e.w / 2,
          y: e.y + e.h / 2,
          r: 35,
          life: 0.48,
          max: 0.48,
          col: '#b06cff',
          spin: 1
        });
      } else if (e.state === 'summonwind') {
        e.vx *= 0.6;
        e.st -= dt;
        if (e.st <= 0) {
          e.specialCd = 5.5;
          let sx = e.x + e.w / 2,
            sy = e.y + e.h * 0.35,
            tx = pl.x + pl.w / 2,
            ty = pl.y + pl.h / 2,
            dx = tx - sx,
            dy = ty - sy,
            l = Math.hypot(dx, dy) || 1;
          for (let i = -1; i <= 1; i++) {
            let a = i * 0.22,
              ca = Math.cos(a),
              sa = Math.sin(a),
              ux = dx / l,
              uy = dy / l;
            Q.push({
              x: sx,
              y: sy,
              vx: (ux * ca - uy * sa) * 390,
              vy: (ux * sa + uy * ca) * 390,
              r: 9,
              life: 3,
              dam: e.dmg * 0.48,
              col: '#80ff9c',
              trail: 0,
              effect: 'summoned',
              spin: i * 4,
              trait: true
            });
          }
          ring(sx, sy, '#80ff9c', 80, 4);
          txt(e.x, e.y - 34, 'SPECTRAL TEAM BUILDING', '#80ff9c', false);
          e.state = 'recover';
          e.st = 1.05;
        }
      } else if (e.state === 'blinkwind') {
        e.st -= dt;
        if (e.st <= 0) {
          part(e.x + e.w / 2, e.y + e.h / 2, '#a66cff', 12, 170, 5);
          e.x = clamp(pl.x - pl.dir * 85, 20, W - e.w - 20);
          e.y = pl.y;
          part(e.x + e.w / 2, e.y + e.h / 2, '#d2a4ff', 15, 210, 6);
          e.dir = pl.x >= e.x ? 1 : -1;
          e.specialCd = 3.8;
          enemyMeleeFX(e, { atk: 'hack', col: e.col });
          e.state = 'lunge';
          e.st = 0.22;
          e.hit = false;
          e.vx = e.dir * 250;
        }
      } else if (e.state === 'approach') {
        let des = d.range + (d.atk === 'fireball' || d.atk === 'laser' ? ri(-35, 35) : 28 + (e.id % 3) * 26);
        if ((d.atk === 'fireball' || d.atk === 'laser') && dist < 150) {
          e.vx -= e.dir * 180 * dt;
          e.vx = clamp(e.vx, -traitSp, traitSp);
        } else if (dist > des) {
          e.vx += e.dir * 240 * dt + sep * 5 * dt;
          e.vx = clamp(e.vx, -traitSp, traitSp);
        } else {
          e.vx *= 0.7;
          e.state = 'wind';
          e.st = d.wind;
        }
      } else if (e.state === 'wind') {
        e.vx *= 0.5;
        e.st -= dt;
        if (e.st <= 0) {
          if (d.atk === 'fireball' || d.atk === 'laser') {
            enemyBolt(e, d);
            e.state = 'cast';
            e.st = d.atk === 'laser' ? 0.24 : 0.18;
            e.vx = -e.dir * 55;
          } else if (d.atk === 'bomb') {
            e.state = 'bomb';
            e.st = 0.72;
            e.vx = 0;
            txt(e.x + e.w / 2, e.y - 18, 'OH NO', '#ffef7a', false);
          } else {
            enemyMeleeFX(e, d);
            sfxEnemyMelee(e, d);
            e.state = 'lunge';
            e.st = d.atk === 'charge' ? 0.82 : d.atk === 'cleave' ? 0.22 : 0.14;
            e.hit = false;
            e.vx =
              e.dir *
              (d.atk === 'charge' ? 520 : e.type === 'brute' ? 250 : e.type === 'crawler' ? 235 : 185);
          }
        }
      } else if (e.state === 'bomb') {
        e.st -= dt;
        e.vx *= 0.7;
        if (e.st <= 0) {
          boom(e.x + e.w / 2, e.y + e.h / 2, '#ffcf46', 105, 1);
          if (Math.hypot(pl.x + pl.w / 2 - (e.x + e.w / 2), pl.y + pl.h / 2 - (e.y + e.h / 2)) < 115)
            hurt(e.dmg * 1.05, e);
          killE(e, false, null, e.dmg);
          continue;
        }
      } else if (e.state === 'cast') {
        e.vx *= 0.82;
        e.st -= dt;
        if (e.st <= 0) {
          e.state = 'recover';
          e.st = d.air ? 0.62 : 0.86;
        }
      } else if (e.state === 'lunge') {
        if (d.atk === 'charge' && (e.x < 8 || e.x > W - e.w - 8)) {
          e.vx = -e.vx;
          e.dir = -e.dir;
          e.hit = false;
          shake = Math.max(shake, 3);
          ring(e.x + e.w / 2, G - 10, '#b7c3d1', 45, 3);
        }
        if (!e.hit && dist < d.range + 34 && Math.abs(dy) < 78) {
          hurt(e.dmg, e);
          e.hit = true;
          if (d.atk === 'cleave' || d.atk === 'charge') {
            ring(e.x + e.w / 2, G - 7, d.atk === 'charge' ? '#d8e2ec' : '#ff6c58', 75, 4);
            shake = Math.max(shake, 5);
          }
        }
        e.st -= dt;
        if (e.st <= 0) {
          e.state = 'recover';
          e.st = e.type === 'brute' ? 1.02 : d.atk === 'charge' ? 0.85 : 0.58;
          e.vx *= 0.25;
        }
      } else if (e.state === 'recover') {
        e.vx *= 0.82;
        e.st -= dt;
        if (e.st <= 0) e.state = 'approach';
      }
      if (d.air) {
        e.y += Math.sin(time * 3 + e.anim) * 35 * dt + clamp(pl.y - e.y, -70, 70) * 0.4 * dt;
        e.x += e.vx * dt;
      } else {
        let py = e.y;
        e.vy += 950 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        resolve(e, py);
      }
      e.x = clamp(e.x, 5, W - e.w - 5);
    }
  }
  function updateQ(dt) {
    for (const q of Q) {
      q.life -= dt;
      if (q.life <= 0) {
        q.dead = true;
        continue;
      }
      if (q.effect === 'gas') {
        q.tick = (q.tick || 0) - dt;
        q.r = Math.min(68, q.r + 18 * dt);
        q.x += q.vx * dt;
        q.vx *= 0.97;
        q.y += q.vy * dt;
        q.vy *= 0.95;
        if (Math.hypot(pl.x + pl.w / 2 - q.x, pl.y + pl.h / 2 - q.y) < q.r && q.tick <= 0) {
          q.tick = 0.55;
          hurt(q.dam, { x: q.x });
          txt(pl.x + 17, pl.y - 38, 'POISON FART', '#86ff68', false);
        }
        continue;
      }
      if (q.effect === 'rabbit' || q.effect === 'banana') {
        q.vy += 650 * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        if (q.y > G - q.r) {
          q.y = G - q.r;
          if (q.effect === 'rabbit' && (q.bounces || 0) < 3) {
            q.vy = -rand(300, 430);
            q.vx *= 0.82;
            q.bounces = (q.bounces || 0) + 1;
          } else {
            q.vy = 0;
            q.vx *= 0.92;
          }
        }
        let hb = { x: q.x - q.r, y: q.y - q.r, w: q.r * 2, h: q.r * 2 };
        if (rect(hb, pl)) {
          hurt(q.dam, { x: q.x });
          if (q.effect === 'banana') {
            pl.vx += (pl.x < q.x ? -1 : 1) * 420;
            pl.vy = -250;
            txt(pl.x + 17, pl.y - 38, 'BANANA INCIDENT', '#fff46b', true);
          } else txt(pl.x + 17, pl.y - 38, 'RABBIT IMPACT', '#f4eed8', true);
          q.dead = true;
        }
        continue;
      }
      q.trail -= dt;
      if (q.trail <= 0) {
        q.trail = 0.035;
        F.push({
          k: 'p',
          x: q.x,
          y: q.y,
          vx: rand(-25, 25),
          vy: rand(-25, 25),
          life: 0.22,
          sz: rand(3, 7),
          col: q.col
        });
      }
      if (q.effect === 'weird') q.vy += Math.sin(time * 8 + q.x * 0.01) * 45 * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.x < -30 || q.x > W + 30 || q.y < -30 || q.y > H + 30) {
        q.dead = true;
        continue;
      }
      let hb = { x: q.x - q.r, y: q.y - q.r, w: q.r * 2, h: q.r * 2 };
      if (!q.dead && rect(hb, pl)) {
        if (q.effect === 'audit') {
          pl.mana = Math.max(0, pl.mana - 22);
          txt(pl.x + 17, pl.y - 42, '-22 MANA: RECEIPT', '#ff6680', true);
          hurt(q.dam * 0.55, { x: q.x });
        } else if (q.effect === 'burn') {
          hurt(q.dam, { x: q.x });
          txt(pl.x + 17, pl.y - 44, 'ON FIRE', '#ff7a35', true);
          boom(q.x, q.y, '#ff6b2d', 72, 0.55);
        } else hurt(q.dam, { x: q.x });
        q.dead = true;
        boom(q.x, q.y, q.col, q.effect === 'meteor' ? 75 : 55, q.effect === 'meteor' ? 0.7 : 0.45);
      }
    }
    Q = Q.filter(q => !q.dead);
  }
  function updateP(dt) {
    for (const p of P) {
      p.life -= dt;
      if (p.life <= 0) {
        p.dead = true;
        continue;
      }
      if (p.k === 'arrow' || p.k === 'blade' || p.k === 'shuriken') {
        let ox = p.x,
          oy = p.y;
        if (hasTrait(curW(), 'drunk') && p.sourceType) {
          p.vy += Math.sin(time * 11 + p.x * 0.02) * 180 * dt;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        for (const e of E) {
          if (e.dead || p.hit.has(e.id)) continue;
          let pad = (p.k === 'arrow' ? 8 : p.k === 'shuriken' ? 10 : 14) * Math.min(2, p.size || 1);
          if (segRect(ox, oy, p.x, p.y, e, pad)) {
            p.hit.add(e.id);
            let c = projCrit(e, p);
            hitE(e, p.dam * (c ? 1.9 : 1), {
              crit: c,
              col: p.col,
              knock: Math.sign(p.vx) * 220,
              stun: 0.1,
              sourceMod: p.mod,
              sourceDam: p.dam,
              sourceType: p.sourceType
            });
            if (p.mod === 'starfall' || p.mod === 'constellation') {
              let count = p.mod === 'constellation' ? 3 : 1;
              for (let i = 0; i < count; i++)
                P.push({
                  k: 'star',
                  x: e.x + rand(-60, 60),
                  y: -50,
                  targetY: e.y,
                  dam: p.dam * 0.76,
                  r: 75,
                  life: rand(0.18, 0.4),
                  col: '#ffe89a',
                  mod: p.mod,
                  rar: p.rar,
                  wp: p.wp,
                  sourceType: p.sourceType,
                  cc: p.cc
                });
              let extras = E.filter(x => !x.dead && x !== e)
                .sort((a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x))
                .slice(0, p.mod === 'constellation' ? 3 : 2);
              for (const t of extras)
                P.push({
                  k: 'spectral',
                  x: e.x + e.w / 2,
                  y: e.y + e.h / 2,
                  vx: 0,
                  vy: 0,
                  target: t,
                  dam: p.dam * 0.48,
                  life: 1.3,
                  col: p.mod === 'constellation' ? '#fff0a0' : '#ffcf88',
                  mod: p.mod,
                  rar: p.rar,
                  wp: p.wp,
                  sourceType: p.sourceType,
                  cc: p.cc
                });
            }
            if (p.k === 'shuriken' && p.bounces > 0) {
              let n = E.filter(x => !x.dead && !p.hit.has(x.id)).sort(
                (a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x)
              )[0];
              if (n) {
                let dx = n.x + n.w / 2 - p.x,
                  dy = n.y + n.h / 2 - p.y,
                  d = Math.hypot(dx, dy) || 1,
                  sp = Math.max(720, Math.hypot(p.vx, p.vy));
                p.vx = (dx / d) * sp;
                p.vy = (dy / d) * sp;
                p.bounces--;
                p.pier = Math.max(p.pier, 1);
              }
            }
            if (p.pier > 0) p.pier--;
            else p.dead = true;
          }
        }
      } else if (p.k === 'spectral') {
        let t = p.target;
        if (!t || t.dead) t = near(p.x);
        p.target = t;
        if (t) {
          let dx = t.x + t.w / 2 - p.x,
            dy = t.y + t.h / 2 - p.y,
            d = Math.hypot(dx, dy) || 1;
          p.vx += (dx / d) * 1100 * dt;
          p.vy += (dy / d) * 1100 * dt;
          let sp = Math.hypot(p.vx, p.vy);
          if (sp > 650) {
            p.vx = (p.vx / sp) * 650;
            p.vy = (p.vy / sp) * 650;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (d < 24) {
            let c = projCrit(t, p);
            hitE(t, p.dam * (c ? 1.8 : 1), {
              crit: c,
              col: p.col,
              knock: Math.sign(p.vx) * 120,
              stun: 0.08,
              sourceMod: p.mod,
              sourceDam: p.dam,
              sourceType: p.sourceType
            });
            p.dead = true;
          }
        } else p.dead = true;
      } else if (p.k === 'orb') {
        let t = p.target;
        if (!t || t.dead) t = near(p.x);
        p.target = t;
        if (t) {
          let dx = t.x + t.w / 2 - p.x,
            dy = t.y + t.h / 2 - p.y,
            d = Math.hypot(dx, dy) || 1;
          p.vx += (dx / d) * 900 * dt;
          p.vy += (dy / d) * 900 * dt;
          let sp = Math.hypot(p.vx, p.vy);
          if (sp > 460) {
            p.vx = (p.vx / sp) * 460;
            p.vy = (p.vy / sp) * 460;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (Math.hypot(dx, dy) < 22) {
            let c = projCrit(t, p);
            hitE(t, p.dam * (c ? 1.9 : 1), {
              crit: c,
              col: p.col,
              stun: 0.1,
              sourceMod: p.mod,
              sourceDam: p.dam,
              sourceType: p.sourceType
            });
            if (p.split) {
              let n = near(t.x, t);
              if (n)
                P.push({
                  k: 'orb',
                  x: p.x,
                  y: p.y,
                  vx: rand(-80, 80),
                  vy: rand(-80, 80),
                  dam: p.dam * 0.72,
                  pier: 0,
                  life: 1.5,
                  hit: new Set(),
                  col: p.col,
                  target: n,
                  split: 0,
                  r: 0,
                  mod: p.mod,
                  rar: p.rar,
                  wp: p.wp,
                  sourceType: p.sourceType,
                  cc: p.cc
                });
            }
            p.dead = true;
          }
        } else p.dead = true;
      } else if (['staff', 'star', 'meteor', 'lightning'].includes(p.k)) {
        p.y += (p.targetY - p.y) * Math.min(1, dt * 14);
        if (p.life < 0.07 && !p.ex) {
          p.ex = true;
          p.dead = true;
          boom(p.x, p.targetY, p.col || '#fff', p.r || 90, p.k === 'meteor' ? 1.2 : 0.8);
          for (const e of E)
            if (!e.dead && Math.hypot(e.x - p.x, e.y - p.targetY) < (p.r || 90)) {
              let c = projCrit(e, p);
              hitE(e, p.dam * (c ? 1.85 : 1), {
                crit: c,
                col: p.col,
                knock: Math.sign(e.x - p.x) * 240,
                stun: 0.25,
                sourceMod: p.mod,
                sourceDam: p.dam,
                sourceType: p.sourceType
              });
            }
          if (p.k === 'staff' && p.mod === 'sunfall')
            F.push({
              k: 'sun',
              x: p.x,
              y: p.targetY,
              life: 2.4,
              max: 2.4,
              tick: 0,
              pow: p.wp || 3,
              col: '#ff9a55',
              dam: p.dam
            });
        }
      }
    }
    P = P.filter(p => !p.dead && p.x > -160 && p.x < W + 160).slice(-300);
  }
  function updateF(dt) {
    for (const f of F) {
      f.life -= dt;
      if (f.k === 'p') {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 320 * dt;
      } else if (f.k === 'r') f.r += (f.mr - f.r) * dt * 14;
      else if (f.k === 'smoke') f.r += (f.mr - f.r) * dt * 5;
      else if (f.k === 'after') {
        if (f.life < 0.08 && !f.done) {
          f.done = true;
          if (f.target && !f.target.dead) {
            beam(f.x - 30 * f.dir, f.y - 22, f.x + 30 * f.dir, f.y + 22, f.col, 6);
            hitE(f.target, f.dam, {
              col: f.col,
              knock: f.dir * 180,
              stun: 0.12,
              sourceMod: 'horizon',
              sourceDam: f.dam
            });
          }
        }
      } else if (f.k === 'argument') {
        if (f.target && !f.target.dead) {
          f.x = f.target.x + f.target.w / 2;
          f.y = f.target.y + f.target.h / 2;
        }
        if (f.life < 0.08 && !f.done) {
          f.done = true;
          boom(f.x, f.y, f.col, 105, 0.9);
          for (const e of E)
            if (!e.dead && Math.hypot(e.x - f.x, e.y - f.y) < 115)
              hitE(e, f.dam, {
                col: f.col,
                knock: Math.sign(e.x - f.x) * 350,
                stun: 0.3,
                sourceMod: 'argument',
                sourceDam: f.dam
              });
        }
      } else if (f.k === 'sun') {
        f.tick -= dt;
        if (f.tick <= 0) {
          f.tick = 0.24;
          let sd = f.dam || wdmg();
          for (const e of E)
            if (!e.dead && Math.hypot(e.x - f.x, e.y - f.y) < 100)
              hitE(e, sd * 0.16 * f.pow, { col: '#ff9a55', stun: 0.02, sourceMod: 'sunfall', sourceDam: sd });
        }
      } else if (f.k === 'vortex') {
        let sd = f.dam || wdmg();
        for (const e of E) {
          if (e.dead) continue;
          let dx = f.x - (e.x + e.w / 2),
            dy = f.y - (e.y + e.h / 2),
            d = Math.max(24, Math.hypot(dx, dy));
          if (d < 190) {
            e.vx += (dx / d) * 700 * dt;
            e.vy += (dy / d) * 180 * dt;
            if (Math.random() < dt * 4)
              hitE(e, sd * 0.18 * f.pow, {
                col: '#c89cff',
                stun: 0.02,
                sourceMod: 'blackhole',
                sourceDam: sd
              });
          }
        }
        if (f.life < 0.08 && !f.boom) {
          f.boom = true;
          boom(f.x, f.y, '#b46cff', 140 * f.pow, 1);
          for (const e of E)
            if (!e.dead && Math.hypot(e.x - f.x, e.y - f.y) < 150 * f.pow)
              hitE(e, sd * 0.75 * f.pow, {
                col: '#d4a8ff',
                knock: Math.sign(e.x - f.x) * 400,
                stun: 0.4,
                sourceMod: 'blackhole',
                sourceDam: sd
              });
        }
      }
    }
    F = F.filter(f => f.life > 0).slice(-260);
  }
  function update(dt) {
    if (!gameStarted || paused || over || boonChoosing || deathOfferOpen || shardForgeOpen) return;
    if (waveIntroT > 0) {
      waveIntroT = Math.max(0, waveIntroT - dt);
      if (U.waveIntroFill) U.waveIntroFill.style.width = (waveIntroT / 3.3) * 100 + '%';
      if (waveIntroT <= 0 && U.waveIntro) U.waveIntro.classList.remove('show');
    }
    updateStyle(dt);
    updateKillChain(dt);
    updateAugment(dt);
    if (superT > 0) {
      superT = Math.max(0, superT - dt);
      if (Math.random() < dt * 16)
        part(
          pl.x + pl.w / 2 + rand(-18, 18),
          pl.y + pl.h / 2 + rand(-26, 20),
          Math.random() < 0.5 ? '#fff176' : curW().col,
          3,
          50,
          3
        );
    }
    if (synergyT > 0) {
      synergyT -= dt;
      if (synergyT <= 0 && U.synergyBadge) U.synergyBadge.classList.remove('show');
    }
    if (hudUpgradeT > 0) {
      hudUpgradeT -= dt;
      if (hudUpgradeT <= 0) U.fsUpgrade.classList.remove('show');
    }
    if (levelUpT > 0) levelUpT = Math.max(0, levelUpT - dt);
    if (riftEnterT > 0) {
      riftEnterT -= dt;
      if (riftEnterT <= 0) {
        nextZone();
      }
      return;
    }
    if (bossIntroT > 0) {
      bossIntroT -= dt;
      if (bossIntroT <= 0) U.bossIntro.classList.remove('show');
      return;
    }
    if (bossVictoryT > 0) {
      bossVictoryT = Math.max(0, bossVictoryT - dt);
    }
    if (stop > 0) {
      stop = Math.max(0, stop - dt);
      flash = Math.max(0, flash - dt);
      return;
    }
    if (lootSlow > 0) {
      lootSlow = Math.max(0, lootSlow - dt);
      dt *= 0.97;
    }
    time += dt;
    if (bossMode) updateBossHazards(dt);
    else {
      updateChaos(dt);
      updateTerrain(dt);
    }
    flash = Math.max(0, flash - dt);
    chroma = Math.max(0, chroma - dt);
    if (bannerT > 0) {
      bannerT -= dt;
      if (bannerT <= 0) U.banner.style.display = 'none';
    }
    if (zoneT > 0) {
      zoneT -= dt;
      if (zoneT <= 0) {
        U.zone.style.display = 'none';
        packDelay = 0.45;
      }
      return;
    }
    pl.acd -= dt;
    pl.equipFxT = Math.max(0, (pl.equipFxT || 0) - dt);
    if (K.has('control') && pl.acd <= 0) {
      let carry = pl.acd;
      attack();
      pl.acd = Math.max(0.001, pl.acd + carry);
    } else if (pl.acd < 0) pl.acd = 0;
    pl.scd = Math.max(0, pl.scd - dt);
    pl.dcd = Math.max(0, pl.dcd - dt);
    pl.dashT = Math.max(0, (pl.dashT || 0) - dt);
    pl.inv = Math.max(0, pl.inv - dt);
    pl.at = Math.max(0, pl.at - dt);
    pl.mana = Math.min(100, pl.mana + 13 * augmentVal('mana', 1) * dt);
    let l = K.has('arrowleft'),
      r = K.has('arrowright'),
      mv = (r ? 1 : 0) - (l ? 1 : 0),
      dashing = pl.dashT > 0;
    if (dashing) {
      pl.vx = pl.dashDir * (pl.dashAir ? 1120 : 1240);
      if (Math.random() < dt * 38)
        F.push({
          k: 'ghost',
          x: pl.x + 17 - pl.dashDir * 14,
          y: pl.y + 25,
          dir: pl.dashDir,
          life: 0.12,
          max: 0.12,
          col: curW().col,
          sc: 1
        });
    } else {
      if (mv) {
        pl.dir = mv;
        pl.vx += mv * 1650 * dt;
      } else pl.vx *= Math.pow(terrainMode === 'ice' ? 0.62 : 0.0007, dt);
      if (inMapWater(pl.x + pl.w / 2) && pl.on && pl.y + pl.h > G - 10) {
        pl.vx *= Math.pow(0.18, dt);
        if (Math.random() < dt * 2) part(pl.x + 17, G - 7, mapScene.water.col, 2, 40, 4);
      }
      let wm = weaponMoveMult(curW());
      let augMove = augmentVal('move', 1);
      pl.vx = clamp(
        pl.vx,
        -pl.move * wm * augMove * (chaosEvent === 'disco' ? 1.12 : 1),
        pl.move * wm * augMove * (chaosEvent === 'disco' ? 1.12 : 1)
      );
    }
    let py = pl.y;
    pl.vy += (chaosEvent === 'lowgrav' ? 560 : 1050) * dt;
    pl.x += pl.vx * dt;
    pl.y += pl.vy * dt;
    pl.x = clamp(pl.x, 0, W - pl.w);
    resolve(pl, py);
    if (pl.on) pl.dashAir = false;
    updateE(dt);
    updateQ(dt);
    updateP(dt);
    updateF(dt);
    if (!bossMode && E.filter(e => !e.dead).length === 0) {
      if (packLive) registerClear();
      if (riftReady) {
        let dx = pl.x + pl.w / 2 - riftX,
          dy = pl.y + pl.h / 2 - (G - 115);
        if (Math.abs(dx) < 62 && Math.abs(dy) < 132) enterRift();
      } else {
        packDelay -= dt;
        if (packDelay <= 0) {
          spawnPack();
          packDelay = 2.6;
          U.msg.textContent = `Stage ${zoneI + 1} • Pack ${stageClears + 1}/${stageGoal()} • Enemy Lv. ~${Z[zoneI].lv}`;
        }
      }
    }
    for (const d of D) {
      d.life -= dt;
      d.arm = Math.max(0, (d.arm || 0) - dt);
      let dx = pl.x + 17 - d.x,
        dy = pl.y + 20 - d.y,
        dist = Math.hypot(dx, dy);
      if ((dist < 190 || d.life < 2.5) && d.arm <= 0) {
        d.vx += (dx / (dist || 1)) * 650 * dt;
        d.vy += (dy / (dist || 1)) * 650 * dt;
        d.vx *= 0.91;
        d.vy *= 0.91;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (dist < 24) {
          equip(d.item);
          d.life = -1;
        }
      } else {
        d.vy += 560 * dt;
        d.y += d.vy * dt;
        if (d.y > G - 10) {
          d.y = G - 10;
          d.vy = 0;
        }
      }
    }
    D = D.filter(d => d.life > 0);
    E = E.filter(e => !e.dead || e.death > 0);
    for (const t of T) {
      t.life -= dt;
      if (t.kind === 'damage') {
        t.y -= (t.rise || 62) * dt;
        t.x += (t.vx || 0) * dt;
        t.vx = (t.vx || 0) * 0.965;
      } else if (t.kind === 'chainScore') {
        t.age = (t.age || 0) + dt;
        let k = 1 - Math.exp(-dt * 5.8);
        t.x += (t.tx - t.x) * k;
        t.y += (t.ty - t.y) * k;
      } else if (t.kind === 'chainCash') {
        t.y -= 18 * dt;
      } else t.y -= 38 * dt;
    }
    T = T.filter(t => t.life > 0);
    shake = Math.max(0, shake - 22 * dt);
  }
