// Specials: every weapon type has three, and each weapon rolls one of them when it drops (a
// Training weapon and Commons keep the type's signature move). Rarer weapons also roll special
// BOONS on top: more damage, a shorter cooldown, a bigger blast, life on hit and so on. Both are
// worked out from the weapon's name, so old saves get theirs too and a weapon never changes.
// The moves themselves live in game/hero.js (the signature ones) and game/specials.js (the rest).
//   mult: rough damage per foe, for the codex and tests (the moves set their own numbers)
export const SPECIALS = {
  // ---- blades
  whirl: { type: 'sword', name: 'WHIRLWIND', desc: 'Spin through the crowd, four cuts all around.', cool: 5 },
  skysplit: { type: 'sword', name: 'SKY SPLITTER', desc: 'A giant blade falls from the sky and splits the ground both ways.', cool: 6 },
  crossslash: { type: 'sword', name: 'CROSS SLASH', desc: 'Cut an X so big it flies across the screen.', cool: 5.5 },
  flurry: { type: 'dagger', name: 'FLURRY', desc: 'A storm of stabs in front of you.', cool: 4.5 },
  shadowstep: { type: 'dagger', name: 'SHADOW STEP', desc: 'Blink behind up to six foes and stab each one in the back.', cool: 5.5 },
  knives: { type: 'dagger', name: 'FAN OF KNIVES', desc: 'Sixteen daggers burst out in a ring, twice.', cool: 5 },
  iai: { type: 'katana', name: 'IAI DASH', desc: 'Dash through, then everything on the line falls apart.', cool: 4.5 },
  thousand: { type: 'katana', name: 'THOUSAND CUTS', desc: 'Vanish. Every foe nearby is cut to ribbons. Sheathe.', cool: 7 },
  moon: { type: 'katana', name: 'MOON CRESCENT', desc: 'Draw a crescent of moonlight that cuts the whole screen.', cool: 5.5 },
  // ---- blunt
  quake: { type: 'hammer', name: 'QUAKE', desc: 'Hop, slam, shockwave both ways.', cool: 6 },
  meteor: { type: 'hammer', name: 'METEOR DROP', desc: 'Leap off the screen and come down as a meteor.', cool: 7 },
  gavel: { type: 'hammer', name: 'THUNDER GAVEL', desc: 'Strike the ground and lightning hits six foes.', cool: 6 },
  cyclone: { type: 'nunchucks', name: 'CYCLONE', desc: 'A second of spinning you can steer.', cool: 5.5 },
  dragon: { type: 'nunchucks', name: 'DRAGON FURY', desc: 'Twelve blows in a blur, then a dragon uppercut.', cool: 6 },
  tornado: { type: 'nunchucks', name: 'TORNADO', desc: 'Whip up a tornado that drags foes along.', cool: 6.5 },
  vault: { type: 'staff', name: 'VAULT SLAM', desc: 'Vault up, then slam down.', cool: 5.5 },
  pillars: { type: 'staff', name: 'EARTH PILLARS', desc: 'Stone pillars burst from the ground ahead, one after another.', cool: 6 },
  monkey: { type: 'staff', name: 'MONKEY KING', desc: 'The staff grows enormous and sweeps a full circle.', cool: 6.5 },
  skewer: { type: 'spear', name: 'SKEWER RUSH', desc: 'Charge forward, skewering everything in front.', cool: 5 },
  dragoon: { type: 'spear', name: 'DRAGOON DIVE', desc: 'Leap high and dive spear-first into the ground.', cool: 6 },
  spearrain: { type: 'spear', name: 'SPEAR RAIN', desc: 'Call a rain of spears down ahead of you.', cool: 6 },
  tomahawk: { type: 'axe', name: 'TOMAHAWK', desc: 'Hurl a big spinning axe that comes back.', cool: 5 },
  berserk: { type: 'axe', name: 'BERSERKER', desc: 'Spin forward like a buzzsaw.', cool: 5.5 },
  splitter: { type: 'axe', name: 'EARTH SPLITTER', desc: 'Chop the ground open: a fissure races ahead.', cool: 6 },
  reap: { type: 'scythe', name: 'GRIM REAP', desc: 'One huge sweep; each foe cut gives health back.', cool: 6 },
  harvest: { type: 'scythe', name: 'SOUL HARVEST', desc: 'Rip the souls from every foe nearby and drink them.', cool: 7 },
  deathmoon: { type: 'scythe', name: 'DEATH CRESCENT', desc: 'Two giant crescents fly out both ways.', cool: 6 },
  // ---- ranged
  volley: { type: 'bow', name: 'VOLLEY', desc: 'Five arrows at once.', cool: 5 },
  arrowrain: { type: 'bow', name: 'ARROW RAIN', desc: 'Twenty-four arrows fall on the ground ahead.', cool: 6 },
  siege: { type: 'bow', name: 'SIEGE SHOT', desc: 'Charge, then loose a ballista bolt that pierces everything.', cool: 6.5 },
  storm: { type: 'shuriken', name: 'STAR STORM', desc: 'Eight stars in every direction.', cool: 5 },
  orbit: { type: 'shuriken', name: 'STAR HALO', desc: 'Six stars circle you for four seconds.', cool: 7 },
  bigstar: { type: 'shuriken', name: 'GIANT STAR', desc: 'Throw a shuriken as big as you that bounces back and forth.', cool: 6 },
  nova: { type: 'wand', name: 'NOVA', desc: 'A burst of light all around you.', cool: 5.5 },
  blackhole: { type: 'wand', name: 'BLACK HOLE', desc: 'Open a void that drags foes in, then implodes.', cool: 7 },
  beam: { type: 'wand', name: 'ARCANE BEAM', desc: 'Fire a screen-long laser.', cool: 6.5 },
  ricochet: { type: 'boomerang', name: 'BOOMERANG BARRAGE', desc: 'Three boomerangs, fanned.', cool: 5 },
  megarang: { type: 'boomerang', name: 'MEGARANG', desc: 'A giant boomerang mows down everything, out and back.', cool: 6 },
  flock: { type: 'boomerang', name: 'HOMING FLOCK', desc: 'Eight boomerangs that hunt foes down.', cool: 6 }
};
export const SPECIAL_LIST = Object.keys(SPECIALS);
// each type's three, signature move first
export const SPECIALS_OF = {};
for (const id of SPECIAL_LIST) (SPECIALS_OF[SPECIALS[id].type] ||= []).push(id);

// boons: rolled on Uncommon and better (more on rarer weapons and standouts)
export const BOONS = {
  overcharge: { label: 'OVERCHARGED', desc: 'Special deals +60% damage.', col: 'orange' },
  quick: { label: 'HAIR TRIGGER', desc: 'Special cooldown -35%.', col: 'lime' },
  giant: { label: 'GIGANTIC', desc: 'Special reaches 40% further.', col: 'gold' },
  vamp: { label: 'BLOODRUSH', desc: 'Special hits heal 1.5% health each.', col: 'red' },
  refund: { label: 'CHAIN REACTION', desc: 'Each special kill takes 0.8s off its cooldown.', col: 'sky' },
  aftershock: { label: 'AFTERSHOCK', desc: 'A shockwave follows every special.', col: 'sand' },
  guard: { label: 'UNTOUCHABLE', desc: 'No damage during a special and just after.', col: 'ice' },
  execute: { label: 'EXECUTIONER', desc: 'Special hits deal triple damage to foes under 30% health.', col: 'coral' },
  infuse: { label: 'INFUSED', desc: 'Special strikes with an element (its own if the weapon has none).', col: 'pink' }
};
export const BOON_LIST = Object.keys(BOONS);
export const boonCount = (q, standout) => Math.min(3, (q >= 8 ? 3 : q >= 5 ? 2 : q >= 1 ? 1 : 0) + (standout ? 1 : 0));

// a weapon's own little random stream: the same weapon always rolls the same
function seeded(w) {
  let s = 2166136261;
  for (const ch of `${w.name}|${w.type}|${w.q}`) s = Math.imul(s ^ ch.charCodeAt(0), 16777619);
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)), ((s >>>= 0) % 100000) / 100000);
}
const ELEMENT_ROLL = ['fire', 'ice', 'lightning', 'poison', 'void', 'radiant'];
// { id, boons: [...], element } for a weapon (cached on it as w.sp)
export function specialRoll(w) {
  if (w.sp && SPECIALS[w.sp.id] && SPECIALS[w.sp.id].type === w.type) return w.sp;
  const r = seeded(w), list = SPECIALS_OF[w.type];
  // Commons (and the Training weapon) carry the signature move; Uncommon+ roll any of the three
  const id = !w.standout && (w.q || 0) < 1 ? list[0] : list[Math.floor(r() * list.length)];
  const pool = [...BOON_LIST], boons = [];
  for (let n = boonCount(w.q || 0, w.standout); n > 0; n--) boons.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  const element = ELEMENT_ROLL[Math.floor(r() * ELEMENT_ROLL.length)];
  return (w.sp = { id, boons, element });
}
export const specialOf = w => SPECIALS[specialRoll(w).id];
export const specialId = w => specialRoll(w).id;
export const hasBoon = (w, b) => !!w && specialRoll(w).boons.includes(b);

// SPEED boons: Uncommon and better weapons can also roll one of these, a gear stat for how you run
// (hero.js momentum). Rolled on a stream of its own, so the special boons a weapon already had stay
// the same; a weapon never changes.
export const SPEED_BOONS = {
  fleet: { label: 'FLEET', desc: '+8% speed.', col: 'sky', stats: { speed: 0.08 } },
  tailwind: { label: 'TAILWIND', desc: 'Momentum builds 35% faster.', col: 'ice', stats: { accel: 0.35 } },
  slipstream: { label: 'SLIPSTREAM', desc: 'Hits at full speed RUSH 15% harder.', col: 'teal', stats: { rush: 0.15 } }
};
const SPEED_LIST = Object.keys(SPEED_BOONS);
// the weapon's speed boon id, or null (cached on it as w.spd)
export function speedBoon(w) {
  if (!w) return null;
  if (w.spd !== undefined && (w.spd === null || SPEED_BOONS[w.spd])) return w.spd;
  const r = seeded({ name: w.name + '|speed', type: w.type, q: w.q });
  const chance = (w.q || 0) < 1 && !w.standout ? 0 : Math.min(0.6, 0.22 + 0.04 * (w.q || 0) + (w.standout ? 0.15 : 0));
  return (w.spd = r() < chance ? SPEED_LIST[Math.floor(r() * SPEED_LIST.length)] : null);
}
