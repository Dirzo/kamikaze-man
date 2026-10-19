// The one shared game state. Modules import `world` and read/write it; nothing else is global.
export const world = {
  t: 0, // seconds of game time (stops during hit-stop and pause)
  zone: 0,
  wave: 0,
  map: null,
  cameraX: 0,
  cameraY: 0,
  hero: null,
  enemies: [],
  seenMutations: new Set(),
  echoes: [],
  shots: [], // hero projectiles
  bolts: [], // enemy projectiles
  drops: [], // weapons lying on the ground
  bag: new Array(24).fill(null), // inventory.js: weapons carried this run
  inv: null, // open inventory window state
  pickups: [], // shards, hearts
  platforms: [], // {x, y, w}
  director: null, // wave director state (waves.js)
  boss: null,
  kills: 0,
  shards: 0,
  best: null, // best weapon found this run
  toasts: [], // HUD toasts
  phase: 'play', // play | clear | dead
  nextId: 1
};

export function resetWorld() {
  Object.assign(world, {
    t: 0,
    zone: 0,
    wave: 0,
    map: null,
    cameraX: 0,
  cameraY: 0,
    hero: null,
    forge: null,
    nearDrop: null,
    deadT: 0,
    killsSinceDrop: 0,
    nextId: 1,
    enemies: [],
    seenMutations: new Set(),
    echoes: [],
    shots: [],
    bolts: [],
    drops: [],
    bag: new Array(24).fill(null),
    bagNew: 0,
    inv: null,
    lock: null,
    quirkCount: 0,
    quick: null, // a just-looted weapon that beats yours: DOWN equips it
    swarmCombo: null,
    pickups: [],
    platforms: [],
    director: null,
    boss: null,
    kills: 0,
    shards: 0,
    best: null,
    toasts: [],
    phase: 'play'
  });
}
export const newId = () => world.nextId++;
