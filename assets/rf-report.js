// 2.4GHz page (KO/EN): page viewer for the RF tuning report. Shows one report page image at a time with
// previous / next and page buttons. The report is published only as these images (no PDF); right-click and
// dragging are turned off on the viewer to discourage saving, which cannot be fully prevented on the web.
(() => {
  'use strict';
  const viewer = document.querySelector('[data-rf-viewer]');
  if (!viewer) return;
  const img = viewer.querySelector('[data-rf-page]');
  const buttons = [...viewer.querySelectorAll('[data-rf-goto]')];
  const prev = viewer.querySelector('[data-rf-prev]');
  const next = viewer.querySelector('[data-rf-next]');
  const count = viewer.querySelector('[data-rf-count]');
  const pages = buttons.map((b) => ({ src: b.dataset.src, alt: b.dataset.alt }));
  let current = 0;

  function show(index) {
    current = Math.max(0, Math.min(pages.length - 1, index));
    img.src = pages[current].src;
    img.alt = pages[current].alt;
    buttons.forEach((b, i) => b.setAttribute('aria-current', i === current ? 'true' : 'false'));
    prev.disabled = current === 0;
    next.disabled = current === pages.length - 1;
    count.textContent = `${current + 1} / ${pages.length}`;
  }

  buttons.forEach((b, i) => b.addEventListener('click', () => show(i)));
  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  viewer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
  for (const type of ['contextmenu', 'dragstart']) {
    viewer.addEventListener(type, (e) => { if (e.target.closest('.rf-sheet')) e.preventDefault(); });
  }
  // Load the other pages in the background so switching is instant.
  window.addEventListener('load', () => pages.slice(1).forEach((p) => { new Image().src = p.src; }), { once: true });
  show(0);
})();
