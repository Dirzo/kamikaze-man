// Shared timing/geometry for visible attacks and damage. No dependency on the renderer.
export function activeWindow(type, finisher = false) {
  return type === 'hammer' || type === 'axe' ? [0.48, 0.68] : finisher ? [0.38, 0.64] : type === 'dagger' ? [0.25, 0.55] : [0.3, 0.62];
}
// grow: the shard tree's reach bonus (LONG REACH, LONG BLADES, BIG HAMMER) scales the whole box
export function attackBox(h, T, mv, grow = 0) {
  const reach = (T.reach + (mv.big ? 6 : 0) + (mv.thrust || 0) * 0.5) * (1 + grow);
  const spin = Math.abs(mv.to - mv.from) >= 300;
  return { x: spin ? h.x + h.w / 2 - reach : h.face > 0 ? h.x + h.w / 2 + 2 : h.x + h.w / 2 - 2 - reach,
    y: h.y + 11 - (T.height * (1 + grow)) / 2, w: spin ? reach * 2 : reach, h: T.height * (1 + grow) };
}
export function canAttack(h) { return !h.attack && !h.special && h.cd <= 0 && h.hurtT <= 0 && h.dashT <= 0 && !h.dead; }
