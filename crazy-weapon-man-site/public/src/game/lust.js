// Weapon Lust: Crazy Weapon Man craves new weapons. Equipping one he has never held on the map
// fills the meter and gives a short NEW TOY damage rush (numbers and damage in data/lust.js).
import { C } from '../config.js';
import { callout, burst } from './fx.js';
import { sfx } from '../engine/audio.js';
import { LUST } from '../data/lust.js';
import { stats } from '../data/meta.js';

export function lustBoost(h) {
  h.lust = Math.min(100, (h.lust || 0) + LUST.gain * (1 + stats().lust));
  h.newToyT = LUST.toyTime;
  callout(`NEW TOY! +${Math.round(LUST.toyBonus * 100)}% DMG`, 0, 0, C.pink, { follow: h, life: 60 });
  burst(h.x + h.w / 2, h.y + 6, 8, 'twinkle', ['pink', 'paper']);
  sfx.ui(true);
}
export function updateLust(h, dt) {
  if (!h) return;
  h.lust = Math.max(0, (h.lust || 0) - LUST.drain * dt);
  h.newToyT = Math.max(0, (h.newToyT || 0) - dt);
}
