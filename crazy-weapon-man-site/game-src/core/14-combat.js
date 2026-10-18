  function pool() {
    return Z[zoneI]?.pool || ['stalker', 'crawler', 'wizard'];
  }
  function spawn(type, x, elite = false, yTop = null) {
    let d = ED[type],
      theme = approachTheme(),
      lv = Math.max(1, Math.round((Z[zoneI].lv + pl.lv) / 2) + ri(-1, 1)),
      mh = Math.round(mobHP(lv) * d.hp * (elite ? 1.7 : 1)),
      y = d.air ? rand(260, 500) : Number.isFinite(yTop) ? yTop - d.h : G - d.h;
    E.push({
      id: next++,
      type,
      lv,
      x,
      y,
      w: d.w,
      h: d.h,
      hp: mh,
      max: mh,
      dmg: Math.round(22 * Math.pow(1.065, Math.max(0, lv - 1)) * d.dmg * (elite ? 1.3 : 1)),
      sp: d.sp,
      range: d.range,
      wind: d.wind,
      col: d.col,
      themeCol: theme.col,
      themeTag: theme.tag,
      elite,
      dead: false,
      death: 0.38,
      vx: 0,
      vy: 0,
      on: !d.air,
      dir: pl.x >= x ? 1 : -1,
      state: 'spawn',
      st: 0.5,
      stun: 0,
      anim: Math.random() * 9,
      hit: false,
      label: enemyName(type, elite),
      specialCd: rand(1.8, 3.8),
      traitCd: rand(2.8, 5.8),
      faceCd: 0,
      turnT: 0,
      pendingDir: pl.x >= x ? 1 : -1,
      traits: rollEnemyTraits(elite, type),
      hypeT: 0,
      moonT: 0,
      soapT: 0,
      motivateT: 0,
      themeReveal: 1.8
    });
  }
  function spawnPack() {
    rollDirector();
    let plan = wavePlan(stageClears),
      spots = spawnSpots(),
      spawned = 0,
      eliteBudget = plan.eliteCount,
      theme = approachTheme();
    for (let pi = 0; pi < plan.parts.length; pi++) {
      let partDef = plan.parts[pi],
        type = partDef.type,
        d = ED[type];
      for (let i = 0; i < partDef.count; i++) {
        let spot = spots.length
          ? spots.splice(ri(0, spots.length - 1), 1)[0]
          : { x: rand(55, W - 100), y: G };
        if (plan.mode.id === 'pincer' || plan.mode.id === 'final') {
          let side = spawned % 2 === 0 ? 1 : -1;
          spot = { x: side > 0 ? rand(W * 0.72, W - 85) : rand(40, W * 0.28), y: G };
        } else if (d.air && platforms.length && Math.random() < 0.72) spot = pick(platforms);
        let x = clamp(spot.x + rand(-22, 22), 28, W - d.w - 28),
          yt = d.air ? null : spot.y,
          elite = eliteBudget > 0 && (i === 0 || Math.random() < 0.24);
        if (elite) eliteBudget--;
        spawn(type, x, elite, yt);
        let e = E.at(-1),
          localScale = plan.scale * (partDef.role === 'NEW THREAT' ? 1 : 1.04);
        e.max = Math.round(e.max * localScale);
        e.hp = e.max;
        e.dmg = Math.max(1, Math.round(e.dmg * (1 + stageClears * 0.055 + zoneI * 0.014)));
        e.sp *= 1 + Math.min(0.22, stageClears * 0.026 + zoneI * 0.006);
        e.specialCd = Math.max(0.75, (e.specialCd || 2) * (1 - Math.min(0.22, stageClears * 0.025)));
        e.themeReveal = plan.final ? 3.6 : 2.9;
        e.waveLesson = stageClears;
        e.waveRole = partDef.role;
        if (plan.final && spawned === 0) e.label = 'FINAL APPROACH ' + e.label;
        if (pi > 0) e.label = partDef.role + ' ' + e.label;
        if (directorTrait && !e.traits.some(t => t.id === directorTrait.id)) e.traits.unshift(directorTrait);
        if (directorEvent?.id === 'weapontrial') e.dmg = Math.round(e.dmg * 1.24);
        spawned++;
      }
    }
    if (eliteBudget > 0) {
      for (const e of E.filter(x => !x.dead && !x.boss).slice(0, eliteBudget)) {
        e.elite = true;
        e.label = 'ELITE ' + e.label;
        e.max = Math.round(e.max * 1.42);
        e.hp = e.max;
        e.dmg = Math.round(e.dmg * 1.18);
      }
    }
    maybeCreateRareEnemy();
    showWaveIntro(plan);
    waveHistory.push({
      zone: zoneI,
      index: stageClears,
      mode: plan.mode.id,
      parts: plan.parts.map(x => x.type)
    });
    waveHistory = waveHistory.slice(-12);
    pack++;
    packStartedAt = time;
    packLive = true;
    rollTerrain();
    if (stageClears >= 2) {
      let hazardChance = Math.min(0.78, 0.22 + stageClears * 0.09 + zoneI * 0.025);
      if (Math.random() < hazardChance) startChaos();
      if (stageClears >= 3 && Math.random() < 0.55) rollTerrain();
    }
    let lesson = ENEMY_LESSONS[plan.primary];
    if (plan.final) {
      txt(W / 2, 122, 'FINAL EXAM: ' + plan.count + ' HOSTILES', theme.col, true);
      txt(W / 2, 154, approachLabel(), '#fff176', true);
      if (plan.rarityPressure?.extra)
        txt(W / 2, 186, `WEAPON HEAT +${plan.rarityPressure.extra} ENEMIES`, plan.rarityPressure.col, true);
      U.msg.textContent = `Final exam before ${theme.name}: ${plan.mode.desc} ${plan.rarityPressure?.extra ? `Your ${plan.rarityPressure.rar} weapon pulled in ${plan.rarityPressure.extra} extra hostiles. ` : ''}Chain kills quickly for huge slaughter bonuses.`;
    } else {
      let supports = plan.parts
        .slice(1)
        .map(x => enemyName(x.type, false))
        .join(', ');
      U.msg.textContent = `Wave ${stageClears + 1}/${stageGoal()} — ${plan.mode.name}: ${enemyName(plan.primary, false)} ×${plan.parts[0].count}${supports ? ' + ' + supports : ''}. ${plan.rarityPressure?.extra ? `${plan.rarityPressure.rar} weapon heat: +${plan.rarityPressure.extra} enemies. ` : ''}${lesson?.hint || ''}`;
    }
  }

  function near(x, except = null) {
    return E.filter(e => !e.dead && e !== except).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
  }
  function critFX(e, n) {
    sfxCrit(n);
    uiChime(Math.log10(Math.max(10, n)) > 2.2);
    stop = Math.max(stop, 0.038);
    shake = Math.max(shake, Math.min(16, 9 + Math.log10(Math.max(10, n)) * 1.6));
    flash = Math.max(flash, 0.12);
    chroma = Math.max(chroma, 0.11);
    part(e.x + e.w / 2, e.y + e.h / 2, '#ffe977', 16, 310, 7);
    ring(e.x + e.w / 2, e.y + e.h / 2, '#fff2a6', 82 + Math.min(35, Math.log10(Math.max(10, n)) * 8), 5);
  }
  function hitE(e, a, o = {}) {
    if (!e || e.dead) return 0;
    let before = e.hp,
      n = Math.max(1, Math.round(a));
    if (e.boss && !o.ignoreCap) {
      if ((e.phaseLock || 0) > 0) {
        if (time - (e.lastArmorText || -99) > 0.42) {
          e.lastArmorText = time;
          txt(e.x + e.w / 2, e.y - 32, 'PHASE ARMOR', '#fff17c', false);
        }
        return 0;
      }
      let ord = e.bossOrdinal || 1,
        impactBase = [0, 0.078, 0.056, 0.05, 0.046, 0.042, 0.038][ord] || 0.038,
        impactCrit = [0, 0.115, 0.082, 0.074, 0.068, 0.062, 0.057][ord] || 0.057,
        windowRate = [0, 0.23, 0.15, 0.13, 0.115, 0.105, 0.095][ord] || 0.095;
      n = Math.min(n, Math.max(1, Math.round(e.max * (o.crit ? impactCrit : impactBase))));
      if (time - (e.dmgWindowStart || 0) >= 1) {
        e.dmgWindowStart = time;
        e.dmgWindow = 0;
      }
      let remaining = Math.max(0, e.max * windowRate - (e.dmgWindow || 0));
      n = Math.min(n, Math.floor(remaining));
      if (n <= 0) {
        if (ord >= 2 && time - (e.lastArmorText || -99) > 0.55) {
          e.lastArmorText = time;
          txt(
            e.x + e.w / 2,
            e.y - 32,
            ord >= 5 ? 'REALITY DAMAGE BUDGET' : 'BOSS DAMAGE BUDGET',
            '#ffcc73',
            false
          );
        }
        return 0;
      }
      if (ord >= 2) {
        let nextHp = e.hp - n,
          phase2 =
            {
              bossman: 'PHASE 2 — PROMOTION DENIED',
              sr: 'PHASE 2 — DAD TOOK OFF THE READING GLASSES',
              grandma: 'PHASE 2 — SECOND HELPINGS',
              ceo: 'PHASE 2 — HOSTILE TAKEOVER',
              weapon: 'PHASE 2 — IT LEARNED YOUR BUILD'
            }[e.boss] || 'PHASE 2',
          phase3 =
            {
              bossman: "PHASE 3 — WE'RE A FAMILY HERE",
              sr: 'PHASE 3 — THERMOSTAT AUTHORITY',
              grandma: 'PHASE 3 — YOU ARE STILL TOO THIN',
              ceo: 'PHASE 3 — GOLDEN PARACHUTE DEPLOYED',
              weapon: 'PHASE 3 — THE ARMORY SCREAMS'
            }[e.boss] || 'PHASE 3';
        if (e.phase === 1 && nextHp <= e.max * 0.66) {
          n = Math.max(1, Math.ceil(e.hp - e.max * 0.66));
          e.phase = 2;
          e.phaseLock = 0.62 + ord * 0.055;
          e.patternCd = 0;
          txt(W / 2, 145, phase2, '#fff17c', true);
          ring(e.x + e.w / 2, e.y + e.h / 2, '#ffcf67', 150 + ord * 6, 7);
          shake = Math.max(shake, 12);
          stop = Math.max(stop, 0.1);
        } else if (e.phase === 2 && nextHp <= e.max * 0.33) {
          n = Math.max(1, Math.ceil(e.hp - e.max * 0.33));
          e.phase = 3;
          e.phaseLock = 0.68 + ord * 0.055;
          e.patternCd = 0;
          txt(W / 2, 145, phase3, '#ff8c68', true);
          ring(e.x + e.w / 2, e.y + e.h / 2, '#ff765c', 180 + ord * 7, 8);
          shake = Math.max(shake, 16);
          stop = Math.max(stop, 0.12);
        }
      }
      e.dmgWindow = (e.dmgWindow || 0) + n;
    } else {
      let impactCap = Math.max(
        1,
        Math.round(e.max * (e.boss ? (o.crit ? 0.105 : 0.07) : o.crit ? 0.64 : 0.52))
      );
      if (!o.ignoreCap) n = Math.min(n, impactCap);
    }
    if (e.type === 'shieldbro' && e.stun <= 0 && !['lunge', 'recover'].includes(e.state)) {
      let ax = Number.isFinite(o.fromX) ? o.fromX : pl.x + pl.w / 2,
        inc = Math.sign(ax - (e.x + e.w / 2));
      if (inc === e.dir) {
        n = Math.max(1, Math.round(n * 0.22));
        txt(e.x + e.w / 2, e.y - 20, 'CLANG — FLANK ME', '#bde8ff', false);
        ring(e.x + e.w / 2, e.y + e.h / 2, '#bde8ff', 38, 3);
        e.vx -= e.dir * 55;
      }
    }
    let sourceType = o.sourceType || curW().type,
      baseKn =
        {
          sword: 365,
          dagger: 185,
          nunchucks: 215,
          katana: 430,
          bow: 205,
          shuriken: 175,
          wand: 150,
          staff: 245,
          hammer: 545
        }[sourceType] || 190,
      dir =
        Math.sign(Number.isFinite(o.knock) && o.knock !== 0 ? o.knock : e.x + e.w / 2 - (pl.x + pl.w / 2)) ||
        1,
      launchParty = directorEvent?.id === 'launchparty' ? 1.65 : 1,
      extraKn = e.boss ? 0 : baseKn * (o.crit ? 1.28 : 1) * launchParty,
      appliedKn = Number.isFinite(o.knock) ? o.knock * launchParty : dir * extraKn;
    appliedKn *= augmentVal('knock', 1);
    let baseStun =
        {
          sword: 0.19,
          dagger: 0.1,
          nunchucks: 0.13,
          katana: 0.24,
          bow: 0.095,
          shuriken: 0.085,
          wand: 0.11,
          staff: 0.19,
          hammer: 0.36
        }[sourceType] || 0.1,
      appliedStun = Math.max(o.stun || 0, baseStun + (o.crit ? 0.07 : 0));
    if (!e.boss && pl.boonAir && e.y < G - e.h - 20) n = Math.round(n * 1.2);
    sfxHit(!!o.crit, Math.min(2.2, 0.6 + n / Math.max(120, e.max * 0.12)), n);
    e.hp -= n;
    if (!e.boss) {
      styleAdd(o.crit ? 9 : 3, e.y < G - e.h - 18 ? 'AIR HIT' : '');
      e.wallReady = true;
    }
    e.stun = Math.max(e.stun, appliedStun);
    e.vx += appliedKn;
    if (!e.boss) {
      e.hitT = Math.max(e.hitT || 0, o.crit ? 0.22 : 0.15);
      e.hitDir = Math.sign(appliedKn) || dir;
      e.recoilT = Math.max(
        e.recoilT || 0,
        o.crit ? 0.26 : sourceType === 'hammer' ? 0.24 : sourceType === 'sword' ? 0.19 : 0.14
      );
      e.recoverT = Math.max(e.recoverT || 0, o.crit ? 0.18 : 0.1);
      if (
        !ED[e.type]?.air &&
        (sourceType === 'hammer' || sourceType === 'sword' || o.crit) &&
        Math.abs(appliedKn) > 250
      ) {
        e.vy = Math.min(e.vy || 0, o.crit ? -155 : -95);
        e.on = false;
      }
      if (time - (e.lastHitStop || -99) > 0.07) {
        e.lastHitStop = time;
        stop = Math.max(stop, o.crit ? 0.05 : sourceType === 'hammer' ? 0.032 : 0.018);
        shake = Math.max(shake, o.crit ? 8 : sourceType === 'hammer' ? 5 : 2.5);
      }
    }
    damagePop(e, n, !!o.crit, o.col || '#fff');
    if (o.crit) {
      critFX(e, n);
      let cw = curW();
      if (hasTrait(cw, 'emotional')) {
        let eh = Math.max(1, Math.round(pl.max * 0.006));
        pl.hp = Math.min(pl.max, pl.hp + eh);
        txt(pl.x + pl.w / 2, pl.y - 22, 'VALIDATED +' + eh, '#8fffb2', false);
      }
    }
    part(e.x + e.w / 2, e.y + e.h / 2, o.col || '#ddd', o.crit ? 12 : 5, o.crit ? 250 : 120, 6);
    F.push({
      k: 'impact',
      x: e.x + e.w / 2,
      y: e.y + e.h / 2,
      col: o.col || '#fff',
      life: o.crit ? 0.22 : 0.12,
      max: o.crit ? 0.22 : 0.12,
      r: o.crit ? 34 : 19
    });
    if (e.hp <= 0) killE(e, n >= before && before >= e.max, o.sourceMod || null, o.sourceDam || n); // one-shot = from full health
    return n;
  }
  function crit(e, b = 0.0) {
    let w = curW(),
      exec = w.mod === 'execution' && e.hp / e.max < 0.45 ? 0.24 : 0;
    return Math.random() < cchance() + b + exec + (e.hp / e.max < 0.3 ? 0.07 : 0);
  }
  function killE(e, one = false, sourceMod = null, sourceDam = null) {
    if (e.dead) return;
    if (e.boss) {
      sfxKill(true, false);
      bossDefeated(e);
      return;
    }
    sfxKill(e.elite, one);
    e.dead = true;
    e.death = 0.38;
    kills++;
    styleAdd(one ? 18 : 10, one ? 'ONE-SHOT' : 'KILL');
    killChainAdd(e, one, !!e.elite);
    if (e.elite && pl.boonUnion) pl.dcd = Math.max(0, pl.dcd - 0.7);
    if (one) ones++;
    let xpGain = Math.round(
      (11 + e.lv * 2.0) * (e.elite ? 2 : 1) * (e.rareMutator ? 1.8 : 1) * styleXpMult()
    );
    pl.xp += xpGain;
    let heal = Math.max(
        6,
        Math.round(pl.max * (e.elite ? 0.05 : 0.02) * (pl.healMult || 1) * augmentVal('heal', 1))
      ),
      beforeHp = pl.hp;
    pl.hp = Math.min(pl.max, pl.hp + heal);
    let healed = Math.round(pl.hp - beforeHp);
    txt(
      e.x,
      e.y - 18,
      '+' + xpGain + ' XP' + (styleXpMult() > 1 ? ' • ' + styleGrade() + ' STYLE' : ''),
      '#a6e3a1'
    );
    if (healed > 0) {
      txt(pl.x + pl.w / 2, pl.y - 30, '+' + healed + ' HP', '#65f59a', false);
      part(
        pl.x + pl.w / 2,
        pl.y + pl.h / 2,
        '#65f59a',
        e.elite ? 12 : 7,
        e.elite ? 150 : 95,
        e.elite ? 6 : 4
      );
      ring(pl.x + pl.w / 2, pl.y + pl.h / 2, '#65f59a', e.elite ? 62 : 42, e.elite ? 4 : 2);
    }
    part(
      e.x + e.w / 2,
      e.y + e.h / 2,
      e.elite ? '#ff6b78' : e.col,
      e.elite ? 18 : 9,
      e.elite ? 260 : 160,
      e.elite ? 8 : 5
    );
    ring(
      e.x + e.w / 2,
      e.y + e.h / 2,
      e.rareMutator ? e.rareMutator.col : e.elite ? '#ff8590' : e.col,
      e.rareMutator ? 105 : e.elite ? 82 : 48,
      e.rareMutator ? 6 : e.elite ? 4 : 2
    );
    if (e.rareMutator) {
      applyRareAugment(e.rareMutator);
      styleAdd(55, 'RARE MUTATOR KILL');
    }
    let w = curW(),
      mod = sourceMod || w.mod,
      sd = sourceDam || wdmg();
    if (w.material && (w.material.code === 'bone' || w.material.code === 'meat'))
      w.killStacks = (w.killStacks || 0) + 1;
    if (hasTrait(w, 'taxevasive') || pl.boonTax)
      pl.mana = Math.min(100, pl.mana + (hasTrait(w, 'taxevasive') ? 10 : 0) + (pl.boonTax ? 6 : 0));
    if (mod === 'voidbloom' || mod === 'blackhole')
      F.push({
        k: 'vortex',
        x: e.x + e.w / 2,
        y: e.y + e.h / 2,
        life: mod === 'blackhole' ? 3 : 2,
        max: mod === 'blackhole' ? 3 : 2,
        pow: mod === 'blackhole' ? 1.7 : 1,
        dam: sd
      });
    if (mod === 'nullall') {
      let n = near(e.x, e);
      if (n) {
        beam(e.x, e.y, n.x, n.y, '#ff3ed8', 7);
        hitE(n, sd * 1.35, {
          col: '#ff9cff',
          knock: Math.sign(n.x - e.x) * 300,
          stun: 0.25,
          sourceMod: mod,
          sourceDam: sd
        });
      }
    }
    if (w.material && w.material.code === 'gold' && Math.random() < 0.55) {
      let targets = E.filter(x => !x.dead && x !== e).slice(0, 2);
      for (const t of targets)
        P.push({
          k: 'spectral',
          x: e.x + e.w / 2,
          y: e.y + e.h / 2,
          vx: 0,
          vy: 0,
          target: t,
          dam: sd * 0.36,
          life: 1.2,
          col: '#ffd85e',
          mod: 'gold',
          rar: w.rar,
          wp: w.p,
          sourceType: w.type,
          cc: cchance()
        });
    }
    weaponDryKills++;
    armorDryKills++;
    let earlyChance = kills <= 6 ? 0.46 : 0.3,
      dropChance = e.elite ? 0.75 : earlyChance,
      forcedDry = weaponDryKills >= 3;
    if (forcedDry || Math.random() < dropChance) {
      let item = makeW(e.lv, e.elite);
      spawnDrop(e.x + e.w / 2, e.y, item, false);
      if (forcedDry) {
        txt(e.x + e.w / 2, e.y - 42, 'WEAPON DROUGHT ENDED', '#8ff8ff', false);
        U.msg.textContent =
          'Crazy Weapon Man went three kills without loot and became medically unreasonable.';
      }
    }
    let armorChance = e.elite ? 0.055 + zoneI * 0.007 : 0.007 + zoneI * 0.0025,
      armorPity = armorDryKills >= 34;
    if (armorPity || Math.random() < armorChance) {
      armorDryKills = 0;
      let suit = makeArmor(e.lv + (e.elite ? 1 : 0), e.elite && Math.random() < 0.3);
      spawnDrop(e.x + e.w / 2 + rand(-18, 18), e.y - 20, suit, false);
      txt(e.x + e.w / 2, e.y - 64, armorPity ? 'ARMOR PITY DROP' : 'VERY RARE BODY ARMOR', suit.col, false);
      lootSlow = Math.max(lootSlow, 0.12);
    }
    earlyFunnyIntroduction();
    earlyWeaponIntervention();
    checkLevel();
  }
  function checkLevel() {
    while (pl.xp >= pl.xpn) {
      let need = pl.xpn;
      pl.xp -= need;
      pl.lv++;
      pl.xpn = Math.round(pl.xpn * 1.145 + 18);
      let hpGain = 18 + Math.floor(pl.lv / 5) * 3;
      pl.max += hpGain;
      pl.hp = Math.min(pl.max, pl.hp + Math.round(pl.max * 0.24));
      levelUpLv = pl.lv;
      levelUpT = 1.35;
      sfxLevelUp(pl.lv);
      stop = Math.max(stop, 0.16);
      flash = Math.max(flash, 0.2);
      shake = Math.max(shake, 9);
      txt(pl.x + pl.w / 2, pl.y - 46, 'LEVEL UP!', '#ffe37a', true);
      txt(pl.x + pl.w / 2, pl.y - 18, `LV ${pl.lv} • MAX HP +${hpGain}`, '#fff4b8', false);
      ring(pl.x + pl.w / 2, pl.y + pl.h / 2, '#ffe37a', 105, 6);
      part(pl.x + pl.w / 2, pl.y + pl.h / 2, '#fff0a0', 22, 220, 6);
      U.msg.textContent = `LEVEL ${pl.lv}! Crazy Weapon Man is becoming a slightly larger problem. Max HP +${hpGain}. Next level: ${pl.xpn} XP.`;
    }
  }
  function fire(k, dam, o = {}) {
    let w = curW(),
      dir = Number.isFinite(o.dir) ? o.dir : attackDir(w),
      back = hasTrait(w, 'assbackwards') && dir !== pl.dir,
      ox = pl.x + 17 + dir * 18;
    if (back) {
      part(pl.x + 17 - pl.dir * 16, pl.y + 31, '#ffb17a', 6, 90, 5);
      fxPush({
        k: 'speed',
        x: pl.x + 17 - pl.dir * 10,
        y: pl.y + 30,
        dir: -pl.dir,
        life: 0.12,
        max: 0.12,
        col: '#ffb17a',
        n: 4
      });
    }
    P.push({
      k,
      x: ox,
      y: pl.y + 18,
      vx: (o.sp || 760) * dir,
      vy: o.vy || 0,
      dam,
      pier: o.pier || 0,
      life: o.life || 2.2,
      hit: new Set(),
      col: o.col || '#fff',
      target: o.target || null,
      split: o.split || 0,
      r: o.r || 0,
      mod: o.mod || w.mod,
      rar: o.rar || w.rar,
      wp: o.wp || w.p,
      sourceType: o.sourceType || w.type,
      cc: Number.isFinite(o.cc) ? o.cc : cchance()
    });
  }
  function sword(w) {
    let dir = attackDir(w),
      step = pl.combo % 3,
      q = rarityRank(w),
      ao = weaponAoe(w),
      reach = (82 + q * 13) * ao,
      r = q >= 9 ? W : q >= 4 ? 145 * ao : step === 0 ? reach + 18 : reach,
      mult = step === 0 ? 1.22 : 1,
      kn = q >= 9 ? 800 : q >= 4 ? 460 : step === 0 ? 380 : 300,
      hb = {
        x: dir > 0 ? pl.x + pl.w - 4 : pl.x - r,
        y: pl.y - (step === 0 ? 16 : 8),
        w: r,
        h: (step === 0 ? 76 : 64) * Math.min(1.6, ao)
      };
    F.push({
      k: 'slash',
      x: pl.x + 17 + dir * (step === 0 ? 38 : 31),
      y: pl.y + 22,
      dir: dir,
      step,
      life: 0.21,
      max: 0.21,
      col: w.col,
      r: ((step === 0 ? 78 : 63) + q * 7) * Math.min(1.8, ao)
    });
    for (const e of E) {
      if (e.dead || e.state === 'spawn' || !rect(hb, e)) continue;
      let cr = crit(e),
        base = wdmg() * mult;
      hitE(e, base * (cr ? 1.95 : 1), {
        crit: cr,
        col: cr ? '#ffe477' : w.col,
        knock: dir * kn,
        stun: q >= 9 ? 0.6 : step === 0 ? 0.25 : 0.15,
        sourceMod: w.mod,
        sourceDam: base
      });
      if (cr && w.mod === 'horizon')
        F.push({
          k: 'after',
          x: e.x + e.w / 2,
          y: e.y + e.h / 2,
          target: e,
          dam: wdmg() * 0.72,
          life: 0.22,
          max: 0.22,
          col: w.col,
          dir: dir
        });
    }
    if (w.mod === 'worldcutter' || w.mod === 'nullall') {
      fire('blade', wdmg() * (w.mod === 'nullall' ? 1.8 : 1.15), {
        sp: w.mod === 'nullall' ? 1150 : 820,
        pier: 99,
        col: w.col,
        life: 1.4,
        mod: w.mod,
        size: ao,
        dir
      });
      if (step === 0)
        fire('blade', wdmg() * 1.25, {
          sp: 900,
          pier: 99,
          col: '#fff',
          vy: -40,
          life: 1.5,
          mod: w.mod,
          size: ao,
          dir
        });
    }
  }
  function nunchucks(w) {
    let dir = attackDir(w),
      q = rarityRank(w),
      ao = weaponAoe(w),
      r = (68 + q * 5) * ao,
      hb = { x: dir > 0 ? pl.x + pl.w - 4 : pl.x - r, y: pl.y - 12, w: r, h: 72 },
      hits = 2 + (w.mod === 'chainstorm' || w.mod === 'blender' || w.mod === 'orbitalkarate' ? 1 : 0);
    F.push({
      k: 'slash',
      x: pl.x + 17 + dir * 28,
      y: pl.y + 20,
      dir,
      step: pl.combo % 2,
      life: 0.15,
      max: 0.15,
      col: w.col,
      r: 55 + q * 3
    });
    for (const e of E) {
      if (e.dead || e.state === 'spawn' || !rect(hb, e)) continue;
      let total = wdmg() * (0.42 + 0.025 * q);
      for (let i = 0; i < hits; i++) {
        let cr = crit(e, 0.025 + i * 0.01);
        hitE(e, total * (cr ? 1.8 : 1), {
          crit: cr,
          col: w.col,
          knock: dir * (85 + i * 35),
          stun: 0.07 + i * 0.025,
          sourceMod: w.mod,
          sourceDam: total,
          sourceType: w.type
        });
      }
      if (w.mod === 'blender' && !e.dead) {
        e.vx += (pl.x - e.x) * 0.38;
        e.stun = Math.max(e.stun, 0.16);
      }
    }
    if ((w.mod === 'chainstorm' || w.mod === 'orbitalkarate') && pl.combo % 3 === 0) {
      ring(pl.x + 17, pl.y + 20, w.col, 105 * ao, 4);
      for (const e of E.filter(x => !x.dead).slice(0, 5))
        if (Math.hypot(e.x - pl.x, e.y - pl.y) < 145 * ao)
          hitE(e, wdmg() * 0.36, {
            col: w.col,
            knock: Math.sign(e.x - pl.x) * 180,
            stun: 0.12,
            sourceType: w.type
          });
    }
  }
  function katana(w) {
    let dir = attackDir(w),
      q = rarityRank(w),
      ao = weaponAoe(w),
      third = pl.combo % 3 === 0,
      r = (105 + q * 8 + (third ? 35 : 0)) * ao,
      hb = { x: dir > 0 ? pl.x + pl.w - 5 : pl.x - r, y: pl.y - 18, w: r, h: 82 };
    F.push({
      k: 'slash',
      x: pl.x + 17 + dir * 42,
      y: pl.y + 18,
      dir,
      step: third ? 0 : 1,
      life: 0.18,
      max: 0.18,
      col: w.col,
      r: 78 + q * 6 + (third ? 24 : 0)
    });
    for (const e of E) {
      if (e.dead || e.state === 'spawn' || !rect(hb, e)) continue;
      let cr = crit(e, 0.13 + (third ? 0.07 : 0)),
        base = wdmg() * (third ? 1.28 : 1.08);
      hitE(e, base * (cr ? 2.15 : 1), {
        crit: cr,
        col: cr ? '#fff3a8' : w.col,
        knock: dir * (third ? 460 : 300),
        stun: third ? 0.3 : 0.18,
        sourceMod: w.mod,
        sourceDam: base,
        sourceType: w.type
      });
      if (cr && w.mod === 'severfuture' && !e.dead)
        F.push({
          k: 'after',
          x: e.x + e.w / 2,
          y: e.y + e.h / 2,
          target: e,
          dam: base * 0.65,
          life: 0.22,
          max: 0.22,
          col: w.col,
          dir
        });
    }
    if ((w.mod === 'moonslice' || w.mod === 'iaijutsu') && third)
      P.push({
        k: 'blade',
        x: pl.x + 17,
        y: pl.y + 16,
        vx: dir * (900 + q * 20),
        vy: 0,
        dam: wdmg() * 0.9,
        pier: 99,
        life: 1.25,
        hit: new Set(),
        col: w.col,
        mod: w.mod,
        rar: w.rar,
        wp: w.p,
        sourceType: w.type,
        cc: cchance(),
        size: ao
      });
  }
  function shuriken(w) {
    let dir = attackDir(w),
      q = rarityRank(w),
      ao = weaponAoe(w),
      shots = w.mod === 'multishot' ? 4 : 2,
      baseA = bowAim(0),
      cc = cchance();
    for (let i = 0; i < shots; i++) {
      let a = baseA + (i - (shots - 1) / 2) * 0.055;
      P.push({
        k: 'shuriken',
        x: pl.x + 17,
        y: pl.y + 16,
        vx: Math.cos(a) * 880 * dir,
        vy: Math.sin(a) * 880,
        dam: wdmg() * (shots > 2 ? 0.48 : 0.66),
        pier: 1 + Math.floor(q / 6) + (w.mod === 'pierce' ? 2 : 0),
        life: 2.1,
        hit: new Set(),
        col: w.col,
        mod: w.mod,
        rar: w.rar,
        wp: w.p,
        sourceType: w.type,
        cc,
        size: ao,
        bounces: w.mod === 'ricochetstorm' ? 3 : 1
      });
    }
    if ((w.mod === 'shadowclone' || w.mod === 'ninjaccounting') && pl.combo % 3 === 0) {
      let targets = E.filter(e => !e.dead).slice(0, Math.min(8, 3 + q));
      for (const t of targets)
        P.push({
          k: 'spectral',
          x: pl.x + 17,
          y: pl.y + 12,
          vx: 0,
          vy: 0,
          target: t,
          dam: wdmg() * 0.34,
          life: 1.25,
          col: w.col,
          mod: w.mod,
          rar: w.rar,
          wp: w.p,
          sourceType: w.type,
          cc
        });
    }
  }
  function bow(w) {
    let dir = attackDir(w),
      q = rarityRank(w),
      shots = w.mod === 'multishot' ? 3 : 1,
      cc = cchance(),
      ao = weaponAoe(w);
    for (let i = 0; i < shots; i++) {
      let spread = (i - (shots - 1) / 2) * 0.085,
        a = bowAim(spread);
      P.push({
        k: 'arrow',
        x: pl.x + 17,
        y: pl.y + 18,
        vx: Math.cos(a) * 820 * dir,
        vy: Math.sin(a) * 820,
        dam: wdmg() * (shots > 1 ? 0.68 : 0.92),
        pier: (w.mod === 'pierce' ? 2 : 0) + Math.floor(q / 5),
        life: 2.2,
        hit: new Set(),
        col: w.col,
        mod: w.mod,
        rar: w.rar,
        wp: w.p,
        sourceType: w.type,
        cc,
        size: ao
      });
    }
    if (w.mod === 'thousand' || w.mod === 'constellation') {
      let targets = E.filter(e => !e.dead && e.state !== 'spawn')
        .sort((a, b) => Math.abs(a.x - pl.x) - Math.abs(b.x - pl.x))
        .slice(0, Math.min(8, 4 + q));
      for (const t of targets)
        P.push({
          k: 'spectral',
          x: pl.x + 17 + dir * 14,
          y: pl.y + 18,
          vx: dir * 260,
          vy: 0,
          target: t,
          dam: wdmg() * 0.58,
          life: 1.8,
          col: '#b9dcff',
          mod: w.mod,
          rar: w.rar,
          wp: w.p,
          sourceType: w.type,
          cc,
          size: ao
        });
    }
  }
  function wand(w) {
    let q = rarityRank(w),
      echoes = w.mod === 'echoes' ? 2 : w.mod === 'echo' ? 2 : 1,
      ao = weaponAoe(w);
    for (let i = 0; i < echoes; i++)
      fire('orb', wdmg() * (i ? 0.62 : 0.84), {
        sp: 300,
        target: near(pl.x),
        split: w.mod === 'echoes' ? 1 + Math.floor(q / 6) : 0,
        col: w.col,
        life: 2.5,
        mod: w.mod,
        size: ao
      });
    if (w.mod === 'blackhole' && Math.random() < 0.28 + 0.02 * q) {
      let t = near(pl.x);
      if (t)
        F.push({
          k: 'vortex',
          x: t.x + t.w / 2,
          y: t.y + t.h / 2,
          life: 2.5,
          max: 2.5,
          pow: 1.2 + q * 0.08,
          dam: wdmg()
        });
    }
  }
  function staff(w) {
    let t = near(pl.x),
      ao = weaponAoe(w),
      q = rarityRank(w),
      x = t ? t.x + t.w / 2 : pl.x + pl.dir * 220,
      count = w.mod === 'echo' ? 2 : 1,
      cc = cchance();
    for (let i = 0; i < count; i++)
      P.push({
        k: 'staff',
        x: x + (i ? pl.dir * 55 : 0),
        y: -30,
        targetY: t ? t.y + t.h / 2 : G - 20,
        dam: wdmg() * (i ? 0.68 : 1.28),
        r: (88 + q * 9) * ao,
        life: 0.34 + i * 0.08,
        col: w.col,
        mod: w.mod,
        rar: w.rar,
        wp: w.p,
        sourceType: w.type,
        cc,
        size: ao
      });
    if (w.mod === 'archon') {
      let cur = t || near(pl.x);
      for (let i = 0; i < 3 + Math.floor(q / 3) && cur; i++) {
        let nx = near(cur.x, cur);
        beam(
          i ? cur.x : pl.x + 17,
          i ? cur.y : pl.y + 15,
          cur.x + cur.w / 2,
          cur.y + cur.h / 2,
          '#bde8ff',
          5
        );
        hitE(cur, wdmg() * 0.34, { col: '#bde8ff', stun: 0.12, sourceMod: w.mod, sourceDam: wdmg() * 0.34 });
        cur = nx;
      }
    }
    if (w.mod === 'weatheradmin')
      for (let i = 0; i < 2 + Math.floor(q / 2); i++)
        P.push({
          k: 'lightning',
          x: rand(80, W - 80),
          y: 0,
          targetY: G - 25,
          dam: wdmg() * 0.6,
          r: 85 * ao,
          life: rand(0.15, 0.4),
          col: '#bce8ff',
          mod: w.mod,
          rar: w.rar,
          wp: w.p,
          sourceType: w.type,
          cc,
          size: ao
        });
  }
  function hammer(w) {
    let dir = attackDir(w),
      q = rarityRank(w),
      ao = weaponAoe(w),
      r = (72 + q * 12) * ao,
      hb = { x: dir > 0 ? pl.x + pl.w - 6 : pl.x - r, y: pl.y - 10, w: r, h: 74 * Math.min(1.6, ao) };
    for (const e of E) {
      if (e.dead || !rect(hb, e)) continue;
      let cr = crit(e, 0.03),
        base = wdmg() * 1.42;
      hitE(e, base * (cr ? 1.9 : 1), {
        crit: cr,
        col: w.col,
        knock: dir * (430 + q * 75),
        stun: 0.4 + q * 0.05,
        sourceMod: w.mod,
        sourceDam: base
      });
      if (w.mod === 'argument' && !e.dead) {
        e.vy = -560;
        e.on = false;
        F.push({
          k: 'argument',
          target: e,
          x: e.x + e.w / 2,
          y: e.y + e.h / 2,
          dam: wdmg() * 0.9,
          life: 0.34,
          max: 0.34,
          col: w.col
        });
      }
    }
    ring(pl.x + dir * 45, G - 6, w.col, (110 + q * 24) * ao, 7);
    shake = Math.max(shake, 7 + q * 2);
    if (w.mod === 'godbreaker' || w.mod === 'continental') {
      boom(pl.x + dir * 60, G - 8, w.col, (170 + q * 18) * ao, 1 + q * 0.1);
      for (const e of E) {
        if (!e.dead && Math.abs(e.x - pl.x) < (220 + q * 18) * ao)
          hitE(e, wdmg() * (w.mod === 'continental' ? 1.1 : 0.55), {
            col: w.col,
            knock: Math.sign(e.x - pl.x) * (500 + q * 45),
            stun: 0.55 + q * 0.04,
            sourceMod: w.mod,
            sourceDam: wdmg() * 0.7
          });
      }
    }
  }
  function dagger(w) {
    let dir = attackDir(w),
      ao = weaponAoe(w),
      r = 58 * ao,
      hb = { x: dir > 0 ? pl.x + pl.w - 4 : pl.x - r, y: pl.y - 5, w: r, h: 58 },
      mult = 0.78;
    for (const e of E) {
      if (e.dead || e.state === 'spawn' || !rect(hb, e)) continue;
      let cr = crit(e, 0.04),
        base = wdmg() * mult;
      hitE(e, base * (cr ? 2.05 : 1), {
        crit: cr,
        col: cr ? '#fff18a' : w.col,
        knock: dir * 150,
        stun: 0.08,
        sourceMod: w.mod,
        sourceDam: base
      });
      if (cr && w.mod === 'blooddance') {
        let n = near(e.x, e);
        if (n) {
          beam(e.x, e.y, n.x, n.y, w.col, 4);
          hitE(n, base * 0.72, { col: w.col, stun: 0.08, sourceMod: w.mod, sourceDam: base });
        }
      }
    }
    if (w.mod === 'mirrorflurry' && pl.combo % 4 === 0) {
      for (let i = 0; i < 4; i++) {
        let t = E.filter(e => !e.dead)[i];
        if (t)
          P.push({
            k: 'spectral',
            x: pl.x + 17,
            y: pl.y + 18,
            vx: 0,
            vy: 0,
            target: t,
            dam: wdmg() * 0.42,
            life: 1.1,
            col: w.col,
            mod: w.mod,
            rar: w.rar,
            wp: w.p,
            sourceType: w.type,
            cc: cchance()
          });
      }
    }
    if (w.mod === 'knifegod' && pl.combo % 3 === 0) {
      for (const t of E.filter(e => !e.dead).slice(0, 8))
        P.push({
          k: 'spectral',
          x: rand(80, W - 80),
          y: rand(120, 420),
          vx: 0,
          vy: 0,
          target: t,
          dam: wdmg() * 0.58,
          life: 1.5,
          col: w.col,
          mod: w.mod,
          rar: w.rar,
          wp: w.p,
          sourceType: w.type,
          cc: cchance()
        });
    }
  }
  function baseProceduralProc(w) {
    let ao = weaponAoe(w),
      nearby = E.filter(e => !e.dead).sort((a, b) => Math.abs(a.x - pl.x) - Math.abs(b.x - pl.x));
    if (hasTrait(w, 'asthma')) {
      pl.mana = Math.max(0, pl.mana - 3);
      if (pl.combo % 9 === 0) txt(pl.x + 17, pl.y - 35, 'WHEEZE', '#d7f5ff', false);
    }
    if (hasTrait(w, 'rhythmic') && pl.combo % 4 === 0) {
      ring(pl.x + 17, pl.y + 20, w.col, 130 * ao, 5);
      for (const e of nearby.slice(0, 5))
        hitE(e, wdmg() * 0.34, { col: w.col, stun: 0.12, sourceMod: w.mod, sourceDam: wdmg() * 0.34 });
    }
    if (hasTrait(w, 'hex') && pl.combo % 3 === 0) {
      for (const e of nearby.slice(0, 4)) {
        beam(pl.x + 17, pl.y + 18, e.x + e.w / 2, e.y + e.h / 2, '#b16cff', 3);
        hitE(e, wdmg() * 0.26, { col: '#c88aff', stun: 0.08, sourceMod: w.mod, sourceDam: wdmg() * 0.26 });
      }
    }
    if (hasTrait(w, 'recursive') && pl.combo % 5 === 0) {
      for (const e of nearby.slice(0, 3))
        P.push({
          k: 'spectral',
          x: pl.x + 17,
          y: pl.y + 18,
          vx: 0,
          vy: 0,
          target: e,
          dam: wdmg() * 0.38,
          life: 1.2,
          col: w.col,
          mod: w.mod,
          rar: w.rar,
          wp: w.p,
          sourceType: w.type,
          cc: cchance()
        });
    }
    if (hasTrait(w, 'sentient') && pl.combo % 6 === 0) {
      let t = nearby[0];
      if (t)
        P.push({
          k: 'orb',
          x: pl.x + 17,
          y: pl.y - 5,
          vx: 0,
          vy: -80,
          target: t,
          dam: wdmg() * 0.55,
          pier: 0,
          life: 1.5,
          hit: new Set(),
          col: w.col,
          split: 0,
          r: 0,
          mod: w.mod,
          rar: w.rar,
          wp: w.p,
          sourceType: w.type,
          cc: cchance()
        });
    }
    if (hasTrait(w, 'unstable') && Math.random() < 0.13) {
      let t = nearby[0];
      if (t) {
        boom(t.x + t.w / 2, t.y + t.h / 2, w.col, 105 * ao, 1);
        for (const e of nearby.slice(0, 4))
          if (Math.hypot(e.x - t.x, e.y - t.y) < 120 * ao)
            hitE(e, wdmg() * 0.45, {
              col: w.col,
              knock: Math.sign(e.x - t.x) * 220,
              stun: 0.18,
              sourceMod: w.mod,
              sourceDam: wdmg() * 0.45
            });
      }
    }
    if (hasTrait(w, 'moist') && pl.combo % 4 === 0) {
      let t = nearby[0];
      if (t) {
        ring(t.x + t.w / 2, t.y + t.h / 2, '#72d9ff', 95 * ao, 4);
        for (const e of nearby.slice(0, 4))
          if (Math.hypot(e.x - t.x, e.y - t.y) < 100 * ao)
            hitE(e, wdmg() * 0.23, {
              col: '#72d9ff',
              stun: 0.06,
              sourceMod: w.mod,
              sourceDam: wdmg() * 0.23
            });
      }
    }
    if (w.material && !hasTrait(w, 'pure')) {
      let m = w.material.code,
        t = nearby[0];
      if (m === 'diamond' && pl.combo % 3 === 0 && t) {
        for (const e of nearby.slice(0, 3)) {
          beam(t.x, t.y, e.x, e.y, '#a9ffff', 3);
          hitE(e, wdmg() * 0.24, { col: '#a9ffff', stun: 0.05, sourceMod: w.mod, sourceDam: wdmg() * 0.24 });
        }
      }
      if (m === 'obsidian' && pl.combo % 5 === 0) {
        for (const e of nearby.slice(0, 3))
          P.push({
            k: 'spectral',
            x: pl.x + 17,
            y: pl.y + 18,
            vx: 0,
            vy: 0,
            target: e,
            dam: wdmg() * 0.32,
            life: 1.1,
            col: '#7c63a8',
            mod: w.mod,
            rar: w.rar,
            wp: w.p,
            sourceType: w.type,
            cc: cchance()
          });
      }
      if (m === 'void' && pl.combo % 4 === 0 && t)
        F.push({
          k: 'vortex',
          x: t.x + t.w / 2,
          y: t.y + t.h / 2,
          life: 1.5,
          max: 1.5,
          pow: 0.85,
          dam: wdmg()
        });
      if (m === 'nuclear' && Math.random() < 0.09 && t) {
        boom(t.x + t.w / 2, t.y + t.h / 2, '#b6ff54', 135 * ao, 1.1);
        for (const e of nearby.slice(0, 5))
          if (Math.hypot(e.x - t.x, e.y - t.y) < 145 * ao)
            hitE(e, wdmg() * 0.5, {
              col: '#d5ff78',
              knock: Math.sign(e.x - t.x) * 260,
              stun: 0.2,
              sourceMod: w.mod,
              sourceDam: wdmg() * 0.5
            });
      }
      if (m === 'frozen' && Math.random() < 0.22 && t) {
        t.stun = Math.max(t.stun, 0.6);
        ring(t.x + t.w / 2, t.y + t.h / 2, '#9ee8ff', 45, 3);
      }
      if (m === 'rubber' && pl.combo % 3 === 0 && t) {
        let n = near(t.x, t);
        if (n)
          P.push({
            k: 'spectral',
            x: t.x,
            y: t.y,
            vx: 0,
            vy: 0,
            target: n,
            dam: wdmg() * 0.34,
            life: 1.1,
            col: '#f4ff74',
            mod: w.mod,
            rar: w.rar,
            wp: w.p,
            sourceType: w.type,
            cc: cchance()
          });
      }
      if (m === 'living' && pl.combo % 5 === 0) {
        for (const e of nearby.slice(0, 2))
          P.push({
            k: 'orb',
            x: pl.x + 17,
            y: pl.y - 12,
            vx: rand(-80, 80),
            vy: -100,
            target: e,
            dam: wdmg() * 0.4,
            pier: 0,
            life: 1.5,
            hit: new Set(),
            col: '#ff7e9f',
            split: 0,
            r: 0,
            mod: w.mod,
            rar: w.rar,
            wp: w.p,
            sourceType: w.type,
            cc: cchance()
          });
      }
      if (m === 'plasma' && pl.combo % 3 === 0 && t) {
        ring(t.x + t.w / 2, t.y + t.h / 2, '#68e8ff', 80 * ao, 3);
        for (const e of nearby.slice(0, 3))
          if (Math.hypot(e.x - t.x, e.y - t.y) < 90 * ao)
            hitE(e, wdmg() * 0.2, { col: '#68e8ff', stun: 0.06, sourceMod: w.mod, sourceDam: wdmg() * 0.2 });
      }
    }
  }
  function weirdTraitProc(w) {
    let nearby = E.filter(e => !e.dead).sort((a, b) => Math.abs(a.x - pl.x) - Math.abs(b.x - pl.x)),
      ao = weaponAoe(w);
    if (hasTrait(w, 'goose') && pl.combo % 6 === 0 && nearby.length) {
      let t = nearby[nearby.length - 1];
      txt(pl.x + 17, pl.y - 34, 'HONK', '#fff176', false);
      P.push({
        k: 'spectral',
        x: pl.x + 17,
        y: pl.y + 15,
        vx: -pl.dir * 220,
        vy: -60,
        target: t,
        dam: wdmg() * 0.45,
        life: 1.3,
        col: '#ffffff',
        mod: w.mod,
        rar: w.rar,
        wp: w.p,
        sourceType: w.type,
        cc: cchance()
      });
    }
    if (hasTrait(w, 'microwaved') && pl.combo % 5 === 0 && nearby[0]) {
      let t = nearby[0];
      boom(t.x + t.w / 2, t.y + t.h / 2, '#79efff', 105 * ao, 0.6);
      hitE(t, wdmg() * 0.32, { col: '#79efff', stun: 0.12, sourceMod: w.mod, sourceDam: wdmg() * 0.32 });
    }
    if (hasTrait(w, 'loud') && pl.combo % 5 === 0) {
      ring(pl.x + 17, pl.y + 20, '#fff176', 155 * ao, 6);
      for (const e of nearby.slice(0, 5))
        if (Math.abs(e.x - pl.x) < 170 * ao)
          hitE(e, wdmg() * 0.22, {
            col: '#fff176',
            knock: Math.sign(e.x - pl.x) * 220,
            stun: 0.12,
            sourceMod: w.mod,
            sourceDam: wdmg() * 0.22
          });
    }
    if (hasTrait(w, 'backwards') && pl.combo % 4 === 0 && nearby.length) {
      let t = nearby[nearby.length - 1];
      P.push({
        k: 'spectral',
        x: pl.x + 17,
        y: pl.y + 18,
        vx: -pl.dir * 300,
        vy: 0,
        target: t,
        dam: wdmg() * 0.38,
        life: 1.2,
        col: w.col,
        mod: w.mod,
        rar: w.rar,
        wp: w.p,
        sourceType: w.type,
        cc: cchance()
      });
    }
    if (hasTrait(w, 'assbackwards')) {
      part(pl.x + 17 - pl.dir * 18, pl.y + 30, '#ff9e70', 4, 80, 4);
      if (pl.combo % 4 === 0) txt(pl.x + 17, pl.y - 30, 'REAR MUNITIONS', '#ffb07a', false);
    }
    if (hasTrait(w, 'explosive') && pl.combo % 3 === 0 && nearby[0]) {
      let t = nearby[0];
      boom(t.x + t.w / 2, t.y + t.h / 2, '#ff7d37', 125 * ao, 0.85);
      for (const e of nearby.slice(0, 5))
        if (Math.hypot(e.x - t.x, e.y - t.y) < 140 * ao)
          hitE(e, wdmg() * 0.26, {
            col: '#ff9a54',
            knock: Math.sign(e.x - t.x) * 360,
            stun: 0.18,
            sourceType: w.type,
            sourceMod: w.mod,
            sourceDam: wdmg() * 0.26
          });
    }
    if (hasTrait(w, 'gravitywrong') && nearby[0]) {
      let t = nearby[0];
      if (pl.combo % 2 === 0 && !t.boss) {
        t.vy = pl.combo % 4 === 0 ? 420 : -480;
        t.on = false;
        t.recoilT = Math.max(t.recoilT || 0, 0.22);
        txt(
          t.x + t.w / 2,
          t.y - 18,
          pl.combo % 4 === 0 ? 'WRONG WAY DOWN' : 'WRONG WAY UP',
          '#caa0ff',
          false
        );
      }
    }
    if (hasTrait(w, 'magnetic') && pl.combo % 3 === 0) {
      for (const e of nearby.slice(0, 5)) {
        let dx = pl.x + pl.w / 2 - (e.x + e.w / 2);
        e.vx += Math.sign(dx) * 260;
        e.stun = Math.max(e.stun, 0.08);
      }
      ring(pl.x + 17, pl.y + 20, '#7cecff', 120 * ao, 4);
    }
    if (hasTrait(w, 'haunted') && pl.combo % 5 === 0 && nearby.length) {
      for (const t of nearby.slice(0, Math.min(3, 1 + Math.floor(rarityRank(w) / 4)))) {
        P.push({
          k: 'spectral',
          x: t.x + rand(-100, 100),
          y: t.y - rand(50, 140),
          vx: 0,
          vy: 0,
          target: t,
          dam: wdmg() * 0.34,
          life: 1.4,
          col: '#d5ddff',
          mod: w.mod,
          rar: w.rar,
          wp: w.p,
          sourceType: w.type,
          cc: cchance()
        });
      }
      txt(pl.x + 17, pl.y - 36, 'GHOST SHIFT ON THE ROSTER', '#d5ddff', false);
    }
    if (hasTrait(w, 'jazzhands') && pl.combo % 5 === 0) {
      for (let i = 0; i < 8; i++) {
        let a = (i * Math.PI) / 4;
        P.push({
          k: 'arrow',
          x: pl.x + 17,
          y: pl.y + 18,
          vx: Math.cos(a) * 520,
          vy: Math.sin(a) * 520,
          dam: wdmg() * 0.16,
          pier: 0,
          life: 1.1,
          hit: new Set(),
          col: `hsl(${(time * 160 + i * 45) % 360} 100% 70%)`,
          mod: w.mod,
          rar: w.rar,
          wp: w.p,
          sourceType: w.type,
          cc: cchance()
        });
      }
      txt(pl.x + 17, pl.y - 38, 'JAZZ HANDS!', '#fff176', false);
    }
    if (hasTrait(w, 'recoil')) {
      pl.vx -= attackDir(w) * 95;
      if (pl.on && pl.combo % 3 === 0) pl.vy = -70;
    }
    if (hasTrait(w, 'bouncy') && pl.combo % 3 === 0 && nearby.length) {
      for (const e of nearby.slice(0, 3)) {
        e.vy = -260;
        e.vx += Math.sign(e.x - pl.x) * 220;
        e.on = false;
        e.recoilT = Math.max(e.recoilT || 0, 0.18);
      }
      txt(pl.x + 17, pl.y - 34, 'BOING', '#f4ff71', false);
    }
  }
  function boonAttackProc(w) {
    if (pl.boonPocket && pl.combo % 8 === 0) {
      ring(pl.x + 17, pl.y + 20, '#e8d18a', 145, 5);
      for (const e of E) if (!e.dead && Math.abs(e.x - pl.x) < 160) e.stun = Math.max(e.stun, 0.75);
      txt(pl.x + 17, pl.y - 35, 'POCKET SAND', '#fff0a0', false);
    }
    if (pl.boonIntern && pl.combo % 6 === 0) {
      let t = near(pl.x);
      if (t)
        P.push({
          k: 'spectral',
          x: pl.x + 17,
          y: pl.y + 10,
          vx: 0,
          vy: -60,
          target: t,
          dam: wdmg() * 0.38,
          life: 1.3,
          col: '#9eefff',
          mod: w.mod,
          rar: w.rar,
          wp: w.p,
          sourceType: w.type,
          cc: cchance()
        });
    }
    if (pl.boonScream && pl.combo % 5 === 0) {
      ring(pl.x + 17, pl.y + 20, '#ff8be8', 165, 7);
      for (const e of E)
        if (!e.dead && Math.abs(e.x - pl.x) < 175)
          hitE(e, wdmg() * 0.24, {
            col: '#ff8be8',
            knock: Math.sign(e.x - pl.x) * 260,
            stun: 0.16,
            sourceMod: w.mod,
            sourceDam: wdmg() * 0.24
          });
      txt(pl.x + 17, pl.y - 35, 'AAAAAA', '#ffb4ef', false);
    }
  }
  function nova(w) {
    let ao = weaponAoe(w),
      r = 125 * ao;
    ring(pl.x + 17, pl.y + 22, w.col, r, 5);
    part(pl.x + 17, pl.y + 22, w.col, 14, 230, 6);
    for (const e of E) {
      if (e.dead) continue;
      let dx = e.x - pl.x,
        dy = e.y - pl.y;
      if (dx * dx + dy * dy < r * r)
        hitE(e, wdmg() * 0.46, {
          col: w.col,
          knock: Math.sign(dx || 1) * 180,
          stun: 0.18,
          sourceMod: w.mod,
          sourceDam: wdmg() * 0.46
        });
    }
  }
  function metaTraitProc(w, nearby) {
    let t = nearby[0],
      d = wdmg();
    if (hasTrait(w, 'quantum') && pl.combo % 6 === 0 && t) {
      txt(pl.x + 17, pl.y - 48, 'CAUSALITY DUPLICATED', w.col, false);
      P.push({
        k: 'spectral',
        x: pl.x + 17,
        y: pl.y + 18,
        vx: 0,
        vy: 0,
        target: t,
        dam: d * 0.55,
        life: 1.15,
        col: w.col,
        mod: w.mod,
        rar: w.rar,
        wp: w.p,
        sourceType: w.type,
        cc: cchance()
      });
    }
    if (hasTrait(w, 'iexplorer') && pl.combo % 5 === 0 && t) {
      txt(t.x + t.w / 2, t.y - 42, 'PLEASE WAIT...', '#7ec8ff', false);
      F.push({
        k: 'argument',
        x: t.x + t.w / 2,
        y: t.y + t.h / 2,
        target: t,
        dam: d * 0.9,
        life: 0.72,
        max: 0.72,
        col: '#63a9ff'
      });
    }
    if (hasTrait(w, 'tuesday') && pl.combo % 7 === 0) {
      txt(pl.x + 17, pl.y - 48, 'APPARENTLY IT IS TUESDAY', '#ffd97a', false);
      fire(w.type === 'bow' || w.type === 'shuriken' ? 'arrow' : 'spectral', d * 0.62, {
        dir: -attackDir(w),
        sp: 780,
        pier: 2,
        col: '#ffd97a',
        life: 1.4,
        mod: w.mod,
        sourceType: w.type
      });
    }
    if (hasTrait(w, 'sponsored') && pl.combo % 8 === 0 && t) {
      txt(t.x + t.w / 2, t.y - 44, 'THIS HIT BROUGHT TO YOU BY...', '#fff176', true);
      boom(t.x + t.w / 2, t.y + t.h / 2, '#fff176', 110, 1);
      for (const e of nearby.slice(0, 4))
        if (Math.hypot(e.x - t.x, e.y - t.y) < 125)
          hitE(e, d * 0.3, { col: '#fff176', stun: 0.1, sourceType: w.type });
    }
    if (hasTrait(w, 'timezone') && pl.combo % 6 === 0 && t) {
      txt(t.x + t.w / 2, t.y - 44, 'ARRIVED YESTERDAY', '#a9d8ff', false);
      P.push({
        k: 'spectral',
        x: clamp(t.x - t.dir * 110, 20, W - 20),
        y: t.y + t.h * 0.4,
        vx: 0,
        vy: 0,
        target: t,
        dam: d * 0.58,
        life: 0.85,
        col: '#a9d8ff',
        mod: w.mod,
        rar: w.rar,
        wp: w.p,
        sourceType: w.type,
        cc: cchance()
      });
    }
    if (hasTrait(w, 'boat') && pl.combo % 4 === 0) {
      let y = G - 12;
      ring(pl.x + 17, y, '#6eeaff', 95, 4);
      for (const e of nearby.slice(0, 4))
        if (Math.abs(e.x - pl.x) < 150) {
          e.vx += Math.sign(e.x - pl.x || 1) * 270;
          hitE(e, d * 0.18, { col: '#6eeaff', stun: 0.06, sourceType: w.type });
        }
    }
  }
  function proceduralProc(w) {
    baseProceduralProc(w);
    let q = rarityRank(w),
      nearby = E.filter(e => !e.dead && e.state !== 'spawn');
    synergyProc(w, nearby);
    metaTraitProc(w, nearby);
    if (q >= 6 && pl.combo % 7 === 0) {
      txt(pl.x + 17, pl.y - 42, 'WEAPON DEVELOPED AN OPINION', w.col, true);
      let t = nearby.length ? pick(nearby) : null;
      if (t) {
        beam(pl.x + 17, pl.y, t.x + t.w / 2, t.y + t.h / 2, w.col, 5);
        hitE(t, wdmg() * 0.72, {
          col: w.col,
          knock: Math.sign(t.x - pl.x) * 250,
          stun: 0.2,
          sourceMod: w.mod,
          sourceDam: wdmg() * 0.72
        });
      }
    }
    if (q >= 7 && pl.combo % 5 === 0 && nearby.length) {
      let t = pick(nearby);
      boom(t.x + t.w / 2, t.y + t.h / 2, w.col, 135 + q * 9, 1);
      txt(t.x, t.y - 35, 'GUILD-SAFETY VIOLATION', w.col, false);
    }
    if (q >= 8 && pl.combo % 4 === 0) {
      for (const e of nearby.slice(0, Math.min(5, q - 2))) {
        beam(e.x + e.w / 2, 0, e.x + e.w / 2, e.y + e.h / 2, '#ffffff', 3 + q * 0.3);
        hitE(e, wdmg() * 0.42, { col: '#ffffff', stun: 0.14, sourceMod: w.mod, sourceDam: wdmg() * 0.42 });
      }
    }
    if (q >= 9 && pl.combo % 3 === 0) {
      let tax = Math.max(1, Math.round(pl.max * 0.006));
      pl.hp = Math.max(1, pl.hp - tax);
      txt(pl.x + 17, pl.y - 45, 'FORBIDDEN RECOIL -' + tax, '#ff4768');
      for (const e of nearby.slice(0, 7))
        hitE(e, wdmg() * 0.38, {
          col: w.col,
          knock: Math.sign(e.x - pl.x) * 190,
          stun: 0.12,
          sourceMod: w.mod,
          sourceDam: wdmg() * 0.38
        });
    }
    if (q >= 10 && pl.combo % 2 === 0 && nearby.length) {
      txt(W / 2, 160, 'REALITY HAS FILED A COMPLAINT', '#ffffff', true);
      stop = Math.max(stop, 0.08);
      for (const e of [...nearby])
        hitE(e, wdmg() * 0.58, {
          col: '#ffffff',
          knock: Math.sign(e.x - pl.x) * 320,
          stun: 0.24,
          sourceMod: w.mod,
          sourceDam: wdmg() * 0.58
        });
    }
  }
  function attack() {
    if (paused || over || deathOfferOpen || shardForgeOpen || zoneT > 0) return;
    let w = curW();
    if (pl.acd > 0) return;
    pl.acd = heldAttackCooldown(w);
    pl.atMax =
      w.type === 'hammer'
        ? 0.4
        : w.type === 'staff'
          ? 0.34
          : w.type === 'sword'
            ? 0.3
            : w.type === 'katana'
              ? 0.28
              : w.type === 'dagger'
                ? 0.18
                : w.type === 'nunchucks'
                  ? 0.16
                  : w.type === 'shuriken'
                    ? 0.18
                    : 0.25;
    pl.at = pl.atMax;
    pl.combo++;
    sfxAttack(w);
    attackMotion(w);
    if (w.type === 'sword') sword(w);
    else if (w.type === 'dagger') dagger(w);
    else if (w.type === 'nunchucks') nunchucks(w);
    else if (w.type === 'katana') katana(w);
    else if (w.type === 'bow') bow(w);
    else if (w.type === 'shuriken') shuriken(w);
    else if (w.type === 'wand') wand(w);
    else if (w.type === 'staff') staff(w);
    else hammer(w);
    if (w.mod === 'nova' && pl.combo % 3 === 0) nova(w);
    proceduralProc(w);
    weirdTraitProc(w);
    boonAttackProc(w);
    mirrorAugmentProc(w);
  }
  function skill() {
    if (paused || over || deathOfferOpen || shardForgeOpen || zoneT > 0) return;
    let w = curW();
    let cost = Math.round((pl.skillCost || 25) * augmentVal('skillCost', 1));
    if (pl.scd > 0 || pl.mana < cost) return;
    pl.mana -= cost;
    pl.scd = Math.max(0.42, (2.2 - rarityRank(w) * 0.06) * augmentVal('skillCd', 1));
    sfxSkill(w);
    skillMotion(w);
    let ao = weaponAoe(w),
      q = rarityRank(w);
    if (w.type === 'sword') {
      pl.inv = 0.35;
      pl.vx = pl.dir * 760;
      ring(pl.x + 17, pl.y + 20, w.col, 140 * ao, 5);
      for (const e of E)
        if (!e.dead && Math.abs(e.x - pl.x) < 230 * ao) {
          let c = crit(e, 0.1);
          hitE(e, wdmg() * 1.65 * (c ? 1.85 : 1), {
            crit: c,
            col: w.col,
            knock: pl.dir * 520,
            stun: 0.45,
            sourceMod: w.mod,
            sourceDam: wdmg() * 1.65
          });
        }
      if (q >= 5)
        for (const e of E)
          if (!e.dead)
            hitE(e, wdmg() * (0.55 + q * 0.06), {
              col: w.col,
              knock: Math.sign(e.x - pl.x) * 300,
              stun: 0.2,
              sourceMod: w.mod,
              sourceDam: wdmg() * 0.7
            });
    } else if (w.type === 'dagger') {
      pl.inv = 0.45;
      let targets = E.filter(e => !e.dead)
        .sort((a, b) => Math.abs(a.x - pl.x) - Math.abs(b.x - pl.x))
        .slice(0, Math.min(12, 5 + q));
      for (let i = 0; i < targets.length; i++) {
        let e = targets[i];
        beam(pl.x + 17, pl.y + 18, e.x + e.w / 2, e.y + e.h / 2, w.col, 3 + q * 0.25);
        let c = crit(e, 0.12);
        hitE(e, wdmg() * 0.72 * (c ? 2 : 1), {
          crit: c,
          col: w.col,
          knock: Math.sign(e.x - pl.x) * 120,
          stun: 0.14,
          sourceMod: w.mod,
          sourceDam: wdmg() * 0.72
        });
      }
      ring(pl.x + 17, pl.y + 20, w.col, 110 * ao, 5);
    } else if (w.type === 'nunchucks') {
      pl.inv = 0.35;
      ring(pl.x + 17, pl.y + 20, w.col, 145 * ao, 6);
      for (let spin = 0; spin < 5; spin++) {
        for (const e of E)
          if (!e.dead && Math.hypot(e.x + e.w / 2 - (pl.x + 17), e.y + e.h / 2 - (pl.y + 20)) < 165 * ao) {
            let c = crit(e, 0.04);
            hitE(e, wdmg() * 0.34 * (c ? 1.85 : 1), {
              crit: c,
              col: w.col,
              knock: Math.sign(e.x - pl.x) * (120 + spin * 25),
              stun: 0.08,
              sourceMod: w.mod,
              sourceDam: wdmg() * 0.34,
              sourceType: w.type
            });
          }
      }
      txt(pl.x + 17, pl.y - 40, 'CHAIN TORNADO', w.col, true);
    } else if (w.type === 'katana') {
      pl.inv = 0.48;
      let dir = attackDir(w),
        sx = pl.x;
      pl.x = clamp(pl.x + dir * (260 + q * 10), 0, W - pl.w);
      beam(sx + 17, pl.y + 20, pl.x + 17, pl.y + 20, w.col, 7);
      for (const e of E)
        if (
          !e.dead &&
          Math.abs(e.y + e.h / 2 - (pl.y + 20)) < 100 &&
          ((dir > 0 && e.x > sx - 20 && e.x < pl.x + 80) || (dir < 0 && e.x < sx + 40 && e.x > pl.x - 80))
        ) {
          let c = crit(e, 0.25);
          hitE(e, wdmg() * 1.5 * (c ? 2.2 : 1), {
            crit: c,
            col: w.col,
            knock: dir * 600,
            stun: 0.5,
            sourceMod: w.mod,
            sourceDam: wdmg() * 1.5,
            sourceType: w.type
          });
        }
      txt(pl.x + 17, pl.y - 42, 'I HAVE ALREADY SHEATHED IT', w.col, true);
    } else if (w.type === 'shuriken') {
      for (let i = 0; i < 14 + Math.min(10, q); i++) {
        let a = (i * Math.PI * 2) / (14 + Math.min(10, q));
        P.push({
          k: 'shuriken',
          x: pl.x + 17,
          y: pl.y + 18,
          vx: Math.cos(a) * 720,
          vy: Math.sin(a) * 720,
          dam: wdmg() * 0.44,
          pier: 2,
          life: 2,
          hit: new Set(),
          col: i % 2 ? w.col : '#fff',
          mod: w.mod,
          rar: w.rar,
          wp: w.p,
          sourceType: w.type,
          cc: cchance(),
          size: ao,
          bounces: 2
        });
      }
      txt(pl.x + 17, pl.y - 42, 'NINJA ACCOUNTING', w.col, true);
    } else if (w.type === 'bow') {
      for (let i = -4; i <= 4; i++) {
        let a = bowAim(i * 0.075);
        P.push({
          k: 'arrow',
          x: pl.x + 17,
          y: pl.y + 17,
          vx: Math.cos(a) * 900 * pl.dir,
          vy: Math.sin(a) * 900,
          dam: wdmg() * 0.62,
          pier: 2 + Math.floor(q / 4),
          life: 2,
          hit: new Set(),
          col: w.col,
          mod: w.mod,
          rar: w.rar,
          wp: w.p,
          sourceType: w.type,
          cc: cchance(),
          size: ao
        });
      }
      if (q >= 4)
        for (let i = 0; i < Math.min(14, 5 + q); i++)
          P.push({
            k: 'star',
            x: rand(70, W - 70),
            y: -60,
            targetY: rand(280, G - 20),
            dam: wdmg() * 0.95,
            r: 80 * ao,
            life: rand(0.2, 0.6),
            col: '#ffe8a3',
            mod: w.mod,
            rar: w.rar,
            wp: w.p,
            sourceType: w.type,
            cc: cchance(),
            size: ao
          });
    } else if (w.type === 'wand') {
      let cur = near(pl.x);
      for (let i = 0; i < Math.min(15, 5 + q) && cur; i++) {
        let nx = near(cur.x, cur);
        hitE(cur, wdmg() * 0.8, { col: w.col, stun: 0.12, sourceMod: w.mod, sourceDam: wdmg() * 0.8 });
        if (nx) beam(cur.x, cur.y, nx.x, nx.y, w.col, 5);
        cur = nx;
      }
      ring(pl.x + 17, pl.y + 20, w.col, 170 * ao, 5);
    } else if (w.type === 'staff') {
      let n = Math.min(15, 5 + q);
      for (let i = 0; i < n; i++)
        P.push({
          k: i % 2 ? 'lightning' : 'meteor',
          x: rand(60, W - 60),
          y: -70,
          targetY: rand(250, G - 20),
          dam: wdmg() * 0.82,
          r: (82 + q * 5) * ao,
          life: rand(0.18, 0.65),
          col: i % 2 ? '#bde8ff' : '#ff9b66',
          mod: w.mod,
          rar: w.rar,
          wp: w.p,
          sourceType: w.type,
          cc: cchance(),
          size: ao
        });
    } else {
      boom(pl.x + 17, G - 5, w.col, (180 + q * 26) * ao, 1 + q * 0.1);
      for (const e of E)
        if (!e.dead && Math.abs(e.x - pl.x) < (260 + q * 22) * ao) {
          let c = crit(e, 0.08);
          hitE(e, wdmg() * 1.7 * (c ? 1.85 : 1), {
            crit: c,
            col: w.col,
            knock: Math.sign(e.x - pl.x) * (800 + q * 35),
            stun: 0.9,
            sourceMod: w.mod,
            sourceDam: wdmg() * 1.7
          });
        }
    }
    proceduralProc(w);
  }
  function jump() {
    if (!paused && !over && !deathOfferOpen && !shardForgeOpen && pl.on && zoneT <= 0) {
      audioInit();
      sfxJump();
      pl.vy = -520;
      pl.on = false;
      part(pl.x + 17, pl.y + pl.h, '#b9c7d7', 5, 70, 4);
    }
  }
  function drop() {
    pl.y += 15;
    pl.vy = 100;
    pl.on = false;
  }
  function dash() {
    if (paused || over || deathOfferOpen || shardForgeOpen || zoneT > 0 || pl.dcd > 0) return;
    sfxDash();
    let air = !pl.on;
    pl.dcd = 0.72 * (pl.dashMult || 1) * augmentVal('dash', 1);
    pl.dashT = air ? 0.17 : 0.15;
    pl.dashDir = pl.dir || 1;
    pl.dashAir = air;
    pl.inv = 0.24 + (pl.boonDad ? 0.12 : 0) + (pl.boonDash ? 0.08 : 0);
    pl.vx = pl.dashDir * (air ? 1120 : 1240);
    if (air) {
      pl.vy *= 0.72;
      if (pl.vy > 130) pl.vy = 130;
    } else pl.vy = Math.min(pl.vy, 0);
    part(pl.x + 17, pl.y + 22, '#c5d2e0', 14, 220, 5);
    ring(pl.x + 17, pl.y + 24, curW().col, 46, 3);
    for (let i = 0; i < 6; i++)
      F.push({
        k: 'ghost',
        x: pl.x + 17 - pl.dashDir * i * 17,
        y: pl.y + 25,
        dir: pl.dashDir,
        life: 0.2 + i * 0.025,
        max: 0.2 + i * 0.025,
        col: curW().col,
        sc: 1
      });
    txt(pl.x + 17, pl.y - 18, air ? 'AIR DASH' : 'DASH', curW().col, false);
  }
  function hurt(a, e) {
    if (pl.inv > 0 || over || deathOfferOpen) return;
    sfxHurt();
    let brawlerGuard = isMeleeWeapon(curW()) ? 0.84 : 1,
      h = Math.max(1, Math.round(((a * 100) / (100 + pl.armor)) * (pl.damageTaken || 1) * brawlerGuard));
    if (pl.hp - h <= 0 && pl.warranty > 0 && bossMode) {
      pl.warranty--;
      pl.hp = 1;
      pl.inv = 2;
      txt(pl.x + 17, pl.y - 40, 'BLESSING CLAIM APPROVED', '#fff176', true);
      return;
    }
    pl.hp -= h;
    pl.inv = 0.5;
    pl.vx += (pl.x < e.x ? -1 : 1) * 280;
    pl.vy = -180;
    txt(pl.x, pl.y - 10, '-' + h, '#ff707d', true);
    shake = 8;
    if (pl.hp <= 0) {
      pl.hp = 0;
      if (bossMode && !bossRescueUsed && openDeathOffer(bossMode)) return;
      if (bossMode) {
        let be = E.find(x => x.boss && !x.dead);
        if (be && !be.outcomeRecorded) {
          be.outcomeRecorded = true;
          bossRecord(be.boss, false);
        }
      }
      over = true;
      U.msg.textContent = 'Run ended. The creatures finally got a vote.';
    }
  }
  function nextZone() {
    if (bossMode || boonChoosing) return;
    let target = Z[zoneI]?.boss;
    if (target && !bossFlags[target]) {
      startBoss(target);
      return;
    }
    if (zoneI < Z.length - 1) advanceZone();
    else {
      riftReady = false;
      riftEnterT = 0;
      stageClears = 0;
      master = 0;
      packLive = false;
      packDelay = 0.8;
      U.msg.textContent =
        'SIX BOSSES DOWN. The Sentient Armory has become an endless irresponsible weapon farm.';
    }
  }
  function resolve(o, py) {
    let was = o.on,
      fall = o.vy;
    o.on = false;
    if (o.y + o.h >= G && o.vy >= 0) {
      o.y = G - o.h;
      o.vy = 0;
      o.on = true;
    }
    for (const p of platforms)
      if (
        !p.disabled &&
        o.x + o.w > p.x &&
        o.x < p.x + p.w &&
        py + o.h <= p.y + 4 &&
        o.y + o.h >= p.y &&
        o.vy >= 0
      ) {
        o.y = p.y - o.h;
        o.vy = 0;
        o.on = true;
      }
    if (o === pl && !was && o.on && fall > 260) {
      sfxLand(fall);
      part(
        o.x + 17,
        o.y + o.h,
        '#aeb9c7',
        Math.min(12, 4 + Math.floor(fall / 120)),
        Math.min(160, fall * 0.22),
        5
      );
      F.push({ k: 'impact', x: o.x + 17, y: o.y + o.h, col: '#dce6ef', life: 0.14, max: 0.14, r: 28 });
      if (pl.boonFart && fall > 330) {
        ring(o.x + 17, G - 5, '#b5ff9b', 115, 6);
        for (const e of E)
          if (!e.dead && Math.abs(e.x - o.x) < 125) {
            e.vx += Math.sign(e.x - o.x || 1) * 420;
            e.stun = Math.max(e.stun, 0.25);
          }
        txt(o.x + 17, o.y - 24, 'TACTICAL GAS', '#c9ffb5', false);
      }
    }
  }
  function enemyBolt(e, d) {
    sfxEnemyCast(e, d);
    F.push({
      k: 'rune',
      x: e.x + e.w / 2,
      y: e.y + e.h * 0.35,
      r: e.elite ? 34 : 25,
      life: 0.28,
      max: 0.28,
      col: d.bolt || '#ff713d',
      spin: e.dir
    });
    let sx = e.x + e.w / 2,
      sy = e.y + e.h * 0.35,
      tx = pl.x + pl.w / 2,
      ty = pl.y + pl.h * 0.45,
      dx = tx - sx,
      dy = ty - sy,
      len = Math.hypot(dx, dy) || 1,
      sp = e.type === 'sniper' ? 900 : d.air ? 430 : 390,
      effect =
        e.type === 'taxman' ? 'audit' : e.type === 'wizard' ? 'burn' : e.type === 'eyeball' ? 'weird' : null,
      count = e.type === 'eyeball' ? 3 : 1;
    for (let i = 0; i < count; i++) {
      let a = (i - (count - 1) / 2) * 0.16,
        ca = Math.cos(a),
        sa = Math.sin(a),
        vx = ((dx / len) * ca - (dy / len) * sa) * sp,
        vy = ((dx / len) * sa + (dy / len) * ca) * sp;
      Q.push({
        x: sx,
        y: sy,
        vx,
        vy,
        r: e.elite ? 10 : 8,
        life: 3,
        dam: e.dmg * (count > 1 ? 0.72 : 1),
        col: d.bolt || '#ff713d',
        trail: 0,
        effect,
        spin: rand(-6, 6)
      });
    }
    part(sx, sy, d.bolt || '#ff713d', 10, 130, 6);
    ring(sx, sy, d.bolt || '#ff713d', 34, 3);
  }
