  const R = [
    { n: 'Common', c: 420000, m: 1.0, p: 1.0, col: '#aab0b7' },
    { n: 'Uncommon', c: 260000, m: 1.05, p: 1.08, col: '#8ed081' },
    { n: 'Magic', c: 150000, m: 1.11, p: 1.18, col: '#65a7ff' },
    { n: 'Rare', c: 80000, m: 1.2, p: 1.32, col: '#e3c66c' },
    { n: 'Super Rare', c: 39000, m: 1.3, p: 1.48, col: '#ffca62' },
    { n: 'Epic', c: 18500, m: 1.42, p: 1.66, col: '#c67bff' },
    { n: 'Heroic', c: 8200, m: 1.55, p: 1.86, col: '#e487ff' },
    { n: 'Legendary', c: 3300, m: 1.7, p: 2.1, col: '#ff7a3d' },
    { n: 'Mythic', c: 900, m: 1.88, p: 2.38, col: '#ff36c8' },
    { n: 'Ultra Mythic', c: 180, m: 2.08, p: 2.68, col: '#ff66ee' },
    { n: 'Exotic', c: 60, m: 2.3, p: 3.0, col: '#57f0c6' },
    { n: 'Ultra Exotic', c: 18, m: 2.55, p: 3.36, col: '#4dffe5' },
    { n: 'Relic', c: 5.5, m: 2.84, p: 3.76, col: '#f4e08b' },
    { n: 'Ancient', c: 1.6, m: 3.18, p: 4.2, col: '#eab66f' },
    { n: 'Transcendent', c: 0.46, m: 3.58, p: 4.72, col: '#79a7ff' },
    { n: 'Unheard Of', c: 0.13, m: 4.05, p: 5.3, col: '#78fff4' },
    { n: 'Super Ultra Rare', c: 0.036, m: 4.6, p: 5.95, col: '#fff176' },
    { n: 'Forbidden', c: 0.009, m: 5.25, p: 6.7, col: '#ff3157' },
    { n: 'Impossible', c: 0.0022, m: 6.05, p: 7.6, col: '#ffffff' },
    { n: 'Cataclysmic', c: 0.00045, m: 7.05, p: 8.75, col: '#ff8c40' },
    { n: 'WHAT?!', c: 0.00007, m: 8.35, p: 10.2, col: '#f8ffff' }
  ];
  const RANKS = R.map(x => x.n);
  const WM = {
    sword: {
      label: 'SWORD',
      cd: 0.26,
      desc: 'BRAWLER: high damage, crit and knockback; 16% less incoming damage up close.'
    },
    dagger: {
      label: 'DAGGER',
      cd: 0.145,
      desc: 'BRAWLER: extreme crit cadence and speed; 16% less incoming damage up close.'
    },
    nunchucks: {
      label: 'NUNCHUCKS',
      cd: 0.16,
      desc: 'BRAWLER: rapid alternating multi-hits that build stun and combo absurdly fast.'
    },
    katana: {
      label: 'KATANA',
      cd: 0.25,
      desc: 'BRAWLER: precise draw slashes with huge crit chance, reach and clean launch.'
    },
    bow: { label: 'BOW', cd: 0.3, desc: 'Ranged kiting; pierce and aerial safety.' },
    shuriken: {
      label: 'SHURIKEN',
      cd: 0.21,
      desc: 'Ranged ninja nonsense: fast spinning stars that pierce, ricochet and return.'
    },
    wand: { label: 'WAND', cd: 0.32, desc: 'Homing magic that lets you attack while repositioning.' },
    staff: { label: 'STAFF', cd: 0.47, desc: 'Slow casts that delete clusters instead of individuals.' },
    hammer: {
      label: 'HAMMER',
      cd: 0.46,
      desc: 'BRAWLER: enormous damage, launch and stagger; 16% less incoming damage up close.'
    }
  };
  const N = {
    sword: [
      'Falchion',
      'Runeblade',
      'Jagged Saber',
      'Nightblade',
      'Executioner',
      'Moon Saw',
      'Problem Solver',
      'Tax Evasion Blade',
      'Sword-Shaped Liability',
      'Emergency Cutlery',
      'Curb Stomper',
      'Long Knife Of Grievances'
    ],
    dagger: [
      'Dagger',
      'Stiletto',
      'Kris',
      'Punch Knife',
      'Fang',
      'Pocket Menace',
      'Tiny Crime',
      'Stabby Receipt',
      'Mead Break Shiv',
      'Needle of Regret',
      'Backspace'
    ],
    nunchucks: [
      'Nunchucks',
      'Payroll Nunchucks',
      'Chain Complaint',
      'Double Bonk',
      'Grievance Flails',
      'Mead Break Nunchucks',
      'Spinning Liability',
      'Two-Stick Problem',
      'Concussion Necklace',
      'Danger Yo-Yo'
    ],
    katana: [
      'Katana',
      'Scriptorium Samurai',
      'Overtime Katana',
      'Performance Review Blade',
      'Long Council Ender',
      'Payroll Ronin',
      'Quarterly Cut',
      'Iaido Incident',
      'Extremely Sharp Memo',
      'Restructuring Katana'
    ],
    bow: [
      'Hunter Bow',
      'War Bow',
      'Composite Bow',
      'Bone Longbow',
      'Hex Bow',
      'Administrative Longbow',
      'Spaghetti Launcher',
      'Moon Bow',
      'Compound Problem',
      'Hostile Geometry',
      'Arrow Dispenser'
    ],
    shuriken: [
      'Shuriken',
      'Ninja Receipt',
      'Throwing Problem',
      'Payroll Star',
      'Five-Point Guild Grievance',
      'Spinny Liability',
      'Pocket Windmill',
      'Tax Star',
      'Administrative Shuriken',
      'Quarterly Ninja Disk'
    ],
    wand: [
      'Arcane Wand',
      'Ember Wand',
      'Hex Wand',
      'Spirit Wand',
      'Spark Wand',
      'Guild-Safety Wand',
      'Toll Writ Wand',
      'Wizard Stick',
      'Dragon-Oven Wand',
      'Compliance Rod',
      'Questionable Pointer'
    ],
    staff: [
      'Oak Staff',
      'Storm Staff',
      'Infernal Staff',
      'Astral Staff',
      'Fat Staff',
      'Morbidly Obese Staff',
      'Payroll Staff',
      'Weather Stick',
      'Wizard Iron-Bar',
      'Staff Council',
      'Long Problem'
    ],
    hammer: [
      'War Hammer',
      'Maul',
      'Stonebreaker',
      'Judgement Hammer',
      'Crusher',
      'Guild Grievance',
      'Municipal Hammer',
      'Concrete Opinion',
      'Bonk Engine',
      'Debt Restructurer',
      'Portable Accident'
    ]
  };
  const PF = [
    'Savage',
    'Ashen',
    'Ancient',
    'Stormbound',
    'Vicious',
    'Runed',
    'Relentless',
    'Warped',
    'Rabid',
    'Crooked',
    'Violent',
    'Unlicensed',
    'Over-Potioned',
    'Spiteful',
    'Jazz',
    'Aggressively Legal',
    'Emotionally Complicated',
    'Tax-Deductible',
    'Suspiciously Warm',
    'Guild-Made',
    'Non-Euclidean',
    'Extremely Online',
    'Budget',
    'Questionably Sentient'
  ];
  const SUFFIXES = [
    'of Bad Decisions',
    'of Excessive Force',
    'of the Toll-Bridge Authority',
    'of Unscheduled Maintenance',
    'of Mild Panic',
    'of Weaponized Accounting',
    'of Questionable Intent',
    'of Greater Bonking',
    'of the Last Brain Cell',
    'of Guild-Safety Noncompliance',
    'of Recursive Problems',
    'of the Tuesday Incident',
    'of Unpaid Overtime',
    'of Extremely Local Weather',
    'of the Forbidden Feast Hall'
  ];
  const NAME_CHAOS = [
    'Guild-Safety-Adjacent',
    'Courtyard Approved',
    'Unsupervised',
    'Probably Legal',
    'Break-Room Certified',
    'Emotionally Overclocked',
    'Management-Resistant',
    'Siege-Ox Compatible',
    'After-Hours',
    'Blessing-Void',
    'Suspiciously Motivated',
    'Municipally Questionable',
    'Aggressively Portable',
    'Payroll-Disputed',
    'Liability-Shaped',
    'Council-Proof',
    'Raccoon-Endorsed',
    'Dragon-Oven-Adjacent',
    'Deeply Unnecessary',
    'Budget-Unlimited'
  ];
  const MATERIALS = [
    {
      n: 'Diamond',
      code: 'diamond',
      dam: 1.06,
      crit: 0.035,
      spd: 1,
      aoe: 1.05,
      desc: 'hits refract into extra attacks'
    },
    {
      n: 'Obsidian',
      code: 'obsidian',
      dam: 1.12,
      crit: 0.01,
      spd: 0.97,
      aoe: 1.08,
      desc: 'heavy hits throw razor shards'
    },
    {
      n: 'Bone',
      code: 'bone',
      dam: 1.02,
      crit: 0.01,
      spd: 1.02,
      aoe: 1,
      desc: 'the weapon grows stronger from kills'
    },
    {
      n: 'Glass',
      code: 'glass',
      dam: 0.96,
      crit: 0.14,
      spd: 1.08,
      aoe: 1,
      desc: 'extreme critical chance and brittle violence'
    },
    {
      n: 'Void',
      code: 'void',
      dam: 1.08,
      crit: 0.02,
      spd: 1,
      aoe: 1.12,
      desc: 'attacks periodically drag enemies into singularities'
    },
    {
      n: 'Meat',
      code: 'meat',
      dam: 1.03,
      crit: 0,
      spd: 1,
      aoe: 1.05,
      desc: 'the weapon physically grows as it feeds'
    },
    {
      n: 'Gold',
      code: 'gold',
      dam: 1.04,
      crit: 0.015,
      spd: 1.03,
      aoe: 1,
      desc: 'kills spit glittering bonus projectiles'
    },
    {
      n: 'Rubber',
      code: 'rubber',
      dam: 0.98,
      crit: 0.01,
      spd: 1.08,
      aoe: 1,
      desc: 'attacks bounce into extra targets'
    },
    {
      n: 'Meteoric',
      code: 'nuclear',
      dam: 1.18,
      crit: 0,
      spd: 0.94,
      aoe: 1.25,
      desc: 'occasional impacts become small disasters'
    },
    {
      n: 'Frozen',
      code: 'frozen',
      dam: 1.05,
      crit: 0.025,
      spd: 1,
      aoe: 1.08,
      desc: 'hits can freeze enemies in place'
    },
    {
      n: 'Living',
      code: 'living',
      dam: 1.07,
      crit: 0.02,
      spd: 1.05,
      aoe: 1,
      desc: 'the weapon attacks things by itself'
    },
    {
      n: 'Starfire',
      code: 'plasma',
      dam: 1.1,
      crit: 0.025,
      spd: 1.08,
      aoe: 1.12,
      desc: 'high-energy strikes splash through packs'
    }
  ];
  const TRAITS = [
    {
      n: 'Fat',
      code: 'fat',
      dam: 1.28,
      spd: 0.72,
      aoe: 1.62,
      desc: 'comically oversized attacks and area, but slower swings'
    },
    {
      n: 'Rhythmic',
      code: 'rhythmic',
      dam: 1.04,
      spd: 1.08,
      aoe: 1,
      desc: 'every fourth attack detonates a tempo burst'
    },
    { n: 'Pure', code: 'pure', dam: 1.25, spd: 1, aoe: 1, desc: 'brutal raw damage with less subtlety' },
    {
      n: 'Asthma',
      code: 'asthma',
      dam: 1.1,
      spd: 1.34,
      aoe: 1,
      desc: 'frantic attack speed that drains mana and occasionally wheezes'
    },
    {
      n: 'Insanity',
      code: 'insanity',
      dam: 1.08,
      spd: 1.15,
      aoe: 1.05,
      desc: 'damage ramps as the attack chain gets longer'
    },
    { n: 'Hex', code: 'hex', dam: 1.07, spd: 1, aoe: 1.1, desc: 'periodic violet curse eruptions' },
    {
      n: 'Recursive',
      code: 'recursive',
      dam: 1.11,
      spd: 1,
      aoe: 1,
      desc: 'attacks periodically copy themselves into nearby enemies'
    },
    { n: 'Rabid', code: 'rabid', dam: 1.05, spd: 1.22, aoe: 1, desc: 'ferocious speed and short recovery' },
    {
      n: 'Sentient',
      code: 'sentient',
      dam: 1.08,
      spd: 1.04,
      aoe: 1,
      desc: 'the weapon occasionally attacks without permission'
    },
    {
      n: 'Moist',
      code: 'moist',
      dam: 1.02,
      spd: 1.06,
      aoe: 1.22,
      desc: 'splashy impacts spread damage nearby'
    },
    {
      n: 'Chronically Unstable',
      code: 'unstable',
      dam: 1.15,
      spd: 1.03,
      aoe: 1.18,
      desc: 'random attacks violently overperform'
    },
    { n: 'Angry', code: 'angry', dam: 1.12, spd: 1.1, aoe: 1, desc: 'simply furious and therefore stronger' },
    {
      n: 'Unreasonably Long',
      code: 'long',
      dam: 1.04,
      spd: 0.93,
      aoe: 1.38,
      desc: 'the hitbox has no respect for personal space'
    },
    {
      n: 'Tax Evasive',
      code: 'taxevasive',
      dam: 1.04,
      spd: 1.05,
      aoe: 1,
      desc: 'kills mysteriously restore mana that was never declared'
    },
    {
      n: 'Possessed by a Goose',
      code: 'goose',
      dam: 1.03,
      spd: 1.12,
      aoe: 1.08,
      desc: 'every few attacks honk a spectral weapon into somebody else'
    },
    {
      n: 'Oven-Blasted',
      code: 'microwaved',
      dam: 1.09,
      spd: 1.04,
      aoe: 1.16,
      desc: 'periodically erupts into deeply unsafe starfire leftovers'
    },
    {
      n: 'Divorced',
      code: 'divorced',
      dam: 1.06,
      spd: 1.08,
      aoe: 1,
      desc: 'has nothing to lose and an alarming critical-hit rate'
    },
    {
      n: 'Suspiciously Ergonomic',
      code: 'ergonomic',
      dam: 1.02,
      spd: 1.18,
      aoe: 1.04,
      desc: 'somehow comfortable enough to become a kingdom concern'
    },
    {
      n: 'Loud',
      code: 'loud',
      dam: 1.08,
      spd: 1,
      aoe: 1.2,
      desc: 'every fifth attack becomes an unnecessary shockwave'
    },
    {
      n: 'Backwards',
      code: 'backwards',
      dam: 1.05,
      spd: 1.07,
      aoe: 1,
      desc: 'occasionally attacks the wrong direction and somehow hits something'
    },
    {
      n: 'Cauldron Safe',
      code: 'dishwasher',
      dam: 1.03,
      spd: 1.06,
      aoe: 1.08,
      desc: 'gets inexplicably stronger around water and forge-grade soup'
    },
    {
      n: 'Emotionally Available',
      code: 'emotional',
      dam: 1.02,
      spd: 1.02,
      aoe: 1,
      desc: 'critical hits provide a tiny amount of healing and validation'
    },
    {
      n: 'Dark',
      code: 'dark',
      dam: 1.13,
      spd: 1.02,
      aoe: 1.12,
      desc: 'kills the lights; you fight inside a moving pocket of visibility'
    },
    {
      n: 'Ass Backwards',
      code: 'assbackwards',
      dam: 1.08,
      spd: 1.1,
      aoe: 1.05,
      desc: 'attacks fire behind Crazy Weapon Man. Yes, out of his ass.'
    },
    {
      n: 'Speedy',
      code: 'speedy',
      dam: 0.98,
      spd: 1.48,
      aoe: 0.94,
      desc: 'movement and attacks become irresponsibly fast'
    },
    {
      n: 'Explosive Personality',
      code: 'explosive',
      dam: 1.1,
      spd: 1.03,
      aoe: 1.3,
      desc: 'every third attack develops an explosive personality'
    },
    {
      n: 'Gravitationally Incorrect',
      code: 'gravitywrong',
      dam: 1.04,
      spd: 1.08,
      aoe: 1.16,
      desc: 'hits randomly launch enemies upward or slam them downward'
    },
    {
      n: 'Bouncy Castle Certified',
      code: 'bouncy',
      dam: 0.98,
      spd: 1.12,
      aoe: 1.08,
      desc: 'projectiles ricochet and melee hits bounce enemies like bad birthday entertainment'
    },
    {
      n: 'Haunted',
      code: 'haunted',
      dam: 1.06,
      spd: 1.05,
      aoe: 1.05,
      desc: 'ghost weapons periodically swing themselves at nearby enemies'
    },
    {
      n: 'Drunk',
      code: 'drunk',
      dam: 1.12,
      spd: 1.12,
      aoe: 1.18,
      desc: 'attacks wobble unpredictably but hit with misplaced confidence'
    },
    {
      n: 'Magnetic',
      code: 'magnetic',
      dam: 1.03,
      spd: 1.03,
      aoe: 1.16,
      desc: 'attacks drag nearby enemies toward the impact before throwing them away'
    },
    {
      n: 'Cursed With Jazz Hands',
      code: 'jazzhands',
      dam: 1.02,
      spd: 1.2,
      aoe: 1.12,
      desc: 'every few attacks spray uselessly magnificent projectiles in all directions'
    },
    {
      n: 'Too Much Recoil',
      code: 'recoil',
      dam: 1.18,
      spd: 0.96,
      aoe: 1.08,
      desc: 'hits launch enemies hard and also kick Crazy Weapon Man backward'
    },
    {
      n: 'Suspiciously Tiny',
      code: 'tiny',
      dam: 0.88,
      spd: 1.55,
      aoe: 0.72,
      desc: 'the weapon becomes tiny, hyperactive, and weirdly hard to stop'
    }
  ];

  const META_TRAITS = [
    {
      n: 'Arcanely Dubious',
      code: 'quantum',
      dam: 1.06,
      spd: 1.08,
      aoe: 1.12,
      desc: 'attacks sometimes occur twice because causality has poor supervision'
    },
    {
      n: 'Carrier-Pigeon Compatible',
      code: 'iexplorer',
      dam: 1.24,
      spd: 0.74,
      aoe: 1.22,
      desc: 'attacks arrive late, enormous, and ask to be your default browser'
    },
    {
      n: 'Left-Handed On Tuesdays',
      code: 'tuesday',
      dam: 1.05,
      spd: 1.1,
      aoe: 1.08,
      desc: 'every seventh attack reverses direction and gains a baffling bonus'
    },
    {
      n: 'Sponsored',
      code: 'sponsored',
      dam: 1.07,
      spd: 1.05,
      aoe: 1.1,
      desc: 'kills occasionally trigger an obnoxious PRODUCT PLACEMENT explosion'
    },
    {
      n: 'Time-Zone Confused',
      code: 'timezone',
      dam: 1.08,
      spd: 1.12,
      aoe: 1.08,
      desc: 'projectiles periodically arrive from where they will have been'
    },
    {
      n: 'Legally A Boat',
      code: 'boat',
      dam: 1.1,
      spd: 0.94,
      aoe: 1.28,
      desc: 'massive wake attacks and dramatic strength in suspicious liquids'
    }
  ];
  const INTENSITY = ['', 'Ultra', 'Hyper', 'Prime', 'Absolute', 'Apex'];
  const CAP = {
    sword: [
      ['worldcutter', 'reality-cutting crescents cross the map'],
      ['horizon', 'critical hits leave murderous after-images'],
      ['nullall', 'kills recursively slash whatever is still alive']
    ],
    dagger: [
      ['mirrorflurry', 'every fourth attack produces a mirrored dagger flurry'],
      ['blooddance', 'critical hits teleport a spectral stab into another enemy'],
      ['knifegod', 'the screen fills with autonomous knives']
    ],
    nunchucks: [
      ['chainstorm', 'every third combo becomes a spinning chain storm'],
      ['blender', 'rapid hits drag enemies into the nunchuck millstone'],
      ['orbitalkarate', 'ghost nunchucks orbit you and bonk independently']
    ],
    katana: [
      ['iaijutsu', 'draw slashes gain brutal crit scaling and screen-long reach'],
      ['moonslice', 'every third cut launches a crescent through the battlefield'],
      ['severfuture', 'critical cuts repeat a moment later from impossible angles']
    ],
    bow: [
      ['starfall', 'arrows split and call stars from above'],
      ['thousand', 'spectral copies attack multiple targets'],
      ['constellation', 'arrows become autonomous star systems']
    ],
    shuriken: [
      ['ricochetstorm', 'stars aggressively bounce between nearby targets'],
      ['shadowclone', 'every volley creates spectral duplicate throws'],
      ['ninjaccounting', 'the entire screen becomes a legally questionable shuriken expense']
    ],
    wand: [
      ['voidbloom', 'kills open void flowers that shred nearby enemies'],
      ['echoes', 'spells duplicate and criticals duplicate them again'],
      ['blackhole', 'hits periodically create hungry singularities']
    ],
    staff: [
      ['archon', 'casts chain lightning across the battlefield'],
      ['sunfall', 'casts leave burning miniature suns'],
      ['weatheradmin', 'the sky itself becomes your weapon']
    ],
    hammer: [
      ['godbreaker', 'every slam causes an earthquake'],
      ['argument', 'launched enemies detonate in mid-air'],
      ['continental', 'impacts are large enough to move continents']
    ]
  };
  const GENERIC = {
    sword: 'Blade',
    dagger: 'Dagger',
    nunchucks: 'Nunchucks',
    katana: 'Katana',
    bow: 'Bow',
    shuriken: 'Shuriken',
    wand: 'Wand',
    staff: 'Staff',
    hammer: 'Hammer'
  };
