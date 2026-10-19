// PCB 3D Builder intro (KO/EN): demo video under the title.
// - Muted, inline, looped, no button: plays while on screen and pauses off screen to save CPU.
// - If the browser blocks autoplay (e.g. power saving), it starts on the visitor's first tap, click, key or scroll.
// - Without JavaScript the native controls (set in the HTML) remain.
(() => {
  'use strict';
  const video = document.querySelector('[data-demo-video]');
  if (!video) return;

  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.removeAttribute('controls');

  let inView = !('IntersectionObserver' in window);
  const tryPlay = () => {
    if (!inView || !video.paused || video.networkState === 3) return;
    video.play().catch(() => {});
  };
  for (const type of ['pointerdown', 'keydown', 'touchstart', 'scroll']) {
    window.addEventListener(type, tryPlay, { passive: true });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      for (const entry of entries) {
        inView = entry.isIntersecting;
        if (inView) tryPlay();
        else video.pause();
      }
    }).observe(video);
  } else {
    tryPlay();
  }
})();
