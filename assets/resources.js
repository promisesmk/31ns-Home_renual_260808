(() => {
 'use strict';
 document.documentElement.classList.add('js-enabled');
 const EN=document.documentElement.lang==='en';
 const toggle=document.getElementById('mobile-menu-toggle');
 const menu=document.getElementById('mobile-menu');
 const setMenu=open=>{menu.classList.toggle('is-open',open);menu.inert=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',EN?(open?'Close menu':'Open menu'):(open?'메뉴 닫기':'메뉴 열기'))};
 toggle.addEventListener('click',()=>setMenu(toggle.getAttribute('aria-expanded')!=='true'));
 menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){setMenu(false);toggle.focus()}});
 document.addEventListener('click',e=>{if(!e.target.closest('header'))setMenu(false)});
 document.addEventListener('focusin',e=>{if(!e.target.closest('header'))setMenu(false)});
 matchMedia('(min-width:1024px)').addEventListener('change',e=>{if(e.matches)setMenu(false)});
 // Title scroll animation (same timing as the main page). It must run on every page that loads this file,
 // so it sits before the FAQ-only code below, which returns early on pages without the FAQ search.
 // The PCB 3D Builder pages animate their titles with pcb-motion.js, so they are left to it (no double observer).
 const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
 if ('IntersectionObserver' in window && !document.querySelector('script[src$="pcb-motion.js"]')) {
  const titleObserver = new IntersectionObserver((entries) => {
   for (const entry of entries) {
    if (!entry.isIntersecting) {
     entry.target.classList.remove('title-animate');
    } else if (entry.intersectionRatio >= 0.15) {
     if (!motionPreference.matches) entry.target.classList.add('title-animate');
    }
   }
  }, { threshold: [0, 0.2] });

  document.querySelectorAll('.title-group').forEach(el => {
   el.classList.add('js-title-ready');
   titleObserver.observe(el);
  });
 }

 const search=document.getElementById('faq-search');
 if(!search)return;
 const entries=[...document.querySelectorAll('.faq-entry')];
 const filters=[...document.querySelectorAll('[data-category].filter')];
 const language=document.getElementById('faq-language');
 let category='all';
 const normal=value=>value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,'');
 const searchable=new Map(entries.map(e=>[e,normal([e.dataset.qKo,e.dataset.qEn,e.dataset.aKo,e.dataset.aEn].join(' '))]));
 function filter(){
  const query=normal(search.value.trim());let count=0;
  entries.forEach(e=>{const show=(category==='all'||category===e.dataset.category)&&(!query||searchable.get(e).includes(query));e.hidden=!show;if(show)count++});
  filters.forEach(b=>{const active=b.dataset.category===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
  document.getElementById('result-count').textContent=EN?`${count} of 50 questions`:`${count}개 질문 / 전체 50개`;
  document.getElementById('faq-empty').hidden=count!==0;
 }
 function reset(){search.value='';category='all';filter()}
 search.addEventListener('input',filter);
 filters.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.category;filter()}));
 document.getElementById('clear-search').addEventListener('click',()=>{reset();search.focus()});
 document.getElementById('reset-filters').addEventListener('click',()=>{reset();search.focus()});
 language.addEventListener('change',()=>{
  const english=language.value==='en';
  entries.forEach(e=>{const q=e.querySelector('.faq-question'),a=e.querySelector('.faq-answer-copy');q.textContent=english?e.dataset.qEn:e.dataset.qKo;a.textContent=english?e.dataset.aEn:e.dataset.aKo;q.lang=a.lang=language.value});
 });
 function openHash(){
  const id=location.hash.slice(1);if(!/^q-\d+$/.test(id))return;
  const target=document.getElementById(id);if(!target)return;
  reset();target.open=true;requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));
 }
 document.querySelectorAll('.question-link').forEach(a=>a.addEventListener('click',()=>{
  // Repeated clicks on the same hash also reveal the question.
  if(a.hash===location.hash)openHash();
 }));
 window.addEventListener('hashchange',openHash);
 filter();openHash();

})();
