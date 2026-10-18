  let lastPortraitId = null,
    lastPortraitT = -99;
  let platforms = L[0],
    mapScene = { kind: 'lot', platforms: L[0], water: null, hills: [] },
    zoneI = 0,
    pack = 1,
    packDelay = 0.6,
    zoneT = 0,
    master = 0,
    stageClears = 0,
    riftReady = false,
    riftX = 1100,
    riftEnterT = 0,
    levelUpT = 0,
    levelUpLv = 1,
    kills = 0,
    ones = 0,
    time = 0,
    last = performance.now(),
    paused = false,
    over = false,
    next = 1,
    shake = 0,
    stop = 0,
    flash = 0,
    chroma = 0,
    bannerT = 0,
    lootSlow = 0,
    gameStarted = false,
    hudUpgradeT = 0,
    fxBudget = 260;
  let E = [],
    D = [],
    P = [],
    Q = [],
    F = [],
    T = [],
    feed = [],
    earlyWeaponPity = false,
    earlyFunnyGiven = false,
    earlyFunnyKill = 3,
    equipTypeHistory = ['sword'],
    weaponDryKills = 0,
    weaponDropsThisRun = 0,
    armorDryKills = 0;
  let runSeed = ((Math.random() * 0xffffffff) >>> 0).toString(16).toUpperCase().padStart(8, '0'),
    packStartedAt = 0,
    packLive = false,
    goodClears = 0,
    upgradeMeter = 0,
    chaosEvent = null,
    chaosT = 0,
    chaosTick = 0,
    terrainMode = null,
    terrainDir = 1,
    terrainTick = 0,
    terrainHazards = [],
    terrainPadCd = 0;
  let bossMode = null,
    bossActive = false,
    bossIntroT = 0,
    bossVictoryT = 0,
    bossFlags = { jr: false, bossman: false, sr: false, grandma: false, ceo: false, weapon: false },
    bossHazards = [],
    bossArenaVariant = 0,
    boonChoosing = false,
    bossHistory = {},
    bossOrdinal = 0;
  let boonsTaken = [];
  let styleScore = 0,
    styleT = 0,
    styleLastGrade = 'WARMING UP',
    directorEvent = null,
    directorTrait = null,
    directorReward = false,
    synergyT = 0;
  let killChainCount = 0,
    killChainT = 0,
    killChainBonusTotal = 0,
    killChainBest = 0,
    killChainWindow = 1.85,
    waveHistory = [];
  let waveIntroT = 0;
  let tempAugment = null,
    rareEnemySeen = 0;
  let weaponShards = 0,
    shardForgeOpen = false,
    shardForgeRolling = false,
    shardForgeRolled = false,
    shardForgeWeapon = null,
    shardForgeRoll = 0,
    shardForgeSpend = 0,
    shardPrompted = false;
  let deathOfferOpen = false,
    deathOfferWeapon = null,
    deathOfferBoss = null,
    bossRescueUsed = false,
    superT = 0,
    superPower = 1,
    superRoll = 0,
    deathRoll = 0,
    deathRolling = false,
    deathFateRolled = false,
    deathFate = null;
  let museum = { highest: null, rarest: null, longest: null, weirdest: null, bossKills: [] },
    metaXP = 0,
    metaLevel = 0;
  const MUSEUM_KEY = 'crazyWeaponMan.museum.v1',
    META_KEY = 'crazyWeaponMan.weirdness.v1';
  const BOSS_HISTORY_KEY = 'crazyWeaponMan.bossHistory.v1';
  const bossTarget = n => (n === 1 ? 0.66 : n === 2 ? 0.5 : Math.max(0.2, 0.4 - (n - 3) * 0.08));
  function loadBossHistory() {
    try {
      bossHistory = JSON.parse(localStorage.getItem(BOSS_HISTORY_KEY) || '{}') || {};
    } catch (_) {
      bossHistory = {};
    }
  }
  function saveBossHistory() {
    try {
      localStorage.setItem(BOSS_HISTORY_KEY, JSON.stringify(bossHistory));
    } catch (_) {}
  }
  function bossRecord(kind, win) {
    let h = bossHistory[kind] || { attempts: 0, wins: 0 };
    h.attempts++;
    if (win) h.wins++;
    bossHistory[kind] = h;
    saveBossHistory();
  }
  function bossAdaptive(kind, n) {
    let h = bossHistory[kind] || { attempts: 0, wins: 0 },
      target = bossTarget(n),
      rate = (h.wins + target * 4) / (h.attempts + 4);
    return clamp(1 + (rate - target) * 1.6, 0.78, 1.38);
  }
  function loadMeta() {
    try {
      museum = JSON.parse(localStorage.getItem(MUSEUM_KEY) || 'null') || museum;
    } catch (_) {}
    try {
      metaXP = Number(localStorage.getItem(META_KEY) || 0) || 0;
    } catch (_) {
      metaXP = 0;
    }
    metaLevel = Math.min(META_TRAITS.length, Math.floor(metaXP / 3));
    renderMuseum();
  }
  function saveMeta() {
    try {
      localStorage.setItem(MUSEUM_KEY, JSON.stringify(museum));
      localStorage.setItem(META_KEY, String(metaXP));
    } catch (_) {}
    metaLevel = Math.min(META_TRAITS.length, Math.floor(metaXP / 3));
    if (U.metaLicense)
      U.metaLicense.textContent = `WEIRDNESS LICENSE Lv. ${metaLevel} • ${metaXP} evidence points`;
  }
  function awardMeta(n = 1, why = '') {
    let before = metaLevel;
    metaXP += n;
    saveMeta();
    if (metaLevel > before) {
      txt(W / 2, 188, `WEIRDNESS LICENSE Lv. ${metaLevel}`, '#91ffd7', true);
      U.msg.textContent = `Meta unlock: ${META_TRAITS[metaLevel - 1]?.n || 'more nonsense'} is now in the weapon pool.${why ? ' ' + why : ''}`;
    }
  }
  function weaponSnapshot(w, dps = estimateDPS(w)) {
    return {
      name: w.name,
      rar: w.rar,
      type: WM[w.type]?.label || w.type,
      col: w.col,
      dps: Math.round(dps),
      seed: runSeed,
      traits: (w.traits || []).map(t => t.n),
      material: w.material?.n || '',
      synergy: w.synergy?.name || '',
      when: new Date().toISOString()
    };
  }
  function renderMuseum() {
    if (!U.museumGrid) return;
    let cards = [];
    for (const [k, label] of [
      ['highest', 'HIGHEST DPS'],
      ['rarest', 'RAREST FIND'],
      ['longest', 'LONGEST BAD DECISION'],
      ['weirdest', 'MOST AFFLICTED']
    ]) {
      let r = museum[k];
      cards.push(
        `<div class="museumItem"><div class="k">${label}</div>${r ? `<div class="n" style="color:${r.col || '#fff'}">${escapeHtml(r.name)}</div><div class="m">${escapeHtml(r.rar)} ${escapeHtml(r.type)} • ${Number(r.dps || 0).toLocaleString()} DPS${r.synergy ? ` • ${escapeHtml(r.synergy)}` : ''}</div>` : '<div class="m">Nothing irresponsible enough yet.</div>'}</div>`
      );
    }
    let bk = (museum.bossKills || []).slice(-4).reverse();
    cards.push(
      `<div class="museumItem" style="grid-column:1/-1"><div class="k">BOSS-KILLING WEAPONS</div>${bk.length ? bk.map(x => `<div class="m"><b style="color:${x.col}">${escapeHtml(x.name)}</b> defeated ${escapeHtml(x.boss)}</div>`).join('') : '<div class="m">The bosses remain undocumented victims.</div>'}</div>`
    );
    U.museumGrid.innerHTML = cards.join('');
    if (U.museumMeta)
      U.museumMeta.textContent = `Weirdness License Lv. ${metaLevel} • ${metaXP} evidence points • unlocks stranger traits, not free damage.`;
    if (U.metaLicense)
      U.metaLicense.textContent = `WEIRDNESS LICENSE Lv. ${metaLevel} • ${metaXP} evidence points`;
  }
  function updateMuseum(w, dps) {
    if (!w || w.rar === 'Training') return;
    let snap = weaponSnapshot(w, dps),
      rank = rarityIndex(w),
      weird = (w.traits || []).length + (w.material ? 1 : 0) + (w.synergy ? 3 : 0);
    if (!museum.highest || dps > museum.highest.dps) museum.highest = snap;
    if (!museum.rarest || rank > RANKS.indexOf(museum.rarest.rar)) museum.rarest = snap;
    if (!museum.longest || w.name.length > museum.longest.name.length) museum.longest = snap;
    if (!museum.weirdest || weird > (museum.weirdest.weird || 0)) {
      snap.weird = weird;
      museum.weirdest = snap;
    }
    saveMeta();
    renderMuseum();
  }
  function recordBossMuseum(kind, w) {
    let snap = weaponSnapshot(w);
    snap.boss = BOSS[kind]?.name || kind;
    museum.bossKills = (museum.bossKills || []).concat(snap).slice(-12);
    saveMeta();
    renderMuseum();
  }
