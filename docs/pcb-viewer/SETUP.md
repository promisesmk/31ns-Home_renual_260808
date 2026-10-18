> **2026-10-18 변경:** 31ns.kr은 GitHub Pages(`promisesmk/31ns-Home_renual_260808`)에서 운영하고, 회원 로그인(Vercel · Supabase)은 제거했습니다. 다운로드 · Q&A는 [PCB3D-DOWNLOAD.md](../PCB3D-DOWNLOAD.md)를 보세요. 이 문서의 Vercel · Supabase · 회원 관련 내용은 이전 기록입니다.

# PCB 3D Builder · 회원 다운로드 운영 안내

이 폴더는 배포되지 않습니다(`.vercelignore`). 운영자용 문서입니다.

## 구성

| 역할 | 위치 |
|---|---|
| 소개 페이지 | `/pcb-viewer/index.html` |
| 로그인 · 회사 정보 | `/account/index.html` |
| 관리자 화면 | `/admin/index.html` (메뉴에 노출하지 않음) |
| 서버 API | `/api/config`, `/api/release`, `/api/profile`, `/api/download`, `/api/admin` |
| DB · 저장소 구조 | `supabase/schema.sql` |
| 권한 테스트 | `npm test` (가짜 Supabase로 서버 권한 로직 검사) |

- 인증 · DB · 비공개 파일 저장소: **Supabase** (31NS 전용 새 프로젝트)
- 브라우저에는 공개용 키(publishable)만 전달됩니다. 비밀 키는 Vercel 서버 환경변수에만 둡니다.
- 정식 설치 파일(v2.1, 약 188MB)은 Supabase 무료 플랜의 파일 크기 한도(50MB)를 넘으므로 비공개 GitHub Releases → Cloudflare Worker로 전달합니다(`DOWNLOAD-DESIGN.md`, 연결 순서는 `docs/HANDOFF.md` 13장). 비공개 버킷 `viewer-releases`와 60초 서명 URL은 검토용 작은 테스트 파일에만 씁니다.

## 1. Supabase 연결 (한 번만)

1. https://supabase.com 에서 계정을 만들고 **새 프로젝트**를 만듭니다. 이름 예: `31ns-website`, 지역: Northeast Asia (Seoul). 다른 앱의 프로젝트는 쓰지 않습니다.
2. 프로젝트의 **SQL Editor**에 `supabase/schema.sql`, 이어서 `supabase/002_one_time_download.sql` 내용을 붙여넣고 실행합니다. 마지막 확인 쿼리 결과가 네 테이블 모두 `rls_enabled = true`, `browser_grants = 0`, `server_grants = 4`여야 합니다.
   - 프로젝트 설정 ‘Automatically expose new tables’가 꺼져 있으므로, 서버 역할(`service_role`)에만 필요한 권한을 직접 부여합니다. 브라우저 역할(`anon`, `authenticated`)에는 권한이 없습니다.
3. **Project Settings → API Keys**에서 아래 값을 확인합니다.
   - Project URL
   - Publishable key (`sb_publishable_…`)
   - Secret key (`sb_secret_…`) — 절대 브라우저 코드나 Git에 넣지 않습니다.
4. Vercel 대시보드 → `31ns-website` → Settings → Environment Variables에 추가합니다. **현재 설정(검토 단계)**: 환경은 **Preview**만, 브랜치는 **`feature/pcb-viewer`**만 선택했습니다. Production에는 아직 넣지 않았습니다.

   | 이름 | 값 | Sensitive |
   |---|---|---|
   | `SUPABASE_URL` | Project URL (`/rest/v1/`이 붙어 있어도 코드가 기본 주소만 사용) | 끔 |
   | `SUPABASE_PUBLISHABLE_KEY` | Publishable key | 끔 |
   | `SUPABASE_SECRET_KEY` | Secret key | **켬** |
   | `MEMBER_ALLOWLIST` | 테스트 계정 이메일, 쉼표로 구분 | 끔 |
   
   - `MEMBER_ALLOWLIST`가 있으면 목록에 있는 이메일만 회원 기능을 쓸 수 있습니다. 정식 공개 때 지웁니다.
   - Sensitive로 저장한 비밀 키는 CLI(`vercel env pull`)로도 내려받을 수 없습니다. 로컬 검증이 필요하면 Git · 배포에서 제외되는 `.env.test.local` 파일에 직접 넣고, 끝나면 삭제합니다.
5. **Authentication → URL Configuration** (현재 설정)
   - Site URL: `https://31ns-website-git-feature-pcb-viewer-k-spotter1.vercel.app`
   - Redirect URLs: `https://31ns-website-git-feature-pcb-viewer-k-spotter1.vercel.app/**`
   - 정식 공개 때 Site URL과 Redirect URLs에 정식 도메인을 넣습니다.
6. **로그인 방식**: 이메일 + 비밀번호(Supabase Auth). 가입할 때만 이메일 인증을 하고, 비밀번호 재설정도 메일 링크로 진행합니다. 비밀번호는 Supabase Auth에만 저장되며 우리 서버 · DB로 전달되지 않습니다.
   - Supabase **Authentication → Sign In / Providers → Email**에서 ‘Confirm email’이 켜져 있어야 합니다(현재 켜짐).
   - 권장: 같은 화면의 최소 비밀번호 길이를 8자로 맞춥니다(화면에서도 8자 이상 · 영문+숫자를 요구).
   - 메일 템플릿 수정은 별도 SMTP 연결 후 가능합니다. 지금은 Supabase 기본 영어 메일이 발송됩니다.
7. 환경변수를 바꾼 뒤에는 Vercel에서 검토용 배포를 다시 실행(Redeploy)합니다.

검증 결과는 `TEST-REPORT.md`에 있습니다.

### 메일 발송 한도

Supabase 기본 메일 서버는 **테스트용**입니다. 시간당 발송 수가 매우 적고, 프로젝트 팀원 주소로만 보내질 수 있습니다.
정식 공개 전에는 별도 메일 발송 서비스(SMTP, 예: Resend 무료 플랜)를 연결해야 하고, 이때 `31ns.kr` 도메인 DNS에 인증 레코드를 추가해야 합니다. DNS 변경은 운영자 승인 후 진행합니다.

## 2. 관리자 지정

관리자는 화면에서 스스로 지정할 수 없습니다. 운영자가 SQL Editor에서 직접 추가합니다.

1. 관리자로 쓸 이메일로 `/account/index.html`에서 한 번 로그인합니다.
2. SQL Editor에서 실행합니다.
   ```sql
   insert into public.site_admins (user_id, note)
   select id, '운영자' from auth.users where email = '관리자이메일@31ns.kr';
   ```
3. 해제할 때:
   ```sql
   delete from public.site_admins
   where user_id = (select id from auth.users where email = '관리자이메일@31ns.kr');
   ```

## 3. 설치 파일 등록 · 공개

> 정식 설치 파일은 GitHub Releases를 원본으로 씁니다. 전달 구조와 필요한 설정은 `DOWNLOAD-DESIGN.md`를 보세요. 아래 업로드 방식은 50MB 이하 **검토용 테스트 파일**에만 씁니다.


1. 관리자 계정으로 로그인 후 `/admin/index.html`로 이동합니다.
2. **새 버전 등록** → 프로그램명 · 버전 · 운영체제 · 설치 안내 · 변경 사항 · 사용 조건 입력 → **정보 저장**
3. 설치 파일 선택 → **파일 업로드**. 업로드가 끝나면 서버가 저장소에 파일이 실제로 있는지 확인한 뒤 연결합니다.
4. 내용을 확인하고 **공개**. 필수 항목(프로그램명 · 버전 · 운영체제 · 설치 안내 · 사용 조건 · 설치 파일)이 비어 있으면 공개되지 않고 빠진 항목을 알려 줍니다.
5. 공개하면 소개 페이지의 버튼이 ‘무료 다운로드’로 바뀝니다. 기존 공개 버전은 자동으로 비공개가 됩니다.

- 새 버전 업로드가 실패해도 기존 공개 버전은 그대로 유지됩니다(공개 전환은 마지막 단계에서 한 번에 처리).
- 공개 중인 버전의 파일은 바꿀 수 없습니다. 새 버전으로 등록하세요.
- 테스트 파일은 ‘검토용 테스트 파일’에 체크합니다. 소개 페이지에 ‘실제 프로그램 아님’으로 표시됩니다. 검토가 끝나면 비공개로 바꾸고 삭제합니다.
- 파일 크기: Supabase 무료 플랜은 파일 하나당 **최대 50MB**입니다. 설치 파일이 더 크면 유료 플랜(Pro, 월 $25부터)이 필요합니다.

## 4. 프로그램 화면 · 영상 넣기

소개 페이지 ‘한눈에 보기’의 예시 영상은 `assets/pcb3d-demo.mp4` · `assets/pcb3d-demo-poster.webp`입니다. 교체 방법은 `docs/HANDOFF.md` 4장 표의 ‘PCB 소개 영상’ 행을 보세요. 실제 프로그램 실행 화면은 아직 없습니다(가짜 화면은 넣지 않음).

## 5. 비용 (2026-10 기준, 공개 전 다시 확인)

- Supabase Free: 월 사용자 5만 명, DB 500MB, 파일 저장 1GB, 다운로드 전송량 5GB. 1주일간 사용이 없으면 프로젝트가 일시 정지됩니다(대시보드에서 다시 켬).
- Vercel Hobby(현재 사용 중): 개인 · 비상업용 플랜입니다. 회사 사이트로 정식 운영하려면 Pro 플랜 검토가 필요합니다.
