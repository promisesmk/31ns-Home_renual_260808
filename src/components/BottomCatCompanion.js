// ═════════════════════════════════════════════════════════════════
// 31NS-TECH BOTTOM CAT COMPANION COMPONENT (16:9 @ 40mm)
// ═════════════════════════════════════════════════════════════════

const CATS = [
  {
    id: 'cat1',
    name: '호기심 냥이',
    webp: '/assets/cats/cat1.webp',
    gif: '/assets/cats/cat1.gif',
    pos: { left: '12%', bottom: '16px' },
    mobilePos: { left: '20px', bottom: '14px' }
  },
  {
    id: 'cat2',
    name: '나비 쫓는 냥이',
    webp: '/assets/cats/cat2.webp',
    gif: '/assets/cats/cat2.gif',
    pos: { left: '50%', transform: 'translateX(-50%)', bottom: '16px' },
    mobilePos: { left: '50%', transform: 'translateX(-50%)', bottom: '14px' }
  },
  {
    id: 'cat3',
    name: '다가오는 냥이',
    webp: '/assets/cats/cat3.webp',
    gif: '/assets/cats/cat3.gif',
    pos: { right: '12%', left: 'auto', bottom: '16px' },
    mobilePos: { right: '20px', left: 'auto', bottom: '14px' }
  }
];

export function initBottomCatCompanion() {
  // Prevent duplicate mounts
  if (document.getElementById('bottom-cat-wrapper')) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'bottom-cat-wrapper';
  wrapper.className = 'bottom-cat-wrapper';
  wrapper.innerHTML = `
    <div class="bottom-cat-card" id="bottom-cat-card" title="클릭하면 다음 고양이가 나와요!">
      <picture id="bottom-cat-picture">
        <source id="bottom-cat-source" type="image/webp" srcset="${CATS[0].webp}">
        <img id="bottom-cat-img" src="${CATS[0].webp}" alt="31ns Cat Companion" />
      </picture>
    </div>
  `;

  document.body.appendChild(wrapper);

  const card = document.getElementById('bottom-cat-card');
  const source = document.getElementById('bottom-cat-source');
  const img = document.getElementById('bottom-cat-img');

  img.onerror = () => {
    img.src = CATS[currentIndex].gif;
  };

  let currentIndex = 0;
  let isHovered = false;
  let timerId = null;

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function applyPosition(cat) {
    const p = isMobile() ? cat.mobilePos : cat.pos;
    wrapper.style.left = p.left || 'auto';
    wrapper.style.right = p.right || 'auto';
    wrapper.style.bottom = p.bottom || '16px';
    wrapper.style.transform = p.transform || 'none';
  }

  function showCat(index) {
    const cat = CATS[index];
    
    // Position change before showing
    applyPosition(cat);
    
    // Swap image source with cache friendliness
    source.srcset = cat.webp;
    img.src = cat.webp;

    // Fade in after brief frame
    requestAnimationFrame(() => {
      wrapper.classList.add('visible');
    });

    // Stay visible for 5.5s, then hide
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      if (!isHovered) {
        hideCat();
      }
    }, 5500);
  }

  function hideCat() {
    wrapper.classList.remove('visible');

    // Wait 2.2s resting interval, then switch to next cat
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      currentIndex = (currentIndex + 1) % CATS.length;
      showCat(currentIndex);
    }, 2200);
  }

  // Hover pauses the disappearance so user can inspect
  card.addEventListener('mouseenter', () => {
    isHovered = true;
  });

  card.addEventListener('mouseleave', () => {
    isHovered = false;
    // Resume hiding after short delay
    clearTimeout(timerId);
    timerId = setTimeout(hideCat, 2500);
  });

  // Click immediately jumps smoothly to next cat
  card.addEventListener('click', () => {
    wrapper.classList.remove('visible');
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      currentIndex = (currentIndex + 1) % CATS.length;
      showCat(currentIndex);
    }, 400);
  });

  // Handle window resize dynamically
  window.addEventListener('resize', () => {
    applyPosition(CATS[currentIndex]);
  });

  // Initial delayed start: appear 300ms after page load
  setTimeout(() => {
    showCat(0);
  }, 300);
}
