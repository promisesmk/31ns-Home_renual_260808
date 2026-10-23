// PCB 3D Builder 다운로드 서버 시험. 로컬 Worker(가짜 설치 파일)를 상대로 실제 HTTP 요청을 보냅니다.
// 준비: npm run worker (다른 터미널, .dev.vars 필요) → npm test
// 로컬 서버는 RESEND_API_KEY가 없으므로 메일 대신 응답의 devCode로 코드를 받습니다(운영 서버에는 없음).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

const BASE = process.env.WORKER_URL || 'http://127.0.0.1:8787';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'local-dev-admin-secret-change-me';
const ORIGIN = 'http://localhost:8000';
const TURNSTILE_TEST_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

const unique = () => `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

function validRequest(overrides = {}) {
  return {
    lang: 'ko', email: `tester-${unique()}@example.com`, company: '시험전자', category: 'question',
    title: 'PADS ASC 변환 질문', body: 'PADS ASC 파일로 STEP을 만들 때 부품 높이가 어떻게 정해지는지 궁금합니다.',
    consentPrivacy: true, consentPublish: true, turnstileToken: TURNSTILE_TEST_TOKEN, ...overrides
  };
}

async function post(path, body, headers = {}) {
  const res = await fetch(BASE + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...headers }, body: JSON.stringify(body)
  });
  return { res, data: await res.json() };
}

function download(code) {
  return fetch(`${BASE}/download`, { method: 'POST', body: new URLSearchParams({ code, lang: 'ko' }) });
}

function reviewToken(id) {
  return createHmac('sha256', ADMIN_SECRET).update(`review:${id}`).digest('base64url');
}

async function newRequest(overrides) {
  const { res, data } = await post('/api/request', validRequest(overrides));
  assert.equal(res.status, 200, JSON.stringify(data));
  assert.match(data.devCode, /^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
  assert.equal('code' in data, false);
  return data;
}

async function newCode(overrides) {
  return (await newRequest(overrides)).devCode;
}

test('공개 릴리스 정보에 파일 주소가 없다', async () => {
  const res = await fetch(`${BASE}/api/release`, { headers: { Origin: ORIGIN } });
  const data = await res.json();
  assert.equal(data.available, true);
  assert.ok(data.installer.name);
  assert.equal(JSON.stringify(data).includes('apiUrl'), false);
  assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
});

test('허용하지 않은 사이트에는 CORS 허용 헤더를 주지 않는다', async () => {
  const res = await fetch(`${BASE}/api/release`, { headers: { Origin: 'https://evil.example' } });
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});

test('입력 검사: 이메일 · 본문 길이 · 개인정보 동의 · 스팸 칸', async () => {
  const cases = [
    [{ email: 'not-an-email' }, 'invalid_email'],
    [{ company: '  ' }, 'invalid_company'],
    [{ category: 'other' }, 'invalid_category'],
    [{ title: '짧' }, 'title_too_short'],
    [{ body: '너무 짧은 글' }, 'body_too_short'],
    [{ consentPrivacy: false }, 'consent_required'],
    [{ website: 'http://spam.example' }, 'spam_suspected'],
    [{ turnstileToken: '' }, 'captcha_failed']
  ];
  for (const [override, error] of cases) {
    const { res, data } = await post('/api/request', validRequest(override));
    assert.equal(res.status, 400, error);
    assert.equal(data.error, error);
  }
});

test('코드는 한 번만 쓸 수 있다', async () => {
  const code = await newCode();
  assert.equal((await post('/api/code-check', { code })).data.state, 'valid');
  // 소문자 · 하이픈 없이 입력해도 같은 코드로 인식
  assert.equal((await post('/api/code-check', { code: code.toLowerCase().replace('-', '') })).data.state, 'valid');

  const first = await download(code);
  assert.equal(first.status, 200);
  assert.match(first.headers.get('content-disposition'), /^attachment; filename="/);
  assert.ok((await first.text()).includes('not the real PCB 3D Builder installer'));

  assert.equal((await post('/api/code-check', { code })).data.state, 'used');
  const second = await download(code);
  assert.equal(second.status, 410);
});

test('같은 코드로 동시에 받아도 한 번만 성공한다', async () => {
  const code = await newCode();
  const results = await Promise.all(Array.from({ length: 5 }, () => download(code)));
  const statuses = results.map((r) => r.status).sort();
  await Promise.all(results.map((r) => r.text()));
  assert.deepEqual(statuses, [200, 410, 410, 410, 410]);
});

test('없는 코드 · 형식이 틀린 코드는 거절한다', async () => {
  assert.equal((await post('/api/code-check', { code: 'ZZZZ-ZZZZ' })).data.state, 'unknown');
  assert.equal((await download('ZZZZ-ZZZZ')).status, 410);
  assert.equal((await download('abc')).status, 400);
});

test('같은 이메일은 하루 3번까지만 신청할 수 있다', async () => {
  const email = `limit-${unique()}@example.com`;
  for (let i = 0; i < 3; i++) await newCode({ email });
  const { res, data } = await post('/api/request', validRequest({ email }));
  assert.equal(res.status, 429);
  assert.equal(data.error, 'rate_limited');
});

async function latestRequestId(title) {
  // 관리 목록에서 제목으로 찾음 (HTTP Basic)
  const res = await fetch(`${BASE}/admin`, { headers: { Authorization: `Basic ${btoa(`admin:${ADMIN_SECRET}`)}` } });
  assert.equal(res.status, 200);
  const html = await res.text();
  const m = new RegExp(`/admin/r/([a-z0-9]{10})\\?t=[^"]+">${title}<`).exec(html);
  assert.ok(m, 'request not found in admin list');
  return m[1];
}

test('관리 화면은 비밀번호 없이 열리지 않는다', async () => {
  assert.equal((await fetch(`${BASE}/admin`)).status, 401);
  assert.equal((await fetch(`${BASE}/admin`, { headers: { Authorization: `Basic ${btoa('admin:wrong')}` } })).status, 401);
});

test('승인한 글만 Q&A에 공개되고, 이메일 · 회사명은 공개되지 않는다', async () => {
  const title = `승인 시험 ${unique()}`;
  await newCode({ title });
  const id = await latestRequestId(title);

  assert.equal((await fetch(`${BASE}/admin/r/${id}?t=wrong`)).status, 403);
  // 메일의 [승인] 링크(GET)는 확인 화면만 보여 주고 처리하지 않음 (메일 보안 검사기가 링크를 열어도 안전)
  const confirm = await fetch(`${BASE}/admin/r/${id}?t=${reviewToken(id)}&a=approve`);
  assert.equal(confirm.status, 200);
  let qna = await (await fetch(`${BASE}/api/qna`)).json();
  assert.equal(qna.items.some((x) => x.id === id), false);

  const form = new URLSearchParams({ action: 'approve', title, body: '본문을 관리자가 다듬었습니다. 부품 높이는 어떻게 정해지나요? 실제 사례가 궁금합니다.', answer: '답변입니다.', author_label: '시험 엔지니어' });
  const done = await fetch(`${BASE}/admin/r/${id}?t=${reviewToken(id)}`, { method: 'POST', body: form });
  assert.equal(done.status, 200);
  qna = await (await fetch(`${BASE}/api/qna`)).json();
  const item = qna.items.find((x) => x.id === id);
  assert.ok(item);
  assert.equal(item.answer, '답변입니다.');
  assert.equal(item.author_label, '시험 엔지니어');
  assert.equal('email' in item || 'company' in item, false);
});

test('공개에 동의하지 않은 글은 승인해도 공개되지 않는다', async () => {
  const title = `비공개 시험 ${unique()}`;
  await newCode({ title, consentPublish: false });
  const id = await latestRequestId(title);
  const form = new URLSearchParams({ action: 'approve', title, body: 'x'.repeat(40) });
  await fetch(`${BASE}/admin/r/${id}?t=${reviewToken(id)}`, { method: 'POST', body: form });
  const qna = await (await fetch(`${BASE}/api/qna`)).json();
  assert.equal(qna.items.some((x) => x.id === id), false);
});

test('설명서는 코드 없이 받을 수 있다', async () => {
  const res = await fetch(`${BASE}/manual`);
  assert.equal(res.status, 200);
  await res.text();
});

test('코드는 10분 동안 유효하고, 응답에는 가린 이메일만 돌려준다', async () => {
  const before = Date.now();
  const data = await newRequest({ email: 'abcdef@example.com' });
  assert.equal(data.email, 'ab****@example.com');
  const minutes = (data.expiresAt - before) / 60000;
  assert.ok(minutes > 9.9 && minutes < 10.1, String(minutes));
});

test('코드를 다시 보내면 이전 코드는 쓸 수 없고, 신청 1건당 3번까지만 보낸다', async () => {
  const first = await newRequest();
  const second = await post('/api/resend-code', { requestId: first.requestId });
  assert.equal(second.res.status, 200, JSON.stringify(second.data));
  assert.notEqual(second.data.devCode, first.devCode);
  assert.equal((await post('/api/code-check', { code: first.devCode })).data.state, 'expired');
  assert.equal((await post('/api/code-check', { code: second.data.devCode })).data.state, 'valid');

  const third = await post('/api/resend-code', { requestId: first.requestId });
  assert.equal(third.res.status, 200);
  const fourth = await post('/api/resend-code', { requestId: first.requestId });
  assert.equal(fourth.res.status, 429);
  assert.equal(fourth.data.error, 'resend_limit');
  assert.equal((await download(third.data.devCode)).status, 200);
});

test('없는 신청 번호로는 코드를 보내지 않는다', async () => {
  const { res, data } = await post('/api/resend-code', { requestId: 'zzzzzzzzzz' });
  assert.equal(res.status, 404);
  assert.equal(data.error, 'not_found');
});

function validInquiry(overrides = {}) {
  return {
    lang: 'ko', company: '시험전자 / 홍길동', email: `inq-${unique()}@example.com`, service: '무선통신 / BLE / NFC 회로 및 안테나 매칭',
    stage: '구상·요구사항 정리', schedule: '2027년 1분기', topic: '', message: 'BLE 센서 제품 개발을 상담하고 싶습니다.',
    turnstileToken: TURNSTILE_TEST_TOKEN, ...overrides
  };
}

test('상담 문의는 서버에 접수되고 관리 목록에 보인다', async () => {
  const company = `문의시험 ${unique()}`;
  const { res, data } = await post('/api/inquiry', validInquiry({ company }));
  assert.equal(res.status, 200, JSON.stringify(data));
  assert.equal(data.ok, true);
  const admin = await fetch(`${BASE}/admin`, { headers: { Authorization: `Basic ${btoa(`admin:${ADMIN_SECRET}`)}` } });
  assert.ok((await admin.text()).includes(company));
});

test('상담 문의 입력 검사: 회사명 · 이메일 · 분야 · 내용 · 스팸 칸 · 스팸 방지', async () => {
  const cases = [
    [{ company: '' }, 'invalid_company'],
    [{ email: 'nope' }, 'invalid_email'],
    [{ service: '' }, 'invalid_service'],
    [{ message: '   ' }, 'invalid_message'],
    [{ website: 'x' }, 'spam_suspected'],
    [{ turnstileToken: '' }, 'captcha_failed']
  ];
  for (const [override, error] of cases) {
    const { res, data } = await post('/api/inquiry', validInquiry(override));
    assert.equal(res.status, 400, error);
    assert.equal(data.error, error);
  }
});

// ---------- new-version notices (opt-in) ----------

const b64url = (text) => Buffer.from(text).toString('base64url');
const unsubToken = (email) => createHmac('sha256', ADMIN_SECRET).update(`unsub:${email}`).digest('base64url');
const adminAuth = { Authorization: `Basic ${Buffer.from(`admin:${ADMIN_SECRET}`).toString('base64')}` };
const subscriberCount = async () => {
  const html = await (await fetch(`${BASE}/admin/notify`, { headers: adminAuth })).text();
  return Number(/알림 받기 동의: <b>(\d+)명<\/b>/.exec(html)[1]);
};

test('알림 받기에 동의한 신청만 명단에 들어가고, 링크로 수신 거부하면 지워진다', async () => {
  const before = await subscriberCount();
  await newRequest();                                        // not opted in
  assert.equal(await subscriberCount(), before);
  const email = `notify-${unique()}@example.com`;
  await newRequest({ email, consentUpdates: true });
  assert.equal(await subscriberCount(), before + 1);

  const link = `${BASE}/unsubscribe?e=${b64url(email)}&t=${unsubToken(email)}`;
  // Opening the link (as a mail scanner would) only asks for confirmation.
  assert.match(await (await fetch(link)).text(), /수신 거부/);
  assert.equal(await subscriberCount(), before + 1);
  // One-click unsubscribe from a mail app (RFC 8058) or the confirm button.
  const res = await fetch(link, { method: 'POST', body: 'List-Unsubscribe=One-Click', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  assert.equal(res.status, 200);
  assert.equal(await subscriberCount(), before);
});

test('서명이 틀린 수신 거부 링크는 아무것도 지우지 않는다', async () => {
  const email = `notify-${unique()}@example.com`;
  await newRequest({ email, consentUpdates: true });
  const before = await subscriberCount();
  const res = await fetch(`${BASE}/unsubscribe?e=${b64url(email)}&t=${unsubToken('someone@else.example')}`, { method: 'POST' });
  assert.equal(res.status, 403);
  assert.equal(await subscriberCount(), before);
});

test('안내 메일 화면은 비밀번호가 필요하고, 화면의 서명 없이는 보내지 않는다', async () => {
  assert.equal((await fetch(`${BASE}/admin/notify`)).status, 401);
  const res = await fetch(`${BASE}/admin/notify`, {
    method: 'POST', headers: { ...adminAuth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ tag: 'v0.0-dev', token: 'forged', notes_ko: 'x', notes_en: 'x' })
  });
  assert.equal(res.status, 403);
});

// Automatic notice: the daily run is triggered by hand (wrangler dev --test-scheduled, NOTICE_DELAY_HOURS=0).
const runDaily = () => fetch(`${BASE}/__scheduled?cron=0+18+*+*+*`);
const cancelToken = (tag) => createHmac('sha256', ADMIN_SECRET).update(`cancel:${tag}`).digest('base64url');
const notifyPage = async () => (await fetch(`${BASE}/admin/notify`, { headers: adminAuth })).text();

test('새 버전 자동 안내: 첫 점검에 일정이 잡히고, 취소 링크로 멈추면 자동 발송 대상이 아니다', async () => {
  await newRequest({ email: `auto-${unique()}@example.com`, consentUpdates: true });
  await runDaily();
  await new Promise((r) => setTimeout(r, 300));
  assert.match(await notifyPage(), /자동 발송: <b>(\d+월 \d+일 새벽 3시쯤|취소됨)/);

  const tag = 'v0.0-dev';
  assert.equal((await fetch(`${BASE}/admin/cancel-notice?tag=${tag}&t=forged`, { method: 'POST' })).status, 403);
  const link = `${BASE}/admin/cancel-notice?tag=${tag}&t=${cancelToken(tag)}`;
  assert.match(await (await fetch(link)).text(), /자동 발송하지 않기/);   // opening the link only asks
  assert.equal((await fetch(link, { method: 'POST' })).status, 200);
  assert.match(await notifyPage(), /자동 발송: <b>취소됨<\/b>/);
});

test('릴리스 설명의 마크다운 기호는 안내 문구에서 빠진다', async () => {
  const html = await notifyPage();
  if (!html.includes('name="notes_ko"')) return; // already sent in this local DB
  const notes = /name="notes_ko"[^>]*>([^<]*)</.exec(html)[1];
  assert.equal(/(^|\n)#|\*\*/.test(notes), false);
});
