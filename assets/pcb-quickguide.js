// PCB 3D Builder intro (KO/EN): quick-guide screenshots open full size in a <dialog> when clicked.
// Without JavaScript (or <dialog>) the links simply open the image itself.
// Also: arriving with a #hash (e.g. "무료 다운로드" → #download), the browser jumps before the page is
// fully laid out and the target then moves down; re-align to it once things settle, unless the visitor scrolls.
(() => {
  'use strict';
  const target = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target && !/[?&]code=/.test(location.search)) { // links with a download code are handled by pcb-viewer.js
    let moved = false;
    const stop = () => { moved = true; };
    for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(type, stop, { once: true, passive: true });
    const align = () => {
      if (moved) return;
      const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const top = Math.round(scrollY + target.getBoundingClientRect().top - offset - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0));
      if (Math.abs(scrollY - top) > 4) scrollTo({ top, behavior: 'instant' });
    };
    const settle = () => [0, 400, 1200, 2500].forEach((ms) => setTimeout(align, ms));
    if (document.readyState === 'complete') settle(); else addEventListener('load', settle, { once: true });
  }

  const box = document.querySelector('[data-qg-lightbox]');
  if (!box || typeof box.showModal !== 'function') return;
  const img = box.querySelector('img');
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('[data-qg-zoom]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    const shot = link.querySelector('img');
    img.src = link.href;
    img.alt = shot ? shot.alt : '';
    box.showModal();
  });
  // Click outside the picture (on the backdrop) closes it too.
  box.addEventListener('click', (event) => { if (event.target === box) box.close(); });
  box.addEventListener('close', () => { img.removeAttribute('src'); });
})();
