---
name: build-backend
description: Use when someone asks to "add a backend", "add real data", "add a database", "add sign-in / login / accounts", "make the data real", "wire up Supabase", "make it save data", or says "/build-backend". Upgrades the already-built mock-data web app in app/ into a real-data, backend-ready app — a Supabase schema (from your data) + a graceful-off data layer + email sign-in + tests + a go-live checklist. Reads wiki/charter.md and the app's own src/data/ fixtures; one confirm gate; scaffolds fully OFFLINE (no keys). The app keeps running on mock data until you paste two keys and run the migration — the one step it never does for you. Tier 1 (real data) but the scaffold is key-free. Attended-only — never runs in the maintenance loop. Re-runnable. Zero-argument safe.
argument-hint: "[leave blank to use your charter + app, or name the entities to wire]"
---

# build-backend

The "make it real" step. `build-app` gives a non-technical user a themed, working web app in `app/` — but
its data is **placeholder** (a `src/data/` folder of typed arrays). This skill upgrades that same app into a
**real-data, backend-ready** app: a real database schema derived from their own data, a data layer that
talks to a real backend, sign-in, and tests — without making them write any of it.

What it produces (all **offline, no keys**): a Supabase migration (`app/supabase/migrations/0001_init.sql`),
a **graceful-off data layer** in `app/src/data/store/`, email auth, an `app/.env.example` with the two
empty key slots, tests, and a **go-live checklist** at `outputs/backend/<date>-<slug>/GO-LIVE.md`. The
**one** thing it never does — by design — is enter keys or run the migration: the user creates a Supabase
project, pastes two keys into `app/.env`, and runs the migration themselves (a ~5-minute step). **Until they
do, the app keeps running on mock data** — the graceful-off layer means the scaffold never breaks the app.

## When to use

When the user says "add a backend / real data / a database / sign-in", "make the data real / save data",
"wire up Supabase", or `/build-backend`. Also offered by `what-can-i-do` and pointed to by `advise-project`
as the next step after a build. It **requires an already-built `app/`** (from `build-app`). It is
**attended** — one confirm gate before wiring — and **never runs in the unattended `maintenance-loop`**.

## Configuration

Read `.claude/skills/build-backend/config.json` (all values default; never block on absence):
- `app_dir` (default `"app"`) — the built web app to upgrade.
- `provider` (default `"supabase"`) — the backend. Supabase first; the key leaves room for others later.
- `include_auth` (default `true`) — scaffold email sign-in (inert until keys are present).
- `max_entities` (default `12`) — the cap on tables wired in one pass (the runaway-scope guard).

## Procedure

### Phase 0 — Pre-flight (require the app; read the data; route, don't guess)

1. **A built `app/` (required).** There is nothing to wire without it.
   - **Missing →** offer `build-app` first: *"A backend upgrades an app you've already built. Want me to
     build the app first (a quick, themed front-end), then wire the backend into it?"* On yes, run
     `build-app`, then continue. On no, stop gracefully (nothing to upgrade).
   - Read the app's **`src/data/` fixtures** — the typed arrays + `getX()`/`listX()` accessors. **These are
     the source of truth for the data shapes** (the columns and the seed).
2. **Charter — `wiki/charter.md` (recommended).** Read `## Scope` / `## Audience` for **which** entities
   matter, their **relationships**, and any per-user ownership intent (→ RLS). The charter informs
   *relationships and RLS intent*, **not** column types (those come from the fixtures, so schema ⟷ seed ⟷
   pages can never diverge). Missing → infer relationships from the fixtures and flag `(assumed)`.
3. **Existing backend (`app/supabase/` or `app/src/data/store/`) →** switch to **incremental mode** (see
   *Re-running*).

### Phase 1 — Derive the data model

From the `src/data/` fixtures, derive one **entity** per fixture module: its table name, **columns typed
from the fixture's TypeScript shape** (string→text, number→numeric/int, boolean→bool, Date/ISO→timestamptz,
arrays/objects→jsonb; an `id` field → primary key), and **foreign keys** from the charter's relationships
(or inferred `<entity>_id` fields in the fixtures). Cap at `config.max_entities`; if the app has more,
wire the **core** entities and list the rest under `Later (not in this pass)`.

**RLS (row-level security) — the default is shared-read / authenticated-write.** Enable RLS on every table
with: `SELECT` allowed to everyone (so the mock-derived **seed rows stay visible** — no empty screens after
go-live), and `INSERT`/`UPDATE`/`DELETE` allowed only to authenticated users (so it is never anon-writable).
*(Owner-scoped private RLS — `auth.uid() = owner_id` — is a later refinement for data with genuine per-user
ownership; v1 defaults to shared-read so seed-from-mock is coherent. Note it in the go-live checklist as an
option.)*

### Phase 2 — Confirm once, then wire

Show the plan in **one message** and ask **one** question. Include:
- the entity/table list — one line each (columns + relationships),
- what will be generated: the migration, the graceful-off data layer, sign-in, `.env.example`, tests, and
  the go-live checklist,
- the **RLS default** (shared-read / authenticated-write) in plain words,
- the key promise: **it stays graceful-off** — *"your app keeps working on its sample data with no keys; it
  switches to the real database automatically the moment you add your two keys,"*
- that nothing here needs a key and nothing is installed or deployed.

Ask: *"Wire this backend into your app? I'll scaffold everything offline — then hand you a short checklist
for the one step that's yours (create the database, paste two keys, run the migration).
(yes / tweak something)"* On "tweak", revise and show again. **No per-table interrogation.**

### Phase 3 — Scaffold the backend (offline; no keys)

Build **in-session, in order** — all offline, no network, no keys:

1. **Migration → `app/supabase/migrations/0001_init.sql`.** For each entity: `create table`, columns typed
   from the fixtures, primary/foreign keys, `alter table … enable row level security`, and the two RLS
   policies (public `SELECT`; authenticated `INSERT`/`UPDATE`/`DELETE`). Then **seed** each table with
   `insert` rows **derived directly from the `src/data/` mock arrays** (the fixtures become the seed — zero
   data invented).
2. **Graceful-off data layer → `app/src/data/store/`** (mirrors `aios/server/kb/store.ts`):
   - `types.ts` — a `DataStore` interface (`listX()` / `getX(id)` / `createX()` / `updateX()` / `deleteX()`
     per entity, all `Promise`-returning).
   - `mockStore.ts` — `MockStore` implementing `DataStore` over the existing `src/data/` fixtures (works
     with **zero keys**, fully offline).
   - `supabaseStore.ts` — `SupabaseStore` implementing `DataStore` via Supabase. It **dynamically
     `import()`s `@supabase/supabase-js` only when env is present** (as `aios/server/kb/store.ts` does), so
     the mock/no-keys bundle never loads it — "inert unless env present" is *structurally* guaranteed.
   - `index.ts` — `getActiveStore()`: if `import.meta.env.VITE_SUPABASE_URL` **and**
     `VITE_SUPABASE_ANON_KEY` are both present, return `SupabaseStore`; else **fall back to `MockStore`**.
3. **Page rewire (minimal).** Pages call `store.listX()` / `store.getX()` (async) via
   `@tanstack/react-query` instead of importing the mock getters directly. Add a `QueryClientProvider` wrap
   in `app/src/main.tsx`. Do not touch routing or the theme.
4. **Auth → sign-in/up page + session context + protected routes** (Supabase email auth). **Inert without
   keys** — with no keys the app still runs and auth simply isn't enforced (the `MockStore` path needs no
   session), so the scaffold never breaks Tier 0.
5. **Env template → `app/.env.example`** with the two empty slots + fill-in comments (never in chat):
   ```
   # Paste these from your Supabase project (Settings → API) into app/.env (gitignored):
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```
   Ensure `app/.gitignore` covers `.env`.
6. **Dependencies → `app/package.json`.** Add `@supabase/supabase-js` + `@tanstack/react-query` (runtime)
   and `vitest` + `@playwright/test` (dev). No other stack drift.
7. **Tests.** Vitest for the data layer (the `getActiveStore()` fallback returns `MockStore` with no env;
   the store CRUD contract) + the auth guard; a Playwright E2E smoke that the app renders on mock data.
   Runnable `npm test`.

### Phase 4 — Record it (provenance)

The **code** lives in `app/` (a build target outside the knowledge folders, like `aios/`). The **record**
lands in the knowledge base:
- **`raw/builds/<YYYY-MM-DD>-<slug>.md`** *(immutable, append-only; `-2` for same-day re-runs)* — RAG
  frontmatter, then: the entity/table list, the columns typed from fixtures, the RLS model, the seed
  source, the deps added, and anything deferred. **Tag it `layer: backend`** (in the frontmatter `tags` and
  a `layer:` line) so it's distinct from the front-end build record.
- **`wiki/build.md`** — add a **`## Backend (Supabase)`** section (preserving the existing Web/Mobile/
  Browser-extension sections): the entity list, where the store + migration live, the graceful-off note,
  and a link to the `raw/builds/` record + the go-live checklist. Cross-link from `wiki/index.md` if not
  already.
- **`outputs/change-log.md`** — append one attributed line (newest-at-top):
  `- <YYYY-MM-DD> — build-backend — wired Supabase backend (schema + store + auth) into app/ from src/data/ + wiki/charter.md — applied`

`improve-system` stays the single applier — this skill only writes its own `applied` line, exactly as the
other `build-*` skills do.

### Phase 5 — Hand over the go-live checklist (offer-don't-run)

Write the go-live steps to **`outputs/backend/<YYYY-MM-DD>-<slug>/GO-LIVE.md`** (RAG frontmatter + the
steps), then close in plain words. **Never** run the migration, `npm install`, or deploy, and **never**
ask for or enter a key. The checklist says exactly:

> 1. Create a free Supabase project at supabase.com (it gives you a project URL + an anon key).
> 2. In the `app/` folder, copy `.env.example` to `.env` and paste your two values into
>    `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. (`app/.env` is gitignored — your keys stay local.)
> 3. Run the migration: paste `app/supabase/migrations/0001_init.sql` into the Supabase SQL editor (or
>    `supabase db push` if you use the CLI). This creates your tables and loads the sample rows.
> 4. Start the app (`cd app && npm install && npm run dev`). It now reads and writes your real database;
>    sign-in is live.
>
> *Until you do step 2, the app keeps running on its sample data — nothing is broken.* *(Optional: for
> private per-user data, switch the shared-read policy to owner-scoped RLS — see the note in the build
> record.)*

Close: *"Your app is now backend-ready. Everything's scaffolded — the only thing left is yours: create the
database and paste two keys, following `outputs/backend/<date>-<slug>/GO-LIVE.md`. Want me to walk you
through it?"* (Walk-through = explain the steps; still never enter the keys.)

## Re-running (incremental, never clobber)

If `app/supabase/` or `app/src/data/store/` already exists, switch to **incremental mode**: read the
existing store + latest `raw/builds/` backend record, diff the current fixtures/charter against what's
wired, and at the confirm gate offer: **add entities**, **re-derive the schema**, or **both**. Write **new**
files freely; for any **existing** file, show a diff and **confirm before overwriting**. Each re-run writes
a **new** `raw/builds/` record and a new dated migration (`0002_*.sql`, never rewrite `0001`). Never clobber
a user's `app/.env`.

## Rules & guardrails

- **Keys never in chat; the human owns go-live.** This skill writes only empty `.env` slots + the go-live
  checklist. It **never** asks for, stores, or enters a key, and **never** runs the migration, `npm
  install`, or a deploy. That is a permanent boundary.
- **Graceful-off = no broken app.** With no keys the app runs on `MockStore` (its sample data); with both
  `VITE_SUPABASE_*` present it uses the real backend automatically. A scaffold can never hand back a broken
  app.
- **Attended-only — never in `maintenance-loop`.** It writes project source and is built around the one
  confirm gate; the unattended tick never runs it.
- **`improve-system` stays the single applier; `raw/` is immutable.** It writes its own provenance
  (`raw/builds/` record + `wiki/build.md` section + one `change-log.md` line); code lives in `app/`.
- **Tier 1 (real data), key-free scaffold.** The capability is real data, but the scaffold needs no keys
  and runs offline; the keyed step is the human's go-live.
- **Web `app/` only (v1).** Wiring backends for `mobile/` / `plugin/` is a later phase (same `src/data/`
  swap point).

## Output

An upgraded `app/` (a Supabase migration + a graceful-off data layer + email auth + tests + `.env.example`),
an immutable `raw/builds/<date>-<slug>.md` record tagged `layer: backend`, a new `## Backend (Supabase)`
section in `wiki/build.md`, one `change-log.md` line, and `outputs/backend/<date>-<slug>/GO-LIVE.md` — with
the app still running on mock data until the user does the one go-live step.

## Autonomous invocation (driven by `autopilot`)

When invoked by `autopilot` rather than a human, read `wiki/charter.md` + the built `app/` (its `src/data/`
fixtures) + the confirmed `outputs/autopilot/<date>-<slug>/plan.md`, and **skip your Phase 2 confirm gate**
— `autopilot`'s single plan-confirm already covered it. Scaffold **offline in graceful-off mode** (no keys —
the app ships backend-ready but running on mock data until the human does go-live); do **not** run the
migration, `npm install`, or deploy, and never collect a key. Flag any `(assumed — confirm later)` choice
(inferred relationships, RLS intent) to `autopilot` for its decision ledger, write your `raw/builds/` record
+ `wiki/build.md` section + `change-log.md` line as usual, and surface the `outputs/backend/<date>-<slug>/
GO-LIVE.md` path for `autopilot`'s hand-over. This note is additive — your attended behavior above is
unchanged; `autopilot` is user-initiated and never part of the unattended `maintenance-loop` (that rule is
untouched).
