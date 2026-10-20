// Quirks: every weapon has one silly on-hit side effect, picked from the words in its name.
// Weapons are wacky from the very first swing: a Common blade goes off about every other hit, and
// rarer weapons keep going off often and hit harder when they do (quirkPower).
export const QUIRKS = {
  tetanus: { label: 'TETANUS', desc: 'Hits can give foes a nasty rust rash.', col: 'rust' },
  wobble: { label: 'WOBBLE', desc: 'Sometimes wobbles back for a free second hit.', col: 'cream' },
  flyoff: { label: 'LOOSE HEAD', desc: 'The business end sometimes flies off at foes.', col: 'sand' },
  splash: { label: 'SPLOOSH', desc: 'Splashes nearby foes and soaks them slow.', col: 'sky' },
  glue: { label: 'STICKY', desc: 'Glues foes in place for a moment.', col: 'lime' },
  boomerang: { label: 'BOOMERANG', desc: 'Bent enough to throw out a returning copy.', col: 'orange' },
  borrowed: { label: 'BORROWED POWER', desc: "Hits sometimes use someone else's element.", col: 'pink' },
  poke: { label: 'POKEY', desc: 'Sometimes finds the soft spot: a free crit.', col: 'paper' },
  sad: { label: 'SAD AURA', desc: 'Foes get too upset to fight for a while.', col: 'blue' },
  yoink: { label: 'YOINK', desc: 'Hits sometimes shake shards out of pockets.', col: 'ice' },
  stink: { label: 'STINKY', desc: 'Puffs a stench cloud that poisons foes around.', col: 'leaf' },
  shrapnel: { label: 'SHRAPNEL', desc: 'Chips off and peppers foes nearby.', col: 'mist' },
  bonk: { label: 'BONK', desc: 'Bonks foes into the air, seeing stars.', col: 'gold' },
  spare: { label: 'SPARE SWING', desc: 'A ghostly spare swings behind you too.', col: 'violet' },
  warm: { label: 'STILL WARM', desc: 'Hits sometimes heal you a little. Ew.', col: 'coral' },
  honk: { label: 'HONK', desc: 'Honks so loud nearby foes flinch back.', col: 'paper' },
  confetti: { label: 'PARTY POPPER', desc: 'Pops confetti that pelts and dazzles every foe around.', col: 'pink' },
  zap: { label: 'STATIC CLING', desc: 'Built-up static jumps between up to three foes.', col: 'sky' },
  giant: { label: 'GROWTH SPURT', desc: 'Briefly grows huge and flattens everything in front.', col: 'orange' }
};
export const QUIRK_LIST = Object.keys(QUIRKS);

// condition words (names.js COND) -> the quirk they promise
const BY_WORD = {
  Rusty: 'tetanus', Chipped: 'shrapnel', Borrowed: 'borrowed', Damp: 'splash', Dented: 'bonk', Wobbly: 'wobble',
  Pointy: 'poke', Used: 'warm', Stolen: 'yoink', Bent: 'boomerang', Bargain: 'yoink', Loose: 'flyoff',
  Sticky: 'glue', Musty: 'stink', Plain: 'bonk', Spare: 'spare', Sad: 'sad', Cracked: 'shrapnel',
  Soggy: 'splash', Honking: 'honk', Bitey: 'tetanus', Gloomy: 'sad', Jittery: 'wobble', Sneaky: 'yoink',
  Rowdy: 'confetti', Overbrewed: 'zap', Feral: 'giant', Smug: 'confetti', Forbidden: 'zap', 'Brave-ish': 'giant'
};

export function quirkFor(look, r = Math.random) {
  for (const word of [look?.cond, look?.adj]) if (word && BY_WORD[word]) return BY_WORD[word];
  return QUIRK_LIST[Math.floor(r() * QUIRK_LIST.length)];
}
// chance per hit by rarity: Common 50%, Rare 44% ... ABSURD 30%. Never rare enough to forget.
const RATE = [0.5, 0.47, 0.44, 0.42, 0.4, 0.38, 0.36, 0.34, 0.32, 0.31, 0.3];
export const quirkChance = w => RATE[Math.max(0, Math.min(10, w.q))];
// how hard a quirk hits, as a multiple of its base effect: rarer and standout weapons go bigger
export const quirkPower = w => 1 + 0.12 * Math.max(0, w.q) + (w.standout ? 0.5 : 0);
