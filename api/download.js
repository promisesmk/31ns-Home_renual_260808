// Member-only, one download per login.
//
// 1. The session and company info are checked on the server for every request.
// 2. Delivery is prepared first; if that fails nothing is consumed and the member can simply retry.
// 3. A grant row is inserted with the login's session_id. The unique constraint lets exactly one request
//    per login win — concurrent requests and replays of the same (still unexpired) token get 409.
// 4. The login session is revoked on the server, and the browser signs out locally.
//    Downloading again needs a fresh login (a new session_id).
//
// Delivery modes:
// - 'github' (production): returns a ticket URL on the delivery worker. The worker redeems the ticket once
//   (api/download-redeem) and streams the file, so the reusable GitHub/storage URL never reaches the browser.
// - 'storage' (review test files only): returns a 60-second signed Supabase URL. That URL can be reused
//   within its lifetime; the one-per-login rule still applies to the request itself.
import {
  BUCKET, DOWNLOAD_URL_TTL_SECONDS, GRANT_TTL_SECONDS, bearer, db, deliveryWorkerUrl, getProfile,
  getPublishedRelease, githubConfigured, handle, profileComplete, requireUser, send, sessionIdFromToken
} from './_lib/server.js';

async function prepareDelivery(release) {
  if (release.source === 'github') {
    const worker = deliveryWorkerUrl();
    if (!worker || !githubConfigured() || !release.github_tag || !release.github_asset) return null;
    return { mode: 'worker', ticketUrl: (grantId) => `${worker}/d/${grantId}` };
  }
  if (!release.file_path) return null;
  const { data, error } = await db().storage.from(BUCKET).createSignedUrl(
    release.file_path, DOWNLOAD_URL_TTL_SECONDS, { download: release.file_name || true }
  );
  if (error || !data?.signedUrl) {
    console.error('signed url failed', error);
    return null;
  }
  return { mode: 'storage', url: data.signedUrl };
}

export default handle(['POST'], async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const token = bearer(req);
  const sessionId = sessionIdFromToken(token);
  if (!sessionId) return send(res, 401, { error: 'session_expired' });

  const profile = await getProfile(user.id);
  if (!profileComplete(profile)) return send(res, 403, { error: 'profile_incomplete' });

  const release = await getPublishedRelease();
  if (!release) return send(res, 404, { error: 'not_available' });

  // Nothing is consumed until delivery is ready.
  const delivery = await prepareDelivery(release);
  if (!delivery) return send(res, 409, { error: 'file_unavailable' });

  const expiresAt = new Date(Date.now() + GRANT_TTL_SECONDS * 1000).toISOString();
  const { data: grant, error: grantError } = await db().from('download_grants')
    .insert({ user_id: user.id, release_id: release.id, session_id: sessionId, expires_at: expiresAt })
    .select('id')
    .single();
  if (grantError) {
    if (grantError.code === '23505') return send(res, 409, { error: 'login_already_used' });
    throw grantError;
  }

  let url;
  if (delivery.mode === 'storage') {
    // Test files are handed over right away, so the grant is redeemed and logged now.
    const { error } = await db().rpc('redeem_download_grant', { grant_id: grant.id });
    if (error) throw error;
    const { error: logError } = await db().from('download_logs').insert({ user_id: user.id, release_id: release.id });
    if (logError) console.error('download log failed', logError);
    url = delivery.url;
  } else {
    url = delivery.ticketUrl(grant.id); // logged when the worker redeems it
  }

  // End this login on the server. Even if this call fails, the unique session_id already blocks reuse.
  const { error: signOutError } = await db().auth.admin.signOut(token, 'local');
  if (signOutError) console.error('server sign-out failed', signOutError);

  send(res, 200, {
    url,
    mode: delivery.mode,
    fileName: release.file_name || release.github_asset,
    expiresIn: delivery.mode === 'storage' ? DOWNLOAD_URL_TTL_SECONDS : GRANT_TTL_SECONDS,
    signedOut: true
  });
});
