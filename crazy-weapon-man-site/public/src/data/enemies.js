// Enemy types. Sprites come from /assets/px/enemy-<type>.png (3 frames: walk1, walk2, hit; facing
// right). Speeds in px/s, ranges in px. kind picks the behaviour in enemy.js:
//   melee   walk up, "!" wind-up, lunge with a hitbox (style: slash | leap | cleave | bite)
//   ranged  keep distance, wind-up, fire a bolt
//   bomb    sprint in, flash, explode (hurts everyone nearby)
//   shield  melee, blocks hits from the front (CLANG) unless crit or from behind
//   blink   melee that teleports next to the hero
//   summon  ranged, sometimes calls in crawlers
//   sniper  long wind-up with an aim line, fast bolt
//   roller  winds up, then rolls across the floor
//   mimic   sits still disguised as a weapon drop until you get close
// air: true flies (ignores gravity, hovers above the ground).
// alert: the type's own trick once it has noticed you (game/traits.js): do, every (s), dmg (x its
//   normal hit, default 0.7), range (px, default 140), wind (s). Calm residents never use it.
export const ENEMIES = {
  stalker: { name: 'Graveyard Bandit', kind: 'melee', style: 'slash', hp: 1, dmg: 1, speed: 40, range: 22, wind: 0.45, alert: { do: 'sword', every: 5 } },
  crawler: { name: 'Pocket Gremlin', kind: 'melee', style: 'leap', hp: 0.7, dmg: 0.8, speed: 56, range: 30, wind: 0.32, alert: { do: 'pebble', every: 4.5, dmg: 0.6 } },
  goose: { name: 'War Goose', kind: 'melee', style: 'leap', hp: 0.85, dmg: 0.95, speed: 64, range: 26, wind: 0.34, honks: true, alert: { do: 'honk', every: 5 } },
  bombchicken: { name: 'Bomb Chicken', kind: 'bomb', hp: 0.55, dmg: 1.4, speed: 66, range: 16, wind: 0.55, alert: { do: 'egg', every: 4, dmg: 0.8, range: 160 } },
  brute: { name: 'Axe Ogre', kind: 'melee', style: 'cleave', hp: 1.6, dmg: 1.5, speed: 24, range: 34, wind: 0.75, alert: { do: 'slam', every: 5.5, range: 120 } },
  wraith: { name: 'Casserole Spirit', bloodless: true, kind: 'ranged', hp: 0.8, dmg: 0.95, speed: 36, range: 120, wind: 0.62, bolt: 'orange', float: true, alert: { do: 'casserole', every: 5 } },
  maw: { name: 'Hungry Chest', bloodless: true, kind: 'melee', style: 'bite', hp: 1.2, dmg: 1.25, speed: 33, range: 26, wind: 0.48, alert: { do: 'coins', every: 5, dmg: 0.6 } },
  flyer: { name: 'Toothy Sky Rat', kind: 'ranged', hp: 0.68, dmg: 0.75, speed: 42, range: 110, wind: 0.54, bolt: 'violet', air: true, alert: { do: 'seed', every: 4.5, range: 110 } },
  wizard: { name: 'Grumpy Wizard', kind: 'ranged', hp: 0.88, dmg: 1.08, speed: 29, range: 116, wind: 0.72, bolt: 'red', alert: { do: 'fan', every: 5.5, dmg: 0.6 } },
  taxman: { name: 'Cursed Scribe', kind: 'ranged', hp: 0.95, dmg: 0.92, speed: 34, range: 106, wind: 0.66, bolt: 'pink', alert: { do: 'paper', every: 5 } },
  mimic: { name: 'Suspicious Weapon Drop', bloodless: true, kind: 'mimic', hp: 1.12, dmg: 1.35, speed: 34, range: 24, wind: 0.5, alert: { do: 'fakeout', every: 4.5 } },
  eyeball: { name: 'All-Seeing Orb', kind: 'ranged', hp: 0.76, dmg: 0.82, speed: 39, range: 100, wind: 0.58, bolt: 'pink', air: true, alert: { do: 'tears', every: 5, dmg: 0.6 } },
  shieldbro: { name: 'Shield Knight', kind: 'shield', hp: 1.25, dmg: 1.05, speed: 30, range: 24, wind: 0.6, alert: { do: 'shield', every: 5.5 } },
  blinker: { name: 'Blink Imp', kind: 'blink', hp: 0.75, dmg: 0.9, speed: 38, range: 22, wind: 0.42, alert: { do: 'afterimage', every: 4.5 } },
  summoner: { name: 'Bone-Summoning Necromancer', kind: 'summon', hp: 0.9, dmg: 0.8, speed: 26, range: 110, wind: 0.85, bolt: 'lime', alert: { do: 'bone', every: 5 } },
  sniper: { name: 'Steve, Who Never Misses', kind: 'sniper', hp: 0.8, dmg: 1.3, speed: 22, range: 300, wind: 1.1, bolt: 'red', alert: { do: 'burst', every: 6, dmg: 0.6, range: 300, wind: 0.7 } },
  roller: { name: 'Runaway Barrel Knight', kind: 'roller', hp: 1.0, dmg: 1.1, speed: 30, range: 140, wind: 0.6, alert: { do: 'barrel', every: 5 } },
  // weapon-zone residents: each one carries (a tiny version of) its zone's weapon
  squirrel: { name: 'Acorn Archer', kind: 'ranged', hp: 0.7, dmg: 0.72, speed: 38, range: 112, wind: 0.66, bolt: 'orange', alert: { do: 'acorn', every: 4.5 } },
  turtle: { name: 'Nunchuck Turtle', kind: 'melee', style: 'leap', hp: 1.1, dmg: 1.0, speed: 44, range: 28, wind: 0.4, alert: { do: 'squirt', every: 4.5, dmg: 0.6 } },
  raccoon: { name: 'Bazaar Raccoon', kind: 'melee', style: 'slash', hp: 0.8, dmg: 0.95, speed: 62, range: 22, wind: 0.36, alert: { do: 'peel', every: 5, dmg: 0.5 } },
  samurai: { name: 'Tiny Samurai', kind: 'melee', style: 'cleave', hp: 1.3, dmg: 1.3, speed: 30, range: 32, wind: 0.62, alert: { do: 'crescent', every: 5 } },
  kitsune: { name: 'Kitsune Spirit', bloodless: true, kind: 'blink', hp: 0.8, dmg: 0.95, speed: 40, range: 22, wind: 0.44, alert: { do: 'foxfire', every: 5.5, dmg: 0.55 } },
  monk: { name: 'Pebble Monk', kind: 'shield', hp: 1.25, dmg: 1.05, speed: 32, range: 26, wind: 0.56, alert: { do: 'beads', every: 5, dmg: 0.6 } },
  anvil: { name: 'Anvil Pup', bloodless: true, kind: 'roller', hp: 1.4, dmg: 1.2, speed: 26, range: 140, wind: 0.66, alert: { do: 'sparks', every: 5, dmg: 0.6 } },
  // swarm bosses only (full-size art from art-src/hd_bosses.py)
  mothergoose: { name: 'Mother Goose', kind: 'melee', style: 'leap', hp: 0.85, dmg: 0.95, speed: 40, range: 44, wind: 0.5, honks: true },
  acornking: { name: 'The Acorn Archer King', kind: 'ranged', hp: 0.7, dmg: 0.85, speed: 30, range: 140, wind: 0.6, bolt: 'orange' },
  kingpin: { name: 'The Raccoon Kingpin', kind: 'melee', style: 'slash', hp: 0.8, dmg: 0.95, speed: 46, range: 40, wind: 0.45 },
  shogun: { name: 'The Petal Shogun', kind: 'melee', style: 'cleave', hp: 1.6, dmg: 1.5, speed: 28, range: 44, wind: 0.6 },
  ninja: { name: 'Pocket Ninja', kind: 'ranged', hp: 0.78, dmg: 1.05, speed: 44, range: 118, wind: 0.5, bolt: 'violet', alert: { do: 'stars', every: 4.5, dmg: 0.6 } }
};

// How each resident goes down (game/enemy.js draws it, then the body bursts into shards):
//   topple  tips over onto its back, away from the hit     flip  hops and lands belly-up
//   spin    tumbles end over end                            squash  flattens into a pancake
//   rise    floats up and fades, the way spirits do
export const DEATHS = {
  stalker: 'topple', crawler: 'flip', goose: 'spin', bombchicken: 'squash', brute: 'topple', wraith: 'rise', maw: 'flip',
  flyer: 'spin', wizard: 'topple', taxman: 'topple', mimic: 'flip', eyeball: 'rise', shieldbro: 'topple', blinker: 'rise',
  summoner: 'rise', sniper: 'topple', roller: 'spin', squirrel: 'flip', turtle: 'flip', raccoon: 'spin', samurai: 'topple',
  kitsune: 'rise', monk: 'squash', anvil: 'squash', ninja: 'spin'
};
export const deathOf = type => DEATHS[type] || (ENEMIES[type]?.float || ENEMIES[type]?.air ? 'rise' : 'topple');

export const ELITE_TITLES = ['Grand', 'Royal', 'Elder', 'Mighty', 'Slightly Cursed', 'Ill-Tempered', 'Very Large', 'Knighted', 'Haunted', 'Ancient'];

// speech bubbles
export const LINES = {
  honk: ['HONK', 'HONK!', 'HONK?!', 'HONK HONK', 'HONK.', 'HOOONK'],
  honkRare: ['PEACE WAS NEVER AN OPTION', 'THIS SWORD IS MINE NOW', 'HONK (THREATENING)', 'I BITE KINGS', 'YOUR BREAD. NOW.'],
  wake: ['FIVE MORE MINUTES...', 'WHO RANG THE DOOM BELL?', 'I WAS DREAMING OF SOUP', 'RUDE. VERY RUDE.', 'OH NO. A HERO. GREAT.',
    "I'M UP! I'M UP!", "WAS I SNORING? DON'T ANSWER", 'THE MOON IS STILL UP', 'YOU WOKE THE WRONG GUY',
    'HANG ON, WHERE IS MY AXE', 'IS IT TUESDAY ALREADY?', 'I WAS GUARDING THAT NAP'],
  grumble: ['I HAD A NICE DREAM, TOO', 'THIS IS COMING OUT OF MY NAP', 'HEROES NEVER KNOCK', "I'M TELLING THE LICH",
    'NAPS ARE SACRED', 'COULD YOU NOT', 'I HATE MORNINGS. AND YOU.'],
  last: ['BACK... TO BED...', 'WAKE ME... NEVER', 'TELL MY PILLOW...', 'WORTH IT', 'FIVE... MORE... CENTURIES...'],
  mimic: ['SURPRISE!', 'NOT A SWORD!', 'GOTCHA', 'FREE LOOT? FREE TEETH.']
};
