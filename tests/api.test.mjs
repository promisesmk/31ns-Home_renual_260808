// Permission tests for the /api handlers with a fake Supabase client (no network).
// Run from the project root: npm test
import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
process.env.SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY = 'pub';
process.env.SUPABASE_SECRET_KEY = 'secret';

// ---- fake data ----
const jwt = (sid) => `h.${Buffer.from(JSON.stringify({ session_id: sid })).toString('base64url')}.s`;
const T = {
  member: jwt('aaaaaaaa-0000-4000-8000-000000000001'),
  member2: jwt('aaaaaaaa-0000-4000-8000-000000000002'), // same member, a new login
  unverified: jwt('aaaaaaaa-0000-4000-8000-000000000003'),
  admin: jwt('aaaaaaaa-0000-4000-8000-000000000004'),
  noprofile: jwt('aaaaaaaa-0000-4000-8000-000000000005'),
  outsider: jwt('aaaaaaaa-0000-4000-8000-000000000006')
};
const state = {};
function reset() {
  const member = { id: 'u1', email: 'member@test.dev', email_confirmed_at: '2026-01-01' };
  state.users = {
    [T.member]: member,
    [T.member2]: member,
    [T.unverified]: { id: 'u2', email: 'new@test.dev', email_confirmed_at: null },
    [T.admin]: { id: 'u3', email: 'admin@test.dev', email_confirmed_at: '2026-01-01' },
    [T.noprofile]: { id: 'u4', email: 'np@test.dev', email_confirmed_at: '2026-01-01' }
  };
  state.tables = {
    member_profiles: [
      { user_id: 'u1', email: 'member@test.dev', company: 'ACME', contact_name: 'Kim' },
      { user_id: 'u3', email: 'admin@test.dev', company: '31NS', contact_name: 'Admin' }
    ],
    site_admins: [{ user_id: 'u3' }],
    viewer_releases: [],
    download_logs: [],
    download_grants: []
  };
  state.files = {};
  state.rpcCalls = [];
  state.signOuts = [];
  state.seq = 0;
  state.github = {}; // tag -> [{ name, size }]
  for (const k of ['MEMBER_ALLOWLIST', 'GITHUB_RELEASES_TOKEN', 'GITHUB_RELEASE_REPO', 'DOWNLOAD_WORKER_URL', 'DOWNLOAD_WORKER_SECRET']) delete process.env[k];
}

function query(table) {
  let rows = state.tables[table];
  const filters = [];
  let op = 'select';
  let payload;
  const api = {
    select() { return api; },
    eq(col, val) { filters.push((r) => r[col] === val); return api; },
    order() { return api; },
    insert(row) { op = 'insert'; payload = row; return api; },
    upsert(row) { op = 'upsert'; payload = row; return api; },
    update(row) { op = 'update'; payload = row; return api; },
    delete() { op = 'delete'; return api; },
    run() {
      const match = rows.filter((r) => filters.every((f) => f(r)));
      if (op === 'insert') {
        const id = '00000000-0000-4000-8000-' + String(++state.seq).padStart(12, '0');
        if (table === 'download_grants') {
          if (rows.some((r) => r.session_id === payload.session_id)) { api.err = { code: '23505', message: 'duplicate key' }; return []; }
          const row = { id, status: 'issued', ...payload }; rows.push(row); return [row];
        }
        const defaults = table === 'viewer_releases'
          ? { status: 'draft', source: 'storage', program_name: 'PCB 3D Builder', version: '', os: '', install_guide: '', changelog: '', terms: '', is_test: false }
          : {};
        const row = { id, ...defaults, ...payload };
        rows.push(row); return [row];
      }
      if (op === 'upsert') {
        const i = rows.findIndex((r) => r.user_id === payload.user_id);
        if (i >= 0) rows[i] = { ...rows[i], ...payload }; else rows.push(payload);
        return [payload];
      }
      if (op === 'update') { match.forEach((r) => Object.assign(r, payload)); return match; }
      if (op === 'delete') { state.tables[table] = rows.filter((r) => !match.includes(r)); return match; }
      return match;
    },
    maybeSingle() { const d = api.run()[0]; return Promise.resolve({ data: d || null, error: api.err || null }); },
    single() { const d = api.run()[0]; return Promise.resolve({ data: d || null, error: api.err || (d ? null : { message: 'none' }) }); },
    then(resolve, reject) { const d = api.run(); return Promise.resolve({ data: d, error: api.err || null }).then(resolve, reject); }
  };
  return api;
}

const fakeClient = {
  auth: {
    async getUser(token) {
      const user = state.users[token];
      return user ? { data: { user }, error: null } : { data: { user: null }, error: { message: 'bad jwt' } };
    },
    admin: {
      async signOut(token, scope) { state.signOuts.push([token, scope]); return { error: null }; }
    }
  },
  from: (table) => query(table),
  async rpc(name, args) {
    state.rpcCalls.push([name, args]);
    if (name === 'redeem_download_grant') {
      const g = state.tables.download_grants.find((r) => r.id === args.grant_id && r.status === 'issued' && new Date(r.expires_at) > new Date());
      if (!g) return { data: [], error: null };
      g.status = 'redeemed';
      return { data: [{ release_id: g.release_id, user_id: g.user_id }], error: null };
    }
    for (const r of state.tables.viewer_releases) if (r.status === 'published' && r.id !== args.target) r.status = 'unpublished';
    const t = state.tables.viewer_releases.find((r) => r.id === args.target);
    t.status = 'published';
    return { error: null };
  },
  storage: {
    from() {
      return {
        async createSignedUrl(path) {
          return state.files[path] ? { data: { signedUrl: `https://signed/${path}?t=1` }, error: null } : { data: null, error: { message: 'not found' } };
        },
        async createSignedUploadUrl(path) { return { data: { path, token: 'up-token', signedUrl: 'x' }, error: null }; },
        async info(path) { return state.files[path] ? { data: { size: state.files[path] }, error: null } : { data: null, error: { message: 'nf' } }; },
        async remove(paths) { paths.forEach((p) => delete state.files[p]); return { error: null }; }
      };
    }
  }
};

mock.module(new URL('node_modules/@supabase/supabase-js/dist/index.mjs', `file://${ROOT}/`).href, { exports: { createClient: () => fakeClient } });

// Fake GitHub API: release by tag -> assets; asset download -> 302 to a short-lived storage URL.
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  const tag = /\/releases\/tags\/([^/?]+)$/.exec(u);
  if (tag) {
    const assets = state.github[decodeURIComponent(tag[1])];
    if (!assets) return new Response('{}', { status: 404 });
    return Response.json({ assets: assets.map((a, i) => ({ id: i + 1, name: a.name, size: a.size, state: 'uploaded', url: `https://api.github.com/assets/${i + 1}` })) });
  }
  if (/^https:\/\/api\.github\.com\/assets\//.test(u)) {
    return new Response(null, { status: 302, headers: { location: `https://objects.githubusercontent.example/${u.split('/').pop()}?sig=x` } });
  }
  throw new Error(`unexpected fetch ${u}`);
};

const download = (await import(`${ROOT}/api/download.js`)).default;
const redeem = (await import(`${ROOT}/api/download-redeem.js`)).default;
const profile = (await import(`${ROOT}/api/profile.js`)).default;
const admin = (await import(`${ROOT}/api/admin.js`)).default;
const release = (await import(`${ROOT}/api/release.js`)).default;

async function call(handler, { method = 'GET', token, body, query = {} } = {}) {
  const req = { method, headers: token ? { authorization: `Bearer ${token}` } : {}, body, query };
  const res = {
    statusCode: 200, body: undefined, headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; }
  };
  await handler(req, res);
  return res;
}

function publishedRelease(extra = {}) {
  const r = { id: '11111111-1111-1111-1111-111111111111', program_name: 'PCB 3D Builder', version: '0.0.1-test', os: 'Windows', install_guide: 'run', changelog: '', terms: 'test only', is_test: true, file_path: '11111111-1111-1111-1111-111111111111/1-test.zip', file_name: 'test.zip', file_size: 10, status: 'published', ...extra };
  state.tables.viewer_releases.push(r);
  state.files[r.file_path] = 10;
  return r;
}

beforeEach(reset);

test('download: no token -> 401, no URL', async () => {
  publishedRelease();
  const res = await call(download, { method: 'POST' });
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.url, undefined);
});

test('download: forged token -> 401', async () => {
  publishedRelease();
  const res = await call(download, { method: 'POST', token: 'forged.token.x' });
  assert.equal(res.statusCode, 401);
});

test('download: unverified email -> 403', async () => {
  publishedRelease();
  const res = await call(download, { method: 'POST', token: T.unverified });
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'email_not_verified');
});

test('download: missing company info -> 403 profile_incomplete', async () => {
  publishedRelease();
  const res = await call(download, { method: 'POST', token: T.noprofile });
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'profile_incomplete');
});

test('download: nothing published -> 404, no URL', async () => {
  const res = await call(download, { method: 'POST', token: T.member });
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.url, undefined);
});

test('download: published but file missing in storage -> 409, no URL', async () => {
  const r = publishedRelease();
  delete state.files[r.file_path];
  const res = await call(download, { method: 'POST', token: T.member });
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.url, undefined);
});

test('download: member with profile -> short-lived URL and a log row', async () => {
  publishedRelease();
  const res = await call(download, { method: 'POST', token: T.member });
  assert.equal(res.statusCode, 200);
  assert.match(res.body.url, /^https:\/\/signed\//);
  assert.equal(res.body.expiresIn, 60);
  assert.equal(state.tables.download_logs.length, 1);
});

test('allowlist: member not on the list is refused', async () => {
  publishedRelease();
  process.env.MEMBER_ALLOWLIST = 'admin@test.dev';
  const res = await call(download, { method: 'POST', token: T.member });
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'not_in_test_allowlist');
});

test('profile: email comes from the session, not the request body', async () => {
  const res = await call(profile, { method: 'PUT', token: T.noprofile, body: { company: 'NewCo', contactName: 'Lee', email: 'spoof@evil.dev' } });
  assert.equal(res.statusCode, 200);
  const row = state.tables.member_profiles.find((r) => r.user_id === 'u4');
  assert.equal(row.email, 'np@test.dev');
  assert.equal(res.body.complete, true);
});

test('profile: required fields enforced on the server', async () => {
  const res = await call(profile, { method: 'PUT', token: T.noprofile, body: { company: ' ' } });
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body.fields, ['company', 'contactName']);
});

test('admin: regular member gets 403 on every action', async () => {
  for (const [method, action] of [['GET', 'me'], ['GET', 'list'], ['POST', 'save'], ['POST', 'publish'], ['POST', 'upload-url']]) {
    const res = await call(admin, { method, token: T.member, query: { action }, body: {} });
    assert.equal(res.statusCode, 403, action);
  }
});

test('admin: anonymous gets 401', async () => {
  const res = await call(admin, { method: 'GET', query: { action: 'list' } });
  assert.equal(res.statusCode, 401);
});

test('admin: publish refuses missing info and missing file', async () => {
  const created = await call(admin, { method: 'POST', token: T.admin, query: { action: 'save' }, body: { version: '1.0' } });
  const res = await call(admin, { method: 'POST', token: T.admin, query: { action: 'publish' }, body: { id: created.body.release.id } });
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body.missing, ['운영체제', '설치 안내', '사용 조건', '설치 파일']);
  assert.equal(state.rpcCalls.length, 0);
});

test('admin: full flow — draft, upload, attach, publish replaces old version only on success', async () => {
  const old = publishedRelease({ id: '22222222-2222-2222-2222-222222222222', file_path: '22222222-2222-2222-2222-222222222222/old.zip' });
  state.files[old.file_path] = 5;
  const created = await call(admin, { method: 'POST', token: T.admin, query: { action: 'save' }, body: { version: '1.1', os: 'Windows', installGuide: 'x', terms: 'y', isTest: true } });
  const id = created.body.release.id;

  const up = await call(admin, { method: 'POST', token: T.admin, query: { action: 'upload-url' }, body: { id, fileName: '설치 파일 v1.1.exe' } });
  assert.equal(up.statusCode, 200);
  assert.ok(up.body.path.startsWith(`${id}/`));
  assert.ok(!/[^A-Za-z0-9._\-/]/.test(up.body.path), up.body.path);

  // Upload "failed": attach refuses, old release still public.
  const failed = await call(admin, { method: 'POST', token: T.admin, query: { action: 'attach-file' }, body: { id, path: up.body.path } });
  assert.equal(failed.statusCode, 400);
  assert.equal(old.status, 'published');

  // Path outside the release folder is rejected.
  const evil = await call(admin, { method: 'POST', token: T.admin, query: { action: 'attach-file' }, body: { id, path: old.file_path } });
  assert.equal(evil.statusCode, 400);

  state.files[up.body.path] = 1234;
  const ok = await call(admin, { method: 'POST', token: T.admin, query: { action: 'attach-file' }, body: { id, path: up.body.path, fileName: 'viewer.exe' } });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.body.release.fileSize, 1234);

  const pub = await call(admin, { method: 'POST', token: T.admin, query: { action: 'publish' }, body: { id } });
  assert.equal(pub.statusCode, 200);
  assert.equal(pub.body.release.status, 'published');
  assert.equal(old.status, 'unpublished');

  const info = await call(release, {});
  assert.equal(info.body.available, true);
  assert.equal(info.body.release.version, '1.1');
  assert.equal(info.body.release.isTest, true);
  assert.equal(JSON.stringify(info.body).includes(up.body.path), false, 'storage path must not leak');

  // Published release: file cannot be swapped, cannot be deleted.
  const swap = await call(admin, { method: 'POST', token: T.admin, query: { action: 'upload-url' }, body: { id, fileName: 'x.exe' } });
  assert.equal(swap.statusCode, 409);
  const del = await call(admin, { method: 'POST', token: T.admin, query: { action: 'delete' }, body: { id } });
  assert.equal(del.statusCode, 409);

  // Unpublish -> public page shows nothing to download.
  await call(admin, { method: 'POST', token: T.admin, query: { action: 'unpublish' }, body: { id } });
  const after = await call(release, {});
  assert.equal(after.body.available, false);
  const dl = await call(download, { method: 'POST', token: T.member });
  assert.equal(dl.statusCode, 404);
});

// ---------- one download per login ----------

function githubSetup() {
  process.env.GITHUB_RELEASES_TOKEN = 'ghp_test';
  process.env.GITHUB_RELEASE_REPO = 'example/releases';
  process.env.DOWNLOAD_WORKER_URL = 'https://dl.example.workers.dev/';
  process.env.DOWNLOAD_WORKER_SECRET = 'worker-secret';
  state.github['v2.1'] = [{ name: 'PCB3D_Builder_Setup_2.1.exe', size: 180_000_000 }];
}
function githubRelease(extra = {}) {
  const r = { id: '22222222-2222-4222-8222-222222222222', program_name: 'PCB 3D Builder', version: '2.1', os: 'Windows', install_guide: 'run', changelog: '', terms: 'free', is_test: false, source: 'github', github_tag: 'v2.1', github_asset: 'PCB3D_Builder_Setup_2.1.exe', file_path: null, status: 'published', ...extra };
  state.tables.viewer_releases.push(r);
  return r;
}

test('one per login: success signs the session out on the server', async () => {
  publishedRelease();
  const res = await call(download, { method: 'POST', token: T.member });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.signedOut, true);
  assert.deepEqual(state.signOuts, [[T.member, 'local']]);
  assert.equal(state.tables.download_grants.length, 1);
});

test('one per login: the same token again is refused (409), no URL', async () => {
  publishedRelease();
  await call(download, { method: 'POST', token: T.member });
  const again = await call(download, { method: 'POST', token: T.member });
  assert.equal(again.statusCode, 409);
  assert.equal(again.body.error, 'login_already_used');
  assert.equal(again.body.url, undefined);
});

test('one per login: two simultaneous requests -> exactly one succeeds', async () => {
  publishedRelease();
  const results = await Promise.all([1, 2, 3].map(() => call(download, { method: 'POST', token: T.member })));
  const codes = results.map((r) => r.statusCode).sort();
  assert.deepEqual(codes, [200, 409, 409]);
  assert.equal(results.filter((r) => r.body.url).length, 1);
});

test('one per login: a new login (new session) can download again', async () => {
  publishedRelease();
  assert.equal((await call(download, { method: 'POST', token: T.member })).statusCode, 200);
  assert.equal((await call(download, { method: 'POST', token: T.member2 })).statusCode, 200);
});

test('retry after failure: nothing consumed when the file cannot be prepared', async () => {
  const r = publishedRelease();
  delete state.files[r.file_path];
  const failed = await call(download, { method: 'POST', token: T.member });
  assert.equal(failed.statusCode, 409);
  assert.equal(failed.body.error, 'file_unavailable');
  assert.equal(state.tables.download_grants.length, 0);
  assert.equal(state.signOuts.length, 0);
  state.files[r.file_path] = 10; // fixed
  const retry = await call(download, { method: 'POST', token: T.member });
  assert.equal(retry.statusCode, 200);
});

test('github source without worker/GitHub settings: not consumed, no URL', async () => {
  githubRelease();
  const res = await call(download, { method: 'POST', token: T.member });
  assert.equal(res.statusCode, 409);
  assert.equal(state.tables.download_grants.length, 0);
  assert.equal(res.body.url, undefined);
});

test('github source: browser gets only a worker ticket URL, never a GitHub/storage URL', async () => {
  githubSetup();
  githubRelease();
  const res = await call(download, { method: 'POST', token: T.member });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.mode, 'worker');
  assert.match(res.body.url, /^https:\/\/dl\.example\.workers\.dev\/d\/[0-9a-f-]{36}$/);
  assert.ok(!JSON.stringify(res.body).includes('github'), JSON.stringify(res.body));
  assert.equal(state.tables.download_logs.length, 0, 'logged only when redeemed');
});

test('redeem: refuses missing or wrong worker secret', async () => {
  githubSetup();
  assert.equal((await call(redeem, { method: 'POST', body: { grant: '00000000-0000-4000-8000-000000000001' } })).statusCode, 401);
  assert.equal((await call(redeem, { method: 'POST', token: 'wrong-secret!', body: { grant: '00000000-0000-4000-8000-000000000001' } })).statusCode, 401);
  delete process.env.DOWNLOAD_WORKER_SECRET;
  assert.equal((await call(redeem, { method: 'POST', token: 'worker-secret', body: { grant: 'x' } })).statusCode, 503);
});

test('redeem: a ticket works once, second use is 410', async () => {
  githubSetup();
  githubRelease();
  const issued = await call(download, { method: 'POST', token: T.member });
  const grant = issued.body.url.split('/').pop();
  const first = await call(redeem, { method: 'POST', token: 'worker-secret', body: { grant } });
  assert.equal(first.statusCode, 200);
  assert.match(first.body.sourceUrl, /^https:\/\/objects\.githubusercontent\.example\//);
  assert.equal(first.body.fileName, 'PCB3D_Builder_Setup_2.1.exe');
  assert.equal(state.tables.download_logs.length, 1);
  const second = await call(redeem, { method: 'POST', token: 'worker-secret', body: { grant } });
  assert.equal(second.statusCode, 410);
  assert.equal(second.body.sourceUrl, undefined);
});

test('redeem: concurrent redeems of one ticket -> exactly one source URL', async () => {
  githubSetup();
  githubRelease();
  const grant = (await call(download, { method: 'POST', token: T.member })).body.url.split('/').pop();
  const results = await Promise.all([1, 2, 3].map(() => call(redeem, { method: 'POST', token: 'worker-secret', body: { grant } })));
  assert.equal(results.filter((r) => r.statusCode === 200).length, 1);
  assert.equal(results.filter((r) => r.statusCode === 410).length, 2);
});

test('redeem: an expired ticket is 410', async () => {
  githubSetup();
  githubRelease();
  const grant = (await call(download, { method: 'POST', token: T.member })).body.url.split('/').pop();
  state.tables.download_grants[0].expires_at = new Date(Date.now() - 1000).toISOString();
  const res = await call(redeem, { method: 'POST', token: 'worker-secret', body: { grant } });
  assert.equal(res.statusCode, 410);
});

test('admin publish (github): lists missing settings, then verifies the asset on GitHub', async () => {
  const created = await call(admin, { method: 'POST', token: T.admin, query: { action: 'save' }, body: { source: 'github', version: '2.1', os: 'Windows', installGuide: 'x', terms: 'y', githubTag: 'v2.1', githubAsset: 'PCB3D_Builder_Setup_2.1.exe' } });
  const id = created.body.release.id;
  const before = await call(admin, { method: 'POST', token: T.admin, query: { action: 'publish' }, body: { id } });
  assert.equal(before.statusCode, 400);
  assert.ok(before.body.missing.includes('GitHub Releases 연결(서버 설정)'));
  assert.ok(before.body.missing.includes('다운로드 전달 서버(Worker) 설정'));

  githubSetup();
  state.github['v2.1'] = [{ name: 'other.exe', size: 1 }];
  const wrong = await call(admin, { method: 'POST', token: T.admin, query: { action: 'publish' }, body: { id } });
  assert.deepEqual(wrong.body.missing, ['설치 파일(GitHub Releases에서 찾을 수 없음)']);

  state.github['v2.1'] = [{ name: 'PCB3D_Builder_Setup_2.1.exe', size: 180_000_000 }];
  const ok = await call(admin, { method: 'POST', token: T.admin, query: { action: 'publish' }, body: { id } });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.body.release.fileSize, 180_000_000);
  const info = await call(release, {});
  assert.equal(info.body.available, true);
  assert.equal(info.body.release.version, '2.1');
});

test('admin: GitHub-source release has no upload', async () => {
  const created = await call(admin, { method: 'POST', token: T.admin, query: { action: 'save' }, body: { source: 'github', version: '2.1' } });
  const res = await call(admin, { method: 'POST', token: T.admin, query: { action: 'upload-url' }, body: { id: created.body.release.id, fileName: 'a.exe' } });
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error, 'github_release_has_no_upload');
});
