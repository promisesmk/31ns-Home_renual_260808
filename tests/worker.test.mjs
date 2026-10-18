// Delivery worker draft (workers/pcb3d-download/worker.js) with fake site + storage. No network.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../workers/pcb3d-download/worker.js';

const env = { SITE_ORIGIN: 'https://site.example', REDEEM_SECRET: 'worker-secret' };
const SOURCE = 'https://objects.githubusercontent.example/asset?sig=SECRET-SIGNATURE';
const SIZE = 5 * 1024 * 1024;
let calls;
let ticketState;

beforeEach(() => {
  calls = [];
  ticketState = new Map([['11111111-1111-4111-8111-111111111111', 'issued']]);
  globalThis.fetch = async (url, opts = {}) => {
    calls.push({ url: String(url), opts });
    if (String(url) === 'https://site.example/api/download-redeem') {
      if (opts.headers.Authorization !== 'Bearer worker-secret') return new Response('{}', { status: 401 });
      const { grant } = JSON.parse(opts.body);
      if (ticketState.get(grant) !== 'issued') return Response.json({ error: 'ticket_used_or_expired' }, { status: 410 });
      ticketState.set(grant, 'redeemed');
      return Response.json({ sourceUrl: SOURCE, fileName: 'PCB3D_Builder_Setup_2.1.exe', size: SIZE });
    }
    if (String(url) === SOURCE) {
      let sent = 0;
      const body = new ReadableStream({
        pull(controller) {
          if (sent >= SIZE) return controller.close();
          const chunk = new Uint8Array(Math.min(256 * 1024, SIZE - sent)).fill(7);
          sent += chunk.length;
          controller.enqueue(chunk);
        }
      });
      return new Response(body, { status: 200, headers: { 'Content-Length': String(SIZE) } });
    }
    throw new Error(`unexpected fetch ${url}`);
  };
});

const get = (path, method = 'GET') => worker.fetch(new Request(`https://dl.example.workers.dev${path}`, { method }), env);

test('valid ticket: streams the whole file as an attachment', async () => {
  const res = await get('/d/11111111-1111-4111-8111-111111111111');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Disposition'), /attachment; filename="PCB3D_Builder_Setup_2\.1\.exe"/);
  assert.equal(res.headers.get('Cache-Control'), 'no-store, private');
  const bytes = new Uint8Array(await res.arrayBuffer());
  assert.equal(bytes.length, SIZE);
});

test('the storage URL never reaches the browser (headers or redirect)', async () => {
  const res = await get('/d/11111111-1111-4111-8111-111111111111');
  assert.notEqual(res.status, 302);
  for (const [, v] of res.headers) assert.ok(!v.includes('SECRET-SIGNATURE'), v);
  assert.equal(res.headers.get('Location'), null);
});

test('same ticket twice: second gets 410 page, no file', async () => {
  await (await get('/d/11111111-1111-4111-8111-111111111111')).arrayBuffer();
  const again = await get('/d/11111111-1111-4111-8111-111111111111');
  assert.equal(again.status, 410);
  assert.match(again.headers.get('Content-Type'), /text\/html/);
  assert.ok((await again.text()).includes('다시 로그인'));
  assert.equal(calls.filter((c) => c.url === SOURCE).length, 1);
});

test('Range requests are not forwarded (no partial resume with a used ticket)', async () => {
  const req = new Request('https://dl.example.workers.dev/d/11111111-1111-4111-8111-111111111111', { headers: { Range: 'bytes=100-' } });
  const res = await worker.fetch(req, env);
  assert.equal(res.status, 200);
  const sourceCall = calls.find((c) => c.url === SOURCE);
  assert.ok(!sourceCall.opts.headers, 'no headers forwarded to storage');
});

test('unknown paths and other methods: 404, no redeem call', async () => {
  assert.equal((await get('/')).status, 404);
  assert.equal((await get('/d/not-a-ticket')).status, 404);
  assert.equal((await get('/d/11111111-1111-4111-8111-111111111111', 'POST')).status, 404);
  assert.equal(calls.length, 0);
});

test('site unreachable: friendly 502 page', async () => {
  globalThis.fetch = async () => { throw new Error('down'); };
  const res = await get('/d/11111111-1111-4111-8111-111111111111');
  assert.equal(res.status, 502);
});
