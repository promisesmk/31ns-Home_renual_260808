// "Back to main" for the sub pages reached from the main page (KO/EN): technical blog, RF Q&A,
// 2.4GHz development and case studies. Loaded on both main pages and on those sub pages.
//
// A sub-page visit counts as a "trip" only when it was started by a plain same-tab click on a link
// of the main page to one of these pages (or continued by such a click between them, same language):
// - the click writes a one-time ticket (sessionStorage: from, to, depth, time),
// - the page it opens accepts the ticket only if its own path, the referrer and the age match,
//   then stores { main, depth } in history.state. history.state belongs to that history entry,
//   so it survives reload and back/forward, and a typed URL, a bookmark, an external link or a
//   new tab never has it.
// The button then goes back exactly `depth` entries with history.go(), which lands on the main
// page entry it came from; the browser restores the scroll position itself (bfcache or its own
// restoration). Without a trip the button is a normal link to the main page's technical resources section
// (also without JavaScript); with JavaScript the section is then shown in place.
// On the main page the scroll position is kept in history.state too. It is used only when the
// browser comes back to that entry without bfcache and its own restoration is off by more than a
// few pixels (late layout): a few corrections at most, stopped as soon as the visitor scrolls.
(() => {
  'use strict';
  const KEY = '31ns.mainTrip';
  const TICKET_MAX_AGE = 10 * 60 * 1000;
  const SECTION = 'technical-resources-section';
  const EN = location.pathname === '/en/' || location.pathname.startsWith('/en/');
  const MAIN = EN ? '/en/' : '/';
  // pages a trip may visit: '…/' covers the whole folder (blog list and articles), a file name only itself
  const TRIP_PAGES = [MAIN + 'blog/', MAIN + 'rf-faq/', MAIN + '2.4ghz.html', MAIN + 'cases/'];
  const isTripPage = (p) => TRIP_PAGES.some((t) => (t.endsWith('/') ? p.startsWith(t) : p === t));
  const path = location.pathname.replace(/index\.html$/, '');
  const onMain = path === MAIN;
  const onSub = isTripPage(path);
  if (!onMain && !onSub) return;

  const storage = {
    read() { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } },
    write(v) { try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage blocked: links still work */ } },
    clear() { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } }
  };
  const state = () => (history.state && typeof history.state === 'object' ? history.state : {});
  const setState = (extra) => {
    try { history.replaceState({ ...state(), ...extra }, ''); } catch { /* ignore */ }
  };

  // Same-tab link to a same-language trip page? (plain left click, no new window, no download)
  function tripTarget(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
    const a = event.target.closest?.('a[href]');
    if (!a || a.hasAttribute('download') || (a.target && a.target !== '_self')) return null;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return null;
    const to = url.pathname.replace(/index\.html$/, '');
    if (!isTripPage(to) || to === path) return null; // in-page anchors are not a new page
    return to;
  }

  const navType = () => performance.getEntriesByType?.('navigation')[0]?.type;

  if (onMain) {
    document.addEventListener('click', (event) => {
      const to = tripTarget(event);
      if (!to) return;
      setState({ mainReturnY: Math.round(scrollY) });
      storage.write({ from: path, to, main: path, depth: 1, at: Date.now() });
    });

    // Keeps the page at want() while the layout settles: checked on load and on layout changes for
    // a short while, at most a few corrections, and never after the visitor starts scrolling.
    const hold = (want, { now = false } = {}) => {
      let tries = 0;
      let stopped = false;
      const inputs = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
      const stop = () => { stopped = true; inputs.forEach((e) => removeEventListener(e, stop, true)); };
      inputs.forEach((e) => addEventListener(e, stop, { passive: true, capture: true }));
      const fix = () => {
        if (stopped || tries >= 8) return;
        const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
        const top = Math.min(Math.round(want()), max);
        if (Math.abs(scrollY - top) > 4) { tries++; scrollTo({ top, behavior: 'instant' }); }
      };
      if (now) fix();
      if (document.readyState === 'complete') requestAnimationFrame(fix);
      else addEventListener('load', () => requestAnimationFrame(fix), { once: true });
      if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(() => requestAnimationFrame(fix));
        ro.observe(document.body);
        setTimeout(() => { ro.disconnect(); stop(); }, 3000);
      }
    };

    // Back on the main page without bfcache: the browser restores the position itself; only nudge
    // it if late layout moved it.
    const target = state().mainReturnY;
    if (typeof target === 'number' && navType() === 'back_forward') hold(() => target);

    // Fallback of the button (no trip): open the technical resources section in place instead of the long smooth
    // scroll from the top that a #hash load gives. Only for a fresh one-time mark set by the button.
    const mark = storage.read();
    const section = document.getElementById(SECTION);
    if (mark?.fallback && mark.main === MAIN && Date.now() - mark.at < 15000 && location.hash === '#' + SECTION && navType() === 'navigate' && section) {
      storage.clear();
      // the offset the section normally gets from an anchor jump (header + its scroll margin)
      const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
      hold(() => scrollY + section.getBoundingClientRect().top - offset, { now: true });
    }
    return;
  }

  // ---- sub pages (blog, RF Q&A, 2.4GHz) ----
  let trip = state().mainTrip || null;
  if (!trip) {
    const t = storage.read();
    let ref = null;
    try { ref = document.referrer ? new URL(document.referrer) : null; } catch { ref = null; }
    const refPath = ref && ref.origin === location.origin ? ref.pathname.replace(/index\.html$/, '') : null;
    if (t && t.to === path && t.from === refPath && t.main === MAIN && Date.now() - t.at < TICKET_MAX_AGE && navType() === 'navigate') {
      trip = { main: t.main, depth: t.depth };
      setState({ mainTrip: trip });
    }
    storage.clear(); // a ticket is used once, valid or not
  }

  // In-page anchors (table of contents, RF Q&A question links) add history entries of their own
  // (popstate, then hashchange); search and filters do not touch the history:
  // an entry without trip data is a new one made from the current entry, so carry the trip over one
  // step deeper. Entries that already have it (back/forward inside the page) just switch to theirs.
  const syncEntry = () => {
    const own = state().mainTrip;
    if (own) trip = own;
    else if (trip) { trip = { ...trip, depth: trip.depth + 1 }; setState({ mainTrip: trip }); }
  };
  addEventListener('popstate', syncEntry);
  addEventListener('hashchange', syncEntry);
  addEventListener('pageshow', (e) => { if (e.persisted) trip = state().mainTrip || null; });

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('a.home-return');
    if (button) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; // new tab etc.: plain link
      if (!trip) { storage.write({ fallback: true, main: MAIN, at: Date.now() }); return; } // plain link to the section
      event.preventDefault();
      history.go(-trip.depth);
      return;
    }
    const to = tripTarget(event);
    if (to && trip) storage.write({ from: path, to, main: trip.main, depth: trip.depth + 1, at: Date.now() });
  });
})();
