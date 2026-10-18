// Geese and sleeper elites (phase 4).
//
//   War Goose  - a new melee enemy (helmeted goose, leap-bite). About 1 in 10 ground spawns in any
//                zone is swapped for a goose. Honks when it winds up; sometimes says worse things.
//   Sleepers   - about 1 in 4 ground elites spawns asleep ("Zzz"). It does nothing until it is hit or
//                the hero walks up to it, then wakes with a grumpy line and fights. Awake sleepers
//                grumble now and then and get last words.
// Speech bubbles are solid dark pixel boxes (light text; the pixel font outlines glyphs in ink) drawn over the enemy; at most 2 on screen at once.
// Hooks: CWM_GOOSE.state(), CWM_GOOSE.forceSleeper(), CWM_GOOSE.say(e, line).
(() => {
  if (globalThis.CWM_GOOSE || typeof ED !== 'object') return;
  const pickL = a => a[Math.floor(Math.random() * a.length)];

  ED.goose = {
    w: 40,
    h: 44,
    hp: 0.85,
    dmg: 0.95,
    sp: 172,
    range: 46,
    wind: 0.34,
    col: '#f1efe4',
    shape: 'chicken', // legacy (nopx) body
    atk: 'leap',
    name: 'War Goose'
  };
  try {
    ENEMY_LESSONS.goose = {
      how: 'WAR GOOSE — honks, then lunges beak-first. Wears a helmet. Fears nothing.',
      hint: 'The honk is the warning. Hit it first or jump the lunge.'
    };
  } catch (_) {}

  const GOOSE_NAMES = ['War Goose', 'Grave Goose', 'Helmet Goose', 'Goose of Ill Omen', 'Absolute Unit (Goose)',
    'Goose, Knight-Errant', 'Unlicensed Goose', 'The Honkening'];
  const HONK = ['HONK', 'HONK!', 'HONK?!', 'HONK HONK', 'HONK.', 'HOOONK'];
  const GOOSE_RARE = ['PEACE WAS NEVER AN OPTION', 'THIS SWORD IS MINE NOW', 'HONK (THREATENING)',
    'I BITE KINGS', 'YOUR BREAD. NOW.'];
  const WAKE = ['FIVE MORE MINUTES...', 'WHO RANG THE DOOM BELL?', 'I WAS DREAMING OF SOUP', 'RUDE. VERY RUDE.',
    'OH NO. A HERO. GREAT.', "I'M UP! I'M UP!", "WAS I SNORING? DON'T ANSWER", 'MY SHIFT STARTS AT NOON',
    'YOU WOKE THE WRONG GUY', 'HANG ON, WHERE IS MY AXE', 'IS IT TUESDAY ALREADY?', 'I WAS ON BREAK'];
  const GRUMBLE = ['I HAD A NICE DREAM, TOO', 'THIS IS COMING OUT OF MY NAP', 'HEROES NEVER KNOCK',
    "I'M TELLING THE LICH", 'NO REFUNDS ON NAPS', 'COULD YOU NOT', 'I HATE MORNINGS. AND YOU.'];
  const LAST = ['BACK... TO BED...', 'WAKE ME... NEVER', 'TELL MY PILLOW...', 'WORTH IT', 'SNOOZE BUTTON...'];

  const G = { geese: 0, sleepers: 0, woke: 0, lines: 0, honks: 0, force: false };

  // ---- spawning ----
  const spawn0 = spawn;
  spawn = function (type, x, elite = false, yTop = null) {
    const d0 = ED[type];
    let t = type;
    if (!bossMode && d0 && !d0.air && type !== 'goose' && !elite && Math.random() < 0.1) t = 'goose';
    const before = E.length;
    const r = spawn0(t, x, elite, yTop);
    const e = E.length > before ? E.at(-1) : null;
    if (!e || e.boss) return r;
    if (t === 'goose') {
      G.geese++;
      e.label = e.__funnyName = pickL(GOOSE_NAMES);
      e.__honkCd = 1 + Math.random() * 3;
    }
    if (elite && !ED[t].air && !bossMode && (G.force || Math.random() < 0.25)) {
      G.sleepers++;
      e.__sleep = true;
      e.__sleeper = true;
      e.state = 'sleep';
      e.__grumbleCd = 6 + Math.random() * 6;
    }
    return r;
  };

  // ---- sleeping enemies skip the core AI entirely ----
  const updateE0 = updateE;
  updateE = function (dt) {
    const asleep = [];
    for (let i = E.length - 1; i >= 0; i--) {
      const e = E[i];
      if (e && e.__sleep && !e.dead) {
        asleep.push([i, e]);
        E.splice(i, 1);
      }
    }
    try {
      return updateE0(dt);
    } finally {
      for (let k = asleep.length - 1; k >= 0; k--) {
        const [i, e] = asleep[k];
        E.splice(Math.min(i, E.length), 0, e);
      }
    }
  };

  function say(e, line, life = 2.2) {
    if (!e) return;
    const live = E.filter(o => o && o.__bubble && o.__bubble.t > 0 && o !== e).length;
    if (live >= 2) return false;
    e.__bubble = { s: line, t: life, max: life };
    G.lines++;
    return true;
  }
  function wake(e, why) {
    e.__sleep = false;
    e.state = 'approach';
    e.stun = 0;
    e.dir = pl.x >= e.x ? 1 : -1;
    G.woke++;
    // a sleeper always gets to complain, even over the bubble cap
    e.__bubble = { s: pickL(WAKE), t: 2.4, max: 2.4 };
    G.lines++;
    try {
      txt(e.x + e.w / 2, e.y - 40, '!', '#ffe16d', false);
    } catch (_) {}
  }

  // ---- per-frame logic after the core update ----
  const update0 = update;
  update = function (dt) {
    const r = update0(dt);
    const step = Math.min(0.05, dt || 0);
    for (const e of E) {
      if (!e || e.boss) continue;
      if (e.__bubble) e.__bubble.t -= step;
      if (e.dead) {
        if (e.__sleeper && !e.__lastWords) {
          e.__lastWords = true;
          try {
            txt(e.x + e.w / 2, e.y - 30, pickL(LAST), '#c9d8e8', false);
          } catch (_) {}
        }
        continue;
      }
      if (e.__sleep) {
        const near = Math.abs(pl.x + pl.w / 2 - (e.x + e.w / 2)) < 120 && Math.abs(pl.y - e.y) < 140;
        if (e.hp < e.max || near) wake(e);
        continue;
      }
      if (e.type === 'goose') {
        e.__honkCd -= step;
        if (e.state === 'wind' && !e.__honked) {
          e.__honked = true;
          G.honks++;
          say(e, Math.random() < 0.12 ? pickL(GOOSE_RARE) : pickL(HONK), 1.1);
          try {
            globalThis.CWM_CHIPTUNE?.chip(
              [
                [740, 2],
                [622, 3],
                [523, 4]
              ],
              { wave: 'p25', vol: 0.05, decay: 0.01 }
            );
          } catch (_) {}
        } else if (e.state !== 'wind') e.__honked = false;
        if (e.__honkCd <= 0) {
          e.__honkCd = 4 + Math.random() * 5;
          if (Math.random() < 0.5) say(e, pickL(HONK), 0.9);
        }
      } else if (e.__sleeper) {
        e.__grumbleCd -= step;
        if (e.__grumbleCd <= 0) {
          e.__grumbleCd = 9 + Math.random() * 8;
          say(e, pickL(GRUMBLE), 2);
        }
      }
    }
    return r;
  };

  // ---- drawing: Zzz while asleep, speech bubble when talking ----
  const placed = [];
  let placedFrame = -1;
  function bubble(e) {
    const b = e.__bubble;
    if (!b || b.t <= 0 || e.dead) return;
    const cx = e.x + e.w / 2,
      top = e.y - 46;
    X.save();
    X.font = '1000 13px system-ui';
    X.textAlign = 'center';
    X.textBaseline = 'middle';
    const tw = Math.min(360, X.measureText(b.s).width + 22),
      h = 26,
      bx = Math.max(6, Math.min(W - tw - 6, cx - tw / 2)),
      fr = globalThis.CWM_PX?.stats?.frames ?? 0;
    if (fr !== placedFrame) {
      placedFrame = fr;
      placed.length = 0;
    }
    let by = Math.max(18, top - h);
    // stack over any bubble already placed this frame
    for (let g = 0; g < 3; g++) {
      const o = placed.find(r => bx < r[0] + r[2] && bx + tw > r[0] && by < r[1] + r[3] + 4 && by + h + 4 > r[1]);
      if (!o) break;
      by = o[1] - h - 8;
    }
    placed.push([bx, by, tw, h]);
    X.globalAlpha = 1;
    X.fillStyle = '#1a1428';
    X.fillRect(bx, by, tw, h);
    // tail
    const tx = Math.max(bx + 8, Math.min(bx + tw - 16, cx - 4));
    X.fillRect(tx, by + h, 10, 6);
    X.fillRect(tx + 3, by + h + 6, 5, 5);
    X.strokeStyle = e.type === 'goose' ? '#ffb35d' : '#f4f1e6';
    X.lineWidth = 2;
    X.strokeRect(bx, by, tw, h);
    X.fillStyle = e.type === 'goose' ? '#ffcf6e' : '#f4f1e6';
    const PX = globalThis.CWM_PX;
    if (PX) PX.forceText = true;
    try {
      X.fillText(b.s, bx + tw / 2, by + h / 2 + 1);
    } finally {
      if (PX) PX.forceText = false;
    }
    X.restore();
  }
  function zzz(e) {
    const t = typeof time === 'number' ? time : performance.now() / 1000;
    X.save();
    X.textAlign = 'left';
    X.textBaseline = 'middle';
    X.fillStyle = '#c9d8e8';
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.6 + i / 3 + (e.anim || 0)) % 1;
      X.globalAlpha = 1;
      X.font = `1000 ${11 + i * 4}px system-ui`;
      X.fillText('z', e.x + e.w * 0.7 + p * 26 + i * 6, e.y - 6 - p * 46);
    }
    X.restore();
  }
  const creature0 = creature;
  creature = function (e) {
    // while talking, the bubble replaces the nameplate/label
    const talking = e && e.__bubble && e.__bubble.t > 0 && !e.dead,
      hl = talking ? e.__headline : null,
      lb = talking ? e.label : null;
    if (talking) {
      e.__headline = false;
      e.label = ' ';
    }
    let r;
    try {
      r = creature0(e);
    } finally {
      if (talking) {
        e.__headline = hl;
        e.label = lb;
      }
    }
    if (e && !e.boss && !e.dead) {
      if (e.__sleep) zzz(e);
      if (e.__bubble) bubble(e);
    }
    return r;
  };

  globalThis.CWM_GOOSE = {
    state: () => ({ ...G }),
    forceSleeper: (on = true) => (G.force = !!on),
    say,
    wake,
    spawn: (t, x, el = false) => spawn(t, x, el)
  };
})();
