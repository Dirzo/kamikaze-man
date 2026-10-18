// The Forge: between zones, spend shards. Patch up (full heal) or Reforge (current weapon +1
// rarity, re-named, and tuned to the next zone so a favourite stays useful).
import { C, W } from '../config.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { text, panel, fitText, dither } from '../engine/gfx.js';
import { world } from './world.js';
import { nameWeapon } from '../data/names.js';
import { rarityColour } from './looks.js';
import { toast } from './progress.js';
import { dps } from './loot.js';

let uidBase = 100000;
export function openForge() {
  world.forge = { sel: 0, msg: '', t: 0 };
}
const costs = () => ({ heal: 8 + world.zone * 4, reforge: 20 + world.zone * 8 });

// returns true when the player chose to continue
export function updateForge(dt) {
  const F = world.forge;
  if (!F) return true;
  F.t += dt;
  const h = world.hero,
    c = costs();
  const opts = ['heal', 'reforge', 'go'];
  if (input.take('up') || input.take('left')) {
    F.sel = (F.sel + opts.length - 1) % opts.length;
    sfx.ui();
  }
  if (input.take('down') || input.take('right')) {
    F.sel = (F.sel + 1) % opts.length;
    sfx.ui();
  }
  const pick = input.take('attack') | input.take('confirm'); // consume both (Z is in both sets)
  if (F.t > 0.4 && pick) {
    const o = opts[F.sel];
    if (o === 'go') {
      world.forge = null;
      return true;
    }
    if (o === 'heal') {
      if (h.hp >= h.maxHp) F.msg = 'ALREADY FULL';
      else if (world.shards < c.heal) F.msg = 'NOT ENOUGH SHARDS';
      else {
        world.shards -= c.heal;
        h.hp = h.maxHp;
        F.msg = 'GOOD AS NEW (MOSTLY)';
        sfx.ui(true);
      }
    }
    if (o === 'reforge') {
      const w = h.weapon;
      if (w.q >= 10) F.msg = 'IT CANNOT GET MORE ABSURD';
      else if (world.shards < c.reforge) F.msg = 'NOT ENOUGH SHARDS';
      else {
        world.shards -= c.reforge;
        const before = dps(w);
        const q = w.q + 1;
        const { name, look } = nameWeapon(w.type, q, w.family, w.standout);
        h.weapon = { ...w, uid: uidBase++, q, name, look, home: Math.min(9, world.zone + 1) };
        toast('weapon', { name, col: rarityColour(q), gain: Math.round((dps(h.weapon) / before - 1) * 100), standout: w.standout });
        F.msg = 'REFORGED';
        sfx.levelUp();
      }
    }
  }
  if (input.take('jump')) {
    world.forge = null;
    return true;
  }
  return false;
}

export function drawForge(t) {
  const F = world.forge;
  if (!F) return;
  const h = world.hero,
    c = costs();
  dither(0, 0, W, 240, C.ink, 9);
  panel('panel', W / 2 - 150, 40, 300, 164);
  text('THE FORGE', W / 2, 52, C.gold, { align: 'center', k: 2 });
  text(`SHARDS: ${world.shards}`, W / 2, 72, C.ice, { align: 'center' });
  const rows = [
    ['PATCH UP', `FULL HEAL   ${c.heal} SHARDS`],
    ['REFORGE', `+1 RARITY, NEXT-ZONE READY   ${c.reforge} SHARDS`],
    ['CONTINUE', 'ON TO THE NEXT ZONE']
  ];
  rows.forEach(([a, b], i) => {
    const y = 90 + i * 24,
      on = F.sel === i;
    if (on) panel('btn-hot', W / 2 - 140, y - 4, 280, 20);
    text(a, W / 2 - 130, y + 2, on ? C.gold : C.paper);
    text(fitText(b, 180), W / 2 + 132, y + 2, on ? C.cream : C.mist, { align: 'right' });
  });
  text('CURRENT WEAPON', W / 2, 166, C.mist, { align: 'center' });
  text(fitText(h.weapon.name, 280), W / 2, 176, h.weapon.standout ? C.gold : rarityColour(h.weapon.q), { align: 'center' });
  if (F.msg) text(F.msg, W / 2, 190, C.lime, { align: 'center' });
}
