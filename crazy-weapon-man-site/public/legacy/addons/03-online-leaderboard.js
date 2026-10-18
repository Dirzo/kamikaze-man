(() => {
  const CLIENT_KEY = 'crazyWeaponMan.clientId.v1';
  const GAME_VERSION = 'v1.1-frenzy';
  const BOARD_VIEWS = new Set(['current', 'all', 'legacy']);
  let onlineRows = [];
  let leaderboardView = 'current';

  function getClientId() {
    try {
      let id = localStorage.getItem(CLIENT_KEY);
      if (id && /^[A-Za-z0-9_-]{8,80}$/.test(id)) return id;
      id =
        'cwm_' +
        (crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36));
      localStorage.setItem(CLIENT_KEY, id);
      return id;
    } catch (_) {
      return 'cwm_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
  }

  function setStatus(text) {
    if (U.globalStatus) U.globalStatus.textContent = text;
  }
  function viewLabel() {
    return leaderboardView === 'all' ? 'ALL-TIME' : leaderboardView === 'legacy' ? 'LEGACY' : 'CURRENT PATCH';
  }
  function patchLabel(v) {
    return String(v || 'legacy').replace(/^v/i, 'v');
  }

  function installBoardTabs() {
    const card = document.getElementById('leaderboardCard');
    if (!card || document.getElementById('lbTabs')) return;
    const style = document.createElement('style');
    style.textContent =
      '.lbTabs{display:flex;gap:6px;flex-wrap:wrap;margin:3px 0 9px}.lbTab{appearance:none;border:1px solid #31445e;background:#0a111a;color:#8fa5bf;border-radius:999px;padding:6px 10px;font:900 10px system-ui;letter-spacing:.08em;cursor:pointer}.lbTab:hover{border-color:#6ddfff;color:#dff9ff}.lbTab.active{border-color:#ffe66d;color:#fff17c;background:#1b190d;box-shadow:0 0 16px #ffe66d18}.lbPatch{display:inline-block;margin-left:5px;padding:1px 5px;border:1px solid #42536a;border-radius:999px;color:#aebfd3;font-size:9px;font-weight:900;vertical-align:1px}';
    document.head.appendChild(style);
    const tabs = document.createElement('div');
    tabs.id = 'lbTabs';
    tabs.className = 'lbTabs';
    tabs.innerHTML =
      '<button class="lbTab active" data-lbview="current">CURRENT PATCH</button><button class="lbTab" data-lbview="all">ALL-TIME</button><button class="lbTab" data-lbview="legacy">LEGACY</button>';
    const row = card.querySelector('.row');
    if (row) row.insertAdjacentElement('afterend', tabs);
    else card.prepend(tabs);
    tabs.addEventListener('click', e => {
      const b = e.target.closest('[data-lbview]');
      if (!b || !BOARD_VIEWS.has(b.dataset.lbview) || b.dataset.lbview === leaderboardView) return;
      leaderboardView = b.dataset.lbview;
      renderLeaderboard();
      syncGlobalLeaderboard();
    });
  }

  function refreshTabs() {
    document
      .querySelectorAll('[data-lbview]')
      .forEach(b => b.classList.toggle('active', b.dataset.lbview === leaderboardView));
  }

  renderLeaderboard = function (newId = '') {
    if (!U.leaderboard) return;
    refreshTabs();
    const rows = globalBoard ? onlineRows : leaderboard;
    const label = viewLabel();
    if (!rows.length) {
      U.leaderboard.innerHTML = `<div class="lbempty">${globalBoard ? `No ${label.toLowerCase()} records yet. Be the first bad influence.` : 'Collect something irresponsible.'}</div>`;
      if (U.titleBest)
        U.titleBest.textContent = globalBoard
          ? `No ${label.toLowerCase()} weapon has earned the throne yet.`
          : 'No weapon has earned the throne yet.';
      return;
    }
    U.leaderboard.innerHTML = rows
      .map(
        (x, i) =>
          `<div class="lbrow${x.id === newId ? ' lbNew' : ''}"><div class="lbrank">${i + 1}</div><div><div class="lbname" style="color:${x.col || '#fff'}">${escapeHtml(x.name)}</div><div class="lbmeta">${escapeHtml(x.player || 'Anonymous Lunatic')} • ${escapeHtml(x.rar)} ${escapeHtml(x.type)} • Lv.${Number(x.level || 1)} • ${Number(x.kills || 0).toLocaleString()} kills <span class="lbPatch">${escapeHtml(patchLabel(x.version))}</span></div></div><div class="lbdps">${Number(x.dps).toLocaleString()} DPS</div></div>`
      )
      .join('');
    const b = rows[0];
    if (U.titleBest)
      U.titleBest.innerHTML = `${escapeHtml(b.name)} — ${Number(b.dps).toLocaleString()} DPS<br><span style="font-size:11px;color:#aebfd3">held by ${escapeHtml(b.player || 'Anonymous Lunatic')} • ${label} #1 • ${escapeHtml(patchLabel(b.version))}</span>`;
  };

  syncGlobalLeaderboard = async function () {
    try {
      setStatus('SYNCING • ' + viewLabel());
      const r = await fetch(
        `/api/leaderboard?limit=10&view=${encodeURIComponent(leaderboardView)}&version=${encodeURIComponent(GAME_VERSION)}`,
        { cache: 'no-store', headers: { accept: 'application/json' } }
      );
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      onlineRows = Array.isArray(j.scores) ? j.scores : [];
      globalBoard = true;
      setStatus('ONLINE • ' + viewLabel());
      renderLeaderboard();
      return true;
    } catch (e) {
      console.warn('Global leaderboard unavailable', e);
      globalBoard = false;
      setStatus('OFFLINE • LOCAL BACKUP');
      renderLeaderboard();
      return false;
    }
  };

  submitGlobalWeapon = async function (rec, w) {
    try {
      setStatus('UPLOADING • PATCH BEST');
      const r = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          client_id: getClientId(),
          player_name: playerName(),
          weapon_name: rec.name,
          weapon_type: String(w.type || '').toUpperCase(),
          rarity: rec.rar,
          color: /^#[0-9A-Fa-f]{6}$/.test(rec.col || '') ? rec.col : '#ffffff',
          dps: rec.dps,
          run_seed: runSeed,
          zone: rec.zone,
          boss: rec.boss || '',
          level: pl.lv,
          kills,
          slaughter_score: Math.max(0, Math.floor(styleScore)),
          game_version: GAME_VERSION
        })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      const id = j.accepted_id || '';
      if (leaderboardView === 'current') {
        onlineRows = Array.isArray(j.scores) ? j.scores : onlineRows;
        globalBoard = true;
        setStatus(j.accepted ? 'ONLINE • PATCH BEST SAVED' : 'ONLINE • CURRENT PATCH');
        renderLeaderboard(id);
      } else await syncGlobalLeaderboard();
      if (j.accepted) {
        const rank = leaderboardView === 'current' ? onlineRows.findIndex(x => x.id === id) + 1 : 0;
        if (rank === 1) {
          txt(pl.x + 17, pl.y - 82, 'NEW PATCH DPS #1!', w.col, true);
          ring(pl.x + 17, pl.y + 10, w.col, 175, 7);
          shake = Math.max(shake, 11);
        } else if (rank > 0) txt(pl.x + 17, pl.y - 82, `PATCH DPS #${rank}!`, w.col, true);
      }
      return !!j.accepted;
    } catch (e) {
      console.warn('Global leaderboard submit failed', e);
      globalBoard = false;
      setStatus('OFFLINE • LOCAL BACKUP');
      renderLeaderboard();
      return false;
    }
  };

  recordWeapon = function (w, dps) {
    if (!w || w.rar === 'Training') return false;
    updateMuseum(w, dps);
    if (rarityIndex(w) >= 8 && Math.random() < 0.22)
      awardMeta(1, 'A sufficiently irresponsible weapon was documented.');
    const rec = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      player: playerName(),
      name: w.name,
      rar: w.rar,
      type: WM[w.type]?.label || w.type,
      col: w.col,
      dps: Math.round(dps),
      seed: runSeed,
      zone: Z[zoneI]?.name || 'Unknown',
      boss: bossMode || '',
      level: pl.lv,
      kills,
      when: new Date().toISOString(),
      version: GAME_VERSION
    };
    const local = [...leaderboard, rec].sort((a, b) => b.dps - a.dps).slice(0, 10);
    const placed = local.some(x => x.id === rec.id);
    leaderboard = local;
    saveLeaderboard();
    renderLeaderboard(placed ? rec.id : '');
    if (placed && leaderboard[0].id === rec.id) {
      txt(pl.x + 17, pl.y - 82, 'NEW PERSONAL DPS BEST!', w.col, true);
      ring(pl.x + 17, pl.y + 10, w.col, 150, 6);
      shake = Math.max(shake, 8);
      submitGlobalWeapon(rec, w);
    }
    return placed;
  };

  document.querySelectorAll('.sitePill').forEach(el => {
    if (/LOCAL HALL OF FAME/i.test(el.textContent)) el.textContent = 'GLOBAL HALL OF FAME';
    if (/v0\.9\.8/i.test(el.textContent)) el.textContent = 'v1.1 • EGO FRENZY';
  });
  document.querySelectorAll('.titleBest').forEach(el => {
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && /LOCAL DPS CHAMPION/i.test(node.nodeValue || ''))
        node.nodeValue = 'GLOBAL DPS CHAMPION';
    }
  });
  document.querySelectorAll('.titleControls strong').forEach(el => {
    if (/OFFLINE BUILD/i.test(el.textContent))
      el.textContent = 'ONLINE BUILD — GLOBAL DPS LEADERBOARD ACTIVE';
  });
  const heading = document.querySelector('#leaderboardCard h3');
  if (heading) heading.textContent = 'Global DPS Hall of Fame';
  installBoardTabs();
})();
