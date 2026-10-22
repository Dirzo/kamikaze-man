// Weapon relics: five golden relics hidden in every overworld level (Super Mario World's Dragon
// Coins). Four sit on the map, on its highest and furthest ledges; the fifth waits in the level's
// secret room, behind its hidden portal. Relics are kept when the level is cleared (a failed attempt
// keeps nothing, like everything else), and a level with all five wears a star on the overworld.
// Every relic brought home is one to spend at the Legendary Anvil (data/anvil.js).
// Pure data + pure functions, safe to import from tests.
import { LEVELS } from './overworld.js';

export const RELIC_COUNT = 5;
// what each relic is, in collection order
export const RELICS = [
  { name: 'THE GOLDEN HILT', look: 'hilt' },
  { name: 'THE GOLDEN GUARD', look: 'guard' },
  { name: 'THE GOLDEN BLADE', look: 'blade' },
  { name: 'THE GOLDEN POMMEL', look: 'pommel' },
  { name: 'THE GOLDEN EDGE', look: 'edge' }
];
export const RELIC_SHARDS = z => 6 + z * 3; // each one
export const SET_SHARDS = z => 30 + z * 15; // the fifth of a level, on top

// Four spots on the map: the map between the start and the arena is cut into four stretches, and
// each takes the far end (away from its ladders) of the highest surface in it. Relics float at
// head height, so walking along that surface collects them. `avoid` is a spot to keep clear of
// (the easter egg).
export function relicSpots(map, avoid = null) {
  const lo = Math.min(map.startX + 200, map.bossLeft / 3), hi = map.bossLeft - 48, n = RELIC_COUNT - 1, out = [];
  const used = new Set();
  for (let i = 0; i < n; i++) {
    const a = lo + ((hi - lo) * i) / n, b = lo + ((hi - lo) * (i + 1)) / n;
    const ps = map.platforms.filter(p => !used.has(p) && p.w >= 24 && p.x + p.w > a + 16 && p.x < b - 16);
    if (!ps.length) continue;
    const top = ps.reduce((m, p) => (p.y < m.y || (p.y === m.y && p.x > m.x) ? p : m));
    used.add(top);
    const x0 = Math.max(top.x + 10, a + 8), x1 = Math.min(top.x + top.w - 10, b - 8);
    const lads = map.ladders.filter(l => l.top === top.y && l.x >= x0 - 30 && l.x <= x1 + 30);
    const mid = (x0 + x1) / 2, ladX = lads.length ? lads.reduce((s, l) => s + l.x, 0) / lads.length : x0;
    let x = Math.round(ladX < mid ? x1 : x0);
    if (avoid && Math.abs(x - avoid.x) < 28 && Math.abs(top.y - avoid.y) < 20) x = Math.round(ladX < mid ? x0 : x1);
    out.push({ x, y: top.y - 16 });
  }
  return out;
}
// the fifth, on the secret room's ledge (maps.js secretRoom)
export const roomRelicSpot = room => ({ x: Math.round(room.ledge.x + room.ledge.w - 18), y: room.ledge.y - 16 });

// ---- the save: save.relics = { level id: bit mask of the relics ever taken there }
export const relicMask = (save, id) => (save?.relics?.[id] | 0) & ((1 << RELIC_COUNT) - 1);
export const relicCount = (save, id) => [...Array(RELIC_COUNT).keys()].filter(i => relicMask(save, id) & (1 << i)).length;
export const allRelics = (save, id) => relicCount(save, id) === RELIC_COUNT;
// add the relics taken on a cleared attempt; returns how many were new
export function keepRelics(save, id, mask) {
  const before = relicCount(save, id);
  save.relics = { ...(save.relics || {}), [id]: relicMask(save, id) | mask };
  return relicCount(save, id) - before;
}
export const relicTotal = save => ({ got: LEVELS.reduce((s, n) => s + relicCount(save, n.id), 0), all: LEVELS.length * RELIC_COUNT, sets: LEVELS.filter(n => allRelics(save, n.id)).length });
