// Crazy Weapon Man (next): boot, fixed-step loop, scenes (title, play, pause, over, won).
import { W, H, STEP, C, GROUND } from './config.js';
import { input } from './engine/input.js';
import { loadAssets, A } from './engine/assets.js';
import { X, rect, text, textWidth, panel, dither, worldLayer, screenLayer, frame } from './engine/gfx.js';
import { audioOn, music, sfx, toggleMusic, toggleSound, audioSettings } from './engine/audio.js';
import { world, resetWorld } from './game/world.js';
import { createHero, updateHero, drawHero } from './game/hero.js';
import { updateEnemy, drawEnemy, updateBolts, drawBolts } from './game/enemy.js';
import { updateShots, drawShots } from './game/shots.js';
import { updateDrops, drawDrops, drawNearDrop } from './game/drops.js';
import { updateWaves, startZone } from './game/waves.js';
import { updateBoss, drawBoss, updateHazards, drawHazards, clearBoss } from './game/bosses.js';
import { updateFx, drawParticles, drawSparks, drawNumbers, feel, clearFx } from './game/fx.js';
import { drawBubbles } from './game/bubbles.js';
import { drawHud } from './game/hud.js';
import { drawForge } from './game/forge.js';
import { updateInventory, drawInventory, toggleInventory, closeInventory } from './game/inventory.js';
import { ZONES, TITLE_MUSIC } from './data/zones.js';
import { rarityColour } from './game/looks.js';
import { updateCamera } from './game/camera.js';
import { drawMapBackdrop, drawMapExit, drawRouteHud } from './game/map-view.js';
import { drawSlash } from './game/slash.js';
import { updateEvolution, drawEvolution } from './game/evolution.js';
import { updateLust } from './game/lust.js';
import { fmt } from './data/curve.js';

let capture = false;
let scene = 'loading',
  sceneT = 0,
  loadFrac = 0,
  clock = 0;

// ---------------------------------------------------------------- scenes
function startRun() {
  document.getElementById('start').hidden = true;
  closeInventory();
  resetWorld();
  clearFx();
  clearBoss();
  world.hero = createHero();
  startZone(0);
  scene = 'play';
  sceneT = 0;
}

function update(dt) {
  if (capture) return;
  clock += dt;
  sceneT += dt;
  input.poll(clock);
  if (input.anyKey()) audioOn();
  music.tick();
  if (scene === 'title') {
    if (input.take('confirm') | input.take('jump')) {
      audioOn();
      sfx.ui(true);
      startRun();
    }
    return;
  }
  if (scene === 'over' || scene === 'won') {
    if (sceneT > 1 && (input.take('confirm') | input.take('jump'))) startRun();
    return;
  }
  if (scene === 'pause') {
    if (input.take('pause') | input.take('confirm')) scene = 'play';
    return;
  }
  // ---- play ----
  if (world.inv) {
    updateInventory(dt); // the bag pauses the fight
    return;
  }
  if (input.take('pause')) {
    scene = 'pause';
    return;
  }
  if (input.take('inv') && !world.forge && world.phase === 'play') {
    toggleInventory();
    return;
  }
  if (world.forge) {
    updateWaves(dt);
    updateFx(dt);
    tickToasts(dt);
    return;
  }
  if (feel.stop > 0) {
    feel.stop -= dt;
    return; // hit-stop: the world holds its breath
  }
  world.t += dt;
  if (!world.forge) updateHero(world.hero, dt);
  updateLust(world.hero, dt);
  for (const e of world.enemies) e.boss ? updateBoss(e, dt) : updateEnemy(e, dt);
  world.enemies = world.enemies.filter(e => !e.dead || e.deathT > 0);
  if (world.boss && world.boss.dead && world.boss.deathT <= 0) world.boss = null;
  updateEvolution(dt);
  updateShots(dt);
  updateBolts(dt);
  updateHazards(dt);
  updateDrops(dt);
  updateWaves(dt);
  updateFx(dt);
  tickToasts(dt);
  updateCamera(dt);
  if (world.phase === 'dead') {
    world.deadT = (world.deadT || 0) + dt;
    if (world.deadT > 1.6) {
      scene = 'over';
      sceneT = 0;
      music.stop();
    }
  }
  if (world.phase === 'won') {
    scene = 'won';
    sceneT = 0;
  }
}

// ---------------------------------------------------------------- drawing
function drawSlab(zone, p) {
  const sl = A.slabs[zone];
  if (!sl) return rect(p.x, p.y, p.w, 6, C.stone);
  const cap = sl.cap,
    y0 = p.y - 2;
  X.drawImage(sl.im, 0, 0, cap, sl.h, p.x, y0, cap, sl.h);
  const mid = sl.w - cap * 2;
  for (let x = p.x + cap; x < p.x + p.w - cap; x += mid) {
    const seg = Math.min(mid, p.x + p.w - cap - x);
    X.drawImage(sl.im, cap, 0, seg, sl.h, x, y0, seg, sl.h);
  }
  X.drawImage(sl.im, sl.w - cap, 0, cap, sl.h, p.x + p.w - cap, y0, cap, sl.h);
}

function drawWorld(t) {
  const Z = ZONES[world.zone];
  drawMapBackdrop();
  for (const p of world.platforms) if(p.x+p.w>=world.cameraX && p.x<=world.cameraX+W && p.y>=world.cameraY-32 && p.y<=world.cameraY+H) drawSlab(Z.id, p);
  drawMapExit(t);
  drawDrops(t);
  drawHazards(t);
  for (const e of world.enemies) if (e.dead) e.boss ? drawBoss(e, t) : drawEnemy(e, t);
  for (const e of world.enemies) if (!e.dead) e.boss ? drawBoss(e, t) : drawEnemy(e, t);
  drawBolts();
  drawEvolution();
  drawSlash(world.hero);
  drawHero(world.hero, t);
  drawShots(t);
  drawParticles();
  drawSparks();
  drawNumbers();
  drawBubbles();
  drawNearDrop(t);
  screenLayer();
}

function drawTitle(t) {
  X.drawImage(A.bg.graveyard, 0, 0);
  const bob = Math.round(Math.sin(t * 2) * 2);
  text('CRAZY', W / 2, 44 + bob, C.orange, { align: 'center', k: 4 });
  text('WEAPON MAN', W / 2, 78 + bob, C.gold, { align: 'center', k: 4 });
  // hero standing on the ground
  const Hh = A.hero;
  frame(Hh.im, Hh.frames[Math.floor(t * 2) % 2 ? 'idle' : 'idle2'], Hh.w, Hh.h, W / 2 - 8, GROUND - 24, false);
  text('CLEAR THE MAP. CLAIM THE NEXT.', W / 2, 123, C.mist, { align: 'center' });
  const lines = [
    'MOVE  ARROWS / A D        JUMP  ALT / X        ATTACK  CTRL / Z',
    'SPECIAL  SPACE / C    DASH  SHIFT / V    PICK UP  DOWN    BAG  E',
    'GAMEPAD: A JUMP  X ATTACK  Y SPECIAL  B DASH  START PAUSE'
  ];
  lines.forEach((l, i) => text(l, W / 2, 222 + i * 11, C.mist, { align: 'center' }));
  text('KILL EVERY ENEMY. OPEN THE EXIT PORTAL.', W / 2, 192, C.lime, { align: 'center' });
}

function drawPause() {
  dither(0, 0, W, H, C.ink, 10);
  panel('panel', W / 2 - 120, 56, 240, 146);
  text('PAUSED', W / 2, 72, C.gold, { align: 'center', k: 2 });
  const rows = [
    ['MOVE', 'ARROWS / A D'],
    ['JUMP', 'ALT / X  (DOWN+JUMP: DROP)'],
    ['ATTACK', 'CTRL / Z'],
    ['SPECIAL', 'SPACE / C'],
    ['DASH', 'SHIFT / V'],
    ['PICK UP WEAPON', 'DOWN ON A DROP'],
    ['BAG / EQUIPMENT', 'E / B / TAB'],
    ['MUSIC / SOUND', `M ${audioSettings.music ? 'ON' : 'OFF'} / N ${audioSettings.sound ? 'ON' : 'OFF'}`]
  ];
  rows.forEach(([a, b], i) => {
    text(a, W / 2 - 108, 96 + i * 12, C.mist);
    text(b, W / 2 + 108, 96 + i * 12, C.paper, { align: 'right' });
  });
  text('ESC TO RESUME', W / 2, 190, C.lime, { align: 'center' });
}

function drawEnd(won) {
  dither(0, 0, W, H, C.ink, 11);
  panel('panel', W / 2 - 140, 50, 280, 150);
  text(won ? 'THE ARMORY FALLS' : 'YOU DIED', W / 2, 62, won ? C.gold : C.red, { align: 'center', k: 2 });
  const h = world.hero;
  const rows = [
    ['ZONE', `${world.zone + 1}  ${ZONES[world.zone].name}`],
    ['KILLS', fmt(world.kills)],
    ['LEVEL', String(h ? h.lv : 1)],
    ['SHARDS', fmt(world.shards)]
  ];
  rows.forEach(([a, b], i) => {
    text(a, W / 2 - 128, 90 + i * 12, C.mist);
    text(b, W / 2 + 128, 90 + i * 12, C.paper, { align: 'right' });
  });
  text('BEST WEAPON', W / 2, 146, C.mist, { align: 'center' });
  const best = world.best || (h && h.weapon);
  if (best) text(best.name, W / 2, 157, best.standout ? C.gold : rarityColour(best.q), { align: 'center' });
  if (sceneT > 1 && Math.floor(sceneT * 2) % 2) text('PRESS START TO GO AGAIN', W / 2, 182, C.lime, { align: 'center' });
}

function render() {
  screenLayer();
  const t = clock;
  if (scene === 'loading') {
    rect(0, 0, W, H, C.ink);
    rect(W / 2 - 60, H / 2, 120, 4, C.night);
    rect(W / 2 - 60, H / 2, Math.round(120 * loadFrac), 4, C.gold);
    return;
  }
  if (scene === 'title') return drawTitle(t);
  drawWorld(world.t);
  drawHud(world.t);
  drawRouteHud();
  drawForge(world.t);
  drawInventory(clock);
  if (scene === 'pause') drawPause();
  if (scene === 'over') drawEnd(false);
  if (scene === 'won') drawEnd(true);
  document.getElementById('start').hidden = scene !== 'over' && scene !== 'won';
  if (scene === 'over' || scene === 'won') document.getElementById('start').textContent = 'ANOTHER BAD IDEA';
}

// ---------------------------------------------------------------- loop
let last = performance.now(),
  acc = 0;
function loop(now) {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  while (acc >= STEP) {
    if (scene !== 'loading') update(STEP);
    acc -= STEP;
  }
  render();
  requestAnimationFrame(loop);
}
// ---------------------------------------------------------------- buttons (mouse) + M/N keys
const btn = id => document.getElementById(id);
function syncButtons() {
  btn('b-sound').textContent = 'Sound: ' + (audioSettings.sound ? 'On' : 'Off');
  btn('b-music').textContent = 'Music: ' + (audioSettings.music ? 'On' : 'Off');
  btn('b-pause').textContent = scene === 'pause' ? 'Resume' : 'Pause';
}
function click(id, fn) {
  btn(id).addEventListener('click', e => {
    audioOn();
    fn();
    e.currentTarget.blur(); // keep keyboard focus on the game (Space must not re-press the button)
    syncButtons();
  });
}
click('b-sound', toggleSound);
click('b-music', toggleMusic);
click('b-pause', () => {
  if (scene === 'play') scene = 'pause';
  else if (scene === 'pause') scene = 'play';
});
click('b-bag', () => {
  if (scene === 'play') toggleInventory();
});
click('b-restart', () => {
  if (scene !== 'loading') startRun();
});
click('b-full', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else {
      await document.documentElement.requestFullscreen?.();
      try {await screen.orientation?.lock?.('landscape');} catch (_) { /* Browser rotation remains available. */ }
    }
  } catch (_) { /* Fullscreen is optional on mobile browsers. */ }
});
addEventListener('keydown', e => {
  if (e.code === 'KeyM') toggleMusic();
  if (e.code === 'KeyN') toggleSound();
  syncButtons();
});
setInterval(syncButtons, 250);

document.getElementById('start').addEventListener('click', () => {
  if (scene === 'loading') return;
  audioOn(); startRun(); document.getElementById('screen').focus();
});
document.getElementById('start').hidden = true;
document.addEventListener('visibilitychange', () => {
  if (document.hidden && scene === 'play') scene = 'pause';
  last = performance.now(); acc = 0; syncButtons();
});
function tickToasts(dt) {
  for (const t of world.toasts) t.t -= dt;
  world.toasts = world.toasts.filter(t => t.t > 0);
}

requestAnimationFrame(loop);
loadAssets(f => (loadFrac = f))
  .then(() => {
    document.getElementById('start').hidden = false;
    document.documentElement.dataset.cwm = 'ready';
    scene = 'title';
    music.play('title', TITLE_MUSIC);
    const captureName = new URLSearchParams(location.search).get('capture');
    if (captureName) import('./testing/capture.js').then(m => m.captureScene(debug, captureName));
    if (new URLSearchParams(location.search).has('smoke')) import('./testing/smoke.js').then(m => m.runSmoke(debug));
  })
  .catch(err => {
    console.error(err);
    document.documentElement.dataset.cwm = 'error';
    document.getElementById('status').textContent = 'Could not load the armory. Reload to retry.';
    document.getElementById('start').hidden = true;
    scene = 'loading';
  });

// debug hooks for tests
import { makeWeapon, hitDamage } from './game/loot.js';
import { heroMaxHp } from './data/curve.js';
import { startBoss } from './game/bosses.js';
import { drawHeroAnimated } from './game/anim.js';
import { TYPES as WTYPES, MOVES } from './data/weapons.js';
// debug: contact sheet of every weapon style's poses -> data URL
function animSheet(zoom = 3) {
  const types = Object.keys(WTYPES);
  const cols = ['idle', 'run', 'jump', 'fall', 'dash', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'b2', 'c2'];
  const cw = 60,
    ch = 60;
  const sheet = document.createElement('canvas');
  sheet.width = cw * cols.length * zoom;
  sheet.height = ch * types.length * zoom;
  const g = sheet.getContext('2d');
  g.imageSmoothingEnabled = false;
  types.forEach((type, r) => {
    cols.forEach((c, i) => {
      const h = createHero();
      h.weapon = makeWeapon(3, { type, q: 3, standout: false });
      h.x = 192;
      h.y = 140;
      h.onGround = true;
      h.inv = 0;
      const T = WTYPES[type];
      if (c === 'run') {
        h.vx = 90;
        h.animT = 0.15;
      } else if (c === 'jump') {
        h.onGround = false;
        h.vy = -100;
      } else if (c === 'fall') {
        h.onGround = false;
        h.vy = 100;
      } else if (c === 'dash') h.dashT = 0.1;
      else if (c[0] === 'a' || c[0] === 'b' || c[0] === 'c') {
        const step = c[0] === 'a' ? 0 : c[0] === 'b' ? 1 : 2;
        const p = c[0] === 'a' ? [0.05, 0.25, 0.45, 0.6, 0.8, 1][+c[1]] : 0.5;
        if (T.melee) {
          const mn = T.combo[step];
          h.attack = { move: MOVES[mn], moveName: mn, t: p, dur: 1, hit: new Set() };
        } else h.attack = { ranged: true, t: p, dur: 1, fired: true };
      }
      X.setTransform(1, 0, 0, 1, 0, 0);
      X.fillStyle = C.slate;
      X.fillRect(170, 120, cw, ch);
      drawHeroAnimated(h, 1.0);
      g.drawImage(X.canvas, 170, 120, cw, ch, i * cw * zoom, r * ch * zoom, cw * zoom, ch * zoom);
    });
  });
  return sheet.toDataURL();
}
const debug = {
  types: WTYPES,
  hitDamage,
  snapshot(fn) { startRun(); fn(); capture = true; },
  updateShots,
  update,
  render,
  world,
  get scene() {
    return scene;
  },
  startRun,
  A,
  animSheet,
  // debug: start at zone z with a matching hero (and optionally go straight to its boss)
  jump(z, { boss = false, type = null } = {}) {
    startRun();
    const h = world.hero;
    h.lv = 1 + z * 3;
    h.maxHp = h.hp = heroMaxHp(h.lv);
    h.weapon = makeWeapon(z, { q: Math.min(10, z + 1), type, standout: false });
    startZone(z);
    if (boss && ZONES[z].boss) {
      world.director.phase = 'boss';
      startBoss(ZONES[z].boss);
    }
  }
};

// Explicit developer mode only: never expose mutable run state to regular players.
if (new URLSearchParams(location.search).has('debug')) window.CWM = debug;
