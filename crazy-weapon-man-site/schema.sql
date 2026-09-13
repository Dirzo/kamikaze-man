CREATE TABLE IF NOT EXISTS leaderboard (
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
);

CREATE INDEX IF NOT EXISTS leaderboard_dps_idx
ON leaderboard (dps DESC, updated_at ASC);
