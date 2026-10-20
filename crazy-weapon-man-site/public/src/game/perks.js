// The hero's side of meta.js: the account-wide bonuses (shard tree, world boss perks) plus the
// mastery perks of the weapon type in hand, read by the hero, combat, loot and pickup code.
import { world } from './world.js';
import { stats } from '../data/meta.js';
import { heroMaxHp } from '../data/curve.js';

export const heroStats = () => stats(world.hero?.weapon?.type || null);
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
