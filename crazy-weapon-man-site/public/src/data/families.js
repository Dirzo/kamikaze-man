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
  castle: { hp: 15, secs: 18, dmg: 2, phases: 3, speed: 1.1 },
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
  2: { head: 'bossacorn', name: 'THE ACORN CLAN', pool: ['arrows', 'fan', 'toss', 'charge'], surprise: 'volley', bolt: 'orange' },
  3: { head: 'bossjr', name: "JR.'S SURF CREW", pool: ['tide', 'shell', 'charge', 'toss'], surprise: 'surf', bolt: 'pink' },
  4: { head: 'bosskingpin', name: 'THE RACCOON RACKET', pool: ['smoke', 'coins', 'toss', 'fan'], surprise: 'decoys', bolt: 'ice' },
  5: { head: 'bossshogun', name: 'THE PETAL HOUSE', pool: ['iai', 'petals', 'charge', 'fan'], surprise: 'storm', bolt: 'pink' },
  6: { head: 'bossman', name: 'THE OGRE BROTHERHOOD', pool: ['stomp', 'avalanche', 'fan', 'slam', 'summon:monk'], surprise: 'avalanche', bolt: 'gold' },
  7: { head: 'bosssr', name: 'THE CRAZY UNCLES', pool: ['anvils', 'molten', 'strikes', 'charge', 'toss'], surprise: 'overheat', bolt: 'sky' },
  8: { head: 'bossgrandma', name: "GRANDMA'S SISTERS", pool: ['lob', 'sparkles', 'cookies', 'summon:crawler'], surprise: 'helpings', bolt: 'orange' },
  9: { head: 'bossceo', name: 'THE SHADOW BOARD', pool: ['stars', 'vanish', 'coins', 'charge', 'summon:ninja'], surprise: 'clones', bolt: 'violet' },
  10: { head: 'bossweapon', name: 'THE LIVING ARSENAL', pool: ['swordrain', 'graves', 'stars', 'strikes', 'charge'], surprise: 'arsenal', bolt: 'violet' }
};

// The four heads that used to be swarm giants. The other six (Jr., the Ogre King, Sr., Grandma,
// the Usurper Ninja Lord and the Sentient Armory) live in bosses.js already.
export const NEW_HEADS = {
  bossgoose: {
    name: 'MOTHER GOOSE OF THE GRAVES', patterns: ['graves', 'charge', 'slam', 'toss', 'honk'], surprise: 'honk',
    warn: 'A HONK ECHOES FROM THE GRAVES...', intro: ['HONK. (FINAL FORM)', 'YOU BEAT MY GOSLINGS. ALL OF THEM.'],
    phase: ['HONK! HONK! HONK!', 'CHILDREN! MOTHER IS ANGRY'], defeat: 'honk... (respectfully)', bolt: 'paper', speed: 40
  },
  bossacorn: {
    name: 'THE ACORN ARCHER KING', patterns: ['arrows', 'fan', 'charge', 'toss', 'volley'], surprise: 'volley',
    warn: 'THE CANOPY RUSTLES...', intro: ['I NEVER MISS. TWICE.', 'MY CLAN SPEAKS OF YOU. RUDELY.'],
    phase: ['LOOSE EVERYTHING!', 'THE CANOPY IS MINE'], defeat: 'I MISSED... TWICE...', bolt: 'orange', speed: 38
  },
  bosskingpin: {
    name: 'THE RACCOON KINGPIN', patterns: ['smoke', 'coins', 'fan', 'toss', 'decoys'], surprise: 'decoys',
    warn: 'YOUR POCKETS FEEL LIGHTER...', intro: ['EVERYTHING HERE IS STOLEN. EVEN ME.', 'YOU OWE THE FAMILY. BIG.'],
    phase: ['BOYS! THE MERCHANDISE!', 'NOBODY ROBS THE ROBBERS'], defeat: 'KEEP THE CHANGE...', bolt: 'ice', speed: 46
  },
  bossshogun: {
    name: 'THE PETAL SHOGUN', patterns: ['iai', 'petals', 'charge', 'fan', 'storm'], surprise: 'storm',
    warn: 'THE PETALS STOP FALLING...', intro: ['KNEEL. OR BE PRUNED.', 'YOU DISHONOURED MY HOUSE. ALL SIX ROOMS.'],
    phase: ['THE BLOSSOMS TURN RED', 'NO MORE COURTESY'], defeat: 'THE PETALS... FALL...', bolt: 'pink', speed: 34
  }
};

// Siblings: [level id, name, intro line, defeat line, moves, art look]. The look is read by
// art-src/hd_bosses.py (hat, colour swaps) and lives there; the name here is what the HUD shows.
const SIBLINGS = [
  // 1 the grave geese
  ['1-1', 'GOSLING GREG', 'MOM SAYS I AM THE WELCOME COMMITTEE', "I'M TELLING MOM", ['charge', 'toss']],
  ['1-2', 'SIR HONKSALOT', 'HALT! THIS HILL IS HONKED', 'A KNIGHT... BESTED...', ['charge', 'graves']],
  ['1-3', 'BANDIT BEAKS', 'YOUR LOOT OR YOUR... ALSO LOOT', 'TAKE IT! TAKE THE LOOT!', ['toss', 'charge', 'slam']],
  ['1-4', 'AUNTIE MUDWING', 'WIPE YOUR FEET, DEAR', 'MY GOOD FEATHERS...', ['graves', 'toss', 'slam']],
  ['1-S', 'THE GOLDEN GOSLING', 'YOU FOUND ME. NOW LOSE.', 'shiny... honk...', ['graves', 'honk']],
  ['1-F', 'UNCLE SHOVELBILL', 'I DIG GRAVES. YOURS IS NEXT.', 'GO ON, THEN. MOTHER IS WAITING', ['graves', 'slam', 'charge', 'toss']],
  // 2 the acorn clan
  ['2-1', 'PIP THE SQUIRRELING', 'I CAN SHOOT! KIND OF!', 'I WANT MY ACORN BACK', ['fan', 'toss']],
  ['2-2', 'SNIPER NUTKIN', 'HOLD STILL. THANK YOU.', 'YOU MOVED. RUDE.', ['arrows', 'fan']],
  ['2-S', 'PRINCESS SPORELLA', 'THIS HOLLOW IS ROYAL PROPERTY', 'DADDY WILL HEAR OF THIS', ['arrows', 'volley']],
  ['2-3', 'BULLSEYE BETTY', 'EVERYTHING IS A TARGET', 'MISSED... BY A MILE', ['fan', 'arrows', 'charge']],
  ['2-4', 'OLD MAN MOSSTAIL', 'BACK IN MY DAY WE SHOT ROCKS', 'NAP TIME, THEN', ['toss', 'arrows', 'fan']],
  ['2-5', 'QUIVER QUENTIN', 'I HAVE NINETY-NINE ARROWS', 'NINETY-EIGHT... LEFT...', ['arrows', 'charge', 'fan']],
  ['2-F', 'CAPTAIN HAZELNUT', 'ARCHERS! ...IT IS JUST ME', 'THE KING WILL AVENGE ME', ['arrows', 'fan', 'charge', 'toss']],
  // 3 jr.'s surf crew
  ['3-1', 'BABY BRO BUBBLES', 'I AM FOUR AND THREE QUARTERS', 'WAAAH! JR.!', ['toss', 'shell']],
  ['3-2', 'SENSEI SIS SANDY', 'BOW TO THE DOJO', 'GOOD FORM. ANNOYING, BUT GOOD', ['charge', 'tide']],
  ['3-3', 'COUSIN KELPY', 'KELP ME? NO. KELP YOU!', 'THAT PUN WAS MY BEST ONE', ['shell', 'tide']],
  ['3-4', 'RIPTIDE RICKY', 'GNARLY. YOU ARE GOING DOWN', 'WIPEOUT, DUDE', ['charge', 'tide', 'toss']],
  ['3-S', 'THE SANDAL PRINCE', 'WHO TOUCHED MY SANDAL', 'MY SANDAL...', ['shell', 'surf']],
  ['3-5', 'SPUD THE SPARRING PARTNER', 'I GET HIT FOR A LIVING', 'SAME TIME TOMORROW?', ['charge', 'shell', 'toss']],
  ['3-F', 'BIG SIS CORAL', 'NOBODY PICKS ON MY LITTLE BROTHER', 'FINE. GO BOTHER JR.', ['tide', 'shell', 'charge', 'toss']],
  // 4 the raccoon racket
  ['4-1', 'LOOKOUT LENNY', 'I SAW NOTHING. I SEE YOU.', 'I SAW... STARS', ['smoke', 'toss']],
  ['4-2', 'PICKPOCKET PATTY', 'NICE WALLET. WAS NICE.', 'KEEP IT, KEEP IT!', ['smoke', 'coins']],
  ['4-3', 'ROOFTOP RODNEY', 'THE ROOFS ARE OUR TURF', 'THE GUTTER... IS COMFY', ['toss', 'fan', 'smoke']],
  ['4-S', 'THE BASEMENT BARON', 'WELCOME TO THE BLACK MARKET', 'NO REFUNDS...', ['coins', 'decoys']],
  ['4-4', 'HALF-PRICE HAROLD', 'EVERYTHING MUST GO! INCLUDING YOU', 'CLEARANCE... SALE...', ['coins', 'fan', 'toss']],
  ['4-F', 'COUSIN PAWNSWORTH', 'I WILL GIVE YOU TWO SHARDS FOR THAT', 'THE BOSS WILL NOT LIKE THIS', ['smoke', 'coins', 'fan', 'toss']],
  // 5 the petal house
  ['5-1', 'PETAL PAGE HANAKO', 'THE SHOGUN SENDS HIS REGARDS', 'I MUST PRACTICE MORE', ['petals', 'charge']],
  ['5-2', 'LANTERN KEEPER TORO', 'THE BRIDGE IS CLOSED. FOREVER.', 'THE LIGHTS GO OUT...', ['fan', 'iai']],
  ['5-3', 'BAMBOO BROTHER TAKE', 'I GROW THREE FEET A DAY', 'SNAPPED LIKE A SHOOT', ['iai', 'charge']],
  ['5-4', 'KOI SISTER NISHIKI', 'THE POND IS ALWAYS WATCHING', 'BLUB...', ['petals', 'fan', 'iai']],
  ['5-S', 'THE MOON PRINCE', 'THE TORII OPENS FOR NO ONE', 'THE MOON... SETS...', ['iai', 'storm']],
  ['5-5', 'THOUSAND-CUT KENTA', 'NINE HUNDRED NINETY-NINE TO GO', 'ONE THOUSAND... AND ONE', ['iai', 'charge', 'fan']],
  ['5-F', 'GENERAL ORIGAMI', 'MY WALLS ARE PAPER. MY WILL IS NOT.', 'FOLDED...', ['petals', 'iai', 'charge', 'fan']],
  // 6 the ogre brotherhood
  ['6-1', 'BROTHER PEBBLE', 'I AM THE SMALL ONE. STILL BIG.', 'OOF. TINY OOF.', ['stomp', 'fan']],
  ['6-2', 'BROTHER WHEELY', 'SPIN THE WHEEL! PRAY!', 'DIZZY...', ['fan', 'avalanche']],
  ['6-3', 'BROTHER HAM', 'HAAAAM. HAAAAAAAM.', 'NO MORE HAM...', ['stomp', 'slam', 'summon:monk']],
  ['6-4', 'SISTER SNOWDRIFT', 'BUNDLE UP, LITTLE ONE', 'I NEED COCOA', ['avalanche', 'stomp']],
  ['6-S', 'THE HOT SPRING HERMIT', 'YOU ARE DRIPPING ON MY SPRING', 'TOO RELAXED TO LOSE...', ['avalanche', 'slam']],
  ['6-5', 'BROTHER GONG', 'BONG.', 'bong...', ['stomp', 'fan', 'slam']],
  ['6-F', 'ABBOT ROLLO', 'THE KING IS MEDITATING. GO AWAY.', 'GO. WAKE HIM. I DARE YOU.', ['avalanche', 'stomp', 'fan', 'summon:monk']],
  // 7 the crazy uncles (Sr.'s brothers)
  ['7-1', 'UNCLE SPARKY', 'PULL MY FINGER. IT IS A FUSE.', 'FIZZLED OUT', ['strikes', 'charge']],
  ['7-2', 'UNCLE ANDY ANVIL', 'HEADS UP!', 'HEADS... DOWN...', ['anvils', 'charge']],
  ['7-3', 'UNCLE BELLOWS', 'I AM FULL OF HOT AIR', 'PFFFFFFT', ['slam', 'molten']],
  ['7-S', 'GRANDPA WRENCH', 'GET OFF MY TOOLSHED', 'KIDS THESE DAYS...', ['anvils', 'strikes']],
  ['7-4', 'UNCLE SLAGGY', 'WHEEE! SLAG SLIDE!', 'I AM STUCK IN THE SLAG', ['molten', 'charge', 'toss']],
  ['7-5', 'AUNT QUENCHY', 'TIME TO COOL YOU OFF', 'SSSSSS...', ['strikes', 'molten', 'toss']],
  ['7-F', 'UNCLE BOLTS', 'YOUR DAD OWES ME AN ANVIL', 'TELL SR. I SAID HI', ['anvils', 'molten', 'strikes', 'charge']],
  // 8 grandma's sisters
  ['8-1', 'GREAT-AUNT DOILY', 'MIND THE FLOWERBEDS', 'MY DOILIES...', ['lob', 'cookies']],
  ['8-2', 'AUNTIE SNICKERDOODLE', 'HAVE A COOKIE. HAVE ALL OF THEM.', 'CRUMBS...', ['cookies', 'lob']],
  ['8-S', 'NANA PURLS', 'KNIT ONE, PURL YOU', 'I DROPPED A STITCH', ['sparkles', 'summon:crawler']],
  ['8-3', 'GREAT-AUNT CASSIE', 'THE CASSEROLE IS ONLY A LITTLE CURSED', 'SEND IT BACK TO THE KITCHEN', ['lob', 'sparkles', 'cookies']],
  ['8-4', 'GRANDPA TICKTOCK', 'YOU ARE LATE. FOR DINNER.', 'DONG... DONG...', ['sparkles', 'lob']],
  ['8-5', 'AUNTIE ROCKSALOT', 'ROCK ON, DEARIE', 'MY HIP...', ['cookies', 'sparkles', 'summon:crawler']],
  ['8-F', 'LADY EARL GREY', 'PINKIES OUT. SWORDS OUT.', 'TEA... TIME... OVER', ['sparkles', 'cookies', 'lob', 'summon:crawler']],
  // 9 the shadow board
  ['9-1', 'INTERN KOJI', 'IS THIS PAID? NO? OKAY.', 'I QUIT. FOR TODAY.', ['stars', 'charge']],
  ['9-2', 'SHADOW SIS SHOJI', 'YOU CANNOT SEE ME. MOSTLY.', 'SEEN...', ['vanish', 'stars']],
  ['9-3', 'ROOFTOP RYU', 'NINJAS LOVE ROOFS', 'TOO MANY ROOFS', ['stars', 'vanish', 'charge']],
  ['9-S', 'THE SCROLL KEEPER', 'THIS SCROLL SAYS YOU LOSE', 'THE SCROLL WAS WRONG', ['vanish', 'clones']],
  ['9-4', 'STARRY SUZU', 'ONE STAR REVIEW FOR YOU', 'FIVE STARS. FOR YOU.', ['stars', 'coins']],
  ['9-5', 'VICE PRESIDENT KAGE', 'I APPROVE YOUR TERMINATION', 'SCHEDULE A FOLLOW-UP...', ['coins', 'stars', 'summon:ninja']],
  ['9-F', 'CHAIRMAN SHURI', 'THE BOARD VOTES: YOU LOSE', 'MOTION... DENIED...', ['stars', 'vanish', 'coins', 'summon:ninja']],
  // 10 the living arsenal
  ['10-1', "LIL' RACKLEY", 'I JUST CAME OFF THE RACK', 'BACK ON THE RACK...', ['strikes', 'charge']],
  ['10-2', 'THE UPRISING BLADE', 'WEAPONS OF THE WORLD, UNITE!', 'THE REVOLUTION... IS DULL', ['swordrain', 'charge']],
  ['10-3', 'BAGGY THE BROADSWORD', 'NO BAG SPACE FOR YOU', 'INVENTORY... FULL...', ['graves', 'strikes']],
  ['10-4', 'MIMI THE MIMIC SWORD', 'PICK ME UP! ...GOTCHA', 'YOU SHOULD HAVE PICKED ME', ['charge', 'stars', 'graves']],
  ['10-S', 'THE CLOSET CUTLASS', 'I LIVE IN THE CLOSET OF NONSENSE', 'BACK IN THE CLOSET...', ['swordrain', 'stars']],
  ['10-5', 'EVERY-SWORD EDNA', 'I AM EVERY SWORD. ALMOST.', 'NOT EVERY SWORD...', ['swordrain', 'strikes', 'stars']],
  ['10-F', 'THE LAST LONGSWORD', 'NONE SHALL PASS. I AM SO LONG.', 'THE ARMORY... AWAITS...', ['swordrain', 'graves', 'strikes', 'charge']]
];

// the level's place on its world's road, 0 (first level) .. 1 (the castle), by authoring order
const order = {};
for (const R of REGIONS) {
  const ids = Object.values(NODES).filter(n => n.region === R.id && isLevel(n)).map(n => n.id);
  ids.forEach((id, i) => (order[id] = ids.length > 1 ? i / (ids.length - 1) : 1));
}
export const levelTier = id => order[id] ?? 0;

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
    warn: `${name} IS COMING...`, intro: [intro], phase: [name === 'BROTHER GONG' ? 'BONG!' : 'NOW I AM MAD!', `${F.name} NEVER LOSE!`],
    defeat, bolt: F.bolt, speed: 44
  };
}
for (const n of Object.values(NODES)) if (n.kind === 'castle') BOSS_OF[n.id] = FAMILIES[n.region].head;
export const HEAD_KINDS = Object.values(FAMILIES).map(F => F.head);
export const familyOfHead = kind => +Object.keys(FAMILIES).find(r => FAMILIES[r].head === kind) || 0;
export const headOfZone = z => FAMILIES[z + 1].head;
