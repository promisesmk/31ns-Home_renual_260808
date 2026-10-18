// PCB 3D Builder page (KO and EN): shows the latest release, takes a question / use case in exchange for a
// one-time download code, and posts the code to the download server. Server: workers/pcb3d-api.
(() => {
  'use strict';
  const EN = document.documentElement.lang === 'en';
  const CONFIG = window.PCB3D_CONFIG || {};
  const API = CONFIG.api;
  const configured = API && !API.includes('REPLACE_ME');

  const area = document.querySelector('.pv-download[data-download-area]');
  if (!area) return;
  const title = area.querySelector('[data-release-title]');
  const details = area.querySelector('[data-release-details]');
  const manualLink = area.querySelector('[data-manual-link]');
  const requestForm = area.querySelector('[data-request-form]');
  const submitButton = area.querySelector('[data-request-submit]');
  const codeResult = area.querySelector('[data-code-result]');
  const codeValue = area.querySelector('[data-code-value]');
  const redeemForm = area.querySelector('[data-redeem-form]');
  const message = area.querySelector('[data-download-message]');
  const turnstileBox = area.querySelector('[data-turnstile]');

  const T = EN ? {
    notConfigured: 'Download is being prepared. Please check back soon or contact us by email.',
    sending: 'Sending…',
    issued: 'Your download code is ready. Press "Download installer" below to start.',
    checking: 'Checking the code…',
    starting: 'Your download is starting. It is about 180 MB, so it may take a few minutes.',
    used: 'This code has already been used. Leave a new request to get a new code.',
    expired: 'This code has expired (24 hours). Leave a new request to get a new code.',
    unknown: 'This code was not found. Check it and try again.',
    format: 'Enter the 8-character code, e.g. AB2C-D3EF.'
  } : {
    notConfigured: '다운로드를 준비하고 있습니다. 잠시 후 다시 방문하시거나 이메일로 문의해 주세요.',
    sending: '보내는 중…',
    issued: '다운로드 코드가 발급되었습니다. 아래 [설치 파일 다운로드]를 누르면 바로 받을 수 있습니다.',
    checking: '코드를 확인하고 있습니다…',
    starting: '다운로드를 시작합니다. 약 180MB라 몇 분 걸릴 수 있습니다.',
    used: '이미 사용한 코드입니다. 새로 신청하면 새 코드를 받을 수 있습니다.',
    expired: '유효 시간(24시간)이 지난 코드입니다. 새로 신청하면 새 코드를 받을 수 있습니다.',
    unknown: '코드를 찾을 수 없습니다. 다시 확인해 주세요.',
    format: '8자리 코드를 입력해 주세요. 예: AB2C-D3EF'
  };

  const ERRORS = EN ? {
    invalid_email: 'Please check your email address.',
    invalid_company: 'Please enter your company name (or "Personal").',
    title_too_short: 'Please enter a title of at least 4 characters.',
    body_too_short: 'Please write at least 30 characters so we can understand your question or use case.',
    consent_required: 'Please agree to the collection and use of personal information.',
    captcha_failed: 'The spam check failed. Please wait a moment and try again.',
    rate_limited: 'Too many requests today. Please try again tomorrow or contact us by email.',
    not_available: 'No installer is available at the moment. Please try again later.',
    network_error: 'The request failed because of a network error. Check your connection and try again.',
    server_error: 'A temporary error occurred. Please try again shortly.'
  } : {
    invalid_email: '이메일 주소를 확인해 주세요.',
    invalid_company: "회사명을 입력해 주세요. 개인이면 '개인'이라고 적어 주세요.",
    title_too_short: '제목을 4자 이상 입력해 주세요.',
    body_too_short: '질문이나 사용 목적을 30자 이상 적어 주세요.',
    consent_required: '개인정보 수집 · 이용에 동의해 주세요.',
    captcha_failed: '스팸 방지 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    rate_limited: '오늘 신청 가능한 횟수를 넘었습니다. 내일 다시 시도하시거나 이메일로 문의해 주세요.',
    not_available: '지금은 받을 수 있는 설치 파일이 없습니다. 잠시 후 다시 시도해 주세요.',
    network_error: '네트워크 오류로 요청하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.',
    server_error: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  };

  let turnstileWidget = null;

  function showMessage(text, kind = '') {
    message.textContent = text;
    message.className = `pv-msg${kind ? ` is-${kind}` : ''}`;
    message.hidden = !text;
  }

  function formatSize(bytes) {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  function normalizeCode(value) {
    const raw = String(value || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : null;
  }

  function setEnabled(enabled) {
    for (const el of area.querySelectorAll('input, select, textarea, button')) el.disabled = !enabled;
  }

  async function api(path, body) {
    try {
      const res = await fetch(API + path, {
        method: body ? 'POST' : 'GET',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
      return { ok: res.ok, data: await res.json().catch(() => ({})) };
    } catch {
      return { ok: false, data: { error: 'network_error' } };
    }
  }

  async function loadRelease() {
    const { ok, data } = await api('/api/release');
    if (!ok || !data.available) {
      showMessage(T.notConfigured);
      setEnabled(false);
      return;
    }
    const version = String(data.tag || '').replace(/^v/i, '');
    title.textContent = `PCB 3D Builder ${version}`.trim();
    details.querySelector('[data-release="version"]').textContent = version || '-';
    details.querySelector('[data-release="size"]').textContent = formatSize(data.installer?.size);
    if (data.manual) manualLink.href = `${API}/manual`;
    else manualLink.closest('dd').textContent = '-';
    details.hidden = false;
  }

  function loadTurnstile() {
    if (!CONFIG.turnstileSiteKey || CONFIG.turnstileSiteKey.includes('REPLACE_ME')) return;
    window.pcb3dTurnstileReady = () => {
      turnstileWidget = window.turnstile.render(turnstileBox, {
        sitekey: CONFIG.turnstileSiteKey, language: EN ? 'en' : 'ko', appearance: 'interaction-only'
      });
    };
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=pcb3dTurnstileReady&render=explicit';
    script.async = true;
    document.head.appendChild(script);
  }

  async function submitRequest(event) {
    event.preventDefault();
    const form = new FormData(requestForm);
    const payload = {
      lang: EN ? 'en' : 'ko',
      category: form.get('category'),
      title: String(form.get('title') || '').trim(),
      body: String(form.get('body') || '').trim(),
      email: String(form.get('email') || '').trim(),
      company: String(form.get('company') || '').trim(),
      website: String(form.get('website') || ''),
      consentPrivacy: form.get('consentPrivacy') === 'on',
      consentPublish: form.get('consentPublish') === 'on',
      turnstileToken: turnstileWidget !== null ? window.turnstile.getResponse(turnstileWidget) : ''
    };
    // Same checks as the server, so most mistakes are caught before sending.
    const local = !payload.email.includes('@') ? 'invalid_email'
      : !payload.company ? 'invalid_company'
        : payload.title.length < 4 ? 'title_too_short'
          : payload.body.replace(/\s/g, '').length < 30 ? 'body_too_short'
            : !payload.consentPrivacy ? 'consent_required' : null;
    if (local) {
      showMessage(ERRORS[local], 'error');
      return;
    }

    submitButton.disabled = true;
    const label = submitButton.textContent;
    submitButton.textContent = T.sending;
    const { ok, data } = await api('/api/request', payload);
    submitButton.disabled = false;
    submitButton.textContent = label;
    if (turnstileWidget !== null) window.turnstile.reset(turnstileWidget);

    if (!ok || !data.code) {
      showMessage(ERRORS[data.error] || ERRORS.server_error, 'error');
      return;
    }
    requestForm.hidden = true;
    codeValue.textContent = data.code;
    codeResult.hidden = false;
    redeemForm.elements.code.value = data.code;
    showMessage(T.issued, 'ok');
    codeResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function submitRedeem(event) {
    event.preventDefault();
    const code = normalizeCode(redeemForm.elements.code.value);
    if (!code) {
      showMessage(T.format, 'error');
      return;
    }
    redeemForm.elements.code.value = code;
    showMessage(T.checking);
    // Check first so wrong / used codes get a message here instead of an error page.
    const { ok, data } = await api('/api/code-check', { code });
    if (!ok) {
      showMessage(ERRORS[data.error] || ERRORS.server_error, 'error');
      return;
    }
    if (data.state !== 'valid') {
      showMessage(T[data.state] || T.unknown, 'error');
      return;
    }
    showMessage(T.starting, 'ok');
    // A regular form post: the browser downloads the file and stays on this page.
    redeemForm.action = `${API}/download`;
    redeemForm.submit();
  }

  if (!configured) {
    showMessage(T.notConfigured);
    setEnabled(false);
    return;
  }
  requestForm.addEventListener('submit', submitRequest);
  redeemForm.addEventListener('submit', submitRedeem);
  loadRelease();
  loadTurnstile();
})();
