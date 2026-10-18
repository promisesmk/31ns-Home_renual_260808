// 2.4GHz page (KO/EN): each vendor card opens its own chip comparison panel. Loaded only there.
//
// - One panel open at a time; all closed at first. The card button shows "비교하기" / "접기" (EN "Compare" / "Close").
// - The open panel sits right below the row of its card (full grid width) on every column count
//   (3 on PC, 2 on tablet, 1 on mobile) and follows the row when the width changes.
// - Opening / closing takes about 300 ms; the card that was pressed keeps its place on screen.
// - Closed panels are hidden (not focusable). Without this script every panel is shown below its card.
// Independent of the title and diagram animations.
(() => {
  'use strict';
  const grid = document.querySelector('[data-vendor-grid]');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('[data-vendor-card]')];
  const items = cards.map((card) => {
    const button = card.querySelector('.w-vtoggle');
    return { card, button, label: button.querySelector('.w-vtoggle-label'), panel: document.getElementById(button.getAttribute('aria-controls')) };
  });
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION = 300;
  let current = -1;

  document.documentElement.classList.add('w-vendors-js');
  items.forEach(({ card, button, panel }, i) => {
    card.style.order = String(i * 2);
    button.hidden = false;
    panel.hidden = true;
    panel.inert = true;
  });

  const columns = () => getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
  // Put panel i right after the last card of its row.
  function place(i) {
    const cols = columns();
    const rowEnd = Math.min(items.length - 1, Math.floor(i / cols) * cols + cols - 1);
    items[i].panel.style.order = String(rowEnd * 2 + 1);
  }

  // Keep the pressed card at the same place on screen while panels above it open or close.
  function keepInPlace(card) {
    const startTop = card.getBoundingClientRect().top;
    const until = performance.now() + DURATION + 120;
    const step = () => {
      const diff = card.getBoundingClientRect().top - startTop;
      if (Math.abs(diff) > 0.5) window.scrollTo({ top: window.scrollY + diff, behavior: 'instant' });
      if (performance.now() < until) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function setButton(i, open) {
    const { card, button, label } = items[i];
    button.setAttribute('aria-expanded', String(open));
    label.textContent = open ? label.dataset.close : label.dataset.open;
    card.classList.toggle('is-selected', open);
  }

  function close(i) {
    const { panel } = items[i];
    setButton(i, false);
    panel.inert = true;
    panel.classList.remove('is-open');
    const done = () => { if (!panel.classList.contains('is-open')) panel.hidden = true; };
    if (reduce.matches) done(); else setTimeout(done, DURATION + 20);
  }

  function open(i) {
    const { panel } = items[i];
    place(i);
    setButton(i, true);
    panel.hidden = false;
    panel.inert = false;
    if (reduce.matches) { panel.classList.add('is-open'); return; }
    void panel.offsetHeight; // start from the closed height
    requestAnimationFrame(() => panel.classList.add('is-open'));
  }

  items.forEach(({ card, button }, i) => {
    button.addEventListener('click', () => {
      if (!reduce.matches) keepInPlace(card);
      if (current === i) { close(i); current = -1; return; }
      if (current !== -1) close(current);
      open(i);
      current = i;
    });
  });

  // Width changes: keep the open panel under the row of its card.
  let lastCols = columns();
  const relayout = () => {
    const cols = columns();
    if (cols === lastCols) return;
    lastCols = cols;
    if (current !== -1) place(current);
  };
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(grid);
  else window.addEventListener('resize', relayout);
})();
