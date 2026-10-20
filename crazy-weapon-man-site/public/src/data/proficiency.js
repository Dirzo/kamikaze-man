// Weapon proficiency: every weapon type has its own mastery level, earned by killing with it and
// kept across runs in localStorage. Each level adds a little damage to that type. Mastery is a
// long road (level 100, ~10,000 kills); its perk choices along the way live in meta.js.
import { TYPE_LIST } from './weapons.js';

export const PROF_KEY = 'crazyWeaponMan.proficiency.v1';
export const PROF_MAX = 100;
export const PROF_DMG = 0.003; // +0.3% damage per level, +30% at grandmastery
export const PROF_KILL_XP = { normal: 1, elite: 4, boss: 25 };
// kills to go from level n to n+1: 6, 8, 10 ... (about 10,500 kills to grandmaster a type)
export const profToNext = lv => 6 + lv * 2;
const RANKS = ['NOVICE', 'APPRENTICE', 'ADEPT', 'EXPERT', 'MASTER'];
export const profRank = lv => (lv >= PROF_MAX ? 'GRANDMASTER' : RANKS[Math.min(RANKS.length - 1, Math.floor(lv / 20))]);

const blank = () => Object.fromEntries(TYPE_LIST.map(t => [t, { lv: 0, xp: 0, kills: 0 }]));
let store = null;
let storage = null;
try {
  storage = globalThis.localStorage || null;
} catch (_) {
  storage = null; // blocked storage: proficiency still works for this session
}

function load() {
  const out = blank();
  try {
    const raw = storage && JSON.parse(storage.getItem(PROF_KEY) || 'null');
    if (raw && typeof raw === 'object')
      for (const t of TYPE_LIST) {
        const p = raw[t];
        if (!p) continue;
        out[t].lv = Math.max(0, Math.min(PROF_MAX, Math.floor(Number(p.lv) || 0)));
        out[t].xp = Math.max(0, Math.floor(Number(p.xp) || 0));
        out[t].kills = Math.max(0, Math.floor(Number(p.kills) || 0));
      }
  } catch (_) {
    /* corrupt save: start fresh */
  }
  return out;
}
function save() {
  try {
    storage?.setItem(PROF_KEY, JSON.stringify(store));
  } catch (_) {
    /* storage full or blocked */
  }
}
export function proficiency(type) {
  store ||= load();
  return store[type] || { lv: 0, xp: 0, kills: 0 };
}
export const profMult = type => 1 + proficiency(type).lv * PROF_DMG;

// returns the new level when this gain levelled the type up, else 0
export function addProficiency(type, xp, kills = 1) {
  const p = proficiency(type);
  if (!store[type]) return 0;
  p.kills += kills;
  let up = 0;
  if (p.lv < PROF_MAX) {
    p.xp += xp;
    while (p.lv < PROF_MAX && p.xp >= profToNext(p.lv)) {
      p.xp -= profToNext(p.lv);
      p.lv++;
      up = p.lv;
    }
    if (p.lv >= PROF_MAX) p.xp = 0;
  }
  save();
  return up;
}
// forget the cached copy (the save files menu just swapped what is in storage)
export function reloadProficiency() {
  store = null;
}
export function resetProficiency() {
  store = blank();
  save();
}
