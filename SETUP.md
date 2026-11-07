# Hippo — Supabase Setup Guide

This guide takes you from zero to a fully functional Hippo deployment with real persistent data accessible from any device.

---

## Prerequisites

- Node.js 18+ installed
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account (for deployment)
- Git

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and click **New Project**
2. Choose your organisation, give the project a name (e.g. `surgitrack`), set a strong database password, and pick the region closest to your users
3. Wait ~2 minutes for the project to provision

---

## Step 2 — Get your Supabase credentials

In the Supabase dashboard, go to **Project Settings → API**:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (e.g. `https://abc123.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key — keep this secret! |

Then go to **Project Settings → Database → Connection string**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | **Transaction** mode URL (port **6543**) — append `?pgbouncer=true&connect_timeout=15` |
| `DIRECT_URL` | **Session** mode URL (port **5432**) |

---

## Step 3 — Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in every value from Step 2.

---

## Step 4 — Disable email confirmation (important!)

By default Supabase requires users to confirm their email. For local dev and quick onboarding, disable this:

1. Supabase Dashboard → **Authentication → Providers → Email**
2. Toggle **"Confirm email"** OFF
3. Click Save

You can re-enable this later and add a proper email template.

---

## Step 5 — Push the database schema

This creates all tables in your Supabase Postgres database:

```bash
npx prisma db push
```

You should see `✓ Your database is now in sync with your Prisma schema.`

> **Note:** `db push` is the right command for development. For production migrations, use `prisma migrate deploy`.

---

## Step 6 — (Optional) Seed demo data

```bash
npm run db:seed
```

This creates sample specialties, procedures, and demo user accounts for testing.

---

## Step 7 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you can now sign up, log in, and all data persists in Supabase.

---

## Step 8 — Deploy to Vercel (access from any device)

1. Push your code to GitHub (make sure `.env.local` is in `.gitignore`)

2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo

3. In Vercel's **Environment Variables** section, add every variable from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel URL, e.g. `https://surgitrack.vercel.app`)

4. Click **Deploy**

5. Once deployed, add your Vercel URL to Supabase's allowed origins:
   - Supabase Dashboard → **Authentication → URL Configuration**
   - Add your Vercel URL to **Site URL** and **Redirect URLs**

That's it. Your app is now live at your Vercel URL and accessible from any phone, tablet, or computer.

---

## Architecture Overview

```
Browser / Mobile
      │
      ▼
Next.js App (Vercel Edge)
      │
      ├── Supabase Auth (JWT in HTTP-only cookies)
      │        └── @supabase/ssr handles cookie sync
      │
      ├── API Routes (/api/*)
      │        └── requireAuth() verifies JWT on every request
      │
      └── Prisma ORM
               └── Supabase Postgres (pgbouncer pool)
```

### Key files

| File | Purpose |
|---|---|
| `src/lib/supabase.ts` | Browser Supabase client |
| `src/lib/supabase-server.ts` | Server Supabase clients (cookie-aware) |
| `src/lib/api-auth.ts` | `requireAuth()` helper used by all API routes |
| `src/lib/db.ts` | Prisma singleton |
| `src/middleware.ts` | Route protection (redirects unauthenticated users) |
| `src/context/AuthContext.tsx` | Auth state + data fetching for the whole app |
| `prisma/schema.prisma` | Database schema |

### API routes

| Route | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Create account (service role) |
| `/api/auth/sync` | POST | Sync Supabase user → DB user |
| `/api/auth/me` | GET | Current user + profile |
| `/api/profile` | GET, PATCH | Read/update profile |
| `/api/cases` | GET, POST | List / create cases |
| `/api/cases/[id]` | GET, PATCH, DELETE | Single case CRUD |
| `/api/milestones` | GET, POST | Milestones |
| `/api/personal-records` | GET, POST | Personal records (PRs) |
| `/api/social/feed` | GET | Paginated social feed |
| `/api/social/friends` | GET | Friends list with stats |
| `/api/social/requests` | GET, POST, PATCH, DELETE | Friend requests |

---

## Troubleshooting

**"Invalid API key"** — Double check `SUPABASE_SERVICE_ROLE_KEY` is the service role key, not the anon key.

**"relation does not exist"** — Run `npx prisma db push` again. Make sure `DIRECT_URL` points to port 5432 (not 6543).

**"Email not confirmed"** — Disable email confirmation in Supabase Auth settings (Step 4).

**Vercel deployment fails** — Make sure all environment variables are set in the Vercel dashboard, not just locally.
