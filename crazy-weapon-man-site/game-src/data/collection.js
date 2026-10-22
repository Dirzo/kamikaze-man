// The Collection (Super Mario World's exit count, with everything else there is to find): for each
// world, what it holds and how much of it you have, and the whole game's completion as a percent.
// Counted: levels cleared, secret exits taken, weapon relics (five make a level's star), the
// world's easter egg, its family head's trophy and its Monster Book boss page. Pure data, safe to
// import from tests: the easter eggs come in as a list of zones (game/secrets.js foundSecrets).
import { REGIONS, LEVELS } from './overworld.js';
import { RELIC_COUNT, relicCount, allRelics } from './relics.js';
import { hasTrophy } from './meta.js';
import { PAGES, pageDone } from './book.js';

const LEVELS_OF = Object.fromEntries(REGIONS.map(R => [R.id, LEVELS.filter(n => n.region === R.id)]));
const hasSecretExit = n => n.secret.length > 0;
export const secretTaken = (save, n) => !!save?.cleared?.[n.id]?.includes('secret');

// one world: each entry is [have, of]
export function worldRow(save, R, eggs = []) {
  const lv = LEVELS_OF[R.id], sec = lv.filter(hasSecretExit), page = PAGES.find(P => P.region === R.id);
  return {
    id: R.id, zone: R.zone, name: R.name,
    levels: [lv.filter(n => save?.cleared?.[n.id]).length, lv.length],
    exits: [sec.filter(n => secretTaken(save, n)).length, sec.length],
    relics: [lv.reduce((s, n) => s + relicCount(save, n.id), 0), lv.length * RELIC_COUNT],
    stars: [lv.filter(n => allRelics(save, n.id)).length, lv.length],
    egg: [eggs.includes(R.zone) ? 1 : 0, 1],
    trophy: [hasTrophy(R.id) ? 1 : 0, 1],
    page: [page && pageDone(page) ? 1 : 0, 1]
  };
}
// a relic is a fifth of a star, so a level's five count as much as clearing it
const PARTS = ['levels', 'exits', 'egg', 'trophy', 'page'];
const score = row => {
  let have = row.relics[0] / RELIC_COUNT, of = row.relics[1] / RELIC_COUNT;
  for (const k of PARTS) (have += row[k][0]), (of += row[k][1]);
  return [have, of];
};
export const pct = ([have, of]) => (of ? Math.floor((100 * have) / of) : 0);
export const rowPct = row => pct(score(row));

export function collection(save, eggs = []) {
  const rows = REGIONS.map(R => worldRow(save, R, eggs));
  const total = { id: 0, name: 'ALL WORLDS' };
  for (const k of [...PARTS, 'relics', 'stars']) total[k] = rows.reduce((s, r) => [s[0] + r[k][0], s[1] + r[k][1]], [0, 0]);
  const S = rows.map(score).reduce((s, x) => [s[0] + x[0], s[1] + x[1]], [0, 0]);
  return { rows, total, pct: pct(S) };
}

// what is still out there in a world, for the tracker's detail line: levels you have cleared whose
// secret exit you haven't taken (unvisited levels stay a surprise), and levels short of five relics
export function missing(save, R) {
  const lv = LEVELS_OF[R.id];
  return {
    exits: lv.filter(n => hasSecretExit(n) && save?.cleared?.[n.id] && !secretTaken(save, n)),
    hiddenExits: lv.filter(n => hasSecretExit(n) && !save?.cleared?.[n.id]).length,
    relics: lv.filter(n => !allRelics(save, n.id)).map(n => ({ n, got: relicCount(save, n.id) }))
  };
}
