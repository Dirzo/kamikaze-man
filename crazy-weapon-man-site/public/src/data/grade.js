// The level-clear grade (Sonic's tally): how fast you were against the stage's par time and how
// much of it you finished (residents beaten, relics taken, the secret found). Pure, node-testable.

export const GRADES = [
  { g: 'S', at: 0.9, col: 'gold', word: 'SUPREME' },
  { g: 'A', at: 0.78, col: 'lime', word: 'AWESOME' },
  { g: 'B', at: 0.62, col: 'sky', word: 'BRAVO' },
  { g: 'C', at: 0.45, col: 'cream', word: 'COOL' },
  { g: 'D', at: 0, col: 'coral', word: 'DONE IT' }
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
// time score: at or under par is full marks, twice par is nothing
export const timeScore = (t, par) => Math.max(0, Math.min(1, 2 - t / Math.max(1, par)));
export function gradeOf({ t, par, done }) {
  const score = 0.5 * timeScore(t, par) + 0.5 * done;
  return { ...GRADES.find(G => score >= G.at), score };
}
