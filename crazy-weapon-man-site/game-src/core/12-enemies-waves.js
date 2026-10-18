  const ED = {
    crawler: {
      w: 34,
      h: 30,
      hp: 0.72,
      dmg: 0.8,
      sp: 150,
      range: 35,
      wind: 0.28,
      col: '#5f7c74',
      shape: 'crawler',
      atk: 'leap'
    },
    stalker: {
      w: 38,
      h: 46,
      hp: 1,
      dmg: 1,
      sp: 108,
      range: 58,
      wind: 0.46,
      col: '#667883',
      shape: 'human',
      atk: 'hack'
    },
    brute: {
      w: 60,
      h: 68,
      hp: 1.4,
      dmg: 1.55,
      sp: 64,
      range: 84,
      wind: 0.78,
      col: '#7d545a',
      shape: 'brute',
      atk: 'cleave'
    },
    wraith: {
      w: 34,
      h: 50,
      hp: 0.78,
      dmg: 0.95,
      sp: 98,
      range: 285,
      wind: 0.64,
      col: '#536a91',
      shape: 'wraith',
      atk: 'fireball',
      bolt: '#ff713d'
    },
    maw: {
      w: 72,
      h: 52,
      hp: 1.18,
      dmg: 1.25,
      sp: 88,
      range: 64,
      wind: 0.48,
      col: '#805e73',
      shape: 'maw',
      atk: 'bite'
    },
    flyer: {
      w: 44,
      h: 36,
      hp: 0.68,
      dmg: 0.9,
      sp: 112,
      range: 240,
      wind: 0.54,
      col: '#6a5f94',
      shape: 'flyer',
      atk: 'fireball',
      bolt: '#b993ff',
      air: true
    },
    wizard: {
      w: 42,
      h: 55,
      hp: 0.88,
      dmg: 1.08,
      sp: 78,
      range: 305,
      wind: 0.72,
      col: '#6b43a5',
      shape: 'wizard',
      atk: 'fireball',
      bolt: '#ff4f28'
    },
    taxman: {
      w: 40,
      h: 50,
      hp: 0.95,
      dmg: 0.92,
      sp: 92,
      range: 285,
      wind: 0.66,
      col: '#445069',
      shape: 'taxman',
      atk: 'fireball',
      bolt: '#ff4167'
    },
    mimic: {
      w: 62,
      h: 46,
      hp: 1.12,
      dmg: 1.35,
      sp: 92,
      range: 62,
      wind: 0.5,
      col: '#8b663d',
      shape: 'mimic',
      atk: 'bite'
    },
    eyeball: {
      w: 46,
      h: 46,
      hp: 0.76,
      dmg: 1.03,
      sp: 105,
      range: 265,
      wind: 0.58,
      col: '#b968a3',
      shape: 'eyeball',
      atk: 'fireball',
      bolt: '#ff68df',
      air: true
    },
    bombchicken: {
      w: 38,
      h: 35,
      hp: 0.58,
      dmg: 1.3,
      sp: 178,
      range: 48,
      wind: 0.3,
      col: '#e9d58a',
      shape: 'chicken',
      atk: 'bomb'
    }
  };
  ED.shieldbro = {
    w: 50,
    h: 58,
    hp: 1.18,
    dmg: 1.2,
    sp: 74,
    range: 62,
    wind: 0.58,
    col: '#546c7a',
    shape: 'shield',
    atk: 'bash',
    name: 'Shield Accountant'
  };
  ED.blinker = {
    w: 36,
    h: 48,
    hp: 0.78,
    dmg: 1.2,
    sp: 118,
    range: 58,
    wind: 0.3,
    col: '#8c55cc',
    shape: 'blinker',
    atk: 'blink',
    name: 'Backstab Intern'
  };
  ED.summoner = {
    w: 43,
    h: 56,
    hp: 0.9,
    dmg: 0.78,
    sp: 66,
    range: 250,
    wind: 0.72,
    col: '#5a8b62',
    shape: 'summoner',
    atk: 'summon',
    name: 'Middle-Management Necromancer'
  };
  ED.sniper = {
    w: 42,
    h: 50,
    hp: 0.72,
    dmg: 1.32,
    sp: 72,
    range: 440,
    wind: 1.02,
    col: '#83574c',
    shape: 'sniper',
    atk: 'laser',
    bolt: '#ffdd77',
    name: 'OSHA Sniper'
  };
  ED.roller = {
    w: 48,
    h: 48,
    hp: 1.05,
    dmg: 1.3,
    sp: 120,
    range: 85,
    wind: 0.55,
    col: '#7b8794',
    shape: 'roller',
    atk: 'charge',
    name: 'Aggressive Office Wheel'
  };
  ED.bossjr = {
    w: 92,
    h: 96,
    hp: 13,
    dmg: 1.45,
    sp: 150,
    range: 100,
    wind: 0.45,
    col: '#ff66d1',
    shape: 'bossjr',
    atk: 'boss',
    name: 'Crazy Weapon Man Jr.',
    boss: true
  };
  ED.bossman = {
    w: 128,
    h: 136,
    hp: 34,
    dmg: 1.75,
    sp: 90,
    range: 150,
    wind: 0.65,
    col: '#ffb34d',
    shape: 'bossman',
    atk: 'boss',
    name: 'Crazy Boss Man',
    boss: true
  };
  ED.bosssr = {
    w: 118,
    h: 126,
    hp: 48,
    dmg: 2.02,
    sp: 125,
    range: 145,
    wind: 0.52,
    col: '#79f6ff',
    shape: 'bosssr',
    atk: 'boss',
    name: 'Crazy Weapon Man Sr.',
    boss: true
  };
  ED.bossgrandma = {
    w: 112,
    h: 122,
    hp: 58,
    dmg: 2.12,
    sp: 108,
    range: 170,
    wind: 0.58,
    col: '#ff9fc9',
    shape: 'bossgrandma',
    atk: 'boss',
    name: 'Crazy Weapon Grandma',
    boss: true
  };
  ED.bossceo = {
    w: 138,
    h: 145,
    hp: 72,
    dmg: 2.28,
    sp: 96,
    range: 190,
    wind: 0.66,
    col: '#ffd24f',
    shape: 'bossceo',
    atk: 'boss',
    name: 'Crazy CEO Man',
    boss: true
  };
  ED.bossweapon = {
    w: 150,
    h: 150,
    hp: 88,
    dmg: 2.45,
    sp: 145,
    range: 180,
    wind: 0.48,
    col: '#ffffff',
    shape: 'bossweapon',
    atk: 'boss',
    name: 'THE WEAPON ITSELF',
    boss: true
  };

  const ENEMY_TRAITS = [
    {
      id: 'poisonfart',
      name: 'Poison Farts',
      tag: 'TOXIC REAR END',
      col: '#86ff68',
      desc: 'periodically leaves a lingering poison cloud behind itself'
    },
    {
      id: 'rainbowbreath',
      name: 'Flaming Rainbow Breath',
      tag: 'RAINBOW BREATH',
      col: '#ff78e9',
      desc: 'breathes a bright cone of multi-color fireballs'
    },
    {
      id: 'rabbitlauncher',
      name: 'Rabbit Launcher',
      tag: 'RABBIT DEPLOYED',
      col: '#f7f0d0',
      desc: 'fires weaponized rabbits that bounce across the floor'
    },
    {
      id: 'auditbarrage',
      name: 'Audit Barrage',
      tag: 'SURPRISE AUDIT',
      col: '#ff5577',
      desc: 'throws a fan of hostile receipts that drain mana'
    },
    {
      id: 'sneeze',
      name: 'Weaponized Sneezing',
      tag: 'ACHOO!',
      col: '#b9efff',
      desc: 'sneezes a disgusting spread of high-speed projectiles'
    },
    {
      id: 'coupon',
      name: 'Coupon Shrapnel',
      tag: 'SAVE 15% OR DIE',
      col: '#ffe86d',
      desc: 'detonates expired coupons in every direction'
    },
    {
      id: 'caffeine',
      name: 'Dangerously Caffeinated',
      tag: 'TOO MUCH COFFEE',
      col: '#d7985e',
      desc: 'gets random bursts of irresponsible movement speed'
    },
    {
      id: 'moonwalk',
      name: 'Combat Moonwalker',
      tag: 'TACTICAL MOONWALK',
      col: '#d9d9ff',
      desc: 'occasionally attacks while sliding backward'
    },
    {
      id: 'soap',
      name: 'Covered In Dish Soap',
      tag: 'EXTREMELY SLIPPERY',
      col: '#77e8ff',
      desc: 'randomly slides and ricochets off arena edges'
    },
    {
      id: 'confetti',
      name: 'Confetti Organ Failure',
      tag: 'PARTY EMERGENCY',
      col: '#ff9df2',
      desc: 'taking hits can spray distracting confetti projectiles'
    },
    {
      id: 'motivational',
      name: 'Aggressively Motivational',
      tag: 'BELIEVE IN YOURSELF!',
      col: '#ffcf6f',
      desc: 'yells encouragement and briefly buffs nearby enemies'
    },
    {
      id: 'goose',
      name: 'Haunted By A Goose',
      tag: 'HONK INCIDENT',
      col: '#f5f5dd',
      desc: 'summons an angry spectral goose that charges the player'
    },
    {
      id: 'microwave',
      name: 'Microwave Vision',
      tag: 'MICROWAVE EYES',
      col: '#ff9257',
      desc: 'fires a short-range heating beam after a warning'
    },
    {
      id: 'banana',
      name: 'Banana Peel Technician',
      tag: 'BANANA DEPLOYED',
      col: '#fff46b',
      desc: 'throws slippery banana hazards onto the ground'
    }
  ];
  function rollEnemyTraits(elite = false, type = '') {
    let theme = approachTheme(),
      preferred = new Set(theme.traits || []),
      pool = ENEMY_TRAITS.filter(t => !(type === 'taxman' && t.id === 'auditbarrage'));
    let themed = pool.filter(t => preferred.has(t.id)),
      other = pool.filter(t => !preferred.has(t.id));
    pool = [...themed, ...other];
    let n = elite
        ? 2 + (zoneI >= 4 && Math.random() < 0.4 ? 1 : 0)
        : 1 + (zoneI >= 3 && Math.random() < 0.34 ? 1 : 0),
      out = [];
    while (out.length < n && pool.length) {
      let chooseTheme = themed.length && Math.random() < 0.78,
        t = chooseTheme ? pick(themed) : pick(pool),
        i = pool.indexOf(t);
      if (i >= 0) pool.splice(i, 1);
      themed = themed.filter(x => x !== t);
      out.push(t);
    }
    return out;
  }
  function enemyCombo(e) {
    let ids = (e.traits || []).map(t => t.id),
      has = (a, b) => ids.includes(a) && ids.includes(b);
    if (has('poisonfart', 'rabbitlauncher')) return { name: 'BIOHAZARD BUNNY', col: '#aaff72' };
    if (has('coupon', 'auditbarrage')) return { name: 'FINANCIAL WAR CRIME', col: '#ffd66b' };
    if (has('caffeine', 'moonwalk')) return { name: 'ESPRESSO CRABWALK', col: '#cbb5ff' };
    if (has('banana', 'soap')) return { name: 'FLOOR LIABILITY', col: '#8ffff0' };
    if (has('rainbowbreath', 'microwave')) return { name: 'AIR FRYER AURORA', col: '#ff93e7' };
    if (has('goose', 'motivational')) return { name: 'LEADERSHIP GOOSE', col: '#fff6bd' };
    return null;
  }
  function enemyTraitText(e) {
    let c = enemyCombo(e);
    return c ? c.name : (e.traits || []).map(t => t.name).join(' + ');
  }
  function traitHas(e, id) {
    return (e.traits || []).some(t => t.id === id);
  }
  function traitProjectile(e, col, effect, vx, vy, dam = 0.55, r = 7, life = 2.4) {
    Q.push({
      x: e.x + e.w / 2,
      y: e.y + e.h * 0.42,
      vx,
      vy,
      r,
      life,
      dam: e.dmg * dam,
      col,
      trail: 0,
      effect,
      spin: rand(-7, 7),
      trait: true
    });
  }
  function triggerEnemyTrait(e, d) {
    if (!e.traits || !e.traits.length || e.dead || e.boss) return false;
    let t = pick(e.traits),
      sx = e.x + e.w / 2,
      sy = e.y + e.h * 0.45,
      dx = pl.x + pl.w / 2 - sx,
      dy = pl.y + pl.h * 0.45 - sy,
      len = Math.hypot(dx, dy) || 1,
      ux = dx / len,
      uy = dy / len;
    txt(sx, e.y - 34, t.tag, t.col, true);
    e.traitCd = rand(4.2, 7.2);
    let combo = enemyCombo(e);
    if (combo && Math.random() < 0.28) {
      txt(sx, e.y - 52, combo.name, combo.col, true);
      if (combo.name === 'BIOHAZARD BUNNY') {
        for (let i = -1; i <= 1; i++) {
          traitProjectile(e, '#f4eed8', 'rabbit', ux * 330 + i * 85, uy * 260 - 180, 0.38, 9, 3);
          Q.push({
            x: sx - i * 12,
            y: e.y + e.h - 8,
            vx: i * 25,
            vy: -20,
            r: 24,
            life: 2.4,
            dam: e.dmg * 0.14,
            col: '#86ff68',
            trail: 0,
            effect: 'gas',
            tick: 0,
            trait: true
          });
        }
      } else if (combo.name === 'FINANCIAL WAR CRIME') {
        for (let i = 0; i < 8; i++) {
          let a = (i * Math.PI) / 4;
          traitProjectile(
            e,
            i % 2 ? '#ff5577' : '#ffe86d',
            i % 2 ? 'audit' : 'coupon',
            Math.cos(a) * 380,
            Math.sin(a) * 380,
            0.24,
            6,
            2
          );
        }
      } else if (combo.name === 'ESPRESSO CRABWALK') {
        e.hypeT = 2.4;
        e.moonT = 2.4;
        e.vx = -e.dir * 580;
      } else if (combo.name === 'FLOOR LIABILITY') {
        e.soapT = 2.8;
        for (let i = 0; i < 3; i++)
          Q.push({
            x: sx + i * 35 - 35,
            y: sy,
            vx: (i - 1) * 140,
            vy: -220,
            r: 9,
            life: 3.6,
            dam: e.dmg * 0.12,
            col: '#fff46b',
            trail: 0,
            effect: 'banana',
            trait: true,
            bounces: 0
          });
      } else if (combo.name === 'AIR FRYER AURORA') {
        for (let i = -4; i <= 4; i++) {
          let a = i * 0.08,
            ca = Math.cos(a),
            sa = Math.sin(a);
          traitProjectile(
            e,
            `hsl(${(i + 4) * 40} 100% 65%)`,
            'burn',
            (ux * ca - uy * sa) * 480,
            (ux * sa + uy * ca) * 480,
            0.25,
            6,
            1.5
          );
        }
      } else if (combo.name === 'LEADERSHIP GOOSE') {
        for (const o of E) if (!o.dead && !o.boss && Math.hypot(o.x - e.x, o.y - e.y) < 240) o.motivateT = 3;
        traitProjectile(e, '#f5f5dd', 'goose', ux * 600, uy * 180, 0.6, 12, 2.2);
      }
      return true;
    }
    if (t.id === 'poisonfart') {
      let bx = sx - e.dir * 22;
      Q.push({
        x: bx,
        y: e.y + e.h - 10,
        vx: -e.dir * 35,
        vy: -25,
        r: 32,
        life: 3.2,
        dam: e.dmg * 0.22,
        col: '#86ff68',
        trail: 0,
        effect: 'gas',
        tick: 0,
        trait: true
      });
      part(bx, e.y + e.h - 8, '#86ff68', 12, 80, 9);
      return true;
    }
    if (t.id === 'rainbowbreath') {
      let cols = ['#ff5050', '#ffad3d', '#fff05a', '#66ff8b', '#58b8ff', '#a87aff', '#ff77dc'];
      for (let i = 0; i < 7; i++) {
        let a = (i - 3) * 0.09,
          ca = Math.cos(a),
          sa = Math.sin(a),
          vx = (ux * ca - uy * sa) * 420,
          vy = (ux * sa + uy * ca) * 420;
        traitProjectile(e, cols[i], 'rainbow', vx, vy, 0.38, 7, 1.45);
      }
      ring(sx, sy, '#ffffff', 42, 3);
      return true;
    }
    if (t.id === 'rabbitlauncher') {
      let sp = 360;
      traitProjectile(e, '#f4eed8', 'rabbit', ux * sp, uy * sp - 160, 0.62, 10, 4);
      return true;
    }
    if (t.id === 'auditbarrage') {
      for (let i = -2; i <= 2; i++) {
        let a = i * 0.1,
          ca = Math.cos(a),
          sa = Math.sin(a),
          vx = (ux * ca - uy * sa) * 410,
          vy = (ux * sa + uy * ca) * 410;
        traitProjectile(e, '#ff5577', 'audit', vx, vy, 0.33, 8, 2.7);
      }
      return true;
    }
    if (t.id === 'sneeze') {
      for (let i = -3; i <= 3; i++) {
        let a = i * 0.12,
          ca = Math.cos(a),
          sa = Math.sin(a),
          vx = (ux * ca - uy * sa) * 520,
          vy = (ux * sa + uy * ca) * 520;
        traitProjectile(e, '#b9efff', 'sneeze', vx, vy, 0.26, 5, 1.5);
      }
      part(sx, sy, '#dff9ff', 16, 170, 5);
      return true;
    }
    if (t.id === 'coupon') {
      for (let i = 0; i < 10; i++) {
        let a = (i * Math.PI * 2) / 10;
        traitProjectile(e, '#ffe86d', 'coupon', Math.cos(a) * 330, Math.sin(a) * 330, 0.24, 6, 2);
      }
      return true;
    }
    if (t.id === 'caffeine') {
      e.hypeT = 1.8;
      e.vx = e.dir * 420;
      part(sx, sy, '#d7985e', 14, 170, 5);
      return true;
    }
    if (t.id === 'moonwalk') {
      e.vx = -e.dir * 360;
      e.moonT = 1.15;
      F.push({ k: 'speed', x: sx, y: sy, dir: -e.dir, life: 0.35, max: 0.35, col: '#d9d9ff', n: 6 });
      return true;
    }
    if (t.id === 'soap') {
      e.soapT = 2.2;
      e.vx = (Math.random() < 0.5 ? -1 : 1) * 520;
      part(sx, sy, '#77e8ff', 12, 140, 6);
      return true;
    }
    if (t.id === 'confetti') {
      for (let i = 0; i < 12; i++) {
        let a = Math.random() * Math.PI * 2;
        traitProjectile(
          e,
          `hsl(${ri(0, 359)} 90% 70%)`,
          'confetti',
          Math.cos(a) * rand(180, 420),
          Math.sin(a) * rand(180, 420),
          0.18,
          4,
          1.7
        );
      }
      return true;
    }
    if (t.id === 'motivational') {
      for (const o of E)
        if (!o.dead && !o.boss && Math.hypot(o.x - e.x, o.y - e.y) < 220) {
          o.motivateT = 2.7;
          o.vx *= 1.2;
          ring(o.x + o.w / 2, o.y + o.h / 2, '#ffcf6f', 28, 2);
        }
      return true;
    }
    if (t.id === 'goose') {
      traitProjectile(e, '#f5f5dd', 'goose', ux * 520, uy * 120, 0.52, 11, 2.3);
      return true;
    }
    if (t.id === 'microwave') {
      beam(sx, sy, pl.x + pl.w / 2, pl.y + pl.h / 2, '#ff9257', 8);
      if (Math.hypot(dx, dy) < 340) hurt(e.dmg * 0.55, e);
      return true;
    }
    if (t.id === 'banana') {
      Q.push({
        x: sx,
        y: sy,
        vx: ux * 260,
        vy: -250,
        r: 10,
        life: 4.2,
        dam: e.dmg * 0.18,
        col: '#fff46b',
        trail: 0,
        effect: 'banana',
        trait: true,
        bounces: 0
      });
      return true;
    }
    return false;
  }

  const ENEMY_TITLES = [
    'Senior',
    'Assistant',
    'Unauthorized',
    'Regional',
    'Extremely Motivated',
    'Union',
    'Executive',
    'Interim',
    'Freelance',
    'Emotionally Unavailable',
    'Night Shift',
    'Turbo',
    'Budget',
    'Acting'
  ];
  function enemyName(type, elite = false) {
    let theme = approachTheme(),
      base =
        ED[type].name ||
        {
          stalker: 'Graveyard Hacker',
          crawler: 'Floor Gremlin',
          brute: 'Axe Landlord of the Keep',
          wraith: 'Fireball Ghost',
          maw: 'Pretzel Maw',
          flyer: 'Sky Problem',
          wizard: 'Unlicensed Wizard',
          taxman: 'Combat Auditor',
          mimic: 'Definitely Normal Treasure Chest',
          eyeball: 'Management Eye',
          bombchicken: 'Tactical Bomb Chicken'
        }[type] ||
        type,
      b = theme.aliases?.[type] || base;
    return elite ? pick(ENEMY_TITLES) + ' ' + b : b;
  }
  const ENEMY_LESSONS = {
    crawler: {
      how: 'LEAP ATTACK — closes distance suddenly, then bites at your ankles.',
      hint: 'Watch the hop. Knock it away before it lands.'
    },
    stalker: {
      how: 'HACKER — walks you down and commits to a close-range weapon swing.',
      hint: 'Simple pattern; dangerous when several swing in rhythm.'
    },
    brute: {
      how: 'HEAVY CLEAVE — slow wind-up, huge melee hit and strong stagger.',
      hint: 'The wind-up is long. Dash through or launch it first.'
    },
    wraith: {
      how: 'PHASE FIREBALL — keeps distance and throws ghostly projectiles.',
      hint: 'Close the gap or use platforms to break its firing lane.'
    },
    maw: {
      how: 'SNAP BITE — bulky melee predator with a short, violent lunge.',
      hint: 'Respect the mouth. Knockback is your friend.'
    },
    flyer: {
      how: 'AIRBORNE BOLT — hovers above terrain and attacks from awkward angles.',
      hint: 'Aim upward, use ranged weapons, or juggle it when it comes low.'
    },
    wizard: {
      how: 'BURNING FIREBALL — telegraphed ranged shot that explodes into fire.',
      hint: 'Move when the cast begins; the projectile is the warning.'
    },
    taxman: {
      how: 'AUDIT SHOT — ranged receipts drain mana as well as health.',
      hint: 'Dodging saves both HP and your weapon-skill budget.'
    },
    mimic: {
      how: 'AMBUSH BITE — a chest-shaped bruiser that lunges when you get close.',
      hint: 'Do not admire the loot box. Hit the loot box.'
    },
    eyeball: {
      how: 'TRIPLE WEIRD SHOT — fires a three-projectile spread from the air.',
      hint: 'Dodge between the lanes instead of outrunning the entire spread.'
    },
    bombchicken: {
      how: 'SELF-DESTRUCT — sprints into range, flashes a warning, then detonates.',
      hint: 'When it says OH NO, make that somebody else’s problem.'
    },
    shieldbro: {
      how: 'FRONTAL SHIELD — blocks most front damage and turns slowly.',
      hint: 'Cross behind it. Back attacks are the entire lesson.'
    },
    blinker: {
      how: 'TELEPORT BACKSTAB — vanishes, appears behind you, then lunges.',
      hint: 'Watch the purple rune. Reverse direction after the blink.'
    },
    summoner: {
      how: 'TEAM-BUILDING RITUAL — conjures tracking spectral hazards instead of fighting fair.',
      hint: 'Interrupt the green casting circle or prepare to dodge the summons.'
    },
    sniper: {
      how: 'LASER SHOT — long wind-up with a targeting line, then a very fast bolt.',
      hint: 'The line is the answer key. Move before the shot.'
    },
    roller: {
      how: 'RICOCHET CHARGE — accelerates across the floor and bounces off walls.',
      hint: 'Jump it or punish the recovery after it rebounds.'
    }
  };
  function waveMonster() {
    let po = pool(),
      i = Math.min(stageClears, po.length - 1);
    return po[i] || po[0] || 'crawler';
  }
  function waveDifficultyLabel(index) {
    let g = stageGoal(),
      p = index / Math.max(1, g - 1);
    return p >= 0.99
      ? 'FINAL EXAM'
      : p > 0.72
        ? 'MURDER LAB'
        : p > 0.45
          ? 'REMIX WAVE'
          : p > 0.18
            ? 'ESCALATION'
            : 'FIRST CONTACT';
  }
  const WAVE_MODES = [
    { id: 'intro', name: 'FIRST CONTACT', desc: 'One threat. Learn the attack before the room gets stupid.' },
    { id: 'swarm', name: 'SWARM TEST', desc: 'More bodies, shorter breathing room, same new threat.' },
    {
      id: 'escort',
      name: 'ELITE ESCORT',
      desc: 'The new monster arrives with previously introduced support.'
    },
    { id: 'pincer', name: 'PINCER REMIX', desc: 'Two attack patterns overlap from opposite sides.' },
    {
      id: 'overload',
      name: 'SYSTEM OVERLOAD',
      desc: 'Multiple learned threats, elites, and environmental pressure.'
    },
    {
      id: 'final',
      name: 'FINAL EXAM',
      desc: 'Everything this stage taught you is now trying to kill you at once.'
    }
  ];
  function rarityWavePressure() {
    let w = curW(),
      rank = Math.max(0, rarityIndex(w)),
      extra = rank <= 1 ? 0 : Math.min(20, Math.floor(Math.pow(rank - 1, 1.12) * 0.72)),
      label =
        rank <= 1
          ? 'CALM'
          : rank <= 4
            ? 'NOTICEABLE'
            : rank <= 7
              ? 'HOSTILE'
              : rank <= 11
                ? 'MOB MAGNET'
                : rank <= 15
                  ? 'PUBLIC EMERGENCY'
                  : 'REALITY CROWD CONTROL FAILURE';
    return { rank, extra, label, rar: w.rar, col: w.col };
  }
  function wavePlan(index = stageClears) {
    let po = pool(),
      goal = stageGoal(),
      final = index >= goal - 1,
      primary = po[Math.min(index, po.length - 1)] || po.at(-1) || 'crawler',
      mode =
        index === 0
          ? WAVE_MODES[0]
          : index === 1
            ? WAVE_MODES[1]
            : final
              ? WAVE_MODES[5]
              : index === 2
                ? WAVE_MODES[2]
                : index === 3
                  ? WAVE_MODES[3]
                  : WAVE_MODES[4],
      parts = [];
    let primaryCount = clamp(3 + index + Math.floor(zoneI / 4), 3, final ? 7 : 6);
    parts.push({ type: primary, count: primaryCount, role: 'NEW THREAT' });
    if (index >= 2) {
      let prev = po[Math.max(0, index - 1) % po.length];
      if (prev !== primary)
        parts.push({
          type: prev,
          count: final ? 3 : Math.min(2 + Math.floor(index / 3), 3),
          role: 'SUPPORT'
        });
    }
    if (index >= 3) {
      let older = po[Math.max(0, index - 2) % po.length];
      if (older !== primary && !parts.some(x => x.type === older))
        parts.push({ type: older, count: final ? 2 : 1 + Math.floor(index / 5), role: 'FLANK' });
    }
    if (index >= 4 && !final && Math.random() < 0.58) {
      let learned = po.slice(0, Math.min(po.length, index + 1)).filter(t => !parts.some(x => x.type === t));
      if (learned.length) parts.push({ type: pick(learned), count: 2, role: 'WILDCARD' });
    }
    if (final) {
      let learned = po.slice(0, Math.min(po.length, index + 1)).filter(t => !parts.some(x => x.type === t));
      if (learned.length) parts.push({ type: pick(learned), count: 2, role: 'FINAL SUPPORT' });
    }
    let pressure = rarityWavePressure(),
      room = Math.max(0, 34 - parts.reduce((n, x) => n + x.count, 0)),
      extra = Math.min(pressure.extra, room);
    if (extra > 0) {
      let primaryExtra = Math.ceil(extra * 0.56),
        remain = extra - primaryExtra;
      parts[0].count += primaryExtra;
      if (parts.length === 1) {
        parts[0].count += remain;
      } else {
        let i = 1;
        while (remain > 0) {
          parts[i].count++;
          remain--;
          i++;
          if (i >= parts.length) i = 1;
        }
      }
    }
    let count = parts.reduce((n, x) => n + x.count, 0),
      eliteCount = final ? Math.min(4, 2 + Math.floor(zoneI / 3)) : index >= 4 ? 2 : index >= 2 ? 1 : 0,
      scale = 1 + index * 0.105 + zoneI * 0.026;
    return {
      index,
      final,
      primary,
      parts,
      count,
      eliteCount,
      scale,
      mode,
      rarityPressure: { ...pressure, extra }
    };
  }
  function showWaveIntro(plan) {
    let type = plan.primary,
      lesson = ENEMY_LESSONS[type] || {
        how: 'UNDOCUMENTED VIOLENCE — observe carefully.',
        hint: 'Hit it until the lesson becomes clear.'
      },
      name = enemyName(type, false),
      idx = stageClears + 1,
      total = stageGoal(),
      mix = plan.parts
        .slice(1)
        .map(x => `${enemyName(x.type, false)} ×${x.count}`)
        .join(' • '),
      rp = plan.rarityPressure || rarityWavePressure();
    waveIntroT = plan.final ? 3.5 : 3.0;
    U.waveIntroTag.textContent =
      (plan.final ? 'FINAL APPROACH • ' : plan.index < 2 ? 'NEW ENEMY • ' : 'DYNAMIC WAVE • ') +
      plan.mode.name;
    U.waveIntroTag.style.color = approachTheme().col;
    U.waveIntroCount.textContent = `WAVE ${idx} / ${total} • ${plan.count} HOSTILES${rp.extra ? ` • +${rp.extra} FROM ${rp.rar.toUpperCase()}` : ''}`;
    U.waveIntroName.textContent = name + (plan.parts.length > 1 ? ' + SUPPORT' : '');
    U.waveIntroName.style.color = approachTheme().col;
    U.waveIntroHow.textContent = lesson.how + (mix ? ` SUPPORT: ${mix}.` : '');
    U.waveIntroHint.textContent =
      'COUNTERPLAY: ' +
      lesson.hint +
      ' • ' +
      plan.mode.desc +
      (rp.extra
        ? ` • WEAPON HEAT: ${rp.label} — your ${rp.rar} weapon attracted ${rp.extra} extra enemies.`
        : '');
    U.waveIntroFill.style.width = '100%';
    U.waveIntroFill.style.background = `linear-gradient(90deg,${approachTheme().col},${rp.extra ? rp.col : '#fff176'},#ff6fd8)`;
    U.waveIntro.classList.add('show');
    uiChime(plan.final || plan.index >= 3 || rp.extra >= 6);
  }

