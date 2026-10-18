// Draft — not deployed. Cloudflare Worker that delivers the installer for a one-time ticket.
//
// GET /d/<ticket>
//   1. Redeems the ticket at the site API (POST /api/download-redeem, shared secret). The site checks it
//      atomically in the database: unknown, expired or already-used tickets get 410.
//   2. Fetches the file from the short-lived GitHub storage URL returned by the site and streams it
//      to the browser. That URL is never sent to the browser, so there is nothing reusable to share.
//
// Bindings (wrangler.toml / secrets):
//   SITE_ORIGIN    e.g. https://31ns.kr                       (var)
//   REDEEM_SECRET  same value as DOWNLOAD_WORKER_SECRET on Vercel (secret)
//   SITE_BYPASS    optional Vercel protection-bypass token, only while the site is a protected preview (secret)

const TICKET = /^\/d\/([0-9a-f-]{36})$/i;

function page(status, title, message, siteOrigin) {
  const back = siteOrigin ? `<p><a href="${siteOrigin}/pcb-viewer/#download">다운로드 페이지로 돌아가기</a></p>` : '';
  const body = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${title}</title>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 20px;color:#1d1d1f">
<h1 style="font-size:22px">${title}</h1><p style="color:#55555f;line-height:1.7">${message}</p>${back}</body>`;
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }
  });
}

function safeFileName(name) {
  return String(name || 'PCB3D_Builder_Setup.exe').replace(/[^A-Za-z0-9._-]/g, '_');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = TICKET.exec(url.pathname);
    if (request.method !== 'GET' || !match) return new Response('Not found', { status: 404 });

    const headers = { Authorization: `Bearer ${env.REDEEM_SECRET}`, 'Content-Type': 'application/json' };
    if (env.SITE_BYPASS) headers['x-vercel-protection-bypass'] = env.SITE_BYPASS;

    let redeem;
    try {
      redeem = await fetch(`${env.SITE_ORIGIN}/api/download-redeem`, {
        method: 'POST', headers, body: JSON.stringify({ grant: match[1] })
      });
    } catch {
      return page(502, '다운로드를 준비하지 못했습니다', '잠시 후 홈페이지에서 다시 로그인해 받아 주세요.', env.SITE_ORIGIN);
    }
    if (redeem.status === 410) {
      return page(410, '이미 사용했거나 만료된 다운로드 링크입니다',
        '다운로드 링크는 한 번만, 요청 후 2분 안에만 쓸 수 있습니다. 홈페이지에서 다시 로그인해 받아 주세요.', env.SITE_ORIGIN);
    }
    if (!redeem.ok) {
      return page(502, '다운로드를 준비하지 못했습니다', '잠시 후 홈페이지에서 다시 로그인해 받아 주세요.', env.SITE_ORIGIN);
    }
    const { sourceUrl, fileName } = await redeem.json();

    // Server-to-server fetch of the short-lived storage URL; Range is not forwarded (no resume).
    const upstream = await fetch(sourceUrl, { redirect: 'follow' });
    if (!upstream.ok || !upstream.body) {
      return page(502, '파일을 받지 못했습니다', '홈페이지에서 다시 로그인해 받아 주세요.', env.SITE_ORIGIN);
    }
    const out = new Headers({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeFileName(fileName)}"`,
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex',
      'X-Content-Type-Options': 'nosniff'
    });
    const length = upstream.headers.get('Content-Length');
    if (length) out.set('Content-Length', length);
    // Body is piped through without buffering, so large files do not hit Worker memory limits.
    return new Response(upstream.body, { status: 200, headers: out });
  }
};
