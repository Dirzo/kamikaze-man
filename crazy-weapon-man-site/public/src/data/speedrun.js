// Speedrun records: the clock format and personal bests (full clear time and per-zone splits),
// kept across runs in localStorage. Pure data, safe to import from node tests.
export const RUN_KEY = 'crazyWeaponMan.speedrun.v1';

// 83.456 -> "1:23.45"; an hour or more -> "1:02:03.45"
export function clock(sec) {
  const s = Math.max(0, Number(sec) || 0),
    cs = Math.floor((s * 100) % 100),
    whole = Math.floor(s),
    h = Math.floor(whole / 3600),
    m = Math.floor((whole % 3600) / 60),
    ss = whole % 60;
  const two = n => String(n).padStart(2, '0');
  return (h ? `${h}:${two(m)}` : String(m)) + `:${two(ss)}.${two(cs)}`;
}
// signed difference against a best: "-0:04.20" (ahead) or "+0:01.05" (behind)
export const delta = (t, best) => (best == null ? '' : (t <= best ? '-' : '+') + clock(Math.abs(t - best)));
// the same, short: "-4.20", "+1:05.30"
export const shortDelta = (t, best) => delta(t, best).replace(/^([+-])0:0?/, '$1');

let storage = null;
try {
  storage = globalThis.localStorage || null;
} catch (_) {
  storage = null;
}
let store = null;
function load() {
  try {
    const raw = storage && JSON.parse(storage.getItem(RUN_KEY) || 'null');
    if (raw && typeof raw === 'object') return { best: Number(raw.best) || null, splits: Array.isArray(raw.splits) ? raw.splits.map(n => Number(n) || null) : [] };
  } catch (_) {
    /* corrupt save: start fresh */
  }
  return { best: null, splits: [] };
}
const save = () => {
  try {
    storage?.setItem(RUN_KEY, JSON.stringify(store));
  } catch (_) {
    /* storage full or blocked */
  }
};
export const records = () => (store ||= load());

// a zone took `t` seconds of this run; returns the previous best for that zone
export function recordSplit(zone, t) {
  const r = records(),
    prev = r.splits[zone] ?? null;
  if (prev == null || t < prev) {
    r.splits[zone] = t;
    save();
  }
  return prev;
}
// a full clear in `t` seconds; returns the previous best
export function recordClear(t) {
  const r = records(),
    prev = r.best;
  if (prev == null || t < prev) {
    r.best = t;
    save();
  }
  return prev;
}
export function resetRecords() {
  store = { best: null, splits: [] };
  save();
}
