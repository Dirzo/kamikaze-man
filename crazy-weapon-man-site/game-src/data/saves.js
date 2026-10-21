// Three save files. Each one is a whole game: the overworld map (with its relics and temper), the
// shard tree, trophies and mastery perks, weapon mastery, the Monster Book and the easter eggs found. The live localStorage keys always hold
// the file being played (so file 1 is any save from before files existed); the other two wait in
// FILES_KEY. Choosing a file stashes the live keys and puts that file's back. Everything saves on
// its own as you play, so the menu is for picking, starting and erasing files. Pure data, safe to
// import from node tests.
import { OVERWORLD_KEY, NODES, newSave, progress } from './overworld.js';
import { META_KEY, reloadMeta } from './meta.js';
import { PROF_KEY, reloadProficiency } from './proficiency.js';
import { BOOK_KEY, reloadBook } from './book.js';

export const FILES_KEY = 'crazyWeaponMan.files.v1';
export const FILE_COUNT = 3;
// (the secrets key is game/secrets.js's SECRET_KEY, which can't be imported here: it draws)
export const FILE_KEYS = [OVERWORLD_KEY, META_KEY, PROF_KEY, 'crazyWeaponMan.secrets.v1', BOOK_KEY];

let storage = null;
try {
  storage = globalThis.localStorage || null;
} catch (_) {
  storage = null;
}
const get = k => {
  try {
    return storage?.getItem(k) ?? null;
  } catch (_) {
    return null;
  }
};
const put = (k, v) => {
  try {
    v == null ? storage?.removeItem(k) : storage?.setItem(k, v);
  } catch (_) {
    /* storage full or blocked: the file lives for this tab */
  }
};
function index() {
  const out = { v: 1, active: 0, stash: Array(FILE_COUNT).fill(null), played: Array(FILE_COUNT).fill(0) };
  try {
    const raw = JSON.parse(get(FILES_KEY) || 'null');
    if (raw && raw.v === 1) {
      out.active = Math.max(0, Math.min(FILE_COUNT - 1, Math.floor(+raw.active || 0)));
      for (let i = 0; i < FILE_COUNT; i++) {
        if (raw.stash?.[i] && typeof raw.stash[i] === 'object') out.stash[i] = raw.stash[i];
        out.played[i] = +raw.played?.[i] || 0;
      }
    }
  } catch (_) {
    /* a broken index: file 1 is still whatever is live */
  }
  out.stash[out.active] = null; // the active file lives in the live keys
  return out;
}
const writeIndex = ix => put(FILES_KEY, JSON.stringify(ix));
const live = () => Object.fromEntries(FILE_KEYS.map(k => [k, get(k)]));
const reload = () => (reloadMeta(), reloadProficiency(), reloadBook());

export const activeFile = () => index().active;
const blobs = (ix, i) => (i === ix.active ? live() : ix.stash[i] || {});
const parse = s => {
  try {
    return JSON.parse(s || 'null');
  } catch (_) {
    return null;
  }
};

// what the menu shows for a file, or null for an empty one
export function fileSummary(i) {
  const ix = index(), b = blobs(ix, i);
  const ow = parse(b[OVERWORLD_KEY]), me = parse(b[META_KEY]), pr = parse(b[PROF_KEY]);
  const map = ow && ow.v === 1 && ow.cleared ? ow : null;
  const cleared = map ? progress(map).cleared : 0;
  if (!cleared && !(me?.earned > 0) && !map?.hero) return null;
  const at = map && NODES[map.at];
  return {
    cleared,
    total: progress(newSave()).total,
    world: at ? at.region || 1 : 1,
    place: at ? at.name : '',
    lv: map?.hero?.lv || 1,
    shards: Math.floor(+me?.shards || 0),
    trophies: Object.keys(me?.trophies || {}).length,
    mastery: pr && typeof pr === 'object' ? Object.values(pr).reduce((s, p) => s + (Math.floor(+p?.lv) || 0), 0) : 0,
    played: ix.played[i]
  };
}

// play file i from now on: the live keys become its save
export function useFile(i) {
  const ix = index();
  if (i < 0 || i >= FILE_COUNT) return false;
  if (i !== ix.active) {
    ix.stash[ix.active] = live();
    for (const k of FILE_KEYS) put(k, ix.stash[i]?.[k] ?? null);
    ix.stash[i] = null;
    ix.active = i;
  }
  ix.played[i] = Date.now();
  writeIndex(ix);
  reload();
  return true;
}
// wipe file i for good
export function eraseFile(i) {
  const ix = index();
  if (i === ix.active) {
    for (const k of FILE_KEYS) put(k, null);
    reload();
  } else ix.stash[i] = null;
  ix.played[i] = 0;
  writeIndex(ix);
}
