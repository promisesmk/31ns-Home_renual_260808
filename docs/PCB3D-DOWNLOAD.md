# PCB 3D Builder 다운로드 · Q&A 운영 문서

2026-10-18 기준. 이전의 회원 로그인 방식(Vercel + Supabase, `docs/pcb-viewer/DOWNLOAD-DESIGN.md`)을 대체합니다.

## 1. 구조

```
31ns.kr (GitHub Pages, 정적)                  Cloudflare Worker pcb3d-api (+ D1 DB)        GitHub (비공개)
PCB 3D Builder 페이지 ──신청(글)──────────────▶ /api/request  → 글 저장 · 1회용 코드 발급
                     ◀─코드 XXXX-XXXX───────┘   └─ 관리자에게 알림 메일(Resend)
                     ──코드로 다운로드───────────▶ /download    → 코드 사용 처리 ─────────▶ promisesmk/PCB3D-Releases
                     ◀─설치 파일(스트리밍)────────┘                  (토큰은 Worker에만)      최신(Latest) 릴리스의 .exe
배포(Run workflow) ──승인된 글 요청──────────────▶ /api/qna    → /pcb-viewer/qna/ 정적 페이지 생성
```

| 구성 | 위치 |
|---|---|
| 신청 폼 · 코드 입력 화면 | `pcb-viewer/index.html`, `en/pcb-viewer/index.html`, 동작 `assets/pcb-viewer.js` |
| 서버 주소 · 스팸 방지 공개 키 | `assets/pcb3d-config.js` |
| 서버 | `workers/pcb3d-api/src/index.js`, 설정 `wrangler.toml`, DB 구조 `schema.sql` |
| Q&A 페이지 생성 | `tools/build_qna.py` (배포 때 GitHub Actions가 실행, 결과는 커밋하지 않음) |
| 시험 | `tests/worker.test.mjs` |

## 2. 규칙

- **코드**: 신청자 이메일로만 발송(화면에 표시 안 함), 10분 안에 1번. [코드 다시 보내기]는 신청 1건당 3번까지(30초 간격), 새 코드를 보내면 이전 코드는 무효. 동시에 여러 번 눌러도 1번만 전송(DB 원자적 처리). 파일 준비에 실패하면 코드는 쓰지 않은 상태로 돌아감
- **횟수 제한**: 같은 이메일 하루 3번, 같은 접속 위치(IP) 하루 5번
- **스팸 방지**: Cloudflare Turnstile + 숨은 입력 칸 + 본문 20자 이상
- **설치 파일**: 항상 `PCB3D-Releases`의 **Latest 릴리스**에서 `.exe` 파일 하나. 새 버전은 GitHub에 릴리스를 올리기만 하면 됨(10분 안에 반영)
- **설명서**: 같은 릴리스의 `.pdf`, 코드 없이 열람 (`/manual`)
- **개인정보**: 이메일 · 회사명은 1년 뒤 자동 삭제(매일 03:00 KST). 삭제 요청이 오면 관리 화면에서 확인 후 D1에서 지움(아래 6장). 공개 Q&A에는 절대 나가지 않음
- **공개**: 작성자가 공개에 동의하고 관리자가 승인한 글만, 다음 배포(Run workflow) 때 `/pcb-viewer/qna/`에 공개

## 3. 운영자가 하는 일

| 상황 | 방법 |
|---|---|
| 새 글 알림 | `nskim@31ns.kr`로 메일이 옴 → [승인] · [거절] · [답변 쓰기] → 열린 화면에서 확인 버튼 |
| 글 목록 보기 | `https://pcb3d-api.31ns-tech.workers.dev/admin` → 사용자 이름은 아무거나, 비밀번호는 `ADMIN_SECRET` |
| 승인한 글을 홈페이지에 반영 | 자동: 매일 03:00(KST) 배포 때 공개. 바로 올리려면 GitHub → Actions → Deploy → Run workflow (main) |
| 새 버전 안내 메일 | **자동:** 릴리스를 올리면 다음 03:00(KST) 점검 때 `nskim@31ns.kr`로 미리보기 메일(바뀐 점은 릴리스 설명에서 마크다운 기호를 뺀 글)이 오고, 그다음 03:00 점검에 동의자에게 자동 발송. 멈추려면 미리보기 메일의 [자동 발송하지 않기]. 유예 시간은 `wrangler.toml`의 `NOTICE_DELAY_HOURS`. **수동:** `https://pcb3d-api.31ns-tech.workers.dev/admin/notify` (관리자 비밀번호) → 바뀐 점 문구 확인 · 수정 → [안내 메일 보내기]. 영어 수신자에게는 릴리스 설명이 한국어면 바뀐 점 없이 새 버전 소식만 감. 다운로드 때 “새 버전 알림 받기”에 동의한 사람(`subscribers` 표)에게만 갑니다. 같은 버전은 한 번만 보낼 수 있고, 전부 실패하면 다시 보낼 수 있습니다. 메일마다 수신 거부 링크(메일 앱의 구독 취소 버튼 포함)가 들어가며, 누르면 명단에서 바로 지워집니다 |
| 새 버전 배포 | `PCB3D-Releases`에 새 릴리스(설치 파일 .exe, 설명서 .pdf) 올리고 Latest로 지정 |

메일의 버튼은 바로 처리하지 않고 확인 화면을 엽니다. 회사 메일의 보안 검사기가 링크를 자동으로 열어도 승인 · 거절되지 않게 하기 위해서입니다.

## 4. 처음 설정 (한 번)

대표님이 할 일: Cloudflare 가입, 터미널에서 `npx wrangler login`, Resend 가입 · 가비아 DNS. 나머지는 아래 순서.

```bash
cd workers/pcb3d-api
npx wrangler d1 create pcb3d                      # 나온 database_id를 wrangler.toml에 넣음
npx wrangler d1 execute pcb3d --remote --file=schema.sql
npx wrangler secret put GITHUB_TOKEN              # PCB3D-Releases 읽기 토큰
npx wrangler secret put TURNSTILE_SECRET          # Cloudflare → Turnstile → 위젯(도메인 31ns.kr) 비밀 키
npx wrangler secret put RESEND_API_KEY            # Resend → API Keys (31ns.kr 도메인 인증 후)
npx wrangler secret put ADMIN_SECRET              # 길고 무작위인 값. 관리 화면 비밀번호 겸 링크 서명
npx wrangler deploy                               # 나온 주소: https://pcb3d-api.31ns-tech.workers.dev
```

그 다음:
1. `assets/pcb3d-config.js`의 `PRODUCTION.api`(위 주소), `turnstileSiteKey`(Turnstile 사이트 키)를 바꿔 커밋
2. GitHub 저장소 → Settings → Secrets and variables → Actions → **Variables**에 `PCB3D_API` = 위 주소
3. 실제로 신청 1번 → 받은 파일의 SHA-256이 릴리스 화면 값과 같은지 확인

## 5. 로컬 시험 (계정 없이)

```bash
cp workers/pcb3d-api/.dev.vars.example workers/pcb3d-api/.dev.vars
cd workers/pcb3d-api && npx wrangler d1 execute pcb3d --local --file=schema.sql && cd ../..
npm run worker            # 터미널 1: 서버 http://127.0.0.1:8787 (가짜 설치 파일)
python3 -m http.server 8000   # 터미널 2: 홈페이지 http://localhost:8000/pcb-viewer/#download
npm test                  # 터미널 3: 서버 자동 시험 11개
```

## 6. 개인정보 삭제 요청

```bash
cd workers/pcb3d-api
npx wrangler d1 execute pcb3d --remote --command "update requests set email = null, company = null where email = '요청한주소@example.com'"
```

## 7. 개발 상담 문의 (메인 페이지 상담 폼)

- 2026-10-18부터 방문자의 메일 앱을 열지 않고 서버(`POST /api/inquiry`)로 바로 접수합니다. 이전 사이트는 FormSubmit으로 보냈습니다
- 접수하면 D1 `inquiries`에 저장하고 `ADMIN_EMAIL`(nskim@31ns.kr)로 메일을 보냅니다. **답장하면 문의한 분에게 바로 갑니다**(Reply-To)
- 메일이 실패해도 관리 화면(`/admin`) 맨 위 "개발 상담 문의"에 남습니다("메일 실패" 표시)
- 스팸 방지: Turnstile + 숨은 칸, 같은 접속 위치 하루 10건. 회사명 · 이메일은 1년 뒤 자동 삭제
- 화면: `index.html` · `en/index.html`의 `#inquiry-form`, 동작 `assets/home.js`

## 8. 한계

- 받은 설치 파일을 다른 사람에게 전달하는 것은 막지 못함(사용권 계약도 원본 무상 전달은 허용)
- 전송이 중간에 끊기면 그 코드는 사용된 것으로 처리됨 → 새로 신청
- 코드를 24시간 안에 다른 사람에게 알려 주면 그 사람이 대신 받을 수 있음(1번만)
