// XP, levels and HUD toasts.
import { world } from './world.js';
import { xpToLevel, LEVEL_XP } from '../data/curve.js';
import { heroMax } from './perks.js';
import { stats, MASTERY_TIERS } from '../data/meta.js';
import { sfx } from '../engine/audio.js';
import { burst } from './fx.js';
import { addProficiency, PROF_KILL_XP, PROF_WORLD, profRank } from '../data/proficiency.js';
import { temper } from '../data/temper.js';
import { mend } from './combat.js';

export function toast(kind, data) {
  world.toasts = world.toasts.filter(t => t.kind !== kind);
  world.toasts.push({ kind, ...data, t: kind === 'power' || kind === 'mastery' || kind === 'split' || (kind === 'card' && data.gold) ? 4.5 : kind === 'level' ? 2.2 : 2.8 });
}

export function gainXp(n) {
  const h = world.hero;
  if (!h) return;
  h.xp += n * (1 + stats().xp) * (world.level ? LEVEL_XP : 1) * temper(world.temper).xp;
  while (h.xp >= xpToLevel(h.lv)) {
    h.xp -= xpToLevel(h.lv);
    h.lv++;
    const before = h.maxHp;
    h.maxHp = heroMax(h.lv);
    h.hp = Math.min(h.maxHp, h.hp + (h.maxHp - before) + Math.round(h.maxHp * 0.25));
    mend(1); // a level-up mends a cracked weapon
    sfx.levelUp();
    burst(h.x + h.w / 2, h.y + 4, 12, 'twinkle', ['gold', 'cream', 'paper']);
    toast('level', { lv: h.lv });
  }
}

// a kill trains the weapon type in hand (kind: normal | elite | boss)
export function gainProficiency(kind = 'normal') {
  const h = world.hero;
  if (!h || !h.weapon) return;
  const type = h.weapon.type,
    up = addProficiency(type, (PROF_KILL_XP[kind] || 1) * (1 + stats().mastery) * (world.level ? 1 + PROF_WORLD * world.zone : 1));
  if (up) {
    sfx.levelUp();
    burst(h.x + h.w / 2, h.y + 4, 10, 'twinkle', ['sky', 'ice', 'paper']);
    toast('mastery', { type, lv: up, rank: profRank(up), perk: MASTERY_TIERS.includes(up) });
  }
}
