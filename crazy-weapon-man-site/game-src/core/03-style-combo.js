  const COMBO_PRAISE = [
    [0, 'WARMING UP', 'Crazy Weapon Man believes in you.'],
    [25, 'NICE!', 'That enemy probably had a family. Keep going.'],
    [60, 'VERY NICE!', 'The numbers are beginning to smile.'],
    [110, 'YOU ARE COOKING', 'Something irresponsible is happening.'],
    [180, 'CERTIFIED PROBLEM', 'Local enemies have filed paperwork.'],
    [280, 'ABSOLUTE MENACE', 'This is becoming a kingdom incident.'],
    [420, 'WEAPON ENTHUSIAST', 'Excellent form. Questionable intent.'],
    [620, 'THE GUILD HAS BEEN NOTIFIED', 'The guild cannot physically reach you.'],
    [900, 'LOCAL LEGEND', 'Nearby monsters are rewriting their wills.'],
    [1250, 'DEEPLY UNREASONABLE', 'The combo is now making its own decisions.'],
    [1700, 'PLEASE CONTINUE', 'This is objectively excellent behavior.'],
    [2300, 'THIS IS ART', 'Violence has become a creative medium.'],
    [3100, 'SLAUGHTER SCHOLAR', 'You have done the research.'],
    [4100, 'APOCALYPSE APPRENTICE', 'Promoted without additional compensation.'],
    [5400, 'DPS PHILOSOPHER', 'You understand the number on a spiritual level.'],
    [7000, 'COMBO ARCHITECT', 'Every enemy is structural material now.'],
    [9000, 'UNEMPLOYABLE', 'A powerful career milestone.'],
    [12000, 'LEGALLY A DISASTER', 'Congratulations. Counsel has been retained.'],
    [16000, 'THE CROWD IS CONCERNED', 'The crowd is also extremely impressed.'],
    [21000, 'DO NOT STOP NOW', 'Momentum is a beautiful thing.'],
    [28000, 'WE BELIEVE IN YOU', 'More than your enemies ever did.'],
    [37000, 'THE NUMBER LOVES YOU', 'Your DPS has developed attachment issues.'],
    [49000, 'REALITY IS CLAPPING', 'Physics has stopped objecting.'],
    [65000, 'HISTORIC PERFORMANCE', 'Future textbooks will omit the details.'],
    [85000, 'SLAUGHTER SAVANT', 'Your technique is upsettingly efficient.'],
    [110000, 'THE GAME IS PROUD OF YOU', 'Please accept this legally meaningless praise.'],
    [145000, 'BEYOND MANAGEMENT', 'No supervisor remains qualified to evaluate this.'],
    [190000, 'COMBO OF DESTINY', 'Apparently this was always going to happen.'],
    [250000, 'ABSOLUTELY MAGNIFICENT', 'The weapon is emotional now.'],
    [330000, 'YOU ARE THE CONTENT', 'Playtesters will speak of this run.'],
    [430000, 'REALITY HAS SUBSCRIBED', 'It would like notifications turned on.'],
    [560000, 'NUMERICALLY ASCENDED', 'Ordinary arithmetic no longer applies.'],
    [730000, 'THE SLAUGHTER CONTINUES', 'And frankly we are delighted for you.'],
    [950000, 'ONE MILLION IS WATCHING', 'Probably. Do not fact-check this.'],
    [1250000, 'COMBO BEYOND LANGUAGE', 'Words are becoming the bottleneck.']
  ];
  const PRAISE_PREFIX = [
    'ABSOLUTELY',
    'HISTORICALLY',
    'UNREASONABLY',
    'CATASTROPHICALLY',
    'BEAUTIFULLY',
    'SUSPICIOUSLY',
    'MAGNIFICENTLY',
    'PROFESSIONALLY',
    'COSMICALLY',
    'MEDICALLY'
  ];
  const PRAISE_CORE = [
    'VIOLENT',
    'EFFICIENT',
    'IRRESPONSIBLE',
    'IMPRESSIVE',
    'UNSTOPPABLE',
    'QUESTIONABLE',
    'GLORIOUS',
    'OVERQUALIFIED',
    'TERRIFYING',
    'PRODUCTIVE'
  ];
  const PRAISE_END = [
    'COMBO',
    'SLAUGHTER',
    'PERFORMANCE',
    'INCIDENT',
    'MASTERPIECE',
    'ACHIEVEMENT',
    'WORKFLOW',
    'MOMENT',
    'PROBLEM',
    'BREAKTHROUGH'
  ];
  function styleTier() {
    let best = COMBO_PRAISE[0];
    for (const t of COMBO_PRAISE) {
      if (styleScore >= t[0]) best = t;
      else break;
    }
    return best;
  }
  function styleGrade() {
    let t = styleTier();
    if (styleScore < COMBO_PRAISE.at(-1)[0]) return t[1];
    let n = Math.floor(styleScore / 25000),
      a = PRAISE_PREFIX[n % PRAISE_PREFIX.length],
      b = PRAISE_CORE[Math.floor(n / PRAISE_PREFIX.length) % PRAISE_CORE.length],
      c = PRAISE_END[Math.floor(n / (PRAISE_PREFIX.length * PRAISE_CORE.length)) % PRAISE_END.length];
    return `${a} ${b} ${c}`;
  }
  function styleMessage() {
    let t = styleTier();
    if (styleScore < COMBO_PRAISE.at(-1)[0]) return t[2];
    let n = Math.floor(styleScore / 50000);
    return [
      `The combo has exceeded the motivational vocabulary budget.`,
      `Crazy Weapon Man is doing incredible work and should be very proud.`,
      `Your enemies are participating in something larger than themselves.`,
      `The number keeps going up. This is exactly what we wanted.`,
      `Excellent slaughter. No notes.`,
      `The game would like to formally recognize your commitment to the bit.`
    ][n % 6];
  }
  function styleAdd(n, label = '') {
    styleScore = Math.max(0, styleScore + n);
    styleT = 1.4;
    let g = styleGrade();
    if (g !== styleLastGrade) {
      styleLastGrade = g;
      txt(pl.x + 17, pl.y - 76, g, '#fff176', true);
      if (label) txt(pl.x + 17, pl.y - 52, label, '#8ff2ff', false);
      let q = Math.min(8, Math.log10(styleScore + 10));
      tone(390 + q * 55, 690 + q * 120, 0.09 + 0.008 * q, 0.022 + 0.003 * q, 'triangle');
      if (q > 4) tone(820 + q * 90, 1240 + q * 140, 0.07, 0.014, 'sine', 0.025);
    }
  }
  function updateStyle(dt) {
    styleT = Math.max(0, styleT - dt);
    if (styleScore > 0) {
      let slowDecay = Math.max(0.55, Math.sqrt(styleScore) * 0.028),
        combatGrace = styleT > 0 ? 0.16 : 1;
      styleScore = Math.max(0, styleScore - dt * slowDecay * combatGrace);
    }
    let g = styleGrade();
    if (U.styleGrade) U.styleGrade.textContent = g;
    if (U.styleText)
      U.styleText.textContent = `${Math.floor(styleScore).toLocaleString()} COMBO • ${styleMessage()}`;
    if (U.styleFill) {
      let next = COMBO_PRAISE.find(x => x[0] > styleScore);
      let prev = styleTier()[0],
        den = next ? Math.max(1, next[0] - prev) : Math.max(1, styleScore * 0.18);
      U.styleFill.style.width = (next ? clamp(((styleScore - prev) / den) * 100, 4, 100) : 100) + '%';
    }
    if (U.styleHud) U.styleHud.classList.toggle('hot', styleScore > 8);
  }
  function styleXpMult() {
    return Math.min(1.65, 1 + Math.log10(styleScore + 1) * 0.105);
  }
  function chainTargetX() {
    return W - 150;
  }
  function chainTargetY() {
    return 124;
  }
  function chainTierName(n) {
    return n >= 20
      ? 'MASS EXTINCTION'
      : n >= 15
        ? 'SLAUGHTER CASCADE'
        : n >= 10
          ? 'DOUBLE-DIGIT DISASTER'
          : n >= 7
            ? 'MURDER STREAK'
            : n >= 5
              ? 'CHAIN REACTION'
              : n >= 3
                ? 'KILL CHAIN'
                : 'QUICK KILL';
  }
  function chainScoreFly(x, y, amount, count) {
    let life = 1.0;
    T.push({
      kind: 'chainScore',
      x,
      y,
      tx: chainTargetX(),
      ty: chainTargetY(),
      s: `+${amount.toLocaleString()} SLAUGHTER`,
      sub: `${count}× ${chainTierName(count)}`,
      col: count >= 10 ? '#ff78e8' : count >= 5 ? '#fff176' : '#7ff7ff',
      life,
      max: life,
      age: 0
    });
  }
  function killChainAdd(e, one = false, elite = false) {
    let continuing = killChainT > 0 && killChainCount > 0;
    killChainCount = continuing ? killChainCount + 1 : 1;
    killChainT = killChainWindow;
    killChainBest = Math.max(killChainBest, killChainCount);
    let mult = 1 + Math.max(0, killChainCount - 1) * 0.22,
      bonus =
        killChainCount <= 1
          ? 0
          : Math.round((5 + killChainCount * 3.2) * mult * (one ? 1.35 : 1) * (elite ? 1.28 : 1));
    if (bonus > 0) {
      killChainBonusTotal += bonus;
      styleAdd(bonus, chainTierName(killChainCount));
      chainScoreFly(e.x + e.w / 2, e.y + e.h * 0.35, bonus, killChainCount);
    }
    if (U.killChainHud) {
      U.killChainHud.classList.add('show', 'pulse');
      setTimeout(() => U.killChainHud && U.killChainHud.classList.remove('pulse'), 190);
    }
    if (
      killChainCount === 3 ||
      killChainCount === 5 ||
      killChainCount === 10 ||
      killChainCount === 15 ||
      killChainCount === 20
    ) {
      txt(W / 2, 205, `${killChainCount}× ${chainTierName(killChainCount)}`, '#fff176', true);
      uiChime(true);
      shake = Math.max(shake, Math.min(13, 3 + killChainCount * 0.35));
    }
    updateKillChainHud();
  }
  function chainCashout() {
    if (killChainCount < 3) {
      killChainCount = 0;
      killChainBonusTotal = 0;
      updateKillChainHud();
      return;
    }
    let cash = Math.round(killChainCount * killChainCount * (killChainCount >= 10 ? 2.4 : 1.45));
    styleAdd(cash, 'CHAIN CASHOUT');
    let life = 1.4;
    T.push({
      kind: 'chainCash',
      x: W / 2,
      y: 190,
      s: `${killChainCount}× CHAIN CASHOUT`,
      sub: `+${cash.toLocaleString()} SLAUGHTER`,
      col: killChainCount >= 10 ? '#ff78e8' : '#fff176',
      life,
      max: life
    });
    uiChime(true);
    killChainCount = 0;
    killChainBonusTotal = 0;
    updateKillChainHud();
  }
  function updateKillChainHud() {
    if (!U.killChainHud) return;
    let active = killChainCount > 0 && killChainT > 0;
    U.killChainHud.classList.toggle('show', active);
    U.killChainCount.textContent = `×${killChainCount}`;
    U.killChainBonus.textContent = `+${Math.round(killChainBonusTotal).toLocaleString()} SLAUGHTER THIS CHAIN`;
    U.killChainTime.textContent = active ? `${killChainT.toFixed(1)}s` : '0.0s';
    U.killChainFill.style.width = (active ? clamp((killChainT / killChainWindow) * 100, 0, 100) : 0) + '%';
  }
  function updateKillChain(dt) {
    if (killChainCount <= 0) return;
    killChainT = Math.max(0, killChainT - dt);
    updateKillChainHud();
    if (killChainT <= 0) chainCashout();
  }

