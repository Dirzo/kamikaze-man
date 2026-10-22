import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BIOMES, touchedGrounds } from '../game-src/data/biomes.js';
import { ZONES } from '../game-src/data/zones.js';
import { makeMap } from '../game-src/data/maps.js';
import { LEVELS } from '../game-src/data/overworld.js';

const PX = new URL('../public/assets/px/', import.meta.url);
const man = JSON.parse(fs.readFileSync(new URL('manifest.json', PX)));

test('every zone has a living environment with its art exported', () => {
  for (const z of ZONES) {
    const B = BIOMES[z.id], art = man.biomes?.[z.id];
    assert.ok(B && art, z.id + ' has no environment');
    assert.equal(art.layers.length, 4, z.id + ' needs four parallax layers');
    assert.equal(B.scroll.length, 4);
    for (const f of [...art.layers, art.atlas]) assert.ok(fs.existsSync(new URL(f, PX)), f + ' missing');
    for (const k of ['ground', 'lip', 'ceil', 'pit']) assert.ok(art.sprites[k], z.id + ' has no ' + k);
    for (const [s] of B.props.list) assert.ok(art.sprites[s], z.id + ' prop ' + s + ' is not in its atlas');
    if (B.surface?.ice) assert.ok(art.sprites.ice, z.id + ' has ice sheets but no ice art');
    if (B.surface?.belt) assert.ok(art.sprites.belt, z.id + ' has belts but no belt art');
  }
});

test('terrain touches never land on the runway or in the arena', () => {
  const maps = [...ZONES.map((_, z) => makeMap(z)), ...LEVELS.filter(n => n.zone === 1 || n.zone === 6).map(n => makeMap(n.zone, n.id))];
  for (const m of maps) {
    const picked = touchedGrounds(m, 3);
    const grounds = m.platforms.filter(p => p.ground).sort((a, b) => a.x - b.x);
    assert.ok(!picked.includes(grounds[0]), 'the runway was picked');
    assert.ok(picked.every(p => p.x < m.bossLeft - 16 && p.y > 0), 'the arena was picked');
  }
  // the snowy woods and the forge always have some to give
  assert.ok(touchedGrounds(makeMap(1), BIOMES['ranger-forest'].surface.ice).length > 0);
  assert.ok(touchedGrounds(makeMap(6), BIOMES['storm-forge'].surface.belt).length > 0);
});
