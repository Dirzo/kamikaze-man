# Crazy Weapon Man — Cloudflare Workers deployment

This directory is the deployable Crazy Weapon Man web project.

## Cloudflare Workers Builds settings

Connect the GitHub repository `Dirzo/kamikaze-man` and use:

- Project name: `crazy-weapon-man`
- Production branch: `crazy-weapon-man-web`
- Root directory: `crazy-weapon-man-site`
- Build command: leave blank
- Deploy command: `npx wrangler deploy`
- Cloudflare Access: off for the public game
- Non-production branch builds: optional

The repository default branch is currently `crazy-weapon-man-web`, so Cloudflare should select it automatically as the production branch. It can be verified after project creation under Settings → Build → Branch control.

## What gets deployed

- `public/` — static Crazy Weapon Man game
- `src/index.js` — Worker API and static-asset router
- `wrangler.jsonc` — Workers Static Assets + D1 configuration
- `/api/leaderboard` — GET global DPS leaderboard / POST personal-best score
- `/api/health` — deployment and D1 health check

## D1 leaderboard

`wrangler.jsonc` declares the `DB` D1 binding without an account-specific resource ID. Wrangler 4.45+ supports automatic resource provisioning; the first deployment should create and bind the database if it does not already exist.

The Worker creates the leaderboard table and DPS index with `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` on the first leaderboard or health request. `schema.sql` is retained as a manual/reference schema.

## Verify a deployment

Once Cloudflare provides the Worker URL:

1. Open `/` — the game should load.
2. Open `/api/health` — expected JSON includes `"ok": true` and `"leaderboard": "ready"`.
3. Open `/api/leaderboard?limit=10` — expected JSON contains `"scores": []` on a new database.

Future pushes to the production branch will trigger Workers Builds automatically.
