// The trailer (?trailer): a cinematic attract mode the game plays by itself. A director cuts
// between scripted shots of the real game (the overworld globe, levels, the shard tree, the Beast
// Den, the castle heads) with letterbox bars, captions and chapter cards drawn over the top. The bot
// from testing/playtest.js does the fighting, a little runner does the sprinting, and the hero cannot
// die except on the one shot where he is supposed to.
//   ?trailer           press any key to start; any key during it leaves for the game
//   ?trailer&record    starts at once and records itself (canvas + game audio) to a .webm download;
//                      tools/record-trailer.mjs drives this and turns it into the MP4
// Opens with the Noobscrub Games janitor skit (vendor/noobscrub-splash.js, from the studio site).
// The save is a throwaway (engine/sandbox.js), so nothing here touches a player's files.
import { W, H, C, STEP } from '../config.js';
import { X, rect, text, textWidth, dither, canvas } from '../engine/gfx.js';
import { music, audioOn, audioTap, audioSettings, toggleSound, sfx } from '../engine/audio.js';
import { world, cinema } from './world.js';
import { closePowers, P as powers } from './powers.js';
import { closeInventory, anvil } from './inventory.js';
import { ZONES, TITLE_MUSIC, MAP_MUSIC } from '../data/zones.js';
import { NODES, REGIONS, LEVELS, newSave, revealAll } from '../data/overworld.js';
import { keepRelics } from '../data/relics.js';
import { makeWeapon } from './loot.js';
import { updateCamera } from './camera.js';
import { startSurvival } from './waves.js';
import { hurtHero } from './combat.js';
import { cx } from './physics.js';
import { D as den } from './den.js';
import { captureScene } from '../testing/capture.js';
import { pilot as botPilot } from '../testing/playtest.js';

const Q = new URLSearchParams(location.search);
const RECORD = Q.has('record');
const BAR = 30; // letterbox: 480x210 inside 480x270, about 2.3:1

// ---------------------------------------------------------------- keys
// the same synthetic key presses the playtest bot uses, so the game reads them like a player's
const CODES = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', jump: 'KeyX', attack: 'KeyZ', special: 'KeyC', dash: 'KeyV' };
const held = new Set();
function press(want) {
  for (const k of Object.keys(CODES)) {
    const on = want.has(k);
    if (on === held.has(k)) continue;
    window.dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { code: CODES[k], bubbles: true }));
    on ? held.add(k) : held.delete(k);
  }
}

// ---------------------------------------------------------------- setting up shots
let G = null, SAVE = null;
const save = () => (SAVE ||= revealAll(newSave()));
// the hero, kitted out for the camera: a high level, a standout weapon, and (unless the shot says
// otherwise) more health than anything here can take off him
function suitUp(z, type, q = 9) {
  const h = world.hero;
  h.lv = 24 + z * 3;
  h.maxHp = h.hp = 1e5;
  h.weapon = makeWeapon(z, { type, q, standout: true });
  h.inv = 0; h.specialCd = 0; h.face = 1;
  return h;
}
function level(id) {
  G.ow.save = save();
  G.enterLevel(NODES[id]);
  world.director.phase = 'fight';
  for (const e of world.enemies) e.spawnT = 0;
}
// the busiest stretch of the stage: the resident with the most neighbours close by
function crowd(skip = 0.12) {
  const sp = world.map.spawns, from = Math.floor(sp.length * skip);
  let best = sp[from], bn = -1;
  for (const s of sp.slice(from, -2)) {
    const n = sp.filter(o => Math.abs(o.x - s.x) < 150 && Math.abs(o.y - s.y) < 50).length;
    if (n > bn) (bn = n), (best = s);
  }
  return best;
}
function stand(x, feet) {
  const h = world.hero;
  h.x = x; h.y = feet - h.h; h.vx = h.vy = 0; h.ladder = null;
  updateCamera(0, true);
}
// a fight shot: the bot in the thick of a level's residents
function fight(id, type, q = 9) {
  level(id);
  const h = suitUp(NODES[id].zone, type, q), s = crowd();
  stand(s.x - 90, s.y);
  h.face = 1;
  return botPilot(G);
}
// a scenic run: the stage cleared of residents, the hero running right
function scenic(id, at = 0.25) {
  level(id);
  suitUp(NODES[id].zone, ZONES[NODES[id].zone].weapon || 'sword', 6);
  const s = world.map.spawns[Math.floor(world.map.spawns.length * at)];
  stand(s.x - 60, s.y);
  // clear the road ahead (but not the whole stage, or the HUD calls a FULL CLEAR)
  world.enemies = world.enemies.filter(e => e.x < s.x - 200 || e.x > s.x + 1100);
  world.hero.mom = 0.55;
  return runner();
}
// hold right, hop walls and gaps, tap dash now and then
function runner(dash = 0) {
  let t = 0;
  return {
    think() {
      const h = world.hero, want = new Set(['right']);
      t += STEP;
      const feet = h.y + h.h, ahead = cx(h) + h.w / 2 + 14;
      const gap = h.onGround && !world.map.platforms.some(p => ahead >= p.x && ahead < p.x + p.w && p.y >= feet - 34 && p.y <= feet + 34);
      if ((h.onGround && (h.hitWall || gap)) || (!h.onGround && h.vy < 0 && held.has('jump'))) want.add('jump');
      if (dash && t % dash < STEP * 3) want.add('dash');
      press(want);
    },
    release: () => press(new Set())
  };
}
// the castle head mid-fight: the arena swarm run on quietly until the head lands, then the bot
function boss(id, type, q = 8) {
  level(id);
  const h = suitUp(NODES[id].zone, type, q), m = world.map;
  world.enemies.length = 0;
  stand(m.bossLeft + 150, m.bossFloor);
  startSurvival();
  quietly(() => {
    for (let i = 0; i < 240; i++) (h.hp = h.maxHp), G.update(STEP);
    world.director.t = Math.min(world.director.t, 0.01);
    for (let i = 0; i < 200 && !(world.boss && world.boss.onGround); i++) (h.hp = h.maxHp), G.update(STEP);
  });
  if (world.boss) world.boss.spawnT = 0;
  return botPilot(G);
}
// fast-forwarding fires every sound at once: hold them back while it runs
function quietly(fn) {
  const was = audioSettings.sound;
  if (was) toggleSound();
  try { fn(); } finally { if (was && !audioSettings.sound) toggleSound(); }
}
// the map with every road open, standing on a level
function map(at, seenAll = true) {
  if (powers.open) closePowers();
  if (world.inv) closeInventory();
  const s = save();
  s.at = at;
  s.seen = seenAll ? REGIONS.map(R => R.id) : REGIONS.map(R => R.id).filter(r => r !== NODES[at].region);
  G.ow.save = s;
  G.openMap();
}

// ---------------------------------------------------------------- the shots
// dur: seconds; cap/sub: the caption in the lower bar (and a small line in the top bar); card: a
// chapter card on black instead of the game; bars: letterbox height; enter(): set the shot up;
// tick(t): every step; song: the music from this shot on
const name = z => REGIONS[z].name;
const SHOTS = [
  // the world, from space
  {
    dur: 5.2, song: ['title', TITLE_MUSIC], top: 'NOOBSCRUB GAMES PRESENTS', cap: 'ON THE PLANET HOPLON',
    enter() { map('1-1'); G.ow.zoomOn = true; G.ow.zoom = 1; G.ow.spin = 2.2; },
    tick(t) {
      // hold the globe, then fall to the map (eased: update() adds the step back on, so subtract it)
      const k = Math.max(0, Math.min(1, (t - 2.6) / 2.4)), z = 1 - k * k * (3 - 2 * k);
      G.ow.zoomOn = true;
      G.ow.zoom = Math.max(0, z - STEP * 2.2);
      if (z <= 0.02) (G.ow.zoomOn = false), (G.ow.zoom = 0);
    }
  },
  { dur: 3.4, title: true, flash: true, enter() { map('1-1'); } },
  {
    dur: 4.2, cap: 'TEN WORLDS TO CONQUER', sub: 'ONE FOR EVERY WEAPON FAMILY',
    enter() { map('5-1', false); G.ow.fly.t = 0.4; }
  },
  // beauty
  { dur: 2.6, song: ['map', MAP_MUSIC], top: name(1), cap: 'EXPLORE A LIVING WORLD', enter: () => scenic('2-2', 0.3) },
  { dur: 2.4, top: name(5), cap: 'EXPLORE A LIVING WORLD', enter: () => scenic('6-2', 0.3) },
  { dur: 2.4, top: name(4), cap: 'EXPLORE A LIVING WORLD', enter: () => scenic('5-2', 0.3) },
  { dur: 2.4, top: name(7), cap: 'EXPLORE A LIVING WORLD', enter: () => scenic('8-2', 0.3) },
  { dur: 2.6, top: name(9), cap: 'EXPLORE A LIVING WORLD', enter: () => scenic('10-2', 0.3) },
  // combat
  { dur: 1.3, card: 'SLICE THROUGH', card2: 'THE HORDES' },
  { dur: 3.4, cap: 'THIRTEEN WEAPON TYPES', sub: 'A THOUSAND WEAPON NAMES', enter: () => fight('1-3', 'katana') },
  { dur: 3.2, cap: 'CRUSH', sub: 'WITH HAMMERS THE SIZE OF A DOOR', enter: () => fight('7-2', 'hammer') },
  { dur: 3.2, cap: 'SHRED', sub: 'WITH SCYTHES, SPEARS AND SHURIKEN', enter: () => fight('3-2', 'scythe') },
  // speed
  { dur: 1.1, card: 'GO FAST' },
  { dur: 3.0, cap: 'BUILD MOMENTUM', sub: 'RUSH HITS HARDER THE FASTER YOU RUN', enter: () => (scenic('1-2', 0.1), (world.hero.mom = 1), runner(0.9)) },
  { dur: 3.0, cap: 'SPRINGS, BOOSTERS AND ZIPLINES', enter: () => gadgetRun('2-3') },
  { dur: 4.4, bars: [0, 14], cap: 'SPEEDRUN FOR THE S RANK', enter() { captureScene(G, 'clear'); world.run.t = 64; world.run.residentKills = world.map.spawns.length; } },
  // upgrades
  { dur: 1.2, card: 'FORGE YOUR', card2: 'ARSENAL' },
  { dur: 3.0, bars: [0, 14], cap: 'STRIKE LEGENDARY WEAPONS ON THE ANVIL', enter() { captureScene(G, 'anvil'); for (const n of LEVELS) keepRelics(G.ow.save, n.id, 31); }, tick(t) { if (world.inv && [0.7, 1.5, 2.1].some(k => Math.abs(t - k) < STEP / 2)) (world.inv.anvilAsk = t < 1 || t > 2), anvil(); } },
  { dur: 3.0, bars: [0, 14], cap: 'GROW THE SHARD TREE', enter() { captureScene(G, 'powers4'); } },
  { dur: 3.2, bars: [0, 14], cap: 'MASTER EVERY WEAPON TO 100', enter() { captureScene(G, 'powers5'); } },
  // the Beast Den
  { dur: 1.2, card: 'RAISE A', card2: 'BEAST DEN', song: ['den', ZONES[7].music] },
  { dur: 5.2, cap: 'PET YOUR BEASTS', sub: 'EVERY FAMILY LOVES YOU IN ITS OWN WAY', enter() { captureScene(G, 'den'); return petter(); } },
  { dur: 4.0, bars: [0, 14], cap: 'RACE THEM FOR MEDALS', enter() { captureScene(G, 'denrace'); den.menu.t = 0.2; } },
  // bosses
  { dur: 1.3, card: 'TOPPLE THE', card2: 'FAMILY HEADS', song: [null] },
  { dur: 3.6, cap: () => world.boss?.name || 'MOTHER GOOSE', sub: 'HEAD OF THE SWORD GRAVEYARD', enter: () => boss('1-C', 'katana', 7) },
  { dur: 3.6, cap: () => world.boss?.name || 'THE PETAL SHOGUN', sub: 'HEAD OF THE SAKURA KATANA SHRINE', enter: () => boss('5-C', 'spear', 8) },
  { dur: 3.8, cap: () => world.boss?.name || 'THE SENTIENT ARMORY', sub: 'HEAD OF THE DRAGON\'S GOLD VAULT', enter: () => boss('10-C', 'hammer', 10) },
  // and the hero, being the hero
  { dur: 2.4, song: ['map', MAP_MUSIC], cap: t => (t < 1.15 ? 'FEARLESS.' : t > 1.5 ? 'MOSTLY.' : ''), enter: () => doomed('1-2') },
  // end card
  { dur: RECORD ? 7 : 1e9, end: true, song: ['title', TITLE_MUSIC], enter() { map('5-2'); G.ow.zoomOn = true; G.ow.zoom = 1; G.ow.spin = 0.4; } }
];

// a run-up at the stage's first gadget (a spring, a booster, a zipline...)
function gadgetRun(id) {
  scenic(id, 0.1);
  const h = world.hero, g = world.map.gadgets.filter(o => (o.x ?? o.x0) > h.x + 120).sort((a, b) => (a.x ?? a.x0) - (b.x ?? b.x0))[0];
  if (g) {
    const gx = (g.x ?? g.x0) - 190, p = world.map.platforms.find(p => p.ground && gx >= p.x && gx < p.x + p.w);
    if (p) stand(gx, p.y);
  }
  world.enemies = world.enemies.filter(e => Math.abs(e.x - h.x) > 700);
  h.mom = 1;
  return runner();
}
// the Den: walk to a pet, pat it three times (the big reaction), then the next one
function petter() {
  let t = 0, pats = 0, target = null, wait = 0;
  const pets = () => [...den.pets.entries()].filter(([, a]) => a.state !== 'evolve');
  return {
    think() {
      t += STEP;
      const want = new Set(), h = den.hero, hx = h.x + h.w / 2;
      if (!target || !den.pets.has(target) || pats >= 3) {
        const left = pets().filter(([id]) => id !== target).sort((a, b) => Math.abs(a[1].x - hx) - Math.abs(b[1].x - hx));
        target = left[0]?.[0] ?? null;
        pats = 0;
        wait = 0.35;
      }
      const a = target != null && den.pets.get(target);
      if (a) {
        const dx = a.x - hx;
        if (Math.abs(dx) > 12) want.add(dx > 0 ? 'right' : 'left');
        else if ((wait -= STEP) <= 0) {
          if (!held.has('attack')) want.add('attack'), pats++, (wait = 0.32);
        }
      }
      press(want);
    },
    release: () => press(new Set())
  };
}
// the one shot where he goes down: walking into the geese with his chest out
function doomed(id) {
  const p = fight(id, 'sword', 3), h = world.hero;
  h.maxHp = h.hp = 100;
  let t = 0, done = false;
  return {
    think() {
      t += STEP;
      if (t < 0.9) return press(new Set(['right']));
      if (!done) {
        done = true;
        press(new Set());
        h.inv = 0; h.dashT = 0;
        hurtHero(h.maxHp * 3, -1);
      }
    },
    release: p.release
  };
}

// ---------------------------------------------------------------- the director
const T = { i: -1, t: 0, shot: null, pilot: null, flash: 0, over: false };
function cut(i) {
  T.pilot?.release?.();
  T.pilot = null;
  T.i = i;
  T.t = 0;
  const s = (T.shot = SHOTS[i]);
  if (!s) return finish();
  if (s.song) music.only(s.song[0], s.song[1]);
  if (s.flash) T.flash = 0.35;
  if (s.enter) {
    try { T.pilot = s.enter() || null; } catch (err) { console.error('trailer shot', i, err); }
  }
  if (T.pilot && !T.pilot.think) T.pilot = null;
}
function step() {
  if (T.over || !T.shot) return;
  T.t += STEP;
  if (T.flash > 0) T.flash -= STEP;
  const s = T.shot, h = world.hero;
  if (h && h.maxHp >= 1e5) h.hp = h.maxHp; // (suitUp's hero; the doomed one has a normal 100)
  s.tick?.(T.t);
  T.pilot?.think();
  if (T.t >= s.dur) cut(T.i + 1);
}

// ---------------------------------------------------------------- drawing over the game
const K = s => (textWidth(s, 3) <= W - 24 ? 3 : textWidth(s, 2) <= W - 16 ? 2 : 1);
function bars(top, bottom = top) {
  if (top > 0) rect(0, 0, W, top, '#000000');
  if (bottom > 0) rect(0, H - bottom, W, bottom, '#000000');
}
function caption(s, sub, t, n) {
  if (!s) return;
  const slide = Math.max(0, 1 - t / 0.18), x = W / 2 + Math.round(slide * slide * 60);
  if (n >= 24) {
    const y = H - n + (sub ? 3 : 8);
    text(s, x, y, C.gold, { k: 2, align: 'center' });
    if (sub) text(sub, W / 2 - Math.round(slide * 40), y + 17, C.mist, { align: 'center' });
  } else text(s, x, H - n + Math.max(2, (n - 8) / 2), C.gold, { align: 'center' });
  // a blade-glint sweeping under the words as they land
  const sw = Math.min(1, t / 0.35);
  if (sw < 1) rect(Math.round(W * sw) - 30, H - 2, 30, 1, C.paper);
}
function logo(t, y0 = 70) {
  const bob = Math.round(Math.sin(t * 2.4) * 2), drop = Math.max(0, 1 - t / 0.22);
  const y = y0 - Math.round(drop * drop * 60) + bob;
  text('CRAZY', W / 2, y, C.orange, { align: 'center', k: 5 });
  text('WEAPON MAN', W / 2, y + 42, C.gold, { align: 'center', k: 5 });
}
function card(s, s2, t) {
  rect(0, 0, W, H, '#000000');
  const u = Math.min(1, t / 0.16), k = K(s2 && s2.length > s.length ? s2 : s);
  const y = s2 ? 104 : 120, off = Math.round((1 - u) * 24);
  text(s, W / 2 - off, y, C.paper, { k, align: 'center' });
  if (s2) text(s2, W / 2 + off, y + 8 * k + 6, C.gold, { k, align: 'center' });
  // a slash across the card
  const sx = Math.round(-60 + (W + 120) * Math.min(1, t / 0.25));
  if (t < 0.3) for (let i = 0; i < 3; i++) rect(sx - 70 + i * 4, 92 + i * 30 + Math.round((sx / W) * 20), 70, 2, i === 1 ? C.gold : C.paper);
}
function draw() {
  const s = T.shot;
  if (!T.started) return gate();
  if (!s) return;
  const t = T.t;
  if (s.card) return card(s.card, s.card2, t);
  if (s.title) {
    dither(0, 0, W, H, C.ink, 12);
    logo(t);
    if (t > 0.6) text('ONE HERO. EVERY WEAPON.', W / 2, 172, C.paper, { k: 2, align: 'center' });
  }
  if (s.end) {
    dither(0, 0, W, H, C.ink, 11);
    logo(t, 54);
    if (t > 0.8) text('PLAY FREE NOW', W / 2, 156, C.paper, { k: 2, align: 'center' });
    if (t > 1.2) text('NOOBSCRUBGAMES.COM', W / 2, 180, C.lime, { k: 2, align: 'center' });
    if (!RECORD && t > 2 && Math.floor(t * 2) % 2) text('PRESS ANY KEY TO PLAY', W / 2, 214, C.mist, { align: 'center' });
    bars(18);
    return fades(t);
  }
  const [top, n] = Array.isArray(s.bars) ? s.bars : [s.bars ?? BAR, s.bars ?? BAR];
  bars(top, n);
  if (s.top && top >= 12) text(s.top, W / 2, Math.max(2, (top - 8) / 2), C.mist, { align: 'center' });
  const cap = typeof s.cap === 'function' ? s.cap(t) : s.cap;
  if (cap) caption(cap, s.sub, t, Math.max(n, 14));
  fades(t);
}
function fades(t) {
  // a quick fade up from black on every cut, and a white flash where a shot asks for one
  if (t < 0.12) dither(0, 0, W, H, '#000000', Math.round(16 * (1 - t / 0.12)));
  if (T.flash > 0) {
    X.save();
    X.globalAlpha = Math.min(1, T.flash / 0.35);
    rect(0, 0, W, H, C.paper);
    X.restore();
  }
}
// before it starts (a browser needs a click or key before it plays sound)
function gate() {
  dither(0, 0, W, H, C.ink, 12);
  logo(0.5, 60);
  if (Math.floor(performance.now() / 500) % 2) text('PRESS ANY KEY TO WATCH THE TRAILER', W / 2, 176, C.paper, { align: 'center' });
}

// ---------------------------------------------------------------- recording
// the canvas (or the janitor skit's canvas while it plays) drawn at 2x into a 960x540 recorder canvas,
// with the game's mix and the skit's sounds on the audio track
let rec = null;
function startRecorder() {
  const out = document.createElement('canvas');
  out.width = 960; out.height = 540;
  const g = out.getContext('2d', { alpha: false });
  g.imageSmoothingEnabled = false;
  const tap = audioTap(), tracks = [...out.captureStream(30).getVideoTracks()];
  if (tap) {
    const S = window.SPLASH_SFX;
    if (S?.ctx && S.master) {
      const d2 = S.ctx.createMediaStreamDestination();
      S.master.connect(d2);
      tap.ctx.createMediaStreamSource(d2.stream).connect(tap.dest);
    }
    tracks.push(...tap.dest.stream.getAudioTracks());
  }
  const type = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
  const mr = new MediaRecorder(new MediaStream(tracks), { mimeType: type, videoBitsPerSecond: 12e6, audioBitsPerSecond: 192e3 });
  const parts = [];
  mr.ondataavailable = e => e.data.size && parts.push(e.data);
  mr.onstop = () => {
    const blob = new Blob(parts, { type: 'video/webm' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'crazy-weapon-man-trailer.webm';
    document.body.appendChild(a);
    a.click();
    document.documentElement.dataset.trailer = 'done';
  };
  mr.start(1000);
  const paint = () => {
    const sp = document.querySelector('#splash canvas');
    g.fillStyle = '#000';
    g.fillRect(0, 0, 960, 540);
    if (sp && sp.width) g.drawImage(sp, 0, 0, 960, 540);
    else g.drawImage(canvas, 0, 0, 960, 540);
    if (!T.over) requestAnimationFrame(paint);
  };
  requestAnimationFrame(paint);
  rec = mr;
}
function finish() {
  T.over = true;
  press(new Set());
  if (rec) setTimeout(() => rec.stop(), 300);
}

// ---------------------------------------------------------------- start
function loadSplash() {
  return new Promise(res => {
    if (window.startSplash) return res();
    const s = document.createElement('script');
    s.src = '/src/vendor/noobscrub-splash.js';
    s.onload = res;
    s.onerror = res; // (no skit, straight to the globe)
    document.head.appendChild(s);
  });
}
function hideChrome() {
  for (const id of ['start', 'bar', 'touch-actions', 'rotate-hint']) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }
}
export async function runTrailer(game) {
  G = game;
  cinema.on = true;
  hideChrome();
  G.hooks.draw = draw;
  G.hooks.step = step;
  // warm the map's island art behind the gate and the skit, so the globe is ready when it shows
  map('1-1');
  G.ow.zoomOn = true; G.ow.zoom = 1;
  await loadSplash();
  if (!RECORD) await new Promise(res => {
    const go = e => { if (e.isTrusted) removeEventListener('keydown', go, true), removeEventListener('pointerdown', go, true), res(); };
    addEventListener('keydown', go, true);
    addEventListener('pointerdown', go, true);
  });
  audioOn();
  T.started = true;
  window.SPLASH_SFX?.init?.();
  if (RECORD) startRecorder();
  // after it starts, a real key or tap leaves for the game (the end card says so)
  if (!RECORD) setTimeout(() => {
    const leave = e => { if (e.isTrusted && !document.getElementById('splash')) location.href = location.pathname; };
    addEventListener('keydown', leave, true);
    addEventListener('pointerdown', leave, true);
  }, 400);
  sfx.ui?.(true);
  if (window.startSplash) await new Promise(res => window.startSplash(res, 'mop'));
  cut(0);
}
