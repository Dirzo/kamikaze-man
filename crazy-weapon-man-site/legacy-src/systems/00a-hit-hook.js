// Innermost hit hook: runs right after the core applies a hit, for every hit including splash and
// proc hits that later systems make through their own inner references. systems/41-arcade-combat.js
// uses it to replace the core's stacked knockback with one clean arcade push per hit.
(() => {
  if (globalThis.__CWM_HIT_HOOK) return;
  globalThis.__CWM_HIT_HOOK = true;
  const hitE0 = hitE;
  hitE = function (e, a, o = {}) {
    const r = hitE0(e, a, o);
    const f = globalThis.CWM_ON_HIT;
    if (f && r && e) {
      try {
        f(e, r, o);
      } catch (_) {}
    }
    return r;
  };
})();
