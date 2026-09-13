const RARITIES = new Set([
  'Common','Uncommon','Magic','Rare','Super Rare','Epic','Heroic','Legendary','Mythic',
  'Ultra Mythic','Exotic','Ultra Exotic','Relic','Ancient','Transcendent','Unheard Of',
  'Super Ultra Rare','Forbidden','Impossible','Cataclysmic','WHAT?!'
]);
const TYPES = new Set(['SWORD','DAGGER','NUNCHUCKS','KATANA','BOW','SHURIKEN','WAND','STAFF','HAMMER']);

let schemaReady = null;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extraHeaders
    }
  });
}
function cleanText(value, max) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}
function integer(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.round(n);
  return i >= min && i <= max ? i : null;
}
async function ensureSchema(DB) {
  if (!DB) throw new Error('D1 binding DB is unavailable');
  if (!schemaReady) {
    schemaReady = (async () => {
      await DB.prepare(`CREATE TABLE IF NOT EXISTS leaderboard (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL UNIQUE,
        player_name TEXT NOT NULL,
        weapon_name TEXT NOT NULL,
        weapon_type TEXT NOT NULL,
        rarity TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#ffffff',
        dps INTEGER NOT NULL CHECK (dps > 0),
        run_seed TEXT NOT NULL,
        zone TEXT NOT NULL,
        boss TEXT NOT NULL DEFAULT '',
        level INTEGER NOT NULL DEFAULT 1,
        kills INTEGER NOT NULL DEFAULT 0,
        slaughter_score INTEGER NOT NULL DEFAULT 0,
        game_version TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`).run();
      await DB.prepare(`CREATE INDEX IF NOT EXISTS leaderboard_dps_idx
        ON leaderboard (dps DESC, updated_at ASC)`).run();
      return true;
    })().catch(error => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
function publicScore(row) {
  return {
    id: row.id,
    player: row.player_name,
    name: row.weapon_name,
    rar: row.rarity,
    type: row.weapon_type,
    col: row.color,
    dps: row.dps,
    seed: row.run_seed,
    zone: row.zone,
    boss: row.boss || '',
    level: row.level,
    kills: row.kills,
    slaughter: row.slaughter_score,
    version: row.game_version,
    when: row.updated_at
  };
}
async function topScores(DB, limit = 10) {
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 10));
  const { results = [] } = await DB.prepare(`
    SELECT id, player_name, weapon_name, weapon_type, rarity, color, dps,
           run_seed, zone, boss, level, kills, slaughter_score, game_version, updated_at
    FROM leaderboard
    ORDER BY dps DESC, updated_at ASC
    LIMIT ?
  `).bind(safeLimit).all();
  return results.map(publicScore);
}
async function leaderboardGet(request, env) {
  await ensureSchema(env.DB);
  const url = new URL(request.url);
  const limit = integer(url.searchParams.get('limit') || 10, 1, 50) || 10;
  return json({ scores: await topScores(env.DB, limit), live: true });
}
async function leaderboardPost(request, env) {
  await ensureSchema(env.DB);
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Expected JSON body.' }, 400); }

  const clientId = cleanText(body.client_id, 80);
  const playerName = cleanText(body.player_name, 20) || 'Anonymous Lunatic';
  const weaponName = cleanText(body.weapon_name, 180);
  const weaponType = cleanText(body.weapon_type, 20).toUpperCase();
  const rarity = cleanText(body.rarity, 32);
  const color = cleanText(body.color, 9);
  const dps = integer(body.dps, 1, 2_000_000_000);
  const runSeed = cleanText(body.run_seed, 32);
  const zone = cleanText(body.zone, 90) || 'Unknown';
  const boss = cleanText(body.boss, 32);
  const level = integer(body.level, 1, 999) ?? 1;
  const kills = integer(body.kills, 0, 10_000_000) ?? 0;
  const slaughterScore = integer(body.slaughter_score, 0, 2_000_000_000) ?? 0;
  const gameVersion = cleanText(body.game_version, 32) || 'unknown';

  const problems = [];
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(clientId)) problems.push('invalid client_id');
  if (!weaponName) problems.push('missing weapon_name');
  if (!TYPES.has(weaponType)) problems.push('invalid weapon_type');
  if (!RARITIES.has(rarity)) problems.push('invalid rarity');
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) problems.push('invalid color');
  if (dps === null) problems.push('invalid dps');
  if (!/^[A-Za-z0-9_-]{4,32}$/.test(runSeed)) problems.push('invalid run_seed');
  if (problems.length) return json({ error: 'Score rejected.', problems }, 400);

  const existing = await env.DB.prepare('SELECT dps FROM leaderboard WHERE client_id = ?').bind(clientId).first();
  const improved = !existing || dps > Number(existing.dps || 0);
  let acceptedId = null;

  if (improved) {
    acceptedId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO leaderboard (
        id, client_id, player_name, weapon_name, weapon_type, rarity, color, dps,
        run_seed, zone, boss, level, kills, slaughter_score, game_version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(client_id) DO UPDATE SET
        id = excluded.id,
        player_name = excluded.player_name,
        weapon_name = excluded.weapon_name,
        weapon_type = excluded.weapon_type,
        rarity = excluded.rarity,
        color = excluded.color,
        dps = excluded.dps,
        run_seed = excluded.run_seed,
        zone = excluded.zone,
        boss = excluded.boss,
        level = excluded.level,
        kills = excluded.kills,
        slaughter_score = excluded.slaughter_score,
        game_version = excluded.game_version,
        updated_at = datetime('now')
      WHERE excluded.dps > leaderboard.dps
    `).bind(
      acceptedId, clientId, playerName, weaponName, weaponType, rarity, color, dps,
      runSeed, zone, boss, level, kills, slaughterScore, gameVersion
    ).run();
  }

  return json({
    accepted: improved,
    accepted_id: improved ? acceptedId : null,
    scores: await topScores(env.DB, 10)
  }, improved ? 201 : 200);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/health' && request.method === 'GET') {
        await ensureSchema(env.DB);
        return json({ ok: true, service: 'crazy-weapon-man', leaderboard: 'ready' });
      }
      if (url.pathname === '/api/leaderboard') {
        if (request.method === 'GET') return leaderboardGet(request, env);
        if (request.method === 'POST') return leaderboardPost(request, env);
        return json({ error: 'Method not allowed.' }, 405, { allow: 'GET, POST' });
      }
      if (url.pathname.startsWith('/api/')) return json({ error: 'API route not found.' }, 404);
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error('Crazy Weapon Man worker error', error);
      return json({ error: 'Leaderboard temporarily unavailable.' }, 500);
    }
  }
};
