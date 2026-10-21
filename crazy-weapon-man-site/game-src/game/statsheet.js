// The stat sheet (MapleStory's stat window): every number behind the hero in one place, summed
// from the shard tree, trophies, gold Monster Book cards, boss pages and the held type's mastery
// perks (data/meta.js stats). Drawn in the inventory (R) and as the STATS tab of the POWERS window.
// A row that is still zero is drawn dim, so you can see what there is left to grow.
import { C, HERO } from '../config.js';
import { rect, text, fitText } from '../engine/gfx.js';
import { world } from './world.js';
import { dps, hitDamage, rarityName } from './loot.js';
import { stats, TREE, TROPHIES } from '../data/meta.js';
import { TYPES, ELEMENTS } from '../data/weapons.js';
import { proficiency, profRank } from '../data/proficiency.js';
import { fmt } from '../data/curve.js';
import { bookProgress } from '../data/book.js';
import { temper } from '../data/temper.js';

const pct = v => {
  const p = v * 100;
  return (p >= 0 ? '+' : '') + (Math.abs(p) < 1 && p ? p.toFixed(2) : Math.abs(p - Math.round(p)) < 0.05 ? Math.round(p) : p.toFixed(1)) + '%';
};
// innate abilities: the shard tree's and the trophies' names for them
const INNATE = {};
for (const n of TREE) if (n.innate) INNATE[n.innate] = n.name;
for (const r in TROPHIES) if (TROPHIES[r].innate) INNATE[TROPHIES[r].innate] ||= TROPHIES[r].perk;
INNATE.homing = 'SEEKER SHOTS';

// the groups of rows for a weapon in hand (or none, for the account-wide numbers): [label, value, live]
export function sheetRows(w = null) {
  const s = stats(w?.type || null), T = w && TYPES[w.type], h = world.hero;
  const row = (label, v, f = pct) => [label, f(v), !!v];
  const groups = [];
  if (w) {
    const p = proficiency(w.type);
    groups.push({
      name: 'WEAPON', col: C.gold, rows: [
        [fitText(w.name.toUpperCase(), 92), '', true],
        ['RARITY', (w.standout ? 'STANDOUT ' : '') + rarityName(w).toUpperCase(), true],
        ['DPS', fmt(dps(w)), true],
        ['ONE HIT', fmt(hitDamage(w)), true],
        ['STYLE', T.melee ? `MELEE ${T.reach}PX` : `RANGED ${T.speed}PX/S`, true],
        ['ELEMENT', w.family ? ELEMENTS[w.family].word.toUpperCase() : 'NONE', !!w.family],
        ['MASTERY', `LV ${p.lv} ${profRank(p.lv)}`, true]
      ]
    });
  }
  groups.push({
    name: 'OFFENSE', col: C.coral, rows: [
      row('DAMAGE', s.dmg), row('ATTACK SPEED', s.attackSpeed), row('CRIT CHANCE', s.crit), row('CRIT DAMAGE', s.critDmg), row('BOSS DAMAGE', s.bossDmg),
      row('SWARM DAMAGE', s.swarmDmg), row('EXECUTE', s.execute), row('IMPACT', s.impact), row('ECHO HITS', s.echo)
    ]
  });
  const els = Object.entries(s.infuse).map(([el, v]) => row(ELEMENTS[el].word.toUpperCase() + ' PROC', v));
  groups.push({
    name: 'AREA AND SHOTS', col: C.violet, rows: [
      row('SPLASH', s.splash), row('FINISHER WAVE', s.wave), row('KILL NOVA', s.nova), row('AREA SIZE', s.aoeSize), row('REACH', s.reach),
      row('SHOT SPEED', s.shotSpeed), row('TWIN SHOT', s.multishot), row('PIERCE', s.pierce, v => '+' + Math.round(v * 100)), ...els
    ]
  });
  groups.push({
    name: 'DEFENSE', col: C.lime, rows: [
      ...(h && !h.dead ? [['MAX HEALTH', fmt(h.maxHp), true]] : []),
      row('HEALTH', s.hp), row('ARMOR', s.armor), row('HEART HEALING', s.heal), row('REGEN /S', s.regen), row('SAFETY AFTER HIT', s.inv), row('HEART DROPS', s.hearts)
    ]
  });
  groups.push({
    name: 'MOBILITY', col: C.sky, rows: [
      ['RUN SPEED', `${Math.round(HERO.speed * (1 + s.speed))}PX/S`, !!s.speed], row('DASH COOLDOWN', -s.dashCd), row('SPECIAL COOLDOWN', -s.specialCd), row('KNOCKBACK', s.knock)
    ]
  });
  const T2 = world.temper ? temper(world.temper) : null;
  groups.push({
    name: 'LOOT AND GROWTH', col: C.cream, rows: [
      row('SHARDS', s.shards), row('BOSS SHARDS', s.bossShards), row('HERO XP', s.xp), row('MASTERY XP', s.mastery), row('STANDOUT DROPS', s.standout),
      row('WEAPON LUST', s.lust), row('SWARM COMBO', s.combo), ...(T2 ? [['TEMPER RARITY', '+' + T2.rarity, true]] : [])
    ]
  });
  const inn = [...s.innate].map(k => [INNATE[k] || k.toUpperCase(), 'ON', true]);
  if (s.homing) inn.push(['SEEKER SHOTS', 'ON', true]);
  const B = bookProgress();
  groups.push({ name: 'INNATE', col: C.pink, rows: inn.length ? inn : [['NONE YET', '', false]] });
  groups.push({ name: 'MONSTER BOOK', col: C.gold, rows: [['CARDS FOUND', `${B.found}/${B.cards}`, !!B.found], ['GOLD CARDS', `${B.gold}/${B.cards}`, !!B.gold], ['BOSS PAGES', `${B.pages}/${10}`, !!B.pages]] });
  return groups;
}

// flows the groups top to bottom into columns of colW inside the box
export function drawSheet(x, y, w, h, weapon) {
  const cols = Math.max(1, Math.floor(w / 150)), colW = Math.floor(w / cols), LH = 9;
  let c = 0, cy = y;
  for (const G of sheetRows(weapon)) {
    const need = 12 + G.rows.length * LH;
    if (cy + need > y + h && cy > y && c < cols - 1) (c++), (cy = y);
    const cx = x + c * colW;
    rect(cx, cy + 8, colW - 8, 1, G.col);
    text(G.name, cx, cy, G.col);
    cy += 12;
    for (const [label, val, live] of G.rows) {
      if (cy + LH > y + h + 2) break;
      text(label, cx + 2, cy, live ? C.mist : C.stone);
      if (val) text(val, cx + colW - 10, cy, live ? C.paper : C.stone, { align: 'right' });
      cy += LH;
    }
    cy += 4;
  }
}
