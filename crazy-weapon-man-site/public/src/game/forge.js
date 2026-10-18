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
import { dps, makeWeapon } from './loot.js';
import { equip, drawItem } from './drops.js';
import { maxRarity, mutationLabel, MUTATIONS, availableTypes } from '../data/progression.js';

let uidBase = 100000;
export function openForge() {
  const zone = Math.min(9, world.zone + 1);
  // A free choice between three next-zone weapons, followed by the shard workshop.
  const types = availableTypes(zone).filter(t => t !== world.hero.weapon.type);
  const picks = [world.hero.weapon.type];
  while (picks.length < 3) picks.push(types.splice(Math.floor(Math.random() * types.length), 1)[0]);
  world.forge = { sel: 0, msg: '', t: 0, draft: true, offers: picks.map(type => makeWeapon(zone, { q: maxRarity(world.zone), type, standout: false })) };
}
const costs = () => ({ heal: 8 + world.zone * 4, reforge: 20 + world.zone * 8 });

// returns true when the player chose to continue
export function updateForge(dt) {
  const F = world.forge;
  if (!F) return true;
  F.t += dt;
  if (F.draft) return updateDraft(F);
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
      if (w.q >= maxRarity(world.zone + 1) && w.home >= Math.min(9, world.zone + 1)) F.msg = "AT THIS ZONE'S LIMIT";
      else if (world.shards < c.reforge) F.msg = 'NOT ENOUGH SHARDS';
      else {
        world.shards -= c.reforge;
        const before = dps(w);
        const q = Math.min(maxRarity(world.zone + 1), w.q + 1);
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
  if (F.draft) return drawDraft(F, t);
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

function updateDraft(F) {
  if (input.take('left') || input.take('up')) F.sel = (F.sel + 2) % 3;
  if (input.take('right') || input.take('down')) F.sel = (F.sel + 1) % 3;
  if (F.t > 0.35 && (input.take('confirm') | input.take('attack'))) {
    equip(F.offers[F.sel]);
    F.draft = false; F.sel = 0; F.t = 0;
  }
  return false;
}
function drawDraft(F, t) {
  dither(0, 0, W, 242, C.ink, 13);
  text('PICK YOUR NEXT BAD IDEA', W / 2, 46, C.gold, { align: 'center', k: 2 });
  text('ONE FREE WEAPON. CHOOSE YOUR BUILD.', W / 2, 68, C.mist, { align: 'center' });
  F.offers.forEach((w, i) => {
    const x = 12 + i * 156, on = F.sel === i;
    panel(on ? 'btn-hot' : 'panel', x, 86, 144, 110);
    drawItem(w, x + 72, 126, t);
    text(fitText(w.name, 130), x + 72, 139, rarityColour(w.q), { align: 'center' });
    text(Math.round(dps(w)) + ' DPS', x + 72, 155, C.paper, { align: 'center' });
    text(mutationLabel(w), x + 72, 171, C.lime, { align: 'center' });
    if (on) text('> TAKE THIS <', x + 72, 183, C.gold, { align: 'center' });
  });
  const chosen = F.offers[F.sel];
  text(chosen.mutation ? MUTATIONS[chosen.mutation].desc : 'KEEP MOVING. WATCH WIND-UPS. COUNTERATTACK.', W / 2, 202, C.mist, {align:'center'});
  text('LEFT / RIGHT: CHOOSE    ATTACK: TAKE', W / 2, 214, C.paper, { align: 'center' });
}
