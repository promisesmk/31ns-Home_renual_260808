// PCB 3D Builder intro (KO/EN): quick-guide screenshots open full size in a <dialog> when clicked.
// Without JavaScript (or <dialog>) the links simply open the image itself.
(() => {
  'use strict';
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
