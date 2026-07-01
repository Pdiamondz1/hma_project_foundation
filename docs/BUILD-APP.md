# Building your app — the `build-app` skill

Once you know *what* you're building (`define-project` → `wiki/charter.md`), that it's *worth*
building (`roast`/`storm-research`), and *how it should look* (`define-design` →
`wiki/design-system.md`), `build-app` turns those into an actual, working **web app** you can open in
a browser — without you having to write or wire up any of it.

> For a **phone app**, see the sibling skill [`build-mobile`](BUILD-MOBILE.md).
> For a **browser extension**, see the sibling skill [`build-plugin`](BUILD-PLUGIN.md).

## What it makes

A new top-level **`app/`** folder: its own small Vite + React + TypeScript + Tailwind project — the
same proven stack as the `aios/` console — themed from your design system, with one screen per item in
your charter's MVP, powered by **mock (placeholder) data**. Run it with `npm run dev` and click around.

It is a **front-end MVP**: the screens, layout, and theme are real; the data is placeholder. There is
no backend, no accounts, and no deployment yet — those are **later tiers** (below).

## How it works

1. **Reads your north-stars** — the charter (your MVP list), the design system (your theme), and the
   latest vetting verdict. A missing charter → it offers `define-project` first; a missing design → it
   uses a clean default and offers `define-design`; a **KILL** verdict stops it unless you say "build
   anyway".
2. **Drafts a short screen list** from your MVP (capped so it can't run away) and shows it to you.
3. **Asks once: "build this?"** — then scaffolds and themes `app/`, with mock data.
4. **Records what it built** — an immutable note in `raw/builds/`, an index page at `wiki/build.md`,
   and a line in the change log.
5. **Hands it to you** — one command to preview it, and an offer to start it for you.

## Where things live

- **`app/`** — your app's code. Like `aios/`, it's a **build target**, not part of the knowledge base —
  so it lives outside the `raw/` / `wiki/` / `outputs/` discipline, and it's yours to edit.
- **`raw/builds/<date>-<slug>.md`** — an immutable record of each build (which screens, which theme,
  which charter + verdict).
- **`wiki/build.md`** — the AI-written index of what's been built, with links back to the records and
  your charter/design.

## Running it (and the two-server note)

```
cd app
npm install      # one time — downloads the building blocks
npm run dev      # opens http://localhost:5174
```

The app runs on a **different port** than the AIOS console (the console is the dashboard onto your
knowledge base; the app is your product), so you can run **both at once**.

## Re-running

Run `build-app` again any time. It won't clobber your work: it diffs your current MVP against what's
built and offers to **add/update screens**, **re-apply the theme** (after you tweak the design
system), or **both** — showing a diff and asking before it overwrites anything you've edited.

## What ships in the template

Only the skill and this doc ship — plus an empty `raw/builds/.gitkeep`. **No `app/` is ever built into
the template itself.** Your `app/` appears only when *you* run `build-app` in your own copy.

## Later tiers (not in v1)

- **Real data, accounts, and deployment** — swap mock data for a real backend (e.g. Supabase), add
  sign-in, and publish. These need keys/services, so they're opt-in tiers beyond the no-keys default.
- **Mobile apps** ([`build-mobile`](BUILD-MOBILE.md)) and **browser extensions**
  ([`build-plugin`](BUILD-PLUGIN.md)) are sibling build skills that ship today; other plugin hosts
  (e.g. a Figma plugin) remain later slices. The build records are written generically so those slot
  in without rework.

## Credit / inspiration

The "scaffold → theme → mock data → verify" flow follows the modern Claude Code build workflow shown
in Chris Raroque's *"How I Build Apps So Fast."*
