// Crazy Weapon Man (next) — shared constants. Everything is in screen pixels at 480x270.
export const W = 480;
export const H = 270;
export const GROUND = 206; // y of the ground surface
export const STEP = 1 / 60; // fixed simulation step (seconds)

export const PX_ASSETS = '/assets/px/'; // shared pixel-art export (art-src/build_assets.py)
export const NEXT_ASSETS = '/assets/hero/'; // new-game-only art (art-src/build_next.py)

// 32-colour palette (names match art-src/pixel.py)
export const C = {
  ink: '#1a1428', night: '#2b2442', slate: '#3e3a5c', stone: '#5d5a7a', fog: '#8a89a6', mist: '#c3c4d6',
  paper: '#f4f1e8', skinD: '#a35a4a', skinM: '#d98e6e', skin: '#f2c3a0', woodD: '#5d2f14', wood: '#8a4f22',
  rust: '#c4501f', orange: '#f08a2c', gold: '#ffc15a', cream: '#f8e08e', sand: '#c9a66b', wine: '#7a1f2b',
  red: '#c4363e', coral: '#f06a52', pine: '#2f5a2c', leaf: '#4f8a3a', grass: '#7cc254', lime: '#b7e27a',
  navy: '#1d2b6b', blue: '#2f5fbf', sky: '#5aa6f0', ice: '#a8dcfd', indigo: '#22107f', violet: '#7a4bc2',
  teal: '#3bb8a8', pink: '#ff6fb5'
};

export const HERO = {
  w: 11, // collision box (narrower than the 17px sprite)
  h: 22,
  speed: 112, // px/s
  accel: 900,
  friction: 1100,
  jump: 262, // px/s initial
  gravity: 760,
  maxFall: 330,
  coyote: 0.08,
  jumpBuffer: 0.1,
  dashSpeed: 270,
  dashTime: 0.16,
  dashCooldown: 0.55,
  hp: 100,
  invuln: 0.7 // after taking a hit
};

// Keyboard map. Each action has two sets so laptop users can avoid Ctrl/Alt.
export const KEYS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['AltLeft', 'AltRight', 'KeyX', 'KeyK'],
  attack: ['ControlLeft', 'ControlRight', 'KeyZ', 'KeyJ'],
  special: ['Space', 'KeyC', 'KeyL'],
  dash: ['ShiftLeft', 'ShiftRight', 'KeyV', 'KeyI'],
  pause: ['Escape', 'KeyP'],
  inv: ['KeyE', 'KeyB', 'Tab'],
  bag: ['KeyB', 'Tab'], // on the map E is POWERS, so the bag is B / Tab there (in a level all three open it)
  leave: ['KeyQ'],
  undo: ['KeyU', 'Backspace'],
  lock: ['KeyG'],
  sheet: ['KeyR'],
  temper: ['KeyT'],
  den: ['KeyH'], // the Beast Den, from the map
  anvil: ['KeyG'], // the Legendary Anvil, in the bag on the map
  confirm: ['Enter', 'Space', 'KeyZ', 'KeyJ', 'ControlLeft']
};
