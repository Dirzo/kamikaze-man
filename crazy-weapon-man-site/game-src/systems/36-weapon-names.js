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
  const elementWord = w => {
    const e = w.element || null;
    const n = e && (e.name || e.n || e.label);
    return typeof n === 'string' && n.length <= 10 ? n.toLowerCase().replace(/(^|[\s-])([a-z])/g, (x, p, c) => p + c.toUpperCase()) : null;
  };
  const relicName = () => pick(SYL_A) + pick(SYL_B);

  function build(w, q, base) {
    if (q <= 1) return [`${pick(COND)} ${base}`, 22];
    if (q <= 3) return [`${pick(ADJ)} ${base} of ${pick(OF)}`, 30];
    if (q <= 5) {
      const pre = elementWord(w) || pick(GRAND);
      return [Math.random() < 0.5 ? `${pre} ${pick(ADJ)} ${base} of ${pick(OF_GRAND)}` : `${pre} ${base} of ${pick(OF_GRAND)}`, 36];
    }
    if (q <= 7) return [`${relicName()}, ${pick(EPITHET)}`, 38];
    if (q <= 9) return [`${relicName()} ${pick(ROMAN)}, ${pick(EPITHET)}`, 40];
    const b0 = (BASE[w.type] || BASE.sword)[0].toUpperCase();
    return [`${pick(WHAT)} (${b0.endsWith("S") ? "SOME" : "A"} ${b0})`, 40];
  }
  function nameFor(w) {
    const q = Math.max(0, Math.min(10, Number(rarityRank(w)) || 0));
    let last = '';
    // re-roll until a whole name fits its budget (never cut a phrase in half)
    for (let i = 0; i < 12; i++) {
      const [nm, max] = build(w, q, pick(BASE[w.type] || BASE.sword));
      if (nm.length <= max) return nm;
      last = nm;
    }
    return fit(last, 40);
  }

  // Name once, lock the property, rebuild only if the rarity changes afterwards.
  function christen(w) {
    if (!w || typeof w !== 'object' || w.kind === 'armor' || !w.type || w.__named) return w;
    if (/^QA /.test(String(w.name || ''))) return w; // self-test weapons keep their tags
    let nm = nameFor(w),
      rar = w.rar;
    Object.defineProperty(w, '__named', { value: true, enumerable: false });
    Object.defineProperty(w, 'name', {
      enumerable: true,
      configurable: true,
      get() {
        if (w.rar !== rar) {
          rar = w.rar;
          nm = nameFor(w);
        }
        return nm;
      },
      set() {} // later "// suffix" appends from older systems are ignored
    });
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
  globalThis.CWM_NAMES = { nameFor, christen };
})();
