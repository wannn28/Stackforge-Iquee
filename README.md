# Stackforge

Operations console for [stackforge.iquee.tech](https://stackforge.iquee.tech). This repository is a Next.js app at the root, plus the Supabase schema, the VPS deploy, and CI.

Postgres and Auth run on Supabase. The app process runs on a single VPS behind nginx, with Cloudflare in SSL mode **Full**.

## Stack

- Next.js 15 App Router, TypeScript, Tailwind CSS 4
- shadcn-style UI (`components/ui`, `components.json`)
- Supabase Auth with `@supabase/ssr` (email/password and Google)
- Browser client uses the anon key only

## Setup

1. Install and copy env:

```bash
npm install
cp .env.example .env.local
```

2. In the Supabase project, set:

- Site URL: `https://stackforge.iquee.tech`
- Redirect URLs:
  - `https://stackforge.iquee.tech/auth/callback`
  - `http://localhost:3000/auth/callback`
- Auth providers: Email and Google

3. Put the anon key only in the gitignored file. `.env.example` sets the public project URL and leaves `NEXT_PUBLIC_SUPABASE_ANON_KEY` empty. Do not commit that key.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rnoglrespnizjxnybdcc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # paste the team anon JWT here, in .env.local only
NEXT_PUBLIC_APP_URL=https://stackforge.iquee.tech
```

The host `moqlrespnizjxnybdcc.supabase.co` does not resolve. Use `rnoglrespnizjxnybdcc` only. Decode the JWT payload and confirm `ref` is `rnoglrespnizjxnybdcc` before saving `.env.local`. `createBrowserClient` and `createServerClient` both read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If the JWT `ref` does not match the project ref in the URL, those clients stay unconfigured.

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Do not prefix it with `NEXT_PUBLIC_` and do not import it from client components. This app never sends it to the browser, so row-level security still applies to every query.

4. Run:

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

Without Supabase keys, `STACKFORGE_PREVIEW=1 npm run dev` renders the signed-in shell with sample data. That flag is ignored when `NODE_ENV` is `production` and when real keys are set.

## App

| Path | Purpose |
| --- | --- |
| `/sign-in`, `/sign-up` | Email/password and Google |
| `/auth/callback` | OAuth and email confirmation |
| `/dashboard` | Four KPI cards, skeleton while loading |
| `/data` | Search, status filter, pagination, empty and skeleton states |
| `/users` | Roles and people |
| `/settings` | Profile, theme, workspace host |
| `/forbidden` | Row-level security failure, not a blank page |
| `/health` | Anonymous `ok` for nginx and the compose healthcheck |

Protected routes go through `middleware.ts`, which refreshes the Supabase session and sends anonymous visitors to `/sign-in`. `/health` skips that check.

## Tables the UI reads

Schema and RLS live in `supabase/migrations/001_initial.sql`. When these tables are missing, the screens show labeled sample data. When a policy rejects a write, the screen shows the access-denied state.

- `records`: `id`, `title`, `status` (`open` \| `in_progress` \| `done` \| `archived`), `owner_id`, `created_at`, `updated_at`
- `profiles`: `id`, `email`, `full_name`, `role` (`owner` \| `admin` \| `member`), `status` (`active` \| `invited` \| `suspended`), `created_at`, `updated_at`

## Design

Geist Sans. Display 24/32 semibold, H1 20/28 semibold, H2 16/24 medium, body 14/20, caption 12/16. Heading tracking is −0.01em.

Light / dark: background `#FAFAFA` / `#09090B`, surface `#FFFFFF` / `#18181B`, border `#E4E4E7` / `#27272A`, text `#09090B` / `#FAFAFA`, muted `#71717A`, primary `#2563EB` (hover `#1D4ED8`). Sidebar 240px (64px collapsed), header 56px, content max 1200px, page padding 24px (16px on small screens).

## Backend / Deploy

| Path | Purpose |
| --- | --- |
| `supabase/migrations/001_initial.sql` | Roles, profiles, records, auth trigger, RLS |
| `.env.example` | Public and server-only environment contract |
| `deploy/Dockerfile` | Next.js standalone image on port 3000 |
| `deploy/docker-compose.yml` | `app` + `nginx` on one VPS |
| `deploy/nginx/stackforge.iquee.tech.conf` | TLS origin and reverse proxy to `app:3000` |
| `.github/workflows/ci.yml` | Lint, typecheck, and build |

### Environment

| Variable | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server. `https://rnoglrespnizjxnybdcc.supabase.co`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server. The anon key. RLS still applies. Empty in git. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Bypasses RLS. Never prefix it with `NEXT_PUBLIC_`, never import it from a client component, and never print it. |
| `NEXT_PUBLIC_APP_URL` | Canonical origin: `https://stackforge.iquee.tech`. |

`NEXT_PUBLIC_*` values are inlined into the client bundle at build time. Pass them as Docker build args. The service role key is read only from the server runtime environment (the compose `env_file` on the `app` service).

### Migrate

`001_initial.sql` is the schema contract for this repo. Apply it once to the Supabase project with the SQL editor, or with `psql` against the **direct** database connection (port 5432). Use the direct host for DDL; the transaction pooler can reject parts of a migration.

```bash
psql "postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres" \
  -v ON_ERROR_STOP=1 \
  -f supabase/migrations/001_initial.sql
```

The Supabase CLI only auto-runs migration files whose names start with a 14-digit timestamp. This file keeps the name `001_initial.sql`, so apply it with the SQL editor or `psql` as above.

What the migration creates:

- `app_role`: `owner`, `admin`, `member`.
- `profile_status`: `active`, `invited`, `suspended`.
- `record_status`: `open`, `in_progress`, `done`, `archived`.
- `profiles`: primary key `id` references `auth.users` and deletes with the user. Columns: `email`, `full_name`, `role` (default `member`), `status` (default `active`), `created_at`, `updated_at`.
- `records`: `id` (`gen_random_uuid()`), required `title`, optional `description`, `status` (default `open`), `owner_id` (defaults to `auth.uid()`, set null if the profile is removed), timestamps. A member can omit `owner_id` on insert and cannot assign a record to someone else.
- `audit_logs`: append-only. Columns: `id`, `actor_id`, `action`, `entity`, `entity_id`, `meta` (jsonb), `created_at`. There is no `updated_at`. A trigger rejects `UPDATE` and `DELETE` for every role.
- Trigger `handle_new_user` on `auth.users`: after insert, writes a profile with `role = member` and `status = active`. Metadata cannot choose either value.
- RLS enabled on all three tables. `anon` has no table grants. Missing policy means deny.
- Profiles: a user can select and update their own row. That update policy refuses a change to `role` or `status`. `owner` and `admin` can do everything on profiles.
- Records: a user can select, insert, update, and delete rows they own. `owner` and `admin` can do everything on records.
- Audit logs: an authenticated user can insert a row whose `actor_id` is their own id, and can select those rows. `owner` and `admin` can select every audit row. Nobody can update or delete.
- Promote the first account from the SQL editor (where `auth.uid()` is null) or with the service role:

```sql
update public.profiles
set role = 'owner'
where email = 'you@example.com';
```

### Auth (OAuth)

Supabase Auth issues the session. The database trigger creates the profile, so the app does not insert into `profiles` on signup.

In the Supabase dashboard, Authentication → URL configuration:

- Site URL: `https://stackforge.iquee.tech`
- Redirect URLs: `https://stackforge.iquee.tech/auth/callback` and `http://localhost:3000/auth/callback`

Enable each OAuth provider in Authentication → Providers. Provider client ids and secrets stay in the Supabase dashboard. This repo does not store them.

`app/auth/callback` exchanges the code with the Supabase client and sends the user back into the app. Google and GitHub populate `full_name` or `name`; `handle_new_user` copies that onto the profile and always stores `role = member`, `status = active`.

### Deploy to a VPS

One Linux host with Docker Engine and Compose v2.24 or newer (`env_file.required`). DNS for `stackforge.iquee.tech` is proxied (orange-cloud) at Cloudflare. Set SSL/TLS to **Full** before pointing traffic at the origin. Open TCP 80 and 443 on the host firewall. Optionally allow those ports only from [Cloudflare's IP ranges](https://www.cloudflare.com/ips/) so clients cannot skip Cloudflare and hit the origin directly.

```bash
git clone https://github.com/wannn28/Stackforge-Iquee.git
cd Stackforge-Iquee
cp .env.example .env
# fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, and leave NEXT_PUBLIC_APP_URL as published
chmod +x deploy/scripts/generate-origin-cert.sh
./deploy/scripts/generate-origin-cert.sh
cd deploy
docker compose --env-file ../.env up -d --build
docker compose ps
```

`generate-origin-cert.sh` writes a self-signed `deploy/certs/origin.crt` and `origin.key` (gitignored). Cloudflare Full accepts that certificate. To move to Full (strict), replace those files with a Cloudflare Origin CA certificate for `stackforge.iquee.tech` and restart nginx. The private key never goes in git or in the image.

nginx listens on 443, proxies to `app:3000`, restores the visitor IP from `CF-Connecting-IP` only when the TCP peer is Cloudflare, and redirects port 80 to HTTPS. `GET /health` stays on port 80 so the compose healthcheck can reach it without TLS.

`deploy/Dockerfile` is a multi-stage Next.js build. `next.config.ts` sets `output: "standalone"`, and the container runs `node server.js` on port 3000. `--env-file ../.env` supplies `NEXT_PUBLIC_*` as build args so they are compiled into the client. `SUPABASE_SERVICE_ROLE_KEY` is not a build arg; compose injects it at runtime on `app` only.

Upgrade on the VPS:

```bash
git pull
cd deploy
docker compose --env-file ../.env up -d --build
```

### CI

`.github/workflows/ci.yml` runs `npm run lint`, `npm run typecheck`, and `npm run build` on Node 22 when `package.json` is present. The build uses placeholder public env values so the workflow never carries a real key.
