// How each zone's world comes alive (game/ambience.js plays it; art-src/biomes.py draws the art).
// Every zone is dressed for its beastkin family, whimsical like MapleStory: parallax layers that
// drift at their own depth, props along the route that sway, flicker and steam, weather, critters in
// the sky and a few light terrain touches. Pure data, safe to import from tests.
//
//   scroll   how fast each of the four layers follows the camera (sky, far, mid, near)
//   lift     how far each layer slides down when you climb (a little depth when looking up)
//   clouds   drifting clouds over the sky: [count, colour, shade, speed px/s, top y, bottom y]
//   sky      animated extras on the layers: aurora, fireworks, geese, glints, smoke, mist ...
//   weather  screen particles: [kind, count]; kinds are drawn by ambience.js
//   props    route decorations: [sprite, weight, fps (0 = still, 'pick' = a random variant)];
//            light marks a prop that glows (and lights up the dark in the night bazaar)
//   pit      what a pit is: 'spikes' at the bottom, or a liquid surface rise px below the lower rim
//   surface  terrain touches: ice sheets (slippery) or conveyor belts (they carry you)
//   wind     gusts that push you about (the mountain temple)
//   dark     how dark the night is between the lights (0..1)
export const BIOMES = {
  graveyard: {
    scroll: [0, 0.06, 0.16, 0.32], lift: [0, 0.03, 0.08, 0.16],
    clouds: [5, '#fff4f4', '#f4c4d8', 3, 20, 100],
    sky: ['geese'],
    weather: [['leaf', 10], ['fluff', 10], ['firefly', 6]],
    props: { gap: [34, 80], list: [['sword', 4, 'pick'], ['grave', 3, 'pick'], ['tuft', 5, 4], ['banner', 2, 6], ['nest', 1, 3], ['daisy', 4, 2]] },
    pit: { kind: 'spikes' }
  },
  'ranger-forest': {
    scroll: [0, 0.05, 0.14, 0.3], lift: [0, 0.03, 0.08, 0.16],
    sky: ['aurora'],
    weather: [['snow', 60], ['snowBig', 14]],
    props: { gap: [30, 72], list: [['pine', 4, 'pick'], ['snowman', 1, 1.2], ['crystal', 3, 5], ['target', 1, 0], ['drift', 2, 0.5]] },
    pit: { kind: 'spikes' },
    surface: { ice: 3 } // every third stretch of ground (never the runway or the arena) is an ice sheet
  },
  'turtle-lagoon': {
    scroll: [0, 0.05, 0.15, 0.34], lift: [0, 0.03, 0.08, 0.16],
    clouds: [4, '#ffffff', '#c8e8f8', 4, 14, 80],
    sky: ['seaGlints', 'leapingFish'],
    weather: [['dragonfly', 4], ['bubble', 6]],
    props: { gap: [30, 70], list: [['cattail', 5, 4], ['bamboo', 2, 0], ['frog', 1, 1], ['lantern', 2, 2], ['lily', 2, 1.5]] },
    pit: { kind: 'liquid', rise: 16, fill: '#2f9a9a', deep: '#1e6a7a', fps: 4 }
  },
  'thieves-bazaar': {
    scroll: [0, 0.06, 0.18, 0.36], lift: [0, 0.03, 0.08, 0.16],
    sky: ['fireworks', 'stringLights'],
    weather: [['moth', 8]],
    props: { gap: [36, 74], list: [['lamp', 4, 6, { light: 50 }], ['crate', 2, 0], ['fish', 2, 3], ['pot', 2, 5, { light: 26 }], ['eyes', 3, 'blink']] },
    pit: { kind: 'liquid', rise: 20, fill: '#120c2e', deep: '#0a0820', fps: 0 },
    dark: 0.52 // pools of darkness: the lamps (and you) light the way
  },
  'sakura-shrine': {
    scroll: [0, 0.05, 0.15, 0.32], lift: [0, 0.03, 0.08, 0.16],
    clouds: [4, '#fff4f8', '#f4d0e0', 3, 20, 90],
    sky: ['birds'],
    weather: [['petal', 46], ['petalBig', 8]],
    props: { gap: [34, 78], list: [['tourou', 3, 1.5, { light: 18 }], ['torii', 1, 0], ['sapling', 3, 1], ['kitsune', 2, 0.8], ['fountain', 2, 2.5]] },
    pit: { kind: 'liquid', rise: 16, fill: '#4a8ac8', deep: '#2a5aa0', fps: 3 }
  },
  'mountain-monastery': {
    scroll: [0, 0.04, 0.14, 0.32], lift: [0, 0.03, 0.08, 0.16],
    clouds: [4, '#ffffff', '#d8e4f0', 6, 16, 70],
    sky: ['eagle', 'mist'],
    weather: [['snow', 14], ['leaf', 6]],
    props: { gap: [34, 76], list: [['flags', 3, 6], ['bell', 2, 'wind'], ['wheel', 2, 5], ['cairn', 2, 0], ['incense', 2, 4]] },
    pit: { kind: 'liquid', rise: 26, fill: '#f4f8ff', deep: '#d8e4f0', fps: 2 },
    wind: { calm: [5, 8], warn: 1.1, gust: 2.6, push: 30, air: 46 }
  },
  'storm-forge': {
    scroll: [0, 0.05, 0.16, 0.34], lift: [0, 0.03, 0.08, 0.16],
    sky: ['smoke', 'heat'],
    weather: [['ember', 34]],
    props: { gap: [32, 72], list: [['anvil', 3, 0], ['brazier', 3, 8, { light: 22 }], ['vent', 2, 5], ['coal', 2, 1], ['rack', 1, 0]] },
    pit: { kind: 'liquid', rise: 18, fill: '#e0502a', deep: '#a02a1e', fps: 5, glow: true },
    surface: { belt: 3, speed: 34 } // conveyor belts: they carry you (and run both ways)
  },
  'witch-cottage': {
    scroll: [0, 0.05, 0.15, 0.32], lift: [0, 0.03, 0.08, 0.16],
    clouds: [5, '#fffaf0', '#f0e0c0', 3, 18, 90],
    sky: ['chimney', 'sunbeams'],
    weather: [['bee', 5], ['butterfly', 5], ['fluff', 12]],
    props: { gap: [30, 70], list: [['honey', 3, 2], ['hive', 2, 6], ['mush', 3, 0], ['lamp', 2, 1, { light: 18 }], ['sign', 1, 0], ['flowers', 4, 2]] },
    pit: { kind: 'liquid', rise: 18, fill: '#f0a830', deep: '#c07818', fps: 2 }
  },
  'ninja-castle': {
    scroll: [0, 0.05, 0.17, 0.36], lift: [0, 0.03, 0.08, 0.16],
    sky: ['moonClouds', 'ninja'],
    weather: [['firefly', 12], ['leaf', 5]],
    props: { gap: [34, 76], list: [['tourou', 3, 1.5, { light: 18 }], ['chochin', 3, 4, { light: 20 }], ['bamboo', 2, 0], ['target', 1, 0], ['gong', 1, 1]] },
    pit: { kind: 'liquid', rise: 18, fill: '#141040', deep: '#0a0828', fps: 3 }
  },
  'armory-vault': {
    scroll: [0, 0.06, 0.18, 0.36], lift: [0, 0.03, 0.08, 0.16],
    sky: ['avalanche'],
    weather: [['glint', 26], ['coin', 6]],
    props: { gap: [32, 70], list: [['chest', 2, 3], ['pile', 4, 0], ['gems', 3, 4], ['rack', 1, 0], ['crown', 1, 1.5]] },
    pit: { kind: 'liquid', rise: 16, fill: '#c8902a', deep: '#a87020', fps: 4 }
  }
};
export const biomeOf = id => BIOMES[id] || null;

// Terrain touches pick ground stretches by their order along the route, never the runway (the first)
// or the arena (the last), so the speedrun layout and its reach test are untouched.
export function touchedGrounds(map, every) {
  const grounds = map.platforms.filter(p => p.ground && p.x > 0 && p.x < map.bossLeft - 16).sort((a, b) => a.x - b.x);
  return grounds.filter((p, k) => k % every === every - 1 && p.w >= 64);
}
