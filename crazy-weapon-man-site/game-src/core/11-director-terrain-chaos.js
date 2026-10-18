  const DIRECTOR_EVENTS = [
    {
      id: 'traitoutbreak',
      name: 'PERSONALITY OUTBREAK',
      desc: 'Every enemy in this pack shares the same terrible trait.'
    },
    {
      id: 'eliteunion',
      name: 'ELITE UNION MEETING',
      desc: 'Too many enemies have benefits now. Several are elite.'
    },
    {
      id: 'launchparty',
      name: 'KNOCKBACK FESTIVAL',
      desc: 'Everything gets launched harder. Walls are now gameplay.'
    },
    {
      id: 'weapontrial',
      name: 'WEAPON TRIAL',
      desc: 'Enemies hit harder, but clearing the pack forces a premium weapon review.'
    },
    {
      id: 'airborne',
      name: 'FLOOR IS A SUGGESTION',
      desc: 'Enemies spawn from platforms and air while gravity gets suspicious.'
    },
    {
      id: 'terrainriot',
      name: 'THE MAP HAS DEVELOPED OPINIONS',
      desc: 'A terrain hazard is guaranteed and the stage actively participates in your firing.'
    }
  ];
  function rollDirector() {
    directorEvent = null;
    directorTrait = null;
    directorReward = false;
    if (zoneI === 0 && stageClears === 0) return;
    if (Math.random() > 0.26 + Math.min(0.22, zoneI * 0.035)) return;
    directorEvent = pick(DIRECTOR_EVENTS);
    if (directorEvent.id === 'traitoutbreak') directorTrait = pick(ENEMY_TRAITS);
    if (directorEvent.id === 'weapontrial') directorReward = true;
    if (U.directorStamp) {
      U.directorStamp.textContent = `CHAOS DIRECTOR: ${directorEvent.name}`;
      U.directorStamp.classList.add('show');
    }
    txt(W / 2, 196, directorEvent.name, '#ffd981', true);
    U.msg.textContent = `CHAOS DIRECTOR — ${directorEvent.name}: ${directorEvent.desc}`;
  }
  function clearDirector() {
    if (U.directorStamp) U.directorStamp.classList.remove('show');
    directorEvent = null;
    directorTrait = null;
  }
  function registerClear() {
    if (!packLive) return;
    packLive = false;
    if (killChainCount >= 3) killChainT = Math.max(killChainT, 0.9);
    chaosEvent = null;
    chaosT = 0;
    terrainMode = null;
    terrainHazards = [];
    let trialReward = directorReward;
    directorReward = false;
    let sec = Math.max(0.1, time - packStartedAt),
      good = sec < Math.max(5.5, 9 - zoneI * 0.35);
    stageClears++;
    master = Math.min(9, (9 * stageClears) / stageGoal());
    txt(pl.x + 17, pl.y - 52, `PACK ${stageClears}/${stageGoal()} CLEAR`, '#c7f6ff', true);
    if (good) {
      goodClears++;
      upgradeMeter++;
      txt(pl.x + 17, pl.y - 30, `FAST ${sec.toFixed(1)}s`, '#9fffd0', false);
      if (goodClears >= 2 || upgradeMeter >= 2) {
        clearReward();
        goodClears = 0;
        upgradeMeter = 0;
      }
    } else {
      goodClears = Math.max(0, goodClears - 1);
      upgradeMeter = Math.max(0, upgradeMeter - 0.5);
    }
    if (trialReward) {
      txt(pl.x + 17, pl.y - 78, 'TRIAL PASSED — PREMIUM REVIEW', '#fff176', true);
      clearReward();
    }
    clearDirector();
    if (stageClears >= stageGoal()) openRift(false);
  }
  const TERRAIN = [
    {
      id: 'conveyor',
      name: 'UNION CONVEYOR FLOOR',
      msg: 'The floor has joined organized labor and is moving sideways.'
    },
    { id: 'ice', name: 'LIABILITY ICE', msg: 'Stopping is now more of a long-term goal than an action.' },
    {
      id: 'geyser',
      name: 'PRESSURIZED FLOOR SOUP',
      msg: 'Orange vents launch anything standing on them. This includes accountants.'
    },
    {
      id: 'spring',
      name: 'MANDATORY BOUNCE PADS',
      msg: 'The floor installed career-development trampolines.'
    },
    {
      id: 'signs',
      name: 'FALLING MUNICIPAL SIGNAGE',
      msg: 'The city is dropping infrastructure from the ceiling.'
    }
  ];
  function rollTerrain() {
    terrainHazards = [];
    terrainPadCd = 0;
    terrainTick = 0.7;
    let forced = directorEvent?.id === 'terrainriot';
    if (!forced && zoneI === 0 && Math.random() < 0.55) {
      terrainMode = null;
      return;
    }
    if (!forced && Math.random() > 0.45 + zoneI * 0.065) {
      terrainMode = null;
      return;
    }
    let t = pick(TERRAIN.slice(0, forced ? TERRAIN.length : Math.min(TERRAIN.length, 2 + zoneI)));
    terrainMode = t.id;
    terrainDir = Math.random() < 0.5 ? -1 : 1;
    txt(W / 2, 175, t.name, '#9eefff', true);
    U.msg.textContent = t.msg;
  }
  function updateTerrain(dt) {
    terrainPadCd = Math.max(0, terrainPadCd - dt);
    terrainTick -= dt;
    if (terrainMode === 'conveyor') {
      if (pl.on && pl.y + pl.h > G - 8) pl.vx += terrainDir * 250 * dt;
      for (const e of E) {
        let d = ED[e.type];
        if (!e.dead && !d.air && e.on && e.y + e.h > G - 8) e.vx += terrainDir * 85 * dt;
      }
    } else if (terrainMode === 'spring') {
      let pads = [285, 820];
      for (const x of pads) {
        if (terrainPadCd <= 0 && pl.on && pl.y + pl.h > G - 8 && Math.abs(pl.x + pl.w / 2 - x) < 48) {
          pl.vy = -690;
          pl.on = false;
          terrainPadCd = 0.45;
          sfxJump();
          txt(pl.x + 17, pl.y - 22, 'BOING', '#9effff', false);
          ring(x, G - 8, '#67efff', 55, 3);
        }
        for (const e of E) {
          let d = ED[e.type];
          if (!e.dead && !d.air && e.on && Math.abs(e.x + e.w / 2 - x) < 42 && Math.random() < dt * 2.2) {
            e.vy = -580;
            e.on = false;
            e.stun = Math.max(e.stun, 0.25);
          }
        }
      }
    } else if (terrainMode === 'geyser' && terrainTick <= 0) {
      terrainTick = rand(1.8, 2.6);
      terrainHazards.push({ k: 'geyser', x: rand(100, W - 100), t: 0.78, phase: 'warn', hit: false });
    } else if (terrainMode === 'signs' && terrainTick <= 0) {
      terrainTick = rand(1.8, 2.8);
      terrainHazards.push({
        k: 'sign',
        x: rand(90, W - 90),
        y: -80,
        t: 0.72,
        phase: 'warn',
        hit: false,
        rot: rand(-0.35, 0.35)
      });
    }
    for (const h of terrainHazards) {
      h.t -= dt;
      if (h.k === 'geyser') {
        if (h.phase === 'warn' && h.t <= 0) {
          h.phase = 'blast';
          h.t = 0.5;
          boom(h.x, G - 12, '#ff9b4f', 72, 0.55);
          if (Math.abs(pl.x + pl.w / 2 - h.x) < 55 && pl.y + pl.h > G - 130) {
            pl.vy = -720;
            pl.on = false;
            txt(pl.x + 17, pl.y - 30, 'FLOOR SOUP!', '#ffb66f', false);
          }
          for (const e of E) {
            if (!e.dead && Math.abs(e.x + e.w / 2 - h.x) < 60 && e.y + e.h > G - 150) {
              e.vy = -650;
              e.on = false;
              e.stun = Math.max(e.stun, 0.4);
            }
          }
        } else if (h.phase === 'blast' && h.t <= 0) h.dead = true;
      } else if (h.k === 'sign') {
        if (h.phase === 'warn' && h.t <= 0) {
          h.phase = 'fall';
          h.t = 2;
          h.vy = 0;
        } else if (h.phase === 'fall') {
          h.vy = (h.vy || 0) + 1100 * dt;
          h.y += h.vy * dt;
          if (!h.hit && Math.abs(pl.x + pl.w / 2 - h.x) < 48 && Math.abs(pl.y + pl.h / 2 - h.y) < 55) {
            h.hit = true;
            hurt(Math.round(pl.max * 0.075), { x: h.x });
            txt(pl.x + 17, pl.y - 32, 'ZONING VIOLATION', '#ffca6a', false);
          }
          for (const e of E) {
            if (
              !e.dead &&
              !h.ehit &&
              Math.abs(e.x + e.w / 2 - h.x) < 45 &&
              Math.abs(e.y + e.h / 2 - h.y) < 55
            ) {
              h.ehit = true;
              hitE(e, e.max * 0.35, { col: '#ffc36a', stun: 0.7, knock: Math.sign(e.x - h.x) * 300 });
            }
          }
          if (h.y > G + 50) h.dead = true;
        }
      }
    }
    terrainHazards = terrainHazards.filter(h => !h.dead);
  }
  function drawTerrain() {
    X.save();
    if (terrainMode === 'conveyor') {
      X.globalAlpha = 0.65;
      X.fillStyle = '#33495b';
      X.fillRect(0, G - 13, W, 13);
      X.fillStyle = '#8fe6ff';
      X.font = '900 18px system-ui';
      for (let x = 35; x < W; x += 85) X.fillText(terrainDir > 0 ? '→' : '←', x, G - 18);
    } else if (terrainMode === 'ice') {
      X.globalAlpha = 0.36;
      X.fillStyle = '#8be8ff';
      X.fillRect(0, G - 10, W, 14);
      X.strokeStyle = '#d8fbff';
      X.lineWidth = 2;
      for (let x = 0; x < W; x += 90) {
        X.beginPath();
        X.moveTo(x, G - 8);
        X.lineTo(x + 45, G - 2);
        X.stroke();
      }
    } else if (terrainMode === 'spring') {
      for (const x of [285, 820]) {
        X.globalAlpha = 0.8;
        X.fillStyle = '#4be0ff';
        X.fillRect(x - 42, G - 12, 84, 12);
        X.strokeStyle = '#e7fcff';
        X.lineWidth = 3;
        X.beginPath();
        X.moveTo(x - 28, G - 12);
        X.lineTo(x - 14, G - 25);
        X.lineTo(x, G - 12);
        X.lineTo(x + 14, G - 25);
        X.lineTo(x + 28, G - 12);
        X.stroke();
      }
    }
    for (const h of terrainHazards) {
      if (h.k === 'geyser') {
        if (h.phase === 'warn') {
          X.globalAlpha = 0.7 + 0.2 * Math.sin(time * 18);
          X.strokeStyle = '#ff9b4f';
          X.lineWidth = 4;
          X.beginPath();
          X.arc(h.x, G - 8, 38, 0, Math.PI * 2);
          X.stroke();
          X.fillStyle = '#ffbb73';
          X.font = '900 12px system-ui';
          X.textAlign = 'center';
          X.fillText('PRESSURE', h.x, G - 55);
        } else {
          X.globalAlpha = 0.55;
          let grad = X.createLinearGradient(h.x, G, h.x, G - 190);
          grad.addColorStop(0, '#ff7b38');
          grad.addColorStop(1, '#fff2a1');
          X.fillStyle = grad;
          X.beginPath();
          X.moveTo(h.x - 30, G);
          X.quadraticCurveTo(h.x - 42, G - 100, h.x, G - 190);
          X.quadraticCurveTo(h.x + 42, G - 100, h.x + 30, G);
          X.fill();
        }
      } else if (h.k === 'sign') {
        if (h.phase === 'warn') {
          X.globalAlpha = 0.7;
          X.strokeStyle = '#ffc868';
          X.setLineDash([8, 8]);
          X.beginPath();
          X.moveTo(h.x, 0);
          X.lineTo(h.x, G);
          X.stroke();
          X.setLineDash([]);
          X.fillStyle = '#ffc868';
          X.font = '900 13px system-ui';
          X.textAlign = 'center';
          X.fillText('CITY PROPERTY INCOMING', h.x, 100);
        } else {
          X.save();
          X.translate(h.x, h.y);
          X.rotate(h.rot + time * 0.6);
          X.fillStyle = '#ffc44f';
          X.fillRect(-45, -24, 90, 48);
          X.strokeStyle = '#151515';
          X.lineWidth = 4;
          X.strokeRect(-45, -24, 90, 48);
          X.fillStyle = '#151515';
          X.font = '900 12px system-ui';
          X.textAlign = 'center';
          X.fillText('NO FUN', 0, 4);
          X.restore();
        }
      }
    }
    X.restore();
    X.globalAlpha = 1;
    X.textAlign = 'left';
  }
  const CHAOS = [
    {
      id: 'disco',
      name: 'DISCO EMERGENCY',
      msg: 'Everything gets faster because apparently this is a nightclub now.'
    },
    {
      id: 'lava',
      name: 'THE FLOOR IS LAVA',
      msg: 'Ground contact periodically hurts. Platforms have suddenly become a career choice.'
    },
    {
      id: 'meteors',
      name: 'METEOROLOGICAL FAILURE',
      msg: 'The weather department has lost control of several burning rocks.'
    },
    { id: 'lowgrav', name: 'BUDGET MOON GRAVITY', msg: 'Gravity has been temporarily outsourced.' },
    {
      id: 'audit',
      name: 'SURPRISE MANA AUDIT',
      msg: 'The government is confiscating mana until this pack is dead.'
    },
    {
      id: 'chickens',
      name: 'TACTICAL CHICKEN RELEASE',
      msg: 'Nobody approved this. Several chickens are armed emotionally.'
    }
  ];
  function startChaos() {
    if (zoneI < 1 || chaosEvent) return;
    sfxChaos();
    let ev = pick(CHAOS.slice(0, Math.min(CHAOS.length, 3 + zoneI)));
    chaosEvent = ev.id;
    chaosT = 10 + zoneI * 0.7;
    chaosTick = 0.4;
    txt(W / 2, 125, ev.name, '#fff59d', true);
    U.msg.textContent = ev.msg;
    ring(pl.x + 17, pl.y + 20, '#fff59d', 125, 4);
    if (ev.id === 'chickens') {
      for (let i = 0; i < 3 + Math.min(3, zoneI); i++)
        spawn('bombchicken', clamp(pl.x + (i % 2 ? 1 : -1) * (220 + i * 45), 30, W - 90), false);
    }
  }
  function updateChaos(dt) {
    if (!chaosEvent) return;
    chaosT -= dt;
    chaosTick -= dt;
    if (chaosT <= 0) {
      chaosEvent = null;
      return;
    }
    if (chaosEvent === 'audit') {
      pl.mana = Math.max(0, pl.mana - dt * 4.5);
      if (chaosTick <= 0) {
        chaosTick = 2.1;
        txt(pl.x + 17, pl.y - 35, 'AUDITED', '#ff8f9d');
      }
    } else if (chaosEvent === 'lava') {
      if (chaosTick <= 0) {
        chaosTick = 0.9;
        if (pl.on && pl.y + pl.h > G - 6 && pl.inv <= 0) {
          let h = Math.max(5, Math.round(pl.max * 0.025));
          pl.hp -= h;
          pl.inv = 0.35;
          txt(pl.x + 17, pl.y - 28, 'HOT FLOOR -' + h, '#ff7b45', true);
          shake = 5;
          if (pl.hp <= 0) {
            pl.hp = 0;
            over = true;
          }
        }
      }
    } else if (chaosEvent === 'meteors' && chaosTick <= 0) {
      chaosTick = rand(0.55, 1.05);
      let x = rand(70, W - 70);
      Q.push({
        x,
        y: -25,
        vx: rand(-35, 35),
        vy: rand(310, 430),
        r: 11,
        life: 2.4,
        dam: Math.round(28 + zoneI * 15),
        col: '#ff7b42',
        trail: 0,
        effect: 'meteor'
      });
      ring(x, G - 5, '#ff7b42', 52, 2);
    } else if (chaosEvent === 'disco' && chaosTick <= 0) {
      chaosTick = 0.22;
      chroma = Math.max(chroma, 0.08);
    }
  }

