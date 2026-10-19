  function makeW(l, elite = false) {
    let r = rr(elite),
      rank = rarityIndex(r),
      type = chooseWeaponType();
    let traitCount =
        rank < 2
          ? Math.random() < 0.22
            ? 1
            : 0
          : rank < 5
            ? 1
            : rank < 8
              ? ri(1, 2)
              : rank < 12
                ? 2
                : rank < 16
                  ? ri(2, 3)
                  : ri(3, 5),
      traits = [],
      pool = [...TRAITS, ...META_TRAITS.slice(0, metaLevel)];
    for (let i = 0; i < traitCount && pool.length; i++)
      traits.push(pool.splice(ri(0, pool.length - 1), 1)[0]);
    if (rank >= 8 && Math.random() < 0.05)
      traits = [
        TRAITS.find(t => t.code === 'pure'),
        TRAITS.find(t => t.code === 'asthma'),
        TRAITS.find(t => t.code === 'insanity')
      ];
    let material = rank >= 3 || Math.random() < 0.18 ? pick(MATERIALS) : null,
      intensity =
        rank >= 9
          ? Math.random() < 0.5
            ? 'Ultra'
            : pick(INTENSITY.slice(1))
          : rank >= 6 && Math.random() < 0.1
            ? 'Ultra'
            : '',
      mod = rollMod(r, type),
      cap = null,
      capName = '',
      capText = '';
    if (rank >= 7) {
      let options = CAP[type],
        idx = rank >= 14 ? 2 : rank >= 9 ? ri(1, 2) : ri(0, 1),
        c = options[idx];
      mod = c[0];
      cap = c[0];
      capName = c[0].replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, x => x.toUpperCase());
      capText = c[1];
    }
    let name = buildName(type, r, material, traits, intensity),
      w = {
        id: next++,
        type,
        name,
        mod,
        rar: r.n,
        col: r.col,
        p: r.p,
        lv: l,
        m: r.m * (0.94 + Math.random() * 0.12) * rangedLootQuality(type),
        crit: 0.012 * r.p,
        material,
        traits,
        intensity,
        cap,
        capName,
        capText,
        killStacks: 0
      };
    w.synergy = detectSynergy(w);
    w.text = proceduralText(w) + (w.synergy ? ` SYNERGY: ${w.synergy.name} — ${w.synergy.desc}` : '');
    return w;
  }
  function makeFunnyIntroWeapon(level) {
    let oldD = estimateDPS(curW()),
      best = null,
      bestD = 0;
    for (let i = 0; i < 80; i++) {
      let w = makeW(Math.max(1, level), false),
        r = pick(R.slice(1, 4)); // Uncommon, Magic or Rare only.
      w.rar = r.n;
      w.col = r.col;
      w.p = r.p;
      w.m = Math.max(w.m, r.m * (0.98 + Math.random() * 0.08));
      w.crit = 0.012 * r.p;
      let funnyPool = EARLY_FUNNY_TRAITS.map(c => TRAITS.find(t => t.code === c)).filter(Boolean),
        t = pick(funnyPool);
      w.traits = (w.traits || []).filter(x => x && x.code !== t.code);
      w.traits.unshift(t);
      // Occasionally teach two interacting jokes at once, but keep it readable.
      if (Math.random() < 0.22) {
        let t2 = pick(funnyPool.filter(x => x.code !== t.code));
        if (t2) w.traits.push(t2);
      }
      w.intensity = '';
      w.cap = null;
      w.capName = '';
      w.capText = '';
      w.mod = rollMod(r, w.type);
      w.name = buildName(w.type, r, w.material, w.traits, w.intensity);
      w.synergy = detectSynergy(w);
      w.text = proceduralText(w) + (w.synergy ? ` SYNERGY: ${w.synergy.name} — ${w.synergy.desc}` : '');
      let d = estimateDPS(w);
      if (d > bestD) {
        best = w;
        bestD = d;
      }
      if (d >= oldD * 1.1) return w;
    }
    if (!best) best = makeW(Math.max(1, level), false);
    bestD = estimateDPS(best);
    if (bestD < oldD * 1.1) {
      best.m *= (oldD * 1.12) / Math.max(1, bestD);
      best.text += ' Intro-chaos tuning guarantees this is a real DPS upgrade.';
    }
    return best;
  }
  function earlyFunnyIntroduction() {
    if (earlyFunnyGiven || kills < earlyFunnyKill) return;
    earlyFunnyGiven = true;
    let w = makeFunnyIntroWeapon(Math.max(pl.lv, Z[zoneI].lv));
    txt(pl.x + pl.w / 2, pl.y - 74, 'CRAZY WEAPON MAN IS BORED', '#fff176', true);
    txt(pl.x + pl.w / 2, pl.y - 40, 'TIME FOR A BAD IDEA', '#8ff8ff', false);
    ring(pl.x + pl.w / 2, pl.y + pl.h / 2, w.col, 125, 5);
    part(pl.x + pl.w / 2, pl.y + pl.h / 2, w.col, 20, 195, 7);
    tone(220, 660, 0.15, 0.04, 'square');
    tone(330, 990, 0.18, 0.035, 'triangle', 0.07);
    equip(w);
    U.msg.textContent = `FIRST BAD IDEA: ${w.name}. The game deliberately introduced a visible weapon mechanic on kill ${kills}.`;
  }
  function makeEarlyWeapon(level) {
    let oldD = estimateDPS(curW()),
      best = null,
      bestD = 0;
    for (let i = 0; i < 100; i++) {
      let w = makeW(Math.max(1, level), false),
        idx = rarityIndex(w),
        d = estimateDPS(w);
      if (idx < 1 || idx > 4) continue;
      if (d > bestD) {
        best = w;
        bestD = d;
      }
      if (d >= oldD * 1.08) return w;
    }
    if (!best) {
      best = makeW(Math.max(1, level), false);
      let r = R[1];
      best.rar = r.n;
      best.col = r.col;
      best.p = r.p;
      best.m = Math.max(best.m, r.m);
      best.name = 'Emergency Uncommon ' + GENERIC[best.type];
      best.text =
        'Weapon Intervention: the game refused to let Crazy Weapon Man keep using the Training Sword.';
      bestD = estimateDPS(best);
    }
    if (bestD < oldD * 1.08) {
      best.m *= (oldD * 1.1) / Math.max(1, bestD);
      best.text += ' DPS intervention tuning guarantees this beats the current weapon.';
    }
    return best;
  }
  function earlyWeaponIntervention() {
    if (earlyWeaponPity) return;
    let current = curW(),
      idx = pl.weapon ? rarityIndex(current) : -1;
    if (kills >= 6 && idx < 1) {
      earlyWeaponPity = true;
      let w = makeEarlyWeapon(Math.max(pl.lv, Z[zoneI].lv));
      txt(pl.x + pl.w / 2, pl.y - 58, 'WEAPON INTERVENTION!', '#8ff8ff', true);
      txt(pl.x + pl.w / 2, pl.y - 28, '6 KILLS IS TOO LONG TO BE BORING', '#fff4a8', false);
      ring(pl.x + pl.w / 2, pl.y + pl.h / 2, w.col, 105, 5);
      part(pl.x + pl.w / 2, pl.y + pl.h / 2, w.col, 18, 180, 6);
      equip(w);
      U.msg.textContent =
        'WEAPON INTERVENTION: by kill 6, Crazy Weapon Man is guaranteed an Uncommon-or-better DPS upgrade.';
    } else if (kills === 4 && idx < 1) {
      txt(pl.x + pl.w / 2, pl.y - 42, 'WEAPON WITHDRAWAL', '#ffd36e', false);
      U.msg.textContent =
        'Crazy Weapon Man is getting twitchy. If RNG stays rude, kill 6 forces an Uncommon+ DPS upgrade.';
    }
  }
  function curW() {
    return (
      pl.weapon || {
        type: 'sword',
        name: 'Training Sword',
        mod: 'none',
        text: 'A clean three-hit training combo: forehand, backhand, then an overhead finisher.',
        rar: 'Training',
        col: '#dfe5ed',
        p: 0.8,
        lv: 1,
        m: 1,
        crit: 0,
        material: null,
        traits: [],
        killStacks: 0
      }
    );
  }
  function combatScale(w) {
    let q = rarityRank(w);
    return 0.74 / (1 + q * 0.13);
  }
  function wdmg() {
    let w = curW();
    return baseD(pl.lv) * w.m * weaponDamageMult(w) * combatScale(w);
  }
  function cchance() {
    let w = curW();
    return Math.min(
      0.97,
      pl.crit + weaponCritBonus(w) + augmentCrit() + (superT > 0 ? 0.08 + 0.07 * superPower : 0)
    );
  }
  function estimateDPS(w) {
    if (!w) return 0;
    let coeff =
        {
          sword: 1.04,
          dagger: 0.78,
          nunchucks: 0.7,
          katana: 1.16,
          bow: 0.92,
          shuriken: 0.76,
          wand: 0.84,
          staff: 1.28,
          hammer: 1.42
        }[w.type] || 1,
      base = baseD(Math.max(pl.lv, w.lv || pl.lv)) * w.m * weaponDamageMult(w) * combatScale(w) * coeff,
      cc = Math.min(0.88, pl.crit + weaponCritBonus(w)),
      critValue = 1 + cc * 0.92,
      aps = 1 / heldAttackCooldown(w),
      proc = 1;
    if (w.mod === 'multishot') proc *= 1.28;
    if (w.mod === 'pierce') proc *= 1.12;
    if (w.mod === 'echo' || w.mod === 'echoes') proc *= 1.28;
    if (w.mod === 'nova') proc *= 1.15;
    if (w.cap) proc *= 1.18 + rarityRank(w) * 0.035;
    if (w.material) {
      if (w.material.code === 'diamond' || w.material.code === 'rubber') proc *= 1.13;
      if (w.material.code === 'nuclear' || w.material.code === 'void' || w.material.code === 'plasma')
        proc *= 1.11;
      if (w.material.code === 'living') proc *= 1.09;
    }
    if (hasTrait(w, 'rhythmic')) proc *= 1.13;
    if (hasTrait(w, 'recursive')) proc *= 1.12;
    if (hasTrait(w, 'sentient')) proc *= 1.09;
    if (hasTrait(w, 'hex')) proc *= 1.08;
    if (hasTrait(w, 'unstable')) proc *= 1.1;
    if (hasTrait(w, 'explosive')) proc *= 1.11;
    if (hasTrait(w, 'haunted')) proc *= 1.08;
    if (hasTrait(w, 'jazzhands')) proc *= 1.07;
    if (hasTrait(w, 'assbackwards')) proc *= 1.03;
    if (hasTrait(w, 'bouncy')) proc *= 1.06;
    if (w.synergy) proc *= 1.14;
    return base * critValue * aps * proc;
  }
  function wscore(w) {
    return estimateDPS(w);
  }
  function weaponScale(w) {
    let q = rarityRank(w),
      base = [1.08, 1.16, 1.28, 1.42, 1.62, 1.82, 2.05, 2.3, 2.58, 2.9, 3.3][q] || 1.1;
    if (hasTrait(w, 'fat')) base *= 1.42;
    if (w.material && w.material.code === 'meat') base *= 1 + Math.min(0.42, (w.killStacks || 0) * 0.01);
    return base;
  }
  function projCrit(e, p, b = 0) {
    let base = p && Number.isFinite(p.cc) ? p.cc : cchance(),
      ex = p && p.mod === 'execution' && e.hp / e.max < 0.45 ? 0.24 : 0;
    return Math.random() < base + b + ex + (e.hp / e.max < 0.3 ? 0.07 : 0);
  }
  function weaponAura(w, x, y) {
    let q = rarityRank(w);
    if (q < 1) return;
    X.save();
    X.translate(x, y);
    X.globalAlpha = q >= 4 ? 0.78 : 0.35;
    X.strokeStyle = w.col;
    X.shadowBlur = 10 + q * 5;
    X.shadowColor = w.col;
    X.lineWidth = 1 + q * 0.55;
    let rr = 20 + q * 5 + Math.sin(time * (5 + q * 0.3)) * 3;
    X.beginPath();
    X.arc(0, 0, rr, 0, Math.PI * 2);
    X.stroke();
    if (q >= 3) {
      for (let i = 0; i < Math.min(10, q + 1); i++) {
        let a = time * (1.5 + i * 0.25) + (i * Math.PI * 2) / Math.max(1, q);
        X.fillStyle = q >= 8 ? `hsl(${(time * 120 + i * 38) % 360} 100% 72%)` : i % 2 ? '#ffffff' : w.col;
        X.beginPath();
        X.arc(Math.cos(a) * (18 + q * 4), Math.sin(a) * (12 + q * 2.5), 2 + q * 0.35, 0, Math.PI * 2);
        X.fill();
      }
    }
    if (q >= 7) {
      X.globalAlpha = 0.32;
      for (let i = 0; i < 3; i++) {
        X.rotate(0.7);
        X.strokeRect(-18 - q * 2, -18 - q * 2, 36 + q * 4, 36 + q * 4);
      }
    }
    X.restore();
  }
