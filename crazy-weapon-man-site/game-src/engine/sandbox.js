// The trailer (?trailer) plays with a throwaway save: localStorage is swapped for an in-memory
// store before any module reads it, so the scripted shots can never touch a player's files.
// Imported first by main.js; does nothing on a normal visit.
if (typeof location !== 'undefined' && /[?&]trailer\b/.test(location.search)) {
  const mem = new Map();
  const S = Storage.prototype;
  S.getItem = function (k) { return mem.has(String(k)) ? mem.get(String(k)) : null; };
  S.setItem = function (k, v) { mem.set(String(k), String(v)); };
  S.removeItem = function (k) { mem.delete(String(k)); };
  S.clear = function () { mem.clear(); };
  S.key = function (i) { return [...mem.keys()][i] ?? null; };
  try { Object.defineProperty(S, 'length', { configurable: true, get: () => mem.size }); } catch (_) { /* length is only informational */ }
}
