// The SAVE FILES menu, between the title and the overworld (and back from the map with ESC).
// Three files, each a whole game (data/saves.js). UP / DOWN picks, ENTER plays (or starts a new
// game in an empty file), Q erases after a second press, ESC goes back to the title. Mouse and
// touch click a file to pick it and again to play it.
import { C, W, H } from '../config.js';
import { canvas, rect, text, panel, dither } from '../engine/gfx.js';
import { input } from '../engine/input.js';
import { sfx } from '../engine/audio.js';
import { fmt } from '../data/curve.js';
import { REGIONS } from '../data/overworld.js';
import { FILE_COUNT, activeFile, fileSummary, useFile, eraseFile } from '../data/saves.js';

export const F = { sel: 0, erase: -1, boxes: [], open: false };
export function openFiles() {
  F.open = true;
  F.sel = activeFile();
  F.erase = -1;
}

// returns 'play' once a file is chosen (it is now the live save), 'back' for the title, else null
export function updateFiles() {
  if (input.take('pause')) return (F.open = false), sfx.ui(), 'back';
  const dy = (input.take('down') ? 1 : 0) - (input.take('up') ? 1 : 0);
  if (dy) {
    F.sel = (F.sel + dy + FILE_COUNT) % FILE_COUNT;
    F.erase = -1;
    sfx.ui();
  }
  if (input.take('leave')) erase(F.sel);
  if (input.take('confirm') | input.take('jump')) return play(F.sel);
  return F.result ? take() : null;
}
const take = () => {
  const r = F.result;
  F.result = null;
  return r;
};
function play(i) {
  useFile(i);
  F.open = false;
  F.erase = -1;
  sfx.ui(true);
  return 'play';
}
function erase(i) {
  if (!fileSummary(i)) return sfx.ui();
  if (F.erase !== i) return (F.erase = i), sfx.ui();
  eraseFile(i);
  F.erase = -1;
  sfx.ui(true);
}

canvas.addEventListener('pointerdown', e => {
  if (!F.open) return;
  const b = canvas.getBoundingClientRect(), x = ((e.clientX - b.left) * W) / b.width, y = ((e.clientY - b.top) * H) / b.height;
  const hit = [...F.boxes].reverse().find(r => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
  if (hit) {
    e.preventDefault();
    hit.on();
  }
});
const box = (x, y, w, h, on) => F.boxes.push({ x, y, w, h, on });

const ago = ms => {
  if (!ms) return '';
  const m = Math.floor((Date.now() - ms) / 60000);
  return m < 1 ? 'JUST NOW' : m < 60 ? m + ' MIN AGO' : m < 1440 ? Math.floor(m / 60) + ' HR AGO' : Math.floor(m / 1440) + ' DAYS AGO';
};

export function drawFiles(t) {
  F.boxes = [];
  dither(0, 0, W, H, C.ink, 9);
  panel('panel', 40, 18, W - 80, H - 36);
  text('SAVE FILES', W / 2, 28, C.gold, { align: 'center', k: 2 });
  const active = activeFile();
  for (let i = 0; i < FILE_COUNT; i++) {
    const s = fileSummary(i), x = 56, y = 52 + i * 58, w = W - 112, sel = F.sel === i, wiping = F.erase === i;
    rect(x, y, w, 52, sel ? (wiping ? C.coral : C.gold) : C.slate);
    rect(x + 1, y + 1, w - 2, 50, sel ? C.night : C.ink);
    text(`FILE ${i + 1}`, x + 8, y + 6, sel ? C.gold : C.paper, { k: 2 });
    if (!s) {
      text('NEW GAME', x + 96, y + 10, sel ? C.lime : C.fog, { k: 2 });
      text('AN EMPTY FILE. START FRESH FROM THE CRASH SITE.', x + 96, y + 32, C.stone);
    } else {
      text(`WORLD ${s.world}: ${REGIONS[s.world - 1].name}`, x + 96, y + 6, C.paper);
      text(s.place.toUpperCase(), x + 96, y + 16, C.mist);
      text(`${s.cleared}/${s.total} LEVELS`, x + 96, y + 28, C.lime);
      text(`HERO LV ${s.lv}`, x + 196, y + 28, C.sky);
      text(`${s.trophies}/10 TROPHIES`, x + 276, y + 28, C.gold);
      text(`${fmt(s.shards)} SHARDS`, x + 96, y + 39, C.ice);
      text(`MASTERY ${s.mastery}`, x + 196, y + 39, C.fog);
      if (s.played) text(ago(s.played), x + 276, y + 39, i === active ? C.mist : C.stone);
    }
    box(x, y, w - 60, 52, () => {
      if (F.sel === i) F.result = play(i);
      else (F.sel = i), (F.erase = -1), sfx.ui();
    });
    if (s) {
      rect(x + w - 54, y + 4, 48, 12, wiping ? C.coral : C.slate);
      rect(x + w - 53, y + 5, 46, 10, C.ink);
      text(wiping ? 'SURE?' : 'ERASE', x + w - 30, y + 7, wiping ? C.coral : C.fog, { align: 'center' });
      box(x + w - 54, y + 4, 48, 12, () => ((F.sel = i), erase(i)));
    }
  }
  if (F.erase >= 0) text(`PRESS Q (OR SURE?) AGAIN TO ERASE FILE ${F.erase + 1} FOR GOOD`, W / 2, H - 52, C.coral, { align: 'center' });
  text('UP/DOWN: PICK   ENTER: PLAY   Q: ERASE   ESC: TITLE', W / 2, H - 32, C.fog, { align: 'center' });
  text('YOUR GAME SAVES BY ITSELF AFTER EVERY LEVEL', W / 2, H - 42, C.stone, { align: 'center' });
}
