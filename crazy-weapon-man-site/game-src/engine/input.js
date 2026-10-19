// Input: keyboard + gamepad mapped to actions. Poll once per simulation step.
//   held(a)     true while down
//   pressed(a)  true on the step it went down (edge), buffered until consumed or 0.12s old
import { KEYS } from '../config.js';
import { bindTouchControls } from './touch-controls.js';

const ACTIONS = Object.keys(KEYS);
const down = new Set();
const touch = new Set();
const touchFresh = new Set();
const fresh = new Set(); // keys that went down since the last poll (catches taps shorter than a frame)
const state = Object.fromEntries(ACTIONS.map(a => [a, { held: false, pressedAt: -1, consumed: true }]));
let now = 0;

const codeToActions = new Map();
for (const a of ACTIONS) for (const code of KEYS[a]) (codeToActions.get(code) || codeToActions.set(code, []).get(code)).push(a);

window.addEventListener('keydown', e => {
  if (codeToActions.has(e.code)) e.preventDefault(); // stop Alt menus, Space scrolling, Ctrl shortcuts
  if (e.repeat) return;
  down.add(e.code);
  fresh.add(e.code);
});
window.addEventListener('keyup', e => {
  down.delete(e.code);
  if (codeToActions.has(e.code)) e.preventDefault();
});
window.addEventListener('blur', () => { down.clear(); fresh.clear(); touch.clear(); touchFresh.clear(); });

// Standard gamepad layout: A jump, X attack, B dash, Y special, LB/RB dash, Start pause
const PAD = { jump: [0], attack: [2], dash: [1, 4, 5], special: [3], pause: [9], confirm: [0, 9] };

function padHeld(a) {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const p of pads) {
    if (!p || !p.connected) continue;
    const ax = p.axes[0] || 0,
      ay = p.axes[1] || 0;
    if (a === 'left' && (ax < -0.4 || p.buttons[14]?.pressed)) return true;
    if (a === 'right' && (ax > 0.4 || p.buttons[15]?.pressed)) return true;
    if (a === 'up' && (ay < -0.5 || p.buttons[12]?.pressed)) return true;
    if (a === 'down' && (ay > 0.5 || p.buttons[13]?.pressed)) return true;
    for (const b of PAD[a] || []) if (p.buttons[b]?.pressed) return true;
  }
  return false;
}

export const input = {
  // call once per simulation step
  poll(t) {
    now = t;
    for (const a of ACTIONS) {
      const s = state[a];
      const tapped = touchFresh.has(a) || KEYS[a].some(c => fresh.has(c));
      const h = KEYS[a].some(c => down.has(c)) || touch.has(a) || padHeld(a);
      if ((h && !s.held) || tapped) {
        s.pressedAt = t;
        s.consumed = false;
      }
      s.held = h;
    }
    fresh.clear();
    touchFresh.clear();
  },
  held: a => state[a].held,
  pressed(a, buffer = 0.12) {
    const s = state[a];
    return !s.consumed && now - s.pressedAt <= buffer;
  },
  consume(a) {
    state[a].consumed = true;
  },
  // pressed + consume in one go
  take(a, buffer) {
    if (input.pressed(a, buffer)) {
      input.consume(a);
      return true;
    }
    return false;
  },
  axis: () => (input.held('right') ? 1 : 0) - (input.held('left') ? 1 : 0),
  anyKey: () => down.size > 0 || touch.size > 0
};

bindTouchControls((actions,reset) => {
  if(reset)touchFresh.clear();
  if(actions.has('attack'))actions.add('confirm');
  for (const a of actions) if (!touch.has(a)) touchFresh.add(a);
  touch.clear();for (const a of actions) touch.add(a);
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){down.clear();fresh.clear();touch.clear();touchFresh.clear();}
});
