// Scroll motion for the PCB 3D Builder pages (KO/EN intro and guide). Loaded only on those pages.
//
// Same rules as the main page (assets/home.js):
// - an element plays when at least 15% of it is on screen,
// - it is reset only after it has left the screen completely, so small scrolls at the edge do not
//   restart it, and it plays again on every re-entry (no loop while it stays on screen).
// Content is hidden only while the <html> element has the pv-motion class, which this script adds.
// No script, no IntersectionObserver or reduced motion → everything is simply shown.
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || !('IntersectionObserver' in window)) return;

  const root = document.documentElement;
  const titles = [...document.querySelectorAll('.title-group')];
  const blocks = [...document.querySelectorAll('[data-pv-reveal]')];
  const stages = [...document.querySelectorAll('[data-pv-diagram]')];

  // Short stagger (80ms) only between cards / steps of the same list; headings and figures in
  // long text get none, so nothing waits on content above it.
  for (const el of blocks) {
    if (!el.parentElement.matches('ul, ol')) continue;
    const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-pv-reveal'));
    el.style.setProperty('--pv-i', String(Math.min(siblings.indexOf(el), 5)));
  }

  function toggler(className) {
    return new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) entry.target.classList.remove(className, 'pv-instant');
        else if (entry.intersectionRatio >= 0.15) entry.target.classList.add(className);
      }
    }, { threshold: [0, 0.15] });
  }

  try {
    const titleObserver = toggler('title-animate');
    const blockObserver = toggler('is-in');
    const stageObserver = toggler('is-playing');
    for (const el of titles) { el.classList.add('js-title-ready'); titleObserver.observe(el); }
    for (const el of blocks) blockObserver.observe(el);
    for (const el of stages) stageObserver.observe(el);
    root.classList.add('pv-motion');
  } catch {
    root.classList.remove('pv-motion');
    for (const el of titles) el.classList.remove('js-title-ready');
    return;
  }

  // Shown at once, without the rise animation (keyboard focus, in-page links).
  function show(el) {
    if (!el) return;
    el.closest('[data-pv-reveal]')?.classList.add('is-in', 'pv-instant');
    const group = el.closest('.title-group');
    if (group) group.classList.remove('js-title-ready');
  }

  // Keyboard focus never lands on something still transparent.
  document.addEventListener('focusin', (event) => show(event.target));

  // Table-of-contents and other in-page links: show the target right away.
  function showHashTarget() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    show(target);
    target?.querySelectorAll?.('[data-pv-reveal]').forEach((el) => el.classList.add('is-in', 'pv-instant'));
    // the figure right after a guide heading belongs to it
    const next = target?.nextElementSibling;
    if (next?.hasAttribute?.('data-pv-reveal')) next.classList.add('is-in', 'pv-instant');
    // and so does the small label right above it
    const prev = target?.previousElementSibling;
    if (prev?.classList?.contains('pv-guide-label')) prev.classList.add('is-in', 'pv-instant');
  }
  window.addEventListener('hashchange', showHashTarget);
  showHashTarget();

  // If the visitor turns on reduced motion while reading, show everything.
  reduce.addEventListener?.('change', (event) => {
    if (!event.matches) return;
    root.classList.remove('pv-motion');
    for (const el of titles) el.classList.remove('js-title-ready');
  });
})();
