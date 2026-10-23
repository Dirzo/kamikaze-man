// The hero's side of meta.js: the account-wide bonuses (shard tree, world boss perks) plus the
// mastery perks of the weapon type in hand, read by the hero, combat, loot and pickup code.
import { world } from './world.js';
import { stats } from '../data/meta.js';
import { heroMaxHp } from '../data/curve.js';
import { speedBoon, SPEED_BOONS } from '../data/specials.js';

// (the zone too: a trophy made for this world adds its home-turf edge)
// plus the held weapon's SPEED boon, if it rolled one (data/specials.js)
const geared = new WeakMap();
export const heroStats = () => {
  const w = world.hero?.weapon, base = stats(w?.type || null, world.zone ?? null);
  return withGear(base, w);
};
export function withGear(base, w) {
  const b = w && speedBoon(w);
  if (!b) return base;
  let g = geared.get(w);
  if (!g || g.base !== base) {
    g = { base, s: { ...base } };
    for (const [k, v] of Object.entries(SPEED_BOONS[b].stats)) g.s[k] += v;
    geared.set(w, g);
  }
  return g.s;
}
// max health at a hero level, with the account's health bonuses
export const heroMax = lv => Math.round(heroMaxHp(lv) * (1 + stats().hp));
// innate abilities (mastery signatures, world boss perks) work like the weapon's own ability
export const innate = id => heroStats().innate.has(id);
// the situational damage bonuses on one of the hero's hits on foe e
export function foeMult(e) {
  const s = heroStats();
  let m = 1;
  if (e.boss || e.elite) m += s.bossDmg;
  if (world.director?.phase === 'survive' && !e.boss) m += s.swarmDmg;
  if (e.hp < e.max / 3) m += s.execute;
  return m;
}
