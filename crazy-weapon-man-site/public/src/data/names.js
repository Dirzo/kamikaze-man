// Weapon names that escalate with rarity but always fit on screen. nameWeapon() returns the name
// and the words it used (the "look"), which looks.js turns into palette, details and particles.
//   q0-1  "Rusty Sword" / "Rusty Blazing Sword"         <= 22
//   q2-3  "Haunted Katana of Mild Peril"                 <= 30
//   q4-5  "Starfire Royal Hammer of Endless Soup"        <= 36
//   q6-7  "Bonkreaver, Bane of Goblins"                  <= 38  named relics
//   q8-9  "Honkmourn IX, Who Pokes the Gods"             <= 40
//   q10   "THE GOOSE (A SWORD)"
// Standouts are named one tier grander (capped by the zone's ceiling).
import { ELEMENTS } from './weapons.js';

export const BASE = {
  sword: ['Sword', 'Blade', 'Broadsword', 'Longsword', 'Claymore'],
  dagger: ['Dagger', 'Shiv', 'Dirk', 'Stiletto', 'Knife'],
  nunchucks: ['Nunchucks', 'Flails', 'Chain Sticks', 'Whackers'],
  katana: ['Katana', 'Nodachi', 'Curved Blade', 'Odachi'],
  shuriken: ['Shuriken', 'Throwing Star', 'Star', 'Disc'],
  bow: ['Bow', 'Longbow', 'Shortbow', 'Warbow'],
  wand: ['Wand', 'Twig', 'Rod', 'Baton'],
  staff: ['Staff', 'Stave', 'Scepter', 'Walking Stick'],
  hammer: ['Hammer', 'Maul', 'Mallet', 'Bonker']
};
const COND = ['Rusty', 'Chipped', 'Borrowed', 'Damp', 'Dented', 'Wobbly', 'Pointy', 'Used', 'Stolen', 'Bent', 'Bargain', 'Loose',
  'Sticky', 'Musty', 'Plain', 'Spare', 'Sad', 'Cracked'];
const ADJ = ['Haunted', 'Grumpy', 'Cursed', 'Sneaky', 'Spiteful', 'Shiny', 'Feral', 'Smug', 'Jittery', 'Honking', 'Moody', 'Bitey',
  'Rowdy', 'Gloomy', 'Brave-ish', 'Forbidden', 'Suspicious', 'Overbrewed'];
const OF = ['Mild Peril', 'Regret', 'Bees', 'Soup', 'Turnips', 'Bad Ideas', 'Wet Socks', 'Tuesdays', 'the Goose', 'Second Thoughts',
  'Loud Noises', 'Questionable Ethics', 'Mild Curses', 'Poor Choices', 'Minor Doom', 'Snacks'];
const GRAND = ['Royal', 'Ancient', 'Eldritch', 'Dread', 'Sacred', 'Infernal', 'Celestial', 'Unholy', 'Mighty'];
const OF_GRAND = ['a Thousand Grudges', 'the Last Goose', 'Endless Soup', 'a Thousand Bonks', 'Total Overkill', 'the Angry Moon',
  'Doom, Mostly', 'Unspeakable Snacks', 'the Ninth Moon', 'Very Loud Thunder'];
const SYL_A = ['Grim', 'Bonk', 'Honk', 'Mor', 'Skal', 'Vex', 'Thun', 'Gor', 'Brin', 'Krag', 'Zul', 'Dread', 'Snor', 'Glum'];
const SYL_B = ['brand', 'reaver', 'fang', 'mourn', 'bane', 'gash', 'dor', 'wick', 'thorn', 'rend', 'grin', 'hammer'];
const EPITHET = ['Bane of Goblins', 'Eater of Lunches', 'Who Honks at Kings', 'the Unreasonable', 'Scourge of Snails',
  'Breaker of Shins', 'the Very Loud', 'Doom of Small Goblins', 'Friend to No One', 'the Last Excuse', 'Who Pokes the Gods',
  'the Ill-Advised', 'Ender of Feasts', 'Terror of Geese'];
const ROMAN = ['II', 'III', 'IV', 'VII', 'IX', 'XII', 'XL', 'MMX'];
const WHAT = ['THE GOOSE', 'IT', 'A SWORD?', 'THE LAST SPOON', 'BONK', 'MOM', 'THE GOOD ONE', 'NO', 'THE ENDING', 'A DOOR',
  'UNCLE', 'THE MOON, BUT SHARP'];

const pick = (a, r) => a[Math.floor(r() * a.length)];

function build(type, q, base, family, r) {
  const el = family && r() < 0.7 ? ELEMENTS[family] : null; // most element weapons say so
  const look = { q, base, family, elemNamed: false };
  if (q <= 1) {
    look.cond = pick(COND, r);
    if (el) {
      look.elemNamed = true;
      const a = `${look.cond} ${el.prefix} ${base}`;
      return [a.length <= 22 ? a : `${el.prefix} ${base}`, 22, look];
    }
    return [`${look.cond} ${base}`, 22, look];
  }
  if (q <= 3) {
    look.of = pick(OF, r);
    if (el) {
      look.elemNamed = true;
      return [`${el.prefix} ${base} of ${look.of}`, 30, look];
    }
    look.adj = pick(ADJ, r);
    return [`${look.adj} ${base} of ${look.of}`, 30, look];
  }
  if (q <= 5) {
    look.of = pick(OF_GRAND, r);
    let pre;
    if (el) {
      pre = el.word;
      look.elemNamed = true;
    } else pre = look.grand = pick(GRAND, r);
    if (r() < 0.5) {
      look.adj = pick(ADJ, r);
      return [`${pre} ${look.adj} ${base} of ${look.of}`, 36, look];
    }
    return [`${pre} ${base} of ${look.of}`, 36, look];
  }
  look.relic = pick(SYL_A, r) + pick(SYL_B, r);
  look.epithet = pick(EPITHET, r);
  look.elemNamed = !!family;
  if (q <= 7) return [`${look.relic}, ${look.epithet}`, 38, look];
  look.roman = pick(ROMAN, r);
  if (q <= 9) return [`${look.relic} ${look.roman}, ${look.epithet}`, 40, look];
  look.what = pick(WHAT, r);
  look.base = BASE[type][0];
  const b0 = look.base.toUpperCase();
  return [`${look.what} (${b0.endsWith('S') ? 'SOME' : 'A'} ${b0})`, 40, look];
}

// r: random function (0..1). Returns { name, look }.
export function nameWeapon(type, q, family, standout, r = Math.random, cap = 10) {
  const tier = standout ? Math.min(cap, q + 1) : q;
  let last = null;
  for (let i = 0; i < 14; i++) {
    const [nm, max, look] = build(type, tier, pick(BASE[type], r), family, r);
    look.standout = !!standout;
    if (nm.length <= max) return { name: nm, look };
    last = { name: nm.slice(0, 40), look };
  }
  return last;
}
