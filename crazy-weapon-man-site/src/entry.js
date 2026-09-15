import app from './index.js';

const BUILD = 'cwl-heavy-live-20260915j';

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
    game_version: 'v1.4-cwl-heavy'
  }), {
    headers: withHeaders(new Headers({ 'content-type': 'application/json; charset=utf-8' }))
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/__cwl_build') return buildInfo();

    const response = await app.fetch(request, env, ctx);
    const type = response.headers.get('content-type') || '';

    if (type.includes('text/html')) {
      let html = await response.text();
      const marker = `<div id="cwlDeployMarker" style="position:fixed;right:8px;bottom:8px;z-index:2147483647;padding:5px 8px;border:1px solid rgba(115,239,255,.45);border-radius:8px;background:rgba(4,10,17,.88);color:#73efff;font:800 9px/1.2 ui-monospace,monospace;letter-spacing:.04em;pointer-events:none">CWL HEAVY LIVE · ${BUILD}</div>`;
      html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, marker + '</body>') : html + marker;
      return new Response(html, {
        status: response.status,
        statusText: response.statusText,
        headers: withHeaders(response.headers)
      });
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: withHeaders(response.headers)
    });
  }
};
