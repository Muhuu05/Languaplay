# LinguaPlay

A Duolingo-style language-learning app with Clerk authentication, XP/streak/hearts mechanics, leaderboards, achievements, and a gem shop. Built with React + Vite frontend and Express backend.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/linguaplay run dev` — run the frontend (port 20404)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` — Replit-managed Clerk (auto-provisioned)
- Required env: `VITE_CLERK_PUBLISHABLE_KEY` — Clerk frontend key (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4 + shadcn/ui + Wouter routing
- Auth: Replit-managed Clerk (`@clerk/react`, `@clerk/express`)
- API: Express 5 + OpenAPI-first codegen (Orval)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/index.ts` — Drizzle DB schema
- `lib/api-zod/src/generated/api.ts` — Generated Zod validators (server-side)
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks (frontend)
- `artifacts/api-server/src/routes/` — Backend route handlers
- `artifacts/linguaplay/src/pages/` — Frontend pages
- `artifacts/linguaplay/src/components/` — UI components

## Architecture decisions

- Clerk auth is Replit-managed: dev keys auto-provisioned, production keys swap at publish time
- Clerk proxy middleware (`/api/__clerk`) only runs in production to support custom domains
- `requireAuth` middleware auto-creates user records in the DB on first sign-in via `clerkClient.users.getUser`
- leaderboard_users table holds seeded NPC users; real user's entry is dynamically merged in `/api/leaderboard`
- pnpm-workspace.yaml darwin overrides are intentionally NOT excluded — the project works on both Linux (Replit) and macOS

## Product

- Landing page with sign-up/sign-in
- Learn page: active course units/lessons with XP-gated progression
- Lesson runner: multi-format exercises (translate, multiple choice, listen, match pairs, fill-blank, word bank)
- Post-lesson results: XP awarded, streak update, hearts deducted
- Courses page: pick from 6 language courses
- Leaderboard: weekly XP, league tiers (bronze → diamond)
- Achievements: unlock badges for streaks, XP milestones, perfect lessons
- Gem shop: streak freeze, heart refill, double XP
- Profile page: stats, streak calendar, weekly XP chart
- Daily goal setter

## User preferences

- Mac compatibility: darwin platform overrides must NOT be excluded from pnpm-workspace.yaml

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before writing routes
- The `linguaplay_backup` directory was a migration artifact — it has been deleted
- Clerk "development keys" console warning is expected in dev — not a bug
- `SESSION_SECRET` env var exists from the initial scaffold; not used (Clerk handles sessions)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk configuration details
