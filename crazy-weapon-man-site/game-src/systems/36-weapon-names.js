// Weapon names that escalate with rarity but always fit on screen (phase 4).
//
// The old names were assembled by ~10 systems appending prefixes, " // model" and suffix chunks
// (median 100 chars, up to 210). Every weapon factory is wrapped here (outermost), and each new
// weapon gets one name built from its real attributes. The name is then locked; it is rebuilt only
// when the weapon's rarity changes. Length budget by rarity rank q (0-10):
//   q0-1  "Rusty Sword"                              <= 22
//   q2-3  "Haunted Katana of Mild Peril"             <= 30
//   q4-5  "Starfire Royal Hammer of Unpaid Fines"    <= 36
//   q6-7  "Bonkreaver, Bane of Landlords"            <= 38   named relics
//   q8-9  "Honkmourn IX, Who Audits the Gods"        <= 40
//   q10   "THE GOOSE (A SWORD)"                       absurd and short
(() => {
  if (globalThis.__CWM_WEAPON_NAMES) return;
  globalThis.__CWM_WEAPON_NAMES = true;

  const pick = a => a[Math.floor(Math.random() * a.length)];
  const BASE = {
    sword: ['Sword', 'Blade', 'Broadsword', 'Longsword', 'Claymore'],
    dagger: ['Dagger', 'Shiv', 'Dirk', 'Stiletto', 'Knife'],
    nunchucks: ['Nunchucks', 'Flails', 'Chain Sticks', 'Whackers'],
    katana: ['Katana', 'Nodachi', 'Curved Blade', 'Odachi'],
    shuriken: ['Shuriken', 'Throwing Star', 'Star', 'Disc'],
    bow: ['Bow', 'Longbow', 'Shortbow', 'Warbow'],
    wand: ['Wand', 'Twig', 'Rod', 'Baton'],
    staff: ['Staff', 'Stave', 'Scepter', 'Walking Stick'],
    hammer: ['Hammer', 'Maul', 'Mallet', 'Bonker']
  };
  const COND = ['Rusty', 'Chipped', 'Borrowed', 'Damp', 'Dented', 'Wobbly', 'Pointy', 'Used', 'Stolen', 'Bent',
    'Discount', 'Loose', 'Sticky', 'Musty', 'Plain', 'Spare', 'Sad', 'Cracked'];
  const ADJ = ['Haunted', 'Grumpy', 'Cursed', 'Sneaky', 'Spiteful', 'Shiny', 'Feral', 'Smug', 'Jittery', 'Honking',
    'Moody', 'Bitey', 'Rowdy', 'Gloomy', 'Brave-ish', 'Forbidden', 'Suspicious', 'Overbrewed'];
  const OF = ['Mild Peril', 'Regret', 'Bees', 'Soup', 'Taxes', 'Bad Ideas', 'Paperwork', 'Tuesdays', 'the Goose',
    'Second Thoughts', 'Loud Noises', 'Questionable Ethics', 'Late Fees', 'Poor Choices', 'Minor Doom', 'Snacks'];
  const GRAND = ['Royal', 'Ancient', 'Eldritch', 'Dread', 'Sacred', 'Infernal', 'Celestial', 'Unholy', 'Mighty'];
  const OF_GRAND = ['Unpaid Fines', 'the Last Goose', 'Endless Audits', 'a Thousand Bonks', 'Total Overkill',
    'the Angry Moon', 'Doom, Mostly', 'Unspeakable Snacks', 'the Ninth Invoice', 'Very Loud Thunder'];
  const SYL_A = ['Grim', 'Bonk', 'Honk', 'Mor', 'Skal', 'Vex', 'Thun', 'Gor', 'Brin', 'Krag', 'Zul', 'Dread', 'Snor', 'Glum'];
  const SYL_B = ['brand', 'reaver', 'fang', 'mourn', 'bane', 'gash', 'dor', 'wick', 'thorn', 'rend', 'grin', 'hammer'];
  const EPITHET = ['Bane of Landlords', 'Eater of Lunches', 'Who Honks at Kings', 'the Unreasonable',
    'Scourge of Paperwork', 'Breaker of Shins', 'the Very Loud', 'Doom of Small Goblins', 'Friend to No One',
    'the Last Excuse', 'Who Audits the Gods', 'the Ill-Advised', 'Ender of Brunch', 'Terror of Geese'];
  const ROMAN = ['II', 'III', 'IV', 'VII', 'IX', 'XII', 'XL', 'MMX'];
  const WHAT = ['THE GOOSE', 'IT', 'A SWORD?', 'THE LAST INVOICE', 'BONK', 'MOM', 'THE GOOD ONE', 'NO', 'THE ENDING',
    'A DOOR', 'UNCLE', 'THE MOON, BUT SHARP'];

  const fit = (s, max) => (s.length <= max ? s : s.slice(0, max).replace(/[\s,]+\S*$/, ''));
  const titleCase = n => n.toLowerCase().replace(/(^|[\s-])([a-z])/g, (x, p, c) => p + c.toUpperCase());
  const elemOf = w => {
    const e = w.element || null;
    if (!e) return null;
    const n = e.name || e.n || e.label;
    return {
      family: e.family || e.id || null,
      word: typeof n === 'string' && n.length <= 10 ? titleCase(n) : null,
      prefix: typeof e.prefix === 'string' ? e.prefix : null
    };
  };
  const relicName = () => pick(SYL_A) + pick(SYL_B);

  // Returns [name, max length, look]. The look records which words were used, so the weapon can be
  // drawn the way it is named (systems/40-weapon-looks.js): a Rusty Sword is rusty, a Haunted one
  // trails ghosts, a Starfire one throws embers, relics glow.
  function build(w, q, base) {
    const el0 = elemOf(w),
      // element weapons say so in the name most of the time (variety for the rest)
      el = el0 && Math.random() < 0.65 ? el0 : null,
      look = { q, base, family: el0 ? el0.family : null };
    if (q <= 1) {
      look.cond = pick(COND);
      if (el && el.prefix) {
        look.elemNamed = true;
        const a = `${look.cond} ${el.prefix} ${base}`;
        return [a.length <= 22 ? a : `${el.prefix} ${base}`, 22, look];
      }
      return [`${look.cond} ${base}`, 22, look];
    }
    if (q <= 3) {
      look.of = pick(OF);
      if (el && el.prefix) {
        look.elemNamed = true;
        return [`${el.prefix} ${base} of ${look.of}`, 30, look];
      }
      look.adj = pick(ADJ);
      return [`${look.adj} ${base} of ${look.of}`, 30, look];
    }
    if (q <= 5) {
      look.of = pick(OF_GRAND);
      let pre;
      if (el && el.word) {
        pre = el.word;
        look.elemNamed = true;
      } else pre = look.grand = pick(GRAND);
      if (Math.random() < 0.5) {
        look.adj = pick(ADJ);
        return [`${pre} ${look.adj} ${base} of ${look.of}`, 36, look];
      }
      return [`${pre} ${base} of ${look.of}`, 36, look];
    }
    look.relic = relicName();
    look.epithet = pick(EPITHET);
    look.elemNamed = !!el;
    if (q <= 7) return [`${look.relic}, ${look.epithet}`, 38, look];
    look.roman = pick(ROMAN);
    if (q <= 9) return [`${look.relic} ${look.roman}, ${look.epithet}`, 40, look];
    look.what = pick(WHAT);
    const b0 = (BASE[w.type] || BASE.sword)[0].toUpperCase();
    look.base = (BASE[w.type] || BASE.sword)[0];
    return [`${look.what} (${b0.endsWith('S') ? 'SOME' : 'A'} ${b0})`, 40, look];
  }
  function nameFor(w) {
    const q = Math.max(0, Math.min(10, Number(rarityRank(w)) || 0));
    // standouts (1 in 5 drops, see 00-damage-budget.js) get names a couple of tiers grander
    const r = nameAt(w, w.__standout ? Math.min(10, Math.max(q + 2, 4)) : q);
    r.look.standout = !!w.__standout;
    return r;
  }
  function nameAt(w, q) {
    let last = null;
    // re-roll until a whole name fits its budget (never cut a phrase in half)
    for (let i = 0; i < 12; i++) {
      const [nm, max, look] = build(w, q, pick(BASE[w.type] || BASE.sword));
      if (nm.length <= max) return { nm, look };
      last = { nm: fit(nm, 40), look };
    }
    return last;
  }

  // Name once, lock the property, rebuild only if the rarity changes afterwards.
  function christen(w) {
    if (!w || typeof w !== 'object' || w.kind === 'armor' || !w.type || w.__named) return w;
    if (/^QA /.test(String(w.name || ''))) return w; // self-test weapons keep their tags
    let cur = nameFor(w),
      rar = w.rar;
    const refresh = () => {
      if (w.rar !== rar) {
        rar = w.rar;
        cur = nameFor(w);
      }
      return cur;
    };
    Object.defineProperty(w, '__named', { value: true, enumerable: false });
    Object.defineProperty(w, 'name', {
      enumerable: true,
      configurable: true,
      get: () => refresh().nm,
      set() {} // later "// suffix" appends from older systems are ignored
    });
    // which words the name used (drives the weapon's look); not enumerable, so saves skip it
    Object.defineProperty(w, '__look', { enumerable: false, configurable: true, get: () => refresh().look });
    return w;
  }
  const wrap = fn =>
    function (...args) {
      return christen(fn.apply(this, args));
    };
  makeW = wrap(makeW);
  makeExactRankWeapon = wrap(makeExactRankWeapon);
  makeDeathOfferWeapon = wrap(makeDeathOfferWeapon);
  makeFunnyIntroWeapon = wrap(makeFunnyIntroWeapon);
  makeEarlyWeapon = wrap(makeEarlyWeapon);
  makeUpgradeW = wrap(makeUpgradeW);
  globalThis.CWM_NAMES = { nameFor, nameAt, christen, BASE };
})();
