// One-off content pass: rewrites modern references in player-visible strings with fantasy ones,
// keeping the jokes (noobscrub style rule: fantasy settings only, see docs/STYLE.md).
// Skips ids (lowercase, no spaces, e.g. 'ceo', 'taxevasive') and CSS/code strings.
//
//   npm i --no-save acorn acorn-walk && node crazy-weapon-man-site/tools/fantasy-text.cjs <files...>
const acorn = require('acorn'),
  walk = require('acorn-walk'),
  fs = require('fs');

const MAP = [
  ['internet explorer compatible', 'carrier-pigeon compatible'], ['parking meter', 'toll-gate'], ['parking citation', 'toll citation'],
  ['breakroom', 'mess hall'], ['break room', 'mess hall'], ['neon', 'witchlight'], ['dishwasher', 'cauldron'],
  ['updating their resumes', 'rewriting their wills'], ['the camera zooms in', 'the bard leans in'],
  ['electric guitars', 'battle lutes'], ['rocket boots', 'griffon boots'], ['rocket', 'griffon'], ['podcasts', 'bardic ballads'],
  ['utility pole', 'hitching post'], ['flashlight', 'lantern'], ['rebar', 'iron-bar'], ['laminated', 'lacquered'],
  ['serial number', 'maker’s mark'], ['401(k)', 'pension chest'], ['dental', 'tooth coverage'], ['vending machine', 'wishing well'],
  ['remote work', 'far-tower duty'], ['tires', 'wheels'], ['tire', 'wheel'], ['clipboard', 'wax tablet'], ['pinball', 'bagatelle'],
  ['moonshot button', 'moonshot lever'], ['industrial', 'forge-grade'], ['factory-reject', 'smithy-reject'], ['factory', 'smithy'],
  ['one-star reviewed', 'one-star bard-reviewed'], ['clearance-bin', 'bargain-barrel'], ['clearance bin', 'bargain barrel'],
  ['purchase orders', 'requisition scrolls'], ['purchase order', 'requisition scroll'], ['wet-cardboard', 'wet-parchment'],
  ['cardboard', 'parchment'], ['recall notice', 'royal recall'], ['clocked in', 'on the roster'], ['overdraft', 'debtor’s'],
  ['barcode scanner', 'tally-rune reader'], ['pto', 'feast days'], ['turbo', 'gale-powered'],
  ['chainsaw', 'war-scythe'], ['reactor', 'rune-core'], ['loose ammo', 'loose arrow'], ['ammo', 'arrows'], ['parking enforcement', 'toll-bridge enforcement'],
  ['parking authority', 'toll-bridge authority'], ['parking ticket', 'toll writ'], ['parking lot', 'castle courtyard'],
  ['parking-lot', 'courtyard'], ['parking', 'toll-bridge'], ['food court', 'feast hall'], ['hr complaint', 'guild grievance'],
  ['hr flails', 'grievance flails'], ['long knife of hr', 'long knife of grievances'],
  ['hr has been notified', 'the guild has been notified'], ['hr cannot', 'the guild cannot'], ['hr', 'the guild'],
  ['osha noncompliance', 'guild-safety noncompliance'], ['osha', 'guild-safety'], ['lunch break', 'mead break'],
  ['staff meeting', 'staff council'], ['meetings', 'councils'], ['meeting', 'council'], ['laser pointer', 'scrying pointer'],
  ['copy machine', 'copying scriptorium'], ['printer', 'scribe golem'], ['spreadsheet', 'ledger'],
  ['elevators', 'floating staircases'], ['elevator', 'floating staircase'], ['microwave vision', 'basilisk vision'],
  ['microwave eyes', 'basilisk eyes'], ['microwaved', 'oven-blasted'], ['microwave', 'dragon-oven'],
  ['dangerously caffeinated', 'dangerously over-brewed'], ['overcaffeinated', 'over-potioned'], ['caffeinated', 'over-brewed'],
  ['caffeine', 'brew'], ['amount of coffee', 'amount of mana potion'], ['too much coffee', 'too much mana potion'],
  ['coffee', 'potion'], ['apocalypse intern', 'apocalypse apprentice'], ['interns', 'apprentices'], ['intern', 'apprentice'],
  ['unionized', 'guild-certified'], ['union-made', 'guild-made'], ['union', 'guild'], ['forklift', 'siege-ox'],
  ['nuclear', 'meteoric'], ['plasma', 'starfire'], ['quantumly', 'arcanely'], ['quantum', 'arcane'],
  ['laser shot', 'beam shot'], ['lasers', 'beams'], ['laser', 'beam'], ['blender', 'millstone'], ['garage', 'forge'],
  ['stock options', 'royal stipends'], ['stock option', 'royal stipend'], ['cubicles', 'scribe cells'], ['cubicle', 'scribe cell'],
  ['executive deck', 'high council deck'], ['executive-grade', 'royal-grade'], ['executive', 'royal'],
  ['boardroom', 'throne-room'], ['workplace', 'kingdom'], ['warranty', 'blessing'], ['coupons', 'tavern vouchers'],
  ['coupon', 'voucher'], ['super saiyan', 'ascended'], ['anime budget', 'bardic budget'], ['nightclub', 'tavern'],
  ['conveyor', 'millwheel'], ['office', 'scriptorium'], ['robots', 'golems'], ['robot', 'golem'], ['laptop', 'spellbook'],
  ['emails', 'scrolls'], ['email', 'scroll'], ['powerpoint', 'slideshow'], ['wifi', 'ley-line'],
  ['phones', 'scrying stones'], ['phone', 'scrying stone'], ['cyber', 'rune'], ['shopping carts', 'siege carts'],
  ['shopping cart', 'siege cart'], ['toaster', 'hearth-stone'], ['vacuum', 'bellows'], ['leaf blower', 'gale bellows'],
  ['gas station', 'waystation'], ['energy drink', 'vigor tonic'], ['soda', 'cider'], ['pizza', 'meat pie'],
  ['the mall', 'the bazaar'], ['truck', 'wagon'], ['computer', 'abacus golem'], ['keyboard', 'rune tablet'],
  ['subscription', 'tithe'], ['shareholders', 'court nobles'], ['shareholder', 'court noble']
];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RULES = MAP.map(([a, b]) => [new RegExp('(?<![A-Za-z])' + esc(a) + '(?![A-Za-z])', 'gi'), b]);
function caseLike(m, to, whole) {
  const letters = whole.replace(/[^A-Za-z]/g, '');
  if (letters && letters === letters.toUpperCase()) return to.toUpperCase(); // ALL-CAPS callout
  const words = whole.split(/\s+/).filter(w => /^[A-Za-z]/.test(w) && w.length > 3);
  const titleish = words.length && words.filter(w => /^[A-Z]/.test(w)).length / words.length > 0.6;
  if (/^[A-Z]/.test(m) && titleish) return to.replace(/(^|\s|-)([a-z])/g, (x, p, c) => p + c.toUpperCase());
  if (/^[A-Z]/.test(m)) return to[0].toUpperCase() + to.slice(1);
  return to;
}
const rewrite = s => RULES.reduce((o, [re, to]) => o.replace(re, m => caseLike(m, to, s)), s);
const isId = s => !/\s/.test(s) && s === s.toLowerCase();
const isCode = s => /[{};]|^\s*\.|#[0-9a-f]{3}|\dpx\b|var\(|=>/.test(s);

const log = [];
let changed = 0;
for (const f of process.argv.slice(2)) {
  let src = fs.readFileSync(f, 'utf8'),
    off = 0,
    ast;
  // core files are slices of one closure: 00 opens it, 99 closes it, the rest are its body
  for (const [pre, post] of [['', ''], ['', '\n})();'], ['(() => {', ''], ['(function(){', '\n})']]) {
    try {
      ast = acorn.parse(pre + src + post, { ecmaVersion: 2023 });
      off = pre.length;
      break;
    } catch (e) {}
  }
  if (!ast) throw new Error('cannot parse ' + f);
  const edits = [];
  walk.full(ast, n => {
    if (n.type === 'Literal' && typeof n.value === 'string') {
      const v = n.value;
      if (isId(v) || isCode(v)) return;
      const r = rewrite(v);
      if (r === v) return;
      const raw = src.slice(n.start - off, n.end - off),
        q = raw[0];
      // keep the original quoting; only letters and hyphens change, so no escaping is affected
      edits.push([n.start - off, n.end - off, q + rewrite(raw.slice(1, -1)) + q]);
      log.push(v + '  =>  ' + r);
    } else if (n.type === 'TemplateElement') {
      const raw = src.slice(n.start - off, n.end - off);
      if (isCode(raw)) return;
      const r = rewrite(raw);
      if (r !== raw) {
        edits.push([n.start - off, n.end - off, r]);
        log.push(raw + '  =>  ' + r);
      }
    }
  });
  edits.sort((a, b) => b[0] - a[0]);
  for (const [a, b, t] of edits) src = src.slice(0, a) + t + src.slice(b);
  if (edits.length) {
    fs.writeFileSync(f, src);
    changed += edits.length;
  }
}
if (process.env.LOG) fs.writeFileSync(process.env.LOG, log.join('\n'));
console.log('edited strings:', changed);
