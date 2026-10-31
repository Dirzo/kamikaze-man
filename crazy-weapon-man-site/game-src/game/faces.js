// Crazy Weapon Man's face and the little bits of acting around it.
//
// The body frames all share one head, so the face is a patch laid over it (art-src/arcade_faces.py):
// faceOf() picks a mood from what the hero is doing right now, drawFace() lays the patch on the
// frame anim.js just drew. Short-lived moods (a smirk after a kill, wide eyes over a new weapon)
// come in through emote(). Moods, strongest first:
//   ko      knocked out (after the death topple)       ouch    taking a hit / the hit that killed him
//   joy     the level-clear cheer                        roar    specials and finishers
//   focus   swinging, shooting                           shock   long falls, springs, bubbled, rope
//   wow     picking up a weapon (emote)                   smirk   a kill (emote)
//   fierce  dashing, sprinting, revving                  worry / pant   low health, in time with breath
//   blink   every few seconds over any calm face         glance  idling: a look back over the shoulder
//   grin    his usual self
import { A } from '../engine/assets.js';
import { X } from '../engine/gfx.js';

export const LOW_HP = 0.3;
// with weapon armor (combat.js hurtHero) there is no health bar: a cracked weapon is "hurting"
export const hurting = h => !!h.cracked || (h.maxHp > 0 && h.hp / h.maxHp < LOW_HP);

// a passing mood (wins over the calm ones, not over a hit or a special)
export function emote(h, mood, dur = 0.6) {
  if (!h) return;
  h.mood = mood;
  h.moodT = dur;
  h.moodAt = null; // stamped against the draw clock the next time he is drawn
}

const BIG = /Big$|finisher/; // the third hit of a combo (attack-rules.js) is the big one

export function faceOf(h, t, pose) {
  if (h.dead) return h.deadAt != null && t - h.deadAt > 0.42 ? 'ko' : 'ouch';
  if (h.cheer) return 'joy';
  if (h.hurtT > 0) return 'ouch';
  if (h.special) return 'roar';
  // passing moods are timed on the draw clock (the hero update does not know about them)
  if (h.mood) {
    if (h.moodAt == null) h.moodAt = t;
    if (t - h.moodAt < h.moodT) return h.mood;
    h.mood = null;
  }
  if (h.attack) return !h.attack.ranged && BIG.test(h.attack.moveName || '') ? 'roar' : 'focus';
  if (h.castT > 0) return 'focus';
  if (h.heldT > 0 || h.rope || h.zip || (!h.onGround && !h.ladder && h.vy > 300)) return 'shock';
  let calm = 'grin';
  if (h.dashT > 0 || h.rev || h.stowed || h.skidT > 0) calm = 'fierce';
  else if (hurting(h)) calm = Math.sin(t * 7) > 0.2 ? 'pant' : 'worry';
  else if (pose && pose.idleFor > 2.5 && (t % 5.3) > 4.1) calm = 'glance';
  // a blink every 2.5-4 s (the gap wobbles so it never ticks like a clock)
  const gap = 2.5 + ((Math.sin(Math.floor(t / 3.1) * 12.9898) * 43758.5) % 1 + 1) % 1 * 1.5;
  if (t % gap < 0.11 && calm !== 'pant') return 'blink';
  return calm;
}

// lay the mood's patch over the face of frame f, drawn at (sx0, sy0) facing `face`
export function drawFace(f, mood, sx0, sy0, face) {
  const F = A.hero.faces;
  if (!F || mood === 'grin') return; // the plain frames already grin
  const at = F.at[f],
    i = F.index[mood];
  if (!at || i == null) return;
  const Hw = A.hero.w;
  if (face > 0) X.drawImage(F.im, i * F.w, 0, F.w, F.h, sx0 + at[0], sy0 + at[1], F.w, F.h);
  else {
    X.save();
    X.translate(sx0 + Hw - at[0], sy0 + at[1]);
    X.scale(-1, 1);
    X.drawImage(F.im, i * F.w, 0, F.w, F.h, 0, 0, F.w, F.h);
    X.restore();
  }
}
