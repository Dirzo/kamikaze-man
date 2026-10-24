// Easter eggs: one secret hidden on every map, tucked away at the far end of the map's highest
// ledge (never the arena). It is drawn small and only twinkles once you are close; touch it to
// claim it. Nothing about a map's layout changes: the secret is just placed on a surface that is
// already there. Which ones you have ever found is kept in localStorage.
import { C } from '../config.js';
import { world } from './world.js';
import { cx, cy, overlap } from './physics.js';
import { rect, px } from '../engine/gfx.js';
import { burst, callout, shake } from './fx.js';
import { sfx } from '../engine/audio.js';
import { say } from './bubbles.js';
import { makeWeapon } from './loot.js';
import { dropWeapon, dropShards, mend } from './combat.js';
import { gainXp } from './progress.js';
import { xpToLevel } from '../data/curve.js';
import { nameWeapon } from '../data/names.js';
import { ABILITIES } from '../data/abilities.js';

export const SECRET_KEY = 'crazyWeaponMan.secrets.v1';
// per zone: what's hidden, the shout when you find it, and the treat
export const SECRETS = [
  { look: 'stone', name: 'THE SWORD IN THE STONE', line: 'IT CAME OUT! NOBODY TELL THE KING' },
  { look: 'shroom', name: 'A SUSPICIOUSLY GOLDEN MUSHROOM', line: 'YOU FEEL TALLER. INSIDE.' },
  { look: 'pizza', name: 'A WARM PIZZA BOX', line: 'COWABUNGA, APPARENTLY' },
  { look: 'chest', name: 'AN UNATTENDED CHEST (NOT A MIMIC)', line: 'FINDERS KEEPERS' },
  { look: 'bell', name: 'THE SHRINE BELL', line: 'EVERYONE BOWS POLITELY' },
  { look: 'yeti', name: 'A VERY SMALL MEDITATING YETI', line: 'HE SHARES HIS WISDOM. AND SNACKS.' },
  { look: 'keys', name: "DAD'S LOST CAR KEYS", line: 'DAD: THERE THEY ARE! TAKE THIS, KIDDO' },
  { look: 'jar', name: "GRANDMA'S COOKIE JAR", line: 'GRANDMA SAYS HI. EAT SOMETHING.' },
  { look: 'scroll', name: 'A VERY SECRET SCROLL', line: 'IT SAYS: "DO NOT READ". YOU READ IT.' },
  { look: 'chicken', name: 'THE RUBBER CHICKEN', line: 'SQUEAK.' }
];

let store = null;
try { store = globalThis.localStorage || null; } catch (_) { store = null; }
export function foundSecrets() {
  try { const v = JSON.parse(store?.getItem(SECRET_KEY) || '[]'); return Array.isArray(v) ? v.filter(n => Number.isInteger(n) && n >= 0 && n < SECRETS.length) : []; } catch (_) { return []; }
}
function remember(z) {
  const all = new Set(foundSecrets());
  all.add(z);
  try { store?.setItem(SECRET_KEY, JSON.stringify([...all].sort((a, b) => a - b))); } catch (_) { /* blocked storage */ }
  return all.size;
}

// the spot: far end (away from its ladders) of the highest surface outside the arena
export function secretSpot(map) {
  const ps = map.platforms.filter(p => p.w >= 20 && p.x + p.w < map.bossLeft - 40 && !p.ceiling);
  if (!ps.length) return null;
  const top = ps.reduce((a, b) => (b.y < a.y || (b.y === a.y && b.x > a.x) ? b : a));
  const lads = map.ladders.filter(l => l.top === top.y && l.x >= top.x && l.x <= top.x + top.w);
  const mid = top.x + top.w / 2, ladX = lads.length ? lads.reduce((n, l) => n + l.x, 0) / lads.length : top.x;
  const x = ladX < mid ? top.x + top.w - 10 : top.x + 10;
  return { x: Math.round(x), y: top.y };
}
export function placeSecret(z) {
  const at = world.map && secretSpot(world.map);
  world.secret = at ? { zone: z, x: at.x - 5, y: at.y - 10, w: 10, h: 10, found: false, t: 0, ...SECRETS[z % SECRETS.length] } : null;
}

export function updateSecret(dt) {
  const s = world.secret, h = world.hero;
  if (!s || s.found || !h || h.dead || world.hidden?.inRoom) return;
  s.t += dt;
  if (!overlap(s, h)) return;
  s.found = true;
  world.secretsFound = (world.secretsFound || 0) + 1;
  const ever = remember(s.zone);
  sfx.levelUp();
  shake(0.3);
  burst(cx(s), cy(s), 18, 'twinkle', ['gold', 'cream', 'paper', 'pink']);
  callout('SECRET FOUND!', 240, 64, C.gold, { big: true, life: 120 });
  callout(`${s.name}  (${ever}/${SECRETS.length})`, 240, 84, C.cream, { life: 150 });
  say(h, s.line, 2.8, true);
  treat(s.zone, h);
  if (world.level?.secret?.length) callout('SECRET EXIT OPEN - FINISH THE LEVEL TO TAKE IT', 240, 100, C.pink, { life: 180 });
}

function gift(h, o, name) {
  const w = makeWeapon(world.zone, { standout: true, ...o });
  if (name) w.name = name + (ABILITIES[w.ability] ? ', ' + ABILITIES[w.ability].clause[0] : '');
  dropWeapon(cx(h) + h.face * 14, h.y, w);
  return w;
}
function treat(z, h) {
  const heal = f => mend(f); // (healing mends a cracked weapon: combat.js)
  switch (z) {
    case 0: gift(h, { type: 'sword', q: 1 }, 'Excalibur? (Just Some Guy\'s Sword)'); break;
    case 1: h.oneUp = true; heal(1); callout('1UP!', 0, 0, C.lime, { follow: h, life: 60 }); break; // a spare life
    case 2: heal(1); dropShards(cx(h), h.y, 15); break;
    case 3: dropShards(cx(h), h.y, 40); gift(h, { type: 'dagger' }); break;
    case 4: // the bell: everything nearby stops to bow
      for (const e of world.enemies) if (!e.dead && !e.boss && Math.abs(cx(e) - cx(h)) < 480) { e.stun = Math.max(e.stun || 0, 4); say(e, '*bows*', 1.6); }
      heal(0.5); gift(h, { type: 'katana' });
      break;
    case 5: gainXp(xpToLevel(h.lv) - h.xp); break; // a whole level
    case 6: gift(h, { type: 'hammer' }, "Dad's Spare Hammer (Don't Tell Mom)"); break;
    case 7: heal(1); for (let i = 0; i < 2; i++) world.pickups.push({ kind: 'heart', x: cx(h) - 3 + i * 10, y: h.y, vx: (i ? 30 : -30), vy: -120, life: 30 }); break;
    case 8: gift(h, { type: 'shuriken' }, 'Scroll-Folded Star of Very Secret Techniques'); break;
    case 9: { // the joke weapon of the whole game
      const w = gift(h, { type: 'hammer', q: 10 });
      w.name = 'THE RUBBER CHICKEN (A HAMMER) (SQUEAK)';
      w.quirk = 'honk';
      w.look = { ...nameWeapon('hammer', 10, null, true).look, what: 'THE RUBBER CHICKEN' };
      break;
    }
  }
}

const SPR = {
  stone: (x, y, t) => { rect(x, y + 6, 10, 4, C.stone); rect(x + 1, y + 5, 8, 1, C.fog); rect(x + 4, y, 2, 6, C.mist); rect(x + 3, y + 3, 4, 1, C.gold); },
  shroom: (x, y) => { rect(x + 1, y + 2, 8, 3, C.gold); rect(x + 2, y + 1, 6, 1, C.cream); rect(x + 4, y + 5, 2, 5, C.paper); px(x + 3, y + 3, C.paper); },
  pizza: (x, y) => { rect(x, y + 5, 10, 5, C.sand); rect(x, y + 5, 10, 1, C.wood); rect(x + 3, y + 7, 4, 1, C.red); },
  chest: (x, y) => { rect(x, y + 3, 10, 7, C.wood); rect(x, y + 3, 10, 2, C.woodD); rect(x + 4, y + 5, 2, 2, C.gold); },
  bell: (x, y) => { rect(x + 4, y, 2, 1, C.wood); rect(x + 2, y + 1, 6, 6, C.gold); rect(x + 1, y + 7, 8, 2, C.orange); px(x + 5, y + 9, C.ink); },
  yeti: (x, y, t) => { rect(x + 1, y + 2, 8, 8, C.paper); rect(x + 3, y + 4, 4, 2, C.ice); px(x + 3 + (Math.floor(t) % 2), y + 4, C.ink); px(x + 6, y + 4, C.ink); },
  keys: (x, y) => { rect(x + 1, y + 6, 3, 3, C.gold); px(x + 2, y + 7, C.ink); rect(x + 4, y + 7, 5, 1, C.gold); px(x + 7, y + 8, C.gold); px(x + 8, y + 8, C.gold); },
  jar: (x, y) => { rect(x + 2, y + 1, 6, 2, C.wood); rect(x + 1, y + 3, 8, 7, C.ice); rect(x + 3, y + 5, 2, 2, C.sand); rect(x + 5, y + 7, 2, 2, C.sand); },
  scroll: (x, y) => { rect(x, y + 5, 10, 4, C.cream); rect(x, y + 4, 2, 6, C.sand); rect(x + 8, y + 4, 2, 6, C.sand); rect(x + 3, y + 6, 4, 1, C.red); },
  chicken: (x, y) => { rect(x + 2, y + 3, 6, 6, C.gold); rect(x + 6, y + 1, 3, 3, C.gold); px(x + 9, y + 2, C.orange); px(x + 7, y + 2, C.ink); rect(x + 3, y + 9, 1, 1, C.orange); rect(x + 6, y + 9, 1, 1, C.orange); }
};
export function drawSecret(t) {
  const s = world.secret, h = world.hero;
  if (!s || s.found || world.hidden?.inRoom) return;
  const x = Math.round(s.x), y = Math.round(s.y);
  SPR[s.look]?.(x, y, t);
  // a faint twinkle, only when you are near enough to wonder about it
  if (h && Math.hypot(cx(h) - cx(s), cy(h) - cy(s)) < 110 && Math.floor(t * 3) % 4 === 0) {
    const k = Math.floor(t * 9) % 3;
    px(x - 2 + k * 6, y - 3 + (k % 2) * 2, C.paper);
  }
}
