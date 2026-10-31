# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`)
- No test runner is configured.

## Next.js version warning

`AGENTS.md` says this Next.js (16.x) differs from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code. Notable here:
- Middleware is `src/proxy.ts` exporting `proxy` (not `middleware.ts`).
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`. Pages that read per-user data therefore wrap the async part in `<Suspense>` and call `await connection()` first to opt out of prerendering (see `src/app/app/page.tsx`, `src/app/settings/page.tsx`).
- Tailwind v4 is wired through a Turbopack rule for `*.css` in `next.config.ts`.

## Architecture

Leadline is a Next.js App Router app (`src/app`, alias `@/*` → `src/*`) backed by Supabase auth + Postgres. `@anthropic-ai/sdk`, `cheerio`, `papaparse` and `zod` are installed for the lead-outreach features (Claude-written messages), but no code uses them yet.

**Supabase clients (`src/lib/supabase/`)** — pick by runtime:
- `server.ts` — `createClient()` for Server Components/route handlers; cookie-based session.
- `client.ts` — `createClient()` for `"use client"` components (browser).
- `admin.ts` — service-role client, `server-only`, bypasses RLS. Never import from client code.

**Auth flow** — `src/proxy.ts` runs on all routes except static assets, refreshes the Supabase session cookies, and redirects unauthenticated users from paths starting with `/app` to `/login`. `src/app/auth/callback/route.ts` exchanges the auth `code` for a session and redirects to `/app`.
- Caveat: the proxy guard only matches `/app*`. `/settings` is not covered by it, and `settings/page.tsx` uses `user!.id`, so an unauthenticated visit to `/settings` will crash. Extend the guard if you touch this.

**Data** — a `profiles` table keyed by `id` = auth user id, with `email`, `credits`, and the outreach-profile columns `offer`, `icp`, `tone`, `sample_msg`. The schema/RLS lives in Supabase, not in this repo.

**Pages/pattern** — server `page.tsx` fetches data and passes it to a `"use client"` form/component colocated in the same folder (e.g. `settings/settings-form.tsx`), which writes back via the browser Supabase client. Security for those writes relies on RLS and column grants, not on server code.

## Environment

`.env.local` needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`.
