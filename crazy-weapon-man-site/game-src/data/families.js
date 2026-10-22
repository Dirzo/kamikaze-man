// Boss families: every overworld level ends with its own boss. A world (region) is one family. The
// head of the family waits in the castle; their siblings run the other levels: smaller, themed to
// their level, and fighting with a few of the head's moves. The fort's sibling is the big one.
// Pure data + pure functions, safe to import from tests. Art: art-src/hd_bosses.py (the head's
// sprite is `boss-<head>.png`, a sibling's `boss-<kind>.png`, drawn smaller from the head's body).
import { NODES, REGIONS, isLevel } from './overworld.js';

// role numbers: hp in refHP(zone) units with a floor of `secs` seconds of the hero's base damage
// (see bosses.js startBoss), body damage in refDmg(zone) units, phases (2 or 3)
export const ROLES = {
  level: { hp: 6, secs: 5, dmg: 0.55, phases: 2, speed: 1 },
  secret: { hp: 8, secs: 6, dmg: 0.7, phases: 2, speed: 1.1 },
  fort: { hp: 9, secs: 9, dmg: 0.9, phases: 3, speed: 1 },
  // halved for Cam (2026-10-22, "about 2x too hard"): health x0.7 and body/move damage x0.65, so
  // the damage a head deals over a whole fight is roughly halved
  castle: { hp: 11, secs: 12, dmg: 1.3, phases: 3, speed: 1.1 },
  // a classic ten-map run (no overworld, no full heal between maps) meets each head at the old
  // story-boss strength
  classic: { hp: 14, secs: 10, dmg: 0.5, phases: 3, speed: 1 }
};
// later levels in a world are tougher: hp and damage grow along the road to the castle (tier 0..1)
export const TIER_HP = 0.45, TIER_DMG = 0.2;
// ...and so are its residents and the swarm: health and damage x (1 + FOE_TIER * tier)
export const FOE_TIER = { hp: 0.5, dmg: 0.35 };
// On the overworld every level starts at full health, so the danger has to come from inside the
// level: each world (z = 0..9) hits a little harder than the zone curve alone, x (1 + RAMP * z).
// Bosses also take longer to wear down each world (their `secs` floor), so a stronger account
// still meets a stronger family.
export const WORLD_RAMP = { foeDmg: 0.12, bossDmg: 0.3, bossSecs: 0.12 };

// Each head's moves hurt differently (Sr.'s anvils and lava were a wall, the Kingpin's coins a
// breeze), so their damage is evened out per head from the campaign playtests.
export const HEAD_DMG = { bossgoose: 0.7, bossacorn: 1.25, bossjr: 0.7, bosskingpin: 2.2, bossshogun: 0.95, bossman: 1.2, bosssr: 0.7, bossgrandma: 1.45, bossceo: 1.4, bossweapon: 1.25 };

// [region, head kind, family name, the head's move pool, its phase surprise]
export const FAMILIES = {
  1: { head: 'bossgoose', name: 'THE GRAVE GEESE', pool: ['graves', 'charge', 'slam', 'toss'], surprise: 'honk', bolt: 'paper' },
  2: { head: 'bossacorn', name: 'THE FROSTFUR PACK', pool: ['arrows', 'fan', 'toss', 'charge'], surprise: 'volley', bolt: 'orange' },
  3: { head: 'bossjr', name: "THE SNAPPER'S DOJO", pool: ['tide', 'shell', 'charge', 'toss'], surprise: 'surf', bolt: 'pink' },
  4: { head: 'bosskingpin', name: 'THE FAT CAT RACKET', pool: ['smoke', 'coins', 'toss', 'fan'], surprise: 'decoys', bolt: 'ice' },
  5: { head: 'bossshogun', name: 'THE PETAL HOUSE', pool: ['iai', 'petals', 'charge', 'fan'], surprise: 'storm', bolt: 'pink' },
  6: { head: 'bossman', name: 'THE MOUNTAIN MONKS', pool: ['stomp', 'avalanche', 'fan', 'slam', 'summon:macaque'], surprise: 'avalanche', bolt: 'gold' },
  7: { head: 'bosssr', name: 'THE FORGE BEARS', pool: ['anvils', 'molten', 'strikes', 'charge', 'toss'], surprise: 'overheat', bolt: 'sky' },
  8: { head: 'bossgrandma', name: 'THE STORYBOOK FAMILIARS', pool: ['lob', 'sparkles', 'cookies', 'summon:dustbunny'], surprise: 'helpings', bolt: 'orange' },
  9: { head: 'bossceo', name: 'THE SHADOW CLAN', pool: ['stars', 'vanish', 'coins', 'charge', 'summon:gecko'], surprise: 'clones', bolt: 'violet' },
  10: { head: 'bossweapon', name: 'THE DRAGON HOARD', pool: ['swordrain', 'graves', 'stars', 'strikes', 'charge'], surprise: 'arsenal', bolt: 'violet' }
};

// Four of the family heads. The other six (the Grand Snapper, the Yak Abbot, the Bear Smith, the Owl
// Archmage, the Komodo Lord and the Dragon) live in bosses.js. Every head and sibling is drawn as
// a bigger, crowned or hatted version of one of its zone's beasts (art-src/beast_bosses.py).
export const NEW_HEADS = {
  bossgoose: {
    name: 'MOTHER GOOSE OF THE GRAVES', patterns: ['graves', 'charge', 'slam', 'toss', 'honk'], surprise: 'honk',
    warn: 'A HONK ECHOES FROM THE GRAVES...', intro: ['HONK. (FINAL FORM)', 'YOU BEAT MY GOSLINGS. ALL OF THEM.'],
    phase: ['HONK! HONK! HONK!', 'CHILDREN! MOTHER IS ANGRY'], defeat: 'honk... (respectfully)', bolt: 'paper', speed: 40
  },
  bossacorn: {
    name: 'THE YETI KING', patterns: ['arrows', 'fan', 'charge', 'toss', 'volley'], surprise: 'volley',
    warn: 'THE SNOW STOPS FALLING...', intro: ['I NEVER MISS. TWICE.', 'MY PACK SPEAKS OF YOU. RUDELY.'],
    phase: ['LOOSE EVERYTHING!', 'THE MOUNTAIN IS MINE'], defeat: 'I MISSED... TWICE...', bolt: 'orange', speed: 38
  },
  bosskingpin: {
    name: 'THE FAT CAT', patterns: ['smoke', 'coins', 'fan', 'toss', 'decoys'], surprise: 'decoys',
    warn: 'YOUR POCKETS FEEL LIGHTER...', intro: ['EVERY DAGGER HERE IS STOLEN. EVEN ME.', 'NICE WEAPON. MINE NOW.'],
    phase: ['BOYS! THE GOOD DAGGERS!', 'NOBODY ROBS THE ROBBERS'], defeat: 'KEEP THE CHANGE...', bolt: 'ice', speed: 46
  },
  bossshogun: {
    name: 'THE TOSA SHOGUN', patterns: ['iai', 'petals', 'charge', 'fan', 'storm'], surprise: 'storm',
    warn: 'THE PETALS STOP FALLING...', intro: ['KNEEL. OR BE PRUNED.', 'YOU DISHONOURED MY HOUSE. ALL SIX ROOMS.'],
    phase: ['THE BLOSSOMS TURN RED', 'NO MORE COURTESY'], defeat: 'THE PETALS... FALL...', bolt: 'pink', speed: 34
  }
};

// Siblings: [level id, name, intro line, defeat line, moves, art look]. The look is read by
// art-src/hd_bosses.py (hat, colour swaps) and lives there; the name here is what the HUD shows.
const SIBLINGS = [
  // 1 the grave geese
  ['1-1', 'GOSLING GREG', 'I FOUND A SWORD! IT IS MINE NOW', 'MOM! HE TOOK MY SWORD', ['charge', 'toss']],
  ['1-2', 'SIR HONKSALOT', 'HALT! THIS BLADE IS KNIGHTED', 'A KNIGHT... DISARMED...', ['charge', 'graves']],
  ['1-3', 'BANDIT BEAKS', 'DROP THE SWORD. NICE AND SLOW.', 'TAKE IT! TAKE ALL THE SWORDS!', ['toss', 'charge', 'slam']],
  ['1-4', 'AUNTIE MUDWING', 'I POLISH EVERY GRAVE SWORD BY HAND', 'MY CLEAN SWORDS...', ['graves', 'toss', 'slam']],
  ['1-S', 'THE GOLDEN GOSLING', 'THE GOLDEN SWORD CHOSE ME', 'shiny... honk...', ['graves', 'honk']],
  ['1-F', 'UNCLE SHOVELBILL', 'I BURY SWORDS. AND THEIR OWNERS.', 'GO ON, THEN. MOTHER IS WAITING', ['graves', 'slam', 'charge', 'toss']],
  // 2 the acorn clan
  ['2-1', 'PIP THE FUZZLET', 'MY FIRST BOW! WATCH THIS!', 'THE STRING SNAPPED...', ['fan', 'toss']],
  ['2-2', 'SNIPER MOSSWICK', 'HOLD STILL. THANK YOU.', 'YOU MOVED. RUDE.', ['arrows', 'fan']],
  ['2-S', 'PRINCESS PUFFBALL', 'MY BOW IS CARVED FROM THE ROYAL MUSHROOM', 'DADDY WILL HEAR OF THIS', ['arrows', 'volley']],
  ['2-3', 'BULLSEYE BURRS', 'EVERYTHING IS A TARGET', 'MISSED... BY A MILE', ['fan', 'arrows', 'charge']],
  ['2-4', 'OLD MAN QUILLBACK', 'BACK IN MY DAY WE SHOT ROCKS', 'MY OLD BOW... RETIRES...', ['toss', 'arrows', 'fan']],
  ['2-5', 'TWO-BOW TUFTY', 'TWO BOWS. NINETY-NINE ARROWS.', 'NINETY-EIGHT... LEFT...', ['arrows', 'charge', 'fan']],
  ['2-F', 'CAPTAIN FROSTPAW', 'ARCHERS! ...IT IS JUST ME AND THE SNOW', 'THE YETI KING WILL AVENGE ME', ['arrows', 'fan', 'charge', 'toss']],
  // 3 jr.'s surf crew
  ['3-1', 'BABY BRO BUBBLES', 'MY NUNCHUCKS ARE FOAM. STILL!', 'WAAAH! SENSEI!', ['toss', 'shell']],
  ['3-2', 'SENSEI SIS SANDY', 'BOW TO THE DOJO. THEN TO MY CHUCKS.', 'GOOD FORM. ANNOYING, BUT GOOD', ['charge', 'tide']],
  ['3-3', 'COUSIN KELPY', 'SEAWEED NUNCHUCKS. VERY SLAPPY.', 'TOO... SLIPPERY...', ['shell', 'tide']],
  ['3-4', 'RIPTIDE RICKY', 'I SPIN MY CHUCKS LIKE A WAVE', 'WIPEOUT, DUDE', ['charge', 'tide', 'toss']],
  ['3-S', 'THE LILY PRINCE', 'MY LILY PAD IS A WEAPON. TRUST ME.', 'MY LILY PAD...', ['shell', 'surf']],
  ['3-5', 'SPUD THE SPARRING PARTNER', 'I GET HIT FOR A LIVING', 'SAME TIME TOMORROW?', ['charge', 'shell', 'toss']],
  ['3-F', 'BIG SIS CORAL', 'NOBODY PICKS ON MY LITTLE BROTHER', 'FINE. GO BOTHER THE SNAPPER.', ['tide', 'shell', 'charge', 'toss']],
  // 4 the raccoon racket
  ['4-1', 'LOOKOUT LENNY', 'I SAW NOTHING. I SEE YOUR DAGGER.', 'I SAW... STARS', ['smoke', 'toss']],
  ['4-2', 'PICKPOCKET PATTY', 'NICE DAGGER. WAS NICE.', 'KEEP IT, KEEP IT!', ['smoke', 'coins']],
  ['4-3', 'ROOFTOP RODNEY', 'DAGGERS FROM THE ROOFTOPS!', 'THE GUTTER... IS COMFY', ['toss', 'fan', 'smoke']],
  ['4-S', 'THE BASEMENT BARON', 'EVERY BLADE HERE IS STOLEN. EVEN MINE.', 'THE BLACK MARKET... CLOSES...', ['coins', 'decoys']],
  ['4-4', 'TWIN-DAGGER HAROLD', 'TWO DAGGERS. ONE OF YOU.', 'BOTH... BLUNTED...', ['coins', 'fan', 'toss']],
  ['4-F', 'COUSIN PAWNSWORTH', 'TWO SHARDS FOR THAT SWORD. FINAL OFFER.', 'THE FAT CAT WILL NOT LIKE THIS', ['smoke', 'coins', 'fan', 'toss']],
  // 5 the petal house
  ['5-1', 'PETAL PAGE HANAKO', 'MY FIRST KATANA. STILL SHARP.', 'I MUST PRACTICE MORE', ['petals', 'charge']],
  ['5-2', 'LANTERN KEEPER TORO', 'MY BLADE CUTS THE LANTERN LIGHT', 'THE LIGHTS GO OUT...', ['fan', 'iai']],
  ['5-3', 'BAMBOO BROTHER TAKE', 'I CUT BAMBOO FOR A LIVING. NOW YOU.', 'SNAPPED LIKE A SHOOT', ['iai', 'charge']],
  ['5-4', 'KOI SISTER NISHIKI', 'MY KATANA IS FASTER THAN THE KOI', 'BLUB...', ['petals', 'fan', 'iai']],
  ['5-S', 'THE MOON PRINCE', 'MY BLADE WAS FORGED FROM MOONLIGHT', 'THE MOON... SETS...', ['iai', 'storm']],
  ['5-5', 'THOUSAND-CUT KENTA', 'NINE HUNDRED NINETY-NINE TO GO', 'ONE THOUSAND... AND ONE', ['iai', 'charge', 'fan']],
  ['5-F', 'GENERAL ORIGAMI', 'PAPER WALLS. STEEL BLADE.', 'FOLDED...', ['petals', 'iai', 'charge', 'fan']],
  // 6 the ogre brotherhood
  ['6-1', 'BROTHER PEBBLE', 'MY STAFF IS SMALL. STILL HURTS.', 'OOF. TINY OOF.', ['stomp', 'fan']],
  ['6-2', 'BROTHER WHEELY', 'SPIN THE STAFF! SPIN IT!', 'DIZZY...', ['fan', 'avalanche']],
  ['6-3', 'BROTHER HORNHAND', 'ONE STAFF. TWO HORNS. NO MERCY.', 'MY STAFF... BENT...', ['stomp', 'slam', 'summon:macaque']],
  ['6-4', 'SISTER SNOWDRIFT', 'MY STAFF CALLS THE AVALANCHE', 'THE SNOW... SETTLES...', ['avalanche', 'stomp']],
  ['6-S', 'THE GOLDEN HERMIT', 'I TEMPER MY STAFF IN THE SPRING', 'TOO RELAXED TO LOSE...', ['avalanche', 'slam']],
  ['6-5', 'BROTHER GONG', 'BONG.', 'bong...', ['stomp', 'fan', 'slam']],
  ['6-F', 'CLOUD MASTER ROLLO', 'THE YAK ABBOT IS MEDITATING. MY STAFF SAYS LEAVE.', 'GO. WAKE HIM. I DARE YOU.', ['avalanche', 'stomp', 'fan', 'summon:macaque']],
  // 7 the forge bears
  ['7-1', 'CUB SPARKY', 'MY HAMMER THROWS SPARKS', 'FIZZLED OUT', ['strikes', 'charge']],
  ['7-2', 'ANDY ANVILPAW', 'HEADS UP! ANVILS!', 'HEADS... DOWN...', ['anvils', 'charge']],
  ['7-3', 'BELLOWS THE BOAR', 'I BLOW THE FORGE HOT. TOO HOT.', 'PFFFFFFT', ['slam', 'molten']],
  ['7-S', 'GRANDPA BADGER', 'I HAMMERED THE FIRST HAMMER', 'KIDS THESE DAYS...', ['anvils', 'strikes']],
  ['7-4', 'SLAGGY THE BOAR', 'WHEEE! SLAG SLIDE!', 'I AM STUCK IN THE SLAG', ['molten', 'charge', 'toss']],
  ['7-5', 'QUENCHY THE WOLVERINE', 'TIME TO QUENCH YOUR BLADE', 'SSSSSS...', ['strikes', 'molten', 'toss']],
  ['7-F', 'UNCLE BOLTS', 'THE BEAR SMITH STILL OWES ME AN ANVIL', 'TELL THE BEAR SMITH I SAID HI', ['anvils', 'molten', 'strikes', 'charge']],
  // 8 the storybook familiars
  ['8-1', 'DOILY THE DUST BUNNY', 'MY WAND IS MADE OF LACE. AND LIGHTNING.', 'MY DOILIES...', ['lob', 'cookies']],
  ['8-2', 'AUNTIE SNICKERDOODLE', 'MY WAND CASTS COOKIES. HARD ONES.', 'CRUMBS...', ['cookies', 'lob']],
  ['8-S', 'NANA PURLS', 'KNIT ONE, HEX YOU', 'I DROPPED A STITCH', ['sparkles', 'summon:dustbunny']],
  ['8-3', 'GREAT-AUNT CASSIE', 'MY WAND HAS SEVEN CURSES. PICK ONE.', 'THE CURSE... BACKFIRED...', ['lob', 'sparkles', 'cookies']],
  ['8-4', 'GRANDPA TICKTOCK', 'MY WAND STOPS CLOCKS. AND HEROES.', 'DONG... DONG...', ['sparkles', 'lob']],
  ['8-5', 'AUNTIE ROCKSALOT', 'MY WAND HAS A ROCK ON IT. ROCK ON.', 'MY EARS...', ['cookies', 'sparkles', 'summon:dustbunny']],
  ['8-F', 'LADY EARL GREY', 'PINKIES OUT. WANDS OUT.', 'TEA... TIME... OVER', ['sparkles', 'cookies', 'lob', 'summon:dustbunny']],
  // 9 the shadow board
  ['9-1', 'GENIN KOJI', 'MY FIRST SHURIKEN! ...WHERE DID IT GO', 'I NEED MORE STARS', ['stars', 'charge']],
  ['9-2', 'SHADOW SIS SHOJI', 'YOU CANNOT SEE MY STARS. MOSTLY.', 'SEEN...', ['vanish', 'stars']],
  ['9-3', 'ROOFTOP RYU', 'STARS FROM EVERY ROOFTOP', 'TOO MANY ROOFS', ['stars', 'vanish', 'charge']],
  ['9-S', 'THE SCROLL KEEPER', 'THIS SCROLL TEACHES THE HIDDEN STAR', 'THE SCROLL WAS WRONG', ['vanish', 'clones']],
  ['9-4', 'STARRY SUZU', 'A HUNDRED STARS. ALL FOR YOU.', 'OUT OF... STARS...', ['stars', 'coins']],
  ['9-5', 'JONIN KAGE', 'MY SHADOW THROWS STARS TOO', 'THE SHADOWS... FADE...', ['coins', 'stars', 'summon:gecko']],
  ['9-F', 'MASTER SHURI', 'THE KOMODO LORD TOOK THIS CASTLE. I HOLD IT.', 'THE WALLS... FALL...', ['stars', 'vanish', 'coins', 'summon:gecko']],
  // 10 the dragon hoard
  ['10-1', "LIL' SCORCH", 'I JUST HATCHED ON THE HOARD', 'BACK IN THE EGG...', ['strikes', 'charge']],
  ['10-2', 'EMBERBLADE', 'MY KATANA WAS FORGED IN DRAGONFIRE', 'THE EMBERS... DIM...', ['swordrain', 'charge']],
  ['10-3', 'MAGPIE MAGGIE', 'OOH, SHINY. I WILL TAKE THAT.', 'MY SHINIES...', ['graves', 'strikes']],
  ['10-4', 'DILLON THE DUELIST', 'EN GARDE! BOTH BLADES!', 'ROLLED... OVER...', ['charge', 'stars', 'graves']],
  ['10-S', 'THE CRYSTAL WYRM', 'I GREW MY OWN WAND FROM A GEM', 'SHATTERED...', ['swordrain', 'stars']],
  ['10-5', 'WYRMLING WEN', 'STAFF, FLAME AND FURY', 'THE FLAME... GOES OUT...', ['swordrain', 'strikes', 'stars']],
  ['10-F', 'PLATED PETRA', 'EVERY COIN IN THIS VAULT, I MINTED', 'THE DRAGON... AWAITS...', ['swordrain', 'graves', 'strikes', 'charge']]
];

// the level's place on its world's road, 0 (first level) .. 1 (the castle), by authoring order
const order = {};
for (const R of REGIONS) {
  const ids = Object.values(NODES).filter(n => n.region === R.id && isLevel(n)).map(n => n.id);
  ids.forEach((id, i) => (order[id] = ids.length > 1 ? i / (ids.length - 1) : 1));
}
export const levelTier = id => order[id] ?? 0;

// what each family fights with, for the siblings' phase-change shout
const ARMS = { 1: 'SWORD', 2: 'BOW', 3: 'NUNCHUCKS', 4: 'DAGGER', 5: 'KATANA', 6: 'STAFF', 7: 'HAMMER', 8: 'WAND', 9: 'SHURIKEN', 10: 'EVERY BLADE' };
export const SIBLING_KINDS = SIBLINGS.map(([id]) => 'sib' + id.toLowerCase().replace('-', ''));
export const BOSS_OF = {}; // level id -> boss kind
export const SIBLING_DEFS = {}; // sibling kind -> its bosses.js definition
for (const [id, name, intro, defeat, moves] of SIBLINGS) {
  const n = NODES[id], F = FAMILIES[n.region], kind = 'sib' + id.toLowerCase().replace('-', '');
  const role = n.kind === 'fort' ? 'fort' : n.kind === 'secret' ? 'secret' : 'level';
  BOSS_OF[id] = kind;
  SIBLING_DEFS[kind] = {
    name, role, family: n.region, level: id, patterns: moves,
    // forts and secret rooms pull the family's own trick at each phase change; a plain level's
    // sibling repeats its signature move
    surprise: role === 'level' ? moves[0] : F.surprise,
    warn: `${name} IS COMING...`, intro: [intro], phase: [name === 'BROTHER GONG' ? 'BONG!' : `${ARMS[n.region]}, FULL POWER!`, `${F.name} NEVER DROP THEIR WEAPONS!`],
    defeat, bolt: F.bolt, speed: 44
  };
}
for (const n of Object.values(NODES)) if (n.kind === 'castle') BOSS_OF[n.id] = FAMILIES[n.region].head;
export const HEAD_KINDS = Object.values(FAMILIES).map(F => F.head);
export const familyOfHead = kind => +Object.keys(FAMILIES).find(r => FAMILIES[r].head === kind) || 0;
export const headOfZone = z => FAMILIES[z + 1].head;
