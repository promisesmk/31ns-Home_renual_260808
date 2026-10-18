// Public: metadata of the currently published release. Never returns the storage path.
import { isConfigured, getPublishedRelease, send } from './_lib/server.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  if (!isConfigured()) return send(res, 200, { available: false, reason: 'not_configured' });
  try {
    const release = await getPublishedRelease();
    const hasFile = release && (release.source === 'github' ? release.github_asset : release.file_path);
    if (!hasFile) return send(res, 200, { available: false, reason: 'not_published' });
    send(res, 200, {
      available: true,
      release: {
        programName: release.program_name,
        version: release.version,
        os: release.os,
        installGuide: release.install_guide,
        changelog: release.changelog,
        terms: release.terms,
        isTest: release.is_test,
        fileSize: release.file_size,
        publishedAt: release.published_at
      }
    });
  } catch (error) {
    console.error(error);
    send(res, 200, { available: false, reason: 'error' });
  }
}
