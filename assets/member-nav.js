// Header "로그인" / "Log in" link reads "내 계정" / "My account" when a member session is stored in this browser.
// Display only: access is always checked by the server.
(() => {
  'use strict';
  let signedIn = false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      if (/^sb-.+-auth-token$/.test(localStorage.key(i))) { signedIn = true; break; }
    }
  } catch { /* storage blocked */ }
  if (!signedIn) return;
  for (const link of document.querySelectorAll('.header-login, .header-login-mobile')) {
    link.firstChild.textContent = document.documentElement.lang === 'en' ? 'My account' : '내 계정';
  }
})();
