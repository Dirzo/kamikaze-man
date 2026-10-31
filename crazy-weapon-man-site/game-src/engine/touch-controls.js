// Phone controls, Dead Cells style: the game fills the screen and the controls float over it.
//   left half   a floating stick: it lands wherever your thumb does and follows it if you drag past its rim
//   right side  HIT (big), JUMP and DASH round it, SKILL tucked inside with its cooldown ring.
//               A thumb can slide from one button onto the next (DASH into HIT is a dash stab)
//   top right   small soft keys that change with the scene (PAUSE / LOG in a level, BAG / MASTERY /
//               DEN / POWERS / GLOBE on the map, CLOSE over a menu ...)
// Everything still goes through input.js as the same actions the keyboard sends, so every move the
// keyboard can do (down+jump to drop, down+dash to rev, down+attack in the air to plunge) works here.
// Shown only on touch devices: html.touch is set when the main pointer is a finger, or the moment a
// finger touches the page, and cleared again if a keyboard is used on a mouse-first device.

const coarseMain = () => matchMedia('(pointer: coarse)').matches;
export const touchUI = () => document.documentElement.classList.contains('touch');
// keyboard words in prompts, or what to press on a phone instead
export const tk = (keys, touch) => (touchUI() ? touch : keys);

export function setTouchUI(on) {
  const el = document.documentElement;
  if (el.classList.contains('touch') === on) return;
  el.classList.toggle('touch', on);
  dispatchEvent(new Event('resize')); // gfx.js refits the playfield for the new layout
}

// The stick: a thumb offset (px) -> knob offset and the actions it holds. Left / right need a third
// of the travel; up and down need a firm push close to straight up or down, so a thumb resting a
// little low never drops you through a ledge or starts a rev when you meant to dash.
export function joystickVector(dx, dy, radius) {
  const length = Math.hypot(dx, dy), scale = length > radius ? radius / length : 1;
  const x = (dx * scale) / radius, y = (dy * scale) / radius;
  const actions = [];
  if (Math.hypot(x, y) >= 0.22) {
    if (x < -0.35) actions.push('left');
    if (x > 0.35) actions.push('right');
    const steep = Math.abs(y) > Math.abs(x) * 0.84; // within ~50 degrees of straight up / down
    if (y < -0.55 && steep) actions.push('up');
    if (y > 0.55 && steep) actions.push('down');
  }
  return { x: x * radius, y: y * radius, actions };
}

// the button under a finger: the nearest centre within reach (slack > 1 is forgiving, for a fresh tap)
export function buttonAt(buttons, px, py, slack = 1) {
  let best = null, bd = Infinity;
  for (const b of buttons) {
    const d = Math.hypot(px - b.cx, py - b.cy) / b.r;
    if (d <= slack && d < bd) (best = b), (bd = d);
  }
  return best;
}

const buzz = ms => {
  try { navigator.vibrate?.(ms); } catch (_) { /* no haptics here */ }
};

export function bindTouchControls(onChange) {
  const root = document.getElementById('touch');
  const zone = document.getElementById('stick-zone'), stick = document.getElementById('joystick'), pad = document.getElementById('pad');
  const soft = document.getElementById('softkeys');
  const sources = new Map(); // pointer id -> the actions it holds
  const padPointers = new Map(); // pointer id -> the pad button it holds
  const padDown = new Set(); // every finger on the pad, on a button or not
  let stickId = null, base = null;
  const publish = () => onChange(new Set([...sources.values()].flat()));
  const capture = (el, id) => {
    try { el.setPointerCapture(id); } catch (_) { /* synthetic test pointers have no capture */ }
  };

  // ---- the stick
  const paintStick = (x = 0, y = 0) => {
    stick.style.setProperty('--stick-x', x + 'px');
    stick.style.setProperty('--stick-y', y + 'px');
    stick.dataset.held = stickId === null ? 'false' : 'true';
  };
  const placeStick = (cx, cy) => {
    if (cx == null) return stick.style.removeProperty('left'), stick.style.removeProperty('top'), stick.style.removeProperty('bottom');
    const z = zone.getBoundingClientRect();
    stick.style.left = cx - z.left - stick.offsetWidth / 2 + 'px';
    stick.style.top = cy - z.top - stick.offsetHeight / 2 + 'px';
    stick.style.bottom = 'auto';
  };
  const stickMove = e => {
    if (e.pointerId !== stickId) return;
    e.preventDefault();
    const radius = stick.offsetWidth * 0.36;
    let dx = e.clientX - base.x, dy = e.clientY - base.y;
    const far = Math.hypot(dx, dy);
    if (far > radius * 1.25) {
      // dragged past the rim: the base follows the thumb, so a long drag never loses the stick
      const k = (far - radius * 1.25) / far;
      base.x += dx * k;
      base.y += dy * k;
      dx = e.clientX - base.x;
      dy = e.clientY - base.y;
      placeStick(base.x, base.y);
    }
    const v = joystickVector(dx, dy, radius);
    sources.set(stickId, v.actions);
    paintStick(v.x, v.y);
    publish();
  };
  const stickUp = e => {
    if (e.pointerId !== stickId) return;
    sources.delete(stickId);
    stickId = base = null;
    placeStick();
    paintStick();
    publish();
  };
  zone.addEventListener('pointerdown', e => {
    e.preventDefault();
    setTouchUI(true);
    if (stickId !== null) return;
    stickId = e.pointerId;
    base = { x: e.clientX, y: e.clientY };
    capture(zone, stickId);
    placeStick(base.x, base.y);
    stickMove(e);
  });
  zone.addEventListener('pointermove', stickMove);
  for (const n of ['pointerup', 'pointercancel', 'lostpointercapture']) zone.addEventListener(n, stickUp);

  // ---- the pad: one surface for all four buttons so a thumb can roll from one onto the next
  let geo = [];
  const measure = () => {
    geo = [...pad.querySelectorAll('[data-action]')].filter(b => b.offsetParent !== null).map(el => {
      const r = el.getBoundingClientRect();
      return { el, action: el.dataset.action, cx: r.left + r.width / 2, cy: r.top + r.height / 2, r: r.width / 2 };
    });
  };
  const holdButton = (id, b) => {
    const was = padPointers.get(id);
    if (was === b) return;
    if (was) was.el.dataset.held = [...padPointers].some(([p, x]) => p !== id && x === was) ? 'true' : 'false';
    if (b) {
      padPointers.set(id, b);
      b.el.dataset.held = 'true';
      sources.set(id, [b.action]);
      buzz(b.action === 'attack' ? 6 : 10);
    } else {
      padPointers.delete(id);
      sources.delete(id);
    }
    publish();
  };
  pad.addEventListener('pointerdown', e => {
    e.preventDefault();
    setTouchUI(true);
    measure();
    padDown.add(e.pointerId);
    capture(pad, e.pointerId);
    holdButton(e.pointerId, buttonAt(geo, e.clientX, e.clientY, 1.3));
  });
  pad.addEventListener('pointermove', e => {
    if (!padDown.has(e.pointerId)) return; // (a thumb that landed between buttons still slides onto one)
    const was = padPointers.get(e.pointerId);
    // stay on the held button until the thumb is clearly on another one (no flicker on the seam)
    if (was && Math.hypot(e.clientX - was.cx, e.clientY - was.cy) <= was.r * 1.15) return;
    const b = buttonAt(geo, e.clientX, e.clientY, 1);
    if (b || !was) holdButton(e.pointerId, b);
    else if (Math.hypot(e.clientX - was.cx, e.clientY - was.cy) > was.r * 1.8) holdButton(e.pointerId, null);
  });
  const padUp = e => {
    padDown.delete(e.pointerId);
    if (padPointers.has(e.pointerId)) holdButton(e.pointerId, null);
    sources.delete(e.pointerId);
  };
  for (const n of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(n, padUp);

  // ---- soft keys: taps. An action key is held for this tap only; a function key just runs
  soft.addEventListener('pointerdown', e => {
    const k = e.target.closest('button');
    if (!k) return;
    e.preventDefault();
    setTouchUI(true);
    buzz(8);
    const def = softDefs[+k.dataset.i];
    if (!def) return;
    if (def.fn) return def.fn();
    onChange(new Set([...sources.values()].flat().concat(def.action)));
    publish(); // pressed and let go: input.js keeps the tap (touchFresh) for the next step
  });

  // ---- modes: which parts show and what the pad buttons say
  let modeKey = '', softDefs = [];
  function setMode(mode, keys = [], labels = {}) {
    const key = mode + '|' + keys.map(k => k.label + (k.on ? '*' : '')).join(',') + '|' + JSON.stringify(labels);
    if (key === modeKey) return;
    const changedMode = !modeKey.startsWith(mode + '|');
    modeKey = key;
    root.dataset.mode = mode;
    for (const b of pad.querySelectorAll('[data-action]')) {
      const l = labels[b.dataset.action];
      b.hidden = l === null;
      b.textContent = l || b.dataset.label;
    }
    softDefs = keys;
    soft.replaceChildren(...keys.map((k, i) => {
      const b = document.createElement('button');
      b.textContent = k.label;
      b.dataset.i = i;
      if (k.on) b.classList.add('on');
      b.tabIndex = -1;
      return b;
    }));
    if (changedMode) reset(); // nothing held carries into a menu
  }
  // the special's cooldown ring on SKILL: 1 = ready
  let skillK = -1;
  const skillBtn = pad.querySelector('[data-action=special]');
  function setSkill(k) {
    k = Math.round(Math.max(0, Math.min(1, k)) * 40) / 40;
    if (k === skillK) return;
    if ((skillK < 1) && k === 1 && skillK >= 0) skillBtn.classList.remove('ping'), void skillBtn.offsetWidth, skillBtn.classList.add('ping');
    skillK = k;
    skillBtn.style.setProperty('--cool', k);
    skillBtn.dataset.ready = k >= 1 ? 'true' : 'false';
  }

  const reset = () => {
    sources.clear();
    padPointers.clear();
    padDown.clear();
    stickId = base = null;
    placeStick();
    paintStick();
    for (const b of pad.querySelectorAll('[data-action]')) b.dataset.held = 'false';
    onChange(new Set(), true);
  };
  addEventListener('blur', reset);
  document.addEventListener('visibilitychange', () => document.hidden && reset());
  addEventListener('orientationchange', reset);
  root.addEventListener('contextmenu', e => e.preventDefault());

  // who sees the controls
  if (coarseMain()) setTouchUI(true);
  addEventListener('pointerdown', e => e.pointerType === 'touch' && setTouchUI(true), { capture: true });
  addEventListener('keydown', () => !coarseMain() && setTouchUI(false), { capture: true });
  return { reset, setMode, setSkill };
}
