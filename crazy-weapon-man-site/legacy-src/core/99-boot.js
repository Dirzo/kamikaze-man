  window.__KM_DEBUG = {
    wavePressure: () => rarityWavePressure(),
    wavePlan: (i = stageClears) => wavePlan(i),
    shards: () => ({
      weaponShards,
      bonus: shardBonusRanks(),
      quality: shardQualityLabel(),
      ready: weaponShards >= SHARD_UNLOCK
    }),
    salvageTest: (rar = 'Common') => {
      let r = R.find(x => x.n === rar) || R[0],
        w = makeExactRankWeapon(pl.lv, rarityIndex(r));
      w.fromShardForge = false;
      w.m = 0.01;
      let before = weaponShards,
        old = curW().name;
      equip(w);
      return {
        before,
        after: weaponShards,
        gained: weaponShards - before,
        current: curW().name,
        kept: old === curW().name
      };
    },
    forgeState: () => ({
      open: shardForgeOpen,
      rolling: shardForgeRolling,
      rolled: shardForgeRolled,
      roll: shardForgeRoll,
      spend: shardForgeSpend,
      weapon: shardForgeWeapon
        ? {
            name: shardForgeWeapon.name,
            rar: shardForgeWeapon.rar,
            dps: Math.round(estimateDPS(shardForgeWeapon))
          }
        : null
    }),
    grantShards: (n = 100) => {
      weaponShards = clamp(weaponShards + n, 0, SHARD_CAP);
      updateShardHud();
      return weaponShards;
    },
    forgeOpen: () => openShardForge(),
    forgeRoll: (roll = 20) => {
      if (!shardForgeOpen) openShardForge();
      rollShardForge(roll);
      return { spend: shardForgeSpend, roll };
    },
    forgeResolve: () => {
      if (shardForgeRolled) rollShardForge();
      return { weapon: curW().name, shards: weaponShards };
    },
    raritySample: (zone = 0, n = 5000, elite = false) => {
      let oz = zoneI;
      zoneI = clamp(zone, 0, Z.length - 1);
      let c = {};
      for (let i = 0; i < n; i++) {
        let w = makeW(Math.max(1, Z[zoneI].lv), elite);
        c[w.rar] = (c[w.rar] || 0) + 1;
      }
      zoneI = oz;
      return c;
    },
    nameSample: (zone = 0, n = 20) => {
      let oz = zoneI;
      zoneI = clamp(zone, 0, Z.length - 1);
      let a = Array.from({ length: n }, () => {
        let w = makeW(Math.max(1, Z[zoneI].lv), false);
        return { rar: w.rar, name: w.name, len: w.name.length };
      });
      zoneI = oz;
      return a;
    },
    rareMutator: (id = 'overclock', type = 'stalker') => {
      spawn(type, pl.x + 260, false);
      let e = E.at(-1),
        m = RARE_MUTATORS.find(x => x.id === id) || RARE_MUTATORS[0];
      makeRareEnemy(e, m);
      e.state = 'approach';
      return { enemy: e.label, augment: m };
    },
    rareKill: (id = 'overclock', type = 'stalker') => {
      spawn(type, pl.x + 260, false);
      let e = E.at(-1),
        m = RARE_MUTATORS.find(x => x.id === id) || RARE_MUTATORS[0];
      makeRareEnemy(e, m);
      e.state = 'approach';
      hitE(e, e.max * 10, { ignoreCap: true, col: '#fff' });
      return tempAugment ? { ...tempAugment } : null;
    },
    grantAugment: (id = 'overclock') => {
      let m = RARE_MUTATORS.find(x => x.id === id) || RARE_MUTATORS[0];
      applyRareAugment(m);
      return { ...tempAugment };
    },
    mirrorTest: () => {
      E = [];
      P = [];
      let m = RARE_MUTATORS.find(x => x.id === 'mirror');
      applyRareAugment(m);
      spawn('crawler', pl.x + 260, false);
      let e = E.at(-1);
      e.state = 'approach';
      pl.combo = 3;
      pl.acd = 0;
      attack();
      return { combo: pl.combo, projectiles: P.length, kinds: P.map(x => x.k), augment: tempAugment?.name };
    },
    expireAugment: () => {
      if (tempAugment) tempAugment.t = 0.01;
      updateAugment(0.02);
      return tempAugment;
    },
    augment: () => (tempAugment ? { ...tempAugment } : null),
    combo: (score = 5000) => {
      styleScore = score;
      styleT = 0;
      return { score: styleScore, grade: styleGrade() };
    },
    armorEquip: (slot = 'head', power = 1, forced = false) => {
      let a = makeArmor(pl.lv + 8, true, slot);
      a.armor = Math.round(a.armor * power);
      a.damage *= power;
      a.speed *= Math.min(1.5, power);
      a.crit *= Math.min(1.5, power);
      a.move = Math.round(a.move * Math.min(1.4, power));
      let equipped = equipArmor(a, forced);
      return { equipped, slot, item: a, current: pl.armors[slot], score: armorScore(pl.armors[slot]) };
    },
    armorState: () => ({
      head: pl.armors.head,
      body: pl.armors.body,
      feet: pl.armors.feet,
      totalArmor: pl.armor,
      move: pl.move,
      crit: pl.crit
    }),
    deathFate: (roll = 20) => {
      if (!bossMode) {
        startBoss('jr');
        bossIntroT = 0;
        U.bossIntro.classList.remove('show');
      }
      pl.hp = 0;
      openDeathOffer(bossMode);
      rollDeathFate(roll);
      return {
        roll,
        weapon: deathOfferWeapon ? deathOfferWeapon.name : null,
        fate: deathFate ? deathFate.title : null
      };
    },
    acceptFate: () => {
      acceptDeathOffer();
      return { weapon: curW().name, hp: pl.hp, superT, superPower, roll: superRoll };
    },
    equip: (type, rar = 'Legendary', mod = null) => {
      let r = R.find(x => x.n === rar) || R[4],
        w = makeW(pl.lv, true);
      w.type = type;
      w.rar = rar;
      w.col = r.col;
      w.p = r.p;
      w.m = r.m;
      w.crit = 0.012 * r.p;
      if (mod) w.mod = mod;
      w.name = 'QA ' + rar + ' ' + type.toUpperCase();
      w.text = proceduralText(w);
      pl.weapon = null;
      equip(w);
      return w;
    },
    roll: (n = 10, elite = true) =>
      Array.from({ length: n }, () => {
        let w = makeW(pl.lv, elite);
        return {
          name: w.name,
          rar: w.rar,
          rank: rarityIndex(w),
          type: w.type,
          dps: Math.round(estimateDPS(w)),
          text: w.text
        };
      }),
    rollTypes: (n = 1000) => {
      let c = Object.fromEntries(Object.keys(WM).map(k => [k, 0]));
      for (let i = 0; i < n; i++) c[chooseWeaponType()]++;
      return c;
    },
    lootSim: (n = 500) => {
      let ow = pl.weapon,
        oh = [...equipTypeHistory],
        rolled = Object.fromEntries(Object.keys(WM).map(k => [k, 0])),
        equipped = Object.fromEntries(Object.keys(WM).map(k => [k, 0]));
      pl.weapon = null;
      equipTypeHistory = ['sword'];
      for (let i = 0; i < n; i++) {
        let w = makeW(Math.max(pl.lv, Z[zoneI].lv), false);
        rolled[w.type]++;
        let oldD = estimateDPS(curW()),
          newD = estimateDPS(w);
        if (newD > oldD * 1.01) {
          pl.weapon = w;
          equipTypeHistory.push(w.type);
          equipTypeHistory = equipTypeHistory.slice(-6);
          equipped[w.type]++;
        }
      }
      pl.weapon = ow;
      equipTypeHistory = oh;
      return { rolled, equipped };
    },
    dps: () => Math.round(estimateDPS(curW())),
    upgrade: () => {
      let w = makeUpgradeW(Z[zoneI].lv);
      return {
        name: w.name,
        rar: w.rar,
        type: w.type,
        dps: Math.round(estimateDPS(w)),
        current: Math.round(estimateDPS(curW()))
      };
    },
    spawn: (type = 'stalker', elite = false) => spawn(type, pl.x + 260, elite),
    trait: (id = 'rabbitlauncher', type = 'stalker') => {
      spawn(type, pl.x + 260, false);
      let e = E.at(-1),
        t = ENEMY_TRAITS.find(x => x.id === id);
      e.traits = t ? [t] : e.traits;
      e.traitCd = 0;
      e.state = 'approach';
      return { enemy: e.label, trait: enemyTraitText(e) };
    },
    chaos: (id = 'meteors') => {
      chaosEvent = id;
      chaosT = 8;
      chaosTick = 0;
      return chaosEvent;
    },
    terrain: (id = 'geyser') => {
      terrainMode = id;
      terrainTick = 0;
      terrainHazards = [];
      return terrainMode;
    },
    setZone: (i = 0) => {
      zoneI = clamp(i, 0, Z.length - 1);
      applyMap(zoneI);
      stageClears = 0;
      master = 0;
      riftReady = false;
      return Z[zoneI].name;
    },
    start: () => {
      gameStarted = true;
      U.titleScreen.classList.add('hidden');
    },
    attack,
    skill,
    jump,
    dash,
    tick: update,
    draw,
    bowSpider: () => {
      E = [];
      P = [];
      let w = makeW(pl.lv, true);
      w.type = 'bow';
      w.rar = 'Rare';
      w.col = '#e3c66c';
      w.m = 1.4;
      w.mod = 'none';
      w.name = 'QA Spider Bow';
      pl.weapon = w;
      spawn('crawler', pl.x + 280, false);
      attack();
      for (let i = 0; i < 60; i++) updateP(1 / 60);
      return E.map(e => ({ type: e.type, hp: e.hp, max: e.max, dead: e.dead }));
    },
    portrait: () => {
      render();
      let d = U.wArt.getContext('2d').getImageData(0, 0, U.wArt.width, U.wArt.height).data,
        n = 0;
      for (let i = 0; i < d.length; i += 4)
        if (d[i + 3] > 20 && (d[i] > 35 || d[i + 1] > 35 || d[i + 2] > 35)) n++;
      return { pixels: n, w: U.wArt.width, h: U.wArt.height };
    },
    map: () => ({
      scene: mapScene.kind,
      variant: mapScene.variant,
      water: mapScene.water,
      platforms: platforms.map(p => ({ x: p.x, y: p.y, w: p.w, h: p.h, tag: p.tag }))
    }),
    spawnPack,
    boss: (kind = 'jr') => {
      startBoss(kind);
      bossIntroT = 0;
      U.bossIntro.classList.remove('show');
      return E.find(e => e.boss);
    },
    boons: () => BOONS.map(b => ({ id: b.id, name: b.name, desc: b.desc })),
    chooseBoon: id => chooseBoon(id, bossMode),
    bossState: () => {
      let e = E.find(e => e.boss && !e.dead);
      return e
        ? {
            kind: e.boss,
            hp: e.hp,
            max: e.max,
            phase: e.phase,
            state: e.state,
            pattern: e.pattern,
            weaponStyle: e.weaponStyle
          }
        : null;
    },
    damageBoss: (fraction = 0.2) => {
      let e = E.find(e => e.boss && !e.dead);
      if (!e) return null;
      hitE(e, e.max * fraction, { ignoreCap: true, col: '#fff', stun: 0 });
      return e.dead ? 'dead' : { hp: e.hp, max: e.max };
    },
    hitBoss: (fraction = 0.5, crit = true) => {
      let e = E.find(e => e.boss && !e.dead);
      if (!e) return null;
      let dealt = hitE(e, e.max * fraction, { crit, col: '#fff', stun: 0 });
      return {
        dealt,
        hp: e.hp,
        max: e.max,
        phase: e.phase,
        lock: e.phaseLock || 0,
        window: e.dmgWindow || 0,
        age: e.fightAge || 0
      };
    },
    heal: () => {
      pl.hp = pl.max;
      over = false;
      pl.inv = 999;
      return pl.hp;
    },
    leaderboard: () => leaderboard.map(x => ({ ...x })),
    museum: () => JSON.parse(JSON.stringify(museum)),
    meta: () => ({ xp: metaXP, level: metaLevel }),
    forceSynergy: (id = 'driveby') => {
      let w = makeW(pl.lv, true);
      if (id === 'driveby') {
        w.type = 'bow';
        w.traits = [TRAITS.find(t => t.code === 'speedy'), TRAITS.find(t => t.code === 'assbackwards')];
      } else if (id === 'bouncehouse') {
        w.type = 'hammer';
        w.traits = [TRAITS.find(t => t.code === 'haunted'), TRAITS.find(t => t.code === 'bouncy')];
      }
      w.synergy = detectSynergy(w);
      w.name = 'QA ' + (w.synergy?.name || id);
      pl.weapon = w;
      return w.synergy;
    },
    director: (id = 'launchparty') => {
      directorEvent = DIRECTOR_EVENTS.find(x => x.id === id) || null;
      return directorEvent;
    },
    clearLeaderboard: () => {
      leaderboard = [];
      saveLeaderboard();
      renderLeaderboard();
      return true;
    },
    grantXP: (n = 200) => {
      pl.xp += n;
      checkLevel();
      return { lv: pl.lv, xp: pl.xp, xpn: pl.xpn };
    },
    killN: (n = 6) => {
      for (let i = 0; i < n; i++) {
        let before = E.length;
        spawn('crawler', pl.x + 180, false);
        let e = E[E.length - 1];
        e.state = 'approach';
        killE(e, false, null, wdmg());
        E = E.filter(x => !x.dead);
        D = [];
      }
      return {
        kills,
        weapon: curW().name,
        rar: curW().rar,
        type: curW().type,
        traits: (curW().traits || []).map(t => t.code),
        dps: Math.round(estimateDPS(curW())),
        pity: earlyWeaponPity,
        funny: earlyFunnyGiven,
        funnyKill: earlyFunnyKill,
        history: [...equipTypeHistory]
      };
    },
    earlyFunny: () => ({ given: earlyFunnyGiven, target: earlyFunnyKill, history: [...equipTypeHistory] }),
    hitTest: (type = 'sword') => {
      E = [];
      let e0x = pl.x + 180;
      spawn('stalker', e0x, false);
      let e = E[E.length - 1];
      e.state = 'approach';
      let w = curW();
      let oldType = w.type;
      w.type = type;
      let before = { x: e.x, y: e.y, hp: e.hp };
      let dealt = hitE(e, e.max * 0.15, { col: '#fff', sourceType: type });
      return {
        before,
        after: { x: e.x, y: e.y, hp: e.hp, vx: e.vx, vy: e.vy, stun: e.stun, hitT: e.hitT },
        dealt,
        type
      };
    },
    clearPack: () => {
      E = [];
      if (!packLive) {
        packLive = true;
        packStartedAt = time - 6;
      }
      registerClear();
      return { stageClears, goal: stageGoal(), riftReady, master };
    },
    enterRift: () => {
      if (!riftReady) openRift(false);
      pl.x = riftX - pl.w / 2;
      pl.y = G - pl.h;
      enterRift();
      return { riftEnterT, riftReady };
    },
    progress: () => ({
      lv: pl.lv,
      xp: pl.xp,
      xpn: pl.xpn,
      stageClears,
      goal: stageGoal(),
      riftReady,
      riftEnterT,
      zone: zoneI,
      nextBoss: Z[zoneI]?.nextBoss,
      bossGate: Z[zoneI]?.boss || null
    }),
    campaign: () =>
      Z.map((z, i) => ({
        i,
        name: z.name,
        goal: z.goal,
        nextBoss: z.nextBoss,
        boss: z.boss || null,
        pool: z.pool
      })),
    shieldTurn: () => {
      E = [];
      spawn('shieldbro', pl.x + 160, false);
      let e = E[E.length - 1];
      e.state = 'approach';
      e.dir = -1;
      pl.x = e.x + 120;
      for (let i = 0; i < 10; i++) updateE(1 / 60);
      let early = e.dir;
      for (let i = 0; i < 30; i++) updateE(1 / 60);
      return { early, late: e.dir, turnT: e.turnT, faceCd: e.faceCd };
    },
    state: () => ({
      weapon: curW(),
      x: pl.x,
      y: pl.y,
      vx: pl.vx,
      vy: pl.vy,
      on: pl.on,
      dashT: pl.dashT,
      dcd: pl.dcd,
      dashAir: pl.dashAir,
      projectiles: P.length,
      projectileData: P.slice(0, 8).map(p => ({
        k: p.k,
        vx: Math.round(p.vx || 0),
        vy: Math.round(p.vy || 0),
        x: Math.round(p.x || 0),
        y: Math.round(p.y || 0)
      })),
      enemies: E.filter(e => !e.dead).map(e => ({
        type: e.type,
        x: Math.round(e.x),
        y: Math.round(e.y),
        hp: Math.round(e.hp),
        max: e.max
      })),
      zone: zoneI,
      hp: pl.hp,
      mana: pl.mana,
      armors: pl.armors,
      augment: tempAugment ? { id: tempAugment.id, t: tempAugment.t, name: tempAugment.name } : null,
      weaponShards,
      shardForgeOpen,
      styleScore,
      chaos: chaosEvent,
      weaponDryKills,
      weaponDropsThisRun,
      armorDryKills,
      stop,
      lootSlow,
      gameStarted,
      musicOn: SND.musicOn,
      titleHidden: U.titleScreen.classList.contains('hidden'),
      fx: F.length,
      textFx: T.length
    })
  };
  let uic = 0;
  function loop(now) {
    let dt = Math.min(0.033, (now - last) / 1000 || 0);
    last = now;
    update(dt);
    draw();
    uic += dt;
    if (uic > 0.1) {
      render();
      uic = 0;
    }
    requestAnimationFrame(loop);
  }
  loadLeaderboard();
  loadBossHistory();
  loadMeta();
  reset();
  requestAnimationFrame(loop);
})();
