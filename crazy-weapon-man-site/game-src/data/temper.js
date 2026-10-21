// TEMPER: the post-game difficulty tiers (Slormancer's Ultimatums and Diablo's Torments, tempered
// like steel). Beating the Sentient Armory opens TEMPER 1; beating any castle at your highest temper
// opens the next, up to TEMPER 10. Each tier makes every level's enemies tougher and switches on one
// more enemy modifier (they stack), and pays back in rarer weapons, more shards and more XP. Choose
// the tier on the overworld (T). Kept in the overworld save. Pure data, safe to import from tests.
import { FINAL, NODES } from './overworld.js';

export const TEMPER_MAX = 10;
// tier n switches on MODS[0..n-1]
export const MODS = [
  { id: 'keen', name: 'KEEN EDGES', desc: 'Enemies hit 20% harder' },
  { id: 'hides', name: 'THICK HIDES', desc: 'Enemies have 40% more health' },
  { id: 'vengeful', name: 'VENGEFUL', desc: 'Fallen residents burst into a ring of bolts' },
  { id: 'warded', name: 'WARDED', desc: 'One resident in four wears a ward that blocks the first hit' },
  { id: 'swift', name: 'SWIFT', desc: 'Enemies move 20% faster' },
  { id: 'elites', name: 'ELITE PACKS', desc: 'Twice as many elites' },
  { id: 'regen', name: 'REGENERATION', desc: 'Residents heal while you leave them alone' },
  { id: 'enraged', name: 'ENRAGED', desc: 'Wounded enemies hit 30% harder and move faster' },
  { id: 'scarce', name: 'SCARCE HEARTS', desc: 'Hearts drop half as often' },
  { id: 'armory', name: 'THE ARMORY AWAKES', desc: 'Bosses have 50% more health and act faster' }
];
export const modOn = (n, id) => MODS.findIndex(m => m.id === id) < n;
export const modsOf = n => MODS.slice(0, Math.max(0, Math.min(TEMPER_MAX, n)));

// what a tier does to the enemies on top of its modifiers, and what it pays
export function temper(n) {
  n = Math.max(0, Math.min(TEMPER_MAX, n | 0));
  const on = id => modOn(n, id);
  return {
    n,
    hp: (1 + 0.3 * n) * (on('hides') ? 1.4 : 1),
    dmg: (1 + 0.12 * n) * (on('keen') ? 1.2 : 1),
    speed: on('swift') ? 1.2 : 1,
    bossHp: on('armory') ? 1.5 : 1,
    bossSpeed: on('armory') ? 1.25 : 1,
    hearts: on('scarce') ? 0.5 : 1,
    // rewards
    rarity: Math.ceil(n / 2), // weapons roll this many tiers rarer (past the zone's usual ceiling)
    shards: 1 + 0.25 * n,
    xp: 1 + 0.1 * n,
    standout: 0.02 * n
  };
}
export const rewardText = n => (n ? `+${temper(n).rarity} RARITY  +${Math.round(25 * n)}% SHARDS  +${10 * n}% XP` : 'NO TEMPER: THE GAME AS IT CAME');

// ---- the save: save.temper = { on, max }
export const temperOf = save => ({ on: Math.max(0, Math.min(save?.temper?.max || 0, save?.temper?.on || 0)), max: Math.max(0, Math.min(TEMPER_MAX, save?.temper?.max || 0)) });
export function setTemper(save, n) {
  const T = temperOf(save);
  save.temper = { ...T, on: Math.max(0, Math.min(T.max, n)) };
  return save.temper.on;
}
// a level was cleared at temper `on`: returns the tier that just opened, or 0
export function temperClear(save, id) {
  const T = temperOf(save), n = NODES[id];
  let next = 0;
  if (id === FINAL && T.max === 0) next = 1;
  else if (n?.kind === 'castle' && T.on >= 1 && T.on === T.max && T.max < TEMPER_MAX) next = T.max + 1;
  if (next) save.temper = { on: T.on, max: next };
  return next;
}
