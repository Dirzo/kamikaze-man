import app from './index.js';

const BUILD = 'cwl-heavy-live-20260915u';

function withHeaders(headers = new Headers()) {
  const h = new Headers(headers);
  h.set('x-cwl-build', BUILD);
  h.set('cache-control', 'no-store, no-cache, must-revalidate, max-age=0');
  h.set('pragma', 'no-cache');
  h.set('expires', '0');
  return h;
}

function buildInfo() {
  return new Response(JSON.stringify({
    ok: true,
    service: 'crazyweaponman',
    build: BUILD,
    game_version: 'v1.4-cwl-heavy',
    target: 'desktop-only',
    ui: 'unified-desktop-shell',
    sprites: 'procedural-lady-v2-enemies',
    parking: 'concept-playable'
  }), {
    headers: withHeaders(new Headers({ 'content-type': 'application/json; charset=utf-8' }))
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/__cwl_build') return buildInfo();

    const response = await app.fetch(request, env, ctx);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: withHeaders(response.headers)
    });
  }
};
