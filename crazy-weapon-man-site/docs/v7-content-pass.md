# Crazy Weapon Man — v7 Content Pass A

Status: production specification
Target branch: `crazy-weapon-man-web`
Machine-readable contract: `public/art/v7/manifest.json`

## Goal

Replace the current integration hacks with authored content that matches the approved concept rendering. The v7 target has three requirements:

1. Crazy Weapon Man has weapon-family-specific body poses and attack animation.
2. Sewer enemies use genuinely transparent, tightly trimmed frames with stable anchors; runtime oval masks are removed.
3. Disco Sewer of Compliance is rebuilt as a layered illustrated scene rather than a flat vector arena.

The existing render bridge, combat logic, hitboxes, weapon stats, elemental system, and leaderboard remain independent from this art pass.

## 1. Hero production sets

### Families

| Family | Weapon types | Visual behavior |
|---|---|---|
| Blade | sword, katana, dagger | forward stance, fast horizontal/diagonal cuts, dagger more compact |
| Heavy | hammer | wider feet, lower center of gravity, large anticipation and follow-through |
| Ranged | bow | side-on torso, support hand forward, draw/release pose |
| Caster | wand, staff | upright torso, casting hand and staff leverage, readable FX origin |
| Trick | shuriken, nunchucks | asymmetric shoulders, fast hand-driven animation, rotational motion |

Each family gets its own atlas and metadata file. Runtime may swap the exact generated weapon art at the family socket, but the **body pose is authored for that family**.

### Required clips per family

- `idle`: 4 frames
- `run`: 6 frames
- `jump_rise`: 2 frames
- `fall`: 2 frames
- `land`: 3 frames
- `attack_a`: 6 frames
- `attack_b`: 6 frames
- `attack_air`: 5 frames
- `skill`: 6 frames
- `hit`: 3 frames
- `death`: 6 frames
- `victory`: 5 frames

The first usable milestone does not require every frame to be unique. A family can share selected locomotion frames with another family, but attack silhouettes and weapon-hand positions must be family-specific.

### Hero frame metadata

Every frame must contain:

```json
{
  "frame": {"x": 0, "y": 0, "w": 128, "h": 128},
  "sourceSize": {"w": 256, "h": 256},
  "trim": {"x": 42, "y": 31, "w": 128, "h": 128},
  "pivot": {"x": 0.5, "y": 0.92},
  "anchors": {
    "feet": {"x": 0.50, "y": 0.92},
    "center": {"x": 0.50, "y": 0.50},
    "head": {"x": 0.48, "y": 0.22},
    "hand_primary": {"x": 0.67, "y": 0.53},
    "hand_support": {"x": 0.55, "y": 0.54},
    "weapon_socket": {"x": 0.67, "y": 0.53},
    "fx_origin": {"x": 0.79, "y": 0.48},
    "muzzle": {"x": 0.86, "y": 0.47}
  }
}
```

Anchor coordinates are normalized within the **untrimmed source frame**, not the packed rectangle. This lets the renderer preserve a stable feet position even when attack frames become much wider.

### Hero asset names

- `player-crazy-man-blade-atlas-v7.webp`
- `player-crazy-man-blade-atlas-v7.json`
- `player-crazy-man-heavy-atlas-v7.webp`
- `player-crazy-man-heavy-atlas-v7.json`
- `player-crazy-man-ranged-atlas-v7.webp`
- `player-crazy-man-ranged-atlas-v7.json`
- `player-crazy-man-caster-atlas-v7.webp`
- `player-crazy-man-caster-atlas-v7.json`
- `player-crazy-man-trick-atlas-v7.webp`
- `player-crazy-man-trick-atlas-v7.json`

Normal runtime height target: approximately 88 px before frenzy scaling.

## 2. Sewer enemy production

The sewer vertical slice must contain no generic runtime silhouette masks once v7 art is marked ready.

### Required enemies

#### Googly — `crawler`
- idle 5
- move 5
- attack/lunge 5
- hit 2
- death 6

Shape rule: low/wide blob, tongue and eyes remain inside the actual alpha silhouette. Death splat may be much wider than idle.

#### Splorker — `wizard`
- idle 5
- windup 4
- attack/spit 6
- hit 2
- death 6

Required anchor: `fx_origin` at mouth/nozzle.

#### Blockjaw — `shieldbro`
- idle 4
- move 6
- guard 4
- attack/bash 6
- hit 3
- death 7

Shield/body silhouette may extend beyond gameplay hitbox. Do not crop shield edges to idle bounds.

#### Glitch Intern — `blinker`
- idle 5
- move 5
- teleport 5
- attack 5
- hit 2
- death 6

Teleport frames may use partial alpha/glitch breakup, but transparent padding should still be trimmed.

#### Toxic Bomb Chicken — `bombchicken`
- idle 4
- move 6
- attack 5
- explode 7
- hit 2
- death 5

Explosion is a separate oversized frame/FX event. The normal chicken body should never be clipped to make room for it.

### Enemy frame rules

- Export with real alpha.
- Trim every frame independently.
- Keep only 4 px transparent padding around visible art, plus 2 px atlas extrusion.
- `feet` anchor required for grounded enemies.
- `center` anchor required for airborne/teleport frames.
- `fx_origin` required for attacks.
- Hitboxes remain gameplay-authored and do not follow sprite bounds.
- Attack and death frames are allowed to exceed idle dimensions.
- Production-ready v7 enemies must not be passed through `sprite-integration-v4/v5/v6` style clip masks.

## 3. Sewer scene production

The scene should read as the approved concept at normal gameplay distance, not only when paused.

### Layer stack

Back to front:

1. **Far wall** — brick/industrial structure, cool dark values.
2. **Far pipes** — large pipe runs and silhouettes.
3. **Drain arch** — central sewer focal structure.
4. **Mid machinery** — valves, catwalks, secondary pipes.
5. **Toxic falls** — animated emissive runoff.
6. **Graffiti/signage** — comic sewer humor integrated into walls.
7. **Platform skin** — illustrated collision surfaces matching concept style.
8. **Sludge surface** — animated toxic liquid and reflections.
9. **Actor plane** — player, enemies, hostile projectiles.
10. **Foreground pipes** — selective lower/side framing.
11. **Foreground chains** — sparse animated depth accents.
12. **Atmosphere** — fog, spores, light shafts, vignette.

The actor plane must remain the highest-contrast information layer. Foreground content may overlap edges of the screen but may not hide the player, projectile telegraphs, or enemy faces in the central combat zone.

### Environment assets

- `sewer-far-wall-v7.webp`
- `sewer-far-pipes-v7.webp`
- `sewer-drain-arch-v7.webp`
- `sewer-mid-machinery-v7.webp`
- `sewer-toxic-falls-v7.webp`
- `sewer-graffiti-signage-v7.webp`
- `sewer-platform-kit-v7.webp`
- `sewer-sludge-surface-v7.webp`
- `sewer-foreground-pipes-v7.webp`
- `sewer-foreground-chains-v7.webp`
- `sewer-atmosphere-v7.webp`

Reference canvas: 1280×720.

### Lighting contract

- Ambient: cool blue-gray.
- Acid sludge: green bounce from below.
- Practical lamps: cyan and magenta.
- Player/enemy colors stay brighter and warmer than most background values.
- Weapon/element attacks may cast short-lived local light on actors and nearby environment.
- Avoid full-screen additive glow; preserve black/dark values for shape readability.

### Platform contract

Platforms keep current gameplay geometry but use illustrated skins:

- dark colored outline rather than pure black
- painted top/front-face shading
- hazard stripes on selected edges
- light grime and selective slime drips
- toxic bounce light from below
- no decorative detail that obscures the walkable edge

## 4. Runtime manifest schema

The runtime loader should read `public/art/v7/manifest.json` and select a player family from the weapon type.

Expected mapping:

```js
const familyForWeapon = {
  sword: 'blade',
  katana: 'blade',
  dagger: 'blade',
  hammer: 'heavy',
  bow: 'ranged',
  wand: 'caster',
  staff: 'caster',
  shuriken: 'trick',
  nunchucks: 'trick'
};
```

Runtime draw order for the player:

1. contact shadow
2. optional sludge bounce light
3. player body frame
4. runtime weapon art at `weapon_socket` when the frame is designed for a swappable weapon
5. hand/forearm overlay when required by metadata
6. elemental overlay
7. attack FX from `fx_origin`
8. hit/status overlay

A frame can set `weaponMode: "baked"` when the concept demands a fully integrated weapon silhouette; otherwise use `weaponMode: "socket"`.

## 5. Acceptance checklist

### Player

- Every weapon type selects a visually appropriate body family.
- Weapon remains attached to the authored hand through idle, run, jump, attack and recovery.
- Basic attacks have no default green strike effect.
- Attack A and B have clearly different silhouettes.
- No rectangular art card or runtime oval clipping is visible.

### Enemies

- All five sewer enemy types have clean alpha edges.
- No body part is cut because an attack/death frame exceeded idle size.
- No generic mask is required to hide atlas garbage.
- Feet anchors remain stable over slopes/platforms.

### Scene

- At least four depth planes are immediately visible during play.
- Central drain, toxic falls, pipes, foreground framing and illustrated platforms read together as one scene.
- Character art does not look pasted on top of the environment.
- Combat remains readable under maximum normal swarm pressure.

## 6. Production order

1. Clean enemy atlases first: Googly, Splorker, Blockjaw, Glitch Intern, Toxic Bomb Chicken.
2. Hero blade set, because sword/katana/dagger cover the quickest verification path.
3. Hero heavy and ranged sets.
4. Sewer far/mid/platform/sludge scene layers.
5. Hero caster and trick sets.
6. Weapon-specific FX and local lighting polish.
7. Remove v4/v5/v6 masking/socket compatibility layer for any asset family declared v7-ready.

The implementation should allow v7 assets to roll in incrementally: a v7-ready actor uses its v7 metadata path; an unfinished actor continues using the current illustrated renderer until its replacement exists.
