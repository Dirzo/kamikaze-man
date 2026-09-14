# Crazy Weapon Man v2.0 — UI Wireframe + Art Production Checklist

Status: production blueprint
Target branch: `crazy-weapon-man-web`
Primary visual target: neon-grimy, cel-shaded, comic-impact 2D action with oversized readable silhouettes and strong separation between gameplay actors and background art.

## 1. Non-negotiable visual rules

- Player silhouette wins every frame. The player, current weapon, hostile projectiles, and elite telegraphs must remain readable over environment/VFX.
- Thick dark character outlines; environment outlines are thinner/lower-contrast.
- Use one main fill, one shadow mass, and 1–2 highlight accents per character. Avoid muddy gradients on body shapes.
- Environment stays cooler/darker than gameplay actors. Toxic green, cyan, magenta, yellow, and orange are reserved for gameplay emphasis.
- Comic callouts are event-driven, not permanent HUD furniture.
- Mobile landscape is a first-class layout, not a desktop layout scaled down.

## 2. Runtime art conventions

Runtime assets live under `crazy-weapon-man-site/public/art/v2/`.

Master/source art may be larger, but runtime atlases should use transparent WebP where possible. Keep all art authored at 4x or 8x the final screen size and downsample in the game for clean outlines.

Naming:

`<category>-<identity>-<purpose>-v2.webp`

Metadata:

`<category>-<identity>-atlas-v2.json`

Anchor coordinates in metadata are normalized 0–1 coordinates so the same atlas can be drawn at multiple scales.

Required anchor names:

- `feet`
- `center`
- `head`
- `hand_primary`
- `hand_support`
- `weapon_socket`
- `fx_origin`
- `muzzle` where applicable

## 3. Screen wireframes

### 3.1 Landing — desktop

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      CRAZY WEAPON MAN                       │
│                                                             │
│                   [ leaderboard handle ]                    │
│                                                             │
│                    [      START RUN      ]                   │
│                    [     LEADERBOARD     ]                   │
│                                                             │
│                          MUSEUM                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Rules:
- No game explanation paragraph.
- No control essay.
- No color selector.
- No patch/build text unless tester mode is open.
- Logo is the dominant element; buttons are large and centered.

### 3.2 Landing — mobile landscape

```text
┌────────────────────────────────────────────────────────────────────┐
│ CRAZY WEAPON MAN       [ handle ]     [ START RUN ] [ LEADERBOARD]│
└────────────────────────────────────────────────────────────────────┘
```

Rules:
- Keep total landing height under 75% of viewport height.
- Avoid forcing scroll to reach START RUN.
- Museum can be a smaller tertiary action.

### 3.3 Gameplay HUD — desktop

```text
┌ HP ███████████  LV 12     18,420 DPS                     PAUSE  LB ┐
│ VENOMOUS LEGENDARY PAYROLL KATANA • POISON                       │
│                                                                  │
│                         GAMEPLAY                                 │
│                                                                  │
│ Shards 92/100                                      Boss HP only   │
└──────────────────────────────────────────────────────────────────┘
```

Persistent:
- HP
- level
- DPS
- weapon name
- rarity
- element
- shard count
- pause
- leaderboard

Conditional:
- boss HP
- temporary augment timer
- low-health warning
- elemental self-damage warning

Never persistent:
- wave explanation cards
- long control hints
- full DPS formula
- large flavor text panels

### 3.4 Gameplay HUD — mobile landscape

```text
┌ HP █████  LV12  18.4K DPS                     [Ⅱ] [LB] ┐
│ VENOMOUS LEGENDARY KATANA • POISON                       │
│                                                         │
│                    GAMEPLAY                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Rules:
- HUD target height: <= 14% of viewport.
- Use abbreviated DPS only in compact top row; full DPS is visible in pause/details.
- Weapon name truncates with ellipsis before wrapping into gameplay space.

### 3.5 Pause / build screen

```text
┌────────────────────── CRAZY WEAPON MAN ──────────────────────┐
│ [ RESUME ] [ LEADERBOARD ] [ CONTROLS ]                     │
│                                                             │
│ WEAPON                                                      │
│ Venomous Legendary Payroll Katana of Bad Decisions          │
│ Legendary • Katana • Poison                                 │
│                                                             │
│ DPS BREAKDOWN                                               │
│ 1,820 HIT × 2.14/s × 1.36 CRIT × 1.52 EFFECTS = 8,050 DPS  │
│                                                             │
│ BUILD CHIPS                                                 │
│ [POISON] [LEGENDARY] [RABBIT LAUNCHER] [GLASS]             │
│                                                             │
│ RUN                                                         │
│ LV 12 • 184 kills • Sewer • 92 shards                       │
└─────────────────────────────────────────────────────────────┘
```

Color rules:
- hit = red/pink
- speed = cyan
- crit = yellow
- upgrades/effects = purple
- final DPS = green

### 3.6 Leaderboard — desktop

```text
┌──────────────────────── LEADERBOARD ─────────────────────────┐
│ [CURRENT PATCH] [ALL-TIME] [LEGACY]                         │
│                                                             │
│ #  Weapon            Player        Type/Element       DPS    │
│ 1  [icon] ...        Cam           Katana/Poison      81K    │
│ 2  [icon] ...        ...           Hammer/Fire        73K    │
│ 3  ...                                                        │
│                                                                │
│                         │ SELECTED WEAPON                       │
│ scrollable list         │ large weapon art                     │
│                         │ full name / player / patch            │
│                         │ DPS formula + modifiers               │
└───────────────────────────────────────────────────────────────┘
```

Rules:
- list supports 50 entries
- row click/tap selects
- list and details scroll independently on desktop
- new v2 element field appears visibly in row

### 3.7 Leaderboard — mobile

```text
┌ LEADERBOARD                                  [X] ┐
│ CURRENT | ALL-TIME | LEGACY                      │
│ ──────────────────────────────────────────────── │
│ scrollable rank list                             │
│                                                 │
│ ──────────────────────────────────────────────── │
│ selected weapon details                         │
│ large icon + DPS formula                        │
└─────────────────────────────────────────────────┘
```

Rules:
- full-screen `100dvh`
- top list ~52–58% of height
- detail panel below
- sticky close/back controls

### 3.8 Loot / weapon upgrade callout

```text
┌ NEW WEAPON ─────────────────────┐
│ [weapon art]                    │
│ VENOMOUS LEGENDARY ...          │
│ +34% DPS                        │
│ POISON • stacking venom         │
└─────────────────────────────────┘
```

Duration target: 1.3–1.8 s. The game does not pause except for very rare weapon tiers or explicit forge events.

### 3.9 Boss intro

```text
               CRAZY WEAPON MAN JR.
         WEAPON ADDICTION IS HEREDITARY
              [large boss silhouette]
```

Rules:
- 0.7–1.2 s readable takeover, then clear screen.
- Boss art uses same thick outline/cel-shaded production rules.

## 4. Exact production asset checklist

### 4.1 Reference boards

These are style targets, not runtime sprite sheets.

- `art-reference/v2/cwm-v2-character-style-board.png`
- `art-reference/v2/cwm-v2-enemy-style-board.png`

### 4.2 Player

Runtime:
- `public/art/v2/player/player-crazy-man-atlas-v2.webp`
- `public/art/v2/player/player-crazy-man-atlas-v2.json`
- `public/art/v2/player/player-crazy-man-frenzy-v2.webp`
- `public/art/v2/player/player-crazy-man-shadow-v2.webp`

Required animation clips:
- idle: 6 frames
- run: 8 frames
- jump_rise: 2 frames
- fall: 2 frames
- land: 3 frames
- attack_ground_a: 6 frames
- attack_ground_b: 6 frames
- attack_air: 5 frames
- skill: 7 frames
- hit: 3 frames
- death: 7 frames
- victory: 6 frames

Recommended source frame box: 256×256 px.
Runtime draw target: ~72–88 px tall at normal frenzy.
Hitbox remains gameplay-authored and independent of sprite bounds.

Frenzy faces:
- `frenzy_0_focused`
- `frenzy_1_unhinged`
- `frenzy_2_psycho`
- `frenzy_3_total_mayhem`

### 4.3 Sewer-core enemies

#### crawler → Googly
- `public/art/v2/enemies/enemy-googly-atlas-v2.webp`
- `public/art/v2/enemies/enemy-googly-atlas-v2.json`
- clips: idle 5, lunge 5, hit 2, death 6

#### flyer → Drain Bat
- `public/art/v2/enemies/enemy-drain-bat-atlas-v2.webp`
- `public/art/v2/enemies/enemy-drain-bat-atlas-v2.json`
- clips: hover 6, dive 5, fire 4, hit 2, death 6

#### wizard → Splorker visual family
- `public/art/v2/enemies/enemy-splorker-atlas-v2.webp`
- `public/art/v2/enemies/enemy-splorker-atlas-v2.json`
- clips: idle 5, aim 4, spit 6, hit 2, death 6

#### brute → Mucklord
- `public/art/v2/enemies/enemy-mucklord-atlas-v2.webp`
- `public/art/v2/enemies/enemy-mucklord-atlas-v2.json`
- clips: idle 6, walk 6, windup 4, swing 6, hit 3, death 7

#### shieldbro → Blockjaw
- `public/art/v2/enemies/enemy-blockjaw-atlas-v2.webp`
- `public/art/v2/enemies/enemy-blockjaw-atlas-v2.json`
- clips: patrol 6, guard 4, windup 4, bash 6, hit 3, death 7

### 4.4 Remaining normal enemy conversions

Every existing gameplay type gets a dedicated v2 identity. Initial implementation may share animation rigs, but runtime names remain distinct.

| Current type | v2 visual identity | Runtime asset basename | Production note |
|---|---|---|---|
| `crawler` | Googly | `enemy-googly` | sewer blob family |
| `stalker` | Scrap Hacker | `enemy-scrap-hacker` | humanoid melee, weapon-forward silhouette |
| `brute` | Mucklord | `enemy-mucklord` | elite bruiser family |
| `wraith` | Drain Wraith | `enemy-drain-wraith` | ghostly floating caster |
| `maw` | Sludge Maw | `enemy-sludge-maw` | low wide bite monster |
| `flyer` | Drain Bat | `enemy-drain-bat` | airborne nuisance |
| `wizard` | Splorker | `enemy-splorker` | toxic ranged caster |
| `taxman` | Receipt Revenant | `enemy-receipt-revenant` | ranged auditor, paper/projectile cues |
| `mimic` | Dumpster Mimic | `enemy-dumpster-mimic` | loot-box ambush shape |
| `eyeball` | Surveillance Orb | `enemy-surveillance-orb` | airborne spread shooter |
| `bombchicken` | Toxic Bomb Chicken | `enemy-bomb-chicken` | sprint/explode silhouette |
| `shieldbro` | Blockjaw | `enemy-blockjaw` | armored frontal blocker |
| `blinker` | Glitch Intern | `enemy-glitch-intern` | teleport/backstab readability |
| `summoner` | Necro Foreman | `enemy-necro-foreman` | casting/summon silhouette |
| `sniper` | Pipe Sniper | `enemy-pipe-sniper` | long ranged weapon silhouette |
| `roller` | Wheel Enforcer | `enemy-wheel-enforcer` | charge/ricochet body |

For each basename create:
- `<basename>-atlas-v2.webp`
- `<basename>-atlas-v2.json`

Default clip contract for remaining enemies:
- idle 4–6
- move 4–8
- windup 3–5
- attack 4–7
- hit 2–3
- death 5–8

### 4.5 Boss production list

- `public/art/v2/bosses/boss-cwm-jr-atlas-v2.webp`
- `public/art/v2/bosses/boss-crazy-boss-man-atlas-v2.webp`
- `public/art/v2/bosses/boss-cwm-sr-atlas-v2.webp`
- `public/art/v2/bosses/boss-grandma-atlas-v2.webp`
- `public/art/v2/bosses/boss-ceo-atlas-v2.webp`
- `public/art/v2/bosses/boss-weapon-itself-atlas-v2.webp`

Each boss receives a matching `.json` atlas metadata file and a separate portrait:
- `<boss-basename>-portrait-v2.webp`

Boss minimum clips:
- idle
- move
- attack_a
- attack_b
- hit
- phase_change
- death

### 4.6 Weapon art families

- `public/art/v2/weapons/weapon-sword-parts-v2.webp`
- `public/art/v2/weapons/weapon-dagger-parts-v2.webp`
- `public/art/v2/weapons/weapon-nunchucks-parts-v2.webp`
- `public/art/v2/weapons/weapon-katana-parts-v2.webp`
- `public/art/v2/weapons/weapon-bow-parts-v2.webp`
- `public/art/v2/weapons/weapon-shuriken-parts-v2.webp`
- `public/art/v2/weapons/weapon-wand-parts-v2.webp`
- `public/art/v2/weapons/weapon-staff-parts-v2.webp`
- `public/art/v2/weapons/weapon-hammer-parts-v2.webp`

Each family should expose 3–5 silhouette parts plus attachment/FX anchors. Do not bake rarity or element into the base art.

### 4.7 Elemental overlays

- `public/art/v2/elements/element-fire-v2.webp`
- `public/art/v2/elements/element-poison-v2.webp`
- `public/art/v2/elements/element-lightning-v2.webp`
- `public/art/v2/elements/element-water-v2.webp`
- `public/art/v2/elements/element-earth-v2.webp`
- `public/art/v2/elements/element-cursed-backfire-v2.webp`
- `public/art/v2/elements/element-cursed-toxic-leak-v2.webp`
- `public/art/v2/elements/element-cursed-backfeed-v2.webp`
- `public/art/v2/elements/element-cursed-undertow-v2.webp`
- `public/art/v2/elements/element-cursed-faultline-v2.webp`

Element overlays must be usable on all weapon families and must not obscure the weapon silhouette.

### 4.8 Shared VFX

- `public/art/v2/fx/fx-hit-sparks-v2.webp`
- `public/art/v2/fx/fx-slash-trails-v2.webp`
- `public/art/v2/fx/fx-muzzle-flashes-v2.webp`
- `public/art/v2/fx/fx-toxic-splats-v2.webp`
- `public/art/v2/fx/fx-heal-bursts-v2.webp`
- `public/art/v2/fx/fx-loot-bursts-v2.webp`
- `public/art/v2/fx/fx-crit-bursts-v2.webp`

### 4.9 UI art

- `public/art/v2/ui/ui-logo-v2.webp`
- `public/art/v2/ui/ui-logo-compact-v2.webp`
- `public/art/v2/ui/ui-panel-ninepatch-v2.webp`
- `public/art/v2/ui/ui-button-ninepatch-v2.webp`
- `public/art/v2/ui/ui-leaderboard-frame-v2.webp`
- `public/art/v2/ui/ui-boss-frame-v2.webp`
- `public/art/v2/ui/ui-shard-icon-v2.webp`
- `public/art/v2/ui/ui-hp-icon-v2.webp`
- `public/art/v2/ui/ui-dps-icon-v2.webp`

## 5. Exact current-game mapping

The existing game currently defines these non-boss types:

`crawler`, `stalker`, `brute`, `wraith`, `maw`, `flyer`, `wizard`, `taxman`, `mimic`, `eyeball`, `bombchicken`, `shieldbro`, `blinker`, `summoner`, `sniper`, `roller`.

The sewer pool currently uses:

`crawler`, `wizard`, `shieldbro`, `blinker`, `bombchicken`.

Therefore the first full sewer art pass must include, at minimum:

1. Googly (`crawler`)
2. Splorker (`wizard`)
3. Blockjaw (`shieldbro`)
4. Glitch Intern (`blinker`)
5. Toxic Bomb Chicken (`bombchicken`)
6. Crazy Weapon Man player

Drain Bat, Mucklord and the remaining normal enemy assets follow immediately so later zones do not fall back to the old renderer.

## 6. Renderer state contract

The v2 renderer should not infer gameplay rules. It only consumes a stable render snapshot.

Player snapshot:

```js
{
  x, y, w, h, vx, vy, dir, on,
  hp, maxHp, inv,
  dashT, attackState, hitState,
  weapon: { type, rarity, element, color },
  frenzyTier
}
```

Enemy snapshot:

```js
{
  id, type, x, y, w, h, vx, vy, dir,
  hp, max, state, dead, death,
  hitT, elite, rareMutator,
  attackKind, traits
}
```

The native render bridge should pass snapshots rather than exposing mutable game internals long-term.

## 7. Animation selection rules

Player:
- dead → `death`
- recently hit → `hit`
- skill active → `skill`
- attack active + airborne → `attack_air`
- attack active + grounded → alternate `attack_ground_a/b`
- `vy < -threshold` → `jump_rise`
- airborne → `fall`
- landing window → `land`
- abs(vx) > movement threshold → `run`
- otherwise → `idle`

Enemy:
- dead/death timer → `death`
- hit timer → `hit`
- explicit windup/aim state → `windup`
- explicit attacking state → `attack`
- meaningful velocity → `move`
- otherwise → `idle`

## 8. Readability budgets

At 1280×720 internal canvas:
- player visual target: ~80 px tall before frenzy enlargement
- common enemy: 45–70 px
- elite enemy: 75–105 px
- boss: 120–180 px depending on encounter
- minimum important projectile diameter: 10 px
- critical enemy telegraph stroke: >= 4 px
- damage number outline: >= 3 px

Mobile landscape:
- never render important combat actors smaller than ~70% of desktop target size after camera scaling
- cap decorative particles before reducing player/projectile visibility

## 9. Implementation sequence

### Milestone V2-A — UI shell
- minimal landing
- v2 HUD desktop/mobile
- pause/build screen
- leaderboard layout cleanup

### Milestone V2-B — player
- integrate player atlas
- state machine
- frenzy faces
- weapon sockets
- attack trail anchors

### Milestone V2-C — complete sewer roster
- Googly
- Splorker
- Blockjaw
- Glitch Intern
- Toxic Bomb Chicken
- hit/death VFX

### Milestone V2-D — all normal enemies
- Drain Bat
- Mucklord
- remaining dedicated identities
- no old enemy primitive renderer remains

### Milestone V2-E — bosses + weapons
- boss atlas conversion
- procedural weapon part renderer
- elemental overlays

### Milestone V2-F — polish/performance
- hit-stop tuning
- damage-number clustering
- particle budgets
- mobile fallbacks
- remove temporary v2 diagnostic badge

## 10. Definition of done

The v2 art conversion is complete when:

- no normal enemy uses the old primitive visual renderer
- the player uses the new illustrated/cel-shaded renderer in every state
- all boss encounters use v2 visual language
- every weapon family has a distinct silhouette
- all ten elemental/cursed treatments are visually legible
- gameplay HUD occupies <= 14% of mobile landscape height in normal combat
- the leaderboard remains scrollable/inspectable and displays elemental identity
- the tester panel can report renderer, atlas load status, fallback count, and current visual identity
- frame rate degrades by reducing decorative VFX before reducing gameplay visibility
