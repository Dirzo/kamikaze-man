// Crazy Weapon Man (next): boot, fixed-step loop, scenes (title, play, pause, over, won).
import { W, H, STEP, C, GROUND } from './config.js';
import { input } from './engine/input.js';
import { loadAssets, A } from './engine/assets.js';
import { X, rect, text, textWidth, fitText, panel, dither, worldLayer, screenLayer, frame } from './engine/gfx.js';
import { audioOn, music, sfx, toggleMusic, toggleSound, audioSettings } from './engine/audio.js';
import { world, resetWorld } from './game/world.js';
import { createHero, updateHero, drawHero } from './game/hero.js';
import { updateEnemy, drawEnemy, updateBolts, drawBolts } from './game/enemy.js';
import { updateShots, drawShots } from './game/shots.js';
import { updateAbilities, drawAbilities } from './game/abilities.js';
import { updateSecret, drawSecret } from './game/secrets.js';
import { updateDrops, drawDrops } from './game/drops.js';
import { updateWaves, startZone, startSurvival } from './game/waves.js';
import { updateBoss, drawBoss, updateHazards, drawHazards, clearBoss } from './game/bosses.js';
import { updateSpecials, drawSpecials, drawSpecialScreen } from './game/specials.js';
import { updateFx, drawParticles, drawSparks, drawNumbers, feel, clearFx, drawSplats } from './game/fx.js';
import { drawBubbles } from './game/bubbles.js';
import { drawHud } from './game/hud.js';
import { updateInventory, drawInventory, toggleInventory, closeInventory, openInventory, newBag } from './game/inventory.js';
import { ZONES, TITLE_MUSIC } from './data/zones.js';
import { rarityColour } from './game/looks.js';
import { updateCamera } from './game/camera.js';
import { drawMapBackdrop, drawMapExit, drawRouteHud } from './game/map-view.js';
import { drawSlash } from './game/slash.js';
import { updateEvolution, drawEvolution } from './game/evolution.js';
import { updateLust } from './game/lust.js';
import { fmt } from './data/curve.js';
import { newRun, tickRun, endRun, drawResults, RESULTS_TIME } from './game/speedrun.js';
import { ow, openOverworld, updateOverworld, drawOverworld } from './game/overworld.js';
import { loadSave, writeSave, clearLevel, FINAL } from './data/overworld.js';
import { freshUid } from './game/loot.js';
import { bankShards, winTrophy, TROPHIES, trophyCount, chosenMount } from './data/meta.js';
import { STABLE_TROPHIES } from './data/mounts.js';
import { P as powers, openPowers, closePowers } from './game/powers.js';
import { openFiles, updateFiles, drawFiles } from './game/files-menu.js';
import { updateRelics, drawRelics, relicsTaken } from './game/relics.js';
import { updateHidden, drawHidden } from './game/hidden.js';
import { updateMount, drawMountWorld, saddle } from './game/mount.js';
import { updateGimmick, drawGimmickWorld, drawGimmickScreen } from './game/gimmicks.js';
import { updateAmbience, drawAmbienceFront } from './game/ambience.js';
import { flushBook } from './data/book.js';
import { temperOf, temperClear, MODS } from './data/temper.js';
import { relicMask, keepRelics, allRelics, RELIC_COUNT } from './data/relics.js';

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
  newRun();
  startZone(0);
  scene = 'play';
  sceneT = 0;
}

// ---------------------------------------------------------------- overworld + levels
// The overworld run: the hero (level, weapon, bag) carries from level to level and is saved with
// the map. A level is played on its region's zone map. Dying or leaving only loses that attempt:
// the hero goes back to how they walked in and the map keeps everything cleared.
function showFiles() {
  document.getElementById('start').hidden = true;
  openFiles();
  scene = 'files';
  sceneT = 0;
}
function openMap(fresh = []) {
  document.getElementById('start').hidden = true;
  closeInventory();
  world.level = null;
  if (!ow.save) ow.save = loadSave();
  openOverworld(ow.save, fresh);
  music.play('title', TITLE_MUSIC);
  scene = 'map';
  sceneT = 0;
}
const heroSnapshot = () => JSON.parse(JSON.stringify({ lv: world.hero.lv, xp: world.hero.xp, weapon: world.hero.weapon, bag: world.bag, mount: !!world.hero.mount }));
// the saved hero as world.hero + world.bag: fresh copies with new ids, so a failed attempt can
// never touch the saved gear
function loadHero() {
  const h = (world.hero = createHero()), snap = ow.save.hero;
  if (snap) {
    const copy = JSON.parse(JSON.stringify(snap));
    Object.assign(h, { lv: copy.lv, xp: copy.xp, maxHp: heroMax(copy.lv), weapon: freshUid(copy.weapon) });
    world.bag = copy.bag.map(w => w && freshUid(w));
    if (copy.mount && chosenMount()) h.mount = saddle(chosenMount()); // your mount rides along (the stable's pick: swap it there)
  }
  return h;
}
// the bag on the map (B / Tab): the saved hero's kit, written back to the save when it closes
function openMapBag() {
  world.bag = newBag();
  world.shards = 0;
  loadHero();
  openInventory();
}
function closeMapBag() {
  ow.save.hero = heroSnapshot();
  bankShards(world.shards); // salvaged on the map: straight into the shard tree
  world.shards = 0;
  writeSave(ow.save);
}
function enterLevel(node) {
  closeInventory();
  resetWorld();
  clearFx();
  clearBoss();
  const h = loadHero(), snap = ow.save.hero;
  world.level = node;
  world.temper = temperOf(ow.save).on; // the post-game tier picked on the map (T)
  world.relicsOwned = relicMask(ow.save, node.id);
  newRun();
  startZone(node.zone);
  h.hp = h.maxHp; // every level starts at full health
  scene = 'play';
  sceneT = 0;
}
// a level ended: 'clear' saves the hero and reveals new roads, 'fail' and 'quit' change nothing
function endLevel(result) {
  const node = world.level;
  let fresh = [], trophy = null;
  // shards are banked for the shard tree win or lose: a failed attempt still made you stronger
  const shards = bankShards(world.shards);
  world.shards = 0;
  flushBook();
  let relics = null, temperUp = 0;
  if (result === 'clear') {
    if (node.kind === 'castle' && winTrophy(node.region)) trophy = TROPHIES[node.region];
    fresh = clearLevel(ow.save, node.id, world.levelExit === 'secret' && node.secret.length ? 'secret' : 'next');
    const had = allRelics(ow.save, node.id);
    relics = { taken: relicsTaken(), fresh: keepRelics(ow.save, node.id, world.relicMask), set: !had && allRelics(ow.save, node.id) };
    temperUp = temperClear(ow.save, node.id);
    ow.save.hero = heroSnapshot();
    writeSave(ow.save);
  }
  if (result === 'quit') return openMap();
  const stable = !!trophy && trophyCount() === STABLE_TROPHIES; // the third family head just fell
  world.levelEnd = { result, node, fresh, secret: fresh.some(e => e.secret), shards, trophy, relics, temperUp, cards: world.cardUps.length, stable };
  scene = 'levelEnd';
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
      showFiles();
    }
    return;
  }
  if (scene === 'files') {
    const r = updateFiles();
    if (r === 'play') {
      ow.save = null; // the chosen file's map
      openMap();
    } else if (r === 'back') {
      scene = 'title';
      document.getElementById('start').hidden = false;
    }
    return;
  }
  if (scene === 'map') {
    if (world.inv) {
      updateInventory(dt);
      if (!world.inv) input.consume('bag'), closeMapBag(); // (B closed it: don't reopen next step)
      return;
    }
    if (!powers.open && input.take('bag')) return input.consume('inv'), openMapBag();
    if (!powers.open && input.take('pause')) return showFiles();
    const node = updateOverworld(dt);
    if (node) enterLevel(node);
    return;
  }
  if (scene === 'levelEnd') {
    if (sceneT > 0.6 && (input.take('confirm') | input.take('jump')) || sceneT > (world.levelEnd.trophy ? 8 : 4)) openMap(world.levelEnd.fresh);
    return;
  }
  if (scene === 'over' || scene === 'won') {
    // first press skips the results animation, the next one starts a new run
    if (sceneT > 0.5 && (input.take('confirm') | input.take('jump'))) sceneT < RESULTS_TIME ? (sceneT = RESULTS_TIME) : startRun();
    return;
  }
  if (scene === 'pause') {
    if (input.take('pause') | input.take('confirm')) scene = 'play';
    else if (world.level && input.take('leave')) endLevel('quit');
    return;
  }
  // ---- play ----
  tickRun(dt); // the speedrun clock only stops for the pause menu
  if (world.inv) {
    updateInventory(dt); // the bag pauses the fight
    return;
  }
  if (input.take('pause')) {
    scene = 'pause';
    return;
  }
  if (input.take('inv') && world.phase === 'play') {
    toggleInventory();
    return;
  }
  if (feel.stop > 0) {
    feel.stop -= dt;
    return; // hit-stop: the world holds its breath
  }
  world.t += dt;
  updateHero(world.hero, dt);
  updateMount(dt);
  updateHidden(dt);
  updateRelics(dt);
  updateLust(world.hero, dt);
  for (const e of world.enemies) e.boss ? updateBoss(e, dt) : updateEnemy(e, dt);
  world.enemies = world.enemies.filter(e => !e.dead || e.deathT > 0);
  if (world.boss && world.boss.dead && world.boss.deathT <= 0) world.boss = null;
  updateEvolution(dt);
  updateShots(dt);
  updateAbilities(dt);
  updateSpecials(dt);
  updateSecret(dt);
  updateBolts(dt);
  updateHazards(dt);
  updateDrops(dt);
  updateWaves(dt);
  updateFx(dt);
  tickToasts(dt);
  updateGimmick(dt);
  updateAmbience(dt);
  updateCamera(dt);
  if (world.phase === 'dead') {
    world.deadT = (world.deadT || 0) + dt;
    if (world.deadT > 1.6 && world.level) {
      music.stop();
      endLevel('fail');
    } else if (world.deadT > 1.6) {
      scene = 'over';
      sceneT = 0;
      flushBook();
      endRun(false);
      bankShards(world.shards); // a classic run's shards feed the shard tree too
      music.stop();
    }
  }
  if (world.phase === 'cleared') endLevel('clear');
  if (world.phase === 'won') {
    scene = 'won';
    sceneT = 0;
    endRun(true);
    bankShards(world.shards);
  }
}

// ---------------------------------------------------------------- drawing
function drawSlab(zone, p) {
  const sl = A.slabs[zone];
  if (p.ground && A.biome[zone]) return; // a living zone draws its own ground top (ambience.js)
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
  drawSecret(t);
  drawHidden(t);
  drawRelics(t);
  drawMountWorld(t);
  drawDrops(t);
  drawHazards(t);
  drawSplats();
  for (const e of world.enemies) if (e.dead) e.boss ? drawBoss(e, t) : drawEnemy(e, t);
  for (const e of world.enemies) if (!e.dead) e.boss ? drawBoss(e, t) : drawEnemy(e, t);
  drawBolts();
  drawEvolution();
  drawSlash(world.hero);
  drawHero(world.hero, t);
  drawShots(t);
  drawAbilities(t);
  drawSpecials();
  drawGimmickWorld(t);
  drawAmbienceFront(); // liquid pits, near weather and the night bazaar's dark
  drawGimmickScreen(t); // the flood, the frost and the dark of a ghost house
  worldLayer();
  drawParticles();
  drawSparks();
  drawNumbers();
  drawBubbles();
  screenLayer();
}

function drawTitle(t) {
  X.drawImage(A.bg.graveyard, 0, 0);
  const bob = Math.round(Math.sin(t * 2) * 2);
  text('CRAZY', W / 2, 44 + bob, C.orange, { align: 'center', k: 4 });
  text('WEAPON MAN', W / 2, 78 + bob, C.gold, { align: 'center', k: 4 });
  // hero standing on the ground
  const Hh = A.hero;
  frame(Hh.im, Hh.frames[Math.floor(t * 2) % 2 ? 'idle' : 'idle2'], Hh.w, Hh.h, W / 2 - Hh.w / 2, GROUND - Hh.feet, false);
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
  text(world.level ? 'ESC TO RESUME    Q TO LEAVE THE LEVEL' : 'ESC TO RESUME', W / 2, 190, C.lime, { align: 'center' });
}

function drawLevelEnd() {
  const E = world.levelEnd, clear = E.result === 'clear', final = clear && E.node.id === FINAL;
  dither(0, 0, W, H, C.ink, 9);
  const extra = [];
  if (E.relics) extra.push([E.relics.set ? `ALL ${RELIC_COUNT} RELICS! A STAR FOR ${E.node.id}` : `RELICS ${E.relics.taken}/${RELIC_COUNT} THIS RUN` + (E.relics.fresh ? `  (${E.relics.fresh} NEW)` : ''), E.relics.set ? C.gold : C.cream]);
  if (E.temperUp) extra.push([`TEMPER ${E.temperUp} UNLOCKED: ${MODS[E.temperUp - 1].name}  (T ON THE MAP)`, C.coral]);
  if (E.cards) extra.push([`MONSTER BOOK: ${E.cards} CARD${E.cards > 1 ? 'S' : ''} WENT UP A TIER`, C.sky]);
  if (E.stable) extra.push(['THE STABLE IS OPEN! PICK A MOUNT: E (POWERS) > STABLE', C.lime]);
  panel('panel', W / 2 - 172, 74, 344, 108 + extra.length * 10);
  extra.forEach(([s, col], i) => text(s, W / 2, 160 + i * 10, col, { align: 'center' }));
  text(final ? 'THE HOARD IS QUIET' : clear ? 'LEVEL CLEAR!' : 'LEVEL FAILED', W / 2, 88, clear ? C.gold : C.coral, { align: 'center', k: 2 });
  text(E.node.id + '  ' + E.node.name.toUpperCase(), W / 2, 112, C.paper, { align: 'center' });
  const line = final ? 'YOU BEAT CRAZY WEAPON MAN. THE CLOSETS STILL HAVE SECRETS.'
    : E.secret ? 'SECRET EXIT! A HIDDEN PATH OPENS'
    : clear ? (E.fresh.length > 1 ? 'A FORK IN THE ROAD! ' + E.fresh.length + ' NEW PATHS OPEN' : E.fresh.length ? 'A NEW PATH OPENS' : 'YOUR GEAR IS SAVED')
    : 'NOTHING LOST BUT THE ATTEMPT. THE MAP IS SAFE.';
  text(line, W / 2, 128, clear ? C.lime : C.mist, { align: 'center' });
  if (E.trophy) {
    text('TROPHY: ' + E.trophy.name, W / 2, 140, C.gold, { align: 'center' });
    text(fitText('NEW PERK  ' + E.trophy.perk + ': ' + E.trophy.desc.toUpperCase(), 330), W / 2, 150, C.cream, { align: 'center' });
  } else text(`+${E.shards} SHARDS BANKED FOR THE SHARD TREE`, W / 2, 144, C.ice, { align: 'center' });
  text('JUMP / ENTER: BACK TO THE MAP', W / 2, 164 + extra.length * 10, C.fog, { align: 'center' });
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
  if (scene === 'files') return drawTitle(t), drawFiles(t);
  if (scene === 'map') return drawOverworld(t), drawInventory(t); // the bag (B) opens over the map
  drawWorld(world.t);
  drawHud(world.t);
  drawRouteHud();
  if (scene === 'play') drawSpecialScreen(); // the special's banner and flash go over the HUD too
  drawInventory(clock);
  if (scene === 'pause') drawPause();
  if (scene === 'levelEnd') drawLevelEnd();
  if (scene === 'over') drawResults(false, sceneT, clock);
  if (scene === 'won') drawResults(true, sceneT, clock);
  document.getElementById('start').hidden = scene !== 'over' && scene !== 'won';
  if (scene === 'over' || scene === 'won') document.getElementById('start').textContent = 'ANOTHER BAD IDEA';
  document.getElementById('start').classList.toggle('results', scene === 'over' || scene === 'won');
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
  else if (scene === 'map' && world.inv) closeInventory(), closeMapBag();
  else if (scene === 'map') powers.open && closePowers(), openMapBag();
});
click('b-powers', () => {
  if (scene !== 'map') return;
  if (world.inv) closeInventory(), closeMapBag();
  powers.open ? closePowers() : openPowers();
});
click('b-restart', () => {
  if (world.level && scene !== 'map') enterLevel(world.level); // retry this level, from the map's saved hero
  else if (scene !== 'map' && scene !== 'loading' && scene !== 'title') startRun();
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
  audioOn(); scene === 'over' || scene === 'won' ? startRun() : scene === 'title' ? showFiles() : openMap(); document.getElementById('screen').focus();
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
    if (new URLSearchParams(location.search).has('playtest')) import('./testing/playtest.js').then(m => m.runPlaytest(debug));
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
import { heroMax } from './game/perks.js';
import { drawHeroAnimated } from './game/anim.js';
import { TYPES as WTYPES, MOVES } from './data/weapons.js';
// debug: contact sheet of every weapon style's poses -> data URL
// cols: idle run jump fall dash, aN = first combo move at phase N (0..5), bN / cN = second / third
// move at phase N, or a raw phase like 'c:0.42' (third move at p = 0.42)
function animSheet(zoom = 3, types = Object.keys(WTYPES), cols = ['idle', 'run', 'jump', 'fall', 'dash', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'b2', 'c2'], cw = 60, ch = 60, bg = C.slate) {
  const sheet = document.createElement('canvas');
  sheet.width = cw * cols.length * zoom;
  sheet.height = ch * types.length * zoom;
  const g = sheet.getContext('2d');
  g.imageSmoothingEnabled = false;
  types.forEach((type, r) => {
    const weapon = makeWeapon(3, { type, q: 3, standout: false }); // one weapon per row
    cols.forEach((c, i) => {
      const h = createHero();
      h.weapon = weapon;
      h.x = 170 + Math.round(cw / 2 - h.w / 2);
      h.y = 120 + Math.round(ch * 0.66) - h.h;
      h.onGround = true;
      h.inv = 0;
      const T = WTYPES[type];
      let at = 1.0; // 'idle:t', 'run:t' and 'climb:t' pick a moment of that loop
      if (c.startsWith('idle:')) at = +c.slice(5);
      else if (c.startsWith('climb')) (h.ladder = true), (h.climbT = +c.slice(6) || 0);
      else if (c.startsWith('run')) {
        h.vx = 90;
        h.animT = c[3] === ':' ? +c.slice(4) : 0.15;
      } else if (c === 'jump') {
        h.onGround = false;
        h.vy = -100;
      } else if (c === 'fall') {
        h.onGround = false;
        h.vy = 100;
      } else if (c === 'dash') h.dashT = 0.1;
      else if (c[0] === 'a' || c[0] === 'b' || c[0] === 'c') {
        const step = c[0] === 'a' ? 0 : c[0] === 'b' ? 1 : 2;
        const p = c[1] === ':' ? parseFloat(c.slice(2)) : c[0] === 'a' ? [0.05, 0.25, 0.45, 0.6, 0.8, 1][+c[1]] : [0.05, 0.25, 0.45, 0.6, 0.8, 1][+c[1]] ?? 0.5;
        if (T.melee) {
          const mn = T.combo[step];
          h.attack = { move: MOVES[mn], moveName: mn, t: p, dur: 1, hit: new Set() };
        } else h.attack = { ranged: true, t: p, dur: 1, fired: true };
      }
      // 'a:0.5~': play the few frames before too, so the swing smear shows
      const steps = c.endsWith('~') && h.attack ? [0.2, 0.15, 0.1, 0.05, 0] : [0];
      const p0 = h.attack ? h.attack.t : 0;
      for (const d of steps) {
        if (h.attack) h.attack.t = Math.max(0, p0 - d);
        X.setTransform(1, 0, 0, 1, 0, 0);
        X.fillStyle = bg;
        X.fillRect(170, 120, cw, ch);
        drawHeroAnimated(h, at);
      }
      g.drawImage(X.canvas, 170, 120, cw, ch, i * cw * zoom, r * ch * zoom, cw * zoom, ch * zoom);
    });
  });
  return sheet.toDataURL();
}
const debug = {
  types: WTYPES,
  hitDamage,
  snapshot(fn) { startRun(); fn(); capture = true; },
  play(fn) { startRun(); fn(); }, // like snapshot, but the game keeps running (?capture=walkN)
  // show the end-of-run results screen, `T` seconds into its animation
  results(won, T = RESULTS_TIME) { endRun(won); scene = won ? 'won' : 'over'; sceneT = T; },
  sceneT: () => sceneT,
  updateShots,
  update,
  render,
  world,
  get scene() {
    return scene;
  },
  startRun,
  openMap,
  showFiles,
  enterLevel,
  ow,
  powers,
  openPowers,
  toggleInventory,
  A,
  animSheet,
  // debug: start at zone z with a matching hero (and optionally go straight to its boss)
  jump(z, { boss = false, type = null } = {}) {
    startRun();
    const h = world.hero;
    h.lv = 1 + z * 3;
    h.maxHp = h.hp = heroMax(h.lv);
    h.weapon = makeWeapon(z, { q: Math.min(10, z + 1), type, standout: false });
    startZone(z);
    if (boss) {
      // straight into the arena swarm, with the boss about to arrive
      for (const e of world.enemies) e.dead = true;
      world.enemies.length = 0;
      h.x = world.map.bossLeft + 40; h.y = world.map.bossFloor - h.h;
      startSurvival();
      world.director.t = 1.7;
    }
  }
};

// Explicit developer mode only: never expose mutable run state to regular players.
if (new URLSearchParams(location.search).has('debug')) window.CWM = debug;
