# EcomSkool Companion App

The command center for EcomSkool's Arabic-speaking dropshipping community.
Students do their AI work inside their own Claude.ai accounts using EcomSkool's
skill system; **this app never calls any AI API**. It handles structure,
storage, gating, and visibility around the **15-step skill pipeline**:

- Enforces the correct order of the 15 pipeline steps (server-side gating).
- Stores every uploaded output file (versioned, never overwritten).
- Parses key numbers from uploaded Excel workbooks (later phase).
- Shows progress dashboards to students and admins.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Supabase** (Postgres, Auth, Storage) with **Row Level Security on every table**
- **next-intl** for i18n — Arabic (default, RTL) + English (secondary)
- Fonts: **Tajawal** (primary) with **Cairo** fallback
- Excel parsing via **xlsx (SheetJS)** — used from Phase 2 onward

## Getting started

1. **Install deps**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.local.example .env.local
   # fill in your Supabase project URL + keys, then:
   npm run check-env
   ```

3. **Apply the database schema** — run `supabase/migrations/0001_ecomskool_init.sql`
   in the Supabase SQL editor (or via the Supabase CLI). It creates the tables,
   RLS policies, triggers, and seeds the 15 pipeline steps.

4. **Promote admins** — after a co-founder signs up once, edit and run
   `scripts/promote-admin.sql` to grant them the `admin` role.

5. **Run**

   ```bash
   npm run dev
   ```

## Data model

| Table | Purpose |
| --- | --- |
| `profiles` | Extends `auth.users` (role: `student` \| `admin`). |
| `brands` | One product/store per row, owned by a student. |
| `pipeline_steps` | Master definition of the 15 steps (admin-editable). |
| `brand_step_progress` | Per-brand state of each step (locked → approved). |
| `step_files` | Versioned, immutable file uploads per step. |

**Gating is server-side only.** A DB trigger seeds a brand's 15 progress rows on
creation (step 1 unlocked, the rest locked). Students can *read* their progress
but never mutate it directly — RLS blocks client writes, and role escalation is
prevented by a trigger.

## Project structure

```
app/                 App Router routes
  (auth)/            Arabic RTL sign in / sign up / password reset
  dashboard/         Shell + dashboard, brands, settings, admin
  auth/              OAuth-style callback + signout route handlers
components/          UI primitives, layout shell, brand & pipeline views
i18n/                next-intl config + cookie locale
lib/                 supabase clients, auth, brand queries/actions, pipeline
messages/            ar.json (default) + en.json
supabase/migrations/ SQL schema, RLS, triggers, seed
```
