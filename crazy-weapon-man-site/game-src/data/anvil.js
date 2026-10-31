// The Legendary Anvil: what weapon relics are for. Every relic you have ever brought home is one to
// spend here, from the weapon log on the overworld (G). A strike makes the weapon in hand a more powerful version
// of itself: it catches up to the furthest world you have reached (a favourite from world 1 keeps
// up), climbs one rarity, and hits 10% harder. A weapon takes five strikes; the fifth awakens it
// (it learns an ability if it had none). Its name keeps a +1..+5. Strikes cost more each time, so a
// whole +5 weapon is a real hunt. Kept in the overworld save. Pure data, safe to import from tests.
// Weapons swap all the time now (every pickup is equipped: combat.js weapon armor), so the anvil's
// edge passes on: each new weapon takes the strikes of the one it replaces (inheritAnvil).
import { NODES } from './overworld.js';
import { relicTotal } from './relics.js';

export const ANVIL_MAX = 5;
export const STRIKE_BOOST = 1.1;
// relics for the next strike on a weapon struck n times: 5, 10, 15, 20, 25 (75 for a whole +5)
export const strikeCost = n => 5 * (n + 1);
export const strikes = w => w?.struck | 0;

export const relicsSpent = save => Math.max(0, save?.anvil?.spent | 0);
export const relicsToSpend = save => Math.max(0, relicTotal(save).got - relicsSpent(save));
// the furthest world you have reached: the highest zone of any cleared level
export const furthestZone = save => Object.keys(save?.cleared || {}).reduce((z, id) => Math.max(z, NODES[id]?.zone ?? 0), 0);

// why this weapon can't be struck now, or null
export function cantStrike(save, w) {
  if (!w) return 'PICK A WEAPON';
  if (strikes(w) >= ANVIL_MAX) return `ALREADY +${ANVIL_MAX}: AS STRONG AS THE ANVIL MAKES IT`;
  const cost = strikeCost(strikes(w)), have = relicsToSpend(save);
  if (have < cost) return `NEEDS ${cost} RELICS (YOU HAVE ${have})`;
  return null;
}
const baseName = name => String(name).replace(/ \+[1-9]$/, '');
// one strike (check cantStrike first); changes the weapon and the save, and returns true when this
// strike was the fifth (the caller gives the weapon its ability)
export function strike(save, w) {
  const n = strikes(w);
  save.anvil = { ...(save.anvil || {}), spent: relicsSpent(save) + strikeCost(n) };
  w.struck = n + 1;
  w.home = Math.max(w.home | 0, furthestZone(save));
  w.q = Math.min(10, (w.q | 0) + 1);
  if (w.look) w.look = { ...w.look, q: Math.max(w.look.q | 0, w.q) };
  w.boost = (w.boost || 1) * STRIKE_BOOST;
  w.name = `${baseName(w.name)} +${w.struck}`;
  return w.struck === ANVIL_MAX;
}

// a new weapon replacing a struck one takes its strikes: the +N, the 10% a strike, and at +5 the
// awakened ability if it has none of its own
export function inheritAnvil(w, old) {
  const n = strikes(old);
  if (!w || !n || strikes(w) >= n) return w;
  w.boost = (w.boost || 1) * Math.pow(STRIKE_BOOST, n - strikes(w));
  w.struck = n;
  if (n >= ANVIL_MAX && !w.ability && old.ability) w.ability = old.ability;
  w.name = `${baseName(w.name)} +${n}`;
  return w;
}
