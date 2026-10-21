// The stable (Super Mario World's Yoshi, armoured, three ways). No mount turns up until you have
// beaten three family heads in their castles; then the stable opens on the POWERS window and you
// pick one of three war-beasts to ride, swapping any time on the map. Whichever you picked is what
// hatches from the armoured eggs (EGG_LEVELS in gimmicks.js). Every mount runs faster and jumps
// higher, turns your dash into a WAR CHARGE and stomps what it lands on; each has its own perks on top.
//   speed, jump    multipliers on the hero's own
//   chargeTime     how much longer a dash lasts in the saddle
//   charge         WAR CHARGE damage (x a hit of your weapon), knock how far it throws foes
//   stomp          landing on a foe (x a hit)
//   chomp          seconds between swallowing a small foe whole (0: never)
//   barding        hits the mount soaks before you are thrown from the saddle
//   flaps          extra jumps in mid-air
//   gizzard        extra shards from a foe it swallows
//   quake          a stomp also strikes every foe around for this much (x a hit), 0: just the one
export const STABLE_TROPHIES = 3;
export const MOUNTS = {
  wargoose: {
    name: 'WAR GOOSE', col: 'gold', sprite: 'wargoose', w: 30, h: 27,
    speed: 1.18, jump: 1.16, chargeTime: 1.7, charge: 1.2, knock: 46, stomp: 1.6, chomp: 1.3, gizzard: 0.5, barding: 0, flaps: 0, quake: 0,
    perks: [['CHOMP', 'Swallows a small foe in front of you whole'], ['SHARD GIZZARD', 'Swallowed foes give 50% more shards']],
    lines: ['HONK! (READY)', 'HONK. (MOUNT UP)', 'HONK HONK! (TO WAR)']
  },
  ironboar: {
    name: 'IRON BOAR', col: 'sand', sprite: 'ironboar', w: 32, h: 24,
    speed: 1.26, jump: 1.04, chargeTime: 2.4, charge: 2.4, knock: 80, stomp: 1.3, chomp: 0, barding: 1, flaps: 0, quake: 0,
    perks: [['TUSK CHARGE', 'Charges run further and hit twice as hard'], ['IRON BARDING', 'Soaks one hit before you are thrown']],
    lines: ['SNORT. (READY)', 'GRUNT GRUNT. (POINT ME AT IT)', 'SNORT! (TUSKS OUT)']
  },
  griffin: {
    name: 'WAR GRIFFIN', col: 'sky', sprite: 'griffin', w: 31, h: 27,
    speed: 1.1, jump: 1.22, chargeTime: 1.5, charge: 1.0, knock: 40, stomp: 1.8, chomp: 0, barding: 0, flaps: 1, quake: 0.8,
    perks: [['SKY FLAP', 'One more jump in mid-air'], ['THUNDER DIVE', 'Stomps strike every foe around you']],
    lines: ['SCREE! (READY)', 'KRAAA. (TALONS OUT)', 'SCREEE! (TO THE SKY)']
  }
};
export const MOUNT_LIST = Object.keys(MOUNTS);
