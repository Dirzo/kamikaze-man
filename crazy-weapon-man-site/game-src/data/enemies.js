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
  // The fuzzball family (zone 2, the bow): beastkin archers that grow up along the world's road,
  // from Fuzzlets on its first level to Moonfang werewolves at the castle. kind 'beast' hands the
  // AI to game/beastkin.js, which reads beh; evo is the family rank (data/progression.js
  // familyPool lets ranks in as the levels go on). Their sprites have named frames (art-src/beastkin.py).
  fuzzlet: { name: 'Fuzzlet', kind: 'beast', beh: 'hop', fam: 'fuzz', evo: 1, hp: 0.55, dmg: 0.6, speed: 44, range: 120, wind: 0.4 },
  burrball: { name: 'Burr Ball', kind: 'beast', beh: 'roll', fam: 'fuzz', evo: 2, hp: 0.9, dmg: 0.9, speed: 32, range: 150, wind: 0.55 },
  puffshot: { name: 'Puff Archer', kind: 'beast', beh: 'lob', fam: 'fuzz', evo: 3, hp: 0.75, dmg: 0.8, speed: 30, range: 170, wind: 0.6 },
  twintuft: { name: 'Twin Tuft', kind: 'beast', beh: 'twin', fam: 'fuzz', evo: 4, hp: 1.05, dmg: 0.75, speed: 34, range: 130, wind: 0.55 },
  quillback: { name: 'Quillback', kind: 'beast', beh: 'fan', fam: 'fuzz', evo: 5, hp: 1.15, dmg: 0.8, speed: 30, range: 130, wind: 0.6 },
  moss: { name: 'Moss Stalker', kind: 'beast', beh: 'snipe', fam: 'fuzz', evo: 6, hp: 0.85, dmg: 1.35, speed: 26, range: 280, wind: 1.05 },
  wolfpup: { name: 'Wolf Pup', kind: 'beast', beh: 'kite', fam: 'fuzz', evo: 7, hp: 0.95, dmg: 1.0, speed: 72, range: 26, wind: 0.32 },
  yeticub: { name: 'Frost Cub', kind: 'beast', beh: 'frost', fam: 'fuzz', evo: 8, hp: 1.3, dmg: 0.9, speed: 30, range: 140, wind: 0.6 },
  yeti: { name: 'Greatbow Yeti', kind: 'beast', beh: 'greatbow', fam: 'fuzz', evo: 9, heavy: true, hp: 2.6, dmg: 1.5, speed: 20, range: 220, wind: 0.95 },
  werewolf: { name: 'Moonfang', kind: 'beast', beh: 'alpha', fam: 'fuzz', evo: 10, hp: 2.2, dmg: 1.3, speed: 48, range: 30, wind: 0.42 },
  // The goose family (zone 1, the sword): from Goslings with practice swords on 1-1 up to the War
  // Gander at the castle. block: a shield stops hits from the front (as kind 'shield' does).
  gosling: { name: 'Gosling', kind: 'beast', beh: 'poke', fam: 'goose', evo: 1, hp: 0.5, dmg: 0.55, speed: 46, range: 20, wind: 0.42 },
  honker: { name: 'Honker', kind: 'beast', beh: 'honk', fam: 'goose', evo: 2, hp: 0.85, dmg: 0.9, speed: 50, range: 24, wind: 0.4 },
  gsquire: { name: 'Gander Squire', kind: 'beast', beh: 'shield', fam: 'goose', evo: 3, block: true, hp: 1.15, dmg: 0.95, speed: 32, range: 24, wind: 0.5 },
  fencer: { name: 'Goose Fencer', kind: 'beast', beh: 'lunge', fam: 'goose', evo: 4, hp: 0.9, dmg: 1.15, speed: 38, range: 84, wind: 0.6 },
  gtoss: { name: 'Blade Tosser', kind: 'beast', beh: 'toss', fam: 'goose', evo: 5, hp: 0.95, dmg: 0.9, speed: 40, range: 150, wind: 0.5 },
  whirl: { name: 'Whirlwind Goose', kind: 'beast', beh: 'whirl', fam: 'goose', evo: 6, hp: 1.0, dmg: 0.85, speed: 34, range: 100, wind: 0.55 },
  ggrave: { name: 'Grave Goose', bloodless: true, float: true, kind: 'beast', beh: 'phase', fam: 'goose', evo: 7, hp: 0.9, dmg: 1.0, speed: 30, range: 26, wind: 0.45 },
  berserker: { name: 'Goose Berserker', kind: 'beast', beh: 'flurry', fam: 'goose', evo: 8, hp: 1.3, dmg: 0.8, speed: 52, range: 26, wind: 0.38 },
  swan: { name: 'Black Swan Duelist', kind: 'beast', beh: 'parry', fam: 'goose', evo: 9, hp: 1.6, dmg: 1.25, speed: 36, range: 32, wind: 0.45 },
  gander: { name: 'War Gander', kind: 'beast', beh: 'warlord', fam: 'goose', evo: 10, heavy: true, hp: 3.0, dmg: 1.55, speed: 26, range: 34, wind: 0.55 },
  // The turtle and frog family (zone 3, the nunchucks): a beach dojo whose students wear their rank
  // on their belts, from the Tadpole Tots on 3-1 to the Grand Snapper at the castle.
  tadpole: { name: 'Tadpole Tot', kind: 'beast', beh: 'flop', fam: 'lagoon', evo: 1, hp: 0.5, dmg: 0.55, speed: 40, range: 18, wind: 0.36 },
  pondfrog: { name: 'Pond Frog', kind: 'beast', beh: 'tongue', fam: 'lagoon', evo: 2, hp: 0.85, dmg: 0.9, speed: 40, range: 24, wind: 0.4 },
  snapper: { name: 'Snapper Shell', kind: 'beast', beh: 'shell', fam: 'lagoon', evo: 3, hp: 1.15, dmg: 1.0, speed: 28, range: 24, wind: 0.5 },
  spinturtle: { name: 'Spin Turtle', kind: 'beast', beh: 'shellspin', fam: 'lagoon', evo: 4, hp: 1.0, dmg: 0.9, speed: 34, range: 110, wind: 0.5 },
  toadmonk: { name: 'Toad Monk', kind: 'beast', beh: 'chain', fam: 'lagoon', evo: 5, hp: 1.2, dmg: 0.75, speed: 36, range: 26, wind: 0.45 },
  lilylurker: { name: 'Lily Lurker', kind: 'beast', beh: 'lurk', fam: 'lagoon', evo: 6, hp: 0.95, dmg: 1.15, speed: 42, range: 26, wind: 0.4 },
  bubblenewt: { name: 'Bubble Newt', kind: 'beast', beh: 'bubble', fam: 'lagoon', evo: 7, hp: 0.9, dmg: 0.9, speed: 34, range: 160, wind: 0.6 },
  shellback: { name: 'Shellback Brawler', kind: 'beast', beh: 'brawler', fam: 'lagoon', evo: 8, hp: 1.7, dmg: 1.2, speed: 30, range: 30, wind: 0.5 },
  bullfrog: { name: 'Bullfrog Bouncer', kind: 'beast', beh: 'bounce', fam: 'lagoon', evo: 9, heavy: true, hp: 2.5, dmg: 1.35, speed: 24, range: 200, wind: 0.6 },
  grandsnapper: { name: 'Grand Snapper', kind: 'beast', beh: 'master', fam: 'lagoon', evo: 10, heavy: true, hp: 3.0, dmg: 1.5, speed: 24, range: 36, wind: 0.5 },
  // The cat and raccoon family (zone 4, the dagger): the bazaar's alley cats and masked raccoons,
  // from Alley Kittens on 4-1 up to the Fat Cat Fence who runs the market.
  alleykit: { name: 'Alley Kitten', kind: 'beast', beh: 'skitter', fam: 'bazaar', evo: 1, hp: 0.5, dmg: 0.6, speed: 52, range: 20, wind: 0.34 },
  pickpocket: { name: 'Pickpocket Kit', kind: 'beast', beh: 'steal', fam: 'bazaar', evo: 2, hp: 0.75, dmg: 0.6, speed: 58, range: 22, wind: 0.36 },
  cutpurse: { name: 'Tabby Cutpurse', kind: 'beast', beh: 'dashthru', fam: 'bazaar', evo: 3, hp: 0.9, dmg: 1.0, speed: 40, range: 110, wind: 0.55 },
  lanterncat: { name: 'Lantern Cat', kind: 'beast', beh: 'dark', fam: 'bazaar', evo: 4, hp: 0.85, dmg: 1.15, speed: 40, range: 90, wind: 0.32 },
  juggler: { name: 'Knife Juggler', kind: 'beast', beh: 'juggle', fam: 'bazaar', evo: 5, hp: 0.9, dmg: 0.9, speed: 34, range: 170, wind: 0.6 },
  shadowtom: { name: 'Shadow Tom', kind: 'beast', beh: 'blink', fam: 'bazaar', evo: 6, hp: 1.1, dmg: 1.1, speed: 40, range: 24, wind: 0.4 },
  siamese: { name: 'Twin Fang Siamese', kind: 'beast', beh: 'twinfang', fam: 'bazaar', evo: 7, hp: 1.1, dmg: 0.75, speed: 54, range: 24, wind: 0.38 },
  prowler: { name: 'Rooftop Prowler', kind: 'beast', beh: 'pounce', fam: 'bazaar', evo: 8, hp: 1.2, dmg: 1.1, speed: 46, range: 24, wind: 0.4 },
  bandit: { name: 'Masked Bandit', kind: 'beast', beh: 'smoke', fam: 'bazaar', evo: 9, hp: 1.4, dmg: 1.0, speed: 40, range: 26, wind: 0.42 },
  fatcat: { name: 'Fat Cat Fence', kind: 'beast', beh: 'fence', fam: 'bazaar', evo: 10, heavy: true, hp: 2.8, dmg: 1.3, speed: 22, range: 170, wind: 0.6 },
  // The dog and fox family (zone 5, the katana): samurai dogs and the fox spirits of the shrine,
  // from Shiba Pups on 5-1 up to the Nine Tail Sage.
  shibapup: { name: 'Shiba Pup', kind: 'beast', beh: 'clumsy', fam: 'shrine', evo: 1, hp: 0.6, dmg: 0.7, speed: 44, range: 22, wind: 0.42 },
  corgi: { name: 'Corgi Ashigaru', kind: 'beast', beh: 'sweep', fam: 'shrine', evo: 2, hp: 0.8, dmg: 0.8, speed: 40, range: 28, wind: 0.5 },
  akita: { name: 'Akita Ronin', kind: 'beast', beh: 'iaido', fam: 'shrine', evo: 3, hp: 1.0, dmg: 1.1, speed: 30, range: 140, wind: 0.9 },
  petalfox: { name: 'Petal Kitsune', kind: 'beast', beh: 'decoy', fam: 'shrine', evo: 4, hp: 0.9, dmg: 0.9, speed: 50, range: 24, wind: 0.38 },
  husky: { name: 'Husky Sentry', kind: 'beast', beh: 'sentry', fam: 'shrine', evo: 5, hp: 1.4, dmg: 1.0, speed: 28, range: 28, wind: 0.45 },
  twininu: { name: 'Twin Blade Inu', kind: 'beast', beh: 'twinspin', fam: 'shrine', evo: 6, hp: 1.3, dmg: 0.9, speed: 40, range: 70, wind: 0.55 },
  windfox: { name: 'Wind Fox', kind: 'beast', beh: 'crescent', fam: 'shrine', evo: 7, hp: 1.1, dmg: 1.0, speed: 38, range: 170, wind: 0.5 },
  houndguard: { name: 'Hound Guard', kind: 'beast', beh: 'kunai', fam: 'shrine', evo: 8, hp: 1.3, dmg: 1.0, speed: 36, range: 170, wind: 0.5 },
  tosa: { name: 'Tosa Champion', kind: 'beast', beh: 'champion', fam: 'shrine', evo: 9, heavy: true, hp: 2.8, dmg: 1.4, speed: 22, range: 34, wind: 0.6 },
  ninetail: { name: 'Nine Tail Sage', kind: 'beast', beh: 'sage', fam: 'shrine', evo: 10, heavy: true, hp: 2.6, dmg: 1.4, speed: 34, range: 30, wind: 0.45 },
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
  kitsune: 'rise', monk: 'squash', anvil: 'squash', ninja: 'spin',
  fuzzlet: 'squash', burrball: 'spin', puffshot: 'flip', twintuft: 'flip', quillback: 'flip', moss: 'topple',
  wolfpup: 'spin', yeticub: 'flip', yeti: 'topple', werewolf: 'topple',
  gosling: 'squash', honker: 'spin', gsquire: 'topple', fencer: 'topple', gtoss: 'spin', whirl: 'spin', ggrave: 'rise',
  berserker: 'topple', swan: 'topple', gander: 'topple',
  tadpole: 'squash', pondfrog: 'flip', snapper: 'flip', spinturtle: 'spin', toadmonk: 'flip', lilylurker: 'flip',
  bubblenewt: 'spin', shellback: 'topple', bullfrog: 'flip', grandsnapper: 'topple',
  alleykit: 'squash', pickpocket: 'spin', cutpurse: 'topple', lanterncat: 'rise', juggler: 'spin', shadowtom: 'rise',
  siamese: 'topple', prowler: 'flip', bandit: 'spin', fatcat: 'topple',
  shibapup: 'squash', corgi: 'flip', akita: 'topple', petalfox: 'rise', husky: 'topple', twininu: 'spin',
  windfox: 'rise', houndguard: 'topple', tosa: 'topple', ninetail: 'rise'
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
