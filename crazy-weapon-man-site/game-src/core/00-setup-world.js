(() => {
  'use strict';
  const C = document.getElementById('game'),
    X = C.getContext('2d'),
    W = C.width,
    H = C.height,
    G = 550,
    K = new Set();
  const U = {
    banner: document.getElementById('banner'),
    br: document.getElementById('br'),
    bn: document.getElementById('bn'),
    be: document.getElementById('be'),
    zone: document.getElementById('zone'),
    zt: document.getElementById('zt'),
    zs: document.getElementById('zs'),
    msg: document.getElementById('msg'),
    waveIntro: document.getElementById('waveIntro'),
    waveIntroTag: document.getElementById('waveIntroTag'),
    waveIntroCount: document.getElementById('waveIntroCount'),
    waveIntroName: document.getElementById('waveIntroName'),
    waveIntroHow: document.getElementById('waveIntroHow'),
    waveIntroHint: document.getElementById('waveIntroHint'),
    waveIntroFill: document.getElementById('waveIntroFill'),
    zoneLabel: document.getElementById('zoneLabel'),
    hpT: document.getElementById('hpT'),
    manaT: document.getElementById('manaT'),
    xpT: document.getElementById('xpT'),
    hp: document.getElementById('hp'),
    mana: document.getElementById('mana'),
    xp: document.getElementById('xp'),
    stats: document.getElementById('stats'),
    wType: document.getElementById('wType'),
    wName: document.getElementById('wName'),
    wArt: document.getElementById('wArt'),
    wInfo: document.getElementById('wInfo'),
    mastT: document.getElementById('mastT'),
    mastery: document.getElementById('mastery'),
    feed: document.getElementById('feed'),
    titleScreen: document.getElementById('titleScreen'),
    fsWArt: document.getElementById('fsWArt'),
    fsWName: document.getElementById('fsWName'),
    fsDps: document.getElementById('fsDps'),
    fsMeta: document.getElementById('fsMeta'),
    fsAttrs: document.getElementById('fsAttrs'),
    fsHp: document.getElementById('fsHp'),
    fsMp: document.getElementById('fsMp'),
    fsHpT: document.getElementById('fsHpT'),
    fsMpT: document.getElementById('fsMpT'),
    fsXp: document.getElementById('fsXp'),
    fsXpT: document.getElementById('fsXpT'),
    fsMastery: document.getElementById('fsMastery'),
    fsMasteryT: document.getElementById('fsMasteryT'),
    fsLv: document.getElementById('fsLv'),
    fsUpgrade: document.getElementById('fsUpgrade'),
    fsUpgradeName: document.getElementById('fsUpgradeName'),
    fsUpgradeGain: document.getElementById('fsUpgradeGain'),
    fsZone: document.getElementById('fsZone'),
    fsKills: document.getElementById('fsKills'),
    leaderboard: document.getElementById('leaderboard'),
    titleBest: document.getElementById('titleBest'),
    globalStatus: document.getElementById('globalStatus'),
    playerName: document.getElementById('playerName'),
    bossHud: document.getElementById('bossHud'),
    bossName: document.getElementById('bossName'),
    bossSub: document.getElementById('bossSub'),
    bossFill: document.getElementById('bossFill'),
    bossIntro: document.getElementById('bossIntro'),
    bossIntroName: document.getElementById('bossIntroName'),
    bossIntroLine: document.getElementById('bossIntroLine'),
    bossIntroQuote: document.getElementById('bossIntroQuote'),
    boonScreen: document.getElementById('boonScreen'),
    boonChoices: document.getElementById('boonChoices'),
    boonSub: document.getElementById('boonSub'),
    styleHud: document.getElementById('styleHud'),
    styleGrade: document.getElementById('styleGrade'),
    styleText: document.getElementById('styleText'),
    styleFill: document.getElementById('styleFill'),
    killChainHud: document.getElementById('killChainHud'),
    killChainTime: document.getElementById('killChainTime'),
    killChainCount: document.getElementById('killChainCount'),
    killChainBonus: document.getElementById('killChainBonus'),
    killChainFill: document.getElementById('killChainFill'),
    augmentHud: document.getElementById('augmentHud'),
    augmentName: document.getElementById('augmentName'),
    augmentDesc: document.getElementById('augmentDesc'),
    augmentTime: document.getElementById('augmentTime'),
    augmentFill: document.getElementById('augmentFill'),
    shardHud: document.getElementById('shardHud'),
    shardCount: document.getElementById('shardCount'),
    shardDesc: document.getElementById('shardDesc'),
    shardFill: document.getElementById('shardFill'),
    shardRollOpen: document.getElementById('shardRollOpen'),
    shardForge: document.getElementById('shardForge'),
    shardForgeTitle: document.getElementById('shardForgeTitle'),
    shardForgeSub: document.getElementById('shardForgeSub'),
    forgeD20: document.getElementById('forgeD20'),
    forgeD20Num: document.getElementById('forgeD20Num'),
    forgeBank: document.getElementById('forgeBank'),
    forgeQuality: document.getElementById('forgeQuality'),
    forgeOdds: document.getElementById('forgeOdds'),
    forgeResult: document.getElementById('forgeResult'),
    forgeResultName: document.getElementById('forgeResultName'),
    forgeResultMeta: document.getElementById('forgeResultMeta'),
    forgeResultCompare: document.getElementById('forgeResultCompare'),
    forgeRollBtn: document.getElementById('forgeRollBtn'),
    forgeKeepBtn: document.getElementById('forgeKeepBtn'),
    synergyBadge: document.getElementById('synergyBadge'),
    synergyName: document.getElementById('synergyName'),
    synergyDesc: document.getElementById('synergyDesc'),
    directorStamp: document.getElementById('directorStamp'),
    lockedAffix: document.getElementById('lockedAffix'),
    lockScreen: document.getElementById('lockScreen'),
    lockChoices: document.getElementById('lockChoices'),
    museumModal: document.getElementById('museumModal'),
    museumGrid: document.getElementById('museumGrid'),
    museumMeta: document.getElementById('museumMeta'),
    deathOffer: document.getElementById('deathOffer'),
    deathOfferTitle: document.getElementById('deathOfferTitle'),
    deathOfferBody: document.getElementById('deathOfferBody'),
    deathOfferPreview: document.getElementById('deathOfferPreview'),
    deathOfferArt: document.getElementById('deathOfferArt'),
    deathOfferName: document.getElementById('deathOfferName'),
    deathOfferStats: document.getElementById('deathOfferStats'),
    deathOfferFlavor: document.getElementById('deathOfferFlavor'),
    deathOfferTake: document.getElementById('deathOfferTake'),
    deathOfferLeave: document.getElementById('deathOfferLeave'),
    magicD20: document.getElementById('magicD20'),
    d20Num: document.getElementById('d20Num'),
    d20Result: document.getElementById('d20Result'),
    metaLicense: document.getElementById('metaLicense')
  };
  const Z = [
    {
      name: 'The Sword Graveyard',
      lv: 1,
      goal: 4,
      nextBoss: 'jr',
      map: 0,
      pool: ['stalker', 'crawler', 'blinker', 'bombchicken'],
      sub: 'Jr. has been leaving prototype weapons stuck in old battlefields. Survive his unpaid apprentices.',
      a: '#121a28',
      b: '#2b3d53',
      h: '#5d7795',
      bg: 'moon'
    },
    {
      name: 'Disco Crypt of Compliance',
      lv: 4,
      goal: 5,
      nextBoss: 'jr',
      map: 1,
      pool: ['crawler', 'wizard', 'shieldbro', 'blinker', 'bombchicken'],
      sub: 'Jr. moved weapon testing underground because the Graveyard Keeper filed a complaint.',
      a: '#0b1d1c',
      b: '#164d43',
      h: '#58d7b0',
      bg: 'disco'
    },
    {
      name: 'Tax Audit Volcano',
      lv: 7,
      goal: 5,
      nextBoss: 'jr',
      boss: 'jr',
      map: 2,
      pool: ['brute', 'roller', 'shieldbro', 'bombchicken', 'wizard'],
      sub: 'Jr. is just beyond the crater. His final apprentices are testing things with no safety scrolls.',
      a: '#29100b',
      b: '#702c16',
      h: '#ff7040',
      bg: 'volcano'
    },
    {
      name: 'Bone Dragon Feast Hall',
      lv: 10,
      goal: 5,
      nextBoss: 'bossman',
      map: 3,
      pool: ['taxman', 'shieldbro', 'blinker', 'mimic', 'sniper'],
      sub: 'Management has privatized the feast hall. Every skeleton now has a meeting summons.',
      a: '#11131e',
      b: '#32384f',
      h: '#8c93b3',
      bg: 'train'
    },
    {
      name: 'Cathedral of Bad Ideas',
      lv: 14,
      goal: 6,
      nextBoss: 'bossman',
      map: 4,
      pool: ['taxman', 'wizard', 'summoner', 'shieldbro', 'sniper', 'eyeball'],
      sub: 'Crazy Boss Man calls this an alignment ritual. The architecture calls it a threat.',
      a: '#190d29',
      b: '#4a2664',
      h: '#c46cff',
      bg: 'eyes'
    },
    {
      name: 'Frozen Meat Peaks',
      lv: 19,
      goal: 6,
      nextBoss: 'bossman',
      boss: 'bossman',
      map: 5,
      pool: ['taxman', 'sniper', 'roller', 'summoner', 'shieldbro', 'mimic'],
      sub: 'The executive retreat is a frozen mountain fortress, hostile and aggressively KPI-driven. Boss Man is next.',
      a: '#0d1c2a',
      b: '#35647d',
      h: '#9de4ff',
      bg: 'meat'
    },
    {
      name: "Dad's Storm Forge",
      lv: 25,
      goal: 7,
      nextBoss: 'sr',
      boss: 'sr',
      map: 6,
      pool: ['brute', 'roller', 'bombchicken', 'mimic', 'shieldbro', 'sniper', 'stalker'],
      sub: 'Runaway anvils, lightning-charged tongs, and Dad-level safety advice. Sr. is tuning something loud.',
      a: '#0b1028',
      b: '#334f78',
      h: '#a3caff',
      bg: 'storm'
    },
    {
      name: "Grandma's Armed Witch Cottage",
      lv: 29,
      goal: 6,
      nextBoss: 'grandma',
      boss: 'grandma',
      map: 4,
      pool: ['wraith', 'maw', 'mimic', 'summoner', 'bombchicken', 'crawler'],
      sub: 'Cookie tins bite. Casseroles are cursed. Grandma is waiting in the good rocking chair.',
      a: '#2a1422',
      b: '#70405b',
      h: '#ff9fc9',
      bg: 'grandma'
    },
    {
      name: 'The Hostile Takeover Citadel',
      lv: 34,
      goal: 6,
      nextBoss: 'ceo',
      boss: 'ceo',
      map: 0,
      pool: ['taxman', 'shieldbro', 'sniper', 'blinker', 'roller', 'eyeball'],
      sub: 'Every floor is a performance review. The CEO owns the floating staircases and most of your lunch break.',
      a: '#17130b',
      b: '#51451d',
      h: '#ffd24f',
      bg: 'ceo'
    },
    {
      name: 'The Sentient Armory Vault',
      lv: 39,
      goal: 8,
      nextBoss: 'weapon',
      boss: 'weapon',
      map: 6,
      pool: ['wizard', 'wraith', 'mimic', 'eyeball', 'brute', 'flyer', 'roller', 'blinker'],
      sub: 'The weapons have organized. The racks are empty because the inventory is hunting you.',
      a: '#090b12',
      b: '#252a3c',
      h: '#f5f7ff',
      bg: 'armory'
    }
  ];
  const APPROACH_THEMES = {
    jr: {
      name: 'CRAZY WEAPON MAN JR.',
      tag: "JR.'S WEAPON TEST GUILD",
      col: '#ff66d1',
      traits: ['caffeine', 'confetti', 'rabbitlauncher', 'sneeze'],
      aliases: {
        stalker: 'Prototype Sword Apprentice',
        crawler: 'Loose Ammo Gremlin',
        blinker: 'Teleporting Training Golem',
        bombchicken: 'Tactical Bomb Chicken',
        wizard: 'Particle-Effect Apprentice',
        shieldbro: 'Safety Gear Traitor',
        brute: 'Overcompensating Sparring Partner',
        roller: 'Runaway Siege Cart'
      }
    },
    bossman: {
      name: 'CRAZY BOSS MAN',
      tag: 'MANDATORY GUILD TRAINING',
      col: '#ffb34d',
      traits: ['auditbarrage', 'coupon', 'motivational', 'moonwalk'],
      aliases: {
        taxman: 'Quarterly Combat Auditor',
        shieldbro: 'Benefits-Denial Paladin',
        blinker: 'Backstab Associate',
        mimic: 'Expense-Report Mimic',
        sniper: 'Long-Range Performance Reviewer',
        wizard: 'Slideshow Warlock',
        summoner: 'Middle-Management Necromancer',
        eyeball: 'Management Surveillance Eye',
        roller: 'Aggressive Throne on Wheels'
      }
    },
    sr: {
      name: 'CRAZY WEAPON MAN SR.',
      tag: "DAD'S FORGE CREW",
      col: '#79f6ff',
      traits: ['microwave', 'banana', 'soap', 'goose'],
      aliases: {
        brute: 'Forge-Door Brute',
        roller: 'Runaway Anvil Cart',
        bombchicken: 'Lightning-Rod Chicken',
        mimic: 'Definitely Normal Toolchest',
        shieldbro: "Dad's Safety Squire",
        sniper: 'Across-the-Valley Ballista Guy',
        stalker: 'Chain-Whip Swordsman'
      }
    },
    grandma: {
      name: 'CRAZY WEAPON GRANDMA',
      tag: 'ARMED FAMILY VISIT',
      col: '#ff9fc9',
      traits: ['coupon', 'rabbitlauncher', 'motivational', 'sneeze'],
      aliases: {
        wraith: 'Casserole Spirit',
        maw: 'Hungry Grandchild Maw',
        mimic: 'Cookie-Tin Mimic',
        summoner: 'Coven-Basement Necromancer',
        bombchicken: 'Rotisserie Combat Chicken',
        crawler: 'Carpet Gremlin'
      }
    },
    ceo: {
      name: 'CRAZY CEO MAN',
      tag: 'HOSTILE TAKEOVER LEGION',
      col: '#ffd24f',
      traits: ['auditbarrage', 'motivational', 'caffeine', 'coupon'],
      aliases: {
        taxman: 'Senior Revenue Executioner',
        shieldbro: 'Golden-Parachute Knight',
        sniper: 'Boardroom Crossbowman',
        blinker: 'Restructuring Shade',
        roller: 'Executive Throne of Violence',
        eyeball: 'Shareholder Scrying Orb'
      }
    },
    weapon: {
      name: 'THE WEAPON ITSELF',
      tag: 'SENTIENT INVENTORY',
      col: '#f5f7ff',
      traits: ['rainbowbreath', 'microwave', 'confetti', 'goose', 'sneeze'],
      aliases: {
        wizard: 'Possessed Wand Rack',
        wraith: 'Discarded Blade Ghost',
        mimic: 'Weapon Crate With Teeth',
        eyeball: 'Floating Spyglass Array',
        brute: 'Hammer Assembly',
        flyer: 'Autonomous Bow Limb',
        roller: 'Rolling Arsenal Core',
        blinker: 'Teleporting Dagger Cluster'
      }
    }
  };
  function approachTheme() {
    let key = Z[zoneI]?.nextBoss || 'jr';
    return APPROACH_THEMES[key] || APPROACH_THEMES.jr;
  }
  function approachLabel() {
    let t = approachTheme();
    return `NEXT BOSS: ${t.name}`;
  }

  const L = [
    [
      { x: 120, y: 525, w: 230, h: 18 },
      { x: 500, y: 445, w: 230, h: 18 },
      { x: 900, y: 520, w: 210, h: 18 }
    ],
    [
      { x: 105, y: 545, w: 210, h: 18 },
      { x: 410, y: 465, w: 220, h: 18 },
      { x: 770, y: 400, w: 235, h: 18 }
    ],
    [
      { x: 160, y: 505, w: 200, h: 18 },
      { x: 535, y: 430, w: 230, h: 18 },
      { x: 930, y: 510, w: 195, h: 18 }
    ],
    [
      { x: 85, y: 530, w: 220, h: 18 },
      { x: 440, y: 455, w: 220, h: 18 },
      { x: 840, y: 525, w: 250, h: 18 }
    ],
    [
      { x: 140, y: 480, w: 220, h: 18 },
      { x: 520, y: 400, w: 220, h: 18 },
      { x: 915, y: 480, w: 200, h: 18 }
    ],
    [
      { x: 110, y: 535, w: 220, h: 18 },
      { x: 470, y: 430, w: 225, h: 18 },
      { x: 900, y: 530, w: 210, h: 18 }
    ],
    [
      { x: 155, y: 470, w: 210, h: 18 },
      { x: 520, y: 365, w: 230, h: 18 },
      { x: 910, y: 465, w: 220, h: 18 }
    ]
  ];
  const HC = [
    [1, 78],
    [2, 98],
    [3, 125],
    [4, 158],
    [5, 198],
    [6, 245],
    [7, 302],
    [8, 370],
    [9, 450],
    [10, 545],
    [12, 770],
    [14, 1060],
    [16, 1420],
    [19, 2050],
    [22, 2850],
    [25, 3900],
    [29, 5350],
    [33, 7200],
    [38, 9800],
    [45, 14200]
  ];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)),
    rand = (a, b) => a + Math.random() * (b - a),
    ri = (a, b) => Math.floor(rand(a, b + 1)),
    pick = a => a[ri(0, a.length - 1)],
    rect = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  function segRect(x1, y1, x2, y2, r, pad = 0) {
    let minX = r.x - pad,
      maxX = r.x + r.w + pad,
      minY = r.y - pad,
      maxY = r.y + r.h + pad;
    let dx = x2 - x1,
      dy = y2 - y1,
      t0 = 0,
      t1 = 1;
    for (const [p, q] of [
      [-dx, x1 - minX],
      [dx, maxX - x1],
      [-dy, y1 - minY],
      [dy, maxY - y1]
    ]) {
      if (p === 0) {
        if (q < 0) return false;
        continue;
      }
      let t = q / p;
      if (p < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
    return true;
  }
  function bowAim(baseAngle = 0) {
    let dir = attackDir(curW()),
      candidates = E.filter(e => !e.dead && Math.sign(e.x + e.w / 2 - (pl.x + pl.w / 2)) === dir).sort(
        (a, b) => Math.abs(a.x - pl.x) - Math.abs(b.x - pl.x)
      );
    let t = candidates[0];
    if (!t) return baseAngle;
    let dx = Math.max(1, Math.abs(t.x + t.w / 2 - (pl.x + 17))),
      dy = t.y + t.h / 2 - (pl.y + 18),
      a = Math.atan2(dy, dx);
    return clamp(a, -0.62, 0.62) + baseAngle;
  }
  function mobHP(l) {
    l = clamp(l, HC[0][0], HC.at(-1)[0]);
    for (let i = 0; i < HC.length - 1; i++) {
      let a = HC[i],
        b = HC[i + 1];
      if (l >= a[0] && l <= b[0]) {
        let t = (l - a[0]) / (b[0] - a[0]);
        return Math.round(a[1] + (b[1] - a[1]) * t);
      }
    }
    return HC.at(-1)[1];
  }
  const baseD = l => Math.round(20 * Math.pow(1.092, Math.max(0, l - 1)));

  function buildMap(z) {
    let mz = Z[z]?.map ?? Math.min(z, 6),
      v = ri(0, 2),
      ps = [],
      scene = { kind: 'weird', variant: v, water: null, hills: [], mountains: [], props: [], platforms: ps };
    const add = (x, y, w, h = 18, tag = 'metal') => ps.push({ x, y, w, h, tag });
    if (mz === 0) {
      scene.kind = 'swordhills';
      scene.hills = [
        { x: 35, w: 310, h: 90 },
        { x: 870, w: 340, h: 120 }
      ];
      if (v === 0) {
        add(80, 548, 210);
        add(365, 482, 180);
        add(620, 425, 175);
        add(900, 500, 210);
      } else if (v === 1) {
        add(110, 510, 190);
        add(390, 455, 225);
        add(760, 520, 170);
        add(980, 438, 170);
      } else {
        add(55, 560, 170);
        add(285, 500, 155);
        add(510, 438, 190);
        add(785, 500, 155);
        add(1010, 555, 170);
      }
    } else if (mz === 1) {
      scene.kind = 'sewerriver';
      let rx = v === 0 ? 500 : v === 1 ? 230 : 760;
      scene.water = { x: rx, w: 260, col: '#36f0b9', name: 'NEON SEWAGE' };
      if (v === 0) {
        add(90, 505, 190);
        add(350, 440, 130);
        add(535, 515, 95, 18, 'stone');
        add(675, 435, 140);
        add(930, 505, 190);
      } else if (v === 1) {
        add(70, 450, 190);
        add(290, 535, 100, 18, 'stone');
        add(430, 470, 120);
        add(640, 405, 160);
        add(900, 520, 220);
      } else {
        add(100, 530, 210);
        add(400, 450, 180);
        add(690, 520, 100, 18, 'stone');
        add(845, 430, 145);
        add(1040, 525, 130);
      }
    } else if (mz === 2) {
      scene.kind = 'volcanomountain';
      scene.mountains = [{ cx: v === 1 ? 350 : 930, peak: 185, base: 420 }];
      if (v === 0) {
        add(70, 540, 180);
        add(300, 500, 140);
        add(490, 455, 135);
        add(665, 405, 135);
        add(855, 465, 145);
        add(1050, 530, 150);
      } else if (v === 1) {
        add(70, 535, 165);
        add(270, 470, 145);
        add(455, 400, 150);
        add(690, 465, 160);
        add(930, 520, 200);
      } else {
        add(90, 515, 200);
        add(360, 430, 180);
        add(650, 350, 170);
        add(880, 435, 170);
        add(1080, 535, 120);
      }
      scene.water = { x: v === 2 ? 430 : 570, w: 170, col: '#ff5426', name: 'UNION LAVA' };
    } else if (mz === 3) {
      scene.kind = 'boneravine';
      scene.water = { x: v === 0 ? 520 : v === 1 ? 170 : 860, w: 220, col: '#65718c', name: 'SOUP RAVINE' };
      if (v === 0) {
        add(70, 520, 180);
        add(330, 450, 150);
        add(535, 390, 120, 18, 'bone');
        add(710, 455, 150);
        add(980, 520, 180);
      } else if (v === 1) {
        add(70, 420, 160);
        add(270, 510, 100, 18, 'bone');
        add(440, 455, 180);
        add(690, 390, 160);
        add(930, 470, 210);
      } else {
        add(70, 530, 210);
        add(360, 455, 165);
        add(620, 390, 150);
        add(825, 500, 100, 18, 'bone');
        add(995, 430, 180);
      }
    } else if (mz === 4) {
      scene.kind = 'cathedral';
      if (v === 0) {
        add(80, 525, 180);
        add(330, 430, 170);
        add(555, 335, 170);
        add(800, 430, 170);
        add(1030, 525, 160);
      } else if (v === 1) {
        add(100, 450, 180);
        add(390, 535, 160);
        add(650, 400, 180);
        add(930, 300, 170);
      } else {
        add(55, 550, 180);
        add(275, 465, 140);
        add(490, 380, 140);
        add(705, 465, 140);
        add(925, 380, 140);
        add(1090, 520, 120);
      }
    } else if (mz === 5) {
      scene.kind = 'meatice';
      scene.water = {
        x: v === 0 ? 330 : v === 1 ? 690 : 500,
        w: 270,
        col: '#76dfff',
        name: 'MEAT GLACIER JUICE'
      };
      if (v === 0) {
        add(70, 490, 190, 18, 'ice');
        add(310, 420, 110, 18, 'ice');
        add(500, 520, 110, 18, 'ice');
        add(690, 430, 170, 18, 'ice');
        add(980, 510, 190, 18, 'ice');
      } else if (v === 1) {
        add(80, 530, 160, 18, 'ice');
        add(300, 455, 160, 18, 'ice');
        add(540, 380, 150, 18, 'ice');
        add(760, 510, 110, 18, 'ice');
        add(930, 430, 190, 18, 'ice');
      } else {
        add(65, 450, 190, 18, 'ice');
        add(340, 525, 140, 18, 'ice');
        add(565, 445, 160, 18, 'ice');
        add(825, 365, 160, 18, 'ice');
        add(1050, 505, 140, 18, 'ice');
      }
    } else {
      scene.kind = 'weatherislands';
      if (v === 0) {
        add(80, 520, 180, 18, 'cloud');
        add(340, 405, 170, 18, 'cloud');
        add(590, 500, 150, 18, 'cloud');
        add(820, 350, 180, 18, 'cloud');
        add(1060, 500, 120, 18, 'cloud');
      } else if (v === 1) {
        add(60, 430, 170, 18, 'cloud');
        add(300, 520, 150, 18, 'cloud');
        add(540, 360, 190, 18, 'cloud');
        add(830, 480, 150, 18, 'cloud');
        add(1040, 400, 170, 18, 'cloud');
      } else {
        add(80, 540, 160, 18, 'cloud');
        add(285, 455, 150, 18, 'cloud');
        add(500, 370, 150, 18, 'cloud');
        add(720, 455, 150, 18, 'cloud');
        add(935, 370, 150, 18, 'cloud');
        add(1090, 515, 110, 18, 'cloud');
      }
    }
    return scene;
  }
  function applyMap(z) {
    mapScene = buildMap(z);
    mapScene.platforms = mapScene.platforms.map(p => ({ ...p, y: p.y - 25 }));
    platforms = mapScene.platforms;
    return mapScene;
  }
  function spawnSpots() {
    let pts = [];
    for (const p of platforms) {
      pts.push({ x: p.x + 28, y: p.y, plat: p });
      pts.push({ x: p.x + p.w - 70, y: p.y, plat: p });
    }
    for (let i = 0; i < 7; i++) {
      let x = 70 + i * 180 + rand(-35, 35);
      if (mapScene.water && x > mapScene.water.x - 40 && x < mapScene.water.x + mapScene.water.w + 40)
        continue;
      pts.push({ x: clamp(x, 35, W - 90), y: G, plat: null });
    }
    return pts.filter(a => Math.abs(a.x - pl.x) > 230);
  }
  function inMapWater(x) {
    return !!(mapScene.water && x > mapScene.water.x && x < mapScene.water.x + mapScene.water.w);
  }
