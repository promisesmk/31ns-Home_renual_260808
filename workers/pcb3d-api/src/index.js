// PCB 3D Builder download server (Cloudflare Worker + D1). Overview: docs/PCB3D-DOWNLOAD.md
//
// Visitor
//   GET  /api/release        latest release info from the private GitHub repo (no file URLs)
//   POST /api/request        leave a question / use case → one-time download code (shown once)
//   POST /api/code-check     tells whether a code can still be used (does not consume it)
//   POST /download           form post with the code → consumes it and streams the installer
//   GET  /manual             user manual PDF (no code needed)
//   GET  /api/qna            approved, publish-consented posts for the static Q&A pages
// Operator
//   GET/POST /admin/r/:id?t= review one post (signed link from the notification mail; no password)
//   GET  /admin              list of posts (HTTP Basic, password = ADMIN_SECRET)
// Cron: personal data (email, company) is cleared after RETENTION_DAYS; old codes are deleted.

const CATEGORIES = ['question', 'usecase', 'feature'];
const CATEGORY_KO = { question: '질문', usecase: '활용 사례', feature: '기능 요청' };
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const LIMIT_PER_EMAIL = 3;
const LIMIT_PER_IP = 5;
const DAY = 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

// ---------- small helpers ----------

const now = () => Date.now();

function randomString(length, alphabet) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}

function newCode() {
  const raw = randomString(8, CODE_ALPHABET);
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

function normalizeCode(value) {
  const raw = String(value || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : null;
}

async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(secret, text) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function clean(value, max) {
  return String(value ?? '').replace(/\r\n/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim());
  if (!origin || !allowed.includes(origin)) return {};
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST',
    'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
}

function page(status, title, bodyHtml, { lang = 'ko' } = {}) {
  const html = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${esc(title)}</title>
<style>body{font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif;max-width:720px;margin:8vh auto;padding:0 20px;color:#1d1d1f;line-height:1.7}
h1{font-size:22px}p,li{color:#3a3a42}.box{border:1px solid #ddd;border-radius:10px;padding:16px 18px;margin:16px 0;white-space:pre-wrap;word-break:break-word}
label{display:block;font-weight:600;margin:14px 0 6px}input[type=text],textarea{width:100%;box-sizing:border-box;font:inherit;padding:10px;border:1px solid #ccc;border-radius:8px}
textarea{min-height:140px}button{font:inherit;padding:10px 18px;border-radius:8px;border:1px solid #1d1d1f;background:#1d1d1f;color:#fff;cursor:pointer;margin:6px 6px 0 0}
button.secondary{background:#fff;color:#1d1d1f}.muted{color:#777;font-size:14px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #eee;padding:8px 6px;text-align:left;vertical-align:top}
.tag{display:inline-block;font-size:12px;padding:2px 8px;border-radius:99px;background:#eee}.ok{background:#d9f2e3}.no{background:#f6dcdc}a{color:#0b5cad}</style>
<h1>${esc(title)}</h1>${bodyHtml}</html>`;
  return new Response(html, {
    status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }
  });
}

function backLink(env, lang) {
  const path = lang === 'en' ? '/en/pcb-viewer/#download' : '/pcb-viewer/#download';
  const text = lang === 'en' ? 'Back to the download page' : '다운로드 페이지로 돌아가기';
  return `<p><a href="${esc(env.SITE_ORIGIN)}${path}">${text}</a></p>`;
}

// ---------- GitHub release (private repo, token stays on the server) ----------

const FAKE_RELEASE = {
  tag: 'v0.0-dev', name: 'PCB 3D Builder (로컬 시험)', publishedAt: '2026-01-01T00:00:00Z',
  installer: { name: 'PCB3D_Builder_Setup_DEV.txt', size: 64, apiUrl: 'fake:installer' },
  manual: { name: 'PCB3D_Builder_Manual_DEV.txt', size: 48, apiUrl: 'fake:manual' }
};

function githubHeaders(env, accept) {
  return { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'pcb3d-api (31ns.kr)' };
}

async function latestRelease(env) {
  if (!env.GITHUB_TOKEN) return env.DEV_FAKE_RELEASE === '1' ? FAKE_RELEASE : null;
  const cache = caches.default;
  const cacheKey = new Request(`https://pcb3d-api.internal/release/${env.RELEASE_REPO}`);
  const hit = await cache.match(cacheKey);
  if (hit) return hit.json();

  const res = await fetch(`https://api.github.com/repos/${env.RELEASE_REPO}/releases/latest`,
    { headers: githubHeaders(env, 'application/vnd.github+json') });
  if (!res.ok) return null;
  const rel = await res.json();
  const pick = (re) => {
    const a = (rel.assets || []).find((x) => re.test(x.name));
    return a ? { name: a.name, size: a.size, apiUrl: a.url } : null;
  };
  const release = { tag: rel.tag_name, name: rel.name || rel.tag_name, publishedAt: rel.published_at,
    installer: pick(/\.exe$/i), manual: pick(/\.pdf$/i) };
  if (!release.installer) return null;
  await cache.put(cacheKey, new Response(JSON.stringify(release), { headers: { 'Cache-Control': 'max-age=600' } }));
  return release;
}

// Returns a streaming Response body source for one release asset, or null if it cannot be fetched.
async function openAsset(env, asset) {
  if (asset.apiUrl.startsWith('fake:')) {
    const text = asset.apiUrl === 'fake:installer'
      ? 'This is a local test file, not the real PCB 3D Builder installer.\n'
      : 'Local test manual placeholder.\n';
    return new Response(text);
  }
  // GitHub answers with a redirect to a short-lived storage URL. Follow it here so neither the
  // token nor the reusable URL ever reaches the browser.
  const first = await fetch(asset.apiUrl, { headers: githubHeaders(env, 'application/octet-stream'), redirect: 'manual' });
  let res = first;
  if (first.status >= 300 && first.status < 400) {
    const location = first.headers.get('Location');
    if (!location) return null;
    res = await fetch(location);
  }
  return res.ok && res.body ? res : null;
}

function fileResponse(upstream, fileName, size) {
  const headers = new Headers({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${String(fileName).replace(/[^A-Za-z0-9._-]/g, '_')}"`,
    'Cache-Control': 'no-store, private', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff'
  });
  const length = upstream.headers.get('Content-Length') || (size ? String(size) : null);
  if (length) headers.set('Content-Length', length);
  // Piped through without buffering, so a ~180MB installer does not hit Worker memory limits.
  return new Response(upstream.body, { status: 200, headers });
}

// ---------- spam check, mail ----------

async function turnstileOk(env, token, ip) {
  if (!env.TURNSTILE_SECRET || !token) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

async function sendMail(env, { to, subject, html }) {
  if (!env.RESEND_API_KEY) {
    console.log(`[mail skipped: RESEND_API_KEY not set] to=${to} subject=${subject}`);
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, html })
  });
  if (!res.ok) console.log(`[mail failed] ${res.status} ${await res.text()}`);
  return res.ok;
}

async function reviewUrl(env, origin, id, action) {
  const t = await hmac(env.ADMIN_SECRET, `review:${id}`);
  return `${origin}/admin/r/${id}?t=${t}${action ? `&a=${action}` : ''}`;
}

async function notifyAdmin(env, origin, row) {
  const [approve, reject, answer] = await Promise.all(['approve', 'reject', null].map((a) => reviewUrl(env, origin, row.id, a)));
  const button = (href, text, bg) =>
    `<a href="${href}" style="display:inline-block;padding:10px 18px;margin:4px 6px 4px 0;border-radius:8px;background:${bg};color:#fff;text-decoration:none">${text}</a>`;
  const buttons = row.publish_ok
    ? button(approve, '승인 (Q&amp;A 공개)', '#1f7a45') + button(reject, '거절', '#a33') + button(answer, '답변 쓰기', '#1d1d1f')
    : button(answer, '확인 · 메모', '#1d1d1f') + '<p style="color:#777;font-size:13px">작성자가 공개에 동의하지 않아 Q&amp;A에는 올릴 수 없습니다.</p>';
  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.7;color:#1d1d1f;max-width:640px">
<p style="color:#777;margin:0">PCB 3D Builder 다운로드 신청 · ${CATEGORY_KO[row.category]}</p>
<h2 style="margin:6px 0 12px">${esc(row.title)}</h2>
<div style="white-space:pre-wrap;border:1px solid #ddd;border-radius:10px;padding:14px">${esc(row.body)}</div>
<p>작성자: ${esc(row.company)} · ${esc(row.email)}<br>공개 동의: ${row.publish_ok ? '예' : '아니요'} · 언어: ${row.lang}</p>
${buttons}
<p style="color:#777;font-size:13px">버튼을 누르면 확인 화면이 열리고, 그 화면의 [확인]을 눌러야 처리됩니다. 처리하지 않은 글은 공개되지 않습니다.</p></div>`;
  await sendMail(env, { to: env.ADMIN_EMAIL, subject: `[PCB 3D Builder] 새 글: ${row.title}`, html });
}

// ---------- visitor endpoints ----------

async function handleRelease(env) {
  const release = await latestRelease(env);
  if (!release) return json({ available: false });
  return json({
    available: true, tag: release.tag, name: release.name, publishedAt: release.publishedAt,
    installer: { name: release.installer.name, size: release.installer.size },
    manual: release.manual ? { name: release.manual.name, size: release.manual.size } : null
  });
}

async function handleRequest(request, env, cors, ctx) {
  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400, cors);
  }
  const lang = input.lang === 'en' ? 'en' : 'ko';
  const email = clean(input.email, 254).toLowerCase();
  const company = clean(input.company, 100);
  const category = CATEGORIES.includes(input.category) ? input.category : null;
  const title = clean(input.title, 100);
  const body = clean(input.body, 3000);

  if (!EMAIL_RE.test(email)) return json({ error: 'invalid_email' }, 400, cors);
  if (!company) return json({ error: 'invalid_company' }, 400, cors);
  if (!category) return json({ error: 'invalid_category' }, 400, cors);
  if (title.length < 4) return json({ error: 'title_too_short' }, 400, cors);
  if (body.replace(/\s/g, '').length < 30) return json({ error: 'body_too_short' }, 400, cors);
  if (input.consentPrivacy !== true) return json({ error: 'consent_required' }, 400, cors);
  // Honeypot field: hidden from people, filled in by simple bots.
  if (clean(input.website, 200)) return json({ error: 'spam_suspected' }, 400, cors);

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!(await turnstileOk(env, input.turnstileToken, ip))) return json({ error: 'captcha_failed' }, 400, cors);

  const release = await latestRelease(env);
  if (!release) return json({ error: 'not_available' }, 503, cors);

  const t = now();
  const ipHash = (await sha256(`${ip}|${env.ADMIN_SECRET}`)).slice(0, 32);
  const counts = await env.DB.prepare(
    'select (select count(*) from requests where email = ?1 and created_at > ?3) as by_email, ' +
    '(select count(*) from requests where ip_hash = ?2 and created_at > ?3) as by_ip'
  ).bind(email, ipHash, t - DAY).first();
  if (counts.by_email >= LIMIT_PER_EMAIL || counts.by_ip >= Number(env.LIMIT_PER_IP || LIMIT_PER_IP)) return json({ error: 'rate_limited' }, 429, cors);

  const id = randomString(10, 'abcdefghijkmnpqrstuvwxyz23456789');
  const code = newCode();
  const expiresAt = t + Number(env.CODE_TTL_HOURS || 24) * 60 * 60 * 1000;
  const row = { id, lang, email, company, category, title, body, publish_ok: input.consentPublish === true ? 1 : 0 };
  await env.DB.batch([
    env.DB.prepare('insert into requests (id, created_at, lang, email, company, category, title, body, publish_ok, ip_hash) values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)')
      .bind(id, t, lang, email, company, category, title, body, row.publish_ok, ipHash),
    env.DB.prepare('insert into codes (code_hash, request_id, created_at, expires_at) values (?1, ?2, ?3, ?4)')
      .bind(await sha256(code), id, t, expiresAt)
  ]);

  const origin = new URL(request.url).origin;
  if (env.ADMIN_SECRET) {
    const task = notifyAdmin(env, origin, row).catch((e) => console.log(`[notify failed] ${e}`));
    if (ctx) ctx.waitUntil(task); else await task;
  }
  return json({ code, expiresAt }, 200, cors);
}

async function codeState(env, code) {
  const row = await env.DB.prepare('select expires_at, used_at from codes where code_hash = ?1').bind(await sha256(code)).first();
  if (!row) return 'unknown';
  if (row.used_at) return 'used';
  if (row.expires_at <= now()) return 'expired';
  return 'valid';
}

async function handleCodeCheck(request, env, cors) {
  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400, cors);
  }
  const code = normalizeCode(input.code);
  if (!code) return json({ state: 'unknown' }, 200, cors);
  return json({ state: await codeState(env, code) }, 200, cors);
}

async function handleDownload(request, env) {
  const form = await request.formData().catch(() => null);
  const lang = form?.get('lang') === 'en' ? 'en' : 'ko';
  const code = normalizeCode(form?.get('code'));
  const L = lang === 'en'
    ? { badTitle: 'This code cannot be used', bad: 'The code is wrong, already used or expired. Leave a new request on the download page to get a new code.',
        failTitle: 'The file could not be prepared', fail: 'Your code has not been used. Please try again in a moment.' }
    : { badTitle: '사용할 수 없는 코드입니다', bad: '코드가 틀렸거나, 이미 사용했거나, 유효 시간이 지났습니다. 다운로드 페이지에서 다시 신청하면 새 코드를 받을 수 있습니다.',
        failTitle: '파일을 준비하지 못했습니다', fail: '코드는 사용되지 않았습니다. 잠시 후 같은 코드로 다시 시도해 주세요.' };
  if (!code) return page(400, L.badTitle, `<p>${L.bad}</p>${backLink(env, lang)}`, { lang });

  const hash = await sha256(code);
  const t = now();
  // Atomic: only one request can flip used_at from null, even if the form is posted twice at once.
  const claimed = await env.DB.prepare(
    'update codes set used_at = ?2 where code_hash = ?1 and used_at is null and expires_at > ?2 returning request_id'
  ).bind(hash, t).first();
  if (!claimed) return page(410, L.badTitle, `<p>${L.bad}</p>${backLink(env, lang)}`, { lang });

  const release = await latestRelease(env);
  const upstream = release ? await openAsset(env, release.installer).catch(() => null) : null;
  if (!upstream) {
    // Nothing was sent: give the code back so the visitor can retry.
    await env.DB.prepare('update codes set used_at = null where code_hash = ?1 and used_at = ?2').bind(hash, t).run();
    return page(502, L.failTitle, `<p>${L.fail}</p>${backLink(env, lang)}`, { lang });
  }
  return fileResponse(upstream, release.installer.name, release.installer.size);
}

async function handleManual(env) {
  const release = await latestRelease(env);
  if (!release?.manual) return page(404, '설명서를 찾을 수 없습니다', '<p>잠시 후 다시 시도해 주세요.</p>');
  const upstream = await openAsset(env, release.manual).catch(() => null);
  if (!upstream) return page(502, '설명서를 준비하지 못했습니다', '<p>잠시 후 다시 시도해 주세요.</p>');
  const res = fileResponse(upstream, release.manual.name, release.manual.size);
  if (release.manual.name.toLowerCase().endsWith('.pdf')) {
    // Open the PDF in the browser instead of forcing a download.
    res.headers.set('Content-Type', 'application/pdf');
    res.headers.set('Content-Disposition', `inline; filename="${release.manual.name.replace(/[^A-Za-z0-9._-]/g, '_')}"`);
  }
  return res;
}

async function handleQna(env, cors) {
  const { results } = await env.DB.prepare(
    "select id, created_at, reviewed_at, lang, category, title, body, answer, author_label from requests " +
    "where status = 'approved' and publish_ok = 1 order by reviewed_at desc limit 500"
  ).all();
  return json({ items: results }, 200, { ...cors, 'Cache-Control': 'public, max-age=60' });
}

// ---------- operator endpoints ----------

async function handleReview(request, env, id) {
  const url = new URL(request.url);
  const t = url.searchParams.get('t') || '';
  if (!env.ADMIN_SECRET || !safeEqual(t, await hmac(env.ADMIN_SECRET, `review:${id}`))) {
    return page(403, '권한이 없습니다', '<p>메일의 링크로 다시 열어 주세요.</p>');
  }
  const row = await env.DB.prepare('select * from requests where id = ?1').bind(id).first();
  if (!row) return page(404, '글을 찾을 수 없습니다', '<p>삭제되었거나 보유 기간이 지난 글입니다.</p>');

  let notice = '';
  if (request.method === 'POST') {
    const form = await request.formData();
    const action = form.get('action');
    const fields = {
      title: clean(form.get('title'), 100) || row.title,
      body: clean(form.get('body'), 3000) || row.body,
      answer: clean(form.get('answer'), 5000) || null,
      author_label: clean(form.get('author_label'), 60) || null
    };
    let status = row.status;
    if (action === 'approve' && row.publish_ok) status = 'approved';
    if (action === 'reject') status = 'rejected';
    await env.DB.prepare('update requests set title = ?2, body = ?3, answer = ?4, author_label = ?5, status = ?6, reviewed_at = ?7 where id = ?1')
      .bind(id, fields.title, fields.body, fields.answer, fields.author_label, status, now()).run();
    Object.assign(row, fields, { status });
    notice = status === 'approved'
      ? '<p class="box">저장했습니다. <b>승인됨</b> — 다음 홈페이지 배포(Run workflow) 때 Q&amp;A에 공개됩니다.</p>'
      : `<p class="box">저장했습니다. 상태: <b>${status === 'rejected' ? '거절(비공개)' : '대기'}</b></p>`;
  }

  const preset = url.searchParams.get('a');
  const statusTag = { pending: '<span class="tag">대기</span>', approved: '<span class="tag ok">승인 · 공개</span>', rejected: '<span class="tag no">거절</span>' }[row.status];
  const confirm = request.method === 'GET' && preset === 'approve' && row.publish_ok
    ? '<p class="box">이 글을 <b>승인</b>하려면 아래 [승인 · 공개]를 눌러 주세요. 필요하면 답변을 먼저 적을 수 있습니다.</p>'
    : request.method === 'GET' && preset === 'reject'
      ? '<p class="box">이 글을 <b>거절</b>하려면 아래 [거절]을 눌러 주세요.</p>' : '';
  const html = `${notice}${confirm}
<p class="muted">${CATEGORY_KO[row.category]} · ${new Date(row.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} · ${statusTag}<br>
작성자: ${esc(row.company ?? '(보유 기간 지나 삭제됨)')} · ${esc(row.email ?? '-')} · 공개 동의: ${row.publish_ok ? '예' : '아니요'}</p>
<form method="post">
<label>제목 (공개 시 그대로 보임 · 개인정보가 있으면 고쳐 주세요)</label><input type="text" name="title" value="${esc(row.title)}" maxlength="100">
<label>본문</label><textarea name="body" maxlength="3000">${esc(row.body)}</textarea>
<label>답변 (공개 시 함께 보임)</label><textarea name="answer" maxlength="5000" placeholder="답변이 있으면 Q&amp;A의 가치가 크게 올라갑니다.">${esc(row.answer ?? '')}</textarea>
<label>작성자 표시 (공개용 · 비우면 "PCB 3D Builder 사용자")</label><input type="text" name="author_label" value="${esc(row.author_label ?? '')}" maxlength="60" placeholder="예: 전자부품 업체 하드웨어 엔지니어">
<p>${row.publish_ok ? '<button name="action" value="approve">승인 · 공개</button>' : ''}<button name="action" value="reject" class="secondary">거절</button><button name="action" value="save" class="secondary">저장만</button></p>
</form>`;
  return page(200, row.title, html);
}

function basicAuthOk(request, env) {
  const header = request.headers.get('Authorization') || '';
  if (!env.ADMIN_SECRET || !header.startsWith('Basic ')) return false;
  let decoded = '';
  try { decoded = atob(header.slice(6)); } catch { return false; }
  return safeEqual(decoded.slice(decoded.indexOf(':') + 1), env.ADMIN_SECRET);
}

async function handleAdminList(request, env) {
  if (!basicAuthOk(request, env)) {
    return new Response('관리자 비밀번호가 필요합니다.', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="pcb3d-admin", charset="UTF-8"', 'X-Robots-Tag': 'noindex' } });
  }
  const { results } = await env.DB.prepare(
    'select r.id, r.created_at, r.category, r.title, r.company, r.email, r.status, r.publish_ok, ' +
    '(select max(used_at) from codes c where c.request_id = r.id) as downloaded_at from requests r order by r.created_at desc limit 300'
  ).all();
  const origin = new URL(request.url).origin;
  const rows = await Promise.all(results.map(async (r) => `<tr>
<td>${new Date(r.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</td><td>${CATEGORY_KO[r.category]}</td>
<td><a href="${await reviewUrl(env, origin, r.id)}">${esc(r.title)}</a></td><td>${esc(r.company ?? '-')}<br><span class="muted">${esc(r.email ?? '-')}</span></td>
<td>${{ pending: '대기', approved: '승인', rejected: '거절' }[r.status]}${r.publish_ok ? '' : ' (비공개 희망)'}</td><td>${r.downloaded_at ? '받음' : '-'}</td></tr>`));
  return page(200, 'PCB 3D Builder 신청 목록',
    `<p class="muted">최근 300건 · 다운로드 = 코드 사용 여부</p><table><tr><th>시각</th><th>분류</th><th>제목</th><th>작성자</th><th>상태</th><th>다운로드</th></tr>${rows.join('')}</table>`);
}

// ---------- scheduled cleanup ----------

async function cleanup(env) {
  const t = now();
  const cutoff = t - Number(env.RETENTION_DAYS || 365) * DAY;
  await env.DB.batch([
    env.DB.prepare('update requests set email = null, company = null, ip_hash = null where created_at < ?1 and (email is not null or company is not null)').bind(cutoff),
    env.DB.prepare('delete from codes where expires_at < ?1').bind(t - 7 * DAY)
  ]);
}

// ---------- router ----------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cors = corsHeaders(request, env);
    try {
      if (request.method === 'OPTIONS' && path.startsWith('/api/')) return new Response(null, { status: 204, headers: cors });
      if (path === '/api/release' && request.method === 'GET') {
        const res = await handleRelease(env);
        for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
        return res;
      }
      if (path === '/api/request' && request.method === 'POST') return await handleRequest(request, env, cors, ctx);
      if (path === '/api/code-check' && request.method === 'POST') return await handleCodeCheck(request, env, cors);
      if (path === '/api/qna' && request.method === 'GET') return await handleQna(env, cors);
      if (path === '/download' && request.method === 'POST') return await handleDownload(request, env);
      if (path === '/manual' && request.method === 'GET') return await handleManual(env);
      const review = /^\/admin\/r\/([a-z0-9]{10})$/.exec(path);
      if (review && (request.method === 'GET' || request.method === 'POST')) return await handleReview(request, env, review[1]);
      if (path === '/admin' && request.method === 'GET') return await handleAdminList(request, env);
      if (path === '/robots.txt') return new Response('User-agent: *\nDisallow: /\n');
      return new Response('Not found', { status: 404 });
    } catch (e) {
      console.log(`[error] ${path}: ${e?.stack || e}`);
      return path.startsWith('/api/') ? json({ error: 'server_error' }, 500, cors) : page(500, '일시적인 오류', '<p>잠시 후 다시 시도해 주세요.</p>');
    }
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(cleanup(env));
  }
};
