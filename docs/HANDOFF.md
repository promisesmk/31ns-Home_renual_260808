> **2026-10-18 변경:** 31ns.kr은 GitHub Pages(`promisesmk/31ns-Home_renual_260808`)에서 운영하고, 회원 로그인(Vercel · Supabase)은 제거했습니다. 다운로드 · Q&A는 [PCB3D-DOWNLOAD.md](PCB3D-DOWNLOAD.md)를 보세요. 이 문서의 Vercel · Supabase · 회원 관련 내용은 이전 기록입니다.

# 31NS-Tech 리뉴얼 홈페이지 인계 문서

아빠 Mac의 Antigravity에서 이 저장소를 열어 관리할 때 보는 문서입니다.
비밀 키 · 비밀번호 값은 이 문서에 적지 않습니다. 이름과 넣는 위치만 적습니다.

- 최종 정리: 2026-10-17 (아빠 인계용 최종 전달본 기준. 기준 커밋은 전달 폴더의 `00_먼저읽기.md`에 적힌 값)
- 작업 브랜치: `feature/pcb-viewer` (검토용). `main`은 아직 리뉴얼을 반영하지 않음

## 1. 한눈에 보기

| 구분 | 현재 |
|---|---|
| 리뉴얼 소스 | GitHub `shimagnolram/31ns-website`, 브랜치 `feature/pcb-viewer` |
| 리뉴얼 검토 주소 | https://31ns-website-git-feature-pcb-viewer-k-spotter1.vercel.app (Vercel 로그인 필요 · 검색 차단) |
| 지금 공개 중인 31ns.kr | 기존 저장소 `promisesmk/31ns-Home_renual_260808` → GitHub Pages(수동 배포). **리뉴얼과 별개** |
| 도메인 · DNS | 31ns.kr, 가비아에서 관리 |
| 회원 · 다운로드 서버 | Vercel 서버 함수(`api/`) + Supabase(회원 인증 · DB) |
| PCB 프로그램 원본 | `promisesmk/Antigravity-Windows` (읽기 전용으로만 참고) |

구성: 빌드 도구 없는 정적 HTML · CSS · JS + `api/` 서버 함수. 페이지 파일을 고치면 그대로 반영됩니다.

## 2. 로컬에서 실행하기

필요한 것: Node.js 20 이상, Python 3 (Mac 기본)

```bash
npm install                 # 처음 한 번 (서버 함수 · 테스트용 라이브러리)
python3 -m http.server 8000 # 화면만 볼 때 → http://localhost:8000
npm test                    # 서버 권한 · 다운로드 규칙 자동 테스트 (가짜 서비스, 인터넷 불필요)
```

- 로그인 · 다운로드까지 로컬에서 돌리려면 `npx vercel dev`가 필요합니다(Vercel 로그인, 환경변수 필요). 보통은 검토 주소에서 확인합니다.
- Antigravity에 맡길 때 예: “`docs/HANDOFF.md`를 읽고, PCB 3D Builder 페이지의 버전 표기를 2.2로 바꿔줘. 검토 주소에 올리고 main은 건드리지 마.”

## 3. 배포

| 하고 싶은 일 | 방법 |
|---|---|
| 검토 주소에 올리기 | `feature/pcb-viewer`에 커밋 → `git push` → Vercel이 1~2분 안에 검토 주소에 자동 반영 |
| 배포 상태 보기 | Vercel 대시보드 → 프로젝트 `31ns-website` → Deployments (또는 `npx vercel ls`) |
| 정식 공개 | **아직 하지 않음.** 아래 6장 절차와 결정 사항을 먼저 확인 |

- `main`에 합치면 Vercel Production(`31ns-website.vercel.app`)에 반영됩니다. 31ns.kr 도메인은 아직 연결되어 있지 않습니다.
- 배포에서 빠지는 폴더: `docs/`, `tests/`, `tools/`, `workers/`, `supabase/`, `.env*` (`.vercelignore`)

## 4. 어디를 고치면 되나

| 바꿀 것 | 파일 |
|---|---|
| 메인 문구 · 기술 역량 카드 · 사례 · 상담 폼 | `index.html` (영어: `en/index.html`) |
| 메인 영상 · 포스터 | `assets/hero-assembly-v4.mp4`(1920×934, 6.04초, 24fps, H.264, 소리 없음, faststart, 2026-10-19 교체 · 원본은 HEVC라 H.264로 다시 변환), 포스터 · 폴백 `assets/hero-poster-v4.webp`(영상 첫 프레임). 영상 영역 비율은 `assets/site.css`의 `.hero-media{aspect-ratio:1920/934}`, PC(1024px 이상) 표시 폭은 같은 파일의 `.hero .hero-figure`(이전 폭의 95%, 가운데). 한 · 영 메인 HTML의 `#media-hero` 안에 `<video>`가 처음부터 들어 있고(포스터가 스크립트 전에 표시), 재생 규칙은 `assets/home.js`(`SITE_MEDIA`의 파일 이름도 같은 값). 영상을 바꿀 때는 새 이름(예: `-v3`)으로 넣고 두 HTML과 `home.js`의 이름을 함께 바꿈(브라우저 캐시 갱신). 원본 · 이전 영상은 저장소 밖 보관(14장) |
| 공통 디자인 | `assets/site.css`, 하위 페이지 `assets/resources.css`, 기술 역량 목록 `assets/capabilities.css` |
| 2.4GHz 페이지 | `2.4ghz.html`, `en/2.4ghz.html` |
| 기술 블로그 | `blog/…`, `en/blog/…` (새 글을 쓰면 `sitemap.xml`, `rss.xml`에도 추가). **메인 기술 자료 영역의 기술 블로그 항목은 2026-10-15 제거 — 추후 복원 예정이며 기존 블로그 소스(목록 · 글 · 이미지 · 복귀 코드)는 보존.** 복원 시 `index.html` · `en/index.html`의 `#technical-resources-section` 목록에 `blog/` 항목을 다시 넣고 번호를 01~03으로 맞춤. 상단 · 모바일 메뉴의 블로그 탭도 2026-10-16 삭제(하위 16쪽의 `desktop-nav` · `mobile-menu`) — 복원 시 같은 위치에 링크를 다시 넣음 |
| 하위 페이지의 ‘← 메인으로’ 복귀 | `assets/main-return.js` (메인 · 기술 블로그 · RF Q&A · 2.4GHz 페이지에서 로드, 이전 이름 `blog-return.js`). 같은 탭에서 메인 → 하위 페이지로 왔으면 보던 메인 위치로, 직접 · 새 탭 접속이면 메인의 기술 자료 섹션으로. 새 하위 페이지를 대상에 넣으려면 스크립트의 `TRIP_PAGES`에 주소를 추가하고, 그 페이지의 복귀 버튼 `href`를 `…/#technical-resources-section`으로, 끝에 이 스크립트를 넣음 |
| RF Q&A | `rf-faq/index.html`, `en/rf-faq/index.html` |
| 개발 사례 상세 페이지 | 메인 사례 카드의 ‘상세 사례 보기’에서 연결. `cases/industrial-iot/`(산업용 예측진단 센서) · `cases/golf-grip-sensor/`(SGLAB 지그립 그립 센서), 영어는 `en/cases/…`, 스타일 `assets/case.css`, 이미지 `assets/cases/`. 산업용 사례는 고객사를 S사 · L사로만 표기하고 협력사 이름 · 로고는 싣지 않음. 부품은 모델명 대신 기능(RF IC, 24-bit ADC 등)으로 표기. 원본 자료는 `scratch/case-industrial-iot/`(깃 · 배포 제외) |
| PCB 3D Builder 소개 | `pcb-viewer/index.html`, 영어 `en/pcb-viewer/index.html` (스타일 `assets/pcb-viewer.css`). 메인에는 기술 자료 아래 `#pcb-builder-section`(간단 소개 + ‘자세히 보기’)이 있고, 상단 메뉴 ‘PCB 3D Builder’는 이 섹션으로 이동 |
| PCB 사용 가이드 | `pcb-viewer/guide/index.html`, 영어 `en/pcb-viewer/guide/index.html` |
| 다운로드 버튼 문구(한 · 영) | `assets/pcb-viewer.js`의 `T`, `ERRORS` |
| PCB 소개 영상 (‘한눈에 보기’ 섹션, 과정 도식 아래) | `assets/pcb3d-demo.mp4`(배포용 사본: 소리 제거 · faststart · 원본 비율 872×652), 포스터 `assets/pcb3d-demo-poster.webp`(22.5초 장면). 원본은 `~/Desktop/pcb3d-demo.mp4`(저장소에 넣지 않음). 재생 규칙은 `assets/pcb-demo-video.js`. 영상을 바꿀 때는 같은 이름으로 교체하고, 비율이 다르면 `assets/pcb-viewer.css`의 `.pv-demo-frame` `aspect-ratio`와 HTML의 `width` · `height`도 수정 |
| PCB 페이지 아이콘 | `assets/pcb-icons.svg` (선 2px, 44×44 기준, 메인 과정 아이콘과 같은 스타일). 페이지에서는 `<svg class="pv-icon" aria-hidden="true"><use href="…/assets/pcb-icons.svg#i-이름"></use></svg>` |
| PCB 과정 도식 · 스크롤 효과 | 도식은 각 페이지 HTML의 `pv-process` · `pv-guide-figure`(설명용, 실제 화면 아님). 효과는 `assets/pcb-motion.js`(PCB 4개 페이지만 로드) + `assets/pcb-viewer.css` 끝부분. 등장 대상은 `data-pv-reveal`, 도식 재생은 `data-pv-diagram` 속성 |
| 프로그램 버전 표기 | 한 · 영 소개의 ‘기준 버전 / Reference version’ 행, 한 · 영 가이드 머리말, `tools/seo_head.py`의 `softwareVersion`(2곳) |
| 다운로드할 설치 파일 정보 | 사이트 관리 화면 `/admin/` (DB에 저장, 코드 수정 불필요) |
| 페이지 제목 · 설명 · 공유 미리보기 · 사이트맵 | `tools/seo_head.py`의 `PAGES`(주소 · 제목 · 설명 · 번역 짝) · `LASTMOD`(내용 변경일)를 고친 뒤 `python3 tools/seo_head.py` 실행 → 모든 공개 페이지 `<head>`와 `sitemap.xml`을 함께 다시 만듦 |
| 공유 이미지 | `assets/og-image.png` (1200×630) |
| 검색 파일 | `robots.txt`, `sitemap.xml`, `rss.xml`, 오류 페이지 `404.html` |

`<!-- seo:start -->`부터 `<!-- seo:end -->` 사이는 스크립트가 다시 쓰므로 직접 고치지 말고 `tools/seo_head.py`를 고칩니다.

## 5. 검색(SEO) 설정 현황

- 공개 페이지 16개(한국어 8 · 영어 8): 대표 주소(canonical) `https://31ns.kr/…`, 제목 · 설명, 공유 미리보기(OG), 한국어 ↔ 영어 대응 페이지끼리 hreflang
- 새 페이지를 추가할 때: HTML을 만든 뒤 `tools/seo_head.py`의 `PAGES`에 넣고, 번역 짝이 있으면 양쪽에 서로를 적고, 화면의 한국어/EN 전환 링크도 서로를 가리키게 함
- 구조화 데이터: 메인 Organization · WebSite, 영어 메인 WebSite, PCB 소개(한 · 영) SoftwareApplication(무상), RF Q&A(한 · 영) FAQPage(화면의 50개와 같음)
- 사이트맵: 공개 대표 주소 16개(`tools/seo_head.py`가 생성). 회원 · 관리자 · API · 다운로드 티켓 주소는 넣지 않음. `lastmod`는 내용 변경일을 아는 페이지에만
- 이전 사이트 주소 호환: `/#capabilities`, `#portfolio`, `#contact`, `#blog`, `#rf-faq`, `#philosophy`, `#hero`가 새 섹션으로 이동
- **연결하지 않은 것(운영 계정 확인 전):** 구글 Search Console · 네이버 서치어드바이저 소유 확인, GA4(기존 사이트는 `G-M6ZKCVME6D` 사용). 기존 사이트의 소유 확인 태그는 실제 값이 아닌 예시 문구였습니다

## 6. 정식 공개 때 검색 차단(noindex) 해제 — 절차 (지금은 하지 않음)

지금 검토 환경은 `vercel.json`이 **모든 주소**에 `X-Robots-Tag: noindex, nofollow`를 붙이고, Vercel 로그인 보호도 켜져 있습니다. 둘 다 유지합니다.

정식 공개 결정 후 순서:

1. 호스팅 결정: 31ns.kr을 Vercel로 옮길지(가비아 DNS 변경 필요) 결정
2. `vercel.json`의 차단 범위를 공개 페이지에서 빼고, 아래 주소에만 남김
   - `/account/(.*)`, `/admin/(.*)`, `/api/(.*)` → `X-Robots-Tag: noindex, nofollow`
   - (회원 · 관리자 페이지는 HTML에도 `<meta name="robots" content="noindex, nofollow">`가 있음)
3. Production 배포에서만 적용되도록 확인(Preview는 계속 차단)
4. 정식 주소에서 확인: 공개 페이지 응답 헤더에 noindex가 없는지, `/account/` · `/admin/`에는 있는지, `/robots.txt` · `/sitemap.xml`이 열리는지, 없는 주소가 404를 주는지
5. 운영 계정 확인 후 소유 확인(구글 · 네이버) → 사이트맵 · RSS 제출
6. 기존 사이트와 주소 차이: 지금 리뉴얼은 기존 주소(`/`, `/2.4ghz.html`, `/en/`, `/blog/`, `/rf-faq/`)를 그대로 씀. GitHub Pages는 `/2.4ghz`도 열렸으므로, 호스팅을 옮기면 `/2.4ghz` → `/2.4ghz.html` 리디렉션을 추가

## 7. 계정과 권한

| 서비스 | 소유 / 위치 | 아빠가 관리하려면 |
|---|---|---|
| GitHub 리뉴얼 저장소 | `shimagnolram/31ns-website` | 협업자로 초대하거나 저장소 이전 |
| Vercel | `shimagnolram` 계정의 팀 `k-spotter1`, 프로젝트 `31ns-website` (Hobby) | Hobby 요금제는 팀원 추가 불가 → 계정 공유 대신 프로젝트 이전 또는 요금제 검토. Hobby는 비상업용 조건도 확인 필요 |
| Supabase | 프로젝트 `31ns-website` (Free, Seoul) | 조직(Organization) 구성원으로 초대 |
| 기존 사이트 GitHub | `promisesmk/31ns-Home_renual_260808` | 아빠 계정 |
| 도메인 DNS | 가비아 | 아빠 계정 (확인 필요) |
| GA4 · Search Console · 서치어드바이저 | 확인 필요 | 기존 운영 계정 확인 후 연결 |
| 설치 파일 배포 저장소 | `shimagnolram/PCB3D-Releases` (**비공개**, 2026-10-16 생성). 릴리스 `v2.1`에 `PCB3D_Builder_Setup_2.1.exe` 1개 | 아빠 계정으로 옮기려면 저장소 이전(Settings → Transfer) 또는 아빠 계정에 새로 만들고 같은 릴리스 업로드. 옮기면 `GITHUB_RELEASE_REPO` 값도 바꿈 |
| Cloudflare (다운로드 전달 Worker) | **계정 연결 · 배포 안 됨** | 아빠 계정으로 새로 진행 (12장) |

계정 · 서버 설정(Vercel 환경변수, Supabase, GitHub, Cloudflare)은 소스 ZIP으로 옮겨지지 않습니다. 각 서비스에서 계정 초대 · 이전 또는 새로 설정해야 합니다.

## 8. 환경변수 (이름과 위치만)

Vercel → 프로젝트 `31ns-website` → Settings → Environment Variables. **현재 모두 Preview + 브랜치 `feature/pcb-viewer` 전용**

| 이름 | 용도 | 상태 |
|---|---|---|
| `SUPABASE_URL` | Supabase 주소 | 설정됨 |
| `SUPABASE_PUBLISHABLE_KEY` | 브라우저용 공개 키 | 설정됨 |
| `SUPABASE_SECRET_KEY` | 서버 전용 비밀 키 (Sensitive) | 설정됨 |
| `MEMBER_ALLOWLIST` | 테스트 기간 허용 이메일 | 설정됨 · 정식 공개 때 삭제 |
| `GITHUB_RELEASES_TOKEN` | 비공개 배포 파일 읽기 토큰 (Sensitive) | **없음** — 인계 후 설정 (12장) |
| `GITHUB_RELEASE_REPO` | 배포 파일 저장소 이름 | 설정됨(2026-10-16): `shimagnolram/PCB3D-Releases` |
| `DOWNLOAD_WORKER_URL` | 다운로드 전달 서버(Cloudflare Worker) 주소 | **없음** — Worker 배포 후 설정 |
| `DOWNLOAD_WORKER_SECRET` | Worker ↔ 사이트 공유 비밀값 (Sensitive) | 설정됨(2026-10-16, 무작위 값). 다시 볼 수 없으므로 Worker를 만들 때 새 값을 만들어 Vercel과 Worker(`REDEEM_SECRET`) 양쪽을 같은 값으로 교체 |

토큰과 Worker 주소가 없는 동안 서버는 GitHub 원본을 ‘미설정’으로 판단합니다. GitHub 릴리스는 공개되지 않고(누락 항목 안내), 티켓 교환 API는 닫혀 있습니다(503).

Sensitive로 저장한 값은 다시 볼 수 없습니다. 로컬 검증이 필요하면 Git · 배포에서 빠지는 `.env.test.local`에 직접 넣고, 끝나면 지웁니다.

## 9. 되돌리기(롤백)

| 상황 | 방법 |
|---|---|
| 검토 주소를 이전 상태로 | Vercel → Deployments → 이전 배포 → Promote / Instant Rollback |
| 코드를 이전 상태로 | 기준 태그: `before-seo-pass1`(이번 SEO 작업 전), `before-pcb3d-builder`, `before-capabilities-update`, `before-seo-design-fix`(SEO 결함 · 흑백 배경 수정 전 `39ffb39`, 이 Mac의 로컬 태그). 예: `git revert` 또는 해당 태그 기준으로 새 브랜치 |
| 31ns.kr | 리뉴얼과 무관. 기존 저장소의 Actions에서 다시 배포하면 됨 |
| Supabase DB | `supabase/schema.sql` → `supabase/002_one_time_download.sql` 순서로 다시 만들 수 있음(데이터는 별도) |

## 10. 보류 · 미검증 항목

- 설치 파일 전달(GitHub Releases → Worker): 코드 · 자동 테스트 완료, GitHub 저장소 · 릴리스 업로드 완료, **토큰 · Worker · 실제 180MB 전송은 미실행** → 12장
- 설명서 PDF: 이 Mac에서 찾지 못함(사용설명서.md v2.1만 있음). 사이트는 HTML 가이드를 유지
- 실기기: 아이폰만 확인(2026-10-09). 안드로이드 · 태블릿 · Safari(Mac) · Firefox는 미확인. 자동 점검은 모두 Chrome 에뮬레이션
- 실제 비밀번호 재설정 메일 · 새 가입 인증 메일 수신 (기본 메일 발송 한도)
- 개인정보 수집 · 이용 안내 문구, 처리방침 (`docs/pcb-viewer/LAUNCH-CHECKLIST.md`)
- 회원가입 · 로그인 · 회원정보 화면(`/account/`)은 한국어만 있음. 영어 PCB 페이지에서 다운로드하면 한국어 로그인 화면으로 갔다가 영어 페이지로 돌아옴
- 관리 화면에서 입력한 설치 안내 · 변경 사항 · 사용 조건은 영어 페이지에도 그대로(입력한 언어로) 표시됨
- PCB 3D 모델 예시 영상은 소개 페이지 ‘한눈에 보기’의 과정 도식 아래에 반영(2026-10-14). 실제 프로그램 실행 화면 캡처는 아직 없음 → 가이드 각 단계에 추가 가능

## 11. PCB 3D Builder 버전 대조 (설치 EXE · PDF 확보 후)

현재 사이트 내용의 근거: 소스 `APP, VER = 'PCB 3D Builder', '2.1'`, 사용설명서(v2.1), `installer.iss`(`AppVer "2.1"`).

- [x] 설치 EXE 확인(2026-10-16): `PCB3D_Builder_Setup_2.1.exe`, 188,209,990바이트, 파일 속성 ProductVersion 2.1 · FileVersion 2.1.0.0, SHA-256 `4001ff6643d8bfbe19167181dfa5ff6f15d3614711981f6befbe0ade5870f019`, **코드 서명 없음**. 위치: 전달 자료 `03_프로그램배포자료/`(같은 파일이 이 Mac의 다운로드 폴더에도 있음). 사이트의 v2.1 표기와 일치. 설치 화면 · 실행은 Windows가 없어 미확인
- [ ] 설명서 PDF: 찾지 못함(`사용설명서.md` v2.1만 있음)
- [ ] 실행 확인: 보드 미리보기(위 · 아래 전환, 앞 · 옆 보기, 확대), 확인 · 보정 창의 고정 각도 3D, PDF로 3D 만들기
- [ ] 버전이 다르면 한 · 영 소개 · 가이드 · 구조화 데이터의 버전 표기 수정
- [x] 가이드 · 소개의 버튼 이름 40개를 소스(`pcb3d/gui.py`) 표기와 대조 완료(2026-10-14). 영어 페이지는 한국어 원래 표기 + 영어 설명 형식
- [ ] 실제 실행으로 확인: 자동 정렬 · PDF 치수 읽기 · 보고서 시트 구성 (현재는 ‘소스 · 설명서 확인’ 단계)
- [ ] 실제 실행 화면 캡처를 ‘한눈에 보기’에 추가 (가짜 화면 금지)

## 12. 현재 상태 요약 (2026-10-17, 최종 전달본 기준)

### 완료된 홈페이지 작업 (검토 주소 반영)
- 한 · 영 메인, 2.4GHz(벤더 비교 · 도식), RF Q&A 50문항, PCB 3D Builder 소개 · 가이드, 기술 블로그 2편, 회원 로그인 · 회사 정보 화면
- SEO 1차 · 결함 수정(파비콘, RF Q&A 레이아웃 이동, 블로그 이미지 크기, 상담 폼 전송 방식), 하위 페이지 흑백 배경 · 색 대비, 상단 · 모바일 메뉴의 기술 블로그 탭 삭제(블로그 페이지 · 하단 링크는 유지), 하위 페이지 → 메인 복귀
- 측정(2026-10-16, Chrome 에뮬레이션 · 검토 주소): 접근성 · 권장사항 14쪽 모두 100, SEO 69는 검토 환경의 의도적 검색 차단 1항목 때문
- 모바일 메뉴 패널: 배경 98% 불투명(`assets/site.css`의 `.mobile-menu`). 뒤 글자가 아주 희미하게 보이는 것은 이 설정 때문이며 메뉴 글자 가독성에는 영향 없음 → 유지
- 메인 영상 교체 · 구도 조정(2026-10-17, 14장) 완료. 최종 영상은 `assets/hero-assembly-v3.mp4`
- 검토용 표시 정리(2026-10-17): PCB 소개 한 · 영 상단의 ‘검토용 · 정식 공개 전 검토 화면’ 배너와 전용 CSS 삭제. Vercel이 미리보기 배포에 띄우는 도구 모음(Vercel Toolbar)은 소스에 없는 것이라 Vercel 프로젝트 설정에서 Preview 표시를 끔(Settings → General → Vercel Toolbar). 접근 보호 · 검색 차단은 그대로
- 남은 표시(내용이 확정되지 않아 유지): PCB 소개 FAQ의 개인정보 보유 기간 ‘확인 예정’ 배지, 회원정보 화면의 ‘개인정보 수집 · 이용 안내 (확정 전)’ 문구, 테스트 파일일 때만 나오는 ‘실제 프로그램 아님’ 배지 — 운영자가 정책을 확정하면 고침 (`docs/pcb-viewer/LAUNCH-CHECKLIST.md` B)
- 홈페이지 쪽 남은 필수 작업: 없음. 이후 작업은 13장(다운로드 연결)과 계정 · 정식 공개 결정

### 기존 실제 검증 (이력)
- 2026-10-09 실제 Supabase DB · 검토 주소 API로 확인(`docs/pcb-viewer/TEST-REPORT.md` F, 커밋 `6e7924f`): 같은 로그인 동시 3건 중 1건만 수락, 한 티켓 동시 교환 5회 중 1회만 성공, 요청 수락 후 서버 로그아웃, 새 로그인 재발급, 파일 준비 실패 시 미차감 · 재시도 성공
- 당시 전달 경로는 **Supabase 저장소의 작은 테스트 파일**(60초 서명 URL). 그 뒤 `api/` · `supabase/` 서버 로직은 바뀌지 않았고, 화면 쪽은 주소 표기(`/index.html` 제거)와 영어 문구만 바뀜 → 이 결과는 해당 로직의 이력으로 유효. 현재 전체 기능을 보증하는 결과는 아님
- 2026-10-16 검토 주소 부하(정적 페이지 초당 10건, `/api/config` 초당 5건까지 오류 0)는 Vercel 정적 · 단순 함수 응답 기준. 회원 · DB 부하나 최대 동시 접속 인원을 뜻하지 않음

### 실제로 확인하지 않은 것
- GitHub Releases → Worker 경로의 실제 전달(토큰, Worker 스트리밍, 약 180MB 전송, 받은 파일 해시 대조)
- 설치 · 실행(Windows), 코드 서명 없는 파일의 Windows 경고 화면
- 비밀번호 재설정 메일 · 새 가입 인증 메일 수신, 안드로이드 · 태블릿 · Safari · Firefox

## 13. 다운로드 연결 이어서 하기 (아빠 인계 후, 설계 변경 없음)

흐름과 보장 범위는 `docs/pcb-viewer/DOWNLOAD-DESIGN.md`. 코드는 이미 있음: `api/download.js`, `api/download-redeem.js`, `workers/pcb3d-download/worker.js` · `wrangler.toml`.

1. **배포 저장소 정하기** — 지금 `shimagnolram/PCB3D-Releases`(비공개, `v2.1` 업로드 완료). 아빠 계정으로 옮길지 결정. 저장소 이름이 바뀌면 Vercel `GITHUB_RELEASE_REPO`도 변경
2. **GitHub 토큰** — 배포 저장소 소유 계정에서 Settings → Developer settings → Fine-grained tokens. 저장소는 그 하나만, Contents: Read-only, 만료일 지정
3. **Vercel 환경변수** (Settings → Environment Variables, Preview · 브랜치 `feature/pcb-viewer`): `GITHUB_RELEASES_TOKEN`(Sensitive) 추가, `DOWNLOAD_WORKER_SECRET`을 새 무작위 값으로 교체(Sensitive)
4. **Cloudflare Worker** — `workers/pcb3d-download`에서 `npx wrangler login` → `npx wrangler deploy` (처음이면 `workers.dev` 하위 도메인 이름 지정). 비밀값은 `npx wrangler secret put REDEEM_SECRET`(3의 값과 같게), 검토 주소가 보호 상태인 동안 `npx wrangler secret put SITE_BYPASS`(Vercel → Settings → Deployment Protection → Protection Bypass for Automation 값)
5. **Vercel `DOWNLOAD_WORKER_URL`** = 4에서 나온 `https://pcb3d-download.<이름>.workers.dev` → 검토 배포 다시 실행(Redeploy)
6. **릴리스 공개** — 관리자 계정으로 `/admin/` → 새 버전 → 파일 원본 ‘GitHub Releases’, 태그 `v2.1`, 파일 이름 `PCB3D_Builder_Setup_2.1.exe`, 설치 안내 · 사용 조건(`사용권계약.txt`) 입력 → 공개(서버가 GitHub에서 파일을 확인하고 이름 · 크기를 채움)
7. **최소 확인** — 허용 목록 회원으로 로그인 → 다운로드 1회 → 받은 파일 크기 · SHA-256을 위 11장 값과 비교, 같은 로그인 재요청 거절, 새 로그인 재발급, 같은 티켓 재사용 410

정식 공개 때는 Worker의 `SITE_ORIGIN`을 정식 주소로 바꾸고 `SITE_BYPASS`를 지우며, Production 환경변수는 따로 설정합니다.

## 14. 메인 영상 교체 기록 (2026-10-17)

- 원본: `hero-new.mp4`(1920×1080, 6.04초, 24fps, H.264, AAC 소리 포함, 5,404,579바이트)
- 우측 하단 워터마크(별 모양): 145프레임 모두 같은 위치, 가로 1750~1816 · 세로 909~976px. 기판 오른쪽 끝(약 1745px)과 4px 떨어져 있음
- 고정 크롭: 좌상단 (20, 0)에서 1728×972 (정확한 16:9, 짝수 크기). 위 · 왼쪽 부품과 커버는 그대로, 오른쪽 끝은 1747px까지라 기판 가장자리는 남고 워터마크는 빠짐. 블러 · 덧칠 없음
- 인코딩 1회: 크롭과 함께 H.264 High, CRF 18, BT.709, 소리 제거, faststart → 2,310,317바이트(원본 구간 대비 SSIM 0.994). 길이 · 속도 · 프레임 수(145) 그대로
- 보관(저장소 · 배포 밖): `~/Desktop/31NS_메인영상_보관_20261017/`
  - `새영상_원본/hero-new.mp4` — 받은 원본 그대로(SHA-256 앞자리 `072cbfef3c5ce851`)
  - `이전영상_백업/hero-assembly.mp4`, `hero-poster.webp` — 교체 전 영상 · 포스터
  - `비교화면/` — 시작 · 중간 · 끝 원본(크롭 영역 표시)과 적용본
- 되돌리기: 이전 영상 두 파일을 `assets/`에 다시 넣고 `index.html` · `en/index.html`의 `#media-hero`와 `assets/home.js`의 파일 이름을 이전 이름으로 바꿈. 또는 Git에서 이 교체 커밋을 `git revert`(이전 파일은 Git 기록에도 있음)
- 배포 범위: 이 사이트는 Git에 커밋된 파일만 Vercel에 배포됨. 원본 · 백업은 저장소 밖에 있어 커밋 · 배포 대상이 아님

### 구도 조정 (2026-10-17, v3)

- 기판이 오른쪽으로 치우쳐 보여 왼쪽 여백을 줄임. 원본에서 다시 한 번에 인코딩(v2를 다시 압축하지 않음)
- 고정 크롭: 좌상단 (136, 0)에서 1612×972 → 원본 가로 136~1747, 세로 전체. 오른쪽 경계(1747)는 v2와 같아 워터마크(1750~)는 계속 빠짐. 위아래는 자르지 않아 비율이 16:9에서 1612:972(약 1.66)로 바뀜
- 기판 왼쪽 아래 모서리(원본 약 x 178) 앞에 약 42px 여백. 기판의 시각적 중심(원본 약 x 961)은 화면 중앙보다 약 19px(1.2%) 오른쪽 — 오른쪽 경계를 유지한 상태에서 기판을 자르지 않는 범위
- 인코딩: H.264 High, CRF 18, BT.709, 소리 없음, faststart → 2,257,557바이트(SSIM 0.994), 145프레임
- 표시: PC는 이전 폭의 95%(1280px 화면에서 1100 → 1045px, 높이 619 → 630px), 가운데 정렬. 태블릿 · 모바일은 폭 그대로(모바일 높이 219 → 235px). 영상 영역은 처음부터 1612:972로 확보, 늘이거나 추가로 자르지 않음
- 보관: `~/Desktop/31NS_메인영상_보관_20261017/v2_백업(워터마크만_크롭)/`에 v2 영상 · 포스터
- v2로 되돌리기: 그 두 파일을 `assets/`에 넣고, 한 · 영 메인 HTML과 `assets/home.js`의 파일 이름을 `-v2`로, HTML의 `width="1612"`를 `1728`로, `assets/site.css`의 `aspect-ratio:1612/972`를 `16/9`로 되돌리고 `.hero .hero-figure` 두 줄을 삭제. 또는 이 조정 커밋을 `git revert`
