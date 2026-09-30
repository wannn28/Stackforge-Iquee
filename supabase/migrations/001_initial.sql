-- Stackforge-Iquee initial schema (locked contract).
-- Apply on the Supabase Postgres database (SQL editor or psql against the
-- direct 5432 connection). auth.users, auth.uid(), and the anon /
-- authenticated / service_role roles already exist on Supabase.
--
-- Deny-by-default: RLS is enabled and anon has no table privileges.
-- service_role bypasses RLS and must stay on the server.
-- audit_logs is append-only: a trigger rejects UPDATE and DELETE for every role.

begin;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('owner', 'admin', 'member');

create type public.profile_status as enum ('active', 'invited', 'suspended');

create type public.record_status as enum ('open', 'in_progress', 'done', 'archived');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role public.app_role not null default 'member',
  status public.profile_status not null default 'active',
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint profiles_email_unique unique (email)
);

comment on table public.profiles is
  'One row per auth user. Signup trigger inserts role member and status active.';

comment on column public.profiles.role is
  'owner, admin, or member. Members cannot change their own role.';

comment on column public.profiles.status is
  'active, invited, or suspended. Members cannot change their own status.';

create table public.records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.record_status not null default 'open',
  -- Defaults to the signed-in user. Service-role inserts with no JWT store null
  -- unless owner_id is set explicitly. RLS still requires owner_id = auth.uid()
  -- for members.
  owner_id uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint records_title_not_blank check (char_length(btrim(title)) > 0)
);

comment on table public.records is
  'Application records. Members CRUD their own rows; owner and admin CRUD every row.';

comment on column public.records.owner_id is
  'Profile that owns the row. Set null when that profile is removed so the record is retained.';

create index records_owner_id_idx on public.records (owner_id);
create index records_created_at_idx on public.records (created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  -- No foreign key: the actor uuid is kept after the profile is removed.
  actor_id uuid not null,
  action text not null,
  entity text not null,
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  constraint audit_logs_action_not_blank check (char_length(btrim(action)) > 0),
  constraint audit_logs_entity_not_blank check (char_length(btrim(entity)) > 0)
);

comment on table public.audit_logs is
  'Append-only audit trail. Insert with your own actor_id. No update or delete.';

create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- owner and admin are the elevated roles. "owner" here is app_role, not
-- records.owner_id. security definer + empty search_path avoids RLS recursion.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin_or_owner()
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
      and role in ('owner'::public.app_role, 'admin'::public.app_role)
  );
$$;

comment on function public.is_admin_or_owner() is
  'True when the current JWT belongs to a profile with role owner or admin.';

-- STABLE so the read uses the statement snapshot (the pre-update row) and a
-- member cannot satisfy the own-update policy by writing a new role or status.
create or replace function public.profile_role_and_status_unchanged(
  new_role public.app_role,
  new_status public.profile_status
)
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
      and role = new_role
      and status = new_status
  );
$$;

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
  -- the first owner is promoted. Signed-in members cannot change role or status.
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and auth.uid() is not null
     and not public.is_admin_or_owner() then
    raise exception 'only an owner or admin can change role or status';
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

create or replace function public.reject_audit_log_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_logs is append-only';
end;
$$;

create trigger audit_logs_no_update
  before update on public.audit_logs
  for each row
  execute function public.reject_audit_log_mutation();

create trigger audit_logs_no_delete
  before delete on public.audit_logs
  for each row
  execute function public.reject_audit_log_mutation();

-- ---------------------------------------------------------------------------
-- New auth user -> profile. Role and status are fixed; metadata cannot grant them.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
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
    'member'::public.app_role,
    'active'::public.profile_status
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Inserts a member profile with status active for each new auth.users row.';

create trigger handle_new_user
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Privileges. anon has no table DML. audit_logs has no update or delete grant.
-- ---------------------------------------------------------------------------

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.records from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant usage on type public.app_role to authenticated, service_role;
grant usage on type public.profile_status to authenticated, service_role;
grant usage on type public.record_status to authenticated, service_role;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.records to authenticated;
grant select, insert on table public.audit_logs to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.records to service_role;
grant select, insert on table public.audit_logs to service_role;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin_or_owner() from public, anon;
revoke all on function public.profile_role_and_status_unchanged(public.app_role, public.profile_status) from public, anon;
revoke all on function public.set_updated_at() from public, anon;
revoke all on function public.prevent_profile_privilege_escalation() from public, anon;
revoke all on function public.reject_audit_log_mutation() from public, anon;

grant execute on function public.is_admin_or_owner() to authenticated, service_role;
grant execute on function public.profile_role_and_status_unchanged(public.app_role, public.profile_status) to authenticated, service_role;
grant execute on function public.set_updated_at() to authenticated, service_role;
grant execute on function public.prevent_profile_privilege_escalation() to authenticated, service_role;
grant execute on function public.reject_audit_log_mutation() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row level security. No policy for a command => deny.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.records enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

-- Own update cannot change role or status. owner/admin use profiles_elevated_all.
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and public.profile_role_and_status_unchanged(role, status)
  );

create policy profiles_elevated_all
  on public.profiles
  for all
  to authenticated
  using (public.is_admin_or_owner())
  with check (public.is_admin_or_owner());

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

create policy records_elevated_all
  on public.records
  for all
  to authenticated
  using (public.is_admin_or_owner())
  with check (public.is_admin_or_owner());

create policy audit_logs_insert_own
  on public.audit_logs
  for insert
  to authenticated
  with check (actor_id = (select auth.uid()));

create policy audit_logs_select_own
  on public.audit_logs
  for select
  to authenticated
  using (actor_id = (select auth.uid()));

create policy audit_logs_select_elevated
  on public.audit_logs
  for select
  to authenticated
  using (public.is_admin_or_owner());

commit;
