  const BOSS = {
    jr: {
      name: 'CRAZY WEAPON MAN JR.',
      sub: 'WEAPON ADDICTION IS HEREDITARY • TARGET CLEAR 66%',
      line: 'He saw your DPS number and took it personally.',
      quote: '“MINE HAS MORE PARTICLES!”'
    },
    bossman: {
      name: 'CRAZY BOSS MAN',
      sub: 'VICE PRESIDENT OF UNNECESSARY MECHANICS • TARGET CLEAR 50%',
      line: 'He does not own a weapon. He owns your calendar.',
      quote: '“WE’RE A FAMILY HERE.”'
    },
    sr: {
      name: 'CRAZY WEAPON MAN SR.',
      sub: 'THE ORIGINAL BAD INFLUENCE • TARGET CLEAR 40%',
      line: 'He taught Jr. everything except restraint.',
      quote: '“THAT DPS NUMBER LOOKS SMALL FROM HERE.”'
    },
    grandma: {
      name: 'CRAZY WEAPON GRANDMA',
      sub: 'MATRIARCH OF UNSOLICITED BUFFS • TARGET CLEAR 32%',
      line: 'She brought snacks. The snacks are armed.',
      quote: '“YOU LOOK THIN. EAT THIS PROJECTILE.”'
    },
    ceo: {
      name: 'CRAZY CEO MAN',
      sub: 'OWNER OF THE ARENA • TARGET CLEAR 24%',
      line: 'He has acquired the floor, the ceiling, and your mead break.',
      quote: '“YOUR BUILD HAS BEEN RESTRUCTURED.”'
    },
    weapon: {
      name: 'THE WEAPON ITSELF',
      sub: 'SENTIENT DPS EVENT • TARGET CLEAR 20%',
      line: 'Every bad decision has finally guild-certified into one object.',
      quote: '“YOU WERE NEVER HOLDING ME. I WAS HOLDING YOU.”'
    }
  };
  function bossArena(kind) {
    bossArenaVariant = ri(0, 2);
    if (kind === 'jr')
      return [
        { x: 105, y: 530, w: 210, h: 18, tag: 'weapon pile' },
        { x: 440, y: 430, w: 205, h: 18, tag: 'dueling table' },
        { x: 800, y: 520, w: 190, h: 18, tag: 'knife shelf' },
        { x: 1040, y: 390, w: 145, h: 18, tag: 'illegal balcony' }
      ];
    if (kind === 'sr')
      return [
        { x: 70, y: 520, w: 180, h: 18, tag: 'dad shelf' },
        { x: 315, y: 420, w: 180, h: 18, tag: 'forge bench' },
        { x: 565, y: 500, w: 150, h: 18, tag: 'questionable ramp' },
        { x: 790, y: 385, w: 190, h: 18, tag: 'weapon attic' },
        { x: 1030, y: 500, w: 170, h: 18, tag: 'inheritance' }
      ];
    if (kind === 'grandma')
      return [
        { x: 65, y: 510, w: 170, h: 18, tag: 'doily' },
        { x: 285, y: 410, w: 175, h: 18, tag: 'casserole rack' },
        { x: 520, y: 520, w: 165, h: 18, tag: 'good chair' },
        { x: 755, y: 395, w: 170, h: 18, tag: 'cookie shelf' },
        { x: 1010, y: 500, w: 175, h: 18, tag: 'plastic couch' }
      ];
    if (kind === 'ceo')
      return [
        { x: 60, y: 515, w: 155, h: 18, tag: 'subsidiary' },
        { x: 275, y: 390, w: 170, h: 18, tag: 'board seat' },
        { x: 520, y: 495, w: 165, h: 18, tag: 'royal stipend' },
        { x: 755, y: 365, w: 190, h: 18, tag: 'penthouse' },
        { x: 1040, y: 505, w: 150, h: 18, tag: 'golden parachute' }
      ];
    if (kind === 'weapon')
      return [
        { x: 60, y: 500, w: 155, h: 18, tag: 'blade shard' },
        { x: 250, y: 385, w: 150, h: 18, tag: 'bow limb' },
        { x: 455, y: 515, w: 145, h: 18, tag: 'hammer head' },
        { x: 650, y: 365, w: 150, h: 18, tag: 'staff rune' },
        { x: 855, y: 500, w: 150, h: 18, tag: 'dagger pile' },
        { x: 1050, y: 405, w: 145, h: 18, tag: 'wand eye' }
      ];
    return bossArenaVariant === 0
      ? [
          { x: 90, y: 540, w: 190, h: 18, tag: 'cubicle' },
          { x: 380, y: 455, w: 200, h: 18, tag: 'council table' },
          { x: 700, y: 375, w: 185, h: 18, tag: 'high council deck' },
          { x: 1000, y: 505, w: 180, h: 18, tag: 'THE GUILD' }
        ]
      : bossArenaVariant === 1
        ? [
            { x: 130, y: 500, w: 170, h: 18, tag: 'budget' },
            { x: 360, y: 390, w: 155, h: 18, tag: 'synergy' },
            { x: 610, y: 505, w: 180, h: 18, tag: 'reorg' },
            { x: 880, y: 410, w: 170, h: 18, tag: 'PIP' },
            { x: 1090, y: 520, w: 120, h: 18, tag: 'exit' }
          ]
        : [
            { x: 80, y: 430, w: 170, h: 18, tag: 'ladderless promotion' },
            { x: 335, y: 525, w: 190, h: 18, tag: 'matrix org' },
            { x: 620, y: 410, w: 185, h: 18, tag: 'alignment' },
            { x: 930, y: 525, w: 180, h: 18, tag: 'action item' }
          ];
  }
  function bossSting(kind) {
    audioInit();
    let root =
      kind === 'jr'
        ? 196
        : kind === 'sr'
          ? 146.83
          : kind === 'grandma'
            ? 174.61
            : kind === 'ceo'
              ? 73.42
              : kind === 'weapon'
                ? 55
                : 98;
    for (let i = 0; i < 5; i++)
      setTimeout(() => {
        tone(root * Math.pow(2, i / 5), root * 0.55, 0.12, 0.045, 'sawtooth');
        noise(0.07, 0.025, 900);
      }, i * 85);
  }
  function startBoss(kind) {
    let c = BOSS[kind];
    riftReady = false;
    riftEnterT = 0;
    bossMode = kind;
    bossActive = true;
    bossIntroT = 2.45;
    bossVictoryT = 0;
    bossHazards = [];
    bossRescueUsed = false;
    deathOfferOpen = false;
    deathOfferWeapon = null;
    deathOfferBoss = null;
    deathRoll = 0;
    deathRolling = false;
    deathFateRolled = false;
    deathFate = null;
    superT = 0;
    superPower = 1;
    superRoll = 0;
    packLive = false;
    master = 9;
    chaosEvent = null;
    terrainMode = null;
    terrainHazards = [];
    lootSlow = 0;
    hudUpgradeT = 0;
    bannerT = 0;
    U.fsUpgrade && U.fsUpgrade.classList.remove('show');
    U.deathOffer && U.deathOffer.classList.remove('show');
    U.banner.style.display = 'none';
    E = [];
    D = [];
    P = [];
    Q = [];
    F = [];
    platforms = bossArena(kind).map(p => ({ ...p, y: p.y - 25 }));
    mapScene = { kind: 'boss', variant: bossArenaVariant, platforms, water: null };
    pl.x = 90;
    pl.y = G - pl.h;
    pl.vx = 0;
    pl.vy = 0;
    pl.inv = 1.2;
    let typeMap = {
        jr: 'bossjr',
        bossman: 'bossman',
        sr: 'bosssr',
        grandma: 'bossgrandma',
        ceo: 'bossceo',
        weapon: 'bossweapon'
      },
      ordMap = { jr: 1, bossman: 2, sr: 3, grandma: 4, ceo: 5, weapon: 6 },
      type = typeMap[kind] || 'bossjr',
      d = ED[type],
      ordinal = ordMap[kind] || 1,
      lv = Math.max(pl.lv + 1 + ordinal, Z[zoneI].lv + 1 + ordinal),
      adapt = bossAdaptive(kind, ordinal),
      mh = Math.round(mobHP(lv) * d.hp * adapt * 0.72),
      x = W - d.w - 120,
      y = G - d.h;
    bossOrdinal = ordinal;
    E.push({
      id: next++,
      type,
      boss: kind,
      bossOrdinal: ordinal,
      lv,
      x,
      y,
      w: d.w,
      h: d.h,
      hp: mh,
      max: mh,
      dmg: Math.round(50 * Math.pow(1.048, lv - 10) * d.dmg * Math.sqrt(adapt) * 0.8),
      sp: d.sp * 0.94,
      range: d.range,
      wind: d.wind,
      col: d.col,
      elite: true,
      dead: false,
      death: 0.6,
      vx: 0,
      vy: 0,
      on: true,
      dir: -1,
      state: 'idle',
      st: 1,
      stun: 0,
      anim: Math.random() * 9,
      hit: false,
      label: c.name,
      specialCd: 1.9,
      patternCd: 1.7,
      phase: 1,
      weaponStyle: 'sword',
      phaseLock: 0,
      fightAge: 0,
      dmgWindowStart: time,
      dmgWindow: 0,
      lastArmorText: -99,
      outcomeRecorded: false,
      grandmaHeal: 0,
      weaponCycle: 0,
      adaptType: curW().type,
      adaptT: 4.0
    });
    U.bossHud.classList.add('show');
    U.bossName.textContent = c.name;
    U.bossSub.textContent = c.sub;
    U.bossFill.style.width = '100%';
    U.bossIntro.classList.add('show');
    U.bossIntroName.textContent = c.name;
    U.bossIntroLine.textContent = c.line;
    U.bossIntroQuote.textContent = c.quote;
    U.msg.textContent = 'Boss fight. The DPS goblin has entered a formal performance review.';
    bossSting(kind);
    stopMusic();
    setTimeout(() => {
      if (gameStarted && SND.on) startMusic();
    }, 350);
  }
  function bossProjectile(x, y, tx, ty, spd, dam, col, effect = 'boss') {
    let dx = tx - x,
      dy = ty - y,
      l = Math.hypot(dx, dy) || 1;
    Q.push({
      x,
      y,
      vx: (dx / l) * spd,
      vy: (dy / l) * spd,
      r: 10,
      life: 4,
      dam,
      col,
      trail: 0,
      effect,
      spin: rand(-5, 5)
    });
  }
  function bossTargetLine(e, col = '#ff5577') {
    F.push({
      k: 'b',
      x: e.x + e.w / 2,
      y: e.y + e.h * 0.35,
      x2: pl.x + pl.w / 2,
      y2: pl.y + pl.h / 2,
      col,
      w: 3,
      life: 0.4
    });
  }
  function updateBossCounter(e, dt) {
    e.adaptT = (e.adaptT || 0) - dt;
    if (e.adaptT > 0 || e.phaseLock > 0) return;
    e.adaptT = Math.max(3.2, 5.3 - e.phase * 0.45);
    let type = curW().type;
    e.adaptType = type;
    if (type === 'bow' || type === 'shuriken') {
      txt(e.x + e.w / 2, e.y - 54, 'COUNTER: SHIELD APPRENTICE', '#bde8ff', true);
      if (E.filter(x => !x.dead && x.type === 'shieldbro').length < 2)
        spawn('shieldbro', clamp(e.x - 170, 80, W - 180), false);
    } else if (type === 'hammer') {
      txt(e.x + e.w / 2, e.y - 54, 'COUNTER: GUILD-SAFETY AIRSPACE', '#ffcf73', true);
      for (let i = 0; i < 2 + e.phase; i++)
        bossHazards.push({ k: 'jrMeteor', x: rand(80, W - 80), t: 0.55 + i * 0.12, hit: false });
    } else if (type === 'staff' || type === 'wand') {
      txt(e.x + e.w / 2, e.y - 54, 'COUNTER: MANA AUDIT', '#ff7693', true);
      pl.mana = Math.max(0, pl.mana - 12);
      for (let i = -1; i <= 1; i++)
        bossProjectile(
          e.x + e.w / 2,
          e.y + 25,
          pl.x + pl.w / 2 + i * 80,
          pl.y + pl.h / 2,
          470,
          e.dmg * 0.2,
          '#ff5577',
          'audit'
        );
    } else {
      txt(e.x + e.w / 2, e.y - 54, 'COUNTER: PERSONAL SPACE', '#ff9dbb', true);
      e.vx = -e.dir * 420;
      bossHazards.push({ k: 'jrSlam', x: pl.x + pl.w / 2, t: 0.5, r: 110 + e.phase * 18, hit: false });
    }
  }
  function updateBoss(e, dt) {
    if (bossIntroT > 0 || !bossActive) return;
    e.fightAge = (e.fightAge || 0) + dt;
    updateBossCounter(e, dt);
    e.phaseLock = Math.max(0, (e.phaseLock || 0) - dt);
    let ratio = e.hp / e.max;
    e.phase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
    e.dir = pl.x >= e.x ? 1 : -1;
    e.patternCd -= dt;
    e.specialCd -= dt;
    let dx = pl.x - e.x,
      dist = Math.abs(dx);
    if (e.boss === 'jr' || e.boss === 'sr' || e.boss === 'weapon') {
      if (e.specialCd <= 0) {
        let final = e.boss === 'weapon';
        e.specialCd = Math.max(
          final ? 0.72 : e.boss === 'sr' ? 1.35 : 2.1,
          (final ? 2.15 : e.boss === 'sr' ? 3.0 : 4.2) - e.phase * (final ? 0.32 : 0.55)
        );
        e.weaponStyle = pick(['sword', 'bow', 'staff', 'hammer']);
        txt(
          e.x + e.w / 2,
          e.y - 35,
          (final ? 'I AM ' : e.boss === 'sr' ? 'DAD SAYS ' : '') +
            e.weaponStyle.toUpperCase() +
            (final ? ' NOW' : ' IS OBVIOUSLY BEST'),
          e.col,
          true
        );
        ring(e.x + e.w / 2, e.y + e.h / 2, e.col, final ? 145 : e.boss === 'sr' ? 115 : 85, 4);
        if ((e.boss === 'sr' || final) && e.phase >= 2) {
          for (let i = -1; i <= 1; i++)
            bossProjectile(
              e.x + e.w / 2,
              e.y + 30,
              pl.x + pl.w / 2 + i * 90,
              pl.y + pl.h / 2,
              (final ? 590 : 480) + e.phase * 55,
              e.dmg * (final ? 0.34 : 0.28),
              final ? '#ffffff' : '#79f6ff',
              final ? 'weaponthought' : 'dadvice'
            );
        }
      }
      if (e.state === 'idle') {
        if (e.patternCd <= 0) {
          e.patternCd = Math.max(0.7, 1.45 - e.phase * 0.16);
          e.state = 'bosswind';
          e.st = e.weaponStyle === 'staff' ? 1.0 : 0.58;
          e.targetX = pl.x + pl.w / 2;
          e.vx = 0;
          bossTargetLine(e, e.col);
        } else {
          let want = e.weaponStyle === 'bow' || e.weaponStyle === 'staff' ? 260 : 95;
          e.vx += Math.sign(dx) * (dist > want ? 330 : -220) * dt;
          e.vx = clamp(e.vx, -e.sp, e.sp);
        }
      } else if (e.state === 'bosswind') {
        e.vx *= 0.75;
        e.st -= dt;
        if (e.st <= 0) {
          if (e.weaponStyle === 'sword') {
            e.state = 'bossdash';
            e.st = 0.42;
            e.hit = false;
            e.vx = e.dir * (520 + e.phase * 60);
            F.push({
              k: 'enemySlash',
              x: e.x + e.w / 2,
              y: e.y + e.h * 0.45,
              dir: e.dir,
              r: 95,
              life: 0.28,
              max: 0.28,
              col: '#ff8fe0',
              wide: true
            });
          } else if (e.weaponStyle === 'bow') {
            for (let i = -2 - e.phase; i <= 2 + e.phase; i++) {
              let a = i * 0.08,
                tx = pl.x + pl.w / 2 + Math.sin(a) * 160,
                ty = pl.y + pl.h / 2 + i * 8;
              bossProjectile(
                e.x + e.w / 2,
                e.y + 30,
                tx,
                ty,
                520 + e.phase * 45,
                e.dmg * 0.42,
                '#fff07d',
                'bossarrow'
              );
            }
            e.state = 'recover';
            e.st = 0.55;
          } else if (e.weaponStyle === 'staff') {
            for (let i = 0; i < 2 + e.phase; i++)
              bossHazards.push({
                k: 'jrMeteor',
                x: clamp(e.targetX + rand(-170, 170), 55, W - 55),
                t: 0.72 + i * 0.13,
                hit: false
              });
            e.state = 'recover';
            e.st = 0.7;
          } else {
            bossHazards.push({ k: 'jrSlam', x: e.x + e.w / 2, t: 0.48, r: 150 + e.phase * 25, hit: false });
            e.state = 'recover';
            e.st = 0.7;
          }
        }
      } else if (e.state === 'bossdash') {
        e.x += e.vx * dt;
        e.x = clamp(e.x, 20, W - e.w - 20);
        if (!e.hit && Math.abs(pl.x + pl.w / 2 - (e.x + e.w / 2)) < 95 && Math.abs(pl.y - e.y) < 90) {
          hurt(e.dmg, e);
          e.hit = true;
        }
        e.st -= dt;
        if (e.st <= 0) {
          e.state = 'recover';
          e.st = 0.48;
          e.vx = 0;
        }
      } else if (e.state === 'recover') {
        e.st -= dt;
        e.vx *= 0.75;
        if (e.st <= 0) e.state = 'idle';
      }
    } else if (e.boss === 'grandma') {
      if (e.phase >= 2 && e.grandmaHeal < e.phase - 1 && ratio < 0.67 - e.grandmaHeal * 0.34) {
        e.grandmaHeal++;
        let heal = e.max * 0.055;
        e.hp = Math.min(e.max, e.hp + heal);
        txt(e.x + e.w / 2, e.y - 42, 'YOU LOOK THIN +' + Math.round(heal), '#ffb7d8', true);
        for (let i = -2; i <= 2; i++)
          bossProjectile(
            e.x + e.w / 2,
            e.y + 24,
            pl.x + pl.w / 2 + i * 75,
            pl.y + pl.h / 2,
            420 + e.phase * 35,
            e.dmg * 0.26,
            '#ffb7d8',
            'casserole'
          );
      }
      if (e.state === 'idle' && e.patternCd <= 0) {
        e.patternCd = Math.max(0.82, 1.75 - e.phase * 0.18);
        e.state = 'bosswind';
        e.st = 0.68;
        e.pattern = pick(
          e.phase === 1 ? ['cookies', 'rollingpin'] : ['cookies', 'rollingpin', 'casserole', 'guilt']
        );
        txt(
          e.x + e.w / 2,
          e.y - 42,
          e.pattern === 'guilt' ? 'WHY DON’T YOU CALL?' : e.pattern.toUpperCase(),
          '#ffd1e4',
          true
        );
      }
      if (e.state === 'idle') {
        let want = 220;
        e.vx += Math.sign(dx) * (dist > want ? 165 : -120) * dt;
        e.vx = clamp(e.vx, -e.sp, e.sp);
      } else if (e.state === 'bosswind') {
        e.vx *= 0.75;
        e.st -= dt;
        if (e.st <= 0) {
          if (e.pattern === 'cookies') {
            for (let i = -3; i <= 3; i++)
              bossProjectile(
                e.x + e.w / 2,
                e.y + 28,
                pl.x + pl.w / 2 + i * 75,
                pl.y + pl.h / 2 + (i % 2) * 35,
                450,
                e.dmg * 0.3,
                '#ffd87f',
                'cookie'
              );
          } else if (e.pattern === 'rollingpin') {
            bossHazards.push({
              k: 'rollingpin',
              x: e.x + e.w / 2,
              dir: e.dir,
              t: 2.3,
              vx: e.dir * (500 + e.phase * 55),
              hit: false
            });
          } else if (e.pattern === 'casserole') {
            for (let i = 0; i < 3 + e.phase; i++)
              bossHazards.push({ k: 'casserole', x: rand(70, W - 70), t: 0.65 + i * 0.12, hit: false });
          } else {
            pl.mana = Math.max(0, pl.mana - 18);
            txt(pl.x + 17, pl.y - 42, 'GUILT -18 MANA', '#ff9fc9', true);
            for (let i = 0; i < 2 + e.phase; i++)
              bossProjectile(
                e.x + e.w / 2,
                e.y + 25,
                pl.x + pl.w / 2 + rand(-140, 140),
                pl.y + pl.h / 2,
                500,
                e.dmg * 0.24,
                '#ff9fc9',
                'guilt'
              );
          }
          e.state = 'recover';
          e.st = 0.65;
        }
      } else if (e.state === 'recover') {
        e.st -= dt;
        e.vx *= 0.8;
        if (e.st <= 0) e.state = 'idle';
      }
    } else {
      if (e.phase === 3 && e.familyOnce !== true) {
        e.familyOnce = true;
        txt(
          W / 2,
          120,
          e.boss === 'ceo' ? 'HOSTILE TAKEOVER COMPLETE' : "WE'RE A FAMILY HERE",
          '#fff17c',
          true
        );
        shake = 18;
        flash = 0.35;
        for (let i = 0; i < (e.boss === 'ceo' ? 4 : 3); i++)
          spawn(i % 2 ? 'sniper' : 'shieldbro', ri(120, W - 220), true);
      }
      if (e.state === 'idle' && e.patternCd <= 0) {
        e.patternCd = Math.max(1.15, 2.2 - e.phase * 0.25);
        e.state = 'bosswind';
        e.st = 0.85;
        let options =
          e.boss === 'ceo'
            ? e.phase === 1
              ? ['buyback', 'review', 'synergy']
              : e.phase === 2
                ? ['buyback', 'review', 'privatize', 'synergy']
                : ['buyback', 'review', 'privatize', 'hostile', 'synergy']
            : e.phase === 1
              ? ['meeting', 'review', 'synergy']
              : e.phase === 2
                ? ['meeting', 'review', 'budget', 'synergy']
                : ['meeting', 'review', 'budget', 'restructure', 'synergy'];
        e.pattern = pick(options);
        txt(
          e.x + e.w / 2,
          e.y - 44,
          e.pattern.toUpperCase().replace('REVIEW', 'PERFORMANCE REVIEW'),
          '#ffd073',
          true
        );
      }
      if (e.state === 'idle') {
        let want = 280;
        e.vx += Math.sign(dx) * (dist > want ? 180 : -130) * dt;
        e.vx = clamp(e.vx, -e.sp, e.sp);
      } else if (e.state === 'bosswind') {
        e.vx *= 0.7;
        e.st -= dt;
        if (e.st <= 0) {
          if (e.pattern === 'meeting') {
            for (let i = 0; i < 3 + e.phase; i++)
              bossHazards.push({ k: 'meeting', x: rand(70, W - 170), w: rand(90, 150), t: 0.9, hit: false });
          } else if (e.pattern === 'review') {
            bossHazards.push({ k: 'review', x: pl.x + pl.w / 2, t: 0.85, hit: false });
          } else if (e.pattern === 'budget') {
            let candidates = platforms.map((_, i) => i);
            for (let i = 0; i < Math.min(2, e.phase); i++) {
              let pi = candidates.splice(ri(0, candidates.length - 1), 1)[0];
              bossHazards.push({ k: 'budget', pi, t: 1.0, active: 1.8 });
            }
          } else if (e.pattern === 'restructure') {
            bossHazards.push({ k: 'restructure', t: 0.7 });
          } else if (e.pattern === 'buyback') {
            for (let i = 0; i < 3 + e.phase; i++)
              bossProjectile(
                e.x + e.w / 2,
                e.y + 25,
                pl.x + pl.w / 2 + rand(-180, 180),
                pl.y + pl.h / 2,
                560,
                e.dmg * 0.32,
                '#ffd24f',
                'golden'
              );
          } else if (e.pattern === 'privatize') {
            let candidates = platforms.map((_, i) => i);
            for (let i = 0; i < Math.min(3, e.phase + 1) && candidates.length; i++) {
              let pi = candidates.splice(ri(0, candidates.length - 1), 1)[0];
              bossHazards.push({ k: 'budget', pi, t: 0.65, active: 2.3 });
            }
          } else if (e.pattern === 'hostile') {
            for (let i = 0; i < 5; i++)
              bossHazards.push({ k: 'meeting', x: 80 + i * 230, w: 125, t: 0.6 + i * 0.08, hit: false });
            bossHazards.push({ k: 'review', x: pl.x + pl.w / 2, t: 0.75, hit: false });
          } else if (e.pattern === 'synergy') {
            for (let i = 0; i < e.phase + (e.boss === 'ceo' ? 1 : 0); i++)
              spawn(i % 2 ? 'summoner' : 'shieldbro', ri(100, W - 200), i === e.phase - 1);
          }
          e.state = 'recover';
          e.st = 0.75;
        }
      } else if (e.state === 'recover') {
        e.st -= dt;
        e.vx *= 0.78;
        if (e.st <= 0) e.state = 'idle';
      }
    }
    let py = e.y;
    e.vy += 950 * dt;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.x = clamp(e.x, 10, W - e.w - 10);
    resolve(e, py);
  }
  function updateBossHazards(dt) {
    for (const h of bossHazards) {
      h.t -= dt;
      if (h.k === 'jrMeteor') {
        if (h.t <= 0 && !h.fired) {
          h.fired = true;
          boom(h.x, G - 12, '#ff6ed8', 110, 0.8);
          if (Math.abs(pl.x + pl.w / 2 - h.x) < 90) hurt(Math.max(22, pl.max * 0.075), { x: h.x });
          h.dead = true;
        }
      } else if (h.k === 'jrSlam') {
        if (h.t <= 0 && !h.fired) {
          h.fired = true;
          boom(h.x, G - 8, '#ffc45a', h.r, 1.1);
          if (pl.on && Math.abs(pl.x + pl.w / 2 - h.x) < h.r) hurt(Math.max(28, pl.max * 0.09), { x: h.x });
          h.dead = true;
        }
      } else if (h.k === 'rollingpin') {
        h.x += h.vx * dt;
        h.t -= 0;
        if (!h.hit && Math.abs(pl.x + pl.w / 2 - h.x) < 48 && pl.y + pl.h > G - 115) {
          h.hit = true;
          hurt(Math.max(28, pl.max * 0.08), { x: h.x });
        }
        if (h.x < -80 || h.x > W + 80 || h.t <= 0) h.dead = true;
      } else if (h.k === 'casserole') {
        if (h.t <= 0 && !h.fired) {
          h.fired = true;
          boom(h.x, G - 12, '#ff9fc9', 95, 0.72);
          if (Math.abs(pl.x + pl.w / 2 - h.x) < 78) hurt(Math.max(25, pl.max * 0.075), { x: h.x });
          h.dead = true;
        }
      } else if (h.k === 'meeting') {
        if (h.t <= 0 && !h.fired) {
          h.fired = true;
          if (pl.x + pl.w > h.x && pl.x < h.x + h.w) hurt(Math.max(24, pl.max * 0.07), { x: h.x + h.w / 2 });
          boom(h.x + h.w / 2, G - 8, '#ff4b57', h.w * 0.65, 0.75);
          h.dead = true;
        }
      } else if (h.k === 'review') {
        if (h.t <= 0 && !h.fired) {
          h.fired = true;
          if (Math.abs(pl.x + pl.w / 2 - h.x) < 55) hurt(Math.max(30, pl.max * 0.09), { x: h.x });
          beam(h.x, 0, h.x, G, '#fff176', 10);
          h.dead = true;
        }
      } else if (h.k === 'budget') {
        if (h.t <= 0 && !h.fired) {
          h.fired = true;
          h.t = h.active;
          let p = platforms[h.pi];
          if (p) p.disabled = true;
          txt(p ? p.x + p.w / 2 : W / 2, 250, 'BUDGET CUT', '#ff9b64', true);
        } else if (h.fired && h.t <= 0) {
          let p = platforms[h.pi];
          if (p) p.disabled = false;
          h.dead = true;
        }
      } else if (h.k === 'restructure') {
        if (h.t <= 0 && !h.fired) {
          h.fired = true;
          platforms = bossArena('bossman').map(p => ({ ...p, y: p.y - 25 }));
          mapScene.platforms = platforms;
          txt(W / 2, 150, 'RESTRUCTURING', '#fff176', true);
          shake = 12;
          h.dead = true;
        }
      }
    }
    bossHazards = bossHazards.filter(h => !h.dead);
  }
  function drawBossHazards() {
    X.save();
    for (const h of bossHazards) {
      if (h.k === 'jrMeteor') {
        X.globalAlpha = 0.5 + 0.25 * Math.sin(time * 16);
        X.strokeStyle = '#ff71d8';
        X.lineWidth = 4;
        X.beginPath();
        X.arc(h.x, G - 8, 50, 0, Math.PI * 2);
        X.stroke();
        X.fillStyle = '#ffcf6f';
        X.textAlign = 'center';
        X.font = '900 11px system-ui';
        X.fillText('STAFF PROBLEM', h.x, G - 66);
      } else if (h.k === 'jrSlam') {
        X.globalAlpha = 0.5;
        X.strokeStyle = '#ffc45a';
        X.lineWidth = 6;
        X.beginPath();
        X.arc(h.x, G - 8, h.r, 0, Math.PI * 2);
        X.stroke();
      } else if (h.k === 'rollingpin') {
        X.globalAlpha = 0.9;
        X.fillStyle = '#b98558';
        X.save();
        X.translate(h.x, G - 30);
        X.rotate(time * 8 * (h.vx > 0 ? 1 : -1));
        X.fillRect(-40, -10, 80, 20);
        X.restore();
      } else if (h.k === 'casserole') {
        X.globalAlpha = 0.6 + 0.2 * Math.sin(time * 15);
        X.strokeStyle = '#ffb1d2';
        X.lineWidth = 4;
        X.beginPath();
        X.arc(h.x, G - 8, 44, 0, Math.PI * 2);
        X.stroke();
      } else if (h.k === 'meeting') {
        X.globalAlpha = 0.25 + 0.2 * Math.sin(time * 13);
        X.fillStyle = '#ff3f54';
        X.fillRect(h.x, G - 125, h.w, 125);
        X.strokeStyle = '#ffdf73';
        X.strokeRect(h.x, G - 125, h.w, 125);
      } else if (h.k === 'review') {
        X.globalAlpha = 0.7;
        X.strokeStyle = '#fff176';
        X.lineWidth = 4;
        X.setLineDash([10, 8]);
        X.beginPath();
        X.moveTo(h.x, 0);
        X.lineTo(h.x, G);
        X.stroke();
        X.setLineDash([]);
      } else if (h.k === 'budget') {
        let p = platforms[h.pi];
        if (p) {
          X.globalAlpha = 0.8;
          X.fillStyle = '#ff764d';
          X.textAlign = 'center';
          X.font = '900 12px system-ui';
          X.fillText(p.disabled ? 'PLATFORM DEFUNDED' : 'BUDGET REVIEW', p.x + p.w / 2, p.y - 18);
        }
      }
    }
    X.restore();
    X.globalAlpha = 1;
    X.textAlign = 'left';
  }
  function drawBoss(e) {
    if (globalThis.CWM_PX && globalThis.CWM_PX.bossBody(e)) return;
    let q = e.hp / e.max;
    X.save();
    X.translate(e.x + e.w / 2, e.y + e.h / 2);
    X.scale(e.dir, 1);
    if (e.boss === 'jr' || e.boss === 'sr' || e.boss === 'weapon') {
      X.fillStyle = e.boss === 'weapon' ? '#ffffff' : e.boss === 'sr' ? '#d8f5f4' : '#f3d5cb';
      X.beginPath();
      X.arc(0, -35, 17, 0, Math.PI * 2);
      X.fill();
      X.fillStyle = e.boss === 'weapon' ? '#11131c' : e.boss === 'sr' ? '#278ca3' : '#ff53c9';
      X.fillRect(-23, -18, 46, 58);
      X.fillStyle = '#1b1022';
      X.fillRect(-15, -42, 30, 9);
      X.strokeStyle =
        e.weaponStyle === 'hammer'
          ? '#ffd65a'
          : e.weaponStyle === 'bow'
            ? '#8ff0ff'
            : e.weaponStyle === 'staff'
              ? '#c88cff'
              : '#ff79ce';
      X.shadowBlur = 20;
      X.shadowColor = X.strokeStyle;
      X.lineWidth = e.weaponStyle === 'hammer' ? 15 : 8;
      X.beginPath();
      X.moveTo(12, -4);
      X.lineTo(58, -10);
      X.stroke();
      X.shadowBlur = 0;
      X.fillStyle = '#fff';
      X.font = '1000 10px system-ui';
      X.fillText(
        e.boss === 'weapon' ? '???' : e.boss === 'sr' ? 'SR' : 'JR',
        e.boss === 'weapon' ? -12 : e.boss === 'sr' ? -8 : -7,
        12
      );
      if (e.boss === 'weapon') {
        X.globalAlpha = 0.9;
        X.strokeStyle =
          e.weaponStyle === 'hammer'
            ? '#ffd65a'
            : e.weaponStyle === 'bow'
              ? '#8ff0ff'
              : e.weaponStyle === 'staff'
                ? '#c88cff'
                : '#ff79ce';
        X.shadowBlur = 28;
        X.shadowColor = X.strokeStyle;
        X.lineWidth = e.weaponStyle === 'hammer' ? 22 : 12;
        X.beginPath();
        if (e.weaponStyle === 'bow') {
          X.arc(0, 0, 70, -1.1, 1.1);
        } else {
          X.moveTo(-65, 20);
          X.lineTo(88, -26);
        }
        X.stroke();
        X.shadowBlur = 0;
        X.globalAlpha = 1;
      }
    } else if (e.boss === 'grandma') {
      X.fillStyle = '#f1d7c8';
      X.beginPath();
      X.arc(0, -38, 22, 0, Math.PI * 2);
      X.fill();
      X.fillStyle = '#d8d8e8';
      X.beginPath();
      X.arc(-10, -52, 13, 0, Math.PI * 2);
      X.arc(10, -52, 13, 0, Math.PI * 2);
      X.fill();
      X.fillStyle = '#ff8fbe';
      X.fillRect(-35, -18, 70, 82);
      X.fillStyle = '#fff';
      X.font = '1000 11px system-ui';
      X.fillText('EAT', -12, 18);
      X.strokeStyle = '#b98558';
      X.lineWidth = 9;
      X.beginPath();
      X.moveTo(30, -4);
      X.lineTo(78, -8);
      X.stroke();
    } else {
      X.fillStyle = e.boss === 'ceo' ? '#4a3b12' : '#2a2d38';
      X.fillRect(-44, -24, 88, 90);
      X.fillStyle = '#fff2df';
      X.beginPath();
      X.arc(0, -42, 24, 0, Math.PI * 2);
      X.fill();
      X.fillStyle = '#ffb23e';
      X.fillRect(-8, -15, 16, 56);
      X.fillStyle = '#1d2028';
      X.fillRect(-18, -50, 36, 8);
      X.strokeStyle = '#ffcf6e';
      X.lineWidth = 7;
      X.beginPath();
      X.moveTo(-55, -5);
      X.lineTo(-95, -35);
      X.moveTo(55, -5);
      X.lineTo(95, -35);
      X.stroke();
      X.fillStyle = '#fff17c';
      X.font = '1000 13px system-ui';
      X.fillText(e.boss === 'ceo' ? 'CEO' : 'BOSS', e.boss === 'ceo' ? -14 : -20, 18);
    }
    X.restore();
    if (q < 0.34) {
      X.globalAlpha = 0.22;
      X.fillStyle = e.boss === 'jr' ? '#ff5ed1' : '#ffb34d';
      X.beginPath();
      X.arc(e.x + e.w / 2, e.y + e.h / 2, 80 + Math.sin(time * 8) * 8, 0, Math.PI * 2);
      X.fill();
      X.globalAlpha = 1;
    }
  }
  function bossReward(kind) {
    let ord = { jr: 1, bossman: 2, sr: 3, grandma: 4, ceo: 5, weapon: 6 }[kind] || 1,
      min = Math.min(R.length - 2, 4 + ord),
      best = null,
      bestD = 0,
      old = estimateDPS(curW());
    for (let i = 0; i < 400; i++) {
      let w = makeW(Z[zoneI].lv + ri(2, 6), true);
      forceRescueRarity(w, min);
      let q = rarityIndex(w),
        d = estimateDPS(w);
      if (q >= min && d > bestD) {
        best = w;
        bestD = d;
      }
      if (q >= min && d > old * (1.08 + ord * 0.035)) return w;
    }
    if (!best) best = makeUpgradeW(Z[zoneI].lv + 5);
    if (estimateDPS(best) <= old * 1.1) best.m *= (old * 1.16) / Math.max(1, estimateDPS(best));
    return best;
  }
  const BOONS = [
    {
      id: 'coffee',
      icon: '☕',
      name: 'DANGEROUS AMOUNT OF MANA POTION',
      desc: '+18% attack speed. -8 armor. Your hands have become theoretical.',
      apply: () => {
        pl.boonSpeed *= 1.18;
        pl.armor = Math.max(0, pl.armor - 8);
      }
    },
    {
      id: 'breakfast',
      icon: '🥞',
      name: 'SECOND BREAKFAST',
      desc: '+22% max HP and stronger healing on kills. Combat nutrition is legally food.',
      apply: () => {
        let old = pl.max;
        pl.max = Math.round(pl.max * 1.22);
        pl.hp += pl.max - old;
        pl.healMult *= 1.35;
      }
    },
    {
      id: 'pocketsand',
      icon: '✋',
      name: 'POCKET SAND CERTIFICATION',
      desc: 'Every 8th attack stuns nearby enemies and makes everyone reconsider your professionalism.',
      apply: () => {
        pl.boonPocket = (pl.boonPocket || 0) + 1;
      }
    },
    {
      id: 'greasy',
      icon: '🧈',
      name: 'GREASY KNEES',
      desc: 'Dash cooldown -35% and dash invulnerability lasts longer. Nobody can prove you have bones.',
      apply: () => {
        pl.dashMult *= 0.65;
        pl.boonDash = (pl.boonDash || 0) + 1;
      }
    },
    {
      id: 'support',
      icon: '🪚',
      name: 'EMOTIONAL SUPPORT WAR-SCYTHE',
      desc: '+10% damage and +50% heal-on-kill. It listens. Loudly.',
      apply: () => {
        pl.boonDamage *= 1.1;
        pl.healMult *= 1.5;
      }
    },
    {
      id: 'intern',
      icon: '📎',
      name: 'UNPAID COMBAT APPRENTICE',
      desc: 'Every 6th attack fires an autonomous spectral projectile. No benefits.',
      apply: () => {
        pl.boonIntern = (pl.boonIntern || 0) + 1;
      }
    },
    {
      id: 'warranty',
      icon: '🧾',
      name: 'QUESTIONABLE BLESSING',
      desc: 'Once per boss, lethal damage leaves you at 1 HP and voids the blessing immediately.',
      apply: () => {
        pl.warranty = (pl.warranty || 0) + 1;
      }
    },
    {
      id: 'space',
      icon: '📏',
      name: 'PERSONAL SPACE VIOLATION',
      desc: '+25% attack size and reach. The guild has been notified but is hiding.',
      apply: () => {
        pl.aoeMult *= 1.25;
      }
    },
    {
      id: 'numbers',
      icon: '📈',
      name: 'BIG NUMBER SYNDROME',
      desc: '+16% damage, but you take 12% more damage. Number green. Brain happy.',
      apply: () => {
        pl.boonDamage *= 1.16;
        pl.damageTaken *= 1.12;
      }
    },
    {
      id: 'refund',
      icon: '💸',
      name: 'TACTICAL TAX REFUND',
      desc: '+6% crit. Kills refund extra mana because accounting has lost control.',
      apply: () => {
        pl.boonCrit += 0.06;
        pl.boonTax = (pl.boonTax || 0) + 1;
      }
    },
    {
      id: 'flatulence',
      icon: '💨',
      name: 'WEAPONIZED FLATULENCE',
      desc: 'Hard landings create a knockback shockwave. Nobody wants to stand near you.',
      apply: () => {
        pl.boonFart = (pl.boonFart || 0) + 1;
      }
    },
    {
      id: 'dad',
      icon: '🧢',
      name: 'DAD REFLEXES',
      desc: 'Longer dash invulnerability and +8 armor. You sensed the thermostat change.',
      apply: () => {
        pl.boonDad = (pl.boonDad || 0) + 1;
        pl.armor += 8;
      }
    },
    {
      id: 'soup',
      icon: '🥣',
      name: 'SOUP-BASED ECONOMY',
      desc: 'Standing in rivers or forge-grade soup grants +20% damage instead of dignity.',
      apply: () => {
        pl.boonSoup = (pl.boonSoup || 0) + 1;
      }
    },
    {
      id: 'screaming',
      icon: '📢',
      name: 'SCREAMING IS A BUFF',
      desc: 'Every 5th attack makes a radial shockwave. The weapon has discovered bardic ballads.',
      apply: () => {
        pl.boonScream = (pl.boonScream || 0) + 1;
      }
    },
    {
      id: 'button',
      icon: '🔴',
      name: 'THE RED BUTTON',
      desc: 'Weapon skill costs 35% less mana. The button is not labeled and this is intentional.',
      apply: () => {
        pl.skillCost = Math.max(10, pl.skillCost * 0.65);
      }
    },
    {
      id: 'ceilingfan',
      icon: '🌀',
      name: 'FORGE-GRADE CEILING FAN',
      desc: 'Airborne enemies take +20% damage and get launched harder. Guild-safety says no.',
      apply: () => {
        pl.boonAir = (pl.boonAir || 0) + 1;
      }
    },
    {
      id: 'receiptarmor',
      icon: '🧾',
      name: 'RECEIPT-BASED ARMOR',
      desc: '+5 armor, fully documented on a receipt nobody will ever read.',
      apply: () => {
        pl.boonReceipt = (pl.boonReceipt || 0) + 1;
        pl.armor += 5;
      }
    },
    {
      id: 'forklift',
      icon: '🏗️',
      name: 'SIEGE-OX CERTIFIED',
      desc: 'Knockback +35%. Wall splats restore a little mana.',
      apply: () => {
        pl.boonForklift = (pl.boonForklift || 0) + 1;
      }
    },
    {
      id: 'feral',
      icon: '🦝',
      name: 'COURTYARD RACCOON MENTOR',
      desc: 'Low HP grants attack speed because fear has left the building.',
      apply: () => {
        pl.boonRaccoon = (pl.boonRaccoon || 0) + 1;
      }
    },
    {
      id: 'union',
      icon: '🤝',
      name: 'GUILD-MANDATED SECOND DASH',
      desc: 'Elite kills reduce dash cooldown immediately.',
      apply: () => {
        pl.boonUnion = (pl.boonUnion || 0) + 1;
      }
    },
    {
      id: 'reverse',
      icon: '↩️',
      name: 'TACTICAL WRONG WAY',
      desc: 'Ass Backwards weapons deal 20% more damage because commitment matters.',
      apply: () => {
        pl.boonReverse = (pl.boonReverse || 0) + 1;
      }
    },
    {
      id: 'museum',
      icon: '🏛️',
      name: 'CURATOR OF BAD DECISIONS',
      desc: 'High-rarity finds grant extra style. No free raw damage.',
      apply: () => {
        pl.boonCurator = (pl.boonCurator || 0) + 1;
      }
    }
  ];
  function boonStacks(id) {
    return boonsTaken.filter(x => x === id).length;
  }
  function showBoonChoices(kind) {
    boonChoosing = true;
    paused = false;
    stop = 0;
    let pool = [...BOONS],
      opts = [];
    while (opts.length < 3 && pool.length) {
      let i = ri(0, pool.length - 1);
      opts.push(pool.splice(i, 1)[0]);
    }
    U.boonSub.textContent = `Boss ${bossOrdinal} cleared. Target win rate ${Math.round(bossTarget(bossOrdinal) * 100)}%. Pick one permanent bad idea.`;
    U.boonChoices.innerHTML = opts
      .map(
        b =>
          `<button class="boonCard" data-boon="${b.id}"><div class="boonIcon">${b.icon}</div><div class="boonName">${b.name}</div><div class="boonDesc">${b.desc}</div><div class="boonStack">${boonStacks(b.id) ? 'CURRENT STACKS: ' + boonStacks(b.id) : 'NEW BAD IDEA'}</div></button>`
      )
      .join('');
    U.boonScreen.classList.add('show');
    U.boonChoices
      .querySelectorAll('[data-boon]')
      .forEach(btn => (btn.onclick = () => chooseBoon(btn.dataset.boon, kind)));
  }
  function finishBossExit(kind) {
    boonChoosing = false;
    bossVictoryT = 0;
    bossMode = null;
    bossActive = false;
    bossHazards = [];
    bossRescueUsed = false;
    superT = Math.max(0, superT - 6);
    closeDeathOffer();
    U.bossHud.classList.remove('show');
    U.msg.textContent =
      'Boon acquired. Future weapons remain completely random and irresponsible. Exit when ready.';
    openRift(true);
  }
  function chooseBoon(id, kind) {
    let b = BOONS.find(x => x.id === id);
    if (!b) return;
    b.apply();
    boonsTaken.push(id);
    boonChoosing = false;
    U.boonScreen.classList.remove('show');
    txt(W / 2, 135, b.name, '#fff176', true);
    ring(pl.x + pl.w / 2, pl.y + pl.h / 2, '#8ff2ff', 140, 6);
    pl.hp = Math.min(pl.max, pl.hp + Math.round(pl.max * 0.22));
    pl.mana = 100;
    U.msg.textContent = `BOON ACQUIRED: ${b.name}. Back to completely random weapons.`;
    finishBossExit(kind);
    render();
  }
  function bossDefeated(e) {
    if (e.dead) return;
    e.dead = true;
    e.death = 0.7;
    bossActive = false;
    let kind = e.boss;
    bossFlags[kind] = true;
    if (!e.outcomeRecorded) {
      e.outcomeRecorded = true;
      bossRecord(kind, true);
    }
    U.bossName.textContent =
      {
        jr: 'JR. HAS LEARNED NOTHING',
        bossman: 'MANAGEMENT HAS BEEN DEFEATED',
        sr: 'DAD HAS BEEN OUT-DPSED',
        grandma: 'GRANDMA SAYS YOU STILL LOOK THIN',
        ceo: 'THE BOARD HAS PANICKED',
        weapon: 'THE WEAPON HAS BEEN DISARMED'
      }[kind] || 'BOSS DEFEATED';
    U.bossSub.textContent = 'GUARANTEED DPS REVIEW + BOON DRAFT';
    U.bossFill.style.width = '0%';
    stop = Math.max(stop, 0.7);
    flash = 0.55;
    shake = 24;
    txt(W / 2, 130, 'BOSS DEFEATED', '#fff176', true);
    let heal = Math.round(pl.max * 0.35);
    pl.hp = Math.min(pl.max, pl.hp + heal);
    for (const o of E)
      if (o !== e && !o.dead) {
        o.dead = true;
        o.death = 0.25;
      }
    recordBossMuseum(kind, curW());
    awardMeta(1, 'Boss evidence filed.');
    let reward = bossReward(kind);
    equip(reward);
    let suit = makeArmorUpgrade(pl.lv + 2 + (kind === 'weapon' ? 3 : 0));
    equipArmor(suit, false);
    txt(W / 2, 168, 'PREMIUM BODY ARMOR REVIEW', suit.col, true);
    showBoonChoices(kind);
    U.msg.textContent =
      'Boss weapon reviewed, premium body armor approved, and now you get a ridiculous permanent boon.';
  }
  function advanceZone() {
    packLive = false;
    chaosEvent = null;
    chaosT = 0;
    terrainMode = null;
    terrainHazards = [];
    bossMode = null;
    bossActive = false;
    bossHazards = [];
    bossRescueUsed = false;
    superT = Math.max(0, superT - 4);
    closeDeathOffer();
    riftReady = false;
    riftEnterT = 0;
    stageClears = 0;
    master = 0;
    U.bossHud.classList.remove('show');
    let keepX = pl.x;
    zoneI++;
    zoneT = 1.9;
    E = [];
    D = [];
    P = [];
    Q = [];
    F = [];
    applyMap(zoneI);
    pl.x = clamp(keepX, 35, W - pl.w - 35);
    pl.y = G - pl.h;
    pl.vx = 0;
    pl.vy = 0;
    U.zone.style.display = 'grid';
    U.zt.textContent = `STAGE ${zoneI + 1} — ${Z[zoneI].name}`;
    U.zs.textContent = `Recommended Lv. ${Z[zoneI].lv} • ${approachLabel()} • ${Z[zoneI].sub}`;
    U.msg.textContent = `Rift traversal complete. ${approachTheme().tag}. ${approachLabel()}. Clear ${stageGoal()} packs before the boss can appear.`;
  }

