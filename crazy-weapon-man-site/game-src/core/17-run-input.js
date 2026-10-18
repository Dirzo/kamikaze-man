  function reset() {
    runSeed = ((Math.random() * 0xffffffff) >>> 0).toString(16).toUpperCase().padStart(8, '0');
    packStartedAt = 0;
    packLive = false;
    goodClears = 0;
    upgradeMeter = 0;
    chaosEvent = null;
    chaosT = 0;
    chaosTick = 0;
    terrainMode = null;
    terrainDir = 1;
    terrainTick = 0;
    terrainHazards = [];
    terrainPadCd = 0;
    zoneI = 0;
    applyMap(0);
    pack = 1;
    packDelay = 0.5;
    zoneT = 0;
    master = 0;
    stageClears = 0;
    riftReady = false;
    riftEnterT = 0;
    levelUpT = 0;
    levelUpLv = 1;
    kills = 0;
    ones = 0;
    time = 0;
    paused = false;
    over = false;
    shake = 0;
    stop = 0;
    flash = 0;
    chroma = 0;
    bannerT = 0;
    lootSlow = 0;
    fxBudget = 260;
    lastPortraitId = null;
    lastPortraitT = -99;
    hudUpgradeT = 0;
    bossMode = null;
    bossActive = false;
    bossIntroT = 0;
    bossVictoryT = 0;
    bossFlags = { jr: false, bossman: false, sr: false, grandma: false, ceo: false, weapon: false };
    bossHazards = [];
    boonChoosing = false;
    boonsTaken = [];
    styleScore = 0;
    styleT = 0;
    styleLastGrade = 'WARMING UP';
    killChainCount = 0;
    killChainT = 0;
    killChainBonusTotal = 0;
    killChainBest = 0;
    waveHistory = [];
    updateKillChainHud();
    directorEvent = null;
    directorTrait = null;
    directorReward = false;
    synergyT = 0;
    waveIntroT = 0;
    U.waveIntro && U.waveIntro.classList.remove('show');
    tempAugment = null;
    rareEnemySeen = 0;
    weaponShards = 0;
    shardForgeOpen = false;
    shardForgeRolling = false;
    shardForgeRolled = false;
    shardForgeWeapon = null;
    shardForgeRoll = 0;
    shardForgeSpend = 0;
    shardPrompted = false;
    U.augmentHud && U.augmentHud.classList.remove('show');
    U.shardForge && U.shardForge.classList.remove('show');
    updateShardHud();
    deathOfferOpen = false;
    deathOfferWeapon = null;
    deathOfferBoss = null;
    bossRescueUsed = false;
    deathRoll = 0;
    deathRolling = false;
    deathFateRolled = false;
    deathFate = null;
    superT = 0;
    superPower = 1;
    superRoll = 0;
    U.boonScreen && U.boonScreen.classList.remove('show');
    U.deathOffer && U.deathOffer.classList.remove('show');
    U.synergyBadge && U.synergyBadge.classList.remove('show');
    U.directorStamp && U.directorStamp.classList.remove('show');
    U.bossHud && U.bossHud.classList.remove('show');
    U.bossIntro && U.bossIntro.classList.remove('show');
    U.fsUpgrade && U.fsUpgrade.classList.remove('show');
    E = [];
    D = [];
    P = [];
    Q = [];
    F = [];
    T = [];
    feed = [];
    earlyWeaponPity = false;
    earlyFunnyGiven = false;
    earlyFunnyKill = ri(2, 4);
    equipTypeHistory = ['sword'];
    weaponDryKills = 0;
    weaponDropsThisRun = 0;
    armorDryKills = 0;
    Object.assign(pl, {
      x: 82,
      y: 470,
      vx: 0,
      vy: 0,
      dir: 1,
      on: false,
      lv: 1,
      xp: 0,
      xpn: 72,
      hp: 420,
      max: 420,
      mana: 100,
      armor: 12,
      crit: 0.11,
      move: 280,
      acd: 0,
      scd: 0,
      dcd: 0,
      dashT: 0,
      dashDir: 1,
      dashAir: false,
      inv: 0,
      at: 0,
      atMax: 0.3,
      combo: 0,
      weapon: null,
      armors: { head: null, body: null, feet: null },
      boonDamage: 1,
      boonSpeed: 1,
      boonCrit: 0,
      healMult: 1,
      damageTaken: 1,
      dashMult: 1,
      aoeMult: 1,
      skillCost: 25,
      warranty: 0,
      boonPocket: 0,
      boonDash: 0,
      boonIntern: 0,
      boonTax: 0,
      boonFart: 0,
      boonDad: 0,
      boonSoup: 0,
      boonScream: 0,
      boonAir: 0,
      boonReceipt: 0,
      boonForklift: 0,
      boonRaccoon: 0,
      boonUnion: 0,
      boonReverse: 0,
      boonCurator: 0
    });
    U.banner.style.display = 'none';
    U.zone.style.display = 'none';
    U.feed.innerHTML = '<div class="feeditem">No upgrades yet.</div>';
    U.msg.textContent = `LEVEL 1. Training Sword. ${approachLabel()}. Clear ${stageGoal()} themed packs before the first boss. Weapon power cannot skip stages.`;
    document.getElementById('pause').textContent = 'Pause';
    document.getElementById('sound').textContent = SND.on ? 'Sound: ON' : 'Sound: OFF';
    render();
  }
  function startRun() {
    gameStarted = true;
    paused = false;
    over = false;
    document.body.classList.add('playing');
    U.titleScreen.classList.add('hidden');
    U.msg.textContent = 'Find a higher DPS weapon. It WILL be equipped. Crazy Weapon Man does not negotiate.';
    try {
      saveLeaderboard();
    } catch (e) {}
    try {
      audioInit();
      startMusic();
    } catch (e) {
      SND.on = false;
      let b = document.getElementById('sound');
      if (b) b.textContent = 'Sound: BLOCKED';
    }
  }
  U.playerName &&
    U.playerName.addEventListener('change', () => {
      try {
        saveLeaderboard();
      } catch (e) {}
    });
  document.getElementById('startGame').onclick = startRun;
  document.getElementById('startGame').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startRun();
    }
  });
  document.getElementById('fullscreen').onclick = async () => {
    let s = document.querySelector('.stage');
    try {
      if (!document.fullscreenElement) {
        await s.requestFullscreen();
        document.getElementById('fullscreen').textContent = 'Exit Fullscreen';
      } else {
        await document.exitFullscreen();
        document.getElementById('fullscreen').textContent = 'Fullscreen';
      }
    } catch (e) {
      s.classList.toggle('fullscreenSim');
    }
  };
  document.addEventListener('fullscreenchange', () => {
    document.getElementById('fullscreen').textContent = document.fullscreenElement
      ? 'Exit Fullscreen'
      : 'Fullscreen';
  });
  document.getElementById('openMuseum').onclick = () => {
    renderMuseum();
    U.museumModal.classList.add('show');
  };
  document.getElementById('closeMuseum').onclick = () => U.museumModal.classList.remove('show');
  U.museumModal.addEventListener('pointerdown', e => {
    if (e.target === U.museumModal) U.museumModal.classList.remove('show');
  });
  U.deathOfferTake && U.deathOfferTake.addEventListener('click', deathOfferPrimary);
  U.deathOfferLeave && U.deathOfferLeave.addEventListener('click', declineDeathOffer);
  U.deathOffer &&
    U.deathOffer.addEventListener('pointerdown', e => {
      if (e.target === U.deathOffer) declineDeathOffer();
    });
  U.shardRollOpen && U.shardRollOpen.addEventListener('click', () => openShardForge());
  U.forgeRollBtn && U.forgeRollBtn.addEventListener('click', () => rollShardForge());
  U.forgeKeepBtn && U.forgeKeepBtn.addEventListener('click', () => closeShardForge());
  U.shardForge &&
    U.shardForge.addEventListener('pointerdown', e => {
      if (e.target === U.shardForge && !shardForgeRolled) closeShardForge();
    });
  document.addEventListener(
    'pointerdown',
    () => {
      try {
        audioInit();
      } catch (e) {}
    },
    { passive: true }
  );
  document.getElementById('sound').onclick = e => {
    SND.on = !SND.on;
    if (SND.master) SND.master.gain.value = SND.on ? 0.28 : 0;
    e.currentTarget.textContent = SND.on ? 'Sound: ON' : 'Sound: OFF';
    if (SND.on) {
      audioInit();
      if (gameStarted) startMusic();
      tone(440, 660, 0.08, 0.025, 'sine');
    } else stopMusic();
  };
  document.addEventListener('keydown', e => {
    try {
      audioInit();
    } catch (_) {}
    let k = e.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowdown', 'alt', 'control', 'shift', 'a'].includes(k))
      e.preventDefault();
    K.add(k);
    if (e.repeat) return;
    if (k === 'alt') jump();
    else if (k === 'control') attack();
    else if (k === 'a') skill();
    else if (k === 'shift') dash();
    else if (k === 'arrowdown') drop();
  });
  document.addEventListener('keyup', e => K.delete(e.key.toLowerCase()));
  document.getElementById('pause').onclick = e => {
    paused = !paused;
    e.currentTarget.textContent = paused ? 'Resume' : 'Pause';
  };
  document.getElementById('restart').onclick = reset;
  document
    .querySelectorAll('[data-tap]')
    .forEach(b => (b.onclick = () => (({ jump, attack, skill, dash })[b.dataset.tap] || (() => {}))()));
  document.querySelectorAll('[data-hold]').forEach(b => {
    let k = b.dataset.hold === 'left' ? 'arrowleft' : 'arrowright';
    b.onpointerdown = e => {
      e.preventDefault();
      K.add(k);
    };
    ['onpointerup', 'onpointercancel', 'onpointerleave'].forEach(ev => (b[ev] = () => K.delete(k)));
  });
  // Desktop remains primary; this layer only activates on touch-capable devices.
