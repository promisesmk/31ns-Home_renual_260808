// Shared helpers for the member/download API. Files under api/_lib are not exposed as routes.
import { createClient } from '@supabase/supabase-js';

export const BUCKET = process.env.RELEASE_BUCKET || 'viewer-releases';
export const DOWNLOAD_URL_TTL_SECONDS = 60;
// How long a one-time download ticket stays redeemable after the request is accepted.
export const GRANT_TTL_SECONDS = 120;

export function isConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_SECRET_KEY);
}

// Accepts the value with or without a copied path such as /rest/v1/ and keeps only the origin.
export function supabaseUrl() {
  try {
    return new URL(process.env.SUPABASE_URL.trim()).origin;
  } catch {
    return '';
  }
}

let serviceClient;
// Server-only client with the secret key. Never send this key or client to the browser.
export function db() {
  serviceClient ??= createClient(supabaseUrl(), process.env.SUPABASE_SECRET_KEY.trim(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  return serviceClient;
}

export function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
}

// Wraps a handler with method checking, "not configured" handling and a generic error response.
export function handle(methods, handler) {
  return async (req, res) => {
    if (!methods.includes(req.method)) {
      res.setHeader('Allow', methods.join(', '));
      return send(res, 405, { error: 'method_not_allowed' });
    }
    if (!isConfigured()) return send(res, 503, { error: 'not_configured' });
    try {
      await handler(req, res);
    } catch (error) {
      console.error(error);
      send(res, 500, { error: 'server_error' });
    }
  };
}

export function bearer(req) {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
  return match ? match[1] : null;
}

// Login session id from a token Supabase has already verified (requireUser). Not a security check by itself.
export function sessionIdFromToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return /^[0-9a-f-]{36}$/i.test(payload.session_id || '') ? payload.session_id : null;
  } catch {
    return null;
  }
}

// ---- Private GitHub Releases (file source). The token never leaves the server. ----
export function githubConfigured() {
  return Boolean(process.env.GITHUB_RELEASES_TOKEN && process.env.GITHUB_RELEASE_REPO);
}

function githubHeaders(accept) {
  return {
    Authorization: `Bearer ${process.env.GITHUB_RELEASES_TOKEN.trim()}`,
    Accept: accept,
    'User-Agent': '31ns-website-download',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

// Finds the asset in the release with this tag. Returns { id, name, size, apiUrl } or null.
export async function githubAsset(tag, assetName) {
  if (!githubConfigured() || !tag || !assetName) return null;
  const repo = process.env.GITHUB_RELEASE_REPO.trim();
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`,
    { headers: githubHeaders('application/vnd.github+json') });
  if (!res.ok) return null;
  const release = await res.json();
  const asset = (release.assets || []).find((a) => a.name === assetName && a.state === 'uploaded');
  return asset ? { id: asset.id, name: asset.name, size: asset.size, apiUrl: asset.url } : null;
}

// Short-lived storage URL for the asset (GitHub answers with a redirect). Used only server-to-server:
// it is handed to the delivery worker, never to the browser.
export async function githubAssetSourceUrl(apiUrl) {
  const res = await fetch(apiUrl, { headers: githubHeaders('application/octet-stream'), redirect: 'manual' });
  return res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
}

export function deliveryWorkerUrl() {
  const raw = (process.env.DOWNLOAD_WORKER_URL || '').trim();
  try { return raw ? new URL(raw).origin : ''; } catch { return ''; }
}

// While MEMBER_ALLOWLIST is set, only those emails may use member features (test phase).
function allowedEmail(email) {
  const list = (process.env.MEMBER_ALLOWLIST || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.length === 0 || list.includes((email || '').toLowerCase());
}

// Resolves the signed-in user from the access token, verified by Supabase on every call.
// Sends the error response itself and returns null when the request is not allowed.
export async function requireUser(req, res) {
  const token = bearer(req);
  if (!token) {
    send(res, 401, { error: 'login_required' });
    return null;
  }
  const { data, error } = await db().auth.getUser(token);
  if (error || !data?.user) {
    send(res, 401, { error: 'session_expired' });
    return null;
  }
  const user = data.user;
  if (!user.email || !user.email_confirmed_at) {
    send(res, 403, { error: 'email_not_verified' });
    return null;
  }
  if (!allowedEmail(user.email)) {
    send(res, 403, { error: 'not_in_test_allowlist' });
    return null;
  }
  return user;
}

export async function requireAdmin(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  const { data, error } = await db().from('site_admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (!data) {
    send(res, 403, { error: 'admin_only' });
    return null;
  }
  return user;
}

export async function getProfile(userId) {
  const { data, error } = await db()
    .from('member_profiles')
    .select('email, company, contact_name, job_title, purpose, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function profileComplete(profile) {
  return Boolean(profile && profile.company?.trim() && profile.contact_name?.trim());
}

export async function getPublishedRelease() {
  const { data, error } = await db()
    .from('viewer_releases')
    .select('*')
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function text(value, max) {
  if (value === undefined || value === null) return '';
  return String(value).trim().slice(0, max);
}
