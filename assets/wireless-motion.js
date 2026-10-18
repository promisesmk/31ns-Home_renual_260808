// Diagrams on the 2.4GHz page (KO/EN). Loaded only there; titles keep using resources.js.
//
// Same rules as the main and PCB pages:
// - a diagram plays when at least 15% of it is on screen,
// - it is reset only after it has left the screen completely, so small scrolls at the edge do not
//   restart it, and it plays again on every re-entry (one run, no loop).
// Parts are hidden only while <html> has the w-motion class, which this script adds.
// No script, no IntersectionObserver or reduced motion → the finished diagrams are simply shown.
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || !('IntersectionObserver' in window)) return;

  const root = document.documentElement;
  try {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) entry.target.classList.remove('is-playing');
        else if (entry.intersectionRatio >= 0.15) entry.target.classList.add('is-playing');
      }
    }, { threshold: [0, 0.15] });
    document.querySelectorAll('[data-w-diagram]').forEach((el) => observer.observe(el));
    root.classList.add('w-motion');
  } catch {
    root.classList.remove('w-motion');
    return;
  }

  // Turning on reduced motion while reading shows everything at once.
  reduce.addEventListener?.('change', (event) => { if (event.matches) root.classList.remove('w-motion'); });
})();
