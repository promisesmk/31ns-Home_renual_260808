// PCB 3D Builder intro (KO/EN): demo video under the title.
// - Muted, inline. Plays from the start when at least half of it is on screen,
//   pauses once it has left the screen completely, and starts over on the next entry.
//   Partial visibility in between changes nothing, so it never restarts at the edge.
// - Stops on the last frame at the end (no loop). A play / pause / replay button is always available.
// - Reduced motion or blocked autoplay: the poster stays and the button plays it on demand.
// - Without JavaScript the native controls (set in the HTML) remain.
(() => {
  'use strict';
  const video = document.querySelector('[data-demo-video]');
  if (!video) return;
  const frame = video.parentElement;
  const EN = document.documentElement.lang === 'en';
  const T = EN
    ? { play: 'Play video', pause: 'Pause video', replay: 'Replay video' }
    : { play: '영상 재생', pause: '영상 일시정지', replay: '영상 다시 재생' };
  const ICON = {
    play: '<svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
    replay: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 2-7l5 5"/></svg>'
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  video.muted = true;
  video.playsInline = true;
  video.removeAttribute('controls');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'video-play-btn pv-demo-toggle';
  frame.append(button);

  function render() {
    const state = video.ended ? 'replay' : video.paused ? 'play' : 'pause';
    button.innerHTML = ICON[state];
    button.setAttribute('aria-label', T[state]);
  }
  ['play', 'pause', 'ended', 'playing'].forEach((e) => video.addEventListener(e, render));

  function playFromStart() {
    try { video.currentTime = 0; } catch { /* metadata not loaded yet */ }
    const attempt = video.play();
    if (attempt?.catch) attempt.catch(render); // autoplay blocked: keep the poster and the play button
  }

  button.addEventListener('click', () => {
    if (video.ended) playFromStart();
    else if (video.paused) video.play().catch(render);
    else video.pause();
  });

  // Video file missing or unsupported: no broken button.
  video.addEventListener('error', () => button.remove(), true);

  let inView = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          if (inView) { inView = false; video.pause(); }
        } else if (entry.intersectionRatio >= 0.5 && !inView) {
          inView = true;
          if (!reduce.matches) playFromStart();
        }
      }
    }, { threshold: [0, 0.5] }).observe(video);
  }
  render();
})();
