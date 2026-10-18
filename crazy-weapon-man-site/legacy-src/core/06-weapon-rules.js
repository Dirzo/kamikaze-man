  function rarityIndex(w) {
    let name = w && typeof w === 'object' ? w.rar || w.n : w,
      i = RANKS.indexOf(name);
    return i < 0 ? 0 : i;
  }
  function rarityRank(w) {
    let i = rarityIndex(w);
    return Math.min(10, Math.round((i * 10) / (R.length - 1)));
  }
  function rarityCeiling(elite = false) {
    /* Normal drops progress more slowly now: early absurdity comes from names, not free Mythics. */ let base =
      [2, 3, 4, 5, 7, 9, 12][zoneI] ?? 12;
    return Math.min(R.length - 1, base + (elite ? 1 : 0));
  }
  function rr(elite = false) {
    let ceiling = rarityCeiling(elite);
    // A freak roll is a REAL rarity breach: it jumps above the stage ceiling instead of merely making the pool larger.
    let freakChance = (elite ? 0.00016 : 0.00002) * (1 + zoneI * 0.5),
      room = Math.min(zoneI < 2 ? 1 : 4, R.length - 1 - ceiling);
    if (room > 0 && Math.random() < freakChance) {
      let jumpWeights = [46, 27, 15, 8, 4].slice(0, room),
        tot = jumpWeights.reduce((a, b) => a + b, 0),
        x = Math.random() * tot,
        jump = 1;
      for (let i = 0; i < jumpWeights.length; i++) {
        x -= jumpWeights[i];
        if (x <= 0) {
          jump = i + 1;
          break;
        }
      }
      return R[ceiling + jump];
    }
    let pool = R.slice(0, ceiling + 1),
      total = pool.reduce((a, q) => a + q.c, 0),
      x = Math.random() * total;
    for (const q of pool) {
      x -= q.c;
      if (x <= 0) return q;
    }
    return pool.at(-1);
  }
  function hasTrait(w, code) {
    return !!(w.traits && w.traits.some(t => t.code === code));
  }
  function attackDir(w) {
    return hasTrait(w, 'assbackwards') ? -pl.dir : pl.dir;
  }
  function weaponMoveMult(w) {
    let m = 1;
    if (hasTrait(w, 'speedy')) m *= 1.38;
    if (hasTrait(w, 'tiny')) m *= 1.16;
    if (hasTrait(w, 'drunk')) m *= 1.06;
    return m;
  }
  function chaosTraitEquipFX(w) {
    let notices = [];
    if (hasTrait(w, 'dark')) notices.push(['THE LIGHT HAS LEFT', '#8c72ff']);
    if (hasTrait(w, 'assbackwards')) notices.push(['ASS CANNON ONLINE', '#ff9b72']);
    if (hasTrait(w, 'speedy')) notices.push(['SPEED LIMIT DELETED', '#7df7ff']);
    if (hasTrait(w, 'explosive')) notices.push(['THIS HAS AN EXPLOSIVE PERSONALITY', '#ff9a4f']);
    if (hasTrait(w, 'gravitywrong')) notices.push(['GRAVITY HAS BEEN OPTIONALIZED', '#caa0ff']);
    if (hasTrait(w, 'bouncy')) notices.push(['BOUNCE HOUSE BALLISTICS ENABLED', '#f4ff71']);
    if (hasTrait(w, 'haunted')) notices.push(['THIS WEAPON IS VERY HAUNTED', '#c8d4ff']);
    if (hasTrait(w, 'drunk')) notices.push(['AIM SOBRIETY: 0%', '#ffd27a']);
    if (notices.length) {
      let [msg, col] = notices[0];
      txt(W / 2, 205, msg, col, true);
      ring(pl.x + pl.w / 2, pl.y + pl.h / 2, col, 125, 5);
      shake = Math.max(shake, 7);
    }
  }
  function setEquipFx(item, kind = 'WEAPON') {
    pl.equipFxT = 2.4;
    pl.equipFxCol = item?.col || '#fff';
    pl.equipFxName = item?.name || kind;
    pl.equipFxKind = kind;
    pl.equipFxPulse = 0;
    uiChime(true);
  }
  const RARE_MUTATORS = [
    {
      id: 'overclock',
      enemy: 'ARSENAL SAVANT',
      name: 'ILLEGAL OVERCLOCK',
      col: '#75f5ff',
      dur: 19,
      desc: '+30% damage and +20% attack speed.',
      damage: 1.3,
      speed: 1.2
    },
    {
      id: 'prism',
      enemy: 'PRISMATIC HERETIC',
      name: 'PRISM FEVER',
      col: '#ff82ef',
      dur: 17,
      desc: '+24% crit chance and +38% attack size.',
      crit: 0.24,
      aoe: 1.38
    },
    {
      id: 'velocity',
      enemy: 'VELOCITY THIEF',
      name: 'SPEED CRIME',
      col: '#fff176',
      dur: 20,
      desc: '+38% movement, faster attacks, and much faster dashes.',
      speed: 1.12,
      move: 1.38,
      dash: 0.58
    },
    {
      id: 'gravity',
      enemy: 'GRAVITY FOREMAN',
      name: 'LAUNCH LICENSE',
      col: '#bc8cff',
      dur: 18,
      desc: 'Nearly double knockback, +18% damage, and larger attacks.',
      damage: 1.18,
      knock: 1.85,
      aoe: 1.22
    },
    {
      id: 'mana',
      enemy: 'MANA PARASITE',
      name: 'UNLIMITED BUDGET',
      col: '#72c8ff',
      dur: 18,
      desc: 'Skills cost 60% less, recharge faster, and mana floods back.',
      skillCost: 0.4,
      skillCd: 0.68,
      mana: 2.25
    },
    {
      id: 'ledger',
      enemy: 'VAMPIRIC AUDITOR',
      name: 'RED LEDGER',
      col: '#ff6685',
      dur: 21,
      desc: '+16% damage; kills heal massively more.',
      damage: 1.16,
      heal: 2.75
    },
    {
      id: 'mirror',
      enemy: 'MIRROR ENGINE',
      name: 'DOUBLE TROUBLE',
      col: '#d7f7ff',
      dur: 18,
      desc: 'Every fourth basic attack creates a spectral duplicate strike.',
      mirror: true,
      speed: 1.08
    }
  ];
  function augmentVal(k, def = 1) {
    return tempAugment && Number.isFinite(tempAugment[k]) ? tempAugment[k] : def;
  }
  function augmentCrit() {
    return tempAugment?.crit || 0;
  }
  function applyRareAugment(mut) {
    if (!mut) return;
    tempAugment = { ...mut, t: mut.dur, max: mut.dur };
    rareEnemySeen++;
    U.augmentHud?.classList.add('show');
    U.augmentName.textContent = mut.name;
    U.augmentName.style.color = mut.col;
    U.augmentDesc.textContent = mut.desc;
    U.augmentTime.textContent = mut.dur.toFixed(1) + 's';
    U.augmentFill.style.width = '100%';
    txt(W / 2, 112, 'TEMP AUGMENT ACQUIRED', mut.col, true);
    txt(W / 2, 143, mut.name, mut.col, true);
    ring(pl.x + pl.w / 2, pl.y + pl.h / 2, mut.col, 145, 6);
    part(pl.x + pl.w / 2, pl.y + pl.h / 2, mut.col, 24, 250, 8);
    uiChime(true);
    tone(420, 980, 0.16, 0.035, 'triangle', 0.03);
    U.msg.textContent = `RARE ENEMY DEFEATED: ${mut.name} for ${mut.dur}s — ${mut.desc}`;
  }
  function updateAugment(dt) {
    if (!tempAugment) {
      U.augmentHud?.classList.remove('show');
      return;
    }
    tempAugment.t = Math.max(0, tempAugment.t - dt);
    if (U.augmentTime) U.augmentTime.textContent = tempAugment.t.toFixed(1) + 's';
    if (U.augmentFill) U.augmentFill.style.width = (100 * tempAugment.t) / tempAugment.max + '%';
    if (tempAugment.t <= 0) {
      let old = tempAugment;
      tempAugment = null;
      U.augmentHud?.classList.remove('show');
      txt(pl.x + pl.w / 2, pl.y - 54, old.name + ' ENDED', '#c9d6e5', false);
      uiChime(false);
    }
  }
  function makeRareEnemy(e, forced = null) {
    if (!e || e.boss) return e;
    let mut = forced || pick(RARE_MUTATORS);
    e.rareMutator = mut;
    e.max = Math.round(e.max * 1.72);
    e.hp = e.max;
    e.dmg = Math.round(e.dmg * 1.14);
    e.sp *= 1.05;
    e.label = '★ ' + mut.enemy + ' ★';
    e.rarePulse = Math.random() * 6.28;
    return e;
  }
  function maybeCreateRareEnemy() {
    if (bossMode) return null;
    let chance = Math.min(0.14, 0.045 + zoneI * 0.012),
      alive = E.filter(e => !e.dead && !e.boss && !e.rareMutator);
    if (alive.length && Math.random() < chance) {
      let e = pick(alive);
      makeRareEnemy(e);
      txt(e.x + e.w / 2, e.y - 64, 'RARE ENEMY', e.rareMutator.col, true);
      txt(e.x + e.w / 2, e.y - 39, 'KILL → ' + e.rareMutator.name, e.rareMutator.col, false);
      uiChime(true);
      return e;
    }
    return null;
  }
  function mirrorAugmentProc(w) {
    if (!tempAugment?.mirror || pl.combo % 4 !== 0) return;
    let targets = E.filter(e => !e.dead)
      .sort((a, b) => Math.abs(a.x - pl.x) - Math.abs(b.x - pl.x))
      .slice(0, 2);
    for (const t of targets)
      P.push({
        k: 'spectral',
        x: pl.x + pl.w / 2,
        y: pl.y + 14,
        vx: 0,
        vy: 0,
        target: t,
        dam: wdmg() * 0.58,
        life: 1.15,
        col: tempAugment.col,
        mod: w.mod,
        rar: w.rar,
        wp: w.p,
        sourceType: w.type,
        cc: cchance()
      });
    if (targets.length) txt(pl.x + pl.w / 2, pl.y - 38, 'MIRROR STRIKE', tempAugment.col, false);
  }
  function isMeleeWeapon(w) {
    return !!w && ['sword', 'dagger', 'nunchucks', 'katana', 'hammer'].includes(w.type);
  }
  function hasMajorDamagePerk(w) {
    if (!w) return false;
    if (
      [
        'power',
        'execution',
        'critstorm',
        'worldcutter',
        'nullall',
        'godbreaker',
        'continental',
        'finalargument'
      ].includes(w.mod)
    )
      return true;
    if (
      w.material &&
      ((w.material.dam || 1) >= 1.1 || ['nuclear', 'plasma', 'obsidian'].includes(w.material.code))
    )
      return true;
    return !!(
      w.traits &&
      w.traits.some(
        t =>
          (t.dam || 1) >= 1.16 || ['pure', 'insanity', 'explosive', 'recoil', 'gravitywrong'].includes(t.code)
      )
    );
  }
  function meleeCompensation(w) {
    if (!isMeleeWeapon(w)) return 1;
    let major = hasMajorDamagePerk(w);
    /* Melee pays for danger with real power. Utility/funny rolls get the biggest floor. */ if (
      w.type === 'hammer'
    )
      return major ? 1.3 : 1.62;
    if (w.type === 'katana') return major ? 1.28 : 1.54;
    if (w.type === 'sword') return major ? 1.24 : 1.48;
    if (w.type === 'nunchucks') return major ? 1.16 : 1.36;
    return major ? 1.18 : 1.38;
  }
  function weaponDamageMult(w) {
    let m = w.mod === 'power' ? 1.12 : 1;
    if (w.material) m *= w.material.dam;
    if (w.traits) for (const t of w.traits) m *= t.dam;
    if (hasTrait(w, 'insanity')) m *= 1 + Math.min(0.62, pl.combo * 0.022);
    if (w.material && w.material.code === 'bone') m *= 1 + Math.min(0.55, (w.killStacks || 0) * 0.012);
    if (w.material && w.material.code === 'meat') m *= 1 + Math.min(0.4, (w.killStacks || 0) * 0.009);
    m *= meleeCompensation(w);
    m *= pl.boonDamage || 1;
    m *= augmentVal('damage', 1);
    if (superT > 0) m *= 1 + 0.48 * superPower;
    if (hasTrait(w, 'dishwasher') && mapScene && mapScene.water) m *= 1.14;
    if (pl.boonSoup && inMapWater(pl.x + pl.w / 2)) m *= 1.2;
    if (hasTrait(w, 'boat') && mapScene && mapScene.water) m *= 1.18;
    if (pl.boonRaccoon && pl.hp / pl.max < 0.35) m *= 1.08;
    return m;
  }
  function weaponSpeedMult(w) {
    let a = w.mod === 'haste' ? 1.28 : w.mod === 'speed' ? 1.15 : 1;
    if (w.material) a *= w.material.spd;
    if (w.traits) for (const t of w.traits) a *= t.spd;
    if (hasTrait(w, 'asthma') && pl.mana < 12) a *= 0.58;
    a *= pl.boonSpeed || 1;
    a *= augmentVal('speed', 1);
    if (superT > 0) a *= 1 + 0.22 * superPower;
    if (pl.boonRaccoon && pl.hp / pl.max < 0.35) a *= 1.22;
    return a;
  }
  function heldAttackCooldown(w) {
    let raw = WM[w.type].cd / weaponSpeedMult(w);
    /* Hard cadence bands keep hold-to-attack faithful to the intended animation speed. */ if (
      w.type === 'sword'
    )
      return clamp(raw, 0.145, 0.3);
    if (w.type === 'dagger') return clamp(raw, 0.085, 0.175);
    if (w.type === 'nunchucks') return clamp(raw, 0.075, 0.175);
    if (w.type === 'katana') return clamp(raw, 0.145, 0.3);
    if (w.type === 'shuriken') return clamp(raw, 0.095, 0.26);
    if (w.type === 'hammer') return clamp(raw, 0.215, 0.5);
    return clamp(raw, 0.1, 0.62);
  }
  function weaponAoe(w) {
    let a = w.material ? w.material.aoe : 1;
    if (w.traits) for (const t of w.traits) a *= t.aoe;
    a *= pl.aoeMult || 1;
    a *= augmentVal('aoe', 1);
    return a;
  }
  function weaponCritBonus(w) {
    let c = w.crit || 0;
    if (w.mod === 'critstorm') c += 0.08;
    if (w.material) c += w.material.crit || 0;
    if (hasTrait(w, 'rhythmic')) c += 0.015;
    if (hasTrait(w, 'insanity')) c += Math.min(0.08, pl.combo * 0.002);
    if (hasTrait(w, 'divorced')) c += 0.055;
    /* Melee crits are part of the risk/reward identity. */ if (w.type === 'sword') c += 0.075;
    else if (w.type === 'dagger') c += 0.125;
    else if (w.type === 'nunchucks') c += 0.065;
    else if (w.type === 'katana') c += 0.145;
    else if (w.type === 'shuriken') c += 0.045;
    else if (w.type === 'hammer') c += 0.095;
    c += pl.boonCrit || 0;
    return c;
  }
  function modText(m, type) {
    let a = {
      power: 'Heavy-hitting roll: +12% total weapon damage.',
      speed: 'Quick roll: 15% faster basic attacks.',
      haste: 'Haste: 28% faster basic attacks.',
      critstorm: 'Crit Storm: +8% critical chance.',
      execution: 'Executioner: sharply higher crit chance below 45% enemy HP.',
      pierce: 'Piercing shots travel through two additional enemies.',
      multishot: 'Fires a three-projectile spread.',
      echo: 'Echo: casts repeat at reduced power.',
      nova: 'Nova: every third basic attack erupts around the impact.'
    };
    return a[m] || WM[type].desc;
  }
  function rollMod(r, type) {
    if (['Common', 'Uncommon', 'Magic'].includes(r.n)) return pick(['power', 'speed']);
    if (['Rare', 'Super Rare'].includes(r.n)) {
      let q = {
        sword: ['haste', 'critstorm', 'execution'],
        dagger: ['haste', 'critstorm', 'execution'],
        nunchucks: ['haste', 'critstorm', 'nova'],
        katana: ['critstorm', 'execution', 'power'],
        bow: ['pierce', 'critstorm', 'haste'],
        shuriken: ['pierce', 'critstorm', 'haste'],
        wand: ['echo', 'critstorm', 'haste'],
        staff: ['nova', 'critstorm', 'power'],
        hammer: ['nova', 'execution', 'power']
      };
      return pick(q[type]);
    }
    let q = {
      sword: ['execution', 'nova', 'haste'],
      dagger: ['execution', 'nova', 'haste'],
      nunchucks: ['nova', 'haste', 'critstorm'],
      katana: ['execution', 'critstorm', 'nova'],
      bow: ['multishot', 'pierce', 'critstorm'],
      shuriken: ['multishot', 'pierce', 'critstorm'],
      wand: ['echo', 'nova', 'critstorm'],
      staff: ['nova', 'echo', 'critstorm'],
      hammer: ['nova', 'execution', 'critstorm']
    };
    return pick(q[type]);
  }
  function buildName(type, r, material, traits, intensity) {
    let rank = RANKS.indexOf(r.n),
      generic = GENERIC[type],
      lead = traits.filter(t => t.code !== 'hex').map(t => t.n),
      tail = traits.filter(t => t.code === 'hex').map(t => t.n),
      parts = [],
      flavorPool = [...PF.filter(x => x !== 'Ancient'), ...NAME_CHAOS],
      nameChaos = clamp(0.64 + zoneI * 0.055 + Math.min(0.2, kills * 0.0015), 0.64, 0.97),
      flavorCount = rank <= 2 || zoneI <= 1 ? 1 : 0;
    if (Math.random() < nameChaos * (rank <= 2 ? 0.82 : 0.58)) flavorCount++;
    if (Math.random() < nameChaos * (0.25 + zoneI * 0.045)) flavorCount++;
    let flavors = [];
    while (flavors.length < flavorCount && flavorPool.length) {
      let i = ri(0, flavorPool.length - 1);
      flavors.push(flavorPool.splice(i, 1)[0]);
    }
    parts.push(...flavors, ...lead);
    if (material) parts.push(material.n);
    if (intensity) parts.push(intensity);
    if (rank >= 2) parts.push(r.n);
    parts.push(...tail);
    parts.push(generic);
    let nm = parts.join(' '),
      suffixChance = rank <= 2 ? 0.62 + zoneI * 0.025 : Math.min(0.72, 0.26 + rank * 0.035 + zoneI * 0.03);
    if (Math.random() < suffixChance) nm += ' ' + pick(SUFFIXES);
    if (nm.length > 104) {
      let words = nm.split(' ');
      while (words.join(' ').length > 104 && words.length > 4) words.splice(1, 1);
      nm = words.join(' ');
    }
    return nm;
  }
  function proceduralText(w) {
    let bits = [];
    if (w.material) bits.push(`${w.material.n}: ${w.material.desc}.`);
    if (w.traits) for (const t of w.traits) bits.push(`${t.n}: ${t.desc}.`);
    if (w.cap) bits.push(`${w.capName}: ${w.capText}.`);
    return bits.join(' ') || modText(w.mod, w.type);
  }

  const WEAPON_SYNERGIES = [
    {
      id: 'driveby',
      name: 'DRIVE-BY APOCALYPSE',
      desc: 'Speedy + Ass Backwards: move fast, shoot backward, every 5th attack detonates behind you.',
      test: w => hasTrait(w, 'speedy') && hasTrait(w, 'assbackwards')
    },
    {
      id: 'bouncehouse',
      name: 'PARANORMAL BOUNCE HOUSE',
      desc: 'Haunted + Bouncy: ghost weapons turn enemies into birthday-party projectiles.',
      test: w => hasTrait(w, 'haunted') && hasTrait(w, 'bouncy')
    },
    {
      id: 'fatvoid',
      name: 'MORBID EVENT HORIZON',
      desc: 'Fat + Void: oversized attacks drag the room inward before impact.',
      test: w => hasTrait(w, 'fat') && w.material?.code === 'void'
    },
    {
      id: 'tinynuke',
      name: 'POCKET-SIZED WAR CRIME',
      desc: 'Suspiciously Tiny + Meteoric: very fast tiny attacks cause very non-tiny explosions.',
      test: w => hasTrait(w, 'tiny') && w.material?.code === 'nuclear'
    },
    {
      id: 'jazzgoose',
      name: 'HONK FUNK',
      desc: 'Goose + Jazz Hands: rainbow spectral geese improvise violently.',
      test: w => hasTrait(w, 'goose') && hasTrait(w, 'jazzhands')
    },
    {
      id: 'magboom',
      name: 'GROUP PROJECT',
      desc: 'Magnetic + Explosive Personality: enemies are pulled together before the blast.',
      test: w => hasTrait(w, 'magnetic') && hasTrait(w, 'explosive')
    },
    {
      id: 'darkfast',
      name: 'NIGHT SHIFT HIT-AND-RUN',
      desc: 'Dark + Speedy: visibility collapses while your afterimages become weapons.',
      test: w => hasTrait(w, 'dark') && hasTrait(w, 'speedy')
    },
    {
      id: 'wetboat',
      name: 'MARITIME GUILD-SAFETY EXEMPTION',
      desc: 'Legally A Boat + water: attacks leave damaging wakes and gain absurd reach.',
      test: w => hasTrait(w, 'boat')
    },
    {
      id: 'taxgold',
      name: 'CREATIVE ACCOUNTING',
      desc: 'Tax Evasive + Gold: kills refund mana and issue hostile dividends.',
      test: w => hasTrait(w, 'taxevasive') && w.material?.code === 'gold'
    },
    {
      id: 'emotiondagger',
      name: 'THERAPY KNIFE',
      desc: 'Divorced + Emotionally Available dagger: crit chains heal because growth is complicated.',
      test: w => w.type === 'dagger' && hasTrait(w, 'divorced') && hasTrait(w, 'emotional')
    }
  ];
  function detectSynergy(w) {
    return WEAPON_SYNERGIES.find(s => s.test(w)) || null;
  }
  function showSynergy(w) {
    if (!w?.synergy || !U.synergyBadge) return;
    U.synergyName.textContent = w.synergy.name;
    U.synergyDesc.textContent = w.synergy.desc;
    U.synergyBadge.classList.add('show');
    synergyT = 4.2;
    txt(W / 2, 210, 'SYNERGY DISCOVERED', '#fff176', true);
    tone(330, 990, 0.16, 0.04, 'triangle');
  }
  function synergyProc(w, nearby) {
    let s = w.synergy;
    if (!s) return;
    let ao = weaponAoe(w),
      t = nearby[0];
    if (s.id === 'driveby' && pl.combo % 5 === 0 && t) {
      let x = pl.x - pl.dir * 45;
      boom(x, pl.y + 20, '#ff8a45', 125 * ao, 0.8);
      for (const e of nearby.slice(0, 5))
        if (Math.abs(e.x - x) < 150 * ao)
          hitE(e, wdmg() * 0.42, {
            col: '#ffb26b',
            knock: Math.sign(e.x - x) * 420,
            stun: 0.2,
            sourceType: w.type
          });
    } else if (s.id === 'bouncehouse' && pl.combo % 4 === 0) {
      for (const e of nearby.slice(0, 3)) {
        e.vy = -rand(360, 520);
        e.vx += Math.sign(e.x - pl.x) * rand(300, 500);
        e.recoilT = Math.max(e.recoilT, 0.42);
        styleAdd(8, 'BOUNCE HOUSE');
      }
    } else if (s.id === 'fatvoid' && pl.combo % 3 === 0 && t) {
      F.push({
        k: 'vortex',
        x: t.x + t.w / 2,
        y: t.y + t.h / 2,
        life: 1.05,
        max: 1.05,
        pow: 1.25,
        dam: wdmg() * 0.55
      });
    } else if (s.id === 'tinynuke' && pl.combo % 6 === 0 && t) {
      boom(t.x + t.w / 2, t.y + t.h / 2, '#caff5f', 105, 0.8);
      for (const e of nearby.slice(0, 4))
        if (Math.hypot(e.x - t.x, e.y - t.y) < 120)
          hitE(e, wdmg() * 0.34, { col: '#d9ff7a', stun: 0.14, sourceType: w.type });
    } else if (s.id === 'jazzgoose' && pl.combo % 5 === 0) {
      for (let i = 0; i < 5; i++) {
        let e = nearby[i % Math.max(1, nearby.length)];
        if (e)
          P.push({
            k: 'spectral',
            x: pl.x + 17,
            y: pl.y + 18,
            vx: 0,
            vy: 0,
            target: e,
            dam: wdmg() * 0.28,
            life: 1.2,
            col: `hsl(${i * 72} 100% 70%)`,
            mod: w.mod,
            rar: w.rar,
            wp: w.p,
            sourceType: w.type,
            cc: cchance()
          });
      }
      txt(pl.x + 17, pl.y - 40, 'HONK FUNK', '#fff176', false);
    } else if (s.id === 'magboom' && pl.combo % 4 === 0 && t) {
      for (const e of nearby.slice(0, 6)) {
        e.vx += (t.x - e.x) * 0.6;
        e.stun = Math.max(e.stun, 0.12);
      }
      boom(t.x + t.w / 2, t.y + t.h / 2, w.col, 115, 0.75);
    } else if (s.id === 'darkfast' && pl.combo % 4 === 0) {
      for (const e of nearby.slice(0, 2)) {
        beam(pl.x + 17, pl.y + 18, e.x + e.w / 2, e.y + e.h / 2, '#7552ff', 4);
        hitE(e, wdmg() * 0.3, { col: '#8d75ff', stun: 0.08, sourceType: w.type });
      }
    } else if (s.id === 'wetboat' && mapScene?.water && pl.combo % 3 === 0) {
      ring(pl.x + 17, G - 4, '#62dfff', 150, 4);
      for (const e of nearby.slice(0, 5))
        hitE(e, wdmg() * 0.22, {
          col: '#7ceaff',
          knock: Math.sign(e.x - pl.x) * 260,
          stun: 0.08,
          sourceType: w.type
        });
    } else if (s.id === 'taxgold' && pl.combo % 4 === 0) {
      pl.mana = Math.min(100, pl.mana + 8);
      for (const e of nearby.slice(0, 2))
        P.push({
          k: 'spectral',
          x: pl.x + 17,
          y: pl.y,
          vx: 0,
          vy: 0,
          target: e,
          dam: wdmg() * 0.25,
          life: 1,
          col: '#ffd95f',
          mod: w.mod,
          rar: w.rar,
          wp: w.p,
          sourceType: w.type,
          cc: cchance()
        });
    } else if (s.id === 'emotiondagger' && pl.combo % 5 === 0) {
      pl.hp = Math.min(pl.max, pl.hp + Math.max(2, Math.round(pl.max * 0.012)));
      txt(pl.x + 17, pl.y - 38, 'EMOTIONAL GROWTH +HP', '#8fffc0', false);
    }
  }
  const D20_FATE_NAMES = [
    'THE DIE HAS PERSONAL BEEF',
    'BARELY LEGALLY ALIVE',
    'PLOT ARMOR FROM TEMU',
    'A MIRACLE, SORT OF',
    'SECOND WIND',
    'THE APPRENTICE BELIEVES IN YOU',
    'LUCKY ENOUGH',
    'THE SOUNDTRACK PICKS UP',
    'THE BARD LEANS IN',
    'MAIN CHARACTER PROBATION',
    'MAIN CHARACTER STATUS',
    'THE BOSS LOOKS NERVOUS',
    'ANIME HAIR ACTIVATED',
    'THE GUILD CANNOT STOP THIS',
    'THE BUDGET INCREASED',
    'PROTAGONIST PRIVILEGE',
    'THE THEME SONG HAS LYRICS NOW',
    'FINAL FORM PAPERWORK APPROVED',
    'DIVINE WEAPON INCIDENT',
    'DESTINY HAS LOST SUPERVISION'
  ];
  const D20_FATE_LINES = [
    'The universe rolls its eyes, but it does technically revive you.',
    'This is not a good roll. It is, however, much better than being dead.',
    'The armor is parchment. The comeback is real.',
    'Someone in accounting accidentally approved a miracle.',
    'You inhale violence and stand back up.',
    'An unpaid apprentice somewhere whispers: you got this.',
    'Not legendary. Not embarrassing. Proceed.',
    'The boss can suddenly hear battle lutes.',
    'There is now an unnecessary close-up of your eye.',
    'You have been granted temporary narrative importance.',
    'The story has decided you are probably the protagonist.',
    'For the first time, the boss checks your DPS number.',
    'Your hair is not actually longer, but spiritually it absolutely is.',
    'Human Resources has lost jurisdiction over this fight.',
    'The animation studio has found several extra dollars.',
    'Physics is now taking your side in councils.',
    'The chorus kicks in and your weapon starts glowing irresponsibly.',
    'Several forms were signed. None of them were read.',
    'This weapon may constitute a minor religious event.',
    'The D20 screams. Reality files for feast days.'
  ];
  function d20Fate(roll) {
    let minRanks = [3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 9, 10, 11, 13, 20],
      r = clamp(roll, 1, 20),
      target = 1.07 + r * 0.032,
      hp = Math.min(0.94, 0.36 + r * 0.03),
      duration = 9 + r * 0.82,
      power = 0.44 + r * 0.066;
    if (r === 1) {
      target = 1.1;
      hp = 0.42;
      duration = 10;
      power = 0.52;
    }
    if (r === 20) {
      target = 2.15;
      hp = 1;
      duration = 32;
      power = 2.55;
    }
    return {
      roll: r,
      title: D20_FATE_NAMES[r - 1],
      line: D20_FATE_LINES[r - 1],
      minRank: minRanks[r - 1],
      target,
      hp,
      duration,
      power
    };
  }
  function forceRescueRarity(w, minRank) {
    let oldRank = rarityIndex(w);
    if (oldRank >= minRank) return w;
    let oldR = R[oldRank] || R[0],
      r = R[minRank];
    w.m *= r.m / Math.max(0.001, oldR.m);
    w.rar = r.n;
    w.col = r.col;
    w.p = r.p;
    w.crit = Math.max(w.crit || 0, 0.012 * r.p);
    if (minRank >= 3 && !w.material) w.material = pick(MATERIALS);
    let need = minRank >= 16 ? 4 : minRank >= 12 ? 3 : minRank >= 8 ? 2 : 1,
      pool = [...TRAITS, ...META_TRAITS.slice(0, metaLevel)].filter(
        t => !(w.traits || []).some(x => x.code === t.code)
      );
    w.traits = w.traits || [];
    while (w.traits.length < need && pool.length) w.traits.push(pool.splice(ri(0, pool.length - 1), 1)[0]);
    if (minRank >= 7) {
      let options = CAP[w.type],
        idx = minRank >= 14 ? 2 : minRank >= 9 ? ri(1, 2) : ri(0, 1),
        c = options[idx];
      w.mod = c[0];
      w.cap = c[0];
      w.capName = c[0].replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, x => x.toUpperCase());
      w.capText = c[1];
    }
    w.intensity = minRank >= 16 ? 'Absolute' : minRank >= 12 ? 'Apex' : minRank >= 9 ? 'Ultra' : w.intensity;
    w.name = buildName(w.type, r, w.material, w.traits, w.intensity);
    w.synergy = detectSynergy(w);
    w.text = proceduralText(w) + (w.synergy ? ` SYNERGY: ${w.synergy.name} — ${w.synergy.desc}` : '');
    return w;
  }
  function makeDeathOfferWeapon(roll) {
    let fate = d20Fate(roll),
      current = Math.max(1, estimateDPS(curW())),
      preferRanged = Math.random() < 0.76,
      best = null,
      bestScore = -1;
    for (let i = 0; i < 220; i++) {
      let w = makeW(Math.max(pl.lv + 2, Z[zoneI].lv + 2) + (bossOrdinal || 1) + ri(0, 3), true);
      forceRescueRarity(w, fate.minRank);
      let d = estimateDPS(w),
        ranged = ['bow', 'shuriken', 'wand', 'staff'].includes(w.type),
        score =
          d +
          (ranged ? current * 0.08 : 0) +
          rarityIndex(w) * 30 +
          (w.type !== curW().type ? current * 0.035 : 0);
      if (score > bestScore) {
        best = w;
        bestScore = score;
      }
      if (d > current * fate.target && (!preferRanged || ranged || i > 150)) {
        best = w;
        break;
      }
    }
    if (!best) best = makeUpgradeW(Z[zoneI].lv + bossOrdinal + 3);
    forceRescueRarity(best, fate.minRank);
    let bestD = estimateDPS(best);
    if (bestD <= current * fate.target) {
      best.m *= ((current * fate.target) / Math.max(1, bestD)) * 1.025;
      bestD = estimateDPS(best);
    }
    best.name =
      (roll === 20
        ? 'FATE-BREAKING '
        : roll >= 17
          ? 'DIVINE '
          : roll === 1
            ? 'QUESTIONABLY SHINY '
            : 'SHINY ') + best.name;
    best.text = (best.text || proceduralText(best)) + ' ' + fate.line;
    return best;
  }
  function paintDeathOfferWeapon(w) {
    if (!U.deathOfferArt || !w) return;
    let prevId = lastPortraitId,
      prevT = lastPortraitT;
    lastPortraitId = null;
    lastPortraitT = -99;
    renderWeaponArt(w);
    let g = U.deathOfferArt.getContext('2d');
    g.clearRect(0, 0, U.deathOfferArt.width, U.deathOfferArt.height);
    g.drawImage(U.wArt, 0, 0, U.deathOfferArt.width, U.deathOfferArt.height);
    lastPortraitId = null;
    lastPortraitT = -99;
    renderWeaponArt(curW());
    lastPortraitId = prevId;
    lastPortraitT = prevT;
  }
  function resetDeathOfferUI() {
    deathRoll = 0;
    deathRolling = false;
    deathFateRolled = false;
    deathFate = null;
    deathOfferWeapon = null;
    if (U.magicD20) {
      U.magicD20.classList.remove('rolling', 'nat1', 'nat20');
    }
    if (U.d20Num) U.d20Num.textContent = '?';
    if (U.d20Result) U.d20Result.textContent = 'YOUR FATE HAS NOT BEEN AUDITED YET';
    if (U.deathOfferPreview) U.deathOfferPreview.classList.remove('revealed');
    if (U.deathOfferTake) {
      U.deathOfferTake.disabled = false;
      U.deathOfferTake.textContent = 'ROLL THE SHINY MAGICAL D20';
    }
    if (U.deathOfferName) U.deathOfferName.textContent = '';
    if (U.deathOfferStats) U.deathOfferStats.innerHTML = '';
    if (U.deathOfferFlavor) U.deathOfferFlavor.textContent = '';
  }
  function openDeathOffer(kind) {
    if (deathOfferOpen || bossRescueUsed || !bossMode) return false;
    deathOfferBoss = kind;
    deathOfferOpen = true;
    paused = false;
    over = false;
    stop = 0;
    resetDeathOfferUI();
    U.deathOfferTitle.textContent = 'AS YOU BEGIN TO PASS OUT...';
    U.deathOfferBody.innerHTML =
      'A <b style="color:#fff176">shiny magical D20</b> rolls into your hand. It appears to have unionized with destiny. Roll it to determine your last stand.';
    U.deathOffer.classList.add('show');
    tone(210, 920, 0.18, 0.05, 'triangle');
    noise(0.16, 0.03, 1700, 'highpass');
    U.msg.textContent =
      'Boss death detected. Destiny has produced a shiny D20 and absolutely no instructions.';
    return true;
  }
  function revealDeathFate(roll) {
    deathRoll = roll;
    deathFate = d20Fate(roll);
    deathOfferWeapon = makeDeathOfferWeapon(roll);
    deathFateRolled = true;
    deathRolling = false;
    if (U.magicD20) {
      U.magicD20.classList.remove('rolling');
      if (roll === 20) U.magicD20.classList.add('nat20');
      if (roll === 1) U.magicD20.classList.add('nat1');
    }
    U.d20Num.textContent = roll;
    U.d20Result.innerHTML = `<strong>${roll}</strong> — ${deathFate.title}`;
    U.deathOfferTitle.textContent =
      roll === 20 ? 'NATURAL 20. OH NO.' : roll === 1 ? 'NATURAL 1. STILL NOT DEAD.' : 'THE D20 HAS SPOKEN.';
    U.deathOfferBody.textContent = deathFate.line;
    U.deathOfferName.textContent = deathOfferWeapon.name;
    U.deathOfferName.style.color = deathOfferWeapon.col;
    U.deathOfferStats.innerHTML = [
      `<span class="deathOfferChip">ROLL ${roll}/20</span>`,
      `<span class="deathOfferChip">${deathOfferWeapon.rar}</span>`,
      `<span class="deathOfferChip">${WM[deathOfferWeapon.type].label}</span>`,
      `<span class="deathOfferChip">${Math.round(estimateDPS(deathOfferWeapon))} DPS</span>`,
      `<span class="deathOfferChip">${Math.round(deathFate.hp * 100)}% REVIVE</span>`,
      `<span class="deathOfferChip">${Math.round(deathFate.duration)}s POWER</span>`
    ].join('');
    U.deathOfferFlavor.textContent = deathOfferWeapon.text;
    paintDeathOfferWeapon(deathOfferWeapon);
    U.deathOfferPreview.classList.add('revealed');
    U.deathOfferTake.disabled = false;
    U.deathOfferTake.textContent =
      roll === 20 ? 'CLAIM THE NATURAL 20 • BREAK REALITY' : `CLAIM ROLL ${roll} • GET BACK UP`;
    let base = 280 + roll * 24;
    tone(base, base * 1.8, 0.16, 0.035 + roll * 0.0015, 'triangle');
    if (roll >= 17) {
      tone(720, 1680, 0.22, 0.04, 'sine', 0.04);
      noise(0.18, 0.035, 2600, 'highpass');
    }
    if (roll === 20) {
      flash = 0.8;
      chroma = 0.4;
      shake = 30;
      for (let i = 0; i < 4; i++)
        ring(W / 2, H / 2, ['#fff176', '#8ff2ff', '#ff78de', '#ffffff'][i], 130 + i * 55, 5);
      tone(95, 45, 0.28, 0.08, 'sawtooth');
    }
  }
  function rollDeathFate(forced = null) {
    if (!deathOfferOpen || deathRolling || deathFateRolled) return;
    if (forced !== null) {
      revealDeathFate(clamp(Math.round(forced), 1, 20));
      return;
    }
    deathRolling = true;
    U.deathOfferTake.disabled = true;
    U.deathOfferTake.textContent = 'THE D20 IS CONSULTING DESTINY...';
    U.magicD20.classList.add('rolling');
    let ticks = 0,
      spin = setInterval(() => {
        ticks++;
        U.d20Num.textContent = ri(1, 20);
        tone(260 + ticks * 17, 320 + ticks * 21, 0.025, 0.008, 'square');
        if (ticks >= 18) {
          clearInterval(spin);
          let roll = ri(1, 20);
          setTimeout(() => revealDeathFate(roll), 90);
        }
      }, 55);
  }
  function closeDeathOffer() {
    deathOfferOpen = false;
    deathOfferBoss = null;
    deathOfferWeapon = null;
    deathRolling = false;
    deathFateRolled = false;
    deathFate = null;
    deathRoll = 0;
    U.deathOffer && U.deathOffer.classList.remove('show');
  }
  function declineDeathOffer() {
    if (deathRolling) return;
    closeDeathOffer();
    if (bossMode) {
      let be = E.find(x => x.boss && !x.dead);
      if (be && !be.outcomeRecorded) {
        be.outcomeRecorded = true;
        bossRecord(be.boss, false);
      }
    }
    over = true;
    U.msg.textContent = 'You refused to roll the magical D20. Destiny respects the commitment to dying.';
  }
  function acceptDeathOffer() {
    if (!deathFateRolled) {
      rollDeathFate();
      return;
    }
    if (!deathOfferWeapon || !deathFate) return;
    let w = deathOfferWeapon,
      fate = deathFate,
      roll = deathRoll;
    closeDeathOffer();
    bossRescueUsed = true;
    superRoll = roll;
    Q = [];
    bossHazards = [];
    equip(w);
    superPower = fate.power;
    superT = fate.duration;
    pl.hp = Math.max(1, Math.round(pl.max * fate.hp));
    pl.mana = 100;
    pl.inv = roll === 20 ? 3.5 : 2.1 + roll * 0.045;
    pl.acd = 0;
    pl.scd = 0;
    pl.dcd = 0;
    pl.vx = 0;
    pl.vy = -120;
    styleAdd(260 + roll * 42, roll === 20 ? 'NATURAL 20 ASCENDED' : `D20 COMEBACK • ${roll}`);
    txt(
      W / 2,
      126,
      roll === 20 ? 'NATURAL 20 — FATE BROKEN' : `FATE ROLL: ${roll}`,
      roll === 20 ? '#fff176' : w.col,
      true
    );
    txt(
      W / 2,
      166,
      roll === 1
        ? 'EMBARRASSING ASCENDED'
        : roll >= 17
          ? 'ASCENDED: BARDIC BUDGET'
          : 'ASCENDED ACTIVATED',
      '#fff176',
      true
    );
    ring(pl.x + pl.w / 2, pl.y + pl.h / 2, w.col, 170 + roll * 3, 7);
    for (let i = 0; i < Math.min(38, 18 + roll); i++)
      part(pl.x + pl.w / 2, pl.y + pl.h / 2, i % 2 ? w.col : '#fff176', 10, 300 + roll * 7, 7);
    flash = roll === 20 ? 0.9 : 0.55 + roll * 0.012;
    chroma = Math.max(chroma, roll >= 17 ? 0.38 : 0.2);
    shake = roll === 20 ? 34 : 18 + roll * 0.5;
    tone(145, 980 + roll * 22, 0.24, 0.07, 'sawtooth');
    tone(720, 1580 + roll * 35, 0.2, 0.03, 'triangle', 0.04);
    if (roll === 20) {
      let be = E.find(x => x.boss && !x.dead);
      if (be) {
        let gift = Math.round(be.max * 0.08);
        be.hp = Math.max(1, be.hp - gift);
        txt(be.x + be.w / 2, be.y - 60, 'DESTINY DAMAGE -' + gift, '#fff176', true);
      }
    }
    U.msg.textContent = `D20 ROLL ${roll}: ${fate.title}. ${Math.round(fate.duration)} seconds of extremely questionable protagonist privilege.`;
    render();
  }
  function deathOfferPrimary() {
    if (deathRolling) return;
    if (!deathFateRolled) rollDeathFate();
    else acceptDeathOffer();
  }
  const EARLY_FUNNY_TRAITS = [
    'dark',
    'assbackwards',
    'speedy',
    'explosive',
    'gravitywrong',
    'bouncy',
    'haunted',
    'drunk',
    'magnetic',
    'jazzhands',
    'recoil',
    'tiny',
    'goose',
    'microwaved',
    'loud',
    'backwards'
  ];
  function chooseWeaponType() {
    let all = ['sword', 'dagger', 'nunchucks', 'katana', 'bow', 'shuriken', 'wand', 'staff', 'hammer'],
      last = equipTypeHistory.at(-1),
      prev = equipTypeHistory.at(-2),
      pool = all;
    // Ranged remains intentionally dominant, with shuriken joining the projectile-chaos pool.
    // Base split is ~84% ranged / 16% melee before anti-streak filtering.
    const weight = {
      bow: 27,
      shuriken: 20,
      wand: 21,
      staff: 16,
      sword: 4,
      dagger: 3,
      nunchucks: 3,
      katana: 3,
      hammer: 3
    };
    if (last && prev && last === prev) pool = all.filter(t => t !== last);
    let total = pool.reduce((n, t) => n + weight[t], 0),
      roll = Math.random() * total;
    for (const t of pool) {
      roll -= weight[t];
      if (roll <= 0) return t;
    }
    return pool.at(-1);
  }
  function rangedLootQuality(type) {
    return type === 'bow'
      ? 1.85
      : type === 'shuriken'
        ? 1.72
        : type === 'wand'
          ? 2.0
          : type === 'staff'
            ? 1.58
            : 1;
  }
  const SHARD_UNLOCK = 100,
    SHARD_CAP = 250;
  function shardValueForWeapon(w, newD, oldD) {
    let r = rarityIndex(w),
      base = [4, 6, 9, 13, 18, 24, 31, 39, 48, 58, 70, 82, 95][Math.min(12, r)] || 95,
      closeness = oldD > 0 ? clamp(newD / oldD, 0, 1) : 0.5;
    return Math.max(3, Math.round(base + closeness * 5));
  }
  function shardBonusRanks(v = weaponShards) {
    return clamp(Math.floor(Math.max(0, v - SHARD_UNLOCK) / 30), 0, 5);
  }
  function shardQualityLabel(v = weaponShards) {
    let b = shardBonusRanks(v);
    return b === 0
      ? 'SCRAP-GRADE FATE'
      : b === 1
        ? 'DECENTLY RECYCLED'
        : b === 2
          ? 'PREMIUM JUNK'
          : b === 3
            ? 'ARCANE SCRAP'
            : b === 4
              ? 'DESTINY-CHARGED'
              : b >= 5
                ? 'WEAPON LANDFILL SINGULARITY'
                : 'SCRAP-GRADE FATE';
  }
  function updateShardHud() {
    if (!U.shardHud) return;
    let pct = Math.min(100, (weaponShards / SHARD_UNLOCK) * 100),
      ready = weaponShards >= SHARD_UNLOCK;
    U.shardHud.classList.toggle('ready', ready);
    U.shardCount.textContent = `${weaponShards} / ${SHARD_UNLOCK}${weaponShards > SHARD_UNLOCK ? ' +' : ''}`;
    U.shardFill.style.width = pct + '%';
    U.shardDesc.textContent = ready
      ? `${shardQualityLabel()} • +${shardBonusRanks()} rarity ranks. Bank up to ${SHARD_CAP} for better odds.`
      : 'Weaker weapons become shards. 100 unlocks a fate roll; bank more for better rarity odds.';
    if (U.shardRollOpen)
      U.shardRollOpen.textContent = ready ? `ROLL D20 • ${weaponShards} SHARDS` : 'NEED 100 SHARDS';
  }
  function addWeaponShards(w, newD, oldD) {
    if (!w || w.fromShardForge) return 0;
    let gain = shardValueForWeapon(w, newD, oldD),
      before = weaponShards;
    weaponShards = clamp(weaponShards + gain, 0, SHARD_CAP);
    let actual = weaponShards - before;
    if (actual > 0) {
      txt(pl.x + pl.w / 2, pl.y - 48, `+${actual} WEAPON SHARDS`, '#9fe8ff', false);
      feedLine(
        `<span style="color:#9fe8ff">${w.name}</span><br>salvaged into <b>${actual} weapon shards</b> • bank ${weaponShards}/${SHARD_CAP}`
      );
      uiChime(false);
      updateShardHud();
    }
    if (
      before < SHARD_UNLOCK &&
      weaponShards >= SHARD_UNLOCK &&
      !shardPrompted &&
      !bossMode &&
      !deathOfferOpen &&
      !boonChoosing
    ) {
      shardPrompted = true;
      setTimeout(() => {
        if (gameStarted && !over && !bossMode && !deathOfferOpen && !boonChoosing) openShardForge();
      }, 120);
    }
    return actual;
  }
  function shardBaseRank(roll) {
    if (roll <= 3) return 0;
    if (roll <= 6) return 1;
    if (roll <= 10) return 2;
    if (roll <= 14) return 3;
    if (roll <= 17) return 4;
    if (roll === 18) return 5;
    if (roll === 19) return 6;
    return 7;
  }
  function shardForgeRank(roll, spend) {
    return clamp(shardBaseRank(roll) + shardBonusRanks(spend), 0, R.length - 1);
  }
  function shardForgeOddsText(spend) {
    let b = shardBonusRanks(spend),
      nat20 = R[clamp(7 + b, 0, R.length - 1)].n,
      high = R[clamp(5 + b, 0, R.length - 1)].n,
      mid = R[clamp(3 + b, 0, R.length - 1)].n;
    return `ROLL 11–14 → ${mid} • 18 → ${high} • NAT 20 → ${nat20}. Every 30 shards above 100 adds +1 rarity rank.`;
  }
  function makeExactRankWeapon(level, rank) {
    rank = clamp(rank, 0, R.length - 1);
    let r = R[rank],
      type = chooseWeaponType(),
      traitCount =
        rank < 2
          ? Math.random() < 0.38
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
    let w = {
      id: next++,
      type,
      name: '',
      mod,
      rar: r.n,
      col: r.col,
      p: r.p,
      lv: level,
      m: r.m * (0.94 + Math.random() * 0.12) * rangedLootQuality(type),
      crit: 0.012 * r.p,
      material,
      traits,
      intensity,
      cap,
      capName,
      capText,
      killStacks: 0,
      fromShardForge: true
    };
    w.name = buildName(type, r, material, traits, intensity);
    w.synergy = detectSynergy(w);
    w.text =
      proceduralText(w) +
      (w.synergy ? ` SYNERGY: ${w.synergy.name} — ${w.synergy.desc}` : '') +
      ' Forged from the compressed remains of inferior weapons.';
    return w;
  }
  function resetShardForgeUI() {
    shardForgeRolling = false;
    shardForgeRolled = false;
    shardForgeWeapon = null;
    shardForgeRoll = 0;
    shardForgeSpend = 0;
    if (U.forgeD20) {
      U.forgeD20.classList.remove('rolling');
    }
    if (U.forgeD20Num) U.forgeD20Num.textContent = '?';
    if (U.forgeResult) U.forgeResult.classList.remove('show');
    if (U.forgeRollBtn) {
      U.forgeRollBtn.disabled = false;
      U.forgeRollBtn.textContent = 'ROLL THE SHARD D20';
    }
    if (U.forgeKeepBtn) {
      U.forgeKeepBtn.disabled = false;
      U.forgeKeepBtn.textContent = 'KEEP COLLECTING';
    }
  }
  function openShardForge() {
    if (weaponShards < SHARD_UNLOCK || shardForgeOpen || deathOfferOpen || boonChoosing) return false;
    shardForgeOpen = true;
    resetShardForgeUI();
    let spend = weaponShards;
    U.shardForge.classList.add('show');
    U.forgeBank.textContent = `${spend} SHARDS BANKED`;
    U.forgeQuality.textContent = `${shardQualityLabel(spend)} • +${shardBonusRanks(spend)} RARITY RANKS`;
    U.forgeOdds.textContent = shardForgeOddsText(spend);
    U.shardForgeSub.textContent =
      'Roll a fair D20. Your shard pile determines how valuable each face becomes. The resulting weapon may still be worse than what you already have.';
    uiChime(true);
    return true;
  }
  function closeShardForge() {
    if (shardForgeRolling) return;
    shardForgeOpen = false;
    U.shardForge?.classList.remove('show');
    resetShardForgeUI();
    updateShardHud();
  }
  function revealShardForge(roll) {
    shardForgeRolling = false;
    shardForgeRolled = true;
    shardForgeRoll = roll;
    let rank = shardForgeRank(roll, shardForgeSpend);
    shardForgeWeapon = makeExactRankWeapon(
      Math.max(pl.lv, Z[zoneI].lv) + 1 + Math.floor(shardForgeSpend / 60),
      rank
    );
    let d = estimateDPS(shardForgeWeapon),
      cur = estimateDPS(curW()),
      pct = Math.round((d / Math.max(1, cur) - 1) * 100);
    U.forgeD20.classList.remove('rolling');
    U.forgeD20Num.textContent = roll;
    U.forgeResult.classList.add('show');
    U.forgeResultName.textContent = shardForgeWeapon.name;
    U.forgeResultName.style.color = shardForgeWeapon.col;
    U.forgeResultMeta.textContent = `D20 ${roll} • ${shardForgeWeapon.rar} ${WM[shardForgeWeapon.type].label} • ${Math.round(d)} DPS`;
    U.forgeResultCompare.textContent =
      pct > 1
        ? `+${pct}% vs current — CRAZY WEAPON MAN APPROVES`
        : `${pct}% vs current — THIS MAY BE EXPENSIVE GARBAGE`;
    U.forgeResultCompare.style.color = pct > 1 ? '#8fffb2' : '#ffb080';
    U.forgeRollBtn.disabled = false;
    U.forgeRollBtn.textContent = 'RESOLVE THIS WEAPON';
    U.forgeKeepBtn.disabled = true;
    U.forgeKeepBtn.textContent = 'SHARDS ALREADY SPENT';
    tone(330 + roll * 20, 650 + roll * 35, 0.18, 0.035, 'triangle');
    if (roll === 20) {
      flash = 0.35;
      chroma = 0.16;
      uiChime(true);
    }
  }
  function rollShardForge(forced = null) {
    if (!shardForgeOpen || shardForgeRolling) return;
    if (shardForgeRolled) {
      let w = shardForgeWeapon;
      closeShardForge();
      if (w) equip(w);
      return;
    }
    if (weaponShards < SHARD_UNLOCK) return;
    shardForgeSpend = weaponShards;
    weaponShards = 0;
    updateShardHud();
    shardForgeRolling = true;
    U.forgeRollBtn.disabled = true;
    U.forgeKeepBtn.disabled = true;
    U.forgeRollBtn.textContent = 'THE SHARDS ARE GAMBLING...';
    U.forgeD20.classList.add('rolling');
    let ticks = 0,
      done = () => {
        let roll = forced !== null ? clamp(Math.round(forced), 1, 20) : ri(1, 20);
        revealShardForge(roll);
      };
    if (forced !== null) {
      setTimeout(done, 80);
      return;
    }
    let spin = setInterval(() => {
      ticks++;
      U.forgeD20Num.textContent = ri(1, 20);
      tone(250 + ticks * 13, 300 + ticks * 16, 0.022, 0.006, 'square');
      if (ticks >= 16) {
        clearInterval(spin);
        setTimeout(done, 70);
      }
    }, 55);
  }
