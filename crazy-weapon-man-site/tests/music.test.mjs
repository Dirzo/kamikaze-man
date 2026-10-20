import test from 'node:test';
import assert from 'node:assert/strict';
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
