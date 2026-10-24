// The level-clear grade (Sonic's tally): how fast you were against the stage's par time, how much
// of it you finished (residents beaten, relics taken, the secret found) and how clean the run was
// (hits taken, falls into pits, the longest combo). Pure, node-testable.
//   S  a truly awesome run: well under par, nearly everything done, barely touched
//   A  a good run           B  an average one          C  below average
//   D  you messed up        F  you really messed up
export const GRADES = [
  { g: 'S', at: 0.9, col: 'gold', word: 'LEGENDARY' },
  { g: 'A', at: 0.76, col: 'lime', word: 'RAZOR SHARP' },
  { g: 'B', at: 0.6, col: 'sky', word: 'BATTLE READY' },
  { g: 'C', at: 0.46, col: 'cream', word: 'A BIT DULL' },
  { g: 'D', at: 0.2, col: 'orange', word: 'BENT BLADE' },
  { g: 'F', at: -Infinity, col: 'coral', word: 'SHATTERED' }
];
// par: a run through the stage at about two thirds of top run speed (Sonic pace, data/feel.js), a moment per resident and time for
// the boss (tuned on the campaign bot, which clears most levels in about 80% of par).
export const PAR = { speed: 175, perResident: 0.8, boss: 22, perWall: 1.5 }; // perWall: smashing a breakable wall (game/walls.js)
export function parTime(width, residents, walls = 0) {
  return Math.round(width / PAR.speed + residents * PAR.perResident + walls * PAR.perWall + PAR.boss);
}
// completion: residents count most; relics and the secret make up the rest (a level without a
// secret or relics gives their share to the residents)
export function completion({ kills = 0, residents = 0, relics = 0, relicMax = 0, secret = false, hasSecret = false }) {
  let w = 1, c = 0;
  const part = (share, frac) => ((w -= share), (c += share * frac));
  if (relicMax) part(0.2, Math.min(1, relics / relicMax));
  if (hasSecret) part(0.1, secret ? 1 : 0);
  c += w * (residents ? Math.min(1, kills / residents) : 1);
  return Math.max(0, Math.min(1, c));
}
// time score: `fast` of par or quicker is full marks, par itself is `atPar`, twice par is nothing
export const TIME = { fast: 0.6, atPar: 0.6 };
export function timeScore(t, par) {
  const r = t / Math.max(1, par);
  if (r <= TIME.fast) return 1;
  if (r <= 1) return 1 - ((r - TIME.fast) / (1 - TIME.fast)) * (1 - TIME.atPar);
  return Math.max(0, TIME.atPar * (2 - r));
}
// style: every hit taken and every fall costs a little (a pit costs more), a flawless run and a
// long combo (combat.js field combo) earn a little back
export const STYLE = { hit: 0.008, fall: 0.04, most: 0.2, flawless: 0.05, combo: 25, comboBonus: 0.03 };
export function stylePoints({ hits = 0, falls = 0, combo = 0 } = {}) {
  const cost = Math.min(STYLE.most, hits * STYLE.hit + falls * STYLE.fall);
  return (hits + falls === 0 ? STYLE.flawless : 0) + (combo >= STYLE.combo ? STYLE.comboBonus : 0) - cost;
}
export function gradeOf({ t, par, done, hits = 0, falls = 0, combo = 0 }) {
  const style = stylePoints({ hits, falls, combo }), score = Math.max(0, Math.min(1, 0.5 * timeScore(t, par) + 0.5 * done + style));
  return { ...GRADES.find(G => score >= G.at), score, style };
}
