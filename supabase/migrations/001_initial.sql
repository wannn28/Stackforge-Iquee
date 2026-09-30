-- Stackforge-Iquee initial schema.
-- Apply on the Supabase Postgres database (SQL editor or psql against the
-- direct 5432 connection). auth.users, auth.uid(), and the anon /
-- authenticated / service_role roles already exist on Supabase.
--
-- Deny-by-default: RLS is enabled and anon has no table privileges.
-- service_role bypasses RLS and must stay on the server.

begin;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('admin', 'member', 'viewer');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role public.app_role not null default 'member',
  avatar_url text,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint profiles_email_unique unique (email)
);

comment on table public.profiles is
  'One row per auth user. Created by handle_new_user. Role changes are admin-only.';

create table public.records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'open',
  -- Defaults to the signed-in user. Service-role inserts with no JWT store null
  -- unless owner_id is set explicitly. RLS still requires owner_id = auth.uid()
  -- for non-admins.
  owner_id uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint records_title_not_blank check (char_length(btrim(title)) > 0),
  constraint records_status_not_blank check (char_length(btrim(status)) > 0)
);

comment on table public.records is
  'Application records. Owners CRUD their own rows; admins CRUD every row.';

comment on column public.records.owner_id is
  'Set null when the owning profile is removed so the record is retained for admins.';

create index records_owner_id_idx on public.records (owner_id);
create index records_created_at_idx on public.records (created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- security definer + empty search_path avoids RLS recursion and search_path hijacks.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'::public.app_role
  );
$$;

comment on function public.is_admin() is
  'True when the current JWT belongs to a profile with role admin.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profile id is immutable';
  end if;

  -- auth.uid() is null for the SQL editor and service_role, which is how
  -- the first admin is promoted. Signed-in non-admins cannot change role.
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'only an admin can change app_role';
  end if;

  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create trigger profiles_guard_role
  before update on public.profiles
  for each row
  execute function public.prevent_profile_privilege_escalation();

create trigger records_set_updated_at
  before update on public.records
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New auth user -> profile
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    nullif(new.email, ''),
    nullif(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name'
      ),
      ''
    ),
    nullif(
      coalesce(
        new.raw_user_meta_data ->> 'avatar_url',
        new.raw_user_meta_data ->> 'picture'
      ),
      ''
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Inserts a member profile for each new auth.users row. Never trusts metadata for role.';

create trigger handle_new_user
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Privileges: anon has none. RLS is the second gate for authenticated.
-- ---------------------------------------------------------------------------

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.records from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant usage on type public.app_role to authenticated, service_role;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.records to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.records to service_role;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.set_updated_at() from public, anon;
revoke all on function public.prevent_profile_privilege_escalation() from public, anon;

grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.set_updated_at() to authenticated, service_role;
grant execute on function public.prevent_profile_privilege_escalation() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row level security. No policy for anon => deny. No matching policy => deny.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.records enable row level security;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profiles_admin_all
  on public.profiles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy records_select_own
  on public.records
  for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy records_insert_own
  on public.records
  for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy records_update_own
  on public.records
  for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy records_delete_own
  on public.records
  for delete
  to authenticated
  using (owner_id = (select auth.uid()));

create policy records_admin_all
  on public.records
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

commit;
