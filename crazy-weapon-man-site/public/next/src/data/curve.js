// The numbers. One place, small values that grow ~1.9x per zone (so a weapon fades as you move on).
//
// Enemy health in zone z:    refHP(z) * ENEMY_HP * type.hp * (elite ? 2.2 : 1) * (1 + 0.06 * wave)
// Weapon hit (normal):       refHP(home) * share(q) * type.hit * move multiplier
// Weapon hit (standout):     refHP(home) * STANDOUT_SHARE * move multiplier -> one-shots a normal
//                            enemy at home, 2 hits in the next zone (~1.9x health), ~4 after
// share(q) = 0.26 + 0.02q    -> a sword (hit 1.25) takes ~5 hits on a home-zone enemy
export const refHP = z => Math.round(30 * Math.pow(1.9, Math.max(0, z)));
export const refDmg = z => Math.round(9 * Math.pow(1.3, Math.max(0, z))); // enemy hit on the hero
export const share = q => 0.26 + 0.02 * q;
export const ENEMY_HP = 1.6;
export const STANDOUT_SHARE = 2.0;
// standouts get more common as you go: 1 in 16 at the start, 1 in 5 from zone 4
export const standoutChance = z => Math.min(0.2, 0.06 + 0.035 * z);
export const CRIT = { chance: 0.08, mult: 1.6 };
export const ELITE_HP = 2.2;
export const ELITE_DMG = 1.4;

export const xpToLevel = lv => Math.round(40 * Math.pow(1.28, lv - 1));
export const heroMaxHp = lv => 100 + (lv - 1) * 14;

// compact numbers: 999, 12.3K, 4.5M ... then joke units
const JOKE = ['GAZILLION', 'BAJILLION', 'KAJILLION', 'TOO MANY', 'YES'];
export function fmt(n) {
  n = Math.max(0, Math.round(Number(n) || 0));
  if (n < 1000) return String(n);
  const units = ['K', 'M', 'B', 'T'];
  let u = -1,
    v = n;
  while (v >= 1000 && u < units.length - 1) {
    v /= 1000;
    u++;
  }
  if (v >= 1000) return JOKE[Math.min(JOKE.length - 1, Math.floor(Math.log10(v) / 3) - 1)];
  return (v < 10 ? v.toFixed(1) : String(Math.round(v))).replace(/\.0$/, '') + units[u];
}
