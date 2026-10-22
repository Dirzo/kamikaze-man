// The overworld: a Super Mario World style map of 78 levels across the ten weapon zones. Each
// region is one zone (its art, residents and difficulty); you walk the hero along revealed paths
// from node to node and press a button to play a level. Clearing a level reveals the paths out of
// it, often two at once (a fork: pick either road). Some levels also have a secret exit that opens
// a hidden level or a warp cannon that skips ahead. Failing a level only costs that attempt: the
// map, and everything cleared on it, is kept. Pure data + pure functions, safe to import from tests.
//
// Node kinds: start (the crash site), level, fort (mid-region stronghold), castle (region boss),
// secret (only reached through a secret exit) and warp (a cannon to its `to` partner).
// Exits: `next` is the normal exit, `secret` the secret exit. Positions are local to the region's
// 360x270 slot, authored left-to-right; regions with flip:true run right-to-left (x mirrored).
export const SLOT_W = 360, SLOT_H = 270;
export const OVERWORLD_KEY = 'crazyWeaponMan.overworld.v1';

// zone = index into ZONES; col/row = slot on the 5x2 map grid (top row left to right, then the
// bottom row back right to left, like a winding road)
export const REGIONS = [
  { id: 1, zone: 0, col: 0, row: 0, name: 'SWORD GRAVEYARD' },
  { id: 2, zone: 1, col: 1, row: 0, name: "RANGER'S SNOWY WOODS" },
  { id: 3, zone: 2, col: 2, row: 0, name: 'NUNCHUCK TURTLE LAGOON' },
  { id: 4, zone: 3, col: 3, row: 0, name: "THIEVES' NIGHT BAZAAR" },
  { id: 5, zone: 4, col: 4, row: 0, name: 'SAKURA KATANA SHRINE' },
  { id: 6, zone: 5, col: 4, row: 1, name: 'MOUNTAIN STAFF MONASTERY', flip: true },
  { id: 7, zone: 6, col: 3, row: 1, name: "DAD'S HAMMER & ANVIL FORGE", flip: true },
  { id: 8, zone: 7, col: 2, row: 1, name: "GRANDMA'S MAGIC WAND COTTAGE", flip: true },
  { id: 9, zone: 8, col: 1, row: 1, name: 'SHURIKEN NINJA CASTLE', flip: true },
  { id: 10, zone: 9, col: 0, row: 1, name: "THE DRAGON'S GOLD VAULT", flip: true }
];

// [id, region, kind, name, x, y, next, secret?, extra?]
const N = [
  // 1 Sword Graveyard: a fork after Hilt Hill, a secret pit with a cannon to the lagoon
  ['home', 1, 'start', 'Kamikaze Crash Site', 36, 196, ['1-1']],
  ['1-1', 1, 'level', 'Rusty Welcome', 84, 196, ['1-2']],
  ['1-2', 1, 'level', 'Hilt Hill', 132, 150, ['1-3', '1-4']],
  ['1-3', 1, 'level', 'Bandit Barrows', 192, 96, ['1-F']],
  ['1-4', 1, 'level', 'Scabbard Swamp', 192, 206, ['1-F'], ['1-S']],
  ['1-S', 1, 'secret', 'Pommel Pit', 248, 246, ['W1']],
  ['W1', 1, 'warp', 'Graveyard Cannon', 306, 246, [], null, { to: 'W1b' }],
  ['1-F', 1, 'fort', 'Gravedigger Fort', 252, 150, ['1-C']],
  ['1-C', 1, 'castle', 'Graveyard Keep', 318, 120, ['2-1']],
  // 2 Ranger's Snowy Woods: a secret shortcut past the bluffs; the low road skips the fort
  ['2-1', 2, 'level', 'Toadstool Trail', 40, 140, ['2-2']],
  ['2-2', 2, 'level', 'Squirrel Snipers', 96, 186, ['2-3'], ['2-S']],
  ['2-S', 2, 'secret', 'Spore Hollow', 150, 244, ['2-4']],
  ['2-3', 2, 'level', 'Bullseye Bluffs', 150, 120, ['2-4', '2-5']],
  ['2-4', 2, 'level', 'Mossy Longbow Lane', 214, 206, ['2-C']],
  ['2-5', 2, 'level', 'Quiver Canopy', 210, 70, ['2-F']],
  ['2-F', 2, 'fort', "Archer's Fort", 268, 96, ['2-C']],
  ['2-C', 2, 'castle', 'Ranger Lodge', 318, 156, ['3-1']],
  // 3 Nunchuck Turtle Lagoon (the Grand Snapper)
  ['W1b', 3, 'warp', 'Lagoon Landing', 40, 234, ['3-1'], null, { to: 'W1' }],
  ['3-1', 3, 'level', 'Shell Beach', 44, 150, ['3-2']],
  ['3-2', 3, 'level', 'Tidepool Dojo', 100, 150, ['3-3', '3-4']],
  ['3-3', 3, 'level', 'Kelp Kata', 156, 90, ['3-5']],
  ['3-4', 3, 'level', 'Riptide Rumble', 156, 206, ['3-5'], ['3-S']],
  ['3-S', 3, 'secret', 'Sunken Sandal', 214, 246, ['3-C']],
  ['3-5', 3, 'level', 'Sandbar Sparring', 214, 150, ['3-F']],
  ['3-F', 3, 'fort', 'Coral Fort', 266, 100, ['3-C']],
  ['3-C', 3, 'castle', "The Snapper's Dojo", 318, 170, ['4-1'], null, { boss: 'bossjr' }],
  // 4 Thieves' Night Bazaar: a black market basement hides a cannon to the monastery
  ['4-1', 4, 'level', 'Lantern Alley', 40, 156, ['4-2', '4-3']],
  ['4-2', 4, 'level', 'Pickpocket Plaza', 100, 96, ['4-4']],
  ['4-3', 4, 'level', 'Raccoon Rooftops', 100, 210, ['4-4'], ['4-S']],
  ['4-S', 4, 'secret', 'Black Market Basement', 160, 250, ['W2']],
  ['W2', 4, 'warp', 'Bazaar Cannon', 222, 250, [], null, { to: 'W2b' }],
  ['4-4', 4, 'level', 'Half-Price Hustle', 164, 156, ['4-F']],
  ['4-F', 4, 'fort', 'Pawnshop Fort', 232, 112, ['4-C']],
  ['4-C', 4, 'castle', "The Fat Cat's Vault", 312, 166, ['5-1']],
  // 5 Sakura Katana Shrine: a moonlit secret skips the fort
  ['5-1', 5, 'level', 'Petal Path', 40, 120, ['5-2']],
  ['5-2', 5, 'level', 'Lantern Bridge', 96, 120, ['5-3', '5-4']],
  ['5-3', 5, 'level', 'Bamboo Blades', 150, 66, ['5-5']],
  ['5-4', 5, 'level', 'Koi Pond Duel', 150, 180, ['5-5'], ['5-S']],
  ['5-S', 5, 'secret', 'Moonlit Torii', 214, 240, ['5-C']],
  ['5-5', 5, 'level', 'Thousand Cuts Stair', 210, 120, ['5-F']],
  ['5-F', 5, 'fort', 'Paper Wall Fort', 264, 90, ['5-C']],
  ['5-C', 5, 'castle', 'Shrine of the Last Sheath', 316, 200, ['6-1']],
  // 6 Mountain Staff Monastery (the Yak Abbot): a hot spring hides a cannon to Grandma's
  ['W2b', 6, 'warp', 'Monastery Landing', 40, 54, ['6-1'], null, { to: 'W2' }],
  ['6-1', 6, 'level', 'Switchback Steps', 40, 116, ['6-2']],
  ['6-2', 6, 'level', 'Prayer Wheel Pass', 96, 150, ['6-3', '6-4']],
  ['6-3', 6, 'level', 'Ham Chant Hall', 156, 90, ['6-F']],
  ['6-4', 6, 'level', 'Avalanche Abbey', 156, 206, ['6-5'], ['6-S']],
  ['6-S', 6, 'secret', "Hermit's Hot Spring", 214, 250, ['W3']],
  ['W3', 6, 'warp', 'Monastery Cannon', 272, 250, [], null, { to: 'W3b' }],
  ['6-5', 6, 'level', 'Cloud Gong Ridge', 220, 190, ['6-C']],
  ['6-F', 6, 'fort', 'Staff Spinner Fort', 224, 96, ['6-C']],
  ['6-C', 6, 'castle', "The Yak Abbot's Summit", 304, 146, ['7-1'], null, { boss: 'bossman' }],
  // 7 Dad's Hammer & Anvil Forge (Sr.)
  ['7-1', 7, 'level', 'Sparkfall Foundry', 40, 146, ['7-2']],
  ['7-2', 7, 'level', 'Anvil Rain', 96, 146, ['7-3', '7-4']],
  ['7-3', 7, 'level', 'Bellows Bounce', 152, 86, ['7-5'], ['7-S']],
  ['7-S', 7, 'secret', "Dad's Toolshed", 214, 48, ['7-C']],
  ['7-4', 7, 'level', 'Slag Slide', 152, 206, ['7-5']],
  ['7-5', 7, 'level', 'Quench Tank', 210, 150, ['7-F']],
  ['7-F', 7, 'fort', 'Bolt & Nut Fort', 262, 196, ['7-C']],
  ['7-C', 7, 'castle', "The Bear Smith's Big Anvil", 318, 120, ['8-1'], null, { boss: 'bosssr' }],
  // 8 Grandma's Magic Wand Cottage: a knitting maze hides a cannon to the vault
  ['W3b', 8, 'warp', 'Cottage Landing', 40, 236, ['8-1'], null, { to: 'W3' }],
  ['8-1', 8, 'level', 'Doily Garden', 40, 140, ['8-2']],
  ['8-2', 8, 'level', 'Cookie Tin Tumble', 96, 96, ['8-3'], ['8-S']],
  ['8-S', 8, 'secret', 'Knitting Basket Maze', 152, 48, ['W4']],
  ['W4', 8, 'warp', 'Cottage Cannon', 212, 48, [], null, { to: 'W4b' }],
  ['8-3', 8, 'level', 'Cursed Casserole', 152, 140, ['8-4', '8-5']],
  ['8-4', 8, 'level', 'Grandfather Clock Climb', 208, 100, ['8-F']],
  ['8-5', 8, 'level', 'Rocking Chair Rapids', 208, 206, ['8-C']],
  ['8-F', 8, 'fort', 'Teacup Fort', 264, 110, ['8-C']],
  ['8-C', 8, 'castle', "The Archmage's Study", 318, 170, ['9-1'], null, { boss: 'bossgrandma' }],
  // 9 Shuriken Ninja Castle (the Komodo Lord)
  ['9-1', 9, 'level', 'Moat Hop', 40, 156, ['9-2', '9-3']],
  ['9-2', 9, 'level', 'Shoji Shadows', 100, 96, ['9-4']],
  ['9-3', 9, 'level', 'Rooftop Run', 100, 210, ['9-4'], ['9-S']],
  ['9-S', 9, 'secret', 'Hidden Scroll Room', 162, 250, ['9-C']],
  ['9-4', 9, 'level', 'Throwing Star Gallery', 164, 156, ['9-5']],
  ['9-5', 9, 'level', 'Hostile Takeover Tower', 220, 106, ['9-F']],
  ['9-F', 9, 'fort', 'Throwing Star Fort', 268, 176, ['9-C']],
  ['9-C', 9, 'castle', "The Komodo Lord's Castle", 318, 116, ['10-1'], null, { boss: 'bossceo' }],
  // 10 The Dragon's Gold Vault: the final castle; a closet of bonus nonsense for the thorough
  ['W4b', 10, 'warp', 'Vault Landing', 40, 54, ['10-1'], null, { to: 'W4' }],
  ['10-1', 10, 'level', 'Weapon Rack Rally', 40, 140, ['10-2']],
  ['10-2', 10, 'level', 'Inventory Uprising', 96, 140, ['10-3', '10-4']],
  ['10-3', 10, 'level', 'Bag Space Bog', 152, 84, ['10-5']],
  ['10-4', 10, 'level', 'Mimic Mezzanine', 152, 200, ['10-5'], ['10-S']],
  ['10-S', 10, 'secret', 'Crazy Weapon Closet', 212, 248, []],
  ['10-5', 10, 'level', 'Every Weapon Ever', 210, 140, ['10-F']],
  ['10-F', 10, 'fort', 'Last Armory Fort', 262, 96, ['10-C']],
  ['10-C', 10, 'castle', "The Dragon's Hoard", 318, 156, [], null, { boss: 'bossweapon', final: true }]
];

export const NODES = {};
for (const [id, region, kind, name, x, y, next, secret, extra] of N) {
  const R = REGIONS[region - 1];
  NODES[id] = {
    id, region, zone: R.zone, kind, name,
    x: R.col * SLOT_W + (R.flip ? SLOT_W - x : x),
    y: R.row * SLOT_H + y,
    next, secret: secret || [], ...extra
  };
}
export const START = 'home';
export const FINAL = '10-C';
export const MAP_W = 5 * SLOT_W, MAP_H = 2 * SLOT_H;
export const isLevel = n => n.kind !== 'start' && n.kind !== 'warp';
export const LEVELS = Object.values(NODES).filter(isLevel);

// ---------------------------------------------------------------- progress
// save = { at: node id, cleared: { id: ['next'] | ['next','secret'] }, hero?: snapshot }
export const newSave = () => ({ v: 1, at: START, cleared: { [START]: ['next'] } });

// a revealed path: an exit that was taken out of a cleared node
export function edges(save) {
  const out = [];
  for (const [id, exits] of Object.entries(save.cleared)) {
    const n = NODES[id];
    if (!n) continue;
    for (const e of exits) for (const to of n[e] || []) if (NODES[to]) out.push({ from: id, to, secret: e === 'secret' });
  }
  return out;
}
export function isOpen(save, id) {
  return id === START || id in save.cleared || edges(save).some(e => e.to === id);
}
export const isCleared = (save, id) => !!save.cleared[id];
export const neighbours = (save, id) => edges(save).flatMap(e => (e.from === id ? [e.to] : e.to === id ? [e.from] : []));

// mark a level beaten through one of its exits; returns the paths that just appeared
export function clearLevel(save, id, exit = 'next') {
  const before = new Set(edges(save).map(e => e.from + '>' + e.to));
  const got = save.cleared[id] || (save.cleared[id] = []);
  if (!got.includes(exit)) got.push(exit);
  if (exit === 'secret' && !got.includes('next')) got.push('next'); // the secret exit is the harder way out of the same level
  return edges(save).filter(e => !before.has(e.from + '>' + e.to));
}
// stepping onto a start or warp node (no level to play) reveals its roads
export function visit(save, id) {
  const n = NODES[id];
  return n && !isLevel(n) && !save.cleared[id] ? clearLevel(save, id) : [];
}
// a warp cannon fires you to its partner, which then counts as visited
export function warp(save, id) {
  const n = NODES[id];
  if (!n || n.kind !== 'warp' || !(id in save.cleared)) return null;
  visit(save, n.to);
  save.at = n.to;
  return n.to;
}

// the node in direction (dx, dy) from `id` along a revealed path, if any (the SMW d-pad rule)
export function step(save, id, dx, dy) {
  const a = NODES[id];
  let best = null, bestDot = 0.35;
  for (const to of neighbours(save, id)) {
    const b = NODES[to], vx = b.x - a.x, vy = b.y - a.y, len = Math.hypot(vx, vy) || 1;
    const dot = (vx * dx + vy * dy) / len;
    if (dot > bestDot) { best = to; bestDot = dot; }
  }
  return best;
}

// debug/tests: beat every reachable level (and its secret exit, unless secrets is false) and take
// every cannon, until nothing new opens
export function revealAll(save = newSave(), secrets = true) {
  for (let changed = true; changed;) {
    changed = false;
    for (const n of Object.values(NODES)) {
      if (!isOpen(save, n.id)) continue;
      if (!isLevel(n)) {
        if (visit(save, n.id).length) changed = true;
        if (n.kind === 'warp' && !save.cleared[n.to] && warp(save, n.id)) changed = true;
        continue;
      }
      if (!save.cleared[n.id]?.includes('next')) { clearLevel(save, n.id, 'next'); changed = true; }
      if (secrets && n.secret.length && !save.cleared[n.id].includes('secret')) { clearLevel(save, n.id, 'secret'); changed = true; }
    }
  }
  save.at = START;
  return save;
}

export const progress = save => ({ cleared: LEVELS.filter(n => save.cleared[n.id]).length, total: LEVELS.length });

let storage = null;
try { storage = globalThis.localStorage || null; } catch (_) { storage = null; }
export function loadSave() {
  try {
    const s = JSON.parse(storage?.getItem(OVERWORLD_KEY) || 'null');
    if (s && s.v === 1 && s.cleared && NODES[s.at]) return s;
  } catch (_) { /* a broken save starts a fresh map */ }
  return newSave();
}
export function writeSave(save) {
  try { storage?.setItem(OVERWORLD_KEY, JSON.stringify(save)); } catch (_) { /* private mode: the map lives for this tab only */ }
}
export function eraseSave() {
  try { storage?.removeItem(OVERWORLD_KEY); } catch (_) { /* nothing saved */ }
}
