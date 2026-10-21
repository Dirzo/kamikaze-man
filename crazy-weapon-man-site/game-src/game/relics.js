// Weapon relics in play (data/relics.js has the rules): five golden pieces of a legendary weapon
// per overworld level, four on the map's highest ledges and one in its secret room. Touch one to
// take it. Ones you already own from an earlier clear show as pale outlines and can be taken again
// for the set, but only new ones pay shards. Classic ten-map runs have no relics.
import { C } from '../config.js';
import { world } from './world.js';
import { cx, cy, overlap } from './physics.js';
import { rect, px } from '../engine/gfx.js';
import { burst, callout, shake } from './fx.js';
import { sfx } from '../engine/audio.js';
import { dropShards } from './combat.js';
import { RELICS, RELIC_COUNT, RELIC_SHARDS, SET_SHARDS, relicSpots, roomRelicSpot } from '../data/relics.js';

// called by startZone once the easter egg and the secret room are placed
export function placeRelics() {
  world.relics = [];
  world.relicMask = 0;
  if (!world.level) return;
  const spots = relicSpots(world.map, world.secret && { x: world.secret.x + 5, y: world.secret.y + 10 });
  spots.forEach((s, i) => world.relics.push({ i, x: s.x, y: s.y, room: false, got: false, t: i * 0.7 }));
  const room = world.hidden?.room?.map;
  if (room) {
    const s = roomRelicSpot(room);
    world.relics.push({ i: RELIC_COUNT - 1, x: s.x, y: s.y, room: true, got: false, t: 0 });
  }
}
const owned = r => !!(world.relicsOwned & (1 << r.i));
const here = r => r.room === !!world.hidden?.inRoom;
export const relicsTaken = () => world.relics.filter(r => r.got).length;
// every relic this level has, counting the ones owned before this attempt
export const relicsAll = () => world.relics.filter(r => r.got || owned(r)).length;

export function updateRelics(dt) {
  const h = world.hero;
  if (!h || h.dead) return;
  for (const r of world.relics) {
    r.t += dt;
    if (r.got || !here(r)) continue;
    if (!overlap(h, { x: r.x - 5, y: r.y - 6, w: 10, h: 13 })) continue;
    r.got = true;
    const fresh = !owned(r), before = relicsAll() - 1;
    world.relicMask |= 1 << r.i;
    const n = relicsTaken();
    sfx.relic(n);
    burst(r.x, r.y, 14, 'twinkle', ['gold', 'cream', 'paper']);
    shake(0.15);
    callout(`RELIC ${n}/${RELIC_COUNT}`, 0, 0, C.gold, { follow: h, life: 70 });
    callout(RELICS[r.i].name, 240, 74, C.cream, { life: 90 });
    if (fresh) dropShards(cx(h), h.y, 3, RELIC_SHARDS(world.zone));
    if (relicsAll() === RELIC_COUNT && before < RELIC_COUNT) {
      // the fifth piece: the legendary weapon is whole again
      sfx.levelUp();
      callout('ALL FIVE RELICS!', 240, 60, C.gold, { big: true, life: 150 });
      burst(cx(h), cy(h), 26, 'twinkle', ['gold', 'cream', 'orange', 'paper']);
      if (world.relicsOwned !== (1 << RELIC_COUNT) - 1) dropShards(cx(h), h.y, 10, SET_SHARDS(world.zone));
    }
  }
}

// each relic is one gold piece of a weapon, drawn in pixels, bobbing with a glint
const SPR = {
  hilt: (x, y, a, b) => { rect(x + 3, y + 1, 2, 8, a); rect(x + 2, y + 9, 4, 2, b); px(x + 3, y + 2, C.paper); },
  guard: (x, y, a, b) => { rect(x, y + 4, 8, 2, a); rect(x + 3, y + 2, 2, 7, b); px(x + 1, y + 4, C.paper); },
  blade: (x, y, a, b) => { rect(x + 3, y, 2, 10, a); px(x + 4, y + 10, b); rect(x + 3, y + 1, 1, 7, C.paper); },
  pommel: (x, y, a, b) => { rect(x + 2, y + 3, 4, 4, a); rect(x + 3, y + 2, 2, 6, b); px(x + 3, y + 3, C.paper); },
  edge: (x, y, a, b) => { for (let i = 0; i < 7; i++) rect(x + i, y + 8 - i, 2, 2, i % 2 ? b : a); px(x + 5, y + 3, C.paper); }
};
export function drawRelics(t) {
  for (const r of world.relics) {
    if (r.got || !here(r)) continue;
    const x = Math.round(r.x - 4), y = Math.round(r.y - 5 + Math.sin(r.t * 3) * 1.5), mine = owned(r);
    rect(x - 1, y - 1, 10, 13, C.ink);
    rect(x, y, 8, 11, mine ? C.night : C.wine);
    SPR[RELICS[r.i].look](x, y, mine ? C.stone : C.gold, mine ? C.fog : C.orange);
    if (!mine && Math.floor(r.t * 4) % 6 === 0) px(x + 7, y - 2, C.paper);
  }
}
// the five pips on the HUD: gold for taken this attempt, outline for owned before, dark for missing
export function drawRelicPips(x, y) {
  if (!world.level || !world.relics.length) return;
  for (let i = 0; i < RELIC_COUNT; i++) {
    const got = world.relicMask & (1 << i), mine = world.relicsOwned & (1 << i), X0 = x + i * 7;
    rect(X0, y, 5, 7, C.ink);
    rect(X0 + 1, y + 1, 3, 5, got ? C.gold : mine ? C.stone : C.night);
    if (got) px(X0 + 1, y + 1, C.cream);
  }
}
