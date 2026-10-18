# PCB 3D Builder 설치 파일 전달 설계 (검토안)

- 작성: 2026-10-09 · 브랜치 `feature/pcb-viewer`
- 상태(2026-10-17): 서버 검증 로직 구현 · 자동 테스트 완료, 1회 발급 · 티켓 DB 동작은 실제 DB로 확인(2026-10-09, `TEST-REPORT.md` F). 배포 저장소 `shimagnolram/PCB3D-Releases`(비공개) · 릴리스 `v2.1` 업로드 완료. Worker는 코드 · `wrangler.toml`만 있고 **Cloudflare 계정 연결 · 배포 안 됨**, GitHub 토큰 미설정 → 실제 전달 경로 미검증. 이어서 할 순서는 `docs/HANDOFF.md` 13장
- 전제: 회원 로그인 · 회사 정보 입력 방식 유지, 파일 원본은 비공개 GitHub Releases

## 1. 왜 GitHub 임시 URL을 브라우저에 주면 안 되나

비공개 릴리즈 파일을 요청하면 GitHub가 **몇 분짜리 서명 URL**로 보내 줍니다. 이 URL은
유효 시간 안에는 **누구나, 몇 번이든** 쓸 수 있습니다. 브라우저에 넘기면 주소를 복사해 다른 사람에게 줄 수 있고,
“한 번만”을 보장할 수 없습니다. 그래서 이 URL은 **서버끼리만** 주고받고, 브라우저에는 한 번만 쓸 수 있는 **티켓 주소**만 줍니다.

## 2. 흐름

```
브라우저 ──① POST /api/download (로그인 토큰)──▶ Vercel API
           ◀─② 티켓 주소 https://<worker>/d/<티켓>─┘   · 로그인 · 이메일 인증 · 회사 정보 확인
              (응답과 동시에 서버가 이 로그인을 종료,       · 이 로그인(session_id)으로 처음인지 DB에서 원자적으로 확인
               브라우저도 로그아웃)                         · 티켓 발급(2분 유효)
브라우저 ──③ GET 티켓 주소──▶ Cloudflare Worker
                             ──④ POST /api/download-redeem (공유 비밀값)──▶ Vercel API
                                                                          · 티켓을 원자적으로 ‘사용됨’ 처리
                             ◀─⑤ GitHub 임시 URL(서버끼리만)──────────────┘ · GitHub 토큰은 Vercel에만
                             ──⑥ GitHub 저장소에서 파일을 받아 그대로 흘려보냄(스트리밍)
브라우저 ◀─⑦ 설치 파일 (Content-Disposition: attachment)
```

## 3. 보장하는 것

| 상황 | 동작 | 근거 |
|---|---|---|
| 다운로드 요청이 받아들여짐 | 로그인 1회분 소진, 서버에서 그 로그인 세션 종료(`admin.signOut`), 브라우저 로그아웃 | `api/download.js` |
| 같은 로그인으로 다시 요청(토큰 재사용) | 서버가 로그인을 종료해 토큰이 무효 → 401, 종료 전이면 409 `login_already_used` → 어느 쪽이든 다시 로그인 화면 | 서버 로그아웃 + `download_grants.session_id` UNIQUE (실제 DB 확인) |
| 같은 로그인으로 동시에 여러 번 요청 | 정확히 1건만 성공 | DB 고유 제약(동시 요청도 하나만 삽입됨) |
| 다시 받기 | 새로 로그인(새 session_id)하면 가능 | |
| 파일 준비 실패(설정 누락, 파일 없음) | **소진하지 않음**, 같은 로그인으로 재시도 가능 | 전달 준비 후에 티켓 발급 |
| 티켓 주소 두 번째 사용 · 동시 사용 | 1건만 전송, 나머지 410 안내 페이지 | `redeem_download_grant()` 원자적 UPDATE |
| 티켓 2분 경과 | 410 → 다시 로그인 | `expires_at` |
| GitHub 임시 URL · GitHub 토큰 | 브라우저에 전달하지 않음 | Worker가 서버끼리 받아 스트리밍 |
| 이어받기(Range) 요청 | 전달하지 않음(처음부터 전체) | 사용된 티켓으로 부분 재요청 불가 |

## 4. 한계 (보고)

1. **받은 파일 자체의 재배포는 막지 못합니다.** 사용권 계약 2항도 “원본 설치 파일 그대로 무상 전달”을 허용합니다. 이 설계는 *사이트에서의 다운로드*를 회원 · 1회로 통제하는 것입니다.
2. **전송이 중간에 끊기면 다시 로그인해야 합니다.** 이어받기를 허용하면 1회 보장이 약해지므로 막았습니다. 여러 연결로 나눠 받는 다운로드 관리자는 두 번째 연결부터 실패할 수 있습니다.
3. **응답이 브라우저에 도착하기 전에 끊긴 경우**(서버는 수락, 브라우저는 못 받음)에도 소진됩니다 → 다시 로그인.
4. **티켓 주소를 2분 안에 가로채면** 대신 받을 수 있습니다(HTTPS로 전송, 1회 · 2분 제한으로 위험을 줄임).
5. 로그인 토큰(JWT)은 만료(기본 1시간) 전까지 다른 회원 API(회사 정보 조회 등)에는 유효합니다. 다운로드만 막힙니다.
6. 아직 **실제 Cloudflare · GitHub · 180MB 파일로 시험하지 않았습니다**. 가짜 사이트 · 가짜 저장소로 5MB 스트리밍만 자동 테스트했습니다.

## 5. 아빠 문서(Cloudflare Worker + 인증키) 검토

| 항목 | 아빠 문서 | 이 설계 |
|---|---|---|
| 자격 확인 | 인증키(KV: 만료일 · 남은 횟수) | 회원 로그인 · 이메일 인증 · 회사 정보(Supabase) |
| 1회 사용 | KV `remaining` 감소 — KV는 즉시 일관성이 아니라 동시 요청 시 중복 가능 | Postgres 고유 제약 + 원자적 UPDATE |
| 브라우저에 주는 것 | **GitHub 임시 URL 그대로** (몇 분간 재사용 가능) | Worker 티켓 주소(1회 · 2분), 파일은 Worker가 스트리밍 |
| GitHub 토큰 위치 | Worker 비밀값 | Vercel 서버 환경변수(Worker에는 공유 비밀값만) |
| 대용량(약 180MB) | 브라우저가 GitHub에서 직접 받음 | Worker가 그대로 흘려보냄(버퍼링 없음) |

결론: Worker 방식은 **회원 인증과 연결 가능**합니다. 인증키 대신 Vercel이 발급한 1회용 티켓을 Worker가 확인하게 바꾸고,
임시 URL을 넘기는 대신 Worker가 직접 스트리밍하면 재사용 가능한 원본 URL이 노출되지 않습니다.
초안: `workers/pcb3d-download/worker.js` (배포 안 함), 테스트: `tests/worker.test.mjs`.

### 다른 선택지

| 방법 | 장점 | 문제 |
|---|---|---|
| Vercel 함수가 직접 스트리밍 | 서비스 추가 없음 | 함수 실행 시간 · 전송량 한도(Hobby), 느린 회선에서 180MB가 시간 안에 끝나지 않을 수 있음, Hobby는 비상업용 |
| Supabase Storage 유료(Pro) | 지금 구조 그대로 | 월 요금, 서명 URL은 유효 시간 동안 재사용 가능 |
| GitHub 임시 URL 직접 전달 | 가장 단순 | 1회 보장 불가 (위 1장) |

## 6. 실제로 켜려면 (운영자 승인 후)

1. Supabase SQL Editor에서 `supabase/002_one_time_download.sql` 실행
2. 비공개 `PCB3D-Releases` 저장소 · 릴리즈(`v2.1`) — **완료(2026-10-16)**: `shimagnolram/PCB3D-Releases`에 `PCB3D_Builder_Setup_2.1.exe`(188,209,990바이트, SHA-256 일치) 업로드. 아빠 계정으로 옮길지는 인계 때 결정
3. GitHub **Fine-grained token**: 저장소 `PCB3D-Releases`만, Contents 읽기 전용, 만료일 설정
4. Cloudflare 계정(무료) → Worker 배포(`workers.dev` 주소로 시작하면 31ns.kr DNS 변경 불필요)
5. Vercel(Preview 또는 Production) 환경변수

   | 이름 | 내용 |
   |---|---|
   | `GITHUB_RELEASES_TOKEN` | 3의 토큰 (Sensitive) |
   | `GITHUB_RELEASE_REPO` | 배포 저장소 이름 (현재 `shimagnolram/PCB3D-Releases`, Preview에 설정됨) |
   | `DOWNLOAD_WORKER_URL` | Worker 주소 |
   | `DOWNLOAD_WORKER_SECRET` | 임의의 긴 비밀값 (Sensitive, Worker의 `REDEEM_SECRET`과 같은 값) |

6. 검토 배포가 Vercel 보호 상태면 Worker가 API를 부를 수 있도록 Vercel **Protection Bypass for Automation** 값을 Worker 비밀값 `SITE_BYPASS`로 등록
7. 관리 화면 → 새 버전 → 파일 원본 ‘GitHub Releases’, 태그 `v2.1`, 파일 이름 입력 → 공개(서버가 GitHub에서 파일 확인)

### 함께 정할 것

- 정식 사이트를 어디서 운영할지: 지금 31ns.kr은 GitHub Pages(`31ns-Home_renual_260808`), 회원 · 다운로드 API는 Vercel 검토 환경에 있음
- Cloudflare 무료 한도(일일 요청 수 등)와 Vercel 요금제는 계정을 만들 때 최신 조건을 다시 확인
