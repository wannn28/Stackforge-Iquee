# Stackforge

Operations console for [stackforge.iquee.tech](https://stackforge.iquee.tech). This repository is a single Next.js app at the root. Backend schema, RLS, Docker, and CI can live beside it; this app does not own those files.

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

3. Copy the example env, then put the anon key only in the gitignored file:

```bash
cp .env.example .env.local
```

`.env.example` sets the public project URL. It leaves `NEXT_PUBLIC_SUPABASE_ANON_KEY` empty. Do not commit that key.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rnoglrespnizjxnybdcc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # paste the team anon JWT here, in .env.local only
NEXT_PUBLIC_SITE_URL=https://stackforge.iquee.tech
```

The host `moqlrespnizjxnybdcc.supabase.co` does not resolve. Use `rnoglrespnizjxnybdcc` only. Decode the JWT payload and confirm `ref` is `rnoglrespnizjxnybdcc` before saving `.env.local`. `createBrowserClient` and `createServerClient` both read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If the JWT `ref` does not match the project ref in the URL, those clients stay unconfigured.

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Do not prefix it with `NEXT_PUBLIC_` and do not import it from client components. This app never sends it to the browser, so row-level security still applies to every query.

4. Run:

```bash
npm run dev
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

Protected routes go through `middleware.ts`, which refreshes the Supabase session and sends anonymous visitors to `/sign-in`.

## Tables the UI reads

When these tables are missing, the screens show labeled sample data. When a policy rejects a write, the screen shows the access-denied state.

- `records`: `id`, `title`, `status` (`open` \| `in_progress` \| `done` \| `archived`), `owner_id`, `created_at`, `updated_at`
- `profiles`: `id`, `email`, `full_name`, `role` (`owner` \| `admin` \| `member`), `status` (`active` \| `invited` \| `suspended`), `created_at`, `updated_at`

## Design

Geist Sans. Display 24/32 semibold, H1 20/28 semibold, H2 16/24 medium, body 14/20, caption 12/16. Heading tracking is −0.01em.

Light / dark: background `#FAFAFA` / `#09090B`, surface `#FFFFFF` / `#18181B`, border `#E4E4E7` / `#27272A`, text `#09090B` / `#FAFAFA`, muted `#71717A`, primary `#2563EB` (hover `#1D4ED8`). Sidebar 240px (64px collapsed), header 56px, content max 1200px, page padding 24px (16px on small screens).
