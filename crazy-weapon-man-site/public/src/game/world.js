// The one shared game state. Modules import `world` and read/write it; nothing else is global.
// the trailer's clean frame (game/trailer.js): the HUDs stay hidden while it is on
export const cinema = { on: false };
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
  spx: [], // special effects that outlive the move (specials.js)
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
    nearDrop: null,
    deadT: 0,
    killsSinceDrop: 0,
    nextId: 1,
    enemies: [],
    seenMutations: new Set(),
    echoes: [],
    shots: [],
    spx: [],
    bolts: [],
    drops: [],
    bag: new Array(24).fill(null),
    bagNew: 0,
    inv: null,
    lock: null,
    quirkCount: 0,
    quick: null, // a just-looted weapon that beats yours: DOWN equips it
    swarmCombo: null,
    level: null, // the overworld node being played (null in a classic ten-map run)
    levelEnd: null,
    run: null, // speedrun clock, splits and damage log (speedrun.js)
    pickups: [],
    platforms: [],
    director: null,
    boss: null,
    kills: 0,
    shards: 0,
    secret: null, // this map's easter egg (secrets.js)
    secretsFound: 0,
    relics: [], // this level's five weapon relics (relics.js)
    relicMask: 0, // relics taken on this attempt (bits)
    relicsOwned: 0, // relics this level had before the attempt (bits, from the overworld save)
    hidden: null, // the map's hidden portal and its secret room (hidden.js)
    gimmick: null, // ghost / scroll / water / ice (gimmicks.js)
    egg: null, // a War Goose egg waiting on this map (mount.js)
    loose: null, // a War Goose without a rider
    temper: 0, // the post-game difficulty tier being played (data/temper.js)
    cardUps: [], // Monster Book cards that went up a tier this level
    best: null,
    toasts: [],
    phase: 'play'
  });
}
export const newId = () => world.nextId++;
