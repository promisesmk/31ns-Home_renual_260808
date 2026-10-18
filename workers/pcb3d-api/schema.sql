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
