// Account page: email + password sign-in (Supabase Auth), sign-up with one-time email confirmation,
// password reset / first-time password for accounts created by email link, company info, sign-out.
// Passwords go only to Supabase Auth from the browser; they never reach our API, database or logs.
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const STATES = ['loading', 'unavailable', 'login', 'signup', 'forgot', 'sent', 'password', 'profile', 'done', 'blocked'];
  const RESEND_COOLDOWN_SECONDS = 60;
  const ACCOUNT_PATH = '/account/';

  const params = new URLSearchParams(location.search);
  const hasNext = params.has('next');
  const next = Member.safeNext(params.get('next'), '/pcb-viewer/#download');
  const hash = new URLSearchParams(location.hash.slice(1));
  const fromRecovery = hash.get('type') === 'recovery' || params.get('mode') === 'recovery';

  let client = null;
  let justSignedIn = Boolean(hash.get('access_token'));
  let current = null; // profile response from /api/profile
  let user = null; // Supabase user of the current session
  let sent = { kind: '', email: '' };

  function show(name) {
    for (const s of STATES) $(`state-${s}`).hidden = s !== name;
  }

  function notice(text, kind = '') {
    const el = $('account-notice');
    el.textContent = text;
    el.className = `pv-msg${kind ? ` is-${kind}` : ''}`;
    el.hidden = !text;
  }

  function setBusy(form, busy) {
    for (const el of form.querySelectorAll('button, input, textarea')) {
      if (el.readOnly) continue;
      el.disabled = busy;
    }
  }

  const accountUrl = (extra = {}) => {
    const q = new URLSearchParams({ ...extra, next });
    return `${location.origin}${ACCOUNT_PATH}?${q}`;
  };

  function validEmail(input) {
    const email = input.value.trim();
    if (!email || !input.checkValidity()) {
      notice('올바른 이메일 주소를 입력해 주세요.', 'error');
      input.focus();
      return '';
    }
    return email;
  }

  function validNewPassword(pw, pw2, focusEl) {
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) {
      notice('비밀번호는 8자 이상이며 영문과 숫자를 함께 포함해야 합니다.', 'error');
      focusEl.focus();
      return false;
    }
    if (pw !== pw2) {
      notice('비밀번호 확인이 일치하지 않습니다.', 'error');
      return false;
    }
    return true;
  }

  // Maps Supabase Auth errors to messages. Never echoes the password.
  function authError(error, fallback) {
    const code = error?.code || '';
    if (error?.status === 429 || code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') {
      return '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.';
    }
    const messages = {
      invalid_credentials: '이메일 또는 비밀번호가 맞지 않습니다.',
      email_not_confirmed: '가입 이메일 인증이 아직 끝나지 않았습니다. 받은 메일의 링크를 눌러 주세요.',
      weak_password: '더 안전한 비밀번호를 사용해 주세요. (8자 이상, 영문과 숫자 포함)',
      same_password: '기존 비밀번호와 다른 비밀번호를 입력해 주세요.',
      reauthentication_needed: '보안을 위해 비밀번호 재설정 메일로 진행해 주세요.',
      email_address_not_authorized: '현재 테스트 기간이라 허용된 주소로만 메일을 보낼 수 있습니다.',
      email_address_invalid: '이 이메일 주소로는 가입할 수 없습니다. 다른 주소를 사용해 주세요.',
      signup_disabled: '지금은 신규 가입을 받지 않습니다.'
    };
    return messages[code] || fallback;
  }

  // Errors from an expired or reused email link come back in the URL hash.
  if (hash.get('error') || hash.get('error_code')) {
    notice(hash.get('error_code') === 'otp_expired'
      ? '메일 링크가 만료되었거나 이미 사용되었습니다. 메일을 다시 받아 주세요.'
      : '인증에 실패했습니다. 다시 시도해 주세요.', 'error');
    history.replaceState(null, '', location.pathname + location.search);
  } else if (params.get('reason') === 'expired') {
    notice('로그인이 만료되었습니다. 다시 로그인해 주세요.');
  } else if (params.get('reason') === 'used') {
    notice('이 로그인으로는 이미 다운로드를 요청했습니다. 다시 받으려면 다시 로그인해 주세요.');
  }

  const doneNext = $('done-next');
  doneNext.href = next;
  if (next.startsWith('/admin')) doneNext.textContent = '관리 화면으로';

  function fillProfile(data, editing) {
    const p = data.profile || {};
    $('profile-email').value = data.email || '';
    $('profile-company').value = p.company || '';
    $('profile-contact').value = p.contact_name || '';
    $('profile-job').value = p.job_title || '';
    $('profile-purpose').value = p.purpose || '';
    $('profile-title').textContent = editing ? '회사 정보 수정' : '회사 정보 등록';
    $('cancel-edit').hidden = !editing;
  }

  function fillDone(data) {
    const p = data.profile || {};
    $('done-email').textContent = data.email || '';
    $('done-company').textContent = p.company || '';
    $('done-contact').textContent = p.contact_name || '';
    $('done-job').textContent = p.job_title || '-';
    $('done-purpose').textContent = p.purpose || '-';
    // Accounts made by email link before passwords existed have no password yet.
    $('password-missing').hidden = Boolean(user?.user_metadata?.password_set);
  }

  function showPasswordForm(mode) {
    const titles = {
      recovery: ['새 비밀번호 설정', '앞으로 로그인할 때 사용할 비밀번호를 정해 주세요. 계정과 회사 정보는 그대로 유지됩니다.'],
      set: ['비밀번호 설정', '다음 로그인부터 이메일과 비밀번호로 로그인할 수 있습니다.'],
      change: ['비밀번호 변경', '새 비밀번호를 입력해 주세요.']
    };
    $('password-title').textContent = titles[mode][0];
    $('password-intro').textContent = titles[mode][1];
    $('password-username').value = user?.email || '';
    $('new-password').value = '';
    $('new-password2').value = '';
    $('cancel-password').hidden = mode === 'recovery';
    show('password');
    $('new-password').focus();
  }

  async function afterSignIn() {
    const { ok, status, data } = await Member.api('/api/profile');
    if (status === 401) {
      notice('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      return show('login');
    }
    if (data.error === 'not_in_test_allowlist') return show('blocked');
    if (!ok) {
      notice('회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', 'error');
      return show('login');
    }
    current = data;
    if (!data.complete) {
      fillProfile(data, false);
      return show('profile');
    }
    if (justSignedIn && hasNext) return location.replace(next);
    fillDone(data);
    show('done');
  }

  let cooldownTimer;
  function startCooldown(button, label) {
    let left = RESEND_COOLDOWN_SECONDS;
    button.disabled = true;
    clearInterval(cooldownTimer);
    const tick = () => {
      button.textContent = left > 0 ? `${label} (${left}초)` : label;
      if (left-- <= 0) { button.disabled = false; clearInterval(cooldownTimer); }
    };
    tick();
    cooldownTimer = setInterval(tick, 1000);
  }

  function showSent(kind, email) {
    sent = { kind, email };
    $('sent-message').textContent = kind === 'signup'
      ? `${email}(으)로 가입 인증 메일을 보냈습니다. 메일의 링크를 누르면 인증이 끝나고 이 화면으로 돌아옵니다. 이미 가입된 이메일이라면 메일이 오지 않으니 로그인하거나 비밀번호 재설정을 이용해 주세요.`
      : `${email}(으)로 비밀번호 설정 링크를 보냈습니다(가입된 이메일인 경우). 메일의 링크를 누르면 새 비밀번호를 정하는 화면이 열립니다.`;
    show('sent');
    startCooldown($('resend-sent'), '메일 다시 받기');
  }

  const sendSignupConfirmation = (email) =>
    client.auth.resend({ type: 'signup', email, options: { emailRedirectTo: accountUrl() } });
  const sendRecovery = (email) =>
    client.auth.resetPasswordForEmail(email, { redirectTo: accountUrl({ mode: 'recovery' }) });

  // ---- navigation between login / sign-up / reset ----
  for (const button of document.querySelectorAll('[data-go]')) {
    button.addEventListener('click', () => {
      const typed = $('login-email').value.trim() || $('signup-email').value.trim() || $('forgot-email').value.trim();
      notice('');
      $('resend-confirm-area').hidden = true;
      show(button.dataset.go);
      const field = { login: 'login-email', signup: 'signup-email', forgot: 'forgot-email' }[button.dataset.go];
      if (field) {
        if (typed && !$(field).value) $(field).value = typed;
        $(field).focus();
      }
    });
  }

  $('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = validEmail($('login-email'));
    if (!email) return;
    const password = $('login-password').value;
    if (!password) {
      notice('비밀번호를 입력해 주세요.', 'error');
      return $('login-password').focus();
    }
    setBusy(event.target, true);
    notice('');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    setBusy(event.target, false);
    if (error) {
      $('login-password').value = '';
      $('resend-confirm-area').hidden = error.code !== 'email_not_confirmed';
      return notice(authError(error, '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.'), 'error');
    }
    user = data.user;
    $('login-password').value = '';
    justSignedIn = true;
    afterSignIn();
  });

  $('resend-confirm').addEventListener('click', async () => {
    const email = validEmail($('login-email'));
    if (!email) return;
    const { error } = await sendSignupConfirmation(email);
    if (error) return notice(authError(error, '인증 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.'), 'error');
    notice('');
    $('resend-confirm-area').hidden = true;
    showSent('signup', email);
  });

  $('signup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = validEmail($('signup-email'));
    if (!email) return;
    const password = $('signup-password').value;
    if (!validNewPassword(password, $('signup-password2').value, $('signup-password'))) return;
    setBusy(event.target, true);
    notice('');
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: accountUrl(), data: { password_set: true } }
    });
    setBusy(event.target, false);
    $('signup-password').value = '';
    $('signup-password2').value = '';
    if (error) return notice(authError(error, '가입하지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요.'), 'error');
    if (data.session) { // only if email confirmation were turned off
      user = data.user;
      justSignedIn = true;
      return afterSignIn();
    }
    showSent('signup', email);
  });

  $('forgot-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = validEmail($('forgot-email'));
    if (!email) return;
    setBusy(event.target, true);
    notice('');
    const { error } = await sendRecovery(email);
    setBusy(event.target, false);
    if (error) return notice(authError(error, '메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.'), 'error');
    showSent('recovery', email);
  });

  $('resend-sent').addEventListener('click', async () => {
    if (!sent.email) return show('login');
    const { error } = sent.kind === 'signup' ? await sendSignupConfirmation(sent.email) : await sendRecovery(sent.email);
    if (error) return notice(authError(error, '메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.'), 'error');
    notice('메일을 다시 보냈습니다.', 'ok');
    startCooldown($('resend-sent'), '메일 다시 받기');
  });

  $('password-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = $('new-password').value;
    if (!validNewPassword(password, $('new-password2').value, $('new-password'))) return;
    setBusy(event.target, true);
    const { data, error } = await client.auth.updateUser({ password, data: { password_set: true } });
    setBusy(event.target, false);
    $('new-password').value = '';
    $('new-password2').value = '';
    if (error) {
      notice(authError(error, '비밀번호를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'), 'error');
      if (error.code === 'reauthentication_needed') show('forgot');
      return;
    }
    user = data.user;
    notice('비밀번호를 저장했습니다. 다음부터 이메일과 비밀번호로 로그인하세요.', 'ok');
    if (params.get('mode') === 'recovery') {
      params.delete('mode');
      history.replaceState(null, '', `${location.pathname}?${params}`);
    }
    afterSignIn();
  });

  $('cancel-password').addEventListener('click', () => {
    notice('');
    if (current) { fillDone(current); show('done'); } else show('login');
  });
  $('set-password-now').addEventListener('click', () => { notice(''); showPasswordForm('set'); });
  $('change-password').addEventListener('click', () => {
    notice('');
    showPasswordForm(user?.user_metadata?.password_set ? 'change' : 'set');
  });

  $('profile-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = {
      company: $('profile-company').value.trim(),
      contactName: $('profile-contact').value.trim(),
      jobTitle: $('profile-job').value.trim(),
      purpose: $('profile-purpose').value.trim()
    };
    if (!body.company || !body.contactName) {
      notice('회사명과 담당자명은 꼭 입력해 주세요.', 'error');
      return (body.company ? $('profile-contact') : $('profile-company')).focus();
    }
    setBusy(event.target, true);
    const { ok, status, data } = await Member.api('/api/profile', { method: 'PUT', body });
    setBusy(event.target, false);
    if (status === 401) {
      notice('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      return show('login');
    }
    if (!ok) {
      notice('저장하지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요.', 'error');
      return;
    }
    current = data;
    if (hasNext && $('cancel-edit').hidden) return location.replace(next);
    notice('회사 정보를 저장했습니다.', 'ok');
    fillDone(data);
    show('done');
  });

  $('edit-profile').addEventListener('click', () => {
    if (!current) return;
    notice('');
    fillProfile(current, true);
    show('profile');
  });

  $('cancel-edit').addEventListener('click', () => {
    notice('');
    show('done');
  });

  async function signOut() {
    current = null;
    user = null;
    await client.auth.signOut();
    notice('로그아웃되었습니다.', 'ok');
    show('login');
  }
  $('sign-out').addEventListener('click', signOut);
  $('blocked-sign-out').addEventListener('click', signOut);

  (async () => {
    client = await Member.client();
    if (!client) return show('unavailable');
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        user = session.user;
        showPasswordForm('recovery');
      }
      // A refresh that fails (expired session) also ends here.
      if (event === 'SIGNED_OUT' && current) {
        current = null;
        user = null;
        notice('로그인이 만료되었거나 로그아웃되었습니다. 다시 로그인해 주세요.');
        show('login');
      }
    });
    const session = await Member.session();
    if (fromRecovery) {
      if (session) {
        user = session.user;
        return showPasswordForm('recovery');
      }
      if (!$('account-notice').textContent) notice('비밀번호 설정 링크가 만료되었거나 이미 사용되었습니다. 메일을 다시 받아 주세요.', 'error');
      return show('forgot');
    }
    if (!session) return show(params.get('mode') === 'signup' ? 'signup' : 'login');
    user = session.user;
    afterSignIn();
  })();
})();
