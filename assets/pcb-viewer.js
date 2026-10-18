// PCB 3D Builder page (KO and EN): shows the published release and runs the member-only download flow.
(() => {
  'use strict';
  const EN = document.documentElement.lang === 'en';
  // After login, come back to the page in the same language (account pages are Korean only for now).
  const RETURN_PATH = EN ? '/en/pcb-viewer/#download' : '/pcb-viewer/#download';
  const triggers = [...document.querySelectorAll('[data-download-trigger]')];
  const notes = [...document.querySelectorAll('[data-download-note]')];
  const message = document.querySelector('[data-download-message]');
  const title = document.querySelector('[data-release-title]');
  const details = document.querySelector('[data-release-details]');
  const testBadge = document.querySelector('[data-release-test]');
  let available = false;
  let busy = false;

  const T = EN ? {
    download: 'Free download',
    note: 'Log in and register company info to download',
    checking: 'Checking download permission…',
    started: 'Your download is starting. For security, you have been logged out; log in again to download again.',
    loggedIn: 'You are logged in. Press the download button.'
  } : {
    download: '무료 다운로드',
    note: '회사 정보 등록 및 로그인 후 다운로드',
    checking: '다운로드 권한을 확인하고 있습니다…',
    started: '다운로드를 시작합니다. 보안을 위해 로그아웃되었습니다. 다시 받으려면 다시 로그인해 주세요.',
    loggedIn: '로그인되었습니다. 다운로드 버튼을 눌러 주세요.'
  };

  const ERRORS = EN ? {
    profile_incomplete: 'Company information is required. Taking you to the registration page.',
    not_in_test_allowlist: 'Only test accounts can download at the moment.',
    email_not_verified: 'Your email is not verified yet. Please log in again.',
    not_available: 'No installer is published at the moment.',
    file_unavailable: 'The installer could not be prepared. You are still logged in; please try again shortly or contact us by email.',
    not_configured: 'Member features are not connected yet.',
    network_error: 'The request failed because of a network error. Check your connection and try again.',
    server_error: 'A temporary error occurred. Please try again shortly.'
  } : {
    profile_incomplete: '회사 정보 등록이 필요합니다. 등록 화면으로 이동합니다.',
    not_in_test_allowlist: '지금은 테스트 계정만 다운로드할 수 있습니다.',
    email_not_verified: '이메일 인증이 끝나지 않았습니다. 다시 로그인해 주세요.',
    not_available: '현재 공개된 설치 파일이 없습니다.',
    file_unavailable: '설치 파일을 준비하지 못했습니다. 로그인은 그대로이니 잠시 후 다시 시도하거나 이메일로 문의해 주세요.',
    not_configured: '회원 기능이 아직 연결되지 않았습니다.',
    network_error: '네트워크 오류로 요청하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.',
    server_error: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  };

  function showMessage(text, kind = '') {
    if (!message) return;
    message.textContent = text;
    message.className = `pv-msg${kind ? ` is-${kind}` : ''}`;
    message.hidden = !text;
  }

  function formatSize(bytes) {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  function setAvailable(release) {
    available = true;
    for (const t of triggers) {
      t.textContent = T.download;
      t.removeAttribute('aria-disabled');
    }
    for (const n of notes) n.textContent = T.note;
    title.textContent = `${release.programName} ${release.version}`.trim();
    testBadge.hidden = !release.isTest;
    const values = { ...release, fileSize: formatSize(release.fileSize) };
    for (const dd of details.querySelectorAll('[data-release]')) {
      const value = values[dd.dataset.release];
      dd.textContent = value || '-';
    }
    details.hidden = false;
  }

  async function loadRelease() {
    try {
      const response = await fetch('/api/release', { cache: 'no-store' });
      const data = await response.json();
      if (data.available && data.release) setAvailable(data.release);
    } catch {
      // Keep the "다운로드 준비 중" state; never show a link that may not work.
    }
  }

  async function signOutHere() {
    const client = await Member.client();
    if (client) await client.auth.signOut({ scope: 'local' }).catch(() => {});
  }

  async function startDownload(event) {
    event.preventDefault();
    if (!available) {
      document.getElementById('download').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (busy) return;
    busy = true;
    showMessage(T.checking);
    try {
      const session = await Member.session();
      if (!session) {
        window.location.href = Member.accountUrl(RETURN_PATH);
        return;
      }
      const { ok, status, data } = await Member.api('/api/download', { method: 'POST' });
      if (ok && data.url) {
        // The server has already ended this login; clear it in the browser too.
        await signOutHere();
        showMessage(T.started, 'ok');
        window.location.href = data.url;
        return;
      }
      if (status === 401 || data.error === 'login_already_used') {
        await signOutHere();
        window.location.href = Member.accountUrl(RETURN_PATH, { reason: data.error === 'login_already_used' ? 'used' : 'expired' });
        return;
      }
      if (data.error === 'profile_incomplete') {
        showMessage(ERRORS.profile_incomplete);
        window.location.href = Member.accountUrl(RETURN_PATH);
        return;
      }
      showMessage(ERRORS[data.error] || ERRORS.server_error, 'error');
    } finally {
      busy = false;
    }
  }

  for (const t of triggers) t.addEventListener('click', startDownload);

  loadRelease().then(async () => {
    // Returning from login: point the visitor at the download button.
    if (available && location.hash === '#download' && await Member.session()) {
      showMessage(T.loggedIn, 'ok');
    }
  });
})();
