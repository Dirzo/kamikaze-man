import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TYPE_LIST, ELEMENTS, ELEMENT_LIST } from '../game-src/data/weapons.js';
import { QUIRK_LIST } from '../game-src/data/quirks.js';
import { buildSong } from '../game-src/engine/audio.js';
import { ZONES, TITLE_MUSIC, BOSS_MUSIC, bossSong, zoneSong } from '../game-src/data/zones.js';

const notes = sg => sg.steps.flat().filter(e => e[0] !== 'd');
const ok = (id, spec) => {
  const sg = buildSong(id, spec);
  assert.ok(sg.steps.length > 0, id);
  for (const e of notes(sg)) assert.ok(Number.isFinite(e[1]) && e[1] > 20 && e[1] < 110, `${id}: note ${e[1]}`);
  return sg;
};

test('every zone, arrangement, boss remix and the title builds clean notes', () => {
  ok('title', TITLE_MUSIC);
  ZONES.forEach((Z, z) => {
    for (const [kind, dark] of [[null, 0], ['level', 3], ['fort', 0], ['castle', 0], ['secret', 0]]) {
      const s = zoneSong(z, kind, dark);
      ok(s.id, s.spec);
    }
    for (const kind of Object.keys(BOSS_MUSIC)) ok(`boss:${kind}:${z}`, bossSong(kind, z));
  });
});

test('themes fill exactly a four-bar phrase', () => {
  const len = t => t.split(/\s+/).filter(x => x && x !== '|').length;
  for (const Z of ZONES) {
    const m = Z.music, per = ((m.bar || 16) * 4) / 2;
    assert.equal(len(m.theme), per, Z.id);
    assert.equal(len(m.themeB), per, Z.id);
    if (m.bossTheme) assert.equal(len(m.bossTheme), 32, Z.id);
  }
});

test('each zone has its own sound and each level kind its own arrangement', () => {
  // the vault reprises the graveyard's tune, but in its own key and kit
  const sig = ZONES.map(Z => [Z.music.theme, Z.music.drums, Z.music.scale].join());
  assert.equal(new Set(sig).size, ZONES.length);
  for (let z = 0; z < ZONES.length; z++) {
    const ids = new Set(['level', 'fort', 'castle', 'secret'].map(k => zoneSong(z, k, k === 'level' ? 3 : 0).id));
    assert.equal(ids.size, 4);
  }
});

test('a themed loop runs 32 bars and never repeats a section note for note', () => {
  ZONES.forEach((Z, z) => {
    const sg = buildSong('vary:' + z, Z.music), bar = Z.music.bar || 16, lead = [];
    assert.equal(sg.steps.length, 32 * bar, Z.id);
    for (let s = 0; s < 8; s++) {
      const part = sg.steps.slice(s * 4 * bar, (s + 1) * 4 * bar).map(st => st.filter(e => e[0] === 'l' || e[0] === 'd').map(e => e.join()).join('/')).join('|');
      lead.push(part);
    }
    assert.equal(new Set(lead).size, 8, Z.id);
  });
});

test('every weapon type, element and quirk has its own sound', async () => {
  const src = readFileSync(new URL('../game-src/engine/audio.js', import.meta.url), 'utf8');
  const table = (from, to) => src.slice(src.indexOf(from), src.indexOf(to));
  const has = (body, keys, label) => {
    for (const k of keys) assert.match(body, new RegExp(`\\n  ${k}: (k )?\\(?\\)? ?=>`), `${label} ${k}`);
  };
  has(table('const SIG = {', 'const ELEMENT_SFX'), TYPE_LIST, 'weapon');
  has(table('const ELEMENT_SFX', 'const QUIRK_SFX'), ELEMENT_LIST.map(e => ELEMENTS[e].effect), 'element');
  // the honk quirk already honks (sfx.honk)
  has(table('const QUIRK_SFX', 'export const sfx'), QUIRK_LIST.filter(q => q !== 'honk'), 'quirk');
});
