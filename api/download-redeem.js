// Called only by the delivery worker (shared secret), never by browsers.
// Redeems a one-time ticket atomically and returns a short-lived source URL for the worker to stream.
// A ticket that is unknown, expired or already redeemed gets 410 — the worker then shows "log in again".
import { timingSafeEqual } from 'node:crypto';
import {
  bearer, db, githubAsset, githubAssetSourceUrl, githubConfigured, handle, send
} from './_lib/server.js';

function workerAuthorized(req) {
  const expected = (process.env.DOWNLOAD_WORKER_SECRET || '').trim();
  const given = bearer(req) || '';
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export default handle(['POST'], async (req, res) => {
  if (!process.env.DOWNLOAD_WORKER_SECRET || !githubConfigured()) return send(res, 503, { error: 'delivery_not_configured' });
  if (!workerAuthorized(req)) return send(res, 401, { error: 'unauthorized' });
  const grantId = String(req.body?.grant || '');
  if (!/^[0-9a-f-]{36}$/i.test(grantId)) return send(res, 400, { error: 'bad_ticket' });

  const { data: rows, error } = await db().rpc('redeem_download_grant', { grant_id: grantId });
  if (error) throw error;
  const redeemed = Array.isArray(rows) ? rows[0] : rows;
  if (!redeemed) return send(res, 410, { error: 'ticket_used_or_expired' });

  const { data: release, error: releaseError } = await db().from('viewer_releases')
    .select('*').eq('id', redeemed.release_id).maybeSingle();
  if (releaseError) throw releaseError;
  if (!release || release.source !== 'github') return send(res, 409, { error: 'file_unavailable' });

  const asset = await githubAsset(release.github_tag, release.github_asset);
  const sourceUrl = asset && await githubAssetSourceUrl(asset.apiUrl);
  if (!sourceUrl) return send(res, 502, { error: 'source_unavailable' });

  const { error: logError } = await db().from('download_logs').insert({ user_id: redeemed.user_id, release_id: release.id });
  if (logError) console.error('download log failed', logError);

  send(res, 200, { sourceUrl, fileName: asset.name, size: asset.size });
});
