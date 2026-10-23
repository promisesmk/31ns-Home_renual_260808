-- PCB 3D Builder 다운로드 신청 · 1회용 코드 · Q&A (Cloudflare D1)
-- 적용: npx wrangler d1 execute pcb3d --remote --file=schema.sql   (로컬 시험은 --local)
-- 여러 번 실행해도 안전합니다.

-- 다운로드 신청 = 방문자가 남긴 글. 승인(approved)되고 공개 동의(publish_ok)한 글만 Q&A에 공개됩니다.
create table if not exists requests (
  id           text primary key,
  created_at   integer not null,              -- Unix ms
  lang         text not null default 'ko',    -- 'ko' | 'en'
  email        text,                          -- 개인정보: 보유 기간이 지나면 지움(null)
  company      text,                          -- 개인정보: 위와 같음
  category     text not null,                 -- 'question' | 'usecase' | 'feature'
  title        text not null,
  body         text not null,
  publish_ok   integer not null default 0,    -- 익명 공개 동의(1)
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  answer       text,                          -- 관리자 답변
  author_label text,                          -- 공개 화면의 작성자 표시(예: 전자부품 업체 엔지니어). 이메일 · 회사명은 공개하지 않음
  reviewed_at  integer,
  ip_hash      text                           -- 신청 횟수 제한용(원래 IP는 저장하지 않음)
);
create index if not exists requests_email_idx on requests (email, created_at);
create index if not exists requests_ip_idx on requests (ip_hash, created_at);
create index if not exists requests_status_idx on requests (status, reviewed_at);

-- 1회용 다운로드 코드. 코드 원문은 저장하지 않고 SHA-256 값만 보관합니다.
create table if not exists codes (
  code_hash   text primary key,
  request_id  text not null references requests (id) on delete cascade,
  created_at  integer not null,
  expires_at  integer not null,
  used_at     integer
);
create index if not exists codes_request_idx on codes (request_id);

-- 홈페이지 개발 상담 문의(메인 페이지 상담 폼). 접수와 동시에 관리자 메일로 보내고, 메일이 실패해도 여기 남습니다.
create table if not exists inquiries (
  id          text primary key,
  created_at  integer not null,
  lang        text not null default 'ko',
  company     text,                 -- 개인정보: 보유 기간이 지나면 지움
  email       text,                 -- 개인정보: 위와 같음
  service     text,
  stage       text,
  schedule    text,
  topic       text,
  message     text,
  mailed      integer not null default 0,
  ip_hash     text
);
create index if not exists inquiries_ip_idx on inquiries (ip_hash, created_at);

-- 새 버전 알림(선택 동의). 다운로드 신청의 1년 삭제와 별개로, 수신 거부(메일의 링크)할 때까지 보관합니다.
create table if not exists subscribers (
  email       text primary key,
  lang        text not null default 'ko',
  created_at  integer not null,
  request_id  text                         -- 동의를 받은 신청(신청이 지워져도 남음)
);

-- 버전별 안내 메일 발송 기록. 같은 버전(tag)은 한 번만 보냅니다.
create table if not exists notices (
  tag         text primary key,
  sent_at     integer not null,
  recipients  integer not null default 0,
  failed      integer not null default 0
);
