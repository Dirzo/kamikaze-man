// Level gimmicks (Super Mario World's ghost houses, auto-scrollers, water and ice levels) and
// where the War Goose eggs are hidden. A gimmick changes how a level plays, never its layout, so
// every map stays exactly as maps.js builds it (map 1 included: 1-1 has no gimmick). The rules run
// in game/gimmicks.js and game/mount.js. Pure data, safe to import from tests.
export const GIMMICKS = {
  ghost: {
    name: 'GHOST HOUSE', col: 'violet',
    desc: 'Dark halls lit only around you. Haunted blades creep closer while your back is turned and freeze when you face them.'
  },
  scroll: {
    name: 'AUTO-SCROLL', col: 'orange',
    desc: 'The screen marches on by itself. Keep up: whoever falls behind is left behind, and that includes you.'
  },
  water: {
    name: 'UNDERWATER', col: 'sky',
    desc: 'The whole level is flooded. You sink slowly and press JUMP to swim, as often as you like.'
  },
  ice: {
    name: 'ICE', col: 'ice',
    desc: 'Frozen floors. You slide when you stop and skid when you turn. Knocked-back foes slide further too.'
  }
};
// level id -> gimmick. Chosen by name and by map: auto-scrollers only on field maps that run left to
// right (never a climb to a peak), ghost houses where it is already dark or spooky.
export const GIMMICK_OF = {
  '1-S': 'ghost', '2-S': 'ghost', '4-2': 'ghost', '5-S': 'ghost', '8-4': 'ghost', '9-2': 'ghost', '10-4': 'ghost',
  '2-5': 'scroll', '3-4': 'scroll', '4-3': 'scroll', '7-4': 'scroll', '9-3': 'scroll',
  '1-4': 'water', '3-3': 'water', '3-S': 'water', '5-4': 'water', '7-5': 'water',
  '6-2': 'ice', '6-5': 'ice', '6-F': 'ice'
};
export const gimmickOf = id => (id && GIMMICK_OF[id]) || null;

// hero physics in each gimmick: multipliers on HERO's numbers, and swim: JUMP works in the water
export const PHYSICS = {
  water: { gravity: 0.32, maxFall: 0.3, speed: 0.8, swim: 155, accel: 0.6, friction: 0.5 },
  ice: { accel: 0.3, friction: 0.12 }
};
export const SCROLL_SPEED = 44; // px/s
export const HAUNT = { count: z => 4 + Math.floor(z / 2), speed: 30, dmg: 0.6, near: 340 };

// ---------------------------------------------------------------- the War Goose
// An armoured egg waits near the start of these levels; break it and a War Goose hatches to carry
// you. It stays with you from level to level until a hit knocks you out of the saddle.
export const EGG_LEVELS = ['1-2', '2-1', '3-1', '4-1', '5-1', '6-1', '7-1', '8-1', '9-1', '10-1', '1-S', '2-S', '3-S', '4-S', '5-S', '6-S', '7-S', '8-S', '9-S', '10-S'];
export const EGG_ZONES = [1, 4, 7]; // a classic ten-map run finds one on these maps
export const MOUNT = { speed: 1.18, jump: 1.16, chompEvery: 1.3, chompReach: 30, stomp: 1.6, chargeTime: 1.7, loose: 4.5 };
