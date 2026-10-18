// Admin page: list releases, edit info, upload the installer to private storage, publish / unpublish.
// The page only renders what /api/admin allows; every action is re-checked on the server.
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const STATES = ['loading', 'unavailable', 'login', 'forbidden', 'main'];
  const FIELDS = ['programName', 'version', 'os', 'installGuide', 'changelog', 'terms', 'githubTag', 'githubAsset'];
  const STATUS_LABEL = { draft: '작성 중', published: '공개 중', unpublished: '비공개' };
  const ERRORS = {
    release_not_found: '해당 버전을 찾을 수 없습니다. 목록을 새로고침해 주세요.',
    unpublish_or_create_new_release: '공개 중인 버전의 파일은 바꿀 수 없습니다. 새 버전으로 등록해 주세요.',
    file_not_found: '업로드한 파일을 저장소에서 확인하지 못했습니다. 다시 업로드해 주세요.',
    cannot_delete_published: '공개 중인 버전은 삭제할 수 없습니다. 먼저 비공개로 전환하세요.',
    published_field_required: '공개 중인 버전의 필수 항목은 비울 수 없습니다.',
    github_release_has_no_upload: 'GitHub Releases 원본은 여기서 업로드하지 않습니다. 태그와 파일 이름을 입력하세요.',
    admin_only: '관리자 권한이 없습니다.',
    session_expired: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
    network_error: '네트워크 오류입니다. 연결을 확인해 주세요.'
  };

  let client = null;
  let bucket = 'viewer-releases';
  let releases = [];
  let editing = null; // release object being edited, or null for a new draft

  const show = (name) => { for (const s of STATES) $(`state-${s}`).hidden = s !== name; };
  function notice(text, kind = '') {
    const el = $('admin-notice');
    el.textContent = text;
    el.className = `pv-msg${kind ? ` is-${kind}` : ''}`;
    el.hidden = !text;
    if (text) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  const errorText = (data) => {
    if (data.error === 'publish_requirements') return `공개 전에 채워야 할 항목: ${data.missing.join(', ')}`;
    return ERRORS[data.error] || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  };
  const formatDate = (iso) => (iso ? new Date(iso).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '-');
  const formatSize = (bytes) => (bytes ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : '');

  async function call(action, body) {
    const result = await Member.api(`/api/admin?action=${action}`, body === undefined ? {} : { method: 'POST', body });
    if (result.status === 401) { show('login'); notice(ERRORS.session_expired, 'error'); }
    if (result.status === 403) show('forbidden');
    return result;
  }

  function renderList() {
    const rows = $('release-rows');
    rows.replaceChildren();
    $('release-empty').hidden = releases.length > 0;
    for (const r of releases) {
      const tr = document.createElement('tr');
      const cells = [
        null,
        `${r.programName || ''} ${r.version || '(버전 미입력)'}${r.isTest ? ' · 테스트' : ''}`,
        r.os || '-',
        r.source === 'github'
          ? `GitHub ${r.githubTag || '-'} · ${r.githubAsset || '-'}${r.fileSize ? ` ${formatSize(r.fileSize)}` : ''}`
          : (r.fileName ? `${r.fileName} ${formatSize(r.fileSize)}` : '없음'),
        formatDate(r.updatedAt)
      ];
      cells.forEach((value, i) => {
        const td = document.createElement('td');
        if (i === 0) {
          const chip = document.createElement('span');
          chip.className = `pv-status${r.status === 'published' ? ' is-published' : ''}`;
          chip.textContent = STATUS_LABEL[r.status] || r.status;
          td.append(chip);
        } else td.textContent = value;
        tr.append(td);
      });
      const td = document.createElement('td');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pv-link-button';
      button.textContent = '열기';
      button.addEventListener('click', () => openEditor(r));
      td.append(button);
      tr.append(td);
      rows.append(tr);
    }
  }

  async function refresh() {
    const { ok, data } = await call('list');
    if (!ok) return false;
    releases = data.releases;
    bucket = data.bucket || bucket;
    renderList();
    if (editing) {
      const fresh = releases.find((r) => r.id === editing.id);
      if (fresh) openEditor(fresh, true);
    }
    return true;
  }

  function openEditor(release, keepNotice) {
    editing = release;
    if (!keepNotice) notice('');
    $('editor').hidden = false;
    $('editor-title').textContent = release ? `${release.programName} ${release.version || ''}`.trim() : '새 버전 등록';
    $('editor-status').textContent = release ? STATUS_LABEL[release.status] : '저장 전';
    $('editor-status').className = `pv-status${release?.status === 'published' ? ' is-published' : ''}`;
    for (const f of FIELDS) $(`f-${f}`).value = release ? release[f] || '' : (f === 'programName' ? 'PCB 3D Builder' : '');
    $('f-isTest').checked = release ? release.isTest : false;
    $('f-source').value = release?.source || 'github';
    syncSource();
    $('f-file').value = '';
    $('file-current').textContent = release?.fileName ? `${release.fileName} (${formatSize(release.fileSize)})` : '등록된 파일 없음';
    const published = release?.status === 'published';
    $('f-file').disabled = !release || published;
    $('upload-file').disabled = !release || published;
    $('publish').disabled = !release || published;
    $('unpublish').disabled = !published;
    $('delete-release').disabled = !release || published;
    if (!keepNotice) $('editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // GitHub source: tag + asset name. Test upload: file area. Only the matching inputs are shown.
  function syncSource() {
    const github = $('f-source').value === 'github';
    $('github-fields').hidden = !github;
    $('file-area').hidden = github;
  }
  $('f-source').addEventListener('change', syncSource);

  $('new-release').addEventListener('click', () => openEditor(null));
  $('close-editor').addEventListener('click', () => { editing = null; $('editor').hidden = true; notice(''); });

  $('release-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = { isTest: $('f-isTest').checked, source: $('f-source').value };
    for (const f of FIELDS) body[f] = $(`f-${f}`).value;
    if (editing) body.id = editing.id;
    const { ok, data } = await call('save', body);
    if (!ok) return notice(errorText(data), 'error');
    // Re-render right away so upload/publish buttons are usable without waiting for the list reload.
    openEditor(data.release, true);
    notice('저장했습니다.', 'ok');
    await refresh();
  });

  $('upload-file').addEventListener('click', async () => {
    const file = $('f-file').files[0];
    if (!editing) return notice('먼저 정보를 저장해 주세요.', 'error');
    if (!file) return notice('업로드할 설치 파일을 선택해 주세요.', 'error');
    const progress = $('upload-progress');
    $('upload-file').disabled = true;
    progress.hidden = false;
    notice('업로드 중입니다. 창을 닫지 마세요.');
    try {
      const { ok, data } = await call('upload-url', { id: editing.id, fileName: file.name });
      if (!ok) return notice(errorText(data), 'error');
      const { error } = await client.storage.from(data.bucket || bucket).uploadToSignedUrl(data.path, data.token, file, {
        contentType: file.type || 'application/octet-stream'
      });
      if (error) return notice(`업로드에 실패했습니다. 기존 파일과 공개 버전은 그대로입니다. (${error.message})`, 'error');
      const attached = await call('attach-file', { id: editing.id, path: data.path, fileName: file.name });
      if (!attached.ok) return notice(errorText(attached.data), 'error');
      editing = attached.data.release;
      notice('파일을 등록했습니다. 내용을 확인한 뒤 ‘공개’를 누르세요.', 'ok');
      await refresh();
    } finally {
      progress.hidden = true;
      $('upload-file').disabled = !editing || editing.status === 'published';
    }
  });

  $('publish').addEventListener('click', async () => {
    if (!editing) return;
    if (!window.confirm('이 버전을 공개할까요? 현재 공개 중인 버전이 있으면 비공개로 바뀝니다.')) return;
    const { ok, data } = await call('publish', { id: editing.id });
    if (!ok) return notice(errorText(data), 'error');
    editing = data.release;
    notice('공개했습니다. 다운로드 페이지에 반영되었습니다.', 'ok');
    await refresh();
  });

  $('unpublish').addEventListener('click', async () => {
    if (!editing) return;
    if (!window.confirm('비공개로 전환하면 다운로드 페이지가 ‘다운로드 준비 중’으로 바뀝니다. 계속할까요?')) return;
    const { ok, data } = await call('unpublish', { id: editing.id });
    if (!ok) return notice(errorText(data), 'error');
    editing = data.release;
    notice('비공개로 전환했습니다.', 'ok');
    await refresh();
  });

  $('delete-release').addEventListener('click', async () => {
    if (!editing) return;
    if (!window.confirm('이 버전과 업로드한 파일을 삭제할까요? 되돌릴 수 없습니다.')) return;
    const { ok, data } = await call('delete', { id: editing.id });
    if (!ok) return notice(errorText(data), 'error');
    editing = null;
    $('editor').hidden = true;
    notice('삭제했습니다.', 'ok');
    await refresh();
  });

  (async () => {
    client = await Member.client();
    if (!client) return show('unavailable');
    if (!(await Member.session())) return show('login');
    const me = await call('me');
    if (!me.ok) {
      if (me.status !== 401 && me.status !== 403) show('unavailable');
      if (me.data.error === 'not_in_test_allowlist') show('forbidden');
      return;
    }
    $('admin-who').textContent = `관리자: ${me.data.email}`;
    show('main');
    await refresh();
  })();
})();
