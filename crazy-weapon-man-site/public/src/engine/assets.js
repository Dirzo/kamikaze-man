// Loads the pixel-art manifests and every image they list. All sprites are palette-exact PNGs.
import { PX_ASSETS, NEXT_ASSETS } from '../config.js';

export const A = {
  man: null, // shared manifest (/assets/px/manifest.json)
  next: null, // new-game manifest
  hero: null, // { im, w, h, frames: {name: index}, shoulders, arms: { im, list } }
  enemies: {}, // type -> { im, w, h }  (3 frames: walk1, walk2, hit)
  bosses: {}, // kind -> { im, w, h, frames }
  mounts: {}, // name -> { im, w, h, n }  (wargoose: walk1, walk2, flap, hit; egg: whole, cracked, hatching)
  weapons: {}, // key -> { im, w, h, gx, gy }   (key 'sword' or 'sword-longsword')
  bg: {}, // zone id -> image
  slabs: {}, // zone id -> { im, w, h, cap }
  ui: {}, // frame name -> { im, slice, size }
  glyphs: null,
  palette: null
};

const img = src =>
  new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('image ' + src));
    i.src = src;
  });

export async function loadAssets(onProgress = () => {}) {
  const [man, next] = await Promise.all([
    fetch(PX_ASSETS + 'manifest.json').then(r => r.json()),
    fetch(NEXT_ASSETS + 'next.json').then(r => r.json())
  ]);
  A.man = man;
  A.next = next;
  A.glyphs = man.glyphs;
  A.palette = man.palette;
  const jobs = [];
  const add = p => jobs.push(p);
  add(
    img(NEXT_ASSETS + 'hero.png').then(im => {
      const h = next.hero;
      A.hero = { ...A.hero, im, w: h.w, h: h.h, frames: Object.fromEntries(h.frames.map((f, i) => [f, i])), shoulders: h.shoulders };
    })
  );
  add(img(NEXT_ASSETS + 'arms.png').then(im => (A.hero = { ...A.hero, arms: { im, list: next.hero.arms } })));
  for (const [type, info] of Object.entries(man.enemies)) add(img(PX_ASSETS + `enemy-${type}.png`).then(im => (A.enemies[type] = { im, ...info })));
  for (const [kind, info] of Object.entries(man.bosses)) add(img(PX_ASSETS + `boss-${kind}.png`).then(im => (A.bosses[kind] = { im, ...info })));
  for (const [name, info] of Object.entries(man.mounts || {})) add(img(PX_ASSETS + `mount-${name}.png`).then(im => (A.mounts[name] = { im, ...info })));
  for (const [key, info] of Object.entries(man.weapons)) add(img(PX_ASSETS + `weapon-${key}.png`).then(im => (A.weapons[key] = { im, ...info })));
  for (const [zone, file] of Object.entries(man.backgrounds)) add(img(PX_ASSETS + file).then(im => (A.bg[zone] = im)));
  for (const [zone, info] of Object.entries(man.slabs)) add(img(PX_ASSETS + info.file).then(im => (A.slabs[zone] = { im, ...info })));
  for (const [name, info] of Object.entries(man.ui || {})) add(img(PX_ASSETS + `ui/${name}.png`).then(im => (A.ui[name] = { im, ...info })));
  let done = 0;
  await Promise.all(jobs.map(p => p.then(() => onProgress(++done / jobs.length))));
  return A;
}
