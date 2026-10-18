  const ARMOR_SLOTS = ['head', 'body', 'feet'];
  const ARMOR_LABEL = { head: 'HEAD', body: 'BODY', feet: 'FEET' };
  const ARMOR_BASES = {
    head: [
      {
        name: 'BERSERKER CROWN',
        desc: 'Leaves the eyes exposed because sanity is not protective equipment.',
        armor: 8,
        damage: 0.07,
        speed: 0.07,
        crit: 0.03,
        move: 4
      },
      {
        name: 'SHINOBI HOOD',
        desc: 'A suspiciously aerodynamic hood for making precision everybody else’s problem.',
        armor: 7,
        damage: 0.05,
        speed: 0.11,
        crit: 0.026,
        move: 9
      },
      {
        name: 'PANIC HELM',
        desc: 'Protects the skull while amplifying every bad idea inside it.',
        armor: 14,
        damage: 0.09,
        speed: 0.03,
        crit: 0.018,
        move: 0
      },
      {
        name: 'ROYAL VISOR',
        desc: 'Quarterly earnings are up. Restraint is down.',
        armor: 9,
        damage: 0.08,
        speed: 0.06,
        crit: 0.034,
        move: 4
      },
      {
        name: 'WELDING CROWN',
        desc: 'Certified for sparks, screaming, and looking directly at poor decisions.',
        armor: 12,
        damage: 0.06,
        speed: 0.05,
        crit: 0.024,
        move: 2
      }
    ],
    body: [
      {
        name: 'STRAITJACKET OF CLARITY',
        desc: 'Tightens your posture and your terrible intentions.',
        armor: 16,
        damage: 0.11,
        speed: 0.05,
        crit: 0.01,
        move: 6
      },
      {
        name: 'MURDER HOODIE',
        desc: 'Very breathable. Extremely inadvisable.',
        armor: 10,
        damage: 0.07,
        speed: 0.12,
        crit: 0.016,
        move: 20
      },
      {
        name: 'SHINOBI CUIRASS',
        desc: 'Makes every decision feel a little too precise.',
        armor: 14,
        damage: 0.09,
        speed: 0.1,
        crit: 0.022,
        move: 14
      },
      {
        name: 'PANIC PLATE',
        desc: 'Chunky protection for people committed to poor restraint.',
        armor: 24,
        damage: 0.13,
        speed: 0.03,
        crit: 0.01,
        move: 0
      },
      {
        name: 'KINETIC WRAP',
        desc: 'Turns movement into violence and violence into cardio.',
        armor: 12,
        damage: 0.06,
        speed: 0.15,
        crit: 0.018,
        move: 24
      },
      {
        name: 'ROYAL FLAK VEST',
        desc: 'Throne-room protection for hostile kingdom takeovers.',
        armor: 18,
        damage: 0.12,
        speed: 0.08,
        crit: 0.028,
        move: 10
      },
      {
        name: 'BERSERKER GI',
        desc: 'Soft fabric, hard boundaries, deeply unstable energy.',
        armor: 13,
        damage: 0.1,
        speed: 0.11,
        crit: 0.02,
        move: 16
      }
    ],
    feet: [
      {
        name: 'GRIFFON BOOTS',
        desc: 'The floor becomes more of a scheduling suggestion.',
        armor: 7,
        damage: 0.04,
        speed: 0.14,
        crit: 0.012,
        move: 34
      },
      {
        name: 'STEEL-TOE GREAVES',
        desc: 'Kick the problem until the ledger agrees.',
        armor: 15,
        damage: 0.08,
        speed: 0.05,
        crit: 0.012,
        move: 12
      },
      {
        name: 'SHINOBI TABI',
        desc: 'Quiet feet. Loud consequences.',
        armor: 6,
        damage: 0.05,
        speed: 0.16,
        crit: 0.02,
        move: 30
      },
      {
        name: 'KINETIC SABATONS',
        desc: 'Every step appears to be legally considered acceleration.',
        armor: 10,
        damage: 0.06,
        speed: 0.13,
        crit: 0.016,
        move: 28
      },
      {
        name: 'TAX EVASION BOOTS',
        desc: 'Move quickly enough and apparently forms cannot find you.',
        armor: 8,
        damage: 0.07,
        speed: 0.12,
        crit: 0.024,
        move: 24
      }
    ]
  };
  function armorSlotLabel(slot) {
    return ARMOR_LABEL[slot] || String(slot || 'ARMOR').toUpperCase();
  }
  function armorScore(a) {
    return !a
      ? 0
      : (a.armor || 0) * 2.8 +
          (a.damage || 0) * 320 +
          (a.speed || 0) * 260 +
          (a.crit || 0) * 2200 +
          (a.move || 0) * 1.4;
  }
  function makeArmor(level, boss = false, slot = null) {
    slot = ARMOR_SLOTS.includes(slot) ? slot : pick(ARMOR_SLOTS);
    let roll = Math.random(),
      ix = boss
        ? roll < 0.25
          ? 10
          : roll < 0.52
            ? 11
            : roll < 0.75
              ? 12
              : roll < 0.9
                ? 13
                : roll < 0.98
                  ? 14
                  : 15
        : roll < 0.4
          ? 5
          : roll < 0.68
            ? 6
            : roll < 0.85
              ? 7
              : roll < 0.94
                ? 8
                : roll < 0.982
                  ? 9
                  : roll < 0.996
                    ? 10
                    : 11;
    ix = clamp(ix + Math.floor(Math.max(0, level - 1) / 16), 5, Math.min(R.length - 1, boss ? 16 : 13));
    let r = R[ix],
      b = pick(ARMOR_BASES[slot]),
      scale = 1 + Math.min(0.48, level * 0.011);
    return {
      kind: 'armor',
      slot,
      id: 'armor-' + Math.random().toString(36).slice(2),
      rar: r.n,
      col: r.col,
      rank: ix,
      name: `${r.n} ${b.name}`,
      desc: b.desc,
      armor: Math.round(b.armor * r.m * scale),
      damage: +(b.damage + (r.m - 1) * 0.028).toFixed(3),
      speed: +(b.speed + (r.m - 1) * 0.022).toFixed(3),
      crit: +(b.crit + Math.max(0, ix - 5) * 0.0026).toFixed(3),
      move: Math.round(b.move * (1 + (r.m - 1) * 0.5))
    };
  }
  function makeArmorUpgrade(level, slot = null) {
    let slots = ARMOR_SLOTS.includes(slot) ? [slot] : ARMOR_SLOTS,
      best = null,
      bestGain = -Infinity;
    for (const s of slots) {
      let local = null,
        localS = -1;
      for (let i = 0; i < 12; i++) {
        let a = makeArmor(level, true, s),
          sc = armorScore(a);
        if (sc > localS) {
          local = a;
          localS = sc;
        }
      }
      let old = pl.armors?.[s] || null,
        oldS = armorScore(old),
        gain = oldS ? localS / oldS : 10 + localS / 1000;
      if (gain > bestGain) {
        best = local;
        bestGain = gain;
      }
    }
    if (!best) return makeArmor(level, true, slot);
    let old = pl.armors?.[best.slot] || null,
      oldS = armorScore(old),
      bestS = armorScore(best);
    if (oldS && bestS <= oldS * 1.06) {
      let boost = (oldS * 1.1) / Math.max(1, bestS);
      best.armor = Math.round(best.armor * Math.min(1.34, boost));
      best.damage = +(best.damage * Math.min(1.26, boost)).toFixed(3);
      best.speed = +(best.speed * Math.min(1.22, boost)).toFixed(3);
      best.crit = +(best.crit * Math.min(1.2, boost)).toFixed(3);
      best.move = Math.round(best.move * Math.min(1.2, boost) + 3);
    }
    return best;
  }
  function armorSummary(a) {
    return `+${a.armor} ARM • +${Math.round(a.damage * 100)}% DMG • +${Math.round(a.speed * 100)}% SPD • +${Math.round(a.crit * 100)}% CRIT${a.move ? ` • +${a.move} MOVE` : ''}`;
  }
  function armorLoadoutShort() {
    let a = pl.armors || {};
    return ARMOR_SLOTS.map(s => `${ARMOR_LABEL[s][0]}:${a[s]?.rar || '—'}`).join(' • ');
  }
  function armorLoadoutLong() {
    let a = pl.armors || {};
    return ARMOR_SLOTS.map(s => `${ARMOR_LABEL[s]} ${a[s]?.name || 'EMPTY'}`).join(' • ');
  }
  function applyArmorStats(a, dir = 1) {
    if (!a) return;
    pl.armor += dir * (a.armor || 0);
    pl.move += dir * (a.move || 0);
    pl.crit += dir * (a.crit || 0);
    pl.boonDamage *= dir > 0 ? 1 + (a.damage || 0) : 1 / Math.max(0.001, 1 + (a.damage || 0));
    pl.boonSpeed *= dir > 0 ? 1 + (a.speed || 0) : 1 / Math.max(0.001, 1 + (a.speed || 0));
  }
  function equipArmor(a, forced = false) {
    if (!a) return false;
    armorDryKills = 0;
    let slot = ARMOR_SLOTS.includes(a.slot) ? a.slot : 'body';
    a.slot = slot;
    pl.armors = pl.armors || { head: null, body: null, feet: null };
    let old = pl.armors[slot],
      oldS = armorScore(old),
      newS = armorScore(a),
      better = forced || !old || newS > oldS * 1.015;
    sfxLoot(a);
    if (better) {
      if (old) applyArmorStats(old, -1);
      pl.armors[slot] = a;
      applyArmorStats(a, 1);
      setEquipFx(a, `${armorSlotLabel(slot)} ARMOR EQUIPPED`);
      stop = Math.max(stop, 0.08);
      flash = Math.max(flash, 0.22);
      chroma = Math.max(chroma, 0.1);
      shake = Math.max(shake, 6);
      txt(pl.x + 17, pl.y - 72, `${armorSlotLabel(slot)} ARMOR UPGRADE`, a.col, true);
      txt(pl.x + 17, pl.y - 44, old ? 'OLD PIECE REPLACED' : 'EMPTY SLOT FILLED', '#ffffff', false);
      ring(pl.x + 17, pl.y + 12, a.col, 126, 6);
      part(pl.x + 17, pl.y + 12, a.col, 20, 230, 7);
      hudUpgradeT = 3.0;
      U.fsUpgradeName.textContent = `${armorSlotLabel(slot)}: ${a.name}`;
      U.fsUpgradeName.style.color = a.col;
      U.fsUpgradeGain.textContent = `REPLACED ${old?.name || 'EMPTY SLOT'} • ${armorSummary(a)}`;
      U.fsUpgrade.classList.add('show');
      feedLine(
        `<b style="color:${a.col}">${a.name}</b><br>${a.rar} ${armorSlotLabel(slot)} ARMOR • ${armorSummary(a)} • <b>${old ? 'REPLACED OLD PIECE' : 'AUTO-EQUIPPED'}</b>`
      );
      U.msg.textContent = `BEST ${armorSlotLabel(slot)} ARMOR EQUIPPED: ${a.name}. ${old ? `Replaced ${old.name}.` : 'Filled an empty slot.'}`;
    } else {
      pl.hp = Math.min(pl.max, pl.hp + 40);
      pl.mana = Math.min(100, pl.mana + 14);
      feedLine(
        `<span style="color:${a.col}">${a.name}</span> salvaged • ${armorSlotLabel(slot)} score ${Math.round(newS)} < equipped ${Math.round(oldS)}`
      );
      U.msg.textContent = `${a.name} was not better than your equipped ${armorSlotLabel(slot)} armor, so it was salvaged.`;
    }
    lootSlow = 0;
    render();
    return better;
  }
  function spawnDrop(x, y, item, cache = false) {
    weaponDryKills = 0;
    weaponDropsThisRun++;
    D.push({ x, y, vx: 0, vy: -100, life: cache ? 10 : 9, arm: cache ? 1.35 : 1.5, item });
    let isArmor = item?.kind === 'armor',
      notable = isArmor || cache || rarityRank(item) >= 2 || estimateDPS(item) > estimateDPS(curW()) * 1.05;
    if (notable) {
      lootSlow = Math.max(lootSlow, isArmor ? 0.12 : cache ? 0.14 : 0.08);
      U.msg.textContent =
        (isArmor
          ? `VERY RARE ${armorSlotLabel(item.slot)} ARMOR! `
          : cache
            ? 'CACHE DROP! '
            : 'WEAPON DROP! ') + 'Time flexed just enough to admire it.';
    }
  }
