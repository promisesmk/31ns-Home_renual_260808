(() => {
  'use strict';
  const EN = document.documentElement.lang === 'en';
  // File names are relative to this script's folder, so /en/ pages share the same assets.
  const ASSET_BASE = document.currentScript ? document.currentScript.src : new URL('assets/home.js', document.baseURI).href;
  const assetUrl = (file) => new URL(file, ASSET_BASE).href;
  // Keep these four keys for future real photographs. Empty case values retain the schematic.
  const SITE_MEDIA = {
    hero: 'hero-poster-v3.webp',
    heroVideo: 'hero-assembly-v3.mp4',
    industrial: '',
    coldchain: '',
    safety: ''
  };
  for (const slot of document.querySelectorAll('[data-media]')) {
    const file = SITE_MEDIA[slot.dataset.media];
    if (!file) continue;
    const path = assetUrl(file);

    if (slot.dataset.media === 'hero') {
      // The main pages put the video in the HTML, so the poster shows before this script runs.
      // Markup without it still gets one built here (same files as SITE_MEDIA).
      let video = slot.querySelector('video');
      if (!video) {
        video = document.createElement('video');
        video.poster = path;
        video.preload = 'metadata';
        video.setAttribute('aria-label', slot.dataset.imageAlt || '');

        const newSource = document.createElement('source');
        newSource.src = assetUrl(SITE_MEDIA.heroVideo);
        newSource.type = 'video/mp4';
        video.append(newSource);

        const fallbackImg = new Image();
        fallbackImg.alt = slot.dataset.imageAlt || '';
        fallbackImg.src = path;
        video.append(fallbackImg);
        slot.append(video);
      }
      video.muted = true;
      video.playsInline = true;
      const source = video.querySelector('source');

      const playBtn = document.createElement('button');
      playBtn.className = 'video-play-btn';
      playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>';
      playBtn.setAttribute('aria-label', EN ? 'Play video' : '영상 재생');
      playBtn.hidden = true;

      const motionPref = window.matchMedia('(prefers-reduced-motion: reduce)');

      const handlePlay = () => {
        playBtn.hidden = true;
        video.currentTime = 0;
        video.play().catch(() => {
          if (video.networkState === 3) return;
          playBtn.hidden = false;
        });
      };
      playBtn.addEventListener('click', handlePlay);

      video.addEventListener('ended', () => {
        playBtn.hidden = false;
        playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 2-7l5 5"/></svg>';
        playBtn.setAttribute('aria-label', EN ? 'Replay' : '다시 보기');
      });

      source.addEventListener('error', () => {
        playBtn.remove();
      });
      // The HTML video may have failed to load before this script ran.
      if (video.networkState === 3) playBtn.remove();

      slot.append(playBtn);
      slot.classList.add('has-image');
      slot.removeAttribute('aria-hidden');

      const attemptAutoplay = () => {
        if (motionPref.matches) {
          if (video.networkState === 3) return;
          playBtn.hidden = false;
          return;
        }
        video.play().catch(() => {
          if (video.networkState === 3) return;
          playBtn.hidden = false;
        });
      };

      if ('IntersectionObserver' in window) {
        const vidObserver = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) {
              video.pause();
              video.currentTime = 0;
              playBtn.hidden = true;
            } else if (entry.intersectionRatio >= 0.5) {
              if (video.networkState === 3) return;
              if (video.paused && !video.ended) {
                attemptAutoplay();
              }
            }
          }
        }, { threshold: [0, 0.5] });
        vidObserver.observe(video);
      } else {
        attemptAutoplay();
      }
      continue;
    }

    const image = new Image();
    image.alt = slot.dataset.imageAlt || '';
    image.decoding = 'async';
    image.loading = 'lazy';
    image.onload = () => {
      if (!image.naturalWidth) return;
      slot.append(image);
      slot.classList.add('has-image');
      slot.removeAttribute('aria-hidden');
    };
    image.onerror = () => image.remove();
    image.src = path;
  }

  const menuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const setMenuOpen = (open) => {
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.inert = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', EN ? (open ? 'Close menu' : 'Open menu') : (open ? '메뉴 닫기' : '메뉴 열기'));
  };
  menuToggle.addEventListener('click', () => setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true'));
  for (const link of mobileMenu.querySelectorAll('a')) link.addEventListener('click', () => setMenuOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false); menuToggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('header')) setMenuOpen(false);
  });
  document.addEventListener('focusin', (event) => {
    if (!event.target.closest('header')) setMenuOpen(false);
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
    if (event.matches) setMenuOpen(false);
  });

  // Never hide content while waiting for JavaScript or an observer.
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window) {

    const sections = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        document.querySelectorAll('.desktop-nav a').forEach(link => {
          if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    }, {rootMargin:'-15% 0px -60% 0px',threshold:0});
    document.querySelectorAll('main section').forEach(el => sections.observe(el));

    const svgObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          entry.target.classList.remove('svg-animate');
        } else if (entry.intersectionRatio >= 0.2) {
          if (!motionPreference.matches) entry.target.classList.add('svg-animate');
        }
      }
    }, { threshold: [0, 0.2] });
    document.querySelectorAll('.cap-diag-svg, .case-diagram svg').forEach(el => {
      el.classList.add('js-ready');
      svgObserver.observe(el);
    });

    const titleSelectors = '.title-group';
    
    const titleObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          entry.target.classList.remove('title-animate');
        } else if (entry.intersectionRatio >= 0.15) {
          if (!motionPreference.matches) entry.target.classList.add('title-animate');
        }
      }
    }, { threshold: [0, 0.2] });

    document.querySelectorAll(titleSelectors).forEach(el => {
      el.classList.add('js-title-ready');
      titleObserver.observe(el);
    });

    const stepObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          entry.target.classList.remove('is-animating');
        } else if (entry.intersectionRatio >= 0.2) {
          if (!motionPreference.matches) entry.target.classList.add('is-animating');
        }
      }
    }, { threshold: [0, 0.2] });

    document.querySelectorAll('.process-step').forEach(el => {
      stepObserver.observe(el);
    });
  }
})();

(() => {
  'use strict';
  const form = document.getElementById('inquiry-form');
  if (!form) return;
  const T = document.documentElement.lang === 'en' ? {
    company: 'Company / Contact name: ',
    email: 'Reply email: ',
    service: 'Service area: ',
    stage: 'Current stage: ',
    schedule: 'Target schedule: ',
    topic: 'Related topic: ',
    message: 'Inquiry:',
    general: 'General inquiry',
    subject: 'Development Inquiry',
    required: 'Please fill in (or select) this field.',
    invalid: 'Please enter a valid format.',
    sending: 'Sending…',
    failed: 'Your inquiry could not be sent. Please try again shortly or email nskim@31ns.kr.',
    errors: {
      invalid_email: 'Please check your email address.',
      captcha_failed: 'The spam check failed. Please wait a moment and try again.',
      rate_limited: 'Too many inquiries today. Please email nskim@31ns.kr directly.',
      network_error: 'The inquiry could not be sent because of a network error. Check your connection and try again.'
    }
  } : {
    company: '회사명 / 담당자명: ',
    email: '회신 이메일: ',
    service: '개발 분야: ',
    stage: '현재 개발 단계: ',
    schedule: '희망 일정: ',
    topic: '상담 관련 주제: ',
    message: '문의 내용:',
    general: '일반 상담',
    subject: '개발 상담',
    required: '이 항목을 입력(선택)해 주세요.',
    invalid: '올바른 형식을 입력해 주세요.',
    sending: '보내는 중…',
    failed: '문의를 보내지 못했습니다. 잠시 후 다시 시도하시거나 nskim@31ns.kr로 메일 주세요.',
    errors: {
      invalid_email: '이메일 주소를 확인해 주세요.',
      captcha_failed: '스팸 방지 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      rate_limited: '오늘 보낼 수 있는 문의 수를 넘었습니다. nskim@31ns.kr로 직접 메일 주세요.',
      network_error: '네트워크 오류로 보내지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.'
    }
  };
  const feedback = document.getElementById('form-feedback');
  const context = document.getElementById('inquiry-context');
  const topicField = document.getElementById('topic-field');
  const clearTopicBtn = document.getElementById('clear-topic');
  
  const resetFeedback = () => { feedback.hidden = true; feedback.textContent = ''; };

  const setTopic = (topic) => {
    if (topic) {
      context.value = topic;
      topicField.hidden = false;
    } else {
      context.value = '';
      topicField.hidden = true;
    }
  };

  if (clearTopicBtn) {
    clearTopicBtn.addEventListener('click', () => {
      setTopic('');
    });
  }

  for (const link of document.querySelectorAll('[data-service]')) {
    link.addEventListener('click', () => {
      form.elements.namedItem('service').value = link.dataset.service;
      setTopic(link.dataset.topic || '');
      resetFeedback();
    });
  }

  const params = new URLSearchParams(window.location.search);
  const requestedService = params.get('service');
  const requestedTopic = (params.get('topic') || '').slice(0, 200);
  if (requestedService && [...form.elements.namedItem('service').options].some(option => option.value === requestedService)) {
    form.elements.namedItem('service').value = requestedService;
    if (requestedTopic) {
      setTopic(requestedTopic);
    }
  }

  const getDraft = () => {
    const company = form.elements.namedItem('company').value.trim();
    const email = form.elements.namedItem('email').value.trim();
    const serviceField = form.elements.namedItem('service');
    const service = serviceField.selectedOptions[0]?.textContent || '';
    
    const stageField = form.elements.namedItem('stage');
    const stage = stageField ? stageField.value : '';
    const scheduleField = form.elements.namedItem('schedule');
    const schedule = scheduleField ? scheduleField.value.trim() : '';
    
    const topic = topicField && !topicField.hidden ? context.value.trim() : '';

    const bodyParts = [
      T.company + company,
      T.email + email,
      T.service + service
    ];

    if (stage) bodyParts.push(T.stage + stage);
    if (schedule) bodyParts.push(T.schedule + schedule);
    if (topic) bodyParts.push(T.topic + topic);

    bodyParts.push('', T.message, form.elements.namedItem('message').value.trim());

    const body = bodyParts.join('\r\n');
    const subjectTitle = topic ? topic : (service || T.general);
    const subject = `[${T.subject}] ${subjectTitle} - ${company}`;
    return {subject, body};
  };

  const validate = () => {
    for (const name of ['company', 'email', 'service', 'message']) {
      const field = form.elements.namedItem(name);
      if (field) {
        field.setCustomValidity('');
        if (!field.checkValidity()) {
          if (field.validity.valueMissing) field.setCustomValidity(T.required);
          else if (field.validity.typeMismatch) field.setCustomValidity(T.invalid);
        }
      }
    }
    return form.reportValidity();
  };

  // Sent straight to the server (workers/pcb3d-api /api/inquiry), which saves it and mails nskim@31ns.kr.
  // The visitor never needs a mail app; afterwards the form is replaced by what was sent.
  const config = window.PCB3D_CONFIG || {};
  const doneBox = document.getElementById('inquiry-done');
  const doneSummary = document.getElementById('inquiry-done-summary');
  const submitButton = form.querySelector('[type="submit"]');
  const turnstileBox = document.getElementById('inquiry-turnstile');
  let turnstileWidget = null;
  let sending = false;

  const showError = (text) => {
    feedback.textContent = text;
    feedback.classList.add('is-error');
    feedback.hidden = false;
  };

  if (config.turnstileSiteKey && !config.turnstileSiteKey.includes('REPLACE_ME') && turnstileBox) {
    window.inquiryTurnstileReady = () => {
      turnstileWidget = window.turnstile.render(turnstileBox, {
        sitekey: config.turnstileSiteKey, language: document.documentElement.lang === 'en' ? 'en' : 'ko',
        appearance: 'interaction-only'
      });
    };
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=inquiryTurnstileReady&render=explicit';
    script.async = true;
    document.head.appendChild(script);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validate() || sending) return;
    resetFeedback();
    feedback.classList.remove('is-error');
    if (!config.api || config.api.includes('REPLACE_ME')) {
      showError(T.failed);
      return;
    }
    const serviceField = form.elements.namedItem('service');
    const payload = {
      lang: document.documentElement.lang === 'en' ? 'en' : 'ko',
      company: form.elements.namedItem('company').value.trim(),
      email: form.elements.namedItem('email').value.trim(),
      service: serviceField.selectedOptions[0]?.textContent || '',
      stage: form.elements.namedItem('stage')?.value || '',
      schedule: form.elements.namedItem('schedule')?.value.trim() || '',
      topic: topicField && !topicField.hidden ? context.value.trim() : '',
      message: form.elements.namedItem('message').value.trim(),
      website: form.elements.namedItem('website')?.value || '',
      turnstileToken: turnstileWidget !== null ? window.turnstile.getResponse(turnstileWidget) : ''
    };

    sending = true;
    const label = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = T.sending;
    let result = { ok: false, data: {} };
    try {
      const res = await fetch(`${config.api}/api/inquiry`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      result = { ok: res.ok, data: await res.json().catch(() => ({})) };
    } catch {
      result = { ok: false, data: { error: 'network_error' } };
    }
    sending = false;
    submitButton.disabled = false;
    submitButton.textContent = label;
    if (turnstileWidget !== null) window.turnstile.reset(turnstileWidget);

    if (!result.ok) {
      showError(T.errors[result.data.error] || T.failed);
      return;
    }
    doneSummary.textContent = getDraft().body;
    form.hidden = true;
    doneBox.hidden = false;
    doneBox.focus();
    doneBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.getElementById('inquiry-again')?.addEventListener('click', () => {
    form.reset();
    setTopic('');
    doneBox.hidden = true;
    form.hidden = false;
    form.elements.namedItem('company').focus();
  });
})();