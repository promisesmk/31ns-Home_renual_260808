-- 31NS PCB 3D Viewer: member downloads and admin release management.
-- Run once in the Supabase SQL Editor of the dedicated 31NS project.
-- After this file, also run 002_one_time_download.sql (one download per login, GitHub Releases source).
-- Browsers never talk to these tables directly: every read and write goes through
-- the /api functions, which use the secret key and check the user on the server.

-- Member company information (one row per signed-in user)
create table if not exists public.member_profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  company      text not null check (char_length(company) between 1 and 120),
  contact_name text not null check (char_length(contact_name) between 1 and 60),
  job_title    text check (char_length(job_title) <= 60),
  purpose      text check (char_length(purpose) <= 500),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Administrators. Rows are added only by the operator in the SQL Editor (see docs).
create table if not exists public.site_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

-- Program releases. Uploading and publishing are separate steps.
create table if not exists public.viewer_releases (
  id             uuid primary key default gen_random_uuid(),
  program_name   text not null default 'PCB 3D Builder',
  version        text not null default '',
  os             text not null default '',
  install_guide  text not null default '',
  changelog      text not null default '',
  terms          text not null default '',
  is_test        boolean not null default false,
  file_path      text,
  file_name      text,
  file_size      bigint,
  status         text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  published_at   timestamptz
);

-- At most one release can be public at a time.
create unique index if not exists viewer_releases_one_published
  on public.viewer_releases ((status)) where status = 'published';

create table if not exists public.download_logs (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  release_id  uuid not null references public.viewer_releases (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Lock everything down: RLS on, no policies. Only the server's secret key can read or write.
alter table public.member_profiles enable row level security;
alter table public.site_admins     enable row level security;
alter table public.viewer_releases enable row level security;
alter table public.download_logs   enable row level security;

-- The project has "Automatically expose new tables" off, so API roles get no access by default.
-- Grant only the server role (secret key). Browser roles (anon, authenticated) stay without access.
revoke all on table public.member_profiles, public.site_admins, public.viewer_releases, public.download_logs
  from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on table
  public.member_profiles, public.site_admins, public.viewer_releases, public.download_logs
  to service_role;
grant usage, select on sequence public.download_logs_id_seq to service_role;

-- Swap the public release in one transaction, so a failed publish never leaves the page without a version.
create or replace function public.publish_viewer_release(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update viewer_releases set status = 'unpublished', updated_at = now()
   where status = 'published' and id <> target;
  update viewer_releases set status = 'published', published_at = now(), updated_at = now()
   where id = target;
  if not found then
    raise exception 'release % not found', target;
  end if;
end;
$$;

revoke all on function public.publish_viewer_release(uuid) from public, anon, authenticated;
grant execute on function public.publish_viewer_release(uuid) to service_role;

-- Private bucket for installers. Not public: files are only reachable through short-lived signed URLs.
-- No storage policies are added: browsers cannot list or read the bucket. Uploads use one-time
-- signed upload tokens and downloads use signed URLs, both issued by the server after its checks.
insert into storage.buckets (id, name, public, file_size_limit)
values ('viewer-releases', 'viewer-releases', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

-- Self-check: run after the script. Expect rls_enabled = true for all four tables,
-- browser_grants = 0 and server_grants = 4 (SELECT/INSERT/UPDATE/DELETE).
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       (select count(*) from information_schema.role_table_grants g
         where g.table_schema = 'public' and g.table_name = c.relname and g.grantee in ('anon', 'authenticated')) as browser_grants,
       (select count(*) from information_schema.role_table_grants g
         where g.table_schema = 'public' and g.table_name = c.relname and g.grantee = 'service_role'
           and g.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')) as server_grants
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relname in ('member_profiles', 'site_admins', 'viewer_releases', 'download_logs')
 order by 1;
