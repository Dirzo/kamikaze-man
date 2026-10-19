// Game feel (phase 4): pixel screenshake and budgeted hit-stop.
//
// Before: ~40 call sites set `shake` (up to 34 world units, random jitter every frame), but
// systems/26-combat-readability.js zeroes it at the draw boundary, so the live game never shook.
// Meanwhile almost every hit set `stop` (18-50 ms freeze), so hordes stuttered constantly.
//
// Now:
//   shake  -> "trauma" only from real impacts (shake >= 6: crits, big kills, explosions, bosses),
//             rendered as a whole-pixel alternating rumble (max 4 px, ~0.4 s), canvas only (HUD
//             stays still). Read by the pixel renderer through CWM_PX.shakeX / shakeY.
//   stop   -> small freezes (< 0.1 s) are capped at 40 ms and allowed at most every 140 ms;
//             big moments (>= 0.1 s: elite crits, boss hits/kills, loot reveals) pass unchanged.
// ?nofeel turns this module off.
(() => {
  const PX = globalThis.CWM_PX;
  if (!PX || globalThis.__CWM_GAME_FEEL || new URLSearchParams(location.search).has('nofeel')) return;
  globalThis.__CWM_GAME_FEEL = true;

  const F = { trauma: 0, frame: 0, lastStopAt: -9, stopsKept: 0, stopsDropped: 0, shakes: 0 };
  globalThis.CWM_FEEL = F;

  // ---- hit-stop budget (runs around update, where events set `stop`) ----
  const update0 = update;
  update = function (dt) {
    const before = stop;
    const r = update0(dt);
    if (stop > before + 1e-6) {
      // a hit/kill/crit during this update asked for a freeze
      const now = performance.now() / 1000;
      if (stop < 0.1) {
        if (now - F.lastStopAt < 0.14) {
          stop = Math.max(0, before - dt);
          F.stopsDropped++;
        } else {
          stop = Math.min(stop, 0.04);
          F.lastStopAt = now;
          F.stopsKept++;
        }
      } else {
        F.lastStopAt = now;
        F.stopsKept++;
      }
    }
    return r;
  };

  // ---- pixel screenshake (runs around draw; reads shake before the readability patch zeroes it) ----
  const draw0 = draw;
  let last = performance.now();
  draw = function () {
    const now = performance.now(),
      dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (shake >= 6) {
      F.trauma = Math.max(F.trauma, Math.min(1, shake / 28));
      F.shakes++;
    }
    F.trauma = Math.max(0, F.trauma - 2.4 * dt);
    F.frame++;
    const amp = Math.round(4 * F.trauma * F.trauma);
    // classic 16-bit rumble: alternate sides every 2 frames, vertical at half rate
    PX.shakeX = amp ? (Math.floor(F.frame / 2) % 2 ? amp : -amp) : 0;
    PX.shakeY = amp > 1 ? (Math.floor(F.frame / 4) % 2 ? 1 : -1) * Math.ceil(amp / 2) : 0;
    shake = 0; // the core's random jitter stays off; all shake comes from the offset above
    return draw0();
  };
})();
