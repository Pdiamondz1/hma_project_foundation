# build-backend — make your app's data real

`build-app` gives you a themed, working web app in `app/` — but the data is **placeholder** (sample rows
baked into the code). `build-backend` upgrades that same app into a **real-data, backend-ready** app: a real
database, sign-in, and everything wired — so the app actually saves and loads data.

Say **"add a backend"**, **"add real data / sign-in"**, **"make it save data"**, or **`/build-backend`**.

## What it does

It reads your app's own sample data and your charter, then scaffolds — **fully offline, with no keys**:

- **A database schema** (a Supabase migration) with a table per kind of thing in your app, and your sample
  rows loaded as starting data.
- **A data layer that's "graceful-off"** — your app keeps working on its sample data with no setup, and
  switches to the real database **automatically** the moment you add your keys. You can never end up with a
  broken app because you haven't finished setup.
- **Sign-in** (email accounts) — ready, and switched on once your database is live.
- **Tests** and an `.env` template with the two empty slots to fill.

## The one step that's yours: go-live

A real database needs an account and keys that only you can create — so the template **never** enters keys
or publishes for you. When it's done scaffolding, it hands you a short checklist
(`outputs/backend/<date>-<slug>/GO-LIVE.md`):

1. Create a free Supabase project (you get a URL + a key).
2. Run the one migration first — paste the SQL into Supabase (or use the CLI). This creates your tables; it
   runs in the Supabase dashboard, no keys needed.
3. Paste the two values into `app/.env` (they stay on your machine — that file is gitignored).
4. Start the app — it now uses your real database.

Until you add your keys (step 3), the app keeps running on its sample data. Nothing breaks; you flip it to real whenever
you're ready.

## What it is (and isn't) yet

- **Is:** a real, backend-ready app — schema, data layer, sign-in, tests — that goes live with a 5-minute,
  well-marked step.
- **Backend:** Supabase (a free, hosted Postgres). Web app (`app/`) first; phone/extension backends come
  later.
- **Isn't yet:** deployment/hosting, realtime, file uploads, or payments — those are later rungs on
  `docs/PATH-TO-PRODUCTION.md`.

## Safety

Keys live only in `app/.env` (gitignored) — never in chat, never committed. The scaffold is attended (it
asks once before wiring) and **never runs in the unattended maintenance loop**. Your keys, your go-live —
always.
