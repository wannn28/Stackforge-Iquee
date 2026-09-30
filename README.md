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

3. Copy env and fill the anon key locally. `.env.example` already has the public project URL. The anon JWT is not in git.

```bash
cp .env.example .env.local
```

`.env.local` (gitignored):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://moqlrespnizjxnybdcc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://stackforge.iquee.tech
```

Paste the team anon JWT into `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Decode the middle segment and confirm the `ref` claim is `moqlrespnizjxnybdcc` before saving it. This checkout does not include that JWT, so the key stays blank here. `createBrowserClient` and `createServerClient` both read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If the JWT `ref` does not match the project ref in the URL, those clients stay unconfigured.

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

- `records`: `id`, `name`, `status` (`active` \| `draft` \| `archived`), `owner`, `updated_at`
- `profiles`: `id`, `full_name`, `email`, `role` (`admin` \| `member` \| `viewer`), `status` (`active` \| `invited` \| `suspended`)

## Design

Geist Sans. Display 24/32 semibold, H1 20/28 semibold, H2 16/24 medium, body 14/20, caption 12/16. Heading tracking is −0.01em.

Light / dark: background `#FAFAFA` / `#09090B`, surface `#FFFFFF` / `#18181B`, border `#E4E4E7` / `#27272A`, text `#09090B` / `#FAFAFA`, muted `#71717A`, primary `#2563EB` (hover `#1D4ED8`). Sidebar 240px (64px collapsed), header 56px, content max 1200px, page padding 24px (16px on small screens).
