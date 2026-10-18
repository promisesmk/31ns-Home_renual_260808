// Admin-only release management. Admin rights come from the site_admins table, which only the operator can edit.
// One function with ?action= keeps the deployment well under the serverless function limit.
import {
  BUCKET, db, deliveryWorkerUrl, githubAsset, githubConfigured, handle, requireAdmin, send, text
} from './_lib/server.js';

const FIELDS = {
  programName: ['program_name', 80],
  version: ['version', 40],
  os: ['os', 120],
  installGuide: ['install_guide', 4000],
  changelog: ['changelog', 4000],
  terms: ['terms', 8000],
  githubTag: ['github_tag', 100],
  githubAsset: ['github_asset', 200]
};
const REQUIRED_TO_PUBLISH = {
  program_name: '프로그램명',
  version: '버전',
  os: '운영체제',
  install_guide: '설치 안내',
  terms: '사용 조건'
};

function safeFileName(name) {
  const cleaned = String(name || '').normalize('NFKC').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^[._]+/, '');
  return cleaned.slice(-120) || 'installer.bin';
}

async function loadRelease(id) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id || ''))) return null;
  const { data, error } = await db().from('viewer_releases').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function fileInfo(path) {
  const { data, error } = await db().storage.from(BUCKET).info(path);
  if (error || !data) return null;
  const size = Number(data.size ?? data.metadata?.size ?? 0);
  return { size };
}

function toClient(r) {
  return {
    id: r.id,
    programName: r.program_name,
    version: r.version,
    os: r.os,
    installGuide: r.install_guide,
    changelog: r.changelog,
    terms: r.terms,
    source: r.source,
    githubTag: r.github_tag,
    githubAsset: r.github_asset,
    isTest: r.is_test,
    fileName: r.file_name,
    fileSize: r.file_size,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    publishedAt: r.published_at
  };
}

const actions = {
  async me(req, res, user) {
    send(res, 200, { admin: true, email: user.email });
  },

  async list(req, res) {
    const { data, error } = await db().from('viewer_releases').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    send(res, 200, { releases: data.map(toClient), bucket: BUCKET });
  },

  // Create a draft (no id) or update an existing release's text fields.
  async save(req, res) {
    const body = req.body || {};
    const row = { updated_at: new Date().toISOString() };
    for (const [key, [column, max]] of Object.entries(FIELDS)) {
      if (key in body) row[column] = text(body[key], max);
    }
    if ('isTest' in body) row.is_test = Boolean(body.isTest);
    if ('source' in body) row.source = body.source === 'github' ? 'github' : 'storage';

    if (!body.id) {
      const { data, error } = await db().from('viewer_releases').insert(row).select('*').single();
      if (error) throw error;
      return send(res, 200, { release: toClient(data) });
    }
    const existing = await loadRelease(body.id);
    if (!existing) return send(res, 404, { error: 'release_not_found' });
    if (existing.status === 'published') {
      for (const column of Object.keys(REQUIRED_TO_PUBLISH)) {
        if (column in row && !row[column]) return send(res, 400, { error: 'published_field_required', field: column });
      }
    }
    const { data, error } = await db().from('viewer_releases').update(row).eq('id', existing.id).select('*').single();
    if (error) throw error;
    send(res, 200, { release: toClient(data) });
  },

  // Issues a one-time signed upload URL into the private bucket. The public release is untouched.
  async 'upload-url'(req, res) {
    const release = await loadRelease(req.body?.id);
    if (!release) return send(res, 404, { error: 'release_not_found' });
    if (release.source === 'github') return send(res, 409, { error: 'github_release_has_no_upload' });
    if (release.status === 'published') return send(res, 409, { error: 'unpublish_or_create_new_release' });
    const path = `${release.id}/${Date.now()}-${safeFileName(req.body?.fileName)}`;
    const { data, error } = await db().storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw error || new Error('createSignedUploadUrl failed');
    send(res, 200, { path: data.path, token: data.token, bucket: BUCKET });
  },

  // Called after the browser finished uploading: verifies the object really exists before linking it.
  async 'attach-file'(req, res) {
    const release = await loadRelease(req.body?.id);
    if (!release) return send(res, 404, { error: 'release_not_found' });
    if (release.status === 'published') return send(res, 409, { error: 'unpublish_or_create_new_release' });
    const path = String(req.body?.path || '');
    if (!path.startsWith(`${release.id}/`) || path.includes('..')) return send(res, 400, { error: 'invalid_path' });
    const info = await fileInfo(path);
    if (!info || info.size <= 0) return send(res, 400, { error: 'file_not_found' });

    const fileName = safeFileName(req.body?.fileName || path.split('/').pop());
    const { data, error } = await db().from('viewer_releases')
      .update({ file_path: path, file_name: fileName, file_size: info.size, updated_at: new Date().toISOString() })
      .eq('id', release.id).select('*').single();
    if (error) throw error;
    // Remove the file this release pointed to before, only after the new one is linked.
    if (release.file_path && release.file_path !== path) {
      await db().storage.from(BUCKET).remove([release.file_path]);
    }
    send(res, 200, { release: toClient(data) });
  },

  async publish(req, res) {
    const release = await loadRelease(req.body?.id);
    if (!release) return send(res, 404, { error: 'release_not_found' });
    const missing = Object.entries(REQUIRED_TO_PUBLISH)
      .filter(([column]) => !String(release[column] || '').trim())
      .map(([, label]) => label);
    let fileUpdate = null;
    if (release.source === 'github') {
      if (!githubConfigured()) missing.push('GitHub Releases 연결(서버 설정)');
      if (!deliveryWorkerUrl()) missing.push('다운로드 전달 서버(Worker) 설정');
      if (!release.github_tag) missing.push('GitHub 태그');
      if (!release.github_asset) missing.push('설치 파일 이름');
      if (githubConfigured() && release.github_tag && release.github_asset) {
        const asset = await githubAsset(release.github_tag, release.github_asset);
        if (!asset) missing.push('설치 파일(GitHub Releases에서 찾을 수 없음)');
        else fileUpdate = { file_name: asset.name, file_size: asset.size };
      }
    } else if (!release.file_path) missing.push('설치 파일');
    else if (!(await fileInfo(release.file_path))) missing.push('설치 파일(저장소에서 찾을 수 없음)');
    if (missing.length) return send(res, 400, { error: 'publish_requirements', missing });
    if (fileUpdate) {
      const { error: e } = await db().from('viewer_releases').update(fileUpdate).eq('id', release.id);
      if (e) throw e;
    }

    const { error } = await db().rpc('publish_viewer_release', { target: release.id });
    if (error) throw error;
    send(res, 200, { release: toClient(await loadRelease(release.id)) });
  },

  async unpublish(req, res) {
    const release = await loadRelease(req.body?.id);
    if (!release) return send(res, 404, { error: 'release_not_found' });
    const { data, error } = await db().from('viewer_releases')
      .update({ status: 'unpublished', updated_at: new Date().toISOString() })
      .eq('id', release.id).select('*').single();
    if (error) throw error;
    send(res, 200, { release: toClient(data) });
  },

  async delete(req, res) {
    const release = await loadRelease(req.body?.id);
    if (!release) return send(res, 404, { error: 'release_not_found' });
    if (release.status === 'published') return send(res, 409, { error: 'cannot_delete_published' });
    if (release.file_path) await db().storage.from(BUCKET).remove([release.file_path]);
    const { error } = await db().from('viewer_releases').delete().eq('id', release.id);
    if (error) throw error;
    send(res, 200, { deleted: release.id });
  }
};

export default handle(['GET', 'POST'], async (req, res) => {
  const action = String(req.query?.action || '');
  const run = actions[action];
  if (!run) return send(res, 404, { error: 'unknown_action' });
  if ((action === 'me' || action === 'list') !== (req.method === 'GET')) return send(res, 405, { error: 'method_not_allowed' });
  const user = await requireAdmin(req, res);
  if (!user) return;
  await run(req, res, user);
});
