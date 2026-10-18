// PCB 3D Builder 다운로드 서버 주소와 스팸 방지(Cloudflare Turnstile) 공개 키.
// 서버(workers/pcb3d-api)를 배포한 뒤 PRODUCTION 값을 실제 값으로 바꿉니다. 둘 다 공개되어도 되는 값입니다.
// 내 Mac에서 볼 때(localhost)는 로컬 서버와 Turnstile 시험 키(항상 통과)를 씁니다.
window.PCB3D_CONFIG = (() => {
  'use strict';
  const PRODUCTION = {
    api: 'https://pcb3d-api.31ns-tech.workers.dev',
    turnstileSiteKey: '0x4AAAAAAFZ5LpEmdrUk7dTE'
  };
  const LOCAL = {
    api: 'http://127.0.0.1:8787',
    turnstileSiteKey: '1x00000000000000000000AA'
  };
  return ['localhost', '127.0.0.1'].includes(location.hostname) ? LOCAL : PRODUCTION;
})();
