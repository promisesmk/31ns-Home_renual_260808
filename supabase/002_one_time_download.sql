-- 002: one download per login + GitHub Releases as the file source.
-- Run once in the Supabase SQL Editor after schema.sql. Safe to run again.

-- Release file source: 'github' (private GitHub Releases, production) or 'storage' (review test files only).
alter table public.viewer_releases add column if not exists source text not null default 'storage';
alter table public.viewer_releases add column if not exists github_tag text;
alter table public.viewer_releases add column if not exists github_asset text;
alter table public.viewer_releases drop constraint if exists viewer_releases_source_check;
alter table public.viewer_releases add constraint viewer_releases_source_check check (source in ('storage', 'github'));
alter table public.viewer_releases alter column program_name set default 'PCB 3D Builder';

-- One row per accepted download request. session_id is the Supabase login session in the access token:
-- the unique constraint lets exactly one request per login win, even when requests arrive at the same time
-- or an old token is replayed after logout.
create table if not exists public.download_grants (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  release_id  uuid not null references public.viewer_releases (id) on delete cascade,
  session_id  uuid not null,
  status      text not null default 'issued' check (status in ('issued', 'redeemed')),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  redeemed_at timestamptz,
  constraint download_grants_one_per_login unique (session_id)
);
create index if not exists download_grants_user_idx on public.download_grants (user_id);

alter table public.download_grants enable row level security;
revoke all on table public.download_grants from anon, authenticated;
grant select, insert, update, delete on table public.download_grants to service_role;

-- Atomically turns an unexpired 'issued' grant into 'redeemed'. Returns no row if it was already used,
-- expired or unknown, so a ticket link can start at most one transfer.
create or replace function public.redeem_download_grant(grant_id uuid)
returns table (release_id uuid, user_id uuid)
language sql
security definer
set search_path = public
as $$
  update download_grants
     set status = 'redeemed', redeemed_at = now()
   where id = grant_id and status = 'issued' and expires_at > now()
  returning download_grants.release_id, download_grants.user_id;
$$;

revoke all on function public.redeem_download_grant(uuid) from public, anon, authenticated;
grant execute on function public.redeem_download_grant(uuid) to service_role;

-- Self-check: expect rls_enabled = true, browser_grants = 0, server_grants = 4 for download_grants,
-- and has_source_column = true.
select 'download_grants' as table_name,
       (select relrowsecurity from pg_class where oid = 'public.download_grants'::regclass) as rls_enabled,
       (select count(*) from information_schema.role_table_grants
         where table_schema = 'public' and table_name = 'download_grants' and grantee in ('anon', 'authenticated')) as browser_grants,
       (select count(*) from information_schema.role_table_grants
         where table_schema = 'public' and table_name = 'download_grants' and grantee = 'service_role'
           and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')) as server_grants,
       exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = 'viewer_releases' and column_name = 'source') as has_source_column;
