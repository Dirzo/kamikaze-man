// The one shared game state. Modules import `world` and read/write it; nothing else is global.
export const world = {
  t: 0, // seconds of game time (stops during hit-stop and pause)
  zone: 0,
  wave: 0,
  hero: null,
  enemies: [],
  echoes: [],
  shots: [], // hero projectiles
  bolts: [], // enemy projectiles
  drops: [], // weapons lying on the ground
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
    hero: null,
    forge: null,
    nearDrop: null,
    deadT: 0,
    killsSinceDrop: 0,
    nextId: 1,
    enemies: [],
    echoes: [],
  shots: [],
    bolts: [],
    drops: [],
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
