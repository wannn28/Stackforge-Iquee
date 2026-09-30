# Stackforge-Iquee

Backend and deploy for [stackforge.iquee.tech](https://stackforge.iquee.tech). Postgres and Auth run on Supabase. The app process runs on a single VPS behind nginx, with Cloudflare in SSL mode **Full**.

Frontend owns the Next.js UI: `app/`, `components/`, and the browser Supabase client under `lib/`. This tree adds the database migration, the environment contract, the container deploy, and CI. It does not scaffold the Next.js app.

## Backend / Deploy

| Path | Purpose |
| --- | --- |
| `supabase/migrations/001_initial.sql` | Roles, profiles, records, auth trigger, RLS |
| `.env.example` | Public and server-only environment contract |
| `deploy/Dockerfile` | Placeholder image on port 3000 until the Next.js app exists |
| `deploy/docker-compose.yml` | `app` + `nginx` on one VPS |
| `deploy/nginx/stackforge.iquee.tech.conf` | TLS origin and reverse proxy to `app:3000` |
| `.github/workflows/ci.yml` | Lint, typecheck, and build once `package.json` exists |

### Environment

Copy the example and fill it in on the VPS and for local frontend development. `.env` is gitignored.

```bash
cp .env.example .env
```

| Variable | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server. Project URL from the Supabase dashboard. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server. The anon key. RLS still applies. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Bypasses RLS. Never prefix it with `NEXT_PUBLIC_`, never import it from a client component, and never print it. |
| `NEXT_PUBLIC_APP_URL` | Canonical origin: `https://stackforge.iquee.tech`. |

`NEXT_PUBLIC_*` values are inlined into the client bundle at build time. The service role key is read only from the server runtime environment (the compose `env_file` on the `app` service).

### Migrate

`001_initial.sql` is the schema contract for this repo. Apply it once to the Supabase project with the SQL editor, or with `psql` against the **direct** database connection (port 5432). Use the direct host for DDL; the transaction pooler can reject parts of a migration.

```bash
psql "postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres" \
  -v ON_ERROR_STOP=1 \
  -f supabase/migrations/001_initial.sql
```

The Supabase CLI only auto-runs migration files whose names start with a 14-digit timestamp. This file keeps the name `001_initial.sql`, so apply it with the SQL editor or `psql` as above.

What the migration creates:

- `app_role`: `admin`, `member`, `viewer`.
- `profiles`: primary key `id` references `auth.users` and deletes with the user. Columns: `email`, `full_name`, `role` (default `member`), `avatar_url`, `created_at`, `updated_at`.
- `records`: `id` (`gen_random_uuid()`), required `title`, `description`, `status` (default `open`), `owner_id` (defaults to `auth.uid()`, set null if the profile is removed), timestamps. The app can omit `owner_id` on insert; a non-admin cannot assign a record to someone else.
- Trigger `handle_new_user` on `auth.users`: after insert, writes a `member` profile. Role always starts as `member`; user metadata cannot grant `admin`.
- RLS enabled on both tables. `anon` has no table grants. Missing policy means deny.
- Policies: a user can select and update their own profile; an admin can do everything on profiles. A user can select, insert, update, and delete records they own; an admin can do everything on records.
- A signed-in user cannot change `profiles.role`. Promote the first admin from the SQL editor (where `auth.uid()` is null) or with the service role:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

`viewer` is a stored role. Current policies allow every authenticated owner to CRUD their own records. A later migration can narrow `viewer` to read-only without changing this baseline.

### Auth (OAuth)

Supabase Auth issues the session. The database trigger creates the profile, so the app does not insert into `profiles` on signup.

In the Supabase dashboard, Authentication → URL configuration:

- Site URL: `https://stackforge.iquee.tech`
- Redirect URLs: `https://stackforge.iquee.tech/auth/callback` and `http://localhost:3000/auth/callback`

Enable each OAuth provider in Authentication → Providers. Provider client ids and secrets stay in the Supabase dashboard. This repo does not store them.

The frontend callback route should exchange the code with the Supabase client and send the user back into the app. Google and GitHub populate `full_name` / `name` and `avatar_url` / `picture`; `handle_new_user` copies those onto the profile.

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
docker compose up -d --build
docker compose ps
```

`generate-origin-cert.sh` writes a self-signed `deploy/certs/origin.crt` and `origin.key` (gitignored). Cloudflare Full accepts that certificate. To move to Full (strict), replace those files with a Cloudflare Origin CA certificate for `stackforge.iquee.tech` and restart nginx. The private key never goes in git or in the image.

nginx listens on 443, proxies to `app:3000`, restores the visitor IP from `CF-Connecting-IP` only when the TCP peer is Cloudflare, and redirects port 80 to HTTPS. `GET /health` stays on port 80 so the compose healthcheck can reach it without TLS.

Until `package.json` and the Next.js app land, `deploy/Dockerfile` builds a placeholder that answers `/health` with `ok`. When frontend adds the app, switch that Dockerfile to the standalone multi-stage build commented at the top of the file (`output: "standalone"` in `next.config`) and keep the process on port 3000. Pass `NEXT_PUBLIC_*` as build arguments; they are compiled into the client. Keep `SUPABASE_SERVICE_ROLE_KEY` as a runtime environment variable on `app` only.

Upgrade on the VPS:

```bash
git pull
cd deploy
docker compose up -d --build
```

### CI

`.github/workflows/ci.yml` checks out the repo and, while `package.json` is absent, prints a no-op message. After frontend adds `package.json`, the job runs `npm run lint`, `npm run typecheck`, and `npm run build` on Node 22. Those three scripts need to exist. The build uses placeholder public env values so the workflow never carries a real key.
